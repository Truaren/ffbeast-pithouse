import "./style.scss";

import { SettingField } from "@shubham0x13/ffbeast-wheel-webhid-api";
import { useShallow } from "zustand/react/shallow";

import { Slider, ToggleSwitch } from "@/components/ui";
import { useGamepads } from "@/hooks/use-gamepads";
import { useSettingUI } from "@/hooks/use-setting-ui";
import { useDeviceSettingsStore } from "@/stores";

const AXIS_LABELS = ["Rx — Rotation X", "Ry — Rotation Y", "Rz — Rotation Z"];

export const Axes = () => {
  const { adc } = useDeviceSettingsStore(
    useShallow((s) => ({ adc: s.settings.adc })),
  );
  const setSetting = useSettingUI();
  const gamepads = useGamepads();
  const allPads = Object.values(gamepads);
  const firstPad = allPads[0];

  const getAxisValue = (index: number): number => {
    if (!firstPad || firstPad.axes.length <= index + 3) return 0;
    // Axes Rx/Ry/Rz are usually axes 3,4,5 on a joystick type device
    // But for steering wheel they're typically 0,1,2
    const raw = firstPad.axes[index] ?? 0;
    return ((raw + 1) / 2) * 100; // -1..1 → 0..100%
  };

  return (
    <div className="axes_page">
      <div className="axes_header_note">
        <i className="icon fi fi-sr-info" />
        <span>
          Configure analog axis calibration and button trigger thresholds.
          Enable Analog pins in the <strong>Pins</strong> tab first.
        </span>
      </div>

      <div className="axes_list">
        {[0, 1, 2].map((index) => {
          const min = adc.rAxisMin?.[index] ?? 0;
          const max = adc.rAxisMax?.[index] ?? 100;
          const smoothing = adc.rAxisSmoothing?.[index] ?? 0;
          const invert = (adc.rAxisInvert?.[index] ?? 0) === 1;
          const btnLow = adc.rAxisToButtonLow?.[index] ?? 0;
          const btnHigh = adc.rAxisToButtonHigh?.[index] ?? 100;
          const liveVal = getAxisValue(index);

          return (
            <div key={index} className="axis_card">
              <div className="axis_card_header">
                <i className="icon fi fi-sr-arrows-alt-h" />
                <h3>{AXIS_LABELS[index]}</h3>
                <span className="axis_live_pct">{liveVal.toFixed(1)}%</span>
              </div>

              {/* Live bar */}
              <div className="axis_bar_track">
                <div
                  className="axis_bar_fill"
                  style={{ width: `${liveVal}%` }}
                />
                {btnLow > 0 && (
                  <div
                    className="axis_threshold low"
                    style={{ left: `${btnLow}%` }}
                    title={`Button Low: ${btnLow}%`}
                  />
                )}
                {btnHigh < 100 && (
                  <div
                    className="axis_threshold high"
                    style={{ left: `${btnHigh}%` }}
                    title={`Button High: ${btnHigh}%`}
                  />
                )}
              </div>

              <div className="axis_settings">
                <div className="axis_row_two">
                  <Slider
                    label="Min Deadzone (%)"
                    value={min}
                    onValueCommit={(v) =>
                      void setSetting(SettingField.AdcMinDeadZone, v, index)
                    }
                    infoPanelProps={{
                      description:
                        "Input values below this percentage are treated as 0 (resting position).",
                      impact:
                        "Helps eliminate noise at the low end of the axis travel.",
                    }}
                  />
                  <Slider
                    label="Max Deadzone (%)"
                    value={max}
                    onValueCommit={(v) =>
                      void setSetting(SettingField.AdcMaxDeadZone, v, index)
                    }
                    infoPanelProps={{
                      description:
                        "Input values above this percentage are treated as 100% (full travel).",
                      impact:
                        "Helps reach true 100% output before physical endstop.",
                    }}
                  />
                </div>
                <div className="axis_row_two">
                  <Slider
                    isPro
                    label="Smoothing (%)"
                    value={smoothing}
                    onValueCommit={(v) =>
                      void setSetting(SettingField.AdcSmoothing, v, index)
                    }
                    infoPanelProps={{
                      description:
                        "Low-pass filter strength applied to the analog reading.",
                      impact:
                        "Reduces jitter at the cost of slight response lag.",
                    }}
                  />
                  <div className="axis_invert_wrap">
                    <ToggleSwitch
                      label="Invert Axis"
                      checked={invert}
                      onToggle={(checked) =>
                        void setSetting(
                          SettingField.AdcInvert,
                          checked ? 1 : 0,
                          index,
                        )
                      }
                    />
                  </div>
                </div>
                <div className="axis_row_two">
                  <Slider
                    label="Button Trigger Low (%)"
                    value={btnLow}
                    onValueCommit={(v) =>
                      void setSetting(SettingField.AdcToButtonLow, v, index)
                    }
                    infoPanelProps={{
                      description:
                        "Axis position (%) at which a 'low threshold' button press is triggered.",
                      impact:
                        "Set to 0 to disable. Useful for pedal bite-point buttons.",
                    }}
                  />
                  <Slider
                    label="Button Trigger High (%)"
                    value={btnHigh}
                    onValueCommit={(v) =>
                      void setSetting(SettingField.AdcToButtonHigh, v, index)
                    }
                    infoPanelProps={{
                      description:
                        "Axis position (%) at which a 'high threshold' button press is triggered.",
                      impact: "Set to 100 to disable.",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
