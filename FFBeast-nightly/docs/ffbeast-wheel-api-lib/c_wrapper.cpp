#include "wheel_api.h"
#include <cstring> /* for memcpy */

extern "C" {
FFBEAST_API WheelApi *WheelApi_Create() { return new WheelApi(); }

FFBEAST_API void WheelApi_Delete(WheelApi *obj) {
  if (obj)
    delete obj;
}

FFBEAST_API int WheelApi_Connect(WheelApi *obj) {
  if (obj)
    return obj->connect();
  return 0;
}

FFBEAST_API int WheelApi_RebootController(WheelApi *obj) {
  if (obj)
    return obj->rebootController();
  return 0;
}

FFBEAST_API int WheelApi_SwitchToDfu(WheelApi *obj) {
  if (obj)
    return obj->switchtoDfu();
  return 0;
}

FFBEAST_API int WheelApi_ResetCenter(WheelApi *obj) {
  if (obj)
    return obj->resetCenter();
  return 0;
}

FFBEAST_API int WheelApi_SaveAndReboot(WheelApi *obj) {
  if (obj)
    return obj->saveAndReboot();
  return 0;
}

FFBEAST_API int WheelApi_ReadEffectSettings(WheelApi *obj,
                                            EffectSettingsTypeDef *dest) {
  if (obj)
    return obj->readEffectSettings(dest);
  return 0;
}

FFBEAST_API int WheelApi_ReadHardwareSettings(WheelApi *obj,
                                              HardwareSettingsTypeDef *dest) {
  if (obj)
    return obj->readHardwareSettings(dest);
  return 0;
}

FFBEAST_API int
WheelApi_ReadGpioExtensionSettings(WheelApi *obj,
                                   GpioExtensionSettingsTypeDef *dest) {
  if (obj)
    return obj->readGpioExtensionSettings(dest);
  return 0;
}

FFBEAST_API int
WheelApi_ReadAdcExtensionSettings(WheelApi *obj,
                                  AdcExtensionSettingsTypeDef *dest) {
  if (obj)
    return obj->readAdcExtensionSettings(dest);
  return 0;
}

FFBEAST_API int WheelApi_ReadState(WheelApi *obj, DeviceStateTypeDef *dest) {
  if (obj)
    return obj->readState(dest);
  return 0;
}

FFBEAST_API int WheelApi_SendDirectControl(WheelApi *obj,
                                           DirectControlTypeDef control) {
  if (obj)
    return obj->sendDirectControl(control);
  return 0;
}

// Helper for sending generic float setting
FFBEAST_API int WheelApi_SendFloatSettingReport(WheelApi *obj,
                                                SettingsFieldEnum field,
                                                int8_t index, float data) {
  if (obj)
    return obj->sendFloatSettingReport(field, index, data);
  return 0;
}

// Helper for sending numeric settings (int8)
FFBEAST_API int WheelApi_SendInt8SettingReport(WheelApi *obj,
                                               SettingsFieldEnum field,
                                               int8_t index, int8_t data) {
  if (obj)
    return obj->sendInt8SettingReport(field, index, data);
  return 0;
}

// Helper for sending numeric settings (int16)
FFBEAST_API int WheelApi_SendInt16SettingReport(WheelApi *obj,
                                                SettingsFieldEnum field,
                                                int8_t index, int16_t data) {
  if (obj)
    return obj->sendInt16SettingReport(field, index, data);
  return 0;
}

// Helper for sending numeric settings (uint8)
FFBEAST_API int WheelApi_SendUInt8SettingReport(WheelApi *obj,
                                                SettingsFieldEnum field,
                                                int8_t index, uint8_t data) {
  if (obj)
    return obj->sendUInt8SettingReport(field, index, data);
  return 0;
}

// Helper for sending numeric settings (uint16)
FFBEAST_API int WheelApi_SendUInt16SettingReport(WheelApi *obj,
                                                 SettingsFieldEnum field,
                                                 int8_t index, uint16_t data) {
  if (obj)
    return obj->sendUInt16SettingReport(field, index, data);
  return 0;
}
}
