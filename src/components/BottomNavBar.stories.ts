import type { Meta, StoryObj } from '@storybook/vue3'
import BottomNavBar from './BottomNavBar.vue'

const meta: Meta<typeof BottomNavBar> = {
  title: 'Components/BottomNavBar',
  component: BottomNavBar,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    modelValue: {
      control: 'select',
      options: ['add', 'exercises', 'history', 'profile'],
    },
  },
}
export default meta

type Story = StoryObj<typeof BottomNavBar>

export const Default: Story = {
  args: { modelValue: 'add' },
}

export const Exercises: Story = {
  args: { modelValue: 'exercises' },
}

export const History: Story = {
  args: { modelValue: 'history' },
}

export const Profile: Story = {
  args: { modelValue: 'profile' },
}
