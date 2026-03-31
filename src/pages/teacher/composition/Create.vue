<template>
  <div class="composition-create flex-col h-full app-surface relative">
    <!-- 头部 -->
    <div class="header flex-between p-20 border-b">
      <div class="title flex items-center gap-sm">
        <div class="indicator"></div>
        <span class="text-lg bold">新建作文任务</span>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content flex-1 flex min-h-0">
      <!-- 左侧表单 -->
      <div class="left-panel flex-1 p-20 scroll-y">
        <a-form layout="vertical" :model="formState">
          <!-- 作文类型 -->
          <div class="mb-20">
            <a-radio-group v-model:value="formState.type" button-style="solid" class="type-selector">
              <a-radio-button value="unit">单元作文</a-radio-button>
              <a-radio-button value="proposition">命题作文</a-radio-button>
              <a-radio-button value="half_proposition">半命题作文</a-radio-button>
              <a-radio-button value="free">自由命题</a-radio-button>
            </a-radio-group>
          </div>

          <div class="form-grid">
            <!-- 题目 -->
            <a-form-item label="题目" required name="title" class="col-span-1">
              <a-input v-model:value="formState.title" placeholder="示例：我的暑假生活" size="large" />
            </a-form-item>

            <!-- 字数要求 -->
            <a-form-item label="字数要求" required name="wordCount" class="col-span-1">
              <a-select v-model:value="formState.wordCount" placeholder="请选择" size="large">
                <a-select-option value="200">200 字以上</a-select-option>
                <a-select-option value="400">400 字以上</a-select-option>
                <a-select-option value="600">600 字以上</a-select-option>
                <a-select-option value="800">800 字以上</a-select-option>
              </a-select>
            </a-form-item>

            <!-- 满分分值 -->
            <a-form-item label="满分分值" required name="maxScore" class="col-span-1">
              <a-select v-model:value="formState.maxScore" placeholder="请选择" size="large">
                <a-select-option :value="100">100 分</a-select-option>
                <a-select-option :value="50">50 分</a-select-option>
                <a-select-option :value="30">30 分</a-select-option>
              </a-select>
            </a-form-item>

            <!-- 评价等级配置 -->
            <a-form-item label="评价等级配置" class="col-span-1">
              <div class="flex items-center h-full">
                <a class="flex items-center gap-xs text-primary-color bold pointer">
                  <PlusCircleFilled />
                  <span>选择或创建评价方案</span>
                </a>
              </div>
            </a-form-item>
          </div>

          <!-- 分配年级 -->
          <a-form-item label="分配年级" required name="grade">
            <a-radio-group v-model:value="formState.grade" class="grade-selector">
              <a-radio v-for="g in grades" :key="g.value" :value="g.value" class="grade-item">
                {{ g.label }}
              </a-radio>
            </a-radio-group>
          </a-form-item>

          <!-- 写作要求 -->
          <a-form-item label="写作要求" required name="requirements">
            <template #label>
              <span class="flex items-center gap-xs">
                写作要求
                <InfoCircleOutlined class="text-secondary" />
              </span>
            </template>
            <div class="textarea-wrapper">
              <a-textarea
                v-model:value="formState.requirements"
                placeholder="请输入详细的写作指令或题目描述..."
                :rows="6"
                :maxlength="1000"
              />
              <span class="char-count">{{ formState.requirements?.length || 0 }} / 1000</span>
            </div>
          </a-form-item>

          <!-- 补充信息/范文指导 -->
          <a-form-item label="补充信息 / 范文指导" name="supplementary">
            <div class="textarea-wrapper bg-green-light">
              <a-textarea
                v-model:value="formState.supplementary"
                placeholder="可以添加一些写作的小贴士或者参考资料..."
                :rows="4"
                :maxlength="1000"
                class="bg-transparent"
                :bordered="false"
              />
              <span class="char-count">{{ formState.supplementary?.length || 0 }} / 1000</span>
            </div>
          </a-form-item>
        </a-form>
      </div>

      <!-- 右侧侧边栏 -->
      <div class="right-panel w-320 p-20 border-l bg-gray-50 flex-col gap-lg">
        <!-- 单元专属评价点 -->
        <div class="eval-card p-20 rounded-lg bg-yellow-light border-yellow-light">
          <div class="card-header mb-10 flex-col items-center gap-xs">
            <div class="flex items-center gap-xs text-brown bold">
              <CheckCircleFilled />
              <span>单元专属评价点</span>
            </div>
            <span class="text-xs text-brown-light">最多可添加 6 个核心维度</span>
          </div>
          <div class="eval-list flex-col gap-md">
            <div v-for="(item, index) in evalPoints" :key="index" class="eval-item flex items-center gap-sm">
              <span class="index-badge">{{ String(index + 1).padStart(2, '0') }}</span>
              <a-input
                v-model:value="item.value"
                :placeholder="index < 2 ? '' : '添加评价维度...'"
                :class="{ 'is-empty': !item.value }"
                class="eval-input"
              />
            </div>
          </div>
          <div class="mt-20 text-xs text-brown-light leading-relaxed">
            提示：专属评价点将直接关联至批阅报告，帮助学生精准提升。
          </div>
        </div>

        <!-- 评分规则 -->
        <div class="grading-card p-20 rounded-lg bg-white">
          <div class="card-header mb-10 flex items-center gap-xs justify-center text-primary-color bold">
            <ControlOutlined />
            <span>评分规则</span>
          </div>
          <a-radio-group v-model:value="formState.gradingRule" class="grading-rules w-full flex-col gap-md">
            <a-radio value="ai" class="rule-item p-12 rounded-md flex items-center">
              <span class="bold">使用 AI 智能评分标准</span>
            </a-radio>
            <a-radio value="custom" class="rule-item p-12 rounded-md flex items-center">
              <span>自定义权重占比评分</span>
            </a-radio>
          </a-radio-group>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="footer flex justify-end items-center p-20 border-t gap-md bg-white">
      <a-button type="text" class="text-secondary" @click="goBack">稍后处理</a-button>
      <a-button type="primary" size="large" class="btn-publish" @click="onSubmit">立即发布任务</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircleFilled, ControlOutlined, InfoCircleOutlined, PlusCircleFilled } from '@ant-design/icons-vue'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const formState = reactive({
  type: 'unit',
  title: '',
  wordCount: '400',
  maxScore: 100,
  grade: 3,
  requirements: '',
  supplementary: '',
  gradingRule: 'ai',
})

