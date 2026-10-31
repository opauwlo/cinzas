import { create } from 'zustand';
import { ITENS } from './itens';

export type Tela = 'menu' | 'jogo' | 'morte' | 'vitoria' | 'creditos' | 'loja' | 'revelacao';
export type Toast = { id: number; texto: string; cor: string };
export type Resumo = { causa: string; dias: number; hora: string; abates: number; vasculhados: number; radMax: number; vitoria: boolean; distAbrigo: number };

export type Estado = {
  tela: Tela;
  seed: string;
  minutos: number;
  hp: number; maxHp: number; fome: number; sede: number; stamina: number; rad: number; sangra: boolean;
  inv: Record<string, number>; arma: string | null; municao: number; mascara: boolean;
  lanterna: { tem: boolean; ligada: boolean; bat: number };
  cpm: number; objIdx: number; objProg: number; abrigoDist: number; abrigoDir: number; sabeAbrigo: boolean;
  vasculhados: number; abates: number; radMax: number;
  toasts: Toast[]; acao: { rotulo: string; p: number } | null; alvo: string | null; furtivo: boolean;
  invAberto: boolean; danoTs: number; resumo: Resumo | null; gemas: number; carga: number;
  set: (p: Partial<Estado>) => void;
  toast: (texto: string, cor?: string) => void;
};

export const OBJETIVOS = [
  { titulo: 'Vasculhe 5 contêineres', dica: 'Geladeiras, armários e porta-malas guardam o essencial.' },
  { titulo: 'Sobreviva até o anoitecer', dica: 'À noite a visão encurta e eles ficam mais ativos.' },
  { titulo: 'Ache o rádio de campanha', dica: 'Um prédio a leste guarda um rádio de campanha.' },
  { titulo: 'Chegue ao ABRIGO 7', dica: 'O rádio capta o sinal. Siga a seta.' },
];

export const horaStr = (min: number) => { const m = Math.floor(min) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
export const pesoInv = (inv: Record<string, number>) => Object.entries(inv).reduce((s, [id, q]) => s + (ITENS[id]?.peso ?? 0) * q, 0);
export const PESO_MAX = 14;

let tid = 1;
export const estadoInicial = (seed: string) => ({
  seed, minutos: 8 * 60, hp: 100, maxHp: 100, fome: 78, sede: 70, stamina: 100, rad: 0, sangra: false,
  inv: { agua: 1, bandagem: 1 } as Record<string, number>, arma: 'pe_de_cabra' as string | null, municao: 0, mascara: false,
  lanterna: { tem: false, ligada: false, bat: 100 }, cpm: 18, objIdx: 0, objProg: 0, abrigoDist: 0, abrigoDir: 0, sabeAbrigo: false,
  vasculhados: 0, abates: 0, radMax: 0, toasts: [] as Toast[], acao: null, alvo: null, furtivo: false, invAberto: false, danoTs: 0, resumo: null,
});

export const useJogo = create<Estado>((set, get) => ({
  tela: 'menu', ...estadoInicial(''), gemas: 20, carga: 0,
  set: p => set(p),
  toast: (texto, cor = '#e8e4d8') => {
    const t = { id: tid++, texto, cor };
    set({ toasts: [...get().toasts.slice(-3), t] });
    setTimeout(() => set({ toasts: get().toasts.filter(x => x.id !== t.id) }), 2600);
  },
}));

// ---- meta-progresso local (aversão à perda legítima: o que fica depois da morte)
export type Meta = { runs: number; melhorTempo: number; abatesTotais: number; sequencia: number; ultimoDia: string; vitorias: number };
const META0: Meta = { runs: 0, melhorTempo: 0, abatesTotais: 0, sequencia: 0, ultimoDia: '', vitorias: 0 };
export const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export function lerMeta(): Meta { try { return { ...META0, ...JSON.parse(localStorage.getItem('cinzas.meta') ?? '{}') }; } catch { return { ...META0 }; } }
export function gravarMeta(m: Meta) { try { localStorage.setItem('cinzas.meta', JSON.stringify(m)); } catch { /* sem storage */ } }
/** atualiza a sequência de dias jogados; devolve a meta já atualizada */
export function registrarDia(): Meta {
  const m = lerMeta(); const h = hoje();
  if (m.ultimoDia !== h) {
    const ontem = new Date(Date.now() - 864e5); const o = `${ontem.getFullYear()}-${String(ontem.getMonth() + 1).padStart(2, '0')}-${String(ontem.getDate()).padStart(2, '0')}`;
    m.sequencia = m.ultimoDia === o ? m.sequencia + 1 : 1; m.ultimoDia = h; gravarMeta(m);
  }
  return m;
}
