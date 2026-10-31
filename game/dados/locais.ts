// Mapa-múndi: locais para viajar de jipe. Posições em um quadro 0..100 (o mapa na tela é pixel art desenhado por código).
export type Local = { id: string; nome: string; bioma: string; x: number; y: number; perigo: number; desc: string; requer?: string; fixo?: boolean };
export const LOCAIS: Local[] = [
  { id: 'base', nome: 'Abrigo', bioma: 'base', x: 50, y: 80, perigo: 0, desc: 'Seu refúgio: bancada, baú, cama e horta.', fixo: true },
  { id: 'ermo', nome: 'Ermo Cinzento', bioma: 'ermo', x: 24, y: 62, perigo: 1, desc: 'Crateras, ruínas e pouca gente. Bom para começar.' },
  { id: 'floresta', nome: 'Floresta Morta', bioma: 'floresta', x: 78, y: 58, perigo: 2, desc: 'Madeira, caça e matilhas. A névoa esconde o perigo.' },
  { id: 'cidade', nome: 'Cidade Velha', bioma: 'cidade', x: 46, y: 40, perigo: 3, desc: 'Muito saque, gangues e hordas.' },
  { id: 'pantano', nome: 'Pântano Tóxico', bioma: 'pantano', x: 18, y: 28, perigo: 3, desc: 'Radiação alta, água rasa e plantas que brilham.' },
  { id: 'industrial', nome: 'Refinaria 9', bioma: 'industrial', x: 80, y: 24, perigo: 4, desc: 'Combustível, sucata e mutantes gigantes.' },
  { id: 'abrigo7', nome: 'Abrigo 7', bioma: 'ermo', x: 50, y: 8, perigo: 5, desc: 'O sinal do rádio aponta para cá. A saída.', requer: 'radio' },
];
export const localPorId = (id: string) => LOCAIS.find(l => l.id === id)!;
/** horas de viagem entre dois locais (mínimo 1) e combustível gasto */
export function custoViagem(a: string, b: string) {
  const A = localPorId(a), B = localPorId(b), horas = Math.max(1, Math.round(Math.hypot(A.x - B.x, (A.y - B.y) * 1.1) / 9));
  return { horas, combustivel: Math.max(1, Math.ceil(horas / 1.4)) };
}
