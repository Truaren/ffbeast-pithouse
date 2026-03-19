/**
 * Pedals.tsx — Full FEEL-VR Pedal curve editor + calibration
 * Logic ported from FEEL-VR Control reference app + Zustand integration
 */
import "./style.scss";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { MarkdownModal, ToggleSwitch } from "@/components/ui";
import { useElectron } from "@/hooks/use-electron";
import type {
  DeadzoneState,
  PedalConfig,
  PedalName,
  Preset,
  Pt,
} from "@/stores";
import { usePedalsStore } from "@/stores";

// ─── Constants ────────────────────────────────────────────────────────────────
const PEDALS: PedalName[] = ["clutch", "brake", "throttle"];
const DEFAULT_LABELS: Record<PedalName, string> = {
  clutch: "Clutch",
  brake: "Brake",
  throttle: "Throttle",
};
const PEDAL_COLORS: Record<PedalName, string> = {
  clutch: "#a78bfa",
  brake: "#f87171",
  throttle: "#34d399",
};

interface PluginInfo {
  id: string;
  name: string;
  vendorId?: number;
  productId?: number;
  isDefault?: boolean;
}

interface CalibrationState {
  active: boolean;
  pedal: PedalName | null;
  minRaw: number | null;
  maxRaw: number | null;
  ignoreUntil: number;
}

// ─── Curve math ───────────────────────────────────────────────────────────────
const SVG_W = 300,
  SVG_H = 200,
  PAD = 10;

const PRESETS: Record<Preset, Pt[]> = {
  linear: [
    [0, 1],
    [0.25, 0.75],
    [0.5, 0.5],
    [0.75, 0.25],
    [1, 0],
  ],
  exp: [
    [0, 1],
    [0.25, 0.92],
    [0.5, 0.72],
    [0.75, 0.38],
    [1, 0],
  ],
  log: [
    [0, 1],
    [0.25, 0.62],
    [0.5, 0.28],
    [0.75, 0.08],
    [1, 0],
  ],
  "s-curve": [
    [0, 1],
    [0.25, 0.85],
    [0.5, 0.5],
    [0.75, 0.15],
    [1, 0],
  ],
  custom: [
    [0, 1],
    [0.25, 0.75],
    [0.5, 0.5],
    [0.75, 0.25],
    [1, 0],
  ],
};

