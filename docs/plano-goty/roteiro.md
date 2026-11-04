# CINZAS: plano narrativo rumo ao TGA 2027

Roteirista-chefe / direção narrativa · 4/nov/2026
Corte do TGA 2027: ~20/nov/2027. Lançamento 1.0 recomendado para **setembro/2027**, para dar tempo de saírem as críticas antes da votação do júri.

> **Resumo em 5 linhas**
> 1. O texto de hoje é de manual de instruções com duas ou três frases boas no meio. Ninguém tem nome que importa, e o final é uma tela de estatística.
> 2. **A frase do jogo:** *"Depois da bomba, a voz de rádio em que São Paulo inteira confiava chama os sobreviventes para o Abrigo 7. Você leva sua irmã até lá e descobre por que ela mente."*
> 3. **O tema:** em quem você confia quando até quem te ama tem motivo para mentir? A regra de honestidade do projeto vira o próprio tema: **a interface nunca mente, os personagens sim.**
> 4. **O momento do ano:** a tela final "O QUE FOI DITO" mostra as mentiras do rádio que você ouviu e também **as que você mesmo contou para a sua irmã**. Depois o jogo pergunta: *"O que a Farol vai dizer amanhã às 6h40?"*, e a sua resposta passa a tocar no rádio de outros jogadores.
> 5. **Nome recomendado:** **FAROL**, que no Brasil é lanterna-guia, semáforo em SP, farol do jipe e "fazer farol" (blefar). Em espanhol, *farol* também é blefe.

---

## 1. Diagnóstico honesto

### 1.1 O que funciona (fica e vira semente)

| Trecho | Onde | Por que funciona |
|---|---|---|
| "Mãe, estou bem. Troquei o relógio por duas latas de atum. Volto quando a chuva passar. P.S.: não saia depois do escurecer." | `notas.ts`, Cartão-postal | Objeto concreto, uma pessoa, uma virada. O relógio trocado por comida conta que o tempo perdeu valor, sem explicar nada. É o padrão-ouro do jogo. |
| "Cogumelo brilhante só se estiver desesperado: o brilho não é enfeite." | `notas.ts`, Receita da vovó | É uma frase citável. Tem voz de avó e ensina uma regra do jogo sem quebrar a ficção. |
| "Você desliga o rádio. A voz fica na sua cabeça por horas." | `eventos.ts`, socorro | É a **melhor linha do jogo**, e já é o tema inteiro: uma voz no rádio em que não se pode confiar. |
| "No retrovisor, ele continua acenando." | `eventos.ts`, viajante | Uma imagem no lugar de um adjetivo. |
| "um dia a gente vai embora daqui" | `notas.ts`, Rabisco de criança | Emoção sem esforço. Passa a ser da **Lia** (§4). |
| "O mundo acabou em luz." / "um rádio que só chia" | `meta.ts`, `PASSOS_INTRO` | Abertura boa. O rádio já está plantado. |
| "TRANSMISSÃO 07" · "23°33′ S · ZONA DE EXCLUSÃO" | `Menu.tsx` | 23°33′ S é a latitude da Praça da Sé. O menu já enraíza o jogo em São Paulo sem dizer. É ouro. |
| Revelação: "Mostrado / Verdade / Por que funciona" | `Telas.tsx`, `estudo.ts` | É uma estrutura dramática pronta: um registro honesto do que te disseram. **Vira o formato do final do jogo.** |
| Dona Cida, Cabo Reis, Professora Lúcia, Filhos do Cinza, Milícia Velha, fichas, mascate | `npcs.ts`, `criaturas.ts` | São nomes brasileiros com textura. Falta história, mas o elenco está meio escalado. |

### 1.2 O que não funciona

1. **Os bilhetes são tutorial disfarçado.** Exemplos:
   - "Aviso de radiação": "Máscara de gás e antirrad salvam a vida… O contador Geiger chia mais perto do perigo."
   - "Bilhete de um sobrevivente": "Fabrique uma cama melhor quando puder."
   - "Esboço de torre": "Suba de nível antes."

   Ninguém no fim do mundo escreve "suba de nível". De 16 bilhetes, **7 são manual**.
2. **Os NPCs falam a língua da interface.** "Abra o Diário: o rádio passa tarefa com pagamento." "Os atalhos de baixo usam água e comida." Quem fala de "Diário" e de "atalhos de baixo" é o menu, não uma pessoa.
3. **Há um erro de continuidade no texto.** Em `npcs.ts` (dica `combustivel`), o NPC diz "Junte oito", mas o objetivo pede **10** (`objetivos.ts`). Além disso, "Contrato cumprido é combustível e munição no bolso." aparece repetido em duas chaves.
4. **A campanha não tem motivo.** São 24 passos, dos quais 4 são "Chegue ao nível N" e o resto são verbos de sistema ("Colete 6 de madeira", "Cace 2 animais"). Os nomes dos atos ("Crescer", "Território") descrevem a progressão de números, não uma história.
5. **Não há personagem com arco.** Não há protagonista, ninguém espera por você e ninguém muda. Cabo Reis aparece como autor de bilhete *e* como NPC sorteado, mas o jogo não sabe disso.
6. **O mistério é plantado e não é colhido.** "Dizem que existe um Abrigo 7 ao norte, mas ninguém que foi voltou para contar" é um ótimo gancho que nunca é pago.
7. **O final é funcional.** O texto é "Você seguiu o sinal. Do outro lado da porta, a vida recomeça.", seguido de abates e saques. A vitória usa **o mesmo layout da morte**. A regra do pico e do fim (peak-end) é desperdiçada justo no fim.
8. **A tela de morte é vaga.** "O ermo guarda a sua história." Que história?
9. **Há risco de "é jogo de zumbi".** `criaturas.ts` comenta "arquétipos: zumbis", os irradiados usam voz `zumbi` e clipes `ZUM`, e a IA "cambalear" é atraída por luz e barulho. Sem uma explicação no mundo, a imprensa vai chamar de zumbi (o plano de Game Design prevê o mesmo crítico de nota 6).
10. **O tom é instável.** "Chuva de ouro", "Chef do fim do mundo" e "Lenda" convivem com corpos em cruzes. O humor seco é bem-vindo, mas o humor de conquista de jogo mobile quebra o luto.
11. **A Revelação começa com "PLOT TWIST"**, em inglês e com cara de meme. A estrutura é forte, mas o título diminui o efeito.

### 1.3 O ativo escondido

O rádio já faz quatro coisas no código: passa contratos, avisa invasões, emite o sinal do Abrigo 7 e aparece no evento de socorro. **É a espinha do jogo e ainda não tem voz.** Este plano dá uma voz a ele.

---

## 2. A frase, o tema e o nome

### 2.1 Três loglines

| # | Logline | Força | Fraqueza |
|---|---|---|---|
| **A** | **Depois da bomba, a voz de rádio em que São Paulo inteira confiava chama os sobreviventes para o Abrigo 7. Você leva sua irmã até lá e descobre por que ela mente.** | Tem personagem (você), vínculo (irmã), mistério (por que mente) e lugar (SP). É resumível como "o jogo do rádio que mente". | É longa para cartaz, então pede uma tagline curta ao lado. |
| B | Um jogo de sobrevivência que nunca mente para você, num mundo em que só a mentira faz as pessoas andarem. | É ótima para a imprensa e para o *Games for Impact*. | Não tem personagem nem emoção. |
| C | No fim do mundo, a única coisa que ainda funciona é uma voz no rádio. A pergunta é se ainda tem alguém falando. | É misteriosa e serve para trailer. | Entrega o segredo do loop e não tem vínculo humano. |

**Recomendação:** a logline é a **A**. A tagline fica com uma síntese entre B e o mantra do plano de Game Design: **"O Geiger não mente. O rádio, sim."** A logline B vai para o press kit e para a inscrição em *Games for Impact*.

### 2.2 O tema

**Pergunta central:** *em quem você confia quando até quem te ama tem motivo para mentir?*

O jogo não responde, ele faz o jogador escolher. Há três camadas:

