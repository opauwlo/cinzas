// i18n leve da narrativa (puro). Decisão em INTEGRACAO.md: feito aqui sobre Intl.PluralRules (ECMA-402, já no navegador)
// porque a sintaxe do contrato ({o|a}, {n}) não é a do rosetta/templite ({{x}}) nem a do i18next (plural por sufixo de chave).
//
// Sintaxe no texto (o roteirista escreve assim):
//   {n}                 interpola a variável n
//   {o|a}  {O|A} Cris   gênero de Cris: 1ª forma = masculino, 2ª = feminino (qualquer par sem ":" dentro)
//   {n:uma lata|# latas} plural pela variável n (regra do idioma); # vira o número
import type { Genero, Idioma, Traduzir } from '../../nucleo/contratos';

export type Catalogo = Readonly<Record<string, string>>;

const RE_PLURAL = /\{(\w+):([^{}|]*)\|([^{}]*)\}/g;
const RE_GENERO = /\{([^{}|:]*)\|([^{}|:]*)\}/g;
const RE_VAR = /\{(\w+)\}/g;
const regras = new Map<string, Intl.PluralRules>();
const regra = (idioma: Idioma) => { let r = regras.get(idioma); if (!r) { r = new Intl.PluralRules(idioma === 'pt' ? 'pt-BR' : 'en-US'); regras.set(idioma, r); } return r; };

/** resolve plural, gênero e variáveis de um texto já escolhido no catálogo */
export function formatar(texto: string, vars: Record<string, string | number> = {}, genero: Genero = 'o', idioma: Idioma = 'pt'): string {
  const g: Genero = vars.g === 'a' || vars.g === 'o' ? vars.g : genero;
  return texto
    .replace(RE_PLURAL, (_, v: string, um: string, muitos: string) => {
      const n = Number(vars[v] ?? 0);
      return (regra(idioma).select(n) === 'one' ? um : muitos).replaceAll('#', String(n));
    })
    .replace(RE_GENERO, (_, m: string, f: string) => (g === 'a' ? f : m))
    .replace(RE_VAR, (todo, v: string) => (v in vars ? String(vars[v]) : todo));
}

// ---------------------------------------------------------------- pseudo-localização (+30%) para testar layout a 360 px
const ACENTO: Record<string, string> = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', c: 'ç', n: 'ñ', y: 'ý', A: 'Å', E: 'É', I: 'Í', O: 'Ó', U: 'Ú', C: 'Ç', N: 'Ñ' };
export const PSEUDO_FATOR = 1.3;
/** troca letras por acentuadas, mantém {placeholders} intactos e alonga ~30% com "·" entre colchetes ⟦ ⟧ (o texto cortado fica visível) */
export function pseudoLocalizar(texto: string): string {
  let dentro = 0, s = '';
  for (const ch of texto) { if (ch === '{') dentro++; if (ch === '}') dentro = Math.max(0, dentro - 1); s += dentro ? ch : (ACENTO[ch] ?? ch); }
  const alvo = Math.ceil(comprimento(texto) * PSEUDO_FATOR), extra = Math.max(0, alvo - comprimento(s) - 2);
  return '⟦' + s + '·'.repeat(extra) + '⟧';
}

/** comprimento visível (em pontos de código, não em unidades UTF-16) */
export const comprimento = (s: string) => [...s].length;

// ---------------------------------------------------------------- tradutor
export type OpcoesTradutor = { idioma: Idioma; genero: Genero; pseudo?: boolean; /** chamado quando a chave não existe em nenhum idioma */ faltou?: (chave: string) => void };

/** `t(chave, vars)`: procura no idioma pedido, cai para o português (original) e, sem nada, devolve a própria chave entre colchetes */
export function criarTradutor(catalogos: Partial<Record<Idioma, Catalogo>>, op: OpcoesTradutor): Traduzir {
  return (chave, vars) => {
    const bruto = catalogos[op.idioma]?.[chave] ?? catalogos.pt?.[chave];
    if (bruto === undefined) { op.faltou?.(chave); return `[${chave}]`; }
    const pronto = formatar(bruto, vars, op.genero, op.idioma);
    return op.pseudo ? pseudoLocalizar(pronto) : pronto;
  };
}

/** chaves do original sem tradução no idioma */
export const semTraducao = (pt: Catalogo, outro: Catalogo) => Object.keys(pt).filter(k => !(k in outro)).sort();

/** palavras de um texto, sem as marcas de formatação (para orçar a tradução) */
export function palavras(texto: string): number {
  const limpo = formatar(texto, {}, 'o').replace(/[{}[\]⟦⟧()#]/g, ' ');
  return limpo.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
}
