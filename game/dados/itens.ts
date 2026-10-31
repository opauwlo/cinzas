// Itens, armas, receitas e tabelas de saque. Tudo em dados: criar item novo = uma linha.
export type Raridade = 'comum' | 'incomum' | 'raro';
export type TipoItem = 'comida' | 'bebida' | 'cura' | 'arma' | 'equip' | 'municao' | 'material' | 'especial' | 'ferramenta';
export type Item = {
  id: string; nome: string; peso: number; raridade: Raridade; icone: string; tom?: string; tipo: TipoItem; desc: string;
  fome?: number; sede?: number; hp?: number; rad?: number; estanca?: boolean; bateria?: number; balas?: number; municaoTipo?: string; combustivel?: number; sujo?: boolean;
};
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const ic = (a: string, n: string) => `${BASE}/icons/${a}/${n}.svg`;
const I = (x: Item) => x;

export const ITENS: Record<string, Item> = {
  agua: I({ id: 'agua', nome: 'Água limpa', peso: 0.5, raridade: 'comum', icone: ic('delapouite', 'water-bottle'), tipo: 'bebida', sede: 45, desc: 'Garrafa lacrada. Ainda boa.' }),
  agua_suja: I({ id: 'agua_suja', nome: 'Água suja', peso: 0.5, raridade: 'comum', icone: ic('delapouite', 'water-bottle'), tom: '#a08850', tipo: 'bebida', sede: 30, rad: 6, sujo: true, desc: 'Turva. Ferva na fogueira antes de beber.' }),
  garrafa: I({ id: 'garrafa', nome: 'Garrafa vazia', peso: 0.2, raridade: 'comum', icone: ic('lorc', 'bottle-vapors'), tom: '#9ac0c8', tipo: 'material', desc: 'Para coletar água.' }),
  enlatado: I({ id: 'enlatado', nome: 'Peixe enlatado', peso: 0.4, raridade: 'comum', icone: ic('delapouite', 'canned-fish'), tipo: 'comida', fome: 40, desc: 'Vencido há 12 anos. Tudo bem.' }),
  pao: I({ id: 'pao', nome: 'Pão duro', peso: 0.3, raridade: 'comum', icone: ic('delapouite', 'bread'), tipo: 'comida', fome: 20, desc: 'Duro como tijolo.' }),
  carne_crua: I({ id: 'carne_crua', nome: 'Carne crua', peso: 0.6, raridade: 'comum', icone: ic('lorc', 'meat'), tom: '#c0584a', tipo: 'comida', fome: 22, rad: 5, desc: 'Cozinhe na fogueira para não passar mal.' }),
  carne_cozida: I({ id: 'carne_cozida', nome: 'Carne cozida', peso: 0.5, raridade: 'incomum', icone: ic('lorc', 'meat'), tom: '#d9a02b', tipo: 'comida', fome: 48, desc: 'Sacia de verdade.' }),
  legume: I({ id: 'legume', nome: 'Legumes da horta', peso: 0.3, raridade: 'comum', icone: ic('delapouite', 'bread'), tom: '#8fe36a', tipo: 'comida', fome: 28, sede: 6, desc: 'Colhidos no abrigo.' }),
  baga: I({ id: 'baga', nome: 'Bagas silvestres', peso: 0.1, raridade: 'comum', icone: ic('cinzas', 'baga'), tom: '#c05a9a', tipo: 'comida', fome: 14, sede: 8, desc: 'Azedinhas. Colhidas em arbustos vivos.' }),
  cogumelo: I({ id: 'cogumelo', nome: 'Cogumelos', peso: 0.1, raridade: 'comum', icone: ic('cinzas', 'cogumelo'), tom: '#d9c48a', tipo: 'comida', fome: 18, rad: 4, desc: 'Enchem a barriga, mas dão um pouco de radiação (+4).' }),
  erva: I({ id: 'erva', nome: 'Erva medicinal', peso: 0.05, raridade: 'comum', icone: ic('cinzas', 'erva'), tom: '#6fb04a', tipo: 'cura', hp: 10, estanca: true, desc: 'Mastigada, estanca o sangue e cura um pouco.' }),
  semente: I({ id: 'semente', nome: 'Sementes', peso: 0.05, raridade: 'incomum', icone: ic('delapouite', 'bread'), tom: '#a88a4a', tipo: 'material', desc: 'Plante na horta do abrigo.' }),
  bandagem: I({ id: 'bandagem', nome: 'Bandagem', peso: 0.1, raridade: 'comum', icone: ic('lorc', 'bandage-roll'), tipo: 'cura', hp: 15, estanca: true, desc: 'Estanca sangramento e cura um pouco.' }),
  kit: I({ id: 'kit', nome: 'Kit médico', peso: 0.8, raridade: 'incomum', icone: ic('delapouite', 'first-aid-kit'), tipo: 'cura', hp: 60, estanca: true, desc: 'Cura muito e estanca.' }),
  antirrad: I({ id: 'antirrad', nome: 'Antirrad', peso: 0.1, raridade: 'incomum', icone: ic('sbed', 'syringe'), tipo: 'cura', rad: -35, desc: 'Remove radiação do corpo.' }),
  tecido: I({ id: 'tecido', nome: 'Tecido', peso: 0.1, raridade: 'comum', icone: ic('lorc', 'bandage-roll'), tom: '#9a9a8a', tipo: 'material', desc: 'Trapos limpos. Servem para curativos e roupas.' }),
  madeira: I({ id: 'madeira', nome: 'Madeira', peso: 0.8, raridade: 'comum', icone: ic('delapouite', 'wood-pile'), tipo: 'material', desc: 'Tábuas e lenha.' }),
  sucata: I({ id: 'sucata', nome: 'Sucata', peso: 0.5, raridade: 'comum', icone: ic('lorc', 'metal-bar'), tipo: 'material', desc: 'Metal para fabricar.' }),
  alcool: I({ id: 'alcool', nome: 'Álcool', peso: 0.4, raridade: 'comum', icone: ic('lorc', 'bottle-vapors'), tom: '#c8c8ff', tipo: 'material', desc: 'Para munição, curativos e combustível.' }),
  bateria: I({ id: 'bateria', nome: 'Bateria', peso: 0.2, raridade: 'comum', icone: ic('sbed', 'battery-pack'), tipo: 'material', bateria: 50, desc: 'Recarrega a lanterna.' }),
  eletronico: I({ id: 'eletronico', nome: 'Eletrônicos', peso: 0.2, raridade: 'incomum', icone: ic('delapouite', 'cpu'), tipo: 'material', desc: 'Placas e fios.' }),
  combustivel: I({ id: 'combustivel', nome: 'Galão de combustível', peso: 2, raridade: 'incomum', icone: ic('lorc', 'bottle-vapors'), tom: '#e08a30', tipo: 'material', combustivel: 1, desc: 'Abastece o jipe (1 unidade).' }),
  municao: I({ id: 'municao', nome: 'Munição 9mm', peso: 0.1, raridade: 'comum', icone: ic('lorc', 'bullets'), tipo: 'municao', balas: 8, municaoTipo: 'municao', desc: '8 balas.' }),
  cartucho: I({ id: 'cartucho', nome: 'Cartuchos', peso: 0.1, raridade: 'incomum', icone: ic('lorc', 'bullets'), tom: '#c0584a', tipo: 'municao', balas: 4, municaoTipo: 'cartucho', desc: '4 cartuchos de escopeta.' }),
  taco: I({ id: 'taco', nome: 'Taco', peso: 1.5, raridade: 'comum', icone: ic('lorc', 'bowie-knife'), tom: '#a07a4a', tipo: 'arma', desc: 'Corpo a corpo, rápido.' }),
  pe_de_cabra: I({ id: 'pe_de_cabra', nome: 'Pé de cabra', peso: 2, raridade: 'incomum', icone: ic('delapouite', 'crowbar'), tipo: 'arma', desc: 'Confiável. Também desmonta carros.' }),
  faca: I({ id: 'faca', nome: 'Faca', peso: 0.4, raridade: 'comum', icone: ic('lorc', 'bowie-knife'), tipo: 'arma', desc: 'Corta e esfola.' }),
  facao: I({ id: 'facao', nome: 'Facão', peso: 1.2, raridade: 'raro', icone: ic('lorc', 'machete'), tipo: 'arma', desc: 'Rápido e letal. Pode decepar.' }),
  machado: I({ id: 'machado', nome: 'Machado', peso: 2.2, raridade: 'incomum', icone: ic('lorc', 'hammer-nails'), tipo: 'arma', desc: 'Corta árvores e membros.' }),
  pistola: I({ id: 'pistola', nome: 'Pistola 9mm', peso: 1, raridade: 'raro', icone: ic('john-colburn', 'pistol-gun'), tipo: 'arma', desc: 'Barulhenta. Atrai tudo.' }),
  escopeta: I({ id: 'escopeta', nome: 'Escopeta', peso: 3, raridade: 'raro', icone: ic('sbed', 'shotgun'), tipo: 'arma', desc: 'Curto alcance, dano alto.' }),
  rifle: I({ id: 'rifle', nome: 'Rifle', peso: 3.5, raridade: 'raro', icone: ic('sbed', 'shotgun'), tom: '#9ab0c0', tipo: 'arma', desc: 'Longo alcance. Usa munição 9mm.' }),
  mascara: I({ id: 'mascara', nome: 'Máscara de gás', peso: 0.8, raridade: 'raro', icone: ic('lorc', 'gas-mask'), tipo: 'equip', desc: 'Reduz radiação e poeira em 65%.' }),
  lanterna: I({ id: 'lanterna', nome: 'Lanterna', peso: 0.4, raridade: 'incomum', icone: ic('delapouite', 'flashlight'), tipo: 'equip', desc: 'Cone de luz à noite. Gasta bateria.' }),
  colete: I({ id: 'colete', nome: 'Colete improvisado', peso: 2, raridade: 'incomum', icone: ic('darkzaitzev', 'hooded-figure'), tipo: 'equip', desc: 'Reduz o dano recebido em 25%.' }),
  mochila: I({ id: 'mochila', nome: 'Mochila grande', peso: 1, raridade: 'incomum', icone: ic('delapouite', 'backpack'), tipo: 'equip', desc: 'Aumenta a capacidade em 10 kg.' }),
  kit_fogueira: I({ id: 'kit_fogueira', nome: 'Kit de fogueira', peso: 2, raridade: 'comum', icone: ic('lorc', 'campfire'), tipo: 'ferramenta', desc: 'Acende uma fogueira onde você está.' }),
  ficha: I({ id: 'ficha', nome: 'Ficha de racionamento', peso: 0.01, raridade: 'comum', icone: ic('lorc', 'gears'), tom: '#d9a02b', tipo: 'material', desc: 'A moeda dos mascates. Troque por suprimentos.' }),
  radio: I({ id: 'radio', nome: 'Rádio de campanha', peso: 0.9, raridade: 'raro', icone: ic('delapouite', 'walkie-talkie'), tipo: 'especial', desc: 'Capta o sinal do Abrigo 7.' }),
};

