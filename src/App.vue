<script setup>
import { RouterLink, RouterView } from 'vue-router'
import ChatWidget from './components/ChatWidget.vue'
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <div class="container header-inner">
        <div class="brand">Seoulog</div>
        <nav>
          <ul class="site-nav">
            <li><RouterLink to="/">홈</RouterLink></li>
            <li><RouterLink to="/board">게시판</RouterLink></li>
            <li><RouterLink to="/chat">AI 챗봇</RouterLink></li>
            <li><RouterLink to="/map">지도</RouterLink></li>
          </ul>
        </nav>
      </div>
    </header>

    <main class="page-container">
      <RouterView />
    </main>

    <footer class="site-footer">
      <div class="container footer-inner">
        <div>Seoulog</div>
        <div class="footer-links">
          <span>이용약관</span>
          <span>개인정보처리방침</span>
          <span>데이터 출처</span>
          <span>고객센터</span>
        </div>
        <div class="copyright">© 2024 Seoulog. 공공데이터포털 및 서울열린데이터광장 데이터 라이선스를 준수합니다.</div>
      </div>
    </footer>

    <!-- 플로팅 AI 챗봇 위젯 (모든 페이지 공통) -->
    <ChatWidget />
  </div>
</template>
