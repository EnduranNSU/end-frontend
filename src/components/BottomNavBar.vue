<template>
  <nav class="ai-bottom-nav">
    <button
      v-for="item in items" :key="item.key"
      class="ai-nav-item"
      :class="{ active: model === item.key, center: item.key === 'add' }"
      @click="select(item.key)"
    >
      <q-icon :name="item.icon" :size="item.key === 'add' ? '30px' : '24px'" />
      <span class="ai-nav-label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'navigate', v: string): void
}>()

const model = ref(props.modelValue ?? 'add')

watch(() => props.modelValue, (v) => { if (v) model.value = v })

const items = [
  { key: 'add',       icon: 'fitness_center', label: 'Тренировка' },
  { key: 'exercises', icon: 'menu_book',       label: 'Упражнения' },
  { key: 'history',   icon: 'calendar_month',  label: 'История'    },
  { key: 'profile',   icon: 'person',          label: 'Профиль'    },
]

function select(key: string) {
  model.value = key
  emit('update:modelValue', key)
  emit('navigate', key)
}
</script>

<style scoped>
.ai-bottom-nav {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  max-width: 480px;
  margin: 0 auto;
  height: 68px;
  background: #fff8ee;
  border-top: 3px solid #e8dcc8;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  align-items: stretch;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 1000;
  box-shadow: 0 -4px 0 0 #bdaea0;
}

.ai-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: transparent;
  border: none;
  padding: 8px 4px 10px;
  cursor: pointer;
  color: #bfac97;
  transition: color 0.15s;
}

.ai-nav-item.active {
  color: #19c8b9;
}

.ai-nav-label {
  font-size: 10px;
  font-weight: 700;
  font-family: 'Nunito', sans-serif;
}

.ai-nav-item:active { opacity: 0.75; }
</style>
