<template>
  <q-page class="q-pa-md page-with-nav">
    <div class="row items-center q-mb-md">
      <q-btn dense flat round icon="arrow_back" @click="goBack" />
      <div class="text-h6 text-weight-medium q-ml-sm">{{ item?.training?.title || 'Выполненная тренировка' }}</div>
    </div>

    <q-card flat bordered class="q-pa-md rounded-card" v-if="loading">
      <div class="text-center">Загрузка...</div>
    </q-card>

    <q-card flat bordered class="q-pa-md rounded-card" v-else-if="!item">
      <div class="text-center">Тренировка не найдена.</div>
    </q-card>

    <div v-else>
      <q-card flat bordered class="q-pa-md rounded-card q-mb-md">
        <div class="row items-center">
          <div class="col">
            <div class="text-subtitle1">Дата: {{ item.date || '—' }}</div>
            <div class="text-caption q-mt-sm">Название: {{ item.training?.title || '—' }}</div>
          </div>
          <div class="col-auto" v-if="inProgress">
            <div class="text-h6">{{ formatElapsed(elapsed) }}</div>
          </div>
        </div>
        <div v-if="inProgress" class="q-mt-sm row items-center">
          <div class="col-6">
            <q-input dense type="number" v-model.number="globalRest" label="Отдых между сетами (сек)"
              @change="applyGlobalRest" />
          </div>
          <div class="col-6 text-caption">Установите общий отдых, он будет применён ко всем сетам</div>
        </div>
        <div class="q-mt-md">
          <q-btn dense flat label="Редактировать" color="primary" @click="openEdit" v-if="!inProgress" />
          <q-btn dense flat label="Удалить" color="negative" @click="confirmDelete" class="q-ml-sm"
            v-if="!inProgress" />
          <q-btn dense color="primary" label="Закончить тренировку" @click="finishWorkout" v-if="inProgress" />
        </div>
      </q-card>

      <div v-for="(pe, idx) in item.training?.perfomable_exercises || []" :key="idx" class="q-mb-sm">
        <q-card flat bordered class="q-pa-sm">
          <div class="row items-center q-mb-sm">
            <div class="col">
              <div class="text-weight-medium">{{ pe.exercise?.title || 'Упражнение' }}</div>
              <div class="text-caption text-grey-7">Тегов: {{ (pe.exercise?.tags || []).join(', ') }}</div>
            </div>
            <div class="col-auto">
              <div class="text-caption">Сетов: {{ (pe.sets || []).length }}</div>
            </div>
          </div>

          <div v-for="(s, sIdx) in pe.sets || []" :key="sIdx" class="q-mb-sm q-pa-sm"
            style="border-top:1px dashed var(--q-color-grey-3)">
            <div class="row items-center q-gutter-sm">
              <div class="col-3">
                <q-input dense type="number" v-model.number="s.repetitions" label="reps" />
              </div>
              <div class="col-3">
                <q-input dense type="number" v-model.number="s.weight" label="kg" />
              </div>
              <div class="col">
                <div class="text-caption">rest: {{ s.rest_duration || 60 }}s</div>
              </div>
              <div class="col-auto">
                <q-btn dense color="positive" icon="check" :flat="!isSetDone(idx, sIdx)" @click="markSetDone(idx, sIdx)"
                  :label="isSetDone(idx, sIdx) ? 'Done' : 'Done'" />
              </div>
            </div>

            <div class="row items-center q-mt-sm">
              <div class="col-auto">
                <q-chip dense color="green" text-color="white" v-if="isSetDone(idx, sIdx)">Выполнен</q-chip>
              </div>
              <div class="col">
                <div class="text-caption">
                  <span v-if="getTimer(idx, sIdx) && getTimer(idx, sIdx).running">Осталось отдыха: {{
                    getTimer(idx,sIdx).remaining }} с</span>
                  <span v-else>Отдых: {{ s.rest_duration || 60 }} с</span>
                </div>
              </div>
            </div>
          </div>
        </q-card>
      </div>
    </div>

    <!-- Edit dialog (simple) -->
    <q-dialog v-model="editDialog">
      <q-card style="min-width:320px; max-width:92vw">
        <q-card-section>
          <div class="text-h6">Редактировать выполнение</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="saveUpdate">
            <div class="q-gutter-md">
              <q-input v-model="editModel.date" label="Дата" dense />
              <q-input v-model="editModel.training.title" label="Название" dense />
              <div class="row q-justify-end q-mt-md">
                <q-btn flat label="Отмена" color="grey" v-close-popup @click="() => (editDialog = false)" />
                <q-btn color="primary" label="Сохранить" type="submit" />
              </div>
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Finish workout dialog -->
    <q-dialog v-model="finishDialog">
      <q-card style="min-width:320px; max-width:92vw">
        <q-card-section>
          <div class="text-h6">Поздравляем!</div>
        </q-card-section>
        <q-card-section>
          <div class="text-subtitle1 text-center q-mb-md">Вы завершили тренировку</div>
          <div class="text-h5 text-center text-weight-bold q-mb-md">{{ finishDialogTime }}</div>
          <div class="row q-justify-end q-mt-md q-gutter-sm">
            <q-btn flat label="Отмена" color="grey" @click="onFinishDialogCancel" />
            <q-btn color="positive" label="Готово" @click="onFinishDialogOk" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from 'src/boot/axios'
