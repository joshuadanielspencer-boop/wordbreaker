// One command, every invariant. Run before trusting a change.
//   node tools/check.mjs
import { auditGentleBanks } from '../js/voice/voice.js';
import { BANKS } from '../js/voice/banks.js';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

let failed = false;

// 1. Content integrity.
try {
  console.log(execFileSync('node',
    [resolve(import.meta.dirname, 'check-content.mjs')], { encoding: 'utf8' }));
} catch (e) {
  console.log(e.stdout || ''); failed = true;
}

// 2. The voice guarantee: nothing sardonic may ever fire after a mistake.
const bad = auditGentleBanks();
if (bad.length) {
  console.log(`GENTLE BANK VIOLATION — joke/absurd content in: ${bad.join(', ')}`);
  console.log('  Mistake feedback must never be sarcastic. Move it to blockEnd.');
  failed = true;
} else {
  console.log('voice: gentle banks clean — no joke tier reachable after a mistake.');
}

// 3. Every bank has at least a plain tier, or say() silently returns ''.
const empty = Object.entries(BANKS).filter(([, b]) => !(b.plain || []).length);
if (empty.length) {
  console.log(`banks with no plain tier: ${empty.map(([k]) => k).join(', ')}`);
  failed = true;
} else {
  console.log(`voice: ${Object.keys(BANKS).length} banks, all have a plain tier.`);
}

process.exit(failed ? 1 : 0);