1. **Propaganda:** o Estado usa uma voz querida para controlar um fluxo de gente.
2. **A mentira piedosa:** a Íris mente para as pessoas andarem e viverem. A mentira salva e mata.
3. **Você:** em três cenas, o jogador escolhe se mente para a irmã. O jogo registra. **O jogador vira, em miniatura, aquilo que investiga.**

**A tese que o jogo defende, sem impor:** a verdade dita com cuidado vale mais do que a mentira dita com amor, mas ela não sai de graça. O jogador pode discordar no final, e o jogo respeita.

### 2.3 Como a bomba, a propaganda e o Modo Estudo viram uma coisa só

Hoje o Modo Estudo é um segredo para uma reportagem. A proposta é fazer dele **o espelho do jogo**:

| Camada | Quem manipula | Técnica | Quem revela |
|---|---|---|---|
| Mundo (campanha) | A Farol / Diretriz 7 | "Tem lugar" (escassez escondida), loop que finge estar ao vivo, autoridade de uma voz amada | Caderno de Escuta → tela final **O QUE FOI DITO** |
| Facções (rádio) | Filhos do Cinza, Saqueadores, Milícia Velha | Pertencimento ("aqui todo mundo cabe"), prazo falso ("até o amanhecer"), isca | Caderno de Escuta (verificação) |
| Você | Cris, com a Lia | Mentir para proteger | A mesma tela final, em "Você disse" |
| O próprio jogo | **Só no Modo Estudo** | Quase-vitória, prova social falsa, cronômetro, desconto fictício | Tela de Revelação (como hoje) |

**A regra de ouro, que passa a ser regra de roteiro:**
- **A interface nunca mente.** HUD, números, objetivos, prazos, Geiger e mapa dizem sempre a verdade.
- **Personagens podem mentir**, mas só dentro de falas marcadas como fala (balão de rádio, NPC, bilhete).
- Toda mentira de personagem precisa ter um **caminho de verificação** dentro do jogo e aparecer no registro final.
- Nenhuma mentira de personagem pode envolver dinheiro real, tempo real ou desempenho do jogador.

Isso mantém a regra honesta do `CLAUDE.md` **e** dá a ela sentido dramático. A linha final do registro só pode existir porque é verdade: *"Este jogo te deu 25 ordens. Nenhuma mentiu."*

**O Modo Estudo depois do final (P1, depende da aprovação do Uwlo, porque mexe na exceção):**
- **Não muda:** o acesso escondido para a reportagem (`?estudo=1` e 7 toques no título), a ausência de qualquer cobrança, o registro de tudo e o fechamento sempre pela Revelação.
- **Entra uma segunda porta:** depois dos créditos, aparece **"Frequência 00"**, com aviso prévio honesto: *"Neste modo o jogo usa de propósito os truques que a Farol usou com você. Nada é cobrado. No fim mostramos tudo."*
- **Por que o aviso não estraga o experimento:** ele prova a tese. Saber que está sendo enganado não protege ninguém, e o jogador sente o puxão mesmo assim.
- **Ajuste de texto na Revelação:** o título "PLOT TWIST" vira **"O QUE O JOGO DISSE"**, no mesmo visual da tela final da campanha. Os dois registros passam a se espelhar.

### 2.4 O nome

| Proposta | PT | EN | ES | Prós | Contras |
|---|---|---|---|---|---|
| **FAROL** ⭐ | lanterna-guia, semáforo em SP, farol do jipe, "fazer farol" = blefar | *Farol* (mantido; subtítulo "a beacon in the ash") | *farol* = lanterna **e blefe** ("ir de farol") | O nome é a rádio (Farol 107,7), a promessa e a mentira, e tem as mesmas camadas em PT e ES. Curto e fácil de buscar. | Em EN o trocadilho se perde (compensar no texto). Fazer busca de marca. |
| ÍRIS | a locutora; a íris do olho (o cone de visão); a mensageira dos deuses; o arco-íris depois da tempestade | *Iris* | *Iris* | É bonito e pessoal. | É um nome comum, difícil de achar em busca, e coloca a Íris no centro em vez do jogador. |
| QUEM FALA | o "quem fala?" do telefone e do rádio | *Who's Speaking* | *¿Quién habla?* | É o tema na mosca. | Literal demais, e fraco em EN. |
| HORA CERTA | a vinheta da rádio; o momento da verdade | *On the Dot* | *Hora exacta* | Funciona como bordão. | Parece nome de app. |
| SINAL 7 | o sinal e o Abrigo 7 | *Signal 7* | *Señal 7* | É claro. | Genérico, com cara de sequência. |

**Recomendação: FAROL.** CINZAS pode virar o nome do Ato I ou do mundo ("a Cinza").
- **Fazer antes de assumir o nome:** busca no INPI, USPTO, Steam, itch.io e Google Play (pode haver jogos pequenos homônimos) e verificar se o domínio está livre.
- **Se a marca estiver ocupada:** usar **FAROL 107,7**.

---

## 3. Bíblia da história

### 3.1 O que aconteceu

**O Clarão.**
- **Quando e onde:** quarta-feira, **14 de maio, 6h40 da manhã**. São Paulo inteira está parada no trânsito, ouvindo o rádio.
- **Qual guerra:** a **Troca**, uma guerra nuclear de quarenta minutos no hemisfério norte. O Brasil nem estava na briga.
- **O que caiu aqui:** uma única ogiva, desviada de alvo segundo o relatório oficial, caiu sobre o Centro de São Paulo. "**A guerra dos outros caiu aqui**" é o sentimento nacional. Não acusa nenhum partido e é profundamente brasileiro.

**A voz.**
- **Quem é:** Íris Matos, 34 anos, repórter de trânsito da **Rádio Farol FM 107,7**. Ela transmitia do alto da torre da rádio, ao norte da cidade.
- **O que disse:** às 6h39 ela disse **"Evitem o Centro."** Um segundo depois, o Centro deixou de existir.
- **O que ficou:** quem obedeceu viveu, e a cidade inteira passou a acreditar que **ela sabia**.
- **O que ela sabia de fato:** nada. Era um **caminhão tombado na 23 de Maio**. Essa é a revelação mais "comentável" do meio do jogo (Fita 3).

**O Cordão.**
- **A decisão:** o governo federal, em Brasília e intacto, sela uma Zona de Exclusão ao redor da Grande SP. O resto do país vive com racionamento e céu de cinza. **Lá fora não é paraíso, mas existe.**
- **A porta:** a passagem pela barreira fica no **Abrigo 7**, um dos 12 pontos da Defesa Civil, na estrada norte.
- **A catraca:** quem passa é medido. Com leitura acima de 60, volta para a Zona. O motivo é escassez lá fora, não maldade de desenho animado.

**A Diretriz 7.**
- **O que o Cordão fez com a voz:** levou o transmissor de emergência da Farol para o Abrigo 7 e deu um roteiro à Íris. A ordem é dizer "tem lugar" e não mencionar o limite, "para preservar o fluxo ordenado".
- **O que a Íris fez:** obedeceu, porque, se dissesse a verdade, ninguém faria a viagem e todo mundo morreria na Zona. Uma vez leu a Diretriz em voz alta, e cortaram o sinal por três dias.
- **Como ela acabou:** com dose alta e reprovada na própria catraca, gravou uma última fita, **"A verdade. Para quando eu tiver coragem."**, e saiu a pé para a Zona. Nunca mais foi vista.
- **O que sobrou no ar:** desde então a Farol toca uma **programação automática de 7 dias em loop**, com a hora certa inserida pela automação da rádio. **A voz que guia o jogador há quase dois anos é uma gravação.**

### 3.2 Cronologia

