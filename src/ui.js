/* Djurkompisarna – gränssnitt: spelare, föräldraguide, karta, djurpark, föräldravy. */
(function (App) {
  'use strict';
  const A = App.art, K = App.skills, E = App.engine, C = App.content, Au = App.audio;
  const U = (App.ui = {});
  const esc = A.esc;
  const S = (U.S = { db: { players: [], current: null }, pl: null, round: null, storageOk: true, greeted: false, sessionRounds: 0, W: null, skipBuild: false, busy: false, build: false });
  const KEY = 'djurkompisarna.v1';
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const app = () => document.getElementById('app');
  U.$ = $; U.$$ = $$; U.app = app;

  /* ---------- sparning ---------- */
  U.load = function () {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && Array.isArray(d.players)) { d.players.forEach(E.ensureSkills); return d; }
      }
    } catch (e) { S.storageOk = false; }
    return { players: [], current: null };
  };
  U.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(S.db)); } catch (e) { S.storageOk = false; }
  };

  /* ---------- gemensamma hjälpare ---------- */
  U.say = (text, placeId, done, opts) => Au.say(text, C.PLACES[placeId || 'beaver'], done, opts);
  U.bindHold = function (el, ms, cb) {
    let t = null;
    const stop = () => { if (t) { clearTimeout(t); t = null; } el.classList.remove('holding'); };
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.classList.add('holding'); t = setTimeout(() => { t = null; el.classList.remove('holding'); cb(); }, ms); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => el.addEventListener(ev, stop));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter') cb(); });
  };
  const holdBtn = U.holdBtn = (id, label) => `<button class="holdbtn" id="${id}" aria-label="${label}"><svg class="ring" viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" pathLength="120"/></svg>${A.icon('lock')}</button>`;
  const LVL = { F: 'F-klass', 1: 'Åk 1', 2: 'Åk 2', 3: 'Åk 3' };
  const ST = { mastered: 'Klar', learning: 'Övar', new: 'Ny', locked: 'Låst' };

  /* ---------- val av spelare ---------- */
  U.profiles = function () {
    const db = S.db;
    if (!db.players.length) return U.wizard();
    Au.stop();
    app().innerHTML = `<section class="screen profiles"><h1 class="title">Vem spelar?</h1><div class="tiles">` +
      db.players.map((p) => `<button class="tile" data-pid="${p.id}">${A.animal(p.animal)}<span class="tname">${esc(p.name)}</span></button>`).join('') +
      `<button class="tile addtile" id="addp" aria-label="Ny spelare, för föräldrar: håll in">${A.icon('plus')}<span class="tname">Ny kompis</span><span class="tiny">Föräldrar: håll in</span></button></div></section>`;
    $$('[data-pid]').forEach((b) => b.addEventListener('click', () => U.select(b.dataset.pid)));
    U.bindHold($('#addp'), 1500, () => { S.W = null; U.wizard(); });
    if (!S.greeted) U.say('Vem vill spela?', 'beaver');
  };

  U.select = function (pid) {
    S.pl = S.db.players.find((p) => p.id === pid);
    if (!S.pl) return U.profiles();
    E.ensureSkills(S.pl);
    S.db.current = pid; S.greeted = false; S.sessionRounds = 0; S.skipBuild = false; S.busy = false;
    Au.config(S.pl.settings.voice, S.pl.settings.sfx);
    U.save();
    U.map();
  };

  /* ---------- föräldraguide ---------- */
  U.wizard = function () {
    const W = S.W || (S.W = { step: 0, animal: 'beaver', name: '', answers: {} });
    const Q = E.WIZARD, n = Q.length, step = W.step;
    Au.stop();
    let body = '';
    if (step === 0) {
      body = `<span class="chip">Föräldrar</span><h2>Skapa en ny kompis</h2><p>Låt barnet välja ett djur. Sedan ställer vi några frågor så att spelet börjar på rätt nivå. Det går att ändra senare i föräldravyn.</p>` +
        `<div class="pick">${C.STARTERS.map((a) => `<button class="tile ${W.animal === a ? 'sel' : ''}" data-animal="${a}" aria-label="${a}">${A.animal(a)}</button>`).join('')}</div>` +
        `<label class="field">Namn (valfritt)<input id="pname" maxlength="20" value="${esc(W.name)}" autocomplete="off"></label>`;
    } else if (step <= n) {
      const q = Q[step - 1];
      if (W.answers[q.id] == null) W.answers[q.id] = q.multi ? [] : 0;
      const sel = (i) => (q.multi ? W.answers[q.id].includes(i) : W.answers[q.id] === i);
      body = `<span class="chip">${q.track}</span><h2>${q.title}</h2><p>${q.text}</p><div class="opts">` +
        q.options.map((o, i) => `<button class="opt ${q.multi ? 'multi' : ''} ${sel(i) ? 'sel' : ''}" data-i="${i}"><span class="box">${A.icon('check')}</span>${o.label}</button>`).join('') + '</div>';
    } else {
      const known = E.placementFrom(W.answers), cnt = (t) => known.filter((id) => K.byId[id].track === t).length;
      body = `<span class="chip">Klart</span><h2>Redo att börja</h2><p>${known.length ? `Spelet markerar ${cnt('m')} färdigheter i matte och ${cnt('l')} i läsning som kända, och kontrollerar de högsta först i några lekfulla rundor. Är det för svårt eller för lätt anpassar sig spelet efter hand.` : 'Barnet börjar från början. Spelet går sakta framåt och lägger till nytt när barnet är redo.'}</p>`;
    }
    const last = step === n + 1;
    app().innerHTML = `<section class="screen wizard"><div class="wiz"><div class="dots">${Array.from({ length: n + 2 }, (_, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>${body}` +
      `<div class="navrow"><button class="btn plain small" id="wback">${A.icon('back')}<span>${step === 0 && S.db.players.length ? 'Avbryt' : 'Tillbaka'}</span></button>` +
      `<button class="btn green small" id="wnext"><span>${last ? 'Starta spelet' : 'Nästa'}</span>${A.icon(last ? 'play' : 'check')}</button></div></div></section>`;
    $('#wback').addEventListener('click', () => {
      if (step === 0) { S.W = null; return S.db.players.length ? U.profiles() : null; }
      W.step--; U.wizard();
    });
    $('#wnext').addEventListener('click', () => {
      if (!last) { W.step++; return U.wizard(); }
      const pl = E.newPlayer({ name: W.name.trim(), animal: W.animal, known: E.placementFrom(W.answers) });
      S.db.players.push(pl); S.W = null; U.select(pl.id);
    });
    if (step === 0) {
      $$('[data-animal]').forEach((b) => b.addEventListener('click', () => { W.animal = b.dataset.animal; $$('[data-animal]').forEach((x) => x.classList.toggle('sel', x === b)); }));
      $('#pname').addEventListener('input', (e) => { W.name = e.target.value; });
    } else if (!last) {
      const q = Q[step - 1];
      $$('.opt').forEach((b) => b.addEventListener('click', () => {
        const i = +b.dataset.i;
        if (q.multi) { const a = W.answers[q.id], k = a.indexOf(i); if (k >= 0) a.splice(k, 1); else a.push(i); b.classList.toggle('sel'); }
        else { W.answers[q.id] = i; $$('.opt').forEach((x) => x.classList.toggle('sel', x === b)); }
      }));
    }
  };

  /* ---------- föräldravy ---------- */
  function safariPanel(pl) {
    const sf = pl.safari, animals = Object.values(sf.tiles).filter((t) => t.k === 'animal').length;
    const things = Object.values(sf.tiles).reduce((a, t) => a + (t.k === 'garden' ? t.items.length : t.k === 'big' ? 1 : 0), 0);
    const lv = C.LEVELS.map((k, L) => {
      const i = E.levelInfo(pl, L), done = sf.levelsDone > L;
      return `<div class="srow"><div><span class="sname">${C.LEVEL_NAMES[L]}</span><span class="slvl">${i.mastered} av ${i.total} klara${done ? ', klarad' : ''}</span></div><div class="sbtn"><span class="pill ${done ? 'mastered' : 'learning'}">${done ? 'Klar' : 'Pågår'}</span></div><div class="sbar"><i style="width:${Math.round(Math.min(1, i.mastered / i.need) * 100)}%"></i></div></div>`;
    }).join('');
    return `<div class="panel"><h3>Safarit</h3><div class="stats"><div><b>${animals} av ${C.PLACE_ORDER.length}</b>djur har flyttat in</div><div><b>${things}</b>växter och byggen</div><div><b>${sf.cols}×${sf.rows}</b>rutor</div></div>` +
      `<p>Nya djur dyker upp när barnet är redo för det de kan. När nästan alla färdigheter i en årskurs är klara blir det fest och safarit växer.</p>${lv}</div>`;
  }

  U.parent = function () {
    const pl = S.pl, scroll = $('.parent') ? $('.parent').scrollTop : 0;
    Au.stop();
    const sum = E.summary(pl);
    const rows = (t) => K.list.filter((s) => s.track === t).map((s) => {
      const st = E.status(pl, s.id), k = pl.sk[s.id], pct = st === 'mastered' ? 100 : Math.round(k.p * 100);
      return `<div class="srow"><div><span class="sname">${s.name}</span><span class="slvl">${LVL[s.lvl]}</span><span class="slvl host">${C.PLACES[s.place].who}</span></div><div class="sbtn"><span class="pill ${st}">${ST[st]}</span>` +
        `<button class="btn plain small" data-toggle="${s.id}">${st === 'mastered' ? 'Ångra' : 'Kan redan'}</button></div><div class="sbar"><i style="width:${pct}%"></i></div></div>`;
    }).join('');
    const sw = (key, label) => `<div class="toggle"><span>${label}</span><button class="sw ${pl.settings[key] ? 'on' : ''}" data-set="${key}" aria-pressed="${!!pl.settings[key]}" aria-label="${label}"></button></div>`;
    const voice = !Au.canSpeak() ? 'Den här webbläsaren saknar talsyntes. Spelet fungerar, men djuren kan inte prata.' : Au.hasSwedish() ? 'En svensk röst hittades.' : 'Ingen svensk röst hittades. Installera en svensk röst i enhetens inställningar för text till tal, annars kan uttalet bli fel.';
    app().innerHTML = `<section class="screen parent"><div class="ptop2"><button class="iconbtn" id="pback" aria-label="Tillbaka">${A.icon('back')}</button><h2>Föräldrar: ${esc(pl.name || 'spelaren')}</h2></div>` +
      (S.storageOk ? '' : '<div class="warn panel">Framsteg kan inte sparas i den här webbläsaren just nu. Det går att spela, men allt nollställs när sidan stängs.</div>') +
      `<div class="panel"><h3>Översikt</h3><div class="stats"><div><b>${sum.m.mastered} av ${sum.m.total}</b>matte klart</div><div><b>${sum.l.mastered} av ${sum.l.total}</b>läsning klart</div><div><b>${pl.rounds}</b>rundor</div><div><b>${pl.gold}</b>guldstjärnor</div></div>` +
      `<p>Spelet går vidare först när barnet klarat en färdighet säkert, och tar upp gamla färdigheter igen efter en stund. Märker du att något redan är lätt kan du välja Kan redan.</p></div>` +
      safariPanel(pl) +
      `<div class="panel"><h3>Matte</h3>${rows('m')}</div><div class="panel"><h3>Läsning</h3>${rows('l')}</div>` +
      `<div class="panel"><h3>Inställningar</h3>${sw('voice', 'Djuren pratar')}${sw('sfx', 'Ljudeffekter')}<p>${voice}</p><div class="row"><button class="btn plain small" id="vtest">${A.icon('speaker')}<span>Testa rösten</span></button></div></div>` +
      `<div class="panel"><h3>Spelare</h3><div class="row"><button class="btn plain small" id="pswitch">Byt spelare</button><button class="btn plain small" data-danger="reset">Nollställ framsteg</button><button class="btn plain small" data-danger="remove">Ta bort spelare</button></div></div></section>`;
    $('.parent').scrollTop = scroll;
    $('#pback').addEventListener('click', U.map);
    $('#pswitch').addEventListener('click', () => { S.greeted = false; U.profiles(); });
    $('#vtest').addEventListener('click', () => U.say('Hej! Jag är Bävern. Ska vi räkna stockar tillsammans?', 'beaver'));
    $$('[data-toggle]').forEach((b) => b.addEventListener('click', () => { E.setMastered(pl, b.dataset.toggle, !pl.sk[b.dataset.toggle].mastered); E.syncSafari(pl, { auto: true }); U.save(); U.parent(); }));
    $$('[data-set]').forEach((b) => b.addEventListener('click', () => { pl.settings[b.dataset.set] = !pl.settings[b.dataset.set]; Au.config(pl.settings.voice, pl.settings.sfx); U.save(); U.parent(); }));
    $$('[data-danger]').forEach((b) => b.addEventListener('click', () => {
      if (!b.dataset.armed) {
        b.dataset.armed = '1'; const old = b.textContent; b.textContent = 'Tryck igen för att bekräfta';
        return void setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = old; } }, 4000);
      }
      if (b.dataset.danger === 'reset') { const fresh = E.newPlayer({ id: pl.id, name: pl.name, animal: pl.animal, known: [] }); fresh.settings = pl.settings; Object.assign(pl, fresh); U.save(); U.parent(); }
      else { S.db.players = S.db.players.filter((p) => p.id !== pl.id); S.db.current = null; S.pl = null; U.save(); U.profiles(); }
    }));
  };

  /* ---------- start ---------- */
  U.boot = function () {
    Au.init();
    S.db = U.load();
    document.addEventListener('pointerdown', Au.unlock, { passive: true });
    const cur = S.db.players.find((p) => p.id === S.db.current);
    if (cur && S.db.players.length === 1) U.select(cur.id); else U.profiles();
  };
})(globalThis.App || (globalThis.App = {}));
