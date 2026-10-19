import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  envDir: "..",
<<<<<<< HEAD
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
=======
>>>>>>> ed6507eac0c31efb2a395df95287612163cde8b0
  plugins: [react(), tailwindcss()],
});
