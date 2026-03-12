import "./style.scss";

import { useState } from "react";

import { Button } from "@/components/ui/Button/Button";
import { type Profile } from "@/types";

interface PresetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset:
    | (Profile & {
        likes?: number;
        installs?: number;
        hasLiked?: boolean;
        description?: string;
        author?: string;
      })
    | null;
  onInstall: (preset: Profile) => void;
  onLike: (presetId: string) => Promise<void>;
}

const LOCKED_SETTINGS = [
  "Enable Forces",
  "Debug Forces",
  "Invert Joystick",
  "Invert Force",
  "Encoder CPR",
  "Braking Resistor Limit",
];

interface ParamRow {
  label: string;
  value: string | number;
  isPro?: boolean;
}

interface SettingSection {
  category: string;
  params: ParamRow[];
}

function buildSections(preset: Profile): SettingSection[] {
  const hw = preset.deviceSettings?.hardware;
  const fx = preset.deviceSettings?.effects;
  const isPresetPro = preset.appPreferences?.isPro ?? false;

  const all: SettingSection[] = [
    {
      category: "Controller",
      params: [
        { label: "Enable Forces", value: hw?.forceEnabled ? "ON" : "OFF" },
        { label: "Debug Forces", value: hw?.debugTorque ? "ON" : "OFF" },
        { label: "Power Limit", value: `${hw?.powerLimit ?? 0}%` },
        {
          label: "Position Smoothing",
          value: `${hw?.positionSmoothing ?? 0}%`,
          isPro: true,
        },
        {
          label: "Speed Sample Buffer",
          value: hw?.speedBufferSize ?? 2,
          isPro: true,
        },
      ],
    },
    {
      category: "Axis & Motor",
      params: [
        { label: "Invert Joystick", value: "OFF" },
        {
          label: "Invert Force",
          value: hw?.forceDirection === -1 ? "ON" : "OFF",
        },
        { label: "Encoder CPR", value: hw?.encoderCPR ?? 4096 },
        { label: "Motor Pole Pairs", value: hw?.polePairs ?? 15 },
        { label: "P Gain", value: hw?.proportionalGain ?? 10 },
        { label: "I Gain", value: hw?.integralGain ?? 100 },
      ],
    },
    {
      category: "Calibration & Safety",
      params: [
        {
          label: "Calibration Magnitude",
          value: `${hw?.calibrationMagnitude ?? 5}%`,
        },
        {
          label: "Calibration Speed",
          value: `${hw?.calibrationSpeed ?? 100}%`,
        },
        { label: "Braking Resistor Limit", value: `${hw?.brakingLimit ?? 0}%` },
      ],
    },
    {
      category: "Effects",
      params: [
        { label: "Motion Range", value: `${fx?.motionRange ?? 900}°` },
        {
          label: "Total Effect Strength",
          value: `${fx?.totalEffectStrength ?? 100}%`,
        },
        {
          label: "Integrated Spring",
          value: `${fx?.integratedSpringStrength ?? 0}%`,
          isPro: true,
        },
        {
          label: "Static Dampening",
          value: `${fx?.staticDampeningStrength ?? 0}%`,
        },
        {
          label: "Soft Stop Range",
          value: `${fx?.softStopRange ?? 10}°`,
          isPro: true,
        },
        {
          label: "Soft Stop Strength",
          value: `${fx?.softStopStrength ?? 100}%`,
          isPro: true,
        },
        {
          label: "Soft Stop Dampening",
          value: `${fx?.softStopDampeningStrength ?? 0}%`,
          isPro: true,
        },
      ],
    },
    {
      category: "DirectX Settings",
      params: [
        {
          label: "Invert Constant Force",
          value: fx?.directXConstantDirection === -1 ? "ON" : "OFF",
        },
        {
          label: "Spring Force",
          value: `${fx?.directXSpringStrength ?? 100}%`,
          isPro: true,
        },
        {
          label: "Constant Force",
          value: `${fx?.directXConstantStrength ?? 100}%`,
          isPro: true,
        },
        {
          label: "Periodic Force",
          value: `${fx?.directXPeriodicStrength ?? 100}%`,
          isPro: true,
        },
      ],
    },
  ];

  // For FREE presets: filter out PRO params from each section
  return all
    .map((section) => ({
      ...section,
      params: isPresetPro
        ? section.params
        : section.params.filter((p) => !p.isPro),
    }))
    .filter((s) => s.params.length > 0);
}

