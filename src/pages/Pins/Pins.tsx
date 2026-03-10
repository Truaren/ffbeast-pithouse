import "./style.scss";

import { SettingField } from "@shubham0x13/ffbeast-wheel-webhid-api";
import { useShallow } from "zustand/react/shallow";

import { useSettingUI } from "@/hooks/use-setting-ui";
import { useDeviceSettingsStore } from "@/stores";

const PIN_MODES = [
  { value: 0, label: "None" },
  { value: 1, label: "GPIO — Button Input" },
  { value: 2, label: "Analog — Axis Input" },
  { value: 3, label: "SPI CS — Chip Select" },
  { value: 4, label: "SPI SCK — Clock" },
  { value: 5, label: "SPI MISO — Data In" },
  { value: 6, label: "Enable Effects" },
  { value: 7, label: "Center Reset" },
  { value: 8, label: "Braking PWM" },
  { value: 9, label: "Effect LED" },
  { value: 10, label: "Reboot" },
];

const PIN_DESCRIPTIONS: Record<number, string> = {
  0: "Pin is not used.",
  1: "Digital button — reads HIGH/LOW and maps to a joystick button.",
  2: "Analog axis — reads ADC voltage and maps to an axis (configure in Axes tab).",
  3: "SPI Chip Select — used in SPI extension modes (configure in Protocol tab).",
  4: "SPI Clock — provides the SPI clock signal.",
  5: "SPI MISO — receives data from the shift register chain.",
  6: "Enable Effects — a HIGH signal on this pin enables FFB output.",
  7: "Center Reset — a HIGH signal triggers wheel re-center.",
  8: "Braking PWM — outputs PWM signal for regenerative braking resistor.",
  9: "Effect LED — outputs PWM proportional to current FFB torque.",
  10: "Reboot — a HIGH signal triggers device reboot.",
};

export const Pins = () => {
  const { gpio } = useDeviceSettingsStore(
    useShallow((s) => ({ gpio: s.settings.gpio })),
  );
  const setSetting = useSettingUI();

  const pinModes =
    gpio.pinMode?.length >= 10 ? gpio.pinMode : new Array<number>(10).fill(0);

  const handleModeChange = async (pinIndex: number, value: number) => {
    await setSetting(SettingField.PinMode, value, pinIndex);
  };

  return (
    <div className="pins_page">
      <div className="pins_header_note">
        <i className="icon fi fi-sr-info" />
        <span>
          Assign function to each GPIO pin. Configure the SPI protocol in the{" "}
          <strong>Protocol</strong> tab, and analog axes in the{" "}
          <strong>Axes</strong> tab.
        </span>
      </div>

      <div className="pins_grid">
        {pinModes.map((mode, index) => (
          <div key={index} className="pin_card">
            <div className="pin_card_top">
              <span className="pin_badge">Pin {index}</span>
              <span className={`pin_status_dot ${mode > 0 ? "active" : ""}`} />
            </div>
            <select
              className="pin_select"
              value={mode}
              onChange={(e) =>
                void handleModeChange(index, Number(e.target.value))
              }
            >
              {PIN_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <p className="pin_desc">{PIN_DESCRIPTIONS[mode] ?? ""}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
