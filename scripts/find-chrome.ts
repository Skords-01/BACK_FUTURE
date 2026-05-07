import { accessSync, constants } from "node:fs";
import process from "node:process";

const candidates = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/home/ubuntu/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome",
  "/opt/.devin/playwright_browsers/chromium-1097/chrome-linux/chrome",
  "/opt/.devin/chrome/chrome/linux-137.0.7118.2/chrome-linux64/chrome",
].filter((candidate): candidate is string => Boolean(candidate));

for (const candidate of candidates) {
  try {
    accessSync(candidate, constants.X_OK);
    process.stdout.write(candidate);
    process.exit(0);
  } catch {
    continue;
  }
}

process.stderr.write("No executable Chrome/Chromium binary found.\n");
process.exit(1);
