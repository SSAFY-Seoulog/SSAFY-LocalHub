<template>
  <div class="board-page container">
    <header class="board-header">
      <h1>커뮤니티</h1>
      <p class="sub">서울 여행의 모든 것, 함께 나누는 공간입니다.</p>
    </header>

    <div class="board-controls panel">
      <div class="tabs">
        <button class="tab active">전체</button>
        <button class="tab">여행 팁</button>
        <button class="tab">질문</button>
        <button class="tab">일상</button>
        <button class="tab">맛집 리뷰</button>
      </div>

      <div class="controls-right">
        <div class="search">
          <input placeholder="게시물 검색" />
        </div>
        <button class="btn">글쓰기</button>
      </div>
    </div>

    <div class="board-list panel">
      <table class="posts">
        <thead>
          <tr>
            <th>카테고리</th>
            <th>제목</th>
            <th>작성자</th>
            <th>작성일</th>
            <th>조회수</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="badge green">여행 팁</span></td>
            <td class="title">광화문 근처 가성비 좋은 숙소 추천해주세요!</td>
            <td>seoul_lover</td>
            <td>10분 전</td>
            <td>42</td>
          </tr>
          <tr>
            <td><span class="badge">질문</span></td>
            <td class="title">주말 홍대 나들이 코스 어때요?</td>
            <td>traveler99</td>
            <td>1시간 전</td>
            <td>128</td>
          </tr>
          <tr>
            <td><span class="badge orange">맛집 리뷰</span></td>
            <td class="title">성수동 숨겨진 브런치 카페 발견! 진짜 맛있어요..</td>
            <td>foodie_kr</td>
            <td>3시간 전</td>
            <td>342</td>
          </tr>
          <tr>
            <td><span class="badge">일상</span></td>
            <td class="title">오늘 한강 노을 미쳤네요 ㅠㅠ 다들 나오세요</td>
            <td>sunset_chan</td>
            <td>어제</td>
            <td>512</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button class="page active">1</button>
        <button class="page">2</button>
        <button class="page">3</button>
        <button class="page">4</button>
        <button class="page">5</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BoardView',
};
</script>

<style scoped>
.board-header { padding: 32px 0 12px; }
.board-header h1 { margin: 0; font-size: 2rem; }
.board-header .sub { color: #6b7280; margin-top: 8px; }

.board-controls { display:flex; justify-content:space-between; align-items:center; gap:16px; padding:16px 20px; margin: 12px 0; }
.tabs { display:flex; gap:10px; }
.tab { background: #fff; border: 1px solid rgba(15,23,42,0.06); padding:8px 14px; border-radius:999px; cursor:pointer; }
.tab.active { background: #eef4ff; color: #0b74b2; border-color: rgba(11,116,178,0.12); }
.controls-right { display:flex; gap:12px; align-items:center; }
.search input { padding:10px 12px; border-radius:8px; border:1px solid rgba(15,23,42,0.06); }

.board-list { padding: 0; overflow: visible; }
.posts { width:100%; border-collapse: collapse; }
.posts thead th { text-align:left; padding:18px 20px; color:#6b7280; font-weight:700; border-bottom:1px solid rgba(15,23,42,0.06); }
.posts tbody td { padding:16px 20px; border-bottom:1px solid rgba(15,23,42,0.04); color:#0f1724; vertical-align: middle; }
.posts .title { font-weight:700; }
.badge { display:inline-block; padding:6px 8px; border-radius:8px; background:#f1f5f9; color:#0b74b2; font-weight:700; }
.badge.green { background:#e6fff6; color:#0aa27a; }
.badge.orange { background:#fff5df; color:#b67a00; }

.pagination { display:flex; gap:8px; justify-content:center; padding:18px 0; }
.page { background:#fff; border:1px solid rgba(15,23,42,0.06); padding:8px 12px; border-radius:6px; cursor:pointer; }
.page.active { background:#0b74b2; color:#fff; }

@media (max-width: 900px) {
  .board-controls { flex-direction: column; align-items:stretch; }
  .controls-right { justify-content: space-between; }
}
</style>
