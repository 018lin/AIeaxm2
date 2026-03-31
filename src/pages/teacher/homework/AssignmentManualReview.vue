<template>
  <div class="tch-detail-page">
    <TchDetailHeader :header="header" :tabs="tabs" :active-key="activeTabKey" @back="goBack" @navigate="goTab" />

    <div class="flex-1">
      <a-spin :spinning="loading">
        <div v-if="manualVO?.questions?.length" class="tch-mr-body h-full">
          <!-- 学生列表 -->
          <ReviewStudentList ref="reviewStudentListRef" :students="students" />

          <!-- 题目批阅区 -->
          <ReviewPaper
            ref="reviewPaperRef"
            :items="currentHomeworkList"
            :studentId="currentStudentId"
            :areas="currentAreas"
            :grading-items="currentGradingItems"
            :selected-index="selectedAreaIndex"
            @selectArea="selectArea"
            @colorTool="colorTool"
          />

          <!-- 操作面板 -->
          <OperatePanel
            ref="operatePanelRef"
            :homeworkDetailId="currentQuestionId"
            :areas="currentAreas"
            :grading-items="currentGradingItems"
            :selected-index="selectedAreaIndex"
            :submitting="submitting"
            @selectArea="selectArea"
            @setStatus="setStatus"
            @submit="submit"
          />
        </div>
        <div v-else class="h-full flex items-center justify-center">
          <a-empty description="暂无需要批阅的题目" />
        </div>
      </a-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getManualGradingList, submitManualGrading } from '@/api/homework'
