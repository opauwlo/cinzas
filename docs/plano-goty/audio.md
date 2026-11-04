# CINZAS — Plano de Áudio e Trilha (rumo ao TGA 2027)

Direção de Áudio e Composição · 4/nov/2026 · corte do TGA ≈ 20/nov/2027 (~54 semanas)

> Resumo em uma linha: **o design de som já é de jogo pago; a música ainda não existe como obra.** O plano cria um tema que dá para assobiar, uma paleta brasileira que ninguém usa em survival (a viola caipira e a rabeca do Movimento Armorial, rádio AM, sirene de defesa civil, incelência), um motor adaptativo que toca música **composta** (partitura + amostras + poucas peças gravadas, ~8 MB) e uma trilha lançada fora do jogo como marketing. Nada de IA generativa no áudio entregue.

---

## 1. Diagnóstico do áudio atual

### 1.1 Forças (manter e proteger)

| Força | Onde está | Por que é boa |
|---|---|---|
| Loudness normalizado por categoria | `game/dados/sons.ts` `NIVEL`, `loudnessDb`, `normalizar` | Janela de 200 ms + teto de pico −3 dBFS. Tiro > impacto > voz > coleta > ui > passo ficou hierárquico e **testado** (≥ 8 dB entre tiro e passo). É raro em indie. |
| Barramentos + ducking | `audio.ts` linhas 30–31, `duck()` linhas 72–75, `DUCK` em `sons.ts` | Ambiente e música abaixam 3–7 dB no tiro, na pancada e no alarme. O mix "abre espaço" sozinho. |
| Cadeia mestre com perfis | `audio.ts` linhas 25–28, `PERFIS` | HP → shelf → peaking → shelf → compressor → limitador (−3 dB, 20:1). Os perfis "Alto-falante do celular" e "Noturno" mostram que o celular foi pensado. |
| Reverb interno/externo por envio | `respostaIR`, `sendExt`/`sendInt`, `ambiente()` linha 105 | Dois IRs sintéticos de 0 KB. A troca dentro/fora é imediata e convincente. |
| Escurecimento por distância | `tocar()` linha 81 | Passa-baixa de 14 kHz até 1,4 kHz em 26 tiles. É psicoacústica correta: o ar absorve primeiro os agudos. |
| Anti-repetição | `buffers()` linha 68 (3 variações) + `playbackRate` 0,94–1,06 | Evita o efeito "metralhadora" nos passos e golpes. |
| Geiger como processo de Poisson | `geigerLoop()` linha 117, taxa em `cena.ts:417` | Intervalo `−ln(1−U)/taxa`: soa como um contador de verdade. Com 18 cpm de fundo, nunca fica 100% mudo. É a melhor ideia sonora do jogo. |
| Trovão atrasado após o raio | `trovao(atraso)` | Primeiro a luz, depois o som: física honesta que cria antecipação. |
| Ambiente em camadas reativo | `construirAmbiente`, `ambiente()`, `grilosLoop` | Vento (banda que sobe com a rajada), chuva (abafa dentro de casa), fogo por proximidade de luz, grilos à noite, pássaros de dia. |
| Passos por superfície | `sfx.passo`, 7 receitas `passo_*` | Terra, areia, concreto, madeira, metal, água e azulejo. A superfície vem do tile real (`cena.ts:367`). |
| Motor do jipe paramétrico | `motor.ligar/vel/parar` | Tom, filtro, tremor e ruído do pneu sobem com a velocidade, tudo sincronizado com a física da rota. |
| Acessibilidade nascente | `setAvisoVisual`, `avisar()`, `SonsVisuais` em `Hud.tsx` | Legenda com direção, Geiger e batimento visíveis. É a semente do pacote "Innovation in Accessibility". |
| Leveza | tudo procedural | 0 KB de áudio no build (`out/` = 3,7 MB). |

### 1.2 Fraquezas concretas

**Música (crítico: hoje não existe como obra)**
1. **O drone é inaudível no alto-falante do celular.** `construirAmbiente` linha 96 usa osciladores em **55 Hz (serra), 82,4 Hz e 110,6 Hz** passando por um passa-baixa de 180–700 Hz. O perfil `celular` corta abaixo de **140 Hz** e baixa 4 dB em 180 Hz, e o alto-falante de celular não reproduz quase nada abaixo de ~300 Hz. Ou seja, **no aparelho-alvo a música é praticamente silêncio**, sobrando só um resto de harmônicos da serra.
2. **As notas soltas são aleatórias, não frases.** `musicaLoop()` linha 115 sorteia um grau de `[0,3,5,7,10,12]` (pentatônica menor de Lá) a cada 3,5–10,5 s, com timbre triangular e decaimento de 2,4 s. Não há pulso, harmonia, frase, repetição nem memória. Nada disso pode ser gravado, cantado ou tocado por uma orquestra no TGA.
3. **O volume efetivo é minúsculo.** `bMus = mus × 0,55` (padrão 0,3 → 0,165) × ganho do drone 0,07–0,23 × mestre 0,6. A música fica uns 30 dB abaixo do tiro.
4. **Só há um parâmetro, o `perigo`.** `cena.ts:523` calcula `perigo = perseguidores/4`, que sobe o ganho e abre o filtro. Não há estados (abrigo, viagem, Colosso, morte, menu), atos, biomas, nem diferença entre dia e noite além de +0,04.
5. **Os stingers estão fora de tom.** `sfx.vitoria` toca **Dó maior** (523/659/784/1046 Hz). `sfx.nivel` toca **Lá maior** (440 × 0,4,7,12 = Lá–Dó♯–Mi–Lá). O drone está em Lá menor pentatônico. Três tonalidades sem relação: a vitória da campanha soa como um "level up" genérico de 2005.
6. **O menu não tem som.** `iniciarAudio()` só é chamado em `Jogo.tsx:27`, ao iniciar a partida. Como a primeira impressão é muda, o jogo perde o primeiro contato com o jurado.

**Ciclo de vida (risco no celular real)**
7. **Não há `suspend()` ao sair do app.** `Jogo.tsx:36` só salva e pausa no `visibilitychange`. O `AudioContext`, os osciladores contínuos (drone e ruídos em loop) e os laços de `setTimeout` continuam vivos: risco de som no bolso e de gasto de bateria. Também não há tratamento do estado `interrupted` (chamada telefônica no iOS) nem retomada no próximo toque.

