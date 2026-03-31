<template>
  <div class="layer-settings-page">
    <!-- 顶部导航 -->
    <header class="page-header">
      <div class="header-left">
        <a-button type="primary" :icon="h(LeftOutlined)" @click="router.back()">返回</a-button>
        <h1 class="title">{{ layerSettingInfo.gradeName }}</h1>
        <h1 class="title">{{ className }}</h1>
        <h1 class="title">{{ layerSettingInfo.subjectName }}</h1>
      </div>
      <a-button type="primary" class="add-strategy-btn" @click="openAdd(null)" v-if="distributionMode === 'auto'">
        <Icon icon="mdi:plus" />
        新增策略
      </a-button>
    </header>

    <!-- 控制栏 -->
    <div class="distribution-mode">
      <span class="label">分配方式：</span>
      <a-radio-group v-model:value="distributionMode" @change="changeDistribution">
        <a-radio value="manual">手动分配</a-radio>
        <a-radio value="auto">自动分配</a-radio>
      </a-radio-group>
    </div>

    <!-- 策略卡片 -->
    <div class="strategy-card-box" v-if="layersData.length">
      <div class="strategy-card app-surface table-card--primary" v-for="item in layersData" :key="item.id">
        <!-- 策略头部 -->
        <div class="card-header">
          <div class="strategy-info">
            <span class="strategy-tag">{{ item.strategyName }}</span>
            <div
              class="date-range flex items-center"
              v-if="distributionMode === 'auto' && item.effectiveStart && item.effectiveEnd"
            >
              作业采集时间：
              <span class="date-text">
                {{ item.effectiveStart ? formatTimestamp(item.effectiveStart, 'YYYY-MM-DD') : '' }} ~
                {{ item.effectiveEnd ? formatTimestamp(item.effectiveEnd, 'YYYY-MM-DD') : '' }}
              </span>
            </div>
          </div>
          <div class="status-switch">
            <span class="label">当前状态</span>
            <a-switch v-model:checked="item.isActive" checked-children="启用" un-checked-children="禁用" />
            <a-button type="primary" :icon="h(EditOutlined)" @click="openAdd(item)">编辑策略</a-button>
          </div>
        </div>

        <!-- 表格区域 -->
        <a-table
          :columns="columns"
          :data-source="item.studentGroupVOS"
          :pagination="false"
          :row-key="(record: any) => record.id"
          class="strategy-table"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'groupName'">
              <span class="layer-badge" :class="record.groupCode">{{ record.groupName }}</span>
            </template>
            <template v-if="column.key === 'studentDetailList'">
              <div class="student-chips">
                <span v-for="stu in record.studentDetailList" :key="stu.studentUserId" class="stu-chip">{{
                  stu.studentName
                }}</span>
              </div>
            </template>
            <template v-if="column.key === 'mistakeRate'">
              <span class="rate-text">{{ record.mistakeRate }}%</span>
            </template>
            <template v-if="column.key === 'strategy'">
              <div class="strategy-inputs">
                <span class="rate-text">{{ record.minRate }}%</span>
                <span class="separator">≤ 正确率 ≤</span>
                <span class="rate-text">{{ record.maxRate }}%</span>
                <span class="desc">的学生进入</span>
              </div>
            </template>

            <template v-if="column.key === 'action'">
              <a-button class="disabled-edit-btn" v-if="isEditDisabled(item)"> 编辑分层 </a-button>
              <a-button type="primary" class="edit-btn" @click="openEditStrategy(record, item)" v-else>
                编辑分层
              </a-button>
            </template>
          </template>
        </a-table>
      </div>
    </div>

    <!-- 空数据 -->
    <div v-if="!layersData.length" class="empty-data">
      <a-empty :image="simpleImage" description="暂无数据" />
    </div>

    <!-- 分页 -->
    <div class="pagination-box" v-if="layersData.length">
      <TchPagination v-model:current="pageNo" v-model:pageSize="pageSize" :total="total" @change="getLayerData" />
    </div>

    <!-- 新增/编辑 策略弹窗 -->
    <LayerSettings
      :open="addOpen"
      :type="distributionMode"
      :info="editInfo"
      :layerSettingInfo="layerSettingInfo"
      @close="closeAdd"
      @getList="getLayerData"
    />

    <!-- 编辑分层策略弹窗 -->
    <LayerSettingsStrategy
      :open="addStrategyOpen"
      :info="editStrategyInfo"
      :studentList="studentList"
      :layerSettingInfo="layerSettingInfo"
      @close="closeEditStrategy"
      @getList="getLayerData"
    />
  </div>
