<template>
  <div class="mcl-group grid-cols-2 gap-md">
    <section class="panel app-surface p-20">
      <div class="panel-head flex items-center mb-20">
        <div class="panel-title text-m bold">知识点掌握程度</div>
      </div>

      <div class="buckets">
        <div class="bucket bucket-weak">
          <div class="bucket-left">
            <div class="bucket-title">
              <i class="dot dot-weak"></i>
              <span>弱势知识点 ({{ masteryBuckets.weak.length }}个)</span>
            </div>
            <div class="chips">
              <span v-for="n in masteryBucketNames.weak" :key="n" class="chip">{{ n }}</span>
              <span v-if="!masteryBucketNames.weak.length" class="chip chip-empty">暂无</span>
            </div>
          </div>
          <div class="bucket-right">薄弱知识点</div>
        </div>

        <div class="bucket bucket-general">
          <div class="bucket-left">
            <div class="bucket-title">
              <i class="dot dot-general"></i>
              <span>掌握一般知识点 ({{ masteryBuckets.general.length }}个)</span>
            </div>
            <div class="chips">
              <span v-for="n in masteryBucketNames.general" :key="n" class="chip">{{ n }}</span>
              <span v-if="!masteryBucketNames.general.length" class="chip chip-empty">暂无</span>
            </div>
          </div>
          <div class="bucket-right">一般知识点</div>
        </div>

        <div class="bucket bucket-adv">
          <div class="bucket-left">
            <div class="bucket-title">
              <i class="dot dot-adv"></i>
              <span>优势知识点 ({{ masteryBuckets.adv.length }}个)</span>
            </div>
            <div class="chips">
              <span v-for="n in masteryBucketNames.adv" :key="n" class="chip">{{ n }}</span>
              <span v-if="!masteryBucketNames.adv.length" class="chip chip-empty">暂无</span>
            </div>
          </div>
          <div class="bucket-right">优势知识点</div>
        </div>
      </div>

      <div class="table table-ant">
        <a-table
          :data-source="masteryTableRows"
          :columns="masteryColumns"
          :pagination="false"
          row-key="key"
          table-layout="fixed"
          class="mcl-ant-table"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <div class="td-name bold" :title="record.name">{{ record.name }}</div>
            </template>

            <template v-else-if="column.key === 'totalQuestions'">
              <div class="td-mid">{{ record.totalQuestions }}</div>
            </template>

            <template v-else-if="column.key === 'wrongQuestions'">
              <div class="td-mid muted">{{ record.wrongQuestions }}</div>
            </template>

            <template v-else-if="column.key === 'correctRate'">
              <div class="td-mid bold text-primary">{{ record.correctRate }}%</div>
            </template>

            <template v-else-if="column.key === 'classAvgCorrectRate'">
              <div class="td-mid">{{ record.classAvgCorrectRate }}%</div>
            </template>

            <template v-else-if="column.key === 'classMaxCorrectRate'">
              <div class="td-mid">{{ record.classMaxCorrectRate }}%</div>
            </template>

            <template v-else-if="column.key === 'classMinCorrectRate'">
              <div class="td-mid">{{ record.classMinCorrectRate }}%</div>
            </template>
          </template>

          <template #emptyText>
            <div class="empty empty-ant">暂无数据</div>
          </template>
        </a-table>
      </div>
    </section>

    <section class="panel app-surface p-20">
      <div class="panel-head flex items-center mb-20">
        <div class="panel-title text-m bold">章节掌握程度</div>
      </div>

      <div class="buckets">
        <div class="bucket bucket-weak">
          <div class="bucket-left">
            <div class="bucket-title">
              <i class="dot dot-weak"></i>
              <span>弱势章节 ({{ chapterBuckets.weak.length }}个)</span>
            </div>
            <div class="chips">
              <span v-for="n in chapterBucketNames.weak" :key="n" class="chip">{{ n }}</span>
              <span v-if="!chapterBucketNames.weak.length" class="chip chip-empty">暂无</span>
            </div>
          </div>
          <div class="bucket-right">薄弱章节</div>
        </div>

        <div class="bucket bucket-general">
          <div class="bucket-left">
            <div class="bucket-title">
              <i class="dot dot-general"></i>
              <span>掌握一般章节 ({{ chapterBuckets.general.length }}个)</span>
            </div>
            <div class="chips">
              <span v-for="n in chapterBucketNames.general" :key="n" class="chip">{{ n }}</span>
              <span v-if="!chapterBucketNames.general.length" class="chip chip-empty">暂无</span>
            </div>
          </div>
          <div class="bucket-right">一般章节</div>
        </div>

        <div class="bucket bucket-adv">
          <div class="bucket-left">
            <div class="bucket-title">
              <i class="dot dot-adv"></i>
              <span>优势章节 ({{ chapterBuckets.adv.length }}个)</span>
            </div>
            <div class="chips">
              <span v-for="n in chapterBucketNames.adv" :key="n" class="chip">{{ n }}</span>
              <span v-if="!chapterBucketNames.adv.length" class="chip chip-empty">暂无</span>
            </div>
          </div>
          <div class="bucket-right">优势章节</div>
        </div>
      </div>

      <div class="table table-ant">
        <a-table
          :data-source="chapterTableRows"
          :columns="chapterColumns"
          :pagination="false"
          row-key="key"
          table-layout="fixed"
          class="mcl-ant-table"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <div class="td-name bold" :title="record.name">{{ record.name }}</div>
            </template>

            <template v-else-if="column.key === 'totalQuestions'">
              <div class="td-mid">{{ record.totalQuestions }}</div>
            </template>

            <template v-else-if="column.key === 'wrongQuestions'">
              <div class="td-mid muted">{{ record.wrongQuestions }}</div>
            </template>

            <template v-else-if="column.key === 'correctRate'">
              <div class="td-mid bold text-primary">{{ record.correctRate }}%</div>
            </template>

            <template v-else-if="column.key === 'classAvgCorrectRate'">
              <div class="td-mid">{{ record.classAvgCorrectRate }}%</div>
            </template>

            <template v-else-if="column.key === 'classMaxCorrectRate'">
              <div class="td-mid">{{ record.classMaxCorrectRate }}%</div>
            </template>
            <template v-else-if="column.key === 'classMinCorrectRate'">
              <div class="td-mid">{{ record.classMinCorrectRate }}%</div>
            </template>
          </template>

          <template #emptyText>
            <div class="empty empty-ant">暂无数据</div>
          </template>
        </a-table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { MasteryGroupVO } from '@/api/analysis/type'
