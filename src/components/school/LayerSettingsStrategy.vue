<template>
  <a-modal :open="open" width="650px" :footer="null" @cancel="closeVisible">
    <div class="form-list">
      <div class="form-header">编辑分层</div>
      <div class="form-item app-surface">
        <p class="form-label">分层名称：</p>
        <a-input v-model:value="groupName" placeholder="请输入分层名称" style="height: 44px" />
      </div>
      <div class="form-item app-surface">
        <p class="form-label">共性错题率：</p>
        <a-input-number
          style="width: 100%"
          v-model:value="mistakeRate"
          addon-after="%"
          :max="100"
          :min="1"
          :precision="0"
          :step="1"
          placeholder="请输入共性错题率"
        ></a-input-number>
      </div>
      <div class="form-item app-surface">
        <p class="form-label">选择学生：</p>
        <a-select
          v-model:value="selectStudentList"
          mode="multiple"
          show-search
          option-filter-prop="label"
          placeholder="请选择学生"
          class="student-select"
          @popupScroll="popupScroll"
        >
          <a-select-option
            v-for="student in studentList"
            :key="student.studentUserId"
            :value="student.studentUserId"
            :label="student.studentName"
          >
            {{ student.studentName }}
          </a-select-option>
        </a-select>
      </div>
      <div class="form-item form-strategy app-surface">
        <p class="form-label">分配策略：</p>
        <div class="strategy-item">
          <span class="strategy-item-label">{{ groupName }}</span>
          <a-input-number id="inputNumber" v-model:value="minRate" :max="100" :min="0" :precision="0" :step="1" />
          <span>% ≤ 正确率 ≤</span>
          <a-input-number id="inputNumber" v-model:value="maxRate" :max="100" :min="0" :precision="0" :step="1" />
          <span>%的学生自动进入</span>
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
import { updateGroup } from '@/api/layering/index'
import type { GroupItem } from '@/api/layering/type'
import type { StudentItem } from '@/api/school/type'
import { ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  info?: Record<string, any>
  layerSettingInfo: Record<string, any>
  studentList: StudentItem[]
}>()

const emit = defineEmits<{
  close: []
  getList: []
}>()

const groupName = ref<string>('')
const mistakeRate = ref<number>(0)
const minRate = ref<number>(0)
const maxRate = ref<number>(0)
const selectStudentList = ref<string[]>([])

const popupScroll = () => {
  console.log('popupScroll')
}

// 关闭弹窗
const closeVisible = () => {
  groupName.value = ''
  mistakeRate.value = 0
  maxRate.value = 0
  minRate.value = 0
  selectStudentList.value = []
  emit('close')
}

// 保存
const handleSave = async () => {
  const params = {
    groupId: props.info?.groupId,
    strategyId: props.info?.strategyId,
    groupName: groupName.value,
    mistakeRate: mistakeRate.value,
    minRate: minRate.value,
    maxRate: maxRate.value,
    studentUserIds: selectStudentList.value,
  }
  const res = await updateGroup(params)
  if (res) {
    emit('getList')
  }
  closeVisible()
}

// 初始化数据
const initInfo = (info: GroupItem) => {
  groupName.value = info.groupName || ''
  mistakeRate.value = info.mistakeRate || 0
  minRate.value = info.minRate || 0
  maxRate.value = info.maxRate || 0
}

// 监听弹窗打开状态，打开时初始化数据
watch(
  () => props.open,
  newOpen => {
    if (newOpen && props.info) {
      initInfo(props.info)
    }
  }
)
</script>

<style scoped lang="scss">
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

  .tag-list {
    background: rgb(248 247 246 / var(--tw-bg-opacity, 1));
    border: 1px solid rgb(242, 235, 230);
    padding: 15px 15px 5px;
    border-radius: 10px;
    .tag-item {
      font-size: 14px;
      padding: 5px 10px;
      border-radius: 14px;
      margin-bottom: 10px;
      background: #ffffff;
    }
  }

  .form-strategy {
    align-items: flex-start;
  }

  .student-select {
    width: 100%;

    :deep(.ant-select-selector) {
      min-height: 44px !important;
      height: auto !important;
      max-height: none !important;
      padding: 4px 8px !important;

      .ant-select-selection-overflow {
        gap: 6px;
        flex-wrap: wrap;
      }

      .ant-select-selection-item {
        height: 32px;
        line-height: 32px !important;
        padding: 0 12px;
        margin: 2px 0;
        background: #fff7ed;
        border: 1px solid #fed7aa;
        border-radius: 8px;
        color: #c2410c;
        font-size: 14px;

        .ant-select-selection-item-remove {
          color: #f97316;

          &:hover {
            color: #c2410c;
          }
        }
      }

      .ant-select-selection-search {
        margin-inline-start: 0 !important;
      }

      .ant-select-selection-placeholder {
        line-height: 36px;
      }
    }
  }

  .strategy-item {
    width: 100%;
    padding: 14px 20px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    background: #fafaf9;
    transition: all 0.3s;

    &:hover {
      border-color: #ff7d00;
      background: #fff7ed;
      box-shadow: 0 2px 8px rgba(255, 125, 0, 0.1);
    }

    span {
      padding: 0 8px;
      font-size: 14px;
      color: #57534e;
      white-space: nowrap;
    }

    .strategy-item-label {
      padding: 0 20px 0 0;
      font-size: 15px;
      font-weight: 600;
      color: #292524;
      min-width: 80px;
    }

    :deep(.ant-input-number) {
      width: 80px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;

      &:hover,
      &:focus-within {
        border-color: #ff7d00;
      }

      .ant-input-number-input {
        text-align: center;
        font-weight: 500;
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
