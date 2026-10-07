/* ================= WebGL-motor (liten, egen) ================= */
const cv = $('#gl'), stage = $('#stage');
const gl = cv.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false }) || cv.getContext('experimental-webgl');
if (!gl) { $('#menu').innerHTML = '<div class="card"><h1>Zebraloppet 3</h1><p class="sub">Den här enheten kan tyvärr inte visa 3D-grafik (WebGL).</p></div>'; return; }

const VS = `precision highp float;
attribute vec3 aP; attribute vec3 aN; attribute vec3 aC; attribute vec2 aU;
uniform mat4 uM; uniform mat4 uV; uniform mat4 uPr;
uniform float uBend; uniform float uBendX; uniform float uCurve; uniform float uFogN; uniform float uFogF;
uniform vec3 uTint; uniform vec2 uUVo;
uniform float uD; uniform float uWorld; uniform float uPitch;
uniform vec3 uXA; uniform vec3 uXF; uniform vec3 uXP; uniform vec3 uYA; uniform vec3 uYF; uniform vec3 uYP;
varying vec3 vC; varying vec2 vU; varying float vF; varying float vL;
float tr(vec3 A, vec3 F, vec3 P, float s){ return dot(A, sin(F * s + P)); }
float trd(vec3 A, vec3 F, vec3 P, float s){ return dot(A * F, cos(F * s + P)); }
void main(){
  vec4 w = uM * vec4(aP, 1.0);
  if (uWorld > 0.5) {
    float a = -w.z, s = uD + a;
    w.x += tr(uXA, uXF, uXP, s) - tr(uXA, uXF, uXP, uD) - trd(uXA, uXF, uXP, uD) * a;
    w.y += tr(uYA, uYF, uYP, s) - tr(uYA, uYF, uYP, uD) - uPitch * trd(uYA, uYF, uYP, uD) * a;
  }
  vec4 v = uV * w;
  float dz = min(0.0, v.z + 5.0);
  v.y -= uBend * dz * dz + uBendX * v.x * v.x;
  v.x += uCurve * dz * dz;
  gl_Position = uPr * v;
  vec3 n = normalize(mat3(uM[0].xyz, uM[1].xyz, uM[2].xyz) * aN);
  vL = 0.60 + 0.20 * n.y + 0.40 * max(dot(n, normalize(vec3(-0.45, 0.85, 0.55))), 0.0);
  vC = aC * uTint; vU = aU + uUVo;
  vF = clamp((-v.z - uFogN) / (uFogF - uFogN), 0.0, 1.0);
}`;
const FS = `precision mediump float;
varying vec3 vC; varying vec2 vU; varying float vF; varying float vL;
uniform sampler2D uT; uniform float uUseT; uniform float uUnlit; uniform float uA; uniform vec3 uFogC;
void main(){
  vec4 c = vec4(vC, 1.0);
  if (uUseT > 0.5) c *= texture2D(uT, vU);
  if (c.a < 0.03) discard;
  float L = uUnlit > 0.5 ? 1.0 : vL;
  gl_FragColor = vec4(mix(c.rgb * L, uFogC, vF), c.a * uA);
}`;
function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
const prog = gl.createProgram();
gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
gl.useProgram(prog);
const A = {}, L = {};
['aP', 'aN', 'aC', 'aU'].forEach(n => { A[n] = gl.getAttribLocation(prog, n); gl.enableVertexAttribArray(A[n]); });
['uM', 'uV', 'uPr', 'uBend', 'uBendX', 'uCurve', 'uD', 'uWorld', 'uPitch', 'uXA', 'uXF', 'uXP', 'uYA', 'uYF', 'uYP', 'uFogN', 'uFogF', 'uTint', 'uUVo', 'uT', 'uUseT', 'uUnlit', 'uA', 'uFogC'].forEach(n => L[n] = gl.getUniformLocation(prog, n));
gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.uniform1i(L.uT, 0);
gl.uniform3f(L.uFogC, 0.83, 0.94, 0.98);
gl.uniform1f(L.uFogN, 34); gl.uniform1f(L.uFogF, 80);
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

