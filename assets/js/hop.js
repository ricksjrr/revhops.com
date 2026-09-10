/* ==========================================================================
   RevHops — the RevOps run (/hop)

   A side-scrolling runner. The rabbit runs, fires come along the ground and
   have to be jumped, requests fly in and mostly have to be ducked, and the
   pace keeps climbing until something lands. Loaded on /hop only.

   Everything is drawn on one canvas in WORLD units: the world is always 240
   units tall and as wide as the stage's aspect ratio allows (720 on a 3:1
   desktop stage, 480 on the 2:1 phone stage). The canvas is scaled to fit,
   so the physics never depend on the size of the screen.

   Heights above the ground are measured UP (player.h, player.vh), because
   "how high is the rabbit" is the question the game keeps asking. They are
   turned into canvas y only when drawing and hit-testing.

   Three kinds of request, by height:
     duck  at head height. Duck under it. Jumping it is possible but tight.
     low   just off the ground. Jump it.
     high  above the rabbit's head. Run under it; a panicked jump hits it.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.querySelector('[data-hop]');
  if (!root) return;

  var IMG = root.getAttribute('data-img-base') || 'assets/img/';
  var BEST_KEY = 'revhops-hop-best';

  var stage    = root.querySelector('[data-hp-stage]');
  var canvas   = root.querySelector('[data-hp-canvas]');
  var cover    = root.querySelector('[data-hp-cover]');
  var coverMsg = root.querySelector('[data-hp-cover-msg]');
  var startBtn = root.querySelector('[data-hp-start]');
  var scoreEl  = root.querySelector('[data-hp-score]');
  var speedEl  = root.querySelector('[data-hp-speed]');
  var bestEl   = root.querySelector('[data-hp-best]');
  var statsEl  = root.querySelector('.hp-stats');
  var jumpPad  = root.querySelector('[data-hp-jump]');
  var duckPad  = root.querySelector('[data-hp-duck]');

  var over       = document.querySelector('[data-hp-over]');
  var overTitle  = document.querySelector('[data-hp-over-title]');
  var overText   = document.querySelector('[data-hp-over-text]');
  var overScore  = document.querySelector('[data-hp-over-score]');
  var overSpeed  = document.querySelector('[data-hp-over-speed]');
  var overTime   = document.querySelector('[data-hp-over-time]');
  var overRecord = document.querySelector('[data-hp-record]');
  var againBtn   = document.querySelector('[data-hp-again]');
  var closeBtn   = document.querySelector('[data-hp-close]');
  var confetti   = document.querySelector('[data-hp-confetti]');

  var ctx = canvas.getContext('2d');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- the world ---------- */

  var H = 240;                 // world height, fixed
  var W = 720;                 // world width, from the stage's aspect ratio
  var GROUND = H - 38;         // canvas y of the ground line
  var PX = 70;                 // the rabbit's left edge
  var SIZE = 54;               // the rabbit, drawn square

  /* A jump peaks about 115 units up and lasts about 0.6s whatever the
     speed, so what changes as the game speeds up is how much ground a jump
     covers and how little warning there is. That is the difficulty curve. */
  var GRAVITY = 2500;
  var JUMP_V  = 760;           // take-off speed
  var CUT_V   = 330;           // let go early and the rise is cut to this: a short hop
  var DIVE    = 4200;          // extra gravity while Down is held in the air
  var BUFFER  = 0.12;          // a jump pressed this close to landing still counts

  var START_SPEED = 400;       // units per second
  var ACCEL       = 7.5;       // per second, per second: about 1.9x after a minute
  var MAX_SPEED   = 1200;
  var CHIP_EXTRA  = 60;        // requests fly a little faster than the ground scrolls
  var POINTS      = 0.025;     // score per unit run: about 10 a second at the start

  var FONT = '700 13px Lato, system-ui, sans-serif';
  var CHIP_H = 26;

  var REQUESTS = [
    'Quick field?', 'Urgent report', 'New pipeline?', 'Can you just...',
    'ASAP dashboard', 'Sync is down', 'Per my last email', 'Quick question',
    'Clean the lists', 'One more property', 'Who owns this?', 'Rebuild the deck',
    'Need it by EOD', 'Merge these?', 'Just a small tweak'
  ];
  /* low requests have to be jumped, so they stay short enough to clear */
  var SHORT = REQUESTS.filter(function (r) { return r.length <= 13; });

  /* ---------- state ---------- */

  var state = 'ready';         // ready | playing | paused | over
  var speedScale = 1;
  var speed = START_SPEED;
  var topSpeed = START_SPEED;
  var t = 0;                   // seconds of running
  var score = 0;
  var shownScore = -1;
  var milestone = 0;
  var spawnIn = 0;
  var obstacles = [];
  var clouds = [];
  var pebbles = [];
  var hillOff = 0;
  var hit = null;              // what got us: { kind, x, y }
  var raf = 0;
  var last = 0;
  var dpr = 1, scale = 1;

  var player = { h: 0, vh: 0, air: false, ducking: false, phase: 0 };
  var jumpHeld = false, duckHeld = false, jumpQueued = -1;

  var rabbit = new Image();
  rabbit.onload = function () { draw(performance.now() / 1000); };
  rabbit.src = IMG + 'revhops-icon-white.png';

  /* ---------- helpers ---------- */

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function format(ms) {
    var tenths = Math.floor(ms / 100);
    var m = Math.floor(tenths / 600);
    var s = Math.floor((tenths % 600) / 10);
    return m + ':' + (s < 10 ? '0' : '') + s + '.' + (tenths % 10);
  }
  function multiplier(v) { return (v / (START_SPEED * speedScale)).toFixed(1) + 'x'; }

  function readBest() {
    try {
      var v = JSON.parse(localStorage.getItem(BEST_KEY));
      return v && typeof v.score === 'number' ? v : null;
    } catch (e) { return null; }
  }
  function writeBest(v) {
    try { localStorage.setItem(BEST_KEY, JSON.stringify(v)); } catch (e) { /* private mode */ }
  }
  function showBest() {
    var b = readBest();
    bestEl.textContent = b ? b.score.toLocaleString() : 'None yet';
    bestEl.classList.toggle('is-empty', !b);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ---------- sizing ---------- */

  function resize() {
    var r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    scale = r.height / H;
    W = r.width / scale;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    /* A narrower world means less warning, so it also runs a little slower.
       Roughly the same reaction time on a phone as on a laptop. */
    speedScale = clamp(W / 720, 0.72, 1);
    if (!clouds.length) scenery();
    draw(performance.now() / 1000);
  }

  function scenery() {
    clouds = [];
    for (var i = 0; i < 4; i++) clouds.push(cloud(W * i / 4 + rand(0, W / 4)));
    pebbles = [];
    for (var j = 0; j < 26; j++) pebbles.push(pebble(rand(0, W + 40)));
  }
  function cloud(x) { return { x: x, y: rand(26, GROUND - 120), r: rand(14, 30) }; }
  function pebble(x) { return { x: x, y: rand(GROUND + 8, H - 6), w: rand(3, 14) }; }

  /* ---------- obstacles ---------- */

  function makeFire() {
    var n = 1;
    if (score > 250 && Math.random() < 0.3) n = 2;
    if (score > 600 && Math.random() < 0.2) n = 3;
    var big = Math.random() < 0.4;
    var flames = [], x = 0;
    for (var i = 0; i < n; i++) {
      var w = (big ? 30 : 24) + rand(0, 4);
      var h = (big ? 48 : 34) + rand(0, 6);
      flames.push({ dx: x + w / 2, w: w, h: h, seed: rand(0, 100) });
      x += w * 0.78;
    }
    return { kind: 'fire', w: x + 6, flames: flames };
  }

  function makeChip() {
    var r = Math.random(), level;
    if (score > 350 && r < 0.22) level = 'high';
    else if (r < 0.55) level = 'low';
    else level = 'duck';
    var label = pick(level === 'low' ? SHORT : REQUESTS);
    ctx.save();
    ctx.font = FONT;
    var w = Math.ceil(ctx.measureText(label).width) + 34;
    ctx.restore();
    var top = level === 'duck' ? GROUND - 38 - CHIP_H
            : level === 'low'  ? GROUND - 30
            :                    GROUND - 128;
    return { kind: 'chip', level: level, label: label, w: w, top: top, seed: rand(0, 100) };
  }

  function spawn() {
    var o = score > 150 && Math.random() < 0.34 ? makeChip() : makeFire();
    o.x = W + 20;
    obstacles.push(o);
    /* The gap to the next one always leaves room to land and take off
       again: a jump covers about 0.6s of ground, so the floor is 0.66s of
       it plus a margin. Requests fly faster than the ground and eat into
       the gap behind whatever is ahead of them, so they get extra. */
    spawnIn = o.w + speed * rand(0.66, 1.4) + 70 + (o.kind === 'chip' ? 90 : 0);
  }

  /* ---------- hit boxes ----------
     Forgiving on purpose: every box sits inside the drawn shape, so a near
     miss that LOOKS like a miss is one. */

  function playerBoxes() {
    var base = GROUND - player.h;
    if (player.ducking) return [[PX + 2, base - 24, 52, 22]];
    return [
      [PX + 9,  base - 29, 38, 24],   // body
      [PX + 28, base - 48, 18, 20]    // head and ears
    ];
  }
  function obstacleBoxes(o) {
    if (o.kind === 'fire') {
      return o.flames.map(function (f) {
        return [o.x + f.dx - f.w * 0.28, GROUND - f.h * 0.72, f.w * 0.56, f.h * 0.72];
      });
    }
    return [[o.x + 3, o.top + 3, o.w - 6, CHIP_H - 6]];
  }
  function overlap(a, b) {
    return a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];
  }

  /* ---------- one step of the game ---------- */

  function step(dt) {
    t += dt;
    speed = Math.min(MAX_SPEED, START_SPEED + ACCEL * t) * speedScale;
    topSpeed = Math.max(topSpeed, speed);
    score += (speed / speedScale) * dt * POINTS;

    /* the rabbit */
    if (jumpQueued >= 0) {
      jumpQueued -= dt;
      if (!player.air) { takeOff(); jumpQueued = -1; }
    }
    if (player.air) {
      player.vh -= (GRAVITY + (duckHeld ? DIVE : 0)) * dt;
      player.h += player.vh * dt;
      if (player.h <= 0) {
        player.h = 0; player.vh = 0; player.air = false;
        if (jumpQueued >= 0) { takeOff(); jumpQueued = -1; }
      }
    }
    player.ducking = duckHeld && !player.air;
    player.phase += dt * (9 + speed / 90);

    /* the world */
    hillOff += speed * 0.22 * dt;
    clouds.forEach(function (c, i) {
      c.x -= speed * 0.12 * dt;
      if (c.x < -c.r * 2) clouds[i] = cloud(W + rand(40, 260));
    });
    pebbles.forEach(function (p, i) {
      p.x -= speed * dt;
      if (p.x < -p.w) pebbles[i] = pebble(W + rand(0, 40));
    });

    for (var i = obstacles.length - 1; i >= 0; i--) {
      var o = obstacles[i];
      o.x -= (speed + (o.kind === 'chip' ? CHIP_EXTRA * speedScale : 0)) * dt;
      if (o.x + o.w < -30) obstacles.splice(i, 1);
    }
    spawnIn -= speed * dt;
    if (spawnIn <= 0) spawn();

    /* collisions */
    var pb = playerBoxes();
    for (var k = 0; k < obstacles.length; k++) {
      var boxes = obstacleBoxes(obstacles[k]);
      for (var a = 0; a < pb.length; a++) {
        for (var b = 0; b < boxes.length; b++) {
          if (overlap(pb[a], boxes[b])) {
            hit = { kind: obstacles[k].kind, x: pb[a][0] + pb[a][2], y: pb[a][1] + pb[a][3] / 2 };
            return die();
          }
        }
      }
    }

    /* the numbers beside the board */
    var s = Math.floor(score);
    if (s !== shownScore) {
      shownScore = s;
      scoreEl.textContent = s.toLocaleString();
      speedEl.textContent = multiplier(speed);
      if (Math.floor(s / 100) > milestone) {
        milestone = Math.floor(s / 100);
        scoreEl.classList.remove('is-flash');
        void scoreEl.offsetWidth;          // restart the animation
        scoreEl.classList.add('is-flash');
      }
    }
  }

  function takeOff() {
    player.vh = JUMP_V;
    player.air = true;
    /* let go before take-off and it is a short hop straight away */
    if (!jumpHeld) player.vh = Math.min(player.vh, CUT_V + 140);
  }

  /* ---------- drawing ---------- */

  function draw(now) {
    if (!canvas.width) return;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    ctx.clearRect(0, 0, W, H);

    /* far hills */
    ctx.beginPath();
    ctx.moveTo(0, GROUND);
    for (var x = 0; x <= W + 8; x += 8) {
      var X = x + hillOff;
      ctx.lineTo(x, GROUND - 26 - 16 * Math.sin(X * 0.011) - 9 * Math.sin(X * 0.029 + 1.3));
    }
    ctx.lineTo(W, GROUND);
    ctx.closePath();
    ctx.fillStyle = 'rgba(198, 211, 224, .07)';
    ctx.fill();

    /* clouds: soft discs, the brand's circles at a distance */
    ctx.fillStyle = 'rgba(198, 211, 224, .05)';
    clouds.forEach(function (c) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.arc(c.x + c.r * 0.9, c.y + c.r * 0.25, c.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    });

    /* the ground */
    ctx.fillStyle = 'rgba(250, 250, 248, .55)';
    ctx.fillRect(0, GROUND, W, 2);
    ctx.fillStyle = 'rgba(250, 250, 248, .2)';
    pebbles.forEach(function (p) { ctx.fillRect(p.x, p.y, p.w, 1.5); });

    obstacles.forEach(function (o) {
      if (o.kind === 'fire') drawFire(o, now);
      else drawChip(o, now);
    });

    drawRabbit();
    if (hit) drawHit();
  }

  function flame(cx, base, w, h, now, seed, colour) {
    var f = 1 + Math.sin(now * 14 + seed) * 0.08 + Math.sin(now * 23 + seed * 2) * 0.05;
    var hh = h * f;
    var sway = Math.sin(now * 9 + seed) * w * 0.12;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, base);
    ctx.bezierCurveTo(cx - w / 2, base - hh * 0.5, cx - w * 0.12 + sway, base - hh * 0.62, cx + sway, base - hh);
    ctx.bezierCurveTo(cx + w * 0.12 + sway, base - hh * 0.62, cx + w / 2, base - hh * 0.5, cx + w / 2, base);
    ctx.quadraticCurveTo(cx, base + w * 0.18, cx - w / 2, base);
    ctx.fillStyle = colour;
    ctx.fill();
  }

  function drawFire(o, now) {
    /* a warm glow on the ground under it */
    var gx = o.x + o.w / 2;
    var g = ctx.createRadialGradient(gx, GROUND, 2, gx, GROUND, o.w + 26);
    g.addColorStop(0, 'rgba(242, 195, 155, .30)');
    g.addColorStop(1, 'rgba(242, 195, 155, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(gx - o.w - 26, GROUND - o.w - 26, (o.w + 26) * 2, o.w + 26);

    o.flames.forEach(function (f) {
      var cx = o.x + f.dx;
      flame(cx, GROUND + 1, f.w,        f.h,        now, f.seed,     '#E8A66F');
      flame(cx, GROUND + 1, f.w * 0.64, f.h * 0.68, now, f.seed + 3, '#F2C39B');
      flame(cx, GROUND + 1, f.w * 0.3,  f.h * 0.34, now, f.seed + 7, '#FAFAF8');
    });
  }

  function drawChip(o, now) {
    var bob = Math.sin(now * 5 + o.seed) * 2;
    var x = o.x, y = o.top + bob;

    /* speed lines trailing behind it */
    ctx.fillStyle = 'rgba(250, 250, 248, .32)';
    ctx.fillRect(x + o.w + 6,  y + 6,  18, 2);
    ctx.fillRect(x + o.w + 12, y + 12, 26, 2);
    ctx.fillRect(x + o.w + 6,  y + 18, 14, 2);

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, .3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    roundRect(x, y, o.w, CHIP_H, 7);
    ctx.fillStyle = '#FAFAF8';
    ctx.fill();
    ctx.restore();

    /* the notification dot that makes it a request */
    ctx.beginPath();
    ctx.arc(x + 14, y + CHIP_H / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#E8A66F';
    ctx.fill();

    ctx.font = FONT;
    ctx.fillStyle = '#304157';
    ctx.textBaseline = 'middle';
    ctx.fillText(o.label, x + 25, y + CHIP_H / 2 + 1);
  }

  function drawRabbit() {
    if (!rabbit.complete || !rabbit.naturalWidth) return;
    var base = GROUND - player.h;

    /* its shadow on the ground, smaller the higher it goes */
    var sh = clamp(1 - player.h / 160, 0.35, 1);
    ctx.beginPath();
    ctx.ellipse(PX + SIZE / 2, GROUND + 2, 22 * sh, 3.5 * sh, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, .28)';
    ctx.fill();

    ctx.save();
    if (player.ducking) {
      ctx.drawImage(rabbit, PX - 4, base - 30, SIZE + 8, 30);
    } else {
      var bob = 0, sx = 1, sy = 1, rot = 0;
      if (state === 'over') {
        rot = -0.35;
      } else if (player.air) {
        rot = clamp(-player.vh / 2600, -0.24, 0.24);
        sx = 0.95; sy = 1.05;
      } else if (state === 'playing') {
        /* running is a string of little hops: up, land, squash */
        var p = Math.abs(Math.sin(player.phase));
        bob = p * 5;
        sy = 1 - (1 - p) * 0.08;
        sx = 1 + (1 - p) * 0.06;
      }
      ctx.translate(PX + SIZE / 2, base - bob);
      ctx.rotate(rot);
      ctx.scale(sx, sy);
      ctx.drawImage(rabbit, -SIZE / 2, -SIZE, SIZE, SIZE);
    }
    ctx.restore();
  }

  function drawHit() {
    ctx.strokeStyle = '#F2C39B';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (var i = 0; i < 6; i++) {
      var a = i / 6 * Math.PI * 2 + 0.3;
      ctx.beginPath();
      ctx.moveTo(hit.x + Math.cos(a) * 10, hit.y + Math.sin(a) * 10);
      ctx.lineTo(hit.x + Math.cos(a) * 20, hit.y + Math.sin(a) * 20);
      ctx.stroke();
    }
  }

  /* ---------- the loop ---------- */

  function frame(now) {
    /* capped, so a stutter or a background tab cannot teleport the rabbit
       through a fire */
    var dt = Math.min(0.034, (now - last) / 1000);
    last = now;
    if (state === 'playing') step(dt);
    draw(now / 1000);
    if (state === 'playing') raf = requestAnimationFrame(frame);
  }

  /* ---------- states ---------- */

  function showCover(msg, label) {
    coverMsg.textContent = msg;
    startBtn.textContent = label;
    cover.classList.remove('is-off');
  }
  function hideCover() { cover.classList.add('is-off'); }

  function reset() {
    t = 0; score = 0; shownScore = -1; milestone = 0; hit = null;
    speed = START_SPEED * speedScale; topSpeed = speed;
    obstacles = [];
    spawnIn = W * 0.55;
    player.h = 0; player.vh = 0; player.air = false; player.ducking = false; player.phase = 0;
    jumpHeld = false; duckHeld = false; jumpQueued = -1;
    scoreEl.textContent = '0';
    speedEl.textContent = '1.0x';
    scoreEl.classList.remove('is-flash');
  }

  /* What the board shows before the first run: the rabbit sitting, a fire
     ahead of it and a request coming in, so the two jobs are obvious. */
  function ready() {
    reset();
    state = 'ready';
    var f = makeFire(); f.x = W * 0.5; obstacles.push(f);
    var c = makeChip(); c.level = 'duck'; c.top = GROUND - 38 - CHIP_H; c.x = W * 0.72; obstacles.push(c);
    draw(performance.now() / 1000);
  }

  function start() {
    cancelAnimationFrame(raf);
    reset();
    state = 'playing';
    root.classList.add('is-playing');
    hideCover();
    fit();
    stage.focus({ preventScroll: true });
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function pause() {
    if (state !== 'playing') return;
    state = 'paused';
    cancelAnimationFrame(raf);
    jumpHeld = duckHeld = false;
    root.classList.remove('is-playing');
    showCover('Paused. The requests will wait, just this once.', 'Keep running');
    startBtn.focus({ preventScroll: true });
  }
  function resume() {
    state = 'playing';
    root.classList.add('is-playing');
    hideCover();
    stage.focus({ preventScroll: true });
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function die() {
    state = 'over';
    cancelAnimationFrame(raf);
    jumpHeld = duckHeld = false;
    player.ducking = false;
    root.classList.remove('is-playing');
    draw(performance.now() / 1000);
    if (!reduceMotion) {
      stage.classList.remove('is-hit');
      void stage.offsetWidth;
      stage.classList.add('is-hit');
    }

    var final = Math.floor(score);
    var best = readBest();
    var record = final > 0 && (!best || final > best.score);
    if (record) writeBest({ score: final, ms: Math.round(t * 1000), at: Date.now() });
    showBest();

    var fire = hit && hit.kind === 'fire';
    overTitle.textContent = fire ? 'Too close to the fire' : 'A request got you';
    overText.textContent = fire
      ? 'Every RevOps team has one burning somewhere. Hop back in and beat your score.'
      : 'They never stop coming. Hop back in and beat your score.';
    overScore.textContent = final.toLocaleString();
    overSpeed.textContent = multiplier(topSpeed);
    overTime.textContent = format(t * 1000);
    overRecord.hidden = !record;

    setTimeout(function () { openOver(record); }, reduceMotion ? 150 : 750);
  }

  function openOver(record) {
    if (state !== 'over') return;
    if (typeof over.showModal === 'function') {
      if (!over.open) over.showModal();
    } else {
      over.setAttribute('open', '');
    }
    againBtn.focus();
    if (record) burst();
  }
  function closeOver() {
    if (typeof over.close === 'function' && over.open) over.close();
    else over.removeAttribute('open');
  }

  /* On a short screen the board can start under the fold. Same rule as the
     puzzle: if it is not all on screen, scroll it to just under the nav. */
  function fit() {
    var NAV_CLEAR = 104;
    var topEl = window.matchMedia('(max-width: 900px)').matches ? statsEl : stage;
    var top = topEl.getBoundingClientRect().top;
    var bottom = (jumpPad && jumpPad.offsetParent ? jumpPad : stage).getBoundingClientRect().bottom;
    if (bottom <= window.innerHeight - 16 && top >= NAV_CLEAR) return;
    window.scrollBy({ top: top - NAV_CLEAR, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function stageOnScreen() {
    var r = stage.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  /* ---------- confetti, for a new best only ---------- */

  function burst() {
    if (reduceMotion || !confetti || !confetti.getContext) return;
    var c = confetti.getContext('2d');
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth, h = window.innerHeight;
    confetti.width = w * ratio;
    confetti.height = h * ratio;
    c.setTransform(ratio, 0, 0, ratio, 0, 0);

    var colours = ['#F2C39B', '#E8A66F', '#304157', '#6B7A93', '#C6D3E0', '#FAFAF8'];
    var bits = [];
    for (var i = 0; i < 190; i++) {
      var fromTop = i < 110;
      bits.push({
        x: fromTop ? Math.random() * w : w / 2 + (Math.random() - .5) * 120,
        y: fromTop ? -20 - Math.random() * h * .5 : h * .45,
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
    (function tick(now) {
      var age = now - t0;
      c.clearRect(0, 0, w, h);
      c.globalAlpha = age > 3200 ? Math.max(0, 1 - (age - 3200) / 800) : 1;
      bits.forEach(function (b) {
        b.vy += .18; b.vx *= .99; b.x += b.vx; b.y += b.vy; b.a += b.va;
        c.save();
        c.translate(b.x, b.y);
        c.rotate(b.a);
        c.fillStyle = b.c;
        c.fillRect(-b.w / 2, -b.h / 2 * Math.abs(Math.cos(b.a * 2)), b.w, b.h * Math.abs(Math.cos(b.a * 2)) + 1);
        c.restore();
      });
      if (age < 4000) requestAnimationFrame(tick);
      else c.clearRect(0, 0, w, h);
    })(t0);
  }

  /* ---------- input ---------- */

  function pressJump() {
    if (state !== 'playing') return;
    jumpHeld = true;
    if (!player.air) takeOff();
    else jumpQueued = BUFFER;
  }
  function releaseJump() {
    jumpHeld = false;
    if (player.air && player.vh > CUT_V) player.vh = CUT_V;
  }

  function isJumpKey(k) { return k === ' ' || k === 'Spacebar' || k === 'ArrowUp' || k === 'w' || k === 'W'; }
  function isDuckKey(k) { return k === 'ArrowDown' || k === 's' || k === 'S'; }

  document.addEventListener('keydown', function (e) {
    if (over && over.open) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    var k = e.key;

    if (state === 'playing') {
      if (isJumpKey(k)) { e.preventDefault(); if (!e.repeat) pressJump(); }
      else if (isDuckKey(k)) { e.preventDefault(); duckHeld = true; }
      else if (k === 'Escape' || k === 'p' || k === 'P') { e.preventDefault(); pause(); }
      return;
    }
    /* Space starts a run too, the way it does in the game this is based on,
       but only when the board is on screen and nothing else has focus, so
       it never hijacks Space for scrolling the rest of the page. */
    var free = e.target === document.body || e.target === stage;
    if (isJumpKey(k) && free && stageOnScreen() && !e.repeat) {
      e.preventDefault();
      if (state === 'paused') resume(); else start();
    }
  });
  document.addEventListener('keyup', function (e) {
    if (isJumpKey(e.key)) releaseJump();
    else if (isDuckKey(e.key)) duckHeld = false;
  });

  /* a tap or click anywhere on the board is a jump */
  stage.addEventListener('pointerdown', function (e) {
    if (state !== 'playing' || e.target.closest('.hp-cover')) return;
    e.preventDefault();
    pressJump();
  });
  stage.addEventListener('pointerup', releaseJump);
  stage.addEventListener('pointercancel', releaseJump);

  /* the two touch pads, shown on touch screens only */
  function pad(el, down, up) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (el.setPointerCapture) try { el.setPointerCapture(e.pointerId); } catch (x) { /* fine */ }
      el.classList.add('is-down');
      down();
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) {
      el.addEventListener(ev, function () { el.classList.remove('is-down'); up(); });
    });
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }
  pad(jumpPad, pressJump, releaseJump);
  pad(duckPad, function () { duckHeld = true; }, function () { duckHeld = false; });

  startBtn.addEventListener('click', function () {
    if (state === 'paused') resume(); else start();
  });

  againBtn.addEventListener('click', function () { closeOver(); start(); });
  closeBtn.addEventListener('click', closeOver);
  over.addEventListener('click', function (e) { if (e.target === over) closeOver(); });
  /* however the dialog closes (the x, the backdrop, Escape), a finished run
     leaves the cover up with a way to go again */
  over.addEventListener('close', function () {
    if (state === 'over') showCover('Space, or the button, for another run.', 'Run again');
  });

  /* leave the tab or the window mid-run and it waits for you */
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
  window.addEventListener('blur', pause);

  /* ---------- go ---------- */

  if (window.ResizeObserver) new ResizeObserver(function () {
    resize();
    if (state === 'ready') ready();
  }).observe(stage);
  else window.addEventListener('resize', resize);

  showBest();
  resize();
  ready();
  /* the chip labels are measured in Lato; once it has loaded, redraw the
     opening board so its request is measured and drawn in the real face */
  if (document.fonts && document.fonts.load) {
    document.fonts.load(FONT).then(function () { if (state === 'ready') ready(); });
  }

  /* for the smoke test and for anyone curious in the console */
  window.__revhopsHop = {
    state: function () { return state; },
    score: function () { return score; },
    speed: function () { return speed; },
    world: function () { return { W: W, H: H, scale: scale }; },
    obstacles: function () { return obstacles.slice(); },
    player: function () { return { h: player.h, air: player.air, ducking: player.ducking }; }
  };
})();