| Quando | O quê | Onde o jogador descobre |
|---|---|---|
| Antes | Íris é a voz das manhãs. Cris faz entregas de moto ouvindo a Farol. A mãe, Socorro, é técnica de enfermagem no Hospital São Judas. | Fita 1 (Cidade Velha, estúdio da Farol) |
| Dia 0 · 6h39 | "Evitem o Centro." Clarão. | Abertura |
| Dia 0 · 9h | A Íris lê o roteiro da Defesa Civil: "Equipes de saúde, permaneçam." Socorro permanece. | Caderno de plantão (Hospital) |
| Semanas 1–6 | A Farol orienta de verdade: água, rotas, abrigos. Nasce a fé na voz. | Bilhetes do Ermo |
| Mês 2 | O Cordão fecha. A Diretriz 7 transfere a Farol para o Abrigo 7. | Diretriz 7 (Posto Militar 14) |
| Mês 3 | O Cabo Reis, na catraca, devolve uma família. A menina tinha 61. | Anotações do Cabo Reis (2) |
| Mês 4 | O pai da menina, Valdemar, técnico de som da Farol, funda os **Filhos do Cinza** no Pântano e passa a interferir no sinal. | Folheto dos Filhos; Torre |
| Mês 9 | Íris lê a Diretriz no ar. Três dias de silêncio. | Fita 6 |
| Mês 11 | Íris grava a fita 7, sai a pé e começa o loop. | Fita 7 (Abrigo 7) |
| **Dia ~690 (hoje)** | Cris, 26, e Lia, 9, vivem num abrigo no meio do nada. O rádio pega às vezes. | Início do jogo |

### 3.3 Facções (cada uma tem uma técnica de persuasão, de acordo com o Caderno de Escuta do plano de Game Design)

| Facção | Quem são de verdade | O que querem | Como mentem no rádio | Dignidade (o que impede de ser vilão de papelão) |
|---|---|---|---|---|
| **Farol / Diretriz 7** | Uma gravação, uma política e um Estado longe | Um fluxo ordenado de gente na catraca | "Tem lugar. Tem médico." (escassez escondida, autoridade) | O "tem lugar" faz gente andar e sair da Zona. A mentira salva **alguns**. |
| **Filhos do Cinza** | Os **devolvidos pela catraca**, irradiados demais para passar, que fizeram do brilho uma fé | Pertencer; que ninguém mais seja medido | "A voz mente. O brilho não. Aqui todo mundo cabe." (pertencimento) | **Dizem a verdade sobre a Farol.** A resposta que oferecem é o desespero. Ecoam Canudos: "A cinza vai virar luz, e a luz vai virar cinza." |
| **Milícia Velha** | Policiais e militares do Cordão que ficaram do lado de dentro e cobram passagem no Posto Militar 14 | Fichas, armas, poder | "Últimas vagas na escolta. Só hoje." (prazo falso, autoridade) | Mostram um Estado que se desfaz em negócio. Não negociam porque têm medo. |
| **Saqueadores do Km 40** | Gente comum que aprendeu a armar iscas | Comida e combustível | Sinais de socorro falsos (o evento `socorro` atual) | Não têm discurso. São fome com fuzil. |
| **Rede PX da Dona Cida** | Mascates e caminhoneiros no rádio PX | Trocar e lucrar honestamente | **Não mentem.** Ficha é ficha. | São o grupo de controle: a voz honesta e pequena. **Os contratos do rádio passam a vir daqui, e não da Farol.** |

**Os irradiados não são zumbis.** O nome no mundo é **"os queimados"**.
- **O que são:** gente viva com síndrome aguda de radiação e lesão neurológica, que anda atrás de luz e de som como mariposa (por isso a IA de luz e ruído faz sentido).
- **A imagem mais forte:** muitos seguravam rádios. **São os romeiros que seguiram a voz pela zona quente.**
- **Pedido à Arte:** alguns queimados carregam um radinho de pilha, e o som dele toca a Farol baixinho quando estão perto.
- **O Colosso** é um rumor que o jogo não explica. Os Filhos dizem que são os "batizados na cratera", uma exposição ritual. É mito e nunca é confirmado.

### 3.4 O Abrigo 7 e o mistério central

**O mistério:** *quem fala na Farol e o que é o Abrigo 7?*

| Revelação | Ato | Pista | O jogador entende |
|---|---|---|---|
| R1 · **O loop** | fim do II | A Lia: "Hoje ela falou igual à semana passada. Igualzinho. Até a tosse." A segunda nota da vinheta sempre falha no mesmo lugar. | A Íris não está ao vivo. |
| R2 · **O roteiro** | III (Hospital) | Caderno de plantão da mãe: "permaneçam". | A voz serve a alguém, e isso custou a mãe. |
| R3 · **O caminhão** | III (Torre) | Fita 3: "Era um caminhão tombado na 23 de Maio." | O milagre fundador foi acaso. A fé foi fabricada pela necessidade. |
| R4 · **A Diretriz 7** | IV (Posto Militar 14) | Ordem de serviço: "Não informar o limite na locução." | A mentira é política de Estado, e existe uma catraca com um número (60). |
| R5 · **A cadeira vazia** | IV (Abrigo 7) | Fita 7, nunca tocada. | A voz se foi. Agora alguém precisa decidir o que ela diz. |
| R6 · **Quem conta** | Final | A narradora das telas de morte se identifica. | Esta história inteira é a Lia, adulta, contando no rádio. |

**O Abrigo 7 não é um lugar. É uma catraca e um microfone.**

---

## 4. Elenco

### 4.1 Protagonista: Cris

- **Quem é:** Cris Alves, 26 anos, ex-entregador ou entregadora de moto por aplicativo. O jogador escolhe gênero e aparência (o `gerarHumano` já existe). Para o texto, basta a variável `{o|a}`.
- **A ferida:** no dia do Clarão, Cris obedeceu à Íris, evitou o Centro e viveu. A mãe obedeceu à mesma voz e "permaneceu".
- **O defeito:** **seguir vozes.** "O app mandava, eu ia. A Íris mandava, eu evitava. Agora o rádio manda ir para o norte." Isso ressoa com o Brasil de hoje, o do trabalho por aplicativo, sem levantar bandeira partidária.
- **O arco:** obedecer → duvidar → mentir (para a Lia) → escolher que voz quer ser.
- **Agência sem tirar a identificação:**
  - Cris fala pouco: **frases de uma linha** ao descobrir lugares e **3 escolhas-chave** com a Lia.
  - Toda escolha tem três tons: **verdade, proteção** (mentir) e **silêncio**.
  - Nenhuma escolha é "a certa", e todas ficam registradas.
- **O objetivo do HUD continua dando ordens honestas.** Só o último objetivo não é ordem, é pergunta: **"O que você vai dizer?"**

Amostras de fala (pensamento de uma linha):
- No Ermo, primeiro queimado abatido: *"Esse ainda tinha crachá."*
- Na Cidade Velha, diante do letreiro da Farol: *"Eu passava aqui todo dia. Ela dizia pra eu não passar."*
- No Hospital: *"Ala B. A mãe dizia que a Ala B tinha a melhor máquina de café."*

### 4.2 Personagens com arco

**1. Íris Matos, a Voz (âncora emocional).**
- **Como aparece:** só como voz, em três formatos. A **Farol no ar** (calorosa, de rádio, bordões), as **Fitas 1–7** (fora do ar, cansada, humana) e **a cadeira vazia**.
- **O arco:** confiança → cooptação → culpa → coragem tardia.
- **Por que funciona:** é uma personagem que o jogador **ama antes de entender**, o mesmo truque da Maelle e do Gustave em Clair Obscur.
- **Amostras de fala:**
  - No ar: *"Seis e quarenta, hora certa na Farol. Bom dia, sobrevivente. Aqui é a Íris."*
  - No ar: *"Abrigo 7 de portas abertas. Tem água, tem médico. Tem lugar."*
  - Fita 2: *"Hoje uma senhora chegou na porta e me agradeceu. Disse que andou onze dias por minha causa. Ela deu 74. Eu sorri pra ela."*
  - Fita 7: *"Se alguém estiver ouvindo esta fita: eu sei que é tarde. Não tem lugar pra todo mundo. Nunca teve. Mas tem pra alguns. Vem se estiver limpo. E se não estiver… vem mesmo assim, que eu não sei mais o que é certo."*

