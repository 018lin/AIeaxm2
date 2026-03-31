<template>
  <div class="student-detail">
    <div class="page-top">
      <div class="page-top-left">
        <a-button class="back-btn" type="text" @click="goBack">
          <template #icon><LeftOutlined /></template>
        </a-button>
        <div class="page-title">个人学情分析报告</div>
      </div>

      <div class="page-top-right">
        <div class="last-updated">最后更新: {{ lastUpdatedText }}</div>
      </div>
    </div>

    <div class="p-20 app-surface mb-20">
      <div class="filter-row">
        <a-select
          class="filter-time"
          :value="dateRangeText"
          :options="dateRangeText ? [{ value: dateRangeText, label: dateRangeText }] : []"
          disabled
        />
        <a-select
          class="filter-pill"
          :value="gradeText"
          :options="gradeText ? [{ value: gradeText, label: gradeText }] : []"
          disabled
        />
        <a-select
          class="filter-pill"
          :value="classText"
          :options="classText ? [{ value: classText, label: classText }] : []"
          disabled
        />
        <a-select
          class="filter-pill"
          :value="subjectText"
          :options="subjectText ? [{ value: subjectText, label: subjectText }] : []"
          disabled
        />

        <a-select
          v-model:value="selectedStudentId"
          class="filter-search"
          :options="studentOptions"
          :filter-option="filterStudentOption"
          :dropdownMatchSelectWidth="false"
          show-search
          allow-clear
          placeholder="学生姓名"
          @change="onStudentChange"
        />

        <div class="filter-actions">
          <a-tooltip :title="isGeneratingComment ? '正在生成评语中，请稍等' : ''">
            <a-button
              class="gen-btn gap-xs"
              type="primary"
              :loading="pdfLoading"
              :disabled="isGeneratingComment"
              @click="downloadReportPdf"
            >
              <!-- <template #icon><ThunderboltOutlined /></template> -->
              <Icon icon="uil:export"></Icon>
              导出报告
            </a-button>
          </a-tooltip>
        </div>
      </div>
    </div>

    <div ref="reportRef" class="pdf-report" data-ar-export="student-detail-report">
      <div class="section-head">
        <div class="section-title">
          <i class="section-bar" />
          <span>整体情况</span>
          <span class="section-en">查看整体情况</span>
        </div>
      </div>

      <div class="block">
        <StudentKpi
          :completed="main?.completedAssignments"
          :total-assignments="main?.totalAssignments"
          :correct="main?.correctQuestions"
          :total-questions="main?.totalQuestions"
          :accuracy="main?.correctRate"
        />
      </div>

      <div class="block mb-20">
        <ClassDataComparisonCard
          :data="comparisonData"
          title="班级对比"
          :x-axis-labels="['作业提交率', '答题正确率']"
        />
      </div>

      <div class="block">
        <MasteryChapterCards
          :knowledge-stat="knowledgeStat"
          :chapter-stat="chapterStat"
          :assessment-count="trendPoints"
          :chapter-hint="chapterHint"
        />
      </div>

      <div class="block">
        <!-- 网页模式：单个图表带滚动条 -->
        <div class="trend-chart-web">
          <AccuracyTrendCard :points="trendPoints" :x-axis="trendXAxis" :series="trendSeries" mode="web" />
        </div>
        <!-- PDF模式：分割后的多个图表 -->
        <div class="trend-chart-pdf">
          <template v-if="needsChartSplit">
            <div v-for="(split, index) in trendSplits" :key="index" class="trend-split-item">
              <AccuracyTrendCard
                :x-axis="split.xAxis"
                :series="split.series"
                mode="pdf"
                :title-suffix="`(${index + 1}/${trendSplits.length})`"
              />
              <div v-if="index < trendSplits.length - 1" class="chart-dashed-divider"></div>
            </div>
          </template>
          <template v-else>
            <AccuracyTrendCard :points="trendPoints" :x-axis="trendXAxis" :series="trendSeries" mode="pdf" />
          </template>
        </div>
      </div>
      <SubjectCompetencyPanel
        class="block"
        :legend="literacyLegend"
        :level1-data="report?.literacyLevel1Reports"
        :level2-data="report?.literacyLevel2Reports"
      />

      <StudentQuestionAnalysisCards class="block" :type-rows="questionTypeRows" :diff-rows="difficultyRows" />

      <StudentQuestionAnalysisCards class="block" :type-rows="questionTypeRows" :diff-rows="difficultyRows" />

      <MistakeDistributionCards
        class="block"
        type-title="个人错题题型分布"
        difficulty-title="个人错题难度分布"
        :type-items="wrongTypeItems"
        :difficulty-items="wrongDifficultyItems"
        :avg-difficulty="avgDifficulty"
      />

      <StratifiedHomeworkPanels class="block" :student-name="currentStudentName" :panels="levelingPanels" />

      <MasteryChapterLevelGroup
        :mastery="masteryTableItems"
        :chapters="chapterTableItems"
        :student-name="currentStudentName"
        class="block"
      />

      <ComprehensiveSummaryCard
        v-if="report"
        ref="comprehensiveSummaryCardRef"
        class="block"
        :student-name="currentStudentName"
        :start-date="startDate"
        :end-date="endDate"
        :report="report"
        :text="comprehensiveComment"
      />
    </div>

    <div class="pdf-cover-wrap" aria-hidden="true">
      <div ref="coverRef" class="pdf-cover">
        <div class="cover-top">
          <div class="cover-brand">
            <div class="cover-logo">
              <div class="cover-logo-inner"></div>
            </div>
            <div class="cover-school">{{ coverSchoolName }}</div>
          </div>
        </div>

        <div class="cover-center">
          <div class="cover-title">学生学习报告</div>
          <div class="cover-range">{{ coverDateRange }}</div>
          <div class="cover-chip">{{ coverSubjectChip }}</div>

          <div class="cover-card">
            <div class="cover-row">
              <div class="k">年级 <span class="en">GRADE</span></div>
              <div class="v">{{ coverGrade }}</div>
            </div>
            <div class="cover-row">
              <div class="k">班级 <span class="en">CLASS</span></div>
              <div class="v">{{ coverClass }}</div>
            </div>
            <div class="cover-row">
              <div class="k">学科 <span class="en">SUBJECT</span></div>
              <div class="v">{{ coverSubject }}</div>
            </div>
            <div class="cover-row">
              <div class="k">姓名 <span class="en">NAME</span></div>
              <div class="v">{{ coverStudentName }}</div>
            </div>
            <div class="cover-row">
              <div class="k">学号 <span class="en">ID</span></div>
              <div class="v">{{ coverStudentCode }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getStudentReport } from '@/api/analysis'
