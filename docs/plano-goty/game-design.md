# CINZAS — Plano de Game Design rumo ao TGA 2027

**Autor:** Direção de Game Design · **Data:** 4/nov/2026 · **Corte do TGA:** ~20/nov/2027 (54 semanas)
**Base:** leitura de `CLAUDE.md`, `HANDOFF.md` (§1–23) e do código em `game/dados/*`, `game/sistemas/*`, `game/estudo.ts`, `game/cena.ts`, `game/audio.ts`, `components/Hud.tsx`, `components/Controles.tsx`, `components/Telas.tsx`. Nada no repositório foi alterado.

**Escala de esforço** (ritmo atual: Uwlo + sessões de Claude Code):
**P** ≤ 1 semana · **M** 2–4 semanas · **G** 1–3 meses.
**Prioridade:** **P0** = sem isto o jogo não chega à conversa (até a fatia vertical, fev/2027) · **P1** = pacote de lançamento (até ago/2027) · **P2** = se sobrar tempo (até out/2027).

---

## 0. Resumo executivo

1. **O CINZAS de hoje é um survival competente e bem medido, mas genérico.** A arquitetura é ótima: conteúdo vira dado, balanço tem teste, o som é normalizado e a acessibilidade está acima da média. O *design*, porém, é uma soma de convenções de survival de celular. A campanha é uma lista de tarefas (`objetivos.ts`, sendo 4 dos 24 passos "Chegue ao nível N"). O combate é um teste de atributos com ataque automático em 360° (`balanco.ts` diz literalmente "tudo acerta, ninguém recua"). Os irradiados são zumbis com outro nome (`voz: 'zumbi'`, clipe `cambalear`). Não há personagem, nem frase, nem final.
2. **A ideia-assinatura proposta: "O Geiger não mente. O rádio, sim."** O perigo principal é invisível: a radiação vira um campo vivo, levado pelo vento, que só se *ouve*. A informação vem de transmissões de rádio de facções, e cada facção tem um interesse e uma técnica de manipulação (escassez, prova social, prazo falso, autoridade, "quase lá"). O jogador **verifica** essas transmissões com instrumentos honestos (Geiger, antena, cruzamento de fontes) e registra tudo num **Caderno de Escuta** ("disseram × verdade"). O Modo Estudo deixa de ser um segredo escondido e passa a ser o tema do jogo inteiro, **sem que a interface do jogo jamais minta para o jogador**.
3. **Quatro pilares:** Ouvir o invisível · Toda voz tem interesse · A estrada é a decisão · Uma mão, um mundo vivo.
4. **A sessão vira a "Expedição" (8–12 min):** Rádio → Estrada → Zona → Extração → Abrigo, terminando num **ponto de parada honesto** ("bom lugar para parar").
5. **O longo prazo** é uma campanha de 4 atos com 10–14 h, guiada por narrativa (sem os portões "chegue ao nível N"), com dois finais de escolha moral e um pós-jogo ("Rádio Livre"). A rejogabilidade vem da **Travessia Diária** (15–20 min, mesma seed para todos, ranking honesto) e do **Rádio dos Vivos** (mensagens assíncronas e reais de outros jogadores via Nostr).
6. **P0 de sistemas:** Escuta/Caderno; campo de radiação dinâmico; combate com leitura de golpe e esquiva por deslize (uma mão); irradiados com ecologia própria (atraídos por calor, luz e radiação, e não caçadores); campanha reescrita; abertura de 10 minutos; seeds em tudo (hoje os eventos usam `Math.random`).
7. **O momento de clipe:** a noite sem lanterna. Só se ouvem o Geiger e passos, um relâmpago revela o Colosso a dois metros, e as legendas visuais de som fazem o mesmo momento funcionar no mudo. O segundo momento é o carimbo de **FALSO** no Caderno, com um card de compartilhar do tipo "a Milícia me prometeu X, era Y".
8. **Gates mensuráveis e honestos:** telemetria só com consentimento e mostrada ao jogador; playtests com desconhecidos; metas de D1 ≥ 40% / D7 ≥ 15% (coorte de playtest), ≥ 65% terminando o Ato I, nota média ≥ 8,5/10 com desconhecidos (o proxy de Metacritic 88) e ≤ 10% de mortes julgadas injustas.
9. **Avaliação franca:** GOTY é a estrela-guia, não a meta provável. As portas reais são Innovation in Accessibility, Games for Impact, Best Mobile e Best Debut Indie, além de festivais antes (BIG/gamescom latam, IGF 2028). O plano é desenhado para que cada passo rumo ao GOTY também fortaleça essas candidaturas.

---

## 1. Diagnóstico honesto do design atual

### 1.1 O que funciona (e deve ser preservado)

| Área | Onde | Por que é bom |
|---|---|---|
| **Arquitetura orientada a dados** | `dados/*.ts` ("criar X = uma entrada"), `game/lib/` (voxel procedural, `Rec*`/`gerar*`) | Permite escalar conteúdo (criaturas, eventos, transmissões) sem arte manual. É a principal vantagem de produção de um time de 1. |
| **Design medido por teste** | `balanco.ts` (`perdaEmLuta`, `ttk`, `segundosAteZerar`), `cobertura.ts` (transformada de distância, pior ponto ≤ 16 tiles), 51 testes | É raro em indie. Permite afinar sem quebrar. Será a base dos gates (§6). |
| **Diretor de população com respiro** | `spawn.ts` (`TENSAO_LIMITE = 0.55`, alívio ≤ 25 s, 60% dos spawns atrás de quem olha) | É o equivalente honesto do AI Director de Left 4 Dead. O DDA nunca é usado para vender. |
| **Eventos sempre sinalizados** | `diretor.ts` (lançamento com fumaça e seta; invasão com aviso de rádio 9 s antes) | É o "contrato honesto" com o jogador, que vira pilar (§2). |
| **Áudio como sistema** | `audio.ts`, `sons.ts` (normalização por categoria, ducking, reverb interno/externo, Geiger em Poisson pelo cpm) | O Geiger já é a melhor coisa do jogo. Ele vira o centro do design. |
| **Acessibilidade** | `Hud.tsx` `SonsVisuais` (direção ◀▶, Geiger fraco/médio/FORTE), `efeitos.ts` (`menosEfeitos`), interface XG | Sinergia rara: como o jogo é "de ouvido", as legendas visuais deixam de ser um apêndice e viram parte do design. |
| **UX de controle pensada** | `Controles.tsx` (manche com histerese; uma mão por toque, A* em `toque.ts`), `Hud.tsx` (divulgação progressiva, atalhos urgentes) | É a base certa para mobile vertical. Falta dar *agência* ao combate em uma mão (§4.1). |
| **Desmembramento sistêmico** | `ia.ts` `ferir` (perna decepada → `mancar`; duas → `rastejar`) | É mecânica, não enfeite. Deve ser ampliado. |
| **Modo Estudo** | `estudo.ts`, `Telas.tsx` (`Fim`, `Loja`, `Revelacao`) | É o ativo mais original do projeto. Hoje está escondido (toque 7× no título ou `?estudo=1`). |
| **Viagem com marcos e física de rota** | `lib/viagem.ts`, `rota.ts` (freia na distância certa antes do evento) | Tem identidade visual e é um bom "respiro" de sessão. Falta decisão (§4.5). |

### 1.2 O que é raso

