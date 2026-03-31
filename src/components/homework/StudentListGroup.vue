<template>
  <div class="student-group" :class="groupClass" v-if="users.length">
    <span class="label">{{ label }}</span>
    <div class="names-wrapper">
      <a-popover
        v-for="user in users"
        :key="user.name"
        placement="top"
        overlayClassName="answer-popover"
        trigger="click"
        :open="popoverStates[user.name]?.hover || popoverStates[user.name]?.pinned"
        @openChange="(v: boolean) => handleOpenChange(v, user.name)"
      >
        <template #content>
          <div class="popover-image-box" @click="$emit('preview', user.answerImageUrl, user.name)">
            <img :src="user.answerImageUrl" alt="答案" />
            <div class="click-hint">点击查看大图</div>
          </div>
        </template>
        <span
          class="name-tag"
          @mouseenter="handleMouseEnter(user.name)"
          @mouseleave="handleMouseLeave(user.name)"
          @click.stop="handleNameClick(user.name)"
          >{{ user.name }}</span
        >
      </a-popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ScreenRecordUser } from '@/types/homework'
import { reactive } from 'vue'

defineProps<{
  label: string
  users: ScreenRecordUser[]
  groupClass: string
}>()

defineEmits<{
  (e: 'preview', url: string | undefined, name: string): void
}>()

const popoverStates = reactive<Record<string, { hover: boolean; pinned: boolean }>>({})

const ensureState = (name: string) => {
  if (!popoverStates[name]) {
    popoverStates[name] = { hover: false, pinned: false }
  }
  return popoverStates[name]!
}

const handleMouseEnter = (name: string) => {
  const state = ensureState(name)
  state.hover = true
}

const handleMouseLeave = (name: string) => {
  const state = ensureState(name)
  state.hover = false
}

const handleNameClick = (name: string) => {
  const state = ensureState(name)
  const wasPinned = state.pinned
  setTimeout(() => {
    if (wasPinned) {
      state.pinned = false
      state.hover = false
    } else {
      state.pinned = true
    }
  }, 50)
}

const handleOpenChange = (open: boolean, name: string) => {
  const state = ensureState(name)
  if (!open) {
    state.pinned = false
    state.hover = false
  }
}
</script>

<style scoped lang="scss">
.student-group {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  line-height: 1.6;
  font-size: 12px;

  .label {
    flex-shrink: 0;
    font-weight: 600;
    width: 70px;
  }

  .names-wrapper {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .name-tag {
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      transition: all 0.2s;
      color: #fff;

      &:hover {
        background: rgba(0, 0, 0, 0.05);
        color: var(--color-primary);
      }

      &.ant-popover-open {
        color: var(--color-primary);
      }
    }
  }

  &.right .label {
    color: var(--color-success);
  }
  &.wrong .label {
    color: var(--color-error);
  }
  &.other .label {
    color: var(--color-primary);
  }
  &.half .label {
    color: var(--color-primary);
  }
}

.popover-image-box {
  position: relative;
  width: 300px;
  cursor: zoom-in;
  border-radius: 4px;
  overflow: hidden;

  img {
    width: 100%;
    height: auto;
    display: block;
  }

  .click-hint {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    font-size: 12px;
    text-align: center;
    padding: 4px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover .click-hint {
    opacity: 1;
  }
}
</style>
