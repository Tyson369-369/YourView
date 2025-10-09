<template>
  <div class="landing">
    <!-- HERO (pinned) -->
    <section class="hero pinned">
      <!-- Background video -->
      <video class="hero-bg" autoplay muted loop playsinline poster="/leaf_hero.jpg">
        <source src="/leaf_hero.mp4" type="video/mp4" />
      </video>

      <!-- splash overlay that fades out -->
      <div v-if="showSplash" class="splash over-video" :class="{ done: splashDone }">
        <img class="tree" src="@/assets/leaf_hero.jpg" alt="Tree" />
      </div>

      <!-- Overlay to make text readable -->
      <div class="overlay"></div>

      <!-- Hero content -->
      <div class="hero-content">
        <h1>Are You Living Green Enough?</h1>
        <p>
          Upload your view, get your Green Score, and uncover how your surroundings affect your
          health and happiness.
        </p>

        <!-- cta button -->
        <div class="cta-button">
          <button class="btn" @click="goNext('upload')">
            <span>Upload My Window View</span>
          </button>

          <button class="btn" @click="goNext('why')">
            <span>Find out why</span>
          </button>
        </div>
      </div>

      <!-- grows from bottom to top to COVER the hero (GSAP controls scaleY) -->
      <div class="cover" aria-hidden="true"></div>

      <!-- chevron points to services -->
      <a href="#services" class="scroll-down" aria-label="Scroll down">
        <svg
          width="36"
          height="36"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </a>
    </section>

    <!-- Spacer: gives the page 1 viewport of scroll so the next section can cover the fixed hero -->
    <div class="hero-spacer" aria-hidden="true"></div>

    <!-- SERVICES -->
    <section id="services" class="cover services">
      <h2 class="services-title gradient">Our Service</h2>
      <p class="services-sub">Explore how you can learn about living greener</p>

      <div class="services-wrap">
        <!-- arrows -->
        <button class="nav prev" ref="prevEl" aria-label="Previous">‹</button>
        <button class="nav next" ref="nextEl" aria-label="Next">›</button>

        <!-- Swiper -->
        <Swiper
          ref="swiperRef"
          :modules="[Autoplay]"
          :space-between="20"
          :slides-per-view="'auto'"
          :loop="true"
          :allowTouchMove="true"
          :grabCursor="true"
          :speed="3000"
          :autoplay="{
            delay: 0,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }"
          :free-mode="true"
          :free-mode-momentum="false"
          class="services-swiper"
        >
          <SwiperSlide v-for="(s, i) in services" :key="i" style="width: 320px; flex-shrink: 0">
            <article class="card" :data-idx="i">
              <img class="thumb" :src="s.img" :alt="s.title" />
              <div class="body">
                <h3>{{ s.title }}</h3>
                <p class="desc">{{ s.desc }}</p>
                <button class="btn small" @click="s.action()">{{ s.cta }}</button>
              </div>
            </article>
          </SwiperSlide>
        </Swiper>
      </div>
    </section>

    <section id="rule-330300" class="cover rule">
      <div class="rule-wrap">
        <h2 class="rule-title">
          <span class="line1">Understanding the</span><br />
          <span class="accent rotate-text" :class="transitionClass">{{ currentText }}</span>
        </h2>
        <p class="rule-sub">
          A science-based framework used by urban planners to ensure everyone has adequate access to
          nature for health and wellbeing. <br />
          <span class="rule-sub-author"> By Prof. Cecil Konijnendijk </span>
        </p>

        <!-- 3 cards -->
        <div class="rule-grid">
          <div
            v-for="(rule, i) in rules"
            :key="i"
            class="rule-card"
            @click="toggleCard(i)"
            @mouseenter="hovered = i"
            @mouseleave="hovered = null"
          >
            <transition name="fade-slide" mode="out-in">
              <div v-if="activeIndex === i" key="back" class="card-back">
                <p>{{ rule.desc }}</p>
              </div>
              <div v-else key="front" class="card-front">
                <h3>{{ rule.title }}</h3>
                <span class="hint">Tap to learn more</span>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </section>

    <!-- Quote: after 3-30-300 -->
    <section class="cover quote">
      <div class="quote-wrap">
        <blockquote class="quote-text">
          “Green equity is the next frontier. Trees are not a luxury; they’re urban infrastructure
          for health.”
        </blockquote>
        <p class="quote-source">C. Konijnendijk, World Forum on Urban Forests, 2022</p>
        <img class="quote-img" src="@/assets/konijnendijk.jpeg" alt="Portrait of C. Konijnendijk" />
      </div>
    </section>

    <!-- nature is missing -->
    <section id="nature-missing" class="nature">
      <div class="nature-wrap">
        <h2>Nature Is Missing from Our Community</h2>
        <p>
          Our cities need more nature. Trees and parks help cool streets, improve health, and create
          sustainable, livable communities where everyone can thrive
        </p>

        <div class="nature-stats">
          <div><strong>75%</strong><br />Melbourne areas NOT have enough tree cover</div>
          <div><strong>5.3M+</strong><br />Population of people living in Melbourne</div>
          <div><strong>30</strong><br />Median age in the City of Melbourne</div>
          <div><strong>86%</strong><br />Residents are calling for more green spaces</div>
        </div>
      </div>
    </section>

    <!-- footer -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import gsap from 'gsap'
