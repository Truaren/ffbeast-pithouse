#ifndef WHEEL_API_H
#define WHEEL_API_H

#include "hidapi.h"
#include <stdbool.h>
#include <stdint.h>


#define USB_VID 1115
#define WHEEL_PID_FS 22999

// Macro para empacotamento de structs (Compatibilidade MSVC/GCC)
#ifdef _MSC_VER
#define PACKED_STRUCT_BEGIN __pragma(pack(push, 1))
#define PACKED_STRUCT_END __pragma(pack(pop))
#define PACKED_ATTR
#define FFBEAST_API __declspec(dllexport)
#else
#define PACKED_STRUCT_BEGIN
#define PACKED_STRUCT_END
#define PACKED_ATTR __attribute__((packed))
#define FFBEAST_API
#endif

enum { INTERFACE_VENDOR = 0, INTERFACE_JOYSTICK = 1 };

typedef enum ExtensionModeEnum {
  EXTENSION_MODE_NONE = 0,
  EXTENSION_MODE_CUSTOM = 1,
} ExtensionModeEnum;

typedef enum SettingsFieldEnum {
  SETTINGS_FIELD_DIRECT_X_CONSTANT_DIRECTION = 0,
  SETTINGS_FIELD_DIRECT_X_SPRING_STRENGTH = 1,
  SETTINGS_FIELD_DIRECT_X_CONSTANT_STRENGTH = 2,
  SETTINGS_FIELD_DIRECT_X_PERIODIC_STRENGTH = 3,
  SETTINGS_FIELD_TOTAL_EFFECT_STRENGTH = 4,
  SETTINGS_FIELD_MOTION_RANGE = 5,
  SETTINGS_FIELD_SOFT_STOP_STRENGTH = 6,
  SETTINGS_FIELD_SOFT_STOP_RANGE = 7,
  SETTINGS_FIELD_STATIC_DAMPENING_STRENGTH = 8,
  SETTINGS_FIELD_SOFT_STOP_DAMPENING_STRENGTH = 9,
  SETTINGS_FIELD_DYNAMIC_DAMPENING_STRENGTH = 10,
  SETTINGS_FIELD_FORCE_ENABLED = 11,
  SETTINGS_FIELD_DEBUG_TORQUE = 12,
  SETTINGS_FIELD_AMPLIFIER_GAIN = 13,
  SETTINGS_FIELD_CALIBRATION_MAGNITUDE = 15,
  SETTINGS_FIELD_CALIBRATION_SPEED = 16,
  SETTINGS_FIELD_POWER_LIMIT = 17,
  SETTINGS_FIELD_BRAKING_LIMIT = 18,
  SETTINGS_FIELD_POSITION_SMOOTHING = 19,
  SETTINGS_FIELD_SPEED_BUFFER_SIZE = 20,
  SETTINGS_FIELD_ENCODER_DIRECTION = 21,
  SETTINGS_FIELD_FORCE_DIRECTION = 22,
  SETTINGS_FIELD_POLE_PAIRS = 23,
  SETTINGS_FIELD_ENCODER_CPR = 24,
  SETTINGS_FIELD_P_GAIN = 25,
  SETTINGS_FIELD_I_GAIN = 26,
  SETTINGS_FIELD_EXTENSION_MODE = 27,
  SETTINGS_FIELD_PIN_MODE = 28,
  SETTINGS_FIELD_BUTTON_MODE = 29,
  SETTINGS_FIELD_SPI_MODE = 30,
  SETTINGS_FIELD_SPI_LATCH_MODE = 31,
  SETTINGS_FIELD_SPI_LATCH_DELAY = 32,
  SETTINGS_FIELD_SPI_CLK_PULSE_LENGTH = 33,
  SETTINGS_FIELD_ADC_MIN_DEAD_ZONE = 34,
  SETTINGS_FIELD_ADC_MAX_DEAD_ZONE = 35,
  SETTINGS_FIELD_ADC_TO_BUTTON_LOW = 36,
  SETTINGS_FIELD_ADC_TO_BUTTON_HIGH = 37,
  SETTINGS_FIELD_ADC_SMOOTHING = 38,
  SETTINGS_FIELD_ADC_INVERT = 39,
  SETTINGS_FIELD_RESET_CENTER_ON_Z0 = 41,
  SETTINGS_FIELD_INTEGRATED_SPRING_STRENGTH = 43,
} SettingsFieldEnum;

typedef enum PinModeEnum {
  PIN_MODE_NONE = 0,
  PIN_MODE_GPIO = 1,
  PIN_MODE_ANALOG = 2,
  PIN_MODE_SPI_CS = 3,
  PIN_MODE_SPI_SCK = 4,
  PIN_MODE_SPI_MISO = 5,
  PIN_MODE_ENABLE_EFFECTS = 6,
  PIN_MODE_CENTER_RESET = 7,
  PIN_MODE_BRAKING_PWM = 8,
  PIN_MODE_EFFECT_LED = 9,
  PIN_MODE_REBOOT = 10,
} PinModeEnum;

