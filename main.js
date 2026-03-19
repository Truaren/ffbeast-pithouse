import {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  dialog,
  shell,
  globalShortcut,
} from "electron";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Logging Wrapper ---
const originalLog = console.log;
console.log = (...args) => {
  const prefs = loadPreferencesRawSync();
  if (prefs?.performance?.disableDebugLogging) return;
  originalLog.apply(console, args);
};
// Errors are never blocked

let mainWindow = null;
let tray = null;

const settingsPath = path.join(app.getPath("userData"), "settings.json");
const profilesPath = path.join(app.getPath("userData"), "profiles.json");
const preferencesPath = path.join(app.getPath("userData"), "preferences.json");

let isQuitting = false;

let appSettings = {
  minimizeToTray: false,
  startWithSystem: false,
};

// --- Performance / Compatibility Startup ---
try {
  if (fs.existsSync(preferencesPath)) {
    const data = fs.readFileSync(preferencesPath, "utf8");
    const prefs = JSON.parse(data);
    if (prefs.performance?.disableHardwareAcceleration) {
      app.disableHardwareAcceleration();
      console.log("[Main] Hardware acceleration disabled via preferences.");
    }
  }
} catch (err) {
  // Errors during early startup should be logged but not crash the app
  console.error(
    "[Main] Failed to read early preferences for HW Acceleration:",
    err,
  );
}

// Global Exception Handlers
process.on("uncaughtException", (err) => {
  console.error("[Main] Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[Main] Unhandled Rejection at:", promise, "reason:", reason);
});

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, "utf8");
      appSettings = { ...appSettings, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error("Failed to load settings:", err);
  }
}

function saveSettings() {
  const prefs = loadPreferencesRawSync();
  if (prefs?.performance?.forceAsyncFileOps) {
    fs.promises
      .writeFile(settingsPath, JSON.stringify(appSettings, null, 2))
      .catch((err) => console.error("[Main] Async save settings failed:", err));
  } else {
    try {
      fs.writeFileSync(settingsPath, JSON.stringify(appSettings, null, 2));
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  }
}

function getAppIcon() {
  return app.isPackaged
    ? path.join(__dirname, "dist", "logo.png")
    : path.join(__dirname, "public", "logo.png");
}

function createTray() {
  const iconPath = getAppIcon();
  const icon = nativeImage
    .createFromPath(iconPath)
    .resize({ width: 16, height: 16 });
  tray = new Tray(icon);

  const updateMenu = () => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: `FFBeast Pit House ${app.getVersion()}`,
        enabled: false,
      },
      { type: "separator" },
      {
        label: "Show",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);
    tray.setToolTip(`FFBeast Pit House ${app.getVersion()}`);
    tray.setContextMenu(contextMenu);
  };

  updateMenu();

  tray.on("double-click", () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: false,
    maximizable: false,
    icon: getAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.setMenu(null);

  // Disable right-click context menu
  mainWindow.webContents.on("context-menu", (e) => {
    e.preventDefault();
  });

  // Handle WebHID device requests automatically
  mainWindow.webContents.session.on(
    "select-hid-device",
    (event, details, callback) => {
      event.preventDefault();
      if (details.deviceList && details.deviceList.length > 0) {
        callback(details.deviceList[0].deviceId);
      } else {
        callback(null);
      }
    },
  );

  // Grant HID device permissions
  mainWindow.webContents.session.setPermissionCheckHandler(
    (webContents, permission) => {
      if (permission === "hid") return true;
      return false;
    },
  );

  mainWindow.webContents.session.setDevicePermissionHandler((details) => {
    if (details.deviceType === "hid") return true;
    return false;
  });

  // Handle close — minimize to tray if enabled
  mainWindow.on("close", (e) => {
    if (appSettings.minimizeToTray && !isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  // In development, load the Vite dev server
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
  }

  // Intercept all requests for new windows and route them to default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Log crashes
  mainWindow.webContents.on("render-process-gone", (event, details) => {
    console.error(
      `[Main] Render process gone. Reason: ${details.reason}, ExitCode: ${details.exitCode}`,
    );
  });

  mainWindow.on("unresponsive", () => {
    console.warn("[Main] Window became unresponsive.");
  });
}

// IPC: renderer asks for current settings
ipcMain.handle("get-app-settings", () => appSettings);

// IPC: select an executable file via dialog
ipcMain.handle("select-exe-file", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Select Game Executable",
    filters: [{ name: "Executables", extensions: ["exe"] }],
    properties: ["openFile"],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return path.basename(result.filePaths[0]);
  }
  return null;
});

