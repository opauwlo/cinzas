// MAESTRO: escolhe a ORDEM dos segmentos compostos (partitura.ts) e QUANDO trocar de estado. Nunca inventa notas.
// Modelo iMUSE / "switch container": ressequenciamento horizontal com troca na barra, histerese, cota anti-fadiga e silêncio como recurso.
// PURO e determinístico: a escolha k sai de Rng(`${seed}:${k}`), então a mesma seed (a do dia) dá "a música de hoje" para todos,
// e o save só precisa guardar k. O relógio é o do AudioContext, passado em `agendar(agora, janela)`.
import type { EstadoMusical, Maestro, NotaAgendada } from '../../nucleo/contratos';
import { Rng } from '../rng';
import { SEGMENTOS, type Contexto, type NotaPart, type Segmento } from './partitura';

/** prioridade-base de cada estado: o pedido de prioridade maior entra na próxima barra; o de menor espera a histerese */
export const PRIORIDADE: Record<EstadoMusical, number> = { silencio: 0, menu: 1, exploracao: 1, abrigo: 2, tensao: 3, viagem: 3, combate: 4, colosso: 5, morte: 8, vitoria: 9 };
/** segundos que um pedido de estado MAIS CALMO precisa durar para o atual ceder (combate: 8 s, §3.3) */
export const HISTERESE: Partial<Record<EstadoMusical, number>> = { combate: 8, colosso: 4, tensao: 3 };
/** estes entram no próximo TEMPO, não na próxima barra (urgência) */
const URGENTE = new Set<EstadoMusical>(['combate', 'colosso', 'morte', 'vitoria']);
/** depois destes, o mundo respira: 6–12 s só com o ambiente antes de qualquer melodia */
const AGITADO = new Set<EstadoMusical>(['combate', 'colosso', 'tensao']);
export const RESPIRO_S: [number, number] = [6, 12];
/** o mesmo segmento melódico não volta dentro de 5 min; a frase completa do tema, no máximo 3× por hora */
export const SEM_REPETIR_S = 300, TEMA_POR_HORA = 3;
/** micro-timing fixo de mão humana (s) pela posição no compasso: 1 atrasa, 2 adianta pouco, 3 "arrasta"; o dedilhado abre 12 ms por corda */
const HUMANO = [0.014, 0.004, 0.02], ARPEJO_S = 0.012;

type Tocando = { def: Segmento; ini: number; barras: number; durBarra: number; durTempo: number; fim: number; porBarraNotas: NotaPart[][]; offs: Map<NotaPart, number> };
export type Transicao = { t: number; de: EstadoMusical; para: EstadoMusical; seg: string; antes?: { ini: number; durBarra: number; durTempo: number }; urgente: boolean };
export type Corte = { t: number; seg: number };
export type SalvoMaestro = { k: number };

const CTX_PADRAO: Contexto = { ato: 1, noite: false, amanhecer: false, bioma: 'ermo', gangue: false };

export class MaestroCinzas implements Maestro {
  private seed = 'cinzas';
  private atual: EstadoMusical = 'silencio';
  private pend: { e: EstadoMusical; prio: number; desde: number | null } | null = null;
  private seg: Tocando | null = null;
  private cursor: number | null = null;
  private silencioAte = -Infinity;
  private cortePend: number | null = null;
  private cortes: Corte[] = [];
  private ultimoInicio = new Map<string, number>();
  private temaInicios: number[] = [];
  private ultimoSeg = '';
  private ultimoMelodico = false;
  private respiro = false;
  private entrou = false;
  private unicos = new Set<string>();
  private ctx: Contexto = { ...CTX_PADRAO };
  /** escolhas feitas (vai no save) */
  k = 0;
  /** últimas transições (para depuração e testes) */
  readonly log: Transicao[] = [];
  /** tempo (s) com segmento melódico e total, por estado (cota de exploração) */
  readonly tempoMelodia: Partial<Record<EstadoMusical, [number, number]>> = {};

  constructor(seed = 'cinzas', private segmentos: Segmento[] = SEGMENTOS) { this.seed = seed; }
  semear(seed: string) { if (seed && seed !== this.seed) { this.seed = seed; this.k = 0; } }
  contexto(c: Partial<Contexto>) { Object.assign(this.ctx, c); }
  estado(): EstadoMusical { return this.atual; }
  segmento(): string { return this.seg?.def.id ?? ''; }

