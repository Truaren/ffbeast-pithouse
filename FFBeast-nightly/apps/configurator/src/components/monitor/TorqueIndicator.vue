<template>
  <section class="status-card">
    <div class="card-header">
      <h3>{{ $t('status.card_title') }}</h3>
    </div>
    <div class="metrics-grid">
      <div class="metric">
        <label>{{ $t('labels.torque') }}</label>
        <div class="bar-container">
          <div class="bar torque-bar" :style="{ width: Math.abs(torquePercent) + '%' }"></div>
        </div>
        <div class="torque-info">
      <div class="torque-value">{{ torquePercent.toFixed(1) }}%</div>
      <div class="torque-nm">{{ torqueNm.toFixed(2) }} Nm</div>
    </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useHardwareStore } from '../../stores/hardware';

const props = defineProps<{
  torque: number;
}>();

const store = useHardwareStore();

// Scale torque: 10000 = 100%
const torquePercent = computed(() => {
  return Math.min(100, (Math.abs(props.torque) / 10000.0) * 100);
});

// Convert to Nm considering power_limit
// Motor max: 15 Nm (typical for high-torque FFB motor)
// Actual max = (power_limit / 100) * 15 Nm
const MOTOR_MAX_TORQUE_NM = 15;
const powerLimit = computed(() => store.hardware?.power_limit ?? 100);
const torqueNm = computed(() => {
  const actualMaxTorque = (powerLimit.value / 100) * MOTOR_MAX_TORQUE_NM;
  return (torquePercent.value / 100) * actualMaxTorque;
});
</script>

<style scoped>
section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1rem;
  backdrop-filter: blur(10px);
}

.card-header h3 {
  font-size: 0.85rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 1rem;
}

.bar-container {
  height: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  margin: 10px 0;
  overflow: hidden;
}

.bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.1s ease;
}

.torque-bar {
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent-glow);
}

.torque-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.torque-value {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-main);
}

.torque-nm {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--accent);
}

.metric-value {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--text-dim);
}

label {
  font-size: 0.9rem;
  color: var(--text-main);
}
</style>
