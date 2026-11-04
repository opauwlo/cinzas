'use client';
import { useEffect, useRef, useState } from 'react';
import { useJogo, horaStr, OBJETIVOS, gravarCfg, type Configs } from '../game/store';
import { sfx, setAvisoVisual } from '../game/audio';
import { setaPan } from '../game/lib/radiacao/geiger';
import RadioBalao from '../game/lib/escuta/RadioBalao';
import { linhasDe, livres } from '../game/sistemas/grade';
import { ponte } from '../game/ponte';
import { ITENS, armaDe } from '../game/dados/itens';
import { NOME_CLIMA } from '../game/sistemas/clima';
import { xpNivel } from '../game/sistemas/progresso';
import { pronto, progresso } from '../game/sistemas/contratos';
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
const BMP_MODO: Record<string, string[]> = {
  dedo: ['...##...', '...##...', '...##...', '...###..', '.#######', '########', '.#######', '..#####.'],
  manche: ['...##...', '..####..', '...##...', '...##...', '...##...', '.######.', '########', '########'],
};
/** ícone do modo de controle: dedo = uma mão (toque), manche = duas mãos */
function IcoModo({ uma }: { uma: boolean }) { const bm = BMP_MODO[uma ? 'dedo' : 'manche']; return <svg width={22} height={22} viewBox="0 0 8 8" shapeRendering="crispEdges">{bm.flatMap((row, y) => [...row].map((c, x) => (c === '#' ? <rect key={`${x}${y}`} x={x} y={y} width="1" height="1" fill="#cfc7ae" /> : null)))}</svg>; }
function trocaControle() { const c = useJogo.getState().cfg, n: Configs = { ...c, controle: c.controle === 'toque' ? 'manche' : 'toque' }; useJogo.setState({ cfg: n }); gravarCfg(n); sfx.ui('clique'); useJogo.getState().toast(n.controle === 'toque' ? 'Uma mão: toque no chão para andar' : 'Duas mãos: manche e botão de ataque', '#8fe36a'); }
export function IcoClima({ tipo, noite, n = 14 }: { tipo: string; noite: boolean; n?: number }) {
  const k = tipo === 'limpo' ? (noite ? 'lua' : 'sol') : tipo === 'acida' ? 'chuva' : tipo; const bm = BMP[k] ?? BMP.nublado, cor = tipo === 'acida' ? '#8fe36a' : tipo === 'tempestade' ? '#e0b83a' : k === 'sol' ? '#d99a2b' : '#cfc7ae';
  return <svg width={n} height={n} viewBox="0 0 8 8" shapeRendering="crispEdges">{bm.flatMap((row, y) => [...row].map((c, x) => (c === '#' ? <rect key={`${x}${y}`} x={x} y={y} width="1" height="1" fill={cor} /> : null)))}</svg>;
}

