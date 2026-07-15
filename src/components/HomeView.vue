<template>
  <main class="home-page">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Seoulog</p>
        <h1>서울의 모든 순간, 스마트하게 기록하다</h1>
        <p class="hero-text">신뢰할 수 있는 데이터와 AI 기술을 통해 서울의 숨겨진 매력을 발견하고, 당신만의 특별한 여행을 계획해 보세요.</p>
        <div class="hero-actions">
          <RouterLink to="/map" class="btn">지도 보기</RouterLink>
          <RouterLink to="/chat" class="btn btn-secondary">여정 시작하기</RouterLink>
        </div>
      </div>
    </section>

    <section class="features-section">
      <h2 class="section-title">주요 기능</h2>
      <div class="features">
        <article class="card">
          <div class="card-head">
            <span class="icon icon-blue">📡</span>
            <div>
              <h3>실시간 AI 챗봇</h3>
              <p>날씨, 교통, 맛집 추천까지, 서울에 대한 모든 질문을 AI가 빠르고 정확하게 답합니다.</p>
            </div>
          </div>
        </article>
        <article class="card">
          <div class="card-head">
            <span class="icon icon-green">🗺️</span>
            <div>
              <h3>데이터 기반 지도 시각화</h3>
              <p>혼잡도, 미세먼지 등 공공 데이터를 지도 위에 시각화하여 최적의 경로와 목적지를 안내합니다.</p>
            </div>
          </div>
        </article>
        <article class="card">
          <div class="card-head">
            <span class="icon icon-yellow">💬</span>
            <div>
              <h3>로컬 커뮤니티 게시판</h3>
              <p>현지인들이 공유하는 진짜 핫플과 최신 소식, 서울의 생생한 이야기를 나누어 보세요.</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>
