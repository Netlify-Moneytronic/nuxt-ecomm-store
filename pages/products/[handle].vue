<script setup lang="ts">
  import { computed } from 'vue';
  import { useRoute } from 'vue-router';

  import { createCheckoutMutation } from '~~/graphql/createCheckoutMutation';
  import { getProductQuery } from '~~/graphql/getProductQuery';
  import { getProductsQuery } from '~~/graphql/getProductsQuery';

  definePageMeta({
    name: 'ProductDetailPage',
  });

  const route = useRoute();

  const { data: product } = await useAsyncQuery(getProductQuery, { handle: route.params.handle });
  const price = computed<string>(
    () =>
      `${product.value.productByHandle.priceRange.maxVariantPrice.amount} ${product.value.productByHandle.priceRange.maxVariantPrice.currencyCode}`,
  );
  const { data: related } = await useAsyncQuery(getProductsQuery, {
    first: 8,
    query: `product_type:${product.value.productByHandle.productType}`,
  });

  const formattedRelatedProducts = computed(
    () =>
      related.value?.products.edges.map(({ node }) => ({
        id: node.id,
        title: node.title,
        price: parseFloat(node.priceRange.maxVariantPrice.amount),
        image: node.images.edges[0].node.src,
        link: `/products/${node.handle}`,
      })) || [],
  );

  const redirectToPayment = async (): Promise<void> => {
    const { data } = await useAsyncQuery(createCheckoutMutation, {
      variantId: product.value.productByHandle.variants.edges[0].node.id,
    });

    window.location.href = data.value.checkoutCreate.checkout.webUrl;
  };
</script>

<template>
  <section>
    <div class="grid grid-cols-2 items-center px-20">
      <NuxtImg
        :src="product.productByHandle.images.edges[0].node.src"
        class="rounded-lg shadow-lg -rotate-6 w-full"
        alt="Product Image"
        format="webp"
      />
      <div class="rounded-lg shadow-lg p-12 backdrop-blur-2xl">
        <h2 class="text-4xl font-bold mb-6">{{ product.productByHandle.title }}</h2>
        <p class="text-gray-500 mb-6">
          {{ product.productByHandle.description }}
        </p>

        <button
          class="px-7 py-3 bg-green-600 text-white font-medium text-sm rounded shadow-md hover:bg-green-700 hover:shadow-lg focus:bg-green-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-green-800 active:shadow-lg transition duration-150 ease-in-out"
          @click="redirectToPayment"
        >
          Pay {{ price }}
        </button>
      </div>
    </div>
    <div class="my-20 px-20">
      <LazyProductCarousel title="Related Products" :products="formattedRelatedProducts" />
    </div>
  </section>
</template>