export type Arma = { id: string; dano: number; alcance: number; cd: number; custo: number; ruido: number; corta?: boolean; ferramenta?: boolean; alvo: 'melee' | 'tiro'; municao?: string; pelotas?: number; visual: string };
export const ARMAS: Record<string, Arma> = {
  punhos: { id: 'punhos', dano: 6, alcance: 1.2, cd: 0.5, custo: 4, ruido: 3, alvo: 'melee', visual: '' },
  taco: { id: 'taco', dano: 16, alcance: 1.7, cd: 0.5, custo: 7, ruido: 5, alvo: 'melee', visual: 'taco' },
  pe_de_cabra: { id: 'pe_de_cabra', dano: 18, alcance: 1.7, cd: 0.55, custo: 7, ruido: 5, alvo: 'melee', visual: 'pe_de_cabra' },
  faca: { id: 'faca', dano: 14, alcance: 1.3, cd: 0.3, custo: 4, ruido: 3, corta: true, alvo: 'melee', visual: 'faca' },
  facao: { id: 'facao', dano: 27, alcance: 1.8, cd: 0.38, custo: 7, ruido: 5, corta: true, alvo: 'melee', visual: 'facao' },
  machado: { id: 'machado', dano: 32, alcance: 1.8, cd: 0.7, custo: 10, ruido: 6, corta: true, ferramenta: true, alvo: 'melee', visual: 'machado' },
  pistola: { id: 'pistola', dano: 32, alcance: 11, cd: 0.38, custo: 0, ruido: 20, alvo: 'tiro', municao: 'municao', visual: 'pistola' },
  escopeta: { id: 'escopeta', dano: 14, alcance: 7, cd: 0.95, custo: 0, ruido: 24, alvo: 'tiro', municao: 'cartucho', pelotas: 6, visual: 'escopeta' },
  rifle: { id: 'rifle', dano: 52, alcance: 16, cd: 0.8, custo: 0, ruido: 26, alvo: 'tiro', municao: 'municao', visual: 'rifle' },
};
export const armaDe = (id: string | null) => ARMAS[id ?? 'punhos'] ?? ARMAS.punhos;

