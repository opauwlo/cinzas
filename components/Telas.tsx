'use client';
import { useEffect, useRef, useState } from 'react';
import { useJogo, lerMeta, gravarMeta, horaStr } from '../game/store';
import { lerRun } from '../game/sistemas/salvar';
import { estudoAtivo, quaseLa, provaSocialFalsa, ofertaRestante, registrarLoja, manipulacoes, fmtMs, PACOTES, CUSTO_REVIVER } from '../game/estudo';
import { compartilhar } from './cartao';
import { p } from './Cartao';
import { CONQUISTAS } from '../game/dados/meta';

const press = p;
export { default as Menu } from './Menu';

export function Fim({ vitoria }: { vitoria: boolean }) {
  const s = useJogo(); const r = s.resumo!; const [meta, setMeta] = useState(lerMeta()); const feito = useRef(false); const [cartao, setCartao] = useState<string | null>(null);
  const estudo = !vitoria && estudoAtivo();
  const [info] = useState(() => estudo ? { falta: quaseLa(r.distAbrigo), social: provaSocialFalsa() } : null);
  useEffect(() => {
    if (feito.current) return; feito.current = true;
    const m = lerMeta(); m.runs++; m.abatesTotais += r.abates; m.melhorTempo = Math.max(m.melhorTempo, s.minutos - 8 * 60); if (vitoria) m.vitorias++; gravarMeta(m); setMeta(m);
  }, [r, s.minutos, vitoria]);
  return (
    <main className={`tela fim-app ${vitoria ? 'venceu' : 'perdeu'}`} style={{ zIndex: 40 }}>
      <div className="col">
        <div className="fim-sinal" aria-hidden="true">{vitoria ? '⌂' : '◇'}</div><span className="sobretitulo" style={{ textAlign: 'center' }}>{vitoria ? 'TRANSMISSÃO RECEBIDA' : 'TRANSMISSÃO ENCERRADA'}</span>
        <h1 className="titulo m">{vitoria ? 'ABRIGO 7' : 'FIM DA JORNADA'}</h1>
        <p className="fim-prosa">{vitoria ? 'Você seguiu o sinal. Do outro lado da porta, a vida recomeça.' : 'O ermo guarda a sua história. O próximo sinal ainda pode ser seu.'}</p>
        <p className="sub" style={{ margin: 0 }}>{r.causa}</p>
        {info && (<div className="quase"><h2>Faltaram só {info.falta} passos para o abrigo!</h2><p>{info.social}</p><button className="btn perigo pisca" style={{ width: '100%' }} {...press(() => s.set({ tela: 'loja' }))}>Reviver por {CUSTO_REVIVER} ◆</button><p style={{ marginTop: 8, fontSize: 16 }}>Você tem {s.gemas} ◆ · faltam {Math.max(0, CUSTO_REVIVER - s.gemas)} ◆</p></div>)}
        <div className="grade"><div className="stat"><b>{r.dias}</b><span>{r.dias === 1 ? 'dia' : 'dias'} · {r.hora}</span></div><div className="stat"><b>{r.abates}</b><span>abates</span></div><div className="stat"><b>{r.vasculhados}</b><span>saques</span></div><div className="stat"><b>{r.radMax}%</b><span>radiação máx</span></div></div>
        <div className="card mini aco degrau">Nível <b>{r.nivel ?? 1}</b> · <b>{r.contratos ?? 0}</b> contrato(s) cumprido(s){r.conquistas && r.conquistas.length > 0 && <> · <b style={{ color: 'var(--ambar)' }}>★ {r.conquistas.map(id => CONQUISTAS.find(q => q.id === id)?.nome).filter(Boolean).join(', ')}</b></>}</div>
        <div className="card mini aco degrau">Seu melhor: <b>{Math.floor(meta.melhorTempo / 60)} h {Math.floor(meta.melhorTempo % 60)} min</b> de jogo · {meta.runs} runs · {meta.abatesTotais} abates no total. As conquistas e os recordes ficam para a próxima jornada.</div>
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
          <p>Um mundo depois do clarão. Uma jornada até o Abrigo 7.</p><p>Arte isométrica, personagens, criaturas e cenários procedurais do CINZAS.</p>
          <p style={{ marginTop: 12 }}><b>Ícones:</b> game-icons.net, CC BY 3.0 (Lorc, Delapouite, Sbed, Skoll, Caro Asercion, DarkZaitzev, John Colburn).</p>
          <p><b>Fontes:</b> Pixelify Sans, Silkscreen e VT323 (OFL, via Fontsource).</p><p><b>Código:</b> Phaser, rot-js (BSD-3), zustand, ZzFX, simplex-noise, alea (MIT).</p>
        </div>
        <button className="btn grande" {...press(() => set({ tela: 'menu' }))}>Voltar</button>
      </div>
    </main>
  );
}
