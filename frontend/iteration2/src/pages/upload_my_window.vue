<template>
  <Header />

  <!-- ========== Hero (only when results are hidden) ========== -->
  <div class="hero" v-if="!showResults">
    <h1 class="hero-title">Upload My Window</h1>
    <p class="hero-subtitle">
      Share a photo from your window to discover if your area is green enough and see whether you live in a hotter or cooler spot compared to other suburbs.
    </p>

    <!-- Decorative 3D carousel -->
    <div class="carousel">
      <div
        v-for="(img, i) in images"
        :key="i"
        class="slide"
        :class="slideClass(i)"
        :style="{ backgroundImage: `url(${img.src})` }"
        role="img"
        :aria-label="img.alt"
      />
    </div>

    <div class="cta-row">
      <button class="btn primary" @click="openModal">Upload My Window</button>
      <a
        class="btn secondary"
        href="https://planitgeo.com/library/urban-forestrys-new-benchmark-the-330300-rule/"
        target="_blank"
        rel="noopener"
      >
        What is 3-30-300
      </a>
    </div>
  </div>

  <!-- ========== Upload + Address Modal ========== -->
  <div v-if="showModal" class="modal-overlay" @click.self="closeModal()">
    <div class="modal">
      <div class="modal-header">
        <div class="steps">
          <span :class="['dot', modalStep===1?'active':'']">1</span>
          <span class="dash" />
          <span :class="['dot', modalStep===2?'active':'']">2</span>
        </div>
        <button class="icon-btn" aria-label="Close" @click="closeModal()">×</button>
      </div>

      <!-- Step 1: choose photo + consent -->
      <div v-if="modalStep===1" class="modal-body">
        <h3 class="modal-title">Upload a photo</h3>
        <p class="modal-subnote">
          We assume your upload relates to a CBD suburb or intended area.
          Uploading an incorrect picture may lead to misleading results.
        </p>

        <div class="upload-box">
          <div v-if="previewUrl" class="preview">
            <img :src="previewUrl" alt="preview" />
          </div>
          <div v-else class="placeholder">
            <span class="ph-icon">📷</span>
            <p>Select a photo (JPG/PNG)</p>
          </div>

          <label class="upload-button">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              @change="onFileSelected"
              hidden
            />
            Choose Photo
          </label>
        </div>

        <label class="consent">
          <input type="checkbox" v-model="allowShow" :disabled="loading" />
          <span class="modal-subnote">
            By consenting, you allow us to store your information under our 
            <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
            and 
            <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
          </span>
        </label>

        <button
          class="fab-next"
          :disabled="!file || loading"
          @click="modalStep=2"
          title="Next"
          aria-label="Next"
        >
          <span v-if="!loading">➜</span>
          <span v-else class="spinner"></span>
        </button>
      </div>

      <!-- Step 2: address + submit -->
      <div v-else-if="modalStep===2" class="modal-body">
        <h3 class="modal-title">Enter your address</h3>

        <div class="autocomplete">
          <input
            class="text-input"
            type="text"
            placeholder="Type your address"
            v-model.trim="address"
            :disabled="loading"
            @input="onAddressInput"
            @focus="handleAddressFocus"
            @blur="onAddressBlur"
            autocomplete="off"
          />
          <ul v-if="predOpen && predictions.length" class="pred-list">
            <li
              v-for="p in predictions"
              :key="(p as any).place_id || (p as any).placeId"
              class="pred-item"
              @mousedown.prevent="selectPrediction(p as any)"
            >
              <span class="pred-main">
                {{ (p as any).structured_formatting?.main_text
                    || ((p as any).description || (p as any).text?.text || '').split(',')[0] }}
              </span>
              <span class="pred-secondary">
                {{ (p as any).structured_formatting?.secondary_text
                    || ((p as any).description || (p as any).text?.text || '').split(',').slice(1).join(', ').trim() }}
              </span>
            </li>
          </ul>
        </div>

        <button
          class="btn primary full"
          :disabled="!address || !file || loading"
          @click="handleSeeMyScore"
        >
          <span v-if="!loading">See my score</span>
          <span v-else class="loading-combo">
            <span class="shimmer-text">Working</span><span class="dotdotdot"></span>
          </span>
        </button>

        <div v-if="loading" class="micro-progress"><div class="micro-bar"></div></div>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </div>
  </div>

  <!-- ========== Results ========== -->
  <div v-if="showResults" class="results">
    <!-- Simple headline (no gradient box, no emojis) -->
    <div class="results-actions">
      <div class="results-headline">
        <div class="headline-text">{{ summaryText }}</div>
        <div class="headline-sub">environment assessment result</div>
      </div>
      <div class="actions-right">
        <button class="btn secondary" @click="backToIntro">Back</button>
      </div>
    </div>

    <!-- Two columns: image (left) + cards (right) with fade-in -->
    <div class="results-grid">
      <div class="panel image-panel fade-in-left">
        <img :src="previewUrl" alt="Your window" />
      </div>

      <div class="panel fade-in-right">
        <div class="cards-mini">
          <!-- ========== 3: visible trees (icon uses 3-state; background still pass/fail) ========== -->
          <div class="card mini" :class="{ ok: treesOK, bad: !treesOK, show: showTips3 }">
            <div class="mini-inner">
              <div class="mini-head">
                <span class="mini-title">Tree Visible</span>
                <span class="info-dot" aria-label="At least 3 trees should be visible" title="At least 3 trees should be visible">i</span>
                <!-- CHANGED: use computed treeIcon for 3-state image -->
                <img class="side-icon" :src="treeIcon" alt="3-rule" />
              </div>

              <div class="mini-value">
                <template v-if="typeof treesCount==='number'">
                  <strong :class="!treesOK ? 'fail-leading' : ''">{{ treesCount }}</strong>
                  <template v-if="!treesOK">
                    <span class="unit">/ 3</span>
                    <span class="unit"> trees</span>
                  </template>
                  <template v-else>
                    <span class="unit">{{ treesCount === 1 ? ' Tree' : ' Trees' }}</span>
                  </template>

                  <!-- New: status pill -->
                  <template v-if="treesOK">
                    <span class="passed-label">passed</span>
                  </template>
                  <template v-else-if="treesHalf">
                    <span class="almost-label">Almost There</span>
                  </template>
                  <template v-else>
                    <span class="failed-label">Failed</span>
                  </template>
                </template>
                <template v-else>—</template>
              </div>

              <div class="mini-sub">from your window</div>

              <GoalBar
                v-if="typeof treesCount==='number' && treesCount < 3"
                :value="treesCount"
                :goal="3"
                mode="gte"
              />

              <button class="mini-expand" @click="showTips3 = true">
                <span>See what you can do</span><span class="chev">▾</span>
              </button>
            </div>

            <div class="mini-overlay">
              <div class="mini-ov-body">
                <p>Create greener spaces from your hands. Snap your plant, get a health score, and follow smart tips to keep it thriving</p>
                <div class="mini-ov-actions">
                  <RouterLink class="btn primary" :to="{ name: 'plant_health' }">Check Plant Health</RouterLink>
                  <button class="btn ghost" @click="showTips3 = false">Back</button>
                </div>
              </div>
            </div>
          </div>

          <!-- ========== 30: canopy cover (icon uses 3-state; background still pass/fail if available) ========== -->
          <div class="card mini" :class="{ ok: pass30, bad: !pass30 && canopyAvailable, show: showTips30 }">
            <div class="mini-inner">
              <div class="mini-head">
                <span class="mini-title">Canopy Cover</span>
                <span class="info-dot" aria-label="Aim for 30% canopy cover" title="Aim for 30% canopy cover">i</span>
                <!-- CHANGED: use computed canopyIcon for 3-state image -->
                <img class="side-icon" :src="canopyIcon" alt="30-rule" />
              </div>

              <div class="mini-value">
                <template v-if="canopyAvailable">
                  <strong :class="!pass30 ? 'fail-leading' : ''">{{ canopyDisplay }}</strong>
                  <template v-if="!pass30">
                    <span class="unit">/ 30%</span>
                  </template>
                  <template v-else>
                    <span class="unit">%</span>
                  </template>

                  <!-- New: status pill -->
                  <template v-if="pass30">
                    <span class="passed-label">passed</span>
                  </template>
                  <template v-else-if="canopyHalf">
                    <span class="almost-label">Almost There</span>
                  </template>
                  <template v-else>
                    <span class="failed-label">Failed</span>
                  </template>
                </template>
                <template v-else>
                  <strong>—</strong>
                  <span class="failed-label">Failed</span>
                </template>
              </div>


              <div class="mini-sub">
                <template v-if="canopyAvailable && canopyArea">from {{ canopyArea }}</template>
                <template v-else-if="canopyAvailable">from your area<span v-if="addressShort"> — {{ addressShort }}</span></template>
                <template v-else>Outside Melbourne CBD — canopy not available</template>
              </div>

              <GoalBar
                v-if="canopyAvailable && typeof canopy==='number' && canopy < 30"
                :value="canopy || 0"
                :goal="30"
                mode="gte"
              />

              <button class="mini-expand" @click="showTips30 = true">
                <span>See what you can do</span><span class="chev">▾</span>
              </button>
            </div>

            <div class="mini-overlay">
              <div class="mini-ov-body">
                <p>Urban heat is rising. Discover hot spots in your neighborhood and take action to grow a greener, cooler community.</p>
                <div class="mini-ov-actions">
                  <RouterLink class="btn primary" :to="{ name: 'heatmap' }">Check your area heat</RouterLink>
                  <button class="btn ghost" @click="showTips30 = false">Back</button>
                </div>
              </div>
            </div>
          </div>

          <!-- ========== 300: nearest park distance (icon uses 3-state; background still pass/fail) ========== -->
          <div class="card mini" :class="{ ok: pass300, bad: !pass300, show: showTips300 }">
            <div class="mini-inner">
              <div class="mini-head">
                <span class="mini-title">Nearest Park</span>
                <span class="info-dot" aria-label="Target is within 300 meters" title="Target is within 300 meters">i</span>
                <!-- CHANGED: use computed distIcon for 3-state image -->
                <img class="side-icon" :src="distIcon" alt="300-rule" />
              </div>

              <div class="mini-value">
                <strong :class="!pass300 ? 'fail-leading' : ''">{{ parkDistance }}</strong>
                <template v-if="!pass300">
                  <span class="unit">/ 300</span><span class="unit"> Meters</span>
                </template>
                <template v-else>
                  <span class="unit"> Meters</span>
                </template>

                <!-- New: status pill -->
                <template v-if="pass300">
                  <span class="passed-label">passed</span>
                </template>
                <template v-else-if="parkHalf">
                  <span class="almost-label">Almost There</span>
                </template>
                <template v-else>
                  <span class="failed-label">Failed</span>
                </template>
              </div>


              <div class="mini-sub">
                <template v-if="nearestParkName && parkLink">
                  <a class="park-link" :href="parkLink" target="_blank" rel="noopener">
                    {{ nearestParkName }}
                  </a>
                </template>
                <template v-else>from your house</template>
              </div>

              <GoalBar
                v-if="typeof parkDistance==='number' && parkDistance > 300"
                :value="parkDistance"
                :goal="300"
                mode="lte"
              />

              <button class="mini-expand" @click="showTips300 = true">
                <span>See what you can do</span><span class="chev">▾</span>
              </button>
            </div>

            <div class="mini-overlay">
              <div class="mini-ov-body">
                <p>Your voice matters in shaping Melbourne. Request more green space in your area directly to the government</p>
                <div class="mini-ov-actions">
                  <a
                    class="btn primary"
                    href="https://services.melbourne.vic.gov.au/report/treemaintenance"
                    target="_blank"
                    rel="noopener"
                  >Contact Council</a>
                  <button class="btn ghost" @click="showTips300 = false">Back</button>
                </div>
              </div>
            </div>
          </div>
        </div> <!-- /cards-mini -->
      </div>
    </div>
  </div>

  <Footer />

  <!-- lightweight toast -->
  <div class="toast" :class="[toastVisible ? 'on' : '', toastType]" role="status" aria-live="polite">
    {{ toastMessage }}
  </div>
