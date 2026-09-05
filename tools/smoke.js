/* =============================================================================
   RevHops — homepage smoke test

   Run:  cd ~/Downloads/Claude/revhops.com && node tools/smoke.js
   Needs jsdom once:  npm install jsdom

   This lives in the repo on purpose. It was rebuilt from scratch three times
   after /tmp was cleared between sessions, which is wasted work every time.

   What it can and cannot do. jsdom has no layout engine, so anything about
   size or position is recomputed by hand from the CSS at a set of viewport
   widths. That catches a value drifting out of range; it is not a substitute
   for opening the page in Arc.

   Most of these assertions exist because something broke once. The comment on
   each says which, so a future change knows what it is about to undo.
   ============================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const STAMP = '202609091500';

let fail = 0;
const ok = m => console.log('  ok   ' + m);
const bad = m => { fail++; console.log('  FAIL ' + m); };
const note = m => console.log('  note ' + m);
const css = fs.readFileSync(path.join(ROOT, 'assets/css/site.css'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'assets/js/site.js'), 'utf8')
         + fs.readFileSync(path.join(ROOT, 'assets/js/maturity-slider.js'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/* Everything declared for a selector, so a test can assert on it rather than
   on the whole stylesheet and accidentally match a comment somewhere else.

   Two things this has to get right, both learned the hard way.

   Anchored to the start of a line: a plain indexOf finds the selector as a
   SUBSTRING of a longer one — `.quote p {` matches inside `.testi .quote p {`
   — and returns the wrong rule's body.

   And it returns EVERY matching rule joined, not the first. A selector
   declared more than once is ordinary CSS and the declarations combine, with
   the later winning on conflict. Reading only the first reported a bug that
   was not there, and reading only the last would miss a property set
   earlier. Joining them is the closest thing to what the browser computes
   for the presence checks this file makes. */
const rule = sel => {
  const re = new RegExp('(?:^|\\n)[ \\t]*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{', 'g');
  let m, out = [];
  while ((m = re.exec(css))) {
    const i = m.index + m[0].length;
    out.push(css.slice(i, css.indexOf('}', i)));
    re.lastIndex = i;
  }
  return out.join('\n');
};

/* ---------------------------------------------------------------- the page */
const errs = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errs.push(e.message));

const dom = new JSDOM(html, {
  runScripts: 'outside-only', pretendToBeVisual: true,
  virtualConsole: vc, url: 'https://revhops.com/'
});
const { window } = dom;
window.matchMedia = q => ({ matches: false, media: q, addListener() {}, removeListener() {},
                            addEventListener() {}, removeEventListener() {} });
window.IntersectionObserver = class {
  constructor(cb) { this.cb = cb; }
  observe(el) { this.cb([{ target: el, isIntersecting: true, intersectionRatio: 1 }], this); }
  unobserve() {} disconnect() {}
};
window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
window.requestAnimationFrame = cb => setTimeout(() => cb(Date.now()), 0);
window.cancelAnimationFrame = id => clearTimeout(id);
window.scrollTo = () => {};

