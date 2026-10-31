# HANDOFF — CINZAS

Passagem de bastão da sessão de chat (31/out/2026) para a sessão de Code.
Leia inteiro antes de começar. Nome **CINZAS** é provisório.

> **Atualização (31/out/2026):** o estado ATUAL do projeto está na **seção 15**. As seções 11–14 descrevem a versão anterior (`game/voxel.ts`, `game/mapa.ts`, `game/modelos.ts`… foram substituídos pela biblioteca em `game/lib/`, zonas em `game/zona.ts` etc.).

## 1. O que o Uwlo pediu

- **Gênero:** survival **pós-apocalíptico nuclear** (fim do mundo por bomba atômica). **Não é zumbi.**
- **Câmera e estilo:** visão de cima, no estilo de **Project Zomboid**. Sobrevivência sistêmica com saque, fome, sede, ruído, cone de visão e morte permanente.
- **Plataforma:** mobile, **jogado primeiro na vertical**, com controle muito bom. Sai como **PWA** instalável.
- **Público:** gamer, mesclado com as técnicas de neurodesign do doc dele (seção 4).
- **Stack pedida:** **Next.js**, **WebAssembly**, fontes próprias, assets SVG.
  - Usar **módulos da comunidade**: "nunca crie nada do zero; copie o código aberto que a licença permite e modifique".
  - Sempre pesquisar a melhor tecnologia, focando em performance e no comportamento humano.
- **Multiplayer:** **descentralizado, pessoa a pessoa** ("estilo Bitcoin"). Depois vem um **backend com DB**.
- **Testes:** **por enquanto só smoke tests.**
- **Escopo:** "jogo completo com tudo que é esperado num survival estilo Project Zomboid".

## 2. Regras de trabalho do Uwlo (valem pra sessão toda)

- Responder em **português**, com **mensagens curtas**, sem textão.
- Usar "Desenvolvedor" e não "engenheiro".
- **Shell com "assert" de qualidade:**
  - `set -euo pipefail`, sem `;` depois de etapa que importa.
  - Edição por script confere se o texto foi achado.
  - Artefato gerado é conferido: existe, não está vazio e é desta execução.
  - Tudo com `timeout`. Build longa roda desacoplada, com log e arquivo de status, e nunca com `tail -f` sem fim.
  - Reportar o código de saída real. Um objetivo por comando.
  - Push e publicação **só no fim, depois dos testes**.
- Ele **não tem computador**, só celular (Motorola Edge 70 Fusion Plus). O resultado precisa abrir por link no celular: deploy na Vercel ou GitHub Pages, ou um artifact.

## 3. Estado atual

**Feito na sessão de chat:**
- Pesquisa e escolha dos módulos, com licença e commit fixados (seção 5).
- Curadoria dos assets, já neste repo:
  - `public/fonts/`: Black Ops One (títulos, estêncil militar) e Share Tech Mono (HUD estilo terminal/Geiger), ambas **OFL**.
  - `public/icons/`: 45 SVGs do game-icons.net, **CC BY 3.0**. Atribuição obrigatória, ver `CREDITS.md`.
- Leitura da API do Box2D v3 e plano de build WASM (seção 6).
- `tools/fetch-vendor.sh`: reclona os fontes de terceiros nos commits exatos, em `vendor/src/` (fora do git).

**Ainda não existe código do jogo.** O próximo passo é o scaffold (seção 10).

**Ambiente da sessão de chat (pra não perder tempo):**
- **npm bloqueado**: `registry.npmjs.org` foi recusado pelo proxy. Por isso o Next ficou travado.
- **Funciona:** `git clone` de repo público do GitHub.
- **Bloqueado:** `raw.githubusercontent.com`, `codeload`, jsdelivr e unpkg.
- **Pré-instalado** em `/opt/npm-tools/node_modules`: esbuild, typescript, react, react-dom, puppeteer-core, playwright, ws, tailwindcss.
- Também há `clang` 18 com alvo `wasm32`, `wasm-ld`, `llvm-ar` e Chrome em `/usr/bin/google-chrome`.
- O classificador **barrou rodar `make` de repo externo** (tentativa de buildar wasi-libc). Compile com `clang` direto, sem rodar Makefile de terceiros.
- **Na sessão de Code o npm deve funcionar. Confirme primeiro com `npm view next version`.**

## 4. Neurodesign: o que entra e o que fica fora

Essas técnicas vêm do doc dele.

**Entra (técnicas honestas, que fazem o jogo ser bom):**
- **Juiciness:** screen shake curto, *hit-stop* de 40–60 ms no impacto, clarão do disparo, número de dano e partículas.
- **Háptico:** `navigator.vibrate` em tiro, dano e saque raro, com padrões distintos.
- **Psicoacústica:**
  - Contador Geiger com cliques em taxa proporcional à radiação, como processo de Poisson. É tensão pura sem precisar de UI.
  - Batimento cardíaco com HP baixo.
  - `AudioContext` com `latencyHint: 'interactive'`; mirar menos de 50 ms entre o toque e o som.
- **Efeito Zeigarnik honesto:**
  - Objetivos encadeados ("sobreviva até o amanhecer", "ache o rádio", "conserte o gerador").
  - Ações com tempo, como no Zomboid (vasculhar, comer, craftar), com barra de progresso.
- **Recompensa variável real:** tabela de saque com raridade por cor (comum, incomum, raro). O sorteio é de verdade.
- **Peak-end rule:** a tela de morte mostra os destaques ("sobreviveu 3 dias, 47 mutantes") e gera um **card de compartilhar** (imagem em formato de Stories + `navigator.share`).
- **Seed diária:** o mesmo mundo pra todo mundo no dia. Dá comparação social real e, com o backend, ranking.
- **Aversão à perda legítima:** morte permanente com progresso de meta (perícias e desbloqueios) que fica.
- **Flow e DDA honesto:** a taxa de spawn se ajusta ao desempenho e **nunca** é usada pra vender.
- **Prova social real:** "2 sobreviventes na sala", presença de amigos no P2P.

**Fica fora (decisão já comunicada ao Uwlo):**
- "Quase-vitória" manipulada, ou seja, alterar o resultado pra empurrar compra.
- Prova social inventada ("93% escolhem").
- Desconto sobre preço que nunca existiu e cronômetro falso.
- Energia que trava a jogada.