import Footer from '@/components/Footer.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const goNext = (type) => {
  if (type === 'upload') {
    router.push({ name: 'upload_window' })
  } else if (type === 'why') {
    window.open('https://greenlifeindustryqld.org.au/news/3-30-300-rule/', '_blank')
  }
}

const showSplash = ref(false)
const splashDone = ref(false)

onMounted(() => {
  const hasSplash = new URLSearchParams(location.search).get('splash') === '1'
  if (!hasSplash) return

  showSplash.value = true
  setTimeout(() => {
    splashDone.value = true
  }, 1200) // start fade
  setTimeout(() => {
    showSplash.value = false
  }, 1700) // remove from dom
})

// tiny fade blur effect on scroll using CSS var
onMounted(() => {
  const onScroll = () => {
    const y = Math.min(window.scrollY, window.innerHeight)
    const p = y / window.innerHeight // 0 -> 1 while covering
    document.documentElement.style.setProperty('--hero-progress', p.toString())
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

// card carousel
const swiperRef = ref(null)
const prevEl = ref(null)
const nextEl = ref(null)

const services = [
  {
    // first service
    img: new URL('@/assets/our-service-window.png', import.meta.url),
    title: 'Check your green score',
    desc: 'Is your home green enough? Upload a photo and find out — trees, cover, and parks measured by the 3-30-300 rule.',
    cta: 'Upload my window',
    action: () => router.push({ name: 'upload_window' }),
  },
  {
    // second service
    img: new URL('@/assets/our-service-heat.png', import.meta.url),
    title: 'Check your suburb heat',
    desc: 'Is your suburb overheating? Cities lose plants, gain concrete, and lock in heat — the Urban Heat Island Effect.',
    cta: 'Check suburb heat',
    action: () => router.push({ name: 'heatmap' }),
  },
  {
    // third service
    img: new URL('@/assets/our-service-planth-health.png', import.meta.url),
    title: 'Keep your plant alive',
    desc: 'Got a struggling plant? Snap it, get instant tips, and bring the green back into your space.',
    cta: 'Open Plant Health',
    action: () => router.push({ name: 'plant_health' }),
  },
  {
    // fourth service
    img: new URL('@/assets/our-service-plant-suggestion.png', import.meta.url),
    title: 'Find Your Green Companion',
    desc: 'Discover 3 plants made for you. Shuffle for more and learn how to care for them with ease.',
    cta: 'My Green Picks',
    action: () => router.push({ name: 'plant_health' }),
    // the page have not created
  },
  {
    // fifth service
    img: new URL('@/assets/our-service-ct-mel.png', import.meta.url),
    title: 'Raise your voice',
    desc: 'Your voice matters! Request more green space and vote for the next green laneway to cool our city. We want to hear from you!',
    cta: 'Contact council',
    action: () =>
      window.open('https://services.melbourne.vic.gov.au/report/treemaintenance', '_blank'),
    // the petition page have not created
  },
]

onMounted(() => {
  const cards = document.querySelectorAll('.services-swiper .card')

  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        scale: 1.05,
        y: -8,
        boxShadow: '0 16px 32px rgba(0,0,0,0.15)',
        duration: 0.3,
        ease: 'power3.out',
      })
    })
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        scale: 1,
        y: 0,
        boxShadow: '0 10px 24px rgba(0,0,0,0.1)',
        duration: 0.3,
        ease: 'power3.out',
      })
    })
  })
})

