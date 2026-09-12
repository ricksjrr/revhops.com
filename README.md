# revhops.com

Static marketing site for RevHops. No build step, no dependencies. Deploys to
GitHub Pages as-is.

`HANDOFF.md` is the state of play — what was decided, what is outstanding, and
why. This file is the mechanics: how the thing is built. Read the handoff
first.

## Before you change anything

**This folder is a git repository as of 9 September**, initialised on branch
`main` with one commit covering the whole site. There is finally a revert.
Nothing before that commit is recoverable — everything deleted on 4 September
is still gone.

No remote is configured yet. See "Deploying to GitHub Pages" below.

**Twenty-two pages exist.** `index.html` is hand-maintained. The other twenty
are written by `tools/build-pages.js` and **will be overwritten by the next
run of it** — edit the generator, not the HTML, or fold your change back in
afterwards. See "The page builder" below.

## Structure

Most pages are a flat `.html` file at the root, named for the page:
`pricing.html` served at `/pricing`. GitHub Pages serves it for both `/pricing`
and `/pricing.html`, so shared links can drop the extension.

Two are folders, because the URLs have a level in them:

```
services/index.html                     /services
services/solution-design.html           /services/solution-design
case-studies/index.html                 /case-studies
case-studies/case-study-one.html        /case-studies/case-study-one
resources/index.html                    /resources
resources/gated-download.html           /resources/gated-download
hubspot/index.html                      /hubspot
pipedrive/index.html                    /pipedrive
```

Nothing goes deeper than one level, and nothing else becomes a folder unless
its URL needs one.

**Links between pages are relative and extensionless** — `services`,
`../pricing`, `./` for home. They are written root-absolute in
`tools/build-pages.js` because that is what is readable, and `relativise()`
rewrites them on the way out.

Relative, because the site has to work at two different base paths: the
GitHub Pages project URL puts it one folder down
(`ricksjrr.github.io/revhops.com/`), where `/services` points at the top of
github.io and 404s. Relative links resolve against whatever the site is
served from, so one set of files works there, at `revhops.com`, and under
`tools/serve.js`.

Extensionless, because GitHub Pages serves `pricing.html` for `/pricing`, so
the address bar keeps the clean URL either way.

The depth-1 pages are served at `/services/` and `/services/solution-design`;
a browser resolves `../` against `/services/` in both cases, so one prefix
covers the index and the detail pages alike.

The smoke test fails if a root-absolute link reappears anywhere.

Clicking between pages still will not work from `file://`, because
extensionless paths need a server to resolve. Use `preview.command`.

`normalisePath()` in `site.js` strips both `index.html` and a bare `.html`, so
`/services.html`, `/services` and `/services/` all match when it sets
`aria-current`.

**Paths are relative and depth-correct**, not root-relative: `assets/...` at
the root, `../assets/...` one level down. That works identically on a
`github.io` project URL and on the custom domain, so nothing needs changing
when the domain is connected. If you add a page, count the folders and use the
matching number of `../`.

```
index.html              Home — maturity slider hero. Hand-maintained.
services/               Services index + the five service pages
case-studies/           Case studies index + the five case study pages
hubspot/                HubSpot index. The six hub pages go here too.
resources/              Resources index + a page per gated resource
pricing.html  about.html  contact.html
newsletter.html         Opt-in page. Its HubSpot form id is a placeholder.
audit.html              Free HubSpot audit request. Its own HubSpot form id.
terms.html  privacy.html
call.html               Meetings embed, nothing else. Every CTA points here.
client-call.html        Same, client scheduler, noindex, unlinked
.nojekyll               Serve files as-is, no Jekyll processing
llms.txt                Linked from the footer
HANDOFF.md              State of play. Read first.
assets/
  css/site.css            Design system + all page styles
  js/site.js              Nav, theme, parallax, reveals, counters, back to top
  js/maturity-slider.js   Hero module (self-contained)
  img/
    revhops-logo.png        Navy lockup, 1250x313 — nav
    revhops-logo-white.png  White lockup, 1250x313 — footer
    revhops-icon.png        Navy bunny, 1000x1000 — favicon
    revhops-icon-white.png  White bunny, 1000x1000 — slider thumb
    hubspot-platinum-badge-white.webp   Footer, and the HubSpot page header
    hubspot-platinum-badge.webp         Colour original, unused
    pipedrive-partner-badge-white.webp  Footer. Derived from tools/pipedrive.webp
                                        by dropping the green box, 11 Sep.
    pipedrive-revhops.webp              Co-branded banner on the Pipedrive page
    start-panel-bg.webp     Artwork behind the close
    case-study-placeholder.svg
    hop.webp / hop-still.webp   Orphaned. Nothing references them.
    logos/                  9 client logos, greyscale webp
    tools/                  15 platform marks for the tool clump
tools/
  build-pages.js          Writes every page except index.html. See below.
  smoke.js                The test. See below.
  copy-export.js / copy-import.js / copy-map.json
```

