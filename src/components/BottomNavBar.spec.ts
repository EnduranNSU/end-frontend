import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'
import BottomNavBar from './BottomNavBar.vue'

const global = { plugins: [[Quasar, {}]] }

describe('BottomNavBar', () => {
  it('renders 4 nav items', () => {
    const w = mount(BottomNavBar, { global })
    expect(w.findAll('.ai-nav-item')).toHaveLength(4)
  })

  it('marks the active tab', () => {
    const w = mount(BottomNavBar, { props: { modelValue: 'history' }, global })
    const buttons = w.findAll('.ai-nav-item')
    const historyBtn = buttons.find(b => b.text().includes('История'))
    expect(historyBtn?.classes()).toContain('active')
  })

  it('emits navigate and update:modelValue on click', async () => {
    const w = mount(BottomNavBar, { props: { modelValue: 'add' }, global })
    const buttons = w.findAll('.ai-nav-item')
    const profileBtn = buttons.find(b => b.text().includes('Профиль'))
    await profileBtn?.trigger('click')
    expect(w.emitted('navigate')?.[0]).toEqual(['profile'])
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['profile'])
  })

  it('reacts to modelValue prop change', async () => {
    const w = mount(BottomNavBar, { props: { modelValue: 'add' }, global })
    await w.setProps({ modelValue: 'exercises' })
    const buttons = w.findAll('.ai-nav-item')
    const exBtn = buttons.find(b => b.text().includes('Упражнения'))
    expect(exBtn?.classes()).toContain('active')
  })
})