1. **Campanha = checklist de tutorial.** Em `objetivos.ts`, os passos são tarefas mecânicas ("Colete 6 de madeira", "Coma ou beba algo", "Cace 2 animais"). Quatro passos são **portões de grind** ("Chegue ao nível 3/5/7/8"). O teste de projeto exige que ≥ 50% do XP de cada nível venha da campanha, ou seja, a campanha existe para alimentar níveis, e não o contrário. Não há uma única cena com personagem.
2. **Mapa liberado por nível** (`locais.ts` `nivel`; `bloqueioLocal` → "Precisa do nível 6"). É o vocabulário de *Last Day on Earth*, que um júri de imprensa lê como "jogo mobile com paywall de tempo", mesmo sem cobrança.
3. **Combate sem decisão.** No modo uma mão (padrão), o "ataque automático fica sempre ligado (360°)". O irradiado tem 40 hp. Com o pé de cabra (18), são 3 golpes e um TTK de ~1,65 s. O dano recebido é 8 × 0,75 (Normal) a cada 1,2 s. Não há esquiva, bloqueio, postura nem janela de leitura. A IA hostil tem um único padrão: perceber → `persegue` → bater no alcance (`atualizarEnt`). Os *ranged* mantêm distância e atiram com acerto `0.85 − dist·0.06`. Não há cobertura, flanco nem rendição.
4. **Furtividade é um multiplicador.** `ponte_furtivo() ? 0.5` na percepção. Não há abate furtivo, esconderijo, distração (arremessar garrafa) nem uso de luz e sombra além da noite.
5. **Sobrevivência sem tensão.** A sede zera em ~22 min e a fome em ~34 min (Normal). A partida começa com 3 águas, 4 bandagens e 3 enlatados (§20). Os reservatórios resolvem a água (`Bioma.fontes`) e a regeneração é de 0,35 hp/s alimentado. O **Calmo é o padrão e não tem morte permanente**. Escolha honesta do Uwlo ("tô achando muito difícil"), mas o resultado são poucas decisões reais de recurso.
6. **A radiação é um número estático.** `zona.rad` é gerado uma vez em `zona.ts:98`. O ganho por segundo é `rad^1.2 · 2,4`, e a cura é `antirrad −35`. A radiação não se move com o vento (`clima.ts` tem `vento`, mas sem direção aplicada ao campo) e não conta história. O Geiger é atmosfera, e não instrumento.
7. **O abrigo é uma planilha.** Há 5 melhorias com efeito percentual (`meta.ts` `MELHORIAS`: "Invasões 20% menores"). Nada é posicionado. A invasão (`diretor.ts`) é um grupo que nasce a 26–34 tiles e persegue. Não há planejamento de defesa (compare com *Darkwood*: de dia explora, de noite defende a casa que você mesmo barricou).
8. **A progressão é "números sobem".** São 12 perks de +X% (`meta.ts` `PERKS`), escolhidas 1 entre 3 por nível. Não há sinergia, build nem descoberta. São 24 conquistas, quase todas contadores.
9. **Eventos repetem rápido e não são determinísticos.** São 9 eventos (`eventos.ts`), com 45% de chance por viagem, e só o último é evitado (`ultEv`). A sorte usa `Math.random` (`acoes.ts` `ajuda().sorte`), o que **quebra a promessa da seed diária** e o anti-trapaça por replay previsto em §9 do HANDOFF. Há 39 usos de `Math.random` em `sistemas/` e `cena.ts`.
10. **NPCs sem memória nem arco.** São 3 tipos (`npcs.ts`), e as falas são saudação + clima + dica do objetivo + rumor, montadas por sorteio. A única reputação é o booleano `Run.traiu`.
11. **Narrativa de três frases.** `PASSOS_INTRO` tem 3 linhas e há 16 bilhetes. A vitória é "Você seguiu o sinal. Do outro lado da porta, a vida recomeça." Não há protagonista, antagonista, pergunta dramática nem frase memorável.
12. **Endgame inexistente.** `executarVitoria` apaga a partida (`apagarRun`). Só ficam conquistas e recordes. Depois do Abrigo 7, não há razão para voltar além de "Nova run" com a mesma estrutura.
13. **Música:** drone de 3 osciladores com notas triangulares sorteadas na escala menor pentatônica (`audio.ts:115`). Funciona como textura, mas não é trilha.
14. **Multiplayer:** inexistente (`trystero` não está no `package.json`).
15. **Nenhum humano externo jogou** (`docs/VALIDACAO.md`: "não houve validação humana independente nem em aparelho físico").

### 1.3 O que um crítico de nota 90+ escreveria hoje

> "CINZAS impressiona tecnicamente para um jogo de navegador: pixel art isométrica gerada por código, clima convincente e um contador Geiger que dá arrepios. Mas por trás disso há um survival de celular por números: colete 6 madeiras, chegue ao nível 5, cumpra 3 contratos. O combate se resolve sozinho e os 'irradiados' são zumbis com outro nome. Quando o rádio enfim leva ao Abrigo 7, a tela diz que a vida recomeça e o jogo acaba, sem que eu saiba quem eu era. **6/10 — bonito, competente e esquecível.**"

O que separa esse 6 de um 9 não é volume, e sim **uma ideia que só este jogo tem, executada em todos os sistemas**.

### 1.4 Dívidas de design encontradas na leitura (corrigir já)

| # | Problema | Onde | Ação | Esf. |
|---|---|---|---|---|
| D1 | Sorte dos eventos e boa parte da IA usam `Math.random` → seed diária não é comparável; replay anti-trapaça impossível | `acoes.ts` `ajuda().sorte`, `ia.ts`, `cena.ts` | Passar tudo que afeta o resultado para `Rng` com seed (`seed|evento|minuto`); deixar `Math.random` só para o cosmético | M |
| D2 | `distAbrigo` placeholder (`+ 143`) na morte | `acoes.ts` `executarMorte` | Distância real ao Abrigo 7 no mapa-múndi (também alimenta o Modo Estudo, conforme §15) | P |
| D3 | Linguagem de zumbi nos dados | `criaturas.ts` (`ZUM`, `voz: 'zumbi'`), comentários "zumbis" | Renomear para `irradiado`; redesenhar o comportamento (§4.7) | P |
| D4 | Bônus de sequência (`meta.sequencia >= 3` → kit extra) | `Jogo.tsx:29`, `store.ts` `registrarDia` | É recompensa por assiduidade, vizinha da aversão à perda. Trocar por "boas-vindas de volta" que **não depende** de dias seguidos (ex.: o mascate trouxe algo após ≥ 1 dia fora) | P |
| D5 | Objetivos "Chegue ao nível N" | `objetivos.ts` | Substituir por passos narrativos (§3.3) | M |
| D6 | A seed é o dia de criação da partida (`novoRun(hoje())`) e a partida dura vários dias reais → "mesmo mundo para todos" só vale no dia 1 | `Jogo.tsx` | Separar a **Campanha** (seed própria e persistente) da **Travessia Diária** (seed do dia, uma tentativa) | M |

---

## 2. Pilares e ideia-assinatura

### 2.1 Pilares (todo recurso novo passa nestes 4 testes)

| Pilar | Frase | Teste do pilar (pergunta de corte) | Exemplos que passam | Exemplos que não passam |
|---|---|---|---|---|
| **1. Ouvir o invisível** | O perigo que importa não se vê: se ouve, se mede, se deduz. | "Isto dá ao jogador uma razão para *escutar* ou *medir* antes de agir?" | Campo de radiação dinâmico; Colosso anunciado por passos; noite sem lanterna; neblina | Marcador de inimigo no minimapa; radar mostrando tudo |
| **2. Toda voz tem interesse** | Pessoas mentem, instrumentos não. O jogo nunca mente para você; os personagens, sim. | "Quem está dizendo isto e o que ganha com isso? O jogador tem um jeito honesto de checar?" | Transmissões com alegações verificáveis; mascate com agenda; Caderno de Escuta | UI do jogo com números falsos; probabilidade de saque escondida |
| **3. A estrada é a decisão** | Sair custa. Combustível, dose e tempo são relógios honestos e visíveis. | "Isto torna a escolha de *para onde ir* mais interessante?" | Rotas com risco; jipe com carga e condição; prazos reais no mundo | Portão "precisa do nível 6"; teleporte grátis |
| **4. Uma mão, um mundo vivo** | Tudo é jogável com um polegar, em 5–15 min, num mundo que reage. | "Funciona com um polegar, em pé no ônibus, e termina num ponto de parada?" | Esquiva por deslize; Expedição; ponto de parada | Combo de 3 botões; sessão obrigatória de 40 min |

### 2.2 A ideia-assinatura: **Sinal e Ruído** ("O Geiger não mente. O rádio, sim.")

**Premissa de jogo.** Depois do clarão, a única rede que sobrou é o rádio. Toda informação útil (onde há remédio, onde há água, onde é seguro, o que é o Abrigo 7) chega por **transmissões** de quem tem interesse em que você vá até lá. Cada facção manipula com uma técnica real de persuasão, as mesmas que o Modo Estudo expõe:

| Emissor | Interesse | Técnica de manipulação (diegética) | Como se desmascara |
|---|---|---|---|
| **Saqueadores** (`FACCOES[0]`) | Atrair vítimas e saquear | **Escassez e prazo falso**: "Suprimentos médicos no Posto Km 40, só até o amanhecer" (repetido todo dia, igual ao `ofertaRestante` do Estudo) | A transmissão se repete no dia seguinte com o mesmo prazo → o Caderno marca **PRAZO FALSO** automaticamente |
| **Filhos do Cinza** (`FACCOES[1]`) | Recrutar para o culto | **Prova social inventada**: "Mais de 40 sobreviventes já se juntaram à Luz" | Contar as fogueiras e barracas no local (o Geiger e a visão confirmam 6 pessoas) |
| **Milícia Velha** (`FACCOES[2]`) | Controlar território e combustível | **Autoridade e ancoragem**: "Ordem do Governo Provisório: entregue 10 galões e receba proteção" | Achar o documento real do Governo (bilhete) e cruzar com o depoimento de NPCs |
| **Abrigo 7** (o sinal da campanha) | Trazer gente para o norte (o porquê é o segredo do Ato IV) | **Quase lá e custo afundado**: "Faltam 3 dias. Você já chegou até aqui" | O Geiger na rota real e os diários dos que foram (Ato IV) |
| **Sobreviventes comuns** | Sobreviver; às vezes ajudar | Às vezes dizem a verdade; às vezes se enganam (sem má-fé) | Verificação normal. Ensina que nem todo erro é mentira |

**O verbo novo: ESCUTAR (verificar).** No abrigo, o rádio lista 2–4 transmissões ativas. Cada uma tem **alegações** com tipo e verdade definidos pela seed:

```
Transmissao { id, emissor, texto, alegacoes: [
  { tipo: 'local' | 'conteudo' | 'radiacao' | 'prazo' | 'adesao' | 'autoridade', valor, verdade: boolean } ],
  tecnica?: 'escassez' | 'prova_social' | 'autoridade' | 'ancoragem' | 'quase_la' | 'reciprocidade' }
```

Instrumentos de verificação, todos honestos e com custo visível:

