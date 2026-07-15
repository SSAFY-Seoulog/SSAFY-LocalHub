<template>
  <div class="chat-page container">
    <section class="chat-main panel">
      <header class="chat-header">
        <div>
          <h2>Seoulog AI 가이드</h2>
          <p class="chat-sub">
            서울 권역 제공 데이터(관광지·문화시설·축제·여행코스·레포츠·숙박·쇼핑)와
            커뮤니티 게시글을 기반으로 답변합니다.
          </p>
        </div>
        <button class="btn ghost" @click="onClear">+ 새로운 대화</button>
      </header>

      <div ref="bodyEl" class="chat-body">
        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="message"
          :class="msg.role"
        >{{ msg.content }}</div>

        <div v-if="isLoading" class="message assistant typing">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>
      </div>

      <p v-if="errorMessage" class="chat-error">{{ errorMessage }}</p>

      <footer class="chat-input">
        <input
          v-model="draft"
          type="text"
          :maxlength="MAX_INPUT_LENGTH"
          placeholder="예) 종로 근처 축제 일정 알려줘 / 게시판에서 연남동 관련 글 찾아줘"
          :disabled="isLoading"
          @keyup.enter="onSend"
        />
        <button class="btn send" :disabled="isLoading || !draft.trim()" @click="onSend">전송</button>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useChat } from '../composables/useChat'

const { messages, isLoading, errorMessage, send, clearHistory, MAX_INPUT_LENGTH } = useChat()

const draft = ref('')
const bodyEl = ref(null)

const scrollToBottom = async () => {
  await nextTick()
  if (bodyEl.value) bodyEl.value.scrollTop = bodyEl.value.scrollHeight
}

watch(() => messages.value.length, scrollToBottom, { immediate: true })
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
.chat-page { padding: 32px 0; }

.chat-main {
  display: flex;
  flex-direction: column;
  padding: 0;
  height: calc(100vh - 180px);
  min-height: 480px;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}
.chat-header h2 { margin: 0; font-size: 1.1rem; }
.chat-sub { margin: 4px 0 0; color: #6b7280; font-size: 13px; }

.btn.ghost {
  background: transparent;
  border: 1px solid #0b74b2;
  color: #0b74b2;
  border-radius: 10px;
  padding: 8px 14px;
  cursor: pointer;
  white-space: nowrap;
}
.btn.ghost:hover { background: rgba(11, 116, 178, 0.06); }

.chat-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #f8fbff;
}
.message {
  max-width: 720px;
  padding: 13px 17px;
  border-radius: 14px;
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
}
.message.assistant { background: #fff; color: #0f1724; align-self: flex-start; }
.message.user { background: #0b74b2; color: #fff; align-self: flex-end; }

.typing { display: flex; gap: 5px; padding: 16px 18px; }
.dot {
  width: 7px;
  height: 7px;
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

.chat-error {
  margin: 0;
  padding: 8px 24px;
  color: #b91c1c;
  font-size: 13px;
  background: #fff5f5;
}

.chat-input {
  display: flex;
  gap: 12px;
  padding: 14px 18px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}
.chat-input input {
  flex: 1;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  font-size: 15px;
}
.chat-input .send {
  min-width: 90px;
  border: none;
  border-radius: 12px;
  background: #0b74b2;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}
.chat-input .send:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 640px) {
  .chat-main { height: calc(100vh - 150px); }
  .chat-header { flex-direction: column; align-items: flex-start; }
}
</style>
