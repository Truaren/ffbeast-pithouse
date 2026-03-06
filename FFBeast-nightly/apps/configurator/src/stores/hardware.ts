import { defineStore } from 'pinia';
import { HardwareService } from '../services/hardware_service';
import type { HardwareStatus } from '../models/HardwareStatus';
import type { EffectSettings } from '../models/EffectSettings';
import type { HardwareSettings } from '../models/HardwareSettings';
import type { GpioSettings } from '../models/GpioSettings';

import type { AdcSettings } from '../models/AdcSettings';
import { useUIStore } from './ui';
import { t } from '../i18n';
import { useLogStore } from './logs';

import type { KeyMapping } from '@shared/models/KeyMapping';

export const useHardwareStore = defineStore('hardware', {
    state: () => ({
        isConnected: false,
        isConnecting: false,
        status: null as HardwareStatus | null,
        effects: null as EffectSettings | null,
        hardware: null as HardwareSettings | null,
        gpio: null as GpioSettings | null,
        adc: null as AdcSettings | null,
        lastError: null as string | null,
        reconnectTimer: null as ReturnType<typeof setInterval> | null,
        hasUnsavedChanges: false,
        rebootRequired: false,
    }),

    actions: {
        log(level: 'info' | 'warn' | 'error' | 'debug', msg: string) {
            useLogStore().addLog(level, msg, 'backend'); // Marking as backend related logic
        },

        async init() {
            this.log('info', 'HardwareStore initializing...');
            await this.connect();
            this.startAutoReconnect();
        },

        async connect() {
            if (this.isConnecting || this.isConnected) {
                return;
            }

            this.log('debug', 'Attempting to connect to hardware...');
            this.isConnecting = true;

            try {
                this.log('debug', 'Calling getHandshake...');
                const data = await HardwareService.getHandshake();
                this.log('info', 'Handshake successful');

                this.status = data.status;
                this.effects = data.fx;
                this.hardware = data.hw;
                this.gpio = data.gpio;
                this.adc = data.adc;
                this.isConnected = true;
                this.lastError = null;

                this.log('info', 'Connection established, starting polling');
                this.startPolling();
            } catch (err) {
                const msg = String(err);
                if (msg !== this.lastError) { // Avoid spamming same error
                    this.log('error', `Handshake failed: ${msg}`);
                }
                this.isConnected = false;
                this.lastError = msg;
            } finally {
                this.isConnecting = false;
            }
        },

        startAutoReconnect() {
            if (this.reconnectTimer) return;
            this.reconnectTimer = setInterval(async () => {
                if (!this.isConnected && !this.isConnecting) {
                    await this.connect();
                }
            }, 2000);
        },

        async startPolling() {
            if (!this.isConnected) return;

            // Poll at maximum speed using requestAnimationFrame (~120Hz backend updates)
            const poll = async () => {
                if (!this.isConnected) return;
                try {
                    this.status = await HardwareService.pollStatus();
                    requestAnimationFrame(poll);
                } catch (err) {
                    console.error('Polling error:', err);
                    this.isConnected = false;
                    this.lastError = 'Connection lost';
                }
            };

            requestAnimationFrame(poll);
        },

        async updateFX(newFx: Partial<EffectSettings>) {
            if (!this.effects) return;
            this.effects = { ...this.effects, ...newFx };
            await HardwareService.updateEffectSettings(this.effects);
            this.hasUnsavedChanges = true;
        },

        async updateHW(newHw: Partial<HardwareSettings>) {
            if (!this.hardware) return;

            // Check for reboot required fields
            if (newHw.force_enabled !== undefined && newHw.force_enabled !== this.hardware.force_enabled) {
                this.rebootRequired = true;
            }

            this.hardware = { ...this.hardware, ...newHw };
            await HardwareService.updateHardwareSettings(this.hardware);
            this.hasUnsavedChanges = true;
        },

        async reboot() {
            this.log('info', 'Reboot command called');
            const ui = useUIStore();

            if (!this.isConnected) {
                ui.showToast(t('toasts.device_not_connected'), 'error');
                this.log('warn', 'Cannot reboot: device not connected');
                return;
            }
            try {
                this.log('debug', 'Calling HardwareService.reboot()...');
                await HardwareService.reboot();
                this.log('info', 'Reboot command sent successfully');
                this.rebootRequired = false;
                ui.showToast(t('toasts.device_rebooting'), 'success');
            } catch (err) {
                this.log('error', `reboot() error: ${err}`);
                ui.showToast(`${t('toasts.reboot_failed')}: ${err}`, 'error');
                throw err;
            }
        },

        async resetCenter() {
            this.log('info', 'Reset Center command called');
            const ui = useUIStore();

            if (!this.isConnected) {
                ui.showToast(t('toasts.device_not_connected'), 'error');
                this.log('warn', 'Cannot reset center: device not connected');
                return;
            }
            try {
                this.log('debug', 'Calling HardwareService.resetCenter()...');
                await HardwareService.resetCenter();
                this.log('info', 'Center reset successfully');
                ui.showToast(t('toasts.center_reset'), 'success');
            } catch (err) {
                this.log('error', `resetCenter() error: ${err}`);
                ui.showToast(`${t('toasts.reset_failed')}: ${err}`, 'error');
                throw err;
            }
        },

        async saveToEeprom() {
            this.log('info', 'Save Settings command called');
            const ui = useUIStore();

            if (!this.isConnected) {
                ui.showToast(t('toasts.device_not_connected'), 'error');
                this.log('warn', 'Cannot save: device not connected');
                return;
            }
            try {
                this.log('debug', 'Calling HardwareService.saveToEeprom()...');
                await HardwareService.saveToEeprom();
                this.log('info', 'Settings saved to EEPROM successfully');
                this.hasUnsavedChanges = false;
                ui.showToast(t('toasts.settings_saved'), 'success');
            } catch (err) {
                this.log('error', `saveToEeprom() error: ${err}`);
                ui.showToast(`${t('toasts.save_failed')}: ${err}`, 'error');
                throw err;
            }
        },

        async sendFFBTest(type: number, value: number) {
            await HardwareService.sendDirectControl(type, value);
        },

        async enterDfu() {
            await HardwareService.switchToDfu();
        },

        async activateLicense(key: string) {
            await HardwareService.activateLicense(key);
        },

        async updateGPIO(newGpio: Partial<GpioSettings>) {
            if (!this.gpio) return;
            this.gpio = { ...this.gpio, ...newGpio };
            await HardwareService.updateGpioSettings(this.gpio);
            this.hasUnsavedChanges = true;
            this.rebootRequired = true;
        },

        async updateADC(newAdc: Partial<AdcSettings>) {
            if (!this.adc) return;
            this.adc = { ...this.adc, ...newAdc };
            await HardwareService.updateAdcSettings(this.adc);
            this.hasUnsavedChanges = true;
        },

        async updateKeyboardMapping(mappings: KeyMapping[]) {
            await HardwareService.setKeyboardMapping(mappings);
        }
    }
});
