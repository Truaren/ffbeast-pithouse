import type { SettingField } from "@shubham0x13/ffbeast-wheel-webhid-api";
import { toast } from "sonner";

import { useSetting } from "./use-setting";

export function useSettingUI() {
  const setSetting = useSetting();

  return async (field: SettingField, value: number, index?: number) => {
    try {
      await setSetting(field, value, index);
    } catch {
      toast.error("Failed to apply setting", {
        description: "Device communication error",
      });
    }
  };
}