import { useQuasar } from 'quasar'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const item = ref<any | null>(null)
const loading = ref(true)
const editDialog = ref(false)
const editModel = ref<any>({ date: '', training: { title: '' } })
const finishDialog = ref(false)
const finishDialogTime = ref('')
// in-progress session state
const inProgress = ref(false)
const elapsed = ref(0)
let timerId: number | null = null
// global rest (seconds) editable by user before marking sets done
const globalRest = ref<number>(60)
// per-set timers keyed by "peIdx-setIdx" (reactive)
const timers = ref<Record<string, { remaining: number; intervalId: number | null; running: boolean }>>({})

async function loadItem() {
  loading.value = true
  // if mode=inprogress and plannedId present, load planned training and start timer
  const mode = String(route.query.mode || '')
  const plannedId = Number(route.query.plannedId || 0)
  const id = Number(route.query.id || route.params.id)

  if (mode === 'inprogress' && plannedId) {
    try {
      // fetch planned training and use it as the in-memory item until finished
      const resp = await api.get(`/training/planned/${plannedId}`)
      const planned = resp.data
      const today = new Date().toISOString().split('T')[0]
      item.value = { date: today, weekdays: planned.weekdays || [], training: planned.training || { title: '', perfomable_exercises: [] } }
      // set default global rest from first set if present
      try {
        const firstPe = item.value.training.perfomable_exercises?.[0]
        const firstSet = firstPe?.sets?.[0]
        if (firstSet && Number(firstSet.rest_duration)) globalRest.value = Number(firstSet.rest_duration)
      } catch (e) { /* ignore */ }
      inProgress.value = true
      startTimer()
    } catch (err) {
      console.error('Failed to load planned for in-progress', err)
      $q.notify({ type: 'negative', message: 'Не удалось загрузить запланированную тренировку' })
      void router.push('/mainPage')
    } finally {
      loading.value = false
    }
    return
  }

  if (!id) {
    $q.notify({ type: 'negative', message: 'Не указан id' })
    void router.push('/performedTrainings')
    loading.value = false
    return
  }

  try {
    const resp = await api.get(`/training/user_performed/${id}`)
    item.value = resp.data || null
  } catch (err) {
    console.error('Failed to load performed', err)
    $q.notify({ type: 'negative', message: 'Не удалось загрузить' })
    item.value = null
  } finally {
    loading.value = false
  }
}

function startTimer() {
  // start elapsed timer
  if (timerId) return
  timerId = window.setInterval(() => { elapsed.value += 1 }, 1000)
}

function stopTimer() {
  if (timerId) { window.clearInterval(timerId); timerId = null }
}

function applyGlobalRest() {
  // apply global rest value to all sets
  if (!item.value || !item.value.training?.perfomable_exercises) return
  const r = Number(globalRest.value || 0)
  item.value.training.perfomable_exercises.forEach((pe: any) => {
    if (Array.isArray(pe.sets)) pe.sets.forEach((s: any) => { s.rest_duration = r })
  })
}

function startRestTimer(key: string, duration: number) {
  // clear existing
  if (timers.value[key] && timers.value[key].intervalId) {
    window.clearInterval(timers.value[key].intervalId!)
  }
  // assign reactively
  timers.value[key] = { remaining: duration, intervalId: null, running: true }
  timers.value[key].intervalId = window.setInterval(() => {
    if (!timers.value[key]) return
    timers.value[key].remaining -= 1
    if (timers.value[key].remaining <= 0) {
      if (timers.value[key].intervalId) { window.clearInterval(timers.value[key].intervalId) }
      timers.value[key].running = false
      timers.value[key].intervalId = null
    }
  }, 1000)
}

function stopRestTimer(key: string) {
  const t = timers.value[key]
  if (!t) return
  if (t.intervalId) {
    window.clearInterval(t.intervalId)
  }
  t.running = false
  t.remaining = 0
  t.intervalId = null
  // remove timer entry so template falls back to static rest display
  try { delete timers.value[key] } catch (e) { timers.value[key] = t }
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
    const payload = { date: editModel.value.date, training: { title: editModel.value.training?.title || '' } }
    const resp = await api.post(`/training/user_performed/update/${id}`, payload)
    item.value = resp.data || item.value
    $q.notify({ type: 'positive', message: 'Сохранено' })
    editDialog.value = false
  } catch (err) {
    console.error('Update failed', err)
    $q.notify({ type: 'negative', message: 'Ошибка при сохранении' })
  }
}