| Instrumento | Verifica | Custo | Origem no código atual |
|---|---|---|---|
| **Geiger** (no local ou com sonda de longo alcance) | `radiacao` | Ir até lá (dose) ou 1 bateria (sonda, P1) | `cena.ts` cpm + `setGeiger` |
| **Triangular** (rádio do abrigo + antena) | `local`, emissor real | 1 h de jogo + 1 bateria; a antena (melhoria) reduz | Novo: "Antena" em `MELHORIAS` |
| **Cruzar fontes** | `conteudo`, `adesao`, `autoridade` | Conversar com NPCs, ler bilhetes, observar | `npcs.ts` `falaDe` (passa a citar transmissões), `notas.ts` |
| **Observar o tempo** | `prazo` | Nenhum, só atenção: a repetição é registrada sozinha | Novo: histórico de transmissões no Caderno |

**O Caderno de Escuta** (nova aba no Diário) é o Modo Estudo trazido para dentro da ficção: cada transmissão vira uma ficha "**Disseram** × **Verdade** × **Técnica** × **Como descobri**", igual ao `Manip { mostrado, real, porque }` do `estudo.ts`. Ao fim de cada ato, toda transmissão do ato é resolvida (uma **Revelação diegética**). Resultado de jogo:

- Seguir uma transmissão **falsa sem verificar** = consequência justa e sinalizada (emboscada, zona mais quente, viagem perdida). Nunca é morte instantânea.
- **Desmascarar** uma transmissão rende XP de Escuta, reputação com quem foi prejudicado e às vezes o "prêmio real" escondido (o saque que os saqueadores guardavam).
- **Conhecimento é progressão** (no estilo *Outer Wilds*): as "assinaturas" de cada facção (ex.: os Saqueadores sempre transmitem às 18h, com chiado na faixa 3) ficam no Caderno **entre mortes**. O jogador fica melhor porque *entende* mais, e não porque um número subiu.

**Por que isto respeita a regra honesta** (proposta para o Uwlo aprovar, decisão D-A):
1. A **interface do jogo nunca mente**. HUD, Geiger, chances de saque, raridade, contagem de inimigos e DDA são sempre verdadeiros. Quem mente são **personagens**, dentro da ficção.
2. As transmissões têm **gramática visual própria** (fita de papel, ícone de antena, voz filtrada, tipografia VT323 riscada), distinta do HUD. Isso segue a regra de formas atual: cápsula = seguro, polígono cortado = perigo.
3. Nada pressiona **o jogador real**: nenhum prazo é de relógio real, nenhuma cobrança existe e não há "X% dos jogadores" falso fora da ficção.
4. **Tudo é revelado**: cada transmissão termina resolvida no Caderno. É a tela de Revelação, só que espalhada pelo jogo.
5. O **Modo Estudo** continua existindo, separado e intacto (`?estudo=1`), para a reportagem. A campanha passa a *ensinar a reconhecer* o que o Estudo *demonstra*.

### 2.3 A camada física da assinatura: **o campo de radiação vivo**

- `zona.rad` deixa de ser estático. Ele passa a ter **fontes** (crateras, barris, carcaças, cogumelo `brilho`) e uma **pluma** que se desloca com o vento de `clima.ts` (direção nova + intensidade já existente). A poeira (`ClimaId 'poeira'`) e a chuva ácida carregam e depositam radiação. A simulação é uma grade 96×96 com advecção e difusão simples a 2 Hz, barata e pura, então testável em Node como `spawn.ts`.
- **Não há overlay de radiação por padrão.** O jogador sabe pela **taxa de cliques** (Poisson), pela legenda visual (`SonsVisuais`: fraco/médio/FORTE + seta ◀▶ para o lado de maior gradiente, nova) e pelo tom verde (`.rad-tom`). Isso **é** o pilar 1, e a acessibilidade já está meio construída.
- **Dose acumulada** (nova, por personagem) é separada da **contaminação** (o `rad` atual, curável com antirrad). A dose cai só devagar e reduz a vida máxima em degraus visíveis (100 → −10 hp máx; 250 → náusea, sede ×1,3; 400 → cabelo cai e a visão escurece nas bordas; 500 → personagem "aposenta", §3.5). É o **relógio honesto** da partida: você escolhe gastar dose por saque melhor (zonas quentes têm `TEMAS.extra` melhores).
- **Irradiados seguem a radiação** (§4.7): eles "pastam" nos pontos quentes e migram com a pluma. Ouvir o Geiger subir também significa que eles estão perto. Dá para atraí-los com um barril aberto, como isca.

### 2.4 Comparação com o gancho de cada vencedor

| Vencedor (TGA) | Gancho-assinatura | Lição para o CINZAS | Equivalente proposto |
|---|---|---|---|
| Dragon Age: Inquisition (2014) | Escolhas com peso político, base que cresce | Facções que lembram | Reputação por facção que muda as transmissões |
| The Witcher 3 (2015) | Missões secundárias com dilema moral real | Cada contrato precisa de uma história | Contratos viram transmissões com alegações |
| Overwatch (2016) | Heróis legíveis por silhueta e som | Leitura sonora de ameaça | Cada criatura com assinatura sonora + legenda |
| Zelda: BotW (2017) | Motor químico sistêmico, liberdade de solução | Sistemas que se combinam | Radiação + vento + fogo + ruído + luz se combinando |
| God of War (2018) | Relação pai e filho, câmera de plano único | Um personagem com arco | Protagonista-operadora de rádio com arco (§7 Roteiro) |
| Sekiro (2019) | Postura e aparar: o combate é uma conversa | Leitura de golpe > atributo | Janela de esquiva e contra por deslize (§4.1) |
| The Last of Us Part II (2020) | Empatia pelo "inimigo", acessibilidade de referência | Inimigos com nome; 60+ opções de acessibilidade | Gangues que se rendem e choram por companheiros; pacote completo de acessibilidade |
| It Takes Two (2021) | Coop obrigatório, mecânica nova a cada fase | Coop desenhado, não acoplado | Duo P2P com papéis (motorista/escuta × batedor) (§4.8) |
| Elden Ring (2022) | Descoberta pura, mensagens assíncronas | Mensagens de outros jogadores como prova social real | **Rádio dos Vivos** (Nostr) |
| Baldur's Gate 3 (2023) | Reatividade sistêmica total | O mundo responde a como você joga | Transmissões que mudam conforme quem você desmascarou |
| Astro Bot (2024) | Vitrine de hardware (DualSense) | Usar o hardware que você tem | **Vitrine do celular**: vibração, uma mão, PWA offline, tela vertical |
| Clair Obscur: Expedition 33 (2025) | Turno com aparar em tempo real; identidade cultural forte (Belle Époque) | ~30 pessoas vencem com identidade + combate com timing | **Pós-apocalipse brasileiro** + esquiva com timing |
| *Vampire Survivors* (BAFTA 2023) | Um input, poder que escala | Simplicidade de controle não impede profundidade | Ataque automático continua, mas a decisão vira posição e esquiva |
| *Balatro* (indicado 2024) | Regras simples, combinações multiplicativas | Perks com sinergia explícita | Ofícios com etiquetas que combinam (§4.6) |

**Por que só o CINZAS pode fazer isso:** (1) é o único com um **Modo Estudo** já funcional sobre manipulação; (2) roda na **web/P2P via Nostr**, uma rede de transmissões assinadas, que é a metáfora perfeita do rádio pós-apocalíptico; (3) já tem o **Geiger por Poisson** e **legendas visuais de som**, ou seja, "jogar de ouvido" com acessibilidade embutida; (4) tem **identidade brasileira** (Posto Km 40, Hospital São Judas, fichas de racionamento, Dona Cida), que nenhum survival grande tem. Atenção: *Pacific Drive* (2024) já fez "carro como base em zona anômala". O jipe do CINZAS precisa se diferenciar pela **decisão de rota e informação**, e não por pilotagem.

### 2.5 Decisões que dependem do Uwlo

- **D-A:** aprovar o "Sinal e Ruído" (personagens mentem dentro da ficção; a interface nunca mente; tudo é revelado no Caderno). Sem isso, o pilar 2 cai e voltamos ao survival genérico.
- **D-B:** Modo Estudo: continua escondido (é o que dá força à reportagem), ou ganha também uma entrada "Experimento (Modo Estudo)" no menu, com aviso? Recomendo **manter escondido** e citar sua existência nos créditos e na imprensa.
- **D-C:** Calmo continua padrão? Recomendo um padrão novo, **"Jornada"** (morte sem perder o personagem, mas com custo de dose e carga), com **"Sobrevivência"** (morte permanente) oferecido de forma explícita na primeira tela. Assim o júri não vê um jogo sem stakes, e quem achou difícil continua acolhido.
- **D-D:** nome definitivo (CINZAS é provisório). Recomendo manter um nome curto e em português. "CINZAS" funciona internacionalmente se o subtítulo carregar a ideia: *CINZAS: Sinal e Ruído*.

---

## 3. Loops redesenhados

### 3.1 Core loop (30 s – 2 min): **ouvir → decidir → agir → registrar**

