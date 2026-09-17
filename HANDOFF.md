# RevHops site — handoff

Read this first, then `README.md` for the mechanics. This file is the state
of play; the README is how the thing is built.

**Folder:** `~/Downloads/Claude/revhops.com` — this folder *is* the site.
**Deadline:** live by 14 September 2026.
**Current build stamp:** `de867ab06e` — derived from a hash of the assets by
`tools/build-pages.js`, so it cannot go stale and nothing has to be typed

---

## Read this before you trust anything below about git

**This folder became a git repository on 9 September.** Branch `main`, one
commit, 72 files tracked, `tools/node_modules` and `.DS_Store` ignored. So:

- **there is a revert now**, from that commit forward.
- **nothing before it survives.** Everything deleted on 4 September — the
  seven other pages, their CSS, the first dark theme, the mobile testimonial
  rail — is still gone. Where the text below says "it is in git history",
  read it as "it is gone".
- **nothing is deleted casually.** The orphaned hop images are still on
  disk for exactly this reason.
- **there is no remote yet**, so the Pushing section at the end still does
  not work as written. See "Deploying to GitHub Pages" in the README.

---

## 17 September, third pass: /about out of the chrome, values everywhere

James is not sold on /about. The page still exists and is still built;
nothing in the chrome points at it any more.

- **/about is off the site entirely.** `about` is still defined in
  `build-pages.js` and still edited like any other page, but it is not in
  `PAGES`, so `about.html` is no longer written, and the built file was
  deleted. Nothing serves /about, so there is nothing to find. Putting it
  back is adding `about` to `PAGES`, rebuilding, and restoring the two nav
  and footer entries. Its line came out of `llms.txt` as well.
- **/about is out of NAV_ITEMS and out of the footer's Company column.**
  Company is Pricing, Contact, Schedule a discovery call, the last one new.
  The homepage carries its own copies of both, so they were edited by hand
  there as well.
- **"How we hop-erate" is a shared section now**, `hoperate()` in
  `build-pages.js` over a `VALUES` array: /about, the homepage after "Small,
  by design", and /services after the case study rail. index.html is not in
  PAGES, so its copy of the markup is by hand and has to be kept in step.
- **The card labels are set in caps and warm**, on `.pcards-values
  .pcard-n`. The accent `#F2C39B` is 1.6:1 on white, so a new `--warm-ink`
  token carries it on the paper: `#9E6433`, same hue, 4.86:1 on white. In
  dark the cards sit on navy and the token resolves back to `--warm`. The
  numbered cards on /newsletter keep the muted grey. Smoke recomputes the
  contrast from the stylesheet.
- **Footer: "Schedule a call"**, not "Schedule a discovery call".
- **The cards lost their numbers and their chips.** One / Two / Three became
  Approachable experts, Professionally, light-hearted, Candid guides, and the
  two tags at the foot of each card are gone.
- **The "About us" link under "Small, by design" is gone**, and that
  paragraph lost `.small`, so it is set at body size like every other
  paragraph on the site.
- `tools/smoke.js` gained checks for the section order, the three labels, no
  chips, no /about in the nav or footer, and the call link in the footer; the
  highlight count went from four to five with the new section head.

## 17 September, second pass: the team section

- **The homepage link under "Small, by design"** reads `About us` and points
  at `/about` rather than `#team`.
- **/about's Meet the team is two columns**, `.team-split`: the team grid on
  the left at 420px, the homepage's "Small, by design" copy and ticks on the
  right under an `h3`. One card no longer leaves two thirds of the shell
  empty, and more people fill the left column without touching the copy.
  Single column under 900px, card first.

## 17 September: five stage forms, smaller case cards, /about reordered

**The hero's signup is five forms now, one per stage**, so HubSpot can tell
which stage someone asked about and a workflow can send that stage's PDF.
Ids are `stage-form-startup`, `-scaleup`, `-growth`, `-maturity`,
`-enterprise`. Built for HubSpot's non-HubSpot form capture, whose rules
drive every choice:

- **Static markup in `index.html`**, inside the maturity mount in a
  `[data-stage-forms]` wrapper. `build()` in `maturity-slider.js` lifts the
  wrapper out before its innerHTML wipe and moves the forms into
  `.mcard-col`. Moved, never re-rendered, so HubSpot's bindings survive.
  `renderCards()` shows the current stage's form and hides the rest.
- **No script on submit.** Each form really submits (GET, since GitHub Pages
  405s a POST) into its own hidden iframe, `stage-sink-<stage>`, loading
  `assets/stage-sent.html`, an empty noindex page with no tracking code. The
  slider listens to the iframe's load and swaps in "Check your inbox - it's
  on the way!" at the fields' height.
- **No hidden stage field**; HubSpot ignores hidden fields. The form's id is
  the stage.
- **HubSpot side, still to do by James:** Settings > Marketing > Forms >
  Non-HubSpot forms on; submit each stage once on the live site so the five
  appear; then a workflow per form. Nothing here posts until the site is live
  with the tracking code.
- New `stage forms` block in `tools/smoke.js`.

**Case study rail cards are 20% smaller**: `.case-card` width
`clamp(335px, 32.5vw, 429px)` to `clamp(268px, 26vw, 343px)`. That is the
homepage and /services rails; /case-studies and the hub pages set their own.

**Homepage "Small, by design"** gains a `Meet the team` text link under the
ticks, to `about#team`. `section()` in `build-pages.js` takes an optional id
for that.

**/about**: the portrait and "The shop I wish I could have hired" are gone.
It runs head, How we hop-erate, the logo marquee, Meet the team. LinkedIn is
`ricksjrr` and the bio says 12 years.

Rebuilt; `smoke.js`, `resources-smoke.js` and `hubs-smoke.js` all pass.

## 17 September: search on /resources

**A search box sits at the right-hand end of the filter pill row** on a wide
screen, and takes its own full-width line under the pills below 860px. It is
built in `resFilter()` in `tools/build-pages.js`, styled in the type filter
block of `site.css`, and runs inside the filter module in `site.js`.

- **It hides cards, not shelves.** A card shows when it contains every word
  typed (title, copy, fact line, case study meta rows, shelf name; not the
  "Open" / "Watch" line). Case, accents and curly apostrophes are ignored. A
  shelf with no matches left hides.
- **It works inside the chosen pill.** Nothing found inside one shelf offers
  "Search all resources"; nothing found anywhere offers "Clear search".
- **Teaser shelves now render every card.** Cards past the first four carry
  `data-res-extra hidden` and only show as search results, so a case study
  behind the See-all link can still be found. The resources smoke test
  counts shown cards now rather than cards in the markup.
- **A paged shelf's pager steps aside** while a search runs and returns on
  page one when it clears (`revhops:res-search` event).
- Covered by new checks in `tools/resources-smoke.js`.

## 16 September: hub case study centred, homepage case card clickable

- **Hub pages.** `.hub-case` in `site.css` is now `card | minmax(0, 600px)`
  with `justify-content: center`, and the lede inside it drops its 62ch cap,
  so the card and copy sit as one group with equal space either side
  (measured 184px / 184px at 1440 wide). Markup from `hubCase()` unchanged.
  Mobile (single column) is as it was.
- **Homepage maturity slider.** The whole "Case study for a similar team"
  card now opens the story. A stretched link: `.mcard-case` is
  `position: relative` and `.mcard-link::after` covers the card, so the
  title, copy and photo all click through while the one `<a>` stays the only
  focusable element. Hovering the card also warms the link and nudges its
  arrow. CSS only; `maturity-slider.js` untouched.
- Rebuilt; `smoke.js`, `resources-smoke.js` and `hubs-smoke.js` all pass.

## 16 September: service page 'What you get' cards, new copy and line art

James' CSV (`Claude outputs/services-what-you-get.csv`) replaced the three
`leave` entries on all five service pages in `SERVICES` in
`tools/build-pages.js`. Straight apostrophes became `&rsquo;`, `&` became
`&amp;`, and "We'll have a bi-weekly standups" lost its stray "a".

- **The dashed wells are gone.** Each `leave` entry carries an `art` key;
  `pcard()` renders it as `.res-thumb.pcard-thumb.is-art` with the drawing
  from `ART`, so it is the resources shelf's plate and ink, dark theme
  included. `media: true` without `art` still gives the empty well.
- **Eleven new drawings in `ART`**, same 240x260 box and 3.6 stroke:
  `assessment-call`, `flowchart`, `solution-doc`, `crm-love`, `manual`,
  `training`, `hubspot-badge`, `revops-bulb`, `unlimited`, `standups`,
  `hourglass`, `ranked`.
- **Shared drawings.** `flowchart` is on both Solution design (RevOps
  flowchart) and Lead to cash (Complete flowchart). The two retainers, HubSpot
  support and RevOps consulting, share `unlimited` and `standups`.
- **Second pass, same day.** `standups` lost the repeat arrows under the
  board and was re-centred. The shared `expert` headset drawing was split in
  two: `hubspot-badge` (a rosette with a gem and five filled stars under it)
  on HubSpot support, `revops-bulb` (a light bulb giving off dollar signs, no rays) on
  RevOps consulting. James asked for HubSpot's sprocket first; it is their
  logo, so the badge is an invented one, not HubSpot's partner badge. The
  real badge files are in `assets/img/` if that is ever wanted instead.
- Rebuilt; `smoke.js`, `resources-smoke.js` and `hubs-smoke.js` all pass.

## 16 September: the two games, rearranged

James' list, all in `puzzle` and `hop` in `tools/build-pages.js` and the
`.pz-*` / `.hp-*` blocks in `site.css`.

- **More room under the header.** `.pz-section` and `.hp-section` padding-top
  went from `clamp(8px, 1.4vw, 20px)` to `clamp(32px, 4vw, 60px)`.
- **Instructions sit under the stats.** On /puzzle `.pz-help` moved in the
  markup to straight after `.pz-stats`; on /hop `.hp-top` is a column now, so
  the help drops under the stats instead of sitting at the far right.
- **The Unscrambler is one centred group on desktop.** `.pz` is
  `minmax(0, 540px) auto` with `justify-content: center`, so the panel is its
  content's width and the board and panel centre together.
- **On mobile the picture preview and "Try a different picture" centre.**
  Under 900px: stats, help, board, preview, link, in that order.
- **Both end dialogs** now run Play/Run again, a line, then the call button:
  "Need help unscrambling your RevOps processes?" and "Keep getting knocked
  down by RevOps requests?" (`.pz-win-ask`, `.hp-over-ask`). The old
  `.btn-row` wrapper is `.pz-win-actions` / `.hp-over-actions`.
- **No focus ring on the again button.** The dialog focuses it on open and
  the 2px navy outline read as a border round a navy button.
  `.pz-win .btn-primary:focus-visible` and `.hp-over` twin set
  `outline: none`. Asked for; it trades away the keyboard ring on that one
  button.

- **No warm ring round the Unscrambler board.** `.pz-board.is-solved` lost
  its 4px `--warm` ring, light and dark; the board shows solved at rest, so
  that ring was on screen before every game.
- **"All games" above both titles**, the same `eyebrow` back link the
  resource and service pages use, pointing at `/resources#games`.

Verified with all three smoke suites and headless Chromium at 1440 and 390.

## 16 September: /pipedrive, rebuilt on /hubspot's layout

Same five parts as /hubspot, in the same order: the header with the partner
badge in the mark column, "What you get out of the box" (six cards, chips
gone), the tool clump, a trial section where /hubspot has its review, and
"How we help teams with Pipedrive". The co-branded banner at the top and
"Which plan you actually need" came out; `PD_PLANS` went with them.

- **The badge is not the green box any more.** In the mark column it read
  as a sticker louder than the H1. It is Pipedrive's artwork with the box
  dropped: `pipedrive-partner-badge-navy.webp` on light (the footer's white
  file, recoloured) and the white file on dark. `pageHero()` takes
  `srcDark` for that, and `rel` so the link can say `sponsored`. Capped at
  340px on desktop. If Pipedrive's brand rules object to the recolour, swap
  in whatever single-colour version they supply.
- **There is no Pipedrive partner profile**, so the badge links to the
  affiliate trial, James' call.
- **The trial section** carries the partner status in words ("certified by
  Pipedrive in sales and customer support", which is what Authorized requires),
  the trial button, the affiliate disclosure beside it, and the banner.
- **The header** is /hubspot's pair: audit as an arrow link, the call as the
  one button. The trial is no longer in the header.
- **The clump drops Pipedrive, HubSpot and Salesforce.** `toolClump()` now
  evens the rows when a skip leaves them more than two apart; /hubspot (6
  over 8) and the homepage are unchanged.
- The page's one highlight moved to "out of the box".

## 16 September: the six hub pages, cut down

James' brief, all six pages at once since they are one template (`hubPage()`
in `tools/build-pages.js`):

- **Gone:** the heading and subheading over the six cards, "Which tier you
  actually need", "Where we usually find it broken", and the chips inside
  every card. The data went too (`head`, `sub`, `tiers`, `wrong`, `chips`);
  it is in git before this change if wanted.
- **The audit ask in the header is an arrow link now**, and it points at
  `/audit`. It was a second button going to `/contact`, the last audit link
  on the site that did not land on `/audit`.
- **A case study sits under the cards**, from `caseStudy` on each hub, a slug
  in `CASES`. The card is the picture only, then the client name, the lede
  from its page and "Read the story". James' picks: Sales, Revenue and
  Service to Ignite, Marketing to Woodside, Data and Content to Core Income.
  Ignite is the fallback. A bad slug stops the build.
- **The pages now carry no warm highlight.** It lived in the cut heading.
  `tools/hubs-smoke.js` allows at most one rather than exactly one.

