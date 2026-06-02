import type { Meta, StoryObj } from '@storybook/vue3'
import { createRouter, createMemoryHistory } from 'vue-router'
import SignUpPage from './SignUpPage.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/signin', component: { template: '<div/>' } },
  ],
})

const meta: Meta<typeof SignUpPage> = {
  title: 'Pages/SignUpPage',
  component: SignUpPage,
  decorators: [() => ({ template: '<story />', global: { plugins: [router] } })],
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof SignUpPage>

export const Default: Story = {}