**Design de som**
8. **Os timbres das vozes são de chiptune.** `zumbi`, `corredor`, `colosso`, `humano` e `cao` são ondas ZzFX com ruído e *slide*. Funcionam como sinal, mas reprovam no teste "isso é de um jogo de R$ 100?". A voz humana (NPC, protagonista, rádio) não existe: os diálogos e as mensagens do rádio são só toast + `sfx.sinal`.
9. **A espacialização é só pan horizontal na tela.** `ia.ts:121` calcula o pan como `(x_tela_criatura − x_tela_jogador)/120`. Não há oclusão: um grito atrás de duas paredes soa igual a um no campo aberto, embora `zona.opaco` já exista para a visão. O cone de visão também não é usado no áudio.
10. **O batimento tem ritmo fixo.** `batimentoLoop` bate a cada 900 ms independente do HP (só liga quando hp < 30), então perde a escalada.
11. **Os pássaros são genéricos.** `passaro` (ZzFX 2,4 kHz) e `grilo` não remetem a nenhum lugar. O Brasil tem uma paisagem sonora riquíssima e ela não aparece.
12. **O loudness não é medido em LUFS.** A normalização é uma energia de 200 ms **sem ponderação K** (BS.1770). Não existe alvo integrado de mistura nem medição da partida inteira.
13. **O alarme da invasão é um bipe ZzFX** (`alarme`, 4×). Poderia ser a sirene de defesa civil, um som que todo brasileiro reconhece.
14. **Não há opção mono.** Fone de um lado só e alto-falante único perdem o pan (as setas ◀▶ das legendas compensam só para quem as liga).
15. **O SW não faria cache de áudio.** O filtro de `tools/offline.mjs` aceita `html|js|css|woff2?|ttf|png|svg|webmanifest`. Qualquer `.opus`/`.webm`/`.m4a` futuro **ficaria fora do offline**.

**Veredito:** o design de som está em nível 7/10 e é um sistema sério. A música está em 1/10: um sinal de tensão, não uma trilha. É a maior lacuna artística, e a mais barata de fechar em relação ao impacto.

---

## 2. Identidade sonora

### 2.1 Tese

> **"O Brasil que sobrou toca no rádio, fora do tom."**
> CINZAS soa como um país que parou no meio de uma música. Instrumentos do interior (viola, rabeca, pífano, zabumba, coral de igreja) tocados por sobreviventes, com afinação gasta, captados como se viessem de longe, de um rádio AM ou de outro cômodo. Nada de orquestra épica de Hollywood. O silêncio e o vento são parte da partitura.

Três princípios:
1. **A quinta vazia.** O tema não tem terça definida (acordes de Ré5, só tônica e quinta). O mundo não é maior nem menor: é **cinza**. Durante o jogo a terça aparece **menor** (Fá) nos momentos de perda. A **terça maior (Fá♯) fica guardada e só soa inteira no final**, no Abrigo 7 (terça de Picardia narrativa). É uma regra verificável na partitura.
2. **Um instrumento, uma pessoa.** O tema é sempre tocado por **um** instrumento sozinho, porque o jogador está sozinho. A segunda voz em terças paralelas (o canto da **dupla caipira**) só entra no final: é o encontro com outras pessoas, contado pela música.
3. **O mundo levemente fora do tom.** Assumir o batimento que já existe no drone (110 Hz da serra contra 110,6 Hz do triângulo = 0,6 Hz) como assinatura: rabeca afinada em Lá = 436 Hz contra viola em 440 (−16 cents), com batimento lento e constante. É **sempre igual, não aleatório**, como um disco empenado.

### 2.2 Instrumentação

| Papel | Instrumento | Por quê | Onde aparece |
|---|---|---|---|
| Voz do jogador / tema | **Viola caipira** (10 cordas) em afinação própria, a **"Cinza"**: D2 A2 D3 E3 A3 D4. É o Cebolão em Ré com o par de Fá♯ baixado para Mi, sem terça. | As cordas soltas ressoam sozinhas (drone natural); é timbre de interior brasileiro e ninguém usou em survival. | Abrigo, tema, final |
| Solidão / ermo | **Rabeca** (violino rústico nordestino), em 436 Hz | Áspera, vocal, "desafinada com dignidade". É o ronroco do Santaolalla, versão brasileira. | Ermo, exploração, luto |
| Ar / floresta | **Pífano** (banda de pífanos de Caruaru) + respiração | Agudo, frágil, com sopro audível | Floresta, amanhecer |
| Tensão | **Berimbau** (cabaça abafada/aberta = "wah" natural) | Uma corda, um pulso: conversa com o Geiger | Pântano, furtivo |
| Combate | **Alfaias e zabumba** (baque de maracatu, abafados), caixa, **sucata percutida** (tambor de óleo, mola de carro, chapa) | Peso físico sem orquestra. A sucata vem do próprio mundo, à moda de Uakti e Hermeto. | Combate, Refinaria, gangues |
| Sagrado / Colosso / morte | **Coral de igreja** (8 vozes, comunitário) e **incelência** (canto fúnebre de velório do Cariri, voz feminina à capela) | O som do luto popular brasileiro | Colosso, morte, final |
| Calor humano | **Sanfona** (acordeão) com fole cansado | Anuncia o mascate (diegético) | Mascate, abrigo à noite |
| Mundo de antes | **Rádio AM**: estática, sintonia, jingles, um bolero e um forró "pré-guerra" com o tema disfarçado | Ironia e memória | Menu, cidade, torre |
| Alerta | **Sirene de defesa civil** (lamento ascendente e descendente) e **berrante** | A sirene é trauma coletivo recente (barragens); o berrante é o "chamado" do sertão | Invasão, sinal do Abrigo 7 |
| Cama sintética | Drone procedural atual, **refeito em Ré e com fundamental ausente** (§4, P0) | 0 KB, contínuo e reativo | Por baixo de tudo |

Âncoras brasileiras para o compositor: **Quinteto Armorial** (rabeca + viola + pífano, a paleta exata), **Elomar** (o sertão medieval e apocalíptico), **Almir Sater** e **Tavinho Moura** (viola), **Uakti** (instrumentos inventados), **Naná Vasconcelos** (berimbau e voz), **Hermeto Pascoal** (música de qualquer objeto), **Cátia de França**.

### 2.3 Referências de jogo (o que roubar de cada uma)

| Referência | O que aprender | O que **não** copiar |
|---|---|---|
| **Santaolalla, *The Last of Us*** | Um instrumento de cordas regional, tocado com imperfeição (ronroco), muito silêncio e um tema que só volta quando tem sentido | O ronroco em si: o nosso é a rabeca/viola |
| ***Darkwood*** (Artur Kordas) | A fronteira borrada entre ambiente e música; o drone que é *lugar* | O horror constante: CINZAS tem calor (abrigo, mascate) |
| ***S.T.A.L.K.E.R.*** (MooZe, FireLake) | Violão na fogueira **diegético** nos acampamentos; rádio e estática como linguagem; ambiente que conta história | O uso esparso de música no combate |
| ***Clair Obscur*** (Lorien Testard, Best Score 2025) | Tema com **voz** e identidade nacional (chanson); leitmotivs por personagem; um compositor indie achado no SoundCloud | A escala orquestral, fora do orçamento |
| ***Disco Elysium*** (British Sea Power) | Identidade de "banda" que vive fora do jogo; o álbum como produto | Música mais "indie-rock" que diegética |
| ***Hollow Knight*** (Christopher Larkin) | Leitmotiv por área, câmara pequena, cada bioma com timbre próprio e uma melodia que se transforma | — |
| *Journey* (Austin Wintory) | Um instrumento = o jogador; a música cresce com a jornada e acolhe outro jogador (útil para o P2P) | — |
| *Red Dead Redemption 2* | Entrada do vocal no momento de virada da viagem | Licenciamento caro |

