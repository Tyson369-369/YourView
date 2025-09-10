<template>
  <main class="landing">
    <header class="brand">
      <!-- <img class="logo" src="@/assets/logo.svg" alt="YourView logo" /> -->
      <h1>Welcome to YourView</h1>
      <p class="tagline">Healthy Plant, Happy Life</p>
    </header>

    <section class="cta">
      <button class="btn" @click="goNext" aria-label="Continue to app">
        <span>Continue</span>
        <span class="arrow">→</span>
      </button>

      <p class="legal">
        By clicking Continue, you agree to our
        <RouterLink to="/terms">Terms of Service</RouterLink>
        and confirm you have read our
        <RouterLink to="/privacy">Privacy Policy</RouterLink>.
      </p>
    </section>

    <figure class="illustration">
      <!-- Use your own SVG/PNG. Keep it wide; it’ll scale responsively -->
      <!-- <img src="@/assets/landing-garden.png" alt="" aria-hidden="true" /> -->
    </figure>
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

// Change '/home' to wherever you want to land after this screen
const goNext = () => router.push({ name: 'intro-step1' })
</script>

<style scoped>

.landing {
  min-height: 100dvh;
  background: #f8fef6;
  display: grid;
  grid-template-rows: 1fr auto auto; /* brand | cta | art */
  align-items: start;
  justify-items: center;
  padding: clamp(16px, 3vw, 32px);
  text-align: center;
}

.brand {
  margin-top: clamp(16px, 6vh, 80px);
}

.logo {
  width: 56px;
  height: 56px;
  object-fit: contain;
  margin-inline: auto;
  display: block;
}

h1 {
  color: #103713;
  font-size: clamp(28px, 6vw, 56px);
  line-height: 1.1;
  margin: 14px 0 8px;
  font-weight: 800;
}

.tagline {
  color: #103713;;
  opacity: 0.9;
  font-weight: 600;
  margin: 0;
}

.cta {
  margin-top: clamp(24px, 5vh, 40px);
  max-width: 680px;
  width: min(92vw, 520px);
}

.btn {
  width: 100%;
  height: 48px;
  border-radius: 10px;
  border: none;
  background: #103731;
  color: white;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow:
    0 2px 0 rgba(0, 0, 0, 0.08),
    0 8px 24px rgba(27, 77, 57, 0.25);
  transition:
    transform 0.06s ease,
    background 0.15s ease,
    box-shadow 0.15s ease;
}

.btn:hover {
  background: #1d6358;
}
.btn:active {
  transform: translateY(1px);
}

.arrow {
  font-size: 18px;
  margin-left: 6px;
}

.legal {
  margin: 10px auto 0;
  font-size: 12px;
  color: #103731;
  max-width: 520px;
  opacity: 0.9;
}

.legal a {
  color: #103731;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.illustration {
  width: 100%;
  max-width: 880px;
  margin: clamp(24px, 6vh, 56px) auto 0;
}

.illustration img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
  /* Optional rounded corners for a friendly feel: */
  border-radius: 8px;
}

/* Make sure everything stays centered on very tall screens */
@media (min-height: 900px) and (min-width: 768px) {
  .landing {
    grid-template-rows: 1.2fr auto 1fr;
  }
}

.brand { margin-top: 21vh; }  
</style>
