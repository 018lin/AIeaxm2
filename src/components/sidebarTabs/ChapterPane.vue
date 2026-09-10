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
  </div>
</template>

<script setup lang="ts">
import type { dictListItem } from '@/api/common/type'
import { getUserBaseInfo } from '@/services/storage'
import { dictGradeOneList, dictGradeThreeList, dictGradeTwoList, dictStageList } from '@/utils/dictList'
import { computed, onMounted, reactive, ref, watch } from 'vue'

const emit = defineEmits(['select'])

// 状态
const parsedUserInfo = getUserBaseInfo()
const isInitializing = ref(true) // 标记是否正在初始化
const gradeList = ref<dictListItem[]>([]) // 年级字典列表

const primarySubjectList: dictListItem[] = [
  { label: '语文', dictValue: '1' },
  { label: '数学', dictValue: '2' },
  { label: '英语', dictValue: '3' },
]

const juniorSubjectList: dictListItem[] = [
  ...primarySubjectList,
  { label: '物理', dictValue: '4' },
  { label: '化学', dictValue: '5' },
  { label: '政治', dictValue: '6' },
  { label: '地理', dictValue: '7' },
  { label: '生物', dictValue: '8' },
]

const subjectList = computed(() => {
  if (filters.stageId === '1') return primarySubjectList
  if (filters.stageId === '2') return juniorSubjectList
  return []
})

// 筛选条件
const filters = reactive<{
  stageId: string | undefined
  subjectId: string | undefined
  gradeId: string | undefined
}>({
  stageId: parsedUserInfo?.stageId || undefined,
  subjectId: parsedUserInfo?.subjectId || undefined,
  gradeId: parsedUserInfo?.gradeId || undefined,
})

// 切换学段时，重置年级
const changeStage = (value: string) => {
  // 重新获取年级列表
  getGadeList(value)
  filters.gradeId = undefined
  if (!subjectList.value.some(item => item.dictValue === filters.subjectId)) {
    filters.subjectId = undefined
  }
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
  } else {
    gradeList.value = []
  }
}

onMounted(() => {
  initFiltersData()
  getGadeList(filters.stageId || '')
  // 初始化完成后再 emit，避免多次触发
  isInitializing.value = false
  emit('select', getQueryParams())
})

const initFiltersData = () => {
  filters.stageId = parsedUserInfo?.stageId || undefined
  filters.subjectId = parsedUserInfo?.subjectId || undefined
  filters.gradeId = parsedUserInfo?.gradeId || undefined
  if (!subjectList.value.some(item => item.dictValue === filters.subjectId)) {
    filters.subjectId = undefined
  }
}

const getQueryParams = () => ({
  ...filters,
  chapterId: undefined,
  textbookVersionId: undefined,
  volumeId: undefined,
})

watch(
  () => filters,
  () => {
    // 初始化阶段不触发
    if (isInitializing.value) return

    emit('select', getQueryParams())
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
}
</style>
