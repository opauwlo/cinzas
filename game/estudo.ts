// MODO ESTUDO (?estudo=1): reproduz, de propósito, técnicas de manipulação de engajamento/monetização
// para uma reportagem sobre como é fácil e arriscado. Regras deste módulo:
//  - nenhuma cobrança existe: não há pagamento no código; gemas são só um número local;
//  - tudo que é manipulado é registrado com "o que mostramos" x "o que era verdade";
//  - a tela de Revelação sempre explica e encerra o experimento.
export type Manip = { tecnica: string; mostrado: string; real: string; porque: string };

export function estudoAtivo(): boolean {
  try {
    const u = new URL(location.href);
    const q = u.searchParams.get('estudo');
    if (q === '1') localStorage.setItem('cinzas.estudo', '1');
    if (q === '0') localStorage.removeItem('cinzas.estudo');
    return localStorage.getItem('cinzas.estudo') === '1';
  } catch { return false; }
}

const log: Manip[] = [];
export const manipulacoes = (): Manip[] => log;
export function registrar(m: Manip) { if (!log.some(x => x.tecnica === m.tecnica)) log.push(m); }

export const CUSTO_REVIVER = 50;
export const PACOTES = [
  { id: 'p', nome: 'Punhado', gemas: 60, preco: 'R$ 4,90' },
  { id: 'c', nome: 'Cofre do Abrigo', gemas: 420, preco: 'R$ 14,90', destaque: true },
  { id: 'a', nome: 'Arsenal', gemas: 1500, preco: 'R$ 29,90', de: 'R$ 74,90' },
];

/** QUASE-VITÓRIA FABRICADA: um número de "passos que faltaram" inventado a partir da hora da morte. */
export function quaseLa(distRealM: number): number {
  const falso = 3 + (Math.floor(Date.now() / 1000) % 9);
  registrar({
    tecnica: 'Quase-vitória fabricada',
    mostrado: `“Faltaram só ${falso} passos para o abrigo!”`,
    real: `Você estava a ${distRealM} m do abrigo. O número mostrado foi inventado na hora da morte.`,
    porque: 'Estar “quase lá” gera frustração e arrependimento; o cérebro quer fechar a lacuna e a oferta de reviver aparece no pico desse desconforto.',
  });
  return falso;
}
export function provaSocialFalsa(): string {
  registrar({
    tecnica: 'Prova social inventada',
    mostrado: '“87% dos sobreviventes reviveram neste ponto”',
    real: 'Não existe base de dados de jogadores. O número é uma constante no código.',
    porque: 'Decisões sob incerteza copiam a maioria. Um “consenso” fictício reduz a hesitação.',
  });
  return '87% dos sobreviventes reviveram neste ponto';
}
/** CRONÔMETRO FALSO: reinicia sozinho quando zera. */
export function ofertaRestante(): number {
  let fim = 0;
  try { fim = Number(sessionStorage.getItem('cinzas.oferta') ?? 0); } catch { /* sem storage */ }
  let reiniciou = false;
  if (!fim || fim < Date.now()) { reiniciou = fim > 0; fim = Date.now() + (9 * 60 + 59) * 1000; try { sessionStorage.setItem('cinzas.oferta', String(fim)); } catch { /* */ } }
  registrar({
    tecnica: 'Cronômetro falso + escassez artificial',
    mostrado: '“Oferta termina em mm:ss” em coral pulsando',
    real: reiniciou ? 'O cronômetro já zerou e reiniciou sozinho nesta sessão.' : 'O cronômetro reinicia sempre que zera. A oferta nunca acaba.',
    porque: 'Prazo curto + cor quente ativam aversão à perda e cortam o tempo de comparação.',
  });
  return Math.max(0, fim - Date.now());
}
export function registrarLoja() {
  registrar({
    tecnica: 'Desconto fictício',
    mostrado: '“De R$ 74,90 por R$ 29,90 (-60%)”',
    real: 'O preço “de” nunca existiu. R$ 29,90 é o único preço.',
    porque: 'O preço inventado serve de âncora; o valor real parece uma pechincha.',
  });
  registrar({
    tecnica: 'Ancoragem de preço (3 opções)',
    mostrado: 'Três pacotes, o do meio com selo “MAIS POPULAR”',
    real: 'O selo é arbitrário. O pacote do meio foi desenhado para parecer a escolha óbvia ao lado do caro.',
    porque: 'O pacote caro faz o do meio parecer razoável (efeito isca).',
  });
}
export function registrarSequencia(dias: number) {
  registrar({
    tecnica: 'Aversão à perda (bônus diário)',
    mostrado: `“Seu bônus de ${dias} dias será PERDIDO em 03:00:00”`,
    real: 'O prazo foi inventado. A sequência só quebra se você ficar um dia inteiro sem jogar.',
    porque: 'Perder algo acumulado dói mais do que ganhar algo equivalente; o prazo curto força o retorno.',
  });
}
export const fmtMs = (ms: number) => `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
