const NUMW = ['noll', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju'];
const cap = s => s[0].toUpperCase() + s.slice(1);
const LETTERS = 'ASOMLIRBEKTUFP'.split('');
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function newChallenge() {
  const kind = S.content === 'mix' ? ['shape', 'number', 'letter', 'math'][G.chIdx % 4] : S.content;
  const ans = Math.floor(Math.random() * 3);
  if (kind === 'shape') { const o = shuffle(SHAPES).slice(0, 3); return { kind, ans, sign: { t: 'shape', v: o[ans].id }, gates: o.map(x => ({ t: 'shape', v: x.id })), say: `Hitta ${o[ans].n}!`, fix: `Det var ${o[ans].n}.` }; }
  if (kind === 'number') { const o = shuffle([1, 2, 3, 4, 5, 6]).slice(0, 3), n = o[ans]; return { kind, ans, sign: { t: 'digit', v: n }, gates: o.map(x => ({ t: 'dots', v: x })), say: `${cap(NUMW[n])}! Spring till ${n === 1 ? 'en prick' : NUMW[n] + ' prickar'}.`, fix: `Där var ${n === 1 ? 'en prick' : NUMW[n] + ' prickar'}.` }; }
  if (kind === 'letter') { const o = shuffle(LETTERS).slice(0, 3); return { kind, ans, sign: { t: 'letter', v: o[ans] }, gates: o.map(x => ({ t: 'letter', v: x })), say: `Hitta bokstaven ${o[ans]}!`, fix: `Där var ${o[ans]}.` }; }
  const a = 1 + Math.floor(Math.random() * 3), b = 1 + Math.floor(Math.random() * 3), s = a + b;
  const wrong = shuffle([1, 2, 3, 4, 5, 6, 7].filter(x => x !== s)).slice(0, 2), o = wrong.slice(); o.splice(ans, 0, s);
  return { kind: 'math', ans, sign: { t: 'text', v: `${a}+${b}` }, gates: o.map(x => ({ t: 'digit', v: x })), say: `${cap(NUMW[a])} plus ${NUMW[b]}?`, fix: `${cap(NUMW[a])} plus ${NUMW[b]} är ${NUMW[s]}.` };
}
