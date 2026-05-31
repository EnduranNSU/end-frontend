<template>
  <q-page class="ai-page">
    <div class="page-header">
      <button class="back-btn" @click="router.back()">← Назад</button>
      <div class="page-title">Живой коуч</div>
    </div>

    <!-- Exercise picker -->
    <select v-if="!isRunning" class="exercise-select" v-model="selectedExercise">
      <option v-for="ex in exercises" :key="ex.value" :value="ex.value">{{ ex.label }}</option>
    </select>

    <!-- Status bar -->
    <div class="status-bar" :class="statusClass">
      <span class="status-icon">{{ statusIcon }}</span>
      <span class="status-text">{{ statusText }}</span>
    </div>
    <div v-if="hint" class="hint-banner">{{ hint }}</div>

    <!-- Video -->
    <div class="video-wrap" :style="{ '--border-color': labelColor }">
      <video ref="videoRef" autoplay playsinline muted class="video-feed" />
      <div v-if="!isRunning" class="video-overlay">
        <span style="font-size:48px">📷</span>
        <div class="overlay-text">Камера не активна</div>
      </div>
      <div v-if="isRunning && lastFrame" class="live-stats">
        <div v-if="lastFrame.knee_angle !== undefined">Колено: {{ lastFrame.knee_angle?.toFixed(0) }}°</div>
        <div v-if="lastFrame.elbow_angle !== undefined">Локоть: {{ lastFrame.elbow_angle?.toFixed(0) }}°</div>
        <div v-if="lastFrame.hip_angle !== undefined">Таз: {{ lastFrame.hip_angle?.toFixed(0) }}°</div>
        <div v-if="lastFrame.state">Фаза: {{ lastFrame.state === 'down' ? '↓' : '↑' }}</div>
      </div>
    </div>

    <!-- Controls -->
    <div class="controls">
      <button v-if="!isRunning" class="ai-pill-btn" :disabled="starting" @click="start">
        {{ starting ? '⏳ Подключение…' : 'Начать' }}
      </button>
      <template v-else>
        <button class="ai-pill-btn outline" @click="resetSet">Новый подход</button>
        <button class="ai-pill-btn outline danger" @click="stop">Стоп</button>
      </template>
    </div>

    <!-- Tips -->
    <div class="ai-card tips-card">
      <div class="tips-title">Как использовать</div>
      <ul class="tips-list">
        <li v-for="tip in currentTips" :key="tip">{{ tip }}</li>
      </ul>
    </div>

    <!-- Error -->
    <div v-if="wsError" class="error-banner">⚠️ {{ wsError }}</div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'

const router = useRouter()
const $q = useQuasar()

type ExOpt = { value: string; label: string }
const exercises = ref<ExOpt[]>([])

const FAMILY_TIPS: Record<string, string[]> = {
  squat:    ['Встаньте боком к камере', 'Расстояние 1.5–2 м', 'Угол колена <100° — хорошая глубина'],
  lunge:    ['Снимайте сбоку', 'Колено не за носок', 'Угол ~90° — правильная глубина'],
  deadlift: ['Снимайте сбоку', 'Спина нейтральная', 'Тяните грудью вверх'],
  pushup:   ['Снимайте сбоку', 'Тело держите прямым', 'Угол локтя <90° — достаточная глубина'],
  curl:     ['Снимайте спереди или сбоку', 'Локти прижаты к туловищу', 'Полностью разгибайте руки'],
}

const SLUG_FAMILY: Record<string, string> = {
  squat: 'squat', barbell_squat: 'squat', sumo_squat: 'squat', leg_press: 'squat',
  lunge: 'lunge', lunge_back: 'lunge', bulgarian_squat: 'lunge',
  deadlift: 'deadlift', romanian_deadlift: 'deadlift', barbell_row: 'deadlift',
  glute_bridge: 'deadlift', hyperextension: 'deadlift',
  pushup: 'pushup', bench_press: 'pushup', dumbbell_press: 'pushup',
  incline_press: 'pushup', shoulder_press: 'pushup', dips: 'pushup', tricep_extension: 'pushup',
  pullup: 'curl', lat_pulldown: 'curl', cable_row: 'curl', dumbbell_row: 'curl',
  bicep_curl: 'curl', hammer_curl: 'curl', upright_row: 'curl',
}

async function loadExercises() {
  try {
    const resp = await api.get('/cv/exercises')
    exercises.value = (resp.data as {slug: string; label: string}[]).map(e => ({ value: e.slug, label: e.label }))
    if (exercises.value.length && !selectedExercise.value) {
      selectedExercise.value = exercises.value[0]!.value
    }
  } catch {
    exercises.value = [
      { value: 'squat', label: 'Приседания' },
      { value: 'pushup', label: 'Отжимания' },
      { value: 'lunge', label: 'Выпады' },
      { value: 'deadlift', label: 'Становая тяга' },
    ]
    selectedExercise.value = 'squat'
  }
}

const selectedExercise = ref('')
const videoRef = ref<HTMLVideoElement | null>(null)
const isRunning = ref(false)
const starting = ref(false)
const reps = ref(0)
const label = ref<'OK' | 'BAD' | 'IDLE'>('IDLE')
const hint = ref('')
const wsError = ref('')
const lastFrame = ref<any | null>(null)

let ws: WebSocket | null = null
let stream: MediaStream | null = null
let frameInterval: number | undefined

const currentTips = computed(() => {
  const family = SLUG_FAMILY[selectedExercise.value] ?? 'squat'
  return FAMILY_TIPS[family] ?? FAMILY_TIPS['squat']!
})
const labelColor = computed(() => label.value === 'OK' ? '#6fba2c' : label.value === 'BAD' ? '#e05c5c' : '#bdaea0')

