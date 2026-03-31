<template>
  <div class="composition-list flex-col h-full">
    <!-- 顶部筛选栏 -->
    <div class="filter-bar flex-between mb-20 flex-wrap gap-md app-surface p-20">
      <div class="filter-left flex flex-wrap gap-lg">
        <div class="filter-item flex-col">
          <span class="input-label">新建/修改日期</span>
          <a-range-picker v-model:value="dateRange" class="w-240" :placeholder="['2026-01-01', '现在']" />
        </div>
        <div class="filter-item flex-col">
          <span class="input-label">搜索关键词</span>
          <a-input v-model:value="keyword" placeholder="输入主题关键字..." class="w-240 search-input" allow-clear>
            <template #prefix>
              <SearchOutlined class="text-secondary" />
            </template>
          </a-input>
        </div>
      </div>
      <div class="filter-right">
        <a-button type="primary" class="btn-create primary-btn" @click="gotoCreate">
          <template #icon><PlusOutlined /></template>
          新建作文主题
        </a-button>
      </div>
    </div>

    <!-- 列表表格 -->
    <div class="table-container table-card--primary">
      <a-table :columns="columns" :data-source="pagedData" :pagination="false" row-key="id" class="table--primary">
        <template #bodyCell="{ column, record, index }">
          <!-- 序号 -->
          <template v-if="column.key === 'serial'">
            <span class="serial-no">{{ String(index + 1).padStart(2, '0') }}</span>
          </template>

          <!-- 主题 -->
          <template v-if="column.key === 'title'">
            <span class="title-text">{{ record.title }}</span>
          </template>

          <!-- 创建人 -->
          <template v-if="column.key === 'creator'">
            <div class="creator-info flex items-center gap-sm">
              <a-avatar size="small" class="creator-avatar">{{ record.avatar }}</a-avatar>
              <span class="creator-name">{{ record.creator }}</span>
            </div>
          </template>

          <!-- 操作 -->
          <template v-if="column.key === 'action'">
            <div class="action-buttons flex justify-end align-center gap-sm">
              <a-button type="text" size="small" class="btn-icon">
                <EyeOutlined />
              </a-button>
              <a-button type="text" size="small" class="btn-icon">
                <EditOutlined />
              </a-button>
              <a-button type="text" size="small" class="btn-icon">
                <MoreOutlined />
              </a-button>
            </div>
          </template>
        </template>
      </a-table>
      <TchPagination v-model:current="current" :page-size="pageSize" :total="filteredData.length" />
    </div>
  </div>
</template>

<script setup lang="ts">
import TchPagination from '@/components/common/table/TchPagination.vue'
import { compositionMock } from '@/config/mock/composition'
import { ROUTES } from '@/router/routes'
import { EditOutlined, EyeOutlined, MoreOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons-vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 状态定义
const dateRange = ref([])
const keyword = ref('')
const current = ref(1)
const pageSize = ref(10)

// 表格列定义
const columns = [
  { title: '序号', key: 'serial', width: 80, align: 'center' },
  { title: '新建/修改时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '作文主题', dataIndex: 'title', key: 'title' },
  { title: '创建人', dataIndex: 'creator', key: 'creator', width: 150 },
  { title: '操作', key: 'action', width: 150 },
]

// 计算过滤后的数据
const filteredData = computed(() => {
  let result = compositionMock.rows

  if (keyword.value) {
    const k = keyword.value.toLowerCase()
    result = result.filter((item: { title: string }) => item.title.toLowerCase().includes(k))
  }

  return result
})

const pagedData = computed(() => {
  const start = (current.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const gotoCreate = () => {
  router.push(ROUTES.TEACHER_COMPOSITION_CREATE).catch(() => {})
}
</script>

<style lang="scss" scoped>
.composition-list {
  //   background-color: var(--color-bg-surface);

  .search-input {
    :deep(.ant-input-affix-wrapper) {
      border-radius: 20px;
      padding-left: 12px;
      padding-right: 12px;
      border-color: var(--color-border);
      box-shadow: none;
      transition: all 0.3s;

      &:hover,
      &:focus-within {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px rgba(var(--td-accent-rgb), 0.1);
      }
    }
  }

  .table-container {
    .serial-no {
      color: var(--color-text-secondary);
    }

    .title-text {
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .creator-info {
      .creator-avatar {
        background-color: var(--color-bg-primary);
        color: var(--color-text-secondary);
        font-size: 12px;
      }
    }
  }
}

.w-240 {
  width: 240px;
}
</style>
