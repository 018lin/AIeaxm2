<template>
  <a-modal :open="open" title="错题设置" width="600px" :footer="null" @cancel="emit('close')">
    <div class="setting">
      <div class="setting-item">
        <span class="setting-label">生成时间:</span>
        <span class="setting-time">每周五</span>
      </div>
      <div class="setting-item">
        <span class="setting-label">最大题量:</span>
        <a-select v-model:value="numbers" placeholder="请选择最大题量" style="width: 80%">
          <a-select-option value="10">10</a-select-option>
          <a-select-option value="15">15</a-select-option>
          <a-select-option value="20">20</a-select-option>
          <a-select-option value="25">25</a-select-option>
          <a-select-option value="30">30</a-select-option>
        </a-select>
      </div>
      <div class="setting-item">
        <span class="setting-label"
          >共性错题率
          <a-tooltip>
            <template #title>该错题率用于错题重组模块下班级错题库组卷及智能周错题推荐</template>
            <ExclamationCircleOutlined :style="{ color: '#F37B34' }" />
          </a-tooltip>
        </span>
        <a-input-number
          style="width: 80%"
          v-model:value="errorRate"
          addon-after="%"
          :max="100"
          :min="1"
          :precision="0"
          :step="1"
        ></a-input-number>
      </div>
      <div class="setting-btn">
        <a-button class="default-btn" @click="emit('close')">取消</a-button>
        <a-button class="primary-btn" type="primary" @click="handleSave">保存</a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { updateRules } from '@/api/recompose/index'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  info?: Record<string, any>
  classId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const numbers = ref<string>('')
const errorRate = ref<string>('')

// 保存 updateRules
const handleSave = async () => {
  try {
    // 这里调用更新接口 updateRules，传入 numbers 和 errorRate
    const params = {
      numbers: numbers.value,
      errorRate: errorRate.value + '',
      classId: props.classId,
    }
    await updateRules(params)
    emit('close')
  } catch (error) {
    console.error('保存失败:', error)
  }
}

watch(
  () => props.info,
  newInfo => {
    numbers.value = newInfo?.numbers || ''
    errorRate.value = newInfo?.errorRate || ''
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
:deep(.ant-input-number .ant-input-number-input) {
  height: 44px !important;
}
.setting {
  width: 100%;
  border-top: 1px solid #f0f0f0;
  padding: 30px;
  .setting-item {
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    font-size: 15px;

    .setting-label {
      width: 120px;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .setting-time {
      font-weight: 600;
    }
  }

  .setting-btn {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
