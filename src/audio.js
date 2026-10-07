/* Djurkompisarna – röst (webbläsarens talsyntes) och enkla ljudeffekter. */
(function (App) {
  'use strict';
  const Au = (App.audio = {});
  let voices = [], ctx = null, voiceOn = true, sfxOn = true, token = 0, timer = null;

  Au.config = (v, s) => { voiceOn = v !== false; sfxOn = s !== false; };
  const loadVoices = () => { try { voices = speechSynthesis.getVoices() || []; } catch (e) { voices = []; } };
  Au.init = function () {
    if (typeof speechSynthesis === 'undefined') return;
    loadVoices();
    try { speechSynthesis.onvoiceschanged = loadVoices; } catch (e) { /* inget */ }
  };
  Au.hasSwedish = () => voices.some((v) => /^sv/i.test(v.lang));
  Au.canSpeak = () => typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';

  /* Pratar text. place = platsens röstprofil. done anropas när det är färdigt (eller efter en reservtid). */
  Au.say = function (text, place, done, opts) {
    opts = opts || {};
    const my = ++token;
    clearTimeout(timer);
    const finish = () => { if (my === token && done) { const d = done; done = null; d(); } };
    if (!voiceOn || !Au.canSpeak() || !text) { timer = setTimeout(finish, opts.quick ? 50 : Math.min(2200, 400 + (text || '').length * 40)); return; }
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'sv-SE';
      const v = voices.find((x) => /^sv[-_]SE/i.test(x.lang)) || voices.find((x) => /^sv/i.test(x.lang));
      if (v) u.voice = v;
      u.rate = (place && place.rate ? place.rate : 0.9) * (opts.fast ? 1.15 : 1);
      u.pitch = place && place.pitch ? place.pitch : 1;
      u.onend = finish; u.onerror = finish;
      timer = setTimeout(finish, 1500 + text.length * 110); // reserv om onend aldrig kommer
      setTimeout(() => { if (my === token) { try { speechSynthesis.speak(u); } catch (e) { finish(); } } }, 30);
    } catch (e) { finish(); }
  };
  Au.stop = function () { token++; clearTimeout(timer); try { if (Au.canSpeak()) speechSynthesis.cancel(); } catch (e) { /* inget */ } };

  function getCtx() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(f, d, type, vol, delay) {
    if (!sfxOn) return;
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.14, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + d + 0.05);
  }
  function sweep(f1, f2, d, type, vol, delay) {
    if (!sfxOn) return;
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.1, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + d + 0.05);
  }
  Au.unlock = () => { getCtx(); };
  Au.pop = () => tone(720, 0.09, 'sine', 0.12);
  Au.good = () => { tone(523.25, 0.16, 'triangle', 0.14); tone(659.25, 0.16, 'triangle', 0.14, 0.09); tone(783.99, 0.28, 'triangle', 0.14, 0.18); };
  Au.oops = () => tone(294, 0.22, 'sine', 0.08);
  Au.star = () => { tone(880, 0.12, 'triangle', 0.12); tone(1174.66, 0.2, 'triangle', 0.12, 0.08); };
  Au.hammer = () => { tone(190, 0.07, 'square', 0.07); tone(92, 0.13, 'sine', 0.16); };
  Au.poof = () => sweep(500, 90, 0.35, 'sawtooth', 0.04);
  Au.tada = () => { [659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, 0.18, 'triangle', 0.13, i * 0.08)); tone(1568, 0.5, 'sine', 0.08, 0.34); };
  Au.sprout = () => { sweep(300, 900, 0.35, 'sine', 0.1); tone(1174.66, 0.18, 'triangle', 0.08, 0.3); };
  Au.grow = () => { sweep(180, 720, 1.1, 'triangle', 0.1); sweep(270, 1080, 1.1, 'sine', 0.06, 0.1); };
  Au.bigFanfare = () => {
    [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5, 1568].forEach((f, i) => tone(f, 0.3, 'triangle', 0.14, i * 0.14));
    [261.63, 329.63, 392, 523.25].forEach((f, i) => tone(f, 0.9, 'sine', 0.08, 0.5 + i * 0.28));
  };
  Au.fanfare = () => [523.25, 659.25, 783.99, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.22, 'triangle', 0.13, i * 0.12));
})(globalThis.App || (globalThis.App = {}));
