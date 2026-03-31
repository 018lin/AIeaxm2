<template>
  <div class="tch-detail-page">
    <TchDetailHeader :header="header" :tabs="tabs" :active-key="activeTab" @back="goBack" @navigate="goTab" />

    <div class="tch-detail-body">
      <main class="tch-question-main">
        <div class="tch-stu-summary">
          <a-empty v-if="!isReady || isEmpty" />

          <div v-else class="tch-kpi-row">
            <div class="tch-kpi-card">
              <div class="label bold">全班平均正确率</div>
              <div class="value bold">{{ classKpi.avgAccuracy }}%</div>
            </div>

            <div class="tch-kpi-card">
              <div class="label bold">已提交人数</div>
              <div class="value bold">
                {{ submittedCount }}<span class="sub bold"> / {{ classKpi.total }}</span>
              </div>
              <div class="sub">提交率 {{ classKpi.submitRate }}%</div>
              <div class="ring">
                <a-progress
                  type="circle"
                  :percent="ringPercent"
                  :width="90"
                  :stroke-width="10"
                  :stroke-color="ringColor"
                />
              </div>
            </div>
          </div>

          <div ref="stuTableWrapRef" class="tch-heatmap-card">
            <div class="tch-heatmap-head flex-between items-center gap-12">
              <div class="left">
                <div class="title bold">学生详情热力图</div>
                <div class="legend flex items-center gap-14">
                  <span class="item flex items-center gap-xs"><i class="dot is-correct" />正确</span>
                  <span class="item flex items-center gap-xs"><i class="dot is-half" />半对</span>
                  <span class="item flex items-center gap-xs"><i class="dot is-wrong" />错误</span>
                  <span class="item flex items-center gap-xs"><i class="dot is-unsubmitted" />未批改</span>
                </div>
              </div>
            </div>

            <a-table
              :data-source="visibleStudentRows"
              :columns="studentSummaryColumns"
              :pagination="false"
              :scroll="{ x: studentTableScrollX, y: stuTableScrollY - 40 }"
              table-layout="fixed"
              row-key="id"
              :loading="loading"
              class="tch-heatmap-table"
            >
              <template #bodyCell="{ column, record, text }">
                <template v-if="String(column.key).startsWith('q_')">
                  <span class="tch-cell-chip bold" :class="'is-' + String(text)">
                    <!-- {{ text }} -->
                    <span v-if="text === 'correct'" class="mark">✓</span>
                    <span v-else-if="text === 'wrong'" class="mark">×</span>
                    <span v-else-if="text === 'half'" class="mark">乄</span>
                    <span v-else-if="text === 'nograded'" class="mark">–</span>
                    <span v-else-if="text === 'unsubmitted'" class="mark"></span>
                  </span>
                </template>

                <template v-else-if="column.key === 'completion'">
                  <div class="tch-comp-cell flex items-center gap-10">
                    <span class="line"
                      ><i
                        class="fill"
                        :style="{ width: record.completion + '%', background: masteryColor(record.completion) }"
                    /></span>
                    <span class="pct" :style="{ color: masteryColor(record.completion) }"
                      >{{ record.completion }}%</span
                    >
                  </div>
                </template>

                <template v-else-if="column.key === 'ops'">
                  <a-button size="small" class="tch-op-btn bold" @click="openStudentSummary(record)">查看错题</a-button>
                </template>
              </template>
            </a-table>

            <button
              v-if="studentRows.length > 6"
              type="button"
              class="tch-show-more bold"
              @click="showAllStudents = !showAllStudents"
            >
              {{ showAllStudents ? '收起' : '展开更多学生' }} ({{ visibleStudentRows.length }}/{{ studentRows.length }})
              <Icon icon="solar:alt-arrow-down-bold" width="14" class="chev" :class="{ up: showAllStudents }" />
            </button>
          </div>
        </div>
      </main>
    </div>

    <AssignmentOriginalModal
      :open="originalOpen"
      :modalCtx="originalStudent"
      :pageIndex="originalPageIndex"
      :pageTotal="originalPageTotal"
      @changePage="handleOriginalPageChange"
      @closeModal="handleOriginalWorkModal"
    />
  </div>
