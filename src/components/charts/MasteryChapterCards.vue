<template>
  <div>
    <div class="mcc-grid">
      <section class="mcc-card first">
        <div class="mcc-head">
          <div class="mcc-title">
            <div class="mcc-title-text">知识点掌握情况</div>
          </div>
        </div>

        <div ref="masteryRingRef" class="ring" />

        <div class="mcc-rows">
          <div v-for="r in masteryRows" :key="r.key" class="mcc-row">
            <div class="mcc-row-top">
              <div class="mcc-row-left">
                <i class="mcc-dot" :style="{ background: r.color }" />
                <span class="mcc-label">{{ r.label }}</span>
              </div>
              <div class="mcc-count">
                {{ r.count }}
                <span class="mcc-unit">个</span>
                <span class="mcc-pct">({{ r.percent }}%)</span>
              </div>
            </div>
            <div class="mcc-track">
              <div class="mcc-fill" :style="{ width: r.percent + '%', background: r.color }" />
            </div>
          </div>
        </div>
      </section>

      <section class="mcc-card second">
        <div class="mcc-head">
          <div class="mcc-title">
            <div class="mcc-title-text">章节掌握情况</div>
          </div>
        </div>

        <div ref="chapterRingRef" class="ring" />

        <div class="mcc-rows">
          <div v-for="r in chapterRows" :key="r.key" class="mcc-row">
            <div class="mcc-row-top">
              <div class="mcc-row-left">
                <i class="mcc-dot" :style="{ background: r.color }" />
                <span class="mcc-label">{{ r.label }}</span>
              </div>
              <div class="mcc-count">
                {{ r.count }}
                <span class="mcc-unit">个</span>
                <span class="mcc-pct">({{ r.percent }}%)</span>
              </div>
            </div>
            <div class="mcc-track">
              <div class="mcc-fill" :style="{ width: r.percent + '%', background: r.color }" />
            </div>
          </div>
        </div>
      </section>
    </div>

    <section class="mcc-note">
      <div class="mcc-note-title">掌握度说明</div>
      <div class="mcc-note-items">
        <div v-for="it in noteItems" :key="it.key" class="mcc-note-item">
          <i class="mcc-dot" :style="{ background: it.color }" />
          <div class="mcc-note-label">{{ it.label }}：</div>
          <div class="mcc-note-text">{{ it.text }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

type MasteryItem = {
  name: string
  dominant: number
  proficient: number
  weak: number
  aggregate: number
}

type ChapterItem = {
  name: string
  code: string
  progress: number
  accuracy: number
}

type MasteryStatistics = {
  advantageCount: number
  advantagePercentage?: number
  normalCount: number
  normalPercentage?: number
  weakCount: number
  weakPercentage?: number
  totalCount?: number
}

const props = withDefaults(
  defineProps<{
    mastery?: MasteryItem[]
    chapters?: ChapterItem[]
    knowledgeStat?: MasteryStatistics
    chapterStat?: MasteryStatistics
    assessmentCount?: number
    chapterHint?: string
  }>(),
  {
    mastery: () => [],
    chapters: () => [],
    assessmentCount: 0,
    chapterHint: '',
  }
)

type Stat = { dominant: number; proficient: number; weak: number }

type Row = { key: string; label: string; count: number; percent: number; color: string }

type NoteItem = { key: string; label: string; color: string; text: string }

const masteryStat = computed<Stat>(() => {
  const s: Stat = { dominant: 0, proficient: 0, weak: 0 }
  for (const r of props.mastery) {
    const m = Math.max(r.dominant, r.proficient, r.weak)
    if (m === r.dominant) s.dominant += 1
    else if (m === r.proficient) s.proficient += 1
    else s.weak += 1
  }
  return s
})

const chapterStat = computed<Stat>(() => {
  const s: Stat = { dominant: 0, proficient: 0, weak: 0 }
  for (const r of props.chapters) {
    if (r.progress >= 80 && r.accuracy >= 80) s.dominant += 1
    else if (r.progress >= 50 && r.accuracy >= 50) s.proficient += 1
    else s.weak += 1
  }
  return s
})

const toRows = (stat: Stat, labels: { dominant: string; proficient: string; weak: string }, colors: Row['color'][]) => {
  const total = stat.dominant + stat.proficient + stat.weak
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0)
  return [
    { key: 'dominant', label: labels.dominant, count: stat.dominant, percent: pct(stat.dominant), color: colors[0] },
    {
      key: 'proficient',
      label: labels.proficient,
      count: stat.proficient,
      percent: pct(stat.proficient),
      color: colors[1],
    },
    { key: 'weak', label: labels.weak, count: stat.weak, percent: pct(stat.weak), color: colors[2] },
  ] as Row[]
}

