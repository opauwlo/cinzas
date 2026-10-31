'use client';
import { useEffect, useState } from 'react';
import { useJogo, OBJETIVOS, lerMeta, gravarMeta } from '../game/store';
import { ITENS } from '../game/dados/itens';
import { localPorId } from '../game/dados/locais';
import { PERKS, CONQUISTAS, MELHORIAS, PASSOS_INTRO, perkPorId } from '../game/dados/meta';
import { ponte } from '../game/ponte';
import { sfx } from '../game/audio';
import { xpNivel, opcoesPerk, custoMelhoria, podeMelhorar, DIF_NOMES } from '../game/sistemas/progresso';
import { progresso, pronto, temParaEntregar } from '../game/sistemas/contratos';
import Ico, { ic } from './Ico';
import { Cartao, p, fechar } from './Cartao';

const pct = (v: number) => `${Math.max(0, Math.min(100, v))}%`;
const ico = ([a, n]: [string, string]) => ic(a, n);

// ---------------------------------------------------------------- diário em abas
type Aba = 'obj' | 'ctr' | 'hab' | 'con';
export function Diario() {
  const s = useJogo(), [aba, setAba] = useState<Aba>('obj'), dia = Math.floor(s.minutos / 1440) + 1, noBase = s.zonaId === 'base';
  const prontos = s.contratos.filter(pronto).length, abas: [Aba, string][] = [['obj', 'Objetivos'], ['ctr', prontos ? `Contratos ●${prontos}` : 'Contratos'], ['hab', s.pontos ? `Habilidades ★${s.pontos}` : 'Habilidades'], ['con', 'Conquistas']];
  return (
    <Cartao titulo="Diário">
      <div className="abas">{abas.map(([k, n]) => <button key={k} className={`btn aba ${aba === k ? 'on' : ''}`} {...p(() => { setAba(k); sfx.ui('clique'); })}>{n}</button>)}</div>
      {aba === 'obj' && <>
        <div className="card aco"><h3>Objetivos</h3>{OBJETIVOS.map((o, i) => <div key={o.titulo} className="mini" style={{ color: i < s.objIdx ? 'var(--fosf)' : i === s.objIdx ? 'var(--osso)' : 'var(--a4)' }}>{i < s.objIdx ? '[x]' : i === s.objIdx ? '[>]' : '[ ]'} {o.titulo}{i === s.objIdx ? ` — ${o.dica}` : ''}</div>)}</div>
        <div className="grade"><div className="stat"><b>{dia}</b><span>dia</span></div><div className="stat"><b>{s.abates}</b><span>abates</span></div><div className="stat"><b>{s.vasculhados}</b><span>saques</span></div><div className="stat"><b>{s.combustivel}</b><span>combustível</span></div></div>
        <div className="card aco mini">Locais conhecidos: <b>{s.descobertos.map(d => localPorId(d).nome).join(', ')}</b> · Dificuldade: <b>{DIF_NOMES[s.dif]}</b></div>
      </>}
      {aba === 'ctr' && <>
        <div className="mini">Contratos do rádio: cumpra em qualquer lugar e receba o pagamento no abrigo.</div>
        {s.contratos.length === 0 && <div className="card mini aco">Nenhum contrato por enquanto. Vasculhe um contêiner e o rádio passa os primeiros.</div>}
        {s.contratos.map(c => { const ok = pronto(c), n = progresso(c); return (
          <div key={c.id} className="card aco" style={{ display: 'grid', gap: 6, boxShadow: ok ? 'inset 0 0 0 2px #050506, inset 0 0 0 4px var(--fosf)' : undefined }}>
            <b style={{ font: "700 13px var(--f-ui)", color: ok ? 'var(--fosf)' : 'var(--osso)' }}>{c.titulo}</b>
            <div className="seg" style={{ ['--p' as string]: pct((n / c.qtd) * 100) }}><i /></div>
            <div className="chips" style={{ marginTop: 0 }}><span className="chip">{n}/{c.qtd}</span><span className="chip ok">+{c.xp} XP</span>{c.premio.map(([i, q]) => <span key={i} className="chip">{q}× {ITENS[i]?.nome ?? i}</span>)}</div>
            <button className={`btn peq ${ok ? 'aviso' : ''}`} disabled={!ok || !noBase} {...p(() => ponte.cmd?.receberContrato(c.id))}>{!ok ? 'Em andamento' : noBase ? 'Receber pagamento' : 'Volte ao abrigo para receber'}</button>
          </div>); })}
      </>}
      {aba === 'hab' && <>
        <div className="card aco" style={{ display: 'grid', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><b style={{ font: "700 15px var(--f-ui)", color: 'var(--fosf)' }}>Nível {s.nivel}</b><span className="mini">{s.xp} / {xpNivel(s.nivel)} XP</span></div>
          <div className="seg" style={{ ['--p' as string]: pct((s.xp / xpNivel(s.nivel)) * 100) }}><i /></div>
          {s.pontos > 0 && <button className="btn aviso pisca" {...p(() => useJogo.setState({ painel: 'perk' }))}>Escolher habilidade ({s.pontos})</button>}
        </div>
        {s.perks.length === 0 && <div className="card mini aco">Você ainda não tem habilidades. A cada nível, escolha uma entre três.</div>}
        {s.perks.map(id => { const k = perkPorId(id); return <div key={id} className="linha-item" style={{ ['--rc' as string]: '#8fe36a' }}><div className="im"><Ico src={ico(k.ic)} n={28} cor="#8fe36a" /></div><div><b>{k.nome}</b><small>{k.desc}</small></div><span /></div>; })}
        <div className="mini">Ganhe XP abatendo criaturas, vasculhando, fabricando, descobrindo locais e cumprindo contratos.</div>
      </>}
      {aba === 'con' && <>
        <div className="mini">{s.conquistas.length} de {CONQUISTAS.length} conquistas. Elas ficam com você mesmo depois da morte.</div>
        {CONQUISTAS.map(q => { const ok = s.conquistas.includes(q.id); return <div key={q.id} className="linha-item" style={{ ['--rc' as string]: ok ? '#e0b83a' : '#3a3d42', opacity: ok ? 1 : 0.55 }}><div className="im"><Ico src={ico(q.ic)} n={28} cor={ok ? '#e0b83a' : '#565c64'} /></div><div><b>{q.nome}</b><small>{q.desc}</small></div><span className="mini">{ok ? '★' : ''}</span></div>; })}
      </>}
    </Cartao>
  );
}

// ---------------------------------------------------------------- escolha de habilidade
export function PerkPainel() {
  const s = useJogo(); const ops = opcoesPerk({ seed: s.seed, nivel: s.nivel, perks: s.perks });
  return (
    <Cartao titulo={`Nível ${s.nivel}`} larg={520} rodape={<div className="mini" style={{ textAlign: 'center' }}>{s.pontos > 0 ? `Escolha 1 habilidade (${s.pontos} disponível). Ela vale até o fim desta vida.` : 'Sem pontos de habilidade agora.'}</div>}>
      {ops.length === 0 && <div className="card mini aco">Você já tem todas as habilidades. Lenda.</div>}
      {s.pontos > 0 && ops.map(id => { const k = perkPorId(id); return (
        <div key={id} className="card aco degrau" style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: 10, alignItems: 'center' }}>
          <div className="im" style={{ width: 48, height: 48, display: 'grid', placeItems: 'center', background: '#050506', boxShadow: 'inset 0 0 0 2px #8fe36a' }}><Ico src={ico(k.ic)} n={32} cor="#8fe36a" /></div>
          <div><b style={{ font: "700 14px var(--f-ui)", color: 'var(--fosf)' }}>{k.nome}</b><div className="mini" style={{ marginTop: 2 }}>{k.desc}</div></div>
          <button className="btn aviso" style={{ gridColumn: '1 / -1' }} {...p(() => ponte.cmd?.escolherPerk(id))}>Escolher {k.nome}</button>
        </div>); })}
    </Cartao>
  );
}

