<template>
  <div class="class-report">
    <FilterBar @generate="onGenerateReport" />

    <!-- 核心指标 -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-top">
          <div class="kpi-label">作业数</div>
          <div class="kpi-icon kpi-icon-blue"><ReadOutlined /></div>
        </div>
        <div class="kpi-value-row">
          <div class="kpi-value">{{ kpi.activeAssignments }}</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-top">
          <div class="kpi-label">班级平均提交率</div>
          <div class="kpi-icon kpi-icon-green"><CloudUploadOutlined /></div>
        </div>
        <div class="kpi-submission flex">
          <div class="kpi-percent">
            <span class="kpi-value">{{ kpi.submissionRate }}</span>
            <span class="kpi-unit">%</span>
          </div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-top">
          <div class="kpi-label">班级平均正确率</div>
          <div class="kpi-icon kpi-icon-orange"><CheckCircleOutlined /></div>
        </div>
        <div class="kpi-value-row">
          <div class="kpi-percent">
            <span class="kpi-value">{{ kpi.accuracyRate }}</span>
            <span class="kpi-unit">%</span>
          </div>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <StudentDistributionCard
        :submission-rate="kpi.submissionRate"
        :accuracy-rate="kpi.accuracyRate"
        :distribution-data="distribution"
      />

      <ClassDataComparisonCard
        title="班级数据对比"
        :x-axis-labels="['平均提交率', '平均正确率']"
        :data="classComparisonData"
      />
    </div>

    <MasteryChapterCards
      :knowledge-stat="reportData?.knowledgePointMasteryStatistics"
      :chapter-stat="reportData?.chapterMasteryStatistics"
      :assessment-count="meta.assessmentCount"
      :chapter-hint="chapterHint"
      class="mb-20"
    />
    <SubjectCompetencyPanel
      :legend="subjectCompetencyLegend"
      :level1-data="reportData?.literacyLevel1Reports"
      :level2-data="reportData?.literacyLevel2Reports"
      class="mb-20"
    />
    <AccuracyTrendCard :points="trendMeta.points" :trend-reports="reportData?.trendReports" class="mb-20" />
    <StudentQuestionAnalysisCards
      :type-rows="questionAnalysisTypeRows"
      :diff-rows="questionAnalysisDiffRows"
      :is-class-report="true"
      class="mb-20"
    />
    <MistakeDistributionCards
      class="mb-20"
      type-title="班级共性错题题型分布"
      difficulty-title="班级共性错题难度分布"
      :type-items="mistakeTypeItems"
      :difficulty-items="mistakeDifficultyItems"
    />

    <MasteryChapterLevelGroup
      :mastery="masteryForLevelGroup"
      :chapters="chaptersForLevelGroup"
      :knowledge-point-mastery-groups="reportData?.knowledgePointMasteryGroups"
      :chapter-mastery-groups="reportData?.chapterMasteryGroups"
      :is-class-report="true"
      class="mb-20"
    />

    <ComprehensiveSummaryCard :report="reportData" :text="reportData?.comprehensiveComment" />
  </div>
</template>

<script setup lang="ts">
import { getClassReport } from '@/api/analysis'
import type { ClassReportQueryReqVO, ClassReportRespVO } from '@/api/analysis/type'
import AccuracyTrendCard from '@/components/charts/AccuracyTrendCard.vue'
import ClassDataComparisonCard from '@/components/charts/ClassDataComparisonCard.vue'
import ComprehensiveSummaryCard from '@/components/charts/ComprehensiveSummaryCard.vue'
import FilterBar from '@/components/charts/FilterBar.vue'
import MasteryChapterCards from '@/components/charts/MasteryChapterCards.vue'
import MasteryChapterLevelGroup from '@/components/charts/MasteryChapterLevelGroup.vue'
import MistakeDistributionCards from '@/components/charts/MistakeDistributionCards.vue'
import StudentDistributionCard from '@/components/charts/StudentDistributionCard.vue'
import StudentQuestionAnalysisCards from '@/components/charts/StudentQuestionAnalysisCards.vue'
import SubjectCompetencyPanel from '@/components/charts/SubjectCompetencyPanel.vue'
import { CheckCircleOutlined, CloudUploadOutlined, ReadOutlined } from '@ant-design/icons-vue'
import * as echarts from 'echarts'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const filterParams = ref<Partial<ClassReportQueryReqVO>>({})

const onGenerateReport = (params: ClassReportQueryReqVO) => {
  filterParams.value = params
  fetchClassReport()
}

const reportData = ref<ClassReportRespVO | null>(null)

