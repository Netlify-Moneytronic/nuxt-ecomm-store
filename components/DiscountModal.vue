<script setup lang="ts">
  import { ref, onMounted } from 'vue';

  const showModal = ref(false);

  onMounted(() => {
    const dismissed = localStorage.getItem('discountModalDismissed');
    if (!dismissed) {
      showModal.value = true;
    }
  });

  const closeModal = () => {
    localStorage.setItem('discountModalDismissed', 'true');
    showModal.value = false;
  };
</script>

<template>
  <teleport to="body">
    <div
      v-if="showModal"
      data-test="discount-modal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white p-6 rounded-lg shadow-lg relative max-w-md w-full mx-4">
        <button
          aria-label="Close discount modal"
          class="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          @click="closeModal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <h2 class="text-2xl font-bold text-center mb-4">Get 30% Off</h2>
        <p class="text-center mb-4">
          Use code <span class="font-mono bg-gray-100 px-2 py-1 rounded">BFCM30</span> at checkout
          on all products.
        </p>
      </div>
    </div>
  </teleport>
</template>
