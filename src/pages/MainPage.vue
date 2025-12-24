<template>
  <q-page class="q-pa-md main-page">
    <!-- Hero illustration -->
    <div class="pro">
      <img src="/icons/ProIcon.png" alt="Pro Ad" class="pro-image clickable" @click="onProAdClick" />
    </div>
    <div class="hero">
      <img src="/logo.jpg" alt="Virtual Coach Logo" class="hero-image clickable" @click="onHeroClick" />
    </div>

    <!-- Big rounded CTA button -->
    <div class="cta-wrapper">
      <q-btn class="quick-training" label="НАЧАТЬ ТЕКУЩУЮ ТРЕНИРОВКУ" no-caps unelevated size="lg"
        style="height: 10vh" />
    </div>

    <!-- My workouts (quick actions) -->
    <section class="section">
      <h3 class="section-title">Мои тренировки</h3>
      <div class="cards-grid">
        <!-- planned trainings from backend -->
        <q-card v-if="plannedLoading" class="card drop-hint">
          <div class="card-body">Загрузка...</div>
        </q-card>
        <q-card v-else-if="plannedTrainings.length" v-for="pt in plannedTrainings" :key="pt.id" class="card new-workout"
          @click="openPlanned(pt.id)">
          <div class="card-body">
            <div class="card-title">{{ pt.training?.title || 'Тренировка' }}</div>
            <div class="card-dots">{{ (pt.weekdays || []).join(', ') }}</div>
          </div>
        </q-card>

        <!-- only planned trainings are shown here -->
      </div>
      <!-- New training button under My workouts -->
      <div class="q-mt-md" style="display:flex; justify-content:center;">
        <q-btn unelevated color="primary" icon="add" label="Новая тренировка" @click="openCreatePlannedDialog" />
      </div>
    </section>

    <!-- folders removed: only 'Мои тренировки' supported in UI -->

    <!-- Fixed bottom nav -->
    <BottomNavBar v-model="activeTab" @navigate="onNavigate" />

    <!-- Create planned training dialog -->
    <q-dialog v-model="createDialog">
      <q-card style="min-width: 320px; max-width: 92vw">
        <q-card-section>
          <div class="text-h6">Создать запланированную тренировку</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="createPlanned">
            <div class="q-gutter-md">
              <q-input v-model="newPlanned.training.title" label="Название" dense />
              <q-select v-model="newPlanned.weekdays" label="Дни недели" multiple
                :options="['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']" use-chips dense />

              <div v-for="(pe, idx) in newPlanned.training.perfomable_exercises" :key="idx" class="q-mb-sm">
                <div class="row items-center q-gutter-sm">
                  <div class="col">
                    <q-select v-model.number="pe.exercise_id" :options="exerciseOptions" label="Упражнение" emit-value
                      map-options dense use-chips />
                  </div>
                  <div class="col-12 q-mt-sm">
                    <div v-for="(s, si) in pe.sets" :key="si" class="row items-center q-gutter-sm q-mb-xs">
                      <div class="col-4">
                        <q-input v-model.number="s.repetitions" label="reps" dense type="number" />
                      </div>
                      <div class="col-4">
                        <q-input v-model.number="s.weight" label="kg" dense type="number" />
                      </div>
                      <div class="col-auto">
                        <q-btn dense flat icon="delete" color="negative"
                          @click.prevent="removeSetFromExercise(idx, si)" />
                      </div>
                    </div>
                    <div class="row q-mt-xs">
                      <q-btn flat label="Добавить сет" @click.prevent="addSetToExercise(idx)" />
                    </div>
                  </div>
                  <div class="col-auto">
                    <q-btn dense flat icon="delete" color="negative" @click.prevent="removeExerciseRow(idx)" />
                  </div>
                </div>
              </div>

              <div class="row">
                <q-btn flat label="Добавить упражнение" @click.prevent="goToExercisesToAdd" />
              </div>

              <div class="row q-justify-end q-mt-md">
                <q-btn flat label="Отмена" color="grey" v-close-popup @click="() => (createDialog = false)" />
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
import { onMounted, computed, ref, watch } from 'vue'
import BottomNavBar from '../components/BottomNavBar.vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from 'src/boot/axios'
import { useQuasar } from 'quasar'
import { usePlannedDraftStore } from 'src/stores/plannedDraft'

// folders UI removed — keeping only planned trainings

const router = useRouter()
const route = useRoute()
const $q = useQuasar()

const draftStore = usePlannedDraftStore()

const activeTab = ref('add')

// planned trainings from backend
const plannedTrainings = ref<any[]>([])
const plannedLoading = ref(false)

