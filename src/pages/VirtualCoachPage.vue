<template>
  <q-page class="page-with-nav column no-wrap">
    <q-toolbar class="bg-primary text-white q-px-md">
      <q-avatar size="32px" class="q-mr-sm">
        <img :src="botAvatar" alt="coach" />
      </q-avatar>
      <q-toolbar-title>Виртуальный коуч</q-toolbar-title>
    </q-toolbar>

    <div class="chat-area col bg-grey-1">
      <div ref="scrollAreaRef" class="fit chat-scroll">
        <div class="q-pa-md q-gutter-md">
          <!-- Simple chat bubbles (always visible) -->
          <div v-for="m in messages" :key="m.id" class="chat-bubble" :class="{ mine: m.mine }">
            <div class="bubble-inner">
              <div class="bubble-text">{{ m.text }}</div>
              <div class="bubble-meta">{{ m.stamp }}</div>
            </div>
          </div>

          <div v-if="typing" class="typing-indicator row items-center q-mt-sm">
            <q-avatar size="28px">
              <img :src="botAvatar" alt="bot" />
            </q-avatar>
            <div class="dots q-ml-sm">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="composer q-pa-sm bg-white">
      <div class="row items-end no-wrap">
        <q-input v-model="draft" class="col" type="textarea" autogrow dense standout placeholder="Напишите сообщение..."
          @keyup.enter.exact="onSend" />
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
import { api } from 'src/boot/axios'
import { useQuasar } from 'quasar'

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
  { id: 1, text: 'Я твой тренер. Как могу помочь?', mine: false, stamp: ts() },
])

const draft = ref('')
const typing = ref(false)
const scrollAreaRef = ref()
const $q = useQuasar()
const userIdRef = ref<number | null>(null)

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const userAvatar = '/public/icons/ProIcon.png'.replace('/public', '') // served from public root
const botAvatar = '/logo.jpg'
const isDev = Boolean(import.meta.env.DEV)

const canSend = computed(() => draft.value.trim().length > 0)

function ts() {
  return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function scrollToBottom() {
  void nextTick(() => {
    try {
      const el = scrollAreaRef.value
      if (!el) return
      // plain div: scrollTop -> scrollHeight
      if (el instanceof HTMLElement) {
        el.scrollTop = el.scrollHeight
      } else if (typeof el.setScrollPosition === 'function') {
        // fallback for q-scroll-area
        el.setScrollPosition('vertical', 10 ** 9, 300)
      }
    } catch (e) {
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
  console.log('messages after push', JSON.parse(JSON.stringify(messages.value)))
  scrollToBottom()

  // send to agent backend via dev-server proxy (/api/agent -> localhost:8080)
  typing.value = true
  try {
    // determine chat_id and exercise_id from route (if provided)
    const chatId = String(route.query.chat_id || route.query.chatId || uuidv4())
    const exerciseId = Number(route.query.exercise_id || route.query.exerciseId || route.query.id || route.params.id || 0)

    const payload = {
      message: text,
      user_token: (localStorage.getItem('access_token') || ''),
      user_id: Number(userIdRef.value || 0),
      exercise_id: exerciseId,
      chat_id: chatId,
    }
    console.log('POST -> /agent/exercise (proxied to /api/agent/exercise)', payload)
    const resp = await api.post('/agent/exercise', payload)
    const replyText = typeof resp.data === 'string' ? resp.data : (resp.data?.reply || JSON.stringify(resp.data))
    const rid = (messages.value.at(-1)?.id || 0) + 1
    messages.value.push({ id: rid, text: replyText, mine: false, stamp: ts() })
    scrollToBottom()
  } catch (err) {
    console.error('Agent request failed', err)
    $q.notify({ type: 'negative', message: 'Ошибка связи с виртуальным коучем' })
  } finally {
    typing.value = false
  }
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
    // fetch current user id for agent requests
    ; (async () => {
      try {
        const resp = await api.get('/user/')
        userIdRef.value = Number(resp.data?.id || 0)
      } catch (e) {
        console.warn('Failed to fetch user id on VirtualCoach mount', e)
        userIdRef.value = null
      }
    })()
})
</script>

<style scoped>
.page-with-nav {
  padding-bottom: 88px;
}

.chat-area {
  min-height: 0;
  /* allows scroll-area to size correctly in column layout */
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
}

.chat-area .fit {
  flex: 1 1 auto;
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

.dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {

  0%,
  80%,
  100% {
    transform: scale(0);
  }

  40% {
    transform: scale(1);
  }
}

/* Chat bubble styles (simple, always-visible) */
.chat-bubble {
  display: flex;
  margin: 8px 0;
}

.chat-bubble.mine {
  justify-content: flex-end;
}

.chat-bubble .bubble-inner {
  max-width: 78%;
  padding: 10px 12px;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.chat-bubble.mine .bubble-inner {
  background: #0f62fe;
  /* primary */
  color: white;
}

.bubble-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.bubble-meta {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 6px;
  text-align: right;
}

.chat-bubble.mine .bubble-meta {
  color: rgba(255, 255, 255, 0.75);
}
</style>