// 3-30-300 rule heading
const rotatingTexts = ['3 Trees Rule', '30% Canopy Rule', '300m Access Rule']
const currentText = ref(rotatingTexts[0])
const transitionClass = ref('fade-in') // start in visible state
let index = 0
let interval = null

onMounted(() => {
  interval = setInterval(async () => {
    // fade out upwards
    transitionClass.value = 'fade-out'
    await new Promise((resolve) => setTimeout(resolve, 500)) // wait for fade-out

    // change text
    index = (index + 1) % rotatingTexts.length
    currentText.value = rotatingTexts[index]

    // fade in new word
    transitionClass.value = 'fade-in'
  }, 2500)
})

onBeforeUnmount(() => clearInterval(interval))

// 3-30-300 rule card fade
const rules = [
  {
    title: '3 Trees from your window',
    desc: 'You should be able to see at least 3 trees from your home window for mental wellbeing and connection to nature.',
  },
  {
    title: '30% Neighbourhood canopy',
    desc: 'Your local area needs 30% tree canopy coverage to reduce urban heat and improve air quality.',
  },
  {
    title: '300m Green space access',
    desc: 'A quality green space should be within 300 metres (5–10 min walk) for regular nature contact.',
  },
]

const hovered = ref(null)
const activeIndex = ref(null)

const toggleCard = (i) => {
  // for mobile: toggle on tap
  activeIndex.value = activeIndex.value === i ? null : i
}
</script>

<style scoped>
/* entry splash */
.splash.over-video {
  position: fixed;
  inset: 0;
  z-index: 5;
  background: #f8fef6;
  display: grid;
  place-items: center;
  transition: opacity 0.5s ease;
}
.splash.over-video.done {
  opacity: 0;
  pointer-events: none;
}