Motivos: é **propaganda enganosa pelo CDC**, dá **remoção na Play Store**, e **público gamer pune pay-to-win**. Se for monetizar, que seja só cosmético e com preço honesto.

## 5. Módulos escolhidos (licença, origem e commit)

Se o npm funcionar, **prefira o pacote do npm** nas versões equivalentes. A coluna "repo" é o plano B (`tools/fetch-vendor.sh`).

| Função | Módulo | Licença | Repo @ commit |
|---|---|---|---|
| Render, cenas, câmera, input e tweens | **Phaser 4.2.1** (`phaser`) | MIT | phaserjs/phaser @ 02d8931 (tem `dist/phaser.esm.js` commitado) |
| Física e raycast em **WASM** | **Box2D v3** (C) compilado com clang | MIT | erincatto/box2d @ dd8bd3f |
| Alternativa WASM se o npm funcionar | `@dimforge/rapier2d-compat` (wasm embutido em base64) | Apache-2.0 | — |
| malloc no WASM (plano Box2D) | walloc | MIT | wingo/walloc @ a93409f |
| P2P descentralizado | **Trystero 0.26** (`trystero`): WebRTC com sinalização via Nostr | MIT | dmotz/trystero @ acef9dd (monorepo TS: `packages/core`, `nostr`, `ws-relay`) |
| Assinatura Nostr | `@noble/secp256k1` 3.2.0 | MIT | paulmillr/noble-secp256k1 @ 04c95fb |
| Joystick virtual | `nipplejs` | MIT | yoannmoinet/nipplejs @ ea425b3 (TS em `packages/nipplejs/src`) |
| SFX procedural | `zzfx` | MIT | KilledByAPixel/ZzFX @ aab7e2b |
| Ruído do mapa | `simplex-noise` | MIT | jwagner/simplex-noise.js @ 6bfff87 |
| RNG com seed | `alea` | MIT | coverslide/node-alea @ 4107f9c |
| Pathfinding | `pathfinding` (PathFinding.js) + `heap` | MIT | qiao/PathFinding.js @ 2904a9a, qiao/heap.js @ 21701c0 |
| Fontes | Black Ops One, Share Tech Mono | OFL | google/fonts @ 6c1dbe2 (já em `public/fonts`) |
| Ícones | game-icons.net | CC BY 3.0 | game-icons/icons @ 82d9488 (já em `public/icons`) |
| PWA com npm | `@serwist/next` ou `workbox-build` sobre o `out/` do export | MIT | — |
| Saves locais / estado da UI | `idb-keyval` / `zustand` | Apache-2.0 / MIT | — |
| Smoke tests | `puppeteer-core` + Chrome do sistema | Apache-2.0 | — |

## 6. Física em WASM: plano do Box2D v3

Use este plano se ficar sem npm, ou se preferir Box2D a Rapier.

**Configuração do build:**
- Compilar com `clang --target=wasm32 -O3 -nostdlib -ffreestanding` mais `wasm-ld --no-entry --export-dynamic --gc-sections --allow-undefined`.
- Com alvo `wasm32-unknown-unknown`, o `core.h` cai em `B2_PLATFORM_UNKNOWN` / `B2_CPU_UNKNOWN`. Resultado:
  - SIMD escalar.
  - O `timer.c` usa os fallbacks **sem threads** (a partir da linha ~568).
- `b2Pos` é float simples (precisão dupla só com define). `B2_ALIGNMENT` = 64.

**libc mínima:**
- Escrever **só headers de shim**: `string.h`, `stdio.h`, `stdlib.h`, `math.h`, `assert.h`. `stdint`, `stddef`, `stdbool`, `float`, `limits` e `stdarg` vêm do clang.
- `memcpy`/`memset` saem do builtin com `-mbulk-memory`.
- `sqrtf`/`floorf` saem de `__builtin_*`.
- malloc vem do walloc. Chamar `b2SetAllocator` com um wrapper que alinha em 64 bytes **antes** de criar o mundo.
- printf/fprintf/snprintf/qsort viram imports stub no JS. Só aparecem em log/assert e em sensores, que não vamos usar.

**API C própria (glue fino, ids inteiros):**
- `phys_init`
- `phys_add_box(cx,cy,hw,hh)`: paredes estáticas. Juntar tiles em retângulos (greedy) antes.
- `phys_add_circle(x,y,r,cat,mask,damping)`: corpo dinâmico com `motionLocks.angularZ = true`.
- `phys_set_vel`, `phys_set_pos`, `phys_remove`, `phys_step(dt,substeps)`.
- `phys_sync(out)`: copia x,y de todos os corpos num `Float32Array` compartilhado. **Uma chamada por frame.**
- `phys_raycast(x,y,dx,dy,mask,out)`: projétil hitscan. O índice do corpo vem via `b2Body_SetUserData`.
- `phys_vispoly(x,y,n,raio,out)`: lança **N raios dentro do WASM** contra as paredes e devolve o polígono de visão. É o cone de visão estilo Zomboid sem atravessar a fronteira JS↔WASM N vezes.

**Funções da API usadas** (confirmadas no header): `b2CreateWorld`, `b2World_Step`, `b2World_CastRayClosest(world, origin, translation, filter)` (devolve `b2RayResult{shapeId, point, normal, fraction, hit}`), `b2CreateBody`, `b2DestroyBody`, `b2Body_SetLinearVelocity`, `b2Body_GetPosition`, `b2Body_SetTransform`, `b2Body_SetUserData` / `GetUserData`, `b2Shape_GetBody`, `b2CreateCircleShape`, `b2CreatePolygonShape`, `b2MakeOffsetBox`, `b2DefaultQueryFilter`.

**Unidades:** 1 tile = 1 m. Renderizar a 32 px por metro.

## 7. Design do jogo (v1)

**Loop:** explorar ruínas → vasculhar contêineres (ação com tempo) → administrar fome, sede, radiação, vida e stamina → fugir ou lutar → voltar ao abrigo → craftar → sobreviver à noite.

**Mundo:**
- Procedural, com seed e chunks.
- Quarteirões de cidade com ruas, prédios (paredes, portas, janelas) e carros abandonados.
- Ermo com crateras de **alta radiação**, barris tóxicos e poças irradiadas.
- O ruído simplex define a densidade de ruína e as zonas de radiação.

