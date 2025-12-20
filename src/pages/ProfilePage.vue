<template>
  <q-page class="q-pa-md page-with-nav">
    <section class="row no-wrap items-center q-gutter-sm q-mb-md">
      <q-avatar size="64px" color="grey-3" text-color="grey-6">
        <q-icon name="person" />
      </q-avatar>
      <div class="column">
        <div class="text-subtitle1 text-weight-medium">{{ profile.name }}</div>
        <div class="text-grey-7">{{ profile.workouts }} тренировок</div>
      </div>
      <q-space />
      <q-btn flat round icon="edit" @click="openEdit" class="q-mr-xs" />
      <q-btn flat round icon="ios_share" @click="onShare" :disable="shareBusy" :loading="shareBusy" />
    </section>

    <section class="q-mt-md">
      <h5 class="section-title">Информация об аккаунте</h5>
      <q-card flat bordered class="q-pa-md rounded-card">
        <q-input v-model="profile.email" type="email" label="Email" dense standout readonly />
      </q-card>
    </section>

    <section class="q-mt-lg">
      <h5 class="section-title">Замеры тела</h5>
      <div class="chips-grid q-mt-sm">
        <q-btn class="chip" outline no-caps :label="`Вес: ${profile.weight ?? '—'}`" @click="openEdit" />
        <q-btn class="chip" outline no-caps :label="`% жировой массы: ${profile.fatPercent ?? '—'}`" @click="openEdit" />
        <q-btn class="chip" outline no-caps :label="`Потребление калорий: ${profile.calories ?? '—'}`" @click="openEdit" />
      </div>
      <q-card flat bordered class="q-mt-sm rounded-card clickable" @click="openEdit">
        <div class="q-pa-md text-center">Части тела: {{ profile.bodyparts || '—' }}</div>
      </q-card>
    </section>

    <section class="q-mt-lg">
      <h5 class="section-title">Мониторинг</h5>
      <div class="text-grey-6 q-pt-xs">Скоро появятся графики прогресса.</div>
    </section>

    <section class="q-mt-xl flex flex-center">
      <div class="column items-center q-gutter-sm">
        <div class="text-subtitle1">Оформите премиум версию</div>
        <q-btn color="primary" unelevated no-caps label="Перейти к Pro" @click="toPro" />
      </div>
    </section>

    <q-dialog v-model="editOpened">
      <q-card style="min-width: 340px; max-width: 92vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1">Редактировать профиль</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-form @submit.prevent="saveEdit">
            <div class="q-gutter-md">
              <q-input v-model="draft.name" label="Имя" dense />
              <q-input v-model="draft.email" type="email" label="Email" dense />
              <q-input v-model.number="draft.weight" type="number" label="Вес" dense :suffix="'кг'" />
              <q-input v-model.number="draft.fatPercent" type="number" label="% жировой массы" dense :suffix="'%'" />
              <q-input v-model.number="draft.calories" type="number" label="Потребление калорий" dense :suffix="'ккал'" />
              <q-input v-model="draft.bodyparts" type="text" label="Части тела" dense autogrow />
            </div>
            <div class="row q-gutter-sm q-mt-md">
              <q-btn type="submit" color="primary" label="Сохранить" :loading="saving" />
              <q-btn flat color="grey-7" label="Отмена" v-close-popup />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
  <BottomNavBar v-model="activeTab" @navigate="onNavigate" />
</template>

<script setup lang="ts">
import BottomNavBar from 'src/components/BottomNavBar.vue'
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { copyToClipboard, useQuasar } from 'quasar'

const $q = useQuasar()

const route = useRoute()
const router = useRouter()

const activeTab = ref('profile')

function sync() {
  const p = route.path
  if (p.endsWith('/history')) activeTab.value = 'history'
  else if (p.endsWith('/exercises')) activeTab.value = 'exercises'
  else if (p.endsWith('/profile')) activeTab.value = 'profile'
  else if (p.endsWith('/coach')) activeTab.value = 'chat'
  else activeTab.value = 'add'
}

sync()
watch(() => route.path, sync)

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

type Profile = {
  name: string
  workouts: number
  email: string
  weight?: number | null
  fatPercent?: number | null
  calories?: number | null
  bodyparts?: string | null
}

const LS_KEY = 'enduran.profile'

const profile = ref<Profile>({
  name: 'Пайпик',
  workouts: 100,
  email: 'pipik@gmail.com',
  weight: null,
  fatPercent: null,
  calories: null,
  bodyparts: null,
})

onMounted(() => {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) Object.assign(profile.value, JSON.parse(raw))
  } catch (e) {
    console.warn('Failed to load profile from localStorage', e)
  }
})

function persist() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(profile.value)) } catch (e) {
    console.warn('Failed to save profile to localStorage', e)
  }
}

const editOpened = ref(false)
const saving = ref(false)
const draft = ref<Profile>({ ...profile.value })

function openEdit() {
  draft.value = { ...profile.value }
  editOpened.value = true
}

function saveEdit() {
  try {
    saving.value = true
    profile.value = { ...profile.value, ...draft.value }
    persist()
    editOpened.value = false
    $q.notify({ type: 'positive', message: 'Сохранено' })
  } finally {
    saving.value = false
  }
}

function toPro() { void router.push('/proad') }

const shareBusy = ref(false)
async function onShare() {
  try {
    shareBusy.value = true
    const shareData = {
      title: 'Мой профиль в Enduran',
      text: 'Посмотри мой профиль и тренировки в приложении Enduran',
      url: window.location.origin + '/profile',
    }
    if (navigator.share) await navigator.share(shareData)
    else {
      await copyToClipboard(shareData.url)
      $q.notify({ type: 'positive', message: 'Ссылка скопирована' })
    }
  } catch {
    $q.notify({ type: 'warning', message: 'Не удалось поделиться' })
  } finally {
    shareBusy.value = false
  }
}
</script>

<style scoped>
.page-with-nav { padding-bottom: 88px; }
.section-title { font-size: 16px; font-weight: 600; color: #2b2b2b; margin: 6px 0 8px; }
.rounded-card { border-radius: 12px; }
.chips-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
.chip { border-radius: 12px; }
.clickable { cursor: pointer; }
</style>
