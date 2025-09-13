<template>
  <div class="page">
    <!-- header -->
    <Header />
    <h1 class="title">Check your plant health</h1>

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
    <!-- footer -->
        <Footer />
    </div>
    </template>

    <script setup>
    import Header from '@/components/Header.vue'
    import Footer from '@/components/Footer.vue'
    </script>