1. **Ouvir:** Geiger sobe pela esquerda; passos pesados atrás do galpão; chiado de rádio de saqueador.
2. **Decidir:** contornar pela pluma (dose) ou pelo galpão (ruído de porta, `abrirPorta` com `ruido 4`); lanterna (enxerga, mas atrai irradiados); jogar uma garrafa para distrair.
3. **Agir:** mover com um toque, esquivar com um deslize, interagir ao chegar. O ataque automático cuida do ritmo, e o jogador cuida da posição.
4. **Registrar:** saque cai na grade (`grade.ts`); a descoberta vai para o Caderno; o texto flutuante mostra o ganho (`Cena.flutuar`).

### 3.2 Loop de sessão: **a Expedição** (alvo de 8–12 min; mínimo 5, máximo 15)

| Fase | Tempo real | O que acontece | Sistemas | Decisão-chave |
|---|---|---|---|---|
| **1. Rádio** (abrigo) | 30–60 s | 2–4 transmissões ativas, mais contratos dos sobreviventes honestos | Escuta (novo), `contratos.ts` | Qual seguir? Verificar antes (custa 1 h + bateria) ou arriscar? |
| **2. Estrada** | 30–90 s | Jipe na rota (`lib/viagem.ts`), 0–1 evento de estrada (seed), escolha de rota | `eventos.ts` (com seed), `rota.ts` | Rota curta e quente × rota longa e fria (combustível × dose) |
| **3. Zona** | 5–9 min | Meta da transmissão + saque + campo de radiação + criaturas | `zona.ts`, `spawn.ts`, campo de radiação | Até onde ir com a dose e a carga que restam? |
| **4. Extração** | 30–60 s | Voltar ao jipe. Dar partida faz **ruído 12** (hoje o jipe não faz ruído) e atrai o que estiver perto. Só sai quem chegar ao jipe | Novo `extracao` em `acoes.ts` | Sair agora com a mochila cheia ou arriscar o último contêiner? |
| **5. Abrigo** | 1–3 min | Fabricar, construir, ler, entregar contratos, dormir → **salva** | `progresso.ts`, `Bancada.tsx`, `salvar.ts` | O que construir antes da noite (cerco)? |
| **Ponto de parada** | — | Cartão "Expedição concluída · jogo salvo · bom lugar para parar", com o resumo da expedição | Novo | **Parar é legítimo**: técnica honesta, oposta ao "só mais uma" compulsivo |

**Números de ajuste** (a partir de `balanco.ts`):
- Dia de jogo = 14 min reais (manter). Uma expedição ≈ 0,6–0,8 dia.
- Sede 100→0 em ~22 min reais: uma expedição consome ~40% da sede. Levar água importa sem virar tarefa.
- **Orçamento de dose da expedição** (sugestão para Normal): zona fria +5–15, zona morna +20–40, zona quente +50–90 (é preciso máscara ou antirrad). Alvo: em 6–10 expedições quentes, a dose chega a 400.
- **Pausa segura:** o jogo pausa sozinho ao perder o foco (PWA), e a Expedição pode ser **suspensa** em qualquer ponto com salvamento exato. Celular toca, a vida acontece. Hoje salva-se na viagem e no sono, então é preciso garantir o salvamento contínuo em zona.

### 3.3 Loop de longo prazo: campanha em 4 atos guiada por história (10–14 h)

Os portões "Chegue ao nível N" saem (D5) e o mapa deixa de abrir por nível (`Local.nivel`). O acesso passa a ser **diegético**: você precisa *saber* que o lugar existe (transmissão verificada ou bilhete), *chegar* (combustível, rota, guincho para a ponte caída, máscara para o Pântano) e *aguentar* (dose).

| Ato | Pergunta dramática | Passos (exemplos concretos, substituindo `objetivos.ts`) | Ensina | Fim do ato |
|---|---|---|---|---|
| **I · O Sinal** (~1,5 h) | "Em quem eu confio?" | 1) Abertura no jipe (§5); 2) Primeira transmissão: "Posto Km 40 está limpo, tem combustível" → é **meia verdade** (tem combustível, mas o Geiger chia: carcaça quente); 3) Fazer o abrigo aguentar a 1ª noite (barricar 2 janelas); 4) Achar o primeiro sobrevivente honesto (Dona Marlene, `npc_acampado`); 5) Desmascarar a 1ª mentira dos Saqueadores (prazo repetido) | Geiger, jipe, rádio, Caderno, noite, furtividade básica | Revelação do Ato I: o Caderno resolve as 3–4 transmissões do ato; os Saqueadores atacam o abrigo (cerco tutorial) |
| **II · As Vozes** (~3–4 h) | "Quem controla a informação?" | Floresta, Cidade Velha e Hospital entram por transmissões; escolha de lado em uma disputa (ex.: Hospital São Judas, onde os Filhos do Cinza "curam" com cogumelo brilho); montar a **antena** (melhoria de Escuta); primeiro Colosso como evento de mundo (anunciado por 3 transmissões contraditórias) | Facções, reputação, verificação por cruzamento, abrigo com defesas posicionadas | Uma facção passa a transmitir *contra você* (consequência das suas escolhas) |
| **III · O Inverno** (~3–4 h) | "O que vale a pena salvar?" | A **estação de cinza** (inverno nuclear) muda o clima: frio, poeira constante, plumas maiores. Torre de Rádio, Refinaria 9 e Pântano. O protagonista descobre a própria história (§7 Roteiro): era locutora da rádio AM local e *ela mesma* leu o aviso falso de "evacuação segura" no dia do clarão | Sobrevivência dura (frio novo), dose como relógio, jipe como base móvel | O sinal do Abrigo 7 é captado limpo pela 1ª vez |
| **IV · A Saída** (~2–3 h) | "Repetir a mentira ou dizer a verdade?" | Posto Militar 14 e a estrada norte; os diários de quem foi ao Abrigo 7; a verdade sobre o Abrigo 7 (Roteiro decide; proposta: é real, mas só aceita quem traz gente, por isso a transmissão exagera, porque precisa de números para manter os reatores) | Tudo | **Escolha final**: (a) retransmitir o sinal do Abrigo 7 como ele é (mais gente vai, alguns morrem na estrada pela promessa exagerada), ou (b) transmitir a verdade da sua torre (menos gente vai, mas vai sabendo). Nenhuma é "a certa". Cada uma tem epílogo com consequência mostrada, no estilo *Frostpunk*/*Papers, Please* |

**"A frase"** (proposta para o Roteiro testar): **"O Geiger não mente."** A protagonista a repete como mantra no Ato I e a questiona no Ato IV, ao perceber que a verdade também tem um custo.

### 3.4 Endgame e rejogabilidade

| Modo | Duração | Estrutura | Por que volta | Prior. | Esf. |
|---|---|---|---|---|---|
| **Rádio Livre** (pós-campanha) | Aberto | O mundo continua depois do final escolhido. A sua torre transmite, e as facções reagem ao final. Novas transmissões semanais por seed (`seed|semana`) | Ver a consequência do final; terminar o Caderno (100%) | P1 | M |
| **Travessia Diária** | 15–20 min | Roguelike curto: começa no jipe com carga sorteada, precisa atravessar 3 zonas até um destino; **uma tentativa por dia**, mesma seed para todos; pontuação = verdades descobertas + carga entregue − dose | Comparação social **real** (ranking validado por replay, §9 do HANDOFF); clipes; "como você morreu" | P1 | G |
| **Sobrevivência** (morte permanente) | Campanha | A mesma campanha com morte permanente e o **Legado** (§3.5) | Desafio e a história de quem caiu | P1 | P |
| **Novo Jogo+ "Cinza Funda"** | Campanha | O Caderno mantém as assinaturas das facções, mas as facções mudam de técnica (quem usava escassez passa a usar autoridade) | O conhecimento é testado de novo | P2 | M |
| **Rádio dos Vivos** (assíncrono) | — | Mensagens de outros jogadores na mesma seed: frases montadas com fragmentos ("Cuidado: [Colosso] [ao norte] [à noite]"), assinadas por chave Nostr e marcadas **com o número real** de quem confirmou ou negou | Prova social **verdadeira**; sentir-se acompanhado | P1 | M |

### 3.5 Morte e Legado (no estilo *Hades*/*Rogue Legacy*, honesto)

- Em **Sobrevivência**, a morte encerra o personagem, mas **o mundo da campanha continua**. O próximo sobrevivente (novo nome, nova aparência via `gerarHumano`) chega ao mesmo mapa. O corpo anterior fica onde caiu, com a mochila (60% dela) e o **último bilhete** gerado a partir das estatísticas reais ("Dia 9. A pluma virou para o leste. Eu devia ter ouvido."). O Caderno de Escuta é herdado: o conhecimento sobrevive.
- **Aposentar por dose (500):** a personagem não morre. Ela fica no abrigo como **NPC operadora de rádio** (verifica 1 transmissão por dia de graça), e você continua com outro sobrevivente. A dose é um relógio e também um legado.
- **Tela de morte** (`Telas.tsx` `Fim`): continua com peak-end e card, mas mostra também "o que você não ouviu" (ex.: "o Geiger marcava FORTE a 3 tiles à esquerda 12 s antes"). É aprendizado sem culpa, na linha do "this is how you died" do *Project Zomboid*. A distância ao abrigo passa a ser a real (D2).

---

## 4. Sistemas: o que muda em cada um

### 4.1 Combate — "o ritmo é da arma, a posição é sua"

