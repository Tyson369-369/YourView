import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  // ** iteration 1 routing DO NOT TOUCH
  { path: '/iteration_1/', name: 'home', component: () => import('@/pages/iteration_1/HomePage.vue') },
  // { path: '/iteration_1/greenpage', name: 'green', component: GreenIndex },
  { path: '/iteration_1/YourArea', name: 'YourArea', component: () => import('@/pages/iteration_1/YourAreaPage.vue') },
  // { path: '/iteration_1/about', name: 'about', component: AboutPage },
  // { path: '/iteration_1/source', name: 'source', component: SourcePage },
  { path: '/iteration_1/YourVoice', name: 'YourVoice', component: () => import('@/pages/iteration_1/YourVoicePage.vue') },
  { path: '/iteration_1/YourWindow', name: 'YourWindow', component: () => import('@/pages/iteration_1/YourWindowPage.vue')},

  // ** iteration 2 routing DO NOT TOUCH
  { path: '/iteration_2/', name: 'intro2', component: () => import('@/pages/iteration_2/intro.vue') },
  { path: '/iteration_2/intro/step1', name: 'intro2-step1', component: () => import('@/pages/iteration_2/intro_step1.vue') },
  { path: '/iteration_2/intro/step2', name: 'intro2-step2', component: () => import('@/pages/iteration_2/intro_step2.vue') },
  { path: '/iteration_2/intro/step3', name: 'intro2-step3', component: () => import('@/pages/iteration_2/intro_step3.vue') },
  { path: '/iteration_2/landing', name: 'landing2', component: () => import('@/pages/iteration_2/Landing.vue') },
  { path: '/iteration_2/upload_window', name: 'upload_window2', component: () => import('@/pages/iteration_2/upload_my_window.vue') },
  { path: '/iteration_2/heatmap', name: 'heatmap2', component: () => import('@/pages/iteration_2/heatmap.vue') },
  { path: '/iteration_2/plant_health', name: 'plant_health2', component: () => import('@/pages/iteration_2/plant_health.vue') },
  { path: '/iteration_2/gallery', name: 'gallery2', component: () => import('@/pages/iteration_2/gallery.vue') },
  { path: '/iteration_2/upload', name: 'upload2', component: () => import('@/pages/iteration_2/upload.vue') },

  // ** iteration 3 routing DO NOT TOUCH
  { path: '/', name: 'intro', component: () => import('@/pages/iteration_3/intro.vue') },
  { path: '/intro/step1', name: 'intro-step1', component: () => import('@/pages/iteration_3/intro_step1.vue') },
  { path: '/intro/step2', name: 'intro-step2', component: () => import('@/pages/iteration_3/intro_step2.vue') },
  { path: '/intro/step3', name: 'intro-step3', component: () => import('@/pages/iteration_3/intro_step3.vue') },
  { path: '/landing', name: 'landing', component: () => import('@/pages/iteration_3/Landing.vue') },
  { path: '/upload_window', name: 'upload_window', component: () => import('@/pages/iteration_3/upload_my_window.vue') },
  { path: '/heatmap', name: 'heatmap', component: () => import('@/pages/iteration_3/heatmap.vue') },
  { path: '/plant_health', name: 'plant_health', component: () => import('@/pages/iteration_3/plant_health.vue') },
  { path: '/gallery', name: 'gallery', component: () => import('@/pages/iteration_3/gallery.vue') },
  { path: '/upload', name: 'upload', component: () => import('@/pages/iteration_3/upload.vue') },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})