</template>

<script setup lang="ts">
import { getOriginalDetail, getStudentStatistics } from '@/api/homework'
import type {
  GradeResult,
  OriginalDetailVO,
  StudentStatisticsQuestionInfo,
  StudentStatisticsQuestionResult,
  StudentStatisticsStudentRow,
  StudentStatisticsVO,
} from '@/api/homework/type'
import TchDetailHeader from '@/components/common/TchDetailHeader.vue'
import AssignmentOriginalModal from '@/components/homework/AssignmentOriginalModal.vue'
import { ROUTES } from '@/router/routes'
import type { ClassKpi, DetailTab, StudentSummaryRow, TabKey } from '@/types/homework'
import { decrypt } from '@/utils/crypto'
import useAntdTableScrollY from '@/utils/useAntdTableScrollY'
import { Icon } from '@iconify/vue'
import { message } from 'ant-design-vue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const routeAssignmentId = computed(() => String(route.params.id || ''))

// 作业ID：路由 params 中为加密值，需要解密后才能用于接口调用
const assignmentId = computed(() => {
  const raw = routeAssignmentId.value
  if (!raw) return ''
  try {
    return decrypt(decodeURIComponent(raw))
  } catch {
    return decrypt(raw)
  }
})

// 班级ID：优先取路由 query；缺失时从列表页缓存恢复（兼容短链接）
const classId = computed(() => {
  const v = route.query.classId
  const raw = typeof v === 'string' ? v : ''
  if (raw) return decrypt(raw)

  const cached = sessionStorage.getItem(`hw_detail_classId_${String(assignmentId.value)}`) || ''
  return cached ? decrypt(cached) : ''
})

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

  return {
    subject: '-',
    gradeClass: '-',
    paperName: '-',
  }
})

const isReady = computed(() => Boolean(assignmentId.value && classId.value))

const loading = ref(false)
const statsVO = ref<StudentStatisticsVO | null>(null)

// 百分比归一化：兼容接口返回 0-1 或 0-100 两种形态
const normalizePercent = (value: unknown) => {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return 0
  if (n <= 1) return Math.round(n * 100)
  return Math.round(n)
}

// 拉取学生维度统计：用于 KPI（提交率/平均正确率）与热力表
const fetchStats = async () => {
  const aid = String(assignmentId.value || '')
  const cid = String(classId.value || '')
  if (!aid || !cid) {
    statsVO.value = null
    return
  }

  loading.value = true
  try {
    statsVO.value = await getStudentStatistics({ assignmentId: aid, classId: cid })
  } catch {
    statsVO.value = null
  } finally {
    loading.value = false
  }
}

watch(
  () => [assignmentId.value, classId.value],
  () => {
    fetchStats().catch(() => {})
  },
  { immediate: true }
)

const questionList = computed<StudentStatisticsQuestionInfo[]>(() => statsVO.value?.questionList ?? [])
const rawStudentRows = computed<StudentStatisticsStudentRow[]>(() => statsVO.value?.studentRows ?? [])
const isEmpty = computed(() => isReady.value && !loading.value && rawStudentRows.value.length === 0)

const buildPath = (tpl: string) => tpl.replace(':id', encodeURIComponent(String(routeAssignmentId.value)))

const tabs = computed<DetailTab[]>(() => [
  { key: 'pages', label: '讲错题', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL) },
  { key: 'student_stats', label: '学生作业统计', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL_STUDENT_STATS) },
  { key: 'students', label: '学生（汇总）', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL_STUDENTS) },
  { key: 'origin-work', label: '原作业', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL_ORIGINAL_WORK) },
  { key: 'ai', label: '人工批阅', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL_MANUAL_REVIEW) },
])

const activeTab = computed<TabKey>(() => 'students')

const goTab = (to: string) => {
  router.push(to).catch(() => {})
}

const goBack = () => {
  router.push(ROUTES.TEACHER_HOMEWORK).catch(() => {})
}

