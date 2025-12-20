<template>
  <q-page class="q-pa-md flex flex-center page-with-nav">
    <div class="column items-center q-gutter-sm">
      <img src="/icons/ProIcon.png" alt="Pro" style="width:64px;height:64px" />
      <h3 class="q-mt-sm">Pro версия</h3>
      <div class="text-grey-7">Скоро добавим описание и подписку</div>
    </div>
  </q-page>
  <BottomNavBar v-model="activeTab" @navigate="onNavigate" />
</template>

<script setup lang="ts">
import BottomNavBar from 'src/components/BottomNavBar.vue'
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeTab = ref('add')

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
</script>

<style scoped>
.page-with-nav { padding-bottom: 88px; }
</style>
