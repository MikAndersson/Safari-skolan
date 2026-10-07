"""Skärmbilder + rökprov. Kör: python3 test/shots.py"""
import subprocess, time, os, math
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'shots'); os.makedirs(OUT, exist_ok=True)
srv = subprocess.Popen(['python3', '-m', 'http.server', '8790', '--directory', ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
INIT = """
window.SpeechSynthesisUtterance = function (t) { this.text = t; };
window.__said=[];
Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { getVoices: () => [], cancel() {}, speak(u) { window.__said.push(u.text) } } });
"""
def motion(page, deg):
    # landskap: screen angle 90 i Chromium-emulering? vi läser vinkeln själva och skickar gravitation i skärmkoordinater
    page.evaluate("""(deg) => { const a = (screen.orientation && screen.orientation.angle || 0) * Math.PI/180; const r = deg*Math.PI/180;
      const sx = -Math.sin(r)*9.8, sy = Math.cos(r)*9.8;  // reaktionsvektor i skärmkoordinater
      const gx = sx*Math.cos(a) + sy*Math.sin(a), gy = -sx*Math.sin(a) + sy*Math.cos(a);
      window.dispatchEvent(new DeviceMotionEvent('devicemotion', { accelerationIncludingGravity: { x: gx, y: gy, z: 2 } })); }""", deg)
errs = []
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    for label, vp in (('tab', {'width': 1180, 'height': 820}), ('phone', {'width': 844, 'height': 390}), ('port', {'width': 390, 'height': 780})):
        ctx = b.new_context(viewport=vp, has_touch=True)
        ctx.add_init_script(INIT)
        page = ctx.new_page()
        page.on('pageerror', lambda e: errs.append(label + ': ' + str(e)))
        page.on('console', lambda m: errs.append(label + ' console: ' + m.text) if m.type == 'error' and 'fonts' not in m.text else None)
        page.goto('http://localhost:8790/index.html'); time.sleep(1.5)
        page.screenshot(path=f'{OUT}/{label}_0menu.png')
        page.click('#contSeg [data-v="shape"]'); page.click('#go')
        time.sleep(2.2); page.screenshot(path=f'{OUT}/{label}_1run.png')
        page.wait_for_function("window.__G.mode === 'sign' || window.__G.mode === 'gates'", timeout=90000); time.sleep(1.0)
        page.screenshot(path=f'{OUT}/{label}_2sign.png')
        page.wait_for_function("window.__G.mode === 'gates'", timeout=90000)
        ans = page.evaluate("window.__G.ch.ans")
        for _ in range(abs(ans - 1)): page.keyboard.press('ArrowLeft' if ans < 1 else 'ArrowRight')
        time.sleep(2.0); page.screenshot(path=f'{OUT}/{label}_3gates.png')
        page.wait_for_function("window.__G.mode === 'react'", timeout=90000); time.sleep(0.25)
        page.screenshot(path=f'{OUT}/{label}_4react.png')
        print(label, 'rätt:', page.evaluate("window.__G.right"), 'av', page.evaluate("window.__G.done"), 'sa:', page.evaluate("window.__said.slice(-3)"))
        if label != 'port':
            # lutningsläge
            page.click('#pause'); page.click('#quit'); time.sleep(0.3)
            page.click('#ctrlSeg [data-v="tilt"]'); page.click('#go'); time.sleep(0.3)
            for i in range(40): motion(page, 0); time.sleep(0.02)
            for i in range(60): motion(page, 16); time.sleep(0.02)
            time.sleep(0.3); page.screenshot(path=f'{OUT}/{label}_5tilt16.png')
            st = page.evaluate("({ang: window.__tilt.ang, zx: window.__G.zx, ctrl: document.querySelector('#wheel').hidden, tr: document.querySelector('#stage').style.transform})")
            print(label, 'lutning 16°:', st)
            for i in range(60): motion(page, -24); time.sleep(0.02)
            time.sleep(0.3); page.screenshot(path=f'{OUT}/{label}_6tiltm24.png')
            print(label, 'lutning -24°:', page.evaluate("({ang: window.__tilt.ang, zx: window.__G.zx})"))
            page.click('#pause'); page.click('#quit'); page.click('#ctrlSeg [data-v="swipe"]')
        ctx.close()
    # hela loppet snabbt (blandat), fusk-svar
    ctx = b.new_context(viewport={'width': 560, 'height': 315}, has_touch=True); ctx.add_init_script(INIT); page = ctx.new_page()
    page.on('pageerror', lambda e: errs.append('race: ' + str(e)))
    page.goto('http://localhost:8790/index.html'); time.sleep(1)
    page.click('#contSeg [data-v="mix"]'); page.click('#tempoSeg [data-v="2"]'); page.click('#go'); page.evaluate('window.__G.total = 4')
    shots = 0
    t0 = time.time()
    while time.time() - t0 < 400:
        st = page.evaluate("({s: window.__G.state, m: window.__G.mode, a: window.__G.ch && window.__G.ch.ans, l: window.__G.lane, k: window.__G.ch && window.__G.ch.kind, d: window.__G.done})")
        if st['s'] == 'end': break
        if st['m'] == 'gates' and st['a'] is not None and st['l'] != st['a'] - 1:
            page.keyboard.press('ArrowLeft' if st['l'] > st['a'] - 1 else 'ArrowRight')
        if st['m'] == 'gates' and shots < 4 and st['d'] == shots:
            time.sleep(1.2); page.screenshot(path=f'{OUT}/race_{st["k"]}.png'); shots += 1
        time.sleep(0.1)
    time.sleep(1.5); page.screenshot(path=f'{OUT}/race_end.png')
    print('lopp:', page.evaluate("({s: window.__G.state, r: window.__G.right, d: window.__G.done, b: window.__G.ban})"), round(time.time() - t0), 's')
    b.close()
srv.terminate()
print('FEL:', errs or 'inga')
