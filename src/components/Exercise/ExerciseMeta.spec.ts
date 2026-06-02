import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'
import ExerciseMeta from './ExerciseMeta.vue'

const global = { plugins: [[Quasar, {}]] }

describe('ExerciseMeta', () => {
  it('renders a chip per muscle', () => {
    const w = mount(ExerciseMeta, {
      props: { meta: { muscles: ['Квадрицепсы', 'Ягодицы'] } },
      global,
    })
    expect(w.text()).toContain('Квадрицепсы')
    expect(w.text()).toContain('Ягодицы')
  })

  it('renders nothing when muscles is empty', () => {
    const w = mount(ExerciseMeta, { props: { meta: { muscles: [] } }, global })
    expect(w.find('.tags-container').exists()).toBe(false)
  })

  it('renders nothing when meta is undefined', () => {
    const w = mount(ExerciseMeta, { props: { meta: undefined }, global })
    expect(w.find('.tags-container').exists()).toBe(false)
  })
})
