import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar, Notify } from 'quasar'
import { createRouter, createMemoryHistory } from 'vue-router'
import SignUpPage from './SignUpPage.vue'

vi.mock('src/boot/axios', () => ({
  api: {
    post: vi.fn(),
    defaults: { headers: { common: {} } },
  },
}))

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/signin', component: { template: '<div/>' } },
  ],
})

const global = { plugins: [[Quasar, { plugins: { Notify } }], router] }

describe('SignUpPage', () => {
  it('renders 3 inputs: name, email, password', () => {
    const w = mount(SignUpPage, { global })
    const inputs = w.findAll('input')
    expect(inputs).toHaveLength(3)
    expect(inputs[1]?.attributes('type')).toBe('email')
    expect(inputs[2]?.attributes('type')).toBe('password')
  })

  it('shows register button', () => {
    const w = mount(SignUpPage, { global })
    expect(w.find('button').text()).toBe('Зарегистрироваться')
  })

  it('button shows loading text while submitting', async () => {
    const { api } = await import('src/boot/axios')
    vi.mocked(api.post).mockImplementation(() => new Promise(() => {}))

    const w = mount(SignUpPage, { global })
    await w.findAll('input')[0]!.setValue('Кирилл')
    await w.findAll('input')[1]!.setValue('test@test.com')
    await w.findAll('input')[2]!.setValue('secret')
    w.find('button').trigger('click')
    await w.vm.$nextTick()
    expect(w.find('button').text()).toBe('Регистрируем…')
  })

  it('redirects to signin on success', async () => {
    const { api } = await import('src/boot/axios')
    vi.mocked(api.post).mockResolvedValue({ data: {} })

    const w = mount(SignUpPage, { global })
    await w.findAll('input')[0]!.setValue('Кирилл')
    await w.findAll('input')[1]!.setValue('test@test.com')
    await w.findAll('input')[2]!.setValue('secret')
    await w.find('button').trigger('click')
    await new Promise(r => setTimeout(r, 10))

    expect(router.currentRoute.value.path).toBe('/signin')
  })
})
