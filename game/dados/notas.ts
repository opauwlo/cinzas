// Bilhetes e diários espalhados pelo mundo (PURO): pequenas histórias, dicas de jogo e, às vezes, algo escondido junto.
// Achar e ler um bilhete dá XP e conta para a conquista "Leitor". Criar um novo = uma entrada.
export type Nota = { titulo: string; texto: string; /** algo que estava junto do bilhete */ premio?: [item: string, qtd: number] };
export const NOTAS: Nota[] = [
  { titulo: 'Bilhete amassado', texto: 'Se alguém ler isto: a água dos poços e dos reservatórios ainda é boa. A do pântano não. Aprendi do jeito difícil.' },
  { titulo: 'Página de diário', texto: 'Dia 212. O rádio chiou de novo. Dizem que existe um Abrigo 7 ao norte, mas ninguém que foi voltou para contar. Eu vou tentar quando achar combustível.' },
  { titulo: 'Cartão-postal', texto: 'Mãe, estou bem. Troquei o relógio por duas latas de atum. Volto quando a chuva passar. P.S.: não saia depois do escurecer.' },
  { titulo: 'Lista de compras', texto: 'Água ×3, curativos ×2, pilhas. Esconda o resto debaixo do colchão. (Você tateou por baixo e achou uma lata esquecida.)', premio: ['enlatado', 1] },
  { titulo: 'Aviso rabiscado', texto: 'NÃO ABRA O PORTÃO DEPOIS DO ANOITECER. Eles vêm pela estrada. A luz os atrai e o barulho também. Corra só quando precisar.' },
  { titulo: 'Bilhete do mecânico', texto: 'Carro velho ainda guarda combustível, bateria e sucata. Pé de cabra desmonta qualquer carcaça. Procure os que estão fora da estrada.' },
  { titulo: 'Receita da vovó', texto: 'Carne bem cozida sacia o dobro. Bagas dão para o gasto. Cogumelo brilhante só se estiver desesperado: o brilho não é enfeite.' },
  { titulo: 'Mapa desenhado à mão', texto: 'Marquei três depósitos de suprimentos. Procure carros acidentados, cruzes e fogueiras apagadas: onde tem gente que passou, tem coisa que sobrou.' },
  { titulo: 'Carta de despedida', texto: 'Se estiver lendo isto, fique com a minha pilha. Ela ainda tem carga. Cuide bem da lanterna. (Havia um pacote preso ao bilhete.)', premio: ['bateria', 1] },
  { titulo: 'Anotações do cabo Reis', texto: 'Os Filhos do Cinza brilham no escuro. Não ligue para o brilho: ligue para o machado. Saqueadores atiram de longe, então chegue por trás da cobertura.' },
  { titulo: 'Rabisco de criança', texto: 'Um desenho de jipe e um sol enorme. Embaixo, em letras tortas: "um dia a gente vai embora daqui".' },
  { titulo: 'Bilhete preso a uma cruz', texto: 'Aqui descansa o Zé. Cuidou de todos até o fim. Deixamos ervas para quem passar precisando.', premio: ['erva', 2] },
  { titulo: 'Diário do mascate', texto: 'Troco fichas por suprimentos de três em três dias. Sou gentil com quem é gentil. Se me atacarem, eu lembro, e meus colegas também.' },
  { titulo: 'Aviso de radiação', texto: 'Crateras brilham em verde. Máscara de gás e antirrad salvam a vida. Não beba de poça. O contador Geiger chia mais perto do perigo.' },
  { titulo: 'Bilhete de um sobrevivente', texto: 'Quem dorme no abrigo acorda inteiro. Quem dorme na rua acorda sem a mochila. Fabrique uma cama melhor quando puder.', premio: ['tecido', 2] },
  { titulo: 'Esboço de torre', texto: 'A Torre de Rádio ao norte ainda tem aparelho de campanha. Suba de nível antes: lá o mato é pesado e a névoa engana.' },
];
