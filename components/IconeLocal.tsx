'use client';
import { useEffect, useRef } from 'react';
import { desenharIcone } from '../game/lib/viagem';

/** o "sprite" de cada local no mapa de viagem: o mesmo marco que aparece no horizonte da estrada, em pixel art */
export default function IconeLocal({ id, travado = false, w = 56, h = 46 }: { id: string; travado?: boolean; w?: number; h?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const g = ref.current?.getContext('2d'); if (g) desenharIcone(g, id, w, h); }, [id, w, h]);
  return <canvas ref={ref} width={w} height={h} className="icone-local" style={{ opacity: travado ? 0.4 : 1, filter: travado ? 'grayscale(.8)' : undefined }} />;
}
