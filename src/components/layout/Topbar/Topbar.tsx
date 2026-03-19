import "./style.scss";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { DonateModal } from "@/components/ui/DonateModal/DonateModal";
import { ProfilePanel } from "@/components/ui/ProfilePanel/ProfilePanel";
import {
  useAppPreferencesStore,
  useDeviceSettingsStore, // Added
  useProfileStore,
  useWheelStore,
} from "@/stores";
import { confirmToast } from "@/utils/toast";

export const Topbar = () => {
  const { activeProfile, isDirty } = useProfileStore();
  const [showProfiles, setShowProfiles] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const navigate = useNavigate();

  const { preferences } = useAppPreferencesStore();
  const isPro = preferences.isPro ?? false;

  const activeStats = activeProfile
    ? {
        power: activeProfile.deviceSettings?.hardware?.powerLimit ?? 0,
        degrees: activeProfile.deviceSettings?.effects?.motionRange ?? 0,
        intensity:
          activeProfile.deviceSettings?.effects?.totalEffectStrength ?? 0,
      }
    : null;

  const { api, isConnected } = useWheelStore(
    useShallow((state) => ({ api: state.api, isConnected: state.isConnected })),
  );

  const handleReboot = () => {
    api
      .rebootController()
      .catch((e: unknown) =>
        toast.error("Reboot failed: " + (e as Error).message),
      );
  };

  const handleSaveAndReboot = () => {
    api
      .saveAndReboot()
      .catch((e: unknown) =>
        toast.error("Save & Reboot failed: " + (e as Error).message),
      );
    toast.success("Settings saved. Rebooting...");
  };

  const handleSwitchToDfu = async () => {
    const ok = await confirmToast(
      "Switch to DFU mode for firmware flashing?",
      undefined,
      "dfu-mode",
      "warning",
    );
    if (!ok) return;
    api
      .switchToDfu()
      .catch((e: unknown) =>
        toast.error("DFU switch failed: " + (e as Error).message),
      );
  };

  const handleBadgeClick = () => {
    if (!isPro) {
      void navigate("/settings", { state: { tab: "license" } });
    }
  };

  const handleSaveToProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeProfile) return;

    try {
      const settings = useDeviceSettingsStore.getState().settings;
      const preferences = useAppPreferencesStore.getState().preferences;
      useProfileStore.getState().updateActiveProfile(settings, preferences);
      toast.success(`Profile "${activeProfile.name}" saved!`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="topbar">
      <div className="left">
        <div className="title">
          <h1>FFBeast Pit House</h1>
        </div>
        <div className="info">
          <span className="version">v4.1.0</span>
          <button
            className={`license_badge ${isPro ? "pro" : "free"}`}
            onClick={handleBadgeClick}
            title={
              isPro ? "PRO License Active" : "Click to activate PRO license"
            }
          >
            {isPro ? "PRO" : "FREE"}
          </button>
        </div>
      </div>

      <div className="device_actions">
        <div className="actions_grid">
          <button
            className={`action_btn dfu_btn ${!isConnected ? "disabled" : ""}`}
            onClick={handleSwitchToDfu}
            disabled={!isConnected}
            title="Switch to DFU mode for firmware updates"
          >
            <i className="icon fi fi-sr-bolt" />
            Switch to DFU
          </button>
          <button
            className="action_btn donate_btn"
            onClick={() => setShowDonate(true)}
            title="Support the developer"
          >
            <i className="icon fi fi-sr-heart" />
            Donate
          </button>
          <button
            className={`action_btn reboot_btn ${!isConnected ? "disabled" : ""}`}
            onClick={handleReboot}
            disabled={!isConnected}
            title="Reboot the controller without saving"
          >
            <i className="icon fi fi-sr-rotate-right" />
            Reboot
          </button>
          <button
            className={`action_btn save_reboot_btn ${!isConnected ? "disabled" : ""}`}
            onClick={handleSaveAndReboot}
            disabled={!isConnected}
            title="Save current settings to flash memory and reboot"
          >
            <i className="icon fi fi-sr-floppy-disks" />
            Save &amp; Reboot
          </button>
        </div>
      </div>

      <div className="right" style={{ position: "relative" }}>
        <button
          className={`profile_toggle_btn ${showProfiles ? "open" : ""} ${isDirty ? "dirty" : ""}`}
          onClick={() => setShowProfiles((v) => !v)}
          title="Manage Profiles"
        >
          <i className="icon fi fi-sr-user" />
          <span className="profile_name">
            {activeProfile ? activeProfile.name : "Select Profile"}
          </span>
          {activeStats && (
            <span className="profile_stats">
              <span className="pstat">
                <i className="icon fi fi-rr-bolt" />
                {activeStats.power}%
              </span>
              <span className="pstat">
                <i className="icon fi fi-rr-rotate-right" />
                {activeStats.degrees}°
              </span>
            </span>
          )}
          {isDirty && <span className="dirty_dot" />}
          <i
            className={`icon fi fi-rr-angle-${showProfiles ? "up" : "down"} chevron`}
          />
        </button>

        {activeProfile && (
          <button
            className={`profile_save_btn ${isDirty ? "dirty" : ""}`}
            onClick={handleSaveToProfile}
            title={
              isDirty ? "Save changes to profile" : "Profile is up to date"
            }
          >
            <i className="fi fi-sr-disk" />
          </button>
        )}

        {showProfiles && (
          <ProfilePanel onClose={() => setShowProfiles(false)} />
        )}
      </div>

      {showDonate && <DonateModal onClose={() => setShowDonate(false)} />}
    </div>
  );
};
