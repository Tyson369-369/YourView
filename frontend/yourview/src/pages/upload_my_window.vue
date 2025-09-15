<template>
  <Header />

  <div class="hero">
    <h1 class="hero-title">Upload My Window</h1>
    <p class="hero-subtitle">
      Share a photo from your window to discover if your area is green enough and see whether you live in a hotter or cooler spot compared to other suburbs.
    </p>

    <!-- 3D Carousel -->
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

    <!-- CTA buttons -->
    <div class="cta-row">
      <button class="btn primary" @click="openModal">Upload My Window</button>
      <button class="btn secondary">What is 3-30-300</button>
    </div>
  </div>

  <!-- Modal (2 steps) -->
  <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
    <div class="modal">
      <div class="modal-header">
        <div class="steps">
          <span :class="['dot', modalStep===1?'active':'']">1</span>
          <span class="dash" />
          <span :class="['dot', modalStep===2?'active':'']">2</span>
        </div>
        <button class="icon-btn" aria-label="Close" @click="closeModal">×</button>
      </div>

      <!-- Step 1: Upload -->
      <div v-if="modalStep===1" class="modal-body">
        <h3 class="modal-title">Upload a photo</h3>
        <div class="upload-box">
          <div v-if="previewUrl" class="preview">
            <img :src="previewUrl" alt="preview" />
          </div>
          <div v-else class="placeholder">
            <span class="ph-icon">📷</span>
            <p>Select a photo (JPG/PNG)</p>
          </div>
          <label class="upload-button">
            <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" @change="onFileSelected" hidden />
            Choose Photo
          </label>
        </div>

        <label class="consent">
          <input type="checkbox" v-model="allowShow" :disabled="loading" />
          Allow us to use your image for display
        </label>

        <!-- next arrow -->
        <button
          class="fab-next"
          :disabled="!file || loading"
          @click="modalStep=2"
          title="Next"
          aria-label="Next"
        >
          ➜
        </button>
      </div>

      <!-- Step 2: Address -->
      <div v-else class="modal-body">
        <h3 class="modal-title">Enter your address</h3>
        <input
          class="text-input"
          type="text"
          placeholder="Type your address"
          v-model="address"
          :disabled="loading"
        />
        <button
          class="btn primary full"
          :disabled="!address || !file || loading"
          @click="handleSeeMyScore"
        >
          <span v-if="!loading">See my score</span>
          <span v-else>Working…</span>
        </button>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="deleteInfo" class="info">{{ deleteInfo }}</p>
      </div>
    </div>
  </div>

  <!-- Results section -->
  <div v-if="showResults" class="results">
    <div class="results-grid">
      <!-- Left: uploaded image -->
      <div class="panel image-panel">
        <img :src="previewUrl" alt="Your window" />
      </div>

      <!-- Right: 3 / 30 / 300 cards -->
      <div class="panel">
        <div class="cards">
          <!-- 3 -->
          <div class="card metric">
            <div class="metric-header">
              <div class="metric-title">3</div>
              <div
                class="metric-value"
                :class="treesOK ? 'ok' : 'bad'"
              >
                {{ treesCountText }}
              </div>
            </div>
            <div class="metric-sub">from your window</div>

            <button class="collapse-btn" @click="showTips3 = !showTips3">
              See what you can do
              <span class="chev">{{ showTips3 ? '▲' : '▼' }}</span>
            </button>
            <div v-if="showTips3" class="collapse-body">
              <ul>
                <li v-if="treesOK">Great! Keep existing trees healthy; consider planting native shrubs to support biodiversity.</li>
                <li v-else>Consider adding shrubs/planters on balconies or advocating for street tree planting with your council.</li>
              </ul>
            </div>
          </div>

          <!-- 30 (placeholder) -->
          <div class="card metric">
            <div class="metric-header">
              <div class="metric-title">30</div>
              <div class="metric-value muted">Coming soon</div>
            </div>
            <div class="metric-sub">tree canopy near your home</div>
            <button class="collapse-btn" disabled>
              See what you can do
              <span class="chev">—</span>
            </button>
          </div>

          <!-- 300 (placeholder) -->
          <div class="card metric">
            <div class="metric-header">
              <div class="metric-title">300</div>
              <div class="metric-value muted">Coming soon</div>
            </div>
            <div class="metric-sub">distance to nearest green space (m)</div>
            <button class="collapse-btn" disabled>
              See what you can do
              <span class="chev">—</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Footer />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';


