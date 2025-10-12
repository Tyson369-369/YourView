<template>
  <div class="page-wrapper">
    <!-- Top Navigation -->
    <Header />
    <!-- Landing Section -->
    <section class="landing-section">
      <video autoplay muted loop playsinline class="background-video">
        <source src="/HeatMapLandingPage.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div class="landing-content">
        <h1>
          Urban Trees,<br class="mobile-break" /> Cooler Cities
        </h1>
        <p>
          Cities get hot because concrete and roads soak up the sun. Trees give shade
          and act like nature’s air-conditioners, making neighborhoods up to 4° cooler.
        </p>
        <button @click="scrollToContent">Learn More</button>
      </div>
    </section>

    <section class="uhi-explainer">
      <div class="uhi-container">
        <div class="uhi-title-block">
          <h2 class="uhi-heading">The Urban Heat Island Effect</h2>
          <p class="uhi-subtitle">From farmlands to skyscrapers, surfaces change — and so does heat.</p>
        </div>
        <div class="uhi-graphic">
          <img src="@/assets/UHI_Illustration.png" alt="Urban Heat Island Illustration" @click="scrollToUhiText" />
        </div>
        <div class="uhi-text">
          <div class="uhi-cards">
            <!-- Rural & Farmland -->
            <div class="uhi-card accent-green">
              <div
                class="uhi-card-inner"
                :class="{ flipped: flippedCards[0] }"
                @click="toggleCard(0)"
              >
                <div class="uhi-card-front">
                  <div class="uhi-card-left">
                    <span class="uhi-card-icon" aria-label="Rural & Farmland">🌳🌾</span>
                    <span class="uhi-label">Rural &amp; Farmland</span>
                    <!-- <span class="uhi-desc">Cool, open and green</span> -->
                  </div>
                  <!-- <div class="uhi-card-right">
                    <span class="uhi-temp">23°C</span>
                  </div> -->
                  <!-- Temperature and description are only on the back -->
                  <span class="uhi-card-plus">+</span>
                </div>
                <div class="uhi-card-back">
                  <span class="uhi-temp">23°C</span>
                  <span class="uhi-desc">Cool, open and green</span>
                </div>
              </div>
            </div>
            <!-- Suburban Residential -->
            <div class="uhi-card accent-orange">
              <div
                class="uhi-card-inner"
                :class="{ flipped: flippedCards[1] }"
                @click="toggleCard(1)"
              >
                <div class="uhi-card-front">
                  <div class="uhi-card-left">
                    <span class="uhi-card-icon" aria-label="Suburban">🏡</span>
                    <span class="uhi-label">Suburban Residential</span>
                    <!-- <span class="uhi-desc">Warming up</span> -->
                  </div>
                  <!-- <div class="uhi-card-right">
                    <span class="uhi-temp">28°C</span>
                  </div> -->
                  <!-- Temperature and description are only on the back -->
                  <span class="uhi-card-plus">+</span>
                </div>
                <div class="uhi-card-back">
                  <span class="uhi-temp">28°C</span>
                  <span class="uhi-desc">Warming up</span>
                </div>
              </div>
            </div>
            <!-- Commercial / Downtown -->
            <div class="uhi-card accent-red">
              <div
                class="uhi-card-inner"
                :class="{ flipped: flippedCards[2] }"
                @click="toggleCard(2)"
              >
                <div class="uhi-card-front">
                  <div class="uhi-card-left">
                    <span class="uhi-card-icon" aria-label="Downtown">🏙️</span>
                    <span class="uhi-label">Commercial / Downtown</span>
                    <!-- <span class="uhi-desc">Built-up and hot</span> -->
                  </div>
                  <!-- <div class="uhi-card-right">
                    <span class="uhi-temp">34°C</span>
                  </div> -->
                  <!-- Temperature and description are only on the back -->
                  <span class="uhi-card-plus">+</span>
                </div>
                <div class="uhi-card-back">
                  <span class="uhi-temp">34°C</span>
                  <span class="uhi-desc">Built-up and hot</span>
                </div>
              </div>
            </div>
            <!-- Park -->
            <div class="uhi-card accent-green">
              <div
                class="uhi-card-inner"
                :class="{ flipped: flippedCards[3] }"
                @click="toggleCard(3)"
              >
                <div class="uhi-card-front">
                  <div class="uhi-card-left">
                    <span class="uhi-card-icon" aria-label="Park">🌲</span>
                    <span class="uhi-label">Park</span>
                    <!-- <span class="uhi-desc">Cool refuge</span> -->
                  </div>
                  <!-- <div class="uhi-card-right">
                    <span class="uhi-temp">26°C</span>
                  </div> -->
                  <!-- Temperature and description are only on the back -->
                  <span class="uhi-card-plus">+</span>
                </div>
                <div class="uhi-card-back">
                  <span class="uhi-temp">26°C</span>
                  <span class="uhi-desc">Cool refuge</span>
                </div>
              </div>
            </div>
          </div>
          <p class="uhi-explanation">
            Roads and buildings soak up sunlight, while trees cool the air through shade and evaporation.<br />
            The temperature difference can be as much as <strong>10°C</strong> between urban and rural areas.
          </p>
        </div>
        <div class="uhi-leaflet-map-container">
          <h3>Explore the Heat Zones</h3>
          <div id="uhi-leaflet-map" class="uhi-leaflet-map"></div>
        </div>
        <div class="uhi-test-container">
          <h3>Test Container</h3>
        </div>
      </div>
    </section>
    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup>
