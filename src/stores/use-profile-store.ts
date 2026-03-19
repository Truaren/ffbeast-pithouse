import type { DeviceSettings } from "@shubham0x13/ffbeast-wheel-webhid-api";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";

import { MAX_PROFILE_SLOTS, PROFILE_EXPORT_VERSION } from "@/config";
import type { AppPreferences, Profile } from "@/types";

import { indexedDBStorage } from "./storage";

export interface ProfileExport {
  version: number;
  exportedAt: string;
  profiles: Omit<Profile, "id">[];
}

interface ProfileStoreState {
  profiles: Profile[];
  activeProfile: Profile | null;
  isApplying: boolean;
  isDirty: boolean;
}

interface ProfileStoreActions {
  withProfileApplication<T>(fn: () => T | Promise<T>): Promise<T>;
  createProfile(
    name: string,
    settings: DeviceSettings,
    preferences: AppPreferences,
    activate?: boolean,
  ): void;
  updateActiveProfile(
    settings: DeviceSettings,
    preferences: AppPreferences,
  ): void;
  setActiveProfile(id: string): void;
  clearActiveProfile(): void;
  renameProfile(id: string, newName: string): void;
  setDefaultProfile(id: string): void;
  deleteProfile(id: string): void;
  markDirty(): void;
  markClean(): void;
  exportProfiles(id?: string): void;
  importProfiles(activate?: boolean): Promise<void>;
}

type ProfileStore = ProfileStoreState & ProfileStoreActions;

