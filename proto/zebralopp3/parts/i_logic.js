
/* ================= spelet ================= */
const NG = 8, GAP = 112, START = 75;
const G = { state: 'menu', paused: false, rotPause: false, t: 0, d: 0, speed: 6, base: 6, boost: 0, slow: 0, zx: 0, lane: 0, jy: 0, vy: 0, dj: false, duck: 0, phase: 0, ban: 0, rush: 0, ra: 0,
  right: 0, results: [], react: 5, fi: 0, forks: [], items: [], ii: 0, fin: 0, finT: 0, monT: 0, wob: 0, mud: 0, wade: 0, chIdx: 0, lock: null,
  tum: 0, wet: 0, shake: 0, sq: 0, air: false, finSpawned: false };
window.__G = G;
const KINDS = {
  buffel: ['log', 'rock', 'mud', 'stream', 'branch', 'hump', 'log', 'rock'],
  zebra: ['log', 'rock', 'stream', 'mud', 'hump', 'log', 'stream'],
  antilop: ['log', 'rock', 'stream', 'river', 'branch', 'mud', 'hump', 'river'],
  gasell: ['log', 'rock', 'stream', 'river', 'branch', 'mud', 'hump', 'log', 'branch']
};
const SPACING = { buffel: 24, zebra: 19, antilop: 16, gasell: 14 };
const FULL_W = { stream: 1.9, river: 4.6, hump: 1.6 };
const pick = a => a[Math.floor(Math.random() * a.length)];
const forkAt = s => { for (const f of G.forks) if (s >= f.d && s <= f.d + FL) return f; return null; };
const spreadAt = s => { const f = forkAt(s); return f ? 1 + SPREAD * forkB((s - f.d) / FL) : 1; };
function buildTrack() {
  setTrackShape(true);
  G.forks = []; for (let i = 0; i < NG; i++) { G.chIdx = i; G.forks.push({ d: START + i * GAP, ch: newChallenge(), signed: false, spawned: false, locked: false, res: false }); }
  G.fin = START + (NG - 1) * GAP + FL + 55;
  const it = [], kinds = KINDS[S.animal], sp = SPACING[S.animal];
  const nearFork = d => G.forks.some(f => d > f.d - 30 && d < f.d + FL + 6);
  for (let d = 24; d < G.fin - 18; d += sp * rnd(0.8, 1.35)) {
    if (nearFork(d)) continue;
    const k = pick(kinds), lane = FULL_W[k] ? null : pick([-1, 0, 1]);
    if (k === 'hump') { const n = 2 + Math.floor(Math.random() * 2); for (let j = 0; j < n; j++) if (!nearFork(d + j * 7)) it.push({ k, d: d + j * 7, lane: null }); d += 7 * n; continue; }
    it.push({ k, d, lane });
    if (Math.random() < 0.65) {
      const up = k === 'log' && AN.jump > 0 && Math.random() < 0.5, fl = up ? lane : pick([-1, 0, 1].filter(l => l !== lane));
      for (let j = 0; j < 3; j++) it.push({ k: 'banana', d: d + (up ? -1.4 + j * 1.4 : 5 + j * 2), lane: fl, up });
    }
  }
  it.sort((a, b) => a.d - b.d); G.items = it; G.ii = 0;
  // dekor får inte stå på stigarna i vägskälen
  for (const o of decor) fixDecor(o);
}
function fixDecor(o) { const s = G.d - o.p[2]; if (forkAt(s) || forkAt(s + 4) || forkAt(s - 4)) { if (Math.abs(o.p[0]) < 7) o.p[0] = Math.sign(o.p[0] || 1) * rnd(7, 11); } }
function spawnItem(it) {
  let n, flat = 0, x = it.lane == null ? 0 : it.lane * LANE * spreadAt(it.d);
  if (it.k === 'log') n = node(LOG);
  else if (it.k === 'rock') n = node(ROCK);
  else if (it.k === 'stream') { n = node(STREAM); flat = 1; }
  else if (it.k === 'river') { n = node(RIVER); flat = 1; }
  else if (it.k === 'mud') { n = node(MUD); flat = 2; }
  else if (it.k === 'hump') n = node(HUMP);
  else if (it.k === 'pad') { n = node(PAD, { unlit: true }); flat = 2; }
  else if (it.k === 'branch') n = node(BRANCH, { s: [it.lane < 0 ? -1 : 1, 1, 1] });
  else if (it.k === 'banana') n = node(BANANA, { r: [0, 0, 0.4] });
  n.p = [x, it.k === 'banana' ? (it.up ? 2.15 : 1.0) : 0, 0];
  ents.push({ k: it.k, d: it.d, x, lane: it.lane, node: n, flat, hd: FULL_W[it.k] / 2, fo: null });
}
function spawnFork(f) {
  f.spawned = true;
  const ground = node(FORK_MESH.cover); ents.push({ k: 'forkg', d: f.d, x: 0, node: ground, flat: 1 });
  const trails = node(FORK_MESH.trails, { tex: TRAIL }); ents.push({ k: 'forkt', d: f.d, x: 0, node: trails, flat: 2 });
  const root = node(FORK_MESH.props), plates = [];
  const za = -ARCH_T * FL, sp = 1 + SPREAD * forkB(ARCH_T);
  f.ch.gates.forEach((s, i) => {
    const a = add(root, node(ARCH_SMALL, { p: [(i - 1) * LANE * sp, 0, za] }));
    const back = add(a, node(PLATE_BACK, { p: [0, 3.95, 0] }));
    plates.push(add(back, node(PLATE, { p: [0, 0, 0.07], tex: symTex(s), blend: true, unlit: true, po: true })));
  });
  ents.push({ k: 'fork', d: f.d, x: 0, node: root, plates, f });
}
function spawnFinish() { const root = node(ARCH); add(root, node(BANNER, { p: [0, 3.6, 0.2], tex: FINISH, blend: true, unlit: true, po: true })); ents.push({ k: 'finish', d: G.fin, x: 0, node: root }); }

