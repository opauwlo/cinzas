// NPCs: quem aparece onde (determinístico por seed + dia), o que diz (contextual) e o que vende. PURO: roda em Node nos testes.
import { Rng } from '../lib/rng';
import { VALOR } from './balanco';
import { ITENS } from './itens';

export type TipoNpc = 'mascate' | 'acampado' | 'viajante';
export type NpcPlano = { tipo: TipoNpc; nome: string };
export const TIPOS_NPC: TipoNpc[] = ['mascate', 'acampado', 'viajante'];
export const ROTULO_NPC: Record<TipoNpc, string> = { mascate: 'Mascate', acampado: 'Sobrevivente', viajante: 'Viajante' };
const NOMES: Record<TipoNpc, string[]> = {
  mascate: ['Tião, o Mascate', 'Dona Cida', 'Zé das Fichas', 'Nando Mochila'],
  acampado: ['Dona Marlene', 'Seu Odair', 'Professora Lúcia', 'Cabo Reis'],
  viajante: ['Joana da Estrada', 'Beto Sem-Pressa', 'Irmã Clara', 'Capitão Duda'],
};
/** zonas onde ninguém fica de bobeira */
const SEM_NPC = ['abrigo7', 'militar'];

/** quais NPCs aparecem nesta zona neste dia. No abrigo o mascate passa a cada 3 dias. */
export function planejarNpcs(seed: string, zonaId: string, perigo: number, dia: number): NpcPlano[] {
  if (SEM_NPC.includes(zonaId)) return [];
  const rng = new Rng(`${seed}|npc|${zonaId}|${dia}`), nome = (t: TipoNpc) => rng.pick(NOMES[t]);
  if (zonaId === 'base') return dia % 3 === 0 ? [{ tipo: 'mascate', nome: nome('mascate') }] : [];
  const out: NpcPlano[] = [];
  if (zonaId !== 'pantano' && rng.chance(perigo >= 4 ? 0.2 : 0.35)) out.push({ tipo: 'mascate', nome: nome('mascate') });
  if (zonaId !== 'pantano' && rng.chance(0.55)) out.push({ tipo: 'acampado', nome: nome('acampado') });
  if (rng.chance(zonaId === 'pantano' ? 0.25 : 0.45)) out.push({ tipo: 'viajante', nome: nome('viajante') });
  return out;
}

// ---------------------------------------------------------------- falas
export type CtxFala = { hora: number; clima: string; objId: string; dia: number; nivel: number; zonaId: string; traiu: boolean; raidRecente: boolean };
const DICA_OBJ: Record<string, string[]> = {
  jipe: ['O Ermo é um bom começo: caixote, carro velho, pouca gente.', 'Pegue o jipe e vá ao Ermo. Sem pressa, mas sem enrolar.'],
  saque5: ['Geladeira, armário, porta-malas: tudo guarda alguma coisa.', 'Quem vasculha direito, come direito.'],
  madeira: ['Gravetos no chão rendem madeira. Árvore seca também, mas só com machado.', 'Madeira vira taco, kit de fogueira e bancada melhor.'],
  fabricar: ['Madeira, sucata e tecido na bancada fazem milagre.', 'Fabrique alguma coisa: curativo é o melhor começo.'],
  noite: ['À noite eles ficam mais ativos. Durma no abrigo, ou fique perto de luz.', 'Aguente até o amanhecer e a gente conversa de novo.'],
  nivel3: ['Cada coisa que você faz te deixa mais esperto. Escolha bem as habilidades.'],
  contrato: ['Abra o Diário: o rádio passa tarefa com pagamento.', 'Contrato cumprido é combustível e munição no bolso.'],
  melhoria: ['Muralha forte afasta visita. Melhore o abrigo na bancada.'],
  explorar3: ['Já foi à Floresta? Tem caça e madeira de sobra.', 'Descubra mais lugares no mapa: cada um tem seu tipo de saque.'], explorar6: ['O Hospital guarda remédio e o Posto guarda combustível. Vá preparado.'],
  comer: ['Não deixe a fome e a sede chegarem ao fim. Os atalhos de baixo usam água e comida.'], abater3: ['Deixe eles chegarem perto: seu personagem ataca sozinho.'], bichos: ['Cão, lobo, cervo, coelho: tudo vira carne. Leve uma faca para esfolar.'], cozinhar: ['Carne crua cozida na fogueira sacia o dobro.'], horta: ['Semente na horta rende legume em meio dia.'], machado: ['Madeira e sucata fazem um machado. Árvore vira lenha.'],
  nivel5: ['No nível 5 abrem o Hospital e o Pântano. Suba de nível com contratos e abates.'], nivel7: ['No nível 7 a Refinaria abre. Cuidado com o Colosso.'], nivel8: ['Nível 8 e o rádio: aí o Abrigo 7 abre.'], gangue: ['Os acampamentos têm baú, mas os saqueadores atiram. Vá com vida cheia.'], contratos2: ['Contrato cumprido é combustível e munição no bolso.'],
  radio: ['Tem uma Torre de Rádio ao norte do mapa... dizem que ainda guarda um rádio de campanha.', 'Procure a Torre de Rádio. O sinal do Abrigo 7 sai de um aparelho daquele.'],
  combustivel: ['Sem combustível, nem o Abrigo 7 você alcança. Junte oito.', 'Reservatório de água, posto, carro velho: combustível aparece onde menos se espera.'],
  abrigo7: ['O sinal vem do norte. Boa viagem... e boa sorte.'],
};
const CLIMA: Record<string, string> = { chuva: 'Essa chuva não para.', tempestade: 'Tempestade feia. Fique longe de árvore alta.', neblina: 'Com essa neblina dá pra tropeçar em qualquer coisa.', poeira: 'Poeira pra todo lado... cubra o rosto.', acida: 'Chuva ácida! Procure abrigo.', vento: 'Esse vento anda zangado hoje.' };
const RUMORES = ['Dizem que tem um Colosso rondando por aí. Não tente enfrentar de perto.', 'Os Filhos do Cinza brilham no escuro. Não ligue pro brilho, ligue pro machado.', 'Ouvi falar de suprimentos caindo do céu, de vez em quando. Siga a fumaça vermelha.', 'Os saqueadores vigiam os acampamentos de noite. De dia dormem mais.', 'Água de reservatório é boa. Água de pântano... nem pense.', 'Quem fica muito tempo fora do abrigo volta e encontra o baú mais leve.', 'Corredor não se vence de costas: vire e bata primeiro.', 'Pistola atrai tudo. Se puder, resolva em silêncio.'];
const SAUDACAO = ['Ei, tudo bem?', 'Opa. Ainda vivo, pelo visto.', 'Chegue, chegue. Aqui é seguro (por enquanto).', 'Que bom ver alguém inteiro.'];

