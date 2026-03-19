import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { createJSONStorage } from "zustand/middleware";

import { indexedDBStorage } from "./storage";

export type Pt = [number, number];
export type PedalName = "clutch" | "brake" | "throttle";
export type Preset = "linear" | "exp" | "log" | "s-curve" | "custom";

export interface PedalConfig {
  throtl_min: number;
  throtl_max: number;
  brake_min: number;
  brake_max: number;
  clutch_min: number;
  clutch_max: number;
}

export interface DeadzoneState {
  min: number;
  max: number;
}

export interface PluginConfig {
  curves: Record<PedalName, Pt[]>;
  presets: Record<PedalName, Preset>;
  reversed: Record<PedalName, boolean>;
  deadzones: Record<PedalName, DeadzoneState>;
  rawConfig: PedalConfig | null;
  labels: Record<PedalName, string>;
  hidden: Record<PedalName, boolean>;
}

export interface PedalsStoreState {
  activePluginId: string;
  defaultPluginId: string | null;
  configs: Record<string, PluginConfig>;
}

export interface PedalsStoreActions {
  setActivePluginId: (id: string) => void;
  setDefaultPluginId: (id: string | null) => void;
  updateConfig: (pluginId: string, patch: Partial<PluginConfig>) => void;
  getPluginConfig: (pluginId: string) => PluginConfig;
}

const DEFAULT_PTS: Pt[] = [
  [0, 1],
  [0.25, 0.75],
  [0.5, 0.5],
  [0.75, 0.25],
  [1, 0],
];

const DEFAULT_LABELS: Record<PedalName, string> = {
  clutch: "Clutch",
  brake: "Brake",
  throttle: "Throttle",
};

export const createDefaultConfig = (): PluginConfig => ({
  curves: {
    clutch: [...DEFAULT_PTS],
    brake: [...DEFAULT_PTS],
    throttle: [...DEFAULT_PTS],
  },
  presets: { clutch: "custom", brake: "custom", throttle: "custom" },
  reversed: { clutch: false, brake: false, throttle: false },
  deadzones: {
    clutch: { min: 0, max: 0 },
    brake: { min: 0, max: 0 },
    throttle: { min: 0, max: 0 },
  },
  rawConfig: null,
  labels: { ...DEFAULT_LABELS },
  hidden: { clutch: false, brake: false, throttle: false },
});

export const usePedalsStore = create<PedalsStoreState & PedalsStoreActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        activePluginId: "FEEL-VR Pedals Lite",
        defaultPluginId: null,
        configs: {},

        setActivePluginId: (id) => set({ activePluginId: id }),
        setDefaultPluginId: (id) => set({ defaultPluginId: id }),

        updateConfig: (pluginId, patch) => {
          set((state) => {
            const existing = state.configs[pluginId] || createDefaultConfig();
            return {
              configs: {
                ...state.configs,
                [pluginId]: { ...existing, ...patch },
              },
            };
          });
        },

        getPluginConfig: (pluginId) => {
          const state = get();
          return state.configs[pluginId] || createDefaultConfig();
        },
      }),
      {
        name: "pedals-store-v2",
        storage: createJSONStorage(() => indexedDBStorage),
        onRehydrateStorage: () => (state) => {
          if (!state) return;
          console.log("[PedalsStore] Rehydrated from IndexedDB.");
        },
      },
    ),
  ),
);
