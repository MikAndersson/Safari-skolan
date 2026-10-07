/* Djurkompisarna – ritade bilder (SVG som strängar). Inga beroenden. */
(function (App) {
  'use strict';
  const art = (App.art = {});
  let uid = 0;

  const TOK = { red: '#E4574F', blue: '#3D84E8', yellow: '#FFC93C', green: '#3FA66B', purple: '#8E6CC9', orange: '#F28F3B' };
  art.TOK = TOK;
  const INK = '#26324A';

  art.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- former, föremål, mängder ---------- */
  art.shape = function (kind, col, cls) {
    const c = TOK[col] || col;
    let body = '';
    if (kind === 'circle') body = `<circle cx="50" cy="50" r="40" fill="${c}"/>`;
    else if (kind === 'square') body = `<rect x="14" y="14" width="72" height="72" rx="10" fill="${c}"/>`;
    else if (kind === 'triangle') body = `<path d="M50 14 L88 84 L12 84 Z" fill="${c}" stroke="${c}" stroke-width="10" stroke-linejoin="round"/>`;
    else body = `<rect x="6" y="26" width="88" height="48" rx="10" fill="${c}"/>`;
    return `<svg class="shape ${cls || ''}" viewBox="0 0 100 100" aria-hidden="true">${body}</svg>`;
  };

  art.log = function () {
    return '<svg class="obj log" viewBox="0 0 100 70" aria-hidden="true">' +
      '<rect x="6" y="14" width="72" height="44" rx="14" fill="#A9713F" stroke="#7A4B27" stroke-width="3"/>' +
      '<path d="M20 30h40M24 42h34" stroke="#8A5A31" stroke-width="3" stroke-linecap="round"/>' +
      '<ellipse cx="78" cy="36" rx="13" ry="22" fill="#E2B27A" stroke="#7A4B27" stroke-width="3"/>' +
      '<ellipse cx="78" cy="36" rx="7" ry="13" fill="none" stroke="#B9854F" stroke-width="3"/>' +
      '<circle cx="78" cy="36" r="2.5" fill="#B9854F"/></svg>';
  };

  art.emo = (e) => `<span class="obj emo">${e}</span>`;

  art.group = function (n, objHtml, opt) {
    opt = opt || {};
    const cross = opt.cross || 0;
    let s = '';
    for (let i = 0; i < n; i++) s += `<span class="g${i >= n - cross ? ' gone' : ''}">${objHtml}</span>`;
    const style = opt.cols ? ` style="--cols:${opt.cols}"` : '';
    return `<span class="grp${opt.cols ? ' cols' : ''}"${style}>${s}</span>`;
  };

  const PIPS = {
    1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[28, 28], [50, 50], [72, 72]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
    6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]],
  };
  art.dice = function (n) {
    const pips = (PIPS[n] || []).map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="9" fill="${INK}"/>`).join('');
    return `<svg class="dice" viewBox="0 0 100 100" aria-hidden="true"><rect x="6" y="6" width="88" height="88" rx="18" fill="#fff" stroke="${INK}" stroke-width="5"/>${pips}</svg>`;
  };

  art.tenFrame = function (n, col) {
    let s = '';
    for (let i = 0; i < 10; i++) {
      const x = 4 + (i % 5) * 38, y = 4 + Math.floor(i / 5) * 38;
      s += `<rect x="${x}" y="${y}" width="36" height="36" fill="#fff" stroke="${INK}" stroke-width="3"/>`;
      if (i < n) s += `<circle cx="${x + 18}" cy="${y + 18}" r="13" fill="${col || TOK.blue}"/>`;
    }
    return `<svg class="tenframe" viewBox="0 0 198 82" aria-hidden="true">${s}</svg>`;
  };

  art.clock = function (h, m) {
    const hourA = ((h % 12) + m / 60) * 30, minA = m * 6;
    let nums = '', ticks = '';
    for (let i = 1; i <= 12; i++) {
      const a = (i * 30 - 90) * Math.PI / 180;
      nums += `<text x="${(100 + Math.cos(a) * 72).toFixed(1)}" y="${(100 + Math.sin(a) * 72 + 8).toFixed(1)}" text-anchor="middle" font-size="24" font-weight="700" fill="${INK}" font-family="Fredoka,Trebuchet MS,sans-serif">${i}</text>`;
    }
    for (let i = 0; i < 60; i++) {
      const a = (i * 6 - 90) * Math.PI / 180, r1 = i % 5 ? 90 : 86;
      ticks += `<line x1="${(100 + Math.cos(a) * r1).toFixed(1)}" y1="${(100 + Math.sin(a) * r1).toFixed(1)}" x2="${(100 + Math.cos(a) * 94).toFixed(1)}" y2="${(100 + Math.sin(a) * 94).toFixed(1)}" stroke="${INK}" stroke-width="${i % 5 ? 1 : 2.5}"/>`;
    }
    return `<svg class="clock" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96" fill="#fff" stroke="${INK}" stroke-width="6"/>${ticks}${nums}` +
      `<line x1="100" y1="100" x2="100" y2="54" stroke="${INK}" stroke-width="10" stroke-linecap="round" transform="rotate(${hourA} 100 100)"/>` +
      `<line x1="100" y1="100" x2="100" y2="30" stroke="${TOK.red}" stroke-width="6" stroke-linecap="round" transform="rotate(${minA} 100 100)"/>` +
      `<circle cx="100" cy="100" r="7" fill="${INK}"/></svg>`;
  };

  art.coin = function (v) {
    const gold = v === 10, f = gold ? '#E9C46A' : '#D5DBE5', s = gold ? '#B58A1B' : '#8D98AA';
    return `<svg class="coin" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="${f}" stroke="${s}" stroke-width="5"/>` +
      `<circle cx="50" cy="50" r="37" fill="none" stroke="${s}" stroke-width="2" opacity=".6"/>` +
      `<text x="50" y="58" text-anchor="middle" font-size="${v >= 10 ? 34 : 40}" font-weight="700" fill="${INK}" font-family="Fredoka,Trebuchet MS,sans-serif">${v}</text>` +
      `<text x="50" y="80" text-anchor="middle" font-size="15" font-weight="700" fill="${INK}" font-family="Fredoka,Trebuchet MS,sans-serif">kr</text></svg>`;
  };

  art.blocks = function (t, o) {
    const tw = 18, gap = 8;
    let x = 4, s = '';
    for (let i = 0; i < t; i++) {
      s += `<rect x="${x}" y="4" width="${tw}" height="100" rx="3" fill="${TOK.blue}" stroke="${INK}" stroke-width="2"/>`;
      for (let k = 1; k < 10; k++) s += `<line x1="${x}" x2="${x + tw}" y1="${4 + k * 10}" y2="${4 + k * 10}" stroke="${INK}" stroke-width="1" opacity=".45"/>`;
      x += tw + gap;
    }
    const sx = x + (t ? 14 : 0);
    for (let i = 0; i < o; i++) {
      s += `<rect x="${sx + (i % 3) * 20}" y="${4 + Math.floor(i / 3) * 20}" width="16" height="16" rx="3" fill="${TOK.yellow}" stroke="${INK}" stroke-width="2"/>`;
    }
    const width = sx + (o ? 60 : 0) + 4;
    return `<svg class="blocks" viewBox="0 0 ${Math.max(width, 40)} 108" aria-hidden="true">${s}</svg>`;
  };

  art.array = function (r, c, col) {
    const d = 26;
    let s = '';
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) s += `<circle cx="${14 + j * d}" cy="${14 + i * d}" r="10" fill="${col || TOK.orange}"/>`;
    return `<svg class="array" viewBox="0 0 ${c * d + 2} ${r * d + 2}" aria-hidden="true">${s}</svg>`;
  };

  art.tok = (t) => art.shape(t.s, t.c, 'tok');

  /* ---------- ikoner (24x24) ---------- */
  const ICONS = {
    home: '<path d="M12 3 2.5 11.5H5V20h5.5v-6h3v6H19v-8.5h2.5z" fill="currentColor"/>',
    speaker: '<path d="M3 9v6h4l5 4V5L7 9H3z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.2 5.8a9 9 0 0 1 0 12.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>',
    play: '<path d="M8 4.5v15l12-7.5z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
    star: '<path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.7L12 17.5 6.1 20.8l1.3-6.7L2.5 9.5l6.6-.8z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>',
    tree: '<circle cx="12" cy="9" r="6.5" fill="currentColor"/><circle cx="7" cy="12.5" r="4.5" fill="currentColor"/><circle cx="17" cy="12.5" r="4.5" fill="currentColor"/><rect x="10.6" y="14" width="2.8" height="8" rx="1" fill="currentColor"/>',
    plus: '<path d="M12 4.5v15M4.5 12h15" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>',
    back: '<path d="M15 4.5 7.5 12 15 19.5" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>',
    zzz: '<path d="M4 6h6L4 13h6M13 12h5l-5 6h5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    thumbup: '<path d="M2.5 10.5h4V21h-4zM8 21h8.2a2.3 2.3 0 0 0 2.2-1.7l1.6-6a2.3 2.3 0 0 0-2.2-2.9H13l.8-3.7a1.8 1.8 0 0 0-3-1.6L8 10z" fill="currentColor"/>',
    thumbdown: '<path d="M2.5 13.5h4V3h-4zM8 3h8.2a2.3 2.3 0 0 1 2.2 1.7l1.6 6a2.3 2.3 0 0 1-2.2 2.9H13l.8 3.7a1.8 1.8 0 0 1-3 1.6L8 13z" fill="currentColor"/>',
    gift: '<rect x="3" y="10" width="18" height="11" rx="2.2" fill="currentColor"/><rect x="2" y="6.5" width="20" height="5" rx="2" fill="currentColor"/><path d="M12 6.5V21" stroke="#fff" stroke-width="2.6" opacity=".85"/><path d="M12 6.5C9 6.5 6.5 5 7.5 3.4 9 1.8 12 4 12 6.5ZM12 6.5C15 6.5 17.5 5 16.5 3.4 15 1.8 12 4 12 6.5Z" fill="currentColor"/>',
    hammer: '<path d="M4 20 13 11" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M10 5.5 14.5 3l6.5 6.5-2.5 4.5z" fill="currentColor"/>',
    question: '<path d="M8.2 8.6C8.2 6.5 9.8 5 12 5s3.8 1.4 3.8 3.4c0 3.2-3.8 2.8-3.8 6.1" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><circle cx="12" cy="19.2" r="1.9" fill="currentColor"/>',
  };
  art.icon = (name, cls) => `<svg class="icon ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  /* ---------- djuren (200x200) ---------- */
  function eyes(lx, ly, rx, ry) {
    const eye = (x, y) => `<circle cx="${x}" cy="${y}" r="9.5" fill="${INK}"/><circle cx="${x + 3.2}" cy="${y - 3.4}" r="3.2" fill="#fff"/>`;
    const arc = (x, y) => `<path d="M${x - 10} ${y + 3} Q${x} ${y - 10} ${x + 10} ${y + 3}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
    return `<g class="eo">${eye(lx, ly)}${eye(rx, ry)}</g><g class="eh">${arc(lx, ly)}${arc(rx, ry)}</g>`;
  }
  const blush = (lx, rx, y) => `<ellipse cx="${lx}" cy="${y}" rx="11" ry="7" fill="#F6A5B0" opacity=".7"/><ellipse cx="${rx}" cy="${y}" rx="11" ry="7" fill="#F6A5B0" opacity=".7"/>`;

  const ANIMALS = {
    beaver() {
      return '<circle cx="50" cy="58" r="21" fill="#7A4B27"/><circle cx="150" cy="58" r="21" fill="#7A4B27"/>' +
        '<circle cx="50" cy="58" r="10" fill="#E9B7A0"/><circle cx="150" cy="58" r="10" fill="#E9B7A0"/>' +
        '<g class="head"><ellipse cx="100" cy="108" rx="70" ry="64" fill="#A9713F"/>' +
        '<ellipse cx="100" cy="134" rx="38" ry="28" fill="#EBCDA2"/>' +
        eyes(70, 92, 130, 92) + blush(58, 142, 116) +
        '<ellipse cx="100" cy="115" rx="12" ry="8" fill="#3B2A22"/>' +
        '<path class="m-open" d="M82 132 Q100 164 118 132 Z" fill="#7A2C3A"/>' +
        `<path class="m-smile" d="M80 130 Q100 148 120 130" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` +
        '<rect x="90" y="132" width="10" height="18" rx="3" fill="#fff" stroke="#D9C9B0" stroke-width="2"/><rect x="100" y="132" width="10" height="18" rx="3" fill="#fff" stroke="#D9C9B0" stroke-width="2"/></g>';
    },
    lion() {
      let mane = '';
      for (let i = 0; i < 12; i++) {
        const a = i * 30 * Math.PI / 180;
        mane += `<circle cx="${(100 + Math.cos(a) * 68).toFixed(1)}" cy="${(102 + Math.sin(a) * 66).toFixed(1)}" r="27" fill="#D98A2B"/>`;
      }
      return mane + '<circle cx="100" cy="102" r="70" fill="#D98A2B"/>' +
        '<g class="head"><circle cx="62" cy="54" r="17" fill="#F2C063"/><circle cx="62" cy="54" r="8" fill="#E9A0A0"/>' +
        '<circle cx="138" cy="54" r="17" fill="#F2C063"/><circle cx="138" cy="54" r="8" fill="#E9A0A0"/>' +
        '<ellipse cx="100" cy="108" rx="54" ry="52" fill="#F4C46B"/><ellipse cx="100" cy="130" rx="30" ry="22" fill="#FCE7B8"/>' +
        eyes(78, 96, 122, 96) + blush(62, 138, 118) +
        '<path d="M89 112 Q100 105 111 112 Q106 123 100 125 Q94 123 89 112Z" fill="#B24B58"/>' +
        '<path class="m-open" d="M82 134 Q100 160 118 134 Q100 140 82 134Z" fill="#7A2C3A"/>' +
        `<path class="m-smile" d="M100 125 V131 M100 131 Q90 143 79 135 M100 131 Q110 143 121 135" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    },
    elephant() {
      return '<ellipse cx="42" cy="104" rx="38" ry="50" fill="#8499BF"/><ellipse cx="42" cy="108" rx="24" ry="34" fill="#E3B6C0"/>' +
        '<ellipse cx="158" cy="104" rx="38" ry="50" fill="#8499BF"/><ellipse cx="158" cy="108" rx="24" ry="34" fill="#E3B6C0"/>' +
        '<g class="head"><circle cx="100" cy="98" r="58" fill="#A3B6D6"/>' +
        eyes(78, 86, 122, 86) + blush(62, 138, 108) +
        '<g class="trunk"><path d="M100 112 L100 150 Q100 176 124 170" fill="none" stroke="#A3B6D6" stroke-width="30" stroke-linecap="round"/>' +
        '<path d="M91 130h18M91 143h18" stroke="#8499BF" stroke-width="3" stroke-linecap="round"/></g></g>';
    },
    zebra() {
      const id = 'zc' + uid++;
      return `<defs><clipPath id="${id}"><ellipse cx="100" cy="110" rx="58" ry="66"/></clipPath></defs>` +
        `<ellipse cx="54" cy="46" rx="14" ry="28" transform="rotate(-18 54 46)" fill="#F6F6F3" stroke="#2B2F3A" stroke-width="4"/><ellipse cx="55" cy="50" rx="6" ry="16" transform="rotate(-18 55 50)" fill="#E9B7C0"/>` +
        `<ellipse cx="146" cy="46" rx="14" ry="28" transform="rotate(18 146 46)" fill="#F6F6F3" stroke="#2B2F3A" stroke-width="4"/><ellipse cx="145" cy="50" rx="6" ry="16" transform="rotate(18 145 50)" fill="#E9B7C0"/>` +
        '<path d="M68 38 Q100 2 132 38 Q100 56 68 38Z" fill="#2B2F3A"/>' +
        '<g class="head"><ellipse cx="100" cy="110" rx="58" ry="66" fill="#F6F6F3" stroke="#2B2F3A" stroke-width="4"/>' +
        `<g clip-path="url(#${id})" stroke="#2B2F3A" stroke-width="8" stroke-linecap="round" fill="none">` +
        '<path d="M40 70 Q70 82 100 76 Q130 82 160 70"/><path d="M38 98 L66 92"/><path d="M162 98 L134 92"/><path d="M40 124 L62 114"/><path d="M160 124 L138 114"/></g>' +
        '<ellipse cx="100" cy="144" rx="36" ry="28" fill="#E8D9C6"/>' +
        '<ellipse cx="89" cy="138" rx="4" ry="6" fill="#4A3A33"/><ellipse cx="111" cy="138" rx="4" ry="6" fill="#4A3A33"/>' +
        eyes(76, 104, 124, 104) + blush(62, 138, 126) +
        '<path class="m-open" d="M86 154 Q100 174 114 154Z" fill="#7A2C3A"/>' +
        '<path class="m-smile" d="M88 154 Q100 164 112 154" fill="none" stroke="#4A3A33" stroke-width="4" stroke-linecap="round"/></g>';
    },
    monkey() {
      return '<circle cx="36" cy="104" r="27" fill="#7B4B2E"/><circle cx="36" cy="104" r="16" fill="#F0C7A0"/>' +
        '<circle cx="164" cy="104" r="27" fill="#7B4B2E"/><circle cx="164" cy="104" r="16" fill="#F0C7A0"/>' +
        '<g class="head"><path d="M68 46 Q72 22 90 36 Q100 16 110 36 Q128 22 132 46Z" fill="#6E4128"/>' +
        '<ellipse cx="100" cy="102" rx="64" ry="62" fill="#8A5A3B"/>' +
        '<path d="M100 80 Q84 56 62 72 Q40 90 56 124 Q64 152 100 156 Q136 152 144 124 Q160 90 138 72 Q116 56 100 80Z" fill="#F0C7A0"/>' +
        eyes(78, 98, 122, 98) + blush(62, 138, 120) +
        '<ellipse cx="94" cy="118" rx="3" ry="4" fill="#7B4B2E"/><ellipse cx="106" cy="118" rx="3" ry="4" fill="#7B4B2E"/>' +
        '<path class="m-open" d="M82 134 Q100 162 118 134 Z" fill="#7A2C3A"/>' +
        `<path class="m-smile" d="M80 132 Q100 150 120 132" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/></g>`;
    },
    giraffe() {
      const sp = (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${(r * 0.8).toFixed(1)}" fill="#B5762F"/>`;
      return '<path d="M82 46 L77 16" stroke="#B5762F" stroke-width="7" stroke-linecap="round"/><circle cx="76" cy="13" r="9" fill="#7B4B2E"/>' +
        '<path d="M118 46 L123 16" stroke="#B5762F" stroke-width="7" stroke-linecap="round"/><circle cx="124" cy="13" r="9" fill="#7B4B2E"/>' +
        '<ellipse cx="38" cy="74" rx="27" ry="14" transform="rotate(-22 38 74)" fill="#F2C34F"/><ellipse cx="40" cy="74" rx="16" ry="7" transform="rotate(-22 40 74)" fill="#E9A0A8"/>' +
        '<ellipse cx="162" cy="74" rx="27" ry="14" transform="rotate(22 162 74)" fill="#F2C34F"/><ellipse cx="160" cy="74" rx="16" ry="7" transform="rotate(22 160 74)" fill="#E9A0A8"/>' +
        '<g class="head"><ellipse cx="100" cy="108" rx="56" ry="64" fill="#F4C95D"/>' +
        sp(68, 62, 10) + sp(134, 70, 9) + sp(54, 100, 7) + sp(148, 104, 7) + sp(96, 56, 6) +
        '<path d="M90 46 Q100 32 110 46 L108 62 Q100 68 92 62Z" fill="#B5762F"/>' +
        '<ellipse cx="100" cy="146" rx="37" ry="28" fill="#FBE7B2"/>' +
        '<ellipse cx="89" cy="140" rx="4" ry="6" fill="#7B4B2E"/><ellipse cx="111" cy="140" rx="4" ry="6" fill="#7B4B2E"/>' +
        eyes(76, 102, 124, 102) + blush(62, 138, 124) +
        '<path class="m-open" d="M86 156 Q100 176 114 156Z" fill="#7A2C3A"/>' +
        `<path class="m-smile" d="M87 156 Q100 166 113 156" fill="none" stroke="#7B4B2E" stroke-width="4" stroke-linecap="round"/></g>`;
    },
    hippo() {
      return '<circle cx="58" cy="44" r="18" fill="#8E86B8"/><circle cx="58" cy="44" r="9" fill="#E9B7C8"/>' +
        '<circle cx="142" cy="44" r="18" fill="#8E86B8"/><circle cx="142" cy="44" r="9" fill="#E9B7C8"/>' +
        '<g class="head"><ellipse cx="100" cy="100" rx="68" ry="58" fill="#9B93C4"/>' +
        '<ellipse cx="100" cy="140" rx="58" ry="40" fill="#B7B0D8"/>' +
        '<ellipse cx="78" cy="128" rx="7" ry="9" fill="#5B5480"/><ellipse cx="122" cy="128" rx="7" ry="9" fill="#5B5480"/>' +
        '<circle cx="70" cy="84" r="17" fill="#9B93C4"/><circle cx="130" cy="84" r="17" fill="#9B93C4"/>' +
        eyes(70, 86, 130, 86) + blush(46, 154, 112) +
        '<path class="m-open" d="M72 158 Q100 186 128 158 Z" fill="#7A2C3A"/>' +
        `<path class="m-smile" d="M70 156 Q100 176 130 156" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` +
        '<rect x="90" y="160" width="9" height="12" rx="3" fill="#fff"/><rect x="101" y="160" width="9" height="12" rx="3" fill="#fff"/></g>';
    },
    turtle() {
      const id = 'tc' + uid++;
      return `<defs><clipPath id="${id}"><ellipse cx="100" cy="78" rx="84" ry="58"/></clipPath></defs>` +
        '<ellipse cx="100" cy="78" rx="84" ry="58" fill="#3E8E57"/>' +
        `<g clip-path="url(#${id})" fill="none" stroke="#2C6B40" stroke-width="5" stroke-linecap="round"><path d="M100 18 V60 M62 30 L72 60 M138 30 L128 60 M20 54 L56 66 M180 54 L144 66"/><path d="M60 40 Q100 28 140 40"/></g>` +
        '<g class="head"><ellipse cx="100" cy="120" rx="54" ry="50" fill="#A8D67A"/>' +
        eyes(78, 110, 122, 110) + blush(62, 138, 130) +
        '<ellipse cx="94" cy="126" rx="2.6" ry="3.4" fill="#5D8A3C"/><ellipse cx="106" cy="126" rx="2.6" ry="3.4" fill="#5D8A3C"/>' +
        '<path class="m-open" d="M84 140 Q100 166 116 140Z" fill="#7A2C3A"/>' +
        `<path class="m-smile" d="M82 138 Q100 156 118 138" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/></g>`;
    },
    rhino() {
      return '<ellipse cx="46" cy="58" rx="16" ry="22" transform="rotate(-20 46 58)" fill="#8D97A8"/><ellipse cx="47" cy="60" rx="8" ry="12" transform="rotate(-20 47 60)" fill="#E3B6C0"/>' +
        '<ellipse cx="154" cy="58" rx="16" ry="22" transform="rotate(20 154 58)" fill="#8D97A8"/><ellipse cx="153" cy="60" rx="8" ry="12" transform="rotate(20 153 60)" fill="#E3B6C0"/>' +
        '<g class="head"><ellipse cx="100" cy="106" rx="62" ry="60" fill="#A0A9B8"/>' +
        '<ellipse cx="100" cy="140" rx="44" ry="30" fill="#C3CAD6"/>' +
        '<path d="M84 128 Q96 70 122 128Z" fill="#F2E8D4" stroke="#CDBFA4" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="M96 80 L116 104" stroke="#CDBFA4" stroke-width="2.5" opacity=".7"/>' +
        '<ellipse cx="82" cy="138" rx="4" ry="5" fill="#6B7487"/><ellipse cx="118" cy="138" rx="4" ry="5" fill="#6B7487"/>' +
        eyes(66, 98, 134, 98) + blush(52, 148, 122) +
        '<path class="m-open" d="M86 154 Q100 172 114 154Z" fill="#7A2C3A"/>' +
        `<path class="m-smile" d="M86 153 Q100 164 114 153" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/></g>`;
    },
    flamingo() {
      return '<path d="M82 46 Q70 14 88 18 Q92 30 96 44Z" fill="#F47C9C"/><path d="M100 42 Q96 6 112 12 Q112 28 110 44Z" fill="#F9A1B8"/><path d="M118 46 Q132 18 118 20 Q112 32 108 44Z" fill="#F47C9C"/>' +
        '<g class="head"><circle cx="100" cy="106" r="58" fill="#F58FA8"/>' +
        eyes(72, 94, 128, 94) + blush(54, 146, 116) +
        '<path d="M80 116 Q100 104 120 116 Q126 144 106 160 Q100 163 94 160 Q74 144 80 116Z" fill="#FFE2E8" stroke="#E8708E" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="M86 142 Q100 136 114 142 Q110 156 100 160 Q90 156 86 142Z" fill="#2E3446"/>' +
        '<ellipse cx="93" cy="126" rx="2.8" ry="3.6" fill="#E8708E"/><ellipse cx="107" cy="126" rx="2.8" ry="3.6" fill="#E8708E"/></g>';
    },
    cheetah() {
      const dot = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#4A3526"/>`;
      return '<circle cx="52" cy="52" r="20" fill="#D9A641"/><circle cx="52" cy="52" r="10" fill="#E9A0A0"/>' +
        '<circle cx="148" cy="52" r="20" fill="#D9A641"/><circle cx="148" cy="52" r="10" fill="#E9A0A0"/>' +
        '<g class="head"><ellipse cx="100" cy="108" rx="60" ry="56" fill="#F2C25C"/>' +
        dot(66, 66, 4.5) + dot(80, 54, 4) + dot(96, 50, 4.5) + dot(114, 54, 4) + dot(132, 66, 4.5) + dot(52, 90, 4) + dot(148, 90, 4) + dot(60, 122, 3.6) + dot(140, 122, 3.6) +
        '<ellipse cx="100" cy="136" rx="36" ry="26" fill="#FBE7B8"/>' +
        '<path d="M74 108 Q66 126 70 142 M126 108 Q134 126 130 142" fill="none" stroke="#4A3526" stroke-width="5" stroke-linecap="round"/>' +
        eyes(78, 98, 122, 98) + blush(58, 142, 120) +
        '<path d="M90 120 Q100 114 110 120 Q106 130 100 131 Q94 130 90 120Z" fill="#4A3526"/>' +
        '<path class="m-open" d="M84 142 Q100 166 116 142 Q100 148 84 142Z" fill="#7A2C3A"/>' +
        `<path class="m-smile" d="M100 131 V137 M100 137 Q92 148 82 142 M100 137 Q108 148 118 142" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    },
    parrot() {
      return '<path d="M84 50 Q70 20 86 12 Q94 28 98 46Z" fill="#3D84E8"/><path d="M100 46 Q98 8 114 12 Q116 30 110 48Z" fill="#FFC93C"/><path d="M118 52 Q134 28 122 16 Q112 30 108 48Z" fill="#3D84E8"/>' +
        '<g class="head"><circle cx="100" cy="108" r="62" fill="#E5483F"/>' +
        '<ellipse cx="100" cy="102" rx="48" ry="40" fill="#FFF6EA"/>' +
        '<path d="M64 96 H78 M62 108 H76 M124 96 H138 M126 108 H140" stroke="#C9B9A6" stroke-width="2.5" stroke-linecap="round"/>' +
        eyes(76, 94, 124, 94) + blush(60, 140, 114) +
        '<path d="M76 114 Q100 96 124 114 Q128 150 104 164 Q98 166 96 164 Q72 150 76 114Z" fill="#F7D36B" stroke="#D9A82A" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="M82 144 Q100 134 118 144 Q112 162 100 164 Q88 162 82 144Z" fill="#E8B83A"/>' +
        '<ellipse cx="92" cy="124" rx="2.6" ry="3.4" fill="#B88612"/><ellipse cx="108" cy="124" rx="2.6" ry="3.4" fill="#B88612"/>' +
        '<path class="m-open" d="M86 144 Q100 138 114 144 Q110 160 100 161 Q90 160 86 144Z" fill="#7A2C3A"/>' +
        `<path class="m-smile" d="M84 144 Q100 150 116 144" fill="none" stroke="#B88612" stroke-width="4" stroke-linecap="round"/></g>`;
    },
    gorilla() {
      return '<circle cx="40" cy="110" r="20" fill="#3F4352"/><circle cx="40" cy="110" r="10" fill="#8A8F9E"/>' +
        '<circle cx="160" cy="110" r="20" fill="#3F4352"/><circle cx="160" cy="110" r="10" fill="#8A8F9E"/>' +
        '<g class="head"><path d="M42 106 Q36 50 100 38 Q164 50 158 106 Q160 160 100 168 Q40 160 42 106Z" fill="#4A4F5E"/>' +
        '<path d="M82 40 Q100 24 118 40 Q100 50 82 40Z" fill="#3A3E4B"/>' +
        '<path d="M100 82 Q70 74 62 104 Q58 142 82 156 Q100 164 118 156 Q142 142 138 104 Q130 74 100 82Z" fill="#CDB7A0"/>' +
        '<path d="M62 92 Q100 80 138 92 Q132 82 100 76 Q68 82 62 92Z" fill="#3A3E4B"/>' +
        eyes(80, 104, 120, 104) + blush(66, 134, 126) +
        '<ellipse cx="91" cy="126" rx="4" ry="5" fill="#6A5446"/><ellipse cx="109" cy="126" rx="4" ry="5" fill="#6A5446"/>' +
        '<path class="m-open" d="M82 142 Q100 168 118 142Z" fill="#7A2C3A"/>' +
        `<path class="m-smile" d="M82 140 Q100 156 118 140" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/></g>`;
    },
    owl() {
      return '<path d="M46 62 L40 24 L78 44Z" fill="#8A6A44"/><path d="M154 62 L160 24 L122 44Z" fill="#8A6A44"/>' +
        '<g class="head"><ellipse cx="100" cy="108" rx="68" ry="62" fill="#A9825A"/>' +
        '<path d="M60 150 Q100 184 140 150 Q128 170 100 172 Q72 170 60 150Z" fill="#C9A878"/>' +
        '<circle cx="74" cy="98" r="34" fill="#F3E4C8" stroke="#8A6A44" stroke-width="4"/><circle cx="126" cy="98" r="34" fill="#F3E4C8" stroke="#8A6A44" stroke-width="4"/>' +
        `<g class="eo"><circle cx="74" cy="98" r="15" fill="${INK}"/><circle cx="79" cy="92" r="5" fill="#fff"/><circle cx="126" cy="98" r="15" fill="${INK}"/><circle cx="131" cy="92" r="5" fill="#fff"/></g>` +
        `<g class="eh"><path d="M60 104 Q74 86 88 104" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M112 104 Q126 86 140 104" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/></g>` +
        '<ellipse cx="50" cy="132" rx="10" ry="6" fill="#F6A5B0" opacity=".7"/><ellipse cx="150" cy="132" rx="10" ry="6" fill="#F6A5B0" opacity=".7"/>' +
        '<path d="M90 116 L110 116 L100 138Z" fill="#F2A63B" stroke="#D9861E" stroke-width="3" stroke-linejoin="round"/>' +
        '<path class="m-open" d="M92 138 Q100 152 108 138Z" fill="#7A2C3A"/></g>';
    },
  };
  art.ANIMALS = Object.keys(ANIMALS);
  art.animal = (kind, cls) => `<svg class="animal animal-${kind} ${cls || ''}" viewBox="0 0 200 200" aria-hidden="true">${ANIMALS[kind]()}</svg>`;

  /* ---------- landskap ---------- */
  function acacia(x, y, s) {
    return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-3 0 L-2 -34 Q-12 -46 -26 -50 M-2 -34 Q8 -46 20 -52" stroke="#6B4F3A" stroke-width="5" fill="none" stroke-linecap="round"/>` +
      '<ellipse cx="-4" cy="-56" rx="42" ry="11" fill="#5E8A3A"/><ellipse cx="22" cy="-60" rx="26" ry="8" fill="#6C9A45"/></g>';
  }
  art.scenery = function () {
    const g = 'sg' + uid++;
    return '<svg class="scenery" viewBox="0 0 800 500" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
      `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD8E8"/><stop offset=".62" stop-color="#FBE9B4"/></linearGradient></defs>` +
      `<rect width="800" height="500" fill="url(#${g})"/>` +
      '<circle cx="640" cy="120" r="92" fill="#FFE9A8" opacity=".55"/><circle cx="640" cy="120" r="58" fill="#FFD45E"/>' +
      '<g fill="#fff" opacity=".9"><ellipse cx="150" cy="90" rx="60" ry="18"/><ellipse cx="190" cy="76" rx="36" ry="16"/><ellipse cx="420" cy="140" rx="50" ry="14"/><ellipse cx="455" cy="128" rx="30" ry="12"/></g>' +
      '<path d="M0 330 Q140 270 300 320 T620 310 T800 300 V500 H0Z" fill="#D2DC8A"/>' +
      '<path d="M0 380 Q200 320 380 372 T800 350 V500 H0Z" fill="#B5CC63"/>' +
      acacia(120, 340, 1) + acacia(690, 330, 0.8) + acacia(470, 350, 0.55) +
      '<path d="M0 440 Q220 390 420 436 T800 420 V500 H0Z" fill="#8FB24C"/></svg>';
  };
  art.parkScene = function () {
    const g = 'pg' + uid++;
    return '<svg class="scenery" viewBox="0 0 800 500" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
      `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A8DDEB"/><stop offset="1" stop-color="#E9F4C8"/></linearGradient></defs>` +
      `<rect width="800" height="500" fill="url(#${g})"/>` +
      '<circle cx="690" cy="84" r="44" fill="#FFD45E"/>' +
      '<path d="M0 230 Q200 170 400 225 T800 205 V500 H0Z" fill="#BFD76F"/>' +
      '<ellipse cx="560" cy="380" rx="120" ry="40" fill="#7CC6E0"/><ellipse cx="560" cy="376" rx="96" ry="28" fill="#9ADAF0"/>' +
      '<path d="M0 300 Q220 250 420 300 T800 285 V500 H0Z" fill="#9EC654"/>' +
      '<path d="M0 400 Q240 350 440 396 T800 380 V500 H0Z" fill="#86B245"/></svg>';
  };
  /* ---------- safarit: djur på sin plats, växter och byggnader ---------- */
  const water = (cx, cy, rx, ry, c1, c2) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c1 || '#5BB6DB'}"/><ellipse cx="${cx}" cy="${cy - 3}" rx="${rx - 8}" ry="${ry - 5}" fill="${c2 || '#8AD3EE'}"/>` +
    `<path d="M${cx - rx * 0.5} ${cy} q8 -5 16 0 M${cx + rx * 0.1} ${cy + 4} q8 -5 16 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".75"/>`;
  const leafBush = (cols, y) => { let o = ''; [[28, 0, 30], [70, -8, 34], [112, -4, 34], [152, 0, 30], [100, 8, 36], [50, 10, 32], [140, 10, 30]].forEach((p, i) => { o += `<circle cx="${p[0] + 10}" cy="${y + p[1]}" r="${p[2]}" fill="${cols[i % cols.length]}"/>`; }); return o; };
  const PEEK = {
    beaver: () => water(100, 188, 88, 22) + '<rect x="30" y="170" width="120" height="30" rx="15" fill="#A9713F" stroke="#7A4B27" stroke-width="3"/><path d="M52 182h60M60 192h44" stroke="#8A5A31" stroke-width="3" stroke-linecap="round"/><ellipse cx="150" cy="185" rx="10" ry="15" fill="#E2B27A" stroke="#7A4B27" stroke-width="3"/>',
    lion: () => '<path d="M14 208 Q18 154 66 150 Q104 140 140 152 Q186 158 188 208Z" fill="#BCA78C"/><path d="M14 208 Q18 154 66 150 Q104 140 140 152 Q186 158 188 208" fill="none" stroke="#9A866C" stroke-width="3"/><path d="M60 170 l10 14 M120 164 l-8 16 M150 178 l8 12" stroke="#9A866C" stroke-width="3" stroke-linecap="round"/><path d="M18 188 Q10 176 24 172 M180 190 Q192 178 178 172" stroke="#8FB24C" stroke-width="5" fill="none" stroke-linecap="round"/>',
    elephant: () => water(100, 188, 90, 23) + '<path d="M44 168 q4 -14 8 0 M148 164 q4 -14 8 0" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".8"/>',
    zebra: () => { let g = ''; for (let i = 0; i < 11; i++) { const x = 14 + i * 17; g += `<path d="M${x} 206 Q${x - 6} ${178 - (i % 3) * 6} ${x - 2} ${166 - (i % 4) * 4} Q${x + 6} ${180} ${x + 10} 206Z" fill="${i % 2 ? '#7FB246' : '#97C95A'}"/>`; } return g; },
    monkey: () => leafBush(['#4FA059', '#62B86A', '#3E8E4E'], 188) + '<circle cx="46" cy="170" r="6" fill="#F28F3B"/><circle cx="150" cy="176" r="6" fill="#F28F3B"/><circle cx="104" cy="166" r="5" fill="#E4574F"/>',
    giraffe: () => leafBush(['#6DAE4A', '#85C45C', '#5C9A3D'], 190) + '<g fill="#FFD45E"><circle cx="40" cy="172" r="6"/><circle cx="120" cy="164" r="6"/><circle cx="160" cy="178" r="6"/></g>',
    hippo: () => water(100, 188, 90, 24, '#58A6D6', '#86C8EA') + '<path d="M36 170 v-20 M44 172 v-26 M158 168 v-22 M166 172 v-16" stroke="#6B8E3F" stroke-width="5" stroke-linecap="round"/>',
    turtle: () => '<ellipse cx="100" cy="193" rx="96" ry="20" fill="#7CC6E0"/><ellipse cx="100" cy="190" rx="84" ry="16" fill="#F0DDA6"/><path d="M30 190 q10 -6 20 0 M150 192 q10 -6 20 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/><circle cx="52" cy="186" r="4.5" fill="#D9C68A"/><circle cx="150" cy="184" r="5" fill="#D9C68A"/><path d="M96 180 l5 -9 l5 9Z" fill="#F28F3B"/>',
    rhino: () => '<ellipse cx="100" cy="190" rx="88" ry="22" fill="#8A6A48"/><ellipse cx="100" cy="186" rx="72" ry="15" fill="#A3825B"/><path d="M40 168 q4 -14 8 0 M150 166 q4 -14 8 0" stroke="#7FB246" stroke-width="5" stroke-linecap="round" fill="none"/>',
    flamingo: () => water(100, 190, 88, 22, '#6DB9DC', '#A9DDF0') + '<path d="M30 190 V150 M40 192 V142 M164 190 V148 M174 188 V156" stroke="#7FA03F" stroke-width="5" stroke-linecap="round"/><ellipse cx="30" cy="148" rx="5" ry="10" fill="#8B5E3C"/><ellipse cx="174" cy="154" rx="5" ry="10" fill="#8B5E3C"/>',
    cheetah: () => '<path d="M12 208 Q22 158 72 154 Q110 148 148 156 Q186 164 190 208Z" fill="#C9B79A"/><path d="M12 208 Q22 158 72 154 Q110 148 148 156 Q186 164 190 208" fill="none" stroke="#A8957A" stroke-width="3"/><path d="M60 176 l12 12 M134 170 l-10 16" stroke="#A8957A" stroke-width="3" stroke-linecap="round"/>',
    parrot: () => '<rect x="8" y="164" width="184" height="22" rx="11" fill="#8B5E3C" stroke="#6B4527" stroke-width="3"/><path d="M30 174h50M110 176h50" stroke="#6B4527" stroke-width="2.5" stroke-linecap="round"/><path d="M168 166 q22 -6 20 -26 q-24 2 -20 26Z" fill="#5BAE4E"/><path d="M28 168 q-22 -6 -18 -24 q22 2 18 24Z" fill="#6DC15C"/>',
    gorilla: () => leafBush(['#2F7D45', '#3B9455', '#27693B'], 190) + '<g fill="#fff"><circle cx="50" cy="170" r="5"/><circle cx="156" cy="174" r="5"/></g>',
    owl: () => '<path d="M34 170 Q100 150 166 170 L158 208 Q100 220 42 208Z" fill="#8B5E3C" stroke="#6B4527" stroke-width="3" stroke-linejoin="round"/><ellipse cx="100" cy="170" rx="66" ry="14" fill="#C69A68" stroke="#6B4527" stroke-width="3"/><ellipse cx="100" cy="170" rx="40" ry="7" fill="none" stroke="#A67C4C" stroke-width="2.5"/><path d="M148 160 q20 -6 22 -22 q-22 4 -22 22Z" fill="#5BAE4E"/>',
  };
  /* Djuret på sin plats i safarit. */
  art.animalPiece = function (kind) {
    return `<svg class="animal piece-animal animal-${kind}" viewBox="0 0 200 220" aria-hidden="true"><ellipse cx="100" cy="196" rx="90" ry="17" fill="rgba(38,50,74,.2)"/>` +
      `<g transform="translate(18 2) scale(.82)">${ANIMALS[kind]()}</g>${PEEK[kind] ? PEEK[kind]() : ''}</svg>`;
  };

  /* Småsaker (växter), 60x60. Basen ligger vid y=55. */
  const stem = (x, h, c) => `<path d="M${x} 55 V${55 - h}" stroke="${c || '#4E9A47'}" stroke-width="4" stroke-linecap="round"/>`;
  const petals = (cx, cy, n, r, pr, col) => { let o = ''; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; o += `<circle cx="${(cx + Math.cos(a) * r).toFixed(1)}" cy="${(cy + Math.sin(a) * r).toFixed(1)}" r="${pr}" fill="${col}"/>`; } return o; };
  const DECOR = {
    sprout: () => stem(30, 18) + '<path d="M30 42 Q14 42 10 26 Q28 26 30 42Z" fill="#6CC060"/><path d="M30 38 Q46 38 50 22 Q32 22 30 38Z" fill="#82D26F"/><ellipse cx="30" cy="55" rx="13" ry="4.5" fill="#8B5E3C"/>',
    flowerR: () => stem(30, 26) + '<path d="M30 46 Q18 46 14 36 Q28 36 30 46Z" fill="#6CC060"/>' + petals(30, 22, 6, 9, 7, '#E4574F') + '<circle cx="30" cy="22" r="6.5" fill="#FFD45E"/>',
    flowerY: () => stem(30, 26) + '<path d="M30 44 Q42 44 46 34 Q32 34 30 44Z" fill="#6CC060"/>' + petals(30, 22, 7, 9, 6.5, '#FFC93C') + '<circle cx="30" cy="22" r="6.5" fill="#F28F3B"/>',
    daisy: () => stem(30, 24) + petals(30, 24, 8, 10, 5.5, '#fff') + '<circle cx="30" cy="24" r="6" fill="#FFC93C"/>',
    tulip: () => stem(30, 24) + '<path d="M30 46 Q14 40 14 28 Q22 32 30 40Z" fill="#6CC060"/><path d="M18 14 Q18 32 30 32 Q42 32 42 14 L36 20 L30 12 L24 20Z" fill="#EE6FA0"/>',
    sunflower: () => stem(30, 32) + '<path d="M30 46 Q44 44 46 34 Q32 34 30 46Z" fill="#6CC060"/>' + petals(30, 18, 10, 11, 5.5, '#FFC93C') + '<circle cx="30" cy="18" r="9" fill="#7A4B27"/>',
    bush: () => '<circle cx="18" cy="42" r="13" fill="#4FA059"/><circle cx="42" cy="42" r="13" fill="#4FA059"/><circle cx="30" cy="32" r="15" fill="#62B86A"/><circle cx="22" cy="38" r="2.6" fill="#E4574F"/><circle cx="38" cy="34" r="2.6" fill="#E4574F"/><circle cx="32" cy="46" r="2.6" fill="#E4574F"/>',
    treeS: () => '<rect x="26.5" y="34" width="7" height="21" rx="3" fill="#8B5E3C"/><circle cx="30" cy="24" r="17" fill="#4FA059"/><circle cx="21" cy="30" r="11" fill="#62B86A"/><circle cx="39" cy="28" r="11" fill="#5AAE62"/>',
    palmS: () => '<path d="M31 55 Q27 40 33 24" stroke="#A9713F" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M33 24 Q14 12 6 24 Q22 18 33 24Z M33 24 Q52 12 56 26 Q42 18 33 24Z M33 24 Q30 6 20 2 Q26 14 33 24Z M33 24 Q40 6 50 6 Q40 14 33 24Z" fill="#4FA059"/><circle cx="31" cy="27" r="3" fill="#7A4B27"/><circle cx="36" cy="28" r="3" fill="#7A4B27"/>',
    mushroom: () => '<rect x="25" y="34" width="10" height="21" rx="4" fill="#F6EBD6"/><path d="M8 38 Q8 12 30 12 Q52 12 52 38Z" fill="#E4574F"/><circle cx="22" cy="26" r="4" fill="#fff"/><circle cx="36" cy="22" r="3.4" fill="#fff"/><circle cx="42" cy="32" r="3" fill="#fff"/>',
    rock: () => '<path d="M8 55 L12 36 L26 26 L44 30 L52 44 L50 55Z" fill="#A9B0BE"/><path d="M26 26 L44 30 L40 40 L22 38Z" fill="#C8CEDA"/><path d="M12 36 L22 38 L16 55 L8 55Z" fill="#8E96A6"/>',
    can: () => '<path d="M14 24 H12 Q4 24 4 32 V36 H8 V32 Q8 28 12 28 H14Z" fill="#7D95B8"/><path d="M40 30 L54 14 Q57 12 58 16 L46 40Z" fill="#7D95B8"/><rect x="12" y="22" width="32" height="32" rx="8" fill="#8FB3E0"/><rect x="12" y="22" width="32" height="10" rx="5" fill="#A9C8EC"/><path d="M12 22 Q28 8 44 22" fill="none" stroke="#6C89B0" stroke-width="3.4" stroke-linecap="round"/><g fill="#4FB3D9"><circle cx="58" cy="26" r="2.2"/><circle cx="54" cy="34" r="2"/><circle cx="59" cy="40" r="2"/></g>',
    grass: () => '<path d="M14 55 Q12 38 8 28 Q20 36 22 55Z M24 55 Q24 30 28 14 Q36 32 34 55Z M36 55 Q40 38 52 30 Q48 44 46 55Z" fill="#7FB246"/><path d="M28 55 Q32 40 40 34 Q38 46 38 55Z" fill="#97C95A"/>',
  };
  art.deco = (id) => `<svg class="deco deco-${id}" viewBox="0 0 60 60" aria-hidden="true"><ellipse cx="30" cy="56" rx="19" ry="4" fill="rgba(38,50,74,.16)"/>${DECOR[id] ? DECOR[id]() : ''}</svg>`;

  /* Stora saker, 100x100. */
  const BIGS = {
    pond: () => '<ellipse cx="50" cy="66" rx="44" ry="26" fill="#8B7A56"/><ellipse cx="50" cy="64" rx="40" ry="22" fill="#5BB6DB"/><ellipse cx="50" cy="62" rx="34" ry="17" fill="#8AD3EE"/><ellipse cx="34" cy="64" rx="8" ry="4" fill="#4FA059"/><ellipse cx="62" cy="58" rx="7" ry="3.6" fill="#62B86A"/><circle cx="62" cy="55" r="2.6" fill="#F9A1B8"/><path d="M20 52 V36 M26 54 V30 M80 54 V38 M74 52 V34" stroke="#6B8E3F" stroke-width="3.4" stroke-linecap="round"/><ellipse cx="26" cy="29" rx="3.4" ry="6" fill="#8B5E3C"/><ellipse cx="74" cy="33" rx="3.4" ry="6" fill="#8B5E3C"/>',
    hut: () => '<ellipse cx="50" cy="88" rx="38" ry="8" fill="rgba(38,50,74,.18)"/><rect x="22" y="48" width="56" height="38" rx="6" fill="#D9A56A"/><path d="M22 60h56M22 72h56" stroke="#B9854F" stroke-width="2.4"/><path d="M12 52 L50 12 L88 52Z" fill="#C9A24A" stroke="#A9822E" stroke-width="3" stroke-linejoin="round"/><path d="M26 44 L74 44 M34 34 L66 34" stroke="#A9822E" stroke-width="2.4"/><path d="M42 86 V64 Q50 56 58 64 V86Z" fill="#7A4B27"/><rect x="62" y="56" width="10" height="10" rx="2" fill="#BFE6F2" stroke="#7A4B27" stroke-width="2"/>',
    tent: () => '<ellipse cx="50" cy="88" rx="40" ry="8" fill="rgba(38,50,74,.18)"/><path d="M8 86 L50 18 L92 86Z" fill="#F28F3B"/><path d="M50 18 L28 86 H8Z" fill="#E4574F"/><path d="M50 18 L72 86 H92Z" fill="#FFC93C"/><path d="M50 18 L42 86 H58Z" fill="#7A4B27"/><path d="M50 18 V6" stroke="#7A4B27" stroke-width="3"/><path d="M50 6 L64 11 L50 16Z" fill="#3D84E8"/>',
    jeep: () => '<ellipse cx="50" cy="86" rx="40" ry="8" fill="rgba(38,50,74,.18)"/><path d="M8 70 V54 Q8 48 14 48 H30 L38 34 H68 L74 48 H88 Q94 48 94 54 V70Z" fill="#6BAA55"/><path d="M40 38 H66 L70 48 H34Z" fill="#BFE6F2" stroke="#3E7A3A" stroke-width="2.4" stroke-linejoin="round"/><rect x="8" y="62" width="86" height="8" fill="#4F8A42"/><circle cx="28" cy="74" r="12" fill="#26324A"/><circle cx="28" cy="74" r="5" fill="#C7D2E0"/><circle cx="76" cy="74" r="12" fill="#26324A"/><circle cx="76" cy="74" r="5" fill="#C7D2E0"/><circle cx="90" cy="56" r="4" fill="#FFE9A8"/><rect x="2" y="52" width="6" height="10" rx="3" fill="#26324A"/>',
    tower: () => '<ellipse cx="50" cy="90" rx="34" ry="7" fill="rgba(38,50,74,.18)"/><path d="M28 90 L36 46 M72 90 L64 46 M36 76 H66 M32 62 H68" stroke="#8B5E3C" stroke-width="5" stroke-linecap="round"/><path d="M36 76 L66 62 M66 76 L34 62" stroke="#A9713F" stroke-width="3"/><rect x="26" y="40" width="48" height="10" rx="3" fill="#A9713F"/><rect x="30" y="26" width="40" height="16" fill="#D9A56A"/><path d="M22 28 L50 6 L78 28Z" fill="#C0553E"/><rect x="42" y="30" width="16" height="9" rx="2" fill="#BFE6F2"/>',
    baobab: () => '<ellipse cx="50" cy="90" rx="30" ry="6" fill="rgba(38,50,74,.18)"/><path d="M34 90 Q40 70 38 50 Q36 38 40 32 H60 Q64 38 62 50 Q60 70 66 90Z" fill="#B58A5E"/><path d="M44 80 Q46 60 44 44 M56 78 Q54 60 58 46" stroke="#9A7249" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M40 34 Q20 30 16 18 Q30 14 40 24Z M50 32 Q44 12 52 6 Q60 14 54 32Z M60 34 Q80 30 84 18 Q70 14 60 24Z" fill="#4FA059"/><circle cx="26" cy="18" r="10" fill="#62B86A"/><circle cx="50" cy="12" r="12" fill="#4FA059"/><circle cx="74" cy="18" r="10" fill="#62B86A"/>',
    fountain: () => '<ellipse cx="50" cy="86" rx="40" ry="10" fill="#A9B0BE"/><ellipse cx="50" cy="82" rx="36" ry="9" fill="#8AD3EE" stroke="#A9B0BE" stroke-width="4"/><rect x="45" y="48" width="10" height="32" fill="#C8CEDA"/><ellipse cx="50" cy="52" rx="20" ry="6" fill="#8AD3EE" stroke="#C8CEDA" stroke-width="3"/><path d="M50 50 Q50 24 50 18 M50 40 Q34 24 28 32 M50 40 Q66 24 72 32" fill="none" stroke="#8AD3EE" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="16" r="3.4" fill="#8AD3EE"/><circle cx="28" cy="34" r="3" fill="#8AD3EE"/><circle cx="72" cy="34" r="3" fill="#8AD3EE"/>',
    balloon: () => '<ellipse cx="50" cy="90" rx="22" ry="5" fill="rgba(38,50,74,.18)"/><path d="M50 8 Q84 10 82 40 Q80 54 62 64 H38 Q20 54 18 40 Q16 10 50 8Z" fill="#E4574F"/><path d="M50 8 Q36 20 38 64 H62 Q64 20 50 8Z" fill="#FFC93C"/><path d="M50 8 Q24 12 18 40 Q18 52 30 60 Q22 36 50 8Z" fill="#3D84E8"/><path d="M38 64 L42 76 M62 64 L58 76" stroke="#7A4B27" stroke-width="2.4"/><rect x="40" y="76" width="20" height="13" rx="3" fill="#A9713F" stroke="#7A4B27" stroke-width="2"/>',
    sign: () => '<ellipse cx="50" cy="90" rx="22" ry="5" fill="rgba(38,50,74,.18)"/><rect x="46" y="16" width="8" height="74" rx="3" fill="#8B5E3C"/><path d="M54 22 H84 L92 30 L84 38 H54Z" fill="#F28F3B" stroke="#C0702A" stroke-width="2.4" stroke-linejoin="round"/><path d="M46 44 H16 L8 52 L16 60 H46Z" fill="#6BAA55" stroke="#4F8A42" stroke-width="2.4" stroke-linejoin="round"/><path d="M54 66 H80 L87 73 L80 80 H54Z" fill="#3D84E8" stroke="#2C66B8" stroke-width="2.4" stroke-linejoin="round"/>',
  };
  art.big = (id) => `<svg class="bigdeco bigdeco-${id}" viewBox="0 0 100 100" aria-hidden="true">${BIGS[id] ? BIGS[id]() : ''}</svg>`;

  /* Byggställning och hammare till bygganimationen. */
  art.scaffold = () => '<svg class="scaffold" viewBox="0 0 100 100" aria-hidden="true"><path d="M20 90 V30 M80 90 V30" stroke="#B9854F" stroke-width="6" stroke-linecap="round"/><path d="M14 40 H86 M14 66 H86" stroke="#D9A56A" stroke-width="6" stroke-linecap="round"/><path d="M20 66 L80 40 M20 40 L80 66" stroke="#A9713F" stroke-width="3.4" stroke-linecap="round"/><circle cx="20" cy="30" r="3.4" fill="#7A4B27"/><circle cx="80" cy="30" r="3.4" fill="#7A4B27"/></svg>';
  art.hammer = () => '<svg class="hammer" viewBox="0 0 60 60" aria-hidden="true"><rect x="27" y="22" width="7" height="34" rx="3" fill="#A9713F" stroke="#7A4B27" stroke-width="2"/><rect x="12" y="8" width="38" height="18" rx="5" fill="#8D98AA" stroke="#5E6A80" stroke-width="2.4"/><rect x="12" y="8" width="10" height="18" rx="4" fill="#A9B3C4"/></svg>';

  /* Bakgrunden bakom safarit. */
  art.safariScene = function () {
    const g = 'ss' + uid++;
    return '<svg class="scenery" viewBox="0 0 800 500" preserveAspectRatio="xMidYMin slice" aria-hidden="true">' +
      `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FD3EA"/><stop offset="1" stop-color="#FBEFC2"/></linearGradient></defs>` +
      `<rect width="800" height="500" fill="url(#${g})"/>` +
      '<circle cx="690" cy="80" r="76" fill="#FFE9A8" opacity=".55"/><circle cx="690" cy="80" r="46" fill="#FFD45E"/>' +
      '<g fill="#fff" opacity=".92"><ellipse cx="120" cy="70" rx="58" ry="17"/><ellipse cx="158" cy="56" rx="34" ry="15"/><ellipse cx="420" cy="104" rx="48" ry="13"/><ellipse cx="452" cy="92" rx="28" ry="11"/></g>' +
      '<path d="M0 190 Q120 130 250 176 T520 168 T800 150 V500 H0Z" fill="#C6D98A"/>' +
      '<path d="M0 230 Q180 180 380 222 T800 200 V500 H0Z" fill="#A8C664"/>' +
      acacia(90, 214, 0.7) + acacia(720, 198, 0.62) + acacia(430, 222, 0.42) +
      '<rect y="240" width="800" height="260" fill="#8FB24C"/></svg>';
  };

})(globalThis.App || (globalThis.App = {}));
