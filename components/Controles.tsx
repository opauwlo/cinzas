'use client';
import { useEffect, useRef } from 'react';
import { ponte } from '../game/ponte';
import { useJogo } from '../game/store';
import { vibra } from '../game/audio';
import { ITENS, armaDe } from '../game/dados/itens';
import Ico, { ic } from './Ico';

/**
 * Controles FIXOS (um polegar para cada lado), sempre no mesmo lugar para o músculo aprender:
 *  - MANCHE (embaixo, lado do polegar esquerdo): a velocidade vem de quanto você empurra:
 *    leve = furtivo (silencioso) · médio = andar · até a borda = correr. Sem botões de correr/furtivo para segurar.
 *  - ATAQUE (embaixo, lado do polegar direito): TOCAR = um golpe (mira no inimigo mais próximo à frente);
 *    SEGURAR = ataque automático (gira para o inimigo mais próximo e bate no ritmo da arma; sem alvo, não gasta tiro nem fôlego);
 *    ARRASTAR a partir do botão = mira à mão.
 *  - Tocar num objeto do mundo interage com ele (camada de fundo). O modo canhoto troca os lados.
 * Zonas do manche com histerese (não "pisca" entre modos) e uma vibração curta ao trocar de modo.
 */
type Modo = 'furtivo' | 'andar' | 'correr';
/** quanto tempo segurar o botão de ataque para ligar o ataque automático */
export const SEGURAR_AUTO_MS = 260;
export default function Controles() {
  const mundo = useRef<HTMLDivElement>(null), stick = useRef<HTMLDivElement>(null), atk = useRef<HTMLDivElement>(null);
  const canhoto = useJogo(s => s.cfg.canhoto), arma = useJogo(s => s.arma), balas = useJogo(s => s.balas), am = armaDe(arma);
  useEffect(() => {
    const en = ponte.entrada, limpa: (() => void)[] = [];
    const ouve = (el: HTMLElement, tipo: string, fn: (e: PointerEvent) => void) => { el.addEventListener(tipo, fn as EventListener); limpa.push(() => el.removeEventListener(tipo, fn as EventListener)); };
    const prende = (el: HTMLElement, e: PointerEvent) => { try { el.setPointerCapture(e.pointerId); } catch { /* ponteiro sintético (testes) */ } };

    // ---- toque no mundo: interage com o objeto sob o dedo
    const camada = mundo.current!;
    ouve(camada, 'pointerdown', e => { const r = camada.getBoundingClientRect(); ponte.cmd?.tocarMundo(e.clientX - r.left, e.clientY - r.top); });

    // ---- manche fixo
    const sEl = stick.current!, base = sEl.querySelector('.stick-base') as HTMLElement, knob = base.firstElementChild as HTMLElement;
    let sid = -1, cx = 0, cy = 0, R = 52, modo: Modo = 'andar';
    const empurra = (px: number, py: number) => {
      const dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy), f = Math.min(1, d / R), nx = d > 4 ? dx / d : 0, ny = d > 4 ? dy / d : 0;
      knob.style.transform = `translate(${nx * f * R}px, ${ny * f * R}px)`;
      const mov = f > 0.14; en.mx = mov ? nx * Math.max(f, 0.6) : 0; en.my = mov ? ny * Math.max(f, 0.6) : 0;
      const novo: Modo = !mov ? modo : modo === 'correr' ? (f < 0.76 ? 'andar' : 'correr') : modo === 'furtivo' ? (f > 0.46 ? 'andar' : 'furtivo') : f >= 0.9 ? 'correr' : f < 0.3 ? 'furtivo' : 'andar';
      if (novo !== modo) { modo = novo; sEl.dataset.m = modo; vibra(7); }
      en.correr = mov && modo === 'correr'; en.furtivo = mov && modo === 'furtivo';
    };
    const soltaS = (e: PointerEvent) => { if (e.pointerId !== sid) return; sid = -1; sEl.dataset.on = '0'; sEl.dataset.m = 'parado'; knob.style.transform = ''; en.mx = 0; en.my = 0; en.correr = false; en.furtivo = false; };
    ouve(sEl, 'pointerdown', e => { if (sid >= 0) return; sid = e.pointerId; prende(sEl, e); const r = base.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; R = r.width * 0.42; modo = 'andar'; sEl.dataset.on = '1'; sEl.dataset.m = 'andar'; empurra(e.clientX, e.clientY); });
    ouve(sEl, 'pointermove', e => { if (e.pointerId === sid) empurra(e.clientX, e.clientY); });
    for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) ouve(sEl, t, soltaS);

    // ---- botão de ataque: tocar = golpe · segurar = automático · arrastar = mira à mão
    const aEl = atk.current!; let aid = -1, ox = 0, oy = 0, timer: number | undefined;
    const soltaA = (e: PointerEvent) => { if (e.pointerId !== aid) return; aid = -1; window.clearTimeout(timer); aEl.dataset.on = '0'; aEl.dataset.auto = '0'; en.auto = false; en.atacar = false; en.mira = false; en.ax = 0; en.ay = 0; };
    ouve(aEl, 'pointerdown', e => {
      if (aid >= 0) return; aid = e.pointerId; prende(aEl, e); const r = aEl.getBoundingClientRect(); ox = r.left + r.width / 2; oy = r.top + r.height / 2;
      en.tap++; aEl.dataset.on = '1'; aEl.dataset.auto = '0';
      timer = window.setTimeout(() => { if (aid < 0 || en.mira) return; en.auto = true; aEl.dataset.auto = '1'; vibra([14, 30, 14]); }, SEGURAR_AUTO_MS);
    });
    ouve(aEl, 'pointermove', e => {
      if (e.pointerId !== aid) return; const dx = e.clientX - ox, dy = e.clientY - oy, d = Math.hypot(dx, dy);
      if (d > 38) { const f = Math.min(1, d / 80); en.mira = true; en.ax = (dx / d) * f; en.ay = (dy / d) * f; en.auto = false; aEl.dataset.auto = '0'; } else { en.mira = false; en.ax = 0; en.ay = 0; }
    });
    for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) ouve(aEl, t, soltaA);

    return () => { limpa.forEach(f => f()); window.clearTimeout(timer); en.mx = en.my = en.ax = en.ay = 0; en.mira = en.atacar = en.auto = en.correr = en.furtivo = false; };
  }, [canhoto]);
  return (
    <>
      <div ref={mundo} className="zona-mundo" />
      <div ref={stick} className={`stick ${canhoto ? 'dir' : 'esq'}`} data-m="parado" data-on="0" aria-label="Manche: mover"><div className="stick-base"><i className="stick-knob" /></div></div>
      <div ref={atk} className={`atk ${canhoto ? 'esq' : 'dir'}`} data-on="0" data-auto="0" role="button" aria-label="Atacar: toque para um golpe, segure para atacar sozinho">
        <svg className="anel" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" /></svg>
        <Ico src={arma ? ITENS[arma].icone : ic('lorc', 'bowie-knife')} n={44} cor="#ffe6dc" />
        {am.alvo === 'tiro' && <span className="q">{balas[am.municao ?? 'municao'] ?? 0}</span>}
        <b className="auto">AUTO</b>
      </div>
    </>
  );
}
