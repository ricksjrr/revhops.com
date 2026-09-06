#!/usr/bin/env node
/* ==========================================================================
   RevHops — page builder

   Twenty pages share a head, a navigation bar, a closing panel and a footer.
   Hand-copied, one nav change is twenty edits and the twenty-first page is
   the one that quietly drifts. This holds the shared chrome once and the
   per-page content in PAGES, and writes plain static HTML.

   THE OUTPUT IS THE SITE. This script is not a build step in the deploy
   sense — GitHub Pages never sees it, and the .html files it writes are
   committed and served as-is. It exists so the chrome stays identical.

   Run it from the repo root:

       node tools/build-pages.js

   It overwrites every page it owns (everything in PAGES) and leaves
   index.html alone — the homepage is hand-maintained, because the maturity
   hero is one of a kind and does not belong in a template.

   AFTER EDITING A PAGE BY HAND, either fold the change back into this file
   or the next run will drop it. That is the trade for one nav.
   ========================================================================== */

'use strict';

var fs = require('fs');
var path = require('path');

var ROOT = path.resolve(__dirname, '..');

/* THE CACHE STAMP IS DERIVED, NOT TYPED.

   Every page links site.css and site.js with ?v=<stamp>. If the stamp does
   not change when those files do, browsers and the GitHub Pages CDN keep
   serving the old stylesheet against the new markup — which on 9 September
   meant a whole redesign shipped and rendered as the previous one, because
   the stamp was a hand-typed constant somebody forgot to bump. Twice.

   So it is a hash of the asset files themselves. Change a stylesheet and the
   stamp changes on the next build; change nothing and it stays put, so a
   rebuild does not needlessly bust every visitor's cache. It cannot go
   stale, because there is nothing to remember to do.

   index.html is hand-maintained and is not in PAGES, so the writer at the
   bottom of this file rewrites its stamp too. */
var STAMP = (function () {
  var h = require('crypto').createHash('sha1');
  ['assets/css/site.css', 'assets/js/site.js', 'assets/js/maturity-slider.js']
    .forEach(function (f) { h.update(fs.readFileSync(path.join(ROOT, f))); });
  return h.digest('hex').slice(0, 10);
})();

/* ---------- shared chrome ------------------------------------------------ */

/* depth 0 = a file at the root, depth 1 = a file one folder down */
function up(depth) { return depth === 0 ? '' : '../'.repeat(depth); }

var NAV_ITEMS = [
  ['/services',     'Services'],
  ['/case-studies', 'Case studies'],
  ['/hubspot',      'HubSpot'],
  ['/pricing',      'Pricing'],
  ['/about-us',     'About'],
  ['/contact',      'Contact']
];

function head(p) {
  var a = up(p.depth);
  return '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'<meta charset="utf-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>' + p.title + '</title>\n' +
'<meta name="description" content="' + p.description + '">\n' +
(p.noindex ? '<meta name="robots" content="noindex, nofollow">\n' : '') +
'<link rel="icon" href="' + a + 'assets/img/revhops-icon.png">\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,400;1,700&family=Lato:wght@300;400;700;900&display=swap">\n' +
'<link rel="stylesheet" href="' + a + 'assets/css/site.css?v=' + STAMP + '">\n' +
'\n' +
'<!-- Theme before the first paint, and no scroll restoration on reload.\n' +
'     Both have to be inline and in the head: read the saved theme any later\n' +
'     and anyone on dark gets a white flash, and a restored scroll position a\n' +
'     few pixels down the page lands with the nav already collapsed. -->\n' +
'<script>\n' +
'(function () {\n' +
'  try {\n' +
'    var t = localStorage.getItem(\'revhops-theme\');\n' +
'    if (t === \'dark\') document.documentElement.setAttribute(\'data-theme\', \'dark\');\n' +
'  } catch (e) { /* private mode: light theme, no toggle memory, nothing breaks */ }\n' +
'\n' +
'  if (\'scrollRestoration\' in history && !location.hash) {\n' +
'    history.scrollRestoration = \'manual\';\n' +
'  }\n' +
'})();\n' +
'</script>\n' +
'\n' +
'<!-- HubSpot tracking, portal 46722926. Async and deferred, so it never\n' +
'     blocks the first paint. Goes in the head of every public page. -->\n' +
'<script type="text/javascript" id="hs-script-loader" async defer src="//js.hs-scripts.com/46722926.js"></script>\n' +
'</head>\n' +
'<body>\n';
}

function nav(p) {
  var a = up(p.depth);
  var links = NAV_ITEMS.map(function (item) {
    var current = item[0] === p.navCurrent ? ' aria-current="page"' : '';
    return '      <a href="' + item[0] + '"' + current + '>' + item[1] + '</a>';
  }).join('\n');

  return '\n<!-- ============================= NAV =============================\n' +
'     Identical on every page. Two states: transparent at rest so the header\n' +
'     circle runs through it, a floating navy bar once [data-nav-clear] has\n' +
'     scrolled past. Generated — edit NAV_ITEMS in tools/build-pages.js. -->\n' +
'<header class="nav" data-nav>\n' +
'  <div class="shell nav-inner">\n' +
'    <a class="brand" href="/" aria-label="RevHops home">\n' +
'      <img class="brand-base" src="' + a + 'assets/img/revhops-logo.png" alt="revhops">\n' +
'      <img class="brand-alt" src="' + a + 'assets/img/revhops-logo-white.png" alt="" aria-hidden="true">\n' +
'    </a>\n' +
'    <nav class="nav-links" data-nav-links aria-label="Primary">\n' +
links + '\n' +
'    </nav>\n' +
'    <div class="nav-cta">\n' +
'      <button class="theme-toggle" data-theme-toggle type="button"\n' +
'              aria-pressed="false" aria-label="Switch to the dark theme">\n' +
'        <svg class="theme-sun" viewBox="0 0 24 24" aria-hidden="true">\n' +
'          <circle cx="12" cy="12" r="4.2"/>\n' +
'          <path d="M12 2.2v2.4M12 19.4v2.4M4.1 4.1l1.7 1.7M18.2 18.2l1.7 1.7M2.2 12h2.4M19.4 12h2.4M4.1 19.9l1.7-1.7M18.2 5.8l1.7-1.7"/>\n' +
'        </svg>\n' +
'        <svg class="theme-moon" viewBox="0 0 24 24" aria-hidden="true">\n' +
'          <path d="M20.1 14.6A8.4 8.4 0 0 1 9.4 3.9a8.4 8.4 0 1 0 10.7 10.7z"/>\n' +
'        </svg>\n' +
'      </button>\n' +
'      <a class="btn btn-primary" href="/call">Schedule a call</a>\n' +
'      <button class="nav-toggle" data-nav-toggle aria-expanded="false" aria-label="Menu"><span></span></button>\n' +
'    </div>\n' +
'  </div>\n' +
'</header>\n';
}

/* The opening band on every page below the homepage: type left, artwork
   running off the right edge of the screen. It replaced .page-head, which
   was a headline in two thirds of the width with a 900px gradient circle
   filling the rest and 741px of height to hold it.

   No gradient circle here or anywhere else on these pages. The disc is the
   homepage's device now, and having it on twenty other pages made it
   wallpaper.

   `media` is an {src, alt} pair; `mark: true` on it contains the artwork
   instead of cropping it, for the Platinum badge. `meta` is a list of
   [label, value] pairs — the two or three facts worth putting at the top of
   the page. `plain` drops the artwork column entirely, for the legal pages. */
function pageHero(p) {
  var a = up(p.depth);
  var m = p.media;

  var meta = p.meta
    ? '        <dl class="hero-meta">\n' +
      p.meta.map(function (row) {
        return '          <div><dt>' + row[0] + '</dt><dd>' + row[1] + '</dd></div>';
      }).join('\n') + '\n        </dl>\n'
    : '';

  var buttons = p.headButtons
    ? '        <div class="btn-row">\n' + p.headButtons + '\n        </div>\n'
    : '';

  var media = m
    ? '      <div class="page-hero-media' + (m.mark ? ' is-mark' : '') + '">\n' +
      '        <img src="' + a + m.src + '" alt="' + m.alt + '"' + (m.alt ? '' : ' aria-hidden="true"') + '>\n' +
      '      </div>\n'
    : '';

  return '\n<!-- ===================== HERO =====================\n' +
'     Type left, artwork bleeding off the right edge. .page-head-end is the\n' +
'     zero-height sentinel the nav watches to decide when to collapse. -->\n' +
'<section class="page-hero' + (p.media ? '' : ' page-hero-plain') + '">\n' +
'  <div class="shell">\n' +
'    <div class="page-hero-inner">\n' +
'      <div class="page-hero-text">\n' +
'        <h1 class="h1">' + p.h1 + '</h1>\n' +
'        <p class="lede">' + p.lede + '</p>\n' +
buttons +
meta +
'      </div>\n' +
'    </div>\n' +
media +
'  </div>\n' +
'  <div class="page-head-end" data-nav-clear></div>\n' +
'</section>\n';
}

/* The close. Same on every page: the artwork spans up into whatever is above
   it, which is why the section before this one carries .to-white. */
function closePanel() {
  return '\n<!-- ===================== NEXT STEPS =====================\n' +
'     The page\'s closing full stop. Pulled up over the section above by\n' +
'     --start-bleed, which is why that section drifts to white. -->\n' +
'<section class="section start-section">\n' +
'  <div class="start-wide reveal">\n' +
'    <h2 class="start-shout">Ready to hop <br>with RevHops?</h2>\n' +
'    <a class="btn btn-primary btn-lg" href="/call">Schedule a discovery call</a>\n' +
'  </div>\n' +
'</section>\n';
}

function footer(p) {
  var a = up(p.depth);
  return '\n<!-- ============================= FOOTER ============================= -->\n' +
'<footer class="footer">\n' +
'  <div class="shell">\n' +
'\n' +
'    <div class="footer-top">\n' +
'\n' +
'      <div class="footer-brand">\n' +
'        <img class="footer-mark" src="' + a + 'assets/img/revhops-logo-white.png" alt="revhops">\n' +
'        <p class="footer-pitch">Revenue operations for teams that needed it fixed last quarter.</p>\n' +
'        <a class="footer-mail" href="mailto:team@revhops.com">team@revhops.com</a>\n' +
'        <p class="footer-place">Phoenix, Arizona</p>\n' +
'      </div>\n' +
'\n' +
'      <nav class="footer-links" aria-label="Footer">\n' +
'        <div>\n' +
'          <h4>Services</h4>\n' +
'          <ul class="stack gap-8">\n' +
'            <li><a href="/services/solution-design">Solution design</a></li>\n' +
'            <li><a href="/services/crm-implementations">CRM implementations</a></li>\n' +
'            <li><a href="/services/hubspot-support-retainers">HubSpot support retainers</a></li>\n' +
'            <li><a href="/services/revops-consulting">RevOps consulting</a></li>\n' +
'            <li><a href="/services/lead-to-cash-process-mapping">Lead to cash mapping</a></li>\n' +
'          </ul>\n' +
'        </div>\n' +
'        <div>\n' +
'          <h4>Company</h4>\n' +
'          <ul class="stack gap-8">\n' +
'            <li><a href="/case-studies">Case studies</a></li>\n' +
'            <li><a href="/hubspot">HubSpot</a></li>\n' +
'            <li><a href="/about-us">About us</a></li>\n' +
'            <li><a href="/pricing">Pricing</a></li>\n' +
'            <li><a href="/contact">Contact</a></li>\n' +
'          </ul>\n' +
'        </div>\n' +
'      </nav>\n' +
'\n' +
'      <!-- Reversed Platinum badge, sized to the height of the link columns\n' +
'           beside it. HubSpot\'s own white artwork, so it needs no chip and no\n' +
'           filter: 0% of its ink falls under 3:1 on the navy. -->\n' +
'      <div class="footer-badges">\n' +
'        <a href="https://ecosystem.hubspot.com/marketplace/solutions/revhops"\n' +
'           target="_blank" rel="noopener"\n' +
'           aria-label="RevHops on the HubSpot partner directory">\n' +
'          <img src="' + a + 'assets/img/hubspot-platinum-badge-white.webp"\n' +
'               alt="HubSpot Platinum Solutions Partner" loading="lazy">\n' +
'        </a>\n' +
'      </div>\n' +
'\n' +
'    </div>\n' +
'\n' +
'    <div class="footer-bottom">\n' +
'      <span>&copy; <span data-year>2026</span> RevHops. All rights reserved.</span>\n' +
'      <span class="footer-legal">\n' +
'        <a href="/terms">Terms of Service</a>\n' +
'        <a href="/privacy">Privacy Policy</a>\n' +
'        <a href="' + a + 'llms.txt">LLMs.txt</a>\n' +
'      </span>\n' +
'    </div>\n' +
'\n' +
'  </div>\n' +
'</footer>\n';
}

function tail(p) {
  var a = up(p.depth);
  return '\n<button class="to-top" data-to-top type="button" aria-label="Back to top">\n' +
'  <svg viewBox="0 0 24 24" aria-hidden="true" stroke-linecap="round" stroke-linejoin="round">\n' +
'    <path d="M12 19V5M5 12l7-7 7 7"/>\n' +
'  </svg>\n' +
'</button>\n' +
'\n' +
'<script src="' + a + 'assets/js/site.js?v=' + STAMP + '"></script>\n' +
'</body>\n' +
'</html>\n';
}

/* ---------- assembly ----------------------------------------------------- */

