<template>
  <div class="page-wrapper">
    <!-- Header -->
    <Header />

    <!-- Page content -->
    <main>
      <h1>Gallery</h1>
      <!-- Add your gallery content here -->
    </main>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup>
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
</script>

<style scoped>
.page-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
  padding: 24px;
}
</style>