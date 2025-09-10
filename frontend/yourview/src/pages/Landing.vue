<template>
  <div class="landing">
    <!-- HERO (pinned) -->
    <section class="hero pinned">
      <!-- Background video -->
      <video class="hero-bg" autoplay muted loop playsinline poster="/leaf_hero.jpg">
        <source src="/leaf_hero.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <!-- Overlay to make text readable -->
      <div class="overlay"></div>

      <!-- Hero content -->
      <div class="hero-content">
        <h1>Is Your Neighbourhood Green Enough?</h1>
        <p>Less than 25% of Melbourne has enough tree cover. Find out if your area is one of them.</p>
        <router-link to="/try" class="cta">Try the checker</router-link>
      </div>

      <!-- scroll down indicator -->
      <a href="#how-it-works" class="scroll-down" aria-label="Scroll down">
        <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </a>
    </section>

    <!-- Spacer: gives the page 1 viewport of scroll so the next section can cover the fixed hero -->
    <div class="hero-spacer" aria-hidden="true"></div>

  <!-- PROBLEM STATEMENT (Horizontal Scroll Section) -->
  <section id="problem-statement" class="horizontal" aria-label="The Problem Today">
    <div class="hwrap">
      <div class="htrack">
        <article class="panel">
          <div class="panel-text">
            <h2>The Problem Today</h2>
            <p>Only <strong>25%</strong> of Melbourne meets the 3–30–300 rule…</p>
          </div>
        </article>
        <article class="panel">
          <img class="insta" :src="instagram1" alt="Instagram post 1" />
        </article>
        <article class="panel">
          <img class="insta" :src="instagram2" alt="Instagram post 2" />
        </article>
        <article class="panel">
          <img class="insta" :src="instagram3" alt="Instagram post 3" />
        </article>
      </div>
    </div>
  </section>

<!-- why is it matter -->
<section id="why-matter" class="cover alt why">
  <div class="container two-col">
    <!-- LEFT: BeerSlider media card -->
    <figure class="why-media">
      <div class="beer-slider" data-beer-label="Low canopy">
        <img src="@/assets/fat_after.jpg" alt="Street before tree canopy" />
        <div class="beer-reveal" data-beer-label="Tree canopy">
          <img src="@/assets/fat.jpg" alt="Street after tree canopy" />
        </div>
      </div>
      <figcaption class="tag">Slide to compare</figcaption>
    </figure>

    <!-- RIGHT: copy card with shadow -->
    <div class="why-card">
      
      <h2 class="why-title"><span>Why It Matters To You</span></h2>

      <article class="why-point">
        <h3>Less Trees, Higher Cardiac Risk <span class="chip">~30% ↑ risk</span></h3>
        <p>
          Research shows people in low-greenery areas have a <strong>~30% higher</strong>
          risk of heart disease due to heat and stress exposure.
        </p>
      </article>

      <article class="why-point">
        <h3>Green Space Boosts Mental Health</h3>
        <p>
          Access to nearby parks reduces anxiety and improves recovery—regular
          exposure to trees correlates with better wellbeing.
        </p>
      </article>

      <ul class="data-chips">
        <li>Shade drop up to −5 °C</li>
        <li>3–30–300 model</li>
        <li>Cool streets, safer walks</li>
      </ul>
    </div>
  </div>
</section>


    <!-- footer -->
    <Footer />

  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'

// GSAP (pick default imports + register once)
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import Observer from 'gsap/Observer'
gsap.registerPlugin(ScrollTrigger, Observer)

// import beer slider
import BeerSlider from 'beerslider'
import 'beerslider/dist/BeerSlider.css'

// Assets (adjust paths if needed)
import instagram1 from '@/assets/instagram1.png'
import instagram2 from '@/assets/instagram2.png'
import instagram3 from '@/assets/instagram3.png'

