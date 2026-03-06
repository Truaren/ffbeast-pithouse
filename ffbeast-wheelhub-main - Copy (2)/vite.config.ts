import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

const resolvePath = (p: string) => path.resolve(__dirname, p);

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": resolvePath("./src"),
      "@assets": resolvePath("./src/assets"),
      "@styles": resolvePath("./src/styles"),
      "@components": resolvePath("./src/components"),
      "@pages": resolvePath("./src/pages"),
      "@types": resolvePath("./src/types"),
    },
  },
  plugins: [react()],
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? "0.0.0"),
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/_mixins.scss" as *;`,
      },
    },
  },
});
