<template>
  <section class="buttons-card">
    <div class="card-header">
      <h3>{{ $t('labels.digital_buttons') }}</h3>
    </div>
    <div class="buttons-grid">
      <div 
        v-for="n in 32" 
        :key="n" 
        :class="['button-dot', { active: isButtonActive(n-1) }]"
      >
        {{ n }}
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { isBitSet } from '../../utils/format';

const props = defineProps<{
  buttons: number;
}>();

const isButtonActive = (index: number) => {
  return isBitSet(props.buttons, index);
};
</script>

<style scoped>
section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  backdrop-filter: blur(10px);
}

.card-header h3 {
  font-size: 0.9rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 1.5rem;
}

.buttons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(35px, 1fr));
  gap: 10px;
}

.button-dot {
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--text-dim);
  transition: all 0.1s;
}

.button-dot.active {
  background: var(--accent-muted);
  border-color: var(--accent);
  color: var(--accent);
  box-shadow: 0 0 10px var(--accent-glow);
}
</style>
