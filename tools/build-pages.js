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
  ['assets/css/site.css', 'assets/js/site.js', 'assets/js/maturity-slider.js',
   'assets/js/puzzle.js', 'assets/js/hop.js']
    .forEach(function (f) { h.update(fs.readFileSync(path.join(ROOT, f))); });
  return h.digest('hex').slice(0, 10);
})();

/* ---------- shared chrome ------------------------------------------------ */

/* depth 0 = a file at the root, depth 1 = a file one folder down */
function up(depth) { return depth === 0 ? '' : '../'.repeat(depth); }

var NAV_ITEMS = [
  ['/services',     'Services'],
  ['/case-studies', 'Case studies'],
  ['/resources',    'Resources'],
  ['/hubspot',      'HubSpot'],
  ['/pricing',      'Pricing'],
  ['/about',        'About'],
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
'      <a class="btn btn-primary" href="/call">Schedule a discovery call</a>\n' +
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

  /* An eyebrow that is a link back up a level, sitting above the H1. Only
     the service pages use it so far: they are the one place on the site
     that is a leaf of a list, and the back link is how you get to the
     siblings without going through the nav. */
  var eyebrow = p.eyebrow
    ? '        <a class="hero-back" href="' + p.eyebrow[1] + '">' +
      '<span class="arrow" aria-hidden="true">&larr;</span> ' + p.eyebrow[0] + '</a>\n'
    : '';

  /* `big` lets a contained mark run a third past the band's height — see
     .page-hero-media.is-big. `href` wraps it, for the one mark on the site
     that is a claim somebody might want to check. */
  var img = m
    ? '<img' + (m.srcDark ? ' class="mark-light"' : '') + ' src="' + a + m.src + '" alt="' + m.alt + '"' +
      (m.alt ? '' : ' aria-hidden="true"') + '>' +
      /* `srcDark` is a second file for the dark theme, for a mark with no
         colour of its own. Both are in the markup and CSS shows one, the
         same way the nav lockups and the theme toggle's icons work: picking
         in JS would paint the wrong one until the script ran. /pipedrive. */
      (m.srcDark ? '<img class="mark-dark" src="' + a + m.srcDark + '" alt="" aria-hidden="true">' : '')
    : '';
  /* `rel` overrides the default on an outside link, for the one mark that
     is a partner link and has to say `sponsored`. */
  var markRel = m && m.rel ? m.rel : 'noopener';
  var media = m
    ? '      <div class="page-hero-media' + (m.mark ? ' is-mark' : '') +
      (m.big ? ' is-big' : '') + '">\n' +
      (m.href
        ? '        <a class="page-hero-mark-link" href="' + m.href + '"' +
          (/^https?:/.test(m.href) ? ' target="_blank" rel="' + markRel + '"' : '') + '>' +
          img + '</a>\n'
        : '        ' + img + '\n') +
      /* A caption under the mark, and ONLY ON A PHONE — see
         .page-hero-mark-note. On a wide screen the same link sits beside
         the review further down the page, where it belongs; at phone width
         that whole block comes out and this is where it goes instead. */
      (m.note && m.href
        ? '        <a class="page-hero-mark-note" href="' + m.href + '"' +
          (/^https?:/.test(m.href) ? ' target="_blank" rel="' + markRel + '"' : '') + '>' +
          m.note + ' <span class="arrow" aria-hidden="true">&rarr;</span></a>\n'
        : '') +
      '      </div>\n'
    : '';

  return '\n<!-- ===================== HERO =====================\n' +
'     Type left, artwork bleeding off the right edge. The H1 carries\n' +
'     data-nav-clear: the bar collapses as it reaches the title. -->\n' +
'<section class="page-hero' + (p.heroClass ? ' ' + p.heroClass : (p.media ? '' : ' page-hero-plain')) + '">\n' +
'  <div class="shell">\n' +
'    <div class="page-hero-inner">\n' +
'      <div class="page-hero-text">\n' +
eyebrow +
'        <h1 class="h1" data-nav-clear>' + p.h1 + '</h1>\n' +
'        <p class="lede">' + p.lede + '</p>\n' +
buttons +
meta +
'      </div>\n' +
'    </div>\n' +
media +
'  </div>\n' +
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
'        <p class="footer-pitch">We help revenue growth teams make the hop from chaos to clarity through people, systems &amp; tools.</p>\n' +
'        <a class="footer-mail" href="mailto:team@revhops.com">team@revhops.com</a>\n' +
'        <p class="footer-place">Phoenix, Arizona</p>\n' +
'      </div>\n' +
'\n' +
'      <nav class="footer-links" aria-label="Footer">\n' +
'        <div>\n' +
'          <h4><a href="/services">Services</a></h4>\n' +
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
'            <li><a href="/hubspot">HubSpot</a></li>\n' +
'            <li><a href="/pipedrive">Pipedrive</a></li>\n' +
'            <li><a href="/about">About us</a></li>\n' +
'            <li><a href="/pricing">Pricing</a></li>\n' +
'            <li><a href="/contact">Contact</a></li>\n' +
'          </ul>\n' +
'        </div>\n' +
'        <!-- RESOURCES, added 11 September. Four destinations that already\n' +
'             exist: the blog lives in HubSpot at /resources/blog, and the\n' +
'             other three are the shelves on /resources. Case studies, the\n' +
'             puzzle and the run moved out of Company on the same day rather\n' +
'             than being listed in both places. -->\n' +
'        <div>\n' +
'          <h4><a href="/resources">Resources</a></h4>\n' +
'          <ul class="stack gap-8">\n' +
'            <li><a href="/resources/blog">Blog</a></li>\n' +
'            <li><a href="/case-studies">Case studies</a></li>\n' +
'            <li><a href="/newsletter">Newsletter</a></li>\n' +
'            <li><a href="/resources#games">Games</a></li>\n' +
'          </ul>\n' +
'        </div>\n' +
'      </nav>\n' +
'\n' +
'      <!-- Two reversed partner marks, stacked and set to one width so they\n' +
'           read as a single lockup rather than the logo wall that got the\n' +
'           first Pipedrive badge pulled. Both are white artwork on the navy:\n' +
'           no chip, no filter, and 0% of either mark\'s ink falls under 3:1.\n' +
'           The Pipedrive mark is the green Authorized Partner badge with its\n' +
'           box dropped, so it is the same artwork, reversed. -->\n' +
'      <div class="footer-badges">\n' +
'        <a class="footer-badge footer-badge-hubspot"\n' +
'           href="https://ecosystem.hubspot.com/marketplace/solutions/revhops"\n' +
'           target="_blank" rel="noopener"\n' +
'           aria-label="RevHops on the HubSpot partner directory">\n' +
'          <img src="' + a + 'assets/img/hubspot-platinum-badge-white.webp"\n' +
'               alt="HubSpot Platinum Solutions Partner" loading="lazy">\n' +
'        </a>\n' +
'        <a class="footer-badge footer-badge-pipedrive"\n' +
'           href="https://app.pipedrive.com/affiliate/pdp-revhops?utm_source=RevHops&amp;utm_medium=partners_program&amp;utm_content=copy_text&amp;utm_term=pdp-revhops"\n' +
'           target="_blank" rel="noopener"\n' +
'           aria-label="RevHops is a Pipedrive Authorized Partner">\n' +
'          <img src="' + a + 'assets/img/pipedrive-partner-badge-white.webp"\n' +
'               alt="Pipedrive Authorized Partner" loading="lazy">\n' +
'        </a>\n' +
'      </div>\n' +
'\n' +
'    </div>\n' +
'\n' +
'    <!-- The legal line sits on its own row above the copyright, slashes\n' +
'         between the three, both rows centred. It used to sit beside the\n' +
'         copyright, which read as one long sentence that happened to have\n' +
'         links in it. -->\n' +
'    <div class="footer-bottom">\n' +
'      <nav class="footer-legal" aria-label="Legal">\n' +
'        <a href="/terms">Terms of Service</a>\n' +
'        <span class="footer-legal-sep" aria-hidden="true">/</span>\n' +
'        <a href="/privacy">Privacy Policy</a>\n' +
'        <span class="footer-legal-sep" aria-hidden="true">/</span>\n' +
'        <a href="' + a + 'llms.txt">LLMs.txt</a>\n' +
'      </nav>\n' +
'      <span class="footer-copy">&copy; <span data-year>2026</span> RevHops. All rights reserved.</span>\n' +
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
(p.scripts || []).map(function (s) {
    return '<script src="' + a + s + '?v=' + STAMP + '"></script>\n';
  }).join('') +
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
    '\n<main' + (p.mainClass ? ' class="' + p.mainClass + '"' : '') + '>\n' +
    (p.bare ? '' : pageHero(p)) +
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
    /* `media: true` puts the site's empty-artwork well at the top of the
       card — literally .res-thumb and .res-thumb-ph off the resource cards,
       not a second object that looks like them. A dashed frame rather than
       a grey rectangle, because an empty frame reads as "no artwork yet"
       and a filled grey box reads as a broken image. Swap it for an <img>
       when the pictures land. */
    /* `art` swaps the well for a line drawing out of ART, on the same
       light plate the resource shelves give theirs (.res-thumb.is-art). */
    (o.art ? '          <span class="res-thumb pcard-thumb is-art">' + art(o.art) + '</span>\n'
     : o.media ? '          <span class="res-thumb pcard-thumb">' +
               '<span class="res-thumb-ph" aria-hidden="true"></span></span>\n' : '') +
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
    row: 'We\u2019ll help you identify where you\u2019re at, where you want to get to and the gap between the two. Required for all implementation projects.',
    h1: 'The plan before the build',
    lede: 'We&rsquo;ll help you identify where you&rsquo;re at, where you want to get to and the gap between the two. Required for all implementation projects.',
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
      { title: 'Assessment calls', art: 'assessment-call', copy: 'We&rsquo;ll conduct assessment calls to determine what&rsquo;s not working, where you want to go and what success looks like.' },
      { title: 'RevOps flowchart', art: 'flowchart', copy: 'We&rsquo;ll map out every customer interaction and revenue impact stage for your business.' },
      { title: 'Solution Design document', art: 'solution-doc', copy: 'A single document outlining where you&rsquo;re at, where you want to go and exactly how you&rsquo;ll get there.' }
    ],
    price: ['$3,000', 'Fixed price'],
    dur: ['2–3 weeks', 'Two workshops, one review'],
    next: ['Usually a build', 'Design does not oblige you to build with us'],
    kind: 'Project',
    results: 'Immediate',
    quad: [
      ['A written specification for your revenue system, produced before anyone touches a portal. Object model, lifecycle, pipelines, process map and the reports that depend on all of it.',
       'It is a document rather than a deck, detailed enough to hand to any competent builder.'],
      ['Builds that stall in week nine because nobody agreed in week one what a qualified lead was. Reports that three teams read three different ways.',
       'The disagreement is cheaper to have now, on paper, than later, in a change request.'],
      ['Two workshops with the people who actually work the system. Then the model written down and circulated as a draft, argued with, and revised.',
       'It closes with a walkthrough, a decision log and a build estimate that holds because the scope has stopped moving.'],
      ['Teams about to spend real money on an implementation, and teams who have already spent it once and would rather not repeat the experience.',
       'It works best when sales, marketing and finance can all put someone in the room.']
    ],
    caseIdx: 0
  },
  {
    slug: 'crm-implementations',
    name: 'CRM implementations',
    time: '6–12 weeks',
    row: 'Whether you\u2019re adding a CRM for the first time or migrating from old legacy tools, we\u2019ll build it from start to finish.',
    h1: 'Built once and handed over',
    lede: 'Whether you&rsquo;re adding a CRM for the first time or migrating from old legacy tools, we&rsquo;ll build it from start to finish.',
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
      { title: 'A CRM your team loves to use', art: 'crm-love', copy: 'You&rsquo;ll get a CRM that works with the way your team does business, not against you.' },
      { title: 'Full documentation', art: 'manual', copy: 'Every object, workflow and integration, with the reasoning attached. Like a user&rsquo;s manual, for your CRM!' },
      { title: 'Training &amp; support', art: 'training', copy: 'We don&rsquo;t build, launch and then skip town. We&rsquo;ll help train &amp; support your team to ensure adoption.' }
    ],
    price: ['From $5,000', 'Scoped and quoted after design'],
    dur: ['6–12 weeks', 'Weekly working sessions'],
    next: ['Hypercare included', 'Most teams move onto a retainer afterwards'],
    kind: 'Project',
    results: '6–8 weeks',
    quad: [
      ['A HubSpot portal built or migrated end to end by the same people who scoped it. Objects, properties, pipelines, automation, integrations, permissions and the reports that sit on top of all of it.',
       'It is built in the open, with your admin in the working sessions, and it ends with documentation and recorded training rather than a login and good luck.'],
      ['The portal only one person understands, and that person has left. Two pipelines called Renewals and nobody sure which one the forecast reads.',
       'Migrations that lose the history, or that go live on a promise and leave two systems disagreeing about the same number for a quarter.'],
      ['Foundations first: objects, properties, permissions and naming conventions, agreed and written down before a single workflow exists.',
       'Then build and migrate in weekly working sessions, run both systems in parallel until the numbers agree, and hand over with two weeks of hypercare while your team takes the controls.'],
      ['Teams standing up a CRM for the first time, and teams moving onto HubSpot with a decade of history that has to come with them.',
       'It works best where somebody internal is going to own the portal afterwards. If nobody is, a retainer is the more honest answer.']
    ],
    caseIdx: 1
  },
  {
    slug: 'hubspot-support-retainers',
    name: 'HubSpot support retainers',
    time: 'Monthly',
    row: 'HubSpot-specific admin support on call, without hiring full-time headcount. No limit on monthly hours; includes bi-weekly standups and project management access.',
    h1: 'A HubSpot admin on call',
    lede: 'HubSpot-specific admin support on call, without hiring full-time headcount. No limit on monthly hours; includes bi-weekly standups and project management access.',
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
      { title: 'HubSpot experts in your corner', art: 'hubspot-badge', copy: 'You&rsquo;ll get the HubSpot expertise you need to move quick, optimize your account and get results.' },
      { title: 'No limit on monthly hours', art: 'unlimited', copy: 'No limit on monthly hours - set pricing you can budget in, while saving on an otherwise FT hire.' },
      { title: 'Bi-weekly standups &amp; PM tool access', art: 'standups', copy: 'We&rsquo;ll have bi-weekly standups for our engagement and access to our project management tool.' }
    ],
    price: ['Starting at $3,500/mo', 'Set by how long you commit'],
    dur: ['Rolling monthly', 'Thirty days notice either way'],
    next: ['No cap on hours', 'The rate is set by the commitment, not by the clock'],
    kind: 'Retainer',
    results: 'First month',
    quad: [
      ['A named HubSpot admin on call. Build work, break-fix, reporting, data hygiene, integrations, training and a standing roadmap, without hiring the headcount.',
       'No cap on monthly hours. The rate is set by how long you commit, not by a clock, so nobody is deciding whether a question is worth the minutes.'],
      ['A portal that rots quietly because the person who half-knows it has a day job, and a full-time admin costs forty hours to get eight of real work.',
       'Improvements that only happen in a panic, and a workflow that breaks on a Friday afternoon with no one to send it to.'],
      ['One standing call a month on what shipped, what it cost and what is next. A roadmap review each quarter, agreed with you rather than presented to you.',
       'Requests go to a shared channel rather than a ticket form. Anything blocking revenue gets looked at the same day.'],
      ['Teams already live on HubSpot who need an admin but not a full-time one, and teams who have just finished an implementation and want the momentum to continue.',
       'Rolling monthly, thirty days notice both ways. Nobody has ever done better work because the client was stuck with them.']
    ],
    caseIdx: 2
  },
  {
    slug: 'revops-consulting',
    name: 'RevOps consulting',
    time: 'Monthly',
    row: 'RevOps consulting for new or growing RevOps leaders &amp; teams. Works closely with executive teams to ensure alignment. Includes on-site visits.',
    h1: 'Someone to think it through with',
    lede: 'RevOps consulting for new or growing RevOps leaders &amp; teams. Works closely with executive teams to ensure alignment. Includes on-site visits.',
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
      { title: 'RevOps experts in your corner', art: 'revops-bulb', copy: 'You&rsquo;ll get the RevOps expertise you need to align sales, marketing, service and finance and grow revenue.' },
      { title: 'No limit on monthly hours', art: 'unlimited', copy: 'No limit on monthly hours - set pricing you can budget in, while saving on an otherwise FT hire.' },
      { title: 'Bi-weekly standups &amp; PM tool access', art: 'standups', copy: 'We&rsquo;ll have bi-weekly standups for our engagement and access to our project management tool.' }
    ],
    price: ['Starting at $3,500/mo', 'Set by how long you commit'],
    dur: ['Rolling monthly', 'Fortnightly sessions'],
    next: ['Advice, not delivery', 'Build work is scoped and priced on its own'],
    kind: 'Retainer',
    results: '4–6 weeks',
    quad: [
      ['Fractional revenue operations leadership. What the system should be doing, what it is doing instead, and which of those gaps is actually costing you money.',
       'Advice with no build attached, so the recommendation is not quietly a quote. Delivery is scoped and priced on its own if you want it.'],
      ['A forecast nobody presenting it believes, stages that mean different things to different reps, and a sales team measured on something it cannot control.',
       'Tooling decisions made to settle an argument, and a quarterly plan that is a wish list rather than an order of operations.'],
      ['The first month is spent finding where revenue actually stalls, measured against the system rather than against what anyone remembers.',
       'Then a fortnightly session with whoever owns revenue, written up rather than left in a call recording, and a ranked order of operations each quarter. On-site when it matters.'],
      ['New or growing RevOps leaders who want someone to think it through with, and executive teams who need the go-to-market function to agree on what it is counting.',
       'It is the wrong call if what you need is hands on keyboard. That is a build, and it is priced as one.']
    ],
    caseIdx: 3
  },
  {
    slug: 'lead-to-cash-process-mapping',
    name: 'Lead to cash process mapping',
    time: '2–3 weeks',
    row: 'We\u2019ll map out every step from new lead to paid invoice. For most teams, this will be the first time you\u2019ve seen the whole thing at once.',
    h1: 'Every step on one page',
    lede: 'We&rsquo;ll map out every step from new lead to paid invoice. For most teams, this will be the first time you&rsquo;ve seen the whole thing at once.',
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
      { title: 'Complete flowchart', art: 'flowchart', copy: 'From lead generated to invoice paid, we&rsquo;ll map out every step along the way.' },
      { title: 'Stalled revenue insights', art: 'hourglass', copy: 'Where records sit and for how long, in days rather than in adjectives.' },
      { title: 'A ranked fix list', art: 'ranked', copy: 'Cheapest and highest impact first, with what it costs to leave each one alone.' }
    ],
    price: ['$4,200', 'Fixed price'],
    dur: ['2–3 weeks', 'Interviews, then one findings session'],
    next: ['Stands alone', 'Often the first step before a design engagement'],
    kind: 'Project',
    results: 'Immediate',
    quad: [
      ['Every step from first touch to paid invoice, mapped end to end across every team and every system, on one page.',
       'Handoffs, owners and system of record marked, including the spreadsheets quietly holding the whole thing together. For most teams it is the first time anyone has seen it all at once.'],
      ['Deals that stall at the seams between teams, where everyone owns a piece and nobody owns the join.',
       'Manual steps nobody has counted, work done twice in two systems, and an invoice that goes out late for a reason no one department can explain on its own.'],
      ['We interview marketing, sales, CS and finance separately. The gaps between the four accounts are usually the first finding.',
       'Then we follow real records through the real systems and time them, because the process people describe and the process that runs are rarely the same thing. It closes with the map and a ranked fix list.'],
      ['Teams who know something is slow but cannot say where, and teams about to buy software to fix a process they have never actually drawn.',
       'Often the first step before a design engagement, but it stands on its own and obliges you to nothing.']
    ],
    caseIdx: 4
  }
];

/* The free audit, shown at the foot of the services list on this page and on
   the homepage. Deliberately not a member of SERVICES: that array generates a
   detail page per entry, the pricing rows, the "often paired with" lists and
   the footer column, and the audit wants none of those. It has /audit. */
var AUDIT_ROW =
'      <a class="svc-row reveal" href="/audit">\n' +
'        <h3 class="svc-title">Free HubSpot audit</h3>\n' +
'        <span class="svc-time">2\u20133 days</span>\n' +
'        <p class="svc-copy">Complimentary audit. We\u2019ll look at your data hygiene, pipelines &amp; stages,\n' +
'          automations, integrations and adoption.</p>\n' +
'        <span class="svc-go">Read more <span class="arrow">&rarr;</span></span>\n' +
'      </a>\n';

/* ---------- the five case studies, all placeholder ---------- */

/* `svc` is which services the story belongs to, as service slugs. It is what
   the filters on /services match against, and it is placeholder like
   everything else here — set it properly when the real stories land, or the
   filter will confidently show the wrong work. */

/* ---------- the case study taxonomy ----------

   THIS IS THE BACKEND FOR THE /case-studies FILTER. Every axis the filter
   offers is built from the data below, so adding a tool to a case study puts
   that tool in the Tools used list, and nothing has to be typed twice.

   Three axes plus service:

     svc       one or more service slugs, from SERVICES
     crm       exactly one CRMS slug. Every engagement has a CRM at the
               middle of it, which is what makes this the one tool worth
               filtering on — the rest of the stack varies too much between
               clients to be a useful axis
     industry  one INDUSTRIES slug
     stage     one STAGES slug, shown as the Team size band. Growth stage
               was a second filter over this same field and is gone: the
               homepage maturity slider defines a stage BY its headcount, so
               the two could never disagree and the second one only made the
               column longer.

   THE TAGS ON THE FIVE CASES BELOW ARE PLACEHOLDERS, invented to give the
   filter something real to move. They are as fictional as [Client name] and
   the 00% figures. Correct them when the real write-ups land.
   ---------------------------------------------------------------------- */

var INDUSTRIES = [
  ['b2b-saas',              'B2B SaaS'],
  ['financial-services',    'Financial Services'],
  ['professional-services', 'Professional Services'],
  ['ecommerce',             'eCommerce']
];

/* The three CRMs worth asking about. A closed list, unlike the tool tags
   that used to be here: this is the question a visitor actually arrives
   with, and a derived list of fifteen logos was answering a question nobody
   asked. */
var CRMS = [
  ['hubspot',      'HubSpot'],
  ['salesforce',   'Salesforce'],
  ['gohighlevel',  'GoHighLevel']
];

/* `crm` is one slug or several. Several is how a migration reads: the tool
   they left is as much a reason to click as the one they landed on. */
function crmList(c) {
  return [].concat(c.crm);
}
/* and a firm can sit in two industries at once */
function industryList(c) {
  return [].concat(c.industry);
}

/* slug, stage name, headcount band. Both the name and the band come from
   STAGES in assets/js/maturity-slider.js. The 1,000+ band came off on
   15 September: no case study sits in it, and a filter option that can
   only ever return nothing is a dead end the visitor has to discover by
   clicking it. The slider keeps its own Enterprise stage, which is its own
   data. The name is unused on this page now that the Growth stage filter
   has gone; it stays because the band is meaningless without it. */
var STAGES = [
  ['startup',    'Startup',    '1&ndash;10'],
  ['scaleup',    'Scaleup',    '10&ndash;50'],
  ['growth',     'Growth',     '50&ndash;200'],
  ['maturity',   'Maturity',   '200&ndash;1,000']
];

/* THE FIVE CLIENTS, in the order the homepage's maturity slider recommends
   them — startup, scaleup, growth, maturity, enterprise. Slug, name and
   figures are read by three places at once: the poster cards on /services
   and /case-studies, and the case study's own page. The slider in
   assets/js/maturity-slider.js carries the same five by hand and links to
   these slugs, so a name changed here has to change there too.

   `figs` no longer reaches a card. The cards carried two figures until 15
   September and now carry the services the case is tagged with: a card is
   the door, and the numbers belong on the page behind it. The pairs stay
   here because casePageOld still reads them. */
