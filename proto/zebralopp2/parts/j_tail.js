
/* ================= inmatning ================= */
let ts = null;
addEventListener('pointerdown', e => { if (e.target.closest('button,.panel,input,label')) return; ts = { x: e.clientX, y: e.clientY, t: performance.now(), used: false }; ac(); });
addEventListener('pointermove', e => {
  if (!ts || ts.used) return; const dx = e.clientX - ts.x, dy = e.clientY - ts.y;
  if (Math.hypot(dx, dy) > 30) { ts.used = true; if (Math.abs(dx) > Math.abs(dy)) { if (S.ctrl !== 'tilt') moveLane(dx > 0 ? 1 : -1); } else if (dy < 0) jump(); else duck(); }
});
addEventListener('pointerup', e => {
  if (ts && !ts.used && performance.now() - ts.t < 400) {
    if (S.ctrl === 'tilt') jump(); else { const x = e.clientX / innerWidth; if (x < 0.36) moveLane(-1); else if (x > 0.64) moveLane(1); else jump(); }
  }
  ts = null;
});
addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') moveLane(-1); else if (e.key === 'ArrowRight') moveLane(1);
  else if (e.key === 'ArrowUp' || e.key === ' ') { jump(); e.preventDefault(); } else if (e.key === 'ArrowDown') duck();
  else if (e.key === 'r' || e.key === 'Shift') rush(); else if (e.key === 'Escape' && G.state === 'play') openPause();
});
$('#rush').addEventListener('pointerdown', e => { e.preventDefault(); ac(); rush(); });
addEventListener('resize', layout);
addEventListener('orientationchange', () => setTimeout(layout, 60));
if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', () => { T.inv = 0; setTimeout(layout, 50); });
document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'play' && !G.paused) openPause(); });

/* ================= menyer ================= */
$('#animSeg').innerHTML = Object.entries(ANIMALS).map(([k, a]) => `<button data-v="${k}"><b>${a.name.replace(/n$/, '').replace(/en$/, '')}</b><span class="dots">${[1, 2, 3, 4].map(i => `<i class="${i <= a.f ? 'f' : ''}"></i>`).join('')}</span><small>${a.desc}</small></button>`).join('');
$('#animSeg').querySelectorAll('b').forEach((b, i) => b.textContent = ['Buffel', 'Zebra', 'Antilop', 'Gasell'][i]);
function seg(id, key, onSet) {
  const el = $(id);
  const paint = () => el.querySelectorAll('button').forEach(b => b.classList.toggle('on', String(S[key]) === b.dataset.v));
  el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S[key] = b.dataset.v; if (onSet) onSet(b.dataset.v); save(); paint(); hint(); });
  paint();
}
seg('#animSeg', 'animal', setAnimal); seg('#ctrlSeg', 'ctrl'); seg('#contSeg', 'content'); seg('#tiltSeg', 'tiltMode');
function hint() {
  const a = { buffel: 'Buffeln kan inte hoppa men springer rakt igenom stockar, stenar och grenar, och vadar genom vatten.', zebra: 'Zebran hoppar över stockar och bäckar.', antilop: 'Antilopen kan hoppa en gång till i luften – det behövs över breda floder. Ducka under grenar.', gasell: 'Gasellen är snabbast och hoppar långt. Ducka under grenar.' }[S.animal];
  $('#hint').innerHTML = (S.ctrl === 'tilt'
    ? 'Håll mobilen på bredden och <b>vrid den som en ratt</b>. Kurvorna drar dig utåt. Tryck för att hoppa, svep nedåt för att ducka.'
    : '<b>Svep</b> åt sidan för att byta fil, uppåt för att hoppa och nedåt för att ducka.') + ' Bananer fyller <b>ruschen</b>. ' + a;
}
hint();
const comp = $('#comp'); comp.value = S.comp; $('#compv').textContent = S.comp + ' %';
comp.addEventListener('input', () => { S.comp = +comp.value; $('#compv').textContent = S.comp + ' %'; save(); });
$('#inv').checked = S.invert; $('#inv').addEventListener('change', e => { S.invert = e.target.checked; save(); });
$('#voice').checked = S.voice; $('#voice').addEventListener('change', e => { S.voice = e.target.checked; save(); });
$('#drift').checked = S.drift; $('#drift').addEventListener('change', e => { S.drift = e.target.checked; save(); });

async function start() {
  goFullscreen();
  ac();
  try { if (window.speechSynthesis) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } } catch (e) {}
  if (S.ctrl === 'tilt') {
    const ok = await enableTilt();
    if (!ok) { S.ctrl = 'swipe'; toast('Lutningen fick inte tillstånd – vi kör med svep i stället.', 4000); }
    else {
      T.inv = 0; T.got = false;
      setTimeout(() => { if (G.state === 'play' && S.ctrl === 'tilt' && !T.got) { S.ctrl = 'swipe'; layout(); $('#wheel').hidden = true; toast('Ingen lutning hittades här. Öppna spelet från GitHub-sidan på mobilen. Nu: svep.', 6000); } }, 1800);
    }
  }
  $('#menu').hidden = true; $('#end').hidden = true; $('#hud').hidden = false; $('#rush').hidden = false; $('#wheel').hidden = S.ctrl !== 'tilt';
  G.state = 'play'; G.paused = false; G.rotPause = false; G.finSpawned = false; reset(); layout();
  say(`${AN.name} mot vårtsvinet, strutsen och hyenan. Klara, färdiga, spring!`);
}
function openPause() { G.paused = true; $('#settings').hidden = false; }
function toMenu() { G.state = 'menu'; G.paused = false; G.rotPause = false; ents.length = 0; MON.ty = MON.hide; stage.classList.remove('rushing'); $('#settings').hidden = true; $('#end').hidden = true; $('#hud').hidden = true; $('#rush').hidden = true; $('#menu').hidden = false; layout(); }
$('#go').addEventListener('click', start);
$('#again').addEventListener('click', start);
$('#tomenu').addEventListener('click', toMenu);
$('#pause').addEventListener('click', openPause);
$('#resume').addEventListener('click', () => { goFullscreen(); $('#settings').hidden = true; G.paused = false; last = performance.now(); });
$('#quit').addEventListener('click', toMenu);
window.__start = start;
window.__api = { jump, duck, moveLane, rush, ents, NPCS, G, ANIMALS, get AN() { return AN; } };

layout(); renderProg();
requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });
})();
</script>