import type { ManualGradingHomeworkVO, NeedGradingHomeworkVO } from '@/api/homework/type'
import OperatePanel from '@/components/assigment/OperatePanel.vue'
import ReviewPaper from '@/components/assigment/ReviewPaper.vue'
import ReviewStudentList from '@/components/assigment/ReviewStudentList.vue'
import TchDetailHeader from '@/components/common/TchDetailHeader.vue'
import { teacherAssignmentsMock } from '@/config/mock/teacherAssignments'
import { ROUTES } from '@/router/routes'
import type { DetailTab, ReviewStudent, TabKey } from '@/types/assignment/manualReview'
import { decrypt } from '@/utils/crypto'
import { message } from 'ant-design-vue'
import { computed, reactive, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type AreaPoint = { x: number; y: number }
type AnswerArea = { areaId?: string; posList?: AreaPoint[][] }
type GradingItem = { studentAnswer?: string; status?: string; [property: string]: any }
const reviewStudentListRef = ref<InstanceType<typeof ReviewStudentList> | null>(null)
const reviewPaperRef = ref<InstanceType<typeof ReviewPaper> | null>(null)
const operatePanelRef = ref<InstanceType<typeof OperatePanel> | null>(null)

const router = useRouter()
const route = useRoute()

const routeAssignmentId = computed(() => String(route.params.id || ''))
const assignmentId = computed(() => {
  const raw = routeAssignmentId.value
  if (!raw) return ''
  try {
    return decrypt(decodeURIComponent(raw))
  } catch {
    return decrypt(raw)
  }
})

const classId = computed(() => {
  const v = route.query.classId
  const raw = typeof v === 'string' ? v : ''
  if (raw) {
    try {
      return decrypt(decodeURIComponent(raw))
    } catch {
      return decrypt(raw)
    }
  }
  const cached = assignmentId.value
    ? sessionStorage.getItem(`hw_detail_classId_${String(assignmentId.value)}`) || ''
    : ''
  return cached ? decrypt(cached) : ''
})

const loading = ref(false)
const manualVO = ref<ManualGradingHomeworkVO | null>(null)

const currentStudentId = ref('')
const currentQuestionId = ref('')
const currentTool = ref('')

const students = computed<ReviewStudent[]>(() => {
  const list = manualVO.value?.questions ?? []
  return list.map(q => {
    const id = String(q?.studentUserId || q?.studentCode || '')
    return {
      id,
      name: String(q?.studentName || '-'),
      studentNo: String(q?.studentCode || '-'),
      gradingStatus: String(q?.gradingStatus || '-'),
    }
  })
})

const currentRow = computed(() => {
  const sid = String(currentStudentId.value || '')
  if (!sid) return null
  const list = manualVO.value?.questions ?? []
  return list.find(q => String(q?.studentUserId || q?.studentCode || '') === sid) || null
})

const currentHomeworkList = computed<NeedGradingHomeworkVO[]>(() => {
  const row = currentRow.value
  return Array.isArray(row?.homeworkList) ? (row?.homeworkList as NeedGradingHomeworkVO[]) : []
})

const currentItem = computed(() => {
  const homeworkDetailId = String(currentQuestionId.value || '').trim()
  if (!homeworkDetailId) return null
  return currentHomeworkList.value.find(it => String(it?.homeworkDetailId || '').trim() === homeworkDetailId) || null
})

const safeJsonParse = <T,>(raw: any, fallback: T): T => {
  if (raw == null) return fallback
  if (typeof raw === 'string') {
    const s = raw.trim()
    if (!s) return fallback
    try {
      return JSON.parse(s) as T
    } catch {
      return fallback
    }
  }
  return (raw as T) ?? fallback
}

const stableStringify = (v: any): string => {
  if (v == null) return 'null'
  const t = typeof v
  if (t === 'string') return JSON.stringify(v)
  if (t === 'number' || t === 'boolean') return String(v)
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`
  if (t !== 'object') return JSON.stringify(v)
  const obj = v as Record<string, any>
  const keys = Object.keys(obj).sort()
  return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`
}

const selectedAreaIndex = ref(0)
const submitting = ref(false)

const gradingState = reactive<Record<string, { items: GradingItem[]; snapshot: string }>>({})

const currentAreas = computed<AnswerArea[]>(() => {
  const item = currentItem.value as any
  return safeJsonParse<AnswerArea[]>(item?.answerAreas, [])
})

const currentGradingItems = computed<GradingItem[]>(() => {
  const id = String(currentQuestionId.value || '').trim()
  return gradingState[id]?.items || []
})

const initGradingState = () => {
  const item = currentItem.value as any
  const id = String(item?.homeworkDetailId || '').trim()
  if (!id) return

  const parsed = safeJsonParse<GradingItem[]>(item?.gradingResultStr, [])

  // 确保 items 长度与 areas 长度一致，避免索引越界
  const areasLength = currentAreas.value.length
  const itemsLength = parsed.length
  let items: GradingItem[]

  if (itemsLength < areasLength) {
    // 如果 items 比 areas 短，填充空对象
    items = [...parsed]
    for (let i = itemsLength; i < areasLength; i++) {
      items.push({})
    }
  } else if (itemsLength > areasLength) {
    // 如果 items 比 areas 长，截断多余部分
    items = parsed.slice(0, areasLength)
  } else {
    items = parsed.map(it => ({ ...it }))
  }

  if (!gradingState[id]) {
    gradingState[id] = { items, snapshot: stableStringify(items) }
  } else {
    gradingState[id].items = items
    gradingState[id].snapshot = stableStringify(items)
  }

  const count = Math.max(currentAreas.value.length, gradingState[id].items.length)
  if (selectedAreaIndex.value >= count) selectedAreaIndex.value = 0
}

watch(
  () => [currentStudentId.value, currentQuestionId.value, currentHomeworkList.value] as const,
  () => {
    selectedAreaIndex.value = 0
    initGradingState()
  },
  { immediate: true }
)

const selectArea = (i: number) => {
  selectedAreaIndex.value = Math.max(0, i)
}

const setStatus = (status: 'Correct' | 'Incorrect' | 'CorrectAndIncorrect') => {
  const id = String(currentQuestionId.value || '').trim()
  if (!id) return
  const st = gradingState[id]
  if (!st || !Array.isArray(st.items) || !st.items.length) return

  const idx = selectedAreaIndex.value

  // 安全的边界检查：确保 idx 在有效范围内
  if (idx < 0 || idx >= st.items.length) {
    console.warn(`Invalid index: ${idx}, items length: ${st.items.length}`)
    return
  }

  // 使用索引对应的 grading item，确保与 panel-list 按钮一一对应
  st.items[idx] = { ...st.items[idx], status }
  st.items = [...st.items]
}

const resolveOverall = (items: GradingItem[]) => {
  if (!items.length) return ''
  const statuses = items.map(it => String(it?.status || '').trim()).filter(Boolean)
  if (statuses.length !== items.length) return 'CorrectAndIncorrect'
  if (statuses.every(s => s === 'Correct')) return 'Correct'
  if (statuses.every(s => s === 'Incorrect')) return 'Incorrect'
  return 'CorrectAndIncorrect'
}

const submit = async () => {
  const item = currentItem.value as any
  const homeworkDetailId = String(item?.homeworkDetailId || '').trim()
  if (!homeworkDetailId) {
    message.warning('请选择要修改的题目')
    return
  }

  const st = gradingState[homeworkDetailId]
  const nextSnapshot = stableStringify(st?.items || [])
  if (!st || nextSnapshot === st.snapshot) {
    message.info('暂时没有修改结果哦')
    return
  }

  if (submitting.value) return
  submitting.value = true

  try {
    const gradingResultStr = JSON.stringify(st.items)
    const overall = resolveOverall(st.items)
    await submitManualGrading({ homeworkDetailId, gradingResultStr, gradingResult: overall || undefined })

    st.snapshot = nextSnapshot

    item.gradingResultStr = gradingResultStr
    if (overall) item.gradingResult = overall

    // 提交成功后，重新获取列表数据以更新 gradingStatus
    await fetchManualList()

    message.success('已更新批阅结果')
  } catch (e: any) {
    message.error(e?.message || '提交批阅失败')
  } finally {
    submitting.value = false
  }
}

const buildPath = (tpl: string) => tpl.replace(':id', encodeURIComponent(String(routeAssignmentId.value)))
const activeTabKey = computed<TabKey>(() => 'ai')

const header = computed(() => {
  const cached = assignmentId.value ? sessionStorage.getItem(`hw_detail_meta_${String(assignmentId.value)}`) : ''
  if (cached) {
    try {
      const v = JSON.parse(cached) as any
      if (v && typeof v === 'object') {
        return {
          subject: String(v.subject || '-'),
          gradeClass: String(v.gradeClass || '-'),
          paperName: String(v.paperName || '-'),
        }
      }
    } catch {
      // ignore
    }
  }

  const row =
    teacherAssignmentsMock.rows.find((r: any) => r.id === assignmentId.value) || teacherAssignmentsMock.rows[0]
  return {
    subject: row.subject,
    gradeClass: row.grade,
    paperName: row.paperSource || row.title,
  }
})

const tabs = computed<DetailTab[]>(() => [
  { key: 'pages', label: '讲错题', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL) },
  { key: 'student_stats', label: '学生作业统计', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL_STUDENT_STATS) },
  { key: 'students', label: '学生（汇总）', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL_STUDENTS) },
  { key: 'origin-work', label: '原作业', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL_ORIGINAL_WORK) },
  { key: 'ai', label: '人工批阅', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL_MANUAL_REVIEW) },
])

