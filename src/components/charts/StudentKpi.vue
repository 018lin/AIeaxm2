<template>
  <div class="skpi-grid">
    <section class="skpi-card">
      <div class="skpi-top">
        <div class="skpi-label">完成数 / 作业数</div>
        <div class="skpi-icon skpi-icon-green"><ReadOutlined /></div>
      </div>
      <div class="skpi-val-row">
        <div class="skpi-val">
          {{ completedDisplay }}<span class="skpi-split">/</span
          ><span class="skpi-muted">{{ totalAssignmentsDisplay }}</span>
        </div>
      </div>
    </section>

    <section class="skpi-card">
      <div class="skpi-top">
        <div class="skpi-label">做题正确数 / 总题数</div>
        <div class="skpi-icon skpi-icon-blue"><FileTextOutlined /></div>
      </div>
      <div class="skpi-val-row">
        <div class="skpi-val">
          {{ correctDisplay }}<span class="skpi-split">/</span
          ><span class="skpi-muted">{{ totalQuestionsDisplay }}</span>
        </div>
      </div>
    </section>

    <section class="skpi-card">
      <div class="skpi-top">
        <div class="skpi-label">答题正确率</div>
        <div class="skpi-icon skpi-icon-orange"><CheckCircleOutlined /></div>
      </div>
      <div class="skpi-val-row">
        <div class="skpi-val">
          <span class="skpi-accent">{{ accuracyDisplay }}</span
          ><span class="skpi-unit">%</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { CheckCircleOutlined, FileTextOutlined, ReadOutlined } from '@ant-design/icons-vue'
import { computed } from 'vue'

// 数据由父组件传入，组件仅负责展示

const props = withDefaults(
  defineProps<{
    completed?: number
    totalAssignments?: number
    correct?: number
    totalQuestions?: number
    accuracy?: number
  }>(),
  {
    completed: 0,
    totalAssignments: 0,
    correct: 0,
    totalQuestions: 0,
    accuracy: 0,
  }
)

const clampInt = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const n = Number.parseInt(String(v ?? '0'), 10)
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, n))
}

const clampPct = (v: unknown) => {
  const n = Number.parseFloat(String(v ?? '0'))
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

const completedDisplay = computed(() => clampInt(props.completed))
const totalAssignmentsDisplay = computed(() => clampInt(props.totalAssignments))
const correctDisplay = computed(() => clampInt(props.correct))
const totalQuestionsDisplay = computed(() => clampInt(props.totalQuestions))
const accuracyDisplay = computed(() => clampPct(props.accuracy))
</script>

<style scoped lang="less">
.skpi-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 1100px) {
  .skpi-grid {
    grid-template-columns: 1fr;
  }
}

.skpi-card {
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
  padding: 18px 18px 16px;
  box-sizing: border-box;
  border: 1px solid rgba(241, 245, 249, 1);
}

.skpi-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.skpi-label {
  font-size: 12px;
  letter-spacing: 0.8px;
  color: rgba(17, 24, 39, 0.45);
  font-weight: 700;
}

.skpi-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.skpi-icon-green {
  background: rgba(20, 184, 166, 0.1);
  color: #14b8a6;
}

.skpi-icon-blue {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.skpi-icon-orange {
  background: rgba(249, 115, 22, 0.1);
  color: #f97316;
}

.skpi-val-row {
  margin-top: 14px;
}

.skpi-val {
  font-size: 26px;
  line-height: 1;
  font-weight: 700;
  color: #111827;
}

.skpi-unit {
  font-size: 18px;
  font-weight: 700;
  color: rgba(17, 24, 39, 0.45);
  margin-left: 4px;
}

.skpi-split {
  font-size: 18px;
  font-weight: 700;
  color: rgba(17, 24, 39, 0.35);
  margin: 0 6px;
}

.skpi-muted {
  font-size: 18px;
  font-weight: 700;
  color: rgba(17, 24, 39, 0.35);
}

.skpi-accent {
  color: #f97316;
}
</style>
