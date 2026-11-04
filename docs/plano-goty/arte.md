# CINZAS — Plano de Direção de Arte rumo ao TGA 2027

Diretor de Arte · 4/nov/2026 · corte do TGA ≈ 20/nov/2027

Base deste plano:
- leitura de `HANDOFF.md` (§13–§23), `docs/REVISAO.md`, `docs/VALIDACAO.md`;
- leitura do código de arte: `game/lib/vox.ts`, `fabrica.ts`, `humano.ts`, `paletas.ts`, `cor.ts`, `rig.ts`, `game/chao.ts`, `game/sistemas/clima.ts`, `game/cena.ts` (luz, névoa, grade de cor, `criarJogo`), `game/lib/viagem.ts`, `components/ArteMenu.tsx`, `app/globals.css`;
- as 15 capturas em `docs/capturas/`;
- 21 capturas novas do build atual, a 412×915 CSS com DPR 2, em `docs/plano-goty/arte-capturas/` (nomes `01-menu.png` … `21-arte-humanos.png`): base de dia, no pôr do sol e à noite; Ermo de dia, com Colosso, com tempestade e com poeira; Cidade de dia e à noite; Floresta com neblina e limpa; Pântano à noite e com chuva ácida; Refinaria; viagem; catálogo.

Não alterei nenhum arquivo do repositório. O script temporário de captura foi apagado.

---

## 0. Resumo em 10 linhas

1. A **tecnologia de arte já é um diferencial**: voxel → pixel isométrico em 8 direções, com tudo procedural. O que ainda falta é a **direção**: valor, cor com significado, escala e momentos.
2. O maior problema é a **leitura**. A jaqueta do protagonista (`OLIVA #4D5339`) contra o chão do Ermo (`#554C3E`–`#665C4B`) dá **contraste de 1,05–1,22:1**. Na prática ele some no chão. À noite, some de vez (capturas 12 e 15).
3. O **Colosso não é colossal**. É o humano "gordo" escalado ×1,55–1,75 (`humano.ts:261`) e, no jogo, fica do tamanho de um irradiado grande (captura 07). Era para ser a imagem-assinatura e hoje não é.
4. A tela tem **buracos pretos** (o vazio fora da zona chega a 25–40% do quadro), **dithering Bayer grosso** de 2×2 na névoa e na luz (parece retícula de jornal) e **bordas de bioma em degrau de tile**.
5. A **viagem de jipe é a arte mais bonita do jogo**, mas ocupa só 45% da tela e usa outro jipe e outra densidade de pixel.
6. **Bug de fonte** em todo lugar: a ligadura "fi" da Pixelify Sans sai quebrada ("ConAgurações", "ReAnaria", "Acam"). Correção de 1 linha (P0).
7. Tese da arte: **"O mundo é cinza; a cor é rara e significa alguma coisa."** Cada cor saturada carrega um sentido: brasa = gente viva, ciano Cherenkov = radiação, sangue = dano. O resto do quadro fica em cinza vulcânica.
8. A identidade se ancora em **São Paulo depois da bomba**. A coordenada 23°33′ S do menu já aponta para lá. Entram o brutalismo paulista, o pixo, o orelhão, a espuma tóxica do Tietê, o Césio-137 de Goiânia e as sombras gravadas de Hiroshima. Nenhum jogo pós-nuclear tem isso.
9. Ficam 5 imagens-assinatura que viram key art, trailer e thumbnail. Todas saem **de dentro do motor**, por um Modo Foto.
10. Há 14 gates verificáveis, e 9 deles são automatizáveis no padrão dos smoke tests (`tools/qa-*.mjs`).

---

## 1. Diagnóstico honesto do visual atual

### 1.1 O que já tem identidade (preservar)

| Elemento | Onde se vê | Por que funciona |
|---|---|---|
| Pipeline voxel → pixel iso 2:1 com 4 faixas de luz, contorno seletivo e borda interna (`renderVox`) | `humanos.png`, `props.png`, `estruturas.png` | Luz e projeção consistentes em tudo. Criar um item novo é só adicionar dados. Nenhum outro web game faz isso. |
| Lenço laranja do protagonista | todas as capturas de jogo | É o único ponto quente do quadro. Funciona como o vermelho de *Inside* e *Limbo*, por acidente. Vai virar regra. |
| Árvores carbonizadas com brasa interna | `flora.png` (2ª árvore), captura 06 | Silhueta forte e narrativa: o fogo continua vivo dentro da madeira. |
| Chuva ácida verde | captura 16 | Lê na hora, sem precisar de UI. |
| Decalques (ossos, sangue seco, óleo, fissuras) | capturas 06, 07, 11 | Dão história ao chão. |
| Viagem de jipe ao pôr do sol com marcos no horizonte | captura 18, `viagem.png` | Valores bem separados, silhuetas de chaminés contra o céu brasa. É o quadro mais "postável" hoje. |
| UI em aço com cantos em degrau, bisel de 2 px e ícones 1-bit | `mochila.png`, HUD | É coesa, adulta e sem cápsulas. |
| Ilustração do menu (cogumelo, ruínas, sobrevivente) | `menu-antes.png` | O conceito é certo. A execução final (`menu-depois.png`) enterrou o personagem atrás do logo. |
| Variedade humana | `humanos.png` | Hazmat amarelo, jaleco, camuflado, irradiados com tumores e olhos emissivos. |

### 1.2 O que parece amador ou genérico

1. **Valor achatado e chão dominante.** Cerca de 80% do quadro é chão em valores médios-escuros (rampas `TERRA`, `ASFALTO`, `GRAMA` de `chao.ts`), e o ruído é igual em toda parte: `fbm` + grão + decalques na mesma frequência. Não há áreas de descanso nem planos de valor. O resultado é "lamacento" (capturas 06, 10, 14).
2. **Figura × fundo.** O protagonista (oliva/jeans escuro) tem 1,05–1,22:1 de contraste contra a terra. Os irradiados (pele `PELES_DOENTES #8D9A79`) também quase não se separam da grama. Só a sombra e o lenço salvam a leitura.
3. **Tingimento por sprite, não por luz.** `Cena.tom()` (`cena.ts:270`) escurece o sprite inteiro em 12 níveis multiplicativos. A lanterna e a fogueira não modelam volume: o personagem fica chapado e escuro.
4. **Noite ilegível.** A grade da noite é um MULTIPLY azul saturado `[96,112,178]` (`clima.ts` KEYS). Somada ao FOV, deixa o quadro quase preto-azulado, e o jogador vira uma mancha (12, 15). A luz da lanterna aparece como xadrez Bayer grosso, sem forma de cone (04, 05).
5. **Retícula grossa.** Névoa, poeira e luz usam Bayer 4×4 em células de 2×2 px (`fz=2`, `cz`), o que gera um tabuleiro visível. Ela cobre até a HUD (09, 13) e parece artefato de compressão, não escolha de estilo.
6. **Bordas de bioma em degrau.** Areia no Ermo e grama na Floresta seguem o tile e fazem zigue-zague serrilhado (06, 14). Isso denuncia o grid e o procedural.
7. **O mundo acaba num losango preto.** O vazio `#050506` fora da zona aparece em quase toda captura (02, 06, 10, 12, 14), às vezes em 30–40% da tela. Quebra a ilusão de mundo.
8. **A Cidade não lê como cidade.** A chegada à Cidade Velha (10) mostra terra rachada e móveis soltos no meio do nada. Os prédios são caixas escuras sem telhado, fachada ou altura (`estruturas.png`). Falta um skyline.
9. **O Colosso é um humano maior** (07, 20). Usa o mesmo rig e quase a mesma silhueta, com ~1,65× de altura. Tem pouca presença, nenhum aviso visual de chegada e nenhum design memorável.
10. **Animação.** São 4 quadros por ciclo (`clipes.png`), sem antecipação, impacto segurado nem follow-through. O ataque não desenha arco. Os corvos são blobs (`animais.png`, linha 5).
11. **Saturações soltas.** Os cogumelos rosa-neon e verde-neon (`flora.png`) e as flores multicoloridas na grama (02) quebram a paleta sem significado.
12. **Incoerências de modelo.** O jipe da base é bege e aberto (`props.png`), o da viagem é um sedã verde fechado (18). O carro da Cidade é uma caixa sem vidro.

