/* ==========================================================================
   RevHops — shared site behaviour
   nav · scroll progress · parallax · reveal-on-scroll · counters · FAQ
   All motion is skipped under prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- mobile nav ---- */
  var toggle = document.querySelector('[data-nav-toggle]');
  var links = document.querySelector('[data-nav-links]');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- current page highlight ----
     Pages are flat files at the root (/services.html). Resolve each link
     to an absolute path and normalise both sides before comparing, so
     /services.html, /services and /services/ all match — GitHub Pages
     serves the same file for all three, and the extensionless form is what
     a shared link usually looks like. */
  function normalisePath(p) {
    return p.replace(/(?:index)?\.html$/, '').replace(/\/*$/, '/');
  }
  var here = normalisePath(location.pathname);
  Array.prototype.forEach.call(document.querySelectorAll('[data-nav-links] a'), function (a) {
    var target;
    try {
      target = normalisePath(new URL(a.getAttribute('href'), location.href).pathname);
    } catch (err) {
      return; /* older browsers without URL: skip the highlight, nothing breaks */
    }
    if (target === here) a.setAttribute('aria-current', 'page');
  });

  /* ---- elements driven by the scroll loop ---- */
  var nav = document.querySelector('[data-nav]');

  /* On the homepage the marked element is the headline, which the slider
     module renders after this file runs, so it is resolved lazily and then
     cached. Once the document is parsed we stop looking. */
  var clearZone = null;
  var clearZoneSettled = false;
  function getClearZone() {
    if (!clearZone && !clearZoneSettled) {
      clearZone = document.querySelector('[data-nav-clear]');
    }
    return clearZone;
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      clearZone = document.querySelector('[data-nav-clear]');
      clearZoneSettled = true;
      frame();
    });
  } else {
    clearZoneSettled = true;
    clearZone = document.querySelector('[data-nav-clear]');
  }
  var parallax = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'))
    .map(function (el) {
      /* the block whose travel through the viewport drives this element.
         defaults to its positioning context; override with data-parallax-host */
      var sel = el.getAttribute('data-parallax-host');
      var host = sel && el.closest ? el.closest(sel) : null;
      return {
        el: el,
        speed: parseFloat(el.getAttribute('data-parallax')) || 0,
        /* optional: how much the element grows across the host's travel.
           0.5 means it ends 50% larger. negative shrinks it. */
        grow: parseFloat(el.getAttribute('data-parallax-grow')) || 0,
        host: host || el.offsetParent || el.parentElement
      };
    });

  /* Scroll-linked entrances. The element trails the page as it comes up from
     below, then locks into its natural position once it reaches its settle
     line. `up` rises from the bottom edge, `right` comes in from the side. */
  var enters = Array.prototype.slice.call(document.querySelectorAll('[data-enter]'))
    .map(function (el) {
      return {
        el: el,
        dir: el.getAttribute('data-enter') || 'up',
        settle: parseFloat(el.getAttribute('data-enter-settle')) || 0.55,
        ease: parseFloat(el.getAttribute('data-enter-ease')) || 0.9
      };
    });

  var ticking = false;

  var NAV_HYSTERESIS = 90;   /* px of slack around the collapse threshold */

  /* The floating bar sits --nav-float-gap (20px) off the top and is 72px
     tall, so its bottom edge is 12px LOWER than the resting bar's. Without
     that 12px the collapse fires exactly as the title reaches the resting
     bar's baseline and the new bar lands on top of it. */
  var NAV_CLEAR_PAD = 12;

  /* The nav's height in its resting state, from the --nav-h token. This is
     the fixed line the headline has to reach; reading the element's own
     height instead would give a different answer once it has collapsed. */
  var navRest = null;
  function navRestHeight() {
    if (navRest === null) {
      var v = parseFloat(getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-h'));
      navRest = isNaN(v) ? 86 : v;
    }
    return navRest;
  }
  window.addEventListener('resize', function () { navRest = null; });

  /* Phones scroll a shorter hero, so the same speeds cover less ground.
     Scale them up, but modestly — the base speeds are already high enough
     that the discs sweep right across the hero on desktop. */
  function parallaxBoost() {
    return window.innerWidth < 1000 ? 1.55 : 1;
  }

  function frame() {
    ticking = false;
    var vh = window.innerHeight;
    var boost = parallaxBoost();

    /* The nav has no surface while it sits over the opening section, so the
       hero disc runs through it. Once that section has scrolled past it
       collapses into the floating navy bar. */
    if (nav) {
      /* Collapses the moment the nav band would start covering the marked
         headline — that is, when the headline's top edge reaches the bottom
         edge the bar will have once it has collapsed.

         data-nav-clear is on the PAGE TITLE on every page, since 12
         September. It used to sit on a zero-height sentinel at the foot of
         the opening band on everything but the homepage, which meant the bar
         stayed transparent for the whole header and the copy in it scrolled
         up through the navigation links. Measured against the resting height rather than
         the live one so the threshold does not move when the bar collapses
         and shrinks, which would make it oscillate at the boundary. */
      var cz = getClearZone();
      var floating;
      if (cz) {
        var line = navRestHeight() + NAV_CLEAR_PAD;
        var top = cz.getBoundingClientRect().top;
        /* Hysteresis. Once collapsed, the headline has to travel back down
           past the line by a clear margin before the bar expands again.
           Without it, a slow scroll sitting right on the threshold flips the
           bar open and shut on every frame, which is most of what made the
           change feel jumpy. */
        floating = nav.classList.contains('is-floating')
          ? top <= line + NAV_HYSTERESIS
          : top <= line;
      } else {
        floating = window.pageYOffset > 8;
      }
      nav.classList.toggle('is-floating', floating);
    }

    if (!reduce) {
      for (var i = 0; i < parallax.length; i++) {
        var p = parallax[i];
        var host = p.host || p.el;
        var r = host.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) continue;

        /* how far this block's centre sits from the viewport centre */
        var offset = (r.top + r.height / 2) - vh / 2;
        var t = 'translate3d(0,' + (-offset * p.speed * boost).toFixed(1) + 'px,0)';

        if (p.grow) {
          /* 0 as the host enters the viewport, 1 as it leaves */
          var prog = (vh - r.top) / (vh + r.height);
          prog = prog < 0 ? 0 : (prog > 1 ? 1 : prog);
          t += ' scale(' + (1 + p.grow * prog * boost).toFixed(3) + ')';
        }
        p.el.style.transform = t;
      }

      for (var j = 0; j < enters.length; j++) {
        var e = enters[j];
        var er = e.el.getBoundingClientRect();
        /* only skip once it is well above; skipping while it is still far
           below would leave it un-faded and make it pop on approach */
        if (er.bottom < -vh) continue;

        var settleY = vh * e.settle;
        var lag = er.top > settleY ? (er.top - settleY) * e.ease : 0;

        e.el.style.transform = e.dir === 'right'
          ? 'translate3d(' + lag.toFixed(1) + 'px,0,0)'
          : 'translate3d(0,' + lag.toFixed(1) + 'px,0)';

        /* fade over the last stretch so it does not just slide in flat */
        var fade = 1 - Math.min(lag / (vh * 0.42), 1);
        e.el.style.opacity = fade.toFixed(3);
      }
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();

  /* ---- reveal on scroll ---- */
  var reveals = document.querySelectorAll('.reveal, .rail');
  if (reveals.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

      /* stagger siblings inside the same grid or stack */
      Array.prototype.forEach.call(reveals, function (el) {
        var sibs = el.parentElement
          ? Array.prototype.filter.call(el.parentElement.children, function (c) {
              return c.classList.contains('reveal');
            })
          : [el];
        var k = sibs.indexOf(el);
        if (k > 0) el.style.transitionDelay = Math.min(k, 5) * 85 + 'ms';
        io.observe(el);
      });
    }
  }

  /* ---- number counters ---- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(counters, function (el) {
        el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || '');
      });
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          cio.unobserve(el);
          var target = parseFloat(el.getAttribute('data-count')) || 0;
          var suffix = el.getAttribute('data-suffix') || '';
          var dur = 1400;
          var t0 = null;
          (function step(ts) {
            if (t0 === null) t0 = ts;
            var t = Math.min((ts - t0) / dur, 1);
            var eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (t < 1) requestAnimationFrame(step);
          })(performance.now());
        });
      }, { threshold: 0.5 });
      Array.prototype.forEach.call(counters, function (el) {
        el.textContent = '0' + (el.getAttribute('data-suffix') || '');
        cio.observe(el);
      });
    }
  }

  /* ---- FAQ accordions ---- */
  Array.prototype.forEach.call(document.querySelectorAll('.faq-q'), function (btn) {
    var panel = btn.nextElementSibling;
    if (!panel) return;
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      panel.style.maxHeight = open ? '0px' : panel.scrollHeight + 'px';
    });
  });

  /* ---- year stamp ---- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) {
    el.textContent = new Date().getFullYear();
  });
})();

/* ==========================================================================
   RevHops — case rail arrows

   The rail is a plain scroll container: a trackpad swipe, a touch drag and
   the arrow keys all work with nothing from us, and scrolling down the page
   does what it says. This only wires the two nudge buttons and keeps them
   disabled at each end, so they never look live when they would do nothing.

   The step is one card plus one gap, measured off the DOM rather than
   assumed, so the clamps in the stylesheet can change without this needing
   to know. Falls back to 70% of the visible width if there is nothing to
   measure.

   The pinned version that drove this rail from the page scroll was removed
   on 4 September. If it ever comes back, it belongs in its own module.
   ========================================================================== */
