// Mapa-múndi: locais para viajar de jipe. Posições em um quadro 0..100 (o mapa na tela é pixel art desenhado por código).
export type Local = { id: string; /** nível mínimo do jogador para viajar até aqui (progressão linear: o mapa abre aos poucos) */ nivel: number; nome: string; bioma: string; x: number; y: number; perigo: number; desc: string; requer?: string; fixo?: boolean; /** tema de saque/inimigos (ver TEMAS em meta.ts) */ tema?: string };
export const LOCAIS: Local[] = [
  { id: 'base', nivel: 1, nome: 'Abrigo', bioma: 'base', x: 50, y: 80, perigo: 0, desc: 'Seu refúgio: bancada, baú, cama e horta.', fixo: true },
  { id: 'ermo', nivel: 1, nome: 'Ermo Cinzento', bioma: 'ermo', x: 24, y: 62, perigo: 1, desc: 'Crateras, ruínas e pouca gente. Bom para começar.' },
  { id: 'floresta', nivel: 2, nome: 'Floresta Morta', bioma: 'floresta', x: 78, y: 58, perigo: 2, desc: 'Madeira, caça e matilhas. A névoa esconde o perigo.' },
  { id: 'cidade', nivel: 4, nome: 'Cidade Velha', bioma: 'cidade', x: 46, y: 40, perigo: 3, desc: 'Muito saque, gangues e hordas.' },
  { id: 'pantano', nivel: 5, nome: 'Pântano Tóxico', bioma: 'pantano', x: 18, y: 28, perigo: 3, desc: 'Radiação alta, água rasa e plantas que brilham.' },
  { id: 'industrial', nivel: 7, nome: 'Refinaria 9', bioma: 'industrial', x: 80, y: 24, perigo: 4, desc: 'Combustível, sucata e mutantes gigantes.' },
  { id: 'posto', nivel: 2, nome: 'Posto Km 40', bioma: 'ermo', tema: 'posto', x: 68, y: 74, perigo: 2, desc: 'Bombas, carros e muito combustível. Os saqueadores também sabem disso.' },
  { id: 'hospital', nivel: 5, nome: 'Hospital São Judas', bioma: 'cidade', tema: 'hospital', x: 66, y: 42, perigo: 3, desc: 'Remédios e curativos… e quem ainda vaga pelos corredores.' },
  { id: 'torre', nivel: 6, nome: 'Torre de Rádio', bioma: 'ermo', tema: 'radio', x: 31, y: 14, perigo: 3, desc: 'Eletrônicos, baterias e uma interferência estranha no ar.' },
  { id: 'militar', nivel: 8, nome: 'Posto Militar 14', bioma: 'industrial', tema: 'militar', x: 63, y: 12, perigo: 4, desc: 'Armas e munição guardadas por uma milícia que não negocia.' },
  { id: 'abrigo7', nivel: 8, nome: 'Abrigo 7', bioma: 'ermo', x: 50, y: 8, perigo: 5, desc: 'O sinal do rádio aponta para cá. A saída.', requer: 'radio' },
];
export const localPorId = (id: string) => LOCAIS.find(l => l.id === id)!;
/** horas de viagem entre dois locais (mínimo 1) e combustível gasto */
export function custoViagem(a: string, b: string, mecanico = false) {
  const A = localPorId(a), B = localPorId(b), horas = Math.max(1, Math.round(Math.hypot(A.x - B.x, (A.y - B.y) * 1.1) / 9));
  return { horas, combustivel: Math.max(1, Math.ceil(horas / 2.2) - (mecanico ? 1 : 0)) };
}
/** por que o jogador ainda não pode viajar para `l` (null = liberado) */
export function bloqueioLocal(l: Local, nivel: number, inv: Record<string, number>): string | null {
  if (nivel < l.nivel) return `Precisa do nível ${l.nivel}`;
  if (l.requer && !(inv[l.requer] ?? 0)) return 'Precisa captar o sinal (rádio de campanha)';
  return null;
}
