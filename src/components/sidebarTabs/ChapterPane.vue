<template>
  <div class="chapter">
    <!-- 下拉菜单 -->
    <div class="sidebar-form-row">
      <div class="sidebar-form">
        <div class="input-label">学段</div>
        <a-select v-model:value="filters.stageId" class="chapter-select" placeholder="请选择学段" @change="changeStage">
          <a-select-option v-for="item in dictStageList" :key="item.dictValue" :value="item.dictValue">
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
    <div class="sidebar-form">
      <div class="input-label">年级</div>
      <a-select v-model:value="filters.gradeId" class="chapter-select" placeholder="请选择年级">
        <a-select-option v-for="item in gradeList" :key="item.dictValue" :value="item.dictValue">
          {{ item.label }}
        </a-select-option>
      </a-select>
    </div>
    <div class="sidebar-form">
      <div class="input-label">版本</div>
      <a-select v-model:value="filters.textbookVersionId" class="chapter-select" placeholder="请选择版本">
        <a-select-option v-for="item in versionList" :key="item.dictValue" :value="item.dictValue">
          {{ item.label }}
        </a-select-option>
      </a-select>
    </div>
    <div class="sidebar-form">
      <div class="input-label">册次</div>
      <a-select v-model:value="filters.volumeId" class="chapter-select" placeholder="请选择册次">
        <a-select-option v-for="item in volumeList" :key="item.dictValue" :value="item.dictValue">
          {{ item.label }}
        </a-select-option>
      </a-select>
    </div>
    <!-- 树形组件 -->
    <div class="tree-content flex-col flex-1">
      <div class="tree-title">章节树</div>
      <div class="tree-box flex-1">
        <TreeCom :treeData="treeData" :loading="loading" type="chapter" @select="onSelect" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getChapterList, getDictList } from '@/api/common/index'
import type { chapterResponse, dictListResponse } from '@/api/common/type'
import TreeCom from '@/components/sidebarTabs/TreeCom.vue'
import { selectEnum } from '@/enum/common'
import { getUserBaseInfo } from '@/services/storage'
import { dictGradeOneList, dictGradeThreeList, dictGradeTwoList, dictStageList } from '@/utils/dictList'
import { onMounted, reactive, ref, watch } from 'vue'

const emit = defineEmits(['select'])
const onSelect = (chapterId: string) => {
  emit('select', { chapterId })
}

// 状态
const parsedUserInfo = getUserBaseInfo()
const subjectList = ref<dictListResponse[]>([]) // 学科字典列表
const gradeList = ref<dictListResponse[]>([]) // 年级字典列表
const versionList = ref<dictListResponse[]>([]) // 版本字典列表
const volumeList = ref<dictListResponse[]>([]) // 册次字典列表
const treeData = ref<chapterResponse[]>([])
const loading = ref(false)
const isInitializing = ref(true) // 标记是否正在初始化
// 筛选条件
const filters = reactive<{
  stageId: string | undefined
  subjectId: string | undefined
  gradeId: string | undefined
  textbookVersionId: string | undefined
  volumeId: string | undefined
}>({
  stageId: parsedUserInfo?.stageId || undefined,
  subjectId: parsedUserInfo?.subjectId || undefined,
  gradeId: parsedUserInfo?.gradeId || undefined,
  textbookVersionId: '3',
  volumeId: '2',
})

// 切换学段时，重置年级
const changeStage = (value: string) => {
  // 重新获取年级列表
  getGadeList(value)
  filters.gradeId = undefined
}

// 年级列表
const getGadeList = (value: string) => {
  // 重新获取年级列表
  if (value === '1') {
    gradeList.value = dictGradeOneList
  } else if (value === '2') {
    gradeList.value = dictGradeTwoList
  } else if (value === '3') {
    gradeList.value = dictGradeThreeList
  }
}

onMounted(async () => {
  initFiltersData()
  getGadeList(filters.stageId || '')
  await getDictData([selectEnum.SUBJECT, selectEnum.TEXTBOOK_VERSION, selectEnum.TEXTBOOK_VOLUME])
  // 初始化完成后再 emit，避免多次触发
  isInitializing.value = false
  emit('select', filters)
})

const initFiltersData = () => {
  filters.stageId = parsedUserInfo?.stageId || undefined
  filters.subjectId = parsedUserInfo?.subjectId || undefined
  filters.gradeId = parsedUserInfo?.gradeId || undefined
  filters.textbookVersionId = '3'
  filters.volumeId = '2'
}

// 获取字典数据
const getDictData = async (type: string[]) => {
  const res = await getDictList({ dictTypes: type })
  const resData = res || []

  // 遍历返回的字典数据，根据 dictType 分别赋值
  resData.forEach(item => {
    if (item.dictType === selectEnum.SUBJECT) {
      subjectList.value = item.dictTypeList || []
    } else if (item.dictType === selectEnum.TEXTBOOK_VERSION) {
      versionList.value = item.dictTypeList || []
      const firstVersion = versionList.value[0]
      // 设置默认值：如果未选择，则默认显示第一条数据
      if (!filters.textbookVersionId && firstVersion?.dictValue) {
        filters.textbookVersionId = firstVersion.dictValue
      }
    } else if (item.dictType === selectEnum.TEXTBOOK_VOLUME) {
      volumeList.value = item.dictTypeList || []
      const firstVolume = volumeList.value[0]
      // 设置默认值：如果未选择，则默认显示第一条数据
      if (!filters.volumeId && firstVolume?.dictValue) {
        filters.volumeId = firstVolume.dictValue
      }
    }
  })

  getChapterData()
}

// 获取章节列表
const getChapterData = async () => {
  if (!filters.stageId) {
    console.warn('学段未选择，无法获取章节数据')
    return
  }
  if (!filters.gradeId) {
    console.warn('年级未选择，无法获取章节数据')
    return
  }
  if (!filters.subjectId) {
    console.warn('学科未选择，无法获取章节数据')
    return
  }
  if (!filters.textbookVersionId) {
    console.warn('版本未选择，无法获取章节数据')
    return
  }
  if (!filters.volumeId) {
    console.warn('册次未选择，无法获取章节数据')
    return
  }

  loading.value = true
  try {
    const res = await getChapterList({
      stage: filters.stageId,
      gradeId: filters.gradeId,
      subject: filters.subjectId,
      textbookVersion: filters.textbookVersionId,
      volume: filters.volumeId,
      parentId: '0',
    } as any)
    treeData.value = res || []
  } finally {
    loading.value = false
  }
}

watch(
  () => filters,
  () => {
    // 初始化阶段不触发
    if (isInitializing.value) return

    getChapterData()
    const params = {
      ...filters,
      ...{ chapterId: undefined }, // 切换筛选条件时重置章节ID
    }
    emit('select', params)
  },
  { deep: true }
)
</script>

<style scoped lang="less">
.chapter {
  width: 100%;
  display: flex;
  flex-direction: column;
  max-height: 100%;

  .chapter-select {
    width: 98%;
  }
  .sidebar-form-row {
    display: flex;
    justify-content: space-between;
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
    flex: 1;
    overflow-y: auto;
    border: 1px solid #f2ebe6;
    border-radius: 6px;

    .tree-box {
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