</template>

<script setup lang="ts">
/**
 * This version adds 3-state icons (pass / half / not passed) for 3-30-300 rules.
 * - We import 3 extra "not passed" icons and compute which one to show per card.
 * - Card background classes remain pass/fail to keep previous look-and-feel.
 */
import { onMounted, onUnmounted, ref, computed, defineComponent, h } from 'vue'
import type { PropType } from 'vue'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'

/* ---------- API endpoints (S3 direct upload + fallback) ---------- */
const API_BASE = 'https://oelkz0pl2c.execute-api.ap-southeast-2.amazonaws.com/default'
const SIGN_URL = `${API_BASE}/sign-upload`
const MODERATE_URL = `${API_BASE}/moderate-object`
const DELETE_URL = `${API_BASE}/delete-object`
const UPLOADER_URL = `${API_BASE}/upload-image` // fallback
const ANALYZER_URL = 'https://2piqweol0f.execute-api.ap-southeast-2.amazonaws.com/analyze'

/* ---------- Static images: carousel ---------- */
import img23 from '@/assets/image 130.png'
import img27 from '@/assets/image 131.png'
import img28 from '@/assets/image 132.png'

/* ---------- Side icons: pass / half / NOT passed (NEW) ---------- */
// Trees (3-rule)
import icon3Pass from '@/assets/3 passed icon.png'
import icon3Half from '@/assets/3 half passed icon.png'
import icon3Not  from '@/assets/3 not passed icon.png'
// Canopy (30-rule)
import icon30Pass from '@/assets/30 passed icon.png'
import icon30Half from '@/assets/30 half passed icon.png'
import icon30Not  from '@/assets/30 not passed icon.png'
// Distance (300-rule)
import icon300Pass from '@/assets/300 passed icon.png'
import icon300Half from '@/assets/300 half passed icon.png'
import icon300Not  from '@/assets/300 not passed icon.png'

