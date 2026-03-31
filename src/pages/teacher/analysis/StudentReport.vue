<template>
  <div class="student-report">
    <FilterBar :user-info="userBaseInfo" :show-generate-button="false" @generate="onGenerateReport" />

    <div class="card">
      <div class="card-head">
        <div class="card-title">
          <div class="title-icon">
            <Icon icon="solar:users-group-rounded-bold-duotone" width="20" />
          </div>
          <div class="bold text-lg">
            <div>学生表现明细</div>
          </div>
        </div>
      </div>

      <div ref="tableWrapRef" class="table-wrap">
        <a-table
          class="report-table"
          :dataSource="pagedRows"
          :columns="columns"
          :pagination="false"
          rowKey="id"
          :loading="loading"
          :scroll="{ x: true, y: tableScrollY }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'rank'">
              <div class="rank-pill">{{ record.rank }}</div>
            </template>

            <template v-else-if="column.key === 'student'">
              <div class="student-cell">
                <div class="student-name">{{ record.name }}</div>
              </div>
            </template>

            <template v-else-if="column.key === 'correct'">
              <div class="green">{{ record.correct }}</div>
            </template>

            <template v-else-if="column.key === 'wrong'">
              <div class="red">{{ record.wrong }}</div>
            </template>

            <template v-else-if="column.key === 'accuracy'">
              <div class="acc-cell">
                <div class="acc-track">
                  <div class="acc-fill" :style="{ width: record.accuracy + '%' }"></div>
                </div>
                <div class="acc-value">{{ record.accuracy }}%</div>
              </div>
            </template>

            <template v-else-if="column.key === 'action'">
              <!-- <button type="button" class="details-btn" @click="onDetails(record)">
                查看报告
                <span class="arrow">→</span>
              </button> -->

              <a-button class="light btn-sm" @click="onJumpToDetail(record)"> 查看报告 </a-button>
            </template>

            <template v-else>
              {{ (record as any)[column.dataIndex as any] }}
            </template>
          </template>
        </a-table>

        <TchPagination
          v-model:current="page"
          v-model:pageSize="pageSize"
          :total="filteredRows.length"
          :showSizeChanger="false"
          :showLessItems="true"
          footer-padding="18px 6px 10px"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getStudentReportStudentList } from '@/api/analysis'
import type { StudentReportListRespVO } from '@/api/analysis/type'
import FilterBar from '@/components/charts/FilterBar.vue'
import TchPagination from '@/components/common/table/TchPagination.vue'
import { ROUTES } from '@/router/routes'
import { getUserBaseInfo } from '@/services/storage'
import useAntdTableScrollY from '@/utils/useAntdTableScrollY'
import { Icon } from '@iconify/vue'
import { message } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

type Preset = { label: string; value: [Dayjs, Dayjs] }

type StudentRow = {
  id: string
  rank: number
  studentId: string
  name: string
  total: number
  correct: number
  wrong: number
  accuracy: number
}

const userBaseInfo = getUserBaseInfo()

const router = useRouter()

const filterGrade = ref<string | undefined>(userBaseInfo?.gradeId)
const filterClass = ref<string | undefined>(userBaseInfo?.classInfoList?.[0]?.classId)
const filterSubject = ref<string | undefined>(userBaseInfo?.subjectId)
const selectedStartDate = ref<string>()
const selectedEndDate = ref<string>()

const keyword = ref('')
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)

const rows = ref<StudentRow[]>([])

const num = (v: unknown) => {
  const n = Number.parseFloat(String(v ?? '0'))
  return Number.isFinite(n) ? n : 0
}

const str = (v: unknown) => String(v ?? '').trim()

const mapRespToRow = (it: StudentReportListRespVO, fallbackRank: number): StudentRow => {
  const rank = Math.max(0, Math.floor(num(it.classRank) || fallbackRank))
  const total = Math.max(0, Math.floor(num(it.totalQuestions)))
  const correct = Math.max(0, Math.floor(num(it.correctQuestions)))
  const wrong = Math.max(0, Math.floor(num(it.wrongQuestions)))
  const accuracy = Math.max(0, Math.min(100, Math.round(num(it.correctRate))))
  const id = str(it.studentUserId || it.studentNo || rank)

  return {
    id,
    rank,
    studentId: str(it.studentNo),
    name: str(it.studentName),
    total,
    correct,
    wrong,
    accuracy,
  }
}

const effectiveStartDate = computed(() => selectedStartDate.value || dayjs().startOf('month').format('YYYY-MM-DD'))
const effectiveEndDate = computed(() => selectedEndDate.value || dayjs().format('YYYY-MM-DD'))

