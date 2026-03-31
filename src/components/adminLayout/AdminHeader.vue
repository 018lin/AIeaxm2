<template>
  <a-layout-header class="admin-header">
    <div class="left">
      <div class="brand">
        <div class="brand-mark">
          <ReadFilled />
        </div>
        <div class="brand-text">
          <div class="brand-name">{{ schoolName }}</div>
        </div>
      </div>
    </div>
    <div class="right">
      <a-dropdown>
        <div class="user" @click.prevent>
          <a-avatar size="small" class="user-avatar">
            <UserOutlined />
          </a-avatar>
          <div class="user-meta">
            <div class="user-role">{{ teacherName }}</div>
            <a-tag size="small" color="orange" class="user-tag">管理后台</a-tag>
          </div>
        </div>
        <template #overlay>
          <a-menu>
            <a-menu-item @click="goHome">
              <a href="javascript:;"><InteractionOutlined />&nbsp;&nbsp;教师端</a>
            </a-menu-item>
            <a-menu-item @click="goPersonInfo">
              <a href="javascript:;"><UserOutlined />&nbsp;&nbsp;个人信息</a>
            </a-menu-item>
            <a-menu-item @click="onLogout">
              <a href="javascript:;"><LogoutOutlined />&nbsp;&nbsp;退出登录</a>
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </a-layout-header>
</template>

<script setup lang="ts">
import { ROUTES } from '@/router/routes'
import { getUserBaseInfo } from '@/services/storage'
import useAuth from '@/utils/auth'
import { InteractionOutlined, LogoutOutlined, ReadFilled, UserOutlined } from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const { logout } = useAuth()
const router = useRouter()

const parsedUserInfo = getUserBaseInfo()
const teacherName = ref(parsedUserInfo?.teacherName || '未知用户') // 当前登陆用户名
const schoolName = ref(parsedUserInfo?.schoolName) // 当前登陆学校名

function goHome() {
  router.push(ROUTES.TEACHER_DASHBOARD).catch(() => {})
}

function goPersonInfo() {
  router.push(ROUTES.TEACHER_PERSON_INFO).catch(() => {})
}

function onLogout() {
  Modal.confirm({
    title: '确认登出',
    content: '退出后需要重新登录，是否继续？',
    okText: '退出登录',
    cancelText: '取消',
    centered: true,
    async onOk() {
      try {
        await logout()
        message.success('登出成功')
        router.push(ROUTES.AUTH_LOGIN)
      } catch (error) {
        message.error('登出失败')
        console.error(error)
      }
    },
  })
}
</script>

<style scoped lang="scss">
.admin-header {
  height: 88px;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #f8f7f6;
}

.left,
.right {
  display: flex;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #fff;
  background: linear-gradient(135deg, var(--td-accent) 0%, #ff9a4d 100%);
}

.brand-name {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  max-width: 210px;
}

.right {
  gap: 10px;
}

.user {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.user-avatar {
  width: 40px;
  height: 40px;
  box-shadow: var(--app-shadow);
  border: 3px solid #eee4cf;
  overflow: visible;

  &::after {
    content: '';
    position: absolute;
    width: 12px;
    height: 12px;
    background: rgb(34 197 94);
    border-radius: 50%;
    right: 0px;
    bottom: 0px;
    border: 2px solid #eee4cf;
  }
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.user-role {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.1;
}

.user-tag {
  line-height: 1.3;
}
</style>
