// Texto do "copiar relatório" do Diag: feito para o Uwlo colar no chat do celular. Puro.
import { veredito, type ResumoCompleto } from './desempenho';
import { aparelhoCurto, type Aparelho } from './aparelho';

export type DadosRelatorio = {
  quando: Date; resumo: ResumoCompleto; aparelho: Aparelho;
  inpMs?: number; memJs?: { usadoMb: number; limiteMb: number } | null; texturas?: { mb: number; texturas: number } | null;
  zona?: string; escala?: number; demo?: boolean; versao?: string; segundos?: number;
};

const n2 = (v: number) => String(v).padStart(2, '0');

export function relatorioTexto(d: DadosRelatorio): string {
  const r = d.resumo, v = veredito(r), q = d.quando, a = d.aparelho;
  const linhas = [
    `CINZAS · diagnóstico · ${q.getFullYear()}-${n2(q.getMonth() + 1)}-${n2(q.getDate())} ${n2(q.getHours())}:${n2(q.getMinutes())}${d.versao ? ' · v' + d.versao : ''}${d.demo ? ' · DEMO' : ''}`,
    `aparelho: ${a.modelo ? a.modelo + ' · ' : ''}${aparelhoCurto(a)}`,
    `webgl ${a.webgl || 'não'}${a.maxTextura ? ` · textura máx ${a.maxTextura}` : ''}`,
    `quadros: ${r.amostras}${d.segundos ? ` em ${d.segundos} s` : ''} · ${r.fps} fps · p50 ${r.p50ms} ms · p95 ${r.p95ms} ms · pior ${r.piorMs} ms · travadas ${r.travadas}${r.pausas ? ` · pausas ${r.pausas}` : ''}`,
    `leitura: ${v.nota} (meta: p95 < 33 ms) · ${v.texto}`,
    `toque (INP): ${d.inpMs !== undefined ? d.inpMs + ' ms' : 'sem medida (toque na tela; Safari pode não medir)'}`,
    `memória: JS ${d.memJs ? `${d.memJs.usadoMb}/${d.memJs.limiteMb} MB` : 'não informada'} · texturas ${d.texturas ? `~${d.texturas.mb} MB em ${d.texturas.texturas}` : 'não informadas'}`,
  ];
  if (d.zona || d.escala !== undefined) linhas.push(`jogo: ${d.zona ?? '?'}${d.escala !== undefined ? ` · escala ${d.escala}` : ''}`);
  return linhas.join('\n');
}