### 1.3 Legibilidade em celular

- **Tamanho do personagem:** ~42 px de arte = ~42 px CSS no padrão Ultra (`criarJogo`: `k = max(2, round(esc·dpr))`). Num Android com DPR ≈ 2,75 isso dá ~7 mm de altura. Dá para ler parado, mas fica fraco em movimento e sob sol.
- **HUD:** o bloco do topo (vitais, relógio, 4 botões, OBJ) ocupa **~33% da altura** (y 0–300 de 915). A barra de atalhos de baixo ocupa outros ~6%. O mundo útil fica com ~60%, e o vazio preto come parte disso.
- **Texto:** Pixelify Sans com corpo ≥ 12 px é legível. A ligadura "fi" quebra palavras (menu, mapa, morte), e os parênteses parecem chaves ("contrato{s}", já anotado no §18).
- **Ícones do topo:** "mão", "espiral" e "bonequinho 21" são ambíguos sem legenda (02).
- **Mapa** (`mapa.png`): rótulos sobrepostos e cortados ("Rennaria 9", "rta Morta"), blob pontilhado verde/laranja sem leitura cartográfica.

### 1.4 Coesão entre jogo, UI, menu e viagem

| Superfície | Densidade de pixel | Paleta dominante | Coesão |
|---|---|---|---|
| Jogo | 1 px arte ≈ 1 px CSS | terra, oliva, azul-noite | — |
| HUD | ícones 1-bit, bisel de 2 px | aço `--a1 #1A1D21`, fósforo, âmbar | boa com o jogo |
| Menu (`menu-depois`) | hero 140×70 escalado ~6× | verde-escuro, papel `#EEE7D5`, CTA pastel `#D7A263` | **baixa**: parece landing page de app; dois laranjas (`#D7A263` × `--aviso #C9641E`) |
| Viagem | ~2× mais grossa que o jogo | céu brasa/roxo, flat lateral | média: bonita, mas outro jipe e outra escala |
| Morte e vitória | cards de app | mesmo layout nas duas, só muda a cor | **baixa**: sem imagem, sem drama, quebra o peak-end |

**Veredito:** o CINZAS tem um **motor de arte de nível GOTY-indie e uma direção de nível protótipo**. Isso é bom: dá para corrigir a direção sem refazer o motor.

---

## 2. Visão de arte

### 2.1 Frase-tese

> **"O mundo é cinza; a cor é rara e significa alguma coisa."**
> Cinza vulcânica e concreto paulista na maior parte do quadro. Brasa onde há gente viva. Ciano Cherenkov onde há o que mata sem ser visto. A cor plena só volta no fim.

O subtítulo de produção é **"São Paulo, 40 dias depois do clarão"**. Ele ancora a direção num lugar real, como Clair Obscur se ancorou na Belle Époque. A decisão do cenário é de Roteiro e Produção, ver §7.

### 2.2 Referências (com o que tirar de cada uma)

**Fotografia e história**
- **Sombras de Hiroshima** (degraus do Banco Sumitomo): silhuetas humanas gravadas pela luz. Vira motivo visual central (imagem-assinatura 1) e a tela de morte.
- **Acidente do Césio-137, Goiânia (1987)**: o pó que brilhava azul atraiu as pessoas porque era bonito. Gera o tema "a beleza que mata" e a cor da radiação. Tratar com respeito: sem nomes de vítimas, com texto revisado por Roteiro.
- **Sebastião Salgado, *Kuwait: um deserto em chamas*** e *Terra*: poços de petróleo em chamas, fumaça preta, homens pequenos e escala épica, num P&B quente. É a Refinaria 9 e a grade de valor do jogo inteiro.
- **Espuma tóxica do Tietê em Pirapora do Bom Jesus**: rio coberto de espuma branca. É o Pântano Tóxico.
- **Robert Polidori, *Zones of Exclusion*** (Pripyat): interiores abandonados com cor desbotada. São o Hospital e a Cidade.
- **Imagens da TV de Chernobyl** com "neve" branca de radiação no sensor: vira o VFX "neve de radiação".

**Pintura**
- **Candido Portinari, *Os Retirantes*** (1944): figuras caminhando numa terra morta com urubus. Dá a paleta terra-cinza, o tom brasileiro e o enquadramento dos NPCs viajantes e dos corvos.
- **Zdzisław Beksiński**: formas orgânicas fundidas à arquitetura. Base do design do Colosso e das anomalias.
- **Anselm Kiefer**: cinza, chumbo, palha e terra queimada como matéria. Base da textura do chão do Ermo.
- **Caspar David Friedrich, *Caminhante sobre o mar de névoa***: figura minúscula diante da vastidão. Composição da key art.
- **Goya, *Pinturas negras*** (*Saturno*): proporção errada e escuridão quente. Base do Colosso.

**Cinema**
- **Tarkovsky, *Stalker***: sépia fora da Zona e cor dentro. É o modelo direto para a cor mudar com a radiação e com a história.
- ***Threads* (1984)** e ***Vem e Veja***: realismo seco, sem glamour. Calibram o tom das telas de morte.
- ***Ensaio sobre a Cegueira*** (Meirelles): branco superexposto como horror. Base do "clarão" e do meio-dia lavado.
- ***Nausicaä*** (Miyazaki): o Ohmu como gigante que é ameaça e natureza ao mesmo tempo. Base do comportamento do Colosso e da floresta tóxica.
- ***Mad Max: Estrada da Fúria***: grade de cor agressiva, laranja de dia e azul "day-for-night". Base da viagem.

**Jogos**
- ***Darkwood***: visão de cima, escuridão e cone de visão. A referência direta de como a noite pode ser escura e ainda legível.
- ***Hyper Light Drifter***: paleta curta, figura pequena, monumentos gigantes e cor como pavor. Base de escala e silhueta.
- ***Inside* e *Limbo***: monocromia com um acento único. É a regra do lenço.
- ***Disco Elysium***: tipografia e UI com caráter, cor como humor. Base do menu, das notas e do diário.
- ***Clair Obscur: Expedition 33***: identidade cultural específica acima do orçamento. Base da estratégia (São Paulo).
- ***Octopath Traveler*** (HD-2D) e ***Eastward***: pixel art com luz dinâmica moderna. Base do plano de normal maps vindos do voxel (§4.4).
- ***Signalis***: pixel de baixa resolução com UI diegética de terminal. Base do rádio e do Geiger.
- ***Frostpunk***: luz e calor como recurso visível. Base da fogueira e do abrigo.

### 2.3 Paleta-mestra "Cinza & Brasa"

A **fonte única** passa a ser `game/lib/paletas.ts`, exportada também como variáveis CSS por um script de build. Hoje `globals.css` e o jogo têm hex soltos e duplicados.

**Neutros (rampa "cinza vulcânica", levemente quente): 80–88% de todo quadro**

| Token | Hex | Uso |
|---|---|---|
| N0 | `#0B0A09` | contorno, fuligem, vazio (substitui `#050506`) |
| N1 | `#161412` | sombra profunda |
| N2 | `#221F1C` | sombra |
| N3 | `#2F2B27` | chão escuro |
| N4 | `#3F3A34` | chão médio |
| N5 | `#534D45` | chão claro e concreto sujo |
| N6 | `#6B645A` | cinza vulcânica |
| N7 | `#877E71` | cinza clara e poeira |
| N8 | `#A79D8E` | luz difusa |
| N9 | `#CFC7AE` | osso; texto (= `--osso` atual) |