const toRowsFromStatistics = (
  s: MasteryStatistics,
  labels: { dominant: string; proficient: string; weak: string },
  colors: Row['color'][]
) => {
  const total = Number(s.totalCount ?? s.advantageCount + s.normalCount + s.weakCount) || 0
  const pct = (n: number, p?: number) => {
    if (typeof p === 'number') return Math.max(0, Math.min(100, Math.round(p)))
    return total ? Math.round((n / total) * 100) : 0
  }
  return [
    {
      key: 'dominant',
      label: labels.dominant,
      count: Number(s.advantageCount || 0),
      percent: pct(Number(s.advantageCount || 0), s.advantagePercentage),
      color: colors[0],
    },
    {
      key: 'proficient',
      label: labels.proficient,
      count: Number(s.normalCount || 0),
      percent: pct(Number(s.normalCount || 0), s.normalPercentage),
      color: colors[1],
    },
    {
      key: 'weak',
      label: labels.weak,
      count: Number(s.weakCount || 0),
      percent: pct(Number(s.weakCount || 0), s.weakPercentage),
      color: colors[2],
    },
  ] as Row[]
}

const masteryRows = computed<Row[]>(() => {
  const s = props.knowledgeStat
  if (s) {
    return toRowsFromStatistics(s, { dominant: '优势知识点', proficient: '掌握一般', weak: '薄弱知识点' }, [
      '#14b8a6',
      '#60a5fa',
      '#fb7185',
    ])
  }
  return toRows(masteryStat.value, { dominant: '优势知识点', proficient: '掌握一般', weak: '薄弱知识点' }, [
    '#14b8a6',
    '#60a5fa',
    '#fb7185',
  ])
})

const chapterRows = computed<Row[]>(() => {
  const s = props.chapterStat
  if (s) {
    return toRowsFromStatistics(s, { dominant: '优势章节', proficient: '一般章节', weak: '薄弱章节' }, [
      '#14b8a6',
      '#60a5fa',
      '#fb7185',
    ])
  }
  return toRows(chapterStat.value, { dominant: '优势章节', proficient: '一般章节', weak: '薄弱章节' }, [
    '#14b8a6',
    '#60a5fa',
    '#fb7185',
  ])
})

const masteryRingRef = ref<HTMLDivElement | null>(null)
const chapterRingRef = ref<HTMLDivElement | null>(null)
let masteryChart: echarts.ECharts | null = null
let chapterChart: echarts.ECharts | null = null

type DonutItem = { name: string; value: number; color: string }

const buildDonutOption = (items: DonutItem[], centerValue: string, centerLabel: string): echarts.EChartsOption => {
  const total = items.reduce((s, it) => s + (Number(it.value) || 0), 0)
  const data = total
    ? items.map(it => ({ name: it.name, value: it.value, itemStyle: { color: it.color } }))
    : [{ name: '暂无数据', value: 1, itemStyle: { color: '#e2e8f0' } }]
  return {
    tooltip: total ? { trigger: 'item' } : { show: false },
    series: [
      {
        type: 'pie',
        radius: ['70%', '82%'],
        center: ['50%', '52%'],
        label: { show: false },
        labelLine: { show: false },
        itemStyle: { borderColor: '#ffffff', borderWidth: 3 },
        data,
      },
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '40%',
        style: { text: centerValue, fill: '#0f172a', fontSize: 40, fontWeight: 900, align: 'center' },
      },
      {
        type: 'text',
        left: 'center',
        top: '68%',
        style: {
          text: centerLabel,
          fill: 'rgba(100, 116, 139, 0.85)',
          fontSize: 11,
          fontWeight: 900,
          lineHeight: 14,
          align: 'center',
        },
      },
    ],
  }
}

const masteryDonutItems = computed<DonutItem[]>(() =>
  masteryRows.value.map(r => ({ name: r.label, value: r.count, color: r.color }))
)
const chapterDonutItems = computed<DonutItem[]>(() =>
  chapterRows.value.map(r => ({ name: r.label, value: r.count, color: r.color }))
)
const masteryTotal = computed(() => masteryDonutItems.value.reduce((s, it) => s + (Number(it.value) || 0), 0))
const chapterTotal = computed(() => chapterDonutItems.value.reduce((s, it) => s + (Number(it.value) || 0), 0))

const renderRings = async () => {
  await nextTick()
  if (masteryRingRef.value) {
    masteryChart ??= echarts.init(masteryRingRef.value)
    masteryChart.setOption(
      buildDonutOption(masteryDonutItems.value, String(masteryTotal.value || 0), '总知识点数'),
      true
    )
  }
  if (chapterRingRef.value) {
    chapterChart ??= echarts.init(chapterRingRef.value)
    chapterChart.setOption(buildDonutOption(chapterDonutItems.value, String(chapterTotal.value || 0), '总章节数'), true)
  }
}

const onResize = () => {
  masteryChart?.resize()
  chapterChart?.resize()
}