import type { StudentReportGetData } from '@/api/analysis/type'
import { getStudentListAll } from '@/api/school'
import type { StudentItem } from '@/api/school/type'
import AccuracyTrendCard from '@/components/charts/AccuracyTrendCard.vue'
import ClassDataComparisonCard from '@/components/charts/ClassDataComparisonCard.vue'
import type { ComprehensiveSummaryCardExpose } from '@/components/charts/ComprehensiveSummaryCard.vue'
import ComprehensiveSummaryCard from '@/components/charts/ComprehensiveSummaryCard.vue'
import MasteryChapterCards from '@/components/charts/MasteryChapterCards.vue'
import MasteryChapterLevelGroup from '@/components/charts/MasteryChapterLevelGroup.vue'
import MistakeDistributionCards from '@/components/charts/MistakeDistributionCards.vue'
import StratifiedHomeworkPanels from '@/components/charts/StratifiedHomeworkPanels.vue'
import StudentKpi from '@/components/charts/StudentKpi.vue'
import StudentQuestionAnalysisCards from '@/components/charts/StudentQuestionAnalysisCards.vue'
import SubjectCompetencyPanel from '@/components/charts/SubjectCompetencyPanel.vue'
import { ROUTES } from '@/router/routes'
import { getUserBaseInfo } from '@/services/storage'
import type { TrendSeries } from '@/types/analysis/charts'
import { exportA4ReportPdf } from '@/utils/analysisReport'
import { LeftOutlined } from '@ant-design/icons-vue'
import { Icon } from '@iconify/vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const userBaseInfo = getUserBaseInfo()

