'use client';
import { useEffect, useRef, useState } from 'react';
import type * as Phaser from 'phaser';
import { useJogo, hoje, registrarDia, novoRun, aplicarRun, lerCfg } from '../game/store';
import { ponte } from '../game/ponte';
import { iniciarAudio, aplicarVolumes } from '../game/audio';
import { lerRun, temRun, type Run } from '../game/sistemas/salvar';
import { Hud, Sobreposicoes } from './Hud';
import Controles from './Controles';
import Paineis from './Paineis';
import { Menu, Fim, Loja, Revelacao, Creditos } from './Telas';

declare global { interface Window { __cinzas?: unknown } }

export default function Jogo() {
  const tela = useJogo(s => s.tela), painel = useJogo(s => s.painel), carga = useJogo(s => s.carga), cfg = useJogo(s => s.cfg), zonaNome = useJogo(s => s.zonaNome), set = useJogo(s => s.set);
  const [corrida, setCorrida] = useState(0), mundoRef = useRef<HTMLDivElement>(null), runRef = useRef<Run | null>(null);
  const jogando = tela === 'jogo' || tela === 'morte' || tela === 'vitoria';

  useEffect(() => { const c = lerCfg(); set({ cfg: c, temSave: temRun() }); aplicarVolumes({ mestre: c.mestre, sfx: c.sfx, amb: c.amb, mus: c.mus, vibra: c.vibra }); }, [set]);
  const iniciar = async (nova: boolean) => {
    void iniciarAudio();
    try { await Promise.all(['700 16px Silkscreen', '400 18px VT323'].map(f => document.fonts.load(f))); } catch { /* segue */ }
    const meta = registrarDia(); let run = nova ? null : lerRun(); if (!run) run = novoRun(hoje(), meta.sequencia >= 3);
    runRef.current = run; aplicarRun(run); set({ tela: 'jogo', painel: null, carga: 0 }); setCorrida(c => c + 1);
  };
  useEffect(() => {
    if (!jogando || !corrida || !mundoRef.current) return;
    let game: Phaser.Game | null = null, vivo = true; const en = ponte.entrada; Object.assign(en, { mx: 0, my: 0, ax: 0, ay: 0, mira: false, atacar: false, correr: false, furtivo: false });
    import('../game/cena').then(m => { if (!vivo || !mundoRef.current || !runRef.current) return; game = m.criarJogo(mundoRef.current, runRef.current, useJogo.getState().cfg.escala); window.__cinzas = { game, store: useJogo, ponte, cena: () => game!.scene.getScene('cena') }; });
    let wake: { release: () => Promise<void> } | null = null; try { void (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen').then(w => { wake = w; }).catch(() => undefined); } catch { /* sem wake lock */ }
    const vis = () => { if (document.hidden) { ponte.cmd?.salvar(); if (useJogo.getState().tela === 'jogo' && !useJogo.getState().painel) useJogo.setState({ painel: 'pausa' }); } };
    document.addEventListener('visibilitychange', vis);
    return () => { vivo = false; document.removeEventListener('visibilitychange', vis); ponte.cmd = null; ponte.ref = null; game?.destroy(true); window.__cinzas = undefined; void wake?.release(); };
  }, [corrida, jogando]);
  useEffect(() => { ponte.cmd?.pausar(painel !== null || tela !== 'jogo'); }, [painel, tela]);

  if (tela === 'menu' && painel !== 'config') return <Menu onJogar={iniciar} />;
  if (tela === 'creditos') return <Creditos />;
  if (tela === 'loja') return <Loja />;
  if (tela === 'revelacao') return <Revelacao />;
  if (tela === 'menu' && painel === 'config') return <div className="jogo"><Paineis /></div>;
  return (
    <div className="jogo" style={{ ['--u' as string]: cfg.ui }}>
      <div className="mundo" ref={mundoRef} />
      <Sobreposicoes />
      <Controles />
      <Hud />
      {carga < 1 && <div className="carga"><div className="carga-t">GERANDO O ERMO</div><div className="carga-s">{zonaNome}</div><div className="carga-b"><i style={{ width: `${Math.round(carga * 100)}%` }} /></div></div>}
      <Paineis />
      {tela === 'morte' && useJogo.getState().resumo && <Fim vitoria={false} />}
      {tela === 'vitoria' && useJogo.getState().resumo && <Fim vitoria />}
    </div>
  );
}
