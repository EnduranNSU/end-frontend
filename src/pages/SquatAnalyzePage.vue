<template>
  <q-page class="ai-page">
    <div class="page-header">
      <button class="back-btn" @click="router.back()">← Назад</button>
      <div class="page-title">Анализ техники</div>
    </div>

    <!-- Exercise picker -->
    <div class="ai-section-title">Упражнение</div>
    <div v-if="exercisesLoading" class="hint-text">Загрузка упражнений…</div>
    <select v-else class="exercise-select" v-model="selectedExercise" @change="result = null">
      <option v-for="ex in exercises" :key="ex.value" :value="ex.value">{{ ex.label }}</option>
    </select>

    <!-- Upload zone -->
    <div class="ai-section-title">Видео</div>
    <div class="ai-card upload-zone" :class="{ dragging }"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
      @click="fileInput?.click()"
    >
      <div class="upload-icon">🎥</div>
      <div class="upload-text">Нажми или перетащи видео</div>
      <div class="upload-hint">MP4, MOV · до 100 МБ</div>
      <input ref="fileInput" type="file" accept="video/*" style="display:none" @change="onFileChange" />
    </div>

    <div v-if="selectedFile" class="ai-card file-card">
      <span class="file-name">📹 {{ selectedFile.name }}</span>
      <span class="file-size">({{ (selectedFile.size / 1024 / 1024).toFixed(1) }} МБ)</span>
      <button class="clear-btn" @click.stop="clearFile">✕</button>
    </div>

    <button
      class="ai-pill-btn full"
      :disabled="!selectedFile || analyzing"
      @click="analyze"
    >
      {{ analyzing ? 'Анализируем…' : 'Анализировать' }}
    </button>

    <!-- Results -->
    <template v-if="result">
      <div class="ai-section-title">Результат</div>
      <div class="ai-card">
        <div class="verdict">{{ result.verdict }}</div>
      </div>

      <div class="ai-card stats-card">
        <div class="stat" v-if="result.frames_total">
          <div class="stat-val">{{ result.frames_total }}</div>
          <div class="stat-lbl">Кадров</div>
        </div>
        <div class="stat" v-if="result.frames_with_pose">
          <div class="stat-val">{{ result.frames_with_pose }}</div>
          <div class="stat-lbl">С позой</div>
        </div>
        <template v-if="result.exercise === 'squat'">
          <div class="stat">
            <div class="stat-val">{{ result.avg_min_knee_angle?.toFixed(1) ?? '—' }}°</div>
            <div class="stat-lbl">Угол колена</div>
          </div>
          <div class="stat">
            <div class="stat-val" :class="result.depth_ratio > 0.8 ? 'good' : 'bad'">{{ pct(result.depth_ratio) }}</div>
            <div class="stat-lbl">Глубина ОК</div>
          </div>
          <div class="stat">
            <div class="stat-val" :class="result.knee_collapse_ratio > 0.2 ? 'bad' : 'good'">{{ pct(result.knee_collapse_ratio) }}</div>
            <div class="stat-lbl">Завал колена</div>
          </div>
        </template>
        <template v-if="result.exercise !== 'squat' && result.extra_metrics">
          <div class="stat" v-if="result.extra_metrics.avg_primary_angle != null">
            <div class="stat-val">{{ result.extra_metrics.avg_primary_angle?.toFixed(1) }}°</div>
            <div class="stat-lbl">Ср. угол</div>
          </div>
          <div class="stat" v-if="result.extra_metrics.bad_frame_ratio !== undefined">
            <div class="stat-val" :class="result.extra_metrics.bad_frame_ratio > 0.3 ? 'bad' : 'good'">
              {{ pct(result.extra_metrics.bad_frame_ratio) }}
            </div>
            <div class="stat-lbl">Ошибок</div>
          </div>
        </template>
      </div>

    </template>

    <BottomNavBar v-model="activeTab" @navigate="onNavigate" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { pct } from 'src/utils/chat'
