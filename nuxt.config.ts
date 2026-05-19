// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  experimental: {
    payloadExtraction: true,
    renderJsonPayloads: true,
  },

  // nitro: {
  //   prerender: {
  //     crawlLinks: true,
  //   },
  // },

  build: {
    transpile: ['@apollo/client', '@vue/apollo-composable'],
  },

  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'group-product': ['./components/ProductCard.vue', './components/ProductCarousel.vue'],
            'group-hero': ['./components/HeroBanner.vue', './components/ShoeFinder.vue'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    optimizeDeps: {
      include: ['@apollo/client', '@vue/apollo-composable'],
    },
  },
  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      title: 'Athletic Shoe Store',
      titleTemplate: '%s | Athletic Shoe Store',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Shop our collection of high-performance athletic and running shoes.',
        },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
  modules: ['@nuxtjs/tailwindcss', '@nuxt/image', '@nuxtjs/apollo'],

  tailwindcss: {
    viewer: false,
  },

  image: {
    provider: 'netlify',
    domains: ['cdn.shopify.com', 'images.contentstack.io'],
  },

  apollo: {
    clients: {
      default: {
        // Use fallback values for development if environment variables aren't set
        httpEndpoint:
          process.env.SHOPIFY_STOREFRONT_HOST ||
          'https://mock-shop-graphql.netlify.app/api/graphql',
        httpLinkOptions: {
          headers: {
            'X-Shopify-Storefront-Access-Token':
              process.env.SHOPIFY_STOREFRONT_PUBLIC_ACCESS_TOKEN || 'dummy-token-for-development',
          },
        },
      },
    },
  },

  compatibilityDate: '2025-04-06',
});
