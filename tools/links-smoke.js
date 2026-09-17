/* =============================================================================
   RevHops — every link and every asset, on every page

   Run:  cd ~/Downloads/Claude/revhops.com && node tools/links-smoke.js
   No dependencies. It reads the built .html files and the disk, nothing else.

   WHY THIS EXISTS. Links on this site are relative and depth-correct: a page
   at the root writes `assets/…` and one a folder down writes `../assets/…`,
   and `relativise()` decides which from the page's `depth` field. Get that
   field wrong and the page still builds, still passes every other suite, and
   still opens fine from disk — it just points every stylesheet, script, image
   and link one level off. That is a whole-page failure that no per-page test
   was watching for, and it became a live risk on 17 September when five pages
   moved from `<name>/index.html` to `<name>.html` and their depth went with
   them.

   So this resolves every local reference the way a browser would, from the
   URL the page is actually served at, and checks something is there.

   THE URL A FILE IS SERVED AT, which is the whole trick:

       index.html            /
       pricing.html          /pricing
       services/index.html   /services/     <- note the slash, see below
       services/x.html       /services/x

   GitHub Pages serves `foo.html` for `/foo` and 301s `/foo` to `/foo/` when
   the page is `foo/index.html` instead. That redirect is why `foo/index.html`
   is modelled here with a trailing slash: relative links on such a page
   resolve against `/foo/`, not against `/`.
   ============================================================================= */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');

let fail = 0;
const ok = m => console.log('  ok   ' + m), bad = m => { fail++; console.log('  FAIL ' + m); };

/* NOT SERVED OUT OF THIS REPO. The blog lives in HubSpot and everything
   under /resources/blog is HubSpot's to serve — the footer comment on every
   page says so, and there has never been a file behind any of it.

   THIS EXEMPTION IS LOAD-BEARING AND IT IS ALSO A LIABILITY. It was harmless
   while HubSpot served revhops.com. Now that the apex points at GitHub Pages,
   every one of these paths 404s unless HubSpot is still answering for them
   somehow. The exemption stops this suite crying about links it cannot check;
   it does not mean the links work. Flagged to James on 17 September. If the
   blog moves to blog.revhops.com the hrefs become absolute and this whole
   block can go. */
const OFFSITE_PREFIX = '/resources/blog';

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function servedAt(rel) {
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  return '/' + rel.slice(0, -'.html'.length);
}

/* The same three candidates GitHub Pages tries, in its order. */
function exists(sitePath) {
  const rel = decodeURIComponent(sitePath).replace(/^\/+/, '');
  if (rel === '') return fs.existsSync(path.join(ROOT, 'index.html'));
  const is = p => { try { return fs.statSync(p).isFile(); } catch (e) { return false; } };
  return is(path.join(ROOT, rel)) ||
         is(path.join(ROOT, rel + '.html')) ||
         is(path.join(ROOT, rel, 'index.html'));
}

const pages = walk(ROOT, []).map(f => path.relative(ROOT, f)).sort();
pages.length ? ok(pages.length + ' pages found') : bad('no pages found');

const ATTR = /(?:href|src|data-src|data-panel-script)\s*=\s*"([^"]*)"/g;
let refs = 0, broken = [], slashed = [];

for (const rel of pages) {
  const url = servedAt(rel);
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  let m;
  while ((m = ATTR.exec(html))) {
    const raw = m[1].trim();
    if (!raw || /^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(raw)) continue;
    refs++;
    /* A root-absolute link means relativise() missed one, and it breaks the
       moment the site is served from a subfolder. */
    if (raw[0] === '/') { broken.push(rel + ' -> ' + raw + ' (root-absolute)'); continue; }
    let target;
    try { target = new URL(raw, 'https://x' + url).pathname; }
    catch (e) { broken.push(rel + ' -> ' + raw + ' (unparseable)'); continue; }
    if (target === OFFSITE_PREFIX || target.startsWith(OFFSITE_PREFIX + '/')) continue;
    if (!exists(target)) broken.push(rel + ' -> ' + raw + '  (resolves to ' + target + ')');
  }
}

ok(refs + ' local references resolved from the URL each page is served at');
broken.length === 0 ? ok('every one of them lands on a file')
  : bad(broken.length + ' broken:\n         ' + broken.slice(0, 40).join('\n         '));

/* THE TRAILING SLASH. A page written as <name>/index.html cannot be reached
   without one: GitHub Pages 301s /name to /name/. James asked for clean URLs
   on 17 September, so the only index.html on this site is the homepage's. */
for (const rel of pages) {
  if (rel !== 'index.html' && rel.endsWith('index.html')) slashed.push(rel);
}
slashed.length === 0
  ? ok('no folder index pages, so no page redirects to a trailing slash')
  : bad('these are only reachable at a trailing slash: ' + slashed.join(', '));

/* One stamp across the whole site, the homepage's included. */
const stamp = (fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/site\.css\?v=([0-9a-f]+)/) || [])[1];
const stale = pages.filter(rel => {
  const h = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  return /site\.css\?v=([0-9a-f]+)/.test(h) && !h.includes('site.css?v=' + stamp);
});
stale.length === 0 ? ok('one cache stamp (' + stamp + ') across all ' + pages.length + ' pages')
  : bad('stale stamp on: ' + stale.join(', '));

console.log(fail ? '\n' + fail + ' FAILURE(S)\n' : '\nall link checks passed\n');
process.exit(fail ? 1 : 0);