## The page builder

Twenty pages share a head, a nav, a closing panel and a footer. Hand-copied,
one nav change is twenty edits and the twenty-first page is the one that
quietly drifts. `tools/build-pages.js` holds the shared chrome once and the
per-page content in `PAGES`, and writes plain static HTML.

```
node tools/build-pages.js
```

**It is not a build step in the deploy sense.** GitHub Pages never sees it.
The `.html` files it writes are committed and served as-is, so the site still
deploys with no dependencies and no pipeline. It exists purely so the chrome
cannot drift.

- `NAV_ITEMS` is the navigation. One edit, every page.
- `SERVICES` and `CASES` drive the five service pages and the five case study
  pages, plus the lists that link to them.
- `RESOURCES` and `RESOURCE_TYPES` drive the whole of `/resources` — the
  shelves, the filter, the pagination, the video lightbox and a generated
  landing page for every gated item. **Adding a resource is one object in
  `RESOURCES` and a rebuild**; see "Adding a resource" below.
- `STAMP` is the cache stamp, and has to match `index.html` by hand.
- `index.html` is deliberately not in `PAGES`. The maturity hero is one of a
  kind and templating it would cost more than it saved.

Editing a generated page by hand works until the next run, which is to say it
does not. Put the change in the generator.

This is not hypothetical. `about.html` was renamed to `about-us.html` and
rewritten by hand on 10 September without the generator being told, so the
next run wrote the old copy back to the old filename and the nav kept
pointing at it. It was folded back in on 11 September, and the page has since
moved back to `/about`.

## Adding a resource

One object in `RESOURCES` in `tools/build-pages.js`, then
`node tools/build-pages.js`. There is no second step: the shelf, the filter,
the pagination, the lightbox and the gated landing page all follow from it.

```js
{ type: 'videos', title: 'How to fix a lifecycle', meta: '8 min',
  copy: 'One line on what it shows.', video: 'dQw4w9WgXcQ' }

{ type: 'downloadables', title: 'Lead to cash map template', meta: 'XLSX',
  copy: 'The one we use on every mapping engagement.',
  file: 'assets/files/lead-to-cash-map.xlsx' }

{ type: 'downloadables', title: 'The RevOps audit checklist', meta: 'PDF',
  copy: 'Forty questions, in the order we ask them.',
  gated: true, slug: 'revops-audit-checklist' }
```

- `type` is one of the `RESOURCE_TYPES` slugs: `blog`, `case-studies`,
  `videos`, `downloadables`, `games`.
- A **bracketed** title means placeholder, and the card renders inert rather
  than as a link that goes nowhere.
- `video` opens the lightbox in place. `gated: true` generates
  `/resources/<slug>` with the form on it and sends the card there instead —
  gated is a flag rather than a type, so a video and a download are gated the
  same way.
- `featured: true` puts it in the gradient card at the top. Exactly one entry
  carries it.
- **Case studies are not in `RESOURCES`.** That shelf reads `CASES` directly,
  so the two lists cannot drift apart.

A type with an `all` destination in `RESOURCE_TYPES` shows four cards and a
See-all link; one without shows eight and paginates. That single field is the
whole difference between the two kinds of shelf.

## Adding or editing a hub page

The six pages under `/hubspot/` are one template, `hubPage()`, run over
`HUB_PAGES` in `tools/build-pages.js`. Edit the entry and rebuild; there is
no per-page markup to keep in step.

```js
{ slug: 'sales-hub',
  title: 'HubSpot Sales Hub &mdash; RevHops',
  desc:  'One sentence for the meta description.',
  lede:  'The paragraph under the h1.',
  head:  'What Sales Hub <span class="hl">actually does</span>',
  sub:   'What the hub is, in our words, after HubSpot’s.',
  features: [ { title: '', copy: '', chips: ['', '', ''] } ],  // exactly six
  tiers:    [ '<b>Free</b> is…' ],                        // every tier, plus a caveat
  wrong:    [ '' ],                                            // exactly four
  ways:     [ { title: '', href: '', go: '', copy: '' } ]       // four
}
```

- The `h1` is derived from `slug`, so `sales-hub` renders as Sales Hub. It is
  the hub's name and never a slogan: you arrive from a grid of six names.
- `head` is the one place a hub page spends its `.hl`. One per page.
- `features` cards are deliberately **not** links. Each is a capability, not
  a page in waiting, and an arrow that goes nowhere is worse than no arrow.
- **No prices anywhere.** HubSpot moves them; `tiers` describes what each
  tier is *for* and the `.partner-note` links out to HubSpot's own pricing
  page. The smoke test fails on a dollar figure.
- The chips are HubSpot's own feature names, off their product pages. A
  rename makes a chip wrong rather than merely dated, so re-read them
  whenever HubSpot reshuffles the lineup.
