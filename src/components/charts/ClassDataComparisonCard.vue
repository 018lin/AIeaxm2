<template>
  <div class="class-comparison-card">
    <div class="card-header">
      <div class="header-left">
        <span class="text-m bold mb-10">{{ title }}</span>
      </div>
      <div class="header-right">
        <!-- Legend is handled by ECharts -->
      </div>
    </div>
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import type { ClassDataComparisonItem } from '@/types/analysis/charts'
import * as echarts from 'echarts'
import { onMounted, onUnmounted, ref, watch } from 'vue'

// 图表数据由父组件传入，组件仅负责渲染

const props = withDefaults(
  defineProps<{
    title?: string
    xAxisLabels?: [string, string]
    data?: ClassDataComparisonItem[]
  }>(),
  {
    title: '班级数据对比',
    xAxisLabels: () => ['', ''],
    data: () => [],
  }
)

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)
  renderChart()

  window.addEventListener('resize', handleResize)
}

const handleResize = () => {
  chartInstance?.resize()
}

const renderChart = () => {
  if (!chartInstance) return

  const series = props.data.map((item, index) => ({
    name: item.className,
    type: 'bar',
    data: [item.submissionRate, item.accuracyRate],
    itemStyle: {
      borderRadius: [4, 4, 0, 0],
      color: index === 0 ? 'rgba(251, 191, 36, 0.4)' : 'rgba(99, 102, 241, 0.8)',
    },
    emphasis: {
      itemStyle: {
        opacity: 1,
      },
    },
    barMaxWidth: 40,
    barGap: '30%',
  }))

  const option: echarts.EChartsOption = {
    grid: {
      top: 40,
      right: 20,
      bottom: 30,
      left: 40,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        let res = ''
        params.forEach((item: any) => {
          res += `<div style="display:flex;align-items:center;gap:4px;margin-bottom:4px">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${item.color}"></span>
                    <span>${item.seriesName}:</span>
                    <span style="font-weight:bold">${item.value}%</span>
                  </div>`
        })
        return res
      },
    },
    legend: {
      data: props.data.map(d => d.className),
      right: 0,
      top: 0,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: {
        fontSize: 12,
        color: '#64748B',
      },
    },
    xAxis: {
      type: 'category',
      data: props.xAxisLabels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#64748B',
        fontSize: 12,
        margin: 16,
        fontWeight: 500,
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          color: '#E2E8F0',
        },
      },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          color: '#E2E8F0',
        },
      },
    },
    series: series as any,
  }

  chartInstance.setOption(option)
}

watch(
  () => props.data,
  () => {
    renderChart()
  },
  { deep: true }
)

onMounted(() => {
  initChart()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped lang="scss">
.class-comparison-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: 100%;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .chart-container {
    flex: 1;
    width: 100%;
    min-height: 350px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