typedef enum ButtonModeEnum {
  BUTTON_MODE_NONE = 0,
  BUTTON_MODE_NORMAL = 1,
  BUTTON_MODE_INVERTED = 2,
  BUTTON_MODE_PULSE = 3,          // Not implemented
  BUTTON_MODE_PULSE_INVERTED = 4, // Not implemented
} ButtonModeEnum;

typedef enum AmplifierGainEnum {
  AMPLIFIER_GAIN_80 = 0,
  AMPLIFIER_GAIN_40 = 1,
  AMPLIFIER_GAIN_20 = 2,
  AMPLIFIER_GAIN_10 = 3,
} AmplifierGainEnum;

typedef enum SpiModeEnum {
  SPI_MODE_0 = 0,
  SPI_MODE_1 = 1,
  SPI_MODE_2 = 2,
  SPI_MODE_3 = 3,
} SpiModeEnum;

typedef enum SpiLatchModeEnum {
  LATCH_MODE_UP = 0,
  LATCH_MODE_DOWN = 1
} SpiLatchModeEnum;

typedef enum ReportDataEnum {
  DATA_COMMAND_REBOOT = 0x01,
  DATA_COMMAND_SAVE_SETTINGS = 0x02,
  DATA_COMMAND_DFU_MODE = 0x03,
  DATA_OVERRIDE_DATA = 0x10,
  DATA_FIRMWARE_ACTIVATION_DATA = 0x13,
  DATA_SETTINGS_FIELD_DATA = 0x14,
  DATA_COMMAND_RESET_CENTER = 0x04
} ReportDataEnum;

typedef enum ReportTypeEnum {
  REPORT_JOYSTICK_INPUT = 0x01,
  REPORT_CREATE_NEW_EFFECT = 0x11,
  REPORT_PID_BLOCK_LOAD = 0x12,
  REPORT_PID_POOL = 0x13,
  REPORT_SET_EFFECT = 0x11,
  REPORT_SET_ENVELOPE = 0x12,
  REPORT_SET_CONDITION = 0x13,
  REPORT_SET_PERIODIC = 0x14,
  REPORT_SET_CONSTANT_FORCE = 0x15,
  REPORT_SET_RAMP_FORCE = 0x16,
  REPORT_EFFECT_OPERATION = 0x1A,
  REPORT_PID_STATE = 0x12,
  REPORT_PID_BLOCK_FREE = 0x1B,
  REPORT_PID_DEVICE_CONTROL = 0x1C,
  REPORT_DEVICE_GAIN = 0x1D,
  REPORT_HARDWARE_SETTINGS_FEATURE = 0x21,
  REPORT_EFFECT_SETTINGS_FEATURE = 0x22,
  REPORT_FIRMWARE_LICENSE_FEATURE = 0x25,
  REPORT_GPIO_SETTINGS_FEATURE = 0xA1,
  REPORT_ADC_SETTINGS_FEATURE = 0xA2,
  REPORT_GENERIC_INPUT_OUTPUT = 0xA3,
} ReportTypeEnum;

PACKED_STRUCT_BEGIN
typedef struct {
  uint8_t ReleaseType;
  uint8_t ReleaseMajor;
  uint8_t ReleaseMinor;
  uint8_t ReleasePatch;
} PACKED_ATTR FirmwareVersionTypeDef;
PACKED_STRUCT_END

PACKED_STRUCT_BEGIN
typedef struct {
  FirmwareVersionTypeDef FirmwareVersion;
  uint32_t SerialKey[3];
  uint32_t DeviceId[3];
  uint8_t IsRegistered;
  uint8_t _padding[35];
} PACKED_ATTR FirmwareLicenseTypeDef;
PACKED_STRUCT_END

PACKED_STRUCT_BEGIN
typedef struct {
  uint16_t MotionRange;
  uint16_t StaticDampeningStrength;
  uint16_t SoftStopDampeningStrength;
  uint8_t TotalEffectStrength;
  uint8_t IntegratedSpringStrength;
  uint8_t SoftStopRange;
  uint8_t SoftStopStrength;
  int8_t DirectXConstantDirection;
  uint8_t DirectXSpringStrength;
  uint8_t DirectXConstantStrength;
  uint8_t DirectXPeriodicStrength;
  uint16_t DynamicDampeningStrength;
  uint8_t _padding[48];
} PACKED_ATTR EffectSettingsTypeDef;
PACKED_STRUCT_END

PACKED_STRUCT_BEGIN
typedef struct {
  uint16_t EncoderCPR;
  uint16_t IntegralGain;
  uint8_t ProportionalGain;
  uint8_t ForceEnabled;
  uint8_t DebugTorque;
  uint8_t AmplifierGain;
  uint8_t CalibrationMagnitude;
  uint8_t CalibrationSpeed;
  uint8_t PowerLimit;
  uint8_t BrakingLimit;
  uint8_t PositionSmoothing;
  uint8_t SpeedBufferSize;
  int8_t EncoderDirection;
  int8_t ForceDirection;
  uint8_t PolePairs;
  uint8_t _padding[47];
} PACKED_ATTR HardwareSettingsTypeDef;
PACKED_STRUCT_END

