'use client';
import { useEffect, useRef, useState } from 'react';
import nipplejs from 'nipplejs';
import { criarMundo, type Estado, type Entrada } from './mundo';
import conceitos from '../conceitos.json';

const ic = (autor: string, nome: string) => `/icons/${autor}/${nome}.svg`;

type Slot = { icone: string; nome: string; qtd?: number; raridade?: 'incomum' | 'raro' };
const CINTO: Slot[] = [
  { icone: ic('lorc', 'bandage-roll'), nome: 'Bandagem', qtd: 3 },
  { icone: ic('sbed', 'syringe'), nome: 'Antirrad', qtd: 1, raridade: 'incomum' },
  { icone: ic('delapouite', 'water-bottle'), nome: 'Água', qtd: 2 },
  { icone: ic('lorc', 'molotov'), nome: 'Molotov', qtd: 1, raridade: 'raro' },
];

export default function Jogo() {
  const [tela, setTela] = useState<'menu' | 'jogo' | 'creditos'>('menu');
  const [st, setSt] = useState<Estado>({ x: 0, y: 0, rad: 0, cpm: 18 });
  const mundoRef = useRef<HTMLDivElement>(null);
  const zonaRef = useRef<HTMLDivElement>(null);
  const entrada = useRef<Entrada>({ vx: 0, vy: 0 });

  useEffect(() => {
    if (tela !== 'jogo' || !mundoRef.current || !zonaRef.current) return;
    const game = criarMundo(mundoRef.current, entrada.current, setSt);
    (window as unknown as { __jogo?: unknown }).__jogo = game;
    const joy = nipplejs.create({ zone: zonaRef.current, mode: 'dynamic', color: '#c7b377', size: 110, fadeTime: 150 });
    joy.on('move', (e) => { entrada.current.vx = e.data.vector.x; entrada.current.vy = -e.data.vector.y; });
    joy.on('end', () => { entrada.current.vx = 0; entrada.current.vy = 0; });
    return () => { joy.destroy(); game.destroy(true); };
  }, [tela]);

  if (tela === 'menu') return (
    <main className="tela">
      <div className="moldura caixa">
        <h1 className="titulo">CINZAS</h1>
        <p className="subtitulo">o mundo acabou em luz</p>
        <div className="divisor" />
        <button className="btn-d2" onClick={() => setTela('jogo')}>Sobreviver</button>
        <button className="btn-d2 sec" onClick={() => setTela('creditos')}>Créditos</button>
        <p className="dica">mova com o dedo esquerdo · WASD no teclado</p>
      </div>
    </main>
  );

  if (tela === 'creditos') return (
    <main className="tela">
      <div className="moldura caixa">
        <h1 className="titulo" style={{ fontSize: 28 }}>Créditos</h1>
        <div className="divisor" />
        <div className="lista">
          <p><b>Conceitos novos criados: {conceitos.novos.length}</b></p>
          {conceitos.novos.map(n => <p key={n.id}>#{n.id} {n.nome}</p>)}
          <p><b>Adaptados de prontos: {conceitos.adaptados.length}</b></p>
          {conceitos.adaptados.map(n => <p key={n.nome}>{n.nome} — {n.origem}</p>)}
          <p><b>Ícones:</b> game-icons.net, CC BY 3.0 (Lorc, Delapouite, Sbed, Skoll, Caro Asercion, DarkZaitzev, John Colburn).</p>
          <p><b>Fontes:</b> Cinzel, Metamorphous, IM Fell English SC, Black Ops One, Share Tech Mono (OFL).</p>
        </div>
        <button className="btn-d2 sec" onClick={() => setTela('menu')}>Voltar</button>
      </div>
    </main>
  );

  const hp = 82;
  const nivelRad = Math.min(100, Math.round(st.rad * 100));
  return (
    <div className="jogo">
      <div className="mundo">
        <div ref={mundoRef} style={{ position: 'absolute', inset: 0 }} />
        <div ref={zonaRef} style={{ position: 'absolute', inset: 0, right: '38%', zIndex: 1 }} />
        <div className="local">Ermo · Cratera 7</div>
        <div className="geiger"><img src={ic('lorc', 'radioactive')} alt="" />{st.cpm} CPM</div>
        <div className="acoes">
          <button className="btn" aria-label="Vasculhar"><img src={ic('delapouite', 'backpack')} alt="" /></button>
          <button className="btn" aria-label="Correr"><img src={ic('lorc', 'sprint')} alt="" /></button>
        </div>
      </div>
      <div className="painel">
        <div className="moldura" />
        <div className="orbe hp"><div className="liquido" style={{ ['--nivel' as string]: `${hp}%` }} /><span className="num">{hp}/100</span></div>
        <div className="centro">
          <div className="barras">
            <div className="barra fome" style={{ ['--p' as string]: '71%' }}><i /><span>Fome</span></div>
            <div className="barra sede" style={{ ['--p' as string]: '54%' }}><i /><span>Sede</span></div>
          </div>
          <div className="cinto">
            {CINTO.map((s, i) => (
              <button key={s.nome} className={`slot ${s.raridade ?? ''}`} aria-label={s.nome}>
                <span className="tecla">{i + 1}</span>
                <img src={s.icone} alt="" />
                {s.qtd ? <span className="qtd">{s.qtd}</span> : null}
              </button>
            ))}
          </div>
        </div>
        <div className="orbe rad"><div className="liquido" style={{ ['--nivel' as string]: `${nivelRad}%` }} /><span className="num">{nivelRad}% rad</span></div>
      </div>
    </div>
  );
}
