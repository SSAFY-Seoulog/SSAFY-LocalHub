<template>
  <main class="map-page">
    <section class="map-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Seoulog</p>
          <h1>서울 관광 지도</h1>
        </div>
        <p class="section-description">서울의 관광지, 축제, 문화시설, 쇼핑, 숙박 데이터를 지도 위에서 확인하고 카테고리별로 장소를 살펴볼 수 있습니다.</p>
      </div>

      <div class="map-layout">
        <aside class="panel map-panel">
          <h2>지도 데이터</h2>
          <p>총 {{ totalCount.toLocaleString() }}개의 장소 중 {{ visiblePlaces.length.toLocaleString() }}개를 표시 중입니다.</p>

          <div class="button-group category-filters">
            <button
              v-for="category in categories"
              :key="category.id"
              type="button"
              :class="{ active: selectedCategory === category.id }"
              @click="selectCategory(category.id)"
            >
              <span class="category-dot" :style="{ backgroundColor: category.color }"></span>
              {{ category.label }}
            </button>
          </div>

          <div class="summary-card">
            <strong>{{ visiblePlaces.length.toLocaleString() }}</strong>
            <span>{{ selectedCategoryLabel }} 표시 장소</span>
          </div>

          <div v-if="selectedPlace" class="selected-card">
            <img
              v-if="selectedPlace.image"
              :src="selectedPlace.image"
              :alt="selectedPlace.title"
              loading="lazy"
            />
            <div class="selected-content">
              <span class="selected-category">{{ selectedPlace.categoryLabel }}</span>
              <h3>{{ selectedPlace.title }}</h3>
              <p>{{ selectedPlace.addr1 || '주소 정보가 없습니다.' }}</p>
              <a
                class="direction-link"
                :href="getOpenStreetMapUrl(selectedPlace)"
                target="_blank"
                rel="noreferrer"
              >
                지도에서 크게 보기
              </a>
            </div>
          </div>

          <div class="list-card place-list">
            <button
              v-for="place in visiblePlaces.slice(0, 30)"
              :key="place.id"
              type="button"
              class="place-item"
              :class="{ active: selectedPlace?.id === place.id }"
              @click="focusPlace(place)"
            >
              <span class="place-dot" :style="{ backgroundColor: place.color }"></span>
              <span>
                <strong>{{ place.title }}</strong>
                <small>{{ place.addr1 || place.categoryLabel }}</small>
              </span>
            </button>
          </div>
        </aside>

        <section class="map-card">
          <div class="map-header">
            <h3>{{ mapStatus }}</h3>
            <div class="legend">
              <span v-for="category in categories.slice(1)" :key="category.id">
                <span class="dot" :style="{ backgroundColor: category.color }"></span>
                {{ category.label }}
              </span>
            </div>
          </div>

          <div class="map-wrapper">
            <div id="map"></div>
            <div v-if="isLoading" class="map-state">지도 데이터를 불러오는 중입니다.</div>
            <div v-else-if="errorMessage" class="map-state error">{{ errorMessage }}</div>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const categories = [
  { id: 'all', label: '전체', color: '#0b74b2' },
  { id: 'attractions', label: '관광지', file: '/data/seoul_attractions.json', color: '#0b74b2' },
  { id: 'festivals', label: '축제', file: '/data/seoul_festivals.json', color: '#f59e0b' },
  { id: 'culture', label: '문화시설', file: '/data/seoul_culture.json', color: '#7c3aed' },
  { id: 'courses', label: '여행코스', file: '/data/seoul_courses.json', color: '#16a34a' },
  { id: 'leisure', label: '레포츠', file: '/data/seoul_leisure.json', color: '#0891b2' },
  { id: 'shopping', label: '쇼핑', file: '/data/seoul_shopping.json', color: '#db2777' },
  { id: 'stay', label: '숙박', file: '/data/seoul_stay.json', color: '#64748b' }
]

const map = ref(null)
const markerLayer = ref(null)
const markers = ref(new Map())
const places = ref([])
const selectedCategory = ref('all')
const selectedPlace = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')
const clusterPixelSize = 64
const clusterDisableZoom = 16

const totalCount = computed(() => places.value.length)

const visiblePlaces = computed(() => {
  if (selectedCategory.value === 'all') {
    return places.value
  }

  return places.value.filter(place => place.categoryId === selectedCategory.value)
})

