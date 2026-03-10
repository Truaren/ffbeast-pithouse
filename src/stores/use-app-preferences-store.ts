import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";

import {
  AUTO_IMAGE_CROP_ALPHA_THRESHOLD,
  DEFAULT_APP_PREFERENCES,
} from "@/config";
import { type Theme } from "@/theme";
import type { AppPreferences } from "@/types";
import { cropTransparentAny } from "@/utils/crop";

import { indexedDBStorage } from "./storage";

interface AppPreferencesState {
  preferences: AppPreferences;
}

interface AppPreferencesActions {
  setTheme: (theme: Theme) => void;
  setWheelImage: (file: File) => Promise<void>;
  resetWheelImage: () => void;
  setWheelName: (name: string) => void;
  setBaseName: (name: string) => void;
  setBaseImage: (file: File) => Promise<void>;
  setPedalDeviceId: (id: string) => void;
  setPedalName: (name: string) => void;
  setPedalImage: (file: File) => Promise<void>;
  togglePedalVisibility: (pedal: "Throttle" | "Brake" | "Clutch") => void;
  togglePedalInversion: (pedal: "Throttle" | "Brake" | "Clutch") => void;
  setPedalBinding: (
    pedal: "Throttle" | "Brake" | "Clutch",
    axisIndex: number,
  ) => void;
  setAutoCheckUpdates: (val: boolean) => void;
  addAutoProfile: (exeName: string, profileId: string) => void;
  removeAutoProfile: (exeName: string) => void;
  setSidebarConfig: (
    config: { id: string; visible: boolean; order: number }[],
  ) => void;
  replacePreferences: (preferences: AppPreferences) => void;
}

type AppPreferencesStore = AppPreferencesState & AppPreferencesActions;

