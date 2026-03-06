<template>
  <BaseModal :show="show" title="Configurações" @close="closeModal" size="large">
    <div class="settings-modal-content">
        <div class="tabs-header">
            <button 
                v-for="t in tabs" 
                :key="t.id" 
                :class="['tab-btn', { active: currentTab === t.id }]"
                @click="currentTab = t.id"
            >
                {{ t.label }}
            </button>
        </div>

        <div class="tab-content">
            <!-- Controller / Hardware Settings -->
            <div v-if="currentTab === 'controller'" class="settings-panel">
                <BaseCard :title="$t('settings.hw.title') || 'Controladora'">
                    <!-- Motor Force (Power Limit) -->
                    <BaseSlider 
                        v-model="wheelSettings.power_limit"
                        :label="$t('settings.hw.power_limit') || 'Força do Motor (Power Limit)'"
                        :min="0"
                        :max="100"
                        suffix="%"
                    />
                    
                     <!-- Total Effect Force -->
                     <BaseSlider 
                        v-model="wheelSettings.total_force"
                        :label="$t('settings.hw.total_effects') || 'Força Total dos Efeitos'"
                        :min="0"
                        :max="100"
                        suffix="%"
                    />

                    <!-- Additional Useful Settings -->
                    <BaseSlider 
                        v-model="wheelSettings.motion_range"
                        :label="$t('settings.wheel.motion_range') || 'Alcance (Graus)'"
                        :min="180"
                        :max="1440"
                        :step="10"
                        suffix="°"
                    />

                    <BaseSlider 
                        v-model="wheelSettings.integrated_spring_strength"
                        :label="$t('settings.wheel.integrated_spring') || 'Mola Centralizadora'"
                        :min="0"
                        :max="100"
                        suffix="%"
                    />

                    <div class="hw-actions">
                        <button class="btn-secondary full-width" @click="applyToHardware">
                            ⚡ {{ $t('settings.actions.apply_wheel') || 'Aplicar Configurações no Volante Agora' }}
                        </button>
                        <p class="help-text">Aplica as configurações imediatamente ao hardware.</p>
                    </div>
                </BaseCard>
            </div>

            <!-- Mapping Settings -->
            <div v-else-if="currentTab === 'mapping'" class="settings-panel no-padding">
                <div class="mappings-layout">
                    <!-- Sidebar: Profile List -->
                    <aside class="profiles-sidebar">
                        <div class="sidebar-header">
                            <h4>Perfis</h4>
                            <button class="btn-create" @click="createNewProfile" title="Novo Perfil">
                                <span>+</span>
                            </button>
                        </div>
                        <ul class="profile-list">
                            <li 
                                v-for="p in profiles" 
                                :key="p.id" 
                                class="profile-item"
                                :class="{ active: selectedProfileId === p.id }"
                                @click="selectProfile(p.id)"
                            >
                                <span class="profile-name">{{ p.name }}</span>
                                <button 
                                    class="btn-delete" 
                                    @click.stop="deleteProfile(p.id)" 
                                    v-if="profiles.length > 1"
                                    title="Excluir"
                                >
                                    🗑️
                                </button>
                            </li>
                        </ul>
                    </aside>

                    <!-- Main: Inputs Editor -->
                    <main class="mappings-content">
                        <div v-if="selectedProfileId" class="content-header">
                            <h3>Editando: {{ getProfileName(selectedProfileId) }}</h3>
                            <span class="active-badge" v-if="selectedProfileId === activeProfileId">Ativo</span>
                            <button v-else class="btn-text" @click="activateProfile(selectedProfileId)">Definir como Ativo</button>
                        </div>
                        <InputsSettings :key="inputsKey" />
                    </main>
                </div>
            </div>

            <!-- Customization Settings -->
            <div v-else-if="currentTab === 'customization'" class="settings-panel">
                <BaseCard :title="$t('settings.ui.title') || 'Personalização'">
                    <div class="setting-row">
                    <label>{{ $t('settings.ui.primary_color') || 'Cor de Destaque' }}</label>
                    <div class="color-picker">
                        <div 
                        v-for="color in accentColors" 
                        :key="color"
                        class="color-dot"
                        :style="{ background: color }"
                        @click="setAccentColor(color)"
                        :class="{ selected: selectedColor === color }"
                        ></div>
                    </div>
                    </div>

                    <BaseSlider 
                    v-model="fontSize"
                    :label="$t('settings.ui.font_size') || 'Tamanho da Fonte'"
                    :min="12"
                    :max="20"
                    suffix="px"
                    @update:modelValue="applyFontSize"
                    />
                </BaseCard>
            </div>
        </div>

        <div class="modal-footer-custom">
            <button class="btn-primary" @click="saveAllSettings">
                💾 {{ $t('settings.actions.save_all') || 'Salvar Configurações Gerais' }}
            </button>
        </div>
    </div>
  </BaseModal>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { SettingsService } from '../services/tauri';