const grades = [
  { label: '一年级', value: 1 },
  { label: '二年级', value: 2 },
  { label: '三年级', value: 3 },
  { label: '四年级', value: 4 },
  { label: '五年级', value: 5 },
  { label: '六年级', value: 6 },
]

const evalPoints = ref([
  { value: '内容真实感' },
  { value: '结构清晰度' },
  { value: '' },
  { value: '' },
  { value: '' },
  { value: '' },
])

const goBack = () => {
  router.back()
}

const onSubmit = () => {
  console.log('submit', formState)
  router.back()
}
</script>

<style lang="scss" scoped>
.composition-create {
  background-color: var(--color-bg-surface);
  height: 100%;
  overflow: hidden;

  .header {
    height: 60px;
    border-bottom: 1px solid var(--color-border-light);

    .indicator {
      width: 4px;
      height: 16px;
      background-color: var(--color-primary);
      border-radius: 2px;
    }

    .close-btn {
      color: var(--color-text-secondary);
      &:hover {
        color: var(--color-text-primary);
      }
    }
  }

  .content {
    .left-panel {
      overflow-y: auto;

      .type-selector {
        :deep(.ant-radio-button-wrapper) {
          border-radius: 0;
          &:first-child {
            border-top-left-radius: 6px;
            border-bottom-left-radius: 6px;
          }
          &:last-child {
            border-top-right-radius: 6px;
            border-bottom-right-radius: 6px;
          }
          &.ant-radio-button-wrapper-checked {
            background-color: var(--color-primary);
            border-color: var(--color-primary);
          }
        }
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;

        .col-span-1 {
          grid-column: span 1;
        }
      }

      .grade-selector {
        display: flex;
        gap: 16px;

        .grade-item {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          border: 1px solid var(--color-border);
          border-radius: 20px;
          transition: all 0.3s;

          &.ant-radio-wrapper-checked {
            border-color: var(--color-primary);
            color: var(--color-primary);
            background-color: var(--color-primary-bg-light);
          }
        }
      }

      .textarea-wrapper {
        position: relative;
        background-color: rgb(237 242 251);
        border-radius: 8px;
        padding: 8px;

        :deep(.ant-input) {
          background-color: transparent !important;
          border: none;
          box-shadow: none;
          resize: none;

          &:focus {
            box-shadow: none;
          }
        }

        .char-count {
          position: absolute;
          bottom: 8px;
          right: 12px;
          font-size: 12px;
          color: rgb(96 165 250);
          background: rgb(255 255 255 / 0.5);
          padding: 0 10px;
          border-radius: 10px;
        }

        &.bg-green-light {
          background-color: #f0fdf4;
          .char-count {
            color: #86efac;
          }
        }
      }
    }

    .right-panel {
      width: 360px;
      background-color: #fcfcfc;
      border-left: 1px solid var(--color-border-light);

      .eval-card {
        background-color: #fffbeb;
        border: 1px solid #fef3c7;

        .text-brown {
          color: #b45309;
        }
        .text-brown-light {
          color: #d97706;
        }

        .eval-item {
          .index-badge {
            width: 24px;
            height: 24px;
            background-color: #fde68a;
            color: #b45309;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
          }

          .eval-input {
            border: none;
            background-color: rgb(255 255 255 / 0.8) !important;
            border-radius: 6px;
            height: 36px;

            &.is-empty {
              background-color: rgba(255, 255, 255, 0.6);
              border: 1px dashed #fcd34d;
            }
          }
        }
      }

      .grading-card {
        background-color: #fff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

        .grading-rules {
          .rule-item {
            border: 1px solid var(--color-border-light);
            transition: all 0.3s;

            &.ant-radio-wrapper-checked {
              border-color: var(--color-primary);
              background-color: var(--color-primary-bg-light);
            }
          }
        }
      }
    }
  }

  .footer {
    height: 72px;
    border-top: 1px solid var(--color-border-light);

    .btn-publish {
      width: 140px;
      background-color: var(--color-primary);
      border-color: var(--color-primary);
      border-radius: 20px;

      &:hover {
        background-color: var(--color-primary-hover);
        border-color: var(--color-primary-hover);
      }
    }
  }

  .text-primary-color {
    color: var(--color-primary);
  }

  .bg-transparent {
    background-color: transparent !important;
  }
  .border-b {
    border-bottom: 1px solid var(--color-border-light);
  }
  .scroll-y {
    overflow-y: auto;
  }
  .w-320 {
    width: 320px;
  }
}
</style>
