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

    <section v-else-if="selectedPost" class="card detail-section">
      <button class="back-button" type="button" @click="selectedPost = null">← 목록으로</button>
      <div class="detail-header">
        <span class="badge">{{ selectedPost.category }}</span>
        <h1>{{ selectedPost.title }}</h1>
        <div class="post-meta"><span>{{ selectedPost.author }}</span><span>{{ formatDate(selectedPost.createdAt) }}</span><span>조회 {{ selectedPost.views }}</span></div>
      </div>
      <div class="detail-body"><p class="post-content">{{ selectedPost.content }}</p></div>
      <div class="detail-actions">
        <span class="detail-note">여행 정보가 도움이 되었나요? 좋은 이야기를 함께 나눠주세요.</span>
        <div><button @click="openAuthModal('edit')" class="action-button">수정</button><button @click="openAuthModal('delete')" class="action-button danger">삭제</button></div>
      </div>
    </section>

    <section v-else class="board-list">
      <div class="list-controls">
        <div class="filter-group">
          <label for="category-filter">지역</label>
          <select id="category-filter" v-model="selectedCategory" class="form-control inline-select">
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>
        <button @click="startWrite" class="btn write-button"><span>＋</span> 글쓰기</button>
      </div>
      <div class="table-responsive">
        <table class="post-table">
          <thead><tr><th>지역</th><th>여행 이야기</th><th>작성자</th><th>작성일</th><th>조회</th></tr></thead>
          <tbody>
            <tr v-if="filteredPosts.length === 0"><td colspan="5" class="no-data"><span>🧳</span><strong>아직 등록된 이야기가 없어요</strong><small>첫 번째 서울 여행 이야기를 남겨보세요.</small></td></tr>
            <tr v-for="post in filteredPosts" :key="post.id" @click="viewPost(post.id)" class="clickable-row">
              <td><span class="badge">{{ post.category }}</span></td><td class="post-title">{{ post.title }}</td><td>{{ post.author }}</td><td>{{ formatDate(post.createdAt) }}</td><td>{{ post.views }}</td>
            </tr>
          </tbody>
        </table>
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

function useBoard() {
  const posts = ref(JSON.parse(localStorage.getItem('seoulog_posts')) || [])

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
      views: 0
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
.board-container { width:min(1180px,calc(100% - 40px)); min-height:calc(100vh - 68px); margin:0 auto; padding:54px 0 80px; color:#333d4b; text-align:left; }
.board-container.embedded { width:100%; height:100%; min-height:0; padding:16px; overflow:auto; }
.board-header { display:flex; align-items:flex-end; justify-content:space-between; gap:24px; margin-bottom:30px; }
.board-header h1 { margin:0 0 10px; font-size:34px; line-height:1.3; }
.board-header > div > p:last-child { margin:0; color:#8b95a1; font-size:14px; }
.board-count { flex:0 0 auto; min-width:150px; padding:15px 18px; border-radius:8px; background:#eaf3ff; text-align:center; }
.board-count strong,.board-count span { display:block; } .board-count strong { color:#3182f6; font-size:24px; } .board-count span { color:#6b7684; font-size:11px; }
.embedded .board-header { margin-bottom:14px; } .embedded .board-header h1 { font-size:20px; } .embedded .board-header > div > p:last-child,.embedded .board-count { display:none; }
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
.list-controls { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:14px; }
.filter-group { display:flex; align-items:center; gap:9px; } .filter-group label { color:#4e5968; font-size:13px; font-weight:750; }
.inline-select { width:auto; min-width:205px; }
.write-button span { font-size:19px; font-weight:400; }
.table-responsive { overflow:hidden; border:1px solid #e5e8eb; border-radius:8px; background:#fff; box-shadow:0 5px 18px rgba(15,23,42,.05); }
.post-table { width:100%; border-collapse:collapse; table-layout:fixed; }
.post-table th { padding:14px 16px; border-bottom:1px solid #e5e8eb; background:#f7f8fa; color:#8b95a1; font-size:11px; text-align:left; }
.post-table td { padding:16px; border-bottom:1px solid #edf0f2; color:#6b7684; font-size:13px; }
.post-table tr:last-child td { border-bottom:0; }
.post-table th:nth-child(1){width:22%}.post-table th:nth-child(2){width:43%}.post-table th:nth-child(3){width:13%}.post-table th:nth-child(4){width:14%}.post-table th:nth-child(5){width:8%}
.clickable-row { cursor:pointer; transition:background .15s ease; } .clickable-row:hover { background:#f4f8ff; }
.post-title { overflow:hidden; color:#191f28!important; font-size:14px!important; font-weight:750; text-overflow:ellipsis; white-space:nowrap; }
.badge { display:inline-flex; align-items:center; min-height:27px; max-width:100%; padding:0 9px; overflow:hidden; border-radius:6px; background:#eaf3ff; color:#3182f6; font-size:10px; font-weight:800; text-overflow:ellipsis; white-space:nowrap; }
.no-data { height:280px; text-align:center; } .no-data span,.no-data strong,.no-data small { display:block; } .no-data span { margin-bottom:13px; font-size:38px; } .no-data strong { color:#333d4b; font-size:16px; } .no-data small { margin-top:6px; color:#8b95a1; }
.back-button { margin-bottom:23px; padding:0; border:0; background:transparent; color:#6b7684; cursor:pointer; font-weight:750; }
.detail-header { padding-bottom:25px; border-bottom:1px solid #e5e8eb; }
.detail-header h1 { margin:13px 0 15px; font-size:29px; }
.post-meta { display:flex; flex-wrap:wrap; gap:8px 18px; color:#8b95a1; font-size:12px; }
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
  .form-row { grid-template-columns:1fr; } .card { padding:20px; }
  .post-table th:nth-child(3),.post-table th:nth-child(4),.post-table th:nth-child(5),.post-table td:nth-child(3),.post-table td:nth-child(4),.post-table td:nth-child(5) { display:none; }
  .post-table th:nth-child(1){width:34%}.post-table th:nth-child(2){width:66%}
  .post-table th,.post-table td { padding:13px 11px; }
  .list-controls { align-items:stretch; } .filter-group { flex:1; } .filter-group label { display:none; } .inline-select { min-width:0; }
  .detail-header h1 { font-size:24px; } .detail-actions { align-items:flex-start; flex-direction:column; }
}
</style>