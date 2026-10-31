'use client';
import { useEffect, useRef } from 'react';
import { tarefasSprites, type Sprites } from '../../game/modelos';

export default function Arte() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const s: Sprites = {}; const t0 = performance.now(); tarefasSprites(s).forEach(f => f()); const ms = Math.round(performance.now() - t0);
    const c = ref.current!, g = c.getContext('2d')!; g.imageSmoothingEnabled = false; g.fillStyle = '#34372f'; g.fillRect(0, 0, c.width, c.height);
    const mostra = (ks: string[], x0: number, y0: number, esc: number, cols: number) => ks.forEach((k, i) => { const r = s[k]; if (!r) return; g.drawImage(r.canvas, x0 + (i % cols) * r.canvas.width * esc, y0 + Math.floor(i / cols) * r.canvas.height * esc, r.canvas.width * esc, r.canvas.height * esc); });
    mostra([0, 1, 2, 3, 4, 5, 6, 7].map(d => `jog_melee_${d}_1`), 0, 0, 3, 8);
    mostra([0, 1, 2, 3].map(f => `jog_pistola_2_${f}`).concat([0, 1, 2, 3].map(f => `jog_nenhuma_1_${f}`)), 0, 150, 3, 8);
    mostra([0, 1, 2, 3, 4, 5, 6, 7].map(d => `irr_${d}_1`), 0, 300, 3, 8);
    mostra([0, 1, 2, 3, 4, 5, 6, 7].map(d => `cao_${d}_1`), 0, 450, 3, 8);
    mostra([0, 1, 2, 3, 4, 5, 6, 7].map(d => `rato_${d}_0`), 0, 580, 3, 8);
    mostra(['carro0', 'carro1', 'carro2', 'geladeira', 'armario0', 'caixa0', 'ferramentas', 'barril1', 'cama0', 'mesa1', 'arvore0', 'bunker'], 0, 650, 2, 6);
    document.title = `arte ${ms}ms`;
  }, []);
  return <canvas ref={ref} width={1000} height={1100} style={{ imageRendering: 'pixelated', width: '100%' }} />;
}
