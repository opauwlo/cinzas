'use client';
import { useEffect, useRef, useState } from 'react';
import { useJogo, horaStr, gravarCfg, OBJETIVOS, type Configs } from '../game/store';
import { ITENS, RECEITAS, COZINHA, COR_RARIDADE, armaDe } from '../game/dados/itens';
import { LOCAIS, localPorId, custoViagem, bloqueioLocal } from '../game/dados/locais';
import { BIOMAS } from '../game/dados/biomas';
import { ponte } from '../game/ponte';
import { aplicarVolumes, sfx } from '../game/audio';
import { PERFIS, PERFIS_ORDEM } from '../game/dados/sons';
import { W, H, T } from '../game/zona';
import Ico, { ic } from './Ico';
import { Cartao, fechar, p } from './Cartao';
import { Diario, PerkPainel, Melhorias, EventoPainel, Ajuda, Intro } from './PaineisMeta';
import { Mochila } from './Mochila';
import { Bancada } from './Bancada';
import { PainelNpc, PainelNota } from './PaineisNpc';
import { linhasDe, livres } from '../game/sistemas/grade';

function Linha({ id, qtd, acoes }: { id: string; qtd: number; acoes: React.ReactNode }) {
  const it = ITENS[id], cor = COR_RARIDADE[it.raridade];
  return <div className="linha-item" style={{ ['--rc' as string]: cor }}><div className="im"><Ico src={it.icone} n={28} cor={it.tom ?? cor} /></div><div><b>{it.nome}{qtd > 1 ? ` ×${qtd}` : ''}</b><small>{it.desc}</small></div><div className="bt2">{acoes}</div></div>;
}
const ORDEM = ['raro', 'incomum', 'comum'];
const CATS: [string, string, (t: string) => boolean][] = [['todos', 'Tudo', () => true], ['comida', 'Comida', t => t === 'comida' || t === 'bebida'], ['cura', 'Cura', t => t === 'cura'], ['arma', 'Armas', t => t === 'arma' || t === 'municao'], ['equip', 'Equip.', t => t === 'equip' || t === 'ferramenta' || t === 'especial'], ['mat', 'Material', t => t === 'material']];

function Bau() {
  const s = useJogo(), inv = Object.keys(s.inv).filter(i => ITENS[i]), bau = Object.keys(s.bau).filter(i => ITENS[i]);
  return (
    <Cartao titulo="Baú do abrigo" larg={620}>
      <div className="duas">
        <div><div className="mini"><b>Mochila</b> {livres(s.grade, linhasDe(s.inv))} livres</div>{inv.length === 0 && <div className="mini">vazia</div>}{inv.map(id => <Linha key={id} id={id} qtd={s.inv[id]} acoes={<><button className="btn peq" {...p(() => ponte.cmd?.bauMover(id, 1, true))}>→1</button><button className="btn peq" {...p(() => ponte.cmd?.bauMover(id, 99, true))}>→tudo</button></>} />)}</div>
        <div><div className="mini"><b>Baú</b></div>{bau.length === 0 && <div className="mini">vazio</div>}{bau.map(id => <Linha key={id} id={id} qtd={s.bau[id]} acoes={<><button className="btn peq" {...p(() => ponte.cmd?.bauMover(id, 1, false))}>←1</button><button className="btn peq" {...p(() => ponte.cmd?.bauMover(id, 99, false))}>←tudo</button></>} />)}</div>
      </div>
    </Cartao>
  );
}
function Cozinha() {
  const s = useJogo();
  return (
    <Cartao titulo="Fogueira">
      {COZINHA.map(r => { const n = s.inv[r.de] ?? 0, it = ITENS[r.para]; return <div key={r.id} className="linha-item" style={{ ['--rc' as string]: COR_RARIDADE[it.raridade] }}><div className="im"><Ico src={it.icone} n={28} cor={it.tom ?? '#cfc7ae'} /></div><div><b>{r.nome}</b><small>Você tem {n} de {ITENS[r.de].nome.toLowerCase()}.</small></div><button className={`btn peq ${n ? 'aviso' : ''}`} disabled={!n} {...p(() => ponte.cmd?.cozinhar(r.id))}>Fazer</button></div>; })}
      <div className="mini">Ferver deixa a água segura. Carne cozida sacia o dobro e não dá intoxicação.</div>
    </Cartao>
  );
}
function Dormir() {
  const s = useJogo(), h = (s.minutos % 1440) / 60;
  return (
    <Cartao titulo="Dormir">
      <div className="card aco mini">Agora são <b>{horaStr(s.minutos)}</b>. Dormir cura (+6 de vida por hora), restaura o fôlego e gasta metade da fome e da sede.</div>
      {[2, 4, 8].map(x => <button key={x} className="btn grande" {...p(() => ponte.cmd?.dormir(x))}>Dormir {x} horas</button>)}
      <button className="btn grande aviso" {...p(() => ponte.cmd?.dormir(Math.max(1, Math.round(((24 - h) + 7) % 24 || 8))))}>Até de manhã (07:00)</button>
    </Cartao>
  );
}

