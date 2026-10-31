// Ponte entre a UI React e a cena Phaser (um singleton simples).
/** `auto` = ataque automático (botão de ataque segurado): a cena escolhe o alvo e só bate quando há inimigo ao alcance */
export type Entrada = { mx: number; my: number; ax: number; ay: number; mira: boolean; atacar: boolean; auto: boolean; correr: boolean; furtivo: boolean; tap: number };
export type Rapido = 'agua' | 'comida' | 'curar' | 'antirrad';
export type Cmd = {
  interagir(): void; usarRapido(k: Rapido): void; usarItem(id: string): void; largar(id: string, n?: number): void;
  trocarArma(): void; lanterna(): void; pausar(p: boolean): void; tocarMascara(): void;
  /** toque na tela (coordenadas CSS relativas ao mundo); devolve true se virou interação */
  tocarMundo(x: number, y: number): boolean;
  craft(id: string): void; cozinhar(id: string): void; dormir(horas: number): void; bauMover(id: string, qtd: number, paraBau: boolean): void;
  viajar(dest: string): void; salvar(): void; atacarBotao(): void;
  npcAgir(a: 'trocar' | 'rumor' | 'sair'): void; npcComprar(item: string): void; npcVender(item: string): void;
  eventoEscolher(i: number): void; eventoFim(): void; escolherPerk(id: string): void; receberContrato(id: number): void; melhorar(id: string): void;
};
export const ponte: { entrada: Entrada; cmd: Cmd | null; ref: unknown } = {
  entrada: { mx: 0, my: 0, ax: 0, ay: 0, mira: false, atacar: false, auto: false, correr: false, furtivo: false, tap: 0 },
  cmd: null, ref: null,
};
