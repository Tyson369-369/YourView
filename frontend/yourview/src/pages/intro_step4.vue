<template>
    <h1>step 4 make your place grener</h1>

    <button ref="btnEl" class="btn" data-flip-id="continue" @click="goNext">
        <span>Visit our page</span>
        <span class="arrow">→</span>
    </button>

</template>

<script setup>

import { useRouter } from 'vue-router'

const router = useRouter()
const goNext = () => router.push('/landing')

</script>


<style>
/* Fixed, solid button */
.btn {
  width: min(520px, 86vw);
  height: 48px;
  border: none;
  border-radius: 12px;
  background: #103731;
  /* solid color (no var()) */
  color: #fff;
  /* readable text */
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow:
    0 2px 0 rgba(0, 0, 0, 0.08),
    0 10px 24px rgba(17, 60, 46, 0.22);
  transition:
    background 0.15s ease,
    transform 0.06s ease;
}

.btn:hover {
  background: #0c2a22;
  transform: scale(1.05);
}

.btn:active {
  transform: translateY(1px);
}
</style>