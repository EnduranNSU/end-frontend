<template>
  <q-page class="ai-page">
    <div class="page-header">
      <button class="back-btn" @click="router.back()">← Назад</button>
      <div class="page-title">Тренировка</div>
    </div>

    <div v-if="loading" class="hint-text">Загрузка…</div>
    <div v-else-if="!planned" class="hint-text">Тренировка не найдена</div>

    <template v-else>
      <!-- Title card -->
      <div class="ai-card training-header">
        <div class="training-name">{{ planned.training?.title || 'Тренировка' }}</div>
        <div class="training-days">{{ (planned.weekdays || []).map(dayLabel).join(' · ') || '—' }}</div>
        <div class="header-actions">
          <button class="ai-pill-btn" @click="startPlannedTraining">Начать</button>
          <button class="ai-pill-btn outline" @click="openEdit">✏️</button>
          <button class="ai-pill-btn outline danger" @click="confirmDelete">🗑</button>
        </div>
      </div>

      <!-- Exercises -->
      <div class="ai-section-title">Упражнения</div>
      <div
        v-for="(pe, idx) in planned.training?.perfomable_exercises || []"
        :key="idx"
        class="ai-card ex-item"
      >
        <div class="ex-name">{{ pe.exercise?.title || 'Упражнение' }}</div>
        <div class="ex-tags">{{ (pe.exercise?.tags || []).map(tagLabel).join(' · ') }}</div>
        <div class="ex-sets">{{ (pe.sets || []).length }} сет{{ setSuffix((pe.sets || []).length) }}</div>
      </div>
    </template>

    <!-- Edit dialog -->
    <q-dialog v-model="editDialog">
      <div class="ai-dialog">
        <div class="dialog-title">Редактировать</div>

        <label class="ai-label">Название</label>
        <input v-model="editModel.training.title" class="ai-input" />

        <label class="ai-label">Дни недели</label>
        <div class="days-grid">
          <button
            v-for="d in weekdaysList" :key="d.val"
            class="ai-pill-btn outline day-btn"
            :class="{ active: editModel.weekdays.includes(d.val) }"
            @click="toggleDay(d.val)"
          >{{ d.label }}</button>
        </div>

        <div class="ai-section-title" style="margin-top:12px">Упражнения</div>
        <div v-for="(pe, pi) in editModel.training.perfomable_exercises || []" :key="pi" class="edit-ex-block">
          <div class="edit-ex-header">
            <select v-model.number="pe.exercise_id" class="ai-select-full">
              <option v-for="e in exercises" :key="e.id" :value="e.id">{{ e.title }}</option>
            </select>
            <button class="remove-btn" @click="removePerfomableExercise(pi)">✕</button>
          </div>
          <div v-for="(s, si) in pe.sets || []" :key="si" class="set-row">
            <div class="set-field">
              <label class="ai-label">Повт.</label>
              <input v-model.number="s.repetitions" type="number" class="ai-input-sm" />
            </div>
            <div class="set-field">
              <label class="ai-label">Кг</label>
              <input v-model.number="s.weight" type="number" class="ai-input-sm" />
            </div>
            <button class="remove-btn" @click="removeSetFromPerf(pi, si)">✕</button>
          </div>
          <button class="ai-pill-btn outline small-btn" @click="addSetToPerf(pi)">+ Сет</button>
        </div>

        <div class="add-ex-row">
          <select v-model.number="newExerciseToAdd" class="ai-select-full">
            <option :value="null">Выбрать упражнение…</option>
            <option v-for="e in exercises" :key="e.id" :value="e.id">{{ e.title }}</option>
          </select>
          <button class="ai-pill-btn outline small-btn" @click="addPerfomableExercise">+ Добавить</button>
        </div>

        <div class="dialog-actions">
          <button class="ai-pill-btn outline" @click="editDialog = false">Отмена</button>
          <button class="ai-pill-btn" @click="saveUpdate">Сохранить</button>
        </div>
      </div>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from 'src/boot/axios'