import 'leaflet/dist/leaflet.css'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import { onMounted, ref, nextTick } from 'vue'

import L from 'leaflet'

const autocompleteInput = ref(null)

onMounted(async () => {
  if (window.google && window.google.maps && window.google.maps.places && autocompleteInput.value) {
    new window.google.maps.places.Autocomplete(autocompleteInput.value, {
      componentRestrictions: { country: 'au' }
    })
  }

  await nextTick()

  setTimeout(() => {
    const mapContainer = document.getElementById('uhi-leaflet-map')
    if (!mapContainer) {
      console.error('❌ Leaflet map container not found!')
      return
    }

    console.log('✅ Forcing Leaflet map initialization...')

    const map = L.map('uhi-leaflet-map', {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true
    }).setView([-37.8136, 144.9631], 11)

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(map)

    L.marker([-37.8136, 144.9631])
      .addTo(map)
      .bindPopup('Melbourne CBD<br>Urban Heat Zone')
      .openPopup()

    // Invalidate size after rendering
    setTimeout(() => {
      map.invalidateSize()
      console.log('✅ Leaflet map size refreshed')
    }, 800)
  }, 800)
})

const suburbSelected = ref(false)
const suburbName = ref('')
const insights = ref({
  temperatureDifference: "—",
  hotDays: "—",
  ozone: "—",
  warmingRate: "—"
})

// For flipping UHI cards
const flippedCards = ref([false, false, false, false])
function toggleCard(index) {
  flippedCards.value[index] = !flippedCards.value[index]
}

