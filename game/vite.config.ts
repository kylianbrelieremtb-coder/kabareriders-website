import { defineConfig } from "vite";

// Le jeu se builde dans le site Next.js : public/jeu-app/ (servi a /jeu-app/index.html)
// base "./" = chemins relatifs, le dossier fonctionne quel que soit son emplacement.
export default defineConfig({
  base: "./",
  build: {
    outDir: "../public/jeu-app",
    emptyOutDir: true,
    assetsDir: "assets",
    chunkSizeWarningLimit: 1000,
  },
  // Ignore la config PostCSS/Tailwind du site parent
  css: { postcss: {} },
  server: { host: true, port: 5173 },
});
