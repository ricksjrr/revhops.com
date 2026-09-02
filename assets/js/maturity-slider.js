/* ==========================================================================
   RevHops — RevOps maturity slider

   Renders itself into <div data-revhops-maturity></div>.

   Headline, subhead, slider, then three cards that swap content as the
   stage changes: situation and stack, problems, case study.

   The visitor picks their stage: drag the bunny, click a node or a stage
   name, or use the arrow keys. The choice sticks, so the cards below stay
   put and can be read and hovered, and the rest of the page can respond —
   the selection is published on <html data-stage> and broadcast as a
   `revhops:stage` event.

   No dependencies.
   ========================================================================== */
(function () {
  'use strict';

  /* ----------------------------------------------------------------------
     STAGE CONTENT
     Edit here — the module rebuilds itself from this array.
     caseStudy entries are placeholders. Swap in the real ones.
     ---------------------------------------------------------------------- */
  var STAGES = [
    {
      name: 'Startup',
      situation: [
        '1 to 10 employees',
        'Founders wearing every hat, maybe one early hire in sales or ops',
        'Pre-revenue to around $1M ARR'
      ],
      have: ['Website builder', 'Email tool', 'Shared inbox'],
      missing: ['CRM discipline', 'Attribution', 'Ticketing'],
      problems: [
        'No data hygiene habits, so the first CRM launches dirty',
        'Deal knowledge lives only in the founder’s head',
        'Informal customer promises go undocumented'
      ],
      caseStudy: {
        who: 'Makarios Design Build',
        line: 'Case study description goes here and should describe what the case study is about.',
        href: '#'
      }
    },
    {
      name: 'Scaleup',
      situation: [
        '10 to 50 employees',
        'First dedicated marketer, one to three AEs or SDRs, first support hire',
        'Around $1M to $10M ARR'
      ],
      have: ['Entry-tier CRM', 'Forms and landing pages', 'Helpdesk'],
      missing: ['Lead scoring', 'MQL and SQL criteria', 'Sales engagement'],
      problems: [
        'Marketing and sales quietly disagree on what "qualified" means',
        'No clean handoff, so leads fall through the cracks unnoticed',
        'The founder is still the real approval path, whatever the process says'
      ],
      caseStudy: {
        who: 'Makarios Design Build',
        line: 'Case study description goes here and should describe what the case study is about.',
        href: '#'
      }
    },
    {
      name: 'Growth',
      situation: [
        '50 to 200 employees',
        'SDR and AE split, a small marketing team, dedicated CS, first RevOps hire',
        'Around $10M to $50M ARR'
      ],
      have: ['Marketing automation', 'Sales engagement', 'CS platform'],
      missing: ['Data governance', 'Single source of truth', 'RevOps headcount'],
      problems: [
        'Integrations outpace anyone’s ability to govern them',
        'Everyone has their own dashboard and nobody trusts the numbers',
        'One RevOps hire is admin, analyst and process owner at the same time'
      ],
      caseStudy: {
        who: 'Makarios Design Build',
        line: 'Case study description goes here and should describe what the case study is about.',
        href: '#'
      }
    },
    {
      name: 'Maturity',
      situation: [
        '200 to 1,000 employees',
        'Segmented sales org, dedicated enablement, a full CS org, a multi-person RevOps team',
        'Around $50M to $250M ARR'
      ],
      have: ['ABM platform', 'Deal desk', 'Advanced forecasting'],
      missing: ['Clean data model', 'Unified customer data'],
      problems: [
        'Legacy fields nobody remembers the reason for',
        'Each department has its own version of the truth',
        'Attribution and comp models sophisticated enough to be gamed'
      ],
      caseStudy: {
        who: 'Makarios Design Build',
        line: 'Case study description goes here and should describe what the case study is about.',
        href: '#'
      }
    },
    {
      name: 'Enterprise',
      situation: [
        '1,000+ employees',
        'Regional and global GTM teams, specialized roles, RevOps as its own department',
        '$250M+ ARR'
      ],
      have: ['Enterprise suite', 'CDP', 'PRM', 'BI and warehouse'],
      missing: ['Consolidated CRM', 'Consistent standards', 'One customer view'],
      problems: [
        'Multiple CRMs never consolidated after M&A',
        'Nobody understands the full customer journey end to end',
        'Legacy systems are too big to fail, and also the bottleneck'
      ],
      caseStudy: {
        who: 'Makarios Design Build',
        line: 'Case study description goes here and should describe what the case study is about.',
        href: '#'
      }
    }
  ];

  /* fallback bunny mark — replaced automatically once the icon file loads */
  var BUNNY_SVG =
    '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">' +
    '<path d="M22.8 27.6c-1.9-4.6-3-9-3.2-13.2-.1-3.1.6-5.1 2.2-5.7 1.6-.6 3.3.5 5.1 3.1 2.4 3.4 4.3 7.7 5.6 12.5" ' +
    'stroke="#FAFAF8" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M33.9 26c1.1-4.6 2.8-8.6 5-11.7 1.9-2.7 3.7-3.8 5.3-3.1 1.6.7 2.2 2.8 1.9 6-.4 4.1-1.7 8.4-3.8 12.8" ' +
    'stroke="#FAFAF8" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M32 24.5c8 0 14.4 5.9 14.4 13.6 0 4.6-2.2 8.2-5.7 10.4 1.6 1 2.6 2.3 2.6 3.6 0 2.2-2.8 3.4-5.9 2.6-1.6-.4-3.4-1.4-5.4-1.4s-3.8 1-5.4 1.4c-3.1.8-5.9-.4-5.9-2.6 0-1.3 1-2.6 2.6-3.6-3.5-2.2-5.7-5.8-5.7-10.4 0-7.7 6.4-13.6 14.4-13.6Z" ' +
    'fill="#FAFAF8"/>' +
    '<circle cx="26.6" cy="37.4" r="1.9" fill="#304157"/>' +
    '<circle cx="37.4" cy="37.4" r="1.9" fill="#304157"/>' +
    '</svg>';

  /* The thumb is navy in light mode and light in dark mode, since its
     background reads var(--navy). So the mark on it has to swap too:
     white bunny on the navy thumb, navy bunny on the light one. */
  var ICON_LIGHT = 'assets/img/revhops-icon-white.png';   /* light theme */
  var ICON_DARK  = 'assets/img/revhops-icon.png';         /* dark theme  */
  var ICON_SRC = ICON_LIGHT;
  /* swap this for the real case study photo */
  var SHOT_SRC = 'assets/img/case-study-placeholder.svg';

  var CARD_TITLES = [
    'Your situation may look like this',
    'Problems you’re likely facing',
    'A case study that’s relevant to you'
  ];
  var CARD_COUNT = CARD_TITLES.length;

  /* Second section inside the Problems card, mirroring the tech stack block
     in the first card. Placeholder for now. If this should read differently
     per stage, move it into the STAGES entries above. */
  var PROBLEM_SPLIT = {
    head: 'What it usually costs you',
    body: 'Time, mostly. Reports rebuilt by hand, leadership arguing about which ' +
          'number is right, and deals that stall because nobody owns the next step.'
  };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function closest(el, sel) {
    if (el.closest) return el.closest(sel);
    while (el && el.nodeType === 1) {
      if (el.matches && el.matches(sel)) return el;
      el = el.parentElement;
    }
    return null;
  }

  function build(root) {
    var lastI = STAGES.length - 1;
    /* pick for the theme in force right now, so a page that loads dark does
       not flash the white mark before syncIcon corrects it */
    var startDark = document.documentElement.getAttribute('data-theme') === 'dark';
    var iconPath = root.getAttribute(startDark ? 'data-icon-dark' : 'data-icon') ||
                   (startDark ? ICON_DARK : ICON_LIGHT);
    var start = parseInt(root.getAttribute('data-start'), 10);
    if (isNaN(start) || start < 0 || start > lastI) start = 0;

    /* The headline changes with the theme. Both strings live here so the
       module owns all of its own copy; site.js only announces the switch. */
    var HEAD_DAY   = 'Where is your team at today?';
    var HEAD_NIGHT = 'Where is your team at tonight?';

    var nodesHTML = '';
    var labelsHTML = '';
    STAGES.forEach(function (s, i) {
      var pct = (i / lastI) * 100;
      nodesHTML +=
        '<button type="button" class="mat-node" data-i="' + i + '" style="left:' + pct + '%" ' +
        'tabindex="-1" aria-hidden="true"></button>';
      /* labels are absolutely placed on the same percentages as the nodes,
         so each name sits directly under its own marker */
      labelsHTML +=
        '<button type="button" class="mat-label" data-i="' + i + '" ' +
        'style="--mat-x:' + pct + '%">' + esc(s.name) + '</button>';
    });

    /* each card sits in a slot. the slot owns the slide transform so it
       never fights the card's own hover lift. The last column stacks the
       case study above the signup form, so the two together match the
       height of the single cards beside them. */
    function cardHTML(c) {
      return '<article class="mcard' + (c === CARD_COUNT - 1 ? ' mcard-case' : '') +
        '" data-card="' + c + '">' +
        '<h2 class="mcard-title">' + esc(CARD_TITLES[c]) + '</h2>' +
        '<hr class="warm-rule">' +
        '<div class="mcard-body" data-card-body="' + c + '"></div>' +
      '</article>';
    }

    var cardsHTML = '';
    for (var c = 0; c < CARD_COUNT - 1; c++) {
      cardsHTML += '<div class="mcard-slot">' + cardHTML(c) + '</div>';
    }
    cardsHTML +=
      '<div class="mcard-slot mcard-col">' +
        cardHTML(CARD_COUNT - 1) +
        /* ==========================================================
           Not wired to anything yet. Replace with your HubSpot form
           embed, or point it at your endpoint. The hidden `stage`
           field tracks the slider, so whatever receives this knows
           which stage they picked.
           ========================================================== */
        '<form class="stage-form" data-stage-form>' +
          '<h2 class="stage-form-title">Send me the info for my team’s stage.</h2>' +
          '<div class="stage-form-fields">' +
            '<label class="sr-only" for="sf-email">Work email</label>' +
            '<input id="sf-email" name="email" type="email" ' +
              'placeholder="Work email" autocomplete="email" required>' +
            '<input type="hidden" name="stage" data-stage-field value="">' +
            '<button class="stage-form-send" type="submit">' +
              'Send it <span class="arrow">&rarr;</span></button>' +
          '</div>' +
        '</form>' +
      '</div>';

    root.innerHTML =
      '<div class="mat">' +
        '<div class="mat-head">' +
          '<h1 class="h1" data-nav-clear data-headline>' + esc(HEAD_DAY) + '</h1>' +
          '<p class="lede">RevOps is the people, systems and tools that impact revenue growth through ' +
            'marketing, sales and customer service. But every team is somewhere different along that journey.</p>' +
        '</div>' +

        '<div class="mat-track-wrap">' +
          '<div class="mat-track" data-track>' +
            '<div class="mat-fill" data-fill></div>' +
            '<div class="mat-nodes">' + nodesHTML + '</div>' +
            '<div class="mat-thumb" data-thumb role="slider" tabindex="0" ' +
              'aria-label="RevOps maturity stage" aria-valuemin="1" aria-valuemax="' + STAGES.length + '" ' +
              'aria-valuenow="' + (start + 1) + '" aria-valuetext="' + esc(STAGES[start].name) + '">' +
              '<span class="mat-thumb-inner" data-thumb-inner>' + BUNNY_SVG + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="mat-labels" data-align="edge">' + labelsHTML + '</div>' +
        '</div>' +

        '<div class="mcards" data-mcards>' + cardsHTML + '</div>' +
      '</div>' +
      '<p aria-live="polite" data-live style="position:absolute;width:1px;height:1px;overflow:hidden;' +
        'clip:rect(0 0 0 0);white-space:nowrap"></p>';

    /* Swap the inline fallback for the real artwork once it has loaded.
       Both variants are preloaded so the theme can flip without a blink. */
    [ICON_LIGHT, ICON_DARK].forEach(function (p) { (new Image()).src = p; });
    var probe = new Image();
    probe.onload = function () {
      var inner = root.querySelector('[data-thumb-inner]');
      if (inner) inner.innerHTML = '<img data-thumb-img src="' + iconPath + '" alt="">';
    };
    probe.src = iconPath;

    return { start: start, last: lastI };
  }

  function init(root) {
    /* Where the two in-card CTAs point. Set with data-cta-url on the mount
       element so the module does not assume a flat URL structure — the site
       uses folder URLs, and this module could sit at any depth. */
    var CTA = root.getAttribute('data-cta-url') || 'book/';

    var cfg = build(root);
    var last = cfg.last;

    var track = root.querySelector('[data-track]');
    var fill = root.querySelector('[data-fill]');
    var thumb = root.querySelector('[data-thumb]');
    var live = root.querySelector('[data-live]');
    var nodes = Array.prototype.slice.call(root.querySelectorAll('.mat-node'));
    var labels = Array.prototype.slice.call(root.querySelectorAll('.mat-label'));
    var bodies = [];
    for (var b = 0; b < CARD_COUNT; b++) {
      bodies.push(root.querySelector('[data-card-body="' + b + '"]'));
    }
    var cardsEl = root.querySelector('[data-mcards]');

    var hero = closest(root, '.hero');

    var index = cfg.start;
    var rawPos = cfg.start;      /* continuous position while dragging, 0..last */
    var dragging = false;
    var interacted = false;
    var swapToken = 0;

    /* how long the outgoing cards take to clear before the new set renders.
       must stay in step with .mcard-slot timing in site.css */
    var OUT_MS = 120;

    var reduce = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Publish the choice so anything else on the page can respond to it.
       `<html data-stage="growth">` lets CSS target it with no JS at all, and
       the event carries the index and the full stage record for scripts.

         document.addEventListener('revhops:stage', function (e) {
           e.detail.index;  // 0..4
           e.detail.name;   // 'Growth'
           e.detail.stage;  // the whole STAGES entry
         });
    */
    function publishStage(i) {
      var s = STAGES[i];
      var slug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      document.documentElement.setAttribute('data-stage', slug);
      document.documentElement.setAttribute('data-stage-index', String(i));

      var field = root.querySelector('[data-stage-field]');
      if (field) field.value = s.name;

      try {
        document.dispatchEvent(new CustomEvent('revhops:stage', {
          detail: { index: i, name: s.name, slug: slug, stage: s }
        }));
      } catch (err) { /* older browsers: the attribute is still set */ }
    }

    /* ---------------- card rendering ---------------- */
    function list(items) {
      return '<ul class="mcard-list">' + items.map(function (t) {
        return '<li>' + esc(t) + '</li>';
      }).join('') + '</ul>';
    }

    /* one run of chips: what they have in the success colour, what they are
       missing in the failure colour. The tick and cross carry the meaning
       for anyone who cannot separate the two by hue alone. */
    function stackChips(have, missing) {
      var out = have.map(function (t) {
        return '<span class="chip chip-have"><i aria-hidden="true">&#10003;</i>' + esc(t) + '</span>';
      }).concat(missing.map(function (t) {
        return '<span class="chip chip-missing"><i aria-hidden="true">&#10005;</i>' + esc(t) + '</span>';
      }));
      return '<div class="mcard-chips">' + out.join('') + '</div>';
    }

    function renderCards(i) {
      var s = STAGES[i];

      var html = [
        /* situation and stack share one card, split by a hairline */
        list(s.situation) +
        '<div class="mcard-split">' +
          '<h3 class="mcard-subhead">Your tech stack probably includes</h3>' +
          stackChips(s.have, s.missing) +
        '</div>' +
        '<a class="mcard-link" href="' + esc(CTA) + '">' +
          'Request a free tech stack audit <span class="arrow">&rarr;</span></a>',

        list(s.problems) +
        '<div class="mcard-split">' +
          '<h3 class="mcard-subhead">' + esc(PROBLEM_SPLIT.head) + '</h3>' +
          '<p class="mcard-note">' + esc(PROBLEM_SPLIT.body) + '</p>' +
        '</div>' +
        '<a class="mcard-link" href="' + esc(CTA) + '">' +
          'Book a discovery call <span class="arrow">&rarr;</span></a>',

        /* copy left, square thumbnail right, then the link on its own line
           so it lands in the bottom-left corner like the other two cards */
        '<div class="mcard-case-row">' +
          '<div class="mcard-case-text">' +
            '<h3 class="mcard-case-who">' + esc(s.caseStudy.who) + '</h3>' +
            '<p class="mcard-case-line">' + esc(s.caseStudy.line) + '</p>' +
          '</div>' +
          '<img class="mcard-shot" src="' + SHOT_SRC + '" alt="" aria-hidden="true">' +
        '</div>' +
        '<a class="mcard-link" href="' + esc(s.caseStudy.href) + '">' +
          'Read the story <span class="arrow">&rarr;</span></a>'
      ];

      bodies.forEach(function (b, k) {
        if (b) b.innerHTML = html[k];
      });
    }

    /* Reserve the height of the tallest stage up front. Without this the
       card block changes height between stages and, because the hero centres
       its contents, the headline drifts up and down as you scroll. */
    function lockCardsHeight() {
      if (!cardsEl) return;
      var keep = index;
      cardsEl.style.minHeight = '0px';
      var tallest = 0;
      for (var i = 0; i <= last; i++) {
        renderCards(i);
        if (cardsEl.offsetHeight > tallest) tallest = cardsEl.offsetHeight;
      }
      renderCards(keep);
      cardsEl.style.minHeight = tallest + 'px';
      measureProofLead();
    }

    /* The hero centres its contents, so the gap between the bottom of the
       cards and the bottom of the hero varies with viewport height. Publish
       it so the section below can subtract it and land its badge exactly
       100px under the cards. */
    function measureProofLead() {
      if (!hero || !cardsEl) return;
      var slack = hero.getBoundingClientRect().bottom -
                  cardsEl.getBoundingClientRect().bottom;
      var lead = Math.max(0, 100 - slack);
      document.documentElement.style.setProperty('--proof-lead', Math.round(lead) + 'px');
    }

    /* Quick crossfade with a small lift. Deliberately short: scrubbing fast
       through the stages should not look like cards flying around. */
    function swapCards(i) {
      if (!cardsEl || reduce) { renderCards(i); return; }

      var token = ++swapToken;
      cardsEl.classList.remove('is-enter');
      cardsEl.classList.add('is-out');

      setTimeout(function () {
        if (token !== swapToken) return;

        renderCards(i);

        cardsEl.classList.remove('is-out');
        cardsEl.classList.add('is-enter');
        void cardsEl.offsetWidth;
        cardsEl.classList.remove('is-enter');
      }, OUT_MS);
    }

    /* Which stage the content should show for a continuous position.
       Only advances once the thumb actually reaches the node, in both
       directions, rather than flipping at the midpoint. */
    function stageFor(raw) {
      var i = index;
      var e = 0.015;
      while (i < last && raw >= i + 1 - e) i++;
      while (i > 0 && raw <= i - 1 + e) i--;
      return i;
    }

    /* ---------------- slider mechanics ---------------- */
    function position(pct, animate) {
      if (!animate) {
        track.classList.add('is-dragging');
        thumb.classList.add('is-dragging');
      } else {
        track.classList.remove('is-dragging');
        thumb.classList.remove('is-dragging');
      }
      fill.style.width = pct + '%';
      thumb.style.left = pct + '%';
    }

    function setIndex(i, opts) {
      opts = opts || {};
      i = clamp(i, 0, last);
      var changed = i !== index;
      index = i;

      if (!opts.freeDrag) { rawPos = i; position((i / last) * 100, true); }

      nodes.forEach(function (n, k) {
        n.classList.toggle('is-active', k === i);
        n.classList.toggle('is-passed', k < i);
      });
      labels.forEach(function (l, k) {
        l.classList.toggle('is-active', k === i);
        l.setAttribute('aria-pressed', k === i ? 'true' : 'false');
      });

      thumb.setAttribute('aria-valuenow', i + 1);
      thumb.setAttribute('aria-valuetext', STAGES[i].name);

      if (changed) swapCards(i);
      else if (opts.force) renderCards(i);

      if (changed || opts.force) publishStage(i);

      if (changed || opts.force) {
        if (live) live.textContent = STAGES[i].name + ' stage.';
        if (changed && !reduce) {
          thumb.classList.remove('hop');
          void thumb.offsetWidth;
          thumb.classList.add('hop');
        }
      }
    }

    /* ---------------- pointer drag ---------------- */
    function pctFromEvent(e) {
      var r = track.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      return clamp((x / r.width) * 100, 0, 100);
    }

    function markInteracted() { interacted = true; }

    function onDown(e) {
      dragging = true;
      markInteracted();
      thumb.classList.add('is-dragging');
      track.classList.add('is-dragging');
      if (thumb.setPointerCapture && e.pointerId != null) {
        try { thumb.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
      }
      onMove(e);
      e.preventDefault();
    }

    function onMove(e) {
      if (!dragging) return;
      var pct = pctFromEvent(e);
      position(pct, false);
      rawPos = (pct / 100) * last;
      var next = stageFor(rawPos);
      if (next !== index) setIndex(next, { freeDrag: true });
      if (e.cancelable) e.preventDefault();
    }

    function onUp() {
      if (!dragging) return;
      dragging = false;
      thumb.classList.remove('is-dragging');
      track.classList.remove('is-dragging');

      /* release commits to the nearest node. the thumb animates into it and
         the cards swap as it lands, so content still only appears once the
         stage has actually been reached. */
      var landed = Math.round(rawPos);
      if (landed !== index) setIndex(landed);
      else position((index / last) * 100, true);
    }

    if ('PointerEvent' in window) {
      thumb.addEventListener('pointerdown', onDown);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    } else {
      thumb.addEventListener('mousedown', onDown);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      thumb.addEventListener('touchstart', onDown, { passive: false });
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp);
    }

    track.addEventListener('click', function (e) {
      if (e.target === thumb || thumb.contains(e.target)) return;
      markInteracted();
      setIndex(Math.round((pctFromEvent(e) / 100) * last));
    });

    nodes.concat(labels).forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        markInteracted();
        setIndex(parseInt(el.getAttribute('data-i'), 10));
      });
    });

    thumb.addEventListener('keydown', function (e) {
      var k = e.key;
      var next = null;
      if (k === 'ArrowRight' || k === 'ArrowUp') next = index + 1;
      else if (k === 'ArrowLeft' || k === 'ArrowDown') next = index - 1;
      else if (k === 'Home') next = 0;
      else if (k === 'End') next = last;
      if (next === null) return;
      e.preventDefault();
      markInteracted();
      setIndex(next);
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        lockCardsHeight();
        position((index / last) * 100, true);
      }, 100);
    });

    /* ---------------- headline follows the theme ---------------- */
    var headEl = root.querySelector('[data-headline]');
    function syncHeadline() {
      if (!headEl) return;
      var dark = document.documentElement.getAttribute('data-theme') === 'dark';
      var next = dark ? 'Where is your team at tonight?' : 'Where is your team at today?';
      if (headEl.textContent !== next) headEl.textContent = next;
    }
    /* the thumb mark follows the theme for the same reason the headline does */
    function syncIcon() {
      var img = root.querySelector('[data-thumb-img]');
      if (!img) return;
      var dark = document.documentElement.getAttribute('data-theme') === 'dark';
      var want = root.getAttribute(dark ? 'data-icon-dark' : 'data-icon') ||
                 (dark ? ICON_DARK : ICON_LIGHT);
      if (img.getAttribute('src') !== want) img.setAttribute('src', want);
    }
    function syncTheme() { syncHeadline(); syncIcon(); }

    document.addEventListener('revhops:theme', syncTheme);
    /* also covers the theme being set before this module booted, and any
       future change made outside the toggle */
    if ('MutationObserver' in window) {
      new MutationObserver(syncTheme).observe(document.documentElement,
        { attributes: true, attributeFilter: ['data-theme'] });
    }
    syncTheme();
    /* the artwork lands asynchronously, so re-check once it is in */
    setTimeout(syncIcon, 400);

    setIndex(index, { force: true });
    lockCardsHeight();

    /* one hop on load so the control reads as draggable */
    if (!reduce) {
      setTimeout(function () {
        if (interacted || index !== 0) return;
        thumb.classList.remove('hop');
        void thumb.offsetWidth;
        thumb.classList.add('hop');
      }, 1600);
    }
  }

  function boot() {
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-revhops-maturity]'), init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
