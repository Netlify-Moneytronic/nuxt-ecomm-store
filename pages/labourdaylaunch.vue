<script setup lang="ts">
  import { ref, onMounted } from 'vue';

  import { getProductsQuery } from '../graphql/getProductsQuery';

  useHead({
    title: 'VELOCITY - Labour Day Launch | Athletic Shoe Store',
    meta: [
      {
        name: 'description',
        content:
          'Introducing VELOCITY - The future of running is here. Get early access to our revolutionary running shoe launching this Labour Day.',
      },
      {
        name: 'keywords',
        content: 'velocity, running shoes, athletic shoes, labour day launch, early access',
      },
    ],
  });

  interface ProductNode {
    id: string;
    title: string;
    handle: string;
    priceRange: {
      maxVariantPrice: {
        amount: string;
        currencyCode: string;
      };
    };
    images: {
      edges: Array<{
        node: {
          src: string;
        };
      }>;
    };
  }

  interface QueryData {
    products: {
      edges: Array<{
        node: ProductNode;
      }>;
    };
  }

  const email = ref<string>('');
  const isLoading = ref<boolean>(false);
  const showSuccess = ref<boolean>(false);
  const featuredProduct = ref<ProductNode | null>(null);

  // Get products for the floating shoe image
  const variables = { first: 1 };
  const { data } = await useAsyncQuery<QueryData>(getProductsQuery, variables);

  // Set featured product from query results
  onMounted(() => {
    if (data.value?.products.edges.length) {
      featuredProduct.value = data.value.products.edges[0].node;
    }
  });

  const handleEmailSubmit = async (): Promise<void> => {
    if (!email.value || !isValidEmail(email.value)) {
      return;
    }

    isLoading.value = true;

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    isLoading.value = false;
    showSuccess.value = true;
    email.value = '';

    // Reset success message after 3 seconds
    setTimeout(() => {
      showSuccess.value = false;
    }, 3000);
  };

  const isValidEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };
</script>

<template>
  <div
    class="min-h-screen bg-black text-white flex flex-col items-center justify-center font-system relative overflow-hidden"
  >
    <!-- Animated background particles -->
    <div class="absolute inset-0 overflow-hidden">
      <div
        v-for="i in 50"
        :key="i"
        class="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse"
        :style="{
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          animationDelay: Math.random() * 2 + 's',
          animationDuration: Math.random() * 3 + 2 + 's',
        }"
      />
    </div>

    <!-- Main content -->
    <div class="relative z-10 text-center max-w-4xl mx-auto px-4">
      <!-- Title -->
      <h1
        class="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent"
      >
        VELOCITY
      </h1>

      <!-- Product showcase -->
      <div class="w-72 h-72 md:w-80 md:h-80 mx-auto mb-8 flex items-center justify-center relative">
        <div v-if="featuredProduct?.images.edges.length" class="relative animate-float">
          <NuxtImg
            :src="featuredProduct.images.edges[0].node.src"
            :alt="featuredProduct.title || 'VELOCITY Running Shoe'"
            class="w-64 h-64 md:w-72 md:h-72 object-contain filter drop-shadow-2xl hover:scale-105 transition-transform duration-300"
            format="webp"
            quality="90"
          />
          <div
            class="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl animate-glow"
          />
        </div>

        <!-- Fallback image if no product found -->
        <div v-else class="relative animate-float">
          <img
            src="https://images.contentstack.io/v3/assets/blt9b6df677776ba2fe/blt0a15f70f0303531c/68756dedcb1936be4d371ed2/hoka.png"
            alt="VELOCITY Running Shoe"
            class="w-64 h-64 md:w-72 md:h-72 object-contain filter drop-shadow-2xl hover:scale-105 transition-transform duration-300"
          />
          <div
            class="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl animate-glow"
          />
        </div>
      </div>

      <!-- Subtitle -->
      <p class="text-xl md:text-2xl mb-12 text-gray-400 max-w-2xl mx-auto">
        The future of running is here. Experience revolutionary comfort, speed, and style.
      </p>

      <!-- Email signup form -->
      <div class="flex flex-col sm:flex-row gap-4 items-center justify-center max-w-md mx-auto">
        <input
          v-model="email"
          type="email"
          placeholder="Enter your email"
          class="flex-1 px-6 py-4 rounded-full border border-gray-600 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 w-full sm:w-auto"
          :disabled="isLoading"
          @keyup.enter="handleEmailSubmit"
        />

        <button
          class="px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold cursor-pointer hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 min-w-[180px]"
          :disabled="isLoading || !isValidEmail(email)"
          @click="handleEmailSubmit"
        >
          <span v-if="isLoading" class="flex items-center justify-center">
            <svg
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
          <span v-else>Get Early Access</span>
        </button>
      </div>

      <!-- Success message -->
      <div
        v-if="showSuccess"
        class="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 font-semibold animate-fade-in"
      >
        ✅ Success! You're on the list for early access.
      </div>
    </div>
  </div>
</template>

<style scoped>
  .font-system {
    font-family:
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      sans-serif;
  }

  @keyframes float {
    0%,
    100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @keyframes glow {
    from {
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
    }
    to {
      box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
    }
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .animate-glow {
    animation: glow 2s ease-in-out infinite alternate;
  }

  .animate-fade-in {
    animation: fade-in 0.5s ease-out;
  }
</style>
