// Catálogo de rádio dos Atos I e II no formato da Escuta (contratos.ts: Transmissao/Alegacao/FalaRadio). Puro.
// A Farol toca às 6h40 (minuto 400) uma programação de 7 dias que se repete: é o loop (R1). Pistas sonoras e de texto:
// a vinheta abre e fecha sempre com a segunda nota falhando no mesmo lugar ('vinheta_falha'), e no dia 4 tem a mesma tosse.
// Uma alegação que se repete em vários dias usa o MESMO id (o Caderno abre uma ficha só e a repetição vira prova pelo 'tempo').
import type { Alegacao, FalaRadio, Transmissao } from '../../nucleo/contratos';
import type { EntradaTexto } from './tipos';

/** quem fala no rádio → nome exibido (chave `quem.<id>` no catálogo) */
export const QUEM: Record<string, string> = {
  vinheta: 'Vinheta', iris: 'Íris', lume: 'Irmão Lume', coro: 'Coro', filha: 'Uma voz de moça', saqueador: 'Voz no canal 9',
  milicia: 'Comunicado', cida: 'Dona Cida', josue: 'Josué',
};

// ---------------------------------------------------------------- alegações
const al = (a: Alegacao) => a;
export const ALEGACOES = {
  farolAoVivo: al({ id: 'farol-ao-vivo', tipo: 'autoridade', disseram: 'Aqui é a Íris.', verdade: 'meia', comoVerificar: ['tempo'], real: 'É a voz da Íris, gravada há mais de um ano. A única coisa ao vivo é a hora certa, que a automação da rádio põe sozinha.' }),
  temMedico: al({ id: 'farol-tem-medico', tipo: 'conteudo', disseram: 'Tem água, tem médico.', verdade: 'meia', local: 'abrigo7', comoVerificar: ['ir', 'cruzar'], real: 'A água tem. O médico fica do lado de lá da catraca. Do lado de cá, só quem mede.' }),
  temLugar: al({ id: 'farol-tem-lugar', tipo: 'conteudo', disseram: 'Tem lugar.', verdade: 'meia', local: 'abrigo7', comoVerificar: ['ir', 'cruzar'], real: 'Tem lugar para quem mede até 60 na catraca. Acima disso, volta para a Zona. A locução nunca diz o número.' }),
  previsao: al({ id: 'farol-previsao', tipo: 'radiacao', disseram: 'vento leste, cinza fina até o meio-dia', verdade: 'meia', comoVerificar: ['tempo', 'geiger'], real: 'É a previsão de um dia de mais de um ano atrás. Às vezes acerta por acaso. O vento de hoje é outro.' }),
  estradaNorte: al({ id: 'farol-estrada-norte', tipo: 'local', disseram: 'estrada norte livre até o Km 40', verdade: 'verdade', local: 'posto', comoVerificar: ['ir'], real: 'Livre mesmo, até o Km 40. Do Km 40 em diante ela não fala nada.' }),
  postoAgua: al({ id: 'farol-posto-agua', tipo: 'local', disseram: 'O Posto Km 40 tem água da Defesa Civil.', verdade: 'falso', local: 'posto', comoVerificar: ['ir', 'cruzar'], real: 'O tanque está seco há meses. Quem está no posto são os Saqueadores do Km 40.' }),
  ermoCalmo: al({ id: 'farol-ermo-calmo', tipo: 'local', disseram: 'Ermo Cinzento calmo hoje.', verdade: 'verdade', local: 'ermo', comoVerificar: ['ir'], real: 'O Ermo é a zona mais calma todo dia. Não é previsão: é o lugar. Foi assim que você começou a confiar.' }),
  romeiros: al({ id: 'farol-romeiros', tipo: 'adesao', disseram: 'Ontem chegaram trinta e duas famílias na porta do Abrigo 7.', verdade: 'meia', local: 'abrigo7', comoVerificar: ['tempo', 'cruzar'], real: 'Chegar, chegam. Quantas passam ela não diz. E o "ontem" é sempre o mesmo dia.' }),
  defesaCivil: al({ id: 'farol-defesa-civil', tipo: 'autoridade', disseram: 'Orientação da Defesa Civil: siga pela estrada norte, de dia, em grupo.', verdade: 'verdade', comoVerificar: ['cruzar'], real: 'É da Defesa Civil mesmo: a Diretriz 7 manda manter o fluxo pela estrada norte. O conselho é bom. O motivo é a fila.' }),
  quaseLa: al({ id: 'farol-quase-la', tipo: 'local', disseram: 'falta menos do que você pensa', verdade: 'falso', local: 'abrigo7', comoVerificar: ['ir', 'tempo'], real: 'Ela não sabe onde você está: é gravação. Da ponte até a porta são dois dias a pé pela zona quente.' }),
  ferver: al({ id: 'farol-ferver', tipo: 'radiacao', disseram: 'água fervida por dez minutos já pode beber', verdade: 'falso', comoVerificar: ['geiger'], real: 'Ferver mata bicho, não tira radiação. Pode até concentrar. Passe o Geiger na água antes de beber.' }),
  lumeVozMente: al({ id: 'lume-voz-mente', tipo: 'autoridade', disseram: 'A voz mente.', verdade: 'verdade', local: 'abrigo7', comoVerificar: ['cruzar', 'ir'], real: 'A Farol esconde o limite da catraca e finge estar ao vivo. Nisso ele tem razão.' }),
  lumeSessenta: al({ id: 'lume-sessenta', tipo: 'conteudo', disseram: 'Sessenta. Decora esse número.', verdade: 'verdade', local: 'abrigo7', comoVerificar: ['cruzar'], real: 'A catraca devolve quem mede acima de 60. Quem confirma é o Cabo Reis, e depois a própria Diretriz 7.' }),
  filhosCabe: al({ id: 'filhos-todo-mundo-cabe', tipo: 'adesao', disseram: 'Aqui todo mundo cabe.', verdade: 'meia', local: 'pantano', comoVerificar: ['ir', 'geiger'], real: 'Ninguém é mandado embora da cratera. Mas o chão do Pântano queima: quem fica, adoece.' }),
  filhosBrilho: al({ id: 'filhos-brilho-cura', tipo: 'radiacao', disseram: 'O brilho cura o que a porta recusa.', verdade: 'falso', local: 'pantano', comoVerificar: ['geiger'], real: 'O brilho é radiação. Não cura nada. Perto do altar o Geiger não para de bater.' }),
  saqRemedio: al({ id: 'saq-remedio-posto', tipo: 'conteudo', disseram: 'Remédio de sobra no Posto Km 40.', verdade: 'falso', local: 'posto', comoVerificar: ['triangular', 'ir'], real: 'Não tem remédio. É isca: o sinal sai do viaduto do Km 40, onde eles esperam quem vem trocar.' }),
  saqAmanhecer: al({ id: 'saq-ate-amanhecer', tipo: 'prazo', disseram: 'Só até o amanhecer.', verdade: 'falso', comoVerificar: ['tempo'], real: 'O mesmo aviso vai ao ar todo dia às 18h, com o mesmo prazo. Ninguém sobe pro norte.' }),
  saqComboio: al({ id: 'saq-comboio', tipo: 'adesao', disseram: 'Já são vinte carros.', verdade: 'falso', local: 'posto', comoVerificar: ['ir', 'triangular'], real: 'Não tem comboio. São seis homens e duas caminhonetes. Os outros carros são carcaças.' }),
  milGoverno: al({ id: 'mil-governo-provisorio', tipo: 'autoridade', disseram: 'Comunicado do Governo Provisório da Zona', verdade: 'falso', local: 'militar', comoVerificar: ['cruzar'], real: 'Não existe Governo Provisório. O governo está em Brasília e não cobra passagem. O Posto 14 é da Milícia Velha.' }),
  milVagas: al({ id: 'mil-ultimas-vagas', tipo: 'prazo', disseram: 'Últimas vagas na escolta desta semana.', verdade: 'falso', local: 'militar', comoVerificar: ['tempo'], real: 'A escolta "desta semana" é anunciada toda semana. As vagas nunca acabam.' }),
  cidaPreco: al({ id: 'px-preco', tipo: 'conteudo', disseram: 'Amanhã é igual. Depois de amanhã também.', verdade: 'verdade', comoVerificar: ['tempo', 'ir'], real: 'O preço da Cida é o mesmo todo dia. Quem conferiu foi você.' }),
  cidaServico: al({ id: 'px-servico-lenha', tipo: 'conteudo', disseram: 'Paga em combustível.', verdade: 'verdade', local: 'floresta', comoVerificar: ['ir'], real: 'Paga. O contrato da rede PX é cumprido no abrigo, como ela disse.' }),
  cidaPosto: al({ id: 'px-posto-seco', tipo: 'local', disseram: 'Tanque seco, e gente armada no viaduto.', verdade: 'verdade', local: 'posto', comoVerificar: ['ir', 'cruzar'], real: 'É isso mesmo. A Cida passou lá. A Farol nunca passou.' }),
  josueReis: al({ id: 'romeiro-sopa', tipo: 'local', disseram: 'Na Floresta Morta tem um homem que dá sopa pra quem passa.', verdade: 'verdade', local: 'floresta', comoVerificar: ['ir'], real: 'É o Cabo Reis. A sopa é de verdade. A farda ele não usa mais.' }),
} satisfies Record<string, Alegacao>;
const A = ALEGACOES;

