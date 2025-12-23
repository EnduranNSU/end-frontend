<template>
  <q-page class="q-pa-md page-with-nav">
    <section class="row no-wrap items-center q-gutter-sm q-mb-md">
      <q-avatar size="64px" color="grey-3" text-color="grey-6">
        <q-icon name="person" />
      </q-avatar>
      <div class="column">
        <div class="text-subtitle1 text-weight-medium">{{ profile.name }}</div>
        <div class="text-grey-7">{{ profile.workouts }} тренировок</div>
      </div>
      <q-space />
    </section>

    <section class="q-mt-md">
      <h5 class="section-title">Информация об аккаунте</h5>
      <q-card flat bordered class="q-pa-md rounded-card">
        <q-input v-model="profile.email" type="email" label="Email" dense standout readonly />
      </q-card>
    </section>

    <section class="q-mt-lg">
      <h5 class="section-title">Информация о пользователе</h5>
      <q-card flat bordered class="q-pa-md rounded-card">
        <div v-if="measurementsLoading" class="text-center">Загрузка замеров...</div>
        <div v-else>
          <div v-for="m in latestMeasurements" :key="m.id ?? m.type" class="row items-center q-gutter-sm q-mb-sm">
            <div class="col-4">{{ m.type }}</div>
            <div class="col">
              <q-select v-if="String(m.type).toLowerCase() === 'пол'" dense v-model.number="m.value"
                :options="genderOptions" emit-value map-options />
              <q-input v-else dense v-model.number="m.value" type="number" />
            </div>
          </div>
          <div class="row q-justify-end q-mt-md">
            <q-btn color="primary" label="Сохранить замеры" :loading="measurementsSaving" @click="saveMeasurements" />
          </div>
        </div>
      </q-card>
    </section>

    <section class="q-mt-lg">
      <h5 class="section-title">Мониторинг</h5>
      <q-card flat bordered class="q-pa-md rounded-card">
        <div class="row items-center q-gutter-sm q-mb-md">
          <div class="col">
            <div class="measurement-chips row no-wrap q-gutter-sm">
              <q-chip v-for="opt in measurementTypes" :key="opt" clickable outline :dense="true"
                :color="opt === selectedMeasurement ? 'primary' : undefined" @click="() => selectedMeasurement = opt">
                {{ opt }}
              </q-chip>
            </div>
            <div class="q-mt-sm q-gutter-sm">
              <q-segment v-model="timeRange" dense :options="timeRangeOptions" />
            </div>
          </div>
        </div>

        <div v-if="measurementsLoading" class="text-center">Загрузка...</div>

        <div v-else-if="!selectedMeasurement">
          <div class="text-grey-6">Выберите параметр для отображения графика.</div>
        </div>

        <div v-else>
          <div v-if="chartPoints.length === 0" class="text-grey-6">Нет данных для выбранного параметра.</div>
          <div v-else class="chart-container">
            <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" width="100%" :height="chartHeight"
              preserveAspectRatio="none" class="chart-svg">
              <path :d="linePath" fill="none" stroke="#1976d2" stroke-width="2" stroke-linejoin="round"
                stroke-linecap="round" />
              <g v-for="(p, i) in chartPoints" :key="i">
                <circle :cx="p.x" :cy="p.y" r="3" fill="#1976d2" />
                <title>{{ p.label }}</title>
              </g>
            </svg>
            <div class="chart-controls q-mt-sm">
              <div class="chart-axis q-mt-xs">
                <div class="row items-center">
                  <div class="col text-left text-caption">{{ tickLabels[0] }}</div>
                  <div class="col text-center text-caption">{{ tickLabels[1] }}</div>
                  <div class="col text-right text-caption">{{ tickLabels[2] }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card>
    </section>



    <q-dialog v-model="editOpened">
      <q-card style="min-width: 340px; max-width: 92vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1">Редактировать профиль</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-form @submit.prevent="saveEdit">
            <div class="q-gutter-md">
              <q-input v-model="draft.name" label="Имя" dense />
              <q-input v-model="draft.email" type="email" label="Email" dense />
              <q-input v-model.number="draft.weight" type="number" label="Вес" dense :suffix="'кг'" />
              <q-input v-model.number="draft.fatPercent" type="number" label="% жировой массы" dense :suffix="'%'" />
              <q-input v-model.number="draft.calories" type="number" label="Потребление калорий" dense
                :suffix="'ккал'" />
              <q-input v-model="draft.bodyparts" type="text" label="Части тела" dense autogrow />
            </div>
            <div class="row q-gutter-sm q-mt-md">
              <q-btn type="submit" color="primary" label="Сохранить" :loading="saving" />
              <q-btn flat color="grey-7" label="Отмена" v-close-popup />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
  <BottomNavBar v-model="activeTab" @navigate="onNavigate" />
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

function sync() {
  const p = route.path
  if (p.endsWith('/history')) activeTab.value = 'history'
  else if (p.endsWith('/exercises')) activeTab.value = 'exercises'
  else if (p.endsWith('/profile')) activeTab.value = 'profile'
  else if (p.endsWith('/coach')) activeTab.value = 'chat'
  else activeTab.value = 'add'
}

sync()
watch(() => route.path, sync)

function onNavigate(key: string) {
  const map: Record<string, string> = {
    chat: '/coach',
    history: '/history',
    add: '/mainPage',
    exercises: '/exercises',
    profile: '/profile',
  }
  const to = map[key] || '/mainPage'
  if (route.path !== to) void router.push(to)
}

type Profile = {
  name: string
  workouts: number
  email: string
  weight?: number | null
  fatPercent?: number | null
  calories?: number | null
  bodyparts?: string | null
}

const LS_KEY = 'enduran.profile'

const profile = ref<Profile>({
  name: 'Пайпик',
  workouts: 0,
  email: 'pipik@gmail.com',
  weight: null,
  fatPercent: null,
  calories: null,
  bodyparts: null,
})

onMounted(() => {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) Object.assign(profile.value, JSON.parse(raw))
  } catch (e) {
    console.warn('Failed to load profile from localStorage', e)
  }

  // Try to fetch authenticated user info from backend and merge into profile,
  // then load trainings to update `workouts` dynamically
  void fetchUser().then(() => void loadTrainings())
})