const mapGradeToCell = (
  v: GradeResult | null | undefined | 'noanswer'
): 'correct' | 'wrong' | 'half' | 'unsubmitted' | 'nograded' => {
  if (v === 'Correct') return 'correct'
  if (v === 'Incorrect') return 'wrong'
  if (v === 'CorrectAndIncorrect') return 'half'
  if (v === null) return 'nograded'
  if (v === 'noanswer') return 'unsubmitted'

  return 'unsubmitted'
}

const masteryColor = (v: number) => {
  if (v >= 85) return 'var(--color-success)'
  if (v >= 70) return 'var(--color-warning)'
  return 'var(--color-error)'
}

const ringColor = 'var(--primary-color)'

const showAllStudents = ref(false)

// 将接口 studentRows + questionList 映射成表格需要的结构（cells 用于热力色块）
const buildStudentRows = () => {
  const qs = questionList.value

  return rawStudentRows.value
    .map(r => {
      const rawIds = Array.isArray((r as any)?.homeworkIds) ? ((r as any).homeworkIds as any[]) : []
      const homeworkIds = rawIds.map(x => String(x || '').trim()).filter(Boolean)
      const isNoAnswer = homeworkIds.length === 0
      const homeworkId = String((r as any)?.homeworkId || homeworkIds[0] || '').trim()

      const cells: Record<string, 'correct' | 'wrong' | 'half' | 'unsubmitted' | 'nograded'> = {}
      const list = (Array.isArray(r?.questionResults) ? r.questionResults : []) as StudentStatisticsQuestionResult[]

      qs.forEach(q => {
        const qid = String(q?.questionId || '').trim()
        if (!qid) return

        if (isNoAnswer) {
          cells[qid] = mapGradeToCell('noanswer')
          return
        }

        const targetOrder = String(q?.questionOrder ?? '')
        const hit = list.find(x => String(x?.questionOrder ?? '') === targetOrder)
        cells[qid] = mapGradeToCell(hit?.gradeResult)
      })

      const baseName = String(r?.studentName || '-')
      const studentCode = String(
        (r as any)?.studentCode || (r as any)?.studentNo || (r as any)?.studentNumber || ''
      ).trim()

      return {
        id: String(r?.studentId || '').trim(),
        name: isNoAnswer ? `${baseName}(未提交)` : baseName,
        studentCode,
        correct: Number(r?.correctCount ?? 0) || 0,
        wrong: Number(r?.incorrectCount ?? 0) || 0,
        halfCheck: Number(r?.halfCorrectCount ?? 0) || 0,
        completion: normalizePercent(r?.overallCorrectRate),
        cells,
        homeworkId,
        homeworkIds,
      }
    })
    .filter(r => Boolean(r.id))
    .sort((a, b) => (b.wrong || 0) - (a.wrong || 0))
}

const studentRows = computed<StudentSummaryRow[]>(() => buildStudentRows())

const visibleStudentRows = computed<StudentSummaryRow[]>(() => {
  if (showAllStudents.value) return studentRows.value
  return studentRows.value.slice(0, 6)
})

// KPI：提交/未提交等（submitRate 统一转为 0-100）
const classKpi = computed<ClassKpi>(() => {
  const total = Number(statsVO.value?.totalCount ?? 0) || 0
  const submitted = Number(statsVO.value?.submitCount ?? 0) || 0
  const unsubmitted = Math.max(0, total - submitted)

  return {
    total,
    unsubmitted,
    submitted,
    submitRate: normalizePercent(statsVO.value?.submitRate),
    avgAccuracy: normalizePercent(statsVO.value?.averageCorrectRate),
    all: questionList.value.length,
  }
})

const submittedCount = computed(() => Math.max(0, classKpi.value.total - classKpi.value.unsubmitted))

// 环形进度：截断到 0-100，避免接口异常值导致样式错位
const ringPercent = computed(() => {
  const v = Number(classKpi.value.submitRate)
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(100, v))
})

