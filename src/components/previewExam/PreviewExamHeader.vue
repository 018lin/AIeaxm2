<template>
  <div class="paper-header" :class="{ 'is-a3': paperType === 'A3' || paperType === 'A4DC' }">
    <h3 class="title">{{ info.assignmentName }}</h3>
    <div class="header">
      <img :src="qrCodeContent" alt="二维码" class="qr-code" />
      <div class="exam-info">
        <div class="exam-details">
          <p>
            <span class="label">年级：</span>
            <span class="gap" v-if="isShowHeaderGrade">{{ selectedInfo.label }}</span>
            <a-select
              v-else
              placeholder="请选择年级"
              class="gap-select"
              v-model:value="info.gradeId"
              @change="gradeChange"
            >
              <a-select-option v-for="item in gradeList" :key="item.dictValue" :value="item.dictValue">
                {{ item.label }}
              </a-select-option>
            </a-select>
          </p>
          <p>
            <span class="label">学科：</span>
            <span class="gap">{{ info.subjectName }}</span>
          </p>
        </div>
        <div class="exam-details">
          <p>
            <span class="label">姓名：</span>
            <span class="gap"></span>
          </p>
          <p>
            <span class="label">班级：</span>
            <span class="gap"></span>
          </p>
        </div>
        <div class="exam-details">
          <span class="label">学号：</span>
          <span class="gap-num"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { dictListResponse } from '@/api/common/type';
import type { previewExaminationResponse } from '@/api/examination/type';
import { dictGradeOneList, dictGradeThreeList, dictGradeTwoList } from '@/utils/dictList';
import { ref, watch } from 'vue';

const props = defineProps<{
  info: previewExaminationResponse
  paperType: string
  qrCodeContent: string
  isShowHeaderGrade: boolean
}>()

const emit = defineEmits<{
  'grade-change': [value: string]
}>()

const gradeList = ref<dictListResponse[]>([]) // 年级字典列表
const selectedInfo = ref<dictListResponse>({})

// 切换学段时，重置年级
const changeStage = (value: string) => {
  // 重新获取年级列表
  if (value === '1') {
    gradeList.value = dictGradeOneList
  } else if (value === '2') {
    gradeList.value = dictGradeTwoList
  } else if (value === '3') {
    gradeList.value = dictGradeThreeList
  }
  
  // 更新 selectedInfo
  if (props.info.gradeId) {
    selectedInfo.value = gradeList.value.find(item => item.dictValue === props.info.gradeId) || {}
  }
}

const gradeChange = (value: string) => {
  selectedInfo.value = gradeList.value.find(item => item.dictValue === value) || {}
  emit('grade-change', value)
}

// 监听 stageId 变化，更新年级列表
watch(
  () => props.info.stageId,
  stageId => {
    changeStage(stageId || '')
  },
  { immediate: true }
)

// 监听 gradeId 变化，更新 selectedInfo
watch(
  () => props.info.gradeId,
  gradeId => {
    if (gradeId && gradeList.value.length > 0) {
      selectedInfo.value = gradeList.value.find(item => item.dictValue === gradeId) || {}
    }
  }
)
</script>

<style scoped lang="less">
.paper-header {
  width: 100%;
  color: #000;

  .title {
    margin: 0 0 12px;
    font-weight: 700;
    font-size: 20px;
    text-align: center;
    letter-spacing: 0.32px;
  }

  .header {
    width: 100%;
    padding: 0 15px;
    display: flex;
    align-items: center;

    .qr-code {
      width: 120px;
      height: 120px;
    }

    .exam-info {
      flex: 1;
      margin-left: 20px;
      margin-bottom: 10px;

      .exam-details {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;

        p {
          margin: 0;
          padding: 0;
          display: flex;
          align-items: flex-end;
        }
        span {
          display: inline-block;
          font-size: 14px;
        }

        .label {
          width: 50px;
          color: #000;
        }

        .gap {
          width: 220px;
          height: 25px;
          line-height: 25px;
          border-bottom: 1px solid #000;
          padding-left: 20px;
        }
        .gap-num {
          width: calc(100% - 50px);
          height: 25px;
          border-bottom: 1px solid #000;
        }
        .gap-select {
          margin-top: 10px;
          width: 220px !important;
          height: 32px !important;
          border-bottom: 1px solid #000;
          :deep(.ant-select-selection-item) {
            line-height: 32px !important;
          }
          :deep(.ant-select-selector) {
            width: 220px !important;
            height: 32px !important;
            border: none !important;
            background-color: transparent !important;
            color: #000 !important;
          }
          :deep(.ant-select-dropdown-menu-item-active) {
            border: none !important;
            background-color: transparent !important;
          }
          :deep(.ant-select-selection-placeholder) {
            line-height: 32px !important;
          }
        }
      }
    }
  }

  &.is-a3 {
    .student-info {
      span {
        max-width: 253px;
      }
    }
  }
}
</style>
