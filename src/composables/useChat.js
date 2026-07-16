import { ref } from 'vue'

const MAX_INPUT_LENGTH = 300
const MAX_HISTORY_SENT = 8
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const OPENAI_MODEL = 'gpt-5-mini'

const DATA_SOURCES = [
  { file: 'seoul_attractions.json', category: '관광지', keywords: ['관광', '명소', '볼거리', '구경', '공원', '궁'] },
  { file: 'seoul_culture.json', category: '문화시설', keywords: ['문화', '박물관', '미술관', '전시', '공연장'] },
  { file: 'seoul_festivals.json', category: '축제·공연·행사', keywords: ['축제', '행사', '공연', '페스티벌', '일정'] },
  { file: 'seoul_courses.json', category: '여행코스', keywords: ['코스', '일정', '루트', '동선', '당일치기'] },
  { file: 'seoul_leisure.json', category: '레포츠', keywords: ['레포츠', '레저', '체험', '액티비티', '스포츠'] },
  { file: 'seoul_stay.json', category: '숙박', keywords: ['숙박', '호텔', '게스트하우스', '모텔', '한옥스테이', '잘 곳', '숙소'] },
  { file: 'seoul_shopping.json', category: '쇼핑', keywords: ['쇼핑', '시장', '백화점', '기념품', '살 곳'] }
]

const MODE_CONFIG = {
  trip: {
    historyKey: 'localhub_trip_course_history',
    greeting: '반가워요! 서울 여행 코스 플래너예요. 여행 날짜나 시간, 동행, 원하는 지역과 분위기를 알려주시면 이동 동선을 고려한 코스를 만들어드릴게요.',
    systemPrompt: [
      "너는 서울 여행 플랫폼 'LocalHub'의 여행 코스 전문 AI 플래너다.",
      '규칙:',
      '1. 제공되는 서울 지역 데이터와 여행자 게시글에 근거해 실제 방문 순서가 있는 코스를 만든다.',
      '2. 사용자가 기간, 출발 지역, 동행, 관심사 중 일부를 말하지 않았다면 꼭 필요한 조건 1~2가지만 먼저 질문한다.',
      '3. 코스를 제안할 때 오전·점심·오후·저녁처럼 시간대, 장소, 추천 이유, 다음 장소로의 이동 흐름을 함께 적는다.',
      '4. 검색 결과에 없는 장소, 주소, 전화번호를 지어내지 않는다. 정보가 부족하면 제공 데이터에서 찾지 못했다고 알린다.',
      '5. 답변은 한국어로 읽기 쉬운 짧은 목록을 사용하고, 기본 추천은 하루 3~5곳으로 제한한다.',
      '6. 서울 여행과 무관한 질문에는 여행 코스 추천 역할임을 설명한다.'
    ].join('\n')
  },
  site: {
    historyKey: 'localhub_site_help_history',
    greeting: '안녕하세요! LocalHub 이용 도우미예요. 여행지도, 여행톡, AI 코스 추천 등 사이트 사용 중 궁금한 점을 물어보세요.',
    systemPrompt: [
      "너는 서울 여행 플랫폼 'LocalHub'의 사이트 이용 도우미다.",
      'LocalHub 기능:',
      '- 홈: 주요 기능과 서울 여행 테마를 소개한다.',
      '- 여행지도: 서울 관광지, 문화시설, 축제, 여행코스, 레포츠, 쇼핑, 숙박을 카테고리별로 탐색한다.',
      '- 여행톡: 여행자가 글을 등록하고 지역별 경험과 팁을 공유한다. 글 작성 시 설정한 비밀번호로 수정·삭제한다.',
      '- AI 코스: 여행 시간, 지역, 동행, 취향을 바탕으로 서울 여행 코스를 추천한다.',
      '규칙:',
      '1. LocalHub 화면, 메뉴, 사용 방법, 데이터 범위에 관한 질문에만 답한다.',
      '2. 여행 장소나 코스를 직접 추천하지 말고 상단의 AI 코스 메뉴를 이용하도록 안내한다.',
      '3. 실제로 존재하지 않는 로그인, 예약, 결제, 저장 기능이 있다고 말하지 않는다.',
      '4. 답변은 한국어로 1~4문장 이내로 간결하게 작성하고 필요하면 이동할 메뉴 이름을 정확히 알려준다.'
    ].join('\n')
  }
}

