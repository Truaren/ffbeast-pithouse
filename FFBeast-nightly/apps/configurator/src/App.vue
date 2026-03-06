<template>
  <div class="app-container">
    <nav class="sidebar">
      <div class="brand">
        <img src="./assets/logo_app.png" alt="FFBeast Logo" class="brand-logo">
        <span class="brand-name">FFBeast UI</span>
      </div>
      
      <div class="nav-items">
        <div 
          v-for="tab in mainTabs" 
          :key="tab.id" 
          :class="['nav-item', { active: currentTab === tab.id }]" 
          @click="currentTab = tab.id"
        >
          <span class="icon">{{ tab.icon }}</span>
          <span class="label">{{ $t(tab.label) }}</span>
        </div>
        
        <div 
          :class="['nav-item', 'settings-item', { active: currentTab === 'settings' }]" 
          @click="currentTab = 'settings'"
        >
          <span class="icon">⚙️</span>
          <span class="label">{{ $t('tabs.settings') }}</span>
        </div>
      </div>

      <div class="sidebar-footer">
        <div :class="['status-indicator', { connected: store.isConnected, disconnected: !store.isConnected }]">
          <div class="status-dot"></div>
          <span class="status-text">{{ $t(statusTextKey) }}</span>
        </div>
      </div>
    </nav>

    <main class="content">
      <header class="content-header">
        <h2 class="tab-title">{{ $t(currentTabLabel) }}</h2>
        <div class="header-actions">
          <button class="btn-outline reboot" @click="handleReboot">{{ $t('buttons.reboot') }}</button>
          <button class="btn-outline" @click="handleResetCenter">{{ $t('buttons.reset_center') }}</button>
          <button 
            :class="['btn-primary', { 'has-changes': store.hasUnsavedChanges, 'reboot-required': store.rebootRequired }]" 
            @click="handleSave"
            :title="store.rebootRequired ? $t('warnings.reboot_required') : ''"
          >
            <span v-if="store.hasUnsavedChanges" class="unsaved-dot"></span>
            {{ store.rebootRequired ? $t('buttons.save_reboot') : $t('buttons.save') }}
          </button>
        </div>
      </header>

      <div class="tab-viewport">
        <Transition name="fade" mode="out-in">
          <MonitorTab v-if="currentTab === 'monitor'" />
          <EffectsTab v-else-if="currentTab === 'effects'" />
          <HardwareTab v-else-if="currentTab === 'hardware'" />
          <ProtocolTab v-else-if="currentTab === 'protocol'" />
          <PinsTab v-else-if="currentTab === 'pins'" />
          <LicenseTab v-else-if="currentTab === 'license'" />
          <ToolsTab v-else-if="currentTab === 'tools'" />
          <ButtonsTab v-else-if="currentTab === 'buttons'" />
          <InputsTab v-else-if="currentTab === 'inputs'" />
          <LogsTab v-else-if="currentTab === 'logs'" />
          <SettingsTab v-else-if="currentTab === 'settings'" />
          <div v-else class="placeholder-content">
            <p>{{ $t('tabs.in_progress') }} ({{ currentTab }})</p>
          </div>
        </Transition>
      </div>
    </main>

    <ToastContainer />
    <BaseTooltip />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useHardwareStore } from './stores/hardware';
import MonitorTab from './components/tabs/MonitorTab.vue';
import EffectsTab from './components/tabs/EffectsTab.vue';
import HardwareTab from './components/tabs/HardwareTab.vue';
import ProtocolTab from './components/tabs/ProtocolTab.vue';
import PinsTab from './components/tabs/PinsTab.vue';
import LicenseTab from './components/tabs/LicenseTab.vue';
import ToolsTab from './components/tabs/ToolsTab.vue';
import ButtonsTab from './components/tabs/ButtonsTab.vue';
import InputsTab from './components/tabs/InputsTab.vue';
import LogsTab from './components/tabs/LogsTab.vue';
import SettingsTab from './components/tabs/SettingsTab.vue';
import ToastContainer from './components/common/ToastContainer.vue';
import BaseTooltip from './components/common/BaseTooltip.vue';
import { useUIStore } from './stores/ui';
import { useLogStore } from './stores/logs';
import { useI18n } from 'vue-i18n';

const store = useHardwareStore();
const ui = useUIStore();
const { t } = useI18n();
const currentTab = ref('monitor');

const mainTabs = [
  { id: 'monitor', label: 'tabs.monitor', icon: '📊' },
  { id: 'effects', label: 'tabs.effects', icon: '⚡' },
  { id: 'hardware', label: 'tabs.hardware', icon: '⚙️' },
  { id: 'protocol', label: 'tabs.protocol', icon: '🔌' },
  { id: 'pins', label: 'tabs.pins', icon: '📍' },
  { id: 'buttons', label: 'tabs.buttons', icon: '🔘' },
  { id: 'inputs', label: 'tabs.inputs', icon: '🎮' },
  { id: 'license', label: 'tabs.license', icon: '🔑' },
  { id: 'tools', label: 'tabs.tools', icon: '🛠️' },
  { id: 'logs', label: 'tabs.logs', icon: '📝' },
];

const tabs = [...mainTabs, { id: 'settings', label: 'tabs.settings', icon: '⚙️' }];

const currentTabLabel = computed(() => {
  return tabs.find(t => t.id === currentTab.value)?.label || '';
});

const statusTextKey = computed(() => {
  return store.isConnected ? 'status.connected' : 'status.disconnected';
});