/* Root-absolute links (`/services`) only resolve correctly when the site sits
   at the root of a domain. On a GitHub Pages project URL it sits one folder
   down — https://ricksjrr.github.io/revhops.com/ — and `/services` points at
   the top of github.io instead, which 404s.

   So every internal link is written root-absolute in the content above,
   because that is what is readable, and rewritten to a relative one here:

       depth 0   href="/pricing"   ->  href="pricing"
       depth 1   href="/pricing"   ->  href="../pricing"
       depth 0   href="/"          ->  href="./"
       depth 1   href="/"          ->  href="../"

   Relative links resolve against whatever the site is served from, so the
   same file works at ricksjrr.github.io/revhops.com/, at revhops.com, and
   from tools/serve.js. They stay extensionless: GitHub Pages serves
   pricing.html for /pricing, so the address bar keeps the clean URL.

   The depth-1 pages are served at /services/ and /services/solution-design,
   and in both cases the browser resolves `../` against /services/, so one
   rule covers the index and the detail pages alike.

   Left alone: anything external, a mailto, a bare fragment, and the asset
   paths, which were already relative and depth-correct.

   site.js resolves nav hrefs with `new URL(href, location.href)` before it
   compares them, so aria-current keeps working with either form. */
function relativise(html, depth) {
  var prefix = depth === 0 ? '' : '../'.repeat(depth);
  return html
    .replace(/href="\/"/g, 'href="' + (prefix || './') + '"')
    .replace(/href="\/(?!\/)([^"]*)"/g, 'href="' + prefix + '$1"');
}

function render(p) {
  return relativise(
    head(p) +
    nav(p) +
    '\n<main>\n' +
    (p.bare ? '' : (p.hero || pageHero(p))) +
    p.body +
    (p.noClose ? '' : closePanel()) +
    '\n</main>\n' +
    footer(p) +
    tail(p),
    p.depth);
}

module.exports = { render: render, up: up, STAMP: STAMP, ROOT: ROOT };

/* ==========================================================================
   CONTENT
   Everything below is the pages themselves. Small helpers first, then the
   data the service and case study pages are generated from, then PAGES.
   ========================================================================== */

/* A section head. `sub` is optional; `cls` takes reveal-left where the head
   sits beside something. Highlight one phrase per page and no more — the
   marker stops meaning anything the moment there are three of them. */
function secHead(title, sub, cls) {
  /* left by default on these pages: a centred title over a left-aligned card
     grid is what made them read as unrelated stacked blocks. Pass 'centred'
     for the few places the content under it is centred too. */
  var align = cls === 'centred' ? '' : ' sec-head-left';
  if (cls === 'centred') cls = '';
  return '    <div class="sec-head' + align + ' reveal' + (cls ? ' ' + cls : '') + '">\n' +
         '      <h2 class="h2">' + title + '</h2>\n' +
         (sub ? '      <p class="sec-sub">' + sub + '</p>\n' : '') +
         '    </div>\n';
}

/* A frosted panel card. `o` takes { n, title, copy, chips, href }.
   These replace the dash lists that were doing all the work before. */
function pcard(o) {
  var tag = o.href ? 'a' : 'div';
  var attrs = o.href ? ' class="pcard reveal" href="' + o.href + '"' : ' class="pcard reveal"';
  return '        <' + tag + attrs + '>\n' +
    (o.n ? '          <span class="pcard-n">' + o.n + '</span>\n' : '') +
    '          <h3 class="pcard-title">' + o.title + '</h3>\n' +
    (o.copy ? '          <p class="pcard-copy">' + o.copy + '</p>\n' : '') +
    (o.chips && o.chips.length
      ? '          <div class="pcard-chips">\n' +
        o.chips.map(function (c) {
          var cls = 'chip' + (o.chipKind ? ' chip-' + o.chipKind : '');
          return '            <span class="' + cls + '">' + c + '</span>';
        }).join('\n') + '\n          </div>\n'
      : '') +
    (o.href ? '          <span class="text-link" style="margin-top:auto">' + (o.link || 'Read more') + ' <span class="arrow">&rarr;</span></span>\n' : '') +
    '        </' + tag + '>';
}

function pcards(list, cls) {
  return '    <div class="pcards' + (cls ? ' ' + cls : '') + '">\n' +
         list.map(pcard).join('\n') + '\n    </div>\n';
}

function ticks(items, cls) {
  return '<ul class="ticks' + (cls ? ' ' + cls : '') + '">\n' +
         items.map(function (t) { return '          <li>' + t + '</li>'; }).join('\n') +
         '\n        </ul>';
}

/* a plain section on paper */
function section(inner, cls) {
  return '\n<section class="' + (cls || 'section') + '">\n' +
         '  <div class="shell">\n' + inner + '  </div>\n' +
         '</section>\n';
}


/* ==========================================================================
   ARTWORK

   Drawn here in SVG from the six brand colours. No photography and no stock:
   the only real image on the site is James's portrait. Each page gets its
   own motif, which is most of what stops twenty pages reading as one
   template with the words swapped.

   Inline rather than files, so the shapes can take page-specific tints
   without a folder of near-identical assets.
   ========================================================================== */

var INK = '#304157', SLATE = '#6B7A93', MIST = '#C6D3E0', WARM = '#F2C39B',
    PAPER = '#FAFAF8', DEEP = '#1C2635';

/* Five overlapping planes, stepping back and to the right. The services
   page: one system, seen in layers. */
function artPlanes(cls) {
  var tints = ['#E9EEF4', '#D9E2EC', '#C6D3E0', '#A9BACD', '#8497AF'];
  var out = '';
  for (var i = 0; i < 5; i++) {
    out += '\n    <rect x="' + (30 + i * 52) + '" y="' + (196 - i * 34) + '" width="300" height="128" rx="10" ' +
           'fill="' + tints[i] + '"/>';
  }
  return '<svg class="page-art ' + (cls || '') + '" viewBox="0 0 620 400" role="img" ' +
         'aria-label="Five layered planes, one system seen in section">' +
         '\n    <circle cx="500" cy="96" r="58" fill="' + WARM + '" opacity=".85"/>' +
         out + '\n  </svg>';
}

/* A field of squares, one warm. The case studies index: a body of work, and
   the one you are about to read. */
function artField(cls, highlight) {
  var out = '', k = 0, hi = highlight === undefined ? 13 : highlight;
  for (var r = 0; r < 5; r++) {
    for (var c = 0; c < 8; c++) {
      var on = k === hi;
      out += '\n    <rect x="' + (14 + c * 76) + '" y="' + (14 + r * 76) + '" width="58" height="58" rx="8" fill="' +
             (on ? WARM : MIST) + '" opacity="' + (on ? '1' : (0.22 + ((r + c) % 4) * 0.13).toFixed(2)) + '"/>';
      k++;
    }
  }
  return '<svg class="page-art ' + (cls || '') + '" viewBox="0 0 620 400" role="img" aria-label="A field of tiles, one picked out">' +
         out + '\n  </svg>';
}

/* Steps climbing left to right, the last one warm. The pricing page. */
function artSteps(cls) {
  var out = '';
  var h = [64, 108, 152, 196, 250];
  for (var i = 0; i < 5; i++) {
    out += '\n    <rect x="' + (26 + i * 116) + '" y="' + (330 - h[i]) + '" width="86" height="' + h[i] + '" rx="8" fill="' +
           (i === 4 ? WARM : MIST) + '" opacity="' + (i === 4 ? '.95' : (0.3 + i * 0.14).toFixed(2)) + '"/>';
  }
  return '<svg class="page-art ' + (cls || '') + '" viewBox="0 0 620 400" role="img" aria-label="Five ascending steps">' +
         out + '\n    <rect x="20" y="336" width="580" height="2" rx="1" fill="' + MIST + '"/>\n  </svg>';
}

/* A poster for a case study card. Five variants so the rail is five
   different pictures rather than the same placeholder five times. The seed
   picks the palette and the shape of the peak, and nothing is random, so a
   card looks the same on every load. */
function artPoster(seed) {
  var schemes = [
    ['#E8EEF5', '#B9C7D8', '#6D7F99', '#304157', WARM],
    ['#EFEAF3', '#C7C2D6', '#7D7897', '#3A3557', '#E9B8C6'],
    ['#E7F1EE', '#B3CFC7', '#6B948A', '#2E4A45', '#EBD79B'],
    ['#F2EDE6', '#D6C7B5', '#9C876C', '#4A3E30', '#B8CBD8'],
    ['#E9EDF2', '#BFC9D6', '#7A879A', '#2A3340', '#F2C39B']
  ];
  var s = schemes[seed % schemes.length];
  var peaks = [
    'M0 300 L150 190 L300 268 L450 150 L600 244 L600 450 L0 450 Z',
    'M0 268 L120 214 L268 160 L420 246 L600 178 L600 450 L0 450 Z',
    'M0 288 L170 168 L330 250 L470 186 L600 262 L600 450 L0 450 Z',
    'M0 250 L140 250 L140 190 L330 190 L330 262 L470 262 L470 206 L600 206 L600 450 L0 450 Z',
    'M0 310 L110 236 L240 292 L390 200 L510 268 L600 224 L600 450 L0 450 Z'
  ];
  var low = [
    'M0 372 L180 330 L340 366 L490 328 L600 358 L600 450 L0 450 Z',
    'M0 358 L160 392 L330 344 L470 384 L600 340 L600 450 L0 450 Z',
    'M0 380 L200 342 L360 380 L520 344 L600 372 L600 450 L0 450 Z',
    'M0 356 L150 356 L150 400 L360 400 L360 350 L600 350 L600 450 L0 450 Z',
    'M0 366 L130 400 L300 352 L450 396 L600 348 L600 450 L0 450 Z'
  ];
  return '<svg class="case-art" viewBox="0 0 600 450" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' +
    '<defs><linearGradient id="cs' + seed + '" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="' + s[0] + '"/><stop offset="1" stop-color="' + s[1] + '"/></linearGradient></defs>' +
    '<rect width="600" height="450" fill="url(#cs' + seed + ')"/>' +
    '<circle cx="' + (430 + seed * 26) + '" cy="' + (118 - seed * 9) + '" r="' + (52 + seed * 5) + '" fill="' + s[4] + '" opacity=".9"/>' +
    '<path d="' + peaks[seed % peaks.length] + '" fill="' + s[2] + '" opacity=".88"/>' +
    '<path d="' + low[seed % low.length] + '" fill="' + s[3] + '"/>' +
    '</svg>';
}

/* ---------- the five services ----------

   Each carries the copy for its own page. `scope` is the in/out pair of
   chip cards, `steps` the numbered cards, `leave` what the client has on
   the last day. None of it is a bullet list any more: the lists were the
   thing that made every inner page look the same. */