// ---------------------------------------------------------------- a Farol: blocos que se repetem
const V: FalaRadio = { quem: 'vinheta', texto: '[vinheta da Farol · a segunda nota falha]', efeito: 'vinheta_falha' };
const ABRE: FalaRadio = { quem: 'iris', texto: 'Seis e quarenta, hora certa na Farol. Bom dia, sobrevivente. Aqui é a Íris.', alegacao: A.farolAoVivo.id };
const MEDICO: FalaRadio = { quem: 'iris', texto: 'Abrigo 7 de portas abertas. Tem água, tem médico.', alegacao: A.temMedico.id };
const LUGAR: FalaRadio = { quem: 'iris', texto: 'Tem lugar.', alegacao: A.temLugar.id };
const TCHAU: FalaRadio = { quem: 'iris', texto: 'Até amanhã, sobrevivente. Seis e quarenta, a gente se ouve.' };
const BASE = [A.farolAoVivo, A.temMedico, A.temLugar];
const farol = (d: number, tecnica: Transmissao['tecnica'], meio: FalaRadio[], extras: Alegacao[]): Transmissao => ({
  id: `farol-d${d}`, emissor: 'farol', frequencia: '107,7 FM', minuto: 400, atos: [1, 2, 3, 4], tecnica,
  falas: [V, ABRE, ...meio, MEDICO, LUGAR, TCHAU, V], alegacoes: [...BASE, ...extras], autoria: 'rascunho-ia',
});