CSS is one `.hub-case` block at the foot of `site.css`, tokens only. Checked
in headless Chromium at 1440 light and dark and at 390.

## 13 September: prices, hub pages, and two more phone fixes

- **A monthly price is `$3,500/mo`**, not "$3,500 a month", everywhere it
  is written — the two retainer service pages and the three cells on
  /pricing. The meta label on a ranged price is **"Starting at"** rather
  than "From"; the test behind it still accepts either prefix in the data,
  so an entry written either way lands on the same row.

  ONE THING TO KNOW: on /pricing the unit needed to go INLINE. "Fixed
  price" is a caption about the number and belongs under it; "/mo" is part
  of the number and belongs on it, and stacked it read as a stray fragment
  where "a month" never did. Anything starting with a slash gets
  `.is-unit` and rides the figure.
- **"The other five hubs" is gone from all six hub pages.** Five cards at
  the foot of every hub page pointing at the other five is thirty links
  whose whole job is to send you somewhere else at the moment you have
  finished reading. The back link at the top now says **"All hubs"** and
  goes to the grid of all six, which is the one place that list belongs.
  `.to-white` moved up to the ask, since the closing panel bleeds into
  whatever is last. The hub check lost its other-five assertions and gained
  two better ones: exactly one card grid on the page, and a back link that
  says "All hubs" and does not point at the page it is on.
- **The mark's caption is one line.** The 26ch cap wrapped it, and the media
  column's own 300px cap is what it was wrapping inside. On a phone the
  column goes full width and the BADGE takes the cap instead, so the caption
  has the whole shell: about 225px of text in a 280px column at the
  narrowest phone. The gap above it came down to about 6px, which reads as
  ~40 because the badge artwork carries its own margin.
- **"All case studies" sits where "All services" sits.** `.cs-head` does
  not run up under the nav the way `.page-hero` does — the plate has a hard
  top edge — so its padding is measured from the bar rather than from the
  top of the screen, and the link was landing 21px lower. 53px at phone
  width puts all three page types on 142.

---

## 13 September: /audit's aside

The two CTAs end flush with the row's right edge now, and the descriptions
are set tighter.

The link column is ONE width for both rows, because the list is a subgrid
and that track is `max-content` — the longer of the two labels. That is what
lines the descriptions up, and it is also what left "See more" starting at
the same x as "Tell us what you have got" and stopping well short of the
edge. Right-aligned inside the track, both end on it. /hubspot's rows are
not a subgrid, so each auto track is exactly its own label's width and they
were already flush — this is scoped to `.audit-aside` and changes nothing
there.

The leading goes to 1.45 from the list's 1.6. These two sit in a narrower
column than /hubspot's rows and run to three lines rather than two, and at
1.6 a justified three-line block reads as three separate lines rather than
as a paragraph. Both revert at 820px, where the row is one column and there
is no track to be flush with.

---

## 13 September: the phone pass, from a real handset

James went through the site on a phone. Most of what came back was one bug
wearing several hats — **a media query adds no specificity**, so a phone
override written as a bare class loses to a desktop rule that happens to
carry a pseudo-class or to sit lower in the file. Three separate symptoms
turned out to be that.

### The header that hung off the screen

THE ONE HE OPENED WITH, and the one worth remembering. The maturity
headline is two `nowrap` blocks, sized off `vw` so the longer of them just
clears the gutters — that is what guarantees the break after "your" at every
width. On a phone the line does not fit, and because it is `nowrap` the
BLOCK grows past the shell rather than wrapping. `.mat-head` ends up wider
than the page, the centred lede centres inside that wider box, and the whole
header sits off to the right with the title clipped. It reads exactly like
"squished and right-justified", which is what it was.

Under 760px the two halves go inline and the headline wraps like ordinary
type. Three lines on a phone is fine; a header hanging off the screen is
not. The markup already has a space between the spans, so they join cleanly.

**This is why the earlier hunt for it found nothing.** `scrollWidth` is
still the viewport — something up the tree clips — so an overflow check
passes. Measure the ELEMENT against the shell, not the document.

### The specificity three

- **The quadrant's orphan rules.** `.quad-cell` in the phone block lost to
  `.quad-cell:nth-child(3)` above it, so cells 1 and 3 kept the vertical
  hairline meant for the 2x2 and two cells kept a zeroed padding. Now
  `.quad > .quad-cell`, which ties on specificity and wins on order.
- **The marquee's phone height never applied.** That block sits ABOVE
  `.logo-run img`'s own rule and ties with it, so the height lost on order
  and the marks stayed at the desktop clamp's 61px floor — the 74px in that
  block had never once rendered. Moved to the phone block at the end of the
  file and raised to 96px. One rule, so the homepage, /services and /call
  all match.
- **The centred heads went left.** The phone rule caught every `.sec-head`,
  including the nine that are deliberately centred because the thing under
  them is — the tool clump, the booking widget, the audit form. Scoped to
  `.sec-head-left`, which is exactly the class `secHead(..., 'centred')`
  omits, so the two stay in step by construction.

### The rest

- The proof heading breaks after "with", both halves `nowrap` so it can
  never take a third line. Measured at 320px, where the head is at its
  1.7rem floor: the longer line runs about 240px inside a 280px column.
- No line art on the featured card. The overhang is what earned it its
  space, and there is no overhang once it is stacked under the copy.
- /hubspot: the partner profile link moves up under the badge, and the
  screenshot and its link come out of the review block. `media` takes a
  `note` for that, shown only under 900px. **It is a block, not an
  inline-flex** — as a flex container the text became one anonymous item
  taking whatever width was left after the arrow, so it wrapped to two lines
  with the arrow parked out to the right of them.
- The badge sits between the two sections rather than against the one below
  it: the space above is `--sec-pad` and the space below is the header's own
  bottom padding plus the next section's, each half of it.
- A case study loses the dashed logo well — a hole where the client's mark
  will be, at the top of the page, before anything has been said — and the
  rule under the meta row gets a beat under it.
- The header meta row sheds its fourth item: Type on a service page, which
  repeats the page you came from, and Commitment: None on /audit. Both are
  the last child, so one rule covers them. `.meta-long` does the same job
  inside a value and today wraps "business" in /audit's turnaround.

---

## 13 September, fifth pass

**The gated page leads with a picture of the resource.** A screenshot of the
ROI calculator replaces the one-line statement in the left column, with the
paragraph under it. Somebody who has landed on a form wants to know what
they are filling it in for, and a picture of the spreadsheet answers that
faster than a sentence about the spreadsheet does. The line is still in
`gateLede` and is still doing its other job as the page description.

`gateShot` is the new field on a resource; a gated page without one falls
back to the statement, which is what all of them looked like before. The
shot gets the same treatment as the partner directory shot on /hubspot: it
brings its own white ground, so a hairline and a radius rather than a bare
rectangle. No hover — this one is not a link.

ONE TRAP WORTH KNOWING: `.statement-note` is only ever styled as
`.statement + .statement-note`, so swapping the statement out silently took
the paragraph's type with it. The type is repeated on
`.res-gate-shot + .statement-note` rather than loosened on the base
selector, because `.statement-note` is used on other pages and those are not
this change's to alter.

---

## 13 September, fourth pass

- **The featured card is centred in the shell**, not left-aligned. The 15%
  now comes off both edges. Left-aligned it read as a card that had slipped,
  because all of the gap it left was on one side.
- **The gap under /hubspot's header is the site's gap again.** That header
  is the only one that carries a bottom padding of its own — the badge's
  overhang — and left alone that was simply added to the next section's
  `--sec-pad`, so the page ran 40px longer than any other before its first
  heading. `.page-hero-markhead + .section` subtracts it back. The badge
  stands in the space rather than pushing it open, and the distance from it
  to the heading is about 64px at 1440.
- **An orphan CSS selector is gone.** `.reveal .reveal.is-in` sat above
  `.rail` with no block and no semicolon on it, which glued the two together
  and turned `.rail` into `.reveal .reveal.is-in .rail`. Nothing uses a bare
  `.rail` today so it broke nothing visible — but it would have quietly
  eaten the next rule anybody added there. It predates this session.

### Open — cannot reproduce

**James reports the homepage's maturity section is "squished and
right-justified".** Measured on the built file at 390, 600, 700, 745, 770,
790, 820, 880, 900, 1000, 1024, 1100, 1280, 1440, 1512, 1536, 1680 and 1920,
at 720 / 760 / 860 / 900 / 1000 tall, on all five stages, and at five scroll
positions: `.mat` and `.mcards` are the same box as `.shell` every time, the
three card columns are equal to a pixel, and nothing carries a transform.
No console errors from the page's own scripts.

So it is something not in the built file: a stale stylesheet, a specific
browser or zoom level, or the deployed copy, which is several commits
behind. Needs a screenshot and a window width before it is worth chasing
further.

---

## 13 September, third pass

- **The featured card is 15% narrower than the shell** and left-aligned in
  it. At full width it was a band across the page with its copy running to a
  60% measure of something very wide. Left-aligned, not centred, because
  every heading and card below it starts on the shell's left edge. The
  drawing is positioned off the card, so the overhang came in with the right
  edge and nothing else had to move. Below 900px the cap comes off: the
  shell is already the narrow measure there.
- **Both games are renamed**: The RevOps puzzle is **RevOps Unscrambler**
  and The RevOps run is **RevOps Runner**. Titles, `<title>` tags and the
  runner's `aria-label` all follow. The `ART` keys stayed `scramble` and
  `hopper` — internal, and not worth the churn.
- **No format tag on the games cards.** Both said "Plays in the browser" in
  the corner, under a heading that says Games, on a website.
- **The HubSpot review leads and the screenshot follows it**, swapped on the
  grid, and the proof column is 20% narrower. The shot fills its column, so
  the picture is sized by the grid rather than by a width on the image and
  the link under it stays flush with its left edge. The reveal directions
  swapped with the columns.
- **/hubspot's title sits where /services' title sits.** The shared header
  centres its two columns on each other, which is right for a photograph
  running the height of the band and wrong for a badge: it left this one
  page's title 44px lower than every other page's. `.page-hero-markhead`
  top-aligns the columns and takes `.page-hero-nomedia`'s extra 30px, so the
  two pages open on the same line at every width — measured at 1440, 1200
  and 1024, h1 and lede both to the pixel.

  The badge is a third taller than the band by design and centred, so it
  overhangs about 28px at each end; at the bottom it was crossing into the
  section below. The header now carries a bottom padding that is that
  overhang and nothing more. **Re-measure if `.is-big`'s percentage
  changes.** The badge does not move down so much as hold still while the
  copy rises — the same picture, one fewer number to keep in step.

- **The RevOps Runner card carries a frame of the game**,
  `assets/img/game-runner.webp`, cropped to the shelf's 16:9 off the bottom
  of the shot so the hare and the ground survive. `thumb` and `art` are
  alternatives and thumb wins, so `art` came off that entry. The hare
  drawing is still in `ART` and is unused today, kept because it is the pair
  to the Unscrambler's tiles and the featured slider may want it back.

---

## 13 September, second pass: James' notes on both pages

### /resources

- **The whole featured card is the link.** It was an `<article>` with one
  clickable line in it, which is a card the size of a billboard with a
  target the size of a sentence. The slide is an `<a>` now and "Read the
  case study" is a span that looks like the link it used to be.
  `site.js` had to change with it: on this markup the slide IS the link, so
  looking only INSIDE a hidden slide for things to take out of the tab order
  finds nothing and leaves two invisible cards Tab-reachable. Both shapes
  are handled there and in the check, so the markup can go back either way.
- **Each featured card names its type** — Case study, Downloadable, Game —
  in a pale chip above the title, `kind` in `FEATURED`.
- **"FEATURED RESOURCES" sits above the card**, so three rotating cards at
  the top of a page of cards read as a set rather than as the first shelf.
  The dots alone were not saying it.
- **The shelf order is James' order**: Downloadables, Case studies, Blog,
  Videos, Games. It is the order of `RESOURCE_TYPES` and nothing else —
  the page, the filter pills and the `.to-white` on the last shelf all
  follow it.

### /hubspot

- **The What is HubSpot section is out**, one day old. `assets/img/
  hubspot-logo-white.webp` went with it; it existed only for that block.
- **The lede** is "An all-in-one, best-in-class platform that unifies sales,
  marketing, support & finance in one spot."
- **The audit is on the left, the call on the right**, centred on each
  other. `.text-link` carries `align-self: flex-start` of its own, which
  outranks `.btn-row`'s `align-items: center` and was sitting it 14px above
  the button's centre — overridden for text links inside a button row, with
  a little more air than the row's 12px so the arrow is not pointing at the
  button.
- **The Platinum badge is a third bigger and links to the partner
  directory.** It is height-bound by the media column, so `is-big` stops the
  clip (a contained mark on the page ground never needed it) and lets the
  artwork run to 133%. Centred, so the extra falls half above and half below:
  29px each way at 1440, clear of the nav and inside the next section's own
  top padding. Re-check both if the band's height changes. `media` now takes
  `big` and `href`; the link must fill the column or the badge's percentage
  max-height resolves against a box sized by its own content, which is
  nothing.
- **The review section is two columns**: a screenshot of the directory
  listing on the left with the profile link under it, Amy's review on the
  right. THE SCREENSHOT IS THE ARGUMENT — 5.0 from ten ratings, all five
  stars, the Platinum chip under our own name — so the "Every review is five
  stars" sentence came out. Saying it in words and then showing the page it
  comes from was saying it twice.
- **The stars moved below Amy's name and title.** Over the quote they read
  as decoration on the heading; under the attribution they read as her
  rating, which is what they are.