export const useAppPreferencesStore = create<AppPreferencesStore>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        preferences: DEFAULT_APP_PREFERENCES,

        setTheme: (theme) => {
          applyThemeToDOM(theme);
          set((state) => ({
            preferences: { ...state.preferences, theme },
          }));
        },

        setWheelImage: async (file) => {
          if (!file.type.startsWith("image/"))
            throw new Error("Provided file is not an image.");

          const canvas = await cropTransparentAny(
            file,
            AUTO_IMAGE_CROP_ALPHA_THRESHOLD,
          );
          if (!canvas) throw new Error("Failed to process the image.");

          set((state) => ({
            preferences: {
              ...state.preferences,
              wheelImageUrl: canvas.toDataURL("image/png"),
            },
          }));
        },

        resetWheelImage: () => {
          set((state) => ({
            preferences: {
              ...state.preferences,
              wheelImageUrl: DEFAULT_APP_PREFERENCES.wheelImageUrl,
            },
          }));
        },

        setWheelName: (name) => {
          set((state) => ({
            preferences: {
              ...state.preferences,
              wheelName: name,
            },
          }));
        },

        setBaseName: (name) => {
          set((state) => ({
            preferences: {
              ...state.preferences,
              baseName: name,
            },
          }));
        },

        setBaseImage: async (file) => {
          if (!file.type.startsWith("image/"))
            throw new Error("Provided file is not an image.");

          const canvas = await cropTransparentAny(
            file,
            AUTO_IMAGE_CROP_ALPHA_THRESHOLD,
          );
          if (!canvas) throw new Error("Failed to process the image.");

          set((state) => ({
            preferences: {
              ...state.preferences,
              baseImageUrl: canvas.toDataURL("image/png"),
            },
          }));
        },

        setPedalDeviceId: (id) => {
          set((state) => ({
            preferences: {
              ...state.preferences,
              pedalDeviceId: id,
            },
          }));
        },

        setPedalName: (name) => {
          set((state) => ({
            preferences: {
              ...state.preferences,
              pedalName: name,
            },
          }));
        },

        setPedalImage: async (file) => {
          if (!file.type.startsWith("image/"))
            throw new Error("Provided file is not an image.");

          const canvas = await cropTransparentAny(
            file,
            AUTO_IMAGE_CROP_ALPHA_THRESHOLD,
          );
          if (!canvas) throw new Error("Failed to process the image.");

          set((state) => ({
            preferences: {
              ...state.preferences,
              pedalImageUrl: canvas.toDataURL("image/png"),
            },
          }));
        },

        togglePedalVisibility: (pedal) => {
          set((state) => {
            const hidden = state.preferences.hiddenPedals || [];
            const newHidden = hidden.includes(pedal)
              ? hidden.filter((p) => p !== pedal)
              : [...hidden, pedal];
            return {
              preferences: {
                ...state.preferences,
                hiddenPedals: newHidden,
              },
            };
          });
        },

        togglePedalInversion: (pedal) => {
          set((state) => {
            const inverted = state.preferences.invertedPedals || [];
            const newInverted = inverted.includes(pedal)
              ? inverted.filter((p) => p !== pedal)
              : [...inverted, pedal];
            return {
              preferences: {
                ...state.preferences,
                invertedPedals: newInverted,
              },
            };
          });
        },

        setPedalBinding: (pedal, axisIndex) => {
          set((state) => ({
            preferences: {
              ...state.preferences,
              pedalBindings: {
                ...(state.preferences.pedalBindings || {}),
                [pedal]: axisIndex,
              },
            },
          }));
        },

        setAutoCheckUpdates: (val) => {
          set((state) => ({
            preferences: {
              ...state.preferences,
              autoCheckUpdates: val,
            },
          }));
        },

        addAutoProfile: (exeName, profileId) => {
          set((state) => {
            const profiles = state.preferences.autoProfiles || [];
            // Remove existing mapping for this exe if it exists, then add the new one
            const filtered = profiles.filter(
              (p) => p.exeName.toLowerCase() !== exeName.toLowerCase(),
            );
            return {
              preferences: {
                ...state.preferences,
                autoProfiles: [...filtered, { exeName, profileId }],
              },
            };
          });
        },

        removeAutoProfile: (exeName) => {
          set((state) => {
            const profiles = state.preferences.autoProfiles || [];
            return {
              preferences: {
                ...state.preferences,
                autoProfiles: profiles.filter(
                  (p) => p.exeName.toLowerCase() !== exeName.toLowerCase(),
                ),
              },
            };
          });
        },

        setSidebarConfig: (config) => {
          set((state) => ({
            preferences: {
              ...state.preferences,
              sidebarConfig: config,
            },
          }));
        },

        replacePreferences: (preferences) => {
          applyThemeToDOM(preferences.theme);
          set({ preferences: preferences });
        },
      }),
      {
        name: "app-preferences-storage",
        storage: createJSONStorage(() => indexedDBStorage),
        onRehydrateStorage: () => (state) => {
          if (!state) return;
          console.log("Rehydrating App Preferences Store...");
          applyThemeToDOM(state.preferences.theme);
        },
      },
    ),
  ),
);

// --- Disk Persistence Sync ---

interface ElectronWindow extends Window {
  require: (module: "electron") => {
    ipcRenderer: {
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
    };
  };
}

const winPrefs = window as unknown as ElectronWindow;
if (typeof window !== "undefined" && winPrefs.require) {
  const { ipcRenderer } = winPrefs.require("electron");

  // Load from disk on startup
  void ipcRenderer.invoke("load-preferences").then((res) => {
    const diskPrefs = res as AppPreferences | null;
    if (diskPrefs) {
      console.log("App preferences loaded from disk, syncing store...");
      useAppPreferencesStore.getState().replacePreferences(diskPrefs);
    }
  });

  // Subscribe to changes and save to disk
  useAppPreferencesStore.subscribe(
    (state) => state.preferences,
    (prefs) => {
      ipcRenderer.invoke("save-preferences", prefs).catch((err: Error) => {
        console.error("Failed to sync preferences to disk:", err);
      });
    },
  );
}

const applyThemeToDOM = (theme: Theme) => {
  if (document.documentElement.getAttribute("data-theme") !== theme)
    document.documentElement.setAttribute("data-theme", theme);
};
