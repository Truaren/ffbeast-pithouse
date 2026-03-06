<template>
  <div class="pins-tab">
    <div class="pins-grid">
      <div 
        v-for="(mode, index) in pinModes" 
        :key="index" 
        class="pin-card"
      >
        <span class="pin-label">{{ $t('labels.pin') }} {{ index }}</span>
        <ThemedSelect 
          :model-value="mode" 
          :options="translatedModeOptions" 
          :disabled="!isConnected"
          @change="(v) => updatePinMode(index, v)"
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

const pinModes = computed(() => store.gpio?.pin_mode ?? new Array(10).fill(0));
const isConnected = computed(() => store.isConnected);

const modeOptions = [
  { label: 'pins.modes.none', value: 0 },
  { label: 'pins.modes.gpio', value: 1 },
  { label: 'pins.modes.analog', value: 2 },
  { label: 'pins.modes.spi_cs', value: 3 },
  { label: 'pins.modes.spi_sck', value: 4 },
  { label: 'pins.modes.spi_miso', value: 5 },
  { label: 'pins.modes.enable_effects', value: 6 },
  { label: 'pins.modes.center_reset', value: 7 },
  { label: 'pins.modes.braking_pwm', value: 8 },
  { label: 'pins.modes.effect_led', value: 9 },
  { label: 'pins.modes.reboot', value: 10 },
];

const translatedModeOptions = computed(() => 
  modeOptions.map(opt => ({ ...opt, label: t(opt.label) }))
);

const updatePinMode = async (index: number, value: string | number) => {
  if (!isConnected.value || !store.gpio) return;
  
  const numValue = Number(value);
  const newModes = [...pinModes.value];
  newModes[index] = numValue;
  
  try {
    await store.updateGPIO({
      pin_mode: newModes
    });
  } catch (err) {
    console.error(`Failed to update Pin ${index} mode:`, err);
  }
};
</script>

<style scoped>
.pins-tab {
  padding: var(--content-padding);
}

.pins-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pin-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1rem;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.2s ease;
}

.pin-card:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.pin-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
