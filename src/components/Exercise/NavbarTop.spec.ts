import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import NavbarTop from './NavbarTop.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div/>' } }],
})

const global = { plugins: [router] }

describe('NavbarTop', () => {
  it('renders title', () => {
    const w = mount(NavbarTop, { props: { title: 'Приседания' }, global })
    expect(w.text()).toContain('Приседания')
  })

  it('shows tabs by default', () => {
    const w = mount(NavbarTop, { props: { title: 'X' }, global })
    expect(w.text()).toContain('Описание')
    expect(w.text()).toContain('История')
  })

  it('hides tabs when hideTabs=true', () => {
    const w = mount(NavbarTop, { props: { title: 'X', hideTabs: true }, global })
    expect(w.text()).not.toContain('Описание')
  })

  it('emits section-change on tab click', async () => {
    const w = mount(NavbarTop, { props: { title: 'X' }, global })
    const items = w.findAll('.menu-item')
    await items[1]?.trigger('click')
    expect(w.emitted('section-change')?.[0]).toEqual(['История'])
  })

  it('marks first tab active initially', () => {
    const w = mount(NavbarTop, { props: { title: 'X' }, global })
    expect(w.find('.menu-item.active').text()).toBe('Описание')
  })
})
