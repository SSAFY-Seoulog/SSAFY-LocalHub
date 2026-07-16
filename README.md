# LocalHub

LocalHub는 서울 관광 정보를 지도, 커뮤니티, AI 챗봇으로 탐색할 수 있는 Vue 기반 웹 애플리케이션입니다. 공공 관광 JSON 데이터를 브라우저에서 직접 읽어 지도와 AI 검색 컨텍스트로 활용하고, 커뮤니티 게시글은 `localStorage`에 저장합니다.

## 주요 목적

- 서울 관광지, 축제, 문화시설, 여행코스, 레포츠, 쇼핑, 숙박 데이터를 한 화면에서 탐색
- 지도 기반 위치 확인과 카테고리 필터링 제공
- 사용자가 직접 로컬 정보를 공유할 수 있는 익명 커뮤니티 제공
- 제공 데이터와 커뮤니티 게시글을 기반으로 답변하는 AI 가이드 제공
- Toss 스타일에 가까운 밝고 간결한 UI 분위기 적용

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| 프레임워크 | Vue 3.5 |
| 빌드 도구 | Vite 8 |
| 라우팅 | vue-router 4 |
| 지도 | Leaflet 1.9, CartoDB Light 타일 |
| AI | OpenAI Chat Completions API, `gpt-5-mini` |
| 상태 관리 | Vue Composition API, `ref`, `computed`, `watch` |
| 저장소 | Browser `localStorage` |
| 스타일링 | 전역 CSS, 컴포넌트 scoped CSS |
| 데이터 | `public/data/*.json` 정적 JSON |

## 실행 방법

```bash
npm install
npm run dev
```

빌드 확인:

```bash
npm run build
```

프로덕션 빌드 미리보기:

```bash
npm run preview
```

## 환경 변수

`.env.example` 기준으로 다음 변수를 사용합니다.

```env
VITE_OPENAI_API_KEY=
VITE_WEATHER_API_KEY=
VITE_KAKAO_JS_KEY=
```

현재 코드에서 실제로 사용되는 핵심 변수는 `VITE_OPENAI_API_KEY`입니다. AI 챗봇은 브라우저에서 OpenAI API를 직접 호출하므로, 개발/시연용 제한 키 사용을 권장합니다.

`VITE_WEATHER_API_KEY`, `VITE_KAKAO_JS_KEY`는 예비 환경 변수로 남아 있으나 현재 주요 화면 로직에서는 직접 사용하지 않습니다.

## 라우트

| 경로 | 컴포넌트 | 설명 |
| --- | --- | --- |
| `/` | `HomeView.vue` | 메인 랜딩 화면 |
| `/map` | `MapView.vue` | 서울 관광 데이터 지도 |
| `/board` | `BoardView.vue` | 익명 커뮤니티 게시판 |
| `/chat` | `ChatView.vue` | 전체 화면 AI 챗봇 |

모든 페이지에는 `App.vue`에서 공통 헤더, 푸터, 플로팅 챗봇 위젯이 렌더링됩니다.

## 기능 상세

### 홈

- LocalHub 브랜드 소개
- `지도 보기` 버튼으로 `/map` 이동
- `게시판 둘러보기` 버튼으로 `/board` 이동
- Toss 스타일에 가까운 밝은 배경, 큰 타이포그래피, 둥근 버튼, 부드러운 그림자 적용
- 홈 화면 클릭 요소에 커스텀 손가락 포인터 적용

### 지도

`MapView.vue`에서 Leaflet 기반 관광 지도를 제공합니다.

- CartoDB Light 타일 사용
- 서울 중심 좌표 초기 표시
- 관광 데이터 7종 로드
- 전체 장소 수와 현재 표시 장소 수 표시
- 카테고리 필터링
  - 전체
  - 관광지
  - 축제
  - 문화시설
  - 여행코스
  - 레포츠
  - 쇼핑
  - 숙박
