<template>
  <q-page class="ai-page">
    <div class="page-header">
      <button class="back-btn" @click="router.back()">← Назад</button>
      <div class="page-title">{{ item?.training?.title || 'Тренировка' }}</div>
    </div>

    <div v-if="loading" class="hint-text">Загрузка…</div>
    <div v-else-if="!item" class="hint-text">Тренировка не найдена</div>

    <template v-else>
      <!-- Info card -->
      <div class="ai-card info-card">
        <div class="info-row">
          <span class="info-label">📅 Дата</span>
          <span class="info-val">{{ item.date ? new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' }}</span>
        </div>
        <div class="info-row" v-if="inProgress">
          <span class="info-label">⏱ Время</span>
          <span class="info-val timer-val">{{ formatElapsed(elapsed) }}</span>
        </div>
        <div v-if="inProgress" class="rest-row">
          <label class="ai-label">Отдых между сетами (сек)</label>
          <input v-model.number="globalRest" type="number" class="ai-input-sm" @change="applyGlobalRest" />
        </div>
        <div class="info-actions">
          <button v-if="inProgress" class="ai-pill-btn finish-btn" @click="finishWorkout">
            Завершить тренировку
          </button>
          <template v-else>
            <button class="ai-pill-btn outline" @click="openEdit">Редактировать</button>
            <button class="ai-pill-btn outline danger" @click="confirmDelete">Удалить</button>
          </template>
        </div>
      </div>

      <!-- Exercises -->
      <div
        v-for="(pe, peIdx) in item.training?.perfomable_exercises || []"
        :key="peIdx"
        class="ai-card ex-block"
      >
        <div class="ex-header">
          <div class="ex-name">{{ pe.exercise?.title || 'Упражнение' }}</div>
          <div class="ex-count">{{ (pe.sets || []).length }} сет.</div>
        </div>

        <div
          v-for="(s, sIdx) in pe.sets || []"
          :key="sIdx"
          class="set-row"
          :class="{ done: isSetDone(peIdx, sIdx) }"
        >
          <div class="set-fields">
            <div class="set-field">
              <label class="ai-label">Повт.</label>
              <input v-model.number="s.repetitions" type="number" class="ai-input-sm" :readonly="!inProgress" />
            </div>
            <div class="set-field">
              <label class="ai-label">Кг</label>
              <input v-model.number="s.weight" type="number" class="ai-input-sm" :readonly="!inProgress" />
            </div>
            <div class="set-field">
              <label class="ai-label">Отдых</label>
              <div class="rest-val">{{ s.rest_duration || 60 }}с</div>
            </div>
          </div>

          <template v-if="inProgress">
            <div v-if="getTimer(peIdx, sIdx)?.running" class="rest-timer">
              ⏳ {{ getTimer(peIdx, sIdx)!.remaining }}с
              <button class="skip-btn" @click="stopRestTimer(`${peIdx}-${sIdx}`)">Пропустить</button>
            </div>
            <button
              v-else
              class="done-btn"
              :class="{ completed: isSetDone(peIdx, sIdx) }"
              @click="markSetDone(peIdx, sIdx)"
            >
              {{ isSetDone(peIdx, sIdx) ? '✓ Выполнен' : 'Выполнен?' }}
            </button>
          </template>
          <div v-else-if="isSetDone(peIdx, sIdx)" class="done-badge">✓</div>
        </div>
      </div>
    </template>

    <!-- Edit dialog -->
    <q-dialog v-model="editDialog">
      <div class="ai-dialog">
        <div class="dialog-title">Редактировать</div>
        <label class="ai-label">Дата</label>
        <input v-model="editModel.date" class="ai-input" />
        <label class="ai-label">Название</label>
        <input v-model="editModel.training.title" class="ai-input" />
        <div class="dialog-actions">
          <button class="ai-pill-btn outline" @click="editDialog = false">Отмена</button>
          <button class="ai-pill-btn" @click="saveUpdate">Сохранить</button>
        </div>
      </div>
    </q-dialog>

    <!-- Finish dialog -->
    <q-dialog v-model="finishDialog">
      <div class="ai-dialog finish-dialog">
        <div class="finish-icon">Отлично!</div>
        <div class="dialog-title">Тренировка завершена!</div>
        <div class="finish-time">{{ finishDialogTime }}</div>
        <div class="dialog-actions">
          <button class="ai-pill-btn outline" @click="onFinishDialogCancel">Продолжить</button>
          <button class="ai-pill-btn" @click="onFinishDialogOk">Сохранить</button>
        </div>
      </div>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from 'src/boot/axios'
import { useQuasar } from 'quasar'
import { tagLabel } from 'src/utils/tags'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const item = ref<any | null>(null)
const loading = ref(true)
const editDialog = ref(false)
const editModel = ref<any>({ date: '', training: { title: '' } })
const finishDialog = ref(false)
const finishDialogTime = ref('')
const inProgress = ref(false)
const elapsed = ref(0)
const globalRest = ref(60)
const timers = ref<Record<string, { remaining: number; intervalId: number | null; running: boolean }>>({})
let timerId: number | null = null

async function loadItem() {
  loading.value = true
  const mode = String(route.query.mode || '')
  const plannedId = Number(route.query.plannedId || 0)
  const id = Number(route.query.id || route.params.id)

  if (mode === 'inprogress' && plannedId) {
    try {
      const token = localStorage.getItem('access_token')
      if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const resp = await api.get(`/training/planned/${plannedId}`)
      const planned = resp.data
      const today = new Date().toISOString().split('T')[0]!
      item.value = { date: today, weekdays: planned.weekdays || [], training: planned.training || { title: '', perfomable_exercises: [] } }
      try {
        const firstRest = item.value.training.perfomable_exercises?.[0]?.sets?.[0]?.rest_duration
        if (firstRest) globalRest.value = Number(firstRest)
      } catch { /* */ }
      inProgress.value = true
      startTimer()
    } catch {
      $q.notify({ type: 'negative', message: 'Не удалось загрузить тренировку' })
      void router.push('/mainPage')
    } finally { loading.value = false }
    return
  }

  if (!id) { void router.push('/history'); loading.value = false; return }

  try {
    const token = localStorage.getItem('access_token')
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    const resp = await api.get(`/training/user_performed/${id}`)
    item.value = resp.data || null
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось загрузить' })
  } finally { loading.value = false }
}

function startTimer() {
  if (timerId) return
  timerId = window.setInterval(() => { elapsed.value += 1 }, 1000)
}

function stopTimer() {
  if (timerId) { clearInterval(timerId); timerId = null }
}

function applyGlobalRest() {
  const r = Number(globalRest.value || 0)
  item.value?.training?.perfomable_exercises?.forEach((pe: any) => {
    pe.sets?.forEach((s: any) => { s.rest_duration = r })
  })
}

function startRestTimerFn(key: string, duration: number) {
  if (timers.value[key]?.intervalId) clearInterval(timers.value[key].intervalId!)
  timers.value[key] = { remaining: duration, intervalId: null, running: true }
  timers.value[key]!.intervalId = window.setInterval(() => {
    if (!timers.value[key]) return
    timers.value[key]!.remaining -= 1
    if (timers.value[key]!.remaining <= 0) {
      clearInterval(timers.value[key]!.intervalId!)
      timers.value[key]!.running = false
      timers.value[key]!.intervalId = null
    }
  }, 1000)
}

function stopRestTimer(key: string) {
  const t = timers.value[key]
  if (!t) return
  if (t.intervalId) clearInterval(t.intervalId)
  delete timers.value[key]
}

function goBack() { void router.back() }

function openEdit() {
  if (!item.value) return
  editModel.value = JSON.parse(JSON.stringify(item.value))
  editDialog.value = true
}

async function saveUpdate() {
  const id = Number(route.query.id || route.params.id)
  if (!id) return
  try {
    const token = localStorage.getItem('access_token')
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    const resp = await api.post(`/training/user_performed/update/${id}`, {
      date: editModel.value.date,
      training: { title: editModel.value.training?.title || '' },
    })
    item.value = resp.data || item.value
    $q.notify({ type: 'positive', message: 'Сохранено' })
    editDialog.value = false
  } catch {
    $q.notify({ type: 'negative', message: 'Ошибка при сохранении' })
  }
}

function confirmDelete() {
  const id = Number(route.query.id || route.params.id)
  if (!id) return
  $q.dialog({ title: 'Удалить?', message: 'Запись будет удалена', cancel: true })
    .onOk(async () => {
      try {
        const token = localStorage.getItem('access_token')
        if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        await api.post(`/training/user_performed/delete/${id}`)
        $q.notify({ type: 'positive', message: 'Удалено' })
        void router.push('/history')
      } catch {
        $q.notify({ type: 'negative', message: 'Ошибка при удалении' })
      }
    })
}

function finishWorkout() {
  stopTimer()
  finishDialogTime.value = formatElapsed(elapsed.value)
  finishDialog.value = true
}

function onFinishDialogOk() { finishDialog.value = false; void continueFinish() }
function onFinishDialogCancel() { finishDialog.value = false; startTimer() }

async function continueFinish() {
  if (!item.value) return
  try {
    const token = localStorage.getItem('access_token')
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    const perf = (item.value.training?.perfomable_exercises || []).map((pe: any) => ({
      exercise_id: Number(pe.exercise?.id ?? pe.exercise_id ?? 0),
      sets: (pe.sets || []).map((s: any) => ({
        weight: Number(s.weight || 0), repetitions: Number(s.repetitions || 0), rest_duration: Number(s.rest_duration || 0),
      })),
    }))
    const resp = await api.post('/training/user_performed/create', {
      date: item.value.date || new Date().toISOString().split('T')[0],
      weekdays: item.value.weekdays || [],
      training: { title: item.value.training?.title || '', perfomable_exercises: perf },
    })
    const created = resp.data
    if (created?.id) {
      item.value = created
      inProgress.value = false
      elapsed.value = 0
      $q.notify({ type: 'positive', message: 'Тренировка сохранена Отлично!' })
      void router.replace({ path: '/performedTraining', query: { id: String(created.id) } })
    } else {
      inProgress.value = false
      $q.notify({ type: 'positive', message: 'Сохранено' })
    }
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось сохранить тренировку' })
    startTimer()
  }
}

function formatElapsed(sec: number) {
  const s = Math.max(0, Math.floor(sec))
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

function isSetDone(pi: number, si: number) {
  try { return Boolean(item.value.training.perfomable_exercises[pi].sets[si].done) } catch { return false }
}

function getTimer(pi: number, si: number) { return timers.value[`${pi}-${si}`] }

async function markSetDone(pi: number, si: number) {
  if (!item.value) return
  const key = `${pi}-${si}`
  if (timers.value[key]) { stopRestTimer(key); return }
  const s = item.value.training.perfomable_exercises[pi]?.sets[si]
  if (!s) return
  if (!s.done) {
    s.done = true
    const allSets = (item.value.training?.perfomable_exercises || []).flatMap((pe: any) => pe.sets || [])
    const anyNotDone = allSets.some((st: any) => !st.done)
    if (anyNotDone) startRestTimerFn(key, s.rest_duration || globalRest.value || 60)
    else finishWorkout()
  }
}

onMounted(() => { void loadItem() })
onUnmounted(() => {
  Object.values(timers.value || {}).forEach((t) => { if (t.intervalId) clearInterval(t.intervalId) })
  stopTimer()
})
</script>

<style scoped>
.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.back-btn { background: none; border: none; color: var(--ai-teal); font-size: 15px; font-weight: 700; cursor: pointer; padding: 0; }
.page-title { font-size: 18px; font-weight: 800; color: var(--ai-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hint-text { color: var(--ai-shadow); text-align: center; padding: 32px; font-size: 14px; }

.info-card { display: flex; flex-direction: column; gap: 10px; }
.info-row { display: flex; justify-content: space-between; align-items: center; }
.info-label { font-size: 13px; color: var(--ai-shadow); font-weight: 600; }
.info-val { font-size: 15px; font-weight: 700; color: var(--ai-text); }
.timer-val { font-size: 20px; color: var(--ai-teal); font-variant-numeric: tabular-nums; }
.rest-row { display: flex; align-items: center; gap: 10px; }
.ai-label { font-size: 12px; font-weight: 700; color: var(--ai-text); }
.ai-input-sm {
  padding: 7px 10px; border-radius: 10px; border: 2px solid #e8dcc8;
  background: rgba(255,255,255,0.8); color: var(--ai-text); font-size: 13px;
  font-family: 'Nunito', sans-serif; outline: none; width: 70px; text-align: center;
}
.ai-input-sm:focus { border-color: var(--ai-teal); }
.info-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.finish-btn { background: var(--ai-green); box-shadow: 0 4px 0 0 #4e8a1e; }
.finish-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 0 #4e8a1e; }
.ai-pill-btn.danger { color: #e05c5c; border-color: #e05c5c; }

.ex-block { display: flex; flex-direction: column; gap: 10px; }
.ex-header { display: flex; justify-content: space-between; align-items: center; }
.ex-name { font-size: 15px; font-weight: 700; color: var(--ai-text); }
.ex-count { font-size: 12px; color: var(--ai-shadow); }

.set-row {
  padding: 10px 12px; border-radius: 12px;
  background: rgba(255,255,255,0.5);
  display: flex; flex-direction: column; gap: 8px;
  transition: background 0.2s;
}
.set-row.done { background: rgba(111,186,44,0.1); }

.set-fields { display: flex; gap: 10px; }
.set-field { display: flex; flex-direction: column; gap: 2px; align-items: center; }
.rest-val { font-size: 14px; font-weight: 700; color: var(--ai-shadow); padding-top: 6px; }

.rest-timer {
  display: flex; align-items: center; gap: 10px;
  font-size: 14px; font-weight: 700; color: var(--ai-amber);
}
.skip-btn {
  background: none; border: 1px solid var(--ai-amber); color: var(--ai-amber);
  border-radius: 50px; padding: 4px 10px; font-size: 12px; font-weight: 700;
  font-family: 'Nunito', sans-serif; cursor: pointer;
}
.done-btn {
  width: 100%; padding: 10px; border-radius: 50px; border: 2px solid var(--ai-teal);
  background: transparent; color: var(--ai-teal); font-size: 14px; font-weight: 700;
  font-family: 'Nunito', sans-serif; cursor: pointer; transition: background 0.15s, color 0.15s;
}
.done-btn.completed {
  background: var(--ai-green); border-color: var(--ai-green); color: #fff;
  box-shadow: 0 3px 0 0 #4e8a1e;
}
.done-badge { font-size: 18px; color: var(--ai-green); font-weight: 700; align-self: flex-end; }

/* Dialog */
.ai-dialog {
  background: var(--ai-bg); border-radius: 24px; padding: 24px 20px;
  width: min(360px, 92vw); box-shadow: 0 8px 0 0 var(--ai-shadow);
  display: flex; flex-direction: column; gap: 10px;
}
.dialog-title { font-size: 20px; font-weight: 800; color: var(--ai-text); }
.ai-input {
  width: 100%; padding: 10px 14px; border-radius: 12px; border: 2px solid #e8dcc8;
  background: rgba(255,255,255,0.8); color: var(--ai-text); font-size: 14px;
  font-family: 'Nunito', sans-serif; outline: none; box-sizing: border-box;
}
.ai-input:focus { border-color: var(--ai-teal); }
.dialog-actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; margin-top: 4px; }

.finish-dialog { align-items: center; text-align: center; }
.finish-icon { font-size: 56px; }
.finish-time { font-size: 36px; font-weight: 800; color: var(--ai-teal); font-variant-numeric: tabular-nums; }
</style>