(function () {
  'use strict';

  var rail = document.querySelector('[data-case-rail]');
  var prev = document.querySelector('[data-case-prev]');
  var next = document.querySelector('[data-case-next]');
  if (!rail || !prev || !next) return;

  function step() {
    var card = rail.querySelector('.case-card');
    if (!card) return Math.round(rail.clientWidth * 0.7);
    var gap = parseFloat(getComputedStyle(rail).columnGap || getComputedStyle(rail).gap);
    if (isNaN(gap)) gap = 0;
    return Math.round(card.getBoundingClientRect().width + gap);
  }

  function sync() {
    /* 2px of slack: scrollLeft is fractional on a zoomed or scaled display,
       so an exact comparison leaves a button live at the end of the rail */
    var max = rail.scrollWidth - rail.clientWidth;
    prev.disabled = rail.scrollLeft <= 2;
    next.disabled = rail.scrollLeft >= max - 2;
  }

  function nudge(dir) {
    var to = rail.scrollLeft + dir * step();
    if (rail.scrollBy) rail.scrollBy({ left: dir * step(), behavior: 'smooth' });
    else rail.scrollLeft = to;
  }

  prev.addEventListener('click', function () { nudge(-1); });
  next.addEventListener('click', function () { nudge(1); });

  var ticking = false;
  rail.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { ticking = false; sync(); });
  }, { passive: true });

  window.addEventListener('resize', sync);
  window.addEventListener('load', sync);
  sync();
})();