| # | Mudança | Detalhe concreto | Arquivos | Prior. | Esf. |
|---|---|---|---|---|---|
| C1 | **Leitura de golpe** | Todo ataque inimigo tem *wind-up* visível e audível. Hoje `iniciarAtaque` dura 0,45 s com dano na metade. Passa a ter 0,35–0,6 s de preparação (pose + brilho no contorno + som "inspira") antes do dano. O Colosso tem 0,9 s e uma marca no chão | `ia.ts` `iniciarAtaque`, `atualizarSpr`, `sons.ts` | P0 | M |
| C2 | **Esquiva por deslize (uma mão)** | Arrastar o dedo ≥ 30 px em < 180 ms em qualquer ponto = rolamento de 2,2 tiles, com invulnerabilidade de 0,25 s e custo de 18 de fôlego. No manche, o mesmo deslize vale a partir do botão de ataque (hoje "arrastar = mira à mão"; a mira passa a ser só com o modo de precisão ligado) | `Controles.tsx`, `toque.ts`, `cena.ts` | P0 | M |
| C3 | **Contra perfeito** | Esquivar nos últimos 150 ms antes do dano = *hit-stop* de 120 ms + próximo golpe com +60% de dano e chance de decepar ×2. É a lição de Sekiro/Clair Obscur, viável com um polegar | `ia.ts` `ferir`, `efeitos.ts` | P0 | P |
| C4 | **Ataque automático com regra** | Continua o padrão (acessibilidade), mas mira **o alvo que você tocou por último**, ou então o mais próximo à frente, e não "360°" | `ia.ts` `atacarJogador`, `cena.mirarAuto` | P0 | P |
| C5 | **Armas com verbo, não só DPS** | taco: empurra 1,5 tile (afasta matilha); pé de cabra: atordoa 0,8 s + abre caixas trancadas; faca: abate furtivo instantâneo pelas costas; facão: decepa (já existe); machado: lento, quebra barricadas e escudos; pistola: ruído 20 (já existe), ou seja, cada tiro é uma decisão; escopeta: derruba; rifle: atravessa 2 alvos | `itens.ts` `ARMAS` (+campo `verbo`), `ia.ts` | P1 | M |
| C6 | **Arremessáveis** | Garrafa (vira distração de ruído 8 onde cai), molotov (fogo que se espalha em capim; irradiados *fogem* de fogo), lata (ruído 5) | `itens.ts`, `RECEITAS`, `cena.ts` `ruido` | P1 | M |
| C7 | **Membros com consequência** | Braço decepado → inimigo humano larga a arma (ranged vira corpo a corpo). Cabeça só com machado ou escopeta no contra perfeito | `ia.ts` `ferir`, `ehRanged` | P1 | P |
| C8 | **Durabilidade leve** | Arma corpo a corpo tem 3 estados (boa/gasta/quebrando), consertável com sucata. Sem micro-gestão: a mudança só aparece na troca de estado | `itens.ts`, `Bancada.tsx` | P2 | P |
| C9 | **Metas de balanço novas** (`npm run teste`) | 1 irradiado sem esquivar: 8–30% de vida (mantém); **com** esquiva correta: ≤ 5%. Grupo de 3 sem esquivar: 45–90%; com esquiva: ≤ 30%. *A habilidade precisa valer mais que o atributo* | `balanco.ts` `perdaEmLuta` + parâmetro `esquiva` | P0 | P |

### 4.2 Furtividade — "silêncio é uma arma"

| # | Mudança | Detalhe | Arquivos | Prior. | Esf. |
|---|---|---|---|---|---|
| F1 | **Anel de ruído legível** | Cada `ruido(x,y,r)` desenha por 0,4 s um anel tênue no chão com o raio real (opção de acessibilidade: sempre ligado). O jogador *vê* o custo do tiro e da porta | `cena.ts` `ruido`, `particulas.ts` | P0 | P |
| F2 | **Estados de percepção visíveis** | Acima do inimigo: nada (ocioso) → "?" âmbar (`investiga`) → "!" vermelho (`persegue`). Já existem os estados, falta mostrá-los | `ia.ts` `Ent.estado`, `atualizarSpr` | P0 | P |
| F3 | **Abate furtivo** | Faca ou facão pelas costas (cone de 120°) em alvo `ocioso`/`investiga` = abate silencioso (ruído 1); 2,5 s de animação vulnerável. Não funciona em Colosso | `ia.ts` `atacarJogador`, `itens.ts` | P1 | M |
| F4 | **Esconder-se** | Mato alto (`flora` capim/junco), neblina e dentro de carros: a percepção cai ×0,3 se estiver parado | `ia.ts` percepção, `zona.ts` | P1 | P |
| F5 | **Luz como faca de dois gumes** | Lanterna ligada: visão +; irradiados detectam a luz a 2× a distância (eles buscam calor e luz, §4.7). Holofote do abrigo vira isca | `cena.ts` lanterna, `ia.ts` | P0 | P |
| F6 | **Investigação real** | `investiga` vai até a origem do ruído, procura por 6 s em espiral e chama o grupo se achar rastro (sangue, porta aberta) | `ia.ts` `seguir` | P1 | M |

### 4.3 Sobrevivência e radiação

| # | Mudança | Detalhe | Arquivos | Prior. | Esf. |
|---|---|---|---|---|---|
| S1 | **Campo de radiação dinâmico** | §2.3: fontes + pluma com o vento + deposição por poeira e chuva; puro e testável (meta: a pluma da cratera desloca ≥ 6 tiles em 1 h de vento 0,85) | Novo `sistemas/radiacao.ts`, `zona.ts:98`, `clima.ts` (direção do vento) | P0 | M |
| S2 | **Dose acumulada × contaminação** | §2.3 (degraus 100/250/400/500). HUD: a dose aparece só quando muda de degrau; a contaminação segue como hoje | `cena.ts:409-413`, `salvar.ts` `Run.dose` | P0 | P |
| S3 | **Geiger direcional** | Legenda ◀▶ indica o lado de maior gradiente. Estéreo: os cliques puxam para esse lado | `audio.ts` `setGeiger`, `Hud.tsx` `SonsVisuais` | P0 | P |
| S4 | **Novo padrão "Jornada"** | Morte = desmaio (como no Calmo) + **dose +40** + perda de 40% da carga do *jipe* (não do baú). Sobrevivência = morte permanente + Legado. Calmo segue disponível | `acoes.ts` `desmaiar`/`executarMorte`, `progresso.ts` `DIF_NOMES` | P0 | P |
| S5 | **Recursos mais apertados no Normal** | Início com 2 águas, 2 bandagens, 1 enlatado (hoje 3/4/3); reservatórios com 3 usos (hoje 4) e **contaminados por pluma** quando o vento sopra da cratera (o Geiger avisa) | `store.ts` `estadoInicial`, `biomas.ts`, `acoes.ts` `beberFonte` | P1 | P |
| S6 | **Estação de cinza (Ato III)** | Frio: fogueira e abrigo passam a importar à noite; roupas (tecido) viram equipamento; a fome sobe ×1,25 no frio | `clima.ts`, `balanco.ts`, `itens.ts` | P1 | M |
| S7 | **Doença por radiação legível** | Moodles novos: náusea (vomita → −15 de sede), tontura (visão balança 2 px, desligável em `menosEfeitos`) | `Hud.tsx` moodles, `cena.ts` | P1 | P |

### 4.4 Abrigo — "o que você constrói de dia te salva à noite"

| # | Mudança | Detalhe | Arquivos | Prior. | Esf. |
|---|---|---|---|---|---|
| A1 | **Construção posicionada** | Grade em volta da casa (~24×24 tiles). Modo construir: toca na peça, toca no chão, gira com um botão. Peças: barricada de madeira (hp 120), cerca de arame (desacelera ×0,5), sino de latas (alarme sonoro que *você* ouve a 30 tiles), armadilha de pregos (12 de dano + sangramento), holofote (isca para irradiados, gasta bateria), barril aberto (isca radioativa, perigosa) | Novo `sistemas/construcao.ts`, `zona.ts` (sólidos dinâmicos), `Bancada.tsx` | P0 | G |
| A2 | **Cerco com caminho** | Invasores usam A* (`ROT.Path.AStar` já está em `ia.ts` `seguir`) contra os sólidos que você colocou; atacam a peça mais fraca do caminho. Aviso honesto: o rádio diz de onde vêm e quantos são **se** você verificou a fonte (Escuta); caso contrário diz "movimento ao norte" (como hoje) | `diretor.ts` `atualizarDiretor`, `ia.ts` | P0 | M |
| A3 | **Melhorias viram peças** | `MELHORIAS` (muralha %) dá lugar a peças concretas; a bancada, horta, tanque e cama ficam como estações com nível | `meta.ts` | P0 | M |
| A4 | **Antena (Escuta)** | Nova estação: nível 1 = triangular 1/dia; 2 = 2/dia e alcance da sonda; 3 = escuta as frequências das facções (revela o horário de transmissão) | `meta.ts`, Escuta | P0 | P |
| A5 | **Moradores** | Sobreviventes honestos salvos podem morar no abrigo (máx. 3): cada um tem uma função (Dona Marlene cuida da horta, Cabo Reis vigia à noite, Professora Lúcia verifica 1 transmissão por dia) e uma necessidade (comida diária). Eles são a razão emocional para defender o abrigo | `npcs.ts`, `ia.ts` `atualizarNpc` | P1 | G |

