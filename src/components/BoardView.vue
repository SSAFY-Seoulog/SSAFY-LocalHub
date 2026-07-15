<template>
  <div class="board-container">
    <header class="board-header">
      <h2>Seoulog 익명 커뮤니티 (서울 권역)</h2>
      <p class="warning-banner">
        ⚠️ 본 서비스는 교육용으로 개발되었으며, 작성된 데이터는 브라우저(localStorage)에만 저장되며 외부 기기와 공유되지 않습니다.
      </p>
    </header>

    <section v-if="isWriting || isEditing" class="card form-section">
      <h3>{{ isEditing ? '게시글 수정' : '새로운 로컬 정보 공유하기' }}</h3>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>지역 카테고리</label>
          <select v-model="form.category" required class="form-control">
            <option v-for="cat in writeCategories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>닉네임 (익명)</label>
            <input v-model="form.author" type="text" required class="form-control" placeholder="익명닉네임">
          </div>
          <div class="form-group">
            <label>수정/삭제 비밀번호</label>
            <input v-model="form.password" type="password" required class="form-control" placeholder="비밀번호 입력">
          </div>
        </div>

        <div class="form-group">
          <label>제목</label>
          <input v-model="form.title" type="text" required class="form-control" placeholder="제목을 입력하세요.">
        </div>

        <div class="form-group">
          <label>내용</label>
          <textarea v-model="form.content" required class="form-control" rows="6" placeholder="내용을 입력하세요."></textarea>
        </div>

        <div class="button-group">
          <button type="button" @click="cancelWrite" class="btn btn-secondary">취소</button>
          <button type="submit" class="btn btn-primary">{{ isEditing ? '수정 완료' : '등록하기' }}</button>
        </div>
      </form>
    </section>

    <section v-else-if="selectedPost" class="card detail-section">
      <div class="detail-header">
        <span class="badge">{{ selectedPost.category }}</span>
        <h2>{{ selectedPost.title }}</h2>
        <div class="post-meta">
          <span>작성자: <strong>{{ selectedPost.author }}</strong></span>
          <span>작성일: {{ formatDate(selectedPost.createdAt) }}</span>
          <span>조회수: {{ selectedPost.views }}</span>
        </div>
      </div>
      <div class="detail-body">
        <p class="post-content">{{ selectedPost.content }}</p>
      </div>
      <div class="detail-actions">
        <button @click="selectedPost = null" class="btn btn-secondary">목록으로</button>
        <div class="auth-actions">
          <button @click="openAuthModal('edit')" class="btn btn-warning">수정</button>
          <button @click="openAuthModal('delete')" class="btn btn-danger">삭제</button>
        </div>
      </div>
    </section>

    <section v-else>
      <div class="list-controls">
        <div class="filter-group">
          <label for="category-filter">카테고리 필터:</label>
          <select id="category-filter" v-model="selectedCategory" class="form-control inline-select">
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>
        <button @click="startWrite" class="btn btn-primary">✏️ 글쓰기</button>
      </div>

      <div class="table-responsive">
        <table class="post-table">
          <thead>
            <tr>
              <th style="width: 15%">카테고리</th>
              <th style="width: 50%">제목</th>
              <th style="width: 15%">작성자</th>
              <th style="width: 12%">작성일</th>
              <th style="width: 8%">조회</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredPosts.length === 0">
              <td colspan="5" class="no-data">등록된 게시글이 없습니다.</td>
            </tr>
            <tr v-for="post in filteredPosts" :key="post.id" @click="viewPost(post.id)" class="clickable-row">
              <td><span class="badge">{{ post.category }}</span></td>
              <td class="text-left font-semibold">{{ post.title }}</td>
              <td>{{ post.author }}</td>
              <td>{{ formatDate(post.createdAt) }}</td>
              <td>{{ post.views }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="authModal.show" class="modal-backdrop">
      <div class="modal">
        <h3>본인 확인</h3>
        <p>비밀번호를 입력해주세요.</p>
        <div class="form-group">
          <input v-model="authModal.password" type="password" class="form-control" placeholder="비밀번호" @keyup.enter="confirmAuth">
        </div>
        <p v-if="authModal.error" class="error-text">{{ authModal.error }}</p>
        <div class="button-group">
          <button @click="closeAuthModal" class="btn btn-secondary">취소</button>
          <button @click="confirmAuth" class="btn btn-primary">확인</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// 선정 권역 카테고리 (예: 서울 권역 세부 카테고리)
const CATEGORIES = [
  '전체',
  '종로/중구 (도심)',
  '마포/서대문 (서북)',
  '강남/서초 (강남)',
  '성동/광진 (동북)',
  '로컬 꿀팁 공유'
]

function useBoard() {
  // localStorage에서 데이터를 가져오고, 없으면 빈 배열로 초기화
  const posts = ref(JSON.parse(localStorage.getItem('seoulog_posts')) || [
    // 초기 더미 데이터 예시 (최초 접속 시 확인용)
    {
      id: 1,
      category: '마포/서대문 (서북)',
      title: '경의선 숲길 근처 조용한 공유 작업 공간 추천합니다!',
      content: '연남동 끝자락에 있는 조용한 카페인데 익명으로 정보 공유해요. 노트북 작업하기 정말 좋습니다.',
      author: '마포주민',
      password: '1234', // 제약사항에 따른 평문 저장
      createdAt: '2026-07-14T10:00:00.000Z',
      views: 12
    }
  ])

  // 로컬스토리지 자동 저장
  watch(posts, (newPosts) => {
    localStorage.setItem('seoulog_posts', JSON.stringify(newPosts))
  }, { deep: true })

  // 1. Create (작성)
  const createPost = (postData) => {
    const newPost = {
      id: Date.now(), // 고유 ID 시퀀스 대체
      category: postData.category,
      title: postData.title,
      content: postData.content,
      author: postData.author,
      password: postData.password, // 평문 저장
      createdAt: new Date().toISOString(),
      views: 0
    }
    posts.value.unshift(newPost)
    return newPost
  }

  // 2. Read (상세 조회 - 조회수 증가 포함)
  const getPost = (id) => {
    const post = posts.value.find(p => p.id === Number(id))
    if (post) {
      post.views += 1 // 상세 보기 시 조회수 단순 증가
    }
    return post
  }

  // 3. Update (수정 - 비밀번호 검증 포함)
  const updatePost = (id, updatedData, inputPassword) => {
    const index = posts.value.findIndex(p => p.id === Number(id))
    if (index === -1) return { success: false, message: '게시글을 찾을 수 없습니다.' }
    
    // 평문 비밀번호 비교 (제약 준수)
    if (posts.value[index].password !== inputPassword) {
      return { success: false, message: '비밀번호가 일치하지 않습니다.' }
    }

    posts.value[index] = {
      ...posts.value[index],
      category: updatedData.category,
      title: updatedData.title,
      content: updatedData.content,
      author: updatedData.author // 작성자 이름도 수정 허용할 경우
    }
    return { success: true }
  }

  // 4. Delete (삭제 - 비밀번호 검증 포함)
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

// 컴포넌트 로직
const { posts, createPost, getPost, updatePost, deletePost } = useBoard()

const categories = CATEGORIES
const writeCategories = CATEGORIES.filter(cat => cat !== '전체')

const selectedCategory = ref('전체')
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

const filteredPosts = computed(() => {
  if (selectedCategory.value === '전체') return posts.value
  return posts.value.filter(post => post.category === selectedCategory.value)
})

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
.board-container {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  color: #333333;
}
.board-header {
  margin-bottom: 2rem;
  border-bottom: 2px solid #005ea2;
  padding-bottom: 1rem;
}
.warning-banner {
  background-color: #ffebeb;
  color: #ba1a1a;
  border: 1px solid #ffccd0;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
}
.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  text-align: left;
}
.form-group {
  margin-bottom: 1.25rem;
}
.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #717783;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
}
.button-group { display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1rem }
.list-controls { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem }
.post-table { width:100%; border-collapse:collapse }
.post-table th, .post-table td { padding:0.75rem; border-bottom:1px solid #e6eef6 }
.clickable-row { cursor:pointer }
.modal-backdrop { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.4) }
.modal { width:360px; background:#fff; padding:1.25rem; border-radius:8px }
.error-text { color:#b91c1c; margin-top:0.5rem }
</style>
