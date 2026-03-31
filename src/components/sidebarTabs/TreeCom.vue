<template>
  <div class="tree-box">
    <div v-if="internalLoading" class="loading-box flex-center">
      <a-spin />
    </div>
    <div v-else-if="!treeData.length" class="empty-box flex-center">
      <a-empty :image="simpleImage" description="暂无数据" />
    </div>
    <a-tree
      v-else
      v-model:selectedKeys="selectedKeys"
      :tree-data="treeData"
      block-node
      default-expand-all
      :show-line="false"
      :show-icon="true"
      @select="onSelect"
    >
      <template #icon="{ dataRef }">
        <FolderOpenOutlined v-if="!dataRef.isLeaf" />
        <FileTextOutlined v-else />
      </template>
      <template #title="{ dataRef }">
        <div class="tree-node-row flex-between w-full">
          <span class="node-title">
            {{ type === 'knowledge' ? dataRef.pointName : dataRef.chapterName || dataRef.unitName }}
          </span>
        </div>
      </template>
    </a-tree>
  </div>
</template>

<script setup lang="ts">
import { FileTextOutlined, FolderOpenOutlined } from '@ant-design/icons-vue'
import { Empty } from 'ant-design-vue'
import { ref, watch } from 'vue'

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE

const props = defineProps<{
  treeData: any[]
  loading?: boolean
  type: string
}>()

const internalLoading = ref(true)

watch(
  () => props.loading,
  val => {
    if (val === true) {
      internalLoading.value = true
    } else {
      setTimeout(() => {
        internalLoading.value = false
      }, 200)
    }
  },
  { immediate: true }
)

const selectedKeys = ref<string[]>([])

const emit = defineEmits(['select'])

const onSelect = (keys: string, info: any) => {
  console.log('Selected keys:', keys, 'Info:', info.node.knowledgePointId)
  const id = props.type === 'knowledge' ? info.node.knowledgePointId : info.node.chapterId
  emit('select', id)
}
</script>

<style scoped lang="less">
.tree-box {
  height: 100%;
  padding-right: 10px;
  overflow-x: auto;

  :deep(.ant-tree-node-content-wrapper) {
    width: 100%;
    display: flex;
    line-height: 32px;
    color: rgb(153 107 77 / 1);
  }

  :deep(.ant-tree-node-content-wrapper .ant-tree-iconEle) {
    color: rgb(153 107 77 / 0.6);
    line-height: 32px;
  }

  :deep(.ant-tree-treenode-selected .ant-tree-node-content-wrapper) {
    background-color: var(--color-bg-warm) !important;
    color: var(--color-primary-hover);
    font-weight: 500;
  }

  :deep(.ant-tree-treenode-selected .ant-tree-node-content-wrapper .ant-tree-iconEle) {
    color: rgb(153 107 77 / 1);
  }

  :deep(.ant-tree-title) {
    flex: 1;
    min-width: 0;
  }

  :deep(.ant-tree-switcher) {
    width: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #d9d9d9;
    transition: color 0.3s;

    &:hover {
      color: var(--color-primary);
    }
  }

  .tree-node-row {
    padding-right: 8px;

    .node-title {
      flex: 1;
      display: inline-block;
    }
  }

  .loading-box,
  .empty-box {
    height: 100%;
    min-height: 100px;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
