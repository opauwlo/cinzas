// As 6 telas de abertura (substituem PASSOS_INTRO em game/dados/meta.ts). Puro.
// A tela 1 é a narradora escondida (a Lia adulta, no rádio): só se paga no final ("Aqui é a Lia, na Farol").
// "O mundo acabou em luz." sai daqui e fica no menu, como chamada.
import type { Traduzir } from '../../nucleo/contratos';
import type { EntradaTexto } from './tipos';

export const ABERTURA_PT = [
  'Deixa eu contar do começo.',
  '14 de maio, 6h40. São Paulo inteira parada no trânsito, ouvindo a mesma voz.',
  'Ela disse: "Evitem o Centro." Um segundo depois, não havia mais Centro.',
  'Quase dois anos depois, a voz ainda fala. Todo dia, às 6h40, ela diz que no Abrigo 7 tem lugar.',
  'Você tem um jipe com o tanque quase seco, um rádio que pega quando quer e uma irmã de nove anos que acredita em tudo o que ele diz.',
  'Vocês vão para o norte.',
] as const;
export const CHAMADA_MENU_PT = 'O mundo acabou em luz.';

export const TEXTOS_ABERTURA: EntradaTexto[] = [
  ...ABERTURA_PT.map((pt, i) => ({ chave: `abertura.${i + 1}`, pt, tipo: 'abertura' as const })),
  { chave: 'menu.chamada', pt: CHAMADA_MENU_PT, tipo: 'abertura' },
];

/** as telas no idioma do tradutor, prontas para o componente de abertura */
export const telasAbertura = (t: Traduzir) => ABERTURA_PT.map((_, i) => t(`abertura.${i + 1}`));
