<template>
  <div class="license-tab">
    <BaseCard :title="$t('license.info')">
      <div class="license-status">
        <div class="status-icon" :class="{ 'status-icon--active': isLicensed }">
          {{ isLicensed ? '✅' : '🔒' }}
        </div>
        <div class="status-details">
          <h4 class="status-title">{{ isLicensed ? $t('status.activated') : $t('status.trial') }}</h4>
          <div class="id-row">
            <span class="id-label">{{ $t('license.device_id') }}:</span>
            <code class="id-code">{{ deviceId }}</code>
            <button class="action-btn" @click="copyId" :title="$t('tooltip_copy_id')">📋</button>
          </div>
          <div v-if="serialKey && serialKey !== '00000000'" class="id-row">
            <span class="id-label">{{ $t('license.serial_key') }}:</span>
            <code class="id-code">{{ serialKey }}</code>
            <button class="action-btn" @click="copySerialKey" :title="$t('tooltip_copy_serial')">📋</button>
          </div>
        </div>
      </div>

      <div class="activation-section">
        <h3 class="section-title">{{ $t('license.activation') }}</h3>
        <p class="section-desc">{{ $t('license.serial_placeholder_desc') || 'Enter your serial key to unlock full features.' }}</p>
        
        <div class="activation-form">
          <ThemedInput 
            v-model="licenseKey" 
            :placeholder="$t('license.serial_placeholder')" 
            class="serial-input"
          />
          <div class="button-row">
            <button class="btn-primary" @click="activate">{{ $t('buttons.activate') }}</button>
            <button class="btn-secondary" @click="importFile">{{ $t('buttons.import') }}</button>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHardwareStore } from '../../stores/hardware';
import { useUIStore } from '../../stores/ui';
import { formatHexArray } from '../../utils/format';
import BaseCard from '../common/BaseCard.vue';
import ThemedInput from '@shared/components/atoms/ThemedInput.vue';

const store = useHardwareStore();
const ui = useUIStore();
const { t } = useI18n();

const isLicensed = computed(() => store.status?.is_registered ?? false);
const licenseKey = ref('');
const deviceId = computed(() => formatHexArray(store.status?.device_id));
const serialKey = computed(() => formatHexArray(store.status?.serial_key));

const copyId = async () => {
  await navigator.clipboard.writeText(deviceId.value);
  ui.showToast(t('toasts.id_copied'), 'info');
};

const copySerialKey = async () => {
  await navigator.clipboard.writeText(serialKey.value);
  ui.showToast(t('toasts.serial_copied'), 'info');
};

const activate = async () => {
  if (!licenseKey.value) {
    ui.showToast(t('toasts.enter_serial'), 'error');
    return;
  }
  try {
    await store.activateLicense(licenseKey.value);
    ui.showToast(t('toasts.activation_success'), 'success');
  } catch (err) {
    ui.showToast(`${t('toasts.activation_failed')}: ${err}`, 'error');
  }
};

const importFile = () => {
  ui.showToast(t('toasts.feature_not_ready'), 'info');
};
</script>

<style scoped>
.license-tab {
  padding: var(--content-padding);
}

.license-status {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  background: rgba(var(--bg-secondary-rgb), 0.3);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.status-icon {
  font-size: 2.5rem;
}

.status-title {
  margin: 0 0 8px;
  color: var(--text-main);
  font-size: 1.25rem;
  font-weight: 700;
}

.id-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
}

.id-label {
  color: var(--text-secondary);
  font-size: 13px;
}

.id-code {
  background: rgba(0, 0, 0, 0.2);
  padding: 4px 12px;
  border-radius: 6px;
  color: var(--accent-primary);
  font-family: var(--font-mono);
  font-size: 13px;
  border: 1px solid var(--border-color);
}

.action-btn {
  background: transparent;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.action-btn:hover {
  opacity: 1;
}

.activation-section {
  padding-top: 1rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.section-desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 1.5rem;
}

.activation-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.button-row {
  display: flex;
  gap: 12px;
}

.btn-primary {
  flex: 2;
  background: var(--accent-primary);
  color: #000;
  font-weight: 700;
  padding: 10px 24px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}

.btn-secondary {
  flex: 1;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-main);
  padding: 10px 24px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-primary:hover { filter: brightness(1.1); }
.btn-secondary:hover { background: rgba(255, 255, 255, 0.05); }
</style>

