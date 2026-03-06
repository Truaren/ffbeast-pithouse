<template>
  <div class="toast-container">
    <TransitionGroup name="toast-list">
      <BaseToast 
        v-for="toast in store.toasts" 
        :key="toast.id" 
        :message="toast.message" 
        :type="toast.type"
      />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useUIStore } from '../../stores/ui';
import BaseToast from './BaseToast.vue';

const store = useUIStore();
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
  display: flex;
  flex-direction: column-reverse; /* List grows upwards */
  pointer-events: none;
}

.toast-list-enter-from,
.toast-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.toast-list-leave-active {
  position: absolute;
}
</style>
