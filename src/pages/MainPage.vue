<template>
  <q-page class="ai-page">
    <!-- Header -->
    <div class="main-header">
      <div>
        <div class="main-greeting">Привет!</div>
        <div class="main-subtitle">Готов к тренировке?</div>
      </div>
    </div>

    <!-- CTA -->
    <button class="cta-btn" @click="quickStart">
      Начать тренировку
    </button>

    <!-- My workouts -->
    <div class="ai-section-title">Мои тренировки</div>

    <div v-if="plannedLoading" class="ai-card hint-card">Загрузка…</div>
    <div v-else-if="!plannedTrainings.length" class="ai-card hint-card">
      Нет запланированных тренировок
    </div>
    <div
      v-else
      v-for="pt in plannedTrainings" :key="pt.id"
      class="ai-card training-card"
      @click="openPlanned(pt.id)"
    >
      <div class="training-title">{{ pt.training?.title || 'Тренировка' }}</div>
      <div class="training-days">{{ (pt.weekdays || []).map(dayLabel).join(' · ') }}</div>
    </div>

    <div class="row-btns">
      <button class="ai-pill-btn outline flex-1" @click="openCreatePlannedDialog">+ Новая</button>
      <button class="ai-pill-btn secondary flex-1" @click="openAiTraining">С ИИ</button>
    </div>

    <!-- AI tools -->
    <div class="ai-section-title">Анализ техники</div>
    <div class="tools-grid">
      <div class="ai-card tool-card" @click="router.push('/squat-coach')">
        <q-icon name="videocam" size="28px" color="primary" class="tool-icon" />
        <div class="tool-title">Живой коуч</div>
        <div class="tool-desc">Камера в реальном времени</div>
      </div>
      <div class="ai-card tool-card" @click="router.push('/squat-analyze')">
        <q-icon name="analytics" size="28px" color="primary" class="tool-icon" />
        <div class="tool-title">Анализ видео</div>
        <div class="tool-desc">Загрузить видео для разбора</div>
      </div>
    </div>

    <!-- Bottom nav -->
    <BottomNavBar v-model="activeTab" @navigate="onNavigate" />

    <!-- Create dialog -->
    <q-dialog v-model="createDialog">
      <div class="ai-dialog">
        <div class="dialog-title">Новая тренировка</div>

        <label class="ai-label">Название</label>
        <input v-model="newPlanned.training.title" class="ai-input" placeholder="Название тренировки" />

        <label class="ai-label">Дни недели</label>
        <div class="days-grid">
          <button
            v-for="d in weekdays" :key="d.val"
            class="ai-pill-btn outline day-btn"
            :class="{ active: newPlanned.weekdays.includes(d.val) }"
            @click="toggleDay(d.val)"
          >{{ d.label }}</button>
        </div>

        <!-- Selected exercises -->
        <div v-if="newPlanned.training.perfomable_exercises?.length">
          <label class="ai-label">Упражнения</label>
          <div class="selected-exercises">
            <div
              v-for="(pe, idx) in newPlanned.training.perfomable_exercises"
              :key="idx"
              class="selected-ex-row"
            >
              <span class="selected-ex-name">{{ exerciseTitleById(pe.exercise_id) }}</span>
              <span class="selected-ex-sets">{{ pe.sets?.length || 0 }} сет.</span>
              <button class="remove-ex-btn" @click="removeExerciseRow(idx)">✕</button>
            </div>
          </div>
        </div>

        <div class="dialog-actions">
          <button class="ai-pill-btn outline" @click="cancelCreate">Отмена</button>
          <button class="ai-pill-btn" @click="goToExercisesToAdd">+ Упражнения</button>
          <button class="ai-pill-btn secondary" @click="createPlanned">Создать</button>
        </div>
      </div>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import BottomNavBar from '../components/BottomNavBar.vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from 'src/boot/axios'
import { dayLabel } from 'src/utils/tags'
import { useQuasar } from 'quasar'
import { usePlannedDraftStore } from 'src/stores/plannedDraft'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const draftStore = usePlannedDraftStore()

const activeTab = ref('add')
const plannedTrainings = ref<any[]>([])
const plannedLoading = ref(false)
const createDialog = ref(false)
const exercises = ref<{ id: number; title: string }[]>([])

