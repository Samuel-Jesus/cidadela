import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  envDir: path.resolve(__dirname, "../.."),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@cidadela/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
      "@cidadela/engine": path.resolve(__dirname, "../../packages/engine/src/index.ts"),
    },
  },
  server: {
    port: 5173,
  },
});
