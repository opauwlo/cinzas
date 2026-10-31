'use client';
import { useEffect, useState } from 'react';

// Ícones game-icons.net (CC BY 3.0) convertidos para pixel art 1-bit com contorno, para combinar com o resto da arte.
const cache = new Map<string, string>(); const pend = new Map<string, Promise<string>>();
function gerar(src: string, cor: string, n: number): Promise<string> {
  const k = `${src}|${cor}|${n}`; if (cache.has(k)) return Promise.resolve(cache.get(k)!); if (pend.has(k)) return pend.get(k)!;
  const p = new Promise<string>(res => {
    const im = new Image(); im.onload = () => {
      const big = document.createElement('canvas'); big.width = big.height = n * 4; const g = big.getContext('2d')!; g.drawImage(im, 0, 0, n * 4, n * 4);
      const sm = document.createElement('canvas'); sm.width = sm.height = n; const sg = sm.getContext('2d')!; sg.imageSmoothingQuality = 'high'; sg.drawImage(big, 0, 0, n, n);
      const d = sg.getImageData(0, 0, n, n), o = sg.createImageData(n, n), on = (x: number, y: number) => x >= 0 && y >= 0 && x < n && y < n && d.data[(y * n + x) * 4] > 118;
      const r = parseInt(cor.slice(1, 3), 16), gg = parseInt(cor.slice(3, 5), 16), b = parseInt(cor.slice(5, 7), 16);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const i = (y * n + x) * 4;
        if (on(x, y)) { const sh = on(x - 1, y - 1) && on(x + 1, y + 1) && (x + y) % 3 ? 1 : 0.8; o.data[i] = r * sh; o.data[i + 1] = gg * sh; o.data[i + 2] = b * sh; o.data[i + 3] = 255; }
        else if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) { o.data[i] = 8; o.data[i + 1] = 8; o.data[i + 2] = 9; o.data[i + 3] = 255; }
      }
      sg.putImageData(o, 0, 0); const u = sm.toDataURL(); cache.set(k, u); res(u);
    }; im.onerror = () => res(''); im.src = src;
  });
  pend.set(k, p); return p;
}
export default function Ico({ src, cor = '#cfc7ae', n = 22, esc = 1, style }: { src: string; cor?: string; n?: number; esc?: number; style?: React.CSSProperties }) {
  const [u, setU] = useState(() => cache.get(`${src}|${cor}|${n}`) ?? '');
  useEffect(() => { let vivo = true; gerar(src, cor, n).then(x => { if (vivo) setU(x); }); return () => { vivo = false; }; }, [src, cor, n]);
  return <img src={u || undefined} alt="" width={n * esc} height={n * esc} style={{ imageRendering: 'pixelated', display: 'block', opacity: u ? 1 : 0, ...style }} draggable={false} />;
}
export const ic = (a: string, n: string) => `/icons/${a}/${n}.svg`;