const UPLOADER_URL =
  'https://oelkz0pl2c.execute-api.ap-southeast-2.amazonaws.com/default/upload-image';
const ANALYZER_URL =
  'https://2piqweol0f.execute-api.ap-southeast-2.amazonaws.com/analyze';
const DELETE_URL =
  'https://oelkz0pl2c.execute-api.ap-southeast-2.amazonaws.com/default/delete-object';

// ====== Carousel images ======
import img23 from '@/assets/Group 23.png';
import img27 from '@/assets/Group 27.png';
import img28 from '@/assets/Group 28.png';

const images = [
  { src: img23, alt: 'Window 1' },
  { src: img27, alt: 'Window 2' },
  { src: img28, alt: 'Window 3' },
];

const active = ref(0);
let timer: number | undefined;

onMounted(() => {
  timer = window.setInterval(() => {
    active.value = (active.value + 1) % images.length;
  }, 3000);
});
onUnmounted(() => {
  if (timer) window.clearInterval(timer);
});

function slideClass(i: number) {
  const prev = (active.value - 1 + images.length) % images.length;
  const next = (active.value + 1) % images.length;
  return {
    center: i === active.value,
    left: i === prev,
    right: i === next,
    hidden: !(i === active.value || i === prev || i === next),
  };
}

// ====== Modal & Steps ======
const showModal = ref(false);
const modalStep = ref<1 | 2>(1);
const address = ref('');
function openModal() {
  showModal.value = true;
  modalStep.value = 1;
}
function closeModal() {
  showModal.value = false;
}

// ====== Upload/Analyze State ======
const file = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const allowShow = ref(false);
const loading = ref(false);
const error = ref<string | null>(null);
const deleteInfo = ref<string | null>(null);

const showResults = ref(false);
const treesCount = ref<number | null>(null);
const treesOK = computed(() => (typeof treesCount.value === 'number' ? treesCount.value >= 3 : false));
const treesCountText = computed(() =>
  typeof treesCount.value === 'number' ? `${treesCount.value}` : '—'
);

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const f = input.files?.[0] ?? null;
  error.value = null;
  deleteInfo.value = null;
  treesCount.value = null;
  showResults.value = false;

  if (!f) {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
    file.value = null;
    return;
  }
  const ok = /\.(jpe?g|png)$/i.test(f.name);
  if (!ok) {
    error.value = 'Only JPG and PNG are allowed.';
    return;
  }
  file.value = f;
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = URL.createObjectURL(f);
}

async function parseMaybeLambdaProxyResponse(res: Response) {
  const data = await res.json().catch(() => null);
  if (!data) return null;
  if ('statusCode' in (data as any) && 'body' in (data as any) && typeof (data as any).body === 'string') {
    try { return JSON.parse((data as any).body); } catch { return data; }
  }
  return data;
}

