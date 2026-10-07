"""Skärmbilder av safari-gränssnittet. Kör: python3 test/shots.py -> shots/*.png"""
import subprocess, time, os, sys
sys.argv = sys.argv[:1]
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'shots'); os.makedirs(OUT, exist_ok=True)
PORT = 8766
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--directory', os.path.join(ROOT, 'dist')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
URL = f'http://localhost:{PORT}/spel.html'
INIT = """
window.SpeechSynthesisUtterance = function (t) { this.text = t; };
Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { getVoices: () => [], cancel() {}, speak(u) { setTimeout(() => u.onend && u.onend(), 10); } } });
"""
def shot(page, name, wait=0.5):
    time.sleep(wait); page.screenshot(path=f'{OUT}/{name}.png')
def place_all(page):
    for _ in range(60):
        if not page.evaluate("App.ui.S.build"): break
        page.wait_for_function("App.ui.S.busy === false", timeout=15000)
        if not page.evaluate("App.ui.S.build"): break
        page.wait_for_function("!App.ui.S.build || document.querySelectorAll('.cell.spot').length", timeout=15000)
        if not page.evaluate("App.ui.S.build"): break
        page.locator('.cell.spot').first.click()
        page.wait_for_function("App.ui.S.busy === false", timeout=15000)
    time.sleep(0.5)

with sync_playwright() as p:
    b = p.chromium.launch()
    for label, vp in (('tab', {'width': 1180, 'height': 820}), ('port', {'width': 820, 'height': 1180}), ('phone', {'width': 390, 'height': 780})):
        ctx = b.new_context(viewport=vp, has_touch=True, device_scale_factor=1)
        ctx.add_init_script(INIT)
        page = ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        page.goto(URL); page.wait_for_selector('.wizard')
        page.click('[data-animal="zebra"]'); page.fill('#pname', 'Nova')
        for _ in range(9): page.click('#wnext')
        page.wait_for_selector('.safari.building'); time.sleep(0.6)
        shot(page, f'{label}_1build')
        page.locator('.cell.spot').nth(7).click(); time.sleep(0.5)
        shot(page, f'{label}_2working', 0.1)
        page.wait_for_function("App.ui.S.busy === false", timeout=15000)
        place_all(page)
        shot(page, f'{label}_3home')
        page.locator('.apc').first.click(); time.sleep(0.4)
        shot(page, f'{label}_4card', 0.2)
        page.evaluate("App.ui.closeCard && App.ui.closeCard()")
        # mitt i spelet: F-klass klar + flera färdigheter
        page.evaluate("""() => { const pl = App.ui.S.pl; App.skills.list.filter(s => s.lvl === 'F').forEach(s => App.engine.setMastered(pl, s.id, true)); App.engine.syncSafari(pl, { auto: true }); App.ui.save(); App.ui.map(); }""")
        time.sleep(0.5)
        shot(page, f'{label}_5grown')
        # årskursfanfar
        page.evaluate("""() => { const pl = App.ui.S.pl; App.skills.list.filter(s => s.lvl === '1').forEach(s => App.engine.setMastered(pl, s.id, true)); App.engine.syncSafari(pl); App.ui.save(); App.ui.grade && App.ui.grade({ levels: pl.safari.celebrate.slice() }); }""")
        time.sleep(1.0)
        shot(page, f'{label}_6grade')
        if page.locator('#gbuild').count():
            page.click('#gbuild'); page.wait_for_selector('.safari'); time.sleep(0.6)
            shot(page, f'{label}_7after')
            place_all(page)
            shot(page, f'{label}_8full')
        print(label, 'fel:', errs)
        ctx.close()
    srv.terminate()
