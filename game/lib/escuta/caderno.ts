// O Caderno de Escuta: cada alegação ouvida no rádio vira uma ficha "Disseram × Verdade × Técnica × Como descobri",
// o espelho, dentro da ficção, do `Manip { mostrado, real, porque }` do Modo Estudo (game/estudo.ts).
// Regra de ouro: a ficha aberta NÃO carrega `real` nem técnica; só a verificação (ou a Revelação do fim do ato) preenche.
// Puro: sem Phaser, sem DOM.
import type { Alegacao, Caderno, FichaCaderno, Instrumento, TipoAlegacao, Transmissao } from '../../nucleo/contratos';
import { caminhos, provado, serve, type Provas } from './verificacao';

export type FichaEscuta = FichaCaderno & {
  tipo: TipoAlegacao; /** frequência em que foi ouvida (antes de resolver, a ficha mostra a voz pela frequência, não pelo emissor real) */ frequencia?: string;
  /** lugar citado na fala (o que foi dito, não a verdade) */ local?: string;
  /** instrumentos que podem resolver (o caminho é sempre público: toda mentira tem como ser checada) */ caminhos: Instrumento[];
  /** fechada pela Revelação do fim do ato: "você nunca foi ver" */ nuncaFoiVer?: boolean;
  /** já tinha sido verificada numa vida anterior (o Caderno lembrou) */ vidaDescoberta?: number;
  diaResolvida?: number;
  /** a leitura do Geiger que fechou a ficha (o instrumento mostra o próprio número, nunca o do autor) */ cpm?: number;
};
/** a Farol repetiu igualzinho, 7 dias depois (é a pista R1: a voz é gravada) */
export type Eco = { transmissaoId: string; de: number; para: number };

export type OpcoesCaderno = {
  /** a alegação vigente no catálogo (a Narrativa pode ter revisado o texto); sem ela, usa a guardada ao ouvir */
  buscar?: (alegacaoId: string) => Alegacao | undefined;
  /** memória entre vidas: se o jogador já verificou ESTA alegação (mesma frase, mesma verdade) noutra vida */
  lembrar?: (a: Alegacao) => { vida: number; instr: Instrumento } | null;
  /** toda ficha que abriu ou mudou de estado */
  aoMudar?: (f: FichaEscuta) => void;
};

type Ouvida = { disseram: string; dias: number[] };
export type SalvoCaderno = {
  v: 1; seq: number; fichas: (FichaEscuta & { seq: number })[]; alegs: Alegacao[]; ouvidas: Record<string, Ouvida>;
  sintonias: Record<string, number[]>; visitas: Record<string, number>; leituras: Record<string, number>; pistas: string[]; ecos: Eco[];
};

const copia = (f: FichaEscuta): FichaEscuta => ({ ...f, caminhos: [...f.caminhos] });

export class CadernoEscuta implements Caderno {
  private mapa = new Map<string, FichaEscuta & { seq: number }>();
  private alegs = new Map<string, Alegacao>();
  private ouvidas = new Map<string, Ouvida>();
  private sintonias = new Map<string, number[]>();
  private visitas = new Map<string, number>();
  private leituras = new Map<string, number>();
  private pistas = new Set<string>();
  private listaEcos: Eco[] = [];
  private seq = 0;
  constructor(private op: OpcoesCaderno = {}) {}

  fichas(): readonly FichaEscuta[] { return [...this.mapa.values()].map(({ seq: _s, ...f }) => copia(f)); }
  ficha(alegacaoId: string): FichaEscuta | null { const f = this.mapa.get(alegacaoId); if (!f) return null; const { seq: _s, ...r } = f; return copia(r); }
  ecos(): readonly Eco[] { return this.listaEcos.map(e => ({ ...e })); }
  private alegacao(id: string) { return this.op.buscar?.(id) ?? this.alegs.get(id); }