- **The section is tighter than the page's rhythm**, `clamp(38px, 4.2vw,
  60px)` rather than the standard block. One quote in two columns does not
  need the air a full-width block does.

`tools/resources-smoke.js` gained five more assertions: every slide is
itself one card-wide link, every slide names its type, something marks the
slider as the featured set, and the shelves and the filter pills are both in
the declared order.

---

## 13 September: /resources and /hubspot

Two pages, one session. Both are generated, so everything below is an edit
to `tools/build-pages.js`, `assets/css/site.css` or `assets/js/site.js` and
none of it is in the HTML.

### /resources

**The featured card is a slider now.** Three resources instead of one, on a
fifteen second rotation with three dots underneath: the Ignite Group case
study, the Marketing Hub ROI calculator and the RevOps puzzle. Edit
`FEATURED` in `build-pages.js`; the `featured: true` flag that used to sit on
one entry in `RESOURCES` is gone, because the slider is its own short list
rather than a flag on a longer one.

The three slides are stacked in ONE GRID CELL, not laid out in a row. That is
what keeps the card as tall as the tallest of the three so it does not resize
under the reader mid-rotation. The two that are not showing keep their space,
which is why `site.js` has to take their links out of the tab order by hand.
Without the script the first slide is already `.is-on` in the markup and the
dots are inert, so nothing is ever blank.

The timer pauses on hover and on focus inside the card, and stops for good
once a dot is clicked.

**The card wears the case study plate.** Mist, the soft white scrim and
`start-panel-bg.webp`, exactly as `.cs-head-panel` does, replacing the warm
peach ramp. /resources and a case study now open on the same object, which is
the point — the featured card most often points at one. The contrast
measurement is unchanged because it is the same artwork at the same crop.

**Nothing on the card but four things**: title, one line, the link and the
drawing. The kind-and-format line in the corner (`Game · Plays in the
browser`) is gone.

**THE LINE ART.** Four inline SVGs in `ART` in `build-pages.js`, all in one
240x260 box with a 3.6 stroke: a case study page, a calculator, the puzzle's
3x3 of 12-radius tiles, and the hare mid-leap for the run. Inline rather than
four files because each is used at two sizes on two grounds and `currentColor`
does the theme swap.

On the featured card the drawing is pinned to the card's BOTTOM edge and is
taller than the card, so it climbs out over the top into the header above.
Height drives it and the width falls out of the box's aspect ratio, which is
how it stays near a third of the card at every width. **Nothing in that chain
may take `overflow: hidden`** or the overhang vanishes silently.

On the dark theme the overhang leaves the light plate and lands on a navy
page, where pinned navy ink is invisible. Two tight `drop-shadow` filters in
paper give every stroke a light edge; they hug the line rather than pooling
behind it, and over the light half they fall on paper-coloured ground and
cannot be seen. A wash behind the drawing was tried first and read as a
smudge — it has to end somewhere, and wherever it ends is a line across the
card.

Below 760px the drawing drops under the copy and centres inside the card.

**No subheads on the shelves.** The five `sub` lines came out of
`RESOURCE_TYPES`. `resShelf` still renders one if a type has it.

**Case study cards carry their meta as tags.** The same four rows the case
study's own meta column lists — services, tools, industry, team size — read
out of the same arrays, in the same order. They replaced the figures, which
were `00%` and `[measure]` on four of the five. The service label in the
bottom corner went with them: services are the first tags in the row now.

**Card hover is /pricing's hover.** Mist edge, 4px lift, the deep soft
shadow. It was a full-strength navy border, which read as an outline snapping
on rather than a card lifting.

**One real video, one real download.** The six bracketed video cards and the
gated video are gone; the shelf is the INBOUND 2025 Dharmesh Shah keynote,
`pPQngmSEIe0`, opening in the existing lightbox. Its thumbnail is YouTube's
own by URL — **the one external image on the site**, deliberately, so the
still stays the video's still. Set `thumb` to a local crop if that ever
matters more.

The eight bracketed downloads and the gated download skeleton are gone too.
The shelf is the Marketing Hub ROI calculator, gated, at
`/resources/marketing-hub-roi-calculator`.

`resources/gated-video.html` and `resources/gated-download.html` were
**deleted**, not left behind: nothing generates or links to them now.

**The gate works.** The landing page carries a real four-field form with the
browser's own validation, and on submit it goes to the resource's `redirect`
— for this one, the Google Sheet. The form's `action` is the same URL so the
no-script path still lands. **Nothing is stored and nothing is stopped**;
this is a gate in the sense that it asks. When the HubSpot form id exists,
the `<form>` is replaced by the embed and the SAME url goes in HubSpot's own
redirect setting. `redirect` stays in `RESOURCES` as the record of it.

**Both games have artwork** on their cards — the 3x3 for the puzzle, the hare
for the run — on a pale plate, because the ink is navy and the card's own
surface follows the theme.

### /hubspot

- **One button in the header.** The call is the ask and is the only navy box;
  the audit is a text link with an arrow beside it, which is what every other
  page does.
- **A "What is HubSpot?" section**, the homepage's About split with the mark
  on the left. Two files, one shown: `tools/hubspot.webp` on light,
  `hubspot-logo-white.webp` on dark, the nav's brand-base / brand-alt swap.
  The white file is the same artwork with every opaque pixel taken to white,
  so the two are in register. **No partner badge** — it is in the header four
  inches above.
- "We work across all six hubs" is now **"Certified experts in all 6 Hubs"**.
- **The tool clump off the homepage** sits under the hub cards, headed
  "Connect HubSpot to all the tools in your stack", with HubSpot's own mark
  dropped. `toolClump()` takes a `skip` list for that.
- **The reviews block is one review.** The sticky title beside a scrolling
  column was the tallest thing on the page and put twelve hundred words of
  praise between the reader and the four things the page wants clicked. It is
  now Amy's review — the one about a Marketing Hub implementation — centred
  on paper with the stars above it and the partner directory one link below.
  `.prof*` is gone from the stylesheet. `REVIEWS` is still in
  `build-pages.js` and is now unused.
- "Ways we can help" is **"How we help teams with HubSpot"**, and all four
  rows have James' copy and his CTAs: Request an audit (the homepage's own
  words for the audit), Schedule a discovery call, See how we do it, Retainer
  options.

### Checks

`tools/resources-smoke.js` grew eleven assertions: the slider's three slides
and dots, exactly one slide on before any script runs, hidden slides out of
the tab order, art on every slide, no fact line on the featured card, no
shelf subheads, tags on every case study card and no service in the corner,
and for every gated page that the form has a destination and the no-script
action agrees with it.

Two of its existing assertions were rewritten rather than left failing: the
placeholder check now passes on ZERO placeholders (it is guarding against a
placeholder that is also a link, not counting them), and the gated check no
longer hard-codes two items.

All three suites pass: `tools/smoke.js`, `tools/resources-smoke.js`,
`tools/hubs-smoke.js`.

### Still open on these two

- ~~The puzzle and the run are still called "The RevOps puzzle" and "The
  RevOps run"~~ — renamed on 13 September to **RevOps Unscrambler** and
  **RevOps Runner**. The `ART` keys are still `scramble` and `hopper`; they
  are internal and were not worth churning.
- The ROI calculator's gate is ours, not HubSpot's. See above.
- Case study 5 (Ignite Group) is the first featured slide and its page is
  still the template with bracketed copy.

---

## 12 September: the pass across the whole site

James sent a list of small changes page by page. They are small individually
and they add up to one idea: the site had grown three or four different
rhythms and two or three different ways of getting from one section to the
next, and the seams were the thing you noticed.

**One section rhythm, `--sec-pad`.** `clamp(56px, 6.4vw, 96px)`, in `:root`.
Every section carries it on both sides, so every band between two sections is
twice it, everywhere, on every page. `.section-tight` is now the same number;
so is `.case-section`, `.testi-section`, and the three overrides
`.svc-index` used to carry. **Every opening band gives a bottom padding of
zero** — `.page-hero`, `.page-hero-nomedia`, `.page-hero-svc`,
`.page-hero-legal`, `.cs-head` — so header-to-content is one `--sec-pad` and
section-to-section is two. If a section needs more or less air, change the
token, not the section.

**The drifts are gone.** `.fade-top`, `.fade-bottom`, `.to-white`,
`.to-white-1`, `.to-white-2` all still exist and all paint nothing. They
were ramps of white painted over the top or bottom of a section; on the dark
theme that is a ramp of white over navy, which is what James was seeing as
"weird gradients". The classes stay in the markup because they are written by
`build-pages.js` in a dozen places and removing them is churn, not a fix.

**The close lost its photograph**, and four other things went with it: the
430px bleed up over the section above, the white testimonial band the bleed
existed to land on, and the two dark-theme overrides that pinned the shout
and its button to light-theme colours because they sat on a light image. The
section is now type, one button, `padding-block: calc(var(--sec-pad) * .66)`
and no ground of its own. `start-panel-bg.webp` is still used, on the case
study header plates, which is where it earns its keep.

**The nav sentinel moved onto the page title.** `data-nav-clear` was on a
zero-height `.page-head-end` at the foot of the opening band on every page
but the homepage, so the bar stayed transparent for the whole header and the
copy scrolled up through the navigation links. It is on the `<h1>` now,
everywhere, and `NAV_CLEAR_PAD` in `site.js` adds the 12px that is the
difference between the resting bar's bottom edge and the floating bar's.
The `.page-head-end` divs are gone from `pageHero()`, `casePage()`,
`meetingPage()` and `/call`.

**The hero headline is two lines at every width.** Both halves are their own
block and both are `nowrap`, so it breaks after "your" and never takes a
third line; the size gives way instead, at `min(5.4rem, 8.6vw)`. The 8.6 is
measured: Ubuntu Bold at -.042em sets "Where are you at on your" at 9.93em,
so changing the words, the tracking or the face means re-measuring it.

**The stage cards.** Each stage now carries its own `cost` copy — the "What
it's costing you" block was one shared placeholder. The case study card
carries the client's own mark instead of the placeholder illustration: no
plate, no border, no radius, `object-fit: contain`, set back to `.72` and up
to full on hover. Ignite is the exception, as it is in the marquee — it is a
light disc with the wordmark knocked out of it, so it takes `data-solid` and
is neither multiplied onto the card nor flattened to white for the dark
theme. `assets/img/logos/ike.webp` is new: the artwork James sent, cropped to
its bounds, flattened to the same flat grey (#7B7B7B) the other marks use,
on a 300px transparent canvas.

**The tool marks in the dark theme go full colour with nothing behind them.**
This replaces the white-silhouette treatment and the white plate that
appeared on hover. It measures worse — HubSpot's orange is 1.16:1 on this
navy and the darker wordmarks (Marketo, NetSuite, Chargebee, Claude) are
close to invisible — and it is what James asked for; the plate was the
"paperplating" he wanted rid of. Salesforce has its own size tier,
`data-big`, 30% over `data-mid`.

**The five case studies are the five clients.** `CASES` in `build-pages.js`
carries real names and the homepage's figures, and the maturity slider links
to the same five slugs. The two lists are maintained by hand in two files —
`CASES` and `STAGES` in `assets/js/maturity-slider.js` — so a name changed in
one has to change in the other. `/case-studies` opens with the shared header
rather than the gradient plate, and a case study's own page carries an
"All case studies" eyebrow above the plate.

**Copy James wrote is now in one place.** The service rows on `/services`
are the homepage's descriptions rather than a second set. Five spellings were
corrected while moving them: *consulitng*, *Complimnetary*, *estabalished*,
*implemeted*, *uniuqe*.

**The smoke test is the spec, so it moved too.** Eleven checks described
things that were deliberately removed. They assert the absence now rather
than being deleted — "the photograph must not come back" is worth more than
no check at all.

**Still open:** `.cs-side` sticky offset. James asked for the fixed position
to start 80px sooner; it locks at `--nav-float-gap + 74px` = 94px, which is
2px below the floating bar, so there is no room below it without the bar
covering the column. Left where it is; the run-up is shorter now because the
header band above it is.

---

## 12 September: the six hub pages

**`/hubspot/sales-hub`, `/marketing-hub`, `/revenue-hub`, `/service-hub`,
`/data-hub`, `/content-hub`.** The six cards on `/hubspot` have pointed at
these URLs since that page was rebuilt and every one of them 404ed. They
exist now.

**One template, six times, and James asked for that.** Somebody comparing
Sales Hub against Service Hub is then comparing the product rather than
learning a second layout. The template is `hubPage()` in
`tools/build-pages.js`; the content is `HUB_PAGES` above it.

**HOW TO CHANGE ONE.** Edit its entry in `HUB_PAGES` and run
`node tools/build-pages.js`. A seventh hub, the day HubSpot invents one, is
one object in `HUB_PAGES` plus one in `HUBS` so it appears in the grid on
`/hubspot` and in the other-hubs grid at the foot of each page. The fields:

| field | what it does |
| --- | --- |
| `slug` | the URL and the filename. The `h1` is derived from it, so `sales-hub` becomes Sales Hub |
| `title` / `desc` | the `<title>` and the meta description |
| `lede` | the paragraph under the h1 |
| `head` | the first section head, and the one place the page spends its `.hl` |
| `sub` | the paragraph under that head: what the hub is, in our words, after HubSpot's |
| `features` | exactly six cards, each `{ title, copy, chips }` with three chips |
| `tiers` | the ticks list. Every tier plus a closing caveat line |
| `wrong` | exactly four failure modes, rendered as `.ticks-2` |
| `ways` | four `.svc-row` links out to the service pages |

The page order is fixed: what it does, which tier, where it goes wrong, what
we do, the other five hubs. The last section carries `.to-white` because the
closing panel bleeds up into it.

**NO PRICES, and this is deliberate.** Same call as `/pipedrive`. HubSpot
moves its numbers, seat and marketing-contact pricing moves with them, and a
stale figure on a page about being the expert is worse than no figure. Tiers
are described by what they are *for*, and a `.partner-note` sends people to
HubSpot's own pricing page. `tools/hubs-smoke.js` fails if a dollar figure
appears on any of the six.

**The tier names are HubSpot's and were current on 12 September 2026.**
Revenue Hub has no Starter tier, which is why its list runs to three items
rather than four. If that changes, the list is the only thing to edit.

**The chips are HubSpot's own feature names**, read off
`hubspot.com/products/sales`, `/marketing`, `/revenue`, `/service`, `/data`
and `/content`. That is the one part of these pages that can go *wrong*
rather than merely stale: a renamed feature makes the chip incorrect. Worth a
pass whenever HubSpot reshuffles the lineup, which it has done twice already
— Operations Hub became Data Hub, Commerce Hub became Revenue Hub. Card
titles and every line of prose are ours.

**"Where we usually find it broken" is the point of these pages.** Four
lines per hub, experience rather than vendor copy, and the one section
HubSpot would never write. No client is named and no figure is invented. If
anything on these pages is worth James' editing pass, it is these
twenty-four lines, because they are the only opinion on the page.

**The other-five-hubs grid reads `HUBS`**, the same array `/hubspot` builds
its six cards from, so the card copy cannot drift between the two places it
appears. Five cards in a three-column grid leaves a short second row, which
is what a filtered grid is supposed to look like.

**Verify with `node tools/hubs-smoke.js`.** Third suite in the folder, after
`tools/smoke.js` (homepage) and `tools/resources-smoke.js`. It checks that
all six exist and that `/hubspot` links at exactly those six, that the six
have not drifted apart (same section count, same cache stamp), one highlight
each, six unlinked feature cards with three chips apiece, two ticks lists,
four service rows, no dollar figures, no em dashes, no `hr`, every boxed
button going to `/call` or `/contact`, the last section carrying
`.to-white`, and every internal link resolving to a file that exists. That
last one is the check that would have caught these six pages being missing
in the first place.

**Verified in a browser this time**, headless Chromium at 1440 and 420
px, light and dark: no horizontal overflow at either width, the cards stack
to one column on a phone, `.ticks-2` collapses to one, and the dark theme
needed no exception of its own.

**`llms.txt` lists all six.** The nav and the footer are unchanged: six more
links in either would bury the ones that matter, and `/hubspot` is the way
in.

---

## 17 September: footer, Platforms column

**HubSpot and Pipedrive left Company for a new fourth column, Platforms**,
HubSpot first. Company is now About us, Pricing, Contact. Done in `footer()`
in `tools/build-pages.js` **and** by hand in `index.html`, as always.

**Desktop spacing is a flex row now.** `.footer-links` went from a 3-track
grid capped at 660px to `display: flex; justify-content: space-between`, so
the gaps between the four columns are equal and the row fills its cell. The
phone rules still switch it to a one-column grid; Platforms takes `order: 4`
there, so mobile reads Services, Resources, Company, Platforms, all centred.

**The address line reads "Based out of Phoenix, AZ".** Footer only; the
About page, Terms, Privacy and `llms.txt` still say Phoenix, Arizona.

**`.footer h4 a` now inherits font-size.** The linked headings (Services,
Resources) were picking up `.footer a`'s .9rem and sat smaller than Company,
which its own comment said should not happen.

## 11 September: /audit

**`/audit` is new**, and it is where every "request an audit" click on the
site now lands. Three of them existed before it and all three went to
`/contact`: the primary button in the `/hubspot` header, the first of the four
ways in on that page, and "Clean up the account you already have" on
`/pipedrive`. All three are repointed. `/contact` keeps its own form and its
own job.

**Its form is its own.** Portal `46722926`, form
`579026d7-b138-4813-a166-c3d970e76dae`, which exists so an audit request
arrives as an audit request rather than as a general enquiry. It is embedded
the way every other form on the site is — the `js.hsforms.net/forms/embed/`
script and an `.hs-form-frame` div — not the older `hbspt.forms.create` call,
so it picks up the same type and spacing as `/contact` and `/newsletter`.
Unlike the newsletter's, **this id is real**, so the page works today.

**The turnaround is a typed string.** A `.pill` under the nav says
`Turnaround 2–3 business days`, and the same figure is in the hero meta row
and in `llms.txt`. Nothing derives it and no test checks it. If the queue
gets longer, change it in the `audit` page object and in `llms.txt`, or take
the pill out. A stale promise at the top of the page is worse than no promise.

`.pill` and `.pill-dot` were already in `site.css` and were being used
nowhere. `pageHero()` in `tools/build-pages.js` takes an optional `pill`
string now, rendered above the H1; `/audit` is the only page passing one.

**It is free, and it says so twice** — the meta row and the third card of what
comes back — because `llms.txt` already promised a free portal audit and a
page that hedged on it would contradict the file. If it ever stops being
free, both change together.

**HubSpot first, with a two-row aside.** James' call. The six things we look
at are named the way HubSpot names them, and writing them platform-neutral
would have made all six vaguer. Pipedrive and everything else get two rows at
the bottom pointing at `/pipedrive` and `/contact`.

**The homepage slider link moved with it.** The first in-card link on the
maturity hero reads "Request a free tech stack audit" and pointed at the
scheduler, because both in-card links shared one `data-cta-url`. The audit one
now takes its own, `AUDIT_CTA` in `maturity-slider.js`, defaulting to `audit`
and overridable with `data-audit-url` on the mount the same way. The second
link still books a call.

**It is in the footer's Services column, not the nav.** The bar is at seven
items and the eighth was already ruled out when `/pipedrive` came up. That
means the footer link had to go into `footer()` in `tools/build-pages.js`
**and** into the hand-maintained copy in `index.html` — the usual two places,
or the homepage is the one page missing the link.

## 11 September: the footer, rebuilt

Four changes, all of them in `footer()` in `tools/build-pages.js` **and** in
the hand-maintained copy in `index.html`. Change one, change the other, or the
homepage is the one page that drifts.

**A third link column, Resources.** Blog, Case studies, Newsletter, Games.
Blog goes to `/resources/blog`, the HubSpot blog on this domain, in the same
tab; Games goes to `/resources#games`, the shelf that was already anchored. **Case studies, Resources, RevOps puzzle and RevOps run came out of
Company** on the same pass rather than being listed in two columns at once, so
Company is now HubSpot, Pipedrive, About us, Pricing, Contact.