//tiny fade/blur effect on scroll 
let onScroll
onMounted(() => {
  onScroll = () => {
    const y = Math.min(window.scrollY, window.innerHeight)
    const p = y / window.innerHeight // 0 -> 1 while covering
    document.documentElement.style.setProperty('--hero-progress', p.toString())
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})


onMounted(() => {
  const section = document.querySelector('#problem-statement')
  const track = section && section.querySelector('.htrack')
  const panels = section ? Array.from(section.querySelectorAll('.panel')) : []
  if (!section || !track || panels.length === 0) return

  // Ensure full-viewport panels
  const layout = () => panels.forEach(p => { p.style.width = window.innerWidth + 'px' })
  layout()
  window.addEventListener('resize', layout)

  // Horizontal fake-scroll tween (must be ease: 'none')
  const scrollTween = gsap.to(track, {
    xPercent: -100 * (panels.length - 1),
    ease: 'none',
    scrollTrigger: {
      id: 'ps-hscroll',
      trigger: section,
      pin: true,
      scrub: 0.2,
      anticipatePin: 1,
      end: () => '+=' + window.innerWidth * (panels.length - 1),
      invalidateOnRefresh: true,
    }
  })

  // Animate intro text when its panel enters horizontally
  gsap.from('#problem-statement .panel-text', {
    y: 40, autoAlpha: 0, duration: 0.6, ease: 'power2.out',
    scrollTrigger: {
      trigger: '#problem-statement .panel-text',
      containerAnimation: scrollTween,
      start: 'left center',
      toggleActions: 'play none none reset'
    }
  })

  // Animate each image on enter
  document.querySelectorAll('#problem-statement .insta').forEach(el => {
    gsap.from(el, {
      y: 60, scale: 0.9, autoAlpha: 0, duration: 0.5, ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        containerAnimation: scrollTween,
        start: 'left 75%',
        end: 'left 40%',
        scrub: true
      }
    })
  })

  
  let index = 0
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
  const goTo = (i) => {
    index = clamp(i, 0, panels.length - 1)
    const progress = panels.length > 1 ? index / (panels.length - 1) : 0
    gsap.to(scrollTween, { progress, duration: 0.5, ease: 'power2.out' })
  }

  Observer.create({
    target: section,
  // only handle swipe gestures; let the mouse wheel scroll vertically
  type: 'touch,pointer',
  tolerance: 12,
  preventDefault: false,   // <— important: don't block native scroll
  onLeft: () => goTo(index + 1),
  onRight: () => goTo(index - 1),
  
})

  ScrollTrigger.create({
    trigger: section,
    onUpdate: (self) => { index = Math.round(self.progress * (panels.length - 1)) }
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', layout)
    ScrollTrigger.getById('ps-hscroll')?.kill()
    scrollTween.kill()
    ScrollTrigger.getAll().forEach(st => st.kill())
  })
})

// why matter
gsap.registerPlugin(ScrollTrigger)

