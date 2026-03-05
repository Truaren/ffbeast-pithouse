import type { DeviceSettings } from "@shubham0x13/ffbeast-wheel-webhid-api";

import type { AppPreferences } from "./";

export interface Profile {
  id: string;
  name: string;
  isDefault?: boolean;
  deviceSettings: DeviceSettings;
  appPreferences: AppPreferences;
}
