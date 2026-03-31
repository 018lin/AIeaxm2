<template>
  <a-modal :open="open" width="650px" :footer="null" @cancel="closeVisible">
    <div class="form-list">
      <div class="form-header">{{ info ? '编辑策略' : '新增策略' }}</div>
      <div class="form-item app-surface">
        <p class="form-label">策略名称：</p>
        <a-input v-model:value="strategyName" placeholder="请输入策略名称" style="height: 44px" />
      </div>
      <div class="form-item app-surface" v-if="type === 'auto'">
        <p class="form-label">作业采集时间：</p>
        <a-range-picker
          v-model:value="dateRange"
          :placeholder="['开始时间', '结束时间']"
          @change="changeDate"
          allowClear
        />
      </div>
      <div class="form-item form-strategy app-surface">
        <p class="form-label">分配策略：</p>
        <div class="strategy-list">
          <div class="strategy-item">
            <span class="strategy-item-label basic">{{ basicValue.groupName }}</span>
            <a-input-number
              id="inputNumber"
              v-model:value="basicValue.basicMin"
              :max="100"
              :min="1"
              :precision="0"
              :step="1"
            />
            <span>% ≤ 正确率 ≤</span>
            <a-input-number
              id="inputNumber"
              v-model:value="basicValue.basicMax"
              :max="100"
              :min="1"
              :precision="0"
              :step="1"
            />
            <span>%的学生自动进入</span>
          </div>
          <div class="strategy-item">
            <span class="strategy-item-label middle">{{ middleValue.groupName }}</span>
            <a-input-number
              id="inputNumber"
              v-model:value="middleValue.middleMin"
              :max="100"
              :min="1"
              :precision="0"
              :step="1"
            />
            <span>% ≤ 正确率 ≤</span>
            <a-input-number
              id="inputNumber"
              v-model:value="middleValue.middleMax"
              :max="100"
              :min="1"
              :precision="0"
              :step="1"
            />
            <span>%的学生自动进入</span>
          </div>
          <div class="strategy-item">
            <span class="strategy-item-label high">{{ highValue.groupName }}</span>
            <a-input-number
              id="inputNumber"
              v-model:value="highValue.highMin"
              :max="100"
              :min="1"
              :precision="0"
              :step="1"
            />
            <span>% ≤ 正确率 ≤</span>
            <a-input-number
              id="inputNumber"
              v-model:value="highValue.highMax"
              :max="100"
              :min="1"
              :precision="0"
              :step="1"
            />
            <span>%的学生自动进入</span>
          </div>
        </div>
      </div>
      <div class="form-btn">
        <a-button class="default-btn" @click="closeVisible">取消</a-button>
        <a-button class="primary-btn" type="primary" @click="handleSave">保存</a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { createStrategy, updateStrategy } from '@/api/layering/index'
import type { StrategyListItem } from '@/api/layering/type'
import { formatTimestamp } from '@/utils/time'
import dayjs, { type Dayjs } from 'dayjs'
import { reactive, ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  layerSettingInfo: Record<string, any>
  type: string
  info?: StrategyListItem | null
}>()

const emit = defineEmits<{
  close: []
  getList: []
}>()

const strategyName = ref<string>('')
const dateRange = ref<[Dayjs, Dayjs] | null>(null)
const effectiveStart = ref<string>('')
const effectiveEnd = ref<string>('')
const basicValue = reactive({
  groupName: '基础层',
  basicMin: 0,
  basicMax: 0,
})
const middleValue = reactive({
  groupName: '提高层',
  middleMin: 0,
  middleMax: 0,
})
const highValue = reactive({
  groupName: '拓展层',
  highMin: 0,
  highMax: 0,
})

// 切换时间
const changeDate = (date: [Dayjs, Dayjs], dateString: [string, string]) => {
  dateRange.value = date
  effectiveStart.value = dateString[0]
  effectiveEnd.value = dateString[1]
}

// 关闭弹窗
const closeVisible = () => {
  strategyName.value = ''
  dateRange.value = null
  effectiveStart.value = ''
  effectiveEnd.value = ''
  basicValue.basicMin = 0
  basicValue.basicMax = 0
  middleValue.middleMin = 0
  middleValue.middleMax = 0
  highValue.highMin = 0
  highValue.highMax = 0
  emit('close')
}

