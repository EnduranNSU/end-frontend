<template>
    <q-page class="q-pa-md page-with-nav">
        <div class="row items-center q-mb-md">
            <q-btn dense flat round icon="arrow_back" @click="goBack" />
            <div class="text-subtitle2 text-weight-medium q-ml-sm">Запланированная тренировка</div>
        </div>

        <q-card flat bordered class="q-pa-md rounded-card" v-if="loading">
            <div class="text-center">Загрузка тренировки...</div>
        </q-card>

        <q-card flat bordered class="q-pa-md rounded-card" v-else-if="!planned">
            <div class="text-center">Тренировка не найдена.</div>
        </q-card>

        <div v-else>
            <div class="row q-mb-sm justify-center">
                <div class="col-12 col-md-8">
                    <q-card flat bordered class="q-pa-md rounded-card">
                        <div class="row items-center q-gutter-sm">
                            <div class="col">
                                <div class="text-h5 text-weight-bold" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis">{{ planned?.training?.title || 'Тренировка' }}</div>
                                <div class="text-caption q-mt-xs">Дни недели: {{ (planned.weekdays || []).join(', ') || '—' }}</div>
                            </div>
                            <div class="col-auto">
                                <div class="row items-center q-gutter-sm">
                                    <q-btn dense round flat icon="edit" color="primary" @click="openEdit" label="" aria-label="Редактировать" />
                                    <q-btn dense round flat icon="delete" color="negative" @click="confirmDelete" label="" aria-label="Удалить" />
                                </div>
                            </div>
                        </div>
                    </q-card>
                </div>
            </div>

            <div v-for="(pe, idx) in planned.training?.perfomable_exercises || []" :key="idx" class="q-mb-sm">
                <q-card flat bordered class="q-pa-sm">
                    <div class="row items-center">
                        <div class="col">
                            <div class="text-weight-medium">{{ pe.exercise?.title || 'Упражнение' }}</div>
                            <div class="text-caption text-grey-7">Тегов: {{ (pe.exercise?.tags || []).join(', ') }}
                            </div>
                        </div>
                        <div class="col-auto">
                            <div class="text-caption">Сетов: {{ (pe.sets || []).length }}</div>
                        </div>
                    </div>
                </q-card>
            </div>
        </div>

        <!-- Edit dialog -->
        <q-dialog v-model="editDialog">
            <q-card style="min-width:320px; max-width:92vw">
                <q-card-section>
                    <div class="text-h6">Редактировать запланированную тренировку</div>
                </q-card-section>
                <q-card-section>
                    <q-form @submit.prevent="saveUpdate">
                        <div class="q-gutter-md">
                            <q-input v-model="editModel.training.title" label="Название" dense />
                            <q-select v-model="editModel.weekdays" label="Дни недели" multiple :options="weekdaysOptions" use-chips dense />

                            <div class="q-mt-md">
                                <div class="text-subtitle2">Упражнения</div>
                                <div v-for="(pe, pIdx) in editModel.training.perfomable_exercises || []" :key="pIdx" class="q-mt-sm q-pa-sm" style="border:1px solid var(--q-color-grey-3); border-radius:6px">
                                    <div class="row items-center q-gutter-sm">
                                        <div class="col">
                                            <q-select v-model.number="pe.exercise_id" :options="exerciseOptions" label="Упражнение" emit-value map-options dense />
                                        </div>
                                        <div class="col-auto">
                                            <q-btn dense flat icon="delete" color="negative" @click.prevent="removePerfomableExercise(pIdx)" />
                                        </div>
                                    </div>

                                    <div v-for="(s, sIdx) in pe.sets || []" :key="sIdx" class="row items-center q-gutter-sm q-mt-sm">
                                        <div class="col-4">
                                            <q-input v-model.number="s.repetitions" label="reps" type="number" dense />
                                        </div>
                                        <div class="col-4">
                                            <q-input v-model.number="s.weight" label="kg" type="number" dense />
                                        </div>
                                        <div class="col-auto">
                                            <q-btn dense flat icon="delete" color="negative" @click.prevent="removeSetFromPerf(pIdx, sIdx)" />
                                        </div>
                                    </div>

                                    <div class="row q-mt-sm">
                                        <q-btn flat label="Добавить сет" @click.prevent="addSetToPerf(pIdx)" />
                                    </div>
                                </div>

                                <div class="q-mt-sm">
                                    <q-select v-model.number="newExerciseToAdd" :options="exerciseOptions" label="Добавить упражнение" dense emit-value map-options />
                                    <div class="q-mt-xs">
                                        <q-btn flat label="Добавить упражнение" @click.prevent="addPerfomableExercise" />
                                    </div>
                                </div>
                            </div>

                            <div class="row q-justify-end q-mt-md">
                                <q-btn flat label="Отмена" color="grey" v-close-popup @click="() => (editDialog = false)" />
                                <q-btn color="primary" label="Сохранить" type="submit" />
                            </div>
                        </div>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from 'src/boot/axios'
import { useQuasar, Dialog } from 'quasar'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const planned = ref<any | null>(null)
const loading = ref(true)
const editDialog = ref(false)
const editModel = ref<any>({ weekdays: [], training: { title: '', perfomable_exercises: [] } })

const weekdaysOptions = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

// exercises for select options
const exercises = ref<{ id: number; title: string }[]>([])
const exerciseOptions = computed(() => exercises.value.map((e) => ({ label: e.title, value: e.id })))
const newExerciseToAdd = ref<number | null>(null)