  pedir(e: EstadoMusical, prioridade = PRIORIDADE[e]) {
    if (e === this.atual) { this.pend = null; return; }
    if (this.pend && this.pend.e === e) { this.pend.prio = Math.max(this.pend.prio, prioridade); return; }
    this.pend = { e, prio: prioridade, desde: null };
  }
  /** silêncio total imediato por `seg` segundos (morte: 1,5 s; abate do Colosso: 4 s); o adaptador cala as notas que soam */
  cortar(seg: number) { this.cortePend = Math.max(this.cortePend ?? 0, seg); }
  /** cortes aplicados desde a última chamada (o adaptador chama orquestra.calar) */
  tirarCortes(): Corte[] { const c = this.cortes; this.cortes = []; return c; }
  /** stinger no pulso: atrasa até o próximo meio-tempo SE ele estiver a ≤ `tol` s; senão toca já (latência de jogo primeiro) */
  quantizar(t: number, tol = 0.12): number {
    const s = this.seg; if (!s) return t; const meio = s.durTempo / 2, prox = s.ini + Math.ceil((t - s.ini) / meio - 1e-9) * meio;
    return prox - t <= tol ? prox : t;
  }

  agendar(agora: number, janela: number): NotaAgendada[] {
    const out: NotaAgendada[] = [], fim = agora + janela;
    if (this.cursor === null || this.cursor < agora - 1) { this.cursor = agora; if (this.seg && this.seg.fim < agora) this.seg = null; } // 1ª chamada ou volta do segundo plano
    if (this.cortePend !== null) { this.cortes.push({ t: agora, seg: this.cortePend }); this.silencioAte = agora + this.cortePend; this.respiro = false; this.cortePend = null; this.seg = null; this.cursor = Math.max(this.cursor, agora); }
    if (this.pend && this.pend.desde === null) this.pend.desde = agora;
    for (let guarda = 0; this.cursor < fim && guarda < 256; guarda++) {
      const c = this.cursor;
      if (!this.seg) {
        if (this.silencioAte > c) {
          if (this.respiro && this.pend && URGENTE.has(this.pend.e) && this.permitido(c)) this.silencioAte = c; // o perigo volta: o respiro acaba
          else { this.cursor = Math.min(fim, this.silencioAte); continue; }
        }
        if (this.aplicarPendente(c, true)) continue; // pode ter aberto um respiro
        this.seg = this.iniciar(this.escolher(c), c); continue;
      }
      // urgente: combate/Colosso/morte/vitória entram no próximo tempo; e o silêncio não tem frase a respeitar
      const s = this.seg, urg = !!this.pend && (URGENTE.has(this.pend.e) || this.atual === 'silencio') && this.pend.prio > PRIORIDADE[this.atual];
      const passo = urg ? s.durTempo : s.durBarra, lim = Math.min(s.fim, s.ini + (Math.floor((c - s.ini) / passo + 1e-9) + 1) * passo), ate = Math.min(fim, lim);
      this.emitir(s, c, ate, out); this.cursor = ate;
      if (ate === lim) {
        const acabou = lim >= s.fim - 1e-9;
        if (acabou || this.podeSair(s, lim, urg)) { this.contar(s, lim); this.seg = null; this.aplicarPendente(lim, false, { ini: s.ini, durBarra: s.durBarra, durTempo: s.durTempo }, urg); }
      }
    }
    return out;
  }

  salvar(): SalvoMaestro { return { k: this.k }; }
  carregar(s: SalvoMaestro | undefined) { if (s && Number.isFinite(s.k)) this.k = s.k; }

