import type { Theme } from "@/theme";

export interface SidebarConfigItem {
  id: string;
  visible: boolean;
  order: number;
}

export interface AppPreferences {
  theme: Theme;
  wheelImageUrl: string;
  wheelName: string;
  baseName: string;
  baseImageUrl: string;
  pedalDeviceId: string;
  pedalName: string;
  pedalImageUrl: string;
  hiddenPedals: string[];
  invertedPedals: string[];
  pedalBindings: {
    Throttle: number;
    Brake: number;
    Clutch: number;
  };
  autoCheckUpdates: boolean;
  autoProfiles: { exeName: string; profileId: string }[];
  sidebarConfig?: SidebarConfigItem[];
  isPro: boolean;
  centerWheelKey?: string | null;
  performance?: {
    disableHardwareAcceleration: boolean;
    reduceInputPolling: boolean;
    safeMode: boolean;
    disableDebugLogging: boolean;
    forceAsyncFileOps: boolean;
    enableDeviceReconnect: boolean;
  };
}
