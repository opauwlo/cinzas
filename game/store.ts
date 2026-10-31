import { create } from 'zustand';
import { ITENS, pesoDe } from './dados/itens';
import type { ClimaId } from './dados/biomas';
import type { Contrato } from './sistemas/contratos';
import type { Peca } from './sistemas/grade';

export type Tela = 'menu' | 'jogo' | 'morte' | 'vitoria' | 'creditos' | 'loja' | 'revelacao';
export type Painel = null | 'inv' | 'craft' | 'bau' | 'mapa' | 'cozinha' | 'dormir' | 'pausa' | 'config' | 'diario' | 'mapaZona' | 'perk' | 'melhorias' | 'evento' | 'ajuda' | 'intro' | 'dialogo';
export type DialogoUI = { npcId: number; nome: string; rotulo: string; fala: string; modo: 'fala' | 'troca'; fichas: number; compras: { item: string; q: number; preco: number }[]; vendas: { item: string; q: number; preco: number }[]; msg: string; vende: boolean };
export type EventoUI = { titulo: string; txt: string; opcoes: { rot: string; ok: boolean; dica?: string }[]; resultado: string | null; cor?: string };
export type Toast = { id: number; texto: string; cor: string };
export type Resumo = { causa: string; dias: number; hora: string; abates: number; vasculhados: number; radMax: number; vitoria: boolean; distAbrigo: number; nivel?: number; contratos?: number; conquistas?: string[] };
export type Configs = { mestre: number; sfx: number; amb: number; mus: number; vibra: boolean; ui: number; escala: number; v?: number; autoMira: boolean; gore: boolean; canhoto: boolean; fps: boolean };
export type ClimaHud = { tipo: ClimaId; chuva: number; vento: number; neblina: number; poeira: number; nuvem: number };

export const CFG0: Configs = { mestre: 0.6, sfx: 0.7, amb: 0.5, mus: 0.3, vibra: true, ui: 1, escala: 1, v: 4, autoMira: true, gore: true, canhoto: false, fps: false };
export function lerCfg(): Configs {
  try { const salvo = JSON.parse(localStorage.getItem('cinzas.cfg') ?? '{}'), c: Configs = { ...CFG0, ...salvo }; if ((salvo.v ?? 1) < 3) c.escala = CFG0.escala; if ((salvo.v ?? 1) < 4) { c.mestre = CFG0.mestre; c.sfx = CFG0.sfx; c.amb = CFG0.amb; c.mus = CFG0.mus; } c.v = 4; return c; } catch { return { ...CFG0 }; }
}
export function gravarCfg(c: Configs) { try { localStorage.setItem('cinzas.cfg', JSON.stringify(c)); } catch { /* sem storage */ } }

export type Estado = {
  tela: Tela; painel: Painel; seed: string; zonaId: string; zonaNome: string; biomaId: string; minutos: number;
  hp: number; maxHp: number; fome: number; sede: number; stamina: number; rad: number; sangra: boolean;
  inv: Record<string, number>; bau: Record<string, number>; arma: string | null; balas: Record<string, number>; mascara: boolean; combustivel: number;
  lanterna: { tem: boolean; ligada: boolean; bat: number };
  cpm: number; objIdx: number; objVal: number; banner: { id: number; titulo: string; sub: string; extra: string } | null; vasculhados: number; abates: number; radMax: number; sabeAbrigo: boolean;
  clima: ClimaHud; interior: boolean; tanque: number;
  toasts: Toast[]; acao: { rotulo: string; p: number } | null; alvo: string | null; furtivo: boolean;
  danoTs: number; resumo: Resumo | null; gemas: number; carga: number; descobertos: string[]; dica: string | null; cfg: Configs; temSave: boolean; fps: number;
  dialogo: DialogoUI | null; grade: Peca[]; xp: number; nivel: number; pontos: number; perks: string[]; contratos: Contrato[]; mel: Record<string, number>; conquistas: string[]; evento: EventoUI | null; seta: { dx: number; dy: number; d: number } | null; dif: number;
  set: (p: Partial<Estado>) => void;
  toast: (texto: string, cor?: string) => void;
};

export { OBJETIVOS, ATOS } from './dados/objetivos';

