<template>
  <main class="board-container" :class="{ embedded }">
    <header class="board-header">
      <div>
        <p class="eyebrow">TRAVELER'S TALK</p>
        <h1>서울 여행자들의 생생한 이야기 💬</h1>
        <p>직접 다녀온 장소와 나만 알고 싶은 서울의 팁을 나눠보세요.</p>
      </div>
      <div class="board-count"><strong>{{ posts.length }}</strong><span>개의 여행 이야기</span></div>
    </header>

    <!-- 🏆 BEST 여행 이야기 (좋아요 상위 3개) - 목록 화면일 때만 노출 -->
    <section v-if="!isWriting && !isEditing && !selectedPost && bestPosts.length > 0" class="best-section">
      <h3 class="best-section-title">🏆 이번 주 BEST 여행 이야기</h3>
      <div class="best-grid">
        <div 
          v-for="(post, index) in bestPosts" 
          :key="post.id" 
          class="best-card"
          @click="viewPost(post.id)"
        >
          <div class="best-badge-wrap">
            <span class="best-rank">BEST {{ index + 1 }}</span>
            <span class="badge">{{ post.category }}</span>
          </div>
          <h4 class="best-title">{{ post.title }}</h4>
          <div class="best-meta">
            <span>{{ post.author }}</span>
            <span class="best-likes">❤️ {{ post.likes || 0 }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 글쓰기 / 수정 폼 -->
    <section v-if="isWriting || isEditing" class="card form-section">
      <div class="form-title">
        <span>✍️</span>
        <div><h2>{{ isEditing ? '여행 이야기 수정' : '새로운 여행 이야기' }}</h2><p>다른 여행자에게 도움이 되는 경험을 들려주세요.</p></div>
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>지역 카테고리</label>
          <select v-model="form.category" required class="form-control">
            <option v-for="cat in writeCategories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group"><label>닉네임</label><input v-model="form.author" type="text" required class="form-control" placeholder="익명 여행자"></div>
          <div class="form-group"><label>수정·삭제 비밀번호</label><input v-model="form.password" type="password" required class="form-control" placeholder="비밀번호 입력"></div>
        </div>
        <div class="form-group"><label>제목</label><input v-model="form.title" type="text" required class="form-control" placeholder="어떤 여행 이야기인가요?"></div>
        <div class="form-group"><label>내용</label><textarea v-model="form.content" required class="form-control" rows="7" placeholder="장소, 시간대, 기억에 남은 점을 자유롭게 적어주세요."></textarea></div>
        <div class="button-group"><button type="button" @click="cancelWrite" class="btn btn-secondary">취소</button><button type="submit" class="btn">{{ isEditing ? '수정 완료' : '이야기 등록' }}</button></div>
      </form>
    </section>

    <!-- 글 상세 보기 -->
    <section v-else-if="selectedPost" class="card detail-section">
      <button class="back-button" type="button" @click="selectedPost = null">← 목록으로</button>
      <div class="detail-header">
        <span class="badge">{{ selectedPost.category }}</span>
        <h1>{{ selectedPost.title }}</h1>
        <div class="post-meta">
          <span>{{ selectedPost.author }}</span>
          <span>{{ formatDate(selectedPost.createdAt) }}</span>
          <span>조회 {{ selectedPost.views }}</span>
          <span class="detail-likes-count">❤️ {{ selectedPost.likes || 0 }}</span>
        </div>
      </div>
      <div class="detail-body"><p class="post-content">{{ selectedPost.content }}</p></div>
      
      <!-- 👍 좋아요 클릭 영역 -->
      <div class="like-button-container">
        <button @click="toggleLike(selectedPost.id)" class="like-btn" :class="{ liked: hasLiked(selectedPost.id) }">
          <span class="heart-icon">{{ hasLiked(selectedPost.id) ? '❤️' : '🤍' }}</span>
          <span>추천하기 {{ selectedPost.likes || 0 }}</span>
        </button>
      </div>

      <div class="detail-actions">
        <span class="detail-note">여행 정보가 도움이 되었나요? 좋은 이야기를 함께 나눠주세요.</span>
        <div><button @click="openAuthModal('edit')" class="action-button">수정</button><button @click="openAuthModal('delete')" class="action-button danger">삭제</button></div>
      </div>
    </section>

    <!-- 글 목록 (리스트) -->
    <section v-else class="board-list">
      <div class="list-controls">
        <div class="filter-group">
          <!-- 🗑️ '지역' label 제거 -->
          <select id="category-filter" v-model="selectedCategory" class="form-control inline-select">
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          
          <!-- 🔍 검색창 추가 -->
          <div class="search-box">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="검색어를 입력하세요 (제목+내용)" 
              class="form-control search-input"
              @keyup.enter="handleSearch"
            >
            <button @click="handleSearch" class="btn search-btn">검색</button>
          </div>
        </div>
      </div>
      
      <div class="table-responsive">
        <table class="post-table">
          <thead><tr><th>지역</th><th>여행 이야기</th><th>작성자</th><th>작성일</th><th>조회</th><th>추천</th></tr></thead>
          <tbody>
            <tr v-if="paginatedPosts.length === 0"><td colspan="6" class="no-data"><span>🧳</span><strong>아직 등록된 이야기가 없어요</strong><small>첫 번째 서울 여행 이야기를 남겨보세요.</small></td></tr>
            <!-- 💡 filteredPosts 대신 10개 단위로 쪼갠 paginatedPosts 출력 -->
            <tr v-for="post in paginatedPosts" :key="post.id" @click="viewPost(post.id)" class="clickable-row">
              <td><span class="badge">{{ post.category }}</span></td>
              <td class="post-title">{{ post.title }}</td>
              <td>{{ post.author }}</td>
              <td>{{ formatDate(post.createdAt) }}</td>
              <td>{{ post.views }}</td>
              <td class="likes-cell">❤️ {{ post.likes || 0 }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 하단 컨트롤 영역 (페이지네이션 + 우측 하단 글쓰기 버튼) -->
      <div class="list-footer">
        <div class="dummy-space"></div>
        
        <div v-if="totalPages > 1" class="pagination-container">
          <button 
            @click="changePage(currentPage - 1)" 
            :disabled="currentPage === 1" 
            class="page-btn arrow"
          >
            &lt;
          </button>

          <button 
            v-for="page in totalPages" 
            :key="page" 
            @click="changePage(page)" 
            :class="['page-btn', { active: currentPage === page }]"
          >
            {{ page }}
          </button>

          <button 
            @click="changePage(currentPage + 1)" 
            :disabled="currentPage === totalPages" 
            class="page-btn arrow"
          >
            &gt;
          </button>
        </div>
        <div v-else class="pagination-container"></div>

        <!-- ✍️ 글쓰기 버튼이 우측 하단으로 이동 -->
        <button @click="startWrite" class="btn write-button"><span>＋</span> 글쓰기</button>
      </div>
    </section>

    <div v-if="authModal.show" class="modal-backdrop" @click.self="closeAuthModal">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div class="modal-icon">🔐</div><h3 id="auth-title">본인 확인</h3><p>작성할 때 사용한 비밀번호를 입력해주세요.</p>
        <div class="form-group"><input v-model="authModal.password" type="password" class="form-control" placeholder="비밀번호" @keyup.enter="confirmAuth"></div>
        <p v-if="authModal.error" class="error-text">{{ authModal.error }}</p>
        <div class="button-group"><button @click="closeAuthModal" class="btn btn-secondary">취소</button><button @click="confirmAuth" class="btn">확인</button></div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const CATEGORIES = [
  '전체',
  '종로/중구 (도심)',
  '마포/서대문 (서북)',
  '강남/서초 (강남)',
  '성동/광진 (동북)',
  '로컬 꿀팁 공유'
]

// 기본 더미 데이터 정의 (좋아요 수 포함)
const DEFAULT_POSTS = [
  { id: 1, category: '종로/중구 (도심)', title: '정동길 근처 직장인 점심 산책코스랑 조용한 테이크아웃 카페', content: '덕수궁 돌담길 따라 정동길까지 걷는 힐링 코스 추천합니다.', author: '정동길산책러', createdAt: '2026-07-15T12:00:00.000Z', views: 5, likes: 25 },
  { id: 2, category: '강남/서초 (강남)', title: '강남역 11번 출구 헬게이트 피하는 신분당선 라인 출구 팁', content: '조금 걷더라도 신분당선 출구 쪽으로 나오면 훨씬 쾌적하게 이동이 가능합니다.', author: '강남역도비', createdAt: '2026-07-15T11:30:00.000Z', views: 21, likes: 88 },
  { id: 3, category: '성동/광진 (동북)', title: '뚝섬역 서울숲 뒤편 조용하게 노트북 작업하기 좋은 카페 공유', content: '조용하고 콘센트도 넉넉한 숨겨진 보석 같은 작업 카페입니다.', author: '성수동주민', createdAt: '2026-07-15T11:00:00.000Z', views: 14, likes: 43 },
  { id: 4, category: '마포/서대문 (서북)', title: '홍대입구역 경의선 책거리 산책길 조용한 벤치 명당 위치', content: '책거리 끝자락 숲길 근처 벤치가 정말 힐링하기 좋습니다.', author: '경의선단골', createdAt: '2026-07-15T10:45:00.000Z', views: 11, likes: 5 },
  { id: 5, category: '종로/중구 (도심)', title: '을지로3가 인쇄소 골목 숨겨진 LP바 솔직 후기 (익명 공유)', content: '어두컴컴하지만 분위기 하나만큼은 서울 원탑인 아날로그 LP 바입니다.', author: '힙지로탐험가', createdAt: '2026-07-15T10:15:00.000Z', views: 33, likes: 54 },
  { id: 6, category: '강남/서초 (강남)', title: '양재천 메타세쿼이아길 주차 및 무료 산책 꿀팁', content: '공영주차장 이용 팁과 나무 그늘 아래서 산책하기 가장 완벽한 코스 소개합니다.', author: '양재천스나이퍼', createdAt: '2026-07-15T09:30:00.000Z', views: 19, likes: 12 },
  { id: 7, category: '성동/광진 (동북)', title: '건대입구역 먹자골목 너무 시끄러울 때 피신하는 자양동 이자카야', content: '화려하진 않지만 정갈한 꼬치구이와 조용히 도란도란 대화하기 좋은 곳입니다.', author: '건대화석', createdAt: '2026-07-15T09:00:00.000Z', views: 25, likes: 18 },
  { id: 8, category: '마포/서대문 (서북)', title: '경의선 숲길 근처 조용한 공유 작업 공간 추천합니다!', content: '커피 한 잔 가격에 무선인터넷과 조용한 공간을 사용할 수 있는 멋진 장소예요.', author: '마포주민', createdAt: '2026-07-15T08:00:00.000Z', views: 13, likes: 2 },
  { id: 9, category: '종로/중구 (도심)', title: '삼청동 수제비 대기 없이 먹는 애매한 시간대 공유', content: '오후 3시 반에서 4시 반 사이에 가시면 대기 없이 바로 따뜻한 수제비를 맛보실 수 있어요.', author: '삼청동러버', createdAt: '2026-07-14T17:00:00.000Z', views: 42, likes: 72 },
  { id: 10, category: '강남/서초 (강남)', title: '반포 한강공원 잠수교 보행 편하게 건너는 시간대 추천', content: '노을 지는 시간에 맞춰 걸어가면 정말 끝내주는 서울 야경과 대교 분수를 감상할 수 있습니다.', author: '서초바람', createdAt: '2026-07-14T16:00:00.000Z', views: 22, likes: 61 },
  { id: 11, category: '성동/광진 (동북)', title: '성수동 팝업스토어 대기 걸어놓고 시간 때우기 좋은 틈새 공간', content: '주변 소품샵과 숨은 갤러리들을 통해 대기 시간을 가치 있게 보내보세요.', author: '팝업러', createdAt: '2026-07-14T15:00:00.000Z', views: 15, likes: 14 },
  { id: 12, category: '마포/서대문 (서북)', title: '경의선 숲길 근처 조용한 공유 작업 공간 추천합니다!', content: '숲길 산책 후 들르기 좋은 조용한 공유 오피스 스타일 북카페입니다.', author: '마포주민', createdAt: '2026-07-14T14:00:00.000Z', views: 13, likes: 9 }
]

function useBoard() {
  const posts = ref(JSON.parse(localStorage.getItem('seoulog_posts')) || DEFAULT_POSTS)

  watch(posts, (newPosts) => {
    localStorage.setItem('seoulog_posts', JSON.stringify(newPosts))
  }, { deep: true })

  const createPost = (postData) => {
    const newPost = {
      id: Date.now(),
      category: postData.category,
      title: postData.title,
      content: postData.content,
      author: postData.author,
      password: postData.password,
      createdAt: new Date().toISOString(),
      views: 0,
      likes: 0 // 좋아요 기본값
    }
    posts.value.unshift(newPost)
    return newPost
  }

  const getPost = (id) => {
    const post = posts.value.find(p => p.id === Number(id))
    if (post) {
      post.views += 1
    }
    return post
  }

  const updatePost = (id, updatedData, inputPassword) => {
    const index = posts.value.findIndex(p => p.id === Number(id))
    if (index === -1) return { success: false, message: '게시글을 찾을 수 없습니다.' }
    
    if (posts.value[index].password !== inputPassword) {
      return { success: false, message: '비밀번호가 일치하지 않습니다.' }
    }

    posts.value[index] = {
      ...posts.value[index],
      category: updatedData.category,
      title: updatedData.title,
      content: updatedData.content,
      author: updatedData.author
    }
    return { success: true }
  }

  const deletePost = (id, inputPassword) => {
    const index = posts.value.findIndex(p => p.id === Number(id))
    if (index === -1) return { success: false, message: '게시글을 찾을 수 없습니다.' }

    if (posts.value[index].password !== inputPassword) {
      return { success: false, message: '비밀번호가 일치하지 않습니다.' }
    }

    posts.value.splice(index, 1)
    return { success: true }
  }

  return {
    posts,
    createPost,
    getPost,
    updatePost,
    deletePost
  }
}

const { posts, createPost, getPost, updatePost, deletePost } = useBoard()

const categories = CATEGORIES
const writeCategories = CATEGORIES.filter(cat => cat !== '전체')

const selectedCategory = ref('전체')
const searchQuery = ref('')         // 실제 입력 바인딩 값
const activeSearchQuery = ref('')   // 검색 버튼을 누르거나 엔터를 쳤을 때 실제 적용되는 검색 필터값
const selectedPost = ref(null)
const isWriting = ref(false)
const isEditing = ref(false)
const form = ref({
  category: writeCategories[0],
  title: '',
  content: '',
  author: '',
  password: ''
})

const authModal = ref({
  show: false,
  type: '',
  password: '',
  error: ''
})

// 로컬 스토리지에 유저가 누른 좋아요 기록 보관 (중복 방지용)
const userLikedPosts = ref(JSON.parse(localStorage.getItem('seoulog_user_liked')) || [])
watch(userLikedPosts, (newList) => {
  localStorage.setItem('seoulog_user_liked', JSON.stringify(newList))
}, { deep: true })

const hasLiked = (postId) => userLikedPosts.value.includes(postId)

const toggleLike = (postId) => {
  const post = posts.value.find(p => p.id === Number(postId))
  if (!post) return

  if (hasLiked(postId)) {
    // 좋아요 취소
    post.likes = Math.max(0, (post.likes || 1) - 1)
    userLikedPosts.value = userLikedPosts.value.filter(id => id !== postId)
  } else {
    // 좋아요 추가
    post.likes = (post.likes || 0) + 1
    userLikedPosts.value.push(postId)
  }
}

// 🏆 BEST 3 게시글 계산 (좋아요 내림차순 상위 3개)
const bestPosts = computed(() => {
  return [...posts.value]
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, 3)
})

// 카테고리 필터링 + 검색어 필터링 통합 적용
const filteredPosts = computed(() => {
  let result = posts.value

  if (selectedCategory.value !== '전체') {
    result = result.filter(post => post.category === selectedCategory.value)
  }

  if (activeSearchQuery.value.trim() !== '') {
    const q = activeSearchQuery.value.toLowerCase()
    result = result.filter(post => 
      post.title.toLowerCase().includes(q) || 
      post.content.toLowerCase().includes(q)
    )
  }

  return result
})

// ==========================================
// 💡 페이지네이션 관련 상태 변수 (10개 노출 정밀 조정)
// ==========================================
const currentPage = ref(1)      // 현재 페이지 번호
const postsPerPage = 10         // 한 페이지에 보여줄 게시글 수 (10개 고정)

// 카테고리가 바뀌거나 검색어가 바뀌면 페이지 번호를 1로 초기화해 줍니다.
watch([selectedCategory, activeSearchQuery], () => {
  currentPage.value = 1
})

// 전체 페이지 수 계산
const totalPages = computed(() => {
  return Math.ceil(filteredPosts.value.length / postsPerPage) || 1
})

// 현재 페이지에 해당하는 '10개의 게시글'만 쏙 잘라내서 테이블에 반환
const paginatedPosts = computed(() => {
  const startIndex = (currentPage.value - 1) * postsPerPage
  const endIndex = startIndex + postsPerPage
  return filteredPosts.value.slice(startIndex, endIndex)
})

// 페이지 이동 처리 함수
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// 검색 실행 함수
const handleSearch = () => {
  activeSearchQuery.value = searchQuery.value
}

const resetForm = () => {
  form.value = {
    category: writeCategories[0],
    title: '',
    content: '',
    author: '',
    password: ''
  }
}

const startWrite = () => {
  resetForm()
  isWriting.value = true
}

const cancelWrite = () => {
  isWriting.value = false
  isEditing.value = false
  resetForm()
}

const handleSubmit = () => {
  if (isEditing.value) {
    const res = updatePost(selectedPost.value.id, form.value, form.value.password)
    if (res.success) {
      selectedPost.value = getPost(selectedPost.value.id)
      isEditing.value = false
      resetForm()
    } else {
      alert(res.message)
    }
  } else {
    createPost(form.value)
    isWriting.value = false
    resetForm()
  }
}

const viewPost = (id) => {
  selectedPost.value = getPost(id)
}

const openAuthModal = (type) => {
  authModal.value = {
    show: true,
    type,
    password: '',
    error: ''
  }
}

const closeAuthModal = () => {
  authModal.value.show = false
}

const confirmAuth = () => {
  const targetPassword = selectedPost.value.password
  if (authModal.value.password !== targetPassword) {
    authModal.value.error = '비밀번호가 올바르지 않습니다.'
    return
  }

  const type = authModal.value.type
  const id = selectedPost.value.id
  const inputPwd = authModal.value.password

  closeAuthModal()

  if (type === 'edit') {
    form.value = {
      category: selectedPost.value.category,
      title: selectedPost.value.title,
      content: selectedPost.value.content,
      author: selectedPost.value.author,
      password: selectedPost.value.password
    }
    isEditing.value = true
  } else if (type === 'delete') {
    const res = deletePost(id, inputPwd)
    if (res.success) {
      alert('게시글이 삭제되었습니다.')
      selectedPost.value = null
    } else {
      alert(res.message)
    }
  }
}

const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.board-container { width:min(1180px,calc(100% - 40px)); min-height:calc(100vh - 68px); margin:0 auto; padding:54px 0 80px; color:#333d4b; text-align:left; }
.board-container.embedded { width:100%; height:100%; min-height:0; padding:16px; overflow:auto; }
.board-header { display:flex; align-items:flex-end; justify-content:space-between; gap:24px; margin-bottom:30px; }
.board-header h1 { margin:0 0 10px; font-size:34px; line-height:1.3; }
.board-header > div > p:last-child { margin:0; color:#8b95a1; font-size:14px; }
.board-count { flex:0 0 auto; min-width:150px; padding:15px 18px; border-radius:8px; background:#eaf3ff; text-align:center; }
.board-count strong,.board-count span { display:block; } .board-count strong { color:#3182f6; font-size:24px; } .board-count span { color:#6b7684; font-size:11px; }
.embedded .board-header { margin-bottom:14px; } .embedded .board-header h1 { font-size:20px; } .embedded .board-header > div > p:last-child,.embedded .board-count { display:none; }

/* 🏆 BEST 게시글 섹션 스타일 */
.best-section { margin-bottom: 36px; }
.best-section-title { font-size: 18px; font-weight: 800; color: #191f28; margin: 0 0 16px 0; display: flex; align-items: center; gap: 6px; }
.best-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.best-card { padding: 20px; background: #ffffff; border: 1px solid #e5e8eb; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
.best-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(49, 130, 246, 0.08); border-color: #3182f6; }
.best-badge-wrap { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; }
.best-rank { font-size: 11px; font-weight: 800; color: #ff4d4f; background: #fff1f0; padding: 2px 8px; border-radius: 4px; }
.best-title { margin: 0 0 12px 0; font-size: 15px; font-weight: 750; color: #191f28; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4; height: 42px; }
.best-meta { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #8b95a1; }
.best-likes { font-weight: 700; color: #ff4d4f; }

.card { padding:30px; }
.form-section,.detail-section { max-width:900px; margin:0 auto; }
.form-title { display:flex; align-items:center; gap:14px; margin-bottom:26px; padding-bottom:22px; border-bottom:1px solid #e5e8eb; }
.form-title > span { display:grid; place-items:center; width:48px; height:48px; border-radius:8px; background:#fff6dc; font-size:24px; }
.form-title h2 { margin:0; font-size:22px; } .form-title p { margin:5px 0 0; color:#8b95a1; font-size:13px; }
.form-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.form-group { margin-bottom:18px; }
.form-group label { display:block; margin-bottom:7px; color:#4e5968; font-size:13px; font-weight:750; }
.form-control { width:100%; min-height:46px; padding:0 13px; border:1px solid #d1d6db; border-radius:8px; background:#fff; color:#191f28; }
textarea.form-control { min-height:150px; padding:13px; resize:vertical; line-height:1.6; }
.form-control:focus { border-color:#3182f6; outline:3px solid rgba(49,130,246,.12); }
.button-group { display:flex; justify-content:flex-end; gap:9px; margin-top:8px; }

/* 🔍 필터 & 검색 영역 레이아웃 조정 */
/* 🔍 필터 & 검색 영역 레이아웃 조정 */
.list-controls { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  margin-bottom: 20px; 
}

.filter-group { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  width: 100%; 
} 

.inline-select { 
  width: auto; 
  min-width: 180px; 
  flex-shrink: 0; 
}

/* 💡 margin-left: auto를 주어 검색창을 전체 레이아웃 우측 끝으로 밀어냅니다. */
.search-box { 
  display: flex; 
  gap: 8px; 
  width: 100%; 
  max-width: 500px; 
  margin-left: auto; 
}

.search-input { 
  min-height: 46px; 
  flex-grow: 1; /* 검색창이 주어진 max-width 내에서 꽉 차도록 설정 */
}

.search-btn { 
  flex-shrink: 0; 
  padding: 0 18px; 
  background: #4e5968; 
  color: #fff; 
  border: 0; 
  border-radius: 8px; 
  font-weight: 700; 
  cursor: pointer; 
  transition: background 0.15s; 
}
.search-btn:hover { 
  background: #333d4b; 
}

/* 🗳️ 글 목록 테이블 및 페이징 하단 바 조정 */
.table-responsive { overflow:hidden; border:1px solid #e5e8eb; border-radius:8px; background:#fff; box-shadow:0 5px 18px rgba(15,23,42,.05); }
.post-table { width:100%; border-collapse:collapse; table-layout:fixed; }
.post-table th { padding:14px 16px; border-bottom:1px solid #e5e8eb; background:#f7f8fa; color:#8b95a1; font-size:11px; text-align:left; }
.post-table td { padding:16px; border-bottom:1px solid #edf0f2; color:#6b7684; font-size:13px; }
.post-table tr:last-child td { border-bottom:0; }
.post-table th:nth-child(1){width:18%}.post-table th:nth-child(2){width:42%}.post-table th:nth-child(3){width:12%}.post-table th:nth-child(4){width:12%}.post-table th:nth-child(5){width:8%}.post-table th:nth-child(6){width:8%}
.clickable-row { cursor:pointer; transition:background .15s ease; } .clickable-row:hover { background:#f4f8ff; }
.post-title { overflow:hidden; color:#191f28!important; font-size:14px!important; font-weight:750; text-overflow:ellipsis; white-space:nowrap; }
.badge { display:inline-flex; align-items:center; min-height:27px; max-width:100%; padding:0 9px; overflow:hidden; border-radius:6px; background:#eaf3ff; color:#3182f6; font-size:10px; font-weight:800; text-overflow:ellipsis; white-space:nowrap; }
.likes-cell { color: #ff4d4f !important; font-weight: 700; }
.no-data { height:280px; text-align:center; } .no-data span,.no-data strong,.no-data small { display:block; } .no-data span { margin-bottom:13px; font-size:38px; } .no-data strong { color:#333d4b; font-size:16px; } .no-data small { margin-top:6px; color:#8b95a1; }

/* 🧭 우측 하단 글쓰기 배치용 푸터 레이아웃 */
.list-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; gap: 16px; position: relative; }
.dummy-space { width: 120px; flex-shrink: 0; } /* 좌측 여백을 줘서 페이지네이션을 중앙 정렬 */
.pagination-container { display: flex; justify-content: center; gap: 4px; flex-grow: 1; }
.page-btn { display: flex; align-items: center; justify-content: center; min-width: 34px; height: 34px; padding: 0 6px; border: 1px solid #e5e8eb; border-radius: 6px; background: #fff; color: #4e5968; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
.page-btn:hover:not(:disabled) { background: #f2f4f6; border-color: #cbd5e1; }
.page-btn.active { background: #3182f6; border-color: #3182f6; color: #fff; }
.page-btn:disabled { color: #ccc; cursor: not-allowed; border-color: #f2f4f6; }
.write-button { flex-shrink: 0; min-width: 120px; height: 44px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; background: #3182f6; color: #fff; border: 0; border-radius: 8px; font-weight: 700; cursor: pointer; }
.write-button:hover { background: #1b64da; }
.write-button span { font-size:19px; font-weight:400; }

/* 🤍 / ❤️ 추천 기능 스타일 */
.like-button-container { display: flex; justify-content: center; margin: 24px 0 36px; }
.like-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border: 1px solid #e5e8eb; border-radius: 30px; background: #fff; color: #4e5968; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 10px rgba(0,0,0,0.03); }
.like-btn:hover { background: #fff1f0; border-color: #ff4d4f; color: #ff4d4f; transform: scale(1.03); }
.like-btn.liked { background: #fff1f0; border-color: #ff4d4f; color: #ff4d4f; }
.like-btn .heart-icon { font-size: 18px; }

.back-button { margin-bottom:23px; padding:0; border:0; background:transparent; color:#6b7684; cursor:pointer; font-weight:750; }
.detail-header { padding-bottom:25px; border-bottom:1px solid #e5e8eb; }
.detail-header h1 { margin:13px 0 15px; font-size:29px; }
.post-meta { display:flex; flex-wrap:wrap; gap:8px 18px; color:#8b95a1; font-size:12px; align-items: center; }
.detail-likes-count { color: #ff4d4f; font-weight: 700; }
.detail-body { min-height:240px; padding:32px 0; }
.post-content { margin:0; color:#333d4b; line-height:1.85; white-space:pre-wrap; }
.detail-actions { display:flex; align-items:center; justify-content:space-between; gap:20px; padding-top:18px; border-top:1px solid #e5e8eb; }
.detail-note { color:#8b95a1; font-size:12px; } .detail-actions > div { display:flex; gap:7px; }
.action-button { padding:7px 10px; border:0; border-radius:6px; background:#f2f4f6; color:#4e5968; cursor:pointer; font-size:12px; font-weight:700; }
.action-button.danger { color:#d14343; }
.modal-backdrop { position:fixed; inset:0; z-index:1200; display:flex; align-items:center; justify-content:center; padding:20px; background:rgba(25,31,40,.56); backdrop-filter:blur(3px); }
.modal { width:min(380px,100%); padding:28px; border-radius:8px; background:#fff; box-shadow:0 24px 60px rgba(0,0,0,.22); text-align:center; }
.modal-icon { font-size:30px; } .modal h3 { margin:12px 0 7px; } .modal > p { color:#8b95a1; font-size:13px; } .modal .form-group { margin-top:20px; }
.error-text { color:#d14343!important; }

@media(max-width:720px) {
  .board-container { width:min(100% - 32px,1180px); padding:34px 0 60px; }
  .board-header { align-items:flex-start; } .board-header h1 { font-size:27px; } .board-count { display:none; }
  .best-grid { grid-template-columns: 1fr; gap: 12px; }
  .form-row { grid-template-columns:1fr; } .card { padding:20px; }
  .post-table th:nth-child(3),.post-table th:nth-child(4),.post-table th:nth-child(5),.post-table th:nth-child(6),
  .post-table td:nth-child(3),.post-table td:nth-child(4),.post-table td:nth-child(5),.post-table td:nth-child(6) { display:none; }
  .post-table th:nth-child(1){width:34%}.post-table th:nth-child(2){width:66%}
  .post-table th,.post-table td { padding:13px 11px; }
  .list-controls { align-items:stretch; flex-direction: column; } 
  .filter-group { flex-direction: column; align-items: stretch; gap: 8px; } .filter-group label { display:none; } .inline-select { min-width:0; }
  .search-box { max-width: 100%; }
  .list-footer { flex-direction: column-reverse; gap: 16px; align-items: center; }
  .dummy-space { display: none; }
  .write-button { width: 100%; }
  .detail-header h1 { font-size:24px; } .detail-actions { align-items:flex-start; flex-direction:column; }
  @media(max-width:720px) {
  /* ... 기존 모바일 코드 ... */
  .list-controls { align-items: stretch; flex-direction: column; } 
  .filter-group { flex-direction: column; align-items: stretch; gap: 8px; } 
  .inline-select { min-width: 0; width: 100%; }
  .search-box { max-width: 100%; margin-left: 0; } /* 모바일에서는 가로 100% 채움 */
}
}
</style>