// Arquétipos de criaturas: estatísticas, IA, clipes e gerador de receita (biblioteca procedural). Criar criatura nova = uma entrada.
import { Rng } from '../lib/rng';
import { gerarHumano, type RecHumano } from '../lib/humano';
import { gerarQuad, gerarInseto, gerarAve, type RecQuad } from '../lib/fauna';

export type IA = 'cambalear' | 'matilha' | 'passivo' | 'ranged' | 'melee_humano' | 'colosso' | 'voo' | 'inseto' | 'npc';
export type Clipes = { parado: string; andar: string; correr?: string; golpear: string; morrer: string; dano: string };
export type Arq = {
  id: string; nome: string; modelo: 'humano' | 'quad' | 'inseto' | 'ave'; ia: IA; hostil: boolean;
  hp: number; vel: number; corre: number; dano: number; alcance: number; cd: number; raio: number; visao: number; xp: number;
  clipes: Clipes; voz: string; drops: [string, number, number, number][]; grande?: boolean;
  rec: (rng: Rng, faccao?: number) => object;
};
const HUM: Clipes = { parado: 'parado', andar: 'andar', correr: 'correr', golpear: 'golpear', morrer: 'morrer', dano: 'dano' };
const ZUM: Clipes = { parado: 'parado', andar: 'cambalear', correr: 'cambalear', golpear: 'golpear', morrer: 'morrer', dano: 'dano' };
const QUA: Clipes = { parado: 'parado', andar: 'andar', correr: 'correr', golpear: 'morder', morrer: 'morrer', dano: 'dano' };
const INS: Clipes = { parado: 'parado', andar: 'andar', golpear: 'atacar', morrer: 'morrer', dano: 'dano' };
const AVE: Clipes = { parado: 'pousado', andar: 'pousado', correr: 'voar', golpear: 'pousado', morrer: 'morrer', dano: 'dano' };

export const FACCOES = [
  { id: 0, nome: 'Saqueadores', cor: 0xb5471f, arq: 'saqueador' },
  { id: 1, nome: 'Filhos do Cinza', cor: 0xb6ff5a, arq: 'filho' },
  { id: 2, nome: 'Milícia Velha', cor: 0x6a7a4a, arq: 'miliciano' },
] as const;

