import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    clearScreen: false,
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@shared': path.resolve(__dirname, '../../libs/shared-frontend/src'),
            '@tauri-apps/api': path.resolve(__dirname, 'node_modules/@tauri-apps/api'),
            'vue': path.resolve(__dirname, 'node_modules/vue'),
            'vue-i18n': path.resolve(__dirname, 'node_modules/vue-i18n'),
        },
    },
    server: {
        port: 1420,
        strictPort: true,
        host: false,
        watch: {
            ignored: ["**/src-tauri/**"],
        },
    },
});
