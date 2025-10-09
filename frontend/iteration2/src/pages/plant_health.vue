<template>
  <Header />

  <div class="page-wrapper">
    <div class="container">
      <!-- ===== Page Title & Subtitle ===== -->
      <h1 class="title">Track Your Plant Health With AI</h1>
      <h3 class="subtitle">
        Create greener spaces from your hands. Snap your plant, get a health score, and follow smart tips to keep it thriving
      </h3>

      <!-- ===== Trigger: Suggested Plants Overlay ===== -->
      <div class="suggest-row">
        <button class="suggest-btn" type="button" @click="openPicker">
          🌿 No plant at home? Get 3 suggestions
        </button>
      </div>

      <!-- ===== Main Upload & Analyze Card ===== -->
      <form class="card" @submit.prevent="handleSubmit">
        <!-- Status strip -->
        <div v-if="result && !lowConfidence" class="status-strip">
          <div class="status-left">
            <div class="species" v-if="result?.species">
              {{ result.species }}
              <span v-if="result?.common_name" class="species-aka">({{ result.common_name }})</span>
            </div>
            <div class="status-big">{{ displayStatus }}</div>
          </div>
          <div class="score-box" v-if="result?.health_score">
            <span class="score-label">Health</span>
            <span class="score-value">{{ result.health_score }}</span>
          </div>
        </div>

        <!-- Upload area -->
        <div class="upload-box">
          <!-- With preview -->
          <div v-if="previewUrl" class="preview inside-upload-box">
            <div><img :src="previewUrl" alt="preview" /></div>

            <label class="upload-button" @click="resetPreview">
              <img src="@/assets/icon_camera.png" width="16" alt="Camera Icon" />
              <span>Change Photo</span>
            </label>

            <label class="upload-button">
              <input type="file" accept="image/*" capture="environment" @change="onFileSelected" hidden/>
              <img src="@/assets/icon_camera.png" width="16" alt="Camera Icon" />
              <span>Take Photo</span>
            </label>
          </div>

          <!-- No preview -->
          <div v-else class="inside-upload-box">
            <img src="@/assets/icon_upload.png" width="40" class="center-self" alt="" />
            <h2 class="upload-title">Upload a photo of your plant</h2>

            <label class="upload-button">
              <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" @change="onFileSelected" hidden/>
              <img src="@/assets/icon_camera.png" width="16" alt="Camera Icon" />
              <span>Choose Photo</span>
            </label>

            <label class="upload-button">
              <input type="file" accept="image/*" capture="environment" @change="onFileSelected" hidden/>
              <img src="@/assets/icon_camera.png" width="16" alt="Camera Icon" />
              <span>Take Photo</span>
            </label>
          </div>
        </div>

        <!-- Analyze -->
        <button class="analyze-button" :disabled="!file || loading">
          <span v-if="!loading" class="btn-content">
            <img src="@/assets/icon_analyze.png" width="16" alt="Analyze Icon" />
            Analyze Plant Health
          </span>
          <span v-else class="btn-loading">
            <span class="spinner" aria-hidden="true"></span>
            Analyzing…
          </span>
        </button>

        <p v-if="error" class="error">{{ error }}</p>
      </form>

      <!-- Warning card -->
      <div v-if="lowConfidence" class="card warn-card">
        <p class="warn-big">{{ warnTitle }}</p>
        <p class="warn-sub">{{ warnSubtitle }}</p>
      </div>

      <!-- Result card -->
      <div v-if="result && !lowConfidence" class="card" style="margin-top:1rem;">
        <!-- Hidden QA block -->
        <ul class="kv" style="display:none;">
          <li v-if="result?.family"><strong>Family:</strong> {{ result.family }}</li>
          <li v-if="result?.confidence !== undefined"><strong>Identification confidence:</strong> {{ result.confidence }}%</li>
          <li v-if="result?.confidence_level"><strong>Assessment confidence:</strong> {{ result.confidence_level }}</li>
        </ul>

        <div v-if="result?.quick_summary" class="summary-card">
          <div class="summary-title">Summary</div>
          <p class="summary-text">{{ result.quick_summary }}</p>
        </div>

        <div class="accordion">
          <button class="acc-header" @click="openCare = !openCare">
            <span class="acc-left">
              <span class="bulb" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M9 21h6v-1H9v1zm3-20C7.925 1 5 3.925 5 7c0 2.013 1.004 3.784 2.536 4.873.51.363.922.84 1.183 1.404L9 14h6l.281-.723c.26-.564.672-1.041 1.183-1.404C17.996 10.784 19 9.013 19 7c0-3.075-2.925-6-7-6zm-3 17h6v-2H9v2z"/>
                </svg>
              </span>
              Care recommendations
            </span>
            <span class="chev">{{ openCare ? '−' : '+' }}</span>
          </button>
          <div v-show="openCare" class="acc-body">
            <ul class="green-bullets">
              <li v-for="(rec, idx) in filteredCare" :key="idx">
                <strong>{{ rec.category }}</strong>: {{ rec.recommendation }}
              </li>
            </ul>
          </div>
        </div>

        <div class="accordion">
          <button class="acc-header" @click="openMore = !openMore">
            <span>More details</span>
            <span class="chev">{{ openMore ? '−' : '+' }}</span>
          </button>
          <div v-show="openMore" class="acc-body">
            <div v-if="otherCare.length">
              <h4 class="subhead">More care tips</h4>
              <ul class="disc">
                <li v-for="(rec, idx) in otherCare" :key="idx">
                  <strong>{{ rec.category }}:</strong> {{ rec.recommendation }}
                </li>
              </ul>
            </div>

            <div v-if="result?.issues_identified?.length" class="mt8">
              <h4 class="subhead">Issues identified</h4>
              <ul class="disc">
                <li v-for="(it, idx) in result.issues_identified" :key="idx">
                  <strong>{{ it.type }}</strong> — {{ it.severity }}. {{ it.description }}
                  <span v-if="it.treatment"><em> Treatment:</em> {{ it.treatment }}</span>
                </li>
              </ul>
            </div>

            <div v-if="result?.healthy_reference" class="mt8">
              <h4 class="subhead">Healthy reference</h4>
              <p>{{ result.healthy_reference.description }}</p>
              <ul class="disc">
                <li v-for="(k, i) in result.healthy_reference.key_indicators" :key="i">• {{ k }}</li>
              </ul>
            </div>
          </div>
        </div>

        <p class="disclaimer">
          This is an AI-generated assessment for reference only. For professional advice about plant health, please consult a horticulture expert.
        </p>
      </div>
    </div>
  </div>

  <!-- ===== Suggested Plants Overlay (images + copy) ===== -->
  <transition name="fade">
    <div v-if="pickerOpen" class="picker-overlay" @click.self="closePicker">
      <div class="picker-panel">
        <div class="picker-head">
          <strong>Try with one of these plants</strong>
          <button class="picker-close" @click="closePicker" aria-label="Close">×</button>
        </div>

        <div class="picker-list">
          <div v-for="(p, i) in suggested" :key="i" class="plant-card">
            <!-- Thumbnail (display doesn't need CORS) -->
            <div class="plant-thumb">
              <img :src="p.photo_url" :alt="p.common_name" />
            </div>

            <!-- Text -->
            <div class="plant-lines">
              <div class="plant-common">{{ p.common_name }}</div>
              <div class="plant-sci">{{ p.scientific_name }}</div>
              <div class="plant-care">{{ p.care }}</div>
            </div>

            <!-- Copy button -->
            <div class="plant-actions">
              <button
                class="copy-btn"
                :disabled="copyingIndex === i"
                @click.stop="copyImage(i, p.photo_url)"
              >
                <span v-if="copyingIndex === i">Copying…</span>
                <span v-else-if="copiedIndex === i">Copied ✓</span>
                <span v-else>Copy Image</span>
              </button>
            </div>
          </div>
        </div>

        <div class="picker-foot">
          <button class="picker-action" @click="reshuffle">Shuffle again</button>
          <button class="picker-secondary" @click="closePicker">Done</button>
        </div>

        <!-- Inline error (no tab opening anymore) -->
        <p v-if="copyError" style="color:#b91c1c; padding:8px 14px; margin:0;">
          {{ copyError }}
        </p>
      </div>
    </div>
  </transition>

  <Footer />
</template>

<script setup>
// ==============================
// Imports & Basic Setup
// ==============================
import { computed, ref } from 'vue'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'

// Local JSON (needs tsconfig "resolveJsonModule": true)
import plantsCatalog from '@/assets/plants_direct.json'

// Backend endpoints (unchanged)
const API_BASE = 'https://oelkz0pl2c.execute-api.ap-southeast-2.amazonaws.com/default'
const SIGN_URL = `${API_BASE}/sign-upload`
const MODERATE_URL = `${API_BASE}/moderate-object`
const DELETE_URL = `${API_BASE}/delete-object`
const PLANT_ANALYZER_URL = 'https://efmnjv0lr3.execute-api.ap-southeast-2.amazonaws.com/plant-health-checker'

const LOW_CONFIDENCE_THRESHOLD = 10 // ≤10% => considered not analyzable
const S3_FOLDER = 'PlantHealth'     // S3 folder

// ==============================
// Upload/Analyze: State & Results
// ==============================
const file = ref(null)
const previewUrl = ref(null)
const loading = ref(false)
const error = ref(null)

const result = ref(null)
const lowConfidence = ref(false)

const warnTitle = ref('Unable to analyze. Please upload photos of the plants.')
const warnSubtitle = ref(
  'We cannot confidently identify this image as a plant (Identification confidence ≤ 10%). Please try to change to a clearer close-up of the plant.'
)

// Accordions
const openCare = ref(true)
const openMore = ref(false)

// Overall status text
const displayStatus = computed(() => {
  const s = result.value?.overall_status
  return (typeof s === 'string' && s.trim()) ? s : 'Healthy'
})

// First accordion subset
const filteredCare = computed(() => {
  const wanted = new Set(['Watering', 'Light', 'Pruning'])
  const list = result.value?.care_recommendations || []
  return list.filter(x => wanted.has(x?.category))
})
// Remaining tips
const otherCare = computed(() => {
  const wanted = new Set(['Watering', 'Light', 'Pruning'])
  const list = result.value?.care_recommendations || []
  return list.filter(x => !wanted.has(x?.category))
})

// ==============================
// File Selection / Preview
// ==============================
function onFileSelected(e) {
  const f = e.target.files?.[0]
  error.value = null
  result.value = null
  lowConfidence.value = false

  if (!f) return resetPreview()

  const ok = /\.(jpe?g|png)$/i.test(f.name) || /^image\//i.test(f.type)
  if (!ok) {
    error.value = 'Only JPG and PNG are allowed.'
    return
  }
  file.value = f

  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(f)
}

function resetPreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
  file.value = null
  result.value = null
  lowConfidence.value = false
}

