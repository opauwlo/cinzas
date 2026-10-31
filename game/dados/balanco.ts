// Balanceamento num só lugar: números de sobrevivência, combate, economia e progressão + funções PURAS que MEDEM a dificuldade.
// A cena usa as constantes; `npm run teste` usa as funções para garantir as metas de projeto (tools/testes).
import { ARQS } from './criaturas';
import { ARMAS } from './itens';

// ---------------------------------------------------------------- tempo e necessidades
export const DIA_REAL_MIN = 14;                              // 1 dia de jogo = 14 min reais
export const MIN_POR_SEG = 1440 / (DIA_REAL_MIN * 60);       // minutos de jogo por segundo real
export const FOME_POR_MIN = 0.044;                           // pontos por minuto de jogo: 100 → 0 em ~22 min reais (Normal)
export const SEDE_POR_MIN = 0.07;                            // 100 → 0 em ~14 min reais (Normal)
/** multiplicadores por dificuldade (0 Calmo · 1 Normal · 2 Brutal) */
export const DIF = { dano: [0.75, 1, 1.3], fome: [0.8, 1, 1.2], xp: [0.9, 1, 1.25], spawn: [0.7, 1, 1.4], raid: [0.8, 1, 1.35], chanceRaid: [0.35, 0.5, 0.7] } as const;
export const segundosAteZerar = (taxaPorMin: number, dif = 1, mult = 1) => 100 / (taxaPorMin * DIF.fome[dif] * mult) / MIN_POR_SEG;

// ---------------------------------------------------------------- progressão
export const xpNivel = (n: number) => 50 + 40 * (n - 1);
export const xpAcumulado = (nivel: number) => { let t = 0; for (let n = 1; n < nivel; n++) t += xpNivel(n); return t; };
export const nivelPorXp = (xp: number) => { let n = 1, r = xp; while (r >= xpNivel(n)) { r -= xpNivel(n); n++; } return n; };

// ---------------------------------------------------------------- combate (modelo simples: tudo acerta, ninguém recua)
const HP_MEDIO = 1.025; // o gerador sorteia 0,9–1,15 do HP base
export const danoPorAcao = (armaId: string) => { const a = ARMAS[armaId]; return a.dano * (a.pelotas ?? 1); };
export const acoesParaMatar = (armaId: string, arqId: string) => Math.ceil(ARQS[arqId].hp * HP_MEDIO / danoPorAcao(armaId));
export const ttk = (armaId: string, arqId: string) => acoesParaMatar(armaId, arqId) * ARMAS[armaId].cd;
export const dpsInimigo = (arqId: string, dif = 1) => ARQS[arqId].dano / ARQS[arqId].cd * DIF.dano[dif];
/** fração da vida máxima perdida lutando corpo a corpo contra `n` iguais ao mesmo tempo, sem recuar (pior caso) */
export function perdaEmLuta(armaId: string, arqId: string, n: number, dif = 1, vidaMax = 100) {
  const t = ttk(armaId, arqId); let dano = 0; for (let k = n; k >= 1; k--) dano += k * dpsInimigo(arqId, dif) * t; return dano / vidaMax;
}

// ---------------------------------------------------------------- invasões ao abrigo
export function tamanhoRaid(dia: number, muro: number, dif = 1) { return Math.max(2, Math.min(10, Math.round((1.5 + dia * 0.8) * (1 - 0.2 * muro) * DIF.raid[dif]))); }

// ---------------------------------------------------------------- economia de troca (NPCs): valor em fichas
export const VALOR: Record<string, number> = {
  agua: 4, agua_suja: 1, garrafa: 1, enlatado: 4, pao: 2, carne_crua: 2, carne_cozida: 5, legume: 3, semente: 2, bandagem: 3, kit: 10, antirrad: 8,
  tecido: 1, madeira: 1, sucata: 1, alcool: 3, bateria: 4, eletronico: 6, combustivel: 14, municao: 4, cartucho: 5,
  taco: 6, pe_de_cabra: 9, faca: 6, facao: 16, machado: 12, pistola: 30, escopeta: 40, rifle: 55, mascara: 25, lanterna: 10, colete: 14, kit_fogueira: 3, ficha: 1,
};
export const PRECO_COMPRA = 1.35, PRECO_VENDA = 0.55;
export const precoCompra = (id: string) => Math.max(1, Math.ceil((VALOR[id] ?? 1) * PRECO_COMPRA));
export const precoVenda = (id: string) => Math.floor((VALOR[id] ?? 0) * PRECO_VENDA);
