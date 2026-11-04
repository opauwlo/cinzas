// Metas do Plano GOTY §2.3 / §4.3 (S1–S3) como asserções.
import { teste, assert, entre } from '../../../tools/testes/harness';
import { gerarZona, W, H } from '../../zona';
import { MIN_POR_SEG } from '../../dados/balanco';
import { Barramento } from '../../nucleo/barramento';
import { novoMundo } from '../../nucleo';
import type { ClimaMundo, ZonaMundo, Mundo } from '../../nucleo/contratos';
import { criarCampo, CampoCinzas, DosimetroCinzas, DOSE, degrauDe, ganhoContaminacao, leituraGeiger, SistemaRadiacao, G, setaPan } from './index';

const clima = (o: Partial<ClimaMundo> = {}): ClimaMundo => ({ tipo: 'limpo', chuva: 0, vento: 0, ventoDir: 0, neblina: 0, poeira: 0, acida: false, ...o });
const zonaReal = (bioma: string, seed: string, id = 'z-' + bioma): ZonaMundo => { const z = gerarZona(id, bioma, seed); return { id, bioma, w: W, h: H, tipos: z.tipos, solido: z.solido, opaco: z.opaco, rad: z.rad }; };
/** zona lisa com uma cratera no formato de zona.ts (pico 1, raio r × 1,6) */
function zonaCratera(cx: number, cy: number, r = 7, bioma = 'ermo'): ZonaMundo {
  const rad = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - cx, y - cy); if (d < r * 1.6) rad[y * W + x] = Math.min(1, Math.pow(1 - d / (r * 1.6), 1.4)); }
  return { id: 'cratera', bioma, w: W, h: H, tipos: new Uint8Array(W * H), solido: new Uint8Array(W * H), opaco: new Uint8Array(W * H), rad };
}
/** simula `min` minutos de jogo em passos de 0,5 s reais (a 2 Hz, como o módulo) */
const simular = (c: CampoCinzas, min: number, cl: ClimaMundo) => { for (let s = 0; s < min / (0.5 * MIN_POR_SEG); s++) c.passo(0.5, cl); };
const centroideX = (c: CampoCinzas) => { let m = 0, sx = 0; for (let i = 0; i < G * G; i++) { m += c.ar[i]; sx += c.ar[i] * ((i % G) + 0.5); } return sx / m; };

teste('radiação: fontes saem dos picos de zona.rad com tipo (cratera, barril, cogumelo) e o pântano não vira 20 fontes', () => {
  const c = criarCampo(zonaCratera(30, 48), 's'); assert.equal(c.fontes().length, 1); assert.equal(c.fontes()[0].tipo, 'cratera'); entre(c.fontes()[0].x, 30, 31, 'x da cratera');
  const ind = criarCampo(zonaReal('industrial', 'a'), 'a'); assert.ok(ind.fontes().some(f => f.tipo === 'barril'), 'refinaria tem barris');
  const pan = criarCampo(zonaReal('pantano', 'b'), 'b'); assert.ok(pan.fontes().some(f => f.tipo === 'cogumelo')); assert.ok(pan.fontes().length <= 9, `pântano com ${pan.fontes().length} fontes`);
});

teste('radiação: a pluma da cratera desloca ≥ 6 casas em 1 h de jogo com vento 0,85 (meta S1)', () => {
  const c = criarCampo(zonaCratera(30, 48), 'pluma'); simular(c, 120, clima({ vento: 0 })); const x0 = centroideX(c);
  simular(c, 60, clima({ vento: 0.85, ventoDir: 0 })); const x1 = centroideX(c);
  assert.ok(x1 - x0 >= 6, `a pluma andou ${(x1 - x0).toFixed(2)} casas`);
  assert.ok(c.amostraAr(42, 48.5) > 3 * c.amostraAr(18, 48.5), 'vento abaixo tem mais ar quente que vento acima');
});

teste('radiação: chuva derruba a pluma (menos taxa no ar) e a deposição esquenta o chão debaixo dela', () => {
  const seco = criarCampo(zonaCratera(30, 48), 'c'), molhado = criarCampo(zonaCratera(30, 48), 'c');
  simular(seco, 30, clima({ vento: 0.35 })); simular(molhado, 30, clima({ vento: 0.35, chuva: 0.6 }));
  assert.ok(molhado.massaAr() < 0.6 * seco.massaAr(), `ar com chuva ${molhado.massaAr().toFixed(2)} × seco ${seco.massaAr().toFixed(2)}`);
  assert.ok(molhado.amostraAr(40, 48.5) < seco.amostraAr(40, 48.5));
  const acida = criarCampo(zonaCratera(30, 48), 'c'); simular(acida, 10, clima({ chuva: 0.55, acida: true }));
  entre(acida.amostra(80, 20) - acida.amostraChao(80, 20), 0.3, 0.33, 'chuva ácida soma no ar longe da cratera');
});