const states = new Map()
let dataCache = null
let dataLoadPromise = null

function initialGreeting(mode) {
  return { role: 'assistant', content: MODE_CONFIG[mode].greeting }
}

function loadHistory(mode) {
  try {
    const saved = JSON.parse(localStorage.getItem(MODE_CONFIG[mode].historyKey))
    if (Array.isArray(saved) && saved.length > 0) return saved
  } catch (error) {
    // 손상된 기록은 새 대화로 교체한다.
  }
  return [initialGreeting(mode)]
}

function getState(mode) {
  if (!states.has(mode)) {
    states.set(mode, {
      messages: ref(loadHistory(mode)),
      isLoading: ref(false),
      errorMessage: ref('')
    })
  }
  return states.get(mode)
}

function saveHistory(mode, messages) {
  localStorage.setItem(MODE_CONFIG[mode].historyKey, JSON.stringify(messages.value))
}

async function loadAllData() {
  if (dataCache) return dataCache
  if (dataLoadPromise) return dataLoadPromise

  dataLoadPromise = Promise.all(
    DATA_SOURCES.map(async (source) => {
      try {
        const response = await fetch(import.meta.env.BASE_URL + 'data/' + source.file)
        if (!response.ok) return []
        const json = await response.json()
        return (json.items || []).map((item) => ({
          category: source.category,
          title: item.title || '',
          addr: item.addr1 || '',
          tel: item.tel || ''
        }))
      } catch (error) {
        console.error('[LocalHub] 데이터 로드 실패: ' + source.file, error)
        return []
      }
    })
  ).then((lists) => {
    dataCache = lists.flat()
    return dataCache
  })

  return dataLoadPromise
}

function tokenize(text) {
  return text.toLowerCase().split(/[\s,.!?~·]+/).map((token) => token.trim()).filter((token) => token.length >= 2)
}

function detectCategories(query) {
  return DATA_SOURCES.filter(
    (source) => source.keywords.some((keyword) => query.includes(keyword)) || query.includes(source.category)
  ).map((source) => source.category)
}

