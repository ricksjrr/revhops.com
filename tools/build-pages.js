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
var STAMP = '202609091500';   /* keep in step with index.html and README */

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

/* The global page header. One layout, no variants: title and one paragraph
   across two thirds, the last third empty or holding a mark. The circle is
   the only background shape on any page below the homepage — everything
   under the header is plain paper, on purpose. */
function pageHead(p) {
  var media = p.headMedia
    ? '      <div class="page-head-media">\n' +
      '        <img src="' + up(p.depth) + p.headMedia.src + '" alt="' + p.headMedia.alt + '">\n' +
      '      </div>\n'
    : '';
  var buttons = p.headButtons
    ? '        <div class="btn-row">\n' + p.headButtons + '\n        </div>\n'
    : '';

  return '\n<!-- ===================== HEADER =====================\n' +
'     .page-head, the standard band. --page-head-h keeps every page the same\n' +
'     height, and .page-head-end is the sentinel the nav watches. -->\n' +
'<section class="page-head">\n' +
'  <div class="disc" data-parallax="0.13"></div>\n' +
'  <div class="shell">\n' +
'    <div class="page-head-inner">\n' +
'      <div class="page-head-text">\n' +
'        <h1 class="h1">' + p.h1 + '</h1>\n' +
'        <p class="lede">' + p.lede + '</p>\n' +
buttons +
'      </div>\n' +
media +
'    </div>\n' +
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

function render(p) {
  return head(p) +
         nav(p) +
         '\n<main>\n' +
         (p.bare ? '' : pageHead(p)) +
         p.body +
         (p.noClose ? '' : closePanel()) +
         '\n</main>\n' +
         footer(p) +
         tail(p);
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
  return '    <div class="sec-head reveal' + (cls ? ' ' + cls : '') + '">\n' +
         '      <h2 class="h2">' + title + '</h2>\n' +
         (sub ? '      <p class="sec-sub">' + sub + '</p>\n' : '') +
         '    </div>\n';
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

/* ---------- the five services ---------- */

var SERVICES = [
  {
    slug: 'solution-design',
    name: 'Solution design',
    time: '2–3 weeks',
    row: 'The plan before the build. Data model, lifecycle, process map and how you will measure it, signed off by the people who have to live with it.',
    h1: 'The plan before the build',
    lede: 'Two or three weeks spent deciding what the system should be, written down and argued over, so that the build is execution rather than discovery.',
    title: 'Solution design — RevHops',
    desc: 'A written specification for your revenue system: data model, lifecycle, process map and reporting, signed off before anyone builds anything.',
    whatHead: 'A build without a plan is <span class="hl">a very expensive draft</span>',
    what: [
      'Most failed implementations were not built badly. They were built before anyone agreed what they were for, and the disagreement surfaced in week nine as a change request.',
      'Solution design front-loads that argument. We sit with sales, marketing, finance and whoever else has an opinion, and we do not stop until the object model, the lifecycle and the definition of a qualified lead mean the same thing to all of them.',
      'What comes out is a document. Not a deck.'
    ],
    included: [
      'Object and data model, including custom objects and properties',
      'Lifecycle stages and pipeline definitions everyone signs off',
      'Process map from first touch through to closed',
      'The reports leadership will actually open, and the fields they depend on',
      'An integration plan for the rest of the stack',
      'A build estimate that holds, because the scope is settled'
    ],
    endHead: 'What you have on the last day',
    end: [
      'A specification your team can hand to any competent builder, us included',
      'A walkthrough session, recorded, so the people who were not in the room still get it',
      'A prioritized backlog, split into what ships first and what waits',
      'A decision log, so in six months nobody has to guess why it was done that way'
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
    whatHead: 'The build is the easy part, <span class="hl">the handover is not</span>',
    what: [
      'Anyone can stand up a portal. The difference shows up four months later, when the person who understood it has moved on and nobody knows why there are two pipelines called Renewals.',
      'So we build in the open. Your admin sits in the working sessions, the naming conventions are written down before the first workflow, and every automation carries a note saying what it is for.',
      'Migrations get the same treatment. Data is mapped, cleaned and reconciled before it moves, and we run both systems side by side until the numbers agree.'
    ],
    included: [
      'Portal build against a signed specification',
      'Data migration, deduplication and reconciliation',
      'Lifecycle, pipelines, properties and permissions',
      'Automation for routing, scoring, handoffs and renewals',
      'Reporting and dashboards for each team that needs one',
      'Integrations with the finance, product and support tools you already own',
      'Training sessions, recorded, plus written documentation'
    ],
    endHead: 'What you have on the last day',
    end: [
      'A portal your team runs, not one they submit tickets against',
      'Documentation covering every object, workflow and integration',
      'Two weeks of hypercare after go-live, included',
      'A short list of the things we deliberately did not build, and why'
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
    lede: 'Roadmap, maintenance, training, and someone who answers when a workflow breaks on a Friday afternoon. Monthly, cancel with thirty days.',
    title: 'HubSpot support retainers — RevHops',
    desc: 'An ongoing HubSpot admin retainer: roadmap, maintenance, training and support from a Platinum Solutions Partner.',
    whatHead: 'A full-time admin is <span class="hl">more than most teams need</span>',
    what: [
      'Hiring a HubSpot admin means paying for forty hours to get about eight of real work. Not hiring one means the portal slowly rots, because the person who half-knows it has a day job.',
      'A retainer is the middle. You get a named admin who already knows your portal, a standing roadmap so improvements happen on purpose rather than in a panic, and a channel where a broken workflow gets looked at the same day.',
      'Hours roll over within the quarter. We would rather you spend them well than spend them fast.'
    ],
    included: [
      'A named admin who knows your portal, not a queue',
      'A quarterly roadmap agreed with you, reviewed monthly',
      'Build work: workflows, reports, properties, integrations',
      'Break-fix, same day for anything blocking revenue',
      'Training for new starters and refreshers for everyone else',
      'A monthly note on what changed, what it cost and what is next'
    ],
    endHead: 'How it runs month to month',
    end: [
      'One standing call a month, more if a project needs it',
      'Requests go to a shared channel, not to a form',
      'Anything over the retainer is quoted before it starts, never after',
      'Thirty days notice, both ways. No annual lock-in'
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
    lede: 'What the system should be doing, what it is doing instead, and which of those gaps is actually costing you money. Advice, not hours on a build.',
    title: 'RevOps consulting — RevHops',
    desc: 'Fractional revenue operations leadership: strategy, metrics, forecasting and the calls that decide what your system should do next.',
    whatHead: 'The tool is rarely <span class="hl">the actual problem</span>',
    what: [
      'Teams call us about HubSpot and end up talking about how deals are qualified, why forecast accuracy is forty percent, or whether the sales team is being measured on something it cannot control.',
      'Consulting is the version of the engagement where that is the whole point. No build attached. We look at how revenue actually moves through your business, tell you where it leaks, and help you decide what to do about it.',
      'Sometimes the answer is a project. Sometimes it is a conversation with your VP of Sales that nobody has been willing to have.'
    ],
    included: [
      'Revenue process review across marketing, sales and customer success',
      'Metric definitions and a reporting model leadership can trust',
      'Forecasting: how it is built, and why it keeps missing',
      'Territory, routing and compensation mechanics',
      'Tooling decisions, including the ones that end in do not buy it',
      'A quarterly plan with an order of operations, not a wish list'
    ],
    endHead: 'How it runs month to month',
    end: [
      'A standing session every fortnight with whoever owns revenue',
      'Findings written up, not left in a call recording',
      'We will disagree with you in writing when it matters',
      'Any build work that comes out of it is quoted separately'
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
    whatHead: 'Everyone owns a piece and <span class="hl">nobody owns the seams</span>',
    what: [
      'Marketing knows its half. Sales knows its half. Finance knows what arrives in the billing system and has opinions about how it gets there. The seams between them are where deals stall, and they are the part nobody has drawn.',
      'We interview each team, follow real records through the systems rather than the process anyone describes, and put the whole thing on one page.',
      'The map is usually uncomfortable. That is the useful part.'
    ],
    included: [
      'Interviews with every team that touches a deal',
      'A single end-to-end map, first touch through to cash collected',
      'Every handoff, owner and system of record marked on it',
      'Where records stall, and for how long, measured rather than guessed',
      'Duplicated work, manual steps and the spreadsheets holding it together',
      'A ranked list of fixes, cheapest and highest impact first'
    ],
    endHead: 'What you have on the last day',
    end: [
      'The map, as a working file you can keep editing',
      'A findings session with the teams that were interviewed',
      'A ranked fix list, sized so you can start on Monday',
      'A view of what it costs you to leave each one alone'
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

/* ---------- one service page ---------- */

function servicePage(s, i) {
  var kase = CASES[s.caseIdx];
  var other = SERVICES.filter(function (x) { return x.slug !== s.slug; }).slice(0, 2);

  var body = '';

  /* what it is, and what is in it */
  body += section(
'    <div class="split" style="align-items:start">\n' +
'      <div class="stack gap-20 reveal reveal-left">\n' +
'        <h2 class="h2">' + s.whatHead + '</h2>\n' +
        s.what.map(function (para) { return '        <p class="small">' + para + '</p>'; }).join('\n') + '\n' +
'      </div>\n' +
'      <div class="stack gap-16 reveal reveal-right">\n' +
'        <p class="label">What is included</p>\n' +
'        ' + ticks(s.included) + '\n' +
'      </div>\n' +
'    </div>\n');

  /* the deliverable */
  body += section(
    secHead(s.endHead) +
'    <div class="reveal" style="margin-top:clamp(22px,2.6vw,34px)">\n' +
'      ' + ticks(s.end, 'ticks-2') + '\n' +
'    </div>\n', 'section-tight');

  /* one case study, the poster card from the homepage rail */
  body += section(
'    <div class="split" style="align-items:center">\n' +
'      <a class="case-card reveal reveal-left" href="/case-studies/' + kase.slug + '">\n' +
'        <img src="../assets/img/case-study-placeholder.svg" alt="" aria-hidden="true" loading="lazy">\n' +
'        <div class="case-body">\n' +
'          <div class="case-text">\n' +
'            <h3 class="case-title">[Client name]</h3>\n' +
'            <div class="case-figs">\n' +
'              <span class="case-fig"><b>' + kase.figs[0][0] + kase.figs[0][1] + '</b><span>[measure]</span></span>\n' +
'              <span class="case-fig"><b>' + kase.figs[1][0] + kase.figs[1][1] + '</b><span>[measure]</span></span>\n' +
'            </div>\n' +
'          </div>\n' +
'          <span class="case-go" aria-hidden="true">&rarr;</span>\n' +
'        </div>\n' +
'      </a>\n' +
'      <div class="stack gap-20 reveal reveal-right">\n' +
'        <h2 class="h2">One that went <span class="hl">the way it should</span></h2>\n' +
'        <p class="small">[One paragraph on the client: what they sold, how big the team was, and\n' +
'          what state the system was in when they called.]</p>\n' +
'        <p class="small">[One paragraph on what this service changed for them, and the number that\n' +
'          moved because of it.]</p>\n' +
'        <a class="text-link" href="/case-studies/' + kase.slug + '">Read the story <span class="arrow">&rarr;</span></a>\n' +
'      </div>\n' +
'    </div>\n', 'section-tight');

  /* the price, and where to go next */
  body += section(
    secHead('What ' + s.name.charAt(0).toLowerCase() + s.name.slice(1) + ' costs') +
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
'    <p class="small muted reveal" style="margin-top:18px;max-width:62ch">Every number here is a\n' +
'      starting point, not a quote. The full range is on the <a href="/pricing">pricing page</a>,\n' +
'      and the real figure comes out of the first call.</p>\n' +
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
    headButtons: '          <a class="btn btn-primary" href="/call">Schedule a call</a>\n' +
                 '          <a class="text-link" href="/services">All services <span class="arrow">&rarr;</span></a>',
    body: body
  };
}

/* ---------- one case study page ---------- */

function casePage(c, i) {
  var used = [SERVICES[i % SERVICES.length], SERVICES[(i + 2) % SERVICES.length]];
  var body = '';

  /* the three numbers, on navy. The only place on the site type is set
     larger than an H1, and the only full-width navy band below the fold. */
  body += '\n<section class="section surface-navy">\n' +
'  <div class="shell">\n' +
'    <div class="figs reveal">\n' +
'      <div class="fig"><b><span data-count="' + c.figs[0][0] + '" data-suffix="' + c.figs[0][1] + '">' + c.figs[0][0] + c.figs[0][1] + '</span></b><span>[what this figure measures]</span></div>\n' +
'      <div class="fig"><b><span data-count="' + c.figs[1][0] + '" data-suffix="' + c.figs[1][1] + '">' + c.figs[1][0] + c.figs[1][1] + '</span></b><span>[what this figure measures]</span></div>\n' +
'      <div class="fig"><b><span data-count="00" data-suffix="%">00%</span></b><span>[what this figure measures]</span></div>\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n';

  /* the story, in three moves. Copy and image alternate sides so the page
     reads as a narrative rather than as three of the same block. */
  body += section(
'    <div class="split" style="align-items:center">\n' +
'      <div class="stack gap-20 reveal reveal-left">\n' +
'        <h2 class="h2">Where they <span class="hl">started</span></h2>\n' +
'        <p class="small">[What the business does, how many people sell for it, and what the\n' +
'          revenue system looked like on the day they called. Name the thing that finally made\n' +
'          them pick up the phone.]</p>\n' +
'        <p class="small">[The symptom everyone in the company could see, and the cause nobody\n' +
'          had gone looking for.]</p>\n' +
'      </div>\n' +
'      <img class="reveal reveal-right" src="../assets/img/case-study-placeholder.svg" alt=""\n' +
'           style="border-radius:var(--radius-card)" loading="lazy">\n' +
'    </div>\n');

  body += section(
'    <div class="split" style="align-items:center">\n' +
'      <img class="reveal reveal-left" src="../assets/img/case-study-placeholder.svg" alt=""\n' +
'           style="border-radius:var(--radius-card)" loading="lazy">\n' +
'      <div class="stack gap-20 reveal reveal-right">\n' +
'        <h2 class="h2">What we built</h2>\n' +
'        <p class="small">[The work, in the order it happened. What was scoped, what was built,\n' +
'          what got cut and why.]</p>\n' +
'        <p class="small">[The decision that mattered most, and the argument it settled.]</p>\n' +
'      </div>\n' +
'    </div>\n', 'section-tight');

  body += section(
'    <div class="split" style="align-items:start">\n' +
'      <div class="stack gap-20 reveal reveal-left">\n' +
'        <h2 class="h2">What changed</h2>\n' +
'        <p class="small">[What is different now, in the terms the client would use rather than\n' +
'          the ones we would. If something did not work, say that too.]</p>\n' +
'      </div>\n' +
'      <div class="stack gap-16 reveal reveal-right">\n' +
'        <p class="label">On the other side of it</p>\n' +
'        ' + ticks([
          '[Outcome, with the number attached]',
          '[Outcome, with the number attached]',
          '[Something the team can now do for itself]',
          '[Something that stopped being anyone\'s job]'
        ]) + '\n' +
'      </div>\n' +
'    </div>\n', 'section-tight');

  /* the client, in their own words */
  body += '\n<section class="section-tight">\n' +
'  <div class="shell">\n' +
'    <blockquote class="quote reveal" style="max-width:62ch;margin-inline:auto;text-align:center">\n' +
'      <p>[One quotation from the person who signed it off. Two or three sentences, in their\n' +
'        words, not ours.]</p>\n' +
'      <footer class="quote-by" style="justify-content:center">\n' +
'        <div class="stars" role="img" aria-label="Five out of five">\n' +
      new Array(5).join('x').split('x').map(function () {
        return '          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z"/></svg>';
      }).join('\n') + '\n' +
'        </div>\n' +
'        <cite>[Name] <span class="sep">|</span> [Title]</cite>\n' +
'      </footer>\n' +
'    </blockquote>\n' +
'  </div>\n' +
'</section>\n';

  /* what it took */
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
    headMedia: { src: 'assets/img/case-study-placeholder.svg', alt: '' },
    body: body
  };
}

/* ---------- the standalone pages ---------- */

var servicesIndex = {
  file: 'services/index.html',
  depth: 1,
  navCurrent: '/services',
  title: 'RevOps services — RevHops',
  description: 'Solution design, CRM implementations, HubSpot support retainers, RevOps consulting and lead to cash process mapping.',
  h1: 'Five ways in and one system underneath',
  lede: 'Most engagements start with one of these and grow into another. You do not need to know which one you need before the first call.',
  headButtons: '          <a class="btn btn-primary" href="/call">Schedule a call</a>',
  body:
    section(
      secHead('RevOps services that scale with you, <span class="hl">wherever you\'re at</span>') +
'    <div class="svc-list" style="margin-top:clamp(22px,2.6vw,34px)">\n' +
      SERVICES.map(function (s) {
        return '      <a class="svc-row reveal" href="/services/' + s.slug + '">\n' +
               '        <h3 class="svc-title">' + s.name + '</h3>\n' +
               '        <span class="svc-time">' + s.time + '</span>\n' +
               '        <p class="svc-copy">' + s.row + '</p>\n' +
               '        <span class="svc-go">Read more <span class="arrow">&rarr;</span></span>\n' +
               '      </a>';
      }).join('\n') + '\n' +
'    </div>\n') +
    section(
'    <div class="split" style="align-items:start">\n' +
'      <div class="stack gap-20 reveal reveal-left">\n' +
'        <h2 class="h2">How an engagement actually runs</h2>\n' +
'        <p class="small">There is no discovery phase where nothing happens. The first call is a\n' +
'          working session, and by the end of it you will know whether we are the right people for\n' +
'          the job, which is not always yes.</p>\n' +
'        <p class="small">From there the shape is the same whatever the service: agree what good\n' +
'          looks like, write it down, build against the document, hand it over with the\n' +
'          documentation. The interesting part is how much of that is arguing about definitions,\n' +
'          and how little of it is software.</p>\n' +
'        <a class="text-link" href="/pricing">What it costs <span class="arrow">&rarr;</span></a>\n' +
'      </div>\n' +
'      <div class="stack gap-16 reveal reveal-right">\n' +
'        <p class="label">What is true of all five</p>\n' +
'        ' + ticks([
          'You talk to the people doing the work, start to finish',
          'Scope is written down before anything is built',
          'Nothing gets handed over without documentation',
          'We tell you when the thing you asked for is not the thing you need',
          'No annual lock-in on anything that runs monthly'
        ]) + '\n' +
'      </div>\n' +
'    </div>\n', 'section to-white')
};

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

var caseIndex = {
  file: 'case-studies/index.html',
  depth: 1,
  navCurrent: '/case-studies',
  title: 'Case studies — RevHops',
  description: 'Revenue operations work we have done, what it changed, and what the clients said about it.',
  h1: 'Proof beats a pitch deck',
  lede: 'Five engagements, what was broken when we arrived, and what the numbers did afterwards. The awkward ones are in here too.',
  body:
'\n<!-- The client rail, straight off the homepage: one continuous strip, the\n' +
'     list duplicated verbatim, the whole thing sliding exactly half its\n' +
'     width so the seam never shows. Both lists must stay identical. -->\n' +
'<section class="logo-band" aria-label="Clients we have worked with">\n' +
'  <div class="logo-rail">\n' +
    [0, 1].map(function (copy) {
      var hidden = copy === 1 ? ' aria-hidden="true"' : '';
      var names = [['dg', 'DG'], ['woodside-homes', 'Woodside Homes'], ['core-income', 'Core Income'],
                   ['ignite-group', 'Ignite Group'], ['key-tree', ''], ['cialdini-institute', 'Cialdini Institute'],
                   ['casadomaine', 'Casadomaine Custom Homes'], ['financial-lease', 'Financial Lease'],
                   ['inbox-storage', 'Inbox Storage']];
      return '    <ul class="logo-run"' + hidden + '>\n' +
        names.map(function (n) {
          var alt = copy === 1 ? '' : n[1];
          var solid = n[0] === 'ignite-group' ? ' data-solid' : '';
          return '      <li><img src="../assets/img/logos/' + n[0] + '.webp" alt="' + alt + '"' + solid + ' loading="lazy"></li>';
        }).join('\n') + '\n    </ul>';
    }).join('\n') + '\n' +
'  </div>\n' +
'</section>\n' +
'\n<section class="section case-section to-white">\n' +
'  <div class="shell">\n' +
'\n' +
'    <div class="case-head">\n' +
'      <span aria-hidden="true"></span>\n' +
'      <div class="sec-head reveal">\n' +
'        <h2 class="h2">We\'ve hopped with <span class="hl">some of the best</span></h2>\n' +
'      </div>\n' +
'      <div class="case-nav reveal">\n' +
'        <button type="button" data-case-prev aria-label="Previous case studies">&larr;</button>\n' +
'        <button type="button" data-case-next aria-label="More case studies">&rarr;</button>\n' +
'      </div>\n' +
'    </div>\n' +
'\n' +
'    <div class="case-rail-wrap">\n' +
'      <div class="case-rail" data-case-rail tabindex="0" aria-label="Case studies">\n' +
      CASES.map(function (c) {
        return '        <a class="case-card reveal" href="/case-studies/' + c.slug + '">\n' +
               '          <img src="../assets/img/case-study-placeholder.svg" alt="" aria-hidden="true" loading="lazy">\n' +
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
      }).join('\n') + '\n' +
'      </div>\n' +
'    </div>\n' +
'\n' +
'  </div>\n' +
'</section>\n' +
'\n<!-- The testimonials, same three quotes as the homepage. No heading on the\n' +
'     page: each quote carries its own title, so the h2 is for the outline. -->\n' +
'<section class="section-tight testi-section">\n' +
'  <div class="shell">\n' +
'    <h2 class="sr-only">What clients say about working with us</h2>\n' +
'    <div class="testi">\n' + TESTIMONIALS + '    </div>\n' +
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
  lede: 'Published, because chasing an agency for a number is a waste of everyone\'s afternoon. These are starting points. The real figure comes out of the first call, and we will tell you on that call if we think you are about to overspend.',
  body:
    section(
      secHead('Project work with <span class="hl">a fixed scope and a fixed price</span>',
              'Quoted once the scope is written down. If the scope moves, we requote before the work starts rather than after it.') +
'    <div class="price-teaser reveal" style="margin-top:clamp(22px,2.6vw,34px)">\n' +
      [SERVICES[0], SERVICES[4], SERVICES[1]].map(function (s) {
        return '      <div class="price-teaser-cell">\n' +
               '        <span class="price-teaser-label">' + s.name + '</span>\n' +
               '        <span class="price-teaser-fig">' + s.price[0] + '<small>' + s.dur[0] + '</small></span>\n' +
               '        <p class="price-teaser-note">' + s.row + '</p>\n' +
               '      </div>';
      }).join('\n') + '\n' +
'    </div>\n') +
    section(
      secHead('Monthly work with no lock-in',
              'Thirty days notice, both ways. Nobody has ever done better work because the client was contractually stuck with them.') +
'    <div class="price-teaser reveal" style="margin-top:clamp(22px,2.6vw,34px)">\n' +
      [SERVICES[2], SERVICES[3]].map(function (s) {
        return '      <div class="price-teaser-cell">\n' +
               '        <span class="price-teaser-label">' + s.name + '</span>\n' +
               '        <span class="price-teaser-fig">' + s.price[0] + '<small>' + s.price[1] + '</small></span>\n' +
               '        <p class="price-teaser-note">' + s.row + '</p>\n' +
               '      </div>';
      }).join('\n') + '\n' +
'      <div class="price-teaser-cell">\n' +
'        <span class="price-teaser-label">Something else</span>\n' +
'        <span class="price-teaser-fig">Ask<small>We will say if it is not us</small></span>\n' +
'        <p class="price-teaser-note">Audits, one-off training, a second opinion on someone else\'s build. Smaller pieces of work get quoted on the call.</p>\n' +
'      </div>\n' +
'    </div>\n', 'section-tight') +
    section(
'    <div class="split" style="align-items:start">\n' +
'      <div class="stack gap-20 reveal reveal-left">\n' +
'        <h2 class="h2">What moves the number</h2>\n' +
'        <p class="small">Almost never the software. What changes the price is how many teams have\n' +
'          to agree, how much of the data has to be cleaned before it can move, and how many\n' +
'          systems are already holding a version of the truth.</p>\n' +
'        <p class="small">A twelve-person company with one pipeline and a clean import is at the\n' +
'          bottom of every range on this page. Four business units, two CRMs and a decade of\n' +
'          history is not.</p>\n' +
'        <a class="text-link" href="/services">See what each service covers <span class="arrow">&rarr;</span></a>\n' +
'      </div>\n' +
'      <div class="stack gap-16 reveal reveal-right">\n' +
'        <p class="label">Things that are always included</p>\n' +
'        ' + ticks([
          'Documentation. Not as a line item, as part of the work',
          'The same people from the first call to the handover',
          'A written scope you approve before anything is built',
          'Being told when the cheaper option is the better one',
          'No charge for the call where we work out whether this is a fit'
        ]) + '\n' +
'      </div>\n' +
'    </div>\n', 'section to-white')
};

var hubspot = {
  file: 'hubspot.html',
  depth: 0,
  navCurrent: '/hubspot',
  title: 'HubSpot Platinum Solutions Partner — RevHops',
  description: 'RevHops is a HubSpot Platinum Solutions Partner. Portal builds, migrations, admin retainers and a free portal audit.',
  h1: 'Platinum partner and full-time resident',
  lede: 'Platinum Solutions Partner. We build portals, migrate teams onto them and keep them running afterwards — and we will tell you when HubSpot is the wrong answer, which happens.',
  headMedia: { src: 'assets/img/hubspot-platinum-badge.webp', alt: 'HubSpot Platinum Solutions Partner' },
  headButtons: '          <a class="btn btn-primary" href="/contact">Request a free portal audit</a>\n' +
               '          <a class="text-link" href="/call">Or just book a call <span class="arrow">&rarr;</span></a>',
  body:
    section(
'    <div class="split" style="align-items:start">\n' +
'      <div class="stack gap-20 reveal reveal-left">\n' +
'        <h2 class="h2">What Platinum <span class="hl">actually means</span></h2>\n' +
'        <p class="small">HubSpot ranks its partners on how much software they sell and how well\n' +
'          the customers who buy it do afterwards. Platinum is the third tier of five. It is a\n' +
'          real bar and it is not the top one, and anyone who tells you their tier is the whole\n' +
'          story is selling you their tier.</p>\n' +
'        <p class="small">What it is useful for: it means the certifications are current, the\n' +
'          portals we have built are still in use, and we have a channel into HubSpot when\n' +
'          something is broken on their side rather than ours. That last one saves more time than\n' +
'          the badge does.</p>\n' +
'        <p class="small">What it is not: a reason to buy HubSpot. If you already own Salesforce\n' +
'          and it is working, we will say so.</p>\n' +
'      </div>\n' +
'      <div class="stack gap-16 reveal reveal-right">\n' +
'        <p class="label">Where we spend our time in the platform</p>\n' +
'        ' + ticks([
          'Marketing Hub — lifecycle, scoring, campaign attribution',
          'Sales Hub — pipelines, sequences, forecasting, routing',
          'Service Hub — tickets, SLAs and the handoff from sales',
          'Operations Hub — data sync, programmable automation, quality rules',
          'Content Hub — where it earns its place, and where it does not',
          'Custom objects, and knowing when you do not need one'
        ]) + '\n' +
'      </div>\n' +
'    </div>\n') +
    section(
      secHead('Certifications the team holds',
              'Current, and re-sat when they expire. HubSpot retires these on a schedule and a lapsed certification is worth exactly nothing.') +
'    <div class="reveal" style="margin-top:clamp(22px,2.6vw,34px)">\n' +
'      ' + ticks([
        'HubSpot Solutions Partner',
        'Revenue Operations',
        'Marketing Hub Implementation',
        'Sales Hub Implementation',
        'Service Hub Implementation',
        'Data Integrations',
        'CRM Data Management',
        'Reporting and Dashboards',
        'Marketing Automation',
        'Objectives-based Onboarding'
      ], 'ticks-2') + '\n' +
'    </div>\n' +
'    <p class="small muted reveal" style="margin-top:20px">[Certification badges to be added once\n' +
'      James supplies the artwork.]</p>\n', 'section-tight') +
    section(
'    <div class="stack gap-20 reveal" style="align-items:center;text-align:center;max-width:62ch;margin-inline:auto">\n' +
'      <h2 class="h2">A free look at your portal</h2>\n' +
'      <p class="small">An hour in your portal and a written page back: what is set up well, what is\n' +
'        quietly costing you, and the three things worth fixing first. No obligation and no deck.\n' +
'        If the portal is in good shape we will tell you that and you will have saved an hour.</p>\n' +
'      <div class="btn-row" style="justify-content:center">\n' +
'        <a class="btn btn-primary" href="/contact">Request the audit</a>\n' +
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
  lede: 'RevHops is a revenue operations consultancy in Phoenix, Arizona. Small on purpose, deep in one thing, and straight with you about the parts that will be difficult.',
  body:
    section(
'    <div class="split" style="align-items:center">\n' +
'      <img class="reveal reveal-left" src="assets/img/james-portrait.webp"\n' +
'           alt="James Ricks, founder of RevHops"\n' +
'           style="border-radius:var(--radius-card);aspect-ratio:4/5;object-fit:cover;width:100%;max-width:400px">\n' +
'      <div class="stack gap-20 reveal reveal-right">\n' +
'        <h2 class="h2">Started by someone who <span class="hl">had to fix it himself</span></h2>\n' +
'        <p class="small">I am James. Before RevHops I spent [00] years inside revenue teams rather\n' +
'          than beside them — running the systems, owning the number, and being the person who had\n' +
'          to explain to the board why the forecast and the invoices disagreed.</p>\n' +
'        <p class="small">That is the reason this shop exists. The agencies I hired were good at\n' +
'          building what I asked for and bad at telling me when I had asked for the wrong thing.\n' +
'          The people who could tell me that were expensive, busy, and gone by month three.</p>\n' +
'        <p class="small">So RevHops takes fewer clients and keeps the same people on them. It is a\n' +
'          less scalable business. It is a much better one to be a client of.</p>\n' +
'      </div>\n' +
'    </div>\n') +
    section(
      secHead('What we believe') +
'    <div class="grid grid-3 reveal" style="margin-top:clamp(24px,3vw,40px);gap:clamp(24px,3.4vw,52px)">\n' +
'      <div class="stack gap-10">\n' +
'        <h3 class="h3">Show, don\'t tell</h3>\n' +
'        <p class="small">We\'re veteran experts and we know our stuff, but it\'s the work we do,\n' +
'          not our words, that we let do the talking.</p>\n' +
'      </div>\n' +
'      <div class="stack gap-10">\n' +
'        <h3 class="h3">Seriously, fun</h3>\n' +
'        <p class="small">Working with us is as enjoyable and fun as it is effective. You know, the\n' +
'          whole work hard, play hard thing.</p>\n' +
'      </div>\n' +
'      <div class="stack gap-10">\n' +
'        <h3 class="h3">Clarity over comfort</h3>\n' +
'        <p class="small">The most important thing we can do is guide you down the right path, not\n' +
'          the easy or convenient one.</p>\n' +
'      </div>\n' +
'    </div>\n', 'section-tight') +
    section(
'    <div class="split" style="align-items:start">\n' +
'      <div class="stack gap-20 reveal reveal-left">\n' +
'        <h2 class="h2">How we work</h2>\n' +
'        <p class="small">Every engagement runs the same way regardless of size: agree what good\n' +
'          looks like, write it down, build against the document, hand it over with the\n' +
'          documentation. The parts that go wrong are almost always the parts nobody wrote down.</p>\n' +
'        <p class="small">We are also willing to be the wrong answer. If the job needs five bodies\n' +
'          on site next week, or the real problem is a hiring problem, we would rather say that on\n' +
'          the first call than find out together in month four.</p>\n' +
'        <a class="text-link" href="/services">What we actually do <span class="arrow">&rarr;</span></a>\n' +
'      </div>\n' +
'      <div class="stack gap-16 reveal reveal-right">\n' +
'        <p class="label">What that looks like in practice</p>\n' +
'        ' + ticks([
          'You talk to the people doing the work, start to finish',
          'Deep in revenue operations only, not a generalist shop with a RevOps page',
          'HubSpot Platinum Solutions Partner',
          'Everything handed over documented, so you are never hostage to us',
          'The wrong call if you need five bodies on site next week, and we will say so'
        ]) + '\n' +
'      </div>\n' +
'    </div>\n', 'section to-white')
};

var contact = {
  file: 'contact.html',
  depth: 0,
  navCurrent: '/contact',
  title: 'Contact RevHops',
  description: 'Get in touch with RevHops. Tell us what is broken, or book a discovery call directly.',
  h1: 'Tell us what is broken',
  lede: 'The more specific you are, the more useful the first reply will be. We answer everything within a working day, usually with a question rather than a pitch.',
  body:
    section(
'    <div class="split" style="align-items:start">\n' +
'\n' +
'      <!-- Deliberately not inside a card. The form is the page; putting a\n' +
'           frame round the only thing on it reads as a widget dropped into a\n' +
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
console.log('\n' + written + ' pages written. index.html is hand-maintained and was not touched.');
}