var SERVICES = [
  {
    slug: 'solution-design',
    name: 'Solution design',
    time: '2–3 weeks',
    row: 'The plan before the build. Data model, lifecycle, process map and how you will measure it, signed off by the people who have to live with it.',
    h1: 'The plan before the build',
    lede: 'Two or three weeks spent deciding what the system should be, written down and argued over, so the build is execution rather than discovery.',
    title: 'Solution design — RevHops',
    desc: 'A written specification for your revenue system: data model, lifecycle, process map and reporting, signed off before anyone builds anything.',
    statement: 'A build without a plan is a very expensive draft.',
    prose: [
      'Most failed implementations were not built badly. They were built before anyone agreed what they were for, and the disagreement surfaced in week nine as a change request.',
      'Solution design front-loads that argument. We sit with sales, marketing, finance and whoever else has an opinion, and we do not stop until the object model, the lifecycle and the definition of a qualified lead mean the same thing to all of them.',
      'What comes out is a document. Not a deck.'
    ],
    scope: {
      in:  ['Object and data model', 'Lifecycle stages', 'Pipelines', 'Process map', 'Reporting model', 'Integration plan', 'Build estimate'],
      out: ['The build itself', 'Data cleanup', 'Licence procurement', 'Ongoing admin']
    },
    steps: [
      { n: 'Week one', title: 'Everyone in a room', copy: 'Two workshops with the people who actually work the system, not only the ones who own it. Most of the useful disagreement happens here.' },
      { n: 'Week two', title: 'The model, written down', copy: 'Objects, properties, lifecycle, pipelines and the reports that depend on them. Circulated as a draft, argued with, revised.' },
      { n: 'Week three', title: 'Sign-off and estimate', copy: 'A walkthrough, a decision log and a build estimate that holds because the scope is no longer moving.' }
    ],
    leave: [
      { title: 'A specification', copy: 'Detailed enough to hand to any competent builder. Us included, but you are not obliged to.' },
      { title: 'A decision log', copy: 'Every call and the reason behind it, so in six months nobody has to guess why it works that way.' },
      { title: 'A ranked backlog', copy: 'Split into what ships first and what can wait, sized so you can start on Monday.' }
    ],
    price: ['Starting at $6,500', 'Fixed scope, fixed price'],
    dur: ['2–3 weeks', 'Two workshops, one review'],
    next: ['Usually a build', 'Design does not oblige you to build with us'],
    caseIdx: 0
  },
  {
    slug: 'crm-implementations',
    name: 'CRM implementations',
    time: '6–12 weeks',
    row: 'Portal builds and platform migrations. Built once, documented, and handed over so your team can run it without us.',
    h1: 'Built once and handed over',
    lede: 'Portal builds and platform migrations, done by the people who scoped them, and documented well enough that your team can run the thing without calling us.',
    title: 'CRM implementations — RevHops',
    desc: 'HubSpot portal builds and CRM migrations, scoped and built by the same people, documented and handed over to your team.',
    statement: 'The build is the easy part. The handover is not.',
    prose: [
      'Anyone can stand up a portal. The difference shows four months later, when the person who understood it has moved on and nobody knows why there are two pipelines called Renewals.',
      'So we build in the open. Your admin sits in the working sessions, the naming conventions are written down before the first workflow, and every automation carries a note saying what it is for.',
      'Migrations get the same treatment. Data is mapped, cleaned and reconciled before it moves, and we run both systems side by side until the numbers agree.'
    ],
    scope: {
      in:  ['Portal build', 'Data migration', 'Deduplication', 'Automation', 'Integrations', 'Permissions', 'Dashboards', 'Training', 'Documentation'],
      out: ['Strategy without a spec', 'Custom app development', 'Content production']
    },
    steps: [
      { n: 'Phase one', title: 'Foundations', copy: 'Objects, properties, permissions and naming conventions, agreed and written down before a single workflow exists.' },
      { n: 'Phase two', title: 'Build and migrate', copy: 'Weekly working sessions with your admin in the room. Data is mapped and reconciled before it moves, not after.' },
      { n: 'Phase three', title: 'Parallel running', copy: 'Both systems live until the numbers agree. Nobody switches off the old one on a promise.' },
      { n: 'Phase four', title: 'Handover', copy: 'Recorded training, written documentation, and two weeks of hypercare while your team takes the controls.' }
    ],
    leave: [
      { title: 'A portal your team runs', copy: 'Not one they submit tickets against. That distinction is the whole point of the engagement.' },
      { title: 'Full documentation', copy: 'Every object, workflow and integration, with the reasoning attached rather than just the settings.' },
      { title: 'A list of what we did not build', copy: 'And why. The things deliberately left out are as useful to know as the things shipped.' }
    ],
    price: ['Starting at $18,000', 'Scope-dependent, quoted after design'],
    dur: ['6–12 weeks', 'Weekly working sessions'],
    next: ['Hypercare included', 'Most teams move onto a retainer afterwards'],
    caseIdx: 1
  },
  {
    slug: 'hubspot-support-retainers',
    name: 'HubSpot support retainers',
    time: 'Monthly',
    row: 'A HubSpot admin on call. Roadmap, maintenance, training, and someone who answers when a workflow breaks on a Friday afternoon.',
    h1: 'A HubSpot admin on call',
    lede: 'Roadmap, maintenance, training, and someone who answers when a workflow breaks on a Friday afternoon. Monthly, thirty days notice, no annual lock-in.',
    title: 'HubSpot support retainers — RevHops',
    desc: 'An ongoing HubSpot admin retainer: roadmap, maintenance, training and support from a Platinum Solutions Partner.',
    statement: 'A full-time admin is more than most teams need.',
    prose: [
      'Hiring one means paying for forty hours to get about eight of real work. Not hiring one means the portal slowly rots, because the person who half-knows it has a day job.',
      'A retainer is the middle. A named admin who already knows your portal, a standing roadmap so improvements happen on purpose rather than in a panic, and a channel where a broken workflow gets looked at the same day.',
      'Hours roll over within the quarter. We would rather you spent them well than spent them fast.'
    ],
    scope: {
      in:  ['Build work', 'Break-fix', 'Reporting', 'Data hygiene', 'Integrations', 'Training', 'Roadmap', 'Release reviews'],
      out: ['Net-new implementations', 'Paid media management', 'Content writing']
    },
    steps: [
      { n: 'Every month', title: 'One standing call', copy: 'What shipped, what it cost, what is next. Thirty minutes, and more if a project needs it.' },
      { n: 'Every quarter', title: 'A roadmap review', copy: 'Agreed with you rather than presented to you, and reordered whenever the business moves.' },
      { n: 'Any day', title: 'A channel, not a form', copy: 'Requests go to a shared channel. Anything blocking revenue gets looked at the same day.' }
    ],
    leave: [
      { title: 'A named admin', copy: 'The same person every month, who already knows why your portal is the way it is.' },
      { title: 'Hours that roll', copy: 'Within the quarter, so a quiet month is banked rather than burned on filler.' },
      { title: 'No lock-in', copy: 'Thirty days notice, both ways. Nobody has ever done better work because the client was stuck with them.' }
    ],
    price: ['From $2,500 a month', 'Tiered by hours, not by seats'],
    dur: ['Rolling monthly', 'Thirty days notice either way'],
    next: ['Unused hours roll', 'Within the quarter, so a quiet month is not wasted'],
    caseIdx: 2
  },
  {
    slug: 'revops-consulting',
    name: 'RevOps consulting',
    time: 'Monthly',
    row: 'Someone to think it through with. What the system should be doing, what it is doing instead, and which of those gaps is actually costing you money.',
    h1: 'Someone to think it through with',
    lede: 'What the system should be doing, what it is doing instead, and which of those gaps is actually costing you money. Advice, with no build attached.',
    title: 'RevOps consulting — RevHops',
    desc: 'Fractional revenue operations leadership: strategy, metrics, forecasting and the calls that decide what your system should do next.',
    statement: 'The tool is rarely the actual problem.',
    prose: [
      'Teams call us about HubSpot and end up talking about how deals are qualified, why forecast accuracy is forty percent, or whether the sales team is being measured on something it cannot control.',
      'Consulting is the version of the engagement where that is the whole point. We look at how revenue actually moves through your business, tell you where it leaks, and help you decide what to do about it.',
      'Sometimes the answer is a project. Sometimes it is a conversation with your VP of Sales that nobody has been willing to have.'
    ],
    scope: {
      in:  ['Process review', 'Metric definitions', 'Forecasting', 'Territory design', 'Routing rules', 'Comp mechanics', 'Tooling decisions', 'Quarterly planning'],
      out: ['Build execution', 'Recruitment', 'Board reporting we did not help build']
    },
    steps: [
      { n: 'First month', title: 'Find the leak', copy: 'Where revenue actually stalls, measured against the system rather than against what anyone remembers.' },
      { n: 'Fortnightly', title: 'A standing session', copy: 'With whoever owns revenue. Findings written up rather than left in a call recording.' },
      { n: 'Each quarter', title: 'An order of operations', copy: 'Not a wish list. What to do first, what it costs to keep ignoring the rest.' }
    ],
    leave: [
      { title: 'Definitions everyone shares', copy: 'What a qualified lead is, what stage three means, and what the forecast is actually counting.' },
      { title: 'Written positions', copy: 'Including the ones you disagree with. We will put those in writing too.' },
      { title: 'A plan with an order', copy: 'Sequenced by what unblocks the most, not by what is easiest to sell you.' }
    ],
    price: ['From $3,500 a month', 'Fractional, not full-time'],
    dur: ['Rolling monthly', 'Fortnightly sessions'],
    next: ['Advice, not delivery', 'Build work is scoped and priced on its own'],
    caseIdx: 3
  },
  {
    slug: 'lead-to-cash-process-mapping',
    name: 'Lead to cash process mapping',
    time: '2–3 weeks',
    row: 'Every step from first touch to paid invoice, on one page. Usually the first time anyone has seen the whole thing at once.',
    h1: 'Every step on one page',
    lede: 'First touch to paid invoice, mapped end to end across every team and every system. Usually the first time anyone has seen the whole thing at once.',
    title: 'Lead to cash process mapping — RevHops',
    desc: 'A single map of your revenue process from first touch to paid invoice, with the handoffs, gaps and duplicated work marked on it.',
    statement: 'Everyone owns a piece. Nobody owns the seams.',
    prose: [
      'Marketing knows its half. Sales knows its half. Finance knows what arrives in the billing system and has opinions about how it got there. The seams between them are where deals stall, and they are the part nobody has drawn.',
      'We interview each team, then follow real records through the systems rather than the process anyone describes, because those are rarely the same thing.',
      'The map is usually uncomfortable. That is the useful part.'
    ],
    scope: {
      in:  ['Team interviews', 'Record tracing', 'Handoff mapping', 'Stall measurement', 'Manual step audit', 'Shadow spreadsheets', 'Ranked fixes'],
      out: ['Building the fixes', 'System configuration', 'Change management delivery']
    },
    steps: [
      { n: 'Step one', title: 'Ask every team', copy: 'Marketing, sales, CS and finance, separately. The gaps between the four accounts are the first finding.' },
      { n: 'Step two', title: 'Follow real records', copy: 'Actual deals through actual systems, timed. Where they sit, for how long, and what unsticks them.' },
      { n: 'Step three', title: 'Draw the whole thing', copy: 'One page, every handoff, owner and system of record marked, including the spreadsheets holding it together.' }
    ],
    leave: [
      { title: 'The map', copy: 'As a working file you can keep editing, not a PDF that is out of date by the time it is read.' },
      { title: 'Measured stalls', copy: 'Where records sit and for how long, in days rather than in adjectives.' },
      { title: 'A ranked fix list', copy: 'Cheapest and highest impact first, with what it costs to leave each one alone.' }
    ],
    price: ['Starting at $4,500', 'Fixed scope, fixed price'],
    dur: ['2–3 weeks', 'Interviews, then one findings session'],
    next: ['Stands alone', 'Often the first step before a design engagement'],
    caseIdx: 4
  }
];

/* ---------- the five case studies, all placeholder ---------- */

var CASES = [
  { slug: 'case-study-one',   n: 'one',   figs: [['00', '%'], ['00', 'x']] },
  { slug: 'case-study-two',   n: 'two',   figs: [['00', '%'], ['00', 'h']] },
  { slug: 'case-study-three', n: 'three', figs: [['00', '%'], ['00', 'k']] },
  { slug: 'case-study-four',  n: 'four',  figs: [['00', '%'], ['00', 'd']] },
  { slug: 'case-study-five',  n: 'five',  figs: [['00', 'k'], ['00', 'x']] }
];

/* the client marquee, straight off the homepage. Both runs must stay
   identical or the seam jumps. */
function logoBand(depth) {
  var a = up(depth);
  var names = [['dg', 'DG'], ['woodside-homes', 'Woodside Homes'], ['core-income', 'Core Income'],
               ['ignite-group', 'Ignite Group'], ['key-tree', ''], ['cialdini-institute', 'Cialdini Institute'],
               ['casadomaine', 'Casadomaine Custom Homes'], ['financial-lease', 'Financial Lease'],
               ['inbox-storage', 'Inbox Storage']];
  return '\n<section class="logo-band" aria-label="Clients we have worked with" style="--proof-lead:clamp(18px,2.4vw,40px)">\n' +
'  <div class="logo-rail">\n' +
    [0, 1].map(function (copy) {
      return '    <ul class="logo-run"' + (copy ? ' aria-hidden="true"' : '') + '>\n' +
        names.map(function (n) {
          return '      <li><img src="' + a + 'assets/img/logos/' + n[0] + '.webp" alt="' +
                 (copy ? '' : n[1]) + '"' + (n[0] === 'ignite-group' ? ' data-solid' : '') + ' loading="lazy"></li>';
        }).join('\n') + '\n    </ul>';
    }).join('\n') + '\n' +
'  </div>\n' +
'</section>\n';
}

/* one poster card off the homepage rail */
function caseCard(c, depth, cls) {
  return '<a class="case-card' + (cls ? ' ' + cls : '') + '" href="' + '/case-studies/' + c.slug + '">\n' +
    '          ' + artPoster(CASES.indexOf(c)) + '\n' +
    '          <div class="case-body">\n' +
    '            <div class="case-text">\n' +
    '              <h3 class="case-title">[Client name]</h3>\n' +
    '              <div class="case-figs">\n' +
    '                <span class="case-fig"><b>' + c.figs[0][0] + c.figs[0][1] + '</b><span>[measure]</span></span>\n' +
    '                <span class="case-fig"><b>' + c.figs[1][0] + c.figs[1][1] + '</b><span>[measure]</span></span>\n' +
    '              </div>\n' +
    '            </div>\n' +
    '            <span class="case-go" aria-hidden="true">&rarr;</span>\n' +
    '          </div>\n' +
    '        </a>';
}

/* ---------- one service page ----------
   Seven sections, and no two of them the same shape: a statement over two
   columns of prose, a pair of scope cards, the numbered run of the
   engagement, what you leave with, one poster card, the price, and the two
   services people usually pair it with. */

