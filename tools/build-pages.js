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

  /* An eyebrow that is a link back up a level, sitting above the H1. Only
     the service pages use it so far: they are the one place on the site
     that is a leaf of a list, and the back link is how you get to the
     siblings without going through the nav. */
  var eyebrow = p.eyebrow
    ? '        <a class="hero-back" href="' + p.eyebrow[1] + '">' +
      '<span class="arrow" aria-hidden="true">&larr;</span> ' + p.eyebrow[0] + '</a>\n'
    : '';

  var media = m
    ? '      <div class="page-hero-media' + (m.mark ? ' is-mark' : '') + '">\n' +
      '        <img src="' + a + m.src + '" alt="' + m.alt + '"' + (m.alt ? '' : ' aria-hidden="true"') + '>\n' +
      '      </div>\n'
    : '';

  return '\n<!-- ===================== HERO =====================\n' +
'     Type left, artwork bleeding off the right edge. .page-head-end is the\n' +
'     zero-height sentinel the nav watches to decide when to collapse. -->\n' +
'<section class="page-hero' + (p.heroClass ? ' ' + p.heroClass : (p.media ? '' : ' page-hero-plain')) + '">\n' +
'  <div class="shell">\n' +
'    <div class="page-hero-inner">\n' +
'      <div class="page-hero-text">\n' +
eyebrow +
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
    kind: 'Project',
    results: '6–8 weeks',
    quad: [
      ['[Placeholder] A HubSpot portal built or migrated end to end, by the same people who scoped it, and documented well enough that your team can run it without calling us.',
       '[Placeholder] Second short paragraph.'],
      ['[Placeholder] The build that only one person understands, and that person has left. Two pipelines called Renewals and nobody sure which is live.',
       '[Placeholder] Second short paragraph.'],
      ['[Placeholder] Foundations first, then build and migrate in weekly working sessions with your admin in the room, then parallel running until the numbers agree.',
       '[Placeholder] Handover is recorded training, written documentation and two weeks of hypercare.'],
      ['[Placeholder] Teams standing up a new portal, or moving onto HubSpot with a decade of history that has to come with them.',
       '[Placeholder] Second short paragraph.']
    ],
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
    kind: 'Retainer',
    results: 'First month',
    quad: [
      ['[Placeholder] A named HubSpot admin on call. Roadmap, maintenance, training, and someone who answers when a workflow breaks on a Friday afternoon.',
       '[Placeholder] Second short paragraph.'],
      ['[Placeholder] A portal that rots quietly because the person who half-knows it has a day job, and a full-time admin costs forty hours to get eight of real work.',
       '[Placeholder] Second short paragraph.'],
      ['[Placeholder] One standing call a month, a roadmap review each quarter, and a shared channel rather than a ticket form for anything that breaks.',
       '[Placeholder] Hours roll over within the quarter.'],
      ['[Placeholder] Teams live on HubSpot who need an admin but not a full-time one.',
       '[Placeholder] Second short paragraph.']
    ],
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
    kind: 'Retainer',
    results: '4–6 weeks',
    quad: [
      ['[Placeholder] Fractional revenue operations leadership. What the system should be doing, what it is doing instead, and which of those gaps is costing you money.',
       '[Placeholder] Advice, with no build attached.'],
      ['[Placeholder] Forecast accuracy nobody trusts, stages that mean different things to different reps, and a sales team measured on something it cannot control.',
       '[Placeholder] Second short paragraph.'],
      ['[Placeholder] A first month spent finding where revenue actually stalls, then a fortnightly standing session with whoever owns revenue, written up rather than left in a recording.',
       '[Placeholder] Each quarter closes with an order of operations rather than a wish list.'],
      ['[Placeholder] Founders and revenue leaders who need someone to think it through with before they commit to a build.',
       '[Placeholder] Second short paragraph.']
    ],
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
    kind: 'Project',
    results: 'Immediate',
    quad: [
      ['[Placeholder] Every step from first touch to paid invoice, mapped end to end across every team and every system, on one page.',
       '[Placeholder] Usually the first time anyone has seen the whole thing at once.'],
      ['[Placeholder] Deals that stall at the seams between teams, shadow spreadsheets holding the process together, and manual steps nobody has counted.',
       '[Placeholder] Second short paragraph.'],
      ['[Placeholder] We interview each team separately, then follow real records through the real systems, because the process people describe and the process that runs are rarely the same thing.',
       '[Placeholder] Then we draw the whole thing, handoffs and owners marked.'],
      ['[Placeholder] Teams who know something is slow but cannot say where, and teams about to buy software to fix a process they have never drawn.',
       '[Placeholder] Second short paragraph.']
    ],
    caseIdx: 4
  }
];

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
  ['hubspot',    'HubSpot'],
  ['pipedrive',  'Pipedrive'],
  ['salesforce', 'Salesforce']
];

