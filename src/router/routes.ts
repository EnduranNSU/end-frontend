import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      // Registration page as the home page (show SignUp first)
      { path: '', component: () => import('pages/SignUpPage.vue') },
      { path: 'exercisePage', component: () => import('pages/ExercisePage.vue') },
      { path: 'mainPage', component: () => import('pages/MainPage.vue') },
      { path: 'history', component: () => import('pages/HistoryPage.vue') },
      { path: 'exercises', component: () => import('pages/ExercisesPage.vue') },
      { path: 'plannedTraining', component: () => import('pages/PlannedTrainingPage.vue') },
      { path: 'plannedTraining/:id', component: () => import('pages/PlannedTrainingPage.vue') },
      { path: 'signin', component: () => import('pages/SignInPage.vue') },
      { path: 'signup', component: () => import('pages/SignUpPage.vue') },
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
