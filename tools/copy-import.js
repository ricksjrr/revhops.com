/* =============================================================================
   RevHops — copy import

   Run:  node tools/copy-import.js revhops-homepage-copy.txt
         node tools/copy-import.js revhops-homepage-copy.txt --dry

   Reads the edited copy file and writes the changed strings back into
   index.html and assets/js/maturity-slider.js.

   It refuses rather than guesses. Before writing anything it checks that the
   source files still hold exactly what the export recorded: same number of
   strings, in the same order, with the same original text. If a single one has
   moved, the export is stale and the whole run aborts. Applying a stale map
   would put the right words in the wrong places, which is far worse than
   asking for a fresh export.

   Editing rules it enforces on the file:
     · every [[id]] from the export must still be present, exactly once
     · ids it has never heard of are an error, not a warning

   What it does NOT do: sanity-check the words themselves. If a paragraph is
   pasted into the nav slot, that is what ships. Run tools/smoke.js afterwards.
   ============================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const MAP = path.join(__dirname, 'copy-map.json');

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const src = args.find(a => !a.startsWith('--'));
if (!src) {
  console.error('usage: node tools/copy-import.js <edited-copy-file> [--dry]');
  process.exit(2);
}

const die = m => { console.error('\nABORTED: ' + m + '\n'); process.exit(1); };

if (!fs.existsSync(MAP)) die('no tools/copy-map.json. Run node tools/copy-export.js first.');
const map = JSON.parse(fs.readFileSync(MAP, 'utf8'));

/* ------------------------------------------------- read the edited document */
/* Google Docs round-trips smart quotes and non-breaking spaces into the file.
   Undo only the ones that would change the rendered page. */
const clean = s => s
  .replace(/ /g, ' ')
  .replace(/\r/g, '')
  .trim();

const edited = new Map();
const seen = new Set();
for (const raw of fs.readFileSync(src, 'utf8').split('\n')) {
  const m = /^\s*\[\[([a-z]\d+)\]\]\s?([\s\S]*)$/.exec(raw);
  if (!m) continue;
  const [, id, body] = m;
  if (seen.has(id)) die('[[' + id + ']] appears more than once in the file.');
  seen.add(id);
  edited.set(id, clean(body));
}
if (!edited.size) die('no [[id]] entries found. Is this the right file?');

const known = new Set([...map.html.map(e => e.id), ...map.js.map(e => e.id)]);
const unknown = [...edited.keys()].filter(id => !known.has(id));
if (unknown.length) die('unknown ids: ' + unknown.join(', ') + '. The export they came from does not match this one.');
const missing = [...known].filter(id => !edited.has(id));
if (missing.length) die(missing.length + ' id(s) missing from the file, first few: ' + missing.slice(0, 8).join(', '));

/* ------------------------------------------------------------- verify HTML */
const INLINE = new Set(['SPAN', 'B', 'I', 'EM', 'STRONG', 'BR', 'SUP', 'SUB', 'CODE', 'ABBR']);
const SKIP = new Set(['SCRIPT', 'STYLE', 'SVG', 'IMG', 'BUTTON', 'NOSCRIPT', 'PATH']);

const REGIONS = ['header.nav', '.hero-pin', '.logo-band', 'section:has(.svc-list)',
                 'section:has(.case-rail)', 'section:has(.about-stack)',
                 'section:has(.tool-clump)', 'section:has(.testi)',
                 'section:has(.start-wide)', 'footer.footer'];

function htmlNodes(doc) {
  const out = [];
  for (const sel of REGIONS) {
    let region;
    try { region = doc.querySelector(sel); } catch { region = null; }
    if (!region) continue;
    (function walk(node) {
      for (const child of node.children) {
        if (SKIP.has(child.tagName)) continue;
        const kids = [...child.children].filter(c => !SKIP.has(c.tagName));
        if (child.textContent.replace(/\s+/g, ' ').trim() && kids.every(c => INLINE.has(c.tagName))) out.push(child);
        else walk(child);
      }
    })(region);
  }
  return out;
}

