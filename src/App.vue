<script setup>
import { RouterLink, RouterView } from 'vue-router'
import ChatWidget from './components/ChatWidget.vue'
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <div class="container header-inner">
        <RouterLink to="/" class="brand" aria-label="LocalHub 홈">
          <span class="brand-mark" aria-hidden="true">L</span>
          <span>LocalHub</span>
        </RouterLink>
        <nav class="site-nav" aria-label="주요 메뉴">
          <RouterLink to="/">홈</RouterLink>
          <RouterLink to="/map">여행지도</RouterLink>
          <RouterLink to="/board">여행톡</RouterLink>
          <RouterLink to="/chat">AI 가이드</RouterLink>
          <RouterLink to="/dashboard">대시보드</RouterLink>
        </nav>
        <RouterLink to="/map" class="header-cta">서울 탐색하기</RouterLink>
      </div>
    </header>

    <main class="page-container"><RouterView /></main>

    <footer class="site-footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <strong>LocalHub</strong>
          <span>서울을 여행하는 가장 쉬운 방법</span>
        </div>
        <div class="footer-links">
          <span>이용약관</span><span>개인정보처리방침</span><span>데이터 출처</span><span>고객센터</span>
        </div>
        <p class="copyright">© 2026 LocalHub. 공공데이터포털 및 서울열린데이터광장 데이터를 활용합니다.</p>
      </div>
    </footer>
    <ChatWidget />
  </div>
</template>