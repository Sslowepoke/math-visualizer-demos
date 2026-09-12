import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  server: {
    fs: {
      allow: [path.resolve(root, "..")],
    },
    watch: {
      usePolling: true,
    },
  },
});