The brand column gave up the width: `.footer-top` went from `1.1fr 1fr auto`
to `.82fr 1.75fr auto`, because at the old split "HubSpot support retainers"
and "Lead to cash mapping" each wrapped to two lines. Below 1040px the badges
leave the row and the two that remain split it `.68fr 2fr`, for the same
reason. On mobile the three columns stay two abreast and Resources spans the
row — a lone third column in the left half of a centred footer reads as a
mistake.

**The legal links moved onto their own line above the copyright**, centred,
with slashes between them. `.footer-bottom` is a column now. The slashes are
`<span class="footer-legal-sep" aria-hidden="true">`, because they are
punctuation and a screen reader saying "slash" three times helps nobody.

**The Pipedrive mark is back in the badge slot, reversed.** It was pulled once
for reading as a logo wall beside the Platinum badge; what fixes that is the
stack. Both marks sit in one column, both set to `--badge-w` on
`.footer-badges`, so the pair reads as one lockup with two lines. The artwork
is `assets/img/pipedrive-partner-badge-white.webp` — Pipedrive's own green
Authorized Partner badge with the green box dropped and the ink left white, so
like the HubSpot badge it needs no paper chip and no CSS filter. It links to
the same affiliate URL the `/pipedrive` page uses. The Pipedrive mark carries
less ink per pixel of width than the badge above it, so it runs at
`--badge-w * 1.14` to sit at the same visual weight.

`tools/smoke.js` moved with it: two marks expected in the slot, both reversed,
and the guard is now on the shared width rather than on Pipedrive's absence.
The dead-link check in both smoke files also strips `#fragment` before looking
for the file, which `resources#games` needed.

**`/newsletter` is new**, because the Resources column links to it and a link
with nowhere to land is worse than no link. Standard chrome, a centred
`.optin-wrap` with a HubSpot form frame, three cards under it on what the
subscription actually is, and the usual closing panel.

> **THE NEWSLETTER FORM ID IS A PLACEHOLDER.** `data-form-id="[NEWSLETTER-FORM-ID]"`.
> Portal `46722926` is right. Create the form in HubSpot, paste the id into
> the `newsletter` page object in `tools/build-pages.js`, rebuild. Until then
> the page reads fine but no fields appear, so do it before the link goes
> anywhere.

## 11 September: the Pipedrive page

`/pipedrive` is `pipedrive/index.html`, built from `tools/build-pages.js` like
everything else. James asked for it to be `/hubspot` without the hub cards,
and that is what it is: header, a co-branded banner, six feature cards, the
plan tiers, and five ways in.

**The primary button is not our call.** It goes to the Pipedrive affiliate
trial link, in a new tab, with `rel="noopener sponsored"`. It is the only page
on the site whose first click leaves the site, and it is deliberate: thirty
days inside the product is a better first step than a discovery call for
someone who has not decided yet. The call is the outline button beside it.

**The affiliate disclosure is attached to the artwork, not the footer.** It is
the `<figcaption>` under the banner, with a second short line under the CTA
further down the page. A disclosure you have to scroll to find is not a
disclosure, and the trial button is in the header.

**The banner is Pipedrive's own export with our lockup in it.** Their file
(`The easy and effective sales CRM.ai`, 850x520pt) leaves a slot after the
divider bar marked `<logo>`. The RevHops lockup is set into that slot, scaled
so the x-height of `revhops` matches the x-height of `pipedrive` and sitting on
the same baseline, then the whole thing exported to
`assets/img/pipedrive-revhops.webp` at 2000px. Redo it from the .ai file if
the lockup ever changes; do not rescale the webp.

The white lockup on that purple is a deliberate exception to the brand sheet's
"never reverse the logo" rule. The alternative is the navy lockup on a
saturated purple, which is worse, and the co-brand only works if both marks are
the same weight. Same reasoning as the footer and the floating nav.

**The tier list carries no prices.** Pipedrive moves them, and a stale number
on a page whose whole argument is that we know the product is worse than no
number. The tiers are named and characterised; the pricing table stays on
Pipedrive's site.

**`/pipedrive` is linked from the footer's Company column, not the nav.**
James' call. The nav is at seven items and an eighth crowds it. That meant
narrowing a smoke assertion: `tools/smoke.js` used to fail on the string
`pipedrive` appearing anywhere in the footer, which was written to catch a
*second partner badge* coming back to the badge slot. It now checks
`.footer-badges` for the badge, and separately asserts the Company column link
exists. **That badge assertion was inverted later the same day** — see "the
footer, rebuilt" below. The Pipedrive mark is back in the slot, reversed.

The homepage footer is hand-maintained, so its Company column was edited
directly in `index.html` to match.

## 11 September: the pricing page, and the first real numbers

**`/pricing` was rebuilt from scratch** against James' brief: the /services
header, a two-card chooser under it, one-time projects, monthly retainers,
the close, the footer. Everything that used to be between the retainers and
the close is gone — the "what moves the price" statement split and the
"Included whatever you spend" cards. He listed the sections he wanted and
neither was in the list.

**THE PRICES ARE REAL NOW.** Every figure on the site before today was a
plausible placeholder, and the old note saying so is retired. What James
gave, on 11 September:

| | |
| --- | --- |
| Solution design | $3,000, fixed |
| Lead to cash process mapping | $4,200, fixed |
| CRM implementations | project-based, from $5,000 |
| Retainer, month to month | $4,250 a month |
| Retainer, 3 month commitment | $3,850 a month |
| Retainer, 6+ month commitment | $3,500 a month |

**Project prices live in `SERVICES`, not in the pricing object.** The service
detail pages and /pricing read the same two fields, so a price is one edit
and it changes in both places. `price[0]` is the figure as it should be read
("$3,000", "From $5,000") and `price[1]` is what kind of number it is
("Fixed price", "Scoped and quoted after design"). The header meta row on a
service page now labels itself off the shape of `price[0]`: "From" when it
starts with From or Starting at, "Price" when it does not, because "From
$3,000" on a fixed price was a lie the old template told automatically.

**The retainer ladder is the one set of numbers that is NOT in `SERVICES`.**
RevOps consulting and HubSpot support are sold as one retainer — James'
call — so the ladder belongs to the page rather than to either service.
`RETAINERS` sits just above the pricing object.

**Both retainer services still say "From $3,500 a month"** on their own
pages, which is the floor of the ladder and correct.

**Two things you should read as unfinished, not as decisions:**

1. **`/services/hubspot-support-retainers` still sells rolling hours.** Its
   prose, one of its `leave` cards and its `next` line all say hours roll
   over within the quarter. The retainer now has no limit on monthly hours,
   which is a different promise. The `price` and `next` lines were corrected;
   the prose and the `leave` card were left alone because rewriting the
   page's argument is more than a price change and wants James. Flagged to
   him on 11 September.
2. **There is no `.hl` highlight on /pricing.** /services has none either, so
   it is consistent, but it is the one accent this page could take if it
   reads flat.

**The chooser is two cards, not two buttons.** `.pick` / `.pick-card`,
built on `.price-teaser-cell`'s shape on purpose: the visitor meets the pair
first and the price cells second, and the second should read as more of the
first. Both are plain fragment links, which `relativise()` leaves alone.
Buttons were considered and rejected under the standing rule — a boxed
button on this site means booking or requesting, and these move you down a
page you are already on.

