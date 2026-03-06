import "./style.scss";

import { NavLink } from "react-router-dom";

import { ROUTES } from "@/routes";
import { useAppPreferencesStore } from "@/stores";

export const Sidebar = () => {
  const { preferences } = useAppPreferencesStore();
  const config = preferences.sidebarConfig ?? [];
  return (
    <div className="sidebar">
      <div className="bottom">
        <div className="buttons">
          {/* Filter and sort routes based on sidebarConfig */}
          {Object.entries(ROUTES)
            .filter(([key, route]) => {
              if (route === ROUTES.settings) return false;
              if (config.length === 0) return true; // Default show all if no config
              const cfgItem = config.find(c => c.id === key);
              return cfgItem ? cfgItem.visible : true;
            })
            .sort(([keyA], [keyB]) => {
              if (config.length === 0) return 0;
              const aOrder = config.find(c => c.id === keyA)?.order ?? 999;
              const bOrder = config.find(c => c.id === keyB)?.order ?? 999;
              return aOrder - bOrder;
            })
            .map(([, route]) => (
              <NavLink
                key={route.path}
                to={route.path}
                className={({ isActive }) =>
                  `navlink sidebar_button ${isActive ? "active" : ""}`
                }
              >
                <i className={route.icon} />
              </NavLink>
            ))}

          <NavLink
            to={ROUTES.settings.path}
            className={({ isActive }) =>
              `settings_button ${isActive ? "active" : ""}`
            }
          >
            <i className={ROUTES.settings.icon} />
          </NavLink>
        </div>
      </div>
    </div>
  );
};