### 4.5 Jipe e viagem — "a estrada é a decisão"

| # | Mudança | Detalhe | Arquivos | Prior. | Esf. |
|---|---|---|---|---|---|
| J1 | **Rotas com escolha** | Entre dois locais, 2–3 estradas no mapa-múndi (curta e quente / longa e fria / pela cidade, com evento garantido). Combustível, horas e dose aparecem antes de confirmar | `locais.ts` (`ROTAS`), `rota.ts`, `Viagem.tsx`, `custoViagem` | P0 | M |
| J2 | **Eventos com seed e 3× mais conteúdo** | Sorte com `Rng` (D1); de 9 para ~30 eventos até o lançamento (ligados a facções e transmissões: a "Caravana destruída" pode ser a confirmação de uma transmissão); não repetir nos últimos 6 | `eventos.ts`, `acoes.ts` `viajar` | P0 | M |
| J3 | **Jipe como base móvel** | Condição (pneus, motor, bateria do jipe 0–100, visível), carga 4×3 (baú móvel), melhorias: guincho (atravessa a ponte caída), blindagem, farol de busca, rádio no jipe (verifica transmissões na estrada), tanque extra | `meta.ts`, `grade.ts`, `lib/viagem.ts` (visual das melhorias) | P1 | G |
| J4 | **Extração** | Dar partida = ruído 12 + 2–4 s (bateria baixa = mais tempo, sempre mostrado em %; **nunca** uma falha sorteada para criar drama falso) | `acoes.ts`, `cena.ts` | P0 | P |
| J5 | **Rádio na estrada** | Durante a viagem tocam fragmentos de transmissão (voz filtrada). É conteúdo narrativo sem custo de tela, e faz a viagem animada virar *escuta* | `Viagem.tsx`, `audio.ts` | P1 | M |

### 4.6 Progressão — "você melhora porque entende"

| # | Mudança | Detalhe | Arquivos | Prior. | Esf. |
|---|---|---|---|---|---|
| G1 | **Mapa sem portão de nível** | Remove `Local.nivel` e `bloqueioLocal` por nível. O acesso passa a ser diegético (§3.3). O teste de projeto vira "cada local tem ≥ 1 caminho de conhecimento + 1 requisito físico" | `locais.ts`, `objetivos.ts`, testes | P0 | M |
| G2 | **Ofícios com etiquetas** | Os 12 perks viram ~20 **ofícios** em 4 linhas (Escuta, Rua, Mato, Oficina) com **etiquetas** que combinam, sempre explícitas (sem sinergia escondida): ex. "Ouvido de locutora" (Geiger direcional mais preciso) + "Pé de pluma" (ruído −40%) + etiqueta `silêncio` → "ao abater furtivamente, o Geiger fica mudo por 5 s e você ouve passos a 2× a distância". Sinergias de 2 e 3 itens, no estilo Balatro, mostradas na tela de escolha | `meta.ts` `PERKS`, `progresso.ts` `opcoesPerk` | P1 | M |
| G3 | **XP vem de verbos de design** | Pesos: desmascarar transmissão 60, abate furtivo 12, descoberta 20, sobreviver ao cerco 40 + 8·dia, abate comum 2–8. Hoje o abate domina (`ARQS.xp`); passa a dominar a *escuta* | `progresso.ts` `ganharXp`, `criaturas.ts` | P0 | P |
| G4 | **Caderno como meta-progressão** | Assinaturas de facção, mapa das plumas e receitas descobertas por bilhete persistem entre personagens (Legado) | Novo `Caderno` em `store.ts` meta | P0 | M |
| G5 | **Conquistas com história** | Das 24 conquistas-contador, metade vira conquista de situação ("Não confiei: desmascarei 3 mentiras antes de viajar", "Ouvi o Colosso antes de vê-lo") | `meta.ts` `CONQUISTAS` | P1 | P |

### 4.7 IA — criaturas, facções e diretor

| # | Mudança | Detalhe | Arquivos | Prior. | Esf. |
|---|---|---|---|---|---|
| I1 | **Irradiados não são zumbis** | Família nova `ia: 'irradiado'`: por padrão **pastam** nos pontos quentes (ficam parados, balançando, brilhando no escuro), migram com a pluma e são atraídos por calor (fogueira), luz (lanterna, holofote) e ruído alto. Só caçam quando provocados ou quando a sua dose está alta (você "brilha" para eles: dose ≥ 250 dobra a percepção, uma consequência honesta da escolha de dose). Som: respiração chiada + "Geiger biológico" (cliques que saem do corpo) | `ia.ts` (família nova), `criaturas.ts`, `sons.ts` | P0 | M |
| I2 | **Gangues humanas com moral** | Ao levar 50% de dano, membro de gangue pode **se render** (larga a arma, mãos para cima): poupar (reputação +, ele vira fonte de informação verdadeira 1×), roubar ou matar (reputação −, a facção transmite contra você). Usam cobertura (props sólidos a ≤ 3 tiles) e flanqueiam em dupla | `ia.ts` ranged/melee_humano, `criaturas.ts` | P1 | G |
| I3 | **Reputação por facção** | −100..+100 por facção, o que muda transmissões (a facção hostil mente mais sobre você), preços do mascate e cercos. Substitui `Run.traiu` | `salvar.ts`, `npcs.ts`, `contratos.ts` | P0 | M |
| I4 | **Camada estratégica leve** | Entre expedições, cada facção "joga" 1 movimento por dia (seed): toma um local, transmite, ataca alguém. O mapa-múndi mostra cores de controle | Novo `sistemas/faccoes.ts` (puro) | P1 | M |
| I5 | **Colosso como evento de mundo** | Anunciado por transmissões contraditórias (uma diz "ao norte", outra "na refinaria"; o Geiger e o tremor no chão desempatam); fases (a 50% de vida derruba paredes); morto, deixa uma fonte quente permanente no mapa | `ia.ts` `colosso`, `diretor.ts` | P1 | M |
| I6 | **Diretor narrativo honesto** | O `spawn.ts` atual mantém a tensão (manter `TENSAO_LIMITE`). Acrescenta: nunca dois picos seguidos sem alívio de ≥ 40 s; pós-cerco = 1 dia sem invasão. Tudo documentado no Caderno de Escuta (uma página "Como o mundo decide", que expõe o próprio diretor ao jogador: transparência como marca) | `spawn.ts`, `diretor.ts` | P1 | P |
| I7 | **NPCs com memória** | Cada NPC nomeado (`NOMES` em `npcs.ts`) lembra 3 fatos (te ajudou, você ajudou, o que você contou) e tem uma missão pessoal de 2–3 passos. 8 NPCs com arco até o lançamento | `npcs.ts`, `PaineisNpc.tsx` | P1 | G |

### 4.8 Multiplayer P2P coop

| # | Mudança | Detalhe | Prior. | Esf. |
|---|---|---|---|---|
| M1 | **Rádio dos Vivos (assíncrono)** | Via Nostr (o Trystero já usa relays Nostr, §8 do HANDOFF). Mensagens **só por fragmentos** (sem texto livre: elimina moderação e toxicidade; modelo *Dark Souls*), assinadas com `@noble/secp256k1`, por seed. Contador **real** de "confirmaram/negaram". Corpos de outros jogadores na Travessia Diária com a causa da morte | P1 | M |
| M2 | **Presença real** | "2 sobreviventes nesta seed agora" só quando é verdade (prova social real, §4 do HANDOFF) | P1 | P |
| M3 | **Duo síncrono (2 jogadores)** | Host eleito pelo menor peerId (§8). Papéis complementares, sem obrigar: quem fica no jipe e no rádio vê as transmissões verificadas e a pluma em tempo real (a "escuta" dele vira informação para o batedor); o batedor anda na zona. Os papéis podem ser trocados. Uma mão continua valendo | P2 | G |
| M4 | **Riscos técnicos** | WebRTC sem TURN falha em parte das redes móveis (CGNAT de operadora). A Produção precisa decidir sobre um TURN (custo) antes de prometer o duo. Testar em 4G/5G real das operadoras brasileiras | P1 (decisão) | — |

### 4.9 Economia e NPCs

- **Fichas** (`balanco.ts` `VALOR`, compra ×1,35 / venda ×0,55): mantêm-se. A **informação** passa a ser mercadoria: o mascate vende "dicas" que são transmissões já verificadas por ele, e às vezes ele mesmo erra, sem má-fé. (P1, P)
- **Contratos** (`contratos.ts`): os 6 tipos genéricos viram "pedidos" de NPCs nomeados, com motivo ("Seu Odair precisa de 2 antirrad para a neta"). O tipo `trazer` ganha entrega *no local do NPC*, o que leva a expedição a outro lugar. (P1, M)
- **Sem monetização no lançamento.** Se um dia houver, só cosméticos com preço único e honesto (§4 do HANDOFF). Isso deve constar do material de imprensa: "sem anúncios, sem loja, sem energia". Para este jogo, é argumento de crítica.

### 4.10 O que **não** fazer (proteção de escopo)

