<template>
  <div
    class="query-sidebar app-surface flex-col rounded-lg overflow-hidden border border-light p-20 gap-md h-full"
    :style="{ width }"
  >
    <div class="sidebar-header flex flex-between items-center border-primary">
      <span class="txt">{{ title }}</span>
      <slot name="headerRight" />
    </div>

    <div class="sidebar-content flex-1 min-h-0 flex-col gap-lg scroll-y p-20 rounded-md">
      <slot name="top" />

      <slot v-if="mode === 'slot'" />

      <div v-else class="filter-group group-tree flex-1 min-h-0 flex-col gap-sm w-full h-full">
        <div class="title bg-primary">{{ treeTitle }}</div>
        <div class="tree-wrapper flex-1 min-h-0 scroll-y">
          <a-tree
            v-model:expandedKeys="expandedKeysModel"
            v-model:selectedKeys="selectedKeysModel"
            v-model:checkedKeys="checkedKeysModel"
            :checkable="showCheckbox"
            :tree-data="treeData"
            block-node
            class="custom-tree"
            @select="(...args: any[]) => emit('select', ...args)"
            @check="(...args: any[]) => emit('check', ...args)"
          >
            <template #icon="{ isLeaf }">
              <FolderOpenOutlined v-if="!isLeaf" />
              <FileTextOutlined v-else />
            </template>

            <template #title="{ title: nodeTitle }">
              <div class="tree-node-row flex-between w-full">
                <span class="node-title">{{ nodeTitle }}</span>
              </div>
            </template>
          </a-tree>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileTextOutlined, FolderOpenOutlined } from '@ant-design/icons-vue'
import { computed } from 'vue'

type Key = string | number

const props = withDefaults(
  defineProps<{
    title: string
    width?: string
    mode?: 'tree' | 'slot'
    treeTitle?: string
    treeData?: any[]
    showCheckbox?: boolean
    expandedKeys?: Key[]
    selectedKeys?: Key[]
    checkedKeys?: Key[]
  }>(),
  {
    width: '350px',
    mode: 'tree',
    treeTitle: '知识点',
    treeData: () => [],
    showCheckbox: true,
    expandedKeys: () => [],
    selectedKeys: () => [],
    checkedKeys: () => [],
  }
)

const emit = defineEmits<{
  (e: 'update:expandedKeys', v: Key[]): void
  (e: 'update:selectedKeys', v: Key[]): void
  (e: 'update:checkedKeys', v: Key[]): void
  (e: 'select', ...args: any[]): void
  (e: 'check', ...args: any[]): void
}>()

const expandedKeysModel = computed<Key[]>({
  get: () => props.expandedKeys,
  set: v => emit('update:expandedKeys', v),
})

const selectedKeysModel = computed<Key[]>({
  get: () => props.selectedKeys,
  set: v => emit('update:selectedKeys', v),
})

const checkedKeysModel = computed<Key[]>({
  get: () => props.checkedKeys,
  set: v => emit('update:checkedKeys', v),
})
</script>

<style scoped lang="scss">
.sidebar-header {
  padding: 4px;
  padding-right: 10px;
  background: var(--color-primary-bg-light);
  gap: 4px;
  color: var(--color-text-secondary);
  font-size: 13px;

  .txt {
    display: inline-block;
    background: var(--color-primary);
    color: #fff;
    box-shadow: 0 2px 4px rgba(230, 126, 34, 0.2);
    font-weight: 600;
    height: 32px;
    border-radius: 6px;
    padding: 0 10px;
    line-height: 32px;
    min-width: 90px;
    text-align: center;
  }
}

.sidebar-content {
  border: 1px solid #f2ebe6;
}

.group-tree {
  border: 1px solid #f2ebe6;
  border-radius: 6px;

  .title {
    border-radius: 6px 6px 0 0;
    padding: 14px 16px;
  }
}

.tree-wrapper {
  padding-right: 10px;

  :deep(.ant-tree) {
    background: transparent;
    font-family: inherit;

    .ant-tree-node-content-wrapper {
      transition: all 0.2s;
      border-radius: 4px;
      display: flex;
      align-items: center;
      line-height: 32px;
      color: rgb(153 107 77 / 1);

      .ant-tree-iconEle {
        color: rgb(153 107 77 / 0.6);
      }

      &:hover {
        background-color: var(--color-bg-hover);
      }
    }

    .ant-tree-treenode-checkbox-checked .ant-tree-node-content-wrapper {
      background-color: var(--color-bg-warm);
      color: var(--color-primary-hover);
      font-weight: 500;

      .ant-tree-iconEle {
        color: rgb(153 107 77 / 1);
      }
    }

    .ant-tree-switcher {
      width: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #d9d9d9;
      transition: color 0.3s;
    }

    .ant-tree-checkbox {
      margin-block-start: 0;
    }
  }
}
</style>
