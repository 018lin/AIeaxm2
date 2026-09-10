import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const apiBase = env.VITE_API_BASE || 'http://localhost:48080/app'
  const apiOrigin = /^https?:\/\//i.test(apiBase) ? new URL(apiBase).origin : 'http://localhost:48080'

  return {
    plugins: [vue()],
    base: '/',
    css: {
      preprocessorOptions: {
        less: {
          math: 'always',
          javascriptEnabled: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        // 修复 VChart 依赖 roughjs 在部分环境下的默认导出问题
        roughjs: fileURLToPath(new URL('./node_modules/roughjs/bundled/rough.esm.js', import.meta.url)),
        'roughjs/bundled/rough.js': fileURLToPath(
          new URL('./node_modules/roughjs/bundled/rough.esm.js', import.meta.url)
        ),
      },
    },
    server: {
      proxy: {
        '/files': {
          target: apiOrigin,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          // JS 分块
          manualChunks: id => {
            if (id.includes('node_modules')) {
              if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
                return 'vue-vendor'
              }
              if (id.includes('ant-design-vue')) {
                return 'ui-vendor'
              }
            }
          },
          // 自定义文件命名
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: assetInfo => {
            // CSS 文件
            if (assetInfo.name?.endsWith('.css')) {
              return 'css/[name]-[hash][extname]'
            }
            // 图片等静态资源
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name || '')) {
              return 'img/[name]-[hash][extname]'
            }
            // 字体文件
            if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name || '')) {
              return 'fonts/[name]-[hash][extname]'
            }
            return 'assets/[name]-[hash][extname]'
          },
        },
      },
      // CSS 代码拆分
      cssCodeSplit: true,
      // chunk 大小警告限制
      chunkSizeWarningLimit: 1000,
    },
  }
})
