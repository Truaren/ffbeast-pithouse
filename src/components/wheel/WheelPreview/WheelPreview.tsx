import "./styles.scss";

import { useMemo } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui";
import { useProfileSwitcher } from "@/hooks/use-profile-switcher";
import {
  useAppPreferencesStore,
  useDeviceSettingsStore,
  useProfileStore,
  useWheelStore,
} from "@/stores";

const BAR_COUNT = 55;
const ANGLE_STEP = 1.8;
const RADIUS = "18rem";

const TOTAL_ARC = (BAR_COUNT - 1) * ANGLE_STEP;
const START_ANGLE = -TOTAL_ARC / 2;

const BAR_ANGLES = Array.from(
  { length: BAR_COUNT },
  (_, i) => START_ANGLE + i * ANGLE_STEP,
);

export const WheelPreview = () => {
  const { profiles, activeProfile } = useProfileStore(
    useShallow((state) => ({
      profiles: state.profiles,
      activeProfile: state.activeProfile,
    })),
  );
  const { wheelImageUrl, setWheelImage, resetWheelImage } =
    useAppPreferencesStore(
      useShallow((state) => ({
        wheelImageUrl: state.preferences.wheelImageUrl,
        setWheelImage: state.setWheelImage,
        resetWheelImage: state.resetWheelImage,
      })),
    );
  const { api, positionDegrees } = useWheelStore(
    useShallow((state) => ({
      api: state.api,
      positionDegrees: state.deviceState?.positionDegrees ?? 0,
    })),
  );
  const motionRange = useDeviceSettingsStore(
    (state) => state.settings.effects.motionRange,
  );
  const { switchProfile } = useProfileSwitcher();

  const activeBarIndex = useMemo(() => {
    const halfRange = motionRange / 2;
    const normalizedRotation = (positionDegrees + halfRange) / motionRange;
    const index = Math.round(normalizedRotation * (BAR_COUNT - 1));

    return Math.min(BAR_COUNT - 1, Math.max(0, index));
  }, [positionDegrees, motionRange]);

  const displayedProfiles = useMemo(() => {
    const firstThree = profiles.slice(0, 3);
    if (activeProfile && !firstThree.some((p) => p.id === activeProfile.id)) {
      return [activeProfile, ...firstThree.slice(0, 2)];
    }
    return firstThree;
  }, [profiles, activeProfile]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWheelImage(file)
      .then(() => {
        toast.success("Wheel image updated.");
      })
      .catch((error) => {
        toast.error(
          "Failed to update wheel image: " + (error as Error).message,
        );
      });
  };

  return (
    <div className="wheel_preview">
      <div className="angle_representation">
        <span className="angle_text">{positionDegrees.toFixed(2)}°</span>

        <div className="bars">
          {BAR_ANGLES.map((rotation, index) => (
            <div
              key={index}
              className={`bar ${index === activeBarIndex ? "active" : ""}`}
              style={{
                transform: `rotate(${rotation}deg) translateY(-${RADIUS})`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="wheel">
        <img
          src={wheelImageUrl}
          alt="Wheel Image Preview"
          draggable={false}
          style={{ transform: `rotate(${positionDegrees}deg)` }}
        />

        <div className="buttons">
          <Button
            variant="secondary"
            style={{
              border: "none",
            }}
            onClick={() => resetWheelImage()}
            icon="icon fi fi-rr-refresh"
          >
            Reset
          </Button>

          <label className="upload_button" style={{ zIndex: 9999 }}>
            <i className="icon fi fi-rr-shuffle"></i>Change
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e)}
            />
          </label>
        </div>
      </div>

      <div className="buttons">
        <button className="button recenter" onClick={() => api.saveAndReboot()}>
          <i className="icon fi fi-rr-recycle"></i>
          <span>Save And Reboot</span>
        </button>
        <button
          className="button recenter"
          onClick={() => api.rebootController()}
        >
          <i className="icon fi fi-rr-power"></i>
          <span>Reboot</span>
        </button>
        <button className="button recenter" onClick={() => api.switchToDfu()}>
          <i className="icon fi fi-rr-replace"></i>
          <span>Switch to DFU</span>
        </button>

        <button
          className="button recenter"
          onClick={() => api.resetWheelCenter()}
        >
          <i className="icon fi fi-rr-steering-wheel"></i>
          <span>Recenter Wheel</span>
        </button>
      </div>

      {profiles.length > 0 && (
        <>
          <div className="preset_cards">
            <div className="preset_title">Profiles</div>
            <div className="cards_container">
              {displayedProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className={`preset_card ${
                    activeProfile?.id === profile.id ? "selected" : ""
                  }`}
                  onClick={() => switchProfile(profile.id)}
                >
                  <div className="preset_name">{profile.name}</div>
                  <div className="preset_description">
                    Motion Range: {profile.deviceSettings.effects.motionRange}
                    °
                    <br />
                    Total Effect Strength:{" "}
                    {profile.deviceSettings.effects.totalEffectStrength}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