### 2.4 O TEMA principal: "Cinza" (também "Toada do Abrigo")

Toada lenta em **3/4, ♩ = 66**, tônica **Ré**. Registro de canto (Ré4–Ré5), para ser **assobiável** e caber na faixa de 300 Hz–4 kHz do alto-falante do celular.

**Motivo M, "o chamado" (4 notas).** Lembra um berrante e o balanço de uma sirene.

| Nota | Ré4 | Lá4 | Sol♯4 | Lá4 |
|---|---|---|---|---|
| Duração (tempos) | 2 | 1 | ½ | 2½ |
| Intervalo | — | **+5ª justa** | **−2ª menor** | **+2ª menor** |

A quinta ascendente é o chamado à distância. O vizinho Sol♯–Lá é a "sirene", e o Sol♯ (4ª aumentada, cor lídia/nordestina) é a estranheza radioativa.

**Resposta R, "a queda" (5 notas).**

| Nota | Dó5 | Lá4 | Fá4 | Mi4 | Ré4 |
|---|---|---|---|---|---|
| Duração | 1 | 1 | 1 | 2 | 1 |
| Intervalo | +3ª m (de Lá) | −3ª m | **−3ª M** | −2ª m | −2ª M |

Dó natural (7ª menor, mixolídio caipira) e **Fá natural (terça menor = perda)**. M sobe com esperança e R cai em menor: o jogo inteiro em 6 compassos.

**Frase completa (8 compassos, ~22 s):** M | R | **M'** (M uma 4ª acima: Sol4–Ré5–Dó♯5–Ré5) | **R'** em meia cadência: Fá5–Ré5–Si♭4 | Lá4 (suspenso).
**Harmonia (pedal de Ré nas cordas soltas):** Ré5 | Ré5 | Si♭(add9)/Ré | Si♭/Ré | Sol5/Ré | Dó/Ré | Lá sus4 | Lá sus4. É a cadência eólia ♭VI–♭VII, nostálgica e "épica sem orquestra", sempre **sem terça** no I.
**Final do jogo:** a mesma frase, a última nota resolve em **Ré maior com Fá♯** (a primeira vez que essa terça soa no jogo), e a segunda voz entra em terças paralelas.

Leitmotivs secundários, todos derivados de M ou R para o jogo soar como uma obra:
- **Colosso:** M em **aumentação** (4× mais lento) nos graves do coral. O Sol♯–Lá vira a sirene real, e o trítono Ré–Sol♯ fica sustentado.
- **Gangues ("saqueadores"):** a célula Sol♯–Lá repetida como riff de rabeca em **7/8**, rápido e agressivo.
- **Mascate:** a sanfona toca M **em maior** (Ré–Lá–Si–Lá), curto e quente. É **diegético**: ouvir a sanfona de longe = o mascate chegou.
- **Rádio / Abrigo 7:** M em código Morse e em berrante. O sinal do Abrigo 7 **é** o tema.
- **Morte:** só R, na incelência à capela.

### 2.5 Variações por ato, bioma e emoção

**Por ato (a campanha de 4 atos de `dados/objetivos.ts`)**

| Ato | Tema | Instrumentação | Cor harmônica |
|---|---|---|---|
| 1 Sobreviver | Só **M**, fragmentado, nunca completo | Viola solo, cordas soltas | Quinta vazia |
| 2 Crescer | M + R (primeira frase completa) | Viola + rabeca em uníssono, com 16 cents de batimento | Terça menor em R |
| 3 Território | Frase completa + percussão | + alfaias, sucata, pífano | Eólio, ♭VI–♭VII |
| 4 A saída | Frase com coral; **modula um tom acima (Mi)** no rádio do Abrigo 7 | + coral, berrante | Prepara o Fá♯ |
| Final | Frase completa, **dupla em terças**, **terça maior** | Tudo, mais a dupla caipira | Ré maior (Picardia) |

**Por bioma** (`bioma.ambiente` já chega em `ambiente()`)

| Bioma | Material | Timbre e tratamento | Fauna real (substitui `passaro`/`grilo`) |
|---|---|---|---|
| Abrigo | Tema inteiro, lento | Viola perto, seca, com o fogo | Grilos, sapo-cururu, urutau ao longe |
| Ermo Cinzento | M sozinho, muito espaço | Rabeca distante, reverb longo e escuro | Quero-quero, seriema ao amanhecer, **silêncio perto das crateras** |
| Floresta Morta | M em pífano, eco | Sopro, galhos | Urutau à noite, araponga, vagalume (sem som) |
| Cidade Velha | Tema "pré-guerra" no **rádio AM** (bolero/forró) vindo de dentro dos prédios | *Slapback* de prédio (80–120 ms) | Pombos, cães distantes |
| Pântano Tóxico | M em **frígio** (Mi♭), berimbau, voz soprosa | Microtons, wah da cabaça | Sapos, insetos, borbulhas |
| Refinaria 9 / Posto Militar | Ostinato em 7/8, sucata | Metal ressoante, drone industrial | Nenhuma (só metal) |
| Torre de Rádio | O tema escondido no ruído, Morse, *number station* | Estática filtrada | Vento nos cabos |
| Hospital | Caixinha de música quebrada tocando R | Azulejo: reverb claro e longo | — |

**Regra ecológica honesta:** a radiação cala a fauna. A densidade de cantos cai com `radSuave`, e o silêncio de pássaros vira um aviso que se ouve, sem UI e sem mentira.

**Por emoção (transformações do mesmo motivo)**

| Emoção | Transformação |
|---|---|
| Medo | M em aumentação, cluster Sol♯–Lá–Si♭ sustentado, sem pulso |
| Perseguição | M em diminuição (colcheias), em ostinato, ♩ = 132 (2× 66, troca sem quebra) |
| Luto | Só R, metade do andamento, uma voz |
| Esperança | M em lídio (o Sol♯ resolve para cima), no registro agudo |
| Calor / lar | Tema inteiro com o fogo, "errado" de propósito (dedilhado humano) |
| Triunfo | Terça maior + segunda voz; **reservado ao final** |

---

## 3. Arquitetura da música adaptativa

### 3.1 Princípio: soar composta porque **é** composta

Não é gerativo aleatório. Todo material é **escrito** por um compositor em DAW e exportado como:
- **Partitura** (MIDI → JSON compacto): notas, dinâmica, articulação e *micro-timing* humano **copiado da gravação de referência**, não sorteado.
- **Segmentos** de 2, 4 ou 8 compassos com **pontos de saída em cada barra**.
- **Variações A/A′/A″** de cada segmento. O motor escolhe a ordem (com pesos e "não repetir o último") e decide quando trocar, mas **nunca inventa notas**.

É o modelo **iMUSE** (LucasArts, 1991) e dos *music switch containers* do Wwise: ressequenciamento horizontal (qual segmento vem a seguir) mais camadas verticais (quais stems estão ligados).

**A seed diária também escolhe a música:** a ordem das variações sai da seed do dia (`alea`). Todo mundo que joga hoje ouve "a música de hoje", e isso vira conversa e comparação, ligada à seed diária que já existe.