**The Schedule a call link in the header is a `.text-link`, not a `.btn`.**
Asked for as "a link". It sits in the shared `headButtons` row, which
`.page-hero-text`'s flex gap spaces for free.

**Anchored sections carry `scroll-margin-top`.** Nothing else on the site
has an in-page anchor that a visitor clicks, so this is the first time it
was needed: without it the section's top edge tucks under the floating pill.
`calc(var(--nav-float-gap) + 66px)`, which is the pill's offset plus its
height.

**The retainer cells do not lift on hover** (`.pr-static`). They are divs,
not links, and a card that moves under the pointer promises a click that is
not there. The rest of `.price-teaser-cell` is untouched.

**New CSS is one block at the foot of `site.css`**, after RESOURCES, and it
carries no dark rules by design: every colour in it is a token that already
inverts. Checked in both themes at 1440, 820 and 390.

**Verified** with `node tools/smoke.js` and `node tools/resources-smoke.js`,
both passing, plus headless Chromium screenshots of the page at three widths
in both themes and a click through both anchors.

### And a warning, again

**A second session was writing to this folder while this was built**, the
same way it happened earlier in the day. It was mid-way through rebuilding
`/hubspot` into `hubspot/index.html` with a `HUBS` list and six hub pages.
Rebuilding the pricing object meant replacing everything between
`var pricing` and `var hubspot`, and `var HUBS` was sitting in that gap, so
it went. The other session rewrote it within the minute and nothing was
lost, but it broke the build in between.

**The lesson is narrower than "check git log".** When you replace a slice of
`tools/build-pages.js` between two markers, read what is actually in the
slice first. A file that another session is editing will grow declarations
in gaps that were empty when you last looked at it.

---

## 11 September: the HubSpot page, rebuilt and moved

`/hubspot` is now `hubspot/index.html`, not `hubspot.html`. The old file is
deleted. This matters more than it sounds: the six hub cards on the page
point at `/hubspot/sales-hub` and five siblings that do not exist yet, and a
`hubspot.html` file sitting beside a `hubspot/` folder leaves two things
answering one URL on GitHub Pages. It is the same shape `/services` and
`/case-studies` already have. Build the hub pages as
`hubspot/<slug>.html` and they need nothing else.

The page it replaced argued for the partner tier: what Platinum means, what
it is not, a wall of certification chips and a free-audit band. All of it was
about the badge. The new one is four sections.

**The header is the shared `.page-hero`**, same component as every other
page, with two things this page alone does: two buttons rather than a button
and a text link, and the Platinum badge in the artwork column. James asked
for both. The `meta` row came off, which is what exposed a bug that had been
hiding behind it — see the badge note below.

**The badge was cropping.** `.page-hero-media img` sets `width: 100%` for
the photographs, and a portrait badge given the full column width computes
taller than the band, where the column's `overflow: hidden` takes the bottom
off it. It had been propped up by the old page's three-row `meta` block
making the band taller. The fix is on `.page-hero-media.is-mark img`:
`width: auto` so it is sized by height, and **`min-height: 0`**, which is the
half that actually does it. A grid item's automatic minimum size is its
content, which for an image is the height its ratio gives at the width
`max-width` allows, and that minimum outranks `max-height: 100%`. Without it
the badge computed 584px inside a 308px box and `max-height` did nothing.

**Six hub cards**, in James' order: Sales, Marketing, Revenue, Service, Data,
Content. Ordinary `.pcard`s with a href, so they carry their own Learn more
link. They use a new `.pcards-3`, which pins the grid to three columns: the
default `.pcards` is `auto-fit`, which lays six cards out four-then-two on a
wide display, and the orphan row reads as a card that failed to load.

**The partner reviews section** is the one new component, `.prof`. A title,
a subheading, five navy stars and the profile link hold still on the left
while three reviews travel past on the right. Sticky, not a script. Two
things in it are load-bearing and both are commented in `site.css`:

- The sticky element is a CHILD of the grid item, not the item itself. Grid
  items stretch to the row height by default and the sticky child then has
  that height to travel inside. Put `position: sticky` on the item and add
  `align-items: start` to the grid, which is the obvious way to write it, and
  the item shrinks to its content and nothing appears to happen.
- Each review carries a `min-height`, because three quotes are shorter than a
  tall screen and a sticky column that never sticks is just two columns. Add
  a fourth review and that number can come down.

The three quotes are the homepage's, verbatim. Their `.hl` marks came off:
the page spends its one highlight on the hubs heading, and four would retire
the device. If more reviews arrive, they go in `REVIEWS` in
`tools/build-pages.js` and nothing else changes.

**Ways we can help** is James' four, in his words and his order, as
`.svc-list-plain` rows. Rows rather than a second card grid: six cards then
four cards reads as ten cards, and these four are the ask rather than the
subject. Each row links somewhere real — the audit to `/contact`, the fit
question to `/call`, the other two to the service pages.

**`.btn-outline` is now global**, defined beside `.btn-light`, for the second
header button. The two `.btn-outline` rules further down are scoped to the
puzzle and run overlays and still win inside them.

**It happened again.** Partway through this session the top eighty-five lines
of the new `/hubspot` block — the `HUBS`, `REVIEWS` and `WAYS` data and the
star helper — vanished from `tools/build-pages.js` between one build and the
next, leaving the page body referencing three undefined variables. Nothing in
this session removed them. Read the 11 September note below about two
sessions in this folder at once, then **run `node tools/build-pages.js` and
both smoke suites again before you believe any of your own work is
finished.** A missing `var` shows up immediately; a silently reverted string
does not.

---

## 11 September: the resources page

**`/resources`** is the central shelf for everything RevHops publishes. It is
in the nav between Case studies and HubSpot, and in the footer's Company
column.

**HOW TO ADD A RESOURCE — read this before anything else.** Adding one is a
single object in `RESOURCES` in `tools/build-pages.js`, then
`node tools/build-pages.js`. Nothing else. Not the page, not the CSS, not
the JavaScript, not the filter, not the pagination.

```js
{ type: 'videos', title: 'How to fix a lifecycle', meta: '8 min',
  copy: 'One line on what it shows.', video: 'dQw4w9WgXcQ' }
```

The fields, in full:

| field | what it does |
| --- | --- |
| `type` | required, one of the `RESOURCE_TYPES` slugs: `blog`, `case-studies`, `videos`, `downloadables`, `games` |
| `title` | what the card says. **Square brackets mean placeholder** and the card renders as an inert div rather than a dead link |
| `copy` | a line or two under the title |
| `meta` | the small fact in the card's footer: a read time, a run time, a file format |
| `href` | where the card goes. Write it root-absolute (`/puzzle`); `relativise()` handles the rest |
| `video` | a YouTube id. Opens the lightbox instead of navigating. Do not also give it an `href` |
| `gated` | `true` generates `/resources/<slug>` as a landing page with the form on it and points the card there |
| `slug` | required when `gated`, because it becomes the URL |
| `file` | for an ungated download, the path to the asset. The card links straight at it with a `download` attribute |
| `featured` | exactly one entry carries this. It is the gradient card at the top |

**Gated is a flag, not a type.** A video and a download are gated the same
way and by the same field, which is why "some videos will be gated and some
will not" costs nothing. A gated card gets the chip, loses the play badge —
it goes to a form, and a play button would promise something the click does
not do — and links to its own generated page.

**Case studies are not in `RESOURCES`.** They are already in `CASES`, they
already have cards and pages, and a second copy of them is how two lists
drift apart. The case studies shelf reads `CASES` directly through
`caseResCard()`, which is a second view of that data rather than a copy.

**The two kinds of shelf, and the one line that decides which.** A type with
an `all` destination in `RESOURCE_TYPES` is a **teaser**: it shows four cards
and a See-all link, and `resShelf()` slices the rest away. A type without one
shows eight in a 4x2 grid and pages through the remainder. That is the whole
difference between them, and it is a data difference rather than two blocks
of markup.

- Blog's See-all is `/resources/blog`, the HubSpot blog. Same domain, same
  tab. HubSpot serves that path rather than this repo, so both smoke
  checkers skip it in their dead-link pass: it resolves in production and
  never on disk.
- Case studies' See-all is `/case-studies`.
- Videos, Downloadables and Games have no See-all and paginate instead.

**See-all is a `.text-link`, not a `.btn`.** Boxed buttons on this site mean
booking or requesting, and a See-all does neither. Same for the featured
card's link. The resources smoke test checks this, because it is the kind of
thing that gets "improved" back into a button.

**The filter hides sections, not cards.** One row of choices above the
shelves, single selection, All by default, generated from `RESOURCE_TYPES`.
Filtering to Videos leaves you on the videos shelf; filtering by hiding
individual cards would leave five headings with one card under each, which
answers a different question. `/resources#videos` lands with the filter
already set, so the footer or an email can deep-link to one shelf.

**Pagination is in the markup only when it is needed.** Eight cards at a page
size of eight produces no control at all, which is why the games shelf has
none and nothing had to be special-cased to get that. Cards are hidden rather
than removed, so the reveal animation and the DOM order survive, and the
arrows disable rather than disappear at the ends of the run — a control that
vanishes moves the one beside it.

**One `<dialog>` serves every ungated video.** It sits at the end of `main`,
outside every section, because a dialog in the top layer does not care where
it is in the document and cannot be clipped by a section's overflow.

**The iframe is built on open and destroyed on close.** Setting `src` once and
leaving it there keeps YouTube playing behind a closed dialog, which is
audible; clearing `src` alone leaves a dead iframe holding a connection.
Replacing the whole element is the only version that reliably stops the
sound. The teardown hangs off the dialog's own `close` event, so the close
button, Escape and a backdrop click all go through one path. Embeds are
`youtube-nocookie.com`.

**The featured card is the one real gradient below the homepage.** It is the
hero disc's own ramp — warm at the top left running out to mist — laid flat
across a full-width card rather than drawn as a circle. The disc itself stays
the homepage's device; putting one on every page is what made it wallpaper
the first time.

Its ink is **pinned**, like `.cs-head-panel` and `.call-panel`: the card
brings its own light ground with it, so navy that followed the page would go
pale-on-pale the moment someone switched to dark. Navy measures 6.5:1 on the
warm end of the ramp and 7.7:1 on the palest; the fact line's `#44536A` holds
4.8:1 on the worst of it. Re-measure if the ramp changes.

**It currently features the RevOps puzzle**, because that and the run are the
only finished resources on the site. Move `featured: true` to something else
and the card follows; nothing there is written by hand.

**The chosen filter tab is a literal in both directions.** Written with
`--navy` and `--paper` it disappeared on a dark page: `--navy` is the page
ground there and `--paper` resolves to the same navy, so the pressed tab was
navy on navy. It inverts instead, exactly the way `.btn-primary` does, and
both halves are literals so neither can follow the theme somewhere it should
not go.

**Everything on the page is a placeholder except the games and the case
studies**, by choice on 11 September. Ten bracketed cards across blog, videos
and downloadables, each an inert div. Filling one in is a title and an
`href`, or a `video` id.

**Two gated skeletons exist**, `/resources/gated-video` and
`/resources/gated-download`, generated by `resourcePage()`. They are there so
the gate template is visible and provable rather than theoretical. Their copy
is bracketed and their form is the dashed well: HubSpot portal `46722926` is
already in the head of every page, and what is missing is the form id.
Dropping the embed in replaces `.res-form-ph` and nothing else moves. Delete
both entries from `RESOURCES` if he would rather not ship skeletons.

**Verify with `node tools/resources-smoke.js`.** It is the sibling of
`tools/smoke.js` — that one reads the homepage and nothing else — and it
checks the shelves, the See-all links, the placeholder cards, the gated
routing, the lightbox teardown and every internal link on the page.
Pagination is tested against a synthetic twelve-card shelf at the foot of the
file, because no real shelf is long enough to page yet.

---

## 11 September: two sessions were in this folder at once

Worth knowing, because the evidence is confusing otherwise.

While the resources page was being built, a second session rebuilt the About
page, moved it from `/about-us` back to `/about`, deleted `about-us.html` and
committed — sweeping the uncommitted resources work into its own commit,
`7a95557`, because every page's nav links `/resources` and the two could not
ship apart. So that commit's message describes the About work and mentions
the resources work as a passenger.

Nothing was lost and both suites pass, but two things are worth carrying
forward:

- **`/about` is the live URL again.** `about-us.html` is gone. Old inbound
  links to `/about-us` will 404 until a redirect goes in. Earlier in the same
  day the opposite was true, and this file said so; that note has been
  replaced by this one.
- **Check `git log` before assuming a change is yours.** A commit here may
  have been written by a session that is still running.

**The underlying lesson stands regardless: after editing a generated page by
hand, fold it back into `tools/build-pages.js` in the same session.** The
first version of this note existed because `about.html` was renamed and
rewritten by hand on 10 September without the generator being told, so the
next build wrote the old copy back out to the old filename and the nav kept
pointing at the stale page. The generator will not tell the next person the
page was hand-edited.

---

## 10 September: the puzzle page

**`/puzzle`** is a 3x3 sliding tile game, linked from the footer only
("RevOps puzzle", under Company, in both `footer()` and `index.html`).

- **Page** is in `PAGES` in `tools/build-pages.js` as `puzzle`. `tail()` now
  takes an optional `scripts` list, so `assets/js/puzzle.js` loads on this
  page and nowhere else. `puzzle.js` is in the STAMP hash.
- **Game logic** is all in `assets/js/puzzle.js`. Shuffles are uniformly
  random and only solvable layouts are kept (even inversion count), never
  fewer than 12 tile-steps from solved. The clock starts on "Start the
  clock". Best time is per browser in `localStorage` as `revhops-puzzle-best`.
- **Win** closes the gaps, drops in the ninth piece, then opens a
  `<dialog>` with confetti, the time, moves, "New personal best" when it is
  one, Play again and Schedule a call (`/call`).
