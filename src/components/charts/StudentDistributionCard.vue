<template>
  <section class="app-surface p-20">
    <div class="sd-head">
      <div class="sd-title text-m bold mb-10">学生分布</div>
    </div>

    <div class="sd-note">
      说明：人数为学生数，占比=该分组人数/总人数；上方气泡=高于平均值+处于平均线，下方气泡=低于平均值。
    </div>

    <div ref="chartRef" class="sd-chart"></div>

    <div class="sd-list">
      <div class="sd-col">
        <template v-for="item in distributionItems.submission" :key="item.level">
          <a-popover trigger="hover" :mouse-enter-delay="0.08" :mouse-leave-delay="0.08">
            <template #content>
              <div v-if="item.names.length > 0" class="student-name-list">
                <div class="head flex items-center gap-md">
                  <p class="text-md bold">
                    <Icon icon="f7:person-2" color="#2badee"></Icon>
                    {{ item.title }}
                  </p>
                  <p class="total">{{ item.names.length }} 人</p>
                </div>
                <span v-for="n in item.names" :key="n">{{ n }}</span>
              </div>
              <div v-else>暂无学生</div>
            </template>
            <div
              :class="['sd-item', { 'sd-item-active': isActive('submission', item.level) }]"
              @click="setActive('submission', item.level)"
            >
              <div class="sd-item-left">{{ item.title }}</div>
              <div class="sd-item-right">
                <span class="sd-count">{{ item.dist.count }}人</span>
                <span class="sd-rate">{{ formatRate(item.dist.rate) }}</span>
              </div>
            </div>
          </a-popover>
        </template>
      </div>

      <div class="sd-col">
        <template v-for="item in distributionItems.accuracy" :key="item.level">
          <a-popover trigger="hover" :mouse-enter-delay="0.08" :mouse-leave-delay="0.08">
            <template #content>
              <div v-if="item.names.length > 0" class="student-name-list">
                <div class="head flex items-center gap-md">
                  <p class="text-md bold">
                    <Icon icon="f7:person-2" color="#2badee"></Icon>
                    {{ item.title }}
                  </p>
                  <p class="total">{{ item.names.length }} 人</p>
                </div>
                <span v-for="n in item.names" :key="n">{{ n }}</span>
              </div>

              <div v-else>暂无学生</div>
            </template>
            <div
              :class="['sd-item', { 'sd-item-active': isActive('accuracy', item.level) }]"
              @click="setActive('accuracy', item.level)"
            >
              <div class="sd-item-left">{{ item.title }}</div>
              <div class="sd-item-right">
                <span class="sd-count">{{ item.dist.count }}人</span>
                <span class="sd-rate">{{ formatRate(item.dist.rate) }}</span>
              </div>
            </div>
          </a-popover>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import * as echarts from 'echarts'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

type DistItem = { count: number; rate: number; students: { studentName: string }[] }
type Distribution = { above: DistItem; equal: DistItem; below: DistItem }

const props = withDefaults(
  defineProps<{
    submissionRate?: number
    accuracyRate?: number
    distributionData?: {
      submission: Distribution
      accuracy: Distribution
    }
  }>(),
  {
    submissionRate: 0,
    accuracyRate: 0,
  }
)

const formatRate = (v: number) => {
  const n = Number(v || 0)
  return `${Number.isFinite(n) ? n.toFixed(1) : '0.0'}%`
}

const toNameList = (list: { studentName: string }[] | undefined) => {
  if (!Array.isArray(list)) return []
  return list.map(s => s.studentName).filter(Boolean)
}

const submissionDist = computed(() => props.distributionData?.submission || { above: {}, equal: {}, below: {} })
const accuracyDist = computed(() => props.distributionData?.accuracy || { above: {}, equal: {}, below: {} })

const submissionAboveNames = computed(() => toNameList(submissionDist.value.above.students))
const submissionEqualNames = computed(() => toNameList(submissionDist.value.equal.students))
const submissionBelowNames = computed(() => toNameList(submissionDist.value.below.students))

const accuracyAboveNames = computed(() => toNameList(accuracyDist.value.above.students))
const accuracyEqualNames = computed(() => toNameList(accuracyDist.value.equal.students))
const accuracyBelowNames = computed(() => toNameList(accuracyDist.value.below.students))

type MetricKey = 'submission' | 'accuracy'
type LevelKey = 'above' | 'equal' | 'below'

const activeLevel = ref<Record<MetricKey, LevelKey>>({
  submission: 'equal',
  accuracy: 'equal',
})

const setActive = (metric: MetricKey, level: LevelKey) => {
  activeLevel.value = { ...activeLevel.value, [metric]: level }
}