async function fetchUser() {
  try {
    const token = localStorage.getItem('access_token')
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    const resp = await api.get('/user/')
    const data = resp.data || {}
    if (data.name) profile.value.name = data.name
    if (data.email) profile.value.email = data.email
    if (typeof data.workouts === 'number') profile.value.workouts = data.workouts
    if (data.weight !== undefined) profile.value.weight = data.weight
    if (data.fatPercent !== undefined) profile.value.fatPercent = data.fatPercent
    if (data.calories !== undefined) profile.value.calories = data.calories
    if (data.bodyparts !== undefined) profile.value.bodyparts = data.bodyparts

    // persist fetched profile locally
    persist()
  } catch (err: unknown) {
    // If user is not authenticated, redirect to sign in
    try {
      const status = (err as any)?.response?.status
      if (status === 401) {
        $q.notify({ type: 'warning', message: 'Требуется авторизация' })
        void router.push('/signin')
        return
      }
    } catch {
      // ignore
    }
    console.warn('Failed to fetch user profile', err)
  }
}

function persist() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(profile.value)) } catch (e) {
    console.warn('Failed to save profile to localStorage', e)
  }
}



const editOpened = ref(false)
const saving = ref(false)
const draft = ref<Profile>({ ...profile.value })

function openEdit() {
  draft.value = { ...profile.value }
  editOpened.value = true
}

function saveEdit() {
  try {
    saving.value = true
    profile.value = { ...profile.value, ...draft.value }
    persist()
    editOpened.value = false
    $q.notify({ type: 'positive', message: 'Сохранено' })
  } finally {
    saving.value = false
  }
}

// share functionality removed per request (buttons hidden)

// ---------------- measurements handling ----------------

type Measurement = {
  id?: number
  type: string
  value: number | string | null
  date?: string
}

const measurements = ref<Measurement[]>([])
const measurementsLoading = ref(false)
const measurementsSaving = ref(false)

const DEFAULT_MEASUREMENTS = [
  'Рост',
  'Вес',
  'Возраст',
  'Пол',
  'Бицепс',
  'Грудь',
  'Бедро'
]

const genderOptions = [
  { label: 'Муж', value: 0 },
  { label: 'Жен', value: 1 }
]

async function loadMeasurements() {
  measurementsLoading.value = true
  try {
    const token = localStorage.getItem('access_token')
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    const resp = await api.get('/measurements/')
    const data = resp.data || []
    measurements.value = Array.isArray(data) ? data.map((m: any) => ({ ...m })) : []

    await ensureDefaultsExist()
  } catch (err: unknown) {
    try {
      // @ts-ignore
      const status = err && err.response && err.response.status
      if (status === 401) {
        $q.notify({ type: 'warning', message: 'Требуется авторизация' })
        void router.push('/signin')
        return
      }
    } catch (_) { }
    console.warn('Failed to load measurements', err)
    $q.notify({ type: 'negative', message: 'Не удалось загрузить замеры' })
  } finally {
    measurementsLoading.value = false
  }
}