/* ---------- carousel state ---------- */
const images = [
  { src: img23, alt: 'Window 1' },
  { src: img27, alt: 'Window 2' },
  { src: img28, alt: 'Window 3' }
]
const active = ref(0)
let heroTimer: number | undefined
onMounted(() => { heroTimer = window.setInterval(() => { active.value = (active.value + 1) % images.length }, 3000); ensureAutocomplete().catch(() => {})})
async function handleAddressFocus() {
  predOpen.value = true
  if (!mapsReady.value) {
    try {
      await ensureAutocomplete()

      if ((lastQuery.value || '').trim().length > 0) {
        fetchPredictions(lastQuery.value.trim())
      }
    } catch {}
  }
}
onUnmounted(() => {
  if (heroTimer) window.clearInterval(heroTimer)
  if (predTimer) window.clearTimeout(predTimer)
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
function slideClass(i: number) {
  const prev = (active.value - 1 + images.length) % images.length
  const next = (active.value + 1) % images.length
  return { center: i === active.value, left: i === prev, right: i === next, hidden: !(i === active.value || i === prev || i === next) }
}

/* ---------- Modal state ---------- */
const showModal = ref(false)
const modalStep = ref<1 | 2>(1)
function openModal() { showModal.value = true; modalStep.value = 1 }
function closeModal(force = false) { if (loading.value && !force) return; showModal.value = false }

/* ---------- Upload & analysis state ---------- */
const file = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const allowShow = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

/* ---------- Results ---------- */
const showResults = ref(false)
const treesCount = ref<number | null>(null)

/* Pass/fail booleans preserved for background color (OK/BAD) */
const treesOK = computed(() => (typeof treesCount.value === 'number' ? treesCount.value >= 3 : false))

// --- Half-pass flags (add these) ---
const treesHalf  = computed(() =>
  typeof treesCount.value === 'number' && treesCount.value > 0 && treesCount.value < 3
)
const canopyHalf = computed(() =>
  canopyAvailable.value && (canopy.value as number) >= 15 && (canopy.value as number) < 30
)
const parkHalf   = computed(() =>
  typeof parkDistance.value === 'number' && parkDistance.value > 300 && parkDistance.value <= 600
)

/* ---------- NEW: 3-state icon selection (pass / half / not) ---------- */
/** Trees icon:
 *  - >=3  -> pass
 *  - 1..2 -> half
 *  - 0 or not detected -> not passed
 */
const treeIcon = computed(() => {
  if (typeof treesCount.value === 'number') {
    if (treesCount.value >= 3) return icon3Pass
    if (treesCount.value > 0)  return icon3Half
    return icon3Not
  }
  return icon3Not
})

/** Canopy derived / display */
const canopy = ref<number | null>(null) // null => outside CBD (no data)
const canopyArea = ref<string>('')

/** Available means we have a number; still can be 0 */
const canopyAvailable = computed(() => typeof canopy.value === 'number' && !Number.isNaN(canopy.value))
/** Two-decimals number or '—' */
const canopyDisplay = computed(() => canopyAvailable.value ? (canopy.value as number).toFixed(2) : '—')
/** Original pass (>=30) used for background color */
const pass30 = computed(() => canopyAvailable.value && (canopy.value as number) >= 30)
/** NEW: Canopy icon with 3 states:
 *  - >=30% -> pass
 *  - 15%.. <30% -> half
 *  - 0% or no data (outside CBD) -> not passed
 */
const canopyIcon = computed(() => {
  if (!canopyAvailable.value) return icon30Not
  const v = canopy.value as number
  if (v >= 30) return icon30Pass
  if (v >= 15) return icon30Half
  return icon30Not
})

/** Park distance + names */
const parkDistance = ref<number>(9999)
const nearestParkName = ref<string>('')
const nearestParkLat = ref<number | null>(null)
const nearestParkLng = ref<number | null>(null)
const nearestParkPlaceId = ref<string | null>(null)

/** Original pass (<=300) used for background color */
const pass300 = computed(() => parkDistance.value <= 300)
/** NEW: Distance icon with 3 states:
 *  - <=300m -> pass
 *  - (300, 600] -> half
 *  - >600m -> not passed
 */
const distIcon = computed(() => {
  const d = Number(parkDistance.value || 0)
  if (d <= 300) return icon300Pass
  if (d <= 600) return icon300Half
  return icon300Not
})

/** Summary line preserved */
const passes = computed(() => {
  let n = 0
  n += treesOK.value ? 1 : 0
  if (canopyAvailable.value) n += pass30.value ? 1 : 0
  n += pass300.value ? 1 : 0
  return n
})
const summaryText = computed(() => passes.value >= 2
  ? 'Congratulations — you live in a healthy green environment.'
  : 'Looks like your area needs more green space.'
)

/** Park link preserved */
const parkLink = computed(() => {
  const name = nearestParkName.value?.trim()
  const pid = nearestParkPlaceId.value?.trim() || ''
  const plat = nearestParkLat.value
  const plng = nearestParkLng.value
  if (name && pid) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${encodeURIComponent(pid)}`
  if (plat != null && plng != null) return `https://www.google.com/maps/search/?api=1&query=${plat},${plng}`
  if (name) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`
  return ''
})

/** Address short preserved */
const address = ref<string>('')
const addressShort = computed(() => {
  const a = (address.value || '').trim()
  if (!a) return ''
  const parts = a.split(',').map(s => s.trim()).filter(Boolean)
  if (parts.length >= 2) return parts.slice(-2).join(', ')
  return parts[0] || ''
})

/* ---------- Google & data sources ---------- */
const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string
const SB_URL   = import.meta.env.VITE_SUPABASE_URL as string
const SB_KEY   = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const predictions = ref<any[]>([])
const predOpen = ref<boolean>(false)
const lat = ref<number | null>(null)
const lng = ref<number | null>(null)

/* Google Places bootstrap (unchanged) */
let googleLoaded = false
let autoService: any = null
let detailsService: any = null
let sessionToken: any = null
function loadGoogleMaps() {
  return new Promise<void>((resolve, reject) => {
    if (googleLoaded && (window as any).google) return resolve()
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=places,geometry&v=quarterly`
    s.async = true
    s.onerror = () => reject(new Error('Failed to load Google Maps JS'))
    s.onload = () => { googleLoaded = true; resolve() }
    document.head.appendChild(s)
  })
}
const mapsReady = ref(false)
const lastQuery = ref('')

async function ensureAutocomplete() {
  await loadGoogleMaps()
  const g = (window as any).google
  if (!autoService) autoService = new g.maps.places.AutocompleteService()
  if (!detailsService) detailsService = new g.maps.places.PlacesService(document.createElement('div'))
  if (!sessionToken) sessionToken = new g.maps.places.AutocompleteSessionToken()
  mapsReady.value = true
}
let predTimer: number | null = null
function onAddressInput() {
  error.value = null
  if (predTimer) window.clearTimeout(predTimer)
  const q = address.value
  lastQuery.value = q
  if (!q) { predictions.value = []; return }
  predTimer = window.setTimeout(() => fetchPredictions(q), 220)
}
async function fetchPredictions(q: string) {
  try {
    await ensureAutocomplete()
    const g = (window as any).google
    autoService!.getPlacePredictions({ input: q, sessionToken: sessionToken! }, (res: any, status: any) => {
      if (status !== g.maps.places.PlacesServiceStatus.OK || !res) { predictions.value = []; return }
      predictions.value = res
    })
  } catch { predictions.value = [] }
}
async function selectPrediction(p: any) {
  try {
    await ensureAutocomplete()
    const g = (window as any).google
    const req = { placeId: (p as any).place_id || (p as any).placeId, fields: ['geometry'] }
    detailsService!.getDetails(req as any, (place: any, status: any) => {
      if (status !== g.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) { error.value = 'Failed to resolve address location.'; return }
      address.value = (p as any).description || (p as any).text?.text || address.value
      lat.value = place.geometry.location.lat()
      lng.value = place.geometry.location.lng()
      predictions.value = []
      predOpen.value = false
    })
  } catch { error.value = 'Failed to resolve address.' }
}
function onAddressBlur() { setTimeout(() => { predOpen.value = false }, 120) }

/* ---------- Helper: parse Lambda proxy response ---------- */
async function parseMaybeLambdaProxyResponse(res: Response) {
  const data = await res.json().catch(() => null)
  if (!data) return null
  if ('statusCode' in (data as any) && 'body' in (data as any) && typeof (data as any).body === 'string') {
    try { return JSON.parse((data as any).body) } catch { return data }
  }
  return data
}

/* ---------- Toast ---------- */
const toastVisible = ref(false)
const toastMessage = ref('')
const toastType = ref<'info' | 'success' | 'error'>('info')
let toastTimer: number | null = null
function showToast(msg: string, type: 'info' | 'success' | 'error' = 'info', ms = 2800) {
  toastMessage.value = msg; toastType.value = type; toastVisible.value = true
  if (toastTimer) window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toastVisible.value = false; toastTimer = null }, ms)
}