import type { DefaultWheelSettings, Profile } from '../types/settings';
import BaseModal from './common/BaseModal.vue';
import BaseCard from './common/BaseCard.vue';
import BaseSlider from './common/BaseSlider.vue';
import InputsSettings from './InputsSettings.vue';

export default defineComponent({
  name: 'SettingsModal',
  components: {
    BaseModal,
    BaseCard,
    BaseSlider,
    InputsSettings
  },
  props: {
      show: {
          type: Boolean,
          default: false
      }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const currentTab = ref('controller');
    const tabs = [
        { id: 'controller', label: 'Controladora' },
        { id: 'mapping', label: 'Mapeamento' },
        { id: 'customization', label: 'Personalização' }
    ];

    // Wheel State
    const wheelSettings = ref<DefaultWheelSettings>({
      motion_range: 900,
      total_force: 100,
      integrated_spring_strength: 0,
      static_dampening_strength: 0,
      dynamic_dampening_strength: 0,
      soft_stop_strength: 50,
      soft_stop_range: 10,
      soft_stop_dampening: 0,
      direct_x_constant: 100,
      direct_x_periodic: 100,
      direct_x_spring: 100,
      invert_game_force: false,
      power_limit: 100,
      braking_limit: 100
    });

    // Profile State
    const profiles = ref<Profile[]>([]);
    const selectedProfileId = ref<string>('');
    const activeProfileId = ref<string>(''); // Track specifically active ID
    const inputsKey = ref(0); // To force re-render

    // UI State
    const fontSize = ref(16);
    const accentColors = ['#8b5cf6', '#d946ef', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
    const selectedColor = ref('');

    const loadSettings = async () => {
      try {
        const settings = await SettingsService.getDefaultWheelSettings();
        wheelSettings.value = { ...wheelSettings.value, ...settings };
        
        const savedFontSize = localStorage.getItem('launcher_font_size');
        if (savedFontSize) fontSize.value = parseInt(savedFontSize);
        
        const savedColor = localStorage.getItem('launcher_accent_color');
        if(savedColor) selectedColor.value = savedColor;
        
        await loadProfiles();

      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    };

    const loadProfiles = async () => {
        try {
            profiles.value = await SettingsService.listProfiles();
            const activeId = await SettingsService.getActiveProfileId();
            if (activeId) {
                activeProfileId.value = activeId;
                // If nothing selected, select active
                if (!selectedProfileId.value) {
                     selectedProfileId.value = activeId;
                }
            } else if (profiles.value.length > 0) {
                activeProfileId.value = profiles.value[0].id;
                selectedProfileId.value = profiles.value[0].id;
                await SettingsService.setActiveProfile(profiles.value[0].id);
            }
            inputsKey.value++; 
        } catch(e) {
            console.error(e);
        }
    }

    onMounted(loadSettings);

    const closeModal = () => emit('close');
    
    // ... Save/Apply functions identical to before ...
    const saveAllSettings = async () => {
      try {
        await SettingsService.saveDefaultWheelSettings(wheelSettings.value);
      } catch (e) {
        alert('Erro ao salvar: ' + e);
      }
      closeModal();
    };

    const applyToHardware = async () => {
      try {
        await SettingsService.applyWheelSettingsToHardware(wheelSettings.value);
      } catch (e) {
        alert('Erro ao aplicar: ' + e);
      }
    };

    const setAccentColor = (color: string) => {
      document.documentElement.style.setProperty('--primary-color', color);
      localStorage.setItem('launcher_accent_color', color);
      selectedColor.value = color;
    };

    const applyFontSize = () => {
      document.documentElement.style.fontSize = `${fontSize.value}px`;
      localStorage.setItem('launcher_font_size', fontSize.value.toString());
    };

    // Profile Actions
    const selectProfile = async (id: string) => {
        selectedProfileId.value = id;
        // Auto-activate for now to simplify editing logic with existing components
        await activateProfile(id);
    };

    const activateProfile = async (id: string) => {
         try {
            await SettingsService.setActiveProfile(id);
            activeProfileId.value = id;
            inputsKey.value++; // Force InputsSettings reload with new active profile
         } catch(e) {
             console.error(e);
         }
    };

    const createNewProfile = async () => {
        const name = prompt("Nome do perfil:");
        if(!name) return;
        try {
            const id = await SettingsService.createProfile(name);
            await loadProfiles(); 
            selectProfile(id);
        } catch(e) {
            alert("Erro ao criar perfil: " + e);
        }
    }

    const deleteProfile = async (id: string) => {
        if(!confirm("Excluir este perfil?")) return;
        try {
            await SettingsService.deleteProfile(id);
            // If deleted selected, clear selection
            if(selectedProfileId.value === id) {
                 selectedProfileId.value = '';
            }
            await loadProfiles();
        } catch(e) {
            alert("Erro ao excluir: " + e);
        }
    }

    const getProfileName = (id: string) => {
        return profiles.value.find(p => p.id === id)?.name || 'Desconhecido';
    };

    return {
        currentTab,
        tabs,
        wheelSettings,
        profiles,
        selectedProfileId,
        activeProfileId,
        inputsKey,
        fontSize,
        accentColors,
        selectedColor,
        saveAllSettings,
        applyToHardware,
        setAccentColor,
        applyFontSize,
        selectProfile,
        activateProfile,
        createNewProfile,
        deleteProfile,
        getProfileName,
        closeModal
    };
  }
});
</script>

<style scoped>
.settings-modal-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    /* Ensure modal content fits */
    min-height: 500px;
}

.tabs-header {
    display: flex;
    gap: 1rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 1rem;
    margin-bottom: 0; /* Updated */
    flex-shrink: 0;
}

.tab-btn {
    background: transparent;
    border: none;
    color: var(--text-color);
    opacity: 0.6;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    transition: all 0.2s;
}

.tab-btn:hover { opacity: 1; background: rgba(255,255,255,0.05); }
.tab-btn.active { opacity: 1; background: var(--primary-color); color: white; }

.settings-panel {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem 0.5rem 0.5rem 0; /* Right padding for scrollbar */
}

/* Specific styling for mapping panel which has internal columns */
.settings-panel.no-padding {
    padding: 0;
    overflow: hidden; /* Internal scrolling */
    display: flex;
}

.mappings-layout {
    display: flex;
    width: 100%;
    height: 100%;
    gap: 0;
}

/* Sidebar */
.profiles-sidebar {
    width: 250px;
    background: rgba(0,0,0,0.2);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
}

.sidebar-header {
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.sidebar-header h4 { margin: 0; font-size: 1rem; opacity: 0.8; }

.btn-create {
    background: var(--primary-color);
    border: none;
    border-radius: 4px;
    width: 24px;
    height: 24px;
    color: white;
    cursor: pointer;
    font-size: 1.2rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.profile-list {
    list-style: none;
    padding: 0;
    margin: 0;
    overflow-y: auto;
    flex: 1;
}

.profile-item {
    padding: 0.8rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    transition: background 0.2s;
}

.profile-item:hover { background: rgba(255,255,255,0.05); }
.profile-item.active { background: rgba(var(--primary-rgb), 0.15); border-left: 3px solid var(--primary-color); }

.profile-name { font-weight: 500; font-size: 0.95rem; }

.btn-delete {
    background: transparent;
    border: none;
    opacity: 0;
    cursor: pointer;
    transition: opacity 0.2s;
    font-size: 0.9rem;
}

.profile-item:hover .btn-delete { opacity: 0.7; }
.btn-delete:hover { opacity: 1; }

/* Main Content */
.mappings-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
}

.content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
}

.content-header h3 { margin: 0; font-size: 1.2rem; }

.active-badge {
    background: #10b981;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: bold;
    text-transform: uppercase;
}

.btn-text {
    background: none;
    border: none;
    color: var(--primary-color);
    text-decoration: underline;
    cursor: pointer;
}

/* Reused UI Styles */
.hw-actions { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border-color); }
.full-width { width: 100%; }
.help-text { font-size: 0.85rem; color: #888; text-align: center; margin-top: 0.5rem; }
.setting-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
.color-picker { display: flex; gap: 1rem; }
.color-dot { width: 24px; height: 24px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; }
.color-dot.selected { border-color: white; transform: scale(1.2); box-shadow: 0 0 10px var(--primary-color); }
.color-dot:hover { transform: scale(1.1); }

.modal-footer-custom {
    margin-top: 0; /* Footer sits at bottom */
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    background: var(--card-bg); /* Ensure opaque over scroll */
}

.btn-primary { 
    padding: 0.8rem 1.5rem; 
    border: none; 
    border-radius: 8px; 
    font-weight: 600; 
    cursor: pointer; 
    background: var(--primary-color); 
    color: white; 
}
.btn-secondary {
    padding: 0.8rem 1.5rem; 
    border: 1px solid var(--primary-color); 
    border-radius: 8px; 
    font-weight: 600; 
    cursor: pointer; 
    background: transparent; 
    color: var(--primary-color);
}
</style>
