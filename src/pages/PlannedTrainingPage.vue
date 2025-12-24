<template>
    <q-page class="q-pa-md page-with-nav">
        <div class="row items-center q-mb-md">
            <q-btn dense flat round icon="arrow_back" @click="goBack" />
            <div class="text-h6 text-weight-medium q-ml-sm">{{ planned?.training?.title || 'Тренировка' }}</div>
        </div>

        <q-card flat bordered class="q-pa-md rounded-card" v-if="loading">
            <div class="text-center">Загрузка тренировки...</div>
        </q-card>

        <q-card flat bordered class="q-pa-md rounded-card" v-else-if="!planned">
            <div class="text-center">Тренировка не найдена.</div>
        </q-card>

        <div v-else>
            <q-card flat bordered class="q-pa-md rounded-card q-mb-md">
                <div class="text-subtitle1">Дни недели: {{ (planned.weekdays || []).join(', ') || '—' }}</div>
            </q-card>

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
    </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from 'src/boot/axios'
import { useQuasar } from 'quasar'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const planned = ref<any | null>(null)
const loading = ref(true)

async function loadPlanned() {
    loading.value = true
    const id = Number(route.query.id || route.params.id)
    if (!id) {
        $q.notify({ type: 'negative', message: 'Не указан id тренировки' })
        void router.push('/mainPage')
        return
    }

    try {
        const resp = await api.get(`/training/planned/${id}`)
        planned.value = resp.data || null
    } catch (err) {
        console.error('Failed to load planned training', err)
        $q.notify({ type: 'negative', message: 'Не удалось загрузить тренировку' })
        planned.value = null
    } finally {
        loading.value = false
    }
}

function goBack() {
    void router.back()
}

onMounted(() => { void loadPlanned() })
</script>

<style scoped>
.page-with-nav {
    padding-bottom: 88px
}
</style>
