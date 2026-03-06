<template>
  <div 
    class="themed-input" 
    :class="{ 'themed-input--disabled': disabled }"
    :data-help="helpKey"
  >
    <div v-if="label" class="themed-input__header">
      <label class="themed-input__label">{{ label }}</label>
      <div v-if="helpKey" class="themed-input__help-icon" :title="$t(helpKey)">?</div>
    </div>
    <div class="themed-input__wrapper">
      <div v-if="$slots.prefix" class="themed-input__prefix">
        <slot name="prefix"></slot>
      </div>
      <input
        ref="inputRef"
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        class="themed-input__field"
        @input="handleInput"
        @change="handleChange"
        @focus="$emit('focus')"
        @blur="$emit('blur')"
      />
      <div v-if="$slots.suffix" class="themed-input__suffix">
        <slot name="suffix"></slot>
      </div>
    </div>
    <span v-if="error" class="themed-input__error">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  modelValue: string | number;
  type?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  error?: string;
  helpKey?: string;
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  label: '',
  placeholder: '',
  disabled: false,
  readonly: false,
  error: '',
  helpKey: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'change': [value: string];
  'focus': [];
  'blur': [];
}>();

const inputRef = ref<HTMLInputElement | null>(null);

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('change', target.value);
}

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
});
</script>

<style scoped>
.themed-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.themed-input__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.themed-input__label {
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  font-weight: 800;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.themed-input__help-icon {
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

.themed-input__help-icon:hover {
  background: var(--accent-primary);
  color: #000;
  border-color: var(--accent-primary);
}

.themed-input__wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-sidebar, #121216);
  border: 1px solid var(--border, rgba(255,255,255,0.1));
  border-radius: 6px;
  transition: all 0.2s ease;
  overflow: hidden;
}

.themed-input__wrapper:focus-within {
  border-color: var(--accent-primary, var(--accent, #00d4ff));
  box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb, 0, 212, 255), 0.1);
}

.themed-input__prefix,
.themed-input__suffix {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  color: var(--text-secondary);
  font-size: 14px;
}

.themed-input__field {
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  color: var(--text-main);
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  outline: none;
}

.themed-input__field::placeholder {
  color: var(--text-secondary);
  opacity: 0.5;
}

.themed-input__error {
  font-size: 12px;
  color: var(--status-error);
  margin-top: 2px;
}

.themed-input--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.themed-input--disabled .themed-input__field {
  cursor: not-allowed;
}
</style>