  /** o rádio pegou esta transmissão (mesmo que o jogador saia no meio): guarda o dia e percebe o eco de 7 dias da Farol */
  sintonizar(t: Transmissao, dia: number): Eco | null {
    const dias = this.sintonias.get(t.id) ?? [];
    if (!dias.includes(dia)) { dias.push(dia); this.sintonias.set(t.id, dias); }
    if (t.emissor !== 'farol') return null;
    const de = dias.filter(d => d < dia && (dia - d) % 7 === 0).sort((a, b) => b - a)[0];
    if (de === undefined || this.listaEcos.some(e => e.transmissaoId === t.id && e.para === dia)) return null;
    const eco = { transmissaoId: t.id, de, para: dia }; this.listaEcos.push(eco); return { ...eco };
  }

  ouvir(t: Transmissao, dia: number): FichaEscuta[] {
    const novas: FichaEscuta[] = [];
    for (const a of t.alegacoes) {
      this.alegs.set(a.id, a);
      const o = this.ouvidas.get(a.id) ?? { disseram: a.disseram, dias: [] };
      if (!o.dias.includes(dia)) o.dias.push(dia);
      this.ouvidas.set(a.id, o);
      const f = this.mapa.get(a.id);
      if (!f) {
        const nova: FichaEscuta & { seq: number } = { alegacaoId: a.id, transmissaoId: t.id, emissor: t.emissor, disseram: a.disseram, estado: 'aberta', tecnica: t.tecnica, dia, tipo: a.tipo, caminhos: caminhos(a), seq: ++this.seq };
        if (a.local) nova.local = a.local;
        if (t.frequencia) nova.frequencia = t.frequencia;
        this.mapa.set(a.id, nova);
        const lembrou = this.op.lembrar?.(a);
        if (lembrou) this.resolver(nova, a, lembrou.instr, dia, { vidaDescoberta: lembrou.vida });
        else this.op.aoMudar?.(this.ficha(a.id)!);
        novas.push(this.ficha(a.id)!);
      } else if (f.estado === 'aberta') this.verificar(a.id, 'tempo', dia);
    }
    return novas;
  }

  private provas(id: string, f: FichaEscuta & { seq: number }, a: Alegacao, dia: number): Provas {
    const o = this.ouvidas.get(id);
    return {
      repetiu: !!o && o.disseram === a.disseram && o.dias.some(d => d !== f.dia) && o.dias.includes(dia),
      visitou: !!a.local && (this.visitas.get(a.local) ?? 0) > f.seq,
      leu: !!a.local && (this.leituras.get(a.local) ?? 0) > f.seq,
      pista: this.pistas.has(id),
    };
  }

  verificar(alegacaoId: string, instr: Instrumento, dia: number): FichaEscuta | null {
    const f = this.mapa.get(alegacaoId), a = this.alegacao(alegacaoId);
    if (!f || !a || f.estado !== 'aberta') return null;
    if (!provado(a, instr, this.provas(alegacaoId, f, a, dia))) return null;
    return this.resolver(f, a, instr, dia);
  }

  /** o que o jogador pode tocar AGORA para resolver (só instrumentos manuais com a prova em mãos) */
  manuais(alegacaoId: string): Instrumento[] {
    const f = this.mapa.get(alegacaoId), a = this.alegacao(alegacaoId);
    if (!f || !a || f.estado !== 'aberta') return [];
    const p = this.provas(alegacaoId, f, a, f.dia), r: Instrumento[] = [];
    if (serve(a, 'triangular')) r.push('triangular');
    if (serve(a, 'cruzar') && p.pista) r.push('cruzar');
    return r;
  }

  private resolver(f: FichaEscuta & { seq: number }, a: Alegacao, instr: Instrumento | undefined, dia: number, extra: Partial<FichaEscuta> = {}): FichaEscuta {
    f.estado = a.verdade; f.real = a.real; f.diaResolvida = dia;
    if (instr) f.comoDescobri = instr; else delete f.comoDescobri;
    Object.assign(f, extra);
    const r = this.ficha(f.alegacaoId)!; this.op.aoMudar?.(r); return r;
  }