const baixa = (k: string, v: number) => (k === 'vida' ? v < 30 : k === 'rad' ? v > 60 : v < 25);
/** verdadeiro por `ms` depois de qualquer mudança em `chave` (e logo ao montar): base do HUD que se acalma quando nada acontece */
function useRecente(chave: string, ms = 9000) {
  const [on, setOn] = useState(true);
  useEffect(() => { setOn(true); const t = setTimeout(() => setOn(false), ms); return () => clearTimeout(t); }, [chave, ms]);
  return on;
}
/** linha de vital: discreta quando está tudo bem; acende ao mudar (3 s) ou ficar crítica */
function VRow({ k, ico, v, num, max = 100 }: { k: string; ico: string; v: number; num?: string; max?: number }) {
  const [mudou, setMudou] = useState(false), ant = useRef(v);
  useEffect(() => { if (Math.abs(v - ant.current) >= 1.5) { ant.current = v; setMudou(true); const t = setTimeout(() => setMudou(false), 3500); return () => clearTimeout(t); } ant.current = v; }, [v]);
  const crit = baixa(k, v), calma = !crit && !mudou && (k === 'rad' ? v < 10 : v >= 70);
  return <div role="meter" aria-label={({ vida: 'Vida', fome: 'Saciedade', sede: 'Hidratação', stam: 'Fôlego', rad: 'Radiação' } as Record<string, string>)[k]} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(v)} className={`vrow ${k} ${crit ? 'baixa' : ''} ${calma ? 'calma' : ''}`}><Ico src={ico} n={14} cor={k === 'vida' ? '#e0553f' : k === 'rad' ? '#8fe36a' : k === 'fome' ? '#d99a2b' : k === 'sede' ? '#6fa6d6' : '#b9c76a'} /><div className="seg" style={{ ['--p' as string]: pct(v / max * 100) }}><i /></div><b>{num ?? ''}</b></div>;
}
// ---------------------------------------------------------------- legendas visuais de som (acessibilidade: o que soou e de que lado)
const LEGENDA: Record<string, [string, string]> = {
  zumbi: ['rosnado', '#e0553f'], corredor: ['rosnado rápido', '#e0553f'], cao: ['latido', '#e0553f'], javali: ['grunhido', '#d99a2b'], cervo: ['animal', '#8fe36a'], rato: ['guincho', '#d99a2b'], inseto: ['zumbido', '#d99a2b'], corvo: ['corvo', '#cfc7ae'], humano: ['voz humana', '#e0b83a'],
  colosso: ['COLOSSO', '#ff8a70'], tiro_inimigo: ['tiro', '#ff8a70'], dano: ['você foi atingido', '#ff8a70'], porta: ['porta', '#cfc7ae'], trovao: ['trovão', '#6fa6d6'], alarme: ['ALARME', '#ff8a70'], sinal: ['rádio', '#8fe36a'], freio: ['freio', '#cfc7ae'],
};
type AvisoUI = { id: number; rot: string; cor: string; lado: number };
function SonsVisuais({ cpm, hp, pan }: { cpm: number; hp: number; pan: number }) {
  const [avisos, setAvisos] = useState<AvisoUI[]>([]), ult = useRef<Record<string, number>>({});
  useEffect(() => {
    let id = 1;
    setAvisoVisual(a => {
      const l = LEGENDA[a.nome]; if (!l) return;
      const agora = Date.now(); if (agora - (ult.current[a.nome] ?? 0) < 900) return; ult.current[a.nome] = agora; // sem repetir a mesma legenda em menos de 0,9 s
      const item: AvisoUI = { id: id++, rot: l[0], cor: l[1], lado: a.pan < -0.2 ? -1 : a.pan > 0.2 ? 1 : 0 };
      setAvisos(v => [...v.slice(-3), item]);
      setTimeout(() => setAvisos(v => v.filter(x => x.id !== item.id)), 2600);
    });
    return () => setAvisoVisual(null);
  }, []);
  const g = cpm > 400 ? 3 : cpm > 180 ? 2 : cpm > 60 ? 1 : 0;
  return (
    <div className="sons-visuais" role="status" aria-live="polite">
      {g > 0 && <div className="sv" style={{ color: '#8fe36a', animationDuration: `${[1.2, 0.7, 0.35][g - 1]}s` }}><Ico src={ic('lorc', 'radioactive')} n={13} cor="#8fe36a" /> {setaPan(pan) === '◀' ? '◀ ' : ''}Geiger {['fraco', 'médio', 'FORTE'][g - 1]}{setaPan(pan) === '▶' ? ' ▶' : ''}</div>}
      {hp < 30 && <div className="sv" style={{ color: '#e0553f', animationDuration: '0.9s' }}><Ico src={ic('delapouite', 'heart-beats')} n={13} cor="#e0553f" /> coração acelerado</div>}
      {avisos.map(a => <div key={a.id} className="sv pontual" style={{ color: a.cor }}>{a.lado < 0 ? '◀ ' : ''}{a.rot}{a.lado > 0 ? ' ▶' : ''}</div>)}
    </div>
  );
}