### 3.2 Três técnicas, cada uma onde rende mais

| Técnica | Usar para | Tamanho | Por quê |
|---|---|---|---|
| **Síntese procedural** (Web Audio, existente) | Drone/cama, vento, rádio (estática, sintonia, filtro de AM), sirene, Geiger, motor; **viola em modo leve por Karplus-Strong** (cordas duplas desafinadas em oitava) num `AudioWorklet` | 0 KB | Contínuo, reativo e sem repetição. KS é domínio público. |
| **Partitura + multiamostras** (estilo tracker/MOD) | Toda a música de exploração, tensão e combate: viola, rabeca, pífano, berimbau, percussão, coral "ah/uh", sanfona | ~2,6 MB | Horas de música composta em poucos MB; troca de compasso exata; tom e andamento fixos |
| **Stems gravados** (performance humana inteira) | O que a amostra não faz bem: **voz** (incelência, dupla caipira, coral com texto), o Tema do Abrigo tocado inteiro, o final | ~5,5 MB | A emoção de uma pessoa tocando de verdade, que é o que passa no teste dos R$ 100 |

### 3.3 Estados e camadas

**Sinal contínuo `I` (intensidade 0..1)**, calculado na cena a partir do que já existe: `perigo` (`cena.ts:523`), HP, `radSuave`, Colosso ativo, invasão (`c.raid`), furtivo (`ponte.entrada.furtivo`).

**Camadas (verticais, dentro de cada estado)**

| Camada | Conteúdo | Liga quando |
|---|---|---|
| L0 Cama | Drone procedural em Ré, a "cor" do bioma | Sempre (exceto no silêncio deliberado) |
| L1 Pulso | Berimbau ou baixo da viola em semínimas | I > 0,25 |
| L2 Melodia | Fragmentos do tema (M, R) | Estados calmos, com cota de tempo (abaixo) |
| L3 Percussão | Alfaias, zabumba, sucata | I > 0,6 (combate) |
| L4 Sagrado | Coral | Colosso, morte, final |

**Estados (horizontais)**

| Estado | Entra quando | Material | Saída |
|---|---|---|---|
| **Menu** | Primeiro toque no menu | Rádio AM sintonizando até achar o tema na viola "de longe" | Crossfade de 2 s para Abrigo/Exploração |
| **Abrigo** | `zonaId === 'base'` | Tema inteiro, viola perto, fogo. À noite, sanfona e menos notas | Ao sair, a viola para no fim da frase |
| **Exploração** | Fora do abrigo, I < 0,25 | L0 + L2 com **cota**: melodia ≤ 35% do tempo, blocos de 20–40 s, 45–120 s de silêncio musical entre blocos | Tensão |
| **Tensão** | I ≥ 0,25 por 1,5 s, ou "foi notado" | L0 + L1, melodia some, filtro fecha | Combate ou alívio |
| **Furtivo** | Modo furtivo ligado | L0 com passa-baixa de 900 Hz, só pulso de berimbau, −6 dB | Volta ao estado anterior |
| **Combate** | I ≥ 0,6 por 1 s (≥ 2 perseguindo perto, ou dano recebido) | L1 + L3 + riff de M em diminuição, ♩ = 132 | **Histerese:** sai só depois de 8 s com I < 0,3, terminando a frase |
| **Colosso** | Colosso a < 20 tiles | Leitmotiv do Colosso (coral + sirene + alfaias), em fases por HP do Colosso (100–60 / 60–25 / < 25) | Abate: stinger + **4 s de silêncio total** |
| **Viagem** | `store.viagem` | Toada de estrada na viola (♩ = 100), motor **afinado em Ré** (marcha lenta em 73,4 Hz) | Chegada: o tema do bioma de destino |
| **Evento de estrada** | Fase `evento` | O pulso para no compasso e sobra o drone | Retomando |
| **Leitura de bilhete / diálogo** | Painel `nota`/`dialogo` | Música −9 dB, sem melodia | — |
| **Sono** | Dormir | Fragmento de R em caixinha de música, fade lento | Amanhecer: M em pífano |
| **Morte** | `executarMorte`/`desmaiar` | **1,5 s de silêncio absoluto** (até o ambiente), depois a incelência (só R, ~40 s) | Tela de morte |
| **Vitória** | `executarVitoria` | Final gravado (~3 min 30 s), dupla em terças, Ré maior | Créditos |
| **Modo Estudo** | `?estudo=1` | Na loja falsa, jingles "de cassino" (documentados como manipulação, "mostrado × verdade") | Na Revelação, o tema limpo, para marcar o contraste |

### 3.4 Transições

- **Relógio musical próprio:** agendador com *lookahead* (padrão "A Tale of Two Clocks": `setTimeout` de 25 ms que agenda eventos 100 ms à frente em `ctx.currentTime`). Toda troca de estado acontece **na próxima barra** (no máximo ~2,7 s a 66 bpm) ou **no próximo tempo**, para urgência (combate).
- **Pontes compostas:** cada par de estados tem um stinger de 1–2 compassos (exploração → combate: alfaia + rabeca arrastada; combate → alívio: R em viola). Uma transição nunca é crossfade cru, salvo menu e viagem.
- **Stingers de SFX quantizados e no tom:** `nivel`, `conquista`, `raro`, `vitoria` e `sinal` passam a usar notas de M (Ré–Lá–Sol♯–Lá) em harmônicos de viola, atrasados até o próximo semitempo **se** estiverem a ≤ 120 ms dele. Assim nunca ficam fora do tom nem do pulso. Sons de jogabilidade (tiro, golpe, passo) **nunca** são quantizados, por causa da latência.
- **Histerese e cota anti-fadiga:** o mesmo segmento não se repete dentro de 5 min, e a frase completa do tema toca **no máximo 3 vezes por hora**.
- **Silêncio como estado:** depois do combate vêm de 6 a 12 s só com o ambiente ("respiro") antes de qualquer melodia.

### 3.5 Motor: opções avaliadas

| Opção | Licença | Peso | Veredito |
|---|---|---|---|
| **Agendador próprio + `AudioBufferSourceNode`** (~250 linhas, dentro dos barramentos atuais) | Próprio | ~6 KB | **Recomendado.** Usa o `ctx` e o `bMus` existentes, sem duplicar contexto, e é testável em Node como `sons.ts` |
| **Tone.js 15.x** | MIT | ~90 KB gz | Bom plano B: Transport e Sampler prontos, `Tone.setContext` aceita o nosso `ctx`. Só vale se o agendador próprio passar de 2 semanas. Se entrar, é um *chunk* preguiçoso e vai para o `CREDITS.md`. |
| Strudel / TidalCycles | **AGPL-3.0** / GPL-3.0 | — | **Não usar.** O AGPL obriga a abrir o código do jogo inteiro. Também é ferramenta de *live coding*, não de partitura fixa. |
| SoundFont GM (FluidR3_GM, MIT) via SpessaSynth (Apache-2.0) | Permissiva | 5–140 MB | **Não.** Timbres GM genéricos reprovam no teste dos R$ 100, e não há viola caipira nem rabeca |
| js-synthesizer (FluidSynth WASM) | LGPL-2.1 | ~1,5 MB | Não: licença mais chata e peso alto |
| Faust → WASM `AudioWorklet` | Compilador GPL, **código gerado livre** | ~30 KB | P2: modelos físicos (rabeca e viola) para o modo leve e a viola fabricável |
| Howler.js | MIT | 7 KB gz | Desnecessário: já temos barramentos |
| VSCO 2 Community Edition (amostras orquestrais) | **CC0** | escolher | Útil para coral/cordas de reforço, se faltar orçamento de gravação |
| Freesound | Filtrar **só CC0 / CC BY** | — | Campo (cigarras, chuva tropical). **xeno-canto: a maioria é CC BY-NC-SA, não serve para jogo vendido.** Wikimedia Commons: conferir caso a caso |