async function handleSeeMyScore() {
  error.value = null;
  deleteInfo.value = null;
  treesCount.value = null;
  showResults.value = false;

  if (!file.value) { error.value = 'Please choose a JPG or PNG file.'; return; }
  if (!address.value.trim()) { error.value = 'Please enter your address.'; return; }

  loading.value = true;
  let uploadedBucket = '';
  let uploadedKey = '';
  try {
    // 1) Upload
    const form = new FormData();
    form.append('file', file.value);
    form.append('folder', 'YourWindow'); // THIS FOLDER NAME WILL APPEAR IN S3 BUCKET
    const up = await fetch(UPLOADER_URL, { method: 'POST', body: form });
    if (!up.ok) {
      const text = await up.text().catch(() => '');
      let detail = '';
      try { const j = JSON.parse(text); detail = j?.detail ?? ''; } catch {}
      throw new Error(detail || `Upload failed (${up.status})`);
    }
    const upJson = await up.json();
    uploadedBucket = upJson.bucket || upJson.s3_bucket || upJson.Bucket;
    uploadedKey    = upJson.key    || upJson.s3_key    || upJson.Key;
    if (!uploadedBucket || !uploadedKey) throw new Error('Upload did not return bucket/key.');

    // 2) Analyze (tree counting)
    const payload = { bucket: uploadedBucket, key: uploadedKey, include_details: true, check_compliance: true };
    const an = await fetch(ANALYZER_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!an.ok) {
      const text = await an.text().catch(() => '');
      throw new Error(text || `Analyzer failed (${an.status})`);
    }
    const analyze = await parseMaybeLambdaProxyResponse(an) ?? {};
    const count =
      analyze?.trees_counted ??
      analyze?.tree_count ??
      analyze?.analysis_details?.tree_count;
    treesCount.value = (typeof count === 'number') ? count : null;

    // 3) IF NO CONSENT, DELETE UPLOADED IMAGE
    if (!allowShow.value) {
      try {
        const del = await fetch(DELETE_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket: uploadedBucket, key: uploadedKey }),
        });
        if (!del.ok) {
          const text = await del.text().catch(() => '');
          deleteInfo.value = `Tried to delete image but failed: ${text || del.status}`;
        } else {
          deleteInfo.value = 'The uploaded image has been deleted (no display consent).';
        }
      } catch (e: any) {
        deleteInfo.value = `Delete attempt errored: ${e?.message || e}`;
      }
    }

    // 4) SHOW RESULTS
    showResults.value = true;
    closeModal();
    // OPT: scroll to results
    setTimeout(() => {
      document.querySelector('.results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

  } catch (e: any) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

// Tips collapse
const showTips3 = ref(false);
</script>

<style scoped>
/* ===== Hero ===== */
.hero {
  max-width: 980px;
  margin: 32px auto 0;
  padding: 0 16px;
  text-align: center;
}
.hero-title {
  color: #064e3b; /* deep green */
  font-size: 36px;
  font-weight: 800;
  margin: 0 0 8px;
}
.hero-subtitle {
  color: #55646a;
  font-size: 14px;
  max-width: 740px;
  margin: 0 auto 18px;
  line-height: 1.5;
}

/* ===== Carousel ===== */
.carousel {
  position: relative;
  height: 280px;
  margin: 8px auto 16px;
  perspective: 1000px;
  overflow: hidden;
}
.slide {
  position: absolute;
  top: 50%; left: 50%;
  width: 300px; height: 180px;
  background-size: cover; background-position: center;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0,0,0,.15);
  transform: translate(-50%, -50%) scale(.6) rotateY(0deg);
  opacity: 0; transition: all .8s ease;
}
.slide.center { transform: translate(-50%, -50%) scale(1) rotateY(0deg); opacity: 1; z-index: 3; }
.slide.left   { transform: translate(calc(-50% - 200px), -50%) scale(.5) rotateY(30deg); opacity: .6; z-index: 2; }
.slide.right  { transform: translate(calc(-50% + 200px), -50%) scale(.5) rotateY(-30deg); opacity: .6; z-index: 2; }
.slide.hidden { opacity: 0; z-index: 1; }

@media (min-width: 900px) {
  .carousel { height: 340px; }
  .slide { width: 420px; height: 240px; }
  .slide.left  { transform: translate(calc(-50% - 260px), -50%) scale(.55) rotateY(30deg); }
  .slide.right { transform: translate(calc(-50% + 260px), -50%) scale(.55) rotateY(-30deg); }
}

/* ===== CTA Buttons ===== */
.cta-row {
  display: flex; gap: 12px; justify-content: center; margin-top: 8px; margin-bottom: 24px;
}
.btn {
  padding: 10px 18px; border-radius: 9999px; font-weight: 700; font-size: 14px; cursor: pointer;
  border: 2px solid #064e3b; transition: all .2s ease;
}
.btn.primary { background: #064e3b; color: #fff; }
.btn.primary:hover { filter: brightness(1.05); }
.btn.secondary { background: #fff; color: #064e3b; }
.btn.secondary:hover { background: #ecfdf5; }

/* ===== Modal ===== */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.35);
  display: grid; place-items: center; z-index: 50;
}
.modal {
  width: min(720px, 92vw); background: #fff; border-radius: 16px; padding: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,.25); position: relative;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
}
.icon-btn {
  all: unset; font-size: 22px; line-height: 1; padding: 4px 8px; cursor: pointer; color: #374151;
}
.steps { display: inline-flex; align-items: center; gap: 10px; }
.dot {
  width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
  border: 2px solid #10b981; color: #065f46; font-weight: 800; background: #fff;
}
.dot.active { background: #ecfdf5; }
.dash { width: 36px; height: 2px; background: #d1fae5; border-radius: 2px; }

.modal-title { font-weight: 800; color: #064e3b; margin: 6px 0 10px; }
.modal-body { padding: 6px 4px 16px; }

.upload-box {
  border: 2px dashed #e5e7eb; border-radius: 14px; padding: 16px;
  display: grid; gap: 12px; place-items: center; background: #fafafa;
}
.preview img { max-width: 100%; max-height: 280px; object-fit: contain; border-radius: 10px; }
.placeholder { color: #6b7280; text-align: center; }
.ph-icon { font-size: 28px; display: block; margin-bottom: 6px; }
.upload-button {
  border: 1px solid #cbd5e1; background: #fff; border-radius: 10px; padding: 10px 14px; cursor: pointer; font-weight: 600;
}
.upload-button:hover { background: #f8fafc; }

.consent { display: flex; align-items: center; gap: 8px; margin-top: 10px; color: #374151; }

.fab-next {
  position: absolute; right: 24px; bottom: 18px;
  width: 46px; height: 46px; border-radius: 9999px; border: none; cursor: pointer;
  background: #064e3b; color: #fff; font-size: 20px; display: grid; place-items: center;
}
.fab-next:disabled { opacity: .5; cursor: not-allowed; }

.text-input {
  width: 100%; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; font-size: 14px; margin: 8px 0 12px;
}
.btn.full { width: 100%; }
.error { color: #b91c1c; margin-top: .5rem; }
.info  { color: #1f2937; margin-top: .5rem; }

/* ===== Results ===== */
.results { max-width: 1080px; margin: 16px auto 32px; padding: 0 16px; }
.results-grid { display: grid; gap: 16px; grid-template-columns: 1fr; }
.panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 14px; }
.image-panel img { width: 100%; border-radius: 12px; }

@media (min-width: 900px) {
  .results-grid { grid-template-columns: 1fr 1fr; }
}

.cards { display: grid; gap: 14px; }
.card.metric { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 12px; }
.metric-header { display: flex; align-items: baseline; justify-content: space-between; }
.metric-title { font-size: 22px; font-weight: 900; color: #064e3b; }
.metric-value { font-size: 28px; font-weight: 900; }
.metric-value.ok  { color: #059669; } /* green */
.metric-value.bad { color: #b91c1c; }  /* red */
.metric-value.muted { color: #6b7280; font-weight: 700; }
.metric-sub { color: #6b7280; font-size: 12px; margin-top: 2px; }

.collapse-btn {
  margin-top: 8px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px;
  padding: 8px 10px; font-weight: 700; cursor: pointer; width: 100%; text-align: left; color: #064e3b;
}
.collapse-btn:disabled { opacity: .6; cursor: not-allowed; }
.collapse-body { padding: 8px 4px 2px; color: #374151; }
.chev { float: right; color: #065f46; }
</style>