export const ARQS: Record<string, Arq> = {
  irradiado: { id: 'irradiado', nome: 'Irradiado', modelo: 'humano', ia: 'cambalear', hostil: true, hp: 45, vel: 0.8, corre: 1.3, dano: 10, alcance: 0.9, cd: 1.2, raio: 0.32, visao: 8, xp: 8, clipes: ZUM, voz: 'zumbi', drops: [['tecido', 0.3, 1, 2], ['bandagem', 0.05, 1, 1], ['sucata', 0.1, 1, 1]], rec: r => gerarHumano(r, 'irradiado') },
  corredor: { id: 'corredor', nome: 'Corredor', modelo: 'humano', ia: 'cambalear', hostil: true, hp: 30, vel: 1.2, corre: 3.3, dano: 10, alcance: 0.9, cd: 0.8, raio: 0.3, visao: 11, xp: 12, clipes: { ...ZUM, andar: 'cambalear', correr: 'correr' }, voz: 'corredor', drops: [['tecido', 0.3, 1, 1]], rec: r => { const x = gerarHumano(r, 'irradiado'); x.corpo = 'magro'; x.falta = x.falta.filter(f => !f.startsWith('perna')); return x; } },
  rastejador: { id: 'rastejador', nome: 'Rastejador', modelo: 'humano', ia: 'cambalear', hostil: true, hp: 28, vel: 0.55, corre: 1, dano: 14, alcance: 0.9, cd: 1.1, raio: 0.3, visao: 7, xp: 10, clipes: { ...ZUM, andar: 'rastejar', correr: 'rastejar' }, voz: 'zumbi', drops: [['tecido', 0.2, 1, 1]], rec: r => gerarHumano(r, 'rastejador') },
  colosso: { id: 'colosso', nome: 'Colosso', modelo: 'humano', ia: 'colosso', hostil: true, hp: 420, vel: 0.75, corre: 1.5, dano: 42, alcance: 2.3, cd: 2.4, raio: 0.9, visao: 12, xp: 120, grande: true, clipes: { parado: 'parado', andar: 'pesado', correr: 'pesado', golpear: 'pancada', morrer: 'morrer', dano: 'dano' }, voz: 'colosso', drops: [['kit', 0.8, 1, 1], ['antirrad', 0.7, 1, 2], ['eletronico', 0.8, 2, 3], ['sucata', 1, 3, 5]], rec: r => gerarHumano(r, 'colosso') },
  saqueador: { id: 'saqueador', nome: 'Saqueador', modelo: 'humano', ia: 'ranged', hostil: true, hp: 58, vel: 1.7, corre: 3.1, dano: 16, alcance: 1.5, cd: 1.2, raio: 0.32, visao: 11, xp: 20, clipes: HUM, voz: 'humano', drops: [['municao', 0.45, 1, 1], ['cartucho', 0.2, 1, 1], ['bandagem', 0.3, 1, 1], ['enlatado', 0.3, 1, 1], ['sucata', 0.4, 1, 2]], rec: (r, f) => gerarHumano(r, 'saqueador', { faccao: f }) },
  filho: { id: 'filho', nome: 'Filho do Cinza', modelo: 'humano', ia: 'melee_humano', hostil: true, hp: 50, vel: 1.8, corre: 3.3, dano: 14, alcance: 1.5, cd: 1, raio: 0.32, visao: 10, xp: 20, clipes: HUM, voz: 'humano', drops: [['antirrad', 0.2, 1, 1], ['tecido', 0.4, 1, 2], ['alcool', 0.3, 1, 1]], rec: r => gerarHumano(r, 'filho') },
  miliciano: { id: 'miliciano', nome: 'Miliciano', modelo: 'humano', ia: 'ranged', hostil: true, hp: 85, vel: 1.6, corre: 2.8, dano: 18, alcance: 1.4, cd: 1.0, raio: 0.34, visao: 13, xp: 30, clipes: HUM, voz: 'humano', drops: [['municao', 0.6, 2, 3], ['kit', 0.2, 1, 1], ['rifle', 0.04, 1, 1], ['mascara', 0.06, 1, 1]], rec: r => gerarHumano(r, 'miliciano') },
  cao: { id: 'cao', nome: 'Cão mutante', modelo: 'quad', ia: 'matilha', hostil: true, hp: 26, vel: 2.2, corre: 4.4, dano: 7, alcance: 0.85, cd: 0.9, raio: 0.3, visao: 11, xp: 7, clipes: QUA, voz: 'cao', drops: [['carne_crua', 0.5, 1, 1]], rec: r => gerarQuad(r, 'cao') },
  lobo: { id: 'lobo', nome: 'Lobo faminto', modelo: 'quad', ia: 'matilha', hostil: true, hp: 34, vel: 2.4, corre: 4.8, dano: 9, alcance: 0.9, cd: 1, raio: 0.32, visao: 12, xp: 12, clipes: QUA, voz: 'cao', drops: [['carne_crua', 0.7, 1, 2]], rec: r => gerarQuad(r, 'lobo') },
  javali: { id: 'javali', nome: 'Javali irradiado', modelo: 'quad', ia: 'matilha', hostil: true, hp: 70, vel: 1.4, corre: 4.2, dano: 14, alcance: 0.95, cd: 1.2, raio: 0.38, visao: 7, xp: 16, clipes: QUA, voz: 'javali', drops: [['carne_crua', 0.9, 2, 3]], rec: r => gerarQuad(r, 'javali', { hostil: true }) },
  cervo: { id: 'cervo', nome: 'Cervo mutante', modelo: 'quad', ia: 'passivo', hostil: false, hp: 30, vel: 1.2, corre: 5, dano: 0, alcance: 0, cd: 1, raio: 0.36, visao: 9, xp: 6, clipes: QUA, voz: 'cervo', drops: [['carne_crua', 1, 2, 3]], rec: r => gerarQuad(r, 'cervo', { hostil: false }) },
  coelho: { id: 'coelho', nome: 'Coelho', modelo: 'quad', ia: 'passivo', hostil: false, hp: 8, vel: 1.2, corre: 4.4, dano: 0, alcance: 0, cd: 1, raio: 0.2, visao: 8, xp: 3, clipes: QUA, voz: 'rato', drops: [['carne_crua', 1, 1, 1]], rec: r => gerarQuad(r, 'coelho', { hostil: false }) },
  rato: { id: 'rato', nome: 'Rato gigante', modelo: 'quad', ia: 'matilha', hostil: true, hp: 8, vel: 2, corre: 3.2, dano: 3, alcance: 0.6, cd: 0.7, raio: 0.2, visao: 6, xp: 2, clipes: QUA, voz: 'rato', drops: [['carne_crua', 0.2, 1, 1]], rec: r => gerarQuad(r, 'rato') },
  barata: { id: 'barata', nome: 'Barata gigante', modelo: 'inseto', ia: 'inseto', hostil: true, hp: 6, vel: 1.8, corre: 3, dano: 2, alcance: 0.5, cd: 0.8, raio: 0.18, visao: 5, xp: 2, clipes: INS, voz: 'inseto', drops: [], rec: r => gerarInseto(r, 'barata') },
  escorpiao: { id: 'escorpiao', nome: 'Escorpião mutante', modelo: 'inseto', ia: 'inseto', hostil: true, hp: 24, vel: 1.4, corre: 2.6, dano: 14, alcance: 0.8, cd: 1.1, raio: 0.26, visao: 6, xp: 10, clipes: INS, voz: 'inseto', drops: [['antirrad', 0.04, 1, 1]], rec: r => gerarInseto(r, 'escorpiao') },
  aranha: { id: 'aranha', nome: 'Aranha gigante', modelo: 'inseto', ia: 'inseto', hostil: true, hp: 32, vel: 1.9, corre: 3.4, dano: 11, alcance: 0.85, cd: 0.9, raio: 0.3, visao: 8, xp: 12, clipes: INS, voz: 'inseto', drops: [['tecido', 0.4, 1, 2]], rec: r => gerarInseto(r, 'aranha') },
  corvo: { id: 'corvo', nome: 'Corvo', modelo: 'ave', ia: 'voo', hostil: false, hp: 5, vel: 0.6, corre: 5, dano: 0, alcance: 0, cd: 1, raio: 0.15, visao: 6, xp: 0, clipes: AVE, voz: 'corvo', drops: [], rec: r => gerarAve(r) },
  npc_mascate: { id: 'npc_mascate', nome: 'Mascate', modelo: 'humano', ia: 'npc', hostil: false, hp: 70, vel: 1, corre: 3.6, dano: 0, alcance: 0, cd: 1, raio: 0.32, visao: 9, xp: 0, clipes: HUM, voz: 'humano', drops: [['ficha', 1, 3, 8], ['enlatado', 0.6, 1, 2], ['bandagem', 0.5, 1, 2]], rec: r => ({ ...gerarHumano(r, 'sobrevivente'), moch: 'grande', arma: undefined }) },
  npc_acampado: { id: 'npc_acampado', nome: 'Sobrevivente', modelo: 'humano', ia: 'npc', hostil: false, hp: 60, vel: 0.9, corre: 3.4, dano: 0, alcance: 0, cd: 1, raio: 0.32, visao: 9, xp: 0, clipes: HUM, voz: 'humano', drops: [['ficha', 0.7, 1, 4], ['enlatado', 0.5, 1, 1]], rec: r => ({ ...gerarHumano(r, 'sobrevivente'), arma: undefined }) },
  npc_viajante: { id: 'npc_viajante', nome: 'Viajante', modelo: 'humano', ia: 'npc', hostil: false, hp: 60, vel: 1.2, corre: 3.8, dano: 0, alcance: 0, cd: 1, raio: 0.32, visao: 9, xp: 0, clipes: HUM, voz: 'humano', drops: [['ficha', 0.6, 1, 3], ['agua', 0.4, 1, 1]], rec: r => ({ ...gerarHumano(r, 'sobrevivente'), moch: 'pequena', arma: r.chance(0.4) ? 'pe_de_cabra' : undefined }) },
};
export const arqDe = (id: string) => ARQS[id] ?? ARQS.irradiado;
export type { RecHumano, RecQuad };

/** tamanho do grupo ao gerar */
export const GRUPO: Record<string, [number, number]> = { irradiado: [2, 5], corredor: [1, 2], rastejador: [1, 2], colosso: [1, 1], cao: [2, 4], lobo: [2, 4], javali: [1, 2], cervo: [1, 3], coelho: [2, 3], rato: [3, 6], barata: [3, 6], escorpiao: [1, 3], aranha: [1, 2], corvo: [1, 3], saqueador: [1, 1], filho: [1, 1], miliciano: [1, 1] };
