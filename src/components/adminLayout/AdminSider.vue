<template>
  <a-layout-sider class="admin-sider" :collapsed="collapsed">
    <a-menu mode="inline" :selected-keys="[currentKey]" :open-keys="openKeys" @click="onMenuClick">
      <template v-for="item in menu" :key="item.path">
        <a-sub-menu v-if="item.children && item.children.length" :key="item.path + '_submenu'">
          <template #title>
            <span v-if="item.icon" class="mr-2"><Icon :icon="item.icon" /></span>
            <span v-if="!collapsed">{{ item.label }}</span>
          </template>
          <a-menu-item v-for="child in item.children" :key="child.path" @click="() => onMenuClick(child.path)">
            <span v-if="child.icon" class="mr-2"><Icon :icon="child.icon" /></span>
            <span v-if="!collapsed">{{ child.label }}</span>
          </a-menu-item>
        </a-sub-menu>
        <a-menu-item v-else :key="item.path" @click="() => onMenuClick(item.path)">
          <span v-if="item.icon" class="mr-2"><Icon :icon="item.icon" /></span>
          <span v-if="!collapsed">{{ item.label }}</span>
        </a-menu-item>
      </template>
    </a-menu>
  </a-layout-sider>
</template>

<script setup lang="ts">
import type { MenuItem } from '@/composables/useMenus'
import { ADMIN_MENU_ITEMS } from '@/router/menu'
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 路由
const route = useRoute()
const router = useRouter()

// 菜单折叠
const collapsed = ref(false)
// 菜单数据
const menu = ref<MenuItem[]>(ADMIN_MENU_ITEMS)
// 当前激活的菜单项
const currentKey = computed(() => route.path)
// 菜单展开项目
const openKeys = computed(() => {
  if (collapsed.value) return []
  // 找到当前路由对应的父菜单并展开
  const currentPath = route.path
  const parentMenus = menu.value.filter(m => m.children && m.children.some(child => child.path === currentPath))
  return parentMenus.map(m => m.path + '_submenu')
})

// 菜单点击事件
function onMenuClick(key: string | { key: string }) {
  const path = typeof key === 'string' ? key : key.key
  router.push(path).catch(() => {})
}
</script>

<style scoped lang="less">
.admin-sider {
  height: 100%;
  width: 200px;
  background: #fff;
}

.mr-2 {
  font-size: 16px;
  padding-right: 3px;
}

.admin-sider :deep(.ant-menu-item) {
  color: #aa8469 !important;
  display: flex !important;
  align-items: center !important;
}
.admin-sider :deep(.ant-menu-item-selected) {
  color: var(--color-primary) !important;
}
.admin-sider :deep(.ant-menu-inline) {
  border: none !important;
}
.admin-sider :deep(.ant-menu-title-content) {
  display: flex !important;
  align-items: center !important;
  height: 40px !important;
}
</style>
