// Smoke test: serve out/ e abre no Chrome do sistema (puppeteer-core).
import http from 'node:http';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import puppeteer from 'puppeteer-core';

const raiz = new URL('../out/', import.meta.url).pathname;
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.json': 'application/json' };
const srv = http.createServer(async (req, res) => {
  let p = join(raiz, decodeURIComponent(req.url.split('?')[0]));
  try { if ((await stat(p)).isDirectory()) p = join(p, 'index.html'); res.writeHead(200, { 'content-type': tipos[extname(p)] ?? 'application/octet-stream' }); res.end(await readFile(p)); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const porta = srv.address().port;
const falhas = [];
const erros = [];
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA ') + m); if (!c) falhas.push(m); };

const nav = await puppeteer.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const pg = await nav.newPage();
  await pg.setViewport({ width: 412, height: 915, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  pg.on('pageerror', e => erros.push(String(e)));
  pg.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await pg.goto(`http://localhost:${porta}/`, { waitUntil: 'networkidle0', timeout: 30000 });
  await pg.screenshot({ path: process.env.SHOT_DIR + '/menu.png' });
  ok(await pg.$eval('h1', e => e.textContent) === 'CINZAS', 'menu mostra CINZAS');
  ok(await pg.evaluate(() => document.fonts.check("700 20px Cinzel")), 'fonte Cinzel carregada');
  await pg.click('.btn-d2');
  await pg.waitForSelector('canvas', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));
  await pg.keyboard.down('d'); await new Promise(r => setTimeout(r, 900)); await pg.keyboard.up('d');
  await pg.screenshot({ path: process.env.SHOT_DIR + '/jogo.png' });
  const px = await pg.evaluate(() => new Promise(res => window.__jogo.renderer.snapshot(img => { const t = document.createElement('canvas'); t.width = img.width; t.height = img.height; const x = t.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, t.width, t.height).data; let n = 0; for (let i = 0; i < d.length; i += 4 * 97) if (d[i] + d[i + 1] + d[i + 2] > 30) n++; res(n); })));
  ok(px > 50, `canvas tem pixels (${px})`);
  const caixas = await pg.evaluate(() => { const m = document.querySelector('.mundo').getBoundingClientRect(), p = document.querySelector('.painel').getBoundingClientRect(); return m.bottom <= p.top + 1; });
  ok(caixas, 'mundo e painel não se sobrepõem');
  ok(await pg.evaluate(() => document.querySelectorAll('.slot').length === 4), 'cinto com 4 slots');
  ok(erros.length === 0, 'sem erros no console' + (erros.length ? ': ' + erros.join(' | ') : ''));
} finally { await nav.close(); srv.close(); }
if (falhas.length) { console.log(`\n${falhas.length} falha(s)`); process.exit(1); }
console.log('\nsmoke OK');
