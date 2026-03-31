<template>
  <a-layout class="admin-layout">
    <AdminHeader />
    <a-layout>
      <AdminSider />
      <a-layout-content class="admin-content">
        <router-view :key="route.fullPath" />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import AdminHeader from '../components/adminLayout/AdminHeader.vue'
import AdminSider from '../components/adminLayout/AdminSider.vue'

const route = useRoute()
</script>

<style scoped lang="scss">
.admin-layout {
  height: 100vh;
  .admin-content {
    width: 100%;
    background: #f8f7f6;
    padding: 20px 0 0 20px;
    overflow: auto;
  }
}
</style>