import type { MasteryTableItem } from '@/types/analysis/charts'
import { computed } from 'vue'

// 数据由父组件传入，组件仅负责展示

const props = withDefaults(
  defineProps<{
    mastery?: MasteryTableItem[]
    chapters?: MasteryTableItem[]
    threshold?: { weak: number; adv: number }
    isClassReport?: boolean // 是否为班级报告
    studentName?: string // 学生姓名，用于学生报告的列名
    // 预分类的知识点掌握程度分组数据
    knowledgePointMasteryGroups?: MasteryGroupVO[]
    // 预分类的章节掌握程度分组数据
    chapterMasteryGroups?: MasteryGroupVO[]
  }>(),
  {
    mastery: () => [],
    chapters: () => [],
    threshold: () => ({ weak: 60, adv: 80 }),
    isClassReport: false,
    studentName: '学生',
    knowledgePointMasteryGroups: () => [],
    chapterMasteryGroups: () => [],
  }
)

const baseColumns = computed(() => {
  const commonColumns1 = [
    { title: '对应题目数', dataIndex: 'totalQuestions', key: 'totalQuestions', align: 'center', width: 80 },
  ]
  const commonColumns2 = [
    {
      title: '班级平均正确率',
      dataIndex: 'classAvgCorrectRate',
      key: 'classAvgCorrectRate',
      align: 'center',
      width: 120,
    },
    {
      title: '班级最高正确率',
      dataIndex: 'classMaxCorrectRate',
      key: 'classMaxCorrectRate',
      align: 'center',
      width: 'auto',
    },
  ]

  if (props.isClassReport) {
    return [
      ...commonColumns1,
      ...commonColumns2,
      // 班级报告特有列
      {
        title: '班级最低正确率',
        dataIndex: 'classMinCorrectRate',
        key: 'classMinCorrectRate',
        align: 'center',
        width: 120,
      },
    ]
  } else {
    return [
      ...commonColumns1,
      // 学生报告特有列
      {
        title: `${props.studentName}的错题数`,
        dataIndex: 'wrongQuestions',
        key: 'wrongQuestions',
        align: 'center',
        width: 100,
      },
      {
        title: `${props.studentName}的正确率`,
        dataIndex: 'correctRate',
        key: 'correctRate',
        align: 'center',
        width: 100,
      },
      ...commonColumns2,
    ]
  }
})

