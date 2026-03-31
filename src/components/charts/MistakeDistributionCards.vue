<template>
  <div class="mdc-grid">
    <section class="mdc-card first">
      <div class="mdc-head">
        <div class="mdc-head-left">
          <div class="mdc-title">{{ typeTitle }}</div>
        </div>
      </div>

      <div ref="typeChartRef" class="mdc-chart" />

      <div class="mdc-legend second">
        <div v-for="it in typeLegend" :key="it.name" class="mdc-legend-item">
          <div class="mdc-legend-left">
            <i class="mdc-dot" :style="{ background: it.color }" />
            <div class="mdc-legend-text">
              <div class="mdc-legend-name">{{ it.name }}</div>
              <div class="mdc-legend-sub">{{ it.count }} 道题</div>
            </div>
          </div>
          <div class="mdc-legend-pct">{{ it.percent }}</div>
        </div>
      </div>
    </section>

    <section class="mdc-card">
      <div class="mdc-head">
        <div class="mdc-head-left">
          <div class="mdc-title">{{ difficultyTitle }}</div>
        </div>
      </div>

      <div ref="difficultyChartRef" class="mdc-chart" />

      <div class="mdc-legend">
        <div v-for="it in difficultyLegend" :key="it.name" class="mdc-legend-item">
          <div class="mdc-legend-left">
            <i class="mdc-dot" :style="{ background: it.color }" />
            <div class="mdc-legend-text">
              <div class="mdc-legend-name">{{ it.name }}</div>
              <div class="mdc-legend-sub">{{ it.count }} 道题</div>
            </div>
          </div>
          <div class="mdc-legend-pct">{{ it.percent }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

type DonutItem = {
  name: string
  value: number
  color: string
}

type DifficultyItem = {
  name: string
  value: number
  color: string
  level: string
}

const props = withDefaults(
  defineProps<{
    typeTitle?: string
    difficultyTitle?: string
    typeItems?: DonutItem[]
    difficultyItems?: DifficultyItem[]
    avgDifficulty?: number
  }>(),
  {
    typeTitle: '错题题型分布',
    difficultyTitle: '错题难度分布',
  }
)

const typeTitle = computed(() => props.typeTitle)
const difficultyTitle = computed(() => props.difficultyTitle)

const typeChartRef = ref<HTMLDivElement | null>(null)
const difficultyChartRef = ref<HTMLDivElement | null>(null)
let typeChart: echarts.ECharts | null = null
let difficultyChart: echarts.ECharts | null = null

const typeTotal = computed(() => (props.typeItems ?? []).reduce((s, it) => s + (Number(it.value) || 0), 0))
const difficultyTotal = computed(() => (props.difficultyItems ?? []).reduce((s, it) => s + (Number(it.value) || 0), 0))

const formatPct = (v: number) => `${Math.max(0, Math.min(100, v)).toFixed(2)}%`

const typeLegend = computed(() => {
  const total = typeTotal.value || 0
  return (props.typeItems ?? []).map(it => {
    const pct = total ? (it.value / total) * 100 : 0
    return { name: it.name, count: it.value, percent: formatPct(pct), color: it.color }
  })
})

const difficultyLegend = computed(() => {
  const total = difficultyTotal.value
  return (props.difficultyItems ?? []).map(it => {
    const pct = total ? (it.value / total) * 100 : 0
    return { name: it.name, level: it.level, percent: formatPct(pct), color: it.color, count: it.value }
  })
})

const tooltipOption = () => ({
  trigger: 'item',
  backgroundColor: '#ffffff',
  borderColor: '#e2e8f0',
  textStyle: { color: '#475569', fontSize: 12 },
  extraCssText:
    'box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.12), 0 4px 6px -4px rgba(15, 23, 42, 0.12); border-radius: 10px;',
  formatter: (p: any) => {
    const name = p?.name ?? ''
    const val = p?.value ?? 0
    const pct = typeof p?.percent === 'number' ? p.percent : 0
    return `${name}：${val}（${pct}%）`
  },
})

const buildDonutOption = (items: DonutItem[], centerValue: string, centerLabel: string): echarts.EChartsOption => {
  const total = items.reduce((s, it) => s + (Number(it.value) || 0), 0)
  const data = total
    ? items.map(it => ({
        name: it.name,
        value: it.value,
        itemStyle: { color: it.color },
      }))
    : [{ name: '暂无数据', value: 1, itemStyle: { color: '#e2e8f0' } }]

  return {
    tooltip: total ? tooltipOption() : { show: false },
    series: [
      {
        type: 'pie',
        radius: ['70%', '82%'],
        center: ['50%', '52%'],
        startAngle: 90,
        avoidLabelOverlap: true,
        label: { show: false },
        labelLine: { show: false },
        itemStyle: { borderColor: '#ffffff', borderWidth: 3 },
        emphasis: { scale: true, scaleSize: 6 },
        data,
      },
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '44%',
        style: {
          text: centerValue,
          fill: '#0f172a',
          fontSize: 42,
          fontWeight: 900,
          align: 'center',
        },
      },
      {
        type: 'text',
        left: 'center',
        top: '67%',
        style: {
          text: centerLabel,
          fill: 'rgba(100, 116, 139, 0.85)',
          fontSize: 10,
          fontWeight: 900,
          align: 'center',
        },
      },
    ],
  }
}

const render = async () => {
  await nextTick()

  if (typeChartRef.value) {
    typeChart ??= echarts.init(typeChartRef.value)
    typeChart.setOption(buildDonutOption(props.typeItems ?? [], String(typeTotal.value || 0), '总错题数'), true)
  }

  if (difficultyChartRef.value) {
    difficultyChart ??= echarts.init(difficultyChartRef.value)
    difficultyChart.setOption(
      buildDonutOption(props.difficultyItems ?? [], String(difficultyTotal.value || 0), '总错题数'),
      true
    )
  }
}

const onResize = () => {
  typeChart?.resize()
  difficultyChart?.resize()
}

watch(
  () => [props.typeItems, props.difficultyItems, props.avgDifficulty],
  () => render(),
  { deep: true, flush: 'post' }
)

onMounted(() => {
  render()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  typeChart?.dispose()
  difficultyChart?.dispose()
  typeChart = null
  difficultyChart = null
})
</script>

<style scoped lang="less">
.mdc-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
}

@media (max-width: 980px) {
  .mdc-grid {
    grid-template-columns: 1fr;
  }
}

.mdc-card {
  background: #ffffff;
  border-radius: 22px;
  border: 1px solid #eef0f3;
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.06);
  padding: 18px;
  box-sizing: border-box;
}

.mdc-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.mdc-title {
  font-size: 18px;
  line-height: 26px;
  font-weight: 700;
  color: #0f172a;
}

.mdc-chart {
  width: 100%;
  height: 260px;
  margin-top: 10px;
  display: flex;
  justify-content: center;
}

.mdc-legend {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.mdc-legend-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mdc-legend-left {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.mdc-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: inline-block;
  flex: none;
}

.mdc-legend-text {
  min-width: 0;
}

.mdc-legend-name {
  font-size: 12px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.78);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mdc-legend-sub {
  margin-top: 2px;
  font-size: 10px;
  font-weight: 700;
  color: rgba(100, 116, 139, 0.75);
}

.mdc-legend-pct {
  font-size: 12px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.75);
}
</style>
