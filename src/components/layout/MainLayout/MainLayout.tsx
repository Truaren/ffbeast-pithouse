import "./style.scss";

import { Button } from "@components/ui";
import { useEffect, useRef } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { toast } from "sonner";

import { ROUTES } from "@/routes";
import { useDeviceSettingsStore } from "@/stores";

export const MainLayout = () => {
  const resetSection = useDeviceSettingsStore((state) => state.resetSection);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const activeRoute =
    Object.values(ROUTES).find((r) => r.path === location.pathname) ??
    ROUTES.effects;

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  const handleResetToDefaults = () => {
    switch (activeRoute) {
      case ROUTES.effects:
        resetSection("effects");
        break;
      case ROUTES.base:
        resetSection("hardware");
        break;
    }

    toast.info(`${activeRoute.title} settings have been reset to default.`);
  };

  if (activeRoute?.fullWidth) {
    const FullWidthComponent = activeRoute.component;
    return (
      <div className="main_screen full-width">
        <FullWidthComponent />
      </div>
    );
  }

  return (
    <div className="main_screen">
      <div className="settings_panel">
        <div className="title">
          <h1>{activeRoute.title}</h1>
          <div className="buttons">
            {activeRoute !== ROUTES.license && (
              <Button
                variant="secondary"
                icon={"icon fi fi-rr-refresh"}
                style={{
                  margin: 0,
                }}
                onClick={() => handleResetToDefaults()}
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        <div className="scroller" ref={scrollerRef}>
          <Routes>
            {Object.values(ROUTES).map(({ path, component: Component }) =>
              path === ROUTES.settings.path ? null : (
                <Route key={path} path={path} element={<Component />} />
              ),
            )}
          </Routes>
        </div>
      </div>
    </div>
  );
};
