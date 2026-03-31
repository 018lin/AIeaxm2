<template>
  <div class="auth-page">
    <a-card hoverable class="auth-card">
      <a-form :model="form" layout="vertical">
        <a-form-item label="邮箱">
          <a-input v-model="form.email" placeholder="邮箱" allow-clear />
        </a-form-item>
        <a-form-item label="密码">
          <a-input-password v-model="form.password" placeholder="设置密码" allow-clear visibility-toggle />
        </a-form-item>
        <a-form-item label="角色">
          <a-select v-model="form.role" placeholder="选择角色">
            <a-option value="admin">管理员</a-option>
            <a-option value="student">学生</a-option>
            <a-option value="teacher">老师</a-option>
          </a-select>
        </a-form-item>
        <a-button type="primary" long @click="onSubmit">注册</a-button>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
// 注册页 - 使用 Arco Design Vue 组件
import { ROUTES } from '@/router/routes'
import { message } from 'ant-design-vue'
import { reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const form = reactive({ email: '', password: '', role: '' })

function onSubmit() {
  if (!form.email || !form.password || !form.role) {
    message.warning('请完整填写信息')
    return
  }
  message.success('注册成功，请登录')
  router.push(ROUTES.AUTH_LOGIN)
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-fill-1, #f7f8fa);
  padding: 24px;
}
.auth-card {
  width: 420px;
}
</style>
