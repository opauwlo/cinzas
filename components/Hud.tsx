'use client';
import { useJogo, horaStr, OBJETIVOS, pesoInv, pesoMax } from '../game/store';
import { ponte } from '../game/ponte';
import { ITENS, armaDe } from '../game/dados/itens';
import { NOME_CLIMA } from '../game/sistemas/clima';
import Ico, { ic } from './Ico';

const press = (fn: () => void) => ({ onPointerDown: (e: React.PointerEvent) => { e.stopPropagation(); fn(); } });
const pct = (v: number) => `${Math.max(0, Math.min(100, v))}%`;

const BMP: Record<string, string[]> = {
  sol: ['..#..#..', '.#.##.#.', '..####..', '#.####.#', '#.####.#', '..####..', '.#.##.#.', '..#..#..'],
  lua: ['..###...', '.##.....', '##......', '##......', '##......', '.##....#', '..#####.', '........'],
  nublado: ['........', '..###...', '.#####.#', '########', '########', '.######.', '........', '........'],
  chuva: ['..###...', '.#####.#', '########', '.######.', '........', '.#..#..#', '..#..#..', '.#..#...'],
  tempestade: ['..###...', '.#####.#', '########', '.######.', '...##...', '..##....', '...##...', '..#.....'],
  neblina: ['........', '.######.', '........', '######..', '........', '..######', '........', '.######.'],
  poeira: ['#.#..#.#', '.#.##.#.', '#..#.#..', '.#.#..##', '#.#.##..', '.#..#.#.', '#.#.#..#', '.#..#.#.'],
  vento: ['........', '.####...', '.....#..', '.#####..', '......#.', '.####.#.', '.....#..', '........'],
};
export function IcoClima({ tipo, noite, n = 14 }: { tipo: string; noite: boolean; n?: number }) {
  const k = tipo === 'limpo' ? (noite ? 'lua' : 'sol') : tipo === 'acida' ? 'chuva' : tipo; const bm = BMP[k] ?? BMP.nublado, cor = tipo === 'acida' ? '#8fe36a' : tipo === 'tempestade' ? '#e0b83a' : k === 'sol' ? '#d99a2b' : '#cfc7ae';
  return <svg width={n} height={n} viewBox="0 0 8 8" shapeRendering="crispEdges">{bm.flatMap((row, y) => [...row].map((c, x) => (c === '#' ? <rect key={`${x}${y}`} x={x} y={y} width="1" height="1" fill={cor} /> : null)))}</svg>;
}

