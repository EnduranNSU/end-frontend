<template>
  <q-page class="ai-page">
    <div class="page-header">
      <button class="back-btn" @click="router.back()">← Назад</button>
      <div class="page-title">{{ exercise?.title || 'Упражнение' }}</div>
    </div>

    <div v-if="loading" class="hint-text">Загрузка…</div>

    <template v-else-if="exercise">
      <!-- YouTube link -->
      <a
        v-if="videoSrc"
        :href="videoSrc"
        target="_blank"
        rel="noopener"
        class="yt-link"
      >
        <span class="yt-icon">▶</span>
        Смотреть технику на YouTube
      </a>
      <div v-else class="yt-link yt-disabled">
        <span class="yt-icon">▶</span>
        Видео недоступно
      </div>

      <!-- Tags -->
      <div v-if="exercise.tags?.length" class="tags-wrap">
        <span v-for="t in exercise.tags" :key="t" class="tag">{{ tagLabel(t) }}</span>
      </div>

      <!-- Description -->
      <div class="ai-section-title">Описание</div>
      <div class="ai-card desc-card" :class="{ collapsed: !descExpanded }">
        <div class="desc-text">
          <p v-for="(para, i) in paragraphs" :key="i">{{ para }}</p>
          <p v-if="!paragraphs.length">Описание отсутствует.</p>
        </div>
      </div>
      <button class="expand-btn" @click="descExpanded = !descExpanded">
        {{ descExpanded ? 'Свернуть ↑' : 'Читать полностью ↓' }}
      </button>

      <!-- CTA -->
      <button class="ai-pill-btn coach-btn" @click="goToCoach">
        Спросить коуча
      </button>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from 'src/boot/axios'
import { useQuasar } from 'quasar'
import { tagLabel } from 'src/utils/tags'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const exercise = ref<any | null>(null)
const videoSrc = ref<string | undefined>(undefined)
const loading = ref(true)
const descExpanded = ref(false)

const paragraphs = computed(() =>
  (exercise.value?.description || '')
    .split(/\n+/)
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0)
)

async function loadExercise() {
  const id = Number(route.query.id || route.params.id)
  if (!id) { void router.push('/exercises'); return }
  try {
    const resp = await api.get(`/exercise/${id}`)
    const data = resp.data || {}
    exercise.value = data
    const href = Array.isArray(data.hrefs) && data.hrefs.length
      ? data.hrefs.find((h: string) => h?.trim())
      : undefined
    videoSrc.value = href
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось загрузить упражнение' })
    void router.push('/exercises')
  } finally {
    loading.value = false
  }
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function goToCoach() {
  void router.push({ path: '/coach', query: { chat_id: uuidv4(), exercise_id: String(exercise.value?.id || 0) } })
}

onMounted(() => { void loadExercise() })
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
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

.page-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--ai-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hint-text { color: var(--ai-shadow); text-align: center; padding: 32px; font-size: 14px; }

.yt-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: rgba(255,255,255,0.8);
  border-radius: var(--ai-radius);
  box-shadow: 0 4px 0 0 var(--ai-shadow);
  text-decoration: none;
  color: var(--ai-text);
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 12px;
}

.yt-disabled {
  opacity: 0.45;
  cursor: default;
}

.yt-icon {
  width: 32px;
  height: 32px;
  background: red;
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.tag {
  padding: 4px 12px;
  background: rgba(25,200,185,0.15);
  border-radius: 50px;
  font-size: 12px;
  font-weight: 700;
  color: var(--ai-teal);
}

.desc-card {
  position: relative;
  max-height: none;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.desc-card.collapsed {
  max-height: 140px;
  -webkit-mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
  mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
}

.desc-text p {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--ai-text);
}

.expand-btn {
  width: 100%;
  background: none;
  border: none;
  color: var(--ai-teal);
  font-size: 14px;
  font-weight: 700;
  font-family: 'Nunito', sans-serif;
  cursor: pointer;
  padding: 8px 0;
  text-align: center;
  margin-bottom: 8px;
}

.coach-btn {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  background: var(--ai-amber);
  box-shadow: 0 5px 0 0 #c8841a;
  margin-top: 8px;
}

.coach-btn:active {
  transform: translateY(3px);
  box-shadow: 0 2px 0 0 #c8841a;
}
</style>
