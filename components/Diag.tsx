'use client';
// Diagnóstico de campo (?diag=1) e a tela "O que medimos" (para a Config). Só depende de game/lib/producao.
// Ligar o Diag: ?diag=1 (fica lembrado; ?diag=0 desliga), #diag, ou segurar 4 dedos na tela por 2 s
// (o link do artifact não aceita parâmetro na URL; 3 dedos não: no Motorola é o atalho de captura de tela).
import { useEffect, useMemo, useRef, useState } from 'react';
import { medidor, veredito, telemetria, modoDemo, lerAparelho, cadernoDosDados, linhaEvento, CHAVE_TELEMETRIA, type Aparelho, type ResumoCompleto } from '../game/lib/producao';
import { lerDicas } from '../game/lib/producao/aparelho';
import { relatorioTexto } from '../game/lib/producao/relatorio';
import { medirQuadros, observarToque, memoriaJs, memoriaTexturas } from '../game/lib/producao/navegador';

const CHAVE_DIAG = 'cinzas.diag';
const toque = (fn: () => void) => ({ onPointerDown: (e: React.PointerEvent) => e.stopPropagation(), onClick: (e: React.MouseEvent) => { e.stopPropagation(); fn(); } });

function diagPedido(): boolean {
  try {
    const u = new URL(location.href), q = u.searchParams.get('diag');
    if (q === '1') localStorage.setItem(CHAVE_DIAG, '1');
    if (q === '0') localStorage.removeItem(CHAVE_DIAG);
    return q === '1' || u.hash === '#diag' || localStorage.getItem(CHAVE_DIAG) === '1';
  } catch { return false; }
}
function lembrar(sim: boolean) { try { if (sim) localStorage.setItem(CHAVE_DIAG, '1'); else localStorage.removeItem(CHAVE_DIAG); } catch { /* sem armazenamento */ } }

/** copia; se o navegador recusar (artifact, http), devolve false e a tela mostra o texto selecionável */
async function copiar(texto: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(texto); return true; } catch { return false; }
}

type Jogo = { store?: { getState(): { zonaNome?: string; cfg?: { escala?: number } } } };
const lerJogo = () => { try { const s = (window as unknown as { __cinzas?: Jogo }).__cinzas?.store?.getState(); return { zona: s?.zonaNome, escala: s?.cfg?.escala }; } catch { return {}; } };

const caixa: React.CSSProperties = { position: 'fixed', left: 'calc(6px + var(--sl))', top: 'calc(6px + var(--st))', zIndex: 60, width: 'min(300px, calc(100vw - 12px))', padding: '6px 8px 8px', font: '17px/1.15 var(--f-hud)', color: 'var(--osso)', pointerEvents: 'auto', touchAction: 'manipulation' };
const cor = { liso: 'var(--fosf)', 'aceitável': 'var(--ambar)', pesado: 'var(--sangue2)', 'sem dados': 'var(--osso2)' } as const;

export default function Diag() {
  const [ativo, setAtivo] = useState(false);
  useEffect(() => {
    setAtivo(diagPedido());
    let timer: ReturnType<typeof setTimeout> | null = null;
    const ini = (e: TouchEvent) => { if (e.touches.length >= 4 && !timer) timer = setTimeout(() => { timer = null; setAtivo(a => { lembrar(!a); return !a; }); }, 2000); };
    const fim = (e: TouchEvent) => { if (e.touches.length < 4 && timer) { clearTimeout(timer); timer = null; } };
    window.addEventListener('touchstart', ini, { passive: true }); window.addEventListener('touchend', fim, { passive: true }); window.addEventListener('touchcancel', fim, { passive: true });
    return () => { window.removeEventListener('touchstart', ini); window.removeEventListener('touchend', fim); window.removeEventListener('touchcancel', fim); if (timer) clearTimeout(timer); };
  }, []);
  if (!ativo) return null;
  return <Painel fechar={() => { lembrar(false); setAtivo(false); }} />;
}

