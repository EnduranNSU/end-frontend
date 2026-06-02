<template>
  <q-page class="ai-page">
    <div v-if="showDraftAdd" class="draft-header">
      <button class="back-btn" @click="goBackToDraft">← Назад</button>
      <div class="draft-title">Выберите упражнения</div>
      <button class="cancel-draft-btn" @click="cancelDraft">Отмена</button>
    </div>
    <div v-else class="ai-section-title" style="margin-top:0">Упражнения</div>

    <!-- Search + AI toggle -->
    <div class="search-row">
      <input
        v-model="exerciseQuery"
        class="ai-input search-input"
        :placeholder="ragMode ? 'AI-поиск…' : 'Поиск по названию'"
        @keyup.enter="ragMode ? doRagSearch() : undefined"
      />
      <button v-if="ragMode" class="ai-pill-btn icon-btn" :disabled="ragLoading || !exerciseQuery.trim()" @click="doRagSearch">
        {{ ragLoading ? '⏳' : '🔍' }}
      </button>
    </div>

    <div class="toggle-row">
      <label class="toggle-label">
        <div class="toggle-switch" :class="{ on: ragMode }" @click="ragMode = !ragMode">
          <div class="toggle-knob" />
        </div>
        🤖 AI-поиск
      </label>
      <div v-if="!ragMode">
        <select v-model="selectedTag" class="ai-select">
          <option value="">Все категории</option>
          <option v-for="t in tags" :key="t" :value="t">{{ tagLabel(t) }}</option>
        </select>
      </div>
    </div>

    <!-- Exercise grid -->
    <div v-if="loading" class="hint-text">Загрузка упражнений…</div>
    <div v-else-if="!displayedExercises.length" class="hint-text">
      {{ ragMode && ragResults !== null ? 'Ничего не найдено' : 'Список пуст' }}
    </div>
    <div v-else class="ex-grid">
      <div
        v-for="ex in displayedExercises" :key="ex.id"
        class="ai-card ex-card"
        @click="openExercise(ex.id)"
      >
        <div class="ex-title">{{ ex.title }}</div>
        <div v-if="(ex as any).score" class="ex-score">
          {{ (((ex as any).score) * 100).toFixed(0) }}% совпадение
        </div>
        <button v-if="showDraftAdd" class="add-btn" @click.stop="onAddClick(ex.id)">+</button>
      </div>
    </div>

    <!-- Add to draft dialog -->
    <q-dialog v-model="addDialog">
      <div class="ai-dialog">
        <div class="dialog-title">Добавить упражнение</div>
        <div class="dialog-ex">{{ exercises.find(e => e.id === addExerciseId)?.title }}</div>

        <div v-for="(s, i) in addSets" :key="i" class="set-row">
          <div class="set-field">
            <label class="ai-label">Повторы</label>
            <input v-model.number="s.repetitions" type="number" class="ai-input" />
          </div>
          <div class="set-field">
            <label class="ai-label">Вес (кг)</label>
            <input v-model.number="s.weight" type="number" class="ai-input" />
          </div>
          <button class="remove-btn" @click="removeAddSet(i)">✕</button>
        </div>

        <button class="ai-pill-btn outline small-btn" @click="pushAddSet">+ Сет</button>

        <div class="dialog-actions">
          <button class="ai-pill-btn outline" @click="addDialog = false">Отмена</button>
          <button class="ai-pill-btn" @click="confirmAddToDraft">Добавить</button>
        </div>
      </div>
    </q-dialog>

    <BottomNavBar v-if="!showDraftAdd" v-model="activeTab" @navigate="onNavigate" />
  </q-page>
</template>

<script setup lang="ts">
import BottomNavBar from 'src/components/BottomNavBar.vue'
import { usePlannedDraftStore } from 'src/stores/plannedDraft'
import { computed, ref, watch, onMounted } from 'vue'
import { api } from 'src/boot/axios'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { tagLabel } from 'src/utils/tags'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const activeTab = ref('exercises')

function syncTab() {
  const p = route.path
  if (p.endsWith('/history')) activeTab.value = 'history'
  else if (p.endsWith('/exercises')) activeTab.value = 'exercises'
  else if (p.endsWith('/profile')) activeTab.value = 'profile'
  else if (p.endsWith('/coach')) activeTab.value = 'chat'
  else activeTab.value = 'add'
}
syncTab()
watch(() => route.path, syncTab)

function onNavigate(key: string) {
  const map: Record<string, string> = {
    chat: '/coach', history: '/history', add: '/mainPage',
    exercises: '/exercises', profile: '/profile',
  }
  const to = map[key] || '/mainPage'
  if (route.path !== to) void router.push(to)
}

type ApiExercise = { id: number; title: string; tags: string[] }

const exercises = ref<ApiExercise[]>([])
const exerciseQuery = ref('')
const loading = ref(false)
const ragMode = ref(false)
const ragLoading = ref(false)
const ragResults = ref<ApiExercise[] | null>(null)
const tags = ref<string[]>([])
const selectedTag = ref('')

async function fetchAllExercises() {
  loading.value = true
  try {
    const resp = await api.get<ApiExercise[]>('/exercise/')
    exercises.value = resp.data || []
    const set = new Set<string>()
    exercises.value.forEach((e) => e.tags?.forEach((t) => set.add(t)))
    tags.value = [...set].sort()
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось загрузить упражнения' })
  } finally {
    loading.value = false
  }
}

const filteredExercises = computed(() => {
  const q = exerciseQuery.value.trim().toLowerCase()
  return exercises.value.filter((ex) => {
    const matchText = !q || ex.title.toLowerCase().includes(q)
    const matchTag = !selectedTag.value || ex.tags?.includes(selectedTag.value)
    return matchText && matchTag
  })
})

