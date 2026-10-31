// Ponte entre a UI React e a cena Phaser (um singleton simples).
export type Entrada = { mx: number; my: number; ax: number; ay: number; mira: boolean; atacar: boolean; correr: boolean; furtivo: boolean };
export type Rapido = 'agua' | 'comida' | 'curar' | 'antirrad';
export type Cmd = {
  interagir(): void; usarRapido(k: Rapido): void; usarItem(id: string): void; largar(id: string): void;
  trocarArma(): void; lanterna(): void; pausar(p: boolean): void; tocarMascara(): void;
};
export const ponte: { entrada: Entrada; cmd: Cmd | null } = {
  entrada: { mx: 0, my: 0, ax: 0, ay: 0, mira: false, atacar: false, correr: false, furtivo: false },
  cmd: null,
};