**Secundários de bioma (≤ 12% do quadro, sempre dessaturados: OKLCH C ≤ 0,08)**

| Família | Hex (escuro → claro) | Onde |
|---|---|---|
| Terra/ferrugem | `#2B2118` `#3F2E20` `#5B4331` `#7A4E2E` `#8A4B2A` `#B0683A` | Ermo, Refinaria, sucata |
| Vegetação doente | `#2E3320` `#3F4325` `#5C6236` `#7A8A3A` `#9A8F3A` | Floresta, Base, Pântano |
| Concreto frio | `#2A2D2F` `#3E4245` `#5A5F62` `#7E8487` `#A9AEAD` | Cidade, Hospital, Abrigo 7 |
| Água turva | `#1F2B2C` `#334649` `#4C676A` `#739494` | poças, rio, reservatório |
| Trinitite (vidro de cratera) | `#2F4A2E` `#3E5A3A` brilho `#8FB58A` | crateras do Ermo (reflexo de 1 px) |
| Azulejo hospitalar | `#3F5E54` `#5E8C7A` `#8DB3A1` | Hospital São Judas |

**Acentos semânticos (≤ 3–4% do quadro; cada um tem UM significado)**

| Token | Base | Sombra | Brilho | Significado (e só ele) |
|---|---|---|---|---|
| BRASA | `#E8762B` | `#8A3A12` | `#FFB26B` | gente viva, fogo, abrigo, o jogador (lenço), botão principal |
| CHERENKOV | `#5CE1FF` | `#1C6F8F` | `#E6FBFF` | radiação. Sempre emissiva (flag `EMIS`). Nunca decorativa. |
| SANGUE | `#B03A2C` | `#5A1810` | `#E0553F` | dano, hostil, vida crítica |
| BILE | `#B5C93A` | `#5A6A1A` | `#D9E86A` | químico e tóxico (chuva ácida, barril, pântano) |
| FÓSFORO | `#8FE36A` | `#3A6A2A` | `#C8F5B0` | só UI diegética de terminal e rádio: XP, objetivo, progresso |
| AURORA | `#9FC3D9` | `#4A6A80` | `#F6D7A0` | céu limpo e esperança. **Aparece pela 1ª vez no Abrigo 7.** |

**Regras de uso (verificáveis)**
1. **Orçamento de croma:** em qualquer quadro de jogo, pixels com OKLCH C > 0,12 somam **≤ 4%** da área, fora dos momentos roteirizados (gate G6).
2. **Um acento por foco.** Brasa e Cherenkov não dividem o mesmo elemento de UI. No mundo, eles se encontram só nas imagens-assinatura 2 e 3, como conflito deliberado.
3. **Ciano saturado só existe se for radioativo.** Por isso a água deixa de ser azul vivo. A barra de sede passa de `#6FA6D6` para `#8FB2C9` (água turva) com ícone de gota. A raridade "incomum" sai de `#7AA8D8` para `#7E9CB8` e ganha marcação por forma (1, 2 ou 3 rebites na moldura).
4. **Um só laranja de ação.** O CTA do menu (`#D7A263`) e `--aviso #C9641E` viram BRASA `#E8762B`. O pastel sai.
5. **Fim do neon gratuito.** Os cogumelos rosa e verde de `flora.ts` passam a: cogumelo comum em terra/osso; cogumelo radioativo com núcleo CHERENKOV emissivo, que **é** radioativo no jogo (o +4 de radiação do §21). As flores multicoloridas viram 2 tons de osso e ferrugem.
6. **Decisão a confirmar com o Uwlo:** a radiação muda de **verde-fósforo para ciano Cherenkov**. Motivos: verde é o clichê do gênero (Fallout, Stalker, Metro), o azul é fisicamente verdadeiro (Cherenkov e o césio de Goiânia) e o azul permite o tema "beleza que mata". O verde passa a significar químico (BILE) e terminal (FÓSFORO). Se ele recusar, o resto do plano continua valendo, e só a imagem-assinatura 3 perde força.

### 2.4 Forma e silhueta

**Gramática de formas** (estende a regra do §12, "cápsula = seguro, polígono cortado = perigo"):
- **Humanos vivos:** verticais e retos, com cabeça proporcional (7–8 px em 42).
- **Mutantes:** assimétricos, curvados e com proporção errada: cabeça pequena demais, um braço longo, corcunda. A mutação se lê em silhueta, não em textura.
- **Fauna:** horizontal. **Insetos:** radiais (pernas). **Aves:** em V aberto.
- **Perigo:** pontas, triângulos e diagonais (arame, vergalhão, espinho de gangue). **Seguro:** retângulos baixos e horizontais (cama, bancada, muro do abrigo).
- **Interativo:** um *glint* de 1 px (N9) que pisca a cada 3 s nas bordas superiores. Sem contorno brilhante.

**Silhueta por arquétipo (tem que passar no gate G1 em preto chapado):**

| Arquétipo | Traço de silhueta obrigatório |
|---|---|
| Protagonista | casaco longo até o joelho, mochila alta acima do ombro, **lenço longo com 2–3 px que tremula** (movimento secundário pelo vento de `clima.rajada`) |
| Irradiado | tronco inclinado ~15°, braços pendentes à frente, cabeça caída |
| Corredor | tronco a ~35° para a frente, passada longa |
| Rastejador | horizontal, altura ≤ 14 px |
| Saqueador/gangue | ombreira assimétrica com pontas, arma longa |
| Miliciano | capacete arredondado, fuzil na diagonal |
| Colosso | 4–5× a altura humana, braço fundido a um vergalhão ou poste, cabeça pequena (§4.2) |
| Mascate/NPC | carga volumosa nas costas (fardo), ritmo lento |

**Contorno com intenção:** hoje `renderVox` escurece o vizinho para ×0,22 em toda borda. A proposta é um **tom de contorno por família**, passado em `Opc.outline`:
- hostil: `#3A0E0A`;
- jogador: `#3A1A08`;
- NPC neutro: `#1A1A14`;
- objeto: N0.

É imperceptível como "cor", mas o cérebro separa as famílias.

### 2.5 Luz e cor como narrativa

**Arco por ato** (campanha de 4 atos, §20). É implementado como LUT de grade de cor que substitui o retângulo MULTIPLY `this.grade` (`cena.ts:203`).

| Ato | Saturação global | Mundo | Acento dominante | Céu da viagem |
|---|---|---|---|---|
| 1 Sobreviver | 35% (quase sépia, como o *Stalker* fora da Zona) | cinza e terra | brasa (lenço, fogueira) | cinza-chumbo e brasa |
| 2 Crescer | 50% | a vegetação doente ganha verde | Cherenkov aparece nas zonas | entardeceres mais longos |
| 3 Território | 60% | o pixo das gangues traz tinta (magenta `#C2407E` e amarelo `#D9B43A`, só em parede) | sangue e brasa | céu vermelho de incêndio |
| 4 A saída | 45%, contrastado | tempestades, raios | Cherenkov forte | preto e raio |
| Final (Abrigo 7) | **100%: o primeiro azul limpo do jogo** | — | AURORA | amanhecer |

