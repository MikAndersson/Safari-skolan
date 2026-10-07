/* konfetti */
const CONF_COL = [0xef4444, 0xf59e0b, 0x22c55e, 0x3b82f6, 0xa855f7, 0xffd23f].map(hex);
const confetti = Array.from({ length: 48 }, (_, i) => { const n = node(mb().box(0.16, 0.16, 0.04, CONF_COL[i % 6]).build(), { vis: false, unlit: true }); n.v = [0, 0, 0]; n.life = 0; return n; });
function burst(x, y, z, n) {
  let c = 0;
  for (const p of confetti) { if (p.life > 0) continue; p.vis = true; p.life = rnd(0.8, 1.3); p.p = [x + rnd(-.4, .4), y, z + rnd(-.4, .4)]; p.v = [rnd(-4, 4), rnd(4, 9), rnd(-3, 2)]; p.r = [rnd(0, 6), rnd(0, 6), 0]; if (++c >= n) break; }
}

