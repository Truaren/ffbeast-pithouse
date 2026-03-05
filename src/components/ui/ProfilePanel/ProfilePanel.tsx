import "./style.scss";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useProfileSwitcher } from "@/hooks/use-profile-switcher";
import {
  useAppPreferencesStore,
  useDeviceSettingsStore,
  useProfileStore,
} from "@/stores";
import type { Profile } from "@/types";

const SLOT_COUNT = 6;

const PRESET_NAMES = [
  "Default",
  "Race",
  "Drift",
  "Truck",
  "Farming",
  "Assetto",
];

interface ProfilePanelProps {
  onClose: () => void;
}

/** Extract the 3 most interesting stats from a profile's saved settings */
const getProfileStats = (profile: Profile) => {
  const hw = profile.deviceSettings?.hardware;
  const fx = profile.deviceSettings?.effects;
  return {
    power: hw?.powerLimit ?? 0,
    degrees: fx?.motionRange ?? 0,
    intensity: fx?.totalEffectStrength ?? 0,
  };
};

export const ProfilePanel = ({ onClose }: ProfilePanelProps) => {
  const profileStore = useProfileStore();
  const { profiles, activeProfile, isDirty } = profileStore;
  const { setDefaultProfile } = profileStore;
  const { switchProfile } = useProfileSwitcher();
  const panelRef = useRef<HTMLDivElement>(null);

  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>("");

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleLoad = async (profileId: string) => {
    await switchProfile(profileId);
    onClose();
  };

  const handleSaveToSlot = () => {
    try {
      profileStore.updateActiveProfile(
        useDeviceSettingsStore.getState().settings,
        useAppPreferencesStore.getState().preferences,
      );
      toast.success("Profile saved!");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleCreateSlot = (slotIndex: number) => {
    const name = PRESET_NAMES[slotIndex] ?? `Profile ${slotIndex + 1}`;
    try {
      profileStore.createProfile(
        name,
        useDeviceSettingsStore.getState().settings,
        useAppPreferencesStore.getState().preferences,
        true,
      );
      toast.success(`Profile "${name}" created!`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleStartRename = (profileId: string, currentName: string) => {
    const slotIndex = profiles.findIndex((p) => p.id === profileId);
    setEditingSlot(slotIndex);
    setEditingName(currentName);
  };

  const handleCommitRename = (profileId: string) => {
    if (!editingName.trim()) {
      setEditingSlot(null);
      return;
    }
    try {
      profileStore.renameProfile(profileId, editingName.trim());
      toast.success("Profile renamed.");
    } catch (e) {
      toast.error((e as Error).message);
    }
    setEditingSlot(null);
  };

  const handleDeleteSlot = (profileId: string, name: string) => {
    if (!confirm(`Delete profile "${name}"?`)) return;
    profileStore.deleteProfile(profileId);
    toast.success(`Profile "${name}" deleted.`);
  };

  const handleSaveCurrent = () => {
    try {
      profileStore.updateActiveProfile(
        useDeviceSettingsStore.getState().settings,
        useAppPreferencesStore.getState().preferences,
      );
      toast.success("Changes saved to active profile!");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  // Build slot list — fixed 6 slots; fill with profiles, rest are empty
  const slots = Array.from({ length: SLOT_COUNT }, (_, i) => profiles[i] ?? null);

  return (
    <div className="profile_panel_overlay" ref={panelRef}>
      <div className="profile_panel_header">
        <span className="profile_panel_title">
          <i className="icon fi fi-sr-user" />
          Profiles
        </span>
        {isDirty && activeProfile && (
          <button className="save_changes_btn" onClick={handleSaveCurrent}>
            <i className="icon fi fi-rr-disk" />
            Save Changes
          </button>
        )}
        <button className="close_btn" onClick={onClose}>
          <i className="icon fi fi-rr-cross" />
        </button>
      </div>

      <div className="profile_slots">
        {slots.map((profile, i) => {
          const isActive = profile?.id === activeProfile?.id;
          const isEditing = editingSlot === i;
          const stats = profile ? getProfileStats(profile) : null;

          return (
            <div
              key={i}
              className={`profile_slot ${profile ? "filled" : "empty"} ${isActive ? "active" : ""}`}
              onClick={() => profile && !isEditing && handleLoad(profile.id)}
            >
              <div className="slot_number">{i + 1}</div>

              {profile ? (
                <>
                  <div className="slot_content">
                    {isEditing ? (
                      <input
                        autoFocus
                        className="slot_name_input"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleCommitRename(profile.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCommitRename(profile.id);
                          if (e.key === "Escape") setEditingSlot(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="slot_name">{profile.name}</span>
                    )}
                    {isActive && <span className="active_badge">Active</span>}

                    {stats && (
                      <div className="slot_stats">
                        <span className="stat">
                          <i className="icon fi fi-rr-bolt" />
                          {stats.power}%
                        </span>
                        <span className="stat">
                          <i className="icon fi fi-rr-rotate-right" />
                          {stats.degrees}°
                        </span>
                        <span className="stat">
                          <i className="icon fi fi-rr-dashboard" />
                          {stats.intensity}%
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="slot_actions" onClick={(e) => e.stopPropagation()}>
                    {isActive && (
                      <button
                        className="slot_btn save_btn"
                        title="Save current settings to this slot"
                        onClick={() => handleSaveToSlot()}
                      >
                        <i className="icon fi fi-rr-disk" />
                      </button>
                    )}
                    <button
                      className={`slot_btn star_btn ${profile.isDefault ? "is_default" : ""}`}
                      title={profile.isDefault ? "Default profile" : "Set as default"}
                      onClick={() => setDefaultProfile(profile.id)}
                    >
                      <i className={`icon fi fi-${profile.isDefault ? "sr" : "rr"}-star`} />
                    </button>
                    <button
                      className="slot_btn rename_btn"
                      title="Rename profile"
                      onClick={() => handleStartRename(profile.id, profile.name)}
                    >
                      <i className="icon fi fi-rr-pencil" />
                    </button>
                    <button
                      className="slot_btn delete_btn"
                      title="Delete profile"
                      onClick={() => handleDeleteSlot(profile.id, profile.name)}
                    >
                      <i className="icon fi fi-rr-trash" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="slot_empty_label">
                  <i className="icon fi fi-rr-plus" />
                  <span>New Profile</span>
                </div>
              )}

              {!profile && (
                <div
                  className="slot_create_overlay"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateSlot(i);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
