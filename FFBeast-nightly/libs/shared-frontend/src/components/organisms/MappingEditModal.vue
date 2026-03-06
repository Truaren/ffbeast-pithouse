<template>
  <div v-if="show" class="mapping-modal-overlay" @click.self="close">
    <div class="mapping-modal">
      <div class="modal-header">
        <h3 class="modal-title">
          {{ t('axis.edit_title') }} <span class="highlight">{{ axisName }}</span>
        </h3>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="modal-content">
        <!-- Axis Name -->
        <div class="form-group">
          <ThemedInput
            v-model="localName"
            :label="t('axis.custom_name')"
            help-key="help.axis_custom_name"
          />
        </div>
        
        <div class="mapping-section">
          <div class="section-divider">{{ t('axis.keyboard_mapping') }}</div>
          
          <!-- Deadzone/Threshold Sliders -->
          <div class="deadzone-config">
            <DualThresholdSlider
              v-model:lowValue="config.thresholdLow"
              v-model:highValue="config.thresholdHigh"
              :min="0"
              :max="32767"
              :max-low="13106"
              :min-high="19660"
              :label="t('settings.deadzone')"
              :raw-value="liveValue"
              help-key="help.motion_range"
            />
          </div>

          <div class="form-row">
            <ThemedSelect
              v-model="config.keyLow"
              :options="keyOptions"
              :label="t('axis.key_low')"
            />
            <ThemedSelect
              v-model="config.keyHigh"
              :options="keyOptions"
              :label="t('axis.key_high')"
            />
          </div>

          <template v-if="showButtons">
            <div class="section-divider" style="margin-top: 24px;">{{ t('axis.joystick_mapping') }}</div>
            <div class="form-row">
              <ThemedSelect
                v-model="config.btnLow"
                :options="buttonOptions"
                :label="$t('axis.button_low') || 'Button Low'"
              />
              <ThemedSelect
                v-model="config.btnHigh"
                :options="buttonOptions"
                :label="$t('axis.button_high') || 'Button High'"
              />
            </div>
          </template>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-outline" @click="close">{{ t('modals.cancel') }}</button>
        <button class="btn-primary" @click="save">{{ t('modals.save') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ThemedInput from '../atoms/ThemedInput.vue';
import ThemedSelect, { type SelectOption } from '../atoms/ThemedSelect.vue';
import DualThresholdSlider from '../molecules/DualThresholdSlider.vue';
import { useHardwareStream } from '../../composables/useHardwareStream';

export interface MappingConfig {
  keyLow: string;
  thresholdLow: number;
  keyHigh: string;
  thresholdHigh: number;
  btnLow?: string;
  btnHigh?: string;
}

interface Props {
  show: boolean;
  axisIndex: number; // Required for fetching live data
  axisName: string;
  axisValue: number; // Initial/Fallback value
  initialConfig: MappingConfig;
  showButtons?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showButtons: false
});

const emit = defineEmits<{
  'close': [];
  'save': [name: string, config: MappingConfig];
}>();

const { t } = useI18n();
const { status: hardwareStream } = useHardwareStream();

// Real-time value from stream, fallback to prop
const liveValue = computed(() => {
  if (props.axisIndex !== undefined && hardwareStream.value?.adc) {
    // Map logical axis (0, 1, 2) to hardware analogs (3, 4, 5)
    // Hardware often sends 12-bit (0-4095). We need to scale this to 16-bit (0-32767)
    const raw = hardwareStream.value.adc[props.axisIndex + 3] ?? 0;
    return Math.floor((raw * 32767) / 4095);
  }
  return props.axisValue || 0;
});

// Local state
const localName = ref('');
const config = ref<MappingConfig>({
  keyLow: '',
  thresholdLow: 2000,
  keyHigh: '',
  thresholdHigh: 30000,
  btnLow: '',
  btnHigh: '',
});

// Watch triggers to sync props to local state
watch(() => props.show, (newVal: boolean) => {
  if (newVal) {
    localName.value = props.axisName;
    config.value = { 
      btnLow: '',
      btnHigh: '',
      ...props.initialConfig 
    };
  }
}, { immediate: true });


const KEY_LIST = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "Up", "Down", "Left", "Right", "Space", "Enter", "Tab", "Shift", "Ctrl", "Alt", "Esc"];

const keyOptions = computed(() => {
  const opts: SelectOption[] = [{ label: t('options.none') || 'None', value: '' }];
  KEY_LIST.forEach(k => {
    // Check if translation exists, otherwise use the key name
    const translationKey = `keys.${k.toLowerCase()}`;
    const keyLabel = t(translationKey) !== translationKey ? t(translationKey) : k;
    opts.push({ label: keyLabel, value: k });
  });
  return opts;
});

const buttonOptions = computed(() => {
  const opts: SelectOption[] = [{ label: t('options.none') || 'None', value: '' }];
  for (let i = 0; i < 32; i++) {
    opts.push({ label: `${t('labels.button') || 'Button'} ${i + 1}`, value: `BUTTON_${i}` });
  }
  return opts;
});

function close() {
  emit('close');
}

function save() {
  emit('save', localName.value, { ...config.value });
}
</script>

<style scoped>
.mapping-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.mapping-modal {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.highlight {
  color: var(--accent);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--text-main);
}

.modal-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.preview-monitor {
  padding: 16px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-dim);
  font-weight: 700;
}

.preview-value {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--accent);
  font-weight: 600;
}

.section-divider {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--accent);
  border-bottom: 1px solid var(--accent-muted);
  padding-bottom: 4px;
  margin-bottom: 12px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.deadzone-config {
  margin-bottom: 16px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: rgba(0, 0, 0, 0.1);
}

.btn-primary, .btn-outline {
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--accent);
  color: #000;
  border: none;
}

.btn-primary:hover {
  background: var(--accent-muted);
  transform: translateY(-1px);
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-dim);
}

.btn-outline:hover {
  border-color: var(--text-main);
  color: var(--text-main);
}
</style>
