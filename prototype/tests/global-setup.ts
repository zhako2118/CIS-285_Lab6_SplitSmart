import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

const TEST_DB = path.resolve(__dirname, "../prisma/test.db");

/** Recreate the isolated test database from migrations before the suite runs. */
export default function setup() {
  for (const suffix of ["", "-journal"]) rmSync(TEST_DB + suffix, { force: true });
  execFileSync(process.execPath, [require.resolve("prisma/build/index.js"), "migrate", "deploy"], {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "pipe",
  });
}
