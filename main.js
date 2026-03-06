import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog, shell } from "electron";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(appSettings, null, 2));
  } catch (err) {
    console.error("Failed to save settings:", err);
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
      nodeIntegration: true,
      contextIsolation: false,
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
          let exeName = parts[0].replace('"', '').trim();
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
ipcMain.handle("save-profiles", (_event, profiles) => {
  try {
    fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
    return { success: true };
  } catch (err) {
    console.error("Failed to save profiles:", err);
    return { success: false, error: err.message };
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
ipcMain.handle("save-preferences", (_event, preferences) => {
  try {
    fs.writeFileSync(preferencesPath, JSON.stringify(preferences, null, 2));
    return { success: true };
  } catch (err) {
    console.error("Failed to save preferences:", err);
    return { success: false, error: err.message };
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
    loadSettings();
    createWindow();
    createTray();

    app.on("activate", function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("window-all-closed", function () {
  if (process.platform !== "darwin" && !appSettings.minimizeToTray) app.quit();
});