**Camadas dinâmicas (todas em shader, §5):**
- **Radiação local:** com a radiação do ar subindo, as sombras puxam para `#1C6F8F` (mistura de 0–35% na LUT) e entra a **neve de radiação**: pixels brancos de 1 px que piscam por 1 quadro, em taxa = cpm do Geiger ÷ 60, com teto de 40/s. É a mesma taxa do som, então a visão e o ouvido contam a mesma coisa. Desliga com `cfg.menosEfeitos`, e aí só a legenda visual fica.
- **Vida baixa (< 30):** dessaturação de 60% e vinheta pontilhada N0 nas bordas, pulsando com o batimento (com opção de reduzir).
- **Hora do dia:** amanhecer `#FFC49C`, meio-dia **lavado** (high-key, sombras curtas, como *Ensaio sobre a Cegueira*), entardecer BRASA longo (18:00–20:30), noite **carvão** em vez de azul: grade `[72,80,104]` no lugar de `[96,112,178]`, com áreas iluminadas quentes. Aplica o contraste quente/frio de Darkwood.
- **Clima:** tempestade com relâmpago que deixa o quadro branco por 1 quadro e projeta **sombras longas de todas as silhuetas** na direção oposta ao raio (respeitando G12). Poeira puxa a cor para `#BFA06E`. Neblina abaixa o contraste, não a luz.

---

## 3. As imagens-assinatura

São os quadros que um jurado lembra. Cada um tem que ser **jogável** (sai do jogo, não de pintura) e **reproduzível** pelo Modo Foto (§4.10). A composição-alvo é 9:16 (celular) com versão 16:9.

### 3.1 "A sombra que ficou" (key art principal e thumbnail)
- **O quê:** uma parede de concreto branca e chamuscada (N8/N9), com 3–5 **sombras humanas gravadas** (Hiroshima): um adulto, uma criança de mão dada, uma bicicleta. Ao pôr do sol, o protagonista para ao lado e a **sombra real dele**, longa e BRASA-escura, cai na mesma parede, alinhada às gravadas.
- **Paleta:** N2–N9 e BRASA no lenço e no céu. Nada mais.
- **Onde:** POI novo "Parede das Sombras" no Ermo e na Cidade (entra no `MODELOS` de POI de `zona.ts`). As sombras vêm de **poses do rig humano** renderizadas como silhueta e carimbadas como decalque. Cada seed tem uma parede diferente, e o diferencial procedural vira tema.
- **Thumbnail:** lê em 160×90 só com a parede clara, as silhuetas pretas e um ponto laranja.

### 3.2 "O Colosso na poeira" (clímax do trailer)
- **O quê:** tempestade de poeira (`#BFA06E`). Embaixo, o sobrevivente minúsculo de costas, com o lenço ao vento. Ao fundo, o Colosso 5× maior emerge da poeira, e as **rachaduras Cherenkov** do corpo são o único azul da tela. A sombra dele chega antes do corpo.
- **Composição:** Friedrich com Shadow of the Colossus. Figura no terço inferior, gigante ocupando 2/3 da altura.
- **Pré-requisito:** Colosso v2 (§4.2) e câmera com zoom-out dramático na chegada (§4.4).

### 3.3 "O pó azul" (Games for Impact e tema "beleza que mata")
- **O quê:** o Hospital São Judas à noite, sala de radioterapia com azulejo verde-hospital. Uma cápsula aberta no chão e o pó CHERENKOV iluminando a sala **de baixo para cima**. O protagonista estende a mão, e o Geiger e a neve de radiação estão no máximo.
- **Paleta:** azulejo `#3F5E54`, N0–N3 e CHERENKOV. O lenço BRASA é o único quente.
- **Narrativa:** referência ao Césio-137 tratada com respeito, com bilhetes revisados por Roteiro (§7). Conversa com o Modo Estudo: o que atrai nem sempre é bom.

### 3.4 "Estrada ao entardecer" (tela de carga e momento contemplativo)
- **O quê:** a viagem em tela cheia vertical, céu em 60% da altura e o marco do destino crescendo. Às vezes o **Colosso cruza o horizonte** em silhueta (1 em 6 viagens no ato 2+). Corvos em V e cinza caindo.
- **Já existe 70%** (`viagem.ts`). Faltam ocupar a tela, o jipe único e a paralaxe de primeiro plano.

### 3.5 "A porta do Abrigo 7" (final, peak-end e trailer de prêmios)
- **O quê:** a porta de aço se abre e, pela primeira vez no jogo, **o céu é azul AURORA**, com o mundo em saturação plena por 8 segundos antes dos créditos.
- **Uso na imprensa:** só no trailer de prêmios ("accolades") e em material com aviso de spoiler.

---

## 4. Plano por área

Legenda:
- **P0:** sem isso não há candidatura (base de leitura e identidade).
- **P1:** necessário para ficar no nível dos indicados.
- **P2:** polimento e bônus.
- Esforço **P** (≤ 3 dias), **M** (1–2 semanas), **G** (3–6 semanas), contando uma sessão de Code com o Uwlo testando no celular.
- **Proc.** = gerado por código. **Mão** = desenhado como dado (pixel a pixel em array) ou encomendado a artista humano.

### 4.1 Personagens e animação

| # | Item | P | Esf. | Proc./Mão | Arquivos | Pronto quando |
|---|---|---|---|---|---|---|
| A1 | **Protagonista-âncora**: receita fixa fora do `gerarHumano` aleatório, com casaco longo, lenço longo BRASA, mochila alta e silhueta única. Jaqueta clareada para N6/`#6B645A` e calça N5. Contraste ≥ 1,8:1 contra todos os chãos. | P0 | M | Proc. (receita) + Mão (ajuste do lenço) | `humano.ts` (novo `RecHumano` fixo), `paletas.ts` | G1 e G2 passam |
| A2 | **Rim light do jogador**: 1 px na borda virada para a fonte de luz mais forte (lanterna, fogueira, lua), em BRASA-brilho a 50%. Garante presença à noite. | P0 | P | Proc. | `vox.ts` (`renderVox` devolve máscara de borda), `cena.ts` | G2 noturno ≥ 1,5:1 |
| A3 | **Ciclos com mais quadros**: andar 4→8, correr 4→8, ataque 6 (2 de antecipação, 1 de impacto segurado em 60 ms pelo hit-stop existente, 3 de recuperação), morte 5→8, vasculhar 4 em loop, respirar 4 e "olhar em volta" a cada 6–10 s. | P1 | M | Proc. (poses no `rig.ts`) | `humano.ts` `CLIPES_HUMANO`, `poseHumano` | G14 |
| A4 | **Movimento secundário**: lenço, alças e cabelo comprido com atraso de 1 quadro e vento. O `Vox.cisalhar` já existe para plantas; reaproveitar por parte. | P1 | M | Proc. | `humano.ts`, `vox.ts` | vídeo lado a lado aprovado |
| A5 | **Espelhamento para criaturas**: 5 direções reais + 3 espelhadas (`Vox.espelhar` já existe). Corta ~37% do tempo de bake. O protagonista continua com 8 reais. | P1 | P | Proc. | `fabrica.ts` | bake −30% no aparelho |
| A6 | **Desmembramento legível**: coto em SANGUE-sombra com 2 px de osso N9 (hoje o membro só some). | P2 | P | Proc. | `humano.ts` (`falta`) | — |
| A7 | **Aves de verdade**: corvo com asa em V, bico N0 e pouso. Hoje é blob (`animais.png`). | P1 | P | Proc. | `fauna.ts` `montarAve` | G1 |

### 4.2 Criaturas e o Colosso

**Colosso v2 (P0, esforço G, procedural com direção à mão)**
- **Modelo próprio** (`registrarModelo({ tipo: 'colosso' })`), não mais `humano` com `esc 1,6`.
  - Altura de **170–200 px de arte** (4–5× o humano).
  - Grade voxel ~70×50×210 ("pele" com amostragem de 2 voxels onde não há detalhe, para caber no tempo de bake).
- **Design** (Beksiński + Goya + Ohmu):
  - homem gigante de pele **vitrificada como trinitite** (`#3E5A3A`→N6), rachada;
  - pelas rachaduras vaza **CHERENKOV emissivo**;
  - o braço direito é fundido a um poste de luz com fiação pendurada (gramática de perigo: diagonal e pontas);
  - cabeça pequena demais e inclinada;
  - nas costas, restos de um outdoor ou de placa de rua (ancoragem paulista).
