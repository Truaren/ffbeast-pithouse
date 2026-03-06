import { type I18n } from 'vue-i18n';

// Helper to get translations outside Vue components
// This uses the global i18n instance that's created in main.ts

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type I18nInstance = I18n<any, any, any, any, any>;

let i18nInstance: I18nInstance | null = null;

export function setI18nInstance(instance: any) {
    i18nInstance = instance;
}

export function t(key: string): string {
    if (!i18nInstance) {
        console.warn('[i18n] Instance not set, returning key:', key);
        return key;
    }

    // global.t is the translation function
    return (i18nInstance.global as { t: (k: string) => string }).t(key);
}
