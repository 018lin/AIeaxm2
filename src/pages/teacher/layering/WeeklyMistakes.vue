<script setup lang="ts">
import { listExamination } from '@/api/examination'
import TchPagination from '@/components/common/table/TchPagination.vue'
import {
  AppstoreOutlined,
  BarsOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  CloudDownloadOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  FormOutlined,
  InfoCircleOutlined,
  ReadOutlined,
  RedoOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { computed, onMounted, ref, watch } from 'vue'

const grades = ['全部年级', '一年级', '二年级', '三年级']
const subjects = ['全科', '数学', '语文', '英语']

const selectedGrade = ref('全部年级')
const selectedSubject = ref('全科')
const viewMode = ref<'card' | 'table'>('card')
const currentPage = ref(1)
const pageSize = ref(10)

const total = ref(0)
const listData = ref<any[]>([])

// --- Table Configuration ---
const columns = [
  { title: '任务名称', dataIndex: 'title', key: 'title', width: '35%' },
  { title: '年级/班级', dataIndex: 'gradeClass', key: 'gradeClass' },
  { title: '题量', key: 'questionCount', width: 100 },
  { title: '生成时间', dataIndex: 'date', key: 'date' },
  { title: '状态', key: 'status', width: 120 },
  { title: '操作', key: 'action', width: 150, align: 'right' },
]

const selectedRowKeys = computed({
  get: () => listData.value.filter(item => item.selected).map(item => item.id),
  set: keys => {
    listData.value.forEach(item => {
      item.selected = keys.includes(item.id)
    })
  },
})

const onSelectChange = (keys: number[]) => {
  selectedRowKeys.value = keys
}

function normalizeStatus(status: any) {
  return ['finalized', 'published', 'enabled', 1].includes(status) ? 'downloaded' : 'draft'
}

function formatDate(value: any) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toISOString().slice(0, 10)
}

async function fetchList() {
  try {
    const res = await listExamination({
      assignmentType: 'ERROR_QUESTION_PACK',
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      gradeName: selectedGrade.value === '全部年级' ? undefined : selectedGrade.value,
      subjectName: selectedSubject.value === '全科' ? undefined : selectedSubject.value,
    } as any)
    listData.value = (res?.list || []).map((item: any) => ({
      id: item.assignmentId || item.id,
      status: normalizeStatus(item.status),
      gradeClass: [item.gradeName, item.className || item.groupName].filter(Boolean).join(' '),
      title: item.assignmentName || '-',
      questionCount: Number(item.questionNumbers || 0),
      date: formatDate(item.createTime || item.updateTime),
      selected: false,
    }))
    total.value = Number(res?.total || 0)
  } catch (e: any) {
    listData.value = []
    total.value = 0
    message.error(e?.message || '获取错题周报记录失败')
  }
}

watch([currentPage, pageSize], () => {
  fetchList().catch(() => {})
})

watch([selectedGrade, selectedSubject], () => {
  currentPage.value = 1
  fetchList().catch(() => {})
})

onMounted(() => {
  fetchList().catch(() => {})
})
</script>

