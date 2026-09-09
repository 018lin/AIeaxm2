<template>
  <div class="login-container">
    <div class="abstract-shape overflow-hidden">
      <svg class="shape-svg shape-left" fill="none" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M750 200C650 400 300 350 150 550C0 750 400 850 600 750C800 650 850 0 750 200Z"
          fill="currentColor"
        ></path>
      </svg>
      <svg class="shape-svg shape-right" fill="none" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <circle cx="200" cy="200" fill="currentColor" r="200"></circle>
      </svg>
    </div>

    <div class="content-wrapper">
      <!-- Left Side: Branding -->
      <div class="brand-section">
        <div class="brand-header">
          <div class="logo-icon">
            <ReadFilled />
          </div>
          <span class="brand-name">AI数智作业平台</span>
        </div>
        <h1 class="main-title">让学习更高效，<br />让成长更简单</h1>
        <p class="sub-title">专为师生打造的现代化智慧教学空间</p>
      </div>

      <!-- Right Side: Login Form -->
      <div class="login-card">
        <h2 class="form-title">欢迎登录</h2>
        <p class="form-subtitle">请输入您的凭据以访问您的账户</p>

        <a-form :model="form" class="login-form" @keypress.enter="onSubmit">
          <!-- <div class="form-item">
            <div class="input-label">租户ID</div>
            <a-input v-model:value="form.tenantId" placeholder="请输入租户ID (可选)" class="custom-input" allow-clear>
              <template #prefix>
                <BankOutlined class="input-icon" />
              </template>
            </a-input>
          </div> -->

          <div class="form-item">
            <div class="input-label">账号</div>
            <a-input v-model:value="form.username" placeholder="请输入手机号" class="custom-input" allow-clear>
              <template #prefix>
                <UserOutlined class="input-icon" />
              </template>
            </a-input>
          </div>

          <div class="form-item">
            <div class="input-label">密码</div>
            <a-input-password v-model:value="form.password" placeholder="请输入密码" class="custom-input" allow-clear>
              <template #prefix>
                <LockOutlined class="input-icon" />
              </template>
            </a-input-password>
          </div>

          <div class="form-item remember-row">
            <a-checkbox v-model:checked="rememberMe">记住账号密码</a-checkbox>
          </div>

          <a-button type="primary" class="submit-btn" :loading="loading" @click="onSubmit">
            登录
            <ArrowRightOutlined />
          </a-button>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ROUTES } from '@/router/routes'
import useAuth from '@/utils/auth'
import { decrypt, encrypt } from '@/utils/crypto'
import { ArrowRightOutlined, LockOutlined, ReadFilled, UserOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const { loginWithCredentials } = useAuth()
const form = reactive({ username: '', password: '', tenantId: '' })

const rememberMe = ref(false)
const REMEMBER_KEY = 'rememberLogin'

const loadRemember = () => {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY)
    if (!raw) return
    const payload = JSON.parse(raw)
    if (payload && payload.remember === true) {
      const uRaw = String(payload.username || '')
      const pRaw = String(payload.password || '')
      const isEncrypted = payload.encrypted === true

      form.username = isEncrypted ? decrypt(uRaw) : uRaw
      form.password = isEncrypted ? decrypt(pRaw) : pRaw
      rememberMe.value = true
    }
  } catch {
    localStorage.removeItem(REMEMBER_KEY)
  }
}

onMounted(loadRemember)

watch([() => form.username, () => form.password, rememberMe], ([u, p, rm]) => {
  if (!rm) {
    localStorage.removeItem(REMEMBER_KEY)
    return
  }
  localStorage.setItem(
    REMEMBER_KEY,
    JSON.stringify({
      remember: true,
      encrypted: true,
      username: encrypt(String(u || '')),
      password: encrypt(String(p || '')),
    })
  )
})

async function onSubmit() {
  if (!form.username || !form.password) {
    message.warning('请输入手机号和密码')
    return
  }
  loading.value = true
  try {
    await loginWithCredentials(form.username, form.password, form.tenantId)
    message.success('登录成功')
    router.push(ROUTES.TEACHER_DASHBOARD).catch(() => {})
  } catch (e: any) {
    message.error(e?.message || '登录失败，请确认后端服务已启动')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  background-color: #fdfbf7;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.abstract-shape {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0.4;
  pointer-events: none;

  .shape-svg {
    position: absolute;
    color: #f97316; /* text-primary */

    &.shape-left {
      left: -20px; /* -left-20 */
      top: -20px; /* -top-20 */
      width: 50%; /* w-1/2 */
      height: 100%; /* h-full */
      opacity: 0.1; /* opacity-10 */
    }

    &.shape-right {
      right: 0;
      bottom: 0;
      width: 33.333333%; /* w-1/3 */
      height: 50%; /* h-1/2 */
      opacity: 0.1; /* opacity-10 */
    }
  }
}

@keyframes float {
  0% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(30px, -30px);
  }
  100% {
    transform: translate(0, 0);
  }
}

.content-wrapper {
  position: relative;
  z-index: 1;
  display: flex;
  width: 1200px;
  max-width: 90%;
  height: 700px;
  align-items: center;
  justify-content: space-between;
}

/* Brand Section */
.brand-section {
  flex: 1;
  padding-right: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .brand-header {
    display: flex;
    align-items: center;
    margin-bottom: 40px;
    gap: 12px;

    .logo-icon {
      width: 40px;
      height: 40px;
      background: #f97316;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
    }

    .brand-name {
      font-size: 24px;
      font-weight: 700;
      color: #ea580c;
      letter-spacing: 1px;
    }
  }

  .main-title {
    font-size: 56px;
    line-height: 1.2;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 24px;
    letter-spacing: -1px;
  }

  .sub-title {
    font-size: 20px;
    color: #6b7280;
    margin-bottom: 60px;
    font-weight: 400;
  }
}

/* Login Card */
.login-card {
  width: 480px;
  background: #ffffff;
  border-radius: 24px;
  padding: 40px;
  box-shadow:
    0 20px 50px -12px rgba(0, 0, 0, 0.1),
    0 4px 12px -4px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;

  .form-title {
    font-size: 32px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 8px;
  }

  .form-subtitle {
    font-size: 14px;
    color: #9ca3af;
    margin-bottom: 40px;
  }
}

.login-form {
  .form-item {
    margin-bottom: 24px;
  }

  .remember-row {
    margin-top: -8px;
  }

  .custom-input {
    :deep(.ant-input),
    :deep(.ant-input-password-input) {
      background: #f3f4f6;
    }

    :deep(.ant-input-affix-wrapper),
    &.ant-input {
      background-color: #f3f4f6;
      border: 1px solid transparent;
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 15px;
      transition: all 0.3s;

      &:hover,
      &:focus-within {
        background-color: #ffffff;
        border-color: #f97316;
        box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1);
      }
    }

    .input-icon {
      color: #9ca3af;
      font-size: 18px;
      margin-right: 8px;
    }
  }

  .submit-btn {
    width: 100%;
    height: 52px;
    font-size: 16px;
    box-shadow: 0 10px 20px -5px rgba(249, 115, 22, 0.4);
    justify-content: center;
    gap: 8px;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 25px -5px rgba(249, 115, 22, 0.5);
    }

    &:active {
      transform: translateY(0);
    }
  }
}
</style>
