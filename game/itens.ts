export type Raridade = 'comum' | 'incomum' | 'raro';
export type Item = {
  id: string; nome: string; peso: number; raridade: Raridade; icone: string;
  tipo: 'comida' | 'bebida' | 'cura' | 'arma' | 'equip' | 'municao' | 'especial';
  desc: string;
  fome?: number; sede?: number; hp?: number; rad?: number; estanca?: boolean;
  dano?: number; alcance?: number; bateria?: number; balas?: number;
};
const ic = (a: string, n: string) => `/icons/${a}/${n}.svg`;

export const ITENS: Record<string, Item> = {
  agua: { id: 'agua', nome: 'Água', peso: 0.5, raridade: 'comum', icone: ic('delapouite', 'water-bottle'), tipo: 'bebida', sede: 45, desc: 'Garrafa lacrada. Ainda boa.' },
  enlatado: { id: 'enlatado', nome: 'Peixe enlatado', peso: 0.4, raridade: 'comum', icone: ic('delapouite', 'canned-fish'), tipo: 'comida', fome: 35, desc: 'Vencido há 12 anos. Tudo bem.' },
  pao: { id: 'pao', nome: 'Pão duro', peso: 0.3, raridade: 'comum', icone: ic('delapouite', 'bread'), tipo: 'comida', fome: 20, desc: 'Duro como tijolo.' },
  carne: { id: 'carne', nome: 'Carne irradiada', peso: 0.6, raridade: 'comum', icone: ic('lorc', 'meat'), tipo: 'comida', fome: 40, rad: 7, desc: 'Sacia, mas cobra em radiação.' },
  bandagem: { id: 'bandagem', nome: 'Bandagem', peso: 0.1, raridade: 'comum', icone: ic('lorc', 'bandage-roll'), tipo: 'cura', hp: 8, estanca: true, desc: 'Estanca sangramento.' },
  kit: { id: 'kit', nome: 'Kit médico', peso: 0.8, raridade: 'incomum', icone: ic('delapouite', 'first-aid-kit'), tipo: 'cura', hp: 45, estanca: true, desc: 'Cura muito e estanca.' },
  antirrad: { id: 'antirrad', nome: 'Antirrad', peso: 0.1, raridade: 'incomum', icone: ic('sbed', 'syringe'), tipo: 'cura', rad: -35, desc: 'Remove radiação do corpo.' },
  bateria: { id: 'bateria', nome: 'Bateria', peso: 0.2, raridade: 'comum', icone: ic('sbed', 'battery-pack'), tipo: 'equip', bateria: 50, desc: 'Recarrega a lanterna.' },
  municao: { id: 'municao', nome: 'Munição 9mm', peso: 0.1, raridade: 'comum', icone: ic('lorc', 'bullets'), tipo: 'municao', balas: 8, desc: '8 balas.' },
  pe_de_cabra: { id: 'pe_de_cabra', nome: 'Pé de cabra', peso: 2, raridade: 'incomum', icone: ic('delapouite', 'crowbar'), tipo: 'arma', dano: 18, alcance: 1.7, desc: 'Corpo a corpo. Confiável.' },
  facao: { id: 'facao', nome: 'Facão', peso: 1.2, raridade: 'raro', icone: ic('lorc', 'machete'), tipo: 'arma', dano: 27, alcance: 1.8, desc: 'Rápido e letal.' },
  pistola: { id: 'pistola', nome: 'Pistola 9mm', peso: 1, raridade: 'raro', icone: ic('john-colburn', 'pistol-gun'), tipo: 'arma', dano: 32, alcance: 11, desc: 'Barulhenta. Atrai tudo.' },
  mascara: { id: 'mascara', nome: 'Máscara de gás', peso: 0.8, raridade: 'raro', icone: ic('lorc', 'gas-mask'), tipo: 'equip', desc: 'Reduz a radiação do ar em 65%.' },
  lanterna: { id: 'lanterna', nome: 'Lanterna', peso: 0.4, raridade: 'incomum', icone: ic('delapouite', 'flashlight'), tipo: 'equip', desc: 'Cone de luz à noite. Gasta bateria.' },
  radio: { id: 'radio', nome: 'Rádio de campanha', peso: 0.9, raridade: 'raro', icone: ic('delapouite', 'walkie-talkie'), tipo: 'especial', desc: 'Capta o sinal do abrigo.' },
};

export const PESO_RARIDADE: Record<Raridade, number> = { comum: 70, incomum: 24, raro: 6 };

export type TipoContainer = 'geladeira' | 'armario' | 'caixa' | 'ferramentas' | 'carro';
const TABELAS: Record<TipoContainer, string[]> = {
  geladeira: ['agua', 'enlatado', 'carne', 'pao', 'agua', 'enlatado'],
  armario: ['bandagem', 'kit', 'antirrad', 'lanterna', 'mascara', 'pe_de_cabra', 'pao', 'enlatado', 'bateria'],
  caixa: ['enlatado', 'pao', 'bandagem', 'bateria', 'municao', 'agua', 'facao'],
  ferramentas: ['pe_de_cabra', 'facao', 'bateria', 'municao', 'lanterna', 'pistola'],
  carro: ['bateria', 'municao', 'agua', 'bandagem', 'pistola', 'kit', 'antirrad'],
};

/** Sorteio real, mas determinístico por seed: o mesmo mundo para todo mundo no dia. */
export function sortearLoot(tipo: TipoContainer, rng: () => number): string[] {
  const tab = TABELAS[tipo];
  const n = 1 + Math.floor(rng() * 3);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const r = rng() * 100;
    const rar: Raridade = r < PESO_RARIDADE.raro ? 'raro' : r < PESO_RARIDADE.raro + PESO_RARIDADE.incomum ? 'incomum' : 'comum';
    let cand = tab.filter(id => ITENS[id].raridade === rar);
    if (!cand.length) cand = tab.filter(id => ITENS[id].raridade === 'comum');
    if (!cand.length) cand = tab;
    out.push(cand[Math.floor(rng() * cand.length)]);
  }
  return out;
}

export const COR_RARIDADE: Record<Raridade, string> = { comum: '#e8e4d8', incomum: '#8f95ff', raro: '#ffe14d' };
