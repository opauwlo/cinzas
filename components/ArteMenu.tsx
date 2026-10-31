'use client';
import { useEffect, useRef } from 'react';
import { renderVox } from '../game/lib/vox';
import { montarHumano, poseHumano, gerarHumano, centroHumano } from '../game/lib/humano';
import { Rng } from '../game/lib/rng';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const hex = (c: number) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const h = (x: number, y: number) => { let n = (x * 374761393 + y * 668265263) | 0; n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };

/** Ilustração do menu em pixel art (140x70): céu de flash nuclear, cogumelo, ruínas e um sobrevivente. */
export default function ArteMenu() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!, g = c.getContext('2d')!, W = 140, H = 70, img = g.createImageData(W, H), d = img.data;
    const put = (x: number, y: number, col: number) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const o = (y * W + x) * 4, [r, gg, b] = hex(col); d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = 255; };
    const ramp = [0x0b0a0d, 0x15101a, 0x261419, 0x44201a, 0x7a3418, 0xb85a1c, 0xe0903a];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = x - 70, dy = (y - 46) * 1.25, glow = Math.max(0, 1 - Math.hypot(dx, dy) / 70), t = Math.min(1, Math.pow(y / 46, 1.9) * 0.78 + glow * 0.6);
      const f = t * (ramp.length - 1), i = Math.floor(f), fr = f - i; put(x, y, BAYER[(y & 3) * 4 + (x & 3)] / 16 < fr ? ramp[Math.min(i + 1, ramp.length - 1)] : ramp[i]);
    }
    // cogumelo: coluna e capuz com iluminação por baixo
    for (let y = 8; y < 52; y++) for (let x = 0; x < W; x++) {
      const w = y < 26 ? 0 : 4 + (y - 26) * 0.05, stem = Math.abs(x - 70) < w + 3 * Math.sin(y * 0.4) * 0.3, cap = ((x - 70) / 26) ** 2 + ((y - 20) / 11) ** 2 < 1 || ((x - 70) / 15) ** 2 + ((y - 13) / 8) ** 2 < 1;
      if (stem && y >= 24 || cap) put(x, y, h(x, y) < 0.35 + (y - 8) * 0.012 ? 0x8a3a1a : 0x2b1519);
    }
    // ruínas em duas camadas
    for (const [camada, cor, base, alt] of [[0, 0x1a1116, 54, 22], [1, 0x07060a, 60, 30]] as [number, number, number, number][]) {
      for (let x = 0; x < W; x += 1) {
        const bloco = Math.floor((x + camada * 7) / (9 + camada * 4)), hh = 6 + h(bloco, camada + 3) * alt, quebra = h(x >> 1, bloco + camada) < 0.22 && x % (9 + camada * 4) > 5 ? 5 : 0;
        for (let y = base - hh + quebra; y < base + 12; y++) put(x, Math.floor(y), cor);
      }
    }
    for (let k = 0; k < 40; k++) { const x = Math.floor(h(k, 5) * W), y = 46 + Math.floor(h(k, 6) * 14); if (h(k, 7) < 0.5) put(x, y, 0xd99a2b); }
    for (let x = 0; x < W; x++) for (let y = 61; y < H; y++) put(x, y, y === 61 ? 0x3a3f46 : (x + y) % 9 === 0 ? 0x1a1d21 : 0x0c0d0f);
    for (let x = 0; x < W; x += 12) put(x, 66, 0x8a7a2c), put(x + 1, 66, 0x8a7a2c), put(x + 2, 66, 0x8a7a2c);
    for (const tx of [14, 118]) { for (let y = 40; y < 62; y++) put(tx, y, 0x050406); for (let k = 0; k < 14; k++) { put(tx - k, 44 - (k >> 1), 0x050406); put(tx + k, 46 - (k >> 1), 0x050406); } }
    g.putImageData(img, 0, 0);
    const rec = { ...gerarHumano(new Rng('menu'), 'sobrevivente'), arma: 'pe_de_cabra' }, [mcx, mcy, R] = centroHumano(rec), sp = renderVox(montarHumano(rec, poseHumano('parado', 0, rec)), { yaw: Math.PI / 2, R, mcx, mcy }); g.drawImage(sp.canvas, 70 - sp.ox, 63 - sp.oy);
  }, []);
  return <canvas ref={ref} width={140} height={70} className="arte-menu" />;
}
