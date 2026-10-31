// Partículas pixeladas (sangue, poeira, fagulhas, folhas/cinza ao vento) e manchas no chão.
import type * as Phaser from 'phaser';

type P = { x: number; y: number; z: number; vx: number; vy: number; vz: number; g: number; t: number; vida: number; cor: number; tam: number; mancha: number; /** transparência máxima (vida no ar) */ a?: number; /** pisca, em rad/s (vagalumes) */ pis?: number; fase?: number; /** tempo para aparecer, em s */ fi?: number };
type M = { x: number; y: number; t: number; cor: number; r: number; seed: number };

export class Particulas {
  private ps: P[] = []; private ms: M[] = [];
  /** x,y em coordenadas de tela do mundo; z é a altura acima do chão */
  emitir(n: number, x: number, y: number, z: number, o: { vx?: number; vy?: number; vz?: number; esp?: number; g?: number; vida?: number; cor: number | number[]; tam?: number; mancha?: number }) {
    for (let i = 0; i < n && this.ps.length < 500; i++) {
      const a = Math.random() * 6.283, s = Math.random() * (o.esp ?? 30), cor = Array.isArray(o.cor) ? o.cor[(Math.random() * o.cor.length) | 0] : o.cor;
      this.ps.push({ x, y, z, vx: (o.vx ?? 0) + Math.cos(a) * s, vy: (o.vy ?? 0) + Math.sin(a) * s * 0.5, vz: (o.vz ?? 30) + Math.random() * 20, g: o.g ?? 160, t: 0, vida: (o.vida ?? 0.6) * (0.7 + Math.random() * 0.6), cor, tam: o.tam ?? 1, mancha: o.mancha ?? 0 });
    }
  }
  /** partícula exata, sem sorteio de velocidade: vida no ar (cinza, poeira, vagalumes, brasas) e fumaça */
  solta(x: number, y: number, z: number, o: { vx?: number; vy?: number; vz?: number; g?: number; vida: number; cor: number | number[]; tam?: number; a?: number; pis?: number; fi?: number }) {
    if (this.ps.length >= 500) return; const cor = Array.isArray(o.cor) ? o.cor[(Math.random() * o.cor.length) | 0] : o.cor;
    this.ps.push({ x, y, z, vx: o.vx ?? 0, vy: o.vy ?? 0, vz: o.vz ?? 0, g: o.g ?? 0, t: 0, vida: o.vida, cor, tam: o.tam ?? 1, mancha: 0, a: o.a, pis: o.pis, fase: Math.random() * 6.283, fi: o.fi });
  }
  sangue(x: number, y: number, z: number, dx: number, dy: number, n = 8) { this.emitir(n, x, y, z, { vx: dx * 40, vy: dy * 20, vz: 40, esp: 45, g: 260, vida: 0.7, cor: [0x7a1410, 0x8a2018, 0x5a0e0a], mancha: 1 }); }
  poeira(x: number, y: number, n = 6) { this.emitir(n, x, y, 2, { vz: 14, esp: 22, g: -10, vida: 0.5, cor: [0x8a7e65, 0x6a604c, 0x9a9078] }); }
  faisca(x: number, y: number, z: number, n = 6) { this.emitir(n, x, y, z, { vz: 30, esp: 70, g: 200, vida: 0.3, cor: [0xffe070, 0xffa030, 0xfff0b0] }); }
  mancha(x: number, y: number, cor = 0x4a0c08, r = 3) { if (this.ms.length > 90) this.ms.shift(); this.ms.push({ x, y, t: 0, cor, r, seed: Math.random() * 1000 }); }
  atualizar(dt: number) {
    for (let i = this.ps.length - 1; i >= 0; i--) { const p = this.ps[i]; p.t += dt; p.vz -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.z <= 0 && p.g > 0) { if (p.mancha && Math.random() < 0.5) this.mancha(p.x, p.y, p.cor, 1 + Math.random() * 2); p.z = 0; p.vz *= -0.2; p.vx *= 0.5; p.vy *= 0.5; if (Math.abs(p.vz) < 6) p.t = p.vida; } if (p.t >= p.vida) this.ps.splice(i, 1); }
    for (let i = this.ms.length - 1; i >= 0; i--) { this.ms[i].t += dt; if (this.ms[i].t > 90) this.ms.splice(i, 1); }
  }
  desenhar(chao: Phaser.GameObjects.Graphics, ar: Phaser.GameObjects.Graphics) {
    chao.clear(); ar.clear();
    for (const m of this.ms) { const a = Math.max(0, 1 - m.t / 90); chao.fillStyle(m.cor, 0.75 * a); const r = Math.round(m.r); chao.fillRect(Math.round(m.x) - r, Math.round(m.y) - 1, r * 2, 2); if (r > 2) chao.fillRect(Math.round(m.x) - 1, Math.round(m.y) - 2, 3, 4); }
    for (const p of this.ps) { const al = Math.min(1, (p.vida - p.t) * 4) * (p.a ?? 1) * (p.fi ? Math.min(1, p.t / p.fi) : 1) * (p.pis ? 0.55 + 0.45 * Math.sin(p.t * p.pis + (p.fase ?? 0)) : 1); ar.fillStyle(p.cor, al); ar.fillRect(Math.round(p.x), Math.round(p.y - p.z), p.tam, p.tam); }
  }
}
