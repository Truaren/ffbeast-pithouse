<template>
  <div class="dual-threshold-slider">
    <div v-if="label" class="dual-threshold-slider__header">
      <div class="dual-threshold-slider__label-group">
        <label class="dual-threshold-slider__label">{{ label }}</label>
        <span v-if="rawValue !== undefined" class="dual-threshold-slider__live-badge">
          {{ rawValue }}
        </span>
        <div v-if="helpKey" class="dual-threshold-slider__help-icon" :title="t(helpKey)">?</div>
      </div>
      <div class="dual-threshold-slider__values">
        <div class="dual-threshold-slider__input-group dual-threshold-slider__input-group--low">
          <label>{{ t('general.low') }}</label>
          <input
            type="number"
            :value="localLow"
            :min="min"
            :max="inputLowMax"
            :step="step"
            :disabled="disabled"
            @input="handleLowInput"
            @blur="commitLowInput"
            @keydown.enter="commitLowInput"
          />
        </div>
        <div class="dual-threshold-slider__input-group dual-threshold-slider__input-group--high">
          <label>{{ t('general.high') }}</label>
          <input
            type="number"
            :value="localHigh"
            :min="inputHighMin"
            :max="max"
            :step="step"
            :disabled="disabled"
            @input="handleHighInput"
            @blur="commitHighInput"
            @keydown.enter="commitHighInput"
          />
        </div>
      </div>
    </div>
    
    <div class="dual-threshold-slider__container">
      <div class="dual-threshold-slider__track">
        <!-- Hardware Axis Value Bar -->
        <div 
          v-if="rawValue !== undefined"
          class="dual-threshold-slider__axis-bar"
          :style="axisBarStyle"
        ></div>

        <!-- Active range visualization -->
        <div
          class="dual-threshold-slider__range"
          :style="rangeStyle"
        ></div>
        
        <!-- Low threshold slider -->
        <input
          type="range"
          :value="lowValue"
          :min="min"
          :max="inputLowMax"
          :step="step"
          :disabled="disabled"
          class="dual-threshold-slider__input dual-threshold-slider__input--low"
          @input="handleLowInput"
        />
        
        <!-- High threshold slider -->
        <input
          type="range"
          :value="highValue"
          :min="inputHighMin"
          :max="max"
          :step="step"
          :disabled="disabled"
          class="dual-threshold-slider__input dual-threshold-slider__input--high"
          @input="handleHighInput"
        />
      </div>
      
      <div class="dual-threshold-slider__ticks">
        <span class="dual-threshold-slider__tick">{{ min }}</span>
        <span class="dual-threshold-slider__tick">{{ max }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
  lowValue: number;
  highValue: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  rawValue?: number;
  maxLow?: number;
  minHigh?: number;
  helpKey?: string;
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 32767,
  step: 1,
  label: '',
  disabled: false,
  rawValue: undefined,
  maxLow: undefined,
  minHigh: undefined,
  helpKey: undefined,
});

const emit = defineEmits<{
  'update:lowValue': [value: number];
  'update:highValue': [value: number];
}>();

const localLow = ref<number | string>(props.lowValue);
const localHigh = ref<number | string>(props.highValue);

watch(() => props.lowValue, (newVal: number) => {
  localLow.value = newVal;
});

watch(() => props.highValue, (newVal: number) => {
  localHigh.value = newVal;
});

const { t } = useI18n();

const rangeStyle = computed(() => {
  const range = props.max - props.min;
  const lowPercent = ((props.lowValue - props.min) / range) * 100;
  const highPercent = ((props.highValue - props.min) / range) * 100;
  
  return {
    left: `${lowPercent}%`,
    width: `${highPercent - lowPercent}%`,
  };
});

const axisBarStyle = computed(() => {
  if (props.rawValue === undefined) return {};
  const range = props.max - props.min;
  const val = Math.max(props.min, Math.min(props.max, props.rawValue));
  const percent = ((val - props.min) / range) * 100;
  
  return {
    left: `${percent}%`
  };
});

// Computed strict limits for inputs
const inputLowMax = computed(() => {
  const collisionArg = props.highValue - props.step;
  if (props.maxLow !== undefined) {
    return Math.min(props.maxLow, collisionArg);
  }
  return collisionArg;
});

const inputHighMin = computed(() => {
  const collisionArg = props.lowValue + props.step;
  if (props.minHigh !== undefined) {
    return Math.max(props.minHigh, collisionArg);
  }
  return collisionArg;
});

let lowCommitTimer: ReturnType<typeof setTimeout> | null = null;
let highCommitTimer: ReturnType<typeof setTimeout> | null = null;

function handleLowInput(event: Event) {
  const target = event.target as HTMLInputElement;
  localLow.value = target.value;

  if (lowCommitTimer) clearTimeout(lowCommitTimer);
  lowCommitTimer = setTimeout(() => {
    commitLowInput();
  }, 500);
}

function commitLowInput() {
  if (lowCommitTimer) {
    clearTimeout(lowCommitTimer);
    lowCommitTimer = null;
  }

  let val = Number(localLow.value);
  if (isNaN(val) || localLow.value === '') {
    localLow.value = props.lowValue;
    return;
  }

  // Business logic: if "wrong", revert to original value
  const isOutOfRange = val < props.min || val > props.max;
  const exceedsMaxLow = props.maxLow !== undefined && val > props.maxLow;
  const crossesHigh = val >= props.highValue;

  if (isOutOfRange || exceedsMaxLow || crossesHigh) {
    localLow.value = props.lowValue;
    return;
  }

  localLow.value = val;
  emit('update:lowValue', val);
}