function Painel({ fechar }: { fechar: () => void }) {
  const [r, setR] = useState<ResumoCompleto>(() => medidor.resumo()), [inp, setInp] = useState<number | undefined>();
  const [ap, setAp] = useState<Aparelho | null>(null), [aberto, setAberto] = useState(true), [texto, setTexto] = useState(''), [aviso, setAviso] = useState('');
  const t0 = useRef(Date.now());
  useEffect(() => {
    const parar = medirQuadros(); medidor.zerar(); t0.current = Date.now();
    const a = lerAparelho(); setAp(a); void lerDicas().then(d => setAp(x => x && { ...x, modelo: d.modelo, so: d.versaoSo && x.so.startsWith('Android') ? `Android ${d.versaoSo}` : x.so }));
    observarToque(setInp);
    const iv = setInterval(() => setR(medidor.resumo()), 500);
    return () => { clearInterval(iv); parar(); };
  }, []);
  const v = veredito(r), mem = memoriaJs(), tex = memoriaTexturas();
  const relatorio = () => relatorioTexto({ quando: new Date(), resumo: medidor.resumo(), aparelho: ap ?? lerAparelho(), inpMs: inp, memJs: memoriaJs(), texturas: memoriaTexturas(), demo: modoDemo.ativo, segundos: Math.round((Date.now() - t0.current) / 1000), ...lerJogo() });
  const aoCopiar = async () => { const t = relatorio(); if (await copiar(t)) { setAviso('Copiado. Cole no chat.'); setTexto(''); } else { setAviso('O navegador não deixou copiar: segure o texto abaixo e copie.'); setTexto(t); } };

  return (
    <div className="vidro" style={caixa} role="status" aria-label="Diagnóstico de desempenho" onPointerDown={e => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, font: '700 10px var(--f-ui)', letterSpacing: '.12em', color: 'var(--aviso2)' }}>
        <span>DIAG{modoDemo.ativo ? ' · DEMO' : ''}</span>
        <span style={{ display: 'flex', gap: 4 }}>
          <button className="btn peq" style={{ height: 26 }} {...toque(() => setAberto(a => !a))}>{aberto ? '–' : '+'}</button>
          <button className="btn peq" style={{ height: 26 }} aria-label="Fechar diagnóstico" {...toque(fechar)}>×</button>
        </span>
      </div>
      <div style={{ font: '30px/1 var(--f-hud)', color: cor[v.nota], marginTop: 2 }}>{r.fps} fps <small style={{ fontSize: 17, color: 'var(--osso2)' }}>{v.nota}</small></div>
      <div>p50 <b>{r.p50ms}</b> · p95 <b style={{ color: r.p95ms >= 33 ? 'var(--sangue2)' : undefined }}>{r.p95ms}</b> · pior <b>{r.piorMs}</b> ms</div>
      {aberto && <>
        <div style={{ color: 'var(--osso2)' }}>{r.amostras} quadros · {r.travadas} travadas (≥50 ms){r.pausas ? ` · ${r.pausas} pausas` : ''}</div>
        <div>toque (INP): {inp !== undefined ? <b>{inp} ms</b> : <span style={{ color: 'var(--osso2)' }}>toque na tela</span>}</div>
        <div>memória: {mem ? `JS ${mem.usadoMb}/${mem.limiteMb} MB` : 'JS ?'} · {tex ? `texturas ~${tex.mb} MB (${tex.texturas})` : 'texturas ?'}</div>
        {ap && <div style={{ color: 'var(--osso2)', wordBreak: 'break-word' }}>{ap.modelo ? ap.modelo + ' · ' : ''}{ap.so} · {ap.navegador}<br />{ap.gpu} · webgl {ap.webgl || 'não'}{ap.maxTextura ? ` · tex ${ap.maxTextura}` : ''}<br />{ap.nucleos} núcleos{ap.memoriaGb ? ` · ${ap.memoriaGb} GB` : ''} · {ap.tela} @{ap.dpr}x</div>}
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button className="btn peq aviso" style={{ flex: 1 }} {...toque(() => void aoCopiar())}>Copiar relatório</button>
          <button className="btn peq" {...toque(() => { medidor.zerar(); t0.current = Date.now(); setR(medidor.resumo()); })}>Zerar</button>
        </div>
        {aviso && <div style={{ color: 'var(--fosf)', marginTop: 4 }}>{aviso}</div>}
        {texto && <textarea readOnly value={texto} rows={8} onFocus={e => e.currentTarget.select()} style={{ width: '100%', marginTop: 4, font: '14px/1.2 var(--f-hud)', background: '#050506', color: 'var(--osso)', border: '2px solid var(--a3)', userSelect: 'text', WebkitUserSelect: 'text' }} />}
      </>}
    </div>
  );
}

