'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type * as Phaser from 'phaser';
import { useJogo, hoje, registrarDia, novoRun, aplicarRun, lerCfg, lerMeta } from '../game/store';
import { DICAS_CARGA } from '../game/dados/meta';
import { ponte } from '../game/ponte';
import { iniciarAudio, aplicarVolumes } from '../game/audio';
import { lerRun, temRun, type Run } from '../game/sistemas/salvar';
import { sincGrade } from '../game/sistemas/grade';
import { Hud, Sobreposicoes } from './Hud';
import Controles from './Controles';
import Viagem from './Viagem';
import Paineis from './Paineis';
import { Menu, Fim, Loja, Revelacao, Creditos } from './Telas';

declare global { interface Window { __cinzas?: unknown } }

export default function Jogo() {
  const tela = useJogo(s => s.tela), painel = useJogo(s => s.painel), emViagem = useJogo(s => s.viagem !== null), carga = useJogo(s => s.carga), cfg = useJogo(s => s.cfg), zonaNome = useJogo(s => s.zonaNome), set = useJogo(s => s.set);
  const [corrida, setCorrida] = useState(0), mundoRef = useRef<HTMLDivElement>(null), runRef = useRef<Run | null>(null);
  const [erro, setErro] = useState(''), [demorou, setDemorou] = useState(false);
  const jogando = tela === 'jogo' || tela === 'morte' || tela === 'vitoria';

  useEffect(() => { const c = lerCfg(); set({ cfg: c, temSave: temRun() }); aplicarVolumes({ mestre: c.mestre, sfx: c.sfx, amb: c.amb, mus: c.mus, vibra: c.vibra, perfil: c.perfil, graves: c.graves, agudos: c.agudos }); }, [set]);
  const iniciar = async (nova: boolean) => {
    setErro(''); setDemorou(false);
    void iniciarAudio();
    try { await Promise.all(['700 16px Silkscreen', '400 18px VT323', '400 16px "Pixelify Sans"', '600 16px "Pixelify Sans"'].map(f => document.fonts.load(f))); } catch { /* segue */ }
    const meta = registrarDia(); let run = nova ? null : lerRun(); if (!run) run = novoRun(hoje(), meta.sequencia >= 3, lerMeta().dif ?? 1);
    runRef.current = run; aplicarRun(run); sincGrade(); set({ tela: 'jogo', painel: null, carga: 0 }); setCorrida(c => c + 1);
  };
  useEffect(() => {
    if (!jogando || !corrida || !mundoRef.current) return;
    let game: Phaser.Game | null = null, vivo = true; const en = ponte.entrada; Object.assign(en, { mx: 0, my: 0, ax: 0, ay: 0, mira: false, atacar: false, auto: false, correr: false, furtivo: false });
    import('../game/cena').then(m => { if (!vivo || !mundoRef.current || !runRef.current) return; game = m.criarJogo(mundoRef.current, runRef.current, useJogo.getState().cfg.escala); window.__cinzas = { game, store: useJogo, ponte, cena: () => game!.scene.getScene('cena') }; }).catch(() => { if (vivo) setErro('Não foi possível carregar o mundo. Verifique a conexão e tente novamente.'); });
    let wake: { release: () => Promise<void> } | null = null; try { void (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen').then(w => { wake = w; }).catch(() => undefined); } catch { /* sem wake lock */ }
    const vis = () => { if (document.hidden) { ponte.cmd?.salvar(); if (useJogo.getState().tela === 'jogo' && !useJogo.getState().painel) useJogo.setState({ painel: 'pausa' }); } };
    document.addEventListener('visibilitychange', vis);
    return () => { vivo = false; document.removeEventListener('visibilitychange', vis); ponte.cmd = null; ponte.ref = null; game?.destroy(true); window.__cinzas = undefined; void wake?.release(); };
  }, [corrida, jogando]);
  useEffect(() => { if (carga >= 1) ponte.cmd?.pausar(painel !== null || tela !== 'jogo' || emViagem); }, [painel, tela, emViagem, carga]);
  useEffect(() => {
    if (tela !== 'jogo' || carga >= 1) { setDemorou(false); return; }
    const t = setTimeout(() => setDemorou(true), 45000);
    return () => clearTimeout(t);
  }, [tela, carga >= 1, corrida]);
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape' && useJogo.getState().tela === 'jogo' && useJogo.getState().painel === null && !useJogo.getState().viagem) set({ painel: 'pausa' }); };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [set]);
  const introMostrada = useRef(false), dicaCarga = useMemo(() => DICAS_CARGA[Math.floor(Math.random() * DICAS_CARGA.length)], [corrida]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (tela === 'jogo' && carga >= 1 && !introMostrada.current && !lerMeta().intro) { introMostrada.current = true; set({ painel: 'intro' }); } }, [tela, carga, set]);

  const emMenu = tela === 'menu', painelMenu = painel === 'config' || painel === 'ajuda';
  if (emMenu && !painelMenu) return <Menu onJogar={iniciar} />;
  if (tela === 'creditos') return <Creditos />;
  if (tela === 'loja') return <Loja />;
  if (tela === 'revelacao') return <Revelacao />;
  if (emMenu && painelMenu) return <div className="jogo"><Paineis /></div>;
  return (
    <div className="jogo" style={{ ['--u' as string]: cfg.ui }}>
      <div className="mundo" ref={mundoRef} />
      <Sobreposicoes />
      <Controles />
      <Hud />
      {(carga < 1 || erro) && !emViagem && <div className="carga"><div className="sobretitulo">CINZAS · PREPARANDO SUA JORNADA</div><div className="carga-t">{erro ? 'SINAL INTERROMPIDO' : 'GERANDO O ERMO'}</div><div className="carga-s">{zonaNome}</div><div className="carga-b" role="progressbar" aria-label="Carregando o mundo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(carga * 100)}><i style={{ width: `${Math.round(carga * 100)}%` }} /></div><div className="carga-d">{erro || (demorou ? 'Este aparelho está demorando a preparar o cenário. Você pode tentar a qualidade Leve nas configurações.' : dicaCarga)}</div>{(erro || demorou) && <button className="btn" onClick={() => { setErro(''); set({ tela: 'menu', painel: null }); }}>Voltar ao menu</button>}</div>}
      {emViagem && <Viagem />}
      <Paineis />
      {tela === 'morte' && useJogo.getState().resumo && <Fim vitoria={false} />}
      {tela === 'vitoria' && useJogo.getState().resumo && <Fim vitoria />}
    </div>
  );
}