// ==============================
// Lambda-proxy JSON helper
// ==============================
async function parseMaybeLambdaProxyResponse(res) {
  const data = await res.json().catch(() => null)
  if (!data) return null
  if ('statusCode' in (data || {}) && 'body' in (data || {}) && typeof data.body === 'string') {
    try { return JSON.parse(data.body) } catch { return data }
  }
  return data
}

// ==============================
// Upload → Moderate → Analyze flow
// ==============================
async function handleSubmit() {
  error.value = null
  result.value = null
  lowConfidence.value = false

  if (!file.value) {
    error.value = 'Please choose a JPG or PNG file.'
    return
  }

  loading.value = true
  try {
    // 1) Sign upload
    const signRes = await fetch(SIGN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folder: S3_FOLDER,
        content_type: file.value.type || 'image/jpeg',
        ext_hint: file.value.name?.toLowerCase().endsWith('.png') ? '.png' : '.jpg'
      })
    })
    if (!signRes.ok) throw new Error(`Sign upload failed (${signRes.status})`)
    const { bucket, key, presigned } = await signRes.json()

    // 2) Direct POST to S3
    const fd = new FormData()
    Object.entries(presigned.fields).forEach(([k, v]) => fd.append(k, v))
    fd.append('file', file.value)
    const s3Res = await fetch(presigned.url, { method: 'POST', body: fd })
    if (!s3Res.ok) throw new Error('Upload to S3 failed')

    // 3) Moderate
    const modRes = await fetch(MODERATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket, key })
    })
    if (!modRes.ok) {
      const msg = await modRes.text().catch(() => '')
      throw new Error(msg || 'Content moderation failed')
    }

    // 4) Analyze
    const payload = { bucket, key, include_details: true, check_compliance: true }
    const analyzeRes = await fetch(PLANT_ANALYZER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!analyzeRes.ok) {
      const t = await analyzeRes.text().catch(() => '')
      throw new Error(t || `Analyzer failed (${analyzeRes.status})`)
    }
    const analyze = await parseMaybeLambdaProxyResponse(analyzeRes) ?? {}

    // Non-plant short-circuit
    const nonPlant = analyze?.analysis_result === -1 || String(analyze?.analysis_result) === '-1'
    if (nonPlant) {
      warnTitle.value = 'Unable to analyze. This does not look like a plant.'
      warnSubtitle.value = 'This image was not recognized as a plant. Please upload a clear close-up of a plant.'
      lowConfidence.value = true
      try {
        await fetch(DELETE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bucket, key }) })
      } catch {}
      return
    }

    // Normalize fields
    const species = analyze?.analysis_result?.species_identification
    const sa = analyze?.analysis_result?.structured_analysis
    const normalized = {
      species: species?.species,
      common_name: species?.common_name,
      family: species?.family,
      confidence: species?.confidence,
      overall_status: sa?.health_assessment?.overall_status,
      health_score: sa?.health_assessment?.health_score,
      confidence_level: sa?.health_assessment?.confidence_level,
      quick_summary: sa?.health_assessment?.quick_summary,
      care_recommendations: sa?.care_recommendations || [],
      issues_identified: sa?.issues_identified || [],
      healthy_reference: sa?.healthy_reference || null
    }

    // Low-confidence handling
    const conf = typeof normalized.confidence === 'number' ? normalized.confidence : NaN
    if (!Number.isNaN(conf) && conf <= LOW_CONFIDENCE_THRESHOLD) {
      warnTitle.value = 'Unable to analyze. Please upload photos of the plants.'
      warnSubtitle.value =
        'We cannot confidently identify this image as a plant (Identification confidence ≤ 10%). Please try a clearer close-up of the plant.'
      lowConfidence.value = true
      try {
        await fetch(DELETE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bucket, key }) })
      } catch {}
      result.value = null
      return
    }

    // Show result
    result.value = normalized

    // Optionally delete uploaded object
    try {
      await fetch(DELETE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bucket, key }) })
    } catch {}
  } catch (e) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

