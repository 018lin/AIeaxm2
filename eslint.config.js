import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import { defineConfig } from 'eslint-define-config'
import pluginTs from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default defineConfig([
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    plugins: {
      '@typescript-eslint': pluginTs
    },
    files: ['**/*.{js,mjs,jsx,vue,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      extraFileExtensions: ['.vue'],
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        __dirname: true
      }
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-multiple-template-root': 'off',
      'vue/require-default-prop': 'off',
      'vue/no-v-html': 'off',
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-unused-vars': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'semi': ['error', 'never'],
      'quotes': ['error', 'single'],
      'comma-dangle': 'off',
      'indent': 'off',
      'max-len': ['warn', { code: 120 }],
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn'
    },
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.d.ts',
      'coverage/**'
    ]
  }
  ,
  {
    files: ['**/*.d.ts'],
    rules: {
      'semi': 'off'
    }
  }
])