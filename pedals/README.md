# Pedal Plugin System Architecture

This directory (`FeelVRPedalsOne`) contains an extracted, hardware-agnostic module mapping the proprietary physics, protocols, and limits of the FEEL-VR Pedals into a clean JavaScript API.

To make this application work "out of the box" with **different pedals** from other manufacturers, you simply need to create a new folder (e.g., `MozaSRPLite`) alongside this one, and expose a file (`index.js`) that exports the following specific functions and schemas. The core application will then be able to load your module, connect to the new pedals, and instantly provide calibration, curves, and deadzones.

---

## Required Module Exports

Any new pedal integration MUST export the following interface in its `index.js`.

### 1. `DEVICE_INFO` (Object)

Provides the USB identifiers so the application knows when the hardware is connected.

```javascript
const DEVICE_INFO = {
  vendorId: 0x0483, // Your Vendor ID (Decimal or Hex)
  productId: 0xa32a, // Your Product ID
  name: "Manufacturer Model Name",
};
```

### 2. `DEFAULT_RAW_LIMITS` (Object)

The factory-reset bounds of the pedals. The application uses these when the user chooses "Reset to Defaults".

```javascript
const DEFAULT_RAW_LIMITS = {
  throtl_min: 0,
  throtl_max: 16384,
  brake_min: 0,
  brake_max: 16777216,
  clutch_min: 0,
  clutch_max: 16384,
};
```

### 3. `decodeConfigStruct(buffer)` (Function)

Accepts the raw binary `Buffer` sent from the device's Feature Report, and decodes it into a JSON object of limits.

- **Input:** `Buffer` (e.g., 17 bytes)
- **Returns:** `Object` (matching the keys in `DEFAULT_RAW_LIMITS`)

### 4. `encodeConfigStruct(configObject)` (Function)

Performs the inverse of decoding. Accepts the JSON config limits from the App State, and packs them into a binary `Buffer` exactly as the device's microprocessor expects it.

- **Input:** `Object` (e.g., `{ throtl_min: 0, throtl_max: 16384... }`)
- **Returns:** `Buffer`

### 5. `parseTelemetry(buffer)` (Function)

Every 16ms, the device sends a raw Input Report (telemetry) detailing the physical angle of the pedals. This function must unpack those bytes and normalize them into percentages from `0.0` (unpressed) to `1.0` (fully pressed).

- **Input:** `Buffer` (or parsed object if already separated by `node-hid`)
- **Returns:** `{ throttle: Number, brake: Number, clutch: Number }` (All floats between `0.0` and `1.0`)

### 6. `applyHardwareDeadzones(pedalName, rawConfigBounds, deadzonePercents)` (Function)

Because some pedals (like FEEL-VR and Moza) apply limits _in hardware memory_ to get higher resolution, the deadzones must literally overwrite the physical endpoints on the PCB.

- **Input:**
  - `pedalName`: string (`'throttle'`, `'brake'`, or `'clutch'`)
  - `rawConfigBounds`: Object (The absolute 100% stroke limits recorded during calibration)
  - `deadzonePercents`: Object `{ min: Number, max: Number }` (e.g., `min: 25`, `max: 5`)
- **Returns:** An object containing _only_ the new physical `_min` and `_max` values for that specific pedal.
- **Note on Inverted Hardware:** If a pedal's resting state is physically reading a huge number (e.g. 16384) and full-press is 0, this function MUST handle that math backwards (meaning a 10% Min Deadzone shrinks from 16384 down to ~14700).

### 7. `applySoftwareCurve(pointsArray, inputValue)` (Function)

Takes the current live telemetry percentage (0.0 to 1.0) and translates it through the user's custom Bézier/Spline curve mapped in the UI.

- **Input:**
  - `pointsArray`: `[ [x1, y1], [x2, y2]... ]` (Array of arrays defining dot coordinates)
  - `inputValue`: Number (`0.0` to `1.0`)
- **Returns:** Number (The new re-mapped output percentage, `0.0` to `1.0`)

---

## Integration

By isolating this code, the `app.js` renderer and `hid.js` background service no longer need to hardcode `0x0483`. Instead, the application will simply iterate through an array of supported plugins:

```javascript
// Example pseudo-code in future main.js
const FeelVR = require("./FeelVRPedalsOne");
const MozaSRP = require("./MozaSRPLite");

const SUPPORTED_DEVICES = [FeelVR, MozaSRP];

// On USB connect, find the matching plugin
const activePlugin = SUPPORTED_DEVICES.find(
  (p) => p.DEVICE_INFO.vendorId === connectedVid,
);
```
