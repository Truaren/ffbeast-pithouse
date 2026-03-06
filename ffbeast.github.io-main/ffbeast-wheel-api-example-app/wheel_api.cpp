#include "wheel_api.h"

typedef struct __attribute__((packed)) {
    uint8_t ReportId;
    EffectSettingsTypeDef effectSettings;
} EffectSettingsReportTypeDef;

typedef struct __attribute__((packed)) {
    uint8_t ReportId;
    HardwareSettingsTypeDef hardwareSettings;
} HardwareSettingsReportTypeDef;

typedef struct __attribute__((packed)) {
    uint8_t ReportId;
    AdcExtensionSettingsTypeDef adcExtensionSettings;
} AdcExtensionSettingsReportTypeDef;

typedef struct __attribute__((packed)) {
    uint8_t ReportId;
    GpioExtensionSettingsTypeDef gpioExtensionSettings;
} GpioExtensionSettingsReportTypeDef;

typedef struct __attribute__((packed)) {
    uint8_t ReportId;
    DeviceStateTypeDef state;
} StateReportTypeDef;

WheelApi::WheelApi() {
    hid_init();
}

int WheelApi::connect(){
    int result = 0;
    struct hid_device_info *devs, *cur_dev;
    const char *path_to_open = nullptr;
    devs = hid_enumerate(USB_VID, WHEEL_PID_FS);
    cur_dev = devs;
    while (cur_dev) {
        if (cur_dev->interface_number == 0){ //Vendor interface is 0
            path_to_open = cur_dev->path;
            break;
        }
        cur_dev = cur_dev->next;
    }
    if (path_to_open) {
        handle = hid_open_path(path_to_open);
        result = 1;
    }
    hid_free_enumeration(devs);
    return result;
}

int WheelApi::saveAndReboot(){
    if (handle != nullptr){
        HidInOutReportTypeDef genericReport = {};
        genericReport.ReportId = REPORT_GENERIC_INPUT_OUTPUT;
        DataReportTypeDef *data = (DataReportTypeDef*)&genericReport.Buffer;
        data->ReportData = DATA_COMMAND_SAVE_SETTINGS;
        return hid_write(handle, (const unsigned char *) &genericReport, 65);
    }
    return 0;
}

int WheelApi::rebootController(){
    if (handle != nullptr){
        HidInOutReportTypeDef genericReport = {};
        genericReport.ReportId = REPORT_GENERIC_INPUT_OUTPUT;
        DataReportTypeDef *data = (DataReportTypeDef*)&genericReport.Buffer;
        data->ReportData = DATA_COMMAND_REBOOT;
        return hid_write(handle, (const unsigned char *) &genericReport, 65);
    }
    return 0;
}

int WheelApi::switchtoDfu(){
    if (handle != nullptr){
        HidInOutReportTypeDef genericReport = {};
        genericReport.ReportId = REPORT_GENERIC_INPUT_OUTPUT;
        DataReportTypeDef *data = (DataReportTypeDef*)&genericReport.Buffer;
        data->ReportData = DATA_COMMAND_DFU_MODE;
        return hid_write(handle, (const unsigned char *) &genericReport, 65);
    }
    return 0;
}

int WheelApi::resetCenter(){
    if (handle != nullptr){
        HidInOutReportTypeDef genericReport = {};
        genericReport.ReportId = REPORT_GENERIC_INPUT_OUTPUT;
        DataReportTypeDef *data = (DataReportTypeDef*)&genericReport.Buffer;
        data->ReportData = DATA_COMMAND_RESET_CENTER;
        return hid_write(handle, (const unsigned char *) &genericReport, 65);
    }
    return 0;
}

int WheelApi::readEffectSettings(EffectSettingsTypeDef *destination){
    int result = 0;
    if (handle != nullptr){
        EffectSettingsReportTypeDef report;
        report.ReportId = REPORT_EFFECT_SETTINGS_FEATURE;
        result = hid_get_feature_report(handle, (unsigned char*)&report, sizeof(EffectSettingsReportTypeDef));
        if (result > 0) {
            memcpy(destination, &report.effectSettings, sizeof(EffectSettingsTypeDef));
        }
    }
    return result;
}

