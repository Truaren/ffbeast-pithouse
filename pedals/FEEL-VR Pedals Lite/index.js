/**
 * FEEL-VR Pedals Plugin Module
 *
 * This file serves as the isolated hardware logic for the FEEL-VR Pedals.
 * The core application can load this module dynamically to interact with
 * the device without knowing its internal byte structure or mapping logic.
 */

// Basic hardware identification footprint to let the app know which device this module supports
const DEVICE_INFO = {
  vendorId: 0x0483, // 1155
  productId: 0xa2ea, // 41706
  name: "FEEL-VR Pedals Lite",
};

/**
 * DEFAULT_RAW_LIMITS
 * Hardware-specific physical defaults before calibration.
 * Throttle is inverted physically (resting = max, full = 0).
 */
const DEFAULT_RAW_LIMITS = {
  throtl_min: 0,
  throtl_max: 16384,
  brake_min: 0,
  brake_max: 16777216,
  clutch_min: 0,
  clutch_max: 16384,
};

/**
 * Parses the raw HID byte buffer into raw pedal values (axis1, axis2, axis3).
 * Native FEEL-VR bytes layout.
 */
function parseRaw(buf) {
  const safeU16 = (b, o) => (b.length >= o + 2 ? b.readUInt16LE(o) : 0);
  const safeU24 = (b, o) => (b.length >= o + 3 ? b.readUIntLE(o, 3) : 0);
  return {
    axis1: safeU16(buf, 1),
    axis2: safeU24(buf, 3),
    axis3: safeU16(buf, 7),
  };
}

/**
 * Parses raw HID telemetry byte buffers into normalized UI percentages (0 to 1).
 *
 * @param {Buffer} data - The raw HID input report from the device
 * @returns {Object} { throttle, brake, clutch } Normalized from 0.0 to 1.0
 */
function parseTelemetry(data) {
  // FEEL-VR uses bytes 4, 5, 6, 7 natively for Axes but our Node-HID `liveData`
  // unpacks it into `data.raw.axisX` already if passed through hid.js

  // Throttle is inverted physically (Resting = 16384, Pressed = 0)
  const throttle = calcRatio(data.raw.axis1, 0, 16384, true);
  const brake = calcRatio(data.raw.axis2, 0, 16777216, false);
  const clutch = calcRatio(data.raw.axis3, 0, 16384, false);

  return { throttle, brake, clutch };
}

/**
 * Internal Math Helper
 */
function calcRatio(val, min, max, invert) {
  let ratio = 0;
  if (max > min) {
    const clamped = Math.max(min, Math.min(max, val));
    ratio = (clamped - min) / (max - min);
  }
  return invert ? 1 - ratio : ratio;
}

/**
 * Calculates the exact physical hardware limits based on the user's Deadzone percentages.
 * The core application calls this when a user adjusts deadzone sliders.
 *
 * @param {String} pedal - 'throttle', 'brake', or 'clutch'
 * @param {Object} rawBounds - The 100% raw calibrated limits { throtl_min: 0, throtl_max: 16384... }
 * @param {Object} deadzones - The user's deadzone percentages e.g., { min: 25, max: 10 }
 * @returns {Object} A partial config object with the NEW physical min/max for that specific pedal.
 */
function applyHardwareDeadzones(pedal, rawBounds, deadzones) {
  const overrides = {};

  if (pedal === "throttle") {
    // Throttle is inverted physically. fullPress is min(0), resting is max(16384)
    const fullPress = rawBounds.throtl_min;
    const resting = rawBounds.throtl_max;
    const dist = resting - fullPress;

    // Min DZ shrinks from resting position
    overrides.throtl_max = Math.round(resting - dist * (deadzones.min / 100));
    // Max DZ shrinks from full press position
    overrides.throtl_min = Math.round(fullPress + dist * (deadzones.max / 100));
  } else if (pedal === "brake") {
    const resting = rawBounds.brake_min;
    const fullPress = rawBounds.brake_max;
    const dist = fullPress - resting;

    overrides.brake_min = Math.round(resting + dist * (deadzones.min / 100));
    overrides.brake_max = Math.round(fullPress - dist * (deadzones.max / 100));
  } else if (pedal === "clutch") {
    const resting = rawBounds.clutch_min;
    const fullPress = rawBounds.clutch_max;
    const dist = fullPress - resting;

    overrides.clutch_min = Math.round(resting + dist * (deadzones.min / 100));
    overrides.clutch_max = Math.round(fullPress - dist * (deadzones.max / 100));
  }

  return overrides;
}

/**
 * Decodes the Pedals Configuration binary payload sent by the device.
 *
 * @param {Buffer} buf - The 17+ byte Feature Report buffer
 * @returns {Object} The parsed config values
 */
function decodeConfigStruct(buf) {
  // Report 0x03 format:
  // buf[0] = 0x03
  // buf[1,2] = throtl_min (int16)
  // buf[3,4] = throtl_max (int16)
  // buf[5,6,7,8] = brake_min (int32)
  // buf[9,10,11,12] = brake_max (int32)
  // buf[13,14] = clutch_min (int16)
  // buf[15,16] = clutch_max (int16)
  return {
    throtl_min: buf.readInt16LE(1),
    throtl_max: buf.readInt16LE(3),
    brake_min: buf.readInt32LE(5),
    brake_max: buf.readInt32LE(9),
    clutch_min: buf.readInt16LE(13),
    clutch_max: buf.readInt16LE(15),
  };
}

/**
 * Encodes the Pedals Configuration into a binary payload matching the device struct.
 *
 * @param {Object} config - The JSON object block of config values
 * @returns {Buffer} A 17-byte buffer ready to be pushed via HID
 */
function encodeConfigStruct(config) {
  const buf = Buffer.alloc(17);
  buf[0] = 0x03; // Feature Report ID
  buf.writeInt16LE(config.throtl_min, 1);
  buf.writeInt16LE(config.throtl_max, 3);
  buf.writeInt32LE(config.brake_min, 5);
  buf.writeInt32LE(config.brake_max, 9);
  buf.writeInt16LE(config.clutch_min, 13);
  buf.writeInt16LE(config.clutch_max, 15);
  return buf;
}

/**
 * Reads the hardware configuration directly from the device.
 */
function readConfig(device) {
  const data = device.getFeatureReport(0x03, 17);
  return decodeConfigStruct(Buffer.from(data));
}

/**
 * Writes the configuration to the device dynamically.
 */
function writeConfig(device, config) {
  const buf = encodeConfigStruct(config);
  device.sendFeatureReport([...buf]);
}

/**
 * Saves the current configuration to EEPROM/Flash.
 */
function saveConfig(device) {
  // SAVE command: reportId=0x02, bytes=[0x03,0x00,0x00,0x00]
  const buf = Buffer.from([0x02, 0x03, 0x00, 0x00, 0x00]);
  device.sendFeatureReport([...buf]);
}

/**
 * Applies physical curve manipulation dynamically to the telemetry stream.
 *
 * @param {Array} pts - An array of [x, y] coordinates defining the curve (0.0 to 1.0)
 * @param {Number} xIn - The normalized raw pedal input (0.0 to 1.0)
 * @returns {Number} The newly mapped output percentage
 */
function applySoftwareCurve(pts, xIn) {
  if (xIn <= pts[0][0]) return pts[0][1];
  if (xIn >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];

  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    if (xIn >= p1[0] && xIn <= p2[0]) {
      const t = (xIn - p1[0]) / (p2[0] - p1[0]);
      return p1[1] + t * (p2[1] - p1[1]);
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
  applySoftwareCurve,
  readConfig,
  writeConfig,
  saveConfig,
};
