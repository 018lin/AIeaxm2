<template>
  <div class="ms-page">
    <div class="ms-head">
      <div class="sub-content-head">
        <div>
          <div class="title-main">消灭错题统计</div>
          <div class="title-sub">实时监控学生学习进度与错题消灭情况</div>
        </div>
      </div>

      <div class="ms-head-right">
        <div class="ms-legend" aria-label="图例">
          <span class="ms-pill"><i class="dot is-destroy" />消灭错题量</span>
          <span class="ms-pill"><i class="dot is-redo" />重做错题量</span>
          <span class="ms-pill"><i class="dot is-wrong" />总错题量</span>
          <span class="ms-pill"><i class="dot is-total" />总答题量</span>
        </div>

        <button type="button" class="ms-monitor" @click="openMonitor">
          <Icon icon="material-symbols-light:bolt" width="18" height="18" />
          错题班级 细分监控
        </button>
      </div>
    </div>

    <div class="ms-table table-card--primary">
      <a-table :columns="columns" :data-source="pagedRows" :pagination="false" row-key="id" class="table--primary">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="ms-name">{{ record.name }}</div>
          </template>

          <template v-else-if="column.key === 'wrongTotal'">
            <div class="ms-num is-wrong">{{ record.wrongTotal }}</div>
          </template>

          <template v-else-if="column.key === 'answerTotal'">
            <div class="ms-num is-total">{{ record.answerTotal }}</div>
          </template>

          <template v-else-if="column.key === 'progress'">
            <div class="ms-progress">
              <span class="ms-progress-seg is-destroy" :style="{ width: record.progress.destroyPct + '%' }" />
              <span class="ms-progress-seg is-redo" :style="{ width: record.progress.redoPct + '%' }" />
              <span class="ms-progress-seg is-wrong" :style="{ width: record.progress.wrongPct + '%' }" />
            </div>
          </template>

          <template v-else-if="column.key === 'ops'">
            <a-button size="small" class="ms-op primary" @click="openDetail(record)">错题详情</a-button>
          </template>
        </template>
      </a-table>

      <TchPagination v-model:current="current" v-model:pageSize="pageSize" :total="filtered.length" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { getMistakeStudentStatistics } from '@/api/mistakes'
import TchPagination from '@/components/common/table/TchPagination.vue'
import router from '@/router'
import { ROUTES } from '@/router/routes'
import type { StudentRow } from '@/types/mistakes/list'
import { Icon } from '@iconify/vue'
import { message } from 'ant-design-vue'
import { computed, onMounted, ref } from 'vue'

const rows = ref<StudentRow[]>([])
const pageSize = ref(10)
const current = ref(1)

const filtered = computed(() => rows.value)

const pagedRows = computed(() => {
  const start = (current.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

const columns = [
  { title: '姓名', key: 'name', dataIndex: 'name', width: 120 },
  { title: '消灭错题（道）', key: 'destroy', dataIndex: 'destroy', width: 140 },
  { title: '重做错题（道）', key: 'redo', dataIndex: 'redo', width: 140 },
  { title: '总错题（道）', key: 'wrongTotal', dataIndex: 'wrongTotal', width: 120 },
  { title: '总答题（道）', key: 'answerTotal', dataIndex: 'answerTotal', width: 120 },
  { title: '闯关进度', key: 'progress', width: 300 },
  { title: '操作', key: 'ops', width: 120 },
]

const openDetail = (row: StudentRow) => {
  // router.push({
  //   name: 'teacher_mistakes_detail',
  //   params: { studentId: row.id },
  // })

  const path = ROUTES.TEACHER_MISTAKES_DETAIL.replace(':id', String(row.id))
  router.push(path).catch(() => {})
}

const openMonitor = () => {
  message.info('错题班级细分监控')
}

async function fetchRows() {
  try {
    rows.value = await getMistakeStudentStatistics()
  } catch (e: any) {
    rows.value = []
    message.error(e?.message || '获取错题统计失败')
  }
}

onMounted(() => {
  fetchRows().catch(() => {})
})
</script>

<style scoped lang="scss">
.ms-page {
  margin: 0 auto;
  display: grid;
  gap: 14px;
}

.ms-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 8px 0;
}

.ms-head-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.ms-legend {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(17, 24, 39, 0.06);
  box-shadow: 0 6px 18px rgba(17, 24, 39, 0.04);
}

.ms-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(248, 247, 246, 0.95);
  border: 1px solid rgba(240, 234, 229, 1);
  font-size: 12px;
  font-weight: 700;
  color: rgba(71, 85, 105, 0.75);
  white-space: nowrap;
}

.ms-pill .dot {
  width: 8px;
  height: 8px;
  border-radius: 99px;
  display: inline-block;
}

.ms-pill .dot.is-destroy {
  background: rgba(20, 184, 166, 0.95);
}

.ms-pill .dot.is-redo {
  background: rgba(34, 197, 94, 0.95);
}

.ms-pill .dot.is-wrong {
  background: rgba(248, 113, 113, 0.95);
}

.ms-pill .dot.is-total {
  background: rgba(236, 122, 46, 0.95);
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(-25%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: none;
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

.ms-monitor {
  height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: rgb(225 29 72 / var(--tw-text-opacity, 1));
  background: rgba(255, 241, 242, 1);
  border: 1px solid rgb(255 228 230 / 1);
  display: flex;
  align-items: center;
  gap: 4px;
  animation: bounce 1s infinite;
}

.ms-table {
  background: rgba(255, 255, 255, 1);
}

.ms-name {
  font-weight: 700;
  color: rgba(17, 24, 39, 0.92);
}

.ms-num {
  font-weight: 700;
}

.ms-num.is-wrong {
  color: rgba(248, 113, 113, 1);
}

.ms-num.is-total {
  color: rgba(236, 122, 46, 1);
}

.ms-progress {
  height: 8px;
  border-radius: 999px;
  background: rgba(240, 234, 229, 1);
  overflow: hidden;
  display: flex;
}

.ms-progress-seg {
  height: 100%;
}

.ms-progress-seg.is-destroy {
  background: rgba(20, 184, 166, 0.95);
}

.ms-progress-seg.is-redo {
  background: rgba(34, 197, 94, 0.95);
}

.ms-progress-seg.is-wrong {
  background: rgba(248, 113, 113, 0.95);
}

.ms-footer {
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: rgba(255, 255, 255, 1);
}

@media (max-width: 960px) {
  .ms-head {
    flex-direction: column;
    align-items: stretch;
  }

  .ms-head-right {
    justify-content: flex-start;
  }

  .ms-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