**Visão (assinatura do Zomboid):**
- Cone de visão com linha de visada.
- Escuridão fora dele: Graphics com `cut()` ou máscara inversa.
- Inimigos fora do polígono de visão **não aparecem**.

**Ciclo dia/noite:**
- À noite a visão diminui e os mutantes ficam mais ativos.
- Lanterna gasta bateria.

**Ruído:** tiro, corrida e porta fazem barulho num raio e atraem inimigos. Andar agachado e devagar é furtivo.

**Status:**
- Vida, fome, sede, stamina e **radiação acumulada**.
- A radiação reduz a vida máxima e é tratada com antirrad.
- A máscara de gás reduz a radiação do ar.

**Inimigos (sem zumbis):**
- Irradiados (humanoides mutantes lentos que andam em bando).
- Cães mutantes (rápidos).
- Ratos gigantes (em enxame).
- Saqueadores (humanos que atiram, versão 2).

**Itens:**
- Água, comida enlatada, carne irradiada, bandagem, kit médico e antirrad (seringa).
- Máscara de gás e lanterna com bateria.
- Pé de cabra, facão, pistola, escopeta e munição.
- Sucata, peças, eletrônicos, madeira, álcool e coquetel molotov.

**Contêineres:** geladeira, armário (lockers), caixa de papelão, porta-malas de carro e caixa de ferramentas.

**Criação (crafting):** bandagem, molotov (álcool + pano), barricada (madeira), purificar água (fogueira) e consertar arma (sucata).

**Morte permanente:** a run acaba. A meta-progressão fica (perícias: Mira, Furtividade, Vasculhar, Medicina).

**Controles verticais (twin-stick):**
- Metade esquerda: joystick de mover, que aparece onde o dedo toca (nipplejs dinâmico).
- Metade direita: joystick de mirar/atirar.
- Botões grandes no alcance do polegar direito: **Interagir/Vasculhar**, **Correr**, **Inventário**.
- Zona morta, suavização e *aim assist* leve.

**Ícones já curados em `public/icons`:**
- **Itens:** water-bottle, canned-fish, meat, bread, bandage-roll, first-aid-kit, syringe, gas-mask, crowbar, machete, bowie-knife, pistol-gun, shotgun, bullets, metal-bar, gears, cpu, battery-pack, wood-pile, molotov, bottle-vapors, flashlight, hammer-nails.
- **Contêineres:** fridge, lockers, cardboard-box, car-door, toolbox.
- **HUD:** radioactive, stomach, water-drop, heart-beats, sprint, footsteps, crafting, backpack, share, trophy, radar-sweep, walkie-talkie, campfire.
- **Inimigos/morte:** wolf-head, rat, hooded-figure, skull-crossed-bones.

**Paleta sugerida (pós-nuclear):**
- Fundo cinza-cinza: `#1B1D1A` / `#2A2D27`.
- Verde radiação para alertas e Geiger: `#A6FF3B`.
- Âmbar de terminal para HUD: `#FFB000`.
- Vermelho-ferrugem para dano: `#C2412D`.
- Areia para o chão: `#8C7B5E`.

## 8. Multiplayer P2P (descentralizado)

- **Por que Trystero:** o navegador não abre porta pra escutar, então P2P de verdade no browser é **WebRTC**. O Trystero faz a sinalização por **relays públicos de Nostr**, sem servidor nosso. Depois de conectados, os pares falam **direto** (malha completa). É o mais perto de "estilo Bitcoin" que um navegador permite.
- **Sala:** `appId: 'cinzas'`, `roomId = seed + código`. Convite por link `?sala=XXXX` com `navigator.share`.

**Ações (makeAction):**
- `hello` {nome, versão}
- `st` {x, y, ângulo, hp, anim} a 15 Hz
- `sh` (tiro: origem, ângulo, arma)
- `en` (snapshot dos inimigos, do host, a 10 Hz)
- `hit` (cliente → host: dano em inimigo)
- `loot` (contêiner esvaziado: id)

**Host eleito:**
- O host é o **menor peerId** da sala (incluindo `selfId`). Ele simula os inimigos; os outros interpolam.
- Se o host cai, o próximo assume a partir do último snapshot.
- O mapa não trafega: **mesma seed = mesmo mundo**.

**Smoke test local:** apontar o Trystero pra um relay local.
- Com `packages/ws-relay` (tem `server.ts`), ou com um relay Nostr mínimo usando `ws`.
- Duas páginas no Chrome headless devem se ver.
- Flag útil: `--disable-features=WebRtcHideLocalIpsWithMdns`.

**Cuidado:** a CSP do artifact do claude.ai pode bloquear `wss` pros relays. Pra multiplayer, publicar na **Vercel** ou no **GitHub Pages**.

## 9. Backend e DB (depois, não agora)

- O gameplay continua P2P. O backend serve pra:
  - **ranking da seed diária**;
  - **contas**;
  - **save na nuvem**;
  - **anti-trapaça básico**, validando a run por replay de inputs com a mesma seed.
- Candidatos: Supabase (Postgres + auth) ou Turso/libSQL. Decidir com o Uwlo quando chegar a hora.

## 10. Próximos passos (em ordem)

1. `npm view next version`. Se o npm funcionar, fazer o scaffold de **Next (App Router, TS) com `output: 'export'`**.
   - Página única `app/page.tsx` montando o jogo em client component (`dynamic(..., { ssr: false })`).
   - HUD e menus em React; o mundo em Phaser.
2. Fontes via `@font-face` com os TTF de `public/fonts`. Ícones SVG carregados como texturas no Phaser (`load.svg`) e como `<img>` no HUD.
3. Física WASM (Rapier via npm, ou Box2D pela seção 6) e controles twin-stick.
4. Mapa procedural, colisões e cone de visão.
5. Inimigos (pathfinding + ruído), combate, saque, status e crafting.
6. Dia/noite, áudio (ZzFX + Geiger + batimento), háptico e juiciness.
7. Morte permanente, tela de morte e card de compartilhar. Seed diária. Saves com idb-keyval.
8. P2P com Trystero.
9. PWA: manifest, service worker e ícones 192/512/maskable gerados a partir de `public/icons/lorc/radioactive.svg`.
10. **Smoke tests** (puppeteer-core + Chrome):
    - carrega sem erro no console;
    - WASM inicializou;
    - o canvas tem pixels;
    - o joystick move o player;
    - vasculhar dá item;
    - o inimigo aparece e morre;
    - dois jogadores se veem no P2P;
    - o SW registra e o manifest é válido.
