// Medidor de tempo de quadro: buffer circular de tamanho fixo (sem lixo por quadro), percentis por ordenação só quando pedem o resumo.
// Puro: roda em Node. Quem alimenta no navegador é o requestAnimationFrame de ./navegador.ts (não o tick da cena, que limita dt a 50 ms).
import type { MedidorDesempenho, ResumoDesempenho } from '../../nucleo/contratos';

/** quadro acima disto conta como travada (perde 3 quadros de 60 Hz) */
export const TRAVADA_MS = 50;
/** intervalo acima disto não é quadro: a aba foi para o fundo ou o aparelho dormiu */
export const PAUSA_MS = 1000;

export type ResumoCompleto = ResumoDesempenho & { travadas: number; pausas: number };

/** percentil pelo método do posto mais próximo (nearest-rank) sobre um vetor JÁ ordenado */
export function percentil(ordenado: ArrayLike<number>, p: number): number {
  const n = ordenado.length; if (!n) return 0;
  const k = Math.min(n, Math.max(1, Math.ceil((p / 100) * n)));
  return ordenado[k - 1];
}

const r1 = (v: number) => Math.round(v * 10) / 10;

export class Medidor implements MedidorDesempenho {
  private buf: Float32Array; private ord: Float32Array; private i = 0; private n = 0; private travadas = 0; private pausas = 0;
  constructor(readonly capacidade = 2048) { this.buf = new Float32Array(capacidade); this.ord = new Float32Array(capacidade); }
  /** O(1): grava e avança o índice; o custo por quadro é uma escrita num Float32Array */
  quadro(dtMs: number) {
    if (!(dtMs > 0)) return;
    if (dtMs >= PAUSA_MS) { this.pausas++; return; }
    if (dtMs >= TRAVADA_MS) this.travadas++;
    this.buf[this.i] = dtMs; this.i = (this.i + 1) % this.capacidade; if (this.n < this.capacidade) this.n++;
  }
  resumo(): ResumoCompleto {
    const n = this.n; if (!n) return { fps: 0, p50ms: 0, p95ms: 0, piorMs: 0, amostras: 0, travadas: this.travadas, pausas: this.pausas };
    const v = this.ord.subarray(0, n); v.set(this.buf.subarray(0, n)); v.sort();
    let soma = 0; for (let k = 0; k < n; k++) soma += v[k];
    return { fps: r1((n * 1000) / soma), p50ms: r1(percentil(v, 50)), p95ms: r1(percentil(v, 95)), piorMs: r1(v[n - 1]), amostras: n, travadas: this.travadas, pausas: this.pausas };
  }
  zerar() { this.i = 0; this.n = 0; this.travadas = 0; this.pausas = 0; }
}

/** leitura honesta contra a meta do plano (p95 < 33 ms num Android intermediário, docs/plano-goty/producao.md §5.2) */
export function veredito(r: ResumoDesempenho): { nota: 'liso' | 'aceitável' | 'pesado' | 'sem dados'; texto: string } {
  if (r.amostras < 120) return { nota: 'sem dados', texto: `Poucos quadros (${r.amostras}). Jogue mais uns segundos.` };
  if (r.p95ms <= 18) return { nota: 'liso', texto: 'Perto de 60 fps quase o tempo todo.' };
  if (r.p95ms < 33) return { nota: 'aceitável', texto: 'Dentro da meta (p95 abaixo de 33 ms), com quedas.' };
  return { nota: 'pesado', texto: 'Fora da meta: 1 em cada 20 quadros passa de 33 ms. Tente a qualidade Leve.' };
}