import { useQuasar } from 'quasar'
import { tagLabel, dayLabel } from 'src/utils/tags'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const planned = ref<any | null>(null)
const loading = ref(true)
const editDialog = ref(false)
const editModel = ref<any>({ weekdays: [], training: { title: '', perfomable_exercises: [] } })
const exercises = ref<{ id: number; title: string }[]>([])
const newExerciseToAdd = ref<number | null>(null)

const weekdaysList = [
  { val: 'Mon', label: 'Пн' }, { val: 'Tue', label: 'Вт' }, { val: 'Wed', label: 'Ср' },
  { val: 'Thu', label: 'Чт' }, { val: 'Fri', label: 'Пт' }, { val: 'Sat', label: 'Сб' }, { val: 'Sun', label: 'Вс' },
]

function setSuffix(n: number) {
  if (n === 1) return ''
  if (n >= 2 && n <= 4) return 'а'
  return 'ов'
}

function toggleDay(d: string) {
  const i = editModel.value.weekdays.indexOf(d)
  if (i === -1) editModel.value.weekdays.push(d)
  else editModel.value.weekdays.splice(i, 1)
}

async function loadPlanned() {
  loading.value = true
  const id = Number(route.query.id || route.params.id)
  if (!id) { void router.push('/mainPage'); return }
  try {
    const token = localStorage.getItem('access_token')
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    const resp = await api.get(`/training/planned/${id}`)
    planned.value = resp.data || null
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось загрузить тренировку' })
    planned.value = null
  } finally {
    loading.value = false
  }
}

async function fetchExercises() {
  try {
    const resp = await api.get('/exercise/')
    exercises.value = (resp.data || []).map((x: any) => ({ id: Number(x.id), title: x.title || String(x.id) }))
  } catch { /* */ }
}

function startPlannedTraining() {
  const id = Number(planned.value?.id)
  if (id) void router.push({ path: '/performedTraining', query: { plannedId: String(id), mode: 'inprogress' } })
}

function openEdit() {
  if (!planned.value) return
  const copy = JSON.parse(JSON.stringify(planned.value))
  if (!copy.training) copy.training = { title: '', perfomable_exercises: [] }
  copy.training.perfomable_exercises = (copy.training.perfomable_exercises || []).map((pe: any) => ({
    exercise_id: pe.exercise?.id ?? pe.exercise_id ?? null,
    sets: (pe.sets || []).map((s: any) => ({
      weight: s.weight ?? 0, repetitions: s.repetitions ?? 0, rest_duration: s.rest_duration ?? 60,
    })),
  }))
  editModel.value = copy
  editDialog.value = true
}

async function saveUpdate() {
  const id = Number(route.query.id || route.params.id)
  if (!id) return
  try {
    const token = localStorage.getItem('access_token')
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    const payload = {
      weekdays: editModel.value.weekdays || [],
      training: {
        title: editModel.value.training?.title || '',
        perfomable_exercises: (editModel.value.training?.perfomable_exercises || []).map((pe: any) => ({
          exercise_id: Number(pe.exercise_id),
          sets: (pe.sets || []).map((s: any) => ({
            weight: Number(s.weight), repetitions: Number(s.repetitions), rest_duration: Number(s.rest_duration ?? 60),
          })),
        })),
      },
    }
    const resp = await api.post(`/training/planned/update/${id}`, payload)
    planned.value = resp.data || planned.value
    $q.notify({ type: 'positive', message: 'Сохранено' })
    editDialog.value = false
  } catch {
    $q.notify({ type: 'negative', message: 'Ошибка при сохранении' })
  }
}

async function confirmDelete() {
  const id = Number(route.query.id || route.params.id)
  if (!id) return
  $q.dialog({ title: 'Удалить?', message: 'Тренировка будет удалена', cancel: true, ok: { label: 'Удалить', color: 'negative' } })
    .onOk(async () => {
      try {
        const token = localStorage.getItem('access_token')
        if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        await api.post(`/training/planned/delete/${id}`)
        $q.notify({ type: 'positive', message: 'Удалено' })
        void router.push('/mainPage')
      } catch {
        $q.notify({ type: 'negative', message: 'Ошибка при удалении' })
      }
    })
}

function addSetToPerf(pi: number) {
  const pe = editModel.value.training.perfomable_exercises[pi]
  if (!pe) return
  if (!Array.isArray(pe.sets)) pe.sets = []
  pe.sets.push({ weight: 0, repetitions: 8, rest_duration: 60 })
}

