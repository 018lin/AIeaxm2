<template>
  <div class="shp">
    <section v-for="panel in panels" :key="panel.key" class="shp-section">
      <div class="shp-section-title">
        <i class="shp-bar" />
        <span class="shp-cn">{{ panel.titleCn }}</span>
        <span class="shp-en">{{ panel.titleEn }}</span>
      </div>

      <div class="shp-grid">
        <div class="shp-left-card">
          <div class="shp-metric">
            <div class="shp-metric-left">
              <div class="shp-metric-title">完成数/作业数</div>
              <div class="shp-metric-sub">COMPLETION RATE</div>
            </div>
            <div class="shp-metric-right">
              <span class="shp-metric-val">{{ panel.completed }}</span>
              <span class="shp-metric-split">/</span>
              <span class="shp-metric-total">{{ panel.totalAssignments }}</span>
            </div>
          </div>

          <div class="shp-metric">
            <div class="shp-metric-left">
              <div class="shp-metric-title">做题正确数/总题数</div>
              <div class="shp-metric-sub">CORRECT QUESTIONS</div>
            </div>
            <div class="shp-metric-right">
              <span class="shp-metric-val">{{ panel.correct }}</span>
              <span class="shp-metric-split">/</span>
              <span class="shp-metric-total">{{ panel.totalQuestions }}</span>
            </div>
          </div>

          <div class="shp-metric shp-metric-accent">
            <div class="shp-metric-left">
              <div class="shp-metric-title">{{ panel.titleCn }} 答题正确率</div>
              <div class="shp-metric-sub">ACCURACY PERCENTAGE</div>
            </div>
            <div class="shp-metric-right">
              <span class="shp-metric-val shp-accent">{{ panel.accuracy }}%</span>
            </div>
          </div>
        </div>

        <div class="shp-right-card">
          <div class="shp-right-head">
            <div class="shp-right-title">分层对比</div>
            <div class="shp-legend">
              <span class="shp-legend-item">
                <i class="shp-dot" :style="{ background: studentColor }" />
                {{ studentNameText }}
              </span>
              <span class="shp-legend-item">
                <i class="shp-dot" :style="{ background: avgColor }" />
                分层平均值
              </span>
            </div>
          </div>

          <div :ref="el => setChartRef(panel.key, el as any)" class="shp-chart" />

          <div class="shp-scale">
            <span>最小 0%</span>
            <span>分层平均值</span>
            <span>最大 100%</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

type Panel = {
  key: string
  titleCn: string
  titleEn: string
  completed: number
  totalAssignments: number
  correct: number
  totalQuestions: number
  accuracy: number
  submitRate: number
  avgSubmitRate: number
  avgAccuracyRate: number
}

const props = withDefaults(
  defineProps<{
    studentName?: string
    studentColor?: string
    avgColor?: string
    panels?: Panel[]
  }>(),
  {
    studentName: '',
    studentColor: '#0d9488cc',
    avgColor: '#a78bfa',
    panels: () => [
      {
        key: 'foundation',
        titleCn: '分层作业（基础层）',
        titleEn: '基础层',
        completed: 8,
        totalAssignments: 10,
        correct: 80,
        totalQuestions: 100,
        accuracy: 80,
        submitRate: 78,
        avgSubmitRate: 86,
        avgAccuracyRate: 76,
      },
      {
        key: 'advanced',
        titleCn: '分层作业（提高层）',
        titleEn: '提高层',
        completed: 8,
        totalAssignments: 10,
        correct: 80,
        totalQuestions: 100,
        accuracy: 80,
        submitRate: 72,
        avgSubmitRate: 79,
        avgAccuracyRate: 70,
      },
    ],
  }
)

const studentNameText = computed(() => String(props.studentName || '学生'))

const chartEls = ref<Record<string, HTMLDivElement | null>>({})
const charts = new Map<string, echarts.ECharts>()

