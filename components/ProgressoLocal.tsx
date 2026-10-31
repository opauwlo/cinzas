'use client';
import { useRef, useState } from 'react';
import { useJogo } from '../game/store';
import { ponte } from '../game/ponte';
import { lerRun, salvarRun, exportarRun, importarRun, type Run } from '../game/sistemas/salvar';
import { p } from './Cartao';

export default function ProgressoLocal() {
  const arquivo = useRef<HTMLInputElement>(null), [msg, setMsg] = useState(''), [copia, setCopia] = useState<Run | null>(null);
  const tela = useJogo(s => s.tela), temSave = useJogo(s => s.temSave);
  const exportar = () => {
    if (tela === 'jogo') ponte.cmd?.salvar();
    const run = lerRun();
    if (!run) { setMsg('Nenhuma partida salva para exportar.'); return; }
    const url = URL.createObjectURL(new Blob([exportarRun(run)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `cinzas-${run.seed}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000); setMsg('Cópia preparada para baixar. Guarde o arquivo para recuperar a jornada.');
  };
  return <section className="card aco"><h3>Seu progresso</h3><p className="mini">O salvamento fica neste navegador. Exporte uma cópia antes de trocar de aparelho ou limpar os dados do app.</p>
    <div className="bt2"><button className="btn" disabled={!temSave} {...p(exportar)}>Exportar partida</button><button className="btn" disabled={tela === 'jogo'} {...p(() => arquivo.current?.click())}>Importar cópia</button></div>
    {tela === 'jogo' && <p className="mini">Para restaurar outra partida, salve e saia para o menu.</p>}
    <input ref={arquivo} type="file" accept="application/json,.json" hidden onChange={async e => {
      const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
      if (file.size > 5000000) { setMsg('Arquivo muito grande. Escolha uma cópia do CINZAS.'); return; }
      try { const r = importarRun(await file.text()); if (!r) { setMsg('Cópia inválida ou incompatível. Sua partida atual foi mantida.'); return; } setCopia(r); setMsg(''); } catch { setMsg('Não foi possível ler o arquivo. Sua partida atual foi mantida.'); }
    }} />
    {copia && <div className="card aco"><p className="mini">Restaurar dia {Math.floor(copia.minutos / 1440) + 1}, nível {copia.nivel ?? 1}? A partida atual será substituída.</p><div className="bt2"><button className="btn perigo" {...p(() => { if (salvarRun(copia)) { useJogo.setState({ temSave: true }); setMsg('Partida restaurada. Feche as configurações e toque em Continuar.'); setCopia(null); } else setMsg('Não foi possível gravar. Verifique o espaço disponível.'); })}>Restaurar partida</button><button className="btn" {...p(() => setCopia(null))}>Cancelar</button></div></div>}
    {msg && <p className="mini" role="status">{msg}</p>}
  </section>;
}
