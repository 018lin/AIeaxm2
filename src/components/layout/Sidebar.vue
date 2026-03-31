<template>
  <div class="sider-box app-surface" :class="{ collapsed: collapsed }" v-show="hasChildren">
    <div
      class="sider-toggle"
      v-show="hasChildren"
      :aria-label="collapsed ? '展开侧栏' : '折叠侧栏'"
      @click="collapsed = !collapsed"
    >
      <p v-show="!collapsed" class="sider-toggle-text">{{ parent }}</p>
      <p class="sider-toggle-icon">
        <PicLeftOutlined v-if="collapsed && menu.length" style="font-size: 20px; color: var(--color-primary)" />
        <PicRightOutlined v-else style="font-size: 20px; color: var(--color-primary)" />
      </p>
    </div>
    <aside class="sider">
      <a-menu
        mode="inline"
        :selected-keys="[currentKey]"
        :default-open-keys="openKeys"
        :inline-collapsed="collapsed"
        @click="onMenuClick"
      >
        <template v-for="item in menu" :key="item.path">
          <a-sub-menu v-if="item.children && item.children.length" :key="item.path + '_submenu'">
            <template #title>
              <span v-if="item.icon" class="mr-2"><Icon :icon="item.icon" /></span>
              <span v-if="!collapsed">{{ item.label }}</span>
            </template>
            <a-menu-item v-for="child in item.children" :key="child.path" @click="() => onMenuClick(child.path)">
              <!-- <span v-if="child.icon" class="mr-2"><Icon :icon="child.icon" /></span> -->
              <span v-if="!collapsed">{{ child.label }}</span>
            </a-menu-item>
          </a-sub-menu>
          <a-menu-item v-else :key="item.path" @click="() => onMenuClick(item.path)">
            <span v-if="item.icon" class="mr-2"><Icon :icon="item.icon" /></span>
            <span v-if="!collapsed">{{ item.label }}</span>
          </a-menu-item>
        </template>
      </a-menu>
    </aside>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from '@/composables/useMenus'
import { PicLeftOutlined, PicRightOutlined } from '@ant-design/icons-vue'
import { Icon } from '@iconify/vue'
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps<{ menu: MenuItem[]; hasChildren: boolean; parent: string }>()
const route = useRoute()
const router = useRouter()

const collapsed = ref(false)

watchEffect(() => {
  collapsed.value = !props.hasChildren
})

const currentKey = computed(() => route.path)
const openKeys = computed(() => {
  if (collapsed.value) return []
  return props.menu.filter(m => m.children && m.children.length).map(m => m.path + '_submenu')
})

function onMenuClick(key: string | { key: string }) {
  const path = typeof key === 'string' ? key : key.key
  router.push(path).catch(() => {})
}
</script>

<style scoped lang="less">
.collapsed {
  width: 80px !important;
  .sider-toggle {
    justify-content: center !important;
  }
}
.sider-box {
  width: 200px;
  position: relative;
  margin-right: 20px;
  background: #ffffff;
  border-radius: 18px;
}
.sider-toggle {
  width: 100%;
  height: 60px;
  border-radius: 18px 18px 0 0;
  padding: 16px 16px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f2ebe6;
}
.sider-toggle-text {
  font-weight: 600;
  font-size: 20px;
}

.sider-toggle-icon {
  cursor: pointer;
}

.sider {
  width: 100%;
}
.mr-2 {
  font-size: 16px;
  margin: 5px 3px 0 0;
}

.sider :deep(.ant-menu-item) {
  color: #aa8469 !important;
  display: flex !important;
  align-items: center !important;
}
.sider :deep(.ant-menu-item-selected) {
  color: var(--color-primary) !important;
}
.sider :deep(.ant-menu-inline) {
  border: none !important;
}
.sider :deep(.ant-menu-title-content) {
  display: flex !important;
  align-items: center !important;
  height: 40px !important;
}
</style>
