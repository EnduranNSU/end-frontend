<template>
  <div class="exercise-detail q-pa-md">
    <div class="media">
      <div class="video-wrapper" @click="togglePlay">
        <video ref="videoEl" :src="videoSrc" playsinline muted class="video-player"></video>
        <div v-if="!isPlaying" class="overlay">
          <div class="play-circle">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 64 64"
              fill="none"
              stroke="white"
              stroke-width="3"
            >
              <circle cx="32" cy="32" r="30" opacity="0.9" />
              <polygon points="26,20 48,32 26,44" fill="white" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <ExerciseMeta v-if="meta" :meta="meta" class="q-mt-md" />

    <div class="instruction q-mt-md">
      <p v-if="instruction">{{ instruction }}</p>
      <p v-else>Инструкция отсутствует.</p>
    </div>

    <div class="virtual-coach-wrapper q-mt-lg">
      <q-btn class="virtual-coach-btn" @click="goToVirtualCoach" unelevated no-caps>
        Виртуальный коуч
      </q-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
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
  },
  setup() {
    const isPlaying = ref(false);
    const videoEl = ref<HTMLVideoElement | null>(null);

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

    const goToVirtualCoach = () => {
      // TODO: Добавить навигацию на страницу виртуального коуча
      console.log('Navigating to virtual coach...');
    };

    return { videoEl, isPlaying, togglePlay, goToVirtualCoach };
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
</style>
