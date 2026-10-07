
/* ================= spelet ================= */
const NG = 8, GAP = 95, START = 70;
const G = { state: 'menu', paused: false, rotPause: false, t: 0, d: 0, speed: 6, base: 6, boost: 0, slow: 0, zx: 0, lane: 0, jy: 0, vy: 0, dj: false, duck: 0, phase: 0, ban: 0, rush: 0, ra: 0,
  right: 0, results: [], react: 5, gi: 0, gates: [], items: [], ii: 0, fin: 0, finT: 0, monT: 0, wob: 0, mud: 0, wade: 0, chIdx: 0, hitCd: 0 };
window.__G = G;
const KINDS = {
  buffel: ['log', 'rock', 'mud', 'stream', 'branch', 'log', 'rock'],
  zebra: ['log', 'rock', 'stream', 'mud', 'log', 'stream'],
  antilop: ['log', 'rock', 'stream', 'river', 'branch', 'mud', 'river'],
  gasell: ['log', 'rock', 'stream', 'river', 'branch', 'mud', 'log', 'branch']
};
const SPACING = { buffel: 24, zebra: 19, antilop: 16, gasell: 14 };
const FULL_W = { stream: 1.9, river: 4.6 };
const pick = a => a[Math.floor(Math.random() * a.length)];
function buildTrack() {
  G.gates = []; for (let i = 0; i < NG; i++) { G.chIdx = i; G.gates.push({ d: START + i * GAP, ch: newChallenge(), signed: false, spawned: false }); }
  G.fin = START + (NG - 1) * GAP + 80;
  const it = [], kinds = KINDS[S.animal], sp = SPACING[S.animal];
  const nearGate = d => G.gates.some(g => d > g.d - 26 && d < g.d + 10);
  for (let d = 26; d < G.fin - 18; d += sp * rnd(0.8, 1.35)) {
    if (nearGate(d)) continue;
    const k = pick(kinds), lane = FULL_W[k] ? null : pick([-1, 0, 1]);
    it.push({ k, d, lane });
    if (Math.random() < 0.65) {
      const up = k === 'log' && AN.jump > 0 && Math.random() < 0.5, fl = up ? lane : pick([-1, 0, 1].filter(l => l !== lane));
      for (let j = 0; j < 3; j++) it.push({ k: 'banana', d: d + (up ? -1.4 + j * 1.4 : 5 + j * 2), lane: fl, up });
    }
  }
  for (const g of G.gates) for (let j = 0; j < 4; j++) it.push({ k: 'banana', d: g.d + 9 + j * 2, lane: 0 });
  it.sort((a, b) => a.d - b.d); G.items = it; G.ii = 0;
}
function spawnItem(it) {
  let n, flat = false, x = it.lane == null ? 0 : it.lane * LANE;
  if (it.k === 'log') n = node(LOG);
  else if (it.k === 'rock') n = node(ROCK);
  else if (it.k === 'stream') { n = node(STREAM); flat = true; }
  else if (it.k === 'river') { n = node(RIVER); flat = true; }
  else if (it.k === 'mud') { n = node(MUD); flat = true; }
  else if (it.k === 'branch') n = node(BRANCH, { s: [it.lane < 0 ? -1 : 1, 1, 1] });
  else if (it.k === 'banana') n = node(BANANA, { r: [0, 0, 0.4] });
  n.p = [x, it.k === 'banana' ? (it.up ? 2.15 : 1.0) : 0, 0];
  ents.push({ k: it.k, d: it.d, x, lane: it.lane, node: n, flat, hd: FULL_W[it.k] / 2 });
}
function spawnGates(g) {
  const root = node(null), plates = [];
  g.ch.gates.forEach((sp, i) => {
    const gt = add(root, node(GATE, { p: [(i - 1) * LANE, 0, 0] }));
    const back = add(gt, node(PLATE_BACK, { p: [0, 3.95, 0] }));
    plates.push(add(back, node(PLATE, { p: [0, 0, 0.07], tex: symTex(sp), blend: true, unlit: true, po: true })));
  });
  ents.push({ k: 'gates', d: g.d, node: root, plates, g });
}
function spawnFinish() { const root = node(ARCH); add(root, node(BANNER, { p: [0, 3.6, 0.2], tex: FINISH, blend: true, unlit: true, po: true })); ents.push({ k: 'finish', d: G.fin, node: root }); }

