import {
  FIELD_TYPE_MAP,
  FieldType,
  SettingField,
} from "@shubham0x13/ffbeast-wheel-webhid-api";

/**
 * Global patch for the FFBeast Wheel library.
 *
 * This restores missing enum keys and type mappings for Pro features that
 * might be undefined due to library version drift or caching issues in the browser.
 */
export function patchLibrary() {
  // Patch SettingField enum IDs if they are missing at runtime
  const sf = SettingField as unknown as Record<
    string | number,
    number | string | undefined
  >;

  if (sf.DynamicDampeningStrength === undefined) {
    sf.DynamicDampeningStrength = 10;
    sf[10] = "DynamicDampeningStrength";
  }
  if (sf.PositionSmoothing === undefined) {
    sf.PositionSmoothing = 19;
    sf[19] = "PositionSmoothing";
  }
  if (sf.SpeedBufferSize === undefined) {
    sf.SpeedBufferSize = 20;
    sf[20] = "SpeedBufferSize";
  }
  if (sf.IntegratedSpringStrength === undefined) {
    sf.IntegratedSpringStrength = 43;
    sf[43] = "IntegratedSpringStrength";
  }

  // Patch the ID -> Binary Type mapping if missing
  // This is required for sendSetting() to correctly package the data
  const ftm = FIELD_TYPE_MAP as unknown as Record<
    number,
    FieldType | undefined
  >;

  ftm[10] ??= FieldType.Uint16;
  ftm[19] ??= FieldType.Uint8;
  ftm[20] ??= FieldType.Uint8;
  ftm[43] ??= FieldType.Uint8;

  // Flag as patched
  (window as unknown as Record<string, unknown>).__FFBEAST_PATCHED__ = true;
}