- A **seventh hub** is one object here plus one in `HUBS`, which is what
  `/hubspot` and the other-hubs grid at the foot of each page both read.

Section order is fixed: what it does, which tier, where it goes wrong, what
we do, the other five hubs. The last one carries `.to-white` because the
closing panel bleeds up into it.

## Verifying a change

`node --check` only catches syntax. The real check is

```
cd ~/Downloads/Claude/revhops.com && node tools/smoke.js
```

225 checks. Needs `npm install jsdom` once; `tools/node_modules` is gitignored.
It lives in the repo on purpose — it was rebuilt from scratch three times after
`/tmp` was cleared between sessions.

There is a second suite for `/resources`, since `smoke.js` reads the homepage
and nothing else:

```
node tools/resources-smoke.js
```

It checks the shelves and their order, the See-all links, that placeholder
cards are inert, that gated items route to their own generated page, that the
lightbox tears its iframe down on close, and every internal link on the page.
Pagination is tested against a synthetic twelve-card shelf, because no real
shelf is long enough to page yet.

And a third for the six hub pages:

```
node tools/hubs-smoke.js
```

It checks that all six exist and that `/hubspot` links at exactly those six,
that the six have not drifted apart (same section count, same cache stamp),
one highlight each, six unlinked feature cards with three chips apiece, two
ticks lists, four service rows, no dollar figures, no em dashes, no `hr`,
every boxed button going to `/call` or `/contact`, the last section carrying
`.to-white`, and every internal link resolving to a file that exists. That
last check is the one that would have caught the six pages being missing.

`smoke.js` loads the homepage, runs both scripts, and checks the structure,
the cache stamp, every local file reference, stylesheet brace balance, that the document
appears exactly once, the dark theme's contrast figures recomputed from the
stylesheet, and a long list of things that were removed and must stay removed.

The brace check exists because a regex-driven deletion once left a stray
closing brace, which kills every rule after it while every DOM assertion still
passes. The document-appears-once check exists because a bad string slice once
duplicated the entire file, and every DOM assertion still passed, because
`querySelector` returns the first match.

The `rule()` helper has been wrong twice, both times reporting a bug that was
not there. It is anchored to the start of a line, because a plain `indexOf`
finds a selector as a substring of a longer one. And it returns every matching
rule joined rather than the first, because declaring a selector twice is
ordinary CSS and a deliberate technique here.

Duplicate selectors are listed as a note rather than a failure, since the CARD
HOVER block exists precisely to re-declare a hover a later rule had cancelled.
Most assertions exist because something broke once, and each carries a comment
saying which. Add to it rather than rewriting it.

**What it cannot do:** jsdom has no layout engine. Anything about size or
position is recomputed by hand from the CSS. That catches a value drifting out
of range; it is not a substitute for opening the page in Arc.

## Cache stamp

Every page links `site.css?v=…` and `site.js?v=…` with a shared timestamp.
Bump it on every change, on every page at once, or stale styles show up —
especially on iOS, where mobile Safari caches stylesheets hard enough that
edits appear not to land.

Current stamp: derived — a hash of `site.css`, `site.js` and
`maturity-slider.js`, computed by `tools/build-pages.js` on every run and
written into every page including `index.html`. Nothing to bump by hand, and
nothing to forget. It was a typed constant until 9 September; it went stale
twice, and the second time a whole redesign shipped and rendered as the old
one because the CDN kept serving the previous stylesheet under an unchanged
`?v=`. It lives in three places: `index.html`,
`STAMP` in `tools/build-pages.js`, and `STAMP` in `tools/smoke.js`.

## HubSpot tracking

Every publicly accessible page carries the HubSpot tracking script in its
`<head>`, portal `46722926`. Generated pages get it from `head()` in the
builder; `index.html` carries its own copy. The `id="hs-script-loader"` is what
HubSpot looks for, so do not rename it, and do not load it twice on one page.

```html
<!-- HubSpot tracking, portal 46722926. -->
<script type="text/javascript" id="hs-script-loader" async defer src="//js.hs-scripts.com/46722926.js"></script>
```

`async defer` and a protocol-relative src, as HubSpot ships it. It is the only
third-party script on the site.

## Still to fill in

Everything below is marked in the source with `[square brackets]`, so
`grep -rn "\[" index.html assets/js` finds all of it. `HANDOFF.md` carries the
full outstanding list, including the pages that still need building.

**1. Case study outcomes** — the cards on the homepage. Each wants a client
name, one line on what was broken, one on what changed, and two figures. Left
blank on purpose: these are real client results and should not be invented.

**1b. Case study filter tags** — `CASES` in `tools/build-pages.js` carries
`crm`, `industry` and `stage` on each of the five, and the /case-studies filter
is built from them. The tags themselves are invented, the same way the `00%`
figures are. Correct them with the outcomes.

