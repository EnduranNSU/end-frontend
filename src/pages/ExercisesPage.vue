<template>
  <q-page class="q-pa-md page-with-nav">
    <div class="content">

      <!-- Toggle between Trainings and Exercises -->
      <div class="q-mb-md flex justify-center">
        <q-btn-toggle v-model="mode" no-caps unelevated color="primary" toggle-color="primary" text-color="black"
          :options="[
            { label: 'Тренировки', value: 'trainings' },
            { label: 'Упражнения', value: 'exercises' }
          ]" />
      </div>

      <!-- Filters -->
      <div v-if="mode === 'trainings'" class="q-mb-md filters">
        <q-input v-model="trainingQuery" label="Поиск тренировки" clearable dense filled />
      </div>

      <div v-else class="q-mb-md filters">
        <q-input v-model="exerciseQuery" label="Название упражнения" clearable dense filled />
      </div>

      <!-- Lists -->
      <div v-if="mode === 'trainings'">
          <div v-if="globalTrainingsLoading" class="empty-hint">Загрузка тренировок...</div>
          <div v-else-if="globalTrainings.length">
            <div class="cards-grid">
              <q-card v-for="t in globalTrainings" :key="t.id" class="card">
                <div class="card-body">
                  <div class="card-title">{{ t.name }}</div>
                  <div class="card-subtitle">{{ t.level }}</div>
                  <div style="margin-top:6px; font-size:13px; color:#666">{{ t.description }}</div>
                </div>
              </q-card>
            </div>
          </div>
          <div v-else>
            <div v-if="!flattenedTrainings.length" class="empty-hint">Тренировок пока нет.</div>
            <div class="cards-grid">
              <q-card
                v-for="t in filteredTrainings"
                :key="t.id"
                class="card"
              >
                <div class="card-body">
                  <div class="card-title">{{ t.name }}</div>
                  <div class="card-subtitle">Папка: {{ t.folderName }}</div>
                </div>
              </q-card>
            </div>
          </div>
      </div>

      <div v-else>
        <div v-if="loading" class="empty-hint">Загрузка упражнений...</div>
        <div v-else-if="!exercises.length" class="empty-hint">Список упражнений пуст.</div>
        <div class="cards-grid">
          <q-card v-for="ex in filteredExercises" :key="ex.id" class="card exercise-card" clickable
            @click="openExercise(ex.id)">
            <div class="card-body column" style="cursor:pointer">
              <div class="card-title">{{ ex.description }}</div>
            </div>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Bottom nav -->
    <BottomNavBar v-model="activeTab" @navigate="onNavigate" />
  </q-page>
</template>

<script setup lang="ts">
import BottomNavBar from 'src/components/BottomNavBar.vue'
import { computed, ref, watch, onMounted } from 'vue'
import { api } from 'src/boot/axios'
import { useRoute, useRouter } from 'vue-router'
import { useFoldersStore } from 'src/stores/folders'
import { useQuasar } from 'quasar'

const route = useRoute()
const router = useRouter()

const activeTab = ref('exercises')

const $q = useQuasar()

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

// UI mode: trainings or exercises
const mode = ref<'trainings' | 'exercises'>('exercises')

// Trainings: flatten from folders store and filter by name
const foldersStore = useFoldersStore()
const flattenedTrainings = computed(() => {
  return (foldersStore.folders || []).flatMap((f) =>
    (f.trainings || []).map((t) => ({
      id: t.id,
      name: t.name,
      folderId: f.id,
      folderName: f.name,
    }))
  )
})

const trainingQuery = ref('')
const filteredTrainings = computed(() => {
  const q = trainingQuery.value.trim().toLowerCase()
  if (!q) return flattenedTrainings.value
  return flattenedTrainings.value.filter((t) => t.name.toLowerCase().includes(q))
})

// --- Global trainings (загружаются при переключении на режим 'trainings')
type GlobalTraining = {
  id: number
  name: string
  description: string
  level?: string
  exercises?: ApiExercise[]
}

const globalTrainings = ref<GlobalTraining[]>([])
const globalTrainingsLoading = ref(false)

async function fetchGlobalTrainings() {
  globalTrainingsLoading.value = true
  try {
    const resp = await api.get<GlobalTraining[]>('/api/v1/global-trainings')
    const data = resp.data || []
    // Подставляем заглушки для пустых полей
    globalTrainings.value = data.map((g) => ({
      id: g.id,
      name: g.name && g.name.trim() ? g.name : 'Без названия',
      description: g.description && g.description.trim() ? g.description : 'Описание отсутствует',
      level: g.level || 'unknown',
      exercises: Array.isArray(g.exercises) ? g.exercises : [],
    }))
  } catch (err) {
    console.error('Failed to load global trainings', err)
    $q.notify({ type: 'negative', message: 'Не удалось загрузить глобальные тренировки' })
    globalTrainings.value = []
  } finally {
    globalTrainingsLoading.value = false
  }
}

// Вызываем загрузку при переключении режима
watch(mode, (m) => {
  if (m === 'trainings') {
    void fetchGlobalTrainings()
  }
})

// Exercises: fetched from API
export type ApiExercise = {
  id: number
  description: string
  video_url?: string
}

const exercises = ref<ApiExercise[]>([])
const exerciseQuery = ref('')
const loading = ref(false)

const filteredExercises = computed(() => {
  const q = exerciseQuery.value.trim().toLowerCase()
  return exercises.value.filter((ex) => {
    const text = (ex.description || '').toLowerCase()
    return !q || text.includes(q)
  })
})

onMounted(async () => {
  loading.value = true
  try {
    const resp = await api.get<ApiExercise[]>('/api/v1/exercises')
    exercises.value = resp.data || []
  } catch (err) {
    console.error('Failed to load exercises', err)
    // Показываем уведомление об ошибке пользователю
    $q.notify({ type: 'negative', message: 'Не удалось загрузить упражнения' })
    exercises.value = []
  } finally {
    loading.value = false
  }
})

function openExercise(id: number | string) {
  // Переход в детальную страницу упражнения, передаём id в query
  void router.push({ path: '/exercisePage', query: { id: String(id) } })
}
</script>

<style scoped>
.page-with-nav {
  padding-bottom: 88px;
}

.content {
  max-width: 980px;
  margin: 0 auto;
}

.filters .grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.card {
  border-radius: 14px;
  overflow: hidden;
}

.card-body {
  padding: 10px 12px 14px;
}

.card-title {
  font-weight: 600;
}

.card-subtitle {
  font-size: 12px;
  color: #666;
}

.exercise-card .chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.empty-hint {
  opacity: 0.7;
  text-align: center;
  margin: 12px 0;
}
</style>
