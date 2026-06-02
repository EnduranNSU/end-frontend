import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlannedDraftStore } from './plannedDraft'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('plannedDraftStore', () => {
  it('draft is null initially', () => {
    const store = usePlannedDraftStore()
    expect(store.draft).toBeNull()
  })

  it('startDraft creates a draft with given data', () => {
    const store = usePlannedDraftStore()
    store.startDraft({ weekdays: ['Mon', 'Wed'], training: { title: 'Силовая', perfomable_exercises: [] } })
    expect(store.draft?.weekdays).toEqual(['Mon', 'Wed'])
    expect(store.draft?.training.title).toBe('Силовая')
  })

  it('startDraft uses empty defaults when no args given', () => {
    const store = usePlannedDraftStore()
    store.startDraft()
    expect(store.draft?.weekdays).toEqual([])
    expect(store.draft?.training.title).toBe('')
    expect(store.draft?.training.perfomable_exercises).toEqual([])
  })

  it('clearDraft resets to null', () => {
    const store = usePlannedDraftStore()
    store.startDraft({ weekdays: ['Fri'] })
    store.clearDraft()
    expect(store.draft).toBeNull()
  })

  it('addExercise appends to perfomable_exercises', () => {
    const store = usePlannedDraftStore()
    store.startDraft()
    store.addExercise(5)
    expect(store.draft?.training.perfomable_exercises).toHaveLength(1)
    expect(store.draft?.training.perfomable_exercises[0]?.exercise_id).toBe(5)
  })

  it('addExercise uses provided sets', () => {
    const store = usePlannedDraftStore()
    store.startDraft()
    store.addExercise(3, [{ weight: 80, repetitions: 10, rest_duration: 90 }])
    expect(store.draft?.training.perfomable_exercises[0]?.sets[0]?.weight).toBe(80)
  })

  it('addExercise uses default sets when none provided', () => {
    const store = usePlannedDraftStore()
    store.startDraft()
    store.addExercise(7)
    const sets = store.draft?.training.perfomable_exercises[0]?.sets
    expect(sets?.[0]?.repetitions).toBe(8)
    expect(sets?.[0]?.rest_duration).toBe(60)
  })

  it('removeExerciseAt removes correct entry', () => {
    const store = usePlannedDraftStore()
    store.startDraft()
    store.addExercise(1)
    store.addExercise(2)
    store.addExercise(3)
    store.removeExerciseAt(1)
    expect(store.draft?.training.perfomable_exercises).toHaveLength(2)
    expect(store.draft?.training.perfomable_exercises[0]?.exercise_id).toBe(1)
    expect(store.draft?.training.perfomable_exercises[1]?.exercise_id).toBe(3)
  })

  it('addExercise does nothing when draft is null', () => {
    const store = usePlannedDraftStore()
    store.addExercise(5)
    expect(store.draft).toBeNull()
  })

  it('removeExerciseAt does nothing when draft is null', () => {
    const store = usePlannedDraftStore()
    store.removeExerciseAt(0)
    expect(store.draft).toBeNull()
  })
})
