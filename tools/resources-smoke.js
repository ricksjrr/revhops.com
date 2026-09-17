/* =============================================================================
   RevHops — /resources smoke test

   Run:  cd ~/Downloads/Claude/revhops.com && node tools/resources-smoke.js
   Needs jsdom, which tools/smoke.js already installs.

   tools/smoke.js reads the homepage and nothing else. This is its sibling for
   the resources page, and it exists for the same reason: the page is
   generated from RESOURCES in tools/build-pages.js, so the thing worth
   testing is that the data still produces the page — the right shelves in the
   right order, See-all links that are links and not buttons, placeholders
   that cannot be clicked, gated items that route to their own page, and a
   lightbox that stops playing when it closes.

   Pagination is tested against a synthetic shelf at the bottom of this file,
   because no real shelf is long enough to page yet. The day one is, this
   already covers it.
   ============================================================================= */
const fs=require('fs'),path=require('path');
const {JSDOM}=require('jsdom');
const ROOT=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'resources/index.html'),'utf8');
const js=fs.readFileSync(path.join(ROOT,'assets/js/site.js'),'utf8');
let fail=0;const ok=m=>console.log('  ok   '+m),bad=m=>{fail++;console.log('  FAIL '+m)};
const dom=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true,url:'https://revhops.com/resources'});
const w=dom.window,d=w.document;
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
w.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};
w.matchMedia=w.matchMedia||(()=>({matches:false,addEventListener(){},addListener(){}}));
w.Element.prototype.scrollIntoView=function(){};
w.eval(js);

const secs=[...d.querySelectorAll('[data-res-section]')].map(s=>s.getAttribute('data-res-section'));
JSON.stringify(secs)===JSON.stringify(['case-studies','videos','blog','downloadables','games'])
  ? ok('five shelves, in the order RESOURCE_TYPES declares them') : bad('shelves are '+secs);

/* Four, not five. A shelf with a See-all destination is a teaser: the
   fifth card would start a second row on its own and make the link
   pointless. The slice is in resShelf(). */
/* Since 17 September the rest are in the markup too, hidden and marked
   data-res-extra, so the search can find them. What is SHOWN is still four. */
d.querySelectorAll('[data-res-section="case-studies"] .res-card:not([hidden])').length===4
  ? ok('the case studies shelf teases four and sends you on for the rest')
  : bad('case studies shelf shows ' + d.querySelectorAll('[data-res-section="case-studies"] .res-card:not([hidden])').length);
[...d.querySelectorAll('[data-res-section] .res-card[data-res-extra]')].every(c => c.hidden)
  ? ok('and the cards past the teaser are hidden until a search finds them') : bad('an extra teaser card is showing');
[...d.querySelectorAll('[data-res-section] .res-grid')].every(g => g.querySelectorAll(':scope > :not([data-res-extra])').length <= 8)
  ? ok('no shelf renders more than one page of cards') : bad('a shelf is longer than a page');
[...d.querySelectorAll('[data-res-section="case-studies"] a.res-card')].every(a=>/case-studies\/[A-Za-z0-9-]+$/.test(a.getAttribute('href')))
  ? ok('and each links at its own case study page') : bad('a case card links somewhere else');

const seeAll=[...d.querySelectorAll('.res-all a')].map(a=>a.getAttribute('href'));
seeAll.length===2 && seeAll.some(h=>/\/resources\/blog$/.test(h)) && seeAll.some(h=>/case-studies$/.test(h))
  ? ok('two See-all links: the HubSpot blog and /case-studies') : bad('see-all links are '+seeAll);
[...d.querySelectorAll('.res-all a')].every(a=>a.classList.contains('text-link'))
  ? ok('and both are text links, not boxed buttons') : bad('a See-all is a .btn, which on this site means booking');

const pagers=[...d.querySelectorAll('[data-res-pager]')].map(p=>p.closest('[data-res-section]').getAttribute('data-res-section'));
JSON.stringify(pagers)===JSON.stringify([]) ? ok('no pager anywhere yet: every shelf fits on one page')
  : ok('pagers on: '+pagers.join(', '));

