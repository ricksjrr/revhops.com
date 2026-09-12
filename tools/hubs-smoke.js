/* =============================================================================
   RevHops — the six hub pages smoke test

   Run:  cd ~/Downloads/Claude/revhops.com && node tools/hubs-smoke.js
   Needs jsdom, which tools/smoke.js already installs.

   Sibling of tools/smoke.js (homepage) and tools/resources-smoke.js. The six
   pages under /hubspot/ are one template run six times from HUB_PAGES in
   tools/build-pages.js, so what is worth testing is that the data still
   produces the page, and that the six do not drift apart: same five
   sections in the same order, one highlight each, every internal link
   landing on a file that exists, and the last section carrying .to-white so
   the closing panel has something white to bleed into.

   It also checks the things this site has broken before elsewhere: a See-all
   style link turning into a button, a boxed button that books nothing, an
   em dash in the copy, and a card grid that lost its .to-white.
   ============================================================================= */
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.resolve(__dirname, '..');
let fail = 0;
const ok = m => console.log('  ok   ' + m), bad = m => { fail++; console.log('  FAIL ' + m); };

const SLUGS = ['sales-hub', 'marketing-hub', 'revenue-hub', 'service-hub', 'data-hub', 'content-hub'];
const NAMES = { 'sales-hub': 'Sales Hub', 'marketing-hub': 'Marketing Hub', 'revenue-hub': 'Revenue Hub',
                'service-hub': 'Service Hub', 'data-hub': 'Data Hub', 'content-hub': 'Content Hub' };

/* Every card on /hubspot points at one of these, and until 11 September all
   six of those links 404ed. That is the bug this file exists to keep fixed. */
const hubIndex = fs.readFileSync(path.join(ROOT, 'hubspot/index.html'), 'utf8');
const linked = [...hubIndex.matchAll(/href="\.\.\/hubspot\/([a-z-]+)"/g)].map(m => m[1]);
JSON.stringify(linked.sort()) === JSON.stringify([...SLUGS].sort())
  ? ok('/hubspot links at exactly the six hubs') : bad('/hubspot links at ' + linked);

const docs = {};
SLUGS.forEach(slug => {
  const file = path.join(ROOT, 'hubspot/' + slug + '.html');
  if (!fs.existsSync(file)) { bad(slug + ' does not exist'); return; }
  const html = fs.readFileSync(file, 'utf8');
  const dom = new JSDOM(html, { url: 'https://revhops.com/hubspot/' + slug });
  docs[slug] = { html, d: dom.window.document };
});
Object.keys(docs).length === 6 ? ok('all six pages are on disk') : bad('only ' + Object.keys(docs).length + ' pages built');

