import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      // MainPage is now the home page
      { path: '', component: () => import('pages/MainPage.vue') },
      { path: 'exercisePage', component: () => import('pages/ExercisePage.vue') },
      { path: 'mainPage', component: () => import('pages/MainPage.vue') },
      { path: 'history', component: () => import('pages/HistoryPage.vue') },
      { path: 'exercises', component: () => import('pages/ExercisesPage.vue') },
      { path: 'profile', component: () => import('pages/ProfilePage.vue') },
      { path: 'coach', component: () => import('pages/VirtualCoachPage.vue') },
      { path: 'proad', component: () => import('pages/ProAd.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
