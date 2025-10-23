<template>
  <q-page class="q-pa-md">
    <NavbarTop title="Barbell Pullover" backRoute="/" @section-change="onSectionChange" />

    <div v-if="currentSection === 'Описание'">
      <ExerciseDetail
        :videoSrc="videoPath"
        instruction="Выполните 3 подхода по 12 повторений. Следите за техникой: держите спину прямо, вдох на опускании, выдох на подъеме."
        :meta="{ muscles: ['Грудные', 'Трицепс'], category: 'Силовые', equipment: ['Штанга'] }"
      />
    </div>

    <div v-else>
      <q-card class="q-pa-md">История выполнения упражнения (пусто).</q-card>
    </div>

  </q-page>

</template>

<script setup lang="ts">
import NavbarTop from '../components/Exercise/NavbarTop.vue'
import ExerciseDetail from '../components/Exercise/ExerciseDetail.vue'
import { ref } from 'vue'

const currentSection = ref('Описание')

const videoPath = '/animations/Barbell Pullover.mp4'

function onSectionChange(section: string) {
  currentSection.value = section
}
</script>
