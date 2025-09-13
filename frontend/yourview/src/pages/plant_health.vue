<template>
    <Header />
  <div class="page-wrapper">
    <div class="container">
      <h1 class="title">Track Your Plant Health With AI</h1>
      <h3 class="subtitle">Upload a photo and describe your plant - we’ll check how it’s doing and provide personalized care recommendations</h3>

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
              <input type="file" accept="image/*" @change="onFileSelected" hidden />
              <img src="@/assets/icon_camera.png" width="16" alt="Camera Icon" />
              <span>Choose Photo</span>
            </label>
          </div>
        </div>

        <button class="analyze-button" :disabled="!file">
              <img src="@/assets/icon_analyze.png" width="16" alt="Camera Icon" />
              Analyze Plant Health</button>

        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </div>
    <Footer />
</template>

<script setup>
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
</script>

<script>
export default {
  name: 'UploadPage',
  data() {
    return {
      file: false,
      previewUrl: null,
    }
  },
  methods: {
    onFileSelected(event) {
      const file = event.target.files[0]
      if (file) {
        this.previewUrl = URL.createObjectURL(file)
        this.file = true
      } else {
        this.previewUrl = null
        this.file = false
      }
    },
    resetPreview() {
      this.previewUrl = null
      this.file = false
    },
  },
}
</script>

<style scoped>
.page-wrapper {
  height: 100vh;
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
  color: #616161;       /* lighter gray color */
  max-width: 600px;     /* limit width so it wraps into 2 lines */
  margin-left: auto;
  margin-right: auto;   /* center align when max-width is applied */
  line-height: 1.4;     /* optional: improve readability */
}
.card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  margin-top: 1rem;
  background: #fff;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
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

.upload-icon {
  font-size: 40px;
  background: #0f3d2e;
  color: white;
  width: 60px;
  height: 60px;
  margin: 0 auto;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.upload-title {
  font-size: 20px;
  font-weight: bold;
  margin: 0;
}

.upload-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.upload-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: auto;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s ease;
}

.upload-button:hover {
  background: #f1f1f1;
}

.analyze-button {
  margin-top: 3rem;
  width: 100%;
  background: #103731;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  color: white;
}

.analyze-button:disabled {
  background: #b0d5cf;
  cursor: not-allowed;
}

.center-self {
  align-self: center;
}

.preview img {
  max-width: 100%;
  max-height: 250px;
  object-fit: contain;
}

@media screen and (min-width: 1024px) {
  .container {
    padding: 3rem;
  }
  .upload-button {
    width: 300px;
  }
}
</style>