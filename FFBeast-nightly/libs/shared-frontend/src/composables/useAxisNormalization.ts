
export interface AxisNormalizationConfig {
    min: number;
    max: number;
    invert: boolean;
    smoothing?: number;
    deadzoneLow?: number;
    deadzoneHigh?: number;
}

export function useAxisNormalization() {
    /**
     * Normalizes a raw axis value based on configuration.
     * Returns a value between 0.0 and 1.0 (or inverted).
     */
    const normalize = (
        rawValue: number,
        config: AxisNormalizationConfig
    ): number => {
        let { min, max, invert } = config;

        // Ensure min < max for calculation
        if (min >= max) {
            // Fallback or identity
            return 0;
        }

        // Clamp raw value
        let clamped = Math.max(min, Math.min(max, rawValue));

        // Scale to 0..1
        let normalized = (clamped - min) / (max - min);

        // Apply inversion
        if (invert) {
            normalized = 1.0 - normalized;
        }

        return normalized;
    };

    /**
     * Calculates the percentage (0-100) for UI display
     */
    const getPercentage = (
        rawValue: number,
        config: AxisNormalizationConfig
    ): number => {
        return Math.round(normalize(rawValue, config) * 100);
    };

    return {
        normalize,
        getPercentage
    };
}
