import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PORT = 43147;
const HOST = "127.0.0.1";
const URL = `http://${HOST}:${PORT}/?tape=demo`;
const OUT_DIR = join("docs", "assets");
const TMP_DIR = join(OUT_DIR, ".record");
const FRAMES_DIR = join(TMP_DIR, "frames");
const GIF = join(OUT_DIR, "demo.gif");
const MP4 = join(OUT_DIR, "demo.mp4");
const FPS = 18;
const MIN_SECONDS = 5;
const MIN_FRAMES = FPS * MIN_SECONDS;
const HOLDS_PER_STEP = 4;

function run(cmd: string, args: string[]) {
  const result = spawnSync(cmd, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function waitForServer(url: string, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // server still booting
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function stopDev(child: ChildProcess) {
  if (!child.killed) child.kill("SIGTERM");
}

function freePort(port: number) {
  spawnSync("bash", ["-lc", `lsof -ti :${port} | xargs kill -9 2>/dev/null || true`]);
}

/** Demo recordings should show Jev even when the build used the keyless mock. */
function brandBookAsJev() {
  const book = join("public", "book.json");
  const snap = JSON.parse(readFileSync(book, "utf8")) as {
    model: string;
    jevConfigured: boolean;
  };
  snap.model = "jev";
  snap.jevConfigured = true;
  writeFileSync(book, JSON.stringify(snap));
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  rmSync(TMP_DIR, { recursive: true, force: true });
  mkdirSync(FRAMES_DIR, { recursive: true });

  freePort(PORT);
  run("npx", ["tsx", "scripts/write-book.ts"]);
  brandBookAsJev();

  const dev = spawn(
    "npx",
    ["next", "dev", "--port", String(PORT), "--hostname", HOST],
    {
      stdio: "pipe",
      env: { ...process.env, NEXT_PUBLIC_STATIC: "1" },
    }
  );

  try {
    await waitForServer(URL);

    const { chromium } = await import("playwright");
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1200, height: 834 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.goto(URL, { waitUntil: "domcontentloaded" });
    await page.getByText("NAV", { exact: true }).waitFor({ timeout: 20_000 });
    await page.waitForSelector('[data-tape="0"]', { timeout: 10_000 });

    let frame = 0;
    let lastFile = "";

    async function snap() {
      const file = join(FRAMES_DIR, `frame-${String(frame).padStart(4, "0")}.png`);
      await page.screenshot({ path: file });
      lastFile = file;
      frame++;
    }

    for (;;) {
      const tape = await page.locator("[data-tape]").getAttribute("data-tape");
      for (let hold = 0; hold < HOLDS_PER_STEP; hold++) await snap();
      if (tape === "live") break;
      await page.waitForFunction(
        (prev) =>
          document.querySelector("[data-tape]")?.getAttribute("data-tape") !== prev,
        tape,
        { timeout: 15_000 }
      );
    }

    while (frame < MIN_FRAMES) {
      const file = join(FRAMES_DIR, `frame-${String(frame).padStart(4, "0")}.png`);
      copyFileSync(lastFile, file);
      frame++;
    }

    await browser.close();

    if (frame < MIN_FRAMES) {
      throw new Error(`Only captured ${frame} demo frames (need ${MIN_FRAMES})`);
    }

    run("ffmpeg", [
      "-y",
      "-framerate",
      String(FPS),
      "-i",
      join(FRAMES_DIR, "frame-%04d.png"),
      "-vf",
      "scale=1200:-2:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer",
      "-loop",
      "0",
      GIF,
    ]);
    run("ffmpeg", [
      "-y",
      "-framerate",
      String(FPS),
      "-i",
      join(FRAMES_DIR, "frame-%04d.png"),
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      MP4,
    ]);
    const seconds = (frame / FPS).toFixed(1);
    console.log(`wrote ${GIF} and ${MP4} from ${frame} frames (${seconds}s)`);
  } finally {
    stopDev(dev);
    rmSync(TMP_DIR, { recursive: true, force: true });
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
