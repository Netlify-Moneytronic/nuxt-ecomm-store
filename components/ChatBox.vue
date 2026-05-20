<template>
  <div class="fixed bottom-4 right-4 z-50">
    <div
      v-if="isOpen"
      class="bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col w-[360px] h-[500px] sm:w-[400px] sm:h-[540px] overflow-hidden"
    >
      <div class="bg-black text-white px-4 py-3 flex items-center justify-between rounded-t-2xl">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-green-400 rounded-full"></div>
          <span class="font-semibold text-sm">Shopping Assistant</span>
        </div>
        <button
          @click="isOpen = false"
          class="text-white/70 hover:text-white transition-colors text-lg leading-none"
          aria-label="Close chat"
        >
          &times;
        </button>
      </div>

      <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-3">
        <div
          v-if="messages.length === 0 && !isLoading"
          class="text-center text-gray-400 text-sm mt-8"
        >
          <p class="text-2xl mb-2">👟</p>
          <p>Hi! Ask me anything about our shoes.</p>
        </div>

        <div
          v-for="(msg, i) in messages"
          :key="i"
          :class="[
            'max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed',
            msg.role === 'user'
              ? 'bg-black text-white ml-auto rounded-br-sm'
              : 'bg-gray-100 text-gray-800 mr-auto rounded-bl-sm',
          ]"
          v-html="msg.role === 'assistant' ? formatMessage(msg.content) : msg.content"
        />

        <div v-if="isLoading" class="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-2xl rounded-bl-sm w-fit">
          <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
          <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
          <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
        </div>
      </div>

      <form @submit.prevent="sendMessage" class="p-3 border-t border-gray-200">
        <div class="flex gap-2">
          <input
            v-model="inputText"
            type="text"
            placeholder="Ask about our shoes..."
            class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:border-black transition-colors"
            :disabled="isLoading"
          />
          <button
            type="submit"
            :disabled="!inputText.trim() || isLoading"
            class="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>

    <button
      v-if="!isOpen"
      @click="isOpen = true"
      class="bg-black text-white w-14 h-14 rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 flex items-center justify-center"
      aria-label="Open chat"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from "vue";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const isOpen = ref(false);
const inputText = ref("");
const messages = ref<ChatMessage[]>([]);
const isLoading = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
const sessionId = ref("");

function getSessionId(): string {
  if (sessionId.value) return sessionId.value;
  const stored =
    typeof window !== "undefined"
      ? localStorage.getItem("chat-session-id")
      : null;
  if (stored) {
    sessionId.value = stored;
    return stored;
  }
  const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  if (typeof window !== "undefined") {
    localStorage.setItem("chat-session-id", id);
  }
  sessionId.value = id;
  return id;
}

function formatMessage(content: string): string {
  let html = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(
    /\[([^\]]+)\]\((\/products\/[^\)]+)\)/g,
    '<a href="$2" class="underline font-medium hover:opacity-70">$1</a>'
  );
  html = html.replace(
    /(?<!href=")(\/products\/[\w-]+)(?!")/g,
    '<a href="$1" class="underline font-medium hover:opacity-70">$1</a>'
  );
  html = html.replace(/\n/g, "<br>");
  return html;
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop =
        messagesContainer.value.scrollHeight;
    }
  });
}

async function loadHistory() {
  const sid = getSessionId();
  try {
    const res = await fetch(`/api/chat-history?sessionId=${sid}`);
    const data = await res.json();
    if (data.messages && data.messages.length > 0) {
      messages.value = data.messages.map(
        (m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })
      );
      scrollToBottom();
    }
  } catch {
    // History load is best-effort
  }
}

async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || isLoading.value) return;

  const sid = getSessionId();
  inputText.value = "";
  messages.value.push({ role: "user", content: text });
  scrollToBottom();

  isLoading.value = true;
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, sessionId: sid }),
    });

    const data = await res.json();
    if (data.reply) {
      messages.value.push({ role: "assistant", content: data.reply });
    } else if (data.error) {
      messages.value.push({
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
      });
    }
  } catch {
    messages.value.push({
      role: "assistant",
      content: "Sorry, I couldn't connect. Please try again.",
    });
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
}

watch(isOpen, (opened) => {
  if (opened) {
    loadHistory();
  }
});
</script>