const fetchClassReport = async () => {
  if (!Object.keys(filterParams.value).length) return
  try {
    const response = await getClassReport(filterParams.value as ClassReportQueryReqVO)
    reportData.value = response
  } catch (error) {
    console.error('Failed to fetch class report:', error)
    reportData.value = null
  }
}

const kpi = computed(() => {
  const mainReport = reportData.value?.mainReport
  return {
    activeAssignments: mainReport?.totalAssignments || 0,
    activeAssignmentsDelta: 0, // No direct mapping in API for delta
    submissionRate: mainReport?.submitRate || mainReport?.classAvgSubmitRate || 0,
    accuracyRate: mainReport?.correctRate || mainReport?.classAvgCorrectRate || 0,
    accuracyRateDelta: 0, // No direct mapping in API for delta
  }
})

const distribution = computed(() => {
  const submissionDist = reportData.value?.submissionDistribution
  const accuracyDist = reportData.value?.accuracyDistribution

  return {
    submission: {
      above: {
        count: submissionDist?.aboveCount || 0,
        rate: submissionDist?.abovePercentage || 0,
        students: submissionDist?.aboveStudents || [],
      },
      equal: {
        count: submissionDist?.equalCount || 0,
        rate: submissionDist?.equalPercentage || 0,
        students: submissionDist?.equalStudents || [],
      },
      below: {
        count: submissionDist?.belowCount || 0,
        rate: submissionDist?.belowPercentage || 0,
        students: submissionDist?.belowStudents || [],
      },
    },
    accuracy: {
      above: {
        count: accuracyDist?.aboveCount || 0,
        rate: accuracyDist?.abovePercentage || 0,
        students: accuracyDist?.aboveStudents || [],
      },
      equal: {
        count: accuracyDist?.equalCount || 0,
        rate: accuracyDist?.equalPercentage || 0,
        students: accuracyDist?.equalStudents || [],
      },
      below: {
        count: accuracyDist?.belowCount || 0,
        rate: accuracyDist?.belowPercentage || 0,
        students: accuracyDist?.belowStudents || [],
      },
    },
  }
})

// 章节进度
const chapters = computed(() => {
  return (
    reportData.value?.chapterReports?.map(chapter => ({
      name: chapter.chapterName || '',
      code: chapter.chapterCode || '',
      progress: chapter.completionRate || 0, // Assuming completionRate maps to progress
      accuracy: chapter.correctRate || 0,
    })) || []
  )
})

// 章节提醒文案
const chapterHint = computed(() => {
  const it = chapters.value.find(c => c.code === '第02章') // This logic might need adjustment based on actual chapter codes
  if (!it) return '暂无提醒'
  return `第二章需要关注：完成度 ${it.progress}% ，正确率 ${it.accuracy}% 。`
})

const meta = computed(() => ({
  assessmentCount: reportData.value?.mainReport?.totalAssignments || 0,
}))

const trendMeta = computed(() => ({
  points: reportData.value?.trendReports?.length || 0, // Assuming points refers to the number of trend data points
}))

const classComparisonData = computed(() => {
  return (reportData.value?.classComparisonList || []).map(item => ({
    className: item.className || '',
    submissionRate: item.avgSubmitRate || 0,
    accuracyRate: item.avgCorrectRate || 0,
  }))
})

const mistakeTypeItems = computed(() => {
  const colors = ['#6366f1', '#14b8a6', '#f97316', '#ec4899']
  return (reportData.value?.wrongQuestionTypeDistributions || []).map((item, index) => ({
    name: item.dimensionValue || '',
    value: item.wrongCount || 0,
    color: colors[index % colors.length],
  }))
})

const mistakeDifficultyItems = computed(() => {
  const colors = ['#3b82f6', '#2dd4bf', '#f59e0b']
  return (reportData.value?.wrongQuestionDifficultyDistributions || []).map((item, index) => ({
    name: item.dimensionValue || '',
    value: item.wrongCount || 0,
    color: colors[index % colors.length],
    level: item.dimensionValue || '',
  }))
})

const subjectCompetencyLegend = computed(() => {
  const comparisonList = reportData.value?.classComparisonList
  const colors = ['#3b82f6', '#2dd4bf', '#f97316']

  if (comparisonList && comparisonList.length > 0) {
    // 使用 classComparisonList 动态生成图例，最多显示两个班级
    return comparisonList.slice(0, 2).map((classInfo, index) => ({
      name: classInfo.className || `班级 ${index + 1}`,
      color: colors[index],
    }))
  }

  // Fallback if no data is available
  return [
    { name: '当前班级', color: colors[0] },
    { name: '对比班级', color: colors[1] },
  ]
})

