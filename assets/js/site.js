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
     URLs are folder-style (/services/), so comparing the last path segment
     no longer works — it is empty for every page. Resolve each link to an
     absolute path instead and normalise both sides before comparing, so
     /services, /services/ and /services/index.html all match. */
  function normalisePath(p) {
    return p.replace(/index\.html$/, '').replace(/\/*$/, '/');
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
         of the nav at rest. Measured against the resting height rather than
         the live one so the threshold does not move when the bar collapses
         and shrinks, which would make it oscillate at the boundary. */
      var cz = getClearZone();
      var floating;
      if (cz) {
        var line = navRestHeight();
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
   RevHops — theme toggle

   Theme is a single data-theme attribute on <html>; all the colour work is
   a token swap in site.css. The value is remembered in localStorage and
   applied by a small blocking script in <head> so there is no flash. If the
   visitor has never chosen, that script falls back to their own clock.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var STORE = 'revhops-theme';
  var toggles = document.querySelectorAll('[data-theme-toggle]');
  if (!toggles.length) return;

  function isDark() { return root.getAttribute('data-theme') === 'dark'; }

  function syncToggles() {
    Array.prototype.forEach.call(toggles, function (b) {
      b.setAttribute('aria-checked', isDark() ? 'true' : 'false');
      b.setAttribute('aria-label', isDark() ? 'Light mode' : 'Dark mode');
    });
  }

  function setTheme(dark) {
    if (dark) root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    try { localStorage.setItem(STORE, dark ? 'dark' : 'light'); } catch (e) { /* private mode */ }
    /* the clock only decides for visitors who have never chosen */
    root.removeAttribute('data-theme-auto');
    syncToggles();

    /* let the hero swap its headline and its thumb mark; it owns its own copy */
    try {
      document.dispatchEvent(new CustomEvent('revhops:theme', { detail: { dark: dark } }));
    } catch (err) { /* the attribute is set either way */ }
  }

  Array.prototype.forEach.call(toggles, function (b) {
    b.addEventListener('click', function () { setTheme(!isDark()); });
  });

  syncToggles();
})();

/* ==========================================================================
   RevHops — warm rules sized from the heading above them

   Every warm rule is 60% of the width of its heading's text. CSS cannot do
   this: a rule is a sibling of the heading, and there is no selector or unit
   that reads another element's rendered text width.

   The measurement is taken with a Range over the heading's contents rather
   than getBoundingClientRect() on the heading itself. The element is a block,
   so its box is the full column width whatever the text does; the Range
   returns one rect per line box, and the widest of those is the actual
   length of the sentence.

   Re-runs on resize, once webfonts land, and after the hero module has
   injected its own headings.
   ========================================================================== */
(function () {
  'use strict';

  var RATIO = 0.6;
  var pairs = [];

  function headingFor(hr) {
    /* nearest preceding element that actually carries text */
    var el = hr.previousElementSibling;
    while (el && !el.textContent.trim()) el = el.previousElementSibling;
    return el;
  }

  function collect() {
    pairs = [];
    Array.prototype.forEach.call(document.querySelectorAll('.warm-rule'), function (hr) {
      var head = headingFor(hr);
      if (head) pairs.push({ hr: hr, head: head });
    });
  }

  /* Three ways to measure, best first. Range.getClientRects gives one rect
     per line box, so the widest is the true length of the sentence. Not every
     environment implements it, so fall back to the range's bounding box, then
     to the element's own box — which is the block width, wider than the text,
     but never throws and never leaves a rule at zero. */
  function textWidth(el) {
    try {
      if (document.createRange) {
        var range = document.createRange();
        range.selectNodeContents(el);

        if (range.getClientRects) {
          var rects = range.getClientRects();
          var w = 0;
          for (var i = 0; i < rects.length; i++) {
            if (rects[i].width > w) w = rects[i].width;
          }
          if (range.detach) range.detach();
          if (w > 1) return w;
        }
        if (range.getBoundingClientRect) {
          var b = range.getBoundingClientRect();
          if (b && b.width > 1) return b.width;
        }
      }
    } catch (err) { /* fall through to the element's own box */ }

    return el.getBoundingClientRect ? el.getBoundingClientRect().width : 0;
  }

  function apply() {
    for (var i = 0; i < pairs.length; i++) {
      var w = textWidth(pairs[i].head);
      /* a hidden or not-yet-laid-out heading measures 0; leave the CSS
         default alone rather than collapsing the rule to nothing */
      if (w > 1) pairs[i].hr.style.width = Math.round(w * RATIO) + 'px';
    }
  }

  function sync() { collect(); apply(); }

  var t;
  function debounced() { clearTimeout(t); t = setTimeout(sync, 120); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sync);
  } else {
    sync();
  }
  window.addEventListener('load', sync);
  window.addEventListener('resize', debounced);

  /* webfonts change the measurement, so take it again once they are in */
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
    document.fonts.ready.then(sync);
  }
  /* the hero module writes its headings after this file runs */
  setTimeout(sync, 500);

  window.revhopsSyncRules = sync;
})();

/* ==========================================================================
   RevHops — case study rail

   The rail scrolls natively, so a trackpad, a swipe and the keyboard all
   work with no help. This only wires the two nudge buttons and keeps them
   disabled at the ends, so they never look live when they would do nothing.
   ========================================================================== */
(function () {
  'use strict';

  var rail = document.querySelector('[data-case-rail]');
  var prev = document.querySelector('[data-case-prev]');
  var next = document.querySelector('[data-case-next]');
  if (!rail || !prev || !next) return;

  /* one card plus one gap, measured rather than assumed, so the clamps in
     the stylesheet can change without this needing to know */
  function step() {
    var card = rail.querySelector('.case-card');
    if (!card) return rail.clientWidth * 0.8;
    var gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
    return card.getBoundingClientRect().width + gap;
  }

  function sync() {
    var max = rail.scrollWidth - rail.clientWidth;
    /* a pixel of slack: sub-pixel layout means scrollLeft rarely lands
       exactly on 0 or on max */
    prev.disabled = rail.scrollLeft <= 1;
    next.disabled = rail.scrollLeft >= max - 1;
  }

  prev.addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: 'smooth' }); });
  next.addEventListener('click', function () { rail.scrollBy({ left:  step(), behavior: 'smooth' }); });

  rail.addEventListener('scroll', function () {
    window.requestAnimationFrame(sync);
  }, { passive: true });
  window.addEventListener('resize', sync);
  sync();
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
