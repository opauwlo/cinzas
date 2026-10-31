// Campanha LINEAR em 4 atos (estilo "missões guiadas" de jogos de sobrevivência de celular): cada passo ensina uma parte do jogo, mostra o progresso
// numérico (ex.: 3/6), aponta um local quando faz sentido e paga XP (e às vezes itens). O XP da campanha acompanha os NÍVEIS que liberam locais e
// receitas (ver `nivel` em locais.ts e `nivelJog` em itens.ts; `npm run teste` confere que nenhum passo exige um local que o XP anterior não liberou).
// Criar um passo novo = uma entrada; o fim da lista é a vitória.
import type { Run } from '../sistemas/salvar';

export type Objetivo = {
  id: string; ato: 1 | 2 | 3 | 4; titulo: string; dica: string; meta: number; xp: number; premio?: [string, number][];
  /** id do local que o mapa destaca com uma estrela */ local?: string;
  /** quanto já foi feito (0..meta) */ valor: (s: Run, inv: Record<string, number>) => number;
};
export const ATOS = ['', 'Ato I · Sobreviver', 'Ato II · Crescer', 'Ato III · Território', 'Ato IV · A saída'] as const;
/** muda quando a lista abaixo muda: saves antigos recontam os passos em silêncio (sem pagar de novo) */
export const OBJ_VER = 3;
const st = (s: Run, k: string) => s.st?.[k] ?? 0;
const nivel = (s: Run) => s.nivel ?? 1;
const locais = (s: Run) => s.descobertos.filter(d => d !== 'base' && d !== 'abrigo7').length;

