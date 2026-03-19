import type { IpcChannel, IpcListenChannel } from "@/ipc-channels";

/**
 * Typed contract for the Electron bridge exposed via contextBridge in preload.cjs.
 * All methods are strictly typed — no `any` allowed in usage.
 */
export interface ElectronBridge {
  /** Invoke a two-way IPC call and await the result. */
  invoke: (channel: IpcChannel, ...args: unknown[]) => Promise<unknown>;

  /**
   * Subscribe to a one-way event pushed from the main process.
   * Returns an unsubscribe function — always call it in cleanup.
   */
  on: (
    channel: IpcListenChannel,
    listener: (...args: unknown[]) => void,
  ) => (() => void) | undefined;
}

declare global {
  interface Window {
    electron?: ElectronBridge;
  }
}