<template>
  <div class="flex-col h-full gap-lg">
    <!-- Header -->
    <div class="page-header flex items-center justify-between gap-12">
      <div class="flex flex-col">
        <h1 class="page-title mb-1 bold">错题周报记录</h1>
        <div class="page-subtitle text-sm flex items-center gap-xs">
          <InfoCircleOutlined />
          <span>默认筛选: 题量 10 | 统计周期: 周五至周四 | 错误率区间: 50%-80%</span>
        </div>
      </div>

      <div class="header-actions flex items-center gap-xs">
        <div class="view-mode-toggle">
          <button class="toggle-btn" :class="{ active: viewMode === 'card' }" @click="viewMode = 'card'">
            <AppstoreOutlined /> 卡片
          </button>
          <button class="toggle-btn" :class="{ active: viewMode === 'table' }" @click="viewMode = 'table'">
            <BarsOutlined /> 表格
          </button>
        </div>
        <button class="primary-btn flex items-center gap-xs"><CloudDownloadOutlined /> 批量下载</button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-panel app-surface p-20 flex flex-col gap-md">
      <!-- Grade Filter -->
      <div class="filter-row flex items-center gap-md">
        <span class="filter-label">年级筛选</span>
        <div class="filter-chips flex gap-xs">
          <button
            v-for="grade in grades"
            :key="grade"
            class="filter-chip"
            :class="{ active: selectedGrade === grade }"
            @click="selectedGrade = grade"
          >
            {{ grade }}
          </button>
        </div>
      </div>
      <!-- Subject Filter -->
      <div class="filter-row flex items-center gap-md">
        <span class="filter-label">学科筛选</span>
        <div class="filter-chips flex gap-xs">
          <button
            v-for="sub in subjects"
            :key="sub"
            class="filter-chip"
            :class="{ active: selectedSubject === sub }"
            @click="selectedSubject = sub"
          >
            {{ sub }}
          </button>
        </div>
      </div>
    </div>

    <!-- Content: Card View -->
    <div v-if="viewMode === 'card'" class="card-list flex-1 min-h-0 overflow-y-auto pr-2">
      <div class="grid-cards">
        <div
          v-for="item in listData"
          :key="item.id"
          class="task-card app-surface flex flex-col relative gap-12"
          :class="{ selected: item.selected }"
        >
          <!-- Card Header: Status & Checkbox -->
          <div class="card-head flex items-center justify-between mb-3">
            <span
              class="status-tag rounded-sm"
              :class="item.status === 'downloaded' ? 'status-success' : 'status-warning'"
            >
              {{ item.status === 'downloaded' ? '已下载' : '待定稿' }}
            </span>
            <a-checkbox v-model:checked="item.selected" />
          </div>

          <!-- Class Info -->
          <div class="class-info text-secondary text-xs mb-2 flex items-center gap-xs semibold">
            <ReadOutlined />
            {{ item.gradeClass }}
          </div>

          <!-- Title -->
          <div class="task-title bold text-lg mb-4 flex-1">
            {{ item.title }}
          </div>

          <!-- Meta -->
          <div class="card-meta flex gap-md text-xs mb-4">
            <span class="flex items-center gap-xs"><FileTextOutlined /> {{ item.questionCount }} 题</span>
            <span class="flex items-center gap-xs"><CalendarOutlined /> {{ item.date }}</span>
          </div>

          <div class="divider"></div>

          <!-- Actions -->
          <div class="card-actions flex items-center justify-between mt-auto pt-3 border-t border-light">
            <button class="primary-btn-light" v-if="item.status === 'downloaded'"><RedoOutlined /> 重新下载</button>
            <button class="btn-confirm-draft primary-btn" v-else><CheckCircleFilled /> 确认定稿</button>

            <div class="flex gap-xs">
              <button class="action-icon-btn"><FormOutlined /></button>
              <button class="action-icon-btn" v-if="item.status === 'downloaded'"><EyeOutlined /></button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content: Table View -->
    <div v-else class="table-card--primary table-wrap flex-1 min-h-0">
      <a-table
        :dataSource="listData"
        :columns="columns"
        :pagination="false"
        rowKey="id"
        :rowSelection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
        class="table--primary h-full"
        :scroll="{ y: 'calc(100vh - 350px)' }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'title'">
            <span class="bold">{{ record.title }}</span>
          </template>
          <template v-else-if="column.key === 'gradeClass'">
            <div class="flex items-center gap-xs text-secondary"><ReadOutlined /> {{ record.gradeClass }}</div>
          </template>
          <template v-else-if="column.key === 'status'">
            <span
              class="status-tag rounded-sm"
              :class="record.status === 'downloaded' ? 'status-success' : 'status-warning'"
            >
              {{ record.status === 'downloaded' ? '已下载' : '待定稿' }}
            </span>
          </template>
          <template v-else-if="column.key === 'action'">
            <div class="flex items-center justify-end gap-md text-tertiary">
              <a-tooltip :title="record.status === 'downloaded' ? '重新下载' : '确认定稿'">
                <DownloadOutlined v-if="record.status === 'downloaded'" class="action-icon hover:text-primary" />
                <CheckCircleOutlined v-else class="action-icon hover:text-primary" />
              </a-tooltip>
              <FormOutlined class="action-icon hover:text-primary" />
              <EyeOutlined v-if="record.status === 'downloaded'" class="action-icon hover:text-primary" />
            </div>
          </template>
          <template v-else-if="column.key === 'questionCount'">
            <span class="count-badge">{{ record.questionCount }} 题</span>
          </template>
        </template>
      </a-table>
    </div>

    <!-- Pagination -->
    <TchPagination v-model:current="currentPage" v-model:pageSize="pageSize" :total="total" />
  </div>
</template>

