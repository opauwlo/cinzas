'use client';
import { useJogo, horaStr, OBJETIVOS } from '../game/store';
import { ponte } from '../game/ponte';
import { ITENS } from '../game/itens';

const ic = (a: string, n: string) => `/icons/${a}/${n}.svg`;
const press = (fn: () => void) => ({ onPointerDown: (e: React.PointerEvent) => { e.stopPropagation(); fn(); } });

export function Topo() {
  const s = useJogo();
  const h = (s.minutos % 1440) / 60, dia = Math.floor(s.minutos / 1440) + 1, noite = h < 6 || h >= 20;
  const obj = OBJETIVOS[Math.min(s.objIdx, OBJETIVOS.length - 1)];
  const moodles: { k: string; icone: string; n: 1 | 2; rad?: boolean; t?: string }[] = [];
  if (s.fome < 35) moodles.push({ k: 'fome', icone: ic('delapouite', 'stomach'), n: s.fome < 15 ? 2 : 1 });
  if (s.sede < 35) moodles.push({ k: 'sede', icone: ic('sbed', 'water-drop'), n: s.sede < 15 ? 2 : 1 });
  if (s.rad > 20) moodles.push({ k: 'rad', icone: ic('lorc', 'radioactive'), n: s.rad > 60 ? 2 : 1, rad: true, t: `${Math.round(s.rad)}%` });
  if (s.hp < 45) moodles.push({ k: 'hp', icone: ic('delapouite', 'heart-beats'), n: s.hp < 25 ? 2 : 1 });
  if (s.sangra) moodles.push({ k: 'sangra', icone: ic('lorc', 'bandage-roll'), n: 2 });
  if (s.stamina < 25) moodles.push({ k: 'stam', icone: ic('lorc', 'sprint'), n: 1 });
  if (s.furtivo) moodles.push({ k: 'furt', icone: ic('skoll', 'footsteps'), n: 1 });
  return (
    <div className="topo">
      <div className="l1">
        <div className="chip hora">{noite ? '☾' : '☀'} Dia {dia} · {horaStr(s.minutos)}</div>
        <div className="obj"><b>{obj.titulo}</b><div className="trilho"><i style={{ width: `${Math.round(s.objProg * 100)}%` }} /></div></div>
        <button className="cap vidro" style={{ height: 38, padding: '0 14px' }} aria-label="Mochila" {...press(() => useJogo.setState({ invAberto: true }))}>
          <img src={ic('delapouite', 'backpack')} alt="" style={{ width: 20, height: 20, mixBlendMode: 'screen' }} />
        </button>
      </div>
      <div className="l2">
        {moodles.map(m => <div key={m.k} className={`moodle n${m.n} ${m.rad ? 'rad' : ''}`}><img src={m.icone} alt="" />{m.t ? <span className="t">{m.t}</span> : null}</div>)}
        {!moodles.length && <span style={{ font: '700 12px Nunito', color: 'var(--osso2)' }}>{obj.dica}</span>}
        {s.sabeAbrigo && <div className="seta"><svg viewBox="0 0 24 24" style={{ transform: `rotate(${s.abrigoDir}rad)` }}><path d="M3 12h15M13 5l7 7-7 7" fill="none" stroke="#00ffcc" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>ABRIGO {s.abrigoDist} m</div>}
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
      {s.acao && <div className="acao"><div className="r">{s.acao.rotulo}…</div><div className="tr"><i style={{ width: `${Math.round(s.acao.p * 100)}%` }} /></div></div>}
    </>
  );
}