</template>

<script setup lang="ts">
import { createStrategy, getStrategyList } from '@/api/layering/index'
import type { StrategyListItem } from '@/api/layering/type'
import { getStudentListAll } from '@/api/school/index'
import type { StudentItem } from '@/api/school/type'
import TchPagination from '@/components/common/table/TchPagination.vue'
import LayerSettings from '@/components/school/LayerSettings.vue'
import LayerSettingsStrategy from '@/components/school/LayerSettingsStrategy.vue'
import { getUserBaseInfo } from '@/services/storage'
import { decrypt } from '@/utils/crypto'
import { formatTimestamp } from '@/utils/time'
import { EditOutlined, LeftOutlined } from '@ant-design/icons-vue'
import { Icon } from '@iconify/vue'
import { Empty } from 'ant-design-vue'
import { computed, h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE

// 路由
const router = useRouter()
const route = useRoute()

// 基础状态
const parsedUserInfo = getUserBaseInfo()
const classList = ref(parsedUserInfo?.classInfoList || []) // 班级列表
const distributionMode = ref('auto') // 分配方式
const layersData = ref<StrategyListItem[]>([]) // 分层策略列表
const pageNo = ref(1)
const pageSize = ref(4)
const total = ref(0)
const studentList = ref<StudentItem[]>([]) // 学生列表
// 策略状态
const addOpen = ref(false) // 新增策略弹窗状态
const editInfo = ref<Record<string, any> | null>(null) // 编辑策略信息
const editStrategyInfo = ref<StrategyListItem | undefined>(undefined) // 编辑策略信息
// 分层状态
const addStrategyOpen = ref(false) // 新增分层策略弹窗状态
const layerSettingInfo = ref<Record<string, any>>({}) // 层级设置信息

// 计算属性-班级名称
const className = computed(() => {
  const foundClass = classList.value.find((item: any) => item.classId === layerSettingInfo.value.classId)
  return foundClass?.className || ''
})
const columns = [
  { title: '分层名称', key: 'groupName', width: 120 },
  { title: '学生名单', key: 'studentDetailList' },
  { title: '共性错题率', key: 'mistakeRate', width: 150 },
  { title: '分配策略', key: 'strategy', width: 300 },
  { title: '操作', key: 'action', width: 120 },
]

// 判断编辑按钮是否禁用
const isEditDisabled = (strategyItem: StrategyListItem) => {
  // 自动分配模式下，如果没有设置时间范围则禁用
  if (distributionMode.value === 'auto') {
    return !strategyItem.effectiveStart || !strategyItem.effectiveEnd
  }
  return false
}

// 打开编辑分层策略弹窗
const openEditStrategy = (record: any, strategyItem: StrategyListItem) => {
  editStrategyInfo.value = {
    ...record,
    strategyId: strategyItem.id,
  }
  addStrategyOpen.value = true
}
// 关闭编辑分层策略弹窗
const closeEditStrategy = () => {
  addStrategyOpen.value = false
  editStrategyInfo.value = undefined
}

// 打开新增策略弹窗
const openAdd = (item: Record<string, any> | null = null) => {
  editInfo.value = item
  addOpen.value = true
}
// 关闭新增策略弹窗
const closeAdd = () => {
  addOpen.value = false
  editInfo.value = null
}

// 切换分配方式
const changeDistribution = (mode: string) => {
  if (mode !== distributionMode.value) {
    getLayerData()
  }
}

// 获取分层策略列表
const getLayerData = async () => {
  const params = {
    gradeId: layerSettingInfo.value.gradeId,
    classId: layerSettingInfo.value.classId,
    subjectId: layerSettingInfo.value.subjectId,
    pageNo: pageNo.value,
    pageSize: pageSize.value,
    type: distributionMode.value,
  }
  const res = await getStrategyList(params)
  if (res.list && res.list.length === 0) {
    addStrategy()
  } else {
    layersData.value = res.list || []
    total.value = res.total || 0
  }
}

// 新增策略
const addStrategy = async () => {
  const params = {
    gradeId: layerSettingInfo.value.gradeId,
    classId: layerSettingInfo.value.classId,
    subjectId: layerSettingInfo.value.subjectId,
    type: 'all',
  }
  const res = await createStrategy(params)
  if (res) {
    getLayerData()
  }
}

// 获取学生列表
const getStudentData = async () => {
  const params = {
    classId: layerSettingInfo.value.classId,
    gradeId: layerSettingInfo.value.gradeId,
  }
  const res = await getStudentListAll(params)
  studentList.value = res || []
}

onMounted(() => {
  // 从路由参数获取信息
  const data = route.query.data as string
  if (data) {
    layerSettingInfo.value = JSON.parse(decrypt(data))
    getLayerData()
  }
  getStudentData()
})
</script>

<style scoped lang="scss">
.layer-settings-page {
  height: 100%;
  width: 1280px;
  margin: 0 auto;

  .edit-btn {
    padding: 5px 12px;
    color: #fff;
    cursor: pointer;
  }
  .disabled-edit-btn {
    cursor: not-allowed;
    background: #f5f5f5;
    color: #b8b8b8;
    &:hover {
      background: #f5f5f5;
      color: #b8b8b8;
    }
  }
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgb(250 249 248);
  height: 40px;
  margin-bottom: 20px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .title {
      font-size: 20px;
      font-weight: bold;
      margin: 0;
      color: #333;
    }
  }

  .add-strategy-btn {
    background-color: #ff7d00;
    border-color: #ff7d00;
    border-radius: 99px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 24px;
    height: 40px;
    font-weight: 600;
    box-shadow: 0 4px 10px rgba(255, 125, 0, 0.3);
    font-size: 15px;

    &:hover {
      background-color: #ff9533;
      border-color: #ff9533;
      box-shadow: 0 6px 12px rgba(255, 125, 0, 0.4);
    }
  }
}

