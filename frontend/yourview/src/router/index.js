import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'intro', component: () => import('@/pages/intro.vue') },
  { path: '/intro/step1', name: 'intro-step1', component: () => import('@/pages/intro_step1.vue') },
  { path: '/landing', name: 'intro-step1', component: () => import('@/pages/Landing.vue') },
  { path: '/upload_window', name: 'intro-step1', component: () => import('@/pages/upload_my_window.vue') },
  { path: '/heatmap', name: 'intro-step1', component: () => import('@/pages/heatmap.vue') },
  { path: '/plant_health', name: 'intro-step1', component: () => import('@/pages/plant_health.vue') },
  { path: '/gallery', name: 'intro-step1', component: () => import('@/pages/gallery.vue') },

]

export default createRouter({
  history: createWebHistory(),
  routes,
})