function servicePage(s, i) {
  var kase = CASES[s.caseIdx];
  var other = SERVICES.filter(function (x) { return x.slug !== s.slug; }).slice(0, 2);
  var body = '';

  /* the argument, set large, with the detail beside it */
  body += section(
'    <div class="split" style="align-items:start">\n' +
'      <p class="statement reveal reveal-left">' + s.statement + '</p>\n' +
'      <div class="cols-2 reveal reveal-right">\n' +
      s.prose.map(function (t) { return '        <p>' + t + '</p>'; }).join('\n') + '\n' +
'      </div>\n' +
'    </div>\n');

  /* what is and is not in it */
  body += section(
    secHead('What is <span class="hl">in it</span>, and what is not') +
'    <div style="margin-top:clamp(22px,2.6vw,34px)">\n' +
    pcards([
      { title: 'In scope', copy: 'Everything below is part of the engagement and part of the price.',
        chips: s.scope.in, chipKind: 'have' },
      { title: 'Not in scope', copy: 'Quoted separately if you want it, and named here so it is never a surprise.',
        chips: s.scope.out, chipKind: 'missing' }
    ], 'pcards-2') +
'    </div>\n', 'section-tight');

  /* how it runs */
  body += section(
    secHead('How it runs') +
'    <div style="margin-top:clamp(22px,2.6vw,34px)">\n' +
    pcards(s.steps.map(function (st) {
      return { n: st.n, title: st.title, copy: st.copy };
    })) +
'    </div>\n', 'section-tight');

  /* what you leave with */
  body += section(
    secHead('What you have on the last day') +
'    <div style="margin-top:clamp(22px,2.6vw,34px)">\n' +
    pcards(s.leave) +
'    </div>\n', 'section-tight');

  /* one case study */
  body += section(
'    <div class="split" style="align-items:center">\n' +
'      ' + caseCard(kase, 1, 'reveal reveal-left') + '\n' +
'      <div class="stack gap-20 reveal reveal-right">\n' +
'        <h2 class="h2">One that went the way it should</h2>\n' +
'        <p class="small">[One paragraph on the client: what they sold, how big the team was, and\n' +
'          what state the system was in when they called.]</p>\n' +
'        <p class="small">[One paragraph on what this service changed for them, and the number that\n' +
'          moved because of it.]</p>\n' +
'        <a class="text-link" href="/case-studies/' + kase.slug + '">Read the story <span class="arrow">&rarr;</span></a>\n' +
'      </div>\n' +
'    </div>\n', 'section-tight');

  /* the price, then where to go next */
  body += section(
    secHead('What it costs') +
'    <div class="price-teaser reveal" style="margin-top:clamp(22px,2.6vw,34px)">\n' +
'      <div class="price-teaser-cell">\n' +
'        <span class="price-teaser-label">Price</span>\n' +
'        <span class="price-teaser-fig">' + s.price[0] + '</span>\n' +
'        <p class="price-teaser-note">' + s.price[1] + '</p>\n' +
'      </div>\n' +
'      <div class="price-teaser-cell">\n' +
'        <span class="price-teaser-label">Timeline</span>\n' +
'        <span class="price-teaser-fig">' + s.dur[0] + '</span>\n' +
'        <p class="price-teaser-note">' + s.dur[1] + '</p>\n' +
'      </div>\n' +
'      <div class="price-teaser-cell">\n' +
'        <span class="price-teaser-label">' + s.next[0] + '</span>\n' +
'        <span class="price-teaser-fig">&mdash;</span>\n' +
'        <p class="price-teaser-note">' + s.next[1] + '</p>\n' +
'      </div>\n' +
'    </div>\n' +
'    <p class="small muted reveal" style="margin-top:18px;max-width:62ch">A starting point, not a\n' +
'      quote. The full range is on the <a href="/pricing">pricing page</a>, and the real figure\n' +
'      comes out of the first call.</p>\n' +
'\n' +
'    <div class="stack gap-16 reveal" style="margin-top:clamp(38px,4.5vw,64px)">\n' +
'      <p class="label">Often paired with</p>\n' +
'      <div class="svc-list svc-list-plain">\n' +
      other.map(function (o) {
        return '        <a class="svc-row" href="/services/' + o.slug + '">\n' +
               '          <h3 class="svc-title">' + o.name + '</h3>\n' +
               '          <p class="svc-copy">' + o.row + '</p>\n' +
               '          <span class="svc-go">Read more <span class="arrow">&rarr;</span></span>\n' +
               '        </a>';
      }).join('\n') + '\n' +
'      </div>\n' +
'    </div>\n', 'section-tight to-white');

  return {
    file: 'services/' + s.slug + '.html',
    depth: 1,
    navCurrent: '/services',
    title: s.title,
    description: s.desc,
    h1: s.h1,
    lede: s.lede,
    media: { src: 'assets/img/case-study-placeholder.svg', alt: '' },
    meta: [['Timeline', s.time], ['From', s.price[0].replace(/^(Starting at |From )/, '')]],
    headButtons: '          <a class="btn btn-primary" href="/call">Schedule a call</a>\n' +
                 '          <a class="text-link" href="/services">All services <span class="arrow">&rarr;</span></a>',
    body: body
  };
}

/* ---------- one case study page ----------
   Deliberately unlike the rest of the site: a navy band of three counted
   figures under the hero, the story in three alternating moves, a centred
   pull quote, then what it took. */

function casePage(c, i) {
  var used = [SERVICES[i % SERVICES.length], SERVICES[(i + 2) % SERVICES.length]];
  var body = '';

  body += '\n<section class="section surface-navy">\n' +
'  <div class="shell">\n' +
'    <div class="figs reveal">\n' +
'      <div class="fig"><b><span data-count="' + c.figs[0][0] + '" data-suffix="' + c.figs[0][1] + '">' + c.figs[0][0] + c.figs[0][1] + '</span></b><span>[what this figure measures]</span></div>\n' +
'      <div class="fig"><b><span data-count="' + c.figs[1][0] + '" data-suffix="' + c.figs[1][1] + '">' + c.figs[1][0] + c.figs[1][1] + '</span></b><span>[what this figure measures]</span></div>\n' +
'      <div class="fig"><b><span data-count="00" data-suffix="%">00%</span></b><span>[what this figure measures]</span></div>\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n';

  body += section(
'    <div class="split" style="align-items:center">\n' +
'      <div class="stack gap-20 reveal reveal-left">\n' +
'        <h2 class="h2">Where they <span class="hl">started</span></h2>\n' +
'        <p class="small">[What the business does, how many people sell for it, and what the revenue\n' +
'          system looked like on the day they called. Name the thing that finally made them pick up\n' +
'          the phone.]</p>\n' +
'        <p class="small">[The symptom everyone could see, and the cause nobody had gone looking\n' +
'          for.]</p>\n' +
'      </div>\n' +
'      <img class="reveal reveal-right" src="../assets/img/case-study-placeholder.svg" alt=""\n' +
'           style="border-radius:var(--radius-card)" loading="lazy">\n' +
'    </div>\n');

  body += section(
    secHead('What we built') +
'    <div style="margin-top:clamp(22px,2.6vw,34px)">\n' +
    pcards([
      { n: 'Phase one', title: '[The first thing]', copy: '[What was scoped and why it went first.]', chips: ['[system]', '[team]'] },
      { n: 'Phase two', title: '[The second thing]', copy: '[What it replaced, and what stopped being manual.]', chips: ['[system]', '[team]'] },
      { n: 'Phase three', title: '[The third thing]', copy: '[The part that was harder than expected, and the decision that settled it.]', chips: ['[system]', '[team]'] }
    ]) +
'    </div>\n', 'section-tight');

  body += section(
'    <div class="split" style="align-items:center">\n' +
'      <img class="reveal reveal-left" src="../assets/img/case-study-placeholder.svg" alt=""\n' +
'           style="border-radius:var(--radius-card)" loading="lazy">\n' +
'      <div class="stack gap-20 reveal reveal-right">\n' +
'        <h2 class="h2">What changed</h2>\n' +
'        <p class="small">[What is different now, in the terms the client would use rather than the\n' +
'          ones we would. If something did not work, say that too.]</p>\n' +
'        <p class="small">[What the team can now do for itself, and what stopped being anyone\'s\n' +
'          job.]</p>\n' +
'      </div>\n' +
'    </div>\n', 'section-tight');

  body += '\n<section class="section-tight">\n' +
'  <div class="shell">\n' +
'    <blockquote class="quote reveal" style="max-width:62ch;margin-inline:auto;text-align:center">\n' +
'      <p>[One quotation from the person who signed it off. Two or three sentences, in their words,\n' +
'        not ours.]</p>\n' +
'      <footer class="quote-by" style="justify-content:center">\n' +
'        <div class="stars" role="img" aria-label="Five out of five">\n' +
      new Array(6).join('x').split('x').slice(0, 5).map(function () {
        return '          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z"/></svg>';
      }).join('\n') + '\n' +
'        </div>\n' +
'        <cite>[Name] <span class="sep">|</span> [Title]</cite>\n' +
'      </footer>\n' +
'    </blockquote>\n' +
'  </div>\n' +
'</section>\n';

  body += section(
    secHead('The work behind it') +
'    <div class="svc-list svc-list-plain reveal" style="margin-top:clamp(18px,2.2vw,28px)">\n' +
    used.map(function (o) {
      return '      <a class="svc-row" href="/services/' + o.slug + '">\n' +
             '        <h3 class="svc-title">' + o.name + '</h3>\n' +
             '        <p class="svc-copy">' + o.row + '</p>\n' +
             '        <span class="svc-go">Read more <span class="arrow">&rarr;</span></span>\n' +
             '      </a>';
    }).join('\n') + '\n' +
'    </div>\n' +
'    <p class="reveal" style="margin-top:clamp(26px,3vw,40px);text-align:center">\n' +
'      <a class="text-link" href="/case-studies">All case studies <span class="arrow">&rarr;</span></a>\n' +
'    </p>\n', 'section-tight to-white');

  return {
    file: 'case-studies/' + c.slug + '.html',
    depth: 1,
    navCurrent: '/case-studies',
    title: '[Client name] — case study — RevHops',
    description: 'How RevHops rebuilt the revenue system at [client name], and what changed as a result.',
    h1: '[Client name]',
    lede: '[One sentence on what was broken and what it is now. The whole story in a line, so the rest of the page is detail rather than suspense.]',
    media: { src: 'assets/img/case-study-placeholder.svg', alt: '' },
    meta: [['Industry', '[sector]'], ['Engagement', '[service]'], ['Timeline', '[00 weeks]']],
    body: body
  };
}

/* The three homepage quotes, shared with the case studies index. */
var TESTIMONIALS =
'      <div class="testi-col reveal">\n' +
'        <h3 class="testi-title"><span class="q">&ldquo;</span>&thinsp;Superior expertise&thinsp;<span class="q">&rdquo;</span></h3>\n' +
'        <blockquote class="quote">\n' +
'          <p>Our experience working with RevHops to build out specific functionality, reporting,\n' +
'            workflows, sequences and dashboards has exceeded expectations.\n' +
'            <span class="hl">James has taken the time to learn our business model,\n' +
'            understand the complexities and remained confident and transparent</span> on what we can\n' +
'            and cannot do within the platform. Looking forward to continued partnership with\n' +
'            RevHops.</p>\n' +
'          <footer class="quote-by">\n' +
'            <div class="stars" role="img" aria-label="Five out of five">\n' +
'              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z"/></svg>\n' +
'              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z"/></svg>\n' +
'              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z"/></svg>\n' +
'              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z"/></svg>\n' +
'              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z"/></svg>\n' +
'            </div>\n' +
'            <cite>Deborah <span class="sep">|</span> COO</cite>\n' +
'          </footer>\n' +
'        </blockquote>\n' +
'      </div>\n' +
'      <div class="testi-col reveal">\n' +
'        <h3 class="testi-title"><span class="q">&ldquo;</span>&thinsp;Responsive &amp; Thorough&thinsp;<span class="q">&rdquo;</span></h3>\n' +
'        <blockquote class="quote">\n' +
'          <p>We partnered with RevHops on a complex HubSpot Marketing Hub Enterprise implementation, and\n' +
'            the experience was excellent from start to finish. James was highly responsive, extremely\n' +
'            well-organized, and thorough. <span class="hl">RevHops put together a clear, structured\n' +
'            plan, communicated recommendations in a way that was easy to align on</span>, and\n' +
'            followed up proactively to ensure everyone fully understood the strategy and next\n' +
'            steps.</p>\n' +
'          <footer class="quote-by">\n' +
'            <div class="stars" role="img" aria-label="Five out of five">\n' +
'              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z"/></svg>\n' +
'              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z"/></svg>\n' +
'              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z"/></svg>\n' +
'              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z"/></svg>\n' +
'              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z"/></svg>\n' +
'            </div>\n' +
'            <cite>Amy <span class="sep">|</span> VP of Client Services</cite>\n' +
'          </footer>\n' +
'        </blockquote>\n' +
'      </div>\n' +
'      <div class="testi-col reveal">\n' +
'        <h3 class="testi-title"><span class="q">&ldquo;</span>&thinsp;Great team to work with!&thinsp;<span class="q">&rdquo;</span></h3>\n' +
'        <blockquote class="quote">\n' +
'          <p><span class="hl">James set our small company up for success through his proven\n' +
'            process</span> and knowledge of\n' +
'            HubSpot after meeting with key people on my team and then mapping everything out for us\n' +
'            for the first time. His team was organized in their implementation and tracked our\n' +
'            progress throughout the project. We will be using RevHops more in the near future.\n' +
'            Highly recommend!!</p>\n' +
'          <footer class="quote-by">\n' +
'            <div class="stars" role="img" aria-label="Five out of five">\n' +
'              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z"/></svg>\n' +
'              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z"/></svg>\n' +
'              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z"/></svg>\n' +
'              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z"/></svg>\n' +
'              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z"/></svg>\n' +
'            </div>\n' +
'            <cite>Adam <span class="sep">|</span> CEO</cite>\n' +
'          </footer>\n' +
'        </blockquote>\n' +
'      </div>\n';



/* ==========================================================================
   THE STANDALONE PAGES

   Each one is laid out for what it has to do, and no two share a hero. The
   five service pages share a template and the five case studies share
   another, which is right — they are sets. These are not.
   ========================================================================== */

/* ---------- /services ----------
   The hero is type and nothing else, full width, with the five services as
   a numbered index under it. That index is the page's table of contents and
   its artwork at the same time. */

