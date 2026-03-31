<template>
  <div class="auth-page">
    <a-card hoverable class="auth-card">
      <a-form :model="form" layout="vertical">
        <a-form-item label="邮箱/手机号">
          <a-input v-model="form.account" placeholder="请输入绑定的邮箱或手机号" allow-clear />
        </a-form-item>
        <a-button type="primary" long @click="onSubmit">发送重置链接</a-button>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
// 忘记密码页 - 使用 Arco Design Vue 组件
import { reactive } from 'vue'
import { message } from 'ant-design-vue'

const form = reactive({ account: '' })

function onSubmit() {
  if (!form.account) {
    message.warning('请输入邮箱或手机号')
    return
  }
  message.success('重置链接已发送（演示）')
}
</script>

<style scoped>
.auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-fill-1,#f7f8fa); padding: 24px; }
.auth-card { width: 420px; }
</style>