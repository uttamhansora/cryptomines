#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  OFFICIAL_MODE_KEYS,
  readRequiredFile,
  decompressZstd,
  parseJsonlBooks,
  failEmptyEvent,
  failEmptyIndex,
} from './lib/stake-artifacts.mjs';

function printUsage() {
  console.error(
    'Usage: node scripts/validate-stake-package.mjs --index <index.json> [--also-index <index.json>] [--format json|text]',
  );
}

function parseArgs(argv) {
  const args = { index: '', alsoIndex: '', format: 'json' };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === '--index' && value) {
      args.index = value;
      i += 1;
    } else if (key === '--also-index' && value) {
      args.alsoIndex = value;
      i += 1;
    } else if (key === '--format' && value) {
      if (value !== 'json' && value !== 'text') throw new Error("--format must be 'json' or 'text'");
      args.format = value;
      i += 1;
    } else if (key.startsWith('--')) {
      throw new Error(`Unknown option: ${key}`);
    }
  }
  if (!args.index) throw new Error('Missing required option --index');
  return args;
}

function pushError(errors, mode, code, message) {
  errors.push({ mode, code, message });
}

function loadIndex(indexPath) {
  if (!fs.existsSync(indexPath)) {
    throw new Error(`Index file not found: ${indexPath}`);
  }
  const st = fs.statSync(indexPath);
  if (st.size === 0) failEmptyIndex();
  let data;
  try {
    data = JSON.parse(readRequiredFile(indexPath).toString('utf8'));
  } catch (error) {
    throw new Error(`Failed to parse index JSON: ${error.message}`);
  }
  return { data, bytes: st.size };
}

function readEventBook(filePath) {
  const raw = readRequiredFile(filePath);
  let text;
  if (filePath.endsWith('.zst')) {
    text = decompressZstd(raw).toString('utf8');
  } else {
    text = raw.toString('utf8');
  }
  if (!text.trim()) failEmptyEvent(filePath);
  return parseJsonlBooks(text);
}

function readLookup(filePath) {
  const text = readRequiredFile(filePath).toString('utf8');
  const rows = [];
  for (const [i, line] of text.split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const cols = trimmed.split(',');
    if (cols.length < 3) {
      throw new Error(`${filePath} row ${i + 1}: expected id,weight,payoutMultiplier`);
    }
    if (i === 0 && Number.isNaN(Number(cols[0]))) continue;
    const id = Number(cols[0]);
    const weight = Number(cols[1]);
    const payoutMultiplier = Number(cols[2]);
    if (!Number.isInteger(id) || !(weight > 0) || !Number.isFinite(payoutMultiplier)) {
      throw new Error(`${filePath} row ${i + 1}: invalid numeric columns`);
    }
    rows.push({ id, weight, payoutMultiplier });
  }
  if (rows.length === 0) failEmptyEvent(filePath);
  return rows;
}

function validateMode(mode, indexDir, errors) {
  const modeName = mode?.name ?? '*';
  if (!mode || typeof mode !== 'object') {
    pushError(errors, '*', 'invalid_mode', 'Mode entry is missing or invalid.');
    return { name: modeName, bookCount: 0 };
  }
  for (const key of OFFICIAL_MODE_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(mode, key)) {
      pushError(errors, modeName, 'missing_key', `mode missing official key '${key}'`);
    }
  }
  if (typeof mode.name !== 'string' || mode.name.trim() === '') {
    pushError(errors, modeName, 'invalid_name', 'mode.name must be a non-empty string');
  }
  if (typeof mode.cost !== 'number' || !Number.isFinite(mode.cost) || mode.cost <= 0) {
    pushError(errors, modeName, 'invalid_cost', 'mode.cost must be a positive number');
  }
  if (typeof mode.events !== 'string' || mode.events.trim() === '') {
    pushError(errors, modeName, 'empty_events', 'event file cannot be empty');
  }
  if (typeof mode.weights !== 'string' || mode.weights.trim() === '') {
    pushError(errors, modeName, 'empty_weights', 'weights file cannot be empty');
  }
  if (typeof mode.events !== 'string' || !mode.events.trim()) {
    return { name: modeName, bookCount: 0 };
  }

  const eventsPath = path.resolve(indexDir, mode.events);
  const weightsPath = path.resolve(indexDir, mode.weights);
  if (!fs.existsSync(eventsPath)) {
    pushError(errors, modeName, 'missing_events', `events file not found: ${eventsPath}`);
    return { name: modeName, bookCount: 0 };
  }
  if (fs.statSync(eventsPath).size === 0) {
    failEmptyEvent(eventsPath);
  }
  if (!fs.existsSync(weightsPath)) {
    pushError(errors, modeName, 'missing_weights', `weights file not found: ${weightsPath}`);
    return { name: modeName, bookCount: 0 };
  }
  if (fs.statSync(weightsPath).size === 0) {
    failEmptyEvent(weightsPath);
  }

  let books;
  try {
    books = readEventBook(eventsPath);
  } catch (error) {
    pushError(errors, modeName, 'invalid_events', error.message);
    return { name: modeName, bookCount: 0 };
  }

  let weights;
  try {
    weights = readLookup(weightsPath);
  } catch (error) {
    pushError(errors, modeName, 'invalid_weights', error.message);
    return { name: modeName, bookCount: 0 };
  }

  const bookIds = new Set();
  for (const { line, row } of books) {
    if (!Number.isInteger(row.id)) {
      pushError(errors, modeName, 'invalid_id', `books line ${line}: id must be an integer`);
      continue;
    }
    if (bookIds.has(row.id)) {
      pushError(errors, modeName, 'duplicate_id', `books duplicate id ${row.id}`);
    }
    bookIds.add(row.id);
    if (!Array.isArray(row.events) || row.events.length === 0) {
      failEmptyEvent(`${path.basename(eventsPath)}#id=${row.id}`);
    }
    if (typeof row.payoutMultiplier !== 'number' || !Number.isInteger(row.payoutMultiplier)) {
      pushError(errors, modeName, 'invalid_payout', `books id ${row.id}: payoutMultiplier must be int`);
    }
    validateBookEventStream(modeName, row, errors);
  }

  const weightIds = new Set(weights.map((w) => w.id));
  const payoutById = new Map(weights.map((w) => [w.id, w.payoutMultiplier]));
  for (const { row } of books) {
    if (!weightIds.has(row.id)) {
      pushError(errors, modeName, 'unresolved_id', `lookup missing book id ${row.id}`);
    } else if (payoutById.get(row.id) !== row.payoutMultiplier) {
      pushError(
        errors,
        modeName,
        'payout_mismatch',
        `id ${row.id}: book payout ${row.payoutMultiplier} != lookup ${payoutById.get(row.id)}`,
      );
    }
  }
  for (const id of weightIds) {
    if (!bookIds.has(id)) {
      pushError(errors, modeName, 'unknown_weight_id', `lookup references unknown id ${id}`);
    }
  }

  return { name: modeName, bookCount: books.length, eventsPath, weightsPath };
}