const pdfLoading = ref(false)
const reportRef = ref<HTMLElement | null>(null)
const coverRef = ref<HTMLElement | null>(null)
const comprehensiveSummaryCardRef = ref<ComprehensiveSummaryCardExpose | null>(null)

const coverSchoolName = computed(() =>
  String(
    (userBaseInfo as any)?.schoolName || (userBaseInfo as any)?.orgName || (userBaseInfo as any)?.school || ''
  ).trim()
)

const fmtCover = (d: string) => {
  const v = String(d || '').trim()
  if (!v) return ''
  const x = dayjs(v)
  return x.isValid() ? x.format('YYYY.M.D') : v
}

const coverDateRange = computed(() => {
  const s = fmtCover(startDate.value)
  const e = fmtCover(endDate.value)
  if (!s || !e) return ''
  return `${s} ~ ${e}`
})

const coverGrade = computed(() => String(userBaseInfo?.gradeName || gradeId.value || '').trim())
const coverClass = computed(() => {
  const cid = classId.value
  const found = userBaseInfo?.classInfoList?.find((c: any) => String(c?.classId || '') === cid)
  return String(found?.className || cid || '').trim()
})
const coverSubject = computed(() => String(userBaseInfo?.subjectName || subjectId.value || '').trim())
const coverSubjectChip = computed(() => {
  const s = coverSubject.value
  return s ? `${s}学科评估` : '学科评估'
})
const coverStudentName = computed(() => String(currentStudentName.value || '').trim())
const coverStudentCode = computed(() => {
  const sid = String(selectedStudentId.value || '')
  const found = students.value.find(
    s => String(s.studentUserId || s.studentId || s.userId || s.studentCode || '') === sid
  )
  return String(found?.studentCode || sid || '').trim()
})

const isGeneratingComment = computed(() => comprehensiveSummaryCardRef.value?.loading || false)

const downloadReportPdf = async () => {
  if (pdfLoading.value) return

  const coverEl = coverRef.value
  const reportEl = reportRef.value
  if (!coverEl || !reportEl) return

  pdfLoading.value = true
  try {
    const name = coverStudentName.value || '学生'
    const subject = coverSubject.value || '学科'
    const range = coverDateRange.value ? coverDateRange.value.replace(/\u007f/g, '') : ''
    const fileName = `学生学习报告_${name}_${subject}${range ? '_' + range : ''}.pdf`

    await exportA4ReportPdf({
      coverEl,
      reportEl,
      fileName,
      reportSelector: '[data-ar-export="student-detail-report"]',
      cover: { margin: 0, scale: 3 },
      report: { margin: 28, scale: 3, forceSingleColumn: true },
    })
  } finally {
    pdfLoading.value = false
  }
}

const gradeId = computed(() => String((route.query.gradeId as string | undefined) || userBaseInfo?.gradeId || ''))
const classId = computed(() =>
  String((route.query.classId as string | undefined) || userBaseInfo?.classInfoList?.[0]?.classId || '')
)
const subjectId = computed(() => String((route.query.subjectId as string | undefined) || userBaseInfo?.subjectId || ''))

const startDate = computed(() => String((route.query.startDate as string | undefined) || ''))
const endDate = computed(() => String((route.query.endDate as string | undefined) || ''))

const fmt = (d: string) => {
  const v = String(d || '').trim()
  if (!v) return ''
  const x = dayjs(v)
  return x.isValid() ? x.format('YYYY.MM.DD') : v
}

const dateRangeText = computed(() => {
  const s = fmt(startDate.value)
  const e = fmt(endDate.value)
  if (!s || !e) return '时间范围'
  return `${s} - ${e}`
})

const lastUpdatedText = computed(() => {
  const v = String(endDate.value || '').trim()
  const x = dayjs(v)
  if (x.isValid()) return x.format('YYYY-MM-DD')
  return dayjs().format('YYYY-MM-DD')
})

const gradeText = computed(() => userBaseInfo?.gradeName || (gradeId.value ? `年级：${gradeId.value}` : '年级：-'))

