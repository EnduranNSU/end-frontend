<template>
  <q-page class="q-pa-md">
    <div class="exercise-header q-mb-md">
      <q-btn class="back-btn" dense flat round icon="arrow_back" @click="goBack" aria-label="Назад" />
      <div class="exercise-title">{{ exercise?.title || 'Упражнение' }}</div>
    </div>

    <div>
      <ExerciseDetail :videoSrc="videoSrc" :instruction="exercise?.description" :meta="meta" />
    </div>

  </q-page>

</template>

<script setup lang="ts">
// import NavbarTop from '../components/Exercise/NavbarTop.vue'
import ExerciseDetail from '../components/Exercise/ExerciseDetail.vue'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from 'src/boot/axios'
import { useQuasar } from 'quasar'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const exercise = ref<{ id?: number; title?: string; tags?: string[]; hrefs?: string[]; description?: string } | null>(null)
const videoSrc = ref<string | undefined>(undefined)
const meta = ref<any>(null)

const DEFAULT_VIDEO = '/animations/Barbell Pullover.mp4'

async function loadExercise() {
  const id = Number(route.query.id || route.params.id)
  if (!id) {
    $q.notify({ type: 'negative', message: 'Не указан id упражнения' })
    void router.push('/exercises')
    return
  }

  try {
    const resp = await api.get(`/exercise/${id}`)
    const data = resp.data || {}
    exercise.value = data
    // choose video: first non-empty href, otherwise default local animation
    const href = Array.isArray(data.hrefs) && data.hrefs.length ? data.hrefs.find((h: string) => h && h.trim()) : undefined
    videoSrc.value = href || DEFAULT_VIDEO
    // Build simple meta from tags if available
    meta.value = {
      muscles: data.tags || [],
      category: undefined,
      equipment: undefined,
    }
  } catch (err) {
    console.error('Failed to load exercise', err)
    $q.notify({ type: 'negative', message: 'Не удалось загрузить упражнение' })
    void router.push('/exercises')
  }
}

onMounted(() => {
  void loadExercise()
})

function goBack() {
  // navigate back to previous page
  void router.back()
}
</script>

<style scoped>
.exercise-header {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0;
}

.back-btn {
  position: absolute;
  left: 8px;
}

.exercise-title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  max-width: calc(100% - 72px);
  padding: 0 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 600px) {
  .exercise-title {
    font-size: 16px
  }
}
</style>
