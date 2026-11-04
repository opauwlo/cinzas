// Telemetria honesta (Plano GOTY, producao.md §5.2–5.3). Regras que o código garante e os testes provam:
//  - desligada por padrão: sem consentimento, `registrar` não guarda nem na memória;
//  - consentimento só de quem declarou 18 anos ou mais; quem se declara menor não tem nada guardado (nem a própria declaração);
//  - fila local com limite (MAX_EVENTOS) e retenção de 90 dias; `apagar` limpa e troca o id aleatório; revogar apaga tudo;
//  - envio só se houver endpoint configurado E consentimento (formato do Umami /api/send, sem carregar o script de rastreio dele).
// Puro: o armazenamento e o relógio são injetados (localStorage e Date.now no navegador; memória nos testes).
import type { EventoTelemetria, Telemetria } from '../../nucleo/contratos';

export const CHAVE = 'cinzas.telemetria';
export const MAX_EVENTOS = 500;
export const RETENCAO_DIAS = 90;
const DIA_MS = 86_400_000;

export interface Armazem { ler(chave: string): string | null; gravar(chave: string, v: string): void; remover(chave: string): void }
export function armazemMemoria(): Armazem & { dump(): Record<string, string> } {
  const m = new Map<string, string>();
  return { ler: k => m.get(k) ?? null, gravar: (k, v) => { m.set(k, v); }, remover: k => { m.delete(k); }, dump: () => Object.fromEntries(m) };
}
/** localStorage pode não existir (modo privado, artifact) ou lançar: aí vira memória e nada sobrevive ao fechar */
export function armazemNavegador(): Armazem {
  try { const ls = globalThis.localStorage; ls.getItem(CHAVE); return { ler: k => { try { return ls.getItem(k); } catch { return null; } }, gravar: (k, v) => { try { ls.setItem(k, v); } catch { /* cheio */ } }, remover: k => { try { ls.removeItem(k); } catch { /* */ } } }; }
  catch { return armazemMemoria(); }
}

export type Idade = 'nao_informada' | 'menor' | 'adulto';
export type Guardado = {
  v: 1; /** id aleatório local; troca ao apagar e some ao revogar */ id: string; /** quando consentiu (ms) */ desde: number;
  fila: EventoTelemetria[]; /** dos últimos da fila, quantos ainda não foram enviados */ pendentes: number;
  /** marcos do funil já vistos (1º saque, 1ª viagem…), para registrar cada um uma vez só */ marcos: string[];
  enviados: number; descartados: number;
};
export type ConfigEnvio = { url?: string; site?: string };

/** endpoint só existe se a build trouxer as duas variáveis; sem elas, nada sai do aparelho mesmo com consentimento */
export function configDoAmbiente(): ConfigEnvio {
  try { return { url: process.env.NEXT_PUBLIC_TELEMETRIA_URL || undefined, site: process.env.NEXT_PUBLIC_TELEMETRIA_SITE || undefined }; } catch { return {}; }
}

const NOME_OK = /^[a-z0-9_]{1,40}$/;
/** chaves que nunca entram, mesmo que alguém tente registrar (defesa em profundidade) */
export const CHAVES_PROIBIDAS = /^(nome|email|e_mail|ip|lat|lon|lng|localizacao|endereco|cidade|telefone|idade|cpf|ua|user_?agent|modelo)$/i;

function limparDados(d?: Record<string, number | string | boolean>): Record<string, number | string | boolean> | undefined {
  if (!d) return undefined;
  const o: Record<string, number | string | boolean> = {}; let n = 0;
  for (const [k, v] of Object.entries(d)) {
    if (n >= 12 || !NOME_OK.test(k) || CHAVES_PROIBIDAS.test(k)) continue;
    if (typeof v === 'number') { if (!Number.isFinite(v)) continue; o[k] = Math.round(v * 100) / 100; }
    else if (typeof v === 'string') { if (/@/.test(v)) continue; o[k] = v.slice(0, 60); }
    else o[k] = v;
    n++;
  }
  return n ? o : undefined;
}

export function idAleatorio(): string {
  const b = new Uint8Array(8);
  try { globalThis.crypto.getRandomValues(b); } catch { for (let i = 0; i < 8; i++) b[i] = Math.floor(Math.random() * 256); }
  return Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
}

