import type {
  DeviceSettings,
  WheelApi,
} from "@shubham0x13/ffbeast-wheel-webhid-api";

import { DEVICE_SETTINGS_MAP } from "@/utils/device-settings-map";

import { useAppPreferencesStore } from "./use-app-preferences-store";
import { useDeviceSettingsStore } from "./use-device-settings-store";
import { useProfileStore } from "./use-profile-store";
import { useWheelStore } from "./use-wheel-store";

export function initStoreCoordinator() {
  console.log("Initializing Store Coordinator...");

  const unsubscribers: (() => void)[] = [];

  // -------------------------------------------------------------
  // Device Connection → Always pull from device
  // -------------------------------------------------------------
  unsubscribers.push(
    useWheelStore.subscribe(
      (state) => state.isConnected,
      async (isConnected, prevIsConnected) => {
        if (!isConnected || prevIsConnected) return;

        console.log("Device Connected.  Loading settings...");

        const { api } = useWheelStore.getState();
        const { setSettings } = useDeviceSettingsStore.getState();
        const { activeProfile, clearActiveProfile } =
          useProfileStore.getState();

        try {
          // Always load from device
          const settings = await api.readAllSettings();
          const deviceSettings: DeviceSettings = {
            effects: settings.effects,
            hardware: settings.hardware,
            adc: settings.adc,
            gpio: settings.gpio,
          };
          setSettings(deviceSettings);

          if (activeProfile) {
            const isMatch =
              JSON.stringify(activeProfile.deviceSettings) ===
              JSON.stringify(deviceSettings);
            if (isMatch) {
              console.log(
                `Device settings match '${activeProfile.name}'. Keeping profile active.`,
              );
            } else {
              console.log(
                `Device settings differ from '${activeProfile.name}'. Clearing selection.`,
              );
              clearActiveProfile();
            }
          }

          console.log("Device settings loaded.");
        } catch (error) {
          console.error("Failed to load device settings:", error);
        }
      },
    ),
  );

  // -------------------------------------------------------------
  // Profile Selected → Apply to app & device
  // -------------------------------------------------------------
  unsubscribers.push(
    useProfileStore.subscribe(
      (state) => state.activeProfile,
      async (activeProfile) => {
        // Only react to actual profile selection (not clearing)
        if (!activeProfile) return;
        // if (!activeProfile || activeProfile.id === prevProfile?.id) return;

        console.log(`Applying profile '${activeProfile.name}'...`);

        const { api, isConnected } = useWheelStore.getState();
        const { setSettings } = useDeviceSettingsStore.getState();
        const { replacePreferences } = useAppPreferencesStore.getState();
        const { withProfileApplication } = useProfileStore.getState();

        await withProfileApplication(async () => {
          // Merge app state: Keep global settings from current preferences,
          // only apply profile-specific settings (like pedal bindings, inversions) from the active profile.
          const currentPrefs = useAppPreferencesStore.getState().preferences;
          const profilePrefs = activeProfile.appPreferences;

          replacePreferences({
            ...currentPrefs, // keep current global UI settings, auto-profiles, theme, etc
            pedalBindings: profilePrefs.pedalBindings,
            hiddenPedals: profilePrefs.hiddenPedals,
            invertedPedals: profilePrefs.invertedPedals,
          });

          setSettings(activeProfile.deviceSettings);

          // Push to device if connected
          if (isConnected) {
            try {
              await applySettingsToDevice(api, activeProfile.deviceSettings);
              console.log("Profile applied to device.");
            } catch (error) {
              console.error("Failed to apply profile to device:", error);
            }
          }
        });
      },
    ),
  );

  // -------------------------------------------------------------
  // Any App Preference Changed → Mark Profile Dirty
  // (Skips the initial rehydration burst)
  // -------------------------------------------------------------
  let isReady = false;
  setTimeout(() => {
    isReady = true;
  }, 500);

  unsubscribers.push(
    useAppPreferencesStore.subscribe(
      (state) => state.preferences,
      (newPrefs, oldPrefs) => {
        if (!isReady) return; // Ignore initial rehydration
        if (JSON.stringify(newPrefs) !== JSON.stringify(oldPrefs)) {
          console.log(`App preferences changed. Marking profile dirty.`);
          useProfileStore.getState().markDirty();
        }
      },
    ),
  );

  return () => {
    console.log("Cleaning up Store Coordinator...");
    unsubscribers.forEach((unsub) => {
      unsub();
    });
  };
}

async function applySettingsToDevice(api: WheelApi, settings: DeviceSettings) {
  for (const [fieldKey, mapping] of Object.entries(DEVICE_SETTINGS_MAP)) {
    const field = Number(fieldKey);
    const section = settings[mapping.scope] as unknown as Record<
      string,
      number | number[]
    >;
    const value = section[mapping.key];

    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        await api.sendSetting(field, i, value[i]);
      }
    } else {
      await api.sendSetting(field, 0, value);
    }
  }
}
