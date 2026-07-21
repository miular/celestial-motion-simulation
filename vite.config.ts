import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/https://github.com/miular/celestial-motion-simulation/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "lucide-react"],
          three: ["three"],
        },
      },
    },
  },
});
