export const formatHexArray = (arr?: number[]): string => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return '-';
    return arr.map(n => {
        const val = typeof n === 'number' ? n : 0;
        return val.toString(16).toUpperCase().padStart(8, '0');
    }).join('-');
};

export const isBitSet = (mask: number, bit: number): boolean => {
    return ((mask >>> bit) & 1) === 1;
};
