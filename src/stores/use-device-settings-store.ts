import {
  type DeviceSettings,
  SettingField,
} from "@shubham0x13/ffbeast-wheel-webhid-api";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import { DEFAULT_DEVICE_SETTINGS } from "@/config";
import { DEVICE_SETTINGS_MAP } from "@/utils/device-settings-map";

interface DeviceSettingsState {
  settings: DeviceSettings;
}

interface DeviceSettingsActions {
  setSettings: (settings: DeviceSettings) => void;
  updateSetting: (
    field: SettingField,
    value: number | boolean,
    index?: number,
  ) => void;
  resetSection: (section: keyof DeviceSettings) => void;
}

type DeviceSettingsStore = DeviceSettingsState & DeviceSettingsActions;

export const useDeviceSettingsStore = create<DeviceSettingsStore>()(
  subscribeWithSelector((set) => ({
    settings: DEFAULT_DEVICE_SETTINGS,

    setSettings: (settings) => set({ settings }),

    updateSetting: (field, value, index = 0) => {
      const mapping = DEVICE_SETTINGS_MAP[field];
      if (!mapping)
        throw new Error(
          `Configuration Error: No mapping found for field ID '${field}'.`,
        );

      const normalized = typeof value === "boolean" ? Number(value) : value;

      set((state) => {
        const section = state.settings[mapping.scope] as unknown as Record<
          string,
          number | number[]
        >;
        const current = section[mapping.key];

        return {
          settings: {
            ...state.settings,
            [mapping.scope]: {
              ...section,
              [mapping.key]: Array.isArray(current)
                ? current.map((v, i) => (i === index ? normalized : v))
                : normalized,
            },
          },
        };
      });
    },

    resetSection: (section) =>
      set((state) => ({
        settings: {
          ...state.settings,
          [section]: DEFAULT_DEVICE_SETTINGS[section],
        },
      })),
  })),
);