Ferramentas (não geram conteúdo, apenas processam o que gravamos): **Demucs** (MIT) para separar stems de ensaios, **RNNoise** (BSD) para tirar ruído de gravação caseira, **ffmpeg/opusenc** para codificar e medir (`ebur128`).

### 3.6 Orçamento de tamanho, memória e streaming

**Formatos:** Opus (`.webm`/`.ogg`), nativo no Chrome Android, com AAC `.m4a` como *fallback* só se o iOS for alvo. Amostras em **mono, 64 kbps** (~8 KB/s); peças em **estéreo, 96 kbps** (~0,72 MB/min); vozes de rádio em **mono, 32 kbps**.

| Bloco | Conteúdo | Duração | MB |
|---|---|---|---|
| Multiamostras | Viola (cordas soltas, 24 notas × 2 dinâmicas, harmônicos, 6 rasgueados), rabeca (24 notas legato/curta), pífano 12, berimbau 8, percussão e sucata 40 *one-shots*, coral "ah/uh" 12, sanfona 12 | ~5 min somados | **~2,6** |
| Partituras | JSON de todos os segmentos | — | ~0,05 |
| Tema do Abrigo (gravado) | Viola + rabeca, 2 min 30 s em loop | 2:30 | 1,8 |
| Incelência (morte) | Voz à capela | 0:40 | 0,5 |
| Menu / rádio | Tema "de longe" + jingles pré-guerra | 1:00 | 0,7 |
| Vozes do rádio e barks | ~60 falas curtas | ~4 min | ~0,9 |
| **Núcleo offline (precache)** | | | **≈ 6,5** |
| Final (Abrigo 7) | Dupla + coral + viola | 3:30 | 2,5 (**preguiçoso**) |
| Fitas K7 colecionáveis (álbum no jogo) | 6 faixas | ~15 min | ~10 (**opcional, sob demanda**) |

- **Total no 1º acesso:** 3,7 MB do jogo + 6,5 MB ≈ **10 MB**. O final é baixado em segundo plano a partir do ato 3, **só no Wi-Fi** e sem `navigator.connection.saveData`. As fitas K7 vêm por *streaming* com cache em tempo de execução no SW, ao serem achadas.
- **Opção "Áudio leve"** em Config.: só síntese (Karplus-Strong + drone) = **0 MB**. "Áudio padrão" = 2,6 MB de amostras sem peças gravadas.
- **Memória (Android médio):** `decodeAudioData` vira PCM float32, e 1 min estéreo a 48 kHz ocupa **~23 MB de RAM**. Por isso:
  - **Amostras curtas** (≤ 1,2 s com *loop* de sustentação) são decodificadas e carregadas **por bioma**. Teto de **24 MB de PCM** decodificado ao mesmo tempo.
  - **Peças longas** tocam por `HTMLAudioElement` + `MediaElementAudioSourceNode` ligado ao `bMus`, em *streaming* sem decodificar tudo. A latência alta não importa porque começam na barra.
- **Service Worker:** incluir `opus|webm|ogg|m4a|json` no filtro de `tools/offline.mjs` (hoje ficariam fora) e criar uma segunda lista "lazy" para o final e as fitas.

### 3.7 Onde encaixa no código (para o Desenvolvedor, sem mexer agora)

- `game/dados/musica.ts` (**puro**, testável em Node como `sons.ts`): estados, regras de entrada e saída com histerese, cota anti-fadiga, mapa de segmentos e escolha por seed.
- `game/musica.ts`: agendador, sampler, streams, ligado a `bMus` de `audio.ts`. `musicaLoop()` e o drone de `construirAmbiente()` saem e o drone novo vira L0.
- Ganchos: `cena.ts:523` (I, bioma, interior, furtivo, Colosso), `components/Viagem.tsx:27/34` (viagem e fase), `acoes.ts:237/248/253` (desmaio, morte, vitória), `diretor.ts:107/115` (aviso e invasão → sirene), `Telas.tsx` (Revelação), `Menu.tsx` (primeiro toque liga o áudio).

---

## 4. Melhorias de áudio design (P0/P1/P2 · esforço P/M/G)

### P0 (antes de qualquer coisa: corrige riscos e o celular)

| # | Melhoria | Esforço | Detalhe |
|---|---|---|---|
| 0.1 | **Ciclo de vida do `AudioContext`** | P | `suspend()` no `visibilitychange` oculto, `resume()` ao voltar; tratar `interrupted`/`suspended` com retomada no próximo `pointerdown`; parar os laços de `setTimeout` enquanto suspenso |
| 0.2 | **Drone audível no alto-falante** | P | Subir a cama para Ré3 (146,8 Hz) e Lá3, e usar a **fundamental ausente**: tocar 2f, 3f e 4f de Ré2 (147/220/294 Hz) para o cérebro "ouvir" o grave de 73 Hz que o alto-falante não reproduz. É psicoacústica honesta. |
| 0.3 | **Tudo no mesmo tom** | P | `sfx.vitoria`, `sfx.nivel` e `sfx.conquista` reescritos na célula M em Ré; `raro1`/`raro2` (Lá5/Mi6) já cabem. Motor do jipe com marcha lenta em Ré2 (73,4 Hz) e o `o2` na quinta. |
| 0.4 | **Áudio no menu** | P | `iniciarAudio()` no primeiro toque do menu, com rádio AM sintonizando (procedural, 0 KB, até o tema gravado chegar) |
| 0.5 | **Opção mono** | P | Soma L+R no fim da cadeia (`ChannelMerger`), ligada por padrão quando o perfil é "Alto-falante do celular" |
| 0.6 | **Batimento que escala** | P | Intervalo de 900 → 520 ms conforme o HP vai de 30 a 5; volume e háptico sobem juntos |
| 0.7 | **Medição LUFS de verdade** | P | Ponderação K (BS.1770, ~80 linhas puras) em `sons.ts`; teste de projeto que renderiza um minuto roteirizado em `OfflineAudioContext` e confere os alvos do §6 |
| 0.8 | **Estado musical mínimo** | M | Máquina de estados de §3.3 com o material sintético atual: menu, abrigo, exploração, tensão, combate, morte, vitória. Prova a arquitetura antes das gravações. |

### P1 (identidade e imersão)