int WheelApi::readHardwareSettings(HardwareSettingsTypeDef *destination){
    int result = 0;
    if (handle != nullptr){
        HardwareSettingsReportTypeDef report;
        report.ReportId = REPORT_HARDWARE_SETTINGS_FEATURE;
        int result = hid_get_feature_report(handle, (unsigned char*)&report, sizeof(HardwareSettingsReportTypeDef));
        if (result > 0) {
            memcpy(destination, &report.hardwareSettings, sizeof(HardwareSettingsTypeDef));
        }
    }
    return result;
}

int WheelApi::readGpioExtensionSettings(GpioExtensionSettingsTypeDef *destination){
    int result = 0;
    if (handle != nullptr){
        GpioExtensionSettingsReportTypeDef report;
        report.ReportId = REPORT_GPIO_SETTINGS_FEATURE;
        int result = hid_get_feature_report(handle, (unsigned char*)&report, sizeof(GpioExtensionSettingsReportTypeDef));
        if (result > 0) {
            memcpy(destination, &report.gpioExtensionSettings, sizeof(GpioExtensionSettingsTypeDef));
        }
    }
    return result;
}

int WheelApi::readAdcExtensionSettings(AdcExtensionSettingsTypeDef *destination){
    int result = 0;
    if (handle != nullptr){
        AdcExtensionSettingsReportTypeDef report;
        report.ReportId = REPORT_ADC_SETTINGS_FEATURE;
        int result = hid_get_feature_report(handle, (unsigned char*)&report, sizeof(AdcExtensionSettingsReportTypeDef));
        if (result > 0) {
            memcpy(destination, &report.adcExtensionSettings, sizeof(AdcExtensionSettingsTypeDef));
        }
    }
    return result;
}

int WheelApi::readState(DeviceStateTypeDef *destination){
    if (handle != nullptr){
        StateReportTypeDef report;
        int result = hid_read_timeout(handle, (unsigned char*)&report, 65, 100);
        if (result > 0) {
            memcpy(destination, &report.state, sizeof(DeviceStateTypeDef));
        }
        return result;
    }
    return 0;
}

int WheelApi::sendDirectControl(DirectControlTypeDef control){
    if (handle != nullptr){
        HidInOutReportTypeDef report = {};
        report.ReportId = REPORT_GENERIC_INPUT_OUTPUT;
        DataReportTypeDef *genericData = (DataReportTypeDef *) &report.Buffer;
        genericData->ReportData = DATA_OVERRIDE_DATA;
        memcpy(genericData->Buffer,&control,sizeof(DirectControlTypeDef));
        return hid_write(handle, (const unsigned char *) &report, 65);
    }
    return 0;
}

int WheelApi::sendInt8SettingReport(SettingsFieldEnum field, int8_t index, int8_t data){
    if (handle != nullptr){
        HidInOutReportTypeDef genericReport = {};
        CreateInt8SettingsReport(&genericReport, field, index, data);
        return hid_write(handle, (const unsigned char *) &genericReport, 65);
    }
    return 0;
}

int WheelApi::sendInt16SettingReport(SettingsFieldEnum field, int8_t index, int16_t data){
    if (handle != nullptr){
        HidInOutReportTypeDef genericReport = {};
        CreateUInt16SettingsReport(&genericReport, field, index, data);
        return hid_write(handle, (const unsigned char *) &genericReport, 65);
    }
    return 0;
}

int WheelApi::sendUInt8SettingReport(SettingsFieldEnum field, int8_t index, uint8_t data){
    if (handle != nullptr){
        HidInOutReportTypeDef genericReport = {};
        CreateUInt8SettingsReport(&genericReport, field, index, data);
        return hid_write(handle, (const unsigned char *) &genericReport, 65);
    }
    return 0;
}

int WheelApi::sendUInt16SettingReport(SettingsFieldEnum field, int8_t index, uint16_t data){
    if (handle != nullptr){
        HidInOutReportTypeDef genericReport = {};
        CreateUInt16SettingsReport(&genericReport, field, index, data);
        return hid_write(handle, (const unsigned char *) &genericReport, 65);
    }
    return 0;
}

int WheelApi::sendFloatSettingReport(SettingsFieldEnum field, int8_t index, float data){
    if (handle != nullptr){
        HidInOutReportTypeDef genericReport = {};
        CreateFloatSettingsReport(&genericReport, field, index, data);
        return hid_write(handle, (const unsigned char *) &genericReport, 65);
    }
    return 0;
}

