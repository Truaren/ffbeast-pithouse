import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

import { useAppPreferencesStore, useProfileStore } from "@/stores";

export const AutoProfileWatcher = () => {
  const { preferences } = useAppPreferencesStore();
  const { profiles, activeProfile, setActiveProfile } = useProfileStore(
    useShallow((s) => ({
      profiles: s.profiles,
      activeProfile: s.activeProfile,
      setActiveProfile: s.setActiveProfile,
    })),
  );

  const lastAppliedExeRef = useRef<string | null>(null);

  useEffect(() => {
    // Only run in Electron environment
    const win = window as any;
    if (!win.require) return;
    const { ipcRenderer } = win.require("electron");

    const checkProcesses = async () => {
      const autoProfiles = preferences.autoProfiles || [];
      if (autoProfiles.length === 0) return;

      try {
        const runningProcesses: string[] = await ipcRenderer.invoke(
          "get-running-processes",
        );

        // Find the FIRST configured exe that is currently running
        const matchedMapping = autoProfiles.find((mapping) =>
          runningProcesses.includes(mapping.exeName.toLowerCase()),
        );

        if (matchedMapping) {
          // If we mapped this process and we aren't already actively enforcing it
          if (
            lastAppliedExeRef.current !== matchedMapping.exeName ||
            activeProfile?.id !== matchedMapping.profileId
          ) {
            const targetProfile = profiles.find(
              (p) => p.id === matchedMapping.profileId,
            );
            if (targetProfile) {
              console.log(
                `[AutoProfile] Detected ${matchedMapping.exeName}, switching to profile: ${targetProfile.name}`,
              );
              try {
                setActiveProfile(targetProfile.id);
                lastAppliedExeRef.current = matchedMapping.exeName;
              } catch (e) {
                console.error("[AutoProfile] Failed to apply profile:", e);
              }
            }
          }
        } else {
          // No configured apps are running. Reset the tracking ref so it can trigger again later.
          // Note: We intentionally DO NOT revert to a "default" profile automatically here
          // as that ruins the manual workflow if a user closes a game.
          lastAppliedExeRef.current = null;
        }
      } catch (err) {
        console.error("AutoProfile watcher error:", err);
      }
    };

    const interval = setInterval(() => void checkProcesses(), 5000);
    return () => clearInterval(interval);
  }, [preferences.autoProfiles, profiles, activeProfile, setActiveProfile]);

  return null; // Invisible logical component
};
