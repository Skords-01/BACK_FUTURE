#!/usr/bin/env tsx
/**
 * Run `actionlint` against `.github/workflows/**`.
 *
 * Strategy:
 * 1. Look for `actionlint` on PATH. If found — run it directly.
 * 2. Otherwise look for a cached binary under `node_modules/.cache/actionlint/`.
 * 3. Otherwise download a pinned release from GitHub for the current
 *    OS / arch, extract the binary into the cache, and run it.
 *
 * The binary lives in `node_modules/.cache/` so it's git-ignored and survives
 * `npm ci` reinstalls but gets blown away by `rm -rf node_modules`.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const ACTIONLINT_VERSION = "1.7.7";

interface PlatformInfo {
  filename: string;
  binary: string;
}

function detectPlatform(): PlatformInfo {
  const platform = process.platform;
  const arch = process.arch;
  if (platform === "linux" && arch === "x64") {
    return {
      filename: `actionlint_${ACTIONLINT_VERSION}_linux_amd64.tar.gz`,
      binary: "actionlint",
    };
  }
  if (platform === "linux" && arch === "arm64") {
    return {
      filename: `actionlint_${ACTIONLINT_VERSION}_linux_arm64.tar.gz`,
      binary: "actionlint",
    };
  }
  if (platform === "darwin" && arch === "x64") {
    return {
      filename: `actionlint_${ACTIONLINT_VERSION}_darwin_amd64.tar.gz`,
      binary: "actionlint",
    };
  }
  if (platform === "darwin" && arch === "arm64") {
    return {
      filename: `actionlint_${ACTIONLINT_VERSION}_darwin_arm64.tar.gz`,
      binary: "actionlint",
    };
  }
  if (platform === "win32" && arch === "x64") {
    return {
      filename: `actionlint_${ACTIONLINT_VERSION}_windows_amd64.zip`,
      binary: "actionlint.exe",
    };
  }
  throw new Error(`Unsupported platform ${platform}/${arch}`);
}

function isOnPath(name: string): string | null {
  const which = spawnSync(process.platform === "win32" ? "where" : "which", [name], {
    stdio: ["ignore", "pipe", "ignore"],
  });
  if (which.status !== 0) return null;
  const found = which.stdout.toString().trim().split(/\r?\n/)[0];
  return found && existsSync(found) ? found : null;
}

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(moduleDir, "..");
const cacheRoot = path.join(repoRoot, "node_modules", ".cache", "actionlint");

async function downloadActionlint(info: PlatformInfo): Promise<string> {
  mkdirSync(cacheRoot, { recursive: true });
  const cachedBinary = path.join(cacheRoot, info.binary);
  if (existsSync(cachedBinary)) return cachedBinary;

  const url = `https://github.com/rhysd/actionlint/releases/download/v${ACTIONLINT_VERSION}/${info.filename}`;
  console.error(`Downloading actionlint ${ACTIONLINT_VERSION} from ${url} ...`);
  const archivePath = path.join(tmpdir(), info.filename);
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  await pipeline(
    Readable.fromWeb(response.body as unknown as WebReadableStream<Uint8Array>),
    createWriteStream(archivePath),
  );

  if (info.filename.endsWith(".tar.gz")) {
    execFileSync("tar", ["-xzf", archivePath, "-C", cacheRoot], { stdio: "inherit" });
  } else if (info.filename.endsWith(".zip")) {
    execFileSync("unzip", ["-o", archivePath, "-d", cacheRoot], { stdio: "inherit" });
  } else {
    throw new Error(`Unknown archive extension for ${info.filename}`);
  }

  if (!existsSync(cachedBinary)) {
    throw new Error(`actionlint binary not found at ${cachedBinary} after extraction`);
  }
  return cachedBinary;
}

async function resolveBinary(): Promise<string> {
  if (process.env.ACTIONLINT_BIN && existsSync(process.env.ACTIONLINT_BIN)) {
    return process.env.ACTIONLINT_BIN;
  }
  const onPath = isOnPath("actionlint");
  if (onPath) return onPath;

  const info = detectPlatform();
  return downloadActionlint(info);
}

async function main(): Promise<void> {
  if (process.env.SKIP_ACTIONLINT === "1") {
    console.log("SKIP_ACTIONLINT=1 — skipping workflow lint.");
    return;
  }

  let binary: string;
  try {
    binary = await resolveBinary();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`warning: could not obtain actionlint (${message}); skipping lint:workflows.`);
    console.warn(
      "  Set SKIP_ACTIONLINT=1 to silence this, or install actionlint manually and rerun.",
    );
    return;
  }

  // `actionlint` with no positional arguments auto-discovers the nearest
  // `.github/workflows/` from cwd. Force the cwd to repoRoot so devs can
  // invoke `npm run lint:workflows` from any subdirectory.
  const result = spawnSync(binary, ["-color"], {
    stdio: "inherit",
    cwd: repoRoot,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

await main();
