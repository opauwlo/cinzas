'use client';
import { useEffect, useRef, useState } from 'react';
import { useJogo, lerMeta, gravarMeta, registrarDia, hoje, horaStr } from '../game/store';
import { estudoAtivo, quaseLa, provaSocialFalsa, ofertaRestante, registrarLoja, registrarSequencia, manipulacoes, fmtMs, PACOTES, CUSTO_REVIVER } from '../game/estudo';
import { compartilhar } from './cartao';
import conceitos from '../conceitos.json';

const press = (fn: () => void) => ({ onPointerDown: (e: React.PointerEvent) => { e.stopPropagation(); fn(); } });

function Skyline() {
  const pr = [[0, 90, 40], [40, 60, 34], [74, 100, 28], [102, 70, 44], [146, 110, 30], [176, 80, 38], [214, 95, 26], [240, 55, 50], [290, 105, 34], [324, 75, 40], [364, 98, 30], [394, 66, 36]];
  return (
    <svg className="skyline" viewBox="0 0 430 150" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <defs><radialGradient id="sol" cx="50%" cy="60%" r="55%"><stop offset="0" stopColor="#a6ff3b" stopOpacity=".6" /><stop offset="1" stopColor="#a6ff3b" stopOpacity="0" /></radialGradient></defs>
      <circle cx="215" cy="92" r="90" fill="url(#sol)" /><circle cx="215" cy="92" r="26" fill="#d2ff6a" opacity=".85" />
      {pr.map(([x, h, w], i) => <g key={i}><path d={`M${x} 150 V${150 - h} l${w * .2} -6 l${w * .25} 8 l${w * .3} -4 l${w * .25} 6 V150 Z`} fill="#06040c" />{[0, 1, 2].map(k => <rect key={k} x={x + 5 + k * (w / 3.4)} y={150 - h + 14 + (i * 7 + k * 11) % 40} width="3" height="4" fill={(i + k) % 5 === 0 ? '#ffb000' : '#1d1530'} />)}</g>)}
    </svg>
  );
}

export function Menu({ onJogar }: { onJogar: () => void }) {
  const [meta, setMeta] = useState(() => ({ runs: 0, melhorTempo: 0, abatesTotais: 0, sequencia: 0, ultimoDia: '', vitorias: 0 }));
  const [estudo, setEstudo] = useState(false); const [fake, setFake] = useState(3 * 3600 * 1000);
  const set = useJogo(s => s.set);
  useEffect(() => { setMeta(registrarDia()); const e = estudoAtivo(); setEstudo(e); if (e) { registrarSequencia(registrarDia().sequencia); } }, []);
  useEffect(() => { if (!estudo) return; const t = setInterval(() => setFake(v => Math.max(0, v - 1000)), 1000); return () => clearInterval(t); }, [estudo]);
  const falta = Math.max(0, 3 - meta.sequencia);
  return (
    <main className="tela">
      <div className="col">
        <Skyline />
        <h1 className="titulo">CINZAS</h1>
        <p className="sub">o mundo acabou em luz</p>
        <div className="card">
          <h3>Mundo de hoje</h3>
          <div className="mini">Seed <b style={{ color: 'var(--osso)' }}>{hoje()}</b>. É o mesmo mapa e o mesmo saque para todo mundo hoje: dá para comparar com amigos.</div>
          <div className="mini" style={{ marginTop: 8 }}>Sequência: <b style={{ color: 'var(--menta)' }}>{meta.sequencia} dia(s)</b>{falta > 0 ? ` · faltam ${falta} para começar com 1 kit médico` : ' · bônus ativo: você começa com 1 kit médico'}</div>
          {meta.melhorTempo > 0 && <div className="mini">Seu melhor: <b style={{ color: 'var(--osso)' }}>{horaStr(meta.melhorTempo)}</b> de jogo · {meta.runs} runs · {meta.vitorias} no abrigo</div>}
        </div>
        {estudo && <div className="card" style={{ boxShadow: 'inset 0 0 0 2px var(--coral)' }}><div className="mini" style={{ color: 'var(--coral)', fontWeight: 800 }}>Seu bônus de {meta.sequencia} dia(s) será PERDIDO em</div><div className="timer">{fmtMs(fake)}</div></div>}
        <button className="cap ouro grande" {...press(onJogar)}>Sobreviver</button>
        <button className="cap vidro" style={{ width: '100%' }} {...press(() => set({ tela: 'creditos' }))}>Créditos e conceitos</button>
        <p className="mini" style={{ textAlign: 'center', margin: 0 }}>Esq.: mover · Dir.: mirar e atacar · WASD + mouse no PC</p>
      </div>
    </main>
  );
}

