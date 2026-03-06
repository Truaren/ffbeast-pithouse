<script lang="ts">
import { defineComponent, PropType } from 'vue';

export interface Option {
  label: string;
  value: string | number;
}

export default defineComponent({
  name: 'BaseSelect',
  props: {
    modelValue: {
      type: [String, Number],
      required: true
    },
    label: {
      type: String,
      default: ''
    },
    options: {
      type: Array as PropType<Option[]>,
      required: true
    }
  },
  emits: ['update:modelValue']
});
</script>

<template>
  <div class="base-select">
    <label v-if="label">{{ label }}</label>
    <select 
      :value="modelValue" 
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option 
        v-for="opt in options" 
        :key="opt.value" 
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.base-select {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-color);
}

select {
  padding: 0.75rem;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-color);
  cursor: pointer;
  appearance: none; /* Custom arrow would be nice but simple for now */
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1em;
}

select:focus {
  outline: none;
  border-color: var(--primary-color);
}
</style>