/* slug, stage name, headcount band. Both the name and the band come from
   STAGES in assets/js/maturity-slider.js — if that array changes, this one
   changes with it or the two halves of the site disagree about what
   "Growth" means. The name is unused on this page now that Growth stage has
   gone; it stays because the band is meaningless without it. */
var STAGES = [
  ['startup',    'Startup',    '1&ndash;10'],
  ['scaleup',    'Scaleup',    '10&ndash;50'],
  ['growth',     'Growth',     '50&ndash;200'],
  ['maturity',   'Maturity',   '200&ndash;1,000'],
  ['enterprise', 'Enterprise', '1,000+']
];

/* `name` is what the page is called and what its slug is built from, so the
   URL and the H1 cannot drift apart: /case-studies/case-study-1 is titled
   "Case Study 1". When these become real clients, change the name and the
   slug follows. */
var CASES = [
  { slug: 'case-study-1', name: 'Case Study 1', figs: [['00', '%'], ['00', 'x']],
    svc: ['solution-design', 'crm-implementations'],
    crm: 'salesforce', industry: 'b2b-saas', stage: 'growth' },

  { slug: 'case-study-2', name: 'Case Study 2', figs: [['00', '%'], ['00', 'h']],
    svc: ['crm-implementations', 'lead-to-cash-process-mapping'],
    crm: 'hubspot', industry: 'professional-services', stage: 'scaleup' },

  { slug: 'case-study-3', name: 'Case Study 3', figs: [['00', '%'], ['00', 'k']],
    svc: ['hubspot-support-retainers', 'revops-consulting'],
    crm: 'hubspot', industry: 'financial-services', stage: 'maturity' },

  { slug: 'case-study-4', name: 'Case Study 4', figs: [['00', '%'], ['00', 'd']],
    svc: ['solution-design', 'lead-to-cash-process-mapping'],
    crm: 'hubspot', industry: 'ecommerce', stage: 'startup' },

  { slug: 'case-study-5', name: 'Case Study 5', figs: [['00', 'k'], ['00', 'x']],
    svc: ['revops-consulting', 'crm-implementations'],
    crm: 'pipedrive', industry: 'b2b-saas', stage: 'enterprise' }
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
    (c.svc      ? '\n           data-services="' + c.svc.join(' ') + '"'   : '') +
    (c.crm      ? '\n           data-crm="' + c.crm + '"'                  : '') +
    (c.industry ? '\n           data-industry="' + c.industry + '"'        : '') +
    (c.stage    ? '\n           data-stage="' + c.stage + '"'              : '');
  return '<a class="case-card' + (cls ? ' ' + cls : '') + '" href="' + '/case-studies/' + c.slug + '"' + svc + '>\n' +
    '          <img src="' + up(depth) + 'assets/img/case-study-placeholder.svg" alt="" aria-hidden="true" loading="lazy">\n' +
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

   Three things and nothing else: a header carrying the service name and the
   three facts a buyer asks first, a quadrant answering the four questions
   they ask next, and that service's own booking widget.

   It replaced seven sections that were five variations on the same card
   grid. A leaf page does not need to re-argue the pitch — it needs to say
   what the thing is and let you book a call about it.

   The quadrant is four cells split by two hairlines rather than four
   floating cards: it reads as one object with four parts, which is what it
   is, and it does not repeat the .pcard grids used on the pages above.

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

  /* the quadrant, then one text link out to pricing */
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
'    <div class="quad-cta reveal">\n' +
'      <a class="text-link" href="/pricing">View pricing details <span class="arrow">&rarr;</span></a>\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n';

  /* the service's own scheduler */
  body += '\n<section class="section-tight svc-book">\n' +
'  <div class="shell">\n' +
    secHead('Want to learn more?', null, 'centred') +
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
    lede: s.lede,

    /* same header spacing as /services — no artwork, full-width type — with
       a bottom beat added, because this one carries a meta row underneath */
    heroClass: 'page-hero-nomedia page-hero-svc',
    eyebrow: ['All services', '/services'],
    meta: [
      ['Timeline', s.time],
      ['From', s.price[0].replace(/^(Starting at |From )/, '')],
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
    ['Service(s) used', c.svc.map(serviceName).join(', ')],
    ['Tools used',      labelFor(CRMS, c.crm, 1)],
    ['Industry',        labelFor(INDUSTRIES, c.industry, 1)],
    ['Team size',       labelFor(STAGES, c.stage, 2) + ' people']
  ];

  var body = '';

  body += '\n<!-- ===================== HEADER PLATE =====================\n' +
'     The plate off /case-studies, left-aligned and carrying a description.\n' +
'     .page-head-end is the sentinel the nav watches to decide when to\n' +
'     collapse, and it lives here because this page has no .page-hero. -->\n' +
'<section class="cs-head">\n' +
'  <div class="shell">\n' +
'    <div class="cs-head-panel is-detail">\n' +
'      <div class="cs-head-copy">\n' +
'        <h1 class="h1">' + c.name + '</h1>\n' +
'        <p class="cs-head-lede">[One or two sentences on who they are, what was\n' +
'          broken, and what it is now. The whole story in a paragraph, so the rest of\n' +
'          the page is detail rather than suspense.]</p>\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'  <div class="page-head-end" data-nav-clear></div>\n' +
'</section>\n';

  body += '\n<!-- ===================== THE STORY =====================\n' +
'     20 / 80, the same split as the shelf. Meta down the left, three fixed\n' +
'     sections down the right. -->\n' +
'<section class="section cs-body-section to-white">\n' +
'  <div class="shell">\n' +
'    <div class="cs-layout">\n' +
'      <aside class="cs-side" aria-label="Case study details">\n' +
'        <div class="cs-logo">[Client logo]</div>\n' +
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

  csBlock('The problem', '[The heading for this case’s problem]',
'        <p class="small">[What the business does, how many people sell for it, and what the\n' +
'          revenue system looked like on the day they called. Name the thing that finally\n' +
'          made them pick up the phone.]</p>\n' +
'        <p class="small">[The symptom everyone could see, and the cause nobody had gone\n' +
'          looking for. What it was costing them while it went unfixed.]</p>\n') +

  csBlock('The solution', '[The heading for what we built]',
'        <p class="small">[What was scoped, what went first and why. The decisions that were\n' +
'          argued over, including the ones that went against us.]</p>\n' +
'        <p class="small">[What it replaced, what stopped being manual, and the part that was\n' +
'          harder than expected.]</p>\n' +
'        <div class="cs-assets">\n' +
'          <div class="cs-asset is-wide">[Asset 1 &mdash; lead image, screen recording or diagram]</div>\n' +
'          <div class="cs-asset">[Asset 2]</div>\n' +
'          <div class="cs-asset">[Asset 3]</div>\n' +
'        </div>\n') +

  csBlock('The results', '[The heading for what changed]',
'        <p class="small">[What is different now, in the terms the client would use rather\n' +
'          than the ones we would. What the team can now do for itself, what stopped being\n' +
'          anyone’s job, and anything that did not work.]</p>\n' +
'        <div class="cs-stats">\n' +
      /* one plain, one up, one down — the three shapes a figure can take, so
         the template shows all of them rather than leaving the arrow to be
         discovered in the CSS */
      [[c.figs[0][1], ''], [c.figs[1][1], 'up'], ['%', 'down']].map(function (f) {
        return '          <div class="cs-stat">\n' +
               '            <b>' + (f[1] ? csArrow(f[1]) : '') + 'XX' + f[0] + '</b>\n' +
               '            <span>[What this figure measures]</span>\n' +
               '          </div>';
      }).join('\n') + '\n' +
'        </div>\n' +
'        <figure class="cs-testi">\n' +
'          <div class="cs-testi-photo">[Photo]</div>\n' +
'          <blockquote class="cs-testi-quote quote">\n' +
'            <p>[One quotation from the person who signed it off. Two or three sentences,\n' +
'              in their words, not ours.]</p>\n' +
'            <footer class="quote-by">\n' +
'              <cite>[Name] <span class="sep">|</span> [Title], [Company]</cite>\n' +
'            </footer>\n' +
'          </blockquote>\n' +
'        </figure>\n') +

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
    description: 'How RevHops rebuilt the revenue system at [client name], and what changed as a result.',
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
  h1: 'Services',
  lede: 'RevOps services that scale with you, no matter what stage you\'re at.',

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
'    </div>\n' +
'\n' +
'    <div class="svc-cta reveal">\n' +
'      <p>Not sure what your team needs?</p>\n' +
'      <a class="btn btn-primary" href="/call">Schedule a call</a>\n' +
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
'    </div>\n', 'section case-section to-white')
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
  mainClass: 'cs-index',
  bare: true,
  title: 'Case studies — RevHops',
  description: 'Revenue operations work we have done, filterable by service, tools, industry, team size and growth stage.',
  body:
