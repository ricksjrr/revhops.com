/* =============================================================================
   RevHops — the six hub pages smoke test

   Run:  cd ~/Downloads/Claude/revhops.com && node tools/hubs-smoke.js
   Needs jsdom, which tools/smoke.js already installs.

   Sibling of tools/smoke.js (homepage) and tools/resources-smoke.js. The six
   pages under /hubspot/ are one template run six times from HUB_PAGES in
   tools/build-pages.js, so what is worth testing is that the data still
   produces the page, and that the six do not drift apart: same three
   sections in the same order, at most one highlight each, every internal link
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
  /* It lived in the heading over the cards, which came out on 16 September,
     so the pages carry none. At most one if it ever comes back. */
  const hl = d.querySelectorAll('.hl').length;
  hl <= 1 ? ok(slug + ': no more than one warm highlight') : bad(slug + ': ' + hl + ' highlights');

  /* six feature cards, none of them linked: an arrow that goes nowhere is
     worse than no arrow, which is the /pipedrive rule. */
  const cards = [...d.querySelectorAll('.pcards')][0];
  cards && cards.children.length === 6 ? ok(slug + ': six feature cards')
    : bad(slug + ': ' + (cards ? cards.children.length : 0) + ' feature cards');
  cards && [...cards.children].every(c => c.tagName === 'DIV')
    ? ok(slug + ': and not one of them pretends to be a link') : bad(slug + ': a feature card is an anchor');
  /* THE CHIPS CAME OFF on 16 September. James called them repetitive and
     meaningless, so a chip coming back is a regression, not a nicety. */
  cards && cards.querySelectorAll('.chip, .pcard-chips').length === 0
    ? ok(slug + ': no chips inside the feature cards') : bad(slug + ': chips are back in the feature cards');

  /* THE TIER LIST AND WHERE-IT-GOES-WRONG CAME OUT on 16 September, and so
     did the heading and subheading over the cards. No dollar figure
     anywhere, still: HubSpot moves its prices. */
  d.querySelectorAll('.ticks').length === 0 ? ok(slug + ': no tier or what-goes-wrong list')
    : bad(slug + ': a ticks list is back');
  !/Which tier|usually find it broken|is really for|actually does/.test(d.querySelector('main').textContent)
    ? ok(slug + ': none of the cut section headings are back') : bad(slug + ': a cut section heading is back');
  /\$\s?\d/.test(d.querySelector('main').textContent)
    ? bad(slug + ': a dollar figure crept onto the page') : ok(slug + ': no prices on the page');

  /* the header: the call is the button, the audit is an arrow link to /audit */
  const heroText = d.querySelector('.page-hero-text') || d.querySelector('.page-hero');
  const audit = heroText && [...heroText.querySelectorAll('a')].find(a => /audit/i.test(a.textContent));
  audit && audit.classList.contains('text-link') && !audit.classList.contains('btn') && /audit$/.test(audit.getAttribute('href'))
    ? ok(slug + ': the audit ask is an arrow link to /audit')
    : bad(slug + ': the audit ask is ' + (audit ? audit.className + ' -> ' + audit.getAttribute('href') : 'missing'));

  /* THE CASE STUDY, added 16 September. One, under the cards, a bare card
     with no name or services on it, then the name, the lede and a link. The
     slug is James' pick per hub. */
  const PICK = { 'sales-hub': 'Ignite-Group', 'marketing-hub': 'Woodside-Homes', 'revenue-hub': 'Inbox-Storage',
                 'service-hub': 'Ignite-Group', 'data-hub': 'Core-Income-Advisors', 'content-hub': 'Core-Income-Advisors' };
  const hc = d.querySelectorAll('.hub-case');
  hc.length === 1 ? ok(slug + ': one featured case study') : bad(slug + ': ' + hc.length + ' featured case studies');
  const hcCard = hc[0] && hc[0].querySelector('.case-card');
  hcCard && hcCard.querySelector('img') && !hcCard.querySelector('.case-body, .case-title, .case-svc')
    ? ok(slug + ': the case card is the picture and nothing else') : bad(slug + ': the case card carries text');
  const tag = hc[0] && hc[0].querySelector('.hub-case-copy .hub-case-tag');
  (tag && tag.textContent.trim() === 'See our work in action')
    ? ok(slug + ': the work-in-action label is over the name')
    : bad(slug + ': the work-in-action label is missing');
  const hcLink = hc[0] && hc[0].querySelector('.hub-case-copy a.text-link');
  hcLink && new RegExp('case-studies/' + PICK[slug] + '$').test(hcLink.getAttribute('href')) && /Read the story/.test(hcLink.textContent)
    ? ok(slug + ': "Read the story" goes to ' + PICK[slug]) : bad(slug + ': the story link is wrong');
  hc[0] && hc[0].querySelector('.hub-case-copy h2') && hc[0].querySelector('.hub-case-copy p.lede') &&
    hc[0].querySelector('.hub-case-copy p.lede').textContent.trim().length > 80
    ? ok(slug + ': the case name and its lede are beside the card') : bad(slug + ': the case name or lede is missing');

  /* the ask */
  const rows = [...d.querySelectorAll('.svc-row')];
  rows.length === 4 ? ok(slug + ': four ways we can help') : bad(slug + ': ' + rows.length + ' service rows');

  /* THE OTHER-FIVE GRID CAME OUT on 13 September, and the check with it.
     What is worth guarding is the thing that replaced it: the page still has
     exactly one card grid — what the hub does — and the only route back to
     the other five is the link at the top, which must not point at this page.
     Both of those are cheap to break and expensive to notice. */
  const grids = [...d.querySelectorAll('.pcards')];
  grids.length === 1 ? ok(slug + ': one card grid, and it is what the hub does')
    : bad(slug + ': ' + grids.length + ' card grids, expected 1');
  const upLink = d.querySelector('.hero-back');
  upLink && /All hubs/.test(upLink.textContent) && /hubspot\/?$/.test(upLink.getAttribute('href').replace(/[#?].*$/, ''))
    ? ok(slug + ': "All hubs" goes back to the grid of all six')
    : bad(slug + ': the back link is ' + (upLink ? upLink.textContent.trim() + ' -> ' + upLink.getAttribute('href') : 'missing'));

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
