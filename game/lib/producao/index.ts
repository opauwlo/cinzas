// Lib de Produção: diagnóstico de desempenho, telemetria honesta (opt-in, 18+, local, 90 dias) e modo demo.
// API pública + ModuloJogo 'producao'. Puro (o adaptador de navegador é ./navegador.ts).
import type { ModuloJogo, Mundo } from '../../nucleo/contratos';
import { barramento as barramentoJogo, type Barramento } from '../../nucleo/barramento';
import { Medidor } from './desempenho';
import { TelemetriaLocal, armazemNavegador, configDoAmbiente } from './telemetria';
import { lerModoDemo } from './demo';
import { lerAparelho, type Aparelho } from './aparelho';

export { Medidor, percentil, veredito, TRAVADA_MS, type ResumoCompleto } from './desempenho';
export { TelemetriaLocal, armazemMemoria, armazemNavegador, configDoAmbiente, MAX_EVENTOS, RETENCAO_DIAS, CHAVE as CHAVE_TELEMETRIA, type Armazem, type Idade } from './telemetria';
export { lerModoDemo, localLiberado, objetivoLiberado, encerraDemo, motivoBloqueio, DEMO_ATO_I, DEMO_DESLIGADA, ORDEM_ATO_I, MENSAGEM_FIM_DEMO } from './demo';
export { resumirUA, rotuloGpu, aparelhoCurto, lerAparelho, type Aparelho } from './aparelho';
export { cadernoDosDados, linhaEvento, type FichaDados } from './oquemedimos';

/** medidor do Diag (janela longa, ~34 s a 60 fps) e o da telemetria (zerado a cada relatório de 1 min) */
export const medidor = new Medidor(2048);
const janela = new Medidor(4096);
/** entrada única de quadros (chamada pelo rAF de navegador.ts) */
export function quadro(dtMs: number) { medidor.quadro(dtMs); janela.quadro(dtMs); }

let tel: TelemetriaLocal | null = null;
/** a telemetria do jogo (criada na primeira vez que alguém pede; lê o localStorage só então) */
export function telemetria(): TelemetriaLocal { return (tel ??= new TelemetriaLocal(armazemNavegador(), () => Date.now(), configDoAmbiente())); }
/** para testes e para a tela de Config trocar a instância */
export function definirTelemetria(t: TelemetriaLocal) { tel = t; }

export const modoDemo = lerModoDemo();

// ---- sessão: o relógio é o de parede (Date.now), não o do jogo; pausar o app conta como fim de trecho
let inicioSessao = 0, acumuladoSeg = 0;
const agoraSeg = () => (inicioSessao ? (Date.now() - inicioSessao) / 1000 : 0);
const segSessao = () => Math.round(acumuladoSeg + agoraSeg());
export function encerrarSessao() { if (!inicioSessao) return; acumuladoSeg += agoraSeg(); inicioSessao = 0; telemetria().registrar('sessao_duracao', { seg: Math.round(acumuladoSeg) }); }
export function retomarSessao() { if (!inicioSessao) inicioSessao = Date.now(); }

export type OpcoesModulo = { tel?: () => TelemetriaLocal; bus?: Barramento; aparelho?: () => Aparelho; intervaloSeg?: number; janela?: Medidor };

/** cria o módulo (os testes injetam telemetria, barramento e aparelho) */
export function criarModuloProducao(o: OpcoesModulo = {}): ModuloJogo & { desligar(): void } {
  const T = o.tel ?? telemetria, bus = o.bus ?? barramentoJogo, intervalo = o.intervaloSeg ?? 60, J = o.janela ?? janela;
  let inscrito: (() => void)[] = [], bioma = '', ato = 0, acc = 0, primeiraVez = true;
  const inscrever = () => {
    if (inscrito.length) return;
    inscrito = [
      bus.on('saque', e => { T().marco('primeiro_saque', { seg: segSessao(), raro: e.raro }); }),
      bus.on('viagem', e => { if (e.fase !== 'inicio') return; T().marco('primeira_viagem', { seg: segSessao(), para: e.para }); T().registrar('viagem', { de: e.de, para: e.para }); }),
      bus.on('morte', e => { T().marco('primeira_morte', { seg: segSessao(), causa: e.causa, bioma }); T().registrar('morte', { causa: e.causa, bioma }); }),
      bus.on('vitoria', () => { T().registrar('vitoria', { seg: segSessao() }); }),
      // canal livre: a cena emite {t:'telemetria', nome:'objetivo', dados:{id, ato}} ao concluir um passo da campanha
      bus.on('telemetria', e => { T().registrar(e.nome, { ...(e.dados ?? {}), seg: segSessao() }); }),
    ];
  };
  return {
    id: 'producao',
    iniciar(m: Mundo) {
      inscrever(); bioma = m.zona.bioma; retomarSessao();
      if (primeiraVez) {
        primeiraVez = false; ato = m.ato;
        T().marco('abertura', { demo: modoDemo.ativo });
        T().registrar('sessao_inicio', { ato: m.ato, dif: m.dif, demo: modoDemo.ativo });
        if (o.aparelho && T().consentiu()) { const a = o.aparelho(); T().registrar('aparelho', { so: a.so, navegador: a.navegador, gpu: a.gpu, nucleos: a.nucleos, memoria_gb: a.memoriaGb ?? 0, dpr: a.dpr, tela: a.tela, webgl: a.webgl }); }
      }
    },
    tick(dt: number, m: Mundo) {
      if (m.ato !== ato) { ato = m.ato; T().registrar('ato', { ato, seg: segSessao() }); }
      acc += dt; if (acc < intervalo) return; acc = 0;
      const r = J.resumo(); J.zerar();
      if (r.amostras) T().registrar('desempenho', { fps: r.fps, p50: r.p50ms, p95: r.p95ms, pior: r.piorMs, travadas: r.travadas, quadros: r.amostras, bioma: m.zona.bioma });
    },
    desligar() { for (const f of inscrito) f(); inscrito = []; },
  };
}

/** o módulo que a coordenação registra em game/nucleo/modulos.ts */
let apar: Aparelho | null = null;
export const moduloProducao = criarModuloProducao({ aparelho: () => (apar ??= lerAparelho()) });
