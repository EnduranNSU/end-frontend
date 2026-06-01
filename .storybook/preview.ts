import type { Preview } from '@storybook/vue3'
import { setup } from '@storybook/vue3'
import { Quasar } from 'quasar'
import 'quasar/dist/quasar.css'
import '../src/css/app.scss'

setup((app) => {
  app.use(Quasar, { plugins: {} })
})

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'app',
      values: [{ name: 'app', value: 'rgb(247, 243, 223)' }],
    },
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}

export default preview
