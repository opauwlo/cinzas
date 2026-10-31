// Colheita de plantas do cenário (PURO, testável): o que cada planta rende, quanto demora e quanto XP dá.
// Todo mato vira "algo para fazer": arbustos vivos dão bagas, cogumelos enchem a barriga, flores viram ervas medicinais, juncos viram fibra.
// A planta colhida vira um tufo de capim e volta depois de 3 dias fora da zona (o estado da zona é renovado).
export type Colheita = { rot: string; /** texto durante a ação */ fazendo: string; dur: number; ruido: number; rende: [item: string, chance: number, min: number, max: number][]; xp: number };
export const COLHEITA: Record<string, Colheita> = {
  'arbusto|': { rot: 'Colher bagas', fazendo: 'Colhendo bagas', dur: 1.3, ruido: 1, rende: [['baga', 1, 1, 2], ['tecido', 0.15, 1, 1]], xp: 2 },
  'cogumelo|brilho': { rot: 'Colher cogumelos', fazendo: 'Colhendo cogumelos', dur: 1.2, ruido: 1, rende: [['cogumelo', 1, 1, 2]], xp: 2 },
  'cogumelo|': { rot: 'Colher cogumelos', fazendo: 'Colhendo cogumelos', dur: 1.2, ruido: 1, rende: [['cogumelo', 1, 1, 2]], xp: 2 },
  'flor|': { rot: 'Colher ervas', fazendo: 'Colhendo ervas', dur: 1, ruido: 1, rende: [['erva', 1, 1, 2]], xp: 2 },
  'junco|': { rot: 'Cortar juncos', fazendo: 'Cortando juncos', dur: 1.2, ruido: 1, rende: [['tecido', 1, 1, 2]], xp: 1 },
};
/** a colheita de uma planta, ou undefined se ela não rende nada */
export const colheitaDe = (r: { f: string; v: string }) => COLHEITA[`${r.f}|${r.v}`];
