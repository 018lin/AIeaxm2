<template>
  <section class="app-surface p-20">
    <div class="sd-head">
      <div class="sd-title text-m bold mb-10">学生分布</div>
      <div class="sd-head-right">
        <div v-if="props.classes?.length" class="sd-tabs">
          <button
            v-for="(c, idx) in props.classes"
            :key="c.classId || idx"
            type="button"
            class="sd-tab"
            :class="{ active: idx === props.activeIndex }"
            @click="onChangeClass(idx)"
          >
            {{ c.className }}
          </button>
        </div>
      </div>
    </div>

    <div class="sd-note">
      说明：人数为学生数，占比=该分组人数/总人数；上方气泡=高于平均值+处于平均线，下方气泡=低于平均值。
    </div>

    <div class="sd-body">
      <div ref="chartRef" class="sd-chart"></div>

      <div class="sd-list">
        <div class="sd-col">
          <a-popover
            v-for="g in studentGroups"
            :key="g.level"
            trigger="hover"
            placement="left"
            overlay-class-name="sd-stu-popover-overlay"
            :mouse-enter-delay="0.08"
            :mouse-leave-delay="0.08"
          >
            <template #content>
              <div v-if="g.names.length === 0" class="sd-stu-popover-empty">当前名单为空</div>
              <div v-else class="sd-stu-popover">
                <div class="sd-stu-popover-head">
                  <div class="sd-stu-popover-title">{{ g.title }}</div>
                  <div class="sd-stu-popover-sub">共 {{ g.names.length }} 人</div>
                </div>
                <div class="sd-stu-popover-body">
                  <span v-for="name in g.names" :key="name" class="sd-stu-chip">{{ name }}</span>
                </div>
              </div>
            </template>
            <div :class="['sd-item', { 'sd-item-active': isActive(g.level) }]" @click="setActive(g.level)">
              <div class="sd-item-left">{{ g.title }}</div>
              <div class="sd-item-right">
                <span class="sd-count">{{ g.dist.count }}人</span>
                <span class="sd-rate">{{ formatRate(g.dist.rate) }}</span>
              </div>
            </div>
          </a-popover>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

type DistItem = { count: number; rate: number }
type Distribution = { above: DistItem; equal: DistItem; below: DistItem }
type DistInput = Distribution | number | undefined

type ClassTab = { classId: string; className: string }

const props = withDefaults(
  defineProps<{
    accuracy?: DistInput
    aboveList?: unknown[]
    avgList?: unknown[]
    belowList?: unknown[]
    classes?: ClassTab[]
    activeIndex?: number
  }>(),
  {
    accuracy: () => ({
      above: { count: 0, rate: 0 },
      equal: { count: 0, rate: 0 },
      below: { count: 0, rate: 0 },
    }),
    aboveList: () => [],
    avgList: () => [],
    belowList: () => [],
    classes: () => [],
    activeIndex: 0,
  }
)

const emit = defineEmits<{
  changeClass: [number]
}>()

const onChangeClass = (index: number) => {
  if (!Number.isFinite(index) || index === props.activeIndex) return
  emit('changeClass', index)
}

const formatRate = (v: number) => {
  const n = Number(v || 0)
  return `${Number.isFinite(n) ? n.toFixed(1) : '0.0'}%`
}

const toNameList = (list: unknown) => {
  if (!Array.isArray(list)) return [] as string[]
  const names = list
    .map(i => {
      if (typeof i === 'string') return i
      if (i && typeof i === 'object') {
        const anyI = i as any
        return anyI.studentName ?? anyI.name ?? anyI.userName
      }
      return ''
    })
    .filter(Boolean)
    .map(n => String(n).trim())
    .filter(Boolean)
  return Array.from(new Set(names))
}

const aboveNames = computed(() => toNameList(props.aboveList))
const avgNames = computed(() => toNameList(props.avgList))
const belowNames = computed(() => toNameList(props.belowList))

const num = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const zeroDistribution = (): Distribution => ({
  above: { count: 0, rate: 0 },
  equal: { count: 0, rate: 0 },
  below: { count: 0, rate: 0 },
})