void WheelApi::CreateInt8SettingsReport(HidInOutReportTypeDef *report, uint8_t fieldId, uint8_t index, int8_t value) {
    report->ReportId = REPORT_GENERIC_INPUT_OUTPUT;
    DataReportTypeDef *genericData = (DataReportTypeDef *) &report->Buffer;
    genericData->ReportData = DATA_SETTINGS_FIELD_DATA;
    FieldDataTypeDef *settingsFieldData = (FieldDataTypeDef *) &genericData->Buffer;
    settingsFieldData->FieldId = fieldId;
    FieldValueTypeDef *settingsField = &settingsFieldData->Value;
    settingsField->Index = index;
    Int8ValueWrapperTypeDef *valueWrapper = (Int8ValueWrapperTypeDef *) &settingsField->Buffer;
    valueWrapper->Value = value;
}

void WheelApi::CreateInt16SettingsReport(HidInOutReportTypeDef *report, uint8_t fieldId, uint8_t index, int16_t value) {
    report->ReportId = REPORT_GENERIC_INPUT_OUTPUT;
    DataReportTypeDef *genericData = (DataReportTypeDef *) &report->Buffer;
    genericData->ReportData = DATA_SETTINGS_FIELD_DATA;
    FieldDataTypeDef *settingsFieldData = (FieldDataTypeDef *) &genericData->Buffer;
    settingsFieldData->FieldId = fieldId;
    FieldValueTypeDef *settingsField = &settingsFieldData->Value;
    settingsField->Index = index;
    Int16ValueWrapperTypeDef *valueWrapper = (Int16ValueWrapperTypeDef *) &settingsField->Buffer;
    valueWrapper->Value = value;
}

void WheelApi::CreateUInt8SettingsReport(HidInOutReportTypeDef *report, uint8_t fieldId, uint8_t index, uint8_t value) {
    report->ReportId = REPORT_GENERIC_INPUT_OUTPUT;
    DataReportTypeDef *genericData = (DataReportTypeDef *) &report->Buffer;
    genericData->ReportData = DATA_SETTINGS_FIELD_DATA;
    FieldDataTypeDef *settingsFieldData = (FieldDataTypeDef *) &genericData->Buffer;
    settingsFieldData->FieldId = fieldId;
    FieldValueTypeDef *settingsField = &settingsFieldData->Value;
    settingsField->Index = index;
    UInt8ValueWrapperTypeDef *valueWrapper = (UInt8ValueWrapperTypeDef *) &settingsField->Buffer;
    valueWrapper->Value = value;
}

void WheelApi::CreateUInt16SettingsReport(HidInOutReportTypeDef *report, uint8_t fieldId, uint8_t index, uint16_t value) {
    report->ReportId = REPORT_GENERIC_INPUT_OUTPUT;
    DataReportTypeDef *genericData = (DataReportTypeDef *) &report->Buffer;
    genericData->ReportData = DATA_SETTINGS_FIELD_DATA;
    FieldDataTypeDef *settingsFieldData = (FieldDataTypeDef *) &genericData->Buffer;
    settingsFieldData->FieldId = fieldId;
    FieldValueTypeDef *settingsField = &settingsFieldData->Value;
    settingsField->Index = index;
    UInt16ValueWrapperTypeDef *valueWrapper = (UInt16ValueWrapperTypeDef *) &settingsField->Buffer;
    valueWrapper->Value = value;
}

void WheelApi::CreateFloatSettingsReport(HidInOutReportTypeDef *report, uint8_t fieldId, uint8_t index, float value) {
    report->ReportId = REPORT_GENERIC_INPUT_OUTPUT;
    DataReportTypeDef *genericData = (DataReportTypeDef *) &report->Buffer;
    genericData->ReportData = DATA_SETTINGS_FIELD_DATA;
    FieldDataTypeDef *settingsFieldData = (FieldDataTypeDef *) &genericData->Buffer;
    settingsFieldData->FieldId = fieldId;
    FieldValueTypeDef *settingsField = &settingsFieldData->Value;
    settingsField->Index = index;
    FloatValueWrapperTypeDef *valueWrapper = (FloatValueWrapperTypeDef *) &settingsField->Buffer;
    valueWrapper->Value = value;
}