**2. Years in revenue operations** — `[00]` in the About bullets.

**3. A portrait** — About still points at `case-study-placeholder.svg`, twice.
Both images are placeholders by choice, so the missing photographs cannot ship
unnoticed.

**4. Case studies in the hero slider** — `caseStudy` on each of the five
`STAGES` in `maturity-slider.js`. All five currently name Makarios Design Build
with placeholder text. Also swap `SHOT_SRC` for a real photo.

**5. One form posts nowhere** — the hero's capture card. The hidden `stage`
field already tracks the slider, so whatever receives it knows which stage was
picked. The footer newsletter *opt-in block* was removed on 4 September and is
not coming back; `/newsletter`, added 11 September, is a page rather than a
footer widget, and its form id is a placeholder — see item 6.

**6. HubSpot form IDs.** The contact page form when that page is rebuilt, and
the newsletter form, which `/newsletter` ships with as the literal placeholder
`[NEWSLETTER-FORM-ID]`. Portal `46722926` is known. The meetings slug is
`revhops/discovery-call`.

## Conventions

Decisions that apply everywhere, worth knowing before editing. `HANDOFF.md`
carries the reasoning; this is the short list.

**No eyebrows.** The small tracked-uppercase label above a heading is gone
site-wide, and is the thing James identifies as an AI tell. Where one was
carrying the only heading on a card it became `.label` — Ubuntu bold, sentence
case.

**No commas in section titles**, unless James writes the title himself.

**Titles are one line, two at the most, never three.** A copy rule before it is
a type rule: if a title wraps to three, shorten the title rather than shrinking
the type. The smoke test estimates line count at six viewport widths and fails
above two.

**Boxed buttons mean booking.** `.btn` is reserved for actions that book or
request something. Every other call to action is a `.text-link` with an arrow.
Buttons are navy in light, warm in dark, warm on hover in both.

**No hairlines between sections, ever.** No `border-top` on a section, no rule
under a header band. Surfaces separate by colour or by a `.fade-top` /
`.fade-bottom` ramp, or they do not separate. The one exception is a full-width
navy section between two light ones. The smoke test greps for this.

**The warm highlight.** `.hl` is a warm marker drawn as a background-image at
80% of the line box, sat low in it, because a full-height fill collides with
the line above wherever a highlighted phrase wraps. Type on it is a literal
`#304157`. `box-decoration-break: clone` gives each line of a wrapped phrase
its own fill. Not italic. Five phrases carry it on the homepage and the smoke
test checks each by name, failing if a sixth appears.

**One address, no phone.** Every address on the site is `team@revhops.com`.

**Section width.** `main > section > .shell` runs to 60px from each screen edge
rather than being capped and centred, clamped down on small screens. The nav at
rest uses 45px. The hero is excluded because its `.shell` is a grandchild of
the section, not a child; the nav and footer sit outside `<main>`.

**Background circles never cover content.** Layering is global:

```
section          position: relative, NO z-index   background layer
.disc            z-index 1                        above every background
section > .shell z-index 2                        above every disc
```

Sections must not carry a z-index. One that does forms a stacking context,
which traps its disc at that level and lifts the whole subtree above the next
section's content as well as its background. That was a real bug; this is the
fix.

**One hover for every card.** The 4px lift and deep shadow from the hero cards,
applied to `.card`, `.card-link`, `.price-teaser-cell` and `.svc-row`. It is
defined at the very end of `site.css` on purpose: `.reveal.is-in` sets
`transform: none` at the same specificity, and being later in the file it was
silently cancelling the lift on every card that animates in.

## The page hero

`.page-hero` is the opening band on every page except the homepage. It
replaced `.page-head` on 9 September, after that header shipped and was
measured at 741px tall with a 900px gradient circle filling its right-hand
side — a screen and a half of nothing on a 1440px display before the page
started.

```
section.page-hero
  .shell
    .page-hero-inner        grid: copy | a spacer the artwork sits over
      .page-hero-text       h1.h1 + p.lede (+ .btn-row) (+ dl.hero-meta)
    .page-hero-media        absolute, right: 0, runs off the screen edge
  .page-head-end[data-nav-clear]
```

**No gradient circle, here or anywhere below the homepage.** The disc is the
homepage's device. Twenty pages carrying the same one turned it into
wallpaper, and the size of it was what pushed every page's content down.

**The artwork bleeds off the right edge** because `main > section > .shell`
is full-bleed, so `right: 0` inside it is the screen edge. `.page-hero-inner`
reserves a column of the same width, so the copy never runs under it and the
headline breaks at the same point on every page.

**It starts below the nav**, unlike the old header, which pulled up behind
it. The nav is transparent at rest with navy links sitting hard right —
exactly where the artwork is — and running the image up behind them made the
links unreadable until the bar collapsed.

`dl.hero-meta` is the two or three facts worth putting at the top: timeline
and starting price on a service page, sector and engagement on a case study.
`.page-hero-plain` drops the artwork column, for the legal pages.