const normalizeDistribution = (input: DistInput): Distribution => {
  if (typeof input === 'number') {
    const n = Number.isFinite(input) ? Math.max(0, Math.min(100, input)) : 0
    const equalCount = Math.round(n)
    const belowCount = Math.max(0, 100 - equalCount)
    return {
      above: { count: 0, rate: 0 },
      equal: { count: equalCount, rate: n },
      below: { count: belowCount, rate: Math.max(0, 100 - n) },
    }
  }

  if (!input) return zeroDistribution()

  const d = input as Distribution
  return {
    above: { count: num(d?.above?.count), rate: num(d?.above?.rate) },
    equal: { count: num(d?.equal?.count), rate: num(d?.equal?.rate) },
    below: { count: num(d?.below?.count), rate: num(d?.below?.rate) },
  }
}

const accuracyDist = computed<Distribution>(() => normalizeDistribution(props.accuracy))

type LevelKey = 'above' | 'equal' | 'below'

type StudentGroup = { level: LevelKey; title: string; names: string[]; dist: DistItem }

const studentGroups = computed<StudentGroup[]>(() => [
  { level: 'above', title: '高于平均值', names: aboveNames.value, dist: accuracyDist.value.above },
  { level: 'equal', title: '处于平均线', names: avgNames.value, dist: accuracyDist.value.equal },
  { level: 'below', title: '低于平均值', names: belowNames.value, dist: accuracyDist.value.below },
])

const activeLevel = ref<LevelKey>('above')

const setActive = (level: LevelKey) => {
  activeLevel.value = level
}

const isActive = (level: LevelKey) => activeLevel.value === level

const levelToPart = (level: LevelKey) => (level === 'below' ? 'bad' : 'good')

const toGoodBadPct = (d: Distribution) => {
  const a = Number(d?.above?.count || 0)
  const e = Number(d?.equal?.count || 0)
  const b = Number(d?.below?.count || 0)
  const total = a + e + b
  if (!total) return { good: 0, bad: 0 }
  const good = Math.round(((a + e) / total) * 1000) / 10
  const bad = Math.round((b / total) * 1000) / 10
  return { good, bad }
}

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

const buildOption = () => {
  const acc = toGoodBadPct(accuracyDist.value)

  const track = 'transparent'
  const goodColor = 'rgb(20 184 166 / 0.8)'
  const badColor = 'rgb(251 113 133 )'
  const activePart = levelToPart(activeLevel.value)

  const isAvgActive = activeLevel.value === 'equal'
  const avgLineStyle = {
    type: (isAvgActive ? 'solid' : 'dashed') as const,
    color: isAvgActive ? 'rgba(249, 115, 22, 0.95)' : 'rgba(148, 163, 184, 0.7)',
    width: isAvgActive ? 2 : 1,
  }

  const showAvgLine = Number(accuracyDist.value.above.count) > 0 && Number(accuracyDist.value.below.count) > 0

  const pad = [Math.max(0, 100 - acc.good)]
  const good = [acc.good]
  const bad = [acc.bad]

  const bubbleStyle = (color: string, on: boolean) => ({
    color,
    borderRadius: 18,
    opacity: on ? 1 : 0.32,
    borderWidth: on ? 1 : 0,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowBlur: on ? 12 : 8,
    shadowOffsetY: 2,
    shadowColor: on ? color : 'rgba(15, 23, 42, 0.08)',
  })

  const goodData = [0].map(i => ({
    value: good[i] ?? 0,
    itemStyle: bubbleStyle(goodColor, activePart === 'good'),
  }))

  const badData = [0].map(i => ({
    value: bad[i] ?? 0,
    itemStyle: bubbleStyle(badColor, activePart === 'bad'),
  }))

  return {
    grid: { top: 8, left: 18, right: 18, bottom: 30, containLabel: false },
    tooltip: { show: false },
    xAxis: {
      type: 'category',
      data: ['正确率分布'],
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: 'rgba(100, 116, 139, 0.85)', fontSize: 12, fontWeight: 700, margin: 14 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { show: false },
      axisTick: { show: false },
      axisLine: { show: false },
      splitLine: { show: true, lineStyle: { color: 'rgba(226, 232, 240, 0.55)' } },
    },
    series: [
      {
        name: 'track',
        type: 'bar',
        silent: true,
        barWidth: 36,
        itemStyle: { color: track, borderRadius: 22 },
        data: [100],
        z: 1,
        animation: false,
        markLine: showAvgLine
          ? {
              silent: true,
              symbol: 'none',
              label: { show: false },
              lineStyle: avgLineStyle,
              data: [{ yAxis: acc.bad }],
            }
          : { show: false },
      },
      {
        name: 'pad',
        type: 'bar',
        silent: true,
        barWidth: 36,
        stack: 'top',
        barGap: '-100%',
        itemStyle: { color: 'rgba(0, 0, 0, 0)' },
        data: pad,
        z: 2,
        animation: false,
      },
      {
        name: 'good',
        type: 'bar',
        silent: true,
        barWidth: 36,
        stack: 'top',
        barGap: '-100%',
        data: goodData,
        z: 4,
        animation: false,
        emphasis: { disabled: true },
      },
      {
        name: 'bad',
        type: 'bar',
        silent: true,
        barWidth: 36,
        stack: 'bottom',
        barGap: '-100%',
        data: badData,
        z: 3,
        animation: false,
        emphasis: { disabled: true },
      },
    ],
  }
}

