import { ref, onMounted, onUnmounted } from 'vue';
import { listen, type UnlistenFn, type Event } from '@tauri-apps/api/event';
import type { HardwareStatus } from '../models/HardwareStatus';

export function useHardwareStream() {
    const status = ref<HardwareStatus | null>(null);
    let unlisten: UnlistenFn | null = null;

    onMounted(async () => {
        unlisten = await listen<HardwareStatus>('wheel-status', (event: Event<HardwareStatus>) => {
            status.value = event.payload;
        });
    });

    onUnmounted(() => {
        if (unlisten) {
            unlisten();
        }
    });

    return {
        status
    };
}
