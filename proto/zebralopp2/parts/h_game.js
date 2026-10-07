
/* ================= djurmodeller ================= */
const stripePart = (w, h, len, axis, a, bw, p, r) => { const b = mb(); stripes(b, w, h, len, axis, a, bw); const n = node(b.build()); if (p) n.p = p; if (r) n.r = r; return n; };
function stripes(b, w, h, len, axis, a, bw) {
  let pos = -len / 2, i = 0;
  while (pos < len / 2 - 1e-6) {
    const seg = Math.min(i % 2 ? bw : a, len / 2 - pos), col = i % 2 ? C.zb : C.zw;
    if (axis === 'z') b.at([0, 0, pos + seg / 2]).box(w, h, seg, col); else b.at([0, pos + seg / 2, 0]).box(w, seg, h, col);
    pos += seg; i++;
  }
}
const SPEC = {
  buffel: { body: [1.32, 1.05, 2.1], leg: 0.72, legW: 0.27, col: 0x3d322c, dark: 0x231c18, neck: [0.66, 0.6, 0.6], head: [0.64, 0.6, 0.8], horns: 'buffalo', hump: true, tail: 0x231c18 },
  zebra: { body: [0.98, 0.84, 1.9], leg: 0.88, legW: 0.2, col: 0xf8f6ee, dark: 0x2a2a2e, stripes: true, neck: [0.42, 0.95, 0.5], head: [0.48, 0.5, 0.86], mane: 0x2a2a2e, tail: 0x2a2a2e },
  antilop: { body: [0.82, 0.7, 1.7], leg: 1.0, legW: 0.15, col: 0xc9864a, dark: 0x3a2a1e, belly: 0xf6ecdc, neck: [0.32, 0.82, 0.36], head: [0.36, 0.38, 0.7], horns: 'lyre', tail: 0xf6ecdc },
  gasell: { body: [0.72, 0.6, 1.55], leg: 1.06, legW: 0.13, col: 0xdcaa66, dark: 0x2a2a2e, belly: 0xfbf5ea, side: 0x2a2a2e, neck: [0.3, 0.76, 0.34], head: [0.34, 0.36, 0.64], horns: 'straight', tail: 0x2a2a2e },
  vartsvin: { body: [0.96, 0.78, 1.5], leg: 0.46, legW: 0.2, col: 0x7d6b5d, dark: 0x3a2e26, neck: null, head: [0.68, 0.58, 0.78], tusks: true, mane: 0x3a2e26, tail: 0x3a2e26 },
  hyena: { body: [0.86, 0.82, 1.6], leg: 0.8, legW: 0.18, col: 0xc4a272, dark: 0x4a3a2a, spots: 0x5a4630, neck: [0.42, 0.55, 0.46], head: [0.5, 0.48, 0.72], ears: 'round', mane: 0x4a3a2a, tail: 0x4a3a2a }
};
function makeQuad(kind) {
  const o = SPEC[kind], root = node(null), torso = add(root, node(null));
  const [bw, bh, bl] = o.body, Lg = o.leg, by = Lg + bh / 2, col = hex(o.col), dark = hex(o.dark), fz = -bl / 2;
  if (o.stripes) {
    add(torso, stripePart(bw, bh, bl, 'z', 0.2, 0.11, [0, by, 0]));
    const r = mb(); for (let k = 0; k < 3; k++) r.at([0, by - bh * 0.3 + k * 0.24, bl / 2 + 0.005]).box(bw * 0.92 - k * 0.08, 0.07, 0.02, C.zb); add(torso, node(r.build()));
  }
  const b = mb();
  if (!o.stripes) b.at([0, by, 0]).box(bw, bh, bl, col);
  if (o.belly) b.at([0, by - bh * 0.34, 0]).box(bw * 1.03, bh * 0.36, bl * 0.9, hex(o.belly));
  if (o.side) b.at([0, by - bh * 0.1, 0]).box(bw * 1.05, bh * 0.13, bl * 0.82, hex(o.side));
  if (o.spots) { const sp = hex(o.spots); for (let i = 0; i < 9; i++) { const s = i % 2 ? 1 : -1; b.at([s * (bw / 2 + 0.01), by + rnd(-0.25, 0.25) * bh, rnd(-0.42, 0.42) * bl]).box(0.03, 0.14, 0.14, sp); } }
  if (o.hump) b.at([0, by + bh * 0.48, fz + bl * 0.28]).box(bw * 0.92, bh * 0.32, bl * 0.42, col);
  let hy, hz;
  if (o.neck) {
    const [nw, nh, nd] = o.neck, cy = by + bh * 0.28 + nh * 0.32, cz = fz + nd * 0.25;
    if (o.stripes) add(torso, stripePart(nw, nd, nh, 'y', 0.16, 0.09, [0, cy, cz], [-0.55, 0, 0])); else b.at([0, cy, cz], [-0.55, 0, 0]).box(nw, nh, nd, col);
    hy = cy + nh * 0.42; hz = cz - nh * 0.27 - o.head[2] * 0.3;
    if (o.mane) b.at([0, cy + 0.06, cz + 0.05], [-0.55, 0, 0]).box(0.12, nh * 0.85, nd * 1.25, hex(o.mane));
  } else { hy = by + 0.02; hz = fz - o.head[2] * 0.42; if (o.mane) b.at([0, by + bh / 2 + 0.06, 0]).box(0.16, 0.14, bl * 0.8, hex(o.mane)); }
  const [hw, hh, hd] = o.head;
  b.at([0, hy, hz], [-0.2, 0, 0]).box(hw, hh, hd, col);
  b.at([0, hy - hh * 0.18, hz - hd * 0.48], [-0.2, 0, 0]).box(hw * 0.86, hh * 0.62, 0.22, dark);
  if (o.stripes) b.at([0, hy + 0.1, hz], [-0.2, 0, 0]).box(hw * 1.04, 0.08, hd * 0.56, C.zb);
  const ey = hy + hh * 0.5;
  if (o.ears === 'round') { b.at([-hw * 0.38, ey + 0.08, hz + hd * 0.2]).sph(0.12, 6, 4, col); b.at([hw * 0.38, ey + 0.08, hz + hd * 0.2]).sph(0.12, 6, 4, col); }
  else { b.at([-hw * 0.36, ey + 0.12, hz + hd * 0.25], [0.2, 0, -0.35]).cyl(0, 0.09, 0.3, 4, col); b.at([hw * 0.36, ey + 0.12, hz + hd * 0.25], [0.2, 0, 0.35]).cyl(0, 0.09, 0.3, 4, col); }
  if (o.horns === 'buffalo') { const hc = hex(0x9a8f80); for (const s of [-1, 1]) { b.at([s * (hw * 0.55 + 0.2), ey + 0.02, hz + 0.05], [0, 0, s * 0.35]).box(0.62, 0.16, 0.22, hc); b.at([s * (hw * 0.55 + 0.55), ey + 0.22, hz + 0.05], [0, 0, -s * 0.9]).box(0.36, 0.12, 0.16, hc); } b.at([0, ey + 0.02, hz + 0.05]).box(hw * 0.7, 0.14, 0.28, hc); }
  if (o.horns === 'lyre') for (const s of [-1, 1]) { b.at([s * 0.1, ey + 0.32, hz + hd * 0.2], [0.45, 0, s * 0.28]).cyl(0.025, 0.05, 0.7, 4, dark); b.at([s * 0.25, ey + 0.66, hz + hd * 0.38], [-0.3, 0, -s * 0.4]).cyl(0.015, 0.025, 0.3, 4, dark); }
  if (o.horns === 'straight') for (const s of [-1, 1]) b.at([s * 0.08, ey + 0.22, hz + hd * 0.25], [0.55, 0, s * 0.12]).cyl(0.018, 0.04, 0.48, 4, dark);
  if (o.tusks) for (const s of [-1, 1]) b.at([s * hw * 0.42, hy - hh * 0.05, hz - hd * 0.42], [-0.9, 0, s * 0.4]).cyl(0, 0.05, 0.34, 4, hex(0xf3ead6));
  add(torso, node(b.build()));
  const tail = add(torso, node((() => { const t = mb(); t.at([0, -0.28, 0]).box(0.08, 0.56, 0.08, o.stripes ? C.zw : col); t.at([0, -0.6, 0]).box(0.15, 0.2, 0.15, hex(o.tail)); return t.build(); })(), { p: [0, by + bh * 0.3, bl / 2 + 0.02], r: [0.35, 0, 0] }));
  const lx = bw / 2 - o.legW / 2 - 0.02, lz = bl / 2 - 0.26;
  const legs = [[-lx, -lz, 0], [lx, -lz, 1], [-lx, lz, 1], [lx, lz, 0]].map(([x, z, ph]) => {
    const l = mb();
    if (o.stripes) { stripes(l, o.legW, o.legW, Lg, 'y', 0.13, 0.08); l.a = l.a.map((v, i) => (i % 11 === 1 ? v - Lg / 2 : v)); }
    else l.at([0, -Lg / 2, 0]).box(o.legW, Lg, o.legW, col);
    l.at([0, -Lg + 0.04, 0]).box(o.legW * 1.12, 0.1, o.legW * 1.2, dark);
    const n = add(torso, node(l.build(), { p: [x, Lg, z] })); n.ph = ph * Math.PI + (z > 0 ? 0.5 : 0); return n;
  });
  return { root, torso, legs, tail, h: by + bh, kind };
}
function makeOstrich() {
  const root = node(null), torso = add(root, node(null)), b = mb(), blk = hex(0x262426), pink = hex(0xe7b19f), wh = hex(0xf7f3ea);
  b.at([0, 1.95, 0], [0, 0, 0], [1, 0.72, 1.3]).sph(0.62, 8, 6, blk);
  b.at([0, 2.05, 0.75], [0.4, 0, 0], [1.1, 0.7, 0.8]).sph(0.38, 7, 5, wh);
  b.at([-0.6, 2.0, 0.1], [0, 0, 0.3], [0.3, 0.6, 1]).sph(0.45, 6, 4, wh); b.at([0.6, 2.0, 0.1], [0, 0, -0.3], [0.3, 0.6, 1]).sph(0.45, 6, 4, wh);
  b.at([0, 2.85, -0.62], [-0.25, 0, 0]).cyl(0.07, 0.12, 1.5, 5, pink);
  b.at([0, 3.62, -0.82]).sph(0.2, 7, 5, pink); b.at([0, 3.58, -1.06], [Math.PI / 2, 0, 0]).cyl(0, 0.08, 0.22, 4, hex(0xd9934a));
  b.at([-0.08, 3.68, -0.92]).sph(0.04, 4, 3, blk); b.at([0.08, 3.68, -0.92]).sph(0.04, 4, 3, blk);
  add(torso, node(b.build()));
  const legs = [-0.24, 0.24].map((x, i) => { const l = mb(); l.at([0, -0.75, 0]).box(0.13, 1.5, 0.13, pink); l.at([0, -1.5, -0.12]).box(0.2, 0.08, 0.36, pink); const n = add(torso, node(l.build(), { p: [x, 1.55, 0] })); n.ph = i * Math.PI; return n; });
  return { root, torso, legs, tail: null, h: 3.8, kind: 'struts', bird: true };
}
const ANIMALS = {
  buffel: { name: 'Buffeln', speed: 8.5, jump: 0, dbl: false, smash: true, react: 6.5, lane: 7, desc: 'Långsam · krossar hinder', f: 1 },
  zebra: { name: 'Zebran', speed: 10.5, jump: 7.6, dbl: false, smash: false, react: 5.6, lane: 9, desc: 'Lagom · hoppar', f: 2 },
  antilop: { name: 'Antilopen', speed: 12.8, jump: 7.8, dbl: true, smash: false, react: 4.9, lane: 10, desc: 'Snabb · dubbelhopp', f: 3 },
  gasell: { name: 'Gasellen', speed: 15.2, jump: 8.6, dbl: false, smash: false, react: 4.3, lane: 12, desc: 'Snabbast · långa hopp', f: 4 }
};
const MODELS = {}; for (const k of Object.keys(ANIMALS)) MODELS[k] = makeQuad(k);
let ME = MODELS[S.animal] || MODELS.zebra, AN = ANIMALS[S.animal] || ANIMALS.zebra;
function setAnimal(k) { S.animal = k; ME = MODELS[k]; AN = ANIMALS[k]; }
const zshadow = node(mb().plane(1.9, 2.8).build(), { tex: SHADOW, blend: true, unlit: true, nodepth: true, po: true, r: [-Math.PI / 2, 0, 0], p: [0, 0.05, 0] });