/* the shape, and that it is the SAME shape six times over */
const shapes = new Set();
SLUGS.forEach(slug => {
  const { html, d } = docs[slug];

  d.querySelector('h1.h1') && d.querySelector('h1.h1').textContent.trim() === NAMES[slug]
    ? ok(slug + ': the h1 is the hub name, not a slogan')
    : bad(slug + ': h1 reads "' + (d.querySelector('h1.h1') || {}).textContent + '"');

  const back = d.querySelector('a.hero-back');
  back && /hubspot$|hubspot\/$|\.\.\/hubspot/.test(back.getAttribute('href'))
    ? ok(slug + ': the eyebrow goes back up to /hubspot') : bad(slug + ': no back link to /hubspot');

  /* one highlight per page and no more. Six pages with four each is how the
     marker stopped meaning anything the first time. */
  const hl = d.querySelectorAll('.hl').length;
  hl === 1 ? ok(slug + ': exactly one warm highlight') : bad(slug + ': ' + hl + ' highlights');

  /* six feature cards, none of them linked: an arrow that goes nowhere is
     worse than no arrow, which is the /pipedrive rule. */
  const cards = [...d.querySelectorAll('.pcards')][0];
  cards && cards.children.length === 6 ? ok(slug + ': six feature cards')
    : bad(slug + ': ' + (cards ? cards.children.length : 0) + ' feature cards');
  cards && [...cards.children].every(c => c.tagName === 'DIV')
    ? ok(slug + ': and not one of them pretends to be a link') : bad(slug + ': a feature card is an anchor');
  cards && [...cards.children].every(c => c.querySelectorAll('.chip').length === 3)
    ? ok(slug + ': three HubSpot feature names chipped on each') : bad(slug + ': a card is missing its chips');

  /* the tiers list, and no dollar figure anywhere on the page. HubSpot moves
     its prices; a stale number here is worse than none. */
  const ticks = [...d.querySelectorAll('.ticks')];
  ticks.length === 2 ? ok(slug + ': a tier list and a what-goes-wrong list')
    : bad(slug + ': ' + ticks.length + ' ticks lists');
  /\$\s?\d/.test(d.querySelector('main').textContent)
    ? bad(slug + ': a dollar figure crept onto the page') : ok(slug + ': no prices on the page');
  ticks[0] && ticks[0].children.length >= 4 ? ok(slug + ': the tier list covers every tier plus the caveat')
    : bad(slug + ': tier list is short');
  ticks[1] && ticks[1].classList.contains('ticks-2') && ticks[1].children.length === 4
    ? ok(slug + ': four failure modes in two columns') : bad(slug + ': the what-goes-wrong list is wrong');

  /* the ask, and the other five hubs */
  const rows = [...d.querySelectorAll('.svc-row')];
  rows.length === 4 ? ok(slug + ': four ways we can help') : bad(slug + ': ' + rows.length + ' service rows');
  const grids = [...d.querySelectorAll('.pcards')];
  grids.length === 2 && grids[1].children.length === 5
    ? ok(slug + ': the other five hubs at the foot') : bad(slug + ': the other-hubs grid is wrong');
  grids[1] && [...grids[1].children].every(a => a.tagName === 'A' && !a.getAttribute('href').includes(slug))
    ? ok(slug + ': and none of them links at itself') : bad(slug + ': a hub card links back at this page');

  /* the closing panel bleeds up over the last section, which is why it has
     to be .to-white. This broke on a page once and the seam was a hard line. */
  const secs = [...d.querySelectorAll('main > section')];
  const last = secs[secs.length - 2]; // the close is the last one
  last && last.classList.contains('to-white')
    ? ok(slug + ': the section under the close drifts to white') : bad(slug + ': last section is not .to-white');
  d.querySelector('.start-section') ? ok(slug + ': the close is on the page') : bad(slug + ': no closing panel');

  /* boxed buttons mean booking or requesting on this site, and nothing else */
  [...d.querySelectorAll('main .btn')].every(b => /\/call|\/contact/.test(b.getAttribute('href')))
    ? ok(slug + ': every boxed button books or requests something')
    : bad(slug + ': a .btn points somewhere that is neither /call nor /contact');

  /* no em dashes in the body copy. The <title> keeps the site's existing
     " — RevHops" convention, so this is scoped to main. */
  /—/.test(d.querySelector('main').textContent)
    ? bad(slug + ': an em dash in the copy') : ok(slug + ': no em dashes');

  /* no horizontal rules between sections, ever */
  d.querySelectorAll('main hr').length === 0 ? ok(slug + ': no rules between sections') : bad(slug + ': an hr appeared');

  /* the nav knows which page it is on */
  const cur = d.querySelector('.nav-links [aria-current="page"]');
  cur && /HubSpot/.test(cur.textContent) ? ok(slug + ': the HubSpot nav item is current')
    : bad(slug + ': nav-current is ' + (cur ? cur.textContent : 'nothing'));

  /* every internal link lands on a file that exists. This is the check that
     would have caught all six of these pages being missing. */
  const badHrefs = [...d.querySelectorAll('main a[href]')].map(a => a.getAttribute('href'))
    .filter(h => h && !/^(https?:|mailto:|tel:|#)/.test(h))
    .filter(h => {
      const clean = h.replace(/[?#].*$/, '');
      const abs = path.resolve(ROOT, 'hubspot', clean);
      return !(fs.existsSync(abs) || fs.existsSync(abs + '.html') || fs.existsSync(path.join(abs, 'index.html')));
    });
  badHrefs.length === 0 ? ok(slug + ': every internal link lands on a real file')
    : bad(slug + ': dead links ' + badHrefs.join(', '));

  /* the shared cache stamp, which has to match across every page or a page
     paints new markup with an old stylesheet */
  const stamp = (html.match(/site\.css\?v=([0-9a-f]+)/) || [])[1];
  shapes.add([secs.length, stamp].join('|'));

  /* the title is one line, two at the outside. Estimated the way smoke.js
     does it, from character count against the column. */
  const h1 = d.querySelector('h1.h1').textContent.trim();
  h1.length <= 26 ? ok(slug + ': the h1 cannot wrap past two lines') : bad(slug + ': h1 is ' + h1.length + ' characters');
});

shapes.size === 1 ? ok('all six pages are the same shape and share one cache stamp')
  : bad('the six pages have drifted apart: ' + [...shapes].join(' / '));

/* the stamp matches the rest of the site */
const homeStamp = (fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/site\.css\?v=([0-9a-f]+)/) || [])[1];
[...shapes][0].split('|')[1] === homeStamp ? ok('and it is the same stamp the homepage carries')
  : bad('hub pages are stamped ' + [...shapes][0].split('|')[1] + ', the homepage is ' + homeStamp);

console.log(fail ? '\n' + fail + ' FAILURE(S)\n' : '\nall hub checks passed\n');
process.exit(fail ? 1 : 0);
