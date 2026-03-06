import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { createI18n } from 'vue-i18n';
import { setI18nInstance } from './i18n';

// Styles
import './styles/global.css';
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/800.css';
import '@fontsource/jetbrains-mono';

// i18n
import en from './locales/en.json';
import br from './locales/pt-BR.json';

const locale = navigator.language.startsWith('pt') ? 'pt-BR' : 'en';

const i18n = createI18n({
    legacy: false,
    locale: locale,
    fallbackLocale: 'en',
    messages: {
        en,
        'pt-BR': br,
        'pt': br
    }
});

// Make i18n available to stores
setI18nInstance(i18n);

const app = createApp(App);
app.use(createPinia());
app.use(i18n);
app.mount('#app');
