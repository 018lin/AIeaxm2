<template>
  <div class="auth-page">
    <a-card hoverable class="auth-card">
      <a-form :model="form" layout="vertical">
        <a-form-item label="邮箱/手机号">
          <a-input v-model="form.account" placeholder="请输入绑定的邮箱或手机号" allow-clear />
        </a-form-item>
        <a-button type="primary" long :loading="loading" @click="onSubmit">发送重置链接</a-button>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
// 忘记密码页 - 使用 Arco Design Vue 组件
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { forgotPassword } from '@/api/login'

const form = reactive({ account: '' })
const loading = ref(false)

async function onSubmit() {
  if (!form.account) {
    message.warning('请输入邮箱或手机号')
    return
  }
  loading.value = true
  try {
    await forgotPassword({ account: form.account })
    message.success('重置链接已发送')
  } catch (error: any) {
    message.error(error?.message || '发送重置链接失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-fill-1,#f7f8fa); padding: 24px; }
.auth-card { width: 420px; }
</style>