| # | Melhoria | Esforço | Detalhe |
|---|---|---|---|
| 1.1 | **Motor de partitura + multiamostras** | G | §3; primeiro com as amostras da sessão de gravação 1 |
| 1.2 | **Oclusão** | M | Bresenham fonte → jogador sobre `zona.opaco`: cada parede −6 dB e passa-baixa em 1,2 kHz (porta fechada −4 dB; janela −2 dB); teto de 3 paredes. Recalcular a 10 Hz por fonte ativa, não por quadro. |
| 1.3 | **Atenção pelo cone de visão** | P | Fontes fora do cone ficam 2 dB mais baixas e um pouco mais escuras; atrás do jogador, *shelf* −3 dB acima de 4 kHz. Isso imita a forma da orelha e não precisa de HRTF. |
| 1.4 | **Rádio como personagem** | G | Ver 4.1 |
| 1.5 | **Voz do protagonista (sem falas)** | M | Respiração com stamina baixa, gemido de dano (3 intensidades), tosse com rad > 60, sono. **Máscara de gás:** respiração em primeiro plano e o mundo inteiro com passa-baixa de 2,5 kHz enquanto está colocada (`tocarMascara`). |
| 1.6 | **Barks de NPC em português real** | M | Mascate, acampado e viajante com 6–10 falas curtas cada, sotaques diferentes (mineiro, nordestino, gaúcho): "Ô de casa!", "Calma, calma, tô desarmado", "Volta daqui a três dias". Sempre com legenda. |
| 1.7 | **Vozes dos "Filhos do Cinza"** | M | Voz humana gravada (ator), *pitch-shift* para baixo + granular + filtro de máscara, no lugar do `zumbi`/`corredor` ZzFX. O Colosso fica com camadas: grave sintético atual + coral + rugido gravado. |
| 1.8 | **Fauna brasileira** | M | Quero-quero, seriema, urutau, sapo-cururu, cigarra, araponga (CC0/CC BY ou gravação própria). **Quero-quero sentinela:** grita quando um hostil passa perto dele (comportamento real), um aviso honesto. A radiação silencia a fauna. |
| 1.9 | **Sirene de defesa civil** | P | Substitui o `alarme` da invasão (procedural: senoide com *glide* de 400→1000 Hz em 3 s e ida e volta), afinada para o pico cair em Lá |
| 1.10 | **Silêncio como recurso** | P | Morte com 1,5 s de vácuo; zumbido (4 kHz, 1,2 s, opcional) depois de escopeta perto ou explosão; abate do Colosso com 4 s de silêncio total |
| 1.11 | **Reverb por lugar** | M | IR sintético por tema: hospital (azulejo, claro, 1,8 s), floresta (difuso, sem *slap*), cidade (*slapback* de 100 ms), refinaria (metálico, ressonante), torre (vento nos cabos) |
| 1.12 | **Legendas também para música e rádio** | P | "♪ música tensa", "♪ sanfona ao longe (mascate)", fala do rádio em texto. Quem não ouve recebe a mesma informação que a música dá. |

### 4.1 O rádio como elemento narrativo (P1, G)

- **O aparelho:** o rádio de campanha (`inv.radio`) ganha um **dial AM 530–1600 kHz** num painel e no HUD, com sintonia por arrasto, estática que se ouve entre as estações e o "pega/perde" com o relevo. Ao contrário de uma tela de missão, o rádio é algo que se usa com as mãos.
- **Estações fictícias:**
  1. **"Rádio Abrigo 7"**: o sinal da campanha, o tema em Morse e no berrante, e uma voz feminina gravada que lê boletins. O sinal clareia à medida que o ato 4 avança.
  2. **"A Hora da Cinza"**: um radialista que lê os **contratos** (hoje toast + `sfx.sinal` em `diretor.ts:95/107`), os avisos de airdrop e invasão e notícias do mundo. Tem humor seco e é a âncora humana do roteiro.
  3. **Estação de números**: lê coordenadas que **apontam para um airdrop real** (é jogabilidade, não enfeite).
  4. **"Música de antes"**: bolero, forró e jingle de 1980 com o tema disfarçado em maior. É a ironia do mundo antigo e o primeiro contato do jogador com a melodia.
- **Uma gravação serve duas vezes:** a voz é gravada limpa e passa em tempo real pela cadeia de rádio (passa-banda 300–3.400 Hz, *waveshaper* leve, estática com *gate* e *fading* de AM por um LFO lento). A mesma voz fica limpa quando o jogador encontra a locutora pessoalmente.
- **Sem nomes reais:** nada de "A Voz do Brasil" nem emissoras reais (a regra contra imitar organizações reais).
- **Toda fala tem legenda.**

### P2 (excelência e pacote de prêmios)

| # | Melhoria | Esforço | Detalhe |
|---|---|---|---|
| 2.1 | **Música transdiegética na fogueira** | M | O acampado toca o tema na viola (mesmas amostras, espacializado na fogueira). Ao se afastar, a viola passa da fogueira para a trilha. É o momento S.T.A.L.K.E.R. e Death Stranding. |
| 2.2 | **Viola fabricável** | G | Na bancada, uma "viola de lata" (sucata + fio). Tocar no abrigo (5 botões = cordas soltas da afinação Cinza) recupera humor e moral, conforme o Game Design. Em modo leve, o modelo é Karplus-Strong. |
| 2.3 | **Fitas K7 colecionáveis** | M | 6 faixas do álbum achadas no mundo, tocadas num toca-fitas no abrigo. Movem a exploração e levam o jogador ao álbum. |
| 2.4 | **HRTF no perfil "Fone"** | M | `PannerNode` HRTF só para as 4 fontes mais altas (custo de CPU) |
| 2.5 | **Faixa de audiodescrição** | M | Introdução, viagem, Colosso e final narrados por `speechSynthesis` pt-BR (0 MB) ou por voz gravada. Liga em Config. → Acessibilidade. |
| 2.6 | **Háptico musical** | P | No combate, o pulso da alfaia vira vibração curta (opcional, pensando na bateria). Para pessoas surdas, a música passa pelo corpo. |
| 2.7 | **"Reduzir sons repentinos"** | P | Renomear e explicar o perfil "Noturno" como recurso de sensibilidade sensorial e TEPT: o limitador segura os transientes e não há zumbido |
| 2.8 | **Música e P2P** | M | Quando outro jogador entra na sala (Trystero), a segunda voz em terças toca **uma vez**, como prévia do final (eco de *Journey*) |
| 2.9 | **Modelos físicos em Faust** | G | Rabeca e viola em `AudioWorklet` para o modo leve, o mais perto possível das amostras |

---

## 5. Plano de produção da trilha

### 5.1 IA generativa: não no que vai ao jogo

- **Decisão: zero IA generativa (Suno, Udio, etc.) em música, voz ou SFX entregues.** Motivos:
  1. Em dez/2025 o **Indie Game Awards retirou de Clair Obscur o prêmio de GOTY** por uso de IA generativa no desenvolvimento. O júri e a imprensa punem.
  2. Nos EUA, conteúdo gerado por IA não tem proteção de direito autoral, o que mata o álbum como ativo.
  3. Os modelos têm risco jurídico de treino.
  4. Uma trilha "genérica de IA" reprova justamente no teste de identidade.
