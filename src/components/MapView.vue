<template>
  <main class="map-page" :class="{ embedded }">
    <section class="map-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Seoulog</p>
          <h1>서울 관광 지도</h1>
        </div>
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

const { embedded } = defineProps({
  embedded: { type: Boolean, default: false }
})

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
const koreaBounds = L.latLngBounds([33.0, 124.0], [38.8, 131.0])

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
    minZoom: 7,
    maxBounds: koreaBounds,
    maxBoundsViscosity: 1,
    zoomControl: true,
    preferCanvas: true
  })

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    minZoom: 7,
    bounds: koreaBounds,
    noWrap: true,
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
.map-page { width:100%; height: 100%; background:#f7f8fa; }
.map-section { width:min(1320px,calc(100% - 40px)); margin:0 auto; padding:48px 0 76px; }
.section-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:50px; margin-bottom:28px; }
.section-heading h1 { margin:0; font-size:36px; line-height:1.25; }
.section-description { max-width:610px; margin:0; color:#6b7684; font-size:14px; line-height:1.7; }
.map-layout { display:grid; grid-template-columns:330px minmax(0,1fr); gap:16px; align-items:stretch; }
.panel,.map-card { border:1px solid #e5e8eb; border-radius:8px; background:#fff; box-shadow:0 6px 22px rgba(15,23,42,.06); }
.map-panel { height:650px; padding:20px; overflow-y:auto; scrollbar-width:thin; }
.map-panel h2 { margin:0 0 7px; font-size:19px; }
.map-panel > p { margin:0 0 17px; color:#8b95a1; font-size:12px; line-height:1.6; }
.category-filters { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:7px; margin-bottom:18px; }
.category-filters button { display:flex; align-items:center; gap:7px; min-width:0; min-height:39px; padding:0 9px; border:1px solid #e5e8eb; border-radius:8px; background:#fff; color:#4e5968; cursor:pointer; font-size:12px; font-weight:700; white-space:nowrap; }
.category-filters button:hover { background:#f7f9fc; }
.category-filters button.active { border-color:#3182f6; background:#eaf3ff; color:#1b64da; }
.category-dot,.place-dot,.dot { display:inline-block; flex:0 0 auto; border-radius:50%; }
.category-dot { width:8px; height:8px; }
.summary-card { display:flex; align-items:baseline; gap:8px; margin-bottom:16px; padding:14px 15px; border-radius:8px; background:#f2f7ff; }
.summary-card strong { color:#3182f6; font-size:25px; }
.summary-card span { color:#6b7684; font-size:11px; }
.selected-card { margin-bottom:15px; overflow:hidden; border:1px solid #e5e8eb; border-radius:8px; background:#fff; }
.selected-card img { width:100%; aspect-ratio:16/9; object-fit:cover; }
.selected-content { padding:14px; }
.selected-category { display:block; margin-bottom:5px; color:#3182f6; font-size:10px; font-weight:800; }
.selected-content h3 { margin:0 0 7px; font-size:15px; line-height:1.4; }
.selected-content p { margin:0 0 9px; color:#8b95a1; font-size:11px; line-height:1.5; }
.direction-link { color:#3182f6; font-size:11px; font-weight:800; }
.place-list { display:grid; gap:6px; }
.place-item { display:flex; align-items:flex-start; gap:9px; width:100%; padding:10px; border:1px solid transparent; border-radius:8px; background:#fff; cursor:pointer; text-align:left; }
.place-item:hover,.place-item.active { border-color:#b5d4ff; background:#f4f8ff; }
.place-dot { width:8px; height:8px; margin-top:5px; }
.place-item strong { display:block; color:#333d4b; font-size:12px; line-height:1.35; }
.place-item small { display:-webkit-box; margin-top:3px; overflow:hidden; color:#8b95a1; font-size:10px; line-height:1.4; -webkit-box-orient:vertical; -webkit-line-clamp:1; }
.map-card { display:flex; min-width:0; min-height:650px; flex-direction:column; overflow:hidden; }
.map-header { display:flex; align-items:center; justify-content:space-between; gap:18px; min-height:68px; padding:14px 18px; border-bottom:1px solid #e5e8eb; }
.map-header h3 { margin:0; font-size:14px; white-space:nowrap; }
.legend { display:flex; justify-content:flex-end; gap:6px 12px; overflow:hidden; color:#8b95a1; font-size:9px; }
.legend > span { display:inline-flex; align-items:center; gap:4px; white-space:nowrap; }
.dot { width:6px; height:6px; }
.map-wrapper { position:relative; flex:1; min-height:0; overflow:hidden; background:#eaf0f5; }
#map { width:100%; height:580px; filter:saturate(.86) contrast(.96); }
.map-state { position:absolute; inset:0; z-index:10; display:grid; place-items:center; background:rgba(255,255,255,.9); color:#6b7684; font-size:13px; font-weight:700; }
.map-state.error { color:#d14343; }
:global(.place-cluster) { display:flex; align-items:center; justify-content:center; border:3px solid #fff; border-radius:50%; background:#3182f6; color:#fff; box-shadow:0 7px 18px rgba(49,130,246,.3),0 0 0 7px rgba(49,130,246,.12); font-size:12px; font-weight:850; }
:global(.illustration-marker) { filter:drop-shadow(0 4px 7px rgba(15,23,42,.25)); }
:global(.leaflet-popup-content-wrapper) { border-radius:8px; box-shadow:0 14px 35px rgba(15,23,42,.18); }
:global(.map-popup) { min-width:180px; }
:global(.map-popup strong) { display:block; margin-bottom:3px; color:#191f28; font-size:13px; }
:global(.map-popup span) { display:block; margin-bottom:5px; color:#3182f6; font-size:10px; font-weight:800; }
:global(.map-popup p) { margin:0; color:#6b7684; font-size:11px; line-height:1.45; }
.map-page.embedded { height:100%; min-height:0; background:#fff; }
.map-page.embedded .map-section,.map-page.embedded .map-layout,.map-page.embedded .map-card { height:100%; }
.map-page.embedded .map-section { width:100%; padding:0; }
.map-page.embedded .section-heading { display:none; }
.map-page.embedded .map-layout { grid-template-columns:minmax(210px,270px) minmax(0,1fr); gap:0; }
.map-page.embedded .map-panel { height:100%; border:0; border-right:1px solid #e5e8eb; border-radius:0; box-shadow:none; padding:14px; }
.map-page.embedded .map-card { min-height:0; border:0; border-radius:0; box-shadow:none; }
.map-page.embedded #map { height:100%; }
@media(max-width:900px) {
  .section-heading { align-items:flex-start; flex-direction:column; gap:10px; }
  .map-layout { grid-template-columns:1fr; }
  .map-panel { height:auto; max-height:520px; }
  .map-card { min-height:560px; }
}
@media(max-width:640px) {
  .map-section { width:min(100% - 24px,1320px); padding:32px 0 55px; }
  .section-heading h1 { font-size:29px; } .section-description { font-size:13px; }
  .map-panel { padding:16px; }
  .map-header { align-items:flex-start; flex-direction:column; min-height:auto; }
  .legend { justify-content:flex-start; flex-wrap:wrap; }
  #map { height:480px; }
}
</style>