import "./style.scss";

import { SettingField } from "@shubham0x13/ffbeast-wheel-webhid-api";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { Button, Slider, ToggleSwitch } from "@/components/ui";
import { useSettingUI } from "@/hooks/use-setting-ui";
import { useDeviceSettingsStore, useWheelStore } from "@/stores";

// ─── Torque Meter ────────────────────────────────────────────────────────────

const TorqueMeter = () => {
  const deviceState = useWheelStore((s) => s.deviceState);
  const connected = !!deviceState;

  // Raw torque is normalized -1..1, multiply by hardware max torque estimate
  const rawTorque = deviceState?.torque ?? 0; // -1..1
  const pct = Math.abs(rawTorque) * 100;
  const direction = rawTorque >= 0 ? "Right →" : "← Left";
  const nmEstimate = (Math.abs(rawTorque) * 20).toFixed(1); // rough 20Nm max

  // Smoothed history for the graph
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<number[]>(new Array<number>(200).fill(0));

  useEffect(() => {
    historyRef.current.push(rawTorque);
    if (historyRef.current.length > 200) historyRef.current.shift();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "rgba(128,128,128,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Waveform
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
    <div className="exp_card">
      <div className="exp_card_header">
        <i className="icon fi fi-sr-sensor-alert" />
        <h2>Torque Meter</h2>
        <span
          className={`exp_badge ${connected ? "connected" : "disconnected"}`}
        >
          {connected ? "Live" : "No Device"}
        </span>
      </div>
      <div className="exp_card_body">
        {/* Big readout */}
        <div className="torque_readout">
          <div className="torque_value">
            {pct.toFixed(1)}
            <span className="torque_unit">%</span>
          </div>
          <div className="torque_sub">
            ~{nmEstimate} Nm · {direction}
          </div>
        </div>

        {/* Bar */}
        <div className="torque_bar_track">
          <div
            className="torque_bar_fill left"
            style={{
              width: `${rawTorque < 0 ? pct : 0}%`,
              background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
            }}
          />
          <div className="torque_center_tick" />
          <div
            className="torque_bar_fill right"
            style={{
              width: `${rawTorque >= 0 ? pct : 0}%`,
              background: "linear-gradient(90deg, #f97316, #ef4444)",
            }}
          />
        </div>

        {/* Oscilloscope */}
        <canvas
          ref={canvasRef}
          className="torque_canvas"
          width={640}
          height={80}
        />
      </div>
    </div>
  );
};

// ─── Save Settings ────────────────────────────────────────────────────────────

const SaveSettings = () => {
  const api = useWheelStore((s) => s.api);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.saveAndReboot();
      toast.success("Settings saved! Device is rebooting...");
    } catch (e) {
      toast.error("Failed to save: " + (e as Error).message);
    } finally {
      setTimeout(() => setSaving(false), 3000);
    }
  };

  return (
    <div className="exp_card">
      <div className="exp_card_header">
        <i className="icon fi fi-sr-floppy-disk" />
        <h2>Save Settings to Device</h2>
      </div>
      <div className="exp_card_body">
        <p className="exp_desc">
          Normally settings apply immediately but are{" "}
          <strong>lost on power cycle</strong>. This button writes all current
          settings to the device&apos;s non-volatile memory. The device will
          reboot automatically.
        </p>
        <Button
          variant="primary"
          icon={saving ? "icon fi fi-sr-spinner" : "icon fi fi-sr-floppy-disk"}
          onClick={() => void handleSave()}
          style={{ marginTop: "1rem", minWidth: "180px" }}
        >
          {saving ? "Saving & Rebooting..." : "Save & Reboot"}
        </Button>
      </div>
    </div>
  );
};

// ─── Spring & Damping Sliders ─────────────────────────────────────────────────

const SpringDampingPanel = () => {
  const { effects } = useDeviceSettingsStore(
    useShallow((s) => ({ effects: s.settings.effects })),
  );
  const setSetting = useSettingUI();

  return (
    <div className="exp_card">
      <div className="exp_card_header">
        <i className="icon fi fi-sr-comet" />
        <h2>Spring &amp; Damping</h2>
      </div>
      <div className="exp_card_body">
        <p className="exp_desc">
          Fine-grained control over centering spring and damping forces. These
          supplement DirectX game effects.
        </p>

        <div className="exp_sliders">
          <Slider
            label="Integrated Spring Strength (%)"
            value={effects.integratedSpringStrength}
            onValueCommit={(v) =>
              void setSetting(SettingField.IntegratedSpringStrength, v)
            }
            infoPanelProps={{
              description:
                "A constant hardware centering spring that always tries to return the wheel to center.",
              impact:
                "Useful if a game has no FFB spring. Adds a 'return-to-center' feel without any game software.",
            }}
          />
          <Slider
            label="Static Dampening Strength (%)"
            value={effects.staticDampeningStrength}
            onValueCommit={(v) =>
              void setSetting(SettingField.StaticDampeningStrength, v)
            }
            infoPanelProps={{
              description:
                "Adds friction-like resistance to ALL wheel movement.",
              impact:
                "Too high makes the wheel feel sluggish. Too low makes it feel light and twitchy.",
            }}
          />
          <Slider
            label="Soft Stop Dampening (%)"
            value={effects.softStopDampeningStrength}
            onValueCommit={(v) =>
              void setSetting(SettingField.SoftStopDampeningStrength, v)
            }
            infoPanelProps={{
              description:
                "Dampening force applied only in the soft stop zone at the end of the motion range.",
              impact:
                "Higher values provide a progressively firmer end-stop feel.",
            }}
          />
          <Slider
            label="Soft Stop Range (°)"
            value={effects.softStopRange}
            min={0}
            max={45}
            onValueCommit={(v) =>
              void setSetting(SettingField.SoftStopRange, v)
            }
            infoPanelProps={{
              description:
                "Extra degrees beyond the motion range where soft stop forces are applied.",
              impact: "Acts as a buffer zone before the hard mechanical stop.",
            }}
          />
          <Slider
            label="Soft Stop Strength (%)"
            value={effects.softStopStrength}
            onValueCommit={(v) =>
              void setSetting(SettingField.SoftStopStrength, v)
            }
            infoPanelProps={{
              description:
                "How strongly the device pushes back when approaching the end of the motion range.",
              impact:
                "Too high can feel like hitting a wall. Find a value that feels like firm, natural resistance.",
            }}
          />
        </div>
      </div>
    </div>
  );
};

