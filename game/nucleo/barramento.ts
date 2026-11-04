// Barramento de eventos do jogo: é por aqui que as libs de área (radiação, escuta, música, arte, narrativa, produção)
// conversam com a cena e entre si, sem importar umas às outras. Puro: sem Phaser, sem DOM — roda nos testes em Node.
import type { EstadoMusical } from './contratos';

export type EventoJogo =
  | { t: 'zona'; zonaId: string; bioma: string; seed: string }
  | { t: 'minuto'; minutos: number }
  | { t: 'ruido'; x: number; y: number; raio: number }
  | { t: 'dano'; quem: 'jogador' | 'criatura'; valor: number; fonte?: string }
  | { t: 'abate'; arq: string; x: number; y: number }
  | { t: 'saque'; item: string; q: number; raro: boolean }
  | { t: 'viagem'; de: string; para: string; fase: 'inicio' | 'fim' }
  | { t: 'morte'; causa: string }
  | { t: 'vitoria' }
  | { t: 'musica'; estado: EstadoMusical; prioridade?: number }
  | { t: 'geiger'; cpm: number; pan: number; nivel: 0 | 1 | 2 | 3 }
  | { t: 'transmissao'; id: string; fase: 'inicio' | 'fala' | 'fim'; fala?: number }
  | { t: 'caderno'; alegacaoId: string; estado: 'aberta' | 'verdade' | 'falso' | 'meia' }
  | { t: 'telemetria'; nome: string; dados?: Record<string, number | string | boolean> };

export type TipoEvento = EventoJogo['t'];
export type EventoDe<T extends TipoEvento> = Extract<EventoJogo, { t: T }>;
type Ouvinte<T extends TipoEvento> = (e: EventoDe<T>) => void;

export class Barramento {
  private ouvintes = new Map<TipoEvento, Set<(e: EventoJogo) => void>>();
  private todos = new Set<(e: EventoJogo) => void>();
  /** inscreve um ouvinte; devolve a função que cancela a inscrição */
  on<T extends TipoEvento>(t: T, fn: Ouvinte<T>): () => void {
    let s = this.ouvintes.get(t); if (!s) { s = new Set(); this.ouvintes.set(t, s); }
    const f = fn as (e: EventoJogo) => void; s.add(f); return () => s!.delete(f);
  }
  /** ouve todo evento (telemetria, depuração) */
  qualquer(fn: (e: EventoJogo) => void): () => void { this.todos.add(fn); return () => this.todos.delete(fn); }
  /** um ouvinte que quebra não derruba os outros nem o jogo */
  emit(e: EventoJogo) {
    for (const fn of this.ouvintes.get(e.t) ?? []) { try { fn(e); } catch (err) { console.error('[barramento]', e.t, err); } }
    for (const fn of this.todos) { try { fn(e); } catch (err) { console.error('[barramento]', e.t, err); } }
  }
  limpar() { this.ouvintes.clear(); this.todos.clear(); }
}

/** o barramento único do jogo (a cena emite; as libs ouvem e emitem) */
export const barramento = new Barramento();
