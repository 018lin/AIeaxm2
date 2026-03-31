<!-- <template>
  <div class="page-wrap">
    <a-card title="权限配置">
      <template #extra>
        <a-space>
          <a-select v-model:value="currentRole" style="width: 180px" :options="roleOptions" />
          <a-input v-model:value="q" placeholder="搜索权限码/描述" style="width: 220px" allow-clear />
          <a-button type="primary" @click="save">保存(Mock)</a-button>
        </a-space>
      </template>
      <a-table :columns="columns" :data-source="filteredRows" row-key="code" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'enabled'">
            <a-switch v-model:checked="record.enabled" />
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import useMockService from '@/composables/useMockService'
import { message } from 'ant-design-vue'
const { executeMockRequest } = useMockService()
const currentRole = ref('teacher')
const roleOptions = ref([{ label: '管理员', value: 'admin' }, { label: '教师', value: 'teacher' }, { label: '学生', value: 'student' }])
const columns = [
  { title: '权限码', dataIndex: 'code', key: 'code' },
  { title: '描述', dataIndex: 'desc', key: 'desc' },
  { title: '启用', key: 'enabled' }
]
const rows = ref<any[]>([])
const q = ref('')
const filteredRows = computed(() => {
  const keyword = (q.value || '').toLowerCase()
  return rows.value.filter((r: any) => !keyword || r.code.toLowerCase().includes(keyword) || (r.desc||'').toLowerCase().includes(keyword))
})
const load = async () => {
  const res = await executeMockRequest('GET', '/system/permissions', { role: currentRole.value })
  rows.value = (res && res.data && res.data.items) || []
}
const save = async () => {
  const payload = { role: currentRole.value, permissions: filteredRows.value.filter((r: any) => r.enabled).map((r: any) => r.code) }
  await executeMockRequest('POST', '/system/permissions/update', payload as any)
  message.success('保存成功(Mock)')
}
onMounted(() => {
  load()
})
</script>
<style scoped>
.page-wrap { padding: 16px; }
</style> -->
<template>权限配置</template>
