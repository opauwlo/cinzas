// Tipos próprios da narrativa (os compartilhados moram em game/nucleo/contratos.ts) e os limites do guia de estilo (roteiro §5.3).
import type { Autoria, EfeitoRadio } from '../../nucleo/contratos';

/** cada texto do catálogo tem um tipo; o tipo decide o limite de caracteres e se pode falar a língua da interface */
export type TipoTexto =
  | 'radio' // balão de rádio (fala de transmissão, linha de fita, fala em cena)
  | 'evento' // texto de evento / batida / fala da Lia fora do rádio
  | 'opcao' // opção de escolha
  | 'bilhete'
  | 'abertura' // tela de abertura, de morte ou de final
  | 'pensamento' // pensamento de Cris; linha do caderno da Lia
  | 'titulo' // título de passo, bilhete, fita, tela
  | 'interface' // requisito honesto, botão, nome de ato: é a interface falando, pode dizer "nível"
  | 'nome'; // nome próprio / rótulo de quem fala

/** máximo por tipo (o "ideal" do §5.3 fica no comentário); titulo/interface/nome não estão no §5.3: proposta desta lib */
export const LIMITES: Record<TipoTexto, number> = {
  radio: 160, // ideal 100
  evento: 140, // ideal 110
  opcao: 28, // ideal 20
  bilhete: 300, // ideal 200
  abertura: 150, // ideal 110
  pensamento: 60, // ideal 40
  titulo: 32,
  interface: 48,
  nome: 24,
};

/** tipos em que a palavra de interface é proibida (texto do mundo) */
export const TEXTO_DO_MUNDO: ReadonlySet<TipoTexto> = new Set(['radio', 'evento', 'opcao', 'bilhete', 'abertura', 'pensamento', 'titulo']);

/** uma entrada do catálogo português: a chave, o texto original e o tipo */
export type EntradaTexto = { chave: string; pt: string; tipo: TipoTexto };

// ---------------------------------------------------------------- campanha
export type Passo = {
  /** id de game/dados/objetivos.ts (ou novo: 'militar') */ id: string; ato: 1 | 2 | 3 | 4;
  /** título narrativo (vai no HUD em cima) */ titulo: string;
  /** requisito honesto (vai no HUD embaixo, igual ao que o sistema mede) */ requisito: string;
  /** o que acontece na história neste passo (para a coordenação e para o roteirista; não aparece no HUD) */ batida: string;
  /** fala da Lia na base enquanto o passo está ativo */ lia?: string;
  /** pensamento de Cris ao concluir */ cris?: string;
  autoria: Autoria;
};

// ---------------------------------------------------------------- cenas ramificadas (dados próprios; ver INTEGRACAO.md)
export type Tom = 'verdade' | 'protecao' | 'silencio';
export type QuemCena = 'lia' | 'cris' | 'narradora' | 'cena';
/** uma linha de cena: `chave` do catálogo; `efeito` só para linhas de rádio */
export type LinhaCena = { quem: QuemCena; chave: string; efeito?: EfeitoRadio };
export type OpcaoCena = {
  tom: Tom; /** o que aparece no botão */ chave: string;
  /** o que Cris disse e a verdade ao lado, para a tela final "O QUE FOI DITO" */ disse: string; verdade: string;
  resposta: LinhaCena[];
};
export type Cena = {
  id: string; ato: number; /** minuto do dia (400 = 6h40) */ minuto: number; local: string;
  /** quando a coordenação dispara: descrição honesta da condição */ gatilho: string;
  /** antes do rádio */ antes: LinhaCena[];
  /** o rádio toca aqui: a Farol do dia (pela Programacao da Escuta) e, por cima, estas interferências (ids de TRANSMISSOES) */
  radio: { farolDoDia: boolean; interferencias: string[] };
  /** depois do rádio, antes da escolha */ depois: LinhaCena[];
  escolha: { id: string; pergunta: string; opcoes: OpcaoCena[] };
  /** depois de qualquer resposta */ fecho: LinhaCena[];
  autoria: Autoria;
};
/** o que fica registrado de uma escolha (para o save e para "O QUE FOI DITO") */
export type RegistroEscolha = { escolha: string; tom: Tom; disse: string; verdade: string; dia: number };
