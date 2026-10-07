import subprocess, time, os, sys
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'shots'); os.makedirs(OUT, exist_ok=True)
srv = subprocess.Popen(['python3', '-m', 'http.server', '8797', '--directory', ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
INIT = """window.SpeechSynthesisUtterance=function(t){this.text=t};Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[],cancel(){},speak(u){}}});"""
BOT = open(os.path.join(ROOT, 'test', 'play.py')).read().split('BOT = """')[1].split('"""')[0]
errs = []
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    for animal in sys.argv[1:] or ['zebra']:
        ctx = b.new_context(viewport={'width': 1000, 'height': 560}); ctx.add_init_script(INIT); pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('http://localhost:8797/index.html'); time.sleep(1)
        pg.click(f'#animSeg [data-v="{animal}"]'); pg.click('#go'); time.sleep(0.3)
        pg.evaluate(BOT, 1.0)
        got = set(); t0 = time.time()
        while time.time() - t0 < 260 and len(got) < 9:
            st = pg.evaluate("""(() => { const A = window.__api, G = A.G, f = G.forks[G.fi]; const rel = f ? f.d - G.d : 999;
              const near = A.ents.filter(e => { const a = e.d - G.d; return a > 2 && a < 16; }).map(e => e.k);
              return { s: G.state, rel, near, tum: G.tum, wet: G.wet, air: G.jy, fo: A.ents.some(e => e.fo && e.fo.y > 0.5), sl: Math.abs(A.TR.YA[0]) }; })()""")
            if st['s'] == 'end': break
            def snap(k):
                if k not in got: got.add(k); pg.screenshot(path=f'{OUT}/{animal}_{k}.png')
            if 12 < st['rel'] < 22: snap('fork_ahead')
            if -14 < st['rel'] < -9: snap('fork_inside')
            if st['wet'] > 1.8: snap('wet')
            if st['air'] > 1.4 and 'hump' in st['near'] + ['x']: snap('air')
            if st['fo']: snap('smash')
            if len(got) >= 2 and 'tumble' not in got and st['rel'] > 40:
                pg.evaluate("window.__api.tumble()"); time.sleep(0.35); snap('tumble')
            if time.time() - t0 > 30 and 'hill' not in got: snap('hill')
            time.sleep(0.1)
        print(animal, sorted(got), round(time.time() - t0))
        ctx.close()
    b.close()
srv.terminate(); print('FEL', errs or 'inga')
