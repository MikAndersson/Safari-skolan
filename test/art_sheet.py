"""Ritgranskning: alla djur, djur på sin plats, växter och byggnader. Kör: python3 test/art_sheet.py -> shots/art_*.png"""
import os
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = f"""<!doctype html><meta charset=utf-8><body style="margin:0;background:#B5CC63;font:14px sans-serif">
<style>.row{{display:flex;flex-wrap:wrap;gap:6px;padding:8px}} .c{{width:150px;text-align:center;background:#9DBB52;border-radius:12px;padding:4px}} svg{{width:100%;height:auto;display:block}}
.animal .eh,.animal .m-open{{display:none}} .cheer .animal .eo{{display:none}} .cheer .animal .eh{{display:inline}} .cheer .animal .m-open{{display:inline}} .cheer .animal .m-smile{{display:none}}</style>
<script src="file://{ROOT}/src/art.js"></script><div id=o></div>
<script>
const A=App.art; let h='<div class=row>';
A.ANIMALS.forEach(a=>h+='<div class=c>'+A.animal(a)+a+'</div>');
h+='</div><div class=row>';
A.ANIMALS.forEach(a=>h+='<div class=c>'+A.animalPiece(a)+a+'</div>');
h+='</div><div class="row cheer">';
A.ANIMALS.forEach(a=>h+='<div class=c>'+A.animal(a)+a+' cheer</div>');
h+='</div><div class=row>';
['sprout','flowerR','flowerY','daisy','tulip','sunflower','bush','treeS','palmS','mushroom','rock','grass'].forEach(d=>h+='<div class=c style="width:90px">'+A.deco(d)+d+'</div>');
['pond','hut','tent','jeep','tower','baobab','fountain','balloon','sign'].forEach(d=>h+='<div class=c>'+A.big(d)+d+'</div>');
h+='<div class=c>'+A.scaffold()+'scaffold</div><div class=c>'+A.hammer()+'hammer</div></div>';
document.getElementById('o').innerHTML=h;
</script>"""
open('/tmp/art_sheet.html','w').write(HTML)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1260, 'height': 900})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file:///tmp/art_sheet.html'); pg.wait_for_timeout(300)
    pg.screenshot(path=os.path.join(ROOT, 'shots', 'art_all.png'), full_page=True)
    print('fel:', errs); b.close()