var servicesIndex = {
  file: 'services/index.html',
  depth: 1,
  navCurrent: '/services',
  title: 'RevOps services — RevHops',
  description: 'Solution design, CRM implementations, HubSpot support retainers, RevOps consulting and lead to cash process mapping.',
  hero:
'\n<section class="page-hero page-hero-plain">\n' +
'  <div class="shell">\n' +
'    <div class="g-8-4" style="align-items:end">\n' +
'      <div class="page-hero-text">\n' +
'        <h1 class="h1">Five ways in and one system underneath</h1>\n' +
'        <p class="lede">Most engagements start with one of these and grow into another. You do not\n' +
'          need to know which one you need before the first call.</p>\n' +
'      </div>\n' +
'      <div class="hero-index">\n' +
        SERVICES.map(function (s, i) {
          return '        <a href="/services/' + s.slug + '">\n' +
                 '          <b>' + ('0' + (i + 1)) + '</b>\n' +
                 '          <span>' + s.name + '</span>\n' +
                 '          <i>' + s.time + '</i>\n' +
                 '        </a>';
        }).join('\n') + '\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'  <div class="page-head-end" data-nav-clear></div>\n' +
'</section>\n',
  body:
    section(
'    <div class="marker reveal">\n' +
'      <b>The work</b>\n' +
'      <h2 class="h2">RevOps services that scale with you, <span class="hl">wherever you\'re at</span></h2>\n' +
'    </div>\n' +
'    <div class="svc-list">\n' +
      SERVICES.map(function (s) {
        return '      <a class="svc-row reveal" href="/services/' + s.slug + '">\n' +
               '        <h3 class="svc-title">' + s.name + '</h3>\n' +
               '        <span class="svc-time">' + s.time + '</span>\n' +
               '        <p class="svc-copy">' + s.row + '</p>\n' +
               '        <span class="svc-go">Read more <span class="arrow">&rarr;</span></span>\n' +
               '      </a>';
      }).join('\n') + '\n' +
'    </div>\n') +
'\n<!-- the page\'s one loud moment: white on navy, edge to edge, no cards -->\n' +
'<section class="section band">\n' +
'  <div class="shell">\n' +
'    <div class="g-4-8" style="align-items:start">\n' +
'      <h2 class="h2 reveal" style="max-width:14ch">True of all five</h2>\n' +
'      <div class="qcols reveal">\n' +
      [['Same people', 'The person who scopes it does the work. Nobody is handed to whoever is free that month.'],
       ['Written first', 'Scope is a document you approve, not a conversation someone half remembers.'],
       ['Documented out', 'Every engagement ends with something your team can run without calling us.'],
       ['Told the truth', 'Including when the thing you asked for is not the thing you need.']].map(function (c, i) {
        return '        <div class="qcol" style="border-top-color:rgba(250,250,248,.5)">\n' +
               '          <span class="qcol-n" style="color:var(--on-navy-faint)">' + ('0' + (i + 1)) + '</span>\n' +
               '          <h3 class="qcol-t" style="color:var(--paper)">' + c[0] + '</h3>\n' +
               '          <p class="qcol-c" style="color:var(--on-navy)">' + c[1] + '</p>\n' +
               '        </div>';
      }).join('\n') + '\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n' +
    section(
'    <div class="g-5-7" style="align-items:center">\n' +
'      <div class="reveal reveal-left">\n' +
'        <p class="statement">There is no discovery phase where nothing happens.</p>\n' +
'        <p class="statement-note">The first call is a working session, and by the end of it you\n' +
'          will know whether we are the right people for the job. That is not always yes, and we\n' +
'          would rather say so on day one than in month four.</p>\n' +
'        <p style="margin-top:22px"><a class="text-link" href="/pricing">What all of this costs <span class="arrow">&rarr;</span></a></p>\n' +
'      </div>\n' +
'      <div class="reveal reveal-right">' + artPlanes() + '</div>\n' +
'    </div>\n') +
    logoBand(1)
};

/* ---------- /case-studies ----------
   Headline straight into a navy band of aggregate figures, then a filter
   and a grid. No hero artwork: the posters are the artwork, and there are
   five different ones. */

var caseIndex = {
  file: 'case-studies/index.html',
  depth: 1,
  navCurrent: '/case-studies',
  title: 'Case studies — RevHops',
  description: 'Revenue operations work we have done, what it changed, and what the clients said about it.',
  hero:
'\n<section class="page-hero page-hero-plain" style="padding-bottom:clamp(26px,3vw,44px)">\n' +
'  <div class="shell">\n' +
'    <div class="g-7-5" style="align-items:end">\n' +
'      <div class="page-hero-text">\n' +
'        <h1 class="h1">Proof beats a pitch deck</h1>\n' +
'        <p class="lede">Five engagements, what was broken when we arrived, and what the numbers did\n' +
'          afterwards. The awkward ones are in here too.</p>\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'  <div class="page-head-end" data-nav-clear></div>\n' +
'</section>\n' +
'\n<section class="section band" style="padding-block:clamp(40px,5vw,72px)">\n' +
'  <div class="shell">\n' +
'    <div class="figs reveal">\n' +
'      <div class="fig"><b><span data-count="00" data-suffix="">00</span></b><span>Engagements shipped</span></div>\n' +
'      <div class="fig"><b><span data-count="00" data-suffix="%">00%</span></b><span>[aggregate measure across the five]</span></div>\n' +
'      <div class="fig"><b><span data-count="00" data-suffix="">00</span></b><span>[aggregate measure across the five]</span></div>\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n',
  body:
    section(
'    <div class="marker reveal" style="flex-wrap:wrap;gap:14px 22px">\n' +
'      <b>The work</b>\n' +
'      <h2 class="h2" style="flex:1 1 16ch">We\'ve hopped with <span class="hl">some of the best</span></h2>\n' +
'    </div>\n' +
'    <div class="filters reveal" style="margin-bottom:clamp(22px,2.6vw,34px)" role="group" aria-label="Filter case studies">\n' +
'      <button class="filter" type="button" data-filter="all" aria-pressed="true">Everything</button>\n' +
      SERVICES.map(function (s) {
        return '      <button class="filter" type="button" data-filter="' + s.slug + '" aria-pressed="false">' + s.name + '</button>';
      }).join('\n') + '\n' +
'      <span class="filter-count" data-filter-count aria-live="polite"></span>\n' +
'    </div>\n' +
'    <div class="case-grid" data-filter-grid>\n' +
      CASES.map(function (c, i) {
        var tags = [SERVICES[i % SERVICES.length].slug, SERVICES[(i + 2) % SERVICES.length].slug].join(' ');
        return '      ' + caseCard(c, 1, 'reveal').replace('<a class="case-card reveal"', '<a class="case-card reveal" data-tags="' + tags + '"');
      }).join('\n') + '\n' +
'    </div>\n') +
'\n<section class="section-tight testi-section">\n' +
'  <div class="shell">\n' +
'    <h2 class="sr-only">What clients say about working with us</h2>\n' +
'    <div class="testi">\n' + TESTIMONIALS + '    </div>\n' +
'  </div>\n' +
'</section>\n'
};

/* ---------- /pricing ----------
   The only centred hero on the site, because a price list is read down the
   middle. Rows rather than cards: this is a table of numbers and it should
   look like one. */

var pricing = {
  file: 'pricing.html',
  depth: 0,
  navCurrent: '/pricing',
  title: 'Pricing — RevHops',
  description: 'What RevOps work with RevHops costs: project pricing for design, mapping and implementation, monthly pricing for retainers and consulting.',
  hero:
'\n<section class="page-hero page-hero-plain">\n' +
'  <div class="shell">\n' +
'    <div class="page-hero-text" style="align-items:center;text-align:center;max-width:24ch;margin-inline:auto">\n' +
'      <h1 class="h1">What it costs before we talk</h1>\n' +
'    </div>\n' +
'    <p class="lede" style="text-align:center;margin-inline:auto;margin-top:18px;max-width:56ch">Published,\n' +
'      because chasing an agency for a number is a waste of everyone\'s afternoon. These are starting\n' +
'      points, and we will tell you on the first call if you are about to overspend.</p>\n' +
'    <div style="max-width:420px;margin:clamp(26px,3.4vw,48px) auto 0">' + artSteps() + '</div>\n' +
'  </div>\n' +
'  <div class="page-head-end" data-nav-clear></div>\n' +
'</section>\n',
  body:
    section(
'    <div class="marker reveal"><b>Project work</b><h2 class="h2">Fixed scope, <span class="hl">fixed price</span></h2></div>\n' +
'    <div class="qrows">\n' +
      [SERVICES[0], SERVICES[4], SERVICES[1]].map(function (s) {
        return '      <div class="qrow reveal">\n' +
               '        <span class="qrow-n">' + s.dur[0] + '</span>\n' +
               '        <div class="qrow-b">\n' +
               '          <div class="g-7-5" style="gap:clamp(12px,2vw,32px);align-items:baseline">\n' +
               '            <h3 class="qrow-t">' + s.name + '</h3>\n' +
               '            <span class="price-teaser-fig" style="font-size:clamp(1.3rem,1rem + 1vw,1.8rem)">' + s.price[0].replace('Starting at ', '') + '</span>\n' +
               '          </div>\n' +
               '          <p class="qrow-c">' + s.row + '</p>\n' +
               '          <a class="text-link" href="/services/' + s.slug + '">What is in it <span class="arrow">&rarr;</span></a>\n' +
               '        </div>\n' +
               '      </div>';
      }).join('\n') + '\n' +
'    </div>\n' +
'\n' +
'    <div class="marker reveal" style="margin-top:clamp(48px,5.5vw,86px)"><b>Monthly</b><h2 class="h2">No lock-in, thirty days notice</h2></div>\n' +
'    <div class="qrows">\n' +
      [SERVICES[2], SERVICES[3]].map(function (s) {
        return '      <div class="qrow reveal">\n' +
               '        <span class="qrow-n">Rolling</span>\n' +
               '        <div class="qrow-b">\n' +
               '          <div class="g-7-5" style="gap:clamp(12px,2vw,32px);align-items:baseline">\n' +
               '            <h3 class="qrow-t">' + s.name + '</h3>\n' +
               '            <span class="price-teaser-fig" style="font-size:clamp(1.3rem,1rem + 1vw,1.8rem)">' + s.price[0].replace('From ', '') + '</span>\n' +
               '          </div>\n' +
               '          <p class="qrow-c">' + s.row + '</p>\n' +
               '          <a class="text-link" href="/services/' + s.slug + '">What is in it <span class="arrow">&rarr;</span></a>\n' +
               '        </div>\n' +
               '      </div>';
      }).join('\n') + '\n' +
'      <div class="qrow reveal">\n' +
'        <span class="qrow-n">Ask</span>\n' +
'        <div class="qrow-b">\n' +
'          <h3 class="qrow-t">Something else</h3>\n' +
'          <p class="qrow-c">Audits, one-off training, a second opinion on someone else\'s build.\n' +
'            Smaller pieces get quoted on the call, and we will say if it is not us.</p>\n' +
'        </div>\n' +
'      </div>\n' +
'    </div>\n') +
'\n<section class="section band">\n' +
'  <div class="shell">\n' +
'    <div class="g-4-8" style="align-items:start">\n' +
'      <p class="statement reveal" style="color:var(--paper)">Almost never the software.</p>\n' +
'      <div class="reveal">\n' +
'        <div class="cols-2" style="color:var(--on-navy)">\n' +
'          <p>What moves the price is how many teams have to agree, how much of the data has to be\n' +
'            cleaned before it can move, and how many systems are already holding a version of the\n' +
'            truth.</p>\n' +
'          <p>A twelve-person company with one pipeline and a clean import sits at the bottom of\n' +
'            every range on this page. Four business units, two CRMs and a decade of history does\n' +
'            not, and no amount of scoping will make it.</p>\n' +
'        </div>\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n' +
    section(
'    <div class="marker reveal"><b>Whatever you spend</b><h2 class="h2">Included either way</h2></div>\n' +
'    <div class="qcols reveal">\n' +
      [['Documentation', 'Part of the work, not a line item that gets cut when the budget tightens.'],
       ['The same people', 'First call to handover. No introduction to a delivery team you have never met.'],
       ['A written scope', 'Approved by you before anything is built, and requoted before it changes.'],
       ['The first call', 'Where we work out whether this is a fit. No charge and no obligation either way.']].map(function (c, i) {
        return '      <div class="qcol">\n' +
               '        <span class="qcol-n">' + ('0' + (i + 1)) + '</span>\n' +
               '        <h3 class="qcol-t">' + c[0] + '</h3>\n' +
               '        <p class="qcol-c">' + c[1] + '</p>\n' +
               '      </div>';
      }).join('\n') + '\n' +
'    </div>\n')
};

/* ---------- /about-us ----------
   The portrait runs off the LEFT edge and the type sits right, which is the
   reverse of everything else on the site and the reason this page is
   recognisable at a glance. */

var about = {
  file: 'about-us.html',
  depth: 0,
  navCurrent: '/about-us',
  title: 'About RevHops',
  description: 'RevHops is a small revenue operations consultancy in Phoenix, Arizona. Who we are, how we work, and what we will not do.',
  hero:
'\n<section class="page-hero page-hero-flip">\n' +
'  <div class="shell">\n' +
'    <div class="page-hero-inner-flip">\n' +
'      <div class="page-hero-text order-first">\n' +
'        <h1 class="h1">The team you meet is the team you get</h1>\n' +
'        <p class="lede">A revenue operations consultancy in Phoenix, Arizona. Small on purpose,\n' +
'          deep in one thing, and straight with you about the parts that will be difficult.</p>\n' +
'        <dl class="hero-meta">\n' +
'          <div><dt>Based in</dt><dd>Phoenix, AZ</dd></div>\n' +
'          <div><dt>Founded by</dt><dd>James Ricks</dd></div>\n' +
'          <div><dt>Clients at once</dt><dd>Deliberately few</dd></div>\n' +
'        </dl>\n' +
'      </div>\n' +
'    </div>\n' +
'    <div class="page-hero-media is-left">\n' +
'      <img src="assets/img/james-portrait.webp" alt="James Ricks, founder of RevHops">\n' +
'    </div>\n' +
'  </div>\n' +
'  <div class="page-head-end" data-nav-clear></div>\n' +
'</section>\n',
  body:
    section(
'    <div class="g-5-7" style="align-items:start">\n' +
'      <div class="reveal reveal-left">\n' +
'        <p class="statement">The agencies I hired were good at building what I asked for.</p>\n' +
'        <p class="statement-note">And bad at telling me when I had asked for the wrong thing.\n' +
'          That is the reason this shop exists.</p>\n' +
'      </div>\n' +
'      <div class="cols-2 reveal reveal-right">\n' +
'        <p>I am James. Before RevHops I spent [00] years inside revenue teams rather than beside\n' +
'          them — running the systems, owning the number, and explaining to a board why the\n' +
'          forecast and the invoices disagreed.</p>\n' +
'        <p>The people who could tell me the truth were expensive, busy, and gone by month three.\n' +
'          The ones who stayed did what they were told.</p>\n' +
'        <p>So RevHops takes fewer clients and keeps the same people on them. It is a less\n' +
'          scalable business. It is a much better one to be a client of.</p>\n' +
'      </div>\n' +
'    </div>\n') +
'\n<section class="section band">\n' +
'  <div class="shell">\n' +
'    <div class="marker reveal" style="border-bottom-color:rgba(250,250,248,.45)">\n' +
'      <b style="color:var(--on-navy-faint)">What we believe</b>\n' +
'      <h2 class="h2">Three, and we mean them</h2>\n' +
'    </div>\n' +
'    <div class="qcols reveal" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))">\n' +
      [["Show, don't tell", "We're veteran experts and we know our stuff, but it's the work we do, not our words, that we let do the talking."],
       ['Seriously, fun', 'Working with us is as enjoyable and fun as it is effective. You know, the whole work hard, play hard thing.'],
       ['Clarity over comfort', 'The most important thing we can do is guide you down the right path, not the easy or convenient one.']].map(function (c, i) {
        return '      <div class="qcol" style="border-top-color:rgba(250,250,248,.5)">\n' +
               '        <span class="qcol-n" style="color:var(--on-navy-faint)">' + ('0' + (i + 1)) + '</span>\n' +
               '        <h3 class="qcol-t" style="color:var(--paper)">' + c[0] + '</h3>\n' +
               '        <p class="qcol-c" style="color:var(--on-navy)">' + c[1] + '</p>\n' +
               '      </div>';
      }).join('\n') + '\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n' +
    logoBand(0) +
    section(
'    <div class="marker reveal"><b>In practice</b><h2 class="h2">How we work</h2></div>\n' +
'    <div class="qrows">\n' +
      [['Always', 'You talk to the people doing the work', 'The person on the first call is the person doing the build. Start to finish, no exceptions and no account managers in between.'],
       ['Only', 'Revenue operations, and nothing else', 'Not a generalist shop with a RevOps page. It is the whole business, which is why we are any good at it.'],
       ['Certified', 'HubSpot Platinum Solutions Partner', 'Current certifications, and a line into HubSpot for when the problem turns out to be on their side rather than yours.'],
       ['Sometimes', 'The wrong call, and we will say so', 'If you need five bodies on site next week, or the real problem is a hiring problem, you will hear that on the first call.']].map(function (r) {
        return '      <div class="qrow reveal">\n' +
               '        <span class="qrow-n">' + r[0] + '</span>\n' +
               '        <div class="qrow-b">\n' +
               '          <h3 class="qrow-t">' + r[1] + '</h3>\n' +
               '          <p class="qrow-c">' + r[2] + '</p>\n' +
               '        </div>\n' +
               '      </div>';
      }).join('\n') + '\n' +
'    </div>\n' +
'    <p class="reveal" style="margin-top:clamp(26px,3vw,40px)">\n' +
'      <a class="text-link" href="/services">What we actually do <span class="arrow">&rarr;</span></a>\n' +
'    </p>\n')
};

