<template>
  <div class="not-found">
    <h1>页面未找到</h1>
    <p class="desc">您访问的地址不存在或没有权限。</p>
    <router-link to="/">
      <a-button type="primary">返回首页</a-button>
    </router-link>
  </div>
</template>
<script setup lang="ts"></script>
<style scoped>
.not-found { padding: 32px; text-align: center; }
.not-found h1 { font-size: 20px; font-weight: 600; margin-bottom: 12px; }
.desc { color: var(--color-text-2, #5c5c5c); margin-bottom: 16px; }
</style>