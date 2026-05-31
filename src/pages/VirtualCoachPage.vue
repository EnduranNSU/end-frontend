<template>
  <div class="coach-page">
    <!-- Header -->
    <div class="coach-header">
      <span class="coach-avatar">🤖</span>
      <div>
        <div class="coach-name">Виртуальный коуч</div>
        <div class="coach-status">{{ typing ? 'печатает…' : 'онлайн' }}</div>
      </div>
    </div>

    <!-- Messages -->
    <div class="chat-area" ref="scrollAreaRef">
      <div class="chat-inner">
        <div
          v-for="m in messages" :key="m.id"
          class="bubble-wrap"
          :class="{ mine: m.mine }"
        >
          <div v-if="!m.mine" class="bubble-avatar">🤖</div>
          <div class="bubble" :class="{ mine: m.mine }">
            <div class="bubble-text" v-html="formatMessageHtml(m.text)" />
            <div class="bubble-time">{{ m.stamp }}</div>
          </div>
        </div>

        <div v-if="typing" class="bubble-wrap">
          <div class="bubble-avatar">🤖</div>
          <div class="bubble typing-dots">
            <span /><span /><span />
          </div>
        </div>

        <div ref="bottomAnchorRef" style="height:1px;flex-shrink:0" />
      </div>
    </div>

    <!-- Day picker overlay -->
    <div v-if="showDayPicker" class="day-picker-overlay" @click.self="showDayPicker = false">
      <div class="day-picker-card">
        <div class="day-picker-title">В какие дни тренировка?</div>
        <div class="days-grid">
          <button
            v-for="d in weekdays" :key="d.val"
            class="day-btn"
            :class="{ active: selectedWeekdays.includes(d.val) }"
            @click="toggleDay(d.val)"
          >{{ d.label }}</button>
        </div>
        <div class="day-picker-actions">
          <button class="day-cancel-btn" @click="showDayPicker = false">Отмена</button>
          <button class="day-confirm-btn" :disabled="!selectedWeekdays.length || addingTraining" @click="addTraining">
            Добавить
          </button>
        </div>
      </div>
    </div>

    <!-- Add training button -->
    <div v-if="proposedTraining" class="add-training-bar">
      <button class="add-training-btn" :disabled="addingTraining" @click="openDayPicker">
        {{ addingTraining ? '⏳ Добавляем…' : '💪 Добавить предложенную тренировку' }}
      </button>
    </div>

    <!-- Composer -->
    <div class="composer">
      <textarea
        v-model="draft"
        class="composer-input"
        placeholder="Напишите сообщение…"
        rows="1"
        @keydown.enter.exact.prevent="onSend"
      />
      <button class="send-btn" :disabled="!canSend" @click="onSend">➤</button>
    </div>

    <BottomNavBar v-model="activeTab" @navigate="onNavigate" />
  </div>
</template>

<script setup lang="ts">
import BottomNavBar from 'src/components/BottomNavBar.vue'
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from 'src/boot/axios'
import { useQuasar } from 'quasar'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const activeTab = ref('chat')

function syncTab() {
  const p = route.path
  if (p.endsWith('/history')) activeTab.value = 'history'
  else if (p.endsWith('/exercises')) activeTab.value = 'exercises'
  else if (p.endsWith('/profile')) activeTab.value = 'profile'
  else if (p.endsWith('/coach')) activeTab.value = 'chat'
  else activeTab.value = 'add'
}
syncTab()
watch(() => route.path, syncTab)

function onNavigate(key: string) {
  const map: Record<string, string> = {
    chat: '/coach', history: '/history', add: '/mainPage',
    exercises: '/exercises', profile: '/profile',
  }
  const to = map[key] || '/mainPage'
  if (route.path !== to) void router.push(to)
}

interface ChatMsg { id: number; text: string; mine: boolean; stamp: string }

const messages = ref<ChatMsg[]>([
  { id: 1, text: 'Привет! Я твой коуч. Как могу помочь?', mine: false, stamp: ts() },
])

const draft = ref('')
const typing = ref(false)
const scrollAreaRef = ref<HTMLElement | null>(null)
const bottomAnchorRef = ref<HTMLElement | null>(null)
const userIdRef = ref<number | null>(null)
const canSend = computed(() => draft.value.trim().length > 0)
const proposedTraining = ref<any | null>(null)
const addingTraining = ref(false)
const showDayPicker = ref(false)
const selectedWeekdays = ref<string[]>([])

const weekdays = [
  { val: 'Mon', label: 'Пн' }, { val: 'Tue', label: 'Вт' }, { val: 'Wed', label: 'Ср' },
  { val: 'Thu', label: 'Чт' }, { val: 'Fri', label: 'Пт' }, { val: 'Sat', label: 'Сб' },
  { val: 'Sun', label: 'Вс' },
]

