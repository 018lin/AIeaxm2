<template>
  <a-modal
    :open="open"
    :zIndex="1008"
    title="修改作业名称"
    okText="确定"
    cancelText="取消"
    @ok="handleOk"
    @cancel="handleCancel"
    width="450px"
  >
    <div class="content">
      <p class="content-label"></p>
      <a-input v-model:value="nameValue" placeholder="请输入试卷名称" maxlength="50" />
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { ref, watch } from 'vue'

// 父组件接收的参数
const props = defineProps<{ open: boolean; name: string }>()
// 父组件发送的参数
const emit = defineEmits<{ close: [boolean]; getNewName: [string] }>()

const nameValue = ref(props.name)
const handleOk = () => {
  if (!nameValue.value) {
    return message.error('请输入名称')
  }
  emit('getNewName', nameValue.value)
}
const handleCancel = () => {
  emit('close', false)
}

watch(
  () => props.open,
  newOpen => {
    if (newOpen) {
      nameValue.value = props.name
    }
  }
)
</script>

<style scoped lang="less">
.content {
  width: 100%;

  .content-label {
    font-size: 14px;
    color: #333;
    margin-bottom: 20px;
    font-weight: bold;
  }
}
</style>