const originalOpen = ref(false)
const originalStudent = ref<any>(null)
const originalPageIndex = ref(0)
const originalPageTotal = computed(() => {
  const ids = Array.isArray(originalStudent.value?.homeworkIds) ? (originalStudent.value?.homeworkIds as any[]) : []
  return Math.max(1, ids.length)
})
let originalReqSeq = 0

const getRowHomeworkIds = (row: any) => {
  const list = Array.isArray(row?.homeworkIds) ? (row.homeworkIds as any[]) : []
  const ids = list.map(x => String(x || '').trim()).filter(Boolean)
  const single = String(row?.homeworkId || '').trim()
  if (ids.length === 0 && single) ids.push(single)
  return ids
}

const fetchOriginalDetailByIndex = async (index: number) => {
  const base = originalStudent.value || {}
  const ids = getRowHomeworkIds(base)
  const safeIndex = Math.max(0, Math.min(index, Math.max(0, ids.length - 1)))
  const homeworkId = String(ids[safeIndex] || '').trim()

  const seq = ++originalReqSeq

  originalStudent.value = {
    ...base,
    homeworkId,
    homeworkIds: ids,
    originalImage: '',
    originalDetail: null as OriginalDetailVO | null,
  }

  if (!homeworkId) {
    message.warning('暂无原作业图片')
    return
  }

  try {
    const studentUserId = String((base as any)?.studentUserId || '').trim()
    const aid = String(assignmentId.value || '').trim()
    const req = studentUserId && aid ? ({ assignmentId: aid, studentUserId } as any) : ({ homeworkId } as any)

    const res = await getOriginalDetail(req)
    if (seq !== originalReqSeq) return

    const list = (Array.isArray(res) ? res : [res]).filter(Boolean) as OriginalDetailVO[]
    const picked =
      list.find(d => String((d as any)?.homeworkId || '').trim() === homeworkId) || list[safeIndex] || list[0] || null

    const attachmentUrl = String((picked as any)?.attachmentUrl || '')

    originalStudent.value = {
      ...base,
      homeworkId,
      homeworkIds: ids,
      originalImage: attachmentUrl,
      originalDetail: picked as any,
    }

    if (!attachmentUrl) message.warning('暂无原作业图片')
  } catch (e: any) {
    if (seq !== originalReqSeq) return

    originalStudent.value = {
      ...base,
      homeworkId,
      homeworkIds: ids,
      originalImage: '',
      originalDetail: null as OriginalDetailVO | null,
    }
    message.error(e?.message || '获取原作业失败')
  }
}

const handleOriginalWorkModal = async (open: boolean, row?: any) => {
  if (!open) {
    originalOpen.value = false
    return
  }

  const studentUserId = String(row?.id || row?.studentId || row?.studentUserId || '').trim()
  const studentName = String(row?.name || row?.studentName || '').trim()
  const studentCode = String(row?.studentCode || '').trim()
  const homeworkIds = getRowHomeworkIds(row)

  originalPageIndex.value = 0
  originalStudent.value = {
    ...(row || {}),
    studentName,
    studentUserId,
    studentCode,
    gradeClass: String(header.value.gradeClass || ''),
    homeworkIds,
    homeworkId: String(homeworkIds[0] || '').trim(),
    originalImage: '',
    originalDetail: null as OriginalDetailVO | null,
  }
  originalOpen.value = true

  fetchOriginalDetailByIndex(0).catch(() => {})
}

const handleOriginalPageChange = (nextIndex: number) => {
  const ids = Array.isArray(originalStudent.value?.homeworkIds) ? (originalStudent.value?.homeworkIds as any[]) : []
  if (ids.length <= 1) return
  if (nextIndex < 0 || nextIndex >= ids.length) return

  originalPageIndex.value = nextIndex
  fetchOriginalDetailByIndex(nextIndex).catch(() => {})
}

const openStudentSummary = (row: StudentSummaryRow) => {
  handleOriginalWorkModal(true, row).catch(() => {})
}

