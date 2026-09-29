#!/usr/bin/env node
/**
 * Generate internal payout histograms AND the Stake Engine event package.
 * Event streams come only from the math-engine. No placeholder events.
 *
 * Order:
 *  1. simulate (authoritative engine)
 *  2. validate in-memory events
 *  3. write event jsonl
 *  4. write lookup tables
 *  5. compress event books
 *  6. write index.json
 */
import { existsSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createRound,
  pickCell,
  cashOut,
  createBuyVaultRound,
  pickVault,
} from '../packages/math-engine/dist/round-engine.js';
import { SeededRng } from '../packages/math-engine/dist/rng.js';
import { VAULT_CHEST_COUNT, BUY_VAULT_COST_MULTIPLIER } from '../packages/shared/dist/index.js';
import {
  writeNonEmptyFile,
  compressZstd,
  failEmptyEvent,
  stringifyOfficialIndex,
} from './lib/stake-artifacts.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publishDir = join(root, 'math', 'publish_files');
const seed = 'book-gen-v1';

function playBaseRound(r) {
  let state = createRound({ mineCount: 5, seed: `${seed}:b:${r}` });
  const order = new SeededRng(`${seed}:o:${r}`).shuffle(Array.from({ length: 25 }, (_, i) => i));
  const vaultRng = new SeededRng(`${seed}:v:${r}`);
  for (const cell of order) {
    const res = pickCell(state, cell);
    if (!res.ok) break;
    state = res.state;
    if (state.events.at(-1)?.revealType === 'tileMine') break;
    if (state.vault && !state.vaultResolved) {
      pickVault(state, vaultRng.nextUint32() % VAULT_CHEST_COUNT);
    }
    if (state.safePicks >= 3) {
      cashOut(state);
      break;
    }
  }
  if (state.vault && !state.vaultResolved) {
    pickVault(state, vaultRng.nextUint32() % VAULT_CHEST_COUNT);
  }
  if (!state.terminal && state.safePicks > 0) cashOut(state);
  return state;
}

function playBuyRound(r, rng) {
  const state = createBuyVaultRound({ seed: `${seed}:buy:${r}` });
  pickVault(state, rng.nextUint32() % VAULT_CHEST_COUNT);
  return state;
}

function assertRoundEvents(state, label) {
  if (!Array.isArray(state.events) || state.events.length === 0) {
    failEmptyEvent(label);
  }
  if (!state.terminal) {
    throw new Error(`non-terminal round cannot be published: ${label}`);
  }
  if (typeof state.payoutBook !== 'number' || !Number.isFinite(state.payoutBook)) {
    throw new Error(`invalid payoutBook for ${label}`);
  }
}

function toBookRow(id, state) {
  return {
    id,
    events: state.events,
    payoutMultiplier: state.payoutBook,
  };
}

function writeEventBook(modeName, rows) {
  if (rows.length === 0) failEmptyEvent(`books_${modeName}.jsonl`);
  for (const row of rows) {
    if (!Array.isArray(row.events) || row.events.length === 0) {
      failEmptyEvent(`books_${modeName}.jsonl#id=${row.id}`);
    }
  }
  const jsonl = `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`;
  const jsonlName = `books_${modeName}.jsonl`;
  const zstName = `${jsonlName}.zst`;
  writeNonEmptyFile(join(publishDir, jsonlName), jsonl);
  writeNonEmptyFile(join(publishDir, zstName), compressZstd(jsonl));
  return { jsonlName, zstName, count: rows.length };
}

function writeLookupTable(modeName, rows) {
  const csv = `${rows.map((row) => `${row.id},1,${row.payoutMultiplier}`).join('\n')}\n`;
  const name = `lookUpTable_${modeName}_0.csv`;
  writeNonEmptyFile(join(publishDir, name), csv);
  return name;
}

