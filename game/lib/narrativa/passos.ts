// Os 25 passos da campanha com título narrativo + requisito honesto embaixo (roteiro §5). Puro.
// PROPOSTA para a coordenação aplicar em game/dados/objetivos.ts: `titulo` = título narrativo, e o requisito vira a 1ª linha da `dica`
// (ou um campo novo). Mudanças de ordem: `radio` vai para o fim do Ato III; passo novo `militar` no Ato IV (subir OBJ_VER).
// O requisito é a interface falando: diz exatamente o que o sistema mede (o teste confere o número contra OBJETIVOS[].meta).
import type { Traduzir } from '../../nucleo/contratos';
import type { EntradaTexto, Passo } from './tipos';

export const ATOS_NARRATIVOS = [
  { n: 1, nome: 'Ato I · A voz', pergunta: 'Em quem você confia?' },
  { n: 2, nome: 'Ato II · A estrada', pergunta: 'Quem está falando?' },
  { n: 3, nome: 'Ato III · O ruído', pergunta: 'O que a voz custou?' },
  { n: 4, nome: 'Ato IV · Seis e quarenta', pergunta: 'O que você vai dizer?' },
] as const;

const p = (x: Omit<Passo, 'autoria'>): Passo => ({ ...x, autoria: 'rascunho-ia' });

export const PASSOS: Passo[] = [
  // ---- Ato I · A voz (base, Ermo)
  p({ id: 'madeira', ato: 1, titulo: 'Lenha para o fogão', requisito: 'Colete 6 de madeira', batida: 'A Lia está com frio. Primeira conversa. O rádio da base chia e pega só pedaços.', lia: 'Tô com frio no nariz. Só no nariz. O resto tá bem.' }),
  p({ id: 'fabricar', ato: 1, titulo: 'Um curativo', requisito: 'Fabrique 1 item na bancada', batida: 'A Lia ralou o joelho no quintal.', lia: 'Sopra antes. A mãe soprava antes.' }),
  p({ id: 'comer', ato: 1, titulo: 'Metade pra cada', requisito: 'Coma ou beba 1 vez', batida: 'A Lia divide a lata em duas metades exatas, com régua.', lia: 'Metade pra você, metade pra mim. A Íris diz que é assim.' }),
  p({ id: 'jipe', ato: 1, titulo: 'O Ermo está calmo hoje', requisito: 'Viaje de jipe até o Ermo Cinzento', batida: 'A Farol diz que o Ermo está calmo, e está. A primeira coisa que a voz diz é verdade: é assim que a confiança nasce.', lia: 'Ela falou que hoje tá calmo. Pode ir.' }),
  p({ id: 'saque5', ato: 1, titulo: 'Volte com alguma coisa', requisito: 'Vasculhe 5 contêineres', batida: 'O bilhete do para-brisa (Juninho). Os romeiros existem.', cris: 'A chave tava no pneu. Ninguém veio buscar.' }),
  p({ id: 'abater3', ato: 1, titulo: 'Os queimados', requisito: 'Abata 3 criaturas', batida: 'Um queimado segura um radinho que ainda toca a Farol, baixinho.', cris: 'Esse ainda tinha crachá.' }),
  p({ id: 'noite', ato: 1, titulo: 'Antes de escurecer', requisito: 'Sobreviva a 1 noite', batida: 'Primeiro desenho da Lia na parede (o jipe e o sol). Na manhã seguinte, às 6h40: a cena do rádio, a interferência do Lume e a escolha 1.', lia: 'Volta antes da noite? Promete com o dedo.' }),
  // ---- Ato II · A estrada (Floresta, Posto Km 40, Cidade Velha)
  p({ id: 'nivel3', ato: 2, titulo: 'Pront{o|a} pra estrada', requisito: 'Chegue ao nível 3', batida: 'O Cabo Reis numa fogueira da Floresta: "Pra onde vocês vão? …Ah. Pra lá."', cris: 'Ele olhou pro norte como quem olha uma dívida.' }),
  p({ id: 'melhoria', ato: 2, titulo: 'Uma casca pra casa', requisito: 'Faça 1 melhoria do abrigo', batida: 'Segundo desenho da Lia (o muro).', lia: 'Agora a casa tem casca. Igual ovo.' }),
  p({ id: 'contrato', ato: 2, titulo: 'Dona Cida no PX', requisito: 'Cumpra 1 contrato do rádio', batida: 'Os contratos vêm da rede PX, honesta e pequena. "Ficha é ficha."', lia: 'A moça do PX fala igual tia brava. Gostei dela.' }),
  p({ id: 'bichos', ato: 2, titulo: 'Carne pra dois', requisito: 'Cace 2 animais', batida: 'O silêncio da Floresta. A névoa.', cris: 'Aqui nem passarinho fala.' }),
  p({ id: 'cozinhar', ato: 2, titulo: 'Fogo de chão', requisito: 'Cozinhe 1 vez numa fogueira', batida: 'O Reis conta, ao fogo, que trabalhava "numa porta". Não diz qual.' }),
  p({ id: 'horta', ato: 2, titulo: 'A horta da Lia', requisito: 'Plante e colha 1 vez na horta', batida: 'A Lia batiza a planta.', lia: 'O nome dela é Íris. Ela vai crescer porque eu falo com ela de manhã.' }),
  p({ id: 'machado', ato: 2, titulo: 'Um machado', requisito: 'Fabrique 1 machado', batida: 'Pausa de ritmo, sem batida.' }),
  p({ id: 'explorar3', ato: 2, titulo: 'O que a Íris não conta', requisito: 'Descubra 3 locais', batida: 'Posto Km 40: a faixa "tem água", o tanque seco, os Saqueadores (primeira ficha falsa). Cidade Velha: o estúdio da Farol, a pauta de 14/05 e a fita 1.', cris: 'Eu passava aqui todo dia. Ela dizia pra eu não passar.' }),
  p({ id: 'nivel5', ato: 2, titulo: 'A semana que se repete', requisito: 'Chegue ao nível 5', batida: 'R1, o loop. A Lia mostra o caderno: duas páginas iguais. Fim do ato: Cris liga o rádio às 6h40 e recita junto com a Íris.', lia: 'Hoje ela falou igual à semana passada. Igualzinho. Até a tosse.' }),
  // ---- Ato III · O ruído (Hospital, Pântano, Refinaria, Torre)
  p({ id: 'gangue', ato: 3, titulo: 'Quem corta o sinal', requisito: 'Derrote 1 membro de gangue', batida: 'Os Filhos do Cinza ficam mais fortes. A interferência do Lume vira programa diário.' }),
  p({ id: 'contratos2', ato: 3, titulo: 'Esperança a três fichas', requisito: 'Cumpra 3 contratos no total', batida: 'A Dona Cida confessa os radinhos que vendeu aos romeiros.' }),
  p({ id: 'explorar6', ato: 3, titulo: 'São Judas', requisito: 'Descubra 6 locais', batida: 'R2. O armário da mãe e o caderno de plantão. Escolha 2 ao voltar. Pântano: o folheto e os queimados com rádio. (Proposta: exigir o Hospital entre os 6.)', cris: 'Ala B. A mãe dizia que tinha a melhor máquina de café.' }),
  p({ id: 'nivel7', ato: 3, titulo: 'A Refinaria', requisito: 'Chegue ao nível 7', batida: 'O Colosso. Um Filho no chão murmura: "Batizado na cratera." Mito, nunca confirmado.' }),
  p({ id: 'radio', ato: 3, titulo: 'A Torre', requisito: 'Ache o rádio de campanha na Torre', batida: 'R3. O Lume e a fita 3: o caminhão da 23 de Maio. O rádio de campanha pega o sinal limpo. Fim do ato: "Você vai contar?"', cris: 'Um caminhão. A cidade inteira por causa de um caminhão.' }),
  // ---- Ato IV · Seis e quarenta (Posto Militar 14, Abrigo 7)
  p({ id: 'combustivel', ato: 4, titulo: 'Tanque cheio', requisito: 'Junte 10 de combustível', batida: 'A Lia faz a mochila dela: o caderno, o giz, a muda da Íris num pote.', lia: 'Cabe a planta? Ela é pequena. Ela não ocupa lugar.' }),
  p({ id: 'nivel8', ato: 4, titulo: 'Limp{o|a} pra passar', requisito: 'Chegue ao nível 8', batida: 'O Reis avisa, com todas as letras: "Eles medem. Passou de 60, volta." Um ato inteiro para baixar a contaminação.' }),
  p({ id: 'militar', ato: 4, titulo: 'Posto Militar 14', requisito: 'Visite o Posto Militar 14', batida: 'R4, a Diretriz 7 e a caderneta 2 do Reis. Ele negocia ou luta com a Milícia, conforme a confiança.', cris: 'Não informar o limite. Escrito à máquina.' }),
  p({ id: 'abrigo7', ato: 4, titulo: 'Abrigo 7', requisito: 'Viaje com a Lia até o Abrigo 7', batida: 'Viagem final com duas pessoas no banco. Escolha 3 na estrada. Depois: catraca, cabine, fita 7, "O que você vai dizer?".', lia: 'Lá tem lugar pra nós dois?' }),
];

