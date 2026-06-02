<template>
  <div class="auth-page">
    <div class="auth-deco">🌿</div>
    <div class="auth-title">Добро пожаловать!</div>
    <div class="auth-subtitle">Войдите в аккаунт</div>

    <div class="ai-card auth-card">
      <label class="ai-label">Имя пользователя</label>
      <input v-model="username" class="ai-input" placeholder="Логин или email" autocomplete="username" />

      <label class="ai-label">Пароль</label>
      <input v-model="password" class="ai-input" type="password" placeholder="••••••••" autocomplete="current-password" />

      <button class="ai-pill-btn full" :disabled="submitting" @click="onSubmit">
        {{ submitting ? 'Входим…' : 'Войти' }}
      </button>

      <div class="auth-link">
        Нет аккаунта?
        <span class="auth-link-btn" @click="() => router.push('/signup')">Зарегистрироваться</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import { useRouter } from 'vue-router'

const $q = useQuasar()
const router = useRouter()

const username = ref('')
const password = ref('')
const submitting = ref(false)

async function onSubmit() {
  if (!username.value || !password.value) {
    $q.notify({ type: 'warning', message: 'Заполните все поля' })
    return
  }
  submitting.value = true
  try {
    const params = new URLSearchParams()
    params.append('grant_type', 'password')
    params.append('username', username.value)
    params.append('password', password.value)
    const resp = await api.post('/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    const data = resp.data
    if (data?.access_token) {
      localStorage.setItem('access_token', data.access_token)
      api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`
      $q.notify({ type: 'positive', message: 'Добро пожаловать!' })
      void router.push('/mainPage')
    }
  } catch (err: any) {
    const msg = err?.response?.data?.detail || 'Ошибка при входе'
    $q.notify({ type: 'negative', message: String(msg) })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 20px;
  background: var(--ai-bg);
}

.auth-deco {
  font-size: 64px;
  margin-bottom: 8px;
}

.auth-title {
  font-size: 26px;
  font-weight: 800;
  color: var(--ai-text);
  font-family: 'Nunito', sans-serif;
}

.auth-subtitle {
  font-size: 15px;
  color: var(--ai-shadow);
  margin-bottom: 24px;
  font-weight: 600;
}

.auth-card {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ai-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--ai-text);
  margin-bottom: 2px;
}

.ai-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 14px;
  border: 2px solid #e8dcc8;
  background: rgba(255,255,255,0.8);
  color: var(--ai-text);
  font-size: 15px;
  font-family: 'Nunito', sans-serif;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.ai-input:focus {
  border-color: var(--ai-teal);
}

.ai-pill-btn.full {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  margin-top: 6px;
}

.auth-link {
  text-align: center;
  font-size: 13px;
  color: var(--ai-shadow);
  margin-top: 4px;
}

.auth-link-btn {
  color: var(--ai-teal);
  font-weight: 700;
  cursor: pointer;
}
</style>