Below 900px the artwork returns to the flow as a 16:9 band under the copy.

`.page-head` is still in the stylesheet and is no longer used by anything.

## The old global page header

`.page-head` was the standard opening band on every page except the homepage.
Kept in the stylesheet, referenced by nothing.

```
section.page-head
  .disc[data-parallax="0.13"]
  .shell > .page-head-inner
    .page-head-text     h1.h1 + p.lede  (+ optional .btn-row)
    .page-head-media    optional, a mark or an image
  .page-head-end[data-nav-clear]
```

**One height for every page.** `--page-head-h`, a token on `.page-head`, is
`clamp(270px, 32vw, 470px)` and does two jobs: it is the `min-height` of the
grid and the `max-height` of anything in the media column. So the band is the
same height on every page, content is centred in the same box, and a badge can
never push one page's band taller than the rest. It is the one number worth
tuning if the bands feel too tall or too short.

Because it is a floor rather than a fixed height, a header whose copy grows
past it will still push its own band taller and break the match. The smoke test
estimates each header's content height at four widths and fails if a page
exceeds the token.

**Two thirds text, one third empty.** `.page-head-inner` is a literal `2fr 1fr`
grid, left aligned. The empty third stays the same width whether or not
`.page-head-media` is present, so adding a mark never moves the headline and
the title breaks at the same point on every page. A mark in that slot is capped
by height, not width. Do not put a max-width on the headline to fake the two
thirds — the grid is what holds it, and a max-width would let the empty third
collapse.

**The circle bleeds out of the band on purpose.** Nothing clips it. It runs
past the bottom of the header and sits behind the copy of the next section,
which works because sections carry no z-index. `main` clips on x only, so the
horizontal overhang is hidden and the vertical bleed is not. Sizing is
`right: calc(29vw - var(--ph-disc))`, which leaves the same slice of screen
covered at any width; a fixed negative offset lets the circle swallow most of a
narrow screen.

The band pulls up behind the nav by a negative `--nav-h` margin, added back as
padding, so the circle runs to the top edge of the screen the way the hero's
discs do.

`.page-head-end` is a zero-height sentinel at the foot of the band and the
element the nav watches. It cannot be the headline: the band's negative top
margin puts the headline within the collapse threshold at scroll zero, so the
bar floated on load and the hysteresis then stopped it ever expanding again.

## The navigation

Two states, driven by the same `data-nav-clear` element the hero uses.

**At rest** it is invisible — no background, border or shadow — so the hero
disc passes through it. Links are navy on paper, sitting hard right next to the
Schedule a call button.

**Floating**, the moment the nav band would start covering the page's H1, it
collapses into a navy bar with 12px corners, 20px off the top of the viewport,
spanning 78% of the width. The trigger is the element carrying `data-nav-clear`
reaching the bottom of the nav at rest — measured against the `--nav-h` token
rather than the bar's live height, which shrinks once it collapses and would
make the threshold oscillate at the boundary. Every page marks its own, so the
transparent nav links never sit on top of the headline. Links go to a light
slate, the button inverts to paper-on-navy, and the logo cross-fades from the
navy lockup to the white one (`.brand-base` / `.brand-alt`, both real files,
not a CSS filter).

```css
--nav-float-gap:  20px;               /* clearance from the top edge */
--nav-float-w:    min(78vw, 1416px);  /* width once collapsed */
--nav-float-w-sm: calc(100% - 24px);  /* and on phones */
```

Below 940px the links tuck behind the hamburger. The dropdown hangs off the bar
itself rather than the full-width header, so it lines up in both states, and it
turns navy when the bar does.

**A refresh lands at the top.** The inline head script sets
`history.scrollRestoration = 'manual'`, guarded by `!location.hash`. The
browser was restoring the scroll position on reload, and a few pixels down the
page is enough for the nav to be in its floating state.

## Dark mode

Rebuilt from scratch on 7 September. The brief, verbatim: anything
paper-coloured goes navy, anything navy goes white, and the footer and the
floating navigation bar stay the same.

**`:root[data-theme="dark"]` on `<html>`.** Not a `prefers-color-scheme` query:
the toggle is the only thing that sets it, so the theme is always the visitor's
explicit choice and never changes under them. There is no time-of-day default.
The block lives at the foot of `site.css`.

**`--navy` was split in two, and that is the load-bearing change.** It had been
doing two unrelated jobs: the dark ground under the footer, the floating bar
and the primary button, and the strongest ink on the paper — links, arrows,
stars, focus rings. Those want opposite things when the page goes dark.

- `--navy` means a dark chip and nothing else. Anything painting with it comes
  out identical in both themes with no dark rule at all, which is precisely how
  the footer and the floating bar stay the same.
- `--ink-strong` means the strongest ink on the page ground: navy on paper,
  white on navy. Twenty-three declarations moved onto it.
