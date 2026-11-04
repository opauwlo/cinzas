// Cena das 6h40 do fim do Ato I, com a escolha-chave 1 da Lia (roteiro §6.2). Dados próprios + tocador puro.
// O rádio no meio da cena é a Farol DO DIA (a da Programacao da Escuta), não um programa fixo: se a cena forçasse um dia,
// quebraria o loop que o jogador vai descobrir no Ato II. Toda a semana tem "tem médico", que é o que a Lia cita.
import type { Traduzir, EfeitoRadio } from '../../nucleo/contratos';
import type { Cena, EntradaTexto, LinhaCena, OpcaoCena, QuemCena, RegistroEscolha, TipoTexto, Tom } from './tipos';

const TIPO_DE: Record<QuemCena, TipoTexto> = { lia: 'evento', cena: 'evento', cris: 'pensamento', narradora: 'abertura' };

/** monta uma cena escrevendo o texto em português ao lado; devolve a cena (só chaves) e as entradas do catálogo */
function montar(id: string, f: (l: (quem: QuemCena, pt: string, efeito?: EfeitoRadio) => LinhaCena, o: (tom: Tom, botao: string, disse: string, verdade: string, resposta: LinhaCena[]) => OpcaoCena, pergunta: (pt: string) => string) => Omit<Cena, 'id'>) {
  const textos: EntradaTexto[] = []; let n = 0;
  const reg = (pt: string, tipo: TipoTexto, sufixo = String(n++)) => { const chave = `cena.${id}.${sufixo}`; textos.push({ chave, pt, tipo }); return chave; };
  const cena = f(
    (quem, pt, efeito) => ({ quem, chave: reg(pt, TIPO_DE[quem]), ...(efeito ? { efeito } : {}) }),
    (tom, botao, disse, verdade, resposta) => ({ tom, chave: reg(botao, 'opcao', `${tom}.botao`), disse: reg(disse, 'evento', `${tom}.disse`), verdade: reg(verdade, 'evento', `${tom}.verdade`), resposta }),
    pt => reg(pt, 'evento', 'pergunta'),
  );
  return { cena: { id, ...cena } as Cena, textos };
}

const { cena: CENA_640_ATO1, textos: TEXTOS_CENA_640 } = montar('640-ato1', (l, o, pergunta) => ({
  ato: 1, minuto: 400, local: 'base', autoria: 'rascunho-ia',
  gatilho: 'Primeiras 6h40 depois de concluir o passo "noite" (fim do Ato I), com Cris dentro do abrigo. Uma vez por campanha.',
  antes: [
    l('cena', '[6h39. A Lia já está sentada na frente do rádio, de pernas cruzadas, com o caderno aberto no colo.]'),
    l('lia', 'Shh. Vai começar.'),
  ],
  radio: { farolDoDia: true, interferencias: ['lume-porta'] },
  depois: [
    l('cena', '[A vinheta volta. A segunda nota falha de novo. A Lia escreve depressa, de língua de fora.]', 'vinheta_falha'),
  ],
  escolha: {
    id: 'lia1',
    pergunta: pergunta('Ela falou "tem médico". Viu? Tem médico.'),
    opcoes: [
      o('verdade', 'A gente vai ver.', 'A gente vai ver.', 'Você não sabia se tinha médico. Disse isso.', [
        l('lia', 'Por que você fala assim? Ela salvou você.'),
        l('cena', '[Ela escreve mais alguma coisa no caderno e tampa com o braço.]'),
      ]),
      o('protecao', 'Viu.', 'Viu.', 'Você não sabia se tinha médico.', [
        l('lia', 'Eu sabia. Ela nunca erra.'),
      ]),
      o('silencio', '(ficar em silêncio)', '(nada)', 'Você não sabia. E não disse.', [
        l('lia', 'Você tá com a cara da mãe quando ela dizia "depois a gente conversa".'),
      ]),
    ],
  },
  fecho: [
    l('cena', '[A Lia pega o giz e desenha na parede um jipe e um sol enorme.]'),
    l('lia', 'Esse é o sol. Ela falou que amanhã faz sol.'),
    l('cris', 'O rádio já voltou a chiar.'),
  ],
}));
export { CENA_640_ATO1, TEXTOS_CENA_640 };
export const CENAS: Cena[] = [CENA_640_ATO1];

// ---------------------------------------------------------------- tocador puro
export type PassoCena =
  | { tipo: 'linha'; quem: QuemCena; texto: string; efeito?: EfeitoRadio }
  | { tipo: 'radio'; farolDoDia: boolean; interferencias: string[] }
  | { tipo: 'escolha'; id: string; pergunta: string; opcoes: { tom: Tom; texto: string }[] }
  | { tipo: 'fim'; registro: RegistroEscolha };

const linha = (t: Traduzir, x: LinhaCena): PassoCena => ({ tipo: 'linha', quem: x.quem, texto: t(x.chave), ...(x.efeito ? { efeito: x.efeito } : {}) });

/** a cena inteira em ordem. Sem `tom`, para na escolha; com `tom`, segue com a resposta, o fecho e o registro */
export function roteiroCena(cena: Cena, t: Traduzir, tom?: Tom, dia = 0): PassoCena[] {
  const out: PassoCena[] = [...cena.antes.map(x => linha(t, x)), { tipo: 'radio', ...cena.radio }, ...cena.depois.map(x => linha(t, x)),
    { tipo: 'escolha', id: cena.escolha.id, pergunta: t(cena.escolha.pergunta), opcoes: cena.escolha.opcoes.map(o => ({ tom: o.tom, texto: t(o.chave) })) }];
  if (!tom) return out;
  const op = cena.escolha.opcoes.find(o => o.tom === tom);
  if (!op) throw new Error(`cena ${cena.id}: tom ${tom} não existe`);
  out.push(...op.resposta.map(x => linha(t, x)), ...cena.fecho.map(x => linha(t, x)), { tipo: 'fim', registro: registrar(cena, tom, dia, t) });
  return out;
}

/** o que vai para o save e para "O QUE FOI DITO" */
export function registrar(cena: Cena, tom: Tom, dia: number, t: Traduzir): RegistroEscolha {
  const op = cena.escolha.opcoes.find(o => o.tom === tom)!;
  return { escolha: cena.escolha.id, tom, disse: t(op.disse), verdade: t(op.verdade), dia };
}
