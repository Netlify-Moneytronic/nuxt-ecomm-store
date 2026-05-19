<script setup lang="ts">
  import { computed } from 'vue';

  import { getProductsQuery } from '../graphql/getProductsQuery';

  useHead({
    title: 'Athletic Shoe Store | High Performance Running Shoes Now Available',
    meta: [
      {
        name: 'description',
        content:
          'Shop our collection of high-performance athletic and running shoes. Find the perfect fit for your active lifestyle.',
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

  const variables = { first: 8 };
  const { data } = await useAsyncQuery<QueryData>(getProductsQuery, variables);

  const formattedProducts = computed(
    () =>
      data.value?.products.edges.map(({ node }) => ({
        id: node.id,
        title: node.title,
        price: parseFloat(node.priceRange.maxVariantPrice.amount),
        image: node.images.edges[0].node.src,
        link: `products/${node.handle}`,
      })) || [],
  );
</script>

<template>
  <div>
    <DiscountModal />
    <HeroBanner />
    <div class="space-y-32 px-8">
      <LazyProductCarousel title="BEST SELLERS" :products="formattedProducts" />
      <LazyShoeFinder />
    </div>
  </div>
</template>
