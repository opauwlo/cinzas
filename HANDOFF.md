# HANDOFF — CINZAS

Passagem de bastão da sessão de chat (31/out/2026) para a sessão de Code.
Leia inteiro antes de começar. Nome **CINZAS** é provisório.

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