- **Presença antes da aparição** (ligado a Game Design e Áudio):
  1. o Geiger sobe;
  2. a cinza do ar cai mais forte;
  3. o chão treme (`tremer`, respeitando `menosEfeitos`);
  4. **a sombra dele entra no quadro antes do corpo**;
  5. as pegadas ficam como decalque de cratera rasa por 3 dias de jogo.
- **Telegrafia:** antecipação ≥ 700 ms em todo golpe (o braço-poste sobe, a fiação balança e solta faísca BRASA), com um anel de poeira no chão onde vai cair.
- **Clipes:** andar 8, golpe 8, rugido 6, cair 10. São 4 direções reais + espelho = 8 aparentes, num total de ~128 quadros. Bake em **Web Worker com OffscreenCanvas** e cache em IndexedDB pelo hash da receita (§5).
- **Morte:** ele ajoelha, as rachaduras apagam uma a uma e o corpo vira um **marco permanente** no mapa daquela zona (estátua de vidro). Isso reforça a memória do mundo.

**Outras criaturas**

| # | Item | P | Esf. | Nota |
|---|---|---|---|---|
| C1 | Irradiados com olhos e tumores CHERENKOV (hoje são amarelos, `humanos.png` linha 2) e pele N6–N7 em vez do verde-acinzentado que some na grama | P0 | P | `PELES_DOENTES` em `paletas.ts` |
| C2 | Cão e lobo com silhueta mais alta nas costas (lombo eriçado) e olhos SANGUE (já são) | P1 | P | `fauna.ts` |
| C3 | Escorpião e aranha em escala maior (ameaça média: 1,5× o atual) e carapaça com brilho especular de 1 px | P1 | P | já são as melhores silhuetas de `animais.png` |
| C4 | "Anomalia" por bioma (ex.: enxame de mariposas Cherenkov no Hospital) | P2 | M | — |

### 4.3 Ambientes por bioma

**Correções de base (todas as zonas)**

| # | Item | P | Esf. | Arquivos |
|---|---|---|---|---|
| E1 | **Fim do losango preto.** Além da borda da zona, desenhar uma "saia" de terreno de baixo detalhe com o mesmo `corChao` em 1/4 da resolução, mais névoa do bioma, mais **silhuetas de marcos distantes** (torre, chaminés, prédios) em paralaxe lenta. Fundo N1, nunca `#050506`. | P0 | M | `chao.ts`, `cena.ts`, reaproveita os marcos de `viagem.ts` |
| E2 | **Planos de valor no chão.** Macrovariação (manchas de 8–20 tiles) de cinza clara N6–N7 contra terra escura N3–N4. Grão −40%. Decalques em aglomerados (Poisson com clusters), deixando áreas de descanso. | P0 | M | `chao.ts` (`fbm`, `rampa`), `decalques.ts` |
| E3 | **Bordas de bioma orgânicas.** Transição por ruído com faixa de dithering de 2–3 px de arte, sem seguir o tile. | P0 | P | `chao.ts` `corChao` |
| E4 | **Sombras de contato** (AO): 1–2 px de N0 a 40% na base de todo prop e personagem, além da sombra do sol que já existe | P1 | P | `cena.ts` `sombra()` |
| E5 | **Prédios com altura e corte**: fachadas de 3–8 andares que ficam baixas ou transparentes quando o jogador está atrás (a lógica de parede baixa já existe, §13), com telhado, caixa d'água e janelas com brilho de vidro. | P1 | G | `props.ts`, `zona.ts` |

**Identidade por bioma (marco, paleta e "cena que vira print")**

| Bioma/local | Paleta | Marco e elementos assinatura | P |
|---|---|---|---|
| Base/Abrigo | N + BRASA quente constante | o **único lugar com luz quente fixa**: lâmpada de bunker, fogueira, horta; varal; rádio com luz FÓSFORO | P0 |
| Ermo Cinzento | N4–N8, trinitite | **crateras vitrificadas** com reflexo verde-garrafa de 1 px, postes tortos, **Parede das Sombras**, árvores carbonizadas com brasa | P0 |
| Floresta Morta | vegetação doente + N | troncos carbonizados, cogumelos radioativos CHERENKOV (só eles brilham), neblina que baixa contraste | P1 |
| Cidade Velha | concreto frio + pixo | **brutalismo paulista** genérico, sem marcas nem prédios reais reconhecíveis: blocos curvos tipo Copan, elevado tipo Minhocão, orelhões, bancas, empenas com **pixo** (tipografia gerada), calçada de pedra portuguesa P&B | P0 |
| Pântano Tóxico | água turva + BILE + espuma `#E8EDE4` | **rio com espuma tóxica** que se move devagar com o vento, garças mortas, vagalumes (já existem) | P1 |
| Refinaria 9 | N0–N3 + BRASA intensa | **poços em chamas** (Salgado), fumaça preta em pilares, chão de óleo que espelha o fogo (reflexo vertical de 1/2 resolução), calor tremendo (P2) | P1 |
| Hospital São Judas | azulejo hospitalar + fluorescente `#DDE8E0` piscando | sala de radioterapia (o pó azul), macas, cortinas; luz fria que pisca | P1 |
| Torre de Rádio | N + SANGUE no topo | **luz vermelha piscando visível de outras zonas** (pendência do §21) e cabos que cantam ao vento | P1 |
| Posto Militar 14 | oliva + N | **holofotes que varrem** (cone de luz com gameplay), sacos de areia, arame em diagonal | P1 |
| Posto Km 40 | ferrugem + neon BRASA quebrado | toldo de posto com letreiro genérico apagado e uma letra piscando | P2 |
| Abrigo 7 | concreto limpo + AURORA | o oposto do mundo: limpo, frio e iluminado | P1 |

### 4.4 Luz, clima e dia/noite

| # | Item | P | Esf. | Detalhe |
|---|---|---|---|---|
| L1 | **Grade por LUT** (16³ em tira 256×16) em shader de pós-processo, substituindo o MULTIPLY `this.grade`. LUTs geradas por script (`tools/luts.mjs`) a partir das regras do §2.5, por bioma × hora (6 chaves) × ato, com mistura em tempo real. | P0 | M | Proc. Verificar a API de filtros e shaders do Phaser 4.2.1 instalado antes de escrever um pipeline próprio. |
| L2 | **Névoa e luz na GPU com dithering fino.** O lightmap (96×96, 1 byte por tile) vira textura. O shader interpola e aplica Bayer **por pixel de arte** (não 2×2). Acaba com o tabuleiro e tira o laço por pixel da CPU (`cena.ts:294–303`). | P0 | M | Ganho de desempenho grande no Android |
| L3 | **Noite carvão legível**: grade noturna `[72,80,104]`, céu nunca abaixo de N1 no chão visto, olhos de hostis emissivos (já são), rim light (A2), "luz de presença" mínima de 2,5 tiles a 18% em volta do jogador. | P0 | P | `clima.ts` KEYS, `cena.ts` |
| L4 | **Lanterna como cone de verdade**: borda definida com penumbra de 3 px dithered, poeira e chuva visíveis dentro do feixe (partículas acesas só no cone). | P1 | M | É a imagem clássica do gênero |
| L5 | **Luz dinâmica com normal maps vindos do voxel** (estilo HD-2D). O `renderVox` já sabe a face (`face[f]`) de cada pixel: basta gravar um 2º canvas com a normal codificada. Fogueira, lanterna e raio passam a modelar volume no sprite. | P1 | G | Diferencial técnico de verdade. Medir o custo no aparelho; o substituto é o tingimento atual. |
| L6 | **Relâmpago com sombras longas** de todas as silhuetas por 1 quadro + 200 ms de queda | P1 | P | respeita G12 e `menosEfeitos` |
| L7 | **Coerência clima × HUD**: a legenda do clima só muda quando a transição visual passa de 50%. Nas capturas aparecem "Céu limpo" com chuva caindo (03) e "Ventania" durante a tempestade (08). | P0 | P | `clima.ts` `nome`, `Hud.tsx` |
| L8 | Sombra do sol com comprimento e direção mais dramáticos no entardecer (já existe `sombraSol`; aumentar `len` e alpha entre 17h e 19h) | P1 | P | É a "hora do print" |

