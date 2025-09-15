<template>
  <Header />
  <div class="page-wrapper">
    <div class="container">
      <h1 class="title">Track Your Plant Health With AI</h1>
      <h3 class="subtitle">
        Upload a photo and describe your plant — we’ll check how it’s doing and provide personalized care recommendations
      </h3>

      <form class="card" @submit.prevent="handleSubmit">
        <div class="upload-box">
          <div v-if="previewUrl" class="preview inside-upload-box">
            <div>
              <img :src="previewUrl" alt="preview" />
            </div>
            <label class="upload-button" @click="resetPreview">
              <img src="@/assets/icon_camera.png" width="16" alt="Camera Icon" />
              <span>Change Photo</span>
            </label>
          </div>

          <div v-else class="inside-upload-box">
            <img src="@/assets/icon_upload.png" width="40" class="center-self" alt="" />
            <h2 class="upload-title">Upload a photo of your plant</h2>
            <label class="upload-button">
              <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" @change="onFileSelected" hidden />
              <img src="@/assets/icon_camera.png" width="16" alt="Camera Icon" />
              <span>Choose Photo</span>
            </label>
          </div>
        </div>

        <!-- Consent checkbox -->
        <div class="consent">
          <label>
            <input type="checkbox" v-model="allowShow" :disabled="loading" />
            Allow us to use your image for display
          </label>
        </div>

        <button class="analyze-button" :disabled="!file || loading">
          <img src="@/assets/icon_analyze.png" width="16" alt="Analyze Icon" />
          <span v-if="!loading">Analyze Plant Health</span>
          <span v-else>Working…</span>
        </button>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="deleteInfo" class="info">{{ deleteInfo }}</p>
      </form>

      <!-- Results -->
      <div v-if="result" class="card" style="margin-top:1rem;">
        <h2 class="upload-title" style="margin-bottom:8px;">Analysis Result</h2>
        <ul class="kv">
          <li v-if="result?.species">
            <strong>Species:</strong> {{ result.species }} ({{ result.common_name }})
          </li>
          <li v-if="result?.family">
            <strong>Family:</strong> {{ result.family }}
          </li>
          <li v-if="result?.confidence !== undefined">
            <strong>Identification confidence:</strong> {{ result.confidence }}%
          </li>
          <li v-if="result?.overall_status">
            <strong>Overall status:</strong> {{ result.overall_status }}
          </li>
          <li v-if="result?.health_score">
            <strong>Health score:</strong> {{ result.health_score }}
          </li>
          <li v-if="result?.confidence_level">
            <strong>Assessment confidence:</strong> {{ result.confidence_level }}
          </li>
          <li v-if="result?.quick_summary">
            <strong>Summary:</strong> {{ result.quick_summary }}
          </li>
        </ul>

        <div v-if="result?.care_recommendations?.length" style="margin-top:10px;">
          <h3 class="subtitle" style="text-align:left;">Care recommendations</h3>
          <ul>
            <li v-for="(rec, idx) in result.care_recommendations" :key="idx">
              <strong>{{ rec.category }}:</strong> {{ rec.recommendation }}
            </li>
          </ul>
        </div>

        <div v-if="result?.issues_identified?.length" style="margin-top:10px;">
          <h3 class="subtitle" style="text-align:left;">Issues identified</h3>
          <ul>
            <li v-for="(it, idx) in result.issues_identified" :key="idx">
              <strong>{{ it.type }}</strong> — {{ it.severity }}. {{ it.description }}
              <span v-if="it.treatment"><em> Treatment:</em> {{ it.treatment }}</span>
            </li>
          </ul>
        </div>

        <div v-if="result?.healthy_reference" style="margin-top:10px;">
          <h3 class="subtitle" style="text-align:left;">Healthy reference</h3>
          <p>{{ result.healthy_reference.description }}</p>
          <ul>
            <li v-for="(k, i) in result.healthy_reference.key_indicators" :key="i">• {{ k }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  <Footer />
</template>

<script setup>
// ===== Replace these with your real endpoints =====
const UPLOADER_URL =
  'https://oelkz0pl2c.execute-api.ap-southeast-2.amazonaws.com/default/upload-image';
const DELETE_URL =
  'https://oelkz0pl2c.execute-api.ap-southeast-2.amazonaws.com/default/delete-object';

// TODO: put your plant-health-checker API URL here:
const PLANT_ANALYZER_URL =
  'https://efmnjv0lr3.execute-api.ap-southeast-2.amazonaws.com/plant-health';
// e.g. 'https://2piqweol0f.execute-api.ap-southeast-2.amazonaws.com/analyze'

import { ref } from 'vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';

// state
const file = ref(null);
const previewUrl = ref(null);
const loading = ref(false);
const error = ref(null);
const deleteInfo = ref(null);
const allowShow = ref(false);
const result = ref(null);

// S3 target folder for plant images
const S3_FOLDER = 'PlantHealth';

function onFileSelected(e) {
  const f = e.target.files?.[0];
  error.value = null;
  deleteInfo.value = null;
  result.value = null;

  if (!f) {
    resetPreview();
    return;
  }
  // basic client-side guard
  const ok = /\.(jpe?g|png)$/i.test(f.name);
  if (!ok) {
    error.value = 'Only JPG and PNG are allowed.';
    return;
  }
  file.value = f;
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = URL.createObjectURL(f);
}

function resetPreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = null;
  file.value = null;
  result.value = null;
  deleteInfo.value = null;
}

