// MOMENTO AUTORAL: o caderno da Lia. Puro.
// A Lia, 9 anos, anota num caderno de escola tudo o que a Íris diz, com um ✓ ao lado (porque "ela nunca erra"), e também o que
// Cris responde. É o Caderno de Escuta do jogador visto por uma criança que acredita: a mesma tabela "disseram × verdade",
// só que a coluna da verdade é preenchida com fé. Três coisas que só este jogo tem:
//  1. É ela quem descobre o loop, com DADOS REAIS da run: se ouviu o programa da tosse em dois dias de jogo, a página mostra os dois
//     números de dia de verdade ("Dia 4: tosse. Dia 11: tosse. IGUAL."). O sistema não inventa a pista: ela só aparece se aconteceu.
//  2. As respostas de Cris entram no caderno dela com a mesma marcação que ela dá à Íris. O jogador lê a própria frase ao lado
//     da frase da voz, na letra de uma criança — antes de saber que a tela final vai fazer o mesmo.
//  3. No fim, a narradora ("Deixa eu contar do começo") se revela lendo deste caderno: "Eu anotava tudo. Ainda anoto."
// Os desenhos na parede (decalques da Arte) mudam por ato e reagem à escolha 1.
import type { Traduzir } from '../../nucleo/contratos';
import { PROGRAMA_FAROL } from './transmissoes';
import type { EntradaTexto, RegistroEscolha, Tom } from './tipos';

export const TEXTOS_CADERNO_LIA: EntradaTexto[] = [
  { chave: 'lia.caderno.titulo', pt: 'O QUE A ÍRIS DISSE', tipo: 'titulo' },
  { chave: 'lia.caderno.1.lugar', pt: 'A Íris disse: tem lugar. ✓', tipo: 'pensamento' },
  { chave: 'lia.caderno.1.medico', pt: 'A Íris disse: tem médico. ✓✓', tipo: 'pensamento' },
  { chave: 'lia.caderno.1.ermo', pt: 'A Íris disse: o Ermo tá calmo. TAVA! ✓', tipo: 'pensamento' },
  { chave: 'lia.caderno.cris.verdade', pt: 'Cris disse: a gente vai ver. (?)', tipo: 'pensamento' },
  { chave: 'lia.caderno.cris.protecao', pt: 'Cris disse: viu. ✓', tipo: 'pensamento' },
  { chave: 'lia.caderno.cris.silencio', pt: 'Cris não disse nada. Perguntar de novo.', tipo: 'pensamento' },
  { chave: 'lia.caderno.2.tosse1', pt: 'Dia {a}: a Íris tossiu. Coitada.', tipo: 'pensamento' },
  { chave: 'lia.caderno.2.tosse2', pt: 'Dia {a}: tosse. Dia {b}: tosse. IGUAL.', tipo: 'pensamento' },
  { chave: 'lia.caderno.2.pergunta', pt: 'Perguntar pra Íris por que ela repete.', tipo: 'pensamento' },
  { chave: 'lia.caderno.2.sem', pt: 'Hoje o rádio não pegou. Escrevi de memória.', tipo: 'pensamento' },
  { chave: 'lia.caderno.3', pt: 'A mãe ouvia a Íris também?', tipo: 'pensamento' },
  { chave: 'lia.caderno.4', pt: 'Lugar pra dois?', tipo: 'pensamento' },
  { chave: 'lia.caderno.fim', pt: 'Eu anotava tudo. Ainda anoto.', tipo: 'pensamento' },
  // desenhos da parede (a legenda é o que a Arte desenha; vai ao catálogo para leitura de tela e tradução)
  { chave: 'lia.parede.1', pt: '[Na parede: um jipe e um sol enorme.]', tipo: 'evento' },
  { chave: 'lia.parede.2', pt: '[Na parede: o muro, com a casa dentro feito gema de ovo.]', tipo: 'evento' },
  { chave: 'lia.parede.2.duvida', pt: '[Na parede: o muro, a casa, e um ponto de interrogação no sol do jipe.]', tipo: 'evento' },
  { chave: 'lia.parede.3', pt: '[Na parede: uma moça com um rádio na cabeça. Riscada. Desenhada de novo.]', tipo: 'evento' },
  { chave: 'lia.parede.4', pt: '[Na parede: dois bonecos no jipe, um maior. Os dois com mochila.]', tipo: 'evento' },
];

/** dias de jogo em que a Farol tocou o programa da tosse (dia 4 da semana gravada) */
const DIA_DA_TOSSE = PROGRAMA_FAROL.indexOf('farol-d4');
export const tossiuNoDia = (dia: number) => ((dia - 1) % 7 + 7) % 7 === DIA_DA_TOSSE;

export type EntradaCadernoLia = {
  ato: number;
  /** dias de jogo em que a Lia ouviu a Farol das 6h40 (a cena registra; o rádio da base também) */
  diasOuvidos: readonly number[];
  escolhas: readonly Pick<RegistroEscolha, 'escolha' | 'tom'>[];
  /** só no final: a página que a narradora lê */
  fim?: boolean;
};

/** as linhas da página aberta sobre a mesa da base (letra de criança; ≤ 60 caracteres cada) */
export function paginaCadernoLia(t: Traduzir, e: EntradaCadernoLia): string[] {
  const l: string[] = [t('lia.caderno.titulo'), t('lia.caderno.1.lugar'), t('lia.caderno.1.medico')];
  if (e.diasOuvidos.length) l.push(t('lia.caderno.1.ermo'));
  const tom1 = e.escolhas.find(x => x.escolha === 'lia1')?.tom;
  if (tom1) l.push(t(`lia.caderno.cris.${tom1}`));
  if (e.ato >= 2) {
    const tosses = [...new Set(e.diasOuvidos)].filter(tossiuNoDia).sort((a, b) => a - b);
    if (tosses.length >= 2) l.push(t('lia.caderno.2.tosse2', { a: tosses[0], b: tosses[1] }), t('lia.caderno.2.pergunta'));
    else if (tosses.length === 1) l.push(t('lia.caderno.2.tosse1', { a: tosses[0] }));
    else l.push(t('lia.caderno.2.sem'));
  }
  if (e.ato >= 3) l.push(t('lia.caderno.3'));
  if (e.ato >= 4) l.push(t('lia.caderno.4'));
  if (e.fim) l.push(t('lia.caderno.fim'));
  return l;
}

/** o desenho da parede neste ato (pedido de decalque para a Arte) */
export function desenhoParede(t: Traduzir, ato: number, tom1?: Tom): string {
  if (ato <= 1) return t('lia.parede.1');
  if (ato === 2) return t(tom1 === 'verdade' ? 'lia.parede.2.duvida' : 'lia.parede.2');
  return t(ato === 3 ? 'lia.parede.3' : 'lia.parede.4');
}
