import { defineConfig } from "vite";

// Build statique dans game/dist/ (integration au site plus tard)
// base "./" = chemins relatifs, le dossier fonctionne quel que soit son emplacement.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsDir: "assets",
    chunkSizeWarningLimit: 1000,
  },
  // Ignore la config PostCSS/Tailwind du site parent
  css: { postcss: {} },
  server: { host: true, port: 5173 },
});