function toggleDay(d: string) {
  const idx = selectedWeekdays.value.indexOf(d)
  if (idx === -1) selectedWeekdays.value.push(d)
  else selectedWeekdays.value.splice(idx, 1)
}

function openDayPicker() {
  selectedWeekdays.value = []
  showDayPicker.value = true
}

function ts() {
  return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function formatMessageHtml(text: string) {
  if (!text) return ''
  const lines = String(text).replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (line.startsWith('### ')) {
      out.push(`<strong>${escapeHtml(line.slice(4).trim())}</strong>`)
      continue
    }
    if (line.trim() === '---') { out.push('<hr/>'); continue }
    if (line.startsWith('- ')) {
      const items: string[] = []
      let j = i
      for (; j < lines.length && lines[j]!.startsWith('- '); j++)
        items.push(`<li>${escapeHtml(lines[j]!.slice(2)).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</li>`)
      out.push(`<ul>${items.join('')}</ul>`)
      i = j - 1
      continue
    }
    if (line.trim()) {
      out.push(`<p>${escapeHtml(line).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</p>`)
    }
  }
  return out.join('')
}

function scrollToBottom() {
  void nextTick(() => {
    void nextTick(() => {
      const el = scrollAreaRef.value
      if (el) el.scrollTop = el.scrollHeight + 500
    })
  })
}

watch(messages, () => { scrollToBottom() }, { deep: true })
watch(typing, () => { scrollToBottom() })

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

async function onSend() {
  if (!canSend.value) return
  const text = draft.value.trim()
  draft.value = ''
  messages.value.push({ id: Date.now(), text, mine: true, stamp: ts() })
  scrollToBottom()
  typing.value = true
  try {
    const chatId = String(route.query.chat_id || route.query.chatId || uuidv4())
    const mode = String(route.query.mode || '')
    const exerciseId = Number(route.query.exercise_id || route.query.exerciseId || 0)

    const payload: any = {
      message: text,
      user_token: localStorage.getItem('access_token') || '',
      user_id: Number(userIdRef.value || 0),
      chat_id: chatId,
    }
    if (mode !== 'tell_about' && mode !== 'prepare_trainning') payload.exercise_id = exerciseId

    let endpoint = '/agent/exercise'
    if (mode === 'tell_about') endpoint = '/agent/tell_about'
    else if (mode === 'prepare_trainning') endpoint = '/agent/prepare_trainning'

    const resp = await api.post(endpoint, payload)
    let replyText: string
    if (mode === 'prepare_trainning' && resp.data?.text !== undefined) {
      replyText = resp.data.text
      if (resp.data.training) proposedTraining.value = resp.data.training
    } else {
      replyText = typeof resp.data === 'string' ? resp.data : (resp.data?.reply || JSON.stringify(resp.data))
    }
    messages.value.push({ id: Date.now() + 1, text: replyText, mine: false, stamp: ts() })
    scrollToBottom()
  } catch {
    $q.notify({ type: 'negative', message: 'Ошибка связи с коучем' })
  } finally {
    typing.value = false
  }
}

async function addTraining() {
  if (!proposedTraining.value || !selectedWeekdays.value.length) return
  addingTraining.value = true
  try {
    await api.post('/training/planned/create', {
      weekdays: selectedWeekdays.value,
      training: proposedTraining.value,
    })
    proposedTraining.value = null
    showDayPicker.value = false
    $q.notify({ type: 'positive', message: 'Тренировка добавлена в план!' })
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось добавить тренировку' })
  } finally {
    addingTraining.value = false
  }
}

onMounted(async () => {
  scrollToBottom()
  try {
    const resp = await api.get('/user/')
    userIdRef.value = Number(resp.data?.id || 0)
  } catch { /* */ }
})
</script>

<style scoped>
.coach-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--ai-bg);
  max-width: 480px;
  margin: 0 auto;
  padding-bottom: 68px;
}

.coach-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px 12px;
  background: var(--ai-teal);
  color: #fff;
  flex-shrink: 0;
}

.coach-avatar { font-size: 32px; }

.coach-name {
  font-size: 17px;
  font-weight: 800;
  font-family: 'Nunito', sans-serif;
}

.coach-status {
  font-size: 12px;
  opacity: 0.85;
}

.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  scrollbar-width: thin;
  scrollbar-color: #d4c9b5 transparent;
}

