/* Bonus Adventures: six small games along the road, drawn on the main canvas with the same moose,
   vehicles, sprites and sounds as the drive. It runs after the game script, and every adventure is
   a list of scenes built from three shared activities: tapAll, dragTo and wipe.

   All scenes are laid out in a 640 x 420 box that is scaled to fit and centred. Backgrounds run
   past the box, so a phone in portrait gets more sky and ground rather than black bars. */
const Bonus = (() => {
  const BW = 640, BH = 420, GOLD = '#f6c21c';
  let k = 1, ox = 0, oy = 0, run = null, partyT = 0;
  const fx = [];
  const dist = (a, b, x, y) => Math.hypot(a - x, b - y);
  const hit = (it, x, y) => dist(it.x, it.y, x, y) < (it.r || 70);
  const wave = (t, a = 1, s = 1) => Math.sin(t * s) * a;

  /* ---------- sound ---------- */
  const note = i => beep(523.25 * Math.pow(2, [0, 2, 4, 7, 9, 12][i % 6] / 12), 0, .24, .12);
  const pop = () => { beep(500, 0, .1, .12, 'sine', 1.8); };
  const chirp = () => [0, .12, .24].forEach(t => beep(2200, t, .08, .06, 'sine', 1.4));
  const bubble = () => beep(300 + Math.random() * 500, 0, .12, .07, 'sine', 2.2);
  const whoosh = () => beep(180, 0, .5, .08, 'sawtooth', 2.4);
  const snap = () => { beep(330, 0, .08, .13, 'square', 1.2); beep(660, .08, .16, .1); };
  const spray = () => [0, .06, .12].forEach(t => beep(900 + t * 2000, t, .08, .03, 'sawtooth', .7));
  const CRIES = {
    fox() { beep(700, 0, .16, .08, 'sawtooth', .6); beep(700, .2, .16, .08, 'sawtooth', .6); },
    hare() { beep(1200, 0, .06, .05, 'sine', 1.3); beep(1200, .1, .06, .05, 'sine', 1.3); },
    radjur() { beep(520, 0, .28, .08, 'triangle', .7); },
    ekorre() { for (let i = 0; i < 5; i++) beep(1500, i * .07, .05, .06, 'square', .8); },
    fagel: chirp,
  };

  /* ---------- little effects ---------- */
  function burst(x, y, colors = [GOLD, '#fff'], n = 12, shape = 'stars') {
    for (let i = 0; i < n; i++) {
      const a = i / n * 6.283, v = 70 + Math.random() * 90;
      fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: .8, age: 0, r: 5 + Math.random() * 6, c: colors[i % colors.length], g: 140, shape });
    }
  }
  function party() {
    const C = ['#f4614d', GOLD, '#22b3a6', '#f2577d', '#1d9bf0'];
    for (let i = 0; i < 26; i++) fx.push({ x: -ox + Math.random() * (BW + ox * 2), y: -oy - 10, vx: -30 + Math.random() * 60, vy: 60 + Math.random() * 120, life: 2.6, age: 0, r: 4 + Math.random() * 5, c: C[i % 5], g: 90 });
  }
  function drawFx(dt) {
    for (let i = fx.length - 1; i >= 0; i--) {
      const p = fx[i];
      p.age += dt; if (p.age > p.life) { fx.splice(i, 1); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      g.globalAlpha = 1 - p.age / p.life; g.fillStyle = p.c; shapePath(p.shape, p.x, p.y, p.r); g.fill();
    }
    g.globalAlpha = 1;
  }
  function ring(x, y, r) { // the gold pulse that says "touch me", in every adventure
    g.strokeStyle = GOLD; g.lineWidth = 5; g.globalAlpha = .55 + wave(S.t, .35, 5);
    g.beginPath(); g.arc(x, y, r + wave(S.t, 5, 5), 0, 7); g.stroke(); g.globalAlpha = 1;
  }

  /* ---------- scenery ---------- */
  function sky(top, low) {
    const f = g.createLinearGradient(0, -oy, 0, BH + oy); f.addColorStop(0, top); f.addColorStop(1, low);
    g.fillStyle = f; g.fillRect(-ox - 20, -oy - 20, BW + ox * 2 + 40, BH + oy * 2 + 40);
  }
  const ground = (y, c) => rect(0, -ox - 20, y, BW + ox * 2 + 40, BH + oy * 2 + 40, c);
  function at(x, y, s, draw) { g.save(); g.translate(x, y); g.scale(s, s); draw(); g.restore(); }
  const sprite = (kind, x, y, s = 1, c = { leaf: '#6fb54a', seed: 2 }) => at(x, y, s, () => SPRITE[kind](c));
  function flag(x, y, s = 1, flutter = 1) {
    at(x, y, s, () => {
      rect(0, -3, -96, 6, 96, '#8d95a5');
      const w = wave(S.t, 5 * flutter, 7);
      g.fillStyle = '#1668b5'; g.beginPath(); g.moveTo(3, -94); g.quadraticCurveTo(30, -94 + w, 62, -90); g.lineTo(62, -52); g.quadraticCurveTo(30, -56 + w, 3, -56); g.fill();
      rect(0, 17, -94, 10, 38, GOLD); rect(0, 3, -80, 59, 9, GOLD);
    });
  }
  function walker(x, y, s = 1, step = 0, jump = 0) { // the moose on its own legs, with the same head as in the car
    at(x, y - Math.abs(jump), s, () => {
      const a = Math.sin(step) * 8;
      for (const [lx, d] of [[-34, a], [-14, -a], [10, -a], [28, a]]) panel(lx + d, -44, 13, 44, 5, '#9c5a2f');
      g.fillStyle = '#b5683a'; g.beginPath(); g.ellipse(-4, -58, 48, 25, 0, 0, 7); g.fill();
      g.save(); g.translate(38, -54); drawMoose(104); g.restore();
    });
  }
  function clouds(t, n = 5, top = 26) {
    for (let i = 0; i < n; i++) {
      const span = BW + ox * 2 + 200, x = ((i * 233 + t * (7 + i % 3 * 3)) % span) - ox - 100, y = top + (i * 37) % 64, s = .6 + (i % 3) * .22;
      blob(0, [[x, y, 26 * s], [x + 30 * s, y + 6 * s, 21 * s], [x - 30 * s, y + 7 * s, 19 * s]], 'rgba(255,255,255,.92)');
    }
  }
  function shade(x, y, w, h = 9) { g.fillStyle = 'rgba(0,0,0,.14)'; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, 7); g.fill(); }
  function beams(t) { // sunlight through the trees
    g.fillStyle = '#fffbe0';
    for (let i = 0; i < 4; i++) { const x = 60 + i * 170; g.globalAlpha = .1 + wave(t + i, .05, .8); poly([[x, -oy - 20], [x + 66, -oy - 20], [x - 30, 300], [x - 130, 300]], '#fffbe0'); }
    g.globalAlpha = 1;
  }
  function butterflies(t) {
    [['#f2577d', 90, 230], ['#f6c21c', 300, 200], ['#7a5cd6', 510, 240], ['#fff', 620, 190]].forEach(([c, x, y], i) => {
      const bx = x + wave(t * .6 + i, 44), by = y + wave(t + i * 2, 22, 1.3), f = Math.abs(Math.sin(t * 10 + i));
      for (const d of [-1, 1]) { g.fillStyle = c; g.beginPath(); g.ellipse(bx + d * 6 * f, by, 7 * f + 1, 9, d * .4, 0, 7); g.fill(); }
      rect(0, bx - 1, by - 6, 2, 12, '#2b2d38');
    });
  }
  function rays(x, y, r, t, c = '#fff3a8', a = .5) {
    g.fillStyle = c; g.globalAlpha = a;
    for (let i = 0; i < 12; i++) { const q = t * .6 + i * .5236; poly([[x, y], [x + Math.cos(q - .11) * r, y + Math.sin(q - .11) * r], [x + Math.cos(q + .11) * r, y + Math.sin(q + .11) * r]], c); }
    g.globalAlpha = 1;
  }
  function moon(x, y) { g.globalAlpha = .18; blob(0, [[x, y, 58]], '#fff8d8'); g.globalAlpha = 1; blob(0, [[x, y, 34]], '#fff8d8'); blob(0, [[x - 10, y - 6, 6], [x + 10, y + 10, 4]], '#ece3b6'); }
  const look = () => ({ ...gear(run.def.winter) });
  const carAt = (x, y, s = 1, l = look(), angle = 0) => at(x, y, s, () => drawCar(0, 0, angle, l));

  /* ---------- shared activities. Nothing here can fail or run out of time ---------- */
  function tapAll({ bg, items, say: words, done }) {
    return { say: words,
      start(st) { st.items = items(st).map(it => ({ ...it, t: -1 })); },
      tap(st, x, y) {
        const it = st.items.find(i => hit(i, x, y));
        if (!it) return;
        const first = it.t < 0; it.t = 0;
        (it.sound || pop)(); burst(it.x, it.y - 10, it.colors, first ? 12 : 5);
        if (it.fn) it.fn(st, it, first);
      },
      draw(st, dt) {
        bg(st, dt);
        for (const it of st.items) { if (it.t >= 0) it.t += dt; it.draw(it, st); }
        for (const it of st.items) if (it.t < 0) ring(it.x, it.y, (it.r || 70) * .8);
      },
      done: done || (st => st.items.every(i => i.t >= (i.wait || .9))),
    };
  }
  function dragTo({ bg, pieces, say: words, drawTop }) { // tapping a piece sends it home too, so it needs no dragging
    return { say: words,
      start(st) { st.pieces = pieces(st).map(p => ({ ...p, hx: p.x, hy: p.y, placed: false, fly: 0 })); },
      down(st, x, y) {
        const p = st.pieces.find(q => !q.placed && hit({ x: q.x, y: q.y, r: 84 }, x, y));
        if (p) { st.held = p; st.moved = 0; p.fly = 0; }
      },
      move(st, x, y) { const p = st.held; if (p) { st.moved += dist(p.x, p.y, x, y); p.x = x; p.y = y; } },
      up(st) {
        const p = st.held; st.held = null;
        if (!p) return;
        p.fly = st.moved < 14 || dist(p.x, p.y, p.tx, p.ty) < 150 ? 1 : -1; // a near miss still lands
      },
      draw(st, dt) {
        for (const p of st.pieces) if (p.fly) {
          const tx = p.fly > 0 ? p.tx : p.hx, ty = p.fly > 0 ? p.ty : p.hy, d = dist(p.x, p.y, tx, ty), step = Math.min(1, dt * 9);
          p.x += (tx - p.x) * step; p.y += (ty - p.y) * step;
          if (d < 5) {
            p.x = tx; p.y = ty;
            if (p.fly > 0) { p.placed = true; (p.sound || snap)(); burst(tx, ty, p.colors); }
            p.fly = 0;
          }
        }
        bg(st, dt);
        const next = st.pieces.find(p => !p.placed);
        if (next && !st.held) { ring(next.tx, next.ty, 44); ring(next.x, next.y, 50); }
        for (const p of st.pieces) p.draw(p, st);
        if (drawTop) drawTop(st, dt);
      },
      done: st => st.pieces.every(p => p.placed),
    };
  }
  function wipe({ bg, spots, tool, drawSpot, sound, say: words, onClean, reach = 62 }) { // any touch cleans what is nearest, a stroke cleans all it passes
    const clean = (st, x, y, tapped) => {
      let hits = st.spots.filter(q => !q.gone && dist(q.x, q.y, x, y) < reach);
      if (!hits.length && tapped) {
        const left = st.spots.filter(q => !q.gone).sort((a, b) => dist(a.x, a.y, x, y) - dist(b.x, b.y, x, y));
        hits = left.slice(0, 1);
      }
      for (const q of hits) { q.gone = true; sound(); if (onClean) onClean(st, q); }
    };
    return { say: words,
      start(st) { st.spots = spots(st).map(q => ({ ...q, gone: false })); st.tool = { ...tool }; },
      down(st, x, y) { st.tool.x = x; st.tool.y = y; st.rub = true; clean(st, x, y, true); },
      move(st, x, y) { if (st.rub) { st.tool.x = x; st.tool.y = y; clean(st, x, y, false); } },
      up(st) { st.rub = false; },
      draw(st, dt) {
        bg(st, dt);
        for (const q of st.spots) if (!q.gone) drawSpot(q, st);
        if (!st.rub) { const n = st.spots.find(q => !q.gone); if (n) ring(n.x, n.y, 36); }
        at(st.tool.x, st.tool.y, 1, () => tool.draw(st));
      },
      done: st => st.spots.every(q => q.gone),
    };
  }

  /* ---------- 1. Linköping: the airplane museum ---------- */
  function propPlane(spin) {
    g.fillStyle = '#e8483f'; g.beginPath(); g.ellipse(0, 0, 66, 19, 0, 0, 7); g.fill();
    poly([[-58, -4], [-92, -38], [-74, -38], [-40, -8]], '#c9352c'); panel(-26, 2, 58, 11, 5, '#c9352c');
    panel(-8, -28, 32, 16, [14, 14, 0, 0], '#c6ecfb');
    rect(0, 64, -3, 8, 6, '#5b5a62');
    g.save(); g.translate(72, 0); g.scale(1, Math.cos(spin)); panel(-4, -36, 8, 72, 4, '#2b2d38'); g.restore();
    for (const x of [-16, 30]) blob(0, [[x, 24, 9]], '#2b2d38');
  }
  function liner(open, blink) {
    g.fillStyle = '#fbfdff'; g.beginPath(); g.moveTo(-108, -6); g.quadraticCurveTo(-96, -24, -50, -24); g.lineTo(84, -24); g.quadraticCurveTo(118, -20, 124, 2); g.quadraticCurveTo(116, 20, 84, 20); g.lineTo(-70, 20); g.quadraticCurveTo(-100, 16, -108, -6); g.fill();
    poly([[-74, -22], [-112, -66], [-88, -66], [-44, -22]], '#1d6fb8'); rect(0, -96, 2, 190, 6, '#1d6fb8');
    for (let x = -62; x < 80; x += 22) blob(0, [[x, -8, 6]], '#7fb0c8');
    panel(-20, 2, 74, 12, 6, '#d7dbe4');
    panel(84, -16, 22, 34, 6, open ? '#2b2d38' : '#d7dbe4'); if (open) poly([[84, 18], [106, 18], [120, 48], [98, 48]], '#8d95a5');
    blob(0, [[-104, -66, 7], [121, 2, 6]], blink ? '#ffef6e' : '#f4614d');
    for (const x of [-30, 66]) blob(0, [[x, 28, 9]], '#2b2d38');
  }
  function buildPlane(p, color, s = 1) { // the plane made in the workshop, also flown by the moose
    const c = color ? (run.store.plane || '#22b3a6') : '#b4bccb', dark = color ? 'rgba(18,48,107,.32)' : '#9aa2b2';
    at(0, 0, s, () => {
      if (p.tail) poly([[-74, -4], [-112, -56], [-86, -58], [-46, -8]], dark);
      g.fillStyle = c; g.beginPath(); g.ellipse(0, 0, 84, 25, 0, 0, 7); g.fill();
      if (color) { rect(0, -80, -3, 160, 7, GOLD); }
      panel(-10, -38, 44, 20, [16, 16, 0, 0], '#c6ecfb');
      if (color) for (const [i, q] of (run.store.crew || []).entries()) at(-38 + i * 26, -18, .3, () => SPRITE[q]({}));
      if (p.wing) poly([[-20, 6], [38, 6], [-30, 56], [-62, 56]], dark);
      if (p.prop) { rect(0, 82, -3, 10, 6, '#5b5a62'); g.save(); g.translate(92, 0); g.scale(1, color ? Math.cos(S.t * 26) : 1); panel(-4, -42, 8, 84, 4, '#2b2d38'); g.restore(); }
    });
  }
  function heli(on) {
    rect(0, -6, -46, 12, 14, '#5b5a62'); g.save(); g.translate(0, -46); g.scale(on ? Math.cos(S.t * 30) : 1, 1); panel(-74, -4, 148, 8, 4, '#2b2d38'); g.restore();
    g.fillStyle = '#f6c21c'; g.beginPath(); g.ellipse(0, -8, 46, 28, 0, 0, 7); g.fill(); panel(8, -28, 34, 26, [14, 14, 4, 4], '#c6ecfb');
    poly([[-40, -14], [-112, -18], [-112, -4], [-40, 0]], '#f6c21c'); panel(-120, -26, 8, 30, 4, '#2b2d38'); panel(-34, 26, 74, 6, 3, '#2b2d38'); for (const x of [-20, 22]) rect(0, x, 16, 4, 12, '#2b2d38');
  }
  const hangar = st => {
    sky('#dbeef7', '#f2f7fa'); ground(322, '#c9ccd4');
    rect(0, -ox - 20, 318, BW + ox * 2 + 40, 6, '#a6abb7');
    g.fillStyle = 'rgba(255,255,255,.5)'; for (let x = -ox; x < BW + ox; x += 150) poly([[x, 322], [x + 60, 322], [x + 10, BH + oy], [x - 90, BH + oy]], 'rgba(255,255,255,.34)');
    for (let x = -200; x < BW + 200; x += 170) { panel(x, 76, 120, 74, 8, '#a9dcf5'); rect(0, x + 58, 76, 4, 74, '#fff'); rect(0, x, 110, 120, 4, '#fff'); }
    for (const [x, c] of [[90, '#e8483f'], [320, '#f6c21c'], [548, '#1d9bf0']]) { rect(0, x - 1, 56, 2, 16, '#7f93a6'); poly([[x - 22, 72], [x + 22, 72], [x + 22, 112], [x, 126], [x - 22, 112]], c); }
    g.strokeStyle = '#a9c6d8'; g.lineWidth = 8; g.beginPath();
    for (let x = -300; x < BW + 300; x += 110) { g.moveTo(x, 60); g.lineTo(x + 55, 120); g.lineTo(x + 110, 60); }
    g.moveTo(-ox - 20, 60); g.lineTo(BW + ox + 20, 60); g.stroke();
    rect(0, -ox - 20, 40, BW + ox * 2 + 40, 16, '#7f93a6');
  };
  const museum = () => {
    sky('#8ad6f5', '#e6f7fb'); ground(330, '#8ccf7b'); rect(0, -ox - 20, 330, BW + ox * 2 + 40, 44, '#565c6b');
    panel(300, 130, 300, 200, [90, 90, 0, 0], '#f2d9a0'); panel(390, 224, 120, 106, [14, 14, 0, 0], '#7fb0c8'); for (const x of [420, 450, 480]) rect(0, x, 224, 3, 106, '#fff');
    rect(0, 300, 196, 300, 14, '#1d6fb8'); flag(280, 330, 1.1); sprite('jet', 180, 300, .5);
  };
  const FLYG = {
    id: 'flyg', after: 6, title: 'Flygmuseet', place: 'Linköping', reward: 150, gift: { cat: 'extra', id: 'pilot' }, parkAt: 130, parkY: 366, bg: museum, say: 'Flygmuseet i Linköping!',
    icon() { at(0, -30, .8, () => propPlane(.7)); },
    scenes: [
      tapAll({ say: 'Tryck på flygplanen!', bg: hangar, items: () => [
        { x: 120, y: 198, r: 90, sound: () => { for (let i = 0; i < 6; i++) beep(110, i * .07, .06, .1, 'sawtooth'); }, draw(it) { shade(it.x, 262, 74); at(it.x, it.y, .95, () => propPlane(it.t >= 0 ? S.t * 26 : .5)); } },
        { x: 480, y: 160, r: 104, sound: () => { beep(740, 0, .14, .08); beep(587, .16, .2, .08); }, draw(it) { at(it.x, it.y, .95, () => liner(it.t >= 0, it.t >= 0 && S.t % .6 < .3)); } },
        { x: 240, y: 322, r: 96, sound: whoosh, draw(it) {
          const go = it.t >= 0 ? Math.min(it.t, 1.2) * 50 : 0;
          shade(it.x + go, it.y + 8, 80);
          at(it.x + go, it.y, .62, () => { if (it.t >= 0) { g.fillStyle = '#f6a91c'; g.beginPath(); g.ellipse(-168, -110, 30 + wave(S.t, 8, 30), 9, 0, 0, 7); g.fill(); } SPRITE.jet({}); });
        } },
        { x: 490, y: 306, r: 90, sound: () => { for (let i = 0; i < 8; i++) beep(150, i * .06, .05, .08, 'triangle'); }, draw(it) {
          const lift = it.t >= 0 ? Math.abs(wave(it.t, 40, 1.6)) : 0;
          shade(it.x, 344, 70 - lift * .4); at(it.x, it.y - lift + 8, .9, () => heli(it.t >= 0));
        } },
      ] }),
      dragTo({ say: 'Bygg ett flygplan!',
        bg(st) { hangar(st); at(320, 180, 1.5, () => buildPlane({ wing: st.pieces[0].placed, prop: st.pieces[1].placed, tail: st.pieces[2].placed }, st.pieces.every(p => p.placed))); },
        pieces: () => [
          { x: 96, y: 340, tx: 296, ty: 225, draw(p) { if (!p.placed) at(p.x, p.y, 1.3, () => poly([[-41, -25], [17, -25], [-51, 25], [-83, 25]].map(([a, b]) => [a + 30, b]), '#178b81')); } },
          { x: 320, y: 352, tx: 458, ty: 180, draw(p) { if (!p.placed) { at(p.x, p.y, 1.3, () => { panel(-4, -42, 8, 84, 4, '#2b2d38'); blob(0, [[0, 0, 9]], '#5b5a62'); }); } } },
          { x: 540, y: 340, tx: 178, ty: 135, draw(p) { if (!p.placed) at(p.x, p.y, 1.3, () => poly([[-30, 26], [-66, -26], [-40, -28], [0, 22]].map(([a, b]) => [a + 30, b]), '#178b81')); } },
        ] }),
      { say: 'Vilken färg ska planet ha?',
        start(st) {
          st.pots = ['#e8483f', '#f6c21c', '#22b3a6', '#1d9bf0', '#f2577d', '#7a5cd6'].map((c, i) => ({ c, x: 80 + i * 96, y: 356 }));
          st.tries = 0;
        },
        tap(st, x, y) {
          const p = st.pots.find(q => dist(q.x, q.y, x, y) < 56);
          if (p) { st.run.plane = p.c; st.tries++; note(st.tries); burst(320, 180, [p.c, '#fff'], 18); }
        },
        draw(st) {
          hangar(st); at(320, 180, 1.6 + wave(S.t, .02, 6), () => buildPlane({ wing: 1, prop: 1, tail: 1 }, !!st.run.plane));
          for (const p of st.pots) { const on = st.run.plane === p.c; shade(p.x, p.y + 40, 40); panel(p.x - 36, p.y - (on ? 46 : 34), 72, 74, 14, '#d7dbe4'); blob(0, [[p.x, p.y - (on ? 38 : 26), 32]], p.c); if (!st.tries) ring(p.x, p.y - 8, 44); }
        },
        ready: st => st.tries > 0, done: st => st.finished,
      },
      dragTo({ say: 'Hjälp vännerna ombord!',
        bg(st) { hangar(st); shade(420, 300, 170, 12); at(420, 240, 1.5, () => buildPlane({ wing: 1, prop: 1, tail: 1 }, true)); },
        pieces: st => { st.run.crew = []; return ['hare', 'hedgehog', 'duck'].map((kind, i) => ({ x: 70 + i * 92, y: 340, tx: 372 + i * 38, ty: 212, sound() { note(i + 2); st.run.crew.push(kind); }, draw(p) { if (!p.placed) at(p.x, p.y + 26, .9, () => SPRITE[kind]({})); } })); } }),
      { say: 'Flyg och ta stjärnorna!',
        start(st) { st.y = 200; st.x = 0; st.len = 4100; st.got = 0; st.hoops = 0; st.stars = [{ x: 620, y: 110 }, { x: 1120, y: 300 }, { x: 1660, y: 150 }, { x: 2200, y: 280 }, { x: 2760, y: 120 }, { x: 3320, y: 240 }]; st.rings = [{ x: 880, y: 190 }, { x: 1940, y: 220 }, { x: 3040, y: 170 }]; st.balloons = Array.from({ length: 7 }, (_, i) => ({ x: 480 + i * 520, y: 90 + (i * 90) % 220, c: ['#f4614d', '#f2577d', '#7a5cd6', '#f6a91c'][i % 4] })); st.clouds = Array.from({ length: 15 }, (_, i) => ({ x: 300 + i * 270, y: 70 + (i * 137) % 250 })); st.dir = 0; },
        down(st, x, y) { st.dir = y < 210 ? -1 : 1; },
        up(st) { st.dir = 0; },
        draw(st, dt) {
          st.x += 190 * dt; const landing = st.x > st.len - 260;
          st.y += st.dir * 240 * dt;
          if (landing) st.y += (330 - st.y) * Math.min(1, dt * 2.4);
          st.y = clamp(st.y, 50, 340);
          sky('#7fd0f4', '#e6f7fb');
          const hill = 372; ground(hill, '#8ccf7b');
          clouds(S.t, 4, 20);
          const far = st.x * .25; for (let i = -1; i < 9; i++) { const hx = i * 300 - far % 300; g.fillStyle = '#a6d6c6'; g.beginPath(); g.ellipse(hx, 372, 220, 70, 0, 0, 7); g.fill(); }
          ground(hill, '#8ccf7b');
          for (const c of st.clouds) { const cx = c.x - st.x; if (cx > -ox - 90 && cx < BW + ox + 90) blob(0, [[cx, c.y, 32], [cx + 36, c.y + 6, 26], [cx - 36, c.y + 8, 24]], '#fff'); }
          for (const q of st.stars) {
            const qx = q.x - st.x;
            if (!q.got && dist(qx, q.y, 170, st.y) < 96) { q.got = true; st.got++; note(st.got); burst(qx, q.y); }
            if (!q.got && qx > -60 && qx < BW + ox + 60) { g.fillStyle = GOLD; shapePath('stars', qx, q.y, 26); g.fill(); }
          }
          for (const q of st.balloons) {
            const qx = q.x - st.x, qy = q.y + wave(S.t + q.x, 10, 2);
            if (!q.pop && dist(qx, qy, 170, st.y) < 84) { q.pop = true; pop(); burst(qx, qy, [q.c, '#fff'], 14); }
            if (!q.pop && qx > -ox - 40 && qx < BW + ox + 40) { g.strokeStyle = '#7f93a6'; g.lineWidth = 2; g.beginPath(); g.moveTo(qx, qy + 26); g.lineTo(qx, qy + 54); g.stroke(); g.fillStyle = q.c; g.beginPath(); g.ellipse(qx, qy, 21, 27, 0, 0, 7); g.fill(); blob(0, [[qx - 7, qy - 10, 5]], 'rgba(255,255,255,.6)'); }
          }
          for (const q of st.rings) {
            const qx = q.x - st.x;
            if (!q.hit && Math.abs(qx - 170) < 20 && Math.abs(q.y - st.y) < 96) { q.hit = true; st.hoops++; sfx.can(); burst(qx, q.y, ['#fff', '#22b3a6', GOLD], 20); }
            if (qx > -ox - 80 && qx < BW + ox + 80) { g.strokeStyle = q.hit ? '#2fb36a' : '#f4614d'; g.lineWidth = 11; g.beginPath(); g.ellipse(qx, q.y, 24, 62, 0, 0, 7); g.stroke(); }
          }
          at(170, st.y + wave(S.t, 3, 5), .95, () => buildPlane({ wing: 1, prop: 1, tail: 1 }, true));
          for (let i = 0; i < 6; i++) { g.fillStyle = i < st.got ? GOLD : 'rgba(255,255,255,.7)'; shapePath('stars', 212 + i * 42, 62 - oy * 0, 15); g.fill(); }
          if (!landing) { // two big arrows. The whole top and bottom half of the screen work as well
            for (const [dy, d] of [[132, -1], [302, 1]]) {
              blob(0, [[566, dy, 44]], st.dir === d ? GOLD : 'rgba(255,250,240,.9)');
              poly([[566, dy + d * 26], [538, dy - d * 12], [594, dy - d * 12]], '#12306b');
            }
          }
        },
        done: st => st.x > st.len,
      },
    ],
    final(st, t) {
      hangar(st); at(380, 260, 1.05, () => buildPlane({ wing: 1, prop: 1, tail: 1 }, true)); walker(146, 338, 1.1, 0, wave(t, 16, 7)); flag(560, 322, 1);
    },
  };

  /* ---------- 2. Stockholm: Gamla Stan ---------- */
  const STORT = ['#d9722c', '#b83f2f', '#e8b26a', '#7f9f6a', '#e3cf94', '#c9764f'];
  function gabled(x, w, c, h, stepped) {
    rect(0, x, 322 - h, w, h, c);
    const top = 322 - h, half = w / 2;
    if (stepped) { const s = w / 8; poly([[x, top], [x, top - s], [x + s, top - s], [x + s, top - 2 * s], [x + 2 * s, top - 2 * s], [x + 2 * s, top - 3 * s], [x + 3 * s, top - 3 * s], [x + 3 * s, top - 4 * s], [x + 5 * s, top - 4 * s], [x + 5 * s, top - 3 * s], [x + 6 * s, top - 3 * s], [x + 6 * s, top - 2 * s], [x + 7 * s, top - 2 * s], [x + 7 * s, top - s], [x + w, top - s], [x + w, top]], c); }
    else poly([[x, top], [x + half, top - w * .34], [x + w, top]], c);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 2; i++) panel(x + w * (.2 + i * .38), top + 18 + r * 46, w * .22, 30, [8, 8, 0, 0], '#fff5d6');
  }
  function cobble() {
    ground(322, '#a9a59f');
    g.fillStyle = 'rgba(255,255,255,.2)';
    for (let y = 334; y < BH + oy + 10; y += 20) for (let x = -ox + (y % 40 ? 16 : 0); x < BW + ox; x += 36) { g.beginPath(); g.ellipse(x, y, 14, 7, 0, 0, 7); g.fill(); }
  }
  const square = st => {
    sky('#7fcdf2', '#e4f4f6'); clouds(S.t, 5, 18);
    [-180, -50].forEach((x, i) => gabled(x, 130, STORT[(i + 4) % 6], 200, i % 2));
    [20, 148, 276, 404, 532].forEach((x, i) => gabled(x, 118, STORT[i], 196 + (i % 2) * 22, i % 2 === 0));
    [660, 780].forEach((x, i) => gabled(x, 130, STORT[i + 2], 190, i % 2));
    cobble();
    for (const x of [14, 268, 628]) { rect(0, x, 226, 6, 110, '#2b2d38'); panel(x - 8, 208, 22, 26, 6, '#2b2d38'); panel(x - 4, 212, 14, 18, 3, '#ffe9a0'); }
    for (const [x, c] of [[160, '#22b3a6'], [420, '#f2577d']]) { for (let i = 0; i < 5; i++) panel(x + i * 16, 288, 18, 16, [0, 0, 7, 7], i % 2 ? '#fff' : c); }
    for (const x of [60, 202, 330, 470, 590]) { panel(x, 262, 54, 8, 3, '#7a5232'); blob(0, [[x + 10, 258, 7], [x + 28, 256, 8], [x + 44, 258, 7]], '#f2577d'); blob(0, [[x + 20, 252, 5]], GOLD); }
  };
  function fountain(on) {
    panel(-52, -18, 104, 20, 8, '#8d95a5'); rect(0, -9, -56, 18, 40, '#8d95a5');
    g.fillStyle = '#8fd6f5'; g.beginPath(); g.ellipse(0, -18, 46, 7, 0, 0, 7); g.fill();
    if (on) for (let i = -2; i <= 2; i++) { g.strokeStyle = '#8fd6f5'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, -60); g.quadraticCurveTo(i * 12, -96 - wave(S.t, 8, 9), i * 22, -20); g.stroke(); }
  }
  const palace = () => {
    sky('#7fcdf2', '#e4f4f6');
    rect(0, -ox - 20, 120, BW + ox * 2 + 40, 202, '#e3cf94');
    rect(0, -ox - 20, 106, BW + ox * 2 + 40, 16, '#c9b278');
    for (let x = -280; x < BW + 280; x += 62) if (x < 240 || x > 400) for (const y of [146, 236]) panel(x, y, 30, 54, [14, 14, 0, 0], '#7fb0c8');
    flag(320, 106, .9); cobble();
    for (const x of [-120, 40, 200, 412, 572, 730]) { rect(0, x, 122, 18, 200, '#d6bf84'); panel(x - 6, 116, 30, 10, 3, '#c9b278'); }
    for (const x of [120, 520]) { panel(x - 28, 296, 56, 26, 6, '#8d95a5'); blob(0, [[x, 280, 24]], '#3f8f4c'); }
  };
  function guard(x, y, step, s = 1) { // Högvakten, with a tall bearskin hat
    at(x, y, s, () => {
      shade(0, 2, 26, 6);
      const a = Math.sin(step) * 8; panel(-14 + a, -36, 12, 36, 4, '#12306b'); panel(2 - a, -36, 12, 36, 4, '#12306b');
      panel(-18, -82, 36, 50, 8, '#23408f'); rect(0, -18, -46, 36, 7, '#fff'); rect(0, -3, -82, 6, 40, '#fff');
      rect(0, 20, -96, 4, 74, '#8d95a5'); blob(0, [[22, -100, 5]], GOLD);
      blob(0, [[0, -96, 15]], '#f6cfae'); blob(0, [[-4, -98, 2], [6, -98, 2]], '#12306b');
      panel(-16, -142, 32, 40, 12, '#2b2d38'); blob(0, [[0, -138, 16]], '#2b2d38'); rect(0, -3, -112, 6, 8, GOLD);
    });
  }
  function shop(open) {
    panel(-44, -96, 88, 96, 8, '#f2577d');
    for (let i = 0; i < 4; i++) panel(-44 + i * 22, -96, 22, 22, [0, 0, 8, 8], i % 2 ? '#fff' : '#f6c21c');
    panel(-30, -66, 60, 40, 6, '#fff5d6'); if (open) blob(0, [[-14, -46, 10], [12, -46, 10]], '#f6c21c');
  }
  function alley(x, what, st, gone) { // a narrow street, with what lies at its end shown as a clue above it
    panel(x - 76, 118, 152, 204, [76, 76, 0, 0], '#d9a06a');
    panel(x - 52, 150, 104, 172, [52, 52, 0, 0], gone ? '#f2e3c0' : '#5a4638');
    poly([[x - 40, 322], [x + 40, 322], [x + 56, 390], [x - 56, 390]], '#c4bdb2');
    blob(0, [[x, 84, 42]], '#fffaf0');
    if (what === 'castle') at(x, 112, .24, () => SPRITE.castle({}));
    else if (what === 'bird') sprite('seagull', x - 2, 108, .9);
    else at(x, 112, .5, () => shop(true));
  }
  const GATA = {
    id: 'gamla', after: 15, title: 'Gamla Stan', place: 'Stockholm', reward: 150, gift: { cat: 'extra', id: 'fana' }, parkAt: 120, parkY: 396, say: 'Gamla Stan i Stockholm!',
    bg(st) { square(st); },
    icon() { sprite('gamla', 0, 0, .5); at(46, -70, .36, () => flag(0, 0, 1)); },
    scenes: [
      tapAll({ say: 'Tryck och titta!', bg: st => { square(st); walker(320, 366, 1, 0, 0); }, items: () => [
        { x: 88, y: 200, r: 56, sound: () => { beep(660, 0, .1, .08); beep(880, .1, .14, .08); }, draw(it) {
          const o = it.t >= 0 ? Math.min(it.t * 3, 1) : 0;
          panel(it.x - 30, it.y - 36, 60, 72, 8, '#5a4638'); if (o) { blob(0, [[it.x, it.y + 6, 15]], '#f6cfae'); blob(0, [[it.x - 5, it.y + 2, 2.500], [it.x + 5, it.y + 2, 2.500]], '#12306b'); }
          rect(0, it.x - 30 - o * 22, it.y - 36, 30, 72, '#f2577d'); rect(0, it.x + o * 22, it.y - 36, 30, 72, '#f2577d');
        } },
        { x: 236, y: 282, r: 60, sound: chirp, draw(it) { const u = it.t >= 0 ? it.t : 0; sprite('seagull', it.x + u * 150, it.y - u * u * 90 + 30, 1); } },
        { x: 552, y: 300, r: 66, sound: whoosh, draw(it) { flag(it.x, it.y + 40, 1.3, it.t >= 0 ? 2.4 : .5); } },
        { x: 430, y: 330, r: 66, sound: () => [0, .1, .2].forEach(bubble), draw(it) { at(it.x, it.y + 20, 1, () => fountain(it.t >= 0)); } },
      ] }),
      dragTo({ say: 'Dags för fika!',
        bg(st) {
          square(st); panel(330, 330, 260, 16, 6, '#fffaf0'); for (const x of [356, 556]) rect(0, x, 346, 10, 44, '#7a5232');
          const ate = st.pieces.filter(p => p.placed).length;
          walker(250, 384, 1.1, 0, st.run.chew > 0 ? wave(S.t, 8, 20) : 0); if (st.run.chew > 0) st.run.chew -= .025;
          for (let i = 0; i < ate; i++) blob(0, [[300 + i * 14, 372 - i * 6, 3]], '#c98a4c');
        },
        pieces: st => [['bulle', 396, 300], ['saft', 476, 294], ['kaka', 548, 306]].map(([kind, x, y], i) => ({ x, y, tx: 300, ty: 292, sound() { st.run.chew = 1; for (let j = 0; j < 3; j++) beep(240, j * .12, .07, .1, 'square', .6); }, colors: ['#c98a4c', '#fff'],
          draw(p) { if (p.placed) return; at(p.x, p.y, 1.1, () => {
            if (kind === 'bulle') { g.fillStyle = '#c98a4c'; g.beginPath(); g.ellipse(0, 0, 30, 22, 0, 0, 7); g.fill(); g.strokeStyle = '#8a5c34'; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 14, 0, 5); g.stroke(); blob(0, [[-10, -8, 2.500], [8, -10, 2.500], [12, 6, 2.500]], '#fff'); }
            else if (kind === 'saft') { panel(-18, -30, 36, 54, 6, 'rgba(255,255,255,.7)'); panel(-15, -16, 30, 38, 4, '#e8483f'); rect(0, 4, -44, 4, 40, '#f2577d'); }
            else { blob(0, [[0, 0, 24]], '#d9a35a'); blob(0, [[-9, -7, 4], [8, -3, 4], [-3, 9, 4]], '#5b3a22'); }
          }); } })) }),
      { say: 'Vilken väg går till slottet?',
        start(st) {
          const order = ['castle', 'bird', 'shop'].sort(() => Math.random() - .5);
          st.paths = order.map((what, i) => ({ what, x: 120 + i * 200, tried: false }));
          st.mx = 320; st.my = 392; st.go = null; st.back = 0;
        },
        tap(st, x, y) {
          if (st.go) return;
          const p = st.paths.find(q => Math.abs(q.x - x) < 96);
          if (p) { st.go = p; st.phase = 0; pop(); }
        },
        draw(st, dt) {
          square(st); rect(0, -ox - 20, 118, BW + ox * 2 + 40, 300, 'rgba(255,245,214,.4)');
          for (const p of st.paths) { alley(p.x, p.what, st, p.tried); if (!st.go && !p.tried) ring(p.x, 240, 56); }
          const q = st.go;
          if (q) {
            if (!st.phase) { // walk up the street, whichever it is
              st.mx += clamp(q.x - st.mx, -240 * dt, 240 * dt); st.my += clamp(330 - st.my, -120 * dt, 120 * dt);
              if (Math.abs(q.x - st.mx) < 3 && st.my < 334) { st.phase = 1; st.wait = 0; if (q.what === 'castle') { sfx.win(); st.won = true; } else if (q.what === 'bird') chirp(); else { note(2); note(4); } burst(q.x, 240); }
            } else if (!st.won) { // a funny thing to meet, and then back to choose again
              st.wait += dt;
              if (q.what === 'bird') sprite('seagull', q.x + 58, 300 - Math.abs(wave(st.wait, 30, 8)), 1.4);
              else at(q.x + 66, 330, .9, () => shop(true));
              if (st.wait > 1.6) { q.tried = true; st.go = null; st.mx = 320; st.my = 392; }
            }
          }
          walker(st.mx, st.my, .9, q && !st.phase ? S.t * 12 : 0, 0);
        },
        done: st => st.won && st.phase === 1,
      },
      tapAll({ say: 'Vi är framme vid slottet!', bg: st => { palace(); walker(166, 372, .95, 0, 0); }, items: () => [
        { x: 92, y: 250, r: 62, wait: .5, sound: () => [0, .1, .2].forEach(t => beep(1046, t, .2, .08)), fn() { S.trial = { slot: 'hat', id: 'crown' }; }, draw(it) { if (it.t < 0) { panel(it.x - 40, it.y + 6, 80, 22, 8, '#b3202e'); at(it.x, it.y + 6, .8, () => drawHat('crown')); } } },
        { x: 320, y: 262, r: 76, sound: () => beep(120, 0, .5, .1, 'sawtooth', 1.5), draw(it) {
          const o = it.t >= 0 ? Math.min(it.t * 1.4, 1) : 0;
          panel(it.x - 70, it.y - 90, 140, 150, [70, 70, 0, 0], '#5a4638'); panel(it.x - 56, it.y - 76, 112, 136, [56, 56, 0, 0], o ? '#f6e7b8' : '#3b2e26');
          g.fillStyle = '#7a5232'; rect(0, it.x - 56 - o * 26, it.y - 40, 56, 100, '#7a5232'); rect(0, it.x + o * 26, it.y - 40, 56, 100, '#7a5232');
          blob(0, [[it.x - 6 - o * 26, it.y + 10, 5], [it.x + 6 + o * 26, it.y + 10, 5]], GOLD);
        } },
        { x: 508, y: 330, r: 88, sound: () => { for (let i = 0; i < 4; i++) beep(380, i * .16, .1, .08, 'triangle'); }, draw(it) {
          const roll = it.t >= 0 ? wave(it.t, 42, 4) : 0;
          at(it.x + roll, it.y + 34, 1, () => {
            for (const x of [-46, 40]) { blob(0, [[x, -22, 24]], '#b3202e'); blob(0, [[x, -22, 8]], GOLD); }
            panel(-62, -96, 118, 64, [24, 24, 10, 10], GOLD); panel(-44, -86, 34, 32, 6, SKY_GLASS); panel(4, -86, 34, 32, 6, SKY_GLASS);
            g.save(); g.translate(0, -108); g.scale(.45, .45); drawHat('crown'); g.restore();
          });
        } },
      ] }),
      { say: 'Trumma så går vakterna!',
        start(st) { st.step = 0; st.x = 0; },
        tap(st) { const n = TUNES.jakob[st.step % TUNES.jakob.length]; beep(NOTE[n], 0, .26, .13); beep(120, 0, .12, .16, 'square', .6); st.step++; st.hit = .18; burst(560, 330, [GOLD, '#fff'], 5); },
        draw(st, dt) {
          palace();
          st.x += (st.step * 42 - st.x) * Math.min(1, dt * 5); if (st.hit > 0) st.hit -= dt;
          for (let i = 0; i < 4; i++) guard(40 + i * 64 + st.x, 372, st.x * .08 + i * 3.14, 1.05);
          walker(92, 300, .62, 0, 0);
          at(562, 366, 1 + (st.hit > 0 ? .1 : 0), () => { shade(0, 8, 60); panel(-54, -66, 108, 72, 12, '#e8483f'); g.fillStyle = '#fff5d6'; g.beginPath(); g.ellipse(0, -66, 54, 16, 0, 0, 7); g.fill(); for (let i = 0; i < 5; i++) { rect(0, -46 + i * 22, -54, 4, 56, GOLD); } });
          if (!st.step) ring(562, 320, 76);
          for (let i = 0; i < 10; i++) { g.fillStyle = i < st.step ? GOLD : 'rgba(255,255,255,.7)'; blob(0, [[230 + i * 19, 40, 7]], g.fillStyle); }
        },
        done: st => st.step >= 10,
      },
    ],
    final(st, t) { palace(); walker(320, 372, 1.15, 0, wave(t, 18, 7)); flag(110, 330, 1.1); flag(530, 330, 1.1); for (let i = 0; i < 2; i++) { guard(200 - i * 60, 372, 0, 1); guard(440 + i * 60, 372, 0, 1); } },
  };

  /* ---------- 3. The big car wash. All of it is drawn over the real vehicle and is forgotten afterwards ---------- */
  const washBay = st => {
    sky('#8ad6f5', '#e6f7fb'); ground(350, '#a6abb7');
    rect(0, -ox - 20, 50, BW + ox * 2 + 40, 300, '#d9edf7');
    for (let x = -300; x < BW + 300; x += 64) rect(0, x, 58, 56, 284, 'rgba(255,255,255,.45)');
    rect(0, -ox - 20, 30, BW + ox * 2 + 40, 22, '#22b3a6');
    for (let i = 0; i < 16; i++) { const x = -ox + i * 90; panel(x, 52, 44, 26, [0, 0, 16, 16], i % 2 ? '#fff' : '#f4614d'); }
    for (const x of [-40, 680]) { panel(x - 22, 96, 44, 254, 22, '#1d9bf0'); for (let y = 108; y < 344; y += 16) rect(0, x - 22, y + wave(S.t, 3, 4), 44, 6, '#7fc9f8'); } // the big roller brushes
    for (let i = 0; i < 14; i++) { const x = -ox + i * 76 + wave(S.t + i, 8); blob(0, [[x, 352, 16 + i % 3 * 5]], 'rgba(255,255,255,.75)'); }
  };
  const WX = 320, WY = 346, WS = 1.3;
  function sponge() { panel(-40, -26, 80, 52, 14, GOLD); blob(0, [[-16, -6, 5], [14, 8, 4], [20, -12, 3], [-6, 12, 3]], '#e6ae0a'); }
  function hose(st) {
    g.strokeStyle = '#1d9bf0'; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(26, 8); g.quadraticCurveTo(160, 120, 330 - st.tool.x, 470 - st.tool.y); g.stroke();
    panel(-34, -14, 66, 28, 10, '#f08a2c'); panel(-52, -10, 22, 20, 6, '#2b2d38');
    if (st.rub) for (let i = 0; i < 3; i++) fx.push({ x: st.tool.x - 54, y: st.tool.y, vx: -220 - Math.random() * 90, vy: Math.random() * 120 - 40, life: .4, age: 0, r: 4, c: '#8fd6f5', g: 300 });
  }
  function cloth() { panel(-42, -30, 84, 60, 8, '#f2577d'); for (const y of [-14, 6]) rect(0, -42, y, 84, 6, 'rgba(255,255,255,.5)'); }
  const spread = (n, make) => Array.from({ length: n }, (_, i) => {
    const row = i % 3, col = i / n;
    return { x: WX - 140 + col * 310, y: WY - 26 - row * 32, ...make(i) };
  });
  const dirt = st => { // what is still on the car from the scene before
    for (const q of st.run.bubbles || []) blob(0, [[q.x, q.y, 12], [q.x + 14, q.y + 8, 8]], 'rgba(255,255,255,.85)');
  };
  const TVATT = {
    id: 'tvatt', after: 11, title: 'Biltvätten', place: 'Värmland', reward: 150, gift: { cat: 'extra', id: 'sapa' }, parkAt: 300, parkY: 372, say: 'Bilen är så smutsig!', bg: washBay,
    icon() { blob(0, [[-30, -60, 22], [12, -86, 28], [34, -46, 18]], '#bfe6fb'); blob(0, [[-36, -68, 6], [4, -96, 8]], '#fff'); },
    scenes: [
      wipe({ say: 'Tvätta bort leran!', sound: () => { bubble(); }, reach: 74,
        bg(st) { washBay(); carAt(WX, WY, WS); },
        spots: st => { st.run.bubbles = []; return spread(7, i => ({ r: 20 + (i % 3) * 4 })); },
        tool: { x: 96, y: 300, draw: () => sponge() },
        drawSpot(q) { blob(0, [[q.x, q.y, q.r], [q.x + 20, q.y + 10, q.r * .6], [q.x - 18, q.y + 12, q.r * .5]], '#7a5232'); },
        onClean(st, q) { st.run.bubbles.push({ x: q.x, y: q.y }, { x: q.x + 22, y: q.y - 14 }); burst(q.x, q.y, ['#fff', '#f2b8cf', '#bfe6fb', '#d9c8f5'], 10, 'x'); },
      }),
      tapAll({ say: 'Spruta färgglatt skum!',
        bg(st) { washBay(); carAt(WX, WY, WS); for (const [i, c] of (st.run.foam || []).entries()) blob(0, [[WX - 110 + i * 110, WY - 104 + (i % 2) * 18, 44], [WX - 70 + i * 110, WY - 72, 32], [WX - 150 + i * 110, WY - 62, 30]], c); },
        items: () => [['#f2b8cf', 130], ['#ffe9a0', 320], ['#bfe6fb', 510]].map(([c, x]) => ({ x, y: 104, r: 62, wait: .3, sound: () => { spray(); bubble(); }, colors: [c, '#fff'],
          fn(st, me, first) { if (first) { (st.run.foam = st.run.foam || []).push(c); for (let i = 0; i < 4; i++) st.run.bubbles.push({ x: x - 50 + i * 32, y: WY - 96 + (i % 2) * 30 }); } burst(x, 170, [c, '#fff'], 18, 'x'); },
          draw(me) { panel(x - 40, 66, 80, 46, 14, c); panel(x - 13, 112, 26, 22, 6, '#5b5a62'); } })) }),
      wipe({ say: 'Skrubba hjulen!', sound: () => beep(700 + Math.random() * 300, 0, .08, .05, 'sawtooth', .8), reach: 72,
        bg(st) { washBay(); carAt(WX, WY, WS); for (const [i, c] of (st.run.foam || []).entries()) blob(0, [[WX - 110 + i * 110, WY - 104 + (i % 2) * 18, 44]], c); },
        spots: () => [[WX - 94, WY - 36], [WX - 70, WY - 16], [WX + 96, WY - 34], [WX + 118, WY - 14]].map(([x, y]) => ({ x, y })),
        tool: { x: 96, y: 300, draw: () => { panel(-44, -14, 88, 28, 10, '#22b3a6'); for (let i = 0; i < 9; i++) rect(0, -40 + i * 9, 14, 5, 16, '#fff5d6'); } },
        drawSpot(q) { blob(0, [[q.x, q.y, 18], [q.x + 12, q.y + 6, 12]], '#7a5232'); },
        onClean(st, q) { burst(q.x, q.y, ['#fff', '#7a5232'], 8, 'x'); },
      }),
      wipe({ say: 'Spola av bilen!', sound: spray, reach: 84,
        bg(st) { washBay(); carAt(WX, WY, WS); },
        spots: st => st.run.bubbles.map(q => ({ ...q })),
        tool: { x: 540, y: 200, draw: st => hose(st) },
        drawSpot(q) { blob(0, [[q.x, q.y, 16], [q.x + 16, q.y + 8, 11]], 'rgba(255,255,255,.92)'); blob(0, [[q.x - 4, q.y - 5, 4]], '#bfe6fb'); },
        onClean(st, q) { (st.run.drops = st.run.drops || []).push({ x: q.x, y: q.y }); burst(q.x, q.y, ['#8fd6f5', '#fff'], 6, 'x'); },
      }),
      wipe({ say: 'Torka och putsa!', sound: () => beep(1200, 0, .12, .06, 'sine', 1.5), reach: 84,
        bg(st) { washBay(); carAt(WX, WY, WS); },
        spots: st => (st.run.drops || []).map(q => ({ ...q })),
        tool: { x: 96, y: 300, draw: () => cloth() },
        drawSpot(q) { g.fillStyle = '#6fc6f2'; g.beginPath(); g.moveTo(q.x, q.y - 16); g.quadraticCurveTo(q.x + 14, q.y + 2, q.x, q.y + 10); g.quadraticCurveTo(q.x - 14, q.y + 2, q.x, q.y - 16); g.fill(); },
        onClean(st, q) { burst(q.x, q.y); },
      }),
      dragTo({ say: 'Sätt klistermärken på bilen!',
        bg(st) { washBay(); carAt(WX, WY, WS); },
        drawTop(st) { st.run.marks = st.pieces.filter(p => p.placed).map(p => p); },
        pieces: () => [['stars', GOLD], ['hearts', '#f2577d'], ['x', '#22b3a6'], ['flowers', '#f6a91c']].map(([shape, c], i) => ({ x: 74 + i * 164, y: 120, tx: WX - 118 + i * 78, ty: WY - 44 - (i % 2) * 22, shape, c, sound: () => note(i + 1),
          draw(p) { panel(p.x - 28, p.y - 28, 56, 56, 12, '#fff'); g.fillStyle = p.c; shapePath(p.shape, p.x, p.y, 20); g.fill(); } })) }),
    ],
    final(st, t) {
      washBay(); carAt(WX, WY - 20 + wave(t, 5, 6), WS);
      for (const p of st.run.marks || []) { panel(p.tx - 22, p.ty - 42 + wave(t, 5, 6), 44, 44, 10, '#fff'); g.fillStyle = p.c; shapePath(p.shape, p.tx, p.ty - 20 + wave(t, 5, 6), 15); g.fill(); }
      if (t % .7 < .35) blob(0, [[WX + 166, WY - 74, 26]], 'rgba(255,245,160,.8)');
      for (let i = 0; i < 6; i++) { g.fillStyle = '#fff'; shapePath('stars', WX - 170 + i * 68, WY - 150 + wave(t + i, 24, 3), 8 + wave(t + i * 2, 6, 6) + 5); g.fill(); }
    },
  };

  /* ---------- 4. Winter workshop. Uses the vehicles and gear already owned, and adds nothing to the inventory ---------- */
  const snowFall = t => { g.fillStyle = '#fff'; for (let i = 0; i < 46; i++) { const x = (i * 97 + wave(t, 16, 1 + i % 3)) % (BW + ox * 2 + 40) - ox - 20, y = ((i * 53 + t * (32 + i % 5 * 8)) % (BH + oy * 2 + 40)) - oy - 20; g.beginPath(); g.arc(x, y, 2 + i % 3, 0, 7); g.fill(); } };
  const garage = st => {
    sky('#b6cfe8', '#e7eef6');
    rect(0, -ox - 20, 0, BW + ox * 2 + 40, 340, '#c98a54');
    for (let y = 16; y < 340; y += 34) rect(0, -ox - 20, y, BW + ox * 2 + 40, 3, '#a96f3f');
    panel(40, 42, 150, 110, 8, '#a9d9f2'); rect(0, 113, 42, 4, 110, '#7a5232'); rect(0, 40, 96, 150, 4, '#7a5232');
    g.save(); g.beginPath(); g.rect(40, 42, 150, 110); g.clip(); ground(126, '#fff'); sprite('snowpine', 120, 134, .5); snowFall(S.t); g.restore();
    for (let i = 0; i < 5; i++) rect(0, 396 + i * 36, 74, 12, 42, ['#e8483f', '#1d9bf0', '#f6c21c', '#22b3a6', '#2fb36a'][i]);
    g.globalAlpha = .22; blob(0, [[320, 28, 140]], '#fff3a8'); g.globalAlpha = 1; panel(280, 0, 80, 16, 6, '#2b2d38'); blob(0, [[320, 18, 13]], '#ffe9a0');
    for (const [x, y] of [[590, 300], [634, 300], [612, 262]]) { blob(0, [[x, y, 24]], '#2b2d38'); blob(0, [[x, y, 11]], '#8d95a5'); }
    for (const x of [214, 256]) { rect(0, x, 66, 8, 54, '#6b7280'); } panel(236, 66, 8, 40, 3, '#e8483f');
    rect(0, 386, 118, 200, 8, '#7a5232');
    ground(340, '#8d95a5'); rect(0, -ox - 20, 340, BW + ox * 2 + 40, 6, '#6b7280');
  };
  const winterLook = st => ({ ...gear(true), vehicle: st.run.pick || gear(true).vehicle });
  const carIn = (st, s = 1.25, x = 320, y = 336) => carAt(x, y, s, winterLook(st));
  function tyre(l) { drawWheel(l.tyre, 34, paintOf(l.paint).color); }
  function pulka(loaded) { // the winter box rides on a small sled, since not every vehicle here has a roof
    ski(26, 136); for (const x of [46, 116]) rect(0, x, 318, 8, 22, '#7a5232'); panel(30, 308, 112, 14, 6, '#e8483f');
    if (loaded) panel(34, 266, 104, 42, 12, '#2b2d38');
  }
  const wheelSpots = id => {
    const list = (VEHICLE[id].wheels || [[-74, 32], [76, 32]]);
    return (list.length ? list : [[-80, 20], [70, 20]]).map(([x]) => x);
  };
  const VERK = {
    id: 'verkstad', after: 22, level: 23, winter: true, title: 'Vinterverkstaden', place: 'Norrland', reward: 150, gift: { cat: 'extra', id: 'lillgubbe' }, parkAt: 150, parkY: 366, say: 'Vintern är här! Nu gör vi bilen klar.',
    bg(st) {
      sky('#b6cfe8', '#eef4f8'); ground(330, '#fff'); snowFall(S.t);
      for (const x of [20, 86, 560, 620]) sprite('snowpine', x, 332, 1);
      panel(300, 150, 250, 180, 8, '#a8342c'); poly([[284, 150], [425, 78], [566, 150]], '#fff'); panel(372, 216, 110, 114, 6, '#fbe7b0'); for (const x of [402, 434]) rect(0, x, 216, 3, 114, '#c98a54');
    },
    icon() { at(0, -50, 1.1, () => drawWheel('vinterdack', 40, '#7fcdf2')); blob(0, [[-42, -92, 6], [38, -96, 7], [46, -30, 5]], '#fff'); },
    scenes: [
      tapAll({ say: 'Vilket vinterfordon vill du köra?', bg: garage, done: st => !!st.run.pick, items: () => {
        const mine = CATALOG.vehicle.filter(it => it.w === 2 && save.owned.vehicle.includes(it.id)).slice(0, 6);
        const cols = Math.min(mine.length, 3), rows = Math.ceil(mine.length / 3);
        return mine.map((it, i) => ({
          x: 320 + ((i % 3) - (cols - 1) / 2) * 190, y: rows > 1 ? 150 + Math.floor(i / 3) * 150 : 230, r: 84, id: it.id, wait: 0, sound: snap,
          fn(st, me) { st.run.pick = me.id; },
          draw(me, st) {
            const sel = st.run.pick === me.id, bob = sel ? Math.abs(wave(S.t, 8, 8)) : 0;
            panel(me.x - 86, me.y - 74, 172, 136, 22, sel ? '#ffe9a0' : 'rgba(255,250,240,.9)');
            carAt(me.x, me.y + 52 - bob, .54, { ...gear(true), vehicle: me.id });
          },
        }));
      } }),
      { say: 'Pumpa upp bilen!',
        start(st) { st.lift = 0; st.pumps = 0; },
        tap(st) { st.pumps++; beep(180 + st.pumps * 40, 0, .14, .13, 'square', 1.2); burst(120, 300, ['#fff', GOLD], 5); },
        draw(st, dt) {
          st.lift += (Math.min(st.pumps, 6) * 9 - st.lift) * Math.min(1, dt * 6);
          garage(st); rect(0, 300, 346 - st.lift, 40, st.lift + 4, '#f08a2c');
          carIn(st, 1.25, 320, 336 - st.lift);
          const h = st.pumps % 2 ? 20 : 0;
          panel(84, 262 + h, 72, 18, 8, '#e8483f'); rect(0, 114, 280 + h, 12, 70 - h, '#8d95a5'); panel(90, 340, 60, 14, 6, '#2b2d38');
          if (!st.pumps) ring(120, 290, 62);
          for (let i = 0; i < 6; i++) blob(0, [[230 + i * 36, 40, 11]], i < st.pumps ? GOLD : 'rgba(255,255,255,.7)');
        },
        done: st => st.pumps >= 6,
      },
      dragTo({ say: 'Sätt på vinterdäcken!',
        bg(st) { garage(st); carIn(st); for (const p of st.pieces) if (!p.placed) { g.strokeStyle = GOLD; g.setLineDash([10, 9]); g.lineWidth = 5; g.beginPath(); g.arc(p.tx, p.ty, 42, 0, 7); g.stroke(); g.setLineDash([]); } },
        pieces: st => { const l = winterLook(st), xs = wheelSpots(l.vehicle); return xs.map((wx, i) => ({ x: 90 + i * 460, y: 176, tx: 320 + wx * 1.25, ty: 306, draw(p) { if (!p.placed) at(p.x, p.y, 1.1, () => { g.rotate(p.x * .02); tyre(l); }); } })); } }),
      dragTo({ say: 'Packa spaden och lådan!',
        bg(st) {
          garage(st); carIn(st);
          pulka(st.pieces[1].placed);
        },
        pieces: () => [
          { x: 86, y: 210, tx: 240, ty: 280, draw(p) { if (!p.placed) at(p.x, p.y, 1, () => { rect(0, -5, -74, 10, 90, '#7a5232'); poly([[-24, 14], [24, 14], [18, 60], [-18, 60]], '#1d9bf0'); }); } },
          { x: 556, y: 200, tx: 86, ty: 286, draw(p) { if (!p.placed) panel(p.x - 52, p.y - 20, 104, 40, 12, '#2b2d38'); } },
        ] }),
      wipe({ say: 'Borsta bort snön!', sound: () => beep(1500, 0, .1, .04, 'sawtooth', .6), reach: 70,
        bg(st) { garage(st); carIn(st); pulka(true); },
        spots: () => [[330, 210], [372, 232], [404, 256], [298, 242], [346, 268]].map(([x, y]) => ({ x, y })),
        tool: { x: 96, y: 240, draw: () => { panel(-44, -14, 88, 24, 6, '#e8483f'); rect(0, -40, 8, 80, 22, '#fff5d6'); rect(0, 40, -8, 74, 10, '#2b2d38'); } },
        drawSpot(q) { blob(0, [[q.x, q.y, 28], [q.x + 18, q.y + 8, 20], [q.x - 18, q.y + 8, 18]], '#fff'); },
        onClean(st, q) { burst(q.x, q.y, ['#fff', '#d9f0fa'], 10, 'x'); },
      }),
      dragTo({ say: 'Bygg en snögubbe!',
        bg(st) {
          sky('#b6cfe8', '#eef4f8'); clouds(S.t, 3, 22); ground(330, '#fff'); for (const x of [30, 110, 540, 620]) sprite('snowpine', x, 334, 1); snowFall(S.t);
          shade(320, 372, 90, 10); sprite('tomte', 520, 372, 1);
        },
        pieces: st => {
          const ball = (p, r) => { blob(0, [[p.x, p.y, r]], '#fff'); g.strokeStyle = '#a9c6d8'; g.lineWidth = 4; g.beginPath(); g.arc(p.x, p.y, r, 0, 7); g.stroke(); blob(0, [[p.x + r * .3, p.y + r * .35, r * .5]], '#e4eef6'); };
          return [
            { x: 90, y: 366, tx: 320, ty: 340, draw(p) { ball(p, 44); } },
            { x: 170, y: 374, tx: 320, ty: 272, draw(p) { ball(p, 34); } },
            { x: 240, y: 380, tx: 320, ty: 218, draw(p) { ball(p, 26); if (p.placed) blob(0, [[p.x - 9, p.y - 5, 3.500], [p.x + 9, p.y - 5, 3.500]], '#12306b'); } },
            { x: 420, y: 370, tx: 334, ty: 222, draw(p) { poly([[p.x - 12, p.y - 5], [p.x + 30, p.y], [p.x - 12, p.y + 6]], '#f08a2c'); } },
            { x: 600, y: 366, tx: 320, ty: 182, draw(p) { at(p.x, p.y, .72, () => drawHat('hog')); } },
          ];
        } }),
      { say: 'Nu kör vi! Tuta!',
        start(st) { st.x = 0; st.horn = 0; st.gifts = [460, 1000, 1540, 2080].map((x, i) => ({ x, c: ['#e8483f', '#22b3a6', '#f6c21c', '#7a5cd6'][i] })); st.got = 0; },
        tap(st, x, y) { sfx.honk(gear(true).horn); S.honkT = .5; st.horn = .5; },
        draw(st, dt) {
          st.x += 170 * dt; S.wheel += dt * 5; if (st.horn > 0) st.horn -= dt;
          sky('#b6cfe8', '#f3ecdf');
          for (let i = -1; i < 8; i++) { const x = ((i * 240 - st.x * .15) % (240 * 8)) ; poly([[x - 180, 260], [x, 90], [x + 180, 260]], '#c7d6ea'); poly([[x - 56, 142], [x, 90], [x + 56, 142]], '#fff'); }
          ground(250, '#fff');
          const lake = 860 - st.x; panel(lake, 266, 360, 34, 17, '#bfe6fb');
          for (let i = 0; i < 18; i++) { const x = i * 190 + 120 - st.x; if (x > -ox - 80 && x < BW + ox + 80) sprite('snowpine', x, 262, .9); }
          for (const [wx, kind] of [[520, 'reindeer'], [1160, 'fox'], [1640, 'hare'], [2200, 'tomte'], [2480, 'snowman']]) { const x = wx - st.x * 1; if (x > -80 && x < BW + 80) sprite(kind, x, 300, 1); }
          ground(320, '#6d7790'); rect(0, -ox - 20, 340, BW + ox * 2 + 40, 5, '#f9e27a'); ground(372, '#fff');
          for (const q of st.gifts) {
            const x = q.x - st.x;
            if (!q.got && x < 270) { q.got = true; st.got++; note(st.got + 1); burst(x, 280, [q.c, GOLD, '#fff'], 16); }
            if (!q.got && x < BW + ox + 60) { panel(x - 24, 284, 48, 40, 6, q.c); rect(0, x - 5, 284, 10, 40, GOLD); blob(0, [[x - 8, 280, 8], [x + 8, 280, 8]], GOLD); }
          }
          carAt(230, 340 + wave(S.t, 2, 12), 1, winterLook(st)); snowFall(S.t);
          for (let i = 0; i < 4; i++) { panel(214 + i * 44, 22, 34, 30, 6, i < st.got ? st.gifts[i].c : 'rgba(255,255,255,.65)'); }
          blob(0, [[560, 100, 46]], st.horn > 0 ? GOLD : 'rgba(255,250,240,.92)'); at(560, 100, .5, () => { g.translate(-50, -50); g.fillStyle = NAVY; g.fill(new Path2D('M12 42h20L78 16v68L32 58H12z')); });
        },
        done: st => st.x > 2700,
      },
    ],
    final(st, t) { sky('#b6cfe8', '#eef4f8'); ground(330, '#fff'); for (const x of [40, 600]) sprite('snowpine', x, 332, 1.1); carAt(320, 346 + wave(t, 4, 7), 1.25, winterLook(st)); snowFall(t); },
    done(st, first) { // only the first time: a replay leaves the chosen vehicle alone
      if (first && st.pick) save.equipW.vehicle = st.pick;
      S.winterOk = true; persist();
    },
  };

  /* ---------- 5. The forest ---------- */
  function ekorre(flip) { at(0, 0, flip ? -1 : 1, () => {
    g.strokeStyle = '#c6642d'; g.lineWidth = 15; g.lineCap = 'round'; g.beginPath(); g.moveTo(-14, -14); g.quadraticCurveTo(-58, -24, -42, -66); g.quadraticCurveTo(-30, -82, -18, -70); g.stroke();
    g.fillStyle = '#d9722c'; g.beginPath(); g.ellipse(0, -22, 18, 22, 0, 0, 7); g.fill(); blob(0, [[8, -50, 15]], '#d9722c'); poly([[2, -60], [4, -78], [14, -62]], '#c6642d'); blob(0, [[12, -52, 3], [22, -46, 2.500]], '#2b2d38');
    g.fillStyle = '#fff5d6'; g.beginPath(); g.ellipse(6, -20, 8, 12, 0, 0, 7); g.fill();
  }); }
  function fagel() { g.fillStyle = '#e8483f'; g.beginPath(); g.ellipse(0, -18, 18, 15, 0, 0, 7); g.fill(); blob(0, [[14, -30, 11]], '#8a5c34'); poly([[-14, -20], [-38, -30], [-14, -10]], '#8a5c34'); poly([[24, -32], [36, -28], [24, -24]], GOLD); blob(0, [[17, -33, 2.500]], '#2b2d38'); rect(0, -4, -4, 3, 6, '#5b3a22'); rect(0, 4, -4, 3, 6, '#5b3a22'); }
  function rodrav() { // the red fox of the forest. The white one on the road belongs to the fells
    for (const x of [-26, -14, 16, 28]) rect(0, x, -24, 8, 24, '#2b2d38');
    g.strokeStyle = '#d9722c'; g.lineWidth = 17; g.lineCap = 'round'; g.beginPath(); g.moveTo(-34, -36); g.quadraticCurveTo(-66, -36, -74, -58); g.stroke(); blob(0, [[-75, -62, 9]], '#fff');
    g.fillStyle = '#d9722c'; g.beginPath(); g.ellipse(0, -36, 38, 16, 0, 0, 7); g.fill();
    blob(0, [[42, -50, 17]], '#d9722c'); poly([[32, -60], [32, -82], [46, -64]], '#b9561f'); poly([[48, -62], [56, -82], [58, -58]], '#b9561f');
    poly([[50, -56], [76, -44], [52, -38]], '#fff'); blob(0, [[76, -44, 4], [46, -54, 2.800]], '#2b2d38'); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(20, -28, 13, 7, 0, 0, 7); g.fill();
  }
  const ANIMAL = { fox: rodrav, hare: () => SPRITE.hare({}), radjur: () => SPRITE.radjur({}), ekorre: () => ekorre(false), fagel };
  const bush = (x, y, s = 1, shake = 0) => at(x + shake, y, s, () => blob(0, [[-44, -24, 32], [0, -44, 44], [46, -24, 32]], '#4f9a48'));
  const stam = (x, y, s = 1) => at(x, y, s, () => { rect(0, -18, -300, 36, 300, '#7a5232'); blob(0, [[-44, -312, 62], [38, -330, 70], [0, -378, 60]], '#3f8f4c'); });
  const glade = () => {
    sky('#a9e2c8', '#eefae0'); clouds(S.t, 3, 12);
    g.fillStyle = '#8fc3a2'; for (let i = -1; i < 7; i++) { g.beginPath(); g.ellipse(i * 170, 292, 150, 92, 0, 0, 7); g.fill(); }
    sprite('pine', -40, 300, 1.6); sprite('pine', 690, 300, 1.7);
    for (let x = Math.floor(-ox / 96) * 96; x < BW + ox; x += 96) sprite(((x / 96) % 3 + 3) % 3 ? 'pine' : 'birch', x, 290, 1);
    beams(S.t);
    ground(286, '#79c76b');
    g.fillStyle = '#6cb95f'; for (let i = 0; i < 30; i++) { const x = (i * 61) % (BW + ox * 2) - ox, y = 300 + (i * 23) % 110; poly([[x - 7, y + 8], [x, y - 8], [x + 7, y + 8]], '#6cb95f'); }
    sprite('mushroom', 112, 352, .9); sprite('rock', 300, 396, .7); sprite('flower', 530, 372, 1); sprite('mushroom', 470, 396, .7); sprite('flower', 200, 400, .9); sprite('flower', 60, 396, .8);
    butterflies(S.t);
    if ((run.chirp = (run.chirp || 0) - 1 / 60) <= 0) { run.chirp = 4 + Math.random() * 4; if (run.phase === 'play') chirp(); }
  };
  const SPOTS = [[96, 330], [240, 300], [392, 340], [540, 300], [320, 392]];
  const SKOG = {
    id: 'skog', after: 19, title: 'Skogens djur', place: 'Dalarna', reward: 150, gift: { cat: 'extra', id: 'ekorren' }, parkAt: 120, parkY: 396, say: 'Vilka djur bor i skogen?', bg: glade,
    icon() { at(0, 0, 1.1, rodrav); },
    scenes: [
      tapAll({ say: 'Säg hej till djuren!', bg: glade, items: () => [['fox', 110, 340, 1.2], ['hare', 256, 300, .95], ['radjur', 396, 330, 1.05], ['ekorre', 530, 300, 1.15], ['fagel', 320, 190, 1.3]].map(([kind, x, y, s]) => ({
        x, y: y - 40, r: 70, sound: CRIES[kind], colors: ['#fff', GOLD], draw(it) {
          const jump = it.t >= 0 && it.t < .8 ? Math.abs(wave(it.t, 34, 9)) : 0;
          at(x, y - jump, -s, ANIMAL[kind]);
          if (kind !== 'fagel') bush(x - 46, y + 12, .42);
        },
      })) }),
      { say: 'Hitta djuren!',
        start(st) {
          const all = ['fox', 'hare', 'radjur', 'ekorre', 'fagel'].sort(() => Math.random() - .5);
          st.want = all.slice(0, 3);
          st.hide = all.map((kind, i) => ({ kind, x: SPOTS[i][0], y: SPOTS[i][1], found: false, shake: 0, up: 0 }));
        },
        tap(st, x, y) {
          const h = st.hide.find(q => dist(q.x, q.y - 36, x, y) < 86);
          if (!h || h.found) return;
          if (st.want.includes(h.kind)) { h.found = true; h.up = 1; CRIES[h.kind](); burst(h.x, h.y - 60); }
          else { h.shake = .5; pop(); }
        },
        draw(st, dt) {
          glade();
          for (const h of st.hide) {
            if (h.shake > 0) h.shake -= dt;
            h.rise = (h.rise || 0) + ((h.found ? 1 : .18) - (h.rise || 0)) * Math.min(1, dt * 6);
            at(h.x, h.y - 16 - h.rise * 66, -1.05, ANIMAL[h.kind]);
            if (!h.found) bush(h.x, h.y + 10, .92, wave(S.t, 7, 30) * (h.shake > 0 ? 1 : 0));
          }
          for (const [i, kind] of st.want.entries()) { // the three to find, as pictures rather than words
            const x = 320 + (i - 1) * 100, seen = st.hide.find(q => q.kind === kind).found;
            blob(0, [[x, 56, 44]], seen ? '#ffe9a0' : 'rgba(255,250,240,.92)');
            at(x, 88, kind === 'radjur' ? .46 : .62, ANIMAL[kind]);
            if (seen) { g.fillStyle = '#2fb36a'; blob(0, [[x + 32, 26, 12]], '#2fb36a'); }
          }
        },
        done: st => st.hide.every(h => h.found || !st.want.includes(h.kind)),
      },
      dragTo({ say: 'Plocka blåbär i korgen!',
        bg(st) {
          glade(); for (const [x, y] of [[120, 300], [320, 286], [520, 300]]) bush(x, y + 30, 1.2);
          const n = st.pieces.filter(p => p.placed).length;
          shade(320, 402, 80); panel(258, 342, 124, 58, [10, 10, 26, 26], '#b5733a'); g.strokeStyle = '#8a5c34'; g.lineWidth = 7; g.beginPath(); g.arc(320, 344, 58, Math.PI, 0); g.stroke();
          for (let i = 0; i < n; i++) blob(0, [[276 + (i % 4) * 30, 346 - Math.floor(i / 4) * 12, 12]], '#3b4a9e');
        },
        pieces: () => [[70, 270], [130, 230], [176, 276], [276, 236], [330, 216], [376, 262], [470, 262], [526, 220], [576, 268]].slice(0, 8).map(([x, y], i) => ({ x, y, tx: 320, ty: 342, sound: () => note(i), colors: ['#3b4a9e', '#fff'], draw(p) { blob(0, [[p.x, p.y, 15]], '#3b4a9e'); blob(0, [[p.x - 4, p.y - 5, 4]], '#7a88d6'); } })) }),
      dragTo({ say: 'Ge ekorren ekollon!',
        bg(st) { glade(); stam(470, 340, 1); },
        drawTop(st) {
          const n = st.pieces.filter(p => p.placed).length, all = n === st.pieces.length;
          st.climb = all ? (st.climb || 0) + .018 : 0;
          at(424, 338 - Math.min(st.climb, 1) * 170, 1.3, () => ekorre(false));
        },
        pieces: () => [0, 1, 2].map(i => ({ x: 90 + i * 86, y: 320 + (i % 2) * 42, tx: 424, ty: 306, sound() { CRIES.ekorre(); }, draw(p) {
          if (!p.placed) at(p.x, p.y, 1.5, () => { g.fillStyle = '#a9683a'; g.beginPath(); g.ellipse(0, 6, 15, 18, 0, 0, 7); g.fill(); panel(-17, -16, 34, 15, 7, '#6d4a2e'); rect(0, -2, -24, 4, 9, '#6d4a2e'); });
        } })) }),
      dragTo({ say: 'Bygg en fågelholk!',
        bg(st) {
          glade(); stam(170, 340, .86);
          const [a, b, c] = st.pieces.map(p => p.placed);
          if (a) { panel(246, 140, 112, 130, 8, '#c98a54'); blob(0, [[302, 190, 26]], '#3b2418'); }
          if (b) poly([[230, 146], [302, 92], [374, 146]], '#b83f2f');
          if (c) { rect(0, 262, 226, 80, 8, '#7a5232'); }
          if (a && b && c) at(302 + wave(S.t, 3, 8), 222, 1, fagel);
          else rect(0, 280, 270, 44, 70, '#7a5232');
        },
        pieces: () => [
          { x: 110, y: 350, tx: 302, ty: 204, draw(p) { if (!p.placed) { panel(p.x - 56, p.y - 65, 112, 130, 8, '#c98a54'); blob(0, [[p.x, p.y - 14, 26]], '#3b2418'); } } },
          { x: 460, y: 340, tx: 302, ty: 124, draw(p) { if (!p.placed) poly([[p.x - 72, p.y + 22], [p.x, p.y - 32], [p.x + 72, p.y + 22]], '#b83f2f'); } },
          { x: 570, y: 392, tx: 302, ty: 230, sound: chirp, draw(p) { if (!p.placed) rect(0, p.x - 40, p.y - 4, 80, 8, '#7a5232'); } },
        ] }),
    ],
    final(st, t) {
      glade();
      [['fox', 150, 350, 1.1], ['hare', 230, 372, .9], ['radjur', 470, 344, 1], ['ekorre', 540, 372, 1.1], ['fagel', 400, 180, 1.2]].forEach(([kind, x, y, s], i) => at(x, y - Math.abs(wave(t + i, 12, 6)), i < 2 ? s : -s, ANIMAL[kind]));
      walker(330, 380, 1.15, 0, wave(t, 16, 7));
    },
  };

  /* ---------- 6. Abisko: the northern lights ---------- */
  const AURORA = [['#3fe0a0', 80], ['#2fd0c8', 120], ['#a06cf0', 50], ['#f27ac0', 150]];
  function auroraBand(c, y, a, t, i) { // a soft curtain: three strokes of falling strength, cheap enough for old phones
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = c; g.lineCap = 'round';
    [[60, .1], [32, .18], [12, .3]].forEach(([w, f]) => {
      g.globalAlpha = a * f; g.lineWidth = w; g.beginPath();
      for (let x = -ox - 30; x <= BW + ox + 30; x += 24) { const yy = y + wave(x * .012 + t * .5 + i, 26) + wave(x * .03 - t * .3, 12); x === -ox - 30 ? g.moveTo(x, yy) : g.lineTo(x, yy); }
      g.stroke();
    });
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  }
  function cabin(lit) {
    panel(-70, -74, 140, 74, 4, '#6d3f28'); poly([[-88, -72], [0, -128], [88, -72]], '#fff');
    panel(-44, -52, 34, 30, 3, lit ? '#ffd86a' : '#2a3350'); panel(14, -52, 34, 30, 3, lit ? '#ffd86a' : '#2a3350');
    if (lit) { g.globalAlpha = .25; blob(0, [[-27, -36, 44], [31, -36, 44]], '#ffd86a'); g.globalAlpha = 1; }
  }
  const nightSky = (st, t) => {
    sky('#0a1540', '#233a78'); moon(560, 58);
    g.fillStyle = '#fff'; for (let i = 0; i < 44; i++) { g.globalAlpha = .4 + wave(t + i, .35, 2); g.beginPath(); g.arc((i * 83) % (BW + ox * 2) - ox, (i * 47) % 220, 1 + i % 2, 0, 7); g.fill(); } g.globalAlpha = 1;
    const lit = st.run.lit || 0;
    AURORA.forEach(([c, y], i) => { const a = lit > i ? Math.min(1, ((st.run.litT || [])[i] || 0)) : 0; if (a) auroraBand(c, y, a, t, i); });
    (st.run.litT || []).forEach((v, i) => { if (lit > i && v < 1) st.run.litT[i] = v + .012; });
    for (const r of st.run.ribbons || []) {
      g.globalCompositeOperation = 'lighter'; g.strokeStyle = r.c; g.lineCap = g.lineJoin = 'round';
      [[34, .16], [14, .34]].forEach(([w, f]) => { g.globalAlpha = f; g.lineWidth = w; g.beginPath(); r.pts.forEach(([x, y], i) => i ? g.lineTo(x, y + wave(t + x * .02, 3)) : g.moveTo(x, y)); g.stroke(); });
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    }
  };
  const fjall = () => {
    poly([[-400, 330], [-60, 180], [120, 300], [240, 200], [400, 310], [500, 170], [1100, 330]], '#c7d6ea');
    poly([[-96, 196], [-60, 180], [-26, 200]], '#fff'); poly([[208, 226], [240, 200], [272, 226]], '#fff'); poly([[462, 204], [500, 170], [540, 202]], '#fff');
    ground(312, '#eef4fb');
    for (const x of [-60, 34, 96, 610, 680]) sprite('snowpine', x, 316, .9);
  };
  const NORR = {
    id: 'norrsken', after: 29, title: 'Norrskenet', place: 'Abisko', reward: 250, gift: { cat: 'paint', id: 'norrglans' }, parkAt: 140, parkY: 372, winter: true, say: 'Vi är framme i Abisko!',
    bg(st) { nightSky(st, S.t); fjall(); at(470, 330, 1, () => cabin(false)); sprite('reindeer', 300, 348, 1.1); },
    start(st) { Object.assign(st.run, { lit: 0, litT: [], ribbons: [] }); },
    icon() { g.globalAlpha = 1; panelIcon(); },
    scenes: [
      tapAll({ say: 'Tänd himlen!', bg(st) { nightSky(st, S.t); fjall(); at(470, 330, 1, () => cabin(false)); sprite('reindeer', 300, 348, 1.1); },
        items: () => [[110, 90], [280, 150], [440, 76], [570, 170]].map(([x, y], i) => ({
          x, y, r: 62, wait: .4, sound: () => note(i + 1), fn(st, me, first) { if (first) { st.run.lit++; st.run.litT.push(0); } },
          colors: [AURORA[i][0], '#fff'],
          draw(me) { g.fillStyle = me.t >= 0 ? AURORA[i][0] : GOLD; shapePath('stars', x, y, 26 + wave(S.t + i, 3, 4)); g.fill(); },
        })) }),
      { say: 'Måla norrsken med fingret!',
        start(st) { st.len = 0; st.line = null; st.colour = 0; },
        down(st, x, y) { st.line = { c: AURORA[st.colour++ % 4][0], pts: [[x, y]] }; st.run.ribbons.push(st.line); st.len += 110; note(st.colour); if (st.run.ribbons.length > 12) st.run.ribbons.shift(); burst(x, y, [st.line.c, '#fff'], 6); },
        move(st, x, y) {
          if (!st.line) return;
          const l = st.line.pts, [px, py] = l[l.length - 1], d = dist(px, py, x, y);
          if (d > 10 && l.length < 90) { l.push([x, Math.min(y, 300)]); st.len += d; }
        },
        up(st) { st.line = null; },
        draw(st) {
          nightSky(st, S.t); fjall(); at(470, 330, 1, () => cabin(false)); sprite('reindeer', 300, 348, 1.1);
          if (!st.run.ribbons.length) { const x = 320 + wave(S.t, 110, 1.6), y = 130 + wave(S.t, 40, 3.2); ring(x, y, 26); }
        },
        done: st => st.len > 900 && !st.line,
      },
      { say: 'Fånga stjärnfallen!',
        start(st) { st.fall = []; st.got = 0; st.next = 0; },
        tap(st, x, y) {
          const hitOne = st.fall.filter(q => !q.got).sort((a, b) => dist(a.x, a.y, x, y) - dist(b.x, b.y, x, y))[0];
          if (hitOne) { hitOne.got = true; st.got++; note(st.got); burst(hitOne.x, hitOne.y, [GOLD, '#fff', AURORA[st.got % 4][0]], 18); }
        },
        draw(st, dt) {
          nightSky(st, S.t); fjall(); at(470, 330, 1, () => cabin(false)); sprite('reindeer', 300, 348, 1.1);
          if ((st.next -= dt) <= 0) { st.next = 1.3; st.fall.push({ x: 120 + Math.random() * 480, y: -10, got: false }); }
          for (const q of st.fall) {
            if (q.got) continue;
            q.x -= 70 * dt; q.y += 80 * dt; if (q.y > 270) { q.y = -10; q.x = 160 + Math.random() * 460; } // a star that was missed simply comes again
            g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 4; g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(q.x + 42, q.y - 48); g.stroke();
            g.fillStyle = GOLD; shapePath('stars', q.x, q.y, 22); g.fill();
          }
          for (let i = 0; i < 6; i++) { g.fillStyle = i < st.got ? GOLD : 'rgba(255,255,255,.4)'; shapePath('stars', 214 + i * 42, 48, 14); g.fill(); }
        },
        done: st => st.got >= 6,
      },
      dragTo({ say: 'Ge renen lavar!',
        bg(st) {
          nightSky(st, S.t); fjall(); at(490, 340, 1, () => cabin(false));
          const n = st.pieces.filter(p => p.placed).length;
          sprite('reindeer', 320, 372 - (n ? Math.abs(wave(S.t, 7, 9)) : 0), 1.7);
        },
        pieces: () => [[80, 372], [156, 392], [232, 372]].map(([x, y], i) => ({ x, y, tx: 386, ty: 300, sound: () => { beep(330, 0, .16, .08, 'triangle', .7); note(i + 1); }, colors: ['#b8d98a', '#fff'], draw(p) { blob(0, [[p.x, p.y, 16], [p.x - 16, p.y + 6, 12], [p.x + 16, p.y + 6, 12], [p.x + 2, p.y - 12, 9]], '#b8d98a'); } })) }),
      tapAll({ say: 'Tryck på renen, stugan och älgen!', bg(st) { nightSky(st, S.t); fjall(); }, items: () => [
        { x: 120, y: 306, r: 74, sound: CRIES.radjur, draw(it) { const hop = it.t >= 0 && it.t < 1.4 ? Math.abs(wave(it.t, 26, 8)) : 0; sprite('reindeer', it.x, 346 - hop, 1.3); } },
        { x: 480, y: 284, r: 92, sound: () => note(4), draw(it, st) { at(it.x, 340, 1.05, () => cabin(it.t >= 0)); } },
        { x: 300, y: 314, r: 74, sound: () => sfx.win(), draw(it) { walker(it.x, 366, 1, 0, it.t >= 0 && it.t < 2 ? wave(it.t, 26, 7) : 0); } },
      ] }),
      { say: 'Titta, hela resan genom Sverige!',
        start(st) { st.p = 0; st.seen = 0; },
        tap(st) { st.p += .03; pop(); },
        draw(st, dt) {
          nightSky(st, S.t); st.p = Math.min(1, st.p + dt / 11);
          const k2 = .6, pt = T => { const [x, y] = mapXY(T.at); return [150 + x * k2 - 80, 14 + y * k2]; }, line = pts => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); };
          g.fillStyle = '#8ccf7b'; g.strokeStyle = '#fffaf0'; g.lineWidth = 4; g.lineJoin = 'round'; line(SWEDEN.map(a => pt({ at: a }))); g.closePath(); g.fill(); g.stroke();
          const n = st.p * (THEMES.length - 1), upto = Math.floor(n), road = THEMES.slice(0, upto + 1).map(pt);
          const [ax, ay] = pt(THEMES[upto]), [bx, by] = pt(THEMES[Math.min(upto + 1, THEMES.length - 1)]), mx = ax + (bx - ax) * (n - upto), my = ay + (by - ay) * (n - upto);
          g.strokeStyle = '#f4614d'; g.lineWidth = 4; g.lineCap = 'round'; line([...road, [mx, my]]); g.stroke();
          const list = ALL.filter(d => d.after <= n);
          if (list.length > st.seen) { st.seen = list.length; sfx.can(); burst(...pt(THEMES[list[list.length - 1].after]), [GOLD, '#fff'], 16); }
          for (const d of list) { const [x, y] = pt(THEMES[d.after]); g.fillStyle = GOLD; shapePath('stars', x, y, 11); g.fill(); }
          ALL.forEach((d, i) => { // the six adventures fill up beside the map as the moose reaches them
            const x = 380 + (i % 3) * 86, y = 120 + Math.floor(i / 3) * 120, on = list.includes(d);
            blob(0, [[x, y, 40]], on ? '#ffe9a0' : 'rgba(255,255,255,.14)');
            if (on) at(x, y + 22, .42, () => d.icon());
          });
          g.save(); g.translate(mx, my + 14); drawMoose(58); g.restore();
        },
        done: st => st.p >= 1,
      },
    ],
    final(st, t) { nightSky(st, t); fjall(); at(490, 340, 1.05, () => cabin(true)); sprite('reindeer', 130, 348, 1.2); walker(300, 372, 1.2, 0, wave(t, 18, 6)); g.fillStyle = GOLD; shapePath('stars', 320, 86, 46 + wave(t, 5, 4)); g.fill(); },
  };
  function panelIcon() { g.save(); g.translate(0, -50); [['#3fe0a0', -12], ['#a06cf0', 8], ['#f27ac0', 26]].forEach(([c, y]) => { g.strokeStyle = c; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(-54, y); g.quadraticCurveTo(-18, y - 28, 8, y); g.quadraticCurveTo(30, y + 22, 54, y - 6); g.stroke(); }); g.restore(); }

  // in road order, each straight after the level that leads to it
  const ALL = [FLYG, TVATT, GATA, SKOG, VERK, NORR];

  /* ---------- running one adventure ---------- */
  const isDone = id => !!(save.bonus && save.bonus[id]);
  const reached = d => d.after === SPECS.length - 1 ? !!save.best[d.after] : !!save.best[d.after] || save.unlocked > d.after;
  const PRAISE = ['Bra jobbat!', 'Snyggt!', 'Wow!', 'Så duktig!', 'Jättebra!', 'Toppen!', 'Hurra!'];
  function setUi(phase) {
    $('bonusStart').hidden = phase !== 'intro'; $('bonusSkip').hidden = phase !== 'intro'; $('bonusTitle').hidden = phase !== 'intro';
    $('bonusCard').hidden = phase !== 'done'; $('bonusBack').hidden = phase === 'done' || phase === 'gift'; $('bonusDots').hidden = phase !== 'play'; $('bonusGo').hidden = true;
  }
  function open(id) {
    const def = ALL.find(d => d.id === id);
    if (!def) return;
    resetRun(def.level ?? def.after); S.x = 300;
    run = { def, phase: 'intro', i: -1, t: 0, st: null, gap: 0, iris: 1, store: {} }; fx.length = 0;
    S.hop = S.v = S.stunT = 0; S.parts = [];
    if (def.start) def.start({ run: run.store });
    $('bonusTitle').innerHTML = `<b>${def.title}</b><span>${def.place}</span>`;
    show('bonus'); setUi('intro'); say(def.say);
  }
  function nextScene() {
    run.i++; run.gap = 0; run.iris = 0; $('bonusGo').hidden = true;
    if (run.i >= run.def.scenes.length) return finish();
    const sc2 = run.def.scenes[run.i];
    run.st = { run: run.store }; run.t = 0;
    if (sc2.start) sc2.start(run.st);
    if (sc2.say) say(sc2.say);
    $('bonusDots').innerHTML = run.def.scenes.map((_, i) => `<i class="${i < run.i ? 'on' : i === run.i ? 'now' : ''}"></i>`).join('');
  }
  function finish() {
    const def = run.def, first = !isDone(def.id), prize = first && def.gift;
    if (first) { // coins and prize are written together, so a reload can never pay twice
      save.bonus[def.id] = 1; save.total += def.reward;
      if (prize && !save.owned[prize.cat].includes(prize.id)) save.owned[prize.cat].push(prize.id);
    }
    if (def.done) def.done(run.store, first);
    persist();
    run.first = first; run.t = 0; run.st = { run: run.store }; partyT = 0; run.iris = 0;
    if (prize) {
      const pic = document.createElement('canvas'); picture(pic, prize.cat, CATALOG[prize.cat].find(i => i.id === prize.id));
      run.gift = { taps: 0, t: 0, shake: 0, pic }; run.phase = 'gift'; setUi('gift'); say('En present till dig! Tryck på paketet!');
      const box = $('bonusPrize'); box.width = box.height = 200; box.getContext('2d').drawImage(pic, 0, 0);
    } else { $('bonusPrize').hidden = true; showCard(); }
  }
  function showCard() {
    const def = run.def;
    run.phase = 'done'; run.t = 0; sfx.win();
    say(def === NORR ? (save.name ? `Grattis ${save.name}! Du körde genom hela Sverige!` : 'Grattis! Du körde genom hela Sverige!') : 'Bra jobbat!');
    $('bonusReward').hidden = !run.first; $('bonusRewardN').textContent = `+${def.reward}`;
    $('bonusPrize').hidden = !run.gift; $('bonusGold').hidden = def !== NORR;
    setUi('done');
  }
  function leave(go) { const wasRun = run; run = null; S.trial = null; S.L = buildLevel(0); S.x = 300; go(wasRun); }
  function nextDrive(r) { const n = r.def.after + 1; if (n < SPECS.length && n <= save.unlocked) startLevel(n); else show('map'); }

  /* ---------- once a frame, from the main loop ---------- */
  function frameBonus(dt) {
    if (!run || !innerWidth || !innerHeight) return;
    k = Math.min(innerWidth / BW, innerHeight / BH); ox = (innerWidth / k - BW) / 2; oy = (innerHeight / k - BH) / 2;
    g = mainCtx; g.setTransform(dpr * k, 0, 0, dpr * k, dpr * k * ox, dpr * k * oy);
    run.t += dt;
    if (run.phase === 'intro') {
      const d = run.def, x = Math.min(run.t, 1.6) / 1.6, ease = 1 - (1 - x) * (1 - x);
      S.wheel += x < 1 ? dt * 6 : 0;
      d.bg({ run: run.store }); carAt(-ox - 170 + (d.parkAt + ox + 170) * ease, d.parkY, 1, d.id === 'verkstad' ? gear(false) : look());
      if (d.id === 'tvatt') for (const [a, b] of [[-90, -40], [-30, -30], [40, -40], [90, -30]]) blob(0, [[-ox - 170 + (d.parkAt + ox + 170) * ease + a, d.parkY + b, 18]], '#7a5232');
    } else if (run.phase === 'play') {
      const s = run.def.scenes[run.i];
      s.draw(run.st, dt);
      $('bonusGo').hidden = !(s.ready && !run.st.finished && s.ready(run.st));
      if (s.done(run.st)) {
        if (!run.gap) { sfx.win(); say(PRAISE[run.i % PRAISE.length]); burst(320, 190, [GOLD, '#fff', '#f4614d'], 26); }
        run.gap += dt; cheer(run.gap);
        if (run.gap > 1.7) nextScene();
      }
    } else if (run.phase === 'gift') {
      run.def.final(run.st, run.t); drawGift(dt);
    } else {
      run.def.final(run.st, run.t);
      if ((partyT -= dt) <= 0) { partyT = 1.3; party(); }
    }
    drawFx(dt);
    if (run.iris < .5) { // each scene opens like an eye, from the middle
      run.iris += dt; const r = run.iris / .5 * 900;
      g.fillStyle = NAVY; g.beginPath(); g.rect(-ox - 20, -oy - 20, BW + ox * 2 + 40, BH + oy * 2 + 40); g.moveTo(320 + r, 200); g.arc(320, 200, r, 0, 6.2832, true); g.fill('evenodd');
    }
  }

  function cheer(t) { // after every activity: a big star, and the moose popping up to cheer
    const up = Math.min(t * 4, 1), pop2 = 1 - (1 - up) * (1 - up);
    g.fillStyle = 'rgba(18,48,107,.2)'; g.fillRect(-ox - 20, -oy - 20, BW + ox * 2 + 40, BH + oy * 2 + 40);
    rays(320, 180, 300, S.t);
    g.fillStyle = GOLD; g.strokeStyle = '#e6a100'; g.lineWidth = 6; shapePath('stars', 320, 180, 92 * pop2 + wave(S.t, 5, 7)); g.fill(); g.stroke();
    g.save(); g.translate(92, BH + oy + 30 - pop2 * 210); g.rotate(wave(S.t, .08, 9)); drawMoose(190); g.restore();
  }
  function drawGift(dt) { // the prize: three taps on the box and it bursts open
    const c = run.gift; c.t += dt;
    g.fillStyle = 'rgba(18,48,107,.42)'; g.fillRect(-ox - 20, -oy - 20, BW + ox * 2 + 40, BH + oy * 2 + 40);
    const x = 320, y = 310, sh = c.shake > 0 ? wave(S.t, 9, 40) : 0; c.shake -= dt;
    if (c.taps < 3) {
      rays(x, y - 80, 240, S.t, '#fff3a8', .25);
      at(x + sh, y, 1 + c.taps * .1, () => {
        shade(0, 6, 112, 12); panel(-96, -112, 192, 116, 10, '#e8483f'); rect(0, -16, -112, 32, 116, GOLD); panel(-108, -140, 216, 36, 8, '#f4614d'); rect(0, -16, -140, 32, 36, GOLD);
        blob(0, [[-30, -156, 22], [30, -156, 22]], GOLD); blob(0, [[-30, -156, 10], [30, -156, 10]], '#e6a100');
      });
      ring(x, y - 70, 130);
    } else {
      rays(x, 190, 420, S.t);
      const rise = Math.min(c.t * 1.6, 1);
      if (c.pic) { const s = 180 + rise * 70; g.drawImage(c.pic, x - s / 2, 190 - s / 2 + (1 - rise) * 80, s, s); }
      if (c.t > 1.7) showCard();
    }
  }
  function openGift() {
    const c = run.gift; if (c.taps >= 3) return;
    c.taps++; c.shake = .35; note(c.taps + 1);
    if (c.taps === 3) {
      c.t = 0; sfx.champ(); say('Du fick en present!'); burst(320, 230, [GOLD, '#f4614d', '#22b3a6', '#fff'], 40);
      for (let i = 0; i < 30; i++) { const a = -3.14 * Math.random(); fx.push({ x: 320, y: 240, vx: Math.cos(a) * 280, vy: Math.sin(a) * 420, life: 1.6, age: 0, r: 13, c: GOLD, g: 620 }); }
      party();
    }
  }

  /* ---------- touch and mouse on the canvas. Buttons sit on top and are ordinary buttons ---------- */
  const toBox = e => [e.clientX / k - ox, e.clientY / k - oy];
  let held = false;
  const cv2 = $('c');
  cv2.addEventListener('pointerdown', e => {
    if (S.screen !== 'bonus' || !run) return;
    if (run.phase === 'gift') { e.preventDefault(); openGift(); return; }
    if (run.phase !== 'play') return;
    e.preventDefault(); held = true;
    try { cv2.setPointerCapture(e.pointerId); } catch {}
    const s = run.def.scenes[run.i], [x, y] = toBox(e);
    if (s.tap) s.tap(run.st, x, y);
    if (s.down) s.down(run.st, x, y);
  });
  cv2.addEventListener('pointermove', e => {
    if (!held || !run || run.phase !== 'play') return;
    const s = run.def.scenes[run.i], [x, y] = toBox(e);
    if (s.move) s.move(run.st, x, y);
  });
  const release = () => { if (!held) return; held = false; if (run && run.phase === 'play') { const s = run.def.scenes[run.i]; if (s.up) s.up(run.st); } };
  cv2.addEventListener('pointerup', release); cv2.addEventListener('pointercancel', release);

  tap('bonusGo', () => { if (run && run.st) { run.st.finished = true; $('bonusGo').hidden = true; } });
  tap('bonusStart', () => { run.phase = 'play'; setUi('play'); nextScene(); });
  tap('bonusBack', () => leave(() => show('map')));
  tap('bonusSkip', () => leave(nextDrive));
  tap('bonusAgain', () => open(run.def.id));
  tap('bonusNext', () => leave(r => (r.def === VERK ? nextDrive(r) : show('map'))));
  $('winBonus').addEventListener('click', () => { const d = offerFor(S.L.n); if (d) { wakeAudio(); sfx.tap(); open(d.id); } });
  $('champBonus').addEventListener('click', () => { wakeAudio(); sfx.tap(); open(NORR.id); });

  /* ---------- what the rest of the game asks of the adventures ---------- */
  const offerFor = n => ALL.find(d => d.after === n && !isDone(d.id));
  function stopHtml(i) { // the star stop that follows level i on the map, if there is one
    const d = ALL.find(q => q.after === i);
    if (!d) return '';
    const open2 = reached(d), done = isDone(d.id);
    return `<div class="spot"><button class="stop bonusStop ${open2 && !done ? 'fresh' : ''}" data-b="${d.id}" ${open2 ? '' : 'disabled'} aria-label="${d.title}, ${d.place}${open2 ? '' : ', låst'}"><canvas width="160" height="160"></canvas><span class="bonusStar ${done ? 'on' : ''}">${STAR(done)}</span></button><span class="placeName">${d.title}</span></div>`;
  }
  function paintStops() {
    $('stops').querySelectorAll('.bonusStop canvas').forEach(c => {
      const d = ALL.find(q => q.id === c.parentNode.dataset.b), was = g;
      g = c.getContext('2d'); g.translate(80, 128); d.icon(); g = was;
    });
  }
  return { ALL, open, frame: frameBonus, stopHtml, paintStops, offerFor, reached, isDone, get run() { return run; }, finish };
})();