/* motståndare */
const NPCS = [
  { id: 'vartsvin', name: 'Vårtsvinet', m: makeQuad('vartsvin'), acc: 0.55, f: 0.98 },
  { id: 'struts', name: 'Strutsen', m: makeOstrich(), acc: 0.45, f: 1.05 },
  { id: 'hyena', name: 'Hyenan', m: makeQuad('hyena'), acc: 0.72, f: 1.0 }
];
for (const n of NPCS) n.shadow = node(zshadow.mesh, { tex: SHADOW, blend: true, unlit: true, nodepth: true, po: true, r: [-Math.PI / 2, 0, 0] });

/* ================= hinder ================= */
const ROCK = mb().at([0, 0.42, 0], [0.3, 0.7, 0.1], [1.35, 0.9, 1.1]).sph(0.62, 6, 4, hex(0x9d988e)).at([0.5, 0.25, 0.3], [0, 1, 0]).sph(0.32, 5, 3, hex(0x8c877d)).build();
function waterMesh(depth, col) {
  const b = mb(), c = hex(col), foam = hex(0xe8f6fb);
  for (let x = -44; x < 44; x += 4) {
    b.quad([x, 0, depth / 2], [x + 4, 0, depth / 2], [x + 4, 0, -depth / 2], [x, 0, -depth / 2], c, [0, -1, 0]);
    for (const s of [-1, 1]) { const z = s * depth / 2; b.quad([x, 0.01, z], [x + 4, 0.01, z], [x + 4, 0.01, z - s * 0.22], [x, 0.01, z - s * 0.22], foam, [0, -1, 0]); }
  }
  for (let i = 0; i < 10; i++) b.at([rnd(-3, 3), 0.02, rnd(-depth / 2 + 0.4, depth / 2 - 0.4)], [0, rnd(0, 3), 0]).box(rnd(0.3, 0.8), 0.01, 0.06, hex(0xbfe6f6));
  return b.build();
}
const STREAM = waterMesh(1.9, 0x4fb3e8), RIVER = waterMesh(4.6, 0x3d9fd8);
const MUD = (() => { const b = mb(), c = hex(0x7a5434), c2 = hex(0x8e6644); b.at([0, 0.01, 0]).cyl(1.0, 1.0, 0.02, 9, c); b.at([0, 0.012, 0], [0, 0, 0], [1, 1, 1.9]).cyl(0.9, 0.9, 0.02, 9, c); b.at([0.3, 0.02, 0.4]).cyl(0.25, 0.25, 0.02, 6, c2); b.at([-0.25, 0.02, -0.6]).cyl(0.18, 0.18, 0.02, 6, c2); return b.build(); })();
const BRANCH = (() => { const b = mb(); b.at([0, 2.05, 0]).box(2.4, 0.24, 0.26, C.trunk); for (let i = 0; i < 5; i++) b.at([-1 + i * 0.5, 2.2 + rnd(0, .15), rnd(-.15, .15)]).sph(rnd(0.28, 0.4), 6, 4, i % 2 ? C.leaf : C.leaf2); b.at([1.35, 1.0, 0]).cyl(0.14, 0.2, 2.2, 5, C.trunk); b.at([1.35, 2.3, 0]).sph(0.55, 6, 4, C.leaf); return b.build(); })();
const BANANA = mb().torus(0.32, 0.085, 2.2, 7, 5, C.ban, C.banT).build();
const LOG = mb().at([0, 0.34, 0], [0, 0, Math.PI / 2]).cyl(0.34, 0.34, 1.75, 8, C.log, C.logE).build();
const GATE = (() => { const b = mb(); b.at([-0.92, 1.55, 0]).box(0.2, 3.1, 0.2, C.wood); b.at([0.92, 1.55, 0]).box(0.2, 3.1, 0.2, C.wood); b.at([0, 3.08, 0]).box(2.1, 0.24, 0.26, C.wood2); b.at([-0.92, 3.3, 0]).sph(0.26, 6, 4, C.leaf2); b.at([0.92, 3.3, 0]).sph(0.26, 6, 4, C.leaf2); b.at([0, 3.18, -0.12]).box(0.08, 0.6, 0.08, C.wood); return b.build(); })();
const PLATE = mb().plane(1.55, 1.55).build();
const PLATE_BACK = mb().at([0, 0, -0.03]).box(1.68, 1.68, 0.06, C.wood2).build();
const ARCH = (() => { const b = mb(); b.at([-3.7, 2.1, 0]).box(0.32, 4.2, 0.32, hex(0xffffff)); b.at([3.7, 2.1, 0]).box(0.32, 4.2, 0.32, hex(0xffffff)); return b.build(); })();
const BANNER = mb().plane(7.6, 1.9).build();
const ents = [];
const DEBRIS_COL = [0x9a6234, 0x7d5130, 0x9d988e, 0x6db246].map(hex), DROP_COL = [0x9fdcf6, 0xd7f1fb, 0x5fbbe9].map(hex);
const bits = Array.from({ length: 36 }, (_, i) => { const n = node(mb().box(0.18, 0.18, 0.18, i < 18 ? DEBRIS_COL[i % 4] : DROP_COL[i % 3]).build(), { vis: false }); n.v = [0, 0, 0]; n.life = 0; n.water = i >= 18; return n; });
function spray(x, y, water, n) {
  let c = 0;
  for (const p of bits) { if (p.life > 0 || p.water !== water) continue; p.vis = true; p.life = rnd(0.5, 0.9); p.p = [x + rnd(-.5, .5), y, rnd(-.4, .4)]; p.v = [rnd(-3.5, 3.5), rnd(3, 7), rnd(-2, 3)]; if (++c >= n) break; }
}