11. Deploy (Vercel ou GitHub Pages) **só depois dos testes**, e mandar o link pro Uwlo abrir no celular.

## 11. Progresso (sessão de Code, 31/out/2026)

- npm funciona. Scaffold Next 16 (App Router, TS, `output: 'export'`) feito; `npm run build` gera `out/`.
- Estilo **Diablo 2 mais nítido**: orbes (HP vermelho, radiação verde), cinto de 4 slots com cor de raridade, moldura de pedra/ferro, fontes Cinzel/Metamorphous. Tudo em `app/globals.css`. Mundo e painel são caixas separadas (sem sobreposição).
- Phaser: `components/mundo.ts` (chão, ruínas, luz do jogador, Geiger pelo ruído). Joystick esquerdo com nipplejs.
- **Contador de conceitos novos:** `conceitos.json` + `npm run conceitos` + tela Créditos. Hoje: 4 novos.
- `npm run smoke` (precisa de `npm run build` antes; `SHOT_DIR` para screenshots): passa.
- Falta do §10: física WASM, colisão real, cone de visão, inimigos, saque, áudio, P2P, PWA, deploy.

## 12. Segunda rodada (sessão de Code, 31/out/2026)

- Jogo jogável: mundo 96x96 com seed diária (ruas, prédios, carros, crateras, abrigo), visão em cone com memória (rot-js), dia/noite, lanterna, 3 inimigos com A* e ruído, saque com tempo e loot pré-sorteado pela seed, fome/sede/radiação/sangramento, combate corpo a corpo e pistola, inventário, objetivos encadeados, morte permanente com card de compartilhar, Geiger/batimento/háptico.
- HUD estilo Zomboid (moodles, ação com barra) sobre visual D2; regra de formas: cápsula = seguro, polígono cortado = perigo.
- **Modo Estudo** (`?estudo=1`): quase-vitória fabricada, prova social falsa, cronômetro falso, desconto fictício, ancoragem e aversão à perda; sem cobrança; termina na Revelação. Ver `CLAUDE.md`.
- Arte: tiles, props e personagens são procedurais (`game/arte.ts`). **Pendente: trocar por sprites detalhados CC0 (Kenney Topdown Shooter, OpenGameArt) — o download foi bloqueado pelo classificador; aguardando liberação do Uwlo.**
- Falta: física WASM, crafting, pathfinding para mais inimigos, saque de inimigos, P2P, PWA, deploy.

## 13. Virada visual (sessão de Code, 31/out/2026)

Pedido do Uwlo: pixel art grande em tamanho normal, visão isométrica como Project Zomboid (personagens de lado, não de cima), visual adulto e coeso, nada de bola/quadrado/cápsula infantil.

- **Projeção:** isométrica 2:1 (tile 32x16 px de arte), jogo renderizado a 1 px de arte = 2 px de CSS, `pixelArt: true`, câmera em pixels inteiros. Joystick e mira são girados 45° para o grid.
- **Arte (`game/voxel.ts`, `modelos.ts`, `paredes.ts`, `chao.ts`):** modelos em voxel renderizados por ray casting em 8 direções x 4 quadros, com luz em 4 faixas, contorno seletivo e borda interna. Chão calculado por pixel em coordenadas de mundo. Prévia em `/arte/`.
- **Luz:** FOV do rot.js, neblina pontilhada (Bayer) no chão, tingimento por objeto, paredes baixas/transparentes quando estão na frente do jogador.
- **UI:** aço, ferrugem, laranja de aviso e fósforo; cantos em degrau, bisel de 2 px, fontes Silkscreen e VT323, ícones convertidos em pixel art 1-bit. Cápsulas e amarelo saíram.
- Pendente: sprites feitos por artista (os voxels são o plano B coeso), crafting, física WASM, P2P, PWA, deploy, animação de ataque, corpos mais variados.

## 14. Publicação (31/out/2026)

- Link para abrir no celular (artifact privado do Uwlo): https://claude.ai/artifact/3hrqsZSyzgV1H5xd4GVQJy. Compartilhar pelo menu Share da página.
- `npm run empacotar` gera `dist-artifact/` (ignorado pelo git): `artifact.html` (fragmento para o Artifact) e `index.html` (documento completo, para testar com `RAIZ=dist-artifact/ node tools/smoke.mjs`). JS, CSS, fontes e ícones vão num arquivo só.
- GitHub Pages não foi usado: exige mesclar na `main` e ativar Pages nas configurações. Para publicar lá, é preciso `basePath` e prefixo nos caminhos `/icons/...`.
- O link do artifact não aceita `?estudo=1`: toque 7 vezes no título CINZAS para ligar/desligar o Modo Estudo. O compartilhamento nativo é recusado no artifact; o card abre numa tela para segurar e salvar.

## 15. Reescrita "produto" (sessão de Code, 31/out/2026) — ESTADO ATUAL

**Pedido do Uwlo:** parar de empacotar artifact; HUD refatorado e mais espaço pro jogo; animação; diversidade de plantas e bichos; vento, ciclo dia/noite, clima (chuva, tempestade…); gangues, mutantes gigantes, membros faltando; **biblioteca de componentes raiz** para montar qualquer coisa de forma procedural; cara de produto; melhor jogabilidade/botões/som/exploração; vibe *The Last Day on Earth*, Android, viagens.

### Mapa do código
- `game/lib/` — **biblioteca raiz procedural**. `vox.ts` (grade voxel, `carimbar` 3D com matrizes, `renderVox` = ray-cast ortográfico 30° com faixas de luz e contorno), `rig.ts` (articulação), `humano.ts`/`fauna.ts`/`flora.ts`/`props.ts` (receitas `Rec*` + geradores `gerar*` + clipes de animação), `fabrica.ts` (fábrica preguiçosa com orçamento de ms e poda), `paletas.ts`, `cor.ts`, `rng.ts`. **Criar bicho/planta/prop novo = uma entrada de dados**, sem desenhar sprite.
- `game/dados/` — `itens.ts` (itens, armas, receitas, cozinha, loot), `criaturas.ts` (arquétipos: zumbis, gangues, fauna, colosso), `biomas.ts`, `locais.ts` (mapa-múndi e custo de viagem).
- `game/zona.ts` — gerador único de zonas (base, ermo, cidade, floresta, industrial, pântano) com props interativos, flora, spawns, acampamentos de gangue, POIs, luzes. `game/chao.ts` — chão isométrico contínuo.
- `game/sistemas/` — `clima.ts` (chuva/tempestade/neblina/poeira/ácida, raios, vento, grade de cor por hora), `particulas.ts`, `ia.ts` (famílias de IA), `acoes.ts` (interações, fabricar, cozinhar, dormir, viajar, morte/vitória), `salvar.ts` (`localStorage cinzas.save.v2`).
- `game/cena.ts` — cena Phaser (luz/visão, camadas, vento, loop). `game/audio.ts` — barramentos + ambiente em camadas + música de drone.
- UI: `components/Hud.tsx` (HUD em tela cheia, área segura), `Controles.tsx` (joysticks próprios), `Paineis.tsx`, `Telas.tsx`. `app/arte/` — catálogo visual da biblioteca (`/arte/?g=humanos|animais|clipes|colosso|flora|props`).

