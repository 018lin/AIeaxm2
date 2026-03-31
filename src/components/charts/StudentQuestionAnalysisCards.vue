<template>
  <div class="sqac-grid">
    <section class="sqac-card">
      <div class="sqac-head">
        <div class="sqac-title">
          <div class="sqac-title-cn">题目分析</div>
        </div>

        <div class="sqac-head-right">
          <div v-if="!props.isClassReport" class="sqac-mini-legend">
            <span class="sqac-dot sqac-dot-person" />
            <span>个人准确率</span>
            <span class="sqac-dot sqac-dot-class" />
            <span>班级平均</span>
            <span class="sqac-dot sqac-dot-max" />
            <span>班级最高</span>
          </div>

          <div v-else class="sqac-mini-legend">
            <span class="sqac-dot sqac-dot-min" />
            <span>班级最低</span>
            <span class="sqac-dot sqac-dot-class" />
            <span>班级平均</span>
            <span class="sqac-dot sqac-dot-max" />
            <span>班级最高</span>
          </div>
        </div>
      </div>

      <div class="sqac-table" :class="{ class: props.isClassReport }">
        <div class="sqac-row sqac-row-head">
          <div class="c1">题型</div>
          <div class="c2">对应题目数</div>
          <div v-if="!props.isClassReport" class="c3">{{ props.studentName }}错题数</div>
          <div class="c4">
            准确率对比（
            <template v-if="!props.isClassReport">个人 VS 班级平均 VS 班级最高</template>
            <template v-else>班级最低 VS 班级平均 VS 班级最高</template>
            ）
          </div>
        </div>

        <div v-for="r in typeRows" :key="r.key" class="sqac-row">
          <div class="c1">{{ r.name }}</div>
          <div class="c2">{{ r.total }}</div>
          <div class="c3 err" v-if="!props.isClassReport">{{ r.wrong }}</div>

          <div class="c4">
            <div class="sqac-bars">
              <template v-if="!props.isClassReport">
                <div class="sqac-bar">
                  <div class="sqac-bar-track">
                    <a-tooltip :title="`个人：${r.personRate}%`">
                      <div class="sqac-bar-fill sqac-bar-fill-person" :style="{ width: r.personRate + '%' }" />
                    </a-tooltip>
                  </div>
                  <div class="sqac-bar-val">{{ r.personRate }}%</div>
                </div>

                <div class="sqac-bar">
                  <div class="sqac-bar-track">
                    <a-tooltip :title="`班级平均：${r.classRate}%`">
                      <div class="sqac-bar-fill sqac-bar-fill-class" :style="{ width: r.classRate + '%' }" />
                    </a-tooltip>
                  </div>
                  <div class="sqac-bar-val muted">{{ r.classRate }}%</div>
                </div>

                <div class="sqac-bar">
                  <div class="sqac-bar-track">
                    <a-tooltip :title="`班级最高：${r.maxRate}%`">
                      <div class="sqac-bar-fill sqac-bar-fill-max" :style="{ width: r.maxRate + '%' }" />
                    </a-tooltip>
                  </div>
                  <div class="sqac-bar-val muted">{{ r.maxRate }}%</div>
                </div>
              </template>
              <template v-else>
                <div class="sqac-bar">
                  <div class="sqac-bar-track">
                    <a-tooltip :title="`班级最低：${r.classMinCorrectRate}%`">
                      <div class="sqac-bar-fill sqac-bar-fill-min" :style="{ width: r.classMinCorrectRate + '%' }" />
                    </a-tooltip>
                  </div>
                  <div class="sqac-bar-val">{{ r.classMinCorrectRate }}%</div>
                </div>

                <div class="sqac-bar">
                  <div class="sqac-bar-track">
                    <a-tooltip :title="`班级平均：${r.classAvgCorrectRate}%`">
                      <div class="sqac-bar-fill sqac-bar-fill-class" :style="{ width: r.classAvgCorrectRate + '%' }" />
                    </a-tooltip>
                  </div>
                  <div class="sqac-bar-val muted">{{ r.classAvgCorrectRate }}%</div>
                </div>

                <div class="sqac-bar">
                  <div class="sqac-bar-track">
                    <a-tooltip :title="`班级最高：${r.classMaxCorrectRate}%`">
                      <div class="sqac-bar-fill sqac-bar-fill-max" :style="{ width: r.classMaxCorrectRate + '%' }" />
                    </a-tooltip>
                  </div>
                  <div class="sqac-bar-val muted">{{ r.classMaxCorrectRate }}%</div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="sqac-card">
      <div class="sqac-head">
        <div class="sqac-title">
          <div class="sqac-title-cn">难度分析</div>
        </div>
        <div class="sqac-head-right">
          <div v-if="!props.isClassReport" class="sqac-mini-legend">
            <span class="sqac-dot sqac-dot-person" />
            <span>个人准确率</span>
            <span class="sqac-dot sqac-dot-class" />
            <span>班级平均</span>
            <span class="sqac-dot sqac-dot-max" />
            <span>班级最高</span>
          </div>
          <div v-else class="sqac-mini-legend">
            <span class="sqac-dot sqac-dot-min" />
            <span>班级最低</span>
            <span class="sqac-dot sqac-dot-class" />
            <span>班级平均</span>
            <span class="sqac-dot sqac-dot-max" />
            <span>班级最高</span>
          </div>
        </div>
      </div>

      <div class="sqac-table" :class="{ class: props.isClassReport }">
        <div class="sqac-row sqac-row-head">
          <div class="d1">难度</div>
          <div class="d2">对应题目数</div>
          <div v-if="!props.isClassReport" class="d3">{{ props.studentName }}错题数</div>
          <div class="d4">
            准确率对比（
            <template v-if="!props.isClassReport">个人 VS 班级平均 VS 班级最高</template>
            <template v-else>班级最低 VS 班级平均 VS 班级最高</template>
            ）
          </div>
        </div>

        <div v-for="r in diffRows" :key="r.key" class="sqac-row">
          <div class="d1">
            <span class="sqac-tag" :class="r.tagTone">{{ r.name }}</span>
          </div>
          <div class="d2">{{ r.total }}</div>
          <div class="d3 err" v-if="!props.isClassReport">{{ r.wrong }}</div>

          <div class="d4">
            <div class="sqac-bars">
              <template v-if="!props.isClassReport">
                <div class="sqac-bar">
                  <div class="sqac-bar-track">
                    <a-tooltip :title="`个人：${r.personRate}%`">
                      <div class="sqac-bar-fill sqac-bar-fill-person" :style="{ width: r.personRate + '%' }" />
                    </a-tooltip>
                  </div>
                  <div class="sqac-bar-val">{{ r.personRate }}%</div>
                </div>

                <div class="sqac-bar">
                  <div class="sqac-bar-track">
                    <a-tooltip :title="`班级：${r.classRate}%`">
                      <div class="sqac-bar-fill sqac-bar-fill-class" :style="{ width: r.classRate + '%' }" />
                    </a-tooltip>
                  </div>
                  <div class="sqac-bar-val muted">{{ r.classRate }}%</div>
                </div>

                <div class="sqac-bar">
                  <div class="sqac-bar-track">
                    <a-tooltip :title="`班级最高：${r.classMaxCorrectRate}%`">
                      <div class="sqac-bar-fill sqac-bar-fill-max" :style="{ width: r.classMaxCorrectRate + '%' }" />
                    </a-tooltip>
                  </div>
                  <div class="sqac-bar-val muted">{{ r.classMaxCorrectRate }}%</div>
                </div>
              </template>
              <template v-else>
                <div class="sqac-bar">
                  <div class="sqac-bar-track">
                    <a-tooltip :title="`班级最低：${r.classMinCorrectRate}%`">
                      <div class="sqac-bar-fill sqac-bar-fill-min" :style="{ width: r.classMinCorrectRate + '%' }" />
                    </a-tooltip>
                  </div>
                  <div class="sqac-bar-val">{{ r.classMinCorrectRate }}%</div>
                </div>

                <div class="sqac-bar">
                  <div class="sqac-bar-track">
                    <a-tooltip :title="`班级平均：${r.classAvgCorrectRate}%`">
                      <div class="sqac-bar-fill sqac-bar-fill-class" :style="{ width: r.classAvgCorrectRate + '%' }" />
                    </a-tooltip>
                  </div>
                  <div class="sqac-bar-val muted">{{ r.classAvgCorrectRate }}%</div>
                </div>

                <div class="sqac-bar">
                  <div class="sqac-bar-track">
                    <a-tooltip :title="`班级最高：${r.classMaxCorrectRate}%`">
                      <div class="sqac-bar-fill sqac-bar-fill-max" :style="{ width: r.classMaxCorrectRate + '%' }" />
                    </a-tooltip>
                  </div>
                  <div class="sqac-bar-val muted">{{ r.classMaxCorrectRate }}%</div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { QuestionDifficultyRow, QuestionTypeRow } from '@/types/analysis/charts'
