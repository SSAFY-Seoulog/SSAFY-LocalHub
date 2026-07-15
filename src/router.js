import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './components/HomeView.vue'
import MapView from './components/MapView.vue'
import BoardView from './components/BoardView.vue'
import ChatView from './components/ChatView.vue'

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/map', name: 'Map', component: MapView },
  { path: '/board', name: 'Board', component: BoardView },
  { path: '/chat', name: 'Chat', component: ChatView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
