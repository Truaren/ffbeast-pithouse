import "./style.scss";

import { FolderOpen, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button, Divider } from "@/components/ui";
import { useAppPreferencesStore, useProfileStore } from "@/stores";

interface ElectronWindow extends Window {
  require: (module: "electron") => {
    ipcRenderer: {
      invoke: (channel: string, ...args: unknown[]) => Promise<string | null>;
    };
  };
}

const { ipcRenderer } = (window as unknown as ElectronWindow).require(
  "electron",
);

export const AutoProfiles = () => {
  const { preferences, addAutoProfile, removeAutoProfile } =
    useAppPreferencesStore();
  const { profiles } = useProfileStore();

  const [newAutoExe, setNewAutoExe] = useState("");
  const [newAutoProfileId, setNewAutoProfileId] = useState("");

  const handleAddAutoProfile = () => {
    if (!newAutoExe || !newAutoProfileId) return;
    addAutoProfile(newAutoExe.trim(), newAutoProfileId);
    setNewAutoExe("");
    setNewAutoProfileId("");
  };

  const handleBrowseExe = async () => {
    try {
      const fileName = await ipcRenderer.invoke("select-exe-file");
      if (fileName) {
        setNewAutoExe(fileName);
      }
    } catch (error) {
      console.error("Failed to open file dialog:", error);
    }
  };

  return (
    <div className="autoprofiles-page">
      <div className="page-header">
        <h1>Auto Profiles</h1>
        <p>Automatically switch to specific profiles when games are running</p>
      </div>

      <div className="autoprofiles-container">
        <div className="autoprofiles-body">
          <p className="description" style={{ marginBottom: "1rem" }}>
            Specify an exact executable name (e.g., <strong>acs.exe</strong>,{" "}
            <strong>forza_horizon5.exe</strong>) and bind a profile to it. When
            the application detects that process, it will automatically switch
            your wheel to the mapped profile.
          </p>

          <Divider style={{ margin: "1.5rem 0" }} />

          <div className="platform-settings">
            <h3>Add New Binding</h3>
            <div className="auto-profile-form">
              <div style={{ display: "flex", gap: "0.5rem", flex: 1 }}>
                <input
                  type="text"
                  placeholder="Game specific .exe (e.g. acs.exe)"
                  value={newAutoExe}
                  onChange={(e) => setNewAutoExe(e.target.value)}
                  className="auto-profile-input"
                  style={{ flex: 1 }}
                />
                <Button
                  variant="secondary"
                  onClick={() => void handleBrowseExe()}
                  style={{ padding: "0 0.75rem" }}
                >
                  <FolderOpen size={18} />
                </Button>
              </div>
              <select
                value={newAutoProfileId}
                onChange={(e) => setNewAutoProfileId(e.target.value)}
                className="auto-profile-select"
              >
                <option value="" disabled>
                  Select a Profile
                </option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleAddAutoProfile}
                disabled={
                  !newAutoExe || !newAutoProfileId || profiles.length === 0
                }
              >
                Add Rule
              </Button>
            </div>
          </div>

          <div className="platform-settings" style={{ marginTop: "2rem" }}>
            <h3>Active Rules</h3>
            <div className="auto-profile-list">
              {(preferences.autoProfiles || []).length === 0 ? (
                <div className="empty-message">
                  No automatic profile rules configured yet.
                </div>
              ) : (
                (preferences.autoProfiles || []).map((mapping, idx) => {
                  const boundProfile = profiles.find(
                    (p) => p.id === mapping.profileId,
                  );
                  return (
                    <div key={idx} className="setting-item auto-profile-item">
                      <div className="setting-info">
                        <span className="setting-label">{mapping.exeName}</span>
                        <span className="setting-description">
                          Bound to:{" "}
                          {boundProfile ? boundProfile.name : "Unknown Profile"}
                        </span>
                      </div>
                      <button
                        className="delete-btn"
                        onClick={() => removeAutoProfile(mapping.exeName)}
                        title="Remove Rule"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