var CASES = [
  { slug: 'Ike-Commercial-Real-Estate', name: 'Ike Commercial Real Estate',
    figs: [['3,500', 'Records migrated'], ['6 wks', 'Assessment to live']],
    svc: ['solution-design', 'crm-implementations'],
    location: 'Scottsdale, AZ',
    crm: ['hubspot', 'gohighlevel'], industry: 'professional-services', stage: 'startup',
    img: 'assets/img/case-studies/ike-commercial-real-estate.webp',
    copy: {
      lede: 'Ike Commercial Real Estate is a small firm in a relationship business, running on a CRM that made them work for every piece of context. In six weeks we assessed, designed, built and trained them onto HubSpot Marketing and Sales Hub, shaped around the way they actually work with clients. Four people now run their entire day out of one system.',
      problem: {
        h: 'The CRM was the obstacle, not the tool',
        p: [
          'Ike Commercial Real Estate helps businesses find commercial space and then sits on their side of the table for the negotiation: terms, location, price. It is a relationship business, and the way Ike builds and keeps those relationships is the thing clients are buying. Blake, their CEO, had already done the research and decided HubSpot was where they needed to be. What he did not have was a way to get there without losing anything on the way out of Go High Level.',
          'The day to day was the real problem. In Go High Level, companies and contacts are not natively tied to each other, and even where a link exists, a note left on one record does not show up on the other. For a firm whose entire value is knowing its clients, that gap is expensive. The context for a single relationship sat in pieces, and assembling it before a call meant opening records one at a time and filling in the rest from memory. Every task took more steps than it should have. The tool was a source of friction rather than an enabler.',
          'Email was its own problem. The sending domain was not properly verified, campaigns were landing in the Promotions tab instead of the inbox, and the numbers underneath were quietly underperforming as a result.'
        ]
      },
      solution: {
        h: 'Assess first, then build around how Ike actually works',
        p: [
          'We opened with assessment workshops, run with both the stakeholders and the people who would be in the tool every day. Not a requirements form, a conversation about what the work looks like. From that we wrote an implementation scope and agreed it before anything was built, so the project had a defined destination rather than a direction.',
          'Ike does a couple of things with clients that no out of the box CRM object describes, and those are the things that make them worth hiring. So we built custom objects around them rather than asking Ike to bend their process to fit a standard deal pipeline. This was the most interesting part of the build and the part that took the most thinking.',
          'Then the migration: 2,000 company records and 1,500 contacts moved across, properly associated on the other side. Notes and open tasks were the catch. Go High Level does not include either in its standard export, which for Ike meant leaving behind hundreds of client notes and live follow ups, the exact history the whole business runs on. We wrote a custom script to pull that data out of GHL and bring it over with everything else. Alongside the build we fixed the email foundation, verified the sending domain, and trained the team. After launch their feedback drove a round of small adjustments, which is usually where adoption is won or lost.'
        ]
      },
      results: {
        h: 'One system, with more in it than they had before',
        p: [
          'Four people now work exclusively out of HubSpot. Everything they knew about a client is in one place, with the note history that came with them, and nobody is checking a second tool to find the rest.',
          'They also have things they never had. Email and website activity against the contact record, lead scoring, and visible progress through nurturing. For a team whose edge is knowing their clients well, that is a real addition rather than a dashboard: it is context they could not previously see, arriving without anyone having to go and get it.',
          'The whole engagement, from the first assessment workshop to a trained team working live, took about six weeks.'
        ],
        /* [figure, what it measures, direction]. No arrows on this one: all
           three are counts, not movements. */
        stats: [
          ['5,000+', 'Records migrated successfully from GHL', ''],
          ['6 weeks', 'Assessment to trained and live', '']
        ]
      },
      /* the quote is the one thing still outstanding, so it keeps the
         bracketed placeholder the other four have */
      quote: {
        cite: 'Blake Hardison <span class="sep">|</span> CEO, Ike Commercial Real Estate',
        photo: 'assets/img/case-studies/blake-hardison.webp'
      }
    } },

  { slug: 'The-Davani-Group', name: 'The Davani Group',
    figs: [['32%', 'Shorter sales cycle'], ['00h', '[measure]']],
    svc: ['crm-implementations', 'lead-to-cash-process-mapping'],
    location: 'Seattle, WA',
    crm: 'hubspot', industry: 'professional-services', stage: 'scaleup',
    img: 'assets/img/case-studies/the-davani-group.webp',
    copy: {
      lede: 'The Davani Group bought HubSpot and were then left alone with it. We mapped their lead to cash process end to end, built the agreed version into the CRM, and gave a founder-led sales team a process that no longer lives in anybody\u2019s head. The sales cycle came down by a third.',
      problem: {
        h: 'They owned the tool. Nobody had set it up.',
        p: [
          'The Davani Group sources and sells custom stone surfaces for homes and businesses, a team of twenty five in a trade where the work is won on relationships and finished on site. They had already bought HubSpot before we met them, which is usually a good sign. Then nothing happened. The licence was live, nobody had configured it, and within months they were paying in full for a CRM doing a fraction of what they bought it for.',
          'Underneath that was the harder problem: there was no sales process to configure. What happened after a lead arrived depended on which salesperson picked it up and what they remembered to do that week. A good deal of the selling was still founder-led, and the rest of it lived in the heads of individual reps. Nothing was written down, so nothing could be repeated, taught or handed over.',
          'Tracking a deal meant rebuilding the picture by hand every time somebody asked. Leadership had no way to answer how much was in the pipeline, how fast it was moving, or where it kept getting stuck.'
        ]
      },
      solution: {
        h: 'Map the whole thing first, then build it',
        p: [
          'We opened with a lead to cash process design engagement, run with the operations admin and the sales team rather than around them. Every step went on the map, from the moment a lead arrives to the moment an invoice is collected, including the parts that existed only as habit.',
          'Seeing it end to end was itself the finding. It was the first time anyone at Davani had looked at the whole process laid out in one place, and it showed them things no CRM project would have: where their own offer created friction for a customer, and where the service could be better before any software was involved.',
          'The implementation then put the agreed process into HubSpot. A pipeline whose stages mean something, the workflows that fire on a closed deal to start customer onboarding and hand the job to the project side, and the invoicing end joined up rather than left to memory. Adoption is where these projects die, and this one met the usual resistance. It goes easier when the tool has been shaped around the business instead of the business bent around the tool, which is the whole argument for mapping first.'
        ]
      },
      results: {
        h: 'A process that runs without being remembered',
        p: [
          'The sales cycle is 32% shorter. The time a rep spends tracking and managing their own pipeline went from hours to minutes, because the deal record is now the work rather than a report written about the work afterwards.',
          'Sales leadership can see pipeline velocity, forecast off something better than a feeling, and look at where deals stall rather than guess at it. A stalling deal is visible while there is still time to save it.',
          'The process itself is the asset they did not have before. It is written down, so a new hire can be taught it, the founder can step out of a deal without it going quiet, and improving it is something the business can now do on purpose.'
        ],
        stats: [
          ['32%', 'Shorter sales cycle', 'down'],
          ['Minutes', 'Pipeline admin that used to take hours', '']
        ]
      },
      /* the quotation itself is still outstanding */
      quote: {
        text: 'Working with RevHops was a breeze. Questions are answered and weekly check ins are done, covering everything that needs to be discussed.',
        cite: 'Lucy Espino <span class="sep">|</span> Head of Ops, The Davani Group',
        /* the client's mark rather than a headshot, so it is contained in
           the circle rather than cropped to fill it */
        photo: 'assets/img/logos/dg.webp',
        photoMark: true
      }
    } },

  { slug: 'Insurance-AUM', name: 'Insurance AUM',
    /* casePageOld still reads figs; no figures on this one yet */
    figs: [['00%', '[measure]'], ['00', '[measure]']],
    svc: ['crm-implementations', 'hubspot-support-retainers'],
    location: 'Malvern, PA',
    crm: 'hubspot', industry: 'professional-services', stage: 'scaleup',
    img: 'assets/img/case-studies/insurance-aum.webp',
    copy: {
      lede: 'Insurance AUM has a membership database and a platform it wants that audience registered on, and before we met there was no system for connecting the two. We designed and built the marketing automation to nurture and engage their members in HubSpot, tied it to in-app activity, and built the reporting to show what was working. Then we stayed on through a retainer to support the marketing and sales teams.',
      problem: {
        h: 'A membership database with no way to engage it',
        p: [
          'Insurance AUM is a professional services firm based in Malvern, Pennsylvania. Its value depends on an engaged membership, and on getting the people in its database registered on the platform. The audience was already there. What was missing was any systematic way of talking to it.',
          'Engagement happened when somebody found the time for it. Nothing nurtured a contact toward registering, and nothing responded to what a member did or did not do once they were in. The database was not segmented either, so there was no way to say something different to a person based on their role or their industry.',
          'And nobody could say which efforts were growing membership. Without reporting built around that question, there was no way to tell what was working and what to stop doing.'
        ]
      },
      solution: {
        h: 'Campaigns that respond to what members actually do',
        p: [
          'We started with the database. Contacts were segmented by buyer type, using job title, role and industry, so messaging and outreach could be written for the person receiving it rather than for everyone at once.',
          'Then the campaigns. We designed and built the workflows, automations and emails that move a contact toward registering and keep a member engaged afterwards, with retargeting ads running alongside them. The part that makes it work is the in-app data: user activity and engagement from the platform sit inside HubSpot, so a campaign can react to what a member has actually done rather than guess at it.',
          'Last, the reporting. Custom reports and dashboards built around the two questions the team needed answered: which efforts are increasing membership, and which are increasing member engagement.'
        ]
      },
      results: {
        h: 'A system for engagement and a view of what works',
        p: [
          'Engaging the membership is a system now rather than a job someone has to remember. Contacts are nurtured toward registration, members hear what is relevant to their role and industry, and the messaging follows how they use the platform.',
          'The team can see what is working. The dashboards connect campaign effort to membership and engagement, so decisions about where to spend time and budget start from the numbers.',
          'After the implementation, Insurance AUM kept us on through a HubSpot support retainer as an extra pair of hands for the marketing and sales teams. Part of that work has been a LinkedIn retargeting campaign, which we planned and built, to promote their industry-specific regional events around the country.'
        ]
      }
    } },

  { slug: 'Ixly', name: 'Ixly',
    /* casePageOld still reads figs; no figures on this one yet */
    figs: [['00%', '[measure]'], ['00', '[measure]']],
    svc: ['solution-design', 'crm-implementations', 'revops-consulting'],
    location: 'Utrecht, Netherlands',
    crm: 'hubspot', industry: 'b2b-saas', stage: 'scaleup',
    img: 'assets/img/case-studies/ixly.webp',
    copy: {
      lede: 'Ixly is a B2B SaaS company in the HR and talent space, selling several offers out of a single pipeline. We mapped their go to market process in person in Utrecht, implemented Sales Hub and Marketing Hub around it, and built the reporting their executive team now uses to measure growth. We stayed on afterwards on a RevOps consulting retainer.',
      problem: {
        h: 'Several offers and one pipeline',
        p: [
          'Ixly builds software for HR and talent teams, and it sells more than one offer. Before we worked together, every one of those offers ran through the same pipeline.',
          'With everything jumbled together, growth within each service line could not be tracked on its own. Neither could renewals, or customers moving to and from other service lines. For a SaaS business with more than one product, those are the numbers that matter most, and they were the ones Ixly could not see.',
          'Marketing had the same problem from the other side. There was no way to segment the audience by intent, by persona or by firmographic data, so there was no way to decide who should hear what.'
        ]
      },
      solution: {
        h: 'Mapped in the room before anything was built',
        p: [
          'The engagement started as a paid solution design project. We met the team in person in Utrecht and mapped their go to market process from start to finish, with the people who run it in the room.',
          'That map became the brief for the implementation of Sales Hub and Marketing Hub. The offers were separated so that each service line, its renewals and its movement to and from the others could be tracked on its own terms. The database was set up to segment by intent, persona and firmographic data, so messaging could be aimed rather than broadcast.',
          'We also rebuilt their email templates as custom-coded templates for the product marketing emails and the newsletter. And for the executive team, we built a suite of custom reports and dashboards to measure growth KPIs on a weekly, monthly and quarterly basis.'
        ]
      },
      results: {
        h: 'Growth they can read one service line at a time',
        p: [
          'Each service line can now be read on its own. Growth in one is no longer hidden inside the total, and renewals and customers moving between service lines are tracked rather than pieced together.',
          'Marketing reaches an audience segmented by intent, persona and firmographics, through templates built for the emails they actually send.',
          'The executive team measures growth every week, month and quarter from dashboards built for that job. After the implementation we moved onto a RevOps consulting retainer, so the system keeps pace with the business rather than falling behind it again.'
        ]
      }
    } },

  { slug: 'Core-Income-Advisors', name: 'Core Income Advisors',
    figs: [['00%', '[measure]'], ['$00k', '[measure]']],
    svc: ['hubspot-support-retainers'],
    location: 'Twin Cities, Minnesota',
    crm: 'hubspot', industry: 'financial-services',
    /* 30 to 100 people, which straddles two bands; the larger one */
    stage: 'growth',
    img: 'assets/img/case-studies/core-income-advisors-team.webp',
    copy: {
      lede: 'Core Income Advisors had been through HubSpot partner agencies before and come away with recommendations that never solved the problem in front of them. Their COO evaluated several firms and chose us. The sales, marketing and operations teams now have a standing weekly session and a specialist who has learned how the business makes money.',
      problem: {
        h: 'Advice from people who had not learned the business',
        p: [
          'Core Income Advisors is a financial services firm. Deborah Isensee joined as COO and, soon after, went looking for help with HubSpot. They were not starting from nothing: they had hired HubSpot partner agencies before.',
          'That was the problem. None of them had stopped to learn how the business actually worked, so what came back was generic. The advice was reasonable in the abstract and did not touch the problems the team had. Money had been spent and the platform still was not doing what they needed it to do.',
          'Deborah evaluated several partners before picking one. That is the right way to buy this, and a useful thing to be measured against.'
        ]
      },
      solution: {
        h: 'A specialist on the team, not a project with an end date',
        p: [
          'The engagement is a HubSpot support retainer, which in practice means the team has a dedicated HubSpot specialist and a RevOps expert without either sitting on the payroll. There is no statement of work to point at when something new comes up, which is the whole point.',
          'Every week people bring what they have: a question, something broken, a report nobody can build. We prioritise it together into a task list and then work it. The standup has sales, marketing and operations in the room, because the work crosses all three and the handovers between them are usually where the problem is.',
          'What gets built is whatever moves revenue. Lead generation, sales enablement, operations reporting. Specific functionality, workflows, sequences and dashboards, each one built around how Core Income sells rather than how HubSpot demonstrates.'
        ]
      },
      results: {
        h: 'The platform does what the business needs it to',
        p: [
          'The team stopped working around HubSpot and started asking it for things. Reporting, workflows, sequences and dashboards exist now because somebody raised them at a standup and they were built that week.',
          'The other half of the value is being told no. Knowing early and plainly what the platform will not do is worth as much as knowing what it will, and it is the part a partner who has not learned your business cannot give you.'
        ]
      },
      quote: {
        text: 'Our experience working with RevHops to build out specific functionality, reporting, workflows, sequences and dashboards has exceeded expectations. Having worked with HubSpot consultant agencies in the past - and failed, RevHops takes on the exact opposite approach. James has taken the time to learn our business model, understand the complexities and remained confident and transparent on what we can/cannot do within the platform. Looking forward to continued partnership with RevHops, excited to exceed expectations well into the future!',
        cite: 'Deborah Isensee <span class="sep">|</span> COO, Core Income Advisors',
        photo: 'assets/img/case-studies/deborah-isensee.webp'
      }
    } },

  { slug: 'Woodside-Homes', name: 'Woodside Homes',
    figs: [['3', 'business units'], ['00d', '[measure]']],
    svc: ['solution-design', 'hubspot-support-retainers'],
    location: 'SLC, UT',
    crm: 'hubspot', industry: 'professional-services', stage: 'maturity',
    img: 'assets/img/case-studies/woodside-homes.webp',
    copy: {
      lede: 'Woodside Homes builds production homes across several regions, with acquired builders rolling up under one business. Management could not see which marketing was producing leads and sales. We spent the time to learn what each team actually needed to see, built the reporting to match, and taught the people who use it.',
      problem: {
        h: 'Nobody could see which marketing was working',
        p: [
          'Woodside Homes is a large production home builder with several acquisitions sitting under the business, spread across regions, each arriving with its own history and its own way of counting things. Management had a simple question the reporting could not answer: which marketing initiatives are generating leads and sales, and where should the next dollar of effort and budget go?',
          'Underneath that, the marketing team was spending its time hunting for numbers rather than acting on them. What mattered was somewhere in HubSpot, and getting to it meant knowing where to dig. When finding a number is work, people stop looking, and decisions end up being made on whatever somebody remembers.',
          'The rollups made it harder again. With no way to break performance out by region and by business unit, the group numbers averaged away the very thing an operator needed to see. At community level there was nothing at all, so nobody could say which communities were growing and which had stalled.'
        ]
      },
      solution: {
        h: 'Ask everyone what they need to see, then build that',
        p: [
          'The first part of the work was not building anything. We went and understood the reporting needs of every group that had one, down to the marketing team, who are the people actually running the initiatives being measured. We worked directly with the head of paid media and with the internal product owner for HubSpot, which is the pairing that makes a build like this stick after we leave.',
          'Then the reporting itself: what matters, front and centre, without anyone having to go looking for it. Performance broken out by region and by business unit, so an acquired builder can be read on its own terms rather than averaged into the group. And reporting at community level, so it is obvious which communities are growing and which have stopped.',
          'A large part of the engagement was teaching. Sitting with people and showing them how to work HubSpot efficiently, against the job they actually do rather than a training deck. A report nobody knows how to read is the same as no report.'
        ]
      },
      results: {
        h: 'The numbers are where people look',
        p: [
          'Management can see which marketing is producing leads and sales, which turns the budget conversation into a question of evidence rather than instinct.',
          'Regional and business unit leaders see their own performance instead of the group average, and community-level reporting shows where growth is and where it has stopped. That last one reaches past marketing: the finance team uses it to price homes.',
          'And the team can work the platform for itself. What they need is in front of them, and when something new is needed they know how to build it rather than wait for someone who can.'
        ]
      }
    } },

  { slug: 'Ignite-Group', name: 'Ignite Group',
    figs: [['3', 'countries unified'], ['8', 'week build']],
    svc: ['revops-consulting', 'crm-implementations'],
    location: 'Amsterdam, Netherlands',
    crm: ['salesforce', 'hubspot'],
    industry: ['professional-services', 'financial-services'],
    /* 300 people, so the 200-1,000 band. The maturity slider recommends
       this one at its Enterprise stage, which is its own data in
       assets/js/maturity-slider.js and does not read this field. */
    stage: 'maturity',
    img: 'assets/img/case-studies/ignite-group-amsterdam.webp',
    copy: {
      lede: 'Ignite Group helps businesses win grants and subsidies across the Netherlands and Germany. Their Salesforce had not been properly owned since the admin who built it left, and a newly acquired division was running on spreadsheets and Word documents. We assessed, designed, built and trained them onto HubSpot, and stayed on for the year that followed.',
      problem: {
        h: 'A CRM nobody had owned since the admin left',
        p: [
          'Ignite Group specialises in grants and subsidies: finding clients the right schemes, putting the applications together, and carrying the administration around them, with a grant portal and an academy alongside. They came to us through their investor, Silvertree, wanting an assessment of a Salesforce instance that no longer matched how the business actually worked. It was slowing down their ability to scale revenue and getting in the way of reporting. They could not say what was working, or where the opportunities were.',
          'What we found was a system nobody had maintained since its original admin left. The data was inaccurate enough that sales had gone back to keeping their own spreadsheets on deal progress. The team worked off the handful of screens they knew were safe and avoided the parts of Salesforce they did not understand. They knew what they were missing. They did not have the time or the expertise to change it.',
          'The recently acquired German division had it worse: the whole process, marketing to sales to quoting to billing, was manual, held in spreadsheets and Word documents. After a run of acquisitions the group was struggling to operate as one company, with no central sales and marketing approach, no clear definitions or SLAs, and legacy systems nobody trusted.'
        ]
      },
      solution: {
        h: 'The work before the work',
        p: [
          'We proposed a phased approach: assessment, solution design, implementation, training. The first job was to gather and document the central sales and marketing processes in both the Netherlands and Germany, as they actually ran rather than as anyone assumed they did.',
          'Out of that came a set of requirements, and with them a decision Ignite could make on evidence instead of instinct: bend Salesforce far enough to fit the reality of the teams, or move to HubSpot. They chose HubSpot, for its lower total cost of ownership, an interface the team would actually use, and a faster time to launch on an implementation this size.',
          'With every stakeholder aligned on the design and a new Revenue Operations Manager in the seat, we ran the build as weekly sprints over eight weeks, each one covering what had moved, what had to be decided and what was in the way. Near the end we held what we call the 80% meeting: a soft launch of the new processes and tools to the whole team, to collect feedback while there is still time to act on it. Hearing that something is amazing is good. Hearing that it would be better if it did X is more useful, and it is why the meeting exists. For Ignite it went the way we wanted.'
        ]
      },
      results: {
        h: 'One platform, and a view of the whole funnel',
        p: [
          'A sales organisation spread across three countries now runs in one place. Sales and marketing activity sits in a single platform rather than two systems and a drawer of spreadsheets, so conversion can be analysed rather than estimated, and the go to market strategy can be argued with numbers attached to it.',
          'Administering it takes less of an admin\u2019s week, and using it takes less of everyone else\u2019s. That was the test the team applied at the 80% meeting, and it is the one that decides whether a CRM is still being used a year later.',
          'We stayed on afterwards for a twelve month support retainer, which is the difference between a migration and a system that keeps working once the project team has gone.'
        ],
        stats: [
          ['8 weeks', 'Weekly sprints to launch', ''],
          ['3', 'Countries on one platform', '']
        ]
      },
      quote: {
        text: 'At first I was skeptical. Moving house can be a lot to handle, but when you move in the end, you always feel better right? Well, we are in the same place now! Not only is HubSpot a lot easier to manage from an Admin perspective, it\u2019s also way easier on our users. Henrik and James made sure we had the tools at hand to make the most out of this! Thanks to RevHops, we are now in a spot where we have a springboard to a better integrated view of our sales and marketing activities. We have a better grasp on our GTM strategies since we can now better analyze conversions and have everything in one platform.',
        cite: 'Jeroen Kunst <span class="sep">|</span> RevOps Manager, Ignite Group',
        photo: 'assets/img/case-studies/jeroen-kunst.webp'
      }
    } }
];

/* The filter vocabulary, read back into words for the meta column on a case
   study page. Both halves of the site therefore agree by construction: a
   case tagged `crm: 'hubspot'` shows "HubSpot" on its own page and answers
   the HubSpot checkbox on /case-studies, because both come from these
   arrays. The lookups are built after SERVICES, CRMS, INDUSTRIES and STAGES
   are all defined, which is why they sit here rather than at the top. */
function labelFor(list, val, idx) {
  for (var i = 0; i < list.length; i++) {
    if (list[i][0] === val) return list[i][idx];
  }
  return val;
}
function serviceName(slug) {
  for (var i = 0; i < SERVICES.length; i++) {
    if (SERVICES[i].slug === slug) return SERVICES[i].name;
  }
  return slug;
}

/* ---------- the tool clump, straight off the homepage ----------

   Two rows that spread sideways rather than stacking, full-bleed, each mark
   nudged off the line by nth-child in the stylesheet. The order is the
   homepage's and has to stay that way: the offsets are positional, and
   HubSpot sits fourth of seven in the top row because that is the one spot
   the edge mask can never reach.

   data-hero / data-big / data-mid / data-stack are size tiers, not
   decoration — see .tool-mark img in site.css. */
var TOOLS = [
  [['marketo', 'Marketo', ''], ['microsoft365', 'Microsoft 365', ''],
   ['salesforce', 'Salesforce', 'data-big'], ['hubspot', 'HubSpot', 'data-hero'],
   ['pipedrive', 'Pipedrive', 'data-mid'], ['google-workspace', 'Google Workspace', 'data-stack'],
   ['netsuite', 'Oracle NetSuite', '']],
  [['quickbooks', 'Intuit QuickBooks', ''], ['zoominfo', 'ZoomInfo', ''],
   ['slack', 'Slack', ''], ['claude', 'Claude', ''], ['meta.svg', 'Meta', ''],
   ['chargebee', 'Chargebee', ''], ['salesmsg', 'Salesmsg', ''],
   ['advizorpro', 'AdvizorPro', 'data-stack']]
];

/* `skip` drops marks by slug. /hubspot uses it: a wall of tools under the
   heading "Connect HubSpot to all the tools in your stack" with HubSpot's
   own mark sitting in the middle of it is the sentence disagreeing with the
   picture. The offsets in the stylesheet are positional, so the row closes
   up around the gap rather than leaving one — which is what a loose clump
   should do anyway. */
function toolClump(depth, skip) {
  var a = up(depth);
  var drop = skip || [];
  var rows = TOOLS.map(function (row) {
    return row.filter(function (t) { return drop.indexOf(t[0]) === -1; });
  });
  /* EVEN THE ROWS UP when a skip empties one. /pipedrive drops three marks
     from the top row, which left four marks strung across the width above
     eight. Marks move up from the front of the second row until the two are
     within two of each other. /hubspot, at six over eight, is already inside
     that and does not change; the homepage passes no skip at all. */
  while (rows[1].length - rows[0].length > 2) rows[0].push(rows[1].shift());
  return '    <div class="tool-clump reveal">\n' +
    rows.map(function (row) {
      return '      <div class="tool-row">\n' +
        row.map(function (t) {
          var file = /\./.test(t[0]) ? t[0] : t[0] + '.webp';
          return '        <span class="tool-mark"><img src="' + a + 'assets/img/tools/' +
                 file + '" alt="' + t[1] + '"' + (t[2] ? ' ' + t[2] : '') + ' loading="lazy"></span>';
        }).join('\n') + '\n' +
      '      </div>';
    }).join('\n') + '\n' +
    '    </div>\n';
}

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

/* one poster card off the homepage rail

   The data- attributes are the filter's whole vocabulary. /services reads
   data-services only; /case-studies reads all four. They are written on
   every card everywhere, because a card that knows what it is costs nothing
   and a card that only knows it on one page is how the two filters drift. */
function caseCard(c, depth, cls) {
  var svc =
    (c.svc      ? '\n           data-services="' + c.svc.join(' ') + '"'         : '') +
    (c.crm      ? '\n           data-crm="' + crmList(c).join(' ') + '"'         : '') +
    (c.industry ? '\n           data-industry="' + industryList(c).join(' ') + '"'  : '') +
    (c.stage    ? '\n           data-stage="' + c.stage + '"'                    : '');
  return '<a class="case-card' + (cls ? ' ' + cls : '') + '" href="' + '/case-studies/' + c.slug + '"' + svc + '>\n' +
    '          <img src="' + up(depth) + (c.img || 'assets/img/case-study-placeholder.svg') +
      '" alt="" aria-hidden="true" loading="lazy">\n' +
    '          <div class="case-body">\n' +
    '            <div class="case-text">\n' +
    '              <h3 class="case-title">' + c.name + '</h3>\n' +
    '              <span class="case-svc">\n' +
    c.svc.slice(0, 2).map(function (slug) {
      return '                <span>' + serviceName(slug) + '</span>';
    }).join('\n') + '\n' +
    '              </span>\n' +
    '            </div>\n' +
    '            <span class="case-go" aria-hidden="true">&rarr;</span>\n' +
    '          </div>\n' +
    '        </a>';
}

/* ---------- the /case-studies filter column ----------

   Five groups of checkboxes and a clear. Each option carries three things:

     data-group  which group it belongs to, for the OR-within / AND-across
                 rule the matcher applies
     data-field  which card attribute it tests. Team size and Growth stage
                 are two groups reading the same data-stage field
     data-val    the token to look for in that attribute

   The markup is dumb on purpose: site.js reads those three attributes and
   nothing else, so a new axis is a new csGroup call here and no JavaScript.
   ---------------------------------------------------------------------- */
function csOpt(group, field, val, label, on) {
  return '          <button class="cs-opt" type="button" role="checkbox" aria-checked="' + (on ? 'true' : 'false') + '"\n' +
         '                  data-group="' + group + '" data-field="' + field + '" data-val="' + val + '">\n' +
         '            <span class="cs-box" aria-hidden="true"><svg viewBox="0 0 12 12"><path d="M2 6.3l2.6 2.6L10 3.2"/></svg></span>\n' +
         '            <span class="cs-opt-label">' + label + '</span>\n' +
         '          </button>';
}

function csGroup(title, opts) {
  return '\n      <div class="cs-group">\n' +
         '        <h3 class="cs-group-title">' + title + '</h3>\n' +
         '        <div class="cs-opts" role="group" aria-label="' + title + '">\n' +
         opts.join('\n') + '\n' +
         '        </div>\n' +
         '      </div>\n';
}

