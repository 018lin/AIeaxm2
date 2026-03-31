<template>
  <a-layout class="app-layout">
    <Header />
    <div class="main">
      <Sidebar
        v-if="sidebarMenu.length"
        :menu="sidebarMenu"
        :hasChildren="hasSidebar"
        :parent="activeTop?.label || ''"
      />
      <div class="content" ref="contentRef" :class="{ 'scroll-y': route.meta.scrollable }">
        <router-view :key="route.fullPath" />
        <div
          ref="basketRef"
          class="basket-float"
          :class="[basketCount > 0 ? 'has-items' : 'empty', { dragging }]"
          :style="{ left: basketPos.x + 'px', top: basketPos.y + 'px' }"
          @mousedown="startDrag"
          @click="toggleBasketPanel"
        >
          <div class="basket-pill" aria-hidden="true">
            <span class="basket-pill-text">试题篮</span>
          </div>

          <a-badge :count="basketCount" class="basket-badge">
            <div class="basket-circle" aria-label="试题篮">
              <svg class="basket-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6 6h15l-1.5 9h-12z" />
                <circle cx="9" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
              </svg>
            </div>
          </a-badge>
        </div>
        <QuestionBasketDrawer v-model:open="basketOpen" @distribute="openDistribute" />

        <ForcePasswordModal v-model:open="forcePwdOpen" :loading="forcePwdLoading" @submit="handleForceResetPassword" />
      </div>
    </div>
  </a-layout>
</template>
<script setup lang="ts">
import { getPublicKey, resetPassword } from '@/api/login'
import ForcePasswordModal from '@/components/common/ForcePasswordModal.vue'
import QuestionBasketDrawer from '@/components/questionBasket/QuestionBasketDrawer.vue'
import { TEACHER_MENU_ITEMS } from '@/router/menu'
import { questionBasketService } from '@/services/questionBasket'
import { getUserBaseInfo } from '@/services/storage'
import useAuth from '@/utils/auth'
import { encryptPassword } from '@/utils/encrypt'
import { useLocalStorage } from '@vueuse/core'
import { message } from 'ant-design-vue'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Header from '../components/layout/Header.vue'
import Sidebar from '../components/layout/Sidebar.vue'

const router = useRouter()
const auth = useAuth()

const forcePwdOpen = ref(false)
const forcePwdLoading = ref(false)

type ForcePwdForm = { oldPassword: string; newPassword: string; confirmPassword: string }

const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,10}$/

const validateForcePwd = (form: ForcePwdForm) => {
  const oldPwd = String(form.oldPassword || '')
  const newPwd = String(form.newPassword || '')
  const confirmPwd = String(form.confirmPassword || '')

  if (!oldPwd || !newPwd || !confirmPwd) return '请填写完整的密码信息'
  if (!passwordPolicy.test(newPwd)) return '新密码需为8-10位，数字+大写字母+小写字母组合'
  if (newPwd !== confirmPwd) return '两次输入的新密码不一致'
  if (newPwd === oldPwd) return '新密码不能与原密码相同'
  return ''
}

const checkForcePwd = () => {
  const base = getUserBaseInfo()
  if (base?.useDefaultPwd === true) {
    forcePwdOpen.value = true
  }
}

async function handleForceResetPassword(form: ForcePwdForm) {
  const err = validateForcePwd(form)
  if (err) {
    message.error(err)
    return
  }

  try {
    forcePwdLoading.value = true
    const publicKey = await getPublicKey()
    const encryptedOldPassword = encryptPassword(form.oldPassword, publicKey)
    const encryptedNewPassword = encryptPassword(form.newPassword, publicKey)

    await resetPassword({
      oldPassword: encryptedOldPassword,
      newPassword: encryptedNewPassword,
    })

    message.success('密码修改成功，请重新登录')

    await auth.logout()
    sessionStorage.clear()
    document.cookie.split(';').forEach(c => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
    })

    router.push('/auth/login').catch(() => {})
  } catch (error) {
    console.error(error)
  } finally {
    forcePwdLoading.value = false
  }
}

const roles = useLocalStorage<string[]>('roles', [])

type MenuItem = {
  label: string
  path: string
  icon?: string
  permission?: string
  children?: MenuItem[]
  demoOnly?: boolean
}

const filterDemoOnlyMenus = (items: MenuItem[]) => {
  const isDemo = roles.value.includes('demo')
  const walk = (list: MenuItem[]): MenuItem[] => {
    return list
      .filter(it => (isDemo ? true : !it.demoOnly))
      .map(it => ({
        ...it,
        children: Array.isArray(it.children) ? walk(it.children) : it.children,
      }))
  }
  return walk(items)
}

// 根据角色选择对应的菜单配置
const getRoleMenu = () => {
  return filterDemoOnlyMenus(TEACHER_MENU_ITEMS as unknown as MenuItem[]) as any
}

const route = useRoute()
const menu = computed(() => getRoleMenu() as any)

const activeTop = computed(() => {
  const p = route.path
  const teacherMenu = menu.value as unknown as MenuItem[]
  const parent = teacherMenu.find((m: MenuItem) => {
    if (m.path === p) return true
    const children = Array.isArray(m.children) ? m.children : []
    if (children.some((c: MenuItem) => c.path === p)) return true
    return children.some((c: MenuItem) =>
      Array.isArray(c.children) ? c.children.some((cc: MenuItem) => cc.path === p) : false
    )
  })
  return parent || teacherMenu[0] || null
})

const sidebarMenu = computed(() => {
  const children = ((activeTop.value as MenuItem | null)?.children ?? []) as any[]
  return children.length >= 2 ? (children as any) : ([] as any)
})

