<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';

export default defineComponent({
  name: 'WheelConfigModal',
  emits: ['close'],
  setup() {
    const loading = ref(true);
    // Profile items
    const totalForce = ref(100);
    const motionRange = ref(900);
    const dynamicDamp = ref(0);
    const springStrength = ref(100);

    // Hardware Items
    const invertForce = ref(false);
    
    // Store original HW settings to merge
    let currentHwSettings: any = {};

    let debounceTimer: number | null = null;
    
    const loadCurrentSettings = async () => {
        try {
            loading.value = true;
            const [effects, hw] = await Promise.all([
                invoke('get_effect_settings') as Promise<any>,
                invoke('get_hardware_settings') as Promise<any>
            ]);
            
            // Map Effects
            totalForce.value = effects.total_effect_strength ?? 100;
            motionRange.value = effects.motion_range ?? 900;
            dynamicDamp.value = effects.dynamic_dampening_strength ?? 0;
            springStrength.value = effects.integrated_spring_strength ?? 100;

            // Map HW
            currentHwSettings = hw;
            // Assuming invert logic: if force_direction is -1, it's inverted. Or 1. 
            // Default 1. If 0 or -1, treat as inverted?
            // User requested "Invert Axis"
            invertForce.value = (hw.force_direction || 1) < 0; 

        } catch(e) {
            console.error("Failed to load settings", e);
        } finally {
            loading.value = false;
        }
    };

    const updateSettings = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        
        debounceTimer = window.setTimeout(async () => {
             try {
                // Update Effect Settings
                await invoke("update_effect_settings", {
                    settings: {
                        motion_range: Number(motionRange.value),
                        total_effect_strength: Number(totalForce.value),
                        dynamic_dampening_strength: Number(dynamicDamp.value),
                        integrated_spring_strength: Number(springStrength.value),
                        // Defaults
                        static_dampening_strength: 0,
                        soft_stop_dampening_strength: 0,
                        soft_stop_range: 10,
                        soft_stop_strength: 100,
                        direct_x_constant_direction: 0,
                        direct_x_spring_strength: 100,
                        direct_x_constant_strength: 100,
                        direct_x_periodic_strength: 100,
                    }
                });
                
                // Update Hardware Settings
                // Merge with current to avoid overwriting other values
                const newHwSettings = {
                    ...currentHwSettings,
                    force_direction: invertForce.value ? -1 : 1
                };

                await invoke("update_hardware_settings", {
                    settings: newHwSettings
                });
                
                // Save to EEPROM
                await invoke("save_settings_to_hardware");
                
                console.log("Settings updated");
             } catch(e) {
                 console.error("Failed to update settings", e);
             }
        }, 500); // 500ms debounce
    };

    onMounted(() => {
        loadCurrentSettings();
    });

    return {
        loading,
        totalForce,
        motionRange,
        dynamicDamp,
        springStrength,
        invertForce,
        updateSettings
    };
  }
});
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ $t('config.title') }}</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      
      <div v-if="loading" class="loading">Reading Device...</div>
      
      <div v-else class="sliders-grid">
        <!-- Force -->
        <div class="slider-group">
            <div class="header">
                <label>{{ $t('config.total_force') || 'Total Force' }}</label>
                <span class="val">{{ totalForce }}%</span>
            </div>
            <input 
                type="range" 
                v-model="totalForce" 
                min="0" max="100" 
                @input="updateSettings" 
            />
        </div>

        <!-- Range -->
        <div class="slider-group">
            <div class="header">
                <label>{{ $t('config.motion_range') || 'Motion Range' }}</label>
                <span class="val">{{ motionRange }}°</span>
            </div>
            <input 
                type="range" 
                v-model="motionRange" 
                min="180" max="1080" step="10"
                @input="updateSettings" 
            />
        </div>

        <!-- Dampening -->
        <div class="slider-group">
             <div class="header">
                <label>{{ $t('config.dynamic_damp') || 'Dynamic Dampening' }}</label>
                <span class="val">{{ dynamicDamp }}</span>
            </div>
            <input 
                type="range" 
                v-model="dynamicDamp" 
                min="0" max="1000" 
                @input="updateSettings" 
            />
        </div>
        
         <!-- Spring -->
        <div class="slider-group">
             <div class="header">
                <label>Spring Strength</label>
                <span class="val">{{ springStrength }}%</span>
            </div>
            <input 
                type="range" 
                v-model="springStrength" 
                min="0" max="100" 
                @input="updateSettings" 
            />
        </div>

        <!-- Invert Checkbox -->
        <div class="checkbox-group">
            <label>
                <input type="checkbox" v-model="invertForce" @change="updateSettings">
                Invert Force Direction
            </label>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(5px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
}

.modal-content {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 2rem;
    width: 90%;
    max-width: 600px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.close-btn {
    background: none;
    border: none;
    font-size: 2rem;
    cursor: pointer;
    color: var(--text-color);
    line-height: 1;
}

.loading {
    text-align: center;
    padding: 2rem;
}

.sliders-grid {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.slider-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.checkbox-group {
    display: flex;
    align-items: center;
    margin-top: 1rem;
    font-weight: 600;
}

.checkbox-group input {
    margin-right: 1rem;
    width: 20px;
    height: 20px;
    accent-color: var(--primary-color);
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

label {
    font-weight: 600;
    font-size: 0.9rem;
    opacity: 0.8;
}

.val {
    font-weight: 700;
    color: var(--primary-color);
}

input[type="range"] {
    width: 100%;
    accent-color: var(--primary-color);
}

input[type="range"] {
    /* Simple reset for custom appearance */
    -webkit-appearance: none; 
    appearance: none;
    background: transparent;
}

input[type="range"]::-webkit-slider-runnable-track {
    width: 100%;
    height: 6px;
    background: rgba(124, 58, 237, 0.2);
    border-radius: 3px;
}

input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 18px;
    width: 18px;
    background: var(--primary-color);
    border-radius: 50%;
    margin-top: -6px; /* Align thumb vertically */
    cursor: pointer;
}
</style>
