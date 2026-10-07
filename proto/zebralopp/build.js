// node build.js -> artifact.html (fragment) och ../../zebraloppet/ (fristående sida för GitHub Pages)
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'src.html'), 'utf8');
const OUT = path.join(__dirname, '..', '..', 'zebraloppet');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(__dirname, 'artifact.html'), src);
const head = [
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">',
  '<meta name="theme-color" content="#58afe6">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
  '<meta name="apple-mobile-web-app-title" content="Zebraloppet">',
  '<link rel="manifest" href="manifest.webmanifest">',
  '<link rel="apple-touch-icon" href="icon-180.png">',
  '<link rel="icon" href="icon-192.png">'
].join('');
const page = `<!doctype html>\n<html lang="sv"><head>${head}</head><body>\n${src}\n</body></html>\n`;
fs.writeFileSync(path.join(__dirname, 'index.html'), page);
fs.writeFileSync(path.join(OUT, 'index.html'), page);
fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify({
  name: 'Zebraloppet', short_name: 'Zebraloppet', lang: 'sv', start_url: './', scope: './',
  display: 'fullscreen', orientation: 'landscape', background_color: '#79c4ee', theme_color: '#58afe6',
  icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }]
}, null, 2));
console.log('index.html', (fs.statSync(path.join(OUT, 'index.html')).size / 1024).toFixed(0), 'kB ->', OUT);
