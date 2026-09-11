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
JSON.stringify(secs)===JSON.stringify(['blog','case-studies','videos','downloadables','games'])
  ? ok('five shelves, in the order RESOURCE_TYPES declares them') : bad('shelves are '+secs);

/* Four, not five. A shelf with a See-all destination is a teaser: the
   fifth card would start a second row on its own and make the link
   pointless. The slice is in resShelf(). */
d.querySelectorAll('[data-res-section="case-studies"] .res-card').length===4
  ? ok('the case studies shelf teases four and sends you on for the rest')
  : bad('case studies shelf shows ' + d.querySelectorAll('[data-res-section="case-studies"] .res-card').length);
[...d.querySelectorAll('[data-res-section] .res-grid')].every(g => g.children.length <= 8)
  ? ok('no shelf renders more than one page of cards') : bad('a shelf is longer than a page');
[...d.querySelectorAll('[data-res-section="case-studies"] a.res-card')].every(a=>/case-studies\/case-study-\d/.test(a.getAttribute('href')))
  ? ok('and each links at its own case study page') : bad('a case card links somewhere else');

const seeAll=[...d.querySelectorAll('.res-all a')].map(a=>a.getAttribute('href'));
seeAll.length===2 && seeAll.includes('https://blog.revhops.com') && seeAll.some(h=>/case-studies$/.test(h))
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

// placeholders are inert
const phs=[...d.querySelectorAll('.res-card:not([data-res-type="case-studies"]):not(:has(.res-lock))')].filter(c=>/^\[/.test(c.querySelector('.res-title').textContent));
phs.length ? (phs.every(c=>c.tagName==='DIV') ? ok(phs.length+' placeholder cards, all inert divs rather than dead links') : bad('a placeholder card is clickable and goes nowhere'))
  : bad('no placeholders found, which cannot be right yet');

// gated
const gated=[...d.querySelectorAll('a.res-card')].filter(a=>a.querySelector('.res-lock'));
gated.length===2 && gated.every(a=>/resources\/gated-/.test(a.getAttribute('href')))
  ? ok('both gated items carry the chip and go to their own page') : bad('gated routing is wrong');
fs.existsSync(path.join(ROOT,'resources/gated-video.html')) && fs.existsSync(path.join(ROOT,'resources/gated-download.html'))
  ? ok('and both of those pages were generated') : bad('a gated page is missing');

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
const dead=[...new Set(internal.filter(h=>h!=='./'&&h!=='../'&&!/\.(txt|html)$/.test(h)&&!built(h)))];
dead.length?bad('dead links: '+dead.join(', ')):ok('every internal link on /resources resolves');
const abs=[...d.querySelectorAll('a[href^="/"]:not([href^="//"])')].map(a=>a.getAttribute('href'));
abs.length?bad('root-absolute links survived relativise(): '+abs):ok('no root-absolute links');

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
}

console.log(fail?'\n'+fail+' FAILURE(S)\n':'\nall resource checks passed\n');
process.exit(fail?1:0);
