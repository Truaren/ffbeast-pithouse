import type { DeviceSettings } from "@shubham0x13/ffbeast-wheel-webhid-api";

import wheelImage from "@/assets/default_wheel.png";
import type { AppPreferences } from "@/types";

export const AUTO_IMAGE_CROP_ALPHA_THRESHOLD = 5;

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  theme: "dark",
  wheelImageUrl: wheelImage,
  wheelName: "FSR V2 Steering Wheel",
  baseName: "R12 Base",
  baseImageUrl: "", // Empty so it uses icon fallback or user can upload
  pedalDeviceId: "",
  pedalName: "Feel VR Pedals",
  pedalImageUrl: "",
  hiddenPedals: [],
  invertedPedals: [],
  pedalBindings: {
    Throttle: 0,
    Brake: 1,
    Clutch: 2,
  },
  autoCheckUpdates: true,
  autoProfiles: [],
  isPro: false,
};

export const PROFILE_EXPORT_VERSION = 1;
export const MAX_PROFILE_SLOTS = 10;

export const DEFAULT_EFFECT_SETTINGS: DeviceSettings["effects"] = {
  motionRange: 900,
  staticDampeningStrength: 0,
  softStopDampeningStrength: 0,
  totalEffectStrength: 100,
  integratedSpringStrength: 0,
  softStopRange: 10,
  softStopStrength: 100,
  directXConstantDirection: -1,
  directXSpringStrength: 100,
  directXConstantStrength: 100,
  directXPeriodicStrength: 100,
};

const DEFAULT_HARDWARE_SETTINGS: DeviceSettings["hardware"] = {
  encoderCPR: 4096,
  integralGain: 100,
  proportionalGain: 10,
  forceEnabled: 0,
  debugTorque: 0,
  amplifierGain: 0,
  calibrationMagnitude: 5,
  calibrationSpeed: 100,
  powerLimit: 0,
  brakingLimit: 0,
  positionSmoothing: 0,
  speedBufferSize: 2,
  encoderDirection: -1,
  forceDirection: -1,
  polePairs: 15,
};

const DEFAULT_ADC_SETTINGS: DeviceSettings["adc"] = {
  rAxisMin: [],
  rAxisMax: [],
  rAxisSmoothing: [],
  rAxisToButtonLow: [],
  rAxisToButtonHigh: [],
  rAxisInvert: [],
};

const DEFAULT_GPIO_SETTINGS: DeviceSettings["gpio"] = {
  extensionMode: 0,
  pinMode: [],
  buttonMode: [],
  spiMode: 0,
  spiLatchMode: 0,
  spiLatchDelay: 0,
  spiClkPulseLength: 0,
};

export const DEFAULT_DEVICE_SETTINGS: DeviceSettings = {
  effects: DEFAULT_EFFECT_SETTINGS,
  hardware: DEFAULT_HARDWARE_SETTINGS,
  adc: DEFAULT_ADC_SETTINGS,
  gpio: DEFAULT_GPIO_SETTINGS,
};