export class TelemetriaLocal implements Telemetria {
  private g: Guardado | null = null;
  private idade: Idade = 'nao_informada';
  constructor(private armazem: Armazem = armazemMemoria(), private agora: () => number = () => Date.now(), readonly envio: ConfigEnvio = {}) {
    try {
      const bruto = armazem.ler(CHAVE); const g = bruto ? (JSON.parse(bruto) as Guardado) : null;
      if (g && g.v === 1 && Array.isArray(g.fila)) { this.g = g; this.idade = 'adulto'; this.podar(); this.gravar(); }
      else if (bruto) armazem.remover(CHAVE);
    } catch { armazem.remover(CHAVE); }
  }
  consentiu() { return this.g !== null && this.idade === 'adulto'; }
  idadeDeclarada(): Idade { return this.idade; }
  /** autodeclaração. "menor" apaga tudo na hora e bloqueia o consentimento nesta sessão; não é guardada */
  declararIdade(i: 'menor' | 'adulto') { this.idade = i; if (i === 'menor') this.revogar(); }
  /** sim = liga (só se a idade declarada for 18+); não = revoga e apaga tudo, inclusive o id */
  definirConsentimento(sim: boolean) {
    if (!sim) { this.revogar(); return; }
    if (this.idade !== 'adulto' || this.g) return;
    this.g = { v: 1, id: idAleatorio(), desde: this.agora(), fila: [], pendentes: 0, marcos: [], enviados: 0, descartados: 0 };
    this.gravar();
  }
  registrar(nome: string, dados?: Record<string, number | string | boolean>) {
    if (!this.consentiu() || !NOME_OK.test(nome)) return;
    const g = this.g!; g.fila.push({ nome, t: this.agora(), dados: limparDados(dados) }); g.pendentes++;
    this.podar(); this.gravar();
  }
  /** registra o marco só na primeira vez (funil); devolve se registrou */
  marco(nome: string, dados?: Record<string, number | string | boolean>): boolean {
    if (!this.consentiu() || this.g!.marcos.includes(nome)) return false;
    this.g!.marcos.push(nome); this.registrar(nome, dados); return true;
  }
  exportar(): EventoTelemetria[] { if (!this.g) return []; this.podar(); return this.g.fila.map(e => ({ ...e, dados: e.dados && { ...e.dados } })); }
  /** limpa o que foi medido e troca o id; o consentimento continua */
  apagar() {
    if (!this.g) { this.armazem.remover(CHAVE); return; }
    Object.assign(this.g, { id: idAleatorio(), fila: [], pendentes: 0, marcos: [], descartados: 0 }); this.gravar();
  }
  /** estado para a tela "O que medimos" (sem o id, que não interessa a ninguém) */
  estado() {
    const g = this.g;
    return { consentiu: this.consentiu(), idade: this.idade, desde: g?.desde, eventos: g?.fila.length ?? 0, pendentes: g?.pendentes ?? 0, enviados: g?.enviados ?? 0, descartados: g?.descartados ?? 0, maisAntigo: g?.fila[0]?.t, endpoint: !!(this.envio.url && this.envio.site) };
  }
  podeEnviar() { return this.consentiu() && !!this.envio.url && !!this.envio.site; }
  /** eventos ainda não enviados (vazio se não pode enviar) */
  pendentes(): EventoTelemetria[] { if (!this.podeEnviar()) return []; const f = this.g!.fila; return f.slice(f.length - this.g!.pendentes); }
  /** confirma que os `n` mais antigos dos pendentes chegaram ao servidor */
  confirmarEnvio(n: number) { if (!this.g) return; const k = Math.max(0, Math.min(n, this.g.pendentes)); this.g.pendentes -= k; this.g.enviados += k; this.gravar(); }
  /** monta o corpo no formato do Umami (/api/send) — conferir com a versão do servidor instalada */
  corpoUmami(e: EventoTelemetria) {
    return { type: 'event', payload: { website: this.envio.site!, hostname: 'cinzas', url: '/jogo', language: 'pt-BR', name: e.nome, data: { ...(e.dados ?? {}), sid: this.g?.id ?? '' } } };
  }
  /** envia os pendentes, um por requisição; para no primeiro erro (tenta de novo depois) */
  async enviar(post: (url: string, corpo: string) => Promise<boolean>): Promise<number> {
    const lote = this.pendentes().slice(0, 50); let ok = 0;
    for (const e of lote) { if (!this.podeEnviar()) break; let foi = false; try { foi = await post(this.envio.url!, JSON.stringify(this.corpoUmami(e))); } catch { foi = false; } if (!foi) break; ok++; }
    if (ok) this.confirmarEnvio(ok);
    return ok;
  }

  private revogar() { this.g = null; this.armazem.remover(CHAVE); }
  private podar() {
    const g = this.g; if (!g) return;
    const corte = this.agora() - RETENCAO_DIAS * DIA_MS; let tirar = 0;
    while (tirar < g.fila.length && g.fila[tirar].t < corte) tirar++;
    if (g.fila.length - tirar > MAX_EVENTOS) { const exc = g.fila.length - tirar - MAX_EVENTOS; g.descartados += exc; tirar += exc; }
    if (tirar) { g.fila.splice(0, tirar); g.pendentes = Math.min(g.pendentes, g.fila.length); }
  }
  private gravar() { if (this.g) this.armazem.gravar(CHAVE, JSON.stringify(this.g)); }
}
