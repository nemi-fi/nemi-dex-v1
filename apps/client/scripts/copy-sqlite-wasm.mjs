// Copies the sqlite3 wasm out of node_modules into public/ at build time.
//
// The OPFS worker (@aztec/kv-store) loads sqlite3 inside a Web Worker, and webpack only emits the
// wasm asset for the main-thread bundle — the worker bundle has no emitted URL, so it can only
// fetch the wasm from a same-origin URL it builds itself. The @aztec/sqlite3mc-wasm patch resolves
// it to `<origin>/sqlite3.wasm`; this script makes that path exist by copying the file the package
// ships. It is intentionally sourced from node_modules (not committed) so there is a single source
// of truth. public/sqlite3.wasm is gitignored.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// `@aztec/sqlite3mc-wasm` is a direct devDependency, so pnpm symlinks it into node_modules here.
// (Its package `exports` has no main entry, so we resolve the shipped file by path rather than
// require.resolve.)
const clientDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const wasmSrc = resolve(
  clientDir,
  "node_modules/@aztec/sqlite3mc-wasm/vendor/jswasm/sqlite3.wasm",
);

const publicDir = resolve(clientDir, "public");
const wasmDest = resolve(publicDir, "sqlite3.wasm");

mkdirSync(publicDir, { recursive: true });
copyFileSync(wasmSrc, wasmDest);
console.log(`copy-sqlite-wasm: ${wasmSrc} -> ${wasmDest}`);
