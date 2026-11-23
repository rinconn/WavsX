// Captura la página real de la canción (/cancion) en un móvil para el escaparate de la landing.
// Si cambia el diseño de la app: npm run build && node tools/capture-cancion.cjs && npm run build
// Genera public/covers/app-cancion.jpg (página entera), public/covers/app-pull-N.png (las piezas que
// "salen" del móvil) y src/data/mob.json (dónde está cada parte, para que el móvil baje justo ahí).
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = (f) => path.join(root, f);

// partes que enseña el escaparate: [sección a la que baja, pieza que sale]
const STEPS = [
  ['.hero', '.path'],
  ['[aria-labelledby="listen-t"]', '.notes li'],
  ['[aria-labelledby="files-t"]', '.files'],
  ['[aria-labelledby="info-t"]', '.people'],
  ['[aria-labelledby="rel-t"]', '.checks']
];

(async () => {
  const srv = spawn('python3', ['-m', 'http.server', '4399'], { cwd: out('dist'), stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 800));
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  try {
    await pg.goto('http://localhost:4399/cancion/'); await pg.waitForTimeout(2000);
    // datos reales del escaparate (la página aún trae los de ejemplo)
    await pg.evaluate(() => {
      const rep = (a, b) => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) n.nodeValue = n.nodeValue.split(a).join(b); };
      rep('Resiliencia', 'm suben los kalores!'); rep('Neon_M30', 'm_suben_kalores'); rep('EP Madrugada', 'Single'); rep('Kairo', 'Skør'); rep('3:24', '2:07');
      const c = document.querySelector('.hero__cover'); if (c) c.style.backgroundImage = 'url(/covers/foto.jpg)';
      ['foto.jpg', 'skor.jpg', 'muro.jpg'].forEach((f, i) => { const t = document.querySelectorAll('.thumbs .cover')[i]; if (t) t.style.background = `url(/covers/${f}) center / cover`; });
    });
    await pg.waitForTimeout(600);
    const H = await pg.evaluate(() => document.body.scrollHeight);
    await pg.screenshot({ path: out('public/covers/app-cancion.jpg'), type: 'jpeg', quality: 80, fullPage: true, clip: { x: 0, y: 0, width: 390, height: H } });
    const steps = [];
    for (let i = 0; i < STEPS.length; i++) {
      const [sec, piece] = STEPS[i];
      const top = await pg.$eval(sec, (e) => e.getBoundingClientRect().top + scrollY);
      const el = await pg.$(piece);
      const bb = await el.boundingBox(), sy = await pg.evaluate(() => scrollY);
      await el.screenshot({ path: out(`public/covers/app-pull-${i}.png`) });
      steps.push({ top: Math.round(top), y: Math.round(bb.y + sy), x: Math.round(bb.x), w: Math.round(bb.width), h: Math.round(bb.height) });
    }
    fs.mkdirSync(out('src/data'), { recursive: true });
    fs.writeFileSync(out('src/data/mob.json'), JSON.stringify({ width: 390, height: H, steps }, null, 1));
    console.log('ok', H, steps);
  } finally { await b.close(); srv.kill(); }
})();
