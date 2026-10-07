// Kör: node test/engine.test.js
const path = require('path');
globalThis.App = {};
['art', 'content', 'skills', 'engine'].forEach((f) => require(path.join('..', 'src', f + '.js')));
const { skills: K, engine: E, content: C } = globalThis.App;

let fails = 0;
const fail = (m) => { fails++; if (fails < 40) console.log('FEL:', m); };
const bad = /undefined|NaN|\bnull\b|\[object/;

/* 1. struktur och matte i alla generatorer */
let total = 0;
for (const s of K.list) {
  for (const assist of [false, true]) {
    for (const mode of ['practice', 'lesson']) {
      const r = E.makeRng(1000 + total);
      for (let i = 0; i < 150; i++) {
        total++;
        let q;
        try { q = K.makeQuestion(s.id, r, { assist, mode }); } catch (e) { fail(`${s.id}: ${e.message}`); continue; }
        const texts = [q.say, q.explain, q.show || '', JSON.stringify(q.choices || ''), q.listen || ''];
        if (!q.say || !q.explain) fail(`${s.id}: saknar say/explain`);
        if (texts.some((t) => bad.test(t))) fail(`${s.id}: ogiltig text i ${texts.find((t) => bad.test(t)).slice(0, 120)}`);
        if (q.kind === 'choice') {
          const n = q.choices.length;
          if (n < 2 || n > 3) fail(`${s.id}: ${n} val`);
          if (assist && n !== 2 && s.id !== 'z_more' && s.id !== 'z_oddeven' && s.id !== 'l_tf') fail(`${s.id}: assist ska ge 2 val, fick ${n}`);
          const m = /class="expr[^"]*">(\d+) ([+−×]) (\d+)</.exec(q.show || '');
          if (m) {
            const a = +m[1], b = +m[3], exp = m[2] === '+' ? a + b : m[2] === '−' ? a - b : a * b;
            if (String(exp) !== q.answer) fail(`${s.id}: ${m[0]} ska bli ${exp}, svaret är ${q.answer}`);
            if (m[2] === '−' && a - b < 0) fail(`${s.id}: negativt svar`);
            if (s.id === 'm_add20' && a + b > 20) fail(`${s.id}: summa över 20`);
          }
        } else if (q.kind === 'give') {
          if (q.target > q.total || q.target < 1) fail(`${s.id}: give target ${q.target} total ${q.total}`);
        } else if (q.kind === 'build') {
          if (q.tray.length < q.letters.length + 1) fail(`${s.id}: för få brickor`);
          const rest = q.tray.map((t) => t.ch).sort().join('');
          const need = q.letters.slice().sort();
          const left = rest.split('');
          for (const ch of need) { const i = left.indexOf(ch); if (i < 0) fail(`${s.id}: bokstav ${ch} saknas`); else left.splice(i, 1); }
        } else fail(`${s.id}: okänd kind ${q.kind}`);
      }
    }
  }
}
console.log(`Frågor kontrollerade: ${total}`);

/* 2. tabellkontroller */
const specific = (id, fn) => { const r = E.makeRng(7); for (let i = 0; i < 300; i++) fn(K.makeQuestion(id, r, {})); };
specific('m_sub20', (q) => { const m = /(\d+) − (\d+)/.exec(q.show); if (+m[1] > 20) fail('m_sub20 över 20'); });
specific('m_sub100b', (q) => { const m = /(\d+) − (\d+)/.exec(q.show); if (+m[1] % 10 >= +m[2] % 10) fail(`m_sub100b utan växling ${m[0]}`); });
specific('m_add100b', (q) => { const m = /(\d+) \+ (\d+)/.exec(q.show); if ((+m[1] % 10) + (+m[2] % 10) < 10 || +m[1] + +m[2] > 100) fail(`m_add100b ${m[0]}`); });
specific('m_add100a', (q) => { const m = /(\d+) \+ (\d+)/.exec(q.show); if ((+m[1] % 10) + (+m[2] % 10) >= 10 || +m[1] + +m[2] > 100) fail(`m_add100a ${m[0]}`); });
specific('m_sub100a', (q) => { const m = /(\d+) − (\d+)/.exec(q.show); if (+m[1] % 10 < +m[2] % 10) fail(`m_sub100a ${m[0]}`); });
specific('l_build1', (q) => { const ok = new Set(('AMSOT' + 'BLKHF').split('')); if (!q.letters.every((c) => ok.has(c))) fail(`l_build1 ${q.word}`); });
specific('l_word1', (q) => { if (!q.explain) fail('l_word1'); });
for (const [w] of C.WORDS) if (!/^[a-zåäö]+$/.test(w)) fail('ord med konstiga tecken: ' + w);

