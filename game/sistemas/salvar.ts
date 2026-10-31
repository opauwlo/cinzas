// Estado da run (o que persiste) e salvamento local. Morte permanente: a run é apagada; o meta-progresso fica em store.ts.
import type { Contrato } from './contratos';
import type { Peca } from './grade';
export type ZEstado = {
  airdrop?: { dia: number; x: number; y: number; coletado: boolean };
  saqueados: number[]; abatidos: number[]; cortadas: number[]; desmontados: number[]; rasgados: number[];
  hortas: Record<number, number>; ultima: number; fogueiras: { x: number; y: number }[]; pois: string[]; esfolados: number[];
};
export type Run = {
  seed: string; zonaId: string; minutos: number;
  hp: number; maxHp: number; fome: number; sede: number; stamina: number; rad: number; sangra: boolean; radMax: number;
  inv: Record<string, number>; bau: Record<string, number>; arma: string | null; balas: Record<string, number>; mascara: boolean; combustivel: number; lanterna: { tem: boolean; ligada: boolean; bat: number };
  vasculhados: number; abates: number; objIdx: number; sabeAbrigo: boolean; descobertos: string[]; tanque: number; zonas: Record<string, ZEstado>;
  viajou: boolean; craftou: boolean; noites: number; dicas: string[]; tempoDeJogo: number; px?: number; py?: number; ultimaManha?: number;
  // camada de progressão (opcionais para aceitar saves antigos; normalizarRun preenche)
  grade?: Peca[]; xp?: number; nivel?: number; pontos?: number; perks?: string[]; st?: Record<string, number>; contratos?: Contrato[]; nContratos?: number; mel?: Record<string, number>; dif?: number;
  saiuEm?: number; raidDia?: number; emboscada?: [string, number] | null; ultEv?: string;
};
export function normalizarRun(r: Run): Run { r.grade ??= []; r.xp ??= 0; r.nivel ??= 1; r.pontos ??= 0; r.perks ??= []; r.st ??= {}; r.contratos ??= []; r.nContratos ??= 0; r.mel ??= {}; r.dif ??= 1; r.emboscada ??= null; return r; }
export const novoZEstado = (): ZEstado => ({ saqueados: [], abatidos: [], cortadas: [], desmontados: [], rasgados: [], hortas: {}, ultima: 0, fogueiras: [], pois: [], esfolados: [] });
const CHAVE = 'cinzas.save.v2';
export function salvarRun(r: Run) { try { localStorage.setItem(CHAVE, JSON.stringify(r)); } catch { /* sem storage */ } }
export function lerRun(): Run | null { try { const s = localStorage.getItem(CHAVE); return s ? normalizarRun(JSON.parse(s) as Run) : null; } catch { return null; } }
export function apagarRun() { try { localStorage.removeItem(CHAVE); } catch { /* */ } }
export const temRun = () => lerRun() !== null;
