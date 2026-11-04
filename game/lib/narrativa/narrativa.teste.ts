import { teste, assert } from '../../../tools/testes/harness';
import { LOCAIS } from '../../dados/locais';
import { OBJETIVOS } from '../../dados/objetivos';
import { novoMundo } from '../../nucleo/index';
import type { Genero } from '../../nucleo/contratos';
import {
  PT, EN, PENDENTES_EN, LIMITES, TRANSMISSOES, FAROL_SEMANA, ALEGACOES, PERSONAGENS, FITAS, FITAS_ESBOCO, BILHETES, PASSOS, FALAS_NPC_PROPOSTA,
  CENA_640_ATO1, CENAS, roteiroCena, telaMorte, causaDe, paginaCadernoLia, tossiuNoDia, telasAbertura, tradutor, formatar, pseudoLocalizar,
  comprimento, localizarTransmissao, novaNarrativa, farolDoDia,
} from './index';
import { ENTRADAS } from './catalogo';
import { TEXTO_DO_MUNDO } from './tipos';
import { PSEUDO_FATOR } from './i18n';

const VARS = { n: 3, a: 4, b: 11 };
const GENEROS: Genero[] = ['o', 'a'];
const locais = new Set(LOCAIS.map(l => l.id));
const tipo = new Map(ENTRADAS.map(e => [e.chave, e.tipo]));

teste('narrativa: todo texto cabe no limite do tipo (§5.3), nos dois gêneros, em pt e no en que já existe', () => {
  for (const [idioma, cat] of [['pt', PT], ['en', EN]] as const)
    for (const [k, v] of Object.entries(cat)) for (const g of GENEROS) {
      const s = formatar(v, VARS, g, idioma), lim = LIMITES[tipo.get(k)!];
      assert.ok(comprimento(s) <= lim, `${idioma} ${k} (${tipo.get(k)}) tem ${comprimento(s)} > ${lim}: "${s}"`);
    }
  // os números do §5.3 viram asserção, para ninguém afrouxar sem querer
  assert.deepEqual([LIMITES.radio, LIMITES.evento, LIMITES.opcao, LIMITES.bilhete, LIMITES.abertura, LIMITES.pensamento], [160, 140, 28, 300, 150, 60]);
});

teste('narrativa: nenhuma palavra de interface no texto do mundo (nível, XP, Diário, atalho, HUD)', () => {
  const pt = /(?<!\p{L})(n[íi]vel|n[íi]veis|xp|di[áa]rio|atalhos?|hud)(?!\p{L})/iu, en = /(?<!\p{L})(levels?|xp|hud|journal|shortcuts?|quest log)(?!\p{L})/iu;
  for (const e of ENTRADAS) if (TEXTO_DO_MUNDO.has(e.tipo)) {
    assert.ok(!pt.test(e.pt), `pt ${e.chave}: "${e.pt}"`);
    if (EN[e.chave]) assert.ok(!en.test(EN[e.chave]), `en ${e.chave}: "${EN[e.chave]}"`);
  }
  // e a interface continua honesta: o requisito diz "nível" quando o sistema mede nível
  assert.ok(PASSOS.find(p => p.id === 'nivel3')!.requisito.includes('nível 3'));
});

teste('narrativa: toda alegação é verificável, sustentada por uma fala exata e aponta para um local que existe', () => {
  assert.ok(TRANSMISSOES.length >= 12, `${TRANSMISSOES.length} transmissões`);
  const ids = new Set<string>(), vistas = new Map<string, unknown>();
  for (const t of TRANSMISSOES) {
    assert.ok(!ids.has(t.id), `transmissão repetida ${t.id}`); ids.add(t.id);
    assert.equal(t.autoria, 'rascunho-ia'); assert.ok(t.atos.some(a => a === 1 || a === 2), `${t.id} fora dos Atos I–II`);
    assert.ok(t.alegacoes.length >= 1, `${t.id} sem alegação`);
    for (const f of t.falas) if (f.alegacao) assert.ok(t.alegacoes.some(a => a.id === f.alegacao), `${t.id}: fala aponta ${f.alegacao}, que não está na lista`);
    for (const a of t.alegacoes) {
      assert.ok(a.comoVerificar.length >= 1 && a.real.trim().length > 10 && ['verdade', 'falso', 'meia'].includes(a.verdade), `${a.id} sem caminho de verificação`);
      if (a.local) assert.ok(locais.has(a.local), `${a.id}: local ${a.local} não existe`);
      assert.ok(t.falas.some(f => f.alegacao === a.id && f.texto.includes(a.disseram)), `${t.id}: ninguém diz "${a.disseram}" (${a.id})`);
      if (vistas.has(a.id)) assert.deepEqual(a, vistas.get(a.id), `${a.id} com duas versões`); vistas.set(a.id, a);
    }
  }
  assert.equal(vistas.size, Object.keys(ALEGACOES).length, 'toda alegação do catálogo vai ao ar');
  // em inglês, a frase da ficha continua sendo um pedaço da fala (onde as duas já estão traduzidas)
  const t = tradutor('en');
  for (const tr of TRANSMISSOES.map(x => localizarTransmissao(x, t))) for (const a of tr.alegacoes) {
    if (!EN[`al.${a.id}.disseram`]) continue;
    tr.falas.forEach((f, i) => { if (f.alegacao === a.id && EN[`tr.${tr.id}.${i}`]) assert.ok(f.texto.includes(a.disseram), `en ${tr.id}.${i} não contém "${a.disseram}"`); });
  }
});