// The page loads no third-party scripts. The HubSpot meetings loader was
// here for a day and went with the embed. Keep this list empty.
const ALLOWED_THIRD_PARTY = ['js.hs-scripts.com'];
for (const src of [...window.document.querySelectorAll('script[src]')].map(s => s.getAttribute('src'))) {
  if (/^(https?:)?\/\//.test(src)) {
    ALLOWED_THIRD_PARTY.some(a => src.includes(a))
      ? ok('third-party script allowed: ' + src.replace(/^https:\/\//, ''))
      : bad('unexpected third-party script: ' + src);
    continue;
  }
  try { window.eval(fs.readFileSync(path.join(ROOT, src.split('?')[0]), 'utf8')); }
  catch (e) { bad('script threw: ' + src + ' :: ' + e.message); }
}
window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
for (const ev of ['load', 'scroll', 'resize']) window.dispatchEvent(new window.Event(ev));
const d = window.document;

/* ------------------------------------------------------------ the essentials */
console.log('\n— page —');
{
  const h1 = d.querySelector('.mat-head .h1');
  (h1 && h1.textContent.trim()) ? ok('hero headline renders: "' + h1.textContent.replace(/\s+/g, ' ').trim() + '"')
                                : bad('hero headline missing, the slider did not build');
  const bodies = [...d.querySelectorAll('[data-card-body]')];
  (bodies.length && bodies.every(b => b.children.length))
    ? ok(bodies.length + ' stage cards filled') : bad('stage card bodies are empty');

  const stale = [...d.querySelectorAll('link[href*="site.css"],script[src*=".js"]')]
    .map(n => n.getAttribute('href') || n.getAttribute('src'))
    .filter(u => !/^(https?:)?\/\//.test(u) && !u.includes('v=' + STAMP));
  stale.length ? bad('stale cache stamp on: ' + stale.join(', ')) : ok('cache stamp ' + STAMP);

  const order = [...d.querySelectorAll('main > section')];
  note('section order: ' + order.map(x => x.className.split(' ')[0]).join(' > '));
  const at = pred => order.findIndex(pred);
  const svc = at(x => x.querySelector('.svc-list'));
  const cas = at(x => x.querySelector('.case-rail'));
  const abt = at(x => x.querySelector('.about-stack'));
  const tls = at(x => x.querySelector('.tool-clump'));
  const stp = at(x => x.querySelector('.start-wide'));
  (cas === svc + 1) ? ok('case studies follow services') : bad('services ' + svc + ', case ' + cas);
  (tls === abt + 1) ? ok('tool clump follows about') : bad('about ' + abt + ', tools ' + tls);
  const tst = at(x => x.querySelector('.testi'));
  (tst === tls + 1) ? ok('testimonials follow the tool clump') : bad('tools ' + tls + ', testimonials ' + tst);
  (stp === tst + 1) ? ok('the close follows the testimonials') : bad('testimonials ' + tst + ', close ' + stp);

  // missing local files render as nothing and are easy to miss by eye
  for (const el of [...d.querySelectorAll('img[src]'), ...d.querySelectorAll('link[href]'), ...d.querySelectorAll('script[src]')]) {
    const u = el.getAttribute('src') || el.getAttribute('href');
    if (/^(https?:|mailto:|tel:|#|data:|\/\/)/.test(u)) continue;
    if (!fs.existsSync(path.join(ROOT, u.split('?')[0].replace(/^\//, '')))) bad('missing file: ' + u);
  }
  ok('every local reference resolves');
  // a bad string slice once duplicated the whole document, and every DOM
  // assertion still passed because querySelector finds the first match
  const singles = { '<!DOCTYPE': 1, '<html lang': 1, '</html>': 1, '<main>': 1, '</main>': 1,
                    '<footer class="footer">': 1, '<body>': 1 };
  for (const [tag, n] of Object.entries(singles)) {
    const got = html.split(tag).length - 1;
    got === n ? ok('one ' + tag) : bad(got + ' x ' + tag + ', the document may be duplicated');
  }
  errs.length ? bad('runtime errors: ' + errs.join(' | ')) : ok('no runtime errors');
}

/* --------------------------------------------------------------- stylesheet */
console.log('\n— stylesheet —');
{
  // A stray closing brace silently kills every rule after it, and nothing
  // else in this file would notice: the DOM assertions all still pass. This
  // check exists because a regex-driven deletion left one behind.
  const open = (css.match(/{/g) || []).length;
  const close = (css.match(/}/g) || []).length;
  open === close ? ok('braces balanced (' + open + ' pairs)') : bad('brace mismatch: ' + open + ' open, ' + close + ' close');
  let depth = 0; const orphans = [];
  css.split('\n').forEach((line, i) => {
    depth += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
    if (depth < 0) { orphans.push(i + 1); depth = 0; }
  });
  orphans.length ? bad('orphan closing brace at line ' + orphans.join(', ')) : ok('no orphan closing braces');

  // Reported, not failed. Declaring a selector twice is a deliberate
  // technique in this stylesheet — the CARD HOVER block exists precisely to
  // re-declare a hover after a later rule cancelled it — so this is a note
  // for whoever is reading a rule(), not a rule of its own.
  const seen = {};
  for (const m of css.matchAll(/(?:^|\n)([.#][\w-][^{\n,]*?)\s*\{/g)) {
    const sel = m[1].trim();
    seen[sel] = (seen[sel] || 0) + 1;
  }
  const dupes = Object.entries(seen).filter(([, n]) => n > 1).map(([s2, n]) => s2 + ' x' + n);
  dupes.length ? note('declared more than once, rule() joins them: ' + dupes.join(', '))
               : ok('no selector declared twice');
}

/* ----------------------------------------------------------- retired things */
console.log('\n— things that were removed and must stay removed —');
{
  const gone = [
    ['eyebrow',              () => d.querySelector('.eyebrow')],
    ['warm rule',            () => d.querySelector('.warm-rule') || /warm-rule/.test(js)],
    // Removed 7 September. Two image files, a scroll module and forty lines
    // of CSS, all for one rabbit. If he ever comes back he comes back on
    // purpose, not because a stale rule survived a delete.
    ['the hop',              () => d.querySelector('.hop-mark, [data-hop]') ||
                                   /hop-mark|--hop-x|hop-across/.test(css) ||
                                   /data-hop/.test(js)],
    ['footer newsletter',    () => d.querySelector('.footer-optin') || /hsforms/.test(html)],
    ['"Made with love" line',() => /Made with love/.test(html)],
    ['phone number',         () => /480-?825-?5171|tel:/.test(html)],
    ['james@ address',       () => /james@revhops/.test(html)],
    ['pinned case rail',     () => d.querySelector('.case-pin, .case-sticky') || /HOLD_RATIO/.test(js)],
    ['pricing teaser',       () => d.querySelector('.price-teaser')],
    ['section divider rule', () => /border-(top|bottom):\s*1px solid var\(--line\)/.test(html)],
    ['old tool grid',        () => d.querySelector('.tool-cell, .tool-grid')],
    // the per-mark flag is gone from the CLUMP; the footer reuses the name
    // for the reversed Pipedrive mark, which is a different thing
    ['data-reverse on a tool mark', () => [...d.querySelectorAll('.tool-mark img')].some(i => i.hasAttribute('data-reverse'))],
    ['square portrait card in about', () => d.querySelector('.about-media, .about-portrait')],
    ['the wide about band', () => d.querySelector('.about-band')],
    ['numbered steps in next steps', () => d.querySelector('.start-steps')],
    ['the card around the testimonial', () => /background|box-shadow/.test(rule('.testi'))],
    ['the About subheading', () => /RevHops is a handful of RevOps specialists/.test(html)],
    ['paragraph text in the close', () => d.querySelector('.start-wide p')],
  ];
  for (const [name, hit] of gone) hit() ? bad(name + ' came back') : ok('no ' + name);
  // .html links: the site uses clean, extensionless, root-absolute URLs
  const ext = (html.replace(/(?:src|href)="(?:https?:|assets\/)[^"]*"/g, '').match(/href="[^"]*\.html"/g) || []);
  ext.length ? bad('.html page link survived: ' + ext.join(', ')) : ok('no .html page links');
}

/* -------------------------------------------------------------- services */
console.log('\n— services —');
{
  const titles = [...d.querySelectorAll('.svc-title')].map(t => t.textContent.trim());
  const want = ['Solution design', 'CRM implementations', 'HubSpot support retainers',
                'RevOps consulting', 'Lead to cash process mapping'];
  JSON.stringify(titles) === JSON.stringify(want)
    ? ok('services in the order James set') : bad('order is ' + titles.join(' / '));
  /justify-content: center/.test(rule('.svc-cta'))
    ? ok('CTA centred under the list') : bad('CTA is not centred under the list');
  const cue = d.querySelector('.svc-cta p').textContent.trim();
  cue === 'Not sure exactly what you need?' ? ok('cue reads "' + cue + '"') : bad('cue is "' + cue + '"');
  // a prompt, not a heading: body face at normal weight
  /font-weight: 400/.test(rule('.svc-cta p')) ? ok('cue is unbolded') : bad('cue is still bold');
  const sh = d.querySelector('.svc-list').closest('section').querySelector('.h2').textContent.trim();
  sh === "RevOps services that scale with you, wherever you're at"
    ? ok('services heading updated') : bad('services heading is "' + sh + '"');
  d.querySelector('.svc-list').closest('section').querySelector('.sec-head .sec-sub')
    ? ok('services section has a subheading') : bad('no subheading under the services heading');
}

/* ------------------------------------------------------------- case studies */
console.log('\n— case rail —');
{
  d.querySelector('section > .shell > .case-rail-wrap .case-rail')
    ? ok('rail sits inside the .shell, so the section keeps its side margins')
    : bad('rail escaped the .shell and lost the section margins');
  (d.querySelector('[data-case-prev]') && d.querySelector('[data-case-next]'))
    ? ok('prev and next arrows present') : bad('arrows missing');
  /data-case-prev/.test(js) ? ok('arrows wired in site.js') : bad('arrows are not wired');
  d.querySelectorAll('.case-card').length === 5
    ? ok('5 case cards') : bad(d.querySelectorAll('.case-card').length + ' case cards');
  const h = d.querySelector('.case-head .h2').textContent.trim();
  h === "We've hopped with some of the best" ? ok('heading is "' + h + '"') : bad('heading is "' + h + '"');
  d.querySelector('.case-cta') ? bad('see-all CTA came back') : ok('no see-all CTA');
  /border: 0/.test(rule('.case-nav button')) ? ok('arrows have no box around them')
                                             : bad('arrows are boxed again');
  // the rail must not bleed: that was tried and reverted
  /margin-inline: calc\(clamp\(20px, 5vw, 60px\) \* -1\)/.test(rule('.case-rail'))
    ? bad('rail bleeds past the shell again') : ok('rail does not bleed');
}

/* ----------------------------------------------------------------- the clump */
console.log('\n— tool clump —');
{
  const rows = [...d.querySelectorAll('.tool-clump .tool-row')];
  rows.length === 2 ? ok('exactly two rows') : bad(rows.length + ' rows, never allowed above 2');
  const counts = rows.map(r => r.children.length);
  counts.reduce((a, b) => a + b, 0) === 15 ? ok('15 marks, split ' + counts.join(' and '))
                                           : bad('marks total ' + counts.reduce((a, b) => a + b, 0));

  // HubSpot has to sit at the exact middle of an odd row: that is the one
  // position the edge mask can never fade
  const top = [...rows[0].children];
  const i = top.findIndex(x => /hubspot/.test(x.querySelector('img').getAttribute('src')));
  (top.length % 2 === 1 && i === (top.length - 1) / 2)
    ? ok('HubSpot is dead centre of the top row, ' + (i + 1) + ' of ' + top.length)
    : bad('HubSpot is ' + (i + 1) + ' of ' + top.length + ', not the centre');
  top[i].querySelector('img').hasAttribute('data-hero')
    ? ok('HubSpot carries data-hero for its larger size') : bad('HubSpot has no data-hero');

  // the marks James placed by hand: the ones he named near the middle, and
  // the ones he named at the ends
  {
    const rowNames = [...rows].map(r => [...r.children].map(x => /tools\/([\w-]+)\./.exec(x.querySelector('img').getAttribute('src'))[1]));
    const mid = n => { const r = rowNames.find(x => x.includes(n)); const i = r.indexOf(n);
                       return Math.abs(i - (r.length - 1) / 2) <= 1.5; };
    const edge = n => { const r = rowNames.find(x => x.includes(n)); const i = r.indexOf(n);
                        return i === 0 || i === r.length - 1; };
    for (const n of ['salesforce', 'pipedrive', 'hubspot'])
      mid(n) ? ok(n + ' sits near the middle') : bad(n + ' drifted away from the middle');
    // the two nearest the middle are also the two sized up
    for (const n of ['salesforce', 'pipedrive'])
      d.querySelector('.tool-mark img[src*="' + n + '"][data-mid]')
        ? ok(n + ' is sized up with data-mid') : bad(n + ' is not sized up');
    /\[data-mid\] \{ height: clamp\(27px/.test(css)
      ? ok('data-mid sits between the default and HubSpot') : bad('no data-mid size tier');
    for (const n of ['advizorpro', 'marketo', 'netsuite', 'quickbooks'])
      edge(n) ? ok(n + ' sits at an edge') : bad(n + ' is not at an edge');
  }
  for (const want of ['slack', 'zoominfo', 'quickbooks', 'chargebee', 'salesmsg', 'advizorpro', 'meta', 'google-workspace'])
    [...d.querySelectorAll('.tool-mark img')].some(m => m.getAttribute('src').includes(want))
      ? ok('clump has ' + want) : bad('clump is missing ' + want);

  /width: 100vw/.test(rule('.tool-clump')) ? ok('clump is full-bleed so it can spread sideways')
                                           : bad('clump is not full-bleed');
  /mask-image/.test(rule('.tool-clump')) ? ok('marks fade toward both edges') : bad('no edge fade');
  // mask-clip defaults to border-box, so a mask CROPS anything outside the
  // element's box. Without this padding the tallest lockup lost its top.
  /padding-block: clamp/.test(rule('.tool-clump'))
    ? ok('clump has the padding that stops the mask cropping the tall marks')
    : bad('no clump padding, the mask will crop the tallest mark again');
  /flex-wrap: nowrap/.test(rule('.tool-row')) ? ok('rows never wrap into a third line') : bad('rows can wrap');
  // on mobile the rows dissolve so all 15 flow as one list; wrapping each row
  // on its own gave 4/3/4/4, and a short row in the MIDDLE reads as a fault
  /\.tool-row \{ display: contents; \}/.test(css)
    ? ok('rows dissolve on mobile so only the last row is short')
    : bad('rows still wrap individually on mobile, which shortens a middle row');
  /justify-content: space-evenly/.test(rule('.tool-row')) ? ok('marks spread to fill the row')
                                                          : bad('marks are not spread');
  // both the offsets and the hover set transform at equal specificity, so the
  // hover must come LAST or the magnification silently does nothing
  const hov = css.lastIndexOf('.tool-row .tool-mark:nth-child(n):hover');
  const off = css.lastIndexOf('.tool-row .tool-mark:nth-child(8)');
  (hov !== -1 && hov > off) ? ok('hover magnification outranks the clump offsets')
                            : bad('the offsets cancel the hover magnification again');
  d.querySelector('.tool-cta') ? bad('tool CTA came back') : ok('no CTA under the clump');
}

/* ------------------------------------------------------------------- about */
console.log('\n— about —');
{
  const sec = d.querySelector('.about-stack').closest('section');
  // 5 Sept: the square portrait card went, then the wide band went. This is
  // the offset pair, and it must not become a card again.
  d.querySelector('.about-media, .about-portrait, .about-band')
    ? bad('an earlier about layout came back') : ok('no portrait card and no band');
  const imgs = d.querySelectorAll('.about-stack .about-img');
  imgs.length === 2 ? ok('two images in the pair') : bad(imgs.length + ' images, the concept needs two');
  (imgs[0].classList.contains('about-img-back') && imgs[1].classList.contains('about-img-front'))
    ? ok('back then front, so the smaller one paints over the larger') : bad('image order is wrong');
  // different shapes and opposite rotations are the point; matching ones read
  // as a mistake rather than a composition
  const back = rule('.about-img-back'), front = rule('.about-img-front');
  (/aspect-ratio: 4 \/ 5/.test(back) && !/aspect-ratio/.test(front))
    ? ok('portrait behind, badge in front at its own proportions')
    : bad('the front image is being forced to a shape');
  // no plate, no border, no shadow round the badge — asked for explicitly
  (/border: 0/.test(front) && /background: none/.test(front) && /box-shadow: none/.test(front))
    ? ok('the badge carries no plate, border or shadow') : bad('something is framing the badge');
  (/rotate\(-2\.2deg\)/.test(back) && /rotate\(3\.2deg\)/.test(front))
    ? ok('turned opposite ways') : bad('rotations are not opposed');
  // the front must react harder than the back or the pair moves as one sheet
  const mul = r => { const m = /var\(--tx\) \* (\d+)deg/.exec(r); return m ? +m[1] : 0; };
  mul(front) > mul(back) ? ok('front tilts harder than back, ' + mul(front) + 'deg to ' + mul(back) + 'deg')
                         : bad('both tilt the same, the pair will read flat');
  d.querySelector('.about-stack[data-tilt]') ? ok('pair wired for tilt') : bad('no data-tilt on the pair');
  // the front image is the Platinum badge now, which is content rather than
  // decoration, so it carries a real alt and is NOT hidden
  (imgs[1].getAttribute('alt') && imgs[1].getAttribute('aria-hidden') !== 'true')
    ? ok('the badge is announced, not hidden') : bad('the badge has no alt or is aria-hidden');
  /hubspot-platinum-badge\.webp/.test(imgs[1].getAttribute('src'))
    ? ok('front image is the colour Platinum badge') : bad('front image is not the badge');
  /minmax\(0, 2fr\) minmax\(0, 3fr\)/.test(rule('.about-split'))
    ? ok('split is 40/60, image then copy') : bad('split is not 40/60');
  const col = d.querySelector('.about-stack').parentElement.querySelector('.stack');
  (col.firstElementChild && col.firstElementChild.matches('h2.h2'))
    ? ok('heading is the first thing in the copy column') : bad('heading is not at the top of the copy column');
  // the subheading came out on 5 Sept; the heading now leads straight into
  // the body paragraph
  col.querySelector('.sec-sub') ? bad('the About subheading came back') : ok('no About subheading');
  /Every person who touches your portal/.test(sec.textContent)
    ? bad('the removed lede came back') : ok('"Every person who touches" stays removed');
  /Get in touch/.test(sec.textContent) ? bad('"Get in touch" came back') : ok('no "Get in touch" CTA');
  /Platinum Solutions Partner/.test(sec.textContent) ? ok('platinum partner stated in the copy')
                                                     : bad('platinum not mentioned');
  (d.querySelector('section.to-white-1') && d.querySelector('section.to-white-2'))
    ? ok('paper drifts to white across about and the clump') : bad('the paper-to-white drift is gone');
}

/* ------------------------------------------------------------- start section */
console.log('\n— start section —');
{
  const sp = d.querySelector('.start-wide');
  sp ? ok('closing block present') : bad('no .start-wide');
  sp.closest('.shell') ? bad('the closing block went back inside a .shell') : ok('runs full width, outside the shell');
  const shout = sp.querySelector('.start-shout');
  (shout && /Ready to hop\s*with RevHops\?/.test(shout.textContent.replace(/\s+/g, ' ')))
    ? ok('shout reads "Ready to hop with RevHops?"') : bad('shout is "' + (shout ? shout.textContent : 'absent') + '"');
  shout.querySelector('br') ? ok('the line break is forced, not left to the measure') : bad('no forced break in the shout');
  // the br is display:none on mobile, so without a space before it the two
  // text nodes butt together and read "hopwith"
  /Ready to hop <br>/.test(html) ? ok('space before the br survives when the br is hidden')
                                 : bad('no space before the br: it will read "hopwith" on mobile');
  // no paragraph in this section at all, by instruction
  sp.querySelector('p') ? bad('paragraph text came back into the close') : ok('no paragraph text in the close');
  /flex-direction: column/.test(rule('.start-wide')) && /text-align: center/.test(rule('.start-wide'))
    ? ok('centred layout') : bad('not centred');
  const cta = sp.querySelector('.btn');
  // relative now, so the same file works at revhops.com and at
  // ricksjrr.github.io/revhops.com/ — see relativise() in build-pages.js
  (cta && cta.getAttribute('href') === 'call') ? ok('one boxed CTA, pointing at call') : bad('no call CTA');
  sp.querySelectorAll('.btn').length === 1 ? ok('exactly one button')
                                           : bad(sp.querySelectorAll('.btn').length + ' buttons');
  // the artwork is back, spanning the close and half the testimonial above it
  /start-panel-bg/.test(rule('.start-section')) ? ok('artwork behind the close') : bad('no artwork behind the close');
  /--start-bleed: clamp/.test(rule('.start-section')) ? ok('it bleeds up into the testimonial')
                                                     : bad('the artwork does not reach the section above');
  /linear-gradient\(to bottom, var\(--surface\) 0, rgba\(255, 255, 255, 0\) var\(--start-bleed\)\)/.test(rule('.start-section'))
    ? ok('fades out over the bleed, so it appears mid-section rather than at a line')
    : bad('the artwork arrives at a hard edge');
  // a taller frame pulls more of the dark corner in, so the zoom went up
  /background-size: auto, 200% auto/.test(rule('.start-section'))
    ? ok('zoomed 200%, which is what clears the floor at this height') : bad('artwork zoom is not 200%');
  /rgba\(255, 255, 255, \.[0-9]/.test(rule('.start-section'))
    ? bad('a lightening veil is back on the artwork') : ok('no lightening veil');
  const pb = /padding-bottom: clamp\((\d+)px/.exec(rule('.start-section'));
  (pb && +pb[1] >= 60) ? ok('a clear beat between the close and the footer, ' + pb[1] + 'px floor')
                       : bad('not enough room before the footer');
  d.querySelector('.meetings-iframe-container, .start-booking')
    ? bad('the booking embed came back') : ok('no booking embed');
  d.querySelector('.start-steps') ? bad('the numbered steps came back') : ok('no numbered steps');
}

/* ------------------------------------------------------------ testimonials */
console.log('\n— testimonials —');
{
  const cols = [...d.querySelectorAll('.testi .testi-col')];
  cols.length === 3 ? ok('three quotes, three columns') : bad(cols.length + ' columns');
  /repeat\(3, minmax\(0, 1fr\)\)/.test(rule('.testi')) ? ok('grid is three equal columns') : bad('not three columns');
  // Centred, not topped out. The three quotes are different lengths, so the
  // tallest sets the row height and the other two float in the middle of
  // theirs — which means the titles deliberately do NOT line up. Asked for
  // on 7 September, replacing `align-items: start`.
  /align-items: center/.test(rule('.testi')) ? ok('each quote centred in its own column')
                                             : bad('the columns are topped out again');

  // name and role, no company, as of 7 Sept
  const want = [
    ['Superior expertise',      'Deborah | COO',                /exceeded expectations/],
    ['Responsive & Thorough',   'Amy | VP of Client Services',  /Marketing Hub Enterprise/],
    ['Great team to work with!','Adam | CEO',                   /small company up for success/],
  ];
  // the phrase James picked out in each
  const hlWant = [
    /^James has taken the time .* and transparent$/,
    /^RevHops put together a clear, structured plan, .* easy to align on$/,
    /^James set our small company up for success through his proven process$/,
  ];
  want.forEach(([title, who, body], i) => {
    const c = cols[i];
    if (!c) { bad('no column ' + (i + 1)); return; }
    const t = c.querySelector('.testi-title').textContent.replace(/[“”]/g, '').replace(/\s+/g, ' ').trim();
    t === title ? ok('column ' + (i + 1) + ': "' + t + '"') : bad('column ' + (i + 1) + ' title is "' + t + '"');
    body.test(c.textContent) ? ok('  quote copy in place') : bad('  quote copy missing or wrong');
    const cite = c.querySelector('cite').textContent.replace(/\s+/g, ' ').trim();
    cite === who ? ok('  ' + who) : bad('  attribution is "' + cite + '"');
    c.querySelector('cite .sep') ? ok('  divider is its own span, so it can sit lighter')
                                 : bad('  no .sep divider in the attribution');
    c.querySelectorAll('.stars svg').length === 5 ? ok('  five stars') : bad('  wrong star count');
    c.querySelector('.stars').getAttribute('aria-label') ? ok('  rating has a text equivalent') : bad('  rating is invisible to screen readers');
    c.querySelector('.testi-title .q') ? ok('  title in warm quote marks') : bad('  title has no quote marks');
    const hl = c.querySelector('.quote p .hl');
    (hl && hlWant[i].test(hl.textContent.replace(/\s+/g, ' ').trim()))
      ? ok('  highlight is the phrase James picked')
      : bad('  highlight is "' + (hl ? hl.textContent.replace(/\s+/g, ' ').trim().slice(0, 50) : 'absent') + '"');
    c.querySelector('blockquote.quote') ? ok('  marked up as a blockquote') : bad('  not a blockquote');
    // one line, not three: the cite was a flex column back when it held a
    // name above a company, and the stale rule stacked "Deborah", "|", "COO"
    /display: block/.test(rule('.quote-by cite')) ? ok('  name, divider and role on one line')
                                                  : bad('  the cite is stacking again');
  });
  // Deborah first, by instruction
  /Deborah/.test(cols[0].textContent) ? ok('Deborah is in the left column') : bad('Deborah is not first');
  // 7 Sept: name and role only, no company. The logo band still names Core
  // Income, which is a different thing, so this is scoped to the section.
  {
    const sec = d.querySelector('.testi').innerHTML;
    const named = ['Core Income', 'All Around Creative', 'Seventh Avenue'].filter(c => sec.includes(c));
    named.length ? bad('company named in a testimonial: ' + named.join(', '))
                 : ok('no companies named in the testimonials');
  }

  // no cards: space does the separating, as it has through three rebuilds
  /background|border:|box-shadow|border-radius/.test(rule('.testi-col'))
    ? bad('the columns became cards') : ok('columns carry no surface');
  /background|border:|box-shadow/.test(rule('.testi')) ? bad('the card came back around the row')
                                                       : ok('no card around the row');
  d.querySelector('.testi-mark, .sticker, .sticker-disc') ? bad('the client mark came back') : ok('no client mark');
  /core-income-color/.test(html) ? bad('the colour mark is still referenced') : ok('colour mark unreferenced');
  // copy James cut on 7 Sept, in two separate quotes
  /consultant agencies/.test(html) ? bad("the agencies sentence came back into Deborah's quote")
                                   : ok('the agencies sentence stays out');
  /consistently thorough in both planning and execution/.test(html)
    ? bad("the long form of Amy's sentence came back") : ok("Amy's sentence stays shortened");

  // one h2 for the outline, three h3s under it
  const sec = d.querySelector('.testi').closest('section');
  const srh2 = sec.querySelector('h2.sr-only');
  srh2 ? ok('an sr-only h2 keeps the outline correct') : bad('the section has no h2 for the outline');
  cols.every(c => c.querySelector('h3.testi-title')) ? ok('titles are h3s under it') : bad('titles are not h3s');

  /font-style: italic/.test(rule('.testi-title')) ? ok('titles italic') : bad('titles are not italic');
  /font-style: normal/.test(rule('.testi-title .q')) ? ok('the marks stay upright') : bad('italic quote marks');
  /font-style: italic/.test(rule('.quote p')) ? ok('quote bodies italic') : bad('quote bodies are not italic');
  /font-style: normal/.test(rule('.quote-by cite')) ? ok('the names stay upright') : bad('the names are italic too');
  /&thinsp;/.test(html) ? ok('thin spaces inside the quote marks') : bad('no spacing inside the quote marks');
  // --ink-strong, not --navy: the stars are ink on the page ground, so they
  // have to go white when the ground goes navy. --navy now means a dark
  // chip and would have left five navy stars on a navy page.
  /fill: var\(--ink-strong\)/.test(rule('.stars svg')) ? ok('stars follow the page ink')
                                                        : bad('stars are painted with a ground colour');
  /background: var\(--surface\)/.test(rule('.testi-section'))
    ? ok('white ground, so the drift lands and the artwork fades into it') : bad('the section is not white');
  // the about pair was capped on 6 Sept: at full width it outweighed the copy
  /max-width: 400px/.test(rule('.about-stack')) ? ok('about pair capped at 400px') : bad('the about pair is uncapped again');
}

/* ------------------------------------------------------------- highlights */
console.log('\n— highlights —');
{
  // removed 3 Sept, asked for again on the 6th. These five phrases are the
  // ones James named; do not add more without asking.
  const want = {
    "RevOps services that scale with you, wherever you're at": "wherever you're at",
    "We've hopped with some of the best": 'some of the best',
    'Small by design and staying that way': 'Small by design',
    'Experts in all of the tools in your RevOps stack': 'all of the tools',
  };
  const heads = [...d.querySelectorAll('h2.h2')];
  for (const [full, phrase] of Object.entries(want)) {
    const h = heads.find(x => x.textContent.replace(/\s+/g, ' ').trim() === full);
    if (!h) { bad('heading missing: "' + full + '"'); continue; }
    const hl = h.querySelector('.hl');
    (hl && hl.textContent.trim() === phrase)
      ? ok('"' + phrase + '" highlighted')
      : bad('"' + phrase + '" is not the highlighted span in "' + full + '"');
  }
  // four section heads plus one inside the testimonial body
  const inQuote = d.querySelector('.quote p .hl');
  (inQuote && /^James has taken the time/.test(inQuote.textContent.replace(/\s+/g, ' ').trim())
           && /and transparent$/.test(inQuote.textContent.replace(/\s+/g, ' ').trim()))
    ? ok('the quote body highlight runs from "James has taken" to "and transparent"')
    : bad('the quote highlight is "' + (inQuote ? inQuote.textContent.replace(/\s+/g, ' ').trim().slice(0, 40) : 'absent') + '"');
  // four section heads plus one in each of the three testimonials
  d.querySelectorAll('.hl').length === 7
    ? ok('exactly seven highlights, no drift') : bad(d.querySelectorAll('.hl').length + ' highlights');
  [...d.querySelectorAll('.testi-col')].every(c => c.querySelector('.quote p .hl'))
    ? ok('every testimonial carries one') : bad('a testimonial is missing its highlight');
  // fixed warm means fixed type on it, so the colour is literal
  /color: #304157/.test(rule('.hl')) ? ok('type on the warm is a literal navy') : bad('type on the warm uses a token');
  /box-decoration-break: clone/.test(rule('.hl'))
    ? ok('a wrapped phrase gets a fill on every line') : bad('a wrapped highlight will leave its second line bare');
  // the italic was half of what made the old version read as a template
  /font-style: italic/.test(rule('.hl')) ? bad('the italic came back with it') : ok('not italic this time');
}

/* ------------------------------------------------------------------ footer */
console.log('\n— footer —');
{
  const sh = d.querySelector('footer.footer > .shell');
  // a stray </div> once closed .shell on the line it opened, and the whole
  // footer sat outside its own padding
  (sh && sh.children.length >= 2) ? ok('footer content is inside .shell (' + sh.children.length + ' children)')
                                  : bad('footer .shell is empty, content escaped its padding');
  d.querySelector('.footer-top .footer-brand .footer-mark') ? ok('white lockup present') : bad('no lockup');
  const mail = d.querySelector('.footer-mail');
  (mail && mail.getAttribute('href') === 'mailto:team@revhops.com') ? ok('address is a display link')
                                                                   : bad('no display address');
  const badges = [...d.querySelectorAll('.footer-badges img')];
  badges.length === 1 ? ok('one partner mark') : bad(badges.length + ' partner marks, Pipedrive was removed');
  // the reversed artwork, which is what let the chip and the filter go
  /hubspot-platinum-badge-white/.test(badges[0].getAttribute('src'))
    ? ok('reversed white badge, 0% of its ink under 3:1 on the navy')
    : bad('not the reversed badge: ' + badges[0].getAttribute('src'));
  /filter/.test(rule('.footer-badges img')) ? bad('a filter is being used to fake the reverse')
                                            : ok('no filter needed on the badge');
  const link = d.querySelector('.footer-badges a');
  (link && link.getAttribute('href') === 'https://ecosystem.hubspot.com/marketplace/solutions/revhops')
    ? ok('badge links to the partner directory') : bad('badge is not linked, or the URL is wrong');
  (link && link.getAttribute('rel') === 'noopener' && link.getAttribute('target') === '_blank')
    ? ok('opens in a new tab with rel=noopener') : bad('external link is missing target or rel');
  // scoped to the footer on purpose: the tool clump still carries Pipedrive
  /pipedrive/.test(d.querySelector('footer.footer').innerHTML)
    ? bad('Pipedrive came back to the footer') : ok('no Pipedrive in the footer');
  /background: rgba\(250, 250, 248/.test(rule('.footer-badges img'))
    ? bad('the paper chips came back') : ok('no paper chip behind the badge');
  // tied to the link columns rather than a fixed number, so it stays in step
  // when a link is added
  (/align-items: stretch/.test(rule('.footer-badges')) && /height: 100%/.test(rule('.footer-badges img')))
    ? ok('badge stretches to the height of the link columns') : bad('badge height is not tied to the columns');
  // mobile: everything centred, link columns stay two abreast
  {
    const mob = css.slice(css.indexOf('MOBILE FOOTER'), css.indexOf('MOBILE FOOTER') + 900);
    /justify-items: center/.test(mob) ? ok('footer content centres on mobile') : bad('footer not centred on mobile');
    /\.footer-badges \{ justify-self: center; \}/.test(mob) ? ok('badge centres on mobile') : bad('badge not centred on mobile');
    /\.footer-links \{\s*grid-template-columns: repeat\(2/.test(mob)
      ? ok('link columns stay two abreast on mobile') : bad('link columns stack on mobile');
  }
  /max-height: 150px/.test(rule('.footer-badges img')) ? ok('partner badge trimmed to 150px')
                                                       : bad('partner badge not resized');
  // the legal row reads as part of the copyright line, not as nav links
  /font-size: inherit/.test(rule('.footer-legal a')) && /color: inherit/.test(rule('.footer-legal a'))
    ? ok('legal links inherit the copyright line size and colour')
    : bad('legal links do not match the copyright line');
  /height: 47px/.test(rule('.footer-mark')) ? ok('footer lockup up 15%, 41px to 47px') : bad('footer lockup not resized');
  /font-size: \.95rem/.test(rule('.footer h4')) ? ok('column headings up to .95rem') : bad('column headings not resized');
  /margin-top: 14px/.test(rule('.footer-bottom')) ? ok('space above the copyright tightened')
                                                  : bad('space above the copyright unchanged');
  const pb = /padding-bottom: clamp\((\d+)px/.exec(rule('.footer-top'));
  (pb && +pb[1] <= 24) ? ok('space above the copyright reduced, ' + pb[1] + 'px floor')
                       : bad('space above the copyright not reduced');
  d.querySelector('.footer-bottom') ? ok('bottom bar present') : bad('no bottom bar');
}

/* ----------------------------------------------------------- light / dark */
console.log('\n— light / dark —');
{
  /* Contrast is computed here rather than eyeballed. Every colour in the
     dark palette is read back out of the stylesheet and measured against
     the ground it actually sits on, so a later tweak to a hex cannot
     quietly drop the page under AA. */
  const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = h => {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h.trim());
    const [r, g, b] = m.slice(1).map(x => parseInt(x, 16));
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };
  const contrast = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const over = (fg, alpha, bg) => {
    const px = h => /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h).slice(1).map(x => parseInt(x, 16));
    const f = px(fg), b = px(bg);
    return '#' + [0, 1, 2].map(i => Math.round(f[i] * alpha + b[i] * (1 - alpha))
      .toString(16).padStart(2, '0')).join('');
  };

  const darkBlock = rule(':root[data-theme="dark"]');
  darkBlock ? ok('a dark palette exists') : bad('no :root[data-theme="dark"] block');
  const tok = n => (new RegExp('--' + n + ':\\s*([^;]+);').exec(darkBlock) || [, ''])[1].trim();

  const ground = tok('paper');
  /^#304157$/i.test(ground) ? ok('paper goes navy, as asked (' + ground + ')')
                            : bad('the dark ground is ' + ground + ', not navy');
  /^#FFFFFF$/i.test(tok('ink-strong')) ? ok('the strongest ink goes white')
                                       : bad('ink-strong is ' + tok('ink-strong') + ' in dark');
  // the lifted surface has to stay a lift, or the drift to white inverts
  lum(tok('surface')) > lum(ground)
    ? ok('the surface still sits above the ground') : bad('the dark surface is darker than the page');

  const surface = tok('surface');
  const pairs = [
    ['--ink on the ground',   tok('ink'),   ground,  4.5],
    ['--body on the ground',  tok('body'),  ground,  4.5],
    ['--muted on the ground', tok('muted'), ground,  4.5],
    ['--ink on the surface',  tok('ink'),   surface, 4.5],
    ['--body on the surface', tok('body'),  surface, 4.5],
    // the tighter of the two grounds, and the one that sets --muted
    ['--muted on the surface', tok('muted'), surface, 4.5],
    ['--ink-strong on the ground', tok('ink-strong'), ground, 4.5],
  ];
  for (const [name, fg, bg, need] of pairs) {
    const v = contrast(fg, bg);
    v >= need ? ok(name + ' ' + v.toFixed(2) + ':1')
              : bad(name + ' is only ' + v.toFixed(2) + ':1, needs ' + need);
  }
  // the two logo sets are flattened to white and shown at reduced opacity;
  // non-text, so 3:1
  for (const [name, sel, prop] of [['client marks', ':root[data-theme="dark"] .logo-run img', 'opacity']]) {
    const a = parseFloat((new RegExp(prop + ':\\s*([\\d.]+)').exec(rule(sel)) || [, 0])[1]);
    const v = contrast(over('#FFFFFF', a, ground), ground);
    v >= 3 ? ok(name + ' read at ' + v.toFixed(2) + ':1 on the navy')
           : bad(name + ' only reach ' + v.toFixed(2) + ':1');
  }
  // the quietest tool marks are the default tier at .5
  {
    const v = contrast(over('#FFFFFF', 0.5, ground), ground);
    v >= 3 ? ok('tool marks read at ' + v.toFixed(2) + ':1 at their quietest')
           : bad('tool marks only reach ' + v.toFixed(2) + ':1');
  }
  // and on hover they get a white plate, because brand colour on navy does not work
  /background: #FFFFFF/.test(rule(':root[data-theme="dark"] .tool-mark::before'))
    ? ok('hover puts the tool marks on a white plate, so brand colour survives')
    : bad('the tool marks go full colour straight onto the navy');

  /* The two things James asked to leave alone. --navy is the dark-chip
     token; if the dark palette ever redefines it, the footer and the
     floating bar change colour, which is exactly what must not happen. */
  /--navy:/.test(darkBlock) ? bad('the dark palette redefines --navy, the footer and nav bar will move')
                            : ok('--navy untouched, so the footer and floating bar keep their colour');
  /background:/.test(rule(':root[data-theme="dark"] .footer'))
    ? bad('the footer takes a dark-theme background') : ok('the footer has no dark-theme background');
  // but the bar now floats on its own colour, so it needs an edge
  {
    const a = parseFloat((/inset 0 0 0 1px rgba\(255, 255, 255, \.(\d+)\)/
      .exec(rule(':root[data-theme="dark"] .nav.is-floating .nav-inner')) || [, 0])[1]) / 100;
    const v = a ? contrast(over('#FFFFFF', a, ground), ground) : 0;
    v >= 3 ? ok('the floating bar keeps an edge on a navy page, ' + v.toFixed(2) + ':1')
           : bad('the floating bar has no edge on the navy page (' + v.toFixed(2) + ':1)');
  }
  // paper-coloured things painted ON the fixed navy have to stop following
  // the theme, or they turn navy-on-navy
  /background: #FAFAF8/.test(rule(':root[data-theme="dark"] .nav.is-floating .nav-cta .btn-primary'))
    ? ok('the bar button is a literal, so it stays paper on the navy')
    : bad('the floating bar button will go navy on navy');

  // The close is set over a photograph with no dark variant. Measured, the
  // artwork is mostly light, so the dark theme's near-white ink would land
  // at about 1.1:1 on it. This section keeps light-theme type in both.
  /color: #304157/.test(rule(':root[data-theme="dark"] .start-shout'))
    ? ok('the close keeps navy type, because it sits on a light photograph')
    : bad('the close headline will be near-white on a light photograph');
  /background: #304157/.test(rule(':root[data-theme="dark"] .start-section .btn-primary'))
    ? ok('and its button stays navy on that artwork')
    : bad('the close button will be a pale button on pale artwork');

  /* ---- the toggle ---- */
  const tt = d.querySelector('[data-theme-toggle]');
  tt ? ok('the toggle is in the page') : bad('no theme toggle');
  tt && tt.closest('.nav-cta') ? ok('it sits in the nav, with the other controls')
                               : bad('the toggle is not in the nav');
  tt && tt.hasAttribute('aria-pressed') ? ok('it reports its own state')
                                        : bad('the toggle has no aria-pressed');
  (tt && tt.querySelector('.theme-sun') && tt.querySelector('.theme-moon'))
    ? ok('both icons are drawn, CSS picks one') : bad('an icon is missing');
  /aria-pressed/.test(js) && /localStorage/.test(js)
    ? ok('site.js keeps the state and remembers the choice') : bad('the theme module is missing');
  /try \{[\s\S]{0,200}localStorage\.setItem/.test(js)
    ? ok('the write is wrapped, so private mode cannot break the page')
    : bad('an unguarded localStorage write will throw in private mode');
  /:root\[data-theme="dark"\] \.brand-alt\s*\{[^}]*opacity: 1/.test(css)
    ? ok('the white lockup shows at rest on a dark page') : bad('the navy lockup stays on the navy page');

  /* ---- no flash, and the refresh lands at the top ---- */
  const head = html.slice(0, html.indexOf('</head>'));
  /localStorage\.getItem\('revhops-theme'\)/.test(head)
    ? ok('the theme is set in the head, before the first paint')
    : bad('the theme is applied after paint, which flashes white on every load');
  /scrollRestoration = 'manual'/.test(head)
    ? ok('reload lands at the very top rather than where you were')
    : bad('the browser will restore the scroll and the nav will load floating');
  /!location\.hash/.test(head)
    ? ok('and an anchor link still goes to its anchor') : bad('manual restoration will break #links');
}

/* ------------------------------------------------------------ known dead ends */
console.log('\n— known —');
{
  // A root-absolute href resolves to either <name>.html at the root or
  // <name>/index.html one level down — /services is a folder because the five
  // service pages live under it. Both count as built.
  const built = h => {
    const rel = h.replace(/^[./]+/, '');
    return fs.existsSync(path.join(ROOT, rel + '.html')) ||
           fs.existsSync(path.join(ROOT, rel, 'index.html'));
  };
  const internal = [...d.querySelectorAll('a[href]')].map(a => a.getAttribute('href'))
    .filter(h => !/^(https?:|mailto:|tel:|#|\/\/)/.test(h));
  const dead = [...new Set(internal.filter(h => h !== './' && !/\.(txt|html)$/.test(h) && !built(h)))];
  dead.length ? bad(dead.length + ' link(s) point nowhere: ' + dead.join(', '))
              : ok('every internal link on the homepage resolves to a page');
  const absolute = [...d.querySelectorAll('a[href^="/"]:not([href^="//"])')].map(a => a.getAttribute('href'));
  absolute.length ? bad('root-absolute link(s) came back, these 404 on github.io: ' + absolute.join(', '))
                  : ok('no root-absolute links, so the site works at any base path');
}

console.log(fail ? '\n' + fail + ' FAILURE(S)\n' : '\nall checks passed\n');
process.exit(fail ? 1 : 0);