/* ---------- Main flow: upload → moderate → analyze → canopy/park ---------- */
async function sha256OfFile(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/* File pick (JPG/PNG) */
function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0] ?? null
  error.value = null
  treesCount.value = null
  showResults.value = false

  if (!f) {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
    file.value = null
    return
  }
  const ok = /\.(jpe?g|png)$/i.test(f.name) || /^image\//i.test(f.type)
  if (!ok) {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
    file.value = null
    error.value = 'Only JPG and PNG are allowed.'
    return
  }
  file.value = f
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(f)
}

async function handleSeeMyScore() {
  error.value = null
  treesCount.value = null
  showResults.value = false

  if (!file.value) { error.value = 'Please choose a JPG or PNG file.'; return }
  if (!address.value.trim()) { error.value = 'Please enter your address.'; return }
  if (lat.value == null || lng.value == null) { error.value = 'Please pick an address from suggestions.'; return }
  if (!GMAPS_KEY || !SB_URL || !SB_KEY) { error.value = 'Missing API keys or endpoints. Please check environment variables.'; return }

  loading.value = true
  let uploadedBucket = ''
  let uploadedKey = ''
  let didDelete = false

  try {
    /* 1) Direct-to-S3 with content hashing (dedupe at server) */
    try {
      const contentHash = await sha256OfFile(file.value!);
      const isPng = file.value!.name?.toLowerCase().endsWith('.png');

      const signRes = await fetch(SIGN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder: 'YourWindow',
          content_type: file.value!.type || 'image/jpeg',
          ext_hint: isPng ? '.png' : '.jpg',
          content_hash: contentHash,
        })
      });
      if (!signRes.ok) throw new Error(`sign-upload failed (${signRes.status})`);
      const { bucket, key, presigned, exists } = await signRes.json();

      if (exists) {
        uploadedBucket = bucket;
        uploadedKey = key;
      } else {
        const fd = new FormData();
        Object.entries(presigned.fields).forEach(([k, v]) => fd.append(k, v as string));
        fd.append('file', file.value!);
        const s3Res = await fetch(presigned.url, { method: 'POST', body: fd });
        if (!s3Res.ok) throw new Error('Upload to S3 failed');

        uploadedBucket = bucket;
        uploadedKey = key;

        const mod = await fetch(MODERATE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket, key })
        });
        if (!mod.ok) {
          const t = await mod.text().catch(() => '');
          throw new Error(t || 'Content moderation failed');
        }
      }
    } catch (e) {
      const form = new FormData();
      form.append('file', file.value!);
      form.append('folder', 'YourWindow');
      const up = await fetch(UPLOADER_URL, { method: 'POST', body: form });
      if (!up.ok) {
        const txt = await up.text().catch(() => '');
        let detail = '';
        try { const j = JSON.parse(txt); detail = (j as any)?.detail ?? ''; } catch {}
        throw new Error(detail || `Upload failed (${up.status})`);
      }
      const upJson = await up.json();
      uploadedBucket = (upJson.bucket || upJson.s3_bucket || upJson.Bucket) as string;
      uploadedKey    = (upJson.key    || upJson.s3_key    || upJson.Key) as string;
      if (!uploadedBucket || !uploadedKey) throw new Error('Upload did not return bucket/key.');
    }

    // 2) analyze
    const payload = { bucket: uploadedBucket, key: uploadedKey, include_details: true, check_compliance: true }
    const an = await fetch(ANALYZER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!an.ok) { const text = await an.text().catch(() => ''); throw new Error(text || `Analyzer failed (${an.status})`) }
    const analyze = (await parseMaybeLambdaProxyResponse(an)) ?? {}
    const count = (analyze as any)?.trees_counted ?? (analyze as any)?.tree_count ?? (analyze as any)?.analysis_details?.tree_count
    treesCount.value = (typeof count === 'number') ? count : null

    // delete image when trees <=3 or non defined (still show results)
    const tc = treesCount.value
    if (!didDelete && (typeof tc !== 'number' || tc <= 3)) {
      await safeDelete(uploadedBucket, uploadedKey)
      didDelete = true
    }

    // 3) canopy + nearest park
    const lon = Number(lng.value)
    const latNum = Number(lat.value)
    const [c30Res, d300Res] = await Promise.allSettled([ getCanopy(lon, latNum), computeNearestParkDistance(lon, latNum) ])
    if (c30Res.status === 'fulfilled') {
      canopy.value = c30Res.value.pct
      canopyArea.value = c30Res.value.area || ''
    } else {
      canopy.value = null
      canopyArea.value = ''
    }
    if (d300Res.status === 'fulfilled') parkDistance.value = d300Res.value

    // 4) delete if user didn't allow display
    if (!didDelete && !allowShow.value) {
      await safeDelete(uploadedBucket, uploadedKey)
      didDelete = true
    }

    // 5) show results
    showResults.value = true
    closeModal(true)

  } catch (e: any) {
    if (!error.value) error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

/* S3 delete helper */
async function safeDelete(bucket: string, key: string, reason?: string) {
  try {
    const del = await fetch(DELETE_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket, key })
    })
    if (!del.ok) {
      console.warn('Delete failed:', await del.text().catch(() => String(del.status)))
      showToast('We couldn’t delete the uploaded image.', 'error')
    } else if (reason) {
      showToast(reason, 'info')
    }
  } catch (e: any) {
    console.warn('Delete error:', e?.message || e)
    showToast('We couldn’t delete the uploaded image.', 'error')
  }
}