teste('narrativa: cada voz tem a sua técnica — Farol em loop de 7 dias, PX honesta, prazo falso dos Saqueadores, autoridade da Milícia', () => {
  assert.equal(FAROL_SEMANA.length, 7);
  for (const f of FAROL_SEMANA) {
    assert.equal(f.minuto, 400); assert.equal(f.frequencia, '107,7 FM');
    assert.equal(f.falas[0].efeito, 'vinheta_falha'); assert.equal(f.falas.at(-1)!.efeito, 'vinheta_falha', 'a vinheta falha no mesmo lugar, todo dia');
    assert.ok(f.alegacoes.some(a => a.id === 'farol-tem-medico') && f.alegacoes.some(a => a.id === 'farol-tem-lugar'), 'toda manhã diz "tem médico" e "tem lugar"');
  }
  assert.equal(FAROL_SEMANA.filter(f => f.falas.some(x => x.texto.includes('(tosse)'))).length, 1, 'a tosse é um dia só da semana');
  assert.equal(farolDoDia(1).id, farolDoDia(8).id); assert.notEqual(farolDoDia(1).id, farolDoDia(2).id);
  const de = (e: string) => TRANSMISSOES.filter(t => t.emissor === e);
  assert.ok(de('px').length >= 1 && de('px').every(t => t.tecnica === 'nenhuma' && t.alegacoes.every(a => a.verdade === 'verdade')), 'a rede PX não mente');
  assert.ok(de('saqueadores').some(t => t.alegacoes.some(a => a.tipo === 'prazo' && a.verdade === 'falso' && a.comoVerificar.includes('tempo'))));
  assert.ok(de('milicia').some(t => t.tecnica === 'autoridade'));
  assert.ok(de('filhos').some(t => t.tecnica === 'pertencimento') && de('filhos').some(t => t.falas.some(f => f.efeito === 'interferencia')));
});

teste('narrativa: toda chave pt tem inglês ou está na lista de pendentes (e em só uma das duas)', () => {
  const pend = new Set(PENDENTES_EN);
  for (const k of Object.keys(PT)) assert.ok((k in EN) !== pend.has(k), `${k}: ${k in EN ? 'traduzida e pendente' : 'sem tradução e fora dos pendentes'}`);
  for (const k of [...Object.keys(EN), ...pend]) assert.ok(k in PT, `${k} não existe no português`);
  assert.equal(pend.size, PENDENTES_EN.length, 'pendente repetido');
});

teste('narrativa: {o|a} resolve nos dois gêneros, plural segue o idioma e nada fica sem resolver', () => {
  assert.equal(formatar('{O|A} Cris chegou cansad{o|a}.', {}, 'o'), 'O Cris chegou cansado.');
  assert.equal(formatar('{O|A} Cris chegou cansad{o|a}.', {}, 'a'), 'A Cris chegou cansada.');
  assert.equal(formatar('{o|a}', { g: 'a' }, 'o'), 'a', 'vars.g manda mais que o padrão');
  const pt = tradutor('pt', 'a'), en = tradutor('en', 'o');
  assert.ok(pt('bilhete.plantao.texto').includes('A Cris deve estar na moto') && tradutor('pt', 'o')('bilhete.plantao.texto').includes('O Cris deve estar'));
  assert.equal(pt('passo.nivel3.titulo'), 'Pronta pra estrada'); assert.equal(tradutor('pt', 'o')('passo.nivel3.titulo'), 'Pronto pra estrada');
  assert.equal(pt('morte.contagem', { n: 1 }), 'Já contei essa parte errado uma vez.'); assert.equal(pt('morte.contagem', { n: 3 }), 'Já contei essa parte errado 3 vezes.');
  assert.equal(en('morte.contagem', { n: 1 }), 'I\'ve told this part wrong once.'); assert.equal(en('morte.contagem', { n: 2 }), 'I\'ve told this part wrong 2 times.');
  assert.ok(en('bilhete.plantao.texto').includes('Cris'), 'chave sem inglês cai no português, nunca em branco');
  for (const [idioma, cat] of [['pt', PT], ['en', EN]] as const) for (const [k, v] of Object.entries(cat)) for (const g of GENEROS)
    assert.ok(!/[{}]/.test(formatar(v, VARS, g, idioma)), `${idioma} ${k} sobrou marca: ${formatar(v, VARS, g, idioma)}`);
});

