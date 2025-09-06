<template>
  <header class="site-header" :class="{ 'is-open': mobileOpen }">
    <div class="wrap">
      <!-- Logo -->
      <router-link to="/" class="brand" aria-label="Go to Home">
        <img :src="logo" alt="YourView logo" class="logo-img" />
        YourView
      </router-link>

      <!-- Desktop nav -->
      <nav class="nav desktop" aria-label="Primary">
        <router-link to="/" class="nav-link" active-class="active" exact>Home</router-link>
        <router-link to="/Heat Map" class="nav-link" active-class="active">Melbourne Heat Map</router-link>
        <router-link to="/about" class="nav-link" active-class="active">About</router-link>
        <router-link to="/method" class="nav-link" active-class="active">Green</router-link>
      </nav>

      <!-- Mobile menu button -->
      <button
        class="menu-btn"
        :aria-expanded="mobileOpen ? 'true' : 'false'"
        aria-controls="mobile-menu"
        @click="toggle()"
      >
        <span class="sr-only">Toggle menu</span>
        <span class="bar"></span><span class="bar"></span><span class="bar"></span>
      </button>
    </div>

    <!-- Mobile drawer -->
    <nav id="mobile-menu" class="nav mobile" aria-label="Primary Mobile" v-if="mobileOpen">
      <router-link @click="close()" to="/" class="nav-link" active-class="active" exact>Home</router-link>
      <router-link @click="close()" to="/try" class="nav-link" active-class="active">Try</router-link>
      <router-link @click="close()" to="/about" class="nav-link" active-class="active">About</router-link>
      <router-link @click="close()" to="/method" class="nav-link" active-class="active">Methodology</router-link>
    </nav>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
const mobileOpen = ref(false)
const toggle = () => (mobileOpen.value = !mobileOpen.value)
const close = () => (mobileOpen.value = false)

// Close on ESC
const onKey = (e) => { if (e.key === 'Escape') mobileOpen.value = false }
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

// import logo from assets
import logo from '@/assets/logo.png'

</script>

<style scoped>
/* Header (glass on light background) */
.site-header {
  position: sticky; top: 0; z-index: 1000;
  background: rgba(248, 254, 246, 0.85);            /* your bg with transparency */
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(3, 9, 1, 0.08);      /* subtle divider using text color */
}
.site-header.glass {
  background: rgba(248, 254, 246, 0.55);
  border-bottom-color: rgba(248, 254, 246, 0.25);
}

.wrap {
  max-width: 1100px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
}

.brand {
  display: inline-flex; align-items: center; gap: 10px;
  font-weight: 700; letter-spacing: .2px; text-decoration: none;
  color: #030901;                                    /* text/brand color */
}

.logo-img { height: 44px; width: auto; display: block; }

/* Nav links */
.nav { display: flex; gap: 16px; }
.nav-link {
  padding: 8px 10px; border-radius: 8px; text-decoration: none;
  color: #030901; font-weight: 500; opacity: .92;
  transition: background .18s ease, box-shadow .18s ease;
}
.nav-link:hover { background: rgba(3, 9, 1, 0.06); } /* gentle hover */
.nav-link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(88, 158, 243, 0.35);   /* accent focus ring */
}

/* Active tab */
.active {
  background: rgba(69, 239, 26, 0.18);              /* primary tint */
  color: #030901;
  border: 1px solid rgba(69, 239, 26, 0.35);
}

/* Mobile menu button */
.menu-btn {
  display: none; position: relative; width: 42px; height: 36px;
  border: 1px solid rgba(3, 9, 1, 0.12);
  border-radius: 8px; background: #f8fef6;          /* your bg */
}
.menu-btn .bar { display: block; height: 2px; margin: 6px 8px; background: #030901; }

/* Mobile drawer */
.nav.mobile { display: none; flex-direction: column; padding: 8px 16px 16px; }
.is-open .nav.mobile { display: flex; }

/* Responsive switch */
@media (max-width: 840px) {
  .nav.desktop { display: none; }
  .menu-btn { display: inline-block; }
}

/* Screen-reader utility */
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}
</style>