/* matematik (kolumnvisa 4x4) */
function mul(a, b) { const o = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; }
function trs(p, r, s) {
  const cx = Math.cos(r[0]), sx = Math.sin(r[0]), cy = Math.cos(r[1]), sy = Math.sin(r[1]), cz = Math.cos(r[2]), sz = Math.sin(r[2]);
  const m = new Float32Array(16);
  m[0] = (cy * cz + sy * sx * sz) * s[0]; m[1] = cx * sz * s[0]; m[2] = (-sy * cz + cy * sx * sz) * s[0];
  m[4] = (-cy * sz + sy * sx * cz) * s[1]; m[5] = cx * cz * s[1]; m[6] = (sy * sz + cy * sx * cz) * s[1];
  m[8] = sy * cx * s[2]; m[9] = -sx * s[2]; m[10] = cy * cx * s[2];
  m[12] = p[0]; m[13] = p[1]; m[14] = p[2]; m[15] = 1; return m;
}
function persp(f, a, n, fa) { const t = 1 / Math.tan(f / 2), r = new Float32Array(16); r[0] = t / a; r[5] = t; r[10] = (fa + n) / (n - fa); r[11] = -1; r[14] = 2 * fa * n / (n - fa); return r; }
function lookAt(e, c) {
  let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2], l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
  let xx = zz, xy = 0, xz = -zx; l = Math.hypot(xx, xy, xz); xx /= l; xz /= l;           // up = (0,1,0)
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0, -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1]);
}
const I4 = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
const hex = h => [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255];

/* geometribyggare: platta, facetterade former med färg per hörn */
class MB {
  constructor() { this.a = []; this.m = null; }
  at(p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) { this.m = trs(p, r, s); return this; }
  tp(v) { const m = this.m; if (!m) return v; return [m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12], m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13], m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]]; }
  tri(p0, p1, p2, c, ref, u0 = [0, 0], u1 = [0, 0], u2 = [0, 0]) {
    p0 = this.tp(p0); p1 = this.tp(p1); p2 = this.tp(p2); ref = this.tp(ref);
    const ax = p1[0] - p0[0], ay = p1[1] - p0[1], az = p1[2] - p0[2], bx = p2[0] - p0[0], by = p2[1] - p0[1], bz = p2[2] - p0[2];
    let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const qx = (p0[0] + p1[0] + p2[0]) / 3 - ref[0], qy = (p0[1] + p1[1] + p2[1]) / 3 - ref[1], qz = (p0[2] + p1[2] + p2[2]) / 3 - ref[2];
    if (nx * qx + ny * qy + nz * qz < 0) { nx = -nx; ny = -ny; nz = -nz; }
    for (const [p, u] of [[p0, u0], [p1, u1], [p2, u2]]) this.a.push(p[0], p[1], p[2], nx, ny, nz, c[0], c[1], c[2], u[0], u[1]);
  }
  quad(a, b, c, d, col, ref, uv) { uv = uv || [[0, 0], [1, 0], [1, 1], [0, 1]]; this.tri(a, b, c, col, ref, uv[0], uv[1], uv[2]); this.tri(a, c, d, col, ref, uv[0], uv[2], uv[3]); }
  box(w, h, d, col) {
    const x = w / 2, y = h / 2, z = d / 2, P = [[-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z], [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]];
    [[0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7], [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0]].forEach(f => this.quad(P[f[0]], P[f[1]], P[f[2]], P[f[3]], col, [0, 0, 0])); return this;
  }
  cyl(rt, rb, h, seg, col, cap) {
    const y = h / 2, cc = cap || col;
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * TAU, a1 = (i + 1) / seg * TAU;
      const t0 = [Math.cos(a0) * rt, y, Math.sin(a0) * rt], t1 = [Math.cos(a1) * rt, y, Math.sin(a1) * rt], b0 = [Math.cos(a0) * rb, -y, Math.sin(a0) * rb], b1 = [Math.cos(a1) * rb, -y, Math.sin(a1) * rb];
      if (rt === 0) this.tri(b0, b1, t0, col, [0, 0, 0]); else this.quad(b0, b1, t1, t0, col, [0, 0, 0]);
      if (rt > 0) this.tri([0, y, 0], t0, t1, cc, [0, -1e3, 0]);
      if (rb > 0) this.tri([0, -y, 0], b1, b0, cc, [0, 1e3, 0]);
    }
    return this;
  }
  sph(r, sw, shh, col) {
    const P = (v, a) => [Math.sin(v) * Math.cos(a) * r, Math.cos(v) * r, Math.sin(v) * Math.sin(a) * r];
    for (let j = 0; j < shh; j++) for (let i = 0; i < sw; i++) {
      const v0 = j / shh * Math.PI, v1 = (j + 1) / shh * Math.PI, a0 = i / sw * TAU, a1 = (i + 1) / sw * TAU;
      const p00 = P(v0, a0), p01 = P(v0, a1), p10 = P(v1, a0), p11 = P(v1, a1);
      if (j === 0) this.tri(p00, p10, p11, col, [0, 0, 0]); else if (j === shh - 1) this.tri(p00, p10, p01, col, [0, 0, 0]); else this.quad(p00, p10, p11, p01, col, [0, 0, 0]);
    }
    return this;
  }
  torus(R, r, arc, sa, sb, col, tip) {
    for (let i = 0; i < sa; i++) {
      const a0 = i / sa * arc, a1 = (i + 1) / sa * arc, c = (tip && (i === 0 || i === sa - 1)) ? tip : col;
      const ctr = [Math.cos((a0 + a1) / 2) * R, Math.sin((a0 + a1) / 2) * R, 0];
      for (let j = 0; j < sb; j++) {
        const b0 = j / sb * TAU, b1 = (j + 1) / sb * TAU;
        const P = (a, b) => [Math.cos(a) * (R + r * Math.cos(b)), Math.sin(a) * (R + r * Math.cos(b)), r * Math.sin(b)];
        this.quad(P(a0, b0), P(a1, b0), P(a1, b1), P(a0, b1), c, ctr);
      }
    }
    return this;
  }
  plane(w, h, col) { const x = w / 2, y = h / 2; this.quad([-x, -y, 0], [x, -y, 0], [x, y, 0], [-x, y, 0], col || [1, 1, 1], [0, 0, -1]); return this; }
  build() { const f = new Float32Array(this.a), b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, f, gl.STATIC_DRAW); return { b, n: f.length / 11 }; }
}
const mb = () => new MB();
function node(mesh, o) { return Object.assign({ mesh, p: [0, 0, 0], r: [0, 0, 0], s: [1, 1, 1], kids: [], vis: true, tint: [1, 1, 1], tex: null, blend: false, unlit: false, alpha: 1, uvo: null, nodepth: false }, o || {}); }
function add(parent, child) { parent.kids.push(child); return child; }

