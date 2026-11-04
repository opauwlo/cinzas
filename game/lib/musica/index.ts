// lib de MÚSICA do CINZAS — "O Brasil que sobrou toca no rádio, fora do tom".
// API pública + ModuloJogo 'musica'. O diretor decide o ESTADO musical pelo Mundo (perigo, zona base, hora, interior, furtivo)
// e pelos eventos do barramento (dano, abate do Colosso, viagem, morte, vitória, transmissão e pedidos 'musica'); o maestro decide a NOTA.
// Puro: roda em Node. O som sai por orquestra.ts, ligado em game/audio.ts.
import type { EstadoMusical, ModuloJogo, Mundo } from '../../nucleo/contratos';
import { barramento, type Barramento } from '../../nucleo/barramento';
import { MaestroCinzas, PRIORIDADE, type SalvoMaestro } from './maestro';

export { MaestroCinzas, PRIORIDADE, HISTERESE } from './maestro';
export { SEGMENTOS, STINGERS, VINHETA, FRASE, MOTIVO_M, RESPOSTA_R, AUTORIA_PARTITURA, hz } from './partitura';

/** o que a cena diz ao diretor (do Mundo, ou da chamada ambiente() de audio.ts quando o módulo ainda não está registrado) */
export type EntradaMusica = { perigo: number; base: boolean; hora: number; interior: boolean; furtivo: boolean; bioma: string; ato: number; hp01: number };
/** mistura que o adaptador aplica no barramento de música: passa-baixa (Hz) e ganho (dB) */
export type MixMusica = { corte: number; ganhoDb: number };
const GANGUES = new Set(['saqueador', 'miliciano']);

export class DiretorMusical {
  readonly maestro = new MaestroCinzas();
  readonly mix: MixMusica = { corte: 20000, ganhoDb: 0 };
  /** 0..1 — o batimento de audio.ts acelera conforme cai */
  vida01 = 1;
  private externo: { e: EstadoMusical; prio: number } | null = null;
  private morto = false; private venceu = false; private viajando = false;
  private tPerigo = 0; private tCombate = 0; private desdeDano = 99; private desdeColosso = 99; private desdeGangue = 99; private falando = 0;
  private ultimoTick = -1; private relogio = 0;
  private offs: (() => void)[] = []; private ligadoEm: Barramento | null = null;

  /** inscreve no barramento (idempotente) */
  ligar(b: Barramento) {
    if (this.ligadoEm === b) return; this.desligar(); this.ligadoEm = b;
    this.offs.push(
      b.on('dano', e => { this.desdeDano = 0; if (e.fonte === 'colosso') this.desdeColosso = 0; if (e.fonte && GANGUES.has(e.fonte)) this.desdeGangue = 0; }),
      b.on('abate', e => { if (e.arq === 'colosso') { this.desdeColosso = 99; this.maestro.cortar(4); } else if (GANGUES.has(e.arq)) this.desdeGangue = 0; }),
      b.on('viagem', e => { this.viajando = e.fase === 'inicio'; }),
      b.on('morte', () => { if (this.morto) return; this.morto = true; this.maestro.cortar(1.5); this.maestro.pedir('morte'); }),
      b.on('vitoria', () => { this.venceu = true; this.maestro.pedir('vitoria'); }),
      b.on('musica', e => { this.externo = (e.prioridade ?? 0) < 0 ? null : { e: e.estado, prio: e.prioridade ?? PRIORIDADE[e.estado] }; }),
      b.on('transmissao', e => { this.falando = e.fase === 'fim' ? 0 : 1; }),
      b.on('zona', e => { this.maestro.semear(e.seed); }),
    );
  }
  desligar() { for (const f of this.offs) f(); this.offs = []; this.ligadoEm = null; }

  /** o menu chama no primeiro toque (via audio.iniciarMenu) */
  menu() { this.externo = { e: 'menu', prio: 1 }; this.morto = false; this.venceu = false; this.maestro.pedir('menu'); }
  /** a tela de viagem (motor.ligar/parar) */
  viagem(sim: boolean) { this.viajando = sim; }
  /** a cena pode avisar o Colosso a < 20 tiles sem evento novo */
  colossoPerto() { this.desdeColosso = 0; }