.chat-area::-webkit-scrollbar { width: 4px; }
.chat-area::-webkit-scrollbar-track { background: transparent; }
.chat-area::-webkit-scrollbar-thumb { background: #d4c9b5; border-radius: 4px; }
.chat-area::-webkit-scrollbar-thumb:hover { background: #b8a99a; }

.chat-inner {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bubble-wrap {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.bubble-wrap.mine { flex-direction: row-reverse; }

.bubble-avatar { font-size: 24px; flex-shrink: 0; }

.bubble {
  max-width: 78%;
  background: rgba(255,255,255,0.85);
  border-radius: 18px 18px 18px 4px;
  padding: 10px 14px;
  box-shadow: 0 3px 0 0 var(--ai-shadow);
}

.bubble.mine {
  background: var(--ai-teal);
  color: #fff;
  border-radius: 18px 18px 4px 18px;
  box-shadow: 0 3px 0 0 #0fa89b;
}

.bubble-text {
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.bubble-text :deep(p) { margin: 4px 0; }
.bubble-text :deep(ul) { margin: 6px 0 6px 16px; }
.bubble-text :deep(li) { margin: 3px 0; }
.bubble-text :deep(strong) { font-weight: 700; }

.bubble-time {
  font-size: 10px;
  opacity: 0.6;
  margin-top: 5px;
  text-align: right;
}

/* Typing dots */
.typing-dots {
  display: flex;
  gap: 5px;
  padding: 14px 16px;
}

.typing-dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ai-shadow);
  animation: dot-bounce 1.4s infinite ease-in-out both;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* Composer */
.composer {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(247, 243, 223, 0.95);
  border-top: 2px solid #e8dcc8;
  flex-shrink: 0;
}

.composer-input {
  flex: 1;
  resize: none;
  border-radius: 20px;
  border: 2px solid #e8dcc8;
  background: rgba(255,255,255,0.8);
  color: var(--ai-text);
  font-size: 14px;
  font-family: 'Nunito', sans-serif;
  padding: 10px 14px;
  outline: none;
  max-height: 120px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #d4c9b5 transparent;
}

.composer-input::-webkit-scrollbar { width: 3px; }
.composer-input::-webkit-scrollbar-track { background: transparent; }
.composer-input::-webkit-scrollbar-thumb { background: #d4c9b5; border-radius: 3px; }

.composer-input:focus { border-color: var(--ai-teal); }

.send-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: var(--ai-teal);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 3px 0 0 #0fa89b;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s, box-shadow 0.1s;
}

.send-btn:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 0 #0fa89b;
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Add training bar */
.add-training-bar {
  padding: 8px 12px;
  background: rgba(247, 243, 223, 0.98);
  border-top: 2px solid #e8dcc8;
  flex-shrink: 0;
}

.add-training-btn {
  width: 100%;
  padding: 13px;
  border-radius: 16px;
  border: none;
  background: var(--ai-teal);
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  font-family: 'Nunito', sans-serif;
  cursor: pointer;
  box-shadow: 0 4px 0 0 #0fa89b;
  transition: transform 0.1s, box-shadow 0.1s;
}

.add-training-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 0 #0fa89b;
}

.add-training-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Day picker overlay */
.day-picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 80px;
}

.day-picker-card {
  background: var(--ai-bg);
  border-radius: 24px 24px 16px 16px;
  padding: 24px 20px 20px;
  width: min(440px, 96vw);
  box-shadow: 0 -4px 0 0 var(--ai-shadow);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.day-picker-title {
  font-size: 17px;
  font-weight: 800;
  color: var(--ai-text);
  font-family: 'Nunito', sans-serif;
}

.days-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.day-btn {
  padding: 8px 14px;
  border-radius: 20px;
  border: 2px solid #e8dcc8;
  background: rgba(255,255,255,0.8);
  color: var(--ai-text);
  font-size: 14px;
  font-weight: 700;
  font-family: 'Nunito', sans-serif;
  cursor: pointer;
  transition: all 0.1s;
}

.day-btn.active {
  background: var(--ai-teal);
  border-color: var(--ai-teal);
  color: #fff;
}

.day-picker-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.day-cancel-btn {
  padding: 11px 20px;
  border-radius: 14px;
  border: 2px solid #e8dcc8;
  background: transparent;
  color: var(--ai-text);
  font-size: 14px;
  font-weight: 700;
  font-family: 'Nunito', sans-serif;
  cursor: pointer;
}

.day-confirm-btn {
  padding: 11px 20px;
  border-radius: 14px;
  border: none;
  background: var(--ai-teal);
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  font-family: 'Nunito', sans-serif;
  cursor: pointer;
  box-shadow: 0 3px 0 0 #0fa89b;
}

.day-confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
