// Testes de lógica e de BALANÇO (rodam em Node, sem navegador): `npm run teste`.
// Cada meta de dificuldade do jogo está aqui como número; se um ajuste quebrar o equilíbrio, o teste falha dizendo qual.
import assert from 'node:assert/strict';
import './shim-audio'; // precisa vir ANTES do zzfx
import { ZZFX } from 'zzfx';
import { PRE, NIVEL, TETO_PICO_DB, DUCK, PERFIS, PERFIS_ORDEM, catDe, loudnessDb, picoDb, normalizar, type Cat } from '../../game/dados/sons';
import { ARQS } from '../../game/dados/criaturas';
import { ARMAS, ITENS, RECEITAS } from '../../game/dados/itens';
import { BIOMAS } from '../../game/dados/biomas';
import { LOCAIS, custoViagem, bloqueioLocal } from '../../game/dados/locais';
import { estadoInicial, novoRun } from '../../game/store';
import { Rng } from '../../game/lib/rng';
import { gerarZona, W, H, T, idx } from '../../game/zona';
import { COLHEITA, colheitaDe } from '../../game/dados/colheita';
import { NOTAS } from '../../game/dados/notas';
import { atracoes, distanciaAtracoes, lacunas } from '../../game/sistemas/cobertura';
import { DIF, FOME_POR_MIN, SEDE_POR_MIN, REGEN_VIDA, RAID_DIA_MIN, VIDA_POR_NIVEL, danoPorAcao, acoesParaMatar, dpsInimigo, perdaEmLuta, segundosAteZerar, tamanhoRaid, xpNivel, xpAcumulado, nivelPorXp } from '../../game/dados/balanco';
import { planejarNpcs, falaDe, estoqueMascate, vendavel, TIPOS_NPC, type CtxFala } from '../../game/dados/npcs';
import { OBJETIVOS } from '../../game/dados/objetivos';
import { criarCenaViagem, marco, ceuEm, texto, larguraTexto, type ClimaViagem } from '../../game/lib/viagem';
import { novaRota, passoRota, P_PARADA, distTotal, type FaseRota } from '../../game/sistemas/rota';
import { VALOR, precoCompra, precoVenda } from '../../game/dados/balanco';
import { GANGUE, TENSAO_LIMITE, alvoHostis, escolherArq, intervaloSpawn, noiteFator, pesosArq, podeSpawnar, pontoSpawn, tamanhoGrupo, tensaoAbate, tensaoDano, tensaoDecai, type CtxSpawn } from '../../game/sistemas/spawn';

const casos: { nome: string; fn: () => void }[] = [];
const teste = (nome: string, fn: () => void) => casos.push({ nome, fn });
const entre = (v: number, a: number, b: number, rot: string) => assert.ok(v >= a && v <= b, `${rot}: ${v.toFixed(2)} fora de [${a}, ${b}]`);
const ctx = (o: Partial<CtxSpawn> = {}): CtxSpawn => ({ hora: 12, nivel: 1, dia: 2, dif: 1, interior: false, neblina: 0, chuva: 0, noBase: false, ...o });
const HOSTIS_BASICOS = ['irradiado', 'corredor', 'rastejador', 'cao', 'lobo', 'javali', 'rato', 'barata', 'escorpiao', 'aranha'];

// ================================================================ combate
teste('um irradiado sozinho custa 4–15% da vida com o pé de cabra (Normal)', () => entre(perdaEmLuta('pe_de_cabra', 'irradiado', 1), 0.04, 0.15, 'perda 1 irradiado'));
teste('3 irradiados ao mesmo tempo são perigosos mas sobrevivíveis (25–60%) e no Calmo quase não matam (≤ 40%)', () => { entre(perdaEmLuta('pe_de_cabra', 'irradiado', 3), 0.25, 0.6, 'perda 3 irradiados'); assert.ok(perdaEmLuta('pe_de_cabra', 'irradiado', 3, 0) <= 0.4, 'Calmo deveria ser bem leve'); });
teste('matilhas e javalis do começo não matam no corpo a corpo', () => {
  entre(perdaEmLuta('pe_de_cabra', 'corredor', 2), 0.1, 0.4, 'corredor x2'); entre(perdaEmLuta('pe_de_cabra', 'cao', 3), 0.15, 0.45, 'cão x3');
  entre(perdaEmLuta('pe_de_cabra', 'lobo', 3), 0.2, 0.5, 'lobo x3'); entre(perdaEmLuta('pe_de_cabra', 'javali', 2), 0.25, 0.65, 'javali x2');
});
teste('o Colosso é chefe: letal de perto com arma branca (≥ 80%) e ≥ 40% com arma de fogo, mas cai em ≤ 24 golpes/tiros', () => {
  for (const a of ['pe_de_cabra', 'machado', 'pistola', 'escopeta', 'rifle']) { assert.ok(perdaEmLuta(a, 'colosso', 1) >= (ARMAS[a].alvo === 'melee' ? 0.8 : 0.4), `colosso x ${a} deveria ser perigoso de perto`); assert.ok(acoesParaMatar(a, 'colosso') <= 24, `${a} precisa de golpes demais`); }
  assert.ok(acoesParaMatar('escopeta', 'colosso') >= 5, 'o Colosso não pode cair em menos de 5 tiros');
});
teste('armas melhores têm ao menos 1,3x o DPS do pé de cabra (progressão que dá gosto)', () => {
  const dps = (id: string) => danoPorAcao(id) / ARMAS[id].cd, base = dps('pe_de_cabra');
  for (const a of ['facao', 'machado', 'pistola', 'escopeta', 'rifle']) assert.ok(dps(a) >= base * 1.3, `${a} tem DPS ${dps(a).toFixed(1)} vs ${base.toFixed(1)}`);
});
teste('qualquer hostil básico leva ≥ 6 s para matar o jogador sozinho (Normal)', () => { for (const id of HOSTIS_BASICOS) assert.ok(100 / dpsInimigo(id, 1) >= 6, `${id} mata em ${(100 / dpsInimigo(id, 1)).toFixed(1)} s`); });
teste('a dificuldade ordena a perda de vida: Calmo < Normal < Brutal', () => {
  for (const [a, e, n] of [['pe_de_cabra', 'irradiado', 3], ['pe_de_cabra', 'cao', 3], ['faca', 'corredor', 2]] as [string, string, number][]) {
    const [c, nm, b] = [0, 1, 2].map(d => perdaEmLuta(a, e, n, d)); assert.ok(c < nm && nm < b, `${a} x ${e}: ${c.toFixed(2)} / ${nm.toFixed(2)} / ${b.toFixed(2)}`); entre(c / nm, 0.62, 0.72, 'razão Calmo/Normal'); entre(b / nm, 1.4, 1.55, 'razão Brutal/Normal');
  }
});

