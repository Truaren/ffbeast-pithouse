<template>
  <div 
    v-show="store.tooltip.show" 
    class="tooltip"
    :style="{ left: store.tooltip.x + 'px', top: store.tooltip.y + 'px' }"
  >
    {{ store.tooltip.text }}
  </div>
</template>

<script setup lang="ts">
import { useUIStore } from '../../stores/ui';

const store = useUIStore();
</script>

<style scoped>
.tooltip {
  position: fixed;
  z-index: 2000;
  background: rgba(10, 10, 10, 0.95);
  border: 1px solid var(--border-bright);
  color: var(--text-main);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  pointer-events: none;
  max-width: 250px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  transform: translate(15px, 15px);
  white-space: pre-wrap;
}
</style>
