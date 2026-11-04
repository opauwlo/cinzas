// Núcleo: liga os módulos das libs de área à cena. A cena chama iniciar/tick/salvar/carregar;
// o núcleo repassa a cada módulo registrado em ./modulos.ts. Puro (sem Phaser): testável em Node.
import type { Mundo, ModuloJogo, ClimaMundo, ZonaMundo } from './contratos';
import { MODULOS } from './modulos';
export { barramento } from './barramento';
export type { Mundo, ModuloJogo } from './contratos';

/** direção do vento (radianos, para onde sopra): muda devagar ao longo do dia, igual para todos na mesma seed */
export function ventoDir(seed: string, minutos: number): number {
  let h = 2166136261; for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  const base = ((h >>> 0) / 4294967296) * Math.PI * 2, dia = minutos / 1440;
  return base + Math.sin(dia * Math.PI * 2 * 1.3) * 0.9 + Math.sin(dia * Math.PI * 2 * 0.37 + 1.7) * 0.6;
}

export class Nucleo {
  constructor(readonly modulos: ModuloJogo[] = MODULOS) {}
  private salvo: Record<string, unknown> = {};
  iniciar(m: Mundo) { for (const mod of this.modulos) this.seguro(mod, 'iniciar', () => mod.iniciar?.(m)); }
  tick(dt: number, m: Mundo) { for (const mod of this.modulos) this.seguro(mod, 'tick', () => mod.tick?.(dt, m)); }
  /** estado de todos os módulos, para guardar no save da run (chave = id do módulo) */
  salvar(): Record<string, unknown> { const o: Record<string, unknown> = { ...this.salvo }; for (const mod of this.modulos) if (mod.salvar) this.seguro(mod, 'salvar', () => { o[mod.id] = mod.salvar!(); }); return o; }
  carregar(s: Record<string, unknown> | undefined) { this.salvo = { ...(s ?? {}) }; for (const mod of this.modulos) this.seguro(mod, 'carregar', () => mod.carregar?.(this.salvo[mod.id])); }
  /** um módulo que quebra é desligado com aviso no console; o jogo segue */
  private quebrados = new Set<string>();
  private seguro(mod: ModuloJogo, onde: string, fn: () => void) {
    if (this.quebrados.has(mod.id)) return;
    try { fn(); } catch (e) { this.quebrados.add(mod.id); console.error(`[nucleo] módulo ${mod.id} quebrou em ${onde} e foi desligado`, e); }
  }
}

/** a fachada é UM objeto reaproveitado a cada quadro (sem lixo para o GC) */
export function novoMundo(): Mundo {
  const zona: ZonaMundo = { id: '', bioma: '', w: 0, h: 0, tipos: new Uint8Array(0), solido: new Uint8Array(0), opaco: new Uint8Array(0), rad: new Float32Array(0) };
  const clima: ClimaMundo = { tipo: 'limpo', chuva: 0, vento: 0, ventoDir: 0, neblina: 0, poeira: 0, acida: false };
  return { seed: '', zona, minutos: 0, dia: 1, hora: 0, jogador: { x: 0, y: 0, ang: 0, hp: 100, maxHp: 100, furtivo: false, mascara: false }, clima, interior: false, perigo: 0, ato: 1, dif: 1 };
}
