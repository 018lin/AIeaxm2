<template>
  <div class="knowledge">
    <div class="sidebar-form-row">
      <div class="sidebar-form">
        <div class="input-label">学段</div>
        <a-select v-model:value="filters.stageId" class="chapter-select" placeholder="请选择学段">
          <a-select-option v-for="item in stageList" :key="item.dictValue" :value="item.dictValue">
            {{ item.label }}
          </a-select-option>
        </a-select>
      </div>
      <div class="sidebar-form">
        <div class="input-label">科目</div>
        <a-select v-model:value="filters.subjectId" class="chapter-select" placeholder="请选择科目">
          <a-select-option v-for="item in subjectList" :key="item.dictValue" :value="item.dictValue">
            {{ item.label }}
          </a-select-option>
        </a-select>
      </div>
    </div>
    <!-- 树形组件 -->
    <div class="tree-content flex-col">
      <div class="tree-title">知识点树</div>
      <div class="tree-box">
        <TreeCom :treeData="treeData" type="knowledge" :loading="loading" @select="onSelect" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getDictList, getKnowledgeTreeList } from '@/api/common/index'
import type { dictListResponse, knowledgeTreeResponse } from '@/api/common/type'
import TreeCom from '@/components/sidebarTabs/TreeCom.vue'
import { selectEnum } from '@/enum/common'
import { getUserBaseInfo } from '@/services/storage'
import { onMounted, reactive, ref, watch } from 'vue'

const emit = defineEmits(['select'])
const onSelect = (knowledgePointId: string) => {
  emit('select', { knowledgePointId })
}

// 知识点状态
const parsedUserInfo = getUserBaseInfo()
const treeData = ref<knowledgeTreeResponse[]>([])
const stageList = ref<dictListResponse[]>([]) // 学段字典列表
const subjectList = ref<dictListResponse[]>([]) // 学科字典列表
const loading = ref(true)
// 筛选条件
const filters = reactive<{
  stageId: string | undefined
  subjectId: string | undefined
}>({
  stageId: parsedUserInfo?.stageId || undefined,
  subjectId: parsedUserInfo?.subjectId || undefined,
})

onMounted(() => {
  getDictData([selectEnum.STAGE, selectEnum.SUBJECT])
})

// 获取字典数据
const getDictData = async (type: string[]) => {
  const res = await getDictList({ dictTypes: type })
  const resData = res || []

  // 遍历返回的字典数据，根据 dictType 分别赋值
  resData.forEach(item => {
    if (item.dictType === selectEnum.STAGE) {
      stageList.value = item.dictTypeList || []
    } else if (item.dictType === selectEnum.SUBJECT) {
      subjectList.value = item.dictTypeList || []
    }
  })

  getTreeList()
}

// 获取知识点树
const getTreeList = async () => {
  loading.value = true
  const params = {
    parentId: '0', // 父级知识点ID（0表示根节点）
    stageId: filters.stageId, // 学段ID
    subjectId: filters.subjectId, // 学科ID
  }
  const res = await getKnowledgeTreeList(params)
  treeData.value = res
  loading.value = false
}

watch(
  () => filters,
  () => {
    getTreeList()
    const params = {
      ...filters,
      ...{ knowledgePointId: undefined }, // 切换筛选条件时重置知识点ID
    }
    emit('select', params)
  },
  { deep: true }
)
</script>

<style scoped lang="less">
.knowledge {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: 100%;
  .sidebar-form-row {
    width: 100%;
    display: flex;
    justify-content: space-between;
  }

  .chapter-select {
    width: 98%;
  }
  .sidebar-form {
    width: 100%;
    margin-bottom: 15px;
    :deep(.ant-select) {
      border-radius: 6px;
      background: #f5f7fa;
    }
  }

  .tree-content {
    width: 100%;
    height: 100%;
    border: 1px solid #f2ebe6;
    border-radius: 6px;
    overflow: hidden;

    .tree-box {
      flex: 1;
      overflow-y: auto;
    }
    .tree-title {
      border-radius: 6px 6px 0 0;
      padding: 14px 16px;
      background: #f8f7f6;
    }
  }
}
</style>
