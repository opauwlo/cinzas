// Dados da camada de progressão: habilidades (perks), conquistas, melhorias do abrigo, temas de zona e dicas. Criar um novo = uma entrada.
import { BIOMAS, type Bioma } from './biomas';

export type Icone = [string, string]; // [autor, nome] em public/icons

// ---------------------------------------------------------------- habilidades: a cada nível o jogador escolhe 1 entre 3
export type Perk = { id: string; nome: string; desc: string; ic: Icone };
export const PERKS: Perk[] = [
  { id: 'forte', nome: 'Braço forte', desc: 'Golpes corpo a corpo causam +25% de dano.', ic: ['delapouite', 'crowbar'] },
  { id: 'mira', nome: 'Olho de lince', desc: 'Armas de fogo causam +25% de dano e erram menos.', ic: ['john-colburn', 'pistol-gun'] },
  { id: 'leve', nome: 'Pé de pluma', desc: 'Seus passos fazem 40% menos barulho.', ic: ['skoll', 'footsteps'] },
  { id: 'pulmoes', nome: 'Pulmões de aço', desc: 'Correr gasta 30% menos fôlego e ele volta mais rápido.', ic: ['lorc', 'sprint'] },
  { id: 'pele', nome: 'Pele grossa', desc: '+15 de vida máxima e 15% menos dano recebido.', ic: ['delapouite', 'heart-beats'] },
  { id: 'estomago', nome: 'Estômago de ferro', desc: 'Fome e sede aumentam 30% mais devagar.', ic: ['delapouite', 'stomach'] },
  { id: 'catador', nome: 'Olho de catador', desc: 'Vasculhar é 30% mais rápido e às vezes rende um item extra.', ic: ['delapouite', 'cardboard-box'] },
  { id: 'mecanico', nome: 'Mãos de mecânico', desc: 'Cada viagem gasta 1 de combustível a menos (mínimo 1).', ic: ['delapouite', 'toolbox'] },
  { id: 'cacador', nome: 'Caçador', desc: 'Esfolar um animal rende o dobro de carne.', ic: ['lorc', 'wolf-head'] },
  { id: 'imune', nome: 'Sangue limpo', desc: 'Você absorve 40% menos radiação.', ic: ['lorc', 'gas-mask'] },
  { id: 'enfermeiro', nome: 'Mãos de enfermeiro', desc: 'Curativos e kits curam 50% mais.', ic: ['delapouite', 'first-aid-kit'] },
  { id: 'noturno', nome: 'Olhos de gato', desc: 'À noite você enxerga bem mais longe.', ic: ['delapouite', 'flashlight'] },
];
export const perkPorId = (id: string) => PERKS.find(p => p.id === id)!;

