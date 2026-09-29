import { createRound, pickCell, cashOut, pickVault } from '../../packages/math-engine/dist/index.js';

let state = createRound({ mineCount: 5, seed: 'fixture-sample' });
for (let i = 0; i < 25; i += 1) {
  if (state.terminal) break;
  const r = pickCell(state, i);
  if (!r.ok) break;
  state = r.state;
  if (state.vault && !state.vaultResolved) {
    pickVault(state, 1);
  }
  if (state.safePicks >= 3 && !state.vault) {
    cashOut(state);
    break;
  }
  if (state.terminal) break;
}
if (!state.terminal && state.safePicks > 0) cashOut(state);

import fs from 'node:fs';
const out = {
  payoutMultiplier: state.payoutBook,
  events: state.events,
};
fs.writeFileSync(new URL('./sample-round.json', import.meta.url), JSON.stringify(out, null, 2));
