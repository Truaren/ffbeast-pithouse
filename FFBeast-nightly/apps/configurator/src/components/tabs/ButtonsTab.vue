<template>
  <div class="buttons-tab">
    <div class="buttons-grid">
      <div 
        v-for="(mode, index) in buttonModes" 
        :key="index" 
        class="button-card"
      >
        <span class="btn-label">{{ $t('buttons.label') }} {{ index + 1 }}</span>
        <ThemedSelect 
          :model-value="mode" 
          :options="translatedModeOptions" 
          :disabled="!isConnected"
          @change="(v) => updateButtonMode(index, v)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHardwareStore } from '../../stores/hardware';
import ThemedSelect from '@shared/components/atoms/ThemedSelect.vue';

const store = useHardwareStore();
const { t } = useI18n();

const buttonModes = computed(() => store.gpio?.button_mode ?? new Array(32).fill(0));
const isConnected = computed(() => store.isConnected);

const modeOptions = [
  { label: 'modes.btn.none', value: 0 },
  { label: 'modes.btn.normal', value: 1 },
  { label: 'modes.btn.inverted', value: 2 },
  { label: 'modes.btn.pulse', value: 3 },
];

const translatedModeOptions = computed(() => 
  modeOptions.map(opt => ({ ...opt, label: t(opt.label) }))
);

const updateButtonMode = async (index: number, value: string | number) => {
  if (!isConnected.value || !store.gpio) return;
  
  const numValue = Number(value);
  const newModes = [...buttonModes.value];
  newModes[index] = numValue;
  
  try {
    await store.updateGPIO({
      button_mode: newModes
    });
  } catch (err) {
    console.error(`Failed to update Button ${index + 1} mode:`, err);
  }
};
</script>

<style scoped>
.buttons-tab {
  padding: var(--content-padding);
}

.buttons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
}

.button-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1rem;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  transition: all 0.2s ease;
}

.button-card:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