teste('narrativa: pseudo-localização alonga ~30%, preserva as marcas e cabe na caixa (limite × 1,3)', () => {
  assert.ok(pseudoLocalizar('{n:uma lata|# latas} na mesa').includes('{n:uma lata|# latas}'));
  const p = tradutor('pt', 'a', true);
  assert.ok(p('abertura.1').startsWith('⟦') && p('abertura.1').endsWith('⟧'));
  for (const e of ENTRADAS) {
    const s = formatar(e.pt, VARS, 'a'), ps = pseudoLocalizar(s), n = comprimento(s), caixa = Math.ceil(LIMITES[e.tipo] * PSEUDO_FATOR) + 2;
    if (n >= 10) assert.ok(comprimento(ps) >= n * 1.25 && comprimento(ps) <= n * 1.4 + 2, `${e.chave}: ${n} → ${comprimento(ps)}`);
    assert.ok(comprimento(ps) <= caixa, `${e.chave}: pseudo ${comprimento(ps)} > caixa ${caixa}`);
  }
});

teste('narrativa: os 25 passos cobrem a campanha atual, o requisito bate com a meta do sistema e "oito" virou dez', () => {
  assert.equal(PASSOS.length, 25);
  const ids = PASSOS.map(p => p.id);
  for (const o of OBJETIVOS) assert.ok(ids.includes(o.id), `passo ${o.id} sem texto`);
  assert.deepEqual(ids.filter(id => !OBJETIVOS.some(o => o.id === id)), ['militar'], 'só um passo novo');
  for (let i = 1; i < PASSOS.length; i++) assert.ok(PASSOS[i].ato >= PASSOS[i - 1].ato, 'atos em ordem');
  assert.equal(PASSOS.findIndex(p => p.id === 'radio'), 20, 'rádio no fim do Ato III');
  for (const p of PASSOS) {
    assert.equal(p.autoria, 'rascunho-ia');
    const o = OBJETIVOS.find(x => x.id === p.id);
    if (o && o.meta > 1) assert.ok(new RegExp(`(?<!\\d)${o.meta}(?!\\d)`).test(p.requisito), `${p.id}: requisito "${p.requisito}" não diz ${o.meta}`);
  }
  assert.ok(FALAS_NPC_PROPOSTA.combustivel.join(' ').includes('dez') && !FALAS_NPC_PROPOSTA.combustivel.join(' ').includes('oito'));
  assert.equal(new Set(PASSOS.map(p => p.titulo)).size, 25, 'títulos únicos');
});

teste('narrativa: cena das 6h40 para na escolha, cada tom fecha com registro, e o rádio do meio é a Farol do dia', () => {
  const t = tradutor('pt', 'a'), ate = roteiroCena(CENA_640_ATO1, t), ultimo = ate.at(-1)!;
  assert.equal(ultimo.tipo, 'escolha');
  if (ultimo.tipo === 'escolha') assert.deepEqual(ultimo.opcoes.map(o => o.tom), ['verdade', 'protecao', 'silencio']);
  const radio = ate.find(p => p.tipo === 'radio');
  assert.ok(radio && radio.tipo === 'radio' && radio.farolDoDia && radio.interferencias.every(id => TRANSMISSOES.some(x => x.id === id)));
  for (const tom of ['verdade', 'protecao', 'silencio'] as const) {
    const fim = roteiroCena(CENA_640_ATO1, t, tom, 9).at(-1)!;
    assert.ok(fim.tipo === 'fim' && fim.registro.tom === tom && fim.registro.dia === 9 && fim.registro.verdade.length > 0);
  }
  assert.ok(CENAS.every(c => c.autoria === 'rascunho-ia'));
});

teste('narrativa: tela de morte "Não foi assim", variante Calmo e reconhecimento do que você já sabe', () => {
  const t = tradutor('pt', 'o');
  assert.equal(telaMorte(t, { dif: 0, causa: 'Morreu de sede', mortes: 1 }).titulo, 'DE VOLTA AO ABRIGO');
  const m = telaMorte(t, { dif: 2, causa: 'Envenenado pela radiação', mortes: 3, sabe: ['loop', 'caminhao'] });
  assert.equal(m.titulo, 'NÃO FOI ASSIM'); assert.equal(m.botao, 'Contar de novo');
  assert.ok(m.linhas.some(l => l.includes('brilho')) && m.linhas.some(l => l.includes('2 vezes')) && m.linhas.some(l => l.includes('caminhão')));
  assert.deepEqual(['Morreu de sede', 'Morreu de fome', 'Sangrou até a morte', 'Envenenado pela radiação', 'Morto por criaturas do ermo', '???'].map(causaDe), ['sede', 'fome', 'sangue', 'radiacao', 'criaturas', 'outra']);
  assert.equal(telaMorte(t, { dif: 1, causa: 'x', mortes: 1 }).linhas.length, 2, 'primeira morte: sem contagem');
});

