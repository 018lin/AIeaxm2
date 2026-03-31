<template>
  <div class="stratified-sidebar flex-col gap-12">
    <!-- Tabs -->
    <div class="sidebar-tabs">
      <button
        v-for="tab in allTabs"
        :key="tab.key"
        class="sidebar-tab"
        :class="{ active: activeTab === tab.key, disabled: tab.key === 'platform' }"
        @click="changeTab(tab.key)"
      >
        <template v-if="tab.key === 'platform'">
          <a-tooltip>
            <template #title>未开放</template>
            {{ tab.label }}
          </a-tooltip>
        </template>
        <template v-else>{{ tab.label }}</template>
      </button>
    </div>

    <!-- Tree Panel -->
    <div class="sidebar-pane rounded-md min-h-0">
      <!-- 章节 -->
      <ChapterPane v-if="activeTab === 'chapter'" @select="handlePaneSelect" />

      <!-- 知识点 -->
      <KnowledgePane v-if="activeTab === 'knowledge'" @select="handlePaneSelect" />

      <!-- 平台题库 -->
      <PlatformPane v-show="activeTab === 'platform'" />

      <!-- 分层错题库 -->
      <LayeredPane v-show="activeTab === 'layered'" @select="handlePaneSelect" />
    </div>
  </div>
</template>

<script setup lang="ts">
import ChapterPane from '@/components/sidebarTabs/ChapterPane.vue'
import KnowledgePane from '@/components/sidebarTabs/KnowledgePane.vue'
import LayeredPane from '@/components/sidebarTabs/LayeredPane.vue'
import PlatformPane from '@/components/sidebarTabs/PlatformPane.vue'
import { ref } from 'vue'

const props = defineProps<{
  allTabs: { key: string; label: string }[]
}>()

const emit = defineEmits(['getList', 'tabChange'])

const activeTab = ref('chapter')

// 切换tab
const changeTab = (key: string) => {
  if (key === 'platform') return
  activeTab.value = key
  emit('tabChange', key)
}

const handlePaneSelect = (params: any) => {
  emit('getList', params)
}
</script>

<style scoped lang="less">
.stratified-sidebar {
  width: 100%;
  height: 100%;

  .sidebar-tabs {
    display: flex;
    padding: 4px;
    background: var(--color-primary-bg-light);
    border: 1px solid #f2ebe6;
    border-radius: 8px;
    gap: 4px;
    .sidebar-tab {
      flex: 1;
      height: 32px;
      max-width: 114px;
      border: none;
      background: transparent;
      color: var(--color-text-secondary);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border-radius: 6px;
      &:hover {
        background: var(--color-bg-light);
        color: var(--color-text-primary);
      }
      &.active {
        background: var(--color-primary);
        color: #fff;
        box-shadow: 0 2px 4px rgba(230, 126, 34, 0.2);
        font-weight: 600;
      }
      &.disabled {
        cursor: not-allowed;
        color: #ccc;
      }
    }
  }

  .sidebar-pane {
    width: 100%;
    height: 100%;
    background: #fff;
    border: 1px solid #f2ebe6;
    padding: 20px;
  }
}
</style>
