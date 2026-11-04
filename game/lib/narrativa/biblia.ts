// Bíblia em dados (puro): elenco, facções e cronologia. Base: docs/plano-goty/roteiro.md §3–§4, com ajustes desta lib.
// É referência do time (papel/arco não aparecem para o jogador); as falas de amostra sim, e por isso também vão ao catálogo.
import type { EmissorId, Personagem, Tecnica } from '../../nucleo/contratos';
import type { EntradaTexto } from './tipos';

export const PERSONAGENS: Personagem[] = [
  {
    id: 'cris', nome: 'Cris Alves', autoria: 'rascunho-ia',
    papel: 'Protagonista, 26 anos, ex-entregador(a) de moto por aplicativo. Gênero escolhido pelo jogador ({o|a}). Fala pouco: pensamentos de uma linha e três escolhas com a Lia.',
    arco: 'Obedecer → duvidar → mentir para a Lia → escolher que voz quer ser. Ferida: no dia do Clarão obedeceu à Íris e viveu; a mãe obedeceu à mesma voz e ficou.',
    fala: ['Esse ainda tinha crachá.', 'Eu passava aqui todo dia. Ela dizia pra eu não passar.', 'O app mandava, eu ia. A Íris mandava, eu evitava.'],
  },
  {
    id: 'lia', nome: 'Lia Alves', autoria: 'rascunho-ia',
    papel: 'A irmã, 9 anos. Fica no abrigo, desenha na parede, planta na horta e anota tudo o que a Íris diz num caderno de escola. Adulta, é a narradora escondida.',
    arco: 'Fé total → percebe a repetição antes de todo mundo → descobre que Cris mentiu → escolhe a própria voz. Nunca morre por sistema: nas invasões, se esconde no porão.',
    fala: ['A Íris falou que amanhã faz sol. Ela nunca erra.', 'Hoje ela falou igual à semana passada. Igualzinho. Até a tosse.', 'Se não tiver lugar, eu fico com você. Pode falar que tem, que eu finjo que acredito.'],
  },
  {
    id: 'iris', nome: 'Íris Matos', autoria: 'rascunho-ia',
    papel: 'A Voz. 34 anos, repórter de trânsito da Farol 107,7. Às 6h39 do Clarão disse "Evitem o Centro". Hoje é uma gravação de 7 dias em loop.',
    arco: 'Confiança → cooptação (Diretriz 7) → culpa → coragem tardia (fita 7). O jogador a ama antes de entender.',
    fala: ['Seis e quarenta, hora certa na Farol. Bom dia, sobrevivente. Aqui é a Íris.', 'Abrigo 7 de portas abertas. Tem água, tem médico.', 'Se você ouviu isso ontem, ouve de novo. Repetir também é cuidar.'],
  },
  {
    id: 'reis', nome: 'Cabo Reis', autoria: 'rascunho-ia',
    papel: 'Desertor do Cordão, era o homem da catraca do Abrigo 7. Acampa na Floresta Morta e dá sopa a quem passa. NPC fixo, com memória.',
    arco: 'Obedecer ao número → culpa → no fim, se confiar em você e sua leitura der 61 a 65, arredonda: "Sessenta. Passa." O registro final mostra a mentira.',
    fala: ['Eu sei o que tem no Abrigo 7. Eu era o cara da porta.', 'A máquina mede. Eu só lia em voz alta. É o que eu dizia pra mim.', 'Sessenta. Passa. …Anda, antes que eu me arrependa de ser gente.'],
  },
  {
    id: 'lume', nome: 'Irmão Lume', autoria: 'rascunho-ia',
    papel: 'Valdemar, ex-técnico de som da Farol: acendia a luz de NO AR. Pai da menina que deu 61. Lidera os Filhos do Cinza e interfere no sinal a partir da Torre.',
    arco: 'Luto → fé no brilho → na Torre, diante da fita 3, pergunta se você vai contar a verdade. Diz a verdade sobre a Farol e vende desespero como saída.',
    fala: ['…pergunta pra ela quanto mede a porta. Pergunta!', 'Sessenta e um, cabo. Você lembra do número. Eu lembro do nome.', 'Eu acendia a luz pra ela. Todo dia. Agora eu apago.'],
  },
  {
    id: 'cida', nome: 'Dona Cida', autoria: 'rascunho-ia',
    papel: 'Mascate da rede PX. Troca justa, preço que não muda, contratos pelo rádio. É o grupo de controle moral: a voz pequena que não mente.',
    arco: '"Não acredito em rádio, acredito em ficha" → confessa que vendeu radinhos aos romeiros, "esperança a três fichas" → no epílogo repete de graça a sua mensagem no PX.',
    fala: ['Positivo e operante. Tenho bateria, tenho bandagem, não tenho paciência.', 'A moça do rádio promete. Eu cobro. Quem cobra não precisa mentir.', 'Vendi quarenta radinhos pra gente que ia pro norte. Três fichas cada.'],
  },
  {
    id: 'socorro', nome: 'Socorro Alves', autoria: 'rascunho-ia',
    papel: 'A mãe. Técnica de enfermagem do Hospital São Judas. Só aparece em bilhetes: armário, caderno de plantão, um recado.',
    arco: 'Não tem arco: é o luto no centro do jogo. Ficou porque a Íris leu "equipes de saúde, permaneçam". A Lia não sabe; Cris decide o que contar.',
    fala: ['Cris, se você achar isto, come alguma coisa antes de chorar. Chorar com fome dá dor de cabeça.'],
  },
  // coadjuvantes sem arco
  { id: 'lucia', nome: 'Professora Lúcia', autoria: 'rascunho-ia', papel: 'Acampada que ensina as crianças a perguntar "quem disse?". A voz do Caderno, sem sermão.', arco: 'Sem arco.', fala: ['Antes de acreditar, pergunta quem disse. Depois pergunta quem ganha.'] },
  { id: 'vidal', nome: 'Sargento Vidal', autoria: 'rascunho-ia', papel: 'Opera a catraca do Abrigo 7. Educado, cansado, exato.', arco: 'Sem arco.', fala: ['Braço esticado, por favor. Não dói.'] },
];

