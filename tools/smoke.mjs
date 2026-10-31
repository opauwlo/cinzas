// Smoke tests: serve out/ e abre no Chrome do sistema (puppeteer-core). Rode `npm run build` antes.
import http from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import puppeteer from 'puppeteer-core';

const raiz = process.env.RAIZ ?? new URL('../out/', import.meta.url).pathname;
const shots = process.env.SHOT_DIR; if (shots) await mkdir(shots, { recursive: true });
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.json': 'application/json', '.txt': 'text/plain' };
const srv = http.createServer(async (req, res) => {
  let p = join(raiz, decodeURIComponent(req.url.split('?')[0]));
  try { if ((await stat(p)).isDirectory()) p = join(p, 'index.html'); res.writeHead(200, { 'content-type': tipos[extname(p)] ?? 'application/octet-stream' }); res.end(await readFile(p)); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const porta = srv.address().port;
const falhas = []; const erros = [];
const ok = (c, m) => { console.log((c ? 'OK    ' : 'FALHA ') + m); if (!c) falhas.push(m); };
const esp = ms => new Promise(r => setTimeout(r, ms));
const foto = async (pg, n) => { if (shots) await pg.screenshot({ path: `${shots}/${n}.png` }); };

const nav = await puppeteer.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
async function abrir(query = '') {
  const pg = await nav.newPage();
  await pg.setViewport({ width: 412, height: 915, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  pg.on('pageerror', e => erros.push(String(e.stack ?? e).split('\n').slice(0, 6).join(' / ')));
  pg.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await pg.goto(`http://localhost:${porta}/${query}`, { waitUntil: 'networkidle0', timeout: 30000 });
  return pg;
}
const clicar = (pg, texto) => pg.evaluate(t => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes(t)); if (!b) return false; b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); b.click(); return true; }, texto);
const estado = pg => pg.evaluate(() => { const s = window.__cinzas.store.getState(); return { hp: s.hp, tela: s.tela, inv: s.inv, vasc: s.vasculhados, abates: s.abates, minutos: s.minutos }; });

try {
  // ---- modo normal
  let pg = await abrir();
  await foto(pg, '1-menu');
  ok(await pg.$eval('h1', e => e.textContent) === 'CINZAS', 'menu mostra CINZAS');
  ok(await pg.evaluate(() => document.fonts.check('700 20px Silkscreen') && document.fonts.check('20px VT323')), 'fontes pixel carregadas');
  ok(!(await pg.evaluate(() => document.body.innerText.includes('PERDIDO'))), 'menu normal sem manipulação');
  await clicar(pg, 'Sobreviver');
  await pg.waitForSelector('canvas', { timeout: 20000 });
  await pg.waitForFunction(() => window.__cinzas && window.__cinzas.store.getState().carga >= 1, { timeout: 60000 });
  await esp(2500); await foto(pg, '2-jogo');
  const px = await pg.evaluate(() => new Promise(res => window.__cinzas.game.renderer.snapshot(img => { const t = document.createElement('canvas'); t.width = img.width; t.height = img.height; const x = t.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, t.width, t.height).data; let n = 0; for (let i = 0; i < d.length; i += 4 * 97) if (d[i] + d[i + 1] + d[i + 2] > 30) n++; res(n); })));
  ok(px > 200, `canvas com pixels (${px})`);
  ok(await pg.evaluate(() => { const m = document.querySelector('.mundo').getBoundingClientRect(), p = document.querySelector('.painel').getBoundingClientRect(), t = document.querySelector('.topo').getBoundingClientRect(); return m.bottom <= p.top + 1 && m.top >= t.bottom - 1; }), 'topo, mundo e painel não se sobrepõem');
  let s = await estado(pg); ok(s.tela === 'jogo' && s.hp > 95, 'run começou com vida cheia');

  // movimento pelo joystick virtual (via entrada)
  console.log('      fps', await pg.evaluate(() => Math.round(window.__cinzas.game.loop.actualFps)));
  const x0 = await pg.evaluate(() => window.__cinzas.cena().jog.x);
  await pg.evaluate(() => { window.__cinzas.ponte.entrada.mx = 1; }); await esp(1500); await pg.evaluate(() => { window.__cinzas.ponte.entrada.mx = 0; });
  const x1 = await pg.evaluate(() => window.__cinzas.cena().jog.x); ok(x1 > x0 + 1, `joystick move o jogador (${x0.toFixed(1)} -> ${x1.toFixed(1)})`);

  // vasculhar: vai até o contêiner mais próximo, executa a ação com tempo e confere item
  await pg.evaluate(() => { const c = window.__cinzas.cena(); const a = c.props.filter(o => o.p.loot && o.p.tipo !== 'carro' && o.p.tipo !== 'carro_v').sort((u, v) => Math.hypot(u.p.x - c.jog.x, u.p.y - c.jog.y) - Math.hypot(v.p.x - c.jog.x, v.p.y - c.jog.y))[0].p; c.jog.x = a.x + 0.5; c.jog.y = a.y + 1.6; c.mundo.solido[Math.floor(c.jog.y) * 96 + Math.floor(c.jog.x)] = 0; });
  await pg.waitForFunction(() => !!window.__cinzas.store.getState().alvo, { timeout: 8000 }).catch(() => {});
  const alvo = await pg.evaluate(() => window.__cinzas.store.getState().alvo); ok(!!alvo, `botão de interagir mostra alvo (“${alvo}”)`);
  const antes = Object.values((await estado(pg)).inv).reduce((a, b) => a + b, 0);
  await pg.evaluate(() => window.__cinzas.ponte.cmd.interagir()); await esp(600); await foto(pg, '3-saque');
  ok(await pg.evaluate(() => !!window.__cinzas.store.getState().acao), 'barra de progresso da ação aparece');
  await pg.waitForFunction(() => window.__cinzas.store.getState().vasculhados >= 1, { timeout: 20000 }).catch(() => {}); s = await estado(pg);
  ok(s.vasc === 1, 'vasculhar concluiu e contou'); ok(Object.values(s.inv).reduce((a, b) => a + b, 0) > antes, 'vasculhar deu item');

  // combate: inimigo ao lado, ataque corpo a corpo
  await pg.evaluate(() => { const c = window.__cinzas.cena(); c.jog.ang = 0; c.inim.length = 0; window.__e = c.criarInimigo('irr', c.jog.x + 1.3, c.jog.y); window.__e.estado = 'ocioso'; window.__cinzas.ponte.entrada.atacar = true; });
  await esp(500); await foto(pg, '4-combate'); await pg.waitForFunction(() => window.__cinzas.store.getState().abates >= 1, { timeout: 15000 }).catch(() => {});
  await pg.evaluate(() => { window.__cinzas.ponte.entrada.atacar = false; });
  s = await estado(pg); ok(s.abates >= 1, 'inimigo aparece e morre (corpo a corpo)');

  // tiro com pistola
  await pg.evaluate(() => { const c = window.__cinzas.cena(); c.s.arma = 'pistola'; c.s.municao = 5; c.inim.length = 0; window.__e2 = c.criarInimigo('cao', c.jog.x + 4, c.jog.y); window.__e2.estado = 'ocioso'; c.jog.ang = 0; window.__cinzas.ponte.entrada.atacar = true; });
  await pg.waitForFunction(() => !window.__e2.vivo, { timeout: 15000 }).catch(() => {}); await pg.evaluate(() => { window.__cinzas.ponte.entrada.atacar = false; });
  ok(await pg.evaluate(() => !window.__e2.vivo), 'pistola mata cão a distância');

  // inventário abre e pausa
  await pg.evaluate(() => window.__cinzas.store.setState({ invAberto: true })); await esp(400); await foto(pg, '5-inv');
  ok(await pg.evaluate(() => document.body.innerText.includes('Mochila')), 'inventário abre');
  await pg.evaluate(() => window.__cinzas.store.setState({ invAberto: false }));

  // noite + lanterna: confere cone
  await pg.evaluate(() => { const c = window.__cinzas.cena(); c.s.minutos = 22 * 60; c.s.lanterna = { tem: true, ligada: true, bat: 100 }; window.__cinzas.store.setState({ inv: { ...window.__cinzas.store.getState().inv, lanterna: 1 } }); });
  await esp(1500); await foto(pg, '6-noite');

  // morte permanente
  await pg.evaluate(() => { window.__cinzas.cena().machucar(500, 0); }); await pg.waitForFunction(() => window.__cinzas.store.getState().tela === 'morte', { timeout: 15000 }).catch(() => {}); await esp(300); await foto(pg, '7-morte');
  s = await estado(pg); ok(s.tela === 'morte', 'morte leva à tela de morte');
  ok(!(await pg.evaluate(() => /faltaram/i.test(document.body.innerText))), 'tela de morte normal é honesta (sem quase-vitória)');
  await pg.close();

  // ---- modo estudo
  pg = await abrir('?estudo=1');
  ok(await pg.evaluate(() => document.body.innerText.includes('PERDIDO')), 'estudo: menu mostra aversão à perda');
  await clicar(pg, 'Sobreviver'); await pg.waitForSelector('canvas'); await pg.waitForFunction(() => window.__cinzas && window.__cinzas.store.getState().carga >= 1, { timeout: 60000 }); await esp(1500);
  await pg.evaluate(() => { window.__cinzas.cena().machucar(500, 0); }); await pg.waitForFunction(() => window.__cinzas.store.getState().tela === 'morte', { timeout: 15000 }).catch(() => {}); await pg.waitForFunction(() => /faltaram/i.test(document.body.innerText), { timeout: 10000 }).catch(() => {});
  ok(await pg.evaluate(() => /faltaram só/i.test(document.body.innerText)), 'estudo: quase-vitória fabricada aparece'); await foto(pg, '8-estudo-morte');
  await clicar(pg, 'Reviver'); await esp(300); await foto(pg, '9-loja');
  ok(await pg.evaluate(() => document.body.innerText.includes('MAIS POPULAR')), 'estudo: loja com ancoragem');
  await clicar(pg, 'Comprar'); await esp(300); await foto(pg, '10-revelacao');
  const n = await pg.evaluate(() => document.querySelectorAll('.manip').length); ok(n >= 6, `revelação lista as técnicas (${n})`);
  ok(await pg.evaluate(() => document.body.innerText.includes('Nada foi cobrado')), 'revelação avisa que nada foi cobrado');
  await pg.close();
  ok(erros.length === 0, 'sem erros no console' + (erros.length ? ': ' + [...new Set(erros)].slice(0, 5).join(' | ') : ''));
} finally { await nav.close(); srv.close(); }
if (falhas.length) { console.log(`\n${falhas.length} falha(s)`); process.exit(1); }
console.log('\nsmoke OK');
