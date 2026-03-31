<template>
  <div class="tch-detail-page">
    <TchDetailHeader
      :header="header"
      :tabs="tabs"
      :active-key="activeTab"
      :show-download="true"
      @back="goBack"
      @navigate="goTab"
      @download="downloadStudentStatsReport"
    />

    <div class="tch-detail-body is-stats">
      <main class="tch-question-main">
        <div class="tch-stats">
          <div class="tch-stats-summary app-surface p-20 flex-between items-center">
            <div class="tch-stats-summary-left">
              <div class="tch-school-row flex items-center gap-10">
                <span class="tch-school-badge bold">OFFICIAL</span>
                <div class="tch-school-name bold">{{ summaryLeft.paperName }}</div>
              </div>
              <div class="tch-paper-row flex items-center gap-sm">
                <Icon icon="solar:document-bold-duotone" width="18" />
                <span class="tch-paper-text">{{ summaryLeft.paperText }}</span>
              </div>
            </div>

            <div class="tch-stats-summary-right">
              <div class="tch-metric-card border-primary">
                <div class="label bold">提交人数</div>
                <span class="value bold">{{ statsSummary.submitCount }}</span>
                <span class="sub">/ {{ statsSummary.totalCount }}人</span>
              </div>
              <div class="tch-metric-card border-primary">
                <div class="label bold">平均提交率</div>
                <div class="value bold">{{ statsSummary.submitRate }}%</div>
              </div>
            </div>
          </div>

          <div ref="statsTableWrapRef" class="tch-stats-table app-surface table--primary">
            <a-table
              :data-source="studentStatsRows"
              :columns="studentStatsColumns"
              :pagination="studentStatsPagination"
              :scroll="{ x: 1100, y: statsTableScrollY }"
              table-layout="fixed"
              row-key="id"
              :loading="statsLoading"
              class="tch-stats-ant-table table-card--primary"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'qType'">
                  <span :class="['tch-qtype-tag', 'bold', qTypeColorClass(record.qType)]">{{ record.qType }}</span>
                </template>

                <template v-else-if="column.key === 'correctRate'">
                  <div class="tch-rate-cell flex items-center gap-10">
                    <a-progress :percent="record.correctRate" size="small" :show-info="false" />
                    <span class="tch-rate-text bold">{{ record.correctRate }}%</span>
                  </div>
                </template>

                <template v-else-if="column.key === 'cw'">
                  <div class="tch-cw-cell bold flex items-center gap-sm">
                    <span class="ok">{{ record.correctCount }}</span>
                    <span class="sep">/</span>
                    <span class="half">{{ record.halfCorrectCount }}</span>
                    <span class="sep">/</span>
                    <span class="bad">{{ record.wrongCount }}</span>
                  </div>
                </template>
              </template>
            </a-table>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getQuestionStatistics } from '@/api/homework'
import type { QuestionStatisticsVO } from '@/api/homework/type'
import TchDetailHeader from '@/components/common/TchDetailHeader.vue'
import { ROUTES } from '@/router/routes'
import type { DetailTab, TabKey } from '@/types/homework'
import { decrypt } from '@/utils/crypto'
import useAntdTableScrollY from '@/utils/useAntdTableScrollY'
import { Icon } from '@iconify/vue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

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

const buildPath = (tpl: string) => tpl.replace(':id', encodeURIComponent(String(routeAssignmentId.value)))

const tabs = computed<DetailTab[]>(() => [
  { key: 'pages', label: '讲错题', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL) },
  { key: 'student_stats', label: '学生作业统计', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL_STUDENT_STATS) },
  { key: 'students', label: '学生（汇总）', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL_STUDENTS) },
  { key: 'origin-work', label: '原作业', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL_ORIGINAL_WORK) },
  { key: 'ai', label: '人工批阅', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL_MANUAL_REVIEW) },
])

const activeTab = computed<TabKey>(() => 'student_stats')

const goTab = (to: string) => {
  router.push(to).catch(() => {})
}

const goBack = () => {
  router.push(ROUTES.TEACHER_HOMEWORK).catch(() => {})
}

