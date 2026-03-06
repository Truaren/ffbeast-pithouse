<template>
  <div class="hardware-tab">
    <div class="grid-layout">
      <!-- Motor & Power Limits -->
      <BaseCard :title="$t('groups.motor')">
        <ThemedSwitch 
          v-model="ffbEnabled" 
          :label="$t('labels.ffb_active')" 
          @change="toggleFFB"
        />
        <ThemedSlider 
          v-model="hardware.power_limit" 
          :label="$t('settings.power_limit')" 
          value-suffix="%"
          help-key="help.power_limit"
          @update:model-value="saveHardware"
        />
        <ThemedSlider 
          v-model="hardware.braking_limit" 
          :label="$t('settings.braking_limit')" 
          value-suffix="%"
          help-key="help.braking_limit"
          @update:model-value="saveHardware"
        />
        <ThemedSlider 
          v-model="hardware.amplifier_gain" 
          :label="$t('settings.amplifier_gain')" 
          value-suffix="%"
          :max="500" 
          help-key="help.amplifier_gain"
          @update:model-value="saveHardware"
        />
      </BaseCard>

      <!-- Precision & Filtering -->
      <BaseCard :title="$t('settings.advanced')">
        <ThemedSlider 
          v-model="hardware.encoder_cpr" 
          :label="$t('settings.encoder_cpr')" 
          :min="1" 
          :max="65535" 
          @update:model-value="saveHardware"
        />
        <ThemedSlider 
          v-model="hardware.speed_buffer_size" 
          :label="$t('settings.speed_buffer')" 
          :min="1" 
          :max="255" 
          @update:model-value="saveHardware"
        />
        <ThemedSlider 
          v-model="hardware.position_smoothing" 
          :label="$t('settings.pos_smoothing')" 
          value-suffix="%"
          :max="255"
          help-key="help.position_smoothing"
          @update:model-value="saveHardware"
        />
      </BaseCard>

      <!-- Mechanical Parameters -->
      <BaseCard :title="$t('settings.mech_config')">
        <ThemedSlider 
          v-model="hardware.pole_pairs" 
          :label="$t('settings.pole_pairs')" 
          :min="1" 
          :max="50" 
          help-key="help.pole_pairs"
          @update:model-value="saveHardware"
        />
        <div class="switch-group">
          <ThemedSwitch 
            v-model="encoderDir" 
            :label="$t('settings.encoder_dir')" 
            help-key="help.encoder_direction"
            @change="handleSwitches"
          />
          <ThemedSwitch 
            v-model="forceDir" 
            :label="$t('settings.force_dir')" 
            help-key="help.force_direction"
            @change="handleSwitches"
          />
          <ThemedSwitch 
            v-model="debugTorque" 
            :label="$t('settings.debug_torque')" 
            help-key="help.debug_torque"
            @change="handleSwitches"
          />
        </div>
      </BaseCard>

      <!-- Calibration Parameters -->
      <BaseCard :title="$t('settings.calibration')">
        <ThemedSlider 
          v-model="hardware.calibration_speed" 
          :label="$t('settings.calibration_speed')" 
          value-suffix="%"
          help-key="help.calibration_speed"
          @update:model-value="saveHardware"
        />
        <ThemedSlider 
          v-model="hardware.calibration_magnitude" 
          :label="$t('settings.calibration_magnitude')" 
          value-suffix="%"
          help-key="help.calibration_magnitude"
          @update:model-value="saveHardware"
        />
      </BaseCard>

      <!-- PID Controller Theory -->
      <BaseCard :title="$t('groups.pid')">
        <p class="description">{{ $t('groups.pid_desc') }}</p>
        <ThemedSlider 
          v-model="hardware.proportional_gain" 
          :label="$t('settings.p_gain')" 
          :max="2000" 
          help-key="help.proportional_gain"
          @update:model-value="saveHardware"
        />
        <ThemedSlider 
          v-model="hardware.integral_gain" 
          :label="$t('settings.i_gain')" 
          :max="1000" 
          help-key="help.integral_gain"
          @update:model-value="saveHardware"
        />
      </BaseCard>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue';
import { useHardwareStore } from '../../stores/hardware';
import BaseCard from '../common/BaseCard.vue';
import ThemedSlider from '@shared/components/atoms/ThemedSlider.vue';
import ThemedSwitch from '@shared/components/atoms/ThemedSwitch.vue';

const store = useHardwareStore();

const hardware = reactive({
  encoder_cpr: store.hardware?.encoder_cpr ?? 600,
  power_limit: store.hardware?.power_limit ?? 100,
  braking_limit: store.hardware?.braking_limit ?? 100,
  amplifier_gain: store.hardware?.amplifier_gain ?? 100,
  pole_pairs: store.hardware?.pole_pairs ?? 7,
  calibration_speed: store.hardware?.calibration_speed ?? 10,
  calibration_magnitude: store.hardware?.calibration_magnitude ?? 50,
  proportional_gain: store.hardware?.proportional_gain ?? 100,
  integral_gain: store.hardware?.integral_gain ?? 0,
  force_enabled: store.hardware?.force_enabled ?? 1,
  speed_buffer_size: store.hardware?.speed_buffer_size ?? 10,
  position_smoothing: store.hardware?.position_smoothing ?? 0,
});

const encoderDir = ref(false);
const forceDir = ref(false);
const debugTorque = ref(false);
const ffbEnabled = ref(true);

const syncFromStore = () => {
  if (store.hardware) {
    Object.assign(hardware, store.hardware);
    encoderDir.value = store.hardware.encoder_direction === 1;
    forceDir.value = store.hardware.force_direction === 1;
    debugTorque.value = store.hardware.debug_torque === 1;
    ffbEnabled.value = store.hardware.force_enabled === 1;
  }
};

onMounted(syncFromStore);
watch(() => store.hardware, syncFromStore, { deep: true });

const saveHardware = () => {
  store.updateHW({
    ...hardware,
    force_enabled: ffbEnabled.value ? 1 : 0,
    encoder_direction: encoderDir.value ? 1 : 0,
    force_direction: forceDir.value ? 1 : 0,
    debug_torque: debugTorque.value ? 1 : 0,
  });
};

const handleSwitches = () => {
  saveHardware();
};

const toggleFFB = async (val: boolean) => {
  ffbEnabled.value = val;
  saveHardware();
};
</script>

<style scoped>
.hardware-tab {
  padding: var(--content-padding);
}

.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.switch-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}
</style>