- **Escrever nos créditos e no material de imprensa: "Trilha e vozes 100% humanas".** É um diferencial de marketing em 2027.
- **O que pode:** a síntese procedural do nosso código (é nossa, determinística, não generativa), ferramentas de processamento (Demucs, RNNoise, medição de loudness), transcrição de ensaios, e protótipos **internos** de arquitetura com o material sintético atual, que nunca são entregues.

### 5.2 Gente

Câmbio assumido: US$ 1 ≈ R$ 5,50. São faixas de mercado brasileiro indie em 2026, a confirmar em cotação.

| Função | Escopo | Custo estimado |
|---|---|---|
| **Compositor(a)/diretor(a) musical** (brasileiro, de preferência violeiro ou rabequeiro, ou com escrita armorial) | Tema, ~45–60 min de material adaptativo em segmentos, 6 faixas de álbum, supervisão das sessões, partituras MIDI. Contrato de 8 meses. | R$ 60–110 mil (US$ 11–20 mil) + **participação na receita do álbum** |
| Músicos de sessão | Violeiro, rabequeiro, pifeiro, percussionista (maracatu), sanfoneiro: 2–3 sessões cada | R$ 12–20 mil (R$ 400–1.200 por sessão) |
| **Cantadeira de incelência** (tradição do Cariri) e **dupla caipira** | Morte e final; cachê justo, crédito nominal, consulta sobre o uso respeitoso da tradição | R$ 4–8 mil |
| Coral comunitário/igreja (8 vozes + regente) | 2 sessões: "ah/uh" + texto do final | R$ 4–6 mil |
| Estúdio | ~40 h (R$ 150–350/h); as amostras podem ser feitas em estúdio caseiro bom | R$ 6–14 mil |
| Editor de amostras / implementação | Cortar, afinar, normalizar e fazer *loops* das multiamostras | R$ 5–8 mil |
| Sound designer freelance | Voz dos Filhos do Cinza, Colosso, foley, fauna, reverbs | R$ 15–25 mil |
| Atores de voz | Radialista, locutora do Abrigo 7, protagonista (sem falas), 3 NPCs | R$ 8–15 mil |
| Mixagem e master do álbum | 12 faixas (R$ 300–800 cada) | R$ 4–10 mil |
| Arranjo orquestral "pacote TGA" | Partitura de 2 min do tema para orquestra (ver 5.4) | R$ 3–6 mil |
| **Total** | | **R$ 120–220 mil (US$ 22–40 mil)** |
| **Cenário enxuto** | Compositor multi-instrumentista que grava viola e rabeca em casa + coral comunitário + 1 ator para o rádio, master por faixa | **≈ R$ 45–60 mil** |

**Como contratar:**
- **Chamada aberta** para compositores brasileiros (no BIG Festival, em grupos de violeiros, com a ABRAGAMES) com o *brief* deste documento.
- **3 finalistas pagos** (R$ 800 cada) para musicar a mesma cena de 2 min: Ermo → combate → alívio.
- O dono escolhe pelo celular numa página de escuta A/B (artifact).
- Lembrete: Lorien Testard foi achado no SoundCloud.

**Contrato:**
- O compositor mantém a autoria (Lei 9.610/98).
- Licença exclusiva de sincronização para o jogo e seus materiais promocionais.
- Master do álbum em coprodução.
- Direito de arranjar para orquestra (TGA, concertos).
- **Cláusula de não reclamar no Content ID** os vídeos de jogadores (streamer-safe).

### 5.3 Cronograma (54 semanas até o corte)

| Quando | Entrega |
|---|---|
| **nov/2026** | P0 do §4 (ciclo de vida, drone audível, tom, mono, LUFS, estado mínimo). Este documento vira o *brief*. Chamada aberta. |
| **dez/2026** | Teste pago dos 3 finalistas; contratação; **o tema gravado num celular** (viola) passa no teste de assobio (§6) |
| **jan–fev/2027** | Sessão 1: multiamostras (viola, rabeca, percussão). Motor de partitura (P1.1). Rádio procedural. |
| **mar/2027** | **Single "Toada do Abrigo"** junto com o trailer de revelação |
| **mar–mai/2027** | Segmentos de todos os estados; sessão 2: coral, incelência, sanfona, vozes. Oclusão, barks, fauna, sirene. |
| **jun–jul/2027** | Demo no **BIG Festival** (São Paulo) e na Steam Next Fest com a trilha nova; **EP de 4 faixas**; inscrição no IGF (Excellence in Audio) |
| **ago/2027** | Sessão 3: final (dupla + coral); mixagem do jogo em aparelhos reais; master do álbum |
| **set/2027** | Lançamento do jogo + **álbum completo** (Bandcamp no dia, streaming com ISRC via distribuidora brasileira, ex.: ONErpm) |
| **out–nov/2027** | Campanha: *live session* do tema (violeiro no sertão, vídeo vertical), pacote orquestral enviado à produção do TGA, playlists, notas de "Best Score/Music" e "Best Audio Design" para a imprensa |

### 5.4 Lançamento da trilha como marketing

- **Bandcamp** (pague quanto quiser a partir de US$ 7; *stems* do tema grátis para remix) e **Spotify/Apple/Deezer/YouTube Music** pela distribuidora.
- **O álbum não entra no Content ID**, para nunca derrubar vídeo de streamer.
- **Vertical primeiro**, porque o dono e o público usam celular:
  - Reels e TikTok de 30 s: violeiro tocando M, "assobie o tema de CINZAS", desafio de cover na viola, os bastidores da afinação Cinza.
- **Playlist "Rádio Abrigo 7"** no Spotify: a trilha + músicas brasileiras que inspiraram (curadoria, sem prova social falsa).
- **Pacote TGA:** o medley da orquestra precisa de um gancho de 20–40 s arranjável. O tema foi escrito para isso (melodia forte, harmonia simples, 3/4). Entregar partitura orquestral (MuseScore/Sibelius), MIDI e uma gravação guia.
- **Vinil / K7 de edição limitada** (pós-lançamento, se houver tração): a fita K7 conversa com o colecionável do jogo.
- **Concerto pequeno** no lançamento (sesc, festival), com gravação para redes.

---

## 6. Gates de qualidade verificáveis

