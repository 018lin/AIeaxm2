<script setup lang="ts">
import type { ThemeConfig } from 'ant-design-vue/lib/config-provider/context'
import { computed, onMounted, onUnmounted } from 'vue'

const themeConfig = computed<ThemeConfig>(() => ({
  token: {
    colorPrimary: '#EC7A2E',
  },
  // components: {
  //   Button: {
  //     colorPrimary: '#EC7A2E', // 按钮主色
  //     colorLink: '#EC7A2E', // 链接按钮颜色
  //   },
  // },
}))

const handleContextMenu = (e: MouseEvent) => {
  if ((e.target as HTMLElement).tagName === 'IMG') {
    e.preventDefault()
  }
}

onMounted(() => {
  document.addEventListener('contextmenu', handleContextMenu)
})

onUnmounted(() => {
  document.removeEventListener('contextmenu', handleContextMenu)
})
</script>

<template>
  <a-config-provider :theme="themeConfig">
    <div class="relative-full-bg">
      <div class="fixed">
        <div class="absolute top-left"></div>
        <div class="absolute bottom-right"></div>
      </div>
      <div>
        <router-view />
      </div>
    </div>
  </a-config-provider>
</template>

<style scoped>
div,
p,
h1 {
  padding: 0;
  margin: 0;
}
</style>
