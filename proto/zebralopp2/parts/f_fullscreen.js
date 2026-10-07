/* ================= helskärm och liggande läge ================= */
const TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
const fsEl = document.documentElement;
const canFS = !!(fsEl.requestFullscreen || fsEl.webkitRequestFullscreen);
const standalone = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
function goFullscreen() {
  if (!TOUCH || standalone) return;
  try {
    const isFS = document.fullscreenElement || document.webkitFullscreenElement;
    const lock = () => { try { const p = screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'); if (p && p.catch) p.catch(() => {}); } catch (e) {} };
    if (isFS) { lock(); return; }
    if (fsEl.requestFullscreen) { const p = fsEl.requestFullscreen({ navigationUI: 'hide' }); if (p && p.then) p.then(lock).catch(() => {}); }
    else if (fsEl.webkitRequestFullscreen) { fsEl.webkitRequestFullscreen(); setTimeout(lock, 300); }
  } catch (e) {}
}
if (TOUCH && !canFS && !standalone) {
  $('#fshint').hidden = false;
  $('#fshint').innerHTML = '<b>Helskärm på iPhone:</b> tryck på dela-knappen och välj <b>Lägg till på hemskärmen</b>. Öppna sedan spelet därifrån.';
}
let countT = 0;
function checkOrient() {
  const portrait = TOUCH && innerHeight > innerWidth;
  $('#rot').hidden = !portrait;
  if (portrait) {
    clearInterval(countT); $('#count').hidden = true;
    if (G.state === 'play' && !G.rotPause) { G.rotPause = true; try { speechSynthesis.cancel(); } catch (e) {} }
    $('#rotSub').textContent = G.state === 'play' ? 'Spelet är pausat och väntar på dig.' : 'Zebraloppet spelas med mobilen på sidan.';
  } else if (G.rotPause && !G.paused) {
    let n = 3; const el = $('#count'); el.hidden = false; el.textContent = n; clearInterval(countT);
    countT = setInterval(() => { n--; if (n <= 0) { clearInterval(countT); el.hidden = true; G.rotPause = false; last = performance.now(); } else el.textContent = n; }, 700);
  }
}
window.__checkOrient = checkOrient;

