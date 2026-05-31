<template>
  <q-page class="ai-page pro-page">
    <div class="pro-hero">
      <div class="pro-star">⭐</div>
      <div class="pro-title">Enduran Pro</div>
      <div class="pro-sub">Разблокируй все возможности</div>
    </div>

    <div class="features-grid">
      <div class="ai-card feature-card" v-for="f in features" :key="f.icon">
        <div class="feature-icon">{{ f.icon }}</div>
        <div class="feature-title">{{ f.title }}</div>
        <div class="feature-desc">{{ f.desc }}</div>
      </div>
    </div>

    <button class="ai-pill-btn pro-btn">🌟 Скоро!</button>

    <BottomNavBar v-model="activeTab" @navigate="onNavigate" />
  </q-page>
</template>

<script setup lang="ts">
import BottomNavBar from 'src/components/BottomNavBar.vue'
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const activeTab = ref('add')

function sync() {
  const p = route.path
  if (p.endsWith('/history')) activeTab.value = 'history'
  else if (p.endsWith('/exercises')) activeTab.value = 'exercises'
  else if (p.endsWith('/profile')) activeTab.value = 'profile'
  else activeTab.value = 'add'
}
sync()
watch(() => route.path, sync)

function onNavigate(key: string) {
  const map: Record<string, string> = {
    chat: '/coach', history: '/history', add: '/mainPage',
    exercises: '/exercises', profile: '/profile',
  }
  const to = map[key] || '/mainPage'
  if (route.path !== to) void router.push(to)
}

const features = [
  { icon: '🤖', title: 'AI-тренировки', desc: 'Персональный план от нейросети' },
  { icon: '📊', title: 'Детальная аналитика', desc: 'Графики прогресса и статистика' },
  { icon: '🎬', title: 'Неограниченный анализ', desc: 'Любые упражнения, без лимитов' },
  { icon: '🏆', title: 'Достижения', desc: 'Значки и челленджи' },
  { icon: '📅', title: 'Умное расписание', desc: 'Адаптивный план тренировок' },
  { icon: '🌿', title: 'Без рекламы', desc: 'Чистый и быстрый интерфейс' },
]
</script>

<style scoped>
.pro-page { align-items: center; }

.pro-hero {
  text-align: center;
  padding: 24px 0 16px;
}

.pro-star { font-size: 72px; margin-bottom: 8px; }

.pro-title {
  font-size: 32px;
  font-weight: 800;
  color: var(--ai-text);
  font-family: 'Nunito', sans-serif;
}

.pro-sub {
  font-size: 16px;
  color: var(--ai-shadow);
  font-weight: 600;
  margin-top: 4px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  width: 100%;
  margin: 16px 0;
}

.feature-card {
  text-align: center;
  padding: 16px 12px;
}

.feature-icon { font-size: 28px; margin-bottom: 6px; }
.feature-title { font-size: 14px; font-weight: 700; color: var(--ai-text); margin-bottom: 4px; }
.feature-desc { font-size: 12px; color: var(--ai-shadow); line-height: 1.3; }

.pro-btn {
  width: 100%;
  padding: 16px;
  font-size: 18px;
  background: linear-gradient(135deg, var(--ai-amber), #f5c842);
  box-shadow: 0 6px 0 0 #c8841a;
  margin-bottom: 8px;
}

.pro-btn:active {
  transform: translateY(4px);
  box-shadow: 0 2px 0 0 #c8841a;
}
</style>
