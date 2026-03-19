import { IPC, IPC_LISTEN } from "@/ipc-channels";
import type { ElectronBridge } from "@/types/electron.d.ts";

/**
 * useElectron — centralized, typed access to the Electron IPC bridge.
 *
 * Returns `null` when running outside of Electron (e.g. plain browser),
 * so all callers handle the absence gracefully without spreading `if (window.electron)` everywhere.
 */
export function useElectron(): ElectronBridge | null {
  return window.electron ?? null;
}

// Re-export channel constants for convenient co-import
export { IPC, IPC_LISTEN };