/* ================= kamera och rendering ================= */
let W = 1, H = 1, SW = 1, SH = 1, VF = 0.9, PORTRAIT = false, proj = I4, FOV = 1, curFov = 1;
const U = { bend: 0.0026, bendX: 0.0016, curve: 0 };
function layout() {
  W = innerWidth; H = innerHeight; PORTRAIT = H > W;
  const tilt = S.ctrl === 'tilt' && G.state !== 'menu';
  SW = tilt ? Math.ceil(Math.hypot(W, H)) : W; SH = tilt ? SW : H;
  Object.assign(stage.style, { width: SW + 'px', height: SH + 'px', left: (W - SW) / 2 + 'px', top: (H - SH) / 2 + 'px' });
  if (!tilt) stage.style.transform = '';
  const pr = Math.min(window.devicePixelRatio || 1, Math.sqrt(2.6e6 / (SW * SH)));
  cv.width = Math.round(SW * pr); cv.height = Math.round(SH * pr);
  gl.viewport(0, 0, cv.width, cv.height);
  VF = (PORTRAIT ? 66 : 52) * Math.PI / 180;
  FOV = 2 * Math.atan(Math.tan(VF / 2) * SH / H);
  MON.show = 10 * Math.tan(VF / 2) - 1.3; MON.hide = MON.show + 8;
  if (MON.ty > MON.show + 1) MON.ty = MON.hide;
  checkOrient();
}
function collect(n, parent, out) {
  if (!n.vis) return;
  const w = mul(parent, trs(n.p, n.r, n.s));
  if (n.mesh) out.push([n, w]);
  for (const k of n.kids) collect(k, w, out);
}
function drawItem(n, w, view) {
  gl.uniformMatrix4fv(L.uM, false, w); gl.uniformMatrix4fv(L.uV, false, view);
  gl.uniform3fv(L.uTint, n.tint); gl.uniform1f(L.uA, n.alpha); gl.uniform1f(L.uUnlit, n.unlit ? 1 : 0);
  gl.uniform2fv(L.uUVo, n.uvo || [0, 0]);
  gl.uniform1f(L.uUseT, n.tex ? 1 : 0); gl.bindTexture(gl.TEXTURE_2D, n.tex || WHITE);
  gl.bindBuffer(gl.ARRAY_BUFFER, n.mesh.b);
  gl.vertexAttribPointer(A.aP, 3, gl.FLOAT, false, 44, 0); gl.vertexAttribPointer(A.aN, 3, gl.FLOAT, false, 44, 12);
  gl.vertexAttribPointer(A.aC, 3, gl.FLOAT, false, 44, 24); gl.vertexAttribPointer(A.aU, 2, gl.FLOAT, false, 44, 36);
  if (n.po) { gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-2, -4); }
  gl.drawArrays(gl.TRIANGLES, 0, n.mesh.n);
  if (n.po) gl.disable(gl.POLYGON_OFFSET_FILL);
}
function render(view) {
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.uniformMatrix4fv(L.uPr, false, proj);
  const world = [], cam = [], flat = [], late = [];
  collect(ground, I4, world); collect(path, I4, world);
  for (const e of ents) if (e.flat) collect(e.node, I4, flat);       // vatten och lera: rakt på marken, före allt annat
  for (const d of decor) collect(d, I4, world);
  for (const e of ents) if (!e.flat) collect(e.node, I4, world);
  collect(ME.root, I4, world);
  if (G.state !== 'menu') for (const n of NPCS) { collect(n.m.root, I4, world); collect(n.shadow, I4, world); }
  for (const p of confetti) collect(p, I4, world); for (const p of bits) collect(p, I4, world);
  collect(zshadow, I4, world);
  collect(monkey, I4, cam);
  gl.uniform1f(L.uBend, U.bend); gl.uniform1f(L.uBendX, U.bendX); gl.uniform1f(L.uCurve, U.curve);
  // marken först, sedan platta saker med offset, sedan resten
  let i = 0;
  for (; i < world.length && (world[i][0] === ground || world[i][0] === path); i++) drawItem(world[i][0], world[i][1], view);
  gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-3, -6);
  for (const [n, w] of flat) drawItem(n, w, view);
  gl.disable(gl.POLYGON_OFFSET_FILL);
  for (; i < world.length; i++) { const [n, w] = world[i]; if (n.blend) late.push([n, w, view]); else drawItem(n, w, view); }
  for (const [n, w] of cam) { if (n.blend) late.push([n, w, I4]); else drawItem(n, w, I4); }
  for (const it of late) { const v = it[2], w = it[1]; it[3] = v[2] * w[12] + v[6] * w[13] + v[10] * w[14] + v[14]; }
  late.sort((a, b) => a[3] - b[3]);
  gl.enable(gl.BLEND);
  for (const [n, w, v] of late) { gl.depthMask(!n.nodepth); drawItem(n, w, v); }
  gl.depthMask(true); gl.disable(gl.BLEND);
}