**2. Lia, a irmã (9 anos, espera na base).**
- **Como aparece:** fica no abrigo. Desenha nas paredes, e os desenhos mudam por ato (decalque). Escuta a Farol às 6h40 e planta na horta. Uma planta chama "Íris".
- **O arco:** fé total → dúvida → descobre que Cris mentiu → escolhe a própria voz (é a narradora adulta).
- **Regras de sistema:** a Lia **nunca morre por sistema**. Nas invasões ela se esconde no porão e depois aparece com uma fala ("Eles levaram a lata grande."). A morte aleatória de uma criança seria barata e cruel, e não queremos isso.
- **Amostras de fala:**
  - Ato I: *"A Íris falou que amanhã faz sol. Ela nunca erra."*
  - Ato II: *"Hoje ela falou igual à semana passada. Igualzinho. Até a tosse."*
  - Ato III: *"A mãe ouvia a Íris também?"* (escolha-chave 2)
  - Ato IV, no jipe: *"Se não tiver lugar, eu fico com você. Pode falar que tem, que eu finjo que acredito."*

**3. Cabo Reis, o homem da catraca (acampado recorrente).**
- **Como aparece:** é um desertor do Cordão. Já existe como autor de bilhete e como NPC, e passa a ser **fixo**, com memória de conversa.
- **O arco:** obedecer ao número → culpa → no final, **arredonda**. Se a sua leitura der 61 a 65 e você tiver ganhado a confiança dele, ele diz "Sessenta. Passa." É um ato de misericórdia que é uma mentira, e **o registro final mostra isso**.
- **Amostras de fala:**
  - *"Eu sei o que tem no Abrigo 7. Eu era o cara da porta."*
  - *"A máquina mede. Eu só lia em voz alta. É o que eu dizia pra mim."*
  - No final: *"Sessenta. Passa. …Anda, antes que eu me arrependa de ser gente."*

**4. Irmão Lume (Valdemar), a voz que diz a verdade e vende desespero.**
- **Quem é:** ex-técnico de som da Farol, o homem que acendia a luz de NO AR todo dia (por isso "Lume"). É o pai da menina dos 61. Lidera os Filhos do Cinza e interfere no sinal a partir da Torre.
- **O arco:** luto → fé no brilho → na Torre, diante da Fita 3, pergunta se você vai contar a verdade. A luta com ele é opcional se você tiver 3 entradas verificadas no Caderno (P1).
- **Amostras de fala:**
  - Interferência: *"…pergunta pra ela quanto mede a porta. Pergunta! A voz mente. O brilho não."*
  - Para o Reis: *"Sessenta e um, cabo. Você lembra do número. Eu lembro do nome."*
  - Na Torre: *"Eu acendia a luz pra ela. Todo dia. Agora eu apago."*

**5. Dona Cida, a honestidade que cobra (mascate, rede PX).**
- **Como aparece:** é o grupo de controle moral, com troca justa e preço visível. Os contratos do rádio vêm dela, pelo PX.
- **O arco:** "não acredito em rádio, acredito em ficha" → confessa que vendia radinhos aos romeiros, "esperança a três fichas" → no epílogo repete de graça a mensagem final do jogador no PX.
- **Amostras de fala:**
  - *"Positivo e operante. Tenho bateria, tenho bandagem, não tenho paciência."*
  - *"A moça do rádio promete. Eu cobro. Quem cobra não precisa mentir."*
  - *"Vendi quarenta radinhos pra gente que ia pro norte. Três fichas cada. Esperança é o que mais sai."*

**6. Socorro Alves, a mãe (presente só em bilhetes).**
- **Como aparece:** técnica de enfermagem. Está no Hospital São Judas (armário, caderno de plantão) e em um bilhete solto no Ermo.
- **A função dela:** é o luto no centro do jogo (o "Clair Obscur" do CINZAS). A Lia não sabe o que aconteceu com ela, e Cris decide o que contar.
- **Amostra de fala:** *"Cris, se você achar isto, come alguma coisa antes de chorar. Chorar com fome dá dor de cabeça."*

**Coadjuvantes sem arco:**
- **Professora Lúcia:** acampada, ensina crianças a "perguntar quem disse". É a voz didática do Caderno, sem sermão.
- **Sargento Vidal:** opera a catraca do Abrigo 7.
- **Os romeiros do rádio:** gente que anda para o norte. É uma imagem brasileira, a das romarias a pé.

### 4.3 Escolhas-chave com a Lia (todas registradas)

| # | Quando | A pergunta da Lia | Verdade | Proteção | Silêncio |
|---|---|---|---|---|---|
| 1 | Fim do Ato I, 6h40 | "Ela falou 'tem médico'. Viu?" | "A gente vai ver." | "Viu." | (quieto) |
| 2 | Ato III, volta do Hospital | "A mãe ouvia a Íris também?" | "Ouvia. Ela ficou porque a Íris mandou." | "A mãe saiu antes. Foi pro norte." | (quieto) |
| 3 | Ato IV, no jipe | "Lá tem lugar pra nós dois?" | "Não sei." | "Tem." | (quieto) |

A Lia reage na hora e de novo no epílogo. Exemplo, para quem escolheu proteção na escolha 2: *"Você mentiu pra mim sobre a mãe. Eu sei por quê. Foi aí que eu entendi a Íris."*

---

## 5. Estrutura: os 4 atos, batida a batida

Os títulos passam a ser narrativos, mas **o requisito mecânico continua escrito embaixo** (honestidade de interface). Exemplo: "**Pronta para a estrada** · chegue ao nível 3".
- **Se o plano de Game Design tirar os portões de nível (D5):** a mesma batida usa o portão diegético que ele propõe.
- **Novo passo:** o plano soma um passo (o Posto Militar 14) e move o `radio` para o fim do Ato III. É preciso subir `OBJ_VER` e rodar o teste de XP/locais.

### Ato I · A voz (base, Ermo) · "Em quem você confia?"

| # | id atual | Novo título · requisito | Batida narrativa |
|---|---|---|---|
| 1 | madeira | **Lenha para o fogão** · 6 madeiras | A Lia está com frio. Primeira conversa. O rádio da base chia e pega só pedaços. |
| 2 | fabricar | **Um curativo** · fabricar 1 | A Lia ralou o joelho no quintal. "A mãe soprava antes." |
| 3 | comer | **Metade pra cada** · comer ou beber | A Lia: "Metade pra você, metade pra mim. A Íris diz que é assim." |
| 4 | jipe | **O Ermo está calmo hoje** · viajar ao Ermo | A Farol diz que o Ermo está calmo, **e está**. A primeira coisa que a voz diz é verdade, e é assim que a confiança nasce. |
| 5 | saque5 | **Volte com alguma coisa** · 5 contêineres | O bilhete do para-brisa (§6.1). Os romeiros existem. |
| 6 | abater3 | **Os queimados** · 3 abates | "Esse ainda tinha crachá." Um queimado segura um radinho. |
| 7 | noite | **Antes de escurecer** · 1 noite | A Lia: "Volta antes da noite?" Primeiro desenho dela na parede (o jipe e o sol). **6h40:** cena de rádio (§6.2), primeira interferência do Lume, **escolha-chave 1**. |

### Ato II · A estrada (Floresta, Posto Km 40, Cidade Velha) · "Quem está falando?"

| # | id | Novo título · requisito | Batida |
|---|---|---|---|
| 8 | nivel3 | **Pronta para a estrada** · nível 3 | O Cabo Reis aparece na Floresta, em volta de uma fogueira. "Pra onde vocês vão? …Ah. Pra lá." |
| 9 | melhoria | **Uma casca pra casa** · 1 melhoria | A Lia: "Agora a casa tem casca." Segundo desenho (o muro). |
| 10 | contrato | **Dona Cida no PX** · 1 contrato | Os contratos vêm da rede PX, honesta e pequena. "Ficha é ficha." |
| 11 | bichos | **Carne pra dois** · 2 animais | Silêncio da Floresta. A névoa. |
| 12 | cozinhar | **Fogo de chão** · cozinhar | O Reis conta, ao fogo, que "trabalhava numa porta". Não diz qual. |
| 13 | horta | **A horta da Lia** · plantar e colher | A Lia batiza a planta de "Íris". |
| 14 | machado | **Um machado** · fabricar | Pausa de ritmo, sem batida. |
| 15 | explorar3 | **O que a Íris não conta** · 3 locais | **Posto Km 40:** a Farol diz "tem água da Defesa Civil", mas o tanque está seco há meses e os Saqueadores estão lá (primeira entrada falsa no Caderno). **Cidade Velha:** o prédio da Farol e a **Fita 1**. |
| 16 | nivel5 | **A semana que se repete** · nível 5 | **R1, o loop.** A Lia: "Igualzinho. Até a tosse." **Fim do Ato II:** Cris liga o rádio às 6h40 e recita junto com a Íris, palavra por palavra. |