const statusClass = computed(() => ({
  'status-ok': label.value === 'OK',
  'status-bad': label.value === 'BAD',
  'status-idle': label.value === 'IDLE',
}))

const statusIcon = computed(() => {
  if (!isRunning.value) return '⭕'
  return label.value === 'OK' ? '✅' : label.value === 'BAD' ? '❌' : '⭕'
})

const statusText = computed(() => {
  if (!isRunning.value) return 'Нажмите «Начать»'
  return label.value === 'OK' ? 'Отлично!' : label.value === 'BAD' ? 'Исправьте технику' : 'Ожидание…'
})

function wsUrl() {
  const ex = selectedExercise.value
  return import.meta.env.DEV
    ? `ws://${window.location.host}/api/cv/ws/${ex}`
    : `ws://localhost:8001/cv/ws/${ex}`
}

async function start() {
  wsError.value = ''
  starting.value = true
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
    const v = videoRef.value!
    v.srcObject = stream
    await v.play()
    ws = new WebSocket(wsUrl())
    ws.binaryType = 'arraybuffer'
    ws.onopen = () => { isRunning.value = true; starting.value = false; startFrameLoop() }
    ws.onerror = () => { wsError.value = 'Ошибка подключения к серверу'; stop() }
    ws.onclose = (e) => { if (isRunning.value) { wsError.value = `Соединение прервано (${e.code})`; stop() } }
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string)
        if (data.error) { wsError.value = data.error; return }
        lastFrame.value = data
        reps.value = data.reps_total ?? reps.value
        label.value = data.label ?? 'IDLE'
        hint.value = data.hint ?? ''
      } catch { /* */ }
    }
  } catch (err: any) {
    starting.value = false
    if (err?.name === 'NotAllowedError') {
      $q.notify({ type: 'warning', message: 'Нет доступа к камере' })
    } else {
      $q.notify({ type: 'negative', message: 'Не удалось запустить камеру' })
    }
    cleanupStream()
  }
}

function startFrameLoop() {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  frameInterval = window.setInterval(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    const v = videoRef.value
    if (!v || !v.videoWidth) return
    canvas.width = v.videoWidth; canvas.height = v.videoHeight
    ctx.drawImage(v, 0, 0)
    canvas.toBlob((b) => b && b.arrayBuffer().then((buf) => ws!.send(buf)), 'image/jpeg', 0.65)
  }, 100)
}

function resetSet() { ws?.send(JSON.stringify({ cmd: 'reset' })); reps.value = 0; hint.value = ''; label.value = 'IDLE' }

function stop() {
  isRunning.value = false; starting.value = false
  if (frameInterval) { clearInterval(frameInterval); frameInterval = undefined }
  ws?.close(); ws = null; cleanupStream()
  label.value = 'IDLE'; hint.value = ''; lastFrame.value = null
}

function cleanupStream() {
  stream?.getTracks().forEach((t) => t.stop()); stream = null
  if (videoRef.value) videoRef.value.srcObject = null
}

onMounted(() => { void loadExercises() })
onUnmounted(() => { stop() })
</script>

<style scoped>
.page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.back-btn { background: none; border: none; color: var(--ai-teal); font-size: 15px; font-weight: 700; cursor: pointer; padding: 0; }
.page-title { font-size: 20px; font-weight: 800; color: var(--ai-text); }

.exercise-select {
  width: 100%;
  padding: 11px 14px;
  border-radius: 14px;
  border: 2px solid #e8dcc8;
  background: rgba(255,255,255,0.85);
  color: var(--ai-text);
  font-size: 15px;
  font-family: 'Nunito', sans-serif;
  font-weight: 700;
  outline: none;
  margin-bottom: 12px;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23b8a99a' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  cursor: pointer;
}
.exercise-select:focus { border-color: var(--ai-teal); }

.status-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; border-radius: 14px; margin-bottom: 6px;
  font-size: 15px; font-weight: 700;
}
.status-ok { background: rgba(111,186,44,0.15); color: #4e8a1e; }
.status-bad { background: rgba(224,92,92,0.15); color: #c13030; }
.status-idle { background: rgba(189,174,160,0.2); color: var(--ai-shadow); }
.status-icon { font-size: 20px; }
.status-text { flex: 1; }

.hint-banner {
  padding: 10px 14px; border-radius: 12px;
  background: rgba(240,166,41,0.15); color: #b87a0a;
  font-size: 14px; font-weight: 600; margin-bottom: 8px;
}

.video-wrap {
  position: relative; width: 100%; aspect-ratio: 4/3;
  border-radius: 20px; overflow: hidden; background: #111;
  border: 4px solid var(--border-color, #bdaea0);
  transition: border-color 0.3s; margin-bottom: 12px;
}
.video-feed { width: 100%; height: 100%; object-fit: cover; display: block; }
.video-overlay {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.55);
}
.overlay-text { color: #fff; font-size: 15px; font-weight: 600; margin-top: 8px; }

.live-stats {
  position: absolute; top: 8px; left: 8px;
  background: rgba(0,0,0,0.6); border-radius: 10px;
  padding: 8px 12px; color: #fff; font-size: 13px; line-height: 1.7;
}

.controls { display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
.ai-pill-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ai-pill-btn.danger { color: #e05c5c; border-color: #e05c5c; }

.tips-card { padding: 14px 16px; }
.tips-title { font-size: 15px; font-weight: 700; color: var(--ai-text); margin-bottom: 8px; }
.tips-list { margin: 0; padding-left: 18px; }
.tips-list li { font-size: 13px; color: var(--ai-text); line-height: 1.7; }

.error-banner {
  padding: 12px 16px; border-radius: 14px;
  background: rgba(224,92,92,0.15); color: #c13030;
  font-size: 14px; font-weight: 600; margin-top: 8px;
}
</style>
