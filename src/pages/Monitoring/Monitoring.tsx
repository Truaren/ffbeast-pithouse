import "./style.scss";

import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

import { useGamepads } from "@/hooks/use-gamepads";
import { useDeviceSettingsStore, useWheelStore } from "@/stores";

// ─── Analog Inputs Section ───────────────────────────────────────────────────

const AnalogInputs = () => {
  const gamepads = useGamepads();
  const allPads = Object.values(gamepads);
  const pad = allPads[0];

  const axes = pad?.axes ?? [];

  return (
    <div className="mon_card mon_card_analog">
      <div className="mon_card_header">
        <i className="icon fi fi-sr-arrows-alt-h" />
        <h2>Analog Inputs</h2>
        <span className="mon_badge">{axes.length} axes</span>
      </div>
      <div className="mon_card_body">
        {axes.length === 0 ? (
          <p className="mon_empty">No gamepad connected.</p>
        ) : (
          <div className="mon_axes_list">
            {axes.map((val, i) => {
              const pct = ((val + 1) / 2) * 100;
              return (
                <div key={i} className="mon_axis_row">
                  <span className="mon_axis_label">Axis {i}</span>
                  <div className="mon_axis_track">
                    <div className="mon_axis_fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="mon_axis_value">{pct.toFixed(1)}%</span>
                  <span className="mon_axis_raw">({val.toFixed(4)})</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Digital Buttons Grid ─────────────────────────────────────────────────────

const DigitalButtons = () => {
  const gamepads = useGamepads();
  const allPads = Object.values(gamepads);
  const pad = allPads[0];
  const buttons = pad?.buttons ?? [];

  return (
    <div className="mon_card mon_card_digital">
      <div className="mon_card_header">
        <i className="icon fi fi-sr-menu-dots" />
        <h2>Digital Buttons</h2>
        <span className="mon_badge">
          {buttons.filter(b => b.pressed).length} pressed
        </span>
      </div>
      <div className="mon_card_body">
        {buttons.length === 0 ? (
          <p className="mon_empty">No gamepad connected.</p>
        ) : (
          <div className="mon_buttons_grid">
            {buttons.map((btn, i) => (
              <div
                key={i}
                className={`mon_btn_indicator ${btn.pressed ? "pressed" : ""}`}
                title={`Button ${i + 1}`}
              >
                <span className="mon_btn_num">{i + 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Torque Monitor ───────────────────────────────────────────────────────────

const TorqueMonitor = () => {
  const deviceState = useWheelStore((s) => s.deviceState);
  const powerLimit = useDeviceSettingsStore((s) => s.settings.hardware.powerLimit);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<number[]>(new Array<number>(200).fill(0));

  const rawTorque = deviceState?.torque ?? 0;
  // Scaling: 10000 = 100%
  const torquePercentRaw = (Math.abs(rawTorque) / 10000) * 100;
  const pct = Math.min(100, torquePercentRaw);
  
  // Nm estimation: powerLimit % of 15Nm
  const MOTOR_MAX_NM = 15;
  const actualMaxNm = (powerLimit / 100) * MOTOR_MAX_NM;
  const nmEst = ((pct / 100) * actualMaxNm).toFixed(2);
  const direction = rawTorque >= 0 ? "Right →" : "← Left";

  useEffect(() => {
    // Normalizing history for canvas: rawTorque / 10000
    const normalized = rawTorque / 10000;
    historyRef.current.push(normalized);
    if (historyRef.current.length > 200) historyRef.current.shift();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(128,128,128,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#ef4444");
    grad.addColorStop(0.5, "#22c55e");
    grad.addColorStop(1, "#3b82f6");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const data = historyRef.current;
    for (let i = 0; i < data.length; i++) {
      const x = (i / data.length) * w;
      const y = h / 2 - (data[i] * h) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [rawTorque]);

  return (
    <div className="mon_card mon_card_torque">
      <div className="mon_card_header">
        <i className="icon fi fi-sr-sensor-alert" />
        <h2>Output Torque Monitor</h2>
        <span className={`mon_badge ${deviceState ? "live" : ""}`}>
          {deviceState ? "Live" : "No Device"}
        </span>
      </div>
      <div className="mon_card_body">
        <div className="mon_torque_readout">
          <span className="mon_torque_val">{pct.toFixed(1)}<span className="mon_torque_unit">%</span></span>
          <span className="mon_torque_sub">~{nmEst} Nm · {direction}</span>
        </div>
        <div className="mon_torque_bar_track">
          <div
            className="mon_torque_fill"
            style={{
              width: `${pct}%`,
              background: rawTorque >= 0
                ? "linear-gradient(90deg, #f97316, #ef4444)"
                : "linear-gradient(90deg, #3b82f6, #60a5fa)",
              marginLeft: rawTorque >= 0 ? "50%" : `calc(50% - ${pct}%)`,
              transition: 'width 0.1s ease-out, margin-left 0.1s ease-out'
            }}
          />
          <div className="mon_torque_center" />
        </div>
        <canvas ref={canvasRef} className="mon_canvas" width={640} height={50} />
      </div>
    </div>
  );
};

// ─── Monitoring Page ──────────────────────────────────────────────────────────

export const Monitoring = () => {
  const { isConnected } = useWheelStore(
    useShallow((s) => ({ isConnected: s.isConnected }))
  );

  return (
    <div className="monitoring_page">
      {!isConnected && (
        <div className="mon_banner">
          <i className="icon fi fi-sr-triangle-warning" />
          Device disconnected — torque data unavailable. Gamepad input still shown.
        </div>
      )}
      <div className="mon_content_grid">
        <AnalogInputs />
        <DigitalButtons />
        <TorqueMonitor />
      </div>
    </div>
  );
};