### Jogo
Base (abrigo com cama, baú, bancada, fogão, horta, tanque de chuva) → jipe → mapa → viagem (gasta combustível e horas) → saque/combate/gangues/colosso → volta. Salva sozinho (continuar no menu). Vitória: rádio de campanha → Abrigo 7.

### Testes e ferramentas
- `npm run teste` (lógica e balanço, em Node, ~3 s) e `npm run build` + `npm run smoke` (navegador, 100+ verificações) em Chrome headless (menu, manifesto PWA, introdução, base, movimento, estações, interação bloqueada por parede, fabricar, cozinhar, baú, sono, melhorias, XP e habilidades, conquistas, combate, climas, viagem, evento de viagem, contratos, invasão, lançamento de suprimentos, locais temáticos, salvar/continuar, morte, Modo Estudo). ~4 min em GL por software. Capturas: `node tools/smoke.mjs <pasta>`.
- Para depurar no console: `window.__cinzas` (`cena()`, `store`, `ponte`) e `cena().dev('lobo', 3, 0)` cria criatura perto do jogador.
- `tools/icones.mjs` gera `public/pwa/*`. `tools/empacotar.mjs`/`entrada.tsx` (artifact em arquivo único) são **legado: não usar mais**.

### Publicação (Android/PWA)
`app/manifest.ts`, `public/sw.js` (offline), `components/RegistrarSW.tsx`, ícones em `public/pwa/`. Para hospedar em subcaminho defina `NEXT_PUBLIC_BASE_PATH=/cinzas` na build. `.github/workflows/pages.yml` publica no **GitHub Pages** a cada push na `main` — o Uwlo precisa ligar uma vez: *Settings → Pages → Source: GitHub Actions*. No Android: abrir o link no Chrome → menu → **Instalar app**.

### Pendências / ideias
- Testar em celular de verdade (desempenho, toque, áudio) e ajustar `cfg.escala`/qualidade.
- Habilidades/XP, coquetel molotov, evento de lançamento de suprimentos, mais eventos de viagem, mais biomas, multiplayer P2P (§8).
- Modo Estudo: `executarMorte` usa uma distância placeholder (143) para a "quase-vitória" — trocar por distância real ao Abrigo 7.

## 16. Camada "sempre instiga" + acabamento (sessão de Code, 31/out/2026)

**Pedido:** mundo completo, gameplay que sempre instiga, cara de produto finalizado. Depois: *bug* de interagir através de paredes e *gráfico muito pixelado*.

### O que entrou
- **Progressão** (`game/sistemas/progresso.ts`, `game/dados/meta.ts`): XP por abate/saque/fabricar/explorar/contrato; níveis (50 + 40·(n−1) XP); a cada nível **1 habilidade entre 3** (12 habilidades com efeito real: dano, ruído, fome/sede, radiação, combustível, saque, visão noturna). O painel abre sozinho num momento calmo (sem inimigo por perto, sem viagem em curso).
- **Contratos** (`game/sistemas/contratos.ts`): sempre 3 (abater, saquear, visitar, trazer, fabricar, sobreviver), por seed; paga no abrigo (item vai ao baú) + XP. Aparece no HUD (linha ◆ sob o OBJ) e no Diário (abas Objetivos / Contratos / Habilidades / Conquistas).
- **Eventos**: `game/dados/eventos.ts` (9 encontros de estrada com decisão, 45% por viagem; `emboscada` persegue na chegada) e `game/sistemas/diretor.ts` (**lançamento de suprimentos** com fumaça + seta no HUD + guardas; **invasão ao abrigo** à noite a partir do dia 2, com aviso de rádio e alarme; **saque do baú** se ficar > 1 dia fora; a **muralha** reduz tudo isso).
- **Melhorias do abrigo** (bancada, muralha, horta, tanque, cama) na bancada → "Melhorias do abrigo"; a bancada nível 2/3 libera receitas (kit médico, antirradiação, bateria, facão, pistola e escopeta artesanais).
- **Mundo**: 4 locais temáticos no mapa (Posto Km 40, Hospital São Judas, Torre de Rádio, Posto Militar 14) = bioma-base + `TEMAS` (mesmo gerador).
- **Conquistas** (24, persistem entre vidas em `cinzas.meta`), **dificuldade** (Calmo/Normal/Brutal no menu), **introdução** na primeira vez, **Como jogar**, dicas na tela de carga, sons novos (nível, conquista, alarme, sinal).

### Correções pedidas pelo Uwlo
- **Interação através de parede**: `Cena.alcancavel(it)` exige caminho livre (sem parede, janela, cerca, porta fechada ou peça sólida; a própria peça do objeto não conta). Vale para destaque, botão, toque no objeto e execução. Cada interativo tem `pegada` (casas da própria peça).
- **Pixelado demais**: `criarJogo` usa um número **inteiro de pixels do aparelho** por pixel de arte (padrão **Ultra** ≈ 1 px CSS; opções Alta 1,5 · Média 2 · Leve 3 em Config. → "Densidade de pixels"). Névoa e clima têm resolução própria (`fz`/`cz`), o chão carrega em raio maior (`fluxoChunks`) e o toque no objeto usa ~44 px CSS. A config antiga é migrada (`v: 3`).

### Ganchos de teste (não usar em jogo)
`cena().devXp(n)`, `cena().devForcar = 'raid' | 'airdrop'`, `cena().devEv = '<id do evento>'`, `cena().devIrPara(interativo)`, `window.__semEventos = true` (desliga o sorteio de eventos de viagem).

