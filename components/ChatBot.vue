<template>
  <div class="chatbot-container">
    <!-- Chat Toggle Button -->
    <button
      class="chat-toggle"
      :class="{ 'chat-open': isOpen }"
      aria-label="Toggle chat assistant"
      @click="toggleChat"
    >
      <svg
        v-if="!isOpen"
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
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
      <svg
        v-else
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

    <!-- Chat Panel -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-4 scale-95"
    >
      <div v-if="isOpen" class="chat-panel">
        <!-- Header -->
        <div class="chat-header">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span class="font-semibold text-gray-800">Shopping Assistant</span>
          </div>
          <button
            class="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close chat"
            @click="toggleChat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
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
        </div>

        <!-- Messages -->
        <div ref="messagesContainer" class="chat-messages">
          <div
            v-for="(message, index) in displayMessages"
            :key="index"
            class="message-wrapper"
            :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="message-bubble"
              :class="
                message.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-sm'
                  : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
              "
            >
              <p class="whitespace-pre-wrap text-sm">{{ message.content }}</p>
            </div>

            <!-- Product Cards -->
            <div
              v-if="message.products && message.products.length > 0"
              class="product-cards mt-2"
            >
              <NuxtLink
                v-for="product in message.products"
                :key="product.handle"
                :to="product.url"
                class="product-card"
              >
                <img
                  v-if="product.image"
                  :src="product.image"
                  :alt="product.title"
                  class="product-card-image"
                  loading="lazy"
                />
                <div class="product-card-info">
                  <p class="product-card-title">{{ product.title }}</p>
                  <p class="product-card-price">
                    {{ formatPrice(product.price, product.currency) }}
                  </p>
                </div>
              </NuxtLink>
            </div>
          </div>

          <!-- Loading Indicator -->
          <div v-if="isLoading" class="message-wrapper justify-start">
            <div class="message-bubble bg-white text-gray-800 rounded-bl-sm shadow-sm">
              <div class="flex items-center gap-1">
                <div class="typing-dot"></div>
                <div class="typing-dot" style="animation-delay: 0.15s"></div>
                <div class="typing-dot" style="animation-delay: 0.3s"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="chat-input-area">
          <div class="chat-suggestions" v-if="messages.length === 0">
            <button
              v-for="suggestion in suggestions"
              :key="suggestion"
              class="suggestion-chip"
              @click="sendSuggestion(suggestion)"
            >
              {{ suggestion }}
            </button>
          </div>
          <form class="chat-input-form" @submit.prevent="sendMessage">
            <input
              ref="chatInput"
              v-model="inputText"
              type="text"
              placeholder="Ask about our products..."
              class="chat-input"
              :disabled="isLoading"
              @keyup.enter="sendMessage"
            />
            <button
              type="submit"
              class="chat-send-btn"
              :disabled="isLoading || !inputText.trim()"
              aria-label="Send message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, nextTick, computed } from 'vue';

  interface Product {
    title: string;
    handle: string;
    price: string;
    currency: string;
    image: string | null;
    url: string;
    description?: string;
  }

  interface Message {
    role: 'user' | 'assistant';
    content: string;
    products?: Product[];
  }

  const isOpen = ref(false);
  const inputText = ref('');
  const messages = ref<Message[]>([]);
  const isLoading = ref(false);
  const messagesContainer = ref<HTMLElement | null>(null);
  const chatInput = ref<HTMLInputElement | null>(null);

  const suggestions = [
    'Show me your best sellers',
    'I need running shoes',
    'What do you have on sale?',
  ];

  const displayMessages = computed(() => {
    if (messages.value.length === 0) {
      return [
        {
          role: 'assistant' as const,
          content:
            "Hi! I'm your shopping assistant. I can help you find the perfect athletic shoes. What are you looking for today?",
        },
      ];
    }
    return messages.value;
  });

  function formatPrice(amount: string, currency: string = 'USD') {
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(num);
  }

  function toggleChat() {
    isOpen.value = !isOpen.value;
    if (isOpen.value) {
      nextTick(() => {
        chatInput.value?.focus();
        scrollToBottom();
      });
    }
  }

  function scrollToBottom() {
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    });
  }

  function sendSuggestion(text: string) {
    inputText.value = text;
    sendMessage();
  }

  async function sendMessage() {
    const text = inputText.value.trim();
    if (!text || isLoading.value) return;

    messages.value.push({ role: 'user', content: text });
    inputText.value = '';
    isLoading.value = true;
    scrollToBottom();

    try {
      const chatHistory = messages.value.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const data = await res.json();

      messages.value.push({
        role: 'assistant',
        content: data.reply,
        products: data.products || [],
      });
    } catch {
      messages.value.push({
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
      });
    } finally {
      isLoading.value = false;
      scrollToBottom();
    }
  }
