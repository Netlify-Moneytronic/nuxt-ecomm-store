<template>
  <div class="min-h-screen bg-gradient flex flex-col">
    <SiteHeader />
    <main class="flex-grow px-4 sm:px-6 lg:px-8 pt-24 md:pt-32">
      <slot />
    </main>
    <SiteFooter />
    <ClientOnly>
      <ChatBox />
    </ClientOnly>
  </div>
</template>