async function confirmDelete() {
  const id = Number(route.query.id || route.params.id)
  if (!id) return
  $q.dialog({
    title: 'Подтвердите',
    message: 'Удалить запись?',
    cancel: true
  }).onOk(async () => {
    try {
      await api.post(`/training/user_performed/delete/${id}`)
      $q.notify({ type: 'positive', message: 'Удалено' })
      void router.push('/performedTrainings')
    } catch (err) {
      console.error('Delete failed', err)
      $q.notify({ type: 'negative', message: 'Ошибка при удалении' })
    }
  })
}

onMounted(() => { void loadItem() })

onUnmounted(() => {
  // clear any running timers
  Object.values(timers.value || {}).forEach((t) => { if (t.intervalId) window.clearInterval(t.intervalId) })
  stopTimer()
})

// finish in-progress workout: show dialog with elapsed time, then create on server
function finishWorkout() {
  if (!inProgress.value || !item.value) return
  stopTimer()
  finishDialogTime.value = formatElapsed(elapsed.value)
  finishDialog.value = true
}

function onFinishDialogOk() {
  finishDialog.value = false
  void continueFinish()
}

function onFinishDialogCancel() {
  finishDialog.value = false
  startTimer()
}

// separate function to handle create after dialog confirms
async function continueFinish() {
  if (!item.value) return
  // build create payload and send to server
  try {
    const perf = (item.value.training?.perfomable_exercises || []).map((pe: any) => ({
      exercise_id: Number(pe.exercise?.id ?? pe.exercise_id ?? 0),
      sets: (pe.sets || []).map((s: any) => ({ weight: Number(s.weight || 0), repetitions: Number(s.repetitions || 0), rest_duration: Number(s.rest_duration || 0) })),
    }))
    const payload = {
      date: item.value.date || new Date().toISOString().split('T')[0],
      weekdays: item.value.weekdays || [],
      training: {
        title: item.value.training?.title || '',
        perfomable_exercises: perf,
      },
    }
    const resp = await api.post('/training/user_performed/create', payload)
    const created = resp.data
    if (created && created.id) {
      // set created item locally and update route query to id
      item.value = created
      inProgress.value = false
      elapsed.value = 0
      $q.notify({ type: 'positive', message: 'Тренировка сохранена' })
      void router.replace({ path: '/performedTraining', query: { id: String(created.id) } })
    } else {
      $q.notify({ type: 'positive', message: 'Тренировка сохранена' })
      inProgress.value = false
    }
  } catch (err) {
    console.error('Create performed failed', err)
    $q.notify({ type: 'negative', message: 'Не удалось сохранить выполненную тренировку' })
    // resume timer so user can try again
    startTimer()
  }
}

function formatElapsed(sec: number) {
  const s = Math.max(0, Math.floor(sec))
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
}

function isSetDone(peIdx: number, setIdx: number) {
  try {
    return Boolean(item.value.training.perfomable_exercises[peIdx].sets[setIdx].done)
  } catch (e) {
    return false
  }
}

function getTimer(peIdx: number, setIdx: number) {
  return timers.value[`${peIdx}-${setIdx}`]
}

async function markSetDone(peIdx: number, setIdx: number) {
  if (!item.value) return
  const s = item.value.training.perfomable_exercises[peIdx].sets[setIdx]
  if (!s) return

  const key = `${peIdx}-${setIdx}`
  // if timer is already running for this set and user presses Done again -> stop rest immediately
  if (timers.value[key]) {
    // stop regardless of running flag to be robust
    stopRestTimer(key)
    return
  }

  // if not yet marked done -> mark done and start rest (or finish if last)
  if (!s.done) {
    s.done = true

    // if this was the last remaining unfinished set -> finish workout automatically
    const allSets = (item.value.training?.perfomable_exercises || []).flatMap((pe: any) => (pe.sets || []))
    const anyNotDone = allSets.some((st: any) => !st.done)
    if (!anyNotDone) {
      // stop elapsed timer and trigger finish flow immediately
      stopTimer()
      await finishWorkout()
      return
    }

    // start rest timer for this set using its rest_duration or globalRest
    const rest = Number(s.rest_duration ?? globalRest.value ?? 60)
    startRestTimer(key, rest)
  }
}
</script>

<style scoped>
.page-with-nav {
  padding-bottom: 88px
}
</style>