### Pendências / ideias
- Testar em celular real (Ultra gasta mais GPU; Alta/Média são a alternativa) e ajustar o equilíbrio (XP, preço das melhorias, tamanho das invasões).
- Comerciante, armadilhas no abrigo, mais eventos, arte em 2× de resolução (sprites supersampled) se quiser ainda mais detalhe.

## 17. Controles, HUD, som, chuva e mochila — revisão de UX (31/out/2026)

**Feedback do Uwlo:** controles ruins (quer dinâmico), sons altos, chuva atrapalha a visão, craft e mochila sem inovação (quer algo tipo Resident Evil 4, sem o jeito antigo de peso), botões de correr/andar devagar que precisam ficar apertados são ruins, repensar controles e HUD com psicologia/UX.

### Princípios aplicados
- **Lei de Fitts e zona do polegar:** só o que se toca fica nos cantos de baixo (stick, agir, atalhos); informação (vitais, relógio, rastreador) fica no topo e não captura toque, exceto o rastreador (abre o Diário).
- **Carga cognitiva (Hick/Miller):** de ~9 controles fixos para 3: stick, botão de agir contextual e atalhos. Correr/furtivo viraram *gesto* (força do empurrão), não botão.
- **Feedback e affordance:** o stick mostra as zonas (verde tracejado = furtivo, laranja = borda de correr), o dedo muda de cor e vibra ao trocar de modo; o botão de agir só aparece com alvo e o ícone muda conforme a ação; o atalho certo pulsa quando a necessidade aparece (sede, fome, cura, antirrad, lanterna à noite).
- **Divulgação progressiva e atenção guiada:** vitais discretos quando >70%; acendem ao mudar (3 s) ou ficar críticos; o rastreador recolhe após 9 s sem mudança; a barra de atalhos esmaece após 6 s.
- **Mochila = decisões, não contabilidade:** o espaço (grade 8×4, +2 linhas com a mochila grande) substitui o peso: peças de tamanhos diferentes (rifle 5×2, pé de cabra 1×3…), arrastar, girar, **Organizar**; mochila e colete são vestidos (não ocupam espaço); o que não cabe vai ao baú. Bancada em cartões com ingredientes em ícones, filtro "Prontas" e o resultado indo direto para a grade.
- **Som e clima:** níveis de áudio ~−10 dB (config migra para `v:4`); a chuva é clima/atmosfera: o alcance de visão cai só 3% (neblina e poeira continuam reduzindo), menos escuridão e menos gotas.

### Código
`components/Controles.tsx` (stick dinâmico com histerese), `components/Hud.tsx` (VRow, useRecente, atalhos urgentes, agir contextual), `components/Mochila.tsx` + `game/sistemas/grade.ts` (grade pura + `sincGrade()` que mantém `inv` e `grade` iguais), `components/Bancada.tsx`. `inv` continua a verdade do jogo; `grade` guarda a posição.

### Pendências / ideias
- Combinar itens arrastando um sobre o outro (estilo RE4), roda de atalhos configurável, mais tamanhos/pilhas e arma/ícone próprios na grade.
- Ajustar `ZONA_*` do stick (limites 0,3/0,46/0,76/0,9 em `Controles.tsx`) depois de testar no celular.

## 18. Objetivos, coleta de recursos, fonte e espaçamento (31/out/2026)

**Pedido do Uwlo:** melhorar objetivos, coleta de recursos, fonte e espaçamento.

- **Objetivos** (`game/dados/objetivos.ts`, `game/sistemas/objetivos.ts`): campanha em 3 atos (12 objetivos) com progresso numérico (x/y) no rastreador e no Diário, **estrela no mapa** no local do objetivo, XP + itens, **banner "Objetivo cumprido"** e aviso do próximo. O sinal do rádio vale em qualquer ponto da campanha; a **Torre de Rádio sempre guarda um rádio** (`TEMAS.radio.garante`). Saves antigos recontam em silêncio (`Run.objVer`).
- **Coleta de recursos:** **itens soltos no chão** (`game/lib/soltos.ts`, `Zona.soltos`, `Cena.atualizarSoltos`): gravetos, sucata, trapos, latas, ervas e placas por bioma; é só passar por cima. Persistem em `ZEstado.coletados` (voltam em 3 dias). Cada coleta cronometrada tem **ritmo**: a cada batida há som e partículas do material (`ticarAcao`: cortar, metal, água, poeira). Os rótulos dizem o **rendimento e o que falta** ("Cortar árvore (madeira ×3–5)" / "precisa de machado"). O que entra na mochila aparece como **texto flutuante** perto do personagem (`Cena.flutuar`) e conta em `st.col_<item>` (alimenta objetivos).
- **Fonte:** Pixelify Sans (OFL) para texto e rótulos; Silkscreen só no logo e títulos (16/32/56 px, múltiplos da grade de 8); VT323 só em números do HUD. Sem texto abaixo de 12 px; botões em caixa baixa.
- **Espaçamento:** escala 4/8/12/16/24 (`--sp1..5`), alvos de toque de 40–54 px, HUD com mais respiro, relógio que nunca encosta nos botões do canto. Camada de overrides no fim de `app/globals.css`.
- Pendências: parênteses da Pixelify Sans parecem chaves (peculiaridade do glifo); fontes de água limpa (poços/cisternas) e mais tipos de nó de coleta (minério, ervas medicinais).

## 19. Balanceamento, spawn de monstros e NPCs (31/out/2026)

**Pedido do Uwlo:** balancear a dificuldade, lógica e testes do spawn de monstros, mundo mais vivo com NPCs, testes de dificuldade e balanceamento.