- 지도 마커 표시
- 가까운 장소는 클러스터 점으로 묶어서 표시
- 클러스터 클릭 시 해당 묶음 영역으로 확대
- 줌 레벨이 충분히 높아지면 개별 장소 마커로 분리
- 장소 목록 상위 30개 표시
- 목록 항목 클릭 시 지도 중심 이동 및 팝업 표시
- 선택 장소 카드 표시
  - 대표 이미지
  - 카테고리
  - 장소명
  - 주소
  - OpenStreetMap 크게 보기 링크
- 지도 로딩 상태 표시
- 데이터 로딩 실패 시 에러 메시지 표시
- 지도 전체에 일러스트 느낌의 밝은 필터, 오버레이, 격자 질감 적용

### 게시판

`BoardView.vue`에서 브라우저 로컬 저장소 기반 익명 게시판을 제공합니다.

- 게시글 목록 표시
- 등록된 게시글이 없을 때 빈 상태 메시지 표시
- 카테고리 필터링
  - 전체
  - 종로/중구 (도심)
  - 마포/서대문 (서북)
  - 강남/서초 (강남)
  - 성동/광진 (동북)
  - 로컬 꿀팁 공유
- 새 글 작성
  - 지역 카테고리
  - 닉네임
  - 수정/삭제 비밀번호
  - 제목
  - 내용
- 게시글 상세 보기
- 상세 보기 시 조회수 증가
- 비밀번호 확인 후 수정
- 비밀번호 확인 후 삭제
- 게시글 데이터는 `localStorage`의 `seoulog_posts`에 저장
- 게시판 클릭 요소에 커스텀 손가락 포인터 적용

### AI 챗봇 페이지

`ChatView.vue`에서 전체 화면형 AI 가이드를 제공합니다.

- LocalHub AI 가이드 대화 화면
- 메시지 입력 및 Enter 전송
- 전송 버튼 비활성화 상태 처리
- 로딩 중 점 애니메이션 표시
- 오류 메시지 표시
- 새 대화 시작 기능
- 대화 영역 자동 스크롤
- 최대 입력 길이 제한
- 모바일 대응 레이아웃

### 플로팅 AI 챗봇 위젯

`ChatWidget.vue`에서 모든 페이지 우측 하단에 표시되는 챗봇 위젯을 제공합니다.

- 접힌 상태의 플로팅 버튼
- 클릭 시 대화 패널 열기
- 대화 초기화 버튼
- 닫기 버튼
- 메시지 입력 및 전송
- 로딩 점 애니메이션
- 오류 메시지 표시
- 모바일에서는 전체 화면 패널로 확장
- `ChatView.vue`와 동일한 `useChat` 상태 공유

### AI 공용 로직

`src/composables/useChat.js`에서 챗봇 공용 로직을 관리합니다.

- 최초 질문 시 공공 관광 JSON 7종 로드 후 캐싱
- 사용자 질문 토큰화
- 질문 키워드 기반 카테고리 감지
- 장소명/주소 기반 간이 검색
- 커뮤니티 게시글 검색
- 검색 결과를 OpenAI API 컨텍스트로 구성
- 최근 대화 일부만 API에 전송해 비용 제어
- `gpt-5-mini` 모델 사용
- `reasoning_effort: 'minimal'` 사용
- `max_completion_tokens` 제한
- 대화 기록을 `localStorage`의 `seoulog_chat_history`에 저장
- API 키 누락, 인증 실패, 요청 한도 초과 등 오류 메시지 처리

## 데이터 파일

`public/data` 아래 정적 JSON 파일을 사용합니다.

| 파일 | 용도 |
| --- | --- |
| `seoul_attractions.json` | 관광지 |
| `seoul_culture.json` | 문화시설 |
| `seoul_festivals.json` | 축제·공연·행사 |
| `seoul_courses.json` | 여행코스 |
| `seoul_leisure.json` | 레포츠 |
| `seoul_shopping.json` | 쇼핑 |
| `seoul_stay.json` | 숙박 |

