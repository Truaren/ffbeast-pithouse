<template>
  <div class="themed-slider" :data-help="helpKey">
    <div v-if="showLabel" class="themed-slider__header">
      <div class="themed-slider__label-group">
        <label v-if="label" class="themed-slider__label">{{ label }}</label>
        <div v-if="helpKey" class="themed-slider__help-icon" :title="$t(helpKey)">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
      </div>
      <div v-if="showValue" class="themed-slider__value-wrapper">
        <input
          type="number"
          :value="localValue"
          :min="min"
          :max="max"
          :step="step"
          :disabled="disabled"
          class="themed-slider__manual-input"
          @input="handleManualInput"
          @blur="commitManualInput"
          @keydown.enter="commitManualInput"
        />
        <span v-if="valueSuffix" class="themed-slider__suffix">{{ valueSuffix }}</span>
      </div>
    </div>
    <input
      type="range"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      class="themed-slider__input"
      :class="{ 'themed-slider__input--disabled': disabled }"
      :style="{ '--slider-percent': `${sliderPercent}%` }"
      @input="handleInput"
      @change="$emit('change', Number(($event.target as HTMLInputElement).value))"
    />
    <div v-if="showTicks" class="themed-slider__ticks">
      <span class="themed-slider__tick">{{ min }}</span>
      <span v-if="showMiddleTick" class="themed-slider__tick">{{ middleValue }}</span>
      <span class="themed-slider__tick">{{ max }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

interface Props {
  modelValue: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  showValue?: boolean;
  showLabel?: boolean;
  showTicks?: boolean;
  showMiddleTick?: boolean;
  valueFormatter?: (value: number) => string;
  valueSuffix?: string;
  helpKey?: string;
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  label: '',
  disabled: false,
  showValue: true,
  showLabel: true,
  showTicks: false,
  showMiddleTick: false,
  valueSuffix: '',
  helpKey: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  'change': [value: number];
}>();

const localValue = ref<number | string>(props.modelValue);

watch(() => props.modelValue, (newVal: number) => {
  localValue.value = newVal;
});

const middleValue = computed(() => {
  return Math.round((props.min + props.max) / 2);
});

const sliderPercent = computed(() => {
  const range = props.max - props.min;
  if (range === 0) return 0;
  return ((props.modelValue - props.min) / range) * 100;
});

let commitTimer: ReturnType<typeof setTimeout> | null = null;

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', Number(target.value));
}

function handleManualInput(event: Event) {
  const target = event.target as HTMLInputElement;
  localValue.value = target.value;

  if (commitTimer) clearTimeout(commitTimer);
  commitTimer = setTimeout(() => {
    commitManualInput();
  }, 500);
}

function commitManualInput() {
  if (commitTimer) {
    clearTimeout(commitTimer);
    commitTimer = null;
  }

  let val = Number(localValue.value);
  if (isNaN(val) || localValue.value === '') {
    localValue.value = props.modelValue;
    return;
  }
  
  // If out of range, revert to original value
  if (val < props.min || val > props.max) {
    localValue.value = props.modelValue;
    return;
  }

  localValue.value = val;
  emit('update:modelValue', val);
  emit('change', val);
}
</script>

<style scoped>
.themed-slider {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.themed-slider__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.themed-slider__label-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.themed-slider__label {
  font-family: 'Outfit', sans-serif;
  font-size: 10px;
  font-weight: 800;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.themed-slider__help-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim, #8e8e9c);
  opacity: 0.6;
  cursor: help;
  transition: opacity 0.2s;
}

.themed-slider__help-icon:hover {
  opacity: 1;
  color: var(--accent-primary);
}

.themed-slider__value-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.themed-slider__manual-input {
  background: var(--bg-sidebar, #121216);
  border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
  border-radius: 4px;
  color: var(--accent-primary, var(--accent, #00d4ff));
  font-family: var(--font-mono, monospace);
  font-size: 13px;
  font-weight: 600;
  padding: 2px 6px;
  width: 60px;
  text-align: right;
  outline: none;
  transition: all 0.2s;
}

.themed-slider__manual-input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 5px var(--accent-glow);
}

.themed-slider__manual-input::-webkit-inner-spin-button,
.themed-slider__manual-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.themed-slider__suffix {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dim, #8e8e9c);
  font-family: var(--font-mono, monospace);
}

.themed-slider__input {
  width: 100%;
  height: 24px; /* Height for the thumb hover area */
  background: transparent;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0;
  padding: 0;
  display: block;
}

.themed-slider__input::-webkit-slider-runnable-track {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  border: none;
  background: linear-gradient(
    to right,
    var(--accent-primary, #00d4ff) 0%,
    var(--accent-primary, #00d4ff) var(--slider-percent),
    var(--bg-secondary, #121216) var(--slider-percent),
    var(--bg-secondary, #121216) 100%
  );
}

.themed-slider__input::-moz-range-track {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(
    to right,
    var(--accent-primary, #00d4ff) 0%,
    var(--accent-primary, #00d4ff) var(--slider-percent),
    var(--bg-secondary, #121216) var(--slider-percent),
    var(--bg-secondary, #121216) 100%
  );
}

.themed-slider__input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent-primary, var(--accent));
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  margin-top: -6px; /* Centering fix for Chrome: (trackHeight/2) - (thumbHeight/2) = (3 - 9) */
}

.themed-slider__input::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent-primary, var(--accent));
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.themed-slider__input:hover::-webkit-slider-thumb {
  transform: scale(1.1);
  box-shadow: 0 0 0 6px rgba(var(--accent-primary-rgb), 0.1);
}

.themed-slider__input:hover::-moz-range-thumb {
  transform: scale(1.1);
  box-shadow: 0 0 0 6px rgba(var(--accent-primary-rgb), 0.1);
}

.themed-slider__input:active::-webkit-slider-thumb {
  transform: scale(1.15);
}

.themed-slider__input:active::-moz-range-thumb {
  transform: scale(1.15);
}

.themed-slider__input--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.themed-slider__input--disabled::-webkit-slider-thumb {
  cursor: not-allowed;
}

.themed-slider__input--disabled::-moz-range-thumb {
  cursor: not-allowed;
}

.themed-slider__ticks {
  display: flex;
  justify-content: space-between;
  padding: 0 2px;
}

.themed-slider__tick {
  font-size: 11px;
  color: var(--text-tertiary);
  font-family: 'JetBrains Mono', monospace;
}
</style>
