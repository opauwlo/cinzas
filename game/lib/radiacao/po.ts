// MOMENTO AUTORAL — o pó azul. Em memória de Goiânia, setembro de 1987: a cápsula de césio-137 aberta num ferro-velho,
// o pó que brilhava azul e que as pessoas levaram para casa nas mãos, na roupa, nos sapatos.
// No jogo: algumas zonas têm uma cápsula rompida. O pó gruda em quem pisa, vai junto, e cai pelo caminho — você deixa
// um rastro que o Geiger dos outros (e o seu, na volta) ouve. Se você entrar no abrigo com ele, o abrigo fica quente.
// Enquanto está em você, o Geiger grita do CENTRO, sem seta: o perigo não está em lado nenhum, está em você.
// Só água tira: chuva lá fora (devagar) ou se lavar (rápido; a água suja cai ali mesmo).
import type { CampoCinzas } from './campo';

export const PO = {
  /** fração do pó da casa que gruda por segundo parado em cima */ pega: 0.35,
  /** fração do que está na roupa que cai a cada casa andada */ solta: 0.02,
  /** fração lavada por segundo, por unidade de chuva (só ao ar livre) */ lavaChuva: 0.05,
  /** taxa de radiação de quem está com a roupa toda coberta (q = 1) */ taxaRoupa: 0.5,
  /** abaixo disto o pó na roupa é esquecido */ minimo: 0.003,
} as const;

export class RoupaPo {
  /** pó na roupa, 0..1 */ q = 0;
  private lx = NaN; private ly = NaN;
  /** um quadro do jogador em (x, y): pega do chão, solta pelo caminho, a chuva lava */
  passo(c: CampoCinzas, x: number, y: number, dt: number, chuva: number, interior: boolean) {
    const chao = c.poEm(x, y);
    if (chao > 0.005) this.q = Math.min(1, this.q + c.pegarPo(x, y, PO.pega * dt));
    const d = Number.isNaN(this.lx) ? 0 : Math.hypot(x - this.lx, y - this.ly); this.lx = x; this.ly = y;
    if (this.q <= 0) return;
    if (d > 0 && d < 3) { const s = this.q * Math.min(1, PO.solta * d); this.q -= s; c.depositarPo(x, y, s); } // d ≥ 3 = teleporte/troca de zona
    if (!interior && chuva > 0.05) { const w = this.q * Math.min(1, PO.lavaChuva * chuva * dt); this.q -= w; c.depositarPo(x, y, w * 0.5); }
    if (this.q < PO.minimo) this.q = 0;
  }
  taxa() { return this.q * PO.taxaRoupa; }
  /** lavar-se (fonte, reservatório, balde no abrigo): a água leva tudo; um terço fica no chão onde você lavou */
  lavar(c: CampoCinzas | null, x: number, y: number) { if (c && this.q > 0) c.depositarPo(x, y, this.q / 3); this.q = 0; }
  /** troca de zona: o próximo quadro não conta como caminhada */
  esquecerPosicao() { this.lx = NaN; this.ly = NaN; }
}
