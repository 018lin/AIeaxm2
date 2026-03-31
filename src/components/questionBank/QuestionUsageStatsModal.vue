<template>
  <a-modal
    :open="open"
    centered
    :footer="null"
    :width="920"
    wrap-class-name="qb-usage-modal"
    @update:open="emit('update:open', $event)"
  >
    <template #title>
      <div class="qb-usage-head">
        <div class="qb-usage-head-title">题目使用统计</div>
      </div>
    </template>

    <div class="qb-usage">
      <div class="qb-usage-main">
        <div class="qb-usage-top">
          <div class="qb-usage-stat">
            <div class="qb-usage-stat-icon"><BarChartOutlined /></div>
            <div class="qb-usage-stat-text">
              <div class="qb-usage-stat-label">累计使用次数</div>
              <div class="qb-usage-stat-value">{{ totalCount }}</div>
            </div>
          </div>

          <div class="qb-usage-stat">
            <div class="qb-usage-stat-icon"><CalendarOutlined /></div>
            <div class="qb-usage-stat-text">
              <div class="qb-usage-stat-label">最常使用月份</div>
              <div class="qb-usage-stat-value">{{ topMonth }}</div>
            </div>
          </div>
        </div>

        <div class="qb-usage-content">
          <div class="qb-usage-table">
            <div class="qb-usage-table-head">
              <div class="col-month">月份</div>
              <div class="col-count bold">使用次数</div>
            </div>

            <div v-for="row in monthlyRows" :key="row.month" class="qb-usage-table-row">
              <div class="col-month">{{ row.month }}</div>
              <div class="col-count bold">{{ row.count }}</div>
            </div>
          </div>

          <div class="qb-usage-chart">
            <div class="qb-usage-chart-title">趋势概览</div>

            <button type="button" class="qb-usage-chart-box" :class="{ expanded: chartExpanded }" @click="toggleChart">
              <div class="qb-usage-chart-months">
                <span v-for="m in monthShorts" :key="m" class="m">{{ m }}</span>
              </div>

              <div class="qb-usage-bars">
                <div v-for="b in barData" :key="b.month" class="qb-usage-bar">
                  <div
                    class="qb-usage-bar-fill"
                    :style="{ height: chartExpanded && barsAnimated ? b.h + '%' : '0%' }"
                  ></div>
                </div>
              </div>

              <div class="qb-usage-chart-tip">
                <span v-if="!chartExpanded">点击展开图表</span>
                <span v-else>数据反映过去四个月的使用波动情况</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div class="qb-usage-footer">
        <a-button type="primary" class="qb-usage-ok" @click="emit('update:open', false)">确定</a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { BarChartOutlined, CalendarOutlined } from '@ant-design/icons-vue'
import { computed, nextTick, ref, watch } from 'vue'

type MonthRow = { month: string; count: number }

const props = defineProps<{
  open: boolean
  baseQuestion: any
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const chartExpanded = ref(false)
const barsAnimated = ref(false)

const seedKey = computed(() => String(props.baseQuestion?.key ?? props.baseQuestion?.id ?? '0'))

const hashSeed = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0 || 1
}

const seededRand = (seed: number) => {
  let x = seed % 2147483647
  if (x <= 0) x += 2147483646
  return () => {
    x = (x * 48271) % 2147483647
    return x / 2147483647
  }
}

const buildMonths = (seed: string): MonthRow[] => {
  const rnd = seededRand(hashSeed(seed))
  const end = new Date()
  const rows: MonthRow[] = []
  for (let i = 3; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const count = Math.max(1, Math.round(6 + rnd() * 10 + rnd() * 6))
    rows.push({ month: ym, count })
  }
  return rows
}

const monthlyRows = computed(() => buildMonths(seedKey.value))

const totalCount = computed(() => monthlyRows.value.reduce((sum, r) => sum + r.count, 0))

const topMonth = computed(() => {
  const rows = monthlyRows.value
  if (!rows.length) return '-'
  const best = rows.reduce((a, b) => (b.count > a.count ? b : a))
  return best.month
})

const questionCode = computed(() => {
  const n = hashSeed(seedKey.value) % 1000000
  return `q${String(n).padStart(6, '0')}`
})

const monthShorts = computed(() => monthlyRows.value.map(r => `${r.month.split('-')[1]}月`))

const barData = computed(() => {
  const rows = monthlyRows.value
  const max = Math.max(...rows.map(r => r.count), 1)
  return rows.map(r => ({
    month: r.month,
    h: Math.round((r.count / max) * 84 + 6),
  }))
})

