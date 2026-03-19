import "./styles/global.scss";

import { MainLayout, Sidebar, Topbar } from "@components/layout";
import { AutoProfileWatcher, ScrollToTop } from "@components/utils";
import { ConnectionPage, UnsupportedBrowser } from "@pages";
import { WheelApi } from "@shubham0x13/ffbeast-wheel-webhid-api";
import { useEffect, useState } from "react";
import { HashRouter } from "react-router-dom";
import { toast, Toaster } from "sonner";

import { UpdateModal } from "@/components/ui/UpdateModal/UpdateModal";
import { useElectron } from "@/hooks/use-electron";
import { IPC, IPC_LISTEN } from "@/ipc-channels";
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
  const electron = useElectron();

  // Handle Safe Mode CSS class
  useEffect(() => {
    if (preferences.performance?.safeMode) {
      document.body.classList.add("safe-mode");
    } else {
      document.body.classList.remove("safe-mode");
    }
  }, [preferences.performance?.safeMode]);

  // Handle global recenter shortcut registration and invocation
  useEffect(() => {
    if (!electron) return;

    const handleRecenter = () => {
      const api = useWheelStore.getState().api;
      if (api) {
        api.resetWheelCenter().catch(console.error);
        toast.info("Wheel centered via shortcut.");
      }
    };

    const unsubscribe = electron.on(IPC_LISTEN.RECENTER_WHEEL, handleRecenter);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [electron]);

  useEffect(() => {
    if (!electron) return;
    electron
      .invoke(IPC.SET_RECENTER_SHORTCUT, preferences.centerWheelKey ?? null)
      .then((res) => {
        const result = res as { success: boolean; error?: string };
        if (!result.success && result.error) {
          console.error("Failed to register shortcut:", result.error);
        }
      })
      .catch(console.error);
  }, [electron, preferences.centerWheelKey]);

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

  const [isBypassed, setIsBypassed] = useState(false);

  const { isConnected } = useWheelStore();

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

      {!isConnected && !isBypassed && (
        <ConnectionPage onSkip={() => setIsBypassed(true)} />
      )}

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