PACKED_STRUCT_BEGIN
typedef struct {
  uint16_t RAxisMin[3];
  uint16_t RAxisMax[3];
  uint8_t RAxisSmoothing[3];
  uint8_t RAxisToButtonLow[3];
  uint8_t RAxisToButtonHigh[3];
  uint8_t RAxisInvert[3];
  uint8_t _padding[40];
} PACKED_ATTR AdcExtensionSettingsTypeDef;
PACKED_STRUCT_END

PACKED_STRUCT_BEGIN
typedef struct {
  uint8_t ExtensionMode;
  uint8_t PinMode[10];
  uint8_t ButtonMode[32];
  uint8_t SpiMode;
  uint8_t SpiLatchMode;
  uint8_t SpiLatchDelay;
  uint8_t SpiClkPulseLength;
  uint8_t _padding[17];
} PACKED_ATTR GpioExtensionSettingsTypeDef;
PACKED_STRUCT_END

PACKED_STRUCT_BEGIN
typedef struct {
  int16_t SpringForce;
  int16_t ConstantForce;
  int16_t PeriodicForce;
  uint8_t ForceDrop;
} PACKED_ATTR DirectControlTypeDef;
PACKED_STRUCT_END

PACKED_STRUCT_BEGIN
typedef struct {
  FirmwareVersionTypeDef FirmwareVersion;
  uint8_t IsRegistered;
  int16_t Position;
  int16_t Torque;
  uint8_t _padding[55];
} PACKED_ATTR DeviceStateTypeDef;
PACKED_STRUCT_END

PACKED_STRUCT_BEGIN
typedef struct {
  uint8_t ReportId;
  uint8_t Buffer[64];
} PACKED_ATTR HidInOutReportTypeDef;
PACKED_STRUCT_END

PACKED_STRUCT_BEGIN
typedef struct {
  uint8_t ReportData;
  uint8_t Buffer[63];
} PACKED_ATTR DataReportTypeDef;
PACKED_STRUCT_END

PACKED_STRUCT_BEGIN
typedef struct {
  uint8_t Index;
  uint8_t Buffer[61];
} PACKED_ATTR FieldValueTypeDef;
PACKED_STRUCT_END

PACKED_STRUCT_BEGIN
typedef struct {
  uint8_t FieldId;
  FieldValueTypeDef Value;
} PACKED_ATTR FieldDataTypeDef;
PACKED_STRUCT_END

PACKED_STRUCT_BEGIN
typedef struct {
  float Value;
} PACKED_ATTR FloatValueWrapperTypeDef;
PACKED_STRUCT_END

PACKED_STRUCT_BEGIN
typedef struct {
  uint8_t Value;
} PACKED_ATTR UInt8ValueWrapperTypeDef;
PACKED_STRUCT_END

PACKED_STRUCT_BEGIN
typedef struct {
  int8_t Value;
} PACKED_ATTR Int8ValueWrapperTypeDef;
PACKED_STRUCT_END

PACKED_STRUCT_BEGIN
typedef struct {
  uint16_t Value;
} PACKED_ATTR UInt16ValueWrapperTypeDef;
PACKED_STRUCT_END

PACKED_STRUCT_BEGIN
typedef struct {
  int16_t Value;
} PACKED_ATTR Int16ValueWrapperTypeDef;
PACKED_STRUCT_END

class WheelApi {
public:
  WheelApi();

  int connect();

  int rebootController();
  int switchtoDfu();
  int resetCenter();
  int saveAndReboot();

  int readEffectSettings(EffectSettingsTypeDef *destination);
  int readHardwareSettings(HardwareSettingsTypeDef *destination);
  int readGpioExtensionSettings(GpioExtensionSettingsTypeDef *destination);
  int readAdcExtensionSettings(AdcExtensionSettingsTypeDef *destination);

  int readState(DeviceStateTypeDef *destination);

  int sendDirectControl(DirectControlTypeDef control);

  int sendInt8SettingReport(SettingsFieldEnum, int8_t index, int8_t data);
  int sendInt16SettingReport(SettingsFieldEnum, int8_t index, int16_t data);
  int sendUInt8SettingReport(SettingsFieldEnum, int8_t index, uint8_t data);
  int sendUInt16SettingReport(SettingsFieldEnum, int8_t index, uint16_t data);
  int sendFloatSettingReport(SettingsFieldEnum, int8_t index, float data);

private:
  hid_device *handle = nullptr;

  void CreateInt8SettingsReport(HidInOutReportTypeDef *report, uint8_t fieldId,
                                uint8_t index, int8_t value);
  void CreateInt16SettingsReport(HidInOutReportTypeDef *report, uint8_t fieldId,
                                 uint8_t index, int16_t value);
  void CreateUInt8SettingsReport(HidInOutReportTypeDef *report, uint8_t fieldId,
                                 uint8_t index, uint8_t value);
  void CreateUInt16SettingsReport(HidInOutReportTypeDef *report,
                                  uint8_t fieldId, uint8_t index,
                                  uint16_t value);
  void CreateFloatSettingsReport(HidInOutReportTypeDef *report, uint8_t fieldId,
                                 uint8_t index, float value);
};

#endif // WHEEL_API_H