const weekdays = [
  { val: 'Mon', label: 'Пн' }, { val: 'Tue', label: 'Вт' }, { val: 'Wed', label: 'Ср' },
  { val: 'Thu', label: 'Чт' }, { val: 'Fri', label: 'Пт' }, { val: 'Sat', label: 'Сб' },
  { val: 'Sun', label: 'Вс' },
]

const newPlanned = ref<any>({
  weekdays: [],
  training: { title: '', perfomable_exercises: [] },
})

function toggleDay(d: string) {
  const idx = newPlanned.value.weekdays.indexOf(d)
  if (idx === -1) newPlanned.value.weekdays.push(d)
  else newPlanned.value.weekdays.splice(idx, 1)
}

function todayWeekdayCode() {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()]!
}

async function quickStart() {
  const found = plannedTrainings.value.find((p: any) =>
    Array.isArray(p.weekdays) && p.weekdays.includes(todayWeekdayCode())
  )
  if (!found) {
    $q.notify({ type: 'warning', message: 'Нет тренировки на сегодня' })
    return
  }
  void router.push({ path: '/performedTraining', query: { plannedId: String(found.id), mode: 'inprogress' } })
}

async function fetchPlannedTrainings() {
  plannedLoading.value = true
  try {
    const resp = await api.get('/training/planned')
    plannedTrainings.value = resp.data || []
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось загрузить тренировки' })
  } finally {
    plannedLoading.value = false
  }
}

function openPlanned(id: number) {
  void router.push({ path: '/plannedTraining', query: { id: String(id) } })
}

function openCreatePlannedDialog() {
  createDialog.value = true
}

function cancelCreate() {
  createDialog.value = false
  draftStore.clearDraft()
  newPlanned.value = { weekdays: [], training: { title: '', perfomable_exercises: [] } }
}

async function fetchExercises() {
  try {
    const resp = await api.get('/exercise/')
    exercises.value = (resp.data || []).map((x: any) => ({ id: Number(x.id), title: x.title || String(x.id) }))
  } catch { /* */ }
}

function exerciseTitleById(id: number) {
  return exercises.value.find((e) => e.id === Number(id))?.title || `Упражнение #${id}`
}

function removeExerciseRow(idx: number) {
  newPlanned.value.training.perfomable_exercises.splice(idx, 1)
}

function goToExercisesToAdd() {
  draftStore.startDraft({
    weekdays: newPlanned.value.weekdays || [],
    training: { title: newPlanned.value.training?.title || '', perfomable_exercises: [] },
  })
  void router.push({ path: '/exercises', query: { fromDraft: '1' } })
}