</script>

<style scoped>
  .chatbot-container {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 1000;
  }

  .chat-toggle {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
      0 4px 14px rgba(59, 130, 246, 0.4),
      0 2px 6px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }

  .chat-toggle:hover {
    transform: scale(1.05);
    box-shadow:
      0 6px 20px rgba(59, 130, 246, 0.5),
      0 3px 8px rgba(0, 0, 0, 0.15);
  }

  .chat-toggle.chat-open {
    background: #6b7280;
    box-shadow:
      0 4px 14px rgba(107, 114, 128, 0.3),
      0 2px 6px rgba(0, 0, 0, 0.1);
  }

  .chat-panel {
    position: absolute;
    bottom: 70px;
    right: 0;
    width: 380px;
    max-width: calc(100vw - 2rem);
    height: 520px;
    max-height: calc(100vh - 120px);
    background: #f8f9fa;
    border-radius: 16px;
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.15),
      0 8px 20px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .chat-header {
    padding: 1rem 1.25rem;
    background: white;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .chat-messages::-webkit-scrollbar {
    width: 4px;
  }

  .chat-messages::-webkit-scrollbar-track {
    background: transparent;
  }

  .chat-messages::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
  }

  .message-wrapper {
    display: flex;
    flex-direction: column;
    max-width: 85%;
  }

  .message-wrapper.justify-end {
    align-self: flex-end;
    align-items: flex-end;
  }

  .message-wrapper.justify-start {
    align-self: flex-start;
    align-items: flex-start;
  }

  .message-bubble {
    padding: 0.625rem 0.875rem;
    border-radius: 1rem;
    max-width: 100%;
    word-wrap: break-word;
  }

  .product-cards {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }

  .product-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    background: white;
    border-radius: 0.75rem;
    text-decoration: none;
    transition: all 0.15s ease;
    border: 1px solid #e5e7eb;
  }

  .product-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
  }

  .product-card-image {
    width: 48px;
    height: 48px;
    border-radius: 0.5rem;
    object-fit: cover;
    flex-shrink: 0;
    background: #f3f4f6;
  }

  .product-card-info {
    min-width: 0;
    flex: 1;
  }

  .product-card-title {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #1f2937;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .product-card-price {
    font-size: 0.75rem;
    color: #3b82f6;
    font-weight: 500;
  }

  .chat-input-area {
    padding: 0.75rem;
    background: white;
    border-top: 1px solid #e5e7eb;
    flex-shrink: 0;
  }

  .chat-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin-bottom: 0.5rem;
  }

  .suggestion-chip {
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
    border-radius: 1rem;
    border: 1px solid #e5e7eb;
    background: white;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .suggestion-chip:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: #eff6ff;
  }

  .chat-input-form {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .chat-input {
    flex: 1;
    padding: 0.625rem 1rem;
    border-radius: 1.5rem;
    border: 1px solid #e5e7eb;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.15s ease;
    background: #f9fafb;
  }

  .chat-input:focus {
    border-color: #3b82f6;
    background: white;
  }

  .chat-input:disabled {
    opacity: 0.5;
  }

  .chat-send-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s ease;
  }

  .chat-send-btn:hover:not(:disabled) {
    transform: scale(1.05);
  }

  .chat-send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .typing-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #9ca3af;
    animation: typing 1s infinite ease-in-out;
  }

  @keyframes typing {
    0%,
    60%,
    100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-4px);
    }
  }

  @media (max-width: 480px) {
    .chatbot-container {
      bottom: 1rem;
      right: 1rem;
    }

    .chat-panel {
      width: calc(100vw - 2rem);
      height: calc(100vh - 100px);
      bottom: 65px;
      right: -0.5rem;
    }
  }
</style>
