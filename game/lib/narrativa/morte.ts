// Tela de morte "Não foi assim" (Normal e Brutal) e a variante do Calmo (sem morte permanente). Puro.
// Quem fala é a narradora escondida: a Lia adulta se recusa a contar a morte e "corrige" a história.
// Isso é personagem mentindo (por amor), não a interface: o resumo da run embaixo continua com os números reais.
import type { Traduzir } from '../../nucleo/contratos';
import type { EntradaTexto } from './tipos';

export type CausaMorte = 'sede' | 'fome' | 'sangue' | 'radiacao' | 'criaturas' | 'outra';
/** o que o Caderno já sabe (persiste entre vidas); a narradora reconhece o mais avançado */
export type Saber = 'loop' | 'caminhao' | 'limite';

/** traduz as causas que a cena emite hoje ("Morreu de sede", "Envenenado pela radiação"…) */
export function causaDe(texto: string): CausaMorte {
  const s = texto.toLowerCase();
  if (s.includes('sede')) return 'sede';
  if (s.includes('fome')) return 'fome';
  if (s.includes('sangr')) return 'sangue';
  if (s.includes('radia')) return 'radiacao';
  if (s.includes('criatura') || s.includes('ermo')) return 'criaturas';
  return 'outra';
}

export const TEXTOS_MORTE: EntradaTexto[] = [
  { chave: 'morte.titulo', pt: 'NÃO FOI ASSIM', tipo: 'titulo' },
  { chave: 'morte.abre', pt: 'Não. Não foi assim que aconteceu. Deixa eu contar de novo.', tipo: 'abertura' },
  { chave: 'morte.causa.sede', pt: 'Sede, não. {O|A} Cris sempre guardava um gole pra volta.', tipo: 'abertura' },
  { chave: 'morte.causa.fome', pt: 'De fome? Logo {o|a} Cris, que dividia tudo em duas metades.', tipo: 'abertura' },
  { chave: 'morte.causa.sangue', pt: 'Você amarrou o pano a tempo. A mãe tinha ensinado, lembra?', tipo: 'abertura' },
  { chave: 'morte.causa.radiacao', pt: 'Você não ficou tanto tempo perto do brilho. Eu lembraria.', tipo: 'abertura' },
  { chave: 'morte.causa.criaturas', pt: 'Eles não te alcançaram. Você ouviu o radinho deles antes.', tipo: 'abertura' },
  { chave: 'morte.causa.outra', pt: 'Você voltou pra casa naquela noite. Eu lembro do barulho do jipe.', tipo: 'abertura' },
  { chave: 'morte.contagem', pt: '{n:Já contei essa parte errado uma vez.|Já contei essa parte errado # vezes.}', tipo: 'abertura' },
  { chave: 'morte.sabe.loop', pt: 'Dessa vez você já sabia da semana que se repete.', tipo: 'abertura' },
  { chave: 'morte.sabe.caminhao', pt: 'Dessa vez você já sabia do caminhão.', tipo: 'abertura' },
  { chave: 'morte.sabe.limite', pt: 'Dessa vez você já sabia do sessenta.', tipo: 'abertura' },
  { chave: 'morte.botao', pt: 'Contar de novo', tipo: 'opcao' },
  { chave: 'morte.calmo.titulo', pt: 'DE VOLTA AO ABRIGO', tipo: 'titulo' },
  { chave: 'morte.calmo.texto', pt: 'Você acordou no abrigo. A Lia deixou o rádio ligado, alto, pra você achar o caminho de volta.', tipo: 'abertura' },
  { chave: 'morte.calmo.botao', pt: 'Levantar', tipo: 'opcao' },
];

export type TelaMorte = { titulo: string; linhas: string[]; botao: string };
export type EntradaMorte = { /** 0 Calmo, 1 Normal, 2 Brutal */ dif: number; causa: string; /** mortes nesta campanha, contando esta (1..) */ mortes: number; sabe?: readonly Saber[] };

/** o texto da tela (o resumo numérico da run continua por conta do componente, sem mudança) */
export function telaMorte(t: Traduzir, e: EntradaMorte): TelaMorte {
  if (e.dif === 0) return { titulo: t('morte.calmo.titulo'), linhas: [t('morte.calmo.texto')], botao: t('morte.calmo.botao') };
  const linhas = [t('morte.abre'), t(`morte.causa.${causaDe(e.causa)}`)];
  const anteriores = e.mortes - 1;
  if (anteriores >= 1) linhas.push(t('morte.contagem', { n: anteriores }));
  const sabe = (['limite', 'caminhao', 'loop'] as const).find(s => e.sabe?.includes(s));
  if (sabe) linhas.push(t(`morte.sabe.${sabe}`));
  return { titulo: t('morte.titulo'), linhas, botao: t('morte.botao') };
}
