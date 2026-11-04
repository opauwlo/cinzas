// Estado da run (o que persiste) e salvamento local. Morte permanente: a run é apagada; o meta-progresso fica em store.ts.
import type { Contrato } from './contratos';
import type { Peca } from './grade';
import { ITENS } from '../dados/itens';
import { LOCAIS } from '../dados/locais';
export type ZEstado = {
  airdrop?: { dia: number; x: number; y: number; coletado: boolean };
  saqueados: number[]; abatidos: number[]; cortadas: number[]; desmontados: number[]; rasgados: number[];
  hortas: Record<number, number>; coletados: number[]; colhidas?: number[]; lidas?: number[]; fontes: Record<number, number>; npcMortos?: string[]; ultima: number; fogueiras: { x: number; y: number }[]; pois: string[]; esfolados: number[];
};
export type Run = {
  seed: string; zonaId: string; minutos: number;
  hp: number; maxHp: number; fome: number; sede: number; stamina: number; rad: number; sangra: boolean; radMax: number;
  inv: Record<string, number>; bau: Record<string, number>; arma: string | null; balas: Record<string, number>; mascara: boolean; combustivel: number; lanterna: { tem: boolean; ligada: boolean; bat: number };
  vasculhados: number; abates: number; objIdx: number; sabeAbrigo: boolean; descobertos: string[]; tanque: number; zonas: Record<string, ZEstado>;
  viajou: boolean; craftou: boolean; noites: number; dicas: string[]; tempoDeJogo: number; px?: number; py?: number; ultimaManha?: number;
  // camada de progressão (opcionais para aceitar saves antigos; normalizarRun preenche)
  grade?: Peca[]; xp?: number; nivel?: number; pontos?: number; perks?: string[]; st?: Record<string, number>; contratos?: Contrato[]; nContratos?: number; mel?: Record<string, number>; dif?: number;
  traiu?: boolean; objVer?: number; saiuEm?: number; raidDia?: number; emboscada?: [string, number] | null; ultEv?: string;
  /** estado dos módulos das libs de área (game/nucleo), chave = id do módulo */
  nucleo?: Record<string, unknown>;
};
export function normalizarRun(r: Run): Run { r.grade ??= []; r.xp ??= 0; r.nivel ??= 1; r.pontos ??= 0; r.perks ??= []; r.st ??= {}; r.contratos ??= []; r.nContratos ??= 0; r.mel ??= {}; r.dif ??= 1; r.emboscada ??= null; return r; }
export const novoZEstado = (): ZEstado => ({ saqueados: [], abatidos: [], cortadas: [], desmontados: [], rasgados: [], hortas: {}, coletados: [], colhidas: [], lidas: [], fontes: {}, ultima: 0, fogueiras: [], pois: [], esfolados: [] });
const CHAVE = 'cinzas.save.v2';
/** Limite de tamanho e validação também protegem o app contra backup danificado. */
export function validarRun(valor: unknown): Run | null {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return null;
  const r = valor as Run;
  if (typeof r.seed !== 'string' || !r.seed || !LOCAIS.some(l => l.id === r.zonaId)) return null;
  for (const k of ['minutos', 'hp', 'maxHp', 'fome', 'sede', 'stamina', 'rad', 'radMax', 'combustivel', 'vasculhados', 'abates', 'objIdx', 'tanque', 'tempoDeJogo'] as const) {
    if (typeof r[k] !== 'number' || !Number.isFinite(r[k]) || r[k] < 0) return null;
  }
  if (r.hp <= 0 || r.maxHp < 1 || r.maxHp > 1000 || r.hp > r.maxHp || !Array.isArray(r.descobertos) || !r.descobertos.every(d => LOCAIS.some(l => l.id === d))) return null;
  for (const mapa of [r.inv, r.bau, r.balas]) {
    if (!mapa || typeof mapa !== 'object' || Array.isArray(mapa)) return null;
    if (!Object.entries(mapa).every(([id, q]) => ITENS[id] && Number.isSafeInteger(q) && q >= 0 && q <= 100000)) return null;
  }
  if (!r.zonas || typeof r.zonas !== 'object' || Array.isArray(r.zonas) || !r.lanterna || typeof r.lanterna.ligada !== 'boolean' || !Number.isFinite(r.lanterna.bat)) return null;
  for (const z of Object.values(r.zonas)) {
    if (!z || !['saqueados', 'abatidos', 'cortadas', 'desmontados', 'rasgados', 'coletados', 'fogueiras', 'pois', 'esfolados'].every(k => Array.isArray((z as unknown as Record<string, unknown>)[k])) || !z.hortas || !z.fontes) return null;
  }
  for (const k of ['perks', 'contratos', 'grade', 'dicas'] as const) if (r[k] !== undefined && !Array.isArray(r[k])) return null;
  if (r.perks && !r.perks.every(p => typeof p === 'string')) return null;
  if (r.dicas && !r.dicas.every(p => typeof p === 'string')) return null;
  if (r.grade && !r.grade.every(p => p && ITENS[p.id] && Number.isSafeInteger(p.q) && p.q > 0 && Number.isSafeInteger(p.x) && p.x >= 0 && p.x < 8 && Number.isSafeInteger(p.y) && p.y >= 0 && p.y < 6 && [0, 1].includes(p.r))) return null;
  if (r.contratos && !r.contratos.every(c => c && typeof c.titulo === 'string' && ['abater', 'saquear', 'visitar', 'trazer', 'fabricar', 'noites'].includes(c.tipo) && [c.id, c.qtd, c.prog, c.xp].every(n => Number.isFinite(n) && n >= 0) && Array.isArray(c.premio) && c.premio.every(p => Array.isArray(p) && ITENS[p[0]] && Number.isSafeInteger(p[1]) && p[1] > 0))) return null;
  for (const mapa of [r.st, r.mel]) if (mapa !== undefined && (!mapa || typeof mapa !== 'object' || Array.isArray(mapa) || !Object.values(mapa).every(n => Number.isFinite(n) && n >= 0))) return null;
  if (r.nivel !== undefined && (!Number.isSafeInteger(r.nivel) || r.nivel < 1 || r.nivel > 10000)) return null;
  if (r.dif !== undefined && ![0, 1, 2].includes(r.dif)) return null;
  if (r.nucleo !== undefined && (!r.nucleo || typeof r.nucleo !== 'object' || Array.isArray(r.nucleo))) return null;
  return normalizarRun(r);
}
export function salvarRun(r: Run): boolean { try { localStorage.setItem(CHAVE, JSON.stringify(r)); return true; } catch { return false; } }
export function lerRun(): Run | null { try { const s = localStorage.getItem(CHAVE); return s && s.length <= 5000000 ? validarRun(JSON.parse(s)) : null; } catch { return null; } }
export function exportarRun(r: Run) { return JSON.stringify({ app: 'cinzas', versao: 1, exportadoEm: new Date().toISOString(), run: r }, null, 2); }
export function importarRun(texto: string): Run | null {
  try { if (texto.length > 5000000) return null; const dado = JSON.parse(texto); return dado?.app === 'cinzas' && dado.versao === 1 ? validarRun(dado.run) : null; } catch { return null; }
}
export function apagarRun() { try { localStorage.removeItem(CHAVE); } catch { /* */ } }
export const temRun = () => lerRun() !== null;
