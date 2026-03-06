<template>
  <span
    class="status-badge"
    :class="[
      `status-badge--${variant}`,
      `status-badge--${size}`,
      { 'status-badge--pulsing': pulsing }
    ]"
  >
    <span v-if="showDot" class="status-badge__dot"></span>
    <span class="status-badge__text">{{ text }}</span>
  </span>
</template>

<script setup lang="ts">
type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';
type BadgeSize = 'small' | 'medium' | 'large';

interface Props {
  text: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  showDot?: boolean;
  pulsing?: boolean;
}

withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  size: 'medium',
  showDot: true,
  pulsing: false,
});
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 12px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  transition: all 0.2s ease;
}

/* Sizes */
.status-badge--small {
  font-size: 11px;
  padding: 2px 8px;
  gap: 4px;
}

.status-badge--medium {
  font-size: 13px;
  padding: 4px 12px;
  gap: 6px;
}

.status-badge--large {
  font-size: 14px;
  padding: 6px 14px;
  gap: 8px;
}

/* Variants */
.status-badge--success {
  background: rgba(var(--status-success-rgb), 0.15);
  color: var(--status-success);
}

.status-badge--error {
  background: rgba(var(--status-error-rgb), 0.15);
  color: var(--status-error);
}

.status-badge--warning {
  background: rgba(var(--status-warning-rgb), 0.15);
  color: var(--status-warning);
}

.status-badge--info {
  background: rgba(var(--accent-primary-rgb), 0.15);
  color: var(--accent-primary);
}

.status-badge--neutral {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

/* Dot indicator */
.status-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status-badge--small .status-badge__dot {
  width: 4px;
  height: 4px;
}

.status-badge--large .status-badge__dot {
  width: 8px;
  height: 8px;
}

/* Pulsing animation */
.status-badge--pulsing .status-badge__dot {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

.status-badge__text {
  line-height: 1;
}
</style>