const stuTableWrapRef = ref<HTMLElement | null>(null)
const { scrollY: stuTableScrollY } = useAntdTableScrollY(stuTableWrapRef, {
  mode: 'container',
  minY: 0,
  subtractSelectors: ['.tch-heatmap-head', '.tch-show-more', '.ant-table-thead'],
  subtractPadding: true,
  gapMultiplier: 2,
  extraSubtract: 6,
})

const studentTableScrollX = computed(() => {
  const base = 72 + 120
  const qs = Math.min(10, questionList.value.length)
  return base + qs * 70 + 120 + 120 + 120
})

// 动态生成表格列：题目最多展示前 10 道，后面追加统计列与操作列
const studentSummaryColumns = computed<any[]>(() => {
  const base: any[] = [
    { title: '序号', key: 'index', width: 72, customRender: ({ index }: any) => String(index + 1).padStart(2, '0') },
    { title: '学生姓名', dataIndex: 'name', key: 'name', width: 130 },
  ]

  const qs = questionList.value
  qs.forEach((q: any) => {
    const qid = String(q?.questionId || '')
    if (!qid) return
    base.push({
      title: `题${String(q?.questionOrder ?? '')}`,
      key: `q_${qid}`,
      dataIndex: ['cells', qid],
      width: 70,
      align: 'center',
    })
  })

  base.push(
    { title: '正确题数', dataIndex: 'correct', key: 'correct', width: 100, align: 'center' },
    { title: '半对题数', dataIndex: 'halfCheck', key: 'halfCheck', width: 100, align: 'center' },
    { title: '错误题数', dataIndex: 'wrong', key: 'wrong', width: 100, align: 'center' },
    { title: '掌握程度', dataIndex: 'completion', key: 'completion', width: 140 },
    { title: '操作', key: 'ops', width: 110, fixed: 'right' }
  )

  return base
})
</script>

<style scoped lang="scss">
.tch-detail-page {
  height: var(--content-height);
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  overflow: hidden;

  .tch-detail-body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 1fr;
    overflow: hidden;
  }
}

.tch-question-main {
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .tch-stu-summary {
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

.tch-kpi-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  .tch-kpi-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-light);
    border-radius: 18px;
    padding: 18px 20px;
    box-shadow: 0 12px 26px var(--color-shadow-brown);
    position: relative;
    overflow: hidden;

    .label {
      font-size: 12px;
      color: var(--color-text-brown);
    }

    .value {
      margin-top: 10px;
      font-size: 34px;
      color: var(--color-text-primary);

      .sub {
        font-size: 14px;
        color: var(--color-text-brown-light);
      }
    }

    .sub {
      margin-top: 8px;
      font-size: 12px;
      color: var(--color-text-brown-light);
    }

    &.ok {
      color: var(--color-success);
    }

    .spark {
      position: absolute;
      right: 18px;
      bottom: 16px;
      display: inline-flex;
      align-items: flex-end;
      gap: 6px;

      .bar {
        width: 8px;
        border-radius: 999px;
        background: var(--color-chart-green-bg);

        &:nth-child(1) {
          height: 18px;
        }

        &:nth-child(2) {
          height: 26px;
        }

        &:nth-child(3) {
          height: 14px;
        }

        &:nth-child(4) {
          height: 34px;
          background: var(--color-chart-green-fill);
        }
      }
    }

    .ring {
      position: absolute;
      right: 18px;
      bottom: 14px;

      :deep(.ant-progress-inner) {
        width: 90px !important;
        height: 90px !important;
      }

      :deep(.ant-progress-circle) {
        width: 90px !important;
        height: 90px !important;
      }

      :deep(.ant-progress-text) {
        color: var(--color-warning);
        font-weight: 700;
      }

      :deep(.ant-progress-circle-trail) {
        stroke: var(--color-border-light);
      }
    }
  }
}