- `--ink-hover` replaced the five hover uses of `--deep` for the same reason.

**The palette is measured, not eyeballed**, and the smoke test recomputes every
figure from the stylesheet so a later tweak to a hex cannot quietly drop the
page under AA:

| token | dark value | on the ground | on the lifted surface |
| --- | --- | --- | --- |
| `--ink` | `#F2F6FA` | 9.58:1 | 7.83:1 |
| `--body` | `#D5DFEB` | 7.72:1 | 6.31:1 |
| `--muted` | `#B6C3D3` | 5.81:1 | 4.75:1 |
| `--ink-strong` | `#FFFFFF` | 10.40:1 | — |

Headings stop short of pure white on purpose: `#FFFFFF` over a whole paragraph
on this navy glares. Full white is kept for the small, sparse things.

`--paper` goes to `#304157`. `--surface`, the white the tool clump and
testimonials sit on, goes to a lifted navy `#3A4E68` rather than staying white,
so the drift up the page still reads as a step out of the ground.
`--paper-step` was added so the two `.to-white-*` gradients follow instead of
carrying a literal `#FCFCFC`.

**Six places the token model could not reach.** Each is a real exception, not
tidying:

1. **The two bars that stay the same.** Fixed navy, but they paint their
   contents with light tokens, which now resolve to navy. Literal `#FAFAF8` in
   the dark block, deliberately not following the theme.
2. **The floating bar's edge.** A navy pill on a navy page, with a dark shadow
   on a dark ground. It gets `inset 0 0 0 1px rgba(255,255,255,.42)`, measured
   at 3.26:1 — the non-text threshold. The alternative was changing the bar's
   colour, which James asked not to do.
3. **The buttons.** `.btn-primary` is a navy chip with paper type; in dark both
   resolve to navy. Inverted instead.
4. **The client logo band.** Left alone on navy the mid-grey marks measure
   about 1.9:1, worse than on paper. Flattened to white at .55 opacity they all
   land together at 4.43:1.
5. **The tool clump.** Twelve of fourteen marks fall below 3:1 in colour on
   this navy and HubSpot lands at 1.16:1. So: white silhouettes at rest
   (3.94:1), and on hover the mark gets a white plate and keeps its real
   colours. The plate is a pseudo-element behind the mark, not padding, because
   padding would move every mark in the clump.
6. **The close.** Set over a photograph, and a photograph has no dark variant.
   Navy type holds 3.5:1 or better through the band the headline occupies,
   while the dark ink would land at 1.1:1. That section keeps light-theme type
   in both themes. Its top fade still follows the theme.

**The toggle** sits in `.nav-cta`, left of the call button. Both the sun and
the moon are in the DOM and CSS picks one — rendering the right icon in JS
would leave the wrong one on screen until the script ran. It carries
`aria-pressed`, and `site.js` keeps that and the label in step. The choice is
saved to `localStorage` under `revhops-theme`, wrapped in `try`, because Safari
in private mode throws on write.

**No flash.** An inline script in `<head>` reads the saved choice and sets the
attribute before the first paint. It must stay inline and in the head; moving
it into `site.js` puts a white flash on every load for anyone on the dark
theme.

## The hero

Headline, subhead, slider, four cards in three columns. No eyebrows, badges or
callouts.

**The visitor picks their stage and it stays picked.** Drag the bunny, click a
node or a stage name, or use the arrow keys. Nothing is driven by scroll, so
the page below is always one scroll away and the cards can be read and hovered.

**The choice is published** two ways, so the rest of the page can respond:

```html
<html data-stage="growth" data-stage-index="2">
```

```js
document.addEventListener('revhops:stage', function (e) {
  e.detail.index;  // 0..4
  e.detail.name;   // 'Growth'
  e.detail.slug;   // 'growth'
  e.detail.stage;  // the whole STAGES entry
});
```

The attribute means CSS alone can key off the selection with no script —
`html[data-stage="enterprise"] .some-block { … }` — which is the cheapest way
to personalise copy further down the page.

Every card surface on the site uses one token, `--card-veil`, so the gradient
circles read faintly behind them. Hover lifts without changing the surface.

- **Your situation may look like this** — headcount and revenue bullets, then a
  hairline and a second heading over the chips: green tick for what they have,
  red cross for what they are missing. Ends with a tech stack audit link.
- **Problems you're likely facing** — bullets, then a second section mirroring
  the tech stack block, then a Book a discovery call link. That second section
  is a placeholder: `PROBLEM_SPLIT` near the top of `maturity-slider.js` holds
  its headline and body.
- **A case study that's relevant to you** — title and description left, square
  thumbnail right, story link bottom-left. All five stages currently name
  Makarios Design Build with placeholder text.
- **Send me the info for my team's stage** — the capture card, sharing the
  third column with the case study above it. Title then the field, no rule
  between them, and the submit is a navy text link to the right of the email
  field rather than a button.