/* 3. placering */
const none = E.placementFrom({});
if (none.length) fail('tom placering ska vara tom');
const answers = { count: 3, digits: 4, calc: 4, more: [0, 1, 4], letters: 4, sounds: 3, reading: 3 };
const known = E.placementFrom(answers);
console.log(`Placering (hög nivå): ${known.length} av ${K.list.length} färdigheter kända`);
if (!known.includes('m_add100a') || !known.includes('m_place') || !known.includes('l_sent')) fail('placering saknar förväntade färdigheter');
if (known.includes('m_add100b') || known.includes('l_story2')) fail('placering för hög');

/* 4. simulering av barn, med safarit */
function cap(label, pl) {
  const sf = pl.safari;
  const keys = Object.keys(sf.tiles);
  if (keys.length > sf.cols * sf.rows) fail(`${label}: fler rutor (${keys.length}) än plats (${sf.cols * sf.rows})`);
  keys.forEach((k) => {
    const [x, y] = k.split(',').map(Number), t = sf.tiles[k];
    if (x >= sf.cols || y >= sf.rows) fail(`${label}: ruta ${k} utanför ${sf.cols}x${sf.rows}`);
    if (t.k === 'garden' && (t.items.length < 1 || t.items.length > C.SLOTS)) fail(`${label}: trädgård med ${t.items.length} saker`);
  });
  const animals = keys.map((k) => sf.tiles[k]).filter((t) => t.k === 'animal').map((t) => t.id);
  if (new Set(animals).size !== animals.length) fail(`${label}: samma djur placerat två gånger`);
}
function simulate(label, acc, rounds, known) {
  const pl = E.newPlayer({ known, now: 0 });
  let now = 1e9, plays = {};
  const r = E.makeRng(99);
  const rnd = E.makeRng(5);
  let lessons = 0, mastered = 0, full = 0, dropped = 0;
  const arrive = {}, grade = {};
  // barnet bygger allt som väntar (första lediga ruta)
  const buildAll = (round) => {
    const sf = pl.safari;
    if (sf.grow) E.applyGrow(pl);
    while (sf.pending.length) {
      const p = sf.pending[0], sp = E.spots(pl, p);
      if (!sp.length) { sf.pending.shift(); dropped++; continue; }
      const [x, y] = sp[Math.floor(rnd.f() * sp.length)];
      if (!E.place(pl, x, y).ok) fail(`${label}: place misslyckades`);
    }
    cap(label, pl);
  };
  buildAll(0);
  for (let round = 0; round < rounds; round++) {
    const place = E.recommend(pl, now);
    if (!E.isReady(pl, place)) fail(`${label}: rekommenderar djur som inte är redo: ${place}`);
    const plan = E.planRound(pl, place, r, now);
    if (plan.blocked) { fail(`${label}: runda blockerad på ${place}`); break; }
    plays[place] = (plays[place] || 0) + 1;
    let gold = 0, events = [];
    for (const it of plan.items) {
      const q = E.makeQuestion(pl, it, r);
      if (it.mode === 'lesson') { lessons++; E.markLesson(pl, it.skill); continue; }
      const u = rnd.f();
      const res = u < acc ? 'first' : u < acc + (1 - acc) * 0.6 ? 'second' : 'revealed';
      if (res === 'first') gold++;
      const ev = E.record(pl, it.skill, res, now);
      events.push(...ev);
      mastered += ev.filter((e) => e.t === 'mastered').length;
    }
    const rw = E.finishRound(pl, place, 5, gold, events);
    if (rw.full) full++;
    rw.arrivals.forEach((id) => { arrive[id] = round + 1; if (!E.isReady(pl, id)) fail(`${label}: ${id} kom utan att vara redo`); });
    rw.grades.forEach((g) => { grade[g] = round + 1; });
    buildAll(round + 1);
    now += 3 * 3600 * 1000 * (round % 3 === 2 ? 8 : 1); // tre rundor per dag ungefär
  }
  const s = E.summary(pl);
  const stat = K.list.reduce((a, x) => { const st = E.status(pl, x.id); a[st] = (a[st] || 0) + 1; return a; }, {});
  const sf = pl.safari, nA = Object.values(sf.tiles).filter((t) => t.k === 'animal').length;
  console.log(`${label}: ${rounds} rundor -> klara ${s.m.mastered}/${s.m.total} matte, ${s.l.mastered}/${s.l.total} läsning | ${JSON.stringify(stat)} | lektioner ${lessons} | platser ${JSON.stringify(plays)}`);
  console.log(`   safari ${sf.cols}x${sf.rows}, årskurser klara ${sf.levelsDone} ${JSON.stringify(grade)}, djur ${nA}/14 ${JSON.stringify(arrive)}, fullt ${full} ggr, tappade ${dropped}`);
  if (dropped) fail(`${label}: ${dropped} saker fick ingen plats`);
  return { pl, s, grade, arrive, full };
}
const start = E.newPlayer({ now: 0 });
C.STARTERS.forEach((p) => { if (!E.isReady(start, p)) fail(`${p} är inte redo från start`); const i = E.placeInfo(start, p, 1); if (i.state === 'sleep') fail(`${p} sover från start`); });
C.PLACE_ORDER.filter((p) => !C.STARTERS.includes(p)).forEach((p) => { if (E.isReady(start, p)) fail(`${p} borde vänta`); });
if (start.safari.pending.length !== 4 || start.safari.pending.some((p) => p.k !== 'animal')) fail('nystartad spelare ska ha fyra djur att placera');
const a = simulate('Nybörjare, 90 % rätt', 0.9, 200, []);
const b = simulate('Nybörjare, 60 % rätt', 0.6, 200, []);
const c = simulate('Nybörjare, 35 % rätt', 0.35, 100, []);
const d = simulate('Högt placerad, 95 % rätt', 0.95, 60, known);
const e = simulate('Högt placerad, men svagt (40 %)', 0.4, 40, known);
const demoted = K.list.filter((s) => e.pl.sk[s.id].placed === false && e.pl.sk[s.id].n > 0 && !e.pl.sk[s.id].mastered).length;
console.log(`Överskattad nivå: ${demoted} färdigheter nedflyttade till övning`);
if (!(a.s.m.mastered + a.s.l.mastered > b.s.m.mastered + b.s.l.mastered)) fail('bättre barn ska nå längre');
if (!(demoted > 0)) fail('överskattad startnivå rättas inte till');

