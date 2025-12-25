<template>
    <q-page class="q-pa-md main-page">
        <h3 class="section-title">Трекер выполненных тренировок</h3>

        <section class="section">
            <div class="cards-grid">
                <q-card v-if="loading" class="card drop-hint">
                    <div class="card-body">Загрузка...</div>
                </q-card>

                <q-card v-else-if="items.length" v-for="it in items" :key="it.id" class="card new-workout"
                    @click="openPerformed(it.id)">
                    <div class="card-body">
                        <div class="card-title">{{ it.training?.title || 'Тренировка' }}</div>
                        <div class="card-dots">{{ it.date || '' }}</div>
                    </div>
                </q-card>

            </div>

            <div class="q-mt-md" style="display:flex; justify-content:center;">
                <q-btn unelevated color="primary" icon="add" label="Новая выполненная" @click="openCreate" />
            </div>
        </section>

        <q-dialog v-model="createDialog">
            <q-card style="min-width:320px; max-width:92vw">
                <q-card-section>
                    <div class="text-h6">Добавить выполненную тренировку</div>
                </q-card-section>
                <q-card-section>
                    <q-form @submit.prevent="createPerformed">
                        <div class="q-gutter-md">
                            <q-input v-model="model.date" label="Дата (YYYY-MM-DD)" dense />
                            <q-input v-model="model.training.title" label="Название" dense />

                            <div class="row q-justify-end q-mt-md">
                                <q-btn flat label="Отмена" color="grey" v-close-popup
                                    @click="() => (createDialog = false)" />
                                <q-btn color="primary" label="Создать" type="submit" />
                            </div>
                        </div>
                    </q-form>
                </q-card-section>
            </q-card>
        </q-dialog>

    </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from 'src/boot/axios'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

const router = useRouter()
const $q = useQuasar()

const items = ref<any[]>([])
const loading = ref(false)
const createDialog = ref(false)
const model = ref<any>({ date: '', training: { title: '' } })

async function fetchItems() {
    loading.value = true
    try {
        const resp = await api.get('/training/user_performed')
        items.value = resp.data || []
    } catch (err) {
        console.error('Failed to load performed trainings', err)
        $q.notify({ type: 'negative', message: 'Не удалось загрузить выполненные тренировки' })
    } finally {
        loading.value = false
    }
}

function openPerformed(id: number) {
    void router.push({ path: '/performedTraining', query: { id: String(id) } })
}

function openCreate() {
    // default the date to today so user doesn't have to type it
    try {
        const today = new Date().toISOString().split('T')[0]
        model.value.date = today
    } catch (e) {
        // ignore
    }
    createDialog.value = true
}

async function createPerformed() {
    try {
        // ensure date is present (server requires it); default to today when empty
        const date = model.value.date || new Date().toISOString().split('T')[0]

        const perf = (model.value.training?.perfomable_exercises || []).map((pe: any) => ({
            exercise_id: Number(pe.exercise?.id ?? pe.exercise_id ?? 0),
            sets: (pe.sets || []).map((s: any) => ({ weight: Number(s.weight || 0), repetitions: Number(s.repetitions || 0), rest_duration: Number(s.rest_duration || 0) })),
        }))
        const payload = {
            date: date,
            training: {
                title: model.value.training?.title || '',
                perfomable_exercises: perf,
            },
        }
        const resp = await api.post('/training/user_performed/create', payload)
        const created = resp.data
        if (created) {
            items.value.unshift(created)
            $q.notify({ type: 'positive', message: 'Выполнение добавлено' })
            createDialog.value = false
            model.value = { date: '', training: { title: '' } }
        }
    } catch (err) {
        console.error('Failed to create performed', err)
        $q.notify({ type: 'negative', message: 'Ошибка при создании' })
    }
}

onMounted(() => { void fetchItems() })
</script>

<style scoped>
.main-page {
    padding-bottom: 88px
}

.section-title {
    text-align: center;
    margin: 12px 0
}

.cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
    padding: 8px 12px 0
}

.card {
    height: 96px;
    border-radius: 14px
}

.card .card-body {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative
}

.card .card-title {
    font-weight: 600
}

.card .card-dots {
    position: absolute;
    right: 6px;
    top: 6px;
    color: #bdbdbd
}
</style>