// 保存
const handleSave = async () => {
  if (props.info) {
    const params = {
      strategyName: strategyName.value,
      effectiveStart: effectiveStart.value,
      effectiveEnd: effectiveEnd.value,
      basicMin: basicValue.basicMin,
      basicMax: basicValue.basicMax,
      middleMin: middleValue.middleMin,
      middleMax: middleValue.middleMax,
      highMin: highValue.highMin,
      highMax: highValue.highMax,
      strategyId: props.info.strategyId,
    }
    const res = await updateStrategy(params)
    if (res) {
      emit('getList')
    }
  } else {
    const params = {
      gradeId: props.layerSettingInfo.gradeId,
      classId: props.layerSettingInfo.classId,
      subjectId: props.layerSettingInfo.subjectId,
      type: props.type,
      strategyName: strategyName.value,
      effectiveStart: effectiveStart.value,
      effectiveEnd: effectiveEnd.value,
      basicMin: basicValue.basicMin,
      basicMax: basicValue.basicMax,
      middleMin: middleValue.middleMin,
      middleMax: middleValue.middleMax,
      highMin: highValue.highMin,
      highMax: highValue.highMax,
    }
    const res = await createStrategy(params)
    if (res) {
      emit('getList')
    }
  }
  closeVisible()
}

// 初始化数据
const initInfo = (info: StrategyListItem) => {
  strategyName.value = info.strategyName || ''
  dateRange.value =
    info.effectiveStart && info.effectiveEnd ? [dayjs(info.effectiveStart), dayjs(info.effectiveEnd)] : null
  effectiveStart.value = info.effectiveStart ? formatTimestamp(info.effectiveStart, 'YYYY-MM-DD') : ''
  effectiveEnd.value = info.effectiveEnd ? formatTimestamp(info.effectiveEnd, 'YYYY-MM-DD') : ''
  if (info.studentGroupVOS && info.studentGroupVOS.length > 0) {
    const basicInfo = info.studentGroupVOS[0] || {}
    basicValue.groupName = basicInfo.groupName || '基础层'
    basicValue.basicMin = basicInfo.minRate || 0
    basicValue.basicMax = basicInfo.maxRate || 0
    const middleInfo = info.studentGroupVOS[1] || {}
    middleValue.groupName = middleInfo.groupName || '提高层'
    middleValue.middleMin = middleInfo.minRate || 0
    middleValue.middleMax = middleInfo.maxRate || 0
    const highInfo = info.studentGroupVOS[2] || {}
    highValue.groupName = highInfo.groupName || '拓展层'
    highValue.highMin = highInfo.minRate || 0
    highValue.highMax = highInfo.maxRate || 0
  }
}

// 监听弹窗打开状态，打开时初始化数据
watch(
  () => props.open,
  newOpen => {
    if (newOpen && props.info) {
      console.log('弹窗打开，初始化数据', props.info)
      initInfo(props.info)
    }
  }
)
</script>

<style scoped lang="scss">
:deep(.ant-input-number) {
  width: 60px !important;
}
:deep(.ant-input-number .ant-input-number-input) {
  height: 40px !important;
}
.form-list {
  width: 100%;
  .form-header {
    font-size: 22px;
    font-weight: 700;
    color: #111827;
    margin-top: -10px;
  }
  .form-item {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    font-size: 15px;
    padding: 15px;

    .form-label {
      width: 120px;
      color: #64748b;
      margin-bottom: 10px;
    }
  }

  .form-strategy {
    align-items: flex-start;
  }

  .strategy-list {
    width: 100%;
    .strategy-item {
      width: 100%;
      padding: 10px 30px 10px 15px;
      border: 1px solid #f0f0f0;
      border-radius: 16px;
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      background-color: rgb(248 247 246 / var(--tw-bg-opacity, 1)) !important;
      border-color: rgb(242, 235, 230) !important;
      border-radius: 6px !important;

      span {
        padding: 0 8px;
        font-size: 14px;
        color: rgb(90, 88, 87);
      }
      .strategy-item-label {
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        display: inline-block;
        min-width: 60px;
        letter-spacing: 0.5px;
        text-align: center;
        margin-right: 20px;

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
    }
  }

  .form-btn {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 30px;
  }
}
</style>

<style lang="scss">
.ant-btn.ant-btn-default {
  border: 1px solid #d9d9d9 !important;
}

.ant-modal .ant-modal-content {
  border-radius: 24px;
  padding: 28px 32px 24px;
  background: rgb(248 247 246 / 1);
  box-shadow: none;
}
.ant-modal-body {
  padding: 0;
}
</style>