export type Faccao = { id: EmissorId; nome: string; quem: string; querem: string; tecnica: Tecnica; comoMentem: string; dignidade: string; frequencia: string };
export const FACCOES: Faccao[] = [
  { id: 'farol', nome: 'Farol 107,7 / Diretriz 7', frequencia: '107,7 FM', tecnica: 'meia_verdade', quem: 'Uma gravação de 7 dias, uma política do Cordão e um Estado longe.', querem: 'Fluxo ordenado de gente na catraca.', comoMentem: '"Tem lugar. Tem médico." Esconde o limite de 60 e finge estar ao vivo.', dignidade: 'O "tem lugar" faz gente sair da Zona. A mentira salva alguns.' },
  { id: 'filhos', nome: 'Filhos do Cinza', frequencia: '88,1 FM (e por cima da Farol)', tecnica: 'pertencimento', quem: 'Os devolvidos pela catraca, irradiados demais para passar, que fizeram do brilho uma fé.', querem: 'Pertencer; que ninguém mais seja medido.', comoMentem: '"Aqui todo mundo cabe. O brilho cura." Dizem a verdade sobre a Farol e vendem o desespero.', dignidade: 'Ecoam Canudos com respeito: gente recusada que construiu um lugar próprio. Não são fanáticos de papelão; o luto deles é real.' },
  { id: 'milicia', nome: 'Milícia Velha', frequencia: 'VHF 145,5', tecnica: 'autoridade', quem: 'Policiais e militares do Cordão que ficaram do lado de dentro e cobram passagem no Posto Militar 14.', querem: 'Fichas, armas, combustível.', comoMentem: '"Governo Provisório", "últimas vagas na escolta". Prazo falso e autoridade inventada.', dignidade: 'Um Estado que se desfaz em negócio. Não negociam porque têm medo. Nenhuma pessoa ou grupo real.' },
  { id: 'saqueadores', nome: 'Saqueadores do Km 40', frequencia: 'PX · canal 9', tecnica: 'escassez', quem: 'Gente comum que aprendeu a armar isca no canal de emergência.', querem: 'Comida e combustível.', comoMentem: 'Remédio que não existe, "só até o amanhecer" todo dia, comboio de carcaças.', dignidade: 'Não têm discurso. São fome com fuzil.' },
  { id: 'px', nome: 'Rede PX da Dona Cida', frequencia: 'PX · canal 11', tecnica: 'nenhuma', quem: 'Mascates e caminhoneiros no rádio PX.', querem: 'Trocar e lucrar honestamente.', comoMentem: 'Não mentem. Preço visível, igual todo dia. Os contratos do rádio vêm daqui.', dignidade: 'A voz honesta e pequena. Não salva ninguém de graça, e diz isso.' },
  { id: 'sobrevivente', nome: 'Romeiros e avulsos', frequencia: 'PX · canal 9', tecnica: 'nenhuma', quem: 'Gente a pé rumo ao norte, com rádio no ombro.', querem: 'Chegar.', comoMentem: 'Quase nunca. Erram por fé, não por interesse.', dignidade: 'A romaria a pé é imagem brasileira; nunca vira piada.' },
];