The third column is a flex column and the case study card carries `flex: 1`, so
it absorbs the leftover height and the pair lands level with the two single
cards beside it.

Titles live in `CARD_TITLES`, and `CARD_COUNT` derives from it. The grid column
count in `site.css` is the one thing to match by hand.

The card block reserves the height of the tallest stage up front
(`lockCardsHeight`) so the hero does not re-centre when the content changes,
and the swap between stages is a 120ms crossfade.

## Editing the stages

All five stages live in one array at the top of
`assets/js/maturity-slider.js`:

```js
{
  name: 'Growth',
  situation: [ /* 3 lines: headcount, team makeup, revenue band */ ],
  have:      [ /* 3–4 short tool names */ ],
  missing:   [ /* 3 short tool names */ ],
  problems:  [ /* 3 lines */ ],
  caseStudy: { who, line, href }
}
```

Keep the counts as they are — three or four items per list is what keeps the
cards at even heights. Card titles live in `CARD_TITLES` just below the array.

Adding or removing a stage works, with one manual step: `.mat-labels` in
`site.css` is `grid-template-columns: repeat(5, …)`. Change the 5 to match.

The module mounts on any element with `data-revhops-maturity`. Optional:
`data-icon="path.png"` overrides the thumb image.

## The logo band

Sits directly under the hero. One rail holding two identical `.logo-run` lists;
the rail translates `-50%`, which is exactly the width of one run, so the copy
lands where the original started and the loop is seamless. Adding or removing a
logo means editing **both** lists — they have to stay identical or the seam
will jump.

It scrolls continuously at a constant rate, 48s for a full cycle, 30s on
phones. `.logo-run` sets `padding-right` equal to its `gap` so the spacing
across the seam matches the spacing between logos.

The second list is `aria-hidden="true"` with empty `alt`, so screen readers
hear each client once. Hovering pauses the animation. Under
`prefers-reduced-motion` the animation stops, the duplicate run is hidden and
the band becomes a horizontally scrollable row.

The band carries `--proof-lead`, the value `measureProofLead()` publishes, so
it sits 100px below the stage cards at any viewport height.

## Motion

`assets/js/site.js` runs one rAF-throttled scroll loop:

| Effect | How to use it |
| --- | --- |
| Parallax | `data-parallax="0.13"` on an absolutely-positioned element. Negative drifts the other way. `data-parallax-host=".selector"` drives it off an ancestor's travel instead — the hero discs use this so they travel further than the hero itself does. The two hero discs run at `0.28` / `-0.28` and start well outside the hero so there is real travel to see. `--hero-bleed-tail` sets how far below the hero they stay unclipped. |
| Parallax growth | `data-parallax-grow="0.55"` grows the element by 55% across the host's travel. Negative shrinks. The cool blue hero disc uses this to swell as it rises. |
| Reveal on scroll | `class="reveal"` fades, lifts and un-blurs. Add `reveal-left`, `reveal-right` or `reveal-scale`. Siblings stagger automatically. |
| Filling rail | `<div class="rail"><span></span></div>` fills left to right on entry. |
| Counters | `<span data-count="41" data-suffix="%">41%</span>` counts up once. |
| Tilt | `--tx` / `--ty` in the range -1 to 1, written by JS. The angles, resting rotation and easing are decided in the stylesheet. The About pair uses this. |

Everything collapses to a static layout under `prefers-reduced-motion`.

## Previewing it locally

**Double-click `preview.command`.** It starts a small server, opens your
browser at it, and prints the address. Close the Terminal window it opens to
stop it.

Opening `index.html` by double-clicking works for *looking* at a page but not
for clicking between them: the links are root-absolute (`/services`,
`/pricing`) and from `file://` those resolve against your hard drive rather
than the site. That is the trade the clean URLs bought, and this is the fix the
README has always pointed at.

Under the hood it is `tools/serve.js` — Node, no dependencies — which resolves
a bare path the way GitHub Pages does:

```
/pricing        → pricing.html
/services       → services/index.html
/services/x     → services/x.html
```

Anything else gets a 404 rather than falling back to the homepage, because
silently serving index.html for a typo is how a broken link survives a
click-through test. Run it directly with `node tools/serve.js`, or
`node tools/serve.js 4000` for another port.

**On a phone or tablet.** The server binds to every interface, so open
`http://<your-mac-ip>:<port>` on a device on the same Wi-Fi. Option-click the
Wi-Fi menu bar icon for the IP.

## Deploying to GitHub Pages

The repo is initialised and committed. What is left:

1. Create an empty repo on GitHub. Do not let it add a README or a
   `.gitignore` — this folder already has both and the merge is a nuisance.
2. `git remote add origin https://github.com/<user>/<repo>.git`
3. `git push -u origin main`
4. Settings → Pages → Source: `main` branch, `/ (root)`.

