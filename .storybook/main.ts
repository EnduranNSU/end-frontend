import type { StorybookConfig } from '@storybook/vue3-vite'
import { fileURLToPath } from 'node:url'
import { mergeConfig } from 'vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  async viteFinalConfig(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          src: fileURLToPath(new URL('../src', import.meta.url)),
        },
      },
    })
  },
}

export default config