// ================================================================ necessidades e progressão
teste('sede 100→0 em 19–26 min reais (Normal) e fome em 28–40 min; água é mais urgente que comida', () => {
  const sede = segundosAteZerar(SEDE_POR_MIN) / 60, fome = segundosAteZerar(FOME_POR_MIN) / 60; entre(sede, 19, 26, 'sede (min)'); entre(fome, 28, 40, 'fome (min)'); assert.ok(sede < fome, 'a sede deve vencer antes da fome');
});
teste('Calmo dá ≥ 15% mais tempo que Normal; Brutal ≤ 90% do Normal', () => {
  const t = (d: number) => segundosAteZerar(SEDE_POR_MIN, d); assert.ok(t(0) >= t(1) * 1.15 && t(2) <= t(1) * 0.9, `${t(0).toFixed(0)} / ${t(1).toFixed(0)} / ${t(2).toFixed(0)}`);
});
teste('curva de XP: crescente e com ritmo razoável (nível 5 ≈ 440, nível 10 ≈ 1.9 mil)', () => {
  for (let n = 1; n < 20; n++) assert.ok(xpNivel(n + 1) > xpNivel(n)); entre(xpAcumulado(5), 300, 600, 'XP até nível 5'); entre(xpAcumulado(10), 1200, 2500, 'XP até nível 10');
  assert.equal(nivelPorXp(xpAcumulado(7)), 7); assert.equal(nivelPorXp(xpAcumulado(7) - 1), 6);
});
teste('tamanho da invasão: só a partir do dia 3, cresce com os dias, cai com a muralha, respeita a dificuldade e os limites', () => {
  assert.equal(RAID_DIA_MIN, 3); assert.ok(tamanhoRaid(RAID_DIA_MIN, 0, 1) <= 2, 'a primeira invasão deve ter ≤ 2 inimigos (Normal)'); assert.ok(tamanhoRaid(RAID_DIA_MIN, 0, 0) <= 1, 'no Calmo a primeira invasão tem 1 inimigo');
  for (let d = 2; d < 14; d++) { assert.ok(tamanhoRaid(d + 1, 0) >= tamanhoRaid(d, 0)); for (const m of [0, 1, 2, 3]) entre(tamanhoRaid(d, m), 1, 10, `raid dia ${d} muro ${m}`); }
  for (const d of [3, 6, 9]) { assert.ok(tamanhoRaid(d, 3) <= tamanhoRaid(d, 0) * 0.6 + 1, `a muralha 3 deveria cortar ~60% no dia ${d}`); assert.ok(tamanhoRaid(d, 0, 0) <= tamanhoRaid(d, 0, 1) && tamanhoRaid(d, 0, 1) <= tamanhoRaid(d, 0, 2)); }
});

// ================================================================ diretor de spawn (puro)
teste('noite fator: 1 de madrugada, 0 ao meio-dia, rampa suave no fim da tarde e no amanhecer', () => {
  assert.equal(noiteFator(0), 1); assert.equal(noiteFator(23), 1); assert.equal(noiteFator(12), 0); assert.equal(noiteFator(9), 0);
  for (let h = 17; h < 22; h += 0.5) assert.ok(noiteFator(h + 0.5) >= noiteFator(h)); for (let h = 4.5; h < 8; h += 0.5) assert.ok(noiteFator(h + 0.5) <= noiteFator(h));
});
teste('alvo de hostis: 0 no abrigo; noite ≥ dia; Calmo ≤ Normal ≤ Brutal; interior < exterior; limite 9', () => {
  for (const b of Object.values(BIOMAS)) {
    assert.equal(alvoHostis(b, ctx({ noBase: true })), 0);
    for (const d of [0, 1, 2]) { const dia = alvoHostis(b, ctx({ hora: 12, dif: d })), noite = alvoHostis(b, ctx({ hora: 0, dif: d })); assert.ok(noite >= dia, `${b.id}: noite ${noite} < dia ${dia}`); entre(noite, 0, 9, `${b.id} noite`); }
    if (b.inimigos.length) { const [c, n, br] = [0, 1, 2].map(d => alvoHostis(b, ctx({ hora: 0, dif: d }))); assert.ok(c <= n && n <= br && c < br, `${b.id} dif: ${c}/${n}/${br}`); assert.ok(alvoHostis(b, ctx({ hora: 0, interior: true })) <= alvoHostis(b, ctx({ hora: 0 })), `${b.id} interior`); }
  }
  const noite = (id: string) => alvoHostis(BIOMAS[id], ctx({ hora: 0 })); assert.ok(noite('cidade') >= noite('floresta') && noite('floresta') >= noite('ermo'), 'cidade ≥ floresta ≥ ermo à noite (cresce com o perigo)');
});
teste('alvo de hostis no nível 1 (Normal): ≤ 3 de dia e ≤ 5 de noite em qualquer bioma; cresce com o nível sem estourar', () => {
  for (const b of Object.values(BIOMAS)) { assert.ok(alvoHostis(b, ctx({ hora: 12 })) <= 3, `${b.id} dia`); assert.ok(alvoHostis(b, ctx({ hora: 0 })) <= 5, `${b.id} noite`); assert.ok(alvoHostis(b, ctx({ hora: 0, nivel: 10, dia: 10 })) <= 9); assert.ok(alvoHostis(b, ctx({ hora: 0, nivel: 10 })) >= alvoHostis(b, ctx({ hora: 0, nivel: 1 }))); }
});
teste('intervalo de reposição: mais curto à noite e em dificuldade alta; sempre entre 20 e 90 s', () => {
  assert.ok(intervaloSpawn(ctx({ hora: 0 })) < intervaloSpawn(ctx({ hora: 12 }))); assert.ok(intervaloSpawn(ctx({ dif: 2 })) < intervaloSpawn(ctx({ dif: 1 })) && intervaloSpawn(ctx({ dif: 1 })) < intervaloSpawn(ctx({ dif: 0 })));
  for (const h of [0, 6, 12, 18]) for (const d of [0, 1, 2]) entre(intervaloSpawn(ctx({ hora: h, dif: d })), 20, 90, `intervalo ${h}h dif ${d}`);
});
teste('escolha de arquétipo: sem gangues no nível 1, com gangues na cidade no nível 5, sempre válido e determinístico', () => {
  const amostra = (bi: string, c: CtxSpawn, n = 6000, seed = 'a') => { const r = new Rng(seed), cont: Record<string, number> = {}; for (let i = 0; i < n; i++) { const a = escolherArq(r, BIOMAS[bi], c); assert.ok(BIOMAS[bi].inimigos.some(([id]) => id === a) && ARQS[a], `arq inválido ${a}`); cont[a] = (cont[a] ?? 0) + 1; } return cont; };
  const n1 = amostra('cidade', ctx({ nivel: 1 })), n5 = amostra('cidade', ctx({ nivel: 5 }));
  assert.equal(GANGUE.reduce((s, g) => s + (n1[g] ?? 0), 0), 0, 'gangue no nível 1'); assert.ok(GANGUE.reduce((s, g) => s + (n5[g] ?? 0), 0) > 0, 'gangue no nível 5');
  const dia = amostra('ermo', ctx({ hora: 12 })), noite = amostra('ermo', ctx({ hora: 0 })); assert.ok((noite.corredor ?? 0) >= (dia.corredor ?? 0) * 1.3, 'corredores deveriam crescer à noite'); assert.ok((dia.irradiado ?? 0) > (dia.corredor ?? 0) * 2, 'o comum deve ser o irradiado');
  assert.deepEqual(amostra('ermo', ctx(), 200, 'x'), amostra('ermo', ctx(), 200, 'x'));
  for (const b of Object.values(BIOMAS)) for (const [id] of pesosArq(b, ctx({ nivel: 6 }))) assert.ok(ARQS[id], `${b.id}: ${id}`);
});
teste('tamanho do grupo: ≥ 1, ≤ 2 antes do nível 3, nunca passa da meta e Colosso é sempre 1', () => {
  const r = new Rng('g'); for (let i = 0; i < 500; i++) { for (const a of HOSTIS_BASICOS) { assert.ok(tamanhoGrupo(r, a, ctx({ nivel: 1 }), 5) <= 2); const f = r.int(1, 4); assert.ok(tamanhoGrupo(r, a, ctx({ nivel: 6 }), f) >= 1 && tamanhoGrupo(r, a, ctx({ nivel: 6 }), f) <= Math.max(1, f)); } assert.equal(tamanhoGrupo(r, 'colosso', ctx({ nivel: 9 }), 6), 1); }
});
teste('quando segurar: tensão alta, meta cumprida, intervalo não passou ou população cheia', () => {
  const ok = { agora: 100, hostis: 1, alvo: 3, total: 40, tensao: 0.2, ultimo: 40, intervalo: 30 };
  assert.ok(podeSpawnar(ok)); assert.ok(!podeSpawnar({ ...ok, tensao: 0.9 })); assert.ok(!podeSpawnar({ ...ok, hostis: 3 })); assert.ok(!podeSpawnar({ ...ok, alvo: 0 })); assert.ok(!podeSpawnar({ ...ok, ultimo: 90 })); assert.ok(!podeSpawnar({ ...ok, total: 140 }));
});
teste('tensão: um golpe forte segura a reposição e o alívio chega em ≤ 25 s', () => {
  let t = tensaoDano(0, 30); assert.ok(t >= 0.35 && t <= TENSAO_LIMITE, 'um golpe só não deve travar o jogo'); t = tensaoDano(t, 30); assert.ok(t > TENSAO_LIMITE, 'dois golpes fortes seguram a reposição'); assert.ok(tensaoAbate(0) > 0 && tensaoDano(0.95, 90) <= 1);
  let seg = 0; t = 1; while (t > TENSAO_LIMITE && seg < 120) { t = tensaoDecai(t, 1); seg++; } assert.ok(seg <= 25, `levou ${seg} s para aliviar`);
});
teste('ponto de reposição: dentro do anel, só em terreno válido, 60% atrás de quem olha, nulo se nada serve', () => {
  const r = new Rng('p'); let atras = 0, tot = 0;
  for (let i = 0; i < 400; i++) { const p = pontoSpawn(r, 50, 50, 0, () => true, 14, 24); assert.ok(p); const d = Math.hypot(p![0] - 50, p![1] - 50); entre(d, 13, 25.5, 'distância'); tot++; if (p![0] < 50) atras++; }
  assert.ok(atras / tot > 0.5, `só ${(atras / tot * 100).toFixed(0)}% atrás`); assert.equal(pontoSpawn(r, 50, 50, 0, () => false), null); assert.ok(pontoSpawn(r, 50, 50, 0, (x) => x > 60, 14, 24, 200));
});