const icoAcao = (rot: string | null) => (!rot ? ic('delapouite', 'crafting') : /vasculh|abrir|revist|suprimentos/i.test(rot) ? ic('delapouite', 'cardboard-box') : /cort|desmont|esfol|rasg/i.test(rot) ? ic('lorc', 'machete') : /[aá]gua/i.test(rot) ? ic('sbed', 'water-drop') : /dorm/i.test(rot) ? ic('lorc', 'bandage-roll') : /jipe|viaj/i.test(rot) ? ic('delapouite', 'car-door') : ic('delapouite', 'crafting'));

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
  const q = (id: string) => s.inv[id] ?? 0, comida = q('carne_cozida') + q('enlatado') + q('pao') + q('legume') + q('baga') + q('cogumelo') + q('carne_crua'), agua = q('agua') + q('agua_suja'), cura = q('bandagem') + q('kit') + q('erva'), arma = s.arma ? ITENS[s.arma] : null, am = armaDe(s.arma);
  const lv = livres(s.grade, linhasDe(s.inv)), ctPronto = s.contratos.find(pronto), ct = ctPronto ?? s.contratos[0];
  const hotRecente = useRecente(`${s.arma}|${agua}|${comida}|${cura}|${q('antirrad')}|${s.lanterna.ligada}`, 6000), trackerAberto = useRecente(`${s.objIdx}|${s.objVal}|${ct?.id ?? ''}|${ct ? progresso(ct) : 0}`), noiteH = h < 6 || h >= 20;
  const slots = [
    { urg: false, k: 'arma', ico: arma ? arma.icone : ic('lorc', 'bowie-knife'), n: am.alvo === 'tiro' ? (s.balas[am.municao ?? 'municao'] ?? 0) : -1, fn: () => ponte.cmd?.trocarArma(), cor: arma ? '#cfc7ae' : '#565c64', on: false, t: 'Q' },
    { urg: noiteH && s.lanterna.tem && !s.lanterna.ligada, k: 'lanterna', ico: ic('delapouite', 'flashlight'), n: s.lanterna.tem ? Math.round(s.lanterna.bat) : -1, fn: () => ponte.cmd?.lanterna(), cor: s.lanterna.ligada ? '#8fe36a' : s.lanterna.tem ? '#cfc7ae' : '#565c64', on: s.lanterna.ligada, t: 'F' },
    { urg: s.sede < 35 && agua > 0, k: 'agua', ico: ic('delapouite', 'water-bottle'), n: agua, fn: () => ponte.cmd?.usarRapido('agua'), cor: agua ? '#cfc7ae' : '#565c64', on: false, t: '1' },
    { urg: s.fome < 35 && comida > 0, k: 'comida', ico: ic('delapouite', 'canned-fish'), n: comida, fn: () => ponte.cmd?.usarRapido('comida'), cor: comida ? '#cfc7ae' : '#565c64', on: false, t: '2' },
    { urg: (s.hp < 45 || s.sangra) && cura > 0, k: 'curar', ico: ic('lorc', 'bandage-roll'), n: cura, fn: () => ponte.cmd?.usarRapido('curar'), cor: cura ? '#cfc7ae' : '#565c64', on: false, t: '3' },
    { urg: s.rad > 40 && q('antirrad') > 0, k: 'antirrad', ico: ic('sbed', 'syringe'), n: q('antirrad'), fn: () => ponte.cmd?.usarRapido('antirrad'), cor: q('antirrad') ? '#cfc7ae' : '#565c64', on: false, t: '4' },
  ];
  return (
    <div className="hud" style={{ ['--u' as string]: s.cfg.ui }}>
      <div className="vitais vidro degrau">
        <VRow k="vida" ico={ic('delapouite', 'heart-beats')} v={s.hp} max={s.maxHp} num={String(Math.max(0, Math.ceil(s.hp)))} /><VRow k="fome" ico={ic('delapouite', 'stomach')} v={s.fome} /><VRow k="sede" ico={ic('sbed', 'water-drop')} v={s.sede} /><VRow k="stam" ico={ic('lorc', 'sprint')} v={s.stamina} />
        {(s.rad > 1 || s.cpm > 60) && <VRow k="rad" ico={ic('lorc', 'radioactive')} v={s.rad} num={String(Math.round(s.rad))} />}
        <button className={`xpl ${s.pontos > 0 ? 'pts' : ''}`} aria-label="Nível e habilidades" {...press(() => useJogo.setState({ painel: s.pontos > 0 ? 'perk' : 'diario' }))}><b>NV{s.nivel}</b><div className="seg" style={{ ['--p' as string]: pct((s.xp / xpNivel(s.nivel)) * 100) }}><i /></div>{s.pontos > 0 && <b>★{s.pontos}</b>}</button>
      </div>
      <div className="moodles" style={{ top: `calc(${(s.rad > 1 || s.cpm > 60 ? 104 : 90) * s.cfg.ui}px + var(--st))` }}>{moodles.map(m => <div key={m.k} className={`moodle n${m.n} ${m.rad ? 'rad' : ''}`}><Ico src={m.icone} n={18} cor={m.n === 2 ? '#ff8a70' : m.rad ? '#8fe36a' : '#d99a2b'} /></div>)}</div>
      <div className="relogio vidro degrau"><div className="h">{horaStr(s.minutos)}</div><div className="s"><span>DIA {dia}</span><IcoClima tipo={s.clima.tipo} noite={noite} /><span>{NOME_CLIMA[s.clima.tipo]}</span></div></div>
      <div className={`obj vidro degrau ${trackerAberto ? '' : 'min'}`} onPointerDown={e => { e.stopPropagation(); useJogo.setState({ painel: 'diario' }); }}><b><em>OBJ</em> {obj.titulo}{obj.meta > 1 && <span className="cnt"> {Math.min(s.objVal, obj.meta)}/{obj.meta}</span>}</b><div className="seg" style={{ ['--p' as string]: pct(obj.meta > 1 ? (s.objVal / obj.meta) * 100 : s.objVal >= obj.meta ? 100 : 5) }}><i /></div>{ct && <b className={`ct ${ctPronto ? 'ok' : ''}`}>◆ {ctPronto ? 'Contrato pronto: receba no abrigo' : `${ct.titulo} ${progresso(ct)}/${ct.qtd}`}</b>}</div>
      <div className="topo-dir">
        <button className="btn qbtn" aria-label={s.cfg.controle === 'toque' ? 'Controle: uma mão (toque). Toque para usar o manche.' : 'Controle: duas mãos (manche). Toque para jogar com uma mão.'} {...press(trocaControle)}><IcoModo uma={s.cfg.controle === 'toque'} /><small>{s.cfg.controle === 'toque' ? '1' : '2'}</small></button>
        <button className="btn qbtn" aria-label="Mapa da zona" {...press(() => useJogo.setState({ painel: 'mapaZona' }))}><Ico src={ic('lorc', 'radar-sweep')} n={22} /></button>
        <button className="btn qbtn" aria-label="Mochila" {...press(() => useJogo.setState({ painel: 'inv' }))}><Ico src={ic('delapouite', 'backpack')} n={22} /><small style={{ color: lv <= 3 ? '#e0553f' : undefined }}>{lv}</small></button>
        <button className="btn qbtn" aria-label="Pausa" {...press(() => useJogo.setState({ painel: 'pausa' }))}><svg width="14" height="14" viewBox="0 0 8 8" shapeRendering="crispEdges"><rect x="1" y="0" width="2" height="8" fill="#cfc7ae" /><rect x="5" y="0" width="2" height="8" fill="#cfc7ae" /></svg></button>
      </div>
      {s.painel === null && <RadioBalao />}
      {s.cfg.sonsVisuais && <SonsVisuais cpm={s.cpm} hp={s.hp} pan={s.geigerPan} />}
      {s.seta && s.painel === null && <Seta dx={s.seta.dx} dy={s.seta.dy} d={s.seta.d} />}
      {s.banner && <div key={s.banner.id} className="banner"><b>{s.banner.titulo.toUpperCase()}</b><strong>{s.banner.sub}</strong>{s.banner.extra && <small>{s.banner.extra}</small>}</div>}
      <div className="toasts" role="status" aria-live="polite">{s.toasts.map(t => <div key={t.id} className="toast" style={{ color: t.cor }}>{t.texto}</div>)}</div>
      {s.acao && <div className={`acao ${s.cfg.controle === 'toque' ? 'um' : ''}`}><div className="r">{s.acao.rotulo}</div><div className="seg" style={{ ['--p' as string]: pct(s.acao.p * 100) }}><i /></div></div>}
      {s.dica && <div className="dica">{s.dica}</div>}
      <div className={`dir-bot ${s.cfg.canhoto ? 'esq' : ''} ${s.cfg.controle === 'toque' ? 'um' : ''}`}>
        <div className={`inter ${s.alvo ? 'on' : ''}`}><div className="rot vidro degrau">{s.alvo ?? ' '}</div><button className="btn aviso" aria-label="Interagir" {...press(() => ponte.cmd?.interagir())}><Ico src={icoAcao(s.alvo)} n={38} cor="#1c0e04" /></button></div>
      </div>
      <div className={`hotbar vidro degrau ${s.cfg.canhoto ? 'canh' : ''} ${s.cfg.controle === 'toque' ? 'um' : ''} ${hotRecente || slots.some(x => x.urg) ? '' : 'dim'}`}>{slots.map(sl => <button key={sl.k} className={`slot ${sl.n === 0 ? 'vazio' : ''} ${sl.on ? 'on' : ''} ${sl.urg ? 'urgente' : ''}`} aria-label={sl.k} {...press(sl.fn)}><Ico src={sl.ico} n={28} cor={sl.cor} />{sl.n >= 0 && <span className="q">{sl.n}</span>}<span className="k">{sl.t}</span></button>)}</div>
      {s.cfg.fps && <div className="fpsc">{s.fps} fps</div>}
    </div>
  );
}

