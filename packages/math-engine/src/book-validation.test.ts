import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRound, pickCell, pickVault, cashOut } from './round-engine.js';

const root = join(process.cwd(), '..', '..');
const indexPath = join(root, 'math', 'index.json');
const fixturePath = join(root, 'math', 'fixtures', 'sample-round.json');

describe('book artifacts', () => {
  it('index references exist or are reported missing', () => {
    if (!existsSync(indexPath)) return;
    const index = JSON.parse(readFileSync(indexPath, 'utf8'));
    const missing: string[] = [];
    for (const mode of index.modes ?? []) {
      const eventsRel = mode.events ?? mode.book;
      const weightsRel = mode.weights ?? mode.lookupTable;
      if (eventsRel && !existsSync(join(root, 'math', eventsRel))) missing.push(eventsRel);
      if (weightsRel && !existsSync(join(root, 'math', weightsRel))) missing.push(weightsRel);
    }
    expect(missing).toEqual([]);
  });

  it('sample fixture matches deterministic regeneration', () => {
    if (!existsSync(fixturePath)) return;
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
    expect(state.payoutBook).toBe(fixture.payoutMultiplier);
  });
});
