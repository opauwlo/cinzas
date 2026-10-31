'use client';
import { useEffect, useRef, useState } from 'react';
import { useJogo, lerMeta, gravarMeta, registrarDia, hoje, horaStr } from '../game/store';
import { lerRun } from '../game/sistemas/salvar';
import { localPorId } from '../game/dados/locais';
import { estudoAtivo, quaseLa, provaSocialFalsa, ofertaRestante, registrarLoja, registrarSequencia, manipulacoes, fmtMs, PACOTES, CUSTO_REVIVER } from '../game/estudo';
import { compartilhar } from './cartao';
import conceitos from '../conceitos.json';
import ArteMenu from './ArteMenu';

const press = (fn: () => void) => ({ onPointerDown: (e: React.PointerEvent) => { e.stopPropagation(); fn(); } });
type PwaEvt = Event & { prompt: () => Promise<void> };

export function Menu({ onJogar }: { onJogar: (nova: boolean) => void }) {
  const [meta, setMeta] = useState(() => ({ runs: 0, melhorTempo: 0, abatesTotais: 0, sequencia: 0, ultimoDia: '', vitorias: 0, dicas: [] as string[] }));
  const [estudo, setEstudo] = useState(false), [fake, setFake] = useState(3 * 3600 * 1000), [toques, setToques] = useState(0), [aviso, setAviso] = useState(''), [confirma, setConfirma] = useState(false), [pwa, setPwa] = useState<PwaEvt | null>(null);
  const set = useJogo(s => s.set), temSave = useJogo(s => s.temSave), save = temSave ? lerRun() : null;
  const alternarEstudo = () => {
    const n = toques + 1; setToques(n); if (n < 7) return; setToques(0);
    try { if (localStorage.getItem('cinzas.estudo') === '1') { localStorage.removeItem('cinzas.estudo'); setEstudo(false); setAviso('modo estudo desligado'); } else { localStorage.setItem('cinzas.estudo', '1'); setEstudo(true); setAviso('modo estudo ligado'); } } catch { setAviso('sem armazenamento neste navegador'); }
    setTimeout(() => setAviso(''), 2500);
  };
  useEffect(() => { setMeta(registrarDia()); const e = estudoAtivo(); setEstudo(e); if (e) registrarSequencia(registrarDia().sequencia); const h = (ev: Event) => { ev.preventDefault(); setPwa(ev as PwaEvt); }; window.addEventListener('beforeinstallprompt', h); return () => window.removeEventListener('beforeinstallprompt', h); }, []);
  useEffect(() => { if (!estudo) return; const t = setInterval(() => setFake(v => Math.max(0, v - 1000)), 1000); return () => clearInterval(t); }, [estudo]);
  const falta = Math.max(0, 3 - meta.sequencia);
  return (
    <main className="tela">
      <div className="col">
        <ArteMenu />
        <h1 className="titulo" onPointerDown={alternarEstudo}>CINZAS</h1>
        <p className="sub">{aviso || 'o mundo acabou em luz'}</p>
        {save && <div className="card aco degrau"><h3>Run em andamento</h3><div className="mini">Dia <b>{Math.floor(save.minutos / 1440) + 1}</b> · {horaStr(save.minutos)} · <b>{localPorId(save.zonaId).nome}</b> · vida <b>{Math.round(save.hp)}</b> · combustível <b>{save.combustivel}</b></div></div>}
        <div className="card aco degrau">
          <h3>Mundo de hoje</h3>
          <div className="mini">Seed <b>{hoje()}</b>: mesmo mapa e mesmo saque para todo mundo hoje. Sequência: <b style={{ color: 'var(--fosf)' }}>{meta.sequencia} dia(s)</b>{falta > 0 ? ` · faltam ${falta} para começar com 1 kit médico` : ' · bônus ativo: começa com 1 kit médico'}</div>
          {meta.melhorTempo > 0 && <div className="mini">Seu melhor: <b>{horaStr(meta.melhorTempo)}</b> · {meta.runs} runs · {meta.vitorias} no abrigo</div>}
        </div>
        {estudo && <div className="card aco degrau" style={{ boxShadow: 'inset 0 0 0 2px #050506, inset 0 0 0 4px var(--sangue2)' }}><div className="mini" style={{ color: 'var(--sangue2)' }}>Seu bônus de {meta.sequencia} dia(s) será PERDIDO em</div><div className="timer">{fmtMs(fake)}</div></div>}
        {save && <button className="btn aviso grande" {...press(() => onJogar(false))}>Continuar</button>}
        <button className={`btn grande ${save ? '' : 'aviso'}`} {...press(() => { if (save && !confirma) { setConfirma(true); setTimeout(() => setConfirma(false), 3500); return; } onJogar(true); })}>{save ? (confirma ? 'Toque de novo: apaga o save' : 'Nova run') : 'Sobreviver'}</button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}><button className="btn" {...press(() => set({ tela: 'creditos' }))}>Créditos</button><button className="btn" {...press(() => set({ tela: 'jogo', painel: 'config' }))}>Config.</button></div>
        {pwa && <button className="btn" {...press(() => { void pwa.prompt(); })}>Instalar no celular</button>}
        <p className="mini" style={{ textAlign: 'center', margin: 0 }}>Esq.: mover · Dir.: atacar (toque) ou mirar (arraste) · toque no objeto para interagir</p>
      </div>
    </main>
  );
}

