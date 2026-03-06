<template>
  <div class="monitor-tab">
    <div class="top-row">
      <WheelVisual :position="currentPosition" />
      <div class="monitor-controls">
        <TorqueIndicator :torque="currentTorque" />
        <div class="control-card">
          <div class="control-group">
            <span class="label">{{ $t('labels.ffb_active') }}</span>
            <ThemedSwitch 
              v-model="ffbEnabled" 
              help-key="help.force_enabled"
              @change="toggleFFB" 
            />
          </div>
          <StatusBadge 
            :text="store.isConnected ? $t('status.connected') : $t('status.disconnected')"
            :variant="store.isConnected ? 'success' : 'error'"
            :pulsing="!store.isConnected"
          />
        </div>
      </div>
    </div>

    <BaseCard v-if="uiStore.settings.debugMode" :title="$t('labels.raw_data')" class="debug-panel">
      <div class="debug-grid">
        <div class="debug-item">
          <span class="d-label">Position:</span>
          <span class="d-value">{{ currentPosition }}</span>
        </div>
        <div class="debug-item">
          <span class="d-label">Torque:</span>
          <span class="d-value">{{ currentTorque }}</span>
        </div>
        <div class="debug-item">
          <span class="d-label">Buttons (HEX):</span>
          <span class="d-value">0x{{ currentButtons.toString(16).toUpperCase().padStart(8, '0') }}</span>
        </div>
        <div class="debug-item wide">
          <span class="d-label">ADC Values:</span>
          <span class="d-value font-mono">[{{ analogValues.join(', ') }}]</span>
        </div>
      </div>
    </BaseCard>

    <div class="middle-row">
      <AnalogMonitor :values="analogValues" :pinModes="pinModes" />
      <ButtonsGrid :buttons="currentButtons" />
    </div>

    <BaseCard v-if="uiStore.settings.debugMode" :title="$t('labels.backend_logs')" class="bottom-row">
      <LogsWidget :logs="logs" />
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useHardwareStore } from '../../stores/hardware';
import { useLogStore } from '../../stores/logs';
import { useUIStore } from '../../stores/ui';
import { useHardwareStream } from '@shared/composables/useHardwareStream';
import WheelVisual from '../monitor/WheelVisual.vue';
import TorqueIndicator from '../monitor/TorqueIndicator.vue';
import AnalogMonitor from '../monitor/AnalogMonitor.vue';
import ButtonsGrid from '../monitor/ButtonsGrid.vue';
import LogsWidget from '../monitor/LogsWidget.vue';
import ThemedSwitch from '@shared/components/atoms/ThemedSwitch.vue';
import StatusBadge from '@shared/components/atoms/StatusBadge.vue';
import BaseCard from '../common/BaseCard.vue';

const store = useHardwareStore();
const logStore = useLogStore();
const uiStore = useUIStore();
const hardwareStream = useHardwareStream();

const { logs } = storeToRefs(logStore);

const currentPosition = computed(() => hardwareStream.status.value?.position ?? 0);
const currentTorque = computed(() => hardwareStream.status.value?.torque ?? 0);
const currentButtons = computed(() => hardwareStream.status.value?.buttons ?? 0);
const analogValues = computed(() => hardwareStream.status.value?.adc ?? [0, 0, 0, 0, 0, 0, 0, 0]);
const pinModes = computed(() => store.gpio?.pin_mode ?? []);

const ffbEnabled = computed({
  get: () => store.hardware?.force_enabled === 1,
  set: (val) => store.updateHW({ force_enabled: val ? 1 : 0 })
});

const toggleFFB = async (val: boolean) => {
  await store.updateHW({ force_enabled: val ? 1 : 0 });
};

onMounted(async () => {
    // Backend log listener handled globally in App.vue usually,
    // but ensured here if needed.
});
</script>

<style scoped>
.monitor-tab {
  padding: var(--content-padding);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.top-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.monitor-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.control-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(10px);
}

.control-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.control-group .label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-main);
}

.middle-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.debug-panel {
  margin-bottom: 0.5rem;
}

.debug-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}


.debug-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.debug-item.wide {
  grid-column: span 2;
}

.d-label {
  font-size: 0.75rem;
  color: var(--text-dim);
}

.d-value {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--accent);
}

.font-mono {
  font-family: var(--font-mono);
}
</style>
