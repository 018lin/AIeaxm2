<template>
  <div class="person">
    <header class="person-header flex-between items-center mb-20">
      <h1>个人信息设置</h1>
    </header>

    <div class="person-body">
      <div class="person-left">
        <div class="person-card app-surface rounded-xl overflow-hidden">
          <div class="person-profile flex-col flex-center p-20">
            <div class="avatar-wrapper relative">
              <Icon icon="octicon:feed-person-16" width="80" height="80" color="#f2ebe6" />
            </div>
            <h3 class="text-xl bold mb-4">{{ personInfo.name }}</h3>

            <div class="tags flex gap-10">
              <span class="tag-item tag-gray flex-center gap-6">
                <Icon icon="solar:card-bold-duotone" style="font-size: 16px" />
                <span class="tag-label">用户名：</span>
                <span :title="personInfo.certId">{{ personInfo.userName }}</span>
              </span>
              <span class="tag-item tag-green flex-center gap-6">
                <Icon icon="solar:check-circle-bold" style="font-size: 16px" />
                {{ personInfo.subjectName }}老师
              </span>
            </div>
          </div>

          <div class="divider"></div>

          <div class="person-nav p-20 pt-0">
            <div
              class="nav-item flex items-center gap-10"
              :class="{ active: currentSection === 'basic' }"
              @click="scrollToSection('basic')"
            >
              <Icon icon="solar:user-bold-duotone" style="font-size: 20px" />
              基本信息
            </div>
            <div
              class="nav-item flex items-center gap-10"
              :class="{ active: currentSection === 'security' }"
              @click="scrollToSection('security')"
            >
              <Icon icon="solar:shield-bold-duotone" style="font-size: 20px" />
              账号安全
            </div>
          </div>
        </div>
      </div>

      <div class="person-right">
        <!-- 基本信息 -->
        <div
          id="section-basic"
          class="person-base app-surface p-20"
          :class="{ 'highlight-section': currentSection === 'basic' }"
          @click="currentSection = 'basic'"
        >
          <div class="person-title">
            <div class="title-bar"></div>
            基本信息
          </div>
          <div class="form-grid gap-18">
            <div class="form-group full-row">
              <div class="input-label">全名</div>
              <a-input v-model:value="personInfo.name" class="custom-input input-h" placeholder="请输入姓名" readonly />
            </div>
            <div class="form-group full-row">
              <div class="input-label">联系电话</div>
              <a-input
                v-model:value="personInfo.phone"
                class="custom-input input-h"
                placeholder="请输入电话"
                readonly
              />
            </div>
          </div>
        </div>

        <!-- 账号安全 -->
        <div
          id="section-security"
          class="person-base app-surface p-20 mt-20"
          :class="{ 'highlight-section': currentSection === 'security' }"
          @click="currentSection = 'security'"
        >
          <div class="person-title">
            <div class="title-bar"></div>
            账号安全
          </div>
          <div class="form-group mb-20">
            <div class="input-label">当前密码</div>
            <a-input-password
              v-model:value="passwordForm.oldPassword"
              class="custom-input"
              placeholder="请输入当前密码"
            />
          </div>
          <div class="form-grid gap-18">
            <div class="form-group">
              <div class="input-label">新密码</div>
              <a-input-password
                v-model:value="passwordForm.newPassword"
                class="custom-input"
                placeholder="设置新密码"
              />
            </div>
            <div class="form-group">
              <div class="input-label">确认新密码</div>
              <a-input-password
                v-model:value="passwordForm.confirmPassword"
                class="custom-input"
                placeholder="再次输入新密码"
              />
            </div>
          </div>
          <div class="flex justify-end mt-20">
            <a-button
              type="primary"
              shape="round"
              class="primary-btn"
              :loading="resetLoading"
              @click="handleResetPassword"
            >
              <template #icon>
                <Icon icon="mynaui:save" style="margin-right: 4px; vertical-align: -2px" />
              </template>
              确认修改
            </a-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getPublicKey, resetPassword } from '@/api/login'
import { encryptPassword } from '@/utils/encrypt'
import { getUserBaseInfo } from '@/services/storage'
import useAuth from '@/utils/auth'
import { Icon } from '@iconify/vue'
import { message, Modal } from 'ant-design-vue'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const auth = useAuth()
const currentSection = ref('basic')
const resetLoading = ref(false)