import { computed } from 'vue'

// 数据由父组件传入，组件仅负责展示

const props = withDefaults(
  defineProps<{
    typeRows?: QuestionTypeRow[]
    diffRows?: QuestionDifficultyRow[]
    isClassReport?: boolean // 是否为班级报告
    studentName?: string // 学生姓名，用于学生报告的列名
  }>(),
  {
    typeRows: () => [],
    diffRows: () => [],
    isClassReport: false,
    studentName: '个人',
  }
)

const typeRows = computed(() => props.typeRows)
const diffRows = computed(() => props.diffRows)
</script>

<style scoped lang="less">
.sqac-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
}

@media (max-width: 1100px) {
  .sqac-grid {
    grid-template-columns: 1fr;
  }
}

.sqac-card {
  background: #ffffff;
  border-radius: 22px;
  border: 1px solid #eef0f3;
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.06);
  padding: 18px;
  box-sizing: border-box;
}

.sqac-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.sqac-title {
  display: inline-flex;
  align-items: baseline;
  gap: 12px;
  min-width: 0;
}

.sqac-title-cn {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.sqac-title-cn::before {
  content: '';
  width: 4px;
  height: 18px;
  border-radius: 99px;
  background: #f59e0b;
  display: inline-block;
}

.sqac-head-right {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.sqac-mini-legend {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(100, 116, 139, 0.85);
  white-space: nowrap;
}

.sqac-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  display: inline-block;
}

.sqac-dot-person {
  background: #14b8a6;
}

.sqac-dot-class {
  background: #a5b4fc;
}

.sqac-dot-max {
  background: #6366f1;
}

.sqac-dot-min {
  background: #fb7185;
}

.sqac-bar-fill-min {
  background: #fb7185;
}

.sqac-table {
  margin-top: 16px;
  border-top: 1px solid rgba(241, 245, 249, 1);
}

.sqac-row {
  display: grid;
  grid-template-columns: 140px 90px 90px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid rgba(241, 245, 249, 1);
  font-size: 14px;
}

.sqac-table.class .sqac-row {
  grid-template-columns: 140px 90px minmax(0, 1fr);
}

.sqac-row:last-child {
  border-bottom: 0;
}

.sqac-row-head {
  padding: 14px 0;
  color: rgba(100, 116, 139, 0.85);
  font-size: 12px;
  font-weight: 700;
}

.err {
  color: #fb7185;
  font-weight: 700;
}

.sqac-bars {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}

.sqac-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sqac-bar-track {
  position: relative;
  height: 6px;
  flex: 1;
  border-radius: 999px;
  background: rgba(241, 245, 249, 1);
  overflow: hidden;
}

.sqac-bar-fill {
  height: 100%;
  border-radius: 999px;
}

.sqac-bar-fill-person {
  background: #14b8a6;
}

.sqac-bar-fill-class {
  background: #a5b4fc;
}

.sqac-bar-fill-max {
  background: #6366f1;
}

.sqac-bar-fill-class.overlay {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0.8;
  z-index: 10;
}

.sqac-bar-fill-max.overlay {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0.8;
  z-index: 9;
}

.sqac-bar-val {
  width: 54px;
  text-align: right;
  font-size: 12px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.9);
}

.sqac-bar-val.muted {
  color: rgba(100, 116, 139, 0.8);
}

.sqac-max {
  font-size: 12px;
  font-weight: 700;
  color: rgba(100, 116, 139, 0.75);
}

.sqac-bar-meta {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
}

.muted {
  color: rgba(100, 116, 139, 0.8);
}

.d1,
.d2,
.d3,
.d4 {
  min-width: 0;
}

.sqac-row .d1 {
  grid-column: 1 / 2;
}
.sqac-row .d2 {
  grid-column: 2 / 3;
}
.sqac-row .d3 {
  grid-column: 3 / 4;
}
.sqac-row .d4 {
  grid-column: 4 / 5;
}

.sqac-tag {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid transparent;
}

.tone-easy {
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.18);
}

.tone-mid {
  color: #f97316;
  background: rgba(249, 115, 22, 0.12);
  border-color: rgba(249, 115, 22, 0.18);
}

.tone-hard {
  color: #fb7185;
  background: rgba(251, 113, 133, 0.12);
  border-color: rgba(251, 113, 133, 0.18);
}
</style>
