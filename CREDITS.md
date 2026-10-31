# Créditos e licenças de terceiros

## Ícones — game-icons.net (CC BY 3.0)

Ícones de https://game-icons.net, sob [Creative Commons BY 3.0](https://creativecommons.org/licenses/by/3.0/). Arquivos em `public/icons/<autor>/`; licença original em `public/icons/LICENSE-game-icons.txt`. Esta atribuição precisa aparecer também numa tela de créditos dentro do jogo.

- **Caro Asercion**: fridge
- **DarkZaitzev**: hooded-figure
- **Delapouite**: backpack, bread, canned-fish, car-door, cardboard-box, cpu, crafting, crowbar, first-aid-kit, flashlight, heart-beats, lockers, rat, share, stomach, toolbox, walkie-talkie, water-bottle, wood-pile
- **John Colburn**: pistol-gun
- **Lorc**: bandage-roll, bottle-vapors, bowie-knife, bullets, campfire, gas-mask, gears, hammer-nails, machete, meat, metal-bar, molotov, radar-sweep, radioactive, skull-crossed-bones, sprint, trophy, wolf-head
- **Sbed**: battery-pack, shotgun, syringe, water-drop
- **Skoll**: footsteps

## Fontes (SIL Open Font License 1.1)

- **Black Ops One** — James Grieshaber, Eben Sorkin. `public/fonts/OFL-BlackOpsOne.txt`
- **Share Tech Mono** — Carrois Type Design. `public/fonts/OFL-ShareTechMono.txt`

## Código (npm, em uso)

Next.js, React, Phaser 4.2.1, simplex-noise, alea, zustand, ZzFX (MIT; usamos o `buildSamples` com barramentos de áudio próprios); rot-js (BSD-3-Clause, FOV e A*). Fontes via @fontsource: Silkscreen, VT323 e Pixelify Sans (OFL). Ícones convertidos em pixel art em tempo de execução (`components/Ico.tsx`). Todo o resto da arte (personagens, criaturas, flora, props, paredes) é gerado por código próprio: a biblioteca procedural em `game/lib/` (voxel → sprite isométrico em 8 direções). `app/icon.svg` é o ícone radioactive (Lorc, CC BY 3.0); os ícones do PWA em `public/pwa/` são gerados dele por `tools/icones.mjs`.

## Código (a ser incluído — ver HANDOFF.md §5)

Phaser (MIT), Box2D v3 (MIT), walloc (MIT), Trystero (MIT), @noble/secp256k1 (MIT), ZzFX (MIT), simplex-noise (MIT), alea (MIT), PathFinding.js e heap.js (MIT). Ao vendorizar qualquer um, copiar o arquivo de licença junto.