// IPC: get running processes for Auto-Profiles
ipcMain.handle("get-running-processes", async () => {
  return new Promise((resolve) => {
    if (process.platform !== "win32") {
      resolve([]);
      return;
    }

    // Use tasklist to get running processes, output in CSV without headers
    exec("tasklist /fo csv /nh", (error, stdout) => {
      if (error) {
        console.error("Failed to list processes:", error);
        resolve([]);
        return;
      }

      const processes = new Set();
      // Parse CSV output: "Image Name","PID",...
      const lines = stdout.split("\n");
      for (const line of lines) {
        const parts = line.split('","');
        if (parts.length > 0) {
          let exeName = parts[0].replace('"', "").trim();
          if (exeName) {
            processes.add(exeName.toLowerCase());
          }
        }
      }
      resolve(Array.from(processes));
    });
  });
});

// IPC: renderer sets minimize-to-tray
ipcMain.handle("set-minimize-to-tray", (_event, value) => {
  appSettings.minimizeToTray = value;
  saveSettings();
});

// IPC: renderer sets start-with-system
ipcMain.handle("set-start-with-system", (_event, value) => {
  appSettings.startWithSystem = value;
  saveSettings();
  app.setLoginItemSettings({
    openAtLogin: value,
    name: "FFBeast Pit House 1.0",
  });
});

// IPC: profiles management
ipcMain.handle("save-profiles", async (_event, profiles) => {
  const prefs = loadPreferencesRawSync();
  if (prefs?.performance?.forceAsyncFileOps) {
    try {
      await fs.promises.writeFile(
        profilesPath,
        JSON.stringify(profiles, null, 2),
      );
      return { success: true };
    } catch (err) {
      console.error("Failed to save profiles (async):", err);
      return { success: false, error: err.message };
    }
  } else {
    try {
      fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
      return { success: true };
    } catch (err) {
      console.error("Failed to save profiles:", err);
      return { success: false, error: err.message };
    }
  }
});