const fetchStudentList = async () => {
  const gradeId = str(filterGrade.value)
  const classId = str(filterClass.value)
  const subjectId = str(filterSubject.value)
  const startDate = effectiveStartDate.value
  const endDate = effectiveEndDate.value

  if (!gradeId || !classId || !subjectId || !startDate || !endDate) {
    rows.value = []
    return
  }

  loading.value = true
  try {
    const list = await getStudentReportStudentList({ gradeId, classId, subjectId, startDate, endDate })
    const mapped = (Array.isArray(list) ? list : []).map((it, idx) => mapRespToRow(it, idx + 1))
    mapped.sort((a, b) => a.rank - b.rank)
    rows.value = mapped
  } catch (e: any) {
    rows.value = []
    message.error(e?.message || '获取学生报告失败')
  } finally {
    loading.value = false
  }
}

const filteredRows = computed(() => {
  const kw = keyword.value.trim()
  const list = rows.value

  if (!kw) return list

  return list.filter(r => r.studentId.includes(kw) || r.name.includes(kw))
})

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRows.value.slice(start, end)
})

const tableWrapRef = ref<HTMLElement | null>(null)
const { scrollY: tableScrollY } = useAntdTableScrollY(tableWrapRef, {
  mode: 'viewport',
  minY: 160,
  subtractSelectors: ['.tch-table-footer', '.ant-table-thead'],
  bottomPadding: 24,
})

const columns = computed(() => [
  { title: '排序', dataIndex: 'rank', key: 'rank', width: 90 },
  { title: '学号', dataIndex: 'studentId', key: 'studentId', width: 130 },
  { title: '姓名', dataIndex: 'name', key: 'student', width: 220 },
  { title: '总题量', dataIndex: 'total', key: 'total', width: 100, align: 'center' },
  { title: '答对', dataIndex: 'correct', key: 'correct', width: 100, align: 'center' },
  { title: '答错', dataIndex: 'wrong', key: 'wrong', width: 100, align: 'center' },
  { title: '正确率', dataIndex: 'accuracy', key: 'accuracy', width: 280 },
  { title: '操作', key: 'action', width: 130, fixed: 'right' },
])

const onGenerateReport = (params: {
  gradeId?: string
  classId?: string
  subjectId?: string
  startDate: string
  endDate: string
}) => {
  filterGrade.value = params.gradeId
  filterClass.value = params.classId
  filterSubject.value = params.subjectId
  selectedStartDate.value = params.startDate
  selectedEndDate.value = params.endDate
  page.value = 1
  fetchStudentList().catch(() => {})
}

const onJumpToDetail = (row: StudentRow) => {
  const rawId = String(row?.id || '')
  if (!rawId) {
    message.warning('缺少学生ID，无法跳转')
    return
  }
  const sid = encodeURIComponent(rawId)
  const path = ROUTES.TEACHER_REPORTS_STUDENT_DETAIL.replace(':studentId', sid)

  router
    .push({
      path,
      query: {
        startDate: effectiveStartDate.value,
        endDate: effectiveEndDate.value,
        gradeId: String(filterGrade.value || ''),
        classId: String(filterClass.value || ''),
        subjectId: String(filterSubject.value || ''),
        studentName: row?.name || '',
      },
    })
    .catch(() => {})
}
</script>

<style scoped lang="less">
.student-report {
  min-height: 100vh;
  padding: 0 20px;
  box-sizing: border-box;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.filter-item {
  width: 190px;
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
  font-weight: 700;
  color: #111827;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
}

.card {
  background: #fff;
  border-radius: 22px;
  border: 1px solid #eef0f3;
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.06);
  padding: 18px 18px 10px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 6px 18px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.title-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 30% 30%, #f3e8ff 0%, #ede9fe 40%, #ffffff 100%);
  color: #7c3aed;
}

.report-table {
  :deep(.ant-table) {
    background: transparent;
  }

  :deep(.ant-table-container) {
    border: 0;
  }

  :deep(.ant-table-thead > tr > th) {
    border-bottom: 1px solid #eef0f3;
    background: transparent;
    color: #94a3b8;
    font-size: 12px;
    padding: 14px 12px;
  }

  :deep(.ant-table-tbody > tr > td) {
    border-bottom: 1px solid #f1f5f9;
    padding: 16px 12px;
    color: #111827;
  }

  :deep(.ant-table-tbody > tr:last-child > td) {
    border-bottom: 0;
  }

  .rank-pill {
    width: 34px;
    height: 34px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #111827;
    background: #f1f5f9;
  }

  .student-cell {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .student-name {
    font-weight: 700;
  }

  .green {
    color: rgb(5 150 105);
    font-weight: 700;
  }

  .red {
    color: rgb(244 63 94);
  }
}

.acc-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.acc-track {
  height: 6px;
  width: 200px;
  border-radius: 999px;
  background: #edf2f7;
  overflow: hidden;
}

.acc-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #34d399 0%, #10b981 100%);
}

.acc-value {
  min-width: 44px;
  text-align: right;
  font-weight: 700;
  color: #111827;
}

.btn-sm {
  font-size: 12px;
}

.details-btn:hover {
  border-color: #fed7aa;
  background: #fff7ed;
}

.details-btn .arrow {
  font-weight: 700;
}

.table-wrap {
  border-top: 1px solid #f1f5f9;
}
</style>