const masteryColumns = computed(() => [
  { title: '知识点', dataIndex: 'name', key: 'name', ellipsis: true, width: 'auto' },
  ...baseColumns.value,
])

const chapterColumns = computed(() => [
  { title: '章节', dataIndex: 'name', key: 'name', ellipsis: true, width: 'auto' },
  ...baseColumns.value,
])

// 数值兜底：把异常值/小数归一化到 0-100
const clampInt = (v: any, min: number, max: number) => {
  const n = Math.round(Number(v || 0))
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min))
}

// 按阈值分桶：弱势/一般/优势
const classify = (avg: number) => {
  const weak = Number(props.threshold?.weak ?? 60)
  const adv = Number(props.threshold?.adv ?? 80)
  if (avg < weak) return 'weak' as const
  if (avg < adv) return 'general' as const
  return 'adv' as const
}

const sliceNames = (arr: { name: string }[]) => {
  return (arr || []).map(i => String(i.name || '').trim()).filter(Boolean)
}

// 顶部标签区：按"掌握度/正确率"分成三组，用于展示 chips + 数量
const masteryBuckets = computed(() => {
  // 如果有预分类数据，直接使用
  if (props.knowledgePointMasteryGroups && props.knowledgePointMasteryGroups.length > 0) {
    const weak: MasteryTableItem[] = []
    const general: MasteryTableItem[] = []
    const adv: MasteryTableItem[] = []

    props.knowledgePointMasteryGroups.forEach(group => {
      const names = group.names ?? []
      const items = names.map(name => ({ name }) as MasteryTableItem)
      if (group.masteryLevel === 'weak') weak.push(...items)
      else if (group.masteryLevel === 'normal') general.push(...items)
      else if (group.masteryLevel === 'advantage') adv.push(...items)
    })

    return { weak, general, adv }
  }

  // 否则基于 correctRate 动态计算
  const src = props.mastery ?? []
  const weak: MasteryTableItem[] = []
  const general: MasteryTableItem[] = []
  const adv: MasteryTableItem[] = []

  src.forEach(it => {
    const avg = clampInt(it.correctRate, 0, 100)
    const k = classify(avg)
    if (k === 'weak') weak.push(it)
    else if (k === 'general') general.push(it)
    else adv.push(it)
  })

  return { weak, general, adv }
})

const chapterBuckets = computed(() => {
  // 如果有预分类数据，直接使用
  if (props.chapterMasteryGroups && props.chapterMasteryGroups.length > 0) {
    const weak: MasteryTableItem[] = []
    const general: MasteryTableItem[] = []
    const adv: MasteryTableItem[] = []

    props.chapterMasteryGroups.forEach(group => {
      const names = group.names ?? []
      const items = names.map(name => ({ name }) as MasteryTableItem)
      if (group.masteryLevel === 'weak') weak.push(...items)
      else if (group.masteryLevel === 'normal') general.push(...items)
      else if (group.masteryLevel === 'advantage') adv.push(...items)
    })

    return { weak, general, adv }
  }

  // 否则基于 correctRate 动态计算
  const src = props.chapters ?? []
  const weak: MasteryTableItem[] = []
  const general: MasteryTableItem[] = []
  const adv: MasteryTableItem[] = []

  src.forEach(it => {
    const avg = clampInt(it.correctRate, 0, 100)
    const k = classify(avg)
    if (k === 'weak') weak.push(it)
    else if (k === 'general') general.push(it)
    else adv.push(it)
  })

  return { weak, general, adv }
})

