/**
 * Moza SR-P Lite Pedals
 * Translated from MozaPedals.ino / Plugin Maker
 */

const DEVICE_INFO = {
  vendorId: 0x2348,
  productId: 0x8038,
  name: "Moza SR-P Lite",
};

/**
 * DEFAULT_RAW_LIMITS — physical calibrated hardware endpoints.
 * These are the values your pedals raw axis reports at full press and rest.
 * For Moza SR-P Lite Arduino code, axes typically hit 0xFFFF (65535).
 */
const DEFAULT_RAW_LIMITS = {
  throtl_min: 0,
  throtl_max: 65535,
  brake_min: 0,
  brake_max: 65535,
  clutch_min: 0,
  clutch_max: 0,
};

/**
 * Parses the raw HID byte buffer into raw pedal values (axis1, axis2, axis3).
 * MHeironimus Joystick.h default format with X and Y axes enabled:
 * On 16-bit axes, the throttle (X axis) is typically buf[1..2] and brake (Y axis) is buf[3..4].
 * In the Arduino sketch log, we observed Brake hitting 65535 first, and Throttle was missing,
 * suggesting X and Y might be mapped differently or we are missing an offset byte depending on Report ID.
 * Assuming ReportID=1, buf[0] is ID, buf[1,2] is X (Throttle), buf[3,4] is Y (Brake).
 */
function parseRaw(buf) {
  const safeU16 = (b, o) => (b.length >= o + 2 ? b.readUInt16LE(o) : 0);
  // Based on the user data, BrakeRaw was hitting 65535 at offset 3.
  // ThrottleRaw stayed 0. Let's make sure we map these correctly.
  return {
    axis1: safeU16(buf, 1), // Throttle
    axis2: safeU16(buf, 3), // Brake
    axis3: safeU16(buf, 5), // Clutch (if 3 axes enabled)
  };
}

/**
 * Normalises raw HID telemetry into 0.0–1.0 per pedal.
 * @param {Object} data – object with a .raw sub-object from the HID manager
 * @param {Object} config - optional user config holding raw calibrated limits
 * @returns {{ throttle, brake, clutch }}  floats 0.0–1.0
 */
function parseTelemetry(data, config) {
  const lim = config || DEFAULT_RAW_LIMITS;
  const throttle = calcRatio(
    data.raw.axis1,
    lim.throtl_min,
    lim.throtl_max,
    false,
  );
  const brake = calcRatio(data.raw.axis2, lim.brake_min, lim.brake_max, false);
  const clutch = 0;
  return { throttle, brake, clutch };
}

/* Internal ratio helper */
function calcRatio(val, min, max, invert) {
  if (val === undefined || val === null) return 0;
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  if (hi === lo) return 0;
  const ratio = (Math.max(lo, Math.min(hi, val)) - lo) / (hi - lo);
  return invert ? 1 - ratio : ratio;
}

/**
 * Called when the user adjusts deadzone sliders.
 * Calculates the new physical endpoints to write to device memory.
 */
function applyHardwareDeadzones(pedal, rawBounds, deadzones) {
  const overrides = {};
  const dist = (a, b) => Math.abs(b - a);

  if (pedal === "throttle" && rawBounds.throtl_min !== undefined) {
    const d = dist(rawBounds.throtl_min, rawBounds.throtl_max);
    overrides.throtl_min = Math.round(
      rawBounds.throtl_min + d * (deadzones.min / 100),
    );
    overrides.throtl_max = Math.round(
      rawBounds.throtl_max - d * (deadzones.max / 100),
    );
  } else if (pedal === "brake" && rawBounds.brake_min !== undefined) {
    const d = dist(rawBounds.brake_min, rawBounds.brake_max);
    overrides.brake_min = Math.round(
      rawBounds.brake_min + d * (deadzones.min / 100),
    );
    overrides.brake_max = Math.round(
      rawBounds.brake_max - d * (deadzones.max / 100),
    );
  } else if (pedal === "clutch" && rawBounds.clutch_min !== undefined) {
    const d = dist(rawBounds.clutch_min, rawBounds.clutch_max);
    overrides.clutch_min = Math.round(
      rawBounds.clutch_min + d * (deadzones.min / 100),
    );
    overrides.clutch_max = Math.round(
      rawBounds.clutch_max - d * (deadzones.max / 100),
    );
  }

  return overrides;
}

// Moza SR-P Lite Arduino sketch has no EEPROM save function implemented via Feature Reports yet
function decodeConfigStruct(buf) {
  return { ...DEFAULT_RAW_LIMITS };
}
function encodeConfigStruct(config) {
  return Buffer.alloc(17);
}

function readConfig(device) {
  return { ...DEFAULT_RAW_LIMITS };
}
function writeConfig(device, config) {
  // Not supported by device
}
function saveConfig(device) {
  // Not supported by device
}

/**
 * Maps a live input through the user's custom curve point array.
 */
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
