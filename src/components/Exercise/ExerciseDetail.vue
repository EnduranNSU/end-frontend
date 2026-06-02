<template>
  <div class="exercise-detail q-pa-md">
    <div class="media">
      <a v-if="videoSrc" :href="videoSrc" target="_blank" rel="noopener noreferrer" class="youtube-btn">
        <svg class="yt-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path fill="red" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8z"/>
          <polygon fill="white" points="9.6,15.6 15.8,12 9.6,8.4"/>
        </svg>
        Смотреть технику на YouTube
      </a>
    </div>

    <ExerciseMeta v-if="meta" :meta="meta" class="q-mt-md" />

    <div class="instruction-wrapper q-mt-md">
      <div class="instruction-header row items-center q-pa-sm">
        <div class="text-subtitle2">Описание</div>
        <q-space />
        <q-btn dense flat round icon="expand_more" :class="{ rotated: expanded }" @click="toggleExpanded"
          aria-label="toggle description" />
      </div>

      <div :class="['instruction-box', { expanded }]">
        <div v-if="instruction">
          <p v-for="(para, idx) in paragraphs" :key="idx">{{ para }}</p>
        </div>
        <p v-else>Инструкция отсутствует.</p>
      </div>
    </div>

    <div class="virtual-coach-wrapper q-mt-lg">
      <q-btn class="virtual-coach-btn" @click="goToVirtualCoach" unelevated no-caps>
        Виртуальный коуч
      </q-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useRouter } from 'vue-router'
import ExerciseMeta from './ExerciseMeta.vue';

interface Meta {
  muscles?: string[];
  category?: string;
  equipment?: string[];
}

export default defineComponent({
  name: 'ExerciseDetail',
  components: { ExerciseMeta },
  props: {
    videoSrc: { type: String, default: undefined },
    instruction: { type: String, default: undefined },
    meta: { type: Object as () => Meta | null, default: null },
    exerciseId: { type: Number, default: 0 },
  },
  setup(props) {
    const router = useRouter()
    const expanded = ref(false)

    const paragraphs = computed(() =>
      (props.instruction || '')
        .split(/\n+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    )

    function toggleExpanded() {
      expanded.value = !expanded.value
    }

    function uuidv4() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
      })
    }

    function goToVirtualCoach() {
      void router.push({ path: '/coach', query: { chat_id: uuidv4(), exercise_id: String(props.exerciseId || 0) } })
    }

    return { goToVirtualCoach, paragraphs, expanded, toggleExpanded };
  },
});
</script>

<style scoped>
.youtube-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 14px;
  text-decoration: none;
  color: #222;
  font-size: 16px;
  font-weight: 500;
  width: fit-content;
  transition: border-color 0.2s, background 0.2s;
  margin-bottom: 16px;
}
.youtube-btn:hover {
  border-color: #f00;
  background: #fff5f5;
}
.yt-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.virtual-coach-wrapper {
  display: flex;
  justify-content: center;
}

.virtual-coach-btn {
  background: #ffb800;
  color: black;
  font-size: 18px;
  font-weight: 500;
  padding: 12px 32px;
  border-radius: 100px;
  min-width: 240px;
}

.virtual-coach-btn:hover {
  background: #ffa600;
}

.q-mt-md {
  margin-bottom: 32px;
}

.instruction-wrapper {
  max-width: 900px;
  margin: 0 auto;
}

.instruction-header {
  align-items: center;
}

.instruction-box {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 12px 16px;
  max-height: 160px;
  overflow: auto;
  transition: max-height 220ms ease;
  background: #fff;
}

.instruction-box.expanded {
  max-height: 60vh;
  /* allow larger area when expanded */
}

.instruction-box p {
  margin: 0 0 12px 0;
}

.instruction-header .q-btn.rotated {
  transform: rotate(180deg);
  transition: transform 180ms ease;
}
</style>
