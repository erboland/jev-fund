import { spawnSync } from "node:child_process";
import { existsSync, renameSync, writeFileSync } from "node:fs";
import { SITE } from "../src/lib/site";

const api = "src/app/api";
const parked = "src/app/_api_parked";

if (existsSync(parked)) {
  console.error("refusing to export: src/app/_api_parked already exists");
  process.exit(1);
}

renameSync(api, parked);

/** Custom domain serves the export at the site root; github.io keeps /jev-fund. */
const pagesCname = process.env.PAGES_CNAME?.trim() || SITE.customDomain;
const viewsOrigin = pagesCname
  ? `https://${pagesCname}`
  : SITE.customDomainUrl.replace(/\/$/, "");

const env = {
  ...process.env,
  GITHUB_PAGES: "1",
  NEXT_PUBLIC_STATIC: "1",
  NEXT_PUBLIC_BASE_PATH: pagesCname ? "" : "/jev-fund",
  NEXT_PUBLIC_VIEWS_ORIGIN: process.env.NEXT_PUBLIC_VIEWS_ORIGIN ?? viewsOrigin,
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
  if (!process.exitCode && pagesCname) {
    writeFileSync("out/CNAME", `${pagesCname}\n`);
  }
} finally {
  renameSync(parked, api);
}