export const PESO_RARIDADE: Record<Raridade, number> = { comum: 70, incomum: 24, raro: 6 };
export const COR_RARIDADE: Record<Raridade, string> = { comum: '#d8d3c0', incomum: '#7aa8d8', raro: '#e0b83a' };

// ---------------------------------------------------------------- receitas (bancada do abrigo)
export type Receita = { id: string; nome: string; entra: [string, number][]; sai: [string, number]; xp?: number; /** nível de melhoria da bancada necessário (0 = sempre) */ nivel?: number; /** nível do JOGADOR que libera a receita (progressão linear) */ nivelJog?: number };
export const RECEITAS: Receita[] = [
  { id: 'r_bandagem', nivelJog: 1, nome: 'Bandagem', entra: [['tecido', 2]], sai: ['bandagem', 1] },
  { id: 'r_taco', nivelJog: 1, nome: 'Taco', entra: [['madeira', 3]], sai: ['taco', 1] },
  { id: 'r_faca', nivelJog: 1, nome: 'Faca', entra: [['sucata', 2], ['madeira', 1]], sai: ['faca', 1] },
  { id: 'r_machado', nivelJog: 2, nome: 'Machado', entra: [['madeira', 2], ['sucata', 3]], sai: ['machado', 1] },
  { id: 'r_colete', nivelJog: 3, nome: 'Colete improvisado', entra: [['tecido', 4], ['sucata', 3]], sai: ['colete', 1] },
  { id: 'r_mochila', nivelJog: 3, nome: 'Mochila grande', entra: [['tecido', 6], ['sucata', 2]], sai: ['mochila', 1] },
  { id: 'r_municao', nivelJog: 4, nome: 'Munição 9mm (x2)', entra: [['sucata', 3], ['alcool', 1]], sai: ['municao', 2] },
  { id: 'r_cartucho', nivelJog: 4, nome: 'Cartuchos (x2)', entra: [['sucata', 3], ['alcool', 1]], sai: ['cartucho', 2] },
  { id: 'r_combustivel', nivelJog: 3, nome: 'Combustível', entra: [['alcool', 2], ['sucata', 1]], sai: ['combustivel', 1] },
  { id: 'r_lanterna', nivelJog: 3, nome: 'Lanterna', entra: [['sucata', 2], ['bateria', 1], ['eletronico', 1]], sai: ['lanterna', 1] },
  { id: 'r_fogueira', nivelJog: 1, nome: 'Kit de fogueira', entra: [['madeira', 4]], sai: ['kit_fogueira', 1] },
  { id: 'r_kit', nivelJog: 4, nome: 'Kit médico', entra: [['bandagem', 2], ['alcool', 1], ['tecido', 1]], sai: ['kit', 1], nivel: 1 },
  { id: 'r_antirrad', nivelJog: 5, nome: 'Antirradiação', entra: [['alcool', 2], ['tecido', 1], ['eletronico', 1]], sai: ['antirrad', 1], nivel: 1 },
  { id: 'r_bateria', nivelJog: 4, nome: 'Bateria', entra: [['eletronico', 1], ['sucata', 2]], sai: ['bateria', 1], nivel: 1 },
  { id: 'r_facao', nivelJog: 6, nome: 'Facão', entra: [['sucata', 4], ['madeira', 1], ['alcool', 1]], sai: ['facao', 1], nivel: 2 },
  { id: 'r_pistola', nivelJog: 7, nome: 'Pistola artesanal', entra: [['sucata', 6], ['eletronico', 2]], sai: ['pistola', 1], nivel: 2 },
  { id: 'r_escopeta', nivelJog: 8, nome: 'Escopeta artesanal', entra: [['sucata', 8], ['madeira', 2], ['eletronico', 1]], sai: ['escopeta', 1], nivel: 2 },
];
export const COZINHA: { id: string; nome: string; de: string; para: string }[] = [
  { id: 'c_agua', nome: 'Ferver água suja', de: 'agua_suja', para: 'agua' },
  { id: 'c_carne', nome: 'Cozinhar carne', de: 'carne_crua', para: 'carne_cozida' },
];

