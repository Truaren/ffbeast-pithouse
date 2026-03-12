import type { Theme } from "@/theme";

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
  sidebarConfig?: { id: string; visible: boolean; order: number }[];
  isPro: boolean;
}