export const OBJETIVOS: Objetivo[] = [
  // ---- Ato I · Sobreviver: tudo começa no abrigo e no Ermo (a zona mais calma)
  { id: 'madeira', ato: 1, titulo: 'Colete 6 de madeira', dica: 'Pegue gravetos no chão do abrigo: é só passar por cima. Madeira vira taco, fogueira e bancada melhor.', meta: 6, xp: 30, valor: s => Math.min(6, st(s, 'col_madeira')) },
  { id: 'fabricar', ato: 1, titulo: 'Fabrique algo na bancada', dica: 'A bancada fica dentro da casa. Com tecido e madeira você já faz bandagem e taco.', meta: 1, xp: 40, premio: [['tecido', 3]], valor: s => (s.craftou ? 1 : 0) },
  { id: 'comer', ato: 1, titulo: 'Coma ou beba algo', dica: 'Os atalhos de baixo usam água, comida e curativos. Fome e sede não esperam.', meta: 1, xp: 20, valor: s => Math.min(1, st(s, 'usos')) },
  { id: 'jipe', ato: 1, titulo: 'Viaje no jipe até o Ermo', dica: 'Use o jipe no portão do abrigo e escolha o Ermo Cinzento no mapa. É a zona mais calma.', meta: 1, local: 'ermo', xp: 40, valor: s => (s.viajou ? 1 : 0) },
  { id: 'saque5', ato: 1, titulo: 'Vasculhe 5 contêineres', dica: 'Geladeiras, armários e porta-malas guardam o essencial. Toque neles para vasculhar.', meta: 5, xp: 50, premio: [['bandagem', 2]], valor: s => Math.min(5, s.vasculhados) },
  { id: 'abater3', ato: 1, titulo: 'Abata 3 criaturas', dica: 'No modo uma mão seu personagem ataca sozinho quem chega perto; no manche, segure o botão vermelho.', meta: 3, xp: 50, valor: s => Math.min(3, s.abates) },
  { id: 'noite', ato: 1, titulo: 'Sobreviva a uma noite', dica: 'À noite a visão encurta e eles ficam mais ativos. Durma no abrigo ou aguente até o amanhecer.', meta: 1, xp: 70, premio: [['bateria', 1]], valor: s => Math.min(1, s.noites) },
  // ---- Ato II · Crescer: nível 3 a 5; a Floresta (nível 2) e a Cidade Velha (nível 4) abrem aqui
  { id: 'nivel3', ato: 2, titulo: 'Chegue ao nível 3', dica: 'Abater, vasculhar, coletar e explorar dão XP. A cada nível, uma habilidade nova.', meta: 3, xp: 40, valor: s => Math.min(3, nivel(s)) },
  { id: 'melhoria', ato: 2, titulo: 'Melhore o abrigo', dica: 'Na bancada, abra "Melhorias do abrigo": muralha, tanque de chuva, cama, horta.', meta: 1, xp: 60, valor: s => Math.min(1, st(s, 'melhorias')) },
  { id: 'contrato', ato: 2, titulo: 'Cumpra um contrato do rádio', dica: 'Abra o Diário: o rádio passa tarefas. Cumpra na rua e receba no abrigo.', meta: 1, xp: 60, premio: [['combustivel', 1]], valor: s => Math.min(1, st(s, 'contratos')) },
  { id: 'bichos', ato: 2, titulo: 'Cace 2 animais', dica: 'Cães, lobos, javalis, cervos e coelhos dão carne crua. Esfole com uma faca.', meta: 2, xp: 50, valor: s => Math.min(2, st(s, 'bichos')) },
  { id: 'cozinhar', ato: 2, titulo: 'Cozinhe algo numa fogueira', dica: 'Carne crua e água suja pedem fogo: no abrigo ou numa fogueira de acampamento.', meta: 1, xp: 40, valor: s => Math.min(1, st(s, 'cozinhados')) },
  { id: 'horta', ato: 2, titulo: 'Plante e colha na horta', dica: 'Semente na horta do abrigo; colha em ~12 horas. Sementes saem de estantes e malas.', meta: 1, xp: 60, valor: s => Math.min(1, st(s, 'colhidos')) },
  { id: 'machado', ato: 2, titulo: 'Fabrique um machado', dica: 'Duas madeiras e três sucatas na bancada. O machado corta árvores e rende madeira de sobra.', meta: 1, xp: 50, valor: (s, inv) => (inv.machado || s.arma === 'machado' ? 1 : 0) },
  { id: 'explorar3', ato: 2, titulo: 'Descubra 3 locais', dica: 'Cada local novo no mapa conta. Cuidado com o perigo (caveiras) e com o nível exigido.', meta: 3, xp: 80, premio: [['kit', 1]], valor: s => Math.min(3, locais(s)) },
  { id: 'nivel5', ato: 2, titulo: 'Chegue ao nível 5', dica: 'Contratos, abates e descobertas rendem XP. No nível 5 o Hospital e o Pântano abrem.', meta: 5, xp: 70, valor: s => Math.min(5, nivel(s)) },
  // ---- Ato III · Território: nível 5 a 7; Hospital, Pântano, Torre de Rádio e Refinaria
  { id: 'gangue', ato: 3, titulo: 'Derrote um membro de gangue', dica: 'Acampamentos de saqueadores têm baús, mas atiram. Vá com vida cheia e munição.', meta: 1, xp: 90, premio: [['municao', 2]], valor: s => Math.min(1, st(s, 'gangue')) },
  { id: 'contratos2', ato: 3, titulo: 'Cumpra 3 contratos no total', dica: 'Receba no abrigo. Cada contrato é combustível, munição ou remédio no baú.', meta: 3, xp: 90, valor: s => Math.min(3, st(s, 'contratos')) },
  { id: 'explorar6', ato: 3, titulo: 'Descubra 6 locais', dica: 'Hospital (remédios), Posto (combustível), Floresta (caça)… cada um tem o seu saque.', meta: 6, xp: 100, valor: s => Math.min(6, locais(s)) },
  { id: 'nivel7', ato: 3, titulo: 'Chegue ao nível 7', dica: 'No nível 7 a Refinaria abre. É perigosa: leve cura, munição e uma boa arma.', meta: 7, xp: 100, valor: s => Math.min(7, nivel(s)) },
  // ---- Ato IV · A saída
  { id: 'radio', ato: 4, titulo: 'Ache o rádio de campanha', dica: 'A Torre de Rádio (nível 6), ao norte do mapa, sempre guarda um.', meta: 1, local: 'torre', xp: 150, valor: (s, inv) => (inv.radio || s.sabeAbrigo ? 1 : 0) },
  { id: 'combustivel', ato: 4, titulo: 'Junte 10 de combustível', dica: 'A viagem final é longa. Fabrique, saqueie postos e carros, ou receba em contratos.', meta: 10, xp: 100, valor: s => Math.min(10, s.combustivel) },
  { id: 'nivel8', ato: 4, titulo: 'Chegue ao nível 8', dica: 'O Abrigo 7 só abre no nível 8, com o sinal do rádio. Falta pouco.', meta: 8, xp: 100, valor: s => Math.min(8, nivel(s)) },
  { id: 'abrigo7', ato: 4, titulo: 'Viaje até o Abrigo 7', dica: 'O rádio capta o sinal. Escolha o Abrigo 7 no mapa.', meta: 1, local: 'abrigo7', xp: 0, valor: () => 0 },
];