const selectedCategoryLabel = computed(() => {
  return categories.find(category => category.id === selectedCategory.value)?.label || '전체'
})

const mapStatus = computed(() => {
  if (errorMessage.value) return '지도를 표시할 수 없습니다'
  if (isLoading.value) return '지도 준비 중'
  return `${selectedCategoryLabel.value} ${visiblePlaces.value.length.toLocaleString()}개`
})

async function fetchCategory(category) {
  const response = await fetch(category.file)

  if (!response.ok) {
    throw new Error(`${category.label} 데이터를 불러오지 못했습니다.`)
  }

  const data = await response.json()
  return (data.items || [])
    .map(item => normalizePlace(item, category))
    .filter(Boolean)
}

function normalizePlace(item, category) {
  const lat = Number.parseFloat(item.mapy)
  const lng = Number.parseFloat(item.mapx)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return {
    id: `${category.id}-${item.contentid}`,
    contentid: item.contentid,
    title: item.title || '이름 없는 장소',
    addr1: item.addr1 || '',
    tel: item.tel || '',
    image: item.firstimage || item.firstimage2 || '',
    lat,
    lng,
    categoryId: category.id,
    categoryLabel: category.label,
    color: category.color
  }
}

function createMap() {
  map.value = L.map('map', {
    center: [37.5665, 126.9780],
    zoom: 11,
    zoomControl: true,
    preferCanvas: true
  })

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map.value)

  markerLayer.value = L.layerGroup().addTo(map.value)
  map.value.on('zoomend moveend', renderMarkers)
}

function renderMarkers() {
  if (!map.value || !markerLayer.value) return

  markerLayer.value.clearLayers()
  markers.value = new Map()

  getClusteredPlaces().forEach(group => {
    if (group.places.length > 1) {
      const marker = createClusterMarker(group)
      marker.addTo(markerLayer.value)
      return
    }

    const place = group.places[0]
    const marker = L.circleMarker([place.lat, place.lng], {
      radius: 9,
      color: '#f8fbff',
      weight: 3,
      fillColor: place.color,
      fillOpacity: 0.78,
      opacity: 0.96,
      className: 'illustration-marker'
    })
      .bindPopup(getPopupHtml(place), {
        closeButton: true,
        maxWidth: 260
      })
      .on('click', () => {
        selectedPlace.value = place
      })

    marker.addTo(markerLayer.value)
    markers.value.set(place.id, marker)
  })
}

function getClusteredPlaces() {
  if (!map.value || map.value.getZoom() >= clusterDisableZoom) {
    return visiblePlaces.value.map(place => ({
      lat: place.lat,
      lng: place.lng,
      places: [place]
    }))
  }

  const buckets = new Map()

  visiblePlaces.value.forEach(place => {
    const point = map.value.latLngToLayerPoint([place.lat, place.lng])
    const key = `${Math.round(point.x / clusterPixelSize)}:${Math.round(point.y / clusterPixelSize)}`
    const bucket = buckets.get(key) || { latSum: 0, lngSum: 0, places: [] }

    bucket.latSum += place.lat
    bucket.lngSum += place.lng
    bucket.places.push(place)
    buckets.set(key, bucket)
  })

  return Array.from(buckets.values()).map(bucket => ({
    lat: bucket.latSum / bucket.places.length,
    lng: bucket.lngSum / bucket.places.length,
    places: bucket.places
  }))
}

