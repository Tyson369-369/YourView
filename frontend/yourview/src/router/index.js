import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'intro', component: () => import('@/pages/intro.vue') },
  { path: '/intro/step1', name: 'intro-step1', component: () => import('@/pages/intro_step1.vue') },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})