function removeSetFromPerf(pi: number, si: number) {
  editModel.value.training.perfomable_exercises[pi]?.sets?.splice(si, 1)
}

function removePerfomableExercise(idx: number) {
  editModel.value.training.perfomable_exercises.splice(idx, 1)
}

function addPerfomableExercise() {
  if (!newExerciseToAdd.value) return
  if (!Array.isArray(editModel.value.training.perfomable_exercises)) editModel.value.training.perfomable_exercises = []
  editModel.value.training.perfomable_exercises.push({
    exercise_id: Number(newExerciseToAdd.value),
    sets: [{ weight: 0, repetitions: 8, rest_duration: 60 }],
  })
  newExerciseToAdd.value = null
}

onMounted(() => { void loadPlanned(); void fetchExercises() })
</script>

<style scoped>
.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.back-btn { background: none; border: none; color: var(--ai-teal); font-size: 15px; font-weight: 700; cursor: pointer; padding: 0; }
.page-title { font-size: 20px; font-weight: 800; color: var(--ai-text); }
.hint-text { color: var(--ai-shadow); text-align: center; padding: 32px; font-size: 14px; }

.training-header { display: flex; flex-direction: column; gap: 6px; }
.training-name { font-size: 20px; font-weight: 800; color: var(--ai-text); }
.training-days { font-size: 13px; color: var(--ai-shadow); font-weight: 600; }
.header-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }

.ex-item { display: flex; flex-direction: column; gap: 3px; padding: 12px 16px; }
.ex-name { font-size: 15px; font-weight: 700; color: var(--ai-text); }
.ex-tags { font-size: 12px; color: var(--ai-shadow); }
.ex-sets { font-size: 13px; color: var(--ai-teal); font-weight: 700; }

.ai-pill-btn.danger { color: #e05c5c; border-color: #e05c5c; }

/* Dialog */
.ai-dialog {
  background: var(--ai-bg); border-radius: 24px; padding: 24px 20px;
  width: min(400px, 92vw); box-shadow: 0 8px 0 0 var(--ai-shadow);
  display: flex; flex-direction: column; gap: 10px;
  max-height: 85vh; overflow-y: auto;
}
.dialog-title { font-size: 20px; font-weight: 800; color: var(--ai-text); }
.ai-label { font-size: 12px; font-weight: 700; color: var(--ai-text); }
.ai-input {
  width: 100%; padding: 10px 14px; border-radius: 12px; border: 2px solid #e8dcc8;
  background: rgba(255,255,255,0.8); color: var(--ai-text); font-size: 14px;
  font-family: 'Nunito', sans-serif; outline: none; box-sizing: border-box;
}
.ai-input:focus { border-color: var(--ai-teal); }
.days-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.day-btn { padding: 6px 10px; font-size: 12px; }
.edit-ex-block {
  background: rgba(255,255,255,0.5); border-radius: 12px;
  padding: 10px 12px; display: flex; flex-direction: column; gap: 8px;
}
.edit-ex-header { display: flex; gap: 8px; align-items: center; }
.ai-select-full {
  flex: 1; padding: 8px 12px; border-radius: 10px; border: 2px solid #e8dcc8;
  background: rgba(255,255,255,0.8); color: var(--ai-text);
  font-size: 13px; font-family: 'Nunito', sans-serif; outline: none;
}
.set-row { display: flex; gap: 8px; align-items: flex-end; }
.set-field { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.ai-input-sm {
  width: 100%; padding: 7px 10px; border-radius: 10px; border: 2px solid #e8dcc8;
  background: rgba(255,255,255,0.8); color: var(--ai-text);
  font-size: 13px; font-family: 'Nunito', sans-serif; outline: none; box-sizing: border-box;
}
.remove-btn { background: none; border: none; color: #e05c5c; font-size: 16px; cursor: pointer; padding: 6px 4px; align-self: flex-end; }
.small-btn { padding: 6px 12px; font-size: 12px; align-self: flex-start; }
.add-ex-row { display: flex; flex-direction: column; gap: 6px; }
.dialog-actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; margin-top: 4px; }
</style>
