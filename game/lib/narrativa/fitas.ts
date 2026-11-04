// As 7 fitas da Íris, gravadas fora do ar (puro). Transcrição: uma linha por balão (≤ 160), separadas por "\n";
// rubrica entre colchetes. Fitas 1–3 completas; 4–7 em esboço (marcadas em FITAS_ESBOCO), para o roteirista humano terminar.
import type { Fita } from '../../nucleo/contratos';
import type { EntradaTexto } from './tipos';

const linhas = (...l: string[]) => l.join('\n');

export const FITAS: Fita[] = [
  {
    id: 'fita1', n: 1, titulo: 'Fita 1 · O nome do cachorro', local: 'cidade', autoria: 'rascunho-ia',
    transcricao: linhas(
      '[clique · gerador ao fundo]',
      'Gravando. Isso aqui não vai ao ar. É pra mim.',
      'Dia vinte e alguma coisa. Perdi a conta quando o relógio da mesa parou.',
      'Hoje li no ar duzentos e doze nomes. Gente procurando gente.',
      'Uma mulher pediu pra eu ler o nome do cachorro dela. Eu li. Rex. Ninguém respondeu, mas eu li.',
      'O Val montou uma antena no telhado com fio de varal. Jura que pega até Jundiaí.',
      'Todo mundo que chega aqui me agradece pelo "Evitem o Centro". Eu digo de nada.',
      'Eu digo de nada.',
      '[clique]',
    ),
  },
  {
    id: 'fita2', n: 2, titulo: 'Fita 2 · O único espelho', local: 'floresta', autoria: 'rascunho-ia',
    transcricao: linhas(
      '[clique · vento · uma porta de metal bate]',
      'Abrigo 7, cabine. Trouxeram a Farol pra cá. Agora a minha janela dá pra fila.',
      'Hoje uma senhora chegou na porta e me agradeceu. Disse que andou onze dias por minha causa.',
      'Ela deu 74. Eu sorri pra ela.',
      'O cabo da catraca, o Reis, me trouxe café depois. Não falou nada. Ficou olhando a fila comigo.',
      'Me deram um papel com o que eu posso dizer. "Tem lugar" está sublinhado duas vezes.',
      'Tem lugar. Tem lugar. Eu treino no espelho do banheiro. É o único espelho que sobrou.',
      '[clique]',
    ),
  },
  {
    id: 'fita3', n: 3, titulo: 'Fita 3 · Um caminhão tombado', local: 'torre', autoria: 'rascunho-ia',
    transcricao: linhas(
      '[clique · respiração perto do microfone]',
      'Gravando? …Gravando.',
      'Todo mundo acha que eu sabia. "Evitem o Centro." Eu não sabia de nada.',
      'Às seis e trinta e nove um ouvinte ligou: caminhão tombado na 23 de Maio, sentido Centro.',
      'Eu falei o que eu falava todo dia. Evitem o Centro. Era trânsito.',
      'Quem me obedeceu viveu porque um caminhão tombou. Só isso.',
      'É só isso que eu sou. Uma moça que dava o trânsito.',
      'O Val diz que eu tenho que contar. Que a fé dessa gente em mim ainda vai matar alguém.',
      'Ele está atrasado. Já matou.',
      '[clique]',
    ),
  },
  {
    id: 'fita4', n: 4, titulo: 'Fita 4 · Permaneçam', local: 'hospital', autoria: 'rascunho-ia',
    transcricao: linhas(
      '[esboço] [clique · copa do hospital, chiado de rádio de pilha]',
      'Dia zero, nove da manhã. Um motoboy trouxe um papel da Defesa Civil. Eu li como lia o trânsito.',
      '"Equipes de saúde, permaneçam. A ajuda está a caminho." Eu nem perguntei que ajuda.',
      '[a desenvolver: Íris descobre, meses depois, quantas equipes ficaram; nunca diz o nome de ninguém]',
    ),
  },
  {
    id: 'fita5', n: 5, titulo: 'Fita 5 · Sessenta e um', local: 'pantano', autoria: 'rascunho-ia',
    transcricao: linhas(
      '[esboço] [clique]',
      'O Val não veio hoje. Deixou a chave do transmissor na mesa e um bilhete: "A Clarinha deu 61."',
      '[a desenvolver: a família devolvida; a Íris vê da janela e continua a locução; o Val vira Lume]',
    ),
  },
  {
    id: 'fita6', n: 6, titulo: 'Fita 6 · Três dias', local: 'militar', autoria: 'rascunho-ia',
    transcricao: linhas(
      '[esboço] [clique · silêncio comprido]',
      'Hoje eu li a Diretriz no ar. Inteira. Até o "não informar o limite".',
      '[a desenvolver: cortam o sinal por três dias; quando volta, ela lê o roteiro; ninguém nota a diferença]',
    ),
  },
  {
    id: 'fita7', n: 7, titulo: 'Fita 7 · A verdade', local: 'abrigo7', autoria: 'rascunho-ia',
    transcricao: linhas(
      '[esboço] [etiqueta, à mão: "A verdade. Para quando eu tiver coragem."]',
      'Se alguém estiver ouvindo esta fita: eu sei que é tarde. Não tem lugar pra todo mundo. Nunca teve.',
      'Mas tem pra alguns. Vem se estiver limpo. E se não estiver… vem mesmo assim, que eu não sei mais o que é certo.',
      '[a desenvolver: a última parte só se ouve no final, na cabine; é a escolha "Tocar a fita"]',
    ),
  },
];
export const FITAS_ESBOCO: ReadonlySet<string> = new Set(['fita4', 'fita5', 'fita6', 'fita7']);

export const TEXTOS_FITAS: EntradaTexto[] = FITAS.flatMap(f => [
  { chave: `fita.${f.id}.titulo`, pt: f.titulo, tipo: 'titulo' as const },
  ...f.transcricao.split('\n').map((l, i) => ({ chave: `fita.${f.id}.${i}`, pt: l, tipo: 'radio' as const })),
]);
