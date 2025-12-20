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
        <q-card class="card new-workout" @click="onDropHintClick()">
          <div class="card-body">
            <div class="card-title">Новая тренировка</div>
            <div class="card-dots">•••</div>
          </div>
        </q-card>

        <q-card class="card drop-hint">
          <div class="card-body">
            <div class="card-title small" @click="onDropHintClick()">Перетащите шаблон<br />или нажмите, чтобы добавить
            </div>
          </div>
        </q-card>
      </div>
    </section>

    <!-- Folders and their trainings -->
    <section class="section">
      <div class="toolbar q-mb-sm" style="display:flex; gap:8px; justify-content:center;">
        <q-btn color="primary" flat icon="add" label="Добавить папку" @click="onCreateFolder" />
      </div>

      <div v-if="!folders.length" class="q-pa-sm flex column items-center" style="opacity:.7;">
        <div>Папок пока нет. Создайте первую.</div>
      </div>

      <div v-for="folder in folders" :key="folder.id" class="q-mt-md">
        <h4 class="section-title" style="margin-top: 8px;">{{ folder.name }}</h4>
        <div class="cards-grid">
          <!-- Show drop hint when folder is empty -->
          <q-card v-if="!(folder.trainings && folder.trainings.length)" class="card drop-hint"
            @click="onDropHintClick(folder.id)">
            <div class="card-body">
              <div class="card-title small">Перетащите шаблон<br />или нажмите, чтобы добавить</div>
            </div>
          </q-card>

          <!-- Render trainings of folder -->
          <q-card v-for="t in (folder.trainings || [])" :key="t.id" class="card new-workout">
            <div class="card-body">
              <div class="card-title">{{ t.name }}</div>
              <q-btn class="card-dots" size="sm" flat round icon="delete"
                @click.stop="onRemoveTraining(folder.id, t.id)" />
            </div>
          </q-card>
        </div>
      </div>
    </section>

    <!-- Fixed bottom nav -->
    <BottomNavBar v-model="activeTab" @navigate="onNavigate" />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { useFoldersStore } from '../stores/folders'
import BottomNavBar from '../components/BottomNavBar.vue'
import { useRouter, useRoute } from 'vue-router'

const foldersStore = useFoldersStore()
const folders = computed(() => foldersStore.folders)

const router = useRouter()
const route = useRoute()

const activeTab = ref('add')

onMounted(() => {
  foldersStore.refreshFromStorage()
  syncTabWithRoute()
})

watch(() => route.path, () => {
  syncTabWithRoute()
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
  foldersStore.addFolder()
}

function onRemoveTraining(folderId: string, trainingId: string) {
  foldersStore.removeTraining(folderId, trainingId)
}

function onDropHintClick(folderId?: string) {
  console.log('Drop-hint clicked', folderId)
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