.tch-heatmap-card {
  flex: 1;
  min-height: 300px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: 18px;
  box-shadow: 0 12px 26px var(--color-shadow-brown);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .tch-heatmap-head {
    padding: 20px;

    .title {
      font-size: 16px;
      color: var(--color-text-primary);
    }

    .legend {
      margin-top: 8px;
      font-size: 12px;
      color: var(--color-text-brown);
      gap: 10px;

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;

        &.is-correct {
          background: var(--color-success-bg);
        }

        &.is-half {
          background: var(--color-warning);
        }

        &.is-wrong {
          background: #dc2626;
        }

        &.is-unsubmitted {
          background: var(--color-text-muted);
        }
      }
    }
  }

  .tch-heatmap-table {
    flex: 1;
    min-height: 0;

    :deep(.ant-table) {
      background: transparent;
    }

    :deep(.ant-table-thead > tr > th) {
      background: #fff;
      color: rgb(140 109 93 / 1);
    }

    :deep(.ant-table-tbody > tr > td) {
      border-bottom: 1px solid var(--color-border-light);
    }

    :deep(.ant-table-tbody > tr:hover > td) {
      background: var(--color-bg-warm);
    }
  }

  .tch-show-more {
    width: 100%;
    padding: 12px;
    border: none;
    background: #fff;
    cursor: pointer;
    font-size: 13px;
    color: rgb(140, 109, 93);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    transition: all 0.2s;
    z-index: 10;

    &:hover {
      color: var(--color-primary);
    }

    .chev {
      transition: transform 0.2s;
      &.up {
        transform: rotate(180deg);
      }
    }
  }
}

.tch-cell-chip {
  width: 42px;
  height: 32px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 2;
  border: 1px solid var(--color-border-light);

  &.is-correct {
    background: var(--color-hw-published-bg);
    color: var(--color-success);
    border-color: var(--color-review-correct-border);
  }

  &.is-wrong {
    background: var(--color-error-bg);
    color: var(--color-error);
    border-color: var(--color-review-wrong-border);
  }

  &.is-half {
    background: var(--color-hw-processing-bg);
    color: var(--color-warning);
    border-color: var(--color-review-half-border);
  }

  &.is-nograded {
    background: var(--color-bg-primary);
    color: var(--color-text-muted);
    border-color: var(--color-text-muted);
  }
  &.is-unsubmitted {
    border: none;
  }
}

.tch-comp-cell {
  .line {
    width: 90px;
    height: 6px;
    border-radius: 999px;
    background: var(--color-border-light);
    overflow: hidden;

    .fill {
      display: block;
      height: 100%;
      border-radius: inherit;
    }
  }
}

.tch-op-btn {
  height: 28px;
  padding: 0 10px;
  border-radius: 8px;
  font-size: 12px;
  border: none;
  color: rgb(var(--td-accent-rgb, 236 122 46) / 0.95);
  background: rgb(253 242 233 / 1);
}

.tch-dist-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: 18px;
  box-shadow: 0 12px 26px var(--color-shadow-brown);
  padding: 18px 20px;

  .tch-dist-head {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .title {
      font-size: 16px;
      font-weight: 700;
      color: var(--color-text-primary);
    }

    .time {
      font-size: 12px;
      color: var(--color-text-brown-light);
      font-weight: 700;
    }
  }

  .tch-dist-list {
    margin-top: 14px;
    display: grid;
    gap: 14px;
  }

  .tch-dist-row {
    display: grid;
    grid-template-columns: 60px 1fr 60px;
    align-items: center;
    gap: 14px;

    .q {
      font-weight: 700;
      color: var(--color-text-brown);
    }

    .pct {
      text-align: right;
      font-weight: 700;
      color: var(--color-warning);
    }

    .bar {
      height: 10px;
      border-radius: 999px;
      overflow: hidden;
      display: flex;
      background: var(--color-border-light);

      .seg {
        height: 100%;

        &.is-correct {
          background: var(--color-success);
        }

        &.is-half {
          background: var(--color-warning);
        }

        &.is-wrong {
          background: var(--color-error);
        }

        &.is-unsubmitted {
          background: var(--color-bg-primary);
        }
      }
    }
  }
}

@media (max-width: 1024px) {
  .tch-kpi-row {
    grid-template-columns: 1fr;
  }

  .tch-heatmap-head {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