const scrollToSection = (section: string) => {
  currentSection.value = section
  const element = document.getElementById(`section-${section}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const userBaseInfo = getUserBaseInfo()

const personInfo = reactive({
  name: String(userBaseInfo?.teacherName ?? ''),
  icon: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher',
  phone: String(userBaseInfo?.phoneNumber ?? ''),
  certId: String(userBaseInfo?.teacherId ?? ''),
  userName: String(userBaseInfo?.userName ?? ''),
  subjectName: String(userBaseInfo?.subjectName ?? ''),
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,10}$/

const validatePasswordForm = () => {
  const oldPwd = String(passwordForm.oldPassword || '')
  const newPwd = String(passwordForm.newPassword || '')
  const confirmPwd = String(passwordForm.confirmPassword || '')

  if (!oldPwd || !newPwd || !confirmPwd) return { type: 'warning' as const, msg: '请填写完整的密码信息' }
  if (!passwordPolicy.test(newPwd))
    return { type: 'warning' as const, msg: '新密码需为8-10位，数字+大写字母+小写字母组合' }
  if (newPwd !== confirmPwd) return { type: 'error' as const, msg: '两次输入的新密码不一致' }
  if (newPwd === oldPwd) return { type: 'warning' as const, msg: '新密码不能与原密码相同' }
  return null
}

async function handleResetPassword() {
  const err = validatePasswordForm()
  if (err) {
    if (err.type === 'warning') message.warning(err.msg)
    else message.error(err.msg)
    return
  }

  Modal.confirm({
    title: '确认修改密码',
    content: '修改密码后需要重新登录，是否继续？',
    okText: '确认修改',
    cancelText: '取消',
    async onOk() {
      try {
        resetLoading.value = true

        // 1. 获取公钥
        const publicKey = await getPublicKey()

        // 2. 加密旧密码和新密码
        const encryptedOldPassword = encryptPassword(passwordForm.oldPassword, publicKey)
        const encryptedNewPassword = encryptPassword(passwordForm.newPassword, publicKey)

        // 3. 调用重置密码 API
        await resetPassword({
          oldPassword: encryptedOldPassword,
          newPassword: encryptedNewPassword,
        })

        message.success('密码修改成功，请重新登录')

        // Clear auth and redirect
        await auth.logout()
        sessionStorage.clear()
        document.cookie.split(';').forEach(c => {
          document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
        })

        router.push('/login')
      } catch (error) {
        console.error(error)
        return Promise.reject(error)
      } finally {
        resetLoading.value = false
      }
    },
  })
}
</script>

<style scoped lang="scss">
.person {
  width: 1200px;
  margin: 0 auto;
  padding-bottom: 20px;

  .person-header {
    height: 40px;
    h1 {
      font-size: 28px;
      font-weight: 700;
      color: #333;
      margin: 0;
    }
  }

  .person-body {
    display: flex;
    gap: 24px;
    align-items: flex-start;
  }
  .person-left {
    width: 33%;
    flex-shrink: 0;
  }
  .person-right {
    flex: 1;
    min-width: 0;
  }

  .person-profile {
    .avatar-wrapper {
      margin-bottom: 10px;
    }
    icon {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .tags .tag-item {
      height: 28px;
      padding: 0 12px;
      border-radius: 6px;
      font-size: 12px;
    }

    h3 + p {
      color: rgb(124 117 112);
    }
    .tag-gray {
      background: rgb(242 235 230);
      color: rgb(124 117 112);
    }
    .tag-green {
      background: #e6f7f4;
      color: #00b578;
    }
  }

  .divider {
    height: 1px;
    background: #f3f4f6;
    margin: 10px 20px;
  }

  .person-nav .nav-item {
    height: 48px;
    padding: 0 16px;
    border-radius: 8px;
    margin-bottom: 8px;
    cursor: pointer;
    color: #666;
    font-weight: 500;
    transition: all 0.2s;
    &:hover {
      background: #fafafa;
    }
    &.active {
      background: #fff3eb;
      color: #f47933;
    }
  }

  /* Right Side Cards */
  .person-base {
    background: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    margin-bottom: 24px;
    border: 2px solid transparent;
    transition: all 0.3s ease;

    &.highlight-section {
      border-color: #f47933;
      box-shadow: 0 0 0 4px rgba(244, 121, 51, 0.1);
    }
  }

  .person-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    .title-bar {
      width: 4px;
      height: 20px;
      background: #f47933;
      border-radius: 2px;
      margin-right: 12px;
    }
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 24px;
    row-gap: 24px;
  }
  .full-row {
    grid-column: 1 / -1;
  }
}
</style>