const classText = computed(() => {
  const cid = classId.value
  const found = userBaseInfo?.classInfoList?.find((c: any) => String(c?.classId || '') === cid)
  return found?.className || (cid ? `班级：${cid}` : '班级：-')
})

const subjectText = computed(
  () => userBaseInfo?.subjectName || (subjectId.value ? `学科：${subjectId.value}` : '学科：-')
)

const selectedStudentId = ref<string>('')
const students = ref<StudentItem[]>([])

const studentOptions = computed(() => {
  const list = Array.isArray(students.value) ? students.value : []
  return list
    .map(s => {
      const value = String(s.studentUserId || s.studentId || s.userId || s.studentCode || '')
      const label = String(s.studentName || s.studentCode || value || '')
      return value ? { value, label } : null
    })
    .filter(Boolean) as { value: string; label: string }[]
})

const currentStudentName = computed(() => {
  const sid = String(selectedStudentId.value || '')
  const found = students.value.find(
    s => String(s.studentUserId || s.studentId || s.userId || s.studentCode || '') === sid
  )
  const fromQuery = String((route.query.studentName as string | undefined) || '').trim()
  return String(found?.studentName || fromQuery || '-')
})

const filterStudentOption = (input: string, option: any) => {
  const kw = String(input || '')
    .trim()
    .toLowerCase()
  if (!kw) return true
  const label = String(option?.label || '').toLowerCase()
  return label.includes(kw)
}

const loadStudents = async () => {
  const gid = String(gradeId.value || '')
  const cid = String(classId.value || '')
  if (!gid || !cid) {
    students.value = []
    return
  }

  try {
    const list = await getStudentListAll({ gradeId: gid, classId: cid })
    students.value = Array.isArray(list) ? list : []
  } catch (e: any) {
    students.value = []
    message.error(e?.message || '获取学生列表失败')
  }
}

const routeStudentId = computed(() => String(route.params.studentId || ''))

const syncSelectedStudent = () => {
  const sid = routeStudentId.value
  if (sid) {
    selectedStudentId.value = sid
    return
  }
  const first = studentOptions.value[0]?.value
  if (first) selectedStudentId.value = first
}

const onStudentChange = (val: string) => {
  const sid = String(val || '').trim()
  if (!sid) return
  const path = ROUTES.TEACHER_REPORTS_STUDENT_DETAIL.replace(':studentId', encodeURIComponent(sid))
  router
    .push({
      path,
      query: {
        ...route.query,
        gradeId: gradeId.value || undefined,
        classId: classId.value || undefined,
        subjectId: subjectId.value || undefined,
        startDate: startDate.value || undefined,
        endDate: endDate.value || undefined,
        studentName: currentStudentName.value || undefined,
      },
    })
    .catch(() => {})
}

watch(
  () => [gradeId.value, classId.value],
  async () => {
    await loadStudents()
    syncSelectedStudent()
  }
)

watch(
  () => routeStudentId.value,
  () => syncSelectedStudent()
)

const report = ref<StudentReportGetData | null>(null)

const num = (v: unknown) => {
  const n = Number.parseFloat(String(v ?? '0'))
  return Number.isFinite(n) ? n : 0
}

// 获取学生报告数据
const fetchReport = async () => {
  // 构造请求参数
  const params = {
    gradeId: String(gradeId.value || ''),
    classId: String(classId.value || ''),
    subjectId: String(subjectId.value || ''),
    studentUserId: String(routeStudentId.value || ''),
    startDate: String(startDate.value || ''),
    endDate: String(endDate.value || ''),
  }

  // 检查参数是否完整
  if (
    !params.gradeId ||
    !params.classId ||
    !params.subjectId ||
    !params.studentUserId ||
    !params.startDate ||
    !params.endDate
  ) {
    report.value = null // 参数不完整时清空报告数据
    return
  }

  try {
    // 调用 API 获取学生报告
    report.value = await getStudentReport(params)
  } catch (e: any) {
    // 获取失败时清空报告数据并提示错误
    report.value = null
    message.error(e?.message || '获取学生报告失败')
  }
}

watch(
  () => [routeStudentId.value, gradeId.value, classId.value, subjectId.value, startDate.value, endDate.value],
  // 当路由参数或筛选条件变化时，重新获取报告数据
  newVal => {
    fetchReport().catch(() => {})
  }
)

