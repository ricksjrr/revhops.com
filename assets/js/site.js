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

  /* ---- current page highlight ---- */
  var here = location.pathname.split('/').pop() || 'index.html';
  Array.prototype.forEach.call(document.querySelectorAll('[data-nav-links] a'), function (a) {
    if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
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
      var floating = cz
        ? cz.getBoundingClientRect().top <= navRestHeight()
        : window.pageYOffset > 8;
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
