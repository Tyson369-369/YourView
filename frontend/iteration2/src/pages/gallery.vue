<template>
  <div class="page-wrapper">
    <Header />

    <main>
      <h1 class="title">Window Gallery</h1>

      <!-- Bubble grid -->
      <ul class="bubble-grid" aria-live="polite">
        <li
          v-for="(it, i) in visible"
          :key="it.key"
          :class="['bubble', it.size]"
        >
          <img
            :src="it.url"
            :alt="it.fileName || 'Window view'"
            loading="lazy"
            @click="openLightbox(i)"
          />
        </li>

        <!-- Skeletons -->
        <template v-if="loading">
          <li v-for="n in 6" :key="'sk'+n" class="bubble skel"></li>
        </template>
      </ul>

      <!-- Empty & error states -->
      <p v-if="!loading && !visible.length && !error" class="muted">No photos now</p>
      <p v-if="error" class="err">{{ error }}</p>

      <!-- Actions -->
      <div class="actions">
        <button class="btn ghost" @click="shuffleVisible" :disabled="!visible.length || loading">Change</button>
        <button class="btn primary" @click="showMore" :disabled="loading || !canShowMore">
          {{ canShowMore ? 'Explore More' : 'Nothing else' }}
        </button>
      </div>
    </main>

    <!-- Lightweight Lightbox -->
    <div v-if="lightboxOpen" class="lb" @click.self="closeLightbox">
      <button class="lb-close" @click="closeLightbox" aria-label="Close">×</button>
      <button class="lb-nav prev" v-if="visible.length>1" @click="prev">‹</button>
      <img class="lb-img" :src="visible[activeIdx]?.fullUrl || visible[activeIdx]?.url" :alt="visible[activeIdx]?.fileName">
      <button class="lb-nav next" v-if="visible.length>1" @click="next">›</button>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'

import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const REGION = import.meta.env.VITE_AWS_REGION || 'ap-southeast-2'
const BUCKET = import.meta.env.VITE_S3_BUCKET
const ID_POOL = import.meta.env.VITE_COGNITO_ID_POOL
const PREFIX = 'YourWindow/'
const BATCH_SIZE = 8
const PREFETCH_PAGES = 2
const SIGN_CONCURRENCY = 8

const s3 = new S3Client({
  region: REGION,
  credentials: fromCognitoIdentityPool({
    clientConfig: { region: REGION },
    identityPoolId: ID_POOL
  })
})

const loading = ref(false)
const error = ref(null)
const cursor = ref(undefined)
const queue = ref([])                 // [{ key, size }]
const shownKeys = ref(new Set())      // avoid duplicates within session
const visible = ref([])               // [{ key, url, fullUrl?, size, fileName }]
const canShowMore = ref(true)

const lightboxOpen = ref(false)
const activeIdx = ref(0)

function pickSize() {
  const r = Math.random()
  if (r < 0.70) return 'sm'
  if (r < 0.93) return 'md'
  return 'lg'
}

async function fetchOnePage() {
  const out = await s3.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: PREFIX,
    ContinuationToken: cursor.value,
    MaxKeys: 30
  }))
  cursor.value = out.IsTruncated ? out.NextContinuationToken : undefined
  const keys = (out.Contents ?? [])
    .map(o => o.Key)
    .filter(k => k && !k.endsWith('/'))
  const newbies = keys.filter(k => !shownKeys.value.has(k))
  queue.value.push(...newbies.map(k => ({ key: k, size: pickSize() })))
  shuffle(queue.value)
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

async function signBatch(items) {
  const results = new Array(items.length)
  let idx = 0
  await Promise.all(
    Array.from({ length: Math.min(SIGN_CONCURRENCY, items.length) }).map(async () => {
      while (idx < items.length) {
        const i = idx++
        const it = items[i]
        const url = await getSignedUrl(
          s3,
          new GetObjectCommand({ Bucket: BUCKET, Key: it.key }),
          { expiresIn: 1800 }
        )
        results[i] = {
          key: it.key,
          url,
          fullUrl: url,
          size: it.size,
          fileName: it.key.split('/').pop()
        }
      }
    })
  )
  return results
}

async function fillVisibleBatch() {
  while (queue.value.length < BATCH_SIZE && cursor.value !== undefined) {
    await fetchOnePage()
  }
  if (!queue.value.length && cursor.value === undefined) {
    canShowMore.value = false
    return
  }
  const pick = []
  while (queue.value.length && pick.length < BATCH_SIZE) {
    const it = queue.value.shift()
    if (!shownKeys.value.has(it.key)) {
      pick.push(it)
      shownKeys.value.add(it.key)
    }
  }
  if (!pick.length) {
    canShowMore.value = false
    return
  }
  const signed = await signBatch(pick)
  visible.value = signed

  const needPrefetch = queue.value.length < BATCH_SIZE * 2
  if (needPrefetch) {
    let rounds = 0
    while (cursor.value !== undefined && rounds < PREFETCH_PAGES) {
      await fetchOnePage()
      rounds++
    }
  }
}