// ================================================================ mundo: população e economia (zonas geradas por seed)
const SEEDS = Array.from({ length: 10 }, (_, i) => `balanco${i}`), ZONAS = LOCAIS.filter(l => l.id !== 'base' && l.id !== 'abrigo7');
const cacheZonas = new Map<string, ReturnType<typeof gerarZona>[]>(); // gerar zona é o custo dos testes: cada local sai uma vez só
const zonas = (id: string) => { let z = cacheZonas.get(id); if (!z) { const l = LOCAIS.find(x => x.id === id)!; z = SEEDS.map(s => gerarZona(l.id, l.bioma, s, l.nome, l.tema)); cacheZonas.set(id, z); } return z; };
const ameaca = (z: ReturnType<typeof gerarZona>) => z.spawns.reduce((s, sp) => s + (ARQS[sp.arq].hostil ? Math.sqrt(ARQS[sp.arq].hp * dpsInimigo(sp.arq)) : 0), 0);
const media = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
teste('a ameaça das zonas cresce com o perigo (≥ 5% por degrau)', () => {
  const por: Record<number, number[]> = {}; for (const l of ZONAS) (por[l.perigo] ??= []).push(media(zonas(l.id).map(ameaca)));
  const m = [1, 2, 3, 4].map(p => media(por[p])); for (let i = 1; i < m.length; i++) assert.ok(m[i] >= m[i - 1] * 1.05, `perigo ${i + 1} (${m[i].toFixed(0)}) deveria passar perigo ${i} (${m[i - 1].toFixed(0)}) em ≥ 5%`);
});
teste('nenhum hostil nasce a menos de 22 tiles de onde o jogador chega; população ≤ 110 hostis', () => {
  for (const l of ZONAS) for (const z of zonas(l.id)) { let n = 0; for (const sp of z.spawns) { if (!ARQS[sp.arq].hostil) continue; n++; assert.ok(Math.hypot(sp.x - z.jogador.x, sp.y - z.jogador.y) >= 22 - 1e-6, `${l.id}: ${sp.arq} nasce perto`); } assert.ok(n <= 110, `${l.id} tem ${n} hostis`); }
});
teste('o Colosso é raro (≤ 30% das zonas), exceto na Refinaria (perigo 4, ≤ 70%)', () => { for (const l of ZONAS) { const c = zonas(l.id).filter(z => z.spawns.some(s => s.arq === 'colosso')).length; assert.ok(c <= (l.perigo >= 4 ? 7 : 3), `${l.id}: Colosso em ${c}/10 zonas`); } });
teste('economia: toda zona tem ≥ 1 dia de água e de comida (soltos, saque e reservatórios); Ermo e Floresta ≥ 1,5 dia de água', () => {
  const NEC_SEDE = SEDE_POR_MIN * 1440, NEC_FOME = FOME_POR_MIN * 1440;
  for (const l of ZONAS) {
    const zs = zonas(l.id), sede = media(zs.map(z => z.props.reduce((s, p) => s + (p.loot ?? []).reduce((a, i) => a + (ITENS[i]?.sede ?? 0), 0) + (p.inters.some(i => i.k === 'fonte') ? 4 * 28 : 0), 0)));
    const fome = media(zs.map(z => z.props.reduce((s, p) => s + (p.loot ?? []).reduce((a, i) => a + (ITENS[i]?.fome ?? 0), 0), 0) + z.soltos.reduce((s, o) => s + (ITENS[o.item]?.fome ?? 0) * o.q, 0)));
    assert.ok(sede >= NEC_SEDE, `${l.id}: água para ${(sede / NEC_SEDE).toFixed(2)} dia`); if (!['industrial', 'militar'].includes(l.id)) assert.ok(fome >= NEC_FOME, `${l.id}: comida para ${(fome / NEC_FOME).toFixed(2)} dia`);
    if (['ermo', 'floresta'].includes(l.id)) assert.ok(sede >= NEC_SEDE * 1.5, `${l.id}: água só para ${(sede / NEC_SEDE).toFixed(2)} dia`);
  }
});
teste('a geração é determinística (mesma seed, mesma população)', () => { const a = zonas('ermo')[0], b = zonas('ermo')[0]; assert.deepEqual(a.spawns, b.spawns); assert.deepEqual(a.soltos, b.soltos); });