- **Pictures** are five branded SVG illustrations and one photograph
  (`portrait.webp`, 960px square, cropped from the top of the portrait James
  supplied) in `assets/img/puzzle/`, listed in `PICTURES` at the top of
  `puzzle.js`. The gap is always the bottom-right piece.
- **CSS** is one `.pz-*` block in `site.css`, just before the dark theme,
  with its own dark rules inside it.
- **Exception to the button rule:** Start, Shuffle again and Play again are
  boxed `.btn`s even though they do not book anything. Asked for.

## 10 September: the run page

**`/hop`** is a side-scrolling runner in the spirit of Chrome's dino game,
linked from the footer only ("RevOps run", under Company, after the puzzle,
in both `footer()` and `index.html`).

- **Page** is `hop` in `PAGES` in `tools/build-pages.js`, built exactly like
  the puzzle: `page-hero-plain`, a `.to-white` section, the close. Loads
  `assets/js/hop.js` via `scripts`, and `hop.js` is in the STAMP hash.
- **The rabbit is the brand icon**, `revhops-icon-white.png`, drawn on a
  canvas. It runs as a string of small hops, tilts with its jump, and
  squashes flat to duck.
- **Fires** sit on the ground and are jumped; one, two or three together as
  the score climbs. **Requests** are paper chips with a warm dot and a short
  label ("Quick field?", "Per my last email"), from score 150. Three heights:
  head height (duck), just off the ground (jump), and above the head (run
  under it; jumping hits it, from score 350).
- **Speed** starts at 400 world units a second and climbs 7.5 a second,
  capped at 1200: about 1.9x after a minute. The Speed stat shows the
  multiple. Score is about 10 a second at the start and blinks every 100.
- **Controls:** Space, Up or W to jump, held for a higher hop; Down or S to
  duck, or to drop faster mid-air. A tap on the board jumps. Touch screens
  get Duck and Jump pads under the board (`(hover: none) and (pointer:
  coarse)`). Esc or P pauses, and leaving the tab pauses.
- **Fairness:** the gap after every obstacle is at least the ground a jump
  covers plus a margin, hit boxes sit inside the drawn shapes, and a jump
  pressed up to 0.12s before landing still fires. A scripted bot survived 70
  seconds to 2.3x in headless Chromium, so the late game is beatable.
- **World size** is fixed at 240 units tall; width follows the board, which
  is 3:1 on desktop and 2:1 under 700px. Narrow boards run up to 28% slower
  so a phone gets roughly the same reaction time.
- **End of run** shakes the board, then opens the puzzle's dialog pattern:
  a title by cause ("Too close to the fire" / "A request got you"), Score,
  Top speed, Time, "New personal best" with confetti only when it is one,
  Run again and Schedule a call. Best score is per browser in
  `localStorage` as `revhops-hop-best`.
- **CSS** is one `.hp-*` block in `site.css` right after the puzzle's, dark
  rules inside it. Same exception to the button rule as the puzzle.

## Where we got to, 9 September

Two sessions. The first was polish on the homepage; the second built the
rest of the site.

**Homepage polish.**

1. **Testimonial highlights went slate.** `.testi .hl` overrides the warm
   with `#6B7A93` and puts white type on it — navy on slate is a smudge.
   The warm marker is untouched everywhere else.
2. **The About pair is real now.** The back image is James's portrait
   (`james-portrait.webp`, converted from the original JPEG). The front
   square is the *colour* Platinum badge, at the same 3.2° tilt, with the
   border, plate background and drop shadow all removed — asked for
   explicitly, and the smoke test now asserts none of them come back.
3. **The dark-mode nav box.** `:root[data-theme="dark"] .nav-links` was
   unscoped, so the inset ring meant for the mobile dropdown painted a box
   around the four desktop links. Now inside the 940px query.
4. **The stage cards are frosted.** `--card-veil` went .78 → .92 in light
   and .07 → .16 in dark, plus a 16px `backdrop-filter` on `.mcard` and
   `.stage-form`.
5. **Ignite in dark mode.** The mark is a near-white disc with the wordmark
   knocked out of it, so `brightness(0) invert(1)` flattened the whole thing
   to a blank circle. It carries `data-solid` now and keeps its own artwork.
6. **The bottom of the page in dark mode.** The testimonial band is white in
   both themes. The tool clump's gradient holds navy to 52% and reaches white
   by 96%, so the band's top edge is white meeting white; the close paints
   white across its bleed and the photograph rises into it. Testimonial type
   goes back to light-theme navy for the same reason the close does.
7. **HubSpot tracking** is in the head of every public page, portal
   `46722926`.

**The rest of the site — twenty pages.**

Built from `tools/build-pages.js`, which holds the head, nav, close panel and
footer once and the per-page content in `PAGES`. **The output is the site:**
GitHub Pages never runs the script, and the `.html` files it writes are what
deploy. It exists because a nav change was otherwise twenty edits and a
twenty-first page that quietly drifts. `index.html` is not generated — the
maturity hero is one of a kind and does not belong in a template.

Run it from the repo root: `node tools/build-pages.js`.

- `/services` and `/case-studies` are **folders**, not root files, because
  James asked for `/services/[service-name]` and `/case-studies/[name]`.
  Those two are the only pages one level down; everything else is still a
  flat file at the root. Their assets use `../assets/…`.
- **Nav went to six** — Services, Case studies, HubSpot, Pricing, About,
  Contact — plus the Schedule a call button.
- **Every "Schedule a call" now points at `/call`**, which is the meetings
  embed and nothing else. `/book` is gone, including the fallback in
  `maturity-slider.js`. `/client-call` is the same page with the client
  scheduler, `noindex`, and no link to it anywhere.
- **Background shapes are header-only.** One disc in `.page-head` on every
  page and nothing below it, as asked.
- **The close is on every page except the two booking pages**, and the
  section above it carries the new `.to-white` so its white bleed lands on
  white rather than on paper.
- **Case study pages look different on purpose**: a full-width navy band of
  three counted figures, then the story in three alternating splits, then a
  centred pull quote. No cards anywhere on them.
- **Prices were plausible placeholders** when this was written, chosen
  because James asked for numbers rather than `[$X]` slots. They are real
  now — see "the pricing page, and the first real numbers" at the top of this
  file. Nothing on the site still carries an invented figure.
- **Case study slugs are `case-study-one` … `-five`** and every specific in
  them is in `[square brackets]`. No invented client results anywhere.

**New in `site.css`**, all before the dark block: `.to-white`, `.prose`, the
form components, `.figs` / `.fig`, `.svc-list-plain` (the services row with
three columns instead of four), `.grid-3`, `.ticks-2` and `.meet-wrap`.

**Not verified in a browser.** Chrome would not respond in either session, so
every change above is reasoned from the CSS and checked by the smoke test.
The dark-mode fade at the foot of the page, the badge's size in the About
pair, and all twenty new pages want an eye on them.

---

## Where we got to, 7 September

The last working session did seven things. In the order they were asked for:

1. **Removed the running hop** between the services list and the case rail —
   element, CSS, script module. The two WebP files are orphaned on disk.
2. **Centred each testimonial in its own column** (`align-items: center`).
   The tallest sets the row height; the three titles deliberately no longer
   line up.
3. **Rebuilt the dark theme**, deleted on 4 September, as a token swap plus
   six measured exceptions. Its own section below.
4. **Cut Deborah's quote** at "continued partnership with RevHops."
5. **Tightened the services-to-case-studies band** from about 232px to 188px
   on desktop.
6. **Moved the mobile case arrows to the right.**
7. **Made a refresh land at the very top** with the full nav rather than a
   few pixels down with the floating pill.

Everything is verified by `node tools/smoke.js` — 225 checks, all passing,
including the dark theme's contrast figures, which the suite recomputes from
the stylesheet rather than trusting a comment.

**The one judgement call worth reviewing in Arc:** the floating nav bar is a
navy pill and the dark page is the same navy, so on a dark page the bar has
no colour of its own to separate it. He asked for the bar to stay the same,
so rather than change its colour I gave it a one-pixel light edge, measured
at 3.26:1. Look at it and say if it reads as an outline rather than a bar.

**Still not started:** everything in *Still outstanding* at the foot of this
file. Five service detail pages, real case study content, a portrait,
Terms and Privacy, Open Graph tags, the custom domain.

---

## What this is

A static marketing site for RevHops, James Ricks' solo RevOps consultancy and
HubSpot Platinum Solutions Partner. No build step, no dependencies, no
framework. Plain HTML, one stylesheet, two scripts. Deploys to GitHub Pages
as-is.

**One page right now.** On 4 September everything except `index.html` was
deleted, on purpose: services, pricing, hubspot, contact, book, terms,
privacy and `404.html`. James wants to settle the design principles on the
homepage first and rebuild the rest against them. All of it is in git
history, and the CSS for those pages was stripped with them.

The homepage still links to `/services`, `/hubspot`, `/pricing`, `/contact`,
`/book`, `/terms` and `/privacy` in the nav, the service rows, the CTAs and
the footer. Those seven 404 today. The hrefs were left in deliberately so
they work again the moment the pages return; do not point them at `#`.

**Flat files at the root, linked without the extension.** The files are
`services.html`, `pricing.html` and so on; only the homepage is an
`index.html`. Every link between pages is root-absolute and extensionless:
`/services`, `/pricing`, `/` for home. GitHub Pages serves `services.html`
for `/services`, so that is what visitors see in the address bar, which is
what James asked for.

**This means the from-disk preview no longer clicks through**, and he knows.
Opening `services.html` from Finder still renders the page fully, since
asset paths stay relative, but every nav link resolves against the
filesystem root and fails. He accepted that trade for clean URLs. If it
starts to bite, the fix is a tiny local server with .html fallback rather
than reverting the links.

`normalisePath()` in `site.js` strips both `index.html` and a bare `.html`,
so `/services.html`, `/services` and `/services/` all match when it sets
`aria-current`.

---

## Ground rules for working on it

These came out of a long back-and-forth. Breaking them means redoing work.

**Write to the folder, not to chat.** He previews `index.html` from disk and
opens it in **Arc**. Never suggest Safari. Attach `index.html` in every reply
even when the change is CSS-only, because that is how he opens the preview —
and say when `site.css` also changed, since the two must ship together.

**Bump the cache stamp on every change.** Every page links
`site.css?v=…` and `site.js?v=…` with a shared timestamp. Bump all eight
pages together or he sees stale styles, especially on iOS.

**Verify before claiming done.** `node --check` only catches syntax. The
smoke test is `tools/smoke.js`, run with

    cd ~/Downloads/Claude/revhops.com && node tools/smoke.js

It lives in the repo now. It was rebuilt from scratch three times after
`/tmp` was cleared between sessions, which is wasted work every time. It
needs `npm install jsdom` once; `tools/node_modules` is gitignored.

It loads the page, runs both scripts, and checks the structure, the cache
stamp, every local file reference, stylesheet brace balance, that the
document appears exactly once, and a long list
of things that were removed and must stay removed. The brace check is there
because a regex-driven deletion once left a stray closing brace, which kills
every rule after it while every DOM assertion still passes. The
document-appears-once check is there for the same reason: a bad string slice
once duplicated the entire file, and every DOM assertion still passed,
because `querySelector` returns the first match.

The `rule()` helper has been wrong twice, both times reporting a bug that
was not there. It is anchored to the start of a line, because a plain
`indexOf` finds a selector as a SUBSTRING of a longer one, so `.quote p {`
matched inside `.testi .quote p {`. And it returns EVERY matching rule
joined rather than the first, because declaring a selector twice is ordinary
CSS and a deliberate technique here; reading only the first missed the
declaration that was actually winning.

The suite lists duplicate selectors as a note rather than failing on them,
since the CARD HOVER block exists precisely to re-declare a hover that a
later rule had cancelled. Most assertions exist because something broke
once, and each carries a comment saying which, so a future change knows what
it is about to undo. Add to it rather than rewriting it.

**What it cannot do:** jsdom has no layout engine. Anything about size or
position is recomputed by hand from the CSS. That catches a value drifting
out of range; it is not a substitute for opening the page in Arc.

**No em dashes in replies to him.** No emoji. Be concise. Ask when unsure.

**Copy must not sound like AI.** He has rejected: standalone eyebrows,
title/rule/paragraph template stacks, and anything with a generic marketing
cadence. Short, concrete, plain.

---

## Design decisions, and why

**Brand.** Navy `#304157`, Deep `#1C2635`, Slate `#6B7A93`, Mist `#C6D3E0`,
Warm `#F2C39B`, Paper `#FAFAF8`. Ubuntu for headings and nav, Lato for body.
Radii 7 / 10 / 12px, never pill.

**No eyebrows anywhere.** The tracked-uppercase micro-label above a heading
is the thing he identifies as an AI tell. 24 were deleted; 15 that were
carrying the only heading on a card became `.label` — Ubuntu bold, sentence
case.

**Section heads** inside a page are centred, one line where the width
allows, no paragraph beneath, no rule and, as of 3 September, no accent of
any kind. The page header at the top of a page is the exception: it is left
aligned across two thirds of the width — see "No
section accents right now" below. Tried and rejected as accents: the warm
rule; the marker highlight; underline instead of highlight; navy highlight
with white text; slanted marker ends (visible seam).

**Boxed buttons mean booking.** `.btn` is only for actions that book or
request. Everything else is a `.text-link` with an arrow. Buttons are navy in
light mode, warm in dark, and warm on hover in both.

**No hairlines between sections.** Surfaces dissolve via `.fade-top` /
`.fade-bottom`. Only exception is a navy section between two light ones.