function collectCoverage(rows) {
  const types = new Set();
  const revealTypes = new Set();
  const sources = new Set();
  let buyVault = 0;
  let vaultPayout = 0;
  for (const { events } of rows) {
    for (const ev of events) {
      if (ev.type) types.add(String(ev.type));
      if (ev.revealType) revealTypes.add(String(ev.revealType));
      if (ev.source) sources.add(String(ev.source));
      if (ev.buyVault === true) buyVault += 1;
      if (typeof ev.vaultPayoutBook === 'number') vaultPayout += 1;
    }
  }
  return {
    types: [...types].sort(),
    revealTypes: [...revealTypes].sort(),
    sources: [...sources].sort(),
    buyVaultEvents: buyVault,
    vaultPayoutBookEvents: vaultPayout,
  };
}

if (existsSync(publishDir)) {
  rmSync(publishDir, { recursive: true, force: true });
}
mkdirSync(join(root, 'math', 'books'), { recursive: true });
mkdirSync(join(root, 'math', 'lookup'), { recursive: true });
mkdirSync(publishDir, { recursive: true });

const hist = new Map();
const baseRows = [];
const buyRows = [];

for (let r = 0; r < 10_000; r += 1) {
  const state = playBaseRound(r);
  assertRoundEvents(state, `base:${r}`);
  hist.set(state.payoutBook, (hist.get(state.payoutBook) ?? 0) + 1);
  baseRows.push(toBookRow(r + 1, state));
}

const rng = new SeededRng(`${seed}:buy`);
for (let r = 0; r < 1000; r += 1) {
  const state = playBuyRound(r, rng);
  assertRoundEvents(state, `buyVault:${r}`);
  hist.set(state.payoutBook, (hist.get(state.payoutBook) ?? 0) + 1);
  buyRows.push(toBookRow(r + 1, state));
}

const histEntries = [...hist.entries()].map(([payoutMultiplier, weight]) => ({
  payoutMultiplier,
  weight,
}));
const histJsonl = `${histEntries.map((e) => JSON.stringify(e)).join('\n')}\n`;
writeNonEmptyFile(join(root, 'math', 'books', 'base_sample.jsonl'), histJsonl);
writeNonEmptyFile(
  join(root, 'math', 'lookup', 'base_weights.csv'),
  `payoutMultiplier,weight\n${histEntries.map((e) => `${e.payoutMultiplier},${e.weight}`).join('\n')}\n`,
);

const baseBook = writeEventBook('base', baseRows);
const baseLut = writeLookupTable('base', baseRows);
const buyBook = writeEventBook('buyVault', buyRows);
const buyLut = writeLookupTable('buyVault', buyRows);

const publishModes = [
  { name: 'base', cost: 1.0, events: baseBook.zstName, weights: baseLut },
  { name: 'buyVault', cost: BUY_VAULT_COST_MULTIPLIER, events: buyBook.zstName, weights: buyLut },
];
const mathModes = [
  {
    name: 'base',
    cost: 1.0,
    events: `publish_files/${baseBook.zstName}`,
    weights: `publish_files/${baseLut}`,
  },
  {
    name: 'buyVault',
    cost: BUY_VAULT_COST_MULTIPLIER,
    events: `publish_files/${buyBook.zstName}`,
    weights: `publish_files/${buyLut}`,
  },
];

writeNonEmptyFile(join(publishDir, 'index.json'), stringifyOfficialIndex(publishModes));
writeNonEmptyFile(join(root, 'math', 'index.json'), stringifyOfficialIndex(mathModes));

const coverage = {
  base: collectCoverage(baseRows),
  buyVault: collectCoverage(buyRows),
};

console.log(
  JSON.stringify(
    {
      ok: true,
      generationOrder: [
        'simulate-engine',
        'validate-events',
        'write-event-jsonl',
        'write-lookup',
        'compress-zst',
        'write-index.json',
      ],
      histogramOutcomes: histEntries.length,
      eventBooks: {
        base: baseBook.count,
        buyVault: buyBook.count,
      },
      publishDir: 'math/publish_files',
      coverage,
    },
    null,
    2,
  ),
);
