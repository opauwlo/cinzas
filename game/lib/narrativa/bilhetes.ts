// Bilhetes (puro): âncoras fixas por local e ato + bilhetes de mundo sorteados pela seed. Regra: um objeto, uma pessoa, uma virada.
// Nenhum é manual: a informação de sistema que os antigos davam ("suba de nível", "fabrique uma cama") vai só na dica da interface.
// Origem: [mantido] do notas.ts atual · [reescrito] a partir de um atual · [novo].
import type { BilheteLore } from '../../nucleo/contratos';
import type { EntradaTexto } from './tipos';

const b = (x: Omit<BilheteLore, 'autoria'>): BilheteLore => ({ ...x, autoria: 'rascunho-ia' });

export const BILHETES: BilheteLore[] = [
  // ---- âncoras (o gerador garante uma por local, como TEMAS.radio.garante)
  b({ id: 'para-brisa', ancora: true, local: 'ermo', ato: 1, titulo: 'Bilhete no para-brisa', // [novo]
    texto: 'Fui pro Abrigo 7. A moça do rádio disse que tem lugar. Se você é o Juninho: a chave tá no pneu. Se não é, pode levar o carro. Só deixa o bilhete, pro caso de ser o Juninho.' }),
  b({ id: 'faixa-posto', ancora: true, local: 'posto', ato: 2, titulo: 'Faixa da Defesa Civil', // [novo]
    texto: 'AQUI TEM ÁGUA · DEFESA CIVIL. Embaixo, a carvão: "Tinha. Até março. Quem chegou depois bebeu o que deu. Se o rádio te mandou, volta. O rádio nunca veio aqui."' }),
  b({ id: 'reis-1', ancora: true, local: 'floresta', ato: 2, titulo: 'Caderneta do Cabo Reis (1)', // [reescrito] Anotações do cabo Reis
    texto: 'Fogo baixo, sopa rala, um prato a mais. Passaram quatro hoje, todos pro norte. Não perguntei a leitura de ninguém. Perguntei o nome. É o meu jeito de pedir desculpa sem dizer do quê.' }),
  b({ id: 'pauta-farol', ancora: true, local: 'cidade', ato: 2, titulo: 'Pauta de 14 de maio', // [novo] pista antecipada da fita 3
    texto: 'PAUTA 14/05. 6h30 trânsito (Íris). 6h45 tempo. 7h notícias. À caneta, em outra letra: "6h39, ouvinte avisa caminhão tombado na 23 de Maio, sentido Centro. Pede pra evitar. — Val"' }),
  b({ id: 'plantao', ancora: true, local: 'hospital', ato: 3, titulo: 'Caderno de plantão', // [novo]
    texto: '14/05, 9h. A luz voltou no gerador. A Íris falou no rádio da copa: "Equipes de saúde, permaneçam. A ajuda está a caminho." A gente permaneceu. {O|A} Cris deve estar na moto, xingando o trânsito. Tomara. Tomara que esteja xingando. — Socorro' }),
  b({ id: 'folheto-filhos', ancora: true, local: 'pantano', ato: 3, titulo: 'Folheto dos Filhos do Cinza', // [novo]
    texto: 'A VOZ MENTE. O BRILHO NÃO. Ela manda você andar até a porta, e a porta mede você. Aqui ninguém mede ninguém. A cinza vai virar luz. Desça até a cratera: aqui todo mundo cabe.' }),
  b({ id: 'diretriz-7', ancora: true, local: 'militar', ato: 4, titulo: 'Diretriz 7', // [novo]
    texto: 'DIRETRIZ 7. Manter a locução "tem lugar" em todas as janelas. Motivo: fluxo ordenado. Leitura acima de 60: retorno à Zona. Não informar o limite na locução. À mão, embaixo: "Ela leu isso no ar uma vez. Cortaram o sinal por três dias."' }),
  b({ id: 'reis-2', ancora: true, local: 'militar', ato: 4, titulo: 'Caderneta do Cabo Reis (2)', // [novo]
    texto: 'Hoje mandei uma família voltar. A menina deu 61. Um acima do limite. A mãe perguntou se dava pra arredondar. Eu disse que a máquina não arredonda. Mentira. A máquina arredonda, sim. Eu é que não arredondei.' }),
  // ---- mundo (sorteados pela seed; textura, romeiros, vida comum)
  b({ id: 'cartao-postal', ancora: false, titulo: 'Cartão-postal', // [mantido]
    texto: 'Mãe, estou bem. Troquei o relógio por duas latas de atum. Volto quando a chuva passar. P.S.: não saia depois do escurecer.' }),
  b({ id: 'receita-vovo', ancora: false, titulo: 'Receita da vovó', // [mantido]
    texto: 'Carne bem cozida sacia o dobro. Bagas dão para o gasto. Cogumelo brilhante só se estiver desesperado: o brilho não é enfeite.' }),
  b({ id: 'diario-romeiro', ancora: false, ato: 1, titulo: 'Folha de agenda', // [reescrito] vira romeiro
    texto: 'Dia 212. A moça do rádio disse que tem lugar. Vendi a geladeira por um par de tênis. Ninguém que foi pro Abrigo 7 voltou pra contar. Deve ser bom lá.' }),
  b({ id: 'desenho-aureola', ancora: false, titulo: 'Desenho a giz de cera', // [reescrito] Rabisco de criança (o original passa a ser da Lia, na parede)
    texto: 'Uma moça com um rádio na cabeça, feito auréola. Em volta, gente pequenininha andando, todo mundo pro mesmo lado. Embaixo, em letra torta: "a moça que sabe".' }),
  b({ id: 'poca-verde', ancora: false, titulo: 'Recado na porta do 32', // [reescrito] Aviso de radiação
    texto: 'Seu Antônio, a poça verde não é limo. Não deixa o Pipoca beber. O Bidu bebeu. A Marli diz que fervendo passa, que a moça do rádio falou. Não passa. — Neide, do 34' }),
  b({ id: 'tio-nel', ancora: false, titulo: 'Bilhete do Tio Nel', // [reescrito] Bilhete do mecânico; o Juninho é o do para-brisa
    texto: 'Juninho, se o carro morrer, tira a bateria antes de chorar. Bateria vale mais que carro agora. Carro caído fora da estrada ainda tem gasolina. Os da pista já foram chupados. — Tio Nel' }),
  b({ id: 'cruz-ze', ancora: false, titulo: 'Bilhete preso a uma cruz', // [mantido]
    texto: 'Aqui descansa o Zé. Cuidou de todos até o fim. Deixamos ervas para quem passar precisando.' }),
];

export const TEXTOS_BILHETES: EntradaTexto[] = BILHETES.flatMap(x => [
  { chave: `bilhete.${x.id}.titulo`, pt: x.titulo, tipo: 'titulo' as const },
  { chave: `bilhete.${x.id}.texto`, pt: x.texto, tipo: 'bilhete' as const },
]);

/** proposta para game/dados/notas.ts: o que sai (era manual) e o que entra no lugar */
export const TROCA_NOTAS = {
  sai: ['Aviso rabiscado', 'Bilhete do mecânico', 'Mapa desenhado à mão', 'Anotações do cabo Reis', 'Diário do mascate', 'Aviso de radiação', 'Bilhete de um sobrevivente', 'Esboço de torre', 'Bilhete amassado'],
  ficam: ['Cartão-postal', 'Receita da vovó', 'Carta de despedida', 'Lista de compras', 'Bilhete preso a uma cruz'],
} as const;
