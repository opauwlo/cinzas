// API pública da lib de Narrativa (pura: sem Phaser, sem DOM). A coordenação importa só daqui.
import type { BilheteLore, Fita, Genero, Idioma, ModuloJogo, Mundo, Transmissao, Traduzir } from '../../nucleo/contratos';
import { PT } from './catalogo';
import { EN } from './en';
import { criarTradutor } from './i18n';
import { CENA_640_ATO1, CENAS, roteiroCena, registrar } from './cena640';
import { paginaCadernoLia, desenhoParede } from './caderno-lia';
import type { Cena, RegistroEscolha, Tom } from './tipos';

export { PERSONAGENS, FACCOES, CRONOLOGIA } from './biblia';
export { TRANSMISSOES, FAROL_SEMANA, PROGRAMA_FAROL, farolDoDia, ALEGACOES, QUEM } from './transmissoes';
export { FITAS, FITAS_ESBOCO } from './fitas';
export { BILHETES, TROCA_NOTAS } from './bilhetes';
export { telasAbertura, ABERTURA_PT, CHAMADA_MENU_PT } from './abertura';
export { telaMorte, causaDe } from './morte';
export type { TelaMorte, EntradaMorte, Saber, CausaMorte } from './morte';
export { PASSOS, ATOS_NARRATIVOS, FALAS_NPC_PROPOSTA, textoHud } from './passos';
export { CENAS, CENA_640_ATO1, roteiroCena, registrar } from './cena640';
export type { PassoCena } from './cena640';
export { paginaCadernoLia, desenhoParede, tossiuNoDia } from './caderno-lia';
export { formatar, pseudoLocalizar, criarTradutor, comprimento, palavras } from './i18n';
export { PT } from './catalogo';
export { EN } from './en';
export { PENDENTES_EN } from './pendentes-en';
export { LIMITES } from './tipos';
export type { Passo, Cena, Tom, RegistroEscolha, TipoTexto } from './tipos';

/** o tradutor do jogo: português é o original; o inglês cai no português onde ainda falta tradução */
export const tradutor = (idioma: Idioma = 'pt', genero: Genero = 'o', pseudo = false): Traduzir =>
  criarTradutor({ pt: PT, en: EN }, { idioma, genero, pseudo });

/** cópia da transmissão no idioma do tradutor (a Escuta toca esta; ids e efeitos não mudam) */
export function localizarTransmissao(tr: Transmissao, t: Traduzir): Transmissao {
  return {
    ...tr,
    falas: tr.falas.map((f, i) => ({ ...f, quem: t(`quem.${f.quem}`), texto: t(`tr.${tr.id}.${i}`) })),
    alegacoes: tr.alegacoes.map(a => ({ ...a, disseram: t(`al.${a.id}.disseram`), real: t(`al.${a.id}.real`) })),
  };
}
export const localizarBilhete = (b: BilheteLore, t: Traduzir): BilheteLore => ({ ...b, titulo: t(`bilhete.${b.id}.titulo`), texto: t(`bilhete.${b.id}.texto`) });
export const localizarFita = (f: Fita, t: Traduzir): Fita => ({ ...f, titulo: t(`fita.${f.id}.titulo`), transcricao: f.transcricao.split('\n').map((_, i) => t(`fita.${f.id}.${i}`)).join('\n') });

// ---------------------------------------------------------------- módulo de jogo (estado da história na run)
export type EstadoNarrativa = {
  /** escolhas com a Lia (texto é refeito no idioma atual a partir do tom) */ escolhas: { escolha: string; tom: Tom; dia: number }[];
  cenasVistas: string[];
  /** dias em que a Farol das 6h40 tocou na base (a Lia ouve todo dia) */ diasOuvidos: number[];
};
const MINUTO_640 = 400;
const minutoDoDia = (m: Mundo) => Math.floor(m.hora * 60);

class ModuloNarrativa implements ModuloJogo<EstadoNarrativa> {
  readonly id = 'narrativa';
  private s: EstadoNarrativa = { escolhas: [], cenasVistas: [], diasOuvidos: [] };
  private ultimo: number | null = null;
  iniciar(m: Mundo) { this.ultimo = m.minutos; }
  tick(_dt: number, m: Mundo) {
    // cruzou um 6h40 desde o último quadro (também quando o relógio pula: dormir, viajar). m.minutos é o relógio absoluto.
    // A Lia fica na base e ouve todo dia, mesmo com Cris dormindo ou na estrada: entra cada 6h40 cruzada (a do dia d é a janela d − 1).
    const janela = (min: number) => Math.floor((min - MINUTO_640) / 1440);
    if (this.ultimo !== null) for (let k = Math.max(janela(this.ultimo) + 1, janela(m.minutos) - 60); k <= janela(m.minutos); k++) if (k >= 0 && !this.s.diasOuvidos.includes(k + 1)) this.s.diasOuvidos.push(k + 1);
    this.ultimo = m.minutos;
  }
  salvar(): EstadoNarrativa { return structuredClone(this.s); }
  carregar(s: EstadoNarrativa | undefined) { this.s = s ? { escolhas: [...(s.escolhas ?? [])], cenasVistas: [...(s.cenasVistas ?? [])], diasOuvidos: [...(s.diasOuvidos ?? [])] } : { escolhas: [], cenasVistas: [], diasOuvidos: [] }; }

  /** a cena que deve abrir agora (ou null). `ato1Concluido` vem da campanha (passo "noite" feito) */
  cenaPendente(m: Mundo, ato1Concluido: boolean): Cena | null {
    const c = CENA_640_ATO1, min = minutoDoDia(m);
    if (!ato1Concluido || this.s.cenasVistas.includes(c.id) || m.zona.id !== c.local) return null;
    return min >= c.minuto && min < c.minuto + 20 ? c : null;
  }
  /** a escolha foi feita: registra e devolve o texto para "O QUE FOI DITO" */
  escolher(cenaId: string, tom: Tom, dia: number, t: Traduzir): RegistroEscolha {
    const c = CENAS.find(x => x.id === cenaId); if (!c) throw new Error(`cena desconhecida: ${cenaId}`);
    if (!this.s.cenasVistas.includes(c.id)) this.s.cenasVistas.push(c.id);
    this.s.escolhas = [...this.s.escolhas.filter(e => e.escolha !== c.escolha.id), { escolha: c.escolha.id, tom, dia }];
    return registrar(c, tom, dia, t);
  }
  /** tudo o que Cris disse à Lia, no idioma atual (para a tela final) */
  oQueVoceDisse(t: Traduzir): RegistroEscolha[] {
    return this.s.escolhas.flatMap(e => { const c = CENAS.find(x => x.escolha.id === e.escolha); return c ? [registrar(c, e.tom, e.dia, t)] : []; });
  }
  paginaLia(t: Traduzir, ato: number, fim = false) { return paginaCadernoLia(t, { ato, diasOuvidos: this.s.diasOuvidos, escolhas: this.s.escolhas, fim }); }
  parede(t: Traduzir, ato: number) { return desenhoParede(t, ato, this.s.escolhas.find(e => e.escolha === 'lia1')?.tom); }
  estado(): Readonly<EstadoNarrativa> { return this.s; }
}

/** o ModuloJogo para registrar em game/nucleo/modulos.ts */
export const narrativa = new ModuloNarrativa();
export const novaNarrativa = () => new ModuloNarrativa();
export { roteiroCena as tocarCena };
