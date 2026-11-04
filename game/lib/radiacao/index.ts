// Lib de radiação (pilar "Ouvir o invisível"): campo vivo + dosímetro + Geiger direcional + pó azul.
// A cena liga pelo ModuloJogo `moduloRadiacao` (registrado em game/nucleo/modulos.ts) e lê `radiacao.*` — ver INTEGRACAO.md.
import type { ModuloJogo, Mundo, LeituraGeiger } from '../../nucleo/contratos';
import { barramento as barramentoJogo, type Barramento } from '../../nucleo/barramento';
import { CampoCinzas, criarCampo } from './campo';
import { DosimetroCinzas, EFEITO_DEGRAU } from './dose';
import { leituraGeiger, nivelDe, CPM_FUNDO, CPM_POR_TAXA } from './geiger';
import { RoupaPo } from './po';

export { CampoCinzas, criarCampo, FIS, G, CHANCE_PO } from './campo';
export { DosimetroCinzas, DOSE, EFEITO_DEGRAU, degrauDe, ganhoContaminacao, type Protecao } from './dose';
export { leituraGeiger, setaPan, nivelDe, CPM_FUNDO, CPM_POR_TAXA } from './geiger';
export { RoupaPo, PO } from './po';

/** frequência da física (Hz) e do evento 'geiger' no barramento */
export const HZ_CAMPO = 2, HZ_GEIGER = 5;
/** quanto o ar entra num interior (o chão de dentro continua contando, como hoje) */
export const AR_INTERIOR = 0.3;

export type SaveRadiacao = { v: 1; dose: number; po: number; /** pó deixado por zona (lista esparsa índice → quantidade) */ rastros: Record<string, [number, number][]> };

export class SistemaRadiacao implements ModuloJogo<SaveRadiacao> {
  readonly id = 'radiacao';
  campo: CampoCinzas | null = null;
  readonly dosimetro = new DosimetroCinzas();
  readonly roupa = new RoupaPo();
  /** a cena liga quando o jogador tem o perk 'imune' */
  imune = false;
  private zonaId = '';
  private rastros: Record<string, [number, number][]> = {};
  private acum = 0; private acumGeiger = 0; private ultMin = NaN;
  private taxaAgora = 0; private suave = 0; private cpmSuave = CPM_FUNDO;
  private ult: LeituraGeiger = { cpm: CPM_FUNDO, pan: 0, nivel: 0 };
  private desinscrever: (() => void) | null = null;

  constructor(private bus: Barramento = barramentoJogo) {}

  iniciar(m: Mundo) {
    this.guardarRastro();
    this.campo = criarCampo(m.zona, m.seed); this.zonaId = m.zona.id;
    const r = this.rastros[m.zona.id]; if (r) this.campo.importarPo(r);
    this.roupa.esquecerPosicao(); this.acum = 0; this.ultMin = m.minutos;
    this.desinscrever?.();
    this.desinscrever = this.bus.on('abate', e => { if (e.arq === 'colosso' && this.campo) this.campo.adicionarFonte({ x: e.x, y: e.y, forca: 0.7, tipo: 'colosso' }); });
  }

  tick(dt: number, m: Mundo) {
    if (!this.campo || this.zonaId !== m.zona.id) this.iniciar(m);
    const c = this.campo!, J = m.jogador, cl = m.clima;
    // física a 2 Hz (no máximo um passo por quadro: num engasgo a pluma atrasa, o quadro não)
    this.acum += dt; if (this.acum >= 1 / HZ_CAMPO) { c.passo(this.acum, cl); this.acum = 0; }
    this.roupa.passo(c, J.x, J.y, dt, cl.chuva, m.interior);
    const chao = c.amostraChao(J.x, J.y), ar = c.amostraAr(J.x, J.y) - c.acida, acida = m.interior ? 0 : c.acida;
    this.taxaAgora = chao + ar * (m.interior ? AR_INTERIOR : 1) + acida + this.roupa.taxa();
    this.dosimetro.absorver(this.taxaAgora, dt, { mascara: J.mascara, interior: m.interior, imune: this.imune });
    if (!Number.isNaN(this.ultMin)) this.dosimetro.recuperar(m.minutos - this.ultMin); this.ultMin = m.minutos;
    // o mesmo amortecimento de hoje (cena.ts: radSuave dt×4, cpm dt×3)
    this.suave += (this.taxaAgora - this.suave) * Math.min(1, dt * 4);
    this.cpmSuave += (CPM_FUNDO + this.suave * CPM_POR_TAXA - this.cpmSuave) * Math.min(1, dt * 3);
    this.acumGeiger += dt;
    if (this.acumGeiger >= 1 / HZ_GEIGER) {
      this.acumGeiger = 0;
      const l = leituraGeiger(c, J.x, J.y, this.roupa.taxa());
      this.ult = { cpm: Math.round(this.cpmSuave), pan: Math.round(l.pan * 100) / 100, nivel: nivelDe(this.cpmSuave) };
      this.bus.emit({ t: 'geiger', ...this.ult });
    }
  }

  // ---------------------------------------------------------------- o que a cena lê
  /** taxa amortecida no jogador (troca o `radSuave` da cena) */
  taxaJogador() { return this.suave; }
  /** taxa sem amortecer (para o ganho de contaminação, que hoje usa o valor cru da casa) */
  taxaInstantanea() { return this.taxaAgora; }
  cpm() { return this.cpmSuave; }
  leitura(): LeituraGeiger { return this.ult; }
  efeitoDose() { return EFEITO_DEGRAU[this.dosimetro.degrau()]; }
  /** quanto pó azul está na roupa (0..1), para HUD/arte (brilho azul nas mãos) */
  poNaRoupa() { return this.roupa.q; }

  // ---------------------------------------------------------------- o que a cena manda
  lavar(x: number, y: number) { this.roupa.lavar(this.campo, x, y); }
  somarDose(q: number) { this.dosimetro.somar(q); }

  // ---------------------------------------------------------------- save
  private guardarRastro() {
    if (!this.campo || !this.zonaId) return;
    const l = this.campo.exportarPo(); delete this.rastros[this.zonaId];
    if (l.length) this.rastros[this.zonaId] = l;
    const ks = Object.keys(this.rastros); for (let i = 0; i < ks.length - 8; i++) delete this.rastros[ks[i]]; // até 8 zonas (as mais recentes)
  }
  salvar(): SaveRadiacao {
    this.guardarRastro();
    return { v: 1, dose: Math.round(this.dosimetro.dose * 100) / 100, po: Math.round(this.roupa.q * 1000) / 1000, rastros: { ...this.rastros } };
  }
  carregar(s: SaveRadiacao | undefined) {
    this.dosimetro.dose = Math.max(0, Number(s?.dose) || 0); this.roupa.q = Math.min(1, Math.max(0, Number(s?.po) || 0));
    this.rastros = s?.rastros && typeof s.rastros === 'object' ? { ...s.rastros } : {};
    this.campo = null; this.zonaId = '';
  }
}

export const criarModuloRadiacao = (bus?: Barramento) => new SistemaRadiacao(bus);
/** a instância única do jogo: registre `radiacao` em game/nucleo/modulos.ts */
export const radiacao = new SistemaRadiacao();
export const moduloRadiacao: ModuloJogo = radiacao as ModuloJogo;
