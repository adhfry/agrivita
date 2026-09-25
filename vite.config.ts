import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { jsonDb } from "./server/jsonDb";

export default defineConfig({
  plugins: [vue(), jsonDb()],
  server: {
    // Jangan reload halaman setiap kali file database JSON ditulis.
    watch: { ignored: ["**/data/**"] },
  },
  preview: {
    // Vite 5 menolak request dengan header Host yang tidak dikenal (proteksi
    // DNS rebinding) - production di-proxy nginx pakai domain asli, bukan
    // localhost, jadi harus di-whitelist eksplisit di sini.
    allowedHosts: [
      "agrivita.synvorateknologiindonesia.web.id",
      "www.agrivita.synvorateknologiindonesia.web.id",
    ],
  },
});
