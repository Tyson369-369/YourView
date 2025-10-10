<template>
  <div class="page-wrapper">
    <!-- Header -->
    <Header />

    <!-- Page content -->
    <main class="heatmap-main">
      <section class="intro-text">
        <div class="content-wrapper">
          <div class="text-content">
            <h2>Urban Trees, Cooler Cities</h2>
            <p>
              Cities get hot because concrete and roads soak up the sun. Trees give shade
              and act like nature’s air-conditioners, making neighborhoods up to 4° cooler.
            </p>
          </div>
          <div class="image-content">
            <img src="@/assets/UHI_Illustration.png" alt="Urban Heat Island Illustration" />
          </div>
        </div>
      </section>
      <div class="scroll-arrow" @click="scrollToHeatmap">
        ↓
      </div>

      <!-- Heatmap Section -->
      <section class="heatmap-section">
        <h2>Melbourne’s Heat Map</h2>
        <div class="heatmap-placeholder">
          <iframe 
            src="/kepler_heatmap.gl.html#10/-37.8136/144.9631"
            width="100%" 
            height="100%" 
            frameborder="0" 
            style="border-radius: 8px;">
          </iframe>
        </div>

        <!-- Legend Explanation -->
        <div class="legend-explanation">
          <h3>What the Colors Mean</h3>
          <p>
            The heat map shows the average daytime land surface temperature across Melbourne suburbs.
            <span class="legend-color" style="background-color:#fee5d9;"></span> 
            <strong>Less than 26.1°C</strong> – Cooler areas, often greener or less urbanised.<br/>
            <span class="legend-color" style="background-color:#fcae91;"></span> 
            <strong>26.1°C to 30.1°C</strong> – Moderately warm, typical suburban zones.<br/>
            <span class="legend-color" style="background-color:#fb6a4a;"></span> 
            <strong>30.1°C to 34.3°C</strong> – Hotter built-up areas with limited green cover.<br/>
            <span class="legend-color" style="background-color:#cb181d;"></span> 
            <strong>34.3°C or more</strong> – Extreme heat pockets, often dense urban or industrial zones.
          </p>
        </div>

        <div class="address-search search-below-map">
          <input ref="autocompleteInput" type="text" placeholder="Enter your address" />
          <button @click="onSuburbSelected">Show My Suburb</button>
        </div>

        <div class="multi-suburb-search">
          <label for="suburb-search-input">Select Suburbs:</label>
          <input
            id="suburb-search-input"
            type="text"
            v-model="searchQuery"
            placeholder="Search suburbs"
            @keydown.enter.prevent="addSuburb"
            @input="filterSuburbs"
            autocomplete="off"
          />
          <ul v-if="filteredSuburbs.length > 0" class="autocomplete-list">
            <li
              v-for="(suburb, index) in filteredSuburbs"
              :key="index"
              @click="addSuburb(suburb)"
              class="autocomplete-item"
            >
              {{ suburb }}
            </li>
          </ul>
          <div class="selected-suburbs">
            <span
              v-for="(suburb, index) in selectedSuburbs"
              :key="index"
              class="suburb-chip"
            >
              {{ suburb }}
              <button type="button" @click="removeSuburb(index)">×</button>
            </span>
          </div>
          <div class="note-text">Select up to 3 suburbs</div>
          <label for="month-select">Select Month (optional):</label>
          <select id="month-select" v-model="selectedMonth">
            <option value="">-- Select Month --</option>
            <option v-for="month in months" :key="month" :value="month">{{ month }}</option>
          </select>
        </div>

        <!-- Insights Section: Hidden until suburb selected -->
        <div v-if="suburbSelected" class="insights-section">
          <h3>Insights for {{ suburbName }}</h3>
          <div class="insights-table">
            <div class="insight-header">🌡️ Temperature Difference</div>
            <div class="insight-header">☀️ Very Hot Days</div>
            <div class="insight-header">🌿 Ozone Levels</div>
            <div class="insight-header">📈 Warming Rates</div>
          </div>
          <div class="suburb-highlight">
            <div class="highlight-item">
              <div class="highlight-number accent-teal">2.5°F</div>
              <div class="highlight-text">warmer than rural</div>
            </div>
            <div class="highlight-item">
              <div class="highlight-number accent-orange">5 MORE</div>
              <div class="highlight-text">very hot days</div>
            </div>
            <div class="highlight-item">
              <div class="highlight-number accent-teal">+3 ppb</div>
              <div class="highlight-text">ozone higher</div>
            </div>
            <div class="highlight-item">
              <div class="highlight-number accent-orange">0.2°F</div>
              <div class="highlight-text">per decade higher</div>
            </div>
          </div>
        </div>
      </section>

      <!--
      <section class="bg-section bg1"></section>
      <section class="bg-section bg2"></section>
      <section class="bg-section bg3"></section>
      -->
      <section class="melbourne-city-section"></section>
    </main>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup>
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import { onMounted, ref, computed } from 'vue'

const autocompleteInput = ref(null)

onMounted(() => {
  if (window.google && window.google.maps && window.google.maps.places && autocompleteInput.value) {
    new window.google.maps.places.Autocomplete(autocompleteInput.value, {
      componentRestrictions: { country: 'au' }
    })
  }
})

const suburbSelected = ref(false)
const suburbName = ref('')
const insights = ref({
  temperatureDifference: "—",
  hotDays: "—",
  ozone: "—",
  warmingRate: "—"
})

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

function scrollToHeatmap() {
  const heatmapSection = document.querySelector('.heatmap-section')
  if (heatmapSection) {
    heatmapSection.scrollIntoView({ behavior: 'smooth' })
  }
}

// New reactive state variables for multi-suburb selection
const selectedSuburbs = ref([])
const searchQuery = ref('')
const selectedMonth = ref('')

const availableSuburbs = [
  'Carlton',
  'Fitzroy',
  'Richmond',
  'South Yarra',
  'St Kilda',
  'Brunswick',
  'Collingwood',
  'Parkville',
  'Prahran',
  'Footscray'
]

const filteredSuburbs = ref([])

function filterSuburbs() {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) {
    filteredSuburbs.value = []
    return
  }
  filteredSuburbs.value = availableSuburbs.filter(
    suburb =>
      suburb.toLowerCase().includes(query) &&
      !selectedSuburbs.value.includes(suburb)
  )
}

function addSuburb(suburb) {
  let suburbToAdd = suburb
  if (typeof suburb === 'object' || suburb === undefined) {
    suburbToAdd = searchQuery.value.trim()
  }
  if (
    suburbToAdd &&
    !selectedSuburbs.value.includes(suburbToAdd) &&
    selectedSuburbs.value.length < 3 &&
    availableSuburbs.includes(suburbToAdd)
  ) {
    selectedSuburbs.value.push(suburbToAdd)
  }
  searchQuery.value = ''
  filteredSuburbs.value = []
}

function removeSuburb(index) {
  selectedSuburbs.value.splice(index, 1)
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
</script>