### 4.5 VFX

| # | Item | P | Esf. |
|---|---|---|---|
| V1 | **Neve de radiação** sincronizada ao Geiger (§2.5) | P0 | P |
| V2 | **Pegadas na cinza** (decalque temporário que some em 2 min de jogo). Também mostram para onde inimigos e NPCs andaram. | P1 | P |
| V3 | Fogo em 3 tons (BRASA-sombra, BRASA, BRASA-brilho), com fagulhas e fumaça N2→N6 | P1 | P |
| V4 | Impacto: anel de poeira, cápsula de bala ejetada, faísca BRASA em metal, sangue que fica no chão (já existe) | P1 | P |
| V5 | Colosso: rachaduras pulsando, cinza caindo do corpo, cratera da pegada | P0 | M |
| V6 | Espuma tóxica e reflexos d'água (meia resolução) | P2 | M |
| V7 | Calor tremendo na Refinaria (distorção leve em shader, desligada por padrão no Leve) | P2 | P |
| V8 | **Gotas na "lente"** durante tempestade: 3–5 manchas de refração nas bordas, só no Ultra e Alta | P2 | P |

### 4.6 UI e HUD

| # | Item | P | Esf. | Detalhe |
|---|---|---|---|---|
| U1 | **Correção da ligadura "fi"**: `font-variant-ligatures: none; font-feature-settings: "liga" 0, "clig" 0;` no `body`. Confirmar nas capturas que "Configurações", "Refinaria" e "ficam" saem certos. | P0 | P | `app/globals.css` |
| U2 | **Tokens únicos**: `paletas.ts` → `app/tokens.css` gerado no build. Lint (`tools/qa-paleta.mjs`) que falha com hex fora da paleta em `globals.css`, `components/` e `game/`. | P0 | P | — |
| U3 | **HUD de 33% para ≤ 20% da altura.** Vitais viram uma tira compacta. O relógio e o clima entram numa única linha. Os 4 botões do topo passam a ter rótulo curto ou viram ícones inequívocos (mapa = mapa dobrado; o "bonequinho 21" vira mochila com o número). O OBJ entra no rádio (U4). | P0 | M | `components/Hud.tsx` |
| U4 | **Rádio diegético**: o objetivo e as transmissões aparecem num visor de rádio FÓSFORO com cantos em degrau e "chiado" de 1 px. Liga a UI à narrativa do sinal do Abrigo 7. | P1 | M | `Hud.tsx`, `globals.css` |
| U5 | **Geiger como objeto**: o indicador de radiação vira um medidor de agulha 1-bit com CHERENKOV, não uma barra | P1 | P | — |
| U6 | **Mapa de papel queimado**: papel N9 com bordas queimadas, rotas em lápis N3, marcos de `IconeLocal` em tinta, sem sobreposição de rótulos (layout por regras de colisão) | P1 | M | `Paineis.tsx`, `IconeLocal.tsx` |
| U7 | Mochila: fundo dos itens uniforme (hoje há células creme e escuras misturadas em `mochila.png`); raridade por moldura com rebites | P1 | P | `Mochila.tsx` |
| U8 | Parênteses da Pixelify (parecem chaves): trocar "(s)" por pluralização real no texto (Roteiro) e, nos números, usar VT323 | P0 | P | `Telas.tsx` e textos |

### 4.7 Menu e logo

| # | Item | P | Esf. | Proc./Mão |
|---|---|---|---|---|
| M1 | **Logotipo próprio** (não Silkscreen genérica): letras em pixel desenhadas à mão (dado em array ou SVG), com o "A" virando um respiro de bunker e a base das letras "se desfazendo em cinza" (partículas soltas animadas). Duas versões: 56 px de altura (menu) e 16 px (ícone e PWA). **Depende do nome final** (§7). | P0 | M | **Mão**. Recomendo encomendar a um pixel artist brasileiro, com contrato que ceda os direitos e registro em `CREDITS.md`. |
| M2 | **O menu é o abrigo**: diorama em tempo real, com o próprio motor, da base à noite: fogueira, protagonista sentado, rádio chiando, cinza caindo e o clima da seed do dia. O logo e um único CTA BRASA ficam por cima. O texto de jornada sai do 1º plano e vai para um painel "Jornada". | P1 | M | Proc. (reaproveita a cena) |
| M3 | Substituto barato do M2: devolver o personagem ao 1º plano do `ArteMenu` (no `menu-depois` ele está escondido atrás do logo, com opacidade), em 140×70 a ×4 inteiro e sem desfoque | P0 | P | Proc. |
| M4 | Menos texto no menu: ≤ 3 linhas acima da dobra. Hoje há 9. | P0 | P | — |

### 4.8 Tela de viagem

| # | Item | P | Esf. |
|---|---|---|---|
| T1 | **Tela cheia vertical**: céu em 60% da altura, horizonte, estrada e **primeiro plano em paralaxe rápida** (postes, placas, carcaças), 4 camadas. O painel de evento e as dicas viram o visor do rádio (U4) na parte de baixo. Hoje 55% da tela é preto vazio (18). | P0 | M |
| T2 | **Um jipe só**: a viagem usa o **mesmo modelo voxel** do jipe da base, renderizado de lado. Precisa de um parâmetro de pitch em `renderVox` (hoje é fixo em 30° via `PITCH`) ou de um render lateral dedicado. Mesma paleta e mesma silhueta. | P0 | M |
| T3 | **Mesma densidade de pixel** do jogo (1 px de arte = mesmo tamanho em CSS). Hoje a viagem é ~2× mais grossa. | P1 | P |
| T4 | Eventos no horizonte: o Colosso cruzando, uma coluna de fumaça vermelha (suprimentos), relâmpago | P1 | P |
| T5 | **Bake escondido**: a viagem é a "cortina de carga" e pré-renderiza os sprites do destino no worker (§5) | P0 | P |

### 4.9 Telas de morte e vitória

| # | Item | P | Esf. |
|---|---|---|---|
| D1 | **Morte = "fotografia final"**: congela o último quadro do jogo, converte para P&B sépia (LUT), revela devagar e **grava a silhueta do jogador no chão como sombra nuclear**. Só depois vêm os números. | P0 | M |
| D2 | **Sombra gravada persistente**: na próxima run (e na mesma seed diária), a sombra do personagem morto fica naquele lugar do mundo como decalque. É memória honesta, sem manipulação: um lembrete visual de onde se morreu. | P1 | P |
| D3 | **Vitória = amanhecer AURORA** (imagem 3.5), com saturação plena e depois os créditos sobre uma viagem que passa por todos os marcos já visitados | P0 | M |
| D4 | **Card de compartilhar 1080×1920** composto pelo motor: foto final 270×480 de arte × 4 (inteiro), seed, dias e causa. Mesma tipografia do logo. | P0 | P |
| D5 | Morte e vitória com **layouts diferentes**. Hoje são iguais (`morte.png` × `vitoria.png`). | P0 | P |

### 4.10 Key art e materiais de imprensa