| Gate | Quando | Método | Passa se |
|---|---|---|---|
| **G1 Assobio** | dez/2026 | 10 pessoas ouvem a frase do tema 3×; 24 h depois pede-se que cantarolem | ≥ 5 de 10 reproduzem M (quinta ascendente + vizinho) reconhecível |
| **G2 Teste cego "R$ 100?"** | mar e jul/2027 | 20+ ouvintes (formulário Tally pelo celular), 8 clipes de 30 s em ordem aleatória: 3 do CINZAS e 5 de jogos pagos premiados (Hollow Knight, Darkwood, TLOU, Disco Elysium, Stalker). Nota de 1 a 7 para "parece de um jogo pago de R$ 100+" e "lembra algum lugar? qual?" | Média do CINZAS ≥ 5,5 **e** ≥ (média das referências − 0,5); ≥ 50% citam "Brasil/interior/sertão" sem dica |
| **G3 Loudness do jogo** | Contínuo (teste de projeto) | Render roteirizado de 3 min em `OfflineAudioContext` (exploração → combate → abrigo), medido com BS.1770 | Integrado **−18 LUFS ±2** (ASWG-R001 para portátil); *true peak* ≤ **−1 dBTP**; LRA ≤ 12 LU no Equilibrado e ≤ 6 LU no Noturno; música no estado Exploração 8–12 LU abaixo do tiro |
| **G4 Loudness do álbum** | ago/2027 | Medição de master | −14 LUFS integrado (±1), *true peak* ≤ −1 dBTP |
| **G5 Alto-falante do celular** | A cada marco | Motorola Edge do dono (e um Android de entrada) a 50% de volume, em sala quieta e com ruído de ônibus de ~70 dB tocando em outro aparelho | Tema reconhecível nos dois cenários; ≥ 70% da energia da melodia acima de 300 Hz (análise espectral do render); sem distorção nem *clipping*; Geiger audível sobre o combate; 9 de 10 frases do rádio entendidas |
| **G6 Latência toque → som** | P0 e por release | Log de `baseLatency + outputLatency` + vídeo em câmera lenta (240 fps no celular do dono) do toque no botão de ataque com o som captado | ≤ 50 ms (≤ 12 quadros a 240 fps) |
| **G7 CPU e memória** | Por release | Sessão de 10 min em Android médio (classe Moto G/Galaxy A), trace do Chrome | Sem *underrun* (estalo); ≤ 24 vozes simultâneas; ≤ 150 nós; PCM decodificado ≤ 24 MB; queda de FPS ≤ 2 ao ligar a música |
| **G8 Transições** | Contínuo | Teste de projeto em Node sobre `dados/musica.ts` + render offline | 100% das trocas em barra ou tempo; nenhum estalo (rampas ≥ 5 ms, detector de descontinuidade); histerese: nenhuma ida e volta combate↔tensão em < 8 s |
| **G9 Anti-fadiga** | Contínuo | Simulação de sessão de 60 min | Nenhum segmento repetido em 5 min; frase completa do tema ≤ 3×/h; ≥ 40% do tempo de exploração sem melodia |
| **G10 Coerência tonal** | Contínuo | Teste que lista as frequências de todos os stingers tonais | 100% das notas no campo de Ré (com Sol♯ e Fá/Fá♯ conforme a regra); **nenhum Fá♯ antes do final** |
| **G11 Acessibilidade sonora** | Por release | Auditoria: tabela de todo som relevante de jogo × legenda | 100% com legenda; modo mono sem perda de informação; rádio legendado; jogo terminável com o som desligado |
| **G12 Tamanho** | Por build (`offline.mjs`) | Contagem | Núcleo de áudio offline ≤ 7 MB; Áudio leve = 0 MB; jogo completo no 1º acesso ≤ 11 MB |
| **G13 Licenças** | Por release | Cada arquivo de áudio com a origem em `CREDITS.md` | 100% rastreado; nenhum NC; nenhum gerado por IA |
| **G14 Honestidade** | Por release | Revisão do §4 do HANDOFF | O som de recompensa é proporcional à raridade **real** do item (raro soa raro só se for raro); sem jingle de cassino fora do Modo Estudo |

---

## 7. Dependências

### Game Design
- **Sinal de intensidade e estados:** definir com precisão "notado", "combate", "alívio" (já existe a `tensao` de `spawn.ts`, e a música deve seguir a mesma curva) e as fases do Colosso por HP.
- **Mecânicas novas que a música pede:** dial do rádio, estação de números → airdrop, quero-quero sentinela, fitas K7 colecionáveis, viola fabricável (efeito no moral ou só cosmético?), mascate anunciado pela sanfona.
- **Momentos de silêncio:** onde o design permite 4–12 s sem música (depois do Colosso, da morte e do combate).
- **Modo Estudo:** quais jingles manipuladores entram na loja falsa e como a Revelação os desmonta ("mostrado × verdade").
- **P2P:** o evento de "outro jogador entrou", para a segunda voz.

### Arte
- O tom visual do rádio (dial, agulha, estática visual sincronizada com a do som).
- Animações em tempo musical: luz da torre piscando o Morse de M, bandeiras e fogo.
- Ícones das legendas de música (♪) em "Sons no visor".
- O trailer **montado sobre o tema** (corte nas barras), e capa do álbum e da fita K7 na linguagem visual do jogo.
- A fogueira do acampado com viola (*sprite* do NPC tocando).

### Roteiro
- **O dono do tema:** proposta de que seja uma toada/cantiga de ninar que a família do protagonista cantava (liga com o cartão-postal "Mãe, estou bem" de `notas.ts`), ouvida em fragmentos nos bilhetes e no rádio e inteira no final. Depende do personagem-âncora da onda 2.
- **Letra do final** em português (dupla caipira), texto da incelência (nova, escrita com a cantadeira, sem apropriar uma reza específica), roteiros do radialista e da locutora (~60 falas), barks dos NPCs por sotaque.
- **O nome definitivo do jogo** ("CINZAS" é provisório): vale para o título do álbum, do tema e da afinação.

### Produção
- Orçamento (R$ 45–220 mil), contratos (autoria, sincronização, Content ID, orquestra), cronograma do §5.3 casado com BIG Festival, IGF e lançamento em setembro (o Metacritic precisa existir antes de 20/nov).
- **Infra:** filtro de áudio no `tools/offline.mjs`, cache preguiçoso no `public/sw.js`, opção "Áudio leve", testes de projeto (G3, G8, G9, G10) em `npm run teste`, e o smoke para áudio ligado e estado musical.
- **Aparelhos reais:** pelo menos o celular do dono + 1 Android de entrada para G5–G7. Hoje nada foi validado em celular, e isso é risco nº 1.
- **Página de escuta** (artifact) para o dono aprovar demos, comparar A/B e votar no celular.
- `CREDITS.md`: seção "Áudio", com cada músico, gravação de campo e licença.

---

### Apêndice: decisão em uma tabela

| Pergunta | Resposta |
|---|---|
| Procedural, amostras ou gravado? | **Os três, cada um no seu lugar**: síntese para a cama, o rádio e o modo leve; partitura + multiamostras para a música adaptativa; gravação para voz, Tema do Abrigo e final |
| Biblioteca? | Agendador próprio sobre os barramentos atuais; Tone.js (MIT) como plano B; **nada AGPL** |
| Quanto pesa? | ~6,5 MB no núcleo offline + 2,5 MB do final, preguiçoso; 0 MB no modo leve |
| Primeiro passo? | P0 (1–2 semanas de Desenvolvedor) + chamada aberta para compositor em novembro |
| O que leva ao palco do TGA? | Um tema de 4 notas que dá para assobiar, uma paleta que só o CINZAS tem, e um final em que a terça maior e a segunda voz chegam juntas |
