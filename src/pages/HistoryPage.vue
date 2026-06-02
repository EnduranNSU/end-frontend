<template>
  <q-page class="ai-page">
    <div class="ai-section-title" style="margin-top:0">История тренировок</div>

    <div v-if="loading" class="hint-text">Загрузка…</div>

    <div v-else-if="!items.length" class="empty-state">
      <div class="empty-icon">🏋️</div>
      <div class="empty-text">Пока нет тренировок</div>
      <button class="ai-pill-btn" @click="router.push('/mainPage')">Начать тренировку</button>
    </div>

    <template v-else>
      <div v-for="(group, month) in grouped" :key="String(month)" class="month-group">
        <div class="month-label">{{ month }}</div>
        <div
          v-for="item in group" :key="item.id"
          class="ai-card history-card"
          @click="openItem(item.id)"
        >
          <div class="history-info">
            <div class="history-title">{{ item.training?.title || 'Тренировка' }}</div>
            <div class="history-meta">
              {{ formatDate(item.date) }}
              <span v-if="(item.training?.perfomable_exercises || []).length">
                · {{ (item.training?.perfomable_exercises || []).length }} упр.
              </span>
            </div>
          </div>
          <div class="history-arrow">›</div>
        </div>
      </div>
    </template>

    <BottomNavBar v-model="activeTab" @navigate="onNavigate" />
  </q-page>
</template>

<script setup lang="ts">
import BottomNavBar from 'src/components/BottomNavBar.vue'
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from 'src/boot/axios'
import { useQuasar } from 'quasar'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const activeTab = ref('history')

function syncTab() {
  const p = route.path
  if (p.endsWith('/history')) activeTab.value = 'history'
  else if (p.endsWith('/exercises')) activeTab.value = 'exercises'
  else if (p.endsWith('/profile')) activeTab.value = 'profile'
  else activeTab.value = 'add'
}
syncTab()
watch(() => route.path, syncTab)

function onNavigate(key: string) {
  const map: Record<string, string> = {
    chat: '/coach', history: '/history', add: '/mainPage',
    exercises: '/exercises', profile: '/profile',
  }
  const to = map[key] || '/mainPage'
  if (route.path !== to) void router.push(to)
}

const items = ref<any[]>([])
const loading = ref(false)

async function fetchItems() {
  loading.value = true
  try {
    const token = localStorage.getItem('access_token')
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    const resp = await api.get('/training/user_performed')
    items.value = (resp.data || []).slice().sort((a: any, b: any) =>
      new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    )
  } catch (err: any) {
    if (err?.response?.status === 401) { void router.push('/signin'); return }
    $q.notify({ type: 'negative', message: 'Не удалось загрузить историю' })
  } finally {
    loading.value = false
  }
}

const grouped = computed(() => {
  const result: Record<string, any[]> = {}
  for (const item of items.value) {
    const d = item.date ? new Date(item.date) : null
    const key = d && !isNaN(d.getTime())
      ? d.toLocaleString('ru-RU', { year: 'numeric', month: 'long' })
      : 'Без даты'
    if (!result[key]) result[key] = []
    result[key]!.push(item)
  }
  return result
})

function formatDate(s?: string) {
  if (!s) return '—'
  try { return new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) }
  catch { return s }
}

function openItem(id: number) {
  void router.push({ path: '/performedTraining', query: { id: String(id) } })
}

onMounted(() => { void fetchItems() })
</script>

<style scoped>
.hint-text { color: var(--ai-shadow); text-align: center; padding: 24px; font-size: 14px; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 16px;
}

.empty-icon { font-size: 56px; }
.empty-text { font-size: 16px; font-weight: 700; color: var(--ai-text); }

.month-group { margin-bottom: 16px; }

.month-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--ai-shadow);
  text-transform: capitalize;
  margin-bottom: 8px;
  padding-left: 4px;
}

.history-card {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 12px 14px;
  margin-bottom: 8px;
  transition: transform 0.1s;
}

.history-card:active { transform: scale(0.98); }

.history-icon { font-size: 28px; flex-shrink: 0; }

.history-info { flex: 1; }

.history-title { font-size: 15px; font-weight: 700; color: var(--ai-text); }

.history-meta { font-size: 12px; color: var(--ai-shadow); margin-top: 2px; }

.history-arrow {
  font-size: 22px;
  color: var(--ai-shadow);
  font-weight: 300;
}
</style>
