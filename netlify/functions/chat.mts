import type { Context } from '@netlify/functions'
import { GoogleGenAI, Type } from '@google/genai'

const SHOPIFY_STOREFRONT_HOST =
  process.env.SHOPIFY_STOREFRONT_HOST || 'https://mock-shop-graphql.netlify.app/api/graphql'
const SHOPIFY_ACCESS_TOKEN =
  process.env.SHOPIFY_STOREFRONT_PUBLIC_ACCESS_TOKEN || ''

async function shopifyQuery(query: string, variables: Record<string, unknown> = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (SHOPIFY_ACCESS_TOKEN) {
    headers['X-Shopify-Storefront-Access-Token'] = SHOPIFY_ACCESS_TOKEN
  }

  const res = await fetch(SHOPIFY_STOREFRONT_HOST, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })
  return res.json()
}

async function searchProducts(searchQuery: string, limit: number = 10) {
  const query = `
    query Products($first: Int!, $query: String) {
      products(first: $first, query: $query) {
        edges {
          node {
            id
            title
            description
            handle
            productType
            priceRange {
              maxVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) {
              edges {
                node {
                  src
                }
              }
            }
          }
        }
      }
    }
  `
  const data = await shopifyQuery(query, {
    first: limit,
    query: searchQuery || null,
  })
  return data?.data?.products?.edges?.map((edge: any) => ({
    id: edge.node.id,
    title: edge.node.title,
    description: edge.node.description,
    handle: edge.node.handle,
    productType: edge.node.productType,
    price: edge.node.priceRange.maxVariantPrice.amount,
    currency: edge.node.priceRange.maxVariantPrice.currencyCode,
    image: edge.node.images.edges[0]?.node?.src || null,
    url: `/products/${edge.node.handle}`,
  })) || []
}

async function getProductDetails(handle: string) {
  const query = `
    query Product($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        description
        productType
        handle
        priceRange {
          maxVariantPrice {
            amount
            currencyCode
          }
        }
        images(first: 3) {
          edges {
            node {
              src
            }
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              price {
                amount
                currencyCode
              }
              availableForSale
            }
          }
        }
      }
    }
  `
  const data = await shopifyQuery(query, { handle })
  const product = data?.data?.productByHandle
  if (!product) return null

  return {
    id: product.id,
    title: product.title,
    description: product.description,
    productType: product.productType,
    handle: product.handle,
    price: product.priceRange.maxVariantPrice.amount,
    currency: product.priceRange.maxVariantPrice.currencyCode,
    images: product.images.edges.map((e: any) => e.node.src),
    url: `/products/${product.handle}`,
    variants: product.variants.edges.map((e: any) => ({
      id: e.node.id,
      title: e.node.title,
      price: e.node.price?.amount,
      available: e.node.availableForSale,
    })),
  }
}

const tools = [
  {
    name: 'search_products',
    description:
      'Search for products in the store catalog. Use this to find products by name, type, category, or keywords. Returns a list of matching products with their titles, prices, descriptions, and links.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description:
            'Search query string to find products. Can include product names, types (e.g. "running shoes"), categories, or descriptive keywords.',
        },
        limit: {
          type: Type.NUMBER,
          description: 'Maximum number of products to return (default: 6, max: 20).',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_product_details',
    description:
      'Get detailed information about a specific product by its handle (URL slug). Use this when a user wants more details about a particular product.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        handle: {
          type: Type.STRING,
          description: 'The product handle (URL slug), e.g. "air-max-90" or "ultraboost-22".',
        },
      },
      required: ['handle'],
    },
  },
  {
    name: 'browse_catalog',
    description:
      'Browse the store catalog and list available products. Use this when the user wants to see what products are available without a specific search query.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.NUMBER,
          description: 'Number of products to show (default: 6).',
        },
      },
    },
  },
]

const SYSTEM_PROMPT = `You are a helpful shopping assistant for an athletic shoe store. Your role is to help customers find the perfect shoes and answer questions about products.

Guidelines:
- Be friendly, concise, and helpful.
- Use the available tools to search for products and get details when customers ask about products.
- When showing products, include relevant details like name, price, and a brief description.
- If a customer's request is vague, ask a clarifying question OR search broadly.
- When you present products, always mention that the customer can click on them to view more details.
- If asked about topics unrelated to the store or products, politely redirect the conversation to shopping.
- Format prices with the currency symbol.
- Keep responses brief — aim for 2-3 sentences plus product information when applicable.`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const ai = new GoogleGenAI({})

    const geminiContents = messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    let response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: geminiContents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: tools }],
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    })

    let maxToolRounds = 5
    const productResults: any[] = []

    while (maxToolRounds > 0) {
      const candidate = response.candidates?.[0]
      const parts = candidate?.content?.parts || []
      const functionCalls = parts.filter((p: any) => p.functionCall)

      if (functionCalls.length === 0) break

      const functionResponses = []

      for (const part of functionCalls) {
        const call = (part as any).functionCall
        const { name, args } = call
        let result: any

        try {
          switch (name) {
            case 'search_products':
              result = await searchProducts(args.query, Math.min(args.limit || 6, 20))
              productResults.push(...result)
              break
            case 'get_product_details':
              result = await getProductDetails(args.handle)
              if (result) productResults.push(result)
              break
            case 'browse_catalog':
              result = await searchProducts('', Math.min(args.limit || 6, 20))
              productResults.push(...result)
              break
            default:
              result = { error: `Unknown function: ${name}` }
          }
        } catch (err: any) {
          result = { error: `Failed to execute ${name}: ${err.message}` }
        }

        functionResponses.push({
          name,
          response: { result },
        })
      }

      geminiContents.push({
        role: 'model',
        parts: parts as any,
      })

      geminiContents.push({
        role: 'user',
        parts: functionResponses.map((fr) => ({
          functionResponse: fr,
        })) as any,
      })

      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: geminiContents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: [{ functionDeclarations: tools }],
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      })

      maxToolRounds--
    }

    const textContent =
      response.candidates?.[0]?.content?.parts
        ?.filter((p: any) => p.text)
        .map((p: any) => p.text)
        .join('') || 'Sorry, I could not generate a response.'

    // Deduplicate products by handle
    const seen = new Set<string>()
    const uniqueProducts = productResults.filter((p) => {
      if (!p.handle || seen.has(p.handle)) return false
      seen.add(p.handle)
      return true
    })

    return new Response(
      JSON.stringify({
        reply: textContent,
        products: uniqueProducts,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (err: any) {
    console.error('Chat function error:', err)
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: err.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}

export const config = {
  path: '/api/chat',
}