// ================================================================ primeiros minutos: o jogo precisa ser acolhedor
teste('início acolhedor: o kit inicial cobre a primeira meia hora, a vida volta sozinha em poucos minutos e cresce com o nível', () => {
  const e = estadoInicial('inicio'), agua = (e.inv.agua ?? 0) * (ITENS.agua.sede ?? 0), comida = (e.inv.enlatado ?? 0) * (ITENS.enlatado.fome ?? 0);
  assert.ok(agua >= 100, `água inicial só repõe ${agua} de sede`); assert.ok(comida >= 100, `comida inicial só repõe ${comida} de fome`);
  assert.ok((e.inv.bandagem ?? 0) >= 3, 'faltam curativos no começo'); assert.ok(ITENS.bandagem.hp! >= 12, 'a bandagem cura pouco'); assert.ok(e.combustivel >= 8, 'combustível para ao menos 3 viagens');
  assert.ok(50 / REGEN_VIDA <= 180, `curar 50% leva ${(50 / REGEN_VIDA).toFixed(0)} s`); assert.ok(100 + VIDA_POR_NIVEL * 10 >= 130, 'a vida deve crescer com o nível');
});
teste('viagens: o combustível inicial dá para ir e voltar ao Ermo e à Floresta sem precisar achar combustível', () => {
  const e = estadoInicial('inicio'); let gasto = 0; for (const d of ['ermo', 'floresta']) gasto += 2 * custoViagem('base', d).combustivel; assert.ok(gasto <= e.combustivel, `ida e volta custa ${gasto} de ${e.combustivel}`);
});

// ================================================================ progressão linear: campanha, mapa e receitas por nível
teste('campanha linear: passos únicos, em ordem de atos, com meta, dica e XP; o último é a vitória e nenhum nasce cumprido', () => {
  const ids = new Set<string>(); let ultAto = 1; const r = novoRun('prog');
  OBJETIVOS.forEach((o, i) => {
    assert.ok(!ids.has(o.id), `id repetido ${o.id}`); ids.add(o.id); assert.ok(o.ato >= ultAto, `ato fora de ordem em ${o.id}`); ultAto = o.ato;
    assert.ok(o.meta >= 1 && o.dica.length > 15 && o.titulo.length > 5, `${o.id} incompleto`); assert.ok(i === OBJETIVOS.length - 1 ? o.xp === 0 : o.xp > 0, `xp de ${o.id}`);
    const v = o.valor(r, r.inv); assert.ok(v >= 0 && v <= o.meta, `${o.id}: valor ${v} fora de [0, ${o.meta}]`); assert.ok(v < o.meta, `${o.id} já nasce cumprido`);
  });
  assert.equal(OBJETIVOS[OBJETIVOS.length - 1].id, 'abrigo7'); entre(OBJETIVOS.length, 20, 30, 'passos da campanha'); assert.equal(OBJETIVOS[0].local, undefined, 'o primeiro passo é no abrigo');
  assert.deepEqual([...new Set(OBJETIVOS.map(o => o.ato))], [1, 2, 3, 4]);
});
teste('o mapa abre por nível, crescente com o perigo, e o XP da campanha libera cada local a tempo', () => {
  const ord = [...LOCAIS].sort((a, b) => a.perigo - b.perigo || a.nivel - b.nivel); for (let i = 1; i < ord.length; i++) assert.ok(ord[i].nivel >= ord[i - 1].nivel, `${ord[i].id} (perigo ${ord[i].perigo}) abre antes de ${ord[i - 1].id}`);
  assert.equal(LOCAIS.find(l => l.id === 'ermo')!.nivel, 1); assert.ok(LOCAIS.every(l => l.nivel >= 1 && l.nivel <= 8));
  let xp = 0; for (const o of OBJETIVOS) { if (o.local) { const l = LOCAIS.find(x => x.id === o.local)!; assert.ok(xpAcumulado(l.nivel) <= xp, `${o.id}: ${l.nome} pede nível ${l.nivel} (${xpAcumulado(l.nivel)} XP) mas a campanha só pagou ${xp} XP antes`); } xp += o.xp; }
  xp = 0; for (const o of OBJETIVOS) { const m = /^nivel(\d+)$/.exec(o.id); if (m) assert.ok(xp >= xpAcumulado(+m[1]) * 0.5, `${o.id}: a campanha paga só ${xp} XP de ${xpAcumulado(+m[1])} necessários (≥ 50% deve vir dela)`); xp += o.xp; }
  assert.equal(bloqueioLocal(LOCAIS.find(l => l.id === 'ermo')!, 1, {}), null); assert.ok(bloqueioLocal(LOCAIS.find(l => l.id === 'militar')!, 3, {})?.includes('nível 8'));
  const a7 = LOCAIS.find(l => l.id === 'abrigo7')!; assert.ok(bloqueioLocal(a7, 9, {})?.includes('rádio')); assert.equal(bloqueioLocal(a7, 8, { radio: 1 }), null);
});
teste('receitas por nível: básicas no começo, armas fortes só no fim, e o machado da campanha já está liberado quando o passo chega', () => {
  const por = (id: string) => RECEITAS.find(r => r.id === id)!.nivelJog!; assert.ok(RECEITAS.every(r => (r.nivelJog ?? 1) >= 1 && (r.nivelJog ?? 1) <= 8), 'nível de receita fora de [1, 8]');
  assert.ok(por('r_bandagem') === 1 && por('r_taco') === 1 && por('r_faca') === 1 && por('r_fogueira') === 1, 'o começo precisa de receitas básicas');
  assert.ok(por('r_pistola') > por('r_faca') && por('r_escopeta') >= por('r_pistola') && por('r_facao') > por('r_machado'), 'armas melhores abrem depois');
  const iM = OBJETIVOS.findIndex(o => o.id === 'machado'), xpAntes = OBJETIVOS.slice(0, iM).reduce((s, o) => s + o.xp, 0); assert.ok(xpAcumulado(por('r_machado')) <= xpAntes, 'o passo do machado pede uma receita que o nível ainda não liberou');
  const iF = OBJETIVOS.findIndex(o => o.id === 'fabricar'); assert.ok(RECEITAS.filter(r => (r.nivelJog ?? 1) === 1 && (r.nivel ?? 0) === 0).length >= 3 && iF < iM, 'o passo de fabricar precisa de receitas de nível 1');
});