// ---------------------------------------------------------------- melhorias do abrigo
export function Melhorias() {
  const s = useJogo(), noBase = s.zonaId === 'base';
  return (
    <Cartao titulo="Melhorias do abrigo" larg={560} rodape={<div className="mini">{noBase ? 'Os materiais saem da mochila e do baú.' : 'Só dá para melhorar dentro do abrigo.'}</div>}>
      {MELHORIAS.map(m => { const nv = s.mel[m.id] ?? 0, max = m.niveis.length, custo = custoMelhoria(m.id, nv), ok = noBase && podeMelhorar(m.id, nv); return (
        <div key={m.id} className="linha-item" style={{ ['--rc' as string]: nv >= max ? '#8fe36a' : '#8a8573', gridTemplateColumns: '46px 1fr auto' }}>
          <div className="im"><Ico src={ico(m.ic)} n={28} cor={nv >= max ? '#8fe36a' : '#cfc7ae'} /></div>
          <div><b>{m.nome} · nv {nv}/{max}</b>{custo ? <><small>{m.niveis[nv].desc}</small><div className="chips">{custo.map(([i, q]) => <span key={i} className={`chip ${temParaEntregar(i) >= q ? 'ok' : 'falta'}`}>{ITENS[i]?.nome} {temParaEntregar(i)}/{q}</span>)}</div></> : <small>Nível máximo.</small>}</div>
          {custo ? <button className={`btn peq ${ok ? 'aviso' : ''}`} disabled={!ok} {...p(() => ponte.cmd?.melhorar(m.id))}>Melhorar</button> : <span className="mini">★</span>}
        </div>); })}
    </Cartao>
  );
}

