<template>
  <div class="chat-page" :class="{ embedded }">
    <section class="chat-main">
      <header class="chat-header">
        <div class="chat-heading">
          <span class="guide-avatar" aria-hidden="true">✨</span>
          <div>
            <p class="chat-status">LOCALHUB COURSE AI · 서울 여행 데이터 연결됨</p>
            <h2>서울 여행 코스 플래너</h2>
            <p class="chat-sub">여행 시간, 동행, 지역과 취향을 알려주시면 이동 순서까지 계획해드려요.</p>
          </div>
        </div>
        <button class="new-chat" type="button" @click="onClear" title="새로운 대화">↻ <span>새 대화</span></button>
      </header>

      <div ref="bodyEl" class="chat-body">
        <div v-for="(msg, i) in messages" :key="i" class="message-row" :class="msg.role">
          <span v-if="msg.role === 'assistant'" class="message-avatar">S</span>
          <div class="message" :class="msg.role">{{ msg.content }}</div>
        </div>
        <div v-if="isLoading" class="message-row assistant">
          <span class="message-avatar">S</span>
          <div class="message assistant typing" aria-label="답변 작성 중">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          </div>
        </div>
      </div>

      <p v-if="errorMessage" class="chat-error">{{ errorMessage }}</p>

      <div class="suggestions" aria-label="추천 질문">
        <button type="button" @click="draft = '토요일 오전 10시부터 종로에서 데이트 코스 짜줘'">🏯 종로 데이트 코스</button>
        <button type="button" @click="draft = '비 오는 날 친구와 갈 실내 중심 반나절 코스 짜줘'">☔ 비 오는 날</button>
        <button type="button" @click="draft = '오후 4시부터 시작하는 서울 야경 코스 짜줘'">🌙 서울 야경</button>
      </div>

      <footer class="chat-input">
        <input v-model="draft" type="text" :maxlength="MAX_INPUT_LENGTH" placeholder="누구와 언제, 어떤 서울을 여행하고 싶나요?" :disabled="isLoading" aria-label="AI 코스 플래너에게 질문" @keyup.enter="onSend">
        <button class="send" :disabled="isLoading || !draft.trim()" aria-label="메시지 전송" @click="onSend">↑</button>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useChat } from '../composables/useChat'

const { embedded } = defineProps({ embedded: { type: Boolean, default: false } })
const { messages, isLoading, errorMessage, send, clearHistory, MAX_INPUT_LENGTH } = useChat('trip')
const draft = ref('')
const bodyEl = ref(null)

const scrollToBottom = async () => {
  await nextTick()
  if (bodyEl.value) bodyEl.value.scrollTop = bodyEl.value.scrollHeight
}
watch(() => messages.value.length, scrollToBottom, { immediate: true })
watch(isLoading, scrollToBottom)
const onSend = () => { const text = draft.value; draft.value = ''; send(text) }
const onClear = () => { if (confirm('대화 내용을 모두 지울까요?')) clearHistory() }
</script>

