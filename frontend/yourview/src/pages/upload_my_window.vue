<template>
  <div class="page">
    <h1 class="title">Upload your window view</h1>

    <form class="card" @submit.prevent="handleSubmit">
      <div class="field">
        <label class="label">Select image (JPG/PNG)</label>
        <input
          class="input"
          type="file"
          accept=".jpg,.jpeg,.png"
          @change="onFileChange"
          :disabled="loading"
        />
      </div>

      <div v-if="previewUrl" class="preview">
        <img :src="previewUrl" alt="preview" />
      </div>

      <div class="actions">
        <button class="btn" type="submit" :disabled="!file || loading">
          <span v-if="!loading">Upload & Analyze</span>
          <span v-else>Working…</span>
        </button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
    </form>

    <div v-if="result" class="result card">
      <h2 class="subtitle">Analysis Result</h2>
      <ul class="kv">
        <li><strong>Compliant:</strong> {{ result.compliant ? 'Yes' : 'No' }}</li>
        <li v-if="result.trees_counted !== undefined">
          <strong>Trees counted:</strong> {{ result.trees_counted }}
        </li>
        <li v-if="result.standard_met">
          <strong>Standard:</strong> {{ result.standard_met }}
        </li>
        <li v-if="result.confidence !== undefined">
          <strong>Confidence:</strong> {{ result.confidence }} ({{ toPct(result.confidence_score) }})
        </li>
      </ul>

      <p v-if="!result.compliant" class="warn">
        Not enough trees visible (need at least 3).
      </p>
      <p v-else class="ok">
        Looks good — requirement met.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// =====================
// CONFIG — REPLACE THESE
// =====================
// 1) Uploader (FastAPI on API Gateway/Function URL). It must accept multipart form-data: file + folder.
const UPLOADER_URL = 'https://oelkz0pl2c.execute-api.ap-southeast-2.amazonaws.com/default/upload-image';
//    If you enabled $default stage (no prefix), use:
//    'https://oelkz0pl2c.execute-api.ap-southeast-2.amazonaws.com/upload-image'

// 2) Analyzer (your melbourne-tree-analyzer-sydney via API Gateway/Function URL).
//    Create an HTTP endpoint that forwards JSON { bucket, key, include_details, check_compliance } to the Lambda.
const ANALYZER_URL = 'https://2piqweol0f.execute-api.ap-southeast-2.amazonaws.com/analyze';

//    Example if using $default stage: 'https://xxx.execute-api.ap-southeast-2.amazonaws.com/analyze'
//    TODO: replace with your real analyzer endpoint.

import { ref } from 'vue';

const file = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const result = ref<any | null>(null);

// Your S3 bucket and the folder (prefix) you upload to
const S3_BUCKET = 'tp35';
const S3_FOLDER = 'YourWindow'; // must match your uploader default/folder

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  file.value = input.files?.[0] ?? null;
  error.value = null;
  result.value = null;

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
  if (file.value) {
    previewUrl.value = URL.createObjectURL(file.value);
  }
}

function toPct(score?: number) {
  if (typeof score !== 'number') return '—';
  return `${Math.round(score * 100)}%`;
}

/** Some analyzer Lambdas behind API Gateway return { statusCode, headers, body: "<json string>" }.
 *  This helper parses both shapes:
 *   - Direct JSON (already the object)
 *   - Lambda proxy (body as a JSON string)
 */
async function parseMaybeLambdaProxyResponse(res: Response) {
  const data = await res.json().catch(() => null);
  if (!data) return null;
  if ('statusCode' in data && 'body' in data && typeof data.body === 'string') {
    try { return JSON.parse(data.body); } catch { return data; }
  }
  return data;
}

