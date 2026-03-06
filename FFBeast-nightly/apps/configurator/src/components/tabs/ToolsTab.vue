<template>
  <div class="tools-tab">
    <div class="grid-layout">
      <!-- FFB Diagnostics -->
      <BaseCard :title="$t('tools.ffb_diagnostics')">
        <p class="description">{{ $t('tools.ffb_desc') }}</p>
        <div class="test-controls">
          <ThemedSlider 
            v-model="testValues.constant" 
            :label="$t('tools.constant_force')" 
            :min="-100" 
            :max="100" 
            value-suffix="%"
            @update:model-value="(v: number) => updateFFB(1, v)"
            @change="resetFFB(1)"
          />
          <ThemedSlider 
            v-model="testValues.sine" 
            :label="$t('tools.sine_wave')" 
            :min="0" 
            :max="100" 
            value-suffix="%"
            @update:model-value="(v: number) => updateFFB(2, v)"
            @change="resetFFB(2)"
          />
          <ThemedSlider 
            v-model="testValues.damper" 
            :label="$t('tools.damping_effect')" 
            :min="0" 
            :max="100" 
            value-suffix="%"
            @update:model-value="(v: number) => updateFFB(3, v)"
            @change="resetFFB(3)"
          />
        </div>
        <div class="tools-grid">
          <button class="tool-btn stop" @click="stopAll">{{ $t('tools.stop_all') }}</button>
        </div>
      </BaseCard>

      <!-- Maintenance -->
      <BaseCard :title="$t('tools.maintenance')">
        <p class="description">{{ $t('tools.maintenance_desc') }}</p>
        <div class="tools-grid">
          <button class="tool-btn" @click="recalibrateCenter">{{ $t('tools.recalibrate') }}</button>
          <button class="tool-btn warn" @click="enterDfu">{{ $t('tools.enter_dfu') }}</button>
          <button class="tool-btn danger" @click="factoryReset">{{ $t('tools.factory_reset') }}</button>
        </div>
      </BaseCard>

      <!-- Input Mapping Service -->
      <BaseCard :title="$t('tools.mapping_service')">
        <p class="description">{{ $t('tools.mapping_desc') }}</p>
        <div class="service-status-row">
          <span class="status-label">Status:</span>
          <StatusBadge 
            :text="isServiceActive ? $t('status.service_active') : $t('status.service_inactive')"
            :variant="isServiceActive ? 'success' : 'neutral'"
            :pulsing="isServiceActive"
          />
        </div>
        <div class="tools-grid">
          <button 
            v-if="!isServiceActive" 
            class="tool-btn success" 
            @click="toggleService(true)"
          >
            {{ $t('buttons.start_service') }}
          </button>
          <button 
            v-else 
            class="tool-btn stop" 
            @click="toggleService(false)"
          >
            {{ $t('buttons.stop_service') }}
          </button>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHardwareStore } from '../../stores/hardware';
import { useUIStore } from '../../stores/ui';
import { useMappingPersistence } from '@shared/composables/useMappingPersistence';
import { HardwareService } from '../../services/hardware_service';
import BaseCard from '../common/BaseCard.vue';
import ThemedSlider from '@shared/components/atoms/ThemedSlider.vue';
import StatusBadge from '@shared/components/atoms/StatusBadge.vue';
import type { KeyMapping } from '@shared/models/KeyMapping';

const store = useHardwareStore();
const ui = useUIStore();
const { t } = useI18n();
const { mappings, load: loadMappings } = useMappingPersistence();

const testValues = reactive({
  constant: 0,
  sine: 0,
  damper: 0
});

const isServiceActive = ref(false);

const updateFFB = (type: number, val: number) => {
  // Map percentage to 0..32767 hardware range
  const hwVal = (val / 100) * 32767;
  store.sendFFBTest(type, hwVal);
};

const resetFFB = (type: number) => {
  if (type === 1) testValues.constant = 0;
  if (type === 2) testValues.sine = 0;
  if (type === 3) testValues.damper = 0;
  store.sendFFBTest(type, 0);
};