// Handle Lambda-proxy style: {statusCode, body: "<json>"}
async function parseMaybeLambdaProxyResponse(res) {
  const data = await res.json().catch(() => null);
  if (!data) return null;
  if ('statusCode' in data && 'body' in data && typeof data.body === 'string') {
    try { return JSON.parse(data.body); } catch { return data; }
  }
  return data;
}

async function handleSubmit() {
  error.value = null;
  deleteInfo.value = null;
  result.value = null;

  if (!file.value) {
    error.value = 'Please choose a JPG or PNG file.';
    return;
  }

  loading.value = true;
  let uploadedBucket = '';
  let uploadedKey = '';

  try {
    // 1) Upload to S3 via uploader
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

    // 2) Analyze (JSON body; plant-health-checker returns Lambda-proxy)
    const analyzePayload = {
      bucket: uploadedBucket,
      key: uploadedKey,
      include_details: true,
      check_compliance: true
    };
    const analyzeRes = await fetch(PLANT_ANALYZER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analyzePayload)
    });
    if (!analyzeRes.ok) {
      const text = await analyzeRes.text().catch(() => '');
      throw new Error(text || `Analyzer failed (${analyzeRes.status})`);
    }
    const analyze = await parseMaybeLambdaProxyResponse(analyzeRes) ?? {};

    // 3) Normalize for UI
    const species = analyze?.analysis_result?.species_identification;
    const sa = analyze?.analysis_result?.structured_analysis;
    result.value = {
      species: species?.species,
      common_name: species?.common_name,
      family: species?.family,
      confidence: species?.confidence, // %
      overall_status: sa?.health_assessment?.overall_status,
      health_score: sa?.health_assessment?.health_score,
      confidence_level: sa?.health_assessment?.confidence_level,
      quick_summary: sa?.health_assessment?.quick_summary,
      care_recommendations: sa?.care_recommendations || [],
      issues_identified: sa?.issues_identified || [],
      healthy_reference: sa?.healthy_reference || null,
      raw: analyze
    };

    // 4) If user did NOT allow display, delete the uploaded object
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
      } catch (e) {
        deleteInfo.value = `Delete attempt errored: ${e?.message || e}`;
      }
    }
  } catch (e) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  background-image: url('/bg_plant_health_check.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.container {
  max-width: 800px;
  margin: auto;
  padding: 1rem;
}
.title {
  font-size: 2rem;
  margin-bottom: 1rem;
  text-align: center;
}
.subtitle {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  text-align: center;
  font-weight: normal;
  color: #616161;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.4;
}
.card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  margin-top: 1rem;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}
.upload-box {
  width: 100%;
  background: white;
  border: 2px dashed #e9e9e9;
  border-radius: 16px;
  padding: 32px;
}
.inside-upload-box {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.upload-title { font-size: 20px; font-weight: bold; margin: 0; }
.upload-button {
  display: inline-flex; align-items: center; justify-content: center;
  margin: auto; gap: 8px; width: 100%; padding: 12px 16px;
  border: 1px solid #ccc; border-radius: 8px; background: #fff;
  cursor: pointer; font-size: 14px; font-weight: 500; transition: background 0.2s ease;
}
.upload-button:hover { background: #f1f1f1; }
.analyze-button {
  margin-top: 1.25rem; width: 100%; background: #103731; border: none; border-radius: 8px;
  padding: 12px; font-size: 16px; font-weight: bold; cursor: pointer; color: white;
}
.analyze-button:disabled { background: #b0d5cf; cursor: not-allowed; }
.center-self { align-self: center; }
.preview img { max-width: 100%; max-height: 250px; object-fit: contain; }
.error { color: #b91c1c; margin-top: .75rem; }
.info  { color: #1f2937; margin-top: .5rem; }
.kv { list-style: none; padding: 0; margin: .5rem 0 0; }
.kv li { margin: .2rem 0; }
.consent { margin-top: .75rem; }
@media screen and (min-width: 1024px) {
  .container { padding: 3rem; }
  .upload-button { width: 300px; }
}
</style>
