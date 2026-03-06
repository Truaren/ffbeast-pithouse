import { useEffect } from "react";
import { HashRouter } from "react-router-dom";
import { Toaster } from "sonner";

import { MainLayout, Sidebar, Topbar } from "@components/layout";
import { ScrollToTop } from "@components/utils";
import { ConnectionPage, UnsupportedBrowser } from "@pages";
import { WheelApi } from "@shubham0x13/ffbeast-wheel-webhid-api";

import { useProfileStore } from "@/stores";

import "./styles/global.scss";

const App = () => {
  const { profiles, activeProfile, setActiveProfile } = useProfileStore();

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

  if (!WheelApi.isSupported()) {
    return <UnsupportedBrowser />;
  }

  return (
    <>
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
        <ScrollToTop />
        <div className="canvas">
          <Topbar />
          <div className="canvas_bottom">
            <Sidebar />
            <MainLayout />
          </div>
        </div>
      </HashRouter>
    </>
  );
};

export default App;
