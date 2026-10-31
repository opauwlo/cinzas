'use client';
import { useEffect, useRef, useState } from 'react';
import { useJogo } from '../game/store';
import { localPorId } from '../game/dados/locais';
import { criarCenaViagem, type ClimaViagem } from '../game/lib/viagem';
import { ponte } from '../game/ponte';
import IconeLocal from './IconeLocal';
import { novaRota, passoRota, distTotal, type FaseRota } from '../game/sistemas/rota';
import { motor, sfx, ambiente } from '../game/audio';

const DICAS = ['Cada viagem gasta combustível e horas.', 'Combustível sobra em carros velhos, postos e contratos.', 'Chegue de dia: à noite eles ficam mais ativos.', 'Leve água e curativos antes de sair do abrigo.', 'Lugares perigosos pedem nível e preparo: confira no mapa.'];

/**
 * A viagem de jipe: uma cena de estrada animada (céu por hora e clima, horizonte da origem e do destino em paralaxe, marco do lugar, jipe com roda,
 * suspensão, faróis, poeira e fumaça). Se a estrada traz um evento, o jipe freia e para; ao resolver, retoma. No fim da rota o jogo carrega o destino
 * por baixo e a cena some só quando o lugar está pronto. Em testes, `window.__viagemRapida = true` encurta tudo.
 */
export default function Viagem() {
  const v = useJogo(s => s.viagem), carga = useJogo(s => s.carga), zonaId = useJogo(s => s.zonaId), tela = useJogo(s => s.tela);
  const cv = useRef<HTMLCanvasElement>(null), box = useRef<HTMLDivElement>(null), prog = useRef(0), [pr, setPr] = useState(0), [saindo, setSaindo] = useState(false), chave = v ? `${v.de}|${v.para}|${v.t0}` : '';
  useEffect(() => {
    const vv = useJogo.getState().viagem; if (!vv) return; const caixa = box.current!, c = cv.current!, g = c.getContext('2d')!;
    const cssW = caixa.clientWidth || 360, w = Math.max(120, Math.floor(cssW / 2)), h = Math.round(w * 0.75); c.width = w; c.height = h;
    const dur = Math.min(9, 3.8 + vv.horas * 1.1), biomaPara = localPorId(vv.para).bioma, rota = { dur, evento: vv.evento }, est = novaRota();
    const cena = criarCenaViagem({ de: vv.de, para: vv.para, hora: vv.hora, clima: vv.clima as ClimaViagem, seed: vv.seed, w, h, total: distTotal(dur), criar: (cw, ch) => { const oc = document.createElement('canvas'); oc.width = cw; oc.height = ch; const og = oc.getContext('2d'); return og ? { alvo: oc, g: og } : null; } });
    let raf = 0, ult = performance.now(), t = 0, freou = false, tAmb = 0;
    motor.ligar(); sfx.partida(); setSaindo(false); prog.current = 0; setPr(0);
    const quadro = (agora: number) => {
      const acel = (globalThis as { __viagemRapida?: boolean }).__viagemRapida === true ? 10 : 1, dt = Math.min(0.05, (agora - ult) / 1000) * acel; ult = agora; t += dt; // modo rápido: só nos testes
      const fase = (useJogo.getState().viagem?.fase ?? 'indo') as FaseRota, aviso = passoRota(est, dt, rota, fase);
      if (est.freio && est.vel > 0.45 && !freou) { freou = true; sfx.freio(); } if (est.vel > 0.8) freou = false;
      if (aviso === 'meio') ponte.cmd?.viagemMeio(); else if (aviso === 'fim') ponte.cmd?.viagemFim();
      const vel = est.vel; cena.desenhar(g, { t, dist: est.dist, vel, freio: est.freio, p: est.p, obstaculo: vv.evento && (!est.tratado || fase === 'evento') }, dt);
      motor.vel(vel); prog.current = est.p; tAmb += dt; if (tAmb > 0.25) { tAmb = 0; ambiente({ hora: vv.hora, vento: 0.12 + vel * 0.55, chuva: vv.clima === 'chuva' || vv.clima === 'acida' ? 0.7 : vv.clima === 'tempestade' ? 1 : 0, interior: false, fogo: 0, perigo: 0, bioma: biomaPara === 'base' ? 'ermo' : biomaPara }); }
      raf = requestAnimationFrame(quadro);
    };
    raf = requestAnimationFrame(quadro); const iv = window.setInterval(() => setPr(prog.current), 120);
    return () => { cancelAnimationFrame(raf); window.clearInterval(iv); motor.parar(); };
  }, [chave]);
  // some quando o destino está pronto (ou quando o jogo saiu da tela de jogo, como na vitória)
  useEffect(() => {
    if (!v) return; const pronto = v.fase === 'chegando' && zonaId === v.para && carga >= 1, fora = tela !== 'jogo';
    if (!pronto && !fora) return; setSaindo(true); const id = window.setTimeout(() => useJogo.setState({ viagem: null }), 650); return () => window.clearTimeout(id);
  }, [v, carga, zonaId, tela]);
  // relógio de segurança: se a chegada demorar demais (aparelho muito lento), a tela de viagem cede ao carregamento normal em vez de prender o jogador
  useEffect(() => {
    if (v?.fase !== 'chegando') return; const id = window.setTimeout(() => useJogo.setState({ viagem: null }), 60000); return () => window.clearTimeout(id);
  }, [v?.fase]);
  if (!v) return null; const de = localPorId(v.de), para = localPorId(v.para), dica = DICAS[Math.abs(v.t0) % DICAS.length], chegando = v.fase === 'chegando';
  return (
    <div className={`viagem ${saindo ? 'some' : ''}`} onPointerDown={e => e.stopPropagation()}>
      <div className="vj-topo"><h2>VIAGEM DE JIPE</h2><div className="vj-rota"><span>{de.nome}</span> <i>›››</i> <span>{para.nome}</span></div><div className="vj-sub">{v.horas} h · combustível −{v.comb}</div></div>
      <div className="vj-tela" ref={box}><canvas ref={cv} /></div>
      <div className="vj-base">
        <div className="vj-trilha-box"><IconeLocal id={v.de} w={44} h={36} /><div className="vj-trilha"><b style={{ left: `${Math.round(pr * 100)}%` }} /><i style={{ width: `${Math.round(pr * 100)}%` }} /></div><IconeLocal id={v.para} w={44} h={36} /></div>
        <div className="vj-dica">{v.fase === 'evento' ? 'Algo bloqueia a estrada…' : chegando ? (carga < 1 ? `Chegando a ${para.nome}… gerando o terreno ${Math.round(carga * 100)}%` : `Chegando a ${para.nome}…`) : dica}</div>
      </div>
    </div>
  );
}