const masteryBucketNames = computed(() => ({
  weak: sliceNames(masteryBuckets.value.weak),
  general: sliceNames(masteryBuckets.value.general),
  adv: sliceNames(masteryBuckets.value.adv),
}))

const chapterBucketNames = computed(() => ({
  weak: sliceNames(chapterBuckets.value.weak),
  general: sliceNames(chapterBuckets.value.general),
  adv: sliceNames(chapterBuckets.value.adv),
}))

// 进度条颜色：保证每行有稳定的颜色（随行索引循环）
const barPalette = ['#3b82f6', '#10b981', '#f97316', '#a855f7']

const formatRows = (items: MasteryTableItem[]) => {
  return (items || []).map((it, idx) => ({
    ...it,
    key: it.name,
    barColor: barPalette[idx % barPalette.length],
  }))
}

const masteryTableRows = computed(() => formatRows(props.mastery ?? []))
const chapterTableRows = computed(() => formatRows(props.chapters ?? []))
</script>

<style scoped lang="scss">
.panel-title {
  position: relative;
  color: #0f172a;
}

.buckets {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 14px;

  .bucket {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    border-radius: 12px;
    padding: 12px 12px;
    border: 1px solid transparent;

    .bucket-left {
      flex: 1;
      min-width: 0;

      .bucket-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 10px;

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
        }
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .chip {
          display: inline-flex;
          align-items: center;
          height: 26px;
          padding: 0 10px;
          border-radius: 10px;
          background: #ffffff;
          color: #475569;
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .chip-empty {
          color: rgba(100, 116, 139, 0.85);
          background: rgba(255, 255, 255, 0.6);
        }
      }
    }

    .bucket-right {
      flex: none;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      opacity: 0.55;
      align-self: center;
      white-space: nowrap;
    }

    &.bucket-weak {
      background-color: rgb(254 242 242 / 0.4);
      border-color: rgb(254 226 226 / 0.5);

      .bucket-right {
        color: #ef4444;
      }

      .dot-weak {
        background: #ef4444;

        + span {
          color: #ef4444;
        }
      }
    }

    &.bucket-general {
      background-color: rgb(255 247 237 / 0.4);
      border-color: rgb(255 237 213 / 0.5);

      .bucket-right {
        color: rgb(251 146 60);
      }

      .dot-general {
        background: #f97316;
        + span {
          color: #f97316;
        }
      }
    }

    &.bucket-adv {
      background-color: rgb(236 253 245 / 0.4);
      border-color: rgb(209 250 229 / 0.5);

      .bucket-right {
        color: rgb(52 211 153);
      }

      .dot-adv {
        background: #059669;
        + span {
          color: #059669;
        }
      }
    }
  }
}

.table {
  margin-top: 6px;
}

.table-ant {
  :deep(.ant-table-thead > tr > th) {
    background: transparent;
    padding: 14px 0 16px;
    color: rgba(100, 116, 139, 0.85);
    font-size: 12px;
  }
  :deep(.ant-table-tbody > tr > td) {
    padding: 18px 0;
  }

  :deep(.ant-table-tbody > tr:last-child > td) {
    border-bottom: 0;
  }

  :deep(.ant-table-placeholder) {
    background: transparent;
  }

  :deep(.ant-table-placeholder:hover > td) {
    background: transparent;
  }
}

.empty-ant {
  border-top: 0;
}

.td-rate {
  min-width: 0;
}

.rate-top {
  font-size: 13px;
  font-weight: 700;
  line-height: 20px;
  color: #1e293b;
}

.bar {
  position: relative;
  height: 4px;
  width: 100%;
  border-radius: 999px;
  background: rgb(241 245 249 / 0.8);
  overflow: hidden;
}

.fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: 999px;
}

.muted {
  color: rgba(148, 163, 184, 0.95);
}

.empty {
  padding: 14px 0;
  color: rgba(100, 116, 139, 0.8);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}
</style>
