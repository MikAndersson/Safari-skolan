/* ================= ljud och röst ================= */
let AC = null;
function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
function tone(f, t0, dur, type, vol, f2) {
  const a = ac(); if (!a) return; const t = a.currentTime + t0, o = a.createOscillator(), g = a.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
}
const sfx = {
  pick: () => { tone(988, 0, 0.09, 'triangle', 0.1); tone(1480, 0.06, 0.12, 'triangle', 0.08); },
  good: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.25, 'triangle', 0.14)),
  bad: () => { tone(330, 0, 0.18, 'square', 0.05, 250); tone(250, 0.16, 0.28, 'square', 0.05, 180); },
  jump: () => tone(320, 0, 0.22, 'sine', 0.12, 720),
  bonk: () => { tone(150, 0, 0.25, 'triangle', 0.22, 70); },
  sign: () => { tone(660, 0, 0.12, 'sine', 0.1); tone(880, 0.1, 0.16, 'sine', 0.1); },
  fanfare: () => [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, i === 5 ? 0.6 : 0.2, 'triangle', 0.15)),
  jump2: () => tone(520, 0, 0.18, 'sine', 0.11, 1040),
  duck: () => tone(400, 0, 0.14, 'sine', 0.09, 200),
  crunch: () => { tone(110, 0, 0.18, 'sawtooth', 0.08, 60); tone(220, 0.03, 0.12, 'square', 0.05, 90); },
  snort: () => tone(90, 0, 0.25, 'sawtooth', 0.07, 70),
  splash: () => { tone(900, 0, 0.12, 'sine', 0.06, 300); tone(500, 0.05, 0.25, 'triangle', 0.06, 150); },
  bump: () => tone(200, 0, 0.12, 'triangle', 0.12, 120),
  boing: () => tone(260, 0, 0.35, 'sine', 0.13, 620),
  land: () => tone(120, 0, 0.08, 'triangle', 0.08, 80),
  whee: () => { tone(400, 0, 0.45, 'sine', 0.1, 900); tone(600, 0.15, 0.35, 'triangle', 0.06, 1200); },
  zoom: () => tone(500, 0, 0.2, 'sawtooth', 0.04, 1400),
  rush: () => { tone(300, 0, 0.5, 'sawtooth', 0.06, 1200); tone(600, 0.1, 0.4, 'triangle', 0.08, 1600); }
};
let svVoice = null;
function pickVoice() { try { const v = speechSynthesis.getVoices(); svVoice = v.find(x => /^sv/i.test(x.lang)) || null; } catch (e) {} }
if (window.speechSynthesis) { pickVoice(); try { speechSynthesis.onvoiceschanged = pickVoice; } catch (e) {} }
function say(t) {
  if (!S.voice || !window.speechSynthesis) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'sv-SE'; if (svVoice) u.voice = svVoice; u.rate = 0.95; u.pitch = 1.3; speechSynthesis.speak(u); } catch (e) {}
}

/* ================= lutning (gravitationssensorn) ================= */
const T = { got: false, raw: 0, ang: 0, inv: 0, listening: false };
function screenAngle() { const o = screen.orientation; const a = (o && typeof o.angle === 'number') ? o.angle : (window.orientation || 0); return a * Math.PI / 180; }
function onMotion(e) {
  const g = e.accelerationIncludingGravity; if (!g || g.x == null || g.y == null) return;
  const a = screenAngle(), sx = g.x * Math.cos(a) - g.y * Math.sin(a), sy = g.x * Math.sin(a) + g.y * Math.cos(a);
  if (!T.inv) { if (Math.abs(sy) < 3) return; T.inv = sy > 0 ? 1 : -1; }  // olika webbläsare har olika tecken
  const vx = sx * T.inv, vy = sy * T.inv;
  if (Math.hypot(vx, vy) < 2) return;                                      // plattan ligger nästan platt
  T.raw = Math.atan2(-vx, vy) * 180 / Math.PI;                              // medurs = positivt
  T.got = true;
}
async function enableTilt() {
  try {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      const r = await DeviceMotionEvent.requestPermission(); if (r !== 'granted') return false;
    }
    if (!T.listening) { window.addEventListener('devicemotion', onMotion); T.listening = true; }
    return true;
  } catch (e) { return false; }
}
window.__tilt = T;