ipcMain.handle("load-profiles", () => {
  try {
    if (fs.existsSync(profilesPath)) {
      const data = fs.readFileSync(profilesPath, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to load profiles:", err);
  }
  return null;
});

// IPC: app preferences management
ipcMain.handle("save-preferences", async (_event, preferences) => {
  const prefs = loadPreferencesRawSync();
  if (prefs?.performance?.forceAsyncFileOps) {
    try {
      await fs.promises.writeFile(
        preferencesPath,
        JSON.stringify(preferences, null, 2),
      );
      return { success: true };
    } catch (err) {
      console.error("Failed to save preferences (async):", err);
      return { success: false, error: err.message };
    }
  } else {
    try {
      fs.writeFileSync(preferencesPath, JSON.stringify(preferences, null, 2));
      return { success: true };
    } catch (err) {
      console.error("Failed to save preferences:", err);
      return { success: false, error: err.message };
    }
  }
});

ipcMain.handle("load-preferences", () => {
  try {
    if (fs.existsSync(preferencesPath)) {
      const data = fs.readFileSync(preferencesPath, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to load preferences:", err);
  }
  return null;
});

// IPC: submit feedback to avoid CORS issues in renderer
ipcMain.handle("submit-feedback", async (_event, data) => {
  try {
    const { net } = require("electron");
    return new Promise((resolve) => {
      const request = net.request({
        method: "POST",
        url: "https://formsubmit.co/ajax/trueaaren@gmail.com",
      });

      request.setHeader("Content-Type", "application/json");
      request.setHeader("Accept", "application/json");

      let responseData = "";

      request.on("response", (response) => {
        response.on("data", (chunk) => {
          responseData += chunk.toString();
        });

        response.on("end", () => {
          resolve({
            ok: response.statusCode >= 200 && response.statusCode < 300,
            status: response.statusCode,
            data: responseData,
          });
        });
      });

      request.on("error", (error) => {
        resolve({ ok: false, error: error.message });
      });

      request.write(JSON.stringify(data));
      request.end();
    });
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ─── PEDALS HID SYSTEM ────────────────────────────────────────────────────────
// Uses node-hid to talk to FEEL-VR Pedals, loading protocol from pedals/index.js

const _require = createRequire(import.meta.url);

let HID = null;
try {
  HID = _require("node-hid");
} catch (e) {
  console.warn("[Pedals] node-hid not available:", e.message);
}

// ─── Pedal Hardware Logic ──────────────────────────────────────────────────────

let hidConnected = false;
let configDevice = null;
let joystickDevice = null;
let liveDataInterval = null;
let reconnectInterval = null;
let currentPedalConfig = null;

let reconnectAttempts = 0;
let isSafeState = false; // If true, stop all device operations

let isDebugRecording = false;
let debugRecordingData = [];
let debugRecordingStartTime = 0;

// Dynamic Pedal Plugin System
let pedalPlugin = null; // Currently loaded pedals module
const DEFAULT_PLUGIN_ID = "FEEL-VR Pedals Lite"; // The folder name to load by default

// We'll require the default plugin on startup if it exists
// loadPluginById is hoisted so we can call it here, but let's push the call into a function or do it inline safely:
try {
  // Try loading default plugin right away using the hoisted function
  pedalPlugin = loadPluginById(DEFAULT_PLUGIN_ID);
  if (pedalPlugin) {
    console.log(
      "[Pedals] Default Plugin loaded:",
      pedalPlugin.DEVICE_INFO?.name,
    );
  }
} catch (e) {
  console.log("[Pedals] Failed to load default plugin:", e.message);
}

const FEEL_VR_VID = 0x0483; // fallback
const FEEL_VR_PID = 0xa2ea; // fallback
const REPORT_ID_CONFIG = 0x03;
const CONFIG_REPORT_SIZE = 17;

function sendToRenderer(channel, data) {
  const wins = BrowserWindow.getAllWindows();
  const win = wins.length > 0 ? wins[0] : null;
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, data);
  }
}

function findHidDevices() {
  if (!HID) return { config: null, joystick: null };
  const targetVID = pedalPlugin?.DEVICE_INFO?.vendorId ?? 0x0483; // fallback 0x0483
  const targetPID = pedalPlugin?.DEVICE_INFO?.productId ?? 0xa2ea; // fallback 0xA2EA

  try {
    const devices = HID.devices(targetVID, targetPID);
    if (devices.length === 0) {
      // Try scanning all devices to find by VID/PID regardless
      const all = HID.devices();
      const matched = all.filter(
        (d) => d.vendorId === targetVID && d.productId === targetPID,
      );
      if (matched.length > 0) {
        console.log(
          "[Pedals] Found via full scan:",
          matched.map((d) => `usagePage=${d.usagePage} path=${d.path}`),
        );
        devices.push(...matched);
      }
    }
    // Joystick: usagePage 0x01 preferred, else any
    let joystick = devices.find((d) => d.usagePage === 0x01) || null;
    // Config: usagePage 0xFF00 preferred, else any non-joystick
    let config =
      devices.find((d) => d.usagePage === 0xff00) ||
      devices.find((d) => d.usagePage !== 0x01) ||
      null;
    // Fallback: if only one interface found, use it for both
    if (!joystick && devices.length > 0) joystick = devices[0];
    if (!config && devices.length > 1) config = devices[1];
    if (devices.length > 0) {
      console.log(
        `[Pedals] Interfaces found: ${devices.length}, joy=${joystick?.usagePage}, cfg=${config?.usagePage}`,
      );
    }
    return { config, joystick };
  } catch (e) {
    return { config: null, joystick: null };
  }
}

function openConfigDevice(info) {
  try {
    const dev = new HID.HID(info.path);
    dev.on("error", (e) => {
      console.warn("[Pedals] Config device error:", e.message);
      configDevice = null;
    });
    return dev;
  } catch (e) {
    console.warn("[Pedals] Cannot open config interface:", e.message);
    return null;
  }
}

function openJoystickDevice(info) {
  // Try exclusive first, then shared (Windows allows shared for usagePage 0x01)
  try {
    const dev = new HID.HID(info.path);
    dev.on("error", (e) => {
      console.warn("[Pedals] Joystick device error:", e.message);
      joystickDevice = null;
    });
    console.log("[Pedals] Joystick opened (exclusive)");
    return dev;
  } catch (e) {
    console.warn("[Pedals] Exclusive open failed:", e.message);
    // Try with nonExclusive flag (node-hid >= 2.1 supports this on some platforms)
    try {
      const dev = new HID.HID({ path: info.path, exclusive: false });
      dev.on("error", (er) => {
        joystickDevice = null;
      });
      console.log("[Pedals] Joystick opened (non-exclusive)");
      return dev;
    } catch (e2) {
      console.error(
        "[Pedals] Cannot open joystick interface (device busy?):",
        e2.message,
      );
      console.error("[Pedals] → Close the FEEL-VR Control app and try again");
      sendToRenderer("pedals:busyError", {
        message: "Device busy — close FEEL-VR Control app",
      });
      return null;
    }
  }
}

function tryConnectPedals() {
  if (hidConnected || !HID || isSafeState) return;
  const { config, joystick } = findHidDevices();
  if (!joystick) return;

  joystickDevice = openJoystickDevice(joystick);
  if (config) configDevice = openConfigDevice(config);

  if (joystickDevice) {
    hidConnected = true;
    reconnectAttempts = 0; // Reset backoff on success
    // Use plugin DEVICE_INFO.name if available, otherwise fall back to HID product name
    const name =
      pedalPlugin?.DEVICE_INFO?.name ??
      config?.product ??
      joystick?.product ??
      "FEEL-VR Pedals";
    sendToRenderer("pedals:connected", { name });
    console.log("[Pedals] Connected:", name);
    startLivePolling();
  }
}

function disconnectPedals() {
  hidConnected = false;
  stopLivePolling();
  if (joystickDevice) {
    try {
      joystickDevice.close();
    } catch (_) {}
    joystickDevice = null;
  }
  if (configDevice) {
    try {
      configDevice.close();
    } catch (_) {}
    configDevice = null;
  }
  sendToRenderer("pedals:disconnected", {});
  console.log("[Pedals] Disconnected");
}

function startLivePolling() {
  if (liveDataInterval) return;
  liveDataInterval = setInterval(() => {
    if (!joystickDevice) {
      disconnectPedals();
      return;
    }
    try {
      const data = joystickDevice.readTimeout(0);
      if (!data || data.length === 0) return;
      const buf = Buffer.from(data);

      let throttleRaw = 0,
        brakeRaw = 0,
        clutchRaw = 0;

      if (typeof pedalPlugin?.parseRaw === "function") {
        // Plugin handles raw HID parsing directly
        const parsed = pedalPlugin.parseRaw(buf);
        throttleRaw = parsed.axis1 ?? 0;
        brakeRaw = parsed.axis2 ?? 0;
        clutchRaw = parsed.axis3 ?? 0;
      } else {
        // Fallback: Default FEEL-VR Pedals parsing
        const safeU16 = (b, o) => (b.length >= o + 2 ? b.readUInt16LE(o) : 0);
        const safeU24 = (b, o) => (b.length >= o + 3 ? b.readUIntLE(o, 3) : 0);
        throttleRaw = safeU16(buf, 1);
        brakeRaw = safeU24(buf, 3);
        clutchRaw = safeU16(buf, 7);
      }

      const rawData = { axis1: throttleRaw, axis2: brakeRaw, axis3: clutchRaw };
      let telemetry = { throttle: 0, brake: 0, clutch: 0 };
      if (typeof pedalPlugin?.parseTelemetry === "function") {
        const parsedTel = pedalPlugin.parseTelemetry(
          { raw: rawData },
          currentPedalConfig,
        );
        telemetry.throttle = parsedTel.throttle ?? 0;
        telemetry.brake = parsedTel.brake ?? 0;
        telemetry.clutch = parsedTel.clutch ?? 0;
      } else {
        // Fallback logic
        const calcRatio = (val, min, max, invert) => {
          let ratio = 0;
          if (max > min) {
            const clamped = Math.max(min, Math.min(max, val));
            ratio = (clamped - min) / (max - min);
          }
          return invert ? 1 - ratio : ratio;
        };
        telemetry.throttle = calcRatio(throttleRaw, 0, 16384, true);
        telemetry.brake = calcRatio(brakeRaw, 0, 16777216, false);
        telemetry.clutch = calcRatio(clutchRaw, 0, 16384, false);
      }

      if (isDebugRecording) {
        debugRecordingData.push({
          time: Date.now() - debugRecordingStartTime,
          raw: rawData,
          telemetry: telemetry,
        });
      }

      // --- Throttling Logic ---
      const prefs = loadPreferencesRawSync();
      if (prefs?.performance?.reduceInputPolling) {
        const now = Date.now();
        if (!startLivePolling.lastEmit) startLivePolling.lastEmit = 0;
        if (now - startLivePolling.lastEmit < 16) return; // Limit to ~60Hz
        startLivePolling.lastEmit = now;
      }

      sendToRenderer("pedals:liveData", {
        raw: rawData,
        throttle: throttleRaw,
        brake: brakeRaw,
        clutch: clutchRaw,
        telemetry: telemetry,
      });
    } catch (e) {
      console.error("[Pedals] Critical polling error:", e.message);
      joystickDevice = null;
      disconnectPedals();

      // If error is critical (not just a disconnect), move to safe state
      if (e.message.includes("could not read") || e.message.includes("fatal")) {
        console.error("[Pedals] Moving to Safe State due to critical error.");
        isSafeState = true;
      }
    }
  }, 16); // ~60fps
}

function stopLivePolling() {
  if (liveDataInterval) {
    clearInterval(liveDataInterval);
    liveDataInterval = null;
  }
}

function startReconnectLoop() {
  if (reconnectInterval) clearInterval(reconnectInterval);

  const tick = () => {
    if (isSafeState) return;

    const prefs = loadPreferencesRawSync();
    if (!hidConnected) {
      if (prefs?.performance?.enableDeviceReconnect) {
        reconnectAttempts++;
        const backoff = Math.min(Math.pow(2, reconnectAttempts) * 500, 10000); // Max 10s
        console.log(
          `[Pedals] Attempting reconnect ${reconnectAttempts} (backoff: ${backoff}ms)...`,
        );
        tryConnectPedals();
        setTimeout(tick, backoff);
      } else {
        tryConnectPedals();
        setTimeout(tick, 1500); // Default 1.5s
      }
    } else {
      setTimeout(tick, 1500);
    }
  };

  tick();
}

function loadPreferencesRawSync() {
  try {
    if (fs.existsSync(preferencesPath)) {
      return JSON.parse(fs.readFileSync(preferencesPath, "utf-8"));
    }
  } catch (e) {
    return null;
  }
  return null;
}

// ─── Pedals IPC handlers ─────────────────────────────────────────────────────

ipcMain.handle("pedals:getStatus", () => ({
  connected: hidConnected,
  plugin: pedalPlugin
    ? {
        name: pedalPlugin.DEVICE_INFO?.name,
        vendorId: pedalPlugin.DEVICE_INFO?.vendorId,
        productId: pedalPlugin.DEVICE_INFO?.productId,
      }
    : null,
}));

ipcMain.handle("pedals:getConfig", () => {
  if (!configDevice || !pedalPlugin)
    return { success: false, error: "Config interface not open" };
  try {
    if (typeof pedalPlugin.readConfig === "function") {
      const config = pedalPlugin.readConfig(configDevice);
      currentPedalConfig = config;
      return { success: true, config };
    }
    return { success: false, error: "Not supported by plugin" };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("pedals:setConfig", (_event, cfg) => {
  currentPedalConfig = cfg;
  if (!configDevice || !pedalPlugin)
    return { success: false, error: "Not available" };
  try {
    if (typeof pedalPlugin.writeConfig === "function") {
      pedalPlugin.writeConfig(configDevice, cfg);
      return { success: true };
    }
    return { success: false, error: "Not supported by plugin" };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("pedals:saveConfig", () => {
  if (!configDevice || !pedalPlugin) return { success: false };
  try {
    if (typeof pedalPlugin.saveConfig === "function") {
      pedalPlugin.saveConfig(configDevice);
      return { success: true };
    }
    return { success: false, error: "Not supported by plugin" };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("pedals:resetConfig", () => {
  if (!pedalPlugin) return { success: false };
  const defaults = pedalPlugin.DEFAULT_RAW_LIMITS;
  return { success: true, config: defaults };
});

ipcMain.handle("pedals:getDefaults", () => {
  return pedalPlugin ? pedalPlugin.DEFAULT_RAW_LIMITS : null;
});

ipcMain.handle("pedals:getReadme", () => {
  try {
    const readmePath = path.join(getPedalsDir(), "README.md");
    if (fs.existsSync(readmePath)) {
      return { success: true, content: fs.readFileSync(readmePath, "utf-8") };
    }
    return {
      success: false,
      error: "README.md not found in the pedals folder.",
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Debug Recording Handlers
ipcMain.handle("pedals:startDebugRecord", () => {
  if (!hidConnected) return { success: false, error: "Pedals not connected" };
  debugRecordingData = [];
  debugRecordingStartTime = Date.now();
  isDebugRecording = true;
  return { success: true };
});

ipcMain.handle("pedals:stopDebugRecord", async () => {
  if (!isDebugRecording) return { success: false, error: "Not recording" };
  isDebugRecording = false;

  if (debugRecordingData.length === 0) {
    return { success: false, error: "No data recorded" };
  }

  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Save Pedal Debug Data",
    defaultPath: `pedal_debug_${Date.now()}.txt`,
    filters: [{ name: "Text Files", extensions: ["txt"] }],
  });

  if (result.canceled || !result.filePath) {
    debugRecordingData = []; // clear memory
    return { success: false, error: "Cancelled by user" };
  }

  try {
    let output =
      "TimeMs\tThrottleRaw\tBrakeRaw\tClutchRaw\tThrottleRatio\tBrakeRatio\tClutchRatio\n";
    for (const d of debugRecordingData) {
      output += `${d.time}\t${d.raw.axis1}\t${d.raw.axis2}\t${d.raw.axis3}\t${d.telemetry.throttle.toFixed(4)}\t${d.telemetry.brake.toFixed(4)}\t${d.telemetry.clutch.toFixed(4)}\n`;
    }
    fs.writeFileSync(result.filePath, output, "utf-8");
    debugRecordingData = []; // clear memory
    return { success: true, filePath: result.filePath };
  } catch (err) {
    debugRecordingData = [];
    return { success: false, error: err.message };
  }
});

// Helper to locate the pedals directory depending on the environment
function getPedalsDir() {
  let dir;
  if (app.isPackaged) {
    // When installed/packaged, extraFiles puts 'pedals' next to the executable
    dir = path.join(path.dirname(app.getPath("exe")), "pedals");
  } else {
    dir = path.join(__dirname, "pedals");
  }

  if (fs.existsSync(dir)) {
    return dir;
  }

  // Fallback for some dev environments or odd builds
  const fallback = path.join(process.cwd(), "pedals");
  if (fs.existsSync(fallback)) {
    return fallback;
  }

  console.warn(`[Pedals] Pedals directory NOT found at: ${dir} or ${fallback}`);
  return dir;
}

// Load a plugin module by id ("pedals" = root, or subfolder name)
function loadPluginById(id) {
  try {
    const pedalsDir = getPedalsDir();

    // Sub-folder plugin: look for index.cjs or index.js
    const subCjs = path.join(pedalsDir, id, "index.cjs");
    const subIdx = path.join(pedalsDir, id, "index.js");
    let pluginPath = fs.existsSync(subCjs) ? subCjs : subIdx;

    if (!fs.existsSync(pluginPath)) {
      throw new Error(`Plugin entry not found in ${id}`);
    }

    // Bust require cache so fresh module is loaded
    delete _require.cache?.[_require.resolve(pluginPath)];
    return _require(pluginPath);
  } catch (e) {
    console.error(`[Pedals] loadPluginById(${id}) failed:`, e.message);
    return null;
  }
}

ipcMain.handle("pedals:listPlugins", () => {
  try {
    const pedalsDir = getPedalsDir();
    const plugins = [];

    // Subfolders with index.js or index.cjs
    if (!fs.existsSync(pedalsDir)) return plugins;

    const entries = fs.readdirSync(pedalsDir, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const idxPathJs = path.join(pedalsDir, e.name, "index.js");
      const idxPathCjs = path.join(pedalsDir, e.name, "index.cjs");
      if (!fs.existsSync(idxPathJs) && !fs.existsSync(idxPathCjs)) continue;

      try {
        const p = loadPluginById(e.name);
        plugins.push({
          id: e.name,
          name: p?.DEVICE_INFO?.name ?? e.name,
          vendorId: p?.DEVICE_INFO?.vendorId,
          productId: p?.DEVICE_INFO?.productId,
          isDefault: e.name === DEFAULT_PLUGIN_ID,
        });
      } catch (_) {
        plugins.push({
          id: e.name,
          name: e.name,
          isDefault: e.name === DEFAULT_PLUGIN_ID,
        });
      }
    }
    return plugins;
  } catch (e) {
    return [];
  }
});

ipcMain.handle("pedals:loadPlugin", (_event, pluginId) => {
  try {
    const newPlugin = loadPluginById(pluginId);
    if (!newPlugin)
      return { success: false, error: "Plugin not found: " + pluginId };

    // Swap active plugin
    pedalPlugin = newPlugin;
    const info = pedalPlugin.DEVICE_INFO;
    const name = info?.name ?? "FEEL-VR Pedals";
    console.log("[Pedals] Plugin switched to:", name);

    // Reconnect if currently connected (device might differ)
    if (hidConnected) {
      disconnectPedals();
      setTimeout(() => {
        tryConnectPedals();
        if (hidConnected) {
          sendToRenderer("pedals:connected", { name });
        }
      }, 500);
    } else {
      // Not connected — try to connect with the new plugin
      // Update VID/PID globally so reconnect loop uses the right ones
      tryConnectPedals();
    }

    return {
      success: true,
      name,
      vendorId: info?.vendorId,
      productId: info?.productId,
      connected: hidConnected,
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    // IPC: Set global shortcut for recentering (only after app is ready)
    let currentRecenterAccelerator = null;
    ipcMain.handle("set-recenter-shortcut", (event, accelerator) => {
      if (currentRecenterAccelerator) {
        globalShortcut.unregister(currentRecenterAccelerator);
        currentRecenterAccelerator = null;
      }
      if (accelerator) {
        try {
          const success = globalShortcut.register(accelerator, () => {
            sendToRenderer("recenter-wheel", {});
          });
          if (success) {
            currentRecenterAccelerator = accelerator;
            return { success: true };
          }
          return {
            success: false,
            error: "Failed to register shortcut. May be invalid or in use.",
          };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      return { success: true };
    });

    app.on("will-quit", () => {
      // Unregister all shortcuts.
      if (app.isReady()) {
        globalShortcut.unregisterAll();
      }
    });

    loadSettings();
    createWindow();
    createTray();
    startReconnectLoop(); // Keep retrying every 1.5s

    // Once the renderer has fully loaded, attempt connect and re-notify if already connected
    // (so the renderer can load config immediately on startup)
    mainWindow.webContents.once("did-finish-load", () => {
      tryConnectPedals();
      // If already connected from a previous fast attempt, re-send connected event
      if (hidConnected) {
        const name = pedalPlugin?.DEVICE_INFO?.name ?? "FEEL-VR Pedals";
        sendToRenderer("pedals:connected", { name });
      }
    });

    app.on("activate", function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("window-all-closed", function () {
  if (process.platform !== "darwin" && !appSettings.minimizeToTray) app.quit();
});
