import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { jsonDb } from "./server/jsonDb";

export default defineConfig({
  plugins: [vue(), jsonDb()],
  server: {
    // Jangan reload halaman setiap kali file database JSON ditulis.
    watch: { ignored: ["**/data/**"] },
  },
});