// ---------------------------------------------------------------- evento de viagem (decisão obrigatória)
export function EventoPainel() {
  const ev = useJogo(s => s.evento); if (!ev) return null;
  return (
    <Cartao titulo={ev.titulo} larg={520} fixo>
      <div className="card aco degrau mini" style={{ fontSize: 20, lineHeight: 1.25 }}>{ev.txt}</div>
      {ev.resultado === null ? ev.opcoes.map((o, i) => (
        <div key={o.rot} style={{ display: 'grid', gap: 3 }}>
          <button className={`btn grande ${o.ok ? '' : ''}`} disabled={!o.ok} {...p(() => ponte.cmd?.eventoEscolher(i))}>{o.rot}</button>
          {(o.dica || !o.ok) && <div className="mini" style={{ textAlign: 'center' }}>{o.ok ? o.dica : 'Você não tem o que precisa.'}</div>}
        </div>))
        : <>
          <div className="card aco degrau" style={{ fontSize: 20, lineHeight: 1.25, color: ev.cor ?? 'var(--osso)' }}>{ev.resultado}</div>
          <button className="btn aviso grande" {...p(() => ponte.cmd?.eventoFim())}>Seguir viagem</button>
        </>}
    </Cartao>
  );
}

// ---------------------------------------------------------------- como jogar
export function Ajuda() {
  const itens: [string, string][] = [
    ['Mover e atacar', 'Arraste o dedo no lado esquerdo para andar. No lado direito, toque para atacar (mira sozinha) ou arraste para mirar.'],
    ['Interagir', 'Chegue perto de um objeto e toque nele ou no botão laranja. Dá para vasculhar, abrir o baú, fabricar, cozinhar e dormir.'],
    ['Furtivo e correr', 'Furtivo (pé) faz menos barulho. Correr gasta fôlego e chama a atenção de tudo por perto.'],
    ['Sobreviver', 'Fome, sede e radiação cobram caro. Beba água limpa, cozinhe carne e use máscara em áreas radioativas.'],
    ['Abrigo e jipe', 'Do abrigo você viaja de jipe (gasta combustível e horas). Volte para guardar, fabricar, dormir e melhorar a base.'],
    ['Subir de nível', 'Abater, vasculhar e explorar dão XP. A cada nível, escolha 1 entre 3 habilidades.'],
    ['Contratos', 'O rádio passa tarefas curtas com pagamento. Cumpra na rua e receba no abrigo.'],
    ['Invasões', 'A partir do dia 2, à noite, gente pode atacar o abrigo. Muralha forte protege o baú, inclusive quando você viaja.'],
  ];
  return (
    <Cartao titulo="Como jogar" larg={560}>
      {itens.map(([t, d]) => <div key={t} className="card aco"><h3>{t}</h3><div className="mini">{d}</div></div>)}
    </Cartao>
  );
}

// ---------------------------------------------------------------- intro (primeira vez)
export function Intro() {
  const [i, setI] = useState(0), [n, setN] = useState(0), txt = PASSOS_INTRO[i], fim = n >= txt.length;
  useEffect(() => { setN(0); const t = setInterval(() => setN(v => { if (v >= txt.length) { clearInterval(t); return v; } return v + 1; }), 26); return () => clearInterval(t); }, [txt]);
  const sair = () => { const m = lerMeta(); m.intro = true; gravarMeta(m); sfx.ui('ok'); fechar(); };
  return (
    <div className="ov" onPointerDown={e => e.stopPropagation()} style={{ background: 'rgba(5,4,6,.94)' }}>
      <div className="col" style={{ width: 'min(100%, 460px)', gap: 18 }}>
        <div className="mini" style={{ textAlign: 'center', letterSpacing: '.2em' }}>CINZAS · {i + 1}/{PASSOS_INTRO.length}</div>
        <p style={{ font: '24px/1.3 var(--f-hud)', color: 'var(--osso)', minHeight: 130, margin: 0 }}>{txt.slice(0, n)}<span className="pisca">▌</span></p>
        <button className="btn aviso grande" {...p(() => { if (!fim) { setN(txt.length); return; } if (i < PASSOS_INTRO.length - 1) setI(i + 1); else sair(); })}>{!fim ? 'Pular texto' : i < PASSOS_INTRO.length - 1 ? 'Continuar' : 'Começar'}</button>
        <button className="link" {...p(sair)}>pular introdução</button>
      </div>
    </div>
  );
}
void PERKS;