// ---------------------------------------------------------------- saque (determinístico por seed; raridade real)
export type Container = 'geladeira' | 'armario' | 'caixa' | 'ferramentas' | 'carro' | 'caixote_militar' | 'prateleira' | 'estante' | 'guarda_roupa' | 'mala' | 'bomba' | 'lixeira' | 'bau_gangue' | 'balcao' | 'bancada_velha';
export const TABELAS: Record<Container, string[]> = {
  geladeira: ['agua', 'enlatado', 'carne_crua', 'pao', 'agua', 'enlatado', 'legume', 'garrafa'],
  armario: ['bandagem', 'kit', 'antirrad', 'lanterna', 'mascara', 'pe_de_cabra', 'pao', 'enlatado', 'bateria', 'tecido', 'alcool'],
  caixa: ['enlatado', 'pao', 'bandagem', 'bateria', 'municao', 'agua', 'ficha', 'facao', 'tecido', 'sucata', 'garrafa'],
  ferramentas: ['pe_de_cabra', 'facao', 'bateria', 'municao', 'lanterna', 'sucata', 'sucata', 'machado', 'faca', 'eletronico'],
  carro: ['bateria', 'municao', 'agua', 'bandagem', 'pistola', 'kit', 'antirrad', 'combustivel', 'sucata', 'garrafa'],
  caixote_militar: ['municao', 'municao', 'cartucho', 'bandagem', 'kit', 'rifle', 'escopeta', 'pistola', 'mascara', 'antirrad'],
  prateleira: ['enlatado', 'pao', 'agua', 'garrafa', 'alcool', 'tecido', 'bateria', 'bandagem'],
  estante: ['tecido', 'tecido', 'semente', 'pao', 'alcool'],
  guarda_roupa: ['tecido', 'tecido', 'tecido', 'colete', 'mochila', 'tecido'],
  mala: ['tecido', 'enlatado', 'bandagem', 'agua', 'semente', 'ficha', 'radio'],
  bomba: ['combustivel', 'combustivel', 'alcool'],
  lixeira: ['sucata', 'garrafa', 'tecido', 'pao', 'sucata'],
  bau_gangue: ['ficha', 'ficha', 'municao', 'cartucho', 'pistola', 'escopeta', 'kit', 'facao', 'machado', 'enlatado', 'antirrad', 'combustivel', 'eletronico'],
  balcao: ['enlatado', 'bateria', 'municao', 'alcool', 'ficha', 'eletronico'],
  bancada_velha: ['sucata', 'eletronico', 'bateria', 'faca', 'martelo_x', 'alcool'],
};
export function sortearLoot(tipo: Container, rng: () => number, extra: string[] = []): string[] {
  const tab = (TABELAS[tipo] ?? TABELAS.caixa).filter(id => ITENS[id]), n = 1 + Math.floor(rng() * 3), out: string[] = [];
  for (let i = 0; i < n; i++) {
    const r = rng() * 100, rar: Raridade = r < PESO_RARIDADE.raro ? 'raro' : r < PESO_RARIDADE.raro + PESO_RARIDADE.incomum ? 'incomum' : 'comum';
    let cand = tab.filter(id => ITENS[id].raridade === rar); if (!cand.length) cand = tab.filter(id => ITENS[id].raridade === 'comum'); if (!cand.length) cand = tab;
    out.push(cand[Math.floor(rng() * cand.length)]);
  }
  return [...out, ...extra];
}
export const pesoDe = (inv: Record<string, number>) => Object.entries(inv).reduce((s, [id, q]) => s + (ITENS[id]?.peso ?? 0) * q, 0);