const render = async () => {
  await nextTick()
  if (!chartRef.value) return
  chart ??= echarts.init(chartRef.value)
  chart.setOption(buildOption(), true)
}

const onResize = () => {
  chart?.resize()
}

watch(
  () => [props.accuracy, activeLevel.value],
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

<style scoped lang="scss">
.sd-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sd-head-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sd-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(15, 23, 42, 0.03);
  border-radius: 12px;
  padding: 4px;
}

.sd-tab {
  height: 28px;
  padding: 0 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(100, 116, 139, 0.9);
  border: none;
  background: transparent;
  cursor: pointer;
  &.active {
    background: rgba(59, 130, 246, 0.14);
    color: rgba(59, 130, 246, 0.95);
  }
}

.sd-note {
  font-size: 12px;
  line-height: 1.45;
  color: rgba(100, 116, 139, 0.82);
}

.sd-body {
  margin-top: 18px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 18px;
  align-items: center;
}

.sd-chart {
  margin-top: 0;
  height: 260px;
}

.sd-list {
  margin-top: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.sd-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 920px) {
  .sd-body {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
}

.sd-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 14px;
  border-radius: 14px;
  border: 1px solid transparent;
  background: rgba(248, 250, 252, 0.3);
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    border-color: rgba(226, 232, 240, 0.95);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0px);
  }

  .sd-item-left {
    font-size: 14px;
    font-weight: 700;
    color: rgba(30, 41, 59, 0.9);
  }

  .sd-item-right {
    display: flex;
    align-items: baseline;
    gap: 10px;

    .sd-count {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
    }

    .sd-rate {
      font-size: 12px;
      font-weight: 700;
      color: rgba(100, 116, 139, 0.75);
    }
  }
}

.sd-item-active {
  background: rgba(255, 247, 237, 0.7);
  border: 1px solid rgba(253, 186, 116, 0.55);

  .sd-item-left {
    color: #f97316;
  }

  .sd-item-right {
    .sd-count {
      color: #f97316;
    }
  }
}

:global(.sd-stu-popover-overlay .ant-popover-inner) {
  border-radius: 14px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.12);
}

.sd-stu-popover-empty {
  padding: 10px 12px;
  font-size: 12px;
  color: rgba(100, 116, 139, 0.85);
}

.sd-stu-popover {
  width: 320px;
}

.sd-stu-popover-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 12px 10px;
  background: rgba(248, 250, 252, 0.9);
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
}

.sd-stu-popover-title {
  font-size: 13px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.9);
}

.sd-stu-popover-sub {
  font-size: 12px;
  font-weight: 700;
  color: rgba(100, 116, 139, 0.8);
}

.sd-stu-popover-body {
  padding: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 220px;
  overflow: auto;
}

.sd-stu-chip {
  height: 26px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.82);
  background: rgba(241, 245, 249, 0.9);
}
</style>
