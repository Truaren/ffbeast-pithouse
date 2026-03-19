/**
 * Centralized IPC channel names shared between renderer and preload.
 * Never use raw strings — always reference these constants.
 */
export const IPC = {
  // App settings (Electron window settings, tray, autostart)
  GET_APP_SETTINGS: "get-app-settings",
  SET_MINIMIZE_TO_TRAY: "set-minimize-to-tray",
  SET_START_WITH_SYSTEM: "set-start-with-system",

  // Profile persistence
  SAVE_PROFILES: "save-profiles",
  LOAD_PROFILES: "load-profiles",

  // App preferences persistence
  SAVE_PREFERENCES: "save-preferences",
  LOAD_PREFERENCES: "load-preferences",

  // Pedal / process
  SELECT_EXE_FILE: "select-exe-file",
  GET_RUNNING_PROCESSES: "get-running-processes",

  // Keybinding
  SET_RECENTER_SHORTCUT: "set-recenter-shortcut",

  // Feedback
  SUBMIT_FEEDBACK: "submit-feedback",

  // Pedals
  PEDALS_GET_STATUS: "pedals:getStatus",
  PEDALS_GET_CONFIG: "pedals:getConfig",
  PEDALS_SET_CONFIG: "pedals:setConfig",
  PEDALS_SAVE_CONFIG: "pedals:saveConfig",
  PEDALS_RESET_CONFIG: "pedals:resetConfig",
  PEDALS_GET_DEFAULTS: "pedals:getDefaults",
  PEDALS_GET_README: "pedals:getReadme",
  PEDALS_START_DEBUG_RECORD: "pedals:startDebugRecord",
  PEDALS_STOP_DEBUG_RECORD: "pedals:stopDebugRecord",
  PEDALS_LIST_PLUGINS: "pedals:listPlugins",
  PEDALS_LOAD_PLUGIN: "pedals:loadPlugin",
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];

export const IPC_LISTEN = {
  RECENTER_WHEEL: "recenter-wheel",
  PEDALS_CONNECTED: "pedals:connected",
  PEDALS_DISCONNECTED: "pedals:disconnected",
  PEDALS_LIVE_DATA: "pedals:liveData",
  PEDALS_BUSY_ERROR: "pedals:busyError",
} as const;

export type IpcListenChannel = (typeof IPC_LISTEN)[keyof typeof IPC_LISTEN];
