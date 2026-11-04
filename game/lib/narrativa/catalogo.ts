// O catálogo português é montado a partir do conteúdo (uma fonte só: o texto mora ao lado do dado que o usa). Puro.
import type { Catalogo } from './i18n';
import type { EntradaTexto } from './tipos';
import { TEXTOS_ABERTURA } from './abertura';
import { TEXTOS_BIBLIA } from './biblia';
import { TEXTOS_BILHETES } from './bilhetes';
import { TEXTOS_CADERNO_LIA } from './caderno-lia';
import { TEXTOS_CENA_640 } from './cena640';
import { TEXTOS_FITAS } from './fitas';
import { TEXTOS_MORTE } from './morte';
import { TEXTOS_PASSOS } from './passos';
import { TEXTOS_TRANSMISSOES } from './transmissoes';

export const ENTRADAS: readonly EntradaTexto[] = [
  ...TEXTOS_ABERTURA, ...TEXTOS_MORTE, ...TEXTOS_PASSOS, ...TEXTOS_CENA_640, ...TEXTOS_CADERNO_LIA,
  ...TEXTOS_TRANSMISSOES, ...TEXTOS_FITAS, ...TEXTOS_BILHETES, ...TEXTOS_BIBLIA,
];

function montar(): Catalogo {
  const o: Record<string, string> = {};
  for (const e of ENTRADAS) { if (e.chave in o) throw new Error(`chave repetida no catálogo: ${e.chave}`); o[e.chave] = e.pt; }
  return Object.freeze(o);
}
export const PT: Catalogo = montar();
export const tipoDe = (chave: string) => ENTRADAS.find(e => e.chave === chave)?.tipo;
