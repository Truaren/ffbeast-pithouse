<template>
  <div class="settings-tab">
    <div class="grid-layout">
      <!-- UI Settings -->
      <BaseCard :title="$t('settings.ui')">
        <ThemedSelect 
          v-model="language" 
          :options="langOptions" 
          :label="$t('settings.language')"
          @change="changeLang"
        />
        
        <ThemedSelect 
          v-model="uiStore.settings.fontFamily" 
          :options="fontOptions" 
          :label="$t('settings.ui_font')"
          @change="(v: string | number) => uiStore.setFontFamily(String(v))"
        />
        
        <ThemedSlider 
          v-model="uiStore.settings.fontSize" 
          :label="$t('settings.font_size')" 
          :min="12" 
          :max="24" 
          @update:model-value="uiStore.setFontSize"
        />
        
        <div class="theme-selector">
          <label class="theme-selector__label">{{ $t('settings.accent_color') }}</label>
          <div class="color-grid">
            <div 
              v-for="color in accentColors" 
              :key="color" 
              class="color-dot"
              :style="{ background: color, borderColor: uiStore.settings.debugMode ? '#fff' : 'transparent' }"
              @click="uiStore.setAccentColor(color)"
            ></div>
          </div>
        </div>
      </BaseCard>

      <!-- Toast Settings -->
      <BaseCard :title="$t('settings.toasts.notifications')">
        <ThemedSelect 
          v-model="uiStore.settings.toastPosition" 
          :options="toastPositionOptions" 
          :label="$t('settings.toasts.position')"
        />
        
        <ThemedSlider 
          v-model="uiStore.settings.toastMargin" 
          :label="$t('settings.toasts.margin')" 
          :min="10" 
          :max="100" 
          value-suffix="px"
        />
        
        <button class="btn-test" @click="testToast">{{ $t('buttons.test_toast') }}</button>
      </BaseCard>

      <!-- Advanced Settings -->
      <BaseCard :title="$t('settings.advanced')">
        <div class="control-row">
          <div class="control-info">
            <span class="control-label">{{ $t('settings.min_log_level') }}</span>
            <span class="control-desc">{{ $t('settings.min_log_level_desc') }}</span>
          </div>
          <ThemedSelect 
            v-model="uiStore.settings.minLogLevel" 
            :options="logLevelOptions"
            class="compact-select"
            @change="(v: string | number) => uiStore.setMinLogLevel(Number(v))"
          />
        </div>
        
        <div class="control-row">
          <div class="control-info">
            <span class="control-label">{{ $t('settings.debug_mode') }}</span>
            <span class="control-desc">{{ $t('settings.debug_desc') }}</span>
          </div>
          <ThemedSwitch 
            v-model="uiStore.settings.debugMode" 
            @change="uiStore.toggleDebugMode"
          />
        </div>
      </BaseCard>

      <!-- App Info -->
      <BaseCard :title="$t('app.info')">
        <div class="info-list">
          <div class="info-item">
            <span class="info-item__label">{{ $t('settings.version') }}</span>
            <span class="info-item__value">v{{ versions.app }}</span>
          </div>
          <div class="info-item">
            <span class="info-item__label">Controller SDK</span>
            <span class="info-item__value">v{{ versions.controller }}</span>
          </div>
          <div class="info-item">
            <span class="info-item__label">{{ $t('settings.build_date') }}</span>
            <span class="info-item__value">2026-01-21</span>
          </div>
          <div class="info-item">
            <span class="info-item__label">{{ $t('settings.build_date') }}</span>
            <span class="info-item__value">2026-01-21</span>
          </div>
        </div>
        <template #footer>
          <div class="info-list">
            <div class="info-item">
              <span class="info-item__label">{{ $t('app.developer') }}</span>
              <span class="info-item__value">Osni Pezzini Junior</span>
            </div>
            <div class="info-item">
              <span class="info-item__label">{{ $t('app.contact') }}</span>
              <span class="info-item__value">osnipezzini@gmail.com</span>
            </div>
          </div>
        </template>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUIStore } from '../../stores/ui';
import { HardwareService } from '../../services/hardware_service';
import BaseCard from '../common/BaseCard.vue';
import ThemedSelect from '@shared/components/atoms/ThemedSelect.vue';
import ThemedSlider from '@shared/components/atoms/ThemedSlider.vue';
import ThemedSwitch from '@shared/components/atoms/ThemedSwitch.vue';

const { locale, t } = useI18n();
const uiStore = useUIStore();

const language = ref(locale.value);
const versions = ref({ app: '...', controller: '...' });

onMounted(async () => {
  try {
    versions.value = await HardwareService.getVersions();
  } catch (e) {
    console.error('Failed to get versions:', e);
    versions.value = { app: 'Unknown', controller: 'Unknown' };
  }
});

const langOptions = [
  { label: 'English', value: 'en' },
  { label: 'Español', value: 'es' },
  { label: 'Português (Brasil)', value: 'pt-BR' },
];

const fontOptions = [
  { label: 'Outfit', value: 'Outfit' },
  { label: 'JetBrains Mono', value: 'JetBrains Mono' },
  { label: 'System Default', value: 'system-ui' },
];

const toastPositionOptions = computed(() => [
  { label: t('toasts.positions.top_right'), value: 'top-right' },
  { label: t('toasts.positions.bottom_right'), value: 'bottom-right' },
  { label: t('toasts.positions.top_left'), value: 'top-left' },
  { label: t('toasts.positions.bottom_left'), value: 'bottom-left' },
]);

const logLevelOptions = [
  { label: 'Error', value: 1 },
  { label: 'Warn', value: 2 },
  { label: 'Info', value: 3 },
  { label: 'Debug', value: 4 },
  { label: 'Trace', value: 5 },
];

const accentColors = [
  '#00d4ff', // Cyan
  '#e056fd', // Purple
  '#0088ff', // Blue
  '#00ccaa', // Teal
  '#ff6b9d', // Pink
];

const changeLang = (val: string | number) => {
  const lang = String(val);
  locale.value = lang;
  uiStore.setLanguage(lang);
};

const testToast = () => {
  uiStore.showToast('This is a test notification! 🎉', 'success');
};
</script>


<style scoped>
.settings-tab {
  padding: var(--content-padding);
}

.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.control-row:last-child {
  border-bottom: none;
}

.control-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.control-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-main);
}

.control-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.compact-select {
  width: 180px;
}

.theme-selector {
  margin-top: 24px;
}

.theme-selector__label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 12px;
}

.color-grid {
  display: flex;
  gap: 12px;
}

.color-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.color-dot:hover {
  transform: translateY(-2px);
  scale: 1.1;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.info-item__label {
  color: var(--text-secondary);
}

.info-item__value {
  font-family: var(--font-mono);
  color: var(--text-main);
  font-weight: 500;
}



.btn-test {
  margin-top: 16px;
  width: 100%;
  padding: 10px;
  background: var(--accent-primary);
  color: #000;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-test:hover {
  filter: brightness(1.1);
  box-shadow: 0 0 15px var(--accent-glow);
}
</style>