function startSign(f) {
  f.signed = true; mPlate.tex = symTex(f.ch.sign); MON.ty = MON.show; MON.mood = 0; G.monT = 0;
  sfx.sign(); setTimeout(() => { if (G.state === 'play') say(f.ch.say + ' Välj rätt stig.'); }, 400); renderProg();
}
function lockFork(f) {  // barnet har valt stig: belöning eller lera dyker upp längre fram på stigen
  f.locked = true; G.lock = clamp(Math.round(G.zx / LANE), -1, 1); f.pick = G.lock; f.ok = G.lock + 1 === f.ch.ans;
  for (let t = 0.42; t < 0.86; t += f.ok ? 0.055 : 0.13) {
    const d = f.d + t * FL;
    if (f.ok) spawnItem({ k: Math.round(t * 100) % 3 === 0 ? 'pad' : 'banana', d, lane: G.lock });
    else spawnItem({ k: 'mud', d, lane: G.lock });
  }
}
function resolveFork(f) {
  f.res = true; const i = f.pick + 1, e = ents.find(x => x.f === f);
  G.results.push(f.ok); G.fi++;
  if (f.ok) { G.right++; G.boost = G.base * 0.55; burst(G.zx * spreadAt(G.d), 2.4, -0.5, 26); sfx.good(); MON.mood = 1; say(pick(['Rätt stig!', 'Snyggt!', 'Jättebra!', 'Ja, precis!'])); if (e) e.plates[i].pulse = 1; G.react = Math.max(AN.react * 0.7, G.react - 0.2); }
  else { sfx.bad(); MON.mood = -1; say(f.ch.fix); if (e) e.plates[f.ch.ans].pulse = 1; G.react = Math.min(AN.react * 1.5, G.react + 0.7); }
  G.monT = 1.8; renderProg();
}
function tumble() { G.tum = 0.0001; G.slow = 1; sfx.bonk(); setTimeout(() => sfx.boing(), 650); }
function obstacleHit(e) {
  e.hit = true;
  if (AN.smash || G.rush > 0) { e.fo = { x: 0, y: 0, z: 0, vx: rnd(-5, 5), vy: rnd(6, 10), vz: -G.speed * rnd(0.6, 1.0), sx: rnd(-8, 8), sy: rnd(-8, 8) }; spray(e.x, 0.8, false, 10); sfx.crunch(); G.slow = Math.max(G.slow, AN.smash && G.rush <= 0 ? 0.18 : 0); G.sq = 0.6; return; }
  tumble();
  toast(e.k === 'branch' ? 'Aj! Svep nedåt för att ducka.' : AN.jump ? 'Hoppsan! Hoppa över.' : 'Hoppsan!', 1500);
}
function jump() {
  if (G.state !== 'play' || G.tum > 0) return;
  if (!AN.jump) { sfx.snort(); G.sq = -0.4; return; }
  if (G.jy <= 0.01 && G.vy === 0) { G.vy = AN.jump; G.dj = false; G.duck = 0; G.sq = -0.6; sfx.jump(); }
  else if (AN.dbl && !G.dj) { G.vy = AN.jump * 0.9; G.dj = true; G.sq = -0.5; sfx.jump2(); }
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
  $('#endR').textContent = `Rätt stig: ${G.right} av ${NG}`; $('#endB').textContent = `Tid: ${G.finT.toFixed(1)} s`;
  $('#podium').innerHTML = rows.map((r, i) => `<li class="${r.me ? 'me' : ''}"><b>${ordinal(i + 1)}</b>${r.name}</li>`).join('');
  setTimeout(() => { $('#end').hidden = false; $('#hud').hidden = true; $('#rush').hidden = true; say(pl === 1 ? `Du vann! Du valde rätt stig ${G.right} gånger av ${NG}.` : `I mål! Du kom på ${['', 'första', 'andra', 'tredje', 'fjärde'][pl]} plats.`); }, 900);
}
function reset() {
  ents.length = 0; G.t = 0; G.d = 0; TR.D = 0; G.boost = 0; G.slow = 0; G.lane = 0; G.zx = 0; G.jy = 0; G.vy = 0; G.duck = 0; G.ban = 0; G.rush = 0; G.ra = 0;
  G.right = 0; G.results = []; G.fi = 0; G.finT = 0; G.react = AN.react; G.monT = 0; G.wob = 0; G.lock = null; G.tum = 0; G.wet = 0; G.shake = 0; G.sq = 0; G.finSpawned = false;
  MON.ty = MON.hide; stage.classList.remove('rushing'); setTint(ME, [1, 1, 1]);
  buildTrack();
  [[-1, 3], [1, 1.5], [0, 7]].forEach(([l, d], i) => Object.assign(NPCS[i], { d, lane: l, x: l * LANE, jy: 0, vy: 0, slow: 0, boost: 0, fi: 0, pickLane: null, lt: rnd(2, 4), finT: 0, bc: 0, speed: 0, phase: rnd(0, 6), tum: 0, humpCd: 0 }));
  renderProg(); updHud();
}
function renderProg() {
  $('#prog').innerHTML = Array.from({ length: NG }, (_, i) => `<i class="${i < G.results.length ? (G.results[i] ? 'ok' : 'no') : (i === G.results.length && G.forks[i] && G.forks[i].signed ? 'now' : '')}"></i>`).join('');
}
let lastHud = '';
function updHud() {
  const m = $('#meter'), f = Math.min(1, G.ban / 8), r = rank(), key = Math.round(f * 50) + '|' + r + '|' + (G.rush > 0);
  if (key === lastHud) return; lastHud = key;
  m.firstElementChild.style.width = (f * 100) + '%'; m.classList.toggle('full', f >= 1);
  $('#place').innerHTML = `${r}<small>${r <= 2 ? ':a' : ':e'}</small>`;
  const b = $('#rush'); b.classList.toggle('ready', f >= 1 && G.rush <= 0); b.classList.toggle('on', G.rush > 0);
}
let toastT = 0;
function toast(t, ms) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, ms || 2200); }

