'use client';
import { useEffect, useRef } from 'react';
import { ponte } from '../game/ponte';
import { useJogo } from '../game/store';
import { vibra } from '../game/audio';

/**
 * Controles dinâmicos (um polegar para cada lado):
 *  - Esquerdo = MOVER. O stick nasce embaixo do dedo e SEGUE o dedo (nunca "acaba" o curso). A velocidade vem de quanto você empurra:
 *    leve = furtivo (silencioso) · médio = andar · até a borda = correr. Sem botões de correr/furtivo para segurar.
 *  - Direito = AGIR. Tocar ataca (mira sozinha), segurar mantém, arrastar mira à mão. Tocar num objeto próximo interage.
 * Zonas com histerese (não "pisca" entre modos) e um toque de vibração ao trocar de modo.
 */
type Modo = 'furtivo' | 'andar' | 'correr';
export default function Controles() {
  const esq = useRef<HTMLDivElement>(null), dir = useRef<HTMLDivElement>(null), j1 = useRef<HTMLDivElement>(null), j2 = useRef<HTMLDivElement>(null);
  const canhoto = useJogo(s => s.cfg.canhoto);
  useEffect(() => {
    const en = ponte.entrada; const limpa = [] as (() => void)[];
    const ligar = (zona: HTMLDivElement, joy: HTMLDivElement, papel: 'mover' | 'atacar') => {
      let id = -1, ox = 0, oy = 0, consumido = false, modo: Modo = 'andar'; const knob = joy.firstElementChild as HTMLElement, R = papel === 'mover' ? 54 : 46;
      const atualiza = (cx: number, cy: number) => {
        let dx = cx - ox, dy = cy - oy, d = Math.hypot(dx, dy);
        if (d > R * 1.2) { const k = (d - R * 1.2) / d; ox += dx * k; oy += dy * k; dx = cx - ox; dy = cy - oy; d = Math.hypot(dx, dy); joy.style.left = ox + 'px'; joy.style.top = oy + 'px'; } // o stick acompanha o dedo
        const f = Math.min(1, d / R), nx = d > 4 ? dx / d : 0, ny = d > 4 ? dy / d : 0;
        knob.style.transform = `translate(${nx * f * R}px, ${ny * f * R}px)`;
        if (papel === 'mover') {
          const mov = f > 0.14; en.mx = mov ? nx * Math.max(f, 0.6) : 0; en.my = mov ? ny * Math.max(f, 0.6) : 0;
          const novo: Modo = !mov ? modo : modo === 'correr' ? (f < 0.76 ? 'andar' : 'correr') : modo === 'furtivo' ? (f > 0.46 ? 'andar' : 'furtivo') : f >= 0.9 ? 'correr' : f < 0.3 ? 'furtivo' : 'andar';
          if (novo !== modo) { modo = novo; joy.dataset.m = modo; vibra(7); }
          en.correr = mov && modo === 'correr'; en.furtivo = mov && modo === 'furtivo';
        } else if (d > 16) { en.mira = true; en.ax = nx * f; en.ay = ny * f; }
      };
      const down = (e: PointerEvent) => {
        if (id >= 0) return; id = e.pointerId; ox = e.clientX; oy = e.clientY; consumido = false; modo = 'andar'; joy.dataset.m = 'andar'; try { zona.setPointerCapture(e.pointerId); } catch { /* ponteiro sintético (testes) */ }
        if (papel === 'atacar') { const mundo = zona.parentElement!.getBoundingClientRect(); if (ponte.cmd?.tocarMundo(e.clientX - mundo.left, e.clientY - mundo.top)) { consumido = true; return; } en.atacar = true; en.tap++; }
        joy.style.display = 'block'; joy.style.left = ox + 'px'; joy.style.top = oy + 'px'; knob.style.transform = 'translate(0,0)';
      };
      const move = (e: PointerEvent) => { if (e.pointerId !== id || consumido) return; atualiza(e.clientX, e.clientY); };
      const up = (e: PointerEvent) => { if (e.pointerId !== id) return; id = -1; joy.style.display = 'none'; if (papel === 'mover') { en.mx = 0; en.my = 0; en.correr = false; en.furtivo = false; } else { en.atacar = false; en.mira = false; en.ax = 0; en.ay = 0; } };
      zona.addEventListener('pointerdown', down); zona.addEventListener('pointermove', move); zona.addEventListener('pointerup', up); zona.addEventListener('pointercancel', up); zona.addEventListener('lostpointercapture', up);
      limpa.push(() => { zona.removeEventListener('pointerdown', down); zona.removeEventListener('pointermove', move); zona.removeEventListener('pointerup', up); zona.removeEventListener('pointercancel', up); zona.removeEventListener('lostpointercapture', up); });
    };
    ligar(esq.current!, j1.current!, canhoto ? 'atacar' : 'mover'); ligar(dir.current!, j2.current!, canhoto ? 'mover' : 'atacar');
    return () => { limpa.forEach(f => f()); en.mx = en.my = en.ax = en.ay = 0; en.mira = en.atacar = en.correr = en.furtivo = false; };
  }, [canhoto]);
  return (
    <>
      <div ref={esq} className="zona esq" /><div ref={dir} className="zona dir" />
      <div ref={j1} className={`joy ${canhoto ? 'dir' : 'mover'}`}><i /></div><div ref={j2} className={`joy ${canhoto ? 'mover' : 'dir'}`}><i /></div>
    </>
  );
}