/* ---------- /contact ----------
   One job. A short hero, the form at seven twelfths, and the direct routes
   on a navy panel beside it — the panel is the page's only colour and it is
   there so "just email us" is as prominent as the form. */

var contact = {
  file: 'contact.html',
  depth: 0,
  navCurrent: '/contact',
  title: 'Contact RevHops',
  description: 'Get in touch with RevHops. Tell us what is broken, or book a discovery call directly.',
  hero:
'\n<section class="page-hero page-hero-plain" style="padding-bottom:clamp(20px,2.4vw,34px)">\n' +
'  <div class="shell">\n' +
'    <div class="page-hero-text" style="max-width:34ch">\n' +
'      <h1 class="h1">Tell us what is broken</h1>\n' +
'    </div>\n' +
'    <p class="lede" style="margin-top:16px">The more specific you are, the more useful the first\n' +
'      reply will be. We answer everything within a working day, usually with a question rather\n' +
'      than a pitch.</p>\n' +
'  </div>\n' +
'  <div class="page-head-end" data-nav-clear></div>\n' +
'</section>\n',
  body:
    section(
'    <div class="g-7-5" style="align-items:stretch;gap:clamp(28px,3.4vw,56px)">\n' +
'\n' +
'      <form class="form reveal reveal-left" method="post" action="#" novalidate>\n' +
'        <div class="form-row">\n' +
'          <div class="field">\n' +
'            <label for="c-name">Your name</label>\n' +
'            <input id="c-name" name="name" type="text" autocomplete="name" required>\n' +
'          </div>\n' +
'          <div class="field">\n' +
'            <label for="c-email">Work email</label>\n' +
'            <input id="c-email" name="email" type="email" autocomplete="email" required>\n' +
'          </div>\n' +
'        </div>\n' +
'        <div class="form-row">\n' +
'          <div class="field">\n' +
'            <label for="c-company">Company</label>\n' +
'            <input id="c-company" name="company" type="text" autocomplete="organization">\n' +
'          </div>\n' +
'          <div class="field">\n' +
'            <label for="c-crm">What you are running today</label>\n' +
'            <select id="c-crm" name="crm">\n' +
'              <option value="">Pick the closest one</option>\n' +
'              <option>HubSpot</option>\n' +
'              <option>Salesforce</option>\n' +
'              <option>Pipedrive</option>\n' +
'              <option>Something else</option>\n' +
'              <option>Spreadsheets, mostly</option>\n' +
'            </select>\n' +
'          </div>\n' +
'        </div>\n' +
'        <div class="field">\n' +
'          <label for="c-msg">What is going wrong</label>\n' +
'          <textarea id="c-msg" name="message" rows="7"\n' +
'                    placeholder="The symptom is enough. You do not have to have diagnosed it."></textarea>\n' +
'        </div>\n' +
'        <div class="form-foot">\n' +
'          <button class="btn btn-primary" type="submit">Send it over</button>\n' +
'          <p class="form-note">No newsletter, no sequence. One reply from a person.</p>\n' +
'        </div>\n' +
'      </form>\n' +
'\n' +
'      <aside class="side-panel reveal reveal-right">\n' +
'        <h2 class="h3" style="color:var(--paper)">Or skip the form</h2>\n' +
'        <p class="side-panel-copy">Email lands in the same place and gets the same answer. If you\n' +
'          would rather just talk, the calendar is open and there is nothing to fill in first.</p>\n' +
'        <div class="side-panel-routes">\n' +
'          <a class="text-link" href="mailto:team@revhops.com">team@revhops.com <span class="arrow">&rarr;</span></a>\n' +
'          <a class="text-link" href="/call">Book a discovery call <span class="arrow">&rarr;</span></a>\n' +
'        </div>\n' +
'        <dl class="side-panel-meta">\n' +
'          <div><dt>Where we are</dt><dd>Phoenix, Arizona</dd></div>\n' +
'          <div><dt>Who we work with</dt><dd>Teams across the US and Europe</dd></div>\n' +
'          <div><dt>Reply time</dt><dd>One working day</dd></div>\n' +
'        </dl>\n' +
'      </aside>\n' +
'\n' +
'    </div>\n')
};

/* ---------- /hubspot ----------
   Laid out as a CRM record. The argument the page is making is "we live in
   this tool", and showing that is better than writing it down. The middle
   column's sub-tabs are the hub explorer, and they reuse the case filter's
   attributes exactly, so there is no second script. */

var HUBS = [
  { key: 'marketing', tab: 'Marketing', title: 'Marketing Hub',
    line: 'Lifecycle, scoring and attribution rebuilt so the funnel reports mean something',
    body: 'Most portals score leads on a model nobody has revisited since onboarding. We rebuild the lifecycle to match how you actually sell, then make the campaign reporting defensible enough to take to a board.',
    chips: ['Lifecycle', 'Lead scoring', 'Attribution', 'Campaigns'], when: 'Every engagement' },
  { key: 'sales', tab: 'Sales', title: 'Sales Hub',
    line: 'Pipelines, routing and a forecast built on something other than optimism',
    body: 'Stage definitions everyone reads the same way, routing that does not depend on someone watching a queue, and sequences that stop when a human replies.',
    chips: ['Pipelines', 'Routing', 'Sequences', 'Forecasting'], when: 'Every engagement' },
  { key: 'service', tab: 'Service', title: 'Service Hub',
    line: 'Tickets, SLAs, and the sales-to-service handoff that is usually the real problem',
    body: 'The handoff is where the customer notices the seams. We map it, own it, and put the SLA somewhere the team can see it without opening a report.',
    chips: ['Tickets', 'SLAs', 'Handoffs', 'Feedback'], when: 'Where it applies' },
  { key: 'operations', tab: 'Operations', title: 'Operations Hub',
    line: 'Data sync, programmable automation and quality rules — where the difficult work lives',
    body: 'Two-way sync with the systems you are not replacing, custom-coded actions for the logic no workflow can express, and format rules that stop the data going bad again.',
    chips: ['Data sync', 'Custom code', 'Quality rules', 'Datasets'], when: 'Most engagements' },
  { key: 'content', tab: 'Content', title: 'Content Hub',
    line: 'Where it earns its place, and where a separate stack is the cheaper answer',
    body: 'We will tell you when your existing CMS is fine. Where Content Hub does win is when the site has to read the CRM, and that is the case we will make or not make on the call.',
    chips: ['CMS', 'Themes', 'Serverless'], when: 'Sometimes' },
  { key: 'objects', tab: 'Custom objects', title: 'Custom objects and the data model',
    line: 'Built when the model genuinely needs one, and talked you out of when it does not',
    body: 'A custom object is a permanent decision. Half the time the answer is a property on an existing one, and saying so is more useful than the invoice for building it.',
    chips: ['Modelling', 'Migration', 'Associations'], when: 'When it is right' }
];

var hubspot = {
  file: 'hubspot.html',
  depth: 0,
  navCurrent: '/hubspot',
  title: 'HubSpot Platinum Solutions Partner — RevHops',
  description: 'RevHops is a HubSpot Platinum Solutions Partner. Portal builds, migrations, admin retainers and a free portal audit.',
  hero:
'\n<section class="record">\n' +
'  <div class="shell">\n' +
'\n' +
'    <div class="record-bar">\n' +
'      <a class="record-crumb" href="/services"><span aria-hidden="true">&larr;</span> Services</a>\n' +
'      <a class="record-crumb" href="/call">Book a call <span aria-hidden="true">&rarr;</span></a>\n' +
'    </div>\n' +
'\n' +
'    <div class="record-grid">\n' +
'\n' +
'      <!-- the record itself -->\n' +
'      <aside class="record-left">\n' +
'        <div class="rcard">\n' +
'          <div class="record-id">\n' +
'            <img src="assets/img/revhops-icon-white.png" alt="" aria-hidden="true">\n' +
'            <div>\n' +
'              <h1 class="record-name">HubSpot Platinum Partner</h1>\n' +
'              <p class="record-org">RevHops &middot; Phoenix, Arizona</p>\n' +
'              <a class="record-mail" href="mailto:team@revhops.com">team@revhops.com</a>\n' +
'            </div>\n' +
'          </div>\n' +
'          <div class="record-actions">\n' +
        [['/contact', 'Audit', 'M9 3h6l1 3H8zM6 6h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z'],
         ['mailto:team@revhops.com', 'Email', 'M3 6h18v12H3zM3 6l9 7 9-7'],
         ['/call', 'Meeting', 'M4 5h16v16H4zM4 10h16M9 3v4M15 3v4'],
         ['/pricing', 'Pricing', 'M4 12h16M4 7h16M4 17h10']].map(function (a) {
          return '            <a class="record-action" href="' + a[0] + '">\n' +
                 '              <span><svg viewBox="0 0 24 24" aria-hidden="true" stroke-linecap="round" stroke-linejoin="round"><path d="' + a[2] + '"/></svg></span>\n' +
                 '              <em>' + a[1] + '</em>\n' +
                 '            </a>';
        }).join('\n') + '\n' +
'          </div>\n' +
'        </div>\n' +
'\n' +
'        <div class="rcard">\n' +
'          <div class="rcard-head"><h2 class="rcard-title">About this partnership</h2></div>\n' +
'          <dl class="rprops">\n' +
        [['Partner tier', 'Platinum'], ['Solutions Partner since', '[year]'],
         ['Hubs implemented', 'All five'], ['Certifications current', '10'],
         ['Portals built', '[00]'], ['Portal owner', 'James Ricks'],
         ['Free audit', 'Yes, one hour']].map(function (r) {
          return '            <div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>';
        }).join('\n') + '\n' +
'          </dl>\n' +
'        </div>\n' +
'      </aside>\n' +
'\n' +
'      <!-- the timeline, and the hub explorer that filters it -->\n' +
'      <div class="record-main">\n' +
'        <div class="rtabs">\n' +
'          <a class="rtab" href="/services">Overview</a>\n' +
'          <a class="rtab" href="#" aria-current="true">What we do in HubSpot</a>\n' +
'        </div>\n' +
'\n' +
'        <div class="rsubtabs" role="group" aria-label="Filter by hub">\n' +
'          <button class="rsubtab" type="button" data-filter="all" aria-pressed="true">All activity</button>\n' +
        HUBS.map(function (h) {
          return '          <button class="rsubtab" type="button" data-filter="' + h.key + '" aria-pressed="false">' + h.tab + '</button>';
        }).join('\n') + '\n' +
'        </div>\n' +
'\n' +
'        <div data-filter-grid>\n' +
'          <p class="rgroup">Upcoming</p>\n' +
'          <div class="rentry reveal" data-tags="marketing sales service operations content objects">\n' +
'            <div class="rentry-top">\n' +
'              <p class="rentry-title"><b>Portal audit</b> &mdash; an hour inside yours, a written page back</p>\n' +
'              <span class="rentry-when">Free, no purchase</span>\n' +
'            </div>\n' +
'            <p class="rentry-body">What is set up well, what is quietly costing you, and the three things worth\n' +
'              fixing first. If the portal is in good shape we will tell you that, and you will have spent an\n' +
'              hour to find out.</p>\n' +
'            <p style="margin-top:13px"><a class="text-link" href="/contact">Request the audit <span class="arrow">&rarr;</span></a></p>\n' +
'          </div>\n' +
'\n' +
'          <p class="rgroup">Where the work happens</p>\n' +
        HUBS.map(function (h) {
          return '          <div class="rentry reveal" data-tags="' + h.key + '">\n' +
                 '            <div class="rentry-top">\n' +
                 '              <p class="rentry-title"><b>' + h.title + '</b> &mdash; ' + h.line + '</p>\n' +
                 '              <span class="rentry-when">' + h.when + '</span>\n' +
                 '            </div>\n' +
                 '            <p class="rentry-body">' + h.body + '</p>\n' +
                 '            <div class="rentry-chips">\n' +
                 h.chips.map(function (c) { return '              <span class="chip">' + c + '</span>'; }).join('\n') + '\n' +
                 '            </div>\n' +
                 '          </div>';
        }).join('\n') + '\n' +
'        </div>\n' +
'      </div>\n' +
'\n' +
'      <!-- associated records -->\n' +
'      <aside class="record-right">\n' +
'        <div class="rcard">\n' +
'          <div class="rcard-head"><h2 class="rcard-title">Certifications (10)</h2></div>\n' +
'          <div class="rentry-chips" style="margin-top:0">\n' +
        ['Solutions Partner', 'Revenue Operations', 'Marketing Hub Implementation',
         'Sales Hub Implementation', 'Service Hub Implementation', 'Data Integrations',
         'CRM Data Management', 'Reporting', 'Marketing Automation', 'Objectives-based Onboarding']
          .map(function (c) { return '            <span class="chip">' + c + '</span>'; }).join('\n') + '\n' +
'          </div>\n' +
'          <p class="rempty" style="margin-top:12px">[Badge artwork goes here once James supplies it.]</p>\n' +
'        </div>\n' +
'\n' +
'        <div class="rcard">\n' +
'          <div class="rcard-head"><h2 class="rcard-title">Case studies (5)</h2>\n' +
'            <a class="rcard-add" href="/case-studies">All</a></div>\n' +
'          <div class="rassoc">\n' +
        CASES.map(function (c, i) {
          return '            <a href="/case-studies/' + c.slug + '">[Client name] <small>' + c.figs[0][0] + c.figs[0][1] + '</small></a>';
        }).join('\n') + '\n' +
'          </div>\n' +
'        </div>\n' +
'\n' +
'        <div class="rcard">\n' +
'          <div class="rcard-head"><h2 class="rcard-title">Ways in (5)</h2>\n' +
'            <a class="rcard-add" href="/services">All</a></div>\n' +
'          <div class="rassoc">\n' +
        SERVICES.map(function (s) {
          return '            <a href="/services/' + s.slug + '">' + s.name + ' <small>' + s.time + '</small></a>';
        }).join('\n') + '\n' +
'          </div>\n' +
'        </div>\n' +
'\n' +
'        <div class="rcard">\n' +
'          <div class="rcard-head"><h2 class="rcard-title">Not a reason to buy it</h2></div>\n' +
'          <p class="rempty">Platinum is the third tier of five, and anyone whose pitch is their\n' +
'            partner tier is selling you their partner tier. If you own Salesforce and it is\n' +
'            working, we will say so and you will have saved a migration.</p>\n' +
'        </div>\n' +
'      </aside>\n' +
'\n' +
'    </div>\n' +
'  </div>\n' +
'  <div class="page-head-end" data-nav-clear></div>\n' +
'</section>\n',
  /* The close pulls itself up by --start-bleed and paints across whatever is
     above it. With no body that was the record's own cards, with the bottom
     300px of the layout washed out. This section is what it lands on. */
  body: section(
'    <div class="g-5-7" style="align-items:start">\n' +
'      <div class="reveal reveal-left">\n' +
'        <p class="statement">If the portal is in good shape we will tell you that.</p>\n' +
'        <p class="statement-note">And you will have spent an hour to find out, which is a better\n' +
'          outcome than most audits manage.</p>\n' +
'      </div>\n' +
'      <div class="cols-2 reveal reveal-right">\n' +
'        <p>Most audits are a sales document with a findings section attached. The findings are\n' +
'          real, the recommendation is always the same, and it is always the thing being sold.</p>\n' +
'        <p>This one is an hour and a page. If the answer is leave it alone, that is what the page\n' +
'          will say, and you can put it in front of whoever asked you to look.</p>\n' +
'      </div>\n' +
'    </div>\n', 'section to-white')
};