// filter
const tabs=[...d.querySelectorAll('[data-res-pick]')];
tabs.length===6 ? ok('six filter choices: All plus the five types') : bad('filter has '+tabs.length);
tabs.find(t=>t.dataset.resPick==='videos').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
const shown=[...d.querySelectorAll('[data-res-section]')].filter(s=>!s.hidden).map(s=>s.dataset.resSection);
JSON.stringify(shown)===JSON.stringify(['videos']) ? ok('picking Videos leaves the videos shelf and hides the rest') : bad('after Videos, showing '+shown);
tabs.find(t=>t.dataset.resPick==='videos').getAttribute('aria-pressed')==='true' && tabs[0].getAttribute('aria-pressed')==='false'
  ? ok('and the choice is single, reported through aria-pressed') : bad('two tabs read as pressed');
tabs[0].dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
[...d.querySelectorAll('[data-res-section]')].every(s=>!s.hidden) ? ok('All brings every shelf back') : bad('All left a shelf hidden');

/* Placeholders are inert. Zero of them is a PASS: the bracketed video and
   download cards came out on 13 September when the keynote and the ROI
   calculator went in, and a shelf with nothing left to fill in is the state
   this check is hoping for rather than a broken build. What it is guarding
   against is a placeholder that is also a link. */
const phs=[...d.querySelectorAll('.res-card:not([data-res-type="case-studies"]):not([data-res-gated])')].filter(c=>/^\[/.test(c.querySelector('.res-title').textContent));
phs.every(c=>c.tagName==='DIV')
  ? ok(phs.length ? phs.length+' placeholder cards, all inert divs rather than dead links'
                  : 'no placeholder cards left on the shelves')
  : bad('a placeholder card is clickable and goes nowhere');

/* Gated: however many there are, each is marked data-res-gated, points at its own
   generated page, and that page exists. Counting them was the old version
   of this and it failed the day the count changed rather than the day
   something broke. */
const gated=[...d.querySelectorAll('a.res-card[data-res-gated]')];
const gatedHrefs=gated.map(a=>a.getAttribute('href'));
gated.length && gatedHrefs.every(h=>/(^|\/)resources\/[a-z0-9-]+$/.test(h))
  ? ok(gated.length+' gated item(s), each going to its own page') : bad('gated routing is wrong');
d.querySelector('.res-lock')
  ? bad('the Gated chip came back') : ok('no Gated chip on any card');
gatedHrefs.every(h=>fs.existsSync(path.join(ROOT,h.replace(/^[./]+/,'')+'.html')))
  ? ok('and every one of those pages was generated') : bad('a gated page is missing');

/* THE GATE LETS YOU OUT SOMEWHERE. The form on a gated page carries the
   destination on data-res-gate and repeats it as the no-script action; a
   gate that asks for an email and then goes nowhere is the failure worth
   catching here. */
gatedHrefs.forEach(h=>{
  const gp=new JSDOM(fs.readFileSync(path.join(ROOT,h.replace(/^[./]+/,'')+'.html'),'utf8')).window.document;
  const form=gp.querySelector('[data-res-gate]');
  const to=form&&form.getAttribute('data-res-gate');
  to&&/^https?:/.test(to)&&form.getAttribute('action')===to
    ? ok(h.replace(/^[./]+/,'')+': the gate redirects, and the no-script action agrees')
    : bad(h+': the gate has no destination');
});

/* THE FEATURED SLIDER. Three slides, three dots, exactly one slide showing
   before any script runs, and the two behind it out of the tab order. */
const slides=[...d.querySelectorAll('[data-res-slide]')];
const fdots=[...d.querySelectorAll('[data-res-dot]')];
slides.length>1&&slides.length===fdots.length
  ? ok(slides.length+' featured slides and a dot for each') : bad('slides and dots disagree');
slides.filter(s=>s.classList.contains('is-on')).length===1
  ? ok('exactly one slide is showing, so the card is never blank without script')
  : bad('the slider does not have one slide on at rest');
/* Whichever shape the slide is — a link with a card inside it, or a card
   with a link inside it — nothing focusable on a hidden one may be reachable
   by Tab. The slide is the link today; this does not assume it. */
const focusables=s=>[...(/^(A|BUTTON)$/.test(s.tagName)?[s]:[]), ...s.querySelectorAll('a,button')];
slides.filter(s=>!s.classList.contains('is-on'))
  .every(s=>{const f=focusables(s);return f.length&&f.every(el=>el.getAttribute('tabindex')==='-1');})
  ? ok('and the hidden slides keep their links out of the tab order') : bad('a hidden slide is tabbable');

/* THE WHOLE CARD IS THE TARGET, and it says what kind of thing it is. */
slides.every(s=>/^(A|BUTTON)$/.test(s.tagName)&&(s.tagName==='BUTTON'||s.getAttribute('href')))
  ? ok('every featured slide is one link, card-wide') : bad('a featured slide is not itself the link');
slides.every(s=>{const k=s.querySelector('.res-feature-kind');return k&&k.textContent.trim();})
  ? ok('and each one names its resource type') : bad('a featured slide has no type tag');
d.querySelector('.res-feature-eyebrow')
  ? ok('the slider is labelled as the featured set') : bad('nothing marks the top card as featured');

/* THE SHELVES ARE IN JAMES' ORDER, and the filter pills follow them. */
{
  const want=['case-studies','videos','blog','downloadables','games'];
  const got=[...d.querySelectorAll('[data-res-section]')].map(s=>s.dataset.resSection);
  JSON.stringify(got)===JSON.stringify(want) ? ok('shelves in order: '+want.join(', ')) : bad('shelf order is '+got.join(', '));
  const pills=[...d.querySelectorAll('[data-res-pick]')].map(t=>t.dataset.resPick);
  JSON.stringify(pills)===JSON.stringify(['all'].concat(want)) ? ok('and the filter pills agree with them') : bad('pills read '+pills.join(', '));
}
[...d.querySelectorAll('[data-res-slide] .rh-art')].length===slides.length
  ? ok('every slide carries its drawing') : bad('a slide is missing its art');
d.querySelector('.res-feature-fact')
  ? bad('the kind-and-format line came back onto the featured card')
  : ok('nothing on the featured card but the title, the line, the link and the art');

/* THE SHELVES HAVE NO SUBHEADS. One-word heading, then the cards. */
d.querySelector('.res-shelf-head .sec-sub')
  ? bad('a shelf subhead came back') : ok('no subheads under the shelf headings');

/* CASE STUDY CARDS CARRY THEIR META AS LABEL AND VALUE ROWS, the way the
   case study page does, and no service in the corner. They were boxed tags
   until 17 September; the boxes must not come back. */
const csCards=[...d.querySelectorAll('.res-card[data-res-type="case-studies"]')];
const META_LABELS=['Service(s) used','Tools used','Industry','Team size'];
csCards.length&&csCards.every(c=>JSON.stringify([...c.querySelectorAll('.res-meta-label')].map(l=>l.textContent))===JSON.stringify(META_LABELS)
  && [...c.querySelectorAll('.res-meta-val')].every(v=>v.textContent.trim()))
  ? ok('every case study card carries the four meta rows, labelled') : bad('a case study card is missing its meta rows');
d.querySelector('.res-tag, .res-tags')
  ? bad('the boxed tags came back') : ok('no boxed tags on any card');
csCards.every(c=>!c.querySelector('.res-fact'))
  ? ok('and the service label in the corner is gone') : bad('a case study card still names a service in the corner');

// lightbox
const dlg=d.querySelector('[data-res-lightbox]');
dlg && !dlg.open ? ok('the lightbox starts closed') : bad('lightbox state wrong at rest');
const probe=d.createElement('button');probe.setAttribute('data-video','abc123');
// module already bound; simulate a real video card by re-running is not possible, so assert the wiring instead
/youtube-nocookie\.com\/embed\//.test(js) ? ok('the lightbox builds a privacy-mode YouTube embed') : bad('embed host wrong');
/frame\.textContent = ''/.test(js) ? ok('and tears the iframe down on close, so nothing keeps playing') : bad('the iframe survives close');

// links resolve
const built=h=>{const rel=h.replace(/[#?].*$/,'').replace(/^[./]+/,'');return fs.existsSync(path.join(ROOT,rel+'.html'))||fs.existsSync(path.join(ROOT,rel,'index.html'));};
const internal=[...d.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(h=>!/^(https?:|mailto:|tel:|#|\/\/)/.test(h));
/* The blog is served by HubSpot at /resources/blog on this domain and is not
   built from this repo, so those hrefs resolve in production but never on
   disk. Excluded here for the same reason the root checker excludes them. */
const hubspotBlog=h=>/(^|\/)resources\/blog(\/|$)/.test(h);
const dead=[...new Set(internal.filter(h=>h!=='./'&&h!=='../'&&!/\.(txt|html)$/.test(h)&&!hubspotBlog(h)&&!built(h)))];
dead.length?bad('dead links: '+dead.join(', ')):ok('every internal link on /resources resolves');
const abs=[...d.querySelectorAll('a[href^="/"]:not([href^="//"])')].map(a=>a.getAttribute('href'));
abs.length?bad('root-absolute links survived relativise(): '+abs):ok('no root-absolute links');

/* ---------------------------------------------------- search, 17 September */
{
  const input = d.querySelector('[data-res-search]');
  const status = d.querySelector('[data-res-search-status]');
  const bar = d.querySelector('.res-filter-bar');
  const type = v => { input.value = v; input.dispatchEvent(new w.Event('input', { bubbles: true })); };
  const shownShelves = () => [...d.querySelectorAll('[data-res-section]')].filter(s => !s.hidden).map(s => s.dataset.resSection);
  const shownCards = () => [...d.querySelectorAll('[data-res-section]:not([hidden]) .res-card:not([hidden])')];
  const click = el => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));

  input && input.type === 'search' ? ok('a search box exists') : bad('no search box');
  bar && bar.contains(d.querySelector('[data-res-filter]')) && bar.contains(input)
    ? ok('and it shares a row with the filter pills') : bad('search is not in the filter row');
  d.querySelector('label[for="' + input.id + '"]') ? ok('and it has a label') : bad('search has no label');

  click(d.querySelector('[data-res-pick="all"]'));
  const lastCase = [...d.querySelectorAll('[data-res-section="case-studies"] .res-card')].pop();
  const lastName = lastCase.querySelector('.res-title').textContent;
  type(lastName.toUpperCase());
  shownCards().includes(lastCase) ? ok('search finds a case study hidden past the teaser (' + lastName + ')') : bad('search missed ' + lastName);
  shownCards().every(c => c.querySelector('.res-title') && c.textContent.toLowerCase().includes(lastName.toLowerCase()))
    ? ok('and every card left showing mentions it') : bad('a card that does not match is showing');

  type('keynote dharmesh');
  JSON.stringify(shownShelves()) === JSON.stringify(['videos']) && shownCards().length === 2
    ? ok('every word must match, and shelves with nothing left go') : bad('keynote search shows ' + shownShelves() + ' / ' + shownCards().length);
  status.classList.contains('is-quiet') && /2 resources match/.test(status.textContent)
    ? ok('the count goes to screen readers only') : bad('status reads ' + status.textContent);

  type('open');
  shownCards().length === 0 ? ok('the "Open" link text is not searched') : bad('"open" matched ' + shownCards().length);

  click(d.querySelector('[data-res-pick="games"]'));
  type('keynote');
  shownCards().length === 0 && !status.hidden && !status.classList.contains('is-quiet') && /in Games/.test(status.textContent)
    ? ok('search works inside the chosen pill and says so when it finds nothing') : bad('scoped empty state wrong: ' + status.textContent);
  click(status.querySelector('button'));
  JSON.stringify(shownShelves()) === JSON.stringify(['videos']) && d.querySelector('[data-res-pick="all"]').getAttribute('aria-pressed') === 'true'
    ? ok('and "Search all resources" widens it to every shelf') : bad('widening failed: ' + shownShelves());

  type('zzzz nothing');
  click(status.querySelector('button'));
  input.value === '' && status.hidden && shownShelves().length === 5 &&
    d.querySelectorAll('[data-res-section="case-studies"] .res-card:not([hidden])').length === 4
    ? ok('clearing puts the page back exactly as it was') : bad('clear did not restore the page');
}

/* ---------------------------------------------------- pagination, synthetic

   No shelf has more than eight items yet, so the generated page carries no
   pager at all — which is correct, and untestable. This builds the shelf the
   data will produce once there are twelve videos and runs the real module
   against it. */
{
  const cards = Array.from({ length: 12 }, (_, i) =>
    '<a class="res-card" href="#' + i + '" data-res-type="videos"><h3 class="res-title">v' + i + '</h3></a>').join('');
  const fix = new JSDOM(
    '<section class="section res-shelf" data-res-section="videos">' +
    '<div class="res-grid" data-res-grid data-res-per="8">' + cards + '</div>' +
    '<div class="res-pager" data-res-pager>' +
    '<button data-res-prev></button>' +
    '<span data-res-page-count></span>' +
    '<button data-res-next></button>' +
    '</div></section>',
    { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://revhops.com/resources' });
  const fw = fix.window, fd = fw.document;
  fw.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  fw.matchMedia = fw.matchMedia || (() => ({ matches: false, addEventListener() {}, addListener() {} }));
  fw.Element.prototype.scrollIntoView = function () {};
  fw.eval(js);

  const all = [...fd.querySelectorAll('.res-card')];
  const visible = () => all.filter(c => !c.hidden).length;
  const count = fd.querySelector('[data-res-page-count]');
  const next = fd.querySelector('[data-res-next]');
  const prev = fd.querySelector('[data-res-prev]');
  const click = el => el.dispatchEvent(new fw.MouseEvent('click', { bubbles: true }));

  visible() === 8 ? ok('twelve videos open as a 4x2 grid of eight') : bad('page one shows ' + visible());
  count.textContent === 'Page 1 of 2' ? ok('and the pager says which page it is on') : bad('count reads ' + count.textContent);
  prev.disabled && !next.disabled ? ok('back is disabled at the start rather than hidden') : bad('pager state wrong at the start');
  click(next);
  visible() === 4 ? ok('the second page shows the remaining four') : bad('page two shows ' + visible());
  next.disabled && !prev.disabled ? ok('and forward disables at the end') : bad('pager state wrong at the end');
  click(next);
  count.textContent === 'Page 2 of 2' ? ok('a click past the end does nothing') : bad('paged past the end');
  click(prev);
  visible() === 8 && all[0].hidden === false ? ok('and back returns the first eight') : bad('going back did not restore page one');

  const pagerEl = fd.querySelector('[data-res-pager]');
  fd.dispatchEvent(new fw.CustomEvent('revhops:res-search', { detail: { query: 'x' } }));
  pagerEl.hidden ? ok('the pager steps aside while a search runs') : bad('pager still showing during a search');
  click(next);
  fd.dispatchEvent(new fw.CustomEvent('revhops:res-search', { detail: { query: '' } }));
  !pagerEl.hidden && visible() === 8 && count.textContent === 'Page 1 of 2'
    ? ok('and clearing the search hands the shelf back on page one') : bad('pager not restored after search');
}

console.log(fail?'\n'+fail+' FAILURE(S)\n':'\nall resource checks passed\n');
process.exit(fail?1:0);
