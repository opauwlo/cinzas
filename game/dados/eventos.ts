// Eventos de viagem: encontros na estrada com decisões reais (risco x recompensa). Criar um novo = uma entrada.
export type Ajuda = {
  dar: (id: string, q?: number) => void; tirar: (id: string, q?: number) => boolean; tem: (id: string, q?: number) => boolean;
  tempo: (min: number) => void; dano: (hp: number) => void; rad: (v: number) => void; comb: (n: number) => void; xp: (n: number) => void; sorte: (p: number) => boolean;
};
export type Resultado = { txt: string; cor?: string; emboscada?: [string, number] };
export type Opcao = { rot: string; req?: [string, number]; dica?: string; res: (a: Ajuda) => Resultado };
export type EventoViagem = { id: string; titulo: string; txt: string; opcoes: Opcao[]; min?: number };

const OK = '#8fe36a', MAL = '#e0553f', NEUTRO = '#cfc7ae';
export const EVENTOS_VIAGEM: EventoViagem[] = [
  { id: 'caravana', titulo: 'Caravana destruída', txt: 'Uma caravana tombada na estrada. Ainda há movimento entre os destroços.', opcoes: [
    { rot: 'Vasculhar os destroços', dica: 'Pode render suprimentos… ou ser armadilha.', res: a => a.sorte(0.6) ? (a.dar('enlatado'), a.dar('bandagem', 2), a.dar('municao', 1), a.xp(12), { txt: 'Achou comida, curativos e munição entre os destroços.', cor: OK }) : { txt: 'Era uma armadilha! Saqueadores seguem você até o destino.', cor: MAL, emboscada: ['saqueador', 2] } },
    { rot: 'Passar direto', res: () => ({ txt: 'Você acelera e deixa a carcaça para trás.', cor: NEUTRO }) }] },
  { id: 'socorro', titulo: 'Sinal de socorro', txt: 'O rádio do jipe chia: alguém pede ajuda, em loop, numa frequência velha.', opcoes: [
    { rot: 'Investigar', dica: 'Pode ser um sobrevivente de verdade.', res: a => a.sorte(0.5) ? (a.dar('kit'), a.dar('agua'), a.xp(30), { txt: 'Um sobrevivente ferido. Em troca da ajuda, ele deu um kit médico e água.', cor: OK }) : (a.dano(12), { txt: 'Era isca. Você escapou ferido, mas o grupo vai atrás de você.', cor: MAL, emboscada: ['filho', 2] }) },
    { rot: 'Ignorar o sinal', res: () => ({ txt: 'Você desliga o rádio. A voz fica na sua cabeça por horas.', cor: NEUTRO }) }] },
  { id: 'poeira', titulo: 'Frente de poeira', txt: 'Uma parede de poeira cinza bloqueia a estrada à frente.', opcoes: [
    { rot: 'Atravessar a poeira', dica: 'Rápido, mas faz mal aos pulmões.', res: a => (a.dano(10), a.rad(6), { txt: 'Você atravessa tossindo. A poeira estava carregada.', cor: MAL }) },
    { rot: 'Esperar passar (+2 h)', res: a => (a.tempo(120), { txt: 'Duas horas parado, mas sem um arranhão.', cor: NEUTRO }) }] },
  { id: 'ponte', titulo: 'Ponte caída', txt: 'A ponte desabou. Há um desvio longo e uma rampa improvisada de destroços.', opcoes: [
    { rot: 'Desvio longo (+2 h, −1 comb.)', res: a => (a.tempo(120), a.comb(-1), { txt: 'O desvio custou tempo e combustível.', cor: NEUTRO }) },
    { rot: 'Saltar a rampa', dica: 'Metade das chances.', res: a => a.sorte(0.5) ? (a.xp(15), { txt: 'O jipe voa e pousa inteiro. Você ainda não acredita.', cor: OK }) : (a.dano(20), a.comb(-1), { txt: 'O jipe bate feio. Você se machuca e perde combustível.', cor: MAL }) }] },
  { id: 'viajante', titulo: 'Viajante solitário', txt: 'Um homem acena junto à estrada, com uma mochila pesada e um olhar cansado.', opcoes: [
    { rot: 'Trocar (dar 1 enlatado)', req: ['enlatado', 1], res: a => { a.tirar('enlatado'); const b = a.sorte(0.5); b ? a.dar('municao', 2) : a.dar('bandagem', 2); a.xp(10); return { txt: b ? 'Ele retribuiu com munição e um aperto de mão.' : 'Ele retribuiu com curativos. “Boa sorte lá fora.”', cor: OK }; } },
    { rot: 'Seguir viagem', res: () => ({ txt: 'Você passa direto. No retrovisor, ele continua acenando.', cor: NEUTRO }) }] },
  { id: 'posto', titulo: 'Posto saqueado', txt: 'Um posto de gasolina antigo. Parece vazio, mas as bombas podem ter sobra.', opcoes: [
    { rot: 'Drenar as bombas', dica: 'O barulho pode chamar atenção.', res: a => { const q = a.sorte(0.5) ? 2 : 1; a.comb(q); a.xp(8); return a.sorte(0.3) ? { txt: `Você drenou ${q} de combustível, mas o barulho chamou visita.`, cor: MAL, emboscada: ['irradiado', 3] } : { txt: `Você drenou ${q} de combustível sem ninguém notar.`, cor: OK }; } },
    { rot: 'Seguir viagem', res: () => ({ txt: 'Melhor não arriscar.', cor: NEUTRO }) }] },
  { id: 'pneu', titulo: 'Pneu furado', txt: 'Um estalo seco e o jipe pende para um lado.', opcoes: [
    { rot: 'Consertar (2 sucata)', req: ['sucata', 2], res: a => (a.tirar('sucata', 2), a.tempo(20), a.xp(6), { txt: 'Conserto rápido de estrada. Só 20 minutos perdidos.', cor: OK }) },
    { rot: 'Rodar assim mesmo (+1 h, −1 comb.)', res: a => (a.tempo(60), a.comb(-1), { txt: 'O jipe geme, mas chega. Gastou mais combustível.', cor: NEUTRO }) }] },
  { id: 'fogueira', titulo: 'Fogueira na estrada', txt: 'Alguém acendeu uma fogueira logo à frente. Dá para ver silhuetas.', opcoes: [
    { rot: 'Aproximar em silêncio', dica: 'Pode haver comida… ou donos.', res: a => a.sorte(0.5) ? (a.dar('enlatado', 2), a.dar('agua'), a.xp(14), { txt: 'O acampamento estava abandonado: comida e água ainda quentes.', cor: OK }) : { txt: 'Eles viram você! Os Filhos do Cinza vão atrás.', cor: MAL, emboscada: ['filho', 2] } },
    { rot: 'Contornar (+1 h)', res: a => (a.tempo(60), { txt: 'Um desvio longo no escuro. Nada aconteceu.', cor: NEUTRO }) }] },
  { id: 'comboio', titulo: 'Comboio militar', txt: 'Blindados parados no acostamento. Nenhum movimento, nenhuma luz.', min: 3, opcoes: [
    { rot: 'Revistar um veículo', dica: 'Pode haver minas.', res: a => a.sorte(0.55) ? (a.dar('municao', 3), a.dar('kit'), a.xp(25), { txt: 'Munição e um kit médico intactos.', cor: OK }) : (a.dano(25), { txt: 'Uma mina improvisada! Você sobrevive por pouco.', cor: MAL }) },
    { rot: 'Observar de longe', res: a => (a.xp(8), { txt: 'Você anota a posição e segue. Conhecimento também vale.', cor: NEUTRO }) }] },
];