var about = {
  file: 'about-us.html',
  depth: 0,
  navCurrent: '/about-us',
  title: 'About RevHops',
  description: 'RevHops is a small revenue operations consultancy in Phoenix, Arizona. Who we are, how we work, and what we will not do.',
  hero:
'\n<section class="page-hero page-hero-flip">\n' +
'  <div class="shell">\n' +
'    <div class="page-hero-inner-flip">\n' +
'      <div class="page-hero-text order-first">\n' +
'        <h1 class="h1">The team you meet is the team you get</h1>\n' +
'        <p class="lede">A revenue operations consultancy in Phoenix, Arizona. Small on purpose,\n' +
'          deep in one thing, and straight with you about the parts that will be difficult.</p>\n' +
'        <dl class="hero-meta">\n' +
'          <div><dt>Based in</dt><dd>Phoenix, AZ</dd></div>\n' +
'          <div><dt>Founded by</dt><dd>James Ricks</dd></div>\n' +
'          <div><dt>Clients at once</dt><dd>Deliberately few</dd></div>\n' +
'        </dl>\n' +
'      </div>\n' +
'    </div>\n' +
'    <div class="page-hero-media is-left">\n' +
'      <img src="assets/img/james-portrait.webp" alt="James Ricks, founder of RevHops">\n' +
'    </div>\n' +
'  </div>\n' +
'  <div class="page-head-end" data-nav-clear></div>\n' +
'</section>\n',
  body:
    section(
'    <div class="g-5-7" style="align-items:start">\n' +
'      <div class="reveal reveal-left">\n' +
'        <p class="statement">The agencies I hired were good at building what I asked for.</p>\n' +
'        <p class="statement-note">And bad at telling me when I had asked for the wrong thing.\n' +
'          That is the reason this shop exists.</p>\n' +
'      </div>\n' +
'      <div class="cols-2 reveal reveal-right">\n' +
'        <p>I am James. Before RevHops I spent [00] years inside revenue teams rather than beside\n' +
'          them — running the systems, owning the number, and explaining to a board why the\n' +
'          forecast and the invoices disagreed.</p>\n' +
'        <p>The people who could tell me the truth were expensive, busy, and gone by month three.\n' +
'          The ones who stayed did what they were told.</p>\n' +
'        <p>So RevHops takes fewer clients and keeps the same people on them. It is a less\n' +
'          scalable business. It is a much better one to be a client of.</p>\n' +
'      </div>\n' +
'    </div>\n') +
'\n<section class="section band">\n' +
'  <div class="shell">\n' +
'    <div class="marker reveal" style="border-bottom-color:rgba(250,250,248,.45)">\n' +
'      <b style="color:var(--on-navy-faint)">What we believe</b>\n' +
'      <h2 class="h2">Three, and we mean them</h2>\n' +
'    </div>\n' +
'    <div class="qcols reveal" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))">\n' +
      [["Show, don't tell", "We're veteran experts and we know our stuff, but it's the work we do, not our words, that we let do the talking."],
       ['Seriously, fun', 'Working with us is as enjoyable and fun as it is effective. You know, the whole work hard, play hard thing.'],
       ['Clarity over comfort', 'The most important thing we can do is guide you down the right path, not the easy or convenient one.']].map(function (c, i) {
        return '      <div class="qcol" style="border-top-color:rgba(250,250,248,.5)">\n' +
               '        <span class="qcol-n" style="color:var(--on-navy-faint)">' + ('0' + (i + 1)) + '</span>\n' +
               '        <h3 class="qcol-t" style="color:var(--paper)">' + c[0] + '</h3>\n' +
               '        <p class="qcol-c" style="color:var(--on-navy)">' + c[1] + '</p>\n' +
               '      </div>';
      }).join('\n') + '\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n' +
    logoBand(0) +
    section(
'    <div class="marker reveal"><b>In practice</b><h2 class="h2">How we work</h2></div>\n' +
'    <div class="qrows">\n' +
      [['Always', 'You talk to the people doing the work', 'The person on the first call is the person doing the build. Start to finish, no exceptions and no account managers in between.'],
       ['Only', 'Revenue operations, and nothing else', 'Not a generalist shop with a RevOps page. It is the whole business, which is why we are any good at it.'],
       ['Certified', 'HubSpot Platinum Solutions Partner', 'Current certifications, and a line into HubSpot for when the problem turns out to be on their side rather than yours.'],
       ['Sometimes', 'The wrong call, and we will say so', 'If you need five bodies on site next week, or the real problem is a hiring problem, you will hear that on the first call.']].map(function (r) {
        return '      <div class="qrow reveal">\n' +
               '        <span class="qrow-n">' + r[0] + '</span>\n' +
               '        <div class="qrow-b">\n' +
               '          <h3 class="qrow-t">' + r[1] + '</h3>\n' +
               '          <p class="qrow-c">' + r[2] + '</p>\n' +
               '        </div>\n' +
               '      </div>';
      }).join('\n') + '\n' +
'    </div>\n' +
'    <p class="reveal" style="margin-top:clamp(26px,3vw,40px)">\n' +
'      <a class="text-link" href="/services">What we actually do <span class="arrow">&rarr;</span></a>\n' +
'    </p>\n')
};

/* ---------- /contact ----------
   One job. A short hero, the form at seven twelfths, and the direct routes
   on a navy panel beside it — the panel is the page's only colour and it is
   there so "just email us" is as prominent as the form. */

var contact = {
  file: 'contact.html',
  depth: 0,
  navCurrent: '/contact',
  title: 'Contact RevHops',
  description: 'Get in touch with RevHops. Tell us what is broken, or book a discovery call directly.',
  hero:
'\n<section class="page-hero page-hero-plain" style="padding-bottom:clamp(20px,2.4vw,34px)">\n' +
'  <div class="shell">\n' +
'    <div class="page-hero-text" style="max-width:34ch">\n' +
'      <h1 class="h1">Tell us what is broken</h1>\n' +
'    </div>\n' +
'    <p class="lede" style="margin-top:16px">The more specific you are, the more useful the first\n' +
'      reply will be. We answer everything within a working day, usually with a question rather\n' +
'      than a pitch.</p>\n' +
'  </div>\n' +
'  <div class="page-head-end" data-nav-clear></div>\n' +
'</section>\n',
  body:
    section(
'    <div class="g-7-5" style="align-items:stretch;gap:clamp(28px,3.4vw,56px)">\n' +
'\n' +
'      <form class="form reveal reveal-left" method="post" action="#" novalidate>\n' +
'        <div class="form-row">\n' +
'          <div class="field">\n' +
'            <label for="c-name">Your name</label>\n' +
'            <input id="c-name" name="name" type="text" autocomplete="name" required>\n' +
'          </div>\n' +
'          <div class="field">\n' +
'            <label for="c-email">Work email</label>\n' +
'            <input id="c-email" name="email" type="email" autocomplete="email" required>\n' +
'          </div>\n' +
'        </div>\n' +
'        <div class="form-row">\n' +
'          <div class="field">\n' +
'            <label for="c-company">Company</label>\n' +
'            <input id="c-company" name="company" type="text" autocomplete="organization">\n' +
'          </div>\n' +
'          <div class="field">\n' +
'            <label for="c-crm">What you are running today</label>\n' +
'            <select id="c-crm" name="crm">\n' +
'              <option value="">Pick the closest one</option>\n' +
'              <option>HubSpot</option>\n' +
'              <option>Salesforce</option>\n' +
'              <option>Pipedrive</option>\n' +
'              <option>Something else</option>\n' +
'              <option>Spreadsheets, mostly</option>\n' +
'            </select>\n' +
'          </div>\n' +
'        </div>\n' +
'        <div class="field">\n' +
'          <label for="c-msg">What is going wrong</label>\n' +
'          <textarea id="c-msg" name="message" rows="7"\n' +
'                    placeholder="The symptom is enough. You do not have to have diagnosed it."></textarea>\n' +
'        </div>\n' +
'        <div class="form-foot">\n' +
'          <button class="btn btn-primary" type="submit">Send it over</button>\n' +
'          <p class="form-note">No newsletter, no sequence. One reply from a person.</p>\n' +
'        </div>\n' +
'      </form>\n' +
'\n' +
'      <aside class="side-panel reveal reveal-right">\n' +
'        <h2 class="h3" style="color:var(--paper)">Or skip the form</h2>\n' +
'        <p class="side-panel-copy">Email lands in the same place and gets the same answer. If you\n' +
'          would rather just talk, the calendar is open and there is nothing to fill in first.</p>\n' +
'        <div class="side-panel-routes">\n' +
'          <a class="text-link" href="mailto:team@revhops.com">team@revhops.com <span class="arrow">&rarr;</span></a>\n' +
'          <a class="text-link" href="/call">Book a discovery call <span class="arrow">&rarr;</span></a>\n' +
'        </div>\n' +
'        <dl class="side-panel-meta">\n' +
'          <div><dt>Where we are</dt><dd>Phoenix, Arizona</dd></div>\n' +
'          <div><dt>Who we work with</dt><dd>Teams across the US and Europe</dd></div>\n' +
'          <div><dt>Reply time</dt><dd>One working day</dd></div>\n' +
'        </dl>\n' +
'      </aside>\n' +
'\n' +
'    </div>\n')
};