/* ==========================================================================
   RevHops — portrait tilt

   Writes --tx and --ty on [data-tilt] in the range -1 to 1, and nothing
   else. Which way the element leans, how far, and how it eases are all
   decisions for the stylesheet — this only reports where the pointer is.

   The sign is not negated here: "tilt away" is expressed in the transform,
   where a positive rotateY already pushes the right edge back.
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  Array.prototype.forEach.call(document.querySelectorAll('[data-tilt]'), function (el) {
    function move(e) {
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      var ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      el.style.setProperty('--tx', nx.toFixed(3));
      el.style.setProperty('--ty', ny.toFixed(3));
    }
    function reset() {
      el.style.setProperty('--tx', '0');
      el.style.setProperty('--ty', '0');
    }
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', reset);
    el.addEventListener('pointercancel', reset);
  });
})();

/* ==========================================================================
   RevHops — back to top

   Appears the moment the marked section first comes into view and stays for
   the rest of the page. A threshold rather than a one-shot: scroll back up
   above it and the button leaves again, so it is never sitting there while
   you are already at the top.

   Driven by the element's position rather than an IntersectionObserver,
   because the observer only fires on threshold crossings — once the section
   has scrolled off the top it stops intersecting, and the button would
   vanish exactly where it is most useful.
   ========================================================================== */
