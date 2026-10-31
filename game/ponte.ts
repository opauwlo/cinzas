// Ponte entre a UI React e a cena Phaser (um singleton simples).
export type Entrada = { mx: number; my: number; ax: number; ay: number; mira: boolean; atacar: boolean; correr: boolean; furtivo: boolean; tap: number };
export type Rapido = 'agua' | 'comida' | 'curar' | 'antirrad';
export type Cmd = {
  interagir(): void; usarRapido(k: Rapido): void; usarItem(id: string): void; largar(id: string): void;
  trocarArma(): void; lanterna(): void; pausar(p: boolean): void; tocarMascara(): void;
  /** toque na tela (coordenadas CSS relativas ao mundo); devolve true se virou interação */
  tocarMundo(x: number, y: number): boolean;
  craft(id: string): void; cozinhar(id: string): void; dormir(horas: number): void; bauMover(id: string, qtd: number, paraBau: boolean): void;
  viajar(dest: string): void; salvar(): void; atacarBotao(): void;
};
export const ponte: { entrada: Entrada; cmd: Cmd | null; ref: unknown } = {
  entrada: { mx: 0, my: 0, ax: 0, ay: 0, mira: false, atacar: false, correr: false, furtivo: false, tap: 0 },
  cmd: null, ref: null,
};
