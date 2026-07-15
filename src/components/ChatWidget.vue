<template>
  <!-- 플로팅 챗봇 위젯: 모든 페이지 우측 하단에 표시 -->
  <div class="chat-widget">
    <!-- 접힌 상태: 플로팅 버튼 -->
    <button
      v-if="!isOpen"
      class="fab"
      aria-label="Seoulog AI 챗봇 열기"
      @click="isOpen = true"
    >
      💬
      <span class="fab-label">챗봇</span>
    </button>

    <!-- 펼친 상태: 대화창 (모바일에서는 전체 화면) -->
    <div v-else class="chat-panel" role="dialog" aria-label="Seoulog AI 챗봇">
      <header class="panel-header">
        <div class="panel-title">
          <strong>Seoulog AI 가이드</strong>
          <span class="panel-sub">제공 데이터 기반으로 답변합니다</span>
        </div>
        <div class="panel-actions">
          <button class="icon-btn" title="대화 초기화" @click="onClear">↺</button>
          <button class="icon-btn" title="닫기" @click="isOpen = false">✕</button>
        </div>
      </header>

      <div ref="bodyEl" class="panel-body">
        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="bubble"
          :class="msg.role"
        >{{ msg.content }}</div>

        <div v-if="isLoading" class="bubble assistant typing">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>
      </div>

      <p v-if="errorMessage" class="panel-error">{{ errorMessage }}</p>

      <footer class="panel-input">
        <input
          v-model="draft"
          type="text"
          :maxlength="MAX_INPUT_LENGTH"
          placeholder="메시지를 입력하세요"
          :disabled="isLoading"
          @keyup.enter="onSend"
        />
        <button class="send-btn" :disabled="isLoading || !draft.trim()" @click="onSend">
          전송
        </button>
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

const scrollToBottom = async () => {
  await nextTick()
  if (bodyEl.value) bodyEl.value.scrollTop = bodyEl.value.scrollHeight
}

// 새 메시지·창 열림 시 항상 맨 아래로
watch(() => messages.value.length, scrollToBottom)
watch(isOpen, (open) => open && scrollToBottom())
watch(isLoading, scrollToBottom)

const onSend = () => {
  const text = draft.value
  draft.value = ''
  send(text)
}

const onClear = () => {
  if (confirm('대화 내용을 모두 지울까요?')) clearHistory()
}
</script>

<style scoped>
.chat-widget {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1000;
}

/* 플로팅 버튼 */
.fab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 64px;
  height: 64px;
  border: none;
  border-radius: 50%;
  background: #0b74b2;
  color: #fff;
  font-size: 22px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(11, 116, 178, 0.35);
  transition: transform 0.15s;
}
.fab:hover { transform: scale(1.06); }
.fab-label { font-size: 11px; font-weight: 700; }

/* 대화창 */
.chat-panel {
  display: flex;
  flex-direction: column;
  width: 360px;
  height: 520px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 16px 48px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #0b74b2;
  color: #fff;
}
.panel-title { display: flex; flex-direction: column; }
.panel-sub { font-size: 11px; opacity: 0.85; }
.panel-actions { display: flex; gap: 4px; }
.icon-btn {
  border: none;
  background: transparent;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
}
.icon-btn:hover { background: rgba(255, 255, 255, 0.15); }

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f6f9fc;
}
.bubble {
  max-width: 85%;
  padding: 10px 13px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.bubble.assistant {
  align-self: flex-start;
  background: #fff;
  color: #0f1724;
  border: 1px solid rgba(15, 23, 42, 0.06);
}
.bubble.user {
  align-self: flex-end;
  background: #0b74b2;
  color: #fff;
}

/* 로딩 점 애니메이션 */
.typing { display: flex; gap: 4px; padding: 14px 16px; }
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #94a3b8;
  animation: blink 1.2s infinite;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink {
  0%, 80%, 100% { opacity: 0.25; }
  40% { opacity: 1; }
}

.panel-error {
  margin: 0;
  padding: 6px 14px;
  color: #b91c1c;
  font-size: 12px;
  background: #fff5f5;
}

.panel-input {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
}
.panel-input input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
  font-size: 14px;
}
.send-btn {
  border: none;
  border-radius: 10px;
  background: #0b74b2;
  color: #fff;
  font-weight: 700;
  padding: 0 16px;
  cursor: pointer;
}
.send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* 모바일 대응: 전체 화면 */
@media (max-width: 640px) {
  .chat-widget { right: 16px; bottom: 16px; }
  .chat-panel {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    border-radius: 0;
    border: none;
  }
}
</style>