(function () {
  'use strict';

  var btn = document.querySelector('[data-to-top]');
  if (!btn) return;

  var trigger = document.querySelector('[data-top-trigger]');
  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function shouldShow() {
    if (trigger) {
      /* the section's top edge has reached the lower part of the viewport,
         i.e. you can just see it */
      return trigger.getBoundingClientRect().top <= window.innerHeight * 0.9;
    }
    /* pages with no tool section fall back to a plain distance */
    return window.pageYOffset > window.innerHeight * 1.2;
  }

  var ticking = false;
  function check() {
    ticking = false;
    btn.classList.toggle('is-on', shouldShow());
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(check);
  }

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  check();
})();

/* ==========================================================================
   RevHops — light / dark

   Rebuilt 7 September. The whole of the previous theme was deleted on the
   4th, so this is a second attempt rather than a restore.

   The module is deliberately small, because the interesting half runs
   earlier: the inline script in the head sets data-theme before the first
   paint, so there is no flash. All this does is flip the attribute, save
   the choice, and keep the button's accessible state honest.

   The button carries aria-pressed rather than a changing label alone: a
   toggle that reports its own state is what a screen reader expects, and
   the label then only has to say what pressing it will do.

   localStorage is wrapped: Safari in private mode throws on write rather
   than failing quietly, and a theme toggle is not worth an exception that
   stops every module after it.
   ========================================================================== */
(function () {
  'use strict';

  var btn = document.querySelector('[data-theme-toggle]');
  if (!btn) return;

  var root = document.documentElement;

  function sync() {
    var dark = root.getAttribute('data-theme') === 'dark';
    btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    btn.setAttribute('aria-label', dark ? 'Switch to the light theme'
                                        : 'Switch to the dark theme');
  }

  btn.addEventListener('click', function () {
    var dark = root.getAttribute('data-theme') !== 'dark';
    if (dark) root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    try {
      localStorage.setItem('revhops-theme', dark ? 'dark' : 'light');
    } catch (e) { /* the theme still changes, it just will not be remembered */ }
    sync();
  });

  sync();
})();

/* ==========================================================================
   RevHops — case study filters

   Five checkboxes over the rail. Every card carries data-services, a space
   separated list of the service slugs it belongs to, and a card shows when
   it matches ANY checked box. All five start checked, so the page loads
   showing everything and the control only ever removes.

   One box always stays on. An empty rail is not a state worth being able to
   reach, so the last checked box locks: the click is ignored and the chip
   stops advertising the interaction. data-locked is written by apply()
   rather than by the handler, so the DOM says which one is held and the
   stylesheet reads the same attribute.

   The rail's own arrow module measures the cards it can see and re-syncs on
   resize, so filtering fires a resize rather than reaching into it. That
   keeps the two modules independent: either can be replaced without the
   other knowing.

   No URL state and no persistence, on purpose — this page's filter is a
   glance, not a saved view. The Case studies page is where that belongs.
   ========================================================================== */
(function () {
  'use strict';

  var box = document.querySelector('[data-case-filters]');
  var rail = document.querySelector('[data-case-rail]');
  if (!box || !rail) return;

  var chips = Array.prototype.slice.call(box.querySelectorAll('[data-service]'));
  var cards = Array.prototype.slice.call(rail.querySelectorAll('[data-services]'));
  if (!chips.length || !cards.length) return;

  function checked(chip) { return chip.getAttribute('aria-checked') === 'true'; }

  function apply() {
    var on = chips.filter(checked);
    var slugs = on.map(function (c) { return c.getAttribute('data-service'); });

    cards.forEach(function (card) {
      var tags = (card.getAttribute('data-services') || '').split(/\s+/);
      card.hidden = !slugs.some(function (s) { return tags.indexOf(s) !== -1; });
    });

    /* the last one on is held, and says so */
    chips.forEach(function (chip) {
      if (on.length === 1 && checked(chip)) {
        chip.setAttribute('data-locked', '');
        chip.setAttribute('aria-disabled', 'true');
      } else {
        chip.removeAttribute('data-locked');
        chip.removeAttribute('aria-disabled');
      }
    });

    /* back to the first visible card, then let the arrows re-measure */
    rail.scrollLeft = 0;
    window.dispatchEvent(new Event('resize'));
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      if (chip.hasAttribute('data-locked')) return;
      chip.setAttribute('aria-checked', checked(chip) ? 'false' : 'true');
      apply();
    });
  });

  apply();
})();

