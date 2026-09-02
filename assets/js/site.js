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

/* ==========================================================================
   RevHops — theme toggle and the lo-fi track

   Theme is a single data-theme attribute on <html>; all the colour work is
   a token swap in site.css. The value is remembered in localStorage and
   applied by a small blocking script in <head> so there is no flash.

   The music is SYNTHESISED, not a file. There is no audio asset in the repo
   and none is licensed — this generates a slow four-chord loop through a
   lowpass filter with a little vinyl hiss, using the Web Audio API. To use
   a real recording instead, see the note by startAudio().
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var STORE = 'revhops-theme';
  var toggles = document.querySelectorAll('[data-theme-toggle]');
  var audioBtns = document.querySelectorAll('[data-audio-toggle]');
  if (!toggles.length) return;

  function isDark() { return root.getAttribute('data-theme') === 'dark'; }

  function syncToggles() {
    Array.prototype.forEach.call(toggles, function (b) {
      b.setAttribute('aria-checked', isDark() ? 'true' : 'false');
      b.setAttribute('aria-label', isDark() ? 'Light mode' : 'Dark mode');
    });
  }

  /* ---------------- the track ----------------
     Four bars, one chord each, voiced as lazy sevenths, with a slow beat
     under them and a bed of vinyl noise over the top. Frequencies rather
     than note names so there is no lookup table to get wrong.

     Two buses feed the master: the pads run through a 900Hz lowpass, which
     is most of what makes a synth chord read as "lo-fi" rather than "hold
     music", and the drums through a gentler 3200Hz one so the hats survive
     without turning bright. */
  var CHORDS = [
    [146.83, 220.00, 261.63, 329.63],  /* Dm7   */
    [130.81, 196.00, 246.94, 329.63],  /* Cmaj7 */
    [174.61, 220.00, 261.63, 349.23],  /* Fmaj7 */
    [196.00, 246.94, 293.66, 392.00]   /* G     */
  ];
  var BEAT = 0.8;                      /* 75bpm */
  var BEATS = 8;                       /* per chord */
  var BAR = BEAT * BEATS;              /* 6.4s */
  var VOLUME = 0.094;                  /* quiet enough to sit under reading */

  var ctx = null, master = null, padBus = null, drumBus = null;
  var noiseBuf = null, hiss = null, timer = null, playing = false;

  function makeNoise(seconds, amp) {
    var len = Math.floor(ctx.sampleRate * seconds);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * amp;
    return buf;
  }

  function bus(cutoff, gain) {
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = cutoff;
    lp.Q.value = 0.6;
    var g = ctx.createGain();
    g.gain.value = gain;
    lp.connect(g); g.connect(master);
    return lp;
  }

  function buildGraph() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();

    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    padBus  = bus(900, 1);
    drumBus = bus(3200, 0.9);
    noiseBuf = makeNoise(2, 0.35);

    /* the constant surface noise */
    hiss = ctx.createBufferSource();
    hiss.buffer = noiseBuf;
    hiss.loop = true;
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1400;
    var hg = ctx.createGain();
    hg.gain.value = 0.03;              /* was .014 — grittier */
    hiss.connect(hp); hp.connect(hg); hg.connect(master);
    hiss.start();
    return true;
  }

  /* a short burst of the noise buffer, shaped by a filter and an envelope.
     every percussive sound here is a variation on this. */
  function hit(at, opts) {
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    /* random offset so repeated hits are not identical samples */
    var off = Math.random() * 1.5;

    var f = ctx.createBiquadFilter();
    f.type = opts.type;
    f.frequency.value = opts.freq;
    if (opts.q) f.Q.value = opts.q;

    var g = ctx.createGain();
    g.gain.setValueAtTime(opts.gain, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + opts.decay);

    src.connect(f); f.connect(g); g.connect(opts.dry ? master : drumBus);
    src.start(at, off, opts.decay + 0.05);
    src.stop(at + opts.decay + 0.05);
  }

  /* soft round kick: a sine dropping in pitch, which is the whole trick */
  function kick(at) {
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(115, at);
    o.frequency.exponentialRampToValueAtTime(42, at + 0.13);
    g.gain.setValueAtTime(0.5, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.34);
    o.connect(g); g.connect(drumBus);
    o.start(at); o.stop(at + 0.36);
  }

  function snare(at) {
    hit(at, { type: 'bandpass', freq: 1750, q: 0.9, gain: 0.19, decay: 0.16 });
    /* a little body under the noise so it does not read as a hiss */
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(190, at);
    g.gain.setValueAtTime(0.1, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.12);
    o.connect(g); g.connect(drumBus);
    o.start(at); o.stop(at + 0.14);
  }

  function hat(at, open) {
    hit(at, {
      type: 'highpass', freq: 7200,
      gain: open ? 0.055 : 0.038,
      decay: open ? 0.17 : 0.045
    });
  }

  /* one chord: four detuned triangles with a long swell and a long tail */
  function playChord(notes, at) {
    notes.forEach(function (f, k) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      osc.detune.value = (k - 1.5) * 4;          /* a few cents apart, so it breathes */

      var peak = 0.16 / (k + 1.5);               /* upper voices quieter */
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(peak, at + 1.6);
      g.gain.setValueAtTime(peak, at + BAR - 2.2);
      g.gain.exponentialRampToValueAtTime(0.0001, at + BAR + 0.4);

      osc.connect(g); g.connect(padBus);
      osc.start(at);
      osc.stop(at + BAR + 0.6);
    });
  }

  /* Kick on 1 and 5 with a ghost before the turnaround, snare on 3 and 7,
     hats on the eighths with the offbeats quieter. Every hit is nudged a
     few milliseconds late and varies in level, because a grid that lands
     exactly on the beat every time is the thing that sounds programmed. */
  function playBeat(barAt, barIndex) {
    for (var b = 0; b < BEATS; b++) {
      var at = barAt + b * BEAT + (Math.random() * 0.018);
      if (b === 0 || b === 4) kick(at);
      if (b === 6 && barIndex === 3) kick(at + BEAT * 0.5);   /* turnaround */
      if (b === 2 || b === 6) snare(at);
      hat(at, b === 7);
      if (Math.random() > 0.45) hat(at + BEAT * 0.5, false);  /* offbeat, sometimes */
    }
    /* vinyl pops: a handful of clicks per bar, at random */
    var pops = 2 + Math.floor(Math.random() * 4);
    for (var p = 0; p < pops; p++) {
      hit(barAt + Math.random() * BAR, {
        type: 'highpass', freq: 900,
        gain: 0.02 + Math.random() * 0.03,
        decay: 0.012, dry: true
      });
    }
  }

  function scheduleCycle() {
    var at = ctx.currentTime + 0.1;
    CHORDS.forEach(function (c, i) {
      playChord(c, at + i * BAR);
      playBeat(at + i * BAR, i);
    });
    /* queue the next cycle just before this one runs out */
    timer = setTimeout(scheduleCycle, (CHORDS.length * BAR - 0.4) * 1000);
  }

  /* To use a real recording instead, drop the file in assets/audio/, replace
     everything from makeNoise() to here with an <audio loop> element, and
     keep the same fade in and out below. */
  function startAudio() {
    if (playing) return;
    if (!ctx && !buildGraph()) return;
    if (ctx.state === 'suspended') ctx.resume();
    playing = true;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(VOLUME, ctx.currentTime + 2.5);
    scheduleCycle();
    syncAudioBtns();
  }

  function stopAudio() {
    if (!playing || !ctx) return;
    playing = false;
    clearTimeout(timer);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    syncAudioBtns();
  }

  function syncAudioBtns() {
    Array.prototype.forEach.call(audioBtns, function (b) {
      b.classList.toggle('is-muted', !playing);
      b.setAttribute('aria-pressed', playing ? 'true' : 'false');
      b.setAttribute('aria-label', playing ? 'Mute background music' : 'Play background music');
    });
  }

  /* ---------------- wiring ---------------- */
  function setTheme(dark, fromUser) {
    if (dark) root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    try { localStorage.setItem(STORE, dark ? 'dark' : 'light'); } catch (e) { /* private mode */ }
    /* the clock only decides for visitors who have never chosen */
    root.removeAttribute('data-theme-auto');
    syncToggles();

    /* let the hero swap its headline; it owns its own copy */
    try {
      document.dispatchEvent(new CustomEvent('revhops:theme', { detail: { dark: dark } }));
    } catch (err) { /* the attribute is set either way */ }

    /* Audio only ever starts from a real click. On a page load that restores
       dark mode there has been no gesture yet, so browsers would block it
       anyway — and starting sound unprompted would be worse than not. */
    if (!fromUser) return;
    if (dark) startAudio(); else stopAudio();
  }

  Array.prototype.forEach.call(toggles, function (b) {
    b.addEventListener('click', function () { setTheme(!isDark(), true); });
  });
  Array.prototype.forEach.call(audioBtns, function (b) {
    b.addEventListener('click', function () { playing ? stopAudio() : startAudio(); });
  });

  /* leaving the tab pauses it rather than talking to an empty room */
  document.addEventListener('visibilitychange', function () {
    if (!ctx || !playing) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });

  syncToggles();
  syncAudioBtns();
})();