// ---------------------------------------------------------------- conquistas (persistem entre vidas)
export type Conquista = { id: string; nome: string; desc: string; ic: Icone; stat: string; alvo: number };
export const CONQUISTAS: Conquista[] = [
  { id: 'primeiro', nome: 'Primeiro sangue', desc: 'Abata uma criatura.', ic: ['lorc', 'skull-crossed-bones'], stat: 'abates', alvo: 1 },
  { id: 'area', nome: 'Limpando a área', desc: 'Abata 25 criaturas numa vida.', ic: ['lorc', 'skull-crossed-bones'], stat: 'abates', alvo: 25 },
  { id: 'ceifador', nome: 'Ceifador do ermo', desc: 'Abata 100 criaturas numa vida.', ic: ['lorc', 'skull-crossed-bones'], stat: 'abates', alvo: 100 },
  { id: 'catador', nome: 'Catador', desc: 'Vasculhe 15 contêineres.', ic: ['delapouite', 'cardboard-box'], stat: 'saques', alvo: 15 },
  { id: 'ratoruina', nome: 'Rato de ruína', desc: 'Vasculhe 60 contêineres.', ic: ['delapouite', 'rat'], stat: 'saques', alvo: 60 },
  { id: 'noite1', nome: 'Primeira noite', desc: 'Sobreviva a uma noite.', ic: ['delapouite', 'flashlight'], stat: 'noites', alvo: 1 },
  { id: 'noite5', nome: 'Noctívago', desc: 'Sobreviva a 5 noites numa vida.', ic: ['delapouite', 'flashlight'], stat: 'noites', alvo: 5 },
  { id: 'maonamassa', nome: 'Mão na massa', desc: 'Fabrique 8 itens.', ic: ['delapouite', 'crafting'], stat: 'fabricados', alvo: 8 },
  { id: 'chef', nome: 'Chef do fim do mundo', desc: 'Cozinhe 6 vezes.', ic: ['lorc', 'campfire'], stat: 'cozinhados', alvo: 6 },
  { id: 'maoverde', nome: 'Mão verde', desc: 'Colha 5 vezes na horta.', ic: ['delapouite', 'bread'], stat: 'colhidos', alvo: 5 },
  { id: 'estrada', nome: 'Pé na estrada', desc: 'Faça 5 viagens de jipe.', ic: ['delapouite', 'car-door'], stat: 'viagens', alvo: 5 },
  { id: 'cartografo', nome: 'Cartógrafo', desc: 'Descubra 6 locais.', ic: ['lorc', 'radar-sweep'], stat: 'locais', alvo: 6 },
  { id: 'gigantes', nome: 'Matador de gigantes', desc: 'Derrube um Colosso.', ic: ['lorc', 'skull-crossed-bones'], stat: 'colossos', alvo: 1 },
  { id: 'cirurgiao', nome: 'Cirurgião de campo', desc: 'Decepe 5 membros.', ic: ['lorc', 'machete'], stat: 'membros', alvo: 5 },
  { id: 'acerto', nome: 'Hora do acerto', desc: 'Abata 10 membros de gangues.', ic: ['lorc', 'bullets'], stat: 'gangue', alvo: 10 },
  { id: 'defensor', nome: 'Defensor do abrigo', desc: 'Repele uma invasão ao abrigo.', ic: ['lorc', 'metal-bar'], stat: 'raids', alvo: 1 },
  { id: 'chuvaouro', nome: 'Chuva de ouro', desc: 'Recolha um lançamento de suprimentos.', ic: ['delapouite', 'cardboard-box'], stat: 'airdrops', alvo: 1 },
  { id: 'profissional', nome: 'Profissional', desc: 'Cumpra 3 contratos.', ic: ['delapouite', 'walkie-talkie'], stat: 'contratos', alvo: 3 },
  { id: 'veterano', nome: 'Veterano', desc: 'Chegue ao nível 5.', ic: ['lorc', 'trophy'], stat: 'nivel', alvo: 5 },
  { id: 'lenda', nome: 'Lenda do ermo', desc: 'Chegue ao nível 10.', ic: ['lorc', 'trophy'], stat: 'nivel', alvo: 10 },
  { id: 'fortaleza', nome: 'Fortaleza', desc: 'Faça 3 melhorias no abrigo.', ic: ['lorc', 'hammer-nails'], stat: 'melhorias', alvo: 3 },
  { id: 'sinal', nome: 'Sinal captado', desc: 'Encontre o rádio de campanha.', ic: ['delapouite', 'walkie-talkie'], stat: 'radio', alvo: 1 },
  { id: 'brilho', nome: 'Brilhando no escuro', desc: 'Chegue a 80 de radiação e sobreviva.', ic: ['lorc', 'radioactive'], stat: 'radmax', alvo: 80 },
  { id: 'abrigo7', nome: 'Abrigo 7', desc: 'Chegue ao Abrigo 7.', ic: ['lorc', 'trophy'], stat: 'vitoria', alvo: 1 },
];