// ─── Direct Control Test ──────────────────────────────────────────────────────

const DirectControlTest = () => {
  const api = useWheelStore((s) => s.api);

  const [springForce, setSpringForce] = useState(0);
  const [constantForce, setConstantForce] = useState(0);
  const [periodicForce, setPeriodicForce] = useState(0);
  const [forceDrop, setForceDrop] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendControl = (
    spring: number,
    constant: number,
    periodic: number,
    drop: number,
  ) => {
    try {
      void api.sendDirectControl({
        springForce: Math.round((spring / 100) * 10000),
        constantForce: Math.round((constant / 100) * 10000),
        periodicForce: Math.round((periodic / 100) * 10000),
        forceDrop: drop,
      });
    } catch (e) {
      console.error("Direct control error", e);
    }
  };

  const handleToggle = (checked: boolean) => {
    setIsActive(checked);
    if (checked) {
      // Send every 50ms to keep device in direct control mode
      intervalRef.current = setInterval(() => {
        sendControl(springForce, constantForce, periodicForce, forceDrop);
      }, 50);
      toast.info(
        "Direct Control active. Device will return to normal on stop.",
      );
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Send zeros to release
      sendControl(0, 0, 0, 0);
      toast.info("Direct Control stopped.");
    }
  };

  // Update ongoing interval when sliders change
  useEffect(() => {
    if (isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        sendControl(springForce, constantForce, periodicForce, forceDrop);
      }, 50);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [springForce, constantForce, periodicForce, forceDrop, isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sendControl(0, 0, 0, 0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="exp_card">
      <div className="exp_card_header">
        <i className="icon fi fi-sr-gamepad" />
        <h2>Direct Control Test</h2>
        <span className={`exp_badge ${isActive ? "active" : ""}`}>
          {isActive ? "● Active" : "Inactive"}
        </span>
      </div>
      <div className="exp_card_body">
        <p className="exp_desc">
          Send forces <strong>directly from this app</strong>, bypassing DirectX
          entirely. Great for testing your motor and FFB configuration without a
          game. Device returns to normal mode automatically when stopped.
        </p>

        <ToggleSwitch
          label="Activate Direct Control"
          checked={isActive}
          onToggle={handleToggle}
        />

        <div
          className={`exp_sliders ${!isActive ? "exp_sliders_disabled" : ""}`}
        >
          <Slider
            label="Spring Force (%)"
            value={springForce}
            min={-100}
            max={100}
            onValueChange={(v) => setSpringForce(v)}
            onValueCommit={(v) => setSpringForce(v)}
            infoPanelProps={{
              description:
                "Centering force — positive = center, negative = anti-center.",
            }}
          />
          <Slider
            label="Constant Force (%)"
            value={constantForce}
            min={-100}
            max={100}
            onValueChange={(v) => setConstantForce(v)}
            onValueCommit={(v) => setConstantForce(v)}
            infoPanelProps={{
              description:
                "Constant push in one direction. -100 = full left, +100 = full right.",
            }}
          />
          <Slider
            label="Periodic / Vibration (%)"
            value={periodicForce}
            min={-100}
            max={100}
            onValueChange={(v) => setPeriodicForce(v)}
            onValueCommit={(v) => setPeriodicForce(v)}
            infoPanelProps={{
              description:
                "Periodic oscillation force. Sent as a raw value to the periodic channel.",
            }}
          />
          <Slider
            label="Force Drop (%) — Dampens DirectX"
            value={forceDrop}
            onValueChange={(v) => setForceDrop(v)}
            onValueCommit={(v) => setForceDrop(v)}
            infoPanelProps={{
              description:
                "Reduces all DirectX forces by this %. 100 = completely mutes game FFB.",
            }}
          />
        </div>

        <div className="exp_buttons_row">
          <Button
            variant="secondary"
            onClick={() => {
              setSpringForce(0);
              setConstantForce(0);
              setPeriodicForce(0);
              setForceDrop(0);
            }}
          >
            Reset All to 0
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setSpringForce(50);
              setConstantForce(0);
              setPeriodicForce(0);
              setForceDrop(0);
            }}
          >
            Test: Spring
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setSpringForce(0);
              setConstantForce(0);
              setPeriodicForce(60);
              setForceDrop(0);
            }}
          >
            Test: Vibration
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Experiments Page ────────────────────────────────────────────────────

export const Experiments = () => {
  return (
    <div className="experiments_page">
      <TorqueMeter />
      <SaveSettings />
      <SpringDampingPanel />
      <DirectControlTest />
    </div>
  );
};