// ---------------------------------------------------------------- mapa-múndi (viagem de jipe)
const COR_BIOMA: Record<string, string> = { base: '#8fe36a', ermo: '#b8a070', floresta: '#5a8a4a', cidade: '#8a8f96', pantano: '#7aa83a', industrial: '#b06a3a' };
function Mapa() {
  const s = useJogo(), ref = useRef<HTMLCanvasElement>(null), [sel, setSel] = useState<string>('ermo'), loc = localPorId(s.zonaId);
  useEffect(() => {
    const c = ref.current!, g = c.getContext('2d')!, N = 100, img = g.createImageData(N, N), d = img.data, B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
    const h = (x: number, y: number) => { let n = (x * 374761393 + y * 668265263) | 0; n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let r = 22, gg = 26, b = 22, tint = [0, 0, 0], w = 0; for (const l of LOCAIS) { const dd = Math.hypot(x - l.x, y - l.y); if (dd < 20) { const k = 1 - dd / 20; const cc = COR_BIOMA[l.bioma]; const rr = parseInt(cc.slice(1, 3), 16), g2 = parseInt(cc.slice(3, 5), 16), bb = parseInt(cc.slice(5, 7), 16); tint[0] += rr * k; tint[1] += g2 * k; tint[2] += bb * k; w += k; } }
      if (w > 0) { const m = Math.min(0.42, w * 0.4), dth = B[(y & 3) * 4 + (x & 3)] < m ? 1 : 0; if (dth) { r = tint[0] / w * 0.45; gg = tint[1] / w * 0.45; b = tint[2] / w * 0.45; } }
      const v = h(x >> 1, y >> 1); if (v > 0.9) { r += 14; gg += 14; b += 12; } const o = (y * N + x) * 4; d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = 255;
    }
    g.putImageData(img, 0, 0); g.fillStyle = '#6a604c';
    const base = LOCAIS[0]; for (const l of LOCAIS.slice(1)) { const n = Math.ceil(Math.hypot(l.x - base.x, l.y - base.y)); for (let i = 0; i < n; i += 2) g.fillRect(Math.round(base.x + (l.x - base.x) * i / n), Math.round(base.y + (l.y - base.y) * i / n), 1, 1); }
  }, []);
  const alvoObj = OBJETIVOS[Math.min(s.objIdx, OBJETIVOS.length - 1)].local, dest = localPorId(sel), custo = custoViagem(s.zonaId, sel, s.perks.includes('mecanico')), bloq = bloqueioLocal(dest, s.nivel, s.inv), travado = !!bloq, sem = s.combustivel < custo.combustivel, aqui = sel === s.zonaId;
  return (
    <Cartao titulo="Mapa" larg={560} rodape={
      <div className="card aco degrau" style={{ display: 'grid', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><b style={{ font: "700 14px var(--f-ui)", color: 'var(--aviso2)' }}>{dest.nome}</b><span className="mini">{'☠'.repeat(0)}{Array.from({ length: dest.perigo }).map((_, i) => <Ico key={i} src={ic('lorc', 'skull-crossed-bones')} n={14} cor="#e0553f" style={{ display: 'inline-block', marginLeft: 2 }} />)}</span></div>
        <div className="mini">{travado ? `Bloqueado: ${bloq!.toLowerCase()}.` : dest.desc}</div>
        <div className="chips"><span className="chip">{BIOMAS[dest.bioma].nome}</span><span className={`chip ${s.nivel >= dest.nivel ? 'ok' : 'falta'}`}>nível {dest.nivel}</span>{!aqui && <><span className="chip">{custo.horas} h de viagem</span><span className={`chip ${sem ? 'falta' : 'ok'}`}>combustível {s.combustivel}/{custo.combustivel}</span></>}</div>
        <button className="btn grande aviso" disabled={aqui || travado || sem} {...p(() => ponte.cmd?.viajar(sel))}>{aqui ? 'Você está aqui' : travado ? 'Bloqueado' : sem ? 'Sem combustível' : `Viajar para ${dest.nome}`}</button>
      </div>}>
      <div style={{ position: 'relative' }}>
        <canvas ref={ref} width={100} height={100} className="mapamundi" />
        {LOCAIS.filter(l => l.id !== 'abrigo7' || s.sabeAbrigo || (s.inv.radio ?? 0) > 0).map(l => { const trava = !!bloqueioLocal(l, s.nivel, s.inv); return (
          <button key={l.id} className="btn" aria-label={l.nome} {...p(() => { setSel(l.id); sfx.ui('clique'); })} style={{ position: 'absolute', left: `${l.x}%`, top: `${l.y}%`, transform: 'translate(-50%,-50%)', width: 34, height: 34, padding: 0, boxShadow: l.id === sel ? 'inset 0 0 0 2px #050506, inset 0 0 0 4px #f09a50' : l.id === s.zonaId ? 'inset 0 0 0 2px #050506, inset 0 0 0 4px #8fe36a' : undefined }}>
            {l.id === alvoObj && <span className="estrela">★</span>}<span style={{ width: 14, height: 14, background: COR_BIOMA[l.bioma], boxShadow: '0 0 0 2px #050506', opacity: trava ? 0.35 : 1 }} />
            <span style={{ position: 'absolute', top: 36, left: '50%', transform: 'translateX(-50%)', font: '17px var(--f-hud)', color: l.id === s.zonaId ? '#8fe36a' : '#cfc7ae', whiteSpace: 'nowrap', textShadow: '0 1px 0 #000, 1px 0 0 #000, -1px 0 0 #000' }}>{l.id === s.zonaId ? '▸ ' : ''}{l.nome}{trava ? ` · nv ${l.nivel}` : ''}</span>
          </button>); })}
      </div>
    </Cartao>
  );
  void loc;
}

// ---------------------------------------------------------------- mapa da zona (o que você já explorou)
function MapaZona() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!, g = c.getContext('2d')!, cena = ponte.ref as { zona: { tipos: Uint8Array; pois: { x: number; y: number; nome: string; id: string }[]; jipe: { x: number; y: number }; props: { p: { rec: { n: string }; x: number; y: number } }[] }; seen: Uint8Array; jog: { x: number; y: number } } | null; if (!cena) return;
    const img = g.createImageData(W, H), d = img.data, cor = (t: number) => (t === T.ESTRADA || t === T.LINHA_H || t === T.LINHA_V ? [58, 60, 64] : t === T.CALCADA ? [90, 90, 84] : t === T.PAREDE || t === T.JANELA || t === T.RUINA ? [120, 112, 96] : t === T.AGUA_RASA || t === T.AGUA_FUNDA ? [60, 90, 96] : t === T.GRAMA || t === T.FLORESTA ? [60, 70, 40] : t === T.MADEIRA || t === T.AZULEJO || t === T.CONCRETO || t === T.PORTA ? [100, 84, 64] : [78, 70, 54]);
    for (let i = 0; i < W * H; i++) { const o = i * 4, v = cena.seen[i]; const [r, gg, b] = v ? cor(cena.zona.tipos[i]) : [6, 6, 8]; d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = 255; }
    g.putImageData(img, 0, 0); g.fillStyle = '#e0b83a'; for (const p of cena.zona.pois) g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3); g.fillStyle = '#8fe36a'; g.fillRect(Math.round(cena.zona.jipe.x), Math.round(cena.zona.jipe.y), 3, 2); g.fillStyle = '#ff3a1a'; g.fillRect(Math.round(cena.jog.x) - 1, Math.round(cena.jog.y) - 1, 3, 3);
  }, []);
  return (
    <Cartao titulo="Mapa da zona">
      <canvas ref={ref} width={W} height={H} className="mapazona" />
      <div className="mini"><b style={{ color: '#ff3a1a' }}>■</b> você · <b style={{ color: '#8fe36a' }}>■</b> jipe · <b style={{ color: '#e0b83a' }}>■</b> locais descobertos. O resto aparece conforme você explora.</div>
    </Cartao>
  );
}
function Config() {
  const s = useJogo(), c = s.cfg, set = (k: keyof Configs, v: number | boolean | string) => { const n = { ...c, [k]: v } as Configs; useJogo.setState({ cfg: n }); gravarCfg(n); aplicarVolumes({ mestre: n.mestre, sfx: n.sfx, amb: n.amb, mus: n.mus, vibra: n.vibra, perfil: n.perfil, graves: n.graves, agudos: n.agudos }); };
  const eq = (k: 'graves' | 'agudos', nome: string) => <label className="slider">{nome}<input type="range" min={-6} max={6} step={1} value={c[k]} onChange={e => set(k, +e.target.value)} /><output>{c[k] > 0 ? '+' : ''}{c[k]}</output></label>;
  const sl = (k: 'mestre' | 'sfx' | 'amb' | 'mus', nome: string) => <label className="slider">{nome}<input type="range" min={0} max={1} step={0.05} value={c[k]} onChange={e => set(k, +e.target.value)} /><output>{Math.round(c[k] * 100)}</output></label>;
  const tg = (k: 'vibra' | 'autoMira' | 'gore' | 'canhoto' | 'fps', nome: string) => <div className="troca"><span>{nome}</span><button className={`btn peq ${c[k] ? 'aviso' : ''}`} {...p(() => set(k, !c[k]))}>{c[k] ? 'Ligado' : 'Desligado'}</button></div>;
  return (
    <Cartao titulo="Configurações">
      <div className="card aco">{sl('mestre', 'Geral')}{sl('sfx', 'Efeitos')}{sl('amb', 'Ambiente')}{sl('mus', 'Música')}</div>
      <div className="card aco"><h3>Equalizador</h3><div className="troca"><span>Perfil de som</span><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>{PERFIS_ORDEM.map(k => <button key={k} className={`btn peq ${c.perfil === k ? 'aviso' : ''}`} {...p(() => { set('perfil', k); sfx.teste(); })}>{PERFIS[k].nome}</button>)}</div></div><div className="mini">{PERFIS[c.perfil]?.desc}</div>{eq('graves', 'Graves (dB)')}{eq('agudos', 'Agudos (dB)')}<div className="troca"><span>Ouvir o resultado</span><button className="btn peq" {...p(() => sfx.teste())}>Testar som</button></div></div>
      <div className="card aco"><div className="troca"><span>Controle</span><div style={{ display: 'flex', gap: 5 }}>{([['toque', 'Uma mão'], ['manche', 'Duas mãos']] as const).map(([v, n]) => <button key={v} className={`btn peq ${c.controle === v ? 'aviso' : ''}`} {...p(() => set('controle', v))}>{n}</button>)}</div></div>{tg('vibra', 'Vibração')}{tg('autoMira', 'Mira automática')}{tg('gore', 'Sangue e membros')}{tg('canhoto', 'Modo canhoto')}{tg('fps', 'Mostrar FPS')}
        <div className="troca"><span>Tamanho da interface</span><div style={{ display: 'flex', gap: 5 }}>{[0.85, 1, 1.2].map(v => <button key={v} className={`btn peq ${c.ui === v ? 'aviso' : ''}`} {...p(() => set('ui', v))}>{v === 0.85 ? 'P' : v === 1 ? 'M' : 'G'}</button>)}</div></div>
        <div className="troca"><span>Densidade de pixels (reinicia a run)</span><div style={{ display: 'flex', gap: 5 }}>{([[1, 'Ultra'], [1.5, 'Alta'], [2, 'Média'], [3, 'Leve']] as const).map(([v, n]) => <button key={v} className={`btn peq ${c.escala === v ? 'aviso' : ''}`} {...p(() => set('escala', v))}>{n}</button>)}</div></div>
        <div className="troca"><span>Tela cheia</span><button className="btn peq" {...p(() => { try { void document.documentElement.requestFullscreen?.(); } catch { /* */ } })}>Ativar</button></div>
      </div>
    </Cartao>
  );
}
function Pausa() {
  const s = useJogo();
  return (
    <Cartao titulo="Pausa">
      <button className="btn grande aviso" {...p(fechar)}>Continuar</button>
      <button className="btn grande" {...p(() => useJogo.setState({ painel: 'inv' }))}>Mochila</button>
      <button className="btn grande" {...p(() => useJogo.setState({ painel: 'diario' }))}>Diário e objetivos</button>
      <button className="btn grande" {...p(() => useJogo.setState({ painel: 'config' }))}>Configurações</button>
      <button className="btn grande perigo" {...p(() => { ponte.cmd?.salvar(); useJogo.setState({ painel: null, tela: 'menu' }); })}>Salvar e sair</button>
      <div className="mini" style={{ textAlign: 'center' }}>{horaStr(s.minutos)} · {s.zonaNome}. A run é salva sozinha a cada 30 s.</div>
    </Cartao>
  );
}

export default function Paineis() {
  const painel = useJogo(s => s.painel);
  switch (painel) {
    case 'inv': return <Mochila />; case 'craft': return <Bancada />; case 'bau': return <Bau />; case 'cozinha': return <Cozinha />; case 'dormir': return <Dormir />;
    case 'mapa': return <Mapa />; case 'mapaZona': return <MapaZona />; case 'diario': return <Diario />; case 'config': return <Config />; case 'pausa': return <Pausa />;
    case 'perk': return <PerkPainel />; case 'melhorias': return <Melhorias />; case 'evento': return <EventoPainel />; case 'ajuda': return <Ajuda />; case 'intro': return <Intro />; case 'dialogo': return <PainelNpc />; case 'nota': return <PainelNota />;
    default: return null;
  }
}
export { Config };
void armaDe;