// create planned training dialog state
const createDialog = ref(false)
const newPlanned = ref<any>({
  weekdays: [] as string[],
  training: {
    title: '',
    perfomable_exercises: [] as Array<{ exercise_id?: number; sets: Array<{ weight?: number; repetitions?: number; rest_duration?: number }> }>,
  },
})

// exercises list for select options
const exercises = ref<{ id: number; title: string }[]>([])

const exerciseOptions = computed(() => exercises.value.map((e) => ({ label: e.title, value: e.id })))

async function fetchExercises() {
  try {
    const resp = await api.get('/exercise/')
    const data = resp.data || []
    exercises.value = (data as any[]).map((x) => ({ id: Number(x.id), title: x.title || String(x.id) }))
  } catch (err) {
    console.warn('Failed to load exercises for select', err)
    exercises.value = []
  }
}

function addExerciseRow() {
  newPlanned.value.training.perfomable_exercises.push({ exercise_id: undefined, sets: [{ weight: 0, repetitions: 8, rest_duration: 60 }] })
}

function addSetToExercise(exIdx: number) {
  const pe = newPlanned.value.training.perfomable_exercises[exIdx]
  if (!pe) return
  if (!Array.isArray(pe.sets)) pe.sets = []
  pe.sets.push({ weight: 0, repetitions: 8, rest_duration: 60 })
}

function removeSetFromExercise(exIdx: number, setIdx: number) {
  const pe = newPlanned.value.training.perfomable_exercises[exIdx]
  if (!pe || !Array.isArray(pe.sets)) return
  pe.sets.splice(setIdx, 1)
}

function removeExerciseRow(idx: number) {
  newPlanned.value.training.perfomable_exercises.splice(idx, 1)
}

function goToExercisesToAdd() {
  // start a draft from current form values (so title/days persist) and navigate to exercises
  draftStore.startDraft({
    weekdays: newPlanned.value.weekdays || [],
    training: {
      title: newPlanned.value.training?.title || '',
      // preserve any already added exercises (if user prefilled some)
      perfomable_exercises: Array.isArray(newPlanned.value.training?.perfomable_exercises)
        ? JSON.parse(JSON.stringify(newPlanned.value.training.perfomable_exercises))
        : [],
    },
  })
  void router.push({ path: '/exercises', query: { fromDraft: '1' } })
}

async function createPlanned() {
  // basic validation
  // merge draft and current form values so user edits in the dialog are respected
  const merged: any = {}
  if (draftStore.draft) Object.assign(merged, JSON.parse(JSON.stringify(draftStore.draft)))
  // overlay current form values (newPlanned) so user edits take precedence
  Object.assign(merged, JSON.parse(JSON.stringify(newPlanned.value)))
  // ensure training shape
  merged.training = merged.training || { title: '', perfomable_exercises: [] }

  if (!merged.training.title) {
    $q.notify({ type: 'warning', message: 'Введите название тренировки' })
    return
  }
  if (!merged.weekdays || merged.weekdays.length === 0) {
    $q.notify({ type: 'warning', message: 'Выберите дни недели' })
    return
  }

  try {
    const payload = {
      weekdays: merged.weekdays,
      training: {
        title: merged.training.title,
        perfomable_exercises: (merged.training.perfomable_exercises || []).map((pe: any) => ({
          exercise_id: Number(pe.exercise_id),
          sets: (pe.sets || []).map((s: any) => ({ weight: Number(s.weight), repetitions: Number(s.repetitions), rest_duration: Number(s.rest_duration) })),
        })),
      },
    }

    const resp = await api.post('/training/planned/create', payload)
    const created = resp.data
    if (created) {
      // append to list
      plannedTrainings.value.unshift(created)
      $q.notify({ type: 'positive', message: 'Тренировка создана' })
      createDialog.value = false
      // reset form
      newPlanned.value = { weekdays: [], training: { title: '', perfomable_exercises: [] } }
      draftStore.clearDraft()
    }
  } catch (err) {
    console.error('Failed to create planned training', err)
    $q.notify({ type: 'negative', message: 'Ошибка при создании тренировки' })
  }
}

async function fetchPlannedTrainings() {
  plannedLoading.value = true
  try {
    const resp = await api.get('/training/planned')
    plannedTrainings.value = resp.data || []
  } catch (err) {
    console.error('Failed to load planned trainings', err)
    $q.notify({ type: 'negative', message: 'Не удалось загрузить запланированные тренировки' })
    plannedTrainings.value = []
  } finally {
    plannedLoading.value = false
  }
}

