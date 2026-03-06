export interface KeyMapping {
    id: string;
    source_type: 'axis' | 'button';
    index: number;
    trigger: 'high' | 'low';
    key: string;
    threshold: number;
}
