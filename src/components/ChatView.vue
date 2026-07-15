<template>
  <div class="chat-page container">
    <aside class="chat-sidebar panel">
      <div class="sidebar-top">
        <button class="btn new-chat">+ 새로운 대화</button>
      </div>
      <ul class="conversations">
        <li class="conv active">
          <div class="conv-title">경복궁 주변 한정식 맛집 추천</div>
          <div class="conv-preview">오늘 오후에 경복궁을 갈 예정인데, 주변에 깔끔한 한정식집 추천해줘</div>
        </li>
        <li class="conv">
          <div class="conv-title">남산 서울타워 야경 명소</div>
          <div class="conv-preview">야경 보기 좋은 카페나 포인트 알려줘</div>
        </li>
        <li class="conv">
          <div class="conv-title">인천공항에서 명동 가는 법</div>
          <div class="conv-preview">교통편 옵션과 소요시간 알려줘</div>
        </li>
      </ul>
    </aside>

    <section class="chat-main panel">
      <header class="chat-header">
        <h2>Seoulog AI 가이드</h2>
      </header>

      <div class="chat-body">
        <div class="message assistant">
          안녕하세요! 서울 여행 가이드 Seoulog AI입니다. 오늘 방문하실 곳이나 궁금한 점이 있으신가요?
        </div>

        <div class="message user">오늘 오후에 경복궁을 갈 예정인데, 주변에 깔끔한 한정식집 추천해줄래? 예산은 인당 3만원 정도야.</div>

        <div class="assistant-suggestions">
          <p class="assistant-note">경복궁 방문을 환영합니다! 인당 3만 원 내외로 즐길 수 있는 깔끔한 한정식 맛집 3곳을 추천해 드릴게요.</p>

          <div class="suggestion-card">
            <img src="https://via.placeholder.com/96x72?text=Photo+1" alt="토속촌 삼계탕" />
            <div class="suggestion-body">
              <h3>토속촌 삼계탕</h3>
              <p class="meta">한정식은 아니지만, 경복궁 근처에서 가장 유명한 보양식 식당입니다. 깔끔한 분위기와 깊은 맛을 자랑합니다.</p>
              <div class="tags">
                <span class="tag">도보 5분</span>
                <span class="tag">예약 추천</span>
              </div>
            </div>
          </div>

          <div class="suggestion-card">
            <img src="https://via.placeholder.com/96x72?text=Photo+2" alt="황생가 갈국수" />
            <div class="suggestion-body">
              <h3>황생가 갈국수 (한정식 세트)</h3>
              <p class="meta">미쉐린 빕구르망에 선정된 곳으로, 정갈한 한정식 코스와 합리적 가격의 세트 메뉴가 인기입니다.</p>
              <div class="tags">
                <span class="tag">주차 불가</span>
                <span class="tag">단체석</span>
              </div>
            </div>
          </div>

          <div class="assistant-hint">더 자세한 위치나 다른 메뉴(예: 한식, 퓨전 한식)를 원하시면 말씀해 주세요!</div>
        </div>
      </div>

      <footer class="chat-input">
        <input v-model="message" type="text" placeholder="메시지를 입력하세요..." @keyup.enter="send" />
        <button class="btn send" @click="send">전송</button>
      </footer>
    </section>
  </div>
</template>

<script>
export default {
  name: 'ChatView',
  data() {
    return {
      message: '',
    };
  },
  methods: {
    send() {
      if (!this.message.trim()) return;
      // 단순 placeholder 동작: 실제 채팅 로직은 백엔드/AI 연동 필요
      this.message = '';
    },
  },
};
</script>

<style scoped>
.chat-page { display: grid; grid-template-columns: 280px 1fr; gap: 20px; padding: 32px 0; }
.chat-sidebar { padding: 18px; height: calc(100vh - 140px); overflow: auto; }
.sidebar-top { display:flex; justify-content: center; margin-bottom: 12px; }
.conversations { list-style: none; padding: 0; margin: 0; }
.conv { padding: 12px; border-radius: 12px; cursor: pointer; margin-bottom: 10px; background: transparent; transition: background .15s; }
.conv:hover { background: rgba(11,116,178,0.04); }
.conv.active { background: rgba(11,116,178,0.08); }
.conv-title { font-weight: 700; color: #0f1724; margin-bottom: 6px; }
.conv-preview { color: #6b7280; font-size: 13px; }

.chat-main { display:flex; flex-direction: column; padding: 0; height: calc(100vh - 140px); }
.chat-header { padding: 20px 24px; border-bottom: 1px solid rgba(15,23,42,0.06); }
.chat-header h2 { margin: 0; font-size: 1.1rem; }

.chat-body { padding: 20px 24px; overflow: auto; flex:1; display:flex; flex-direction:column; gap:16px; }
.message { max-width: 720px; padding: 14px 18px; border-radius: 14px; box-shadow: 0 8px 20px rgba(15,23,42,0.04); }
.message.assistant { background: #f8fbff; color: #0f1724; align-self: flex-start; }
.message.user { background: #0b74b2; color: #fff; align-self: flex-end; }

.assistant-suggestions { display:flex; flex-direction:column; gap:12px; max-width: 820px; }
.assistant-note { margin:0; color:#475569; background:#fff; padding:10px 12px; border-radius:10px; border:1px solid rgba(15,23,42,0.04); }
.suggestion-card { display:flex; gap:12px; background:#fff; border-radius:12px; padding:12px; border:1px solid rgba(15,23,42,0.06); align-items:flex-start; }
.suggestion-card img { width:96px; height:72px; object-fit:cover; border-radius:8px; flex:0 0 96px; }
.suggestion-body h3 { margin:0 0 6px; font-size:1rem; }
.meta { margin:0; color:#6b7280; font-size:14px; }
.tags { margin-top:8px; display:flex; gap:8px; }
.tag { background:#eef6ff; color:#0b74b2; padding:6px 8px; border-radius:999px; font-size:12px; }
.assistant-hint { color:#94a3b8; font-size:13px; }

.chat-input { display:flex; gap:12px; padding:14px 18px; border-top:1px solid rgba(15,23,42,0.06); }
.chat-input input { flex:1; padding:12px 14px; border-radius:12px; border:1px solid rgba(15,23,42,0.06); }
.chat-input .send { min-width:100px; }

@media (max-width: 960px) {
  .chat-page { grid-template-columns: 1fr; }
  .chat-sidebar { display:none; }
}
</style>