<style scoped>
.chat-page { 
  /* 헤더(68px)와 하단 푸터(약 120px)를 감안해 가용 높이를 타이트하게 조정 */
  height: 100%; 
  display: flex; 
  align-items: center; /* 세로 중앙 정렬로 예쁘게 배치 */
  justify-content: center;
  padding: 140px; /* 기존 상하 패딩(48px, 70px)을 줄여 푸터가 올라올 공간 확보 */
  background: #f2f6fb; 
  box-sizing: border-box;
}
.chat-page.embedded { 
  height: 100%; 
  min-height: 0; 
  padding: 0; 
}
.chat-main { 
  display: flex; 
  flex-direction: column; 
  width: 100%;
  max-width:1000px;         /* 너무 과하게 커지지 않도록 최대 가로 폭 제한 */
  aspect-ratio: 1 / 0.7;      /* 가로세로 1:1 비율을 강제 부여 */
  
  /* 반응형 안전장치: 화면 높이가 작아도 터지지 않게 조절 */
  max-height: calc(100vh - 68px - 140px - 48px);
  min-height: 0; 
  margin: 0 auto; /* 좌우 중앙 정렬 */
  overflow: hidden; 
  border: 1px solid #e5e8eb; 
  border-radius: 8px; 
  background: #fff; 
  box-sizing: border-box;
  box-shadow: 0 18px 45px rgba(15, 23, 42, .1); 
}
.embedded .chat-main { width:100%; height:100%; border:0; border-radius:0; box-shadow:none; }
.chat-header { display:flex; align-items:center; justify-content:space-between; gap:20px; padding:22px 26px; border-bottom:1px solid #e5e8eb; }
.chat-heading { display:flex; align-items:center; gap:14px; min-width:0; }
.guide-avatar { display:grid; place-items:center; flex:0 0 auto; width:48px; height:48px; border-radius:8px; background:#eaf3ff; font-size:24px; }
.chat-status { margin:0 0 3px; color:#3182f6; font-size:10px; font-weight:850; }
.chat-header h2 { margin:0; font-size:19px; }
.chat-sub { margin:4px 0 0; color:#8b95a1; font-size:12px; }
.new-chat { min-height:38px; padding:0 13px; border:1px solid #e5e8eb; border-radius:8px; background:#fff; color:#4e5968; cursor:pointer; font-size:13px; font-weight:700; white-space:nowrap; }
.new-chat:hover { background:#f2f4f6; }
.chat-body { flex:1; display:flex; flex-direction:column; gap:16px; overflow-y:auto; padding:26px; background:#f8fafc; }
.message-row { display:flex; align-items:flex-end; gap:9px; }
.message-row.user { justify-content:flex-end; }
.message-avatar { display:grid; place-items:center; flex:0 0 auto; width:31px; height:31px; border-radius:8px; background:#3182f6; color:#fff; font-size:13px; font-weight:900; }
.message { max-width:min(680px,78%); padding:13px 16px; border-radius:8px; font-size:14px; line-height:1.65; white-space:pre-wrap; word-break:break-word; }
.message.assistant { border:1px solid #e5e8eb; background:#fff; color:#333d4b; box-shadow:0 4px 12px rgba(15,23,42,.04); }
.message.user { background:#3182f6; color:#fff; box-shadow:0 6px 16px rgba(49,130,246,.2); }
.typing { display:flex; gap:5px; }
.dot { width:6px; height:6px; border-radius:50%; background:#8b95a1; animation:blink 1.2s infinite; }
.dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
@keyframes blink { 0%,80%,100%{opacity:.25}40%{opacity:1} }
.chat-error { margin:0; padding:9px 24px; background:#fff1f0; color:#d14343; font-size:12px; }
.suggestions { display:flex; gap:7px; overflow-x:auto; padding:11px 20px 0; background:#fff; scrollbar-width:none; }
.suggestions::-webkit-scrollbar { display:none; }
.suggestions button { flex:0 0 auto; min-height:34px; padding:0 11px; border:1px solid #e5e8eb; border-radius:999px; background:#fff; color:#4e5968; cursor:pointer; font-size:12px; }
.suggestions button:hover { border-color:#9ec5ff; background:#f4f8ff; color:#1b64da; }
.chat-input { display:flex; gap:9px; padding:12px 20px 18px; background:#fff; }
.chat-input input { flex:1; min-width:0; height:48px; padding:0 16px; border:1px solid #d1d6db; border-radius:8px; background:#f9fafb; color:#191f28; }
.chat-input input:focus { border-color:#3182f6; background:#fff; outline:3px solid rgba(49,130,246,.12); }
.send { width:48px; height:48px; border:0; border-radius:8px; background:#3182f6; color:#fff; cursor:pointer; font-size:22px; font-weight:800; }
.send:disabled { background:#d1d6db; cursor:not-allowed; }
@media(max-width:640px) {
  .chat-page { min-height:calc(100vh - 112px); padding:0; }
  .chat-main { height:calc(100vh - 112px); border:0; border-radius:0; box-shadow:none; }
  .chat-header { padding:16px; } .chat-sub { display:none; } .new-chat span { display:none; }
  .chat-body { padding:18px 14px; } .message { max-width:84%; }
  .suggestions { padding-left:14px; padding-right:14px; }
  .chat-input { padding:10px 14px 14px; }
}
</style>