function getRandomFloat(min, max, decimals = 1) {
  const factor = Math.pow(10, decimals)
  return Math.round((Math.random() * (max - min) + min) * factor) / factor
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function onSuburbSelected() {
  suburbSelected.value = true
  suburbName.value = autocompleteInput.value.value || "Selected Suburb"

  const temperatureDifference = getRandomFloat(1.5, 4.0, 1)
  const hotDays = getRandomInt(2, 10)
  const ozone = getRandomInt(1, 5)
  const warmingRate = getRandomFloat(0.1, 0.4, 1)

  insights.value = {
    temperatureDifference: `${temperatureDifference}°F warmer than rural`,
    hotDays: `${hotDays} more very hot days`,
    ozone: `Ozone higher by +${ozone} ppb`,
    warmingRate: `${warmingRate}°F per decade higher`
  }
}

function scrollToContent() {
  window.scrollTo({
    top: window.innerHeight,
    behavior: 'smooth'
  })
}
function scrollToUhiText() {
  const el = document.querySelector('.uhi-text')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<style scoped>
.page-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.heatmap-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}


.melbourne-city-section {
  height: 250px;
  background-image: url('@/assets/City_Melbourne.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  width: 100%;
}

.intro-text {
  text-align: left;
  padding: 3rem 1rem;
  background: rgba(255, 255, 255, 0.75);
  font-family: 'Arial', sans-serif;
  border-radius: 8px;
  width: 100%;
  box-sizing: border-box;
}

.intro-text h2 {
  color: #00796b;
  font-size: 2rem;
  margin-bottom: 1rem;
}

.intro-text p {
  color: #2e7d32;
  font-size: 1.2rem;
  line-height: 1.6;
  max-width: 700px;
  margin: 0 auto 1.5rem auto;
}

.address-search {
  display: flex;
  max-width: 700px;
  margin: 0 auto;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.address-search input {
  flex: 1 1 auto;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border: 2px solid #00796b;
  border-radius: 4px;
  min-width: 0;
}

.address-search button {
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  background-color: #00796b;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  flex: 0 0 auto;
  transition: background-color 0.3s ease;
}

.address-search button:hover {
  background-color: #004d40;
}

.content-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
  width: 100%;
}

.text-content {
  flex: 1;
  min-width: 300px;
}

.image-content {
  flex: 2;
  min-width: 400px;
}

.image-content img {
  width: 100%;
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  object-fit: contain;
}

.heatmap-section {
  padding: 3rem 1rem;
  background: #ffffff;
  text-align: center;
  border-radius: 8px;
  margin: 2rem auto;
  width: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.heatmap-section h2 {
  font-size: 2rem;
  color: #00796b;
  margin-bottom: 1.5rem;
}

.heatmap-placeholder {
  width: 100%;
  max-width: 100%;
  height: 500px;
  border: 2px dashed #00796b;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  font-size: 1.2rem;
  background-color: #f9f9f9;
}

.insights-section {
  margin-top: 2.5rem;
  background: #fdf6f0;
  padding: 2rem 2.5rem 3rem 2.5rem;
  border-radius: 12px;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.03);
}

.insights-section h3 {
  color: #b85c3b;
  font-weight: 900;
  font-size: 2rem;
  margin-bottom: 2rem;
  text-align: center;
  letter-spacing: 0.05em;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* New styles for insights table and suburb highlight */

.insights-table {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background-color: #f5f5f5;
  padding: 1rem 2rem;
  border-radius: 10px 10px 0 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-weight: 700;
  color: #555;
  font-size: 1rem;
  user-select: none;
}

.insight-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  opacity: 0.7;
  font-weight: 600;
  font-size: 1.1rem;
}

/* Reduce emoji size and opacity */
.insight-header > *:first-child {
  font-size: 1.2rem;
  opacity: 0.6;
}

/* Suburb highlight row */

.suburb-highlight {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background-color: #ffffff;
  padding: 1.8rem 2rem;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 4px 12px rgba(231, 111, 81, 0.15);
  gap: 0 1rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.highlight-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.highlight-number {
  font-size: 2.8rem;
  font-weight: 900;
  line-height: 1;
  user-select: text;
}

.accent-orange {
  color: #e76f51;
}

.accent-teal {
  color: #00796b;
}

.highlight-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: #555555;
  margin-top: 0.25rem;
  text-transform: lowercase;
  user-select: text;
}

.landing-section {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  font-family: 'Poppins', sans-serif;
}

.background-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  filter: brightness(80%);
}

.landing-content {
  position: relative;
  z-index: 1;
  max-width: 800px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.landing-content h1 {
  font-size: 4rem;
  font-weight: 900;
  margin-bottom: 1rem;
  text-shadow: 0 6px 18px rgba(0, 0, 0, 0.95);
  text-align: center;
}

.landing-content p {
  font-size: 1.4rem;
  font-weight: 600;
  line-height: 1.6;
  margin-bottom: 2rem;
  text-shadow: 0 6px 18px rgba(0, 0, 0, 1);
  text-align: center;
}

.landing-content button {
  background-color: #00796b;
  color: white;
  border: none;
  padding: 0.9rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 0 rgba(0, 121, 107, 0.7);
  animation: pulse 2s infinite;
}

.landing-content button:hover {
  background-color: #004d40;
  transform: scale(1.05);
}

.scroll-indicator {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 2rem;
  opacity: 0.7;
  animation: bounce 1.8s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 121, 107, 0.7);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(0, 121, 107, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 121, 107, 0);
  }
}

.mobile-break {
  display: none;
}

@media (max-width: 768px) {
  .mobile-break {
    display: inline;
  }
  .landing-content h1 {
    white-space: normal;
    font-size: 2.5rem;
  }
}

@media (min-width: 769px) {
  .landing-content h1 {
    white-space: nowrap;
  }
}

