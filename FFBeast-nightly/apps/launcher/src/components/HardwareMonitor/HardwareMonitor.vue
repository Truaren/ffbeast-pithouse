<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue';
import { listen } from '@tauri-apps/api/event';
import { HardwareService } from '../../services/tauri';
import { HardwareStatus } from '../../types';

export default defineComponent({
  name: 'HardwareMonitor',
  setup() {
    const isConnected = ref(false);
    const position = ref(0);
    const torque = ref(0);
    const rotation = ref(0);
    let unlisten: (() => void) | null = null;
    let pollInterval: number | null = null;

    const checkConnection = async () => {
      try {
        isConnected.value = await HardwareService.checkConnection();
      } catch (e) {
        console.error("Connection check failed", e);
      }
    };

    const handleReset = async () => {
        try { await HardwareService.resetCenter(); } catch(e) { console.error(e); }
    };

    const handleReboot = async () => {
        if(!confirm("Reboot device?")) return;
        try { await HardwareService.rebootDevice(); } catch(e) { console.error(e); }
    };

    onMounted(async () => {
        // Initial check
        checkConnection();
        pollInterval = window.setInterval(checkConnection, 3000);

        // Listen for real-time updates
        unlisten = await listen<HardwareStatus>('wheel-status', (event) => {
            const status = event.payload;
            position.value = status.position;
            torque.value = status.torque;
            
            // Map position to rotation (assuming 16-bit signed int range approx -32768 to 32767 mapped to 450 degrees as in legacy)
            // Legacy math: (status.position / 32768) * 450
            rotation.value = (status.position / 32768) * 450;
            
            // If we receive data, we are likely connected
            isConnected.value = true;
        });
    });

    onUnmounted(() => {
        if (unlisten) unlisten();
        if (pollInterval) clearInterval(pollInterval);
    });

    return {
        isConnected,
        position,
        torque,
        rotation,
        handleReset,
        handleReboot
    };
  }
});
</script>

<template>
  <div class="monitor-card">
    <div class="status-badge" :class="{ connected: isConnected, searching: !isConnected }">
        {{ isConnected ? $t('app.connected') : $t('app.searching') }}
    </div>

    <div class="content-row">
        <!-- Visual Wheel -->
        <div class="visual-container">
            <div class="wheel-inner" :style="{ transform: `rotate(${rotation}deg)` }">
                <div class="spoke" style="transform: rotate(0deg)"></div>
                <div class="spoke" style="transform: rotate(120deg)"></div>
                <div class="spoke" style="transform: rotate(240deg)"></div>
            </div>
        </div>

        <!-- Data -->
        <div class="data-grid">
            <div class="data-item">
                <span class="label">{{ $t('monitor.position') || 'Position' }}</span>
                <span class="value">{{ position }}</span>
            </div>
            <div class="data-item">
                 <span class="label">{{ $t('monitor.torque') || 'Torque' }}</span>
                 <span class="value">{{ torque }}</span>
            </div>
        </div>

        <!-- Actions -->
        <div class="actions">
            <button v-if="isConnected" @click="$emit('open-config')" class="btn-primary-outline">
                 {{ $t('monitor.configure') || 'Configure Wheel' }}
            </button>
            <button @click="handleReset" class="btn-secondary">{{ $t('monitor.reset_center') || 'Reset Center' }}</button>
            <button @click="handleReboot" class="btn-danger">{{ $t('monitor.reboot') || 'Reboot' }}</button>
        </div>
    </div>
  </div>
</template>

<style scoped>
.monitor-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 2rem;
    position: relative;
    margin-bottom: 2rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.status-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid currentColor;
}

.status-badge.connected {
    color: var(--success-color);
    background: rgba(16, 185, 129, 0.1);
}

.status-badge.searching {
    color: var(--primary-color);
    background: rgba(124, 58, 237, 0.1);
    animation: pulse 2s infinite;
}

.content-row {
    display: flex;
    align-items: center;
    gap: 3rem;
    flex-wrap: wrap;
    justify-content: center;
}

.visual-container {
    width: 100px;
    height: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
}

.wheel-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 10px solid #1e293b;
    background: radial-gradient(circle, #334155 0%, #0f172a 100%);
    position: relative;
    transition: transform 0.05s linear; /* Smooth update for visual */
}

/* Marker */
.wheel-inner::after {
    content: '';
    position: absolute;
    top: 5px;
    left: 50%;
    transform: translateX(-50%);
    width: 8px;
    height: 8px;
    background: var(--primary-color);
    border-radius: 50%;
    box-shadow: 0 0 10px var(--primary-color);
}

.spoke {
    position: absolute;
    width: 8px;
    height: 50%;
    background: rgba(255,255,255,0.1);
    left: calc(50% - 4px);
    top: 0;
    transform-origin: bottom center;
}

.data-grid {
    display: flex;
    gap: 2rem;
}

.data-item {
    display: flex;
    flex-direction: column;
}

.label {
    font-size: 0.7rem;
    text-transform: uppercase;
    opacity: 0.6;
}

.value {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--primary-color);
    font-variant-numeric: tabular-nums;
}

.actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-left: auto;
}

button {
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.85rem;
    transition: all 0.2s;
}

.btn-secondary {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-color);
}
.btn-secondary:hover { 
    border-color: var(--primary-color); 
    color: var(--primary-color);
}

.btn-primary-outline {
    background: transparent;
    border: 1px solid var(--primary-color);
    color: var(--primary-color);
}
.btn-primary-outline:hover {
    background: var(--primary-color);
    color: white;
}

.btn-danger {
    background: transparent;
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: var(--danger-color);
}

.btn-danger:hover {
    background: var(--danger-color);
    color: white;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

@media (max-width: 768px) {
    .content-row {
        gap: 2rem;
        flex-direction: column;
        text-align: center;
    }
    .actions { margin-left: 0; width: 100%; }
    .actions button { width: 100%; }
}
</style>
