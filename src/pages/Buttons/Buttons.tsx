import { SettingField } from "@shubham0x13/ffbeast-wheel-webhid-api";
import { useShallow } from "zustand/react/shallow";

import { useSettingUI } from "@/hooks/use-setting-ui";
import { useDeviceSettingsStore } from "@/stores";

import "./style.scss";

const BUTTON_MODES = [
  { value: 0, label: "None" },
  { value: 1, label: "Normal" },
  { value: 2, label: "Inverted" },
  { value: 3, label: "Pulse" },
];

const MODE_COLORS: Record<number, string> = {
  0: "",
  1: "btn_mode_normal",
  2: "btn_mode_inverted",
  3: "btn_mode_pulse",
};

export const Buttons = () => {
  const { gpio } = useDeviceSettingsStore(useShallow((s) => ({ gpio: s.settings.gpio })));
  const setSetting = useSettingUI();

  const buttonModes = gpio.buttonMode?.length >= 32
    ? gpio.buttonMode
    : new Array<number>(32).fill(0);

  const handleModeChange = async (btnIndex: number, value: number) => {
    await setSetting(SettingField.ButtonMode, value, btnIndex);
  };

  return (
    <div className="buttons_page">
      <div className="buttons_header_note">
        <i className="icon fi fi-sr-info" />
        <span>Configure the mode for each of the 32 joystick buttons. <strong>None</strong> = disabled, <strong>Normal</strong> = active high, <strong>Inverted</strong> = active low, <strong>Pulse</strong> = momentary.</span>
      </div>

      <div className="buttons_grid">
        {buttonModes.map((mode, index) => (
          <div key={index} className={`btn_card ${MODE_COLORS[mode] ?? ""}`}>
            <span className="btn_number">B{index + 1}</span>
            <select
              className="btn_select"
              value={mode}
              onChange={(e) => void handleModeChange(index, Number(e.target.value))}
            >
              {BUTTON_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};