**Global page header.** `.page-head` is the standard opening band on every
page except the homepage. When James says "the global page header", this is
it. One layout, no variants. Markup is

    section.page-head
      .disc[data-parallax="0.13"]
      .shell > .page-head-inner
        .page-head-text     h1.h1 + p.lede  (+ optional .btn-row)
        .page-head-media    optional, a mark or an image
      .page-head-end[data-nav-clear]

**One height for every page.** `--page-head-h`, a token on `.page-head`, is
`clamp(270px, 32vw, 470px)` and does two jobs: it is the `min-height` of the
grid and the `max-height` of anything in the media column. So the band is the
same height on all seven pages, content is centred in the same box, and the
badge can never push HubSpot's band taller than the rest. It is the one
number worth tuning if the bands feel too tall or too short.

Because it is a floor rather than a fixed height, a header whose copy grows
past it will still push its own band taller and break the match. The smoke
test estimates each header's content height at four widths and fails if any
page exceeds the token, which is the real guard here.

**Two thirds text, one third empty.** `.page-head-inner` is a literal
`2fr 1fr` grid, left aligned. The empty third is deliberate and stays the
same width whether or not `.page-head-media` is present, so adding a mark
never moves the headline and the title breaks at the same point on every
page. A mark in that slot is capped by HEIGHT, not width: the Platinum badge is
portrait, so height is what would otherwise drive the band taller than every
other page's, and capping height is also what lets the badge grow to fill
the column on a wide screen instead of stopping at a fixed pixel width. The
badge is the only mark in use; other pages leave the slot empty and can take
a placeholder image when James asks.

Do not put a max-width on the headline to fake the two thirds. The grid is
what holds it, and a max-width would let the empty third collapse.

**Titles are one line, two at the absolute most, never three.** This is a
copy rule before it is a type rule: if a title wraps to three lines, shorten
the title rather than shrinking the type. "Two kinds of HubSpot problem. We
work on both." and "Every price published so you can qualify us out in ten
seconds" were both cut for this. The smoke test estimates line count from
character count against the column width at six viewport widths and fails
above two.

The band pulls up behind the nav by a negative `--nav-h` margin, added back
as padding, so the circle runs to the top edge of the screen the way the
hero's discs do.

**The circle bleeds out of the band on purpose.** Nothing clips it. It runs
past the bottom of the header and sits behind the copy of the next section,
which works because sections carry no z-index: the disc at z-index 1 paints
over the next section's background and under its `.shell` at z-index 2.
`main` clips on x only, so the horizontal overhang is hidden and the
vertical bleed is not. An earlier version put `overflow: hidden` on the band
and needed a gradient ramp to hide the cut; both were removed. Sizing is
`right: calc(29vw - var(--ph-disc))`, which leaves the same slice of screen
covered at any width; a fixed negative offset lets the circle swallow most
of a narrow screen. `top: 0` puts it flush with the top of the band, which
is itself a nav height above the top of the screen, so it hugs the very top
corner the way the hero's warm disc does.

**No horizontal dividing lines between sections, ever.** No
`border-top: 1px solid var(--line)` on a section, no rule under a header
band. Surfaces separate by colour or by a `.fade-top` / `.fade-bottom` ramp,
or they simply do not separate. The smoke test greps for this.

**The warm highlight is back**, asked for again on 6 September after three
days without any section accent. `.hl` is a warm marker drawn as a
background-image at 80% of the line box, sat low in it: a full-height fill
collides with the line above wherever a highlighted phrase wraps. Type on it
is a literal `#304157`, because the warm is fixed and so the type on it has
to be. `box-decoration-break: clone` gives every line of a wrapped phrase
its own fill.

**Not italic this time.** The 3 September version was, and the italic was
half of what made it read as a template.

**Five phrases carry it**, and they are James': "wherever you're at", "some
of the best", "Small by design", "all of the tools", and one long span
inside the testimonial running from "James has taken the time" to "and
transparent". "work with us" went when that heading became "Superior
expertise". The smoke test checks each by name and fails if a sixth appears.
Do not spread it further without asking.

**The warm rule under a heading stays gone.** Its sizing module in `site.js`
went with it: it measured a heading's rendered text with a Range and set the
rule to 60% of that width, because no selector or unit can read another
element's text width. If a rule comes back, that problem comes back with
it.

**No commas in section titles**, unless James writes the title himself. He
reads a comma-spliced heading as an AI tell; "Prices, published" was the
example he called out. His own "When you're ready, there's 2 ways to get
started" on the start panel is approved and stays exactly as he wrote it,
loose grammar included.

**Three blocks carry a subheading**: the tool clump, About and the start
panel. Everywhere else a section head is still the headline alone.
`.sec-sub` is the class, `.sec-sub-left` the variant for one used inside a
column rather than under a centred head.

**Service order**, set 5 September and not alphabetical or arbitrary:
Solution design, CRM implementations, HubSpot support retainers, RevOps
consulting, Lead to cash process mapping. The CTA under the list is centred.

**`.cta-band`** carries a soft warm and cool wash on a rounded panel, so the
gradient returns once mid-page. Type is `var(--ink)`, which resolves to the
literal `#304157` on light, the navy-on-warm rule, and inverts correctly
because the wash is knocked back to match.

**No footer newsletter.** The opt-in block and the rule above it were
removed on 4 September, along with the HubSpot embed loader. The form id was
`aeef277e-13c3-448d-b5fc-4e0ea2e742ab` on portal `46722926` if it comes back.

**One address, no phone.** Every address on the site is `team@revhops.com`.
The phone number was removed everywhere on 3 September. Do not reintroduce
either.

**Full-bleed layout.** `main > section > .shell` runs to 60px from each screen
edge, clamped down on small screens. The nav at rest uses 45px. The hero is
excluded because its `.shell` is a grandchild, not a child.

**Homepage order**, as of 6 September: hero, client logo band, services,
case studies, about, tool clump, testimonials, the close, footer. The
pricing teaser was removed on the 4th; the tool band moved from third to
seventh and was rebuilt as a clump.

**The hop is gone**, removed 7 September at James' request after two weeks
of being tuned — three size increases, a switch from a timed loop to a
scroll-driven traverse, and a vertical centring pass. What went: the two
`img.hop-mark` elements, about forty lines of CSS including the
reduced-motion still-frame swap, and the `[data-hop]` module in `site.js`.

`assets/img/hop.webp` and `hop-still.webp` are still on disk and nothing
references them. They were left rather than deleted, since this folder has
no version control to recover them from. Delete them once he is sure.

The smoke test now carries "the hop" in its removed-and-must-stay-removed
list, so a stray rule or a re-added element fails rather than reappearing.

**The seam it used to sit on is tighter now.** The services list and the
case rail are both `.section`, so the band between them was the full
padding twice over, up to 232px. `.case-section` takes
`padding-top: clamp(40px, 5vw, 72px)`, trimming the desktop band to about
188px. The rail's top rather than the services list's bottom, so the
services section stays symmetric with the one above it.

**The rail's prev/next arrows sit on the right on mobile too**, changed
7 September. Under 700px the head drops to one column and the arrows used to
go `justify-self: start`, which tucked them under the first word of the
heading and read as part of the sentence. On the right they read as a
control, and they sit under the thumb that is about to swipe the rail. They
are still hidden entirely under `@media (hover: none)`, where the swipe is
the interface.

**Three testimonials, three columns, Deborah first.** Real quotes as of
7 September. Each carries its own title in warm quote marks, its own body,
and five navy stars beside the name. Titles and bodies are italic; the quote
marks and the names are not.

**Name and role only, no companies.** "Deborah | COO", "Amy | VP of Client
Services", "Adam | CEO", all on one line. The companies were named until
7 September and came out at James' request; the divider is its own `.sep`
span so it can sit lighter than the words either side of it.

`display: block` on `.quote-by cite` is load-bearing. It was a flex column
back when the cite held a name above a company, and the rule outlived that
content, stacking "Deborah", "|" and "COO" as three rows. The client logo band still names
Core Income, which is a separate thing, so the smoke test scopes its
no-companies check to the testimonial section.

`align-items: center`, changed from `start` on 7 September. Each quote now
sits in the middle of its own column, the longest sets the row height, and
the three titles land on three different lines. That is the point: James
asked for it after seeing the topped-out version, where the ragged bottoms
were doing all the talking. The old note here argued the opposite case, and
he overruled it.

Deborah's quote was cut short in the same pass. It now ends at "continued
partnership with RevHops."; "well into the future!" came off.

**No cards, and this section has been rebuilt four times.** Three quotes in
plain columns, then one quote beside a circular photo sticker, then one
quote in a bordered card beside the client logo, then one quote in the
middle two of four columns, and now three columns again. What survived every
version is that space does the separating: the page already has poster
cards, service rows and the logo clump, and a fourth boxed thing was always
one too many. The mobile rail and its auto-advance went when the section
dropped to one quote; if three columns ever need it back, it is in git.

**Every testimonial carries one highlight**, as of 7 September, which puts
the page at seven: four section heads and one phrase in each quote. The
smoke test checks each phrase against the exact wording James picked, so a
reworded quote fails rather than quietly losing its emphasis.

**One `sr-only` h2 for the outline, three h3 titles under it.** The section
has no visible heading of its own, since each quote carries its own title,
but jumping h1 to h3 with nothing between would leave the outline wrong. The
titles take their own size rather than `.h2`, because a third of the width
needs less than a full-width heading did.

**Two columns below 900px, one below 640px.** Three columns of quote are
unreadably narrow before they are unreadably short.

**The footer had a stray `</div>`** that closed `.shell` on the line it
opened, from the night the newsletter block was cut out. The whole footer
was sitting outside its own padding, hard against the left edge. Worth
remembering when a block is removed from inside a wrapper: check the
wrapper still wraps something.

**Footer layout, rebuilt 4 September.** Brand, one-line pitch, address and
city on the left; two link columns in the middle; the HubSpot Platinum and
Pipedrive partner marks stacked on the right; one bottom bar.

**Mobile footer** centres everything, and the two link columns stay side by
side at half each rather than stacking. They are four short items apiece,
and stacking them made the footer twice as long for no gain. The badge
centres with the rest.

**Footer legal links inherit.** The Terms, Privacy and llms.txt row takes
`font-size: inherit` and `color: inherit` from `.footer-bottom`, so it reads
as part of the copyright line rather than as nav links at `.footer a` size.

**One partner mark, HubSpot's own reversed artwork.** The Platinum badge
alone, stretched to the height of the link columns beside it, linked to
`ecosystem.hubspot.com/marketplace/solutions/revhops` in a new tab.

The white version arrived on 5 September and closed a compromise that had
been open for two rounds: 0% of its ink measures under 3:1 on the navy,
where about 20% of the colour badge did. No chip, no filter. If the badge is
ever swapped back to the colour artwork, that problem comes back with it.

The height is tied to the columns with `align-items: stretch` plus
`height: 100%`, not to a number, so it stays in step when a link is added.

**About is an offset pair.** Third attempt, and the one that stuck. Two
photographs at different sizes, the smaller overlapping the lower right of
the larger, both turned a couple of degrees, the same loose hand as the tool
clump. Copy on the right at 40/60, heading first in that column, and the heading leads straight into the body paragraph: the subheading under it came out on 5 September.

The shapes are load-bearing. This section sits directly under five 3:4
poster cards, so a square portrait card read as more of the same, and a wide
21:6 band did not land either. The two images are a 4:5 and a 1:1 turned
opposite ways precisely so the block cannot be read as another card. Keep
them different shapes and oppositely rotated; matching them reads as a
mistake rather than a composition.

The container carries padding on the two sides the front image hangs over,
so the overhang is inside the box and nothing has to be clipped or pulled
out of flow. The front image's border is `var(--paper)`, the page colour
rather than white, because this section's ground is paper drifting toward
white.

**The front image tilts about twice as hard as the back**, 6deg against
3deg. That difference is the entire effect: moved by the same amount the two
read as one flat sheet. `site.js` only writes `--tx` and `--ty` in the range
-1 to 1; the angles, the resting rotation and the easing are decided in the
stylesheet, and the signs are not negated in JS because a positive `rotateY`
already pushes the right edge back.

Both are the placeholder SVG, by choice, so the missing photographs cannot
ship unnoticed. Concepts offered and not taken: no photo with large figures
instead; a circular portrait on a warm disc. Either is a reasonable fourth
attempt.

**The tool clump is not a grid, and never more than two rows.** Two
explicit `.tool-row` elements, both `flex-wrap: nowrap`, so adding a mark
makes the block wider rather than taller. The clump is full-bleed,
`width: 100vw` with a negative margin cancelling the shell inset, which is
what gives "wider" somewhere to go; `main` clips horizontally so it can
never produce a scrollbar. Rows use `space-evenly` so the marks fill the
width instead of huddling in the middle, and the second row is nudged
sideways so the two do not read as the rows of a table.

**HubSpot sits dead centre of the top row**, fourth of seven, which is the
one position the edge mask can never fade, and it runs a size up on
everything else via `img[data-hero]`. Salesforce and Pipedrive flank it and
take `img[data-mid]`, a tier between the default and HubSpot. Marketo,
NetSuite, QuickBooks and AdvizorPro sit at the four row ends, where the mask
fades them most. That placement is James', not incidental, and the smoke
test checks it by name. The top row is deliberately odd
numbered so that a true centre exists; keep it that way if marks are added
or removed.

Marks fade out toward both edges. That is a `mask-image` on the container,
not opacity on individual marks, so it depends on where a mark actually
lands rather than its position in the source order, and it survives a change
in the count.

