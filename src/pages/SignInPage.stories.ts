import type { Meta, StoryObj } from '@storybook/vue3'
import { createRouter, createMemoryHistory } from 'vue-router'
import SignInPage from './SignInPage.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/signup', component: { template: '<div/>' } },
    { path: '/mainPage', component: { template: '<div/>' } },
  ],
})

const meta: Meta<typeof SignInPage> = {
  title: 'Pages/SignInPage',
  component: SignInPage,
  decorators: [() => ({ template: '<story />', global: { plugins: [router] } })],
  parameters: { layout: 'fullscreen' },
}
export default meta

type Story = StoryObj<typeof SignInPage>

export const Default: Story = {}