/* ==========================================================================
   CASE STUDIES INDEX — the five-axis filter

   The rule is OR inside a group, AND across groups. Tick Growth and
   Maturity and you get both; tick Growth and eCommerce and you get the
   overlap. A group with nothing ticked does not constrain anything, which
   is why the page opens showing everything.

   Service is the exception that proves it: it loads with all five ticked,
   which under that rule is the same result as none ticked, and the last one
   still on locks so the shelf cannot be emptied from the group that is
   meant to be the default view.

   The matcher knows nothing about the axes. Each option carries
   data-group / data-field / data-val, and each card carries a data-
   attribute per field holding a space-separated token list. Adding an axis
   is markup only: a new group in tools/build-pages.js and a matching data-
   attribute on the cards.

   Nothing is drawn when the grid comes back empty. The count line above it
   reads "Showing 0 of 5" and Clear filters sits at the top of the column
   the visitor just used — a panel in the grid said both those things again
   and pushed the controls off the screen.

   No URL state and no persistence, as asked: the filter clears on reload
   and does not follow the visitor to another page.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.querySelector('[data-cs-filters]');
  var grid = document.querySelector('[data-cs-grid]');
  if (!root || !grid) return;

  var opts = Array.prototype.slice.call(root.querySelectorAll('[data-group]'));
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.case-card'));
  var clears = Array.prototype.slice.call(document.querySelectorAll('[data-cs-clear]'));
  var count = document.querySelector('[data-cs-count]');
  if (!opts.length || !cards.length) return;

  /* what each option looked like on load, so Clear can put it back */
  opts.forEach(function (o) {
    o.setAttribute('data-default', o.getAttribute('aria-checked'));
  });

  function on(o) { return o.getAttribute('aria-checked') === 'true'; }

  function tokens(card, field) {
    return (card.getAttribute('data-' + field) || '').split(/\s+/);
  }

  /* the ticked options, grouped: { service: {field:'services', vals:[...]}, ... } */
  function selection() {
    var groups = {};
    opts.forEach(function (o) {
      if (!on(o)) return;
      var g = o.getAttribute('data-group');
      if (!groups[g]) groups[g] = { field: o.getAttribute('data-field'), vals: [] };
      groups[g].vals.push(o.getAttribute('data-val'));
    });
    return groups;
  }

  function apply() {
    var groups = selection();
    var shown = 0;

    cards.forEach(function (card) {
      var ok = Object.keys(groups).every(function (g) {
        var tags = tokens(card, groups[g].field);
        return groups[g].vals.some(function (v) { return tags.indexOf(v) !== -1; });
      });
      card.hidden = !ok;
      if (ok) shown++;
    });

    /* the last service still on is held, and says so */
    var svc = opts.filter(function (o) { return o.getAttribute('data-group') === 'service'; });
    var svcOn = svc.filter(on);
    svc.forEach(function (o) {
      if (svcOn.length === 1 && on(o)) {
        o.setAttribute('data-locked', '');
        o.setAttribute('aria-disabled', 'true');
      } else {
        o.removeAttribute('data-locked');
        o.removeAttribute('aria-disabled');
      }
    });

    /* Clear goes quiet when there is nothing to clear */
    var touched = opts.some(function (o) {
      return String(on(o)) !== o.getAttribute('data-default');
    });
    clears.forEach(function (b) {
      if (touched) b.removeAttribute('data-idle');
      else b.setAttribute('data-idle', '');
    });

    if (count) {
      count.textContent = shown === cards.length
        ? 'Showing all ' + cards.length + ' case studies'
        : 'Showing ' + shown + ' of ' + cards.length + ' case studies';
    }
  }

  opts.forEach(function (o) {
    o.addEventListener('click', function () {
      if (o.hasAttribute('data-locked')) return;
      o.setAttribute('aria-checked', on(o) ? 'false' : 'true');
      apply();
    });
  });

  clears.forEach(function (b) {
    b.addEventListener('click', function () {
      opts.forEach(function (o) {
        o.setAttribute('aria-checked', o.getAttribute('data-default'));
      });
      apply();
      root.scrollTop = 0;
    });
  });

  apply();
})();