function startSign(g) {
  g.signed = true; mPlate.tex = symTex(g.ch.sign); MON.ty = MON.show; MON.mood = 0; G.monT = 0;
  sfx.sign(); setTimeout(() => { if (G.state === 'play') say(g.ch.say); }, 400); renderProg();
}
function resolve(g) {
  const i = clamp(Math.round(G.zx / LANE), -1, 1) + 1, ok = i === g.ch.ans, e = ents.find(x => x.g === g);
  G.results.push(ok); G.gi++;
  if (ok) { G.right++; G.boost = G.base * 0.6; burst(G.zx, 2.2, -0.5, 26); sfx.good(); MON.mood = 1; say(pick(['Rätt!', 'Snyggt!', 'Jättebra!', 'Ja, precis!'])); if (e) e.plates[i].pulse = 1; G.react = Math.max(AN.react * 0.7, G.react - 0.2); }
  else { G.slow = Math.max(G.slow, 0.7); sfx.bad(); MON.mood = -1; say(g.ch.fix); if (e) e.plates[g.ch.ans].pulse = 1; G.react = Math.min(AN.react * 1.5, G.react + 0.7); }
  G.monT = 1.6; renderProg();
}
function obstacleHit(e) {
  e.hit = true;
  if (AN.smash || G.rush > 0) { e.node.vis = false; spray(e.x, 0.8, false, 14); sfx.crunch(); G.slow = Math.max(G.slow, AN.smash && G.rush <= 0 ? 0.18 : 0); return; }
  G.slow = 1; G.wob = 0.7; sfx.bonk();
  toast(e.k === 'branch' ? 'Aj! Svep nedåt för att ducka.' : AN.jump ? 'Hoppsan! Hoppa över.' : 'Hoppsan!', 1500);
}
function jump() {
  if (G.state !== 'play') return;
  if (!AN.jump) { sfx.snort(); return; }
  if (G.jy <= 0.01 && G.vy === 0) { G.vy = AN.jump; G.dj = false; G.duck = 0; sfx.jump(); }
  else if (AN.dbl && !G.dj) { G.vy = AN.jump * 0.9; G.dj = true; sfx.jump2(); }
}
function duck() { if (G.state !== 'play' || G.jy > 0.05) return; G.duck = 0.8; sfx.duck(); }
function moveLane(d) { if (G.state !== 'play') return; G.lane = clamp(G.lane + d, -1, 1); }
function rush() {
  if (G.state !== 'play' || G.ban < 8 || G.rush > 0) return;
  G.rush = 2.6; G.ban = 0; sfx.rush(); stage.classList.add('rushing'); updHud();
}
function ordinal(n) { return n + (n <= 2 ? ':a' : ':e'); }
function rank() { let r = 1; for (const n of NPCS) if (n.finT ? (!G.finT || n.finT < G.finT) : n.d > G.d) r++; return r; }
function endRace() {
  G.finT = G.t; G.state = 'end'; sfx.fanfare(); burst(G.zx, 2.5, -1, 40); stage.classList.remove('rushing');
  const pl = rank(), st = G.right >= NG - 1 ? 3 : G.right >= NG / 2 ? 2 : 1;
  const rows = [{ name: 'Du – ' + AN.name.toLowerCase(), t: G.finT, me: true }].concat(NPCS.map(n => ({ name: n.name, t: n.finT || G.t + (G.fin - n.d) / Math.max(1, n.speed) })));
  rows.sort((a, b) => a.t - b.t);
  $('#endT').textContent = pl === 1 ? 'Du vann loppet!' : `I mål – ${ordinal(pl)} plats!`;
  $('#stars').innerHTML = [0, 1, 2].map(i => `<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2 6.1 20.4l1.3-6.5L2.5 9.3l6.6-.8z" fill="${i < st ? '#ffc93c' : '#e6dcc6'}" stroke="${i < st ? '#e0a01a' : '#d4c8ae'}" stroke-width="1.4" stroke-linejoin="round"/></svg>`).join('');
  $('#endR').textContent = `Rätt port: ${G.right} av ${NG}`; $('#endB').textContent = `Tid: ${G.finT.toFixed(1)} s`;
  $('#podium').innerHTML = rows.map((r, i) => `<li class="${r.me ? 'me' : ''}"><b>${ordinal(i + 1)}</b>${r.name}</li>`).join('');
  setTimeout(() => { $('#end').hidden = false; $('#hud').hidden = true; $('#rush').hidden = true; say(pl === 1 ? `Du vann! Du sprang rätt ${G.right} gånger av ${NG}.` : `I mål! Du kom på ${['', 'första', 'andra', 'tredje', 'fjärde'][pl]} plats.`); }, 900);
}
function reset() {
  ents.length = 0; G.t = 0; G.d = 0; G.boost = 0; G.slow = 0; G.lane = 0; G.zx = 0; G.jy = 0; G.vy = 0; G.duck = 0; G.ban = 0; G.rush = 0; G.ra = 0;
  G.right = 0; G.results = []; G.gi = 0; G.finT = 0; G.react = AN.react; G.monT = 0; G.wob = 0; G.hitCd = 0;
  MON.ty = MON.hide; stage.classList.remove('rushing');
  buildTrack();
  [[-1, 3], [1, 1.5], [0, 7]].forEach(([l, d], i) => Object.assign(NPCS[i], { d, lane: l, x: l * LANE, jy: 0, vy: 0, slow: 0, boost: 0, gi: 0, pickLane: null, lt: rnd(2, 4), finT: 0, bc: 0, speed: 0, phase: rnd(0, 6) }));
  renderProg(); updHud();
}
function renderProg() {
  $('#prog').innerHTML = Array.from({ length: NG }, (_, i) => `<i class="${i < G.results.length ? (G.results[i] ? 'ok' : 'no') : (i === G.results.length && G.gates[i] && G.gates[i].signed ? 'now' : '')}"></i>`).join('');
}
let lastHud = '';
function updHud() {
  const m = $('#meter'), f = Math.min(1, G.ban / 8), key = Math.round(f * 50) + '|' + rank() + '|' + (G.rush > 0);
  if (key === lastHud) return; lastHud = key;
  m.firstElementChild.style.width = (f * 100) + '%'; m.classList.toggle('full', f >= 1);
  const r = rank(); $('#place').innerHTML = `${r}<small>${r <= 2 ? ':a' : ':e'}</small>`;
  const b = $('#rush'); b.classList.toggle('ready', f >= 1 && G.rush <= 0); b.classList.toggle('on', G.rush > 0);
}
let toastT = 0;
function toast(t, ms) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, ms || 2200); }

