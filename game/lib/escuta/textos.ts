// Textos da Escuta que a interface mostra (rótulos, carimbos, "por quê" de cada técnica). Puro.
// Política de IA: tudo aqui nasceu como rascunho de IA até um humano revisar.
import type { Autoria, EmissorId, EstadoFicha, Instrumento, Tecnica } from '../../nucleo/contratos';
import type { FichaEscuta } from './caderno';

export const AUTORIA_TEXTOS: Autoria = 'rascunho-ia';

export const EMISSORES: Readonly<Record<EmissorId, { nome: string; artigo: 'a' | 'os' | 'um' }>> = {
  farol: { nome: 'Farol', artigo: 'a' },
  filhos: { nome: 'Filhos do Cinza', artigo: 'os' },
  milicia: { nome: 'Milícia Velha', artigo: 'a' },
  saqueadores: { nome: 'Saqueadores do Km 40', artigo: 'os' },
  px: { nome: 'Rede PX', artigo: 'a' },
  sobrevivente: { nome: 'Sobrevivente', artigo: 'um' },
};

/** o mesmo formato do Modo Estudo (Manip.porque): por que a técnica funciona em gente */
export const TECNICAS: Readonly<Record<Tecnica, { nome: string; porque: string }>> = {
  escassez: { nome: 'Escassez e prazo falso', porque: 'Pouco e só até tal hora corta o tempo de pensar. Quem tem medo de perder não confere.' },
  prova_social: { nome: 'Prova social inventada', porque: 'Sob incerteza a gente copia a maioria. Um número grande e redondo faz a dúvida parecer teimosia.' },
  autoridade: { nome: 'Autoridade', porque: 'Carimbo, patente e "ordem do governo" pedem obediência antes de pedir prova.' },
  ancoragem: { nome: 'Ancoragem', porque: 'O primeiro número dito vira a régua. Dez galões parece razoável depois de ouvir "ou tudo".' },
  quase_la: { nome: 'Quase lá', porque: 'Quem já andou muito não quer ter andado à toa. "Faltam 3 dias" pesa mais que a estrada.' },
  reciprocidade: { nome: 'Reciprocidade', porque: 'Um presente pequeno cria uma dívida grande. Quem recebeu sente que precisa devolver.' },
  pertencimento: { nome: 'Pertencimento', porque: 'Sozinho no cinza, "aqui todo mundo cabe" vale mais que qualquer comida.' },
  meia_verdade: { nome: 'Meia-verdade', porque: 'A parte verdadeira empresta credibilidade à parte que falta.' },
  nenhuma: { nome: 'Nenhuma', porque: 'Falou reto. Nem toda voz no rádio quer te levar para algum lugar.' },
};

export const INSTRUMENTOS: Readonly<Record<Instrumento, { nome: string; custo: string; como: string }>> = {
  geiger: { nome: 'Geiger', custo: 'ir até lá e tomar a dose', como: 'Medi com o Geiger no local.' },
  triangular: { nome: 'Triangular', custo: '1 h de jogo e 1 bateria', como: 'Triangulei o sinal no rádio do abrigo.' },
  cruzar: { nome: 'Cruzar fontes', custo: 'conversar, ler bilhetes, observar', como: 'Cruzei com outra fonte.' },
  tempo: { nome: 'Observar o tempo', custo: 'nenhum, só atenção', como: 'Ouvi de novo noutro dia, com o mesmo prazo.' },
  ir: { nome: 'Ir ver', custo: 'a viagem', como: 'Fui ver com os meus olhos.' },
};

/** quando o instrumento é automático, o que o jogador precisa fazer para ele resolver sozinho */
export const COMO_RESOLVE_SOZINHO: Partial<Record<Instrumento, string>> = {
  tempo: 'Se voltar ao ar noutro dia com o mesmo prazo, o Caderno marca sozinho.',
  ir: 'Vá até o lugar: ao chegar, o Caderno anota o que você viu.',
  geiger: 'Leia o Geiger no lugar: a leitura fecha a ficha.',
};

export type Carimbo = { texto: string; cor: string };
/** o carimbo da ficha (as cores são variáveis do globals.css) */
export function carimbo(f: Pick<FichaEscuta, 'estado' | 'comoDescobri'> & { tipo?: string }): Carimbo | null {
  const e: EstadoFicha = f.estado;
  if (e === 'aberta') return null;
  if (e === 'verdade') return { texto: 'VERIFICADO', cor: 'var(--fosf)' };
  if (e === 'meia') return { texto: 'MEIA-VERDADE', cor: 'var(--ambar)' };
  return { texto: f.comoDescobri === 'tempo' ? 'PRAZO FALSO' : 'FALSO', cor: 'var(--sangue2)' };
}

/** o que a ficha mostra. Regra de ouro: `real` e técnica só aparecem depois de resolvida. */
export type TextoFicha = { emissor: string; disseram: string; carimbo: Carimbo | null; real?: string; tecnica?: string; porque?: string; como?: string; nota?: string; dia: string };
export function textoFicha(f: FichaEscuta): TextoFicha {
  // quem é o emissor de verdade é uma das coisas que a verificação revela (triangular): aberta, a ficha mostra só a frequência
  const quem = f.estado === 'aberta' ? `Voz em ${f.frequencia ?? '?'}` : EMISSORES[f.emissor].nome;
  const base: TextoFicha = { emissor: quem, disseram: `“${f.disseram}”`, carimbo: carimbo(f), dia: `dia ${f.dia}` };
  if (f.estado === 'aberta') return base;
  const tec = TECNICAS[f.tecnica];
  const como = f.nuncaFoiVer ? 'Você nunca foi ver. O fim do ato contou.' : f.comoDescobri === 'geiger' && f.cpm !== undefined ? `O Geiger leu ${f.cpm} cpm no local.` : f.comoDescobri ? INSTRUMENTOS[f.comoDescobri].como : undefined;
  const nota = f.vidaDescoberta ? `Anotado na vida ${f.vidaDescoberta}. O Caderno lembrou.` : undefined;
  return { ...base, real: f.real, tecnica: tec.nome, porque: tec.porque, como, nota };
}

/** o recorte para compartilhar: "a Milícia me disse X. Era Y." (só existe para ficha resolvida) */
export function textoRecorte(f: FichaEscuta): string | null {
  if (f.estado === 'aberta' || !f.real) return null;
  const em = EMISSORES[f.emissor], quem = `${em.artigo[0].toUpperCase()}${em.artigo.slice(1)} ${em.artigo === 'um' ? em.nome.toLowerCase() : em.nome}`;
  const verbo = em.artigo === 'os' ? 'me disseram' : 'me disse';
  const fecho = f.estado === 'verdade' ? 'E era verdade.' : f.estado === 'meia' ? `Era meia-verdade: ${f.real}` : `Era: ${f.real}`;
  return `${quem} ${verbo} no rádio: “${f.disseram}”\n${fecho}\n— Caderno de Escuta, CINZAS`;
}

export const hhmm = (minuto: number) => `${String(Math.floor(minuto / 60) % 24).padStart(2, '0')}h${String(minuto % 60).padStart(2, '0')}`;
