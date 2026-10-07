/* apan med skylten (hänger framför kameran) */
const monkey = node(null, { cam: true });
const mBody = add(monkey, node((() => {
  const b = mb();
  b.at([0, 7.2, 0]).cyl(0.05, 0.05, 14, 5, C.vine);
  b.at([0, 0, 0], [0, 0, 0], [1, 1.15, 0.9]).sph(0.42, 8, 6, C.mon);
  b.at([0, -0.05, 0.22], [0, 0, 0], [0.75, 0.9, 0.5]).sph(0.32, 8, 6, C.monL);
  b.at([-0.38, -0.34, 0.15], [0.9, 0, 0.5]).cyl(0.08, 0.1, 0.55, 5, C.mon);
  b.at([0.38, -0.34, 0.15], [0.9, 0, -0.5]).cyl(0.08, 0.1, 0.55, 5, C.mon);
  b.at([-0.2, -0.6, 0.05], [0, 0, 0.3]).cyl(0.09, 0.1, 0.5, 5, C.mon);
  b.at([0.2, -0.6, 0.05], [0, 0, -0.3]).cyl(0.09, 0.1, 0.5, 5, C.mon);
  return b.build();
})()));
const mHead = add(monkey, node((() => {
  const b = mb();
  b.at([0, 0, 0]).sph(0.4, 9, 7, C.mon);
  b.at([0, -0.06, 0.24], [0, 0, 0], [1, 0.85, 0.6]).sph(0.3, 9, 6, C.monL);
  b.at([-0.42, 0.04, 0]).sph(0.15, 6, 5, C.monL); b.at([0.42, 0.04, 0]).sph(0.15, 6, 5, C.monL);
  b.at([-0.12, 0.06, 0.4]).sph(0.06, 5, 4, C.zb); b.at([0.12, 0.06, 0.4]).sph(0.06, 5, 4, C.zb);
  b.at([0, -0.16, 0.42], [0, 0, 0], [1, 0.4, 0.4]).sph(0.1, 6, 4, hex(0x6b3a1a));
  return b.build();
})(), { p: [0, 0.68, 0] }));
const mSign = add(monkey, node(mb().at([0, 0, -0.05]).box(1.72, 1.72, 0.08, C.wood).build(), { p: [0, -0.95, 0.38] }));
const mPlate = add(mSign, node(mb().plane(1.6, 1.6).build(), { p: [0, 0, 0.08], tex: null, blend: true, unlit: true, po: true }));
const MON = { y: 20, ty: 20, show: 2, hide: 9, mood: 0, mt: 0 };

/* dekor: akacior, buskar, stenar, gräs, termitstackar */
function decorMesh(kind) {
  const b = mb();
  if (kind === 0) { const h = rnd(2.4, 3.6); b.at([0, h / 2, 0]).cyl(0.12, 0.22, h, 5, C.trunk); b.at([0.5, h * 0.8, 0], [0, 0, -0.7]).cyl(0.06, 0.1, 1.2, 4, C.trunk); b.at([0, h + 0.15, 0], [0, 0, 0], [1, 1, 0.8]).cyl(2.1, 2.4, 0.55, 7, C.leaf, C.leaf2); b.at([0.6, h + 0.45, 0.3]).cyl(1.0, 1.2, 0.35, 6, C.leaf2); }
  else if (kind === 1) { b.at([0, 0.45, 0], [0, 0, 0], [1.3, 0.8, 1.1]).sph(0.75, 6, 4, C.leaf); b.at([0.6, 0.35, 0.2]).sph(0.45, 5, 4, C.leaf2); }
  else if (kind === 2) { b.at([0, 0.25, 0], [0.3, 0.6, 0.2], [1.3, 0.7, 1]).sph(0.55, 5, 3, C.rock); }
  else if (kind === 3) { for (let i = 0; i < 4; i++) b.at([rnd(-.3, .3), 0.3, rnd(-.3, .3)], [rnd(-.3, .3), 0, rnd(-.3, .3)]).cyl(0, 0.08, 0.7, 3, C.leaf2); }
  else { b.at([0, 0.7, 0]).cyl(0.15, 0.6, 1.4, 6, C.mound); b.at([0.35, 0.4, 0]).cyl(0.08, 0.3, 0.8, 5, C.mound); }
  return b.build();
}
const DECOR_MESH = [0, 0, 1, 1, 2, 3, 3, 4].map(k => [k, decorMesh(k)]);
const decor = [];
function placeDecor(d, z) {
  const side = Math.random() < 0.5 ? -1 : 1, near = d.kind === 3 || d.kind === 2;
  d.p = [side * (near ? rnd(3.9, 9) : rnd(5, 28)), 0, z]; d.r = [0, rnd(0, TAU), 0]; const s = rnd(0.8, 1.25); d.s = [s, s, s];
}
for (let i = 0; i < 90; i++) { const [k, m] = DECOR_MESH[i % DECOR_MESH.length]; const d = node(m); d.kind = k; placeDecor(d, rnd(ZFAR, 12)); decor.push(d); }

