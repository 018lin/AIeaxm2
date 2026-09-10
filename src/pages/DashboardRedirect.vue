<template>
  <div class="p-8 text-center text-base-content/70">正在跳转到仪表盘...</div>
</template>
<script setup lang="ts">
import { ROUTES } from '@/router/routes'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const hasRouter = !!router && typeof (router as any).replace === 'function'

onMounted(() => {
  const isAuthed = localStorage.getItem('isAuthed') === 'true' || Boolean(localStorage.getItem('accessToken'))
  if (!isAuthed) {
    if (hasRouter) router.replace('/auth/login')
    else window.location.assign('/auth/login')
    return
  }
  const selectedPortalRole = localStorage.getItem('selectedPortalRole')
  const target = selectedPortalRole === 'student' ? ROUTES.STUDENT_DASHBOARD : ROUTES.TEACHER_DASHBOARD
  if (hasRouter) router.replace(target)
  else window.location.assign(target)
})
</script>
