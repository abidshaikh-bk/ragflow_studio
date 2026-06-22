import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  esbuild: {
    jsx: "automatic"
  },
  test: {
    exclude: ["src/tests/e2e/**"],
    include: ["src/tests/**/*.{test,spec}.{ts,tsx}"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"]
  }
});