function csSide() {
  /* no .reveal on the column: it sticks, and the reveal transform would
     take the sticky positioning with it */
  return '    <aside class="cs-side" data-cs-filters aria-label="Filter case studies">\n' +
'      <div class="cs-side-head">\n' +
'        <h2 class="cs-side-title">Filter</h2>\n' +
'        <button class="cs-clear" type="button" data-cs-clear>Clear filters</button>\n' +
'      </div>\n' +

  /* Service loads all five checked, which is the same result as none
     checked and reads better: the page opens showing the whole shelf and
     every other group opens empty. */
  csGroup('Service', SERVICES.map(function (s) {
    return csOpt('service', 'services', s.slug, s.name, true);
  })) +

  csGroup('CRM used', CRMS.map(function (t) {
    return csOpt('crm', 'crm', t[0], t[1], false);
  })) +

  csGroup('Industry', INDUSTRIES.map(function (i) {
    return csOpt('industry', 'industry', i[0], i[1], false);
  })) +

  csGroup('Team size', STAGES.map(function (s) {
    return csOpt('size', 'stage', s[0], s[2] + ' people', false);
  })) +
'    </aside>\n';
}

/* ---------- one service page ----------

   Four things: a header carrying the service name, the four facts a buyer
   asks first and a line drawing of the thing; a quadrant answering the four
   questions they ask next; what they actually get; and that service's own
   booking widget.

   The quadrant is four cells split by two hairlines rather than four
   floating cards: it reads as one object with four parts, which is what it
   is, and it does not repeat the .pcard grids used elsewhere.

   No closing panel. The booking widget IS the call to action, and a
   'Schedule a discovery call' button sitting underneath a scheduler is
   asking twice. */

var QUAD_TITLES = ['What it is', 'Problems it solves', 'Our process', 'Who it is for'];

/* Every service will eventually point at its own HubSpot meeting link.
   Until James splits them out they all land on the discovery call, so the
   fallback lives here rather than repeated five times in SERVICES. */
var BOOKING_DEFAULT = 'https://revhops.com/meetings/revhops/discovery-call?embed=true';

function meetingEmbed(src) {
  return '      <!-- Start of Meetings Embed Script -->\n' +
         '      <div class="meetings-iframe-container" data-src="' + src + '"></div>\n' +
         '      <script type="text/javascript" src="https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js"><\/script>\n' +
         '      <!-- End of Meetings Embed Script -->\n';
}

function servicePage(s) {
  var body = '';

  /* the quadrant */
  body += '\n<section class="section svc-quad-section">\n' +
'  <div class="shell">\n' +
'    <div class="quad reveal">\n' +
    s.quad.map(function (cell, i) {
      return '      <div class="quad-cell">\n' +
             '        <h2 class="quad-title">' + QUAD_TITLES[i] + '</h2>\n' +
             cell.map(function (t) {
               return '        <p class="quad-copy">' + t + '</p>';
             }).join('\n') + '\n' +
             '      </div>';
    }).join('\n') + '\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n';

  /* what they actually get. `leave` is the list that used to run under
     'What you have on the last day' — same three things, said as a
     deliverable rather than as a moment in the calendar. */
  body += section(
    secHead('What you get') +
'    <div style="margin-top:clamp(22px,2.6vw,34px)">\n' +
    pcards(s.leave.map(function (d) {
      return { title: d.title, copy: d.copy, art: d.art, media: true };
    }), 'pcards-3') +
'    </div>\n', 'section-tight');

  /* the service's own scheduler */
  body += '\n<section class="section-tight svc-book">\n' +
'  <div class="shell">\n' +
    secHead('Schedule a discovery call to learn more', null, 'centred') +
'    <div class="meet-wrap">\n' +
    meetingEmbed(s.booking || BOOKING_DEFAULT) +
'    </div>\n' +
'  </div>\n' +
'</section>\n';

  return {
    file: 'services/' + s.slug + '.html',
    depth: 1,
    navCurrent: '/services',
    title: s.title,
    description: s.desc,

    /* the service's NAME, not a slogan. This page is reached from a list of
       five names and from a nav item called Services; anything else at the
       top makes the visitor check they landed on the right one. */
    h1: s.name,

    /* THE HOMEPAGE'S OWN WORDS. The page used to open on a second, longer
       description written only for it, so the card someone clicked and the
       page they landed on said different things about the same service.
       `lede` is now that card's copy verbatim — if one changes, change both.
       index.html is hand-maintained, so nothing enforces it. */
    lede: s.lede,

    /* same header spacing as /services: no artwork, full-width type */
    heroClass: 'page-hero-nomedia page-hero-svc',
    eyebrow: ['All services', '/services'],
    meta: [
      ['Timeline', s.time],
      /* "Starting at" rather than "From" as the label, per James, 13
         September. The test still accepts both prefixes so an entry written
         either way lands on the same row; only the label changed. */
      [/^(Starting at |From )/.test(s.price[0]) ? 'Starting at' : 'Price',
       s.price[0].replace(/^(Starting at |From )/, '')],
      ['Time to results', s.results],
      ['Type', s.kind]
    ],

    noClose: true,
    body: body
  };
}

/* ---------- one case study page ----------

   THIS IS THE TEMPLATE. Every case study is this shape, and the shape is the
   argument: the same three moves in the same order on every page, so a
   visitor comparing two of them is comparing the work rather than learning a
   new layout twice.

   It borrows both of its objects from /case-studies rather than inventing
   any. The header plate is .cs-head-panel, left-aligned here and carrying a
   description under the title. Below it is the same 20/80 .cs-layout: the
   filter column becomes a meta column listing exactly what the page can be
   filtered on, and the card grid becomes the story.

   The three sections are fixed — THE PROBLEM, THE SOLUTION, THE RESULTS —
   and only their headings change per case. Everything inside them is a
   placeholder, marked with brackets, because the template ships before the
   copy does.

   No hero. `bare: true` skips pageHero and the plate carries the
   data-nav-clear sentinel itself, the same way /case-studies does. */

/* The direction arrow beside a figure. One triangle, rotated 180° by CSS for
   the down case, so there is one path to keep. Decorative: the label under
   the figure carries the meaning, so it is hidden from assistive tech rather
   than read out as "up triangle". */
function csArrow(dir) {
  return '<span class="cs-stat-arrow is-' + dir + '" aria-hidden="true">' +
         '<svg viewBox="0 0 16 16"><path d="M8 2.6l6 10.8H2z"/></svg></span>';
}

/* one fixed section: orange eyebrow, a heading that changes per case, and
   whatever the section is made of underneath */
/* A case with a `copy` object renders its own words; one without still
   renders the bracketed template, which is how the other four ship until
   the copy exists. Paragraphs arrive as an array of strings. */
function csParas(list) {
  return list.map(function (t) {
    return '        <p class="small">' + t + '</p>\n';
  }).join('');
}

function csBlock(eyebrow, title, inner) {
  return '      <section class="cs-block">\n' +
         '        <span class="cs-eyebrow">' + eyebrow + '</span>\n' +
         '        <h2 class="h2">' + title + '</h2>\n' +
         inner +
         '      </section>\n';
}

function casePage(c, i) {
  /* the meta column: label light, value bold underneath. One row per axis
     the shelf can be filtered on, read out of the same arrays the filter
     checkboxes are built from. */
  var meta = [
    /* One service per line, linked: two of them comma-joined wrapped onto
       three lines in a 20% column and read as one long name. The reader who
       recognises the service they need is one click from the page that
       sells it. */
    ['Service(s) used', c.svc.map(function (slug) {
      return '<span><a href="/services/' + slug + '">' + serviceName(slug) + '</a></span>';
    }).join('')],
    ['Tools used',      crmList(c).map(function (t) {
                          return labelFor(CRMS, t, 1);
                        }).join(', ')],
    ['Industry',        industryList(c).map(function (i) {
                          return labelFor(INDUSTRIES, i, 1);
                        }).join(', ')],
    ['Team size',       labelFor(STAGES, c.stage, 2) + ' people']
  ];
  /* Location is the one fact in this column the shelf cannot filter on.
     Nobody arrives looking for a case study in a particular city, but
     everybody wants to know where the client is once they are reading. */
  if (c.location) meta.push(['Location', c.location]);

  /* set on a case that has been written; undefined leaves the template */
  var copy = c.copy;

  var body = '';

  body += '\n<!-- ===================== HEADER PLATE =====================\n' +
'     The plate off /case-studies, left-aligned and carrying a description.\n' +
'     The H1 carries data-nav-clear, as it does on every page: the bar\n' +
'     collapses as it reaches the title. -->\n' +
'<section class="cs-head">\n' +
'  <div class="shell">\n' +
'    <a class="hero-back cs-back" href="/case-studies">' +
       '<span class="arrow" aria-hidden="true">&larr;</span> All case studies</a>\n' +
'    <div class="cs-head-panel is-detail">\n' +
'      <div class="cs-head-copy">\n' +
'        <h1 class="h1" data-nav-clear>' + c.name + '</h1>\n' +
'        <p class="cs-head-lede">' + (copy ? copy.lede :
         '[One or two sentences on who they are, what was broken, and what it is now. ' +
         'The whole story in a paragraph, so the rest of the page is detail rather than ' +
         'suspense.]') + '</p>\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n';

  body += '\n<!-- ===================== THE STORY =====================\n' +
'     20 / 80, the same split as the shelf. Meta down the left, three fixed\n' +
'     sections down the right. -->\n' +
'<section class="section cs-body-section to-white">\n' +
'  <div class="shell">\n' +
'    <div class="cs-layout">\n' +
'      <aside class="cs-side" aria-label="Case study details">\n' +
'        <div class="cs-shot"><img src="' + up(1) +
      (c.img || 'assets/img/case-study-placeholder.svg') + '" alt="" aria-hidden="true"></div>\n' +
'        <div class="cs-meta">\n' +
      meta.map(function (row) {
        return '          <div class="cs-meta-row">\n' +
               '            <p class="cs-meta-label">' + row[0] + '</p>\n' +
               '            <p class="cs-meta-val">' + row[1] + '</p>\n' +
               '          </div>';
      }).join('\n') + '\n' +
'        </div>\n' +
'      </aside>\n' +
'\n' +
'      <div class="cs-body">\n' +

  csBlock('The problem', copy ? copy.problem.h : '[The heading for this case’s problem]',
    copy ? csParas(copy.problem.p) :
'        <p class="small">[What the business does, how many people sell for it, and what the\n' +
'          revenue system looked like on the day they called. Name the thing that finally\n' +
'          made them pick up the phone.]</p>\n' +
'        <p class="small">[The symptom everyone could see, and the cause nobody had gone\n' +
'          looking for. What it was costing them while it went unfixed.]</p>\n') +

  csBlock('The solution', copy ? copy.solution.h : '[The heading for what we built]',
    (copy ? csParas(copy.solution.p) :
'        <p class="small">[What was scoped, what went first and why. The decisions that were\n' +
'          argued over, including the ones that went against us.]</p>\n' +
'        <p class="small">[What it replaced, what stopped being manual, and the part that was\n' +
'          harder than expected.]</p>\n') +
    /* The empty wells are part of the template, not of a case study: they
       show where the artwork goes on a page that has not been written yet.
       A case with copy in it drops them until it has real assets to put
       there, rather than publishing three dashed holes. */
    (copy ? '' :
'        <div class="cs-assets">\n' +
'          <div class="cs-asset is-wide">[Asset 1 &mdash; lead image, screen recording or diagram]</div>\n' +
'          <div class="cs-asset">[Asset 2]</div>\n' +
'          <div class="cs-asset">[Asset 3]</div>\n' +
'        </div>\n')) +

  csBlock('The results', copy ? copy.results.h : '[The heading for what changed]',
    (copy ? csParas(copy.results.p) :
'        <p class="small">[What is different now, in the terms the client would use rather\n' +
'          than the ones we would. What the team can now do for itself, what stopped being\n' +
'          anyone’s job, and anything that did not work.]</p>\n') +
      (copy && (!copy.results.stats || !copy.results.stats.length) ? '' :
'        <div class="cs-stats">\n' +
      /* [figure, label, direction]. Without copy: one plain, one up, one
         down — the three shapes a figure can take, so the template shows all
         of them rather than leaving the arrow to be discovered in the CSS */
      (copy ? copy.results.stats : [['XX%', '[What this figure measures]', ''],
                                    ['XX%', '[What this figure measures]', 'up'],
                                    ['XX%', '[What this figure measures]', 'down']])
      .map(function (f) {
        return '          <div class="cs-stat">\n' +
               '            <b>' + (f[2] ? csArrow(f[2]) : '') + f[0] + '</b>\n' +
               '            <span>' + f[1] + '</span>\n' +
               '          </div>';
      }).join('\n') + '\n' +
'        </div>\n') +
      (copy && !copy.quote ? '' :
'        <figure class="cs-testi">\n' +
'          <div class="cs-testi-photo">' + (copy && copy.quote && copy.quote.photo
        ? '<img' + (copy.quote.photoMark ? ' class="is-mark"' : '') + ' src="' + up(1) +
          copy.quote.photo + '" alt="" aria-hidden="true">'
        : '[Photo]') + '</div>\n' +
'          <blockquote class="cs-testi-quote quote">\n' +
'            <p>' + (copy && copy.quote && copy.quote.text ? copy.quote.text :
         '[One quotation from the person who signed it off. Two or three sentences, ' +
         'in their words, not ours.]') + '</p>\n' +
'            <footer class="quote-by">\n' +
'              <cite>' + (copy && copy.quote && copy.quote.cite ? copy.quote.cite :
                 '[Name] <span class="sep">|</span> [Title], [Company]') + '</cite>\n' +
'            </footer>\n' +
'          </blockquote>\n' +
'        </figure>\n')) +

'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n';

  return {
    file: 'case-studies/' + c.slug + '.html',
    depth: 1,
    navCurrent: '/case-studies',
    mainClass: 'cs-detail',
    bare: true,
    title: c.name + ' — case study — RevHops',
    description: 'How RevHops rebuilt the revenue system at ' + c.name + ', and what changed as a result.',
    body: body
  };
}

/* ---------- the previous case study page, kept for reference ----------
   A navy band of three counted figures under a hero, the story in three
   alternating moves, a centred pull quote, then what it took. Replaced by
   the template above on 6 September; left here because the counted figures
   and the alternating splits may come back into it. Nothing calls it. */