function openPlanned(id: number) {
  void router.push({ path: '/plannedTraining', query: { id: String(id) } })
}

onMounted(() => {
  syncTabWithRoute()
  // if we have a saved token, set Authorization header before fetching
  try {
    const token = localStorage.getItem('access_token')
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } catch (e) {
    // ignore
  }
  void fetchPlannedTrainings()
  void fetchExercises()
  // if we returned from exercises after adding an item, open the create dialog
  if (route.query.openCreate === '1' && draftStore.draft) {
    createDialog.value = true
    // clear the flag from URL shortly after opening so the dialog has time to render
    setTimeout(() => void router.replace({ query: { ...route.query, openCreate: undefined } }), 30000)
  }
})

watch(() => route.path, () => {
  syncTabWithRoute()
})

watch(() => route.query, (q) => {
  if (q.openCreate === '1' && draftStore.draft) {
    createDialog.value = true
    setTimeout(() => void router.replace({ query: { ...route.query, openCreate: undefined } }), 300)
  }
})

// when opening the create dialog, if there's a draft - populate the form from it
watch(createDialog, (val) => {
  if (val && draftStore.draft) {
    // only populate the form from draft when the form is empty
    const formEmpty = (!newPlanned.value.training || !newPlanned.value.training.title) &&
      (!Array.isArray(newPlanned.value.training.perfomable_exercises) || newPlanned.value.training.perfomable_exercises.length === 0) &&
      (!newPlanned.value.weekdays || newPlanned.value.weekdays.length === 0)
    if (formEmpty) {
      // shallow copy draft into editable newPlanned
      newPlanned.value = JSON.parse(JSON.stringify(draftStore.draft))
    }
  }
})

function syncTabWithRoute() {
  const p = route.path
  if (p.endsWith('/history')) activeTab.value = 'history'
  else if (p.endsWith('/exercises')) activeTab.value = 'exercises'
  else if (p.endsWith('/profile')) activeTab.value = 'profile'
  else if (p.endsWith('/coach')) activeTab.value = 'chat'
  else activeTab.value = 'add' // mainPage
}

function onCreateFolder() {
  // folders removed — no-op
}

function onRemoveTraining(folderId: string, trainingId: string) {
  // folders removed — no-op
}

function onDropHintClick(folderId?: string) {
  // folders/drop-hint removed
}

function onNavigate(key: string) {
  const map: Record<string, string> = {
    chat: '/coach',
    history: '/history',
    add: '/mainPage',
    exercises: '/exercises',
    profile: '/profile',
  }
  const to = map[key] || '/mainPage'
  if (route.path !== to) void router.push(to)
}

function onProAdClick() {
  void router.push('/proad')
}

function onHeroClick() {
  void router.push('/coach')
}

function openCreatePlannedDialog() {
  createDialog.value = true
}
</script>

<style scoped>
.main-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  /* отступ, чтобы контент не уходил под navbar */
  padding-bottom: 88px;
}

.hero {
  width: 100%;
  display: flex;
  justify-content: center;
}

.hero-image {
  width: 220px;
  max-width: 80vw;
  border-radius: 12px;
}

.pro {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}

.pro-image {
  position: relative;
  right: 5%;
}

.clickable {
  cursor: pointer;
}

.cta-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.quick-training {
  width: min(360px, 92vw);
  height: 56px;
  border-radius: 16px;
  background: #f0a629;
  /* mustard/amber */
  color: #1f1f1f;
  font-weight: 700;
  letter-spacing: 0.4px;
  box-shadow: 0 10px 0 rgba(0, 0, 0, 0.1), 0 2px 12px rgba(0, 0, 0, 0.18);
}

.quick-training:active {
  transform: translateY(1px);
  box-shadow: 0 8px 0 rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.16);
}

.section {
  width: 100%;
  max-width: 920px;
}

.section-title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #2b2b2b;
  margin: 12px 0 4px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  padding: 8px 12px 0;
  justify-items: stretch;
}

.card {
  width: 100%;
  height: 96px;
  border-radius: 14px;
}

.card .card-body {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.card .card-title {
  color: #5b5b5b;
  font-weight: 600;
}

.card .card-title.small {
  font-size: 13px;
  text-align: center;
  line-height: 1.2;
}

.new-workout {
  background: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.new-workout .card-dots {
  position: absolute;
  right: 6px;
  top: 6px;
  color: #bdbdbd;
}

.drop-hint {
  background: #f7fbff;
  border: 2px dashed #7fb3e7;
  color: #2d5c8a;
}
</style>
