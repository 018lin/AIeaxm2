<template>
  <a-modal
    :open="open"
    :footer="null"
    centered
    width="800px"
    wrap-class-name="question-preview-modal"
    @update:open="$emit('update:open', $event)"
  >
    <div class="preview-container">
      <!-- Header Card -->
      <div class="preview-card header-card">
        <div class="header-item">
          <div class="header-label">学科</div>
          <div class="header-value">{{ question.subject }} / Mathematics</div>
        </div>
        <div class="header-item">
          <div class="header-label">类型</div>
          <div class="header-value">{{ question.type }}</div>
        </div>
        <div class="header-item">
          <div class="header-label">难度</div>
          <div class="header-value difficulty-tag">{{ question.difficulty }} / Basic</div>
        </div>
      </div>

      <!-- Question Content Card -->
      <div class="preview-card">
        <div class="card-title gap-sm">
          <span>题目内容</span>
          <svg width="18" height="18" viewBox="0 0 24 24" class="copy-icon">
            <path
              fill="currentColor"
              d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
            ></path>
            flex items-center gap-xs action-buttons
          </svg>
        </div>
        <div class="stem">
          <img src="../../assets/images/topic8.png" alt="" />
        </div>
      </div>

      <!-- Knowledge Points Card -->
      <div class="preview-card">
        <div class="card-title gap-sm">
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16zM16 17H5V7h11l3.55 5L16 17z"
            ></path>
          </svg>
          <span>知识点</span>
        </div>
        <div class="tags">
          <span class="tag">二次函数</span>
          <span class="tag">函数最值</span>
          <span class="tag">配方法</span>
        </div>
      </div>

      <!-- Answer & Analysis Card -->
      <div class="preview-card answer-card">
        <div class="card-title">
          <span>答案解析</span>
        </div>
        <div class="answer-section answer-box">
          <div class="sub-title">正确答案</div>
          <div class="sub-content answer-content">f(x) = (x-1)², 当 x=1 时, 函数取得最小值 0</div>
        </div>
        <div class="analysis-section answer-box">
          <div class="sub-title">解析思路</div>
          <div class="sub-content">
            通过配方法将二次函数化为顶点式, 可直接得出最小值。二次函数的一般形式为 f(x) = ax² + bx + c, 当 a > 0 时,
            函数在顶点处取得最小值。该题中 a=1>0, 开口向上, 顶点坐标为(1,0)。
          </div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean
  question: any
}>()

defineEmits<{
  (e: 'update:open', value: boolean): void
}>()
</script>

<style lang="scss">
.question-preview-modal {
  .ant-modal-content {
    padding: 0;
    background-color: transparent;
    box-shadow: none;
  }
  .ant-modal-body {
    padding: 0;
  }
  .ant-modal-close {
    top: 5px;
    right: 10px;
    color: #999;
  }

  .preview-container {
    background-color: #f8f7f6;
    padding: 35px 20px 20px;
    border-radius: 8px;
    font-family: 'Noto Sans SC', sans-serif;
  }

  .preview-card {
    background-color: #fff;
    border-radius: 8px;
    padding: 24px;
    border: 1px solid #eae2db;
    box-shadow:
      0 4px 20px -4px rgba(60, 55, 51, 0.08),
      0 2px 8px -2px rgba(60, 55, 51, 0.04);
    margin-bottom: 16px;

    &.answer-card {
      padding: 0;

      .card-title {
        margin: 0;
      }

      .answer-box {
        .sub-title {
          font-size: 13px;
          color: rgb(122 115 110);
          margin-bottom: 12px;
          padding: 10px 24px;
          background-color: rgb(242 235 230);
        }

        .answer-content {
          background: rgb(250 250 249 / var(--tw-bg-opacity, 1));
          width: calc(100% - 48px);
          margin: 20px auto;
          padding: 20px;
          border: 1px solid rgb(242 235 230 / var(--tw-border-opacity, 1));
          border-radius: 8px;
        }

        .sub-content {
          padding: 0 24px 24px;
        }
      }
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  .header-card {
    display: flex;
    justify-content: space-between;
    padding: 20px 24px;

    .header-item {
      text-align: left;
      flex: 1;
      padding-right: 20px;

      .header-label {
        font-size: 12px;
        color: #888;
        margin-bottom: 8px;
        text-transform: uppercase;
      }
      .header-value {
        font-size: 15px;
        color: #333;
        font-weight: 500;
      }
      .difficulty-tag {
        display: inline-block;
        background-color: #f0f0f0;
        padding: 2px 8px;
        border-radius: 4px;
        color: #555;
        font-weight: 500;
      }
    }
  }

  .card-title {
    display: flex;
    align-items: center;
    font-size: 14px;
    color: rgb(122 115 110);
    font-weight: 500;
    margin: -24px -24px 20px;
    padding: 16px 24px;
    background: rgb(250 250 249 / 0.5);
    border-bottom: 1px solid rgb(242, 235, 230);

    .copy-icon {
      color: #ccc;
      cursor: pointer;
      &:hover {
        color: var(--color-primary);
      }
    }
  }

  .stem {
    font-size: 20px;
    line-height: 1.7;
    color: #2c3e50;
  }

  .tags {
    display: flex;
    align-items: center;
    gap: 12px;

    .tag {
      background-color: rgb(242 235 230 / 0.6);
      color: #000;
      font-size: 13px;
      padding: 5px 14px;
      border-radius: 16px;
      border: 1px solid rgb(242 235 230 / var(--tw-border-opacity, 1));
    }
  }
}
</style>
