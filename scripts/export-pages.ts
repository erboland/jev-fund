import { spawnSync } from "node:child_process";
import { existsSync, renameSync } from "node:fs";

const api = "src/app/api";
const parked = "src/app/_api_parked";

if (existsSync(parked)) {
  console.error("refusing to export: src/app/_api_parked already exists");
  process.exit(1);
}

renameSync(api, parked);

const env = {
  ...process.env,
  GITHUB_PAGES: "1",
  NEXT_PUBLIC_STATIC: "1",
  NEXT_PUBLIC_BASE_PATH: "/jev-fund",
};

function run(args: string[]) {
  const result = spawnSync("npx", args, { stdio: "inherit", env });
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
  }
}

try {
  run(["tsx", "scripts/write-book.ts"]);
  if (!process.exitCode) run(["next", "build"]);
} finally {
  renameSync(parked, api);
}
