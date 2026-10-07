/* Djurkompisarna – safarit: kartan där allt byggs, bygglägets val av plats, bygganimation och årskursfirande. */
(function (App) {
  'use strict';
  const A = App.art, E = App.engine, C = App.content, Au = App.audio, U = App.ui;
  const S = U.S, $ = U.$, $$ = U.$$, app = U.app, esc = A.esc;
  const LBL = ['F', '1', '2', '3'];
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  let timers = [];
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  const nameOf = (p) => (p.k === 'animal' ? C.PLACES[p.id].who : C.DECOR[p.id].n);
  const iconOf = (p) => (p.k === 'animal' ? A.animal(p.id) : p.k === 'big' ? A.big(p.id) : A.deco(p.id));
  U.pieceName = nameOf; U.pieceIcon = iconOf;
  const pron = (p) => (p.k === 'animal' ? '' : /^ett /.test(C.DECOR[p.id].n) ? 'det' : 'den');

  /* ---------- ritade delar ---------- */
  function itemHtml(t, sf, rec) {
    if (!t) return '';
    if (t.k === 'animal') {
      const P = C.PLACES[t.id];
      return `<button class="piece apc${rec === t.id ? ' rec' : ''}" data-animal="${t.id}" aria-label="${esc(P.who)}">${A.animalPiece(t.id)}${sf.medals.includes(t.id) ? `<span class="expert" aria-hidden="true">${A.icon('star')}</span>` : ''}</button>`;
    }
    if (t.k === 'big') return `<button class="piece bpc" data-big="${t.id}" aria-label="${esc(C.DECOR[t.id].n)}">${A.big(t.id)}</button>`;
    return `<div class="garden">${t.items.map((it, i) => smallHtml(it, i)).join('')}</div>`;
  }
  const scale = (g) => (1 + 0.15 * g).toFixed(2);
  const smallHtml = (it, i, cls) => `<button class="piece sm s${i}${cls ? ' ' + cls : ''}" data-i="${i}" data-deco="${it.id}" style="--sc:${scale(it.g)}" aria-label="${esc(C.DECOR[it.id].n)}">${A.deco(it.id)}</button>`;

  function boardHtml(sf, d, rec, from) {
    let h = '', n = 0;
    for (let y = 0; y < d.rows; y++) {
      for (let x = 0; x < d.cols; x++) {
        const fresh = from && (x >= from.cols || y >= from.rows);
        h += `<div class="cell${(x + y) % 2 ? ' alt' : ''}${fresh ? ' fresh' : ''}" data-x="${x}" data-y="${y}" style="z-index:${y + 1}${fresh ? `;animation-delay:${900 + (n++) * 55}ms` : ''}">${itemHtml(sf.tiles[x + ',' + y], sf, rec)}</div>`;
      }
    }
    return `<div class="board${from ? ' growing' : ''}" id="board" style="--cols:${d.cols};--rows:${d.rows}">${h}</div>`;
  }

  function levelPath(pl) {
    const sf = pl.safari, cur = Math.min(sf.levelsDone, 3);
    return `<div class="lvlpath" role="img" aria-label="Safarits nivå: ${C.LEVEL_NAMES[cur]}">` + C.LEVELS.map((k, L) => {
      const done = sf.levelsDone > L, now = sf.levelsDone === L, inf = E.levelInfo(pl, L);
      const p = done ? 100 : Math.round(Math.min(1, inf.mastered / inf.need) * 100);
      return `<span class="stone ${done ? 'done' : now ? 'now' : ''}" style="--p:${p}"><b>${done ? A.icon('check') : LBL[L]}</b></span>`;
    }).join('<i class="lk"></i>') + '</div>';
  }

  /* ---------- startsidan: safarit ---------- */
  U.map = function (o) {
    o = o || {};
    const pl = S.pl;
    if (!pl) return U.profiles();
    Au.stop(); clearTimers();
    const sf = pl.safari;
    if (sf.celebrate.length && !o.fromGrade) return U.grade({ levels: sf.celebrate.slice() }); // firandet hann inte visas förra gången
    let grow = null;
    if (sf.grow) grow = E.applyGrow(pl);
    S.busy = false;
    const building = sf.pending.length > 0 && (!!o.build || (!S.skipBuild && sf.pending[0].k === 'animal'));
    S.build = building;
    S.sel = null;
    const rec = E.recommend(pl), d = { cols: sf.cols, rows: sf.rows }, nx = E.nextAnimal(pl);
    const head = `<header class="mtop">${building ? '' : `<button class="avatar" id="switch" aria-label="Byt spelare">${A.animal(pl.animal)}</button>`}` +
      `<div class="starcount">${A.icon('star')}<b>${pl.stars}</b></div>${levelPath(pl)}<span class="grow"></span>` +
      (building ? '' : (sf.pending.length ? `<button class="crate" id="crate" aria-label="Det finns något att bygga">${A.icon('gift')}<b>${sf.pending.length}</b></button>` : '') + U.holdBtn('parent', 'Föräldravy: håll in')) + '</header>';
    const foot = building ? '' : '<footer class="sbot">' +
      (nx ? `<div class="teaser" aria-label="Nästa kompis kommer snart"><span class="sil">${A.animal(nx.id)}<i class="qm">${A.icon('question')}</i></span><span class="tbar"><i style="width:${Math.max(6, Math.round(nx.progress * 100))}%"></i></span></div>` : '<span></span>') +
      `<button class="btn playbtn" id="play">${A.icon('play')}<span>Spela</span></button><span></span></footer>`;
    app().innerHTML = `<section class="screen safari${building ? ' building' : ''}">${A.safariScene()}${head}<div class="boardwrap" id="bw">${boardHtml(sf, d, rec, grow && (grow.from.cols !== grow.to.cols || grow.from.rows !== grow.to.rows) ? grow.from : null)}</div>${foot}${building ? carryHtml(pl) : ''}</section>`;

    if (!building) {
      $('#switch').addEventListener('click', () => { S.greeted = false; U.profiles(); });
      U.bindHold($('#parent'), 1500, () => U.parent());
      $('#play').addEventListener('click', () => U.startRound(rec));
      const cr = $('#crate'); if (cr) cr.addEventListener('click', () => U.map({ build: true }));
    } else {
      $('#later').addEventListener('click', () => { S.skipBuild = true; U.save(); U.map(); });
      markSpots();
    }
    $('#bw').addEventListener('click', onBoardClick);

    if (grow && $('.cell.fresh')) {
      S.busy = true;
      growAnim(grow);
      later(() => { S.busy = false; afterGrow(building); }, 3000);
    } else afterGrow(building, true);
  };

  function afterGrow(building, quick) {
    const pl = S.pl, sf = pl.safari;
    if (building) return promptNext(true);
    if (!S.greeted) {
      S.greeted = true;
      const rec = E.recommend(pl);
      U.say(sf.pending.length ? 'Hej! Det finns något att bygga. Tryck på paketet!' : 'Hej! Tryck på ett djur eller på Spela!', rec);
    }
  }

  /* ---------- tryck på safarit ---------- */
  function onBoardClick(e) {
    if (S.busy) return;
    const cell = e.target.closest('.cell');
    if (!cell) return;
    if (S.build) return U.buildAt(+cell.dataset.x, +cell.dataset.y);
    const a = e.target.closest('[data-animal]');
    if (a) return selectAnimal(a.dataset.animal, a);
    const dc = e.target.closest('[data-deco],[data-big]');
    if (dc) {
      closeCard();
      const id = dc.dataset.deco || dc.dataset.big;
      Au.pop(); dc.classList.remove('wiggle'); void dc.offsetWidth; dc.classList.add('wiggle');
      return U.say(cap(C.DECOR[id].n.replace(/^(en|ett) /, '')), S.pl.animal, null, { fast: true });
    }
    closeCard();
  }
  function closeCard() { const c = $('.acard'); if (c) c.remove(); S.sel = null; $$('.piece.apc.sel').forEach((p) => p.classList.remove('sel')); }
  function selectAnimal(id, el) {
    const pl = S.pl, P = C.PLACES[id];
    closeCard();
    S.sel = id; el.classList.add('sel');
    el.classList.add('cheer'); later(() => el.classList.remove('cheer'), 1200);
    const inf = E.placeInfo(pl, id, Date.now()), pct = Math.round((inf.mastered / inf.total) * 100);
    const card = document.createElement('div');
    card.className = 'acard place-' + id;
    card.innerHTML = `<div class="aface">${A.animal(id)}</div><div class="atext"><b>${esc(P.who)}</b><span>Kan ${esc(P.can)}</span><span class="abar"><i style="width:${pct}%"></i></span></div>` +
      `<button class="btn green" id="acplay" aria-label="Spela med ${esc(P.who)}">${A.icon('play')}<span>Spela</span></button><button class="iconbtn" id="acx" aria-label="Stäng">${A.icon('plus', 'x')}</button>`;
    $('.safari').appendChild(card);
    $('#acplay').addEventListener('click', () => U.startRound(id));
    $('#acx').addEventListener('click', closeCard);
    Au.pop();
    U.say(`${P.who}! Jag kan ${P.can}. Vill du spela?`, id, null, { fast: true });
  }

  /* ---------- byggläge ---------- */
  function carryHtml(pl) {
    const p = pl.safari.pending[0];
    if (!p) return '';
    const n = pl.safari.pending.length;
    return `<div class="carry" id="carry"><div class="cpic">${iconOf(p)}</div><div class="ctext"><b>${p.k === 'animal' ? esc(nameOf(p)) + ' kommer!' : cap(esc(nameOf(p)))}</b><span>Tryck på en ledig plats</span></div>` +
      `${n > 1 ? `<span class="cnt">${n}</span>` : ''}<button class="btn plain small" id="later">Senare</button></div>`;
  }
  function markSpots() {
    const pl = S.pl, p = pl.safari.pending[0];
    $$('.cell.spot').forEach((c) => c.classList.remove('spot'));
    if (!p) return;
    E.spots(pl, p).forEach(([x, y]) => { const c = $(`.cell[data-x="${x}"][data-y="${y}"]`); if (c) c.classList.add('spot'); });
  }
  /* Läser upp vad som ska byggas, och hoppar över sådant som inte får plats. */
  function promptNext(first) {
    const pl = S.pl, sf = pl.safari;
    while (sf.pending.length && !E.spots(pl, sf.pending[0]).length) sf.pending.shift(); // ryms inte (borde inte hända)
    const c = $('#carry');
    if (!sf.pending.length) return finishBuild();
    if (c) c.outerHTML = carryHtml(pl);
    $('#later').addEventListener('click', () => { S.skipBuild = true; U.save(); U.map(); });
    markSpots();
    const p = sf.pending[0], voice = p.k === 'animal' ? p.id : pl.animal;
    let t;
    if (p.k === 'animal') t = first && sf.owned.length <= 4 && !Object.keys(sf.tiles).length ? `Välkommen till ditt safari! Var ska ${nameOf(p)} bo? Tryck på en ledig plats.` : `${nameOf(p)} vill bo i ditt safari! Var ska ${nameOf(p)} bo?`;
    else if (C.DECOR[p.id].up) t = 'Du fick en vattenkanna! Vilken växt ska få växa?';
    else t = `Du fick ${nameOf(p)}! Var ska ${pron(p)} stå?`;
    U.say(t, voice);
  }
  function finishBuild() {
    const pl = S.pl;
    S.build = false; S.busy = false; S.skipBuild = false; S.greeted = true;
    U.save();
    U.map({ fresh: true });
    U.say('Så fint det blev! Tryck på ett djur eller på Spela.', pl.animal);
  }

  /* Barnet har valt en ruta: bygg! */
  U.buildAt = function (x, y) {
    const pl = S.pl, sf = pl.safari;
    if (S.busy || !sf.pending.length) return;
    const cell = $(`.cell[data-x="${x}"][data-y="${y}"]`);
    if (!cell) return;
    const piece = sf.pending[0], voice = piece.k === 'animal' ? piece.id : pl.animal;
    const res = E.place(pl, x, y);
    if (!res.ok) {
      cell.classList.add('nope'); later(() => cell.classList.remove('nope'), 450);
      Au.oops();
      return U.say(piece.k === 'small' ? 'Där är det fullt. Välj en annan plats!' : 'Där är det upptaget. Välj en ledig plats!', voice, null, { fast: true });
    }
    U.save();
    S.busy = true;
    Au.stop();
    $$('.cell.spot').forEach((c) => c.classList.remove('spot'));
    const carry = $('#carry'); if (carry) carry.classList.add('away');
    const big = piece.k !== 'small', tile = sf.tiles[x + ',' + y];
    if (res.grew) { /* vattning: inga nya bitar */ }
    const work = document.createElement('div');
    work.className = 'work ' + (big ? 'wbig' : 'wsmall');
    work.innerHTML = '<i class="dust d1"></i><i class="dust d2"></i><i class="dust d3"></i>' + (big ? `${A.scaffold()}<span class="hamm">${A.hammer()}</span>` : '<i class="mound"></i>');
    cell.appendChild(work);
    Au.poof();
    const done = () => { S.busy = false; later(() => promptNext(), 150); };
    if (big) {
      [550, 950, 1350].forEach((ms) => later(() => Au.hammer(), ms));
      later(() => {
        cell.insertAdjacentHTML('beforeend', itemHtml({ k: piece.k, id: piece.id }, sf, null));
        const pc = $('.piece', cell); if (pc) pc.classList.add('rising');
      }, 1300);
      later(() => {
        work.remove();
        const pc = $('.piece', cell);
        if (pc) { pc.classList.remove('rising'); pc.classList.add('tada'); }
        sparks(cell); Au.tada();
        if (piece.k === 'animal') { if (pc) { pc.classList.add('cheer'); later(() => pc.classList.remove('cheer'), 1300); } U.say(C.PLACES[piece.id].hello, piece.id, done); }
        else U.say(`Wow! ${cap(nameOf(piece))}!`, pl.animal, done, { fast: true });
      }, 2250);
    } else if (res.grew) {
      work.className = 'work wrain';
      work.innerHTML = `<span class="canp">${A.deco('can')}</span>` + [0, 1, 2, 3, 4].map((i) => `<i class="drop" style="--i:${i}"></i>`).join('');
      Au.sprout();
      later(() => {
        const el = $(`.sm[data-i="${res.index}"]`, cell);
        if (el) { el.style.setProperty('--sc', scale(res.g)); el.classList.add('boing'); }
        sparks(cell, true);
      }, 800);
      later(() => { work.remove(); const el = $(`.sm[data-i="${res.index}"]`, cell); if (el) el.classList.remove('boing'); U.say('Titta, den växte!', pl.animal, done, { fast: true }); }, 1500);
    } else {
      later(() => {
        let g = $('.garden', cell);
        if (!g) { g = document.createElement('div'); g.className = 'garden'; cell.appendChild(g); }
        g.insertAdjacentHTML('beforeend', smallHtml(tile.items[res.index], res.index, 'growin'));
        Au.sprout();
      }, 450);
      later(() => { work.remove(); sparks(cell, true); const g = $('.growin', cell); if (g) g.classList.remove('growin'); }, 1250);
      later(() => { U.say(cap(nameOf(piece)) + '!', pl.animal, done, { fast: true }); }, 1250);
    }
  };

  function sparks(cell, small) {
    let h = '';
    for (let i = 0; i < (small ? 6 : 10); i++) h += `<i style="--a:${Math.round((i / (small ? 6 : 10)) * 360)}deg;--d:${(small ? 0.28 : 0.46).toFixed(2)}em"></i>`;
    const s = document.createElement('div'); s.className = 'sparks'; s.innerHTML = h;
    cell.appendChild(s);
    later(() => s.remove(), 1100);
  }

  /* Safarit växer: kameran zoomar ut och ny mark rullas ut. */
  function growAnim(g) {
    const bw = $('#bw'), b = $('#board');
    if (!bw || !b) return;
    Au.grow();
    const cs = getComputedStyle(bw), padL = parseFloat(cs.paddingLeft) || 0, padT = parseFloat(cs.paddingTop) || 0;
    const cw = bw.clientWidth - padL - (parseFloat(cs.paddingRight) || 0), ch = bw.clientHeight - padT - (parseFloat(cs.paddingBottom) || 0);
    const wr = bw.getBoundingClientRect(), br = b.getBoundingClientRect();
    const tn = br.width / g.to.cols, to = Math.min(cw / g.from.cols, ch / g.from.rows);
    const oldW = to * g.from.cols, oldH = to * g.from.rows;
    const oldLeft = wr.left + padL + (cw - oldW) / 2, oldTop = wr.top + padT + (ch - oldH) / 2;
    b.style.transformOrigin = '0 0';
    b.style.transition = 'none';
    b.style.transform = `translate(${(oldLeft - br.left).toFixed(1)}px, ${(oldTop - br.top).toFixed(1)}px) scale(${(to / tn).toFixed(4)})`;
    void b.offsetWidth;
    requestAnimationFrame(() => {
      b.style.transition = 'transform 1.8s cubic-bezier(.3,.05,.2,1)';
      b.style.transform = 'none';
    });
    later(() => { b.classList.remove('growing'); $$('.cell.fresh').forEach((c) => c.classList.remove('fresh')); b.style.transition = ''; b.style.transformOrigin = ''; }, 2900);
    const n = Math.max(g.to.cols - g.from.cols, 0) + Math.max(g.to.rows - g.from.rows, 0);
    U.say(n ? 'Titta! Safarit blev större! Nu finns det plats för fler.' : 'Safarit växer!', S.pl.animal);
  }

  /* ---------- stort firande: en årskurs klar ---------- */
  U.grade = function (o) {
    const pl = S.pl, sf = pl.safari, L = Math.max.apply(null, o.levels), all = L >= C.LEVELS.length, name = C.LEVEL_NAMES[L - 1];
    Au.stop(); clearTimers();
    const cols = ['#FFC93C', '#E4574F', '#3D84E8', '#3FA66B', '#8E6CC9', '#F28F3B'];
    const conf = Array.from({ length: 56 }, (_, i) => `<i style="--x:${Math.round(Math.random() * 100)}%;--c:${cols[i % 6]};--d:${(2.6 + Math.random() * 3).toFixed(1)}s;--w:${(-Math.random() * 5).toFixed(1)}s;--r:${Math.round(Math.random() * 360)}deg"></i>`).join('');
    const burst = (cls, c) => `<div class="fw ${cls}">${Array.from({ length: 16 }, (_, i) => `<i style="--a:${i * 22.5}deg;--c:${c[i % c.length]}"></i>`).join('')}</div>`;
    const crowd = Object.values(sf.tiles).filter((t) => t.k === 'animal').map((t) => t.id).slice(0, 7);
    app().innerHTML = `<section class="screen grade cheer"><div class="rays"></div><div class="confetti">${conf}</div>${burst('f1', cols)}${burst('f2', cols.slice().reverse())}${burst('f3', cols)}` +
      `<div class="gmedal"><span class="ring">${A.icon('star')}</span><b>${name}</b><i>klar!</i></div>` +
      `<h2>${all ? 'Du klarade hela safarit!' : `Du klarade ${name}!`}</h2><p>${all ? 'Alla djur är stolta över dig.' : 'Safarit växer, och nya kompisar väntar.'}</p>` +
      `<div class="gcrowd">${crowd.map((id, i) => `<span style="--i:${i}">${A.animal(id)}</span>`).join('')}</div>` +
      `<button class="btn green big" id="gbuild">${A.icon('hammer')}<span>Bygg ut safarit</span></button></section>`;
    $('#gbuild').addEventListener('click', () => { Au.stop(); S.skipBuild = false; S.greeted = true; U.map({ fromGrade: true, build: true }); });
    Au.bigFanfare();
    later(() => U.say(`Wow! Du klarade ${name}! Nu växer safarit!`, pl.animal), 700);
  };
})(globalThis.App || (globalThis.App = {}));
