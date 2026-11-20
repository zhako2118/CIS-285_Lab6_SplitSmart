import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    // Integration tests use an isolated SQLite file (prisma/test.db), never dev.db.
    env: { DATABASE_URL: "file:./test.db" },
    fileParallelism: false,
  },
});