export function Fim({ vitoria }: { vitoria: boolean }) {
  const s = useJogo(); const r = s.resumo!; const [meta, setMeta] = useState(lerMeta()); const feito = useRef(false);
  const estudo = !vitoria && estudoAtivo();
  const [info] = useState(() => estudo ? { falta: quaseLa(r.distAbrigo), social: provaSocialFalsa() } : null);
  useEffect(() => {
    if (feito.current) return; feito.current = true;
    const m = lerMeta(); m.runs++; m.abatesTotais += r.abates; m.melhorTempo = Math.max(m.melhorTempo, s.minutos - 8 * 60); if (vitoria) m.vitorias++; gravarMeta(m); setMeta(m);
  }, [r, s.minutos, vitoria]);
  return (
    <main className="tela">
      <div className="col">
        <h1 className="titulo m" style={{ color: vitoria ? 'var(--menta)' : 'var(--ouro)' }}>{vitoria ? 'VOCÊ CHEGOU AO ABRIGO' : 'VOCÊ MORREU'}</h1>
        <p className="sub" style={{ margin: 0 }}>{r.causa}</p>
        {info && (
          <div className="quase afiado">
            <h2>Faltaram só {info.falta} passos para o abrigo!</h2>
            <p>{info.social}</p>
            <button className="cap perigo afiado pulsa" style={{ width: '100%' }} {...press(() => s.set({ tela: 'loja' }))}>Reviver por {CUSTO_REVIVER} ◆</button>
            <p style={{ marginTop: 8, fontSize: 12 }}>Você tem {s.gemas} ◆ · faltam {Math.max(0, CUSTO_REVIVER - s.gemas)} ◆</p>
          </div>)}
        <div className="grade">
          <div className="stat"><b>{r.dias}</b><span>{r.dias === 1 ? 'dia' : 'dias'} · {r.hora}</span></div>
          <div className="stat"><b>{r.abates}</b><span>abates</span></div>
          <div className="stat"><b>{r.vasculhados}</b><span>saques</span></div>
          <div className="stat"><b>{r.radMax}%</b><span>radiação máx</span></div>
        </div>
        <div className="card mini">Seu melhor: <b style={{ color: 'var(--osso)' }}>{horaStr(meta.melhorTempo)}</b> de jogo · {meta.runs} runs · {meta.abatesTotais} abates no total. Morte é permanente: o que fica é a sequência diária e o recorde.</div>
        <button className="cap ouro grande" {...press(() => { void compartilhar(r, s.seed); })}>Compartilhar meu resultado</button>
        <button className="cap vidro" style={{ width: '100%' }} {...press(() => s.set({ tela: 'menu' }))}>Nova run</button>
        {estudo && <button className="link" {...press(() => s.set({ tela: 'revelacao' }))}>sair sem reviver</button>}
      </div>
    </main>
  );
}

