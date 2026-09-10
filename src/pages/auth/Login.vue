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

      <!-- Right Side: Identity + Login -->
      <div class="login-card" :class="{ 'login-card--wide': !selectedIdentity }">
        <template v-if="!selectedIdentity">
          <h2 class="form-title">请选择登录身份</h2>
          <p class="form-subtitle">选择对应入口后继续登录</p>

          <div class="identity-grid">
            <button
              v-for="item in identityCards"
              :key="item.key"
              type="button"
              class="identity-card"
              :class="{ disabled: item.disabled }"
              :aria-disabled="item.disabled"
              @click="selectIdentity(item.key)"
            >
              <div class="identity-icon">
                <component :is="item.icon" />
              </div>
              <div class="identity-content">
                <span class="identity-title">{{ item.title }}</span>
                <span class="identity-desc">{{ item.desc }}</span>
              </div>
              <span v-if="item.disabled" class="identity-badge">暂未开放</span>
              <ArrowRightOutlined v-else class="identity-arrow" />
            </button>
          </div>
        </template>

        <template v-else>
          <button type="button" class="back-btn" @click="resetIdentity">
            <LeftOutlined />
            返回选择身份
          </button>

          <h2 class="form-title">{{ selectedIdentityLabel }}登录</h2>
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
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ROUTES } from '@/router/routes'
import useAuth from '@/utils/auth'
import { decrypt, encrypt } from '@/utils/crypto'
import { ArrowRightOutlined, LeftOutlined, LockOutlined, ReadFilled, TeamOutlined, UserOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const { loginWithCredentials } = useAuth()
const form = reactive({ username: '', password: '', tenantId: '' })

type PortalIdentity = 'student' | 'teacher'
type IdentityCardKey = PortalIdentity | 'parent'

const selectedIdentity = ref<PortalIdentity | null>(null)
const identityCards: {
  key: IdentityCardKey
  title: string
  desc: string
  icon: any
  disabled?: boolean
}[] = [
  { key: 'student', title: '学生', desc: '查看作业、错题与学习报告', icon: UserOutlined },
  { key: 'parent', title: '家长', desc: '关注孩子学习进展', icon: TeamOutlined, disabled: true },
  { key: 'teacher', title: '教师', desc: '进入教学管理与批改工作台', icon: ReadFilled },
]

const identityRouteMap: Record<PortalIdentity, string> = {
  student: ROUTES.STUDENT_DASHBOARD,
  teacher: ROUTES.TEACHER_DASHBOARD,
}

const identityLabelMap: Record<PortalIdentity, string> = {
  student: '学生',
  teacher: '教师',
}

const selectedIdentityLabel = computed(() => (selectedIdentity.value ? identityLabelMap[selectedIdentity.value] : ''))
const rememberMe = ref(false)
const REMEMBER_KEY = 'rememberLogin'
const SELECTED_PORTAL_ROLE_KEY = 'selectedPortalRole'

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

function selectIdentity(identity: IdentityCardKey) {
  if (identity === 'parent') {
    message.info('家长端暂未开放')
    return
  }
  selectedIdentity.value = identity
}

function resetIdentity() {
  selectedIdentity.value = null
}

async function onSubmit() {
  if (!selectedIdentity.value) {
    message.warning('请先选择登录身份')
    return
  }
  if (!form.username || !form.password) {
    message.warning('请输入手机号和密码')
    return
  }
  loading.value = true
  try {
    await loginWithCredentials(form.username, form.password, form.tenantId)
    const target = identityRouteMap[selectedIdentity.value]
    localStorage.setItem(SELECTED_PORTAL_ROLE_KEY, selectedIdentity.value)
    message.success('登录成功')
    await router.replace(target)
    if (router.currentRoute.value.path === ROUTES.AUTH_LOGIN) {
      window.location.assign(target)
    }
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

  &.login-card--wide {
    width: 560px;
  }

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

.identity-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.identity-card {
  width: 100%;
  min-height: 104px;
  display: grid;
  grid-template-columns: 56px 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 18px;
  border: 1px solid #f1e5da;
  border-radius: 16px;
  background: #fffaf5;
  color: #1f2937;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #f97316;
    background: #ffffff;
    box-shadow: 0 12px 30px rgba(249, 115, 22, 0.12);
    transform: translateY(-1px);
  }

  &.disabled {
    cursor: not-allowed;
    color: #9ca3af;
    background: #f6f7f9;
    border-color: #e5e7eb;

    &:hover {
      border-color: #e5e7eb;
      box-shadow: none;
      transform: none;
    }

    .identity-icon {
      color: #9ca3af;
      background: #ffffff;
    }
  }
}

.identity-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ea580c;
  background: #ffedd5;
  font-size: 24px;
}

.identity-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.identity-title {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
}

.identity-desc {
  font-size: 13px;
  line-height: 1.5;
  color: #6b7280;
}

.identity-arrow {
  color: #f97316;
  font-size: 18px;
}

.identity-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #ffffff;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 700;
}

.back-btn {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #9ca3af;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 20px;

  &:hover {
    color: #ea580c;
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

@media (max-width: 960px) {
  .content-wrapper {
    height: auto;
    flex-direction: column;
    gap: 32px;
    align-items: stretch;
  }

  .brand-section {
    padding-right: 0;

    .brand-header {
      margin-bottom: 24px;
    }

    .main-title {
      font-size: 40px;
    }

    .sub-title {
      margin-bottom: 0;
    }
  }

  .login-card,
  .login-card.login-card--wide {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .login-container {
    height: auto;
    min-height: 100vh;
    overflow-y: auto;
    padding: 32px 0;
  }

  .login-card {
    padding: 28px 22px;
    border-radius: 18px;
  }

  .identity-card {
    grid-template-columns: 48px 1fr;
    min-height: 96px;
  }

  .identity-icon {
    width: 48px;
    height: 48px;
    font-size: 22px;
  }

  .identity-arrow,
  .identity-badge {
    grid-column: 2;
    justify-self: flex-start;
  }
}
</style>
