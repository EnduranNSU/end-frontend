<template>
  <div class="exercise-detail q-pa-md">
    <div class="media">
      <div class="video-wrapper" @click="togglePlay">
        <video ref="videoEl" :src="videoSrc" playsinline muted class="video-player"></video>
        <div v-if="!isPlaying" class="overlay">
          <div class="play-circle">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="white" stroke-width="3">
              <circle cx="32" cy="32" r="30" opacity="0.9" />
              <polygon points="26,20 48,32 26,44" fill="white" />
            </svg>
          </div>
        </div>
      </div>
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
import { api } from 'src/boot/axios'
import { useQuasar } from 'quasar'
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
    const $q = useQuasar()
    const isPlaying = ref(false);
    const videoEl = ref<HTMLVideoElement | null>(null);
    const expanded = ref(false)

    const togglePlay = () => {
      if (!videoEl.value) return;
      if (isPlaying.value) {
        videoEl.value.pause();
        isPlaying.value = false;
      } else {
        videoEl.value.play().catch((err) => {
          console.warn('Failed to play video:', err);
        });
        isPlaying.value = true;
      }
    };

    const paragraphs = computed(() => {
      const text = props.instruction || ''
      // split on one or more newlines and trim each paragraph
      return text
        .split(/\n+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    })

    function toggleExpanded() {
      expanded.value = !expanded.value
      // when expanding, ensure video isn't hidden or scrolled; no further action needed
    }

    function uuidv4() {
      // simple UUIDv4 generator
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }

    const goToVirtualCoach = () => {
      // Only navigate to the Virtual Coach page with context.
      // Do NOT send any initial request to the agent here — user will start the conversation in the chat UI.
      const exId = Number(props.exerciseId || 0)
      const chatId = uuidv4()
      void router.push({ path: '/coach', query: { chat_id: chatId, exercise_id: String(exId) } })
    }

    return { videoEl, isPlaying, togglePlay, goToVirtualCoach, paragraphs, expanded, toggleExpanded };
  },
});
</script>

<style scoped>
.video-wrapper {
  position: relative;
  width: 100%;
  max-width: 720px;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s ease;
}

.video-player {
  width: 100%;
  display: block;
  border-radius: 16px;
  object-fit: cover;
  margin-bottom: 16px;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(233, 247, 246, 0.4);
  backdrop-filter: blur(1px);
  margin-bottom: 16px;
}

.play-circle {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-circle svg {
  width: 70px;
  height: 70px;
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
