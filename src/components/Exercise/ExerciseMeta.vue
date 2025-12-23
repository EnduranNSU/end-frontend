<template>
  <!-- <div class="exercise-meta">
    <div class="meta-item">{{ $props.meta?.category || '—' }}</div>
    <div class="divider"></div>
    <div class="meta-item">{{ $props.meta?.equipment?.join(', ') || '—' }}</div>
    <div class="divider"></div>
    <div class="meta-item">{{ $props.meta?.muscles?.length ? '' : '—' }}</div>
  </div> -->
  <div v-if="$props.meta?.muscles && $props.meta.muscles.length" class="tags-container q-mt-sm">
    <q-chip v-for="(t, idx) in $props.meta.muscles" :key="t + idx" dense outline class="tag-chip">{{ t }}</q-chip>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

interface Meta {
  muscles?: string[];
  category?: string;
  equipment?: string[];
}

export default defineComponent({
  name: 'ExerciseMeta',
  props: {
    meta: {
      type: Object as () => Meta | undefined,
      default: undefined,
    },
  },
});
</script>

<style scoped>
.exercise-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  padding: 16px 24px;
  font-size: max(16px, min(18px, 2vw));
  color: #222;
  gap: 24px;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.meta-item {
  flex: 1;
  text-align: center;
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.divider {
  flex: none;
  width: 2px;
  height: 24px;
  background-color: rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .exercise-meta {
    padding: 12px 16px;
    gap: 16px;
    font-size: 16px;
  }

  .divider {
    height: 20px;
  }
}

@media (max-width: 300px) {
  .exercise-meta {
    flex-direction: column;
    padding: 16px;
    gap: 12px;
    font-size: 15px;
  }

  .meta-item {
    width: 100%;
  }

  .divider {
    width: 2px;
    height: 20px;
  }
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  max-width: 900px;
  margin: 8px auto 0;
}

.tag-chip {
  max-width: 100%;
}
</style>
