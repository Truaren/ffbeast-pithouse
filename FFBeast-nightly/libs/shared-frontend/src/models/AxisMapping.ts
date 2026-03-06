export interface AxisMapping {
    name: string;
    min: number;
    max: number;
    invert: boolean;
    keyLow: string;
    keyHigh: string;
    thresholdLow?: number;
    thresholdHigh?: number;
    btnLow?: string;
    btnHigh?: string;
}
