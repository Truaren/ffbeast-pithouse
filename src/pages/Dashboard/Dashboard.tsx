import "./style.scss";

import { SettingField } from "@shubham0x13/ffbeast-wheel-webhid-api";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { Button, Slider, ToggleSwitch } from "@/components/ui";
import { useGamepads } from "@/hooks/use-gamepads";
import { useSettingUI } from "@/hooks/use-setting-ui";
import {
  useAppPreferencesStore,
  useDeviceSettingsStore,
  useWheelStore,
} from "@/stores";

const LinearSteeringGauge = ({
  currentAngle,
  maxAngle,
}: {
  currentAngle: number;
  maxAngle: number;
}) => {
  // Visual max width caps at 1080 for styling purposes, but logically works for any angle
  const visualMax = Math.min(Math.max(maxAngle, 90), 1080);
  const widthPct = (visualMax / 1080) * 100;

  const halfRange = maxAngle / 2;
  const clampedAngle = Math.max(-halfRange, Math.min(halfRange, currentAngle));
  // 0 -> 50%, -halfRange -> 0%, halfRange -> 100%
  const pointerPct = ((clampedAngle + halfRange) / maxAngle) * 100;

  // Calculate the filled region from the center (50%) to pointerPct
  const fillLeft = Math.min(50, pointerPct);
  const fillWidth = Math.abs(pointerPct - 50);

  return (
    <div className="steering_gauge_container">
      <div
        className="steering_gauge_track"
        style={{
          width: `${widthPct}%`,
          maxWidth: "400px",
        }}
      >
        <div className="steering_gauge_tic tic_25" />
        <div className="steering_gauge_tic tic_75" />
        <div className="steering_gauge_center" />

        <div
          className="steering_gauge_fill animated-gradient-fill"
          style={{
            left: `${fillLeft}%`,
            width: `${fillWidth}%`,
          }}
        />

        <div
          className="steering_gauge_pointer"
          style={{
            left: `${pointerPct}%`,
          }}
        />
      </div>
    </div>
  );
};

