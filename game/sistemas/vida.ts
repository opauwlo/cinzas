// Vida no ar do cenário: quantas partículas por segundo cada bioma, hora e clima pedem (cinza caindo, poeira em suspensão, vagalumes, esporos e brasas).
// Puro e testado em Node: a cena só sorteia e solta o que esta tabela manda, dentro da área da câmera.
export type VidaCtx = { bioma: string; /** claridade do dia, 0 (noite) a 1 (dia) */ dia: number; chuva: number; vento: number; neblina?: number };
export type TaxasVida = { cinza: number; poeira: number; vagalume: number; esporo: number; brasa: number };
/** por segundo, para a tela inteira, em condição ideal */
const BASE: Record<string, TaxasVida> = {
  ermo: { cinza: 5, poeira: 4, vagalume: 0, esporo: 0, brasa: 0 },
  cidade: { cinza: 5, poeira: 3, vagalume: 0, esporo: 0, brasa: 0.3 },
  industrial: { cinza: 7, poeira: 2, vagalume: 0, esporo: 0, brasa: 3 },
  floresta: { cinza: 1, poeira: 0, vagalume: 2.5, esporo: 1.5, brasa: 0 },
  pantano: { cinza: 0, poeira: 0, vagalume: 3.5, esporo: 3, brasa: 0 },
  base: { cinza: 1.5, poeira: 2, vagalume: 0.8, esporo: 0, brasa: 0 },
};
/** teto da soma das taxas (o sistema de partículas é compartilhado com sangue, poeira de passos e clima) */
export const TETO_VIDA = 14;
export function taxasVida(c: VidaCtx): TaxasVida {
  const b = BASE[c.bioma] ?? BASE.ermo, noite = 1 - Math.max(0, Math.min(1, c.dia)), dia = 1 - noite, chuva = Math.min(1, Math.max(0, c.chuva)), vento = Math.max(0, c.vento), seco = 1 - 0.85 * chuva;
  const t: TaxasVida = {
    cinza: b.cinza * (1 - 0.8 * chuva) * (1 + 0.5 * Math.min(1, vento)),
    poeira: b.poeira * dia * seco * (1 + Math.min(1, vento)),
    vagalume: b.vagalume * Math.max(0, (noite - 0.4) / 0.6) * seco * (1 - 0.6 * Math.min(1, vento)),
    esporo: b.esporo * (0.6 + 0.4 * noite) * seco,
    brasa: b.brasa * (0.7 + 0.6 * noite) * (1 - 0.7 * chuva),
  };
  const f = 1 - 0.4 * Math.min(1, Math.max(0, c.neblina ?? 0)); for (const k of Object.keys(t) as (keyof TaxasVida)[]) t[k] *= f;
  const soma = t.cinza + t.poeira + t.vagalume + t.esporo + t.brasa; if (soma > TETO_VIDA) for (const k of Object.keys(t) as (keyof TaxasVida)[]) t[k] *= TETO_VIDA / soma;
  return t;
}