const displayedExercises = computed(() =>
  ragMode.value && ragResults.value !== null ? ragResults.value : filteredExercises.value
)

async function doRagSearch() {
  const q = exerciseQuery.value.trim()
  if (!q) return
  ragLoading.value = true
  try {
    const resp = await api.post('/search/exercise/', { rag_name: 'exercises', query: q, limit: 10, tags: [] })
    const hits: any[] = resp.data?.results ?? []
    const bestScore = new Map<number, number>()
    for (const h of hits) {
      const exerciseTitle: string = h.payload?.tags?.[0]
      if (!exerciseTitle) continue
      const ex = exercises.value.find((e) => e.title === exerciseTitle)
      if (!ex) continue
      if ((bestScore.get(ex.id) ?? -1) < h.score) bestScore.set(ex.id, h.score)
    }
    ragResults.value = [...bestScore.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id, score]) => {
        const ex = exercises.value.find((e) => e.id === id)
        return ex ? { ...ex, score } : null
      })
      .filter(Boolean) as any[]
  } catch {
    $q.notify({ type: 'negative', message: 'Ошибка AI-поиска' })
    ragResults.value = []
  } finally {
    ragLoading.value = false
  }
}

watch(ragMode, (v) => { if (!v) ragResults.value = null })

const draftStore = usePlannedDraftStore()
const showDraftAdd = computed(() => Boolean(draftStore.draft) || route.query.fromDraft === '1')

const addDialog = ref(false)
const addExerciseId = ref<number | null>(null)
const addSets = ref<{ repetitions: number; weight: number }[]>([])

function onAddClick(id: number) {
  addExerciseId.value = id
  addSets.value = [{ repetitions: 8, weight: 0 }]
  addDialog.value = true
}

function pushAddSet() { addSets.value.push({ repetitions: 8, weight: 0 }) }
function removeAddSet(i: number) { addSets.value.splice(i, 1) }

async function confirmAddToDraft() {
  if (!addExerciseId.value) return
  draftStore.startDraft(draftStore.draft ?? { weekdays: [], training: { title: '', perfomable_exercises: [] } })
  draftStore.addExercise(addExerciseId.value, addSets.value.map((s) => ({
    weight: Number(s.weight), repetitions: Number(s.repetitions), rest_duration: 60,
  })))
  await router.push({ path: '/mainPage', query: { openCreate: '1' } })
}

function openExercise(id: number) {
  void router.push({ path: '/exercisePage', query: { id: String(id) } })
}

function goBackToDraft() {
  void router.push({ path: '/mainPage', query: { openCreate: '1' } })
}

function cancelDraft() {
  draftStore.clearDraft()
  void router.push('/mainPage')
}

onMounted(() => { void fetchAllExercises() })
</script>

<style scoped>
.search-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.search-input { flex: 1; }

.icon-btn { padding: 10px 14px; flex-shrink: 0; }

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--ai-text);
  cursor: pointer;
  user-select: none;
}

.toggle-switch {
  width: 44px;
  height: 24px;
  border-radius: 50px;
  background: #e8dcc8;
  position: relative;
  transition: background 0.2s;
  cursor: pointer;
}

.toggle-switch.on { background: var(--ai-teal); }

.toggle-knob {
  position: absolute;
  top: 3px; left: 3px;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}

.toggle-switch.on .toggle-knob { transform: translateX(20px); }

.ai-select {
  padding: 8px 14px;
  border-radius: 14px;
  border: 2px solid #e8dcc8;
  background: rgba(255,255,255,0.8);
  color: var(--ai-text);
  font-size: 13px;
  font-family: 'Nunito', sans-serif;
  outline: none;
}

.draft-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e8dcc8;
}

.back-btn {
  background: none;
  border: none;
  color: var(--ai-teal);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.draft-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--ai-text);
  flex: 1;
}

.cancel-draft-btn {
  background: none;
  border: none;
  color: #e05c5c;
  font-size: 14px;
  font-weight: 700;
  font-family: 'Nunito', sans-serif;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.hint-text { color: var(--ai-shadow); font-size: 14px; text-align: center; padding: 24px; }

.ex-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 8px;
}

.ex-card {
  cursor: pointer;
  position: relative;
  padding: 14px;
  transition: transform 0.1s;
}

.ex-card:active { transform: scale(0.97); }

.ex-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--ai-text);
  line-height: 1.3;
}

.ex-score {
  font-size: 11px;
  color: var(--ai-teal);
  margin-top: 4px;
  font-weight: 600;
}

.add-btn {
  position: absolute;
  top: 8px; right: 8px;
  width: 24px; height: 24px;
  border-radius: 50%;
  border: none;
  background: var(--ai-teal);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
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

.dialog-title { font-size: 20px; font-weight: 800; color: var(--ai-text); }
.dialog-ex { font-size: 15px; font-weight: 700; color: var(--ai-teal); }

.set-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.set-field { flex: 1; display: flex; flex-direction: column; gap: 2px; }

.ai-label { font-size: 12px; font-weight: 700; color: var(--ai-text); }

.ai-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 2px solid #e8dcc8;
  background: rgba(255,255,255,0.8);
  color: var(--ai-text);
  font-size: 14px;
  font-family: 'Nunito', sans-serif;
  outline: none;
  box-sizing: border-box;
}

.ai-input:focus { border-color: var(--ai-teal); }

.remove-btn {
  background: none;
  border: none;
  color: #e05c5c;
  font-size: 18px;
  cursor: pointer;
  padding: 8px 4px;
  align-self: flex-end;
}

.small-btn { padding: 8px 16px; font-size: 13px; align-self: flex-start; }

.dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
}
</style>