var hubspot = {
  file: 'hubspot.html',
  depth: 0,
  navCurrent: '/hubspot',
  title: 'HubSpot Platinum Solutions Partner — RevHops',
  description: 'RevHops is a HubSpot Platinum Solutions Partner. Portal builds, migrations, admin retainers and a free portal audit.',
  h1: 'Platinum partner and full-time resident',
  lede: 'We build portals, migrate teams onto them and keep them running afterwards. And we will tell you when HubSpot is the wrong answer, which happens.',
  media: { src: 'assets/img/hubspot-platinum-badge.webp', alt: 'HubSpot Platinum Solutions Partner', mark: true },
  meta: [['Tier', 'Platinum'], ['Hubs', 'All five'], ['Portal audit', 'Free']],
  headButtons: '          <a class="btn btn-primary" href="/contact">Request a free portal audit</a>\n' +
               '          <a class="text-link" href="/call">Or just book a call <span class="arrow">&rarr;</span></a>',
  body:
    section(
'    <div class="split" style="align-items:start">\n' +
'      <div class="reveal reveal-left">\n' +
'        <p class="statement">Platinum is a real bar, and it is not the top one.</p>\n' +
'        <p class="statement-note">Anyone whose pitch is their partner tier is selling you their\n' +
'          partner tier. Here is what it is actually worth knowing.</p>\n' +
'      </div>\n' +
'      <div class="cols-2 reveal reveal-right">\n' +
'        <p>HubSpot ranks partners on how much software they sell and how well the customers who\n' +
'          buy it do afterwards. Platinum is the third tier of five.</p>\n' +
'        <p>What it is good for: the certifications are current, the portals we have built are\n' +
'          still in use, and we have a channel into HubSpot when something is broken on their side\n' +
'          rather than ours. That last one saves more time than the badge does.</p>\n' +
'        <p>What it is not: a reason to buy HubSpot. If you own Salesforce and it is working, we\n' +
'          will say so and you will have saved a migration.</p>\n' +
'      </div>\n' +
'    </div>\n') +
    section(
      secHead('Where we spend our time <span class="hl">in the platform</span>') +
'    <div style="margin-top:clamp(22px,2.6vw,34px)">\n' +
      pcards([
        { title: 'Marketing Hub', copy: 'Lifecycle, scoring, campaign attribution and the reports that make any of it defensible.',
          chips: ['Lifecycle', 'Scoring', 'Attribution'] },
        { title: 'Sales Hub', copy: 'Pipelines, sequences, routing and a forecast built on something other than optimism.',
          chips: ['Pipelines', 'Routing', 'Forecasting'] },
        { title: 'Service Hub', copy: 'Tickets, SLAs, and the handoff from sales that usually turns out to be the actual problem.',
          chips: ['Tickets', 'SLAs', 'Handoffs'] },
        { title: 'Operations Hub', copy: 'Data sync, programmable automation and quality rules, which is where the difficult work lives.',
          chips: ['Data sync', 'Custom code', 'Quality'] },
        { title: 'Content Hub', copy: 'Where it earns its place, and where a separate stack is the cheaper answer.',
          chips: ['CMS', 'Themes'] },
        { title: 'Custom objects', copy: 'Built when the data model genuinely needs one, and talked you out of when it does not.',
          chips: ['Modelling', 'Migration'] }
      ]) +
'    </div>\n', 'section-tight') +
    section(
      secHead('Certifications the team holds',
              'Current, and re-sat when they expire. HubSpot retires these on a schedule and a lapsed certification is worth exactly nothing.') +
'    <div class="pcards" style="margin-top:clamp(22px,2.6vw,34px)">\n' +
'      <div class="pcard reveal" style="grid-column:1/-1">\n' +
'        <div class="pcard-chips" style="margin-top:0">\n' +
      ['HubSpot Solutions Partner', 'Revenue Operations', 'Marketing Hub Implementation',
       'Sales Hub Implementation', 'Service Hub Implementation', 'Data Integrations',
       'CRM Data Management', 'Reporting and Dashboards', 'Marketing Automation',
       'Objectives-based Onboarding'].map(function (c) {
        return '          <span class="chip">' + c + '</span>';
      }).join('\n') + '\n' +
'        </div>\n' +
'        <p class="pcard-copy" style="margin-top:14px">[Certification badges go here once James\n' +
'          supplies the artwork. Chips stand in until then.]</p>\n' +
'      </div>\n' +
'    </div>\n', 'section-tight') +
'\n<section class="section surface-navy">\n' +
'  <div class="shell">\n' +
'    <div class="split" style="align-items:center">\n' +
'      <div class="stack gap-20 reveal reveal-left">\n' +
'        <h2 class="h2">A free look at your portal</h2>\n' +
'        <p class="lede">An hour inside it and a written page back: what is set up well, what is\n' +
'          quietly costing you, and the three things worth fixing first.</p>\n' +
'        <div class="btn-row">\n' +
'          <a class="btn btn-light" href="/contact">Request the audit</a>\n' +
'        </div>\n' +
'      </div>\n' +
'      <div class="figs reveal reveal-right" style="grid-template-columns:repeat(2,minmax(0,1fr))">\n' +
'        <div class="fig"><b>1 hr</b><span>In your portal, with you or without you</span></div>\n' +
'        <div class="fig"><b>$0</b><span>No purchase, no deck, no follow-up sequence</span></div>\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n' +
    section(
'    <div class="split" style="align-items:start">\n' +
'      <div class="reveal reveal-left">\n' +
'        <p class="statement">If the portal is in good shape we will tell you that.</p>\n' +
'        <p class="statement-note">And you will have spent an hour to find out, which is a better\n' +
'          outcome than most audits manage.</p>\n' +
'      </div>\n' +
'      <div class="cols-2 reveal reveal-right">\n' +
'        <p>Most audits are a sales document with a findings section attached. The findings are\n' +
'          real, the recommendation is always the same, and it is always the thing being sold.</p>\n' +
'        <p>This one is an hour and a page. If the answer is leave it alone, that is what the page\n' +
'          will say, and you can put it in front of whoever asked you to look.</p>\n' +
'      </div>\n' +
'    </div>\n', 'section to-white')
};



/* ---------- the two booking pages ----------
   Nothing but the widget. No header band, no closing panel: the page has one
   job and anything else on it is a way to not do that job. The sentinel at
   the top is what tells the nav when to collapse, since there is no
   .page-head to carry it. */

function meetingPage(o) {
  return {
    file: o.file,
    depth: 0,
    navCurrent: o.navCurrent || '',
    title: o.title,
    description: o.description,
    noindex: o.noindex,
    bare: true,
    noClose: true,
    body:
'\n<div class="page-head-end" data-nav-clear></div>\n' +
'\n<section class="section">\n' +
'  <div class="shell">\n' +
'    <h1 class="sr-only">' + o.srTitle + '</h1>\n' +
'    <div class="meet-wrap">\n' +
'      <!-- Start of Meetings Embed Script -->\n' +
'      <div class="meetings-iframe-container" data-src="' + o.src + '"></div>\n' +
'      <script type="text/javascript" src="https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js"><\/script>\n' +
'      <!-- End of Meetings Embed Script -->\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n'
  };
}

var callPage = meetingPage({
  file: 'call.html',
  title: 'Schedule a discovery call — RevHops',
  description: 'Book a discovery call with RevHops. Thirty minutes, no deck.',
  srTitle: 'Schedule a discovery call with RevHops',
  src: 'https://revhops.com/meetings/revhops/discovery-call?embed=true'
});

var clientCallPage = meetingPage({
  file: 'client-call.html',
  title: 'Client call — RevHops',
  description: 'Booking page for existing RevHops clients.',
  srTitle: 'Book a client call with RevHops',
  src: 'https://revhops.com/meetings/revhops/client-call?embed=true',
  noindex: true
});


/* ---------- /terms and /privacy ----------
   No design ambition, but not a wall either: a contents list that sticks to
   the left while the clauses scroll past it. That is the one thing that
   actually helps somebody reading a legal page, which is always somebody
   looking for one specific paragraph. */

function legalPage(o) {
  var ids = o.sections.map(function (s) {
    return s[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  });
  return {
    file: o.file,
    depth: 0,
    title: o.title,
    description: o.description,
    hero:
'\n<section class="page-hero page-hero-plain" style="padding-bottom:clamp(18px,2.2vw,30px)">\n' +
'  <div class="shell">\n' +
'    <p class="qcol-n" style="margin-bottom:14px">Legal</p>\n' +
'    <h1 class="h1" style="font-size:clamp(1.9rem,1.3rem + 2.2vw,2.9rem)">' + o.h1 + '</h1>\n' +
'    <p class="lede" style="margin-top:14px">' + o.lede + '</p>\n' +
'  </div>\n' +
'  <div class="page-head-end" data-nav-clear></div>\n' +
'</section>\n',
    body: section(
'    <div class="g-4-8" style="gap:clamp(28px,4vw,80px)">\n' +
'      <nav class="legal-index reveal" aria-label="On this page">\n' +
'        <p class="qcol-n">On this page</p>\n' +
        o.sections.map(function (s, i) {
          return '        <a href="#' + ids[i] + '">' + s[0] + '</a>';
        }).join('\n') + '\n' +
'      </nav>\n' +
'      <div class="prose reveal">\n' +
'        <p class="prose-meta">Last updated [date]. This is placeholder wording and has not been\n' +
'          reviewed by a lawyer. Replace it before launch.</p>\n' +
        o.sections.map(function (s, i) {
          return '        <h2 id="' + ids[i] + '">' + s[0] + '</h2>\n' +
                 s.slice(1).map(function (para) {
                   return Array.isArray(para)
                     ? '        <ul>\n' + para.map(function (li) { return '          <li>' + li + '</li>'; }).join('\n') + '\n        </ul>'
                     : '        <p>' + para + '</p>';
                 }).join('\n');
        }).join('\n') + '\n' +
'      </div>\n' +
'    </div>\n')
  };
}

var terms = legalPage({
  file: 'terms.html',
  title: 'Terms of Service — RevHops',
  description: 'The terms under which RevHops provides its website and services.',
  h1: 'Terms of Service',
  lede: 'The terms you agree to by using this site. Placeholder wording for now.',
  sections: [
    ['Who we are',
     'RevHops is a revenue operations consultancy based in Phoenix, Arizona. In these terms, "we", "us" and "RevHops" mean RevHops; "you" means the person or company using this website or engaging our services.',
     'Questions about anything on this page go to <a href="mailto:team@revhops.com">team@revhops.com</a>.'],
    ['Using this website',
     'You may use this site for lawful purposes. You may not attempt to gain unauthorized access to it, interfere with its operation, or scrape it in a way that degrades service for anyone else.',
     '[Placeholder. Expand with the specific restrictions counsel recommends.]'],
    ['Our services',
     'Consulting, implementation and support work is governed by the individual statement of work or service agreement signed for that engagement. Where those documents conflict with this page, those documents win.',
     ['Scope, fees and timelines are set out in the relevant statement of work.',
      'Either party may end a monthly engagement on thirty days written notice.',
      '[Placeholder. Payment terms, late payment and expenses.]']],
    ['Intellectual property',
     'Everything on this site — text, design, code and marks — belongs to RevHops unless credited otherwise. Deliverables produced during a client engagement transfer as set out in that engagement\'s agreement.',
     '[Placeholder. Confirm the assignment and licence wording with counsel.]'],
    ['Liability',
     '[Placeholder. Limitation of liability, exclusions and cap, to be drafted.]'],
    ['Changes to these terms',
     'We may update this page. The date at the top says when it last changed. Continuing to use the site after a change means you accept the updated terms.'],
    ['Governing law',
     '[Placeholder. Arizona law, and the venue for disputes.]']
  ]
});

var privacy = legalPage({
  file: 'privacy.html',
  title: 'Privacy Policy — RevHops',
  description: 'What data RevHops collects through this website, why, and what you can ask us to do with it.',
  h1: 'Privacy Policy',
  lede: 'What we collect, why we collect it, and how to get rid of it. Placeholder wording for now.',
  sections: [
    ['The short version',
     'We collect the information you give us and some information about how you use this site. We use it to answer you and to work out which pages are worth keeping. We do not sell it.'],
    ['What we collect',
     ['Anything you type into a form on this site: name, work email, company and your message.',
      'Anything you give us when booking a call through our scheduler.',
      'Usage data collected by HubSpot\'s tracking script: pages viewed, referring source, approximate location and a cookie identifier.',
      '[Placeholder. Confirm the full list once analytics is settled.]']],
    ['Why we collect it',
     'To reply to you, to run an engagement once one starts, and to understand which parts of this site are useful. Marketing email only ever goes to people who asked for it.'],
    ['Cookies and tracking',
     'This site loads HubSpot\'s tracking script, which sets cookies to recognize a returning visitor and attribute a form submission to the pages that led to it. You can refuse cookies in your browser; the site works either way.',
     '[Placeholder. Add the consent banner detail if one is added.]'],
    ['Who else sees it',
     'Our processors: HubSpot as our CRM and analytics, and our email and calendar providers. They hold it on our behalf and under contract. Nobody buys it from us, because we do not sell it.'],
    ['How long we keep it',
     '[Placeholder. Retention periods per data type.]'],
    ['Your rights',
     'You can ask what we hold about you, ask for it to be corrected, or ask us to delete it. Email <a href="mailto:team@revhops.com">team@revhops.com</a> and we will action it. If you are in the EU or UK, the GDPR rights apply in full.'],
    ['Contact',
     'RevHops, Phoenix, Arizona. <a href="mailto:team@revhops.com">team@revhops.com</a>.']
  ]
});

/* ---------- write everything ---------- */

var PAGES = [servicesIndex]
  .concat(SERVICES.map(servicePage))
  .concat([caseIndex])
  .concat(CASES.map(casePage))
  .concat([pricing, hubspot, about, contact, terms, privacy, callPage, clientCallPage]);

var written = 0;
if (require.main === module) {
PAGES.forEach(function (p) {
  var target = path.join(ROOT, p.file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, render(p), 'utf8');
  written++;
  console.log('  wrote  ' + p.file);
});
/* index.html is not generated, but its cache stamp has to match or it will
   paint new markup with an old stylesheet — the exact failure this stamp
   exists to prevent. Only the ?v= is touched; nothing else in the file. */
var home = path.join(ROOT, 'index.html');
var before = fs.readFileSync(home, 'utf8');
var after = before.replace(/(site\.css|site\.js|maturity-slider\.js)\?v=[0-9a-f]+/g, '$1?v=' + STAMP);
if (after !== before) {
  fs.writeFileSync(home, after, 'utf8');
  console.log('  stamped index.html');
}

console.log('\n' + written + ' pages written at stamp ' + STAMP + '. index.html is hand-maintained.');
}
