import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createRouter, createMemoryHistory } from 'vue-router'
import ExerciseDetail from './ExerciseDetail.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div/>' } },
    { path: '/coach', component: { template: '<div/>' } },
  ],
})
const global = { plugins: [[Quasar, {}], router] }

describe('ExerciseDetail', () => {
  it('shows youtube link when videoSrc provided', () => {
    const w = mount(ExerciseDetail, {
      props: { videoSrc: 'https://youtube.com/watch?v=test', exerciseId: 1 },
      global,
    })
    expect(w.find('.youtube-btn').exists()).toBe(true)
    expect(w.find('.youtube-btn').attributes('href')).toBe('https://youtube.com/watch?v=test')
  })

  it('hides youtube link when videoSrc is undefined', () => {
    const w = mount(ExerciseDetail, { props: { exerciseId: 1 }, global })
    expect(w.find('.youtube-btn').exists()).toBe(false)
  })

  it('shows fallback text when no instruction', () => {
    const w = mount(ExerciseDetail, { props: { exerciseId: 1 }, global })
    expect(w.text()).toContain('Инструкция отсутствует.')
  })

  it('splits instruction into paragraphs', () => {
    const w = mount(ExerciseDetail, {
      props: { instruction: 'Шаг первый.\n\nШаг второй.', exerciseId: 1 },
      global,
    })
    const paras = w.findAll('.instruction-box p')
    expect(paras).toHaveLength(2)
    expect(paras[0]?.text()).toBe('Шаг первый.')
    expect(paras[1]?.text()).toBe('Шаг второй.')
  })

  it('toggles expanded class on button click', async () => {
    const w = mount(ExerciseDetail, {
      props: { instruction: 'Текст', exerciseId: 1 },
      global,
    })
    expect(w.find('.instruction-box').classes()).not.toContain('expanded')
    await w.find('[aria-label="toggle description"]').trigger('click')
    expect(w.find('.instruction-box').classes()).toContain('expanded')
    await w.find('[aria-label="toggle description"]').trigger('click')
    expect(w.find('.instruction-box').classes()).not.toContain('expanded')
  })

  it('renders ExerciseMeta when meta provided', () => {
    const w = mount(ExerciseDetail, {
      props: { meta: { muscles: ['Квадрицепсы'] }, exerciseId: 1 },
      global,
    })
    expect(w.text()).toContain('Квадрицепсы')
  })

  it('navigates to /coach on virtual coach click', async () => {
    const w = mount(ExerciseDetail, { props: { exerciseId: 42 }, global })
    await w.find('.virtual-coach-btn').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/coach')
    expect(router.currentRoute.value.query.exercise_id).toBe('42')
  })
})
