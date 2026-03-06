import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createI18n } from 'vue-i18n'

import en from './locales/en.json'
import pt from './locales/pt.json'

const i18n = createI18n({
    legacy: false,
    locale: navigator.language.startsWith('pt') ? 'pt' : 'en',
    fallbackLocale: 'en',
    messages: {
        en,
        pt
    }
})

createApp(App).use(i18n).mount('#app')