async function showMore() {
  loading.value = true
  error.value = null
  try {
    await fillVisibleBatch()
  } catch (e) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

function shuffleVisible() {
  shuffle(visible.value)
}

function openLightbox(i) {
  activeIdx.value = i
  lightboxOpen.value = true
  document.documentElement.style.overflow = 'hidden'
}
function closeLightbox() {
  lightboxOpen.value = false
  document.documentElement.style.overflow = ''
}
function prev() { activeIdx.value = (activeIdx.value - 1 + visible.value.length) % visible.value.length }
function next() { activeIdx.value = (activeIdx.value + 1) % visible.value.length }

onMounted(async () => {
  loading.value = true
  try {
    let rounds = 0
    while (cursor.value !== undefined || rounds === 0) {
      await fetchOnePage()
      rounds++
      if (rounds >= PREFETCH_PAGES) break
    }
    await fillVisibleBatch()
  } catch (e) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-wrapper { display:flex; flex-direction:column; min-height:100vh; }
main { flex:1; padding:24px; }
.title { margin:0 0 12px; font-size:28px; font-weight:900; color:#064e3b; }

/* Bubble grid for organic layout */
.bubble-grid {
  list-style:none; padding:0; margin:0;
  display:grid; gap:16px;
  grid-template-columns: repeat(6, 1fr);
}
@media (max-width: 1200px){ .bubble-grid{ grid-template-columns: repeat(5,1fr); } }
@media (max-width: 900px) { .bubble-grid{ grid-template-columns: repeat(4,1fr); } }
@media (max-width: 680px) { .bubble-grid{ grid-template-columns: repeat(3,1fr); gap:14px; } }
@media (max-width: 420px) { .bubble-grid{ grid-template-columns: repeat(2,1fr); gap:12px; } }

.bubble {
  aspect-ratio:1/1;
  border-radius:9999px;
  overflow:hidden;
  background:#f3f4f6;
  box-shadow: 0 6px 16px rgba(0,0,0,.08);
  transform: translateY(0);
  animation: pop .35s ease both;
}
.bubble img {
  width:100%; height:100%; object-fit:cover; display:block; cursor:zoom-in;
}

/* Sizes */
.bubble.sm { grid-column: span 1; }
.bubble.md { grid-column: span 2; }
.bubble.lg { grid-column: span 3; }
@media (max-width: 680px){
  .bubble.lg { grid-column: span 2; }
}

/* Skeleton shimmer */
.skel {
  background: linear-gradient(90deg,#eee 25%,#f6f6f6 50%,#eee 75%);
  background-size: 200% 100%;
  animation: sh 1.1s infinite;
}

/* Lightbox */
.lb {
  position: fixed; inset: 0; background: rgba(0,0,0,.72);
  display: grid; place-items: center; z-index: 60;
}
.lb-img {
  max-width: 92vw; max-height: 82vh; border-radius: 12px; box-shadow: 0 12px 36px rgba(0,0,0,.4);
}
.lb-close {
  position:absolute; top:14px; right:14px; font-size:22px; line-height:1;
  border:none; background:#fff; color:#111; border-radius:9999px; width:36px; height:36px; cursor:pointer;
}
.lb-nav {
  position:absolute; top:50%; transform: translateY(-50%);
  width:44px; height:44px; border:none; border-radius:9999px; background:#fff; color:#111; font-size:24px; cursor:pointer;
}
.lb-nav.prev { left:14px; }
.lb-nav.next { right:14px; }

/* Animations */
@keyframes pop { from { transform: scale(.85); opacity:.0; } to { transform: scale(1); opacity:1; } }
@keyframes sh { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }

/* Copy & buttons */
.muted { color:#6b7280; margin-top:10px; }
.err { color:#b91c1c; margin-top:10px; }
.actions { display:flex; gap:10px; justify-content:center; align-items:center; margin-top:16px; }
.btn { padding:10px 16px; border-radius:9999px; font-weight:800; cursor:pointer; border:2px solid #064e3b; }
.btn.primary{ background:#064e3b; color:#fff; }
.btn.ghost{ background:#fff; color:#064e3b; }
.btn:disabled{ opacity:.5; cursor:not-allowed; }
</style>
