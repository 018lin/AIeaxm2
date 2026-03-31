<template>
  <div class="scp-card">
    <div class="scp-head">
      <div class="scp-title">
        <span class="scp-title-text">{{ title }}</span>
      </div>

      <div class="scp-legend">
        <span v-for="it in legend" :key="it.name" class="scp-legend-item">
          <i class="scp-legend-dot" :style="{ backgroundColor: it.color }"></i>
          {{ it.name }}
        </span>
      </div>
    </div>

    <div class="scp-body">
      <div ref="leftChartRef" class="scp-chart"></div>
      <div ref="rightChartRef" class="scp-chart"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StudentReportLiteracyReport } from '@/api/analysis/type'
import type { SubjectCompetencyLegendItem } from '@/types/analysis/charts'
import * as echarts from 'echarts'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

// 图表数据由父组件传入，组件仅负责渲染

const props = withDefaults(
  defineProps<{
    title?: string
    legend?: SubjectCompetencyLegendItem[]
    level1Data?: StudentReportLiteracyReport[]
    level2Data?: StudentReportLiteracyReport[]
  }>(),
  {
    title: '学科素养指标',
    legend: () => [],
    level1Data: () => [],
    level2Data: () => [],
  }
)

const leftChartRef = ref<HTMLDivElement | null>(null)
const rightChartRef = ref<HTMLDivElement | null>(null)
let leftChart: echarts.ECharts | null = null
let rightChart: echarts.ECharts | null = null

const aColor = computed(() => props.legend?.[0]?.color ?? '#3b82f6')
const bColor = computed(() => props.legend?.[1]?.color ?? '#2dd4bf')
const aName = computed(() => props.legend?.[0]?.name ?? '一班')
const bName = computed(() => props.legend?.[1]?.name ?? '二班')

const processData = (list: StudentReportLiteracyReport[]) => {
  const toPct = (v: unknown) => {
    const num = typeof v === 'string' ? Number(String(v).replace(/[^\d.\-]/g, '')) : Number(v)
    const f = Number.isFinite(num) ? Math.max(0, Math.min(100, num)) : 0
    return Math.round(f)
  }
  const items = Array.isArray(list) ? list : []
  const indicators = items.map(i => {
    let name = i.literacyName || ''
    if (name.length > 8 && !name.includes('\n')) {
      const mid = Math.ceil(name.length / 2)
      name = name.slice(0, mid) + '\n' + name.slice(mid)
    }
    return { name, min: 0, max: 100 }
  })

  // The data source may be a student report or a class report, and the fields are different.
  // Student report: { masteryRate, classAvgMasteryRate }
  // Class report: { classMasteryRates: [{ className, masteryRate }] }
  const isClassReport = items.length > 0 && Array.isArray((items[0] as any).classMasteryRates)

  let seriesA: number[]
  let seriesB: number[]

  if (isClassReport) {
    // 班级报告: seriesA 是当前班级, seriesB 是对比班级
    seriesA = items.map(i => {
      const rates = (i as any).classMasteryRates || []
      const target = rates.find((r: any) => r.className === aName.value)
      return toPct(target?.masteryRate)
    })
    // 根据用户要求，不使用班级平均值，而是从 classMasteryRates 中找到另一个班级进行对比
    // This assumes there are only two classes in the array.
    seriesB = items.map(i => {
      const rates = (i as any).classMasteryRates || []
      const target = rates.find((r: any) => r.className === bName.value)
      return toPct(target?.masteryRate)
    })
  } else {
    // 学生报告: seriesA 是学生个人, seriesB 是班级平均
    seriesA = items.map(i => toPct((i as any).masteryRate))
    seriesB = items.map(i => toPct((i as any).classAvgMasteryRate))
  }

  return { indicators, seriesA, seriesB }
}