const hasSidebar = computed(() => {
  return Array.isArray(sidebarMenu.value) && sidebarMenu.value.length > 0
})

const contentRef = ref<HTMLElement | null>(null)

watch(
  () => route.fullPath,
  () => {
    nextTick(() => {
      const el = contentRef.value
      if (!el) return
      el.scrollTop = 0
    })
  }
)

if (import.meta.env.DEV) {
  onMounted(() => {
    const el = contentRef.value
    console.info('[layout] content mounted', {
      width: el?.offsetWidth,
      height: el?.offsetHeight,
      display: el ? getComputedStyle(el).display : undefined,
    })
  })
}

// 试题篮浮窗
const basketOpen = ref(false)
// const basketItems = questionBasketService.basketItems
const basketCount = questionBasketService.totalCount
const toggleBasketPanel = () => {
  if (hasMoved.value) return
  basketOpen.value = !basketOpen.value
}
const basketRef = ref<HTMLElement | null>(null)
const basketSize = { w: 72, h: 72 }
const margin = { left: 5, top: 5, right: 20, bottom: 5 }
const basketPos = ref({ x: 0, y: 0 })
const dragging = ref(false)
const hasMoved = ref(false)
let dragOffset = { x: 0, y: 0 }
let dragStartX = 0
let dragStartY = 0

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))
const initBasketPos = () => {
  basketPos.value.x = window.innerWidth - margin.right - basketSize.w
  basketPos.value.y = window.innerHeight - margin.bottom - basketSize.h
}

const startDrag = (e: MouseEvent) => {
  // Prevent default browser drag behavior (like image dragging)
  e.preventDefault()

  const rect = basketRef.value?.getBoundingClientRect()
  if (rect) {
    dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  } else {
    dragOffset = { x: 0, y: 0 }
  }
  dragging.value = true
  hasMoved.value = false
  dragStartX = e.clientX
  dragStartY = e.clientY
  document.body.style.userSelect = 'none' // Prevent text selection
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', endDrag)
}

const onDragMove = (e: MouseEvent) => {
  if (!dragging.value) return

  if (!hasMoved.value) {
    const moveX = Math.abs(e.clientX - dragStartX)
    const moveY = Math.abs(e.clientY - dragStartY)
    if (moveX > 3 || moveY > 3) {
      hasMoved.value = true
    }
  }

  const maxX = window.innerWidth - margin.right - basketSize.w
  const maxY = window.innerHeight - margin.bottom - basketSize.h
  basketPos.value.x = clamp(e.clientX - dragOffset.x, margin.left, maxX)
  basketPos.value.y = clamp(e.clientY - dragOffset.y, margin.top, maxY)
}

const endDrag = () => {
  dragging.value = false
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', endDrag)
}
const distributeOpen = ref(false)

const handleResize = () => {
  const maxX = window.innerWidth - margin.right - basketSize.w
  const maxY = window.innerHeight - margin.bottom - basketSize.h
  basketPos.value.x = clamp(basketPos.value.x, margin.left, maxX)
  basketPos.value.y = clamp(basketPos.value.y, margin.top, maxY)
}

onMounted(() => {
  initBasketPos()
  window.addEventListener('resize', handleResize)
  checkForcePwd()
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', endDrag)
  window.removeEventListener('resize', handleResize)
})

const openDistribute = () => {
  if (basketCount.value === 0) {
    message.warning('试题篮为空')
    return
  }
  distributeOpen.value = true
}
</script>
<style scoped>
.app-layout {
  min-height: 100vh;
  background: none;
}
.main {
  display: flex;
  width: 100%;
  height: 100%;
  padding: 10px 20px;
  margin: 88px auto 0;
}
.sider-toggle {
  width: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  background: var(--color-bg-2, #fff);
  border-right: 1px solid var(--color-border-2, #e5e6eb);
  border-left: 1px solid var(--color-border-2, #e5e6eb);
}
.toggle-icon {
  color: #666;
  font-weight: 700;
}
.content {
  flex: 1;
  min-width: 0;
  position: relative;
  z-index: 0;
  overflow: hidden;
}
.content {
  height: var(--content-height);
}
.scroll-y {
  overflow-y: auto;
}
.basket-float {
  position: fixed;
  left: 5px;
  top: 5px;
  z-index: 1000;
  cursor: grab;
  width: 72px;
  height: 72px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;
}

.basket-float.dragging {
  cursor: grabbing;
  transition: none;
  /* Disable hover transform during drag to prevent jitter */
  transform: none !important;
}

.basket-float:active {
  transform: scale(0.96);
}

.basket-pill {
  position: absolute;
  right: 76px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  padding: 0 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.14);
  opacity: 0;
  transform: translateX(10px);
  pointer-events: none;
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.basket-pill-text {
  font-size: 14px;
  font-weight: 700;
  color: rgba(17, 24, 39, 0.9);
  white-space: nowrap;
}

.basket-circle {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2b2623;
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.28);
  transition:
    background 160ms ease,
    transform 160ms ease;
}

.basket-icon {
  width: 26px;
  height: 26px;
  line-height: 1;
  stroke: #fff;
  fill: none;
  stroke-width: 2;
}

.basket-float:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 46px rgba(15, 23, 42, 0.16);
}

.basket-float:hover .basket-pill {
  opacity: 1;
  transform: translateX(0);
}

.basket-float:hover .basket-circle {
  background: linear-gradient(135deg, #f37a2a 0%, #ff9a4d 100%);
}

.basket-badge :deep(.ant-badge-count) {
  background: #f5222d;
  box-shadow: 0 0 0 2px #fff;
}
</style>
