"""Rökprov: en bot springer ett lopp med varje djur. Kör: python3 test/play.py [--shots]"""
import subprocess, time, os, sys, json
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'shots'); os.makedirs(OUT, exist_ok=True)
SHOTS = '--shots' in sys.argv
srv = subprocess.Popen(['python3', '-m', 'http.server', '8795', '--directory', ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
INIT = """window.SpeechSynthesisUtterance=function(t){this.text=t};window.__said=[];Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[],cancel(){},speak(u){window.__said.push(u.text)}}});"""
BOT = """(skill) => { const A = window.__api; window.__hits = 0; window.__botT = setInterval(() => {
  const G = A.G; if (G.state !== 'play') return;
  const g = G.gates[G.gi];
  if (g && g.signed) { const want = (Math.random() < skill ? g.ch.ans : (g.ch.ans + 1) % 3) - 1; if (g._w == null) g._w = want; if (G.lane !== g._w) A.moveLane(g._w > G.lane ? 1 : -1); }
  else { // undvik/hoppa
    for (const e of A.ents) { const ahead = e.d - G.d; if (ahead < 0 || ahead > 3.2) continue;
      const inLane = e.lane == null || Math.abs(e.x - G.zx) < 1.1;
      if (!inLane) continue;
      if (e.k === 'branch' && ahead < 2.2) A.duck();
      else if (['log', 'rock', 'stream', 'river'].includes(e.k)) { if (A.AN.jump) { if (ahead < (e.k === 'river' ? 3.2 : 1.9)) A.jump(); if (e.k === 'river' && G.vy < 1 && G.jy > 0.3) A.jump(); } else if (e.k !== 'stream' && e.k !== 'river' && Math.random() < 0.02) A.moveLane(G.lane === 0 ? 1 : -G.lane); }
      else if (e.k === 'banana' && Math.abs(e.x - G.zx) > 0.5) {}
    }
  }
  if (G.ban >= 8) A.rush();
}, 25); }"""
errs = []
res = {}
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    vp = {'width': 1180, 'height': 820} if SHOTS else {'width': 480, 'height': 270}
    for animal in ['buffel', 'zebra', 'antilop', 'gasell']:
        ctx = b.new_context(viewport=vp); ctx.add_init_script(INIT); pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(animal + ': ' + str(e)))
        pg.goto('http://localhost:8795/index.html'); time.sleep(1)
        if animal == 'buffel' and SHOTS: pg.screenshot(path=f'{OUT}/menu.png')
        pg.click(f'#animSeg [data-v="{animal}"]'); pg.click('#contSeg [data-v="mix"]'); pg.click('#go'); time.sleep(0.3)
        pg.evaluate(BOT, 0.85)
        t0 = time.time(); shot = 0; seen = set()
        while time.time() - t0 < (500 if not SHOTS else 160):
            st = pg.evaluate("(() => { const A = window.__api, G = A.G; const near = A.ents.filter(e => { const a = e.d - G.d; return a > 4 && a < 22 && e.k !== 'banana'; }).map(e => e.k); const npc = A.NPCS.filter(n => { const z = n.d - G.d; return z > 3 && z < 14; }).length; return { s: G.state, d: G.d, gi: G.gi, near, npc, rush: G.rush, sign: G.gates[G.gi] && G.gates[G.gi].signed }; })()")
            if st['s'] == 'end': break
            if SHOTS:
                for k in st['near']:
                    key = animal + k
                    if key not in seen and len(seen) < 40: seen.add(key); pg.screenshot(path=f'{OUT}/{animal}_{k}.png')
                if st['npc'] and animal + 'npc' not in seen: seen.add(animal + 'npc'); pg.screenshot(path=f'{OUT}/{animal}_npc.png')
                if st['rush'] > 1 and animal + 'rush' not in seen: seen.add(animal + 'rush'); pg.screenshot(path=f'{OUT}/{animal}_rush.png')
                if st['sign'] and animal + 'sign' not in seen: seen.add(animal + 'sign'); time.sleep(1.5); pg.screenshot(path=f'{OUT}/{animal}_gate.png')
            time.sleep(0.15)
        time.sleep(1.5)
        r = pg.evaluate("(() => { const G = window.__api.G; return { state: G.state, right: G.right, t: +G.t.toFixed(1), d: Math.round(G.d), fin: G.fin, place: document.querySelector('#endT').textContent, podium: [...document.querySelectorAll('#podium li')].map(l => l.textContent) }; })()")
        res[animal] = r; print(animal, json.dumps(r, ensure_ascii=False), round(time.time() - t0), 's real')
        if SHOTS: pg.screenshot(path=f'{OUT}/{animal}_end.png')
        ctx.close()
    b.close()
srv.terminate()
print('FEL:', errs or 'inga')
