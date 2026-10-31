import * as Phaser from 'phaser';
import Alea from 'alea';
import { createNoise2D } from 'simplex-noise';

export type Estado = { x: number; y: number; rad: number; cpm: number };
export type Entrada = { vx: number; vy: number };

const PPM = 32; // pixels por metro (HANDOFF §6)
const MUNDO = 80 * PPM;
const SEED = 'cinzas-demo';

type Ruina = { x: number; y: number; w: number; h: number };

export function criarMundo(pai: HTMLElement, entrada: Entrada, aoEstado: (e: Estado) => void) {
  const rng = Alea(SEED);
  const ruido = createNoise2D(Alea(SEED + 'rad'));
  const ruinas: Ruina[] = [];
  for (let i = 0; i < 70; i++) {
    const w = (2 + Math.floor(rng() * 5)) * PPM;
    const h = (2 + Math.floor(rng() * 4)) * PPM;
    const x = Math.floor(rng() * (MUNDO / PPM - 8)) * PPM + 2 * PPM;
    const y = Math.floor(rng() * (MUNDO / PPM - 8)) * PPM + 2 * PPM;
    if (Math.abs(x - MUNDO / 2) < 5 * PPM && Math.abs(y - MUNDO / 2) < 5 * PPM) continue;
    ruinas.push({ x, y, w, h });
  }
  const radiacaoEm = (x: number, y: number) => Math.max(0, ruido(x / (14 * PPM), y / (14 * PPM)) - 0.25) / 0.75;

  class Cena extends Phaser.Scene {
    jogador!: Phaser.GameObjects.Image;
    teclas!: Record<string, Phaser.Input.Keyboard.Key>;
    luz!: Phaser.GameObjects.Image;
    acum = 0;

    create() {
      // chão: um tile de areia suja com variação, repetido
      const t = this.textures.createCanvas('chao', 64, 64)!;
      const c = t.getContext();
      for (let i = 0; i < 64; i++) for (let j = 0; j < 64; j++) {
        const v = 92 + Math.floor(rng() * 26);
        c.fillStyle = `rgb(${v + 22},${v + 10},${v - 14})`;
        c.fillRect(i, j, 1, 1);
      }
      t.refresh();
      this.add.tileSprite(0, 0, MUNDO, MUNDO, 'chao').setOrigin(0).setTint(0x8c7b5e);

      // manchas de radiação (mesmo ruído que alimenta o Geiger)
      const g = this.add.graphics();
      for (let x = 0; x < MUNDO; x += PPM * 2) for (let y = 0; y < MUNDO; y += PPM * 2) {
        const r = radiacaoEm(x, y);
        if (r > 0.08) { g.fillStyle(0x7bd12a, Math.min(0.45, r * 0.6)); g.fillRect(x, y, PPM * 2, PPM * 2); }
      }

      // ruínas: parede de concreto com borda mais escura
      for (const r of ruinas) {
        g.fillStyle(0x15120f, 1); g.fillRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6);
        g.fillStyle(0x4a4137, 1); g.fillRect(r.x, r.y, r.w, r.h);
        g.fillStyle(0x2b2620, 1); g.fillRect(r.x + 6, r.y + 6, r.w - 12, r.h - 12);
      }

      const p = this.make.graphics({ x: 0, y: 0 }, false);
      p.fillStyle(0x000000, 0.5); p.fillCircle(14, 17, 11);
      p.fillStyle(0xc7b377, 1); p.fillCircle(14, 14, 10);
      p.fillStyle(0x1a1714, 1); p.fillCircle(14, 14, 6);
      p.fillStyle(0xc2412d, 1); p.fillTriangle(14, 1, 9, 9, 19, 9); // direção
      p.generateTexture('jogador', 28, 28); p.destroy();
      this.jogador = this.add.image(MUNDO / 2, MUNDO / 2, 'jogador');

      // escuridão com furo de luz: gradiente radial em tela cheia, seguindo o jogador
      const L = 1024;
      const lt = this.textures.createCanvas('luz', L, L)!;
      const lc = lt.getContext();
      const gr = lc.createRadialGradient(L / 2, L / 2, 0, L / 2, L / 2, L / 2);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.2, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.6)'); gr.addColorStop(0.85, 'rgba(0,0,0,0.97)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
      lc.fillStyle = gr; lc.fillRect(0, 0, L, L); lt.refresh();
      this.luz = this.add.image(0, 0, 'luz').setScrollFactor(0).setDepth(10);

      this.cameras.main.setBounds(0, 0, MUNDO, MUNDO).startFollow(this.jogador, true, 0.12, 0.12);
      this.teclas = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Record<string, Phaser.Input.Keyboard.Key>;
      const ajusta = () => this.luz.setPosition(this.scale.width / 2, this.scale.height / 2).setScale(Math.max(this.scale.width, this.scale.height) * 1.15 / L);
      this.scale.on('resize', ajusta);
      ajusta();
    }

    update(_t: number, dt: number) {
      const k = this.teclas;
      let vx = entrada.vx + (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
      let vy = entrada.vy + (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
      const m = Math.hypot(vx, vy);
      if (m > 1) { vx /= m; vy /= m; }
      const v = 4.2 * PPM * (dt / 1000);
      const bate = (x: number, y: number) => ruinas.some(r => x > r.x - 10 && x < r.x + r.w + 10 && y > r.y - 10 && y < r.y + r.h + 10);
      const nx = Phaser.Math.Clamp(this.jogador.x + vx * v, 10, MUNDO - 10);
      const ny = Phaser.Math.Clamp(this.jogador.y + vy * v, 10, MUNDO - 10);
      if (!bate(nx, this.jogador.y)) this.jogador.x = nx;
      if (!bate(this.jogador.x, ny)) this.jogador.y = ny;
      if (m > 0.1) this.jogador.rotation = Math.atan2(vy, vx) + Math.PI / 2;

      this.acum += dt;
      if (this.acum > 200) {
        this.acum = 0;
        const rad = radiacaoEm(this.jogador.x, this.jogador.y);
        aoEstado({ x: this.jogador.x / PPM, y: this.jogador.y / PPM, rad, cpm: Math.round(18 + rad * 900) });
      }
    }
  }

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: pai,
    backgroundColor: '#0b0907',
    scale: { mode: Phaser.Scale.RESIZE, width: pai.clientWidth || 360, height: pai.clientHeight || 520 },
    scene: Cena,
    input: { keyboard: true },
    render: { pixelArt: false, antialias: true },
  });
}