function casePageOld(c, i) {
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


/* ---------- the standalone pages ---------- */

/* ---------- /services ----------

   Stripped back on 6 September. It was the five, a logo band, two
   qualification lists, a testimonial and the close: five sections of copy
   arguing for expertise the list itself already demonstrates. It is now the
   title, the five, the work, and the ask.

   Everything on it sits on flat paper. No discs, no navy band, no artwork
   except the close's own plate. */

var servicesIndex = {
  file: 'services/index.html',
  depth: 1,
  navCurrent: '/services',
  title: 'RevOps services — RevHops',
  description: 'Solution design, CRM implementations, HubSpot support retainers, RevOps consulting and lead to cash process mapping.',
  h1: 'RevOps Services',
  lede: 'Designed to scale with you, no matter what stage you\'re at.',

  /* No artwork column, but not .page-hero-plain either: that steps the
     headline down, and with the image gone the type is the only thing
     holding the top of the page. See .page-hero-nomedia in site.css. */
  heroClass: 'page-hero-nomedia',

  /* sets the page's spacing rhythm and the shorter --start-bleed the rail
     above the close needs */
  mainClass: 'svc-index',

  body:

    /* THE LIST, and the prompt under it. No section title above either: the
       page is called Services and the subheading has already said what they
       are, and the prompt is easier to answer once you have read the five
       than it was sitting up in the header. */
    section(
'    <div class="svc-list">\n' +
      SERVICES.map(function (s) {
        return '      <a class="svc-row reveal" href="/services/' + s.slug + '">\n' +
               '        <h3 class="svc-title">' + s.name + '</h3>\n' +
               '        <span class="svc-time">' + s.time + '</span>\n' +
               '        <p class="svc-copy">' + s.row + '</p>\n' +
               '        <span class="svc-go">Read more <span class="arrow">&rarr;</span></span>\n' +
               '      </a>';
      }).join('\n') + '\n' +
AUDIT_ROW +
'    </div>\n' +
'\n' +
'    <div class="svc-cta reveal">\n' +
'      <p>Not sure what your team needs?</p>\n' +
'      <a class="btn btn-primary" href="/call">Schedule a discovery call</a>\n' +
'    </div>\n', 'section svc-section') +

    /* THE WORK — the homepage's rail with five checkboxes over it.

       Every card carries data-services and shows if it matches ANY checked
       box; all five load checked, so the default state is the homepage's
       rail and the control only ever takes work away. One box always stays
       on — see the filter module in site.js.

       Service is the only axis here. The rest of them belong on
       /case-studies, where there is room for the control to be real. */
    section(
'    <div class="case-head">\n' +
      secHead('See these services in action') +
'      <div class="case-nav reveal">\n' +
'        <button type="button" data-case-prev aria-label="Previous case studies">&larr;</button>\n' +
'        <button type="button" data-case-next aria-label="More case studies">&rarr;</button>\n' +
'      </div>\n' +
'    </div>\n' +
'\n' +
'    <div class="cs-filters reveal" data-case-filters role="group" aria-label="Filter by service">\n' +
      SERVICES.map(function (s) {
        return '      <button class="cs-filter" type="button" role="checkbox" aria-checked="true" data-service="' + s.slug + '">\n' +
               '        <span class="cs-box" aria-hidden="true"><svg viewBox="0 0 12 12"><path d="M2 6.3l2.6 2.6L10 3.2"/></svg></span>\n' +
               '        ' + s.name + '\n' +
               '      </button>';
      }).join('\n') + '\n' +
'    </div>\n' +
'\n' +
'    <div class="case-rail-wrap">\n' +
'      <div class="case-rail" data-case-rail tabindex="0" aria-label="Case studies">\n' +
'        ' + CASES.map(function (c) { return caseCard(c, 1, 'reveal'); }).join('\n        ') + '\n' +
'      </div>\n' +
'    </div>\n', 'section case-section') +

    /* THE STACK — the homepage's clump, under the rail and before the close.
       No subheading: the title says it, and the fifteen marks say the rest. */
    section(
      secHead('Experts in all of the tools in your stack', null, 'centred') +
      toolClump(1), 'section')
};

/* ---------- /case-studies ----------

   A header plate, the filterable shelf, the close. The rail, the problem
   cards and the testimonials that used to be on this page are gone: this is
   the page you come to in order to FIND a case study, and everything else
   was standing between the visitor and the grid.

   `bare` skips the shared .page-hero — the header here is the gradient
   plate, which is a different object and carries its own nav sentinel.
   ---------------------------------------------------------------------- */
var caseIndex = {
  file: 'case-studies/index.html',
  depth: 1,
  navCurrent: '/case-studies',
  /* svc-index is the class that carries nothing but the page rhythm now, and
     /case-studies wants the same one /services has. cs-index is what the
     filter column and the grid are scoped to. */
  mainClass: 'cs-index svc-index',
  bare: true,
  title: 'Case studies — RevHops',
  description: 'Revenue operations work we have done, filterable by service, tools, industry, team size and growth stage.',
  body:
/* THE HEADER IS THE SHARED ONE, since 12 September. It was the gradient
   plate off the case study pages, which made /case-studies the one index on
   the site that opened differently from /services, /about and the rest. The
   plate stays where it earns its keep — on a case study's own page, where
   it carries the client's story. */
'\n<!-- ===================== HERO =====================\n' +
'     The same header /services opens with. The H1 carries data-nav-clear:\n' +
'     the bar collapses as it reaches the title. -->\n' +
'<section class="page-hero page-hero-nomedia">\n' +
'  <div class="shell">\n' +
'    <div class="page-hero-inner">\n' +
'      <div class="page-hero-text">\n' +
'        <h1 class="h1" data-nav-clear>Case studies</h1>\n' +
'        <p class="lede">Filter our case studies to find examples of projects we\u2019ve done with\n' +
'          teams similar to yours.</p>\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n' +
'\n<!-- ===================== THE SHELF =====================\n' +
'     20 / 80. Filters down the left, the grid on the right, three cards\n' +
'     across from 1100px up. -->\n' +
'<section class="section cs-section to-white">\n' +
'  <div class="shell">\n' +
'    <div class="cs-layout">\n' +
      csSide() +
'\n      <div class="cs-results">\n' +
'        <p class="cs-count" data-cs-count role="status">Showing all ' + CASES.length + ' case studies</p>\n' +
'        <div class="cs-grid" data-cs-grid data-reveal-group>\n' +
        CASES.map(function (c) { return '        ' + caseCard(c, 1, 'reveal'); }).join('\n') + '\n' +
'        </div>\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n'
};

/* ---------- /pricing ----------

   Two shapes of engagement and nothing else on the page: a project with an
   end date, or a monthly retainer. The chooser under the header is the only
   navigation on it, and both of its cards are in-page anchors — the page is
   short enough that splitting it in two would make two thin pages and a
   click between them.

   PROJECT PRICES LIVE IN `SERVICES`, NOT HERE. The service detail pages read
   the same fields, so a price changed in one place changes in both. Changing
   it here instead is how the two drift apart.

   The retainer ladder is the one set of numbers on this page that is not in
   SERVICES, because RevOps consulting and HubSpot support are sold as one
   retainer. Putting the ladder on either service would mean two copies of it.

   Figures are James', 11 September. Everything before that date was a
   plausible placeholder and none of it survives.
   ---------------------------------------------------------------------- */

/* Order is James': the two fixed prices first, then the one that is scoped.
   Reading the certain numbers before the ranged one is what makes the ranged
   one read as honest rather than as a dodge. */
var PROJECTS = [SERVICES[0], SERVICES[4], SERVICES[1]];

var RETAINERS = [
  { term: 'Month to month', fig: '$4,250', per: '/mo',
    note: 'No commitment. Thirty days notice, either way.' },
  { term: '3 month commitment', fig: '$3,850', per: '/mo',
    note: 'Long enough to finish the work that does not fit inside one month.' },
  { term: '6+ month commitment', fig: '$3,500', per: '/mo',
    note: 'Adds one full day on site every quarter, at our expense.' }
];

var pricing = {
  file: 'pricing.html',
  depth: 0,
  navCurrent: '/pricing',
  title: 'Pricing — RevHops',
  description: 'What RevOps work with RevHops costs. Fixed prices for solution design and process mapping, project pricing for CRM implementations, and one monthly retainer priced by commitment.',
  h1: 'Pricing',
  lede: 'Published, so you can work out whether we are in your range before you book anything.',

  /* the /services header: title, subheading, no artwork column */
  heroClass: 'page-hero-nomedia',
  headButtons: '          <a class="text-link" href="/call">Schedule a call <span class="arrow">&rarr;</span></a>',

  /* sets the page rhythm and the shorter --start-bleed above the close */
  mainClass: 'pricing-index',

  body:

    /* TWO COLUMNS, one section. One-time projects on the left, the monthly
       retainer on the right, 50/50 on desktop with the cards stacked in each
       column. The fork that used to sit above them came out on 17 September:
       with both halves side by side on one screen there is nothing to jump
       to. So did the "In every retainer" ticks. The column ids stay, so an
       old /pricing#retainers link still lands. .to-white because the close
       bleeds up over whatever section is last. */
'\n<!-- ===================== PROJECTS | RETAINER ===================== -->\n' +
'<section class="section to-white pr-split-section">\n' +
'  <div class="shell">\n' +
'    <div class="pr-split">\n' +

    /* PROJECTS. Three cells off SERVICES, each linking to its own page. The
       figure is price[0] and the line under it is price[1], so a cell says
       what the number is and what kind of number it is. */
'\n    <!-- one-time projects -->\n' +
'    <div class="pr-col" id="projects">\n' +
    secHead('One-time projects',
            'Scope written down and agreed before anything starts. If the scope moves we requote before the work does, not after.') +
'    <div class="price-teaser pr-grid reveal">\n' +
      PROJECTS.map(function (s) {
        return '      <a class="price-teaser-cell" href="/services/' + s.slug + '">\n' +
               '        <span class="price-teaser-label">' + s.name + '</span>\n' +
               '        <span class="price-teaser-fig">' + s.price[0] + '<small>' + s.price[1] + '</small></span>\n' +
               '        <p class="price-teaser-note">' + s.row + '</p>\n' +
               '        <span class="text-link pr-cell-go">Read more <span class="arrow">&rarr;</span></span>\n' +
               '      </a>';
      }).join('\n') + '\n' +
'    </div>\n' +
'    </div>\n' +

    /* RETAINERS. One offering covering both RevOps consulting and HubSpot
       support. The only variable is the term, which is why the three cells
       differ in one line each and not in a feature matrix. */
'\n    <!-- monthly retainer -->\n' +
'    <div class="pr-col" id="retainers">\n' +
    secHead('Ongoing monthly support',
            'RevOps consulting and HubSpot support on one retainer. The rate is set by how long you commit, not by how many hours you use.') +
'    <div class="price-teaser pr-grid reveal">\n' +
      RETAINERS.map(function (r) {
        return '      <div class="price-teaser-cell pr-static">\n' +
               '        <span class="price-teaser-label">' + r.term + '</span>\n' +
               /* A UNIT RIDES THE NUMBER; a caption sits under it. `/mo`
                  stacked on its own line under $4,250 read as a stray
                  fragment rather than as part of the price, which "a month"
                  never did because it was a phrase. Anything starting with a
                  slash is a unit — see .price-teaser-fig small.is-unit. */
               '        <span class="price-teaser-fig">' + r.fig +
               '<small' + (/^\//.test(r.per) ? ' class="is-unit"' : '') + '>' +
               r.per + '</small></span>\n' +
               '        <p class="price-teaser-note">' + r.note + '</p>\n' +
               '      </div>';
      }).join('\n') + '\n' +
'    </div>\n' +
'    </div>\n' +
'\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n'
};

/* ---------- /hubspot ----------

   Rebuilt 11 September. It was a page about the partner tier: what Platinum
   means, what it is not, a wall of certification chips and a free-audit
   band. All of that argued for the badge, and none of it said what we
   actually do inside the platform.

   It is now the header, the six hubs, the reviews on the partner profile
   and the four ways in.

   IT MOVED FROM hubspot.html TO hubspot/index.html. The hub cards point at
   /hubspot/sales-hub and its five siblings, which do not exist yet. A
   hubspot.html file and a hubspot/ folder both answering /hubspot is a coin
   toss on GitHub Pages, so the page became the folder's index the way
   /services and /case-studies already are. Delete hubspot.html if a copy of
   it ever comes back; two files answering one URL is the failure here.

   Flat paper end to end, same as /services. No disc, no navy band. */

var HUBS = [
  { slug: 'sales-hub', name: 'Sales Hub',
    copy: 'Pipelines, sequences, routing and a forecast built on something other than optimism.' },
  { slug: 'marketing-hub', name: 'Marketing Hub',
    copy: 'Lifecycle stages, scoring, campaigns and the attribution that makes any of it defensible.' },
  { slug: 'revenue-hub', name: 'Revenue Hub',
    copy: 'Quotes, payments and subscriptions, so the number in the CRM is the number finance sees.' },
  { slug: 'service-hub', name: 'Service Hub',
    copy: 'Tickets, SLAs, and the handoff from sales that usually turns out to be the actual problem.' },
  { slug: 'data-hub', name: 'Data Hub',
    copy: 'Syncs, custom code and quality rules. The unglamorous half, and where most portals break.' },
  { slug: 'content-hub', name: 'Content Hub',
    copy: 'Pages, blog and forms on the same record as everything else. Also where a separate stack is sometimes the cheaper answer.' }
];

/* Five navy stars. Same path the homepage quotes use; `fill` comes from
   --ink-strong, so they invert to white on the dark theme without a rule. */
function fiveStars(cls) {
  var svg = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z"/></svg>';
  var out = '';
  for (var i = 0; i < 5; i++) out += '            ' + svg + '\n';
  return '          <div class="stars' + (cls ? ' ' + cls : '') +
         '" role="img" aria-label="Five out of five">\n' + out + '          </div>\n';
}

/* The reviews, verbatim off the partner profile and the same three the
   homepage carries. The homepage marks one phrase of each with .hl; they
   come out here, because the page already spends its one highlight on the
   hubs heading and three more would retire the device. */
var REVIEWS = [
  { title: 'Superior expertise', by: 'Deborah', role: 'COO',
    body: 'Our experience working with RevHops to build out specific functionality, reporting, ' +
          'workflows, sequences and dashboards has exceeded expectations. James has taken the time ' +
          'to learn our business model, understand the complexities and remained confident and ' +
          'transparent on what we can and cannot do within the platform. Looking forward to ' +
          'continued partnership with RevHops.' },
  { title: 'Responsive &amp; Thorough', by: 'Amy', role: 'VP of Client Services',
    body: 'We partnered with RevHops on a complex HubSpot Marketing Hub Enterprise implementation, ' +
          'and the experience was excellent from start to finish. James was highly responsive, ' +
          'extremely well-organized, and thorough. RevHops put together a clear, structured plan, ' +
          'communicated recommendations in a way that was easy to align on, and followed up ' +
          'proactively to ensure everyone fully understood the strategy and next steps.' },
  { title: 'Great team to work with!', by: 'Adam', role: 'CEO',
    body: 'James set our small company up for success through his proven process and knowledge of ' +
          'HubSpot after meeting with key people on my team and then mapping everything out for us ' +
          'for the first time. His team was organized in their implementation and tracked our ' +
          'progress throughout the project. We will be using RevHops more in the near future. ' +
          'Highly recommend!!' }
];

/* Rows rather than a second grid of cards: six cards then four cards reads
   as ten cards, and these four are the ask rather than the subject. Same
   component /services and the case pages use. */
var WAYS = [
  /* The audit line is the homepage's own words for it, not a second
     description of the same service written on a different day. */
  { title: 'Request a HubSpot audit', href: '/audit', go: 'Request an audit',
    copy: 'Complimentary audit. We&rsquo;ll look at your data hygiene, pipelines &amp; stages, automations, integrations and adoption.' },

  { title: 'Work out whether HubSpot is right for you', href: '/call', go: 'Schedule a discovery call',
    copy: 'Evaluating HubSpot? We&rsquo;ll help you walk through important things to consider to make sure hopping to HubSpot is the correct move for your team.' },

  { title: 'Buy and implement HubSpot', href: '/services/crm-implementations', go: 'See how we do it',
    copy: 'We&rsquo;ll help you know which features and tiers you&rsquo;ll need and can help you negotiate for the best pricing available, saving you thousands on setup fees. Then we&rsquo;ll help you set it up and onboard your team.' },

  { title: 'Optimize the portal you already have', href: '/services/hubspot-support-retainers', go: 'Retainer options',
    copy: 'Whether it was recently set up or eight years old, we can jump into your account and get to work. We&rsquo;re your HubSpot on-call support &amp; an extra pair of RevOps hands.' }
];

/* Named once. It is on the badge, on the screenshot and on the link under
   it, and three copies of a URL is three chances for one of them to rot. */
var PARTNER_PROFILE = 'https://ecosystem.hubspot.com/marketplace/solutions/revhops';

var hubspot = {
  file: 'hubspot/index.html',
  depth: 1,
  navCurrent: '/hubspot',
  title: 'HubSpot Platinum Solutions Partner — RevHops',
  description: 'RevHops is a HubSpot Platinum Solutions Partner working across all six hubs: Sales, Marketing, Revenue, Service, Data and Content.',
  /* The title sits where the /services title sits and the badge drops into
     the space beside it, rather than the pair of them being centred on each
     other halfway down the band. See .page-hero-markhead. */
  heroClass: 'page-hero-markhead',
  h1: 'HubSpot',
  lede: 'An all-in-one, best-in-class platform that unifies sales, marketing, support &amp; finance in one spot.',

  /* The badge, contained rather than cropped — see .page-hero-media.is-mark.
     It is the only mark on the site that sits in this column, it is a third
     bigger than the band would otherwise allow it to be, and it is a link to
     the partner directory: it is the one claim on this page somebody might
     reasonably want to check. */
  media: { src: 'assets/img/hubspot-platinum-badge.webp', alt: 'HubSpot Platinum Solutions Partner',
           mark: true, big: true, href: PARTNER_PROFILE,
           note: 'View our HubSpot partner profile' },

  /* ONE BUTTON, and it is on the right. The call is the ask and the only
     navy box on the page; the audit is a text link to the left of it. Two
     boxed buttons side by side made the reader pick between them before
     they had read anything. .btn-row centres them on each other. */
  headButtons: '          <a class="text-link" href="/audit">Request a HubSpot audit ' +
               '<span class="arrow" aria-hidden="true">&rarr;</span></a>\n' +
               '          <a class="btn btn-primary" href="/call">Schedule a discovery call</a>',

  body:

    /* THE SIX HUBS. Cards rather than rows, because each one is a page in
       waiting and a card carries its own link without the row's hairlines
       implying an order. None of the six exist yet. */
    section(
      secHead('Certified experts in <span class="hl">all 6 Hubs</span>') +
'    <div style="margin-top:clamp(22px,2.6vw,34px)">\n' +
      pcards(HUBS.map(function (h) {
        return { title: h.name, copy: h.copy, href: '/hubspot/' + h.slug, link: 'Learn more' };
      }), 'pcards-3') +
'    </div>\n') +

    /* THE STACK, off the homepage, minus HubSpot's own mark. The heading is
       this page's rather than the homepage's: there the clump answers "what
       do you know", here it answers "what will this connect to". */
    section(
      secHead('Connect HubSpot to all the tools in your stack', null, 'centred') +
      toolClump(1, ['hubspot']), 'section') +

    /* THE PARTNER PROFILE. ONE REVIEW, AND THE PROOF BESIDE IT.

       It was a sticky title beside a column of three reviews that scrolled
       past it. That column was the tallest thing on the page and it asked
       the reader to get through twelve hundred words of praise on the way
       to the four things we actually want them to click.

       Now it is two columns: a screenshot of the directory listing on the
       left, the one review that is about a HubSpot implementation on the
       right. THE SCREENSHOT IS THE ARGUMENT. 5.0 from ten ratings, 100% of
       them five stars, and the Platinum chip under our own name — that is
       the claim the old heading was making in words, made instead by the
       thing itself, on a page a reader can go and check. Both the picture
       and the link under it go there.

       The stars moved BELOW the attribution. Above the quote they read as
       decoration on the heading; under Amy's name they read as her rating,
       which is what they are.

       The section is tighter than the page's usual rhythm — see
       .hs-testi-section — because one quote in two columns does not need
       the air a full-width block does. */
    section(
'    <div class="hs-testi">\n' +
'\n' +
'      <figure class="hs-testi-body reveal reveal-left">\n' +
'        <h2 class="hs-testi-title"><span class="q">&ldquo;</span>&thinsp;Responsive &amp; Thorough&thinsp;<span class="q">&rdquo;</span></h2>\n' +
'        <blockquote class="hs-testi-quote">\n' +
'          <p>We partnered with RevHops on a complex HubSpot Marketing Hub Enterprise\n' +
'            implementation, and the experience was excellent from start to finish.\n' +
'            <span class="hl">James was highly responsive, extremely well-organized, and\n' +
'            thorough.</span> RevHops put together a clear, structured plan, communicated\n' +
'            recommendations in a way that was easy to align on, and followed up proactively\n' +
'            to ensure everyone fully understood the strategy and next steps.</p>\n' +
'        </blockquote>\n' +
'        <figcaption class="hs-testi-by">\n' +
'          <cite>Amy</cite>\n' +
'          <span class="sep" aria-hidden="true">|</span>\n' +
'          <span>VP of Client Services</span>\n' +
'        </figcaption>\n' +
      fiveStars('hs-testi-stars').replace(/^ {10}/gm, '        ') +
'      </figure>\n' +
'\n' +
'\n' +
'      <div class="hs-testi-proof reveal reveal-right">\n' +
'        <a class="hs-testi-shot" href="' + PARTNER_PROFILE + '"\n' +
'           target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">\n' +
'          <img src="../assets/img/hubspot-partner-profile.webp"\n' +
'               alt="" loading="lazy">\n' +
'        </a>\n' +
'        <a class="text-link hs-testi-link" href="' + PARTNER_PROFILE + '"\n' +
'           target="_blank" rel="noopener">View our HubSpot partner profile\n' +
'           <span class="arrow" aria-hidden="true">&rarr;</span></a>\n' +
'      </div>\n' +
'\n' +
'    </div>\n', 'section hs-testi-section') +

    /* THE ASK. James' four, in his order. .to-white because the closing
       panel bleeds up over whatever section is last. */
    section(
      secHead('How we help teams with HubSpot') +
'    <div class="svc-list svc-list-plain reveal" style="margin-top:clamp(18px,2.2vw,28px)">\n' +
      WAYS.map(function (w) {
        return '      <a class="svc-row" href="' + w.href + '">\n' +
               '        <h3 class="svc-title">' + w.title + '</h3>\n' +
               '        <p class="svc-copy">' + w.copy + '</p>\n' +
               '        <span class="svc-go">' + w.go + ' <span class="arrow">&rarr;</span></span>\n' +
               '      </a>';
      }).join('\n') + '\n' +
'    </div>\n', 'section to-white')
};

/* ---------- the team ----------

   One person today and more soon, which is why this is a list and not a
   hand-written card. Add a member here and the section grows; nothing in
   the markup below has to change.

   [PLACEHOLDER] the LinkedIn URL. It is the one thing on this page that
   cannot be guessed, and a wrong href is worse than an obvious blank. */
var TEAM = [
  {
    name: 'James Ricks',
    role: 'Founder',
    photo: 'assets/img/james-portrait.webp',
    bio: 'Spent [00] years running revenue systems from the inside before ' +
         'starting RevHops, which means he has been the one explaining the ' +
         'forecast to a board as well as the one building it. HubSpot certified, ' +
         'Phoenix based, and the person on your first call and your last.',
    linkedin: 'https://www.linkedin.com/in/[placeholder]'
  }
];

/* The LinkedIn glyph, inline rather than an image file: it is one path, it
   has to take currentColor so it works in both themes, and a 400 byte file
   is not worth a request. */
var LI_ICON =
'          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13m1.78 13.02H3.55V9h3.57zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0"/></svg>\n';

function teamCard(m) {
  return '      <div class="team-card reveal">\n' +
'        <img class="team-photo" src="' + m.photo + '" alt="' + m.name + '" loading="lazy">\n' +
'        <h3 class="team-name">' + m.name + '</h3>\n' +
'        <p class="team-role">' + m.role + '</p>\n' +
'        <p class="team-bio">' + m.bio + '</p>\n' +
'        <a class="team-social" href="' + m.linkedin + '" target="_blank" rel="noopener"\n' +
'           aria-label="' + m.name + ' on LinkedIn">\n' +
LI_ICON +
'          LinkedIn\n' +
'        </a>\n' +
'      </div>';
}

/* /about, not /about-us. Renamed on 11 September: the URL is the shorter
   one everywhere now — NAV_ITEMS, the footer column, llms.txt and the
   homepage's hand-maintained nav — and about-us.html is deleted rather than
   left behind as a stale second copy of the same page.

   The head takes the /services treatment: a title and a subhead, no artwork
   column. Below it the portrait block off the homepage, the client marquee,
   the values under their own name, and the team. */
var about = {
  file: 'about.html',
  depth: 0,
  navCurrent: '/about',
  title: 'About RevHops',
  description: 'RevHops is a small revenue operations consultancy in Phoenix, Arizona. Who we are, how we work, and what we will not do.',
  /* Not .page-hero-plain, which steps the type down a size. See
     .page-hero-nomedia in site.css. */
  heroClass: 'page-hero-nomedia',
  h1: 'About us',
  lede: 'A revenue operations consultancy in Phoenix, Arizona. Small on purpose, deep in one thing, and straight with you about the parts that will be difficult.',
  body:
    /* The portrait block off the homepage, minus the Platinum badge that
       overhangs it there — .about-stack-solo drops the padding that was
       holding space for it. */
    section(
'    <div class="split about-split" style="align-items:center">\n' +
'\n' +
'      <div class="about-stack about-stack-solo reveal reveal-left" data-tilt>\n' +
'        <img class="about-img about-img-back" src="assets/img/james-portrait.webp"\n' +
'             alt="James Ricks, founder of RevHops">\n' +
'      </div>\n' +
'\n' +
'      <div class="stack gap-20 reveal reveal-right">\n' +
'        <h2 class="h2">The shop I wish I could have hired</h2>\n' +
'        <p>I am James. Before RevHops I spent [00] years inside revenue teams rather than beside\n' +
'          them, running the systems, owning the number, and explaining to a board why the\n' +
'          forecast and the invoices disagreed. The agencies I hired were good at building\n' +
'          exactly what I asked for and bad at telling me when I had asked for the wrong thing.\n' +
'          The people who could tell me the truth were expensive, busy, and gone by month three.\n' +
'          So RevHops takes fewer clients and keeps the same people on them. It is a less\n' +
'          scalable business, and a much better one to be a client of.</p>\n' +
'      </div>\n' +
'\n' +
'    </div>\n') +

    logoBand(0) +

    /* The values, under their own name rather than "core values" — the
       phrase is on every consultancy About page and means nothing by now. */
    section(
      secHead('How we <span class="hl">hop-erate</span>') +
'    <div style="margin-top:clamp(22px,2.6vw,34px)">\n' +
      pcards([
        { n: 'One', title: 'Show, don\'t tell',
          copy: 'We\'re veteran experts and we know our stuff, but it\'s the work we do, not our words, that we let do the talking.',
          chips: ['Proof', 'Not promises'] },
        { n: 'Two', title: 'Seriously, fun',
          copy: 'Working with us is as enjoyable and fun as it is effective. You know, the whole work hard, play hard thing.',
          chips: ['Effective', 'Enjoyable'] },
        { n: 'Three', title: 'Clarity over comfort',
          copy: 'The most important thing we can do is guide you down the right path, not the easy or convenient one.',
          chips: ['Honest', 'Direct'] }
      ]) +
'    </div>\n', 'section-tight') +

    /* .to-white because the closing panel bleeds up into whatever is above
       it. The last section on every page carries this. */
    section(
      secHead('Meet the team',
              'One of us today and more shortly. Whoever you meet on the first call is the person who does the work.') +
'    <div class="team-grid">\n' +
      TEAM.map(teamCard).join('\n') + '\n' +
'    </div>\n', 'section to-white')
};

var contact = {
  file: 'contact.html',
  depth: 0,
  navCurrent: '/contact',
  title: 'Contact RevHops',
  description: 'Get in touch with RevHops. Send us a message, or book a discovery call directly.',
  /* The /services header treatment: a title and a subhead, no artwork
     column. See .page-hero-nomedia in site.css. */
  heroClass: 'page-hero-nomedia',
  h1: 'Get in touch',
  lede: 'Fill in the form or grab a time on the calendar. We answer everything within a working day, usually with a question rather than a pitch.',
  /* No closing panel. The page already has two calls to action side by
     side; a third one under them competes with both. */
  noClose: true,
  body:
    /* Two third-party embeds and their labels. Neither embed is wrapped in
       .reveal: that class animates with transform and filter, and both make
       the wrapper a containing block for anything the widget positions
       fixed — HubSpot's date picker and its error toasts land in the wrong
       place inside one. The heads above them carry the reveal instead. */
    section(
'    <div class="contact-split">\n' +
'\n' +
'      <div class="contact-col">\n' +
'        <div class="contact-col-head reveal reveal-left">\n' +
'          <h2>Send us a message</h2>\n' +
'          <p>The symptom is enough. You do not have to have diagnosed it.</p>\n' +
'        </div>\n' +
'        <!-- HubSpot form, portal 46722926. The script renders into the\n' +
'             .hs-form-frame div below and brings its own type and spacing. -->\n' +
'        <script src="https://js.hsforms.net/forms/embed/46722926.js" defer><\/script>\n' +
'        <div class="hs-form-frame" data-region="na1"\n' +
'             data-form-id="99d30994-ee79-447b-af6e-bce1cb2728ac"\n' +
'             data-portal-id="46722926"></div>\n' +
'      </div>\n' +
'\n' +
'      <div class="contact-col">\n' +
'        <div class="contact-col-head reveal reveal-right">\n' +
'          <h2>Or <span class="hl">book a call</span></h2>\n' +
'          <p>Nothing to fill in first. Pick a time and we will meet you there.</p>\n' +
'        </div>\n' +
'        <!-- Start of Meetings Embed Script -->\n' +
'        <div class="meetings-iframe-container"\n' +
'             data-src="https://revhops.com/meetings/revhops/discovery-call?embed=true"></div>\n' +
'        <script type="text/javascript" src="https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js"><\/script>\n' +
'        <!-- End of Meetings Embed Script -->\n' +
'      </div>\n' +
'\n' +
'    </div>\n', 'section to-white')
};

/* ---------- the booking pages ----------
   No closing panel on either: these pages have one job and anything else on
   them is a way to not do that job. /client-call carries the /case-studies
   gradient plate as its title and nothing more; /call has no header band at
   all, because its own left panel is already one.

   /client-call is the bare version — existing clients, noindexed, nothing to
   sell. /call is built separately below, because it is where every
   'Schedule a call' button on the site lands and it has one more job. */

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
/* The gradient plate off /case-studies, carrying the title. Same classes,
   so it is the same object at the same size — .cs-head-panel is already
   centred flex, which is what puts the title on the plate's middle line.
   The title carries the nav sentinel, as it does on every page. */
'\n<section class="cs-head">\n' +
'  <div class="shell">\n' +
'    <div class="cs-head-panel">\n' +
'      <h1 class="h1" data-nav-clear>' + o.heading + '</h1>\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n' +
'\n<section class="section">\n' +
'  <div class="shell">\n' +
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

/* ---------- /call ----------

   30 / 70. The panel on the left carries the title, what the call actually
   is, and a short video of the same; the scheduler fills the right. Both
   start at the same y, so the reassurance is being read while the form is
   being filled rather than before it.

   The panel wears the /case-studies header artwork — the one gradient object
   this site has below the homepage — rather than inventing a second one.

   The video slot is a placeholder until James records it. Swapping it in is
   one block: drop the YouTube <iframe> in place of .call-video-ph and the
   wrapper supplies the 16:9, the 12px radius and the clipping.

   `bare` skips the shared .page-hero. No full-width header here: everyone
   arriving has already read the pitch on the page they clicked from, and a
   band restating it is one more screen before the calendar. */

/* Two paragraphs, not one. The turn is at "Then, if we're a good fit" —
   before it the call is about them, after it it is about us, and running
   both halves together buries the conditional that makes the second half
   worth reading. */
var CALL_SUB = [
  'We’ll talk about you and your team and dive into the problems you’re facing ' +
  'today and talk about where you’d like to get to.',

  'Then, if we’re a good fit, we’ll walk you through our proven process for ' +
  'solving these challenges and talk about how we can help you get where you ' +
  'want to go.'
];

var callPage = {
  file: 'call.html',
  depth: 0,
  title: 'Schedule a discovery call — RevHops',
  description: 'Book a discovery call with RevHops. Thirty minutes, no deck.',
  bare: true,
  noClose: true,
  body:
'\n<section class="section call-split">\n' +
'  <div class="shell">\n' +
'    <div class="call-layout">\n' +
'\n' +
'      <!-- LEFT, 30% — the gradient plate off /case-studies, portrait.\n' +
'           Its scrim is legibility, not decoration; see .call-panel. -->\n' +
'      <div class="call-panel reveal">\n' +
'        <h1 class="h1" data-nav-clear>Schedule a Call</h1>\n' +
        CALL_SUB.map(function (p) {
          return '        <p class="call-sub">' + p + '</p>';
        }).join('\n') + '\n' +
'\n' +
'        <!-- PLACEHOLDER. To ship the real video, replace the whole\n' +
'             .call-video-ph div with:\n' +
'             <iframe src="https://www.youtube.com/embed/VIDEO_ID"\n' +
'                     title="What to expect on the call" loading="lazy"\n' +
'                     allow="accelerometer; autoplay; clipboard-write;\n' +
'                            encrypted-media; picture-in-picture"\n' +
'                     allowfullscreen></iframe>\n' +
'             and change nothing else — .call-video carries the ratio, the\n' +
'             12px radius and the clipping. -->\n' +
'        <div class="call-video">\n' +
'          <div class="call-video-ph">\n' +
'            <span class="call-video-play" aria-hidden="true">\n' +
'              <svg viewBox="0 0 16 18"><path d="M0 0l16 9-16 9z"/></svg>\n' +
'            </span>\n' +
'            <span class="call-video-note">Video: what to expect</span>\n' +
'          </div>\n' +
'        </div>\n' +
'      </div>\n' +
'\n' +
'      <!-- RIGHT, 70% — the widget, at the full width of its column.\n' +
'           No .reveal on this one on purpose: reveal animates a blur and a\n' +
'           transform, and both create a containing block the HubSpot iframe\n' +
'           is measured inside while it is still sizing itself. The widget is\n' +
'           the page — it should be there on arrival, not fade in. -->\n' +
'      <div class="call-embed">\n' +
        meetingEmbed('https://revhops.com/meetings/revhops/discovery-call?embed=true') +
'      </div>\n' +
'\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n' +

  /* The marquee off the homepage and /about, unchanged. It sits directly
     under the split because the question the widget raises — "have these
     people done this before" — is the one a wall of client marks answers
     without a sentence. */
  logoBand(0) +

  /* One testimonial, the .cs-testi object off the case study Results
     section. Same figure, same circle, same cite line: a second quote
     layout would be a second thing to keep in step for no gain.

     Placeholder copy until James picks the quote. */
  section(
'    <figure class="cs-testi call-testi reveal">\n' +
'      <div class="cs-testi-photo">[Photo]</div>\n' +
'      <blockquote class="cs-testi-quote quote">\n' +
'        <p>[One quotation from a client, in their words. Two or three sentences on\n' +
'          what the work was like and what changed because of it — the thing someone\n' +
'          hesitating over the calendar above needs to hear.]</p>\n' +
'        <footer class="quote-by">\n' +
'          <cite>[Name] <span class="sep">|</span> [Title], [Company]</cite>\n' +
'        </footer>\n' +
'      </blockquote>\n' +
'    </figure>\n', 'section-tight call-testi-section')
};

var clientCallPage = meetingPage({
  file: 'client-call.html',
  title: 'Client call — RevHops',
  description: 'Booking page for existing RevHops clients.',
  heading: 'Book a client call',
  src: 'https://revhops.com/meetings/revhops/client-call?embed=true',
  noindex: true
});

/* ---------- legal ----------
   Real wording as of 12 September 2026, replacing the placeholders. No design
   work here on purpose: these two pages are read once, by someone checking a
   specific clause, and the only thing that helps them is a narrow measure and
   clear headings.

   NOT LAWYER-REVIEWED. Written against how the site actually behaves, which
   is the part that matters most and the part a template gets wrong. Two
   things to keep true: there is no cookie banner (the Privacy page says so
   outright rather than pretending), and Google Analytics is named because it
   is going in. If either changes, change the copy in the same commit. */

function legalPage(o) {
  return {
    file: o.file,
    depth: 0,
    title: o.title,
    description: o.description,
    h1: o.h1,
    lede: o.lede,
    /* .page-hero-legal and .legal-section are the two hooks that pull the
       header down onto the copy and let the copy run the full shell. Only
       these two pages get them: /puzzle and /hop are also .page-hero-plain
       and still want the ordinary header gap. */
    heroClass: 'page-hero-plain page-hero-legal',
    body: section(
'    <div class="prose reveal">\n' +
'      <p class="prose-meta">Last updated ' + o.updated + '.</p>\n' +
      o.sections.map(function (s) {
        return '      <h2>' + s[0] + '</h2>\n' +
               s.slice(1).map(function (p) {
                 return Array.isArray(p)
                   ? '      <ul>\n' + p.map(function (li) { return '        <li>' + li + '</li>'; }).join('\n') + '\n      </ul>'
                   : '      <p>' + p + '</p>';
               }).join('\n');
      }).join('\n') + '\n' +
'    </div>\n', 'section legal-section to-white')
  };
}

var terms = legalPage({
  file: 'terms.html',
  title: 'Terms of Service — RevHops',
  description: 'The terms you accept by using revhops.com. Client work is governed by its own signed agreement.',
  h1: 'Terms of Service',
  lede: 'The terms you accept by using this site. The work we do for clients is governed by its own agreement.',
  updated: '12 September 2026',
  sections: [
    ['Who we are',
     'RevHops is a trade name of James Ricks Consulting, LLC, an Arizona limited liability company based in Phoenix, Arizona. In these terms, "we", "us" and "RevHops" mean that company, and "you" means whoever is using this website.',
     'Questions about anything on this page go to <a href="mailto:team@revhops.com">team@revhops.com</a>.'],
    ['What these terms cover',
     'This page covers your use of revhops.com and everything attached to it: the blog, the resource library, the assessments and calculators, and the games.',
     'It does not cover the work we do for clients. Consulting, implementation and support engagements are governed entirely by the statement of work or service agreement signed for that engagement. Nothing on this page changes those documents, and if the two ever disagree, the signed agreement wins.',
     'Using this site means you accept these terms. If you do not accept them, stop using the site.'],
    ['Using this website',
     'You may read this site, use the tools on it, and download what we publish, for your own purposes, commercial or otherwise.',
     'You may not do any of the following:',
     ['Try to reach any part of the site, or any system behind it, that is not meant to be public.',
      'Interfere with how the site runs, or test its security without asking us first.',
      'Scrape or crawl it at a rate that degrades it for anyone else.',
      'Strip our attribution from something we published and present it as your own.',
      'Use what is here to build a competing library, directory or product.']],
    ['What is here is information, not advice',
     'The articles, guides, benchmarks, scorecards and calculators on this site are general information about revenue operations. They are not consulting advice, and they are not legal, tax or accounting advice.',
     'A score or a number produced by a tool on this site is a starting point for a conversation, not a recommendation. What you do with it is your decision and your risk. If you want advice about your situation specifically, that is what an engagement is for.'],
    ['What you send us',
     'What happens to anything you type into a form here, including the newsletter and gated downloads, is set out in our <a href="privacy">Privacy Policy</a>.',
     'Please do not send confidential or sensitive information through a web form. Wait until we have a signed agreement and a proper place to put it.',
     'If you send us a suggestion or an idea without us asking for it, we are free to use it without owing you anything for it.'],
    ['Intellectual property',
     'The text, design, code, illustrations and marks on this site belong to us, except where something is credited otherwise. You may quote from what we publish, or link to it, with attribution. You may not republish it wholesale, and you may not use our name or logo in a way that suggests we endorse you or your product.',
     'HubSpot, Pipedrive and other product names that appear here belong to their respective owners. Our partner badges mean we are a certified partner of those platforms. They do not mean those companies wrote, reviewed or endorsed anything on this site.'],
    ['Links to other sites',
     'We link out to things worth reading. We do not control what is on the other end of those links, we do not vouch for it, and we are not responsible for it.'],
    ['Availability and warranties',
     'This site is provided as is and as available. We do not promise that it will be uninterrupted, that everything on it is accurate or current, or that it is free of anything harmful. To the fullest extent the law allows, we disclaim the implied warranties of merchantability, fitness for a particular purpose and non-infringement.'],
    ['Liability',
     'To the fullest extent the law allows, we are not liable for indirect, incidental, special or consequential damages, or for lost profits, lost revenue or lost data, arising out of your use of this site. Where liability cannot be excluded, our total liability for everything connected to this site is capped at one hundred US dollars.',
     'This section is about the website. It does not limit anything we owe a client under a signed agreement, which carries its own liability terms.'],
    ['Changes to these terms',
     'We may update this page. The date at the top says when it last changed. Continuing to use the site after a change means you accept the updated terms.'],
    ['Governing law',
     'Arizona law governs these terms, without regard to its conflict of laws rules. Any dispute about this site belongs in the state or federal courts sitting in Maricopa County, Arizona, and we both agree to that venue.',
     'If a court finds any part of these terms unenforceable, the rest stays in force.'],
    ['Contact',
     'James Ricks Consulting, LLC, doing business as RevHops. Phoenix, Arizona. <a href="mailto:team@revhops.com">team@revhops.com</a>.']
  ]
});

var privacy = legalPage({
  file: 'privacy.html',
  title: 'Privacy Policy — RevHops',
  description: 'What data RevHops collects through this website, why, who else sees it, and how to get rid of it.',
  h1: 'Privacy Policy',
  lede: 'What we collect, why we collect it, who else sees it, and how to get rid of it.',
  updated: '12 September 2026',
  sections: [
    ['The short version',
     'We collect what you type into our forms and some information about how you move around this site. We use it to reply to you, to run the work once it starts, and to work out which pages earn their place.',
     'We do not sell it. We do not share it with anyone except the companies that run the tools we work in. You can ask us to delete it at any time and we will.'],
    ['What we collect',
     ['What you send through a form: your name, work email, company, phone if you give it, and whatever you write in the message box. Our forms are HubSpot forms, so submissions land in HubSpot.',
      'What you give us for a gated download or a gated video: your name and work email, at minimum.',
      'What you give us when you book a call: whatever the scheduler asks for, plus the time you picked.',
      'If you become a client, the details we need in order to invoice you: billing contact, billing address, and a purchase order or tax reference if your side requires one. We never see or store your card or bank numbers. Stripe handles the payment itself and holds those.',
      'Your email address, if you subscribe to the newsletter, along with whether you opened or clicked what we sent.',
      'How you use the site: pages viewed, how you arrived, roughly where you are based on your IP address, your browser and device, and a cookie identifier that ties those visits together. HubSpot\'s tracking script and Google Analytics collect this.',
      'Whatever you tell us by email or on a call, once we are actually talking.']],
    ['What we do not collect',
     'We do not ask for, and have no use for, sensitive categories of personal information: health, biometrics, precise geolocation, government identifiers, or anything about your race, religion, politics or sexual orientation. The games on this site keep nothing. Nothing you play is recorded or sent anywhere.'],
    ['Why we collect it',
     'To reply to you. To send you the thing you asked for. To run an engagement once one starts. To understand which parts of this site are useful, so we stop writing the parts that are not.',
     'Marketing email goes only to people who asked for it. Every one has an unsubscribe link, and it works.',
     'If you are in the EU or the UK, our legal bases are: your consent, for marketing email and non-essential cookies; performance of a contract, for anything we need in order to do work you have hired us for; and our legitimate interests, for replying to an inquiry, keeping the site secure, and measuring how it performs.'],
    ['Cookies and tracking',
     'HubSpot sets cookies so it can recognize a returning visitor and connect a form submission to the pages that led to it. Google Analytics sets cookies to count visits and show which pages get read.',
     'There is no cookie banner on this site today, so those cookies are set when you arrive. You can block or delete them in your browser settings, and the site works fine without them. If your browser sends a Global Privacy Control signal, we treat it as an opt out.',
     'We do not run advertising pixels, we do not build ad audiences, and we do not sell anything we learn about you.'],
    ['Who else sees it',
     'Only the companies whose tools we work in, and only under contract with us:',
     ['HubSpot, which is our CRM and runs our forms, marketing email, meeting scheduler, blog, site analytics and client invoicing.',
      'Stripe, which processes the payment when you pay an invoice, and holds the payment method and transaction record that goes with it. Stripe is who sees your card or bank details. We only ever see that an invoice was paid.',
      'Google, whose Workspace runs our email, calendar and video meetings, and whose Analytics measures site traffic.',
      'GitHub, which hosts this site and therefore sees the IP addresses of requests as an ordinary part of serving pages.'],
     'We will also disclose information if the law genuinely requires it, or to protect our rights or someone\'s safety. If the business is ever sold or merged, information moves with the rest of the business, and this policy travels with it.',
     'We have not sold personal information in the last twelve months, and we do not share it for cross-context behavioral advertising.'],
    ['Where it is held',
     'In the United States, where we and our providers are based. If you are in the EU or the UK, that means your information is transferred out of your region. Our providers make those transfers under the standard contractual clauses, and so do we.'],
    ['How long we keep it',
     ['An inquiry that never became work: two years after your last contact with us.',
      'Client records, invoices and payment history: seven years after the engagement ends, because tax and contract records need that long. HubSpot and Stripe keep their own copies of that billing record on their own schedules, for the same reason.',
      'Newsletter subscribers: until you unsubscribe, and then a suppression record so we do not email you again by mistake.',
      'Analytics and cookie data: for each provider\'s own expiry period, which we keep at the shortest setting that provider offers.'],
     'Ask us to delete something sooner and we will, unless we are legally required to keep it.'],
    ['Your rights',
     'Wherever you are: you can ask what we hold about you, ask us to correct it, ask us to delete it, or ask us to stop emailing you. Email <a href="mailto:team@revhops.com">team@revhops.com</a> and we will action it within thirty days. There is no charge, and we will not treat you any differently for asking.',
     'If you are in the EU or the UK, you also have the right to object to processing we base on legitimate interests, to receive your information in a portable format, to withdraw consent at any time without affecting what came before, and to complain to your data protection authority. In the UK, that is the Information Commissioner\'s Office.',
     'If you are in California, you also have the right to know the categories of information we collect, where it came from, why we collect it and who we disclose it to, all of which is on this page. You have the right to limit the use of sensitive personal information, which we do not collect in the first place. You may use an authorized agent, and we verify a request by replying to the email address we already hold for you.'],
    ['Security',
     'We use the tools any business our size would use, with two-factor authentication turned on across all of them, and we keep access to client data limited to the people doing the work. No system is perfect and we will not pretend this one is. If something goes wrong in a way that affects you, we will tell you.'],
    ['Children',
     'This is a site for businesses. It is not intended for anyone under sixteen, and we do not knowingly collect anything from them. If you believe a child has sent us something, email us and we will delete it.'],
    ['Changes to this policy',
     'We will update this page when what we do changes. The date at the top says when it last changed. If a change is significant, we will say so on the page rather than making you diff it.'],
    ['Contact',
     'RevHops is a trade name of James Ricks Consulting, LLC, an Arizona limited liability company based in Phoenix, Arizona. We are the controller of the information described here.',
     'Privacy questions and requests: <a href="mailto:team@revhops.com">team@revhops.com</a>.']
  ]
});

/* ---------- the puzzle ----------
   RevOps Unscrambler. A sliding tile game, linked from the footer only. The board, clock and
   dialog are markup here; everything that moves is assets/js/puzzle.js,
   which only this page loads (see `scripts` in tail()). The pictures are
   branded illustrations in assets/img/puzzle/, listed in puzzle.js. */

var puzzle = {
  file: 'puzzle.html',
  eyebrow: ['All games', '/resources#games'],
  depth: 0,
  title: 'RevOps Unscrambler — RevHops',
  description: 'A sliding tile puzzle from RevHops. Put the pieces of your revenue operations back in the right place, against the clock.',
  h1: 'Put your RevOps back together',
  lede: 'Eight pieces, one gap and a clock. Slide the tiles until the picture is whole, then come back and beat your time.',
  heroClass: 'page-hero-plain',
  scripts: ['assets/js/puzzle.js'],
  body:
'\n<section class="section pz-section to-white">\n' +
'  <div class="shell">\n' +
'    <div class="pz" data-puzzle data-img-base="assets/img/puzzle/">\n' +
'\n' +
'      <div class="pz-board" data-pz-board>\n' +
'        <div class="pz-grid" data-pz-grid role="group" aria-label="Puzzle board"></div>\n' +
'        <div class="pz-cover" data-pz-cover>\n' +
'          <button class="btn btn-primary btn-lg" type="button" data-pz-start>Start the clock</button>\n' +
'          <p>The timer starts the moment you press it.</p>\n' +
'        </div>\n' +
'      </div>\n' +
'\n' +
'      <div class="pz-panel">\n' +
'        <dl class="pz-stats" aria-live="off">\n' +
'          <div><dt>Time</dt><dd class="pz-time" data-pz-time>0:00.0</dd></div>\n' +
'          <div><dt>Moves</dt><dd data-pz-moves>0</dd></div>\n' +
'          <div><dt>Your best</dt><dd data-pz-best>None yet</dd></div>\n' +
'        </dl>\n' +
'        <p class="small pz-help">Click any tile in line with the gap to slide it across.\n' +
'          On a keyboard, the arrow keys work too.</p>\n' +
'        <div class="pz-preview">\n' +
'          <img data-pz-thumb src="assets/img/puzzle/dashboard.svg" alt="" width="116" height="116">\n' +
'          <div class="stack gap-8">\n' +
'            <p class="label" data-pz-name>The revenue dashboard</p>\n' +
'            <p class="small">What the eight pieces make</p>\n' +
'          </div>\n' +
'        </div>\n' +
'        <div class="pz-actions">\n' +
'          <button class="btn btn-primary" type="button" data-pz-restart hidden>Shuffle again</button>\n' +
'          <button class="text-link" type="button" data-pz-next>Try a different picture <span class="arrow">&rarr;</span></button>\n' +
'        </div>\n' +
'      </div>\n' +
'\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n' +
'\n' +
'<!-- The win dialog. The canvas sits inside it so the confetti draws above\n' +
'     the backdrop and below the card. -->\n' +
'<dialog class="pz-win" data-pz-win aria-labelledby="pz-win-title">\n' +
'  <canvas class="pz-confetti" data-pz-confetti aria-hidden="true"></canvas>\n' +
'  <div class="pz-win-card">\n' +
'    <button class="pz-close" type="button" data-pz-close aria-label="Close">\n' +
'      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>\n' +
'    </button>\n' +
'    <svg class="pz-burst" viewBox="0 0 100 100" aria-hidden="true">\n' +
'      <path class="pz-burst-rays" fill="#F2C39B" d="M50 2l8.6 15.4 16-7.4-1.8 17.5 17.5-1.8-7.4 16L98 50l-15.4 8.6 7.4 16-17.5-1.8 1.8 17.5-16-7.4L50 98l-8.6-15.4-16 7.4 1.8-17.5-17.5 1.8 7.4-16L2 50l15.4-8.6-7.4-16 17.5 1.8-1.8-17.5 16 7.4z"/>\n' +
'      <circle cx="50" cy="50" r="27" fill="#304157"/>\n' +
'      <path d="M38 51l8 8 17-18" fill="none" stroke="#F2C39B" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>\n' +
'    </svg>\n' +
'    <h2 class="h2" id="pz-win-title">You did it!</h2>\n' +
'    <p>You got all the pieces of your revenue operations in the right place!</p>\n' +
'    <div class="pz-win-stats">\n' +
'      <span><small>Time</small><b data-pz-win-time>0:00.0</b></span>\n' +
'      <span><small>Moves</small><b data-pz-win-moves>0</b></span>\n' +
'    </div>\n' +
'    <p class="pz-record" data-pz-record hidden>New personal best</p>\n' +
'    <div class="pz-win-actions">\n' +
'      <button class="btn btn-primary" type="button" data-pz-again>Play again</button>\n' +
'      <p class="pz-win-ask">Need help unscrambling your RevOps processes?</p>\n' +
'      <a class="btn btn-outline" href="/call">Schedule a discovery call</a>\n' +
'    </div>\n' +
'  </div>\n' +
'</dialog>\n'
};

/* ---------- the run ----------
   RevOps Runner. A side-scrolling runner, linked from the footer only,
   beside the Unscrambler.
   The stats, board, cover, touch pads and dialog are markup here;
   everything that moves is assets/js/hop.js, which only this page loads.
   The rabbit is the brand icon, revhops-icon-white.png. */

var hop = {
  file: 'hop.html',
  eyebrow: ['All games', '/resources#games'],
  depth: 0,
  title: 'RevOps Runner — RevHops',
  description: 'A side-scrolling runner from RevHops. Jump the fires, duck the requests and see how far you get as the pace picks up.',
  h1: 'Outrun the request queue',
  lede: 'Jump the fires and duck the requests. The pace picks up the longer you last, so see how far you get.',
  heroClass: 'page-hero-plain',
  scripts: ['assets/js/hop.js'],
  body:
'\n<section class="section hp-section to-white">\n' +
'  <div class="shell">\n' +
'    <div class="hp" data-hop data-img-base="assets/img/">\n' +
'\n' +
'      <div class="hp-top">\n' +
'        <dl class="hp-stats" aria-live="off">\n' +
'          <div><dt>Score</dt><dd class="hp-score" data-hp-score>0</dd></div>\n' +
'          <div><dt>Speed</dt><dd data-hp-speed>1.0x</dd></div>\n' +
'          <div><dt>Your best</dt><dd data-hp-best>None yet</dd></div>\n' +
'        </dl>\n' +
'        <p class="small hp-help">\n' +
'          <span class="hp-help-keys">Space or the up arrow to jump, and hold it for a higher hop. The down arrow ducks.</span>\n' +
'          <span class="hp-help-touch">Tap the board or Jump to hop, and hold it for a higher one. Hold Duck to get under a request.</span>\n' +
'        </p>\n' +
'      </div>\n' +
'\n' +
'      <div class="hp-stage" data-hp-stage tabindex="0" role="application" aria-label="RevOps Runner. Space to jump, down arrow to duck.">\n' +
'        <canvas class="hp-canvas" data-hp-canvas aria-hidden="true"></canvas>\n' +
'        <div class="hp-cover" data-hp-cover>\n' +
'          <button class="btn btn-primary btn-lg" type="button" data-hp-start>Start running</button>\n' +
'          <p data-hp-cover-msg>Jump the fires. Duck the requests.</p>\n' +
'        </div>\n' +
'      </div>\n' +
'\n' +
'      <div class="hp-pads">\n' +
'        <button class="hp-pad" type="button" data-hp-duck>Duck</button>\n' +
'        <button class="hp-pad" type="button" data-hp-jump>Jump</button>\n' +
'      </div>\n' +
'\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n' +
'\n' +
'<!-- The end-of-run dialog. The canvas sits inside it so the confetti, for\n' +
'     a new best only, draws above the backdrop and below the card. -->\n' +
'<dialog class="hp-over" data-hp-over aria-labelledby="hp-over-title">\n' +
'  <canvas class="hp-confetti" data-hp-confetti aria-hidden="true"></canvas>\n' +
'  <div class="hp-over-card">\n' +
'    <button class="hp-close" type="button" data-hp-close aria-label="Close">\n' +
'      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>\n' +
'    </button>\n' +
'    <svg class="hp-burst" viewBox="0 0 100 100" aria-hidden="true">\n' +
'      <path class="hp-burst-rays" fill="#F2C39B" d="M50 2l8.6 15.4 16-7.4-1.8 17.5 17.5-1.8-7.4 16L98 50l-15.4 8.6 7.4 16-17.5-1.8 1.8 17.5-16-7.4L50 98l-8.6-15.4-16 7.4 1.8-17.5-17.5 1.8 7.4-16L2 50l15.4-8.6-7.4-16 17.5 1.8-1.8-17.5 16 7.4z"/>\n' +
'      <circle cx="50" cy="50" r="27" fill="#304157"/>\n' +
'      <image href="assets/img/revhops-icon-white.png" x="34" y="33" width="33" height="33"/>\n' +
'    </svg>\n' +
'    <h2 class="h2" id="hp-over-title" data-hp-over-title>A request got you</h2>\n' +
'    <p data-hp-over-text>They never stop coming. Hop back in and beat your score.</p>\n' +
'    <div class="hp-over-stats">\n' +
'      <span><small>Score</small><b data-hp-over-score>0</b></span>\n' +
'      <span><small>Top speed</small><b data-hp-over-speed>1.0x</b></span>\n' +
'      <span><small>Time</small><b data-hp-over-time>0:00.0</b></span>\n' +
'    </div>\n' +
'    <p class="hp-record" data-hp-record hidden>New personal best</p>\n' +
'    <div class="hp-over-actions">\n' +
'      <button class="btn btn-primary" type="button" data-hp-again>Run again</button>\n' +
'      <p class="hp-over-ask">Keep getting knocked down by RevOps requests?</p>\n' +
'      <a class="btn btn-outline" href="/call">Schedule a discovery call</a>\n' +
'    </div>\n' +
'  </div>\n' +
'</dialog>\n'
};

/* ==========================================================================
   RESOURCES — one list, five shelves

   EVERY RESOURCE ON THE SITE IS ONE OBJECT IN `RESOURCES` AND NOTHING ELSE.
   Adding one is a single entry here: give it a `type` from RESOURCE_TYPES
   and the page rebuilds itself around it. The shelf it lands on, the count,
   the pagination, the filter at the top and the lightbox all follow from
   the data. Nothing on /resources is hand-written markup.

   THE FIELDS

     type      required. One of the RESOURCE_TYPES slugs below.
     title     what the card says. Square brackets mean placeholder, and a
               placeholder card renders as a div rather than a link — a card
               that looks clickable and goes nowhere is worse than one that
               plainly says it is not filled in yet.
     copy      a line or two under the title.
     meta      the small fact in the card's top line: a read time, a run
               time, a file format. Optional.
     href      where the card goes. Internal links are written
               root-absolute and relativised at render like everywhere else.
     video     a YouTube id. The card opens the lightbox instead of
               navigating, which is what "ungated video" means here. Do not
               also give it an href.
     gated     true generates /resources/<slug> as a landing page carrying
               the form, and points the card there. Works for a video or a
               download; it is the flag, not the type, that gates a thing.
     slug      required when gated, because it becomes the URL.
     file      for an ungated download: the path to the asset. The card
               links straight at it and gets a download attribute.
     featured  exactly one resource carries this. It is the full-width
               gradient card at the top of the page. Move the flag to
               feature something else; nothing else has to change.

   CASE STUDIES ARE NOT LISTED HERE. They already exist in CASES, they
   already have cards and pages, and copying them into a second array is how
   the two lists drift apart. The case studies shelf reads CASES directly.
   ========================================================================== */

/* `all` is the See-all destination. A type with one shows four cards and a
   button; a type without one shows eight in a 4x2 grid and paginates. That
   is the whole difference between the two kinds of shelf, and it is a data
   difference rather than two blocks of markup. */
/* NO SUBHEADS. Each shelf is a one-word heading and the cards under it say
   the rest; a line of explanation between the two was one more thing to read
   on the way to the thing being described. `sub` is still honoured if one
   ever comes back. */
/* THE ORDER OF THIS ARRAY IS THE ORDER OF THE PAGE, and of the filter pills
   above it. James' order, 17 September: the proof first, then the videos,
   the reading, the things somebody can take away and use, and the games
   last where they belong. (13 September had downloadables first.)
   Reordering the page is reordering this list; the last entry gets
   .to-white because the closing panel bleeds up over it. */
var RESOURCE_TYPES = [
  { slug: 'case-studies', name: 'Case studies',
    all: '/case-studies', allLabel: 'View all case studies' },

  { slug: 'videos', name: 'Videos' },

  { slug: 'blog', name: 'Blog',
    all: '/resources/blog', allLabel: 'View all blog posts' },

  { slug: 'downloadables', name: 'Downloadables' },

  { slug: 'games', name: 'Games' }
];


/* ==========================================================================
   THE LINE ART

   Navy line drawings, INLINE rather than SVG files. The first four are the
   resources drawings; the other twelve (16 September) sit in the 'What you
   get' card thumbs on the service pages, keyed by `art` on each `leave`
   entry in SERVICES. The resources four are used
   at two sizes on two grounds — a third of the featured card, where the
   drawing breaks out over the card's top edge, and inside a 16:9 card thumb
   on the games shelf — and inline means one copy of each path and
   `currentColor` doing the theme swap, instead of a file plus a filter to
   invert it when the page goes dark.

   All of them share one 240x260 box, one 3.6 stroke and round joins, so a
   slide that changes its drawing does not change the composition's weight.
   Keep anything new to the same box: the featured card sizes the art off
   its own height and lets the width fall out of the aspect ratio.
   ========================================================================== */
var ART_ATTR = 'viewBox="0 0 240 260" fill="none" stroke="currentColor" ' +
               'stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"';

var ART = {

  /* a page with the corner turned down, three lines of copy and the figures
     at the foot — the shape of every case study on this site */
  'case-study':
    '<path d="M34 22h138l48 48v150a14 14 0 0 1-14 14H34a14 14 0 0 1-14-14V36a14 14 0 0 1 14-14z"/>' +
    '<path d="M172 22v34a14 14 0 0 0 14 14h34"/>' +
    '<path d="M44 96h84M44 120h122M44 144h64"/>' +
    '<path d="M44 208h152"/>' +
    '<rect x="52" y="178" width="26" height="30" rx="5"/>' +
    '<rect x="94" y="158" width="26" height="50" rx="5"/>' +
    '<rect x="136" y="134" width="26" height="74" rx="5"/>',

  /* a calculator: display, twelve keys */
  'calculator':
    '<rect x="32" y="20" width="176" height="220" rx="20"/>' +
    '<rect x="52" y="40" width="136" height="46" rx="8"/>' +
    '<path d="M140 63h36"/>' +
    '<rect x="52" y="102" width="32" height="24" rx="7"/>' +
    '<rect x="104" y="102" width="32" height="24" rx="7"/>' +
    '<rect x="156" y="102" width="32" height="24" rx="7"/>' +
    '<rect x="52" y="134" width="32" height="24" rx="7"/>' +
    '<rect x="104" y="134" width="32" height="24" rx="7"/>' +
    '<rect x="156" y="134" width="32" height="24" rx="7"/>' +
    '<rect x="52" y="166" width="32" height="24" rx="7"/>' +
    '<rect x="104" y="166" width="32" height="24" rx="7"/>' +
    '<rect x="156" y="166" width="32" height="24" rx="7"/>' +
    '<rect x="52" y="198" width="32" height="24" rx="7"/>' +
    '<rect x="104" y="198" width="32" height="24" rx="7"/>' +
    '<rect x="156" y="198" width="32" height="24" rx="7"/>',

  /* the puzzle: a 3x3 of tiles, 12 radius, as asked */
  'scramble':
    '<rect x="10" y="20" width="66" height="66" rx="12"/>' +
    '<rect x="87" y="20" width="66" height="66" rx="12"/>' +
    '<rect x="164" y="20" width="66" height="66" rx="12"/>' +
    '<rect x="10" y="97" width="66" height="66" rx="12"/>' +
    '<rect x="87" y="97" width="66" height="66" rx="12"/>' +
    '<rect x="164" y="97" width="66" height="66" rx="12"/>' +
    '<rect x="10" y="174" width="66" height="66" rx="12"/>' +
    '<rect x="87" y="174" width="66" height="66" rx="12"/>' +
    '<rect x="164" y="174" width="66" height="66" rx="12"/>',

  /* the run: the hare off /hop, mid-leap, one obstacle cleared and the next
     one ahead. The dashed trail is the only dashed stroke in the set and it
     is doing the one thing dashes are good for. It stops short of the tail
     on purpose — run it into the body and the three curves meeting there
     read as a knot rather than as motion. */
  'hopper':
    '<path d="M12 240h216"/>' +
    '<rect x="22" y="208" width="34" height="32" rx="7"/>' +
    '<rect x="192" y="204" width="36" height="36" rx="7"/>' +
    '<path d="M44 202c5-16 9-28 14-40" stroke-dasharray="6 10"/>' +
    '<path d="M88 132c-8-24 7-43 32-41 23 2 36 18 31 37-5 17-25 23-42 18-12-3-18-7-21-14z"/>' +
    '<circle cx="166" cy="112" r="18"/>' +
    '<path d="M159 96c-9-22-12-41-4-50 9 9 11 32 12 48"/>' +
    '<path d="M170 94c0-21 5-38 14-42 5 11-1 30-5 40"/>' +
    '<circle cx="173" cy="107" r="2.8" fill="currentColor" stroke="none"/>' +
    '<path d="M146 139c10 4 16 10 17 18 5 1 10 0 14-2"/>' +
    '<path d="M135 145c8 6 13 13 14 21 5 1 10 0 14-2"/>' +
    '<path d="M106 140c-4 12-13 19-24 21-6 0-11-1-15-4"/>' +
    '<path d="M92 105c-9-1-14 5-13 11 1 6 8 9 14 6"/>',

  /* a video call, two faces on one screen and a word each way */
  'assessment-call':
    '<rect x="16" y="60" width="208" height="140" rx="16"/>' +
    '<rect x="32" y="76" width="80" height="92" rx="10"/>' +
    '<rect x="128" y="76" width="80" height="92" rx="10"/>' +
    '<circle cx="72" cy="108" r="14"/>' +
    '<path d="M50 168c0-18 10-30 22-30s22 12 22 30"/>' +
    '<circle cx="168" cy="108" r="14"/>' +
    '<path d="M146 168c0-18 10-30 22-30s22 12 22 30"/>' +
    '<circle cx="104" cy="184" r="5"/>' +
    '<circle cx="136" cy="184" r="5"/>' +
    '<path d="M104 200v24M136 200v24M84 234h72"/>' +
    '<path d="M36 16h60a12 12 0 0 1 12 12v12a12 12 0 0 1-12 12H62l-12 10v-10H36a12 12 0 0 1-12-12V28a12 12 0 0 1 12-12z"/>' +
    '<circle cx="50" cy="34" r="2.8" fill="currentColor" stroke="none"/>' +
    '<circle cx="66" cy="34" r="2.8" fill="currentColor" stroke="none"/>' +
    '<circle cx="82" cy="34" r="2.8" fill="currentColor" stroke="none"/>' +
    '<path d="M204 26h-52a10 10 0 0 0-10 10v6a10 10 0 0 0 10 10h28l12 10v-10h12a10 10 0 0 0 10-10v-6a10 10 0 0 0-10-10z"/>' +
    '<path d="M158 39h36"/>',

  /* a flowchart: start, one decision, two branches, one end. Shared by the RevOps flowchart on /services/solution-design and the complete flowchart on lead to cash */
  'flowchart':
    '<rect x="78" y="14" width="84" height="34" rx="17"/>' +
    '<path d="M120 48v14"/>' +
    '<path d="M114 56l6 7 6-7"/>' +
    '<path d="M120 66l34 32-34 32-34-32z"/>' +
    '<path d="M86 98H46v44"/>' +
    '<path d="M40 136l6 7 6-7"/>' +
    '<path d="M154 98h40v44"/>' +
    '<path d="M188 136l6 7 6-7"/>' +
    '<rect x="14" y="148" width="64" height="42" rx="8"/>' +
    '<rect x="162" y="148" width="64" height="42" rx="8"/>' +
    '<path d="M46 190v39h28"/>' +
    '<path d="M68 223l7 6-7 6"/>' +
    '<path d="M194 190v39h-28"/>' +
    '<path d="M172 223l-7 6 7 6"/>' +
    '<rect x="78" y="212" width="84" height="34" rx="17"/>',

  /* the solution design document: a page with a dotted route from where you are to a flag where you want to be */
  'solution-doc':
    '<path d="M42 16h118l46 46v170a12 12 0 0 1-12 12H42a12 12 0 0 1-12-12V28a12 12 0 0 1 12-12z"/>' +
    '<path d="M160 16v34a12 12 0 0 0 12 12h34"/>' +
    '<path d="M54 48h72M54 70h48"/>' +
    '<circle cx="64" cy="210" r="9"/>' +
    '<path d="M76 206c44-4 18-50 56-56s28-18 28-34" stroke-dasharray="7 9"/>' +
    '<path d="M160 116V78"/>' +
    '<path d="M160 80h28l-9 11 9 11h-28"/>',

  /* a CRM window, contact and pipeline, with a heart over it */
  'crm-love':
    '<rect x="14" y="70" width="212" height="170" rx="16"/>' +
    '<path d="M14 100h212"/>' +
    '<circle cx="34" cy="85" r="4"/>' +
    '<circle cx="50" cy="85" r="4"/>' +
    '<circle cx="66" cy="85" r="4"/>' +
    '<path d="M70 100v140"/>' +
    '<path d="M30 124h24M30 148h24M30 172h18"/>' +
    '<circle cx="106" cy="134" r="18"/>' +
    '<path d="M136 126h64M136 144h40"/>' +
    '<rect x="88" y="172" width="36" height="48" rx="6"/>' +
    '<rect x="136" y="172" width="36" height="34" rx="6"/>' +
    '<rect x="184" y="172" width="26" height="22" rx="6"/>' +
    '<path d="M186 58c-24-15-32-28-26-38 6-10 20-9 26 1 6-10 20-11 26-1 6 10-2 23-26 38z"/>',

  /* an open manual with a bookmark, for full documentation */
  'manual':
    '<path d="M120 62c-24-14-62-16-98-8v160c36-8 74-6 98 8z"/>' +
    '<path d="M120 62c24-14 62-16 98-8v160c-36-8-74-6-98 8z"/>' +
    '<path d="M22 214v14c36-8 74-6 98 8 24-14 62-16 98-8v-14"/>' +
    '<path d="M40 92c22-4 44-3 62 3M40 118c22-4 44-3 62 3M40 144c22-4 44-3 62 3M40 170c16-3 30-2 42 1"/>' +
    '<path d="M138 118c22-6 44-7 62-3M138 144c22-6 44-7 62-3M138 170c22-6 44-7 62-3"/>' +
    '<path d="M178 48v48l10-9 10 9V50"/>',

  /* an easel with a checklist half ticked, for training and support */
  'training':
    '<rect x="20" y="26" width="200" height="140" rx="12"/>' +
    '<path d="M104 26V14h32v12"/>' +
    '<path d="M120 166v74M82 166l-28 74M158 166l28 74"/>' +
    '<circle cx="54" cy="62" r="11"/>' +
    '<path d="M49 62l4 4 7-8"/>' +
    '<circle cx="54" cy="96" r="11"/>' +
    '<path d="M49 96l4 4 7-8"/>' +
    '<circle cx="54" cy="130" r="11"/>' +
    '<path d="M78 62h104M78 96h120M78 130h70"/>',

  /* a rosette with a gem in it and five stars under it, for HubSpot experts in your corner. An invented badge, not HubSpot's own */
  'hubspot-badge':
    '<path d="M104 141L88 196l16-6 10 14 6-58"/>' +
    '<path d="M136 141l16 55-16-6-10 14-6-58"/>' +
    '<path d="M120 28A9 9 0 0 1 139.8 31.5A9 9 0 0 1 157.3 41.6A9 9 0 0 1 170.2 57A9 9 0 0 1 177.1 75.9A9 9 0 0 1 177.1 96.1A9 9 0 0 1 170.2 115A9 9 0 0 1 157.3 130.4A9 9 0 0 1 139.8 140.5A9 9 0 0 1 120 144A9 9 0 0 1 100.2 140.5A9 9 0 0 1 82.7 130.4A9 9 0 0 1 69.8 115A9 9 0 0 1 62.9 96.1A9 9 0 0 1 62.9 75.9A9 9 0 0 1 69.8 57A9 9 0 0 1 82.7 41.6A9 9 0 0 1 100.2 31.5A9 9 0 0 1 120 28z"/>' +
    '<circle cx="120" cy="86" r="38"/>' +
    '<path d="M104 72h32l12 14-28 30-28-30z"/>' +
    '<path d="M92 86h56M112 72l-6 14 14 30 14-30-6-14"/>' +
    '<path d="M40 217L43.3 225.5L52.4 226L45.3 231.7L47.6 240.5L40 235.6L32.4 240.5L34.7 231.7L27.6 226L36.7 225.5z" fill="currentColor"/>' +
    '<path d="M80 217L83.3 225.5L92.4 226L85.3 231.7L87.6 240.5L80 235.6L72.4 240.5L74.7 231.7L67.6 226L76.7 225.5z" fill="currentColor"/>' +
    '<path d="M120 217L123.3 225.5L132.4 226L125.3 231.7L127.6 240.5L120 235.6L112.4 240.5L114.7 231.7L107.6 226L116.7 225.5z" fill="currentColor"/>' +
    '<path d="M160 217L163.3 225.5L172.4 226L165.3 231.7L167.6 240.5L160 235.6L152.4 240.5L154.7 231.7L147.6 226L156.7 225.5z" fill="currentColor"/>' +
    '<path d="M200 217L203.3 225.5L212.4 226L205.3 231.7L207.6 240.5L200 235.6L192.4 240.5L194.7 231.7L187.6 226L196.7 225.5z" fill="currentColor"/>',

  /* a light bulb giving off dollar signs, no rays, for RevOps experts in your corner */
  'revops-bulb':
    '<path d="M98 194v-12c0-18-30-32-30-66a52 52 0 0 1 104 0c0 34-30 48-30 66v12z"/>' +
    '<path d="M100 210h40M106 226h28"/>' +
    '<path d="M108 194v-30l-10-26M132 194v-30l10-26M98 138c7 6 15 6 22 0 7 6 15 6 22 0"/>' +
    '<path d="M42.8 102C40.2 97 25.2 97 25.2 105.8C25.2 113.2 42.8 110.8 42.8 118.2C42.8 127 27.8 127 25.2 122"/>' +
    '<path d="M34 93.2V130.8"/>' +
    '<path d="M214.8 102C212.2 97 197.2 97 197.2 105.8C197.2 113.2 214.8 110.8 214.8 118.2C214.8 127 199.8 127 197.2 122"/>' +
    '<path d="M206 93.2V130.8"/>' +
    '<path d="M67.3 31.6C65.2 27.4 52.6 27.4 52.6 34.8C52.6 41 67.3 39 67.3 45.2C67.3 52.6 54.8 52.6 52.6 48.4"/>' +
    '<path d="M60 24.2V55.8"/>' +
    '<path d="M187.3 31.6C185.2 27.4 172.7 27.4 172.7 34.8C172.7 41 187.3 39 187.3 45.2C187.3 52.6 174.8 52.6 172.7 48.4"/>' +
    '<path d="M180 24.2V55.8"/>',

  /* a calendar with infinity in it, for no limit on monthly hours. Shared by both retainers */
  'unlimited':
    '<rect x="22" y="40" width="196" height="196" rx="18"/>' +
    '<path d="M22 88h196"/>' +
    '<path d="M74 22v34M166 22v34"/>' +
    '<path d="M120 162c-16-24-52-24-52 0s36 24 52 0 52-24 52 0-36 24-52 0z"/>',

  /* a project board, for bi-weekly standups and PM tool access. Shared by both retainers */
  'standups':
    '<rect x="14" y="44" width="212" height="170" rx="16"/>' +
    '<path d="M14 76h212"/>' +
    '<path d="M86 76v138M154 76v138"/>' +
    '<rect x="26" y="90" width="48" height="28" rx="6"/>' +
    '<rect x="26" y="130" width="48" height="28" rx="6"/>' +
    '<rect x="98" y="90" width="44" height="28" rx="6"/>' +
    '<rect x="166" y="90" width="48" height="28" rx="6"/>' +
    '<rect x="166" y="130" width="48" height="28" rx="6"/>' +
    '<rect x="166" y="170" width="48" height="28" rx="6"/>' +
    '<path d="M32 60h28"/>',

  /* an hourglass mid-pour, for stalled revenue measured in days */
  'hourglass':
    '<path d="M56 22h128M56 238h128"/>' +
    '<path d="M74 22c0 64 36 82 36 108s-36 44-36 108"/>' +
    '<path d="M166 22c0 64-36 82-36 108s36 44 36 108"/>' +
    '<path d="M86 72h68c-8 22-24 32-34 42-10-10-26-20-34-42z"/>' +
    '<path d="M120 134v44" stroke-dasharray="4 9"/>' +
    '<path d="M86 230c6-20 22-32 34-32s28 12 34 32z"/>',

  /* a clipboard numbered one to three, the lines getting shorter, for the ranked fix list */
  'ranked':
    '<rect x="34" y="34" width="172" height="210" rx="16"/>' +
    '<rect x="86" y="18" width="68" height="32" rx="9"/>' +
    '<path d="M62 84l7-6v30"/>' +
    '<path d="M60 136c0-7 5-11 10-11s10 4 10 10c0 8-20 14-20 22h20"/>' +
    '<path d="M61 184h18l-10 10c7 0 12 4 12 10s-5 10-11 10-10-3-11-7"/>' +
    '<path d="M100 88h82M100 142h62M100 198h44"/>'
};

/* Decorative in both places it is used: the title beside it already names
   the thing, so a second reading of it is noise in a screen reader. */
function art(key, cls) {
  if (!ART[key]) return '';
  return '<svg class="rh-art' + (cls ? ' ' + cls : '') + '" ' + ART_ATTR +
         ' aria-hidden="true" focusable="false">' + ART[key] + '</svg>';
}

var RESOURCES = [

  /* ---- blog ----
     The posts live in HubSpot at /resources/blog on this domain, not in this
     repo, so a card here is a title, a line of copy and an href. `date` is
     the posted date and takes the footer slot the placeholders used for
     "Coming soon"; `thumb` is the post's featured image, cropped to the
     shelf's 16:9 and saved next to the other artwork. Add an entry per post,
     newest first: the shelf teases four and the See-all carries the rest. */
  { type: 'blog', title: 'HubSpot Data Hub, WTF is it?',
    href: '/resources/blog/hubspot-data-hub-wtf-is-it',
    thumb: 'assets/img/blog-data-hub.webp',
    date: 'Sep 12, 2026', meta: '6 min read',
    copy: 'What exactly is HubSpot Data Hub, and if you\'re in B2B SaaS or Services... why should you care? Why Data Hub is the silent hero for scaling companies.' },
  { type: 'blog', title: 'HubSpot Service Hub for B2B SaaS Customer Success',
    href: '/resources/blog/hubspot-service-hub-for-b2b-saas-customer-success',
    thumb: 'assets/img/blog-service-hub.webp',
    date: 'Sep 12, 2026', meta: '7 min read',
    copy: 'If you\'re looking to reduce churn and expand your database as a B2B SaaS, you need to look at HubSpot Service Hub.' },

  /* ---- videos ----
     `video` is a YouTube id and opens the lightbox. `gated: true` sends the
     card to its own page instead. Both kinds sit on the same shelf.

     THE THUMBNAIL IS YOUTUBE'S OWN, by URL, rather than a copy saved next
     to the other artwork. It is the one external image on the site and it
     is deliberate: the still has to stay the video's still, and the
     alternative is a file that silently goes stale the day the video is
     re-uploaded. Save a crop into assets/img and set `thumb` instead if
     that ever matters more than staying in step. */
  { type: 'videos', title: 'Growing Better In The Age Of The Builder', video: 'mYwmm15nEaQ',
    thumb: 'https://i.ytimg.com/vi/mYwmm15nEaQ/maxresdefault.jpg',
    copy: 'INBOUND 2026 keynote from HubSpot CTO, Dharmesh Shah.' },
  { type: 'videos', title: '2026 HubSpot Beginner\'s Guide', video: 'mwtGIepbACM',
    thumb: 'https://i.ytimg.com/vi/mwtGIepbACM/maxresdefault.jpg',
    copy: 'Everything someone new to HubSpot needs in 90 minutes' },
  { type: 'videos', title: 'You to the power of AI', video: 'pPQngmSEIe0',
    thumb: 'https://i.ytimg.com/vi/pPQngmSEIe0/maxresdefault.jpg',
    copy: 'INBOUND 2025 keynote from HubSpot CTO, Dharmesh Shah.' },

  /* ---- downloadables ----
     Gated per item rather than per type: some of these are worth a form and
     some are worth more as something people can pass around.

     `redirect` is where the gate lets you out. The form on the landing page
     is ours for now and simply sends the browser there on submit; when the
     HubSpot form id goes in, THE SAME URL goes in HubSpot's own redirect
     setting and this field stays as the record of where it points. */
  { type: 'downloadables', title: 'Marketing Hub ROI calculator', meta: 'Google Sheet',
    gated: true, slug: 'marketing-hub-roi-calculator',
    art: 'calculator',
    redirect: 'https://docs.google.com/spreadsheets/d/1edXmchNdj7KFnjnOTsvUG1657feyzltLTfy5-xj_DaY/edit?gid=0#gid=0',
    copy: 'Put your own numbers in and see what implementing HubSpot Marketing Hub is worth before you sign anything.',
    gateShot: 'assets/img/marketing-hub-roi-calculator.webp',
    gateLede: 'A spreadsheet that turns the Marketing Hub decision into a number.',
    gateNote: 'Built for the people who have to justify the licence rather than use it. ' +
              'Put in your list size, what you spend on the tools it replaces, what a ' +
              'lead is worth and how much of the work is manual today. It gives you a ' +
              'first-year return, a payback month and the assumptions written down ' +
              'beside the answer, so the finance conversation is about the inputs ' +
              'rather than about whether the number is made up.' },

  /* ---- games ----
     The two real ones. Both are finished and both link out, which is why
     the featured card is one of them rather than a bracketed placeholder. */
  /* NO `meta` ON EITHER. Both cards said "Plays in the browser" in the
     corner, under a heading that says Games, on a website. It was answering
     a question nobody had. */
  { type: 'games', title: 'RevOps Unscrambler',
    href: '/puzzle', art: 'scramble',
    copy: 'Eight pieces, one gap and a clock. Slide the tiles until the picture is whole, then come back and beat your time.' },
  /* A FRAME OF THE GAME, not a drawing of it. `thumb` and `art` are
     alternatives and thumb wins; the hare drawing is still in ART and is
     unused today, kept because it is the pair to the Unscrambler's tiles and
     the featured slider may want it back. */
  { type: 'games', title: 'RevOps Runner',
    href: '/hop', thumb: 'assets/img/game-runner.webp',
    copy: 'Jump the fires and duck the requests. The pace picks up the longer you last.' }
];

/* ---------- what the data means, worked out once ---------- */

/* A bracketed title is the site's placeholder convention, the same one the
   case study cards use. Here it also decides whether the card is a link:
   nothing is gained by making an empty card clickable. */
function isPlaceholder(r) { return /^\[/.test(r.title); }

/* Where a card goes, in one place, because four things can decide it and
   scattering that logic is how a gated item quietly starts linking at its
   ungated file. Order matters: gated wins over everything. */
function resHref(r) {
  if (r.gated) return '/resources/' + r.slug;
  if (r.file)  return r.file;
  return r.href || '';
}

function resOfType(slug) {
  return RESOURCES.filter(function (r) { return r.type === slug; });
}

function typeByslug(slug) {
  for (var i = 0; i < RESOURCE_TYPES.length; i++) {
    if (RESOURCE_TYPES[i].slug === slug) return RESOURCE_TYPES[i];
  }
  return null;
}

/* ---------- one resource card ----------

   The same object on every shelf, so the five sections read as one page
   rather than five. A card is one of three things and the markup says
   which:

     a link      the ordinary case
     a button    an ungated video, which opens the lightbox in place
     a div       a placeholder, inert on purpose

   NO LABEL ABOVE THE TITLE. The shelf's own heading already says what type
   these are, and a per-card kind label on top of that is the eyebrow this
   site does not use. What is worth knowing per card — a read time, a run
   time, a file format — sits in the footer beside the link, where it reads
   as a fact about the thing rather than as a category.

   The thumbnail is 16:9 on every type including the downloads. A grid where
   one shelf's cards are a different shape stops being a grid. */
function resCard(r, depth) {
  var a = up(depth);
  var ph = isPlaceholder(r);
  var href = resHref(r);
  var isVideo = r.type === 'videos';

  /* A gated item links even while its copy is bracketed: its landing page
     is generated, so the link is never dead, and the skeleton is the only
     way to see the gate before the copy is written. Everything else that is
     still a placeholder stays inert. */
  var live = !ph || r.gated;

  var tag = 'div', attrs = ' class="res-card reveal"';
  if (live && r.video) {
    tag = 'button';
    attrs = ' class="res-card reveal" type="button" data-video="' + r.video + '"';
  } else if (live && href) {
    tag = 'a';
    attrs = ' class="res-card reveal" href="' + href + '"' +
            (r.gated ? ' data-res-gated' : '') +
            (r.file ? ' download' : '') +
            (/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '');
  }

  /* A dashed well rather than a grey block, the same as the case study logo
     slot: an empty frame reads as "no artwork yet" where a filled grey
     rectangle reads as a broken image. Give the entry a `thumb` and it goes
     solid. */
  /* `art` is one of the inline line drawings, on its own pale plate so the
     navy reads in both themes; `thumb` is a picture, and an absolute one is
     left alone rather than having the page's ../ glued to the front of it. */
  var media = r.art
    ? art(r.art)
    : r.thumb
    ? '<img src="' + (/^https?:/.test(r.thumb) ? '' : a) + r.thumb +
      '" alt="" aria-hidden="true" loading="lazy">'
    : '<span class="res-thumb-ph" aria-hidden="true"></span>';

  /* The play badge means "this one plays here", so a gated video does not
     get it: that card goes to a form, and a play button on it promises
     something the click does not do. */
  var badge = isVideo && !r.gated
    ? '\n            <span class="res-play" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24"><path d="M8 5.1v13.8L19 12z"/></svg></span>'
    : '';

  /* NO GATED CHIP. There was one, a "Gated" label over the thumbnail, and it
     came off on 17 September: the card's "Get it" already says a form is
     next, and a warning label on the thing you most want downloaded reads
     as a reason not to click. data-res-gated stays on the card so the
     smoke test can still find the gated ones. */

  /* `live`, not `ph`: a gated item is still a placeholder in its copy but
     its page exists, so the card is a link and saying "Coming soon" on a
     link that goes somewhere is a lie.

     A `date` replaces the verb rather than sitting beside it. On a shelf of
     posts the useful thing to know at a glance is how old one is, and the
     whole card is already the link. */
  var go = !live   ? 'Coming soon'
         : r.date  ? r.date
         : r.video ? 'Watch <span class="arrow" aria-hidden="true">&rarr;</span>'
         : r.gated ? 'Get it <span class="arrow" aria-hidden="true">&rarr;</span>'
         : r.file  ? 'Download <span class="arrow" aria-hidden="true">&rarr;</span>'
         :           'Open <span class="arrow" aria-hidden="true">&rarr;</span>';

  return '        <' + tag + attrs + ' data-res-type="' + r.type + '">\n' +
    '          <span class="res-thumb' + (r.art ? ' is-art' : '') + '">' +
      media + badge + '\n          </span>\n' +
    '          <h3 class="res-title">' + r.title + '</h3>\n' +
    (r.copy ? '          <p class="res-copy">' + r.copy + '</p>\n' : '') +
    '          <span class="res-foot">\n' +
    '            <span class="res-go">' + go + '</span>\n' +
    (r.meta ? '            <span class="res-fact">' + r.meta + '</span>\n' : '') +
    '          </span>\n' +
    '        </' + tag + '>';
}

/* A case study rendered as a resource card, so that shelf sits in the same
   grid as the other four. The poster card off the homepage is a 3:4
   portrait, and a row of those beside rows of 16:9 cards reads as two
   designs on one page. The link, the name and the figures all still come
   from CASES — this is a second view of that data, not a copy of it, which
   is why it took the real client names the moment CASES did. */
function caseResCard(c, depth) {
  var a = up(depth);

  /* THE SAME FOUR ROWS THE CASE STUDY'S OWN META COLUMN CARRIES, in the
     same order, read out of the same arrays, and set the same way: a light
     label with the value in bold under it. They were boxed tags until 17
     September. The figures sat here before that, and while they were still
     placeholders they meant a shelf of cards saying 00% and [measure].

     Services stay unlinked here, unlike on the case study page: the whole
     card is already a link, and a link inside a link is invalid markup.
     Location is left off, as it was when these were tags. Every element is
     a span because the card is an <a>. */
  var meta = [
    ['Service(s) used', c.svc.map(serviceName)],
    ['Tools used',      [crmList(c).map(function (t) { return labelFor(CRMS, t, 1); }).join(', ')]],
    ['Industry',        [industryList(c).map(function (i) { return labelFor(INDUSTRIES, i, 1); }).join(', ')]],
    ['Team size',       [labelFor(STAGES, c.stage, 2) + ' people']]
  ];

  return '        <a class="res-card reveal" href="/case-studies/' + c.slug + '" data-res-type="case-studies">\n' +
    '          <span class="res-thumb">\n' +
    '            <img src="' + a + (c.img || 'assets/img/case-study-placeholder.svg') +
      '" alt="" aria-hidden="true" loading="lazy">\n' +
    '          </span>\n' +
    '          <h3 class="res-title">' + c.name + '</h3>\n' +
    '          <span class="res-meta">\n' +
      meta.map(function (row) {
        return '            <span class="res-meta-row">' +
          '<span class="res-meta-label">' + row[0] + '</span>' +
          '<span class="res-meta-val">' + row[1].map(function (v) {
            return '<span>' + v + '</span>';
          }).join('') + '</span></span>';
      }).join('\n') + '\n' +
    '          </span>\n' +
    '          <span class="res-foot">\n' +
    '            <span class="res-go">Read it <span class="arrow" aria-hidden="true">&rarr;</span></span>\n' +
    '          </span>\n' +
    '        </a>';
}

/* ---------- one shelf ----------

   Every section is this function. What differs between them is in the data:
   a type with an `all` destination shows one row of four and a link under
   it, a type without one shows two rows of four and pages through the rest.

   PAGINATION IS IN THE MARKUP ONLY WHEN IT IS NEEDED. Eight cards at a page
   size of eight means no control at all, which is why the games shelf has
   none and nothing had to be special-cased to get that.

   See-all is a .text-link and not a button. Boxed buttons on this site mean
   booking or requesting, and nothing else — see the ground rules.

   The section carries data-res-section so the filter at the top can hide it
   whole. Filtering by hiding sections rather than cards is deliberate: this
   page is a shelf of shelves, and a filter that leaves five headings behind
   with one card under each is answering a different question. */
function resShelf(type, cards, depth, cls) {
  var per = type.all ? 4 : 8;

  /* A shelf with a See-all destination is a TEASER: it shows one row and
     sends you to the full list for the rest. Without this slice the fifth
     case study started a second row on its own, which reads as a broken
     grid and makes the See-all link pointless. A shelf without a See-all
     keeps every card and pages through them instead. */
  if (type.all) cards = cards.slice(0, per);

  var pages = Math.ceil(cards.length / per) || 1;

  var all = type.all
    ? '\n      <div class="res-all">\n' +
      '        <a class="text-link" href="' + type.all + '"' +
      (type.external ? ' target="_blank" rel="noopener"' : '') + '>' +
      type.allLabel + ' <span class="arrow" aria-hidden="true">&rarr;</span></a>\n' +
      '      </div>\n'
    : '';

  var pager = (!type.all && pages > 1)
    ? '\n      <div class="res-pager" data-res-pager>\n' +
      '        <button class="res-page-btn" type="button" data-res-prev aria-label="Previous ' +
        type.name.toLowerCase() + '">&larr;</button>\n' +
      '        <span class="res-page-count" data-res-page-count role="status">Page 1 of ' + pages + '</span>\n' +
      '        <button class="res-page-btn" type="button" data-res-next aria-label="More ' +
        type.name.toLowerCase() + '">&rarr;</button>\n' +
      '      </div>\n'
    : '';

  return '\n<section class="section res-shelf' + (cls ? ' ' + cls : '') +
    '" data-res-section="' + type.slug + '" id="' + type.slug + '">\n' +
    '  <div class="shell">\n' +
    '    <div class="res-shelf-head">\n' +
    '      <h2 class="h2">' + type.name + '</h2>\n' +
    (type.sub ? '      <p class="sec-sub sec-sub-left">' + type.sub + '</p>\n' : '') +
    '    </div>\n' +
    '\n' +
    '    <div class="res-grid" data-res-grid data-res-per="' + per + '">\n' +
    cards.join('\n') + '\n' +
    '    </div>\n' +
    all + pager +
    '  </div>\n' +
    '</section>\n';
}

/* ---------- the featured slider ----------

   THREE resources rather than one, on a fifteen second rotation with three
   dots underneath. The card itself is the plate off the case study pages —
   mist, the soft white scrim and the same artwork behind it — rather than
   the warm ramp it used to carry, so /resources and a case study open on
   the same object.

   THE INK IS PINNED, the same as .cs-head-panel and .call-panel. The card
   brings its own light ground with it, so navy that followed the page would
   turn pale-on-pale the moment someone switched to dark.

   NOTHING ON THE CARD BUT THE FOUR THINGS: title, a line of description,
   the link, and the drawing. The kind-and-format line that used to sit in
   the corner ("Game · Plays in the browser") is gone — a full-width card at
   the top of the page is already saying this is the featured one, and the
   shelf below says what type each thing is.

   The drawing is anchored to the BOTTOM of the card and is taller than it,
   so it climbs out over the top edge into the header above. That is the
   whole effect and it is one rule in the stylesheet — see .res-feature-art.

   The slides are stacked in one grid cell rather than laid out in a row:
   the card is then as tall as the tallest of the three and does not resize
   under the reader as it rotates. site.js does the rest and the markup
   works without it, showing the first slide and three inert dots.

   Order is deliberate: the case study is the strongest of the three and it
   is what a first-time visitor should land on. */
var FEATURED = [
  { art: 'case-study', kind: 'Case study', title: 'Ignite Group',
    href: '/case-studies/Ignite-Group', go: 'Read the case study',
    copy: 'Three countries running three versions of the same pipeline, and a board asking for one number. What we were handed, what changed, and what it was worth.' },

  { art: 'calculator', kind: 'Downloadable', title: 'Marketing Hub ROI calculator',
    href: '/resources/marketing-hub-roi-calculator', go: 'Get the calculator',
    copy: 'Put your own numbers in and see what implementing HubSpot Marketing Hub is worth before you sign anything.' },

  { art: 'scramble', kind: 'Game', title: 'RevOps Unscrambler',
    href: '/puzzle', go: 'Play it',
    copy: 'Eight pieces, one gap and a clock. Slide the tiles until the picture is whole, then come back and beat your time.' }
];

function resFeatured(depth) {
  if (!FEATURED.length) return '';

  /* THE WHOLE SLIDE IS THE LINK. It was an <article> with a text link inside
     it, which meant a card the size of a billboard had one clickable line on
     it. The "Read the case study" line is now a span that looks like the
     link it used to be and the <a> is the card.

     That is also why site.js cannot simply look for links INSIDE a hidden
     slide when it takes them out of the tab order: on this markup the slide
     is the link. */
  var slides = FEATURED.map(function (f, i) {
    return '        <a class="res-feature' + (i === 0 ? ' is-on' : '') + '"\n' +
           '           data-res-slide href="' + f.href + '"' +
           (i === 0 ? '' : ' tabindex="-1"') + ' aria-hidden="' + (i === 0 ? 'false' : 'true') + '">\n' +
           '          <span class="res-feature-text">\n' +
           '            <span class="res-feature-kind">' + f.kind + '</span>\n' +
           '            <span class="res-feature-title">' + f.title + '</span>\n' +
           '            <span class="res-feature-copy">' + f.copy + '</span>\n' +
           '            <span class="res-feature-go">' + f.go +
                        ' <span class="arrow" aria-hidden="true">&rarr;</span></span>\n' +
           '          </span>\n' +
           '          <span class="res-feature-art">' + art(f.art) + '</span>\n' +
           '        </a>';
  }).join('\n');

  var dots = FEATURED.map(function (f, i) {
    return '        <button class="res-feature-dot" type="button" data-res-dot\n' +
           '                aria-current="' + (i === 0 ? 'true' : 'false') + '"\n' +
           '                aria-label="Show ' + f.title.replace(/"/g, '&quot;') + '"></button>';
  }).join('\n');

  return '\n<!-- ===================== FEATURED =====================\n' +
'     Three resources on the case study plate, rotating every fifteen\n' +
'     seconds. Edit FEATURED in tools/build-pages.js; nothing here is\n' +
'     written by hand, and the drawings are in ART beside it. -->\n' +
'<section class="res-feature-section" aria-labelledby="featured-heading">\n' +
'  <div class="shell">\n' +
'    <div class="res-feature-wrap reveal" data-res-slider>\n' +
'      <h2 class="res-feature-eyebrow" id="featured-heading">Featured resources</h2>\n' +
'      <div class="res-feature-stack">\n' +
slides + '\n' +
'      </div>\n' +
'      <div class="res-feature-dots" role="group" aria-label="Choose a featured resource">\n' +
dots + '\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n';
}

/* ---------- the type filter ----------

   One row of pills, single choice, All by default. It hides whole SECTIONS
   rather than individual cards, which is the honest reading of a page that
   is a shelf of shelves: filtering to Videos should leave you on the videos
   shelf, not on five headings with one card under each.

   Generated from RESOURCE_TYPES, so a sixth type is a sixth pill and no
   edit here. site.js reads data-res-pick and nothing else. */
function resFilter() {
  return '\n<!-- ===================== TYPE FILTER =====================\n' +
'     Generated from RESOURCE_TYPES. Hides sections, not cards. -->\n' +
'<section class="res-filter-section">\n' +
'  <div class="shell">\n' +
'    <div class="res-filter reveal" data-res-filter role="group" aria-label="Filter by resource type">\n' +
'      <button class="res-tab" type="button" aria-pressed="true" data-res-pick="all">All</button>\n' +
  RESOURCE_TYPES.map(function (t) {
    return '      <button class="res-tab" type="button" aria-pressed="false" data-res-pick="' +
           t.slug + '">' + t.name + '</button>';
  }).join('\n') + '\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n';
}

/* ---------- the page ----------

   Header, featured card, filter, then one shelf per type in the order
   RESOURCE_TYPES declares them. The last shelf carries .to-white because
   the closing panel bleeds up over whatever is above it.

   The lightbox sits at the end of main, once, outside every section: a
   <dialog> in the top layer does not care where it is in the document, and
   one of them serves every video card on the page. */
var resourcesIndex = {
  file: 'resources/index.html',
  depth: 1,
  navCurrent: '/resources',
  title: 'Resources — RevHops',
  description: 'RevOps resources from RevHops: blog posts, case studies, videos, downloadable templates and a couple of games.',
  h1: 'Resources',
  lede: 'Everything we have written, recorded, drawn up or built, in one place.',

  /* No artwork column, same as /services: the type is the only thing
     holding the top of the page and .page-hero-plain steps it down. */
  heroClass: 'page-hero-nomedia',
  mainClass: 'res-index',

  body:
    resFeatured(1) +
    resFilter() +
    RESOURCE_TYPES.map(function (t, i) {
      var cards = t.slug === 'case-studies'
        ? CASES.map(function (c) { return caseResCard(c, 1); })
        : resOfType(t.slug).map(function (r) { return resCard(r, 1); });
      return resShelf(t, cards, 1, i === RESOURCE_TYPES.length - 1 ? 'to-white' : '');
    }).join('') +

'\n<!-- ===================== VIDEO LIGHTBOX =====================\n' +
'     One dialog for every ungated video on the page. site.js writes the\n' +
'     iframe src on open and REMOVES it on close: leaving the src in place\n' +
'     keeps YouTube playing behind a closed dialog, which is audible. -->\n' +
'<dialog class="res-lightbox" data-res-lightbox aria-label="Video player">\n' +
'  <button class="res-lightbox-close" type="button" data-res-lightbox-close aria-label="Close video">\n' +
'    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>\n' +
'  </button>\n' +
'  <div class="res-lightbox-frame" data-res-lightbox-frame></div>\n' +
'</dialog>\n'
};

/* ---------- a gated resource's own page ----------

   Generated for every resource carrying `gated: true`, at /resources/<slug>.
   The left half says what the thing is; the right half is the form that
   hands it over. Same two-column split /call uses, and for the same reason:
   the reassurance has to be beside the thing you are asking someone to fill
   in, not above it where it scrolls away on a phone.

   THE FORM IS OURS FOR NOW, and it works: four fields, the browser's own
   validation, and on submit the browser goes to the resource's `redirect`.
   That is the whole gate, and it is here so the flow can be walked end to
   end before the real form exists.

   IT IS NOT A REAL GATE. Nothing is stored and nothing stops anybody typing
   the destination straight into the address bar, which is the honest state
   of a static site asking for an email. HubSpot portal 46722926 is already
   in the head of every page; when the form id goes in, this <form> is
   replaced by the embed and the SAME `redirect` goes into HubSpot's own
   redirect setting, so the field here stays as the record of where the gate
   lets you out. */
function resourcePage(r) {
  var type = typeByslug(r.type);
  return {
    file: 'resources/' + r.slug + '.html',
    depth: 1,
    navCurrent: '/resources',
    title: r.title + ' — RevHops',
    description: r.copy,
    h1: r.title,
    lede: r.copy,
    heroClass: 'page-hero-nomedia',
    eyebrow: ['All resources', '/resources'],
    meta: [['Type', type.name.replace(/s$/, '')], ['Format', r.meta || '—'], ['Cost', 'Free']],
    noClose: true,
    body:
'\n<section class="section res-gate-section to-white">\n' +
'  <div class="shell">\n' +
'    <div class="res-gate">\n' +
'      <div class="res-gate-text reveal reveal-left">\n' +

/* A PICTURE OF THE THING, WHERE THE HEADLINE WAS. `gateShot` replaces the
   one-line statement rather than sitting under it: somebody who has landed
   on a form wants to know what they are filling it in for, and a screenshot
   of the spreadsheet answers that in less time than a sentence about it
   does. The line is still in `gateLede` and is doing its other job as the
   page's description in the head. A resource with no shot falls back to the
   statement, which is what every gated page looked like before. */
  (r.gateShot
    ? '        <figure class="res-gate-shot">\n' +
      '          <img src="' + up(1) + r.gateShot + '" alt="' +
                 (r.gateLede || r.title).replace(/"/g, '&quot;') + '" loading="lazy">\n' +
      '        </figure>\n'
    : '        <p class="statement">' + (r.gateLede || '[What this is, in a line.]') + '</p>\n') +

'        <p class="statement-note">' + (r.gateNote ||
   '[Two or three sentences on who it is for and what they will be able to do with it ' +
   'that they cannot do now.]') + '</p>\n' +
'      </div>\n' +
'      <div class="res-gate-form reveal reveal-right">\n' +
'        <h2 class="res-gate-title">Where should we send it?</h2>\n' +
'\n' +
'        <!-- Swap this whole <form> for the HubSpot embed when the form id\n' +
'             exists, and put the same URL in HubSpot\'s redirect setting. -->\n' +
'        <form class="form res-gate-fields" method="get"\n' +
'              action="' + (r.redirect || '/resources') + '"\n' +
'              data-res-gate="' + (r.redirect || '') + '">\n' +
'          <div class="form-row">\n' +
'            <div class="field">\n' +
'              <label for="gate-first">First name</label>\n' +
'              <input id="gate-first" name="firstname" type="text" autocomplete="given-name" required>\n' +
'            </div>\n' +
'            <div class="field">\n' +
'              <label for="gate-last">Last name</label>\n' +
'              <input id="gate-last" name="lastname" type="text" autocomplete="family-name" required>\n' +
'            </div>\n' +
'          </div>\n' +
'          <div class="field">\n' +
'            <label for="gate-email">Work email</label>\n' +
'            <input id="gate-email" name="email" type="email" autocomplete="email" required>\n' +
'          </div>\n' +
'          <div class="field">\n' +
'            <label for="gate-company">Company</label>\n' +
'            <input id="gate-company" name="company" type="text" autocomplete="organization">\n' +
'          </div>\n' +
'          <div class="form-foot">\n' +
'            <button class="btn btn-primary" type="submit">' +
              (r.type === 'videos' ? 'Watch it' : 'Get it') + '</button>\n' +
'            <p class="form-note">Straight through to it on submit. No sequence, no drip.</p>\n' +
'          </div>\n' +
'        </form>\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n'
  };
}

var GATED = RESOURCES.filter(function (r) { return r.gated; });

/* ---------- /pipedrive ----------

   Added 11 September. REBUILT 16 SEPTEMBER on /hubspot's layout, at James'
   request, so the two partner pages read as a pair:

     hero          title, lede, the audit link and the call, the partner
                   badge in the mark column
     what it does  six cards, a title and a line each, no chips
     the stack     the tool clump, minus Pipedrive and the other two CRMs
     the trial     where /hubspot has the review and the profile screenshot
     the ask       the svc-row list

   What went: the co-branded banner at the top with its heading, the chips
   in the cards, and "Which plan you actually need" (/hubspot has no tier
   list either). PD_PLANS went with it; it is in git before this change.

   THE PARTNER BADGE, and why it is not the green box any more. Pipedrive's
   Authorized Partner artwork is a solid green rectangle, and in the mark
   column it read as a sticker slapped on the corner of the page, louder than
   the title beside it. The badge is now the same artwork with the box
   dropped, in navy on the light theme and white on the dark one: the white
   file is the footer's (see pipedrive-partner-badge-white.webp), and the
   navy one is that file recoloured. It sits where the Platinum badge sits
   on /hubspot, so the two pages make the claim in the same place and at
   the same weight.

   THERE IS NO PIPEDRIVE PARTNER PROFILE to link the badge to, so it links to
   the trial, James' call. The trial section further down carries the
   partner status in words and the affiliate disclosure, and the co-branded
   banner moved there, where it is the picture for the offer rather than a
   banner with nothing to say.

   Flat paper end to end, same as /hubspot. No disc, no navy band. */

var PD_TRIAL = 'https://app.pipedrive.com/affiliate/pdp-revhops' +
               '?utm_source=RevHops&amp;utm_medium=partners_program' +
               '&amp;utm_content=copy_text&amp;utm_term=pdp-revhops';

/* What the product actually does, in the order a sales team meets it. Cards
   without links: none of these is a page in waiting, and a "Learn more"
   arrow that goes nowhere is worse than no arrow. No chips since 16
   September; James called them repetitive and meaningless. */
var PD_FEATURES = [
  { title: 'Pipeline and deals',
    copy: 'Stages you define per pipeline, dragged across a board anyone can read at a glance, with rotting alerts when a deal has sat too long.' },
  { title: 'Activity-based selling',
    copy: 'Every open deal carries a next step. It is the one opinion the product has, and it is the reason Pipedrive stays current when other CRMs do not.' },
  { title: 'Automation',
    copy: 'Stage changes that create the follow-up, update the field and tell the right person, built in the workflow editor rather than by a developer.' },
  { title: 'Email and Campaigns',
    copy: 'Two-way inbox sync, templates and group email on the record. Campaigns adds the marketing sends if that side of the house lives here too.' },
  { title: 'Insights and forecasting',
    copy: 'Dashboards, goals and a revenue forecast built off deal data, so the number in the review is the number in the CRM.' },
  { title: 'Quotes, docs and delivery',
    copy: 'Smart Docs for quotes and e-signatures, and Projects for the work that starts the moment the deal closes.' }
];

/* The audit and the fit question first, the same order /hubspot's four run
   in. The other three are the work itself. */
var PD_WAYS = [
  { title: 'Request a Pipedrive audit', href: '/audit', go: 'Request an audit',
    copy: 'Inherited, half-built, or three admins deep. We look at the pipeline and the data first, and tell you what to fix, unless starting again is honestly cheaper.' },
  { title: 'Work out whether Pipedrive is right for you', href: '/call', go: 'Schedule a discovery call',
    copy: 'Before anyone signs anything. Pipedrive is a sales CRM and a very good one. If what you need is a marketing engine and a service desk on the same record, we will say so.' },
  { title: 'Set Pipedrive up from scratch', href: '/services/crm-implementations', go: 'See how we do it',
    copy: 'Pipelines and stages that match how you actually sell, fields people will fill in, automations that remove admin rather than add it, and training your team still uses after we have gone.' },
  { title: 'Migrate onto Pipedrive', href: '/services/crm-implementations', go: 'See the work',
    copy: 'Off spreadsheets, or off a CRM that grew in the wrong direction. Deals, contacts, history and integrations moved without losing the audit trail.' },
  { title: 'Connect it to the rest of the stack', href: '/services/lead-to-cash-process-mapping', go: 'See the work',
    copy: 'Quoting, billing, support and marketing. The API, the webhooks and the marketplace, wired so finance and sales are reading the same number.' }
];

var pipedrive = {
  file: 'pipedrive/index.html',
  depth: 1,
  navCurrent: '/pipedrive',
  title: 'Pipedrive Authorized Partner — RevHops',
  description: 'RevHops is an Authorized Pipedrive Partner. We set Pipedrive up, clean up the account you already have, and connect it to the rest of your stack.',
  heroClass: 'page-hero-markhead',
  h1: 'Pipedrive',
  lede: 'A simple, visual sales CRM built around the pipeline. Easy for a rep to learn in an afternoon, which is why the data in it tends to be true.',

  /* See the note above the page on why this is not the green box. */
  media: { src: 'assets/img/pipedrive-partner-badge-navy.webp',
           srcDark: 'assets/img/pipedrive-partner-badge-white.webp',
           alt: 'Pipedrive Authorized Partner', mark: true,
           href: PD_TRIAL, rel: 'noopener sponsored',
           note: 'Try Pipedrive free for 30 days' },

  /* Same pair as /hubspot: the audit as a text link, the call as the one
     boxed button. The trial has its own section below. */
  headButtons: '          <a class="text-link" href="/audit">Request a Pipedrive audit ' +
               '<span class="arrow" aria-hidden="true">&rarr;</span></a>\n' +
               '          <a class="btn btn-primary" href="/call">Schedule a discovery call</a>',

  body:

    /* WHAT IT DOES. Six cards, none of them linked. The page's one highlight
       lives here, where /hubspot keeps its own. */
    section(
      secHead('What you get <span class="hl">out of the box</span>') +
'    <div style="margin-top:clamp(22px,2.6vw,34px)">\n' +
      pcards(PD_FEATURES, 'pcards-3') +
'    </div>\n') +

    /* THE STACK. Pipedrive's own mark comes out for the reason HubSpot's does
       on /hubspot, and so do HubSpot and Salesforce: a page selling one CRM
       should not show two others as things to plug into it. */
    section(
      secHead('Connect Pipedrive to all the tools in your stack', null, 'centred') +
      toolClump(1, ['pipedrive', 'hubspot', 'salesforce']), 'section') +

    /* THE TRIAL. Copy and the button on the left, the co-branded banner on
       the right, in the slot /hubspot gives its review and profile.

       THE DISCLOSURE STAYS WITH THE BUTTON. It is a partner link and we may
       earn from it, and a disclosure you have to go looking for is not one. */
    section(
'    <div class="pd-trial">\n' +
'      <div class="pd-trial-copy reveal reveal-left">\n' +
'        <h2 class="h2">Try Pipedrive free for 30 days</h2>\n' +
'        <p class="lede">The full product, no card required. Build a pipeline, bring in a few live deals and see whether your team keeps it current before anyone signs anything.</p>\n' +
'        <p class="pd-trial-status">RevHops is an Authorized Pipedrive Partner, certified by Pipedrive in sales and customer support.</p>\n' +
'        <div class="btn-row">\n' +
'          <a class="btn btn-primary" href="' + PD_TRIAL + '"\n' +
'             target="_blank" rel="noopener sponsored">Start a free 30-day trial</a>\n' +
'        </div>\n' +
'        <p class="partner-note">This is a partner link, so we may earn a commission if you subscribe. It costs you nothing and it does not change what we recommend.</p>\n' +
'      </div>\n' +
'      <a class="pd-trial-shot reveal reveal-right" href="' + PD_TRIAL + '"\n' +
'         target="_blank" rel="noopener sponsored" tabindex="-1" aria-hidden="true">\n' +
'        <img src="' + up(1) + 'assets/img/pipedrive-revhops.webp" alt="" loading="lazy">\n' +
'      </a>\n' +
'    </div>\n') +

    /* THE ASK. Same rows /hubspot uses. .to-white because the closing panel
       bleeds up over whatever section is last. */
    section(
      secHead('How we help teams with Pipedrive') +
'    <div class="svc-list svc-list-plain reveal" style="margin-top:clamp(18px,2.2vw,28px)">\n' +
      PD_WAYS.map(function (w) {
        return '      <a class="svc-row" href="' + w.href + '">\n' +
               '        <h3 class="svc-title">' + w.title + '</h3>\n' +
               '        <p class="svc-copy">' + w.copy + '</p>\n' +
               '        <span class="svc-go">' + w.go + ' <span class="arrow">&rarr;</span></span>\n' +
               '      </a>';
      }).join('\n') + '\n' +
'    </div>\n', 'section to-white')
};


/* ---------- the newsletter opt-in ----------
   Added 11 September, because the new Resources column in the footer links
   to it and a link with nowhere to land is worse than no link.

   THE FORM ID IS A PLACEHOLDER. Portal 46722926 is right; the id below is
   not a real form yet. Create the newsletter form in HubSpot, paste its id
   here and rebuild, and the embed renders. Until then the page still reads
   as a page — the three cards under the form carry the promise — but the
   fields will not appear, so do this before the link goes out anywhere. */
var newsletter = {
  file: 'newsletter.html',
  depth: 0,
  navCurrent: '',
  title: 'The RevHops newsletter',
  description: 'One email a month on what breaks in revenue systems, what it costs to leave it, and what we did about it. No sequence, no pitch.',
  heroClass: 'page-hero-nomedia',
  h1: 'One email a month',
  lede: 'What broke in somebody\'s revenue system, what it cost them to leave it, and what the fix actually looked like. Written the week it goes out, not queued up in a sequence six months ago.',
  body:
    /* The embed is not wrapped in .reveal: that class animates with
       transform and filter, which makes the wrapper a containing block and
       lands HubSpot's own error toasts in the wrong place. The head above
       it carries the reveal instead, exactly as /contact does. */
    section(
'    <div class="optin-wrap">\n' +
'      <div class="contact-col-head reveal" style="text-align:center;align-items:center">\n' +
'        <h2>Sign up</h2>\n' +
'        <p>An email address is all we ask for. Unsubscribe is one click and we do not chase it.</p>\n' +
'      </div>\n' +
'      <!-- HubSpot form, portal 46722926. See the note above this page in\n' +
'           tools/build-pages.js: the form id is a placeholder. -->\n' +
'      <script src="https://js.hsforms.net/forms/embed/46722926.js" defer><\/script>\n' +
'      <div class="hs-form-frame" data-region="na1"\n' +
'           data-form-id="[NEWSLETTER-FORM-ID]"\n' +
'           data-portal-id="46722926"></div>\n' +
'    </div>\n') +

    section(
      secHead('What you are signing up for') +
      pcards([
        { n: '01', title: 'One story, told properly',
          copy: 'A system that was not working, what it was costing, and the change that fixed it. Long enough to be useful, short enough to read standing up.' },
        { n: '02', title: 'Monthly, and that is all',
          copy: 'One send a month. No drip sequence behind it, no second email three days later asking whether you saw the first one.' },
        { n: '03', title: 'Nothing sold to you',
          copy: 'We do not rent the list, we do not pass it to anyone, and the only thing we ever ask is whether the last one was worth your time.' }
      ], 'pcards-3'), 'section to-white')
};


/* ---------- /audit ----------
   Added 11 September, because three buttons on this site said "request an
   audit" and all three landed on /contact, which is a general form with a
   general question on it. An audit request arrived looking like a support
   enquiry, and the promise /hubspot makes at the top of the page - an hour
   in the portal, a written page back - was made once and then never
   mentioned again on the page that took the click.

   THE FORM IS ITS OWN, and that is the point of the page. Portal 46722926,
   form 579026d7-b138-4813-a166-c3d970e76dae, which exists so an audit
   request lands as an audit request. Do not swap it for the /contact form
   id; the two are not interchangeable.

   THE TURNAROUND IS A TYPED STRING. The pill under the nav says two to
   three business days and nothing derives or checks it. If the queue gets
   longer, change it here or take the pill out - see `pill` in pageHero.

   HUBSPOT FIRST, and a short aside at the bottom for everyone else. Most of
   what arrives is a HubSpot portal, the six things we look at are named the
   way HubSpot names them, and pretending the page is platform-neutral would
   make all six of them vaguer. The aside is two rows, not a second half.

   Free, and said plainly twice: in the meta row at the top and in the third
   card of what comes back. llms.txt says the same thing, so if this ever
   stops being free, both change. */

var AUDIT_LOOK = [
  { title: 'Data and objects',
    copy: 'Contacts, companies, deals and anything custom. Duplicates, properties nobody has filled in since the year they were made, and the fields your reporting quietly depends on.' },
  { title: 'Pipelines and lifecycle',
    copy: 'Whether the stages match how you actually sell, and whether a lifecycle stage means the same thing to marketing, to sales and to whoever built the dashboard.' },
  { title: 'Automation',
    copy: 'Every live workflow, what fires it, and which two are fighting each other over the same property. Usually the fastest thing to fix and the last thing anyone looks at.' },
  { title: 'Reporting',
    copy: 'The dashboards people open, the ones they do not, and whether the number at the top of them is one you could defend in a board meeting.' },
  { title: 'Integrations and sync',
    copy: 'What writes into the portal, what reads out of it, and the place a record gets overwritten every night by something upstream that nobody owns.' },
  { title: 'Access and adoption',
    copy: 'Who is in the portal, what they can see, and the spreadsheet your team invented to get around the bit that does not work.' }
];

var AUDIT_ELSE = [
  { title: 'Pipedrive', href: '/pipedrive', go: 'See more',
    copy: 'Same hour, same written page. We are an Authorized Partner there too, and the pipeline and the data are where we start.' },
  { title: 'Something else entirely', href: '/contact', go: 'Tell us what you&rsquo;ve got',
    copy: 'Salesforce, Zoho, Dynamics, or a spreadsheet that became a CRM somewhere along the way &mdash; send us access and we&rsquo;ll take a look.' }
];

var audit = {
  file: 'audit.html',
  depth: 0,
  /* No nav item: the bar is at seven and James ruled an eighth crowds it
     when /pipedrive came up. This is linked from the footer's Services
     column, from both audit CTAs on /hubspot and from /pipedrive. */
  navCurrent: '',
  title: 'Free HubSpot audit — RevHops',
  description: 'A free audit of your HubSpot portal. An hour inside it and a written page back: what is set up well, what is quietly costing you, and the three things worth fixing first.',

  /* Built like a service page now, because it is one: same header spacing,
     same back link, same meta row on one line. The status pill that used to
     sit above the H1 is gone — a typed turnaround promise in the header was
     one more thing to keep true, and the meta row under it already says 2–3
     business days. */
  heroClass: 'page-hero-nomedia page-hero-svc',
  eyebrow: ['All services', '/services'],
  h1: 'Free HubSpot audit',

  /* the homepage's own words for this, verbatim. See the note on lede in
     servicePage: the card someone clicked and the page they land on have to
     say the same thing. */
  lede: 'Complimentary audit. We&rsquo;ll look at your data hygiene, pipelines &amp; stages, automations, integrations and adoption.',

  /* FOUR ROWS ON A WIDE SCREEN, THREE ON A PHONE. The meta row lays out as
     a wrapping grid at phone width and a fourth item leaves one orphan on a
     second line; Commitment is the one that says least, so it is the one
     that goes — see .hero-meta in the phone block. "business" comes out of
     the turnaround the same way, which is what keeps it on one line. */
  meta: [
    ['Cost', 'Free'],
    ['Turnaround', '2–3 <span class="meta-long">business </span>days'],
    ['What we need', 'Read-only access'],
    ['Commitment', 'None']
  ],

  body:
    /* THE SIX, straight under the header. The page's one highlight is spent
       here. It used to run second, behind the form; the form is now the
       last thing on the page, so what we look at is what you read first. */
    section(
      secHead('What we&rsquo;ll <span class="hl">look at</span>',
              'Six passes through the portal, in this order, because each one changes what the next one means.') +
'    <div style="margin-top:clamp(22px,2.6vw,34px)">\n' +
      pcards(AUDIT_LOOK, 'pcards-3') +
'    </div>\n') +

    /* THE ASIDE, and the example page beside it. Two rows, not a second
       half of the page, so the column next to them was the one place on
       this page with room for the picture of what comes back — and it earns
       its keep there, because the aside is the lightest thing here.

       A PLACEHOLDER. James is supplying a screenshot of a real audit page;
       until it lands, assets/img/audit-example.svg draws the shape of one
       so the slot is sized for it. Document-shaped, capped by height, on
       the site's own card plate so a white screenshot still reads as an
       object rather than as a stain. Swap the src and nothing else moves. */
    section(
'    <div class="split audit-aside" style="align-items:center">\n' +
'      <div>\n' +
      secHead('Not on HubSpot?') +
'      <div class="svc-list svc-list-plain reveal" style="margin-top:clamp(18px,2.2vw,28px)">\n' +
      AUDIT_ELSE.map(function (w) {
        return '        <a class="svc-row" href="' + w.href + '">\n' +
               '          <h3 class="svc-title">' + w.title + '</h3>\n' +
               '          <p class="svc-copy">' + w.copy + '</p>\n' +
               '          <span class="svc-go">' + w.go + ' <span class="arrow">&rarr;</span></span>\n' +
               '        </a>';
      }).join('\n') + '\n' +
'      </div>\n' +
'      </div>\n' +
'      <figure class="audit-shot-frame reveal reveal-right">\n' +
'        <img src="assets/img/audit-example.svg" alt=""\n' +
'             aria-hidden="true" loading="lazy">\n' +
'      </figure>\n' +
'    </div>\n') +

    /* THE FORM, last, because everything above it is the argument for
       filling it in. .to-white because the closing panel bleeds up into
       whatever sits above it.

       The embed is not wrapped in .reveal. That class animates with
       transform and filter, which makes the wrapper a containing block and
       lands HubSpot's own error toasts in the wrong place. The head above
       it carries the reveal, exactly as /contact and /newsletter do.

       v2 EMBED, not the newer per-portal loader the rest of the site uses.
       This is the script James supplied for this form; hbspt.forms.create
       renders where the script tag sits, which is why the div around it
       carries the measure. */
    section(
    secHead('Request an audit', null, 'centred') +
'    <div class="optin-wrap">\n' +
'      <!-- HubSpot form, portal 46722926. THIS ID IS THE AUDIT FORM and is\n' +
'           not the one /contact uses. See the note above this page in\n' +
'           tools/build-pages.js. -->\n' +
'      <script charset="utf-8" type="text/javascript" src="//js.hsforms.net/forms/embed/v2.js"><\/script>\n' +
'      <script>\n' +
'        hbspt.forms.create({\n' +
'          portalId: "46722926",\n' +
'          formId: "579026d7-b138-4813-a166-c3d970e76dae",\n' +
'          region: "na1"\n' +
'        });\n' +
'      <\/script>\n' +
'    </div>\n', 'section to-white svc-book')
};

/* ---------- the six hub pages ----------

   Added 11 September. /hubspot has carried six cards pointing at
   /hubspot/<slug> since it was rebuilt, and not one of the six existed, so
   all six 404ed. These are those pages.

   ONE TEMPLATE, SIX TIMES, and that is deliberate: James asked for a shared
   design. Somebody comparing Sales Hub against Service Hub is then comparing
   the product rather than learning a second layout, which is the same
   argument the case study pages make.

   The shape, top to bottom:
     hero                  back link to /hubspot, the hub name, the call
                           button and an arrow link to /audit
     what it does          six cards, a title and a line each, no heading
     a case study          one client's card, name, lede and a link
     what we do            the svc-row list /hubspot and /pipedrive both use

   CUT ON 16 SEPTEMBER, at James' request: the section heading and
   subheading over the six cards, "Which tier you actually need", "Where we
   usually find it broken", and the chips inside each card, which he called
   repetitive and meaningless. The data went with the markup, so there is no
   `head`, `sub`, `tiers`, `wrong` or `chips` left on a hub to wonder about.
   It is all in git from 255ea39 back if any of it is wanted again.

   The heading carried each page's one warm highlight, so these pages now
   have none. Do not add one back to the case study title without asking.

   `caseStudy` IS A SLUG FROM CASES, and it is James' pick rather than a
   match worked out from the copy: only Ike names a hub outright. As of 16
   September: Sales, Revenue and Service to Ignite Group, Marketing to
   Woodside Homes, Data and Content to Core Income Advisors. Ignite is the
   fallback for a hub with nothing better. A slug that is not in CASES stops
   the build rather than shipping a card to a page that does not exist.

   NO PRICES, same call as /pipedrive, and nothing on these pages carries
   one now that the tier list is gone. Card titles and every line of prose
   are ours. */

var HUB_PAGES = [
  {
    slug: 'sales-hub',
    caseStudy: 'Ignite-Group',
    title: 'HubSpot Sales Hub &mdash; RevHops',
    desc: 'We design, implement and fix HubSpot Sales Hub: pipelines, sequences, quoting, routing and a forecast that holds up in a board meeting.',
    lede: 'Pipelines, sequences, quoting and routing, plus a forecast built on something other than optimism. We design it, build it, or fix the one you inherited.',
    features: [
      { title: 'Prospecting and lead management',
        copy: 'Who to call, why, and what happened last time, on one record rather than in three tabs and somebody’s notebook.' },
      { title: 'Sequences and automation',
        copy: 'Follow-up that runs itself, task queues that set the order of the day, and rules that route a lead before it goes cold.' },
      { title: 'Deal pipelines',
        copy: 'Stages, required fields and scoring. The part that decides whether your pipeline number means anything.' },
      { title: 'Meetings and calling',
        copy: 'Booking links on your real calendar, calls logged against the record, and transcripts you can coach from.' },
      { title: 'Quotes and CPQ',
        copy: 'Priced from your product library rather than from last quarter’s spreadsheet, sent for signature, tracked when opened.' },
      { title: 'Forecasting and reporting',
        copy: 'A forecast off deal data, a funnel that shows where deals die, and dashboards a manager will open on a Monday.' }
    ],
    ways: [
      { title: 'Design the pipeline before anyone builds it', href: '/services/solution-design', go: 'See the work',
        copy: 'Stages, exit criteria, fields and the reports they have to feed, agreed on paper while changing them is still free.' },
      { title: 'Implement Sales Hub properly', href: '/services/crm-implementations', go: 'See the work',
        copy: 'Objects, data, automation and training. The build ends when your team is using it, not when the licence starts.' },
      { title: 'Fix the pipeline you already have', href: '/services/hubspot-support-retainers', go: 'See the work',
        copy: 'Half-built, inherited or five admins deep. We start with the stages and the data, because everything downstream is reading them.' },
      { title: 'Make the forecast defensible', href: '/services/revops-consulting', go: 'See the work',
        copy: 'One definition per stage, one source for the number, and a review where nobody is arguing about whose report is right.' }
    ]
  },

  {
    slug: 'marketing-hub',
    caseStudy: 'Woodside-Homes',
    title: 'HubSpot Marketing Hub &mdash; RevHops',
    desc: 'We build HubSpot Marketing Hub the way it has to work: lifecycle stages, scoring, campaigns and attribution sales will not argue with.',
    lede: 'Lifecycle stages, scoring, campaigns and the attribution that makes any of it defensible. Built so marketing and sales are counting the same people.',
    features: [
      { title: 'Campaigns and email',
        copy: 'Sends, landing pages and assets grouped under one campaign, so the result is measured as a campaign rather than as eleven separate emails.' },
      { title: 'Forms and capture',
        copy: 'Forms on the record from the first submission, with fields filled in progressively rather than asked for twice.' },
      { title: 'Lifecycle and scoring',
        copy: 'The machinery that says when a contact becomes a lead and a lead becomes sales’ problem. Usually the actual project.' },
      { title: 'Social and ads',
        copy: 'Scheduling, audiences synced out to the ad platforms, and spend reported against contacts instead of against impressions.' },
      { title: 'Search and AI answers',
        copy: 'Being found by people typing and by people asking a model. HubSpot reports on the second now as well as the first.' },
      { title: 'Attribution and reporting',
        copy: 'Multi-touch attribution and journey reporting, which only tell the truth if the tracking was right before the campaign ran.' }
    ],
    ways: [
      { title: 'Map the funnel before you automate it', href: '/services/solution-design', go: 'See the work',
        copy: 'Stages, definitions, the handoff to sales and the reports that have to come out of it. One page, agreed, before a workflow exists.' },
      { title: 'Implement Marketing Hub', href: '/services/crm-implementations', go: 'See the work',
        copy: 'Tracking, forms, lists, workflows and the lifecycle model, built once so the reporting is trustworthy from the first campaign.' },
      { title: 'Get the marketing contact bill under control', href: '/services/hubspot-support-retainers', go: 'See the work',
        copy: 'Who is marketable, who should never have been, and rules that keep it that way without anyone remembering to check.' },
      { title: 'Make attribution defensible', href: '/services/revops-consulting', go: 'See the work',
        copy: 'One model, written down, that marketing and finance both signed off on. Boring, and the reason the number stops being argued about.' }
    ]
  },

  {
    slug: 'revenue-hub',
    caseStudy: 'Ignite-Group',
    title: 'HubSpot Revenue Hub &mdash; RevHops',
    desc: 'Quotes, CPQ, invoicing, subscriptions and payments in HubSpot, built so the number in the CRM is the number finance bills.',
    lede: 'Quotes, CPQ, invoicing, subscriptions and payments, built so the number in the CRM is the number finance sees. Quote to cash without the spreadsheet in the middle.',
    features: [
      { title: 'Quotes and CPQ',
        copy: 'Priced off a product library with the discount rules written down, approved by the person meant to approve it, signed in the same place.' },
      { title: 'Invoicing',
        copy: 'Invoices raised from the deal rather than retyped into another system, with the reminders going out without anyone chasing them.' },
      { title: 'Subscriptions and billing',
        copy: 'Recurring billing, upgrades, downgrades and the mid-term change that is where most billing set-ups start to drift.' },
      { title: 'Payments',
        copy: 'Payment links and checkout against the record. HubSpot Payments is US only and Stripe covers the rest, which is a decision worth making early.' },
      { title: 'Revenue reporting',
        copy: 'Recurring revenue, collections and a forecast reading from billing data rather than from a stage somebody forgot to move.' },
      { title: 'The AI layer',
        copy: 'Breeze drafting the quote and chasing the invoice. Useful once the rules underneath are right, and a faster way to be wrong before that.' }
    ],
    ways: [
      { title: 'Map quote to cash end to end', href: '/services/lead-to-cash-process-mapping', go: 'See the work',
        copy: 'Every step from a price on a quote to money in the bank, with the owner and the system named at each one. Most of the savings are found here.' },
      { title: 'Implement Revenue Hub', href: '/services/crm-implementations', go: 'See the work',
        copy: 'Products, quotes, approvals, billing and payments, wired to the accounting system you already run rather than replacing it.' },
      { title: 'Design the quote and approval flow', href: '/services/solution-design', go: 'See the work',
        copy: 'What a rep can discount without asking, what needs a signature, and what the system should refuse outright.' },
      { title: 'Reconcile CRM revenue with finance', href: '/services/revops-consulting', go: 'See the work',
        copy: 'One definition of booked, billed and collected, so the CRM number and the ledger stop being two different conversations.' }
    ]
  },

  {
    slug: 'service-hub',
    caseStudy: 'Ignite-Group',
    title: 'HubSpot Service Hub &mdash; RevHops',
    desc: 'HubSpot Service Hub built properly: help desk, SLAs, routing, knowledge base and the sales handoff behind most service problems.',
    lede: 'Tickets, SLAs, routing and self-service, on the same record as the deal that created them. Including the handoff from sales, which is usually the real problem.',
    features: [
      { title: 'Help desk',
        copy: 'One workspace with every channel in it, and a ticket that exists from the first message rather than from when somebody noticed.' },
      { title: 'SLAs and routing',
        copy: 'Response and resolution targets the system enforces, and assignment rules that do not depend on who is watching the inbox.' },
      { title: 'Self-service',
        copy: 'A knowledge base and a portal, so the answerable questions get answered without a person and the rest reach one faster.' },
      { title: 'AI on the front line',
        copy: 'Breeze answering from your own content across email and chat. As good as the knowledge base behind it and no better.' },
      { title: 'Retention and feedback',
        copy: 'Surveys, the customer success workspace, and account health where the person who owns the renewal will actually see it.' },
      { title: 'Service analytics',
        copy: 'Volume, time to first response, reopens and the recurring cause behind them, which is the report that changes anything.' }
    ],
    ways: [
      { title: 'Fix the sales to service handoff', href: '/services/lead-to-cash-process-mapping', go: 'See the work',
        copy: 'What has to be true before a deal can close, who owns the account afterwards, and what gets written down instead of said on a call.' },
      { title: 'Implement Service Hub', href: '/services/crm-implementations', go: 'See the work',
        copy: 'Channels, pipelines, SLAs, routing and the knowledge base, set up so the first week of tickets is already measured properly.' },
      { title: 'Design the ticket model and the SLAs', href: '/services/solution-design', go: 'See the work',
        copy: 'Categories that match how you actually fix things, priorities that mean something, and targets your team can hit.' },
      { title: 'Keep it running', href: '/services/hubspot-support-retainers', go: 'See the work',
        copy: 'A standing few hours a month for the routing change, the new survey and the report somebody asked for on a Tuesday.' }
    ]
  },

  {
    slug: 'data-hub',
    caseStudy: 'Core-Income-Advisors',
    title: 'HubSpot Data Hub &mdash; RevHops',
    desc: 'HubSpot Data Hub done properly: data sync, data quality, programmable automation and the reporting layer that depends on both.',
    lede: 'Syncs, data quality, custom code and the reporting layer resting on them. The unglamorous half of HubSpot, and where most portals quietly break.',
    features: [
      { title: 'Data sync',
        copy: 'Two-way sync to the rest of the stack out of the box, with the field mapping visible rather than buried in somebody’s script.' },
      { title: 'Data quality',
        copy: 'Formatting, duplicates, and the alert that tells you a property stopped being filled in three weeks ago.' },
      { title: 'Programmable automation',
        copy: 'Custom code inside a workflow and webhooks out of it, for the logic no native action covers. Used sparingly, on purpose.' },
      { title: 'Datasets and Data Studio',
        copy: 'A curated layer between the raw records and the dashboard, so a report is built once rather than rebuilt by each analyst.' },
      { title: 'Warehouse and cloud storage',
        copy: 'Bidirectional sync with the cloud data platform finance and product already use, which ends the export-and-email habit.' },
      { title: 'The reporting foundation',
        copy: 'Dashboards people trust because they read from one definition. That trust is a data project rather than a charting one.' }
    ],
    ways: [
      { title: 'Decide the system of record', href: '/services/solution-design', go: 'See the work',
        copy: 'Which system owns which object, what syncs which way, and what happens when the two disagree. An hour of this saves a quarter later.' },
      { title: 'Clean the data before you migrate it', href: '/services/crm-implementations', go: 'See the work',
        copy: 'Dedupe, normalise and map, then move. Migrating first and cleaning afterwards is the most expensive order to do it in.' },
      { title: 'Wire the stack together', href: '/services/lead-to-cash-process-mapping', go: 'See the work',
        copy: 'Native sync where it exists, code where it does not, and a written map of both so the next person is not guessing.' },
      { title: 'Keep the data clean', href: '/services/hubspot-support-retainers', go: 'See the work',
        copy: 'Quality rules, monitoring, and somebody whose job it is to notice when a property stops being filled in.' }
    ]
  },

  {
    slug: 'content-hub',
    caseStudy: 'Core-Income-Advisors',
    title: 'HubSpot Content Hub &mdash; RevHops',
    desc: 'HubSpot Content Hub weighed up honestly: CMS, blog, remix and AEO, plus when a separate stack is the cheaper answer.',
    lede: 'Pages, blog and forms on the same record as everything else. Also the one hub where a separate stack is sometimes the cheaper answer, and we will say so.',
    features: [
      { title: 'CMS and pages',
        copy: 'Landing pages and site pages a marketer can edit without raising a ticket, on templates a developer still controls.' },
      { title: 'Blog',
        copy: 'Publishing, tags and authors, with the SEO suggestions in the editor rather than in a separate tool nobody opens.' },
      { title: 'Remix and video',
        copy: 'One piece of work turned into the social, email and clip versions of itself, which is where the time actually goes.' },
      { title: 'Brand voice and approvals',
        copy: 'A defined voice the AI tools write to, and an approval step so what ships has been read by a person first.' },
      { title: 'Search and AI answers',
        copy: 'Optimising for the search result and for the answer a model gives when nobody clicks through at all.' },
      { title: 'Personalisation and memberships',
        copy: 'Content that changes by list or lifecycle stage, and gated areas behind a login on the same contact record.' }
    ],
    ways: [
      { title: 'Work out whether Content Hub is the right home', href: '/call', go: 'Talk it through',
        copy: 'Before the migration is scoped. Sometimes the answer is a separate front end with HubSpot forms on it, and that is a shorter conversation than it sounds.' },
      { title: 'Migrate the site onto Content Hub', href: '/services/crm-implementations', go: 'See the work',
        copy: 'Templates, content, forms, tracking and every redirect. The redirects are the part that gets skipped and the part that costs money.' },
      { title: 'Design the templates and modules', href: '/services/solution-design', go: 'See the work',
        copy: 'What a marketer can change, what they cannot, and a module library that keeps the site looking like itself a year in.' },
      { title: 'Keep the site and the blog moving', href: '/services/hubspot-support-retainers', go: 'See the work',
        copy: 'The new template, the landing page for Thursday, and the technical SEO nobody has time to look at.' }
    ]
  }
];

/* One client's story under the six cards.

   THE CARD IS THE POSTER OFF /case-studies WITH NOTHING ON IT: the picture
   and the corner radius, and no name, services or arrow, because the name
   is set large beside it and saying it twice in six inches reads as a
   mistake. .hub-case drops the scrim too, since the scrim only exists to
   carry type the card no longer has.

   The card is a second route to the same page as the text link, so it is
   taken out of the tab order and hidden from screen readers. One story, one
   link to it, announced once. */
function hubCase(slug) {
  var c = CASES.filter(function (x) { return x.slug === slug; })[0];
  if (!c) throw new Error('hub caseStudy "' + slug + '" is not a slug in CASES');
  var href = '/case-studies/' + c.slug;
  return '    <div class="hub-case">\n' +
'      <a class="case-card hub-case-card reveal" href="' + href + '" tabindex="-1" aria-hidden="true">\n' +
'        <img src="' + up(1) + (c.img || 'assets/img/case-study-placeholder.svg') + '" alt="" loading="lazy">\n' +
'      </a>\n' +
'      <div class="hub-case-copy reveal">\n' +
'        <h2 class="h2">' + c.name + '</h2>\n' +
'        <p class="lede">' + c.copy.lede + '</p>\n' +
'        <a class="text-link" href="' + href + '">Read the story <span class="arrow" aria-hidden="true">&rarr;</span></a>\n' +
'      </div>\n' +
'    </div>\n';
}

/* One hub page. Everything about it comes out of the object above, so a
   seventh hub is one entry in HUB_PAGES and nothing else.

   The hub NAME is the h1, not a slogan: you arrive here from a grid of six
   names and from a nav item called HubSpot, and anything else at the top
   makes a visitor check they landed on the right page. Same reasoning as the
   service pages, which is also where the back-link eyebrow comes from.

   No media column. There is no per-hub artwork, the Platinum badge belongs
   to /hubspot, and a placeholder in that slot on six pages would read as six
   missing images. */
function hubPage(h) {
  var name = h.slug.split('-').map(function (w) {
    return w === 'hub' ? 'Hub' : w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');

  return {
    file: 'hubspot/' + h.slug + '.html',
    depth: 1,
    navCurrent: '/hubspot',
    title: h.title,
    description: h.desc,
    h1: name,
    lede: h.lede,
    heroClass: 'page-hero-nomedia',
    eyebrow: ['All hubs', '/hubspot'],

    /* The call first and the audit second, which is the site's usual order.
       /hubspot inverts it because the audit is that page's own offer.

       THE AUDIT IS AN ARROW LINK, not a second button, as of 16 September,
       and it goes to /audit rather than /contact: /audit is where every
       request for an audit on the site lands, and these six were the last
       ones still pointing at the general form. */
    headButtons: '          <a class="btn btn-primary" href="/call">Schedule a discovery call</a>\n' +
                 '          <a class="text-link" href="/audit">Request a portal audit ' +
                 '<span class="arrow" aria-hidden="true">&rarr;</span></a>',

    body:

      /* WHAT IT DOES. Six cards, unlinked: each one is a capability rather
         than a page in waiting, and an arrow that goes nowhere is worse than
         no arrow at all. No heading over them since 16 September: the h1 is
         the hub name, and the cards are plainly what it does. */
      section(pcards(h.features, 'pcards-3')) +

      /* THE CASE STUDY. See hubCase() below. */
      section(hubCase(h.caseStudy)) +

      /* THE ASK. The same svc-row list /hubspot and /pipedrive carry, so all
         three pages hand off to the same five service pages. */
      section(
        secHead('What we do in ' + name) +
'    <div class="svc-list svc-list-plain reveal" style="margin-top:clamp(18px,2.2vw,28px)">\n' +
        h.ways.map(function (w) {
          return '      <a class="svc-row" href="' + w.href + '">\n' +
                 '        <h3 class="svc-title">' + w.title + '</h3>\n' +
                 '        <p class="svc-copy">' + w.copy + '</p>\n' +
                 '        <span class="svc-go">' + w.go + ' <span class="arrow">&rarr;</span></span>\n' +
                 '      </a>';
        }).join('\n') + '\n' +
'    </div>\n', 'section to-white')

      /* THE OTHER FIVE CAME OUT on 13 September. It was five cards at the
         foot of every hub page pointing at the other five hub pages, which
         on a six-page set is thirty links whose whole job is to send you
         somewhere else at the moment you have finished reading. The back
         link at the top says "All hubs" and goes to the grid of all six,
         which is the one place that list belongs.

         .to-white moved up to the section above it, because the closing
         panel bleeds into whatever is last and that is now the ask. */
  };
}

/* ---------- write everything ---------- */

var PAGES = [servicesIndex]
  .concat(SERVICES.map(servicePage))
  .concat([caseIndex])
  .concat(CASES.map(casePage))
  .concat([resourcesIndex])
  .concat(GATED.map(resourcePage))
  .concat([pricing, hubspot, pipedrive, about, contact, audit, newsletter, terms, privacy, callPage, clientCallPage, puzzle, hop])
  .concat(HUB_PAGES.map(hubPage));

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
