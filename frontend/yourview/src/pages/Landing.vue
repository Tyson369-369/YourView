<template>
  <div class="landing">
    <!-- HERO (pinned) -->
    <section class="hero pinned">
      <!-- Background video -->
      <video class="hero-bg" autoplay muted loop playsinline poster="/leaf_hero.jpg">
        <source src="/leaf_hero.mp4" type="video/mp4" />
      </video>

      <!-- Overlay to make text readable -->
      <div class="overlay"></div>

      <!-- Hero content -->
      <div class="hero-content">
        <h1>Are You Living Green Enough?</h1>
        <p>Upload your view, get your Green Score, and uncover how your surroundings affect your health and happiness.
        </p>

        <!-- button -->
        <button ref="btnEl" class="btn" @click="goNext">
          <span>Upload My Window View</span>
        </button>

        <button ref="btnE2" class="btn" @click="goNext">
          <span>Find out why</span>
        </button>

      </div>

      <!-- grows from bottom to top to COVER the hero (GSAP controls scaleY) -->
      <div class="cover" aria-hidden="true"></div>

      <!-- chevron points to services -->
      <a href="#services" class="scroll-down" aria-label="Scroll down">
        <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </a>
    </section>

    <!-- Spacer: gives the page 1 viewport of scroll so the next section can cover the fixed hero -->
    <div class="hero-spacer" aria-hidden="true"></div>


    <!-- SERVICES -->
    <section id="services" class="cover services">
      <h2 class="services-title">Our Service</h2>
      <p class="services-sub">Explore how you can learn about living greener</p>

      <div class="services-wrap">
        <!-- arrows -->
        <button class="nav prev" ref="prevEl" aria-label="Previous">‹</button>
        <button class="nav next" ref="nextEl" aria-label="Next">›</button>

        <!-- Swiper -->
        <Swiper ref="swiperRef" :modules="[Navigation]" :navigation="{ prevEl: prevEl, nextEl: nextEl }"
          :space-between="20" :slides-per-view="1.1" :breakpoints="{
            640: { slidesPerView: 1.4 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 }
          }" :speed="450" @after-init="onInit" @slide-change="onSlideChange" class="services-swiper">
          <SwiperSlide v-for="(s, i) in services" :key="i">
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

    <!-- footer -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import gsap from 'gsap'
import Footer from '@/components/Footer.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// tiny fade/blur effect on scroll using CSS var (no library)
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
    // img: new URL('@/assets/green.jpg', import.meta.url),
    title: 'Check your green score',
    desc: 'Upload a photo from your window to get a greenery score and nearby parks.',
    cta: 'Upload my window',
    action: () => router.push({ name: 'upload_window' })
  },
  {
    // second service
    // img: new URL('@/assets/suburb.jpg', import.meta.url),
    title: 'Check your suburb heat',
    desc: 'See a heat risk index combining tree cover, surfaces and shading.',
    cta: 'Check suburb heat',
    action: () => router.push({ name: 'intro-step1' })
  },
  {
    // third service
    // img: new URL('@/assets/plant.jpg', import.meta.url),
    title: 'Keep your plant alive',
    desc: 'Care schedules, health check and quick tips with your camera.',
    cta: 'Open Plant Health',
    action: () => router.push({ name: 'intro-step2' })
  },
  {
    // fourth service
    // img: new URL('@/assets/plant.jpg', import.meta.url),
    title: 'Raise your voice',
    desc: 'Your voice matters! Request more green space, report dying trees, and vote for the next green laneway to cool our city. We want to hear from you!',
    cta: 'Contact council',
    action: () => router.push({ name: 'intro-step2' })
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
        ease: 'power3.out'
      })
    })
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        scale: 1,
        y: 0,
        boxShadow: '0 10px 24px rgba(0,0,0,0.1)',
        duration: 0.3,
        ease: 'power3.out'
      })
    })
  })
})

</script>

<style scoped>
:root {
  /* 0 at top, 1 when the next section fully covers the hero */
  --hero-progress: 0;
}

/* ===== HERO (pinned) ===== */
.hero.pinned {
  position: fixed;
  inset: 0;
  z-index: -1;
}

.hero-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, calc(0.35 + 0.25 * var(--hero-progress)));
  transition: background 0.2s linear;
}

.hero-content {
  position: relative;
  z-index: 2;
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
  transition: opacity 0.2s linear, transform 0.2s linear;
}

.cta {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #103731;
  color: #ffffff;
  border-radius: 8px;
  font-weight: 700;
  text-decoration: none;
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
  background: #F8FEF6;
  min-height: 100vh;
  padding: 6rem 1.5rem;
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
  font-size: clamp(1.6rem, 2.5vw, 2.2rem);
  margin-bottom: .25rem;
}

.services-sub {
  text-align: center;
  color: #566;
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

/* arrows */
.nav {
  position: absolute;
  top: 42%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid #cfd9d4;
  background: #fff;
  cursor: pointer;
  z-index: 3;
  display: grid;
  place-items: center;
  font-size: 22px;
  line-height: 1;
  box-shadow: 0 4px 14px rgba(0, 0, 0, .07);
}

.nav:hover {
  background: #f7fbf9;
}

.nav.prev {
  left: -8px;
}

.nav.next {
  right: -8px;
}

/* cards */
.services-swiper {
  max-width: 1000px;       
  margin: 0 auto;
  padding: .5rem 1.25rem;
}

.card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transform-origin: center center;
  transition: box-shadow .25s ease;
}

.card .thumb {
  width: 100%;
  height: 170px;
  object-fit: cover;
  display: block;
}

.card .body {
  padding: 14px 14px 16px;
}

.card h3 {
  font-size: 1rem;
  margin: 0 0 .35rem;
}

.card .desc {
  font-size: .9rem;
  color: #4c5a53;
  line-height: 1.45;
  min-height: 3.5em;
  margin-bottom: .75rem;
}

.btn.small {
  padding: .5rem .75rem;
  font-size: .9rem;
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
  min-height: 100vh;          
  display: grid;              
  place-content: center;      
  padding: 3rem 1.5rem;     
  background: #F8FEF6;
}
</style>