export function Botoes() {
  const s = useJogo(); const e = ponte.entrada; const arma = s.arma ? ITENS[s.arma] : null;
  return (
    <>
      <div className="bt interagir">
        <button className={`cap ouro ${s.alvo ? 'pulsa' : 'off'}`} {...press(() => ponte.cmd?.interagir())}><span>{s.alvo ?? 'Nada por perto'}</span></button>
      </div>
      <div className="bt correr"><button className="redondo" aria-label="Correr"
        onPointerDown={ev => { ev.stopPropagation(); e.correr = true; ev.currentTarget.classList.add('on'); }}
        onPointerUp={ev => { e.correr = false; ev.currentTarget.classList.remove('on'); }} onPointerCancel={ev => { e.correr = false; ev.currentTarget.classList.remove('on'); }} onPointerLeave={ev => { e.correr = false; ev.currentTarget.classList.remove('on'); }}>
        <img src={ic('lorc', 'sprint')} alt="" /></button></div>
      <div className="bt furtivo"><button className={`redondo ${s.furtivo ? 'on' : ''}`} aria-label="Furtivo" {...press(() => { e.furtivo = !e.furtivo; useJogo.setState({ furtivo: e.furtivo }); })}><img src={ic('skoll', 'footsteps')} alt="" /></button></div>
      <div className="bt lanterna"><button className={`redondo ${s.lanterna.ligada ? 'on' : ''}`} aria-label="Lanterna" {...press(() => ponte.cmd?.lanterna())}><img src={ic('delapouite', 'flashlight')} alt="" />{s.lanterna.tem ? <small>{Math.round(s.lanterna.bat)}%</small> : null}</button></div>
      <div className="bt arma"><button className="redondo" aria-label="Trocar arma" {...press(() => ponte.cmd?.trocarArma())}>
        {arma ? <img src={arma.icone} alt="" /> : <img src={ic('lorc', 'bowie-knife')} alt="" style={{ opacity: .25 }} />}{arma?.id === 'pistola' ? <small>{s.municao}</small> : null}</button></div>
    </>
  );
}

export function Painel() {
  const s = useJogo(); const q = (id: string) => s.inv[id] ?? 0;
  const comida = q('enlatado') + q('pao') + q('carne'), cura = q('bandagem') + q('kit');
  const slots = [
    { k: 'agua' as const, icone: ic('delapouite', 'water-bottle'), n: q('agua'), t: '1' }, { k: 'comida' as const, icone: ic('delapouite', 'canned-fish'), n: comida, t: '2' },
    { k: 'curar' as const, icone: ic('lorc', 'bandage-roll'), n: cura, t: '3' }, { k: 'antirrad' as const, icone: ic('sbed', 'syringe'), n: q('antirrad'), t: '4' },
  ];
  const radN = Math.round(s.rad);
  return (
    <div className="painel">
      <div className={`orbe ${s.hp < 30 ? 'crit' : ''}`} style={{ ['--nivel' as string]: `${Math.max(0, s.hp)}%` }}><div className="liq" /><div className="n">{Math.max(0, Math.ceil(s.hp))}<small>VIDA</small></div></div>
      <div className="centro">
        <div className="barras">
          <div className={`barra fome ${s.fome < 25 ? 'baixa' : ''}`}><img src={ic('delapouite', 'stomach')} alt="" /><div className="tr"><i style={{ width: `${s.fome}%` }} /></div></div>
          <div className={`barra sede ${s.sede < 25 ? 'baixa' : ''}`}><img src={ic('sbed', 'water-drop')} alt="" /><div className="tr"><i style={{ width: `${s.sede}%` }} /></div></div>
          <div className={`barra stam ${s.stamina < 20 ? 'baixa' : ''}`}><img src={ic('lorc', 'sprint')} alt="" /><div className="tr"><i style={{ width: `${s.stamina}%` }} /></div></div>
        </div>
        <div className="rapidos">{slots.map(sl => (
          <button key={sl.k} className={`slot ${sl.n ? '' : 'vazio'}`} aria-label={sl.k} {...press(() => ponte.cmd?.usarRapido(sl.k))}>
            <img src={sl.icone} alt="" /><span className="q" style={sl.n ? undefined : { background: '#555', color: '#aaa' }}>{sl.n}</span><span className="k">{sl.t}</span>
          </button>))}</div>
      </div>
      <div className="orbe rad" style={{ ['--nivel' as string]: `${Math.min(100, radN)}%` }}><div className="liq" /><div className="n">{radN}%<small>RAD · {s.cpm}</small></div></div>
    </div>
  );
}
