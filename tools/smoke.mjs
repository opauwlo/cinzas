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
await pg.evaluateOnNewDocument(() => { window.__semEventos = true; }); // viagens sem sorteio de evento (os eventos são testados à parte, de forma forçada)
const resultados = [];
const ok = (nome, cond, detalhe = '') => { resultados.push({ nome, ok: !!cond }); console.log(`${cond ? 'OK  ' : 'FALHA'}  ${nome}${detalhe ? '  — ' + detalhe : ''}`); };
const foto = async nome => { if (capturas) { await mkdir(capturas, { recursive: true }); await pg.screenshot({ path: join(capturas, nome + '.png') }); } };
const ev = (fn, ...a) => pg.evaluate(fn, ...a);
const ate = async (fn, ms = 20000, ...a) => { try { await pg.waitForFunction(fn, { timeout: ms, polling: 150 }, ...a); return true; } catch { return false; } };
const toque = rx => ev(s => { const b = [...document.querySelectorAll('button')].find(x => new RegExp(s, 'i').test(x.textContent)); if (!b) return false; b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); b.click(); return true; }, rx);
const jogoPronto = (ms = 90000) => ate(() => window.__cinzas && window.__cinzas.store.getState().carga >= 1, ms);
const cena = fn => ev(fn);
const limpaPaineis = async () => { for (let i = 0; i < 8; i++) { const p = await ev(() => window.__cinzas.store.getState().painel); if (!p) return; if (p === 'perk') await toque('^Escolher'); else await ev(() => window.__cinzas.store.setState({ painel: null })); await espera(250); } };
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
  ok('as fontes de texto carregaram (Pixelify Sans + Silkscreen)', await ev(async () => { await document.fonts.ready; return document.fonts.check('600 16px "Pixelify Sans"') && document.fonts.check('700 16px Silkscreen') && getComputedStyle(document.body).fontFamily.includes('Pixelify'); }));
  await foto('1-menu');
  ok('"Como jogar" abre e fecha', await toque('Como jogar') && await ate(() => /como jogar/i.test(document.body.innerText), 4000) && await toque('^Fechar') && await ate(() => /sobreviver|nova run/i.test(document.body.innerText), 4000));
  ok('"Config." abre e fecha', await toque('^Config') && await ate(() => /configura/i.test(document.body.innerText), 4000) && await toque('^Fechar') && await ate(() => /sobreviver|nova run/i.test(document.body.innerText), 4000));

  // 2. nova run
  ok('toque em "Sobreviver"', await toque('Sobreviver|Nova run'));
  const t0 = Date.now(); ok('mundo da base carregou', await jogoPronto(), `${Date.now() - t0} ms`);
  ok('a introdução aparece na primeira vez', await ate(() => window.__cinzas.store.getState().painel === 'intro', 8000)); await foto('2a-intro');
  ok('dá para pular a introdução', await toque('pular introdução') && await ate(() => window.__cinzas.store.getState().painel === null, 4000));
  let s = await estado(); ok('começa na base', s.zonaId === 'base', JSON.stringify(s));
  await espera(1500); await foto('2-base');
  ok('o canvas usa pixels inteiros do aparelho (grade uniforme)', await ev(() => { const c = document.querySelector('canvas'), r = (parseFloat(c.style.width) * devicePixelRatio) / c.width; return Math.abs(r - Math.round(r)) < 0.01 && r >= 2; }));

  // 3. movimento (joystick virtual)
  const p0 = await cena(() => { const j = window.__cinzas.cena().jog; return [j.x, j.y]; });
  await ev(() => { window.__cinzas.ponte.entrada.mx = 0.7; window.__cinzas.ponte.entrada.my = 0.7; }); await espera(1600); await ev(() => { window.__cinzas.ponte.entrada.mx = 0; window.__cinzas.ponte.entrada.my = 0; });
  const p1 = await cena(() => { const j = window.__cinzas.cena().jog; return [j.x, j.y]; });
  ok('o jogador anda', Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) > 0.5, `deslocou ${Math.hypot(p1[0] - p0[0], p1[1] - p0[1]).toFixed(2)} tiles`);

  // 3b. stick dinâmico: a velocidade vem da força do toque (furtivo → andar → correr), sem botões
  const stick = await ev(() => {
    const z = document.querySelector('.zona.esq'), en = window.__cinzas.ponte.entrada, out = {}; const ptr = (t, x, y) => z.dispatchEvent(new PointerEvent(t, { pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true }));
    ptr('pointerdown', 120, 600); ptr('pointermove', 132, 600); out.suave = { f: en.furtivo, c: en.correr };            // 12 px: empurrão leve
    ptr('pointermove', 160, 600); out.medio = { f: en.furtivo, c: en.correr };                                          // 40 px: andar
    ptr('pointermove', 175, 600); out.forte = { f: en.furtivo, c: en.correr };                                          // 55 px: borda = correr
    const j = document.querySelector('.joy.mover'); ptr('pointermove', 260, 600); out.seguiu = parseFloat(j.style.left) > 125;       // o stick acompanha o dedo
    ptr('pointerup', 260, 600); out.solto = { f: en.furtivo, c: en.correr, mx: en.mx }; return out;
  });
  ok('stick: empurrão leve = furtivo', stick.suave.f === true && stick.suave.c === false, JSON.stringify(stick.suave));
  ok('stick: empurrão médio = andar', stick.medio.f === false && stick.medio.c === false, JSON.stringify(stick.medio));
  ok('stick: até a borda = correr', stick.forte.c === true, JSON.stringify(stick.forte));
  ok('stick: o círculo acompanha o dedo e soltar zera tudo', stick.seguiu === true && stick.solto.c === false && stick.solto.f === false && stick.solto.mx === 0, JSON.stringify(stick.solto));
  ok('não existem botões de correr/furtivo na tela', await ev(() => !document.querySelector('[aria-label="Correr"], [aria-label="Furtivo"]')));

  // 4. estações da base abrem seus painéis
  for (const [rx, painel] of [['bancada', 'craft'], ['baú do abrigo', 'bau'], ['jipe', 'mapa'], ['^dormir', 'dormir'], ['fogão', 'cozinha']]) {
    const achou = await ev(rx => {
      const k = window.__cinzas.cena(), it = k.interativos.find(i => new RegExp(rx, 'i').test(i.rot)); if (!it) return false;
      k.devIrPara(it); k.alvoInter = it; window.__cinzas.store.setState({ painel: null }); window.__cinzas.ponte.cmd.interagir(); return true;
    }, rx);
    const abriu = achou && await ate(p => window.__cinzas.store.getState().painel === p, 4000, painel);
    ok(`estação "${painel}" abre o painel`, abriu, achou ? '' : 'interativo não encontrado');
    await ev(() => window.__cinzas.store.setState({ painel: null }));
  }

  // 4a0. objetivos em atos, rótulos de coleta com rendimento e ferramenta
  const obj0 = await ev(() => { const t = window.__cinzas.store.getState(); return { idx: t.objIdx, hud: document.querySelector('.obj')?.textContent ?? '' }; });
  ok('o rastreador mostra o objetivo atual', obj0.idx === 0 && /OBJ/i.test(obj0.hud) && /Ermo/i.test(obj0.hud), JSON.stringify(obj0));
  await ev(() => window.__cinzas.store.setState({ painel: 'diario' })); await espera(400); await foto('2e-diario');
  ok('o Diário mostra a campanha em atos', /Ato I/i.test(await ev(() => document.body.innerText)) && /Ato III/i.test(await ev(() => document.body.innerText)));
  await ev(() => window.__cinzas.store.setState({ painel: null }));
  const rotulos = await ev(() => { const k = window.__cinzas.cena(), arv = k.interativos.find(i => /Cortar árvore/i.test(i.rot)), agua = null; const sem = arv ? arv.rot : null; const st = window.__cinzas.store, i = st.getState().inv; st.setState({ inv: { ...i, machado: 1 } }); return { sem, com: arv ? arv.rot : null }; });
  ok('o rótulo da árvore diz o que falta (machado)', rotulos.sem && /machado/i.test(rotulos.sem) && /precisa/i.test(rotulos.sem), JSON.stringify(rotulos));
  ok('com machado o rótulo mostra o rendimento', rotulos.com && /madeira/i.test(rotulos.com) && !/precisa/i.test(rotulos.com), JSON.stringify(rotulos));
  await ev(() => { const st = window.__cinzas.store, t = st.getState(), i = { ...t.inv }; delete i.machado; st.setState({ inv: i }); });

  // 4a. interação não atravessa parede: o baú está dentro da casa
  const paredes = await ev(() => {
    const k = window.__cinzas.cena(), it = k.interativos.find(i => /baú do abrigo/i.test(i.rot)); if (!it) return null; const r0 = it.r; it.r = 8; const out = {};
    k.jog.x = it.x; k.jog.y = 57.4; out.fora = k.alcancavel(it); out.alvoFora = k.alvoProx()?.rot ?? null;          // do lado de fora da parede norte
    k.jog.x = it.x; k.jog.y = 62.8; out.dentro = k.alcancavel(it);                                                    // dentro da casa
    k.jog.x = 38.5; k.jog.y = 62.4; out.perto = k.alcancavel(it); it.r = r0; k.devIrPara(it); return out;
  });
  ok('de fora da parede NÃO dá para alcançar o baú', paredes && paredes.fora === false && paredes.alvoFora !== 'Abrir baú do abrigo', JSON.stringify(paredes));
  ok('dentro da casa o baú é alcançável', paredes && paredes.dentro === true && paredes.perto === true, JSON.stringify(paredes));

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

  // 4b2. mochila em grade (estilo RE4): peças com posição, espaço no lugar de peso, arrastar, girar, organizar
  const consistente = () => ev(() => { const t = window.__cinzas.store.getState(), soma = {}; for (const p of t.grade) soma[p.id] = (soma[p.id] ?? 0) + p.q; return Object.entries(t.inv).every(([id, q]) => ['mochila', 'colete'].includes(id) || soma[id] === q) && Object.entries(soma).every(([id, q]) => t.inv[id] === q); });
  ok('a mochila é uma grade de peças e bate com o inventário', (await ev(() => window.__cinzas.store.getState().grade.length)) > 0 && await consistente());
  await ev(() => { const st = window.__cinzas.store, i = st.getState().inv; st.setState({ inv: { ...i, rifle: 6 } }); }); await espera(1500);
  const sobra = await ev(() => { const t = window.__cinzas.store.getState(); return { grade: t.grade.filter(p => p.id === 'rifle').reduce((a, p) => a + p.q, 0), inv: t.inv.rifle ?? 0, bau: t.bau.rifle ?? 0 }; });
  ok('o que não cabe na grade vai para o baú (nada some)', sobra.grade === sobra.inv && sobra.inv + sobra.bau === 6 && sobra.bau >= 1, JSON.stringify(sobra));
  await ev(() => { const st = window.__cinzas.store, t = st.getState(), i = { ...t.inv }, b = { ...t.bau }; delete i.rifle; delete b.rifle; st.setState({ inv: i, bau: b }); }); await espera(1500);
  ok('a grade volta a bater depois de tirar itens', await consistente());
  await ev(() => window.__cinzas.store.setState({ painel: 'inv' })); await espera(500); await foto('2c-mochila');
  ok('a mochila não mostra peso em kg', !/\d\s*kg/i.test(await ev(() => document.body.innerText)));
  const arrastou = await ev(async () => {
    const st = window.__cinzas.store, t0 = st.getState(); if (!document.querySelector('.peca')) return null; const i = t0.grade.findIndex(p => p.id === 'bandagem'); if (i < 0) return null;
    const el = document.querySelectorAll('.peca')[i], r = el.getBoundingClientRect(), box = document.querySelector('.mochila-grade').getBoundingClientRect(), cel = r.width, passo = cel + 2, linhas = Math.round((box.height + 2) / passo);
    const alvoX = 7, alvoY = linhas - 1, p = t0.grade[i], dx = (alvoX - p.x) * passo, dy = (alvoY - p.y) * passo, cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const ev = (tp, x, y) => el.dispatchEvent(new PointerEvent(tp, { pointerId: 11, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true }));
    ev('pointerdown', cx, cy); ev('pointermove', cx + dx / 2, cy + dy / 2); ev('pointermove', cx + dx, cy + dy); ev('pointerup', cx + dx, cy + dy);
    await new Promise(r => setTimeout(r, 200)); const q = st.getState().grade.find(g => g.id === 'bandagem'); return { de: [p.x, p.y], para: [q.x, q.y], alvo: [alvoX, alvoY] };
  });
  ok('arrastar uma peça a muda de lugar na grade', arrastou && arrastou.para[0] === arrastou.alvo[0] && arrastou.para[1] === arrastou.alvo[1], JSON.stringify(arrastou));
  const longa = await ev(() => { const t = window.__cinzas.store.getState(); return t.grade.findIndex(p => p.id === 'pe_de_cabra'); });
  ok('tocar numa peça comprida e girar', longa >= 0 && await ev(i => { document.querySelectorAll('.peca')[i].dispatchEvent(new PointerEvent('pointerdown', { pointerId: 12, pointerType: 'touch', isPrimary: true, clientX: 5, clientY: 5, bubbles: true })); document.querySelectorAll('.peca')[i].dispatchEvent(new PointerEvent('pointerup', { pointerId: 12, pointerType: 'touch', isPrimary: true, clientX: 5, clientY: 5, bubbles: true })); return true; }, longa) && await toque('^Girar') && await ate(i => window.__cinzas.store.getState().grade[i].r === 1, 3000, longa));
  ok('"Organizar" reempacota sem perder itens', await toque('^Organizar') && await consistente());
  await ev(() => window.__cinzas.store.setState({ painel: 'craft' })); await espera(500); await foto('2d-bancada');
  const cartoes = await ev(() => document.querySelectorAll('.craft-card').length); await toque('^Prontas'); const prontas = await ev(() => document.querySelectorAll('.craft-card').length);
  ok('a bancada mostra cartões e filtra por "Prontas"', cartoes >= 8 && prontas <= cartoes, `${cartoes} → ${prontas}`);
  await ev(() => window.__cinzas.store.setState({ painel: null }));

  // 4c. melhorias do abrigo e receitas de bancada avançada
  await ev(() => { const st = window.__cinzas.store, i = st.getState().inv; st.setState({ inv: { ...i, sucata: 14, madeira: 8, garrafa: 3, tecido: 4, alcool: 2, bandagem: 3 } }); });
  await ev(() => window.__cinzas.ponte.cmd.melhorar('tanque')); await espera(300);
  ok('melhorar o tanque gasta materiais e sobe de nível', (await ev(() => window.__cinzas.store.getState().mel.tanque)) === 1);
  const antesBancada = await ev(() => window.__cinzas.store.getState().inv.kit ?? 0); await ev(() => window.__cinzas.ponte.cmd.craft('r_kit')); await espera(200);
  ok('receita avançada só funciona depois da melhoria da bancada', (await ev(() => window.__cinzas.store.getState().inv.kit ?? 0)) === antesBancada);
  await ev(() => window.__cinzas.ponte.cmd.melhorar('bancada')); await espera(300);
  await ev(() => window.__cinzas.ponte.cmd.craft('r_kit')); await espera(200);
  ok('bancada nível 2 fabrica kit médico', (await ev(() => window.__cinzas.store.getState().inv.kit ?? 0)) === antesBancada + 1);

  // 4d. XP, nível e escolha de habilidade
  const xp0 = await ev(() => window.__cinzas.store.getState().xp);
  await ev(() => window.__cinzas.cena().devXp(500)); await espera(500);
  s = await ev(() => { const t = window.__cinzas.store.getState(); return { nivel: t.nivel, pontos: t.pontos }; });
  ok('XP sobe o nível e dá pontos de habilidade', s.nivel >= 5 && s.pontos >= 4, JSON.stringify(s));
  ok('a escolha de habilidade abre sozinha num momento calmo', await ate(() => window.__cinzas.store.getState().painel === 'perk', 6000));
  await foto('2b-perk');
  for (let i = 0; i < 4; i++) { await toque('^Escolher'); await espera(350); }
  s = await ev(() => { const t = window.__cinzas.store.getState(); return { perks: t.perks.length, pontos: t.pontos, painel: t.painel }; });
  ok('escolher 4 habilidades as aplica e fecha o painel', s.perks === 4 && s.pontos === 0 && s.painel === null, JSON.stringify(s));
  ok('a conquista "Veterano" (nível 5) é desbloqueada', (await ev(() => window.__cinzas.store.getState().conquistas)).includes('veterano'));
  void xp0;

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
  await limpaPaineis();
  const comb0 = (await estado()).combustivel;
  await ev(() => window.__cinzas.ponte.cmd.viajar('ermo'));
  ok('viaja para o Ermo', await ate(() => { const s = window.__cinzas.store.getState(); return s.zonaId === 'ermo' && s.carga >= 1; }, 60000), JSON.stringify(await estado()));
  s = await estado(); ok('a viagem gastou combustível', s.combustivel < comb0, `${comb0} → ${s.combustivel}`);
  await espera(2500); await foto('4-ermo');
  const z = await ev(() => { const k = window.__cinzas.cena(); return { ents: k.ents.length, flora: k.floras.length, props: k.props.length }; });
  ok('o Ermo tem criaturas, flora e objetos', z.ents > 0 && z.flora > 20 && z.props > 5, JSON.stringify(z));

  await limpaPaineis(); // um nível ganho na viagem abre a escolha de habilidade num momento calmo: resolve antes do saque
  // 7a. objetivo "Viaje até o Ermo" cumprido ao chegar; itens soltos no chão são coletados ao passar por cima
  ok('o objetivo da viagem é cumprido ao chegar', await ate(() => window.__cinzas.store.getState().objIdx >= 1, 8000), JSON.stringify(await ev(() => window.__cinzas.store.getState().objIdx)));
  const solto = await ev(() => { const k = window.__cinzas.cena(); if (!k.soltos.length) return null; const o = k.soltos[0], st = window.__cinzas.store.getState(), n0 = k.soltos.length, q0 = st.inv[o.s.item] ?? 0; k.jog.x = o.s.x; k.jog.y = o.s.y; return { id: o.s.id, item: o.s.item, n0, q0 }; });
  ok('o Ermo tem itens soltos no chão', !!solto && (await ev(() => window.__cinzas.cena().soltos.length)) > 5, JSON.stringify(solto));
  ok('passar por cima de um item solto o coleta', solto && await ate(o => { const k = window.__cinzas.cena(), t = window.__cinzas.store.getState(); return k.soltos.length < o.n0 && (t.inv[o.item] ?? 0) > o.q0 && k.ze.coletados.includes(o.id); }, 6000, solto));
  await ev(() => { const k = window.__cinzas.cena(); k.s.vasculhados = Math.max(k.s.vasculhados, 5); });
  ok('cumprir o objetivo mostra o banner e avança', await ate(() => { const t = window.__cinzas.store.getState(); return !!t.banner && /objetivo cumprido/i.test(t.banner.titulo); }, 6000));
  await foto('4a-banner');

  // 7b. saque de um contêiner no Ermo
  const vas0 = await ev(() => window.__cinzas.store.getState().vasculhados);
  const alvoSaque = await ev(() => {
    const k = window.__cinzas.cena(), it = k.interativos.filter(i => /vasculhar/i.test(i.rot) && i.ok()).sort((x, y) => Math.hypot(x.x - k.jog.x, x.y - k.jog.y) - Math.hypot(y.x - k.jog.x, y.y - k.jog.y))[0]; if (!it) return null;
    if (!k.devIrPara(it)) return null; for (const e of k.ents) if (e.arq.hostil && Math.hypot(e.x - it.x, e.y - it.y) < 18) { e.vivo = false; e.estado = 'morto'; } k.s.hp = 100; k.alvoInter = it; window.__cinzas.ponte.cmd.interagir(); return it.rot;
  });
  ok('há contêiner para vasculhar no Ermo', !!alvoSaque, String(alvoSaque));
  const saqueOk = alvoSaque && await ate(v => window.__cinzas.store.getState().vasculhados > v, 12000, vas0);
  ok('vasculhar conclui e conta o saque', saqueOk, saqueOk ? '' : JSON.stringify(await ev(() => { const k = window.__cinzas.cena(), t = window.__cinzas.store.getState(); return { acao: k.acao ? k.acao.rotulo + ' ' + k.acao.t.toFixed(1) + '/' + k.acao.dur.toFixed(1) : null, vas: t.vasculhados, painel: t.painel, pausado: k.sys.isPaused(), hp: Math.round(k.s.hp), tela: t.tela, trava: k.trava }; })));

  // 7c. contratos do rádio aparecem depois do primeiro saque
  ok('o rádio passa 3 contratos', await ate(() => window.__cinzas.store.getState().contratos.length === 3, 6000), JSON.stringify(await ev(() => window.__cinzas.store.getState().contratos.map(c => c.titulo))));
  await ev(() => { const k = window.__cinzas.cena(), c = k.s.contratos[0]; if (c.tipo === 'trazer') { const st = window.__cinzas.store, i = st.getState().inv; st.setState({ inv: { ...i, [c.alvo]: (i[c.alvo] ?? 0) + c.qtd } }); } else c.prog = c.qtd; window.__cinzas.store.setState({ contratos: [...k.s.contratos] }); });
  ok('um contrato fica pronto', await ev(() => { const k = window.__cinzas.cena(), c = k.s.contratos[0]; return c.tipo === 'trazer' ? true : c.prog >= c.qtd; }));
  const idContrato = await ev(() => window.__cinzas.cena().s.contratos[0].id);

  await limpaPaineis();
  // 7d. evento de viagem com decisão (forçado): Frente de poeira → esperar → seguir viagem
  const min0 = (await estado()).minutos; await ev(() => { window.__cinzas.cena().devEv = 'poeira'; window.__cinzas.ponte.cmd.viajar('base'); });
  ok('a estrada traz um evento com decisão', await ate(() => window.__cinzas.store.getState().painel === 'evento', 8000)); await foto('4b-evento');
  ok('o evento mostra o título e as opções', /frente de poeira/i.test(await ev(() => document.body.innerText)) && await toque('Esperar passar'));
  ok('a escolha mostra o resultado', await ate(() => /duas horas parado/i.test(document.body.innerText), 4000));
  ok('"Seguir viagem" conclui a viagem de volta ao abrigo', await toque('Seguir viagem') && await ate(() => { const t = window.__cinzas.store.getState(); return t.zonaId === 'base' && t.carga >= 1; }, 60000));
  ok('a decisão custou tempo (+2 h)', (await estado()).minutos >= min0 + 120, `${Math.round(min0)} → ${Math.round((await estado()).minutos)}`);
  await espera(1500);

  // 7e. receber o pagamento do contrato no abrigo
  const xpAntes = await ev(() => window.__cinzas.store.getState().xp + window.__cinzas.store.getState().nivel * 1000);
  await ev(id => window.__cinzas.ponte.cmd.receberContrato(id), idContrato); await espera(600);
  s = await ev(id => { const t = window.__cinzas.store.getState(); return { n: t.contratos.length, ainda: t.contratos.some(c => c.id === id), xp: t.xp + t.nivel * 1000 }; }, idContrato);
  ok('receber o pagamento troca o contrato e dá XP', s.n === 3 && !s.ainda && s.xp > xpAntes, JSON.stringify(s));
  await ev(() => window.__cinzas.store.setState({ painel: null }));

  // 7f. invasão ao abrigo (forçada): aparece, é repelida e vira conquista
  await ev(() => { const k = window.__cinzas.cena(); k.s.hp = 100; k.devForcar = 'raid'; });
  ok('a invasão chega ao abrigo', await ate(() => { const k = window.__cinzas.cena(); return !!k.raid && k.ents.some(e => e.vivo && e.grupo === k.raid.grupo); }, 20000));
  await foto('4c-raid');
  await ev(() => { const k = window.__cinzas.cena(); for (const e of k.ents) if (k.raid && e.grupo === k.raid.grupo) { e.vivo = false; e.estado = 'morto'; } });
  ok('repelir a invasão conta como conquista', await ate(() => window.__cinzas.store.getState().conquistas.includes('defensor'), 8000));

  await limpaPaineis();
  // 7g. lançamento de suprimentos (forçado) no Ermo: fumaça, seta no HUD e saque
  await ev(() => { const k = window.__cinzas.cena(); k.s.combustivel = 30; window.__cinzas.store.setState({ combustivel: 30 }); k.devForcar = 'airdrop'; window.__cinzas.ponte.cmd.viajar('ermo'); });
  ok('viaja ao Ermo para o lançamento', await ate(() => { const t = window.__cinzas.store.getState(); return t.zonaId === 'ermo' && t.carga >= 1; }, 60000)); await espera(1500);
  ok('o lançamento de suprimentos aparece com seta no HUD', await ate(() => { const k = window.__cinzas.cena(); return !!k.airdrop && !!window.__cinzas.store.getState().seta; }, 6000));
  await foto('4d-airdrop');
  const abriu = await ev(() => {
    const k = window.__cinzas.cena(); for (const e of k.ents) if (e.grupo >= 9000 && e.grupo < 9100) { e.vivo = false; e.estado = 'morto'; }
    const it = k.interativos.find(i => /suprimentos/i.test(i.rot)); if (!it || !k.devIrPara(it)) return false; for (const e of k.ents) if (e.arq.hostil && Math.hypot(e.x - it.x, e.y - it.y) < 18) { e.vivo = false; e.estado = 'morto'; } k.s.hp = 100; k.alvoInter = it; window.__cinzas.ponte.cmd.interagir(); return true;
  });
  ok('abrir os suprimentos conclui e vira conquista', abriu && await ate(() => window.__cinzas.store.getState().conquistas.includes('chuvaouro'), 12000));

  // 7h. locais temáticos carregam (hospital e posto militar)
  for (const [id, rx] of [['hospital', /hospital/i], ['militar', /militar/i], ['torre', /torre/i]]) {
    await limpaPaineis();
    await ev(id => { const k = window.__cinzas.cena(); k.s.hp = 100; window.__cinzas.ponte.cmd.viajar(id); }, id);
    const veio = await ate(i => { const t = window.__cinzas.store.getState(); return t.zonaId === i && t.carga >= 1; }, 60000, id); await espera(1500);
    const info = await ev(() => { const k = window.__cinzas.cena(); return { props: k.props.length, ents: k.ents.length, nome: k.zona.nome }; });
    ok(`o local temático "${id}" carrega com conteúdo`, veio && info.props > 5 && rx.test(info.nome), JSON.stringify(info));
    if (id === 'hospital') await foto('4e-hospital');
    if (id === 'torre') ok('a Torre de Rádio guarda o rádio de campanha', await ev(() => window.__cinzas.cena().zona.props.some(p => p.loot?.includes('radio'))));
  }

  // 8. salvar, recarregar a página e continuar
  await ev(() => window.__cinzas.ponte.cmd.salvar()); await espera(300);
  await pg.goto(url, { waitUntil: 'networkidle0' });
  ok('menu oferece "Continuar" após recarregar', await ev(() => [...document.querySelectorAll('button')].some(b => /^continuar/i.test(b.textContent.trim()))));
  await toque('^continuar'); ok('continua o jogo salvo', await jogoPronto());
  s = await estado(); ok('retoma na zona salva', s.zonaId === 'torre', JSON.stringify(s));
  s = await ev(() => { const t = window.__cinzas.store.getState(); return { nivel: t.nivel, perks: t.perks.length, tanque: t.mel.tanque }; });
  ok('nível, habilidades e melhorias sobrevivem ao salvar', s.nivel >= 5 && s.perks >= 4 && s.tanque === 1, JSON.stringify(s));

  // 9. morte e tela final
  await ev(() => { const k = window.__cinzas.cena(); k.s.hp = 1; k.dev('corredor', 0.7, 0.1); k.dev('corredor', -0.7, 0.1); });
  ok('a morte leva à tela final', await ate(() => window.__cinzas.store.getState().tela === 'morte', 25000));
  await espera(800); await foto('5-morte');
  ok('a tela final mostra o resumo da run', /sobreviveu|resumo|dia|abates/i.test(await ev(() => document.body.innerText)));
  ok('a tela final mostra nível e conquistas', /n[ií]vel/i.test(await ev(() => document.body.innerText)));

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