/* ==========================================================================
   RESOURCES — the type filter

   One row of choices, single selection, All by default. It shows and hides
   whole SECTIONS rather than individual cards, which is the honest reading
   of a page that is a shelf of shelves: filtering to Videos should leave
   you on the videos shelf, not on five headings with one card under each.

   It reads data-res-pick and data-res-section and nothing else, so a sixth
   resource type is a sixth pair of those in the markup and no change here.
   ========================================================================== */
(function () {
  var box = document.querySelector('[data-res-filter]');
  if (!box) return;

  var tabs = Array.prototype.slice.call(box.querySelectorAll('[data-res-pick]'));
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-res-section]'));
  if (!tabs.length || !sections.length) return;

  function pick(val) {
    tabs.forEach(function (t) {
      t.setAttribute('aria-pressed', t.getAttribute('data-res-pick') === val ? 'true' : 'false');
    });
    sections.forEach(function (s) {
      s.hidden = !(val === 'all' || s.getAttribute('data-res-section') === val);
    });
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () { pick(t.getAttribute('data-res-pick')); });
  });

  /* A link to /resources#videos lands on the videos shelf with the filter
     already set, rather than on the whole page scrolled to a heading. */
  var hash = (location.hash || '').replace('#', '');
  if (hash && sections.some(function (s) { return s.getAttribute('data-res-section') === hash; })) {
    pick(hash);
  }
})();

/* ==========================================================================
   RESOURCES — pagination

   Any shelf whose markup contains a pager pages through its own cards in
   groups of data-res-per. Each shelf runs its own instance, so two of them
   on a page do not share a page number.

   The cards are HIDDEN rather than removed, which keeps the reveal
   animation, the DOM order and anything else looking at them intact. The
   buttons are disabled rather than hidden at the ends of the run: a control
   that disappears moves the one beside it.
   ========================================================================== */
Array.prototype.forEach.call(document.querySelectorAll('[data-res-pager]'), function (pager) {
  var shelf = pager.closest ? pager.closest('[data-res-section]') : null;
  var grid = shelf && shelf.querySelector('[data-res-grid]');
  if (!grid) return;

  var cards = Array.prototype.slice.call(grid.children);
  var per = parseInt(grid.getAttribute('data-res-per'), 10) || 8;
  var pages = Math.ceil(cards.length / per) || 1;
  if (pages < 2) return;

  var prev = pager.querySelector('[data-res-prev]');
  var next = pager.querySelector('[data-res-next]');
  var label = pager.querySelector('[data-res-page-count]');
  var page = 0;

  function draw() {
    cards.forEach(function (c, i) {
      c.hidden = Math.floor(i / per) !== page;
    });
    if (label) label.textContent = 'Page ' + (page + 1) + ' of ' + pages;
    if (prev) prev.disabled = page === 0;
    if (next) next.disabled = page === pages - 1;
  }

  function go(delta) {
    var wanted = Math.min(pages - 1, Math.max(0, page + delta));
    if (wanted === page) return;
    page = wanted;
    draw();
    /* back to the top of the shelf, not the top of the page: the row you
       just replaced is the thing you want to be looking at */
    shelf.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  if (prev) prev.addEventListener('click', function () { go(-1); });
  if (next) next.addEventListener('click', function () { go(1); });
  draw();
});

/* ==========================================================================
   RESOURCES — the video lightbox

   Every ungated video card is a <button data-video="youtube id">, and one
   <dialog> serves all of them.

   THE IFRAME IS BUILT ON OPEN AND DESTROYED ON CLOSE. Setting the src once
   and leaving it there keeps YouTube playing behind a closed dialog, which
   is audible; clearing the src alone leaves a dead iframe holding a network
   connection. Replacing the whole element is the only version of this that
   reliably stops the sound.

   showModal() gives the focus trap, the backdrop and Escape for free. If
   the browser has no <dialog> — which now means a very old one — the card
   does nothing rather than throwing, and the gated route is unaffected.
   ========================================================================== */
(function () {
  var dlg = document.querySelector('[data-res-lightbox]');
  var frame = dlg && dlg.querySelector('[data-res-lightbox-frame]');
  if (!dlg || !frame || typeof dlg.showModal !== 'function') return;

  var closer = dlg.querySelector('[data-res-lightbox-close]');

  function open(id) {
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
            '?autoplay=1&rel=0&modestbranding=1';
    f.title = 'Video';
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture';
    f.allowFullscreen = true;
    frame.textContent = '';
    frame.appendChild(f);
    dlg.showModal();
  }

  function shut() { if (dlg.open) dlg.close(); }

  Array.prototype.forEach.call(document.querySelectorAll('[data-video]'), function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      open(el.getAttribute('data-video'));
    });
  });

  if (closer) closer.addEventListener('click', shut);

  /* Clicking the backdrop closes it. The dialog's own box is the frame, so
     a click landing on the dialog element itself is a click outside it. */
  dlg.addEventListener('click', function (e) { if (e.target === dlg) shut(); });

  /* Fires for the close button, for Escape and for the backdrop alike, so
     the iframe is torn down once rather than in three places. */
  dlg.addEventListener('close', function () { frame.textContent = ''; });
})();