type StudentStatsRow = {
  id: string
  pageNo: string
  questionNo: string
  qType: string
  answer: string
  correctRate: number
  correctCount: number
  halfCorrectCount: number
  wrongCount: number
}

const statsLoading = ref(false)
const statsVO = ref<QuestionStatisticsVO | null>(null)

const normalizePercent = (value: unknown) => {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return 0
  if (n <= 1) return Math.round(n * 100)
  return Math.round(n)
}

const qTypeColorClass = (qType: unknown) => {
  const raw = String(qType ?? '').trim()
  if (!raw) return 'gray'

  if (raw.includes('计算')) return 'primary'
  if (raw.includes('选择')) return 'blue'
  if (raw.includes('填空')) return 'green'
  if (raw.includes('判断')) return 'pink'
  if (raw.includes('作图')) return 'light'

  return 'gray'
}

const loadQuestionStats = async () => {
  const aid = String(assignmentId.value || '')
  const cid = String(classId.value || '')
  if (!aid || !cid) {
    statsVO.value = null
    return
  }

  statsLoading.value = true
  try {
    statsVO.value = await getQuestionStatistics({ assignmentId: aid, classId: cid })
  } catch {
    statsVO.value = null
  } finally {
    statsLoading.value = false
  }
}

watch(
  () => [assignmentId.value, classId.value],
  () => {
    loadQuestionStats().catch(() => {})
  },
  { immediate: true }
)

type SummaryLeft = {
  paperName: string
  paperText: string
}

type StatsSummary = {
  submitCount: number
  totalCount: number
  submitRate: number
}

const summaryLeft = computed<SummaryLeft>(() => {
  return {
    paperName: header.value.paperName,
    paperText: `${header.value.subject} ${header.value.gradeClass}`,
  }
})

const statsSummary = computed<StatsSummary>(() => {
  const totalCount = Number(statsVO.value?.totalCount ?? 0) || 0
  const submitCount = Number(statsVO.value?.submitCount ?? 0) || 0
  const submitRate = totalCount > 0 ? Math.round((submitCount / totalCount) * 100) : 0

  return {
    submitCount,
    totalCount,
    submitRate,
  }
})

const studentStatsRows = computed<StudentStatsRow[]>(() => {
  const list = statsVO.value?.questionStatisticsList ?? []
  return list.map((q, idx) => {
    const id = String(q.questionId || `${q.pageNumber || ''}_${q.questionOrder || ''}_${idx}`)
    return {
      id,
      pageNo: String(q.pageNumber ?? '-'),
      questionNo: String(q.questionOrder ?? ''),
      qType: String(q.questionType ?? '-'),

      correctRate: normalizePercent(q.correctRate),
      correctCount: Number(q.correctCount ?? 0) || 0,
      halfCorrectCount: Number(q.halfCorrectCount ?? 0) || 0,
      wrongCount: Number(q.inCorrectCount ?? 0) || 0,
    }
  })
})

const studentStatsColumns = [
  { title: '页码', dataIndex: 'pageNo', key: 'pageNo', width: 80, align: 'center' },
  { title: '题号', dataIndex: 'questionNo', key: 'questionNo', width: 90, align: 'center' },
  { title: '题型', dataIndex: 'qType', key: 'qType', width: 120, align: 'center' },
  { title: '正确率', dataIndex: 'correctRate', key: 'correctRate', width: 240 },
  { title: '正/半对/错', key: 'cw', width: 120 },
]

const studentStatsPagination = false as const

const statsTableWrapRef = ref<HTMLElement | null>(null)
const { scrollY: statsTableScrollY } = useAntdTableScrollY(statsTableWrapRef, {
  mode: 'container',
  minY: 220,
  subtractSelectors: ['.ant-table-thead', '.ant-pagination'],
  subtractPadding: false,
  gapMultiplier: 0,
  extraSubtract: 28,
})

