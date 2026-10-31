'use client';
import { useEffect, useRef, useState } from 'react';
import nipplejs from 'nipplejs';
import type * as Phaser from 'phaser';
import { useJogo, estadoInicial, hoje, registrarDia } from '../game/store';
import { ponte } from '../game/ponte';
import { iniciarAudio } from '../game/audio';
import { Topo, Sobreposicoes, Botoes, Painel } from './Hud';
import Inventario from './Inventario';
import { Menu, Fim, Loja, Revelacao, Creditos } from './Telas';

declare global { interface Window { __cinzas?: unknown } }

export default function Jogo() {
  const tela = useJogo(s => s.tela); const inv = useJogo(s => s.invAberto); const set = useJogo(s => s.set);
  const [corrida, setCorrida] = useState(0);
  const mundoRef = useRef<HTMLDivElement>(null); const esq = useRef<HTMLDivElement>(null); const dir = useRef<HTMLDivElement>(null);
  const jogando = tela === 'jogo' || tela === 'morte' || tela === 'vitoria';

  const iniciar = async () => {
    void iniciarAudio();
    try { await Promise.all(['900 20px Cinzel', '800 20px Nunito', '900 20px Nunito'].map(f => document.fonts.load(f))); } catch { /* segue */ }
    const meta = registrarDia(); const seed = hoje(); const e = estadoInicial(seed);
    if (meta.sequencia >= 3) e.inv = { ...e.inv, kit: 1 };
    set({ ...e, tela: 'jogo' }); setCorrida(c => c + 1);
  };

  useEffect(() => {
    if (!jogando || !corrida || !mundoRef.current || !esq.current || !dir.current) return;
    let game: Phaser.Game | null = null; let vivo = true; const joys: ReturnType<typeof nipplejs.create>[] = [];
    const en = ponte.entrada; Object.assign(en, { mx: 0, my: 0, ax: 0, ay: 0, mira: false, atacar: false, correr: false, furtivo: false });
    import('../game/cena').then(m => {
      if (!vivo || !mundoRef.current) return;
      game = m.criarJogo(mundoRef.current, useJogo.getState().seed);
      window.__cinzas = { game, store: useJogo, ponte, cena: () => game!.scene.getScene('cena') };
    });
    const mk = (zone: HTMLElement, lado: 'e' | 'd') => {
      const j = nipplejs.create({ zone, mode: 'dynamic', color: lado === 'e' ? '#00ffcc' : '#ffd700', size: 112, fadeTime: 120, restOpacity: 0.5 }); joys.push(j);
      j.on('move', ev => { const f = Math.min(1, (ev.data.distance ?? 0) / 56), v = ev.data.vector; if (lado === 'e') { en.mx = v.x * f; en.my = -v.y * f; } else { en.mira = true; en.ax = v.x * f; en.ay = -v.y * f; } });
      j.on('end', () => { if (lado === 'e') { en.mx = 0; en.my = 0; } else { en.mira = false; en.ax = 0; en.ay = 0; } });
    };
    mk(esq.current, 'e'); mk(dir.current, 'd');
    return () => { vivo = false; ponte.cmd = null; joys.forEach(j => j.destroy()); game?.destroy(true); window.__cinzas = undefined; };
  }, [corrida, jogando]);

  useEffect(() => { ponte.cmd?.pausar(inv || tela !== 'jogo'); }, [inv, tela]);

  if (tela === 'menu') return <Menu onJogar={iniciar} />;
  if (tela === 'creditos') return <Creditos />;
  if (tela === 'loja') return <Loja />;
  if (tela === 'revelacao') return <Revelacao />;
  return (
    <div className="jogo">
      <Topo />
      <div className="mundo">
        <div ref={mundoRef} style={{ position: 'absolute', inset: 0 }} />
        <div ref={esq} className="zona esq" /><div ref={dir} className="zona dir" />
        <Sobreposicoes /><Botoes />
      </div>
      <Painel />
      {inv && tela === 'jogo' && <Inventario />}
      {tela === 'morte' && useJogo.getState().resumo && <Fim vitoria={false} />}
      {tela === 'vitoria' && useJogo.getState().resumo && <Fim vitoria />}
    </div>
  );
}