| # | Item | P | Esf. | Detalhe |
|---|---|---|---|---|
| K1 | **Modo Foto**: pausa, esconde a HUD, zoom inteiro 1–4×, escolha de LUT, hora e clima (só no modo foto), enquadramento 9:16, 16:9 e 1:1, exportação com upscale inteiro (270×480 arte → 1080×1920; 960×540 → 3840×2160). Também serve para jogadores, e o print vira marketing orgânico. | P0 | M | `cena.ts` + painel novo |
| K2 | **`tools/keyart.mjs`**: script puppeteer que monta as 5 imagens-assinatura com seed e câmera fixas, para serem reprodutíveis | P1 | M | segue o padrão `qa-*.mjs` |
| K3 | **Paintover humano opcional** para 1–2 key arts de capa (pôster, loja). Precisa estar escrito em `CREDITS.md` que é arte promocional, para não violar a regra de "screenshot = jogo". | P2 | — | orçamento em Produção |
| K4 | Press kit: logo (SVG + PNG 512/1024, claro e escuro), 12 screenshots (8 em 9:16, 4 em 16:9) sem HUD + 4 com HUD, 5 GIFs de 6 s (≤ 8 MB), ficha técnica, "como o motor faz arte" (1 página com o diagrama voxel → raio → pixel, já que o júri técnico valoriza isso), créditos e licenças | P0 | M | entrega até ago/2027 |
| K5 | Trailers: anúncio de 60 s (vertical + horizontal), gameplay de 90 s, prêmios de 30 s. Todos capturados no jogo; edição com Áudio. | P0 | G | — |
| K6 | Ícone PWA novo (logo 16 px + lenço BRASA), mais o splash screen | P1 | P | `tools/icones.mjs` |

### 4.11 Ordem sugerida (marcos)

| Marco | Datas | Arte entregue |
|---|---|---|
| **M0 Bíblia e fundamentos** | nov–dez/2026 | este plano aprovado; U1, U2, U8, L7, A2, L3, E1, E3, C1, M3, M4, D5; protótipo de L1 e L2; **primeira medição no Motorola** |
| **M1 Fatia vertical** | jan–fev/2027 | Base + Ermo no padrão final: A1, E2, Colosso v2, V1, V5, T1, T2, T5, K1, D1, D4; imagens 3.1, 3.2 e 3.4 tiradas do jogo. Material para festivais brasileiros e latinos (datas com Produção). |
| **M2 Conteúdo** | mar–mai/2027 | todos os biomas no padrão; A3, A4, U3–U7, M1, M2, L4, L5 (se passar no orçamento), D3, imagem 3.3, acessibilidade completa (§5.2) |
| **M3 Polimento** | jun–ago/2027 | VFX P1 e P2, K2, K4, K5; **arte congelada em 31/ago** |
| **Lançamento 1.0** | set/2027 | as críticas precisam sair antes do corte de 20/nov |

---

## 5. Orçamento técnico (celular) e acessibilidade visual

### 5.1 Desempenho no Android médio (Motorola Edge 70 Fusion Plus)

Premissa a confirmar no aparelho: classe Snapdragon 7-series/Adreno 7xx, tela de ~6,7" com `devicePixelRatio` ≈ 2,6–3 e 120 Hz. Na 1ª sessão com o Uwlo, coletar `chrome://gpu`, `devicePixelRatio`, `innerWidth`/`innerHeight` e o fps de uma tela de diagnóstico (`?diag=1`, P0, esforço P).

| Item | Alvo |
|---|---|
| Quadros | **60 fps estável** no padrão; p5 ≥ 50 fps; piso de 30 fps no "Leve". O jogo não precisa de 120 Hz: limitar a 60 economiza bateria. |
| Tempo de quadro (16,6 ms) | lógica ≤ 4 ms · render ≤ 7 ms · fábrica de sprites ≤ 2 ms por quadro (`Fabrica.processar(ms)`) · sobra ≥ 3 ms |
| **Escala de arte padrão** | trocar o padrão de Ultra (≈1,0) para **≈1,4 CSS por px de arte** (`k = round(1,4·dpr)` px do aparelho; com DPR 2,75 → k = 4 → 1,45). O personagem passa de ~42 para **~61 px CSS (≈ 9,5 mm)**, e a resolução interna cai para ~285×630 px de arte, metade dos pixels a preencher. Ultra continua como opção. **Decidir com o Uwlo em A/B no aparelho**, já que no §16 ele achou o 2,0 "pixelado demais". |
| Resolução de render | resolução interna = CSS ÷ escala; névoa, luz e LUT no mesmo buffer (sem buffers separados `fz`/`cz` na CPU depois de L2) |
| Draw calls | ≤ 80 por quadro. Hoje cada quadro da fábrica vira uma textura própria (`registrar(k, canvas)`), o que quebra o batching. **Empacotar em atlas dinâmicos de 2048×2048** com um shelf packer (ex.: `potpack`, ISC). |
| Memória de textura | ≤ 160 MB (≈ 10 páginas de 2048² RGBA). Poda da fábrica por bytes, não só por contagem (`total > 2600`). |
| Bake de sprites | em **Web Worker + OffscreenCanvas** (o `renderVox` é cálculo puro e devolve `ImageBitmap`), com cache em IndexedDB por `hash(receita)+versão do renderer`. Na 2ª visita a carga é instantânea. Fallback: o caminho atual na thread principal. |
| Colosso | ≤ 128 quadros, bake ≤ 6 s no aparelho, escondido na viagem |
| Partículas | ≤ 400 vivas; vida no ar ≤ 14/s (já existe); neve de radiação ≤ 40/s |
| Shaders | 1 passe de pós (LUT + névoa + vinheta + neve). Normal maps (L5) só em Ultra e Alta, e só se custarem ≤ 2 ms. |
| Download inicial | ≤ 6 MB (hoje ~3,1 MiB; a arte é código). Fontes subset latin-ext. |
| Térmica e bateria | 20 min sem throttling (fps no minuto 20 ≥ 90% do minuto 1); ≤ 12% de bateria por hora |
| Níveis de qualidade | **Ultra** (1,0, normal maps, reflexos) · **Alta, padrão** (1,4, sem reflexos) · **Leve** (2,0, sem pós além da LUT, 30 fps) |

### 5.2 Acessibilidade visual

**Contraste mínimo (gate G2/G11)**
- Texto: ≥ 4,5:1, e o texto crítico da HUD (números) ≥ 7:1. Hoje `--osso2 #8A8573` sobre `--a1` dá 4,58 (no limite) e `--aviso #C9641E` sobre `--a1` dá 4,29 (reprova para texto). Texto sobre BRASA usa N0.
- Figura e fundo no mundo: jogador ≥ 1,8:1 contra o chão ao redor (anel de 12 px), hostis ≥ 2,0:1, à noite ≥ 1,5:1. **Hoje dá 1,05–1,22.**

**Daltonismo**
- Os pares que hoje confundem em deuteranopia/protanopia são vida (`#E0553F`) × fome (`#D99A2B`) e stamina (`#B9C76A`) × radiação (`#8FE36A`).
- Regra: **toda informação de cor tem um segundo canal**, seja ícone, posição ou padrão. Na barra, vida é contínua, fome é tracejada de 4 px, sede é pontilhada, stamina é segmentada e radiação tem o pulso da agulha.
- Modos **Protan / Deutan / Tritan** em `cfg.daltonismo` remapeiam os tokens de HUD e aplicam uma **LUT de compensação no mundo**: hostil puxa para magenta em deutan; Cherenkov e Brasa ficam separados também por luminância.
- Teste por simulação (matrizes de Machado 2009, código próprio) nas capturas do smoke.

**Alto contraste** (`cfg.altoContraste`, fecha a pendência do §23)
- chão a −30% de luminância e −50% de saturação;
- contorno de 1 px em todos os personagens: jogador N9, hostil SANGUE-brilho, NPC AURORA;
- itens soltos com glint permanente;
- névoa e partículas pela metade.

**Legibilidade**
- corpo mínimo de 14 px CSS na HUD de jogo (hoje 12), números VT323 ≥ 18 px;
- Interface XG (1,4) continua;
- alvos de toque de 44–54 px (já está no §18).

