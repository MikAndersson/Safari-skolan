/* Djurkompisarna – en runda: lektion, frågor, svar, belöning. */
(function (App) {
  'use strict';
  const A = App.art, K = App.skills, E = App.engine, C = App.content, Au = App.audio, U = App.ui;
  const S = U.S, $ = U.$, $$ = U.$$, app = U.app, esc = A.esc, w = K.words;
  const PRAISE = ['Bra!', 'Snyggt!', 'Precis så!', 'Wow!', 'Jättebra!', 'Härligt!', 'Där satt den!'];
  const TRY = ['Hmm, nästan! Prova en gång till.', 'Titta noga igen!', 'Nästan! Försök igen.'];
  const pickOf = (a) => a[Math.floor(Math.random() * a.length)];

  function say(text, done, opts) {
    const b = $('#bubble');
    if (b) b.textContent = text;
    U.say(text, S.round ? S.round.place : 'beaver', done, opts);
  }
  function flash(cls, ms) {
    const h = $('#helper');
    if (!h) return;
    h.classList.add(cls);
    setTimeout(() => h.classList.remove(cls), ms);
  }
  const cheer = () => flash('cheer', 1200), think = () => flash('think', 900);

  U.startRound = function (placeId) {
    const pl = S.pl, P = C.PLACES[placeId], r = E.makeRng();
    const plan = E.planRound(pl, placeId, r, Date.now());
    if (plan.blocked) return U.say(`${P.who} sover just nu. Prova hos någon annan!`, placeId);
    S.round = { place: placeId, plan: plan.items, i: 0, stars: 0, gold: 0, events: [], lastKey: null, r, tok: 0 };
    shell();
    next();
  };

  function shell() {
    const R = S.round, P = C.PLACES[R.place];
    app().innerHTML = `<section class="screen round place-${R.place}" id="round"><header class="rtop"><button class="iconbtn" id="rhome" aria-label="Hem">${A.icon('home')}</button>` +
      `<div class="pips">${R.plan.map(() => `<span class="pip">${A.icon('star')}</span>`).join('')}</div>` +
      `<button class="iconbtn" id="rlisten" aria-label="Lyssna igen">${A.icon('speaker')}</button></header>` +
      `<div class="rbody"><div class="hcol"><div class="helper" id="helper">${A.animal(P.animal)}</div><div class="bubble" id="bubble"></div></div><div class="stage" id="qshow"></div></div>` +
      '<div class="choices" id="qchoices"></div></section>';
    $('#rhome').addEventListener('click', () => {
      R.tok++; Au.stop();
      S.pl.stars += R.stars; S.pl.gold += R.gold; S.round = null;
      U.save(); U.map();
    });
    $('#rlisten').addEventListener('click', () => { if (R.q) say(R.q.say); });
  }

  function next() {
    const R = S.round;
    if (!R) return;
    if (R.i >= R.plan.length) return finish();
    const item = R.plan[R.i], q = E.makeQuestion(S.pl, item, R.r, R.lastKey), lesson = item.mode === 'lesson';
    R.lastKey = q.key; R.q = q; R.item = item; R.wrong = 0; R.revealed = false; R.locked = false; R.tok++;
    $$('.pip').forEach((p, i) => p.classList.toggle('cur', i === R.i));
    if (lesson) E.markLesson(S.pl, item.skill);
    $('#qshow').innerHTML = ''; $('#qchoices').innerHTML = ''; $('#qchoices').className = 'choices';
    $('#round').classList.toggle('noshow', q.kind === 'choice' && !q.show && !q.listen);
    if (q.kind === 'give') renderGive(q); else if (q.kind === 'build') renderBuild(q); else renderChoice(q, lesson);
    if (lesson) {
      const tok = R.tok;
      say(K.byId[item.skill].intro, () => { if (R.tok === tok) say(q.say, () => { if (R.tok === tok) say(q.explain); }); });
    } else say(q.say);
  }

  /* Klar med en fråga. res: 'first' | 'second' | 'revealed' | null (lektion, räknas inte). */
  function complete(res) {
    const R = S.round;
    R.locked = true;
    if (res) R.events.push(...E.record(S.pl, R.item.skill, res, Date.now()));
    R.stars++; if (res === 'first') R.gold++;
    const pip = $$('.pip')[R.i];
    if (pip) { pip.classList.add('on'); if (res === 'first') pip.classList.add('gold'); }
    Au.star(); U.save();
    const tok = R.tok;
    say(res === 'first' ? pickOf(PRAISE) : res === null ? 'Bra! Nu försöker du själv.' : 'Bra jobbat!');
    setTimeout(() => { if (S.round === R && R.tok === tok) { R.i++; next(); } }, 1300);
  }
  const resultFor = (R) => (R.item.mode === 'lesson' ? null : R.wrong === 0 ? 'first' : R.wrong === 1 && !R.revealed ? 'second' : 'revealed');

  /* ---------- flerval ---------- */
  function renderChoice(q, lesson) {
    $('#qshow').innerHTML = (q.show || '') + (q.listen ? `<button class="listen" id="qlisten">${A.icon('speaker')}<span>Lyssna</span></button>` : '');
    const box = $('#qchoices');
    box.className = 'choices ' + (q.cardClass || '');
    box.innerHTML = q.choices.map((c) => `<button class="card${lesson && c.v === q.answer ? ' hint' : ''}" data-v="${esc(c.v)}">${c.html}</button>`).join('');
    $$('.card', box).forEach((b) => {
      if (lesson && b.dataset.v !== q.answer) { b.disabled = true; b.classList.add('dim'); }
      b.addEventListener('click', () => onChoice(b));
    });
    if (q.listen) $('#qlisten').addEventListener('click', () => say(q.listen));
  }

  function onChoice(b) {
    const R = S.round;
    if (!R || R.locked || b.disabled) return;
    const q = R.q;
    if (b.dataset.v === q.answer) {
      b.classList.add('good'); Au.good(); cheer();
      return complete(resultFor(R));
    }
    R.wrong++; b.disabled = true; b.classList.add('nope'); Au.oops(); think();
    const left = $$('.card:not(:disabled)').length;
    if (R.wrong >= 2 || left <= 1) {
      R.revealed = true;
      $$('.card').forEach((c) => { if (c.dataset.v === q.answer) c.classList.add('hint'); else { c.disabled = true; c.classList.add('dim'); } });
      say(q.explain);
    } else say(pickOf(TRY));
  }

  /* ---------- ge N föremål ---------- */
  function renderGive(q) {
    const R = S.round;
    R.placed = [];
    $('#qshow').innerHTML = '<div class="give"><div class="pile" id="pile"></div><div class="dam"><div class="count" id="gcount">0</div><div class="damitems" id="damitems"></div></div></div>';
    $('#qchoices').innerHTML = `<button class="okbtn" id="gok" aria-label="Klar">${A.icon('check')}</button>`;
    $('#gok').addEventListener('click', giveDone);
    refreshGive();
  }
  function refreshGive() {
    const R = S.round, q = R.q, lesson = R.item.mode === 'lesson';
    let ph = '', dh = '';
    for (let i = 0; i < q.total; i++) {
      if (R.placed.includes(i)) dh += `<button class="item placed" data-i="${i}">${q.item}</button>`;
      else ph += `<button class="item" data-i="${i}">${q.item}</button>`;
    }
    $('#pile').innerHTML = ph; $('#damitems').innerHTML = dh; $('#gcount').textContent = R.placed.length;
    $$('#pile .item').forEach((b) => b.addEventListener('click', () => giveTap(+b.dataset.i, true)));
    $$('#damitems .item').forEach((b) => b.addEventListener('click', () => giveTap(+b.dataset.i, false)));
    if (lesson) {
      const first = $('#pile .item');
      if (R.placed.length < q.target && first) first.classList.add('hint');
      else if (R.placed.length === q.target) $('#gok').classList.add('hint');
    }
  }
  function giveTap(i, add) {
    const R = S.round;
    if (!R || R.locked) return;
    if (add) R.placed.push(i); else R.placed.splice(R.placed.indexOf(i), 1);
    Au.pop(); refreshGive();
    say(R.placed.length ? w(R.placed.length) : 'Inga', null, { fast: true });
  }
  function giveDone() {
    const R = S.round;
    if (!R || R.locked) return;
    const q = R.q, n = R.placed.length;
    if (n === q.target) { Au.good(); cheer(); return complete(resultFor(R)); }
    R.wrong++; Au.oops(); think();
    if (R.wrong >= 2) {
      R.revealed = true;
      R.placed = Array.from({ length: q.target }, (_, i) => i);
      refreshGive(); $('#gok').classList.add('hint');
      say(q.explain);
    } else say(n === 0 ? 'Du har inte lagt några ännu. Prova igen!' : `Du la ${w(n)}. Vi ska ha ${w(q.target)}. Prova igen!`);
  }

  /* ---------- bygg ord ---------- */
  function renderBuild(q) {
    const R = S.round;
    R.pos = 0;
    $('#qshow').innerHTML = `<div class="buildpic"><span class="obj emo huge">${q.pic}</span></div><div class="slots">${q.letters.map(() => '<span class="slot-l"></span>').join('')}</div>`;
    const box = $('#qchoices');
    box.className = 'choices tray';
    box.innerHTML = q.tray.map((t) => `<button class="tile-l" data-id="${t.id}">${t.ch}</button>`).join('');
    $$('.tile-l', box).forEach((b) => b.addEventListener('click', () => buildTap(b)));
    if (R.item.mode === 'lesson') hintNext();
  }
  function hintNext() {
    const R = S.round, q = R.q;
    $$('.tile-l').forEach((b) => b.classList.remove('hint'));
    if (R.pos >= q.letters.length) return;
    const t = $$('.tile-l:not(.used)').find((b) => b.textContent === q.letters[R.pos]);
    if (t) t.classList.add('hint');
  }
  function buildTap(b) {
    const R = S.round;
    if (!R || R.locked || b.classList.contains('used')) return;
    const q = R.q, lesson = R.item.mode === 'lesson', need = q.letters[R.pos];
    if (b.textContent === need) {
      b.classList.add('used');
      const slot = $$('.slot-l')[R.pos];
      slot.textContent = need; slot.classList.add('filled');
      R.pos++; Au.pop();
      if (R.pos === q.letters.length) {
        R.locked = true; Au.good(); cheer();
        const res = lesson ? null : R.wrong === 0 ? 'first' : R.wrong <= 2 ? 'second' : 'revealed';
        say(q.word + '!', () => complete(res), { quick: false });
      } else if (lesson || R.wrong >= 2) hintNext();
    } else {
      R.wrong++; b.classList.add('nope'); setTimeout(() => b.classList.remove('nope'), 400);
      Au.oops(); think();
      if (R.wrong >= 2) hintNext();
    }
  }

  /* ---------- belöning ---------- */
  function finish() {
    const R = S.round, pl = S.pl;
    const res = E.finishRound(pl, R.place, R.stars, R.gold, R.events);
    S.sessionRounds++; S.skipBuild = false;
    U.save();
    reward(R, res);
  }

  function reward(R, res) {
    const pl = S.pl, P = C.PLACES[R.place];
    S.round = null;
    if (res.grades.length) return U.grade({ levels: res.grades });
    const cols = ['#FFC93C', '#E4574F', '#3D84E8', '#3FA66B', '#8E6CC9', '#F28F3B'];
    const conf = Array.from({ length: 34 }, (_, i) => `<i style="--x:${Math.round(Math.random() * 100)}%;--c:${cols[i % 6]};--d:${(3 + Math.random() * 3).toFixed(1)}s;--w:${(-Math.random() * 5).toFixed(1)}s;--r:${Math.round(Math.random() * 360)}deg"></i>`).join('');
    const mastered = R.events.filter((e) => e.t === 'mastered'), unlocked = R.events.filter((e) => e.t === 'unlocked');
    const medals = mastered.map((e) => `<span class="medal">${A.icon('star')}${esc(K.byId[e.id].name)}: klar!</span>`)
      .concat(res.medals.map((id) => `<span class="medal">${A.icon('star')}${esc(C.PLACES[id].who)} är expert!</span>`))
      .concat(unlocked.map((e) => `<span class="medal">${A.icon('play')}Nytt: ${esc(K.byId[e.id].name)}</span>`)).join('');
    const pieces = res.pieces, arrived = res.arrivals.filter((id) => pieces.some((p) => p.k === 'animal' && p.id === id));
    const items = pieces.slice(0, 4).map((p, i) => `<div class="rwpiece ${p.k}" style="--i:${i}"><div class="rwpic">${U.pieceIcon(p)}</div><span>${esc(U.pieceName(p))}</span></div>`).join('');
    const title = arrived.length ? `Ny kompis: ${arrived.map((id) => C.PLACES[id].who).join(' och ')}!` : pieces.length ? 'Du fick något att bygga!' : res.full ? 'Safarit är fullt!' : 'Bra jobbat!';
    app().innerHTML = `<section class="screen reward cheer"><div class="confetti">${conf}</div><div class="rwanimal helper">${A.animal(P.animal)}</div>` +
      (items ? `<div class="rwpieces">${items}</div>` : '') +
      `<h2>${title}</h2>${res.full && !pieces.length ? '<p class="rwnote">Klara en hel årskurs så växer safarit.</p>' : ''}` +
      `<div class="rwstars">${Array.from({ length: R.stars }, (_, i) => `<span style="opacity:${i < R.gold ? 1 : 0.45}">${A.icon('star')}</span>`).join('')}</div>` +
      (medals ? `<div class="medals">${medals}</div>` : '') +
      `<div class="rwbtns"><button class="iconbtn" id="rhome2" aria-label="Hem">${A.icon('home')}</button>` +
      (pieces.length ? `<button class="btn green big" id="rbuild" aria-label="Bygg i safarit">${A.icon('hammer')}<span>Bygg</span></button>` : '') +
      `<button class="${pieces.length ? 'iconbtn' : 'btn green'}" id="again" aria-label="Spela mer">${A.icon('play')}${pieces.length ? '' : '<span>Spela mer</span>'}</button></div></section>`;
    $('#rhome2').addEventListener('click', () => U.map());
    $('#again').addEventListener('click', () => U.startRound(E.recommend(pl)));
    const rb = $('#rbuild'); if (rb) rb.addEventListener('click', () => { S.skipBuild = false; U.map({ build: true }); });
    Au.fanfare();
    let line = arrived.length ? `Wow! ${C.PLACES[arrived[0]].who} vill bo i ditt safari!` : pieces.length ? `Bra jobbat! Du fick ${U.pieceName(pieces[pieces.length - 1])}.` : 'Bra jobbat!';
    if (mastered.length) line += ' Du har lärt dig något nytt!';
    if (res.medals.length) line += ` ${C.PLACES[res.medals[0]].who} är expert!`;
    if (S.sessionRounds % 3 === 0) line += ' Nu har vi lekt en stund. Dags att vila lite?';
    U.say(line, R.place);
  }
})(globalThis.App || (globalThis.App = {}));