/* ================= huvudloop ================= */
let last = performance.now(), clock = 0;
const K = d => Math.sin(d * 0.011) * 0.75 + Math.sin(d * 0.0047 + 1.3) * 0.55 + Math.sin(d * 0.023 + 2) * 0.22;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!G.paused && !G.rotPause) update(dt);
  draw(dt);
  requestAnimationFrame(frame);
}
function animate(m, phase, air, speed, t) {
  if (m.bird) { m.torso.p[1] = air ? 0 : Math.abs(Math.sin(phase)) * 0.18; for (const l of m.legs) l.r[0] = air ? 0.6 : Math.sin(phase + l.ph) * 1.0; m.torso.r[0] = Math.sin(phase * 2) * 0.05; return; }
  m.torso.p[1] = air ? 0 : Math.abs(Math.sin(phase)) * 0.12;
  m.torso.r[0] = air ? -0.1 : Math.sin(phase * 2) * 0.03;
  for (const l of m.legs) l.r[0] = air ? (l.p[2] < 0 ? -0.7 : 0.7) : Math.sin(phase + l.ph) * 0.85;
  if (m.tail) { m.tail.r[2] = Math.sin(t * 6) * 0.35; m.tail.r[0] = 0.35 + speed * 0.02; }
}
function update(dt) {
  clock += dt;
  const play = G.state === 'play';
  if (play) G.t += dt;
  G.base = play ? AN.speed + Math.min(1.5, G.t * 0.02) : 5.5;
  G.boost = Math.max(0, G.boost - dt * G.base * 0.2); G.slow = Math.max(0, G.slow - dt * 0.8);
  G.rush = Math.max(0, G.rush - dt); if (G.rush <= 0) stage.classList.remove('rushing');
  G.ra += ((G.rush > 0 ? 1 : 0) - G.ra) * Math.min(1, dt * 5);
  const mudF = G.mud > 0 && !AN.smash && G.rush <= 0 ? 0.55 : 1, wadeF = G.wade > 0 ? 0.6 : 1;
  G.mud = Math.max(0, G.mud - dt); G.wade = Math.max(0, G.wade - dt);
  G.speed = (G.base * (1 + 0.5 * G.ra) + G.boost) * (1 - 0.55 * G.slow) * mudF * wadeF;
  const dd = G.speed * dt; G.d += dd;
  ground.uvo[1] = (G.d / 6) % 1; path.uvo[1] = (G.d / 6) % 1;
  for (const o of decor) { o.p[2] += dd; if (o.p[2] > 12) placeDecor(o, o.p[2] - WORLD_L); }
  const k = K(G.d);
  U.curve = k * 0.0045; U.bend = 0.0026 + 0.0008 * Math.sin(G.d * 0.0061);

  // lutning
  T.ang += (T.raw - T.ang) * Math.min(1, dt * 14);
  const tilt = S.ctrl === 'tilt' && T.got && G.state !== 'menu';
  if (S.ctrl === 'tilt' && G.state !== 'menu') {
    stage.style.transform = `rotate(${(-T.ang * S.comp / 100).toFixed(2)}deg)`;
    $('#wsvg').style.transform = `rotate(${T.ang.toFixed(1)}deg)`; $('#deg').textContent = T.got ? `${Math.round(T.ang)}°` : '–';
  }
  // styrning
  const prev = G.zx;
  if (play && tilt) {
    const a = (S.invert ? -1 : 1) * T.ang;
    if (S.tiltMode === 'wheel') {
      const dead = 3, max = 20, m = Math.abs(a) < dead ? 0 : Math.sign(a) * Math.min(1, (Math.abs(a) - dead) / (max - dead));
      if (m) G.zx += m * AN.lane * dt; else { const c = Math.round(G.zx / LANE) * LANE; G.zx += (c - G.zx) * Math.min(1, dt * 3); }
    } else { const tg = clamp(a / 18, -1, 1) * LANE * 1.15; G.zx += (tg - G.zx) * Math.min(1, dt * 8); }
    if (S.drift) G.zx -= k * G.speed * 0.085 * dt;               // kurvan drar utåt
  } else if (play) G.zx += (G.lane * LANE - G.zx) * Math.min(1, dt * AN.lane * 1.1);
  else G.zx += (0 - G.zx) * Math.min(1, dt * 3);
  G.zx = clamp(G.zx, -2.7, 2.7);
  const vx = (G.zx - prev) / Math.max(dt, 1e-4);
  // hopp och duck
  if (G.vy !== 0 || G.jy > 0) { G.vy -= 23 * dt; G.jy += G.vy * dt; if (G.jy <= 0) { G.jy = 0; G.vy = 0; } }
  G.duck = Math.max(0, G.duck - dt);
  // spelarens djur
  const air = G.jy > 0.01;
  G.phase += dt * (4 + G.speed * 0.7);
  G.wob = Math.max(0, G.wob - dt);
  const R = ME.root;
  R.p = [G.zx, G.jy, 0];
  R.r[1] += (-vx * 0.025 - R.r[1]) * Math.min(1, dt * 10);
  R.r[2] += (-vx * 0.03 + Math.sin(clock * 30) * G.wob * 0.3 - R.r[2]) * Math.min(1, dt * 10);
  const sy = G.duck > 0 ? 0.62 : 1; R.s = [1, R.s[1] + (sy - R.s[1]) * Math.min(1, dt * 18), 1];
  animate(ME, G.phase, air, G.speed, clock);
  zshadow.p = [G.zx, 0.05, 0.1]; const ss = 1 / (1 + G.jy * 0.5); zshadow.s = [ss, ss, ss];
  G.hitCd = Math.max(0, G.hitCd - dt);

  if (play) {
    while (G.ii < G.items.length && G.items[G.ii].d < G.d + 115) spawnItem(G.items[G.ii++]);
    for (const g of G.gates) if (!g.spawned && g.d < G.d + 115) { g.spawned = true; spawnGates(g); }
    if (!G.finSpawned && G.fin < G.d + 115) { G.finSpawned = true; spawnFinish(); }
    const g = G.gates[G.gi];
    if (g) {
      if (!g.signed && G.d >= g.d - clamp(G.base * G.react, 26, GAP - 18)) startSign(g);
      if (G.d >= g.d) resolve(g);
    }
    if (G.monT > 0) { G.monT -= dt; if (G.monT <= 0) MON.ty = MON.hide; }
    if (G.d >= G.fin) endRace();
  }
  // föremål
  for (let i = ents.length - 1; i >= 0; i--) {
    const e = ents[i], z = -(e.d - G.d); e.node.p[2] = z;
    const inLane = e.lane == null || Math.abs(e.x - G.zx) < 1.1;
    if (play && !e.hit) {
      if (e.k === 'banana') { e.node.r[1] += dt * 3; if (Math.abs(z) < 0.8 && Math.abs(e.x - G.zx) < 0.9 && (!e.node.p[1] || e.node.p[1] < 1.5 || G.jy > 0.8)) { e.hit = true; e.node.vis = false; G.ban = Math.min(8, G.ban + 1); sfx.pick(); if (G.ban === 8) toast('Ruschen är full – tryck på RUSCH!', 1800); } }
      else if (e.k === 'log' && inLane && Math.abs(z) < 0.6 && G.jy < 0.55) obstacleHit(e);
      else if (e.k === 'rock' && inLane && Math.abs(z) < 0.65 && G.jy < 0.75) obstacleHit(e);
      else if (e.k === 'branch' && inLane && Math.abs(z) < 0.5 && G.duck <= 0) obstacleHit(e);
      else if (e.k === 'mud' && inLane && Math.abs(z) < 1.9 && G.jy < 0.1) { G.mud = 0.15; if (!AN.smash && Math.random() < dt * 8) spray(G.zx, 0.3, false, 2); }
      else if ((e.k === 'stream' || e.k === 'river') && Math.abs(z) < e.hd && G.jy < 0.15) {
        if (AN.smash) { G.wade = 0.15; if (Math.random() < dt * 12) spray(G.zx, 0.4, true, 2); }
        else { e.hit = true; G.slow = Math.max(G.slow, 0.85); G.wob = 0.5; spray(G.zx, 0.5, true, 16); sfx.splash(); toast(AN.dbl && e.k === 'river' ? 'Plask! Över floden behövs ett dubbelhopp.' : 'Plask! Hoppa över vattnet.', 1600); }
      }
    }
    if (e.k === 'gates') for (const p of e.plates) if (p.pulse) { p.pulse = Math.max(0, p.pulse - dt * 0.8); const s = 1 + Math.sin(p.pulse * 12) * 0.25 * p.pulse; p.s = [s, s, 1]; }
    if (z > 16) ents.splice(i, 1);
  }
  // motståndare
  for (const n of NPCS) {
    if (play) {
      const gap = n.d - G.d, rub = gap > 22 ? 0.86 : gap > 9 ? 0.95 : gap < -30 ? 1.18 : gap < -12 ? 1.07 : 1;
      n.slow = Math.max(0, n.slow - dt * 0.8); n.boost = Math.max(0, n.boost - dt * G.base * 0.2);
      n.speed = G.base * n.f * rub * (1 - 0.5 * n.slow) + n.boost;
      if (!n.finT) n.d += n.speed * dt;
      const ng = G.gates[n.gi];
      if (ng) {
        if (n.pickLane == null && n.d > ng.d - 26) { const ok = Math.random() < n.acc; n.pickLane = (ok ? ng.ch.ans : pick([0, 1, 2].filter(x => x !== ng.ch.ans))) - 1; n.lane = n.pickLane; n.ok = ok; }
        if (n.d >= ng.d) { if (n.ok) n.boost = G.base * 0.3; else n.slow = 0.9; n.gi++; n.pickLane = null; n.lt = rnd(1.5, 3); }
      }
      n.lt -= dt; if (n.lt <= 0 && n.pickLane == null) { n.lane = pick([-1, 0, 1]); n.lt = rnd(2, 5); }
      if (!n.finT && n.d >= G.fin) n.finT = G.t;
      // hoppa över hinder i den egna filen
      if (n.jy <= 0 && n.vy === 0) for (const e of ents) { if (e.k === 'banana' || e.k === 'gates' || e.k === 'finish' || e.k === 'mud') continue; const ahead = e.d - n.d; if (ahead > 0.4 && ahead < 2.4 && (e.lane == null || Math.abs(e.x - n.x) < 1.1)) { n.vy = 7.4; break; } }
    }
    if (n.vy !== 0 || n.jy > 0) { n.vy -= 23 * dt; n.jy += n.vy * dt; if (n.jy <= 0) { n.jy = 0; n.vy = 0; } }
    n.x += (n.lane * LANE - n.x) * Math.min(1, dt * 3);
    const z = -(n.d - G.d); n.bc = Math.max(0, n.bc - dt);
    n.m.root.vis = z > -105 && z < 2.6; n.shadow.vis = n.m.root.vis;
    n.m.root.p = [n.x, n.jy, z]; n.m.root.r[2] = Math.sin(clock * 30) * n.slow * 0.15;
    n.phase += dt * (4 + n.speed * 0.7); animate(n.m, n.phase, n.jy > 0.01, n.speed, clock + n.phase);
    n.shadow.p = [n.x, 0.05, z + 0.1];
    // krock bakifrån
    if (play && n.bc <= 0 && z > -1.8 && z < 0.3 && Math.abs(n.x - G.zx) < 1.15 && G.speed > n.speed * 0.9) {
      n.bc = 1;
      if (G.rush > 0 || AN.smash) { n.slow = 1; n.lane = clamp(n.lane + (n.x >= G.zx ? 1 : -1), -1, 1); if (n.lane * LANE === Math.round(G.zx / LANE) * LANE) n.lane = n.lane === 0 ? 1 : 0; sfx.bonk(); }
      else { G.slow = Math.max(G.slow, 0.4); sfx.bump(); toast(`${n.name} är i vägen – sväng förbi!`, 1300); }
    }
  }
  // apan
  MON.y += (MON.ty - MON.y) * Math.min(1, dt * 4.5);
  let my = MON.y; if (MON.mood > 0 && G.monT > 0) my += Math.abs(Math.sin(clock * 11)) * 0.25;
  monkey.p = [0, my, -10]; monkey.s = [0.8, 0.8, 0.8]; monkey.r = [0, 0, Math.sin(clock * 1.8) * 0.06];
  mHead.r = [0, MON.mood < 0 && G.monT > 0 ? Math.sin(clock * 18) * 0.35 : Math.sin(clock * 1.3) * 0.12, 0];
  monkey.vis = MON.y < MON.hide - 0.3;
  // partiklar
  for (const p of confetti) { if (p.life <= 0) continue; p.life -= dt; p.v[1] -= 16 * dt; p.p = [p.p[0] + p.v[0] * dt, p.p[1] + p.v[1] * dt, p.p[2] + (p.v[2] + G.speed) * dt]; p.r[0] += dt * 8; p.r[1] += dt * 6; if (p.life <= 0 || p.p[1] < 0) { p.life = 0; p.vis = false; } }
  for (const p of bits) { if (p.life <= 0) continue; p.life -= dt; p.v[1] -= 20 * dt; p.p = [p.p[0] + p.v[0] * dt, p.p[1] + p.v[1] * dt, p.p[2] + (p.v[2] + G.speed * 0.6) * dt]; p.r[0] += dt * 9; if (p.life <= 0 || p.p[1] < 0) { p.life = 0; p.vis = false; } }
  if (play) updHud();
}
function draw(dt) {
  const p = PORTRAIT, k = K(G.d);
  const target = FOV * (1 + 0.14 * G.ra); curFov += (target - curFov) * Math.min(1, (dt || 0.016) * 6);
  proj = persp(curFov, SW / SH, 0.4, 240);
  const eye = [G.zx * 0.35, p ? 6.6 : 6.0, p ? 11 : 8.6], tgt = [G.zx * 0.55 + k * 1.8, p ? -1.4 : -0.9, -14];
  render(lookAt(eye, tgt));
}