function createClusterMarker(group) {
  const count = group.places.length
  const size = Math.min(54, Math.max(34, 28 + Math.log(count) * 8))
  const bounds = L.latLngBounds(group.places.map(place => [place.lat, place.lng]))

  return L.marker([group.lat, group.lng], {
    icon: L.divIcon({
      className: 'place-cluster',
      html: `<span>${count.toLocaleString()}</span>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    }),
    title: `${count.toLocaleString()}개 장소`
  }).on('click', () => {
    selectedPlace.value = null

    if (bounds.isValid() && !bounds.getNorthEast().equals(bounds.getSouthWest())) {
      map.value.fitBounds(bounds.pad(0.18), { maxZoom: 15, animate: true })
      return
    }

    map.value.setView([group.lat, group.lng], Math.min(map.value.getZoom() + 2, 15), {
      animate: true
    })
  })
}

function getPopupHtml(place) {
  const address = place.addr1 || '주소 정보가 없습니다.'
  return `
    <div class="map-popup">
      <strong>${escapeHtml(place.title)}</strong>
      <span>${escapeHtml(place.categoryLabel)}</span>
      <p>${escapeHtml(address)}</p>
    </div>
  `
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function selectCategory(categoryId) {
  selectedCategory.value = categoryId
  selectedPlace.value = null
}

function focusPlace(place) {
  selectedPlace.value = place

  if (!map.value) return

  map.value.once('moveend', () => {
    renderMarkers()
    markers.value.get(place.id)?.openPopup()
  })

  map.value.setView([place.lat, place.lng], Math.max(map.value.getZoom(), clusterDisableZoom), {
    animate: true
  })
}

function getOpenStreetMapUrl(place) {
  return `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=16/${place.lat}/${place.lng}`
}

async function loadPlaces() {
  const dataCategories = categories.filter(category => category.file)
  const categoryResults = await Promise.all(dataCategories.map(fetchCategory))
  places.value = categoryResults.flat()
}

watch(visiblePlaces, () => {
  renderMarkers()
})

onMounted(async () => {
  try {
    await loadPlaces()
    await nextTick()
    createMap()
    renderMarkers()
    isLoading.value = false
  } catch (error) {
    console.error(error)
    isLoading.value = false
    errorMessage.value = '관광 데이터를 불러오지 못했습니다.'
  }
})

onBeforeUnmount(() => {
  map.value?.remove()
})
</script>

<style scoped>
.map-page {
  display: flex;
  justify-content: center;
  width: 100%;
}

.map-section {
  box-sizing: border-box;
  margin: 0 auto;
  max-width: 1280px;
  padding: 44px 24px 80px;
  width: 100%;
}

.section-heading {
  align-items: flex-start;
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(220px, 0.7fr) minmax(320px, 1fr);
  margin: 0 auto 28px;
  max-width: none;
  width: 100%;
}

.section-heading h1 {
  font-size: clamp(2rem, 3vw, 2.8rem);
  line-height: 1.15;
  margin: 6px 0 0;
  word-break: keep-all;
}

.section-description {
  align-self: end;
  color: #64748b;
  line-height: 1.75;
  margin: 0;
  max-width: 620px;
  overflow-wrap: break-word;
  text-align: left;
  word-break: keep-all;
}

.map-layout {
  align-items: start;
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
  margin: 0 auto;
  width: 100%;
}

.map-panel {
  box-sizing: border-box;
  max-height: 720px;
  overflow: auto;
  padding: 24px;
  width: 100%;
}

.map-panel h2 {
  line-height: 1.25;
  margin: 0 0 8px;
  word-break: keep-all;
}

.map-panel p {
  line-height: 1.65;
  margin: 0 0 20px;
  word-break: keep-all;
}

.map-card {
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
}

.map-header {
  align-items: flex-start;
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(180px, auto) minmax(0, 1fr);
  padding: 22px 24px;
}

.map-header h3 {
  line-height: 1.35;
  margin: 0;
  white-space: nowrap;
}

.legend {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  justify-content: flex-end;
  min-width: 0;
}

.legend > span {
  white-space: nowrap;
}

.category-filters {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 20px;
}

.category-filters button {
  align-items: center;
  border-radius: 12px;
  display: inline-flex;
  gap: 8px;
  justify-content: flex-start;
  min-height: 40px;
  padding: 9px 11px;
  white-space: nowrap;
}
.category-filters button.active {
  background: #0b74b2;
  border-color: #0b74b2;
  color: #ffffff;
}

.category-dot,
.place-dot {
  border-radius: 999px;
  display: inline-block;
  flex: 0 0 auto;
}

.category-dot {
  height: 10px;
  width: 10px;
}

.selected-card {
  background: #f8fbff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  margin-bottom: 24px;
  overflow: hidden;
  text-align: left;
}

.selected-card img {
  aspect-ratio: 16 / 9;
  height: auto;
  object-fit: cover;
  width: 100%;
}

.selected-content {
  padding: 18px;
}

.selected-category {
  color: #0b74b2;
  display: block;
  font-size: 0.8rem;
  font-weight: 800;
  margin-bottom: 8px;
}

.selected-content h3 {
  color: #0f1724;
  font-size: 1.05rem;
  margin: 0 0 10px;
}

.selected-content p {
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 14px;
}

.direction-link {
  color: #0b74b2;
  font-weight: 800;
}

.place-list {
  display: grid;
  gap: 8px;
}

.place-item {
  align-items: flex-start;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  gap: 10px;
  padding: 12px;
  text-align: left;
  width: 100%;
}

.place-item.active,
.place-item:hover {
  border-color: rgba(11, 116, 178, 0.35);
  background: #f4f9ff;
}

.place-dot {
  height: 9px;
  margin-top: 7px;
  width: 9px;
}

.place-item strong {
  color: #0f1724;
  display: block;
  font-size: 0.92rem;
  line-height: 1.35;
}

.place-item small {
  color: #64748b;
  display: -webkit-box;
  font-size: 0.8rem;
  line-height: 1.45;
  margin-top: 4px;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.map-wrapper {
  background: #eaf4f7;
  position: relative;
  border-radius: 18px;
  box-shadow: inset 0 0 0 1px rgba(52, 94, 112, 0.08);
  overflow: hidden;
}

.map-wrapper::before {
  background:
    radial-gradient(circle at 18% 24%, rgba(40, 181, 170, 0.16), transparent 24%),
    radial-gradient(circle at 74% 36%, rgba(58, 143, 202, 0.2), transparent 22%),
    radial-gradient(circle at 52% 78%, rgba(92, 201, 174, 0.14), transparent 26%);
  content: '';
  inset: 0;
  mix-blend-mode: multiply;
  pointer-events: none;
  position: absolute;
  z-index: 1;
}

.map-wrapper::after {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.22) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.18) 1px, transparent 1px);
  background-size: 32px 32px;
  content: '';
  inset: 0;
  opacity: 0.22;
  pointer-events: none;
  position: absolute;
  z-index: 2;
}

#map {
  filter: saturate(0.72) contrast(0.88) brightness(1.08);
  height: 560px;
  width: 100%;
  z-index: 0;
}

.map-state {
  align-items: center;
  background: rgba(255, 255, 255, 0.88);
  color: #475569;
  display: flex;
  font-weight: 700;
  inset: 0;
  justify-content: center;
  position: absolute;
  text-align: center;
  z-index: 10;
}

.map-state.error {
  color: #ba1a1a;
}

:global(.leaflet-tile-pane) {
  opacity: 0.74;
}

:global(.leaflet-overlay-pane svg) {

  filter: drop-shadow(0 5px 10px rgba(31, 83, 110, 0.18));
}

:global(.illustration-marker) {
  filter: drop-shadow(0 6px 10px rgba(21, 87, 122, 0.22));
  stroke-dasharray: 1 0;
}

:global(.leaflet-control-zoom a),
:global(.leaflet-control-attribution) {
  border-color: rgba(67, 100, 118, 0.12) !important;
  color: #1f5268 !important;
}


:global(.place-cluster) {
  align-items: center;
  background: rgba(11, 116, 178, 0.82);
  border: 3px solid rgba(248, 251, 255, 0.94);
  border-radius: 999px;
  box-shadow:
    0 8px 18px rgba(21, 87, 122, 0.24),
    0 0 0 9px rgba(11, 116, 178, 0.13);
  color: #ffffff;
  display: flex;
  font-size: 13px;
  font-weight: 800;
  justify-content: center;
}

:global(.place-cluster span) {
  line-height: 1;
}
:global(.leaflet-popup-content-wrapper) {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(32, 87, 112, 0.12);
  border-radius: 12px;
  box-shadow: 0 14px 30px rgba(28, 70, 92, 0.18);
}

:global(.leaflet-popup-tip) {
  background: rgba(255, 255, 255, 0.92);
}

:global(.map-popup) {
  min-width: 180px;
}

:global(.map-popup strong) {
  color: #0f1724;
  display: block;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 4px;
}

:global(.map-popup span) {
  color: #0b74b2;
  display: block;
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 6px;
}

:global(.map-popup p) {
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
}

@media (max-width: 768px) {
  .map-section {
    padding: 32px 16px 64px;
  }

  .section-heading {
    gap: 12px;
    grid-template-columns: 1fr;
  }

  .section-description {
    max-width: none;
  }

  .map-layout {
    grid-template-columns: 1fr;
  }

  .map-panel {
    max-height: none;
    padding: 22px;
  }

  .map-header {
    grid-template-columns: 1fr;
  }

  .map-header h3 {
    white-space: normal;
  }

  .legend {
    justify-content: flex-start;
  }

  #map {
    height: 460px;
  }
}
</style>