export const PresetDetailModal = ({
  isOpen,
  onClose,
  preset,
  onInstall,
  onLike,
}: PresetDetailModalProps) => {
  const [isLiking, setIsLiking] = useState(false);

  if (!isOpen || !preset) return null;

  const isPresetPro = preset.appPreferences?.isPro ?? false;
  const sections = buildSections(preset);
  const gameName = preset.appPreferences?.wheelName || "FFBEAST";

  const handleLike = async () => {
    if (preset.hasLiked || isLiking) return;
    setIsLiking(true);
    await onLike(preset.id);
    setIsLiking(false);
  };

  return (
    <div className="pdm_overlay" onClick={onClose}>
      <div className="pdm_popup_wrapper" onClick={(e) => e.stopPropagation()}>
        <div className="pdm_popup">
          {/* Header */}
          <div className="pdm_header">
            <div className="pdm_title_col">
              <div className="pdm_badges_row">
                <span className="pdm_game_tag">{gameName}</span>
                <span
                  className={`pdm_version_badge ${isPresetPro ? "pro" : "free"}`}
                >
                  {isPresetPro ? "PRO" : "FREE"}
                </span>
              </div>
              <h2 className="pdm_title">{preset.name}</h2>
              <span className="pdm_author">
                by {preset.author ?? "Community"}
              </span>
            </div>
            <button
              className="pdm_close_btn"
              onClick={onClose}
              aria-label="Close"
            >
              <i className="fi fi-rr-cross" />
            </button>
          </div>

          {/* Body: 3-column settings grid */}
          <div className="pdm_body">
            {sections.map((section) => (
              <div key={section.category} className="pdm_section">
                <div className="pdm_section_header">{section.category}</div>
                <div className="pdm_param_list">
                  {section.params.map((p, idx) => {
                    const isLocked = LOCKED_SETTINGS.includes(p.label);
                    return (
                      <div
                        key={idx}
                        className={`pdm_param_row${p.isPro ? " pro" : ""}${isLocked ? " locked" : ""}`}
                      >
                        <span className="pdm_param_label">
                          {p.label}
                          {p.isPro && (
                            <span className="pdm_pro_micro">PRO</span>
                          )}
                          {isLocked && (
                            <i
                              className="fi fi-sr-lock pdm_lock_icon"
                              title="Locked hardware setting"
                            />
                          )}
                        </span>
                        <span className="pdm_param_value">{p.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="pdm_footer">
            <Button
              variant="primary"
              style={{
                width: "100%",
                height: "45px",
                fontSize: "0.95rem",
                borderRadius: "6px",
              }}
              onClick={() => onInstall(preset)}
            >
              <i className="fi fi-sr-download" style={{ marginRight: "8px" }} />
              Install &amp; Apply Preset
            </Button>
          </div>
        </div>

        {/* Right Sidebar: Interaction & Info */}
        <div className="pdm_sidebar">
          <div className="pdm_sidebar_section stretch">
            <div className="pdm_sidebar_title">Description</div>
            <div className="pdm_description_bubble">
              {preset.description ?? "No description provided for this preset."}
            </div>
          </div>

          <div className="pdm_bottom_group">
            <div className="pdm_sidebar_stats">
              <div className="pdm_stat_item">
                <i className="fi fi-rr-download" />
                <div className="pdm_stat_info">
                  <span className="pdm_stat_val">{preset.installs ?? 0}</span>
                  <span className="pdm_stat_label">Installs</span>
                </div>
              </div>
              <div className="pdm_stat_item">
                <i
                  className={`fi fi-sr-heart${preset.hasLiked ? " active" : ""}`}
                />
                <div className="pdm_stat_info">
                  <span className="pdm_stat_val">{preset.likes ?? 0}</span>
                  <span className="pdm_stat_label">Likes</span>
                </div>
              </div>
            </div>

            <div className="pdm_sidebar_actions">
              <button
                className={`pdm_like_btn${preset.hasLiked ? " liked" : ""}`}
                onClick={handleLike}
                disabled={isLiking || preset.hasLiked}
              >
                <i className={`fi fi-sr-heart${preset.hasLiked ? "" : ""}`} />
                {isLiking
                  ? "Thinking..."
                  : preset.hasLiked
                    ? "Liked"
                    : "Like This Preset"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