**A mask crops.** `mask-clip` defaults to `border-box`, so anything outside
the element's own box is masked away, not just faded. The `nth-child`
offsets lift marks up to 9px above the first row and the tallest lockup is
16px taller than a wordmark, which is why Google Workspace was losing the
top of its G. `.tool-clump` carries `padding-block` to keep every mark
inside the box the mask clips to. Do not remove it, and widen it if the
offsets or the mark heights grow. **On mobile the two rows dissolve.** `.tool-row { display: contents }` under
760px, so all fifteen marks flow as one wrapping list. Letting each row wrap
on its own gave 4 then 3 then 4 then 4: the seven-mark row breaks before the
eight-mark one does, and a short row in the MIDDLE reads as a fault. Flowed
as one list only the last row comes up short, which is what a wrapped list
is supposed to look like. The offsets come off there too.

Each mark is nudged off its line by a few pixels and a fraction of a degree
from `nth-child`, scoped per row so each row has its own 1 to 8. Those
offsets are static and hand-tuned on purpose: do not replace them with
random values, or the arrangement changes on every load.
Marks are greyscale at 50% opacity at rest and full colour on hover, which
is also what retired the per-mark `data-reverse` flag and the second
Microsoft 365 file, both of which only existed to survive the dark theme.
Fifteen marks as of 4 September, and no CTA under them.

**The hover magnification has to outrank the offsets.** Both set
`transform` at the same specificity, so whichever comes last in the file
wins. The offsets sat after the hover and silently cancelled it, which is
why the magnification appeared not to work at all. The hover is written
`.tool-row .tool-mark:nth-child(n):hover` and lives after the offset block.
Do not tidy it back to a bare `:hover`.

**Stacked lockups get their own height.** Google Workspace and AdvizorPro
are roughly 2:1 where a wordmark is 4:1, so matching them on height alone
made them read at twice the weight. `img[data-stack]` gives them a larger
height so the optical size matches.

**Circles only in the header.** The homepage keeps the hero's warm and cool
pair and nothing else; the three that sat behind the tool band, the case
rail and the closing CTA were removed on 4 September.

**Background circles never cover content.** Global layering: sections carry
`position: relative` and **no z-index**, `.disc` is z-index 1, `section >
.shell` is z-index 2. A z-index on a section forms a stacking context and
lifts its disc above the *next* section's text. This was a real bug.

## The dark theme

Deleted on 4 September, asked for again on the 7th, and **rebuilt from
scratch** — none of the original survived, and this folder has no git
history to recover it from. So it is a second design, not a restore, and it
is simpler than the first.

**The brief, verbatim:** anything paper-coloured goes navy, anything navy
goes white, and the footer and the floating navigation bar stay the same.

**How it works.** `:root[data-theme="dark"]` on the `<html>` element. Not a
`prefers-color-scheme` query: the toggle is the only thing that sets it, so
the theme is always the visitor's explicit choice and never changes under
them. The block lives at the foot of `site.css`.

**`--navy` was split in two, and this is the load-bearing change.** It had
been doing two unrelated jobs: the dark GROUND under the footer, the
floating bar and the primary button, and the strongest INK on the paper —
links, arrows, stars, focus rings. Those want opposite things when the page
goes dark. So now:

- `--navy` means a dark chip and nothing else. Anything painting with it
  comes out identical in both themes with no dark rule at all, which is
  precisely how the footer and the floating bar "stay the same".
- `--ink-strong` means the strongest ink on the page ground: navy on paper,
  white on navy. Twenty-three declarations moved onto it.
- `--ink-hover` replaced the five hover uses of `--deep` for the same
  reason.

**The dark palette is measured, not eyeballed**, and the smoke test
recomputes every figure from the stylesheet so a later tweak to a hex cannot
quietly drop the page under AA:

| token | dark value | on the ground | on the lifted surface |
| --- | --- | --- | --- |
| `--ink` | `#F2F6FA` | 9.58:1 | 7.83:1 |
| `--body` | `#D5DFEB` | 7.72:1 | 6.31:1 |
| `--muted` | `#B6C3D3` | 5.81:1 | 4.75:1 |
| `--ink-strong` | `#FFFFFF` | 10.40:1 | — |

`--muted` is set by the lifted surface, which is the tighter of the two
grounds. Headings stop short of pure white on purpose: `#FFFFFF` over a
whole paragraph on this navy glares. Full white is kept for the small,
sparse things — links, arrows, stars — where it reads as emphasis.

`--paper` goes to `#304157`, exactly as asked. `--surface`, the white the
tool clump and testimonials sit on, goes to a *lifted* navy `#3A4E68` rather
than staying white, so the drift up the page still reads as a step out of
the ground. `--paper-step` was added so the two `.to-white-*` gradients
follow instead of carrying a literal `#FCFCFC`.

**The six places the token model could not reach.** Each of these is a real
exception, not tidying:

1. **The two bars that stay the same.** They are fixed navy, but they paint
   their contents with light tokens — a paper-coloured hamburger, a paper
   button, a paper link hover. Those tokens now resolve to navy, so the
   contents would vanish into the bar. Literal `#FAFAF8` in the dark block,
   deliberately not following the theme.
2. **The floating bar's edge.** It is a navy pill floating on a navy page,
   so its own colour no longer separates it and its drop shadow is a dark
   shadow on a dark ground. It gets `inset 0 0 0 1px rgba(255,255,255,.42)`,
   which measures 3.26:1 against the page — the non-text threshold. This is
   the one judgement call in the whole theme: the alternative was changing
   the bar's colour, which he asked me not to do.
3. **The buttons.** `.btn-primary` is a navy chip with paper type; in dark
   both resolve to navy. Inverted instead, so the primary button is the
   light thing on a dark page.
4. **The client logo band.** Nine greyscale marks. Left alone on navy the
   mid-grey ones measure about 1.9:1, *worse* than they are on paper.
   Flattened to white at .55 opacity they all land together at 4.43:1 — and
   the Ignite mark, which is near-white artwork that has always been close
   to invisible on paper, finally reads.
5. **The tool clump.** Fourteen brand marks with fixed colours, shown
   greyscale at rest and released to full colour on hover. Measured on this
   navy, twelve of the fourteen fall below 3:1 in colour and HubSpot lands
   at **1.16:1**. So: white silhouettes at rest (3.94:1 at the quietest
   tier), and on hover the mark gets a white plate to sit on and keeps its
   real colours. The plate is a pseudo-element behind the mark, not padding,
   because padding would move every mark in the clump.
6. **The close.** "Ready to hop with RevHops?" is set over a photograph, and
   a photograph has no dark variant. The artwork runs L 0.13 to L 0.99 and
   sits mostly light: navy type holds 3.5:1 or better through the band the
   headline occupies, while the dark ink would land at **1.1:1**. That one
   section keeps light-theme type in both themes. Its top fade still follows
   the theme, so it leaves the testimonials in whatever colour they are and
   dissolves into the photograph from there.

**The toggle** sits in `.nav-cta`, left of the call button. Both the sun and
the moon are in the DOM and CSS picks one — rendering the right icon in JS
would leave the wrong one on screen until the script ran. It carries
`aria-pressed`, and `site.js` keeps that and the label in step with the
attribute. The choice is saved to `localStorage` under `revhops-theme`,
wrapped in `try`, because Safari in private mode throws on write and a theme
toggle is not worth an exception that stops every module after it.

**No flash.** An inline script in `<head>` reads the saved choice and sets
the attribute before the first paint. It must stay inline and in the head;
moving it into `site.js` puts a white flash on every load for anyone on the
dark theme.

**The reasoning that was already there.** Several comments in `site.css`
still explain themselves in terms of the dark theme — the literal `#304157`
on warm, the opaque `#EFF3F8` service-row hover fill. Those were written for
the first dark theme, survived its deletion, and are correct again.

---

**Refresh lands at the top.** The same inline head script sets
`history.scrollRestoration = 'manual'`. The browser was restoring the scroll
position on reload, and a few pixels down the page is enough for the nav to
be in its floating state — so a refresh landed near the top with the pill
bar showing rather than at the top with the full bar. Guarded by
`!location.hash`, so a link to an anchor still goes to its anchor.

**Kept in `site.css` although nothing uses it yet:** the whole `.page-head`
component, `.pill`, `.surface-navy`, `.btn-light`, `.section-bleed` and the
`.gap-*` utilities. These are design system, not page code, and the header
in particular took several rounds to settle. Everything else that belonged
only to a deleted page was stripped: the FAQ, price cards, retainer grid,
testimonials, fit grid, featured case study, CTA band, meeting frame,
contact lines, proof strip, step numbers and stat numbers. `site.css` went
from 97kB to 71kB.

**Rejected, do not resurrect:** the lo-fi Web Audio track and its speaker
button; the hand-drawn arrow annotation in the hero; the wave/curve motion on
the client logo band; the tool-logo marquee; the HubSpot custom module; the
warm rule under headings; the marker highlight on a headline phrase; the
photographic gradient background behind the page header; a centred page
header; the pill above the HubSpot page title; horizontal rules between
sections; the footer newsletter opt-in; the case rail's prev/next
arrow buttons; the tool grid of bordered tiles; the pricing teaser on the
homepage; the two-card "Two ways to start" block, replaced by the start
panel; the pinned case rail that drove horizontal scroll from the page
scroll; the CTA under the tool clump; the see-all link under the case rail;
the two-option "ways to get started" list and the account-audit CTA;
the white plate behind the booking widget; Pipedrive in the footer;
the booking widget embedded on the homepage; the square portrait card in
About; the colour Platinum badge on the navy footer;
the square portrait card and the wide 21:6 band in About;
the numbered call steps under the booking button;
the About subheading; the centred single-column closing ask with a
paragraph in it; the artwork behind the close.

---

## Assets

| Path | Notes |
| --- | --- |
| `assets/img/revhops-logo.png` / `-white.png` | Nav and footer lockups |
| `assets/img/revhops-icon.png` / `-white.png` | Slider thumb; swaps by theme |
| `assets/img/hubspot-platinum-badge.webp` | In the hubspot page header, `.page-head-badge` |
| `assets/img/logos/` | 9 client logos, greyscale, for the marquee |
| `assets/img/tools/` | 14 platform marks |
| `assets/img/case-study-placeholder.svg` | Stands in for every real photo |

Tool marks are handled wholesale in dark mode now — flat white at rest, real
colour on a white plate on hover — so there is no per-mark flag to set. The
old `data-reverse` attribute is gone from the clump and the smoke test keeps
it gone; the footer reuses the name for the reversed partner badge, which is
a different thing.

`assets/img/hop.webp` and `hop-still.webp` are orphaned as of 7 September.
Nothing references them. Safe to delete once James is sure the hop is not
coming back.

---

## Still outstanding

**Needs James, blocking launch**

1. Three case study outcomes — client, what broke, what changed, two figures.
   Six cards currently read `[Client name]` and `[measure]`. Deliberately not
   invented.
2. A portrait for the About section — still the placeholder SVG.
3. Years in revenue operations — `[00]` in the About bullets.
4. ~~HubSpot meetings slug~~ — done, `revhops/discovery-call`, embedded on
   the homepage.
5. HubSpot form ID for the contact page form (portal `46722926` already in).
   The footer newsletter form is live and does not need one.
6. One form still posts nowhere: the hero capture card on the homepage.
7. Case studies in the hero slider — all five stages say Makarios Design
   Build with placeholder text.
8. Terms and Privacy are heading skeletons, not legal text. Do not publish
   as-is.
9. The featured case study on `/services` is a placeholder: `[Client name]`,
   two `[measure]` figures, two bracketed lines and the placeholder SVG.

**Blocking launch, needs building**

- ~~Real resources. Ten bracketed placeholder cards on `/resources`~~ —
  cleared on 13 September. There are no bracketed cards left on the page:
  two blog posts, one video, one gated download and the two games are all
  real. The shelves are thin rather than padded, which is the honest state.
  More is still wanted, and each one is a single object in `RESOURCES`.
- The blog moved to `/resources/blog` on this domain; `blog.revhops.com` is
  gone. The Blog shelf is real now: two posts, each with a `thumb` cropped
  to the shelf's 16:9 in `assets/img/` and a `date` that takes the footer
  slot the placeholders use for "Coming soon". Add a post by adding an entry
  to the blog block of `RESOURCES` in `tools/build-pages.js`, newest first;
  the shelf teases four and the See-all carries the rest.
- ~~The two gated skeletons at `/resources/gated-video` and
  `/resources/gated-download`~~ — deleted on 13 September. The one gated item
  is the Marketing Hub ROI calculator, and its form is ours rather than
  HubSpot's: four fields, the browser's own validation, and a redirect to the
  sheet on submit. It still needs the HubSpot form id, at which point the
  `<form>` is swapped for the embed and the same URL goes in HubSpot's
  redirect setting.

- Five service detail pages. `services.html` rows link to
  `revops-consulting.html`, `solution-design.html`, `crm-implementations.html`,
  `hubspot-support-retainers.html` and `lead-to-cash-mapping.html`. None exist
  yet, so all five 404 today. The footer Services column on that page points
  at four of them.
- `/services` was rebuilt on 3 September against the homepage's five services.
  The old four-category version (Solution design, Implementation, Optimization,
  Ongoing partnership) and its "What we do not do" section were dropped. That
  copy is worth mining for the five detail pages; it is in git history.

**Technical, not yet done**

- Custom domain not connected. Paths are deliberately relative and
  depth-correct so the site works on `github.io` *and* on the domain with no
  changes.
- No Open Graph or Twitter tags. Links shared to LinkedIn or Slack render
  bare.
- No canonical tags, no `sitemap.xml`, no `robots.txt`.

---

## Pushing

```
cd ~/Downloads/Claude/revhops.com
git add -A
git commit -m "…"
git push
```

`git add -A`, not `git add .` — this project has deleted files and only `-A`
stages removals.