teste('narrativa: o caderno da Lia só mostra o loop se ela ouviu de verdade a tosse em dois dias', () => {
  const t = tradutor('pt');
  assert.ok(tossiuNoDia(4) && tossiuNoDia(11) && !tossiuNoDia(5));
  const com = paginaCadernoLia(t, { ato: 2, diasOuvidos: [3, 4, 9, 11], escolhas: [{ escolha: 'lia1', tom: 'protecao' }] });
  assert.ok(com.includes('Dia 4: tosse. Dia 11: tosse. IGUAL.') && com.includes('Cris disse: viu. ✓'));
  const sem = paginaCadernoLia(t, { ato: 2, diasOuvidos: [1, 2, 3], escolhas: [] });
  assert.ok(!sem.some(l => l.includes('IGUAL')), 'a pista não aparece sem ter acontecido');
  for (const l of [...com, ...sem]) assert.ok(comprimento(l) <= LIMITES.pensamento);
});

teste('narrativa: o módulo registra as 6h40 ouvidas, a escolha da Lia e sobrevive ao save', () => {
  const n = novaNarrativa(), m = novoMundo(), t = tradutor('pt');
  m.zona.id = 'base'; m.minutos = 2 * 1440 + 6 * 60; m.dia = 3; m.hora = 6; n.iniciar(m);
  m.minutos += 45; m.hora = 6.75; n.tick(0.016, m);
  assert.deepEqual(n.estado().diasOuvidos, [3]);
  m.minutos += 1440 * 2; m.dia = 5; n.tick(0.016, m); // dormiu: o relógio pulou dois dias
  assert.deepEqual(n.estado().diasOuvidos, [3, 4, 5], 'a Lia ouviu também o dia em que Cris dormiu');
  assert.equal(n.cenaPendente(m, false), null, 'antes do fim do Ato I, nada');
  assert.equal(n.cenaPendente(m, true)?.id, CENA_640_ATO1.id);
  const r = n.escolher(CENA_640_ATO1.id, 'silencio', 5, t); assert.equal(r.disse, '(nada)');
  assert.equal(n.cenaPendente(m, true), null, 'a cena é uma vez só');
  const outra = novaNarrativa(); outra.carregar(JSON.parse(JSON.stringify(n.salvar())));
  assert.deepEqual(outra.oQueVoceDisse(tradutor('en')).map(x => x.disse), ['(nothing)']);
  outra.carregar(undefined); assert.equal(outra.estado().escolhas.length, 0);
});

teste('narrativa: elenco, fitas, bilhetes e abertura completos, tudo marcado como rascunho de IA', () => {
  for (const id of ['cris', 'lia', 'iris', 'reis', 'lume', 'cida', 'socorro']) assert.ok(PERSONAGENS.some(p => p.id === id), `falta ${id}`);
  assert.deepEqual(FITAS.map(f => f.n), [1, 2, 3, 4, 5, 6, 7]); assert.ok(FITAS.filter(f => !FITAS_ESBOCO.has(f.id)).length >= 3);
  for (const f of FITAS) assert.ok(locais.has(f.local), `fita ${f.id} em local inexistente`);
  assert.ok(BILHETES.length >= 12 && BILHETES.filter(b => b.ancora).length >= 6);
  for (const b of BILHETES) { if (b.ancora) assert.ok(b.local && locais.has(b.local), `âncora ${b.id} sem local válido`); }
  assert.ok(!BILHETES.some(b => /fabrique|suba de|cama melhor/i.test(b.texto)), 'bilhete não é manual');
  const abre = telasAbertura(tradutor('pt')); assert.equal(abre.length, 6); assert.equal(abre[0], 'Deixa eu contar do começo.');
  for (const x of [...PERSONAGENS, ...FITAS, ...BILHETES]) assert.equal(x.autoria, 'rascunho-ia');
});

teste('narrativa: sensibilidade — sem nome de vítima real do Césio-137 e a Lia nunca morre no texto', () => {
  const tudo = Object.values(PT).join('\n') + Object.values(EN).join('\n');
  for (const nome of ['Leide', 'Maria Gabriela', 'Israel Baptista', 'Admilson', 'Césio', 'Goiânia']) assert.ok(!tudo.includes(nome), nome);
  assert.ok(!/Lia (morreu|morre|morta)|Lia (died|dies|is dead)/i.test(tudo));
});