const goTab = (to: string) => {
  router.push(to).catch(() => {})
}

const goBack = () => {
  router.push(ROUTES.TEACHER_HOMEWORK).catch(() => {})
}

const colorTool = () => {
  // Ensure we always have a valid selected area when switching questions
  selectedAreaIndex.value = 0

  // OperatePanel currently does not expose a colorTool method; call it only if available.
  if (operatePanelRef.value && typeof (operatePanelRef.value as any).colorTool === 'function') {
    ;(operatePanelRef.value as any).colorTool()
  }
}

async function fetchManualList() {
  const aid = String(assignmentId.value || '')
  const cid = String(classId.value || '')
  if (!aid || !cid) {
    manualVO.value = null
    return
  }

  loading.value = true
  try {
    manualVO.value = await getManualGradingList({ assignmentId: aid, classId: cid })
  } catch (e: any) {
    manualVO.value = null
    message.error(e?.message || '获取人工批阅列表失败')
  } finally {
    loading.value = false
  }
}

watch(
  () => [assignmentId.value, classId.value],
  () => {
    fetchManualList().catch(() => {})
  },
  { immediate: true }
)

watchEffect(() => {
  if (reviewStudentListRef.value) currentStudentId.value = reviewStudentListRef.value.curStudentId || ''
  if (reviewPaperRef.value) currentQuestionId.value = reviewPaperRef.value.curQuestionId || ''
  if (operatePanelRef.value) currentTool.value = ((operatePanelRef.value as any).tool || '') as string
})
</script>

<style scoped lang="scss">
.tch-detail-page {
  height: var(--content-height);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow: hidden;

  :deep(.ant-spin-nested-loading),
  :deep(.ant-spin-container) {
    height: 100%;
  }
}

.tch-mr-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 240px 1fr 260px;
  gap: 16px;
  position: relative;
}
</style>