/** a semana gravada: dia de jogo d toca PROGRAMA_FAROL[(d - 1) % 7] */
export const FAROL_SEMANA: Transmissao[] = [
  farol(1, 'meia_verdade', [
    { quem: 'iris', texto: 'Tempo: vento leste, cinza fina até o meio-dia. Fecha a janela e molha o pano antes de respirar.', alegacao: A.previsao.id },
    { quem: 'iris', texto: 'Trânsito: estrada norte livre até o Km 40. O Posto Km 40 tem água da Defesa Civil. Pega sem briga.', alegacao: A.postoAgua.id },
  ], [A.previsao, A.postoAgua]),
  farol(2, 'prova_social', [
    { quem: 'iris', texto: 'Ermo Cinzento calmo hoje. Bom dia pra buscar lenha e voltar cedo.', alegacao: A.ermoCalmo.id },
    { quem: 'iris', texto: 'Ontem chegaram trinta e duas famílias na porta do Abrigo 7. Tem gente chegando todo dia.', alegacao: A.romeiros.id },
  ], [A.ermoCalmo, A.romeiros]),
  farol(3, 'autoridade', [
    { quem: 'iris', texto: 'Orientação da Defesa Civil: siga pela estrada norte, de dia, em grupo. Quem tem criança vai na frente da fila.', alegacao: A.defesaCivil.id },
    { quem: 'iris', texto: 'Trânsito: estrada norte livre até o Km 40. Sem fila de carro, que carro já não tem.', alegacao: A.estradaNorte.id },
  ], [A.defesaCivil, A.estradaNorte]),
  farol(4, 'meia_verdade', [
    { quem: 'iris', texto: 'Tempo: chuva fina à tarde. Se a chuva vier amarela, não fica nela.' },
    { quem: 'iris', texto: '(tosse) Desculpa. A cinza entra até aqui em cima.', efeito: 'chiado' },
    { quem: 'iris', texto: 'O Posto Km 40 tem água da Defesa Civil. Leva galão.', alegacao: A.postoAgua.id },
  ], [A.postoAgua]),
  farol(5, 'quase_la', [
    { quem: 'iris', texto: 'Pra quem está na estrada: se você já passou da ponte, falta menos do que você pensa.', alegacao: A.quaseLa.id },
    { quem: 'iris', texto: 'Anda de dia. De noite eles seguem a luz da lanterna. Não é maldade. É o que sobrou deles.' },
  ], [A.quaseLa]),
  farol(6, 'autoridade', [
    { quem: 'iris', texto: 'Recado de saúde: água fervida por dez minutos já pode beber. Ferver limpa.', alegacao: A.ferver.id },
    { quem: 'iris', texto: 'Trânsito: estrada norte livre até o Km 40.', alegacao: A.estradaNorte.id },
  ], [A.ferver, A.estradaNorte]),
  farol(7, 'reciprocidade', [
    { quem: 'iris', texto: 'Hoje eu queria agradecer quem deixa água na estrada pra quem vem atrás. Vocês também são a Farol.' },
    { quem: 'iris', texto: 'Se você ouviu isso ontem, ouve de novo. Repetir também é cuidar.' },
  ], []),
];
export const PROGRAMA_FAROL = FAROL_SEMANA.map(t => t.id);
/** qual programa da Farol vai ao ar no dia de jogo (1..) — é isso que faz o loop ser descobrível */
export const farolDoDia = (dia: number) => FAROL_SEMANA[(((dia - 1) % 7) + 7) % 7];

