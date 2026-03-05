import "./style.scss";

import { NavLink } from "react-router-dom";

import { ROUTES } from "@/routes";

export const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="bottom">
        <div className="buttons">
          {Object.values(ROUTES)
            .filter((route) => route !== ROUTES.settings)
            .map((route) => (
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
        </div>

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
  );
};