/* ==========================================================================
   RevHops — testimonial carousel (phone only)

   Three quotes stacked vertically was most of the length of the foot of the
   page on a phone. Below 760px the stylesheet turns .testi into a snap
   scroller; this adds the three dots under it and advances it every ten
   seconds.

   Progressive: with no script the row is still swipeable and the dots are
   simply absent, which is why the markup for them is not in the HTML. It
   also means the homepage and the generated pages both get this without the
   two footers or the two testimonial blocks having to be edited in step.

   The timer stops for good the moment somebody touches the thing — dragging,
   clicking a dot, or focusing a quote. An auto-advance that fights the
   reader is worse than no auto-advance, and it never restarts because there
   is no way to tell "finished reading" from "paused on this one".
   ========================================================================== */
(function () {
  'use strict';

  var rail = document.querySelector('.testi');
  if (!rail) return;

  var slides = [].slice.call(rail.querySelectorAll('.testi-col'));
  if (slides.length < 2) return;

  var phone = window.matchMedia('(max-width: 760px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* the dots, built once and shown by CSS only at phone width */
  var dots = document.createElement('div');
  dots.className = 'testi-dots';
  dots.setAttribute('role', 'tablist');
  dots.setAttribute('aria-label', 'Choose a testimonial');

  var buttons = slides.map(function (slide, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'testi-dot';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-current', i === 0 ? 'true' : 'false');
    var who = slide.querySelector('cite');
    b.setAttribute('aria-label', who ? 'Show the quote from ' + who.textContent.split('|')[0].trim()
                                     : 'Show quote ' + (i + 1));
    b.addEventListener('click', function () { stop(); go(i); });
    dots.appendChild(b);
    return b;
  });
  rail.parentNode.insertBefore(dots, rail.nextSibling);

  var current = 0;

  function go(i) {
    current = (i + slides.length) % slides.length;
    /* scrollLeft rather than scrollIntoView: the latter also scrolls the
       PAGE to bring the rail into view, which yanks the reader down to the
       testimonials from wherever they actually were. */
    rail.scrollLeft = slides[current].offsetLeft - slides[0].offsetLeft;
    mark();
  }

  function mark() {
    buttons.forEach(function (b, i) {
      b.setAttribute('aria-current', i === current ? 'true' : 'false');
    });
  }

  /* keep the dots honest when the reader swipes instead of tapping */
  var settling;
  rail.addEventListener('scroll', function () {
    clearTimeout(settling);
    settling = setTimeout(function () {
      var x = rail.scrollLeft + rail.clientWidth / 2;
      var nearest = 0, best = Infinity;
      slides.forEach(function (s, i) {
        var mid = s.offsetLeft - slides[0].offsetLeft + s.clientWidth / 2;
        var d = Math.abs(mid - x);
        if (d < best) { best = d; nearest = i; }
      });
      if (nearest !== current) { current = nearest; mark(); }
    }, 90);
  }, { passive: true });

  var timer = null;
  function start() {
    if (timer || reduce.matches || !phone.matches) return;
    timer = setInterval(function () { go(current + 1); }, 10000);
  }
  function stop() {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  }

  ['pointerdown', 'touchstart', 'keydown', 'focusin'].forEach(function (ev) {
    rail.addEventListener(ev, stop, { passive: true });
  });

  /* only running while the page is actually on screen */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  if (phone.addEventListener) {
    phone.addEventListener('change', function () { stop(); if (phone.matches) start(); });
  }

  start();
})();
