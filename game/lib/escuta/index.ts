// Lib de ESCUTA — pilar "Toda voz tem interesse". "O Geiger não mente. O rádio, sim."
// No abrigo (zona `base`) o rádio pega: a programação (seed + dia + minuto + ato) decide o que está no ar, a fala passa
// no balão de rádio e cada alegação vira ficha no Caderno. Os instrumentos honestos resolvem as fichas.
// Barramento: ouve `zona`, `geiger`, `minuto`; emite `transmissao` (inicio/fala/fim) e `caderno`.
// Puro: sem Phaser, sem DOM (os adaptadores React são CadernoPainel.tsx e RadioBalao.tsx).
import type { Alegacao, FalaRadio, FichaCaderno, Instrumento, ModuloJogo, Mundo, Transmissao } from '../../nucleo/contratos';
import { Barramento, barramento as barramentoGlobal } from '../../nucleo/barramento';
import { CadernoEscuta, type Eco, type FichaEscuta, type SalvoCaderno } from './caderno';
import { ProgramacaoEscuta, type NoAr } from './programacao';
import { MemoriaEntreVidas, type Assinatura, type MemoriaSalva } from './memoria';
import { AMOSTRAS } from './amostras';
import { hhmm } from './textos';

export { CadernoEscuta, ProgramacaoEscuta, MemoriaEntreVidas, AMOSTRAS };
export type { FichaEscuta, Eco, NoAr, Assinatura, MemoriaSalva, SalvoCaderno };
export * from './verificacao';
export * from './textos';
export { MINUTO_FAROL, LOOP_FAROL, DURACAO_JANELA, JANELAS } from './programacao';

export const ZONA_RADIO = 'base';
/** segundos REAIS que uma fala fica na fita (lê-se com calma no celular) */
export const segundosDaFala = (texto: string) => Math.max(3.5, Math.min(9, 2 + texto.length * 0.06));

export type BalaoRadio = { transmissaoId: string; frequencia: string; hora: string; fala: FalaRadio; idx: number; total: number; nota: string | null };
export type SalvoEscuta = { v: 1; vida: number; ato: number | null; caderno: SalvoCaderno; tocadas: string[] };

type Tocando = { x: NoAr; idx: number; resto: number; ouvidas: Set<string> };

export class Escuta {
  readonly programacao: ProgramacaoEscuta;
  readonly caderno: CadernoEscuta;
  readonly memoria = new MemoriaEntreVidas();
  private alegs = new Map<string, Alegacao>();
  private zona = ''; private seed = ''; private ato: number | null = null; private dia = 1; private minutoAbs = -1;
  private tocando: Tocando | null = null;
  private tocadas: string[] = [];
  private desligar: (() => void)[] = [];
  private ouvintes = new Set<() => void>(); private v = 0;
  private gravarMeta: ((m: MemoriaSalva) => void) | null = null;

  constructor(private bus: Barramento, catalogo: readonly Transmissao[] = AMOSTRAS) {
    this.programacao = new ProgramacaoEscuta();
    this.caderno = new CadernoEscuta({
      buscar: id => this.alegs.get(id),
      lembrar: a => this.memoria.lembrar(a),
      aoMudar: f => this.mudou(f),
    });
    this.catalogo(catalogo);
  }

  // ------------------------------------------------------------ conteúdo e ligação
  /** a coordenação injeta o conteúdo da Narrativa (TRANSMISSOES: Transmissao[]) */
  catalogo(trans: readonly Transmissao[]) {
    this.programacao.trocar(trans); this.alegs.clear();
    for (const t of trans) for (const a of t.alegacoes) this.alegs.set(a.id, a);
    this.avisar();
  }
  /** inscreve no barramento (idempotente; a cena chama carregar/iniciar antes de emitir `zona`) */
  ligar() {
    if (this.desligar.length) return;
    this.desligar.push(
      this.bus.on('zona', e => this.chegou(e.zonaId)),
      this.bus.on('minuto', e => this.aoMinuto(e.minutos)),
      this.bus.on('geiger', e => this.leu(e.cpm)),
    );
  }
  desligarBarramento() { for (const f of this.desligar) f(); this.desligar = []; }

