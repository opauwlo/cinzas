// Smoke test do CINZAS em Chrome headless (GL por software). Requer `npm run build` antes (lê a pasta out/).
// Uso: node tools/smoke.mjs [pasta-de-capturas]   — sai com código 0 se tudo passou, 1 se algo falhou, 3 se o teste quebrou.
import http from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import puppeteer from 'puppeteer-core';

const raiz = new URL('../out/', import.meta.url).pathname, capturas = process.argv[2] ?? null;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer(async (req, res) => {
  let p = join(raiz, decodeURIComponent(req.url.split('?')[0]));
  try { if ((await stat(p)).isDirectory()) p = join(p, 'index.html'); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(await readFile(p)); } catch { res.writeHead(404); res.end(); }
}).listen(0);
const url = `http://localhost:${srv.address().port}/`;
const nav = await puppeteer.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const pg = await nav.newPage();
await pg.setViewport({ width: 412, height: 915, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const erros = [];
pg.on('pageerror', e => erros.push('PAGEERR ' + String(e.stack ?? e).slice(0, 400)));
pg.on('console', m => { if (m.type() === 'error') erros.push('CONERR ' + m.text().slice(0, 300)); });

const espera = ms => new Promise(r => setTimeout(r, ms));
const resultados = [];
const ok = (nome, cond, detalhe = '') => { resultados.push({ nome, ok: !!cond }); console.log(`${cond ? 'OK  ' : 'FALHA'}  ${nome}${detalhe ? '  — ' + detalhe : ''}`); };
const foto = async nome => { if (capturas) { await mkdir(capturas, { recursive: true }); await pg.screenshot({ path: join(capturas, nome + '.png') }); } };
const ev = (fn, ...a) => pg.evaluate(fn, ...a);
const ate = async (fn, ms = 20000, ...a) => { try { await pg.waitForFunction(fn, { timeout: ms, polling: 150 }, ...a); return true; } catch { return false; } };
const toque = rx => ev(s => { const b = [...document.querySelectorAll('button')].find(x => new RegExp(s, 'i').test(x.textContent)); if (!b) return false; b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); b.click(); return true; }, rx);
const jogoPronto = (ms = 90000) => ate(() => window.__cinzas && window.__cinzas.store.getState().carga >= 1, ms);
const cena = fn => ev(fn);
const estado = () => ev(() => { const s = window.__cinzas.store.getState(); return { zonaId: s.zonaId, tela: s.tela, painel: s.painel, hp: s.hp, abates: s.abates, combustivel: s.combustivel, carga: s.carga, minutos: s.minutos }; });

let codigo = 0;
try {
  // 1. menu
  await pg.goto(url, { waitUntil: 'networkidle0' });
  const texto = await ev(() => document.body.innerText);
  ok('menu mostra o título CINZAS', /cinzas/i.test(texto));
  ok('menu tem o botão de começar', await ev(() => [...document.querySelectorAll('button')].some(b => /sobreviver|nova run/i.test(b.textContent))));
  const pwa = await pg.evaluate(async u => { const r = await fetch(u + 'manifest.webmanifest').catch(() => null); return r && r.ok ? (await r.json()).name : null; }, url);
  ok('manifesto PWA publicado', !!pwa, String(pwa));
  await foto('1-menu');

  // 2. nova run
  ok('toque em "Sobreviver"', await toque('Sobreviver|Nova run'));
  const t0 = Date.now(); ok('mundo da base carregou', await jogoPronto(), `${Date.now() - t0} ms`);
  let s = await estado(); ok('começa na base', s.zonaId === 'base', JSON.stringify(s));
  await espera(1500); await foto('2-base');

  // 3. movimento (joystick virtual)
  const p0 = await cena(() => { const j = window.__cinzas.cena().jog; return [j.x, j.y]; });
  await ev(() => { window.__cinzas.ponte.entrada.mx = 0.7; window.__cinzas.ponte.entrada.my = 0.7; }); await espera(1600); await ev(() => { window.__cinzas.ponte.entrada.mx = 0; window.__cinzas.ponte.entrada.my = 0; });
  const p1 = await cena(() => { const j = window.__cinzas.cena().jog; return [j.x, j.y]; });
  ok('o jogador anda', Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) > 0.5, `deslocou ${Math.hypot(p1[0] - p0[0], p1[1] - p0[1]).toFixed(2)} tiles`);

  // 4. estações da base abrem seus painéis
  for (const [rx, painel] of [['bancada', 'craft'], ['baú do abrigo', 'bau'], ['jipe', 'mapa'], ['^dormir', 'dormir'], ['fogão', 'cozinha']]) {
    const achou = await ev(rx => {
      const k = window.__cinzas.cena(), it = k.interativos.find(i => new RegExp(rx, 'i').test(i.rot)); if (!it) return false;
      k.jog.x = it.x; k.jog.y = it.y + 0.6; k.alvoInter = it; window.__cinzas.store.setState({ painel: null }); window.__cinzas.ponte.cmd.interagir(); return true;
    }, rx);
    const abriu = achou && await ate(p => window.__cinzas.store.getState().painel === p, 4000, painel);
    ok(`estação "${painel}" abre o painel`, abriu, achou ? '' : 'interativo não encontrado');
    await ev(() => window.__cinzas.store.setState({ painel: null }));
  }

  // 4b. economia da base: fabricar, cozinhar, baú, uso rápido e sono
  const inv = () => ev(() => ({ ...window.__cinzas.store.getState().inv }));
  const bau = () => ev(() => ({ ...window.__cinzas.store.getState().bau }));
  await ev(() => { const st = window.__cinzas.store, i = st.getState().inv; st.setState({ inv: { ...i, tecido: 4, carne_crua: 2, agua: 1 } }); });
  let a = await inv(); await ev(() => window.__cinzas.ponte.cmd.craft('r_bandagem')); let d = await inv();
  ok('fabricar: bandagem gasta tecido e cria o item', (d.bandagem ?? 0) === (a.bandagem ?? 0) + 1 && d.tecido === a.tecido - 2, `tecido ${a.tecido}→${d.tecido}, bandagem ${a.bandagem ?? 0}→${d.bandagem}`);
  a = d; await ev(() => window.__cinzas.ponte.cmd.cozinhar('c_carne')); d = await inv();
  ok('cozinhar: carne crua vira carne cozida', (d.carne_cozida ?? 0) === (a.carne_cozida ?? 0) + 1 && d.carne_crua === a.carne_crua - 1);
  await ev(() => window.__cinzas.ponte.cmd.bauMover('bandagem', 1, true)); const b1 = await bau(), i1 = await inv();
  ok('baú guarda item da mochila', (b1.bandagem ?? 0) >= 1 && (i1.bandagem ?? 0) === (d.bandagem ?? 0) - 1);
  await ev(() => window.__cinzas.ponte.cmd.bauMover('bandagem', 1, false)); const i2 = await inv();
  ok('baú devolve o item', (i2.bandagem ?? 0) === (d.bandagem ?? 0));
  await ev(() => { window.__cinzas.cena().s.sede = 30; window.__cinzas.store.setState({ sede: 30 }); }); await ev(() => window.__cinzas.ponte.cmd.usarRapido('agua')); await espera(1800); // usar item leva 1 s de ação
  ok('beber água repõe a sede', (await ev(() => window.__cinzas.cena().s.sede)) > 30);
  const m0 = (await estado()).minutos; await ev(() => window.__cinzas.ponte.cmd.dormir(1)); await espera(1500);
  ok('dormir faz o tempo passar', (await estado()).minutos >= m0 + 50, `${Math.round(m0)} → ${Math.round((await estado()).minutos)} min`);
  await ev(() => window.__cinzas.store.setState({ painel: null }));

  // 5. combate corpo a corpo
  await ev(() => { const k = window.__cinzas.cena(); k.jog.x = 40; k.jog.y = 40; });
  await espera(600);
  const abates0 = (await estado()).abates;
  const idZ = await ev(() => { const k = window.__cinzas.cena(), e = k.dev('irradiado', 1.1, 0.2); e.hp = e.maxHp = 24; return e.id; });
  await ev(() => { window.__cinzas.ponte.entrada.atacar = true; });
  const morreu = await ate(id => { const k = window.__cinzas.cena(); const e = k.ents.find(x => x.id === id); return !e || !e.vivo; }, 14000, idZ);
  await ev(() => { window.__cinzas.ponte.entrada.atacar = false; });
  ok('o jogador mata um irradiado com a arma branca', morreu);
  await espera(700); ok('o abate é contado', (await estado()).abates > abates0);
  await foto('3-combate');

  // 6. clima (todos os estados, sem exceção)
  for (const t of ['chuva', 'tempestade', 'neblina', 'poeira', 'acida', 'vento', 'limpo']) { await ev(t => window.__cinzas.cena().clima.definir(t, true), t); await espera(450); }
  ok('todos os climas renderizam', erros.length === 0, erros[0] ?? '');

  // 7. viagem de ida e volta (gasta combustível e troca de zona)
  const comb0 = (await estado()).combustivel;
  await ev(() => window.__cinzas.ponte.cmd.viajar('ermo'));
  ok('viaja para o Ermo', await ate(() => { const s = window.__cinzas.store.getState(); return s.zonaId === 'ermo' && s.carga >= 1; }, 60000), JSON.stringify(await estado()));
  s = await estado(); ok('a viagem gastou combustível', s.combustivel < comb0, `${comb0} → ${s.combustivel}`);
  await espera(2500); await foto('4-ermo');
  const z = await ev(() => { const k = window.__cinzas.cena(); return { ents: k.ents.length, flora: k.floras.length, props: k.props.length }; });
  ok('o Ermo tem criaturas, flora e objetos', z.ents > 0 && z.flora > 20 && z.props > 5, JSON.stringify(z));

  // 7b. saque de um contêiner no Ermo
  const vas0 = await ev(() => window.__cinzas.store.getState().vasculhados);
  const alvoSaque = await ev(() => {
    const k = window.__cinzas.cena(), it = k.interativos.filter(i => /vasculhar/i.test(i.rot) && i.ok()).sort((x, y) => Math.hypot(x.x - k.jog.x, x.y - k.jog.y) - Math.hypot(y.x - k.jog.x, y.y - k.jog.y))[0]; if (!it) return null;
    k.s.hp = 100; k.jog.x = it.x; k.jog.y = it.y + 0.8; k.alvoInter = it; window.__cinzas.ponte.cmd.interagir(); return it.rot;
  });
  ok('há contêiner para vasculhar no Ermo', !!alvoSaque, String(alvoSaque));
  ok('vasculhar conclui e conta o saque', alvoSaque && await ate(v => window.__cinzas.store.getState().vasculhados > v, 12000, vas0));

  // 8. salvar, recarregar a página e continuar
  await ev(() => window.__cinzas.ponte.cmd.salvar()); await espera(300);
  await pg.goto(url, { waitUntil: 'networkidle0' });
  ok('menu oferece "Continuar" após recarregar', await ev(() => [...document.querySelectorAll('button')].some(b => /^continuar/i.test(b.textContent.trim()))));
  await toque('^continuar'); ok('continua o jogo salvo', await jogoPronto());
  s = await estado(); ok('retoma na zona salva', s.zonaId === 'ermo', JSON.stringify(s));

  // 9. morte e tela final
  await ev(() => { const k = window.__cinzas.cena(); k.s.hp = 1; k.dev('corredor', 0.7, 0.1); k.dev('corredor', -0.7, 0.1); });
  ok('a morte leva à tela final', await ate(() => window.__cinzas.store.getState().tela === 'morte', 25000));
  await espera(800); await foto('5-morte');
  ok('a tela final mostra o resumo da run', /sobreviveu|resumo|dia|abates/i.test(await ev(() => document.body.innerText)));

  // 10. Modo Estudo (reportagem) abre sem quebrar
  await pg.goto(url + '?estudo=1', { waitUntil: 'networkidle0' }); await espera(600);
  ok('Modo Estudo carrega', /estudo|b[oô]nus|sequ[eê]ncia/i.test(await ev(() => document.body.innerText)));
  await ev(() => localStorage.removeItem('cinzas.estudo'));

  ok('nenhum erro de console/exceção em todo o teste', erros.length === 0, erros.slice(0, 3).join(' | '));
} catch (e) { console.log('O TESTE QUEBROU:', String(e.stack ?? e).slice(0, 700)); codigo = 3; }

await nav.close(); srv.close();
const falhas = resultados.filter(r => !r.ok);
console.log(`\n${resultados.length - falhas.length}/${resultados.length} verificações passaram.`);
process.exit(codigo || (falhas.length ? 1 : 0));
