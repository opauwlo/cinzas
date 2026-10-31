// Estado da run (o que persiste) e salvamento local. Morte permanente: a run é apagada; o meta-progresso fica em store.ts.
export type ZEstado = {
  saqueados: number[]; abatidos: number[]; cortadas: number[]; desmontados: number[]; rasgados: number[];
  hortas: Record<number, number>; ultima: number; fogueiras: { x: number; y: number }[]; pois: string[]; esfolados: number[];
};
export type Run = {
  seed: string; zonaId: string; minutos: number;
  hp: number; maxHp: number; fome: number; sede: number; stamina: number; rad: number; sangra: boolean; radMax: number;
  inv: Record<string, number>; bau: Record<string, number>; arma: string | null; balas: Record<string, number>; mascara: boolean; combustivel: number; lanterna: { tem: boolean; ligada: boolean; bat: number };
  vasculhados: number; abates: number; objIdx: number; sabeAbrigo: boolean; descobertos: string[]; tanque: number; zonas: Record<string, ZEstado>;
  viajou: boolean; craftou: boolean; noites: number; dicas: string[]; tempoDeJogo: number; px?: number; py?: number; ultimaManha?: number;
};
export const novoZEstado = (): ZEstado => ({ saqueados: [], abatidos: [], cortadas: [], desmontados: [], rasgados: [], hortas: {}, ultima: 0, fogueiras: [], pois: [], esfolados: [] });
const CHAVE = 'cinzas.save.v2';
export function salvarRun(r: Run) { try { localStorage.setItem(CHAVE, JSON.stringify(r)); } catch { /* sem storage */ } }
export function lerRun(): Run | null { try { const s = localStorage.getItem(CHAVE); return s ? (JSON.parse(s) as Run) : null; } catch { return null; } }
export function apagarRun() { try { localStorage.removeItem(CHAVE); } catch { /* */ } }
export const temRun = () => lerRun() !== null;