### Ato III · O ruído (Hospital, Pântano, Refinaria, Torre) · "O que a voz custou?"

| # | id | Novo título · requisito | Batida |
|---|---|---|---|
| 17 | gangue | **Quem corta o sinal** · 1 membro de gangue | Os Filhos do Cinza ficam mais fortes. A interferência do Lume vira programa diário. |
| 18 | contratos2 | **Esperança a três fichas** · 3 contratos | A Dona Cida confessa os radinhos que vendeu. |
| 19 | explorar6 | **São Judas** · 6 locais (Hospital obrigatório) | **R2.** O armário da mãe e o caderno de plantão (§6.1). **Escolha-chave 2** ao voltar. No **Pântano**, o folheto dos Filhos e os queimados com rádio ("os que seguiram"). |
| 20 | nivel7 | **A Refinaria** · nível 7 | O Colosso. Um Filho no chão murmura: "Batizado na cratera." É mito e não é confirmado. |
| 21 | *radio* (movido) | **A Torre** · achar o rádio de campanha | **R3.** O confronto com o Lume e a **Fita 3, o caminhão da 23 de Maio**. O rádio de campanha capta o sinal limpo. **Fim do Ato III:** o Lume pergunta: "Você vai contar?" |

### Ato IV · Seis e quarenta (Posto Militar 14, Abrigo 7) · "O que você vai dizer?"

| # | id | Novo título · requisito | Batida |
|---|---|---|---|
| 22 | combustivel | **Tanque cheio** · 10 de combustível | O texto do NPC é corrigido para **dez**. A Lia faz a mochila dela. |
| 23 | nivel8 | **Limpa pra passar** · nível 8 | O Reis avisa: **"Eles medem. Passou de 60, volta."** O limite é anunciado de forma honesta, e o jogador tem um ato inteiro para tratar a radiação (antirrad, cama nível 2). |
| 24 | **novo** militar | **Posto Militar 14** · visitar | **R4, a Diretriz 7** (§6.1). O Reis negocia ou luta com a Milícia, conforme a confiança. |
| 25 | abrigo7 | **Abrigo 7** · viajar com a Lia | A **viagem final de jipe tem duas pessoas no banco** (Arte: a cena de `viagem.ts` com passageira). **Escolha-chave 3** na estrada. |
| — | final | **O que você vai dizer?** · (sem alvo) | Catraca, cabine, Fita 7, escolha e epílogo (§5.1). |

### 5.1 O final: o momento mais comentado do ano

**A catraca (sistêmica e honesta).**
- **Quem mede:** o Sargento Vidal mede a Lia, que dá 12 e passa.
- **A leitura de Cris:** é **a radiação atual da run, de verdade**, mostrada como número.
  - **Até 60:** passa.
  - **De 61 a 65, com o Reis presente e confiando:** ele arredonda.
  - **Acima disso:** volta.
- **Por que é justo:** o jogo anunciou o limite um ato antes. A forma como você sobreviveu decide a cena, sem nenhum dado inventado.

**A cabine.**
- **O que se vê:** a luz de NO AR, o loop rodando, a cadeira da Íris e a Fita 7.
- **A pergunta do jogo:** às 6h40, *"O que a Farol vai dizer amanhã?"*
  - **Tocar a fita**: a verdade da Íris.
  - **Deixar o loop**: "tem lugar".
  - **Falar você**: Cris grava ao vivo com um montador de frases e precisa ficar na cabine.

**Os epílogos (5 a 7 telas cada):**

| Cris passou? | Escolha | Epílogo (resumo) |
|---|---|---|
| Sim | Fita | **"Hora certa."** Os dois atravessam. Na semana seguinte chegam menos romeiros, mas chegam preparados. Os Filhos param de interferir, e o Lume vem até a porta só para ouvir. |
| Sim | Loop | **"Tem lugar."** Os dois atravessam. Na semana seguinte chegam 40, passam 11. A Lia sabe e não diz nada por muito tempo. |
| Sim ou não | Falar você | **"No ar."** A Lia atravessa sozinha, porque você pediu. Do outro lado, ela liga o rádio às 6h40 todo dia. "Por três anos, a voz era a sua." |
| Não | Fita ou Loop | Cris fica. A Lia atravessa. Cris cuida da cabine e toca o que escolheu. A Lia ouve do outro lado. |

**A virada estrutural (em três telas).**

1. **A narradora se revela.** A voz das telas de morte ("Não foi assim…") se apresenta: *"Aqui é a Lia, na Farol."* A história inteira era ela, adulta, contando no rádio. As mortes eram as versões erradas.

2. **O QUE FOI DITO.** Usa o mesmo layout da Revelação do Modo Estudo e lista três coisas:
   - as alegações da Farol e das facções que **você ouviu nesta campanha**, cada uma com a verdade e se você chegou a verificar ("Você nunca foi ver.");
   - **as frases que você disse à Lia**, com a verdade ao lado;
   - a mentira do Reis, se ele arredondou ("Reis disse: 60. Verdade: 63.").

   E fecha com: *"Este jogo te deu 25 ordens. Nenhuma mentiu. Nenhum número, nenhum prazo, nenhuma oferta. Quem mentiu foi a voz, e você seguiu mesmo assim."*

3. **Rádio dos Vivos.** A mensagem gravada (ou a escolha) **passa a tocar no rádio de outros jogadores**, marcada com clareza como *mensagem de outro sobrevivente*. É o Rádio dos Vivos do plano de Game Design, com montador de frases moderado e sem texto livre.
   - **Estatística:** "38% de quem chegou aqui tocou a fita" só aparece **se o número for real** (vindo do backend). Sem backend, a linha não existe.

**Por que esse momento circula:** a pergunta *"o que você disse às 6h40?"* é pessoal, curta e compartilhável. Vira o card de compartilhar (hoje o card é de estatística).
- **Não dá para dar spoiler:** quem conta "o rádio era gravado" não estraga a tela das **suas** mentiras, porque essa é diferente para cada um.

**Referências declaradas, para não virar cópia:**
- *BioShock*: lá, a obediência era controle mental. Aqui, o jogo registra com honestidade **as suas próprias** mentiras.
- *Fallout*: lá, os Vaults eram experimentos. Aqui, a catraca nasce da escassez.
- *Bastion* e *Prince of Persia*: lá, o narrador conta e corrige. Aqui, a narradora é uma personagem com identidade escondida.
- *The Last of Us*: lá, havia a mentira de amor. Aqui, a mentira de amor é do jogador.
- *Papers, Please*: lá, você opera a catraca. Aqui, você está do outro lado dela.
- *Outer Wilds*: lá, o conhecimento persiste. Aqui, o Caderno de Escuta persiste.

### 5.2 Como a narrativa sobrevive à morte permanente e ao mundo procedural

1. **Moldura "Não foi assim".**
   - **Normal e Brutal:** a tela de morte deixa de ser "FIM DA JORNADA" e vira **"NÃO FOI ASSIM"**, com *"Não. Não foi assim que aconteceu. Deixa eu contar de novo."* O botão "Nova run" vira **"Contar de novo"**.
   - **Calmo (padrão, sem morte permanente):** *"Você acordou no abrigo. A Lia deixou o rádio ligado, alto, pra você achar o caminho de volta."*
   - **Em Sobrevivência, conciliado com o Legado do plano de Game Design:** a nova história é a **mesma Cris** num mundo recontado, e o corpo da versão anterior fica no mapa como "a versão errada". Isso substitui "outro sobrevivente" para não quebrar o vínculo com a Lia. **Decisão conjunta pendente** (§8.3).
2. **Caderno de Escuta persistente.** Fitas, revelações R1–R4 e alegações verificadas sobrevivem à morte. O conhecimento é a progressão, e a narradora reconhece: *"Dessa vez você já sabia do caminhão."*
3. **Âncoras fixas em mundo procedural.** Cada local temático **garante** um conjunto de história, do mesmo jeito que `TEMAS.radio.garante` faz hoje:

