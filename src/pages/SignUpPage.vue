<template>
  <div class="auth-page">
    <div class="auth-deco">🌱</div>
    <div class="auth-title">Создать аккаунт</div>
    <div class="auth-subtitle">Начни свой путь к форме!</div>

    <div class="ai-card auth-card">
      <label class="ai-label">Имя</label>
      <input v-model="name" class="ai-input" placeholder="Как тебя зовут?" autocomplete="name" />

      <label class="ai-label">Email</label>
      <input v-model="email" class="ai-input" type="email" placeholder="email@example.com" autocomplete="email" />

      <label class="ai-label">Пароль</label>
      <input v-model="password" class="ai-input" type="password" placeholder="••••••••" autocomplete="new-password" />

      <button class="ai-pill-btn full" :disabled="submitting" @click="onSubmit">
        {{ submitting ? 'Регистрируем…' : 'Зарегистрироваться' }}
      </button>

      <div class="auth-link">
        Уже есть аккаунт?
        <span class="auth-link-btn" @click="() => router.push('/signin')">Войти</span>
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

const name = ref('')
const email = ref('')
const password = ref('')
const submitting = ref(false)

async function onSubmit() {
  if (!name.value || !email.value || !password.value) {
    $q.notify({ type: 'warning', message: 'Заполните все поля' })
    return
  }
  submitting.value = true
  try {
    await api.post('/signup/', { name: name.value, email: email.value, password: password.value })
    $q.notify({ type: 'positive', message: 'Добро пожаловать!' })
    void router.push('/signin')
  } catch (err: any) {
    const msg = err?.response?.data?.detail || 'Ошибка при регистрации'
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

.auth-deco { font-size: 64px; margin-bottom: 8px; }

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

.ai-input:focus { border-color: var(--ai-teal); }

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
