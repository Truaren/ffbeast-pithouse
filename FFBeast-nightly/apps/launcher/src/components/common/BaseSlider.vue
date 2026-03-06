<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
  name: 'BaseSlider',
  props: {
    modelValue: {
      type: Number,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    help: {
      type: String,
      default: ''
    },
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    },
    step: {
      type: Number,
      default: 1
    },
    suffix: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const handleInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      emit('update:modelValue', Number(target.value));
    };

    const handleNumberInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      let value = Number(target.value);
      
      // Clamp between min and max
      if (value < props.min) value = props.min;
      if (value > props.max) value = props.max;
      
      emit('update:modelValue', value);
    };

    return {
      handleInput,
      handleNumberInput
    };
  }
});
</script>

<template>
  <div class="base-slider">
    <div class="slider-header">
      <label>{{ label }}</label>
      <div class="slider-value">
        <input 
          type="number"
          class="value-input"
          :value="modelValue"
          :min="min"
          :max="max"
          :step="step"
          @input="handleNumberInput"
        />
        <span v-if="suffix" class="suffix">{{ suffix }}</span>
      </div>
    </div>
    
    <input 
      type="range"
      class="slider-range"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      @input="handleInput"
    />
    
    <p v-if="help" class="help-text">{{ help }}</p>
  </div>
</template>

<style scoped>
.base-slider {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

label {
  font-weight: 600;
  font-size: 0.9rem;
  opacity: 0.9;
  color: var(--text-color);
}

.slider-value {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.value-input {
  width: 70px;
  padding: 0.25rem 0.5rem;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-color);
  font-weight: 700;
  text-align: right;
  font-family: monospace;
}

.value-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.suffix {
  font-weight: 700;
  color: var(--primary-color);
  min-width: 20px;
}

.slider-range {
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

.slider-range::-webkit-slider-runnable-track {
  width: 100%;
  height: 6px;
  background: rgba(124, 58, 237, 0.2);
  border-radius: 3px;
}

.slider-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 18px;
  width: 18px;
  background: var(--primary-color);
  border-radius: 50%;
  margin-top: -6px;
  cursor: pointer;
  transition: transform 0.2s;
}

.slider-range::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.slider-range::-moz-range-track {
  width: 100%;
  height: 6px;
  background: rgba(124, 58, 237, 0.2);
  border-radius: 3px;
}

.slider-range::-moz-range-thumb {
  height: 18px;
  width: 18px;
  background: var(--primary-color);
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: transform 0.2s;
}

.slider-range::-moz-range-thumb:hover {
  transform: scale(1.2);
}

.help-text {
  font-size: 0.75rem;
  color: var(--text-color);
  opacity: 0.6;
  margin: 0;
  font-style: italic;
}
</style>
