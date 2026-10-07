# Safari skolan

Ett läs- och mattespel för surfplatta, för förskoleklass till årskurs 3. Barnet trycker och drar – inget skrivande – och bygger upp ett eget safari. Nya djur flyttar in när barnet blir duktigare, och varje djur lär ut svårare saker. När en årskurs är klar blir det stor fanfar och safarit växer.

(Spelet kallades tidigare *Djurkompisarna*.)

## Spela

Öppna `index.html` i en webbläsare (eller aktivera GitHub Pages: branch `main`, mapp `/ (root)`). Allt ligger i en enda HTML-fil utan beroenden. Framsteg sparas i webbläsaren (`localStorage`) på den enhet barnet spelar på.

## Bygga och testa

```
node build.js            # bygger index.html (i roten), dist/index.html, dist/spel.html och dist/artifact.html
node test/engine.test.js # tester av färdighetsmotorn och safariekonomin
python3 test/ui_test.py  # hela spelflödet i Chromium (kräver playwright)
python3 test/shots.py    # skärmbilder för visuell granskning
```

## Struktur

- `src/content.js` – djur, färdigheter, safaristorlekar och byggdelar
- `src/skills.js`, `src/engine.js` – adaptiv färdighetsmotor, repetition, safarimodell
- `src/art.js` – all grafik som SVG i koden
- `src/safari.js`, `src/round.js`, `src/ui.js` – gränssnittet
- `src/audio.js` – ljud och svenskt tal (Web Speech API, sv-SE)
- `build.js` – slår ihop allt till en HTML-fil

Svenskt tal beror på vilken röst enheten har installerad.