const CompactTorqueMeter = ({
  torque,
  powerLimit,
}: {
  torque: number;
  powerLimit: number;
}) => {
  // Scaling: 10000 = 100% in the firmware API
  const torquePercentRaw = (Math.abs(torque) / 10000) * 100;
  const pct = Math.min(100, torquePercentRaw);

  // Motor max: 15 Nm
  const MOTOR_MAX_NM = 15;
  const actualMaxNm = (powerLimit / 100) * MOTOR_MAX_NM;
  const nmEst = ((pct / 100) * actualMaxNm).toFixed(2);

  return (
    <div className="dashboard_torque_meter">
      <div className="torque_label_row">
        <span className="torque_title">Output Torque</span>
      </div>

      <div className="torque_slider_row">
        <div className="torque_track_container">
          <div className="torque_track">
            <div
              className="torque_fill"
              style={{
                width: `${pct}%`,
                background: "var(--accent)",
                transition: "width 0.1s ease-out",
              }}
            />
          </div>
        </div>
        <span className="torque_percent">{pct.toFixed(0)} %</span>
      </div>

      <div className="torque_footer_row">
        <span className="torque_nm_value">{nmEst} Nm</span>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const { api, positionDegrees, deviceId, torque } = useWheelStore(
    useShallow((state) => ({
      api: state.api,
      positionDegrees: state.deviceState?.positionDegrees ?? 0,
      deviceId: state.deviceId,
      torque: state.deviceState?.torque ?? 0,
    })),
  );

  const {
    wheelName,
    wheelImageUrl,
    baseName,
    baseImageUrl,
    pedalName: rawPedalName,
    pedalImageUrl,
    hiddenPedals: rawHiddenPedals,
    invertedPedals: rawInvertedPedals,
    pedalBindings: rawPedalBindings,
    setWheelImage,
    setWheelName,
    setBaseImage,
    setBaseName,
    setPedalName,
    setPedalImage,
    togglePedalVisibility,
    togglePedalInversion,
    setPedalBinding,
  } = useAppPreferencesStore(
    useShallow((state) => ({
      wheelName: state.preferences.wheelName,
      wheelImageUrl: state.preferences.wheelImageUrl,
      baseName: state.preferences.baseName,
      baseImageUrl: state.preferences.baseImageUrl,
      pedalName: state.preferences.pedalName,
      pedalImageUrl: state.preferences.pedalImageUrl,
      hiddenPedals: state.preferences.hiddenPedals,
      invertedPedals: state.preferences.invertedPedals,
      pedalBindings: state.preferences.pedalBindings,
      setWheelImage: state.setWheelImage,
      setWheelName: state.setWheelName,
      setBaseImage: state.setBaseImage,
      setBaseName: state.setBaseName,
      setPedalName: state.setPedalName,
      setPedalImage: state.setPedalImage,
      togglePedalVisibility: state.togglePedalVisibility,
      togglePedalInversion: state.togglePedalInversion,
      setPedalBinding: state.setPedalBinding,
    })),
  );

  const pedalName = rawPedalName || "Feel VR Pedals";
  const hiddenPedals = rawHiddenPedals || [];
  const invertedPedals = rawInvertedPedals || [];
  const pedalBindings = rawPedalBindings || {
    Throttle: 0,
    Brake: 1,
    Clutch: 2,
  };

  const safeWheelName = wheelName?.trim() || "Steering Wheel";
  const safeBaseName = baseName?.trim() || "R12 Base";
  const safePedalName = pedalName?.trim() || "Feel VR Pedals";

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempWheelName, setTempWheelName] = useState("");

  const [isEditingBaseName, setIsEditingBaseName] = useState(false);
  const [tempBaseName, setTempBaseName] = useState("");

  const [isEditingPedalName, setIsEditingPedalName] = useState(false);
  const [tempPedalName, setTempPedalName] = useState("");

  const [bindingPedal, setBindingPedal] = useState<
    "Throttle" | "Brake" | "Clutch" | null
  >(null);

  const [tempMaxAngle, setTempMaxAngle] = useState<string>("");

  const { effects, hardware } = useDeviceSettingsStore(
    useShallow((state) => ({
      effects: state.settings.effects,
      hardware: state.settings.hardware,
    })),
  );

  const setSetting = useSettingUI();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWheelImage(file)
      .then(() => toast.success("Wheel image updated."))
      .catch((error) =>
        toast.error(
          "Failed to update wheel image: " + (error as Error).message,
        ),
      );
  };

  const handleBaseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBaseImage(file)
      .then(() => toast.success("Base image updated."))
      .catch((error) =>
        toast.error("Failed to update base image: " + (error as Error).message),
      );
  };

  const handlePedalImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPedalImage(file)
      .then(() => toast.success("Pedal image updated."))
      .catch((error) =>
        toast.error(
          "Failed to update pedal image: " + (error as Error).message,
        ),
      );
  };

  const handleCenter = () => {
    api.resetWheelCenter().catch(console.error);
    toast.info("Wheel centered successfully.");
  };

  const startEditingName = () => {
    setTempWheelName(safeWheelName);
    setIsEditingName(true);
  };

  const saveWheelName = () => {
    if (tempWheelName.trim() !== "") {
      setWheelName(tempWheelName.trim());
    }
    setIsEditingName(false);
  };

  const startEditingBaseName = () => {
    setTempBaseName(safeBaseName);
    setIsEditingBaseName(true);
  };

  const saveBaseName = () => {
    if (tempBaseName.trim() !== "") {
      setBaseName(tempBaseName.trim());
    }
    setIsEditingBaseName(false);
  };

  const startEditingPedalName = () => {
    setTempPedalName(safePedalName);
    setIsEditingPedalName(true);
  };

  const savePedalName = () => {
    if (tempPedalName.trim() !== "") {
      setPedalName(tempPedalName.trim());
    }
    setIsEditingPedalName(false);
  };

  const gamepads = useGamepads();
  const allPads = Object.values(gamepads);

  useEffect(() => {
    console.log(
      "Connected Gamepads:",
      allPads.map((p) => p.id),
    );
  }, [allPads]);

  // Binding effect: use an interval polling navigator.getGamepads() directly
  // This is more reliable than relying on the useGamepads hook's state update cycle
  useEffect(() => {
    if (!bindingPedal) return;

    let baseline: Record<string, number[]> = {};
    let isFirstFrame = true;

    const intervalId = setInterval(() => {
      const rawGamepads = navigator.getGamepads
        ? Array.from(navigator.getGamepads()).filter(Boolean)
        : [];

      if (isFirstFrame) {
        // Take baseline snapshot on first frame
        for (const gp of rawGamepads) {
          if (gp) baseline[gp.id] = Array.from(gp.axes);
        }
        isFirstFrame = false;
        return;
      }

      for (const gp of rawGamepads) {
        if (!gp) continue;
        const base = baseline[gp.id];
        if (!base) {
          // New device: take its baseline too
          baseline[gp.id] = Array.from(gp.axes);
          continue;
        }

        for (let i = 0; i < gp.axes.length; i++) {
          const baselineValue = base[i];
          const currentValue = gp.axes[i];

          if (Math.abs(currentValue - baselineValue) > 0.15) {
            console.log(
              `[Bind] Detected movement on ${gp.id} axis ${i}. Baseline: ${baselineValue}, Current: ${currentValue}`,
            );

            clearInterval(intervalId);

            try {
              const boundPedal = bindingPedal;
              setBindingPedal(null);
              baseline = {};
              useAppPreferencesStore.getState().setPedalDeviceId(gp.id);
              setPedalBinding(boundPedal, i);
              toast.success(`${boundPedal} bound to Axis ${i}`);
            } catch (err) {
              console.error("CRASH DURING BINDING:", err);
            }
            return;
          }
        }
      }
    }, 50); // poll every 50ms (20 times per second)

    return () => clearInterval(intervalId);
  }, [bindingPedal, setPedalBinding]);

  const startBinding = (pedal: "Throttle" | "Brake" | "Clutch") => {
    console.log(`[Bind] Starting binding for ${pedal}`);
    setBindingPedal(pedal);
  };

  const cancelBinding = () => {
    setBindingPedal(null);
  };

  // The active pad for UI is now determined ONLY by the user's saved device ID,
  // or fallback to 'feel vr'. We no longer fallback to any random gamepad.
  const pedalDeviceId =
    useAppPreferencesStore.getState().preferences.pedalDeviceId;
  const isPedalBound = Boolean(pedalDeviceId);

  const activePad = pedalDeviceId
    ? allPads.find((p) => p.id === pedalDeviceId)
    : allPads.find((p) => p.id.toLowerCase().includes("feel vr"));

  const getAxisPct = (axisIndex: number | undefined, pedalType: string) => {
    if (axisIndex === undefined || axisIndex === null) return 0;
    if (!activePad || activePad.axes.length <= axisIndex) return 0;
    const raw = activePad.axes[axisIndex]; // usually -1 to 1
    // Convert -1..1 to 0..100
    let pct = Math.max(0, Math.min(100, ((raw + 1) / 2) * 100));

    const isInverted = Array.isArray(invertedPedals)
      ? invertedPedals.includes(pedalType)
      : false;
    if (isInverted) {
      pct = 100 - pct;
    }

    return pct;
  };

  const throttleVal = getAxisPct(pedalBindings?.Throttle ?? 0, "Throttle");
  const brakeVal = getAxisPct(pedalBindings?.Brake ?? 1, "Brake");
  const clutchVal = getAxisPct(pedalBindings?.Clutch ?? 2, "Clutch");

  return (
    <div className="moza_dashboard">
      {/* LEFT PANEL - STEERING WHEEL */}
      <div className="panel wheel_panel">
        <div className="panel_header">
          {isEditingName ? (
            <input
              className="wheel_name_input"
              value={tempWheelName}
              onChange={(e) => setTempWheelName(e.target.value)}
              onBlur={saveWheelName}
              onKeyDown={(e) => e.key === "Enter" && saveWheelName()}
              autoFocus
            />
          ) : (
            <h2
              onClick={startEditingName}
              className="wheel_name_display"
              title="Click to rename"
            >
              {safeWheelName}
            </h2>
          )}
        </div>

        <div className="angle_display">
          <span className="angle_value">{Math.round(positionDegrees)}°</span>
        </div>

        <LinearSteeringGauge
          currentAngle={positionDegrees}
          maxAngle={effects.motionRange}
        />

        <div className="wheel_image_container">
          <div className="wheel_img_wrapper">
            <img
              src={wheelImageUrl}
              alt="Steering Wheel"
              className="wheel_img"
              style={{ transform: `rotate(${positionDegrees}deg)` }}
            />
            <label className="upload_overlay">
              <i className="icon fi fi-rr-shuffle"></i>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          </div>
        </div>

        <div className="angle_controls">
          <div className="angle_slider_header">
            <span className="angle_label">Maximum Steering Angle</span>
            <Button
              variant="primary"
              className="center_btn"
              onClick={handleCenter}
            >
              Center
            </Button>
            <i className="icon fi fi-rr-info tooltip_icon"></i>
          </div>

          <div className="angle_slider_row">
            <span className="angle_min">90</span>
            <div className="slider_wrapper">
              <Slider
                value={effects.motionRange}
                min={90}
                max={2700}
                hideLabel
                onValueChange={(v) => setTempMaxAngle(v.toString())}
                onValueCommit={(v) => {
                  void setSetting(SettingField.MotionRange, v);
                  setTempMaxAngle("");
                }}
              />
            </div>
            <span className="angle_max">2700</span>
            <input
              type="number"
              className="angle_input_box"
              value={tempMaxAngle || effects.motionRange}
              onChange={(e) => setTempMaxAngle(e.target.value)}
              onBlur={() => {
                let val = parseInt(tempMaxAngle);
                if (!isNaN(val)) {
                  val = Math.max(90, Math.min(2700, val));
                  void setSetting(SettingField.MotionRange, val);
                }
                setTempMaxAngle("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  let val = parseInt(tempMaxAngle);
                  if (!isNaN(val)) {
                    val = Math.max(90, Math.min(2700, val));
                    void setSetting(SettingField.MotionRange, val);
                  }
                  setTempMaxAngle("");
                }
              }}
            />
          </div>

          <div className="angle_presets">
            {[360, 540, 720, 900].map((angle) => (
              <button
                key={angle}
                className={`preset_btn ${effects.motionRange === angle ? "active" : ""}`}
                onClick={() => {
                  void setSetting(SettingField.MotionRange, angle);
                }}
              >
                {angle}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="right_column">
        {/* TOP RIGHT PANEL - BASE */}
        <div className="panel base_panel">
          <div className="panel_header">
            {isEditingBaseName ? (
              <input
                className="base_name_input"
                value={tempBaseName}
                onChange={(e) => setTempBaseName(e.target.value)}
                onBlur={saveBaseName}
                onKeyDown={(e) => e.key === "Enter" && saveBaseName()}
                autoFocus
              />
            ) : (
              <h2
                onClick={startEditingBaseName}
                className="base_name_display"
                title="Click to rename"
              >
                {safeBaseName}
              </h2>
            )}
          </div>

          <div className="base_content">
            <div className="base_image_placeholder">
              {baseImageUrl ? (
                <img src={baseImageUrl} alt="Base" className="base_img" />
              ) : (
                <i className="icon fi fi-rr-computer base_icon_placeholder" />
              )}
              <label className="upload_overlay">
                <i className="icon fi fi-rr-shuffle"></i>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBaseImageChange}
                />
              </label>
            </div>

            <div
              className={`base_controls ${hardware.forceEnabled === 0 ? "disabled_look" : ""}`}
            >
              <span className="control_label">
                Game Force Feedback Intensity
              </span>
              <div className="slider_with_value">
                <div style={{ flex: 1 }}>
                  <Slider
                    value={effects.totalEffectStrength}
                    min={0}
                    max={100}
                    hideLabel
                    onValueChange={(v) =>
                      setSetting(SettingField.TotalEffectStrength, v)
                    }
                    onValueCommit={(v) => {
                      void setSetting(SettingField.TotalEffectStrength, v);
                    }}
                  />
                </div>
                <span className="slider_percent">
                  {effects.totalEffectStrength} %
                </span>
              </div>

              <CompactTorqueMeter
                torque={torque}
                powerLimit={hardware.powerLimit}
              />

              <div className="work_mode_toggle">
                <ToggleSwitch
                  label="Work Mode"
                  checked={hardware.forceEnabled === 1}
                  onToggle={async (checked) => {
                    await setSetting(
                      SettingField.ForceEnabled,
                      checked ? 1 : 0,
                    );
                  }}
                />
              </div>
            </div>
          </div>
          <div className="base_footer">
            <span>Device ID: {deviceId ?? "Disconnected"}</span>
          </div>
        </div>

        {/* BOTTOM RIGHT PANEL - PEDALS */}
        <div className="panel pedals_panel">
          <div className="panel_header">
            {isEditingPedalName ? (
              <input
                className="pedal_name_input"
                value={tempPedalName}
                onChange={(e) => setTempPedalName(e.target.value)}
                onBlur={savePedalName}
                onKeyDown={(e) => e.key === "Enter" && savePedalName()}
                autoFocus
              />
            ) : (
              <h2
                onClick={startEditingPedalName}
                className="pedal_name_display"
                title="Click to rename"
              >
                {safePedalName}
              </h2>
            )}
          </div>

          <div className="pedals_content">
            <div className="pedals_image_container">
              <div className="pedals_image_placeholder">
                {pedalImageUrl ? (
                  <img src={pedalImageUrl} alt="Pedals" className="pedal_img" />
                ) : (
                  <i className="icon fi fi-sr-box-open pedal_icon_placeholder" />
                )}
                <label className="upload_overlay">
                  <i className="icon fi fi-rr-shuffle"></i>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePedalImageChange}
                  />
                </label>
              </div>
              <div className="pedal_status_text">
                {activePad ? (
                  <span className="status connected">
                    <i className="icon fi fi-sr-bullet"></i> Connected
                  </span>
                ) : (
                  <span className="status disconnected">
                    <i className="icon fi fi-sr-bullet"></i>{" "}
                    {isPedalBound ? "Disconnected" : "Not Bound"}
                  </span>
                )}
              </div>
            </div>

            <div className="pedals_sliders">
              {(["Throttle", "Brake", "Clutch"] as const).map((pedal) => {
                let val = 0;
                if (pedal === "Throttle") val = throttleVal;
                if (pedal === "Brake") val = brakeVal;
                if (pedal === "Clutch") val = clutchVal;

                const isBindingThis = bindingPedal === pedal;
                // Safe includes check in case hiddenPedals is somehow still undefined
                const isHidden = Array.isArray(hiddenPedals)
                  ? hiddenPedals.includes(pedal)
                  : false;

                return (
                  <div
                    key={pedal}
                    className={`pedal_row ${isHidden ? "hidden_pedal" : ""}`}
                  >
                    <div className="pedal_label_container">
                      <span className="pedal_label">
                        {pedal}{" "}
                        {activePad &&
                          !isBindingThis &&
                          !isHidden &&
                          `(${Math.round(val)}%)`}
                      </span>
                      <div style={{ display: "flex", gap: "0.25rem" }}>
                        {!isHidden && (
                          <button
                            className="hide_pedal_btn"
                            onClick={() => togglePedalInversion(pedal)}
                            title="Invert Pedal Input"
                          >
                            <i
                              className={
                                Array.isArray(invertedPedals) &&
                                invertedPedals.includes(pedal)
                                  ? "icon fi fi-rr-arrows-repeat"
                                  : "icon fi fi-rr-arrows-h"
                              }
                            ></i>
                          </button>
                        )}
                        <button
                          className="hide_pedal_btn"
                          onClick={() => togglePedalVisibility(pedal)}
                          title={isHidden ? "Show Pedal" : "Hide Pedal"}
                        >
                          <i
                            className={
                              isHidden
                                ? "icon fi fi-rr-eye-crossed"
                                : "icon fi fi-rr-eye"
                            }
                          ></i>
                        </button>
                      </div>
                    </div>

                    {!isHidden && (
                      <div className="pedal_control">
                        {isBindingThis ? (
                          <div
                            className="binding_message"
                            onClick={cancelBinding}
                          >
                            Press pedal or click to cancel...
                          </div>
                        ) : (
                          <>
                            <button
                              className={`btn_bind ${!activePad ? "disabled" : ""}`}
                              onClick={() => startBinding(pedal)}
                            >
                              Bind
                            </button>
                            <div
                              className={`progress_track ${!activePad ? "disabled" : ""}`}
                              style={{ opacity: activePad ? 1 : 0.5 }}
                            >
                              <div
                                className="progress_fill"
                                style={{
                                  width: `${activePad ? val : 0}%`,
                                  transition: "none",
                                }}
                              ></div>
                            </div>
                            <button
                              className={`limit_btn ${!activePad ? "disabled" : ""}`}
                            >
                              set max
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
