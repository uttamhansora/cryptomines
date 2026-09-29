import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRound, pickCell, pickVault, cashOut } from '../packages/math-engine/dist/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = join(root, 'math', 'index.json');
const fixturePath = join(root, 'math', 'fixtures', 'sample-round.json');

const errors = [];

if (!existsSync(indexPath)) errors.push('missing math/index.json');
else {
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  for (const mode of index.modes ?? []) {
    const eventsRel = mode.events ?? mode.book;
    const weightsRel = mode.weights ?? mode.lookupTable;
    if (eventsRel && !existsSync(join(root, 'math', eventsRel))) {
      errors.push(`missing book artifact: ${eventsRel}`);
    }
    if (weightsRel && !existsSync(join(root, 'math', weightsRel))) {
      errors.push(`missing lookup table: ${weightsRel}`);
    }
  }
}

if (existsSync(fixturePath)) {
  const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
  let state = createRound({ mineCount: 5, seed: 'fixture-sample' });
  for (let i = 0; i < 25; i += 1) {
    if (state.terminal) break;
    const r = pickCell(state, i);
    if (!r.ok) break;
    state = r.state;
    if (state.vault && !state.vaultResolved) pickVault(state, 1);
    if (state.safePicks >= 3 && !state.vault) {
      cashOut(state);
      break;
    }
  }
  if (!state.terminal && state.safePicks > 0) cashOut(state);
  if (state.payoutBook !== fixture.payoutMultiplier) {
    errors.push(
      `fixture payout drift: runtime ${state.payoutBook} vs file ${fixture.payoutMultiplier}`,
    );
  }
}

console.log(JSON.stringify({ ok: errors.length === 0, errors }, null, 2));
process.exit(errors.length === 0 ? 0 : 1);