import { api } from 'src/boot/axios'
import { useQuasar } from 'quasar'
import BottomNavBar from 'src/components/BottomNavBar.vue'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()

const activeTab = ref('add')

function onNavigate(key: string) {
  const map: Record<string, string> = {
    chat: '/coach', history: '/history', add: '/mainPage',
    exercises: '/exercises', profile: '/profile',
  }
  const to = map[key] || '/mainPage'
  if (route.path !== to) void router.push(to)
}

type ExerciseOption = { value: string; label: string }

const exercises = ref<ExerciseOption[]>([])
const exercisesLoading = ref(false)
const selectedExercise = ref('')

async function fetchExercises() {
  exercisesLoading.value = true
  try {
    const resp = await api.get('/cv/exercises')
    const data: { slug: string; label: string }[] = resp.data || []
    exercises.value = data.map((e) => ({ value: e.slug, label: e.label }))
    if (exercises.value.length) selectedExercise.value = exercises.value[0]!.value
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось загрузить список упражнений' })
  } finally {
    exercisesLoading.value = false
  }
}

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const dragging = ref(false)
const analyzing = ref(false)
const result = ref<any | null>(null)


function onFileChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) { selectedFile.value = f; result.value = null }
  ;(e.target as HTMLInputElement).value = ''
}

function onDrop(e: DragEvent) {
  dragging.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f?.type.startsWith('video/')) { selectedFile.value = f; result.value = null }
}

function clearFile() { selectedFile.value = null; result.value = null }


async function analyze() {
  if (!selectedFile.value) return
  analyzing.value = true
  try {
    const fd = new FormData()
    fd.append('video', selectedFile.value, selectedFile.value.name)
    const resp = await api.post(`/cv/analyze?exercise=${selectedExercise.value}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })
    result.value = resp.data
  } catch (err: any) {
    $q.notify({ type: 'negative', message: 'Ошибка анализа: ' + (err?.response?.data?.detail || err?.message || 'неизвестно') })
  } finally {
    analyzing.value = false
  }
}

onMounted(() => { void fetchExercises() })
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.back-btn {
  background: none;
  border: none;
  color: var(--ai-teal);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}

.page-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--ai-text);
}

.hint-text {
  color: var(--ai-shadow);
  font-size: 14px;
  margin-bottom: 8px;
}

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
  margin-bottom: 8px;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23b8a99a' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  cursor: pointer;
}

.exercise-select:focus {
  border-color: var(--ai-teal);
}

.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  cursor: pointer;
  border: 3px dashed #e8dcc8;
  background: rgba(255,255,255,0.5) !important;
  transition: border-color 0.2s, background 0.2s;
  margin-bottom: 10px;
}

.upload-zone.dragging {
  border-color: var(--ai-teal);
  background: rgba(25,200,185,0.08) !important;
}

.upload-icon { font-size: 40px; margin-bottom: 8px; }

.upload-text {
  font-size: 15px;
  font-weight: 700;
  color: var(--ai-text);
}

.upload-hint {
  font-size: 12px;
  color: var(--ai-shadow);
  margin-top: 4px;
}

.file-card {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.file-name { font-weight: 700; font-size: 14px; color: var(--ai-text); }
.file-size { font-size: 12px; color: var(--ai-shadow); }

.clear-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--ai-shadow);
  font-size: 16px;
  cursor: pointer;
  padding: 0;
}

.ai-pill-btn.full {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  margin-bottom: 4px;
}

.ai-pill-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.verdict {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--ai-text);
}

.stats-card {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.stat {
  text-align: center;
  padding: 10px 4px;
  background: rgba(255,255,255,0.5);
  border-radius: 12px;
}

.stat-val {
  font-size: 20px;
  font-weight: 800;
  color: var(--ai-teal);
}

.stat-lbl {
  font-size: 11px;
  color: var(--ai-shadow);
  margin-top: 3px;
}

.good { color: var(--ai-green) !important; }
.bad { color: #e05c5c !important; }

</style>
