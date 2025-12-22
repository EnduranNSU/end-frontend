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
          <div v-for="m in measurements" :key="m.id ?? m.type" class="row items-center q-gutter-sm q-mb-sm">
            <div class="col-4">{{ m.type }}</div>
            <div class="col">
              <q-select
                v-if="String(m.type).toLowerCase() === 'пол'"
                dense
                v-model.number="m.value"
                :options="genderOptions"
                emit-value
                map-options
              />
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
      <div class="text-grey-6 q-pt-xs">Скоро появятся графики прогресса.</div>
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
              <q-input v-model.number="draft.calories" type="number" label="Потребление калорий" dense :suffix="'ккал'" />
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
import { onMounted, ref, watch } from 'vue'
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
      // attempt to read status safely
      // @ts-ignore
      const status = err && err.response && err.response.status
      if (status === 401) {
        $q.notify({ type: 'warning', message: 'Требуется авторизация' })
        void router.push('/signin')
        return
      }
    } catch (_) {
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
import { onBeforeMount } from 'vue'

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
    } catch (_) {}
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
    const serverList: Measurement[] = Array.isArray(resp.data) ? resp.data : []

    const serverByType = new Map<string, Measurement>()
    for (const s of serverList) serverByType.set(String(s.type).toLowerCase(), s)

    // Merge: for each server item, prefer local edit if exists
    const merged: { type: string; value: number | string | null; date: string }[] = []
    for (const s of serverList) {
      const key = String(s.type).toLowerCase()
      const local = measurements.value.find(m => String(m.type).toLowerCase() === key)
      let val = local ? (local.value ?? s.value ?? 0) : (s.value ?? 0)
      if (key === 'пол') val = Number(val) || 0
      merged.push({ type: s.type, value: val, date: s.date || new Date().toISOString() })
    }

    // Add any local-only items
    for (const l of measurements.value) {
      const key = String(l.type).toLowerCase()
      if (!serverByType.has(key)) {
        let v: any = l.value ?? 0
        if (key === 'пол') v = Number(v) || 0
        merged.push({ type: l.type, value: v, date: l.date || new Date().toISOString() })
      }
    }

    await api.post('/measurements/update', merged)
    $q.notify({ type: 'positive', message: 'Замеры сохранены' })
    await loadMeasurements()
  } catch (err: unknown) {
    try {
      // @ts-ignore
      const status = err && err.response && err.response.status
      if (status === 401) {
        $q.notify({ type: 'warning', message: 'Требуется авторизация' })
        void router.push('/signin')
        return
      }
    } catch (_) {}
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
    } catch (_) {}
    console.warn('Failed to load trainings', err)
  } finally {
    trainingsLoading.value = false
  }
}
</script>

<style scoped>
.page-with-nav { padding-bottom: 88px; }
.section-title { font-size: 16px; font-weight: 600; color: #2b2b2b; margin: 6px 0 8px; }
.rounded-card { border-radius: 12px; }
.chips-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
.chip { border-radius: 12px; }
.clickable { cursor: pointer; }
</style>