지도 화면은 각 데이터의 `mapx`, `mapy`, `title`, `addr1`, `firstimage`, `firstimage2`, `tel`, `contentid` 등을 사용합니다.

AI 챗봇은 각 데이터에서 `title`, `addr1`, `tel`을 추출해 검색 컨텍스트로 사용합니다.

## 아이콘 및 시각 요소

프로젝트에서 사용하는 아이콘과 시각 요소는 다음과 같습니다.

| 위치 | 아이콘/요소 | 용도 |
| --- | --- | --- |
| `public/favicon.svg` | LocalHub `S` 심볼 | 브라우저 탭 favicon |
| 헤더 | `LocalHub` 텍스트 로고 | 브랜드 표시 |
| 게시판 글쓰기 버튼 | `✏️` | 새 게시글 작성 액션 |
| 플로팅 챗봇 버튼 | `💬` | 챗봇 열기 |
| 챗봇 초기화 버튼 | `↺` | 대화 초기화 |
| 챗봇 닫기 버튼 | `✕` | 위젯 닫기 |
| 챗봇 로딩 | 3개 점 애니메이션 | 답변 생성 중 표시 |
| AI 오류 메시지 | `⚠️` | 챗봇 오류 상태 강조 |
| 지도 카테고리 필터 | 컬러 원형 점 | 카테고리 구분 |
| 지도 범례 | 컬러 원형 점 | 지도 카테고리 색상 설명 |
| 지도 장소 목록 | 컬러 원형 점 | 장소 카테고리 구분 |
| 지도 개별 마커 | Leaflet `circleMarker` | 단일 장소 위치 표시 |
| 지도 클러스터 | 숫자 원형 마커 | 가까운 장소 묶음 표시 |
| 커스텀 커서 | 둥근 손가락 SVG 커서 | 홈/게시판 클릭 요소 포인터 |
| 지도 배경 | 밝은 타일, 컬러 오버레이, 격자 질감 | 일러스트 느낌의 지도 표현 |

별도 아이콘 라이브러리는 사용하지 않습니다. UI 아이콘은 텍스트 심볼, 이모지, SVG favicon, CSS 원형 요소, Leaflet 마커로 구성되어 있습니다.

## 프로젝트 구조

```text
.
├── index.html
├── public/
│   ├── favicon.svg
│   └── data/
│       ├── seoul_attractions.json
│       ├── seoul_courses.json
│       ├── seoul_culture.json
│       ├── seoul_festivals.json
│       ├── seoul_leisure.json
│       ├── seoul_shopping.json
│       └── seoul_stay.json
├── src/
│   ├── App.vue
│   ├── main.js
│   ├── router.js
│   ├── style.css
│   ├── assets/
│   │   ├── hero.png
│   │   └── vue.svg
│   ├── components/
│   │   ├── BoardView.vue
│   │   ├── ChatView.vue
│   │   ├── ChatWidget.vue
│   │   ├── HomeView.vue
│   │   └── MapView.vue
│   └── composables/
│       └── useChat.js
├── package.json
└── README.md
```

## 저장소 및 브라우저 저장 데이터

| 키 | 저장 내용 |
| --- | --- |
| `seoulog_posts` | 게시판 글 목록 |
| `seoulog_chat_history` | AI 챗봇 대화 기록 |

브라우저 저장소를 사용하므로 기기나 브라우저가 바뀌면 데이터가 공유되지 않습니다.

## 빌드 스크립트

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |

## 참고 사항

- OpenAI API 키가 없으면 AI 답변 생성은 동작하지 않습니다.
- 지도 타일은 외부 CartoDB 타일 서버를 사용합니다.
- 관광 데이터는 `public/data`의 정적 JSON 파일을 기준으로 동작합니다.
- 게시판은 서버 없이 브라우저 `localStorage`에만 저장됩니다.
- `VITE_KAKAO_JS_KEY`는 현재 지도 구현에서는 사용하지 않습니다. 현재 지도는 Leaflet 기반입니다.