/* ================= huvudloop ================= */
let last = performance.now(), clock = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!G.paused && !G.rotPause) update(dt);
  draw(dt);
  requestAnimationFrame(frame);
}
function animate(m, phase, air, speed, t, flail) {
  const k = flail ? 2.2 : 1;
  if (m.bird) { m.torso.p[1] = air ? 0 : Math.abs(Math.sin(phase)) * 0.18; for (const l of m.legs) l.r[0] = air && !flail ? 0.6 : Math.sin(phase * k + l.ph) * 1.0; m.torso.r[0] = Math.sin(phase * 2) * 0.05; return; }
  m.torso.p[1] = air ? 0 : Math.abs(Math.sin(phase)) * 0.12;
  m.torso.r[0] = air ? -0.1 : Math.sin(phase * 2) * 0.03;
  for (const l of m.legs) l.r[0] = air && !flail ? (l.p[2] < 0 ? -0.7 : 0.7) : Math.sin(phase * k + l.ph) * (flail ? 1.2 : 0.85);
  if (m.tail) { m.tail.r[2] = Math.sin(t * (flail ? 20 : 6)) * 0.35; m.tail.r[0] = 0.35 + speed * 0.02; }
}
function update(dt) {
  clock += dt;
  const play = G.state === 'play';
  if (play) G.t += dt;
  G.base = play ? AN.speed + Math.min(1.5, G.t * 0.02) : 5.5;
  G.boost = Math.max(0, G.boost - dt * G.base * 0.2); G.slow = Math.max(0, G.slow - dt * 0.8);
  G.rush = Math.max(0, G.rush - dt); if (G.rush <= 0) stage.classList.remove('rushing');
  G.ra += ((G.rush > 0 ? 1 : 0) - G.ra) * Math.min(1, dt * 5);
  const mudF = G.mud > 0 && !AN.smash && G.rush <= 0 ? 0.5 : 1, wadeF = G.wade > 0 ? 0.6 : 1;
  G.mud = Math.max(0, G.mud - dt); G.wade = Math.max(0, G.wade - dt);
  const hillF = play ? clamp(1 - 1.2 * slope(G.d), 0.72, 1.32) : 1;           // uppför långsammare, nerför snabbare
  G.speed = (G.base * (1 + 0.5 * G.ra) + G.boost) * (1 - 0.55 * G.slow) * mudF * wadeF * hillF;
  const dd = G.speed * dt; G.d += dd; TR.D = G.d;
  ground.uvo[1] = (G.d / 6) % 1; path.uvo[1] = (G.d / 6) % 1;
  for (const o of decor) { o.p[2] += dd; if (o.p[2] > 12) { placeDecor(o, o.p[2] - WORLD_L); fixDecor(o); } }
  const kap = curv(G.d), pull = kap * G.speed * G.speed;                     // kurvans drag växer med farten i kvadrat
  U.bend = 0.0012; U.bendX = 0.0012;

  // lutning
  T.ang += (T.raw - T.ang) * Math.min(1, dt * 14);
  const tilt = S.ctrl === 'tilt' && T.got && G.state !== 'menu';
  if (S.ctrl === 'tilt' && G.state !== 'menu') {
    stage.style.transform = `rotate(${(-T.ang * S.comp / 100).toFixed(2)}deg)`;
    $('#wsvg').style.transform = `rotate(${T.ang.toFixed(1)}deg)`; $('#deg').textContent = T.got ? `${Math.round(T.ang)}°` : '–';
  }
  // styrning
  const prev = G.zx, cf = forkAt(G.d), ft = cf ? (G.d - cf.d) / FL : -1;
  if (play && tilt) {
    const a = (S.invert ? -1 : 1) * T.ang;
    if (S.tiltMode === 'wheel') {
      const dead = 3, max = 20, m = Math.abs(a) < dead ? 0 : Math.sign(a) * Math.min(1, (Math.abs(a) - dead) / (max - dead));
      if (m) G.zx += m * AN.lane * dt; else { const c = Math.round(G.zx / LANE) * LANE; G.zx += (c - G.zx) * Math.min(1, dt * 2.5); }
    } else { const tg = clamp(a / 18, -1, 1) * LANE * 1.15; G.zx += (tg - G.zx) * Math.min(1, dt * 8); }
    G.zx -= pull * 0.11 * (S.pull / 100) * dt;
  } else if (play) {
    G.zx += (G.lane * LANE - G.zx) * Math.min(1, dt * AN.lane * 1.1);
    G.zx -= pull * 0.03 * (S.pull / 100) * dt;                               // lite drag även vid svep
  } else G.zx += (0 - G.zx) * Math.min(1, dt * 3);
  G.zx = clamp(G.zx, -2.7, 2.7);
  if (cf && ft > LOCK_T && ft < 0.9 && G.lock != null) { G.zx = clamp(G.zx, G.lock * LANE - 0.55, G.lock * LANE + 0.55); G.lane = G.lock; }
  if (!cf) G.lock = null;
  const vx = (G.zx - prev) / Math.max(dt, 1e-4);
  // hopp, duck, kullerbytta
  const wasAir = G.jy > 0.01;
  if (G.vy !== 0 || G.jy > 0) { G.vy -= 23 * dt; G.jy += G.vy * dt; if (G.jy <= 0) { G.jy = 0; G.vy = 0; } }
  if (wasAir && G.jy <= 0) { G.sq = 0.8; sfx.land(); }
  G.duck = Math.max(0, G.duck - dt);
  let tumY = 0, tumR = 0;
  if (G.tum > 0) { G.tum = Math.min(1, G.tum + dt / 0.9); const e = 1 - Math.pow(1 - G.tum, 2); tumR = -TAU * e; tumY = Math.sin(Math.PI * G.tum) * 1.3; if (G.tum >= 1) { G.tum = 0; G.sq = 1; G.shake = 0.5; } }
  G.sq += (0 - G.sq) * Math.min(1, dt * 9);
  if (G.wet > 0) { G.wet -= dt; if (G.wet <= 0) setTint(ME, [1, 1, 1]); if (Math.random() < dt * 6) spray(G.zx * spreadAt(G.d), 1.6, true, 1); }
  G.shake = Math.max(0, G.shake - dt);
  // spelarens djur
  const air = G.jy > 0.01 || G.tum > 0, spX = spreadAt(G.d);
  G.phase += dt * (4 + G.speed * 0.7);
  G.wob = Math.max(0, G.wob - dt);
  const R = ME.root;
  R.p = [G.zx * spX, G.jy + tumY, 0];
  R.r[0] = tumR;
  R.r[1] += (-vx * 0.025 - R.r[1]) * Math.min(1, dt * 10);
  R.r[2] += (-vx * 0.03 - pull * 0.035 + Math.sin(clock * 34) * (G.wob * 0.3 + G.shake * 0.5) - R.r[2]) * Math.min(1, dt * 12);
  const dk = G.duck > 0 ? 0.62 : 1, q = G.sq; G.dks = (G.dks || 1) + (dk - (G.dks || 1)) * Math.min(1, dt * 18);
  R.s = [1 + 0.22 * q, G.dks * (1 - 0.28 * q), 1 + 0.22 * q];
  animate(ME, G.phase, air, G.speed, clock, G.tum > 0);
  zshadow.p = [G.zx * spX, 0.05, 0.1]; const ss = 1 / (1 + (G.jy + tumY) * 0.5); zshadow.s = [ss, ss, ss];

  if (play) {
    while (G.ii < G.items.length && G.items[G.ii].d < G.d + 115) spawnItem(G.items[G.ii++]);
    for (const f of G.forks) if (!f.spawned && f.d < G.d + 115) spawnFork(f);
    if (!G.finSpawned && G.fin < G.d + 115) { G.finSpawned = true; spawnFinish(); }
    const f = G.forks[G.fi];
    if (f) {
      if (!f.signed && G.d >= f.d - clamp(G.base * G.react, 28, GAP - 20)) startSign(f);
      if (!f.locked && G.d >= f.d + LOCK_T * FL) lockFork(f);
      if (!f.res && G.d >= f.d + ARCH_T * FL) resolveFork(f);
    }
    if (G.monT > 0) { G.monT -= dt; if (G.monT <= 0) MON.ty = MON.hide; }
    if (G.d >= G.fin) endRace();
  }
  // föremål
  const px = G.zx * spX;
  for (let i = ents.length - 1; i >= 0; i--) {
    const e = ents[i], z = -(e.d - G.d);
    if (e.fo) { const o = e.fo; o.vy -= 22 * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.z += o.vz * dt; if (o.y < 0 && o.vy < 0) { o.y = 0; o.vy *= -0.45; o.vx *= 0.7; o.vz *= 0.7; } e.node.r[0] += o.sx * dt; e.node.r[1] += o.sy * dt; e.node.p = [e.x + o.x, o.y, z + o.z]; }
    else e.node.p[2] = z;
    const inLane = e.lane == null || Math.abs(e.x - px) < 1.1;
    if (play && !e.hit) {
      if (e.k === 'banana') { e.node.r[1] += dt * 3; if (Math.abs(z) < 0.8 && Math.abs(e.x - px) < 0.9 && (e.node.p[1] < 1.5 || G.jy > 0.8)) { e.hit = true; e.node.vis = false; G.ban = Math.min(8, G.ban + 1); sfx.pick(); if (G.ban === 8) toast('Ruschen är full – tryck på RUSCH!', 1800); } }
      else if (e.k === 'pad' && inLane && Math.abs(z) < 0.8) { e.hit = true; G.boost = Math.max(G.boost, G.base * 0.5); sfx.zoom(); }
      else if (e.k === 'log' && inLane && Math.abs(z) < 0.6 && G.jy < 0.55 && G.tum <= 0) obstacleHit(e);
      else if (e.k === 'rock' && inLane && Math.abs(z) < 0.65 && G.jy < 0.75 && G.tum <= 0) obstacleHit(e);
      else if (e.k === 'branch' && inLane && Math.abs(z) < 0.5 && G.duck <= 0 && G.tum <= 0) obstacleHit(e);
      else if (e.k === 'hump' && Math.abs(z) < 0.5 && G.jy < 0.1) { e.hit = true; G.vy = 4.2 + G.speed * 0.3; G.dj = false; G.sq = -0.7; sfx.whee(); }
      else if (e.k === 'mud' && inLane && Math.abs(z) < 1.9 && G.jy < 0.1) { G.mud = 0.15; if (!AN.smash && Math.random() < dt * 8) spray(px, 0.3, false, 2); }
      else if ((e.k === 'stream' || e.k === 'river') && Math.abs(z) < e.hd && G.jy < 0.15) {
        if (AN.smash) { G.wade = 0.15; if (Math.random() < dt * 12) spray(px, 0.4, true, 2); }
        else { e.hit = true; G.slow = Math.max(G.slow, 0.85); G.wob = 0.4; G.shake = 0.9; G.wet = 2.4; setTint(ME, [0.72, 0.8, 1.0]); spray(px, 0.6, true, 18); sfx.splash(); toast(AN.dbl && e.k === 'river' ? 'Plask! Över floden behövs ett dubbelhopp.' : 'Plask! Hoppa över vattnet.', 1600); }
      }
    }
    if (e.k === 'fork') for (const p of e.plates) if (p.pulse) { p.pulse = Math.max(0, p.pulse - dt * 0.8); const s = 1 + Math.sin(p.pulse * 12) * 0.25 * p.pulse; p.s = [s, s, 1]; }
    if (z > 16 && !(e.k === 'forkg' || e.k === 'forkt' || e.k === 'fork') || z > FL + 16) ents.splice(i, 1);
  }
  // motståndare
  for (const n of NPCS) {
    if (play) {
      const gap = n.d - G.d, rub = gap > 22 ? 0.86 : gap > 9 ? 0.95 : gap < -30 ? 1.18 : gap < -12 ? 1.07 : 1;
      n.slow = Math.max(0, n.slow - dt * 0.8); n.boost = Math.max(0, n.boost - dt * G.base * 0.2);
      n.speed = (G.base * n.f * rub * (1 - 0.5 * n.slow) + n.boost) * clamp(1 - 1.2 * slope(n.d), 0.72, 1.32);
      if (!n.finT) n.d += n.speed * dt;
      const nf = G.forks[n.fi];
      if (nf) {
        if (n.pickLane == null && n.d > nf.d - 26) { const ok = Math.random() < n.acc; n.pickLane = (ok ? nf.ch.ans : pick([0, 1, 2].filter(x => x !== nf.ch.ans))) - 1; n.lane = n.pickLane; n.ok = ok; }
        if (n.d >= nf.d + ARCH_T * FL && !n.done) { n.done = true; if (n.ok) n.boost = G.base * 0.3; else n.slow = 0.9; }
        if (n.d >= nf.d + FL) { n.fi++; n.pickLane = null; n.done = false; n.lt = rnd(1.5, 3); }
      }
      n.lt -= dt; if (n.lt <= 0 && n.pickLane == null) { n.lane = pick([-1, 0, 1]); n.lt = rnd(2, 5); }
      if (!n.finT && n.d >= G.fin) n.finT = G.t;
      n.humpCd = Math.max(0, n.humpCd - dt);
      if (n.jy <= 0 && n.vy === 0) for (const e of ents) {
        if (e.hit && e.k !== 'hump') continue;
        const ahead = e.d - n.d;
        if (e.k === 'hump' && ahead > -0.3 && ahead < 0.4 && n.humpCd <= 0) { n.vy = 4.2 + n.speed * 0.3; n.humpCd = 0.6; break; }
        if (['log', 'rock', 'stream', 'river', 'branch'].includes(e.k) && ahead > 0.4 && ahead < 2.4 && (e.lane == null || Math.abs(e.x - n.x * spreadAt(n.d)) < 1.1)) { n.vy = 7.4; break; }
      }
    }
    if (n.vy !== 0 || n.jy > 0) { n.vy -= 23 * dt; n.jy += n.vy * dt; if (n.jy <= 0) { n.jy = 0; n.vy = 0; } }
    n.x += (n.lane * LANE - n.x) * Math.min(1, dt * 3);
    let tR = 0, tY = 0; if (n.tum > 0) { n.tum = Math.min(1, n.tum + dt / 0.9); tR = -TAU * (1 - Math.pow(1 - n.tum, 2)); tY = Math.sin(Math.PI * n.tum) * 1.3; if (n.tum >= 1) n.tum = 0; }
    const z = -(n.d - G.d), nx = n.x * spreadAt(n.d); n.bc = Math.max(0, n.bc - dt);
    n.m.root.vis = z > -105 && z < 2.6; n.shadow.vis = n.m.root.vis;
    n.m.root.p = [nx, n.jy + tY, z]; n.m.root.r[0] = tR; n.m.root.r[2] = Math.sin(clock * 30) * n.slow * 0.15;
    n.phase += dt * (4 + n.speed * 0.7); animate(n.m, n.phase, n.jy > 0.01 || n.tum > 0, n.speed, clock + n.phase, n.tum > 0);
    n.shadow.p = [nx, 0.05, z + 0.1];
    if (play && n.bc <= 0 && z > -1.8 && z < 0.3 && Math.abs(nx - px) < 1.15 && G.speed > n.speed * 0.9) {
      n.bc = 1;
      if (G.rush > 0 || AN.smash) { n.slow = 1; n.tum = 0.0001; n.lane = clamp(n.lane + (n.x >= G.zx ? 1 : -1), -1, 1); if (n.lane === Math.round(G.zx / LANE)) n.lane = n.lane === 0 ? 1 : 0; sfx.bonk(); setTimeout(() => sfx.boing(), 600); }
      else { G.slow = Math.max(G.slow, 0.4); sfx.bump(); toast(`${n.name} är i vägen – sväng förbi!`, 1300); }
    }
  }
  // apan
  MON.y += (MON.ty - MON.y) * Math.min(1, dt * 4.5);
  let my = MON.y; if (MON.mood > 0 && G.monT > 0) my += Math.abs(Math.sin(clock * 11)) * 0.25;
  monkey.p = [0, my, -10]; monkey.s = [0.8, 0.8, 0.8]; monkey.r = [MON.mood > 0 && G.monT > 1.2 ? -(1.8 - G.monT) * TAU / 0.6 : 0, 0, Math.sin(clock * 1.8) * 0.06];
  mHead.r = [0, MON.mood < 0 && G.monT > 0 ? Math.sin(clock * 18) * 0.35 : Math.sin(clock * 1.3) * 0.12, 0];
  monkey.vis = MON.y < MON.hide - 0.3;
  // partiklar
  for (const p of confetti) { if (p.life <= 0) continue; p.life -= dt; p.v[1] -= 16 * dt; p.p = [p.p[0] + p.v[0] * dt, p.p[1] + p.v[1] * dt, p.p[2] + (p.v[2] + G.speed) * dt]; p.r[0] += dt * 8; p.r[1] += dt * 6; if (p.life <= 0 || p.p[1] < 0) { p.life = 0; p.vis = false; } }
  for (const p of bits) { if (p.life <= 0) continue; p.life -= dt; p.v[1] -= 20 * dt; p.p = [p.p[0] + p.v[0] * dt, p.p[1] + p.v[1] * dt, p.p[2] + (p.v[2] + G.speed * 0.6) * dt]; p.r[0] += dt * 9; if (p.life <= 0 || p.p[1] < 0) { p.life = 0; p.vis = false; } }
  if (play) updHud();
}
function draw(dt) {
  const p = PORTRAIT, k = curv(G.d);
  const target = FOV * (1 + 0.14 * G.ra); curFov += (target - curFov) * Math.min(1, (dt || 0.016) * 6);
  proj = persp(curFov, SW / SH, 0.4, 240);
  const px = G.zx * spreadAt(G.d);
  const eye = [px * 0.45, p ? 6.6 : 6.0, p ? 11 : 8.6], tgt = [px * 0.6, p ? -1.4 : -0.9, -14];
  render(lookAt(eye, tgt));
}
