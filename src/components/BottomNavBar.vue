<template>
  <nav class="bottom-nav">
    <!-- <button
      class="nav-item"
      :class="{ active: model === 'chat' }"
      @click="select('chat')"
    >
      <q-icon name="chat_bubble_outline" :size="iconSize('chat')" />
      <span>Чат-бот</span>
    </button> -->

    <!-- <button
      class="nav-item"
      :class="{ active: model === 'history' }"
      @click="select('history')"
    >
      <q-icon name="history" :size="iconSize('history')" />
      <span>История</span>
    </button> -->

    <button class="nav-item center" :class="{ active: model === 'add' }" @click="select('add')">
      <q-icon name="add" :size="iconSize('add')" />
      <span>Тренировка</span>
    </button>

    <button class="nav-item" :class="{ active: model === 'exercises' }" @click="select('exercises')">
      <q-icon name="fitness_center" :size="iconSize('exercises')" />
      <span>Упражнения</span>
    </button>

    <button class="nav-item" :class="{ active: model === 'profile' }" @click="select('profile')">
      <q-icon name="person" :size="iconSize('profile')" />
      <span>Профиль</span>
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

watch(
  () => props.modelValue,
  (v) => {
    if (typeof v === 'string') model.value = v
  }
)

function select(key: string) {
  model.value = key
  emit('update:modelValue', key)
  emit('navigate', key)
}

function iconSize(key: string) {
  return key === 'add' ? '36px' : '28px'
}
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 72px;
  background: #3f3b3b;
  /* тёмно-серый как на макете */
  display: grid;
  /* layout for three visible items: center the three icons */
  grid-template-columns: repeat(3, 1fr);
  align-items: stretch;
  justify-items: stretch;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 1000;
}

.nav-item {
  display: grid;
  grid-template-rows: 1fr auto;
  /* иконка занимает всё доступное, текст прижат вниз */
  align-items: center;
  justify-items: center;
  height: 100%;
  padding: 6px 0 8px;
  background: transparent;
  border: none;
  color: #c8c8c8;
  /* неактивные иконки и подписи */
  font-size: 12px;
}

.nav-item>.q-icon {
  line-height: 1;
  /* убираем влияние линии на выравнивание */
}

.nav-item span {
  line-height: 1;
  /* единый базовый уровень подписи */
  margin-top: 4px;
}

.nav-item.active {
  color: #ffffff;
  /* активная подсветка */
}

.nav-item.center {
  /* центр — увеличенный размер иконки задаётся через iconSize */
}

/* небольшая защита от случайных кликов по краям */
.nav-item:active {
  opacity: 0.85;
}
</style>