  // ------------------------------------------------------------ ModuloJogo
  readonly modulo: ModuloJogo<SalvoEscuta> = {
    id: 'escuta',
    iniciar: m => { this.ligar(); this.sincronizar(m); this.chegou(m.zona.id); },
    tick: (dt, m) => {
      this.sincronizar(m);
      const mi = Math.floor(m.minutos); if (mi !== this.minutoAbs) this.aoMinuto(mi);
      if (this.tocando) { this.tocando.resto -= dt; if (this.tocando.resto <= 0) this.avancar(); }
    },
    salvar: () => ({ v: 1, vida: this.memoria.vida, ato: this.ato, caderno: this.caderno.salvar(), tocadas: [...this.tocadas] }),
    carregar: s => {
      this.ligar(); this.tocando = null; this.zona = ''; this.minutoAbs = -1;
      if (s && s.v === 1) { this.memoria.usarVida(s.vida); this.ato = s.ato; this.caderno.carregar(s.caderno); this.tocadas = [...(s.tocadas ?? [])]; }
      else { this.memoria.novaVida(); this.ato = null; this.caderno.carregar(undefined); this.tocadas = []; this.persistirMeta(); }
      this.avisar();
    },
  };

  private sincronizar(m: Mundo) {
    this.seed = m.seed; this.dia = m.dia;
    if (this.ato !== null && m.ato > this.ato) this.revelarAto(this.ato); // virou o ato: a Revelação diegética fecha o que ficou aberto
    this.ato = m.ato;
  }

  // ------------------------------------------------------------ eventos do mundo
  private chegou(zonaId: string) {
    if (!zonaId || zonaId === this.zona) return;
    this.zona = zonaId;
    if (this.tocando && zonaId !== ZONA_RADIO) this.fim(false);
    this.caderno.registrarVisita(zonaId, this.dia);
  }
  private leu(cpm: number) { if (this.zona) this.caderno.registrarLeitura(this.zona, this.dia, cpm); }
  private aoMinuto(minutos: number) {
    this.minutoAbs = minutos; this.dia = Math.floor(minutos / 1440) + 1;
    if (this.zona !== ZONA_RADIO || this.tocando || this.ato === null || !this.seed) return;
    const x = this.programacao.janela(this.seed, this.dia, minutos % 1440, this.ato); if (!x) return;
    const chave = `${x.t.id}@${x.dia}`; if (this.tocadas.includes(chave)) return;
    this.tocadas.push(chave); if (this.tocadas.length > 60) this.tocadas.shift();
    this.tocando = { x, idx: -1, resto: 0, ouvidas: new Set() };
    this.caderno.sintonizar(x.t, x.dia); this.memoria.ouviu(x.t, x.minuto);
    this.bus.emit({ t: 'transmissao', id: x.t.id, fase: 'inicio' });
    this.avancar();
  }

  // ------------------------------------------------------------ o rádio tocando
  /** passa para a próxima fala (também é o toque no balão) */
  avancar() {
    const p = this.tocando; if (!p) return;
    p.idx++;
    if (p.idx >= p.x.t.falas.length) { this.fim(true); return; }
    const f = p.x.t.falas[p.idx]; p.resto = segundosDaFala(f.texto);
    this.memoria.falou(p.x.t, f, p.x.dia);
    if (f.alegacao) this.ouvirAlegacoes(p, [f.alegacao]);
    this.bus.emit({ t: 'transmissao', id: p.x.t.id, fase: 'fala', fala: p.idx });
    this.persistirMeta(); this.avisar();
  }
  private ouvirAlegacoes(p: Tocando, ids: string[]) {
    const novas = ids.filter(id => !p.ouvidas.has(id)); if (!novas.length) return;
    for (const id of novas) p.ouvidas.add(id);
    this.caderno.ouvir({ ...p.x.t, alegacoes: p.x.t.alegacoes.filter(a => novas.includes(a.id)) }, p.x.dia);
  }
  /** completa = ouviu até o fim (alegações que não estão presas a uma fala só contam assim) */
  private fim(completa: boolean) {
    const p = this.tocando; if (!p) return;
    if (completa) this.ouvirAlegacoes(p, p.x.t.alegacoes.map(a => a.id));
    this.tocando = null;
    this.bus.emit({ t: 'transmissao', id: p.x.t.id, fase: 'fim' });
    this.avisar();
  }
  balao(): BalaoRadio | null {
    const p = this.tocando; if (!p || p.idx < 0) return null;
    const fala = p.x.t.falas[p.idx];
    return { transmissaoId: p.x.t.id, frequencia: p.x.t.frequencia, hora: hhmm(p.x.minuto), fala, idx: p.idx, total: p.x.t.falas.length, nota: this.memoria.notaDeMargem(p.x.t.emissor, fala.texto) };
  }

