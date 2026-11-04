// Regras de verificação da Escuta: qual instrumento resolve qual tipo de alegação, e que prova cada um exige.
// "O Geiger não mente. O rádio, sim." — o resultado de uma verificação é SEMPRE a verdade da alegação (nunca sorteado).
// Puro: sem Phaser, sem DOM.
import type { Alegacao, Instrumento, TipoAlegacao, Transmissao } from '../../nucleo/contratos';

/** a tabela-lei: instrumento → tipos de alegação que ele consegue resolver */
export const REGRAS: Readonly<Record<Instrumento, readonly TipoAlegacao[]>> = {
  geiger: ['radiacao'],
  triangular: ['local'],
  cruzar: ['conteudo', 'adesao', 'autoridade'],
  tempo: ['prazo'],
  // "ir ver": entrar na zona da alegação mostra o lugar, o que tem lá e quanta gente tem (contar fogueiras e barracas)
  ir: ['local', 'conteudo', 'adesao'],
};

/** que prova o instrumento precisa para valer (o custo de recurso, quando há, a coordenação cobra antes de chamar) */
export type Exigencia = 'repeticao' | 'visita' | 'leitura' | 'pista' | 'custo';
export const EXIGE: Readonly<Record<Instrumento, Exigencia>> = {
  tempo: 'repeticao', // a mesma transmissão voltou noutro dia com o mesmo prazo
  ir: 'visita',       // entrou na zona `alegacao.local` depois de ouvir
  geiger: 'leitura',  // leu o Geiger na zona `alegacao.local` depois de ouvir
  cruzar: 'pista',    // achou um bilhete/depoimento que fala disso (a coordenação/narrativa registra a pista)
  triangular: 'custo', // rádio do abrigo + antena: 1 h de jogo + 1 bateria (cobrado pela coordenação)
};

/** instrumentos que resolvem sozinhos, sem toque (o jogo percebe o que o jogador fez) */
export const AUTOMATICOS: readonly Instrumento[] = ['tempo', 'ir', 'geiger'];
/** toques para verificar: automático = 0; manual = abrir a aba do Caderno + 1 botão na ficha */
export const toques = (i: Instrumento) => (AUTOMATICOS.includes(i) ? 0 : 2);

/** o instrumento serve para esta alegação? (está na tabela E o autor listou como caminho) */
export const serve = (a: Alegacao, i: Instrumento) => REGRAS[i].includes(a.tipo) && a.comoVerificar.includes(i);
/** instrumentos que de fato resolvem esta alegação (a interseção que a interface oferece) */
export const caminhos = (a: Alegacao): Instrumento[] => a.comoVerificar.filter(i => REGRAS[i].includes(a.tipo));

/** contexto de prova para uma verificação */
export type Provas = {
  /** a alegação voltou ao ar noutro dia, com a mesma frase */ repetiu: boolean;
  /** entrou na zona da alegação depois de ouvir */ visitou: boolean;
  /** leu o Geiger na zona da alegação depois de ouvir */ leu: boolean;
  /** tem pista (bilhete/depoimento) registrada para esta alegação */ pista: boolean;
};
export function provado(a: Alegacao, i: Instrumento, p: Provas): boolean {
  if (!serve(a, i)) return false;
  switch (EXIGE[i]) {
    case 'repeticao': return p.repetiu;
    case 'visita': return !!a.local && p.visitou;
    case 'leitura': return !!a.local && p.leu;
    case 'pista': return p.pista;
    case 'custo': return true;
  }
}

/** problemas de autoria num catálogo (a Narrativa roda isto antes de entregar conteúdo); vazio = ok */
export function validarCatalogo(cat: readonly Transmissao[]): string[] {
  const erros: string[] = [], ids = new Set<string>(), tids = new Set<string>();
  for (const t of cat) {
    if (tids.has(t.id)) erros.push(`${t.id}: id de transmissão repetido`); tids.add(t.id);
    if (!t.falas.length) erros.push(`${t.id}: transmissão sem falas`);
    if (!t.atos.length) erros.push(`${t.id}: sem atos`);
    if (t.emissor === 'farol' && t.minuto !== undefined && t.minuto !== 400) erros.push(`${t.id}: a Farol só vai ao ar às 6h40 (minuto 400)`);
    for (const f of t.falas) if (f.alegacao && !t.alegacoes.some(a => a.id === f.alegacao)) erros.push(`${t.id}: fala cita alegação inexistente ${f.alegacao}`);
    for (const a of t.alegacoes) {
      if (ids.has(a.id)) erros.push(`${a.id}: id de alegação repetido`); ids.add(a.id);
      if (!a.comoVerificar.length) erros.push(`${a.id}: alegação sem caminho de verificação`);
      for (const i of a.comoVerificar) if (!REGRAS[i].includes(a.tipo)) erros.push(`${a.id}: ${i} não resolve alegação de ${a.tipo}`);
      if (!caminhos(a).length) erros.push(`${a.id}: nenhum instrumento listado resolve ${a.tipo}`);
      if (a.comoVerificar.some(i => EXIGE[i] === 'visita' || EXIGE[i] === 'leitura') && !a.local) erros.push(`${a.id}: ir/geiger exigem \`local\``);
      if (a.comoVerificar.includes('tempo') && a.verdade === 'verdade') erros.push(`${a.id}: a repetição só prova prazo FALSO; prazo verdadeiro precisa de outro caminho`);
      if (!a.disseram.trim() || !a.real.trim()) erros.push(`${a.id}: disseram/real vazio`);
    }
  }
  return erros;
}
