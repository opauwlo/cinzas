// 5 transmissões de AMOSTRA, só para testes e para o gate G0. O conteúdo final vem da lib de Narrativa (injetado por `catalogo()`).
// Todas são rascunho de IA (política do Plano GOTY §3) até um humano revisar.
import type { Transmissao } from '../../nucleo/contratos';

export const AMOSTRAS: Transmissao[] = [
  {
    id: 'farol-fita-1', emissor: 'farol', frequencia: '107,7 FM', minuto: 400, atos: [1, 2, 3, 4], tecnica: 'escassez', autoria: 'rascunho-ia',
    falas: [
      { quem: 'Íris', texto: 'Bom dia, Zona. Aqui é a Íris, ao vivo do Abrigo 7.', efeito: 'vinheta_falha', alegacao: 'farol-ao-vivo' },
      { quem: 'Íris', texto: 'Tem lugar. Tem médico. Tem água que não brilha.', alegacao: 'farol-tem-lugar' },
      { quem: 'Íris', texto: 'Sigam a estrada para o norte. A gente espera vocês.', efeito: 'loop' },
    ],
    alegacoes: [
      { id: 'farol-ao-vivo', tipo: 'autoridade', disseram: 'Aqui é a Íris, ao vivo do Abrigo 7.', verdade: 'falso', real: 'É uma fita. A mesma gravação volta a cada 7 dias, e a segunda nota da vinheta falha sempre no mesmo lugar.', comoVerificar: ['cruzar'] },
      { id: 'farol-tem-lugar', tipo: 'conteudo', disseram: 'Tem lugar. Tem médico.', verdade: 'meia', real: 'Tem lugar para 60 por mês. A locução é proibida de dizer o limite (Diretriz 7).', local: 'abrigo7', comoVerificar: ['cruzar', 'ir'] },
    ],
  },
  {
    id: 'saq-posto-km40', emissor: 'saqueadores', frequencia: '94,1 FM', atos: [1, 2], tecnica: 'escassez', autoria: 'rascunho-ia',
    falas: [
      { quem: 'Voz rouca', texto: 'Atenção, quem estiver na escuta. Suprimentos médicos no Posto Km 40.', efeito: 'chiado', alegacao: 'saq-remedios' },
      { quem: 'Voz rouca', texto: 'Só até o amanhecer. Depois a gente fecha e some.', efeito: 'chiado', alegacao: 'saq-prazo' },
    ],
    alegacoes: [
      { id: 'saq-remedios', tipo: 'conteudo', disseram: 'Suprimentos médicos no Posto Km 40.', verdade: 'falso', real: 'Não há remédio no posto. É isca: dois carros virados fecham a pista e tem gente armada na loja de conveniência.', local: 'posto', comoVerificar: ['ir'] },
      { id: 'saq-prazo', tipo: 'prazo', disseram: 'Só até o amanhecer.', verdade: 'falso', real: 'A mesma oferta volta todo dia às 18h, com o mesmo prazo. O amanhecer nunca fecha nada.', comoVerificar: ['tempo'] },
    ],
  },
  {
    id: 'filhos-vigilia', emissor: 'filhos', frequencia: '88,3 FM', atos: [1, 2, 3], tecnica: 'prova_social', autoria: 'rascunho-ia',
    falas: [
      { quem: 'Irmã Clara', texto: 'A voz mente. O brilho não. Aqui todo mundo cabe.', efeito: 'interferencia' },
      { quem: 'Irmã Clara', texto: 'Mais de quarenta irmãos já se juntaram à Luz no Pântano.', alegacao: 'filhos-quarenta' },
      { quem: 'Irmã Clara', texto: 'Aqui o brilho não queima. A Luz protege quem chega.', alegacao: 'filhos-brilho' },
    ],
    alegacoes: [
      { id: 'filhos-quarenta', tipo: 'adesao', disseram: 'Mais de quarenta irmãos já se juntaram à Luz.', verdade: 'falso', real: 'No acampamento há 6 pessoas: duas fogueiras e três barracas.', local: 'pantano', comoVerificar: ['ir', 'cruzar'] },
      { id: 'filhos-brilho', tipo: 'radiacao', disseram: 'Aqui o brilho não queima.', verdade: 'falso', real: 'O acampamento fica numa mancha quente: o Geiger dispara perto das barracas.', local: 'pantano', comoVerificar: ['geiger'] },
    ],
  },
  {
    id: 'milicia-boletim', emissor: 'milicia', frequencia: 'AM 640', atos: [1, 3, 4], tecnica: 'autoridade', autoria: 'rascunho-ia',
    falas: [
      { quem: 'Sargento Vidal', texto: 'Boletim do Posto Militar 14.', efeito: 'vinheta' },
      { quem: 'Sargento Vidal', texto: 'Ordem do Governo Provisório: entregue 10 galões e receba proteção.', alegacao: 'mil-governo' },
      { quem: 'Sargento Vidal', texto: 'A rota pelo Posto 14 é a única limpa até o norte.', alegacao: 'mil-rota' },
    ],
    alegacoes: [
      { id: 'mil-governo', tipo: 'autoridade', disseram: 'Ordem do Governo Provisório: entregue 10 galões e receba proteção.', verdade: 'falso', real: 'Não existe Governo Provisório na região. O carimbo é do batalhão antigo e a ordem foi escrita pela própria Milícia.', comoVerificar: ['cruzar'] },
      { id: 'mil-rota', tipo: 'radiacao', disseram: 'A rota pelo Posto 14 é a única limpa até o norte.', verdade: 'meia', real: 'É mais limpa que o ermo, mas não é a única, e tem um trecho quente na entrada do Posto.', local: 'militar', comoVerificar: ['geiger'] },
    ],
  },
  {
    id: 'px-dona-cida', emissor: 'px', frequencia: 'Canal 11 PX', atos: [1, 2, 3, 4], tecnica: 'nenhuma', autoria: 'rascunho-ia',
    falas: [
      { quem: 'Dona Cida', texto: 'Câmbio, aqui é a Cida, do caminhão azul.', efeito: 'chiado' },
      { quem: 'Dona Cida', texto: 'Tem água limpa no poço atrás do Hospital São Judas. A bomba é manual, leva corda.', alegacao: 'px-poco' },
      { quem: 'Dona Cida', texto: 'E o Ermo baixou depois da chuva. Câmbio, desligo.', alegacao: 'px-ermo' },
    ],
    alegacoes: [
      { id: 'px-poco', tipo: 'conteudo', disseram: 'Tem água limpa no poço atrás do Hospital São Judas.', verdade: 'verdade', real: 'Tem mesmo: poço com bomba manual atrás do hospital, água limpa.', local: 'hospital', comoVerificar: ['ir', 'cruzar'] },
      { id: 'px-ermo', tipo: 'radiacao', disseram: 'O Ermo baixou depois da chuva.', verdade: 'verdade', real: 'Baixou: a leitura no Ermo depois da chuva fica perto do fundo.', local: 'ermo', comoVerificar: ['geiger'] },
    ],
  },
];
