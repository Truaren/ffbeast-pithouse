import {
  type DeviceSettings,
  SettingField,
} from "@shubham0x13/ffbeast-wheel-webhid-api";

type DeviceSettingEntry = {
  [S in keyof DeviceSettings]: {
    scope: S;
    key: keyof DeviceSettings[S];
  };
}[keyof DeviceSettings];

/**
 * Mapping from firmware SettingField → DeviceSettings location
 *
 * - scope  : top-level group in DeviceSettings
 * - key    : property inside that scope
 */
export const DEVICE_SETTINGS_MAP: Partial<
  Record<SettingField, DeviceSettingEntry>
> = {
  /* ==============================
   * Effect Settings
   * ============================== */

  [SettingField.MotionRange]: {
    scope: "effects",
    key: "motionRange",
  },

  [SettingField.StaticDampeningStrength]: {
    scope: "effects",
    key: "staticDampeningStrength",
  },

  [SettingField.SoftStopDampeningStrength]: {
    scope: "effects",
    key: "softStopDampeningStrength",
  },

  [SettingField.TotalEffectStrength]: {
    scope: "effects",
    key: "totalEffectStrength",
  },

  [SettingField.IntegratedSpringStrength]: {
    scope: "effects",
    key: "integratedSpringStrength",
  },

  [SettingField.SoftStopRange]: {
    scope: "effects",
    key: "softStopRange",
  },

  [SettingField.SoftStopStrength]: {
    scope: "effects",
    key: "softStopStrength",
  },

  [SettingField.DirectXConstantDirection]: {
    scope: "effects",
    key: "directXConstantDirection",
  },

  [SettingField.DirectXSpringStrength]: {
    scope: "effects",
    key: "directXSpringStrength",
  },

  [SettingField.DirectXConstantStrength]: {
    scope: "effects",
    key: "directXConstantStrength",
  },

  [SettingField.DirectXPeriodicStrength]: {
    scope: "effects",
    key: "directXPeriodicStrength",
  },

  /* ==============================
   * Hardware Settings
   * ============================== */

  [SettingField.EncoderCPR]: {
    scope: "hardware",
    key: "encoderCPR",
  },

  [SettingField.IGain]: {
    scope: "hardware",
    key: "integralGain",
  },

  [SettingField.PGain]: {
    scope: "hardware",
    key: "proportionalGain",
  },

  [SettingField.ForceEnabled]: {
    scope: "hardware",
    key: "forceEnabled",
  },

  [SettingField.DebugTorque]: {
    scope: "hardware",
    key: "debugTorque",
  },

  [SettingField.AmplifierGain]: {
    scope: "hardware",
    key: "amplifierGain",
  },

  [SettingField.CalibrationMagnitude]: {
    scope: "hardware",
    key: "calibrationMagnitude",
  },

  [SettingField.CalibrationSpeed]: {
    scope: "hardware",
    key: "calibrationSpeed",
  },

  [SettingField.PowerLimit]: {
    scope: "hardware",
    key: "powerLimit",
  },

  [SettingField.BrakingLimit]: {
    scope: "hardware",
    key: "brakingLimit",
  },

  [SettingField.PositionSmoothing]: {
    scope: "hardware",
    key: "positionSmoothing",
  },

  [SettingField.SpeedBufferSize]: {
    scope: "hardware",
    key: "speedBufferSize",
  },

  [SettingField.EncoderDirection]: {
    scope: "hardware",
    key: "encoderDirection",
  },

  [SettingField.ForceDirection]: {
    scope: "hardware",
    key: "forceDirection",
  },

  [SettingField.PolePairs]: {
    scope: "hardware",
    key: "polePairs",
  },

  /* ==============================
   * ADC Settings (Array-based)
   * ============================== */

  [SettingField.AdcMinDeadZone]: {
    scope: "adc",
    key: "rAxisMin",
  },

  [SettingField.AdcMaxDeadZone]: {
    scope: "adc",
    key: "rAxisMax",
  },

  [SettingField.AdcSmoothing]: {
    scope: "adc",
    key: "rAxisSmoothing",
  },

  [SettingField.AdcToButtonLow]: {
    scope: "adc",
    key: "rAxisToButtonLow",
  },

  [SettingField.AdcToButtonHigh]: {
    scope: "adc",
    key: "rAxisToButtonHigh",
  },

  [SettingField.AdcInvert]: {
    scope: "adc",
    key: "rAxisInvert",
  },

  /* ==============================
   * GPIO Settings
   * ============================== */

  [SettingField.ExtensionMode]: {
    scope: "gpio",
    key: "extensionMode",
  },

  [SettingField.PinMode]: {
    scope: "gpio",
    key: "pinMode",
  },

  [SettingField.ButtonMode]: {
    scope: "gpio",
    key: "buttonMode",
  },

  [SettingField.SpiMode]: {
    scope: "gpio",
    key: "spiMode",
  },

  [SettingField.SpiLatchMode]: {
    scope: "gpio",
    key: "spiLatchMode",
  },

  [SettingField.SpiLatchDelay]: {
    scope: "gpio",
    key: "spiLatchDelay",
  },

  [SettingField.SpiClkPulseLength]: {
    scope: "gpio",
    key: "spiClkPulseLength",
  },
};
