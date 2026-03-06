<template>
  <div :class="['toast', type, { visible }]">
    <div class="toast-icon">{{ icon }}</div>
    <div class="toast-message">{{ message }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps<{
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}>();

const visible = ref(false);

const icon = {
  info: 'ℹ️',
  success: '✅',
  warn: '⚠️',
  error: '❌'
}[props.type];

onMounted(() => {
  setTimeout(() => {
    visible.value = true;
  }, 10);
});
</script>

<style scoped>
.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: var(--bg-card);
  border-left: 4px solid var(--accent);
  border-radius: var(--radius-sm);
  color: var(--text-main);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  margin-bottom: 10px;
  transform: translateX(100%);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  pointer-events: all;
  min-width: 250px;
  backdrop-filter: blur(10px);
}

.toast.visible {
  transform: translateX(0);
  opacity: 1;
}

.toast.success { border-left-color: var(--success); }
.toast.warn { border-left-color: var(--warning); }
.toast.error { border-left-color: var(--danger); }

.toast-icon {
  font-size: 1.2rem;
}

.toast-message {
  font-size: 0.9rem;
  font-weight: 500;
}
</style>