function buildSplinePath(pts: Pt[]): string {
  if (pts.length < 2) return "";
  const m = pts.map(([nx, ny]): [number, number] => [
    nx * (SVG_W - PAD * 2) + PAD,
    ny * (SVG_H - PAD * 2) + PAD,
  ]);
  let d = `M ${m[0][0]},${m[0][1]}`;
  for (let i = 0; i < m.length - 1; i++) {
    const p0 = m[Math.max(0, i - 1)],
      p1 = m[i],
      p2 = m[i + 1],
      p3 = m[Math.min(m.length - 1, i + 2)],
      a = 0.5;
    d += ` C ${p1[0] + ((p2[0] - p0[0]) * a) / 3},${p1[1] + ((p2[1] - p0[1]) * a) / 3} ${p2[0] - ((p3[0] - p1[0]) * a) / 3},${p2[1] - ((p3[1] - p1[1]) * a) / 3} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function applyCurve(pts: Pt[], t: number): number {
  if (!pts?.length) return t;
  for (let i = 0; i < pts.length - 1; i++) {
    if (t >= pts[i][0] && t <= pts[i + 1][0]) {
      const lt = (t - pts[i][0]) / (pts[i + 1][0] - pts[i][0]),
        s = lt * lt * (3 - 2 * lt);
      return 1 - (pts[i][1] + (pts[i + 1][1] - pts[i][1]) * s);
    }
  }
  return t <= pts[0][0] ? 1 - pts[0][1] : 1 - pts[pts.length - 1][1];
}

// ─── Preset Icons ─────────────────────────────────────────────────────────────
const PresetIcon = ({ preset }: { preset: Preset }) => {
  switch (preset) {
    case "linear":
      return (
        <svg viewBox="0 0 40 30">
          <line
            x1="4"
            y1="26"
            x2="36"
            y2="4"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "s-curve":
      return (
        <svg viewBox="0 0 40 30">
          <path
            d="M4,26 C12,26 14,15 20,15 C26,15 28,4 36,4"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );
    case "exp":
      return (
        <svg viewBox="0 0 40 30">
          <path
            d="M4,26 Q20,26 36,4"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );
    case "log":
      return (
        <svg viewBox="0 0 40 30">
          <path
            d="M4,26 Q20,4 36,4"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );
    case "custom":
      return (
        <svg viewBox="0 0 40 30">
          <path
            d="M4,26 C14,22 18,10 28,8 L36,4"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="20" cy="15" r="2.5" fill="currentColor" />
        </svg>
      );
  }
};

// ─── Curve Editor ─────────────────────────────────────────────────────────────
const CurveEditor = ({
  pedal,
  pts,
  onChange,
  liveRatio,
}: {
  pedal: PedalName;
  pts: Pt[];
  onChange: (p: Pt[]) => void;
  liveRatio: number;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragIdx = useRef<number | null>(null);
  const color = PEDAL_COLORS[pedal];
  const renderedPts = pts || PRESETS.custom;
  const pathData = buildSplinePath(renderedPts);
  const fillData =
    pathData + ` L${SVG_W - PAD},${SVG_H - PAD} L${PAD},${SVG_H - PAD} Z`;
  const barX = liveRatio * (SVG_W - PAD * 2) + PAD;

  function toNorm(e: React.PointerEvent) {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (SVG_W / rect.width),
      y: (e.clientY - rect.top) * (SVG_H / rect.height),
    };
  }
  function onDown(e: React.PointerEvent<SVGSVGElement>) {
    const pos = toNorm(e);
    if (!pos) return;
    for (let i = 0; i < renderedPts.length; i++) {
      const px = renderedPts[i][0] * (SVG_W - PAD * 2) + PAD,
        py = renderedPts[i][1] * (SVG_H - PAD * 2) + PAD;
      if (Math.hypot(pos.x - px, pos.y - py) < 14) {
        dragIdx.current = i;
        (e.target as SVGElement).setPointerCapture(e.pointerId);
        return;
      }
    }
  }
  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (dragIdx.current === null) return;
    const pos = toNorm(e);
    if (!pos) return;
    const i = dragIdx.current;
    const nx = Math.max(0, Math.min(1, (pos.x - PAD) / (SVG_W - PAD * 2)));
    const ny = Math.max(0, Math.min(1, (pos.y - PAD) / (SVG_H - PAD * 2)));
    const minX = i > 0 ? renderedPts[i - 1][0] + 0.01 : 0,
      maxX = i < renderedPts.length - 1 ? renderedPts[i + 1][0] - 0.01 : 1;
    const fx =
      i === 0
        ? 0
        : i === renderedPts.length - 1
          ? 1
          : Math.max(minX, Math.min(maxX, nx));
    onChange(renderedPts.map((p, idx) => (idx === i ? ([fx, ny] as Pt) : p)));
  }

  return (
    <div className="curve_editor_wrap">
      <div
        className="curve_live_bar"
        style={{ left: `${(barX / SVG_W) * 100}%` }}
      />
      <svg
        ref={svgRef}
        className="curve_editor_svg"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={() => {
          dragIdx.current = null;
        }}
      >
        <defs>
          <linearGradient id={`fg_${pedal}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.03" />
          </linearGradient>
        </defs>
        <rect
          x={0}
          y={0}
          width={SVG_W}
          height={SVG_H}
          fill="var(--pedal-chart-bg)"
          rx="6"
        />
        {[55, 110, 165].map((v) => (
          <g key={v}>
            <line
              x1={0}
              y1={v * (SVG_H / 220)}
              x2={SVG_W}
              y2={v * (SVG_H / 220)}
              stroke="var(--pedal-grid)"
              strokeWidth="0.5"
            />
            <line
              x1={v * (SVG_W / 300)}
              y1={0}
              x2={v * (SVG_W / 300)}
              y2={SVG_H}
              stroke="var(--pedal-grid)"
              strokeWidth="0.5"
            />
          </g>
        ))}
        <path d={fillData} fill={`url(#fg_${pedal})`} />
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {renderedPts.map(([nx, ny], i) => {
          const cx = nx * (SVG_W - PAD * 2) + PAD,
            cy = ny * (SVG_H - PAD * 2) + PAD;
          return (
            <g key={i}>
              <line
                x1={cx}
                y1={PAD}
                x2={cx}
                y2={SVG_H - PAD}
                stroke={color}
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity="0.35"
              />
              <circle
                cx={cx}
                cy={cy}
                r={6}
                fill="var(--bg-secondary)"
                stroke={color}
                strokeWidth="2"
                style={{ cursor: "grab" }}
              />
            </g>
          );
        })}
      </svg>
      <div className="curve_axis_x">
        {["0", "25", "50", "75", "100"].map((v) => (
          <span key={v}>{v}</span>
        ))}
      </div>
    </div>
  );
};

