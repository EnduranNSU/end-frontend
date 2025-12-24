import { defineStore } from 'pinia'

export type PerfomableExercise = {
  exercise_id?: number
  sets: Array<{ weight?: number; repetitions?: number; rest_duration?: number }>
}

export type PlannedDraft = {
  weekdays: string[]
  training: {
    title: string
    perfomable_exercises: PerfomableExercise[]
  }
}

export const usePlannedDraftStore = defineStore('plannedDraft', {
  state: () => ({
    draft: null as PlannedDraft | null,
  }),
  actions: {
    startDraft(initial?: Partial<PlannedDraft>) {
      this.draft = {
        weekdays: initial?.weekdays ?? [],
        training: {
          title: initial?.training?.title ?? '',
          perfomable_exercises:
            (initial?.training?.perfomable_exercises as PerfomableExercise[]) ?? [],
        },
      }
    },
    clearDraft() {
      this.draft = null
    },
    addExercise(exercise_id: number, sets?: PerfomableExercise['sets']) {
      if (!this.draft) return
      if (!Array.isArray(this.draft.training.perfomable_exercises))
        this.draft.training.perfomable_exercises = []
      this.draft.training.perfomable_exercises.push({
        exercise_id,
        sets: sets ?? [{ weight: 0, repetitions: 8, rest_duration: 60 }],
      })
    },
    removeExerciseAt(idx: number) {
      if (!this.draft) return
      this.draft.training.perfomable_exercises.splice(idx, 1)
    },
  },
})
