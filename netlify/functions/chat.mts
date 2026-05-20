import type { Config, Context } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "../../db/index.js";
import { chatSessions, chatMessages } from "../../db/schema.js";
import { eq, asc } from "drizzle-orm";

const anthropic = new Anthropic();

async function fetchShopifyProducts(): Promise<string> {
  const endpoint =
    Netlify.env.get("SHOPIFY_STOREFRONT_HOST") ||
    "https://mock-shop-graphql.netlify.app/api/graphql";
  const token =
    Netlify.env.get("SHOPIFY_STOREFRONT_PUBLIC_ACCESS_TOKEN") ||
    "dummy-token-for-development";

  const query = `
    query Products($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            description
            handle
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
  `;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables: { first: 25 } }),
  });

  const data = await response.json();
  const products = data?.data?.products?.edges?.map(
    (edge: { node: Record<string, unknown> }) => edge.node
  );

  if (!products || products.length === 0) {
    return "No products currently available.";
  }

  return products
    .map(
      (p: {
        title: string;
        description: string;
        handle: string;
        priceRange: {
          maxVariantPrice: { amount: string; currencyCode: string };
        };
      }) =>
        `- ${p.title}: ${p.description} | Price: $${parseFloat(p.priceRange.maxVariantPrice.amount).toFixed(2)} ${p.priceRange.maxVariantPrice.currencyCode} | Link: /products/${p.handle}`
    )
    .join("\n");
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { message, sessionId } = await req.json();

  if (!message || !sessionId) {
    return Response.json(
      { error: "message and sessionId are required" },
      { status: 400 }
    );
  }

  const existing = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.sessionId, sessionId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(chatSessions).values({ sessionId });
  }

  await db
    .insert(chatMessages)
    .values({ sessionId, role: "user", content: message });

  const history = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(asc(chatMessages.createdAt));

  const productCatalog = await fetchShopifyProducts();

  const systemPrompt = `You are a helpful shopping assistant for an athletic shoe store. You have access to the store's product catalog below. When customers ask about products, recommend relevant items and include their prices and links. Be friendly, concise, and helpful. If a customer asks about something unrelated to the store, politely guide them back to shopping.

Product Catalog:
${productCatalog}

When recommending products, format links as relative URLs like /products/product-handle so customers can click through. Keep responses brief and conversational.`;

  const messages = history.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: systemPrompt,
    messages,
  });

  const assistantContent =
    response.content[0].type === "text" ? response.content[0].text : "";

  await db
    .insert(chatMessages)
    .values({ sessionId, role: "assistant", content: assistantContent });

  return Response.json({ reply: assistantContent });
};

export const config: Config = {
  path: "/api/chat",
  method: "POST",
};
