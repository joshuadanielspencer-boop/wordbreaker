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

// 4. Every bank must be reachable. Six were written and never called before
//    this check existed, including the "we have found your nemesis" moment.
const { readFileSync, readdirSync } = await import('node:fs');
const { resolve: r2 } = await import('node:path');
const JS_ROOT = r2(import.meta.dirname, '..', 'js');
const sources = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.js') && !p.includes('/voice/')) sources.push(readFileSync(p, 'utf8'));
  }
})(JS_ROOT);
const allSource = sources.join('\n');

// `error` is the documented fallback for contexts with no specific bank; it is
// intentionally reached by name only from voice.js.
const INTENTIONALLY_UNREFERENCED = new Set(['error']);
const dead = Object.keys(BANKS).filter(k =>
  !INTENTIONALLY_UNREFERENCED.has(k) && !new RegExp(`['"]${k}['"]`).test(allSource));
if (dead.length) {
  console.log(`voice: DEAD BANKS — written but never called: ${dead.join(', ')}`);
  console.log('  Wire them or delete them; unreachable dialogue is not content.');
  failed = true;
} else {
  console.log('voice: every bank is reachable.');
}

process.exit(failed ? 1 : 0);