export function Hud() {
  const s = useJogo(), h = (s.minutos % 1440) / 60, dia = Math.floor(s.minutos / 1440) + 1, noite = h < 6 || h >= 20, obj = OBJETIVOS[Math.min(s.objIdx, OBJETIVOS.length - 1)], e = ponte.entrada;
  const moodles: { k: string; icone: string; n: 1 | 2; rad?: boolean; t?: string }[] = [];
  if (s.fome < 35) moodles.push({ k: 'fome', icone: ic('delapouite', 'stomach'), n: s.fome < 15 ? 2 : 1 });
  if (s.sede < 35) moodles.push({ k: 'sede', icone: ic('sbed', 'water-drop'), n: s.sede < 15 ? 2 : 1 });
  if (s.rad > 20) moodles.push({ k: 'rad', icone: ic('lorc', 'radioactive'), n: s.rad > 60 ? 2 : 1, rad: true, t: `${Math.round(s.rad)}` });
  if (s.hp < 45) moodles.push({ k: 'hp', icone: ic('delapouite', 'heart-beats'), n: s.hp < 25 ? 2 : 1 });
  if (s.sangra) moodles.push({ k: 'sangra', icone: ic('lorc', 'bandage-roll'), n: 2 });
  if (s.stamina < 25) moodles.push({ k: 'stam', icone: ic('lorc', 'sprint'), n: 1 });
  if (s.furtivo) moodles.push({ k: 'furt', icone: ic('skoll', 'footsteps'), n: 1 });
  const q = (id: string) => s.inv[id] ?? 0, comida = q('carne_cozida') + q('enlatado') + q('pao') + q('legume') + q('carne_crua'), agua = q('agua') + q('agua_suja'), cura = q('bandagem') + q('kit'), arma = s.arma ? ITENS[s.arma] : null, am = armaDe(s.arma);
  const peso = pesoInv(s.inv), pm = pesoMax(s.inv);
  const slots = [
    { k: 'arma', ico: arma ? arma.icone : ic('lorc', 'bowie-knife'), n: am.alvo === 'tiro' ? (s.balas[am.municao ?? 'municao'] ?? 0) : -1, fn: () => ponte.cmd?.trocarArma(), cor: arma ? '#cfc7ae' : '#565c64', on: false, t: 'Q' },
    { k: 'lanterna', ico: ic('delapouite', 'flashlight'), n: s.lanterna.tem ? Math.round(s.lanterna.bat) : -1, fn: () => ponte.cmd?.lanterna(), cor: s.lanterna.ligada ? '#8fe36a' : s.lanterna.tem ? '#cfc7ae' : '#565c64', on: s.lanterna.ligada, t: 'F' },
    { k: 'agua', ico: ic('delapouite', 'water-bottle'), n: agua, fn: () => ponte.cmd?.usarRapido('agua'), cor: agua ? '#cfc7ae' : '#565c64', on: false, t: '1' },
    { k: 'comida', ico: ic('delapouite', 'canned-fish'), n: comida, fn: () => ponte.cmd?.usarRapido('comida'), cor: comida ? '#cfc7ae' : '#565c64', on: false, t: '2' },
    { k: 'curar', ico: ic('lorc', 'bandage-roll'), n: cura, fn: () => ponte.cmd?.usarRapido('curar'), cor: cura ? '#cfc7ae' : '#565c64', on: false, t: '3' },
    { k: 'antirrad', ico: ic('sbed', 'syringe'), n: q('antirrad'), fn: () => ponte.cmd?.usarRapido('antirrad'), cor: q('antirrad') ? '#cfc7ae' : '#565c64', on: false, t: '4' },
  ];
  const baixa = (k: string, v: number) => (k === 'vida' ? v < 30 : k === 'rad' ? v > 60 : v < 25);
  const Row = ({ k, ico, v, num }: { k: string; ico: string; v: number; num?: string }) => <div className={`vrow ${k} ${baixa(k, v) ? 'baixa' : ''}`}><Ico src={ico} n={14} cor={k === 'vida' ? '#e0553f' : k === 'rad' ? '#8fe36a' : k === 'fome' ? '#d99a2b' : k === 'sede' ? '#6fa6d6' : '#b9c76a'} /><div className="seg" style={{ ['--p' as string]: pct(k === 'rad' ? v : v) }}><i /></div><b>{num ?? ''}</b></div>;
  return (
    <div className="hud" style={{ ['--u' as string]: s.cfg.ui }}>
      <div className="vitais vidro degrau">
        <Row k="vida" ico={ic('delapouite', 'heart-beats')} v={s.hp} num={String(Math.max(0, Math.ceil(s.hp)))} /><Row k="fome" ico={ic('delapouite', 'stomach')} v={s.fome} /><Row k="sede" ico={ic('sbed', 'water-drop')} v={s.sede} /><Row k="stam" ico={ic('lorc', 'sprint')} v={s.stamina} />
        {(s.rad > 1 || s.cpm > 60) && <Row k="rad" ico={ic('lorc', 'radioactive')} v={s.rad} num={String(Math.round(s.rad))} />}
      </div>
      <div className="moodles" style={{ top: `calc(${(s.rad > 1 || s.cpm > 60 ? 92 : 78) * s.cfg.ui}px + var(--st))` }}>{moodles.map(m => <div key={m.k} className={`moodle n${m.n} ${m.rad ? 'rad' : ''}`}><Ico src={m.icone} n={18} cor={m.n === 2 ? '#ff8a70' : m.rad ? '#8fe36a' : '#d99a2b'} /></div>)}</div>
      <div className="relogio vidro degrau"><div className="h">{horaStr(s.minutos)}</div><div className="s"><span>DIA {dia}</span><IcoClima tipo={s.clima.tipo} noite={noite} /><span>{NOME_CLIMA[s.clima.tipo]}</span></div></div>
      <div className="obj vidro degrau"><b><em>OBJ</em> {obj.titulo}</b><div className="seg" style={{ ['--p' as string]: pct(s.objProg * 100) }}><i /></div></div>
      <div className="topo-dir">
        <button className="btn qbtn" aria-label="Mapa da zona" {...press(() => useJogo.setState({ painel: 'mapaZona' }))}><Ico src={ic('lorc', 'radar-sweep')} n={22} /></button>
        <button className="btn qbtn" aria-label="Mochila" {...press(() => useJogo.setState({ painel: 'inv' }))}><Ico src={ic('delapouite', 'backpack')} n={22} /><small style={{ color: peso > pm * 0.9 ? '#e0553f' : undefined }}>{Math.round(peso)}</small></button>
        <button className="btn qbtn" aria-label="Pausa" {...press(() => useJogo.setState({ painel: 'pausa' }))}><svg width="14" height="14" viewBox="0 0 8 8" shapeRendering="crispEdges"><rect x="1" y="0" width="2" height="8" fill="#cfc7ae" /><rect x="5" y="0" width="2" height="8" fill="#cfc7ae" /></svg></button>
      </div>
      <div className="toasts">{s.toasts.map(t => <div key={t.id} className="toast" style={{ color: t.cor }}>{t.texto}</div>)}</div>
      {s.acao && <div className="acao"><div className="r">{s.acao.rotulo}</div><div className="seg" style={{ ['--p' as string]: pct(s.acao.p * 100) }}><i /></div></div>}
      {s.dica && <div className="dica">{s.dica}</div>}
      <div className="dir-bot">
        <button className={`btn mini ${s.furtivo ? 'on' : ''}`} aria-label="Furtivo" {...press(() => { e.furtivo = !e.furtivo; useJogo.setState({ furtivo: e.furtivo }); })}><Ico src={ic('skoll', 'footsteps')} n={24} cor={s.furtivo ? '#8fe36a' : '#cfc7ae'} /></button>
        <button className="btn mini" aria-label="Correr" onPointerDown={ev => { ev.stopPropagation(); e.correr = true; ev.currentTarget.style.color = '#8fe36a'; }} onPointerUp={ev => { e.correr = false; ev.currentTarget.style.color = ''; }} onPointerCancel={ev => { e.correr = false; ev.currentTarget.style.color = ''; }} onPointerLeave={ev => { e.correr = false; ev.currentTarget.style.color = ''; }}><Ico src={ic('lorc', 'sprint')} n={24} /></button>
        <div className="inter">{s.alvo && <div className="rot vidro degrau">{s.alvo}</div>}<button className={`btn aviso ${s.alvo ? 'pisca' : 'off'}`} aria-label="Interagir" {...press(() => ponte.cmd?.interagir())}><Ico src={ic('delapouite', 'crafting')} n={34} cor="#1c0e04" /></button></div>
      </div>
      <div className="hotbar vidro degrau">{slots.map(sl => <button key={sl.k} className={`slot ${sl.n === 0 ? 'vazio' : ''} ${sl.on ? 'on' : ''}`} aria-label={sl.k} {...press(sl.fn)}><Ico src={sl.ico} n={28} cor={sl.cor} />{sl.n >= 0 && <span className="q">{sl.n}</span>}<span className="k">{sl.t}</span></button>)}</div>
      {s.cfg.fps && <div className="fpsc">{s.fps} fps</div>}
    </div>
  );
}

export function Sobreposicoes() {
  const s = useJogo();
  return (<><div className="vinheta" /><div className={`perigo-borda ${s.hp < 30 ? 'on' : ''}`} /><div className="rad-tom" style={{ opacity: Math.min(1, Math.max(0, (s.cpm - 120) / 500)) }} />{s.danoTs ? <div key={s.danoTs} className="dano-flash" /> : null}</>);
}
