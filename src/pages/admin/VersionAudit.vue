<template>
  <div class="version-audit-page">
    <a-page-header
      title="版本管理与审计日志"
      sub-title="题目版本历史管理和系统操作审计"
      @back="goBack"
    />

    <div class="page-content">
      <a-tabs v-model:activeKey="activeTab" type="card" class="content-tabs">
        <a-tab-pane key="versions" tab="版本历史管理">
          <VersionHistoryManager />
        </a-tab-pane>
        <a-tab-pane key="audit" tab="审计日志管理">
          <AuditLogManager />
        </a-tab-pane>
        <a-tab-pane key="stats" tab="操作统计">
          <OperationStats />
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import VersionHistoryManager from '@/components/VersionHistoryManager.vue'
import AuditLogManager from '@/components/AuditLogManager.vue'
import OperationStats from '@/components/OperationStats.vue'

const router = useRouter()
const activeTab = ref('versions')

const goBack = () => {
  router.back()
}
</script>

<style scoped lang="less">
.version-audit-page {
  min-height: 100vh;
  background: #f5f5f5;

  .page-content {
    padding: 20px;
  }

  .content-tabs {
    :deep(.ant-tabs-content) {
      padding: 0;
      background: transparent;
    }
    
    :deep(.ant-tabs-tab) {
      border-radius: 8px 8px 0 0;
      margin-right: 8px;
      
      &.ant-tabs-tab-active {
        background: #fff;
        border-bottom: 1px solid #fff;
      }
    }
    
    :deep(.ant-tabs-nav) {
      margin-bottom: 0;
    }
  }
}

:deep(.ant-page-header) {
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 0;
}
</style>