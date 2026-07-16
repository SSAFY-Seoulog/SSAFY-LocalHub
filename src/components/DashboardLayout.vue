<template>
  <main class="dashboard-page">
    <div class="dashboard-toolbar">
      <div>
        <p class="eyebrow">MY LOCALHUB</p>
        <h1>서울 여행을 한눈에 관리해요</h1>
        <p class="dashboard-desc">패널을 끌어 원하는 순서로 배치할 수 있어요.</p>
      </div>
      <button type="button" class="reset-button" @click="resetLayout">↻ <span>레이아웃 초기화</span></button>
    </div>
    <div class="dashboard-notice"><span>💡</span> 지도에서 장소를 찾고, 여행자 이야기와 AI 추천을 한 화면에서 확인하세요.</div>
    <GridLayout v-model:layout="layout" :col-num="12" :row-height="30" :is-draggable="true" :is-resizable="true" :vertical-compact="true" :use-css-transforms="true" :margin="[16, 16]" @layout-updated="onLayoutUpdated">
      <GridItem v-for="item in layout" :key="item.i" :x="item.x" :y="item.y" :w="item.w" :h="item.h" :i="item.i" :min-w="item.minW" :min-h="item.minH">
        <section class="dashboard-panel"><component :is="getComponent(item.i)" embedded /></section>
      </GridItem>
    </GridLayout>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { GridLayout, GridItem } from 'vue-grid-layout-next'
import 'vue-grid-layout-next/dist/style.css'
import MapView from './MapView.vue'
import BoardView from './BoardView.vue'
import ChatView from './ChatView.vue'
const storageKey = 'seoulog_layout'
const defaultLayout = [
  { i: 'map', x: 0, y: 0, w: 7, h: 20, minW: 5, minH: 12 },
  { i: 'board', x: 7, y: 0, w: 5, h: 10, minW: 3, minH: 8 },
  { i: 'chat', x: 7, y: 10, w: 5, h: 10, minW: 3, minH: 8 }
]
function loadLayout() { try { const saved=JSON.parse(localStorage.getItem(storageKey)); if(Array.isArray(saved)&&saved.length===defaultLayout.length)return saved } catch(error){ localStorage.removeItem(storageKey) } return defaultLayout.map(item=>({...item})) }
const layout=ref(loadLayout())
function onLayoutUpdated(newLayout){ layout.value=newLayout; localStorage.setItem(storageKey,JSON.stringify(layout.value)); window.dispatchEvent(new Event('resize')) }
function resetLayout(){ layout.value=defaultLayout.map(item=>({...item})); localStorage.setItem(storageKey,JSON.stringify(layout.value)); window.dispatchEvent(new Event('resize')) }
function getComponent(id){ if(id==='map')return MapView; if(id==='board')return BoardView; if(id==='chat')return ChatView; return null }
</script>

<style scoped>
.dashboard-page { width:100%; max-width:1460px; margin:0 auto; padding:42px 24px 70px; text-align:left; }
.dashboard-toolbar { display:flex; align-items:flex-end; justify-content:space-between; gap:24px; margin-bottom:18px; }
.dashboard-toolbar h1 { margin:0; font-size:34px; line-height:1.25; }
.dashboard-desc { margin:9px 0 0; color:#8b95a1; font-size:14px; }
.reset-button { display:inline-flex; align-items:center; gap:7px; min-height:42px; padding:0 14px; border:1px solid #dfe3e8; border-radius:8px; background:#fff; color:#4e5968; cursor:pointer; font-weight:750; }
.reset-button:hover { background:#f2f4f6; }
.dashboard-notice { display:flex; align-items:center; gap:9px; margin-bottom:6px; padding:12px 15px; border-radius:8px; background:#eaf3ff; color:#4e5968; font-size:13px; }
.dashboard-panel { height:100%; min-height:0; overflow:hidden; border:1px solid #e5e8eb; border-radius:8px; background:#fff; box-shadow:0 8px 24px rgba(15,23,42,.07); }
:global(.vue-grid-layout) { min-height:680px; }
:global(.vue-grid-item) { transition:all .18s ease; }
:global(.vue-grid-item.vue-grid-placeholder) { border-radius:8px; background:#3182f6!important; opacity:.14; }
:global(.vue-grid-item > .vue-resizable-handle) { right:8px; bottom:8px; opacity:.45; }
@media(max-width:900px) { .dashboard-toolbar { align-items:flex-start; flex-direction:column; } }
@media(max-width:640px) { .dashboard-page { padding:28px 12px 50px; } .dashboard-toolbar h1 { font-size:27px; } .dashboard-notice { align-items:flex-start; } .reset-button span { display:none; } }
</style>