// ================================================================ "O que medimos" — uma página do Caderno sobre os seus dados
const carimbo = (e: 'verdade' | 'falso') => ({ font: '700 11px var(--f-ui)', letterSpacing: '.14em', padding: '2px 6px', color: e === 'verdade' ? '#0b1a06' : '#fff2ee', background: e === 'verdade' ? 'var(--fosf)' : 'var(--sangue)', transform: 'rotate(-3deg)', display: 'inline-block' }) as React.CSSProperties;
function lerBruto(): string | null { try { return localStorage.getItem(CHAVE_TELEMETRIA); } catch { return null; } }

/** para montar na Config (Configurações → Seu progresso). Consentimento, idade, fichas e a lista exata do que está guardado. */
export function OQueMedimos() {
  const tel = useMemo(() => telemetria(), []), [, setN] = useState(0), atualizar = () => setN(n => n + 1);
  const [maior, setMaior] = useState(tel.idadeDeclarada() === 'adulto'), [verLista, setVerLista] = useState(false), [msg, setMsg] = useState('');
  const pararRef = useRef<(() => void) | null>(null);
  useEffect(() => () => pararRef.current?.(), []);
  const s = tel.estado(), eventos = tel.exportar();
  const fichas = cadernoDosDados({ estado: s, eventos, bruto: lerBruto(), agora: Date.now(), piorQuadroMs: medidor.resumo().piorMs });
  const ligar = () => { tel.declararIdade('adulto'); tel.definirConsentimento(true); pararRef.current ??= medirQuadros(); atualizar(); };
  const desligar = () => { tel.definirConsentimento(false); setMaior(false); atualizar(); };
  const menor = () => { tel.declararIdade('menor'); setMaior(false); atualizar(); };

  return (
    <div className="card aco">
      <h3>O que medimos</h3>
      <div className="mini">No Caderno você confere o que o rádio diz. Aqui você confere o que <b>nós</b> dizemos sobre os seus dados. Cada carimbo é calculado agora, a partir do que está de fato neste aparelho.</div>
      <div className="troca"><span>Ajudar com dados de jogo</span>
        {s.consentiu ? <button className="btn peq aviso" {...toque(desligar)}>Ligado · desligar</button>
          : <button className="btn peq" disabled={!maior} {...toque(() => { if (maior) ligar(); })}>Desligado · ligar</button>}
      </div>
      {!s.consentiu && <div className="troca"><span>Tenho 18 anos ou mais</span>
        <span style={{ display: 'flex', gap: 5 }}>
          <button className={`btn peq ${maior ? 'aviso' : ''}`} {...toque(() => setMaior(true))}>Sim</button>
          <button className={`btn peq ${s.idade === 'menor' ? 'aviso' : ''}`} {...toque(menor)}>Não</button>
        </span></div>}
      <div className="mini">Medimos só eventos do jogo (abriu, 1º saque, 1ª viagem, mortes, objetivos, tempo de sessão) e o desempenho do aparelho. Serve para tirar frustração, nunca para empurrar compra. Guardamos 90 dias.</div>
      <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
        {fichas.map(f => (
          <div key={f.id} style={{ padding: '6px 8px', background: '#0e0f11', boxShadow: 'inset 0 0 0 2px #050506' }}>
            <div className="mini"><b>Disseram:</b> “{f.disseram}”</div>
            <div className="mini" style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}><span style={carimbo(f.estado)}>{f.estado === 'verdade' ? 'VERDADE' : 'FALSO'}</span><span>{f.verdade}</span></div>
            <div className="mini" style={{ opacity: .75 }}>Como verificar: {f.comoVerificar}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        <button className="btn peq" {...toque(() => setVerLista(v => !v))}>{verLista ? 'Esconder' : `Ver os ${eventos.length} registros`}</button>
        <button className="btn peq" disabled={!eventos.length} {...toque(() => { void copiar(JSON.stringify(eventos, null, 1)).then(ok => setMsg(ok ? 'Copiado.' : 'O navegador não deixou copiar.')); })}>Copiar tudo</button>
        <button className="btn peq perigo" disabled={!s.consentiu && lerBruto() === null} {...toque(() => { tel.apagar(); setMsg('Apagado.'); atualizar(); })}>Apagar</button>
      </div>
      {msg && <div className="mini" style={{ color: 'var(--fosf)' }}>{msg}</div>}
      {verLista && <div className="mini" style={{ maxHeight: 220, overflowY: 'auto', touchAction: 'pan-y', userSelect: 'text', WebkitUserSelect: 'text' }}>{eventos.length ? eventos.map((e, i) => <div key={i}>{linhaEvento(e)}</div>) : 'Nada guardado.'}</div>}
    </div>
  );
}
