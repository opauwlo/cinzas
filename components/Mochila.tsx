'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import { useJogo } from '../game/store';
import { ITENS, COR_RARIDADE, armaDe } from '../game/dados/itens';
import { COLS, linhasDe, tamDe, cabeEm, livres, moverPeca, girarPeca, organizarMochila, EQUIPADO } from '../game/sistemas/grade';
import { ponte } from '../game/ponte';
import { sfx } from '../game/audio';
import Ico, { ic } from './Ico';
import { Cartao, p } from './Cartao';

const GAP = 2;
type Arrasto = { i: number; dx: number; dy: number; x: number; y: number; ok: boolean };

/** Mochila em grade (estilo "maleta" do Resident Evil 4): arraste para arrumar, gire para encaixar. O espaço é o limite, não o peso. */
export function Mochila() {
  const s = useJogo(), linhas = linhasDe(s.inv), grade = s.grade, box = useRef<HTMLDivElement>(null);
  const [cel, setCel] = useState(44), [sel, setSel] = useState<number | null>(null), [arr, setArr] = useState<Arrasto | null>(null);
  useLayoutEffect(() => { const el = box.current; if (!el) return; const f = () => setCel(Math.max(30, Math.min(52, Math.floor((el.clientWidth - GAP * (COLS - 1)) / COLS)))); f(); const ro = new ResizeObserver(f); ro.observe(el); return () => ro.disconnect(); }, []);
  const passo = cel + GAP, lv = livres(grade, linhas), pc = sel !== null ? grade[sel] : undefined, it = pc ? ITENS[pc.id] : undefined;

  const iniciar = (e: React.PointerEvent, i: number) => {
    e.stopPropagation(); setSel(i); const el = e.currentTarget as HTMLElement; try { el.setPointerCapture(e.pointerId); } catch { /* ponteiro sintético (testes) */ }
    const peca = grade[i], x0 = e.clientX, y0 = e.clientY; let arrastando = false, ult: Arrasto | null = null;
    const calc = (ev: PointerEvent): Arrasto => { const dx = ev.clientX - x0, dy = ev.clientY - y0, gx = Math.round((peca.x * passo + dx) / passo), gy = Math.round((peca.y * passo + dy) / passo); return { i, dx, dy, x: gx, y: gy, ok: cabeEm(grade, linhas, peca.id, gx, gy, peca.r, i) }; };
    const mv = (ev: PointerEvent) => { if (!arrastando && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 7) return; arrastando = true; ult = calc(ev); setArr(ult); };
    const up = (ev: PointerEvent) => {
      el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      if (arrastando) { const f = ult ?? calc(ev); if (f.ok && moverPeca(i, f.x, f.y, peca.r)) sfx.ui('clique'); else sfx.ui('erro'); } setArr(null);
    };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };
  const acao = (id: string) => { const t = ITENS[id]; if (t.tipo === 'arma') return s.arma === id ? '' : 'Equipar'; if (id === 'mascara') return s.mascara ? 'Tirar' : 'Colocar'; if (id === 'lanterna') return s.lanterna.ligada ? 'Apagar' : 'Acender'; if (t.tipo === 'especial') return 'Sintonizar'; if (t.tipo === 'comida' || t.tipo === 'bebida' || t.tipo === 'cura' || id === 'kit_fogueira' || id === 'combustivel' || id === 'bateria') return 'Usar'; return ''; };
  const usar = (id: string) => { ponte.cmd?.usarItem(id); const t = ITENS[id].tipo; if (t === 'comida' || t === 'bebida' || t === 'cura' || id === 'kit_fogueira' || id === 'combustivel') useJogo.setState({ painel: null }); };
  const a = pc ? acao(pc.id) : '';

  return (
    <Cartao titulo="Mochila" larg={470}
      rodape={<div className="mini">Arma: <b>{s.arma ? ITENS[s.arma].nome : 'Punhos'}</b> · balas 9mm <b>{s.balas.municao}</b> · cartuchos <b>{s.balas.cartucho}</b> · combustível <b>{s.combustivel}</b></div>}>
      <div className="mochila-topo"><span className="mini">Espaço livre: <b style={{ color: lv <= 3 ? 'var(--sangue2)' : 'var(--fosf)' }}>{lv}</b> de {COLS * linhas}</span><button className="btn peq" {...p(() => { organizarMochila(); sfx.ui('ok'); setSel(null); })}>Organizar</button></div>
      <div ref={box} className="mochila-grade" style={{ gridTemplateColumns: `repeat(${COLS}, ${cel}px)`, gridAutoRows: `${cel}px`, gap: GAP }} onPointerDown={() => setSel(null)}>
        {Array.from({ length: COLS * linhas }, (_, k) => <div key={k} className="cel" />)}
        {grade.map((pe, i) => {
          const [w, h] = tamDe(pe.id, pe.r), item = ITENS[pe.id], cor = COR_RARIDADE[item.raridade], mov = arr?.i === i ? arr : null;
          return (
            <div key={`${pe.id}-${i}`} className={`peca ${sel === i ? 'sel' : ''} ${mov ? 'arr' : ''}`} onPointerDown={e => iniciar(e, i)}
              style={{ left: pe.x * passo, top: pe.y * passo, width: w * cel + (w - 1) * GAP, height: h * cel + (h - 1) * GAP, ['--rc' as string]: cor, transform: mov ? `translate(${mov.dx}px, ${mov.dy}px)` : undefined, zIndex: mov ? 6 : sel === i ? 3 : 1 }}>
              <Ico src={item.icone} n={Math.max(16, Math.floor(Math.min(w * cel, h * cel) * 0.62))} cor={item.tom ?? cor} />
              {pe.q > 1 && <b className="q">{pe.q}</b>}
            </div>
          );
        })}
        {arr && <div className={`fantasma ${arr.ok ? 'ok' : 'no'}`} style={{ left: arr.x * passo, top: arr.y * passo, width: tamDe(grade[arr.i].id, grade[arr.i].r)[0] * cel + (tamDe(grade[arr.i].id, grade[arr.i].r)[0] - 1) * GAP, height: tamDe(grade[arr.i].id, grade[arr.i].r)[1] * cel + (tamDe(grade[arr.i].id, grade[arr.i].r)[1] - 1) * GAP }} />}
      </div>
      <div className="equipado">
        {[['arma', s.arma ? ITENS[s.arma].icone : ic('lorc', 'bowie-knife'), s.arma ? ITENS[s.arma].nome : 'Punhos', armaDe(s.arma).alvo === 'tiro' ? `${s.balas[armaDe(s.arma).municao ?? 'municao'] ?? 0} balas` : 'arma branca'],
          ['mochila', ITENS.mochila.icone, s.inv.mochila ? 'Mochila grande' : 'Mochila', s.inv.mochila ? '+2 linhas' : 'comum'],
          ['colete', ITENS.colete.icone, s.inv.colete ? 'Colete' : 'Sem colete', s.inv.colete ? '−25% dano' : '—']].map(([k, ico, n, d]) => <div key={k} className={`eq ${k === 'arma' || (k === 'mochila' && s.inv.mochila) || (k === 'colete' && s.inv.colete) ? 'on' : ''}`}><Ico src={ico} n={22} cor="#cfc7ae" /><div><b>{n}</b><small>{d}</small></div></div>)}
      </div>
      <div className="detalhe card aco">
        {pc && it ? (
          <>
            <div className="dh"><div className="im"><Ico src={it.icone} n={30} cor={it.tom ?? COR_RARIDADE[it.raridade]} /></div><div><b style={{ color: COR_RARIDADE[it.raridade] }}>{it.nome}{pc.q > 1 ? ` ×${pc.q}` : ''}</b><small>{it.desc}</small></div></div>
            <div className="bt2">
              {a && <button className="btn aviso peq" {...p(() => usar(pc.id))}>{a}</button>}
              {tamDe(pc.id)[0] !== tamDe(pc.id)[1] && <button className="btn peq" {...p(() => { if (girarPeca(sel!)) sfx.ui('clique'); else { useJogo.getState().toast('Não cabe girado.', '#d9a02b'); sfx.ui('erro'); } })}>Girar</button>}
              <button className="btn peq" {...p(() => { ponte.cmd?.largar(pc.id, pc.q); setSel(null); })}>Largar{pc.q > 1 ? ' tudo' : ''}</button>
            </div>
          </>
        ) : <div className="mini">Toque num item para ver detalhes. <b>Arraste</b> para arrumar a mochila e use <b>Girar</b> para encaixar peças compridas. Itens vestidos ({EQUIPADO.map(i => ITENS[i].nome.toLowerCase()).join(', ')}) não ocupam espaço.</div>}
      </div>
    </Cartao>
  );
}