  /** decide o estado a cada quadro (≤ 1 ms: só aritmética) */
  atualizar(dt: number, en: EntradaMusica): EstadoMusical {
    this.relogio += dt; this.desdeDano += dt; this.desdeColosso += dt; this.desdeGangue += dt; this.vida01 = en.hp01;
    const I = Math.min(1, en.perigo); this.tPerigo = I >= 0.25 ? this.tPerigo + dt : 0; this.tCombate = I >= 0.6 ? this.tCombate + dt : 0;
    const noite = en.hora < 6 || en.hora >= 20;
    this.maestro.contexto({ ato: en.ato, noite, amanhecer: en.hora >= 5 && en.hora < 8, bioma: en.base ? 'base' : en.bioma, gangue: this.desdeGangue < 20 });
    let e: EstadoMusical, prio: number | undefined;
    if (this.venceu) e = 'vitoria';
    else if (this.morto) e = 'morte';
    else if (this.desdeColosso < 6) e = 'colosso';
    else if (this.tCombate >= 1 || this.desdeDano < 3) e = 'combate';
    else if (this.viajando) e = 'viagem';
    else if (this.tPerigo >= 1.5) e = 'tensao';
    else e = en.base ? 'abrigo' : 'exploracao';
    if (this.externo && this.externo.prio >= PRIORIDADE[e] && !this.venceu && !this.morto) { e = this.externo.e; prio = this.externo.prio; }
    this.maestro.pedir(e, prio);
    // mistura: furtivo = passa-baixa de 900 Hz e −6 dB; dentro de casa abafa; rádio falando = −9 dB e sem brilho
    this.mix.corte = en.furtivo ? 900 : en.interior ? 2600 : 20000;
    this.mix.ganhoDb = (en.furtivo ? -6 : 0) + (this.falando ? -9 : 0);
    return e;
  }
  /** caminho do ModuloJogo: lê a fachada Mundo */
  tick(dt: number, m: Mundo) {
    this.ultimoTick = this.relogio + dt;
    this.atualizar(dt, { perigo: m.perigo, base: m.zona.id === 'base', hora: m.hora, interior: m.interior, furtivo: m.jogador.furtivo, bioma: m.zona.bioma, ato: m.ato, hp01: m.jogador.maxHp > 0 ? m.jogador.hp / m.jogador.maxHp : 1 });
  }
  /** caminho de reserva: audio.ambiente() chama ~10×/s; só decide se o módulo não estiver recebendo tick (não registrado ainda) */
  pelaCena(dt: number, e: { perigo?: number; bioma?: string; hora?: number; interior?: boolean }) {
    if (this.relogio - this.ultimoTick < 1 && this.ultimoTick >= 0) return;
    this.atualizar(dt, { perigo: e.perigo ?? 0, base: e.bioma === 'campo', hora: e.hora ?? 12, interior: !!e.interior, furtivo: false, bioma: e.bioma ?? 'ermo', ato: 2, hp01: this.vida01 });
  }
  /** nova run (zona nova depois da morte, ou um save carregado) */
  reiniciar(seed?: string) { this.morto = false; this.venceu = false; this.externo = null; this.desdeDano = 99; this.desdeColosso = 99; if (seed) this.maestro.semear(seed); }
}

/** a instância do jogo (audio.ts e o módulo usam a mesma) */
export const musica = new DiretorMusical();

export type SalvoMusica = { maestro: SalvoMaestro };
/** módulo para game/nucleo/modulos.ts */
export const moduloMusica: ModuloJogo<SalvoMusica> = {
  id: 'musica',
  iniciar(m) { musica.ligar(barramento); musica.reiniciar(m.seed); },
  tick(dt, m) { musica.tick(dt, m); },
  salvar() { return { maestro: musica.maestro.salvar() }; },
  carregar(s) { musica.maestro.carregar(s?.maestro); },
};
