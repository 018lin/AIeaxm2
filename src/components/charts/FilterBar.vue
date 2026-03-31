<template>
  <div class="page-head">
    <div class="filters">
      <RangePicker
        :defaultValue="defaultDateRange"
        :presets="rangePresets"
        :disabledDate="disabledDate"
        :placeholder="['开始日期', '结束日期']"
        @getList="handleDateChange"
      />
      <a-select
        v-model:value="filterSubject"
        :options="subjectOptions"
        placeholder="选择学科"
        style="width: 190px"
        disabled
      />
      <a-select
        v-model:value="filterGrade"
        :options="gradeOptions"
        placeholder="选择年级"
        style="width: 190px"
        disabled
      />
      <a-select v-model:value="filterClass" :options="classOptions" placeholder="选择班级" style="width: 190px" />
    </div>

    <div v-if="showGenerateButton">
      <button class="primary-btn" @click="onGenerate">
        <FileTextOutlined />
        生成报告
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import RangePicker from '@/components/common/table/RangePicker.vue'
import { getUserBaseInfo } from '@/services/storage'
import { FileTextOutlined } from '@ant-design/icons-vue'
import dayjs, { type Dayjs } from 'dayjs'
import { computed, onMounted, ref, watch } from 'vue'

type Option = { label: string; value: string }
type Preset = { label: string; value: [Dayjs, Dayjs] }

const props = withDefaults(
  defineProps<{
    showGenerateButton?: boolean
  }>(),
  {
    showGenerateButton: true,
  }
)

const emit = defineEmits(['generate'])

// --- Filters State ---
const filterGrade = ref<string | undefined>()
const filterClass = ref<string | undefined>()
const filterSubject = ref<string | undefined>()
const selectedStartDate = ref<string>()
const selectedEndDate = ref<string>()

// --- Options and Loading State ---
const gradeOptions = ref<Option[]>([])
const classOptions = ref<Option[]>([])
const subjectOptions = ref<Option[]>([])

// --- Date Range Logic ---
const activeTermRange = computed<[Dayjs, Dayjs]>(() => {
  const now = dayjs()
  const y = now.year()
  const m = now.month() + 1

  if (m >= 9) {
    return [dayjs(`${y}-09-01`), dayjs(`${y + 1}-01-31`)]
  }
  if (m === 1) {
    return [dayjs(`${y - 1}-09-01`), dayjs(`${y}-01-31`)]
  }
  return [dayjs(`${y}-02-01`), dayjs(`${y}-08-31`)]
})

const clampToTerm = (d: Dayjs) => {
  const [s, e] = activeTermRange.value
  if (d.isBefore(s, 'day')) return s
  if (d.isAfter(e, 'day')) return e
  return d
}

const defaultDateRange = computed<[Dayjs, Dayjs]>(() => {
  const start = clampToTerm(dayjs().startOf('month'))
  const end = clampToTerm(dayjs())
  return start.isAfter(end, 'day') ? [end, end] : [start, end]
})

const getWeekRange = () => {
  const now = dayjs()
  const dow = now.day()
  const offset = (dow + 6) % 7
  const start = now.subtract(offset, 'day')
  const end = start.add(6, 'day')
  return [clampToTerm(start), clampToTerm(end)] as [Dayjs, Dayjs]
}

const rangePresets = computed<Preset[]>(() => {
  const [termStart, termEnd] = activeTermRange.value
  return [
    { label: '本周', value: getWeekRange() },
    { label: '本月', value: defaultDateRange.value },
    { label: '本学期', value: [termStart, termEnd] },
  ]
})

const disabledDate = (currentDate: Dayjs) => {
  const [termStart, termEnd] = activeTermRange.value
  return currentDate.isBefore(termStart, 'day') || currentDate.isAfter(termEnd, 'day')
}

// --- Event Handlers ---
const handleDateChange = (params: { startDate?: string; endDate?: string }) => {
  selectedStartDate.value = params.startDate
  selectedEndDate.value = params.endDate
}

const onGenerate = () => {
  emit('generate', {
    gradeId: filterGrade.value,
    classId: filterClass.value,
    subjectId: filterSubject.value,
    startDate: selectedStartDate.value || defaultDateRange.value[0].format('YYYY-MM-DD'),
    endDate: selectedEndDate.value || defaultDateRange.value[1].format('YYYY-MM-DD'),
  })
}

// 当不显示生成按钮时，班级下拉变化时自动触发查询
watch(
  [filterClass, filterGrade, filterSubject],
  ([newClassId, newGradeId, newSubjectId]) => {
    if (!props.showGenerateButton && newClassId && newGradeId && newSubjectId) {
      // 延迟执行以确保所有值都已更新
      setTimeout(() => {
        onGenerate()
      }, 100)
    }
  },
  { flush: 'post', immediate: true }
)

// --- Lifecycle ---
onMounted(() => {
  const userInfo = getUserBaseInfo()
  if (!userInfo) return

  // Populate Grade
  if (userInfo.gradeId && userInfo.gradeName) {
    gradeOptions.value = [{ label: userInfo.gradeName, value: userInfo.gradeId }]
    filterGrade.value = userInfo.gradeId
  }

  // Populate Subject
  if (userInfo.subjectId && userInfo.subjectName) {
    subjectOptions.value = [{ label: userInfo.subjectName, value: userInfo.subjectId }]
    filterSubject.value = userInfo.subjectId
  }

  // Populate Classes
  if (userInfo.classInfoList && userInfo.classInfoList.length > 0) {
    classOptions.value = userInfo.classInfoList.map(c => ({
      label: c.className,
      value: c.classId,
    }))
    // Set default selected class (randomly)
    const randomIndex = Math.floor(Math.random() * userInfo.classInfoList.length)
    filterClass.value = userInfo.classInfoList[randomIndex].classId
  }

  // 只有在显示生成按钮时才自动调用 onGenerate
  if (props.showGenerateButton) {
    onGenerate()
  }
})
</script>

<style scoped lang="less">
.page-head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 18px;
}

.filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filters :deep(.ant-select-selector) {
  border-radius: 14px;
  height: 40px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  box-shadow: none;
}

.filters :deep(.ant-select-selection-item) {
  color: #111827;
}
</style>