'\n<!-- ===================== HEADER PLATE =====================\n' +
'     The start panel artwork on a 12px plate, 100px below the bar. Nothing\n' +
'     in it but the title: the filter under it is the page. .page-head-end\n' +
'     is the zero-height sentinel the nav watches to decide when to\n' +
'     collapse, and it lives here because there is no .page-hero. -->\n' +
'<section class="cs-head">\n' +
'  <div class="shell">\n' +
'    <div class="cs-head-panel">\n' +
'      <h1 class="h1">Case Studies</h1>\n' +
'    </div>\n' +
'  </div>\n' +
'  <div class="page-head-end" data-nav-clear></div>\n' +
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
'        <div class="cs-grid" data-cs-grid>\n' +
        CASES.map(function (c) { return '        ' + caseCard(c, 1, 'reveal'); }).join('\n') + '\n' +
'        </div>\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n'
};

var pricing = {
  file: 'pricing.html',
  depth: 0,
  navCurrent: '/pricing',
  title: 'Pricing — RevHops',
  description: 'What RevOps work with RevHops costs: project pricing for design, mapping and implementation, monthly pricing for retainers and consulting.',
  h1: 'What it costs before we talk',
  lede: 'Published, because chasing an agency for a number is a waste of everyone\'s afternoon. These are starting points, and we will tell you on the first call if you are about to overspend.',
  media: { src: 'assets/img/case-study-placeholder.svg', alt: '' },
  meta: [['Projects from', '$4,500'], ['Monthly from', '$2,500'], ['Discovery call', 'Free']],
  body:
    section(
      secHead('Project work with <span class="hl">a fixed scope and a fixed price</span>',
              'Quoted once the scope is written down. If the scope moves we requote before the work starts, not after.') +
'    <div class="price-teaser reveal" style="margin-top:clamp(22px,2.6vw,34px)">\n' +
      [SERVICES[0], SERVICES[4], SERVICES[1]].map(function (s) {
        return '      <a class="price-teaser-cell" href="/services/' + s.slug + '" style="text-decoration:none">\n' +
               '        <span class="price-teaser-label">' + s.name + '</span>\n' +
               '        <span class="price-teaser-fig">' + s.price[0] + '<small>' + s.dur[0] + '</small></span>\n' +
               '        <p class="price-teaser-note">' + s.row + '</p>\n' +
               '      </a>';
      }).join('\n') + '\n' +
'    </div>\n') +
    section(
      secHead('Monthly work with no lock-in',
              'Thirty days notice, both ways. Nobody has ever done better work because the client was contractually stuck with them.') +
'    <div class="price-teaser reveal" style="margin-top:clamp(22px,2.6vw,34px)">\n' +
      [SERVICES[2], SERVICES[3]].map(function (s) {
        return '      <a class="price-teaser-cell" href="/services/' + s.slug + '" style="text-decoration:none">\n' +
               '        <span class="price-teaser-label">' + s.name + '</span>\n' +
               '        <span class="price-teaser-fig">' + s.price[0] + '<small>' + s.price[1] + '</small></span>\n' +
               '        <p class="price-teaser-note">' + s.row + '</p>\n' +
               '      </a>';
      }).join('\n') + '\n' +
'      <div class="price-teaser-cell">\n' +
'        <span class="price-teaser-label">Something else</span>\n' +
'        <span class="price-teaser-fig">Ask<small>We will say if it is not us</small></span>\n' +
'        <p class="price-teaser-note">Audits, one-off training, a second opinion on someone else\'s build. Smaller pieces get quoted on the call.</p>\n' +
'      </div>\n' +
'    </div>\n', 'section-tight') +
    section(
'    <div class="split" style="align-items:start">\n' +
'      <div class="reveal reveal-left">\n' +
'        <p class="statement">Almost never the software.</p>\n' +
'        <p class="statement-note">What moves the price is how many teams have to agree, how much\n' +
'          of the data has to be cleaned before it can move, and how many systems are already\n' +
'          holding a version of the truth.</p>\n' +
'      </div>\n' +
'      <div class="cols-2 reveal reveal-right">\n' +
'        <p>A twelve-person company with one pipeline and a clean import sits at the bottom of\n' +
'          every range on this page.</p>\n' +
'        <p>Four business units, two CRMs and a decade of history does not, and no amount of\n' +
'          scoping will make it. We would rather show you why than average it away.</p>\n' +
'      </div>\n' +
'    </div>\n', 'section-tight') +
    section(
      secHead('Included whatever you spend') +
'    <div style="margin-top:clamp(22px,2.6vw,34px)">\n' +
      pcards([
        { title: 'Documentation', copy: 'Part of the work, not a line item that gets cut when the budget tightens.', chips: ['Always'] },
        { title: 'The same people', copy: 'First call to handover. No introduction to a delivery team you have never met.', chips: ['Always'] },
        { title: 'A written scope', copy: 'Approved by you before anything is built, and requoted before it changes.', chips: ['Always'] },
        { title: 'The free first call', copy: 'Where we work out whether this is a fit. No charge and no obligation either way.', chips: ['Free'] }
      ]) +
'    </div>\n', 'section to-white')
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

var about = {
  file: 'about-us.html',
  depth: 0,
  navCurrent: '/about-us',
  title: 'About RevHops',
  description: 'RevHops is a small revenue operations consultancy in Phoenix, Arizona. Who we are, how we work, and what we will not do.',
  h1: 'The team you meet is the team you get',
  lede: 'A revenue operations consultancy in Phoenix, Arizona. Small on purpose, deep in one thing, and straight with you about the parts that will be difficult.',
  media: { src: 'assets/img/james-portrait.webp', alt: 'James Ricks, founder of RevHops' },
  meta: [['Based in', 'Phoenix, AZ'], ['Founded by', 'James Ricks'], ['Clients at once', 'Deliberately few']],
  body:
    section(
'    <div class="split" style="align-items:start">\n' +
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
    section(
      secHead('What we <span class="hl">believe</span>') +
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
    logoBand(0) +
    section(
      secHead('How we work') +
'    <div style="margin-top:clamp(22px,2.6vw,34px)">\n' +
      pcards([
        { title: 'You talk to the doers', copy: 'The person on the first call is the person doing the build. Start to finish, no exceptions.',
          chips: ['No account managers'] },
        { title: 'RevOps only', copy: 'Not a generalist shop with a RevOps page. It is the whole business, which is why we are any good at it.',
          chips: ['One discipline'] },
        { title: 'HubSpot Platinum', copy: 'Certified, current, and with a line into HubSpot when the problem is on their side.',
          chips: ['Platinum partner'] },
        { title: 'Wrong for some jobs', copy: 'If you need five bodies on site next week, we are not it, and we will say so on the first call.',
          chips: ['We will tell you'] }
      ]) +
'    </div>\n' +
'    <p class="reveal" style="margin-top:clamp(26px,3vw,40px)">\n' +
'      <a class="text-link" href="/services">What we actually do <span class="arrow">&rarr;</span></a>\n' +
'    </p>\n', 'section to-white')
};

var contact = {
  file: 'contact.html',
  depth: 0,
  navCurrent: '/contact',
  title: 'Contact RevHops',
  description: 'Get in touch with RevHops. Tell us what is broken, or book a discovery call directly.',
  h1: 'Tell us what is broken',
  lede: 'The more specific you are, the more useful the first reply will be. We answer everything within a working day, usually with a question rather than a pitch.',
  media: { src: 'assets/img/case-study-placeholder.svg', alt: '' },
  meta: [['Reply within', 'One working day'], ['Email', 'team@revhops.com'], ['Based in', 'Phoenix, AZ']],
  body:
    section(
'    <div class="split" style="align-items:start">\n' +
'\n' +
'      <!-- Deliberately not inside a card. The form is the page; a frame\n' +
'           round the only thing on it reads as a widget dropped into a\n' +
'           layout rather than as the layout. -->\n' +
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
'          <textarea id="c-msg" name="message" rows="6"\n' +
'                    placeholder="The symptom is enough. You do not have to have diagnosed it."></textarea>\n' +
'        </div>\n' +
'        <div class="form-foot">\n' +
'          <button class="btn btn-primary" type="submit">Send it over</button>\n' +
'          <p class="form-note">No newsletter, no sequence. One reply from a person.</p>\n' +
'        </div>\n' +
'      </form>\n' +
'\n' +
'      <div class="stack gap-20 reveal reveal-right">\n' +
'        <h2 class="h2">Or <span class="hl">skip the form</span></h2>\n' +
'        <p class="small">Email lands in the same place and gets the same answer. If you would\n' +
'          rather just talk, the calendar is open and there is nothing to fill in first.</p>\n' +
'        <a class="text-link" href="mailto:team@revhops.com">team@revhops.com <span class="arrow">&rarr;</span></a>\n' +
'        <a class="text-link" href="/call">Book a discovery call <span class="arrow">&rarr;</span></a>\n' +
'        <p class="small muted">We are in Phoenix, Arizona, and work with teams across the US and\n' +
'          Europe. Most of the work happens over video either way.</p>\n' +
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
   The sentinel rides with it, as it does on /case-studies. */
'\n<section class="cs-head">\n' +
'  <div class="shell">\n' +
'    <div class="cs-head-panel">\n' +
'      <h1 class="h1">' + o.heading + '</h1>\n' +
'    </div>\n' +
'  </div>\n' +
'  <div class="page-head-end" data-nav-clear></div>\n' +
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
'\n<div class="page-head-end" data-nav-clear></div>\n' +
'\n<section class="section call-split">\n' +
'  <div class="shell">\n' +
'    <div class="call-layout">\n' +
'\n' +
'      <!-- LEFT, 30% — the gradient plate off /case-studies, portrait.\n' +
'           Its scrim is legibility, not decoration; see .call-panel. -->\n' +
'      <div class="call-panel reveal">\n' +
'        <h1 class="h1">Schedule a Call</h1>\n' +
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

  /* The marquee off the homepage and /about-us, unchanged. It sits directly
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
   Placeholder wording. No design work here on purpose: these two pages are
   read once, by someone checking a specific clause, and the only thing that
   helps them is a narrow measure and clear headings. */

function legalPage(o) {
  return {
    file: o.file,
    depth: 0,
    title: o.title,
    description: o.description,
    h1: o.h1,
    lede: o.lede,
    body: section(
'    <div class="prose reveal">\n' +
'      <p class="prose-meta">Last updated [date]. This is placeholder wording and has not been\n' +
'        reviewed by a lawyer. Replace it before launch.</p>\n' +
      o.sections.map(function (s) {
        return '      <h2>' + s[0] + '</h2>\n' +
               s.slice(1).map(function (p) {
                 return Array.isArray(p)
                   ? '      <ul>\n' + p.map(function (li) { return '        <li>' + li + '</li>'; }).join('\n') + '\n      </ul>'
                   : '      <p>' + p + '</p>';
               }).join('\n');
      }).join('\n') + '\n' +
'    </div>\n', 'section to-white')
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
