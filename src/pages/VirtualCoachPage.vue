<template>
  <q-page class="page-with-nav column no-wrap">
    <q-toolbar class="bg-primary text-white q-px-md">
      <q-avatar size="32px" class="q-mr-sm">
        <img :src="botAvatar" alt="coach" />
      </q-avatar>
      <q-toolbar-title>Виртуальный коуч</q-toolbar-title>
    </q-toolbar>

    <div class="chat-area col bg-grey-1">
      <q-scroll-area ref="scrollAreaRef" class="fit">
        <div class="q-pa-md q-gutter-md">
          <q-chat-message
            v-for="m in messages"
            :key="m.id"
            :sent="m.mine"
            :text="[m.text]"
            :stamp="m.stamp"
            :avatar="m.mine ? userAvatar : botAvatar"
            :bg-color="m.mine ? 'primary' : 'white'"
            :text-color="m.mine ? 'white' : 'dark'"
          />

          <div v-if="typing" class="typing-indicator row items-center q-mt-sm">
            <q-avatar size="28px">
              <img :src="botAvatar" alt="bot" />
            </q-avatar>
            <div class="dots q-ml-sm">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </q-scroll-area>
    </div>

    <div class="composer q-pa-sm bg-white">
      <div class="row items-end no-wrap">
        <q-input
          v-model="draft"
          class="col"
          type="textarea"
          autogrow
          dense
          standout
          placeholder="Напишите сообщение..."
          @keyup.enter.exact="onSend"
        />
        <q-btn color="primary" round icon="send" class="q-ml-sm" :disable="!canSend" @click="onSend" />
      </div>
    </div>
  </q-page>
  <BottomNavBar v-model="activeTab" @navigate="onNavigate" />
</template>

<script setup lang="ts">
import BottomNavBar from 'src/components/BottomNavBar.vue'
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeTab = ref('chat')

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

// Messenger state
interface ChatMessage {
  id: number
  text: string
  mine: boolean
  stamp: string
}

const messages = ref<ChatMessage[]>([
  { id: 1, text: 'Привет! Я твой виртуальный коуч. Готов помочь с тренировкой 💪', mine: false, stamp: ts() },
  { id: 2, text: 'Привет! Давай составим план на сегодня.', mine: true, stamp: ts() },
  { id: 3, text: 'Отлично. Какая цель тренировки: сила, выносливость или жиросжигание?', mine: false, stamp: ts() },
])

const draft = ref('')
const typing = ref(false)
const scrollAreaRef = ref()

const userAvatar = '/public/icons/ProIcon.png'.replace('/public', '') // served from public root
const botAvatar = '/logo.jpg'

const canSend = computed(() => draft.value.trim().length > 0)

function ts() {
  return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function scrollToBottom() {
  void nextTick(() => {
    try {
      scrollAreaRef.value?.setScrollPosition('vertical', 10 ** 9, 300)
    } catch {
      // ignore
    }
  })
}

async function onSend() {
  if (!canSend.value) return
  const text = draft.value.trim()
  draft.value = ''
  const id = (messages.value.at(-1)?.id || 0) + 1
  messages.value.push({ id, text, mine: true, stamp: ts() })
  scrollToBottom()
  await simulateBotReply()
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

async function simulateBotReply() {
  typing.value = true
  await sleep(600 + Math.random() * 800)
  const suggestions: string[] = [
    'Принято. Предлагаю 5 упражнений на 30 минут. Готов?',
    'Могу адаптировать план под доступный инвентарь. Что у тебя есть?',
    'Хорошо! Сколько времени сегодня хочешь потратить?',
  ]
  const id = (messages.value.at(-1)?.id || 0) + 1
  const idx = Math.floor(Math.random() * suggestions.length)
  const pick = suggestions[idx]!
  messages.value.push({ id, text: pick, mine: false, stamp: ts() })
  typing.value = false
  scrollToBottom()
}

onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
.page-with-nav {
  padding-bottom: 88px;
}

.chat-area {
  min-height: 0; /* allows scroll-area to size correctly in column layout */
}

.composer {
  position: sticky;
  bottom: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

/* Typing indicator */
.dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9e9e9e;
  display: inline-block;
  animation: bounce 1.4s infinite ease-in-out both;
}
.dots span:nth-child(1) { animation-delay: -0.32s; }
.dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
</style>
