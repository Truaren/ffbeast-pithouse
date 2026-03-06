<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'BaseSwitch',
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    help: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const toggle = () => {
      emit('update:modelValue', !props.modelValue);
    };

    return {
      toggle
    };
  }
});
</script>

<template>
  <div class="base-switch">
    <div class="switch-content">
      <div class="switch-label">
        <label>{{ label }}</label>
        <p v-if="help" class="help-text">{{ help }}</p>
      </div>
      
      <button 
        class="switch-toggle"
        :class="{ active: modelValue }"
        @click="toggle"
        role="switch"
        :aria-checked="modelValue"
      >
        <span class="switch-slider"></span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.base-switch {
  margin-bottom: 1.5rem;
}

.switch-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.switch-label {
  flex: 1;
}

label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-color);
  display: block;
  margin-bottom: 0.25rem;
}

.help-text {
  font-size: 0.75rem;
  color: var(--text-color);
  opacity: 0.6;
  margin: 0;
  font-style: italic;
}

.switch-toggle {
  position: relative;
  width: 50px;
  height: 26px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--border-color);
  border-radius: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.switch-toggle:hover {
  background: rgba(255, 255, 255, 0.15);
}

.switch-toggle.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.switch-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.switch-toggle.active .switch-slider {
  transform: translateX(24px);
}
</style>
