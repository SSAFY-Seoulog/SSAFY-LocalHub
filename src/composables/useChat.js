import { ref } from 'vue'

/**
 * Seoulog AI 챗봇 공용 로직 (플로팅 위젯 + 챗봇 페이지 공유)
 *
 * 동작 방식
 * 1. public/data 의 서울 권역 JSON 7종을 최초 질문 시 1회 로드해 캐시
 * 2. 사용자 질문에서 키워드를 뽑아 관련 항목만 검색(간이 검색) 후
 *    OpenAI API 호출 시 컨텍스트로 주입 (전체 데이터 전송 시 비용 초과 방지)
 * 3. 커뮤니티 게시글(localStorage 'seoulog_posts')도 함께 검색해 컨텍스트에 포함
 * 4. 대화 히스토리는 localStorage 에 저장해 새로고침에도 유지
 *
 * 제약 준수: 백엔드 없음(브라우저 → OpenAI 직접 호출),
 *            API 키는 .env 의 VITE_OPENAI_API_KEY 로 관리(사용량 제한 키 필수)
 */

const HISTORY_KEY = 'seoulog_chat_history'
const MAX_INPUT_LENGTH = 300 // 비용 제한: 입력 길이 제한
const MAX_HISTORY_SENT = 8 // 비용 제한: API 에 보내는 최근 대화 수
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const OPENAI_MODEL = 'gpt-5-mini'

// 제공 데이터 파일 ↔ 카테고리 매핑
const DATA_SOURCES = [
  { file: 'seoul_attractions.json', category: '관광지', keywords: ['관광', '명소', '볼거리', '구경', '공원', '궁'] },
  { file: 'seoul_culture.json', category: '문화시설', keywords: ['문화', '박물관', '미술관', '전시', '공연장'] },
  { file: 'seoul_festivals.json', category: '축제·공연·행사', keywords: ['축제', '행사', '공연', '페스티벌', '일정'] },
  { file: 'seoul_courses.json', category: '여행코스', keywords: ['코스', '일정', '루트', '동선', '당일치기'] },
  { file: 'seoul_leisure.json', category: '레포츠', keywords: ['레포츠', '레저', '체험', '액티비티', '스포츠'] },
  { file: 'seoul_stay.json', category: '숙박', keywords: ['숙박', '호텔', '게스트하우스', '모텔', '한옥스테이', '잘 곳', '숙소'] },
  { file: 'seoul_shopping.json', category: '쇼핑', keywords: ['쇼핑', '시장', '백화점', '기념품', '살 곳'] }
]

// ---------- 모듈 스코프 공유 상태 (위젯/페이지 어디서든 같은 대화) ----------

const messages = ref(loadHistory())
const isLoading = ref(false)
const errorMessage = ref('')

let dataCache = null // [{ category, title, addr, tel }, ...]
let dataLoadPromise = null

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY))
    if (Array.isArray(saved) && saved.length > 0) return saved
  } catch (e) {
    /* 손상된 데이터는 무시하고 초기화 */
  }
  return [initialGreeting()]
}

function initialGreeting() {
  return {
    role: 'assistant',
    content:
      '안녕하세요! 서울 지역 정보 가이드 Seoulog AI입니다. 관광지·문화시설·축제·여행코스·레포츠·숙박·쇼핑 정보와 커뮤니티 게시글 검색을 도와드려요. 무엇이 궁금하세요?'
  }
}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.value))
}

// ---------- 제공 JSON 데이터 로드 ----------

