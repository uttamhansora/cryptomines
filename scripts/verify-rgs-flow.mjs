#!/usr/bin/env node
/**
 * Run RGS wallet integration tests (authenticate → play → events → end-round rules).
 * Prefer: npm run validate:rgs-flow
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = spawnSync('npm', ['run', 'validate:rgs-flow'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});
process.exit(r.status ?? 1);