`.nojekyll` is already there, which is what stops Pages trying to run Jekyll
over the folder.

**Do not point `revhops.com` at GitHub Pages yet.** The domain currently
resolves to HubSpot, and the meetings scheduler embedded on `/call` and
`/client-call` loads from `https://revhops.com/meetings/revhops/…`. Moving the
apex record to Pages takes that path with it and both booking pages break.
Either move the schedulers to their `meetings.hubspot.com` equivalents first,
or launch on a subdomain. This wants deciding before launch, not during it.

Not done yet: the custom domain, Open Graph and Twitter tags, canonical tags,
`sitemap.xml`, `robots.txt`.

## Brand reference

| Token | Hex | Use |
| --- | --- | --- |
| Navy | `#304157` | Primary. Carries the brand. |
| Deep | `#1C2635` | Hover states, deepest surfaces. |
| Slate | `#6B7A93` | Secondary text, labels. |
| Mist | `#C6D3E0` | Light surfaces, section alternation. |
| Warm | `#F2C39B` | Accent only. A rule, a figure, a single word. Never a background. |
| Paper | `#FAFAF8` | Page background. |

Ubuntu for headings and navigation, sentence case, never title case. Lato for
body copy. One gradient disc per surface, bled off an edge. The logo is navy on
light, never reversed and never on a gradient.

Discs are positioned past the screen edges deliberately, so `main` carries
`overflow-x: clip`. Three things about that rule are load-bearing: it must be
on `main` rather than `html`/`body`, because overflow on the root propagates to
the viewport and breaks the sticky nav; it must be `clip` rather than `hidden`,
so no scroll container is created; and it must be x-only, so `.section-bleed`
can still bleed its disc upward into the nav band.

**Radii**

```css
--radius-sm:   7px;   /* chips, tags */
--radius-btn: 10px;   /* buttons, nav items */
--radius-card: 12px;  /* cards, panels, framed surfaces */
```

Nothing is fully pill-shaped.

**Departures from the brand doc**, all requested:

- Nothing is pill-shaped. Buttons are 10px, chips 7px, cards 12px. The doc
  specifies pill buttons and a 3px rectangle radius.
- All headings are Ubuntu Bold 700. The doc specifies Medium 500 for H2 and H3.
  Tracking is tightened to compensate.
- Navigation is set in Ubuntu, not Lato.
- The nav has two states, and at rest it has no surface at all, so the hero's
  gradient disc runs straight through it to the top corner of the screen.
- The disc bleed is handled by `.hero-bleed`, a clipping box inset `-74px` at
  the top so discs spill over the nav band and off the screen edges, but never
  into the section below the hero.
- The footer uses the white lockup (`revhops-logo-white.png`) directly on navy.
  This is the supplied white artwork, not the navy logo reversed in CSS. The
  same holds for both partner marks in the badge slot: HubSpot ships the
  reversed Platinum badge, and `pipedrive-partner-badge-white.webp` is their
  green Authorized Partner badge with the box dropped. No CSS filter fakes
  either one.

## Components added for the inner pages

All of them sit in `site.css` immediately before the dark theme block.

| Class | What it is for |
| --- | --- |
| `.to-white` | The paper-to-white drift done by one section instead of two. Every page that is not the homepage has a single section between its last content and the close, and the close paints white across its bleed — landing that white on paper leaves an edge. |
| `.prose` | Terms and privacy. A 72ch measure, headings and paragraphs, no components. |
| `.form` `.field` `.form-foot` | The contact form. Labels above fields, plate tokens so it inverts with the theme, and deliberately **not** inside a card. |
| `.figs` `.fig` | The three counted numbers on a case study, on navy. The only type on the site set larger than an H1. |
| `.svc-list-plain` | `.svc-row` with three columns instead of four, for row lists with no timing column. Inherits the whole hover — the fill that bleeds past the text, the title stepping in, the arrow sliding. |
| `.pcards` `.pcard` | The frosted card with chips that replaced every dash-bullet list on the inner pages. Same `--card-veil` surface and blur as the homepage stage cards, so the inner pages are built out of the homepage's own parts. `auto-fit` columns: three across on a laptop, more on a wide display, one on a phone, no media query per layout. |
| `.statement` `.cols-2` | A short sentence set large, with the detail beside it in two columns. One statement per page — a second one stops both working. |
| `.hero-meta` | The facts line under a hero headline. |
| `.grid-3` `.ticks-2` | Three text blocks across, and a ticked list in two columns. |
| `.meet-wrap` | A measure for the meetings embed. Adds no border, plate or shadow: HubSpot draws its own chrome inside the iframe. |

## Unused but kept

`.pill`, `.btn-light`, `.section-bleed` and some of the `.gap-*` utilities are
design system rather than page code, and nothing references them yet.
Everything else belonging only to a deleted page was stripped.
