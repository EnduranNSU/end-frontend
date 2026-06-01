import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar, Notify } from 'quasar'
import { createRouter, createMemoryHistory } from 'vue-router'
import SignInPage from './SignInPage.vue'

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
    { path: '/mainPage', component: { template: '<div/>' } },
    { path: '/signup', component: { template: '<div/>' } },
  ],
})

const global = { plugins: [[Quasar, { plugins: { Notify } }], router] }

describe('SignInPage', () => {
  it('renders username and password inputs', () => {
    const w = mount(SignInPage, { global })
    const inputs = w.findAll('input')
    expect(inputs).toHaveLength(2)
    expect(inputs[1]?.attributes('type')).toBe('password')
  })

  it('renders login button', () => {
    const w = mount(SignInPage, { global })
    expect(w.find('button').text()).toBe('Войти')
  })

  it('button shows loading text while submitting', async () => {
    const { api } = await import('src/boot/axios')
    vi.mocked(api.post).mockImplementation(() => new Promise(() => {}))

    const w = mount(SignInPage, { global })
    await w.findAll('input')[0]!.setValue('user')
    await w.findAll('input')[1]!.setValue('pass')
    w.find('button').trigger('click')
    await w.vm.$nextTick()
    expect(w.find('button').text()).toBe('Входим…')
  })

  it('button is disabled while submitting', async () => {
    const { api } = await import('src/boot/axios')
    vi.mocked(api.post).mockImplementation(() => new Promise(() => {}))

    const w = mount(SignInPage, { global })
    await w.findAll('input')[0]!.setValue('user')
    await w.findAll('input')[1]!.setValue('pass')
    w.find('button').trigger('click')
    await w.vm.$nextTick()
    expect(w.find('button').attributes('disabled')).toBeDefined()
  })

  it('saves token and redirects on success', async () => {
    const { api } = await import('src/boot/axios')
    vi.mocked(api.post).mockResolvedValue({ data: { access_token: 'tok123' } })

    const w = mount(SignInPage, { global })
    await w.findAll('input')[0]!.setValue('user')
    await w.findAll('input')[1]!.setValue('pass')
    await w.find('button').trigger('click')
    await new Promise(r => setTimeout(r, 10))

    expect(localStorage.getItem('access_token')).toBe('tok123')
    expect(router.currentRoute.value.path).toBe('/mainPage')
  })
})
