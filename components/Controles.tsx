'use client';
import { useEffect, useRef } from 'react';
import { ponte } from '../game/ponte';
import { useJogo } from '../game/store';

/** Dois sticks flutuantes: esquerdo move; direito ataca (toque = mira automática, arrastar = mira manual). Toque num objeto próximo interage. */
export default function Controles() {
  const esq = useRef<HTMLDivElement>(null), dir = useRef<HTMLDivElement>(null), j1 = useRef<HTMLDivElement>(null), j2 = useRef<HTMLDivElement>(null);
  const canhoto = useJogo(s => s.cfg.canhoto);
  useEffect(() => {
    const en = ponte.entrada; const limpa = [] as (() => void)[];
    const ligar = (zona: HTMLDivElement, joy: HTMLDivElement, papel: 'mover' | 'atacar') => {
      let id = -1, ox = 0, oy = 0, t0 = 0, moveu = false, consumido = false; const knob = joy.firstElementChild as HTMLElement, R = 46;
      const atualiza = (cx: number, cy: number) => {
        const dx = cx - ox, dy = cy - oy, d = Math.hypot(dx, dy), f = Math.min(1, d / R), nx = d > 4 ? dx / d : 0, ny = d > 4 ? dy / d : 0;
        knob.style.transform = `translate(${nx * f * R}px, ${ny * f * R}px)`;
        if (papel === 'mover') { en.mx = d > 6 ? nx * f : 0; en.my = d > 6 ? ny * f : 0; }
        else if (d > 16) { moveu = true; en.mira = true; en.ax = nx * f; en.ay = ny * f; }
      };
      const down = (e: PointerEvent) => {
        if (id >= 0) return; id = e.pointerId; ox = e.clientX; oy = e.clientY; t0 = performance.now(); moveu = false; consumido = false; zona.setPointerCapture(e.pointerId);
        if (papel === 'atacar') { const r = zona.getBoundingClientRect(), mundo = zona.parentElement!.getBoundingClientRect(); if (ponte.cmd?.tocarMundo(e.clientX - mundo.left, e.clientY - mundo.top)) { consumido = true; void r; return; } en.atacar = true; en.tap++; }
        joy.style.display = 'block'; joy.style.left = ox + 'px'; joy.style.top = oy + 'px'; knob.style.transform = 'translate(0,0)';
      };
      const move = (e: PointerEvent) => { if (e.pointerId !== id || consumido) return; atualiza(e.clientX, e.clientY); };
      const up = (e: PointerEvent) => { if (e.pointerId !== id) return; id = -1; joy.style.display = 'none'; if (papel === 'mover') { en.mx = 0; en.my = 0; } else { en.atacar = false; en.mira = false; en.ax = 0; en.ay = 0; } void t0; void moveu; };
      zona.addEventListener('pointerdown', down); zona.addEventListener('pointermove', move); zona.addEventListener('pointerup', up); zona.addEventListener('pointercancel', up); zona.addEventListener('lostpointercapture', up);
      limpa.push(() => { zona.removeEventListener('pointerdown', down); zona.removeEventListener('pointermove', move); zona.removeEventListener('pointerup', up); zona.removeEventListener('pointercancel', up); zona.removeEventListener('lostpointercapture', up); });
    };
    ligar(esq.current!, j1.current!, canhoto ? 'atacar' : 'mover'); ligar(dir.current!, j2.current!, canhoto ? 'mover' : 'atacar');
    return () => { limpa.forEach(f => f()); en.mx = en.my = en.ax = en.ay = 0; en.mira = en.atacar = false; };
  }, [canhoto]);
  return (
    <>
      <div ref={esq} className="zona esq" /><div ref={dir} className="zona dir" />
      <div ref={j1} className={`joy ${canhoto ? 'dir' : ''}`}><i /></div><div ref={j2} className={`joy ${canhoto ? '' : 'dir'}`}><i /></div>
    </>
  );
}