export const horaStr = (min: number) => { const m = Math.floor(min) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
export const PESO_BASE = 14;
export const pesoMax = (inv: Record<string, number>) => PESO_BASE + (inv.mochila ? 10 : 0);
export const pesoInv = (inv: Record<string, number>) => pesoDe(inv);

let tid = 1;
export const estadoInicial = (seed: string) => ({
  seed, zonaId: 'base', zonaNome: 'Abrigo', biomaId: 'base', minutos: 8 * 60, hp: 100, maxHp: 100, fome: 78, sede: 70, stamina: 100, rad: 0, sangra: false,
  inv: { agua: 1, bandagem: 2, pe_de_cabra: 1, enlatado: 1 } as Record<string, number>, bau: { tecido: 3, madeira: 4, sucata: 4, enlatado: 2, alcool: 1, garrafa: 2, semente: 2, ficha: 6 } as Record<string, number>,
  arma: 'pe_de_cabra' as string | null, balas: { municao: 0, cartucho: 0 } as Record<string, number>, mascara: false, combustivel: 6, lanterna: { tem: false, ligada: false, bat: 100 },
  cpm: 18, objIdx: 0, objVal: 0, banner: null, vasculhados: 0, abates: 0, radMax: 0, sabeAbrigo: false,
  clima: { tipo: 'limpo', chuva: 0, vento: 0.1, neblina: 0, poeira: 0, nuvem: 0.1 } as ClimaHud, interior: false, tanque: 0,
  toasts: [] as Toast[], acao: null, alvo: null, furtivo: false, danoTs: 0, resumo: null, descobertos: ['base'] as string[], dica: null,
  dialogo: null, grade: [] as Peca[], xp: 0, nivel: 1, pontos: 0, perks: [] as string[], contratos: [] as Contrato[], mel: {} as Record<string, number>, conquistas: [] as string[], evento: null, seta: null, dif: 1,
});

export const useJogo = create<Estado>((set, get) => ({
  tela: 'menu', painel: null, ...estadoInicial(''), gemas: 20, carga: 0, cfg: { ...CFG0 }, temSave: false, fps: 0,
  set: p => set(p),
  toast: (texto, cor = '#d8d3c0') => {
    const t = { id: tid++, texto, cor };
    set({ toasts: [...get().toasts.slice(-3), t] });
    setTimeout(() => set({ toasts: get().toasts.filter(x => x.id !== t.id) }), 2300);
  },
}));

// ---- meta-progresso local (o que fica depois da morte)
export type Meta = { runs: number; melhorTempo: number; abatesTotais: number; sequencia: number; ultimoDia: string; vitorias: number; dicas: string[]; conquistas: string[]; intro: boolean; dif: number; melhorNivel: number };
const META0: Meta = { runs: 0, melhorTempo: 0, abatesTotais: 0, sequencia: 0, ultimoDia: '', vitorias: 0, dicas: [], conquistas: [], intro: false, dif: 1, melhorNivel: 1 };
export const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export function lerMeta(): Meta { try { return { ...META0, ...JSON.parse(localStorage.getItem('cinzas.meta') ?? '{}') }; } catch { return { ...META0 }; } }
export function gravarMeta(m: Meta) { try { localStorage.setItem('cinzas.meta', JSON.stringify(m)); } catch { /* sem storage */ } }
export function registrarDia(): Meta {
  const m = lerMeta(); const h = hoje();
  if (m.ultimoDia !== h) {
    const ontem = new Date(Date.now() - 864e5); const o = `${ontem.getFullYear()}-${String(ontem.getMonth() + 1).padStart(2, '0')}-${String(ontem.getDate()).padStart(2, '0')}`;
    m.sequencia = m.ultimoDia === o ? m.sequencia + 1 : 1; m.ultimoDia = h; gravarMeta(m);
  }
  return m;
}
import type { Run } from './sistemas/salvar';
export function novoRun(seed: string, bonus = false, dif = 1): Run {
  const e = estadoInicial(seed), inv = { ...e.inv }; if (bonus) inv.kit = 1;
  return { seed, zonaId: 'base', minutos: e.minutos, hp: 100, maxHp: 100, fome: e.fome, sede: e.sede, stamina: 100, rad: 0, sangra: false, radMax: 0, inv, bau: { ...e.bau }, arma: 'pe_de_cabra', balas: { municao: 0, cartucho: 0 }, mascara: false, combustivel: 6, lanterna: { tem: false, ligada: false, bat: 100 },
    vasculhados: 0, abates: 0, objIdx: 0, sabeAbrigo: false, descobertos: ['base'], tanque: 0, zonas: {}, viajou: false, craftou: false, noites: 0, dicas: [], tempoDeJogo: 0,
    xp: 0, nivel: 1, pontos: 0, perks: [], st: {}, contratos: [], nContratos: 0, mel: {}, dif, emboscada: null };
}
/** copia a run para o store da UI (o que a HUD e os painéis leem) */
export function aplicarRun(r: Run) {
  useJogo.setState({ seed: r.seed, zonaId: r.zonaId, minutos: r.minutos, hp: r.hp, maxHp: r.maxHp, fome: r.fome, sede: r.sede, stamina: r.stamina, rad: r.rad, sangra: r.sangra, inv: { ...r.inv }, bau: { ...r.bau }, arma: r.arma, balas: { ...r.balas }, mascara: r.mascara, combustivel: r.combustivel, lanterna: { ...r.lanterna },
    objIdx: r.objIdx, objVal: 0, banner: null, vasculhados: r.vasculhados, abates: r.abates, radMax: r.radMax, sabeAbrigo: r.sabeAbrigo, descobertos: [...r.descobertos], tanque: r.tanque, toasts: [], acao: null, alvo: null, painel: null, dica: null, resumo: null,
    grade: [...(r.grade ?? [])], xp: r.xp ?? 0, nivel: r.nivel ?? 1, pontos: r.pontos ?? 0, perks: [...(r.perks ?? [])], contratos: [...(r.contratos ?? [])], mel: { ...(r.mel ?? {}) }, conquistas: lerMeta().conquistas, evento: null, seta: null, dif: r.dif ?? 1 });
}
export { ITENS };