// ---------------------------------------------------------------- melhorias do abrigo (nível atual = quantas já foram feitas)
export type Melhoria = { id: string; nome: string; ic: Icone; niveis: { desc: string; custo: [string, number][] }[] };
export const MELHORIAS: Melhoria[] = [
  { id: 'bancada', nome: 'Bancada de trabalho', ic: ['delapouite', 'crafting'], niveis: [
    { desc: 'Receitas avançadas: kit médico, antirradiação e bateria.', custo: [['sucata', 6], ['madeira', 6]] },
    { desc: 'Receitas de mestre: facão, pistola e escopeta artesanais.', custo: [['sucata', 12], ['eletronico', 2], ['bateria', 1]] }] },
  { id: 'muro', nome: 'Muralha e portão', ic: ['lorc', 'metal-bar'], niveis: [
    { desc: 'Invasões 20% menores e saques ao baú menos prováveis.', custo: [['madeira', 8], ['sucata', 6]] },
    { desc: 'Invasões 40% menores.', custo: [['madeira', 10], ['sucata', 10], ['tecido', 4]] },
    { desc: 'Invasões 60% menores; o baú fica quase seguro.', custo: [['sucata', 16], ['eletronico', 2], ['bateria', 2]] }] },
  { id: 'horta', nome: 'Horta', ic: ['delapouite', 'bread'], niveis: [
    { desc: 'A planta cresce 35% mais rápido e rende +1 legume.', custo: [['madeira', 4], ['sucata', 3]] },
    { desc: 'Cresce 70% mais rápido e rende +2 legumes.', custo: [['madeira', 6], ['sucata', 6], ['garrafa', 2]] }] },
  { id: 'tanque', nome: 'Tanque de chuva', ic: ['sbed', 'water-drop'], niveis: [
    { desc: 'Guarda 8 de água e enche 50% mais rápido.', custo: [['sucata', 5], ['garrafa', 2]] },
    { desc: 'Guarda 12 de água e enche o dobro da velocidade.', custo: [['sucata', 8], ['garrafa', 3], ['tecido', 3]] }] },
  { id: 'cama', nome: 'Cama e descanso', ic: ['lorc', 'bandage-roll'], niveis: [
    { desc: 'Dormir cura 50% mais e estanca sangramentos.', custo: [['tecido', 6], ['madeira', 3]] },
    { desc: 'Dormir cura o dobro e limpa 15 de radiação.', custo: [['tecido', 8], ['alcool', 2], ['madeira', 4]] }] },
];

// ---------------------------------------------------------------- temas de zona: mesma geração, identidade e saque próprios
export type Tema = { bioma: Partial<Bioma>; extra: string[]; chance: number; /** item que sempre aparece em algum contêiner do local */ garante?: string };
export const TEMAS: Record<string, Tema> = {
  hospital: { bioma: { predios: 12, tiposPredio: [['hospital', 8], ['casa', 1], ['mercado', 1]], inimigos: [['irradiado', 8], ['rastejador', 3], ['corredor', 2]], densInimigos: 1.5, gangues: 0, colosso: 0.1 }, extra: ['kit', 'bandagem', 'antirrad', 'alcool'], chance: 0.5 },
  militar: { bioma: { predios: 9, tiposPredio: [['galpao', 6], ['oficina', 2]], inimigos: [['miliciano', 5], ['irradiado', 4], ['corredor', 1]], densInimigos: 1.3, gangues: 3, colosso: 0.2 }, extra: ['municao', 'cartucho', 'municao', 'mascara', 'rifle'], chance: 0.5 },
  posto: { bioma: { predios: 5, tiposPredio: [['posto', 6], ['oficina', 2]], carros: 28, gangues: 2 }, extra: ['combustivel', 'combustivel', 'alcool', 'bateria'], chance: 0.55 },
  radio: { bioma: { predios: 6, tiposPredio: [['galpao', 3], ['oficina', 3]], densInimigos: 1.1, gangues: 1 }, extra: ['eletronico', 'eletronico', 'bateria', 'lanterna'], chance: 0.55, garante: 'radio' },
};
/** bioma efetivo de um local (bioma-base + tema) */
export const biomaDe = (biomaId: string, tema?: string): Bioma => ({ ...BIOMAS[biomaId], ...(tema ? TEMAS[tema]?.bioma : undefined) });

// ---------------------------------------------------------------- textos de apoio
export const DICAS_CARGA = [
  'Fome e sede são lentas, mas não perdoam. Cozinhar carne evita intoxicação.',
  'O jipe só anda com combustível. Contratos e lançamentos de suprimentos costumam render mais.',
  'Cada nível dá uma habilidade nova. Escolha o estilo que combina com você.',
  'Muralha forte no abrigo reduz invasões e protege o baú enquanto você viaja.',
  'Chuva e neblina diminuem o alcance da visão — e também o barulho que você faz.',
  'Furtivo (pé) reduz o ruído. Correr chama a atenção de tudo por perto.',
  'Decepar uma perna deixa o inimigo mais lento. Duas pernas: ele rasteja.',
  'Pontos de interesse dão XP na primeira vez que você os descobre.',
  'Dormir no abrigo cura e passa a noite. Melhore a cama para curar mais.',
  'Colosso é lento, mas bate forte. Use o terreno e mantenha distância.',
];
export const PASSOS_INTRO = [
  'O mundo acabou em luz. Cidades viraram cinza, e o que sobrou aprendeu a caçar.',
  'Você guarda um abrigo no meio do nada, um jipe com o tanque quase seco e um rádio que só chia.',
  'Saia, saqueie, volte vivo. Em algum lugar há um sinal apontando para o Abrigo 7 — a saída.',
];
