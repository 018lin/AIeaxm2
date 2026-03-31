<template>
  <div class="card card-wide">
    <div class="card-head">
      <div class="card-title">{{ displayTitle }}</div>
    </div>
    <div class="card-subtitle">{{ subtitleText }}</div>
    <div ref="chartRef" class="chart chart-trend"></div>
  </div>
</template>

<script setup lang="ts">
import type { TrendSeries } from '@/types/analysis/charts'
import * as echarts from 'echarts'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

// 图表数据由父组件传入，组件仅负责渲染
// 支持两种数据格式：
// 1. 班级报告格式: { assignmentId, assignmentName, assignmentDate, currentClassCorrectRate, classCorrectRates: [{classId, className, masteryRate}] }
// 2. 学生报告格式: { assignmentId, assignmentName, assignmentDate, correctRate, classAvgCorrectRate, classMaxCorrectRate }

const props = withDefaults(
  defineProps<{
    title?: string
    points?: number
    xAxis?: string[]
    series?: TrendSeries[]
    trendReports?: any[] // 新增：支持直接从api.json传入trendReports数据
    mode?: 'web' | 'pdf' // 渲染模式：web-网页模式，pdf-PDF导出模式
    titleSuffix?: string // 标题后缀，用于分割图表时显示 (1/2), (2/2) 等
  }>(),
  {
    title: '答题正确率趋势',
    points: 14,
    xAxis: () => [],
    series: () => [],
    trendReports: () => [],
    mode: 'web',
    titleSuffix: '',
  }
)

const subtitleText = computed(() => {
  const dataLength = props.trendReports?.length || props.xAxis?.length || 0
  const suffix = props.titleSuffix ? ` ${props.titleSuffix}` : ''
  return `最近 ${dataLength} 次作业正确率变化${suffix}`
})

// 显示标题（包含标题后缀）
const displayTitle = computed(() => {
  const suffix = props.titleSuffix ? ` ${props.titleSuffix}` : ''
  return `${props.title}${suffix}`
})

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

const processedSeries = computed(() => {
  // 如果直接传入了格式化好的series数据，直接使用
  if (props.series && props.series.length > 0) {
    return props.series
  }

  // 如果传入了trendReports数据，需要处理成series格式
  if (!props.trendReports || props.trendReports.length === 0) {
    return []
  }

  const reports = props.trendReports
  const colors = ['#6366f1', '#14b8a6', '#f97316', '#10b981', '#8b5cf6', '#f59e0b', '#a5b4fc']

  // 判断数据格式：班级报告 or 学生报告
  const isClassReport = reports[0] && reports[0].classCorrectRates

  if (isClassReport) {
    // 班级报告格式处理
    const classMap = new Map<string, number[]>()

    reports.forEach(report => {
      report.classCorrectRates.forEach((classRate: any) => {
        if (!classMap.has(classRate.className)) {
          classMap.set(classRate.className, [])
        }
        classMap.get(classRate.className)!.push(classRate.masteryRate)
      })
    })

    return Array.from(classMap.entries()).map(([className, data], index) => ({
      name: className,
      color: colors[index % colors.length],
      data: data.map(rate => rate.toFixed(1)),
    }))
  } else {
    // 学生报告格式处理
    const seriesMap = new Map<string, number[]>()
    const dates: string[] = []

    reports.forEach(report => {
      const date = new Date(report.assignmentDate)
      dates.push(`${date.getMonth() + 1}月${date.getDate()}日`)

      if (report.correctRate !== undefined) {
        if (!seriesMap.has('个人正确率')) {
          seriesMap.set('个人正确率', [])
        }
        seriesMap.get('个人正确率')!.push(report.correctRate)
      }

      if (report.classAvgCorrectRate !== undefined) {
        if (!seriesMap.has('班级平均正确率')) {
          seriesMap.set('班级平均正确率', [])
        }
        seriesMap.get('班级平均正确率')!.push(report.classAvgCorrectRate)
      }

      if (report.classMaxCorrectRate !== undefined) {
        if (!seriesMap.has('班级最高正确率')) {
          seriesMap.set('班级最高正确率', [])
        }
        seriesMap.get('班级最高正确率')!.push(report.classMaxCorrectRate)
      }
    })

    return Array.from(seriesMap.entries()).map(([seriesName, data], index) => ({
      name: seriesName,
      color: colors[index % colors.length],
      data: data.map(rate => rate.toFixed(1)),
    }))
  }
})

