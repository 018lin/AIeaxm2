<template>
  <div class="rc-page flex-col">
    <div class="rc-head app-surface flex-center">
      <div class="rc-head-left">
        <div class="rc-title">{{ title }}</div>
        <div class="rc-sub">{{ subTitle }}</div>
      </div>
      <div class="rc-head-right">
        <RangePicker @getList="handleFilter" />
        <a-select
          v-if="props.isClass"
          placeholder="请选择班级"
          style="width: 120px"
          v-model:value="classId"
          class="table-top-select"
          @change="changeClassId"
        >
          <a-select-option value="all">全部班级</a-select-option>
          <a-select-option v-for="item in classList" :key="item.classId" :value="item.classId">
            {{ item.className }}
          </a-select-option>
        </a-select>
        <a-select v-model:value="state" placeholder="请选择状态" @change="changeState" style="width: 120px">
          <a-select-option value="all">全部状态</a-select-option>
          <a-select-option value="draft">未定稿</a-select-option>
          <a-select-option value="finalized">已定稿</a-select-option>
        </a-select>
        <button type="button" class="primary-btn" @click="$emit('create')">
          <span class="rc-plus">+</span>
          新增组卷
        </button>
      </div>
    </div>

    <div ref="tableWrapRef" class="rc-table table-card--primary" v-if="dataSource.length">
      <a-table
        :columns="columns"
        :data-source="dataSource"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1000, y: tableScrollY }"
        class="table--primary"
      >
        <template #bodyCell="scope">
          <slot name="bodyCell" v-bind="scope"></slot>
        </template>
      </a-table>
      <TchPagination
        v-model:current="currentPage"
        v-model:pageSize="currentPageSize"
        :total="total"
        @change="handlePageChange"
      />
    </div>

    <div class="rc-empty app-surface" v-else>
      <a-empty :image="simpleImage" description="暂无数据" />
    </div>

    <ViewPaperModal v-model:open="currentViewPaperOpen" :preview-url="previewUrl" />
  </div>
</template>

<script setup lang="ts">
import RangePicker from '@/components/common/table/RangePicker.vue'
import TchPagination from '@/components/common/table/TchPagination.vue'
import ViewPaperModal from '@/components/common/ViewPaperModal.vue'
import { getUserBaseInfo } from '@/services/storage'
import useAntdTableScrollY from '@/utils/useAntdTableScrollY'
import { Empty } from 'ant-design-vue'
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    subTitle: string
    columns: any[]
    dataSource: any[]
    total?: number
    page?: number
    pageSize?: number
    previewUrl?: string
    viewPaperOpen?: boolean
    isClass?: boolean
  }>(),
  {
    total: 0,
    page: 1,
    pageSize: 10,
    previewUrl: '',
    viewPaperOpen: false,
    isClass: false,
  }
)

const emit = defineEmits<{
  (e: 'update:page', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'update:viewPaperOpen', value: boolean): void
  (e: 'search', params: any): void
  (e: 'create'): void
  (e: 'pageChange'): void
}>()

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE

const state = ref('all')
const classId = ref<string>('all')
const parsedUserInfo = getUserBaseInfo()
const classList = ref(parsedUserInfo?.classInfoList || []) // 班级列表

const tableWrapRef = ref<HTMLElement | null>(null)
const { scrollY: tableScrollY } = useAntdTableScrollY(tableWrapRef, {
  mode: 'container',
  minY: 160,
  subtractSelectors: ['.tch-table-footer', '.ant-table-thead'],
  subtractPadding: false,
})

const currentPage = computed({
  get: () => props.page,
  set: val => emit('update:page', val),
})

const currentPageSize = computed({
  get: () => props.pageSize,
  set: val => emit('update:pageSize', val),
})

const currentViewPaperOpen = computed({
  get: () => props.viewPaperOpen,
  set: val => emit('update:viewPaperOpen', val),
})
const handleFilter = (params: any) => {
  emit('search', params)
}

const changeState = (value: string) => {
  handleFilter({ status: value === 'all' ? undefined : value })
}

const changeClassId = (value: string) => {
  handleFilter({ classId: value === 'all' ? undefined : value })
}

const handlePageChange = () => {
  emit('pageChange')
}
</script>

<style scoped lang="scss">
.rc-page {
  gap: 14px;
  height: 100%;

  .rc-head {
    padding: 16px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    flex-shrink: 0;

    .rc-head-left {
      min-width: 0;

      .rc-title {
        font-size: 18px;
        font-weight: 700;
        color: rgba(17, 24, 39, 0.9);
        letter-spacing: 0.2px;
      }

      .rc-sub {
        margin-top: 6px;
        font-size: 12px;
        font-weight: 700;
        color: rgba(17, 24, 39, 0.45);
      }
    }

    .rc-head-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
  }

  .rc-table {
    flex: 1;

    :deep(.ant-table-wrapper) {
      flex: 1;
      min-height: 0;

      .ant-spin-nested-loading {
        height: 100%;

        .ant-spin-container {
          height: 100%;
          display: flex;
          flex-direction: column;

          .ant-table {
            flex: 1;
            overflow: hidden;

            .ant-table-container {
              height: 100%;
              display: flex;
              flex-direction: column;

              .ant-table-header {
                flex: 0 0 auto;
              }

              .ant-table-body {
                flex: 1;
                overflow-y: auto !important;
                min-height: 0;
              }
            }
          }
        }
      }
    }
  }

  .rc-empty {
    width: 100%;
    height: 700px;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (max-width: 1180px) {
    .rc-head {
      flex-direction: column;
      align-items: stretch;

      .rc-head-right {
        .rc-create {
          width: 100%;
          justify-content: center;
        }
      }
    }
  }
}
</style>