/* Supabase RPC: canopy by coordinate (null when outside CBD) */
async function getCanopy(lon: number, latNum: number): Promise<{ pct: number | null; area?: string | null }> {
  const res = await fetch(`${SB_URL}/rest/v1/rpc/get_canopy_cover_by_sub`, {
    method: 'POST',
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_lon: lon, p_lat: latNum })
  })
  if (!res.ok) throw new Error('Canopy RPC failed')
  const data = await res.json()
  const payload = Array.isArray(data) ? (data[0]?.get_canopy_cover_by_sub ?? data[0]) : (data.get_canopy_cover_by_sub ?? data)

  if (!payload || payload.sa2_name21 == null || payload.canopy_pct == null) {
    return { pct: null, area: null } // outside CBD / no data
  }
  return { pct: Number(payload.canopy_pct), area: payload.sa2_name21 ?? null }
}

/* Nearest park (Places Nearby) */
async function computeNearestParkDistance(lon: number, latNum: number): Promise<number> {
  const url = 'https://places.googleapis.com/v1/places:searchNearby'
  const body = {
    includedTypes: ['park'],
    maxResultCount: 1,
    locationRestriction: { circle: { center: { latitude: latNum, longitude: lon }, radius: 5000 } },
    rankPreference: 'DISTANCE'
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GMAPS_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.location'
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error('Nearby search failed')
  const data = await res.json()
  const place = data.places?.[0]
  if (!place?.location) throw new Error('No nearby park found')

  nearestParkName.value = place.displayName?.text || 'Nearest park'
  nearestParkLat.value = place.location.latitude ?? null
  nearestParkLng.value = place.location.longitude ?? null
  nearestParkPlaceId.value = place.id ?? null

  await loadGoogleMaps()
  const g = (window as any).google
  const a = new g.maps.LatLng(latNum, lon)
  const b = new g.maps.LatLng(place.location.latitude, place.location.longitude)
  const d = g.maps.geometry.spherical.computeDistanceBetween(a, b)
  return Math.round(d)
}

/* Reset to initial state */
function resetForNewUpload() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
  file.value = null
  allowShow.value = false
  address.value = ''
  predictions.value = []
  predOpen.value = false
  lat.value = null
  lng.value = null
  canopy.value = null
  canopyArea.value = ''
  parkDistance.value = 9999
  nearestParkName.value = ''
  nearestParkLat.value = null
  nearestParkLng.value = null
  nearestParkPlaceId.value = null
  treesCount.value = null
  error.value = null
  showTips3.value = false
  showTips30.value = false
  showTips300.value = false
}
function backToIntro() { resetForNewUpload(); showResults.value = false; window.scrollTo({ top: 0, behavior: 'smooth' }) }