function handleHighInput(event: Event) {
  const target = event.target as HTMLInputElement;
  localHigh.value = target.value;

  if (highCommitTimer) clearTimeout(highCommitTimer);
  highCommitTimer = setTimeout(() => {
    commitHighInput();
  }, 500);
}

function commitHighInput() {
  if (highCommitTimer) {
    clearTimeout(highCommitTimer);
    highCommitTimer = null;
  }

  let val = Number(localHigh.value);
  if (isNaN(val) || localHigh.value === '') {
    localHigh.value = props.highValue;
    return;
  }

  // Business logic: if "wrong", revert to original value
  const isOutOfRange = val < props.min || val > props.max;
  const belowMinHigh = props.minHigh !== undefined && val < props.minHigh;
  const crossesLow = val <= props.lowValue;

  if (isOutOfRange || belowMinHigh || crossesLow) {
    localHigh.value = props.highValue;
    return;
  }

  localHigh.value = val;
  emit('update:highValue', val);
}
</script>

<style scoped>
.dual-threshold-slider {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.dual-threshold-slider__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 2px;
}

.dual-threshold-slider__label-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dual-threshold-slider__label {
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  font-weight: 800;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dual-threshold-slider__live-badge {
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(var(--accent-primary-rgb), 0.1);
  color: var(--accent-primary);
  border-radius: 4px;
  border: 1px solid rgba(var(--accent-primary-rgb), 0.2);
  min-width: 45px;
  text-align: center;
}

.dual-threshold-slider__help-icon {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--bg-secondary);
  color: var(--text-tertiary);
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: help;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.dual-threshold-slider__help-icon:hover {
  background: var(--accent-primary);
  color: #000;
  border-color: var(--accent-primary);
}

.dual-threshold-slider__values {
  display: flex;
  gap: 16px;
}

.dual-threshold-slider__input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-sidebar, #121216);
  border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
  border-radius: 4px;
  padding: 2px 8px;
}

.dual-threshold-slider__input-group label {
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 800;
  color: var(--text-dim);
}

.dual-threshold-slider__input-group input {
  background: transparent;
  border: none;
  color: inherit;
  font-family: var(--font-mono, monospace);
  font-size: 13px;
  font-weight: 600;
  width: 60px;
  text-align: right;
  outline: none;
}

.dual-threshold-slider__input-group--low {
  color: var(--status-warning, #ffa502);
  border-color: rgba(var(--status-warning-rgb, 255, 165, 2), 0.3);
}

.dual-threshold-slider__input-group--high {
  color: var(--status-success, #00ff88);
  border-color: rgba(var(--status-success-rgb, 0, 255, 136), 0.3);
}

.dual-threshold-slider__input-group:focus-within {
  border-color: currentColor;
  box-shadow: 0 0 5px currentColor;
}

.dual-threshold-slider__container {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  box-sizing: border-box;
  padding: 0 10px;
}

.dual-threshold-slider__track {
  position: relative;
  height: 40px;
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.dual-threshold-slider__range {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  height: 6px;
  background: linear-gradient(
    90deg,
    var(--warning),
    var(--success)
  );
  border-radius: 3px;
  pointer-events: none;
  z-index: 1;
}

.dual-threshold-slider__input {
  position: absolute;
  left: 0;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
  border: 0;
  height: 24px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  pointer-events: none;
  z-index: 2;
}


.dual-threshold-slider__input::-webkit-slider-track {
  background: transparent;
  height: 6px;
}

.dual-threshold-slider__input::-moz-range-track {
  background: transparent;
  height: 6px;
}

.dual-threshold-slider__input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  border: 3px solid var(--bg-card);
  z-index: 2;
  margin-top: -1px; /* Centering for Chrome: slightly adjusted since track is in container center */
}

.dual-threshold-slider__input::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  pointer-events: auto;
  border: 3px solid var(--bg-card);
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  z-index: 2;
}

.dual-threshold-slider__input--low::-webkit-slider-thumb {
  background: var(--status-warning);
}

.dual-threshold-slider__input--low::-moz-range-thumb {
  background: var(--status-warning);
}

.dual-threshold-slider__input--high::-webkit-slider-thumb {
  background: var(--status-success);
}

.dual-threshold-slider__input--high::-moz-range-thumb {
  background: var(--status-success);
}

.dual-threshold-slider__input:hover::-webkit-slider-thumb {
  transform: scale(1.15);
}

.dual-threshold-slider__input:hover::-moz-range-thumb {
  transform: scale(1.15);
}

.dual-threshold-slider__input:active::-webkit-slider-thumb {
  transform: scale(1.2);
}

.dual-threshold-slider__input:active::-moz-range-thumb {
  transform: scale(1.2);
}

.dual-threshold-slider__ticks {
  display: flex;
  justify-content: space-between;
  padding: 0 2px;
}

.dual-threshold-slider__tick {
  font-size: 11px;
  color: var(--text-dim);
  font-family: 'JetBrains Mono', monospace;
}

.dual-threshold-slider__axis-bar {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  height: 100%;
  background: #00f3ff;
  box-shadow: 0 0 8px #00f3ff, 0 0 15px rgba(0, 243, 255, 0.5);
  border-radius: 2px;
  pointer-events: none;
  z-index: 10;
  width: 3px !important;
  margin-left: -1px;
  transition: left 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.dual-threshold-slider__range {
  z-index: 1;
}

.dual-threshold-slider__input {
  z-index: 2;
}
</style>
