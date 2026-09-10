/* ==========================================================================
   RevHops — the RevOps puzzle (/puzzle)

   A 3x3 sliding puzzle. Eight tiles, one gap, a clock that starts when the
   visitor presses Start, and a win dialog. Loaded on /puzzle only.

   The board is an array of nine cells. Each cell holds the HOME index (0-7)
   of the tile sitting in it, or -1 for the gap. Solved is cells[i] === i for
   the first eight and the gap in the bottom right. A tile's picture never
   changes — it always shows the slice of its home cell — only its --r/--c
   position does.

   Shuffling is a random permutation, not a random walk, and only solvable
   ones are kept: on a board three wide, a layout can be solved exactly when
   the number of inversions among the eight tiles is even. Half of all
   permutations cannot be solved, which is why a naive shuffle is a bug.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.querySelector('[data-puzzle]');
  if (!root) return;

  /* The pictures: five branded illustrations and one photograph. Anything
     square dropped into the same folder and added here works the same way. */
  var BASE = root.getAttribute('data-img-base') || 'assets/img/puzzle/';
  var PICTURES = [
    { file: 'dashboard.svg',    name: 'The revenue dashboard' },
    { file: 'funnel.svg',       name: 'The Q3 funnel' },
    { file: 'deal-board.svg',   name: 'The deal board' },
    { file: 'lead-to-cash.svg', name: 'Lead to cash' },
    { file: 'desk.svg',         name: 'The RevOps desk' },
    /* a photograph, cropped square from the top of a portrait so the head
       sits in the top two rows and the bottom-right piece is jacket */
    { file: 'portrait.webp',    name: 'Say cheese' }
  ];

  var BEST_KEY = 'revhops-puzzle-best';
  var N = 3;
  var BLANK = -1;

  var board   = root.querySelector('[data-pz-board]');
  var grid    = root.querySelector('[data-pz-grid]');
  var cover   = root.querySelector('[data-pz-cover]');
  var startBtn = root.querySelector('[data-pz-start]');
  var restartBtn = root.querySelector('[data-pz-restart]');
  var nextBtn = root.querySelector('[data-pz-next]');
  var timeEl  = root.querySelector('[data-pz-time]');
  var movesEl = root.querySelector('[data-pz-moves]');
  var bestEl  = root.querySelector('[data-pz-best]');
  var statsEl = root.querySelector('.pz-stats');
  var thumb   = root.querySelector('[data-pz-thumb]');
  var nameEl  = root.querySelector('[data-pz-name]');

  var win        = document.querySelector('[data-pz-win]');
  var winTime    = document.querySelector('[data-pz-win-time]');
  var winMoves   = document.querySelector('[data-pz-win-moves]');
  var winRecord  = document.querySelector('[data-pz-record]');
  var againBtn   = document.querySelector('[data-pz-again]');
  var closeBtn   = document.querySelector('[data-pz-close]');
  var confetti   = document.querySelector('[data-pz-confetti]');

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var state = 'ready';            // ready | playing | won
  var cells = solvedCells();
  var tiles = [];                 // tiles[home] = element, 0..8 (8 is the last piece)
  var picture = -1;
  var moves = 0;
  var startedAt = 0;
  var elapsed = 0;
  var raf = 0;

  /* ---------- helpers ---------- */

  function solvedCells() {
    var c = [];
    for (var i = 0; i < N * N - 1; i++) c.push(i);
    c.push(BLANK);
    return c;
  }

  function rowOf(i) { return Math.floor(i / N); }
  function colOf(i) { return i % N; }

  function isSolved(c) {
    for (var i = 0; i < N * N - 1; i++) if (c[i] !== i) return false;
    return true;
  }

  function inversions(c) {
    var seq = c.filter(function (v) { return v !== BLANK; });
    var n = 0;
    for (var i = 0; i < seq.length; i++) {
      for (var j = i + 1; j < seq.length; j++) if (seq[i] > seq[j]) n++;
    }
    return n;
  }

  /* how far from solved: the sum of every tile's distance from home */
  function distance(c) {
    var d = 0;
    c.forEach(function (home, cell) {
      if (home === BLANK) return;
      d += Math.abs(rowOf(home) - rowOf(cell)) + Math.abs(colOf(home) - colOf(cell));
    });
    return d;
  }

  /* A uniformly random solvable layout that is a real puzzle: never already
     solved, and never three moves from it. */
  function shuffled() {
    var c;
    do {
      c = solvedCells();
      for (var i = c.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = c[i]; c[i] = c[j]; c[j] = t;
      }
    } while (inversions(c) % 2 !== 0 || isSolved(c) || distance(c) < 12);
    return c;
  }

  function format(ms) {
    var tenths = Math.floor(ms / 100);
    var m = Math.floor(tenths / 600);
    var s = Math.floor((tenths % 600) / 10);
    var t = tenths % 10;
    return m + ':' + (s < 10 ? '0' : '') + s + '.' + t;
  }

  function readBest() {
    try {
      var v = JSON.parse(localStorage.getItem(BEST_KEY));
      return v && typeof v.ms === 'number' ? v : null;
    } catch (e) { return null; }
  }
  function writeBest(v) {
    try { localStorage.setItem(BEST_KEY, JSON.stringify(v)); } catch (e) { /* private mode */ }
  }
  function showBest() {
    var b = readBest();
    bestEl.textContent = b ? format(b.ms) : 'None yet';
    bestEl.classList.toggle('is-empty', !b);
  }

  /* ---------- building the board ---------- */

  function build() {
    for (var s = 0; s < N * N; s++) {
      var slot = document.createElement('span');
      slot.className = 'pz-slot';
      slot.style.setProperty('--r', rowOf(s));
      slot.style.setProperty('--c', colOf(s));
      slot.setAttribute('aria-hidden', 'true');
      grid.appendChild(slot);
    }
    for (var h = 0; h < N * N; h++) {
      var last = h === N * N - 1;
      var el = document.createElement(last ? 'span' : 'button');
      el.className = 'pz-tile' + (last ? ' is-last' : '');
      el.style.backgroundPosition = (colOf(h) * 50) + '% ' + (rowOf(h) * 50) + '%';
      if (last) {
        el.setAttribute('aria-hidden', 'true');
        el.style.setProperty('--r', rowOf(h));
        el.style.setProperty('--c', colOf(h));
      } else {
        el.type = 'button';
        el.setAttribute('data-home', h);
        el.setAttribute('aria-label', 'Piece ' + (h + 1));
      }
      grid.appendChild(el);
      tiles.push(el);
    }
  }

  function paint() {
    var blank = cells.indexOf(BLANK);
    cells.forEach(function (home, cell) {
      if (home === BLANK) return;
      var el = tiles[home];
      el.style.setProperty('--r', rowOf(cell));
      el.style.setProperty('--c', colOf(cell));
      var movable = state === 'playing' &&
        (rowOf(cell) === rowOf(blank) || colOf(cell) === colOf(blank));
      el.classList.toggle('is-movable', movable);
      el.disabled = state !== 'playing';
      el.setAttribute('aria-label', 'Piece ' + (home + 1) + ', row ' + (rowOf(cell) + 1) + ', column ' + (colOf(cell) + 1));
    });
    movesEl.textContent = moves;
  }

  function setPicture(i) {
    picture = i;
    var src = BASE + PICTURES[i].file;
    /* Absolute, on purpose. A relative url() inside a custom property is
       resolved against the STYLESHEET that uses it (assets/css/), not
       against this page, so 'assets/img/…' would 404 as
       'assets/css/assets/img/…'. */
    var abs = new URL(src, document.baseURI).href;
    grid.style.setProperty('--pz-pic', 'url("' + abs + '")');
    thumb.src = src;
    thumb.alt = PICTURES[i].name;
    nameEl.textContent = PICTURES[i].name;
  }

  function randomPicture() {
    if (PICTURES.length < 2) return 0;
    var i;
    do { i = Math.floor(Math.random() * PICTURES.length); } while (i === picture);
    return i;
  }

  /* ---------- the clock ---------- */

  function tick() {
    elapsed = performance.now() - startedAt;
    timeEl.textContent = format(elapsed);
    raf = requestAnimationFrame(tick);
  }
  function stopClock() {
    cancelAnimationFrame(raf);
    elapsed = performance.now() - startedAt;
    timeEl.textContent = format(elapsed);
  }

  /* ---------- states ---------- */

  function setState(s) {
    state = s;
    root.classList.toggle('is-playing', s === 'playing');
    root.classList.toggle('is-won', s === 'won');
    cover.classList.toggle('is-off', s !== 'ready');
    restartBtn.hidden = s === 'ready';
    restartBtn.textContent = s === 'won' ? 'Play again' : 'Shuffle again';
  }

  /* Ready: the finished picture sits under the cover so the visitor knows
     what they are building before the clock runs. */
  function ready(pic) {
    cancelAnimationFrame(raf);
    setPicture(pic);
    cells = solvedCells();
    moves = 0;
    elapsed = 0;
    timeEl.textContent = format(0);
    board.classList.add('is-solved');
    setState('ready');
    paint();
  }

  function start() {
    cancelAnimationFrame(raf);
    cells = shuffled();
    moves = 0;
    board.classList.remove('is-solved');
    if (!reduceMotion) {
      board.classList.add('is-shuffling');
      setTimeout(function () { board.classList.remove('is-shuffling'); }, 600);
    }
    setState('playing');
    paint();
    startedAt = performance.now();
    tick();
    /* on a short screen the bottom row can sit under the fold; bring the
       whole board into view as the clock starts */
    fit();
    /* focus a movable tile so the arrow keys and Tab work straight away */
    var first = grid.querySelector('.pz-tile.is-movable');
    if (first) first.focus({ preventScroll: true });
  }

  /* On a short screen the bottom row can start under the fold. If the board
     (and, on a phone, the clock above it) is not all on screen, scroll it up
     to just under the nav. Top-aligned rather than the least distance: a
     small nudge leaves the headline half under the resting nav, while this
     scrolls far enough for the nav to collapse into its floating bar. */
  function fit() {
    var NAV_CLEAR = 104;
    var topEl = window.matchMedia('(max-width: 900px)').matches ? statsEl : board;
    var t = topEl.getBoundingClientRect().top;
    var b = board.getBoundingClientRect().bottom;
    if (b <= window.innerHeight - 16 && t >= NAV_CLEAR) return;
    window.scrollBy({ top: t - NAV_CLEAR, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  /* Slide toward the gap. A tile anywhere in the gap's row or column can be
     clicked, and everything between it and the gap moves one step, one move
     each — the way a physical puzzle behaves when you push a line of tiles. */
  function slide(cell) {
    if (state !== 'playing') return;
    var blank = cells.indexOf(BLANK);
    if (cell === blank) return;
    var sameRow = rowOf(cell) === rowOf(blank);
    var sameCol = colOf(cell) === colOf(blank);
    if (!sameRow && !sameCol) return;
    var step = sameRow ? (cell > blank ? 1 : -1) : (cell > blank ? N : -N);
    while (blank !== cell) {
      var next = blank + step;
      cells[blank] = cells[next];
      cells[next] = BLANK;
      blank = next;
      moves++;
    }
    paint();
    if (isSolved(cells)) won();
  }

  function won() {
    stopClock();
    setState('won');
    board.classList.add('is-solved');
    paint();

    var best = readBest();
    var record = !best || elapsed < best.ms;
    if (record) writeBest({ ms: Math.round(elapsed), moves: moves, at: Date.now() });
    showBest();

    winTime.textContent = format(elapsed);
    winMoves.textContent = moves;
    winRecord.hidden = !record;

    /* let the gap close and the ninth piece land before the dialog covers it */
    setTimeout(openWin, reduceMotion ? 0 : 700);
  }

  function openWin() {
    if (typeof win.showModal === 'function') {
      if (!win.open) win.showModal();
    } else {
      win.setAttribute('open', '');
    }
    againBtn.focus();
    burst();
  }
  function closeWin() {
    if (typeof win.close === 'function' && win.open) win.close();
    else win.removeAttribute('open');
  }

  /* ---------- confetti, because the brief said cheesy ---------- */

  function burst() {
    if (reduceMotion || !confetti || !confetti.getContext) return;
    var ctx = confetti.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = window.innerWidth, H = window.innerHeight;
    confetti.width = W * dpr;
    confetti.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var colours = ['#F2C39B', '#E8A66F', '#304157', '#6B7A93', '#C6D3E0', '#FAFAF8'];
    var bits = [];
    for (var i = 0; i < 190; i++) {
      var fromTop = i < 110;
      bits.push({
        x: fromTop ? Math.random() * W : W / 2 + (Math.random() - .5) * 120,
        y: fromTop ? -20 - Math.random() * H * .5 : H * .45,
        vx: fromTop ? (Math.random() - .5) * 2 : (Math.random() - .5) * 16,
        vy: fromTop ? 2 + Math.random() * 3 : -6 - Math.random() * 9,
        w: 6 + Math.random() * 7,
        h: 4 + Math.random() * 6,
        a: Math.random() * Math.PI,
        va: (Math.random() - .5) * .3,
        c: colours[i % colours.length]
      });
    }
    var t0 = performance.now();
    (function frame(now) {
      var age = now - t0;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = age > 3200 ? Math.max(0, 1 - (age - 3200) / 800) : 1;
      bits.forEach(function (b) {
        b.vy += .18;
        b.vx *= .99;
        b.x += b.vx;
        b.y += b.vy;
        b.a += b.va;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.a);
        ctx.fillStyle = b.c;
        ctx.fillRect(-b.w / 2, -b.h / 2 * Math.abs(Math.cos(b.a * 2)), b.w, b.h * Math.abs(Math.cos(b.a * 2)) + 1);
        ctx.restore();
      });
      if (age < 4000) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, W, H);
    })(t0);
  }

  /* ---------- input ---------- */

  grid.addEventListener('click', function (e) {
    var el = e.target.closest('.pz-tile');
    if (!el || !el.hasAttribute('data-home')) return;
    var home = +el.getAttribute('data-home');
    slide(cells.indexOf(home));
  });

  /* Arrow keys move the tile NEXT to the gap in that direction: Up slides
     the tile below the gap up into it, and so on. Only while a game is
     running, and never while someone is typing somewhere. */
  document.addEventListener('keydown', function (e) {
    if (state !== 'playing' || (win && win.open)) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    var blank = cells.indexOf(BLANK);
    var r = rowOf(blank), c = colOf(blank), target = -1;
    switch (e.key) {
      case 'ArrowUp':    if (r < N - 1) target = blank + N; break;
      case 'ArrowDown':  if (r > 0)     target = blank - N; break;
      case 'ArrowLeft':  if (c < N - 1) target = blank + 1; break;
      case 'ArrowRight': if (c > 0)     target = blank - 1; break;
      default: return;
    }
    e.preventDefault();
    if (target >= 0) slide(target);
  });

  startBtn.addEventListener('click', start);

  restartBtn.addEventListener('click', function () {
    if (state === 'won') ready(randomPicture());
    else start();
  });

  nextBtn.addEventListener('click', function () { ready(randomPicture()); });

  againBtn.addEventListener('click', function () {
    closeWin();
    ready(randomPicture());
    startBtn.focus({ preventScroll: true });
  });
  closeBtn.addEventListener('click', closeWin);
  win.addEventListener('click', function (e) {
    /* a click on the backdrop lands on the dialog element itself */
    if (e.target === win) closeWin();
  });

  /* ---------- go ---------- */

  PICTURES.forEach(function (p) { var i = new Image(); i.src = BASE + p.file; });
  build();
  showBest();
  ready(Math.floor(Math.random() * PICTURES.length));

  /* for the smoke test and for anyone curious in the console */
  window.__revhopsPuzzle = {
    state: function () { return state; },
    cells: function () { return cells.slice(); },
    solvable: function (c) { return inversions(c) % 2 === 0; },
    shuffled: shuffled
  };
})();
