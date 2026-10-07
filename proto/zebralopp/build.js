// node build.js -> zebraloppet.html (fristående sida, t.ex. GitHub Pages) och artifact.html (fragment)
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'src.html'), 'utf8');
fs.writeFileSync(path.join(__dirname, 'artifact.html'), src);
fs.writeFileSync(path.join(__dirname, 'index.html'), `<!doctype html>\n<html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="apple-mobile-web-app-capable" content="yes"></head><body>\n${src}\n</body></html>\n`);
console.log('index.html', (fs.statSync(path.join(__dirname, 'index.html')).size / 1024).toFixed(0), 'kB');