| Local | Âncora | Conteúdo |
|---|---|---|
| Base | parede da Lia + rádio | desenhos por ato; Farol às 6h40 |
| Ermo | carro com bilhete no para-brisa | romeiros |
| Floresta | fogueira do Reis | NPC fixo |
| Posto Km 40 | faixa da Defesa Civil desbotada + tanque seco | alegação falsa nº 1 |
| Cidade Velha | estúdio da Farol (letreiro) | Fita 1 |
| Hospital | armário e caderno de plantão da mãe | Socorro; Fita 4 |
| Pântano | altar dos Filhos | folheto; Fita 5 |
| Refinaria | cratera do "batismo" | mito do Colosso |
| Torre | mesa de som do Lume | Fita 3; confronto |
| Posto Militar 14 | escritório | Diretriz 7; Fita 6; Reis (2) |
| Abrigo 7 | **zona feita à mão** (exceção ao gerador) | catraca, cabine, Fita 7 |

4. **Dois baralhos de bilhetes.** Há bilhetes **de âncora** (fixos, por local e ato) e bilhetes **de mundo** (sorteados pela seed: textura, romeiros, vida comum). Meta: **40 bilhetes** (8 de âncora e 32 de mundo).
5. **O rádio como relógio narrativo.** A Farol toca **às 6h40 do jogo**, todo dia (programação de 7 dias, que é o próprio loop), e há uma janela da noite do Lume. Durante a viagem tocam fragmentos (J5 do plano de Game Design).
6. **NPCs fixos com memória.** O Reis, a Dona Cida e a Professora Lúcia deixam de ser sorteio de nomes e ganham flags de conversa. Os demais NPCs continuam procedurais e falam com textura, nunca de interface.
7. **Narrativa ambiental (pedidos à Arte):** queimados com radinho; desenhos da Lia; letreiro "FAROL 107,7"; faixas da Defesa Civil; cruzes com nome; filas de mochilas abandonadas na estrada norte.

### 5.3 Guia de estilo (vale para todo o texto)

**Princípios:**
- Frase curta. Uma imagem concreta vale mais do que um adjetivo.
- **Zero game-speak no texto do mundo.** Bilhetes e falas não dizem "nível", "XP", "Diário" nem "atalho". A informação mecânica vai só na `dica` da interface, separada e honesta.
- Cada bilhete tem **um objeto, uma pessoa e uma virada**.
- O humor é seco, brasileiro e de gente cansada. Nunca de meme.
- **Vocabulário do mundo:** o Clarão, a Troca, o Cordão, a catraca, os queimados, os romeiros, os Filhos do Cinza, a Milícia Velha, o PX, fichas, hora certa, "tem lugar".

**Limites para o celular** (Pixelify Sans; o card de evento usa 20 px, cerca de 30 caracteres por linha a 360 px):

| Tipo | Ideal | Máximo |
|---|---|---|
| Balão de rádio | 100 car. | 160 car. |
| Texto de evento | 110 car. | 140 car. |
| Opção de evento | 20 car. | 28 car. |
| Bilhete | 200 car. | 300 car. |
| Tela de abertura ou de final | 110 car. | 150 car. |
| Pensamento de Cris | 40 car. | 60 car. |

**Volume-alvo do 1.0:** cerca de **25 mil palavras** em PT. Hoje são cerca de 5 mil.

**Destino dos 16 bilhetes atuais:**
- **Manter:** Cartão-postal, Receita da vovó, Carta de despedida, Bilhete preso a uma cruz, Lista de compras.
- **Manter e conectar:** Página de diário (vira romeiro); Rabisco de criança (vai para a parede da Lia; no mundo, outra criança).
- **Reescrever na voz de uma pessoa:** Aviso de radiação, Bilhete do mecânico, Bilhete de um sobrevivente, Esboço de torre, Diário do mascate, Mapa desenhado, Aviso rabiscado, Anotações do cabo Reis (vira Reis 1, coerente com o arco).

---

## 6. Amostras de escrita (prova de tom)

### 6.1 Cinco bilhetes novos

**Bilhete no para-brisa** (Ermo, âncora, 175 car.)
> Fui pro Abrigo 7. A moça do rádio disse que tem lugar. Se você é o Juninho: a chave tá no pneu. Se não é, pode levar o carro. Só deixa o bilhete, pro caso de ser o Juninho.

**Caderno de plantão** (Hospital São Judas, âncora, cerca de 260 car.)
> 14/05, 9h. A luz voltou no gerador. A Íris falou no rádio da copa: "Equipes de saúde, permaneçam. A ajuda está a caminho." A gente permaneceu. {O|A} Cris deve estar na moto, xingando o trânsito. Tomara. Tomara que esteja xingando. — Socorro

**Fita 3 de 7** (Torre de Rádio, âncora, transcrição + áudio, cerca de 210 car.)
> Gravando? … Todo mundo acha que eu sabia. "Evitem o Centro." Eu não sabia. Era um caminhão tombado na 23 de Maio. Quem me obedeceu viveu porque um caminhão tombou. Só isso. É só isso que eu sou.

**Folheto dos Filhos do Cinza** (Pântano, mundo, cerca de 185 car.)
> A VOZ MENTE. O BRILHO NÃO. Ela manda você andar até a porta, e a porta mede você. Aqui ninguém mede ninguém. A cinza vai virar luz. Venha para a cratera: aqui todo mundo cabe.

**Anotações do cabo Reis (2)** (Posto Militar 14, âncora, cerca de 210 car.)
> Hoje mandei uma família voltar. A menina deu 61. Um acima do limite. A mãe perguntou se dava pra arredondar. Eu disse que a máquina não arredonda. Mentira. A máquina arredonda, sim. Eu é que não arredondei.

*Bônus, a Diretriz 7 (Posto Militar 14, âncora):*
> DIRETRIZ 7. Manter a locução "tem lugar" em todas as janelas. Motivo: fluxo ordenado. Leitura acima de 60: retorno à Zona. Não informar o limite na locução. *À mão, embaixo:* Ela leu isso no ar uma vez. Cortaram o sinal por três dias.

### 6.2 Cena de rádio (base, 6h40, fim do Ato I)

> **[estática · a vinheta da Farol: três notas; a segunda falha]**
> **ÍRIS:** Seis e quarenta, hora certa na Farol. Bom dia, sobrevivente. Aqui é a Íris.
> **ÍRIS:** Tempo: vento leste, cinza fina até o meio-dia. Fecha a janela e molha o pano antes de respirar.
> **ÍRIS:** Trânsito: estrada norte livre até o Km 40. O Posto Km 40 tem água da Defesa Civil. Pega sem briga. *(→ Caderno: alegação aberta)*
> **ÍRIS:** Abrigo 7 de portas abertas. Tem água, tem médico. Tem lugar. *(→ Caderno: alegação aberta)*
> **ÍRIS:** Se você ouviu isso ontem, ouve de novo. Repetir também é cuidar.
> **[chiado; outra voz, grave, por cima]**
> **LUME:** …pergunta pra ela quanto mede a porta. Pergunta! A voz mente. O brilho n…
> **[a vinheta volta; a segunda nota falha de novo]**
> **LIA:** Ela falou "tem médico". Viu? Tem médico.
>
> **[A gente vai ver.]** → LIA: Por que você fala assim? Ela salvou você.
> **[Viu.]** → LIA: Eu sabia. Ela nunca erra.
> **[ficar quieto]** → LIA: Você tá com a cara da mãe quando ela dizia "depois a gente conversa".

Notas de direção:
- Na segunda vez que o jogador ouvir, *"Se você ouviu isso ontem, ouve de novo"* tem que doer, porque ela gravou sabendo que seria um loop.
- A falha da segunda nota é **a pista sonora do loop** (dependência com o Áudio). A legenda visual mostra **[vinheta · a segunda nota falha]**.

### 6.3 Evento de estrada (formato de `eventos.ts`)

**Romeiros do rádio** (`id: 'romeiros'`, a partir do Ato I)
> Uma fila de gente a pé, rumo ao norte. Um homem leva um rádio no ombro, no volume máximo: "…tem lugar." *(105 car.)*

