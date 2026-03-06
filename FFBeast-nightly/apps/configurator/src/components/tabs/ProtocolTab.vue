<template>
  <div class="protocol-tab">
    <!-- Extension Mode Selector -->
    <BaseCard :title="$t('groups.extension')">
      <div class="setting-row">
        <ThemedSelect 
          v-model="extensionMode" 
          :options="translatedModeOptions" 
          :label="$t('settings.ext_mode')"
          class="protocol-select"
          @change="(v) => handleModeChange(v)"
        />
      </div>
    </BaseCard>

    <!-- SPI Configuration (Visible for all SPI modes) -->
    <BaseCard v-if="extensionMode >= 1 && extensionMode <= 5" :title="$t('groups.spi')">
      <div class="spi-grid">
        <ThemedSelect 
          v-model="spiSettings.spi_mode" 
          :label="$t('settings.spi_mode')"
          :options="spiModeOptions"
          @change="saveSpi"
        />
        <ThemedSelect 
          v-model="spiSettings.spi_latch_mode" 
          :label="$t('settings.spi_latch')"
          :options="translatedLatchOptions"
          @change="saveSpi"
        />
        <ThemedSlider 
          v-model="spiSettings.spi_latch_delay" 
          :label="$t('settings.spi_latch_delay')"
          value-suffix="µs"
          help-key="help.spi_latch_delay"
          @update:model-value="saveSpi"
        />
        <ThemedSlider 
          v-model="spiSettings.spi_clk_pulse_length" 
          :label="$t('settings.spi_pulse')"
          value-suffix="µs"
          help-key="help.spi_pulse"
          @update:model-value="saveSpi"
        />
      </div>
    </BaseCard>
    
    <!-- Protocol Documentation -->
    <BaseCard class="protocol-info-box">
      <h3 class="info-title">📘 {{ $t(currentModeTitle) }}</h3>
      
      <div class="protocol-info-section">
        <h4 class="info-section__title">{{ $t('protocol.desc.title') }}</h4>
        <p class="info-section__text">{{ $t(`protocol.desc.${currentModeDetail}`) }}</p>
      </div>
      
      <div class="protocol-info-section">
        <h4 class="info-section__title">{{ $t('protocol.compat.title') }}</h4>
        <p class="info-section__text">{{ $t(`protocol.compat.${currentModeDetail}`) }}</p>
      </div>
      
      <div class="protocol-info-section">
        <h4 class="info-section__title">{{ $t('protocol.config.title') }}</h4>
        <p class="info-section__text">{{ $t(`protocol.config.${currentModeDetail}`) }}</p>
      </div>
      
      <div class="protocol-info-section">
        <h4 class="info-section__title">💡 {{ $t('protocol.tips.title') }}</h4>
        <p class="info-section__text">{{ $t(`protocol.tips.${currentModeDetail}`) }}</p>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHardwareStore } from '../../stores/hardware';
import ThemedSelect from '@shared/components/atoms/ThemedSelect.vue';
import ThemedSlider from '@shared/components/atoms/ThemedSlider.vue';
import BaseCard from '../common/BaseCard.vue';

const store = useHardwareStore();
const { t } = useI18n();

const extensionMode = ref(store.gpio?.extension_mode ?? 0);

const spiSettings = reactive({
  spi_mode: store.gpio?.spi_mode ?? 0,
  spi_latch_mode: store.gpio?.spi_latch_mode ?? 0,
  spi_latch_delay: store.gpio?.spi_latch_delay ?? 5,
  spi_clk_pulse_length: store.gpio?.spi_clk_pulse_length ?? 5,
});

const modeOptions = [
  { label: 'modes.extension.none', value: 0 },
  { label: 'modes.spi.custom', value: 1 },
  { label: 'modes.spi.3xcd4021', value: 2 },
  { label: 'modes.spi.3xsn74hc165', value: 3 },
  { label: 'modes.extension.spi_tm', value: 4 },
  { label: 'modes.spi.vpc', value: 5 },
];

const translatedModeOptions = computed(() => 
  modeOptions.map(opt => ({ ...opt, label: t(opt.label) }))
);

const spiModeOptions = [
  { label: 'Mode 0', value: 0 },
  { label: 'Mode 1', value: 1 },
  { label: 'Mode 2', value: 2 },
  { label: 'Mode 3', value: 3 },
];

const latchOptions = [
  { label: 'Latch UP', value: 0 },
  { label: 'Latch DOWN', value: 1 },
];

const translatedLatchOptions = computed(() => 
  latchOptions.map(opt => ({ ...opt, label: t(opt.label) }))
);

const titleKeys = ['modes.extension.none', 'modes.spi.custom', 'modes.spi.3xcd4021', 'modes.spi.3xsn74hc165', 'modes.extension.spi_tm', 'modes.spi.vpc'];
const detailKeys = ['none', 'custom', 'tm_style', '165_style', 'tm', 'vpc'];

const currentModeTitle = computed(() => titleKeys[extensionMode.value] || 'modes.extension.none');
const currentModeDetail = computed(() => detailKeys[extensionMode.value] || 'none');

const handleModeChange = async (value: string | number) => {
  if (store.gpio) {
    const numValue = Number(value);
    await store.updateGPIO({
      extension_mode: numValue
    });
  }
};

const saveSpi = async () => {
  if (store.gpio) {
    await store.updateGPIO({
      ...spiSettings
    });
  }
};

watch(() => store.gpio, (newVal) => {
  if (newVal) {
    extensionMode.value = newVal.extension_mode;
    Object.assign(spiSettings, {
      spi_mode: newVal.spi_mode,
      spi_latch_mode: newVal.spi_latch_mode,
      spi_latch_delay: newVal.spi_latch_delay,
      spi_clk_pulse_length: newVal.spi_clk_pulse_length,
    });
  }
}, { deep: true });
</script>

<style scoped>
.protocol-tab {
  padding: var(--content-padding);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.spi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.protocol-select {
  width: 100%;
}

.protocol-info-box {
  margin-top: 0.5rem;
}

.info-title {
  color: var(--accent-primary) !important;
  font-size: 1.1rem !important;
  margin-bottom: 1.5rem !important;
  text-transform: none !important;
  font-weight: 700;
}

.protocol-info-section {
  margin-bottom: 1.5rem;
}

.protocol-info-section:last-child {
  margin-bottom: 0;
}

.info-section__title {
  font-size: 0.85rem;
  color: var(--text-main);
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.info-section__text {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.7;
}
</style>
