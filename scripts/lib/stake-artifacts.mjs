import { writeFileSync, readFileSync, existsSync, statSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, basename } from 'node:path';
import { zstdCompressSync, zstdDecompressSync } from 'node:zlib';

export const OFFICIAL_MODE_KEYS = ['name', 'cost', 'events', 'weights'];

export function failEmptyEvent(filename) {
  console.error(`EVENT_ARTIFACT_EMPTY:\n${filename}`);
  process.exit(1);
}

export function failEmptyIndex() {
  console.error('INDEX_JSON_EMPTY');
  process.exit(1);
}

export function assertNonEmptyBuffer(buf, filename) {
  if (!buf || buf.length === 0) {
    if (basename(filename) === 'index.json') failEmptyIndex();
    failEmptyEvent(filename);
  }
}

export function writeNonEmptyFile(filePath, content) {
  const buf = Buffer.isBuffer(content) ? content : Buffer.from(String(content), 'utf8');
  assertNonEmptyBuffer(buf, filePath);
  mkdirSync(dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp`;
  writeFileSync(tmp, buf);
  const size = statSync(tmp).size;
  if (size === 0) {
    rmSync(tmp, { force: true });
    assertNonEmptyBuffer(Buffer.alloc(0), filePath);
  }
  writeFileSync(filePath, buf);
  rmSync(tmp, { force: true });
  return size;
}

export function readRequiredFile(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`missing file: ${filePath}`);
  }
  const st = statSync(filePath);
  if (st.size === 0) {
    if (basename(filePath) === 'index.json') failEmptyIndex();
    failEmptyEvent(filePath);
  }
  return readFileSync(filePath);
}

export function compressZstd(utf8Text) {
  const input = Buffer.from(utf8Text, 'utf8');
  assertNonEmptyBuffer(input, 'events.jsonl');
  const compressed = zstdCompressSync(input);
  assertNonEmptyBuffer(compressed, 'events.jsonl.zst');
  return compressed;
}

export function decompressZstd(buf) {
  return zstdDecompressSync(buf);
}

export function parseJsonlBooks(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const rows = [];
  for (let i = 0; i < lines.length; i += 1) {
    let row;
    try {
      row = JSON.parse(lines[i]);
    } catch (error) {
      throw new Error(`JSONL line ${i + 1}: ${error.message}`);
    }
    rows.push({ line: i + 1, row });
  }
  return rows;
}

export function officialIndexPayload(modes) {
  return {
    modes: modes.map((mode) => ({
      name: mode.name,
      cost: mode.cost,
      events: mode.events,
      weights: mode.weights,
    })),
  };
}

export function stringifyOfficialIndex(modes) {
  const json = `${JSON.stringify(officialIndexPayload(modes), null, 4)}\n`;
  if (!json.trim()) failEmptyIndex();
  return json;
}
