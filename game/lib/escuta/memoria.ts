// MOMENTO AUTORAL — "Nota de margem de outra vida".
// O Caderno aprende a ASSINATURA de cada voz (frequência, horário, chiado, bordão, técnica pega) e guarda ENTRE MORTES.
// Na vida seguinte, quando a mesma voz entra no ar, a fita do rádio ganha uma anotação a lápis na margem:
//   "Vida 2: você pegou os Saqueadores do Km 40 em escassez e prazo falso."
// É sempre um fato (o que VOCÊ verificou antes), nunca um veredito sobre a fala nova: o jogador fica melhor porque entende mais.
// Só vai para a memória o que o jogador foi ver: o que a Revelação do fim do ato contou não conta como saber.
// Puro: sem Phaser, sem DOM. A coordenação persiste o JSON (salvarMeta/carregarMeta) junto do meta do jogo.
import type { Alegacao, EfeitoRadio, EmissorId, FalaRadio, Instrumento, Tecnica, Transmissao, Verdade } from '../../nucleo/contratos';
import type { FichaEscuta } from './caderno';
import { EMISSORES, TECNICAS, hhmm } from './textos';

export type Assinatura = {
  emissor: EmissorId; frequencias: string[]; /** minuto do dia em que entrou no ar */ horarios: number[]; efeitos: EfeitoRadio[];
  /** falas ouvidas em pelo menos 2 dias diferentes */ bordoes: string[];
  /** técnicas que o jogador desmascarou (falso/meia verificados por ele), com a vida em que aprendeu */ tecnicas: { tecnica: Tecnica; vida: number }[];
  pegas: number; confirmadas: number; primeiraVida: number;
};
export type MemoriaSalva = {
  v: 1; vidas: number; assinaturas: Partial<Record<EmissorId, Assinatura>>;
  sabidas: Record<string, { verdade: Verdade; disseram: string; instr: Instrumento; vida: number }>;
  /** emissor|texto → chaves "vida:dia" em que a fala foi ouvida (no máximo 3) */ falas: Record<string, string[]>;
};
const LIM = 8;
const add = <T>(a: T[], v: T) => { if (!a.includes(v)) { a.push(v); if (a.length > LIM) a.shift(); } };

export class MemoriaEntreVidas {
  private m: MemoriaSalva = { v: 1, vidas: 0, assinaturas: {}, sabidas: {}, falas: {} };
  /** a vida desta run (1..) */
  vida = 1;

  novaVida(): number { this.m.vidas += 1; this.vida = this.m.vidas; return this.vida; }
  usarVida(v: number) { this.vida = v; if (v > this.m.vidas) this.m.vidas = v; }

  private de(e: EmissorId): Assinatura {
    let a = this.m.assinaturas[e];
    if (!a) { a = { emissor: e, frequencias: [], horarios: [], efeitos: [], bordoes: [], tecnicas: [], pegas: 0, confirmadas: 0, primeiraVida: this.vida }; this.m.assinaturas[e] = a; }
    return a;
  }
  /** a transmissão entrou no ar e o rádio pegou */
  ouviu(t: Transmissao, minuto: number) { const a = this.de(t.emissor); add(a.frequencias, t.frequencia); add(a.horarios, minuto); }
  /** uma fala foi mostrada: aprende o efeito e, se já ouvida noutro dia, vira bordão */
  falou(t: Transmissao, f: FalaRadio, dia: number) {
    const a = this.de(t.emissor); if (f.efeito) add(a.efeitos, f.efeito);
    const k = `${t.emissor}|${f.texto}`, vistos = this.m.falas[k] ?? [], chave = `${this.vida}:${dia}`;
    if (!vistos.includes(chave)) { vistos.push(chave); if (vistos.length > 3) vistos.shift(); }
    this.m.falas[k] = vistos;
    if (vistos.length >= 2) add(a.bordoes, f.texto);
  }
  /** o jogador resolveu uma ficha com um instrumento: vira saber entre vidas */
  aprendeu(f: FichaEscuta, a: Alegacao) {
    if (!f.comoDescobri || f.nuncaFoiVer || f.vidaDescoberta || f.estado === 'aberta') return;
    const s = this.de(f.emissor);
    if (f.estado === 'verdade') s.confirmadas++;
    else { s.pegas++; if (f.tecnica !== 'nenhuma' && !s.tecnicas.some(x => x.tecnica === f.tecnica)) s.tecnicas.push({ tecnica: f.tecnica, vida: this.vida }); }
    this.m.sabidas[a.id] = { verdade: a.verdade, disseram: a.disseram, instr: f.comoDescobri, vida: this.vida };
  }
  /** se esta alegação (mesma frase, mesma verdade) já foi verificada numa vida ANTERIOR */
  lembrar(a: Alegacao): { vida: number; instr: Instrumento } | null {
    const s = this.m.sabidas[a.id];
    return s && s.vida < this.vida && s.verdade === a.verdade && s.disseram === a.disseram ? { vida: s.vida, instr: s.instr } : null;
  }

  assinaturas(): Assinatura[] { return Object.values(this.m.assinaturas).filter((a): a is Assinatura => !!a).map(a => structuredClone(a)); }
  assinatura(e: EmissorId): Assinatura | null { const a = this.m.assinaturas[e]; return a ? structuredClone(a) : null; }

  /** a nota a lápis na margem da fita: só fatos de vidas anteriores */
  notaDeMargem(e: EmissorId, fala?: string): string | null {
    const a = this.m.assinaturas[e]; if (!a) return null;
    const antigas = a.tecnicas.filter(t => t.vida < this.vida), em = EMISSORES[e];
    const partes: string[] = [];
    if (antigas.length) {
      const v = Math.min(...antigas.map(t => t.vida)), tecs = antigas.map(t => TECNICAS[t.tecnica].nome.toLowerCase()).join(' e ');
      partes.push(`Vida ${v}: você pegou ${em.artigo} ${em.artigo === 'um' ? em.nome.toLowerCase() : em.nome} em ${tecs}.`);
    }
    if (fala && a.bordoes.includes(fala) && a.primeiraVida < this.vida) partes.push('Esse bordão você já conhece.');
    return partes.length ? partes.join(' ') : null;
  }
  /** resumo de uma linha da assinatura, para o Caderno */
  linha(a: Assinatura): string {
    const h = a.horarios.length ? [...a.horarios].sort((x, y) => x - y).map(hhmm).join(', ') : '?';
    return `${a.frequencias.join(' / ') || '?'} · ${h}${a.efeitos.includes('chiado') ? ' · chiado' : ''}${a.efeitos.includes('interferencia') ? ' · interferência' : ''}`;
  }

  salvar(): MemoriaSalva { return structuredClone(this.m); }
  carregar(s: unknown) {
    const x = s as Partial<MemoriaSalva> | null | undefined;
    this.m = x && x.v === 1 && typeof x.vidas === 'number'
      ? { v: 1, vidas: x.vidas, assinaturas: structuredClone(x.assinaturas ?? {}), sabidas: structuredClone(x.sabidas ?? {}), falas: structuredClone(x.falas ?? {}) }
      : { v: 1, vidas: 0, assinaturas: {}, sabidas: {}, falas: {} };
    if (this.vida < 1) this.vida = 1;
  }
}