// ==============================
// Suggested Plants overlay + Copy image
// ==============================
const pickerOpen = ref(false)
const suggested = ref([])
const copiedIndex = ref(-1)
const copyingIndex = ref(-1)
const copyError = ref('')

// Open overlay and pick 3 random plants
function openPicker() {
  reshuffle()
  pickerOpen.value = true
  copiedIndex.value = -1
  copyingIndex.value = -1
  copyError.value = ''
}

// Close overlay
function closePicker() {
  pickerOpen.value = false
  copiedIndex.value = -1
  copyingIndex.value = -1
  copyError.value = ''
}

// Pick 3 random unique items
function reshuffle() {
  const list = Array.isArray(plantsCatalog) ? plantsCatalog.slice() : []
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  suggested.value = list.slice(0, 3)
  copiedIndex.value = -1
  copyingIndex.value = -1
  copyError.value = ''
}

// ---- helper: resolve Wikimedia "Special:FilePath" to CORS-safe direct URL (upload.wikimedia.org) ----
async function resolveCommonsImageUrl(inputUrl) {
  try {
    const u = String(inputUrl || '').replace(/^http:/i, 'https:')
    // If it's not a Special:FilePath URL, return as-is
    if (!/\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//i.test(u)) return u

    // Extract filename after Special:FilePath/
    const m = u.match(/Special:FilePath\/([^?]+)/i)
    if (!m) return u
    const fileName = decodeURIComponent(m[1]) // e.g. "Cordyline_australis.jpg"

    // Call MediaWiki API to get a CORS-enabled URL (thumb or original)
    const title = `File:${fileName}`
    const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&iiurlwidth=1600&format=json&origin=*`

    const resp = await fetch(api, { mode: 'cors' })
    if (!resp.ok) return u
    const json = await resp.json()

    const pages = json?.query?.pages || {}
    const firstPage = pages[Object.keys(pages)[0]]
    const ii = firstPage?.imageinfo?.[0]
    // Prefer thumbnail (sized), fallback to original url
    const direct = ii?.thumburl || ii?.url
    return direct || u
  } catch {
    return String(inputUrl || '')
  }
}

// ---- helper: decode any image blob and re-encode as PNG (best cross-browser compatibility) ----
async function blobToPngBlob(srcBlob) {
  const bitmap = await createImageBitmap(srcBlob)
  if ('OffscreenCanvas' in window) {
    const c = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = c.getContext('2d')
    ctx.drawImage(bitmap, 0, 0)
    return await c.convertToBlob({ type: 'image/png' })
  } else {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0)
    const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
    return pngBlob
  }
}

/**
 * Copy an image (by URL) directly into the clipboard WITHOUT opening new tab.
 * Steps:
 * 1) Resolve Wikimedia Special:FilePath → direct CORS URL via MediaWiki API (origin=*)
 * 2) Fetch image with CORS
 * 3) Re-encode to PNG for compatibility
 * 4) Write via ClipboardItem
 */
async function copyImage(index, photoUrl) {
  copyError.value = ''
  if (!photoUrl) return

  // Capability guard: needs secure context and ClipboardItem
  const ClipboardItemCtor = (window && window['ClipboardItem']) || null
  if (!window.isSecureContext || !navigator.clipboard?.write || !ClipboardItemCtor) {
    copyError.value = 'Copy is not supported in this environment. Use HTTPS and a modern browser.'
    return
  }

  copyingIndex.value = index
  try {
    // Resolve to CORS-allowed direct URL if it's a Commons Special:FilePath
    const directUrl = await resolveCommonsImageUrl(photoUrl)
    const httpsUrl = String(directUrl).replace(/^http:/i, 'https:')

    // Fetch with CORS (upload.wikimedia.org sends Access-Control-Allow-Origin: *)
    const res = await fetch(httpsUrl, {
      mode: 'cors',
      credentials: 'omit',
      headers: { Accept: 'image/*' },
      cache: 'no-cache',
      redirect: 'follow'
    })
    if (!res.ok) throw new Error(`fetch ${res.status}`)

    const srcBlob = await res.blob()
    const pngBlob = await blobToPngBlob(srcBlob)

    const item = new ClipboardItemCtor({ 'image/png': pngBlob })
    await navigator.clipboard.write([item])

    copiedIndex.value = index
    setTimeout(() => { if (copiedIndex.value === index) copiedIndex.value = -1 }, 2000)
  } catch (err) {
    console.warn('Copy image failed:', err)
    copyError.value = 'Failed to copy image. Check browser permissions or try another browser.'
  } finally {
    copyingIndex.value = -1
  }
}
</script>

<style scoped>
/* ===== Page Background & Layout ===== */
.page-wrapper {
  min-height: 100vh;
  background-image: url('/bg_plant_health_check.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.container { max-width: 800px; margin: auto; padding: 1rem; }

/* ===== Titles ===== */
.title { font-size: 2rem; margin-bottom: 0.75rem; text-align: center; }
.subtitle {
  font-size: 1rem; margin-bottom: 0.5rem; text-align: center; font-weight: normal;
  color: #616161; max-width: 600px; margin-left: auto; margin-right: auto; line-height: 1.4;
}

/* ===== Suggested Plants trigger ===== */
.suggest-row { display: flex; justify-content: center; margin: 8px 0 0; }
.suggest-btn {
  appearance: none; border: 1px solid #cbd5e1; background: #fff; color: #065f46; font-weight: 700;
  padding: 8px 12px; border-radius: 999px; cursor: pointer; transition: background .2s ease;
  font-size: 14px;
}
.suggest-btn:hover { background: #f8fafc; }

/* ===== Card Wrapper ===== */
.card {
  border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-top: 1rem;
  background: #fff; box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

/* ===== Status Strip ===== */
.status-strip {
  display: flex; align-items: stretch; justify-content: space-between; gap: 12px;
  padding: 14px 16px; margin-bottom: 14px; border: 1px solid #bbf7d0; background: #ecfdf5; border-radius: 14px;
}
.status-left { display: flex; flex-direction: column; gap: 6px; }
.species { font-weight: 600; color: #065f46; font-size: 14px; }
.species-aka { color: #0f766e; font-weight: 500; margin-left: 6px; }
.status-big { font-weight: 800; color: #059669; font-size: 26px; line-height: 1.1; }
.score-box { display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; }
.score-label { color: #065f46; font-weight: 700; font-size: 12px; letter-spacing: .3px; text-transform: uppercase; }
.score-value { color: #064e3b; font-weight: 900; font-size: 28px; }

/* ===== Upload UI ===== */
.upload-box {
  width: 100%; background: white; border: 2px dashed #e9e9e9; border-radius: 16px; padding: 32px;
}
.inside-upload-box { text-align: center; display: flex; flex-direction: column; gap: 16px; }
.upload-title { font-size: 20px; font-weight: bold; margin: 0; }
.upload-button {
  display: inline-flex; align-items: center; justify-content: center; margin: auto; gap: 8px; width: 100%; padding: 12px 16px;
  border: 1px solid #ccc; border-radius: 8px; background: #fff; cursor: pointer; font-size: 14px; font-weight: 500;
  transition: background 0.2s ease;
}
.upload-button:hover { background: #f1f1f1; }
.center-self { align-self: center; }
.preview img { max-width: 100%; max-height: 250px; object-fit: contain; }

/* ===== Analyze Button ===== */
.analyze-button {
  margin-top: 1.25rem; width: 100%; background: #103731; border: none; border-radius: 8px; padding: 12px;
  font-size: 16px; font-weight: bold; cursor: pointer; color: white; display: inline-flex; align-items: center; justify-content: center; gap: 10px;
}
.analyze-button:disabled { background: #b0d5cf; cursor: not-allowed; }
.btn-content { display: inline-flex; gap: 8px; align-items: center; }
.btn-loading { display: inline-flex; gap: 10px; align-items: center; }
.spinner {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error { color: #b91c1c; margin-top: .75rem; }

/* ===== Warning Card ===== */
.warn-card { border-color: #fecaca; background: #fff1f2; }
.warn-big { color: #b91c1c; font-weight: 800; margin: 0 0 4px; }
.warn-sub { color: #7f1d1d; margin: 0; }

/* ===== Result ===== */
.kv { list-style: none; padding: 0; margin: .5rem 0 0; }
.kv li { margin: .2rem 0; }
.summary-card { margin-top: 10px; border: 1px solid #e5e7eb; background: #f9fafb; border-radius: 12px; padding: 12px 14px; }
.summary-title { font-weight: 800; color: #064e3b; margin-bottom: 6px; }
.summary-text { color: #1f2937; }

/* ===== Accordion ===== */
.accordion { border: 1px solid #e5e7eb; border-radius: 12px; margin-top: 12px; overflow: hidden; }
.acc-header {
  width: 100%; text-align: left; padding: 12px 14px; background: #fff; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: space-between; color: #064e3b; font-weight: 800;
}
.acc-body { padding: 10px 14px 12px; background: #fff; }
.acc-left { display: inline-flex; align-items: center; gap: 8px; }
.bulb { color: #059669; display: inline-flex; }
.chev { color: #065f46; }
.green-bullets { list-style: disc; padding-left: 20px; margin: 0; }
.green-bullets li::marker { color: #059669; }
.green-bullets li { margin: .2rem 0; }

.subhead { color: #065f46; font-weight: 800; margin-bottom: 6px; }
.disc { list-style: disc; padding-left: 20px; margin: 0; }
.mt8 { margin-top: 8px; }

.disclaimer { margin-top: 12px; font-size: 12px; color: #6b7280; }

/* ===== Overlay & Panel ===== */
.fade-enter-active, .fade-leave-active { transition: opacity .22s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.picker-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.35);
  display: grid; place-items: center; z-index: 60;
}
.picker-panel {
  width: min(860px, 94vw);
  background: #fff; border-radius: 14px; border: 1px solid #e5e7eb;
  box-shadow: 0 18px 60px rgba(0,0,0,0.25);
  animation: rise .22s ease both;
}
@keyframes rise { from { transform: translateY(6px); opacity: .95; } to { transform: translateY(0); opacity: 1; } }

.picker-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-weight: 800; color: #0f172a;
}
.picker-close {
  all: unset; cursor: pointer; padding: 4px 8px; font-size: 20px; line-height: 1;
  color: #334155;
}

.picker-list {
  padding: 14px; display: grid; gap: 12px;
}
.plant-card {
  display: grid; grid-template-columns: 120px 1fr auto; align-items: center; gap: 14px;
  padding: 12px; border: 1px solid #e5e7eb; border-radius: 12px; background: #fafafa;
}
.plant-thumb { width: 120px; height: 84px; border-radius: 10px; overflow: hidden; background: #fff; border: 1px solid #e5e7eb; }
.plant-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

.plant-lines { display: grid; gap: 6px; }
.plant-common { font-weight: 700; color: #111827; }
.plant-sci { font-style: italic; color: #334155; font-size: 14px; }
.plant-care { color: #1f2937; font-size: 14px; }

.plant-actions { display: flex; align-items: center; gap: 8px; }
.copy-btn {
  border: 1px solid #cbd5e1; border-radius: 999px; background: #fff; padding: 6px 10px; cursor: pointer;
  font-weight: 700; color: #065f46; transition: background .2s ease;
}
.copy-btn:hover { background: #f0fdf4; }
.copy-btn:disabled { opacity: .6; cursor: wait; }

.picker-foot {
  display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-top: 1px solid #f1f5f9;
}
.picker-action {
  border: none; background: #065f46; color: #fff; border-radius: 10px; padding: 8px 12px; cursor: pointer; font-weight: 800;
}
.picker-secondary {
  border: 1px solid #cbd5e1; background: #fff; color: #0f172a; border-radius: 10px; padding: 8px 12px; cursor: pointer; font-weight: 700;
}

/* ===== Responsive ===== */
@media screen and (min-width: 1024px) {
  .container { padding: 3rem; }
  .upload-button { width: 300px; }
}
</style>