const htmlPath = path.join(ROOT, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
const dom = new JSDOM(html);
const nodes = htmlNodes(dom.window.document);

if (nodes.length !== map.html.length)
  die('index.html now has ' + nodes.length + ' strings, the map expects ' + map.html.length +
      '. The page changed since the export. Re-run copy-export.js and re-edit.');

nodes.forEach((node, i) => {
  const want = map.html[i].html;
  const got = node.innerHTML.replace(/\s+/g, ' ').trim();
  if (got !== want)
    die('index.html string ' + map.html[i].id + ' has changed since the export.\n' +
        '  expected: ' + want.slice(0, 70) + '\n' +
        '  found:    ' + got.slice(0, 70) + '\n' +
        '  Re-run copy-export.js and re-edit.');
});

/* --------------------------------------------------------------- verify JS */
const jsPath = path.join(ROOT, 'assets/js/maturity-slider.js');
let js = fs.readFileSync(jsPath, 'utf8');

/* the nth occurrence of a string literal, counted the same way the export did */
function nthLiteral(hay, value, nth) {
  const needle = "'" + value.replace(/'/g, "\\'") + "'";
  let idx = -1;
  for (let k = 0; k < nth; k++) {
    idx = hay.indexOf(needle, idx + 1);
    if (idx === -1) return -1;
  }
  return idx;
}

for (const e of map.js) {
  /* PROBLEM_SPLIT's body is written as two concatenated literals, so it will
     not be found as one. Those are handled separately below. */
  if (e.value.length > 120) continue;
  if (nthLiteral(js, e.value, e.nth) === -1)
    die('the slider no longer contains occurrence ' + e.nth + ' of "' + e.value.slice(0, 50) +
        '". Re-run copy-export.js and re-edit.');
}

/* ------------------------------------------------------------------- apply */
let htmlChanged = 0, jsChanged = 0;
const report = [];

/* HTML: rebuild the file by replacing each node's innerHTML in the DOM, then
   serialise. Serialising a whole document reflows the source, so instead each
   change is applied to the raw text by locating the original substring. */
for (let i = 0; i < map.html.length; i++) {
  const e = map.html[i];
  const next = edited.get(e.id);
  if (next === e.html) continue;
  const before = html;
  /* the original innerHTML as it appears in the file may be wrapped across
     lines, so match loosely on whitespace */
  const pattern = new RegExp(e.html.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\ /g, '\\s+'), '');
  const loose = new RegExp(
    e.html.split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+'));
  void pattern;
  const m = loose.exec(html);
  if (!m) die('could not locate ' + e.id + ' in the raw index.html. Re-run copy-export.js.');
  html = html.slice(0, m.index) + next + html.slice(m.index + m[0].length);
  if (html !== before) { htmlChanged++; report.push('  ' + e.id + '  ' + e.html.slice(0, 46)); }
}

for (const e of map.js) {
  const next = edited.get(e.id);
  if (next === e.value) continue;
  if (e.value.length > 120) {
    console.warn('  skipped ' + e.id + ': that string is built from two joined pieces in the ' +
                 'source and has to be edited by hand in maturity-slider.js.');
    continue;
  }
  const at = nthLiteral(js, e.value, e.nth);
  if (at === -1) die('lost ' + e.id + ' while applying. Nothing was written.');
  const needle = "'" + e.value.replace(/'/g, "\\'") + "'";
  const repl = "'" + next.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  js = js.slice(0, at) + repl + js.slice(at + needle.length);
  jsChanged++;
  report.push('  ' + e.id + '  ' + e.value.slice(0, 46));
}

if (DRY) {
  console.log('\nDRY RUN. ' + (htmlChanged + jsChanged) + ' string(s) would change:');
  report.forEach(r => console.log(r));
  console.log('\nNothing written.\n');
  process.exit(0);
}

if (!htmlChanged && !jsChanged) { console.log('\nNo changes. The file matches what is on the page.\n'); process.exit(0); }

fs.writeFileSync(htmlPath, html);
fs.writeFileSync(jsPath, js);
console.log('\nApplied ' + htmlChanged + ' change(s) to index.html and ' + jsChanged + ' to the slider:');
report.forEach(r => console.log(r));
console.log('\nNow bump the cache stamp and run: node tools/smoke.js\n');