/* texturer */
function texFrom(canvas, repeat) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const w = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, w); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, w);
  const ext = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
  if (ext) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
  return t;
}
function canvasTex(w, h, draw, repeat) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return texFrom(c, repeat); }
const WHITE = canvasTex(4, 4, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 4, 4); });
const GRASS = canvasTex(64, 64, (g, w, h) => {
  g.fillStyle = '#93c653'; g.fillRect(0, 0, w, h); g.fillStyle = '#86bb48'; g.fillRect(0, 0, w, h / 2);
  for (let i = 0; i < 90; i++) { g.fillStyle = ['#a3d260', '#7aad3d', '#9ccc5a'][i % 3]; g.fillRect(Math.random() * w, Math.random() * h, 2, 3); }
}, true);
const SAND = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#e9cd92'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) { g.fillStyle = ['#dcbd7f', '#f2dca9', '#d6b273'][i % 3]; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, Math.random() * 1.8 + .6, 0, TAU); g.fill(); }
  g.fillStyle = '#f7e6bf'; for (const x of [w / 3, 2 * w / 3]) g.fillRect(x - 2, 8, 4, h / 2 - 16);
  g.fillStyle = '#c99f5d'; g.fillRect(0, 0, 5, h); g.fillRect(w - 5, 0, 5, h);
  g.fillStyle = '#78a83c'; g.fillRect(0, 0, 2, h); g.fillRect(w - 2, 0, 2, h);
}, true);
const SHADOW = canvasTex(64, 64, (g, w) => { const r = g.createRadialGradient(32, 32, 2, 32, 32, 30); r.addColorStop(0, 'rgba(40,50,20,.45)'); r.addColorStop(1, 'rgba(40,50,20,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
const FINISH = canvasTex(256, 64, (g, w, h) => {
  g.fillStyle = '#ef4444'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < 32; x++) for (let y = 0; y < 2; y++) { g.fillStyle = (x + y) % 2 ? '#222' : '#fff'; g.fillRect(x * 8, y * 6, 8, 6); g.fillRect(x * 8, h - 12 + y * 6, 8, 6); }
  g.fillStyle = '#fff'; g.font = '800 34px "Baloo 2", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MÅL', w / 2, h / 2 + 2);
});

/* skyltar */
const SHAPES = [{ id: 'circle', n: 'cirkeln' }, { id: 'tri', n: 'triangeln' }, { id: 'square', n: 'fyrkanten' }, { id: 'star', n: 'stjärnan' }, { id: 'heart', n: 'hjärtat' }];
const symCache = {};
function symTex(sp) {
  const key = sp.t + ':' + sp.v;
  if (symCache[key]) return symCache[key];
  return symCache[key] = canvasTex(256, 256, (g, w) => {
    const rr = (x, y, ww, hh, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + ww, y, x + ww, y + hh, r); g.arcTo(x + ww, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + ww, y, r); g.closePath(); };
    rr(6, 6, w - 12, w - 12, 40); g.fillStyle = '#fffdf5'; g.fill(); g.lineWidth = 12; g.strokeStyle = '#f2b84b'; g.stroke();
    const c = w / 2; g.fillStyle = '#7c4dff'; g.strokeStyle = '#5b2fd6'; g.lineWidth = 6; g.lineJoin = 'round';
    if (sp.t === 'shape') {
      g.beginPath();
      if (sp.v === 'circle') g.arc(c, c, 74, 0, TAU);
      else if (sp.v === 'square') g.rect(c - 68, c - 68, 136, 136);
      else if (sp.v === 'tri') { g.moveTo(c, c - 80); g.lineTo(c + 84, c + 66); g.lineTo(c - 84, c + 66); g.closePath(); }
      else if (sp.v === 'star') { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 36 : 86; g.lineTo(c + Math.cos(a) * r, c + 6 + Math.sin(a) * r); } g.closePath(); }
      else if (sp.v === 'heart') { g.moveTo(c, c + 74); g.bezierCurveTo(c - 110, c, c - 70, c - 92, c, c - 40); g.bezierCurveTo(c + 70, c - 92, c + 110, c, c, c + 74); }
      g.fill(); g.stroke();
    } else if (sp.t === 'dots') {
      const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]], 7: [[-1, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [1, 1]] }[sp.v];
      g.fillStyle = '#e8553f'; for (const [x, y] of P) { g.beginPath(); g.arc(c + x * 58, c + y * 58, 25, 0, TAU); g.fill(); }
    } else {
      g.fillStyle = '#2b3a42'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `800 ${sp.t === 'text' ? 118 : 190}px "Baloo 2", system-ui, sans-serif`;
      g.fillText(String(sp.v), c, c + (sp.t === 'text' ? 12 : 18));
    }
  });
}