onMounted(() => {
  const section = document.querySelector('#why-matter')
  if (!section) return

  // Init BeerSlider(s)
  const beerEls = section.querySelectorAll('.beer-slider')
  beerEls.forEach(el => new BeerSlider(el))

  // GSAP bits
  const img    = section.querySelector('.why-media')
  const title  = section.querySelector('.why-title')
  const kicker = section.querySelector('.kicker')
  const points = section.querySelectorAll('.why-point')

  const tl = gsap.timeline({
    scrollTrigger: { trigger: section, start: 'top 72%', toggleActions: 'play none none reverse' }
  })

  tl.from(img,    { y: 40, opacity: 0, duration: 0.6, ease: 'power2.out' })
    .from(kicker, { y: 16, opacity: 0, duration: 0.35 }, '-=0.2')
    .from(title,  { y: 18, opacity: 0, duration: 0.4  }, '-=0.2')
    .from(points, { y: 14, opacity: 0, duration: 0.35, stagger: 0.1, ease: 'power2.out' }, '-=0.1')

  // gentle parallax on the media card
  const parallax = gsap.to(img, {
    y: -20, ease: 'none',
    scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true }
  })

  onBeforeUnmount(() => {
    tl.kill()
    parallax.kill()
    ScrollTrigger.getAll().forEach(t => t.kill())
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

  /* stack naturally instead of spreading */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  /* keep them near vertical center */
  min-height: 100vh;
  gap: 1rem; /* control spacing between elements */
  
  /* fade/slide on scroll (optional) */
  opacity: calc(1 - 0.75 * var(--hero-progress));
  transform: translateY(calc(-10px * var(--hero-progress)));
  transition: opacity 0.2s linear, transform 0.2s linear;
}

.cta {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #45ef1a;
  color: #030901;
  border-radius: 8px;
  font-weight: 700;
  text-decoration: none;
}

.scroll-down {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  z-index: 2;
  opacity: calc(1 - var(--hero-progress));
  transition: opacity 0.2s linear;
}

/* Creates the initial scroll area so the next section can slide over the fixed hero */
.hero-spacer {
  height: 100vh;
}

/* ===== COVER SECTIONS (scrolling content) ===== */
.cover {
  position: relative;
  z-index: 1; /* above the fixed hero */
  background: #ffffff;
  min-height: 100vh;
  padding: 6rem 1.5rem;
}

.cover.alt {
  background: #f7f9f8;
}

/* Optional niceties */
h1 { font-size: clamp(2rem, 4.5vw, 3.5rem); line-height: 1.1; }
h2 { font-size: clamp(1.5rem, 3vw, 2.25rem); margin-bottom: 1rem; }
p  { max-width: 60ch; margin: 0 auto 1rem; }

/* horizontal problem statement */
.horizontal {
  position: relative;
  height: 100svh;
  background: #4b4b4b;
  overflow: hidden;
}
.hwrap { height: 100%; }
.htrack {
  display: flex;
  height: 100%;
}
.panel {
  flex: 0 0 100vw;
  height: 100%;
  display: grid;
  place-items: center;
  padding: 2rem;
}
.panel:nth-child(1) { background: #f8fef6; }
.panel:nth-child(2) { background: #F6FCFE; }
.panel:nth-child(3) { background: #FCF6FE; }
.panel:nth-child(4) { background: #FEF8F6; }

.panel-text { text-align: center; max-width: 60ch; }
.panel-text h2 { margin: 0 0 0.5rem 0; font-size: clamp(1.75rem, 2.2vw + 1rem, 2.5rem); }
.panel-text p { margin: 0; color: var(--muted); }


.insta {
  width: 50vw;     
  max-width: 500px;
  height: auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.35);
}

/* why matter */
/* why matter */
.why {
  --card-radius: 16px;
  --ring: 0 1px 2px rgba(0,0,0,.06), 0 12px 30px rgba(0,0,0,.08);
  background: linear-gradient(180deg, color-mix(in oklab, var(--bg) 92%, #d9ffe9 8%), var(--bg));
  color: var(--fg);
  padding: clamp(3.5rem, 6vw, 6rem) 1.5rem;
}

/* Center the whole section and limit width */
.two-col {
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(1.5rem, 3vw, 2.5rem);
  align-items: start;
  width: min(1100px, 92%);
  margin-inline: auto;           /* centers */
}
@media (min-width: 900px) {
  .two-col { grid-template-columns: 1.1fr 1fr; }
}

/* Media card (left) */
.why-media {
  position: relative;
  border-radius: var(--card-radius);
  isolation: isolate;
  box-shadow: var(--ring);
  overflow: clip;
  background: var(--bg);
}
.why-media::before {
  content: "";
  position: absolute; inset: -20% 40% 40% -20%;
  background: radial-gradient(60% 60% at 30% 30%, color-mix(in oklab, var(--secondary) 40%, #fff 60%) 0%, transparent 70%);
  filter: blur(30px); opacity: .35; z-index: 0;
}
.why-media .tag {
  position: absolute; left: .75rem; bottom: .75rem; z-index: 2;
  background: color-mix(in oklab, #000 55%, transparent 45%);
  color: #fff; padding: .35rem .6rem; font-size: .72rem;
  border-radius: 999px; backdrop-filter: blur(6px);
}

/* BeerSlider reset inside the card */
.beer-slider, .beer-reveal { display:block; }
.beer-slider img {
  display:block; width:100%; height:auto; border-radius: var(--card-radius);
}
.beer-slider { --beer-handle-size: 38px; } /* optional: tweak handle size */

/* Copy card (right) — adds the “pop” */
.why-card{
  background: #fff;
  color: #101010;
  border-radius: var(--card-radius);
  box-shadow: var(--ring);
  padding: clamp(1rem, 2.8vw, 1.5rem);
  position: relative;
}

/* Kicker */
.kicker{
  display:inline-flex; align-items:center; gap:.4rem;
  font: 500 .8rem/1 var(--font);
  color: color-mix(in oklab, var(--secondary) 50%, #1a1a1a 50%);
  background: color-mix(in oklab, var(--secondary) 18%, #fff 82%);
  padding: .35rem .6rem; border-radius: 999px; margin-bottom: .6rem;
}
.kicker::before{ content:""; width:.4rem; height:.4rem; border-radius:999px; background: var(--secondary); }

/* Title */
.why-title {
  margin: 0 0 1rem 0;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  line-height: 1.15; letter-spacing: -0.01em;
}
.why-title span {
  box-shadow: inset 0 -8px 0 color-mix(in oklab, var(--secondary) 22%, white 78%);
}

/* Points */
.why-point + .why-point { margin-top: 1.15rem; }
.why-point h3 {
  margin: 0 0 .35rem 0;
  font-size: clamp(1.06rem, 1.3vw, 1.25rem);
  display:flex; flex-wrap:wrap; align-items:center; gap:.4rem;
}
.why-point p  { margin: 0; color: #545b5b; line-height: 1.65; }

/* Chips */
.data-chips { margin-top: 1rem; padding:0; list-style:none; display:flex; flex-wrap:wrap; gap:.5rem; }
.data-chips li{
  font-size:.78rem; color: color-mix(in oklab, var(--secondary) 60%, #0b3d2e 40%);
  background: color-mix(in oklab, var(--secondary) 15%, #fff 85%);
  border: 1px solid color-mix(in oklab, var(--secondary) 30%, #000 70% / 6%);
  padding:.35rem .6rem; border-radius:999px;
}
.chip{
  font-size:.72rem; font-weight:600;
  color:#0e3b2e; background: #dff7ec; border:1px solid #bfead9;
  padding:.22rem .5rem; border-radius:999px;
}

/* Hover lift on media (subtle) */
@media (hover:hover){
  .why-media:hover img{ transform: translateY(-2px) scale(1.01); transition: transform .6s cubic-bezier(.22,1,.36,1); }
}

/* Motion-reduction */
@media (prefers-reduced-motion: reduce){
  .why-media:hover img{ transform:none !important; }
}

#why-matter.why {
  min-height: 100dvh;              
  display: flex;
  align-items: center;              /* vertical centering */
  justify-content: center;          /* horizontal centering (the grid already limits width) */
  padding-block: clamp(2.5rem, 6vh, 5rem);  /* keep some breathing space */
  margin-block: 0;                 
}

#why-matter .two-col {
  align-items: center;
  margin-inline: auto;            
}

</style>