.splash .tree {
  width: 200px;
  animation: grow 1.2s ease-out forwards;
}
@keyframes grow {
  0% {
    transform: scale(0.7);
    opacity: 0;
  }
  60% {
    transform: scale(1.06);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

:root {
  --hero-progress: 0;
}

/* ===== HERO (pinned) ===== */
.hero.pinned {
  position: fixed;
  inset: 0;
  z-index: 0;
}

.hero-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  object-fit: cover;
}

.overlay {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 1;
  background: rgba(0, 0, 0, calc(0.35 + 0.25 * var(--hero-progress)));
  transition: background 0.2s linear;
}

.hero-content {
  position: relative;
  z-index: 3;
  text-align: center;
  color: #ffffff;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1.25rem;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  min-height: 100vh;
  gap: 1rem;

  opacity: calc(1 - 0.75 * var(--hero-progress));
  transform: translateY(calc(-10px * var(--hero-progress)));
  transition:
    opacity 0.2s linear,
    transform 0.2s linear;
}

.cta-button {
  display: flex;
  gap: 20px;
  justify-content: center;
  align-items: center;
}

.btn {
  background: transparent; /* transparent background */
  color: white;
  border: 2px solid white; /* white border */
  border-radius: 8px; /* rounded corners */
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:hover {
  background: white; /* hover effect */
  color: black;
}

/* hero wording */
h1 {
  font-size: clamp(2rem, 4.5vw, 3.5rem);
  line-height: 1.1;
}

h2 {
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  margin-bottom: 1rem;
}

p {
  max-width: 60ch;
  margin: 0 auto 1rem;
}

/* ===== COVER SECTIONS (scrolling content) ===== */
.cover {
  position: relative;
  z-index: 1;
  /* above the fixed hero */
  background: #f8fef6;
  min-height: 80vh;
  padding: 3.5rem 1.5rem;
}

/* Creates the initial scroll area so the next section can slide over the fixed hero */
.hero-spacer {
  height: 100vh;
}

/* SERVICES */
.services {
  padding-top: 4rem;
  padding-bottom: 5rem;
}

.services-title {
  text-align: center;
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  letter-spacing: 1px;
  line-height: 1.1;
  margin-top: 2rem;
  margin-bottom: 0.25rem;
}

.services-sub {
  text-align: center;
  font-size: clamp(1rem, 2vw, 1.5rem);
  letter-spacing: 0.3px;
  opacity: 0.9;
  color: #4b5a52;
  margin-bottom: 1.5rem;
}

.services-wrap {
  position: relative;
  max-width: 1100px;
  margin: 0 auto;
}

.services-swiper .swiper-wrapper {
  display: flex;
  justify-content: center;
}

.services-swiper:hover {
  cursor: grab;
  opacity: 0.95;
  transition: opacity 0.3s ease;
}

.gradient {
  background: linear-gradient(90deg, #14532d, #22c55e, #166534);
  background-size: 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  animation: gradientFlow 6s linear infinite;
  transition:
    background-position 0.8s ease,
    transform 0.3s ease;
  display: inline-block;
}

/* shimmer animation */
@keyframes gradientMove {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
}

/* hover interaction: shifts gradient, soft scale */
.gradient:hover {
  background-position: 100% 50%;
  transform: scale(1.04);
  text-shadow: 0 0 10px rgba(34, 197, 94, 0.35);
}

/* cards */
.services-swiper {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0.5rem 1.25rem;
}

.card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transform-origin: center;
  transition: box-shadow 0.3s ease;

  width: 300px;
  height: 380px;
  display: flex;
  flex-direction: column;
}

.card .thumb {
  width: 100%;
  height: 170px;
  object-fit: cover;
  display: block;
}

.card .body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 14px 14px 16px;
}

.card h3 {
  font-size: 1rem;
  margin: 0 0 0.35rem;
}

.card .desc {
  font-size: 0.9rem;
  color: #4c5a53;
  line-height: 1.45;
  min-height: 3.5em;
  margin-bottom: 0.75rem;
}

.btn.small {
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  border-radius: 10px;
  background: #103731;
  color: #fff;
  border: none;
  cursor: pointer;
}

.btn.small:hover {
  filter: brightness(1.05);
}

.cover.services {
  min-height: 60vh;
  display: grid;
  place-content: center;
  padding: 2rem 1rem;
  background: #f8fef6;
}

.services-swiper {
  overflow: hidden;
  padding: 1rem 0;
}

.services-swiper:hover {
  cursor: grab;
}

.services-swiper .swiper-wrapper {
  transition-timing-function: linear;
}

/* 3-30-300 */
.cover.rule {
  background: #ffffff;
  padding: 5rem 2rem;
  min-height: auto;
}

.rule-wrap {
  max-width: 1100px;
  margin: 0 auto;
  border-radius: 16px;
  padding: 1rem 2rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  border: 1px solid #e6e6e6;
  background: linear-gradient(135deg, #e0f7da 0%, #a5d6a7 50%, #226925 100%);
}

.rule-title {
  text-align: center;
  font-size: clamp(0.5rem, 3vw, 4rem);
  font-weight: 800;
  letter-spacing: 1px;
}

.rotate-text {
  display: inline-block;
  min-width: 160px;
  text-align: center;
  color: #ffffff;
  background: #0f7b4a;
  padding: 0.25em 0.5em;
  border-radius: 6px;
  font-weight: 800;
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
}

/* Fade-out: move upward */
.rotate-text.fade-out {
  opacity: 0;
  transform: translateY(-20px);
}

/* Fade-in: move upward from below */
.rotate-text.fade-in {
  opacity: 1;
  transform: translateY(0);
}

.rule-sub {
  text-align: center;
  font-size: clamp(1rem, 1vw, 1.5rem);
  letter-spacing: 0.3px;
  opacity: 0.9;
  color: #4b5a52;
  margin-bottom: 1.5rem;
}

/* Flip Card Container */
.rule-grid {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}

/* Each rule card */
.rule-card {
  position: relative;
  height: 120px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  background: #fff;
  color: #14532d;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1rem;
  cursor: pointer;
  overflow: hidden;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.rule-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

/* Vue transition */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* text styling */
.card-front h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
}
.card-back p {
  font-size: 1.25rem;
  line-height: 1.4;
  color: #1a2b20;
}

/* responsive */
@media (max-width: 700px) {
  .rule-grid {
    gap: 1rem;
  }
  .rule-card {
    height: auto;
    min-height: 160px;
    padding: 1.25rem;
  }
}

.hint {
  margin-top: 0.4rem;
  font-size: 0.85rem;
  color: #22c55e;
  font-weight: 500;
}

/* callout */
.rule-callout {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  background: #faf0f0;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  border: 1px solid #e6eee9;
}

.rule-callout .tag {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: #ffedd5;
  color: #b45309;
  font-weight: 700;
}

.rule-callout h4 {
  margin: 0 0 4px;
  font-size: 1rem;
}

.rule-callout p {
  margin: 0;
  color: #4c5a53;
}

.flip-card:hover .flip-inner {
  transform: scale(1.02) rotateY(var(--flip-angle, 0));
  transition: transform 0.4s ease;
}

/* quote section (after 3-30-300) */
.cover.quote {
  background: #f8fef9;
  padding: 5rem 1.5rem;
  padding-bottom: 2.5rem;
  display: flex;
  justify-content: center;
  min-height: auto;
}

.quote-wrap {
  max-width: 850px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  position: relative;
}

.quote-text {
  font-size: clamp(2.5rem, 2vw, 4rem);
  font-weight: 800;
  color: #1a2b20;
  line-height: 1.5;
  max-width: 700px;
  position: relative;
  font-style: italic;
}

.quote-source {
  color: #4a5d51;
  font-size: 0.95rem;
  font-style: italic;
  margin-top: -0.5rem;
}

/* Portrait styling */
.quote-img {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 50%;
  border: 4px solid #eaf4ec;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.quote-img:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

/* nature is missing */
.nature {
  background: linear-gradient(135deg, #1a7733, #77a947);
  color: #fff;
  padding: 4rem 1.5rem;
  position: relative;
}

.nature-wrap {
  max-width: 1100px;
  margin: 0 auto;
  text-align: center;
}

.nature h2 {
  font-size: clamp(1.8rem, 3vw, 2.2rem);
  margin-bottom: 1rem;
}

.nature p {
  max-width: 60ch;
  margin: 0 auto 2rem;
  opacity: 0.9;
}

.nature-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
}

.nature-stats strong {
  font-size: 1.8rem;
}

@media (max-width: 800px) {
  .nature-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 500px) {
  .nature-stats {
    grid-template-columns: 1fr;
  }
}

footer {
  position: relative;
  z-index: 2;
}
</style>
