<template>
  <div class="inputs-settings">
    <div class="axes-grid">
      <AxisMappingRow
        v-for="index in activeIndices"
        :key="index"
        :index="index"
        :label="getAxisLabel(index)"
        v-model="axisNames[index]"
        :raw-value="getAxisRawValue(index)"
        :default-name="DEFAULT_NAMES[index]"
        :min="mappings[index]?.min"
        :max="mappings[index]?.max"
        :invert="mappings[index]?.invert"
        :show-calibration="true"
        @edit="editMapping(index)"
        @save-name="saveMapping"
        @update:min="(v: number) => updateMapping(index, { min: v })"
        @update:max="(v: number) => updateMapping(index, { max: v })"
        @update:invert="(v: boolean) => updateMapping(index, { invert: v })"
      />
    </div>

    <!-- Mapping Modal -->
    <MappingEditModal 
      v-if="editingIdx !== null"
      :show="showModal" 
      :axis-index="editingIdx"
      :axis-name="axisNames[editingIdx] || DEFAULT_NAMES[editingIdx]"
      :axis-value="0"
      :live-value="getScaledAxisValue(editingIdx)"
      :initial-config="getCurrentMappingConfig(editingIdx)"
      :show-buttons="true"
      @close="closeModal"
      @save="handleModalSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { useI18n } from 'vue-i18n';
import { useHardwareStream } from '@shared/composables/useHardwareStream';
import AxisMappingRow from '@shared/components/organisms/AxisMappingRow.vue';
import MappingEditModal, { type MappingConfig } from '@shared/components/organisms/MappingEditModal.vue';
import type { AxisMapping } from '@shared/models/AxisMapping';

const { t } = useI18n();
const { status: hardwareStatus } = useHardwareStream();

// State
const axisNames = ref<string[]>([]);
const mappings = ref<AxisMapping[]>([]);
const showModal = ref(false);
const editingIdx = ref<number | null>(null);

// 6 Axes in Launcher: Wheel, Accel, Brake, Clutch, Aux1, Aux2
const AXIS_COUNT = 6;
const activeIndices = computed(() => Array.from({ length: AXIS_COUNT }, (_, i) => i));

const DEFAULT_NAMES = computed(() => [
  t('axis_names.wheel'),
  t('axis_names.throttle'),
  t('axis_names.brake'),
  t('axis_names.clutch'),
  t('axis_names.aux') + ' 1',
  t('axis_names.aux') + ' 2'
]);

const getAxisLabel = (index: number) => {
  if (index === 0) return t('axis_labels.x_wheel');
  return t('axis_labels.generic', { n: index + 1 });
};

const getAxisRawValue = (index: number) => {
    if (!hardwareStatus.value) return 0;
    if (index === 0) return hardwareStatus.value.position;
    // Map index 1..5 to adc[0]..adc[4]
    return hardwareStatus.value.adc[index - 1] ?? 0;
};

const getScaledAxisValue = (index: number) => {
    const raw = getAxisRawValue(index);
    if (index === 0) {
        // Position is already large, but let's normalize it for the slider (0-32767)
        // Adjust based on typical position range if needed. For now assume raw or scale.
        return Math.abs(raw) % 32768; 
    }
    // Scale 12-bit ADC (0-4095) to 15-bit (0-32767)
    return Math.floor((raw * 32767) / 4095);
};

const initConfig = async () => {
  try {
      const backendMappings: any[] = await invoke('get_keyboard_mapping');
      
      const initialNames = [...DEFAULT_NAMES.value];
      const initialMappings: AxisMapping[] = Array(AXIS_COUNT).fill(0).map((_, i) => ({
        name: DEFAULT_NAMES.value[i],
        min: 0,
        max: 65535,
        invert: false,
        keyLow: '',
        keyHigh: '',
        btnLow: '',
        btnHigh: '',
        thresholdLow: 2000,
        thresholdHigh: 30000
      }));

      if (backendMappings && backendMappings.length > 0) {
          backendMappings.forEach(bm => {
              if (bm.index < AXIS_COUNT) {
                  initialNames[bm.index] = bm.name;
                  initialMappings[bm.index] = {
                      name: bm.name,
                      min: bm.min ?? 0,
                      max: bm.max ?? 65535,
                      invert: bm.inverted ?? false,
                      keyLow: bm.key_low || '',
                      keyHigh: bm.key_high || '',
                      btnLow: bm.btn_low || '',
                      btnHigh: bm.btn_high || '',
                      thresholdLow: bm.threshold_low ?? 2000,
                      thresholdHigh: bm.threshold_high ?? 30000
                  };
              }
          });
      }
      
      axisNames.value = initialNames;
      mappings.value = initialMappings;

  } catch (e) {
      console.error("Failed to load mappings", e);
  }
};

const updateMapping = (index: number, partial: Partial<AxisMapping>) => {
    if (mappings.value[index]) {
        mappings.value[index] = { ...mappings.value[index], ...partial };
        saveMapping();
    }
};

const saveMapping = async () => {
    const backendPayload = mappings.value.map((m, i) => ({
        index: i,
        name: axisNames.value[i] || m.name,
        key_low: m.keyLow,
        key_high: m.keyHigh,
        btn_low: m.btnLow || "",
        btn_high: m.btnHigh || "",
        min: m.min ?? 0,
        max: m.max ?? 65535,
        inverted: m.invert ?? false,
        threshold_low: m.thresholdLow ?? 2000,
        threshold_high: m.thresholdHigh ?? 30000
    }));

    try {
        await invoke('set_keyboard_mapping', { mappings: backendPayload });
    } catch (e) {
        console.error("Failed to save mappings", e);
    }
};

const editMapping = (index: number) => {
  editingIdx.value = index;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingIdx.value = null;
};

const getCurrentMappingConfig = (index: number): MappingConfig => {
  const m = mappings.value[index];
  return {
    keyLow: m?.keyLow || '',
    thresholdLow: m?.thresholdLow ?? 2000,
    keyHigh: m?.keyHigh || '',
    thresholdHigh: m?.thresholdHigh ?? 30000,
    btnLow: m?.btnLow || '',
    btnHigh: m?.btnHigh || ''
  };
};

const handleModalSave = async (newName: string, config: MappingConfig) => {
  if (editingIdx.value === null) return;
  const idx = editingIdx.value;

  axisNames.value[idx] = newName;
  mappings.value[idx] = { ...mappings.value[idx], ...config };

  await saveMapping();
  closeModal();
};

onMounted(() => {
    initConfig();
});
</script>

<style scoped>
.inputs-settings {
    padding-top: 1rem;
}

.axes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}
</style>
