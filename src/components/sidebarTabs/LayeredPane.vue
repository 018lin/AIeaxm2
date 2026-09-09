<template>
  <div class="layered">
    <div class="input-label">学段</div>
    <div class="layered-btn">
      <p
        v-for="item in layeredData"
        :key="item.groupId"
        :class="{ active: groupId === item.groupId }"
        @click="onSelect(item.groupId)"
      >
        {{ item.groupName }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getStrategyList } from '@/api/layering'
import { getUserBaseInfo } from '@/services/storage'
import { message } from 'ant-design-vue'
import { onMounted, ref } from 'vue'

const emit = defineEmits(['select'])

const groupId = ref<string>()
const layeredData = ref([{ groupName: '全部', groupId: 'all' }])

const onSelect = (id: string) => {
  groupId.value = id
  emit('select', groupId.value, 'layered')
}

async function fetchLayeredData() {
  const userInfo = getUserBaseInfo() as any
  const firstClass = userInfo?.classInfoList?.[0]
  if (!firstClass?.classId || !userInfo?.gradeId) return

  try {
    const res = await getStrategyList({
      classId: String(firstClass.classId),
      gradeId: String(userInfo.gradeId),
      pageNo: 1,
      pageSize: 1,
      type: 'manual',
    })
    const groups = (res?.list || []).flatMap(item => item.studentGroupVOS || [])
    layeredData.value = [
      { groupName: '全部', groupId: 'all' },
      ...groups
        .filter(item => item.groupId && item.groupName)
        .map(item => ({ groupId: String(item.groupId), groupName: String(item.groupName) })),
    ]
  } catch (e: any) {
    message.error(e?.message || '获取分层数据失败')
  }
}

onMounted(() => {
  fetchLayeredData().catch(() => {})
})
</script>

<style scoped lang="less">
.layered {
  width: 100%;

  .layered-btn {
    display: flex;
    margin-top: 10px;
    flex-wrap: wrap;
    justify-content: space-between;

    p {
      padding: 10px 16px;
      border-radius: 20px;
      background-color: #f9f5f2;
      cursor: pointer;
      color: rgba(0, 0, 0, 0.85);

      &.active {
        border: 1px solid transparent;
        background-color: var(--color-bg-warm) !important;
        color: var(--color-primary-hover);
        border-color: var(--color-primary-soft);
      }
    }
  }
}
</style>
