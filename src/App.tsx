import "./styles/global.scss";

import { MainLayout, Sidebar, Topbar } from "@components/layout";
import { AutoProfileWatcher, ScrollToTop } from "@components/utils";
import { ConnectionPage, UnsupportedBrowser } from "@pages";
import { WheelApi } from "@shubham0x13/ffbeast-wheel-webhid-api";
import { useEffect } from "react";
import { HashRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { toast } from "sonner";

import { UpdateModal } from "@/components/ui/UpdateModal/UpdateModal";
import {
  useAppPreferencesStore,
  useProfileStore,
  useWheelStore,
} from "@/stores";
import { useUpdateStore } from "@/stores/updateStore";

import { TitleBarProvider } from "./components/layout/TitleBarContext";

const App = () => {
  const { profiles, activeProfile, setActiveProfile } = useProfileStore();
  const { checkForUpdate, hasCheckedOnStartup, setHasCheckedOnStartup } =
    useUpdateStore();
  const { preferences } = useAppPreferencesStore();

  // Check for updates on startup
  useEffect(() => {
    if (!hasCheckedOnStartup) {
      if (preferences.autoCheckUpdates !== false) {
        void checkForUpdate();
      }
      setHasCheckedOnStartup(true);
    }
  }, [
    hasCheckedOnStartup,
    checkForUpdate,
    setHasCheckedOnStartup,
    preferences.autoCheckUpdates,
  ]);

  // Auto-load default profile on startup
  useEffect(() => {
    // Wait until profiles are loaded (from disk/storage) and no profile is active yet
    if (profiles.length > 0 && !activeProfile) {
      const defaultProfile = profiles.find((p) => p.isDefault) ?? profiles[0];
      if (defaultProfile) {
        try {
          setActiveProfile(defaultProfile.id);
        } catch {
          // Ignore failed auto-load
        }
      }
    }
  }, [profiles, activeProfile, setActiveProfile]);

  // Apply safe-mode class to body
  useEffect(() => {
    if (preferences.performance?.safeMode) {
      document.body.classList.add("safe-mode");
    } else {
      document.body.classList.remove("safe-mode");
    }
  }, [preferences.performance?.safeMode]);

  // Register center wheel shortcut
  useEffect(() => {
    const win = window as unknown as {
      require?: (module: string) => {
        ipcRenderer: {
          invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
        };
      };
    };
    if (win.require && preferences.centerWheelKey) {
      const { ipcRenderer } = win.require("electron");
      void ipcRenderer.invoke(
        "set-recenter-shortcut",
        preferences.centerWheelKey,
      );
    }
  }, [preferences.centerWheelKey]);

  // Listen for recenter-wheel event from Electron
  useEffect(() => {
    const win = window as unknown as {
      require?: (module: string) => {
        ipcRenderer: {
          on: (channel: string, listener: (...args: unknown[]) => void) => void;
          removeAllListeners: (channel: string) => void;
        };
      };
    };
    if (win.require) {
      const { ipcRenderer } = win.require("electron");
      const { api } = useWheelStore.getState();

      const handleRecenter = () => {
        console.log("[Shortcut] Recenter wheel triggered");
        if (api) {
          api
            .resetWheelCenter()
            .then(() => {
              toast.info("Wheel centered via shortcut");
            })
            .catch((err: Error) =>
              console.error("Failed to center wheel:", err),
            );
        }
      };

      ipcRenderer.on("recenter-wheel", handleRecenter);
      return () => {
        ipcRenderer.removeAllListeners("recenter-wheel");
      };
    }
  }, []);

  if (!WheelApi.isSupported()) {
    return <UnsupportedBrowser />;
  }

  return (
    <>
      <AutoProfileWatcher />
      <UpdateModal />
      <Toaster
        position="top-center"
        toastOptions={{
          classNames: {
            toast: "toast",
            icon: "toast_icon",
            title: "toast_title",
            description: "toast_description",
            actionButton: "toast_action_button",
            cancelButton: "toast_cancel_button",
            closeButton: "toast_close_button",
          },
        }}
      />

      <ConnectionPage />

      <HashRouter>
        <TitleBarProvider>
          <ScrollToTop />
          <div className="canvas">
            <Topbar />
            <div className="canvas_bottom">
              <Sidebar />
              <MainLayout />
            </div>
          </div>
        </TitleBarProvider>
      </HashRouter>
    </>
  );
};

export default App;
