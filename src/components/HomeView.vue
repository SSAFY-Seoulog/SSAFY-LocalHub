<template>
  <main class="home-page">
    <section class="hero" aria-labelledby="home-title">
      <img class="hero-image" src="../assets/seoul-hero-v2.png" alt="남산서울타워와 서울의 한옥 지붕이 어우러진 저녁 풍경">
      <div class="hero-shade"></div>
      <div class="container hero-inner">
        <div class="hero-copy">
          <p class="hero-kicker"><span>✈️</span> 오늘의 서울, 여기서 시작해요</p>
          <h1 id="home-title">낯선 서울도<br>내 여행처럼 편안하게</h1>
          <p class="hero-text">관광지부터 로컬 이야기까지 한 번에 찾아보고,<br>AI와 함께 나만의 서울 여행을 완성해 보세요.</p>
          <div class="hero-actions">
            <RouterLink to="/map" class="btn hero-primary">🗺️ 여행지 둘러보기</RouterLink>
            <RouterLink to="/chat" class="btn hero-secondary">✨ AI에게 추천받기</RouterLink>
          </div>
        </div>
        <div class="weather-chip" aria-label="서울 여행 분위기">
          <span class="weather-icon">☀️</span>
          <span><strong>서울 여행하기 좋은 날</strong><small>도심부터 한강까지 가볍게 떠나요</small></span>
        </div>
      </div>
      <div class="floating-sticker sticker-camera" aria-hidden="true">📸</div>
      <div class="floating-sticker sticker-pin" aria-hidden="true">📍</div>
    </section>

    <section class="quick-section">
      <div class="container">
        <div class="quick-bar" aria-label="빠른 여행 메뉴">
          <RouterLink to="/map" class="quick-item">
            <span class="quick-icon blue">🗺️</span>
            <span><strong>여행지도</strong><small>서울 명소를 한눈에</small></span>
            <b aria-hidden="true">›</b>
          </RouterLink>
          <RouterLink to="/chat" class="quick-item">
            <span class="quick-icon yellow">✨</span>
            <span><strong>AI 코스 추천</strong><small>취향에 맞는 여행</small></span>
            <b aria-hidden="true">›</b>
          </RouterLink>
          <RouterLink to="/board" class="quick-item">
            <span class="quick-icon coral">💬</span>
            <span><strong>여행자 이야기</strong><small>생생한 로컬 팁</small></span>
            <b aria-hidden="true">›</b>
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="discover-section">
      <div class="container discover-inner">
        <div class="section-copy">
          <p class="eyebrow">SEOUL, YOUR WAY</p>
          <h2>오늘은 어떤 서울을<br>만나고 싶나요?</h2>
          <p>익숙한 명소도, 골목의 작은 공간도 여행자의 기분에 따라 전혀 다르게 보이니까요.</p>
          <RouterLink to="/map" class="text-link">서울 전체 보기 <span>→</span></RouterLink>
        </div>
        <div class="mood-grid">
          <RouterLink to="/map" class="mood-card mood-blue">
            <span class="mood-emoji">🌊</span><small>천천히 쉬고 싶을 때</small><strong>한강 따라 걷기</strong><span>여의도 · 반포 · 뚝섬</span>
          </RouterLink>
          <RouterLink to="/map" class="mood-card mood-green">
            <span class="mood-emoji">🌿</span><small>초록이 필요한 날</small><strong>서울 숲 여행</strong><span>성수 · 남산 · 북서울</span>
          </RouterLink>
          <RouterLink to="/map" class="mood-card mood-coral">
            <span class="mood-emoji">🏮</span><small>서울의 시간을 따라</small><strong>오래된 동네 산책</strong><span>서촌 · 익선동 · 을지로</span>
          </RouterLink>
          <RouterLink to="/map" class="mood-card mood-yellow">
            <span class="mood-emoji">🍜</span><small>맛있는 게 당길 때</small><strong>로컬 미식 탐험</strong><span>망원 · 광장시장 · 신당</span>
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="ai-section">
      <div class="container ai-band">
        <div class="ai-visual" aria-hidden="true">
          <span class="ai-orbit">✨</span><div class="ai-core">L</div><span class="ai-bubble">이번 주말<br><strong>서울 어디 갈까?</strong></span>
        </div>
        <div class="ai-copy">
          <p class="eyebrow">LOCALHUB AI</p>
          <h2>고민은 줄이고,<br>설레는 여행만 남겨요</h2>
          <p>원하는 분위기와 동네를 말하면 공공데이터와 여행자 이야기를 바탕으로 알맞은 장소를 찾아드려요.</p>
          <RouterLink to="/chat" class="btn">AI 가이드 시작하기</RouterLink>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.home-page { overflow: hidden; background: #fff; }
.hero { position: relative; min-height: 680px; display: flex; align-items: center; isolation: isolate; overflow: hidden; }
.hero-image, .hero-shade { position: absolute; inset: 0; width: 100%; height: 100%; }
.hero-image { object-fit: cover; z-index: -3; }
.hero-shade { z-index: -2; background: linear-gradient(90deg, rgba(10,25,43,.82) 0%, rgba(10,25,43,.56) 43%, rgba(10,25,43,.08) 72%, rgba(10,25,43,.14) 100%); }
.hero-inner { position: relative; min-height: 680px; display: flex; align-items: center; padding-top: 56px; padding-bottom: 100px; }
.hero-copy { color: #fff; max-width: 650px; text-align: left; }
.hero-kicker { display: inline-flex; gap: 8px; align-items: center; margin-bottom: 22px; padding: 8px 12px; border: 1px solid rgba(255,255,255,.25); border-radius: 999px; background: rgba(255,255,255,.13); backdrop-filter: blur(10px); font-size: 14px; font-weight: 750; }
.hero h1 { color: #fff; font-size: 58px; line-height: 1.16; margin: 0 0 22px; font-weight: 850; }
.hero-text { margin: 0 0 34px; color: rgba(255,255,255,.84); font-size: 19px; line-height: 1.7; }
.hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.hero-primary, .hero-secondary { min-height: 54px; padding: 0 23px; }
.hero-secondary { background: rgba(255,255,255,.94); color: #191f28; }
.hero-secondary:hover { background: #fff; color: #191f28; }
.weather-chip { position: absolute; right: 0; bottom: 84px; display: flex; align-items: center; gap: 12px; max-width: 330px; padding: 14px 18px; border: 1px solid rgba(255,255,255,.25); border-radius: 8px; background: rgba(255,255,255,.91); color: #191f28; box-shadow: 0 18px 40px rgba(0,0,0,.18); backdrop-filter: blur(16px); }
.weather-icon { font-size: 28px; }
.weather-chip strong, .weather-chip small { display: block; }
.weather-chip strong { font-size: 14px; }
.weather-chip small { margin-top: 2px; color: #6b7684; font-size: 12px; }
.floating-sticker { position: absolute; display: grid; place-items: center; width: 52px; height: 52px; border: 1px solid rgba(255,255,255,.35); border-radius: 50%; background: rgba(255,255,255,.88); box-shadow: 0 12px 30px rgba(0,0,0,.16); font-size: 25px; animation: float 4s ease-in-out infinite; }
.sticker-camera { top: 140px; right: 9%; }
.sticker-pin { top: 240px; right: 21%; animation-delay: -1.8s; }
@keyframes float { 50% { transform: translateY(-9px) rotate(3deg); } }
.quick-section { position: relative; z-index: 2; margin-top: -52px; }
.quick-bar { display: grid; grid-template-columns: repeat(3, 1fr); padding: 12px; border: 1px solid #e5e8eb; border-radius: 8px; background: #fff; box-shadow: 0 18px 45px rgba(15,23,42,.12); }
.quick-item { display: grid; grid-template-columns: 48px 1fr 18px; align-items: center; gap: 12px; min-height: 82px; padding: 12px 22px; border-right: 1px solid #e5e8eb; transition: background .16s ease; }
.quick-item:last-child { border-right: 0; }
.quick-item:hover { background: #f7f9fc; }
.quick-icon { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 8px; font-size: 23px; }
.quick-icon.blue { background: #eaf3ff; } .quick-icon.yellow { background: #fff6dc; } .quick-icon.coral { background: #fff0ee; }
.quick-item strong, .quick-item small { display: block; }
.quick-item strong { font-size: 15px; } .quick-item small { color: #8b95a1; font-size: 12px; margin-top: 3px; } .quick-item b { color: #b0b8c1; font-size: 24px; font-weight: 400; }
.discover-section { padding: 150px 0 130px; }
.discover-inner { display: grid; grid-template-columns: .78fr 1.4fr; align-items: center; gap: 76px; }
.section-copy h2, .ai-copy h2 { margin: 0 0 20px; font-size: 40px; line-height: 1.3; font-weight: 800; }
.section-copy > p:not(.eyebrow), .ai-copy > p:not(.eyebrow) { color: #6b7684; line-height: 1.75; }
.text-link { display: inline-flex; gap: 8px; margin-top: 22px; color: #3182f6; font-weight: 750; }
.mood-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 14px; }
.mood-card { position: relative; min-height: 205px; padding: 26px; border-radius: 8px; overflow: hidden; transition: transform .18s ease, box-shadow .18s ease; }
.mood-card:hover { transform: translateY(-4px); box-shadow: 0 18px 34px rgba(15,23,42,.12); }
.mood-card small, .mood-card strong, .mood-card > span:last-child { display: block; position: relative; z-index: 1; }
.mood-card small { margin-bottom: 8px; color: #4e5968; font-size: 13px; }
.mood-card strong { margin-bottom: 8px; font-size: 22px; }
.mood-card > span:last-child { color: #6b7684; font-size: 13px; }
.mood-emoji { position: absolute; right: 17px; bottom: 5px; font-size: 68px; transform: rotate(-6deg); filter: drop-shadow(0 8px 10px rgba(0,0,0,.08)); }
.mood-blue { background: #eaf4ff; } .mood-green { background: #eaf9f2; } .mood-coral { background: #fff0ee; } .mood-yellow { background: #fff7de; }
.ai-section { padding: 0 0 130px; }
.ai-band { display: grid; grid-template-columns: 1fr 1fr; align-items: center; min-height: 430px; border-radius: 8px; background: #f2f7ff; overflow: hidden; }
.ai-visual { position: relative; display: grid; place-items: center; min-height: 430px; }
.ai-core { display: grid; place-items: center; width: 150px; height: 150px; border-radius: 50%; background: #3182f6; color: #fff; box-shadow: 0 0 0 28px rgba(49,130,246,.09), 0 25px 50px rgba(49,130,246,.3); font-size: 64px; font-weight: 900; }
.ai-orbit { position: absolute; top: 74px; left: 28%; font-size: 34px; animation: float 3.5s ease-in-out infinite; }
.ai-bubble { position: absolute; right: 8%; bottom: 62px; padding: 13px 17px; border-radius: 8px; background: #fff; box-shadow: 0 12px 28px rgba(15,23,42,.12); color: #4e5968; font-size: 13px; line-height: 1.5; }
.ai-bubble strong { color: #191f28; }
.ai-copy { padding: 60px 70px 60px 20px; }
.ai-copy .btn { margin-top: 24px; }
@media (max-width: 900px) {
  .hero, .hero-inner { min-height: 620px; }
  .hero h1 { font-size: 46px; }
  .sticker-pin { right: 10%; } .weather-chip { right: 20px; }
  .quick-bar { grid-template-columns: 1fr; }
  .quick-item { border-right: 0; border-bottom: 1px solid #e5e8eb; }
  .quick-item:last-child { border-bottom: 0; }
  .discover-inner, .ai-band { grid-template-columns: 1fr; }
  .discover-inner { gap: 46px; }
  .ai-copy { padding: 20px 40px 55px; text-align: center; }
}
@media (max-width: 640px) {
  .hero, .hero-inner { min-height: 590px; }
  .hero-inner { align-items: flex-end; padding-bottom: 95px; }
  .hero-shade { background: linear-gradient(0deg, rgba(10,25,43,.9) 0%, rgba(10,25,43,.54) 64%, rgba(10,25,43,.18) 100%); }
  .hero h1 { font-size: 36px; }
  .hero-text { font-size: 16px; } .hero-text br { display: none; }
  .hero-actions { display: grid; grid-template-columns: 1fr; }
  .hero-actions .btn { width: 100%; }
  .weather-chip, .floating-sticker { display: none; }
  .quick-section { margin-top: -34px; }
  .quick-bar { padding: 8px; }
  .quick-item { min-height: 72px; padding: 9px 12px; }
  .discover-section { padding: 105px 0 90px; }
  .discover-inner { gap: 34px; }
  .section-copy h2, .ai-copy h2 { font-size: 32px; }
  .mood-grid { grid-template-columns: 1fr; }
  .mood-card { min-height: 175px; }
  .ai-section { padding-bottom: 90px; }
  .ai-visual { min-height: 320px; }
  .ai-core { width: 120px; height: 120px; font-size: 52px; }
  .ai-copy { padding: 10px 24px 42px; }
}
</style>