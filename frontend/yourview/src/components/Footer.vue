<template>
  <footer class="footer">
    <div class="footer-inner">
      <p>© 2025 YourView — All rights reserved</p>
      <nav>
        <a href="#how-it-works">How it Works</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: #fff;       /* solid background to cover hero */
  padding: 2rem 1rem;
  text-align: center;
  position: relative;
  z-index: 2;             /* above the pinned hero */
  border-top: 1px solid #ddd;
}

.footer-inner {
  max-width: 960px;
  margin: 0 auto;
}

.footer nav {
  margin-top: 1rem;
  display: flex;
  gap: 1.5rem;
  justify-content: center;
}

.footer nav a {
  color: #333;
  text-decoration: none;
  font-weight: 500;
}

.footer nav a:hover {
  text-decoration: underline;
}
</style>
