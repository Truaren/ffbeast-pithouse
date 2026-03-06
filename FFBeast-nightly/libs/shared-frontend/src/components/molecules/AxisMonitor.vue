<template>
  <div
    class="axis-monitor"
    :class="[
      `axis-monitor--${orientation}`,
      { 'axis-monitor--active': isActive }
    ]"
  >
    <div class="axis-monitor__track">
      <div
        class="axis-monitor__fill"
        :style="fillStyle"
      ></div>
      
      <!-- Markers for thresholds -->
      <div
        v-for="(marker, index) in markers"
        :key="index"
        class="axis-monitor__marker"
        :style="getMarkerStyle(marker)"
        :title="marker.label"
      >
        <span class="axis-monitor__marker-line"></span>
        <span v-if="marker.label" class="axis-monitor__marker-label">
          {{ marker.label }}
        </span>
      </div>
    </div>
    
    <div v-if="showValue" class="axis-monitor__value">
      {{ displayValue }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface AxisMarker {
  position: number; // 0-100 percentage
  label?: string;
  color?: string;
}

type Orientation = 'horizontal' | 'vertical';

interface Props {
  value: number; // 0-65535 or 0-100 depending on normalized prop
  min?: number;
  max?: number;
  orientation?: Orientation;
  markers?: AxisMarker[];
  showValue?: boolean;
  normalized?: boolean; // If true, value is 0-100, otherwise 0-65535
  valueFormatter?: (value: number) => string;
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 65535,
  orientation: 'horizontal',
  markers: () => [],
  showValue: true,
  normalized: false,
});

const percentage = computed(() => {
  const range = props.max - props.min;
  const adjustedValue = props.value - props.min;
  return Math.max(0, Math.min(100, (adjustedValue / range) * 100));
});

const isActive = computed(() => {
  return props.value > props.min;
});

const fillStyle = computed(() => {
  if (props.orientation === 'horizontal') {
    return {
      width: `${percentage.value}%`,
    };
  } else {
    return {
      height: `${percentage.value}%`,
    };
  }
});

const displayValue = computed(() => {
  if (props.valueFormatter) {
    return props.valueFormatter(props.value);
  }
  if (props.normalized) {
    return `${Math.round(percentage.value)}%`;
  }
  return props.value.toString();
});

function getMarkerStyle(marker: AxisMarker) {
  const position = `${marker.position}%`;
  
  if (props.orientation === 'horizontal') {
    return {
      left: position,
      borderColor: marker.color || 'var(--text-tertiary)',
    };
  } else {
    return {
      bottom: position,
      borderColor: marker.color || 'var(--text-tertiary)',
    };
  }
}
</script>

<style scoped>
.axis-monitor {
  display: flex;
  gap: 8px;
  align-items: center;
}

.axis-monitor--horizontal {
  flex-direction: row;
}

.axis-monitor--vertical {
  flex-direction: column-reverse;
  height: 100%;
}

.axis-monitor__track {
  position: relative;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.axis-monitor--horizontal .axis-monitor__track {
  flex: 1;
  height: 24px;
  min-width: 100px;
}

.axis-monitor--vertical .axis-monitor__track {
  width: 24px;
  flex: 1;
  min-height: 100px;
}

.axis-monitor__fill {
  position: absolute;
  background: linear-gradient(
    135deg,
    var(--accent-primary),
    var(--accent-secondary)
  );
  transition: all 0.1s ease-out;
}

.axis-monitor--horizontal .axis-monitor__fill {
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: 3px 0 0 3px;
}

.axis-monitor--vertical .axis-monitor__fill {
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 0 0 3px 3px;
}

.axis-monitor--active .axis-monitor__fill {
  box-shadow: 0 0 12px rgba(var(--accent-primary-rgb), 0.4);
}

.axis-monitor__marker {
  position: absolute;
  z-index: 2;
}

.axis-monitor--horizontal .axis-monitor__marker {
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
}

.axis-monitor--vertical .axis-monitor__marker {
  left: 0;
  right: 0;
  transform: translateY(50%);
}

.axis-monitor__marker-line {
  position: absolute;
  background: currentColor;
  opacity: 0.6;
}

.axis-monitor--horizontal .axis-monitor__marker-line {
  width: 2px;
  height: 100%;
  left: 50%;
  transform: translateX(-50%);
}

.axis-monitor--vertical .axis-monitor__marker-line {
  height: 2px;
  width: 100%;
  top: 50%;
  transform: translateY(-50%);
}

.axis-monitor__marker-label {
  position: absolute;
  font-size: 10px;
  color: var(--text-tertiary);
  white-space: nowrap;
  font-family: 'JetBrains Mono', monospace;
  pointer-events: none;
}

.axis-monitor--horizontal .axis-monitor__marker-label {
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
}

.axis-monitor--vertical .axis-monitor__marker-label {
  left: 32px;
  top: 50%;
  transform: translateY(-50%);
}

.axis-monitor__value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: 'JetBrains Mono', monospace;
  min-width: 60px;
  text-align: center;
}

.axis-monitor--vertical .axis-monitor__value {
  min-width: auto;
}
</style>
