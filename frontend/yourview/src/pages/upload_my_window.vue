<template>
  <Header />
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

      <!-- NEW: consent checkbox -->
      <div class="field checkbox">
        <label>
          <input type="checkbox" v-model="allowShow" :disabled="loading" />
          Allow us to use your image for display
        </label>
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
      <p v-if="deleteInfo" class="info">{{ deleteInfo }}</p>
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
  <Footer />
</template>

<script setup lang="ts">
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'

const UPLOADER_URL =
  'https://oelkz0pl2c.execute-api.ap-southeast-2.amazonaws.com/default/upload-image';
const ANALYZER_URL =
  'https://2piqweol0f.execute-api.ap-southeast-2.amazonaws.com/analyze';

// NEW: delete endpoint on your uploader API
const DELETE_URL =
  'https://oelkz0pl2c.execute-api.ap-southeast-2.amazonaws.com/default/delete-object';

import { ref } from 'vue';

const file = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const result = ref<any | null>(null);

// NEW: consent state & delete feedback
const allowShow = ref(false);
const deleteInfo = ref<string | null>(null);

// Folder must match your uploader config
const S3_FOLDER = 'YourWindow';

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  file.value = input.files?.[0] ?? null;
  error.value = null;
  result.value = null;
  deleteInfo.value = null;

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

// Helper: parse possible Lambda-proxy shape
async function parseMaybeLambdaProxyResponse(res: Response) {
  const data = await res.json().catch(() => null);
  if (!data) return null;
  if ('statusCode' in (data as any) && 'body' in (data as any) && typeof (data as any).body === 'string') {
    try { return JSON.parse((data as any).body); } catch { return data; }
  }
  return data;
}

async function handleSubmit() {
  error.value = null;
  result.value = null;
  deleteInfo.value = null;

  if (!file.value) {
    error.value = 'Please choose a JPG or PNG file.';
    return;
  }
  const extOk = /\.(jpe?g|png)$/i.test(file.value.name);
  if (!extOk) {
    error.value = 'Only JPG and PNG are allowed.';
    return;
  }

  loading.value = true;
  let uploadedBucket = '';
  let uploadedKey = '';

  try {
    // 1) Upload
    const form = new FormData();
    form.append('file', file.value);
    form.append('folder', S3_FOLDER);

    const uploadRes = await fetch(UPLOADER_URL, { method: 'POST', body: form });
    if (!uploadRes.ok) {
      const text = await uploadRes.text().catch(() => '');
      let detail = '';
      try { const j = JSON.parse(text); detail = j?.detail ?? ''; } catch {}
      throw new Error(detail || `Upload failed (${uploadRes.status})`);
    }
    const uploadJson = await uploadRes.json();
    uploadedBucket = uploadJson.bucket || uploadJson.s3_bucket || uploadJson.Bucket;
    uploadedKey    = uploadJson.key    || uploadJson.s3_key    || uploadJson.Key;
    if (!uploadedBucket || !uploadedKey) throw new Error('Upload did not return bucket/key.');


    const analyzePayload = {
      bucket: uploadedBucket,
      key: uploadedKey,
      include_details: true,
      check_compliance: true,
    };
    const analyzeRes = await fetch(ANALYZER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analyzePayload),
    });
    if (!analyzeRes.ok) {
      const text = await analyzeRes.text().catch(() => '');
      throw new Error(text || `Analyzer failed (${analyzeRes.status})`);
    }
    const analyzeJson = await parseMaybeLambdaProxyResponse(analyzeRes) ?? {};
    const normalized = {
      compliant: !!(analyzeJson?.compliant ?? analyzeJson?.is_compliant),
      trees_counted:
        analyzeJson?.trees_counted ??
        analyzeJson?.tree_count ??
        analyzeJson?.analysis_details?.tree_count,
      standard_met: analyzeJson?.standard_met,
      confidence:
        analyzeJson?.confidence ??
        analyzeJson?.analysis_details?.confidence_level,
      confidence_score:
        analyzeJson?.confidence_score ??
        analyzeJson?.analysis_details?.confidence_score,
      raw: analyzeJson,
    };
    result.value = normalized;

    // 3) If user did NOT allow display, delete the just-uploaded object
    if (!allowShow.value) {
      try {
        const delRes = await fetch(DELETE_URL, {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket: uploadedBucket, key: uploadedKey })
        });
        if (!delRes.ok) {
          const text = await delRes.text().catch(() => '');
          deleteInfo.value = `Tried to delete image but failed: ${text || delRes.status}`;
        } else {
          deleteInfo.value = 'The uploaded image has been deleted (no display consent).';
        }
      } catch (e: any) {
        deleteInfo.value = `Delete attempt errored: ${e?.message || e}`;
      }
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
.field.checkbox { display: flex; align-items: center; }
.label { display: block; font-weight: 600; margin-bottom: .4rem; }
.input { display: block; }
.actions { margin-top: .5rem; }
.btn { appearance: none; border: none; border-radius: 10px; padding: .6rem 1rem; background: #111827; color: #fff; cursor: pointer; }
.btn[disabled] { opacity: .6; cursor: not-allowed; }
.preview { margin: .75rem 0; }
.preview img { max-width: 100%; border-radius: 8px; border: 1px solid #e5e7eb; }
.error { color: #b91c1c; margin-top: .75rem; }
.info { color: #1f2937; margin-top: .5rem; }
.warn { color: #b45309; margin-top: .5rem; }
.ok { color: #065f46; margin-top: .5rem; }
.kv { list-style: none; padding: 0; margin: .5rem 0 0; }
.kv li { margin: .2rem 0; }
</style>