async function ensureDefaultsExist() {
  try {
    const missing = DEFAULT_MEASUREMENTS.filter(t => !measurements.value.some(m => String(m.type).toLowerCase() === String(t).toLowerCase()))
    if (!missing.length) return

    for (const t of missing) {
      try {
        const payload = { type: t, value: 0, date: new Date().toISOString() }
        const resp = await api.post('/measurements/create', payload)
        if (resp && resp.data) measurements.value.push(resp.data)
      } catch (e) {
        console.warn('Failed to create measurement', t, e)
      }
    }
  } catch (e) {
    console.warn('ensureDefaultsExist error', e)
  }
}

async function saveMeasurements() {
  measurementsSaving.value = true
  try {
    // Get current server list (baseline) because update replaces all entries
    const resp = await api.get('/measurements/')
    const serverList: Measurement[] = Array.isArray(resp.data) ? resp.data.map((s: any) => ({ ...s })) : []

    // Build a mutable copy of server list keyed by id (if present)
    const serverById = new Map<string | number, Measurement>()
    for (const s of serverList) {
      if ((s as any).id !== undefined && (s as any).id !== null) serverById.set(String((s as any).id), { ...s })
      else {
        const status = (err as any)?.response?.status
      }
    }

    // Helper to generate negative integer IDs on the client to avoid colliding with server positive IDs
    let clientIdCounter = -Date.now()
    function generateClientId() { clientIdCounter -= 1; return clientIdCounter }

    // Start merged array as copy of serverList (we'll update records in place)
    const mergedItems: { id: number | undefined; type: string; value: number | string | null; date: string }[] = serverList.map(s => ({
      id: (s as any).id !== undefined && (s as any).id !== null ? Number((s as any).id) : undefined,
      type: s.type,
      value: s.value ?? 0,
      date: s.date || new Date().toISOString(),
    }))

    // Update existing server items by id if local edits exist; otherwise append local-only items with generated client id
    for (const l of measurements.value) {
      const lid = (l as any).id !== undefined && (l as any).id !== null ? String((l as any).id) : null
      if (lid && serverById.has(lid)) {
        // find in mergedItems by id and update
        const idx = mergedItems.findIndex(mi => mi.id !== undefined && String(mi.id) === lid)
        if (idx !== -1) {
          const mi = mergedItems[idx]!
          mi.value = (l.value ?? mi.value)
          mi.date = l.date || mi.date || new Date().toISOString()
        }
      } else {
        // local-only: create new item with generated client id (negative number)
        const key = lid || `${l.type}:${l.date || ''}:${Math.random()}`
        // ensure we don't duplicate by same key
        const exists = mergedItems.find(mi => String(mi.type) === String(l.type) && (mi.date || '') === (l.date || ''))
        if (exists) {
          exists.value = l.value ?? exists.value
          exists.date = l.date || exists.date
        } else {
          const newId = typeof (l as any).id === 'number' && Number((l as any).id) !== 0 ? Number((l as any).id) : generateClientId()
          mergedItems.push({ id: newId, type: l.type, value: l.value ?? 0, date: l.date || new Date().toISOString() })
        }
      }
    }

    await api.post('/measurements/update', mergedItems)
    $q.notify({ type: 'positive', message: 'Замеры сохранены' })
    await loadMeasurements()
  } catch (err: unknown) {
    try {
      const status = (err as any)?.response?.status
      if (status === 401) {
        $q.notify({ type: 'warning', message: 'Требуется авторизация' })
        void router.push('/signin')
        return
      }
      // If server returned 500 on update — silently ignore (do not persist locally)
      if (status === 500) {
        return
      }
    } catch (_) { }
    console.warn('Failed to save measurements', err)
    $q.notify({ type: 'negative', message: 'Не удалось сохранить замеры' })
  } finally {
    measurementsSaving.value = false
  }
}

onBeforeMount(() => {
  void loadMeasurements()
})

// ---------------- trainings handling ----------------
const trainingsLoading = ref(false)

async function loadTrainings() {
  trainingsLoading.value = true
  try {
    const token = localStorage.getItem('access_token')
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    // Only load planned trainings for now (user_performed not requested)
    const plannedResp = await api.get('/training/planned')
    const planned = Array.isArray(plannedResp.data) ? plannedResp.data : []

    profile.value.workouts = planned.length
    persist()
  } catch (err: unknown) {
    try {
      // @ts-ignore
      const status = err && err.response && err.response.status
      if (status === 401) {
        $q.notify({ type: 'warning', message: 'Требуется авторизация' })
        void router.push('/signin')
        return
      }
    } catch (_) { }
    console.warn('Failed to load trainings', err)
  } finally {
    trainingsLoading.value = false
  }
}

// ---------------- chart/dashboard helpers ----------------
const selectedMeasurement = ref<string | null>(null)

