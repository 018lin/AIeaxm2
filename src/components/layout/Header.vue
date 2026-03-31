<template>
  <div class="app-header">
    <div class="left">
      <div class="brand" @click="goHome">
        <div class="brand-mark">
          <ReadFilled />
        </div>
        <div class="brand-text">
          <div class="brand-name">{{ schoolName }}</div>
        </div>
      </div>
    </div>

    <nav class="center no-scrollbar" aria-label="Teacher top navigation">
      <button
        v-for="item in teacherTopNav"
        :key="item.key"
        type="button"
        class="nav-item"
        :class="{ active: isNavActive(item) }"
        @click="goNav(item.path)"
      >
        <div class="nav-icon" :class="{ active: isNavActive(item) }">
          <component :is="item.icon" />
        </div>
        <div class="nav-label">{{ item.label }}</div>
      </button>
    </nav>

    <div class="right">
      <a-dropdown>
        <div class="user" @click.prevent>
          <a-avatar size="small" class="user-avatar">
            <UserOutlined />
          </a-avatar>
          <div class="user-meta">
            <div class="user-role">{{ teacherName }}</div>
            <a-tag size="small" color="orange" class="user-tag">教师端</a-tag>
          </div>
        </div>
        <template #overlay>
          <a-menu>
            <a-menu-item @click="goAdmin" v-if="isSchoolAdmin">
              <a href="javascript:;"><InteractionOutlined />&nbsp;&nbsp;管理后台</a>
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
  </div>
</template>

<script setup lang="ts">
import { ROUTES } from '@/router/routes'
import { getUserBaseInfo } from '@/services/storage'
import useAuth from '@/utils/auth'
import {
  // ApartmentOutlined,
  BankOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  FileDoneOutlined,
  FileExcelOutlined,
  FileSyncOutlined,
  HomeOutlined,
  InteractionOutlined,
  LogoutOutlined,
  ReadFilled,
  UserOutlined,
} from '@ant-design/icons-vue'
import { useLocalStorage } from '@vueuse/core'
import { message, Modal } from 'ant-design-vue'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const { logout } = useAuth()
const router = useRouter()
const route = useRoute()

const parsedUserInfo = getUserBaseInfo()
const teacherName = ref(parsedUserInfo?.teacherName || '未知用户') // 当前登陆用户名
const schoolName = ref(parsedUserInfo?.schoolName) // 当前登陆学校名
const roles = useLocalStorage<string[]>('roles', [])
const isSchoolAdmin = roles.value.includes('tenant_admin') // 是否管理员

type NavItem = { key: string; label: string; path: string; icon: any }

const teacherTopNav: NavItem[] = [
  { key: 'dashboard', label: '首页', path: ROUTES.TEACHER_DASHBOARD, icon: HomeOutlined },
  { key: 'examination', label: '智能组卷', path: ROUTES.TEACHER_EXAMINATION, icon: FileSyncOutlined },
  { key: 'homework', label: '智能批改', path: ROUTES.TEACHER_HOMEWORK, icon: FileDoneOutlined },
  { key: 'recompose', label: '错题重组', path: ROUTES.TEACHER_HOMEWORK_RECOMPOSE, icon: FileExcelOutlined },
  // { key: 'mistake_book', label: '个性化错题本', path: ROUTES.TEACHER_MISTAKES, icon: FileExcelOutlined },

  // { key: 'layered', label: '分层作业', path: ROUTES.TEACHER_LAYERED, icon: ApartmentOutlined },
  // { key: 'composition', label: '语文作文', path: ROUTES.TEACHER_COMPOSITION, icon: ProfileOutlined },
  { key: 'reports', label: '分析报告', path: ROUTES.TEACHER_REPORTS, icon: BarChartOutlined },
  { key: 'question_bank', label: '题库管理', path: ROUTES.TEACHER_QUESTION_BANK, icon: DatabaseOutlined },
  { key: 'school', label: '我的学校', path: ROUTES.TEACHER_SCHOOL, icon: BankOutlined },
]

function goHome() {
  router.push(ROUTES.TEACHER_DASHBOARD).catch(() => {})
}

function goAdmin() {
  router.push(ROUTES.ADMIN_EDUCATION_CLASS).catch(() => {})
}

function goPersonInfo() {
  router.push(ROUTES.TEACHER_PERSON_INFO).catch(() => {})
}

function goNav(path: string) {
  router.push(path).catch(() => {})
}

function isNavActive(item: NavItem) {
  const p = route.path
  if (p === item.path) return true
  if (item.path !== '/' && p.startsWith(item.path + '/')) return true
  return false
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
        await logout() // useAuth 的 logout 已经包含了 clearUserBaseInfo
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
.app-header {
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 0;
  background: #f8f7f6;
  width: 100%;
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

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.nav-item {
  border: 0;
  background: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  width: 88px;
  height: 70.4px;
  color: rgb(153 107 77 / 0.8);
  border-radius: 10px;

  &:hover {
    background-color: rgb(255 255 255 / 0.6);
    color: rgb(236 122 46);

    .nav-icon {
      transform: translateY(-1px);
      background-color: rgb(255 237 213 / var(--tw-bg-opacity, 1));
    }
  }

  &.active {
    color: #fff;
    background: linear-gradient(135deg, var(--td-accent) 0%, #ff9a4d 100%);
  }
}

.nav-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
  transition:
    transform 160ms ease,
    background 160ms ease,
    color 160ms ease;
  font-size: 16px;

  &.active {
    color: #fff;
    background-color: rgb(255 255 255 / 0.2);
    backdrop-filter: blur(4px);
  }
}

.center {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  overflow-x: auto;
  width: 65%;
  min-width: 600px;
  justify-content: space-between;

  .nav-icon {
    width: 37px;
    height: 37px;
    background: rgba(153, 107, 77, 0.1);
    border: none;
    box-shadow: none;

    &.active {
      color: #fff;
      background-color: rgb(255 255 255 / 0.2);
      backdrop-filter: blur(4px);
    }
  }
}

.nav-label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.2px;
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
  border: 3px solid #fff;
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
    border: 2px solid #fff;
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