export type Marco = { quando: string; oque: string; ondeDescobre: string };
export const CRONOLOGIA: Marco[] = [
  { quando: 'Antes', oque: 'Íris é a voz das manhãs. Cris faz entrega de moto ouvindo a Farol. Socorro é técnica de enfermagem no São Judas.', ondeDescobre: 'Fita 1 (Cidade Velha)' },
  { quando: 'Dia 0 · 6h39', oque: 'Um ouvinte avisa de um caminhão tombado na 23 de Maio. Íris: "Evitem o Centro." Um segundo depois, o Clarão.', ondeDescobre: 'Abertura; pauta do estúdio (pista); Fita 3' },
  { quando: 'Dia 0 · 9h', oque: 'Íris lê o roteiro da Defesa Civil: "Equipes de saúde, permaneçam." Socorro permanece.', ondeDescobre: 'Caderno de plantão (Hospital)' },
  { quando: 'Semanas 1–6', oque: 'A Farol orienta de verdade: água, rotas, abrigos. Nasce a fé na voz.', ondeDescobre: 'Bilhetes do Ermo; Fita 1' },
  { quando: 'Mês 2', oque: 'O Cordão fecha. A Diretriz 7 leva o transmissor da Farol para o Abrigo 7.', ondeDescobre: 'Diretriz 7 (Posto Militar 14)' },
  { quando: 'Mês 3', oque: 'Cabo Reis devolve uma família na catraca. A menina deu 61.', ondeDescobre: 'Anotações do Reis (2)' },
  { quando: 'Mês 4', oque: 'Valdemar, pai da menina, funda os Filhos do Cinza no Pântano e passa a interferir no sinal.', ondeDescobre: 'Folheto dos Filhos; Torre' },
  { quando: 'Mês 9', oque: 'Íris lê a Diretriz 7 no ar. Três dias de silêncio.', ondeDescobre: 'Fita 6' },
  { quando: 'Mês 11', oque: 'Íris dá acima de 60 na própria catraca, grava a fita 7 e sai a pé. A automação começa o loop de 7 dias.', ondeDescobre: 'Fita 7 (Abrigo 7)' },
  { quando: 'Dia ~690 (hoje)', oque: 'Cris, 26, e Lia, 9, num abrigo no meio do nada. O rádio pega às vezes.', ondeDescobre: 'Início do jogo' },
];

/** só as falas de amostra entram no catálogo (é o que o jogador pode ler) */
export const TEXTOS_BIBLIA: EntradaTexto[] = [
  ...PERSONAGENS.map(p => ({ chave: `nome.${p.id}`, pt: p.nome, tipo: 'nome' as const })),
  ...PERSONAGENS.flatMap(p => p.fala.map((f, i) => ({ chave: `personagem.${p.id}.fala.${i}`, pt: f, tipo: 'radio' as const }))),
];