const setChartRef = (key: string, el: HTMLDivElement | null) => {
  chartEls.value[key] = el
}

const buildOption = (p: Panel): echarts.EChartsOption => {
  const student = [p.submitRate, p.accuracy]
  const avg = [p.avgSubmitRate, p.avgAccuracyRate]
  return {
    grid: { top: 44, right: 24, bottom: 44, left: 44, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { show: false },
    xAxis: {
      type: 'category',
      data: ['作业提交率', '答题正确率'],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: 'rgba(100, 116, 139, 0.9)', fontSize: 12, fontWeight: 700, margin: 18 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: true, lineStyle: { type: 'solid', color: 'rgba(226, 232, 240, 0.7)' } },
    },
    series: [
      {
        name: studentNameText.value,
        type: 'bar',
        barWidth: 34,
        data: student,
        itemStyle: { color: props.studentColor, borderRadius: [5, 5, 0, 0] },
      },
      {
        name: '分层平均值',
        type: 'bar',
        barWidth: 34,
        data: avg,
        itemStyle: { color: props.avgColor, borderRadius: [5, 5, 0, 0] },
      },
    ],
  }
}

const renderOne = async (p: Panel) => {
  await nextTick()
  const el = chartEls.value[p.key]
  if (!el) return
  let chart = charts.get(p.key)
  if (!chart) {
    chart = echarts.init(el)
    charts.set(p.key, chart)
  }
  chart.setOption(buildOption(p), true)
}

const renderAll = async () => {
  for (const p of props.panels ?? []) {
    await renderOne(p)
  }
}

const onResize = () => {
  charts.forEach(c => c.resize())
}

watch(
  () => [props.panels, props.studentName, props.studentColor, props.avgColor],
  () => renderAll(),
  { deep: true, flush: 'post' }
)

onMounted(() => {
  renderAll()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  charts.forEach(c => c.dispose())
  charts.clear()
})
</script>

<style scoped lang="less">
.shp-section + .shp-section {
  margin-top: 18px;
}

.shp-section-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  font-weight: 700;
  color: #0f172a;
}

.shp-bar {
  width: 4px;
  height: 18px;
  border-radius: 99px;
  background: #f59e0b;
  display: inline-block;
}

.shp-cn {
  font-size: 18px;
}

.shp-en {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  color: rgba(100, 116, 139, 0.7);
}

.shp-grid {
  display: grid;
  grid-template-columns: 38% minmax(0, 1fr);
  gap: 16px;
}

@media (max-width: 1100px) {
  .shp-grid {
    grid-template-columns: 1fr;
  }
}

.shp-left-card,
.shp-right-card {
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  border: 1px solid rgba(241, 245, 249, 1);
  padding: 16px;
  box-sizing: border-box;
}

.shp-metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 14px;
  border-radius: 14px;
  background: rgba(248, 250, 252, 1);
  border: 1px solid rgba(241, 245, 249, 1);
}

.shp-metric + .shp-metric {
  margin-top: 12px;
}

.shp-metric-accent {
  background: #0d94880d;
  border-color: #0d94881a;
}

.shp-metric-title {
  font-size: 12px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.75);
}

.shp-metric-sub {
  margin-top: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  color: rgba(100, 116, 139, 0.55);
}

.shp-metric-right {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  font-weight: 700;
  color: #0f172a;
}

.shp-metric-val {
  font-size: 26px;
}

.shp-metric-split,
.shp-metric-total {
  font-size: 14px;
  color: rgba(100, 116, 139, 0.7);
}

.shp-accent {
  color: rgb(13 148 136);
}

.shp-right-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.shp-right-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.shp-legend {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(100, 116, 139, 0.85);
}

.shp-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.shp-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  display: inline-block;
}

.shp-chart {
  width: 100%;
  height: 260px;
}

.shp-scale {
  margin-top: 4px;
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: rgba(148, 163, 184, 0.9);
  text-transform: uppercase;
}
</style>