teste('radiação: poeira levanta o chão e espalha a pluma', () => {
  const calmo = criarCampo(zonaCratera(48, 48), 'p'), poeira = criarCampo(zonaCratera(48, 48), 'p');
  simular(calmo, 30, clima({ vento: 0.1 })); simular(poeira, 30, clima({ vento: 0.1, poeira: 0.85 }));
  assert.ok(poeira.massaAr() > 1.3 * calmo.massaAr()); assert.ok(poeira.amostraAr(48.5, 62) > calmo.amostraAr(48.5, 62), 'mais longe com poeira');
});

teste('radiação: determinística pela seed (mesmo clima → mesma pluma; outra seed → outra)', () => {
  const z = zonaReal('industrial', 'd'), a = criarCampo(z, 'd'), b = criarCampo(z, 'd'), o = criarCampo(z, 'outra');
  for (const c of [a, b, o]) simular(c, 30, clima({ vento: 0.6, ventoDir: 1.2, poeira: 0.3 }));
  assert.deepEqual(a.ar, b.ar); assert.deepEqual(a.fontes(), b.fontes()); assert.notDeepEqual(a.ar, o.ar);
});

teste('radiação: zonas frias ficam iguais a hoje (amostra = zona.rad; contaminação = fórmula da cena)', () => {
  for (const [bioma, seed] of [['floresta', 'f1'], ['floresta', 'f2'], ['base', 'b1']]) {
    const z = bioma === 'base' ? (() => { const g = gerarZona('base', 'base', seed); return { id: 'base', bioma, w: W, h: H, tipos: g.tipos, solido: g.solido, opaco: g.opaco, rad: g.rad }; })() : zonaReal(bioma, seed);
    const c = criarCampo(z, seed); for (const cl of [clima({ vento: 0.85 }), clima({ chuva: 0.6, vento: 0.35 }), clima({ neblina: 0.8 })]) simular(c, 20, cl);
    let dif = 0; for (let i = 0; i < W * H; i++) dif = Math.max(dif, Math.abs(c.amostra((i % W) + 0.5, Math.floor(i / W) + 0.5) - z.rad[i]));
    assert.ok(dif < 1e-6, `${bioma}: diferença máxima ${dif}`);
  }
  // fórmula de hoje, copiada de cena.ts:427-428
  const hoje = (rad: number, mask: number, imune: boolean) => { let g = rad > 0.05 ? Math.pow(rad, 1.2) * 2.4 * mask : 0; if (imune) g *= 0.6; return g; };
  for (const r of [0, 0.04, 0.06, 0.2, 0.5, 1, 1.4]) for (const m of [false, true]) for (const im of [false, true]) assert.equal(ganhoContaminacao(r, { mascara: m, interior: false, imune: im }), hoje(r, m ? 0.35 : 1, im));
  const d = new DosimetroCinzas(); for (let k = 0; k < 600; k++) d.absorver(0.03, 0.1, { mascara: false, interior: false }); assert.equal(d.dose, 0, 'fundo natural não soma dose');
});

teste('radiação: dose chega a 400 em 6–10 expedições quentes (7 min, ermo/refinaria/pântano), com ou sem máscara', () => {
  const EXP_S = 420; let soma = 0, n = 0;
  for (const bioma of ['ermo', 'industrial', 'pantano']) for (const seed of ['e1', 'e2']) {
    const c = criarCampo(zonaReal(bioma, seed), seed); simular(c, 60, clima({ vento: 0.5, ventoDir: 2 }));
    const z = c.zona; let s = 0, k = 0;
    for (let i = 0; i < W * H; i++) { if (z.solido[i]) continue; s += Math.max(0, c.amostra((i % W) + 0.5, Math.floor(i / W) + 0.5) - DOSE.fundo); k++; }
    soma += (s / k) * DOSE.ganho * EXP_S; n++;
  }
  const porExp = soma / n, queda = DOSE.quedaDia; // ~1 dia de jogo entre uma expedição e a outra
  const exps = (f: number) => Math.ceil(400 / (porExp * f - queda));
  entre(exps(1), 6, 10, `expedições sem máscara (${porExp.toFixed(1)} de dose cada)`); entre(exps(DOSE.fatorMascara), 6, 10, 'expedições de máscara');
});

