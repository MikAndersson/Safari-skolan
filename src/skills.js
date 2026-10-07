/* Djurkompisarna – färdigheter och frågegeneratorer. Ren logik, ingen DOM. */
(function (App) {
  'use strict';
  const A = App.art, C = App.content;
  const K = (App.skills = {});

  /* ---------- hjälpare ---------- */
  const ONES = ['noll', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva', 'tolv', 'tretton', 'fjorton', 'femton', 'sexton', 'sjutton', 'arton', 'nitton'];
  const TENS = ['', '', 'tjugo', 'trettio', 'fyrtio', 'femtio', 'sextio', 'sjuttio', 'åttio', 'nittio'];
  const w = (n) => (n < 20 ? ONES[n] : n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? ONES[n % 10] : '') : n === 100 ? 'hundra' : String(n));
  K.words = w;

  const num = (n) => `<span class="num" data-len="${String(n).length}">${n}</span>`;
  const qty = (n, o) => (n === 1 ? `${o.g} ${o.sg}` : `${w(n)} ${o.pl}`);
  const list = (arr) => (arr.length < 2 ? arr.join('') : arr.slice(0, -1).join(', ') + ' eller ' + arr[arr.length - 1]);

  /* count talval nära svaret, inom [lo,hi]; extra = vanliga felsvar */
  function numCh(r, ans, count, lo, hi, extra) {
    const out = [ans];
    const add = (x) => { if (x != null && x >= lo && x <= hi && !out.includes(x) && out.length < count) out.push(x); };
    r.shuffle(extra || []).forEach(add);
    r.shuffle([ans - 1, ans + 1, ans - 2, ans + 2, ans - 3, ans + 3]).forEach(add);
    for (let x = lo; x <= hi && out.length < count; x++) add(x);
    return r.shuffle(out);
  }
  const cards = (nums) => nums.map((n) => ({ v: String(n), html: num(n) }));
  const grp = (n, o, extra) => A.group(n, o.h, Object.assign(n > 10 ? { cols: 5 } : {}, extra || {}));

  /* ---------- generatorer: matte ---------- */
  function gGive(max) {
    return (r) => {
      const o = r.chance(0.5) ? C.OBJECTS[0] : r.pick(C.OBJECTS);
      const n = r.int(1, max);
      const total = Math.min(n + r.int(2, 4), max > 10 ? 24 : 12);
      const counted = Array.from({ length: n }, (_, i) => w(i + 1)).join(', ');
      return { kind: 'give', target: n, total, item: o.h, say: `Lägg ${qty(n, o)} i dammen. Tryck en i taget, så räknar vi tillsammans.`, explain: `Vi räknar: ${counted}. Det blir ${w(n)}.` };
    };
  }

  function gNumeral(lo, hi, focusLo) {
    return (r, ctx) => {
      const n = focusLo && r.chance(0.6) ? r.int(focusLo, hi) : r.int(lo, hi);
      const nums = numCh(r, n, ctx.nc, lo, hi);
      if (ctx.mode === 'lesson' || r.chance(0.5)) {
        const o = r.pick(C.OBJECTS);
        const dice = n <= 6 && r.chance(0.4);
        return { kind: 'choice', show: `<div class="vis">${dice ? A.dice(n) : grp(n, o)}</div>`, choices: cards(nums), answer: String(n), say: dice ? 'Hur många prickar är det? Tryck på rätt siffra.' : `Hur många ${o.pl} är det? Tryck på rätt siffra.`, explain: `Det är ${w(n)}. Så här ser siffran ${w(n)} ut.` };
      }
      return { kind: 'choice', show: `<div class="vis hearme">${A.icon('speaker')}</div>`, choices: cards(nums), answer: String(n), say: `Tryck på siffran ${w(n)}.`, explain: `Det här är siffran ${w(n)}.` };
    };
  }

  function gAS(op, max, style) {
    return (r, ctx) => {
      let a, b;
      if (op === '+') {
        if (style === 'ten20' && r.chance(0.6)) { a = r.int(6, 9); b = r.int(11 - a, 9); }
        else { a = r.int(1, max - 1); b = r.int(1, max - a); }
      } else if (style === 'ten20' && r.chance(0.6)) { a = r.int(11, 18); b = r.int(a - 9, 9); }
      else { a = r.int(2, max); b = r.int(1, a - 1); }
      const ans = op === '+' ? a + b : a - b;
      const sign = op === '+' ? '+' : '−';
      const o = r.pick(C.OBJECTS);
      let show;
      if (style === 'pics' || style === 'picsnum') {
        const pics = op === '+' ? `${grp(a, o)}<span class="op">+</span>${grp(b, o)}` : grp(a, o, { cross: b });
        show = `<div class="vis eq">${pics}</div><div class="expr">${a} ${sign} ${b}</div>`;
      } else {
        show = `<div class="expr big">${a} ${sign} ${b}</div>`;
        if (ctx.assist) show += `<div class="vis">${A.tenFrame(Math.min(a, 10))}</div>`;
      }
      return {
        kind: 'choice', show, choices: cards(numCh(r, ans, ctx.nc, 0, max, [a, b])), answer: String(ans),
        say: op === '+' ? `${w(a)} plus ${w(b)}. Hur mycket blir det?` : `${w(a)} minus ${w(b)}. Hur mycket är det kvar?`,
        explain: op === '+' ? `${w(a)} plus ${w(b)} blir ${w(ans)}.` : `${w(a)} minus ${w(b)} är ${w(ans)}.`,
      };
    };
  }

  function gBig(op, carry) {
    return (r, ctx) => {
      let a, b, ans;
      if (op === '+') {
        if (!carry) {
          const kind = r.int(1, 4);
          if (kind === 1) { a = 10 * r.int(1, 8); b = 10 * r.int(1, Math.floor((100 - a) / 10)); }
          else if (kind === 2) { a = 10 * r.int(1, 9); b = r.int(1, 9); }
          else if (kind === 3) { const o1 = r.int(0, 8); a = 10 * r.int(1, 8) + o1; b = r.int(1, 9 - o1); }
          else { a = r.int(11, 79); b = 10 * r.int(1, Math.floor((99 - a) / 10) || 1); if (a + b > 99) b = 10; }
        } else {
          const o1 = r.int(2, 9), o2 = r.int(10 - o1, 9), t1 = r.int(1, 6), t2 = r.int(0, Math.min(5, 8 - t1));
          a = 10 * t1 + o1; b = 10 * t2 + o2;
        }
        ans = a + b;
      } else {
        if (!carry) {
          do {
            const t1 = r.int(2, 9), o1 = r.int(0, 9), t2 = r.int(0, t1 - 1), o2 = r.int(0, o1);
            a = 10 * t1 + o1; b = 10 * t2 + o2;
          } while (b < 1 || b >= a);
        } else {
          const o1 = r.int(0, 8), o2 = r.int(o1 + 1, 9), t1 = r.int(3, 9), t2 = r.int(0, t1 - 2);
          a = 10 * t1 + o1; b = 10 * t2 + o2;
        }
        ans = a - b;
      }
      const sign = op === '+' ? '+' : '−';
      let show = `<div class="expr big">${a} ${sign} ${b}</div>`;
      if (ctx.assist) show += `<div class="vis">${A.blocks(Math.floor(a / 10), a % 10)}</div>`;
      const wrong = op === '+' ? [ans + 10, ans - 10, ans + 1, ans - 1] : [ans + 10, ans - 10, ans + 1, ans - 1];
      return {
        kind: 'choice', show, choices: cards(numCh(r, ans, ctx.nc, 0, 100, wrong)), answer: String(ans),
        say: op === '+' ? `${w(a)} plus ${w(b)}. Hur mycket blir det?` : `${w(a)} minus ${w(b)}. Hur mycket är det kvar?`,
        explain: op === '+' ? `${w(a)} plus ${w(b)} blir ${w(ans)}. Vi räknar tiotalen och entalen var för sig.` : `${w(a)} minus ${w(b)} är ${w(ans)}.`,
      };
    };
  }

  function gTen() {
    return (r, ctx) => {
      const n = r.int(1, 9), ans = 10 - n;
      return { kind: 'choice', show: `<div class="vis">${A.tenFrame(n)}</div>`, choices: cards(numCh(r, ans, ctx.nc, 1, 9, [n])), answer: String(ans), say: `Här är ${w(n)} prickar. Hur många fattas för att fylla rutan med tio?`, explain: `${w(n)} och ${w(ans)} är tio. De är tiokamrater.` };
    };
  }

  function gNext() {
    return (r, ctx) => {
      const after = r.chance(0.65);
      const n = after ? r.int(1, 9) : r.int(2, 10), ans = after ? n + 1 : n - 1;
      const show = after ? `<div class="seq">${num(n)}<span class="slot">?</span></div>` : `<div class="seq"><span class="slot">?</span>${num(n)}</div>`;
      return { kind: 'choice', show, choices: cards(numCh(r, ans, ctx.nc, 1, 10, [n])), answer: String(ans), say: after ? `Vilket tal kommer efter ${w(n)}?` : `Vilket tal kommer före ${w(n)}?`, explain: after ? `Efter ${w(n)} kommer ${w(ans)}.` : `Före ${w(n)} kommer ${w(ans)}.` };
    };
  }

  function gPlace() {
    return (r, ctx) => {
      const t = r.int(1, 9), o = r.int(0, 9), n = 10 * t + o, sw = 10 * o + t;
      const extra = [n + 10, n - 10, n + 1];
      if (sw >= 10 && sw !== n) extra.unshift(sw);
      return {
        kind: 'choice', show: `<div class="vis">${A.blocks(t, o)}</div>`, choices: cards(numCh(r, n, ctx.nc, 10, 99, extra)), answer: String(n),
        say: o === 0 ? `Här är ${w(t)} tiotal. Vilket tal är det?` : `Här är ${w(t)} tiotal och ${w(o)} ental. Vilket tal är det?`,
        explain: o === 0 ? `${w(t)} tiotal är ${w(n)}.` : `${w(t)} tiotal är ${w(t * 10)}. Och ${w(o)} ental till. Det blir ${w(n)}.`,
      };
    };
  }

  function gSkip() {
    return (r, ctx) => {
      const step = r.pick([2, 5, 10, 2, 5]);
      const start = step === 2 ? 2 * r.int(1, 4) : step * r.int(1, 3);
      const seq = [start, start + step, start + 2 * step], ans = start + 3 * step;
      return {
        kind: 'choice', show: `<div class="seq">${seq.map(num).join('')}<span class="slot">?</span></div>`,
        choices: cards(numCh(r, ans, ctx.nc, Math.max(0, ans - step - 2), ans + step + 2, [ans + 1, ans - 1])), answer: String(ans),
        say: `Fortsätt räkna: ${seq.map(w).join(', ')}, och sen?`, explain: `Vi hoppar ${w(step)} åt gången: ${seq.concat([ans]).map(w).join(', ')}.`,
      };
    };
  }

  function gClock(half) {
    return (r, ctx) => {
      const h = r.int(1, 12), nxt = (h % 12) + 1, m = half ? 30 : 0;
      let pool = [];
      for (let i = 1; i <= 12; i++) if (i !== h) pool.push({ h: i, m });
      pool = r.shuffle(pool);
      if (half && r.chance(0.6)) pool.unshift({ h: nxt, m: 0 });
      const opts = r.shuffle([{ h, m }].concat(pool.slice(0, ctx.nc - 1)));
      return {
        kind: 'choice', cardClass: 'wide', show: '', choices: opts.map((o) => ({ v: `${o.h}:${o.m}`, html: A.clock(o.h, o.m) })), answer: `${h}:${m}`,
        say: half ? `Hitta klockan som visar halv ${w(nxt)}.` : `Hitta klockan som visar ${w(h)}.`,
        explain: half ? `Den långa visaren pekar på sex. Det är en halv timme efter ${w(h)}. Det säger vi halv ${w(nxt)}.` : `Den korta visaren pekar på ${w(h)} och den långa pekar på tolv.`,
      };
    };
  }

  function gMoney() {
    return (r, ctx) => {
      let coins, sum;
      do {
        const k = r.int(2, 4);
        coins = [];
        for (let i = 0; i < k; i++) coins.push(r.pick([1, 2, 5, 10, 5, 2]));
        sum = coins.reduce((a, b) => a + b, 0);
      } while (sum > 20 || sum < 3);
      coins.sort((a, b) => b - a);
      let t = 0;
      const steps = coins.map((c) => w((t += c))).join(', ');
      return { kind: 'choice', show: `<div class="vis coins">${coins.map((c) => A.coin(c)).join('')}</div>`, choices: cards(numCh(r, sum, ctx.nc, 1, 25, [sum + 1, sum - 1, sum + 2, sum - 2])), answer: String(sum), say: 'Hur många kronor är det tillsammans?', explain: `Vi räknar från det största myntet: ${steps}. Det är ${w(sum)} kronor.` };
    };
  }

  /* ---------- generatorer: zebran ---------- */
  const SHAPES = {
    circle: ['cirkeln', 'En cirkel är rund och har inga hörn.'], square: ['kvadraten', 'En kvadrat har fyra lika långa sidor.'],
    triangle: ['triangeln', 'En triangel har tre hörn.'], rectangle: ['rektangeln', 'En rektangel har fyra hörn, två långa och två korta sidor.'],
  };
  function gShapes() {
    return (r, ctx) => {
      const ks = r.shuffle(Object.keys(SHAPES)), ans = ks[0], cols = r.shuffle(Object.keys(A.TOK));
      const opts = r.shuffle(ks.slice(0, ctx.nc));
      return { kind: 'choice', show: '', choices: opts.map((k, i) => ({ v: k, html: A.shape(k, cols[i]) })), answer: ans, say: `Tryck på ${SHAPES[ans][0]}.`, explain: `Det här är ${SHAPES[ans][0]}. ${SHAPES[ans][1]}` };
    };
  }

  function gMatch() {
    return (r, ctx) => {
      const n = r.int(1, 6), o1 = r.pick(C.OBJECTS), o2 = r.pick(C.OBJECTS.filter((x) => x !== o1));
      return { kind: 'choice', show: `<div class="vis">${grp(n, o1)}</div>`, choices: numCh(r, n, ctx.nc, 1, 7).map((k) => ({ v: String(k), html: `<span class="grpcard">${grp(k, o2)}</span>` })), answer: String(n), say: 'Hitta lika många. Tryck på kortet som har lika många.', explain: `Här är ${w(n)}. Det här kortet har också ${w(n)}.` };
    };
  }

  function gMore() {
    return (r) => {
      let a = r.int(1, 9), b = r.int(1, 9);
      while (b === a) b = r.int(1, 9);
      const o = r.pick(C.OBJECTS), most = r.chance(0.65), hi = Math.max(a, b), lo = Math.min(a, b);
      return {
        kind: 'choice', cardClass: 'wide', show: '', choices: [{ v: 'A', html: `<span class="grpcard">${grp(a, o)}</span>` }, { v: 'B', html: `<span class="grpcard">${grp(b, o)}</span>` }],
        answer: most ? (a > b ? 'A' : 'B') : (a < b ? 'A' : 'B'), say: most ? 'Vilken grupp har flest?' : 'Vilken grupp har minst?',
        explain: most ? `${w(hi)} är fler än ${w(lo)}.` : `${w(lo)} är färre än ${w(hi)}.`,
      };
    };
  }

  function mkTokens(r, k, vary) {
    const cols = r.shuffle(Object.keys(A.TOK)).slice(0, k), shp = r.shuffle(['circle', 'square', 'triangle']);
    return cols.map((c, i) => ({ s: vary ? shp[i % 3] : 'circle', c }));
  }
  function gPattern(level) {
    return (r, ctx) => {
      const pat = level === 1 ? 'AB' : r.pick(['AAB', 'ABB', 'ABC', 'AABB']);
      const k = new Set(pat.split('')).size;
      const toks = mkTokens(r, Math.max(k, 3), level !== 1);
      const map = { A: toks[0], B: toks[1], C: toks[2] };
      const L = pat.length * 2 + (level === 1 ? r.int(1, 2) : r.int(0, 1));
      const seq = [];
      for (let i = 0; i < L; i++) seq.push(map[pat[i % pat.length]]);
      const ans = map[pat[L % pat.length]];
      const key = (t) => `${t.s}-${t.c}`;
      const opts = [ans].concat(r.shuffle(toks.filter((t) => key(t) !== key(ans)))).slice(0, ctx.nc);
      return {
        kind: 'choice', show: `<div class="seq tokens">${seq.map((t) => A.tok(t)).join('')}<span class="slot">?</span></div>`,
        choices: r.shuffle(opts).map((t) => ({ v: key(t), html: A.tok(t) })), answer: key(ans),
        say: level === 1 ? 'Vilken färg kommer sen i mönstret?' : 'Vad kommer sen i mönstret? Tryck på rätt form.', explain: 'Titta hur mönstret upprepar sig. Då kommer den här sen.',
      };
    };
  }

  function gOddEven() {
    return (r) => {
      const n = r.int(2, 15), o = r.pick(C.OBJECTS);
      let rows = '';
      for (let i = 0; i < Math.floor(n / 2); i++) rows += `<span class="pair">${o.h}${o.h}</span>`;
      if (n % 2) rows += `<span class="pair single">${o.h}</span>`;
      return {
        kind: 'choice', show: `<div class="vis pairs">${rows}</div>`, cardClass: 'wide',
        choices: [{ v: 'even', html: '<span class="word">Jämnt</span>' }, { v: 'odd', html: '<span class="word">Udda</span>' }], answer: n % 2 ? 'odd' : 'even',
        say: `Är ${w(n)} jämnt eller udda?`, explain: n % 2 ? `När vi parar ihop ${w(n)} blir en över. Därför är det udda.` : `När vi parar ihop ${w(n)} får alla en kompis. Därför är det jämnt.`,
      };
    };
  }

  function gDouble() {
    return (r, ctx) => {
      const o = r.pick(C.OBJECTS);
      if (r.chance(0.6)) {
        const n = r.int(1, 10), ans = 2 * n;
        return { kind: 'choice', show: `<div class="vis eq">${grp(n, o)}<span class="op">+</span>${grp(n, o)}</div>`, choices: cards(numCh(r, ans, ctx.nc, 0, 20, [n, ans + 2, ans - 2])), answer: String(ans), say: `Vad är dubbelt så många som ${w(n)}?`, explain: `Dubbelt är lika många en gång till. ${w(n)} plus ${w(n)} är ${w(ans)}.` };
      }
      const h = r.int(1, 10), n = 2 * h;
      const show = ctx.assist ? `<div class="vis eq">${grp(h, o)}<span class="op">|</span>${grp(h, o)}</div>` : `<div class="vis">${grp(n, o)}</div>`;
      return { kind: 'choice', show, choices: cards(numCh(r, h, ctx.nc, 0, 20, [n, h + 1, h - 1])), answer: String(h), say: `Vad är hälften av ${w(n)}?`, explain: `Hälften är när vi delar lika på två. ${w(n)} delat på två är ${w(h)}.` };
    };
  }

  function gArrays() {
    return (r, ctx) => {
      const rr = r.int(2, 5), cc = r.int(2, 6), ans = rr * cc;
      return { kind: 'choice', show: `<div class="vis">${A.array(rr, cc)}</div>`, choices: cards(numCh(r, ans, ctx.nc, 2, 30, [ans + cc, ans - cc, ans + rr, ans - rr])), answer: String(ans), say: `Här är ${w(rr)} rader med ${w(cc)} i varje. Hur många är det tillsammans?`, explain: `${w(rr)} rader med ${w(cc)} i varje: ${Array(rr).fill(w(cc)).join(' plus ')}. Tillsammans är det ${w(ans)}.` };
    };
  }

  function gMult() {
    return (r, ctx) => {
      const a = r.pick([2, 3, 4, 5, 10, 2, 5]), b = r.int(1, 10), ans = a * b;
      let show = `<div class="expr big">${a} × ${b}</div>`;
      if (ctx.assist && ans <= 40) show += `<div class="vis">${A.array(a, b)}</div>`;
      return { kind: 'choice', show, choices: cards(numCh(r, ans, ctx.nc, 0, 100, [a * (b + 1), a * (b - 1), a + b])), answer: String(ans), say: `${w(a)} gånger ${w(b)}. Hur mycket är det?`, explain: `${w(a)} gånger ${w(b)} betyder ${w(a)} grupper med ${w(b)}. Det blir ${w(ans)}.` };
    };
  }

  /* ---------- generatorer: läsning ---------- */
  const lettersUpTo = (k) => { let s = ''; for (let i = 1; i <= k; i++) s += C.SETS[i]; return s.split(''); };
  const letterCard = (ch) => ({ v: ch, html: `<span class="letter">${ch}</span>` });
  const emoCard = (e, v) => ({ v: v || e, html: `<span class="obj emo big">${e}</span>` });

  function gLetter(set) {
    return (r, ctx) => {
      const own = C.SETS[set].split(''), pool = lettersUpTo(set);
      const ans = r.pick(own), cue = C.FIRST[ans][0];
      const opts = [ans].concat(r.shuffle(pool.filter((x) => x !== ans)).slice(0, ctx.nc - 1));
      return { kind: 'choice', show: `<div class="vis"><span class="obj emo huge">${cue[1]}</span></div>`, choices: r.shuffle(opts).map(letterCard), answer: ans, say: `${ans} som i ${cue[0]}. Tryck på bokstaven ${ans}.`, explain: `Det här är ${cue[0]}, och ${cue[0]} börjar på ${ans}.` };
    };
  }

  function gLower() {
    return (r, ctx) => {
      const pool = lettersUpTo(3), ans = r.pick(pool);
      const opts = [ans].concat(r.shuffle(pool.filter((x) => x !== ans)).slice(0, ctx.nc - 1));
      const lc = (x) => x.toLowerCase();
      return { kind: 'choice', show: `<div class="vis"><span class="letter huge">${ans}</span></div>`, choices: r.shuffle(opts).map((x) => ({ v: lc(x), html: `<span class="letter">${lc(x)}</span>` })), answer: lc(ans), say: `Hitta den lilla bokstaven som hör ihop med stora ${ans}.`, explain: `Stora ${ans} och lilla ${lc(ans)} är samma bokstav.` };
    };
  }

  function gFirst(set) {
    return (r, ctx) => {
      const pool = lettersUpTo(set), L = r.pick(pool), [word, pic] = r.pick(C.FIRST[L]);
      const opts = [L].concat(r.shuffle(pool.filter((x) => x !== L)).slice(0, ctx.nc - 1));
      return { kind: 'choice', show: `<div class="vis"><span class="obj emo huge">${pic}</span></div>`, choices: r.shuffle(opts).map(letterCard), answer: L, say: `Vilken bokstav börjar ordet ${word} på?`, explain: `${word} börjar på ${L}.` };
    };
  }

  function gRhyme() {
    return (r, ctx) => {
      const pair = r.pick(C.RHYMES), flip = r.chance(0.5);
      const x = pair[flip ? 1 : 0], y = pair[flip ? 0 : 1];
      const bad = new Set([x[0], y[0], 'bro']);
      const tail = x[0].slice(-2);
      const dis = r.shuffle(C.WORDS.filter((p) => !bad.has(p[0]) && p[0].slice(-2) !== tail)).slice(0, ctx.nc - 1);
      const opts = r.shuffle([y].concat(dis));
      return { kind: 'choice', show: `<div class="vis"><span class="obj emo huge">${x[1]}</span></div>`, choices: opts.map((p) => emoCard(p[1], p[0])), answer: y[0], say: `Vad rimmar på ${x[0]}? Är det ${list(opts.map((p) => p[0]))}?`, explain: `${x[0]} och ${y[0]} rimmar. De låter lika på slutet.` };
    };
  }

  function wordsFor(maxSet, minLen, maxLen) {
    const ok = new Set(lettersUpTo(maxSet));
    return C.WORDS.filter((p) => p[0].length >= minLen && p[0].length <= maxLen && p[0].toUpperCase().split('').every((c) => ok.has(c)));
  }
  function gBuild(maxSet, minLen, maxLen) {
    return (r, ctx) => {
      const [word, pic] = r.pick(wordsFor(maxSet, minLen, maxLen));
      const letters = word.toUpperCase().split(''), pool = lettersUpTo(maxSet).filter((c) => !letters.includes(c));
      const tray = r.shuffle(letters.concat(r.shuffle(pool).slice(0, ctx.assist ? 1 : 2))).map((ch, id) => ({ id, ch }));
      return { kind: 'build', word, pic, letters, tray, say: `Bygg ordet ${word}. Tryck på bokstäverna i rätt ordning.`, explain: `${word} stavas ${letters.join(', ')}.` };
    };
  }

  function gWord(maxSet, minLen, maxLen) {
    return (r, ctx) => {
      const [word, pic] = r.pick(wordsFor(maxSet, minLen, maxLen));
      const dis = r.shuffle(C.WORDS.filter((p) => p[1] !== pic)).slice(0, ctx.nc - 1);
      return { kind: 'choice', show: `<div class="word big">${word}</div>`, choices: r.shuffle([[word, pic]].concat(dis)).map((p) => emoCard(p[1])), answer: pic, say: 'Läs ordet. Tryck på bilden som passar.', explain: `Det står ${word}.` };
    };
  }

  function gSent() {
    return (r, ctx) => {
      const it = r.pick(C.SENT), dis = r.shuffle(it.d).slice(0, ctx.nc - 1);
      return { kind: 'choice', show: `<div class="sentence">${it.s}</div>`, listen: it.s, choices: r.shuffle([it.a].concat(dis)).map((e) => emoCard(e)), answer: it.a, say: 'Läs meningen. Tryck på bilden som passar.', explain: `Det står: ${it.s}` };
    };
  }

  function gTF() {
    return (r) => {
      const [t, truth] = r.pick(C.TF);
      return {
        kind: 'choice', cardClass: 'wide', show: `<div class="sentence">${t}</div>`, listen: t,
        choices: [{ v: 'yes', html: `${A.icon('thumbup', 'thumb up')}<span class="word">Ja</span>` }, { v: 'no', html: `${A.icon('thumbdown', 'thumb down')}<span class="word">Nej</span>` }],
        answer: truth ? 'yes' : 'no', say: 'Läs meningen. Stämmer det?', explain: truth ? 'Ja, det stämmer.' : 'Nej, det stämmer inte.',
      };
    };
  }

  function gStory(bank) {
    return (r, ctx) => {
      const it = r.pick(C[bank]), dis = r.shuffle(it.d).slice(0, ctx.nc - 1);
      return {
        kind: 'choice', cardClass: 'text', show: `<div class="story">${it.t}</div><div class="qline">${it.q}</div>`, listen: `${it.t} ${it.q}`,
        choices: r.shuffle([it.a].concat(dis)).map((s) => ({ v: s, html: `<span class="word">${s}</span>` })), answer: it.a, say: 'Läs berättelsen. Svara sedan på frågan.', explain: `Rätt svar är: ${it.a}.`,
      };
    };
  }

  /* ---------- färdighetslistan ---------- */
  const list_ = [], byId = {};
  function def(id, track, place, lvl, name, prereq, intro, gen) {
    const s = { id, track, place, lvl, name, prereq, intro, gen };
    list_.push(s); byId[id] = s;
  }
  // zebran
  def('z_shapes', 'm', 'zebra', 'F', 'Former', [], 'Nu ska vi lära oss former! Lyssna och tryck på rätt form.', gShapes());
  def('z_match', 'm', 'zebra', 'F', 'Lika många', [], 'Nu hittar vi lika många! Titta på bilden och tryck på kortet som har lika många.', gMatch());
  def('z_more', 'm', 'zebra', 'F', 'Flest och minst', ['z_match'], 'Vilken grupp har flest, och vilken har minst? Titta noga!', gMore());
  def('z_pat1', 'm', 'zebra', 'F', 'Mönster med färger', [], 'Ett mönster är något som upprepas. Titta på färgerna och se vad som kommer sen.', gPattern(1));
  def('z_pat2', 'm', 'zebra', '1', 'Svårare mönster', ['z_pat1'], 'Nu blir mönstren lite klurigare. Hitta det som upprepas!', gPattern(2));
  def('z_oddeven', 'm', 'zebra', '2', 'Jämna och udda tal', ['m_num10'], 'Jämnt eller udda? Är det jämnt får alla en kompis. Är det udda blir en över.', gOddEven());
  def('z_double', 'm', 'zebra', '2', 'Dubbelt och hälften', ['m_add10'], 'Dubbelt är lika många en gång till. Hälften är när man delar lika på två.', gDouble());
  def('z_arrays', 'm', 'zebra', '3', 'Rader och kolumner', ['z_double'], 'Titta, prickar i rader! Räkna hur många det är tillsammans.', gArrays());
  def('z_mult', 'm', 'zebra', '3', 'Multiplikation', ['z_arrays'], 'Gånger betyder grupper med lika många. Nu tränar vi tabellerna!', gMult());
  // bävern
  def('m_count5', 'm', 'beaver', 'F', 'Räkna 1–5', [], 'Nu ska vi bygga damm! Lägg stockar i dammen och räkna med mig.', gGive(5));
  def('m_count10', 'm', 'beaver', 'F', 'Räkna 1–10', ['m_count5'], 'Nu räknar vi ännu fler! Tryck på en i taget.', gGive(10));
  def('m_count20', 'm', 'beaver', '1', 'Räkna 1–20', ['m_count10'], 'Nu bygger vi en riktigt stor damm! Räkna ända till tjugo.', gGive(20));
  def('m_add5', 'm', 'beaver', 'F', 'Plus inom 5', ['m_count5', 'm_num5'], 'Plus betyder att vi lägger ihop. Titta hur många det blir tillsammans!', gAS('+', 5, 'pics'));
  def('m_sub5', 'm', 'beaver', 'F', 'Minus inom 5', ['m_add5'], 'Minus betyder att något tas bort. Hur många är kvar?', gAS('-', 5, 'pics'));
  def('m_add10', 'm', 'beaver', '1', 'Plus inom 10', ['m_add5', 'm_count10', 'm_num10'], 'Nu lägger vi ihop tal upp till tio.', gAS('+', 10, 'picsnum'));
  def('m_sub10', 'm', 'beaver', '1', 'Minus inom 10', ['m_sub5', 'm_add10'], 'Nu tar vi bort tal, upp till tio.', gAS('-', 10, 'picsnum'));
  def('m_ten', 'm', 'beaver', '1', 'Tiokamrater', ['m_add10'], 'Vissa tal är kompisar som tillsammans blir tio. Hur många fattas?', gTen());
  def('m_add20', 'm', 'beaver', '1', 'Plus inom 20', ['m_ten', 'm_num20'], 'Nu lägger vi ihop större tal. Det går bra att fylla upp till tio först!', gAS('+', 20, 'ten20'));
  def('m_sub20', 'm', 'beaver', '1', 'Minus inom 20', ['m_add20', 'm_sub10'], 'Nu tar vi bort från större tal. Ta det i två steg, via tio.', gAS('-', 20, 'ten20'));
  def('m_add100a', 'm', 'beaver', '2', 'Plus inom 100', ['m_add20', 'm_place'], 'Nu räknar vi med tiotal och ental!', gBig('+', false));
  def('m_sub100a', 'm', 'beaver', '2', 'Minus inom 100', ['m_sub20', 'm_add100a'], 'Nu tar vi bort tiotal och ental.', gBig('-', false));
  def('m_add100b', 'm', 'beaver', '3', 'Plus med växling', ['m_add100a'], 'När entalen blir tio eller fler växlar vi till ett nytt tiotal.', gBig('+', true));
  def('m_sub100b', 'm', 'beaver', '3', 'Minus med växling', ['m_sub100a', 'm_add100b'], 'Ibland måste vi växla ett tiotal till tio ental för att kunna ta bort.', gBig('-', true));
  // elefanten: tal, tid, pengar
  def('m_num5', 'm', 'elephant', 'F', 'Siffrorna 1–5', [], 'Siffror är bilder av tal. Titta på siffran och lyssna på mig!', gNumeral(1, 5));
  def('m_num10', 'm', 'elephant', 'F', 'Siffrorna 1–10', ['m_num5'], 'Nu lär vi oss siffrorna ända till tio!', gNumeral(1, 10, 6));
  def('m_num20', 'm', 'elephant', '1', 'Siffrorna 11–20', ['m_num10'], 'Nu går vi förbi tio! Tal som 12 och 17.', gNumeral(10, 20));
  def('m_next', 'm', 'elephant', 'F', 'Före och efter', ['m_num10'], 'Vilket tal kommer före och efter? Vi räknar tillsammans!', gNext());
  def('m_place', 'm', 'elephant', '2', 'Tiotal och ental', ['m_num20'], 'Tal har tiotal och ental. Titta på klossarna!', gPlace());
  def('m_skip', 'm', 'elephant', '2', 'Hoppräkning', ['m_add10', 'm_next'], 'Hoppa och räkna! Vi räknar två, fem eller tio åt gången.', gSkip());
  def('m_clock1', 'm', 'elephant', '1', 'Klockan, hel timme', ['m_num10'], 'Klockan visar vad tiden är. Den korta visaren visar timmen.', gClock(false));
  def('m_clock2', 'm', 'elephant', '2', 'Klockan, halv', ['m_clock1'], 'Halv betyder en halv timme. När den långa visaren pekar på sex är klockan halv.', gClock(true));
  def('m_money', 'm', 'elephant', '2', 'Pengar', ['m_add10', 'm_num20'], 'Nu räknar vi pengar! Vi lägger ihop kronor.', gMoney());
  // elefanten: läsning
  def('l_word1', 'l', 'elephant', '1', 'Läsa korta ord', ['l_build1', 'l_lower'], 'Nu läser vi riktiga ord! Titta på ordet och tryck på bilden som passar.', gWord(2, 2, 5));
  def('l_word2', 'l', 'elephant', '1', 'Läsa längre ord', ['l_build2', 'l_word1'], 'Längre ord! Ljuda bokstav för bokstav.', gWord(4, 3, 9));
  def('l_sent', 'l', 'elephant', '2', 'Läsa meningar', ['l_word2'], 'Nu läser vi hela meningar!', gSent());
  def('l_tf', 'l', 'elephant', '2', 'Stämmer det?', ['l_sent'], 'Stämmer det? Läs meningen och tryck på tummen upp eller tummen ned.', gTF());
  def('l_story1', 'l', 'elephant', '2', 'Korta berättelser', ['l_sent'], 'Nu läser vi korta berättelser och svarar på frågor.', gStory('STORY1'));
  def('l_story2', 'l', 'elephant', '3', 'Längre berättelser', ['l_story1', 'l_tf'], 'Längre berättelser! Tänk efter vad som står mellan raderna.', gStory('STORY2'));
  // lejonet
  def('l_let1', 'l', 'lion', 'F', 'Bokstäver A M S O T', [], 'Lejonet ryter bokstäver! Lyssna och tryck på rätt bokstav.', gLetter(1));
  def('l_let2', 'l', 'lion', 'F', 'Bokstäver B L K H F', ['l_let1'], 'Fler bokstäver! Lyssna på lejonet.', gLetter(2));
  def('l_let3', 'l', 'lion', '1', 'Bokstäver E P R N D G V', ['l_let2'], 'Nu ryter lejonet ännu fler bokstäver!', gLetter(3));
  def('l_let4', 'l', 'lion', '1', 'Bokstäver I J U Y Å Ä Ö', ['l_let3'], 'Sista bokstäverna! Nu kan du hela alfabetet nästan.', gLetter(4));
  def('l_lower', 'l', 'lion', '1', 'Stora och små bokstäver', ['l_let2'], 'Varje bokstav har en stor och en liten version.', gLower());
  def('l_rhyme', 'l', 'lion', 'F', 'Rim', [], 'Rim låter lika på slutet, som hus och mus! Lyssna noga.', gRhyme());
  def('l_first1', 'l', 'lion', 'F', 'Första bokstaven (1)', ['l_let2'], 'Vilken bokstav börjar ordet på? Tryck på bokstaven.', gFirst(2));
  def('l_first2', 'l', 'lion', '1', 'Första bokstaven (2)', ['l_let4', 'l_first1'], 'Nu med alla bokstäverna! Vilken bokstav börjar ordet på?', gFirst(4));
  def('l_build1', 'l', 'lion', '1', 'Bygga korta ord', ['l_let2', 'l_first1'], 'Nu bygger vi ord! Tryck på bokstäverna i rätt ordning.', gBuild(2, 2, 5));
  def('l_build2', 'l', 'lion', '1', 'Bygga längre ord', ['l_let4', 'l_build1'], 'Nu bygger vi längre ord med alla bokstäver!', gBuild(4, 3, 8));

  /* Värddjuret bestäms av innehållet: svårare färdigheter hör till djur som kommer senare. */
  list_.forEach((s) => {
    const host = App.content && App.content.HOST && App.content.HOST[s.id];
    if (!host) throw new Error('Saknar värddjur för ' + s.id);
    s.place = host;
  });
  K.list = list_;
  K.byId = byId;

  /* Skapar en fråga. ctx: { assist, mode } */
  K.makeQuestion = function (id, r, ctx) {
    ctx = Object.assign({ assist: false, mode: 'practice' }, ctx || {});
    ctx.nc = ctx.assist ? 2 : 3;
    const sk = byId[id];
    for (let tries = 0; tries < 8; tries++) {
      const q = sk.gen(r, ctx);
      q.skill = id;
      q.key = q.say + (q.answer || q.word || q.target);
      if (q.kind !== 'choice') return q;
      const vs = q.choices.map((c) => c.v);
      if (vs.length >= 2 && new Set(vs).size === vs.length && vs.includes(q.answer)) return q;
    }
    throw new Error('Kunde inte skapa fråga för ' + id);
  };
})(globalThis.App || (globalThis.App = {}));