/* New styles for Urban Heat Island Explainer */

/* Urban Heat Island Explainer section with full-width graphic */
 .uhi-explainer {
   padding: 2rem 0;
   background-color: #f5f9f8;
 }

/* UHI container: centered, max width, padding for layout */
.uhi-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* Default (mobile-first): stacked, full width but contained */
 .uhi-graphic {
   flex: 1 1 100%;
   display: flex;
   justify-content: center;
   align-items: center;
   min-width: 0;
   width: 100%;
   max-width: 1200px;
   margin: 0 auto;
   padding: 2rem 2.2rem;
 }

.uhi-graphic img {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  border-radius: 10px;
  opacity: 0;
  animation: fadeIn 1s forwards ease-in;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  transform: scale(1.05);
  height: auto;
  display: block;
}

.uhi-text {
  flex: 1 1 100%;
  min-width: 0;
  background: white;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 2.2rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 121, 107, 0.15);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #004d40;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}


/* UHI title block: center-aligned heading and subtitle stacked vertically */
.uhi-title-block {
  text-align: center;
  margin-bottom: 0.375rem;
}

.uhi-heading {
  font-size: 2.5rem;
  font-weight: 900;
  color: #00796b;
  margin-bottom: 0.6rem;
  line-height: 1.2;
}

.uhi-subtitle {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2e7d32;
  margin: 0 auto 1.5rem auto;
  line-height: 1.5;
  max-width: 800px;
}

.uhi-cards {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1.1rem;
  margin-bottom: 1.5rem;
  width: 100%;
}

@keyframes uhi-breath {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}
.uhi-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08), 0 1.5px 5px rgba(60,60,60,0.03);
  width: calc(25% - 1rem);
  aspect-ratio: 1 / 1;
  min-height: auto;
  transition: box-shadow 0.2s cubic-bezier(.4,0,.2,1), transform 0.2s cubic-bezier(.4,0,.2,1);
  border: 2.5px solid transparent;
  cursor: pointer;
  padding: 0;
  perspective: 1000px;
  position: relative;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  animation: uhi-breath 4s ease-in-out infinite;
}
/* Remove hover flip */

.uhi-card:hover .uhi-card-inner {
  transform: rotateY(180deg);
}
.uhi-card:focus .uhi-card-inner {
  box-shadow: none;
  /* Keep focus style if needed, but don't override transform */
}

.uhi-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}
.uhi-card-inner.flipped {
  transform: rotateY(180deg);
}
/* UHI Card Front and Back - updated for more proportional fill */
.uhi-card-front, .uhi-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 16px;
  display: flex;
}
/* Card Front - make content fill more of the square space */
.uhi-card-front {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  width: 100%;
  height: 100%;
  padding: 1.5rem;
}

/* Card Back - style and flipping behavior */
.uhi-card-back {
  background-color: #fff;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transform: rotateY(180deg);
  text-align: center;
  padding: 1.5rem;
}

/* Card flip logic using only rotateY, no visibility toggles */
.uhi-card-front {
  transform: rotateY(0deg);
}

.uhi-card-back {
  transform: rotateY(180deg);
  position: absolute;
  top: 0;
  left: 0;
}

.uhi-card-inner.flipped {
  transform: rotateY(180deg);
}

.uhi-card-inner {
  transition: transform 0.8s ease-in-out;
  transform-style: preserve-3d;
}

.uhi-card-front, .uhi-card-back {
  backface-visibility: hidden;
}
.uhi-card-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.uhi-card-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
  line-height: 1;
  filter: drop-shadow(0 1px 0 rgba(0,0,0,0.05));
}
.uhi-label {
  font-weight: 700;
  font-size: 1.3rem;
  margin-bottom: 0.08rem;
  margin-top: 0.04rem;
  color: #004d40;
  line-height: 1.2;
  text-align: center;
}
.uhi-desc {
  font-size: 0.93rem;
  font-weight: 600;
  color: #555;
  text-transform: none;
  user-select: text;
  text-align: left;
  margin-top: 0.04rem;
  opacity: 0.93;
}
.uhi-card-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 90px;
  padding-left: 1.1rem;
}
.uhi-temp {
  font-size: 2.1rem;
  font-weight: 900;
  line-height: 1;
  user-select: text;
  text-align: right;
  display: block;
}
/* Accent colors for cards (border and temp text) */
.accent-green {
  border-color: #c8e6c9;
}
.accent-green .uhi-temp {
  color: #379a3e;
}
.accent-orange {
  border-color: #ffd6b3;
}
.accent-orange .uhi-temp {
  color: #e76f51;
}
.accent-red {
  border-color: #ffcdd2;
}
.accent-red .uhi-temp {
  color: #d32f2f;
}