- Não fazer mundo aberto contínuo: manter as 11 zonas e aprofundá-las.
- Não fazer PvP: contradiz o pilar 2 e exige anti-trapaça pesado.
- Não expandir a árvore de crafting além de ~35 receitas: o crafting é meio, não fim.
- Não fazer pilotagem do jipe em tempo real: decisão sim, direção não (evita competir com *Pacific Drive*).
- Não fazer texto livre entre jogadores: só fragmentos.
- Não usar notificação push por padrão; se houver, só opcional e factual ("a horta está pronta"), nunca "seus amigos estão jogando".

### 4.11 Backlog consolidado por prioridade

**P0 (até a fatia vertical, ~fev/2027):** D1–D6 · Escuta + Caderno (transmissões, 3 instrumentos, Revelação por ato) **G** · S1 campo de radiação **M** · S2 dose **P** · S3 Geiger direcional **P** · S4 padrão Jornada **P** · C1 leitura de golpe **M** · C2 esquiva **M** · C3 contra **P** · C4 alvo do auto **P** · C9 metas **P** · F1 anel de ruído **P** · F2 estados visíveis **P** · F5 luz/isca **P** · I1 irradiados novos **M** · I3 reputação **M** · A1 construção **G** · A2 cerco com caminho **M** · A3 peças **M** · A4 antena **P** · J1 rotas **M** · J2 eventos com seed **M** · J4 extração **P** · G1 mapa sem nível **M** · G3 XP de escuta **P** · G4 Caderno meta **M** · Ato I reescrito + abertura (§5) **M** · ponto de parada **P**.

**P1 (até o lançamento 1.0, ~ago/2027):** Atos II–IV · C5–C7 · F3, F4, F6 · S5–S7 · A5 moradores · J3 jipe base · J5 rádio na estrada · G2 ofícios · G5 conquistas · I2, I4–I7 · M1, M2, M4 · Travessia Diária · Rádio Livre · Sobrevivência + Legado.

**P2 (até out/2027):** C8 · M3 duo síncrono · Novo Jogo+ · mais eventos e NPCs.

---

## 5. Onboarding, os primeiros 10 minutos e o momento de clipe

**O que o jurado vê hoje:** 3 telas de texto (`PASSOS_INTRO`) → abrigo → "Colete 6 de madeira". É o pior gancho possível para um júri que vai jogar 10 minutos de 100 jogos.

**Princípio:** em 10 minutos, o jogador precisa ter **ouvido** o perigo invisível, **sido enganado** por uma voz, **desmascarado** a mentira com um instrumento honesto, **sobrevivido** a uma noite e **tomado** uma decisão de estrada. Tudo isso com um polegar e sem tutorial em texto (no máximo 1 linha de dica por vez, no estilo atual do `Hud.tsx` `s.dica`).

| Min. | Momento | O que aprende | Sistema |
|---|---|---|---|
| 0:00 | Tela preta. **Só som**: rádio AM chiando, uma voz de locutora (a protagonista, gravada antes do clarão) lendo "evacuação segura pelo norte". Clarão branco (vira escurecimento lento com `menosEfeitos`) | Tom, protagonista, tema da voz que mente | `audio.ts`, `efeitos.ts` |
| 0:30 | Anos depois. Jipe na estrada ao entardecer, **em movimento** (cena de `lib/viagem.ts`). O rádio do jipe pega uma transmissão: "Posto Km 40 está limpo. Combustível à vontade." O motor engasga | A viagem é a casa; o rádio é a fonte de informação | `Viagem.tsx`, J5 |
| 1:15 | O jipe para perto do Posto Km 40. Primeiro toque no chão = andar. O **Geiger começa a clicar**; a legenda visual mostra "Geiger fraco ◀". Uma linha: "Siga o som para longe." | Ouvir o invisível; uma mão | S1, S3 |
| 2:30 | Na bomba de combustível, o Geiger vai a FORTE: há uma carcaça de caminhão quente ao lado. **Primeira ficha do Caderno**: "Disseram: posto limpo. Verdade: combustível sim, radiação alta. Técnica: meia verdade." | O Caderno; a voz mentiu, o instrumento não | Escuta, Caderno |
| 3:30 | Drenar a bomba (ação com tempo + **ruído visível**, F1). Três irradiados que pastavam na carcaça **viram a cabeça** ("?" âmbar). Vêm devagar, atraídos pelo barulho | Ruído tem custo; irradiados não são zumbis | F1, F2, I1 |
| 4:30 | Primeiro golpe telegrafado; dica "deslize para esquivar". A esquiva no tempo certo dispara o **contra** com hit-stop e decepa a perna: o irradiado rasteja | Combate de leitura; desmembramento | C1–C3 |
| 5:30 | **Extração**: dar partida no jipe (bateria 34%: 3 s de partida, visível). Mais dois chegando. O jipe pega | Tensão honesta | J4 |
| 6:30 | Estrada com **escolha de rota**: "Pela ponte (1 h, fria)" × "Pelo atalho da cratera (30 min, quente)". Escolha real com números | A estrada é a decisão | J1 |
| 7:30 | Chegada ao abrigo ao anoitecer. O rádio do abrigo transmite: "Saqueadores: suprimentos médicos no Km 40 até o amanhecer." O jogador já esteve lá e sabe que não havia remédio. Tocar "Não confio" registra a 2ª ficha | Verificar por conhecimento próprio | Escuta |
| 8:30 | Pôr 2 barricadas nas janelas (modo construir, 2 toques cada), acender a fogueira | Construção posicionada | A1 |
| 9:30 | Noite. Sino de latas toca ao norte. **Ponto de parada honesto**: "Primeira noite. Jogo salvo. Bom lugar para parar, ou durma e veja o amanhecer." | O jogo respeita o seu tempo | Ponto de parada |

**Métricas da abertura (§6):** ≥ 90% chegam ao minuto 3 (a primeira ficha); ≥ 75% usam a esquiva pelo menos uma vez até o minuto 6; tempo até o primeiro toque com efeito ≤ 8 s depois do carregamento.

### O momento de clipe (o que vira vídeo vertical de 15–30 s)

1. **"Escuro total"** (principal): noite, lanterna desligada para não atrair. Tela quase preta; só os cliques do Geiger e passos pesados; a legenda mostra "◀ passos pesados". Um relâmpago (`clima.ts` raios) revela por 200 ms o **Colosso a dois tiles**. Funciona no mudo graças às legendas visuais, o que é essencial para o feed do TikTok e Reels, que toca sem som. O formato vertical já é o nativo do jogo.
2. **"Carimbo FALSO"**: a ficha do Caderno vira com som de carimbo, e o card de compartilhar mostra "A Milícia me disse: 'ordem do governo'. Era mentira. Eu descobri assim: …". É um card nativo de Stories (`components/cartao.ts` já existe), compartilhável e educativo, o que alimenta Games for Impact.
3. **"A pluma"**: ventania com uma frente de poeira verde atravessando a tela da direita para a esquerda. O Geiger vai de fraco a FORTE em 4 s, e a personagem corre para dentro de um carro e bate a porta.
4. **"Rendição"**: o saqueador larga a arma e implora; o jogador decide em 3 s.

**Ferramenta de suporte (P1, P):** botão "gravar últimos 20 s" (buffer de quadros do canvas via `MediaRecorder` + áudio) que exporta em 9:16. A estrela-guia é o clipe sair do próprio jogo, sem gravador de tela.

---

## 6. Métricas e gates de qualidade (verificáveis e honestos)

### 6.1 Como medir sem violar as regras

- **Telemetria opcional** (desligada por padrão; tela de consentimento clara), **anônima** (id aleatório local), com uma tela **"O que medimos"** listando cada evento enviado. Coerente com o pilar 2, a própria transparência vira marca.
- **Nunca** otimizar métrica com técnica proibida: sem streak punitivo, sem notificação de reengajamento, sem recompensa por login. Se a D7 não bater, o problema é o jogo, e não a falta de gatilho.
- Eventos mínimos: `abertura_marco(n)`, `expedicao_inicio/fim(duracao, motivo_fim)`, `morte(causa, justa?)`, `transmissao_resolvida(verificou_antes?)`, `ato_fim(n)`, `parou_no_ponto_de_parada(bool)`, `sessao(duracao)`.
- **Playtests** com desconhecidos (não amigos do Uwlo): gravação de tela + questionário curto no celular (formulário Tally ou equivalente; a decisão é da Produção). Coorte mínima por gate: n ≥ 20 (fatia vertical), n ≥ 60 (beta), n ≥ 150 (demo pública).
- **Teste de "a frase"**: 24 h depois de jogar, pergunta aberta "Do que você lembra?". A taxa de citação espontânea do Geiger ou de "o rádio mente" é a métrica de identidade.

### 6.2 Gates

