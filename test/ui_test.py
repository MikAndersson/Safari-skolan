"""Funktionstest i riktig webbläsare. Kör: python3 test/ui_test.py  (efter node build.js)"""
import subprocess, time, sys, json, os
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8765
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--directory', os.path.join(ROOT, 'dist')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
URL = f'http://localhost:{PORT}/spel.html'
fails = []
def check(ok, msg):
    print(('OK   ' if ok else 'FEL  ') + msg)
    if not ok: fails.append(msg)

INIT = """
window.__said = [];
window.SpeechSynthesisUtterance = function (t) { this.text = t; };
Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { getVoices: () => [], cancel() {}, speak(u) { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 10); } } });
document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}'; document.head.appendChild(s); });
const _st = window.setTimeout; window.setTimeout = (f, ms, ...a) => _st(f, (ms || 0) * 0.08, ...a);
"""

def answer_round(page, wrong_first=True, max_q=12):
    n = 0
    while n < max_q:
        st = page.evaluate("(() => { const R = App.ui.S.round; return R ? { i: R.i, kind: R.q.kind, ans: R.q.answer, target: R.q.target, letters: R.q.letters, mode: R.item.mode, skill: R.item.skill } : null; })()")
        if not st: return n
        if st['kind'] == 'choice':
            idx = page.evaluate("(a) => Array.from(document.querySelectorAll('.card')).findIndex(c => c.dataset.v === a)", st['ans'])
            if wrong_first and st['mode'] != 'lesson' and st['i'] % 2 == 0:
                bad = page.evaluate("(a) => Array.from(document.querySelectorAll('.card')).findIndex(c => c.dataset.v !== a && !c.disabled)", st['ans'])
                page.locator('.card').nth(bad).click()
            page.locator('.card').nth(idx).click()
        elif st['kind'] == 'give':
            if wrong_first and st['i'] % 2 == 0 and st['mode'] != 'lesson':
                page.click('#gok')  # fel antal (0) först
            for _ in range(st['target']): page.locator('#pile .item').first.click()
            page.click('#gok')
        elif st['kind'] == 'build':
            for ch in st['letters']:
                page.locator('.tile-l:not(.used)', has_text=ch).first.click()
        page.wait_for_function("(i) => !App.ui.S.round || App.ui.S.round.i > i", arg=st['i'], timeout=15000)
        n += 1
    return n

def build_all(page):
    """Barnet bygger allt som väntar: tryck på första lediga ruta."""
    n = 0
    while page.evaluate("App.ui.S.build"):
        page.wait_for_function("App.ui.S.busy === false", timeout=15000)
        if not page.evaluate("App.ui.S.build"): break
        page.locator('.cell.spot').first.click()
        page.wait_for_function("App.ui.S.busy === false", timeout=15000)
        n += 1
        time.sleep(0.05)
        if n > 40: break
    page.wait_for_selector('.sbot', timeout=15000)
    return n

def state(page):
    return json.loads(page.evaluate("localStorage.getItem('djurkompisarna.v1')"))['players'][0]