  // ---------------------------------------------------------------- por dentro
  private permitido(t: number): boolean {
    const p = this.pend; if (!p || p.e === this.atual) return false;
    if (p.prio > PRIORIDADE[this.atual]) return true;
    return t - (p.desde ?? t) >= (HISTERESE[this.atual] ?? 0);
  }
  private podeSair(s: Tocando, t: number, urg: boolean) {
    if (!this.permitido(t)) return false; if (urg) return true;
    const i = Math.round((t - s.ini) / s.durBarra), sa = s.def.saidas;
    return !sa || sa.includes(i) || (s.def.elastico !== undefined) || (this.pend!.prio > PRIORIDADE[this.atual] && this.pend!.prio >= 3);
  }
  /** troca de estado se o pedido pendente puder entrar em `t`; devolve true se abriu um respiro (silêncio) */
  private aplicarPendente(t: number, livre: boolean, antes?: Transicao['antes'], urgente = false): boolean {
    if (!this.permitido(t)) return false;
    const p = this.pend!, de = this.atual; this.atual = p.e; this.pend = null; this.unicos.clear(); this.entrou = true; void livre;
    this.log.push({ t, de, para: p.e, seg: '', antes, urgente }); if (this.log.length > 64) this.log.shift();
    if (AGITADO.has(de) && !AGITADO.has(p.e) && p.e !== 'morte' && p.e !== 'vitoria') {
      const [a, b] = RESPIRO_S; this.silencioAte = t + new Rng(`${this.seed}:respiro:${this.k}`).range(a, b); this.respiro = true; this.ultimoMelodico = true; return true;
    }
    return false;
  }
  private escolher(t: number): Segmento {
    const e = this.atual; let cands = this.segmentos.filter(s => s.estados.includes(e) && (!s.quando || s.quando(this.ctx)));
    const silencio = this.segmentos.find(s => s.id === 'silencio')!;
    if (!cands.length) return silencio;
    const vivos = cands.filter(s => !s.unico || !this.unicos.has(s.id)); if (!vivos.length) return silencio; // o único já tocou: fica o silêncio
    cands = vivos;
    const rng = new Rng(`${this.seed}:${this.k++}`);
    // exploração/menu: bloco melódico, depois silêncio musical (só a cama) — a melodia fica abaixo de ~35% do tempo
    const abre = this.entrou ? cands.find(s => s.abertura) : undefined; this.entrou = false; if (abre) return abre; // cada estado pode ter um segmento de entrada fixo
    const ar = cands.filter(s => !s.melodia);
    if (e === 'exploracao' && this.ultimoMelodico && ar.length) return rng.pick(ar);
    while (this.temaInicios.length && this.temaInicios[0] < t - 3600) this.temaInicios.shift();
    let ok = cands.filter(s => {
      if (s.melodia && (this.ultimoInicio.get(s.id) ?? -Infinity) > t - SEM_REPETIR_S) return false;
      if (s.tema && this.temaInicios.length >= TEMA_POR_HORA) return false;
      return true;
    });
    // abrigo: depois de uma melodia vem o respiro (silêncio como recurso)
    const calmo = e !== 'combate' && e !== 'tensao' && e !== 'colosso';
    if (calmo && this.ultimoMelodico && ok.some(s => !s.melodia)) ok = ok.filter(s => !s.melodia);
    else if (calmo && !this.ultimoMelodico && ok.some(s => s.melodia)) ok = ok.filter(s => s.melodia);
    if (!ok.length) ok = ar.length ? ar : [silencio];
    const semUltimo = ok.filter(s => s.id !== this.ultimoSeg); if (semUltimo.length) ok = semUltimo; // A/A′/A″: não repetir o último
    return rng.peso(ok.map(s => [s, s.peso ?? 1] as const));
  }
  private iniciar(def: Segmento, t: number): Tocando {
    const durTempo = 60 / def.bpm, durBarra = durTempo * def.porBarra;
    let barras = def.barras;
    if (def.elastico) { const [a, b] = def.elastico, s = new Rng(`${this.seed}:ar:${this.k}`).range(a, b); barras = Math.max(1, Math.round(s / durBarra)); }
    const porBarraNotas: NotaPart[][] = Array.from({ length: def.barras }, () => []), offs = new Map<NotaPart, number>();
    for (const n of def.notas) { const i = Math.min(def.barras - 1, Math.floor(n.b / def.porBarra + 1e-9)); porBarraNotas[i].push(n); }
    if (def.humano) for (const lista of porBarraNotas) {
      const grupos = new Map<number, NotaPart[]>(); for (const n of lista) { const g = grupos.get(n.b) ?? []; g.push(n); grupos.set(n.b, g); }
      for (const [b, g] of grupos) { const pos = Math.floor(b % def.porBarra), base = Number.isInteger(b) ? HUMANO[pos % HUMANO.length] : 0.008; g.filter(n => n.voz === 'viola').sort((x, y) => x.m - y.m).forEach((n, j) => offs.set(n, base + j * ARPEJO_S)); }
    }
    if (def.tema) this.temaInicios.push(t);
    if (def.unico) this.unicos.add(def.id);
    this.respiro = false;
    this.ultimoInicio.set(def.id, t); this.ultimoSeg = def.id; this.ultimoMelodico = def.melodia;
    const ult = this.log[this.log.length - 1]; if (ult && !ult.seg) ult.seg = def.id;
    return { def, ini: t, barras, durBarra, durTempo, fim: t + barras * durBarra, porBarraNotas, offs };
  }
  private emitir(s: Tocando, de: number, ate: number, out: NotaAgendada[]) {
    const i0 = Math.max(0, Math.floor((de - s.ini) / s.durBarra + 1e-9)), i1 = Math.min(s.barras - 1, Math.floor((ate - s.ini) / s.durBarra - 1e-9));
    for (let i = i0; i <= i1; i++) {
      const padrao = s.porBarraNotas[i % s.def.barras], deslocBarra = Math.floor(i / s.def.barras) * s.def.barras * s.durBarra;
      for (const n of padrao) {
        const base = s.ini + deslocBarra + n.b * s.durTempo; if (base < de - 1e-9 || base >= ate - 1e-9) continue;
        out.push({ t: base + (s.offs.get(n) ?? 0), dur: n.d * s.durTempo, voz: n.voz, midi: n.m, vel: n.v, pan: n.pan });
      }
    }
  }
  private contar(s: Tocando, ate = s.fim) {
    const dur = Math.max(0, ate - s.ini), c = this.tempoMelodia[this.atual] ?? [0, 0];
    c[0] += s.def.melodia ? dur : 0; c[1] += dur; this.tempoMelodia[this.atual] = c;
  }
}
