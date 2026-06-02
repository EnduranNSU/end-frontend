<template>
  <q-page class="ai-page">
    <!-- Avatar & name -->
    <div class="profile-header">
      <div class="profile-avatar">{{ avatarEmoji }}</div>
      <div class="profile-info">
        <div class="profile-name">{{ profile.name }}</div>
        <div class="profile-meta">{{ profile.workouts }} тренировок</div>
      </div>
      <button class="ai-pill-btn icon-btn" @click="tellAbout">Расскажи о себе</button>
    </div>

    <!-- Measurements -->
    <div class="ai-section-title">Замеры</div>
    <div class="ai-card">
      <div v-if="measurementsLoading" class="hint-text">Загрузка…</div>
      <div v-else>
        <div v-for="m in latestMeasurements" :key="m.id ?? m.type" class="meas-row">
          <div class="meas-type">{{ m.type }}</div>
          <div class="meas-val">
            <select v-if="String(m.type).toLowerCase() === 'пол'" v-model.number="m.value" class="ai-select-sm">
              <option :value="0">Муж</option>
              <option :value="1">Жен</option>
            </select>
            <input v-else v-model.number="m.value" type="number" class="ai-input-sm" />
          </div>
        </div>
        <div class="save-row">
          <button class="ai-pill-btn" :disabled="measurementsSaving" @click="saveMeasurements">
            {{ measurementsSaving ? 'Сохраняем…' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Chart -->
    <div class="ai-section-title">Прогресс</div>
    <div class="ai-card">
      <div class="meas-chips">
        <button
          v-for="t in measurementTypes" :key="t"
          class="ai-pill-btn outline chip-btn"
          :class="{ active: selectedMeasurement === t }"
          @click="selectedMeasurement = t"
        >{{ t }}</button>
      </div>

      <div class="time-tabs">
        <button
          v-for="r in timeRanges" :key="r.val"
          class="time-tab"
          :class="{ active: timeRange === r.val }"
          @click="timeRange = r.val"
        >{{ r.label }}</button>
      </div>

      <div v-if="!selectedMeasurement" class="hint-text">Выберите параметр</div>
      <div v-else-if="!chartPoints.length" class="hint-text">Нет данных</div>
      <div v-else class="chart-wrap">
        <svg :viewBox="`0 0 ${chartW} ${chartH}`" width="100%" :height="chartH" preserveAspectRatio="none">
          <path :d="linePath" fill="none" stroke="#19c8b9" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle v-for="(p, i) in chartPoints" :key="i" :cx="p.x" :cy="p.y" r="4" fill="#19c8b9"/>
        </svg>
        <div class="chart-labels">
          <span>{{ tickLabels[0] }}</span>
          <span>{{ tickLabels[1] }}</span>
          <span>{{ tickLabels[2] }}</span>
        </div>
      </div>
    </div>

    <BottomNavBar v-model="activeTab" @navigate="onNavigate" />
  </q-page>
</template>

<script setup lang="ts">
import BottomNavBar from 'src/components/BottomNavBar.vue'
import { onMounted, onBeforeMount, ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const activeTab = ref('profile')

function syncTab() {
  const p = route.path
  if (p.endsWith('/history')) activeTab.value = 'history'
  else if (p.endsWith('/exercises')) activeTab.value = 'exercises'
  else if (p.endsWith('/profile')) activeTab.value = 'profile'
  else if (p.endsWith('/coach')) activeTab.value = 'chat'
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

const EMOJIS = ['🌿', '🍃', '🌱', '🌻', '🍀', '🌾']
const avatarEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]!

const profile = ref({ name: 'Пользователь', workouts: 0, email: '' })

async function fetchUser() {
  try {
    const token = localStorage.getItem('access_token')
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    const resp = await api.get('/user/')
    const d = resp.data || {}
    if (d.name) profile.value.name = d.name
    if (d.email) profile.value.email = d.email
  } catch (err: any) {
    if (err?.response?.status === 401) { void router.push('/signin') }
  }
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function tellAbout() {
  void router.push({ path: '/coach', query: { mode: 'tell_about', chat_id: uuidv4() } })
}

// Measurements
type Measurement = { id?: number; type: string; value: number | string | null; date?: string }

const measurements = ref<Measurement[]>([])
const measurementsLoading = ref(false)
const measurementsSaving = ref(false)

const DEFAULT_MEASUREMENTS = ['Рост', 'Вес', 'Возраст', 'Пол', 'Бицепс', 'Грудь', 'Бедро']

async function loadMeasurements() {
  measurementsLoading.value = true
  try {
    const resp = await api.get('/measurements/')
    measurements.value = Array.isArray(resp.data) ? resp.data : []
    await ensureDefaultsExist()
  } catch (err: any) {
    if (err?.response?.status === 401) { void router.push('/signin'); return }
    $q.notify({ type: 'negative', message: 'Не удалось загрузить замеры' })
  } finally {
    measurementsLoading.value = false
  }
}

async function ensureDefaultsExist() {
  const missing = DEFAULT_MEASUREMENTS.filter((t) =>
    !measurements.value.some((m) => String(m.type).toLowerCase() === t.toLowerCase())
  )
  for (const t of missing) {
    try {
      const resp = await api.post('/measurements/create', { type: t, value: 0, date: new Date().toISOString() })
      if (resp.data) measurements.value.push(resp.data)
    } catch { /* */ }
  }
}

async function saveMeasurements() {
  measurementsSaving.value = true
  try {
    const payload = measurements.value.map((m) => ({
      id: (m as any).id,
      type: m.type,
      value: m.value ?? 0,
      date: m.date || new Date().toISOString(),
    }))
    await api.post('/measurements/update', payload)
    $q.notify({ type: 'positive', message: 'Замеры сохранены 🌿' })
    await loadMeasurements()
  } catch (err: any) {
    if (err?.response?.status !== 500)
      $q.notify({ type: 'negative', message: 'Не удалось сохранить замеры' })
  } finally {
    measurementsSaving.value = false
  }
}

const latestMeasurements = computed(() => {
  const byType = new Map<string, Measurement>()
  for (const m of measurements.value) {
    const key = String(m.type).toLowerCase()
    const prev = byType.get(key)
    const mDate = m.date ? new Date(m.date).getTime() : 0
    const pDate = prev?.date ? new Date(prev.date).getTime() : 0
    if (!prev || mDate >= pDate) byType.set(key, m)
  }
  return [...byType.values()]
})

// Chart
const selectedMeasurement = ref<string | null>(null)
const timeRange = ref<string>('all')
const timeRanges = [
  { val: 'week', label: 'Неделя' },
  { val: 'month', label: 'Месяц' },
  { val: 'year', label: 'Год' },
  { val: 'all', label: 'Всё' },
]

const measurementTypes = computed(() => {
  const exclude = ['возраст', 'пол']
  return [...new Set(measurements.value.map((m) => String(m.type)))]
    .filter((t) => !exclude.includes(t.toLowerCase()))
})

watch(measurementTypes, (types) => {
  if (!selectedMeasurement.value && types.length) selectedMeasurement.value = types[0]!
})

const chartW = 600
const chartH = 200
const chartPad = 20

function withinRange(d: Date) {
  const diff = Date.now() - d.getTime()
  if (timeRange.value === 'week') return diff <= 864e5 * 7
  if (timeRange.value === 'month') return diff <= 864e5 * 30
  if (timeRange.value === 'year') return diff <= 864e5 * 365
  return true
}

const chartPoints = computed(() => {
  if (!selectedMeasurement.value) return []
  const rows = measurements.value
    .filter((m) => String(m.type) === selectedMeasurement.value)
    .map((r) => ({ date: r.date ? new Date(r.date) : null, value: Number(r.value ?? 0) }))
    .filter((p) => p.date && !isNaN(p.date.getTime()) && !isNaN(p.value))
    .filter((p) => withinRange(p.date!))
    .sort((a, b) => a.date!.getTime() - b.date!.getTime())
  if (!rows.length) return []
  const minD = rows[0]!.date!.getTime()
  const maxD = rows[rows.length - 1]!.date!.getTime()
  const vals = rows.map((r) => r.value)
  const minV = Math.min(...vals)
  const maxV = Math.max(...vals)
  const dR = Math.max(1, maxD - minD)
  const vR = Math.max(1e-6, maxV - minV)
  return rows.map((r) => ({
    x: chartPad + ((r.date!.getTime() - minD) / dR) * (chartW - chartPad * 2),
    y: chartPad + (1 - (r.value - minV) / vR) * (chartH - chartPad * 2),
    date: r.date,
  }))
})

const linePath = computed(() =>
  chartPoints.value.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
)

const tickLabels = computed(() => {
  const pts = chartPoints.value
  if (!pts.length) return ['', '', '']
  const fmt = (d: Date | null | undefined) => d ? `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}` : ''
  const mid = pts[Math.floor(pts.length / 2)]
  return [fmt(pts[0]!.date), fmt(mid?.date), fmt(pts[pts.length - 1]!.date)]
})

onBeforeMount(() => { void loadMeasurements() })
onMounted(() => {
  void fetchUser()
})
</script>

<style scoped>
.profile-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.profile-avatar {
  font-size: 52px;
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: rgba(255,255,255,0.75);
  box-shadow: 0 4px 0 0 var(--ai-shadow);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-info { flex: 1; }
.profile-name { font-size: 20px; font-weight: 800; color: var(--ai-text); }
.profile-meta { font-size: 13px; color: var(--ai-shadow); }

.icon-btn { padding: 8px 14px; font-size: 13px; }

.hint-text { color: var(--ai-shadow); font-size: 13px; text-align: center; padding: 12px; }

.meas-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(189,174,160,0.2);
}

.meas-row:last-of-type { border-bottom: none; }

.meas-type {
  font-size: 14px;
  font-weight: 700;
  color: var(--ai-text);
}

.ai-input-sm {
  width: 90px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 2px solid #e8dcc8;
  background: rgba(255,255,255,0.8);
  color: var(--ai-text);
  font-size: 14px;
  font-family: 'Nunito', sans-serif;
  outline: none;
  text-align: center;
}

.ai-input-sm:focus { border-color: var(--ai-teal); }

.ai-select-sm {
  padding: 6px 10px;
  border-radius: 10px;
  border: 2px solid #e8dcc8;
  background: rgba(255,255,255,0.8);
  color: var(--ai-text);
  font-size: 14px;
  font-family: 'Nunito', sans-serif;
  outline: none;
}

.save-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.meas-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.chip-btn { padding: 6px 12px; font-size: 12px; }

.time-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}

.time-tab {
  flex: 1;
  padding: 6px;
  border-radius: 10px;
  border: 2px solid #e8dcc8;
  background: transparent;
  color: var(--ai-text);
  font-size: 12px;
  font-weight: 700;
  font-family: 'Nunito', sans-serif;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.time-tab.active {
  background: var(--ai-teal);
  border-color: var(--ai-teal);
  color: #fff;
}

.chart-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--ai-shadow);
  padding: 0 2px;
}
</style>
