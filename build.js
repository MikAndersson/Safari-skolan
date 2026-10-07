// Kör: node build.js  ->  dist/artifact.html (fragment för Artifact) och dist/spel.html (fristående sida)
const fs = require('fs');
const path = require('path');
const read = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const js = ['art.js', 'content.js', 'skills.js', 'engine.js', 'audio.js', 'ui.js', 'safari.js', 'round.js'].map(read).join('\n');
if (/<\/script/i.test(js)) throw new Error('</script> i koden');
const css = read('style.css');
const fonts = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Nunito:wght@600;700;800&display=swap';
const head = `<title>Djurkompisarna</title>\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="${fonts}">\n<style>\n${css}\n</style>`;
const body = `<div id="app"></div>\n<script>\n${js}\nApp.ui.boot();\n</script>`;
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'artifact.html'), `${head}\n${body}\n`);
fs.writeFileSync(path.join(__dirname, 'dist', 'spel.html'),
  `<!doctype html>\n<html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n${head}\n</head><body>\n${body}\n</body></html>\n`);
const kb = (f) => (fs.statSync(path.join(__dirname, 'dist', f)).size / 1024).toFixed(0);
fs.copyFileSync(path.join(__dirname, 'dist', 'spel.html'), path.join(__dirname, 'dist', 'index.html'));
fs.copyFileSync(path.join(__dirname, 'dist', 'spel.html'), path.join(__dirname, 'index.html')); // i rotmappen, för GitHub Pages
console.log(`artifact.html ${kb('artifact.html')} kB, spel.html ${kb('spel.html')} kB`);
