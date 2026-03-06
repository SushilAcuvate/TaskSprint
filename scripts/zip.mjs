/**
 * Cross-platform script to zip the dist/ folder into tasksprint.zip.
 * Ensures manifest.json appears at the root of the archive (not inside a dist/ subfolder).
 * Usage: node scripts/zip.mjs
 */
import { zip } from "bestzip";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const source = "*";
const dest = resolve(root, "tasksprint.zip");
const cwd = resolve(root, "dist");

await zip({ source, destination: dest, cwd });
console.log(`Created ${dest}`);
