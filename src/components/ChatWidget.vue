<template>
  <div class="chat-widget">
    <button v-if="!isOpen" class="fab" aria-label="LocalHub AI 여행 가이드 열기" title="AI 여행 가이드" @click="isOpen = true">
      <span class="fab-spark">✦</span><strong>L</strong><span class="fab-badge">AI</span>
    </button>

    <div v-else class="chat-panel" role="dialog" aria-label="LocalHub AI 여행 가이드">
      <header class="panel-header">
        <div class="panel-brand"><span class="panel-logo">L</span><span><strong>AI 여행 가이드</strong><small><i></i> 지금 바로 물어보세요</small></span></div>
        <div class="panel-actions">
          <button class="icon-btn" title="대화 초기화" aria-label="대화 초기화" @click="onClear">↻</button>
          <button class="icon-btn" title="닫기" aria-label="닫기" @click="isOpen = false">×</button>
        </div>
      </header>
      <div ref="bodyEl" class="panel-body">
        <div v-for="(msg, i) in messages" :key="i" class="bubble" :class="msg.role">{{ msg.content }}</div>
        <div v-if="isLoading" class="bubble assistant typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
      </div>
      <p v-if="errorMessage" class="panel-error">{{ errorMessage }}</p>
      <footer class="panel-input">
        <input v-model="draft" type="text" :maxlength="MAX_INPUT_LENGTH" placeholder="서울 여행을 물어보세요" :disabled="isLoading" @keyup.enter="onSend">
        <button class="send-btn" :disabled="isLoading || !draft.trim()" aria-label="전송" @click="onSend">↑</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useChat } from '../composables/useChat'
const { messages, isLoading, errorMessage, send, clearHistory, MAX_INPUT_LENGTH } = useChat()
const isOpen = ref(false)
const draft = ref('')
const bodyEl = ref(null)
const scrollToBottom = async () => { await nextTick(); if (bodyEl.value) bodyEl.value.scrollTop = bodyEl.value.scrollHeight }
watch(() => messages.value.length, scrollToBottom)
watch(isOpen, open => open && scrollToBottom())
watch(isLoading, scrollToBottom)
const onSend = () => { const text = draft.value; draft.value = ''; send(text) }
const onClear = () => { if (confirm('대화 내용을 모두 지울까요?')) clearHistory() }
</script>

<style scoped>
.chat-widget { position:fixed; right:24px; bottom:24px; z-index:1000; }
.fab { position:relative; display:grid; place-items:center; width:60px; height:60px; border:0; border-radius:50%; background:#3182f6; color:#fff; cursor:pointer; box-shadow:0 12px 28px rgba(49,130,246,.36); transition:transform .16s ease,box-shadow .16s ease; }
.fab:hover { transform:translateY(-3px); box-shadow:0 16px 34px rgba(49,130,246,.42); }
.fab strong { font-size:24px; font-weight:900; }
.fab-spark { position:absolute; top:7px; left:9px; color:#ffdb72; font-size:12px; }
.fab-badge { position:absolute; right:-3px; top:-3px; padding:3px 5px; border:2px solid #fff; border-radius:999px; background:#00a878; font-size:9px; font-weight:900; }
.chat-panel { display:flex; flex-direction:column; width:370px; height:540px; overflow:hidden; border:1px solid #dfe3e8; border-radius:8px; background:#fff; box-shadow:0 24px 60px rgba(15,23,42,.2); }
.panel-header { display:flex; align-items:center; justify-content:space-between; padding:14px 15px; border-bottom:1px solid #e5e8eb; background:#fff; }
.panel-brand { display:flex; align-items:center; gap:10px; }
.panel-logo { display:grid; place-items:center; width:35px; height:35px; border-radius:8px; background:#3182f6; color:#fff; font-weight:900; }
.panel-brand strong,.panel-brand small { display:block; }
.panel-brand strong { font-size:14px; } .panel-brand small { margin-top:2px; color:#8b95a1; font-size:10px; }
.panel-brand i { display:inline-block; width:6px; height:6px; margin-right:4px; border-radius:50%; background:#00a878; }
.panel-actions { display:flex; gap:3px; }
.icon-btn { display:grid; place-items:center; width:33px; height:33px; border:0; border-radius:8px; background:transparent; color:#6b7684; cursor:pointer; font-size:19px; }
.icon-btn:hover { background:#f2f4f6; }
.panel-body { flex:1; display:flex; flex-direction:column; gap:10px; overflow-y:auto; padding:15px; background:#f7f9fc; }
.bubble { max-width:84%; padding:10px 13px; border-radius:8px; font-size:13px; line-height:1.55; white-space:pre-wrap; word-break:break-word; }
.bubble.assistant { align-self:flex-start; border:1px solid #e5e8eb; background:#fff; color:#333d4b; }
.bubble.user { align-self:flex-end; background:#3182f6; color:#fff; }
.typing { display:flex; gap:4px; padding:14px 16px; }
.dot { width:6px; height:6px; border-radius:50%; background:#8b95a1; animation:blink 1.2s infinite; }
.dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
@keyframes blink { 0%,80%,100%{opacity:.25}40%{opacity:1} }
.panel-error { margin:0; padding:7px 14px; background:#fff1f0; color:#d14343; font-size:11px; }
.panel-input { display:flex; gap:8px; padding:11px 12px; border-top:1px solid #e5e8eb; background:#fff; }
.panel-input input { flex:1; min-width:0; height:42px; padding:0 12px; border:1px solid #d1d6db; border-radius:8px; background:#f9fafb; font-size:13px; }
.panel-input input:focus { border-color:#3182f6; outline:2px solid rgba(49,130,246,.12); }
.send-btn { width:42px; height:42px; border:0; border-radius:8px; background:#3182f6; color:#fff; cursor:pointer; font-size:20px; }
.send-btn:disabled { background:#d1d6db; cursor:not-allowed; }
@media(max-width:640px) {
  .chat-widget { right:16px; bottom:16px; }
  .chat-panel { position:fixed; inset:0; width:100%; height:100%; border:0; border-radius:0; }
}
</style>