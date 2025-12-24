<template>
  <q-page class="q-pa-md page-with-nav">
    <div class="content">

      <!-- Filters -->
      <div class="q-mb-md filters">
        <div class="grid">
          <q-input v-model="exerciseQuery" label="Название упражнения" clearable dense filled />
          <q-select v-model="selectedTag" :options="tagOptions" label="Тег" dense clearable :loading="tagsLoading"
            emit-value map-options />
        </div>
      </div>

      <!-- Lists -->
      <div>
        <div v-if="loading" class="empty-hint">Загрузка упражнений...</div>
        <div v-else-if="!exercises.length" class="empty-hint">Список упражнений пуст.</div>
        <div class="cards-grid">
          <q-card v-for="ex in filteredExercises" :key="ex.id" class="card exercise-card" clickable
            @click="openExercise(ex.id)">
            <div class="card-body column" style="cursor:pointer; position:relative">
              <div class="card-title">{{ ex.title }}</div>
              <q-btn v-if="showDraftAdd" dense round flat icon="add" size="sm"
                style="position:absolute; right:8px; top:8px" @click.stop.prevent="onAddClick(ex.id)" />
            </div>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Bottom nav -->
    <!-- Add-to-draft dialog -->
    <q-dialog v-model="addDialog">
      <q-card style="min-width:320px; max-width:92vw">
        <q-card-section>
          <div class="text-h6">Добавить упражнение</div>
        </q-card-section>
        <q-card-section>
          <div class="q-gutter-md">
            <div>Упражнение: <strong>{{exercises.find(e => e.id === addExerciseId)?.title}}</strong></div>
            <div v-for="(s, i) in addSets" :key="i" class="row items-center q-gutter-sm">
              <div class="col">
                <q-input v-model.number="s.repetitions" label="Повторы" type="number" dense />
              </div>
              <div class="col">
                <q-input v-model.number="s.weight" label="Вес (кг)" type="number" dense />
              </div>
              <div class="col-auto">
                <q-btn dense flat icon="delete" color="negative" @click.prevent="removeAddSet(i)" />
              </div>
            </div>

            <div class="row q-mt-sm">
              <q-btn flat label="Добавить сет" @click.prevent="pushAddSet" />
            </div>

            <div class="row q-justify-end q-mt-md">
              <q-btn flat label="Отмена" color="grey" v-close-popup @click="() => (addDialog = false)" />
              <q-btn color="primary" label="Добавить" @click="confirmAddToDraft" />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <BottomNavBar v-model="activeTab" @navigate="onNavigate" />
  </q-page>
</template>

<script setup lang="ts">
import BottomNavBar from 'src/components/BottomNavBar.vue'
import { usePlannedDraftStore } from 'src/stores/plannedDraft'
import { computed, ref, watch, onMounted } from 'vue'
import { api } from 'src/boot/axios'
import { useRoute, useRouter } from 'vue-router'
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

// Trainings removed: page now only shows exercises

// Exercises: fetched from API
export type ApiExercise = {
  id: number
  title: string
  tags: string[]
  hrefs?: string[]
}

const exercises = ref<ApiExercise[]>([])
const exerciseQuery = ref('')
const loading = ref(false)

// Теги для фильтрации (собираем из ответа /exercise/)
const tags = ref<string[]>([])
const tagsLoading = ref(false)
const selectedTag = ref<string | null>(null)

const tagOptions = computed(() => tags.value.map((t) => ({ label: t, value: t })))

async function fetchAllExercises() {
  loading.value = true
  tagsLoading.value = true
  try {
    const resp = await api.get<ApiExercise[]>('/exercise/')
    const data = resp.data || []
    // нормализуем поля: старые компоненты ожидают 'description'
    exercises.value = data.map((e) => ({ ...e }))

    // Собираем уникальные теги
    const set = new Set<string>()
    data.forEach((e) => {
      if (Array.isArray(e.tags)) {
        e.tags.forEach((t) => set.add(t))
      }
    })
    tags.value = Array.from(set).sort()
  } catch (err) {
    console.error('Failed to load exercises', err)
    $q.notify({ type: 'negative', message: 'Не удалось загрузить упражнения' })
    exercises.value = []
    tags.value = []
  } finally {
    loading.value = false
    tagsLoading.value = false
  }
}

// следим за выбором тега
// При выборе тега фильтрация выполняется на клиенте в computed `filteredExercises`
watch(selectedTag, () => {
  // noop: filteredExercises реагирует на selectedTag
})

const filteredExercises = computed(() => {
  const q = exerciseQuery.value.trim().toLowerCase()
  return exercises.value.filter((ex) => {
    const text = (ex.title || '').toLowerCase()
    const matchesText = !q || text.includes(q)
    const matchesTag = !selectedTag.value || (Array.isArray(ex.tags) && ex.tags.includes(selectedTag.value))
    return matchesText && matchesTag
  })
})

// draft store: if a draft is active, allow adding exercises to it
const draftStore = usePlannedDraftStore()
const showDraftAdd = computed(() => Boolean(draftStore.draft) || route.query.fromDraft === '1')

// dialog when adding an exercise from the exercises list
const addDialog = ref(false)
const addExerciseId = ref<number | null>(null)
const addSets = ref<Array<{ repetitions: number; weight: number }>>([])

function onAddClick(id: number) {
  addExerciseId.value = id
  addSets.value = [{ repetitions: 8, weight: 0 }]
  addDialog.value = true
}

function pushAddSet() {
  addSets.value.push({ repetitions: 8, weight: 0 })
}

function removeAddSet(idx: number) {
  addSets.value.splice(idx, 1)
}

async function confirmAddToDraft() {
  if (!addExerciseId.value) return
  draftStore.startDraft(draftStore.draft ?? { weekdays: [], training: { title: '', perfomable_exercises: [] } })
  const sets = addSets.value.map((s) => ({ weight: Number(s.weight), repetitions: Number(s.repetitions), rest_duration: 60 }))
  draftStore.addExercise(Number(addExerciseId.value), sets)
  // navigate back to main page and open the create dialog
  await router.push({ path: '/mainPage', query: { openCreate: '1' } })
}

onMounted(() => {
  // Загружаем все упражнения и собираем теги из ответа
  void fetchAllExercises()
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
