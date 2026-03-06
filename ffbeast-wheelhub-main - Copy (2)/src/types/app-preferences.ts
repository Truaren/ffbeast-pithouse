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
  pedalBindings: {
    Throttle: number;
    Brake: number;
    Clutch: number;
  };
}