/* 5. safarit: ordning, firande, migrering, föräldraändringar */
{
  if (!(a.pl.safari.levelsDone >= 1)) fail('duktigt barn klarar minst F-klass på 200 rundor');
  const order = Object.entries(a.arrive).sort((x, y) => x[1] - y[1]).map((x) => x[0]);
  console.log('Ordning djuren kom (90 %):', order.join(' > '));
  if (a.grade[1] && a.arrive.gorilla && a.arrive.gorilla < a.grade[1]) fail('åk 3-djuret kom före F-klass var klar');
  // dimensioner följer årskurserna
  const need = C.SIZES[a.pl.safari.levelsDone];
  if (a.pl.safari.cols < need[0] || a.pl.safari.rows < need[1]) fail('safarit är mindre än årskursen ger');
  // firandet räknas en gång per årskurs
  const pl = E.newPlayer({ now: 0 }); const sf = pl.safari;
  K.list.filter((s) => s.lvl === 'F').forEach((s) => E.setMastered(pl, s.id, true, 0));
  const r1 = E.syncSafari(pl, {});
  if (r1.grades.join() !== '1' || !sf.grow || sf.celebrate.join() !== '1') fail('F-klass klar ska ge ett firande');
  const g = E.applyGrow(pl);
  if (g.to.cols !== C.SIZES[1][0] || g.to.rows !== C.SIZES[1][1]) fail('safarit växer till nästa storlek');
  if (E.syncSafari(pl, {}).grades.length) fail('samma årskurs firas två gånger');
  if (!pl.safari.owned.includes('monkey') || !pl.safari.owned.includes('giraffe')) fail('åk 1-djur ska ha kommit när F-klass är klar');
  // nästa djur
  const fresh = E.newPlayer({ now: 0 }); const nx = E.nextAnimal(fresh);
  if (!nx || nx.progress !== 0 && nx.progress > 0.2) console.log('nextAnimal från start:', JSON.stringify(nx));
  E.setMastered(fresh, 'm_num5', true, 0); E.setMastered(fresh, 'm_num10', true, 0);
  const nx2 = E.nextAnimal(fresh); if (!(nx2 && nx2.progress > 0)) fail('nextAnimal ska visa framsteg');
  // migrering av äldre sparfil
  const old = E.newPlayer({ now: 0 }); delete old.safari; old.park = Array.from({ length: 23 }, (_, i) => i);
  E.ensureSafari(old);
  const decor = Object.values(old.safari.tiles).reduce((n, t) => n + (t.k === 'garden' ? t.items.length : t.k === 'big' ? 1 : 0), 0);
  const placedA = Object.values(old.safari.tiles).filter((t) => t.k === 'animal').length;
  if (decor !== 23 || placedA !== 4 || old.safari.pending.length) fail(`migrering: ${decor} saker, ${placedA} djur, ${old.safari.pending.length} väntar`);
  cap('migrering', old);
  // föräldern sätter hög nivå: djur placeras direkt, ingen firandekö
  const par = E.newPlayer({ now: 0 }); while (par.safari.pending.length) { const sp = E.spots(par, par.safari.pending[0]); E.place(par, sp[0][0], sp[0][1]); }
  K.list.filter((s) => s.lvl === 'F' || s.lvl === '1').forEach((s) => E.setMastered(par, s.id, true, 0));
  E.syncSafari(par, { auto: true });
  if (par.safari.pending.length || par.safari.celebrate.length || par.safari.grow) fail('föräldraändring ska inte skapa väntande firande');
  if (par.safari.levelsDone < 2) fail('föräldraändring flyttar fram årskurs');
  cap('förälder', par);
  // rutor tar slut: småsaker slutar komma men djur får alltid plats
  const crowd = E.newPlayer({ now: 0 });
  for (let i = 0; i < 400; i++) { E.finishRound(crowd, 'beaver', 5, 5, []); const sf2 = crowd.safari; if (sf2.grow) E.applyGrow(crowd); while (sf2.pending.length) { const sp = E.spots(crowd, sf2.pending[0]); if (!sp.length) { sf2.pending.shift(); continue; } E.place(crowd, sp[0][0], sp[0][1]); } }
  const small = Object.values(crowd.safari.tiles).reduce((n, t) => n + (t.k === 'garden' ? t.items.length : 0), 0);
  const lush = Object.values(crowd.safari.tiles).reduce((n, t) => n + (t.k === 'garden' ? t.items.reduce((a, it) => a + it.g, 0) : 0), 0);
  console.log(`Barn som inte kommer framåt, 400 rundor: ${small} växter (${lush} växtsteg) på ${Object.keys(crowd.safari.tiles).length} av ${crowd.safari.cols * crowd.safari.rows} rutor, ${crowd.safari.cols}x${crowd.safari.rows}`);
  if (Object.keys(crowd.safari.tiles).length >= crowd.safari.cols * crowd.safari.rows) fail('småsaker får aldrig ta sista rutorna');
  if (!(lush > 0)) fail('när det är fullt ska växter få växa (vattenkanna)');
  cap('fullt', crowd);
}

console.log(fails ? `\n${fails} fel` : '\nAlla tester gick igenom');
process.exit(fails ? 1 : 0);