const main = computed(() => report.value?.mainReport)

const comparisonData = computed(() => {
  if (!main.value) return []
  return [
    {
      className: currentStudentName.value || '个人',
      submissionRate: num(main.value.submitRate),
      accuracyRate: num(main.value.correctRate),
    },
    {
      className: '班级平均',
      submissionRate: num(main.value.classAvgSubmitRate),
      accuracyRate: num(main.value.classAvgCorrectRate),
    },
  ]
})

const trendReports = computed(() => report.value?.trendReports || [])
const trendPoints = computed(() => trendReports.value.length)
const trendXAxis = computed(() => trendReports.value.map(r => r.assignmentName || r.assignmentDate))
const trendSeries = computed(() => [
  { name: currentStudentName.value || '个人', color: '#f5b65b', data: trendReports.value.map(r => num(r.correctRate)) },
  { name: '班级平均', color: '#14b8a6', data: trendReports.value.map(r => num(r.classAvgCorrectRate)) },
  { name: '班级最高', color: '#6366f1', data: trendReports.value.map(r => num(r.classMaxCorrectRate)) },
])

// PDF模式下图表分割逻辑
// 规则：数据点超过15个且剩余超过5个时自动分割，每个图表最多20个点
const trendSplits = computed(() => {
  const total = trendXAxis.value.length
  if (total <= 15) {
    return [{ xAxis: trendXAxis.value, series: trendSeries.value }]
  }

  const splits: { xAxis: string[]; series: TrendSeries[] }[] = []
  let remaining = total
  let start = 0

  while (remaining > 0) {
    // 每个分割最多20个点
    const chunkSize = Math.min(20, remaining)
    // 如果剩余点数<=5，合并到上一个分割
    if (remaining - chunkSize <= 5 && splits.length > 0) {
      const lastSplit = splits[splits.length - 1]
      lastSplit.xAxis = trendXAxis.value.slice(start)
      lastSplit.series = trendSeries.value.map(s => ({
        ...s,
        data: s.data.slice(start),
      }))
      break
    }

    splits.push({
      xAxis: trendXAxis.value.slice(start, start + chunkSize),
      series: trendSeries.value.map(s => ({
        ...s,
        data: s.data.slice(start, start + chunkSize),
      })),
    })

    start += chunkSize
    remaining -= chunkSize
  }

  return splits
})

// 是否需要分割图表（PDF模式使用）
const needsChartSplit = computed(() => trendSplits.value.length > 1)

const knowledgeStat = computed(() => report.value?.knowledgePointMasteryStatistics)
const chapterStat = computed(() => report.value?.chapterMasteryStatistics)

const chapterHint = computed(() => {
  const list = report.value?.chapterReports || []
  if (!list.length) return '章节掌握度分布统计'
  const worst = list.reduce((a, b) => (num(a.correctRate) <= num(b.correctRate) ? a : b))
  return `${worst.chapterName}需要关注：正确率 ${num(worst.correctRate).toFixed(2)}% ，错题 ${Math.round(num(worst.wrongQuestions))} 道。`
})

const masteryTableItems = computed(() =>
  (report.value?.knowledgePointReports || []).map(r => ({
    name: r.knowledgePointName,
    totalQuestions: Math.round(num(r.totalQuestions)),
    wrongQuestions: Math.round(num(r.wrongQuestions)),
    correctRate: num(r.correctRate),
    classAvgCorrectRate: num(r.classAvgCorrectRate),
    classMaxCorrectRate: num(r.classMaxCorrectRate),
  }))
)

const chapterTableItems = computed(() =>
  (report.value?.chapterReports || []).map(r => ({
    name: r.chapterName,
    totalQuestions: Math.round(num(r.totalQuestions)),
    wrongQuestions: Math.round(num(r.wrongQuestions)),
    correctRate: num(r.correctRate),
    classAvgCorrectRate: num(r.classAvgCorrectRate),
    classMaxCorrectRate: num(r.classMaxCorrectRate),
  }))
)

