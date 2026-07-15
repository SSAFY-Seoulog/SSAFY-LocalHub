<template>
  <main class="map-page">
    <section class="map-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Seoulog</p>
          <h1>서울 데이터 지도</h1>
        </div>
        <p class="section-description">서울의 자치구별 데이터를 지도 위에서 한눈에 확인하세요. 관광객 수, 혼잡도, 인기 지역 정보를 시각적으로 제공합니다.</p>
      </div>

      <div class="map-layout">
        <aside class="panel">
          <h2>서울 관광 데이터</h2>
          <p>자치구별 방문객 수와 상권 흐름을 시각적으로 보여주는 대시보드입니다.</p>
          <div class="button-group">
            <button>혼잡도</button>
            <button>관광객증감</button>
            <button>관람통계</button>
          </div>
          <div class="summary-card">
            <strong>2.4M</strong>
            <span>일별 관광 방문객</span>
          </div>
          <div class="stats-grid">
            <div class="stat-pill"><strong>중구</strong><span>인기 지자체 Top</span></div>
            <div class="stat-pill"><strong>강남구</strong><span>핫플, 코엑스 근처</span></div>
          </div>
          <div class="list-card">
            <div class="list-item">
              <div>
                <p class="district">중구</p>
                <div class="bar"><span style="width:92%"></span></div>
              </div>
              <strong>320K명</strong>
            </div>
            <div class="list-item">
              <div>
                <p class="district">강남구</p>
                <div class="bar"><span style="width:82%"></span></div>
              </div>
              <strong>285K명</strong>
            </div>
            <div class="list-item">
              <div>
                <p class="district">종로구</p>
                <div class="bar"><span style="width:74%"></span></div>
              </div>
              <strong>210K명</strong>
            </div>
            <div class="list-item">
              <div>
                <p class="district">마포구</p>
                <div class="bar"><span style="width:61%"></span></div>
              </div>
              <strong>180K명</strong>
            </div>
          </div>
        </aside>

        <section class="map-card">
          <div class="map-header">
            <h3>서울 데이터 지도를 확인하세요</h3>
            <div class="legend">
              <span><span class="dot low"></span>보통</span>
              <span><span class="dot medium"></span>높음</span>
              <span><span class="dot high"></span>상승세</span>
            </div>
          </div>
          <div id="map"></div>
        </section>
      </div>
    </section>
  </main>
</template>

<script setup>
import { onMounted } from 'vue'

const kakaoKey = import.meta.env.VITE_KAKAO_JS_KEY

function loadKakaoScript() {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      return resolve()
    }

    const existingScript = document.querySelector('script[data-kakao]')
    if (existingScript) {
      existingScript.addEventListener('load', resolve)
      existingScript.addEventListener('error', reject)
      return
    }

    const script = document.createElement('script')
    script.setAttribute('data-kakao', 'true')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&libraries=services&autoload=false`
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function createMap() {
  if (!window.kakao || !window.kakao.maps) {
    console.warn('Kakao Maps SDK가 로드되지 않았습니다.')
    return
  }

  const container = document.getElementById('map')
  const options = { center: new kakao.maps.LatLng(37.5665, 126.9780), level: 7 }
  const map = new kakao.maps.Map(container, options)

  const dataPoints = [
    { title: '중구', coords: new kakao.maps.LatLng(37.5638, 126.9975), label: '320K명' },
    { title: '강남구', coords: new kakao.maps.LatLng(37.5172, 127.0473), label: '285K명' },
    { title: '종로구', coords: new kakao.maps.LatLng(37.5729, 126.9794), label: '210K명' },
    { title: '마포구', coords: new kakao.maps.LatLng(37.5663, 126.9019), label: '180K명' }
  ]

  dataPoints.forEach(point => {
    const marker = new kakao.maps.Marker({ position: point.coords, map })
    const infowindow = new kakao.maps.InfoWindow({
      content: `<div style="padding:10px 14px;border-radius:12px;background:rgba(15,23,42,0.85);color:white;font-size:13px;line-height:1.4;">${point.title}<br>${point.label}</div>`
    })

    kakao.maps.event.addListener(marker, 'mouseover', () => infowindow.open(map, marker))
    kakao.maps.event.addListener(marker, 'mouseout', () => infowindow.close())
  })
}

onMounted(async () => {
  if (!kakaoKey) {
    console.warn('VITE_KAKAO_JS_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.')
    return
  }

  try {
    await loadKakaoScript()
    window.kakao.maps.load(createMap)
  } catch (error) {
    console.error('Kakao Maps SDK 로드 실패', error)
  }
})
</script>
