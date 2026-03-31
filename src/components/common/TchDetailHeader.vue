<template>
  <div class="tch-detail-header">
    <a-button type="text" class="tch-back-btn" @click="emit('back')">
      <template #icon>
        <LeftOutlined />
      </template>
      返回列表
    </a-button>

    <div class="tch-detail-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="tch-detail-tab"
        :class="{ active: tab.key === activeKey }"
        @click="emit('navigate', tab.to)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="tch-detail-meta">
      <div class="tch-detail-meta-line">
        <span class="label">学科：</span>
        <span class="value">{{ header.subject }}</span>
      </div>
      <div class="tch-detail-meta-line">
        <span class="label">年级班级：</span>
        <span class="value">{{ header.gradeClass }}</span>
      </div>
      <div class="tch-detail-meta-line line-paper">
        <span class="label">试卷：</span>
        <span class="value strong">{{ header.paperName }}</span>
      </div>
    </div>

    <a-button v-if="showDownload" type="primary" class="tch-download-btn" @click="emit('download')">
      <Icon icon="solar:download-minimalistic-bold-duotone" width="18" />
      下载数据报告
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { LeftOutlined } from '@ant-design/icons-vue'
import { Icon } from '@iconify/vue'

type HeaderMeta = { subject: string; gradeClass: string; paperName: string }
type TabKey = 'pages' | 'student_stats' | 'students' | 'origin-work' | 'ai'
type DetailTab = { key: TabKey; label: string; to: string }

defineProps<{
  header: HeaderMeta
  tabs: DetailTab[]
  activeKey: TabKey
  showDownload?: boolean
}>()

const emit = defineEmits<{
  back: []
  navigate: [string]
  download: []
}>()
</script>

<style scoped lang="scss">
.tch-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 40px;
}

.tch-back-btn {
  padding-left: 0;
  color: var(--color-primary);
  font-weight: 600;

  &:hover {
    background: transparent;
    color: var(--primary-deep);
  }
}

.tch-detail-tabs {
  display: flex;
  gap: 10px;
  flex: 1;

  .tch-detail-tab {
    height: 32px;
    flex: none;
    padding: 0 14px;
    border-radius: 8px;
    border: none;
    background: rgba(248, 244, 241, 0.9);
    font-size: 13px;
    font-weight: 700;
    color: var(--primary-deep);
    cursor: pointer;

    &.active {
      background: var(--color-primary);
      color: #fff;
    }
  }
}

.tch-detail-meta {
  display: flex;
  flex-wrap: wrap;
  text-align: right;
  justify-content: right;
  gap: 6px;
  font-size: 12px;
  color: rgba(17, 24, 39, 0.7);

  .tch-detail-meta-line {
    .label {
      color: #8b5b3e;
      font-weight: 700;
    }

    &.line-paper {
      flex-basis: 100%;
    }

    .strong {
      color: var(--color-primary);
      font-weight: 500;
    }
  }
}
</style>