// ================================================================ mundo cheio: nenhum lugar vazio, mais recursos e interações
const andavelDe = (z: ReturnType<typeof gerarZona>) => (x: number, y: number) => { const tp = z.tipos[idx(x, y)]; return !z.solido[idx(x, y)] && tp !== T.PAREDE && tp !== T.JANELA && tp !== T.AGUA_FUNDA && tp !== T.RUINA && x > 2 && y > 2 && x < W - 3 && y < H - 3; };
teste('nenhum lugar do mapa fica longe de algo para fazer: pior lacuna ≤ 18 tiles e 95% das células a ≤ 10 tiles', () => {
  for (const l of ZONAS) for (const z of zonas(l.id)) { const r = lacunas(distanciaAtracoes(atracoes(z.props, z.flora, z.pois), W, H), W, H, andavelDe(z)); assert.ok(r.max <= 18, `${l.id}: há um ponto a ${r.max.toFixed(1)} tiles de qualquer coisa para fazer`); assert.ok(r.p95 <= 10, `${l.id}: 95% das células ficam a ${r.p95.toFixed(1)} tiles (limite 10)`); }
});
teste('os pontos de interesse têm de tudo um pouco: água, bilhetes, ferro-velho, saque e plantas colhíveis; e a geração segue determinística', () => {
  const tot: Record<string, number> = { fonte: 0, nota: 0, garimpar: 0, saque: 0, colher: 0, poi: 0 };
  for (const l of ZONAS) for (const z of zonas(l.id)) { for (const p of z.props) for (const i of p.inters) if (i.k in tot) tot[i.k]++; tot.colher += z.flora.filter(f => !!colheitaDe(f.rec)).length; tot.poi += z.pois.length; }
  for (const k of Object.keys(tot)) assert.ok(tot[k] > 0, `nenhum ${k} em todas as zonas`);
  const a = zonas('ermo')[0], b = zonas('ermo')[0]; assert.deepEqual(a.pois, b.pois); assert.equal(a.props.length, b.props.length);
});
teste('as peças do cenário nunca se sobrepõem e quase tudo o que há para fazer é alcançável a pé a partir da chegada', () => {
  let total = 0, alcancavel = 0;
  for (const l of ZONAS) for (const z of zonas(l.id)) {
    const dono = new Set<number>(); for (const p of z.props) for (let j = p.y; j < p.y + p.h; j++) for (let i = p.x; i < p.x + p.w; i++) { assert.ok(!dono.has(idx(i, j)), `${l.id}: duas peças no mesmo tile (${i}, ${j})`); dono.add(idx(i, j)); }
    const vis = new Uint8Array(W * H), fila: number[] = [idx(z.jogador.x, z.jogador.y)]; vis[fila[0]] = 1;
    for (let k = 0; k < fila.length; k++) { const i = fila[k], x = i % W, y = (i / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const n = idx(nx, ny); if (!vis[n] && !z.solido[n]) { vis[n] = 1; fila.push(n); } } }
    for (const p of z.props) { if (!p.inters.some(i => i.k !== 'jipe') && !p.loot?.length) continue; total++; let ok = false; for (let j = p.y - 1; j <= p.y + p.h && !ok; j++) for (let i = p.x - 1; i <= p.x + p.w; i++) if (i >= 0 && j >= 0 && i < W && j < H && vis[idx(i, j)]) { ok = true; break; } if (ok) alcancavel++; }
  }
  assert.ok(alcancavel / total >= 0.9, `só ${(alcancavel / total * 100).toFixed(0)}% dos objetos interativos são alcançáveis (mín. 90%)`);
});
teste('colheita: toda linha rende um item que existe, com chances válidas; arbustos vivos, cogumelos, flores e juncos rendem; arbusto seco não', () => {
  for (const [k, c] of Object.entries(COLHEITA)) { assert.ok(c.dur > 0.5 && c.dur < 4 && c.xp >= 0 && c.rot.length > 5, k); assert.ok(c.rende.length >= 1, k); for (const [id, ch, a, b] of c.rende) { assert.ok(ITENS[id], `${k} rende "${id}" que não existe`); assert.ok(ch > 0 && ch <= 1 && a >= 1 && b >= a && b <= 3, `${k}: ${id}`); } }
  assert.ok(colheitaDe({ f: 'arbusto', v: '' }) && colheitaDe({ f: 'cogumelo', v: 'brilho' }) && colheitaDe({ f: 'flor', v: '' }) && colheitaDe({ f: 'junco', v: '' })); assert.equal(colheitaDe({ f: 'arbusto', v: 'seco' }), undefined);
  assert.ok(ITENS.erva.estanca && ITENS.erva.hp! > 0 && ITENS.baga.fome! > 0 && ITENS.cogumelo.rad! > 0, 'itens novos coerentes');
});
teste('bilhetes: pelo menos 12, únicos, com texto legível e brindes que existem', () => {
  assert.ok(NOTAS.length >= 12); assert.equal(new Set(NOTAS.map(n => n.titulo)).size, NOTAS.length, 'título repetido');
  for (const n of NOTAS) { assert.ok(n.titulo.length >= 6 && n.texto.length >= 40 && n.texto.length <= 320, n.titulo); if (n.premio) assert.ok(ITENS[n.premio[0]] && n.premio[1] >= 1, `brinde de "${n.titulo}"`); }
});