const leftOption = () => {
  const d = processData(props.level1Data)
  const hasData = d.indicators.length > 0
  const indicators = hasData ? d.indicators : [{ name: '暂无数据', max: 100 }]
  const aVals = hasData ? d.seriesA : [0]
  const bVals = hasData ? d.seriesB : [0]
  return {
    tooltip: { show: false },
    radar: {
      shape: 'polygon',
      indicator: indicators,
      radius: '62%',
      center: ['50%', '52%'],
      splitNumber: 5,
      axisName: { color: '#64748b', fontSize: 12, fontWeight: 700 },
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.35)' } },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.25)' } },
      splitArea: { areaStyle: { color: ['transparent'] } },
    },
    series: [
      {
        type: 'radar',
        symbol: 'none',
        data: [
          {
            name: aName.value,
            value: aVals,
            lineStyle: { width: 3, color: aColor.value },
            areaStyle: { color: aColor.value, opacity: 0.16 },
            itemStyle: { color: aColor.value },
          },
          {
            name: bName.value,
            value: bVals,
            lineStyle: { width: 3, color: bColor.value },
            areaStyle: { color: bColor.value, opacity: 0.16 },
            itemStyle: { color: bColor.value },
          },
        ],
      },
    ],
  }
}

const rightOption = () => {
  const d = processData(props.level2Data)
  const hasData = d.indicators.length > 0
  const indicators = hasData ? d.indicators : [{ name: '暂无数据', max: 100 }]
  const aVals = hasData ? d.seriesA : [0]
  const bVals = hasData ? d.seriesB : [0]
  return {
    tooltip: { show: false },
    radar: {
      indicator: indicators,
      radius: '66%',
      center: ['50%', '52%'],
      splitNumber: 5,
      axisName: { color: 'rgba(100, 116, 139, 0.9)', fontSize: 11, fontWeight: 700 },
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.25)' } },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.22)' } },
      splitArea: { areaStyle: { color: ['transparent'] } },
    },
    series: [
      {
        type: 'radar',
        symbol: 'none',
        data: [
          {
            name: aName.value,
            value: aVals,
            lineStyle: { width: 3, color: aColor.value },
            areaStyle: { color: aColor.value, opacity: 0.18 },
            itemStyle: { color: aColor.value },
          },
          {
            name: bName.value,
            value: bVals,
            lineStyle: { width: 3, color: bColor.value },
            areaStyle: { color: bColor.value, opacity: 0.18 },
            itemStyle: { color: bColor.value },
          },
        ],
      },
    ],
  }
}

const render = () => {
  if (leftChartRef.value) {
    leftChart ??= echarts.init(leftChartRef.value)
    leftChart.setOption(leftOption(), true)
  }
  if (rightChartRef.value) {
    rightChart ??= echarts.init(rightChartRef.value)
    rightChart.setOption(rightOption(), true)
  }
}

const onResize = () => {
  leftChart?.resize()
  rightChart?.resize()
}

watch(
  () => [props.legend, props.level1Data, props.level2Data],
  async () => {
    await nextTick()
    render()
  },
  { deep: true }
)

onMounted(async () => {
  await nextTick()
  render()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  leftChart?.dispose()
  rightChart?.dispose()
  leftChart = null
  rightChart = null
})
</script>

<style scoped lang="less">
.scp-card {
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  padding: 18px;
  box-sizing: border-box;
  border: 1px solid #eef0f3;
}

.scp-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.scp-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.scp-title-text {
  font-size: 18px;
  line-height: 28px;
  font-weight: 700;
  color: rgb(30 41 59);
}

.scp-legend {
  display: inline-flex;
  align-items: center;
  gap: 18px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(100, 116, 139, 0.85);
  padding-top: 6px;
}

.scp-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.scp-legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
}

.scp-body {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
  align-items: center;
}

.scp-chart {
  width: 100%;
  height: 440px;
}

@media (max-width: 1100px) {
  .scp-body {
    grid-template-columns: 1fr;
  }
  .scp-chart {
    height: 380px;
  }
}
</style>