/** uma fala contextual: saudação + (clima) + dica do objetivo atual + rumor; o acampado sempre dá a dica do objetivo */
export function falaDe(tipo: TipoNpc, c: CtxFala, rng: Rng): string {
  if (c.traiu && tipo === 'mascate') return 'Soube o que você fez com gente por aí. Comigo você não negocia mais.';
  const noite = c.hora >= 20 || c.hora < 5, partes: string[] = [];
  partes.push(c.raidRecente ? 'Ouvi tiros do lado do seu abrigo...' : noite ? 'Noite braba. Cuidado lá fora.' : rng.pick(SAUDACAO));
  if (CLIMA[c.clima] && rng.chance(0.6)) partes.push(CLIMA[c.clima]);
  const dica = DICA_OBJ[c.objId];
  if (dica && (tipo === 'acampado' || rng.chance(0.55))) partes.push(rng.pick(dica));
  else partes.push(rng.pick(RUMORES));
  return partes.join(' ');
}

// ---------------------------------------------------------------- mascate: estoque e troca
const BASICOS = ['agua', 'enlatado', 'bandagem', 'municao'];
const POOL: [string, number][] = [['kit', 3], ['antirrad', 3], ['bateria', 3], ['alcool', 3], ['cartucho', 2], ['garrafa', 3], ['tecido', 3], ['sucata', 3], ['madeira', 3], ['faca', 2], ['taco', 2], ['lanterna', 2], ['combustivel', 2], ['machado', 1], ['mascara', 1], ['pao', 3], ['legume', 2]];
export type Oferta = { item: string; q: number };
/** 8 ofertas: 4 básicas (sempre) + 4 sorteadas; combustível no máx. 1; tudo existe e tem valor */
export function estoqueMascate(rng: Rng, dia: number): Oferta[] {
  const out: Oferta[] = BASICOS.map(item => ({ item, q: rng.int(2, 5) })), tem = new Set(BASICOS), pool = POOL.filter(([id]) => ITENS[id] && (VALOR[id] ?? 0) > 0);
  while (out.length < 8) { const id = rng.peso(pool); if (tem.has(id)) continue; tem.add(id); out.push({ item: id, q: id === 'combustivel' ? 1 : id === 'machado' || id === 'mascara' ? 1 : rng.int(1, 3 + (dia > 6 ? 1 : 0)) }); }
  return out;
}
/** itens que o jogador pode vender: têm valor, não são essenciais da campanha nem vestidos */
export const vendavel = (id: string) => !!ITENS[id] && (VALOR[id] ?? 0) > 0 && !['ficha', 'radio', 'mochila', 'colete', 'agua_suja'].includes(id) && ITENS[id].tipo !== 'municao';
