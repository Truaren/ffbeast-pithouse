<template>
  <div class="inputs-tab">
    <div class="axes-grid">
      <AxisMappingRow
        v-for="index in activeIndices"
        :key="index"
        :index="index"
        :label="getAxisLabel(index)"
        v-model="axisNames[index]"
        :raw-value="getAxisValue(index)"
        :default-name="getDefaultName(index)"
        :min="store.adc?.raxis_min[index]"
        :max="store.adc?.raxis_max[index]"
        :invert="store.adc?.raxis_invert[index] === 1"
        :smoothing="store.adc?.raxis_smoothing[index]"
        :btn-low="store.adc?.raxis_to_button_low[index]"
        :btn-high="store.adc?.raxis_to_button_high[index]"
        @edit="startEditing(index)"
        @save-name="saveAxisName"
        @update:min="(v: number) => updateMin(index, v)"
        @update:max="(v: number) => updateMax(index, v)"
        @update:invert="(v: boolean) => updateInvert(index, v)"
        @update:smoothing="(v: number) => updateSmoothing(index, v)"
        @update:btn-low="(v: number) => updateBtnLow(index, v)"
        @update:btn-high="(v: number) => updateBtnHigh(index, v)"
      />
    </div>

    <!-- Mapping Modal -->
    <MappingEditModal
      v-if="editingIdx !== null"
      :show="showModal"
      :axis-index="editingIdx"
      :axis-name="axisNames[editingIdx] || getDefaultName(editingIdx)"
      :axis-value="getScaledAxisValue(editingIdx)"
      :initial-config="getCurrentMappingConfig(editingIdx)"
      @close="closeModal"
      @save="handleModalSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHardwareStore } from '../../stores/hardware';
import { useHardwareStream } from '@shared/composables/useHardwareStream';
import AxisMappingRow from '@shared/components/organisms/AxisMappingRow.vue';
import MappingEditModal, { type MappingConfig } from '@shared/components/organisms/MappingEditModal.vue';
import type { KeyMapping } from '@shared/models/KeyMapping';
import { useMappingPersistence } from '@shared/composables/useMappingPersistence';

const store = useHardwareStore();
const { t } = useI18n();
const { status: hardwareStatus } = useHardwareStream();

// State
const showModal = ref(false);
const editingIdx = ref<number | null>(null);

const { axisNames, mappings, load: loadConfig, save: saveConfig } = useMappingPersistence();

// Computed
const activeIndices = computed(() => {
  return [0, 1, 2, 3, 4, 5, 6, 7].filter(i => {
    if (i < 3) return true;
    return store.gpio?.pin_mode[i] === 2; // Analog mode
  });
});

// Helper functions for labels and names
const getAxisLabel = (index: number) => {
  if (index < 3) return `R${['x', 'y', 'z'][index]}`;
  return `GPIO ${index}`;
};

const getDefaultName = (index: number) => {
  switch(index) {
    case 0: return t('axis.names.rotation_x');
    case 1: return t('axis.names.rotation_y');
    case 2: return t('axis.names.rotation_z');
    case 3: return t('axis.names.slider');
    case 4: return t('axis.names.dial');
    default: return `${t('axis.names.aux')} ${index - 4}`;
  }
};

// Implementation
const getAxisValue = (index: number) => {
  return hardwareStatus.value?.adc[index] ?? 0;
};

const getScaledAxisValue = (index: number) => {
  const raw = getAxisValue(index);
  // Scale 12-bit (0-4095) to 15-bit (0-32767)
  return Math.floor((raw * 32767) / 4095);
};


// Calibration Updates
const updateMin = (index: number, val: number) => {
  if (!store.adc) return;
  const mins = [...store.adc.raxis_min];
  mins[index] = val;
  store.updateADC({ raxis_min: mins });
};

const updateMax = (index: number, val: number) => {
  if (!store.adc) return;
  const maxes = [...store.adc.raxis_max];
  maxes[index] = val;
  store.updateADC({ raxis_max: maxes });
};

const updateInvert = (index: number, invert: boolean) => {
  if (!store.adc) return;
  const invs = [...store.adc.raxis_invert];
  invs[index] = invert ? 1 : 0;
  store.updateADC({ raxis_invert: invs });
};

const updateSmoothing = (index: number, val: number) => {
  if (!store.adc) return;
  const vals = [...store.adc.raxis_smoothing];
  vals[index] = val;
  store.updateADC({ raxis_smoothing: vals });
};

const updateBtnLow = (index: number, val: number) => {
  if (!store.adc) return;
  const vals = [...store.adc.raxis_to_button_low];
  vals[index] = val;
  store.updateADC({ raxis_to_button_low: vals });
};

const updateBtnHigh = (index: number, val: number) => {
  if (!store.adc) return;
  const vals = [...store.adc.raxis_to_button_high];
  vals[index] = val;
  store.updateADC({ raxis_to_button_high: vals });
};

const getCurrentMappingConfig = (index: number): MappingConfig => {
  const m = mappings.value[index];
  return {
    keyLow: m?.keyLow || '',
    thresholdLow: m?.thresholdLow ?? 2000,
    keyHigh: m?.keyHigh || '',
    thresholdHigh: m?.thresholdHigh ?? 30000
  };
};

const startEditing = (index: number) => {
  editingIdx.value = index;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingIdx.value = null;
};

const saveAxisName = () => {
  saveConfig(axisNames.value);
};

const handleModalSave = async (newName: string, config: MappingConfig) => {
  if (editingIdx.value === null) return;
  const idx = editingIdx.value;

  // Update local state
  axisNames.value[idx] = newName;
  mappings.value[idx] = { ...mappings.value[idx], ...config };

  // Persist
  saveConfig(axisNames.value, mappings.value);

  // Generate KeyMappings for backend
  await pushKeyMappingsToBackend();
  
  closeModal();
};

const pushKeyMappingsToBackend = async () => {
  const keyMappings: KeyMapping[] = [];
  
  activeIndices.value.forEach((actualIndex: number) => {
    const mapping = mappings.value[actualIndex];
    if (!mapping) return;
    
    // High threshold mapping
    if (mapping.keyHigh) {
      keyMappings.push({
        id: `axis.${actualIndex}_high_${mapping.keyHigh}`,
        source_type: 'axis',
        index: actualIndex,
        trigger: 'high',
        key: mapping.keyHigh,
        threshold: mapping.thresholdHigh ?? 30000
      });
    }
    
    // Low threshold mapping
    if (mapping.keyLow) {
      keyMappings.push({
        id: `axis.${actualIndex}_low_${mapping.keyLow}`,
        source_type: 'axis',
        index: actualIndex,
        trigger: 'low',
        key: mapping.keyLow,
        threshold: mapping.thresholdLow ?? 2000
      });
    }
  });

  if (keyMappings.length > 0) {
    try {
      await store.updateKeyboardMapping(keyMappings);
      store.log('info', `Configured ${keyMappings.length} axis keyboard mappings`);
    } catch (err) {
      store.log('error', `Failed to set keyboard mappings: ${err}`);
    }
  }
};

onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
.inputs-tab {
  padding: var(--content-padding);
}

.axes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}
</style>