/* ================= världen ================= */
const C = {
  zw: hex(0xf8f6ee), zb: hex(0x2a2a2e), wood: hex(0xb7793f), wood2: hex(0xe0a356), leaf: hex(0x4f9a3a), leaf2: hex(0x6db246), trunk: hex(0x8a5a32),
  rock: hex(0xa7a39a), mon: hex(0x8b5a2b), monL: hex(0xe9c79d), vine: hex(0x4c8a2c), ban: hex(0xffd23f), banT: hex(0x6b4a1a), log: hex(0x9a6234), logE: hex(0xe6c48b), mound: hex(0xc58a52)
};
const LANE = 2.0, WORLD_L = 242, ZFAR = -230, GW = 80;
function grid(w, l, nx, nz, us, vs, y, col, x0w, b) {
  b = b || mb(); if (x0w == null) x0w = -w / 2;
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const x0 = x0w + i * w / nx, x1 = x0 + w / nx, z0 = 12 - j * l / nz, z1 = z0 - l / nz;
    b.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], col, [0, y - 1, 0], [[x0 / us, -z0 / vs], [x1 / us, -z0 / vs], [x1 / us, -z1 / vs], [x0 / us, -z1 / vs]]);
  }
  return b;
}
const PATH_HW = 3.3;
const ground = node((() => { const b = grid(GW - PATH_HW, WORLD_L, 12, 120, 6, 6, 0, [1, 1, 1], -GW); grid(GW - PATH_HW, WORLD_L, 12, 120, 6, 6, 0, [1, 1, 1], PATH_HW, b); return b.build(); })(), { tex: GRASS, uvo: [0, 0] });
const path = node(grid(PATH_HW * 2, WORLD_L, 2, 120, PATH_HW * 2, 6, 0, [1, 1, 1]).build(), { tex: SAND, uvo: [0, 0] });
// stigens uv börjar vid x=-3.3 => förskjut u
path.uvo = [0.5, 0];