/** fala dos NPCs procedurais (game/dados/npcs.ts) sem língua de interface — proposta de troca */
export const FALAS_NPC_PROPOSTA: Record<string, string[]> = {
  contrato: ['A Cida do PX passa serviço no rádio. Paga direito, e paga no abrigo.', 'Serviço feito é gasolina e bala no bolso.'],
  comer: ['Come antes de ter fome. Bebe antes de ter sede. Quem espera, cai.'],
  abater3: ['Deixa chegar perto. De longe eles parecem gente.'],
  combustivel: ['Sem gasolina, nem o Abrigo 7 você alcança. Junta dez galões.', 'Caixa d\'água, posto, carro velho: gasolina aparece onde menos se espera.'],
};

export const TEXTOS_PASSOS: EntradaTexto[] = [
  ...ATOS_NARRATIVOS.flatMap(a => [
    { chave: `ato.${a.n}.nome`, pt: a.nome, tipo: 'interface' as const },
    { chave: `ato.${a.n}.pergunta`, pt: a.pergunta, tipo: 'titulo' as const },
  ]),
  ...PASSOS.flatMap(x => [
    { chave: `passo.${x.id}.titulo`, pt: x.titulo, tipo: 'titulo' as const },
    { chave: `passo.${x.id}.requisito`, pt: x.requisito, tipo: 'interface' as const },
    ...(x.lia ? [{ chave: `passo.${x.id}.lia`, pt: x.lia, tipo: 'evento' as const }] : []),
    ...(x.cris ? [{ chave: `passo.${x.id}.cris`, pt: x.cris, tipo: 'pensamento' as const }] : []),
  ]),
  ...Object.entries(FALAS_NPC_PROPOSTA).flatMap(([id, l]) => l.map((pt, i) => ({ chave: `npc.${id}.${i}`, pt, tipo: 'evento' as const }))),
  { chave: 'passo.final.titulo', pt: 'O que você vai dizer?', tipo: 'titulo' },
];

/** o que o HUD mostra: título narrativo em cima, requisito honesto embaixo */
export const textoHud = (t: Traduzir, id: string) => ({ titulo: t(`passo.${id}.titulo`), requisito: t(`passo.${id}.requisito`) });
