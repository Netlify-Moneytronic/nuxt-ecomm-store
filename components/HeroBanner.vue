<template>
  <section class="relative h-screen flex items-center overflow-hidden">
    <div class="container mx-auto px-4 md:px-6 relative z-10 h-full flex items-center">
      <div class="flex flex-col md:flex-row items-center justify-between gap-8 h-full">
        <!-- Athletes Images -->
        <div class="relative w-full md:w-2/3 flex justify-center items-center h-full py-20">
          <NuxtImg
            src="https://images.contentstack.io/v3/assets/blt9b6df677776ba2fe/blt011e5dcc2888ffd2/67f81e9f22edb05d2c80493a/Man_Running.png"
            alt="Man Running"
            :class="[
              'h-full w-auto object-contain relative z-10 -mr-8 transition-opacity duration-200 ease-in max-w-[45%]',
              { 'opacity-0': !manImageLoaded },
            ]"
            format="webp"
            priority
            preload
            sizes="(max-width: 640px) 45vw, (max-width: 768px) 35vw, 30vw"
            width="320,480,640"
            height="600"
            quality="85"
            loading="eager"
            placeholder
            @load="manImageLoaded = true"
          />
          <NuxtImg
            src="https://images.contentstack.io/v3/assets/blt9b6df677776ba2fe/blt8490ef9609b3ca36/67f81da8c969c96cf4dd50d6/Woman_Running.png"
            alt="Woman Running"
            :class="[
              'h-full w-auto object-contain relative z-20 transition-opacity duration-200 ease-in max-w-[45%]',
              { 'opacity-0': !womanImageLoaded },
            ]"
            format="webp"
            priority
            preload
            sizes="(max-width: 640px) 45vw, (max-width: 768px) 35vw, 30vw"
            width="320,480,640"
            height="600"
            quality="85"
            loading="eager"
            placeholder
            @load="womanImageLoaded = true"
          />
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
  import { ref } from 'vue';

  const manImageLoaded = ref(false);
  const womanImageLoaded = ref(false);
</script>