watch(
  () => [masteryRows.value, chapterRows.value],
  () => renderRings(),
  { deep: true }
)

onMounted(() => {
  renderRings()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  masteryChart?.dispose()
  chapterChart?.dispose()
  masteryChart = null
  chapterChart = null
})

const noteItems = computed<NoteItem[]>(() => [
  { key: 'good', label: '优势', color: '#14b8a6', text: '正确率高于 80%，知识点运用熟练，逻辑清晰。' },
  { key: 'mid', label: '一般', color: '#60a5fa', text: '正确率在 60% - 80% 之间，存在部分知识盲区或细节失分。' },
  { key: 'bad', label: '薄弱', color: '#fb7185', text: '正确率低于 60%，需重点复习基础概念并加强练习。' },
])
</script>

<style scoped lang="less">
.mcc-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
}

@media (max-width: 980px) {
  .mcc-grid {
    grid-template-columns: 1fr;
  }
}

.mcc-card {
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  padding: 18px;
  box-sizing: border-box;
  border: 1px solid rgba(241, 245, 249, 1);
}

.mcc-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.mcc-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.mcc-title-text {
  font-size: 18px;
  line-height: 28px;
  font-weight: 700;
  color: rgb(30 41 59);
}

.mcc-rows {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.mcc-row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mcc-row-left {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.mcc-dot {
  width: 8px;
  height: 8px;
  margin-top: 3px;
  border-radius: 999px;
  display: inline-block;
  flex: none;
}

.mcc-label {
  font-size: 13px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.75);
}

.mcc-count {
  font-size: 16px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.85);
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  white-space: nowrap;
}

.mcc-unit {
  font-size: 12px;
  font-weight: 700;
  color: rgba(100, 116, 139, 0.75);
}

.mcc-pct {
  font-size: 12px;
  font-weight: 700;
  color: rgba(148, 163, 184, 0.95);
}

.mcc-track {
  margin-top: 10px;
  height: 6px;
  border-radius: 999px;
  background: rgba(241, 245, 249, 1);
  overflow: hidden;
}

.mcc-fill {
  height: 100%;
  border-radius: 999px;
}

.mcc-note {
  margin-top: 16px;
  border-radius: 14px;
  background: rgba(248, 250, 252, 1);
  border: 1px solid rgba(226, 232, 240, 1);
  padding: 14px 16px;
}

.mcc-note-title {
  font-size: 14px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.85);
}

.mcc-note-items {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

@media (max-width: 980px) {
  .mcc-note-items {
    grid-template-columns: 1fr;
  }
}

.mcc-note-item {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 5px 8px;
  min-width: 0;
}

.mcc-note-label {
  font-size: 12px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.7);
  white-space: nowrap;
}

.mcc-note-text {
  font-size: 12px;
  color: rgba(100, 116, 139, 0.9);
  width: 100%;
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
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.95);
  margin-top: 2px;
}

.mini-legend {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
  font-size: 10px;
  font-weight: 700;
  color: rgba(100, 116, 139, 0.9);
}

.mini-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.mini-dot {
  width: 7px;
  height: 7px;
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
  background: #6366f1;
}

.card-title-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.ring {
  width: 100%;
  height: 170px;
  margin-top: 10px;
}

.donut-legend {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.legend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.legend-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(17, 24, 39, 0.55);
  font-weight: 700;
  font-size: 12px;
}

.legend-val {
  font-weight: 700;
  color: rgba(17, 24, 39, 0.8);
  font-size: 14px;
}

.mini-dot-orange {
  background: #fb923c;
}

.divider {
  height: 1px;
  background: rgba(15, 23, 42, 0.06);
  margin-top: 14px;
}

.card-foot {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.foot-note {
  font-size: 10px;
  font-style: italic;
  color: rgba(17, 24, 39, 0.35);
  font-weight: 700;
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
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.chapter-item {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 18px;
  align-items: start;
}

.chapter-left {
  min-width: 0;
}

.chapter-name {
  font-size: 13px;
  font-weight: 700;
  color: rgba(17, 24, 39, 0.8);
  line-height: 18px;
}

.chapter-code {
  margin-top: 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: rgba(100, 116, 139, 0.65);
  text-transform: uppercase;
}

.chapter-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 10px;
  font-weight: 700;
  margin-bottom: 6px;
}

.metric-label {
  letter-spacing: 0.6px;
  text-transform: uppercase;
}

.metric-label-green {
  color: #10b981;
}

.metric-label-blue {
  color: #6366f1;
}

.metric-value {
  color: rgba(17, 24, 39, 0.55);
}

.metric-track {
  height: 6px;
  border-radius: 999px;
  background: #f1f5f9;
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  border-radius: 999px;
}

.metric-fill-green {
  background: #10b981;
}

.metric-fill-blue {
  background: #6366f1;
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
  .chapter-item {
    grid-template-columns: 1fr;
  }
}
</style>
