<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card class="auth-card">
      <q-card-section>
        <div class="text-h6">Вход</div>
        <div class="text-subtitle2">Войдите в свой аккаунт</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="onSubmit" ref="formRef">
          <q-input v-model="username" label="Имя пользователя / Email" dense outlined required />
          <q-input
            v-model="password"
            label="Пароль"
            dense
            outlined
            type="password"
            required
            class="q-mt-sm"
          />

          <div class="row items-center q-mt-md">
            <q-btn label="Войти" type="submit" color="primary" :loading="submitting" />
            <q-btn flat label="Регистрация" class="q-ml-sm" @click="goToSignup" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
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
const formRef = ref()

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
    if (data && data.access_token) {
      // Сохраняем токен и устанавливаем заголовок для последующих запросов
      localStorage.setItem('access_token', data.access_token)
      api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`

      $q.notify({ type: 'positive', message: 'Вход выполнен' })
      // debug: лог перед редиректом
      console.log('[signin] success, redirecting to /exercises')
      void router.push('/exercises')
    } else {
      $q.notify({ type: 'negative', message: 'Не удалось получить токен' })
    }
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error('signin error', err)
    const msg = (err as any)?.response?.data?.detail || 'Ошибка при входе'
    $q.notify({ type: 'negative', message: String(msg) })
  } finally {
    submitting.value = false
  }
}

function goToSignup() {
  void router.push('/signup')
}
</script>

<style scoped>
.auth-card {
  width: 380px;
}
</style>