  private porZona(mapa: Map<string, number>, instr: Instrumento, local: string, dia: number, cpm?: number): FichaEscuta[] {
    if ((mapa.get(local) ?? -1) === this.seq) return []; // nada abriu desde a última prova aqui (o Geiger lê muitas vezes)
    mapa.set(local, ++this.seq); const r: FichaEscuta[] = [];
    for (const f of this.mapa.values()) if (f.estado === 'aberta' && f.local === local) {
      const x = this.verificar(f.alegacaoId, instr, dia);
      if (x && cpm !== undefined) { f.cpm = Math.round(cpm); x.cpm = f.cpm; }
      if (x) r.push(x);
    }
    return r;
  }
  /** entrou na zona `local` (id de game/dados/locais.ts): resolve sozinho o que `ir` resolve */
  registrarVisita(local: string, dia: number) { return this.porZona(this.visitas, 'ir', local, dia); }
  /** leu o Geiger na zona `local`: resolve sozinho as alegações de radiação dali */
  registrarLeitura(local: string, dia: number, cpm?: number) { return this.porZona(this.leituras, 'geiger', local, dia, cpm); }
  /** achou um bilhete/depoimento que contradiz ou confirma a alegação: habilita "Cruzar" (1 toque) */
  registrarPista(alegacaoId: string): boolean { this.pistas.add(alegacaoId); return this.manuais(alegacaoId).includes('cruzar'); }

  revelarAto(_ato: number, dia: number): FichaEscuta[] {
    const r: FichaEscuta[] = [];
    for (const f of this.mapa.values()) {
      if (f.estado !== 'aberta') continue;
      const a = this.alegacao(f.alegacaoId); if (!a) continue;
      r.push(this.resolver(f, a, undefined, dia, { nuncaFoiVer: true }));
    }
    return r;
  }

  salvar(): SalvoCaderno {
    return {
      v: 1, seq: this.seq, fichas: [...this.mapa.values()].map(f => ({ ...f, caminhos: [...f.caminhos] })), alegs: [...this.alegs.values()],
      ouvidas: Object.fromEntries([...this.ouvidas].map(([k, o]) => [k, { disseram: o.disseram, dias: [...o.dias] }])),
      sintonias: Object.fromEntries([...this.sintonias].map(([k, d]) => [k, [...d]])),
      visitas: Object.fromEntries(this.visitas), leituras: Object.fromEntries(this.leituras), pistas: [...this.pistas], ecos: this.listaEcos.map(e => ({ ...e })),
    };
  }
  carregar(s: unknown): void {
    this.mapa.clear(); this.alegs.clear(); this.ouvidas.clear(); this.sintonias.clear(); this.visitas.clear(); this.leituras.clear(); this.pistas.clear(); this.listaEcos = []; this.seq = 0;
    const x = s as Partial<SalvoCaderno> | null | undefined;
    if (!x || x.v !== 1 || !Array.isArray(x.fichas)) return;
    this.seq = Number(x.seq) || 0;
    for (const f of x.fichas) if (f && typeof f.alegacaoId === 'string') this.mapa.set(f.alegacaoId, { ...f, caminhos: [...(f.caminhos ?? [])] });
    for (const a of x.alegs ?? []) if (a && typeof a.id === 'string') this.alegs.set(a.id, a);
    for (const [k, o] of Object.entries(x.ouvidas ?? {})) this.ouvidas.set(k, { disseram: o.disseram, dias: [...o.dias] });
    for (const [k, d] of Object.entries(x.sintonias ?? {})) this.sintonias.set(k, [...d]);
    for (const [k, n] of Object.entries(x.visitas ?? {})) this.visitas.set(k, n);
    for (const [k, n] of Object.entries(x.leituras ?? {})) this.leituras.set(k, n);
    for (const p of x.pistas ?? []) this.pistas.add(p);
    this.listaEcos = (x.ecos ?? []).map(e => ({ ...e }));
  }
}
