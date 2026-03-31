<template>
  <a-modal
    :open="open"
    :title="title"
    centered
    :maskClosable="false"
    :closable="false"
    :keyboard="false"
    :confirmLoading="loading"
    okText="确认修改"
    :cancelButtonProps="{ style: { display: 'none' } }"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <div class="description">
      {{ description }}
    </div>

    <div class="form-item mb-10">
      <div class="mb-5">当前密码</div>
      <a-input-password v-model:value="form.oldPassword" placeholder="请输入当前密码" />
    </div>

    <div class="mb-15 grid-cols-2 gap-md">
      <div>
        <div class="mb-5">新密码</div>
        <a-input-password v-model:value="form.newPassword" placeholder="设置新密码" />
      </div>
      <div>
        <div class="mb-5">确认新密码</div>
        <a-input-password v-model:value="form.confirmPassword" placeholder="再次输入新密码" />
      </div>
    </div>

    <div class="text-xs flex gap-xs items-center">
      <Icon icon="gridicons:notice-outline"></Icon>
      8-10位，数字、大写字母、小写字母的组合，三者缺一不可
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { reactive, watch } from 'vue'

type ForcePwdForm = { oldPassword: string; newPassword: string; confirmPassword: string }

const props = defineProps<{
  open: boolean
  loading?: boolean
  title?: string
  description?: string
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  submit: [form: ForcePwdForm]
}>()

const form = reactive<ForcePwdForm>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

watch(
  () => props.open,
  v => {
    if (v) {
      form.oldPassword = ''
      form.newPassword = ''
      form.confirmPassword = ''
    }
  }
)

const title = props.title ?? '修改密码'
const description = props.description ?? '为了您的账号安全，使用平台之前，请先修改密码'

function handleOk() {
  emit('submit', { ...form })
}

function handleCancel() {
  emit('update:open', true)
}
</script>

<style scoped>
.description {
  color: rgba(0, 0, 0, 0.65);
  margin-bottom: 16px;
}
</style>