const questionAnalysisTypeRows = computed(() => {
  return (reportData.value?.questionTypeReports || []).map(item => ({
    key: item.questionType || '',
    name: item.questionType || '',
    total: item.totalQuestions || 0,
    classAvgCorrectRate: item.classAvgCorrectRate || 0,
    classMaxCorrectRate: item.classMaxCorrectRate || 0,
    classMinCorrectRate: item.classMinCorrectRate || 0,
  }))
})

const questionAnalysisDiffRows = computed(() => {
  const getTagTone = (difficulty: string) => {
    if (difficulty === '容易') return 'tone-easy'
    if (difficulty === '适中') return 'tone-mid'
    if (difficulty === '困难') return 'tone-hard'
    return ''
  }

  return (reportData.value?.difficultyReports || []).map(item => ({
    key: item.difficulty || '',
    name: item.difficulty || '',
    total: item.totalQuestions || 0,
    classAvgCorrectRate: item.classAvgCorrectRate || 0,
    classMaxCorrectRate: item.classMaxCorrectRate || 0,
    classMinCorrectRate: item.classMinCorrectRate || 0,
    tagTone: getTagTone(item.difficulty || ''),
  }))
})

const masteryForLevelGroup = computed(() => {
  return (reportData.value?.knowledgePointReports || []).map(item => ({
    name: item.knowledgePointName || '',
    totalQuestions: item.totalQuestions || 0,
    wrongQuestions: item.wrongQuestions || 0,
    correctRate: item.correctRate || 0,
    classAvgCorrectRate: item.classAvgCorrectRate || 0,
    classMaxCorrectRate: item.classMaxCorrectRate || 0,
    classMinCorrectRate: item.classMinCorrectRate || 0,
  }))
})

const chaptersForLevelGroup = computed(() => {
  return (reportData.value?.chapterReports || []).map(item => ({
    name: item.chapterName || '',
    totalQuestions: item.totalQuestions || 0,
    wrongQuestions: item.wrongQuestions || 0,
    correctRate: item.correctRate || 0,
    classAvgCorrectRate: item.classAvgCorrectRate || 0,
    classMaxCorrectRate: item.classMaxCorrectRate || 0,
    classMinCorrectRate: item.classMinCorrectRate || 0,
  }))
})

const submissionChartRef = ref<HTMLDivElement | null>(null)
const distributionChartRef = ref<HTMLDivElement | null>(null)

let submissionChart: echarts.ECharts | null = null
let distributionChart: echarts.ECharts | null = null

const submissionOption = () => {
  const val = kpi.value.submissionRate
  return {
    tooltip: { trigger: 'item', formatter: () => `平均提交率：${val}%` },
    series: [
      {
        type: 'gauge',
        startAngle: 90,
        endAngle: -270,
        radius: '100%',
        pointer: { show: false },
        axisLine: { lineStyle: { width: 8, color: [[1, '#eef2f7']] } },
        progress: { show: true, roundCap: true, clip: false, itemStyle: { color: '#14b8a6' } },
        splitLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        detail: { show: false },
        data: [{ value: val }],
      },
    ],
  }
}

const distributionOption = () => {
  const cats = ['高于平均值', '处于平均线', '低于平均值']
  const a = distribution.value
  const submissionCounts = [a.above.count, a.equal.count, a.below.count]
  const accuracyCounts = [a.above.count, a.equal.count, a.below.count]

  return {
    grid: { top: 14, right: 12, bottom: 18, left: 12, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['提交率分布', '正确率分布'], right: 6, top: 0, icon: 'circle', itemWidth: 10, itemHeight: 10 },
    xAxis: {
      type: 'category',
      data: cats,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: 'rgba(17, 24, 39, 0.55)', fontWeight: 800, fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { show: false },
      axisTick: { show: false },
      axisLine: { show: false },
      splitLine: { lineStyle: { type: 'dashed', color: '#eef2f7' } },
    },
    series: [
      {
        name: '提交率分布',
        type: 'bar',
        barWidth: 18,
        itemStyle: { color: '#6366f1', borderRadius: [10, 10, 0, 0] },
        data: submissionCounts,
      },
      {
        name: '正确率分布',
        type: 'bar',
        barWidth: 18,
        itemStyle: { color: '#14b8a6', borderRadius: [10, 10, 0, 0] },
        data: accuracyCounts,
      },
    ],
  }
}

