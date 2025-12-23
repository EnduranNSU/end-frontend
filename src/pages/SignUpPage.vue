<template>
    <q-page class="q-pa-md flex flex-center">
        <q-card class="auth-card">
            <q-card-section>
                <div class="text-h6">Регистрация</div>
                <div class="text-subtitle2">Создайте новый аккаунт</div>
            </q-card-section>

            <q-card-section>
                <q-form @submit.prevent="onSubmit">
                    <q-input v-model="name" label="Имя" dense outlined required />
                    <q-input v-model="email" label="Email" dense outlined required class="q-mt-sm" />
                    <q-input v-model="password" label="Пароль" dense outlined type="password" required
                        class="q-mt-sm" />

                    <div class="row items-center q-mt-md">
                        <q-btn label="Зарегистрироваться" type="submit" color="primary" :loading="submitting" />
                        <q-btn flat label="Войти" class="q-ml-sm" @click="goToSignin" />
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
        const body = { name: name.value, email: email.value, password: password.value }
        const resp = await api.post('/signup/', body)
        $q.notify({ type: 'positive', message: 'Регистрация прошла успешно' })
        // debug: лог перед редиректом
        console.log('[signup] success, redirecting to /profile')
        // после успешной регистрации переходим на профиль
        void router.push('/profile')
    } catch (err: any) {
        console.error('signup error', err)
        const msg = (err as any)?.response?.data?.detail || 'Ошибка при регистрации'
        $q.notify({ type: 'negative', message: String(msg) })
    } finally {
        submitting.value = false
    }
}

function goToSignin() {
    void router.push('/signin')
}
</script>

<style scoped>
.auth-card {
    width: 420px;
}
</style>