export function Fim({ vitoria }: { vitoria: boolean }) {
  const s = useJogo(); const r = s.resumo!; const [meta, setMeta] = useState(lerMeta()); const feito = useRef(false); const [cartao, setCartao] = useState<string | null>(null);
  const estudo = !vitoria && estudoAtivo();
  const [info] = useState(() => estudo ? { falta: quaseLa(r.distAbrigo), social: provaSocialFalsa() } : null);
  useEffect(() => {
    if (feito.current) return; feito.current = true;
    const m = lerMeta(); m.runs++; m.abatesTotais += r.abates; m.melhorTempo = Math.max(m.melhorTempo, s.minutos - 8 * 60); if (vitoria) m.vitorias++; gravarMeta(m); setMeta(m);
  }, [r, s.minutos, vitoria]);
  return (
    <main className="tela" style={{ zIndex: 40 }}>
      <div className="col">
        <h1 className="titulo m" style={{ color: vitoria ? 'var(--fosf)' : 'var(--aviso)' }}>{vitoria ? 'VOCÊ CHEGOU AO ABRIGO 7' : 'VOCÊ MORREU'}</h1>
        <p className="sub" style={{ margin: 0 }}>{r.causa}</p>
        {info && (<div className="quase"><h2>Faltaram só {info.falta} passos para o abrigo!</h2><p>{info.social}</p><button className="btn perigo pisca" style={{ width: '100%' }} {...press(() => s.set({ tela: 'loja' }))}>Reviver por {CUSTO_REVIVER} ◆</button><p style={{ marginTop: 8, fontSize: 16 }}>Você tem {s.gemas} ◆ · faltam {Math.max(0, CUSTO_REVIVER - s.gemas)} ◆</p></div>)}
        <div className="grade"><div className="stat"><b>{r.dias}</b><span>{r.dias === 1 ? 'dia' : 'dias'} · {r.hora}</span></div><div className="stat"><b>{r.abates}</b><span>abates</span></div><div className="stat"><b>{r.vasculhados}</b><span>saques</span></div><div className="stat"><b>{r.radMax}%</b><span>radiação máx</span></div></div>
        <div className="card mini aco degrau">Seu melhor: <b>{horaStr(meta.melhorTempo)}</b> de jogo · {meta.runs} runs · {meta.abatesTotais} abates no total. Morte é permanente: o que fica é a sequência diária e o recorde.</div>
        <button className="btn aviso grande" {...press(() => { void compartilhar(r, s.seed).then(u => { if (u) setCartao(u); }); })}>Compartilhar meu resultado</button>
        {cartao && <div className="ov" style={{ zIndex: 50 }}><div className="col" style={{ width: 'min(100%,420px)' }}><p className="mini" style={{ textAlign: 'center', margin: 0 }}>Segure a imagem para salvar ou compartilhar.</p><img src={cartao} alt="Cartão do resultado" style={{ width: '100%', maxHeight: '68dvh', objectFit: 'contain' }} /><button className="btn grande" {...press(() => setCartao(null))}>Fechar</button></div></div>}
        <button className="btn grande" {...press(() => s.set({ tela: 'menu' }))}>Nova run</button>
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
        <div className="card aco degrau" style={{ textAlign: 'center', boxShadow: 'inset 0 0 0 2px #050506, inset 0 0 0 4px var(--sangue2)' }}><div className="mini" style={{ color: 'var(--sangue2)', letterSpacing: '.1em' }}>OFERTA RELÂMPAGO TERMINA EM</div><div className="timer">{fmtMs(ms)}</div></div>
        <div className="pacotes">{PACOTES.map(p => (
          <div key={p.id} className={`pac aco degrau ${p.destaque ? 'd' : ''}`}>{p.destaque && <span className="sel">MAIS POPULAR</span>}<b>{p.gemas} ◆</b>{p.de && <s>{p.de}</s>}<div className="pr">{p.preco}</div>{p.de && <div className="mini" style={{ color: 'var(--sangue2)' }}>-60%</div>}
            <button className={`btn ${p.destaque ? 'aviso' : ''}`} style={{ height: 34, fontSize: 12, padding: '0 10px' }} {...press(() => s.set({ tela: 'revelacao' }))}>Comprar</button></div>))}</div>
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
        <h1 className="titulo m" style={{ color: 'var(--fosf)' }}>PLOT TWIST</h1><p className="sub" style={{ margin: 0 }}>isso foi um experimento</p>
        <div className="card mini aco degrau"><b>Nada foi cobrado.</b> Não existe pagamento neste jogo; as gemas são só um número no seu aparelho. Tudo o que você viu foi desenhado para empurrar uma compra. Veja o que era mostrado e o que era verdade:</div>
        <div style={{ maxHeight: '46dvh', overflowY: 'auto' }}>{lista.map(m => <div className="manip" key={m.tecnica}><h4>{m.tecnica}</h4><p><em>Mostrado:</em> {m.mostrado}</p><p><u>Verdade:</u> {m.real}</p><p>Por que funciona: {m.porque}</p></div>)}</div>
        <div className="card mini aco degrau">Foram {lista.length} técnicas em poucos minutos, sem exigir nenhuma habilidade especial. É assim que isso é fácil de fazer e fácil de não perceber.</div>
        <button className="btn aviso grande" {...press(() => s.set({ tela: 'menu' }))}>Voltar ao início</button>
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
        <div className="card lista aco degrau">
          <p><b>Conceitos novos criados: {conceitos.novos.length}</b></p>{conceitos.novos.map(n => <div key={n.id}>#{n.id} {n.nome}</div>)}
          <p style={{ marginTop: 12 }}><b>Adaptados de prontos: {conceitos.adaptados.length}</b></p>{conceitos.adaptados.map(n => <div key={n.nome}>{n.nome} — {n.origem}</div>)}
          <p style={{ marginTop: 12 }}><b>Ícones:</b> game-icons.net, CC BY 3.0 (Lorc, Delapouite, Sbed, Skoll, Caro Asercion, DarkZaitzev, John Colburn).</p>
          <p><b>Fontes:</b> Silkscreen e VT323 (OFL, via Fontsource).</p><p><b>Código:</b> Phaser, rot-js (BSD-3), zustand, ZzFX, simplex-noise, alea (MIT).</p>
        </div>
        <button className="btn grande" {...press(() => set({ tela: 'menu' }))}>Voltar</button>
      </div>
    </main>
  );
}