### Testes de balanço (`npm run teste`, ~3 s, sem navegador)
`tools/testes.mjs` empacota `tools/testes/principal.ts` com esbuild e roda 31 testes. As **metas de projeto** estão como número e quebram o teste se um ajuste estragar o equilíbrio:
- **Combate** (`game/dados/balanco.ts`): 1 irradiado custa 8–30% da vida com o pé de cabra; 3 juntos 45–90%; matilhas/javali do começo não matam no corpo a corpo; Colosso é letal de perto com qualquer arma e cai em ≤ 24 golpes; armas melhores têm ≥ 1,3× o DPS; Calmo < Normal < Brutal (×0,75 / ×1 / ×1,3).
- **Necessidades:** sede 100→0 em 12–16 min reais (Normal), fome em 19–25 min (`FOME_POR_MIN = 0.044`, `SEDE_POR_MIN = 0.07`).
- **Mundo:** a ameaça da zona cresce ≥ 5% por degrau de perigo; nada nasce a < 22 tiles da chegada; Colosso raro; toda zona tem ≥ 1 dia de água e comida (Ermo e Floresta ≥ 1,5 dia de água).
- **Spawn** (`game/sistemas/spawn.ts`, puro): alvo de hostis por hora/bioma/nível/dia/dificuldade (0 no abrigo, noite ≥ dia, ≤ 3 de dia e ≤ 5 de noite no nível 1), intervalo, escolha de arquétipo (sem gangues antes do nível 3, corredores crescem à noite), tamanho de grupo, ponto de nascimento no anel 14–24 (60% atrás de quem olha) e **tensão** (depois de apanhar a reposição para; alívio em ≤ 25 s).
- **NPCs:** planejamento determinístico, frequências por tipo, falas válidas para todo objetivo/clima/hora, estoque válido, troca sem lucro infinito.
Para balancear: mexa nos números (`balanco.ts`, `criaturas.ts`, `biomas.ts`, `meta.ts`), rode `npm run teste` e leia qual meta quebrou.

### O que foi reajustado
Irradiado 12→10 de dano e cd 1,2; cão 9→7; lobo hp 34, dano 9, cd 1; javali 14 de dano; fome/sede mais lentas; invasão `(1,5 + 0,8·dia)·(1−0,2·muralha)` (dia 2 = 3); densidades por bioma e tema (Ermo 0,8, Floresta 1,0, Pântano 1,6, Refinaria 1,6, Hospital 1,5, Posto 0,95). **Reservatórios de água limpa** (`Bioma.fontes`, 4 usos, enchem garrafa ou matam a sede) e **legumes soltos** no Ermo resolveram a falta de comida/água das primeiras zonas.

### NPCs (`game/dados/npcs.ts` puro + `game/sistemas/npcs.ts`)
Mascate (visita o abrigo a cada 3 dias; troca por **fichas**), sobrevivente acampado (fogueira própria, dá dica do objetivo atual e um presente na 1ª conversa) e viajante (anda pelo mapa). IA: olham para você, vagam por perto, **fogem de hostis e de quem os ataca** (atacar NPC marca `Run.traiu`: os mascates se recusam a negociar). "…" sobre quem ainda não falou. Ficha: item de 1×1 (pilha 99) achado em caixas, balcões, malas e baús de gangue; o baú do abrigo começa com 6. Preços: comprar = valor×1,35, vender = valor×0,55 (`VALOR` em `balanco.ts`).

### Ganchos de teste
`cena().devNpc('mascate'|'acampado'|'viajante')`, `cena().spawnDinamico()` (+ `tSpawnUlt`, `tensao`), `cena().hostisPerto()`.

### Pendências
Mais NPCs (médico que cura por fichas, mecânico), contratos dados por NPC, cão companheiro, testar o equilíbrio em partidas longas no celular e ajustar as metas.


## 20. Controles fixos, uma mão, dificuldade gentil e progressão linear (31/out/2026)