async function loadAllData() {
  if (dataCache) return dataCache
  if (dataLoadPromise) return dataLoadPromise

  dataLoadPromise = Promise.all(
    DATA_SOURCES.map(async (src) => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}data/${src.file}`)
        if (!res.ok) return []
        const json = await res.json()
        return (json.items || []).map((item) => ({
          category: src.category,
          title: item.title || '',
          addr: item.addr1 || '',
          tel: item.tel || ''
        }))
      } catch (e) {
        console.error(`[Seoulog] 데이터 로드 실패: ${src.file}`, e)
        return []
      }
    })
  ).then((lists) => {
    dataCache = lists.flat()
    return dataCache
  })

  return dataLoadPromise
}

// ---------- 간이 키워드 검색 (컨텍스트 구성) ----------

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[\s,.!?~·]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
}

function detectCategories(query) {
  return DATA_SOURCES.filter(
    (src) => src.keywords.some((k) => query.includes(k)) || query.includes(src.category)
  ).map((src) => src.category)
}

function searchPlaces(query, allItems) {
  const tokens = tokenize(query)
  const boostCategories = detectCategories(query)

  const scored = allItems
    .map((item) => {
      let score = 0
      for (const token of tokens) {
        if (item.title.toLowerCase().includes(token)) score += 3
        if (item.addr.toLowerCase().includes(token)) score += 1
      }
      if (boostCategories.includes(item.category)) score += 2
      return { item, score }
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, 12).map((s) => s.item)
}

function searchPosts(query) {
  let posts = []
  try {
    posts = JSON.parse(localStorage.getItem('seoulog_posts')) || []
  } catch (e) {
    return []
  }
  const tokens = tokenize(query)
  return posts
    .filter((p) => tokens.some((t) => (p.title + ' ' + p.content).toLowerCase().includes(t)))
    .slice(0, 3)
    .map((p) => ({ category: p.category, title: p.title, content: p.content.slice(0, 120) }))
}

function buildContext(places, posts) {
  const lines = []
  if (places.length > 0) {
    lines.push('[서울 지역 데이터 검색 결과]')
    for (const p of places) {
      lines.push(
        `- (${p.category}) ${p.title} | 주소: ${p.addr || '정보 없음'}${p.tel ? ` | 전화: ${p.tel}` : ''}`
      )
    }
  }
  if (posts.length > 0) {
    lines.push('[커뮤니티 게시글 검색 결과]')
    for (const p of posts) {
      lines.push(`- (${p.category}) ${p.title}: ${p.content}`)
    }
  }
  if (lines.length === 0) {
    lines.push('[검색 결과 없음] 질문과 일치하는 데이터를 찾지 못했습니다.')
  }
  return lines.join('\n')
}

const SYSTEM_PROMPT = `너는 서울 지역 정보 커뮤니티 'Seoulog'의 AI 가이드다.
규칙:
1. 반드시 함께 제공되는 [검색 결과] 데이터에 근거해서만 장소·행사를 안내한다. 데이터에 없는 장소를 지어내지 않는다.
2. 검색 결과가 없거나 부족하면 솔직하게 "제공 데이터에서 찾지 못했다"고 안내하고, 다른 질문 방법을 제안한다.
3. 답변은 한국어로, 간결하게(2~5문장 또는 짧은 목록). 추천은 2~3곳으로 압축한다.
4. 주소·전화번호는 데이터에 있는 값만 사용한다.
5. 서울 지역 정보와 무관한 질문(코딩, 정치 등)에는 서울 여행/지역 정보 안내 역할임을 알리고 정중히 거절한다.`

// ---------- OpenAI 호출 ----------

async function callOpenAI(userQuery, context) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) {
    throw new Error(
      'API 키가 설정되지 않았습니다. .env 파일에 VITE_OPENAI_API_KEY를 추가한 뒤 개발 서버를 재시작해 주세요.'
    )
  }

  // 최근 대화만 발췌 (첫 인사말 제외, 마지막 사용자 메시지는 컨텍스트와 합쳐 전송)
  const recentHistory = messages.value
    .slice(1)
    .slice(-MAX_HISTORY_SENT)
    .map((m) => ({ role: m.role, content: m.content }))

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      // gpt-5 계열: max_tokens 대신 max_completion_tokens 사용, temperature 커스텀 미지원(기본값 1 고정)
      // 추론(reasoning) 토큰도 이 한도에서 차감되므로 여유 있게 설정하고, reasoning_effort 최소화로 비용 절감
      max_completion_tokens: 1200,
      reasoning_effort: 'minimal',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...recentHistory.slice(0, -1),
        {
          role: 'user',
          content: `${context}\n\n[사용자 질문]\n${userQuery}`
        }
      ]
    })
  })

  if (!res.ok) {
    if (res.status === 401) throw new Error('API 키가 유효하지 않습니다. 키 값을 확인해 주세요.')
    if (res.status === 429) throw new Error('요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.')
    throw new Error(`OpenAI 응답 오류 (${res.status})`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || '죄송해요, 답변을 생성하지 못했습니다.'
}

// ---------- 외부 공개 API ----------

export function useChat() {
  const send = async (rawText) => {
    const text = (rawText || '').trim()
    if (!text || isLoading.value) return

    if (text.length > MAX_INPUT_LENGTH) {
      errorMessage.value = `질문은 ${MAX_INPUT_LENGTH}자 이내로 입력해 주세요.`
      return
    }

    errorMessage.value = ''
    messages.value.push({ role: 'user', content: text })
    saveHistory()
    isLoading.value = true

    try {
      const allItems = await loadAllData()
      const places = searchPlaces(text, allItems)
      const posts = searchPosts(text)
      const context = buildContext(places, posts)

      const answer = await callOpenAI(text, context)
      messages.value.push({ role: 'assistant', content: answer })
    } catch (e) {
      messages.value.push({
        role: 'assistant',
        content: `⚠️ ${e.message || '알 수 없는 오류가 발생했습니다.'}`
      })
    } finally {
      isLoading.value = false
      saveHistory()
    }
  }

  const clearHistory = () => {
    messages.value = [initialGreeting()]
    saveHistory()
    errorMessage.value = ''
  }

  return { messages, isLoading, errorMessage, send, clearHistory, MAX_INPUT_LENGTH }
}