const animateBars = async () => {
  barsAnimated.value = false
  await nextTick()
  requestAnimationFrame(() => {
    barsAnimated.value = true
  })
}

const toggleChart = async () => {
  chartExpanded.value = !chartExpanded.value
  if (chartExpanded.value) await animateBars()
}

watch(
  () => props.open,
  async open => {
    if (!open) {
      chartExpanded.value = false
      barsAnimated.value = false
      return
    }

    await nextTick()
    chartExpanded.value = true
    await animateBars()
  }
)
</script>

<style lang="scss">
.qb-usage-modal {
  qb-usage-stat-value .ant-modal-content {
    border-radius: 20px;
    overflow: hidden;
    padding: 0;
    background: #fff;
  }

  .ant-modal-header {
    margin: 0;
    padding: 18px 22px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .ant-modal-body {
    padding: 0;
  }

  .ant-modal-content {
    padding: 0;
  }
}

.qb-usage {
  background: #f8f7f6;
  padding: 18px 22px 16px;
  display: flex;
  flex-direction: column;
  min-height: 520px;
}

.qb-usage-head-title {
  font-size: 18px;
  font-weight: 700;
  color: rgb(60, 55, 51);
}

.qb-usage-main {
  flex: 1;
  min-height: 0;
}

.qb-usage-top {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}

.qb-usage-stat {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 14px;
  border: 1px solid #eae2db;
  box-shadow:
    0 4px 20px -4px rgba(60, 55, 51, 0.08),
    0 2px 8px -2px rgba(60, 55, 51, 0.04);
  padding: 16px;

  display: flex;
  align-items: center;
  gap: 12px;
}

.qb-usage-stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  background: rgba(255, 122, 41, 0.12);
  color: #ff7a29;
}

.qb-usage-stat-label {
  font-size: 12px;
  color: rgb(122, 115, 110);
}

.qb-usage-stat-value {
  font-size: 28px;
  font-weight: 700;
  color: rgb(60, 55, 51);
  line-height: 1.1;
  margin-top: 2px;
}

.qb-usage-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  align-items: stretch;
}

.qb-usage-table {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 14px;
  border: 1px solid #eae2db;
  overflow: hidden;
  box-shadow:
    0 4px 20px -4px rgba(60, 55, 51, 0.08),
    0 2px 8px -2px rgba(60, 55, 51, 0.04);
}

.qb-usage-table-head {
  display: grid;
  grid-template-columns: 1fr 120px;
  background: rgba(250, 250, 249, 0.8);
  border-bottom: 1px solid rgb(242, 235, 230);
  padding: 12px 16px;
  font-weight: 700;
  color: rgb(122, 115, 110);
  font-size: 13px;
}

.qb-usage-table-row {
  display: grid;
  grid-template-columns: 1fr 120px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  color: rgb(60, 55, 51);
  font-size: 13px;

  &:last-child {
    border-bottom: none;
  }

  .col-count {
    text-align: right;
  }
}

.qb-usage-chart {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qb-usage-chart-title {
  font-size: 13px;
  font-weight: 700;
  color: rgb(122, 115, 110);
  padding-left: 6px;
}

.qb-usage-chart-box {
  border: 1px solid #eae2db;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow:
    0 4px 20px -4px rgba(60, 55, 51, 0.08),
    0 2px 8px -2px rgba(60, 55, 51, 0.04);
  padding: 12px 14px;

  cursor: pointer;
  text-align: left;

  height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 10px;

  transition: height 220ms ease;

  &.expanded {
    height: 320px;
  }
}

.qb-usage-chart-months {
  display: flex;
  justify-content: space-between;
  color: rgba(0, 0, 0, 0.35);
  font-size: 12px;
  padding: 0 2px;

  .m:last-child {
    color: #ff7a29;
    font-weight: 700;
  }
}

.qb-usage-bars {
  height: 140px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  align-items: end;
}

.qb-usage-bar {
  height: 100%;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.04);
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}

.qb-usage-bar-fill {
  width: 100%;
  background: linear-gradient(180deg, rgba(255, 122, 41, 0.95) 0%, rgba(255, 122, 41, 0.45) 100%);
  height: 0%;
  transition: height 680ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.qb-usage-chart-tip {
  color: rgba(0, 0, 0, 0.35);
  font-size: 12px;
}

.qb-usage-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.qb-usage-ok {
  height: 40px;
  border-radius: 10px;
  background: #ff7a29;
  border-color: #ff7a29;
}
</style>