const literacyLegend = computed(() => [
  { name: currentStudentName.value || '个人', color: '#3b82f6' },
  { name: '班级平均', color: '#14b8a6' },
])

const palette = ['#34d399', '#a78bfa', '#fb7185', '#60a5fa', '#38bdf8', '#f97316']

const wrongTypeItems = computed(() =>
  (report.value?.wrongQuestionTypeDistributions || []).map((r, idx) => ({
    name: r.dimensionValue,
    value: Math.round(num(r.wrongCount)),
    color: palette[idx % palette.length],
  }))
)

const difficultyLevel = (name: string) => {
  const n = String(name || '')
  if (n.includes('易')) return 'Level 1-4'
  if (n.includes('中')) return 'Level 5-7'
  if (n.includes('难')) return 'Level 8-10'
  return ''
}

const wrongDifficultyItems = computed(() =>
  (report.value?.wrongQuestionDifficultyDistributions || []).map((r, idx) => ({
    name: r.dimensionValue,
    value: Math.round(num(r.wrongCount)),
    level: difficultyLevel(r.dimensionValue),
    color: palette[idx % palette.length],
  }))
)

const avgDifficulty = computed(() => {
  const list = report.value?.wrongQuestionDifficultyDistributions || []
  const weight = (name: string) => {
    const n = String(name || '')
    if (n.includes('易')) return 3
    if (n.includes('中')) return 6
    if (n.includes('难')) return 9
    return 5
  }
  const sum = list.reduce((s, it) => s + num(it.wrongCount), 0)
  if (!sum) return 0
  const wsum = list.reduce((s, it) => s + weight(it.dimensionValue) * num(it.wrongCount), 0)
  return Number((wsum / sum).toFixed(1))
})

const questionTypeRows = computed(() =>
  (report.value?.questionTypeReports || []).map(r => ({
    key: r.questionType,
    name: r.questionType,
    total: Math.round(num(r.totalQuestions)),
    wrong: Math.round(num(r.wrongQuestions)),
    personRate: Math.round(num(r.correctRate)),
    classRate: Math.round(num(r.classAvgCorrectRate)),
    maxRate: Math.round(num(r.classMaxCorrectRate)),
  }))
)

const difficultyRows = computed(() =>
  (report.value?.difficultyReports || []).map(r => {
    const name = String(r.difficulty || '')
    const tagTone = name.includes('易') ? 'tone-easy' : name.includes('中') ? 'tone-mid' : 'tone-hard'
    return {
      key: name,
      name,
      total: Math.round(num(r.totalQuestions)),
      wrong: Math.round(num(r.wrongQuestions)),
      personRate: Math.round(num(r.correctRate)),
      classRate: Math.round(num(r.classAvgCorrectRate)),
      classMaxCorrectRate: Math.round(num(r.classMaxCorrectRate)),
      tagTone,
    }
  })
)

const levelingPanels = computed(() =>
  (report.value?.levelingReports || []).map(r => {
    const name = String(r.groupName || '')
    const titleEn = name.includes('基础') ? '基础层' : name.includes('提高') ? '提高层' : 'LEVEL'
    return {
      key: r.groupId,
      titleCn: `分层作业（${name}）`,
      titleEn,
      completed: Math.round(num(r.completedAssignments)),
      totalAssignments: Math.round(num(r.totalAssignments)),
      correct: Math.round(num(r.correctQuestions)),
      totalQuestions: Math.round(num(r.totalQuestions)),
      accuracy: Math.round(num(r.correctRate)),
      submitRate: Math.round(num(r.submitRate)),
      avgSubmitRate: Math.round(num(r.groupAvgSubmitRate)),
      avgAccuracyRate: Math.round(num(r.groupAvgCorrectRate)),
    }
  })
)

const comprehensiveComment = computed(() => String(report.value?.comprehensiveComment || '').trim())

onMounted(async () => {
  await loadStudents() // 加载学生列表
  syncSelectedStudent() // 同步选中的学生
  fetchReport().catch(() => {})
})

const goBack = () => {
  router.back()
}
</script>