const distributionItems = computed(() => ({
  submission: [
    { level: 'above', title: '高于平均值', names: submissionAboveNames.value, dist: submissionDist.value.above },
    { level: 'equal', title: '处于平均线', names: submissionEqualNames.value, dist: submissionDist.value.equal },
    { level: 'below', title: '低于平均值', names: submissionBelowNames.value, dist: submissionDist.value.below },
  ],
  accuracy: [
    { level: 'above', title: '高于平均值', names: accuracyAboveNames.value, dist: accuracyDist.value.above },
    { level: 'equal', title: '处于平均线', names: accuracyEqualNames.value, dist: accuracyDist.value.equal },
    { level: 'below', title: '低于平均值', names: accuracyBelowNames.value, dist: accuracyDist.value.below },
  ],
}))

const isActive = (metric: MetricKey, level: LevelKey) => activeLevel.value[metric] === level

const levelToPart = (level: LevelKey) => (level === 'below' ? 'bad' : 'good')

const toGoodBadPct = (d: Distribution) => {
  const a = Number(d?.above?.count || 0)
  const e = Number(d?.equal?.count || 0)
  const b = Number(d?.below?.count || 0)
  const total = a + e + b
  if (!total) return { good: 0, bad: 0 }
  const good = Math.round((a / total) * 1000) / 10
  const bad = Math.round((b / total) * 1000) / 10
  return { good, bad }
}

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

const buildOption = () => {
  const sub = toGoodBadPct(submissionDist.value)
  const acc = toGoodBadPct(accuracyDist.value)

  const track = 'transparent'
  const goodColors = ['rgb(99 102 241 / 0.8)', 'rgb(20 184 166 / 0.8)']
  const badColor = 'rgb(251 113 133 )'
  const activePart = [levelToPart(activeLevel.value.submission), levelToPart(activeLevel.value.accuracy)] as const

  const isAvgActiveSub = activeLevel.value.submission === 'equal'
  const isAvgActiveAcc = activeLevel.value.accuracy === 'equal'
  const avgLineStyleSub = {
    type: isAvgActiveSub ? 'solid' : 'dashed',
    color: isAvgActiveSub ? '#f97316' : '#e2e8f0',
    width: isAvgActiveSub ? 2 : 1,
  }
  const avgLineStyleAcc = {
    type: isAvgActiveAcc ? 'solid' : 'dashed',
    color: isAvgActiveAcc ? '#f97316' : '#e2e8f0',
    width: isAvgActiveAcc ? 2 : 1,
  }
  const showAvgSub =
    Number(submissionDist.value.above.count) +
      Number(submissionDist.value.equal.count) +
      Number(submissionDist.value.below.count) >
    0
  const showAvgAcc =
    Number(accuracyDist.value.above.count) +
      Number(accuracyDist.value.equal.count) +
      Number(accuracyDist.value.below.count) >
    0

  const pad = [Math.max(0, 100 - sub.good), Math.max(0, 100 - acc.good)]
  const good = [sub.good, acc.good]
  const bad = [sub.bad, acc.bad]

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

  const goodData = [0, 1].map(i => ({
    value: good[i] ?? 0,
    itemStyle: bubbleStyle(goodColors[i] || goodColors[0], activePart[i] === 'good'),
  }))

  const badData = [0, 1].map(i => ({
    value: bad[i] ?? 0,
    itemStyle: bubbleStyle(badColor, activePart[i] === 'bad'),
  }))

  return {
    grid: { top: 8, left: 18, right: 18, bottom: 30, containLabel: false },
    tooltip: { show: false },
    xAxis: {
      type: 'category',
      data: ['提交率分布', '正确率分布'],
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
        data: [100, 100],
        z: 1,
        animation: false,
        markLine: {
          silent: true,
          symbol: 'none',
          label: { show: false },
          data: [
            ...(showAvgSub
              ? [
                  [
                    { x: '0%', yAxis: sub.bad },
                    { x: '48%', yAxis: sub.bad, lineStyle: avgLineStyleSub },
                  ],
                ]
              : []),
            ...(showAvgAcc
              ? [
                  [
                    { x: '52%', yAxis: acc.bad },
                    { x: '100%', yAxis: acc.bad, lineStyle: avgLineStyleAcc },
                  ],
                ]
              : []),
          ],
        },
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
  () => [props.distributionData, activeLevel.value],
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
.student-name-list {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .total {
    color: rgb(43 173 238);
    background-color: rgb(43 173 238 / 0.1);
    font-size: 12px;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 6px;
  }

  span {
    margin-bottom: 4px;
    padding: 4px;
    padding-left: 10px;
    box-shadow: 0px 0px 10px rgb(226 232 240 / 0.5);
    border-radius: 6px;
    color: #334155;
    font-weight: 700;
  }
}

.sd-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sd-note {
  font-size: 12px;
  line-height: 1.45;
  color: rgba(100, 116, 139, 0.82);
}

.sd-chart {
  margin-top: 20px;
  height: 230px;
}

.sd-list {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.sd-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 920px) {
  .sd-list {
    grid-template-columns: 1fr;
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
</style>