/* Controls Bar */
.distribution-mode {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #666;
  height: 25px;
  margin-bottom: 20px;

  .label {
    font-size: 14px;
  }

  :deep(.ant-radio-wrapper) {
    margin-right: 16px;
    span.ant-radio + * {
      padding-left: 8px;
      padding-right: 8px;
    }
  }

  :deep(.ant-radio-checked .ant-radio-inner) {
    border-color: #ff7d00;
    background-color: #ff7d00;
  }
}

/* Strategy Card */
.strategy-card-box {
  max-height: calc(100% - 177px);
  overflow-y: auto;
  .strategy-card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    color: var(--warm-gray-text);
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      background: rgb(250 249 248);
      border-bottom: 1px solid rgb(245 242 238);

      .strategy-info {
        display: flex;
        align-items: center;
        gap: 16px;

        .strategy-tag {
          background-color: #fff3e0;

          border: 1px solid rgb(255 237 213);
          color: var(--td-accent);
          padding: 6px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .date-text {
          font-size: 14px;
          color: #4a443e;
          padding-left: 5px;

          .edit-icon {
            cursor: pointer;
            color: #999;
            font-size: 16px;
            &:hover {
              color: #666;
            }
          }
        }
      }

      .status-switch {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 12px;

        :deep(.ant-switch-checked) {
          background-color: #ff7d00;
        }
      }
    }
  }
}

.empty-data {
  width: 100%;
  height: calc(100% - 177px);
  display: flex;
  justify-content: center;
  align-items: center;
}

.pagination-box {
  margin-top: 20px;
}

/* Table Styles */
:deep(.strategy-table) {
  .ant-table-thead > tr > th {
    background: rgb(250, 249, 248);
    color: #999;
    font-size: 12px;
    font-weight: 500;
    padding: 20px 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  .ant-table-tbody > tr > td {
    padding: 24px 16px;
    vertical-align: top;
  }
}

/* Column Specific Styles */
.layer-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
  min-width: 60px;
  letter-spacing: 0.5px;
  text-align: center;

  &.basic {
    color: var(--color-info);
    background-color: var(--color-info-bg);
  }
  &.middle {
    background: rgba(var(--td-green), 0.12);
    color: rgba(22, 163, 74, 1);
  }
  &.high {
    background: #fde8e8;
    color: #f15959;
  }
}

.student-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .stu-chip {
    border: 1px solid var(--warm-border);
    padding: 6px 16px;
    border-radius: 8px;
    font-size: 12px;
    color: var(--warm-gray-text);
    background: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  }
}

.rate-text {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

/* Footer */
.page-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #999;
  font-size: 12px;
  padding: 0 4px;

  .last-updated {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .sync-status {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #52c41a;

    .dot {
      width: 6px;
      height: 6px;
      background: #52c41a;
      border-radius: 50%;
    }
  }
}
</style>