const initCharts = () => {
  if (submissionChartRef.value) {
    submissionChart?.dispose()
    submissionChart = echarts.init(submissionChartRef.value)
    submissionChart.setOption(submissionOption())
  }

  if (distributionChartRef.value) {
    distributionChart?.dispose()
    distributionChart = echarts.init(distributionChartRef.value)
    distributionChart.setOption(distributionOption())
  }
}

const resizeCharts = () => {
  submissionChart?.resize()
  distributionChart?.resize()
}

// Watch for data changes to update charts
watch(reportData, async newData => {
  if (!newData) return
  await nextTick()
  submissionChart?.setOption(submissionOption(), true)
  distributionChart?.setOption(distributionOption(), true)
})

onMounted(async () => {
  await nextTick()
  initCharts()
  window.addEventListener('resize', resizeCharts)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCharts)
  submissionChart?.dispose()
  distributionChart?.dispose()
})
</script>

<style scoped lang="less">
.class-report {
  min-height: 100vh;
  padding: 0 20px;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.page-title {
  font-size: 22px;
  font-weight: 800;
  color: #111827;
  letter-spacing: 0.2px;
  white-space: nowrap;
}

.filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-item {
  width: 120px;
}

.filters :deep(.ant-select-selector) {
  border-radius: 18px;
  height: 36px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  box-shadow: none;
}

.filters :deep(.ant-select-selection-item) {
  font-weight: 600;
  color: #111827;
}

.head-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notify-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.kpi-card {
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  padding: 18px 18px 16px;
  box-sizing: border-box;
}

.kpi-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.kpi-label {
  font-size: 12px;
  letter-spacing: 0.8px;
  color: rgba(17, 24, 39, 0.45);
  font-weight: 800;
}

.kpi-icon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.kpi-icon-blue {
  background: rgba(99, 102, 241, 0.08);
  color: #6366f1;
}

.kpi-icon-green {
  background: rgba(20, 184, 166, 0.1);
  color: #14b8a6;
}

.kpi-icon-orange {
  background: rgba(249, 115, 22, 0.1);
  color: #f97316;
}

.kpi-value-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-top: 14px;
}

.kpi-value {
  font-size: 44px;
  line-height: 1;
  font-weight: 700;
  color: #111827;
}

.kpi-unit {
  font-size: 18px;
  font-weight: 800;
  color: rgba(17, 24, 39, 0.45);
  margin-left: 2px;
}

.kpi-chip {
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
}

.kpi-submission {
  margin-top: 14px;
}

.kpi-percent {
  display: flex;
  align-items: baseline;
}

.kpi-track {
  margin-top: 10px;
  height: 6px;
  border-radius: 999px;
  background: #eef2f7;
  overflow: hidden;
}

.kpi-fill {
  height: 100%;
  border-radius: 999px;
}

.kpi-fill-teal {
  background: #14b8a6;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.card {
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  padding: 18px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.card-wide {
  padding: 18px;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.row-between {
  justify-content: space-between;
  align-items: flex-start;
}

.card-title {
  font-size: 18px;
  line-height: 28px;
  font-weight: 700;
  margin-bottom: 4px;
  color: rgb(30 41 59);
  display: flex;
  align-items: baseline;
}

.title-en {
  font-weight: 400;
  font-size: 16px;
  margin-left: 8px;
  color: #64748b;
}

.card-subtitle {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: rgba(17, 24, 39, 0.35);
}

.card-info {
  color: rgba(17, 24, 39, 0.25);
}

.card-divider {
  height: 1px;
  background: rgba(15, 23, 42, 0.06);
  margin: 10px 0 0;
}

.distribution {
  position: relative;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 190px;
  padding: 18px 20px 0;
  box-sizing: border-box;
}

.distribution::before {
  content: '';
  position: absolute;
  left: 18px;
  right: 18px;
  top: 8px;
  bottom: 18px;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent 54px,
    rgba(15, 23, 42, 0.04) 54px,
    rgba(15, 23, 42, 0.04) 55px
  );
  pointer-events: none;
}

.dist-item {
  width: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dist-bar {
  width: 44px;
  height: 120px;
  border-radius: 999px;
  position: relative;
  opacity: 0.92;
  box-shadow: 0 18px 30px rgba(99, 102, 241, 0.22);
}

.dist-bar-blue {
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.95), rgba(99, 102, 241, 0.22));
}

.dist-bar-teal {
  background: linear-gradient(180deg, rgba(20, 184, 166, 0.95), rgba(20, 184, 166, 0.22));
  box-shadow: 0 18px 30px rgba(20, 184, 166, 0.22);
}

.dist-glow {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 10px;
  height: 34px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.35);
  transform: rotate(12deg);
}