| Opção | Requisito | Resultado |
|---|---|---|
| **Dar carona** (−1 comb.) | combustível ≥ 2 | "Eles descem no Km 40. A mulher deixa um terço no painel e um pacote de bolacha. 'Deus lhe pague. Ou a Íris.'" (+bolacha, +XP) |
| **Contar o que sabe** | flag `sabe_loop` (R1) | "Você conta da semana que se repete. O homem baixa o volume. Ninguém fala por um tempo. Depois ele aumenta de novo. 'Prefiro ouvir.'" (+XP, +entrada no Caderno) |
| **Seguir viagem** | — | "No retrovisor, o rádio vai ficando pequeno. A voz não." |

Notas:
- O "No retrovisor" é um eco proposital do evento `viajante`: o jogo tem uma assinatura de voz.
- **Requisito por conhecimento** é uma novidade para o Game Design: o Caderno abre opções de diálogo.

### 6.4 Texto de abertura (substitui `PASSOS_INTRO`)

1. *Deixa eu contar do começo.*
2. *14 de maio, 6h40. São Paulo inteira parada no trânsito, ouvindo a mesma voz.*
3. *Ela disse: "Evitem o Centro." Um segundo depois, não havia mais Centro.*
4. *Quase dois anos depois, a voz ainda fala. Todo dia, às 6h40, ela diz que no Abrigo 7 tem lugar.*
5. *Você tem um jipe com o tanque quase seco, um rádio que pega quando quer e uma irmã de nove anos que acredita em tudo o que ele diz.*
6. *Vocês vão para o norte.*

A tela 1 é a narradora escondida (a Lia adulta) e só é paga no final. "O mundo acabou em luz." fica no menu, como chamada.

### 6.5 Texto final (ramo "No ar")

1. *6h38. A cabine cheira a poeira e café velho. Na cadeira, a marca de alguém que sentou ali por muito tempo.*
2. *O loop roda sozinho. "Tem lugar." A segunda nota da vinheta falha. Sempre falhou.*
3. *Na mesa, a fita 7. Escrito à mão: "A verdade. Para quando eu tiver coragem."*
4. *Lá fora, o sargento mede a Lia: 12. "Passa." Mede você: {N}. "{Passa.|Volta.}"*
5. *A Lia atravessa e não olha para trás, porque você pediu.*
6. *6h40. A luz de NO AR acende. O que a Farol vai dizer amanhã?*
   → **[Tocar a fita] · [Deixar o loop] · [Falar você]**
7. *(Falar você)* Do outro lado, todo dia às 6h40, ela ligava o rádio. Por três anos, a voz era a sua.
8. *Aqui é a Lia, na Farol. Eu tinha nove anos. Contei essa história muitas vezes e errei quase todas. Hoje eu contei certo.*
9. *Seis e quarenta, hora certa. Se você está ouvindo, está vivo.*
→ **O QUE FOI DITO** → **Rádio dos Vivos** → créditos

---

## 7. Localização e voz

### 7.1 Localização

| Item | Decisão |
|---|---|
| **Inglês (P0)** | **Transcriação literária**, não tradução técnica, feita por tradutor de jogos nativo em EN com experiência narrativa. O português fica como original e com ar de autenticidade, como o francês de Clair Obscur. |
| **Espanhol LatAm (P1)** | Neutro latino-americano. *Farol* funciona ainda melhor (blefe). |
| Glossário fixo | Farol 107,7 = *Farol 107.7*; "tem lugar" = *there's room*; "hora certa" = *on the dot*; Cordão = *the Cordon*; queimados = *the burned*; Filhos do Cinza = *Children of the Ash*; romeiros = *pilgrims*; Dona/Seu ficam como estão, com nota. |
| Trocadilhos | "farol" se perde em EN e é compensado com *beacon* nas falas. "23 de Maio" fica, com uma linha de contexto na Fita ("the 23 de Maio avenue"). |
| Infraestrutura (Dev, **P0 antes de escrever em volume**) | Extrair os textos de `.tsx`/`.ts` para um catálogo por idioma, com variável de gênero `{o\|a}`, plural e nomes. Pseudo-localização (+30% de comprimento) no smoke test, com conferência em 360 px. |
| Fontes | Verificar a cobertura de Pixelify Sans, Silkscreen e VT323 para ñ, ¿, ¡ e acentos. **Risco: Silkscreen** (só títulos). |
| Processo | Guia de estilo, capturas de contexto, limites por campo (§5.3), revisão linguística (LQA) **no celular**, leitura fria por um nativo. |
| **Custo estimado** (orçar com 3 fornecedores) | EN: cerca de 25 mil palavras × US$ 0,12–0,20 = **US$ 3–5 mil**, mais LQA de US$ 1–2 mil. ES: US$ 0,08–0,14 por palavra = **US$ 2–3,5 mil**, mais LQA. |

### 7.2 Voz

| Opção | Veredito |
|---|---|
| Só texto | Não basta. A Íris **é uma voz**. Sem voz, o tema fica no papel. |
| **Voz sintetizada (IA)** | **Não, no produto final.** Um jogo sobre confiar numa voz não pode ter uma voz falsa. Se a imprensa descobrir, a manchete mata o jogo, e há risco jurídico (direito de personalidade, LGPD). Serve só como placeholder interno, marcado para remoção. Alinhado ao "nada de IA generativa no áudio entregue" do plano de Áudio. |
| **Voz humana em PT, legendada (recomendado)** | Íris (cerca de 150 falas, ~35 min), Lia adulta (~35 falas, ~6 min), Lume (~30, ~5 min), Dona Cida no PX (~40, ~5 min), Reis (~20, ~3 min). **Total ~55 min.** O resto do elenco fica em texto com vocalizações curtas. |
| Lia criança | **Só texto**, mais um cantarolar opcional. Trabalho artístico infantil no Brasil exige autorização judicial (ECA, art. 149), o que tem custo e prazo altos para pouco ganho. |
| Dublagem EN | **P2**, depois do lançamento. O júri internacional aceita PT legendado. |

**Viabilidade e custo:**
- **Gravação remota:** o filtro de rádio (passa-banda de AM e estática) permite gravar em home studio de boa qualidade. Isso **barateia muito** o custo e deixa escalar uma **locutora de rádio de verdade** para a Íris, que é a autenticidade máxima.
- **Custo estimado em PT:** **R$ 25–60 mil** entre cachês, direção, edição e licença de uso. Orçar com 3 estúdios ou locutores.
- **Contrato:** cessão de voz por prazo e território definidos, com **cláusula que proíbe clonagem ou treino de IA**.
- **Peso no PWA:** mono a 32 kbps (do plano de Áudio), ~55 min ≈ **13 MB**, com carga preguiçosa por ato e fitas fora do pré-cache. O plano de Áudio já aponta que o `offline.mjs` precisa aceitar `opus/webm/m4a`.
- **Acessibilidade:** toda fala tem legenda. As fitas têm transcrição completa e o `sonsVisuais` cobre vinheta e interferência.

---

## 8. Prioridades, gates e dependências

**Esforço** (para 1 roteirista + 1 Desenvolvedor): **P** ≤ 1 semana · **M** 2–4 semanas · **G** 1–3 meses.

### 8.1 Backlog

**P0, sem isto não há narrativa de prêmio:**

