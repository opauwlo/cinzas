'use client';
// Adaptador fino: a aba "Escuta" do Diário. Cada ficha: Disseram × Verdade × Técnica × Como descobri (o espelho do Modo Estudo).
// Verificar leva no máximo 2 toques (abrir a aba + 1 botão); o que é automático diz o que fazer para resolver sozinho.
// Regra de ouro: o texto vem de `textoFicha`, que só traz `real` e técnica depois de resolvida.
import { useState, useSyncExternalStore } from 'react';
import type { Instrumento } from '../../nucleo/contratos';
import { escuta as escutaJogo, type Escuta, type FichaEscuta } from './index';
import { textoFicha, textoRecorte, INSTRUMENTOS, COMO_RESOLVE_SOZINHO, EMISSORES, TECNICAS } from './textos';
import { AUTOMATICOS } from './verificacao';

const pare = (fn: () => void) => ({ onPointerDown: (e: React.PointerEvent) => e.stopPropagation(), onClick: (e: React.MouseEvent) => { e.stopPropagation(); fn(); } });

function Carimbo({ texto, cor, sub }: { texto: string; cor: string; sub?: boolean }) {
  return (
    <span style={{ display: 'inline-block', color: cor, border: `3px double ${cor}`, padding: sub ? '0 6px' : '1px 8px', font: `700 ${sub ? 10 : 14}px var(--f-ui)`, letterSpacing: '.12em', transform: `rotate(${sub ? 3 : -5}deg)`, opacity: 0.92, background: 'rgba(5,5,6,.35)', whiteSpace: 'nowrap', borderStyle: sub ? 'dashed' : 'double', borderWidth: sub ? 2 : 3 }}>
      {texto}
    </span>
  );
}

async function recortar(texto: string): Promise<string> {
  try { if (navigator.share) { await navigator.share({ title: 'Caderno de Escuta', text: texto }); return 'Enviado.'; } } catch (e) { if ((e as Error)?.name === 'AbortError') return ''; }
  try { await navigator.clipboard.writeText(texto); return 'Copiado. Cole onde quiser.'; } catch { return 'Segure o texto para copiar.'; }
}

