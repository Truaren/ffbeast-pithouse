/**
 * Logitech G920 Pedals (USB Adapter)
 *
 * This profile targets the common "direct to USB" adapters that expose the
 * G920 pedal set as a generic HID game controller. The curve math is shared
 * with the other pedal modules; only the HID identity and raw axis parsing are
 * device-specific here.
 *
 * Windows currently reports the connected adapter as:
 *   USB\VID_1209&PID_F00D
 *   Bus-reported name: Shifter/Pedals Adapter
 *
 * If that changes later, update DEVICE_INFO below.
 */

const DEVICE_INFO = {
  vendorId: 0x1209,
  productId: 0xf00d,
  name: "Logitech G920 Pedals (Shifter/Pedals Adapter)",
};

/**
 * The Shifter/Pedals Adapter firmware exposes the pedals as 12-bit values
 * (0..4095). The first two HID axes are shifter position, and the last three
 * are the pedal axes we want: throttle, brake, clutch.
 */
const DEFAULT_RAW_LIMITS = {
  throtl_min: 0,
  throtl_max: 4095,
  brake_min: 0,
  brake_max: 4095,
  clutch_min: 0,
  clutch_max: 4095,
};

function safeU16(buf, offset) {
  return buf.length >= offset + 2 ? buf.readUInt16LE(offset) : undefined;
}

/**
 * Report layout from the adapter firmware:
 *   byte 0   : report id
 *   byte 1-3 : buttons / shifter state
 *   byte 4-5 : shifter X
 *   byte 6-7 : shifter Y
 *   byte 8-9 : throttle
 *   byte 10-11: brake
 *   byte 12-13: clutch
 *
 * We skip the shifter axes entirely and map only the pedal axes into axis1/2/3.
 */
function parseRaw(buf) {
  const hasReportId = buf.length >= 14 && buf[0] === 0x01;
  const pedalBase = hasReportId ? 8 : 4;

  return {
    axis1: safeU16(buf, pedalBase),
    axis2: safeU16(buf, pedalBase + 2),
    axis3: safeU16(buf, pedalBase + 4),
  };
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function calcRatio(val, min, max) {
  if (val === undefined || val === null) return 0;
  if (min === max) return 0;

  const low = Math.min(min, max);
  const high = Math.max(min, max);
  const clamped = Math.max(low, Math.min(high, val));
  return clamp01((clamped - min) / (max - min));
}

/**
 * Converts the live raw HID readings into normalized 0.0-1.0 pedal values.
 * The optional config argument lets the host pass calibrated endpoints.
 */
function parseTelemetry(data, config) {
  const raw = data && data.raw ? data.raw : data || {};
  const lim = config || DEFAULT_RAW_LIMITS;

  return {
    throttle: calcRatio(raw.axis1, lim.throtl_min, lim.throtl_max),
    brake: calcRatio(raw.axis2, lim.brake_min, lim.brake_max),
    clutch: calcRatio(raw.axis3, lim.clutch_min, lim.clutch_max),
  };
}

function buildDeadzoneOverride(minKey, maxKey, rawBounds, deadzones) {
  const start = rawBounds[minKey];
  const end = rawBounds[maxKey];

  if (start === undefined || end === undefined) {
    return {};
  }

  const span = end - start;
  return {
    [minKey]: Math.round(start + span * (deadzones.min / 100)),
    [maxKey]: Math.round(end - span * (deadzones.max / 100)),
  };
}

/**
 * Generic endpoint shrinking that works for both standard and inverted axes.
 * This adapter profile does not write those limits back to the hardware, but
 * the core app can still use the computed bounds for calibrated deadzones.
 */
function applyHardwareDeadzones(pedal, rawBounds, deadzones) {
  if (pedal === "throttle") {
    return buildDeadzoneOverride(
      "throtl_min",
      "throtl_max",
      rawBounds,
      deadzones,
    );
  }

  if (pedal === "brake") {
    return buildDeadzoneOverride(
      "brake_min",
      "brake_max",
      rawBounds,
      deadzones,
    );
  }

  if (pedal === "clutch") {
    return buildDeadzoneOverride(
      "clutch_min",
      "clutch_max",
      rawBounds,
      deadzones,
    );
  }

  return {};
}

/**
 * Generic USB adapters usually expose live telemetry only and do not offer a
 * writable feature-report config structure, so these are safe no-op stubs.
 */
function decodeConfigStruct() {
  return { ...DEFAULT_RAW_LIMITS };
}

function encodeConfigStruct() {
  return Buffer.alloc(0);
}

function readConfig() {
  return { ...DEFAULT_RAW_LIMITS };
}

function writeConfig() {
  // Not supported by common direct-to-USB pedal adapters.
}

function saveConfig() {
  // Not supported by common direct-to-USB pedal adapters.
}

function applySoftwareCurve(pts, xIn) {
  if (!pts || pts.length === 0) return xIn;
  if (xIn <= pts[0][0]) return pts[0][1];
  if (xIn >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];

  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    if (xIn >= x1 && xIn <= x2) {
      return y1 + ((xIn - x1) / (x2 - x1)) * (y2 - y1);
    }
  }

  return xIn;
}

module.exports = {
  DEVICE_INFO,
  DEFAULT_RAW_LIMITS,
  parseRaw,
  parseTelemetry,
  applyHardwareDeadzones,
  decodeConfigStruct,
  encodeConfigStruct,
  readConfig,
  writeConfig,
  saveConfig,
  applySoftwareCurve,
};