**Fotossensibilidade**
- relâmpago, explosão e clarão: ≤ 3 flashes por segundo e nunca com mais de 25% da tela em variação brusca de luminância (WCAG 2.3.1);
- `menosEfeitos` (já existe) também corta a neve de radiação, o tremor do Colosso e a vinheta pulsante.

---

## 6. Gates de qualidade verificáveis

Os automatizáveis entram como `tools/qa-visual.mjs` (puppeteer, padrão de `qa-arte.mjs`) e saem com código ≠ 0 se reprovarem. Os humanos são feitos pelo Uwlo no celular com uma prancha publicada por link.

| Gate | Como medir | Aprova se | Auto? |
|---|---|---|---|
| **G1 Silhueta** | renderizar cada arquétipo × 8 direções em preto chapado sobre `#7F7F7F`, em 1×. Medir a sobreposição (IoU) entre pares de classes; prancha cega para o Uwlo e 2 jogadores. | IoU entre classes diferentes ≤ 0,75; identificação cega ≥ 90% | parte |
| **G2 Figura e fundo** | por bioma × 6 horas × 3 climas: luminância média da máscara do sprite × anel de 12 px de chão em volta | jogador ≥ 1,8:1 (noite ≥ 1,5); hostil ≥ 2,0 | sim |
| **G3 Braço e 1 m** | celular a 40 cm e a 1 m, com brilho de 100% ao sol e 30% no escuro; 5 pessoas e 2 s por quadro: "onde está você / o inimigo / o objeto usável / o que está crítico?" | ≥ 4 de 5 acertos em cada pergunta | não |
| **G4 Olhos semicerrados** | desfoque gaussiano de 3 px na captura de 412 px | jogador e hostis continuam separáveis (G2 sobre a imagem borrada ≥ 1,4) | sim |
| **G5 Valor** | captura em cinza, posterizada em 4 níveis | 3 planos distintos (chão / figuras / luz), cada um ≥ 10% da área | sim |
| **G6 Orçamento de croma** | 50 quadros aleatórios do smoke, % de pixels com OKLCH C > 0,12 (usar `culori`, MIT) | ≤ 4%, fora dos momentos roteirizados | sim |
| **G7 Thumbnail** | key art reduzida a 160×90 e 90×160 | identificáveis o protagonista, a ameaça e o lugar (prancha cega) | não |
| **G8 Lado a lado** | prancha por bioma: 3 referências do §2.2 + 1 quadro do jogo; nota de 1–5 em paleta, valor, forma e luz | média ≥ 4 | não |
| **G9 Coesão** | lint de hex fora da paleta; hash da receita do jipe igual na base e na viagem; densidade de pixel igual em jogo, viagem e menu | 0 violações | sim |
| **G10 Desempenho** | 10 min na Cidade, à noite, com tempestade e 6 hostis, no Motorola, registrado pela tela `?diag=1` | p50 ≥ 58 fps, p5 ≥ 50, soluço de bake ≤ 8 ms, memória ≤ 350 MB, sem throttling em 20 min | parte |
| **G11 Daltonismo** | capturas simuladas protan, deutan e tritan | os 5 vitais distintos (ΔE OKLab ≥ 0,10 ou canal secundário); hostil × chão ≥ 1,8 em cada modo | sim |
| **G12 Flashes** | variação de luminância entre quadros no smoke de tempestade e combate | ≤ 3 flashes/s, área < 25% | sim |
| **G13 Print aleatório** | 20 instantes aleatórios de uma partida de 30 min, sem HUD | ≥ 12 "postáveis" (painel: Uwlo + 2) | não |
| **G14 Animação** | por clipe hostil: quadros de antecipação × duração | antecipação ≥ 300 ms (Colosso ≥ 700 ms); ciclos de andar ≥ 8 quadros | sim |

Regressão visual: `pixelmatch` (ISC) compara a prancha de cada arquétipo com a referência aprovada. Mudança acima de 2% dos pixels exige nova aprovação.

---

## 7. Dependências

**Game Design**
- Duração da telegrafia de cada ataque (A3, G14) e as fases e a arena do Colosso (tamanho mínimo de 14×14 tiles livres para o 3.2 funcionar).
- Regras de escuridão: quanto a noite pode esconder sem ficar injusto (L3).
- Mecânica da radiação que alimenta a cor (níveis de cpm → LUT e neve).
- Prioridade das informações da HUD (U3): o que pode ir para o rádio.
- Modo Foto (K1) e sombra gravada persistente (D2) como recursos de design.
- Escala padrão 1,4: muda o campo de visão (~9 tiles de largura); revisar o raio de spawn (anel 14–24, §19) e o cone.

**Roteiro**
- **Nome final do jogo**: bloqueia o logotipo M1 e o press kit.
- **Cenário São Paulo confirmado** e nomes genéricos de lugares (sem marcas nem prédios reais reconhecíveis).
- **Identidade do protagonista**: quem é, por que o lenço, quem perdeu. Bloqueia A1.
- Lore do Colosso (o que ele foi) e do Abrigo 7.
- Textos da Parede das Sombras e do Hospital, com tratamento respeitoso de Hiroshima e de Goiânia: sem vítimas reais nomeadas, tom de memorial e revisão de sensibilidade.
- Arco dos 4 atos com eventos de cor (§2.5), mais textos de morte e vitória (D1, D3) e pluralização sem "(s)" (U8).

**Áudio**
- Neve de radiação sincronizada aos cliques do Geiger, da mesma fonte de taxa (`audio.ts`).
- Passos do Colosso sincronizados com tremor e decalque; a sombra dele entra com uma frequência grave antes.
- Relâmpago e trovão com o atraso de `clima.aoRaio`.
- A música adaptativa (onda 3 do §23) muda de estado junto com a LUT do ato.
- Ambiência do diorama do menu (M2) e sons de UI por material (aço).
- Edição sonora dos trailers (K5).

**Produção**
- **Aparelho de teste**: Motorola do Uwlo (primário), um Android de entrada e um iPhone emprestado, mais a rotina de "prancha por link" para ele aprovar pelo celular.
- Orçamento opcional para artista humano (logo M1, paintover K3) e editor de trailer; contratos com cessão de direitos e registro em `CREDITS.md`.
- Calendário de festivais (gamescom latam, BIG Festival, Day of the Devs, Steam Next Fest), alinhado aos marcos M1–M3.
- Checagem de marca do nome.
- Política de licenças: `culori` (MIT), `potpack` (ISC) e `pixelmatch` (ISC) entram como dependências de ferramenta e são registradas em `CREDITS.md`; nada de Makefile de terceiros.

**Engenharia (dentro de Produção)**
- Worker de bake, atlas dinâmico e pipeline de shader (L1, L2, L5) são pré-requisito de quase todo P1. Precisam ser planejados no M0.

---

## 8. Riscos de arte e mitigação

| Risco | Mitigação |
|---|---|
| A escala 1,4 é rejeitada pelo Uwlo ("pixelado") | A/B no aparelho com 1,0 / 1,25 / 1,4 e prancha lado a lado; o rim light e o contraste (A1, A2) já ajudam mesmo em 1,0 |
| Normal maps (L5) não cabem no orçamento | já é P1 opcional; o fallback é o tingimento atual mais o rim light |
| Colosso v2 pesado demais para o bake | 4 direções + espelho, amostragem 2× na pele, worker + IndexedDB, bake na viagem |
| Temas reais (Hiroshima, Goiânia) parecerem exploração | revisão de sensibilidade com Roteiro, tom de memorial, sem gore nessas cenas, nota nos créditos |
| Paleta restrita deixar o jogo "monótono" | o arco de cor por ato e as imagens-assinatura são as válvulas, e o G13 mede se continua postável |
| Pixo ou brutalismo virarem caricatura | pixo gerado por regras de tipografia real (letras alongadas e verticais) e referências fotográficas no G8 |

---

*Capturas desta análise: `docs/plano-goty/arte-capturas/` (01–21) e `docs/capturas/`.*
