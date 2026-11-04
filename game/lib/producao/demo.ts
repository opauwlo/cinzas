// Build de demo pública (Plano GOTY: demo web desde mar/2027 = Ato I + seed diária). Tribeca e o Steam Next Fest pedem jogo
// "não lançado": por isso o deploy público vira demo e o jogo inteiro sai do ar. Liga com NEXT_PUBLIC_DEMO=1 na build.
// Puro: as funções recebem o modo e os ids; nada aqui lê a cena.
import type { ModoDemo } from '../../nucleo/contratos';

/** ordem da campanha (ids de game/dados/objetivos.ts). Cópia de propósito: o teste confere que bate com OBJETIVOS. */
export const ORDEM_ATO_I = ['madeira', 'fabricar', 'comer', 'jipe', 'saque5', 'abater3', 'noite'] as const;

export const MENSAGEM_FIM_DEMO =
  'Fim da demo. Você sobreviveu ao Ato I de quatro. O jogo completo ainda não foi lançado e nada aqui está à venda. ' +
  'O seu progresso fica neste aparelho. Se quiser, conte para a gente o que achou: o que confundiu e o que você faria amanhã.';

export const DEMO_DESLIGADA: ModoDemo = { ativo: false, locais: [], ultimoObjetivo: '', mensagemFim: '' };
export const DEMO_ATO_I: ModoDemo = { ativo: true, locais: ['base', 'ermo'], ultimoObjetivo: 'noite', mensagemFim: MENSAGEM_FIM_DEMO };

/** valor bruto da variável de build; o try cobre o pacote do artifact (esbuild sem `process` no navegador) */
export function variavelDemo(): string | undefined { try { return process.env.NEXT_PUBLIC_DEMO; } catch { return undefined; } }

export function lerModoDemo(valor: string | undefined = variavelDemo()): ModoDemo {
  const v = (valor ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'sim' ? DEMO_ATO_I : DEMO_DESLIGADA;
}

/** o local pode ser escolhido no mapa? (fora da demo, quem decide é bloqueioLocal em locais.ts) */
export function localLiberado(d: ModoDemo, id: string): boolean { return !d.ativo || d.locais.includes(id); }

/** o passo da campanha existe na demo? `ordem` = ids na ordem de OBJETIVOS */
export function objetivoLiberado(d: ModoDemo, id: string, ordem: readonly string[]): boolean {
  if (!d.ativo) return true;
  const i = ordem.indexOf(id), fim = ordem.indexOf(d.ultimoObjetivo);
  return i >= 0 && fim >= 0 && i <= fim;
}

/** concluir este passo encerra a demo? */
export function encerraDemo(d: ModoDemo, idConcluido: string): boolean { return d.ativo && idConcluido === d.ultimoObjetivo; }

/** texto curto do mapa para um local trancado pela demo (honesto: diz por que e não promete data) */
export function motivoBloqueio(d: ModoDemo, id: string): string | null {
  return localLiberado(d, id) ? null : 'Fora da demo. Este lugar fica no jogo completo, que ainda não saiu.';
}