export function Loja() {
  const s = useJogo(); const [ms, setMs] = useState(() => ofertaRestante());
  useEffect(() => { registrarLoja(); const t = setInterval(() => setMs(ofertaRestante()), 1000); return () => clearInterval(t); }, []);
  return (
    <main className="tela">
      <div className="col">
        <h1 className="titulo m">Loja do Abrigo</h1>
        <div className="card" style={{ textAlign: 'center', boxShadow: 'inset 0 0 0 2px var(--coral)' }}>
          <div className="mini" style={{ color: 'var(--coral)', fontWeight: 900, letterSpacing: '.1em' }}>OFERTA RELÂMPAGO TERMINA EM</div>
          <div className="timer">{fmtMs(ms)}</div>
        </div>
        <div className="pacotes">
          {PACOTES.map(p => (
            <div key={p.id} className={`pac ${p.destaque ? 'd' : ''}`}>
              {p.destaque && <span className="sel">MAIS POPULAR</span>}
              <b>{p.gemas} ◆</b>{p.de && <s>{p.de}</s>}<div className="pr">{p.preco}</div>
              {p.de && <div className="mini" style={{ color: 'var(--coral)', fontWeight: 900 }}>-60%</div>}
              <button className={`cap ${p.destaque ? 'ouro' : 'vidro'}`} style={{ height: 36, fontSize: 12, padding: '0 10px' }} {...press(() => s.set({ tela: 'revelacao' }))}>Comprar</button>
            </div>))}
        </div>
        <button className="link" {...press(() => s.set({ tela: 'morte' }))}>voltar</button>
      </div>
    </main>
  );
}

export function Revelacao() {
  const s = useJogo(); const lista = manipulacoes();
  return (
    <main className="tela">
      <div className="col">
        <h1 className="titulo m" style={{ color: 'var(--menta)' }}>PLOT TWIST</h1>
        <p className="sub" style={{ margin: 0 }}>isso foi um experimento</p>
        <div className="card mini"><b style={{ color: 'var(--osso)' }}>Nada foi cobrado.</b> Não existe pagamento neste jogo; as gemas são só um número no seu aparelho. Tudo o que você viu foi desenhado para empurrar uma compra. Veja o que era mostrado e o que era verdade:</div>
        <div style={{ maxHeight: '46dvh', overflowY: 'auto' }}>
          {lista.map(m => (
            <div className="manip" key={m.tecnica}><h4>{m.tecnica}</h4><p><em>Mostrado:</em> {m.mostrado}</p><p><u>Verdade:</u> {m.real}</p><p>Por que funciona: {m.porque}</p></div>))}
        </div>
        <div className="card mini">Foram {lista.length} técnicas em poucos minutos, sem exigir nenhuma habilidade especial. É assim que isso é fácil de fazer e fácil de não perceber.</div>
        <button className="cap ouro grande" {...press(() => s.set({ tela: 'menu' }))}>Voltar ao início</button>
        <button className="link" {...press(() => { try { localStorage.removeItem('cinzas.estudo'); } catch { /* */ } s.set({ tela: 'menu' }); })}>desativar modo estudo</button>
      </div>
    </main>
  );
}

export function Creditos() {
  const set = useJogo(s => s.set);
  return (
    <main className="tela">
      <div className="col">
        <h1 className="titulo m">Créditos</h1>
        <div className="card lista">
          <p><b>Conceitos novos criados: {conceitos.novos.length}</b></p>
          {conceitos.novos.map(n => <div key={n.id}>#{n.id} {n.nome}</div>)}
          <p style={{ marginTop: 12 }}><b>Adaptados de prontos: {conceitos.adaptados.length}</b></p>
          {conceitos.adaptados.map(n => <div key={n.nome}>{n.nome} — {n.origem}</div>)}
          <p style={{ marginTop: 12 }}><b>Ícones:</b> game-icons.net, CC BY 3.0 (Lorc, Delapouite, Sbed, Skoll, Caro Asercion, DarkZaitzev, John Colburn).</p>
          <p><b>Fontes:</b> Cinzel, Nunito (OFL, via Fontsource), Share Tech Mono (OFL).</p>
          <p><b>Código:</b> Phaser, rot-js (BSD-3), nipplejs, zustand, ZzFX, simplex-noise, alea (MIT).</p>
        </div>
        <button className="cap vidro grande" {...press(() => set({ tela: 'menu' }))}>Voltar</button>
      </div>
    </main>
  );
}
