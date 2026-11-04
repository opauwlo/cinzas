// Dosímetro (Plano GOTY §2.3 / S2): contaminação (o `s.rad` de hoje, curável) × dose acumulada da vida (só cai devagar).
// A contaminação usa EXATAMENTE a fórmula de game/cena.ts (necessidades): nas zonas frias o equilíbrio não muda.
// A dose é física simples: integral da taxa acima do fundo. Máscara segura o que se respira (contaminação ×0,35),
// mas não para o gama: na dose ela só tira 20%. Teto e parede seguram metade (fator de proteção de construção).
import type { DegrauDose, Dosimetro } from '../../nucleo/contratos';

export const DOSE = {
  /** dose por segundo real, por unidade de taxa acima do fundo — calibrada no teste "6–10 expedições quentes" */ ganho: 1.8,
  /** abaixo disto é fundo natural: não soma dose (nas zonas frias a dose não anda) */ fundo: 0.06,
  /** dose que sai por dia de jogo (o relógio honesto anda para um lado só, quase) */ quedaDia: 3,
  degraus: [100, 250, 400, 500] as const,
  fatorMascara: 0.8, fatorInterior: 0.5, fatorImune: 0.8,
} as const;

export type Protecao = { mascara: boolean; interior: boolean; /** perk 'imune' (cena.ts: ganho ×0,6) */ imune?: boolean };

/** ganho de contaminação por segundo — cópia fiel de cena.ts:427-428 (rad > 0,05 → rad^1,2 × 2,4 × máscara) */
export function ganhoContaminacao(taxa: number, p: Protecao) {
  let g = taxa > 0.05 ? Math.pow(taxa, 1.2) * 2.4 * (p.mascara ? 0.35 : 1) : 0;
  if (p.imune) g *= 0.6; return g;
}

export const degrauDe = (dose: number): DegrauDose => (dose >= 500 ? 4 : dose >= 400 ? 3 : dose >= 250 ? 2 : dose >= 100 ? 1 : 0);
/** o que cada degrau faz (a cena aplica; textos ficam com a narrativa/HUD) */
export const EFEITO_DEGRAU = [
  { hpMax: 0, sede: 1, vinheta: 0, aposenta: false },
  { hpMax: -10, sede: 1, vinheta: 0, aposenta: false },
  { hpMax: -10, sede: 1.3, vinheta: 0, aposenta: false },
  { hpMax: -10, sede: 1.3, vinheta: 0.35, aposenta: false },
  { hpMax: -10, sede: 1.3, vinheta: 0.5, aposenta: true },
] as const;

export class DosimetroCinzas implements Dosimetro {
  contaminacao = 0;
  dose = 0;
  degrau(): DegrauDose { return degrauDe(this.dose); }
  absorver(taxa: number, dt: number, p: Protecao): void {
    const g = ganhoContaminacao(taxa, p);
    this.contaminacao = Math.min(100, Math.max(0, this.contaminacao + (g > 0 ? g * dt : -0.03 * dt)));
    const ex = taxa - DOSE.fundo; if (ex <= 0 || dt <= 0) return;
    this.dose += ex * DOSE.ganho * dt * (p.mascara ? DOSE.fatorMascara : 1) * (p.interior ? DOSE.fatorInterior : 1) * (p.imune ? DOSE.fatorImune : 1);
  }
  /** antirrad tira contaminação (item: 35 pontos); a dose não sai com remédio */
  tratar(antirrad: number): void { this.contaminacao = Math.max(0, this.contaminacao - Math.max(0, antirrad)); }
  /** o tempo passa (minutos de jogo): a dose cai devagar */
  recuperar(minutos: number) { if (minutos > 0) this.dose = Math.max(0, this.dose - (minutos / 1440) * DOSE.quedaDia); }
  /** dose de uma vez (Jornada: desmaio = +40, S4) */
  somar(q: number) { this.dose = Math.max(0, this.dose + q); }
}