function Ficha({ f, escuta, aoTriangular, custoTriangular }: { f: FichaEscuta; escuta: Escuta; aoTriangular?: (id: string) => boolean; custoTriangular: string }) {
  const tx = textoFicha(f), [aviso, setAviso] = useState(''), manuais = escuta.manuais(f.alegacaoId), recorte = textoRecorte(f);
  const usar = (i: Instrumento) => {
    if (i === 'triangular') { if (aoTriangular && !aoTriangular(f.alegacaoId)) { setAviso('Sem bateria ou sem tempo para triangular agora.'); return; } escuta.triangular(f.alegacaoId); }
    else escuta.cruzar(f.alegacaoId);
  };
  return (
    <div className="card aco" style={{ position: 'relative', boxShadow: f.estado === 'aberta' ? undefined : `inset 4px 0 0 ${tx.carimbo?.cor}` }}>
      <h3 style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><span>{tx.emissor}</span><span style={{ color: 'var(--osso2)' }}>{tx.dia}</span></h3>
      <div className="mini"><b>Disseram:</b> {tx.disseram}</div>
      {f.estado === 'aberta' ? (
        <>
          <div className="mini" style={{ marginTop: 6 }}><b>Como checar:</b></div>
          <div className="chips">{f.caminhos.map(i => <span key={i} className="chip">{INSTRUMENTOS[i].nome} · {INSTRUMENTOS[i].custo}</span>)}</div>
          {f.caminhos.filter(i => AUTOMATICOS.includes(i)).map(i => <div key={i} className="mini" style={{ marginTop: 3 }}>{COMO_RESOLVE_SOZINHO[i]}</div>)}
          {f.caminhos.includes('cruzar') && !manuais.includes('cruzar') && <div className="mini" style={{ marginTop: 3 }}>Cruzar: ache um bilhete ou alguém que fale disso.</div>}
          {f.caminhos.includes('triangular') && !manuais.includes('triangular') && <div className="mini" style={{ marginTop: 3 }}>Triangular: só no rádio do abrigo.</div>}
          {manuais.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {manuais.map(i => <button key={i} className="btn peq aviso" {...pare(() => usar(i))}>{i === 'triangular' ? `Triangular (${custoTriangular})` : 'Cruzar com a pista'}</button>)}
            </div>
          )}
          {aviso && <div className="mini" style={{ color: 'var(--aviso2)', marginTop: 4 }}>{aviso}</div>}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', margin: '8px 0 4px' }}>
            {tx.carimbo && <Carimbo texto={tx.carimbo.texto} cor={tx.carimbo.cor} />}
            {f.nuncaFoiVer && <Carimbo texto="VOCÊ NUNCA FOI VER" cor="var(--osso2)" sub />}
          </div>
          <div className="mini"><b>Verdade:</b> {tx.real}</div>
          <div className="mini"><b>Técnica:</b> {tx.tecnica}. {tx.porque}</div>
          {tx.como && <div className="mini"><b>Como descobri:</b> {tx.como}</div>}
          {tx.nota && <div className="mini" style={{ fontStyle: 'italic', color: '#9aa0b4' }}>✎ {tx.nota}</div>}
          {recorte && f.estado !== 'verdade' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
              <button className="btn peq" {...pare(async () => setAviso(await recortar(recorte)))}>Recortar e mandar</button>
              {aviso && <span className="mini">{aviso}</span>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function CadernoPainel({ escuta = escutaJogo, aoTriangular, custoTriangular = '1 h + 1 bateria' }: { escuta?: Escuta; /** cobra o custo; devolve false se não deu */ aoTriangular?: (alegacaoId: string) => boolean; custoTriangular?: string }) {
  useSyncExternalStore(escuta.inscrever, escuta.versao, escuta.versao);
  const fichas = [...escuta.fichas()].reverse(), abertas = fichas.filter(f => f.estado === 'aberta');
  const pegas = fichas.filter(f => (f.estado === 'falso' || f.estado === 'meia') && f.comoDescobri).length, verdades = fichas.filter(f => f.estado === 'verdade').length;
  const ecos = escuta.ecos(), assin = escuta.assinaturas();
  // o dial só lista o que o Caderno já conhece (frequência aprendida): saber o horário de uma voz é conhecimento, não brinde
  const conhecidas = new Set(assin.flatMap(a => a.frequencias)), prox = escuta.noAbrigo() ? escuta.proximas(6).filter(p => conhecidas.has(p.frequencia)).slice(0, 3) : [];
  return (
    <div style={{ display: 'grid', gap: 'var(--sp3)' }}>
      <div className="grade">
        <div className="stat"><b>{abertas.length}</b><span>por verificar</span></div>
        <div className="stat"><b style={{ color: 'var(--sangue2)' }}>{pegas}</b><span>mentiras pegas</span></div>
      </div>
      {!fichas.length && <div className="card aco mini">O Caderno está vazio. No abrigo, o rádio pega: fique perto dele nos horários em que alguém transmite.</div>}
      {prox.length > 0 && <div className="card aco mini"><b>No dial (vozes que você conhece):</b> {prox.map(p => `${p.frequencia} às ${p.hora}, dia ${p.dia}`).join(' · ')}</div>}
      {ecos.length > 0 && (
        <div className="card aco">
          <h3>Ecos</h3>
          {ecos.map(e => <div key={`${e.transmissaoId}${e.para}`} className="mini">Dia {e.para}: a mesma fala do dia {e.de}, palavra por palavra. Até a tosse.</div>)}
        </div>
      )}
      {fichas.map(f => <Ficha key={f.alegacaoId} f={f} escuta={escuta} aoTriangular={aoTriangular} custoTriangular={custoTriangular} />)}
      {verdades > 0 && <div className="mini">Verdades confirmadas: <b>{verdades}</b>. Nem toda voz mente.</div>}
      {assin.length > 0 && (
        <div className="card aco">
          <h3>Assinaturas · ficam entre vidas</h3>
          {assin.map(a => (
            <div key={a.emissor} className="mini" style={{ padding: '4px 0', borderTop: '1px solid #0d0e10' }}>
              <b>{a.pegas + a.confirmadas > 0 ? EMISSORES[a.emissor].nome : `Voz em ${a.frequencias[0] ?? '?'}`}</b> · {escuta.memoria.linha(a)}
              {a.tecnicas.length > 0 && <> · pego em {a.tecnicas.map(t => `${TECNICAS[t.tecnica].nome.toLowerCase()} (vida ${t.vida})`).join(', ')}</>}
              {a.bordoes[0] && <> · bordão: “{a.bordoes[0]}”</>}
              <> · {a.pegas} mentira{a.pegas === 1 ? '' : 's'} pega{a.pegas === 1 ? '' : 's'}, {a.confirmadas} verdade{a.confirmadas === 1 ? '' : 's'}</>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