| Gate | Data-alvo | Critério (todos obrigatórios) |
|---|---|---|
| **G0 · Protótipo da Escuta** | 20/dez/2026 | 5 transmissões com alegações; Caderno funcional; 5 testadores desconhecidos: ≥ 4 de 5 entendem sem explicação que "o rádio pode mentir e o Geiger não"; ≥ 3 de 5 dizem que é "diferente de outros survivals" |
| **G1 · Fatia vertical (Ato I)** | 28/fev/2027 | n ≥ 20 desconhecidos em celular próprio: ≥ 90% passam do minuto 3; ≥ 65% terminam o Ato I (~1,5 h); sessão mediana 8–14 min; ≥ 70% param num ponto de parada (e não no meio da expedição); mortes julgadas injustas ≤ 15%; nota "recomendaria" ≥ 7,5/10; 60 fps no Motorola Edge 70 e ≥ 30 fps num Android de entrada (classe Moto G); toque → som < 50 ms |
| **G2 · Beta (Atos I–II + cerco)** | 31/mai/2027 | n ≥ 60: D1 ≥ 40%, D7 ≥ 15% na coorte (sem nenhum gatilho de retorno); ≥ 50% chegam ao fim do Ato II; nota média ≥ 8,0; injustas ≤ 10%; "a frase" lembrada espontaneamente por ≥ 40%; 0 travamentos em 10 h de teste em aparelho real |
| **G3 · Demo pública / pré-imprensa** | jul/2027 | n ≥ 150: nota ≥ 8,5/10 (proxy de Metacritic ≥ 88); ≥ 30% compartilham ao menos 1 card ou clipe *sem pedido*; 3 jornalistas ou criadores externos jogaram e escreveram (prévia) |
| **G4 · Lançamento 1.0** | ago–set/2027 | Campanha completa com dois finais; Travessia Diária com ranking validado por replay; pacote de acessibilidade completo (alto contraste, remapeamento, leitor de tela nos painéis, conforme as pendências do §23); 0 bugs bloqueadores conhecidos; smoke + testes de projeto verdes |
| **G5 · Conversa pública** | set–nov/2027 | ≥ 20 análises de veículos indexadas (para entrar no Metacritic e OpenCritic); média ≥ 85; pelo menos 1 indicação ou seleção em festival (BIG, gamescom latam, IGF) |

**Testes de projeto novos** (`npm run teste`, na linha dos atuais): pluma desloca com o vento; toda transmissão tem ≥ 1 alegação verificável por ≥ 1 instrumento acessível naquele ato; a esquiva correta reduz a perda em luta ≥ 3×; nenhum local inalcançável sem caminho de conhecimento; eventos determinísticos pela seed (mesma seed + mesmas escolhas = mesmo resultado); a extração nunca falha por sorteio.

---

## 7. Dependências com as outras áreas

### Direção de Arte
- **Gramática visual da verdade × mentira:** estilo próprio para Transmissão (fita de papel térmico, antena, VT323 riscada), distinto do HUD; carimbos VERIFICADO / FALSO / MEIA-VERDADE para o Caderno; card 9:16 do Caderno.
- **Irradiados novos:** pose de "pastar" (parado e balançando), brilho que pulsa no ritmo do Geiger biológico, silhueta que **não** lembra zumbi (postura ereta e lenta, pele cristalizada, sem braços estendidos). Rendição dos humanos (mãos para cima, arma no chão).
- **Telegrafia de golpe:** pose de preparação + contorno brilhante por arquétipo; marca no chão do Colosso.
- **Pluma de radiação:** partícula de poeira verde levada pelo vento (via `particulas.ts`), legível sem ser um overlay.
- **Peças de construção** (barricada, arame, sino, pregos, holofote, antena) em 4 orientações e 3 estados de dano; **melhorias do jipe** visíveis na cena de viagem e na zona.
- **Identidade brasileira:** placas, orelhões, Kombis, bancas, igrejas, postos com bandeiras reais genéricas (sem marca registrada).
- **Leitura em tela estreita** (360 px): os estados "?" e "!" e o anel de ruído precisam funcionar em Ultra e Leve.

### Roteiro
- **Protagonista com arco**: proposta de uma ex-locutora da rádio AM local que leu o aviso falso de evacuação no dia do clarão. O arco vai da culpa e da desconfiança total à escolha consciente sobre o que transmitir. Voz em logs de rádio (texto + legenda).
- **"A frase"** e 2–3 variações (Ato I mantra, Ato IV questionamento).
- **~40 transmissões** com alegações (verdade e técnica definidas), **~30 eventos de estrada** ligados a facções, **8 NPCs com arco** de 2–3 passos, **~40 bilhetes** (de 16), **2 finais** com epílogos.
- **Bíblia das facções:** interesse, técnica de manipulação, assinatura de transmissão (horário, chiado, bordão) e o que cada uma faz quando você a desmascara.
- **Sensibilidade:** o Brasil tem história radiológica real (Césio-137 em Goiânia, 1987). Se for referenciada, que seja com respeito, consultoria e sem usar vítimas reais como espetáculo. A decisão é do Uwlo.
- **Fragmentos do Rádio dos Vivos** (~120 palavras combináveis, sem texto livre).

### Áudio
- **Geiger direcional** (pan pelo gradiente) e "Geiger biológico" dos irradiados, timbre distinto do instrumento.
- **Vozes de transmissão** por facção (filtro, chiado e bordão próprios), com legenda sempre.
- **Trilha adaptativa de verdade** (a maior lacuna, conforme §23): camadas por estado (exploração / tensão / combate / cerco / estrada / abrigo seguro), transições na batida, e um **tema melódico da protagonista** que reaparece na rádio AM. O pilar 1 exige que a música **recue** quando o Geiger importa (ducking já existe em `audio.ts`).
- **Som de telegrafia** por arquétipo ("inspira" antes do golpe) e o som do contra perfeito.
- **Sino de latas** e partida do jipe como sons de alto valor informativo.
- Lista de legendas novas para `LEGENDA` em `Hud.tsx` (cada som novo nasce com legenda).

### Produção
- **Cronograma e gates** (§6, §8), com recrutamento de playtesters desconhecidos (n por gate) e celulares reais (Motorola Edge 70 + um Android de entrada).
- **Distribuição para existir na crítica:** a web/PWA não aparece sozinha no Metacritic. É preciso decidir: página no itch.io, Android (TWA na Play Store) e/ou Steam (wrapper) com data de lançamento clara, porque o Metacritic e o OpenCritic precisam de plataforma e data. Prazo da decisão: G1.
- **Infra:** relays Nostr (públicos ou próprios), **servidor TURN** (custo) para o duo, backend do ranking (Supabase ou Turso, conforme §9 do HANDOFF) para a Travessia Diária, com validação por replay.
- **Calendário de festivais e imprensa:** BIG Festival e gamescom latam 2027 (inscrições normalmente no começo do ano; confirmar datas), SXSW, IGF 2028 (inscrição ~set/2027), além de imprensa brasileira e internacional especializada em mobile e acessibilidade. Kit de imprensa com os clipes de §5.
- **Decisões do Uwlo** (§2.5: D-A a D-D) e as licenças de qualquer módulo novo em `CREDITS.md` (ex.: `@noble/secp256k1`, `trystero`, uma eventual biblioteca de áudio adaptativo).
- **Localização:** inglês e espanhol no 1.0 (júri internacional), mantendo o português como identidade.

---

## 8. Cronograma por marcos (design)

| Período | Marco | Entregas de design |
|---|---|---|
| nov–dez/2026 | **Pré-produção + G0** | Correções D1–D6; protótipo da Escuta e do Caderno com 5 transmissões; campo de radiação; irradiados novos; documento das facções (com Roteiro) |
| jan–fev/2027 | **G1: Fatia vertical (Ato I)** | Abertura de 10 min; combate C1–C4; construção A1–A4; rotas J1, J2, J4; padrão Jornada; ponto de parada; 1º playtest externo |
| mar–mai/2027 | **G2: Beta (Atos I–II)** | Reputação; facções; NPCs com memória (4); trilha adaptativa v1; Rádio dos Vivos v1; segundo playtest |
| jun–jul/2027 | **G3: Demo pública** | Atos III–IV em rascunho jogável; Travessia Diária beta; ofícios; clipes e kit de imprensa |
| ago–set/2027 | **G4: Lançamento 1.0** | Campanha completa; dois finais; Rádio Livre; acessibilidade completa; localização |
| out–nov/2027 | **G5: Conversa** | Patches por feedback; eventos sazonais de seed (honestos); duo síncrono se a infra permitir |

O lançamento até setembro é **inegociável** se a meta é o TGA. Os jurados formam as listas ao longo do ano, e um jogo lançado em novembro não é jogado a tempo.

---

## 9. Riscos de design e mitigação

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| A Escuta vira "puzzle de planilha" e quebra o ritmo | Média | Alto | G0 testa isso primeiro. Verificar nunca leva mais de 2 toques. O Caderno preenche sozinho o que você observou. Ignorar transmissões é jogável (só mais arriscado) |
| Jogadores se sentem enganados pelo jogo (e não pelos personagens) | Média | Alto | Gramática visual separada; a interface nunca mente; Revelação por ato; pergunta explícita no playtest: "o jogo foi justo com você?" (≥ 85% sim) |
| Combate com esquiva fica difícil demais em uma mão | Média | Médio | Janela de esquiva ajustável na acessibilidade (0,25 → 0,45 s); o Calmo dispensa o contra |
| Escopo (construção, facções, P2P) estoura um time de 1 | Alta | Alto | P0 enxuto; §4.10; o duo síncrono fica em P2 de propósito; tudo em dados, para o conteúdo crescer sem código |
| Web game não ser levado a sério pela crítica | Alta | Alto | Distribuição em lojas (Produção), demo forte, acessibilidade e impacto como porta de entrada, imprensa brasileira primeiro |
| Desempenho em Android de entrada com a simulação de pluma | Média | Médio | Grade de 2 Hz, 96×96, pura; teste de projeto de orçamento (≤ 1 ms por passo) |