async function createPlanned() {
  const merged: any = {}
  if (draftStore.draft) Object.assign(merged, JSON.parse(JSON.stringify(draftStore.draft)))
  Object.assign(merged, JSON.parse(JSON.stringify(newPlanned.value)))
  merged.training = merged.training || { title: '', perfomable_exercises: [] }
  if (!merged.training.title) { $q.notify({ type: 'warning', message: 'Введите название' }); return }
  if (!merged.weekdays?.length) { $q.notify({ type: 'warning', message: 'Выберите дни' }); return }
  try {
    const payload = {
      weekdays: merged.weekdays,
      training: {
        title: merged.training.title,
        perfomable_exercises: (merged.training.perfomable_exercises || []).map((pe: any) => ({
          exercise_id: Number(pe.exercise_id),
          sets: (pe.sets || []).map((s: any) => ({
            weight: Number(s.weight), repetitions: Number(s.repetitions), rest_duration: Number(s.rest_duration || 60)
          })),
        })),
      },
    }
    const resp = await api.post('/training/planned/create', payload)
    if (resp.data) {
      plannedTrainings.value.unshift(resp.data)
      $q.notify({ type: 'positive', message: 'Тренировка создана 🌿' })
      createDialog.value = false
      newPlanned.value = { weekdays: [], training: { title: '', perfomable_exercises: [] } }
      draftStore.clearDraft()
    }
  } catch {
    $q.notify({ type: 'negative', message: 'Ошибка при создании' })
  }
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function openAiTraining() {
  void router.push({ path: '/coach', query: { mode: 'prepare_trainning', chat_id: uuidv4() } })
}

function onNavigate(key: string) {
  const map: Record<string, string> = {
    chat: '/coach', history: '/history', add: '/mainPage',
    exercises: '/exercises', profile: '/profile',
  }
  const to = map[key] || '/mainPage'
  if (route.path !== to) void router.push(to)
}

function syncTab() {
  const p = route.path
  if (p.endsWith('/history')) activeTab.value = 'history'
  else if (p.endsWith('/exercises')) activeTab.value = 'exercises'
  else if (p.endsWith('/profile')) activeTab.value = 'profile'
  else if (p.endsWith('/coach')) activeTab.value = 'chat'
  else activeTab.value = 'add'
}

watch(() => route.path, syncTab)
watch(() => route.query, (q) => {
  if (q.openCreate === '1') {
    if (draftStore.draft) newPlanned.value = JSON.parse(JSON.stringify(draftStore.draft))
    createDialog.value = true
    void router.replace({ query: { ...route.query, openCreate: undefined } })
  }
})

onMounted(() => {
  syncTab()
  try {
    const t = localStorage.getItem('access_token')
    if (t) api.defaults.headers.common['Authorization'] = `Bearer ${t}`
  } catch { /* */ }
  void fetchPlannedTrainings()
  void fetchExercises()
  if (route.query.openCreate === '1') {
    if (draftStore.draft) newPlanned.value = JSON.parse(JSON.stringify(draftStore.draft))
    createDialog.value = true
    void router.replace({ query: { ...route.query, openCreate: undefined } })
  }
})
</script>

<style scoped>
.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.main-greeting {
  font-size: 22px;
  font-weight: 800;
  color: var(--ai-text);
}

.main-subtitle {
  font-size: 14px;
  color: var(--ai-shadow);
  font-weight: 600;
}

.icon-btn { padding: 8px 14px; font-size: 13px; }

.cta-btn {
  width: 100%;
  padding: 18px;
  border-radius: 50px;
  border: none;
  background: var(--ai-amber);
  color: #fff;
  font-size: 18px;
  font-weight: 800;
  font-family: 'Nunito', sans-serif;
  box-shadow: 0 6px 0 0 #c8841a;
  cursor: pointer;
  margin-bottom: 4px;
  transition: transform 0.1s, box-shadow 0.1s;
}

.cta-btn:active {
  transform: translateY(4px);
  box-shadow: 0 2px 0 0 #c8841a;
}

.training-card {
  cursor: pointer;
  transition: transform 0.1s;
}

.training-card:active { transform: scale(0.98); }

.training-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--ai-text);
}

.training-days {
  font-size: 13px;
  color: var(--ai-shadow);
  margin-top: 4px;
}

.hint-card {
  color: var(--ai-shadow);
  text-align: center;
  font-size: 14px;
}

.row-btns {
  display: flex;
  gap: 10px;
  margin-top: 8px;
  margin-bottom: 4px;
}

.flex-1 { flex: 1; }

.tools-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 8px;
}

.tool-card {
  cursor: pointer;
  text-align: center;
  padding: 14px 8px;
  transition: transform 0.1s;
}

.tool-card:active { transform: scale(0.97); }

.tool-icon { font-size: 28px; margin-bottom: 6px; }

.tool-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--ai-text);
}

.tool-desc {
  font-size: 11px;
  color: var(--ai-shadow);
  margin-top: 3px;
  line-height: 1.3;
}

/* Dialog */
.ai-dialog {
  background: var(--ai-bg);
  border-radius: 24px;
  padding: 24px 20px;
  width: min(380px, 92vw);
  box-shadow: 0 8px 0 0 var(--ai-shadow);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dialog-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--ai-text);
  margin-bottom: 4px;
}

.selected-exercises {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.selected-ex-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(25,200,185,0.1);
  border-radius: 10px;
  padding: 8px 10px;
}

.selected-ex-name {
  flex: 1;
  font-size: 13px;
  font-weight: 700;
  color: var(--ai-text);
}

.selected-ex-sets {
  font-size: 12px;
  color: var(--ai-teal);
  font-weight: 600;
}

.remove-ex-btn {
  background: none;
  border: none;
  color: var(--ai-shadow);
  font-size: 14px;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
}

.ai-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--ai-text);
}

.ai-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 14px;
  border: 2px solid #e8dcc8;
  background: rgba(255,255,255,0.8);
  color: var(--ai-text);
  font-size: 15px;
  font-family: 'Nunito', sans-serif;
  outline: none;
  box-sizing: border-box;
}

.ai-input:focus { border-color: var(--ai-teal); }

.days-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.day-btn { padding: 6px 12px; font-size: 13px; }

.dialog-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
  margin-top: 4px;
}
</style>
