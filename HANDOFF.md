# RevHops site — handoff

Read this first, then `README.md` for the mechanics. This file is the state
of play; the README is how the thing is built.

**Folder:** `~/Downloads/Claude/revhops.com` — this folder *is* the site.
**Deadline:** live by 14 September 2026.
**Current build stamp:** `202609091500`

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
- **Prices are plausible placeholders**, chosen because James asked for
  numbers rather than `[$X]` slots. They are not figures he gave us. Check
  them before launch.
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
