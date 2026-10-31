// Campanha em 3 atos: cada objetivo ensina uma parte do jogo, mostra progresso numérico (ex.: 3/5), aponta um local quando faz sentido
// e paga XP (e às vezes itens). Criar um objetivo novo = uma entrada; o fim da lista é a vitória.
import type { Run } from '../sistemas/salvar';

export type Objetivo = {
  id: string; ato: 1 | 2 | 3; titulo: string; dica: string; meta: number; xp: number; premio?: [string, number][];
  /** id do local que o mapa destaca com uma estrela */ local?: string;
  /** quanto já foi feito (0..meta) */ valor: (s: Run, inv: Record<string, number>) => number;
};
export const ATOS = ['', 'Ato I · Sobreviver', 'Ato II · Crescer', 'Ato III · A saída'] as const;

export const OBJETIVOS: Objetivo[] = [
  { id: 'jipe', ato: 1, titulo: 'Viaje no jipe até o Ermo', dica: 'Use o jipe no portão do abrigo e escolha um destino no mapa.', meta: 1, local: 'ermo', xp: 40, valor: s => (s.viajou ? 1 : 0) },
  { id: 'saque5', ato: 1, titulo: 'Vasculhe 5 contêineres', dica: 'Geladeiras, armários e porta-malas guardam o essencial.', meta: 5, xp: 50, premio: [['bandagem', 2]], valor: s => Math.min(5, s.vasculhados) },
  { id: 'madeira', ato: 1, titulo: 'Colete 6 de madeira', dica: 'Pegue gravetos no chão (é só passar por cima) ou corte árvores com um machado.', meta: 6, xp: 40, valor: s => Math.min(6, s.st?.col_madeira ?? 0) },
  { id: 'fabricar', ato: 1, titulo: 'Fabrique algo na bancada', dica: 'Volte ao abrigo com madeira, sucata e tecido.', meta: 1, xp: 50, valor: s => (s.craftou ? 1 : 0) },
  { id: 'noite', ato: 1, titulo: 'Sobreviva a uma noite', dica: 'À noite a visão encurta e eles ficam mais ativos. Durma no abrigo ou aguente até o amanhecer.', meta: 1, xp: 70, premio: [['bateria', 1]], valor: s => Math.min(1, s.noites) },
  { id: 'nivel3', ato: 2, titulo: 'Chegue ao nível 3', dica: 'Abater, vasculhar, coletar e explorar dão XP. A cada nível, uma habilidade nova.', meta: 3, xp: 60, valor: s => Math.min(3, s.nivel ?? 1) },
  { id: 'contrato', ato: 2, titulo: 'Cumpra um contrato do rádio', dica: 'Abra o Diário: o rádio passa tarefas. Cumpra na rua e receba no abrigo.', meta: 1, xp: 60, premio: [['combustivel', 1]], valor: s => Math.min(1, s.st?.contratos ?? 0) },
  { id: 'melhoria', ato: 2, titulo: 'Melhore o abrigo', dica: 'Na bancada, abra "Melhorias do abrigo".', meta: 1, xp: 70, valor: s => Math.min(1, s.st?.melhorias ?? 0) },
  { id: 'explorar', ato: 2, titulo: 'Descubra 3 locais', dica: 'Cada local novo no mapa conta. Cuidado com o perigo (caveiras).', meta: 3, xp: 80, premio: [['kit', 1]], valor: s => Math.min(3, s.descobertos.filter(d => d !== 'base' && d !== 'abrigo7').length) },
  { id: 'radio', ato: 3, titulo: 'Ache o rádio de campanha', dica: 'A Torre de Rádio, ao norte do mapa, guarda um.', meta: 1, local: 'torre', xp: 120, valor: (s, inv) => (inv.radio || s.sabeAbrigo ? 1 : 0) },
  { id: 'combustivel', ato: 3, titulo: 'Junte 8 de combustível', dica: 'A viagem final é longa. Fabrique, saqueie ou receba em contratos.', meta: 8, xp: 80, valor: s => Math.min(8, s.combustivel) },
  { id: 'abrigo7', ato: 3, titulo: 'Viaje até o Abrigo 7', dica: 'O rádio capta o sinal. Escolha o Abrigo 7 no mapa.', meta: 1, local: 'abrigo7', xp: 0, valor: () => 0 },
];