<style scoped lang="scss">
.page-header {
  flex-wrap: wrap;
}

.page-title {
  font-size: 22px;
  color: var(--color-text-primary);
  line-height: 30px;
  letter-spacing: 0.2px;
}

.page-subtitle {
  color: var(--color-text-secondary);
}

.header-actions {
  gap: 12px;
}

.filter-panel {
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
}

.filter-row {
  align-items: center;
}

.filter-label {
  color: var(--color-text-secondary);
  font-weight: 600;
  font-size: 14px;
  min-width: 64px;
}

.filter-chips {
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  padding: 6px 18px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  transition: all 0.2s;

  &:hover {
    color: var(--color-primary);
    border-color: var(--color-primary-soft);
    background: var(--color-bg-warm);
  }

  &.active {
    background: var(--color-primary);
    color: #fff;
    border-color: var(--color-primary);
    box-shadow: 0 4px 10px rgba(236, 122, 46, 0.3);
  }
}

.card-list {
  padding-top: 2px;
}

.grid-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.task-card {
  padding: 20px;
  transition:
    transform 0.2s,
    box-shadow 0.2s,
    border-color 0.2s,
    background-color 0.2s;
  border: 1px solid var(--color-border-light);
  border-radius: 16px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--td-shadow-xl);
    border-color: rgba(236, 122, 46, 0.28);
  }

  &.selected {
    border-color: rgba(236, 122, 46, 0.55);
    background: var(--color-bg-warm);
    box-shadow: 0 0 0 3px rgba(236, 122, 46, 0.1);
  }
}

.card-head {
  align-items: center;
}

.class-info {
  color: var(--color-review-gray-soft);
}

.status-tag {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  &.status-success {
    background: var(--color-hw-published-bg);
    color: var(--color-hw-published);
  }

  &.status-warning {
    background: var(--color-hw-processing-bg);
    color: var(--color-hw-processing);
  }
}

.task-title {
  line-height: 1.4;
  color: var(--color-text-primary);
  font-size: 18px;
}

.card-meta {
  color: var(--color-text-secondary);
}

.card-actions {
  border-color: var(--color-border-light);

  button {
    height: 32px;
  }
}

.btn-confirm-draft {
  height: 32px;

  &:hover {
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 6px 14px rgba(236, 122, 46, 0.18);
  }
}

.action-icon-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-light);
  cursor: pointer;
  transition:
    transform 0.15s,
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s;

  &:hover {
    background: var(--color-primary-bg-light);
    border-color: rgba(236, 122, 46, 0.22);
    color: var(--color-primary);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.border-light {
  border-color: var(--color-border-light);
}

.count-badge {
  background: var(--color-bg-primary);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.action-icon {
  font-size: 16px;
  cursor: pointer;
  transition: color 0.2s;
}

.view-mode-toggle {
  display: flex;
  padding: 4px;
  background: var(--app-surface);
  border-radius: 12px;
  gap: 4px;

  .toggle-btn {
    flex: 1;
    height: 32px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0 12px;

    &:hover {
      color: var(--color-primary);
      background: var(--color-bg-primary);
    }

    &.active {
      background: var(--color-primary);
      color: #fff;
      border-color: var(--color-primary);
      box-shadow: 0 2px 6px rgba(230, 126, 34, 0.25);
    }
  }
}

.table-wrap {
  padding: 0;
  border: none;
  background: transparent;
}

.table-wrap :deep(.ant-table) {
  background: transparent;
}

:deep(.ant-checkbox-checked .ant-checkbox-inner) {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}
:deep(.ant-checkbox-wrapper:hover .ant-checkbox-inner),
:deep(.ant-checkbox:hover .ant-checkbox-inner) {
  border-color: var(--color-primary-hover);
}

:deep(.ant-pagination-item-active) {
  border-color: var(--color-primary);
  background: var(--color-primary);
  a {
    color: #fff;
  }
  &:hover {
    border-color: var(--color-primary-hover);
    background: var(--color-primary-hover);
    a {
      color: #fff;
    }
  }
}
:deep(.ant-pagination-item:hover) {
  border-color: var(--color-primary);
}
:deep(.ant-pagination-item:hover a) {
  color: var(--color-primary);
}
:deep(.ant-pagination-prev:hover .ant-pagination-item-link),
:deep(.ant-pagination-next:hover .ant-pagination-item-link) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

@media (max-width: 960px) {
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .grid-cards {
    grid-template-columns: 1fr;
  }
}
</style>