export const useProfileStore = create<ProfileStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        profiles: [],
        activeProfile: null,
        isApplying: false,
        isDirty: false,

        withProfileApplication: async (fn) => {
          set({ isApplying: true });
          try {
            return await fn();
          } finally {
            set({ isApplying: false });
          }
        },

        createProfile: (name, settings, preferences, activate = false) => {
          const { profiles } = get();
          if (profiles.length >= MAX_PROFILE_SLOTS)
            throw new Error(
              `Cannot create more than ${MAX_PROFILE_SLOTS} profiles.`,
            );

          if (!name.trim()) throw new Error("Profile name cannot be empty.");

          const newProfile: Profile = {
            id: crypto.randomUUID(),
            name,
            deviceSettings: structuredClone(settings),
            appPreferences: structuredClone(preferences),
          };

          set((state) => ({
            profiles: [...state.profiles, newProfile],
            activeProfile: activate ? newProfile : state.activeProfile,
            isDirty: activate ? false : state.isDirty,
          }));
        },

        setActiveProfile: (id) => {
          set((state) => {
            const profile = state.profiles.find((p) => p.id === id) ?? null;
            if (!profile) throw new Error(`Profile with id '${id}' not found.`);

            return {
              activeProfile: state.isDirty ? structuredClone(profile) : profile,
              isDirty: false,
            };
          });
        },

        updateActiveProfile: (settings, preferences) => {
          const { activeProfile, profiles } = get();

          if (!activeProfile) throw new Error("No active profile to update.");

          const updated = {
            ...activeProfile,
            deviceSettings: structuredClone(settings),
            appPreferences: structuredClone(preferences),
          };

          set({
            profiles: profiles.map((p) =>
              p.id === activeProfile.id ? updated : p,
            ),
            activeProfile: updated,
            isDirty: false,
          });
        },

        clearActiveProfile: () => {
          set({ activeProfile: null });
        },

        renameProfile: (id, newName) => {
          if (!newName.trim()) throw new Error("Profile name cannot be empty.");

          set((state) => {
            const exists = state.profiles.some((p) => p.id === id);
            if (!exists) throw new Error(`Profile with id '${id}' not found.`);

            return {
              profiles: state.profiles.map((p) =>
                p.id === id ? { ...p, name: newName.trim() } : p,
              ),
              activeProfile:
                state.activeProfile?.id === id
                  ? { ...state.activeProfile, name: newName.trim() }
                  : state.activeProfile,
            };
          });
        },

        setDefaultProfile: (id) => {
          set((state) => ({
            profiles: state.profiles.map((p) =>
              p.id === id
                ? { ...p, isDefault: true }
                : { ...p, isDefault: false },
            ),
          }));
        },

        deleteProfile: (id) => {
          const { profiles, activeProfile, isDirty } = get();
          const remaining = profiles.filter((p) => p.id !== id);
          const deletingActive = activeProfile?.id === id;
          const nextActive = deletingActive
            ? (remaining[0] ?? null)
            : activeProfile;

          set({
            profiles: remaining,
            activeProfile: nextActive,
            isDirty: deletingActive ? false : isDirty,
          });
          return nextActive;
        },

        markDirty: () => {
          const { isDirty, activeProfile, isApplying } = get();
          if (isApplying) return;
          if (!isDirty && activeProfile) set({ isDirty: true });
        },

        markClean: () => {
          if (get().isDirty) set({ isDirty: false });
        },

        exportProfiles: (id) => {
          const { profiles } = get();

          if (profiles.length === 0)
            throw new Error("No profiles available to export.");

          const data = id ? profiles.filter((p) => p.id === id) : profiles;
          if (data.length === 0)
            throw new Error(`Profile with id '${id}' not found for export.`);

          // Remove IDs from export (will be regenerated on import)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const profilesWithoutIds = data.map(({ id: _, ...rest }) => rest);

          const exportData: ProfileExport = {
            version: PROFILE_EXPORT_VERSION,
            exportedAt: new Date().toISOString(),
            profiles: profilesWithoutIds,
          };

          downloadProfiles(exportData);
        },

        importProfiles: async (activate = false) => {
          const jsonContent = await uploadProfileFile();

          let parsed: ProfileExport;
          try {
            parsed = JSON.parse(jsonContent) as ProfileExport;
          } catch {
            throw new Error("Import failed: Invalid JSON format.");
          }

          if (!parsed.profiles || !Array.isArray(parsed.profiles)) {
            throw new Error("Import failed: No profiles found in the file.");
          }

          const newProfiles: Profile[] = parsed.profiles.map((p) => ({
            ...p,
            id: crypto.randomUUID(),
          }));

          set((state) => ({
            profiles: [...state.profiles, ...newProfiles],
            activeProfile: activate ? newProfiles[0] : state.activeProfile,
          }));
        },
      }),
      {
        name: "user-profiles-storage",
        storage: createJSONStorage(() => indexedDBStorage),
        partialize: (state) => ({
          profiles: state.profiles,
          // activeProfile: state.activeProfile,
        }),
        onRehydrateStorage: () => (state) => {
          if (!state) return;
          console.log("Rehydrating Profile Store...");
        },
      },
    ),
  ),
);

// --- Disk Persistence Sync ---

if (typeof window !== "undefined" && window.electron) {
  const electron = window.electron;

  // Load from disk on startup
  void electron.invoke("load-profiles").then((res) => {
    const diskProfiles = res as Profile[] | null;
    if (diskProfiles && Array.isArray(diskProfiles)) {
      console.log("Profiles loaded from disk, syncing store...");
      useProfileStore.setState({ profiles: diskProfiles });
    }
  });

  // Subscribe to changes and save to disk
  useProfileStore.subscribe(
    (state) => state.profiles,
    (profiles) => {
      electron.invoke("save-profiles", profiles).catch((err: unknown) => {
        console.error("Failed to sync profiles to disk:", err);
      });
    },
  );
}

export const downloadProfiles = (data: ProfileExport, filename?: string) => {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      filename ??
      `profiles-${
        data.profiles.length === 1 ? data.profiles[0].name : "backup"
      }-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error("Failed to download profiles: " + (error as Error).message);
  }
};

export const uploadProfileFile = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error("No file selected"));
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (!content) {
          reject(new Error("File is empty"));
        } else {
          resolve(content);
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file from disk"));
      };

      reader.readAsText(file);
    };

    input.click();
  });
};
