'use client';
import { useEffect, useState } from 'react';
import { useJogo, lerMeta, gravarMeta, registrarDia, hoje, horaStr } from '../game/store';
import { lerRun } from '../game/sistemas/salvar';
import { localPorId } from '../game/dados/locais';
import { OBJETIVOS, ATOS } from '../game/dados/objetivos';
import { DIF_NOMES } from '../game/sistemas/progresso';
import { estudoAtivo, registrarSequencia, fmtMs } from '../game/estudo';
import { p, Cartao } from './Cartao';
import ArteMenu from './ArteMenu';
import { EstadoApp } from './EstadoApp';
import { iniciarMenu } from '../game/audio';
import Ico, { ic } from './Ico';

export default function Menu({ onJogar }: { onJogar: (nova: boolean) => void | Promise<void> }) {
  const [meta, setMeta] = useState(lerMeta), [dif, setDif] = useState(0), [estudo, setEstudo] = useState(false);
  const [fake, setFake] = useState(10800000), [toques, setToques] = useState(0), [confirma, setConfirma] = useState(false);
  const [preparando, setPreparando] = useState(false), [erro, setErro] = useState('');
  const temSave = useJogo(s => s.temSave), cfg = useJogo(s => s.cfg), save = temSave ? lerRun() : null;
  const obj = OBJETIVOS[Math.min(save?.objIdx ?? 0, OBJETIVOS.length - 1)];
  useEffect(() => { const m = registrarDia(); setMeta(m); setDif(m.dif); const e = estudoAtivo(); setEstudo(e); if (e) registrarSequencia(m.sequencia); }, []);
  useEffect(() => { if (!estudo) return; const t = setInterval(() => setFake(v => Math.max(0, v - 1000)), 1000); return () => clearInterval(t); }, [estudo]);
  const iniciar = async (nova: boolean) => {
    if (preparando) return;
    setPreparando(true); setErro('');
    try { await onJogar(nova); } catch { setErro('Não foi possível iniciar. Tente novamente; seu progresso foi preservado.'); setPreparando(false); }
  };
  const alternar = () => {
    setToques(toques + 1); if (toques < 6) return; setToques(0);
    try { if (estudo) localStorage.removeItem('cinzas.estudo'); else localStorage.setItem('cinzas.estudo', '1'); setEstudo(!estudo); } catch { setErro('O armazenamento está indisponível neste navegador.'); }
  };
  return <main className="tela menu-app" onPointerDown={() => void iniciarMenu()}>
    <div className="menu-topo"><span className="marca-sinal"><i /> TRANSMISSÃO 07</span><span>SOBREVIVÊNCIA SOLO</span></div>
    <header className="menu-hero">
      <ArteMenu />
      <div className="hero-texto"><span className="sobretitulo">DEPOIS DO ÚLTIMO CLARÃO</span><h1 className="titulo" onPointerDown={alternar}>CINZAS</h1><p>O mundo acabou em luz.<br />O que vem depois depende de você.</p></div>
      <span className="hero-coord">23°33′ S · ZONA DE EXCLUSÃO</span>
    </header>
    <div className="menu-conteudo">
      <section className="menu-missao" aria-label="Sua jornada">
        <div className="secao-rotulo"><span>{save ? ATOS[obj.ato] : 'SEU PRIMEIRO SINAL'}</span><span>{save ? `DIA ${Math.floor(save.minutos / 1440) + 1} · ${horaStr(save.minutos)}` : 'ABRIGO → ERMO → ABRIGO 7'}</span></div>
        <h2>{save ? localPorId(save.zonaId).nome : 'Ainda há um lugar seguro.'}</h2>
        <p>{save ? obj.titulo : 'Erga seu abrigo. Explore as ruínas. Encontre o rádio e siga o sinal do Abrigo 7.'}</p>
        {save && <><div className="campanha-trilha" aria-label={`${save.objIdx} de ${OBJETIVOS.length} objetivos concluídos`}>{[1, 2, 3, 4].map(n => <i key={n} className={n <= obj.ato ? 'on' : ''} />)}</div><div className="mini">Nível {save.nivel ?? 1} · Vida {Math.ceil(save.hp)}/{save.maxHp} · {DIF_NOMES[save.dif ?? 1]}</div></>}
      </section>
      <div className="menu-acoes">
        <button className="btn aviso grande iniciar" disabled={preparando} {...p(() => void iniciar(!save))}><span>{preparando ? 'Preparando o mundo…' : save ? 'Continuar jornada' : 'Sobreviver'}</span><span aria-hidden="true">↗</span></button>
        <span className="menu-legenda">{save ? 'Seu mundo. Exatamente de onde você parou.' : 'Campanha em 4 atos · progresso salvo neste aparelho'}</span>
        {save && <button className="link" disabled={preparando} {...p(() => setConfirma(true))}>Iniciar nova jornada</button>}
      </div>
      {!save && <fieldset className="menu-dificuldade"><legend>O ritmo da sua jornada</legend><div className="dificuldades">{DIF_NOMES.map((nome, i) => <button key={nome} aria-pressed={dif === i} className={`btn ${dif === i ? 'escolhido' : ''}`} {...p(() => { setDif(i); const m = lerMeta(); m.dif = i; gravarMeta(m); })}>{nome}</button>)}</div><p>{['Explore com calma. Ao cair, você volta ao abrigo e perde parte dos itens.', 'Recursos contados e ameaças reais. A morte encerra a jornada.', 'Mais pressão e inimigos. Morte permanente, com XP extra.'][dif]}</p></fieldset>}
      <nav className="menu-nav" aria-label="Menu principal">
        <button className="btn" {...p(() => useJogo.setState({ painel: 'ajuda' }))}><Ico src={ic('delapouite', 'walkie-talkie')} n={20} />Como jogar</button>
        <button className="btn" {...p(() => useJogo.setState({ painel: 'config' }))}><Ico src={ic('lorc', 'gears')} n={20} />Configurações</button>
      </nav>
      <div className="menu-controle"><span aria-hidden="true">⌖</span><p>{cfg.controle === 'toque' ? 'Jogue com uma mão. Toque para andar, buscar e interagir. O combate próximo é automático.' : 'Jogue com duas mãos. Manche para mover; toque ou segure o botão vermelho para atacar.'}</p></div>
      <details className="mundo-diario"><summary>Mundo de hoje <span>{hoje()}</span></summary><p>A data define o mapa e o saque inicial. {meta.sequencia >= 3 ? 'Seu bônus de sequência está ativo: 1 kit médico extra.' : `Sequência: ${meta.sequencia} dia(s). Com 3 dias, ganhe 1 kit médico inicial.`}</p>{meta.runs > 0 && <p>{meta.runs} jornadas · {meta.vitorias} vitórias · {meta.conquistas.length} conquistas</p>}</details>
      {estudo && <div className="card aco degrau"><span className="mini">Modo Estudo · bônus da sequência</span><div className="timer">{fmtMs(fake)}</div></div>}
      <EstadoApp />
      {erro && <p role="alert" className="erro-app">{erro}</p>}
      <footer className="menu-rodape"><span>CINZAS · v0.2</span><button className="link" {...p(() => useJogo.setState({ tela: 'creditos' }))}>Créditos e licenças</button></footer>
    </div>
    {confirma && <Cartao titulo="Uma nova jornada" fixo><p>O progresso da partida atual será substituído. Suas conquistas e recordes continuam com você.</p><button className="btn grande perigo" disabled={preparando} {...p(() => void iniciar(true))}>Apagar partida e começar</button><button className="btn grande" {...p(() => setConfirma(false))}>Manter minha jornada</button></Cartao>}
  </main>;
}