const stopAll = () => {
  testValues.constant = 0;
  testValues.sine = 0;
  testValues.damper = 0;
  store.sendFFBTest(1, 0);
  store.sendFFBTest(2, 0);
  store.sendFFBTest(3, 0);
  ui.showToast(t('toasts.ffb_stopped'), 'info');
};

const recalibrateCenter = async () => {
  try {
    await store.resetCenter();
  } catch (err) {
    console.error('Failed to recalibrate center:', err);
  }
};

const enterDfu = async () => {
  if (confirm(t('dialogs.enter_dfu_confirm'))) {
    try {
      await store.enterDfu();
      ui.showToast(t('toasts.switching_dfu'), 'warn');
    } catch (err) {
      ui.showToast(`${t('toasts.dfu_failed')}: ${err}`, 'error');
    }
  }
};

const factoryReset = () => {
  if (confirm(t('dialogs.factory_reset_confirm'))) {
    ui.showToast('Factory reset not implemented in current firmware version', 'warn');
  }
};

const toggleService = async (active: boolean) => {
  try {
    if (active) {
      // Ensure latest mappings are loaded and sent before starting service
      loadMappings();
      
      const keyMappings: KeyMapping[] = [];
      const analogIndices = [0, 1, 2, 3, 4, 5, 6, 7].filter(i => {
        if (i < 3) return true;
        return store.gpio?.pin_mode[i] === 2; // Analog
      });

      analogIndices.forEach(idx => {
        const m = mappings.value[idx];
        if (!m) return;

        if (m.keyHigh) {
          keyMappings.push({
            id: `axis.${idx}_high`,
            source_type: 'axis',
            index: idx,
            trigger: 'high',
            key: m.keyHigh,
            threshold: m.thresholdHigh ?? 30000
          });
        }
        if (m.keyLow) {
          keyMappings.push({
            id: `axis.${idx}_low`,
            source_type: 'axis',
            index: idx,
            trigger: 'low',
            key: m.keyLow,
            threshold: m.thresholdLow ?? 2000
          });
        }
      });

      if (keyMappings.length > 0) {
        await store.updateKeyboardMapping(keyMappings);
        store.log('info', `Configured ${keyMappings.length} mappings for service start`);
      }
    }

    await HardwareService.setKeyboardServiceActive(active);
    isServiceActive.value = active;
    
    ui.showToast(
      active ? t('toasts.service_started') : t('toasts.service_stopped'),
      active ? 'success' : 'info'
    );
  } catch (err) {
    ui.showToast(`${t('toasts.service_toggle_failed')}: ${err}`, 'error');
  }
};

onMounted(async () => {
  try {
    isServiceActive.value = await HardwareService.getKeyboardServiceActive();
  } catch (err) {
    console.error('Failed to sync service status:', err);
  }
});
</script>

<style scoped>
.tools-tab {
  padding: var(--content-padding);
}

.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.description {
  color: var(--text-dim);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.service-status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1.5rem;
  padding: 12px;
  background: rgba(0,0,0,0.2);
  border-radius: var(--radius-sm);
}

.status-label {
  font-size: 0.85rem;
  color: var(--text-dim);
}

.status-badge {
  font-size: 0.75rem;
  font-weight: bold;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(255,255,255,0.1);
  color: var(--text-dim);
  text-transform: uppercase;
}

.status-badge.active {
  background: rgba(0, 212, 255, 0.2);
  color: var(--primary);
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.2);
}

.tools-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.tool-btn {
  padding: 12px;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-main);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tool-btn:hover {
  background: rgba(255,255,255,0.1);
  border-color: var(--text-dim);
}

.tool-btn.success {
  color: var(--primary);
  border-color: rgba(0, 212, 255, 0.3);
}

.tool-btn.success:hover {
  background: rgba(0, 212, 255, 0.1);
}

.tool-btn.stop {
  color: var(--warning);
  border-color: rgba(255, 165, 2, 0.3);
}

.tool-btn.warn {
  color: var(--warning);
}

.tool-btn.danger {
  color: var(--danger);
  grid-column: span 2;
  margin-top: 10px;
}
</style>