// ================================================================ som: volume sentido parelho e perfis de equalização
teste('sons equalizados: cada som atinge o nível da sua categoria, sem estourar o teto de pico, e a hierarquia tiro > impacto > voz > coleta > passo > ambiente faz sentido', () => {
  const por: Partial<Record<Cat, number[]>> = {}; let dentro = 0, total = 0;
  for (const nome of Object.keys(PRE)) {
    const niv: number[] = [], alvo = NIVEL[catDe(nome)];
    for (let v = 0; v < 3; v++) {
      const s = ZZFX.buildSamples(...(PRE[nome] as number[])); normalizar(s, nome); const pico = picoDb(s), l = loudnessDb(s);
      assert.ok(pico <= TETO_PICO_DB + 0.05, `${nome}: pico ${pico.toFixed(1)} dBFS passa do teto`); assert.ok(l > -45, `${nome}: quase inaudível (${l.toFixed(1)} dB)`);
      assert.ok(l <= alvo + 0.5 && l >= alvo - 6, `${nome}: ${l.toFixed(1)} dB longe do alvo ${alvo} (categoria ${catDe(nome)})`); niv.push(l); total++; if (Math.abs(l - alvo) <= 1) dentro++;
    }
    assert.ok(Math.max(...niv) - Math.min(...niv) <= 1.5, `${nome}: as 3 variações diferem ${(Math.max(...niv) - Math.min(...niv)).toFixed(1)} dB`); (por[catDe(nome)] ??= []).push(...niv);
  }
  assert.ok(dentro / total >= 0.8, `só ${(dentro / total * 100).toFixed(0)}% dos sons chegam a 1 dB do alvo`);
  const med = (c: Cat) => { const a = por[c] ?? []; return a.reduce((s, x) => s + x, 0) / a.length; };
  const ordem: Cat[] = ['tiro', 'impacto', 'voz', 'coleta', 'ui', 'passo', 'pontual']; for (let i = 1; i < ordem.length; i++) assert.ok(med(ordem[i - 1]) > med(ordem[i]) + 1, `${ordem[i - 1]} (${med(ordem[i - 1]).toFixed(1)}) deveria soar mais alto que ${ordem[i]} (${med(ordem[i]).toFixed(1)})`);
  assert.ok(med('tiro') - med('passo') >= 8, 'o tiro precisa se destacar do passo em ≥ 8 dB');
});
teste('perfis de equalização: valores seguros; celular corta graves, fone os realça, noturno comprime mais; ducking só para tiro, Colosso, pancada e alarme', () => {
  for (const k of PERFIS_ORDEM) { const p = PERFIS[k]; assert.ok(p.nome.length > 3 && p.desc.length > 15, k); entre(p.hp, 20, 200, k + ' passa-alta'); entre(p.grave[0], 60, 300, k + ' graves Hz'); entre(p.grave[1], -6, 6, k + ' graves dB'); entre(p.medio[0], 800, 5000, k + ' médios Hz'); entre(p.medio[1], -4, 4, k + ' médios dB'); entre(p.medio[2], 0.4, 2, k + ' Q'); entre(p.agudo[0], 4000, 12000, k + ' agudos Hz'); entre(p.agudo[1], -6, 2, k + ' agudos dB'); assert.ok(p.comp[0] <= -12 && p.comp[1] >= 2 && p.comp[1] <= 8 && p.comp[2] >= 6 && p.comp[2] <= 30, k + ' compressor'); entre(p.trim, 0.6, 1.3, k + ' ganho'); }
  assert.ok(PERFIS.celular.hp >= 100 && PERFIS.celular.grave[1] < 0 && PERFIS.fone.grave[1] > 0 && PERFIS.noturno.comp[1] >= Math.max(PERFIS.equilibrado.comp[1], PERFIS.celular.comp[1], PERFIS.fone.comp[1]), 'identidade dos perfis');
  assert.deepEqual(Object.keys(DUCK).sort(), ['alerta', 'colosso', 'impacto', 'tiro']); for (const [c, [db, s]] of Object.entries(DUCK) as [string, [number, number]][]) { entre(db, 2, 9, 'duck ' + c); entre(s, 0.05, 0.6, 'espera ' + c); }
  assert.ok(!('passo' in DUCK) && !('ui' in DUCK) && !('pontual' in DUCK));
});
void DIF;

// ================================================================ NPCs: presença no mundo, falas e troca
teste('NPCs: planejamento determinístico, no máximo 3 por zona e sem NPC onde não faz sentido', () => {
  for (const l of LOCAIS) for (let d = 1; d <= 9; d++) {
    const a = planejarNpcs('npc1', l.id, l.perigo, d), b = planejarNpcs('npc1', l.id, l.perigo, d); assert.deepEqual(a, b); assert.ok(a.length <= 3);
    if (['abrigo7', 'militar'].includes(l.id)) assert.equal(a.length, 0, `${l.id} não tem NPC`);
    if (l.id === 'pantano') assert.ok(a.every(n => n.tipo === 'viajante'), 'o pântano só tem viajante');
    for (const n of a) { assert.ok(TIPOS_NPC.includes(n.tipo) && n.nome.length > 3); }
  }
});
teste('o mascate visita o abrigo a cada 3 dias (e só ele)', () => { for (let d = 1; d <= 12; d++) { const p = planejarNpcs('npc2', 'base', 0, d); assert.equal(p.length, d % 3 === 0 ? 1 : 0, `dia ${d}`); if (p.length) assert.equal(p[0].tipo, 'mascate'); } });
teste('o mundo é vivo: ≥ 80% das visitas a zonas comuns têm algum NPC; mascate ~35%, acampado ~55%, viajante ~45%', () => {
  const zonas = ZONAS.filter(l => !['militar', 'pantano'].includes(l.id)); let comAlgum = 0, tot = 0; const cont: Record<string, number> = { mascate: 0, acampado: 0, viajante: 0 };
  for (const l of zonas) for (let i = 0; i < 60; i++) { const p = planejarNpcs(`vida${i}`, l.id, l.perigo, 1 + (i % 9)); tot++; if (p.length) comAlgum++; for (const n of p) cont[n.tipo]++; }
  assert.ok(comAlgum / tot >= 0.8, `só ${(comAlgum / tot * 100).toFixed(0)}% das visitas têm NPC`); entre(cont.mascate / tot, 0.2, 0.45, 'mascate'); entre(cont.acampado / tot, 0.45, 0.65, 'acampado'); entre(cont.viajante / tot, 0.35, 0.55, 'viajante');
});
teste('falas: sempre não vazias e curtas, para todo tipo, objetivo, clima e hora; o acampado dá a dica do objetivo; traidor perde o comércio', () => {
  const r = new Rng('fala'), base: CtxFala = { hora: 12, clima: 'limpo', objId: 'jipe', dia: 2, nivel: 1, zonaId: 'ermo', traiu: false, raidRecente: false };
  for (const t of TIPOS_NPC) for (const o of OBJETIVOS) for (const cl of ['limpo', 'chuva', 'tempestade', 'neblina', 'poeira', 'acida', 'vento']) for (const h of [2, 12, 21]) { const f = falaDe(t, { ...base, objId: o.id, clima: cl, hora: h }, r); assert.ok(f.length > 15 && f.length <= 260, `${t}/${o.id}: "${f}"`); }
  let achou = 0; for (let i = 0; i < 40; i++) if (/Torre de Rádio/.test(falaDe('acampado', { ...base, objId: 'radio' }, new Rng('x' + i)))) achou++; assert.equal(achou, 40, 'o acampado sempre dá a dica do rádio');
  assert.match(falaDe('mascate', { ...base, traiu: true }, r), /não negocia/); assert.match(falaDe('viajante', { ...base, raidRecente: true }, r), /tiros/);
});
teste('estoque do mascate: 8 ofertas únicas e válidas, básicos sempre, combustível ≤ 1, determinístico', () => {
  for (let i = 0; i < 100; i++) { const e = estoqueMascate(new Rng('est' + i), 1 + i % 9); assert.equal(e.length, 8); assert.equal(new Set(e.map(o => o.item)).size, 8); for (const b of ['agua', 'enlatado', 'bandagem', 'municao']) assert.ok(e.some(o => o.item === b), `falta ${b}`); for (const o of e) { assert.ok(ITENS[o.item] && (VALOR[o.item] ?? 0) > 0 && o.q >= 1); if (o.item === 'combustivel') assert.equal(o.q, 1); } }
  assert.deepEqual(estoqueMascate(new Rng('a'), 3), estoqueMascate(new Rng('a'), 3));
});
teste('troca honesta: comprar sempre custa mais que vender o mesmo item (sem lucro infinito) e preços sensatos', () => {
  for (const id of Object.keys(VALOR)) { if (id === 'ficha') continue; assert.ok(precoCompra(id) > precoVenda(id), `${id}: compra ${precoCompra(id)} ≤ venda ${precoVenda(id)}`); }
  assert.ok(precoCompra('agua') <= 8, 'água cara demais'); assert.ok(precoCompra('kit') >= 10 && precoCompra('rifle') > precoCompra('pistola') && precoCompra('pistola') > precoCompra('faca'));
  assert.ok(6 >= precoCompra('agua'), 'as 6 fichas iniciais devem comprar ao menos 1 água');
  for (const id of ['ficha', 'radio', 'mochila', 'colete', 'municao', 'cartucho']) assert.ok(!vendavel(id), `${id} não pode ser vendido`);
});

