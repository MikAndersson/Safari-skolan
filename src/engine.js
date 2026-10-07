/* Djurkompisarna – motor: spelarens framsteg, nivåplacering, rundplanering. Ren logik. */
(function (App) {
  'use strict';
  const K = App.skills, C = App.content;
  const E = (App.engine = {});
  const DAY = 24 * 3600 * 1000;
  const INTERVAL = [0, 1, 3, 7, 14, 30]; // dagar mellan repetitioner per "box"

  /* ---------- slumptal ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  E.makeRng = function (seed) {
    const f = seed == null ? Math.random : mulberry32(seed);
    return {
      f,
      int: (a, b) => a + Math.floor(f() * (b - a + 1)),
      pick: (arr) => arr[Math.floor(f() * arr.length)],
      chance: (p) => f() < p,
      shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
      },
    };
  };

  /* ---------- föräldrafrågor för startnivå ---------- */
  const opt = (label, skills, hint) => ({ label, skills: skills || [], hint });
  E.WIZARD = [
    { id: 'count', track: 'Matte', title: 'Räkna föremål', text: 'Hur långt kan barnet räkna föremål genom att peka på ett i taget?', multi: false, options: [
      opt('Inte än'), opt('Upp till 5', ['m_count5']), opt('Upp till 10', ['m_count10']), opt('Upp till 20', ['m_count20']) ] },
    { id: 'digits', track: 'Matte', title: 'Siffror', text: 'Vilka siffror känner barnet igen?', multi: false, options: [
      opt('Inga än'), opt('1–5', ['m_num5']), opt('1–10', ['m_num10', 'm_next', 'z_match', 'z_more']), opt('1–20', ['m_num20', 'm_clock1']), opt('Tal till 100', ['m_place']) ] },
    { id: 'calc', track: 'Matte', title: 'Plus och minus', text: 'Hur långt kommer barnet med plus och minus?', multi: false, options: [
      opt('Inte än'), opt('Med bilder inom 5', ['m_add5', 'm_sub5']), opt('Inom 10', ['m_add10', 'm_sub10', 'm_ten']), opt('Inom 20', ['m_add20', 'm_sub20']),
      opt('Inom 100, utan växling', ['m_add100a', 'm_sub100a']), opt('Inom 100, med växling', ['m_add100b', 'm_sub100b']) ] },
    { id: 'more', track: 'Matte', title: 'Annat i matte', text: 'Vad av detta kan barnet redan? Välj alla som stämmer.', multi: true, options: [
      opt('Former (cirkel, kvadrat, triangel)', ['z_shapes']), opt('Mönster', ['z_pat1', 'z_pat2']), opt('Jämna och udda tal', ['z_oddeven']),
      opt('Dubbelt och hälften', ['z_double']), opt('Hoppräkning (2, 5, 10)', ['m_skip']), opt('Klockan, hel timme', ['m_clock1']),
      opt('Klockan, halv', ['m_clock2']), opt('Pengar', ['m_money']), opt('Multiplikation', ['z_arrays', 'z_mult']) ] },
    { id: 'letters', track: 'Läsning', title: 'Bokstäver', text: 'Hur många bokstäver känner barnet igen?', multi: false, options: [
      opt('Inga än'), opt('Några stycken', ['l_let1']), opt('Ungefär hälften', ['l_let2']), opt('De flesta', ['l_let3', 'l_lower']), opt('Alla', ['l_let4']) ] },
    { id: 'sounds', track: 'Läsning', title: 'Ljud och ord', text: 'Hur långt har barnet kommit med ljud och att bygga ord?', multi: false, options: [
      opt('Inte än'), opt('Hör rim och första ljudet i ord', ['l_rhyme', 'l_first1']), opt('Kan ljuda ihop korta ord, som SOL', ['l_rhyme', 'l_first1', 'l_build1']),
      opt('Kan ljuda ihop längre ord', ['l_rhyme', 'l_first1', 'l_first2', 'l_build2']) ] },
    { id: 'reading', track: 'Läsning', title: 'Läsning', text: 'Hur långt kommer barnet när det läser själv?', multi: false, options: [
      opt('Läser inte än'), opt('Enstaka korta ord', ['l_word1']), opt('Längre ord', ['l_word2']), opt('Korta meningar', ['l_sent']),
      opt('Korta berättelser', ['l_tf', 'l_story1']), opt('Längre berättelser med förståelse', ['l_story2']) ] },
  ];

  /* answers: { frågeid: indexnummer | [indexnummer] } -> lista med färdigheter som markeras som kända */
  E.placementFrom = function (answers) {
    const known = new Set();
    E.WIZARD.forEach((q) => {
      const a = answers[q.id];
      if (a == null) return;
      if (q.multi) (a || []).forEach((i) => q.options[i].skills.forEach((s) => known.add(s)));
      else {
        // "upp till" – allt på lägre steg i samma fråga räknas också
        for (let i = 0; i <= a; i++) q.options[i].skills.forEach((s) => known.add(s));
      }
    });
    return closure(Array.from(known));
  };
  function closure(ids) {
    const out = new Set();
    const visit = (id) => { if (out.has(id) || !K.byId[id]) return; out.add(id); K.byId[id].prereq.forEach(visit); };
    ids.forEach(visit);
    return Array.from(out);
  }

  /* ---------- spelare ---------- */
  const newSkill = () => ({ n: 0, h: [], p: 0, seen: false, mastered: false, placed: false, box: 0, due: 0, last: 0, relessons: 0 });
  /* Fyller på färdigheter som tillkommit sedan spelaren sparades. */
  E.ensureSkills = (pl) => { K.list.forEach((s) => { if (!pl.sk[s.id]) pl.sk[s.id] = newSkill(); }); E.ensureSafari(pl); return pl; };
  /* Anropas när en lektion visas, så att en omlektion bara visas två gånger. */
  E.markLesson = (pl, id) => { const k = pl.sk[id]; if (k.n > 0) k.relessons = (k.relessons || 0) + 1; k.seen = true; };

  E.newPlayer = function (o) {
    const now = o.now || Date.now();
    const pl = {
      id: o.id || 'p' + now.toString(36) + Math.floor(Math.random() * 1e4).toString(36),
      name: o.name || '', animal: o.animal || 'beaver', created: now, sk: {}, stars: 0, gold: 0,
      rounds: 0, lastPlace: null, settings: { voice: true, sfx: true }, safari: E.newSafari(),
    };
    K.list.forEach((s) => { pl.sk[s.id] = newSkill(); });
    E.applyKnown(pl, o.known || [], now);
    // Det som barnet redan kan finns redan i safarit. De fyra första djuren får barnet själv välja plats åt.
    E.syncSafari(pl, { auto: true, startersPending: true });
    return pl;
  };

  E.applyKnown = function (pl, ids, now) {
    const set = new Set(closure(ids));
    set.forEach((id) => {
      const k = pl.sk[id] || (pl.sk[id] = newSkill());
      k.mastered = true; k.placed = true; k.seen = true; k.p = Math.max(k.p, 0.8); k.box = Math.max(k.box, 2); k.due = now + 3 * DAY;
    });
    // de högsta kända färdigheterna kollas direkt, så att en för hög startnivå rättas till snabbt
    set.forEach((id) => {
      const isTip = !K.list.some((s) => set.has(s.id) && s.prereq.includes(id));
      if (isTip) pl.sk[id].due = now;
    });
  };

  const isUnlocked = (pl, id) => K.byId[id].prereq.every((p) => pl.sk[p] && pl.sk[p].mastered);
  E.status = function (pl, id) {
    const k = pl.sk[id];
    if (k && k.mastered) return 'mastered';
    if (!isUnlocked(pl, id)) return 'locked';
    return k && k.n > 0 ? 'learning' : 'new';
  };
  E.needsAssist = (pl, id) => { const k = pl.sk[id]; return !!k && k.n >= 3 && k.p < 0.5; };

  E.setMastered = function (pl, id, val, now) {
    now = now || Date.now();
    if (val) E.applyKnown(pl, [id], now);
    else { const k = pl.sk[id]; k.mastered = false; k.h = []; k.p = Math.min(k.p, 0.5); }
  };

  /* ---------- registrera svar ---------- */
  /* result: 'first' (rätt på första försöket) | 'second' | 'revealed' */
  E.record = function (pl, id, result, now) {
    now = now || Date.now();
    const k = pl.sk[id] || (pl.sk[id] = newSkill());
    const ok = result === 'first';
    const target = ok ? 1 : result === 'second' ? 0.5 : 0;
    k.p += (target - k.p) * 0.25;
    k.n++; k.last = now; k.seen = true;
    k.h.push(ok ? 1 : 0);
    if (k.h.length > 8) k.h.shift();
    const events = [];
    if (k.mastered) {
      if (ok) { k.box = Math.min(k.box + 1, 5); k.due = now + INTERVAL[k.box] * DAY; }
      else {
        k.box = Math.max(k.box - 1, 0); k.due = now + 10 * 60 * 1000;
        const last2 = k.h.slice(-2);
        if (last2.length === 2 && last2[0] === 0 && last2[1] === 0) { k.mastered = false; k.placed = false; events.push({ t: 'demoted', id }); }
      }
    } else {
      const last6 = k.h.slice(-6), good = last6.reduce((a, b) => a + b, 0);
      if (k.h.length >= 6 && good >= 5 && k.p >= 0.7) {
        k.mastered = true; k.box = 1; k.due = now + DAY;
        events.push({ t: 'mastered', id });
        K.list.forEach((s) => {
          if (s.prereq.includes(id) && isUnlocked(pl, s.id) && !pl.sk[s.id].mastered && pl.sk[s.id].n === 0) events.push({ t: 'unlocked', id: s.id });
        });
      }
    }
    return events;
  };

  /* ---------- planera en runda ---------- */
  function lowestPrereq(pl, s) {
    const cand = s.prereq.map((id) => K.byId[id]).filter((x) => pl.sk[x.id].mastered);
    if (!cand.length) return null;
    return cand.sort((a, b) => pl.sk[a.id].p - pl.sk[b.id].p)[0];
  }

  E.planRound = function (pl, placeId, r, now) {
    now = now || Date.now();
    const inPlace = K.list.filter((s) => s.place === placeId);
    const front = inPlace.filter((s) => { const st = E.status(pl, s.id); return st === 'new' || st === 'learning'; });
    const due = inPlace.filter((s) => pl.sk[s.id].mastered && pl.sk[s.id].due <= now).sort((a, b) => pl.sk[a.id].due - pl.sk[b.id].due);
    const items = [];
    const push = (s, mode) => items.push({ skill: s.id, mode });
    if (front.length) {
      const f0 = front[0], k0 = pl.sk[f0.id];
      const f1 = front.slice(1).find((s) => pl.sk[s.id].seen);
      const needsLesson = !k0.seen || (k0.n >= 8 && k0.p < 0.4 && (k0.relessons || 0) < 2); // fastnat: visa lektionen igen
      if (needsLesson) {
        push(f0, 'lesson'); push(f0, 'guided'); push(f0, 'guided');
        if (due[0]) push(due[0], 'review'); else push(f0, 'practice');
        push(f0, 'practice');
      } else {
        const stuck = k0.n >= 8 && k0.p < 0.4;
        if (due[0]) push(due[0], 'review'); else push(f0, 'practice');
        push(f0, 'practice'); push(f0, 'practice');
        const back = stuck ? lowestPrereq(pl, f0) : null;
        if (back) push(back, 'review'); else if (f1) push(f1, 'practice'); else push(f0, 'practice');
        push(f0, 'practice');
      }
    } else if (due.length) {
      for (let i = 0; i < 5; i++) push(due[i % due.length], 'review');
    } else {
      const done = inPlace.filter((s) => pl.sk[s.id].mastered);
      if (!done.length) return { items: [], blocked: true };
      for (let i = 0; i < 5; i++) push(r.pick(done), 'mix');
    }
    return { items, blocked: false };
  };

  E.makeQuestion = function (pl, item, r, avoidKey) {
    const ctx = { assist: item.mode !== 'lesson' && E.needsAssist(pl, item.skill), mode: item.mode === 'lesson' ? 'lesson' : 'practice' };
    let q = K.makeQuestion(item.skill, r, ctx);
    for (let i = 0; i < 5 && avoidKey && q.key === avoidKey; i++) q = K.makeQuestion(item.skill, r, ctx);
    q.mode = item.mode;
    return q;
  };

  /* ---------- platsernas läge på kartan ---------- */
  E.placeInfo = function (pl, placeId, now) {
    now = now || Date.now();
    const sk = K.list.filter((s) => s.place === placeId);
    const mastered = sk.filter((s) => pl.sk[s.id].mastered).length;
    const front = sk.filter((s) => { const st = E.status(pl, s.id); return st === 'new' || st === 'learning'; }).length;
    const due = sk.filter((s) => pl.sk[s.id].mastered && pl.sk[s.id].due <= now).length;
    let state = 'ready';
    if (!front && !due && !mastered) state = 'sleep';
    else if (!front && !due) state = 'done';
    return { state, total: sk.length, mastered, front, due };
  };

  /* Välj det djur som har något att öva och som barnet var hos för längst tid sedan, så att alla får en tur. */
  E.recommend = function (pl, now) {
    now = now || Date.now();
    const infos = C.PLACE_ORDER.filter((p) => E.isReady(pl, p)).map((p) => Object.assign({ id: p }, E.placeInfo(pl, p, now)));
    const work = infos.filter((i) => i.front || i.due);
    if (!work.length) return infos.find((i) => i.state !== 'sleep') ? infos.find((i) => i.state !== 'sleep').id : 'beaver';
    const lp = pl.lastPlay || {}, seen = (id) => (lp[id] == null ? -1 : lp[id]);
    work.sort((a, b) => seen(a.id) - seen(b.id) || (b.due + b.front) - (a.due + a.front));
    return work[0].id;
  };

  /* ================= safarit ================= */
  /* Safarit är en rutnätskarta. Djur och stora saker tar en hel ruta. Småsaker (växter) får plats fem per ruta
     och kan dessutom växa i tre steg, så att en trädgårdsruta tar emot 15 belöningar.
     pl.safari = { cols, rows, extra:{c,r}, levelsDone, tiles: { "x,y": {k:'animal'|'big'|'garden', id | items:[{id,g}]} },
                   owned: [djur som kommit], pending: [saker som väntar på att byggas], celebrate: [klarade årskurser],
                   grow: bool, seq, bigSeq, medals: [djur där allt är klart] } */
  const tkey = (x, y) => x + ',' + y;
  const STAGES = 3;
  E.newSafari = () => ({ v: 2, cols: C.SIZES[0][0], rows: C.SIZES[0][1], extra: { c: 0, r: 0 }, levelsDone: 0, tiles: {}, owned: [], pending: [], celebrate: [], grow: false, seq: 0, bigSeq: 0, medals: [], auto: 0 });

  /* Ett djur är redo när det finns något det kan lära ut som barnet kan börja på. */
  E.hostSkills = (id) => K.list.filter((s) => s.place === id);
  E.isReady = (pl, id) => C.PLACES[id].tier === 0 || E.hostSkills(id).some((s) => E.status(pl, s.id) !== 'locked');
  E.animalDone = (pl, id) => E.hostSkills(id).every((s) => pl.sk[s.id] && pl.sk[s.id].mastered);
  E.levelInfo = function (pl, L) {
    const all = K.list.filter((s) => s.lvl === C.LEVELS[L]);
    const mastered = all.filter((s) => pl.sk[s.id] && pl.sk[s.id].mastered).length, need = all.length - C.SLACK[L];
    return { total: all.length, mastered, need, done: mastered >= need };
  };

  /* Storleken safarit har efter klarade årskurser (plus eventuella nödutbyggnader). */
  E.target = function (sf) {
    const t = C.SIZES[Math.min(sf.levelsDone, C.SIZES.length - 1)], x = sf.extra || { c: 0, r: 0 };
    return { cols: Math.max(sf.cols, t[0] + x.c), rows: Math.max(sf.rows, t[1] + x.r) };
  };
  E.dims = (sf, withGrow) => (withGrow ? E.target(sf) : { cols: sf.cols, rows: sf.rows });
  function emptyTiles(sf, d) {
    const out = [];
    for (let y = 0; y < d.rows; y++) for (let x = 0; x < d.cols; x++) if (!sf.tiles[tkey(x, y)]) out.push([x, y]);
    return out;
  }
  const nonSmall = (sf, piece) => sf.pending.filter((p) => p.k !== 'small' && p !== piece).length;
  const reserveFor = (sf, piece) => nonSmall(sf, piece) + 2; // lediga rutor som sparas åt djur och byggnader
  const gardenInfo = (t) => ({ free: C.SLOTS - t.items.length, ups: t.items.reduce((n, i) => n + (STAGES - 1 - i.g), 0) });
  const isUp = (piece) => !!(piece.k === 'small' && C.DECOR[piece.id] && C.DECOR[piece.id].up);

  /* Rutor där en sak får placeras. */
  E.spots = function (pl, piece, withGrow) {
    const sf = pl.safari, d = E.dims(sf, withGrow), empties = emptyTiles(sf, d);
    if (piece.k !== 'small') return empties;
    const up = isUp(piece), gardens = [];
    for (let y = 0; y < d.rows; y++) for (let x = 0; x < d.cols; x++) {
      const t = sf.tiles[tkey(x, y)];
      if (t && t.k === 'garden') { const gi = gardenInfo(t); if (up ? gi.ups > 0 : (gi.free > 0 || gi.ups > 0)) gardens.push([x, y]); }
    }
    return up ? gardens : gardens.concat(empties.length > reserveFor(sf, piece) ? empties : []);
  };
  /* Så mycket mer som får plats: nya växter, och växtsteg. */
  function capacity(pl, withGrow) {
    const sf = pl.safari, d = E.dims(sf, withGrow), empties = emptyTiles(sf, d).length;
    let slots = 0, ups = 0;
    for (let y = 0; y < d.rows; y++) for (let x = 0; x < d.cols; x++) { const t = sf.tiles[tkey(x, y)]; if (t && t.k === 'garden') { const gi = gardenInfo(t); slots += gi.free; ups += gi.ups; } }
    const fresh = Math.max(0, empties - reserveFor(sf, null));
    const pend = sf.pending.filter((p) => p.k === 'small');
    return { slots: slots + fresh * C.SLOTS - pend.filter((p) => !isUp(p)).length, ups: ups + fresh * C.SLOTS * (STAGES - 1) - pend.filter(isUp).length };
  }

  function apply(sf, piece, x, y) {
    const k = tkey(x, y);
    if (piece.k !== 'small') { sf.tiles[k] = { k: piece.k, id: piece.id }; return {}; }
    let t = sf.tiles[k];
    if (!t || t.k !== 'garden') t = sf.tiles[k] = { k: 'garden', items: [] };
    if (!isUp(piece) && t.items.length < C.SLOTS) { t.items.push({ id: piece.id, g: 0 }); return { index: t.items.length - 1 }; }
    let best = -1; // vattning: den minsta växten får växa
    t.items.forEach((it, i) => { if (it.g < STAGES - 1 && (best < 0 || it.g < t.items[best].g)) best = i; });
    if (best >= 0) { t.items[best].g++; return { index: best, grew: true, g: t.items[best].g }; }
    return null;
  }
  /* Barnet väljer ruta. */
  E.place = function (pl, x, y) {
    const sf = pl.safari, piece = sf.pending[0];
    if (!piece) return { ok: false, why: 'none' };
    if (!E.spots(pl, piece).some((p) => p[0] === x && p[1] === y)) return { ok: false, why: 'taken', piece };
    const r = apply(sf, piece, x, y);
    if (!r) return { ok: false, why: 'taken', piece };
    sf.pending.shift();
    return Object.assign({ ok: true, piece, x, y }, r);
  };
  /* Spelet väljer ruta (vid start på hög nivå och när föräldrar ändrar nivån). */
  function autoPlace(pl, piece) {
    const sf = pl.safari, spots = E.spots(pl, piece);
    if (!spots.length) return false;
    const n = ++sf.auto;
    let best = null, bs = -1;
    spots.forEach((p) => { const h = ((Math.imul(p[0] + 3, 73856093) ^ Math.imul(p[1] + 5, 19349663) ^ Math.imul(n, 83492791)) >>> 0) % 1000; if (h > bs) { bs = h; best = p; } });
    return !!apply(sf, piece, best[0], best[1]);
  }
  E.applyGrow = function (pl) {
    const sf = pl.safari, d = E.dims(sf, true), from = { cols: sf.cols, rows: sf.rows };
    sf.cols = d.cols; sf.rows = d.rows; sf.grow = false; sf.celebrate = [];
    return { from, to: d };
  };
  /* Ett steg större safari utan firande: när det annars inte skulle finnas plats.
     hard: för djur och byggnader, som alltid måste få plats. */
  function growStep(sf, hard) {
    const d = E.target(sf), x = sf.extra || (sf.extra = { c: 0, r: 0 }), lim = hard ? [14, 8] : [12, 7];
    const addCol = d.cols <= d.rows * 1.7;
    if (addCol ? d.cols >= lim[0] : d.rows >= lim[1]) { if (d.cols >= lim[0] && d.rows >= lim[1]) return false; }
    if (addCol && d.cols < lim[0]) x.c++; else if (d.rows < lim[1]) x.r++; else if (d.cols < lim[0]) x.c++; else return false;
    sf.grow = true;
    return true;
  }
  function ensureRoom(pl) { // finns ingen ledig ruta till ett nytt djur eller en byggnad växer safarit
    const sf = pl.safari;
    for (let g = 0; g < 8 && emptyTiles(sf, E.dims(sf, true)).length < sf.pending.filter((p) => p.k !== 'small').length; g++) if (!growStep(sf, true)) break;
  }

  /* Kollar vad som hänt i framstegen: nya djur, klarade årskurser, medaljer. opt.auto: placera själv och väx direkt, utan firande. */
  E.syncSafari = function (pl, opt) {
    opt = opt || {};
    const sf = pl.safari, out = { arrivals: [], grades: [], medals: [] };
    while (sf.levelsDone < C.LEVELS.length && E.levelInfo(pl, sf.levelsDone).done) { sf.levelsDone++; out.grades.push(sf.levelsDone); }
    if (out.grades.length) { if (opt.auto) E.applyGrow(pl); else { sf.grow = true; sf.celebrate.push(...out.grades); } }
    C.PLACE_ORDER.forEach((id) => {
      if (sf.owned.includes(id) || !E.isReady(pl, id)) return;
      sf.owned.push(id); out.arrivals.push(id);
      const piece = { k: 'animal', id }, hold = opt.startersPending && C.PLACES[id].tier === 0;
      if (opt.auto && !hold) { ensureRoom(pl); if (!autoPlace(pl, piece)) sf.pending.push(piece); } else { sf.pending.push(piece); ensureRoom(pl); }
    });
    C.PLACE_ORDER.forEach((id) => { if (sf.owned.includes(id) && !sf.medals.includes(id) && E.animalDone(pl, id)) { sf.medals.push(id); out.medals.push(id); } });
    if (opt.auto && sf.grow) E.applyGrow(pl);
    return out;
  };

  /* Äldre sparfiler hade en djurpark med belöningar. De flyttas in i safarit. */
  E.ensureSafari = function (pl) {
    const sf = pl.safari;
    if (sf && sf.v === 2 && sf.tiles && sf.owned) { sf.pending = sf.pending || []; sf.celebrate = sf.celebrate || []; sf.medals = sf.medals || []; sf.extra = sf.extra || { c: 0, r: 0 }; return pl; }
    pl.safari = E.newSafari();
    E.syncSafari(pl, { auto: true });
    const old = Array.isArray(pl.park) ? pl.park.length : 0;
    for (let i = 0; i < old; i++) {
      const big = (i + 1) % 8 === 0, sfx = pl.safari, piece = big ? { k: 'big', id: C.BIG[sfx.bigSeq++ % C.BIG.length].id } : { k: 'small', id: C.SMALL[sfx.seq++ % C.SMALL.length].id };
      if (!autoPlace(pl, piece)) break;
    }
    pl.park = [];
    return pl;
  };

  /* Nästa djur som kommer: det som ligger närmast. progress 0..1 */
  E.nextAnimal = function (pl) {
    const sf = pl.safari, anc = {};
    const closureOf = (id) => {
      if (anc[id]) return anc[id];
      const out = new Set(); const visit = (x) => K.byId[x].prereq.forEach((p) => { if (!out.has(p)) { out.add(p); visit(p); } });
      visit(id); return (anc[id] = Array.from(out));
    };
    let best = null;
    C.PLACE_ORDER.forEach((id) => {
      if (sf.owned.includes(id)) return;
      let prog = 0;
      E.hostSkills(id).forEach((s) => {
        const cl = closureOf(s.id).filter((x) => K.byId[x].place !== id);
        const f = cl.length ? cl.filter((x) => pl.sk[x].mastered).length / cl.length : 1;
        if (f > prog) prog = f;
      });
      if (!best || prog > best.progress + 1e-9 || (Math.abs(prog - best.progress) < 1e-9 && C.PLACES[id].tier < C.PLACES[best.id].tier)) best = { id, progress: prog };
    });
    return best;
  };

  /* ---------- belöningar ---------- */
  /* Efter en runda: stjärnor, och något att bygga. events = det som hände under rundan. */
  E.finishRound = function (pl, placeId, stars, gold, events) {
    pl.stars += stars; pl.gold += gold; pl.rounds++; pl.lastPlace = placeId;
    (pl.lastPlay || (pl.lastPlay = {}))[placeId] = pl.rounds;
    const sf = pl.safari, before = sf.pending.length;
    const sync = E.syncSafari(pl, {});
    const res = { arrivals: sync.arrivals, grades: sync.grades, medals: sync.medals, pieces: [], full: false };
    // en stor sak när ett djur blivit expert och när en årskurs är klar, och några växter extra när något nytt är lärt
    const nBig = Math.min(3, sync.medals.length + sync.grades.length), nMastered = (events || []).filter((e) => e.t === 'mastered').length;
    for (let i = 0; i < nBig; i++) {
      const piece = { k: 'big', id: C.BIG[sf.bigSeq++ % C.BIG.length].id };
      sf.pending.push(piece); ensureRoom(pl);
    }
    for (let i = 0; i < 1 + Math.min(2, nMastered); i++) {
      let cap = capacity(pl, true);
      if (cap.slots <= 0 && cap.ups <= 0 && growStep(sf, false)) cap = capacity(pl, true);
      if (cap.slots > 0) sf.pending.push({ k: 'small', id: C.SMALL[sf.seq++ % C.SMALL.length].id });
      else if (cap.ups > 0) sf.pending.push({ k: 'small', id: 'can' });
      else { if (i === 0) res.full = true; break; }
    }
    res.pieces = sf.pending.slice(before);
    return res;
  };

  E.summary = function (pl) {
    const out = {};
    ['m', 'l'].forEach((t) => {
      const all = K.list.filter((s) => s.track === t);
      out[t] = { total: all.length, mastered: all.filter((s) => pl.sk[s.id].mastered).length };
    });
    return out;
  };
})(globalThis.App || (globalThis.App = {}));
