import type { Meta, StoryObj } from '@storybook/vue3'
import ExerciseMeta from './ExerciseMeta.vue'

const meta: Meta<typeof ExerciseMeta> = {
  title: 'Components/Exercise/ExerciseMeta',
  component: ExerciseMeta,
  argTypes: {
    meta: { control: 'object' },
  },
}
export default meta

type Story = StoryObj<typeof ExerciseMeta>

export const WithMuscles: Story = {
  args: {
    meta: { muscles: ['Квадрицепсы', 'Ягодицы', 'Бицепс бедра'] },
  },
}

export const ManyMuscles: Story = {
  args: {
    meta: {
      muscles: ['Грудь', 'Трицепс', 'Передние дельты', 'Кор', 'Бицепс'],
    },
  },
}

export const NoMuscles: Story = {
  args: { meta: { muscles: [] } },
}

export const NoMeta: Story = {
  args: { meta: undefined },
}
