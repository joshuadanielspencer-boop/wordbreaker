// Bundles the app into standalone HTML.
//
//   node tools/bundle.mjs            -> dist/wordbreaker.html      (open anywhere)
//   node tools/bundle.mjs --artifact -> dist/wordbreaker.body.html (for hosts that
//                                       supply their own document skeleton)
//
// Every module is emitted EXACTLY ONCE, transformed from ES module syntax into
// a plain registry of factory results. No blob: URLs, no data: URLs, no
// external requests — so the output survives a strict Content-Security-Policy,
// which is what most static hosts and embedded viewers apply.
//
// Two approaches were tried and rejected. Inlining each module as a base64
// data: URL makes every importer carry its own copy of the whole dependency
// tree (150 KB app -> 1.2 MB file). Stitching modules together with blob: URLs
// fixes the size but dies under `script-src` policies that omit `blob:`.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const ENTRY = resolve(ROOT, 'js/main.js');
const ARTIFACT = process.argv.includes('--artifact');

const IMPORT = /^[ \t]*import\s*\{([^}]*)\}\s*from\s*['"](\.[^'"]+)['"]\s*;?[ \t]*$/gm;
const EXPORT_DECL = /^([ \t]*)export\s+(async\s+)?(function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm;
const EXPORT_LIST = /^[ \t]*export\s*\{([^}]*)\}\s*;?[ \t]*$/gm;

const modules = [];
const seen = new Map();

function transform(file, stack = []) {
  if (seen.has(file)) return seen.get(file);
  if (stack.includes(file))
    throw new Error('import cycle: ' + [...stack, file].map(f => relative(ROOT, f)).join(' -> '));

  const key = relative(ROOT, file);
  let src = readFileSync(file, 'utf8');
  const exports = new Set();

  // import { a, b as c } from './x.js'  ->  const { a, b: c } = __req('x')
  src = src.replace(IMPORT, (_, names, spec) => {
    const dep = transform(resolve(dirname(file), spec), [...stack, file]);
    const binds = names.split(',').map(n => n.trim()).filter(Boolean)
      .map(n => {
        const m = n.match(/^(\S+)\s+as\s+(\S+)$/);
        return m ? `${m[1]}: ${m[2]}` : n;
      }).join(', ');
    return `const { ${binds} } = __req(${JSON.stringify(dep)});`;
  });

  // export function f / export const X  ->  strip keyword, record the name
  src = src.replace(EXPORT_DECL, (_, indent, asyncKw, kind, name) => {
    exports.add(name);
    return `${indent}${asyncKw || ''}${kind} ${name}`;
  });

  // export { a, b as c }
  src = src.replace(EXPORT_LIST, (_, names) => {
    for (const n of names.split(',').map(x => x.trim()).filter(Boolean)) {
      const m = n.match(/^(\S+)\s+as\s+(\S+)$/);
      exports.add(m ? `${m[2]}: ${m[1]}` : n);
    }
    return '';
  });

  if (/^\s*export\s+default/m.test(src))
    throw new Error(`${key}: default exports are not supported by this bundler`);
  if (/^\s*export\s/m.test(src))
    throw new Error(`${key}: an export statement was not recognised`);

  const ret = [...exports].map(e => (e.includes(':') ? e : `${e}: ${e}`)).join(', ');
  modules.push(`__M[${JSON.stringify(key)}] = (function () {\n${src}\nreturn { ${ret} };\n})();`);
  seen.set(file, key);
  return key;
}

const entryKey = transform(ENTRY);

const js = [
  '(function () {',
  '"use strict";',
  'const __M = {};',
  'function __req(k) { return __M[k]; }',
  ...modules,
  'void __M[' + JSON.stringify(entryKey) + '];',
  '})();',
].join('\n');

const css = readFileSync(resolve(ROOT, 'css/app.css'), 'utf8');
mkdirSync(resolve(ROOT, 'dist'), { recursive: true });

let out, html;
if (ARTIFACT) {
  // The host supplies <!doctype>, <html>, <head> and <body>.
  out = resolve(ROOT, 'dist/wordbreaker.body.html');
  html = `<title>Wordbreaker</title>\n<style>\n${css}\n</style>\n<div id="app"></div>\n<script>\n${js}\n</script>\n`;
} else {
  out = resolve(ROOT, 'dist/wordbreaker.html');
  html = readFileSync(resolve(ROOT, 'index.html'), 'utf8')
    .replace('<link rel="stylesheet" href="css/app.css">', `<style>\n${css}\n</style>`)
    .replace('<script type="module" src="js/main.js"></script>', `<script>\n${js}\n</script>`);
}

writeFileSync(out, html);
console.log(`${relative(ROOT, out)}  —  ${modules.length} modules, ${(html.length / 1024).toFixed(0)} KB`);