// ================================================================ viagem de jipe (cena em canvas 2D, testada com um contexto falso)
function ctx2d() {
  const r = { n: 0, area: 0, naoInteiro: 0, alfaFora: 0, corRuim: 0, imagens: 0, sig: 0, minX: 1e9, minY: 1e9, maxX: -1e9, maxY: -1e9 }; let alfa = 1, cor = '#000000';
  const g = {
    imageSmoothingEnabled: true, globalCompositeOperation: 'source-over',
    get globalAlpha() { return alfa; }, set globalAlpha(v: number) { alfa = v; },
    get fillStyle() { return cor; }, set fillStyle(v: string) { cor = v; if (!/^#[0-9a-f]{6}$/.test(v)) r.corRuim++; },
    fillRect(x: number, y: number, w: number, h: number) {
      r.n++; r.area += w * h; if (![x, y, w, h].every(Number.isInteger)) r.naoInteiro++; if (!(alfa >= 0 && alfa <= 1)) r.alfaFora++;
      r.minX = Math.min(r.minX, x); r.minY = Math.min(r.minY, y); r.maxX = Math.max(r.maxX, x + w); r.maxY = Math.max(r.maxY, y + h);
      r.sig = (Math.imul(r.sig ^ (x * 73856093) ^ (y * 19349663) ^ (w * 83492791) ^ h, 16777619) ^ parseInt(cor.slice(1), 16)) | 0;
    },
    clearRect() { /* nada */ }, drawImage() { r.imagens++; },
  };
  return { g: g as unknown as CanvasRenderingContext2D, r };
}
/** Math.random determinístico durante o teste (a poeira e a fumaça usam sorteio) */
function semente<T>(fn: () => T): T { const orig = Math.random; let s = 12345; Math.random = () => { s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff; return s / 0x80000000; }; try { return fn(); } finally { Math.random = orig; } }
const CLIMAS_V: ClimaViagem[] = ['limpo', 'nublado', 'vento', 'chuva', 'tempestade', 'neblina', 'poeira', 'acida'];
const HORAS_V = [0, 4.5, 5.8, 6.7, 9, 12, 15.5, 18, 19.5, 21, 23.5];
teste('viagem: todo local tem seu marco (sprite da cidade) próprio, dentro do quadro de 128×112, de dia e de noite', () => {
  const vazio = ctx2d(); marco(vazio.g, 'nao_existe', 24, 96, 0, 0); const padrao = vazio.r.sig;
  for (const l of LOCAIS) for (const [t, noite] of [[0, 0], [1.7, 1], [3.3, 0.5]] as const) {
    const o = ctx2d(); marco(o.g, l.id, 24, 96, t, noite);
    assert.ok(o.r.n >= 12, `${l.id}: marco com poucos pedaços (${o.r.n})`); assert.notEqual(o.r.sig, padrao, `${l.id}: usa o marco genérico`);
    assert.ok(o.r.minX >= 0 && o.r.minY >= 0 && o.r.maxX <= 128 && o.r.maxY <= 112, `${l.id}: marco sai do quadro (${o.r.minX},${o.r.minY})–(${o.r.maxX},${o.r.maxY})`);
    assert.equal(o.r.naoInteiro, 0, `${l.id}: coordenadas fracionadas`); assert.equal(o.r.corRuim, 0, `${l.id}: cor inválida`);
    const sem = ctx2d(); marco(sem.g, l.id, 24, 96, t, noite, false); assert.ok(sem.r.n <= o.r.n, `${l.id}: sem rótulo não pode ter mais pedaços`);
  }
});
teste('viagem: a cena pinta o quadro inteiro, só com inteiros, cores e transparências válidas, em todo par de locais, hora e clima', () => semente(() => {
  const W_ = 190, H_ = 142; let cenas = 0;
  LOCAIS.forEach((a, ia) => LOCAIS.forEach((b, ib) => {
    if (a.id === b.id) return; const k = ia * 11 + ib, clima = CLIMAS_V[k % CLIMAS_V.length], hora = HORAS_V[(k * 3) % HORAS_V.length];
    const fora = ctx2d(), cena = criarCenaViagem({ de: a.id, para: b.id, hora, clima, seed: `t${k}`, w: W_, h: H_, total: 300, criar: () => ({ alvo: {} as CanvasImageSource, g: fora.g }) });
    for (const e of [{ t: 0, dist: 0, vel: 0, freio: false, p: 0, obstaculo: false }, { t: 3, dist: 150, vel: 1, freio: false, p: 0.5, obstaculo: false }, { t: 5, dist: 140, vel: 0.3, freio: true, p: 0.46, obstaculo: true }, { t: 9, dist: 330, vel: 0, freio: false, p: 1, obstaculo: false }]) {
      const o = ctx2d(); cena.desenhar(o.g, e, 1 / 30); cenas++; const rot = `${a.id}>${b.id} ${hora}h ${clima} d=${e.dist}`;
      assert.equal(o.r.naoInteiro, 0, `${rot}: retângulo com coordenada fracionada/NaN`); assert.equal(o.r.alfaFora, 0, `${rot}: transparência inválida`); assert.equal(o.r.corRuim, 0, `${rot}: cor inválida`);
      assert.ok(o.r.area >= W_ * H_, `${rot}: não cobre o quadro (área ${o.r.area})`); assert.ok(o.r.imagens >= 1, `${rot}: não desenhou o marco do destino`);
      assert.ok(o.r.minX >= -400 && o.r.maxX <= W_ + 400, `${rot}: pintou longe demais (${o.r.minX}..${o.r.maxX})`);
    }
  }));
  assert.ok(cenas >= 110 * 4, 'poucas cenas testadas');
}));
teste('viagem: a cena se mexe (estrada, jipe e paisagem mudam quando o jipe anda) e fica parada quando o jipe para; é determinística', () => {
  const mk = () => criarCenaViagem({ de: 'ermo', para: 'cidade', hora: 17, clima: 'limpo', seed: 'anim', w: 190, h: 142, total: 360 });
  type EV = { t: number; dist: number; vel: number; freio: boolean; p: number; obstaculo: boolean };
  /** um quadro de uma cena nova, com o sorteio reiniciado (a poeira usa Math.random) */
  const quadro = (e: EV) => semente(() => { const o = ctx2d(); mk().desenhar(o.g, e, 1 / 30); return o.r.sig; });
  const e0: EV = { t: 1, dist: 100, vel: 1, freio: false, p: 0.3, obstaculo: false };
  assert.equal(quadro(e0), quadro(e0), 'mesma entrada, mesmo quadro');
  const s1 = quadro(e0), s2 = quadro({ ...e0, t: 1.2, dist: 112 }), s3 = quadro({ ...e0, dist: 400, p: 0.9 }); assert.ok(s1 !== s2 && s2 !== s3 && s1 !== s3, 'a cena não anima com a distância');
  const parado: EV = { t: 2, dist: 100, vel: 0, freio: false, p: 0.3, obstaculo: false }; assert.equal(quadro(parado), quadro({ ...parado }), 'parado e com o mesmo tempo deve repetir');
  assert.notEqual(quadro(parado), quadro({ ...parado, obstaculo: true }), 'a barricada do evento precisa aparecer');
});
teste('viagem: céu e texto de placa — cores válidas em todas as horas; fonte 3×5 sem acento e sem quebrar com caracteres estranhos', () => {
  for (let h = 0; h < 24; h += 0.25) { const [a, b] = ceuEm(h); for (const c of [a, b]) assert.ok(Number.isInteger(c) && c >= 0 && c <= 0xffffff, `ceuEm(${h}) inválido: ${c}`); }
  const o = ctx2d(); texto(o.g, 'Pântano Tóxico 12 ☠ ?', 3, 3, 0xffffff); assert.ok(o.r.n > 20 && o.r.naoInteiro === 0); assert.equal(larguraTexto('ABC'), 11);
});

teste('viagem: a física da rota chega ao fim em todo passo de tempo, para diante do evento UMA vez (sem pular), fica parada enquanto o jogador decide e retoma', () => {
  const rodar = (dur: number, evento: boolean, dt: number) => {
    const r = { dur, evento }, e = novaRota(); let fase: FaseRota = 'indo', t = 0, meios = 0, fins = 0, pMeio = -1, velMeio = -1, tMeio = -1, pAnt = 0;
    for (let n = 0; n < 200000 && fins === 0; n++) {
      const a = passoRota(e, dt, r, fase); t += dt;
      assert.ok(e.vel >= 0 && e.vel <= 1.0001, `vel fora de [0,1]: ${e.vel}`); assert.ok(e.p >= pAnt && e.p <= 1, `p não monotônico: ${pAnt} → ${e.p}`); pAnt = e.p;
      if (a === 'meio') { meios++; pMeio = e.p; velMeio = e.vel; fase = 'evento'; tMeio = t; }
      if (fase === 'evento' && t - tMeio >= 3) fase = 'retomando';
      if (a === 'fim') { fins++; fase = 'chegando'; }
    }
    return { e, t, meios, fins, pMeio, velMeio };
  };
  for (const dur of [4.9, 6, 9]) for (const dt of [1 / 60, 1 / 30, 0.05, 0.4]) for (const evento of [false, true]) {
    const o = rodar(dur, evento, dt), rot = `dur ${dur} dt ${dt.toFixed(3)} ${evento ? 'com' : 'sem'} evento`;
    assert.equal(o.fins, 1, `${rot}: não chegou ao fim`); assert.equal(o.meios, evento ? 1 : 0, `${rot}: evento ${o.meios}x`); assert.equal(o.e.p, 1, `${rot}: p final`);
    assert.ok(o.t <= dur * 2.4 + (evento ? 8 : 3), `${rot}: demorou demais (${o.t.toFixed(1)} s)`); assert.ok(o.t >= dur * 0.9, `${rot}: rápido demais (${o.t.toFixed(1)} s)`);
    assert.ok(Math.abs(o.e.dist - distTotal(dur)) <= distTotal(dur) * 0.12, `${rot}: distância ${o.e.dist.toFixed(0)} longe de ${distTotal(dur)}`);
    if (evento) { assert.equal(o.velMeio, 0, `${rot}: não estava parado no evento`); assert.ok(o.pMeio >= P_PARADA - 0.12 && o.pMeio <= P_PARADA + 0.06, `${rot}: parou fora do lugar (p=${o.pMeio.toFixed(2)})`); }
  }
  // parado no evento: nada anda enquanto o jogador decide
  const e = novaRota(), r = { dur: 6, evento: true }; let fase: FaseRota = 'indo', avisos = 0; for (let n = 0; n < 4000 && avisos === 0; n++) if (passoRota(e, 1 / 30, r, fase) === 'meio') { avisos++; fase = 'evento'; }
  const p0 = e.p, d0 = e.dist; for (let n = 0; n < 900; n++) assert.equal(passoRota(e, 1 / 30, r, 'evento'), null); assert.equal(e.p, p0); assert.equal(e.dist, d0); assert.equal(e.vel, 0);
  // depois de chegar, o jipe para sozinho
  const f = novaRota(); let fa: FaseRota = 'indo'; for (let n = 0; n < 4000 && !f.fim; n++) if (passoRota(f, 1 / 30, { dur: 5, evento: false }, fa) === 'fim') fa = 'chegando'; for (let n = 0; n < 120; n++) passoRota(f, 1 / 30, { dur: 5, evento: false }, 'chegando'); assert.equal(f.vel, 0, 'o jipe deve parar na chegada');
});

// ================================================================ execução
let falhas = 0; const t0 = Date.now();
for (const c of casos) { try { c.fn(); console.log('  ok   ' + c.nome); } catch (e) { falhas++; console.log('  FALHA ' + c.nome + '\n        ' + String((e as Error).message).split('\n')[0]); } }
console.log(`\n${casos.length - falhas}/${casos.length} testes passaram em ${((Date.now() - t0) / 1000).toFixed(1)} s.`);
process.exitCode = falhas ? 1 : 0;