// ─── Calibration Modal ────────────────────────────────────────────────────────
const CalibModal = ({
  cal,
  min,
  max,
  onFinish,
  onCancel,
}: {
  cal: CalibrationState;
  min: number | null;
  max: number | null;
  onFinish: () => void;
  onCancel: () => void;
}) => {
  if (!cal.active || !cal.pedal) return null;
  const color = PEDAL_COLORS[cal.pedal];
  const range = min !== null && max !== null ? max - min : 0;
  return (
    <div className="cal_modal_overlay">
      <div className="cal_modal">
        <div className="cal_modal_header">
          <h2>
            Calibrating{" "}
            <span style={{ color }}>{DEFAULT_LABELS[cal.pedal]}</span>
          </h2>
          <button className="cal_modal_close" onClick={onCancel}>
            <i className="fi fi-rr-cross" />
          </button>
        </div>
        <p className="cal_modal_desc">
          Fully release the pedal, then press it to the floor a few times.
        </p>
        <div className="cal_live_bar_track">
          <div
            className="cal_live_bar_fill"
            style={{ width: `${range > 0 ? 100 : 0}%`, background: color }}
          />
        </div>
        <div className="cal_stats">
          <div className="cal_stat">
            <span>Min RAW</span>
            <strong>{min ?? "—"}</strong>
          </div>
          <div className="cal_stat">
            <span>Max RAW</span>
            <strong>{max ?? "—"}</strong>
          </div>
          <div className="cal_stat">
            <span>Range</span>
            <strong>{min !== null && max !== null ? max - min : "—"}</strong>
          </div>
        </div>
        <div className="cal_modal_btns">
          <button className="cal_cancel_btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="cal_done_btn"
            onClick={onFinish}
            disabled={min === null}
            style={{ background: color }}
          >
            Save Calibration
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Pedal Card ───────────────────────────────────────────────────────────────
interface CardProps {
  pedal: PedalName;
  pts: Pt[];
  preset: Preset;
  reversed: boolean;
  dz: DeadzoneState;
  liveRatio: number;
  liveInput: number;
  isConnected: boolean;
  hidden: boolean;
  label: string;
  calActive: boolean;
  calPedal: PedalName | null;
  configMinMax: { min: number; max: number } | null;
  onPts: (p: Pt[]) => void;
  onPreset: (p: Preset) => void;
  onReverse: (v: boolean) => void;
  onDzChange: (w: "min" | "max", v: number) => void;
  onDzCommit: () => void;
  onCalibrate: () => void;
  onRename: (s: string) => void;
  onHide: () => void;
}

const PRESET_LIST: Preset[] = ["linear", "s-curve", "exp", "log", "custom"];

const PedalCard = (p: CardProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(p.label);
  const [collapsed, setCollapsed] = useState(false);
  const color = PEDAL_COLORS[p.pedal];
  const isCalibrating = p.calActive && p.calPedal === p.pedal;

  if (p.hidden)
    return (
      <div className="pedal_card pedal_card_hidden">
        <div className="pedal_card_header">
          <span className="pedal_dot" style={{ background: color }} />
          <span className="pedal_hidden_label">
            {p.label} <em>(hidden)</em>
          </span>
          <button className="card_icon_btn" onClick={p.onHide} title="Show">
            <i className="fi fi-rr-eye" />
          </button>
        </div>
      </div>
    );

  return (
    <div
      className={`pedal_card ${isCalibrating ? "pedal_card_calibrating" : ""} ${collapsed ? "pedal_card_collapsed" : ""}`}
    >
      {/* ── Header ── */}
      <div className="pedal_card_header">
        <span className="pedal_dot" style={{ background: color }} />
        {editing ? (
          <input
            autoFocus
            className="pedal_name_input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              p.onRename(draft || p.label);
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                p.onRename(draft || p.label);
                setEditing(false);
              }
              if (e.key === "Escape") setEditing(false);
            }}
          />
        ) : (
          <h3
            onDoubleClick={() => {
              setDraft(p.label);
              setEditing(true);
            }}
            title="Double-click to rename"
          >
            {p.label}
          </h3>
        )}
        <span className="live_pct" style={{ color }}>
          {p.isConnected ? `${Math.round(p.liveRatio * 100)}%` : "—%"}
        </span>
        <div className="card_header_actions">
          <button
            className="card_icon_btn"
            onClick={() => setEditing(true)}
            title="Rename"
          >
            <i className="fi fi-rr-pencil" />
          </button>
          <button
            className="card_icon_btn"
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Expand" : "Collapse"}
          >
            <i className={`fi fi-rr-angle-${collapsed ? "down" : "up"}`} />
          </button>
          <button className="card_icon_btn" onClick={p.onHide} title="Hide">
            <i className="fi fi-rr-eye-crossed" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Presets */}
          <div className="preset_bar_label">Output Curves</div>
          <div className="preset_bar">
            {PRESET_LIST.map((pr) => (
              <button
                key={pr}
                title={pr}
                className={`preset_btn ${p.preset === pr ? "active" : ""}`}
                style={p.preset === pr ? { borderColor: color, color } : {}}
                onClick={() => p.onPreset(pr)}
              >
                <PresetIcon preset={pr} />
              </button>
            ))}
          </div>

          {/* Curve editor */}
          <CurveEditor
            pedal={p.pedal}
            pts={p.pts}
            onChange={(pts) => {
              p.onPts(pts);
              p.onPreset("custom");
            }}
            liveRatio={p.liveInput}
          />

          {/* Live bar */}
          <div className="input_bar_track">
            <div
              className="input_bar_fill"
              style={{ width: `${p.liveRatio * 100}%`, background: color }}
            />
          </div>

          {/* Controls row: Reverse + DZ + Calibrate in a tighter layout */}
          <div className="card_bottom_grid">
            <label className="card_reverse_row">
              <ToggleSwitch
                label="Reverse"
                checked={p.reversed}
                onToggle={(val) => p.onReverse(val)}
              />
            </label>

            <div className="dz_compact">
              <div className="dz_row">
                <span className="dz_label">Min DZ</span>
                <input
                  type="range"
                  className="dz_slider"
                  min={0}
                  max={25}
                  value={p.dz.min}
                  onChange={(e) => p.onDzChange("min", +e.target.value)}
                  onMouseUp={p.onDzCommit}
                  onTouchEnd={p.onDzCommit}
                />
                <span className="dz_val">{p.dz.min}%</span>
              </div>
              <div className="dz_row">
                <span className="dz_label">Max DZ</span>
                <input
                  type="range"
                  className="dz_slider"
                  min={0}
                  max={25}
                  value={p.dz.max}
                  onChange={(e) => p.onDzChange("max", +e.target.value)}
                  onMouseUp={p.onDzCommit}
                  onTouchEnd={p.onDzCommit}
                />
                <span className="dz_val">{p.dz.max}%</span>
              </div>
            </div>

            <div className="calibrate_row">
              <button
                className={`cal_btn ${isCalibrating ? "calibrating" : ""}`}
                style={isCalibrating ? { borderColor: color, color } : {}}
                onClick={p.onCalibrate}
                disabled={!p.isConnected}
              >
                {isCalibrating ? (
                  <>
                    <i className="fi fi-sr-bolt" />
                    Calibrating…
                  </>
                ) : (
                  "Start Calibrating"
                )}
              </button>
              {p.configMinMax && (
                <div className="cal_debug_row">
                  MIN: {p.configMinMax.min} · MAX: {p.configMinMax.max}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Status Bar ───────────────────────────────────────────────────────────────
const StatusBar = ({
  connected,
  name,
  plugins,
  activeId,
  setActiveId,
  isDefault,
  setIsDefault,
  onLoad,
  loading,
  hiddenCount,
  onShowAll,
  isRecording,
  onToggleRecord,
  onGetHelp,
}: {
  connected: boolean;
  name: string;
  plugins: PluginInfo[];
  activeId: string;
  setActiveId: (s: string) => void;
  isDefault: boolean;
  setIsDefault: (val: boolean) => void;
  onLoad: () => void;
  loading: boolean;
  hiddenCount: number;
  onShowAll: () => void;
  isRecording: boolean;
  onToggleRecord: () => void;
  onGetHelp: () => void;
}) => (
  <div className="pedal_plugin_bar">
    <i
      className={`fi ${connected ? "fi-sr-usb-pendrive" : "fi-sr-plug"}`}
      style={{ color: connected ? "var(--accent)" : "var(--text-secondary)" }}
    />
    <span className={`pedal_plugin_status ${connected ? "connected" : ""}`}>
      {connected ? name : "No device found"}
    </span>
    <button
      className={`debug_record_btn ${isRecording ? "recording" : ""}`}
      onClick={onToggleRecord}
      disabled={!connected}
      title={isRecording ? "Stop Recording & Save" : "Record Debug Data"}
      style={{
        marginLeft: 8,
        padding: "4px 8px",
        borderRadius: 4,
        background: isRecording
          ? "rgba(239,68,68,0.2)"
          : "rgba(255,255,255,0.05)",
        color: isRecording ? "#ef4444" : "var(--text-secondary)",
        border: `1px solid ${isRecording ? "#ef4444" : "var(--border)"}`,
        cursor: connected ? "pointer" : "not-allowed",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span
        className="record_dot"
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: isRecording ? "#ef4444" : "currentColor",
          boxShadow: isRecording ? "0 0 8px #ef4444" : "none",
          animation: isRecording ? "pulse 1s infinite" : "none",
        }}
      />
      {isRecording ? "Stop Recording" : ""}
    </button>

    <span style={{ opacity: 0.4, margin: "0 6px", flex: 1 }}></span>

    <button className="help_btn" onClick={onGetHelp}>
      <i className="fi fi-rr-interrogation" style={{ marginRight: 6 }} />
      How to add your pedal
    </button>

    <div className="plugin_selector_wrapper">
      <span className="dz_label">Config:</span>
      <select
        className="pedal_plugin_select"
        value={activeId}
        onChange={(e) => setActiveId(e.target.value)}
      >
        {plugins.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <div
        style={{
          marginLeft: "12px",
          transform: "scale(0.8)",
          transformOrigin: "left center",
        }}
      >
        <ToggleSwitch
          label="Default"
          checked={isDefault}
          onToggle={setIsDefault}
        />
      </div>
    </div>
    <button
      className={`plugin_load_btn ${loading ? "loading" : ""}`}
      onClick={onLoad}
      disabled={loading}
    >
      {loading ? (
        <span className="plugin_load_spinner" />
      ) : (
        <i className="fi fi-sr-refresh" />
      )}
      {loading ? "Loading…" : "Load"}
    </button>
    {hiddenCount > 0 && (
      <button className="show_all_btn" onClick={onShowAll}>
        Show all ({hiddenCount} hidden)
      </button>
    )}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export const Pedals = () => {
  const electron = useElectron();

  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [telemetryLive, setTelemetryLive] = useState<Record<PedalName, number>>(
    { throttle: 0, brake: 0, clutch: 0 },
  );
  const [cal, setCal] = useState<CalibrationState>({
    active: false,
    pedal: null,
    minRaw: null,
    maxRaw: null,
    ignoreUntil: 0,
  });
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [pluginLoading, setPluginLoading] = useState(false);
  const [isRecordingDebug, setIsRecordingDebug] = useState(false);

  const [isReadmeOpen, setIsReadmeOpen] = useState(false);
  const [readmeContent, setReadmeContent] = useState("");

  const calRef = useRef(cal);
  calRef.current = cal;

  // Store Connections
  const activePluginId = usePedalsStore((s) => s.activePluginId);
  const defaultPluginId = usePedalsStore((s) => s.defaultPluginId);
  const {
    setActivePluginId,
    setDefaultPluginId,
    updateConfig,
    getPluginConfig,
  } = usePedalsStore();

  const currentConfigObj = getPluginConfig(activePluginId);
  const { curves, presets, reversed, deadzones, rawConfig, labels, hidden } =
    currentConfigObj;

  const isDefault = defaultPluginId === activePluginId;
  const setIsDefault = (val: boolean) =>
    setDefaultPluginId(val ? activePluginId : null);

  // IPC setup & init
  useEffect(() => {
    if (!electron) return;

    electron
      .invoke("pedals:listPlugins")
      .then((l) => {
        const pluginList = Array.isArray(l) ? l : [];
        if (pluginList.length > 0) {
          setPlugins(pluginList as PluginInfo[]);

          // Auto-load logic: if defaultPlugin is set, pick it. Otherwise keep current active plugin.
          const useStoreDefault = usePedalsStore.getState().defaultPluginId;
          if (useStoreDefault) {
            setActivePluginId(useStoreDefault);
          } else {
            // wait to see if a device is connected to auto-match
          }
        }
      })
      .catch((err: unknown) => {
        const error = err as Error;
        console.error(error);
        toast.error(
          "Backend error: Please fully restart the app to apply IPC changes. " +
            error.message,
        );
      });

    electron
      .invoke("pedals:getStatus")
      .then((s) => {
        const st = s as { connected: boolean };
        const alreadyConnected = st?.connected ?? false;
        setIsConnected(alreadyConnected);
        if (alreadyConnected) {
          electron
            .invoke("pedals:getConfig")
            .then((res) => {
              const cfg = res as { success: boolean; config: PedalConfig };
              if (cfg.success && cfg.config) {
                updateConfig(activePluginId, { rawConfig: cfg.config });
              }
            })
            .catch(() => {
              /* skip */
            });
        }
      })
      .catch(() => {
        /* skip */
      });

    const onConnected = (_: unknown, data: unknown) => {
      setIsConnected(true);
      const payload = (data as { name?: string; id?: string }) || {};
      const matchedName = payload.name ?? "FEEL-VR PedalsLite";
      setDeviceName(matchedName);
      toast.success("Pedals connected: " + matchedName);

      // Auto-load config specific to this device based on name/id
      const currentDefault = usePedalsStore.getState().defaultPluginId;
      if (!currentDefault) {
        const matchingPlugin = usePedalsStore.getState().configs[matchedName];
        if (matchingPlugin) {
          setActivePluginId(matchedName); // switch to device config if we don't force a default
        }
      }

      void electron.invoke("pedals:getConfig").then((res) => {
        const cfg = res as { success: boolean; config: PedalConfig };
        if (cfg.success && cfg.config) {
          updateConfig(activePluginId, { rawConfig: cfg.config });
        }
      });
    };

    const onDisconnected = () => {
      setIsConnected(false);
      setDeviceName("");
      setTelemetryLive({ throttle: 0, brake: 0, clutch: 0 });
    };

    const onLiveData = (_: unknown, data: unknown) => {
      const d = data as {
        raw: { axis1: number; axis2: number; axis3: number };
        telemetry?: { throttle: number; brake: number; clutch: number };
      };
      if (!d?.raw) return;
      const { axis1, axis2, axis3 } = d.raw;
      if (d.telemetry) setTelemetryLive(d.telemetry);
      const c = calRef.current;
      if (c.active && c.pedal && Date.now() >= c.ignoreUntil) {
        const rv =
          c.pedal === "throttle" ? axis1 : c.pedal === "brake" ? axis2 : axis3;
        setCal((prev) => ({
          ...prev,
          minRaw: prev.minRaw === null ? rv : Math.min(prev.minRaw, rv),
          maxRaw: prev.maxRaw === null ? rv : Math.max(prev.maxRaw, rv),
        }));
      }
    };

    const unsubConnected = electron.on("pedals:connected", onConnected);
    const unsubDisconnected = electron.on(
      "pedals:disconnected",
      onDisconnected,
    );
    const unsubLiveData = electron.on("pedals:liveData", onLiveData);

    return () => {
      unsubConnected?.();
      unsubDisconnected?.();
      unsubLiveData?.();
    };
  }, [electron, activePluginId, setActivePluginId, updateConfig]);

  const getRatio = (pedal: PedalName) => {
    const rawRatio = telemetryLive[pedal] ?? 0;
    const isReversed = reversed[pedal] || false;
    const inp = isReversed ? 1 - rawRatio : rawRatio;
    return {
      input: inp,
      output: applyCurve(curves[pedal] || PRESETS.custom, inp),
    };
  };

  const handleLoadPlugin = async () => {
    if (!electron) return;
    setPluginLoading(true);
    try {
      const res = (await electron.invoke(
        "pedals:loadPlugin",
        activePluginId,
      )) as {
        success: boolean;
        name?: string;
        connected?: boolean;
        error?: string;
      };
      if (res.success) {
        const pluginName = res.name ?? activePluginId;
        if (res.connected) {
          setIsConnected(true);
          setDeviceName(pluginName);
          toast.success(`✓ Loaded "${pluginName}"`);
          const cfgRes = (await electron.invoke("pedals:getConfig")) as {
            success: boolean;
            config: PedalConfig;
          };
          if (cfgRes.success && cfgRes.config) {
            updateConfig(activePluginId, { rawConfig: cfgRes.config });
          }
        } else {
          setIsConnected(false);
          toast.info(`Plugin "${pluginName}" loaded — no physical device`);
        }
      } else {
        toast.error("Load failed: " + (res.error ?? "unknown"));
      }
    } finally {
      setPluginLoading(false);
    }
  };

  const showAll = () =>
    updateConfig(activePluginId, {
      hidden: { clutch: false, brake: false, throttle: false },
    });

  const handleDzCommit = async (pedal: PedalName) => {
    if (!rawConfig) return;
    if (!electron) return;
    const dz = deadzones[pedal];
    const nc = { ...rawConfig };
    if (pedal === "throttle") {
      const dist = rawConfig.throtl_max - rawConfig.throtl_min;
      nc.throtl_max = Math.round(rawConfig.throtl_max - dist * (dz.min / 100));
      nc.throtl_min = Math.round(rawConfig.throtl_min + dist * (dz.max / 100));
    } else if (pedal === "brake") {
      const dist = rawConfig.brake_max - rawConfig.brake_min;
      nc.brake_min = Math.round(rawConfig.brake_min + dist * (dz.min / 100));
      nc.brake_max = Math.round(rawConfig.brake_max - dist * (dz.max / 100));
    } else {
      const dist = rawConfig.clutch_max - rawConfig.clutch_min;
      nc.clutch_min = Math.round(rawConfig.clutch_min + dist * (dz.min / 100));
      nc.clutch_max = Math.round(rawConfig.clutch_max - dist * (dz.max / 100));
    }
    const res = (await electron.invoke("pedals:setConfig", nc)) as {
      success: boolean;
    };
    if (res.success) {
      await electron.invoke("pedals:saveConfig");
      updateConfig(activePluginId, { rawConfig: nc });
      toast.success("Deadzone applied");
    }
  };

  const openCalibration = async (pedal: PedalName) => {
    if (!isConnected || !rawConfig || !electron) return;
    const t = { ...rawConfig };
    const def = (await electron.invoke(
      "pedals:getDefaults",
    )) as PedalConfig | null;
    if (pedal === "throttle") {
      t.throtl_min = def?.throtl_min ?? 0;
      t.throtl_max = def?.throtl_max ?? 16384;
    } else if (pedal === "brake") {
      t.brake_min = def?.brake_min ?? 0;
      t.brake_max = def?.brake_max ?? 16777216;
    } else {
      t.clutch_min = def?.clutch_min ?? 0;
      t.clutch_max = def?.clutch_max ?? 16384;
    }
    await electron.invoke("pedals:setConfig", t);
    setCal({
      active: true,
      pedal,
      minRaw: null,
      maxRaw: null,
      ignoreUntil: Date.now() + 250,
    });
  };

  const finishCalibration = async () => {
    const { pedal, minRaw, maxRaw } = calRef.current;
    setCal((p) => ({ ...p, active: false }));
    if (
      !pedal ||
      minRaw === null ||
      maxRaw === null ||
      !rawConfig ||
      !electron
    ) {
      toast.warning("No data — cancelled");
      if (rawConfig && electron)
        await electron.invoke("pedals:setConfig", rawConfig);
      return;
    }
    const nc = { ...rawConfig };
    if (pedal === "throttle") {
      nc.throtl_min = minRaw;
      nc.throtl_max = maxRaw;
    } else if (pedal === "brake") {
      nc.brake_min = minRaw;
      nc.brake_max = maxRaw;
    } else {
      nc.clutch_min = minRaw;
      nc.clutch_max = maxRaw;
    }
    const res = (await electron.invoke("pedals:setConfig", nc)) as {
      success: boolean;
      error?: string;
    };
    if (res.success) {
      toast.success("Calibration saved");
      await electron.invoke("pedals:saveConfig");
      updateConfig(activePluginId, {
        rawConfig: nc,
        deadzones: { ...deadzones, [pedal]: { min: 0, max: 0 } },
      });
    } else {
      toast.error("Save failed: " + (res.error ?? "unknown"));
      await electron.invoke("pedals:setConfig", rawConfig);
    }
  };

  const cancelCalibration = async () => {
    setCal((p) => ({ ...p, active: false }));
    if (rawConfig && electron)
      await electron.invoke("pedals:setConfig", rawConfig);
  };

  const getMinMax = (pedal: PedalName) => {
    if (!rawConfig) return null;
    return pedal === "throttle"
      ? { min: rawConfig.throtl_min, max: rawConfig.throtl_max }
      : pedal === "brake"
        ? { min: rawConfig.brake_min, max: rawConfig.brake_max }
        : { min: rawConfig.clutch_min, max: rawConfig.clutch_max };
  };

  const hiddenCount = PEDALS.filter((p) => hidden[p]).length;

  const toggleDebugRecord = async () => {
    if (!electron) return;
    if (!isRecordingDebug) {
      const res = (await electron.invoke("pedals:startDebugRecord")) as {
        success: boolean;
        error?: string;
      };
      if (res.success) {
        setIsRecordingDebug(true);
        toast.success("Recording debug data...");
      } else {
        toast.error(
          "Failed to start recording: " + (res.error ?? "unknown error"),
        );
      }
    } else {
      setIsRecordingDebug(false);
      const res = (await electron.invoke("pedals:stopDebugRecord")) as {
        success: boolean;
        filePath?: string;
        error?: string;
      };
      if (res.success && res.filePath) {
        toast.success(`Debug data saved:\n${res.filePath}`);
      } else if (res.error !== "Cancelled by user") {
        toast.error(
          "Failed to save debug data: " + (res.error ?? "unknown error"),
        );
      }
    }
  };

  const handleGetHelp = async () => {
    if (!electron) return;
    try {
      const res = (await electron.invoke("pedals:getReadme")) as {
        success: boolean;
        content?: string;
        error?: string;
      };
      if (res.success && res.content) {
        setReadmeContent(res.content);
        setIsReadmeOpen(true);
      } else {
        toast.error("Could not load guide: " + (res.error ?? "File missing"));
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(
        "Terminal/IPC Error: Please restart the app. " + error.message,
      );
    }
  };

  return (
    <div className="pedals_page">
      <StatusBar
        connected={isConnected}
        name={deviceName}
        plugins={plugins}
        activeId={activePluginId}
        setActiveId={setActivePluginId}
        isDefault={isDefault}
        setIsDefault={setIsDefault}
        onLoad={() => {
          void handleLoadPlugin();
        }}
        loading={pluginLoading}
        hiddenCount={hiddenCount}
        onShowAll={showAll}
        isRecording={isRecordingDebug}
        onToggleRecord={() => {
          void toggleDebugRecord();
        }}
        onGetHelp={() => {
          void handleGetHelp();
        }}
      />
      <div className="pedals_grid">
        {PEDALS.map((pedal) => {
          const { input, output } = getRatio(pedal);
          return (
            <PedalCard
              key={pedal}
              pedal={pedal}
              pts={curves[pedal]}
              preset={presets[pedal]}
              reversed={reversed[pedal]}
              dz={deadzones[pedal]}
              liveRatio={output}
              liveInput={input}
              isConnected={isConnected}
              hidden={hidden[pedal]}
              label={labels[pedal]}
              calActive={cal.active}
              calPedal={cal.pedal}
              configMinMax={getMinMax(pedal)}
              onPts={(pts) =>
                updateConfig(activePluginId, {
                  curves: { ...curves, [pedal]: pts },
                  presets: { ...presets, [pedal]: "custom" },
                })
              }
              onPreset={(pr) =>
                updateConfig(activePluginId, {
                  presets: { ...presets, [pedal]: pr },
                  curves:
                    pr !== "custom"
                      ? {
                          ...curves,
                          [pedal]: PRESETS[pr].map((pt) => [...pt] as Pt),
                        }
                      : curves,
                })
              }
              onReverse={(v) =>
                updateConfig(activePluginId, {
                  reversed: { ...reversed, [pedal]: v },
                })
              }
              onDzChange={(w, v) =>
                updateConfig(activePluginId, {
                  deadzones: {
                    ...deadzones,
                    [pedal]: { ...deadzones[pedal], [w]: v },
                  },
                })
              }
              onDzCommit={() => {
                void handleDzCommit(pedal);
              }}
              onCalibrate={() => {
                void openCalibration(pedal);
              }}
              onRename={(s) =>
                updateConfig(activePluginId, {
                  labels: { ...labels, [pedal]: s },
                })
              }
              onHide={() =>
                updateConfig(activePluginId, {
                  hidden: { ...hidden, [pedal]: !hidden[pedal] },
                })
              }
            />
          );
        })}
      </div>
      <CalibModal
        cal={cal}
        min={cal.minRaw}
        max={cal.maxRaw}
        onFinish={() => {
          void finishCalibration();
        }}
        onCancel={() => {
          void cancelCalibration();
        }}
      />

      <MarkdownModal
        isOpen={isReadmeOpen}
        onClose={() => setIsReadmeOpen(false)}
        markdownContent={readmeContent}
        title="How to add your pedal"
      />
    </div>
  );
};