async function fetchExercises() {
    try {
        const resp = await api.get('/exercise/')
        const data = resp.data || []
        exercises.value = (data as any[]).map((x) => ({ id: Number(x.id), title: x.title || String(x.id) }))
    } catch (err) {
        console.warn('Failed to load exercises for edit', err)
        exercises.value = []
    }
}

async function loadPlanned() {
    loading.value = true
    const id = Number(route.query.id || route.params.id)
    if (!id) {
        $q.notify({ type: 'negative', message: 'Не указан id тренировки' })
        void router.push('/mainPage')
        return
    }

    try {
        // ensure Authorization header is set from localStorage (in case it's not)
        try {
            const token = localStorage.getItem('access_token')
            if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } catch (e) {
            // ignore
        }
        const resp = await api.get(`/training/planned/${id}`)
        planned.value = resp.data || null
    } catch (err) {
        console.error('Failed to load planned training', err)
        const status = (err as any)?.response?.status
        const data = (err as any)?.response?.data
        $q.notify({ type: 'negative', message: `Не удалось загрузить тренировку${status ? ` (${status})` : ''}` })
        console.debug('server response:', status, data)
        planned.value = null
    } finally {
        loading.value = false
    }
}

function goBack() {
    void router.back()
}

function openEdit() {
    if (!planned.value) return
    // copy planned and normalize perfomable_exercises to use exercise_id and sets arrays
    const copy = JSON.parse(JSON.stringify(planned.value))
    if (!copy.training) copy.training = { title: '', perfomable_exercises: [] }
    copy.training.perfomable_exercises = (copy.training.perfomable_exercises || []).map((pe: any) => ({
        exercise_id: pe.exercise?.id ?? pe.exercise_id ?? null,
        sets: Array.isArray(pe.sets) ? pe.sets.map((s: any) => ({ weight: s.weight ?? 0, repetitions: s.repetitions ?? 0, rest_duration: s.rest_duration ?? 60 })) : [],
    }))
    editModel.value = copy
    editDialog.value = true
}

async function saveUpdate() {
    const id = Number(route.query.id || route.params.id)
    if (!id) return
    try {
        try {
            const token = localStorage.getItem('access_token')
            if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } catch (e) {}
        // transform perfomable_exercises to expected server shape
        const perf = (editModel.value.training?.perfomable_exercises || []).map((pe: any) => ({
            exercise_id: Number(pe.exercise_id),
            sets: (pe.sets || []).map((s: any) => ({ weight: Number(s.weight), repetitions: Number(s.repetitions), rest_duration: Number(s.rest_duration ?? 60) })),
        }))

        const payload = {
            weekdays: editModel.value.weekdays || [],
            training: {
                title: editModel.value.training?.title || '',
                perfomable_exercises: perf,
            },
        }
        const resp = await api.post(`/training/planned/update/${id}`, payload)
        planned.value = resp.data || planned.value
        $q.notify({ type: 'positive', message: 'Тренировка обновлена' })
        editDialog.value = false
    } catch (err) {
        console.error('Failed to update planned training', err)
        const status = (err as any)?.response?.status
        const data = (err as any)?.response?.data
        $q.notify({ type: 'negative', message: `Ошибка при обновлении тренировки${status ? ` (${status})` : ''}` })
        console.debug('server response:', status, data)
    }
}

async function confirmDelete() {
    const id = Number(route.query.id || route.params.id)
    if (!id) return
    try {
        await Dialog.create({ title: 'Подтвердите', message: 'Удалить тренировку?', cancel: true })
    } catch (e) {
        return
    }

    try {
        try {
            const token = localStorage.getItem('access_token')
            if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } catch (e) {}

        const resp = await api.post(`/training/planned/delete/${id}`)
        $q.notify({ type: 'positive', message: 'Тренировка удалена' })
        void router.push('/mainPage')
    } catch (err) {
        console.error('Failed to delete planned training', err)
        const status = (err as any)?.response?.status
        const data = (err as any)?.response?.data
        $q.notify({ type: 'negative', message: `Ошибка при удалении тренировки${status ? ` (${status})` : ''}` })
        console.debug('server response:', status, data)
    }
}

onMounted(() => { void loadPlanned() })

onMounted(() => {
    void fetchExercises()
})

function addSetToPerf(peIdx: number) {
    const pe = editModel.value.training.perfomable_exercises[peIdx]
    if (!pe) return
    if (!Array.isArray(pe.sets)) pe.sets = []
    pe.sets.push({ weight: 0, repetitions: 8, rest_duration: 60 })
}

function removeSetFromPerf(peIdx: number, sIdx: number) {
    const pe = editModel.value.training.perfomable_exercises[peIdx]
    if (!pe || !Array.isArray(pe.sets)) return
    pe.sets.splice(sIdx, 1)
}

function removePerfomableExercise(idx: number) {
    if (!Array.isArray(editModel.value.training.perfomable_exercises)) return
    editModel.value.training.perfomable_exercises.splice(idx, 1)
}

function addPerfomableExercise() {
    const id = newExerciseToAdd.value
    if (!id) return
    if (!Array.isArray(editModel.value.training.perfomable_exercises)) editModel.value.training.perfomable_exercises = []
    editModel.value.training.perfomable_exercises.push({ exercise_id: Number(id), sets: [{ weight: 0, repetitions: 8, rest_duration: 60 }] })
    newExerciseToAdd.value = null
}

// (no debug wrappers) confirmDelete is used directly from template
</script>

<style scoped>
.page-with-nav {
    padding-bottom: 88px
}
</style>