const processedXAxis = computed(() => {
  // 如果直接传入了xAxis数据，直接使用
  if (props.xAxis && props.xAxis.length > 0) {
    return props.xAxis
  }

  // 如果传入了trendReports数据，需要提取作业名称
  if (!props.trendReports || props.trendReports.length === 0) {
    return []
  }

  return props.trendReports.map(report => report.assignmentName || '')
})

const option = (): echarts.EChartsOption => {
  const series = processedSeries.value.map((s, index) => ({
    name: s.name,
    type: 'line',
    smooth: true,
    showSymbol: false,
    lineStyle: { width: 4, color: s.color },
    itemStyle: { color: s.color },
    areaStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: `${s.color}66` }, // 40% opacity
        { offset: 1, color: `${s.color}00` }, // 0% opacity
      ]),
    },
    data: s.data,
  }))

  const dataCount = processedXAxis.value.length
  // 网页模式：数据点超过7个显示滚动条
  // PDF模式：隐藏滚动条
  const showDataZoom = props.mode === 'web' && dataCount > 7

  // PDF模式下，如果数据点过多，则动态调整图表宽度以防止标签重叠
  const gridWidth = props.mode === 'pdf' && dataCount > 10 ? `${(dataCount / 10) * 100}%` : 'auto'

  return {
    grid: {
      top: 36,
      right: 25,
      bottom: showDataZoom ? 40 : 20,
      left: 45,
      containLabel: false,
      width: gridWidth,
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach((param: any) => {
          result += `${param.marker}${param.seriesName}: ${param.value}%<br/>`
        })
        return result
      },
    },
    legend: {
      data: processedSeries.value.map(s => s.name),
      right: 10,
      top: 4,
      icon: 'circle',
      itemWidth: 10,
      itemHeight: 10,
    },
    xAxis: {
      type: 'category',
      data: processedXAxis.value,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 10,
        rotate: dataCount > 5 ? 30 : 0, // 当数据点较多时旋转标签
        interval: 0, // 强制显示所有标签
        hideOverlap: false,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        show: true,
        color: '#94a3b8',
        fontSize: 10,
        formatter: '{value}%',
      },
      splitLine: { lineStyle: { type: 'dashed', color: '#eef2f7' } },
    },
    dataZoom: [
      {
        type: 'slider',
        show: showDataZoom,
        startValue: 0,
        endValue: showDataZoom ? 6 : dataCount - 1, // 默认显示前7个
        bottom: 5,
        height: 15,
        borderColor: 'transparent',
        backgroundColor: '#e2e8f0',
        dataBackground: {
          lineStyle: { color: 'transparent' },
          areaStyle: { color: 'transparent' },
        },
        selectedDataBackground: {
          lineStyle: { color: '#6366f1' },
          areaStyle: { color: 'rgba(99, 102, 241, 0.1)' },
        },
        fillerColor: 'rgba(99, 102, 241, 0.2)',
        handleStyle: {
          color: '#fff',
          borderWidth: 1,
          borderColor: '#6366f1',
        },
        moveHandleStyle: {
          color: '#6366f1',
        },
        emphasis: {
          handleStyle: {
            color: '#6366f1',
            borderColor: '#6366f1',
          },
        },
      },
      {
        type: 'inside',
        disabled: !showDataZoom,
      },
    ],
    series: series as any,
  }
}

const render = async () => {
  await nextTick()
  if (!chartRef.value) return

  // 确保容器有实际尺寸后再初始化图表
  const container = chartRef.value
  if (container.clientWidth === 0 || container.clientHeight === 0) {
    // 如果容器尺寸为0，延迟重试
    setTimeout(() => render(), 100)
    return
  }

  chart ??= echarts.init(chartRef.value)
  chart.setOption(option(), true)
}

const onResize = () => {
  chart?.resize()
}

watch(
  () => [props.points, props.xAxis, props.series, props.trendReports],
  () => render(),
  { deep: true, flush: 'post' }
)

onMounted(() => {
  render()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  chart?.dispose()
  chart = null
})
</script>

<style scoped lang="less">
.card {
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  padding: 18px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(241, 245, 249, 1);
}

.card-wide {
  padding: 18px;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 8px;
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

.card-subtitle {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.95);
  margin-bottom: 10px;
}

.chart-trend {
  height: 320px;
}
</style>
