const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("env", {
  DEV_MODE: process.env.NODE_ENV === "development",
});

const ALLOWED_INVOKE_CHANNELS = [
  "get-app-settings",
  "set-minimize-to-tray",
  "set-start-with-system",
  "save-profiles",
  "load-profiles",
  "save-preferences",
  "load-preferences",
  "select-exe-file",
  "get-running-processes",
  "set-recenter-shortcut",
  "submit-feedback",
  "pedals:getStatus",
  "pedals:getConfig",
  "pedals:setConfig",
  "pedals:saveConfig",
  "pedals:resetConfig",
  "pedals:getDefaults",
  "pedals:getReadme",
  "pedals:startDebugRecord",
  "pedals:stopDebugRecord",
  "pedals:listPlugins",
  "pedals:loadPlugin",
];

const ALLOWED_ON_CHANNELS = [
  "recenter-wheel",
  "pedals:connected",
  "pedals:disconnected",
  "pedals:liveData",
  "pedals:busyError",
];

contextBridge.exposeInMainWorld("electron", {
  invoke: (channel, ...args) => {
    if (ALLOWED_INVOKE_CHANNELS.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    return Promise.reject(new Error(`Unauthorized IPC channel: ${channel}`));
  },
  on: (channel, func) => {
    if (ALLOWED_ON_CHANNELS.includes(channel)) {
      const subscription = (_event, ...args) => func(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    }
  },
});
