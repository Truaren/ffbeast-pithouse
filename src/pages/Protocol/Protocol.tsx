import "./style.scss";

import { SettingField } from "@shubham0x13/ffbeast-wheel-webhid-api";
import { useShallow } from "zustand/react/shallow";

import { Slider } from "@/components/ui";
import { useSettingUI } from "@/hooks/use-setting-ui";
import { useDeviceSettingsStore } from "@/stores";

const EXTENSION_MODES = [
  { value: 0, label: "None — No extension" },
  { value: 1, label: "Custom SPI" },
  { value: 2, label: "3× CD4021 (shift registers)" },
  { value: 3, label: "3× SN74HC165 (parallel in)" },
  { value: 4, label: "SPI TM (Thrustmaster style)" },
  { value: 5, label: "VPC (Virpil style)" },
] as const;

const SPI_MODES = ["Mode 0", "Mode 1", "Mode 2", "Mode 3"];
const LATCH_MODES = ["Latch UP", "Latch DOWN"];

const PROTOCOL_DOCS: Record<
  string,
  { desc: string; compat: string; config: string; tips: string }
> = {
  none: {
    desc: "No extension connected. The device operates in standalone mode using only its built-in controls.",
    compat: "All FFBeast base configurations without additional button boxes.",
    config: "No additional configuration required.",
    tips: "Select a protocol only if you have external shift registers or button boards connected to the GPIO pins.",
  },
  custom: {
    desc: "Custom SPI protocol with user-defined parameters. Allows full control over SPI timing.",
    compat:
      "Any SPI-capable shift register or button board. Requires correct pin assignments on the Pins tab.",
    config:
      "Set SPI Mode, Latch polarity, and timing delays according to your device's datasheet.",
    tips: "Start with Mode 0, Latch UP, and conservative delays (10µs). Reduce timing once stable.",
  },
  "3xcd4021": {
    desc: "Three cascaded CD4021 parallel-in / serial-out shift registers providing 24 buttons.",
    compat: "CD4021B, HCF4021B, HEF4021B and compatible ICs.",
    config:
      "Connect three CD4021 in series. Assign SPI CS, SCK, and MISO pins in the Pins tab.",
    tips: "Use Latch UP mode. A latch delay of 5–10µs is usually sufficient.",
  },
  "3xsn74hc165": {
    desc: "Three cascaded SN74HC165 parallel-in / serial-out shift registers providing 24 buttons.",
    compat: "SN74HC165, 74HCT165, 74HC165 and compatible ICs.",
    config:
      "Connect three 74HC165 in series. Assign SPI CS, SCK, and MISO pins in the Pins tab.",
    tips: "Use Latch DOWN mode (active low load). SPI Mode 0 is typical.",
  },
  tm: {
    desc: "Thrustmaster-style SPI button protocol. Compatible with HOTAS / button box extensions from Thrustmaster.",
    compat:
      "Thrustmaster Warthog, F/A-18, TRP, and similar joystick accessories.",
    config:
      "Requires SPI CS, SCK, and MISO pin assignments. Use preconfigured timing.",
    tips: "Do not change SPI timing unless instructed. The preset values match TM specification.",
  },
  vpc: {
    desc: "Virpil Controls SPI button protocol. Compatible with VPC MongoosT, WarBRD and button boxes.",
    compat: "Virpil VPC button bases and throttles with SPI output.",
    config: "Assign pins accordingly. Use Mode 0, Latch UP.",
    tips: "VPC devices are hotplug compatible. You can reconnect without rebooting the base.",
  },
};

const detailKeys = ["none", "custom", "3xcd4021", "3xsn74hc165", "tm", "vpc"];

export const Protocol = () => {
  const { gpio } = useDeviceSettingsStore(
    useShallow((s) => ({ gpio: s.settings.gpio })),
  );
  const setSetting = useSettingUI();

  // No local state for extensionMode to avoid cascading renders

  const handleModeChange = async (value: number) => {
    await setSetting(SettingField.ExtensionMode, value);
  };

  const currentExtensionMode = gpio.extensionMode ?? 0;
  const showSPI = currentExtensionMode >= 1 && currentExtensionMode <= 5;
  const docKey = detailKeys[currentExtensionMode] ?? "none";
  const doc = PROTOCOL_DOCS[docKey];
  const modeLabel =
    EXTENSION_MODES.find((m) => m.value === currentExtensionMode)?.label ??
    "None";

  return (
    <div className="protocol_page">
      {/* Extension Mode */}
      <div className="proto_card">
        <div className="proto_card_header">
          <i className="icon fi fi-sr-plug" />
          <h2>Extension Mode</h2>
        </div>
        <div className="proto_card_body">
          <p className="proto_desc">
            Select the button/axis extension protocol for your connected
            hardware.
          </p>
          <div className="proto_select_row">
            <label className="proto_label">Protocol</label>
            <select
              className="proto_select"
              value={currentExtensionMode}
              onChange={(e) => void handleModeChange(Number(e.target.value))}
            >
              {EXTENSION_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SPI Config */}
      {showSPI && (
        <div className="proto_card">
          <div className="proto_card_header">
            <i className="icon fi fi-sr-settings-sliders" />
            <h2>SPI Configuration</h2>
          </div>
          <div className="proto_card_body">
            <div className="proto_grid">
              <div className="proto_field">
                <label className="proto_label">SPI Mode</label>
                <select
                  className="proto_select"
                  value={gpio.spiMode}
                  onChange={(e) =>
                    void setSetting(
                      SettingField.SpiMode,
                      Number(e.target.value),
                    )
                  }
                >
                  {SPI_MODES.map((m, i) => (
                    <option key={i} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="proto_field">
                <label className="proto_label">Latch Mode</label>
                <select
                  className="proto_select"
                  value={gpio.spiLatchMode}
                  onChange={(e) =>
                    void setSetting(
                      SettingField.SpiLatchMode,
                      Number(e.target.value),
                    )
                  }
                >
                  {LATCH_MODES.map((m, i) => (
                    <option key={i} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="proto_sliders">
              <Slider
                label="Latch Delay (µs)"
                value={gpio.spiLatchDelay ?? 5}
                min={0}
                max={50}
                onValueCommit={(v) =>
                  void setSetting(SettingField.SpiLatchDelay, v)
                }
                infoPanelProps={{
                  description:
                    "Time the latch pin is held active before SPI clock starts.",
                  impact:
                    "Increase if your shift register misses the first bit.",
                }}
              />
              <Slider
                label="Clock Pulse Length (µs)"
                value={gpio.spiClkPulseLength ?? 5}
                min={0}
                max={50}
                onValueCommit={(v) =>
                  void setSetting(SettingField.SpiClkPulseLength, v)
                }
                infoPanelProps={{
                  description: "Duration of each SPI clock pulse high state.",
                  impact:
                    "Increase for slower/older ICs. Minimum is usually 1µs.",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Protocol Documentation */}
      <div className="proto_card proto_doc_card">
        <div className="proto_card_header">
          <i className="icon fi fi-sr-book-open" />
          <h2>📘 {modeLabel}</h2>
        </div>
        <div className="proto_card_body proto_doc_body">
          {[
            { title: "Description", text: doc.desc },
            { title: "Compatible Devices", text: doc.compat },
            { title: "Configuration", text: doc.config },
            { title: "💡 Tips", text: doc.tips },
          ].map(({ title, text }) => (
            <div key={title} className="proto_doc_section">
              <h4 className="proto_doc_title">{title}</h4>
              <p className="proto_doc_text">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
