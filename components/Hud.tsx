'use client';
import { useJogo, horaStr, OBJETIVOS } from '../game/store';
import { ponte } from '../game/ponte';
import { ITENS } from '../game/itens';
import Ico, { ic } from './Ico';

const press = (fn: () => void) => ({ onPointerDown: (e: React.PointerEvent) => { e.stopPropagation(); fn(); } });
const pct = (v: number) => `${Math.max(0, Math.min(100, v))}%`;

export function Topo() {
  const s = useJogo();
  const h = (s.minutos % 1440) / 60, dia = Math.floor(s.minutos / 1440) + 1, noite = h < 6 || h >= 20;
  const obj = OBJETIVOS[Math.min(s.objIdx, OBJETIVOS.length - 1)];
  const moodles: { k: string; icone: string; n: 1 | 2; rad?: boolean; t?: string }[] = [];
  if (s.fome < 35) moodles.push({ k: 'fome', icone: ic('delapouite', 'stomach'), n: s.fome < 15 ? 2 : 1 });
  if (s.sede < 35) moodles.push({ k: 'sede', icone: ic('sbed', 'water-drop'), n: s.sede < 15 ? 2 : 1 });
  if (s.rad > 20) moodles.push({ k: 'rad', icone: ic('lorc', 'radioactive'), n: s.rad > 60 ? 2 : 1, rad: true, t: `${Math.round(s.rad)}` });
  if (s.hp < 45) moodles.push({ k: 'hp', icone: ic('delapouite', 'heart-beats'), n: s.hp < 25 ? 2 : 1 });
  if (s.sangra) moodles.push({ k: 'sangra', icone: ic('lorc', 'bandage-roll'), n: 2 });
  if (s.stamina < 25) moodles.push({ k: 'stam', icone: ic('lorc', 'sprint'), n: 1 });
  if (s.furtivo) moodles.push({ k: 'furt', icone: ic('skoll', 'footsteps'), n: 1 });
  return (
    <div className="topo">
      <div className="l1">
        <div className="chip hora aco degrau"><div>{horaStr(s.minutos)}<small>DIA {dia} · {noite ? 'NOITE' : 'DIA'}</small></div></div>
        <div className="obj aco degrau"><b><em>OBJ</em> {obj.titulo}</b><div className="seg" style={{ ['--p' as string]: pct(s.objProg * 100) }}><i /></div></div>
        <button className="btn btn-mochila" aria-label="Mochila" {...press(() => useJogo.setState({ invAberto: true }))}><Ico src={ic('delapouite', 'backpack')} n={24} /></button>
      </div>
      <div className="l2">
        {moodles.map(m => <div key={m.k} className={`moodle n${m.n} ${m.rad ? 'rad' : ''}`}><Ico src={m.icone} n={20} cor={m.n === 2 ? '#ff8a70' : m.rad ? '#8fe36a' : '#d99a2b'} />{m.t ? <span className="t">{m.t}</span> : null}</div>)}
        {!moodles.length && <span className="dica">{obj.dica}</span>}
        {s.sabeAbrigo && <div className="seta"><svg viewBox="0 0 24 24" style={{ transform: `rotate(${s.abrigoDir}rad)` }}><path d="M2 10h14V5l7 7-7 7v-5H2z" fill="#8fe36a" stroke="#050506" strokeWidth="1.5" /></svg>ABRIGO {s.abrigoDist}m</div>}
      </div>
    </div>
  );
}

export function Sobreposicoes() {
  const s = useJogo();
  return (
    <>
      <div className="vinheta" />
      <div className={`perigo-borda ${s.hp < 30 ? 'on' : ''}`} />
      <div className="rad-tom" style={{ opacity: Math.min(1, Math.max(0, (s.cpm - 120) / 500)) }} />
      {s.danoTs ? <div key={s.danoTs} className="dano-flash" /> : null}
      <div className="toasts">{s.toasts.map(t => <div key={t.id} className="toast" style={{ color: t.cor }}>{t.texto}</div>)}</div>
      {s.acao && <div className="acao"><div className="r">{s.acao.rotulo}</div><div className="seg" style={{ ['--p' as string]: pct(s.acao.p * 100) }}><i /></div></div>}
    </>
  );
}