**Pedidos do Uwlo:** manche fixo + botão de ataque (segurar = ataque automático); depois "tô achando muito difícil", "progressão linear (olhar o Last Day on Earth)" e "movimento point & click para jogar com uma mão só". O site roda na **Vercel** (https://cinzas-green.vercel.app, reconstrói a cada push na `main`); o workflow do GitHub Pages saiu e entrou `.github/workflows/ci.yml` (testes, tipos, build e smoke).

### Controles (`components/Controles.tsx`, `game/sistemas/toque.ts`, `cfg.controle`)
- **Uma mão (`'toque'`, padrão):** tocar no chão anda até lá (A* em 4 direções, rot.js, suavizado em linha reta; **toque duplo corre**); tocar num objeto/NPC vai até ele e interage ao chegar; tocar numa criatura persegue e ataca. O **ataque automático fica sempre ligado** (360°, só com alvo ao alcance, nunca fere NPC). Marcador pulsante no destino (verde), na criatura (vermelho) e no objeto (laranja).
- **Duas mãos (`'manche'`):** manche FIXO embaixo (leve = furtivo · médio = andar · borda = correr) + botão de ataque fixo (tocar = golpe com mira assistida; **segurar 260 ms = ataque automático**; arrastar a partir do botão = mira à mão). Modo canhoto espelha os lados; atalhos em grade 3×2 no vão entre os dois.
- Troca por um botão no topo do HUD (dedo = uma mão, manche = duas) e na Config. Tela estreita: tamanhos encolhem (`--base`, `--atk`, `--slot`).
- Ganchos de teste: `cena().toque` (rota, destino, alvo), `cena().mirarAuto(ang, amplo, foco)`, `ponte.entrada.auto`.

### Dificuldade (números em `balanco.ts`, `criaturas.ts`, `biomas.ts`; metas em `npm run teste`, 36 testes)
- Dano dos inimigos −20%, grupos menores, menos fauna hostil no Ermo/Floresta, menos gangues e Colossos; multiplicadores Calmo/Normal/Brutal de dano 0,5/0,75/1,1, fome 0,6/0,8/1,1, spawn 0,45/0,7/1,2, XP 1,2/1/1,2, invasão 0,5/0,8/1,3.
- Fome 100→0 em ~34 min reais e sede em ~22 min (Normal). Bandagem 15, kit 60, regeneração 0,35/s alimentado, +4 de vida máxima por nível (até +40).
- Início: 3 águas, 4 bandagens, 3 enlatados, faca; 8 de combustível e viagens ~40% mais baratas. Invasões só a partir do dia 3 (1–2 invasores).
- **Calmo é o padrão e não tem morte permanente:** desmaia, perde ~40% da mochila (menos arma, equipamento e rádio) e acorda no abrigo 6 h depois com 60% da vida. Meta v2 volta quem tinha Normal salvo para o Calmo uma vez.

### Progressão linear (`dados/objetivos.ts`, `dados/locais.ts`, `dados/itens.ts`)
- **Campanha de 24 passos em 4 atos** (Sobreviver → Crescer → Território → A saída), sempre com o próximo passo no HUD, estrela no mapa e recompensa em XP/itens. Saves antigos recontam em silêncio (`OBJ_VER`).
- **O mapa abre por nível** (`Local.nivel`: Ermo 1, Posto/Floresta 2, Cidade 4, Hospital/Pântano 5, Torre 6, Refinaria 7, Posto Militar/Abrigo 7 = 8) e **as receitas da bancada também** (`Receita.nivelJog`). O mapa e a bancada dizem o motivo do bloqueio; ao subir de nível aparece "Liberado: …".
- Teste de projeto: a campanha só pede um local depois de ter pago o XP do nível dele, e ≥ 50% do XP de cada passo de nível vem da campanha.
- Ganchos: `cena().devObjetivo('id')`; o smoke usa `devXp` para liberar os locais temáticos.

### Pendências
Som equalizado, mundo mais cheio e a viagem de carro animada foram feitos (ver §21); falta o detalhe visual no cenário do jogo.


## 21. Mundo cheio, som equalizado e viagem de jipe animada (31/out/2026)

**Pedidos do Uwlo:** "muita área vazia sem nada pra fazer", "mais recursos e interação", "melhorar som, equalizar" e "a viagem de carro não tem sprites das cidades nem animação do carro".

### Mundo cheio (`game/sistemas/cobertura.ts`, `game/zona.ts`, `game/dados/colheita.ts`, `game/dados/notas.ts`)
- **Medido, não achado:** a distância até a "atração" mais próxima (tudo que dá para usar: caixa, poço, bilhete, planta…) numa transformada de distância chanfro 3-4. Antes: Ermo com o pior ponto a 42 tiles e 95% das células a 24; Refinaria 46, Torre 41, Posto Militar 47. O gerador de pontos de interesse (bloco "POI" antes do jipe em `zona.ts`, até 64 rodadas, `LIM = 10`) preenche os buracos; depois, pior ponto ≤ 16 e p95 ≤ 9,1 em todas as zonas (teste de projeto).
- 9 modelos de POI (`MODELOS`): acampamento (fogueira), carros acidentados, depósito, cemitério, poço de água limpa, ferro-velho, ruínas com móveis, corpo com bilhete e jardim; `PESO_POI` por bioma; alguns com vigias (irradiado/rastejador). Props voxel novos: poço, pilha de sucata, cruz.
- **Colheita:** arbusto vivo → baga, flor → erva, cogumelo → cogumelo (+4 de radiação), junco → fibra; a planta vira tufo e volta em 3 dias (`ze.colhidas`). A Floresta passa de 290 plantas colhíveis. Itens novos com ícones próprios em `public/icons/cinzas` (listados em CREDITS).
- **Ferro-velho:** garimpar (3 usos por visita, às vezes peças). **16 bilhetes e diários** com XP e às vezes algo escondido (painel de leitura, `ze.lidas`). Conquistas: Leitor, Mão boa para o mato, Garimpeiro.

### Som equalizado (`game/dados/sons.ts` puro + `game/audio.ts` reescrito)
- Cada som é normalizado ao nível da sua categoria (energia em 200 ms, pico ≤ −3 dBFS). Antes: do Colosso a −16 dB ao Geiger a −49 dB (33 dB de espalhamento, clique do menu 15 dB abaixo do tiro). Agora: tiro > pancada > voz > coleta > interface > passo > ambiente, com ≥ 8 dB entre tiro e passo (teste).
- Cadeia: barramentos (efeitos, interface, ambiente, música) com ducking → EQ (graves/agudos) → compressor → limitador; reverb ao ar livre e interno; sons distantes ficam mais escuros. Config. ganhou **Equalizador**: Equilibrado, Alto-falante do celular, Fone, Noturno + graves/agudos + "Testar som". O `motor` do jipe toca na viagem.

### Viagem de jipe animada (`game/lib/viagem.ts`, `game/sistemas/rota.ts`, `components/Viagem.tsx`, `components/IconeLocal.tsx`)
- **A cena** (`criarCenaViagem({ de, para, hora, clima, seed, w, h, total, criar }).desenhar(g, estado, dt)`; canvas 2D, pixel art 100% procedural, só retângulos inteiros): céu por hora e clima (sol, lua, estrelas, nuvens, chuva, raio, névoa, poeira), horizonte em 2 camadas de paralaxe que **muda do bioma de origem para o de destino no meio da rota**, placas ("Cidade 7") e postes na beira, asfalto rolando e o **jipe** (rodas girando, suspensão, faróis à noite, luz de freio, fumaça, poeira). O **marco de cada local** (os "sprites das cidades": base, ermo, floresta, cidade, pântano, refinaria, posto, hospital, torre, posto militar e abrigo 7) aparece no horizonte: o da origem fica para trás e o do destino **cresce** até a chegada (pintado fora da tela e desenhado em escala, com névoa).
- **A física** (`rota.ts`, pura): `passoRota` acelera, cruza a estrada, **freia na distância certa diante da barricada do evento** (nunca pula o evento, com qualquer passo de tempo), espera enquanto o jogador decide, retoma e chega; devolve `'meio'`/`'fim'`.
- **O fluxo:** `viajar` agora só abre a viagem (`store.viagem`, fases indo/evento/retomando/chegando). `viagemMeio` abre o painel do evento quando o jipe para; `viagemFim` gasta combustível/horas e carrega o destino por baixo; a tela some quando `zonaId === destino && carga ≥ 1` (ou ao sair do jogo, como na vitória). O jogo pausa a cena na viagem e esconde o "GERANDO O ERMO".
- **O mapa** (`IconeLocal`): cada local mostra o mesmo marco, recortado e sem rótulo, no lugar dos quadrados coloridos.
- **Testes:** 48 de projeto (marcos de todos os locais cabem no quadro e são distintos; cena válida — inteiros, cores, transparência — em todos os 110 pares de locais × hora × clima; anima quando anda e para quando para; física da rota com vários passos de tempo). Smoke: tela de estrada com origem e destino, quadros diferentes, barra que cresce, parada diante do evento, tela some na chegada, ícones do mapa. Ganchos: `window.__viagemRapida` (câmera rápida), `__semEventos`, `cena().devEv`.

### Pendências
Mais detalhe visual no cenário do jogo (decalques no chão, partículas de ambiente, luzes e animações), ainda não feito; tudo foi validado em Chrome headless e por modelo numérico, nada num celular real.