function validateIndexFile(indexPath, errors) {
  const resolved = path.resolve(indexPath);
  const { data, bytes } = loadIndex(resolved);
  if (!Array.isArray(data.modes) || data.modes.length === 0) {
    pushError(errors, '*', 'no_modes', "index must contain non-empty 'modes' array");
    return { index: resolved, bytes, modes: [] };
  }
  const modes = data.modes.map((mode) => validateMode(mode, path.dirname(resolved), errors));
  return { index: resolved, bytes, modes };
}

function validateBookEventStream(modeName, row, errors) {
  const events = row.events;
  const types = events.map((ev) => String(ev?.type ?? '').toLowerCase());
  for (const [idx, ev] of events.entries()) {
    if (!ev || typeof ev !== 'object' || typeof ev.type !== 'string' || !ev.type.trim()) {
      pushError(errors, modeName, 'invalid_event', `books id ${row.id} event ${idx}: missing type`);
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(ev, 'index') && ev.index !== idx) {
      pushError(errors, modeName, 'non_contiguous_index', `books id ${row.id}: event.index must be contiguous from 0`);
    }
  }
  if (!types.includes('reveal')) {
    pushError(errors, modeName, 'missing_reveal', `books id ${row.id}: round must include a reveal event`);
  }
  const terminalIdx = types.lastIndexOf('finalwin');
  if (terminalIdx === -1) {
    pushError(errors, modeName, 'missing_terminal_event', `books id ${row.id}: missing finalWin`);
  } else if (terminalIdx !== events.length - 1) {
    pushError(errors, modeName, 'event_after_terminal', `books id ${row.id}: events after finalWin`);
  } else if (events[terminalIdx]?.amount !== row.payoutMultiplier) {
    pushError(
      errors,
      modeName,
      'payout_multiplier_mismatch',
      `books id ${row.id}: finalWin.amount ${events[terminalIdx]?.amount} != payoutMultiplier ${row.payoutMultiplier}`,
    );
  }
  if (!types.includes('settotalwin')) {
    pushError(errors, modeName, 'missing_set_total_win', `books id ${row.id}: missing setTotalWin`);
  }
}

function renderText(result) {
  const lines = [
    `status: ${result.status}`,
    `indexes: ${result.indexes.length}`,
    `eventArtifactCount: ${result.eventArtifactCount}`,
    `errors: ${result.errors.length}`,
  ];
  for (const idx of result.indexes) {
    lines.push(`index: ${idx.index} (${idx.bytes} bytes)`);
    for (const mode of idx.modes) {
      lines.push(`  mode=${mode.name} books=${mode.bookCount}`);
    }
  }
  if (result.errors.length > 0) {
    lines.push('');
    lines.push('Error details:');
    for (const err of result.errors) {
      lines.push(`- [${err.code}] mode=${err.mode}: ${err.message}`);
    }
  }
  return lines.join('\n');
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    printUsage();
    console.error(error.message);
    process.exit(2);
  }

  const errors = [];
  const indexes = [];
  try {
    indexes.push(validateIndexFile(args.index, errors));
    if (args.alsoIndex) indexes.push(validateIndexFile(args.alsoIndex, errors));
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }

  const eventArtifactCount = (indexes[0]?.modes ?? []).reduce((s, mode) => s + (mode.bookCount ?? 0), 0);

  const result = {
    status: errors.length > 0 ? 'fail' : 'pass',
    eventArtifactCount,
    indexes,
    errors,
  };

  if (args.format === 'text') console.log(renderText(result));
  else console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === 'pass' ? 0 : 1);
}

main();