/* Mini overlays toggles */
const showTips3 = ref(false)
const showTips30 = ref(false)
const showTips300 = ref(false)

/* ---------- Child component: GoalBar ---------- */
const GoalBar = defineComponent({
  name: 'GoalBar',
  props: {
    value: { type: Number, required: true },
    goal:  { type: Number, required: true },
    mode:  { type: String as PropType<'gte' | 'lte'>, required: true }
  },
  setup(props) {
    // For gte (fail case): trackMax = goal * 1.5 so marker sits ~2/3 along the track
    const trackMax = computed(() => props.mode === 'gte' ? props.goal * 1.5 : Math.max(props.value, props.goal))
    const marker = computed(() => (props.goal / trackMax.value) * 100)
    const percent = computed(() => {
      if (props.mode === 'gte') {
        const p = (props.value / trackMax.value) * 100
        return Math.min(p, Math.max(0, marker.value - 1))
      }
      return 100
    })
    return () => h('div', { class: 'goalbar' }, [
      h('div', { class: 'goalbar-track' }, [
        h('div', { class: 'goalbar-fill', style: { width: `${percent.value}%` } }),
        h('div', { class: 'goalbar-marker', style: { left: `${marker.value}%` } }, [
          h('span', { class: 'goalbar-label' }, 'Goal')
        ])
      ])
    ])
  }
})
</script>

