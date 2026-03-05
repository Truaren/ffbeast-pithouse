import type { SettingField } from "@shubham0x13/ffbeast-wheel-webhid-api";
import { useCallback } from "react";

import { useProfileStore } from "@/stores";
import { useDeviceSettingsStore } from "@/stores/use-device-settings-store";
import { useWheelStore } from "@/stores/use-wheel-store";

export function useSetting() {
  const isConnected = useWheelStore((s) => s.isConnected);
  const api = useWheelStore((s) => s.api);
  const updateSetting = useDeviceSettingsStore((s) => s.updateSetting);
  const markDirty = useProfileStore((s) => s.markDirty);

  const setSetting = useCallback(
    async (field: SettingField, value: number, index = 0) => {
      // Update store
      updateSetting(field, value, index);

      // Mark profile as dirty
      markDirty();

      // Send to device
      if (isConnected) {
        try {
          await api.sendSetting(field, index, value);
        } catch (error) {
          console.error(`Failed to send setting ${field}:`, error);
          throw error;
        }
      }
    },
    [api, isConnected, updateSetting, markDirty],
  );

  return setSetting;
}
