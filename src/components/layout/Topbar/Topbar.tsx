import "./style.scss";

import logo from "@assets/steering-wheel.png";
import { useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { ProfilePanel } from "@/components/ui";
import { useProfileStore, useWheelStore } from "@/stores";
import { confirmToast } from "@/utils/toast";

export const Topbar = () => {
  const { activeProfile, isDirty } = useProfileStore();
  const [showProfiles, setShowProfiles] = useState(false);

  const activeStats = activeProfile
    ? {
        power: activeProfile.deviceSettings?.hardware?.powerLimit ?? 0,
        degrees: activeProfile.deviceSettings?.effects?.motionRange ?? 0,
        intensity: activeProfile.deviceSettings?.effects?.totalEffectStrength ?? 0,
      }
    : null;

  const { api, isConnected } = useWheelStore(
    useShallow((state) => ({ api: state.api, isConnected: state.isConnected })),
  );

  const handleReboot = () => {
    api.rebootController().catch((e: unknown) =>
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

  return (
    <div className="topbar">
      <button
        className="logo_button"
        onClick={() => {
          window.location.href = "/";
        }}
      >
        <img src={logo} alt="FFB" />
      </button>

      <div className="left">
        <div className="title">
          <h1>FFBeast Pit House</h1>
        </div>
        <div className="info">
          <span className="version">v1.0</span>
        </div>
      </div>

      <div className="device_actions">
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

      <div className="right" style={{ position: "relative" }}>
        <button
          className={`profile_toggle_btn ${showProfiles ? "open" : ""} ${isDirty ? "dirty" : ""}`}
          onClick={() => setShowProfiles((v) => !v)}
          title="Manage Profiles"
        >
          <i className="icon fi fi-sr-user" />
          <span className="profile_name">{activeProfile ? activeProfile.name : "Select Profile"}</span>
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
              <span className="pstat">
                <i className="icon fi fi-rr-dashboard" />
                {activeStats.intensity}%
              </span>
            </span>
          )}
          {isDirty && <span className="dirty_dot" />}
          <i
            className={`icon fi fi-rr-angle-${showProfiles ? "up" : "down"} chevron`}
          />
        </button>

        {showProfiles && (
          <ProfilePanel onClose={() => setShowProfiles(false)} />
        )}
      </div>
    </div>
  );
};