<style scoped>
/* ========== Hero ========== */
.hero { max-width: 980px; margin: 32px auto 0; padding: 0 16px; text-align: center; }
.hero-title { color:#064e3b; font-size:36px; font-weight:800; margin:0 0 8px; }
.hero-subtitle { color:#55646a; font-size:14px; max-width:740px; margin:0 auto 18px; line-height:1.5; }

/* 3D carousel */
.carousel { position:relative; height:280px; margin:8px auto 16px; perspective:1000px; overflow:hidden; }
.slide { position:absolute; top:50%; left:50%; width:300px; height:180px; background-size:cover; background-position:center; border-radius:14px; box-shadow:0 10px 30px rgba(0,0,0,.15); transform:translate(-50%,-50%) scale(.6) rotateY(0deg); opacity:0; transition:all .8s ease; }
.slide.center { transform:translate(-50%,-50%) scale(1) rotateY(0); opacity:1; z-index:3; }
.slide.left { transform:translate(calc(-50% - 200px), -50%) scale(.5) rotateY(30deg); opacity:.6; z-index:2; }
.slide.right { transform:translate(calc(-50% + 200px), -50%) scale(.5) rotateY(-30deg); opacity:.6; z-index:2; }
.slide.hidden { opacity:0; z-index:1; }
@media (min-width:900px){ .carousel{height:340px;} .slide{width:420px;height:240px;} .slide.left{transform:translate(calc(-50% - 260px), -50%) scale(.55) rotateY(30deg);} .slide.right{transform:translate(calc(-50% + 260px), -50%) scale(.55) rotateY(-30deg);} }

.cta-row { display:flex; gap:12px; justify-content:center; margin-top:8px; margin-bottom:24px; }
.btn { padding:10px 18px; border-radius:9999px; font-weight:700; font-size:14px; cursor:pointer; border:2px solid #064e3b; transition:all .2s ease; }
.btn.primary{ background:#064e3b; color:#fff; } .btn.primary:hover{ filter:brightness(1.05); }
.btn.secondary{ background:#fff; color:#064e3b; } .btn.secondary:hover{ background:#ecfdf5; }

/* ========== Modal ========== */
.modal-overlay{ position:fixed; inset:0; background:rgba(0,0,0,.35); display:grid; place-items:center; z-index:50; }
.modal{ width:min(720px,92vw); background:#fff; border-radius:16px; padding:16px; box-shadow:0 20px 60px rgba(0,0,0,.25); position:relative; }
.modal-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.icon-btn{ all:unset; font-size:22px; line-height:1; padding:4px 8px; cursor:pointer; color:#374151; }
.steps{ display:inline-flex; align-items:center; gap:10px; }
.dot{ width:28px; height:28px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; border:2px solid #10b981; color:#065f46; font-weight:800; background:#fff; }
.dot.active{ background:#ecfdf5; }
.dash{ width:36px; height:2px; background:#d1fae5; border-radius:2px; }
.modal-title{ font-weight:800; color:#064e3b; margin:6px 0 10px; }
.modal-body{ padding:6px 4px 16px; }
.upload-box{ border:2px dashed #e5e7eb; border-radius:14px; padding:16px; display:grid; gap:12px; place-items:center; background:#fafafa; }
.preview img{ max-width:100%; max-height:280px; object-fit:contain; border-radius:10px; }
.placeholder{ color:#6b7280; text-align:center; }
.ph-icon{ font-size:28px; display:block; margin-bottom:6px; }
.upload-button{ border:1px solid #cbd5e1; background:#fff; border-radius:10px; padding:10px 14px; cursor:pointer; font-weight:600; }
.upload-button:hover{ background:#f8fafc; }
.consent{ display:flex; align-items:center; gap:8px; margin-top:10px; color:#374151; }

/* next floating button */
.fab-next{ position:absolute; right:24px; bottom:18px; width:46px; height:46px; border-radius:9999px; border:none; cursor:pointer; background:#064e3b; color:#fff; font-size:20px; display:grid; place-items:center; }
.fab-next:disabled{ opacity:.5; cursor:not-allowed; }
.spinner { width:18px; height:18px; border:2px solid rgba(255,255,255,.35); border-top-color:#fff; border-radius:50%; animation:spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.text-input{ width:100%; border:1px solid #cbd5e1; border-radius:10px; padding:12px; font-size:14px; margin:8px 0 12px; }
.btn.full{ width:100%; }
.error{ color:#b91c1c; margin-top:.5rem; }

/* loading micro animation */
.loading-combo { display:inline-flex; align-items:center; gap:6px; }
.shimmer-text { position:relative; overflow:hidden; display:inline-block; }
.shimmer-text::after{ content:''; position:absolute; inset:0; background: linear-gradient(110deg, transparent 0%, rgba(255,255,255,.35) 40%, transparent 80%); transform:translateX(-100%); animation: shimmer 1.2s ease-in-out infinite; }
@keyframes shimmer { 100% { transform: translateX(100%); } }
.dotdotdot { display:inline-block; width:26px; text-align:left; }
.dotdotdot::after { content:'...'; animation: dots 1.2s steps(4,end) infinite; }
.micro-progress { margin-top:8px; height:3px; background:#e5e7eb; border-radius:999px; overflow:hidden; }
.micro-bar { height:100%; width:40%; background:#10b981; border-radius:999px; animation: bar 1.2s ease-in-out infinite; }
@keyframes bar { 0% { transform: translateX(-60%);} 50% { transform: translateX(60%);} 100% { transform: translateX(160%);} }

/* autocomplete list */
.autocomplete{ position: relative; }
.pred-list{ position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 12px 30px rgba(0,0,0,.12); max-height: 280px; overflow: auto; z-index: 1000; padding: 4px 0; }
.pred-item{ padding: 10px 12px; cursor: pointer; display: flex; flex-direction: column; gap: 2px; }
.pred-item + .pred-item{ border-top: 1px solid #f3f4f6; }
.pred-item:hover{ background: #f8fafc; }
.pred-main{ font-weight: 800; color: #111827; line-height: 1.2; }
.pred-secondary{ font-size: 12px; color: #6b7280; line-height: 1.2; }

/* ========== Results ========== */
.results{ max-width:1080px; margin:16px auto 32px; padding:0 16px; }
.results-grid{ display:grid; gap:16px; grid-template-columns:1fr; }
.panel{ background:#fff; border:1px solid #e5e7eb; border-radius:16px; padding:14px; }
.image-panel img{ width:100%; border-radius:12px; }
@media (min-width:900px){ .results-grid{ grid-template-columns:1fr 1fr; } }

/* simple headline (no gradient box) */
.results-actions{ display:grid; grid-template-columns:1fr auto; align-items:center; gap:12px; margin-bottom:12px; }
@media (min-width:900px){ .results-actions{ grid-template-columns:1fr 1fr; } .actions-right{ justify-self:end; } }
.results-headline{ display:flex; flex-direction:column; gap:4px; }
.headline-text{ font-size:24px; font-weight:400; color:#111827; line-height:1.35; }
.headline-sub{ font-size:12px; color:#6b7280; }

/* mini cards */
.cards-mini{ display: grid; gap: 14px; }
.card.mini{ background:#fff; border-radius: 14px; padding: 14px 14px 10px; border: 2px solid #e5e7eb; position: relative; overflow: hidden; }
.mini-head{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:6px; }
.mini-title{ font-weight:700; color:#111827; }
.info-dot{ display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:50%; background:#f3f4f6; color:#111827; font-size:12px; font-weight:800; border:1px solid #e5e7eb; }
.side-icon{ width:40px; height:40px; object-fit:contain; margin-left:auto; }

.mini-value{ font-size:28px; font-weight:900; letter-spacing:.2px; display:flex; align-items:baseline; gap:6px; color:#111827; flex-wrap:wrap; }
.mini-value .unit{ font-size:18px; font-weight:800; }
.mini-sub{ color:#6b7280; font-size:12px; margin-top:2px; }
.mini-expand{ margin-top:10px; width:100%; display:flex; align-items:center; justify-content:space-between; background:#f8fafc; border:1px solid #e5e7eb; color:#064e3b; border-radius:10px; padding:8px 10px; font-weight:700; cursor:pointer; }
.mini-inner{ position: relative; z-index: 1; }
.mini-overlay{ position: absolute; inset: 0; background: #fff; padding: 14px; display: grid; place-items: stretch; transform: translateY(100%); opacity: 0; transition: transform .28s ease, opacity .28s ease; z-index: 2; border-radius: 12px; }
.card.mini.show .mini-overlay{ transform: translateY(0); opacity: 1; }
.mini-ov-body{ display: grid; gap: 12px; align-content: start; }
.mini-ov-actions{ display:flex; gap:10px; }
.btn.ghost{ background: #fff; color:#064e3b; border:2px solid #064e3b; padding:10px 14px; border-radius:9999px; font-weight:700; font-size:14px; }

/* success/fail soft backgrounds (kept as 2-state) */
.card.mini.ok{ background:linear-gradient(180deg, #dcfce7 0%, #f0fdf4 100%); border-color:#16a34a; box-shadow:0 0 0 3px rgba(22,163,74,.18) inset; }
.card.mini.bad{ background:linear-gradient(180deg, #fee2e2 0%, #fff1f2 100%); border-color:#dc2626; box-shadow:0 0 0 3px rgba(220,38,38,.18) inset; }
.park-link{ text-decoration: underline; color:#065f46; }

.fail-leading{ color:#f59e0b; font-weight:900; }
.passed-label{ font-size:12px; font-weight:800; color:#15803d; margin-left:6px; align-self:flex-end; }

/* ===== Progress bar with "Goal" marker ===== */
:deep(.goalbar){ margin-top:10px; }
:deep(.goalbar-track){ position:relative; height:10px; background:#f3f4f6; border-radius:999px; overflow:visible; }
:deep(.goalbar-fill){ height:100%; border-radius:999px; background: linear-gradient(90deg, #f59e0b, #fbbf24); }
:deep(.goalbar-marker){ position:absolute; top:-6px; width:2px; height:22px; background:#111827; transform:translateX(-1px); }
:deep(.goalbar-label){ position:absolute; top:-16px; left:50%; transform:translateX(-50%); font-size:10px; color:#111827; font-weight:800; }

/* toast */
.toast{ position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(8px); opacity: 0; pointer-events: none; z-index: 60; padding: 10px 14px; border-radius: 10px; font-weight: 700; line-height: 1.3; box-shadow: 0 10px 30px rgba(0,0,0,.2); transition: opacity .25s ease, transform .25s ease; background: #111827; color: #fff; }
.toast.on{ opacity: 1; transform: translateX(-50%) translateY(0); }
.toast.success{ background:#065f46; }
.toast.error{ background:#7f1d1d; }
.toast.info{ background:#111827; }
.alert.warn{ border: 1px solid #f59e0b; background: #fffbeb; color:#78350f; border-radius: 10px; padding: 10px 12px; font-size: 14px; }

/* fade-in animations */
.fade-in-left{ animation: fadeInLeft .45s ease-out both; }
.fade-in-right{ animation: fadeInRight .45s ease-out both; }
@keyframes fadeInLeft { from { opacity:0; transform: translateX(-14px); } to { opacity:1; transform: translateX(0); } }
@keyframes fadeInRight{ from { opacity:0; transform: translateX(14px); } to { opacity:1; transform: translateX(0); } }
/* status pills */
.passed-label { font-size:12px; font-weight:800; color:#15803d; margin-left:6px; align-self:flex-end; }
.almost-label { font-size:12px; font-weight:800; color:#f59e0b; margin-left:6px; align-self:flex-end; } /* orange */
.failed-label { font-size:12px; font-weight:800; color:#b91c1c; margin-left:6px; align-self:flex-end; } /* red */

</style>
