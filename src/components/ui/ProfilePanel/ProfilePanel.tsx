import "./style.scss";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui";
import { useProfileSwitcher } from "@/hooks/use-profile-switcher";
import {
  useAppPreferencesStore,
  useDeviceSettingsStore,
  useProfileStore,
} from "@/stores";
import { type Profile } from "@/types";
import { getClientId } from "@/utils/utils";

import { PresetDetailModal } from "./components/PresetDetailModal";

interface ProfilePanelProps {
  onClose: () => void;
}

export const ProfilePanel = ({ onClose }: ProfilePanelProps) => {
  const profileStore = useProfileStore();
  const { profiles, activeProfile } = profileStore;
  const { switchProfile } = useProfileSwitcher();
  const panelRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<
    | (Profile & {
        author?: string;
        description?: string;
        likes?: number;
        installs?: number;
        hasLiked?: boolean;
      })
    | null
  >(null);
  const [communityPresets, setCommunityPresets] = useState<
    (Profile & {
      author?: string;
      description?: string;
      likes?: number;
      installs?: number;
      hwSpecs?: { psu: string; motor: string; windings: string };
      hasLiked?: boolean;
    })[]
  >([]);
  const [isPublishing, setIsPublishing] = useState(false);

  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishForm, setPublishForm] = useState({
    username: "",
    game: "",
    otherGame: "",
    psuVolts: "",
    psuAmps: "",
    motorSize: "",
    windings: "",
    description: "",
  });

  const POPULAR_GAMES = [
    "Assetto Corsa",
    "Assetto Corsa Competizione",
    "Automobilista 2",
    "BeamNG.drive",
    "DiRT Rally 2.0",
    "EA SPORTS WRC",
    "Euro Truck Simulator 2",
    "F1 23",
    "Forza Horizon 5",
    "iRacing",
    "Le Mans Ultimate",
    "rFactor 2",
    "Richard Burns Rally",
    "Other",
  ];

  // Inline rename state: id of profile being renamed + draft text
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Delete confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchCommunityPresets = async (silent = false) => {
    try {
      if (!silent) toast.info("Updating channel...");
      const clientId = getClientId();
      const res = await fetch(
        `https://summer-snowflake-b8f7.trueaaren.workers.dev/presets?clientId=${clientId}`,
      );
      if (!res.ok) throw new Error("Failed to fetch presets");
      const data = (await res.json()) as {
        presets: {
          id: string;
          name: string;
          author?: string;
          description?: string;
          likes?: number;
          installs?: number;
          hasLiked?: boolean;
          hwSpecs?: { psu: string; motor: string; windings: string };
          profileData: Profile;
        }[];
      };

      const mapped = data.presets.map((p) => {
        return {
          ...p.profileData,
          id: p.id,
          name: p.name ?? p.profileData.name,
          author: p.author,
          description: p.description,
          likes: p.likes ?? 0,
          installs: p.installs ?? 0,
          hasLiked: p.hasLiked,
          hwSpecs: p.hwSpecs,
        };
      });
      setCommunityPresets(mapped);
      if (!silent) toast.success("Successfully updated presets");
    } catch (e) {
      console.error(e);
      if (!silent) toast.error("Failed to fetch community presets");
    }
  };

  // Fetch community presets from bot channel
  useEffect(() => {
    void fetchCommunityPresets(true);
  }, []);

  const handlePublishClick = () => {
    if (!activeProfile) {
      toast.error("Please select a profile to publish first.");
      return;
    }
    setIsPublishModalOpen(true);
  };

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile) return;

    setIsPublishing(true);

    const workerUrl =
      "https://summer-snowflake-b8f7.trueaaren.workers.dev/publish";

    try {
      const finalGame =
        publishForm.game === "Other" ? publishForm.otherGame : publishForm.game;

      const isUserPro = useAppPreferencesStore.getState().preferences.isPro;
      const profileDataToPublish = JSON.parse(
        JSON.stringify(activeProfile),
      ) as Profile;

      // If user is FREE, strip PRO settings from the published data
      if (!isUserPro) {
        PRO_HW_KEYS.forEach((key) => {
          if (profileDataToPublish.deviceSettings?.hardware) {
            delete (
              profileDataToPublish.deviceSettings.hardware as unknown as Record<
                string,
                unknown
              >
            )[key];
          }
        });
        PRO_FX_KEYS.forEach((key) => {
          if (profileDataToPublish.deviceSettings?.effects) {
            delete (
              profileDataToPublish.deviceSettings.effects as unknown as Record<
                string,
                unknown
              >
            )[key];
          }
        });
      }

      // Create a clean version for publishing
      const cleanProfile: Partial<Profile> & {
        appPreferences: Profile["appPreferences"];
      } = {
        name: profileDataToPublish.name,
        deviceSettings: profileDataToPublish.deviceSettings,
        appPreferences: {
          ...(profileDataToPublish.appPreferences || {}), // Ensure appPreferences is an object
          isPro: isUserPro,
          wheelName:
            finalGame ||
            (profileDataToPublish.appPreferences?.wheelName ?? "Generic"),
        },
      };

      const payload = {
        username: publishForm.username,
        psuVolts: publishForm.psuVolts,
        psuAmps: publishForm.psuAmps,
        motorSize: publishForm.motorSize,
        windings: publishForm.windings,
        description: publishForm.description,
        profileData: cleanProfile,
      };

      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Preset published successfully!");
        setIsPublishModalOpen(false);
        setPublishForm({
          username: "",
          game: "",
          otherGame: "",
          psuVolts: "",
          psuAmps: "",
          motorSize: "",
          windings: "",
          description: "",
        });
      } else {
        toast.error(`Publish error: ${res.status}`);
      }
    } catch (err) {
      toast.error("Connection error while publishing.");
      console.error(err);
    } finally {
      setIsPublishing(false);
    }
  };

  const PRO_HW_KEYS = ["positionSmoothing", "speedBufferSize"] as const;
  const PRO_FX_KEYS = [
    "integratedSpringStrength",
    "softStopRange",
    "softStopStrength",
    "softStopDampeningStrength",
    "directXSpringStrength",
    "directXConstantStrength",
    "directXPeriodicStrength",
  ] as const;

  const handleInstall = async (
    preset: Profile & {
      id?: string;
      likes?: number;
      installs?: number;
      hasLiked?: boolean;
      author?: string;
      description?: string;
    },
  ) => {
    try {
      const currentSettings = useDeviceSettingsStore.getState().settings;
      const isUserPro = useAppPreferencesStore.getState().preferences.isPro;

      const mergedSettings = JSON.parse(
        JSON.stringify(preset.deviceSettings),
      ) as typeof currentSettings;

      // 1. Force preserve LOCKED hardware settings (safety/calibration)
      mergedSettings.hardware = {
        ...mergedSettings.hardware,
        forceEnabled: currentSettings.hardware.forceEnabled,
        debugTorque: currentSettings.hardware.debugTorque,
        forceDirection: currentSettings.hardware.forceDirection,
        encoderCPR: currentSettings.hardware.encoderCPR,
        brakingLimit: currentSettings.hardware.brakingLimit,
      };

      // 2. If user is NOT PRO, strip PRO settings from preset (or reset to current/defaults)
      if (!isUserPro) {
        const hw = mergedSettings.hardware as unknown as Record<
          string,
          unknown
        >;
        const fx = mergedSettings.effects as unknown as Record<string, unknown>;
        const curHw = currentSettings.hardware as unknown as Record<
          string,
          unknown
        >;
        const curFx = currentSettings.effects as unknown as Record<
          string,
          unknown
        >;

        PRO_HW_KEYS.forEach((key) => {
          if (hw && key in hw) {
            hw[key] = curHw[key];
          }
        });

        PRO_FX_KEYS.forEach((key) => {
          if (fx && key in fx) {
            fx[key] = curFx[key];
          }
        });
      }

      profileStore.createProfile(
        preset.name,
        mergedSettings,
        {
          ...(preset.appPreferences ??
            useAppPreferencesStore.getState().preferences),
          isPro: isUserPro, // Force target profile to match user's license
        },
        true,
      );

      // Notify worker of install
      if (preset.id) {
        const clientId = getClientId();
        await fetch(
          "https://summer-snowflake-b8f7.trueaaren.workers.dev/install",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messageId: preset.id, clientId }),
          },
        ).catch((err) => console.error("Failed to record install:", err));

        // Optimistically update local state if needed (optional)
        setCommunityPresets((prev) =>
          prev.map((p) =>
            p.id === preset.id ? { ...p, installs: (p.installs ?? 0) + 1 } : p,
          ),
        );
      }

      setSelectedPreset(null);
      toast.success(`"${preset.name}" installed and applied!`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleLike = async (presetId: string) => {
    try {
      const clientId = getClientId();
      const res = await fetch(
        "https://summer-snowflake-b8f7.trueaaren.workers.dev/like",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: presetId, clientId }),
        },
      );

      if (!res.ok) throw new Error("Failed to like preset");

      const data = (await res.json()) as {
        ok: boolean;
        stats?: { likes: number; installs: number };
      };

      // Update local state
      setCommunityPresets((prev) =>
        prev.map((p) => {
          if (p.id === presetId) {
            return {
              ...p,
              hasLiked: true,
              likes: data.stats?.likes ?? (p.likes ?? 0) + 1,
            };
          }
          return p;
        }),
      );

      // Update selected preset if open
      if (selectedPreset?.id === presetId) {
        setSelectedPreset((prev) =>
          prev
            ? {
                ...prev,
                hasLiked: true,
                likes: data.stats?.likes ?? (prev.likes ?? 0) + 1,
              }
            : null,
        );
      }

      toast.success("Preset liked!");
    } catch (err) {
      toast.error("Failed to like preset");
      console.error(err);
    }
  };

  // --- Profile actions ---
  const startRename = (p: Profile, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(p.id);
    setRenameValue(p.name);
    setConfirmDeleteId(null);
  };

  const commitRename = (profileId: string) => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== profiles.find((p) => p.id === profileId)?.name) {
      try {
        profileStore.renameProfile(profileId, trimmed);
        toast.success("Profile renamed.");
      } catch (e) {
        toast.error((e as Error).message);
      }
    }
    setRenamingId(null);
  };

  const handleSetDefault = (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    profileStore.setDefaultProfile(profileId);
    toast.success("Default profile updated.");
  };

  const askDelete = (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(profileId);
    setRenamingId(null);
  };

  const confirmDelete = (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      profileStore.deleteProfile(profileId);
      toast.success("Profile deleted.");
    } catch (err) {
      toast.error((err as Error).message);
    }
    setConfirmDeleteId(null);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  const filteredLocal = profiles.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredComm = communityPresets.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="profile_hub_overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="profile_hub_panel" ref={panelRef}>
        {/* ====== SIDEBAR ====== */}
        <div className="hub_sidebar">
          <div className="sidebar_header">
            <span className="sidebar_title">Local Profiles</span>
            <button
              className="add_profile_btn"
              title="Create new profile from current settings"
              onClick={() => {
                profileStore.createProfile(
                  `Profile ${profiles.length + 1}`,
                  useDeviceSettingsStore.getState().settings,
                  useAppPreferencesStore.getState().preferences,
                  true,
                );
              }}
            >
              <i className="fi fi-rr-plus" />
            </button>
          </div>

          <div className="sidebar_list">
            {filteredLocal.map((p) => (
              <div
                key={p.id}
                className={`sidebar_item ${activeProfile?.id === p.id ? "active" : ""}`}
                onClick={() => {
                  if (renamingId !== p.id && confirmDeleteId !== p.id) {
                    void switchProfile(p.id);
                  }
                }}
              >
                {/* Delete confirm state */}
                {confirmDeleteId === p.id ? (
                  <div
                    className="delete_confirm_row"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="delete_confirm_text">Delete profile?</span>
                    <div className="delete_confirm_btns">
                      <button
                        className="confirm_yes_btn"
                        onClick={(e) => confirmDelete(p.id, e)}
                      >
                        <i className="fi fi-sr-check" /> Yes
                      </button>
                      <button className="confirm_no_btn" onClick={cancelDelete}>
                        <i className="fi fi-rr-cross" /> No
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="item_main">
                      {/* Inline rename input */}
                      {renamingId === p.id ? (
                        <input
                          className="rename_input"
                          value={renameValue}
                          autoFocus
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => commitRename(p.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename(p.id);
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="item_name">
                          {p.name}
                          <span
                            className={`version_badge ${p.appPreferences?.isPro ? "pro" : "free"}`}
                            style={{ marginLeft: "8px" }}
                          >
                            {p.appPreferences?.isPro ? "PRO" : "FREE"}
                          </span>
                          {p.isDefault && (
                            <i
                              className="fi fi-sr-star default_star"
                              title="Default profile"
                              style={{ marginLeft: "8px" }}
                            />
                          )}
                        </span>
                      )}
                      {renamingId !== p.id && (
                        <div className="item_stats">
                          <span className="stat">
                            <i className="fi fi-sr-bolt" />
                            <b>
                              {p.deviceSettings?.hardware?.powerLimit ?? 0}%
                            </b>
                          </span>
                          <span className="stat">
                            <i className="fi fi-sr-rotate-right" />
                            <b>
                              {p.deviceSettings?.effects?.motionRange ?? 0}°
                            </b>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action icons — visible on hover */}
                    {renamingId !== p.id && (
                      <div className="item_actions">
                        <button
                          className={`item_act_btn ${p.isDefault ? "active_default" : ""}`}
                          title={
                            p.isDefault ? "Default profile" : "Set as default"
                          }
                          onClick={(e) => handleSetDefault(p.id, e)}
                        >
                          <i
                            className={
                              p.isDefault ? "fi fi-sr-star" : "fi fi-rr-star"
                            }
                          />
                        </button>
                        <button
                          className="item_act_btn"
                          title="Rename profile"
                          onClick={(e) => startRename(p, e)}
                        >
                          <i className="fi fi-rr-pencil" />
                        </button>
                        <button
                          className="item_act_btn danger"
                          title="Delete profile"
                          onClick={(e) => askDelete(p.id, e)}
                        >
                          <i className="fi fi-rr-cross" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <div
            className="sidebar_new_btn"
            onClick={() => {
              profileStore.createProfile(
                `Profile ${profiles.length + 1}`,
                useDeviceSettingsStore.getState().settings,
                useAppPreferencesStore.getState().preferences,
                false,
              );
            }}
          >
            <i className="fi fi-rr-plus" /> Create New Slot
          </div>
        </div>

        {/* ====== MAIN ====== */}
        <div className="hub_main">
          <div className="hub_header">
            <div className="search_bar_wrapper">
              <i className="fi fi-rr-search" />
              <input
                type="text"
                placeholder="Search presets, games, authors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="header_actions">
              <Button
                variant="secondary"
                className="hub_action_btn"
                onClick={() => fetchCommunityPresets(false)}
              >
                <i className="fi fi-rr-refresh" /> Update
              </Button>
              <Button
                variant="primary"
                className="hub_action_btn"
                onClick={handlePublishClick}
                disabled={isPublishing}
              >
                <i className="fi fi-sr-paper-plane" /> Publish
              </Button>
              <button className="hub_close_btn" onClick={onClose}>
                <i className="fi fi-rr-cross" />
              </button>
            </div>
          </div>

          <div className="hub_grid_container">
            <div className="grid_title">Community Hub</div>
            <div className="preset_grid">
              {filteredComm.map((p) => (
                <div
                  key={p.id}
                  className="preset_tile"
                  onClick={() => setSelectedPreset(p)}
                >
                  <div className="tile_header">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                      }}
                    >
                      <span className="game_tag">
                        {p.appPreferences?.wheelName ?? "Generic"}
                      </span>
                      <span
                        className={`version_badge ${p.appPreferences?.isPro ? "pro" : "free"}`}
                      >
                        {p.appPreferences?.isPro ? "PRO" : "FREE"}
                      </span>
                    </div>
                  </div>
                  <div className="tile_content">
                    <span className="tile_name">{p.name}</span>
                    <span className="tile_author">
                      by {p.author ?? "Community"}
                    </span>
                  </div>
                  <div className="tile_hw">
                    <div className="hw_chip">
                      <i className="fi fi-sr-bolt" />
                      {p.hwSpecs?.psu && p.hwSpecs.psu !== "?"
                        ? p.hwSpecs.psu
                        : "36V 10A"}
                    </div>
                    <div className="hw_chip">
                      <i className="fi fi-sr-settings" />
                      {p.hwSpecs?.motor && p.hwSpecs.motor !== "?"
                        ? p.hwSpecs.motor
                        : '6.5" Std'}
                    </div>
                    <div className="hw_chip">
                      <i className="fi fi-sr-layers" />
                      {p.hwSpecs?.windings && p.hwSpecs.windings !== "?"
                        ? p.hwSpecs.windings
                        : "5 Strands"}
                    </div>
                    <div className="hw_chip">
                      <i className="fi fi-sr-box" />
                      30mm Mag
                    </div>
                  </div>
                  <div className="tile_footer">
                    <div
                      className="tile_stats"
                      style={{
                        background: "rgba(0,0,0,0.03)",
                        padding: "4px 8px",
                        borderRadius: "12px",
                      }}
                    >
                      <span
                        title="Installs"
                        style={{
                          color: "var(--text-secondary)",
                          fontWeight: 700,
                        }}
                      >
                        <i
                          className="fi fi-rr-download"
                          style={{ fontSize: "0.9rem" }}
                        />{" "}
                        {p.installs ?? "0"}
                      </span>
                      <span
                        title="Likes"
                        style={{
                          marginLeft: "10px",
                          color: "var(--text-secondary)",
                          fontWeight: 700,
                        }}
                      >
                        <i
                          className="fi fi-sr-heart"
                          style={{
                            fontSize: "0.9rem",
                            color: p.hasLiked ? "#ff4757" : "inherit",
                          }}
                        />{" "}
                        {p.likes ?? "0"}
                      </span>
                    </div>
                    <button
                      className="tile_hover"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPreset(p);
                      }}
                    >
                      Install
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <PresetDetailModal
        isOpen={!!selectedPreset}
        preset={selectedPreset}
        onClose={() => setSelectedPreset(null)}
        onInstall={handleInstall}
        onLike={handleLike}
      />

      {/* Publish Profile Modal */}
      {isPublishModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsPublishModalOpen(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "90vh", overflowY: "auto", width: "450px" }}
          >
            <h2>Publish Preset &quot;{activeProfile?.name}&quot;</h2>
            <form onSubmit={handlePublishSubmit}>
              <div className="form-group">
                <label>Your Name / Nickname</label>
                <input
                  type="text"
                  value={publishForm.username}
                  onChange={(e) =>
                    setPublishForm({ ...publishForm, username: e.target.value })
                  }
                  required
                  placeholder="e.g. SpeedRacer99"
                />
              </div>

              <div className="form-group">
                <label>Game</label>
                <select
                  value={publishForm.game}
                  onChange={(e) =>
                    setPublishForm({ ...publishForm, game: e.target.value })
                  }
                  required
                >
                  <option value="" disabled>
                    Select a game...
                  </option>
                  {POPULAR_GAMES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {publishForm.game === "Other" && (
                <div className="form-group">
                  <label>Specify Game</label>
                  <input
                    type="text"
                    value={publishForm.otherGame}
                    onChange={(e) =>
                      setPublishForm({
                        ...publishForm,
                        otherGame: e.target.value,
                      })
                    }
                    required
                    placeholder="Enter game name"
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: "1rem" }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>PSU Volts (V)</label>
                  <input
                    type="number"
                    value={publishForm.psuVolts}
                    onChange={(e) =>
                      setPublishForm({
                        ...publishForm,
                        psuVolts: e.target.value,
                      })
                    }
                    required
                    placeholder="36"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>PSU Amps (A)</label>
                  <input
                    type="number"
                    value={publishForm.psuAmps}
                    onChange={(e) =>
                      setPublishForm({
                        ...publishForm,
                        psuAmps: e.target.value,
                      })
                    }
                    required
                    placeholder="10"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Motor Size (inch)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={publishForm.motorSize}
                    onChange={(e) =>
                      setPublishForm({
                        ...publishForm,
                        motorSize: e.target.value,
                      })
                    }
                    required
                    placeholder="6.5"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Winding Strands</label>
                  <input
                    type="number"
                    value={publishForm.windings}
                    onChange={(e) =>
                      setPublishForm({
                        ...publishForm,
                        windings: e.target.value,
                      })
                    }
                    required
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={publishForm.description}
                  onChange={(e) =>
                    setPublishForm({
                      ...publishForm,
                      description: e.target.value,
                    })
                  }
                  rows={4}
                  maxLength={300}
                  placeholder="Describe your preset (max 300 characters). Example: Optimized for Drifting in Assetto Corsa."
                />
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-secondary)",
                    alignSelf: "flex-end",
                    marginTop: "4px",
                  }}
                >
                  {publishForm.description.length}/300
                </span>
              </div>

              <div className="modal-actions">
                <Button
                  variant="secondary"
                  onClick={() => setIsPublishModalOpen(false)}
                >
                  Cancel
                </Button>
                <button
                  type="submit"
                  className="button_comp primary"
                  disabled={isPublishing}
                >
                  {isPublishing ? "Publishing..." : "Submit Preset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
