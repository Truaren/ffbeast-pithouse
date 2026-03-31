import "./style.scss";

import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";

import { Button, Divider, InputBox, ToggleSwitch } from "@/components/ui";
import { DEFAULT_APP_PREFERENCES } from "@/config";
import { ROUTES } from "@/routes";
import { useAppPreferencesStore, useWheelStore } from "@/stores";
import { useUpdateStore } from "@/stores/updateStore";
import { THEMES } from "@/theme";
import { formatSerialKey } from "@/utils";

type TabType =
  | "preferences"
  | "sidebar"
  | "performance"
  | "feedback"
  | "about"
  | "disclaimer"
  | "license";

interface Tab {
  id: TabType;
  label: string;
  icon?: string;
}

const tabs: Tab[] = [
  { id: "preferences", label: "Preferences" },
  { id: "sidebar", label: "Sidebar Menu" },
  { id: "performance", label: "Performance" },
  { id: "feedback", label: "Feedback" },
  { id: "about", label: "About" },
  { id: "disclaimer", label: "Disclaimer" },
  { id: "license", label: "License" },
];

export const Settings = () => {
  const {
    preferences,
    setTheme,
    setAutoCheckUpdates,
    setSidebarConfig,
    setIsPro,
    setCenterWheelKey,
    setPerformanceSetting,
  } = useAppPreferencesStore();
  const { checkForUpdate, isChecking, latestVersion } = useUpdateStore();
  const location = useLocation();
  const locationState = location.state as { tab?: string } | null;

  const [activeTab, setActiveTab] = useState<TabType>(
    (locationState?.tab as TabType) ?? "preferences",
  );
  const [minimizeToTray, setMinimizeToTray] = useState(false);
  const [startWithSystem, setStartWithSystem] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [serialKey, setSerialKey] = useState("");
  const [isListeningForKey, setIsListeningForKey] = useState(false);

  const { api, isConnected, deviceId } = useWheelStore(
    useShallow((state) => ({
      api: state.api,
      isConnected: state.isConnected,
      deviceId: state.deviceId,
    })),
  );

  useEffect(() => {
    // Check if we are in Electron
    const win = window as unknown as {
      require?: (module: string) => {
        ipcRenderer: {
          invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
        };
      };
    };
    if (win.require) {
      const { ipcRenderer } = win.require("electron");
      void ipcRenderer.invoke("get-app-settings").then((settings: unknown) => {
        const s = settings as {
          minimizeToTray: boolean;
          startWithSystem: boolean;
        };
        setMinimizeToTray(s.minimizeToTray);
        setStartWithSystem(s.startWithSystem);
      });
    }
  }, []);

  const handleTrayToggle = (val: boolean) => {
    setMinimizeToTray(val);
    const win = window as unknown as {
      require?: (module: string) => {
        ipcRenderer: {
          invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
        };
      };
    };
    if (win.require) {
      void win
        .require("electron")
        .ipcRenderer.invoke("set-minimize-to-tray", val);
    }
  };

  const handleAutostartToggle = (val: boolean) => {
    setStartWithSystem(val);
    const win = window as unknown as {
      require?: (module: string) => {
        ipcRenderer: {
          invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
        };
      };
    };
    if (win.require) {
      void win
        .require("electron")
        .ipcRenderer.invoke("set-start-with-system", val);
    }
  };

  const handleStartKeyListen = () => {
    setIsListeningForKey(true);
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();

      if (["Control", "Shift", "Alt", "Meta", "Escape"].includes(e.key)) {
        if (e.key === "Escape") {
          setIsListeningForKey(false);
          window.removeEventListener("keydown", onKey, true);
        }
        return;
      }

      const parts = [];
      if (e.ctrlKey || e.metaKey) parts.push("CommandOrControl");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");

      let mainKey = e.key;
      const keyMap: Record<string, string> = {
        " ": "Space",
        "+": "Plus",
        Enter: "Return",
        ArrowUp: "Up",
        ArrowDown: "Down",
        ArrowLeft: "Left",
        ArrowRight: "Right",
      };
      mainKey = keyMap[mainKey] || mainKey;
      if (mainKey.length === 1) mainKey = mainKey.toUpperCase();

      parts.push(mainKey);
      setCenterWheelKey(parts.join("+"));

      setIsListeningForKey(false);
      window.removeEventListener("keydown", onKey, true);
    };
    window.addEventListener("keydown", onKey, true);
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

      <Divider className="divider-margin" />

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

      <div className="desktop-settings subheader-margin">
        <h3>Updates</h3>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Auto Check for Updates</span>
            <span className="setting-description">
              Automatically check for new versions on launch
            </span>
          </div>
          <ToggleSwitch
            label=""
            checked={preferences.autoCheckUpdates !== false}
            onToggle={(val) => setAutoCheckUpdates(val)}
          />
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Application Version</span>
            <span className="setting-description">
              Current: v{__APP_VERSION__}{" "}
              {latestVersion ? `| Latest: ${latestVersion}` : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="desktop-settings subheader-margin">
        <h3>Keybinds</h3>
        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Recenter Wheel Hotkey</span>
            <span className="setting-description">
              Press a key to recenter / zero the wheel position at any time
            </span>
          </div>
          <div className="keybind-controls">
            {preferences.centerWheelKey ? (
              <>
                <span className="keybind-badge">
                  {preferences.centerWheelKey}
                </span>
                <Button
                  variant="secondary"
                  className="keybind-clear-btn"
                  onClick={() => setCenterWheelKey(null)}
                >
                  Clear
                </Button>
              </>
            ) : null}
            <Button
              variant={isListeningForKey ? "primary" : "secondary"}
              className={`keybind-listen-btn${isListeningForKey ? " listening" : ""}`}
              onClick={handleStartKeyListen}
            >
              {isListeningForKey
                ? "Press any key\u2026"
                : preferences.centerWheelKey
                  ? "Change"
                  : "Set Key"}
            </Button>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <Button onClick={() => checkForUpdate(true)} disabled={isChecking}>
          {isChecking ? "Checking..." : "Check for Updates"}
        </Button>
        <Button
          variant={confirmReset ? "primary" : "secondary"}
          className={confirmReset ? "reset-button-confirm" : ""}
          onClick={() => {
            if (confirmReset) {
              setTheme(DEFAULT_APP_PREFERENCES.theme);
              setConfirmReset(false);
            } else {
              setConfirmReset(true);
              setTimeout(() => setConfirmReset(false), 3000);
            }
          }}
        >
          {confirmReset ? "Are you sure?" : "Reset to Default"}
        </Button>
      </div>
    </div>
  );

  const renderSidebarContent = () => {
    // Current specific configurations or default unconfigured items
    let currentConfig = preferences.sidebarConfig ?? [];

    // Auto-populate based on ROUTES if config is empty or missing items
    const routeKeys = Object.keys(ROUTES).filter((k) => k !== "settings");

    if (currentConfig.length !== routeKeys.length) {
      const newConfig = routeKeys
        .map((k, index) => {
          const existing = currentConfig.find((c) => c.id === k);
          return existing ?? { id: k, visible: true, order: index };
        })
        .sort((a, b) => a.order - b.order);
      currentConfig = newConfig;
    }

    const moveItem = (index: number, direction: -1 | 1) => {
      if (index + direction < 0 || index + direction >= currentConfig.length)
        return;
      const newConfig = [...currentConfig];
      // Swap orders
      const tempOrder = newConfig[index].order;
      newConfig[index].order = newConfig[index + direction].order;
      newConfig[index + direction].order = tempOrder;

      // Sort array by new order
      newConfig.sort((a, b) => a.order - b.order);
      setSidebarConfig(newConfig);
    };

    const toggleVisibility = (index: number) => {
      const newConfig = [...currentConfig];
      newConfig[index].visible = !newConfig[index].visible;
      setSidebarConfig(newConfig);
    };

    return (
      <div className="settings-content">
        <h2>Sidebar Customization</h2>
        <p className="settings-description">
          Reorder and toggle visibility of left menu navigation items.
        </p>
        <Divider />
        <div className="sidebar-list">
          {currentConfig.map((item, idx) => {
            const route = ROUTES[item.id];
            if (!route) return null;
            return (
              <div key={item.id} className="sidebar-item">
                <div
                  className="sidebar-item-info"
                  style={{ opacity: item.visible ? 1 : 0.5 }}
                >
                  <i className={route.icon} />
                  <span style={{ fontWeight: 500 }}>{route.title}</span>
                </div>
                <div className="sidebar-item-controls">
                  <div title={item.visible ? "Hide" : "Show"}>
                    <Button
                      variant="secondary"
                      className="icon-button-small"
                      onClick={() => toggleVisibility(idx)}
                    >
                      {item.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </Button>
                  </div>
                  <Button
                    variant="secondary"
                    className="icon-button-small"
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, -1)}
                  >
                    <ArrowUp size={16} />
                  </Button>
                  <Button
                    variant="secondary"
                    className="icon-button-small"
                    disabled={idx === currentConfig.length - 1}
                    onClick={() => moveItem(idx, 1)}
                  >
                    <ArrowDown size={16} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleFeedbackSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const rawData = Object.fromEntries(formData.entries());

    const workerUrl =
      "https://summer-snowflake-b8f7.trueaaren.workers.dev/feedback";

    // Format for Discord Webhook
    const discordPayload = {
      embeds: [
        {
          title: "New Bug Report / Feature Request!",
          description: rawData.message as string,
          color: 0x3b82f6, // Blue
          author: {
            name: rawData.name as string,
          },
          fields: [
            {
              name: "Contact Email",
              value: (rawData.email as string) || "Not provided",
              inline: true,
            },
            { name: "App Version", value: `v${__APP_VERSION__}`, inline: true },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    try {
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(discordPayload),
      });

      if (res.ok) {
        toast.success("Feedback submitted successfully!");
        form.reset();
      } else {
        toast.error("Failed to submit feedback. Please try again.");
      }
    } catch {
      toast.error("Failed to submit feedback. Please check your connection.");
    }
  };

  const renderFeedbackContent = () => (
    <div className="settings-content">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <h2>Provide Feedback</h2>
        <i className={`badge ${preferences.isPro ? "pro" : "free"}`}>
          {preferences.isPro ? "PRO" : "FREE"}
        </i>
      </div>
      <p className="settings-description">
        Submit a bug report or feature request directly to the developer.
      </p>
      <Divider />
      <form onSubmit={handleFeedbackSubmit} className="feedback-form">
        <input
          type="hidden"
          name="_subject"
          value="New Bug Report / Feature Request!"
        />

        <div className="form-group">
          <label>Who is writing (Name)</label>
          <input
            type="text"
            name="name"
            placeholder="e.g. truearena"
            required
          />
        </div>
        <div className="form-group">
          <label>Description of Bug or Request</label>
          <textarea
            name="message"
            placeholder="Explain the issue or functionality you'd like to see..."
            required
          />
        </div>
        <div className="form-group">
          <label>Contact Email</label>
          <input
            type="email"
            name="email"
            placeholder="Email Address (Optional)"
          />
        </div>
        <Button type="submit" variant="primary" className="submit-button">
          Submit Feedback
        </Button>
      </form>
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
          <span className="info-value">v{__APP_VERSION__}</span>
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

      <Divider className="divider-margin-bottom" />

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
          FFBeast Pit House does not collect or transmit any personal data. All
          settings and configurations are stored locally on your device.
        </p>
      </div>
    </div>
  );

  const handleActivate = async () => {
    if (!serialKey.trim() || serialKey.length !== 26) {
      toast.error("Please enter a valid serial key.");
      return;
    }
    if (!isConnected) {
      toast.error("Please connect your device before activating the license.");
      return;
    }
    const success = await api.sendFirmwareActivation(serialKey);
    if (success) {
      toast.success("Device activated successfully!");
      setIsPro(true);
      setSerialKey("");
    } else {
      toast.error("Activation failed. Please check the key and try again.");
    }
  };
  const renderLicenseContent = () => (
    <div className="settings-content">
      <h2>License &amp; Activation</h2>
      <p className="settings-description">
        Activate your device with a serial key to unlock PRO features.
      </p>
      <Divider />

      {preferences.isPro ? (
        <div className="pro_thank_you">
          <div className="pro_thank_you_icon">
            <i className="fi fi-sr-star" />
          </div>
          <div>
            <h3>Thank you for your support! 🚀</h3>
            <p>Your PRO license is active. Enjoy all features!</p>
          </div>
          <i className="badge pro">PRO</i>
        </div>
      ) : null}

      <div className="license-activation-container">
        <InputBox
          label="Device ID"
          value={deviceId ?? "Device not connected"}
          placeholder="00000000-00000000-00000000"
          readonly
        />
        {!preferences.isPro && (
          <>
            <InputBox
              label="Serial Key"
              placeholder="00000000-00000000-00000000"
              value={serialKey}
              onValueChange={(value) => setSerialKey(formatSerialKey(value))}
            />
            <Button variant="primary" onClick={() => handleActivate()}>
              Activate
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const renderPerformanceContent = () => (
    <div className="settings-content">
      <h2>Performance &amp; Developer</h2>
      <p className="settings-description">
        Advanced options for adjusting application performance, hardware
        polling, and troubleshooting.
      </p>

      <Divider />

      <div className="desktop-settings">
        <h3>Core Engine</h3>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Disable Hardware Acceleration</span>
            <span className="setting-description">
              Turns off GPU rendering (Requires restart). Useful if the UI feels
              sluggish or flickers on older PCs.
            </span>
          </div>
          <ToggleSwitch
            label=""
            checked={
              preferences.performance?.disableHardwareAcceleration ?? false
            }
            onToggle={(val) =>
              setPerformanceSetting("disableHardwareAcceleration", val)
            }
          />
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Reduce Input Polling</span>
            <span className="setting-description">
              Limits device telemetry refresh rate to ~60Hz to save CPU cycles.
            </span>
          </div>
          <ToggleSwitch
            label=""
            checked={preferences.performance?.reduceInputPolling ?? false}
            onToggle={(val) => setPerformanceSetting("reduceInputPolling", val)}
          />
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Save Configs Asynchronously</span>
            <span className="setting-description">
              Prevents the UI from halting when writing profile data to disk.
            </span>
          </div>
          <ToggleSwitch
            label=""
            checked={preferences.performance?.forceAsyncFileOps ?? false}
            onToggle={(val) => setPerformanceSetting("forceAsyncFileOps", val)}
          />
        </div>
      </div>

      <div className="desktop-settings subheader-margin">
        <h3>Troubleshooting</h3>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Continuous Device Reconnect</span>
            <span className="setting-description">
              Automatically tries to reconnect to disconnected devices in the
              background.
            </span>
          </div>
          <ToggleSwitch
            label=""
            checked={preferences.performance?.enableDeviceReconnect ?? false}
            onToggle={(val) =>
              setPerformanceSetting("enableDeviceReconnect", val)
            }
          />
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Disable Debug Logging</span>
            <span className="setting-description">
              Stops spamming console logs which may slightly improve performance
              over time.
            </span>
          </div>
          <ToggleSwitch
            label=""
            checked={preferences.performance?.disableDebugLogging ?? false}
            onToggle={(val) =>
              setPerformanceSetting("disableDebugLogging", val)
            }
          />
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Safe Mode</span>
            <span className="setting-description">
              Disables experimental WebHID polling plugins and defaults to
              bare-minimum commands.
            </span>
          </div>
          <ToggleSwitch
            label=""
            checked={preferences.performance?.safeMode ?? false}
            onToggle={(val) => setPerformanceSetting("safeMode", val)}
          />
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "preferences":
        return renderThemeContent();
      case "sidebar":
        return renderSidebarContent();
      case "performance":
        return renderPerformanceContent();
      case "feedback":
        return renderFeedbackContent();
      case "about":
        return renderAboutContent();
      case "disclaimer":
        return renderDisclaimerContent();
      case "license":
        return renderLicenseContent();
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