export function Botoes() {
  const s = useJogo(); const e = ponte.entrada; const arma = s.arma ? ITENS[s.arma] : null;
  const solta = (ev: React.PointerEvent) => { e.correr = false; ev.currentTarget.classList.remove('on'); };
  return (
    <>
      <div className="bt interagir"><button className={`btn aviso ${s.alvo ? '' : 'off'}`} {...press(() => ponte.cmd?.interagir())}><span>{s.alvo ?? 'Nada por perto'}</span></button></div>
      <div className="bt correr"><button className="btn quad" aria-label="Correr" onPointerDown={ev => { ev.stopPropagation(); e.correr = true; ev.currentTarget.classList.add('on'); }} onPointerUp={solta} onPointerCancel={solta} onPointerLeave={solta}><Ico src={ic('lorc', 'sprint')} n={26} /></button></div>
      <div className="bt furtivo"><button className={`btn quad ${s.furtivo ? 'on' : ''}`} aria-label="Furtivo" {...press(() => { e.furtivo = !e.furtivo; useJogo.setState({ furtivo: e.furtivo }); })}><Ico src={ic('skoll', 'footsteps')} n={26} cor={s.furtivo ? '#8fe36a' : '#cfc7ae'} /></button></div>
      <div className="bt lanterna"><button className={`btn quad ${s.lanterna.ligada ? 'on' : ''}`} aria-label="Lanterna" {...press(() => ponte.cmd?.lanterna())}><Ico src={ic('delapouite', 'flashlight')} n={26} cor={s.lanterna.ligada ? '#8fe36a' : '#cfc7ae'} />{s.lanterna.tem ? <small>{Math.round(s.lanterna.bat)}</small> : null}</button></div>
      <div className="bt arma"><button className="btn quad" aria-label="Trocar arma" {...press(() => ponte.cmd?.trocarArma())}>
        {arma ? <Ico src={arma.icone} n={26} /> : <Ico src={ic('lorc', 'bowie-knife')} n={26} cor="#565c64" />}{arma?.id === 'pistola' ? <small>{s.municao}</small> : null}</button></div>
    </>
  );
}

function Med({ k, rot, v, fmt, sub }: { k: string; rot: string; v: number; fmt?: string; sub?: string }) {
  const baixa = k === 'vida' ? v < 30 : k === 'rad' ? v > 60 : v < 25;
  return <div className={`med ${k} ${baixa ? 'baixa' : ''}`}><div className="t"><span>{rot}</span><b>{sub ? <small style={{ fontSize: 14, color: 'var(--osso2)', marginRight: 4 }}>{sub}</small> : null}{fmt ?? Math.round(v)}</b></div><div className="seg" style={{ ['--p' as string]: pct(v) }}><i /></div></div>;
}

export function Painel() {
  const s = useJogo(); const q = (id: string) => s.inv[id] ?? 0;
  const comida = q('enlatado') + q('pao') + q('carne'), cura = q('bandagem') + q('kit');
  const slots = [
    { k: 'agua' as const, icone: ic('delapouite', 'water-bottle'), n: q('agua'), t: '1' }, { k: 'comida' as const, icone: ic('delapouite', 'canned-fish'), n: comida, t: '2' },
    { k: 'curar' as const, icone: ic('lorc', 'bandage-roll'), n: cura, t: '3' }, { k: 'antirrad' as const, icone: ic('sbed', 'syringe'), n: q('antirrad'), t: '4' },
  ];
  return (
    <div className="painel">
      <div className="col-b"><Med k="vida" rot="VIDA" v={s.hp} fmt={String(Math.max(0, Math.ceil(s.hp)))} /><Med k="rad" rot="RAD" v={s.rad} sub={`${s.cpm}cpm`} /><Med k="stam" rot="FÔLEGO" v={s.stamina} /></div>
      <div className="rapidos">{slots.map(sl => (
        <button key={sl.k} className={`slot ${sl.n ? '' : 'vazio'}`} aria-label={sl.k} {...press(() => ponte.cmd?.usarRapido(sl.k))}>
          <Ico src={sl.icone} n={30} cor={sl.n ? '#cfc7ae' : '#565c64'} /><span className="q">{sl.n}</span><span className="k">{sl.t}</span>
        </button>))}</div>
      <div className="col-b"><Med k="fome" rot="FOME" v={s.fome} /><Med k="sede" rot="SEDE" v={s.sede} /></div>
    </div>
  );
}