const handleReboot = async () => {
    console.log('[App] Reboot button clicked');
    try {
        await store.reboot();
        console.log('[App] Reboot completed');
    } catch (err) {
        console.error('[App] Reboot error:', err);
    }
};

const handleResetCenter = async () => {
    console.log('[App] Reset center button clicked');
    try {
        await store.resetCenter();
        console.log('[App] Reset center completed');
    } catch (err) {
        console.error('[App] Reset center error:', err);
    }
};

const handleSave = async () => {
    console.log('[App] Save button clicked');
    try {
        const needsReboot = store.rebootRequired;
        await store.saveToEeprom();
        
        if (needsReboot) {
             console.log('[App] Reboot required, rebooting...');
             await store.reboot();
        }
        
        console.log('[App] Save completed');
    } catch (err) {
        console.error('[App] Save error:', err);
    }
};

onMounted(async () => {
  store.init();
  ui.setMinLogLevel(ui.settings.minLogLevel); // Sync initial log level
  ui.toggleDebugMode(ui.settings.debugMode); // Sync initial debug state
  setupGlobalTooltips();
  
  // Listen for Rust backend logs
  const { listen } = await import('@tauri-apps/api/event');
  await listen<{ level: any, message: string }>('rust-log', (event) => {
    const logStore = useLogStore();
    logStore.addLog(event.payload.level, event.payload.message, 'backend');
  });
});

const setupGlobalTooltips = () => {
  document.addEventListener('mouseover', (e) => {
    const target = (e.target as HTMLElement).closest('[data-help]');
    if (target) {
      const helpKey = target.getAttribute('data-help');
      if (helpKey) {
        ui.showTooltip(t(helpKey), e.clientX, e.clientY);
      }
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (ui.tooltip.show) {
      ui.tooltip.x = e.clientX;
      ui.tooltip.y = e.clientY;
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = (e.target as HTMLElement).closest('[data-help]');
    if (target) {
      ui.hideTooltip();
    }
  });
};
</script>

<style scoped>
.app-container {
  display: flex;
  width: 100%;
  height: 100%;
}

.sidebar {
  width: 200px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.brand {
  padding: 1.5rem 1rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.brand-logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
  filter: drop-shadow(0 0 10px var(--accent-glow));
}

.brand-name {
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--accent);
  letter-spacing: 1px;
}

.nav-items {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0.75rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-dim);
  transition: all 0.2s;
  font-size: 0.9rem;
}

.nav-item.settings-item {
  margin-top: auto;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
}

.nav-item.active {
  background: var(--accent-muted);
  color: var(--accent);
  border-left: 3px solid var(--accent);
  padding-left: 9px;
}

.nav-item .icon {
  font-size: 1.1rem;
  width: 20px;
  text-align: center;
}

.nav-item .label {
  flex: 1;
}

.connection-status {
  padding: 12px;
  margin: 8px;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
}

.connection-status.connected {
  background: rgba(0, 255, 0, 0.1);
  border-color: rgba(0, 255, 0, 0.3);
}

.connection-status .status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--danger);
  display: inline-block;
  margin-right: 6px;
  animation: pulse 2s infinite;
}

.connection-status.connected .status-indicator {
  background: var(--success);
  animation: none;
}

.connection-status .status-text {
  color: var(--text-main);
  font-weight: 600;
  margin-bottom: 4px;
}

.connection-status .error-text {
  color: var(--danger);
  font-size: 0.65rem;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--border);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.75rem;
  color: var(--text-dim);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #444;
}

.status-indicator.connected .status-dot {
  background: var(--success);
  box-shadow: 0 0 10px var(--success);
}

.status-indicator.disconnected .status-dot {
  background: var(--danger);
  box-shadow: 0 0 10px var(--danger);
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--bg-main);
}

.content-header {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(10px);
}

.tab-title {
  font-size: 1.2rem;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.tab-viewport {
  flex: 1;
  overflow-y: auto;
}

/* Button variants - will be moved to common components later */
.btn-primary {
  background: var(--accent);
  color: #000;
  font-weight: bold;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
}

.btn-primary:hover {
  filter: brightness(1.1);
  box-shadow: 0 0 15px var(--accent-glow);
}

.btn-outline {
  border: 1px solid var(--border-bright);
  color: var(--text-main);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
}

.btn-outline:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--text-dim);
}

.reboot {
  color: var(--warning);
  border-color: rgba(255, 165, 2, 0.3);
}

.reboot:hover {
  border-color: var(--warning);
  background: rgba(255, 165, 2, 0.1);
}

.placeholder-content {
  padding: 3rem;
  color: var(--text-dim);
  text-align: center;
  font-style: italic;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.btn-primary.has-changes {
  animation: pulse-glow 2s infinite;
  position: relative;
}

.unsaved-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: var(--warning);
  border-radius: 50%;
  margin-right: 8px;
  animation: pulse-dot 1.5s infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 15px var(--accent-glow);
  }
  50% {
    box-shadow: 0 0 25px var(--accent-glow), 0 0 10px var(--warning);
  }
}

@keyframes pulse-dot {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

.btn-primary.reboot-required {
  background: var(--warning);
  color: #121216;
  border-color: var(--warning);
  animation: pulse-reboot 2s infinite;
}

.btn-primary.reboot-required:hover {
  filter: brightness(1.1);
  box-shadow: 0 0 15px rgba(255, 165, 2, 0.6);
}

@keyframes pulse-reboot {
  0%, 100% {
    box-shadow: 0 0 10px rgba(255, 165, 2, 0.4);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 165, 2, 0.7);
  }
}
</style>