.dist-shadow {
  width: 44px;
  height: 54px;
  margin-top: -18px;
  border-radius: 999px;
  background: rgba(251, 207, 232, 0.55);
  filter: blur(6px);
}

.dist-label {
  margin-top: 10px;
  font-size: 12px;
  color: rgba(17, 24, 39, 0.45);
}

.dist-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dist-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(241, 245, 249, 0.55);
}

.dist-row-highlight {
  background: rgba(255, 247, 237, 1);
  border: 1px solid rgba(255, 237, 213, 1);
}

.dist-row-left {
  color: rgba(17, 24, 39, 0.55);
  font-weight: 800;
}

.dist-row-left-highlight {
  color: #f97316;
}

.dist-row-right {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.dist-row-num {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.dist-row-rate {
  font-size: 12px;
  font-weight: 800;
  color: rgba(17, 24, 39, 0.35);
}

.dist-row-num-highlight {
  color: #f97316;
}

.dist-row-rate-highlight {
  color: rgba(249, 115, 22, 0.65);
}

.chart {
  width: 100%;
}

.chart-kpi {
  height: 56px;
  margin-top: 8px;
}

.chart-distribution {
  height: 280px;
  margin-top: 12px;
}

.card-foot-divider {
  height: 1px;
  background: rgba(15, 23, 42, 0.06);
  margin-top: 14px;
}

.card-mastery .card-foot {
  margin-top: 12px;
}

.card-mastery .card-subtitle {
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.95);
}

.mastery-legend {
  color: rgba(100, 116, 139, 0.85);
}

.mastery-legend .mini-dot {
  width: 7px;
  height: 7px;
}

.chart-chapters {
  height: 320px;
  margin-top: 10px;
}

.chart-trend {
  height: 320px;
}

.mini-legend {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
  font-size: 10px;
  font-weight: 700;
  color: rgba(17, 24, 39, 0.35);
}

.mini-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.mini-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.mini-dot-green {
  background: #10b981;
}

.mini-dot-blue {
  background: #6366f1;
}

.mini-dot-pink {
  background: #fb7185;
}

.mini-line {
  width: 10px;
  height: 3px;
  border-radius: 3px;
  display: inline-block;
}

.mini-line-green {
  background: #10b981;
}

.mini-line-blue {
  background: #3b82f6;
}

.mastery-list {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mastery-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.mastery-name {
  font-size: 14px;
  font-weight: 700;
  color: rgba(17, 24, 39, 0.8);
}

.mastery-agg {
  font-size: 12px;
  font-weight: 700;
  color: rgba(17, 24, 39, 0.35);
}

.mastery-bar {
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: #f1f5f9;
  display: flex;
}

.mastery-seg {
  height: 100%;
}

.mastery-seg-green {
  background: #10b981;
}

.mastery-seg-blue {
  background: #6366f1;
}

.mastery-seg-pink {
  background: #fda4af;
}

.mastery-bottom {
  display: flex;
  margin-top: 6px;
  font-size: 10px;
  font-weight: 700;
  color: rgba(17, 24, 39, 0.35);
}

.mastery-pct {
  white-space: nowrap;
}

.mastery-pct-center {
  text-align: center;
}

.mastery-pct-right {
  text-align: right;
}

.card-foot {
  margin-top: 16px;
}

.foot-note {
  font-size: 10px;
  font-style: italic;
  color: rgba(17, 24, 39, 0.35);
  font-weight: 800;
}

.foot-link {
  font-size: 12px;
  color: #f97316;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.foot-link:hover {
  color: #ea580c;
}

.chapter-list {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.chapter-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 8px;
}

.chapter-name {
  font-size: 14px;
  font-weight: 700;
  color: rgba(17, 24, 39, 0.8);
}

.chapter-code {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: rgba(17, 24, 39, 0.35);
}

.chapter-metric {
  margin-top: 10px;
}

.chapter-metric:first-child {
  margin-top: 0;
}

.chapter-metric-head {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  font-weight: 700;
  margin-bottom: 6px;
}

.chapter-metric-head-green {
  color: #10b981;
}

.chapter-metric-head-blue {
  color: #3b82f6;
}

.callout {
  margin-top: 16px;
  border-radius: 14px;
  background: rgba(255, 247, 237, 1);
  border: 1px solid rgba(255, 237, 213, 1);
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.callout-icon {
  color: #f97316;
}

.callout-text {
  font-size: 12px;
  color: rgba(17, 24, 39, 0.65);
  font-weight: 700;
}

@media (max-width: 1100px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