async function handleSubmit() {
  error.value = null;
  result.value = null;

  if (!file.value) {
    error.value = 'Please choose a JPG or PNG file.';
    return;
  }

  // Basic frontend guard
  const extOk = /\.(jpe?g|png)$/i.test(file.value.name);
  if (!extOk) {
    error.value = 'Only JPG and PNG are allowed.';
    return;
  }

  loading.value = true;
  try {
    // 1) Upload to S3 via uploader Lambda (FastAPI)
    const form = new FormData();
    form.append('file', file.value);
    form.append('folder', S3_FOLDER); // backend will store under this prefix

    const uploadRes = await fetch(UPLOADER_URL, {
      method: 'POST',
      body: form,
    });

    if (!uploadRes.ok) {
      // Try to read error details from FastAPI
      let detail = '';
      try { const j = await uploadRes.json(); detail = j?.detail ?? ''; } catch {}
      throw new Error(detail || `Upload failed (${uploadRes.status})`);
    }

    const uploadJson = await uploadRes.json();
    // Expecting shape:
    // { bucket: "tp35", key: "YourWindow/<uuid>.jpg", ... }
    if (!uploadJson?.bucket || !uploadJson?.key) {
      throw new Error('Upload did not return bucket/key.');
    }

    // 2) Call analyzer with the S3 location returned by uploader
    const analyzePayload = {
      bucket: uploadJson.bucket as string,
      key: uploadJson.key as string,
      include_details: true,
      check_compliance: true,
    };

    const analyzeRes = await fetch(ANALYZER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analyzePayload),
    });

    if (!analyzeRes.ok) {
      let detail = '';
      try {
        const maybe = await parseMaybeLambdaProxyResponse(analyzeRes);
        // many Lambdas put error info under 'error' or 'detail'
        detail = maybe?.error || maybe?.detail || JSON.stringify(maybe);
      } catch {}
      throw new Error(detail || `Analyzer failed (${analyzeRes.status})`);
    }

    const analyzeJson = await parseMaybeLambdaProxyResponse(analyzeRes);

    // Normalize a few common fields so UI stays simple
    const normalized = {
      compliant: !!analyzeJson?.compliant,
      trees_counted: analyzeJson?.trees_counted ?? analyzeJson?.tree_count ?? analyzeJson?.analysis_details?.tree_count,
      standard_met: analyzeJson?.standard_met,
      confidence: analyzeJson?.confidence ?? analyzeJson?.analysis_details?.confidence_level,
      confidence_score: analyzeJson?.confidence_score ?? analyzeJson?.analysis_details?.confidence_score,
      raw: analyzeJson,
    };

    result.value = normalized;

    // Optional: front-end validation (require >= 3 trees)
    if (!normalized.compliant || (typeof normalized.trees_counted === 'number' && normalized.trees_counted < 3)) {
      // Keep result visible; message is shown in template
    }
  } catch (e: any) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
  
}

</script>

<style scoped>
.page { max-width: 680px; margin: 2rem auto; padding: 0 1rem; }
.title { font-size: 1.6rem; margin-bottom: 1rem; }
.subtitle { font-size: 1.2rem; margin-bottom: .5rem; }
.card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 1rem; background: #fff; }
.field { margin-bottom: 1rem; }
.label { display: block; font-weight: 600; margin-bottom: .4rem; }
.input { display: block; }
.actions { margin-top: .5rem; }
.btn {
  appearance: none; border: none; border-radius: 10px; padding: .6rem 1rem;
  background: #111827; color: #fff; cursor: pointer;
}
.btn[disabled] { opacity: .6; cursor: not-allowed; }
.preview { margin: .75rem 0; }
.preview img { max-width: 100%; border-radius: 8px; border: 1px solid #e5e7eb; }
.error { color: #b91c1c; margin-top: .75rem; }
.warn { color: #b45309; margin-top: .5rem; }
.ok { color: #065f46; margin-top: .5rem; }
.kv { list-style: none; padding: 0; margin: .5rem 0 0; }
.kv li { margin: .2rem 0; }
</style>