  // ------------------------------------------------------------ verificação (API para painel e coordenação)
  fichas(): readonly FichaEscuta[] { return this.caderno.fichas(); }
  ecos(): readonly Eco[] { return this.caderno.ecos(); }
  assinaturas(): Assinatura[] { return this.memoria.assinaturas(); }
  /** instrumentos manuais disponíveis agora (triangular só no abrigo) */
  manuais(alegacaoId: string): Instrumento[] { return this.caderno.manuais(alegacaoId).filter(i => i !== 'triangular' || this.zona === ZONA_RADIO); }
  /** a coordenação cobra 1 h + 1 bateria ANTES de chamar (custo visível no botão) */
  triangular(alegacaoId: string): FichaCaderno | null { return this.zona === ZONA_RADIO ? this.caderno.verificar(alegacaoId, 'triangular', this.dia) : null; }
  cruzar(alegacaoId: string): FichaCaderno | null { return this.caderno.verificar(alegacaoId, 'cruzar', this.dia); }
  /** bilhete lido / NPC que citou a transmissão: habilita "Cruzar" na ficha */
  registrarPista(alegacaoId: string): boolean { const r = this.caderno.registrarPista(alegacaoId); this.avisar(); return r; }
  revelarAto(ato: number): FichaEscuta[] { const r = this.caderno.revelarAto(ato, this.dia); this.avisar(); return r; }
  noAbrigo() { return this.zona === ZONA_RADIO; }
  /** a próxima janela do dial (para o rádio do abrigo listar "o que vai tocar"): horário e frequência, sem conteúdo */
  proximas(n = 3) { return this.ato === null ? [] : this.programacao.proximas(this.seed, this.dia, Math.max(0, this.minutoAbs) % 1440, this.ato, n).map(x => ({ frequencia: x.t.frequencia, hora: hhmm(x.minuto), dia: x.dia })); }

  private mudou(f: FichaEscuta) {
    this.bus.emit({ t: 'caderno', alegacaoId: f.alegacaoId, estado: f.estado });
    const a = this.alegs.get(f.alegacaoId);
    if (a && f.comoDescobri && !f.nuncaFoiVer && !f.vidaDescoberta && f.estado !== 'aberta') { this.memoria.aprendeu(f, a); this.persistirMeta(); }
    this.avisar();
  }

  // ------------------------------------------------------------ memória entre vidas (meta, fora do save da run)
  salvarMeta(): MemoriaSalva { return this.memoria.salvar(); }
  carregarMeta(m: unknown) { this.memoria.carregar(m); this.avisar(); }
  /** a coordenação passa quem grava (ex.: localStorage 'cinzas.escuta'); chamado quando a memória muda */
  aoGravarMeta(fn: ((m: MemoriaSalva) => void) | null) { this.gravarMeta = fn; }
  private persistirMeta() { try { this.gravarMeta?.(this.memoria.salvar()); } catch { /* sem storage */ } }

  // ------------------------------------------------------------ para React (useSyncExternalStore)
  inscrever = (fn: () => void) => { this.ouvintes.add(fn); return () => { this.ouvintes.delete(fn); }; };
  versao = () => this.v;
  private avisar() { this.v++; for (const fn of this.ouvintes) { try { fn(); } catch { /* um painel quebrado não para o rádio */ } } }
}

/** cria uma Escuta (testes usam um barramento próprio) */
export const criarEscuta = (bus: Barramento = barramentoGlobal, cat: readonly Transmissao[] = AMOSTRAS) => new Escuta(bus, cat);

/** a instância do jogo, no barramento global; começa com as AMOSTRAS até a coordenação chamar `catalogo()` */
export const escuta = criarEscuta();
export const moduloEscuta: ModuloJogo<SalvoEscuta> = escuta.modulo;
/** a coordenação injeta o conteúdo da Narrativa */
export const catalogo = (trans: Transmissao[]) => escuta.catalogo(trans);