teste('radiação: degraus da dose 100/250/400/500 e o Dosimetro anda neles', () => {
  assert.deepEqual([0, 99.9, 100, 249, 250, 399, 400, 499, 500, 900].map(degrauDe), [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
  const d = new DosimetroCinzas(), vistos = new Set<number>(); for (let t = 0; t < 4000 && d.degrau() < 4; t++) { d.absorver(1, 1, { mascara: false, interior: false }); vistos.add(d.degrau()); }
  assert.deepEqual([...vistos], [0, 1, 2, 3, 4]);
});

teste('radiação: contaminação é curável com antirrad; a dose não, e só cai devagar', () => {
  const d = new DosimetroCinzas(); for (let k = 0; k < 60; k++) d.absorver(0.8, 1, { mascara: false, interior: false });
  const c0 = d.contaminacao, d0 = d.dose; assert.ok(c0 > 50 && d0 > 50);
  d.tratar(35); assert.equal(d.contaminacao, c0 - 35); assert.equal(d.dose, d0, 'antirrad não mexe na dose');
  d.recuperar(1440); entre(d0 - d.dose, 2.9, 3.1, 'dose cai 3 por dia de jogo');
  for (let k = 0; k < 200; k++) d.absorver(0, 1, { mascara: false, interior: false }); entre(d.contaminacao, c0 - 41.01, c0 - 40.99, 'contaminação some sozinha a 0,03/s, como hoje');
  const m = new DosimetroCinzas(), i = new DosimetroCinzas(); m.absorver(1, 10, { mascara: true, interior: false }); i.absorver(1, 10, { mascara: false, interior: true });
  assert.ok(m.contaminacao < 0.4 * 24 && m.dose > 0.75 * (0.94 * DOSE.ganho * 10), 'máscara segura o que se respira, não o gama'); assert.ok(i.dose < 0.55 * 0.94 * DOSE.ganho * 10, 'teto segura metade da dose');
});

teste('radiação: Geiger na escala de hoje e o pan aponta para o lado da tela onde a cratera está', () => {
  const c = criarCampo(zonaCratera(48, 48), 'g'); simular(c, 60, clima({ vento: 0 }));
  entre(leituraGeiger(c, 5, 5).cpm, 18, 19, 'fundo'); assert.ok(leituraGeiger(c, 48.5, 48.5).cpm >= 900, 'em cima da cratera');
  const dir = leituraGeiger(c, 45, 51), esq = leituraGeiger(c, 51, 45), frente = leituraGeiger(c, 45, 45);
  assert.ok(dir.pan > 0.6, `cratera à direita da tela: pan ${dir.pan}`); assert.ok(esq.pan < -0.6, `à esquerda: pan ${esq.pan}`); assert.ok(Math.abs(frente.pan) < 0.25, `logo abaixo na tela: pan ${frente.pan}`);
  assert.equal(setaPan(dir.pan), '▶'); assert.equal(setaPan(esq.pan), '◀'); assert.equal(dir.nivel, 3);
  const comPo = leituraGeiger(c, 45, 51, 2); assert.ok(comPo.pan < dir.pan * 0.5 && comPo.cpm > dir.cpm + 1500, 'pó na roupa: mais cliques, do centro');
  assert.deepEqual(c.gradiente(5, 5), { dx: 0, dy: 0 }); const g = c.gradiente(42, 48.5); assert.ok(g.dx > 0.9, 'gradiente aponta para a cratera');
});

teste('radiação: passo da pluma custa ≤ 1 ms (média) e o tick do módulo bem menos por quadro', () => {
  const c = criarCampo(zonaReal('pantano', 't'), 't'), cl = clima({ vento: 0.7, ventoDir: 0.4, chuva: 0.3, poeira: 0.2 });
  for (let k = 0; k < 20; k++) c.passo(0.5, cl);
  const t0 = performance.now(); for (let k = 0; k < 200; k++) c.passo(0.5, cl); const ms = (performance.now() - t0) / 200;
  assert.ok(ms <= 1, `passo médio ${ms.toFixed(3)} ms`);
  const sis = new SistemaRadiacao(new Barramento()), m = mundo(zonaReal('pantano', 't'), 't'); sis.iniciar(m);
  const t1 = performance.now(); for (let k = 0; k < 600; k++) { m.jogador.x = 20 + (k % 50) * 0.1; sis.tick(1 / 60, m); } const porQuadro = (performance.now() - t1) / 600;
  assert.ok(porQuadro < 0.3, `tick médio ${porQuadro.toFixed(3)} ms`);
});

function mundo(z: ZonaMundo, seed: string): Mundo { const m = novoMundo(); m.seed = seed; m.zona = z; m.jogador.x = 20; m.jogador.y = 20; m.clima.vento = 0.3; return m; }

teste('radiação: módulo emite geiger ~5×/s, troca radSuave e salva a dose', () => {
  const bus = new Barramento(), sis = new SistemaRadiacao(bus), m = mundo(zonaCratera(48, 48), 's'); let n = 0, ult = { cpm: 0, pan: 0, nivel: 0 };
  bus.on('geiger', e => { n++; ult = e; });
  m.jogador.x = 45; m.jogador.y = 51; sis.iniciar(m); for (let k = 0; k < 120; k++) { sis.tick(1 / 60, m); m.minutos += MIN_POR_SEG / 60; }
  entre(n, 9, 11, 'eventos em 2 s'); assert.ok(ult.pan > 0.5 && ult.nivel >= 2, `pan ${ult.pan} nível ${ult.nivel}`); entre(sis.taxaJogador(), 0.3, 1.2, 'taxa amortecida');
  assert.ok(sis.dosimetro.dose > 0 && sis.dosimetro.contaminacao > 0);
  const s = JSON.parse(JSON.stringify(sis.salvar())), outro = new SistemaRadiacao(new Barramento()); outro.carregar(s); assert.equal(outro.dosimetro.dose, Math.round(sis.dosimetro.dose * 100) / 100);
  outro.carregar(undefined); assert.equal(outro.dosimetro.dose, 0);
});

teste('radiação: Colosso abatido vira fonte nova (pelo barramento)', () => {
  const bus = new Barramento(), sis = new SistemaRadiacao(bus), m = mundo(zonaCratera(20, 20), 's'); sis.iniciar(m);
  const antes = sis.campo!.amostra(70.5, 70.5); bus.emit({ t: 'abate', arq: 'colosso', x: 70.5, y: 70.5 });
  assert.ok(sis.campo!.fontes().some(f => f.tipo === 'colosso')); assert.ok(sis.campo!.amostra(70.5, 70.5) > antes + 0.5);
});

teste('radiação (autoral): o pó azul gruda, deixa rastro, vai para casa no save e só a água tira', () => {
  let seed = '', z: ZonaMundo | null = null;
  for (const s of ['a', 'b', 'c', 'd', 'e', 'f']) { const zz = zonaReal('cidade', s, 'cidade'); if (criarCampo(zz, s).fontes().some(f => f.tipo === 'po_azul')) { seed = s; z = zz; break; } }
  assert.ok(z, 'alguma cidade tem a cápsula');
  const bus = new Barramento(), sis = new SistemaRadiacao(bus), m = mundo(z!, seed); sis.iniciar(m);
  const cap = sis.campo!.fontes().find(f => f.tipo === 'po_azul')!; m.jogador.x = cap.x; m.jogador.y = cap.y;
  for (let k = 0; k < 60; k++) sis.tick(1 / 60, m);
  assert.ok(sis.poNaRoupa() > 0.2, `pó na roupa ${sis.poNaRoupa()}`);
  // anda 30 casas para longe: o pó cai pelo caminho
  const q0 = sis.poNaRoupa(); for (let k = 0; k < 300; k++) { m.jogador.x = cap.x + (k + 1) * 0.1 * (cap.x < 48 ? 1 : -1); sis.tick(1 / 60, m); }
  assert.ok(sis.poNaRoupa() < q0 && sis.poNaRoupa() > 0.3 * q0, 'perde um pouco e leva o resto');
  assert.ok(sis.campo!.poEm(cap.x + 15 * (cap.x < 48 ? 1 : -1), cap.y) > 0.001, 'rastro no meio do caminho');
  const l = leituraGeiger(sis.campo!, m.jogador.x, m.jogador.y, sis.roupa.taxa()); assert.ok(Math.abs(l.pan) < 0.3, 'o som vem do centro');
  // leva para o abrigo: troca de zona, anda lá, sai e volta — o chão do abrigo continua quente
  const base = gerarZona('base', 'base', seed), zb: ZonaMundo = { id: 'base', bioma: 'base', w: W, h: H, tipos: base.tipos, solido: base.solido, opaco: base.opaco, rad: base.rad };
  m.zona = zb; m.jogador.x = 48; m.jogador.y = 80; for (let k = 0; k < 120; k++) { m.jogador.y -= 0.1; sis.tick(1 / 60, m); }
  const quente = sis.campo!.amostra(48.5, 75.5); assert.ok(quente > base.rad[75 * W + 48] + 0.002, `abrigo contaminado (${quente})`);
  const s = JSON.parse(JSON.stringify(sis.salvar())); assert.ok(s.rastros.base?.length > 0 && s.rastros.cidade?.length > 0, `rastros salvos: ${Object.keys(s.rastros)} base=${s.rastros.base?.length}`);
  const volta = new SistemaRadiacao(new Barramento()); volta.carregar(s); volta.iniciar(m); entre(volta.campo!.amostra(48.5, 75.5), quente - 0.002, quente + 0.002, 'rastro volta do save');
  // chuva lava devagar; lavar-se tira tudo
  const q1 = volta.poNaRoupa(); m.clima.chuva = 0.6; for (let k = 0; k < 600; k++) volta.tick(1 / 60, m); assert.ok(volta.poNaRoupa() < q1 * 0.9, `chuva: ${q1} → ${volta.poNaRoupa()}`);
  volta.lavar(m.jogador.x, m.jogador.y); assert.equal(volta.poNaRoupa(), 0);
});