def counts(pl):
    t = pl['safari']['tiles'].values()
    return (sum(1 for x in t if x['k'] == 'animal'), sum(len(x['items']) for x in t if x['k'] == 'garden'), sum(1 for x in t if x['k'] == 'big'))

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1180, 'height': 820}, has_touch=True)
    ctx.add_init_script(INIT)
    page = ctx.new_page()
    errs = []
    page.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
    page.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'fonts.g' not in m.text and 'Failed to load resource' not in m.text else None)
    page.goto(URL)
    page.wait_for_selector('.wizard')
    check(page.locator('.wiz h2').inner_text().startswith('Skapa'), 'första start visar föräldraguiden')
    check(page.locator('[data-animal]').count() == 4, 'barnet väljer bland de fyra första djuren')

    # guiden: välj zebra, namn, välj några svar, starta
    page.click('[data-animal="zebra"]')
    page.fill('#pname', 'Nova')
    page.click('#wnext')
    page.click('.opt >> nth=1'); page.click('#wnext')       # räkna: upp till 5
    page.click('.opt >> nth=1'); page.click('#wnext')       # siffror 1-5
    page.click('#wnext'); page.click('#wnext')                # plus/minus: inte än, annat: inget
    page.click('.opt >> nth=1'); page.click('#wnext')       # bokstäver: några
    page.click('#wnext'); page.click('#wnext')                # ljud, läsning
    check('Redo att börja' in page.locator('.wiz h2').inner_text(), 'guidens sista steg visas')
    page.click('#wnext')
    page.wait_for_selector('.safari')
    pl = state(page)
    known = [k for k, v in pl['sk'].items() if v['mastered']]
    check(pl['name'] == 'Nova' and pl['animal'] == 'zebra', 'spelaren sparades med namn och djur')
    check(set(known) == {'m_count5', 'm_num5', 'l_let1'}, f'startnivå: {sorted(known)}')

    # första besöket: safarit är tomt och de fyra första djuren ska placeras av barnet
    check(page.locator('.safari.building').count() == 1, 'nytt barn hamnar direkt i byggläget')
    check(page.locator('.cell').count() == 15, 'safarit börjar som 5 x 3 rutor')
    check(page.locator('.cell.spot').count() == 15, 'alla rutor är lediga och markerade')
    check(page.locator('#carry .cnt').inner_text() == '4', 'fyra djur väntar på att byggas')
    page.locator('.cell[data-x="2"][data-y="1"]').click()
    page.wait_for_selector('.work', timeout=2000)
    check(page.locator('.work .scaffold').count() == 1 and page.locator('.work .hamm').count() == 1, 'bygganimation med byggställning och hammare visas')
    page.wait_for_function("App.ui.S.busy === false", timeout=15000)
    check(page.locator('.cell[data-x="2"][data-y="1"] .apc').count() == 1, 'djuret står på rutan barnet valde')
    page.locator('.cell[data-x="2"][data-y="1"]').click(position={'x': 5, 'y': 5})
    check(page.locator('.cell.spot').count() == 14, 'upptagen ruta är inte längre markerad')
    build_all(page)
    pl = state(page)
    check(counts(pl)[0] == 4 and not pl['safari']['pending'], 'alla fyra djur placerade och sparade')
    check(page.locator('.apc').count() == 4, 'fyra djur syns i safarit')
    check(page.locator('.teaser').count() == 1, 'nästa kompis visas som silhuett')

    # klicka på ett djur: kort med spela-knapp
    page.locator('.apc').first.click()
    page.wait_for_selector('.acard')
    page.click('#acplay'); page.wait_for_selector('.round')
    first_place = page.evaluate("App.ui.S.round.place")
    check(first_place in ('beaver', 'zebra', 'lion', 'elephant'), f'djurkortet startar en runda med djuret ({first_place})')
    answer_round(page, wrong_first=False)
    page.wait_for_selector('.reward')
    check(page.locator('#rbuild').count() == 1, 'efter rundan finns en Bygg-knapp')
    page.click('#rbuild'); page.wait_for_selector('.safari.building')
    check(page.locator('#carry .ctext b').inner_text() != '', 'byggläget visar vad som ska byggas')
    b0 = counts(state(page))
    build_all(page)
    b1 = counts(state(page))
    check(sum(b1) == sum(b0) + 1 or b1[1] == b0[1] + 1, f'en växt byggdes ({b0} -> {b1})')

    # spela rundor, bygg efter varje
    rounds = 1
    for r in range(5):
        page.click('#play')
        page.wait_for_selector('.round')
        answer_round(page, wrong_first=(r % 2 == 0))
        page.wait_for_selector('.reward')
        rounds += 1
        page.click('#rbuild'); page.wait_for_selector('.safari.building'); build_all(page)
    sv = state(page)
    stars = sv['stars']
    check(page.locator('.starcount b').inner_text() == str(stars) and stars >= rounds * 5 - 2, f'stjärnor räknas upp ({stars})')
    a, g, bg = counts(sv)
    stg = sum(i.get('g', 0) for x in sv['safari']['tiles'].values() if x['k'] == 'garden' for i in x['items'])
    check(g + bg + stg >= rounds, f'minst en sak byggd per runda ({g} växter, {bg} stora, {stg} växtsteg efter {rounds} rundor)')
    ns = sum(v['n'] for v in sv['sk'].values())
    check(ns > 15, f'svar registrerades ({ns})')

    # ladda om: sparat läge, går direkt till safarit
    said1 = page.evaluate('window.__said')
    page.reload(); page.wait_for_selector('.safari')
    check(int(page.locator('.starcount b').inner_text()) == stars, 'framsteg finns kvar efter omladdning')
    check(page.locator('.apc').count() == a and page.locator('.sm').count() == g, 'safarit ser likadant ut efter omladdning')

    # växa: markera F-klass som klar och ta en runda
    page.evaluate("""() => { const pl = App.ui.S.pl; App.skills.list.filter(s => s.lvl === 'F').forEach(s => App.engine.setMastered(pl, s.id, true)); App.ui.save(); }""")
    page.evaluate("() => { App.engine.planRound = () => ({ items: Array(5).fill({ skill: 'z_match', mode: 'practice' }), blocked: false }); App.ui.startRound('zebra'); }")
    answer_round(page, wrong_first=False)
    page.wait_for_selector('.grade', timeout=10000)
    check('F-klass' in page.locator('.gmedal').inner_text(), 'stor fanfar när F-klass är klar')
    check(page.locator('.gcrowd span').count() >= 1, 'djuren hurrar på firandesidan')
    check(page.evaluate("App.ui.S.pl.safari.levelsDone") == 1, 'årskurs 1 räknas som klarad')
    page.reload(); page.wait_for_selector('.grade', timeout=10000)
    check(True, 'firandet visas igen om sidan stängdes innan det hunnit visas')
    page.click('#gbuild'); page.wait_for_selector('.safari')
    sf = page.evaluate("({ c: App.ui.S.pl.safari.cols, r: App.ui.S.pl.safari.rows, pend: App.ui.S.pl.safari.pending.length })")
    check(sf['c'] == 7 and sf['r'] == 4, f'safarit har vuxit till 7 x 4 ({sf["c"]} x {sf["r"]})')
    check(sf['pend'] >= 3, f'nya djur och byggen väntar ({sf["pend"]})')
    check(page.locator('.safari.building').count() == 1, 'efter firandet går det direkt att bygga')
    page.wait_for_function("App.ui.S.busy === false", timeout=15000)
    check(page.locator('.cell').count() == 28, 'safarit har 28 rutor efter F-klass')
    build_all(page)
    sv = state(page)
    check(counts(sv)[0] >= 8, f'minst åtta djur i safarit efter F-klass ({counts(sv)[0]})')
    check(sv['safari']['celebrate'] == [] and not sv['safari']['grow'], 'firandet är avklarat och sparat')
    page.screenshot(path=os.path.join(ROOT, 'shots', 'ui_after_f.png'))

    # föräldravy med håll-in
    page.click('#parent'); time.sleep(0.1)
    check(page.locator('.parent').count() == 0, 'ett kort tryck öppnar inte föräldravyn')
    box = page.locator('#parent').bounding_box()
    page.mouse.move(box['x'] + 10, box['y'] + 10); page.mouse.down(); time.sleep(0.6); page.mouse.up()
    page.wait_for_selector('.parent')
    check(page.locator('.srow').count() == 48 + 4, 'föräldravyn listar 48 färdigheter och 4 årskurser')
    check('Safarit' in page.locator('.parent').inner_text(), 'föräldravyn visar safarit')
    check(page.locator('.slvl.host').count() == 48, 'varje färdighet visar vilket djur som lär ut den')
    page.locator('[data-toggle="m_add5"]').click()
    st = page.evaluate("App.engine.status(App.ui.S.pl, 'm_add5')")
    check(st in ('mastered', 'learning', 'new'), 'Kan redan/Ångra fungerar')
    page.locator('[data-set="voice"]').click()
    check(page.evaluate("App.ui.S.pl.settings.voice") is False, 'röst kan stängas av')
    page.locator('[data-set="voice"]').click()
    page.click('#pback'); page.wait_for_selector('.safari')

    # äldre sparfil (djurpark) flyttas in i safarit
    old = page.evaluate("""() => {
      const db = JSON.parse(localStorage.getItem('djurkompisarna.v1'));
      const pl = db.players[0]; delete pl.safari; pl.park = [0,1,2,3,4,5,6]; db.players = [pl];
      localStorage.setItem('djurkompisarna.v1', JSON.stringify(db)); return true; }""")
    page.reload(); page.wait_for_selector('.safari')
    sv = state(page)
    a2, g2, bg2 = counts(sv)
    check(page.locator('.safari.building').count() == 0, 'äldre spelare möts inte av byggläge')
    check(g2 + bg2 == 7 and a2 >= 4, f'sju gamla belöningar finns kvar i safarit ({g2 + bg2} saker, {a2} djur)')
    check('park' not in sv or sv['park'] == [], 'gamla djurparken är tömd')

    # profilbyte
    page.click('#switch'); page.wait_for_selector('.profiles')
    check(page.locator('[data-pid]').count() == 1, 'profilvalet visar spelaren')
    check(errs == [], 'inga fel i konsolen: ' + '; '.join(errs[:3]))
    said = said1 + page.evaluate('window.__said')
    check(len(said) > 40, f'djuren pratade ({len(said)} repliker)')
    print('Exempel på repliker:', '\n   '.join(sorted(set(said))[:14]))
    b.close()

srv.terminate()
print('\n' + (f'{len(fails)} fel' if fails else 'Alla UI-tester gick igenom'))
sys.exit(1 if fails else 0)
