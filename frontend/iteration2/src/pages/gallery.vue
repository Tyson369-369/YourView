<template>
  <div class="page-wrapper">
    <!-- Header -->
    <Header />

    <!-- Page content -->
    <main>
      <h1 class="title">Window Gallery</h1>

      <!-- Empty state -->
      <p v-if="!loading && !error && items.length === 0" class="empty">
        No images found under <code>{{ PREFIX }}</code>.
      </p>

      <!-- Grid -->
      <ul class="grid" aria-live="polite">
        <!-- images -->
        <li v-for="it in items" :key="it.key" class="card">
          <img
            :src="it.url"
            :alt="getAlt(it.key)"
            loading="lazy"
          />
        </li>

        <!-- skeletons (render only when loading) -->
        <li v-for="n in (loading ? 6 : 0)" :key="'sk'+n" class="card skel" />
      </ul>

      <!-- error & actions -->
      <p v-if="error" class="err">{{ error }}</p>

      <button
        v-if="token && !loading"
        class="btn"
        type="button"
        @click="fetchPage(false)"
      >
        Load more
      </button>
    </main>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup>
/**
 * Gallery page that lists images from S3 using AWS SDK v3 in the browser.
 * Requirements:
 * - S3 CORS must allow this origin.
 * - Cognito Identity Pool (unauth role) must grant s3:ListBucket + s3:GetObject on the prefix.
 * - Vite env vars injected at build time (Amplify → Environment Variables):
 *    VITE_AWS_REGION, VITE_S3_BUCKET, VITE_COGNITO_ID_POOL
 */

import { ref, onMounted } from 'vue'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'

// --- AWS SDK (v3) ---
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// ----- Config from env (fail fast if missing) -----
const REGION = import.meta.env.VITE_AWS_REGION || 'ap-southeast-2'
const BUCKET = import.meta.env.VITE_S3_BUCKET
const ID_POOL = import.meta.env.VITE_COGNITO_ID_POOL

// Change this if you want to list another folder/prefix
const PREFIX = 'YourWindow/'

// Local state
const items = ref([])        // [{ key, url, size?, lastModified? }]
const token = ref(undefined) // S3 NextContinuationToken
const loading = ref(false)
const error = ref(null)

// Lazily create S3 client (so we can set user-friendly errors if config is missing)
let s3 = null
function getS3() {
  if (s3) return s3
  if (!BUCKET || !ID_POOL) {
    // Surface missing config as a friendly message
    throw new Error(
      'Missing env config: VITE_S3_BUCKET and/or VITE_COGNITO_ID_POOL. ' +
      'Please configure Amplify environment variables and redeploy.'
    )
  }
  s3 = new S3Client({
    region: REGION,
    credentials: fromCognitoIdentityPool({
      clientConfig: { region: REGION },
      identityPoolId: ID_POOL
    })
  })
  return s3
}

// Helper: readable alt text
function getAlt(key) {
  try {
    return key.split('/').pop() || 'Window view'
  } catch {
    return 'Window view'
  }
}

/**
 * Fetch a page of S3 objects under the configured prefix.
 * @param {boolean} initial  If true, start from the beginning (no continuation token).
 */
async function fetchPage(initial = false) {
  if (loading.value) return
  loading.value = true
  error.value = null

  try {
    const client = getS3()

    const out = await client.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: PREFIX,
      ContinuationToken: initial ? undefined : token.value,
      MaxKeys: 30
    }))

    const list = (out.Contents ?? []).filter(o => o.Key && !o.Key.endsWith('/'))

    // Generate pre-signed URLs in parallel (limit concurrency if needed)
    const page = []
    for (const o of list) {
      const key = o.Key
      const url = await getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: BUCKET, Key: key }),
        { expiresIn: 1800 } // 30 minutes
      )
      page.push({
        key,
        url,
        size: o.Size,
        lastModified: o.LastModified?.toISOString?.()
      })
    }

    items.value.push(...page)
    token.value = out.IsTruncated ? out.NextContinuationToken : undefined
  } catch (e) {
    console.error('[S3 list error]', e)
    // Friendlier error for typical CORS/permission misconfigurations
    if (e?.name === 'TypeError') {
      error.value = 'Failed to fetch from S3. Check S3 CORS, region and Cognito IAM permissions.'
    } else {
      error.value = e?.message || String(e)
    }
  } finally {
    loading.value = false
  }
}

// Initial load
onMounted(() => {
  fetchPage(true)
})
</script>

<style scoped>
.page-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
  padding: 24px;
}

.title {
  margin: 0 0 12px;
  font-size: 28px;
  font-weight: 900;
  color: #064e3b;
}

.empty {
  margin: 8px 0 16px;
  color: #6b7280;
  font-size: 14px;
}

/* grid */
.grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr;
}
@media (min-width: 680px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 980px) { .grid { grid-template-columns: repeat(3, 1fr); } }

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  min-height: 220px;
}
.card img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
  max-height: 360px;
}

/* skeleton */
.skel {
  background: linear-gradient(90deg,#eee 25%,#f6f6f6 50%,#eee 75%);
  background-size: 200% 100%;
  animation: sh 1.1s infinite;
}
@keyframes sh {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.btn {
  margin: 16px auto 0;
  display: block;
  padding: 10px 16px;
  border-radius: 9999px;
  border: 2px solid #064e3b;
  background: #064e3b;
  color: #fff;
  font-weight: 800;
  cursor: pointer;
}

.err { color: #b91c1c; margin-top: 10px; }
</style>
