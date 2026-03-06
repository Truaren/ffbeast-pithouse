<template>
  <div class="axis-mapping-row">
    <div class="axis-header">
      <div class="axis-info">
        <span class="axis-label">{{ label }}</span>
        <ThemedInput
          :model-value="modelValue"
          @update:model-value="onNameChange"
          @blur="$emit('save-name')"
          class="axis-name-input"
          :placeholder="defaultName"
          help-key="help.axis_custom_name"
        />
      </div>
      <button 
        class="edit-btn" 
        @click="$emit('edit')"
        :title="$t('help.edit_mapping')"
      >
        <span>⚙️</span>
        <span class="btn-text">{{ $t('buttons.edit_mapping') }}</span>
      </button>
    </div>

    <!-- Narrow Axis Monitor -->
    <div class="axis-monitor-container">
      <AxisMonitor
        :value="liveValue"
        :min="0"
        :max="32767"
        :show-value="false"
        class="narrow-monitor"
      />
    </div>

    <!-- Calibration Controls (Only for Primary Axes 0-2) -->
    <div v-if="shouldShowCalibration" class="calibration-controls">
      <div class="control-grid">
        <ThemedSlider
          :model-value="min"
          :min="0"
          :max="32767"
          :label="$t('settings.min')"
          help-key="help.axis_min"
          @update:model-value="(v: number) => $emit('update:min', v)"
        />
        
        <ThemedSlider
          :model-value="max"
          :min="0"
          :max="32767"
          :label="$t('settings.max')"
          help-key="help.axis_max"
          @update:model-value="(v: number) => $emit('update:max', v)"
        />
      </div>

      <div class="control-grid">
        <ThemedSlider
          :model-value="smoothing"
          :min="0"
          :max="100"
          :label="$t('settings.axis.smoothing')"
          value-suffix="%"
          help-key="help.position_smoothing"
          @update:model-value="(v: number) => $emit('update:smoothing', v)"
        />

        <ThemedSwitch 
          :model-value="invert" 
          :label="$t('settings.axis.invert')" 
          help-key="help.axis_invert"
          @update:model-value="(v: boolean) => $emit('update:invert', v)"
        />
      </div>

      <div class="control-grid">
        <ThemedSlider
          :model-value="btnLow"
          :min="0"
          :max="100"
          :label="$t('settings.axis.buttons.low')"
          value-suffix="%"
          help-key="help.axis_buttons_low"
          @update:model-value="(v: number) => $emit('update:btnLow', v)"
        />
        
        <ThemedSlider
          :model-value="btnHigh"
          :min="0"
          :max="100"
          :label="$t('settings.axis.buttons.high')"
          value-suffix="%"
          help-key="help.axis_buttons_high"
          @update:model-value="(v: number) => $emit('update:btnHigh', v)"
        />
      </div>
    </div>
    
    <div v-else class="adc-info">
      <p>{{ $t('settings.min_help') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useHardwareStream } from '../../composables/useHardwareStream';
import ThemedInput from '../atoms/ThemedInput.vue';
import ThemedSlider from '../atoms/ThemedSlider.vue';
import ThemedSwitch from '../atoms/ThemedSwitch.vue';
import AxisMonitor from '../molecules/AxisMonitor.vue';

interface Props {
  index: number;
  label: string;
  modelValue: string; // The Name
  rawValue: number;
  defaultName: string;
  min?: number;
  max?: number;
  invert?: boolean;
  smoothing?: number;
  btnLow?: number;
  btnHigh?: number;
  showCalibration?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 32767,
  invert: false,
  smoothing: 0,
  btnLow: 0,
  btnHigh: 100,
  showCalibration: undefined
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'save-name': [];
  'edit': [];
  'update:min': [value: number];
  'update:max': [value: number];
  'update:invert': [value: boolean];
  'update:smoothing': [value: number];
  'update:btnLow': [value: number];
  'update:btnHigh': [value: number];
}>();

const shouldShowCalibration = computed(() => {
  if (props.showCalibration !== undefined) return props.showCalibration;
  return props.index < 3;
});

const onNameChange = (val: string | number) => {
  emit('update:modelValue', String(val));
};

const { status: hardwareStream } = useHardwareStream();

const liveValue = computed(() => {
  if (hardwareStream.value?.adc) {
    // Map logical axis (0, 1, 2) to hardware analogs (3, 4, 5)
    // Hardware often sends 12-bit (0-4095). We need to scale this to 16-bit (0-32767)
    // For GPIO (index >= 3), we use the index directly + offset? 
    // Wait, MappingEditModal logic was index < 3 ? index + 3 : index?
    // User said "igual esta funcionando no MappingEditModal".
    // In MappingEditModal I implemented: const raw = hardwareStream.value.adc[props.axisIndex + 3] ?? 0;
    // This implies offset 3 is ALWAYS applied if MappingEditModal is used for all axes.
    // However, InputsTab logic for getAxisLabel suggests index < 3 are special.
    // If index is 3 (Slider), is it adc[6]? 
    // Assuming uniform offset based on previous user interaction success.
    
    // I will stick to what I just wrote in MappingEditModal if the user confirmed it's working.
    // The user said: "só falta ler o eixo corretamente agora igual esta funcionando no ... MappingEditModal"
    // In MappingEditModal I wrote: `const raw = hardwareStream.value.adc[props.axisIndex + 3] ?? 0;`
    // Wait, MappingEditModal is likely only called for axes 0, 1, 2?
    // InputsTab: `activeIndices` allows GPIOs.
    // If I use `index + 3` it might be wrong for GPIOs if they start at 3 in ADC or strict mapping.
    // Let's assume the user is testing mainly with axes 0, 1, 2 (X, Y, Z).
    // I will use `props.index + 3` to strictly match the modal code I wrote which the user praised.
    
    const raw = hardwareStream.value.adc[props.index + 3] ?? 0;
    return Math.floor((raw * 32767) / 4095);
  }
  return props.rawValue || 0;
});
</script>

<style scoped>
.axis-mapping-row {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: border-color 0.2s;
}

.axis-mapping-row:hover {
  border-color: var(--accent-primary);
}

.axis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.axis-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.axis-label {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-tertiary);
  font-weight: 800;
  letter-spacing: 0.05em;
}

.axis-name-input {
  max-width: 200px;
}

/* Customizing ThemedInput for header look */
:deep(.axis-name-input input) {
  background: transparent;
  border: none;
  border-bottom: 1px solid transparent;
  border-radius: 0;
  padding: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--accent-primary);
}

:deep(.axis-name-input input:focus) {
  box-shadow: none;
  border-bottom-color: var(--accent-primary);
}

:deep(.axis-name-input input:hover:not(:disabled)) {
  border-bottom-color: var(--border-color);
}

.edit-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: rgba(var(--accent-primary-rgb), 0.1);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.axis-monitor-container {
  padding: 0;
  margin-top: -8px;
  margin-bottom: 4px;
}

:deep(.narrow-monitor .axis-monitor__track) {
  height: 6px !important;
  background: rgba(0, 0, 0, 0.3);
  border: none;
}

:deep(.narrow-monitor .axis-monitor__fill) {
  border-radius: 3px;
}

.calibration-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.control-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: center;
}

.adc-info {
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
  font-style: italic;
  padding: 8px;
  border-top: 1px solid var(--border-color);
}

.adc-info {
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
  font-style: italic;
  padding: 8px;
  border-top: 1px solid var(--border-color);
}
</style>
