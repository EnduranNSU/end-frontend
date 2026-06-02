import type { Meta, StoryObj } from '@storybook/vue3'
import { createRouter, createMemoryHistory } from 'vue-router'
import ExerciseDetail from './ExerciseDetail.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div/>' } }, { path: '/coach', component: { template: '<div/>' } }],
})

const meta: Meta<typeof ExerciseDetail> = {
  title: 'Components/Exercise/ExerciseDetail',
  component: ExerciseDetail,
  decorators: [() => ({ template: '<div style="max-width:480px;padding:16px"><story /></div>', global: { plugins: [router] } })],
  argTypes: {
    videoSrc: { control: 'text' },
    instruction: { control: 'text' },
    exerciseId: { control: 'number' },
  },
}
export default meta

type Story = StoryObj<typeof ExerciseDetail>

export const WithVideo: Story = {
  args: {
    videoSrc: 'https://www.youtube.com/results?search_query=squat+technique',
    instruction: 'Встаньте прямо, ноги на ширине плеч.\n\nМедленно опускайтесь вниз, сгибая колени.\n\nУдерживайте спину прямой на протяжении всего движения.',
    meta: { muscles: ['Квадрицепсы', 'Ягодицы', 'Бицепс бедра'] },
    exerciseId: 1,
  },
}

export const NoVideo: Story = {
  args: {
    videoSrc: undefined,
    instruction: 'Лягте на скамью. Опустите гриф к груди и выжмите вверх.',
    meta: { muscles: ['Грудь', 'Трицепс', 'Передние дельты'] },
    exerciseId: 2,
  },
}

export const LongInstruction: Story = {
  args: {
    videoSrc: 'https://www.youtube.com/results?search_query=deadlift',
    instruction: Array(10).fill('Держите спину нейтральной. Тяните гриф вдоль голеней. Не округляйте поясницу.').join('\n\n'),
    meta: { muscles: ['Поясница', 'Бицепс бедра', 'Ягодицы', 'Трапеции'] },
    exerciseId: 3,
  },
}

export const NoInstruction: Story = {
  args: {
    videoSrc: undefined,
    instruction: undefined,
    meta: undefined,
    exerciseId: 4,
  },
}
