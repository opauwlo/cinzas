// A grade do rádio: o que está no ar por seed + dia + minuto + ato. Determinística (game/lib/rng.ts), sem relógio real.
// A Farol toca às 6h40 (minuto 400) num LOOP DE 7 DIAS: a fita do dia 8 é a do dia 1 (pista R1 do roteiro: a voz é gravada).
// Cada facção tem a sua janela fixa (é a "assinatura" que o Caderno aprende). Puro: sem Phaser, sem DOM.
import type { EmissorId, Programacao, Transmissao } from '../../nucleo/contratos';
import { Rng } from '../rng';

export const MINUTO_FAROL = 400;
/** quanto tempo (minutos de jogo) uma janela fica aberta: dá para pegar a transmissão se ligar o rádio nesse intervalo */
export const DURACAO_JANELA = 20;
export const LOOP_FAROL = 7;

/** janela de cada emissor: minuto do dia em que entra e chance de transmitir num dia (sorteada pela seed) */
export const JANELAS: Readonly<Record<EmissorId, { minuto: number | null; chance: number }>> = {
  farol: { minuto: MINUTO_FAROL, chance: 1 },
  px: { minuto: 450, chance: 0.7 },          // 7h30, a feira do rádio
  milicia: { minuto: 720, chance: 1 },       // 12h00, o "boletim" do Posto 14
  saqueadores: { minuto: 1080, chance: 1 },  // 18h00, todo santo dia, com chiado na faixa 3
  filhos: { minuto: 1260, chance: 0.85 },    // 21h00, a vigília
  sobrevivente: { minuto: null, chance: 0.5 }, // qualquer hora entre 8h e 22h, sem padrão
};
const ORDEM: EmissorId[] = ['farol', 'px', 'milicia', 'saqueadores', 'filhos', 'sobrevivente'];

export type NoAr = { t: Transmissao; minuto: number; dia: number };

export class ProgramacaoEscuta implements Programacao {
  private cat: Transmissao[] = [];
  private cache = new Map<string, NoAr[]>();
  constructor(catalogo: readonly Transmissao[] = []) { this.trocar(catalogo); }
  /** troca o catálogo (a Narrativa entrega o conteúdo final) */
  trocar(catalogo: readonly Transmissao[]) { this.cat = [...catalogo].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)); this.cache.clear(); }
  catalogo(): readonly Transmissao[] { return this.cat; }

  /** a fita que a Farol toca no dia: depende só de (seed, ato, dia mod 7) */
  fitaFarol(seed: string, dia: number, ato: number): Transmissao | null {
    const fitas = this.cat.filter(t => t.emissor === 'farol' && t.atos.includes(ato));
    if (!fitas.length) return null;
    const ordem = new Rng(`${seed}|farol|${ato}`).embaralhar([...fitas]);
    return ordem[(((dia - 1) % LOOP_FAROL) + LOOP_FAROL) % LOOP_FAROL % ordem.length];
  }

  /** a grade de um dia, em ordem de horário (cacheada: o tick não refaz) */
  grade(seed: string, dia: number, ato: number): readonly NoAr[] {
    const k = `${seed}|${dia}|${ato}`, c = this.cache.get(k); if (c) return c;
    const r: NoAr[] = [];
    for (const e of ORDEM) {
      if (e === 'farol') { const t = this.fitaFarol(seed, dia, ato); if (t) r.push({ t, minuto: MINUTO_FAROL, dia }); continue; }
      const cands = this.cat.filter(t => t.emissor === e && t.atos.includes(ato)); if (!cands.length) continue;
      const rng = new Rng(`${seed}|${e}|${dia}|${ato}`), j = JANELAS[e];
      if (!rng.chance(j.chance)) continue;
      const t = rng.pick(cands), minuto = t.minuto ?? j.minuto ?? rng.int(48, 132) * 10;
      if (r.some(x => Math.abs(x.minuto - minuto) < DURACAO_JANELA)) continue; // nunca duas no ar ao mesmo tempo
      r.push({ t, minuto, dia });
    }
    r.sort((a, b) => a.minuto - b.minuto);
    if (this.cache.size > 64) this.cache.clear();
    this.cache.set(k, r); return r;
  }

  noAr(seed: string, dia: number, minuto: number, ato: number): Transmissao | null {
    return this.janela(seed, dia, minuto, ato)?.t ?? null;
  }
  /** a transmissão no ar com o minuto em que começou */
  janela(seed: string, dia: number, minuto: number, ato: number): NoAr | null {
    for (const x of this.grade(seed, dia, ato)) if (minuto >= x.minuto && minuto < x.minuto + DURACAO_JANELA) return x;
    return null;
  }

  proximas(seed: string, dia: number, minuto: number, ato: number, n: number): NoAr[] {
    const r: NoAr[] = [];
    for (let d = dia; d < dia + 14 && r.length < n; d++) for (const x of this.grade(seed, d, ato)) { if (d === dia && x.minuto < minuto) continue; r.push(x); if (r.length >= n) break; }
    return r;
  }
}