.uhi-explanation {
  font-size: 1rem;
  font-weight: 600;
  color: #333333;
  line-height: 1.5;
  margin-top: 0.5rem;
  user-select: text;
}

/* Fade in animation */
@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

/* "+" icon for UHI cards */
/* "+" icon for UHI cards */
.uhi-card-plus {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.5rem;
  font-weight: 700;
  opacity: 0.6;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.accent-green .uhi-card-plus {
  color: #379a3e;
}
.accent-orange .uhi-card-plus {
  color: #e76f51;
}
.accent-red .uhi-card-plus {
  color: #d32f2f;
}

.uhi-card:hover .uhi-card-plus {
  opacity: 1;
  transform: translateX(-50%) scale(1.1);
}

/* Responsive adjustments */

@media (max-width: 768px) {
  .uhi-container {
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0.375rem;
  }
  .uhi-graphic,
  .uhi-text {
    flex: 1 1 100%;
    min-width: 0;
    max-width: 100%;
    width: 100%;
    margin: 0 auto;
  }
  .uhi-graphic {
    width: 100%;
    margin: 0 auto;
    max-width: 100%;
    padding: 1.3rem 1rem;
  }
  .uhi-graphic img {
    width: 100%;
    max-width: 100%;
    height: auto;
    border-radius: 10px;
    display: block;
    margin: 0 auto;
  }
  .uhi-text {
    padding: 1.3rem 1rem;
    max-width: 100%;
    width: 100%;
    margin: 0 auto;
  }
  .uhi-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.8rem;
    justify-items: center;
    margin-bottom: 1.5rem;
    width: 100%;
  }
  .uhi-card {
    width: 100%;
    aspect-ratio: 1 / 1;
    min-height: auto;
    padding: 0;
  }
  .uhi-card-inner,
  .uhi-card-front,
  .uhi-card-back {
    width: 100%;
    height: 100%;
  }
}
@media (min-width: 769px) {
  .uhi-container {
    flex-direction: column;
    gap: 0.375rem;
  }
  .uhi-graphic {
    flex: 1 1 100%;
    min-width: 0;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    justify-content: center;
    padding: 2rem 2.2rem;
  }
  .uhi-graphic img {
    width: 100%;
    max-width: 1200px;
    height: auto;
    border-radius: 10px;
    opacity: 0;
    animation: fadeIn 1s forwards ease-in;
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
    transform: scale(1.05);
    display: block;
    margin: 0 auto;
  }
  .uhi-text {
    flex: 1 1 100%;
    min-width: 0;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    align-self: stretch;
    padding: 2rem 2.2rem;
  }
}

</style>
<style scoped>
.uhi-test-container {
  width: 100%;
  max-width: 1200px;
  height: 300px;
  margin: 2rem auto;
  background: rgba(0, 121, 107, 0.1);
  border: 2px dashed #00796b;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #004d40;
  font-size: 1.5rem;
  font-weight: 700;
}
</style>
<style>
:deep(.leaflet-container) {
  height: 500px;
  width: 100%;
  border-radius: 12px;
}
</style>
<style scoped>
/* Leaflet Map Styles */
.uhi-leaflet-map-container {
  width: 100%;
  max-width: 1200px;
  margin: 2rem auto 0 auto;
  text-align: center;
  background: #ffffff;
  padding: 2rem 2.2rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 121, 107, 0.1);
}

.uhi-leaflet-map-container h3 {
  font-size: 1.8rem;
  color: #00796b;
  margin-bottom: 1rem;
  font-weight: 800;
}

.uhi-leaflet-map {
  width: 100%;
  height: 500px !important;
  min-height: 500px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  opacity: 1 !important;
  background: #e0f2f1; /* light fallback in case tiles fail */
}
</style>

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}
/* Ensure card inner content fills full square on desktop too */
.uhi-card-inner,
.uhi-card-front,
.uhi-card-back {
  width: 100%;
  height: 100%;
}