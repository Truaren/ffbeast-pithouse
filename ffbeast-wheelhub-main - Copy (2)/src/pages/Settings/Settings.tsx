import "./style.scss";

import { useEffect, useState } from "react";

import { Button, Divider, ToggleSwitch } from "@/components/ui";
import { DEFAULT_APP_PREFERENCES } from "@/config";
import { useAppPreferencesStore } from "@/stores";
import { THEMES } from "@/theme";

type TabType = "preferences" | "about" | "disclaimer";

interface Tab {
  id: TabType;
  label: string;
  icon?: string;
}

const tabs: Tab[] = [
  { id: "preferences", label: "Preferences" },
  { id: "about", label: "About" },
  { id: "disclaimer", label: "Disclaimer" },
];

export const Settings = () => {
  const { preferences, setTheme } = useAppPreferencesStore();

  const [activeTab, setActiveTab] = useState<TabType>("preferences");
  const [minimizeToTray, setMinimizeToTray] = useState(false);
  const [startWithSystem, setStartWithSystem] = useState(false);

  useEffect(() => {
    // Check if we are in Electron
    const win = window as any;
    if (win.require) {
      const { ipcRenderer } = win.require("electron");
      ipcRenderer.invoke("get-app-settings").then((settings: any) => {
        setMinimizeToTray(settings.minimizeToTray);
        setStartWithSystem(settings.startWithSystem);
      });
    }
  }, []);

  const handleTrayToggle = (val: boolean) => {
    setMinimizeToTray(val);
    const win = window as any;
    if (win.require) {
      win.require("electron").ipcRenderer.invoke("set-minimize-to-tray", val);
    }
  };

  const handleAutostartToggle = (val: boolean) => {
    setStartWithSystem(val);
    const win = window as any;
    if (win.require) {
      win.require("electron").ipcRenderer.invoke("set-start-with-system", val);
    }
  };

  const renderThemeContent = () => (
    <div className="settings-content">
      <h2>App preferences</h2>
      <p className="settings-description">
        Customize the behaviour, look and feel of the application.
      </p>

      <Divider />

      <div className="theme-section">
        <h3>Themes</h3>
        <div className="color-grid">
          {THEMES.map((theme) => (
            <div
              key={theme.id}
              className={`color-option ${
                preferences.theme === theme.id ? "active" : ""
              }`}
              onClick={() => {
                setTheme(theme.id);
              }}
            >
              <div
                className="color-preview"
                style={{ backgroundColor: theme.preview.accent }}
              />
              <span className="color-name">{theme.name}</span>
            </div>
          ))}
        </div>
      </div>

      <Divider
        style={{
          marginTop: "1rem",
        }}
      />

      <div className="desktop-settings">
        <h3>Desktop Settings</h3>
        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Minimize to Tray</span>
            <span className="setting-description">
              Close window to tray instead of quitting
            </span>
          </div>
          <ToggleSwitch
            label=""
            checked={minimizeToTray}
            onToggle={handleTrayToggle}
          />
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Start with System</span>
            <span className="setting-description">
              Launch application automatically on login
            </span>
          </div>
          <ToggleSwitch
            label=""
            checked={startWithSystem}
            onToggle={handleAutostartToggle}
          />
        </div>
      </div>

      <div className="action-buttons">
        <Button onClick={() => setTheme(DEFAULT_APP_PREFERENCES.theme)}>
          Reset to Default
        </Button>
      </div>
    </div>
  );

  const renderAboutContent = () => (
    <div className="settings-content">
      <h2>About FFBeast Pit House</h2>

      <Divider />

      <div className="about-section">
        <div className="info-row">
          <span className="info-label">App:</span>
          <span className="info-value">FFBeast Pit House</span>
        </div>
        <div className="info-row">
          <span className="info-label">Version:</span>
          <span className="info-value">v1.0</span>
        </div>
        <div className="info-row">
          <span className="info-label">License:</span>
          <span className="info-value">MIT License</span>
        </div>
      </div>

      <Divider />

      <div className="about-description">
        <h3>About This Application</h3>
        <p>
          FFBeast Pit House is a desktop configurator for the FFBeast direct
          drive wheel base. Powered by the{" "}
          <a
            href="https://github.com/shubham0x13/ffbeast-wheel-webhid-api"
            target="_blank"
            rel="noopener noreferrer"
          >
            FFBeast Wheel WebHID API
          </a>
          .
        </p>

        <h3>Credits</h3>
        <div className="credits-list">
          <div className="credit-row">
            <span className="credit-role">Created by</span>
            <span className="credit-name">
              <a
                href="https://github.com/yaxraj-rajput"
                target="_blank"
                rel="noopener noreferrer"
              >
                @yaxraj-rajput
              </a>{" "}
              Yaxraj Dabhi
            </span>
          </div>
          <div className="credit-row">
            <span className="credit-role" />
            <span className="credit-name">
              <a
                href="https://github.com/shubham0x13"
                target="_blank"
                rel="noopener noreferrer"
              >
                @shubham0x13
              </a>{" "}
              Shubham Patel
            </span>
          </div>
          <div className="credit-row">
            <span className="credit-role">Forked by</span>
            <span className="credit-name">
              <a
                href="https://github.com/truaren"
                target="_blank"
                rel="noopener noreferrer"
              >
                @truaren
              </a>
            </span>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <Button
          onClick={() =>
            window.open(
              "https://github.com/shubham0x13/ffbeast-wheel-webhid-api",
              "_blank",
            )
          }
        >
          WebApp – GitHub
        </Button>
        <Button
          style={{ marginLeft: "0rem" }}
          variant="secondary"
          onClick={() => window.open("https://ffbeast.github.io/", "_blank")}
        >
          Documentation
        </Button>
      </div>
    </div>
  );

  const renderDisclaimerContent = () => (
    <div className="settings-content">
      <h2>Disclaimer & Legal</h2>

      <Divider style={{ marginBottom: "1rem" }} />

      <div className="disclaimer-section">
        <h3>Important Notice</h3>
        <p>
          This software is provided &quot;as is&quot; without warranty of any
          kind, either expressed or implied. The developers and contributors are
          not liable for any damages or losses arising from the use of this
          software.
        </p>

        <h3>Safety Warning</h3>
        <p className="warning-text">
          Force feedback devices can produce strong forces. Always start with
          low strength settings and gradually increase them. Do not use the
          application if you experience any discomfort. Keep hands, clothing,
          and other objects away from moving parts of the device.
        </p>

        <h3>License</h3>
        <p>
          This software is licensed under the MIT License. You are free to use,
          modify, and distribute this software in accordance with the license
          terms.
        </p>

        <h3>Data Privacy</h3>
        <p>
          FFBeast WheelHub does not collect or transmit any personal data. All
          settings and configurations are stored locally on your device.
        </p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "preferences":
        return renderThemeContent();
      case "about":
        return renderAboutContent();
      case "disclaimer":
        return renderDisclaimerContent();
      default:
        return null;
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Customize your FFBeast experience</p>
        </div>

        <div className="settings-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="settings-body">{renderContent()}</div>
      </div>
    </div>
  );
};
