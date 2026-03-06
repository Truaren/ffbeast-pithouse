export interface KeyMapping {
    index: number;
    name: string;
    key_low: string;
    key_high: string;
    btn_low: string;
    btn_high: string;
    // Client-side fields for UI state, not necessarily sent to backend
    min?: number;
    max?: number;
    inverted?: boolean;
}

export interface AxisConfig {
    index: number;
    label: string;
    //... other UI specific props
}
