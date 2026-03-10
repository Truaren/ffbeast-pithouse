import { create } from "zustand";

interface ReleaseInfo {
  version: string;
  notes: string;
  url: string;
}

interface UpdateStore {
  checkForUpdate: (showToastIfLatest?: boolean) => Promise<void>;
  updateAvailable: ReleaseInfo | null;
  setUpdateAvailable: (info: ReleaseInfo | null) => void;
  isChecking: boolean;
  hasCheckedOnStartup: boolean;
  latestVersion: string | null;
  setHasCheckedOnStartup: (checked: boolean) => void;
}

const compareVersions = (v1: string, v2: string) => {
  const p1 = v1.replace(/^v/, "").split(".").map(Number);
  const p2 = v2.replace(/^v/, "").split(".").map(Number);

  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
};

interface GithubRelease {
  tag_name: string;
  body: string;
  html_url: string;
}

declare const __APP_VERSION__: string;

export const useUpdateStore = create<UpdateStore>((set, get) => ({
  updateAvailable: null,
  isChecking: false,
  hasCheckedOnStartup: false,
  latestVersion: null,
  setHasCheckedOnStartup: (checked) => set({ hasCheckedOnStartup: checked }),
  setUpdateAvailable: (info) => set({ updateAvailable: info }),
  checkForUpdate: async (showToastIfLatest = false) => {
    if (get().isChecking) return;
    set({ isChecking: true });

    try {
      const response = await fetch(
        "https://api.github.com/repos/Truaren/ffbeast-pithouse/releases/latest",
      );
      if (!response.ok) throw new Error("Failed to fetch release info");

      const data = (await response.json()) as GithubRelease;
      const fetchedLatestVersion = data.tag_name;
      const currentVersion = __APP_VERSION__;

      set({ latestVersion: fetchedLatestVersion });

      if (compareVersions(fetchedLatestVersion, currentVersion) > 0) {
        set({
          updateAvailable: {
            version: fetchedLatestVersion,
            notes: data.body,
            url: data.html_url,
          },
        });
      } else if (showToastIfLatest) {
        const { toast } = await import("sonner");
        toast.success("You are on the latest version.");
      }
    } catch (e: unknown) {
      if (showToastIfLatest) {
        const { toast } = await import("sonner");
        toast.error("Failed to check for updates: " + (e as Error).message);
      }
    } finally {
      set({ isChecking: false });
    }
  },
}));
