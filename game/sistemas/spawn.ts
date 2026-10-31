// Diretor de população (PURO, testável em Node): quantos inimigos devem existir perto do jogador, quais, em que grupo, com que intervalo
// e quando segurar (tensão alta = alívio). A cena só sorteia o ponto e cria as entidades.
import type { Bioma } from '../dados/biomas';
import { GRUPO } from '../dados/criaturas';
import { DIF } from '../dados/balanco';
import type { Rng } from '../lib/rng';

export type CtxSpawn = { hora: number; nivel: number; dia: number; dif: number; interior: boolean; neblina: number; chuva: number; noBase: boolean };
export const GANGUE = ['saqueador', 'filho', 'miliciano'];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** 0 = dia claro · 1 = noite fechada (suave nos extremos) */
export function noiteFator(h: number) { const x = ((h % 24) + 24) % 24; return x >= 22 || x < 4.5 ? 1 : x >= 8 && x < 17 ? 0 : x >= 17 && x < 22 ? (x - 17) / 5 : 1 - (x - 4.5) / 3.5; }
/** quantos hostis queremos por perto (raio ~25 tiles) */
export function alvoHostis(b: Bioma, c: CtxSpawn) {
  if (!b.inimigos.length || c.noBase) return 0;
  const n = 2.2 * b.densInimigos * (0.8 + 0.7 * noiteFator(c.hora)) * Math.min(1.5, 1 + 0.05 * (c.nivel - 1)) * Math.min(1.4, 1 + 0.03 * (c.dia - 1))
    * (c.interior ? 0.6 : 1) * (1 + 0.15 * c.neblina - 0.1 * c.chuva) * DIF.spawn[c.dif];
  return clamp(Math.round(n), 0, 9);
}
/** segundos entre rodadas de reposição: mais curto à noite e em dificuldade alta */
export const intervaloSpawn = (c: CtxSpawn) => clamp((56 - 26 * noiteFator(c.hora)) / Math.sqrt(DIF.spawn[c.dif]), 20, 90);
/** pesos de escolha: gangues só depois do nível 3; corredores e rastejadores crescem à noite */
export function pesosArq(b: Bioma, c: CtxSpawn): [string, number][] {
  const noite = noiteFator(c.hora);
  return b.inimigos.map(([id, w]) => [id, w * (GANGUE.includes(id) ? (c.nivel >= 3 ? 0.6 : 0) : id === 'corredor' ? 0.7 + 1.1 * noite : id === 'rastejador' ? 0.8 + 0.5 * noite : id === 'irradiado' ? 1.3 - 0.4 * noite : 1)] as [string, number]).filter(([, w]) => w > 0);
}
export function escolherArq(rng: Rng, b: Bioma, c: CtxSpawn): string { const p = pesosArq(b, c); return p.length ? rng.peso(p) : b.inimigos[0][0]; }
/** tamanho do grupo: respeita a tabela GRUPO, é menor nos primeiros níveis e nunca estoura a meta */
export function tamanhoGrupo(rng: Rng, arq: string, c: CtxSpawn, faltam: number) {
  const [a, b] = GRUPO[arq] ?? [1, 1]; let n = rng.int(a, b); if (c.nivel < 3) n = Math.min(n, 2); if (arq === 'colosso') n = 1;
  return clamp(n, 1, Math.max(1, faltam));
}
// ---- tensão: depois de apanhar ou lutar, dá um respiro (nada novo aparece até baixar)
export const TENSAO_LIMITE = 0.55;
export const tensaoDano = (t: number, dano: number) => Math.min(1, t + Math.min(0.4, dano / 60));
export const tensaoAbate = (t: number) => Math.min(1, t + 0.06);
export const tensaoDecai = (t: number, dt: number) => Math.max(0, t - 0.025 * dt);
export function podeSpawnar(s: { agora: number; hostis: number; alvo: number; total: number; tensao: number; ultimo: number; intervalo: number }) {
  return s.alvo > 0 && s.hostis < s.alvo && s.total < 140 && s.tensao <= TENSAO_LIMITE && s.agora - s.ultimo >= s.intervalo;
}
/** ponto no anel [dmin, dmax] em volta do jogador; 60% das vezes atrás de quem olha (menos "pop-in"); `ok` valida o terreno */
export function pontoSpawn(rng: Rng, jx: number, jy: number, olhar: number, ok: (x: number, y: number) => boolean, dmin = 14, dmax = 24, tent = 24): [number, number] | null {
  for (let i = 0; i < tent; i++) {
    const a = rng.chance(0.6) ? olhar + Math.PI + rng.gauss() * 0.9 : rng.f() * Math.PI * 2, r = rng.range(dmin, dmax), x = Math.floor(jx + Math.cos(a) * r), y = Math.floor(jy + Math.sin(a) * r);
    if (ok(x, y)) return [x, y];
  }
  return null;
}