<style scoped lang="less">
.student-detail {
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

.pdf-cover-wrap {
  position: fixed;
  left: -99999px;
  top: 0;
  width: 794px;
  height: 1123px;
  pointer-events: none;
}

.pdf-cover {
  width: 794px;
  height: 1123px;
  background: #fff7f2;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cover-top {
  width: 100%;
  padding-top: 70px;
  display: flex;
  justify-content: center;
}

.cover-brand {
  display: flex;
  align-items: center;
  gap: 18px;
}

.cover-logo {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: #ff6b00;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-logo-inner {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  background: #fff;
  clip-path: polygon(50% 10%, 92% 80%, 8% 80%);
}

.cover-school {
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
}

.cover-center {
  margin-top: 58px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cover-title {
  font-size: 56px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: 1px;
}

.cover-range {
  margin-top: 18px;
  font-size: 22px;
  font-weight: 700;
  color: rgba(51, 65, 85, 0.8);
}

.cover-chip {
  margin-top: 18px;
  padding: 10px 22px;
  border-radius: 999px;
  background: rgba(255, 107, 0, 0.12);
  border: 1px solid rgba(255, 107, 0, 0.25);
  color: #ff6b00;
  font-weight: 700;
}

.cover-card {
  margin-top: 42px;
  width: 620px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 18px;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.cover-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 26px;
  border-top: 1px solid rgba(148, 163, 184, 0.16);
}

.cover-row:first-child {
  border-top: none;
}

.cover-row .k {
  color: rgba(100, 116, 139, 0.9);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.4px;
}

.cover-row .k .en {
  margin-left: 6px;
  font-weight: 700;
  font-size: 12px;
  color: rgba(100, 116, 139, 0.55);
}

.cover-row .v {
  color: rgba(15, 23, 42, 0.95);
  font-size: 18px;
  font-weight: 700;
}

.page-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.page-top-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.back-btn {
  padding: 0 6px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
  white-space: nowrap;
}

.page-top-right {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(51, 65, 85, 0.78);
  font-weight: 700;
}

.last-updated {
  font-size: 12px;
}

.share-btn {
  padding: 0 6px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-pill {
  width: 140px;
}

.filter-time {
  width: 210px;
}

.filter-search {
  width: 220px;
}

.filter-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.gen-btn {
  height: 44px;
  padding: 0 22px;
  border-radius: 10px;
  font-weight: 700;
  background: #ff6b00;
  border-color: #ff6b00;
}

.gen-btn:hover {
  background: #f76700;
  border-color: #f76700;
}

.section-head {
  margin: 8px 0 14px;
}

.section-title {
  display: inline-flex;
  align-items: flex-end;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.section-bar {
  width: 4px;
  height: 18px;
  border-radius: 99px;
  background: #f59e0b;
  display: inline-block;
}

.section-en {
  font-size: 12px;
  font-weight: normal;
  color: rgba(100, 116, 139, 0.7);
}

.block {
  margin-bottom: 16px;
}

/* 网页模式默认显示，PDF模式默认隐藏 */
/* 关键：使用 visibility: hidden 保留元素空间，让子元素的 clientHeight/clientWidth 不为 0 */
/* 这样 echarts 才能正常初始化 */
.trend-chart-pdf {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  /* 使用 visibility: hidden 而不是 display: none，保留元素空间 */
  visibility: hidden;
  pointer-events: none;
  z-index: -9999;
  /* 确保容器撑开，让子元素有正确的尺寸 */
  display: block;
}

/* 图表分割项 */
.trend-split-item {
  margin-bottom: 16px;
}

.trend-split-item:last-child {
  margin-bottom: 0;
}

/* 虚线分隔符 */
.chart-dashed-divider {
  height: 1px;
  background: repeating-linear-gradient(to right, #e2e8f0 0, #e2e8f0 8px, transparent 8px, transparent 16px);
  margin: 16px 0;
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 1100px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}

:deep(.ant-input[disabled]) {
  color: rgba(15, 23, 42, 0.9);
  background: #fff;
}

:deep(.ant-select-selector) {
  border-radius: 12px;
  height: 40px;
  padding: 0 12px;
  display: flex;
  align-items: center;
}

:deep(.ant-input) {
  border-radius: 12px;
  height: 40px;
}
</style>
