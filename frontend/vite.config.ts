import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    /*
     * `three-globe` and `@react-three/fiber` each resolve `three` themselves.
     * Left alone, the dev optimiser hands them separate copies and the console
     * warns about multiple Three.js instances — which is not cosmetic: the two
     * copies have distinct class identities, so `instanceof` checks across the
     * boundary silently fail.
     */
    dedupe: ["three"],
  },
  server: {
    port: 5173,
  },
});
