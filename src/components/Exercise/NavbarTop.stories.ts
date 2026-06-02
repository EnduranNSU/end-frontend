import type { Meta, StoryObj } from '@storybook/vue3'
import NavbarTop from './NavbarTop.vue'
import { createRouter, createMemoryHistory } from 'vue-router'

const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })

const meta: Meta<typeof NavbarTop> = {
  title: 'Components/Exercise/NavbarTop',
  component: NavbarTop,
  decorators: [() => ({ template: '<story />', global: { plugins: [router] } })],
  argTypes: {
    title: { control: 'text' },
    hideTabs: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof NavbarTop>

export const Default: Story = {
  args: { title: 'Приседания со штангой', hideTabs: false },
}

export const HideTabs: Story = {
  args: { title: 'Становая тяга', hideTabs: true },
}