function searchPlaces(query, allItems) {
  const tokens = tokenize(query)
  const boostCategories = detectCategories(query)

  return allItems
    .map((item) => {
      let score = 0
      for (const token of tokens) {
        if (item.title.toLowerCase().includes(token)) score += 3
        if (item.addr.toLowerCase().includes(token)) score += 1
      }
      if (boostCategories.includes(item.category)) score += 2
      return { item, score }
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 18)
    .map((result) => result.item)
}

function searchPosts(query) {
  try {
    const posts = JSON.parse(localStorage.getItem('seoulog_posts')) || []
    const tokens = tokenize(query)
    return posts
      .filter((post) => tokens.some((token) => (post.title + ' ' + post.content).toLowerCase().includes(token)))
      .slice(0, 4)
      .map((post) => ({ category: post.category, title: post.title, content: post.content.slice(0, 140) }))
  } catch (error) {
    return []
  }
}

function buildTripContext(places, posts) {
  const lines = []
  if (places.length > 0) {
    lines.push('[서울 지역 데이터 검색 결과]')
    for (const place of places) {
      lines.push('- (' + place.category + ') ' + place.title + ' | 주소: ' + (place.addr || '정보 없음') + (place.tel ? ' | 전화: ' + place.tel : ''))
    }
  }
  if (posts.length > 0) {
    lines.push('[여행톡 검색 결과]')
    for (const post of posts) lines.push('- (' + post.category + ') ' + post.title + ': ' + post.content)
  }
  if (lines.length === 0) lines.push('[검색 결과 없음] 조건과 일치하는 장소를 제공 데이터에서 찾지 못했습니다.')
  return lines.join('\n')
}

function getLocalSiteAnswer(query) {
  const text = query.toLowerCase()
  if (/지도|장소|관광지|축제|숙박|쇼핑/.test(text)) {
    return '상단의 ‘여행지도’에서 카테고리를 선택하면 서울의 관광지, 문화시설, 축제, 쇼핑, 숙박 정보를 지도와 목록으로 확인할 수 있어요.'
  }
  if (/글|게시|여행톡|수정|삭제|비밀번호/.test(text)) {
    return '‘여행톡’에서 지역을 선택해 글을 작성할 수 있어요. 작성할 때 입력한 비밀번호가 있어야 해당 글을 수정하거나 삭제할 수 있습니다.'
  }
  if (/코스|추천|일정|ai/.test(text)) {
    return '상단의 ‘AI 코스’로 이동해 여행 시간, 지역, 동행, 취향을 알려주세요. 조건에 맞춰 이동 순서가 포함된 서울 여행 코스를 추천해드려요.'
  }
  if (/로그인|회원|가입/.test(text)) {
    return 'LocalHub는 현재 별도 로그인이나 회원가입 없이 지도와 AI 코스를 이용할 수 있어요. 여행톡 글은 작성 시 설정한 비밀번호로 관리합니다.'
  }
  if (/예약|결제|구매/.test(text)) {
    return 'LocalHub는 여행 정보를 탐색하는 서비스로, 현재 사이트 안에서 예약이나 결제는 지원하지 않습니다.'
  }
  if (/사용|기능|메뉴|뭐|무엇/.test(text)) {
    return 'LocalHub에서는 ‘여행지도’로 장소를 찾고, ‘여행톡’에서 경험을 나누며, ‘AI 코스’에서 맞춤 여행 일정을 추천받을 수 있어요.'
  }
  return ''
}

async function callOpenAI(mode, state, userQuery, context) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('API 키가 설정되지 않았습니다. .env 파일에 VITE_OPENAI_API_KEY를 추가한 뒤 개발 서버를 재시작해 주세요.')
  }

  const recentHistory = state.messages.value
    .slice(1)
    .slice(-MAX_HISTORY_SENT)
    .map((message) => ({ role: message.role, content: message.content }))

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_completion_tokens: 1400,
      reasoning_effort: 'minimal',
      messages: [
        { role: 'system', content: MODE_CONFIG[mode].systemPrompt },
        ...recentHistory.slice(0, -1),
        { role: 'user', content: context + '\n\n[사용자 질문]\n' + userQuery }
      ]
    })
  })

  if (!response.ok) {
    if (response.status === 401) throw new Error('API 키가 유효하지 않습니다. 키 값을 확인해 주세요.')
    if (response.status === 429) throw new Error('요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.')
    throw new Error('OpenAI 응답 오류 (' + response.status + ')')
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content?.trim() || '죄송해요, 답변을 생성하지 못했습니다.'
}

export function useChat(mode = 'trip') {
  if (!MODE_CONFIG[mode]) throw new Error('지원하지 않는 채팅 모드입니다: ' + mode)
  const state = getState(mode)

  const send = async (rawText) => {
    const text = (rawText || '').trim()
    if (!text || state.isLoading.value) return

    if (text.length > MAX_INPUT_LENGTH) {
      state.errorMessage.value = '질문은 ' + MAX_INPUT_LENGTH + '자 이내로 입력해 주세요.'
      return
    }

    state.errorMessage.value = ''
    state.messages.value.push({ role: 'user', content: text })
    saveHistory(mode, state.messages)

    const localAnswer = mode === 'site' ? getLocalSiteAnswer(text) : ''
    if (localAnswer) {
      state.messages.value.push({ role: 'assistant', content: localAnswer })
      saveHistory(mode, state.messages)
      return
    }

    state.isLoading.value = true
    try {
      let context = '[LocalHub 사이트 기능 안내에 따라 답변하세요.]'
      if (mode === 'trip') {
        const allItems = await loadAllData()
        context = buildTripContext(searchPlaces(text, allItems), searchPosts(text))
      }
      const answer = await callOpenAI(mode, state, text, context)
      state.messages.value.push({ role: 'assistant', content: answer })
    } catch (error) {
      state.messages.value.push({ role: 'assistant', content: '⚠️ ' + (error.message || '알 수 없는 오류가 발생했습니다.') })
    } finally {
      state.isLoading.value = false
      saveHistory(mode, state.messages)
    }
  }

  const clearHistory = () => {
    state.messages.value = [initialGreeting(mode)]
    saveHistory(mode, state.messages)
    state.errorMessage.value = ''
  }

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    errorMessage: state.errorMessage,
    send,
    clearHistory,
    MAX_INPUT_LENGTH
  }
}