| # | Item | Esf. | Dono | Prazo |
|---|---|---|---|---|
| N1 | Nome definitivo + busca de marca | P | Produção, Uwlo | 30/nov/26 |
| N2 | Bíblia aprovada pelo Uwlo, incluindo a exceção do Modo Estudo pós-final | P | Roteiro, Uwlo | 30/nov/26 |
| N3 | Camada de i18n e extração de textos (antes de escrever em volume) | M | Dev | 20/dez/26 |
| N4 | **Sistema de rádio:** programação por hora do jogo, balões, filtro AM, vinheta com falha, alegações ligadas ao Caderno | G | GD, Dev, Áudio | fev/27 |
| N5 | Lia na base: falas por ato, 3 escolhas registradas, porão nas invasões | M | GD, Dev, Arte | fev/27 |
| N6 | Reescrita dos 25 passos (título narrativo + requisito honesto) e correção "oito → dez" | P | Roteiro | dez/26 |
| N7 | Tela de morte "Não foi assim" + variante Calmo + abertura nova | P | Roteiro, Dev | dez/26 |
| N8 | **Fatia vertical narrativa:** Ato I completo com voz temporária da Íris | M | todos | **31/jan/27** |
| N9 | Âncoras dos 11 locais + 40 bilhetes (8 de âncora) + 7 fitas | M | Roteiro, Arte | abr/27 |
| N10 | **Final completo:** Abrigo 7 feito à mão, catraca com radiação real, cabine, 3 escolhas, epílogos, tela O QUE FOI DITO | G | todos | jun/27 |
| N11 | Voz humana PT gravada (Íris primeiro) | M | Produção, Áudio | mai/27 |
| N12 | Localização EN + LQA no celular | M | Produção | ago/27 |
| N13 | Auditoria de honestidade (gate G5) | P | Roteiro, Dev | ago/27 |

**P1, eleva a disputa:**

| # | Item | Esf. |
|---|---|---|
| N14 | Caderno de Escuta persistente entre vidas, com falas de reconhecimento | M |
| N15 | Reis, Cida, Lúcia e Lume como NPCs fixos com memória; Lume opcionalmente pacífico | M |
| N16 | Desenhos da Lia na parede por ato (decalques) | P |
| N17 | ES-LatAm + LQA | M |
| N18 | "Frequência 00": Modo Estudo pós-final com aviso; Revelação passa a se chamar "O QUE O JOGO DISSE" (**precisa do OK do Uwlo**) | P |
| N19 | Rádio dos Vivos: mensagens de jogadores com montador de frases, moderado; estatística só se for real | G |
| N20 | +10 eventos de estrada narrativos (romeiros, comboio do Cordão, Filhos pregando…) | M |
| N21 | Segredo do destino da Íris (bilhete raro pós-jogo: "Se você é da Farol… desculpa.") | P |
| N22 | Viagem final com passageira e fragmentos de rádio na estrada (J5 do plano de Game Design) | M |

**P2, depois do lançamento ou se sobrar tempo:** dublagem EN; guia para professores de educação midiática (o *Games for Impact* adora); trailer roteirizado "6h40"; contato com agências de checagem como possíveis parceiras (sem sugerir apoio antes de existir).

### 8.2 Gates de qualidade

| Gate | Quando | Como | Passa se |
|---|---|---|---|
| **G1 · A frase** | após N8 (fev/27) | 5 pessoas de fora jogam o Ato I no próprio celular. Depois: "Conte a história em uma frase." | ≥ 4 de 5 citam **o rádio/a voz** e **a irmã**. |
| **G2 · Leitura fria** | a cada lote de bilhetes | 5 pessoas leem 20 textos no celular, sem contexto, e marcam a frase que repetiriam a alguém. | ≥ 3 frases marcadas por ≥ 2 pessoas. Texto acima do limite ou sem marca é cortado ou reescrito. |
| **G3 · O que ficou** | jogo completo (jul/27) | 48 h depois: "Que frase do jogo você lembra?" | ≥ 3 de 5 lembram uma frase exata. |
| **G4 · O final** | jul/27 | 5 pessoas terminam o jogo. | ≥ 3 comentam a escolha sem serem perguntadas, ≥ 2 compartilham o card, e 0 acham a catraca "injusta" (porque o limite foi anunciado). |
| **G5 · Honestidade** | ago/27 | Tabela de **toda** alegação de personagem com o caminho de verificação. Teste de lógica: toda alegação tem `verdade`, e a interface nunca usa texto de alegação. | 100%. A frase "Nenhuma mentiu" só vai ao ar se for verdade. |
| **G6 · Sensibilidade** | antes de N9 e N11 | Leitura por especialista. | Sem nomes de vítimas reais do Césio-137 (a inspiração no brilho que encantou fica implícita). Canudos tratado com dignidade. Milícia sem pessoas reais. Criança nunca morre por sistema. |
| **G7 · Localização** | ago/27 | Nativo EN e ES fazem leitura fria no celular, a 360 px. | Nenhum texto cortado e o tom equivalente (o nativo cita uma frase). |
| **G8 · Celular** | contínuo | Captura de cada tipo de texto a 360 px no smoke test. | Todos dentro do limite do §5.3. |

### 8.3 Dependências

| Área | O Roteiro precisa de… | O Roteiro entrega… |
|---|---|---|
| **Game Design** | Caderno de Escuta (alegação, verificação, registro); requisitos por conhecimento em eventos e diálogos; catraca lendo a radiação atual; Abrigo 7 fora do gerador; passo novo Posto Militar 14 e reordem do `radio`; Lia sem morte por sistema. **Decidir juntos:** (a) o Legado em Sobrevivência com a mesma Cris recontada, em vez de "novo sobrevivente"; (b) a protagonista locutora do plano de Game Design contra a Íris separada, recomendada aqui porque separar cria um vínculo a descobrir, evita o clichê da amnésia e dá ao jogador uma mentira própria para encarar. | Alegações com verdade e local; textos de cada passo; falas por flag; os 3 estados de escolha. |
| **Arte** | Lia (receita infantil no `gerarHumano`); desenhos de parede; letreiro e estúdio da Farol; cabine, catraca e luz de NO AR; queimados com radinho; jipe com passageira; Abrigo 7 feito à mão; logo FAROL. | Lista de âncoras (§5.2) e descrições de cena. |
| **Áudio** | Filtro de rádio AM; **vinheta da Farol com a falha da segunda nota** (é pista do loop); interferência do Lume; pipeline de voz (Opus, carga preguiçosa, SW); tema do Abrigo resolvendo no final (o Fá♯ do plano de Áudio cai na luz de NO AR). | Roteiro de gravação por personagem, com direção de tom. |
| **Produção** | Escalação (locutora de rádio real para a Íris); contratos sem cláusula de IA; tradutores EN/ES; leitura de sensibilidade; testes remotos pelo celular; busca de marca; orçamento (voz R$ 25–60 mil + localização US$ 7–12 mil). | Calendário, contagem de palavras e textos prontos para tradução. |
| **Dev** | i18n (N3); sistema de rádio (N4); flags de NPC; tela final; Rádio dos Vivos com backend ou Nostr. | Dados em entradas puras, no padrão "criar um novo = uma entrada". |

### 8.4 Calendário até o TGA 2027

| Data | Marco |
|---|---|
| 30/nov/26 | Nome e bíblia aprovados |
| 31/jan/27 | **Fatia vertical (Ato I) + G1** |
| abr/27 | Atos II–III escritos, âncoras prontas, G2 contínuo |
| mai/27 | Voz PT gravada |
| jun/27 | Final completo. Inscrições em festivais de meio de ano (BIG Festival, vitrines latino-americanas) |
| jul/27 | **Texto travado.** G3 e G4 |
| ago/27 | EN pronto, G5, G7. Inscrição no IGF (prazo costuma ser set–out) |
| **set/27** | **Lançamento 1.0** (PT + EN). Press kit com a logline A e a tagline |
| out–nov/27 | ES, críticas, campanha "o que você disse às 6h40?". Corte do TGA em ~20/nov |

### 8.5 Riscos (dito com franqueza)

- **Narrativa não ganha GOTY sozinha.** Os 12 vencedores tinham Metacritic ≥ 88. Este plano torna o CINZAS candidato realista a **Best Narrative, Games for Impact e Best Debut Indie**, e é dali que se chega ao GOTY.
- **Escopo.** 25 mil palavras, 55 min de voz e uma zona feita à mão são muito para um time pequeno. **Se apertar, corte nesta ordem:** N20 → N15 (Lume pacífico) → epílogos variantes → nunca o final nem a Íris.
- **Spoiler.** O loop vaza rápido. A defesa é a tela pessoal, que não dá para estragar.
- **Comparações** (BioShock, Fallout, Bastion): assumir as referências na imprensa e mostrar a diferença (§5.1).
- **Assuntos sensíveis:** São Paulo destruída, Canudos, milícia e criança em perigo. Por isso o G6 vem **antes** da gravação.