/** seta na borda da tela apontando para o lançamento de suprimentos (some quando o alvo está à vista) */
function Seta({ dx, dy, d }: { dx: number; dy: number; d: number }) {
  const vw = typeof window === 'undefined' ? 400 : window.innerWidth, vh = typeof window === 'undefined' ? 800 : window.innerHeight, ex = vw / 2 - 40, ey = vh / 2 - 150;
  const k = Math.min(ex / Math.max(1e-6, Math.abs(dx)), ey / Math.max(1e-6, Math.abs(dy))); if (k >= 1) return null;
  const x = vw / 2 + dx * k, y = vh / 2 + dy * k, a = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  return <div className="seta" style={{ left: x - 17, top: y - 17 }}><i style={{ transform: `rotate(${a}deg)` }} /><b>{d} m</b></div>;
}

export function Sobreposicoes() {
  const s = useJogo();
  return (<><div className="vinheta" /><div className={`perigo-borda ${s.hp < 30 ? 'on' : ''}`} /><div className="rad-tom" style={{ opacity: Math.min(1, Math.max(0, (s.cpm - 120) / 500)) }} />{s.danoTs ? <div key={s.danoTs} className={`dano-flash ${s.cfg.menosEfeitos ? 'suave' : ''}`} /> : null}</>);
}
