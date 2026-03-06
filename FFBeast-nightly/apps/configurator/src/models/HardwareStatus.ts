import type { FirmwareVersion } from './FirmwareVersion';

export interface HardwareStatus {
    position: number;
    torque: number;
    buttons: number;
    adc: number[];
    firmware?: FirmwareVersion;
    device_id?: number[];
    serial_key?: number[];
    is_registered: boolean;
}
