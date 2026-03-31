/**
 * Pedals Store
 * Manages per-pedal state (deadzone, reverse, curve) and active plugin config.
 * Uses zustand with localStorage persistence.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CurveType = "linear" | "scurve_a" | "scurve_b" | "log" | "custom";
export type PedalName = "throttle" | "brake" | "clutch";

export interface PedalState {
  minDZ: number; // 0–50%
  maxDZ: number; // 0–50%
  reverse: boolean;
  curveType: CurveType;
}

const DEFAULT_PEDAL: PedalState = {
  minDZ: 0,
  maxDZ: 0,
  reverse: false,
  curveType: "linear",
};

interface PedalsStore {
  activePlugin: string;
  throttle: PedalState;
  brake: PedalState;
  clutch: PedalState;
  availablePlugins: string[];

  setActivePlugin: (name: string) => void;
  setAvailablePlugins: (names: string[]) => void;
  setPedalState: (pedal: PedalName, patch: Partial<PedalState>) => void;
  resetPedal: (pedal: PedalName) => void;
}

export const usePedalsStore = create<PedalsStore>()(
  persist(
    (set) => ({
      activePlugin: "pedals",
      throttle: { ...DEFAULT_PEDAL },
      brake: { ...DEFAULT_PEDAL },
      clutch: { ...DEFAULT_PEDAL },
      availablePlugins: ["pedals"],

      setActivePlugin: (name) => set({ activePlugin: name }),
      setAvailablePlugins: (names) => set({ availablePlugins: names }),

      setPedalState: (pedal, patch) =>
        set((state) => ({
          [pedal]: { ...state[pedal], ...patch },
        })),

      resetPedal: (pedal) => set({ [pedal]: { ...DEFAULT_PEDAL } }),
    }),
    {
      name: "pedals-store",
    },
  ),
);