const measurementOptions = computed(() => {
  // unique measurement types from measurements, excluding Age and Gender
  const exclude = ['возраст', 'пол']
  const types = Array.from(new Set(measurements.value.map(m => String(m.type))))
  return types
    .filter(t => !exclude.includes(String(t).toLowerCase()))
    .map(t => ({ label: t, value: t }))
})

// measurementTypes: simpler array of strings used for chips UI
const measurementTypes = computed(() => measurementOptions.value.map(o => o.value))

const chartWidth = 720
const chartHeight = 260
const chartPadding = 24

// latestMeasurements: map measurements -> take last entry per type by date
const latestMeasurements = computed(() => {
  const byType = new Map<string, Measurement>()
  for (const m of measurements.value) {
    const key = String(m.type).toLowerCase()
    const date = m.date ? new Date(m.date) : null
    const existing = byType.get(key)
    if (!existing) {
      byType.set(key, m)
      continue
    }
    const exDate = existing.date ? new Date(existing.date) : null
    if (!exDate && date) byType.set(key, m)
    else if (date && exDate && date.getTime() >= exDate.getTime()) byType.set(key, m)
  }
  return Array.from(byType.values())
})

const timeRange = ref<'week' | 'month' | 'year' | 'all'>('all')
const timeRangeOptions = [
  { label: 'Неделя', value: 'week' },
  { label: 'Месяц', value: 'month' },
  { label: 'Год', value: 'year' },
  { label: 'Все', value: 'all' },
]

function withinRange(date: Date, range: string) {
  const now = new Date()
  if (range === 'all') return true
  const diff = now.getTime() - date.getTime()
  if (range === 'week') return diff <= 1000 * 60 * 60 * 24 * 7
  if (range === 'month') return diff <= 1000 * 60 * 60 * 24 * 30
  if (range === 'year') return diff <= 1000 * 60 * 60 * 24 * 365
  return true
}

const chartPoints = computed(() => {
  if (!selectedMeasurement.value) return []
  const rows = measurements.value.filter(m => String(m.type) === selectedMeasurement.value)
  const parsed = rows
    .map(r => ({
      date: r.date ? new Date(r.date) : null,
      value: typeof r.value === 'string' ? Number(r.value) : (r.value ?? 0)
    }))
    .filter(p => p.date && !isNaN(p.date.getTime()) && !isNaN(Number(p.value)))
    .sort((a, b) => (a.date!.getTime() - b.date!.getTime()))

  const filtered = parsed.filter(p => withinRange(p.date!, timeRange.value))
  if (!filtered.length) return []

  const first = filtered[0]!
  const last = filtered[filtered.length - 1]!
  const minDate = first.date!.getTime()
  const maxDate = last.date!.getTime()
  const values = filtered.map(p => Number(p.value))
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const dateRange = Math.max(1, maxDate - minDate)
  const valueRange = Math.max(1e-6, maxV - minV)

  return filtered.map((p) => {
    const t = p.date!.getTime()
    const x = chartPadding + ((t - minDate) / dateRange) * (chartWidth - chartPadding * 2)
    const y = chartPadding + (1 - ((Number(p.value) - minV) / valueRange)) * (chartHeight - chartPadding * 2)
    return { x, y, value: p.value, label: `${p.date!.toLocaleDateString()}: ${p.value}`, date: p.date }
  })
})

const linePath = computed(() => {
  const pts = chartPoints.value
  if (!pts.length) return ''
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
})

function formatDateLabel(d?: Date | null) {
  if (!d) return ''
  // short date: DD.MM
  return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

const tickLabels = computed(() => {
  const pts = chartPoints.value
  if (!pts.length) return ['', '', '']
  const first = pts[0].date!
  const last = pts[pts.length - 1].date!
  const mid = new Date((first.getTime() + last.getTime()) / 2)
  return [formatDateLabel(first), formatDateLabel(mid), formatDateLabel(last)]
})

// auto-select first available measurement when list loads
watch(measurementOptions, (opts) => {
  if ((!selectedMeasurement.value || selectedMeasurement.value === '') && opts && opts.length) {
    const first = opts[0] as { value: string }
    selectedMeasurement.value = first.value
  }
})
</script>

<style scoped>
.page-with-nav {
  padding-bottom: 88px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #2b2b2b;
  margin: 6px 0 8px;
}

.rounded-card {
  border-radius: 12px;
}

.chips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
}

.chip {
  border-radius: 12px;
}

.clickable {
  cursor: pointer;
}

.chart-container {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.chart-svg {
  width: 100%;
  height: auto;
  max-width: 100%;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 6px;
}

.chart-legend {
  font-size: 13px;
  color: #666;
  margin-top: 8px;
}
</style>