const downloadStudentStatsReport = () => {
  const rows = studentStatsRows.value
  const head = ['页码', '题号', '题型', '正确率', '正确', '半对', '错误']
  const lines = rows.map(r => [
    r.pageNo,
    r.questionNo,
    r.qType,
    `${r.correctRate}%`,
    r.correctCount,
    r.halfCorrectCount,
    r.wrongCount,
  ])
  const csv = '\ufeff' + [head, ...lines].map(arr => arr.join(',')).join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `学生作业统计_${assignmentId.value}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
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
  }
}

.tch-question-main {
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .tch-stats {
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;

    .tch-stats-table {
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .tch-stats-summary {
      .tch-school-badge {
        height: 20px;
        padding: 0 8px;
        border-radius: 999px;
        font-size: 10px;
        line-height: 20px;
        letter-spacing: 0.4px;
        background: var(--color-bg-warm);
        color: var(--color-warning);
      }

      .tch-school-name {
        font-size: 18px;
        color: var(--color-text-primary);
      }

      .tch-paper-row {
        margin-top: 10px;
        color: var(--color-text-brown);
        font-size: 12px;
      }

      .tch-paper-text {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .tch-stats-summary-right {
        display: grid;
        grid-template-columns: 140px 320px;
        gap: 12px;
        align-items: stretch;

        .tch-metric-card {
          border-radius: 12px;
          padding: 12px 14px;
          background: rgb(255 247 237 / 0.5);
          min-width: 0;

          .label {
            font-size: 12px;
            color: var(--color-text-brown);
          }

          .value {
            display: inline-block;
            margin-top: 6px;
            margin-right: 5px;
            font-size: 26px;
            color: var(--color-text-primary);
            line-height: 1.1;
          }

          .sub {
            margin-top: 2px;
            font-size: 12px;
            color: var(--color-text-brown-light);
          }

          .names {
            margin-top: 6px;
            font-size: 12px;
            color: var(--color-text-brown);
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }
        }
      }
    }
  }
}

.tch-qtype-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 12px;

  &.primary {
    color: rgb(var(--td-accent-rgb, 236 122 46) / 0.95);
    background: rgb(253 242 233 / 1);
  }

  &.green {
    background: rgba(var(--td-green), 0.12);
    color: rgba(22, 163, 74, 1);
  }

  &.blue {
    color: var(--color-info);
    background-color: var(--color-info-bg);
  }

  &.gray {
    color: var(--color-text-secondary);
    background-color: var(--color-bg-primary);
  }

  &.pink {
    background: rgb(255 241 242);
    color: rgba(236, 72, 153, 1);
  }

  &.light {
    background: rgb(var(--td-accent-rgb, 236 122 46) / 0.12);
    color: rgb(var(--td-accent-rgb, 236 122 46) / 0.95);
  }
}

.tch-rate-cell {
  .tch-rate-text {
    color: var(--color-text-primary);
  }

  :deep(.ant-progress) {
    flex: 1;
    margin-bottom: 0;
  }

  :deep(.ant-progress-inner) {
    background: var(--color-border-light);
    border-radius: 999px;
  }

  :deep(.ant-progress-bg) {
    height: 6px !important;
    border-radius: 999px;
    background: var(--color-warning);
  }
}

.tch-cw-cell {
  .ok {
    color: var(--color-success);
  }

  .sep {
    color: var(--color-text-secondary);
  }

  .bad {
    color: var(--color-error);
  }
}

.tch-status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--color-bg-success-light);
  border: 1px solid var(--color-border-success-light);
  color: var(--color-text-success-dark);
  font-size: 12px;
}

.tch-dist-cell {
  .tch-dist-badge {
    width: 26px;
    height: 26px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-warm);
    border: 1px solid var(--color-border-light);
    color: var(--color-warning-bg);
    font-size: 12px;
  }

  .tch-dist-bars {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
    flex: 1;
    min-width: 0;

    .bar {
      height: 6px;
      border-radius: 999px;
      background: var(--color-border-light);

      &:nth-child(2) {
        background: var(--color-bg-warm);
      }

      &:nth-child(3) {
        background: var(--color-chart-orange-1);
      }

      &:nth-child(4) {
        background: var(--color-chart-orange-2);
      }

      &:nth-child(5) {
        background: var(--color-chart-orange-3);
      }
    }
  }
}

@media (max-width: 1024px) {
  .tch-question-main .tch-stats .tch-stats-summary {
    flex-direction: column;
    align-items: stretch;

    .tch-stats-summary-right {
      grid-template-columns: 1fr;
    }
  }
}
</style>