// ---------------------------------------------------------------- as outras vozes
export const OUTRAS: Transmissao[] = [
  {
    id: 'lume-porta', emissor: 'filhos', frequencia: '107,7 FM', minuto: 401, atos: [1, 2], tecnica: 'meia_verdade', autoria: 'rascunho-ia',
    falas: [
      { quem: 'lume', texto: '…pergunta pra ela quanto mede a porta. Pergunta!', efeito: 'interferencia' },
      { quem: 'lume', texto: 'A voz mente. O brilho n…', efeito: 'interferencia', alegacao: A.lumeVozMente.id },
    ],
    alegacoes: [A.lumeVozMente],
  },
  {
    id: 'lume-noite', emissor: 'filhos', frequencia: '107,7 FM', minuto: 1380, atos: [2], tecnica: 'pertencimento', autoria: 'rascunho-ia',
    falas: [
      { quem: 'lume', texto: 'Aqui é o Irmão Lume, na frequência de quem sobrou. Eu acendia a luz de NO AR pra ela. Todo dia.', efeito: 'interferencia' },
      { quem: 'lume', texto: 'Ela não te conta quanto a porta deixa passar. Eu conto. Sessenta. Decora esse número.', alegacao: A.lumeSessenta.id },
      { quem: 'lume', texto: 'Quem passa de sessenta volta. Volta a pé, pela mesma estrada, com a mesma criança no colo.' },
      { quem: 'lume', texto: 'Boa noite, devolvido. Você não está sozinho.', efeito: 'interferencia' },
    ],
    alegacoes: [A.lumeSessenta],
  },
  {
    id: 'filhos-cratera', emissor: 'filhos', frequencia: '88,1 FM', minuto: 1200, atos: [2], tecnica: 'pertencimento', autoria: 'rascunho-ia',
    falas: [
      { quem: 'coro', texto: 'A cinza vai virar luz, e a luz vai virar cinza.', efeito: 'chiado' },
      { quem: 'filha', texto: 'Fomos medidos e mandados de volta. Aqui ninguém tem número. Tem nome.' },
      { quem: 'filha', texto: 'Desce pro Pântano. Aqui ninguém é devolvido. Aqui todo mundo cabe.', alegacao: A.filhosCabe.id },
      { quem: 'filha', texto: 'O brilho cura o que a porta recusa.', alegacao: A.filhosBrilho.id },
      { quem: 'coro', texto: 'A cinza vai virar luz, e a luz vai virar cinza.', efeito: 'chiado' },
    ],
    alegacoes: [A.filhosCabe, A.filhosBrilho],
  },
  {
    id: 'saq-remedio', emissor: 'saqueadores', frequencia: 'PX · canal 9', minuto: 1080, atos: [1, 2], tecnica: 'escassez', autoria: 'rascunho-ia',
    falas: [
      { quem: 'saqueador', texto: 'Câmbio, câmbio. Remédio de sobra no Posto Km 40. Antibiótico, bandagem, iodo.', alegacao: A.saqRemedio.id },
      { quem: 'saqueador', texto: 'Troca por gasolina. Só até o amanhecer. Depois a gente sobe pro norte. Câmbio.', alegacao: A.saqAmanhecer.id },
    ],
    alegacoes: [A.saqRemedio, A.saqAmanhecer],
  },
  {
    id: 'saq-comboio', emissor: 'saqueadores', frequencia: 'PX · canal 9', atos: [2], tecnica: 'prova_social', autoria: 'rascunho-ia',
    falas: [
      { quem: 'saqueador', texto: 'Aqui é o comboio do Km 40. Já são vinte carros. Todo mundo junto, ninguém mexe com comboio.', alegacao: A.saqComboio.id },
      { quem: 'saqueador', texto: 'Encosta no posto e entra na fila com a gente. Traz o que tiver no tanque.' },
    ],
    alegacoes: [A.saqComboio],
  },
  {
    id: 'milicia-escolta', emissor: 'milicia', frequencia: 'VHF 145,5', minuto: 720, atos: [2], tecnica: 'autoridade', autoria: 'rascunho-ia',
    falas: [
      { quem: 'milicia', texto: 'Atenção. Comunicado do Governo Provisório da Zona, por ordem do comando do Posto Militar 14.', alegacao: A.milGoverno.id },
      { quem: 'milicia', texto: 'Viatura com destino ao norte recolhe taxa de passagem: dez galões, entregues no Posto 14.' },
      { quem: 'milicia', texto: 'Últimas vagas na escolta desta semana. Quem não pagar segue por conta própria. Fim do comunicado.', alegacao: A.milVagas.id },
    ],
    alegacoes: [A.milGoverno, A.milVagas],
  },
  {
    id: 'px-cida-preco', emissor: 'px', frequencia: 'PX · canal 11', minuto: 840, atos: [1, 2, 3, 4], tecnica: 'nenhuma', autoria: 'rascunho-ia',
    falas: [
      { quem: 'cida', texto: 'Positivo e operante. Aqui é a Cida, do PX. Tenho bateria, tenho bandagem, não tenho paciência.' },
      { quem: 'cida', texto: 'Bateria a três fichas, bandagem a duas. Amanhã é igual. Depois de amanhã também.', alegacao: A.cidaPreco.id },
      { quem: 'cida', texto: 'Serviço: o Seu Tonho quer lenha da Floresta Morta. Paga em combustível. Câmbio, desligo.', alegacao: A.cidaServico.id },
    ],
    alegacoes: [A.cidaPreco, A.cidaServico],
  },
  {
    id: 'px-cida-posto', emissor: 'px', frequencia: 'PX · canal 11', minuto: 850, atos: [1, 2], tecnica: 'nenhuma', autoria: 'rascunho-ia',
    falas: [
      { quem: 'cida', texto: 'A moça do rádio grande disse que o Km 40 tem água. Eu passei lá terça.', efeito: 'chiado' },
      { quem: 'cida', texto: 'Tanque seco, e gente armada no viaduto. Não acredito em rádio, acredito em ficha. Câmbio.', alegacao: A.cidaPosto.id },
    ],
    alegacoes: [A.cidaPosto],
  },
  {
    id: 'romeiro-josue', emissor: 'sobrevivente', frequencia: 'PX · canal 9', atos: [1, 2], tecnica: 'nenhuma', autoria: 'rascunho-ia',
    falas: [
      { quem: 'josue', texto: 'Alô, quem tiver na escuta. Aqui é o Josué, a pé, com a mulher e o menino. Vamos pro Abrigo 7.', efeito: 'chiado' },
      { quem: 'josue', texto: 'Na Floresta Morta tem um homem que dá sopa pra quem passa. Não pergunta nada. Deus lhe pague, moço.', alegacao: A.josueReis.id },
      { quem: 'josue', texto: 'Se alguém ouvir isso na volta, é porque deu errado. Mas não vai dar.' },
    ],
    alegacoes: [A.josueReis],
  },
];

export const TRANSMISSOES: Transmissao[] = [...FAROL_SEMANA, ...OUTRAS];

/** catálogo: falas por posição (a mesma fala repetida em dias diferentes vira uma chave por dia, de propósito: o loop é texto igual) */
export const TEXTOS_TRANSMISSOES: EntradaTexto[] = [
  ...Object.entries(QUEM).map(([id, nome]) => ({ chave: `quem.${id}`, pt: nome, tipo: 'nome' as const })),
  ...TRANSMISSOES.flatMap(t => t.falas.map((f, i) => ({ chave: `tr.${t.id}.${i}`, pt: f.texto, tipo: 'radio' as const }))),
  ...Object.values(ALEGACOES).flatMap(a => [
    { chave: `al.${a.id}.disseram`, pt: a.disseram, tipo: 'radio' as const },
    { chave: `al.${a.id}.real`, pt: a.real, tipo: 'radio' as const },
  ]),
];
