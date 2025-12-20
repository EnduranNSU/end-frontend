import { defineBoot } from '#q-app/wrappers'
import axios, { type AxiosInstance } from 'axios'

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance
    $api: AxiosInstance
  }
}

// В разработке используем относительный префикс `/api`, чтобы Vite/Quasar dev-server
// мог проксировать запросы и избежать CORS. В продакшне используем реальный
// `VITE_API_BASE`, если он указан.
const base = import.meta.env.DEV
  ? '/api' // проксируем через dev server
  : (import.meta.env.VITE_API_BASE || 'http://localhost:8080')

// Создаём общий экземпляр axios с предустановленным baseURL.
const api = axios.create({ baseURL: base })

export default defineBoot(({ app }) => {
  // Глобально регистрируем axios и наш экземпляр api,
  // чтобы в компонентах можно было использовать this.$axios / this.$api
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
