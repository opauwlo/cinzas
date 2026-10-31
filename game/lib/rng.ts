// RNG com seed (alea) e helpers. Tudo que é procedural na biblioteca passa por aqui, para o mesmo mundo sair igual para todos.
import Alea from 'alea';

export class Rng {
  private r: () => number;
  constructor(seed: string | number) { this.r = Alea(String(seed)); }
  f() { return this.r(); }
  int(a: number, b: number) { return a + Math.floor(this.r() * (b - a + 1)); }
  range(a: number, b: number) { return a + this.r() * (b - a); }
  chance(p: number) { return this.r() < p; }
  pick<T>(a: readonly T[]): T { return a[Math.floor(this.r() * a.length)]; }
  peso<T>(itens: readonly (readonly [T, number])[]): T {
    let t = 0; for (const [, w] of itens) t += w; let x = this.r() * t;
    for (const [v, w] of itens) { x -= w; if (x <= 0) return v; } return itens[itens.length - 1][0];
  }
  embaralhar<T>(a: T[]): T[] { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  gauss() { return (this.r() + this.r() + this.r() - 1.5) / 1.5; }
}

export const hashStr = (s: string) => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; };
