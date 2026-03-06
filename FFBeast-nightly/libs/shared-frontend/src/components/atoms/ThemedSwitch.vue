<template>
  <div
    class="themed-switch"
    :class="{ 'themed-switch--disabled': disabled }"
    :data-help="helpKey"
    @click.stop="toggle"
  >
    <div
      class="themed-switch__track"
      :class="{ 'themed-switch__track--active': modelValue }"
    >
      <div class="themed-switch__thumb"></div>
    </div>
    <div v-if="label" class="themed-switch__label-group">
      <div class="themed-switch__label">{{ label }}</div>
      <div v-if="helpKey" class="themed-switch__help-icon" :title="$t(helpKey)">?</div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean;
  label?: string;
  disabled?: boolean;
  helpKey?: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  disabled: false,
  helpKey: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'change': [value: boolean];
}>();

function toggle() {
  if (props.disabled) return;
  const newValue = !props.modelValue;
  emit('update:modelValue', newValue);
  emit('change', newValue);
}
</script>

<style scoped>
.themed-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
  padding: 4px 0;
}

.themed-switch--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.themed-switch__track {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--bg-secondary, var(--bg-sidebar));
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.themed-switch__track--active {
  background: var(--accent-muted, rgba(var(--accent-primary-rgb, 0, 212, 255), 0.2));
  border-color: var(--accent-primary, var(--accent));
}

.themed-switch__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  background: var(--text-secondary);
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.themed-switch__track--active .themed-switch__thumb {
  left: 23px;
  background: var(--accent-primary, var(--accent));
  box-shadow: 0 0 10px var(--accent-glow);
}

.themed-switch__label-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.themed-switch__label {
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  font-weight: 800;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.themed-switch__help-icon {
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

.themed-switch__help-icon:hover {
  background: var(--accent-primary);
  color: #000;
  border-color: var(--accent-primary);
}
</style>
