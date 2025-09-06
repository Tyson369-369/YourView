import { createRouter, createWebHistory } from 'vue-router'

// Import or lazy-load your Landing page
const Landing = () => import('../pages/Landing.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'landing', component: Landing }
  ]
})

export default router
