# CINZAS: plano de produção e publicação rumo ao The Game Awards

**Autor:** produção executiva / publishing (agente) · **Data:** 4/nov/2026 · **Horizonte:** nov/2026 → dez/2027
**Base:** `CLAUDE.md`, `HANDOFF.md` (§1–3, 9, 14, 15, 20, 22, 23), `README.md`, `CREDITS.md`, `.github/workflows/ci.yml`, `git log`, e pesquisa web feita em 4/nov/2026 (fontes no fim e ao longo do texto).

> **Resumo em 6 linhas**
> 1. O alvo possível é o **TGA 2027**. O de 2026 não dá: o corte é 20/nov/2026 e a cerimônia é em 10/dez/2026.
> 2. A porta de entrada realista é **Best Debut Indie / Best Independent Game / Best Mobile**. O Balatro, de um dev só, ganhou as três em 2024. GOTY é uma aposta de cauda longa.
> 3. Lançamento **1.0 em 30/set/2027** (Steam + Google Play + web), com **demo web grátis** desde março. Modelo **premium honesto** (~US$ 9,99), sem anúncios, sem loot box e sem moeda.
> 4. Marcos externos reais: **BIG Festival** (inscrição até 15/jan/2027, grátis), **Tribeca Games** (até 4/mar/2027), **Steam Next Fest de junho** (registro até 25/abr/2027), **gamescom** (pela Indie Arena Booth ou pelo pavilhão Brazil Games).
> 5. Com orçamento zero dá para chegar a festival. Para disputar o TGA são precisos **pelo menos uns R$ 50 mil** (trilha original, arte-chave, trailer, aparelhos de teste, inglês). O cenário de **R$ 500 mil**, ou um publisher, é o que torna a indicação plausível.
> 6. Há **um go/no-go duro em 28/jun/2027**, depois do Next Fest. Se os números não vierem, o alvo muda para o TGA 2028 sem drama.

---

## 1. Diagnóstico honesto de produção

### 1.1 O que existe de fato
| Item | Estado | Leitura de produção |
|---|---|---|
| Idade do projeto | 1º commit em **31/out/2026**, 27 commits | O jogo tem **5 dias**. Isso é velocidade impressionante, mas zero maturação. Clair Obscur levou anos; o Balatro, ~2 anos. |
| Loop | Completo: base → jipe → viagem → saque/combate → volta. Campanha de 24 passos em 4 atos, 3 dificuldades | Bom esqueleto de "jogo inteiro". Falta prova de que é **divertido para estranhos**. |
| Qualidade técnica | 51 testes de lógica, 140 verificações de smoke, CI no GitHub Actions, PWA offline | Acima da média de indie nessa fase. Mas tudo roda em Chrome headless com GL por software. |
| Validação humana | **Nenhuma.** Nunca rodou em celular real nem passou por jogador externo (§22, §23) | **É o maior risco isolado.** Desempenho, toque, áudio e legibilidade são hipóteses. |
| Arte | 100% procedural por código (`game/lib/`), voxel → sprite isométrico | É um diferencial ("arte que é código") e **não é IA generativa**, o que importa (§6). Falta uma direção de arte assinada e uma arte-chave para loja. |
| Áudio | ZzFX + drone procedural, equalizado | Funcional. Ainda **não é trilha**: a §23 aponta a trilha adaptativa como a maior lacuna. |
| Narrativa | 16 bilhetes, rádio, Abrigo 7, nome provisório | Não há personagem-âncora nem um final marcante (onda 2 da §23). Precisa de autoria humana (§6). |
| Multiplayer/backend | Planejados (§8, §9), não feitos | **Cortar da 1.0** (decisão D3). |
| Marca/presença | Nenhuma: sem nome final, página, trailer, imprensa ou comunidade | Começa do zero absoluto, e isso custa 9–12 meses de construção. |

### 1.2 Capacidade da equipe
- **1 pessoa (Uwlo), só no celular**, mais agentes de IA. É fortíssima para gerar código e testes e fraca em três frentes:
  1. **Gosto e validação.** Ninguém joga além dele.
  2. **Plataformas de PC.** Ele não roda o cliente Steam nem testa uma build Tauri ou Electron. Dá para produzir builds na CI, mas alguém precisa testá-las numa máquina real.
  3. **Presença física.** Festivais, encontros com publisher e gravação de trailer.
- **Fator ônibus = 1.** Se o Uwlo para, o projeto para.
- **Agenda de publishing.** Imprensa, criadores, comunidade, lojas, festivais e fomento são **um emprego inteiro por si só** (estimo de 15 a 25 h/semana a partir de mar/2027). Isso compete com o desenvolvimento.

### 1.3 O que é inviável sem pessoas ou dinheiro
| Necessidade para "nível TGA" | Sem dinheiro? | Por quê |
|---|---|---|
| Trilha original adaptativa e mixagem profissional | ❌ | Todo vencedor recente tem identidade sonora forte. A música procedural atual não compete. |
| Direção de arte assinada + arte-chave e cápsulas de loja | ⚠️ parcial | O código gera o mundo. A cápsula do Steam e o pôster pedem mão humana. |
| Texto e narrativa de autoria humana revisados | ⚠️ | A política de IA exige isso (§6), e a crítica pune texto genérico. |
| QA em 10+ aparelhos reais (Android fraco, iPhone, PC) | ❌ | Um celular só não representa o público. |
| Localização EN (e idealmente ES, FR, DE, JA) | ❌ | Mais de 90% do júri do TGA não lê português. **Inglês é obrigatório.** |
| Trailer profissional | ⚠️ | Dá para fazer no celular. Um trailer bom é o que abre a porta de Day of the Devs, IGN e afins. |
| PR internacional para 100+ veículos | ⚠️ | Dá para fazer à mão, devagar. Uma agência ou freelancer multiplica o alcance. |
| Portes de console (Switch/PS/Xbox) | ❌ | Exigem kits, NDA e certificação. Ficam para depois, via publisher ou QUByte. |
| Multiplayer P2P + backend na 1.0 | ❌ (escopo) | Dobram o risco, e o ECA Digital impõe obrigações a chat com menores (§3.6). Ficam para depois da 1.0. |

**Conclusão do diagnóstico:** o CINZAS pode virar **um jogo indie brasileiro muito bom** em 11 meses. Virar **candidato a TGA** depende de três coisas que hoje não existem: (a) prova de diversão com jogadores reais, (b) pelo menos uns R$ 50 mil ou um publisher, e (c) uma identidade autoral (nome, mundo brasileiro, trilha, final).

---

## 2. Cronograma mês a mês (nov/2026 → dez/2027)

**Legenda:** 🎯 marco interno · 📅 prazo externo real (com fonte) · 🔶 estimativa por padrão de anos anteriores (confirmar) · 🚦 ponto de decisão (detalhe na §6)

**Prazos externos verificados em 4/nov/2026**
| Evento | Data | Condição | Fonte |
|---|---|---|---|
| TGA 2026 | corte 20/nov/2026 · show 10/dez/2026 | Inviável | thegameawards.com/faq · gamingbolt |
| BAFTA Games Awards 2027 | inscrição até 6/nov/2026 (lançados de 1/ago a 19/nov/2026), £475+VAT | **Não entrar**: jogo imaturo, taxa alta | bafta.org |
| IGF 2027 | prazo encerrado em 13/set/2026 · prêmios em 3/mar/2027 | Perdido. Alvo passa a ser o IGF 2028 | igf.com |
| Tribeca Games 2027 | oficial 2/dez/2026 (US$ 60) · **estendido 4/mar/2027 (US$ 80)** · festival de 3 a 12/jun/2027 · **só não lançados** | **Alvo: 4/mar** | tribecafilm.com |
| Steam Next Fest | fev/2027 (registro até 10/jan) · **jun/2027: 14–21/jun, registro até 25/abr** · out/2027 (datas a definir). **Só uma participação por jogo** | **Alvo: junho** | partner.steamgames.com |
| BIG Festival / gamescom latam 2027 | **inscrição grátis até 15/jan/2027, 21h59 EST** (23h59 de Brasília) · evento de 22 a 25/abr/2027, Distrito Anhembi (SP) | **Alvo** | gamespress |
| Indie Arena Booth (gamescom 2027) | 🔶 abre em meados de março e fecha por volta de meados de abril (em 2026 fechou em 13/abr). Estande de €3–5 mil (preço de 2025) | Alvo, ou ir pelo pavilhão Brazil Games | indiearenabooth.de · gamesmarket |
| Day of the Devs (SGF 2027) | 🔶 prazo por volta de abril (em 2025 foi 11/abr) | Alvo | dayofthedevs.com |
| Day of the Devs: TGA Digital Showcase 2027 | 🔶 fim de setembro (em 2026 foi de 21 a 28/set) | Alvo, colado no lançamento | gamingtrend |
| Games for Change Awards 2027 | 🔶 começo de fevereiro (em 2026 o prazo foi até 16/fev) | Opcional (ângulo de impacto) | g4cawards.secure-platform.com |
| IndieCade | Festival em jan/2027 (prazos de 2026 já passaram) | Fora do alvo | form.jotform.com/260583855743063 |
| IGF 2028 | 🔶 inscrição de meados de agosto a meados de setembro/2027, taxa de US$ 75 (há isenção) | Alvo pós-lançamento | igf.com |
| BAFTA 2028 | 🔶 inscrições a partir de agosto/2027; 2º prazo no começo de novembro/2027 | Alvo pós-lançamento | bafta.org (padrão de 2027) |
| SXSW Gaming Awards | **Descontinuado em 2023** | Ignorar | wikipedia |
| Apple Design Awards | Não há inscrição: a Apple escolhe entre apps da App Store (finalistas de 2026 saíram em 18/mai) | Só se houver app iOS no ar antes de 2028 | macrumors |
| Google Play Indie Games Fund LatAm | US$ 2 mi para cerca de 10 estúdios; edição de 2025 fechou em 31/jul/2025 (estúdio na América Latina, até 50 funcionários) | 🔶 vigiar jun–jul/2027 | android-developers.googleblog |
| TGA 2027 | 🔶 corte por volta de **19/nov/2027** (padrão: sexta de meados de novembro) · show no começo/meio de dezembro | **Objetivo** | thegameawards.com/faq (padrão) |

### Novembro 2026: "a verdade do celular"
- 🎯 **Primeiro teste em aparelho real** (Motorola Edge 70 Fusion Plus do Uwlo). Medir fps, aquecimento, latência de toque e áudio.
- 🎯 Teste de corredor com 5 pessoas próximas, em celulares delas e com aparelhos variados. Cinco usuários já revelam a maior parte dos problemas de usabilidade (Nielsen).
- 🎯 Congelar escopo da 1.0 (D3): **sem P2P, sem backend, sem contas**. Cloud save fica opcional e só depois.
- 🎯 Lista curta de nomes + busca no INPI, no Steam e na App Store (D1). "CINZAS" conversa com a Quarta-feira de Cinzas, o que é ótimo para o Brasil. Em inglês, "Ashes" é saturado.
- 📅 **Não** entrar no BAFTA 2027 (6/nov) nem tentar o TGA 2026 (20/nov).
- Gravar 15 s de gameplay por dia (vira banco de devlog).

### Dezembro 2026: vertical slice
- 🎯 **Vertical slice até 20/dez:** Ato 1 completo em qualidade final, com 20–30 min de jogo. Inclui direção de arte fechada, onboarding, trilha v0 e ao menos 1 "momento de clipe" (Colosso / viagem de jipe / morte com card).
- 🎯 Nome final + logo. Pedido de marca no INPI.
- 🎯 Conta Steamworks (US$ 100) e rascunho da página. Conta Google Play (US$ 25).
- 🎯 Decidir o que fica público na web (D2): o ideal é **trocar o deploy completo da Vercel por um build de demo**, porque Tribeca e Next Fest pedem jogo "não lançado".
- 📅 2/dez: prazo oficial de Tribeca. **Pular** e usar o estendido.
- Devlog começa: 3 vídeos verticais por semana (TikTok / Shorts / Reels).

### Janeiro 2027: alfa fechado + vitrine
- 🎯 **Alfa fechado a partir de 11/jan**, com 30–50 pessoas. Discord fechado por convite (§3.5).
- 🎯 **Página do Steam pública até 20/jan** (começa a contar wishlist). Cápsula e 5 capturas.
- 📅 **15/jan: inscrição no BIG Festival** (grátis), com o vertical slice. Categoria natural: *Best Game: Brazil*, além de Innovation e Best Sound se a trilha estiver pronta.
- 📅 10/jan: registro do Next Fest de fevereiro. **Não participar** (só se pode uma vez, e é cedo).
- 🎯 Pitch deck v1 (10 slides + build + vídeo de 60 s).
- Fomento: acompanhar a regulamentação do **Rouanet Games** e do pacote *Desenvolve Gamers Brasil* (decreto de 14/out/2026) e os editais PNAB do estado e do município do Uwlo.

### Fevereiro 2027
- 🎯 Iterar o alfa (2 builds por semana). Telemetria opt-in ligada (§5).
- 🎯 **Teste fechado no Google Play**: contas pessoais criadas depois de 13/nov/2023 precisam de **12 testers por 14 dias** antes da produção. O alfa já cumpre isso.
- 🎯 Trailer de anúncio v1 (vertical 9:16 e horizontal 16:9).
- 🎯 **Pitch para publishers** (Raw Fury pelo formulário, Kepler, Playstack, Devolver, Chorus; QUByte para portes). Ver §4.4.
- 🔶 Games for Change Awards: só se a decisão D6 (Modo Estudo / impacto) for "sim".
- 🚦 **D4 (28/fev): orçamento.** Sem nenhum dinheiro até aqui, a trilha A (TGA 2027) fica no "modo festival".

### Março 2027: demo pública
- 📅 **4/mar: Tribeca Games, prazo estendido** (US$ 80), com o vertical slice polido. Exige projeto não lançado.
- 🎯 **Demo pública na web + itch.io a partir de 16/mar**, com Ato 1 + seed diária. Instalável como PWA.
- 🔶 Indie Arena Booth (gamescom 2027): inscrever. Em paralelo, procurar a Abragames / **Brazil Games**: em 2026 houve o primeiro pavilhão indie brasileiro na gamescom (35 jogos) e o *Brazil Games Accelerator*.
- 🎯 Primeiro contato com imprensa brasileira (demo + press kit v1).

### Abril 2027
- 🔶 Day of the Devs (SGF 2027): inscrever (padrão de prazo em abril).
- 📅 **22–25/abr: gamescom latam / BIG Festival** em SP. Se selecionado, ir (viagem no orçamento de R$ 50 mil). Mesmo sem seleção, ir à área B2B com o pitch.
- 📅 **25/abr: registro no Steam Next Fest de junho.** Demo de Steam pronta (build Tauri na CI, testada numa máquina real).
- 🎯 Beta do Ato 2.

### Maio 2027
- 🎯 Conteúdo dos Atos 2–3 jogável. Acessibilidade onda 2 (alto contraste, remapeamento, leitor de tela nos painéis).
- 🎯 Pré-campanha do Next Fest: 50 criadores contatados com demo, e o press preview do Steam.
- 🔶 Lineups de Tribeca (meados de maio) e Day of the Devs (fim de maio).

### Junho 2027: o teste de mercado
- 📅 3–12/jun: Tribeca (se selecionado).
- 📅 **14–21/jun: Steam Next Fest.** Stream diária própria + criadores.
- 🚦 **D7 (28/jun): GO/NO-GO do TGA 2027** (critérios na §6). Se for no-go: lançar 1.0 entre mar e mai/2028 e mirar o TGA 2028, o IGF 2028 com beta e o BAFTA 2029.

### Julho 2027
- 🎯 **Conteúdo travado (content lock) em 31/jul:** 4 atos + final. Localização EN (e ES) começa sobre o texto travado.
- 🎯 Builds de loja: Android (TWA/Bubblewrap, feito pela CI do projeto) e iOS (Capacitor), com envio antecipado para revisão da Apple (risco da regra 4.2).
- 🔶 Google Play Indie Games Fund LatAm: inscrever se houver edição.

### Agosto 2027
- 🎯 Beta fechado com 150–300 pessoas e QA em aparelhos.
- 🎯 **Anúncio da data (2/ago)** e trailer de data. **Sem pré-venda e sem bônus de pré-venda** (regra honesta).
- 🔶 gamescom (fim de agosto): IAB ou pavilhão Brazil Games.
- 🔶 IGF 2028 e BAFTA 2028 abrem inscrições.

### Setembro 2027: lançamento
- 🎯 **Versão final (gold) em 10/set.** Chaves para imprensa em 9/set (3 semanas antes).
- 🎯 **Embargo de análises: 30/set, 10h ET** (11h de Brasília).
- 🎯 **LANÇAMENTO 1.0, quinta, 30/set/2027:** Steam + Google Play + web (demo). App Store se aprovada.
- 🔶 Day of the Devs: inscrever no TGA Digital Showcase (fim de setembro).
- 🔶 IGF 2028: inscrever (prazo por volta de meados de setembro; jogo já lançado é aceito).

### Outubro 2027: a conversa
- 🎯 Patches 1.0.1 e 1.0.2 em até 72 h e em até 2 semanas. Mostrar escuta pública.
- 🎯 **Pedir ao TGA a lista de veículos votantes** (a FAQ permite isso a "qualified developers and publishers").
- 🎯 Página **For Your Consideration** e kit FYC (§3.3).
- 🎯 Atualização de conteúdo gratuita "seed diária + modo extra" para manter o assunto vivo.

### Novembro 2027
- 🎯 FYC: envio individual aos veículos votantes, com chave + link web + vídeo de 3 min + 1 página. Um lembrete só, sem brindes.
- 🔶 ~19/nov: corte do TGA 2027 (o jogo já está fora há 7 semanas). Indicações em meados de novembro.
- 🔶 2º prazo do BAFTA 2028 (jogos lançados de ago a nov/2027).

### Dezembro 2027
- 🔶 TGA 2027. Se houver indicação, mobilizar a comunidade para o voto do público (10%).
- 🎯 Post-mortem público (devlog), números honestos e plano de 2028: P2P, consoles via publisher, BAFTA, IGF.

---

## 3. Estratégia

### 3.1 Plataformas
| Plataforma | Papel | Como (ferramentas do projeto) | Custo | Observação |
|---|---|---|---|---|
| **Web / PWA** (domínio próprio + itch.io) | **Demo grátis e funil.** O júri joga pelo link em 5 s, no celular ou no PC | Já existe (Next export + SW) | ~R$ 60/ano de domínio | É a vantagem única: **"o primeiro candidato que o jurado abre pelo link do e-mail"**. |
| **Steam (PC)** | **Loja principal da 1.0.** Wishlists, Next Fest, Metacritic de PC, chaves de imprensa | Tauri (webview do sistema, binário pequeno) ou Electron (Chromium embutido, mais previsível). Build na CI, **nunca** com script de terceiros (regra do projeto) | US$ 100, recuperável a partir de US$ 1 mil de receita | Precedentes: Vampire Survivors chegou à 1.0 rodando em Phaser no Steam (só depois migrou para Unity) e o CrossCode saiu em HTML5/NW.js. |
| **Google Play** | Mobile principal, coerente com o jogo vertical | TWA (Trusted Web Activity) empacotada pela CI | US$ 25 | 12 testers × 14 dias antes da produção (conta pessoal). Classificação IARC. |
| **App Store** | Mobile secundário | Capacitor + build macOS na CI | US$ 99/ano | **Risco da regra 4.2** ("mínima funcionalidade" / site embrulhado). Mitigar com offline total, háptico nativo, Game Center e notas ao revisor. Se reprovar, a 1.0 sai sem iOS. |
| Consoles | Depois de 2027 | Via publisher ou QUByte | — | Fora do escopo da 1.0. |

**Por que não só web:** a crítica de games ainda associa "navegador" ao legado de Flash, aos .io cheios de anúncio, a F2P e a jogos "pequenos". Também não existe um lugar natural para análise de um jogo só de navegador nos agregadores, que organizam tudo por plataforma (PC, consoles, iOS). Exemplos de sucesso web existem (Wordle, comprado pelo NYT "na casa dos sete dígitos"; Krunker, comprado pela FRVR em 2022; Vampire Survivors, que começou no itch). Mas quase todos ganharam respeito **ao sair da web**: o NYT, o Steam, a Unity. A narrativa certa não é "somos um web game". É **"um jogo premium que também roda no seu navegador"**.

### 3.2 Modelo de negócio (honesto)
**Recomendação: premium com demo grátis.**
- **Preço:** US$ 9,99 / R$ 29,90 (preço regional do Steam). O mesmo vale no Play e no iOS.
- **Grátis para sempre:** demo web (Ato 1) + seed diária. Sem anúncios.
- **Na 1.0 não entra:** moeda, energia, loot box, passe de temporada, pré-venda com bônus, "desconto" de lançamento sobre preço inflado.
- Desconto real só depois de 3 meses e sobre o preço de lançamento.

**Por quê:**
1. **Crítica e TGA:** os indies premiados (Balatro, Hades, Clair Obscur) são premium. Em 2025, os indicados a Best Mobile foram todos F2P/gacha de grandes empresas, mas em 2024 o **Balatro premium ganhou**, porque o júri vota em "jogo", não em monetização.
2. **Regras do projeto:** sem quase-vitória, prova social falsa, desconto ou timer fictícios (§4 do HANDOFF).
3. **Lei:** o **ECA Digital (Lei 15.211/2025)**, em vigor desde 17/mar/2026, proíbe loot boxes em jogos de provável acesso por menores. O CDC pune desconto fictício.
4. **Operação:** F2P exige operação contínua, servidor e moderação, e a equipe é de uma pessoa.

> **Alternativa a considerar depois:** cosmético puro (skin de jipe, por exemplo) a preço fixo, sem aleatoriedade, só depois da 1.0, e só se houver demanda. Nunca na 1.0, para não contaminar a leitura da crítica.

### 3.3 Imprensa e criadores: chegar aos 100+ veículos votantes
**Fato-chave:** não há inscrição no TGA. Quem escolhe são mais de 100 veículos, cada um com uma cédula sem ordem e 5 votos por categoria. Os mais citados viram indicados. Publishers e devs **qualificados** podem pedir ao TGA a lista de votantes e mandar cópias e chaves.

**Plano em 5 camadas:**
1. **Base própria (nov/2026–mar/2027).**
   - Planilha de **~300 contatos**, com nome, veículo, editoria, último texto sobre indie/survival/mobile e idioma. Montada à mão a partir de matérias recentes.
   - **Brasil:** Omelete, IGN Brasil, The Enemy, Jovem Nerd, Voxel/TecMundo, Critical Hits, Gameblast, Flow Games.
   - **Internacional:** IGN, GameSpot, Polygon, Eurogamer, PC Gamer, Rock Paper Shotgun, Pocket Tactics, Pocket Gamer, TouchArcade, Game Developer, GamesIndustry.biz, VGC.
   - **Criadores:** survival, roguelite, mobile e YouTubers brasileiros de terror e sobrevivência.
2. **Press kit (fev/2027).** Página no próprio site, usando o formato livre do presskit(), com:
   - ficha técnica e **política de IA clara** (§6);
   - logo, arte-chave, 10 capturas em vertical e horizontal, GIFs de 6 s e trailer;
   - texto curto em EN e PT, a "história de origem" e contato.
3. **Ondas de notícia (fev → set/2027).**
   - **Uma notícia por onda:** anúncio, demo, BIG/Tribeca, Next Fest, data, lançamento.
   - E-mail **pessoal e curto** (3 frases + link web jogável + vídeo de 30 s). Nunca disparo em massa.
4. **Chaves e embargo (set/2027).**
   - Chaves do Steam por pedido individual, ou via Keymailer / Lurkit / Woovit para criadores, **3 semanas antes**.
   - O **link web completo, protegido por senha**, vai junto: zero atrito para o jurado que só tem celular.
   - Embargo único em 30/set, 10h ET.
5. **FYC (out–nov/2027).**
   - Página "For Your Consideration" com o caso do jogo em 1 minuto: o que é inovador (jogo vertical de uma mão, mundo procedural sem IA generativa, acessibilidade, Brasil nuclear), as melhores citações de crítica (reais) e o link para jogar.
   - Envio **individual** para a lista oficial do TGA, um lembrete só e **nenhum brinde** (para não parecer compra de voto).

**Metas de imprensa (indicativas):**
- Pelo menos 30 análises no lançamento, das quais pelo menos 15 em veículos de língua inglesa.
- Pelo menos 3 veículos da lista oficial do TGA jogando antes de 31/out.

### 3.4 O "momento de clipe" e as redes
- **Vantagem estrutural:** o jogo **já é vertical (9:16)**. Captura nativa para TikTok, Shorts e Reels, sem recorte.
- **3 formatos fixos, 3 vezes por semana:**
  1. *"Coisas que você só vê no fim do mundo brasileiro"* (o Colosso derrubando um orelhão, a Kombi no ermo).
  2. *"Morri assim"* (o card de morte que já existe).
  3. *"Arte que é código"* (timelapse da biblioteca procedural montando um bicho).
- A **seed diária** gera conversa diária real ("quem passou do dia 3 na seed de hoje?").
- **Métrica:** retenção e compartilhamento por vídeo, não seguidores.

### 3.5 Comunidade
- **Discord a partir do alfa (jan/2027).**
  - Fechado e por convite até a demo. Canais de bug, ideia, seed do dia e devlog.
  - **Regras de idade:** 13+ pelo Discord. Por causa do ECA Digital, nada de coletar dados de menores e moderação ativa.
  - **Moderação:** 2 voluntários de confiança quando passar de 200 membros.
- **Devlog quinzenal** (texto curto + vídeo), em PT e EN.
- **Playtests públicos** com changelog: "você pediu, mudou". A transparência é o diferencial honesto.

### 3.6 Conteúdo brasileiro como diferencial (com cuidado)
- **Precedente forte:** o **Despelote** (Equador, nome em espanhol, muito local) foi indicado em 2025 a *Games for Impact* e a *Best Debut Indie*. A especificidade cultural **ajuda** no júri.
- **Matéria-prima real:**
  - Angra dos Reis e o programa nuclear brasileiro dos anos 1970–80.
  - O **acidente do Césio-137 em Goiânia (1987)**: memória nacional da radiação, o Geiger que já existe no jogo.
  - Biomas: cerrado, caatinga, pantanal, Mata Atlântica.
  - Cidade: orelhão, Kombi e Brasília (o carro), rádio AM, *A Voz do Brasil*, igreja de praça, posto de beira de estrada.
  - Trilha: viola caipira, rabeca e berimbau como drones de tensão.
  - Nome: *Cinzas*, a quarta-feira depois do Carnaval.
- **Cuidado ético:** o Césio-137 tem vítimas vivas. **Não usar nomes nem casos reais**, falar com associações de vítimas antes e tratar o tema com respeito. Se bem feito, isso pode sustentar *Games for Impact*.
- **Idioma:** PT-BR como "versão original", com legenda EN impecável. O nome pode ficar em português, como Despelote e Dandara.

---

## 4. Orçamento em 3 cenários

Câmbio de referência: US$ 1 ≈ R$ 5,50 e € 1 ≈ R$ 6,20 (ajustar). Valores de mercado brasileiro freelance são **estimativas** a cotar.

### 4.1 Cenário ZERO (≈ R$ 2,5 mil de custos que não dá para evitar)
| Item | R$ |
|---|---|
| Steam Direct (US$ 100, recuperável) | 550 |
| Google Play (US$ 25) | 140 |
| Apple Developer (US$ 99/ano), só se o iOS for adiante | 550 |
| Tribeca (US$ 80) + IGF 2028 (US$ 75, ou isenção) | 850 |
| Domínio + INPI (a partir de ~R$ 150 por classe com desconto; conferir a tabela) | 400 |
| **Total** | **≈ 2.500** |

- **O que compra:** nada além de presença nas lojas. Trilha, arte-chave e trailer feitos pelo Uwlo ou por agentes, ou com módulos livres registrados no `CREDITS.md`. Playtest voluntário.
- **Meta realista:** BIG Festival, Next Fest e um lançamento digno. **TGA improvável.**
- **Captação:** prêmios e editais pequenos (PNAB municipal ou estadual na linha de audiovisual / produção digital) e pitch para publisher com o vertical slice.

### 4.2 Cenário R$ 50 mil: "pacote mínimo de candidatura"
| Item | R$ |
|---|---|
| Compositor + design de som brasileiro (trilha adaptativa ~30 min com stems + 60 efeitos + mix) | 18.000 |
| Direção de arte pontual: arte-chave, cápsulas de Steam e Play, logo | 7.000 |
| Editor de trailer (anúncio + lançamento, nos dois formatos) | 5.000 |
| Laboratório de aparelhos: 3 Android usados (fraco, médio, bom) + 1 iPhone usado + notebook usado para a build do Steam | 6.000 |
| Localização EN com revisor nativo + LQA | 5.000 |
| QA freelance (2 rodadas pré-lançamento) | 3.000 |
| Taxas (cenário zero) | 2.500 |
| Contador e abertura de empresa (ver com o contador se cabe MEI ou se precisa de ME) + jurídico (contrato do compositor, termos LGPD) | 2.000 |
| Viagem ao BIG Festival / gamescom latam (SP) | 1.500 |
| **Total** | **50.000** |

- **Meta:** BIG, Tribeca e Day of the Devs plausíveis; Metacritic na faixa de 80; **chance real, mas pequena, de indicação em categoria indie ou mobile.**
- **Captação:**
  - edital PNAB estadual ou municipal;
  - **Catarse** (realista só com mais de 3 mil pessoas engajadas; o recorde do *Enigma do Medo*, acima de R$ 4 mi, veio de um público de streamer que o CINZAS não tem);
  - adiantamento pequeno de publisher;
  - Google Play Indie Games Fund, se houver edição e o jogo couber nos requisitos.

### 4.3 Cenário R$ 500 mil (12 meses): "estúdio pequeno de verdade"
| Item | R$ |
|---|---|
| Produtor(a)/game designer sênior parceiro(a), 12 m × R$ 10 mil | 120.000 |
| Artista técnico(a) 2D/pixel (direção de arte + UI + loja), 9 m × R$ 7 mil | 63.000 |
| Programador(a) sênior em meio período (desempenho mobile, Tauri/Capacitor, CI), 8 m × R$ 6 mil | 48.000 |
| Compositor + design de som + mix final | 35.000 |
| Roteirista / designer narrativo brasileiro (texto humano, personagem-âncora, final) | 25.000 |
| QA (2 testers por 6 meses ou empresa) + laboratório de aparelhos | 30.000 |
| Localização EN, ES, FR, DE e JA (~30 mil palavras) + LQA | 45.000 |
| Consultoria de acessibilidade com avaliadores com deficiência | 10.000 |
| PR internacional (freelancer ou agência, 5 meses, de jun a out) | 40.000 |
| Trailers (anúncio, Next Fest, lançamento) | 20.000 |
| Eventos: gamescom (IAB ou Brazil Games) + BIG + 1 viagem aos EUA se houver seleção | 30.000 |
| Jurídico, contábil e marca (Brasil + EUA/UE) | 10.000 |
| Contingência (~5%) | 24.000 |
| **Total** | **500.000** |

- **Meta:** candidato sério a *Best Debut Indie* / *Best Independent* / *Best Mobile*. Metacritic acima de 85 vira possível.
- **Captação (combinável):**
  - **Publisher:** Raw Fury aceita pitch por formulário e pede build + deck, mas não faz F2P mobile. A Kepler recebe mais de 2.000 pitches por ano e escolhe por "vibe" e originalidade. Playstack (Balatro), Devolver e Chorus também. A **QUByte** (SP) serve para portes. Padrão de mercado: adiantamento contra receita (*recoup*) e depois divisão. **Manter a propriedade intelectual** e passar o contrato por um advogado.
  - **Rouanet Games**: patrocínio via Lei Rouanet com empresas públicas, criado pelo decreto *Desenvolve Gamers Brasil* de 14/out/2026, que regulamenta a Lei 14.852/2024. Pede proponente cadastrado e projeto aprovado, e leva de 6 a 12 meses.
  - **FSA/BRDE:** a proposta baixa o empréstimo mínimo de R$ 500 mil para R$ 150 mil, a TR + 0,5% ao ano, mas ainda está pendente de aprovação. Exige produtora com CNPJ e registro na Ancine. **É dívida**, não doação.
  - **Lei do Audiovisual 2027:** previsão de R$ 50 mi para produzir e lançar jogos independentes brasileiros, com regras ainda a sair da Ancine.
  - **Finep/FNDCT:** chamada proposta de R$ 200 mi para startups de games.
  - **Brazil Games** (Abragames + ApexBrasil): leva o estúdio a GDC e gamescom e tem o *Accelerator*.
  - Não há edital de games da Spcine com prazo aberto, e a **Lei Paulo Gustavo** foi um repasse emergencial de 2023–2024 que não se renova. O caminho contínuo é a **PNAB**.

### 4.4 Pitch para publisher (fev–abr/2027)
1. **Pacote:** deck de 10 slides (gancho, pilares, público, comparáveis, estado, cronograma, orçamento pedido, equipe, riscos, pedido) + build jogável (link web) + vídeo de 60 s + métricas do alfa.
2. **Ordem de envio:**
   - **Playstack** (histórico com Balatro e mobile premium);
   - **Raw Fury** (formulário);
   - **Kepler**;
   - **Devolver**;
   - **Chorus**;
   - **QUByte** (parceria de porte, não de publicação principal).
3. **O que pedir:** R$ 300–500 mil de adiantamento + QA + localização + PR. **O que não ceder:** propriedade intelectual, controle criativo e as regras honestas de design (cláusula expressa).

---

## 5. Playtests e métricas

### 5.1 Fases
| Fase | Quando | Quantos | Onde recrutar | Pergunta central |
|---|---|---|---|---|
| P0 corredor | nov/2026 | 5–10 | Amigos e família do Uwlo, celulares variados | "Entende sem ajuda? Roda no meu celular?" |
| P1 alfa fechado | 11/jan → fev/2027 | 30–50 | Discord por convite, grupos de dev brasileiros, cursos de jogos (inclusive os novos cursos federais), r/playmygame, comunidades de survival | "Volta no dia seguinte? Onde larga?" |
| P2 teste fechado no Play | fev → mar/2027 | 12+ (exigência) a 100 | O próprio alfa | Estabilidade Android + exigência do Google |
| P3 demo pública | 16/mar → jun/2027 | 500–5.000 | Web, itch, BIG, imprensa brasileira, TikTok | Funil do Ato 1 e conversão para wishlist |
| P4 Next Fest | 14–21/jun/2027 | 2.000–20.000 | Steam | Tempo de jogo mediano da demo; wishlists |
| P5 beta | ago/2027 | 150–300 | Discord + quem mais jogou a demo | Bugs, balanceamento dos Atos 2–4, final |
| Testes de acessibilidade | mai e ago/2027 | 5–10 | Associações de pessoas surdas e com baixa visão; AbleGamers / Can I Play That? (contato) | As legendas visuais e o modo de uma mão funcionam de verdade? |

### 5.2 O que medir
**Telemetria:** opt-in, anônima, só eventos de jogo.
1. **Funil da 1ª sessão:** abriu → passou da intro → 1º saque → 1ª viagem → 1ª morte/desmaio → 1º objetivo do Ato 1 concluído. Com o tempo de cada etapa.
2. **Onde abandona:** último objetivo ativo e mapa de calor de mortes por zona.
3. **Desempenho por aparelho:** tempo de quadro p50/p95, carga da zona, travamentos, memória (só modelo e SO, sem identificador).
4. **Toque:** toques "perdidos" (chão em vez de objeto), uso de uma mão × duas mãos e troca de controle.
5. **Retenção D1/D7** (só diagnóstico; **proibido usar para ajustar isca**).
6. **Questionário de 5 perguntas** ao fim da sessão:
   - Divertido?
   - Momento favorito?
   - O que confundiu?
   - Jogaria amanhã?
   - Indicaria?
7. **Qualitativo:** 10 gravações de tela com voz (voluntárias) por fase.

**Metas-guia** (ajustar com dados): 70% ou mais concluem o 1º objetivo do Ato 1; mediana da demo de 25 min ou mais; p95 do quadro abaixo de 33 ms num Android intermediário.

### 5.3 LGPD, ECA Digital e regras honestas
- **Base legal: consentimento explícito** (LGPD, art. 7º, I), com tela clara antes de qualquer envio e telemetria **desligada por padrão**. Revogável em *Configurações → Seu progresso*, onde também se apagam os dados.
- **Sem dado pessoal:**
  - ID aleatório local, que se troca ao revogar;
  - sem IP guardado, sem nome, sem e-mail na telemetria;
  - e-mail **só** para quem se inscreve no playtest, em lista separada.
- **Menores:** autodeclaração de idade no convite. **Abaixo de 18 anos, nenhuma coleta** (prudência pelo ECA Digital).
- **Ferramenta:** analytics comunitário de licença livre e auto-hospedável (ex.: Umami, MIT), registrado no `CREDITS.md`. Retenção de 90 dias.
- **Política pública** em 1 página, em linguagem simples: o que coleta, por quê e por quanto tempo.
- **Regra do projeto:** dado de playtest serve para **tirar atrito e frustração**. Não serve para quase-vitória, pressão de compra ou falsa escassez. O **Modo Estudo** (`?estudo=1`) tem telemetria separada e sempre termina na tela de Revelação.

---

## 6. Riscos, mitigação e pontos de decisão

### 6.1 Riscos principais
| # | Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | **Não é divertido para estranhos** (nunca testado) | Alta | Fatal | P0 em novembro. Vertical slice julgado pelo funil P1, não por opinião. |
| R2 | **Desempenho ruim em Android fraco / iOS Safari** (GL, áudio, armazenamento) | Alta | Alto | Laboratório de aparelhos (R$ 6 mil), modo de qualidade automático. No iOS o armazenamento do navegador pode ser apagado: exportar save e oferecer o app nativo. |
| R3 | **Política de IA:** o Indie Game Awards **retirou dois prêmios** do Clair Obscur em dez/2025 por IA generativa. O Steam exige declarar conteúdo gerado por IA que o jogador consome (regra reescrita em jan/2026). O BAFTA 2027 também atualizou sua política | Média | Alto (reputação) | **D5:** tudo que o jogador vê ou ouve é de **autoria humana ou procedural determinística** (a biblioteca `game/lib/` é código, não IA generativa). Texto dos bilhetes e diálogos reescrito ou assinado por humano. Declaração honesta no Steam e no press kit sobre o uso de agentes de IA na programação. |
| R4 | **Fator ônibus = 1 / esgotamento** | Alta | Fatal | Jornada sustentável (sem crunch). Repositório e documentação já fortes (HANDOFF). Trazer 1 parceiro(a) de produção no cenário de R$ 50 mil ou mais. |
| R5 | **Sem PC:** o Uwlo não testa a build do Steam | Certa | Médio | Notebook usado no orçamento, ou 2 testers de PC fixos do Discord. Builds automáticas na CI. |
| R6 | **Inchaço de escopo** (P2P, backend, biomas…) | Alta | Alto | D3: escopo travado. Tudo que não está no vertical slice precisa de "troca": entra um, sai um. |
| R7 | **Nome / marca** em conflito ("Ashes" é saturado) | Média | Médio | D1 até 15/dez, com busca no INPI, Steam, App Store e USPTO. |
| R8 | **Jogo "já lançado"** (deploy completo na Vercel) conflita com Tribeca e Next Fest | Média | Médio | D2: deploy público vira demo. O build completo fica atrás de senha para testers. |
| R9 | **Rejeição na App Store (4.2)** | Média | Baixo | iOS opcional. Enviar cedo (julho). |
| R10 | **Invisibilidade** (zero audiência) | Alta | Alto | Vídeo vertical 3 vezes por semana desde dezembro, festivais brasileiros primeiro, imprensa brasileira como trampolim. |
| R11 | **Preconceito "web game"** | Média | Médio | Lançar no Steam (PC) e nas lojas. Posicionar como "premium que roda no navegador". |
| R12 | **Tema sensível** (Césio-137) | Baixa | Alto | Ficção inspirada, consulta a associações, nada de nomes reais. |
| R13 | **ECA Digital / LGPD** (chat P2P, coleta de dados de menores) | Média | Alto | Sem chat na 1.0. Telemetria opt-in só para maiores de 18. Classificação indicativa (IARC no Play; conferir a exigência do ClassInd no Steam). |
| R14 | **Contrato ruim com publisher** | Média | Alto | Advogado, cláusula de propriedade intelectual e de design honesto, *recoup* limitado. |

### 6.2 Pontos de decisão do Uwlo
| ID | Data | Decisão | Critério / recomendação |
|---|---|---|---|
| **D1** | 15/dez/2026 | Nome final | Busca de marca limpa. Recomendo nome em português curto e pronunciável lá fora. |
| **D2** | 15/dez/2026 | O que fica público na web | **Recomendo:** demo (Ato 1 + seed) pública. Jogo completo só para testers, até a 1.0. |
| **D3** | 30/nov/2026 | Escopo da 1.0 | **Recomendo:** sem P2P e sem backend. 4 atos, 1 final forte, acessibilidade ondas 1–2. |
| **D4** | 28/fev/2027 | Orçamento e captação | Até aqui: qual cenário (0 / 50 mil / 500 mil) é real? Sem nada, a trilha A segue em "modo festival". |
| **D5** | 31/jan/2027 | Política de IA pública | **Recomendo:** "IA só como ferramenta de programação; arte procedural por código; texto, música e voz humanos", declarado no Steam e no press kit. |
| **D6** | 31/jan/2027 | Modo Estudo: fica no jogo, vira obra separada ou sai? | **Recomendo:** separar numa experiência web gratuita ("Revelação"), com ângulo de *Games for Impact* / Games for Change, e não misturar com a versão vendida, para evitar leitura de design manipulador. |
| **D7** | **28/jun/2027** | **GO/NO-GO do TGA 2027** | **GO só se tudo isto valer:** (a) conteúdo dos 4 atos jogável; (b) pelo menos 10 mil wishlists, ou pelo menos 5 mil + publisher; (c) mediana da demo de 25 min ou mais; (d) pelo menos 70% concluem o 1º objetivo; (e) nenhum bloqueador de desempenho no laboratório. **NO-GO:** 1.0 em mar–mai/2028, mirando o TGA 2028. |
| **D8** | 20/ago/2027 | Data final do lançamento | Wishlists e qualidade do beta. Se houver dúvida, adiar para 14/out (ainda 5 semanas antes do corte). |
| **D9** | 15/abr/2027 | Aceitar publisher? | Só com propriedade intelectual mantida e cláusula de design honesto. |

---

## 7. Leitura honesta da probabilidade e das vitórias intermediárias

**Probabilidades:** são **estimativas de julgamento** deste plano, não estatística. Servem para calibrar a expectativa.
| Resultado | Cenário 0 | R$ 50 mil | R$ 500 mil / publisher |
|---|---|---|---|
| Lançar uma 1.0 sólida até out/2027 | 25–35% | 40–55% | 60–75% |
| Ser selecionado em pelo menos 1 festival relevante (BIG, Tribeca, Day of the Devs, IAB) | 30–45% | 45–60% | 55–70% |
| Metacritic de 80 ou mais | 10–20% | 20–30% | 30–45% |
| **Qualquer indicação no TGA 2027** (Debut Indie / Indie / Mobile / Impact / Acessibilidade) | ~1% | 2–4% | 5–10% |
| Indicação a **GOTY** no TGA 2027 | < 0,1% | < 0,3% | ~0,5–1% |

**Por que tão baixo:**
- Todos os vencedores de GOTY tiveram Metacritic de 88 ou mais e um ano de conversa pública. O CINZAS tem 5 dias de vida e zero audiência.
- A categoria Acessibilidade é dominada por AAA: os indicados de 2025 foram AC Shadows, Atomfall, Doom, EA FC 26 e South of Midnight.
- Best Mobile oscila entre gacha (2025) e premium (Balatro, 2024).

**Por que não é zero:**
- **Um dev só já chegou lá.** O Balatro ganhou três categorias em 2024. O Megabonk (um dev) foi indicado a Debut Indie em 2025 e só saiu por não ser estreia, a pedido próprio.
- **Jogo pequeno e muito local também chegou.** O Despelote foi indicado duas vezes.
- **Ninguém ocupou esse espaço ainda.** Não encontramos registro de jogo nascido para navegador indicado em categoria do TGA. O espaço "premium vertical de uma mão que roda no link" está vazio.

### Escada de vitórias (cada degrau já é uma vitória real)
1. 🟢 **Rodar liso no celular do Uwlo e de 5 estranhos** (nov/2026).
2. 🟢 **Vertical slice que um estranho termina sorrindo** (dez/2026).
3. 🟢 **Seleção no BIG Festival**, ou indicação a *Best Game: Brazil* (abr/2027).
4. 🟢 **Seleção no Tribeca, Day of the Devs ou Indie Arena Booth.**
5. 🟢 **10 mil wishlists** e destaque no Next Fest (jun/2027).
6. 🟢 **Lançamento 1.0 com 30 análises** e nota média de 80 ou mais (out/2027).
7. 🟡 **IGF 2028**: finalista ou menção honrosa; **BAFTA 2028**: longlist.
8. 🟡 **Primeiro web game indicado a uma categoria do TGA**, já histórico por si só, mesmo sem ganhar.
9. 🔴 Indicação a GOTY.

**Mensagem para o Uwlo:** o plano mira o TGA 2027 sem fingir que ele é provável. O que torna o caminho bom é que **cada degrau de 1 a 6 vale a pena mesmo se o TGA nunca vier**. É isso que constrói o estúdio, a audiência e o próximo jogo.

---

## Fontes consultadas (4/nov/2026)

**TGA**
- FAQ oficial (corte, acesso antecipado, júri, lista de votantes): https://thegameawards.com/faq
- Data de 2026 (10/dez): https://gamingbolt.com/the-game-awards-2026-confirmed-for-december-10th/amp
- Indicados de 2025: https://gameinformer.com/2025/11/17/here-are-the-nominees-for-the-game-awards-2025 · https://www.screenhub.com.au/news/games/the-game-awards-2025-complete-list-of-winners-2688374/ · https://www.shacknews.com/article/147140/the-game-awards-2025-winners-trailers
- Balatro em 2024: https://www.npr.org/2024/12/13/g-s1-38032/2024-game-awards-winners-reveals-astro-bot
- Megabonk: https://www.pcgamer.com/games/roguelike/megabonk-developer-withdraws-from-best-debut-indie-game-nomination-at-the-game-awards-for-a-pretty-good-reason-its-not-my-debut-game

**Festivais e prêmios**
- IGF: https://igf.com/submit-your-game
- BAFTA 2027: https://www.bafta.org/media-centre/press-releases/2027-bafta-games-awards-entries-open/
- Tribeca 2027: https://tribecafilm.com/festival/submissions
- BIG Festival / gamescom latam 2027: https://www.gamespress.com/gamescom-latam-2027-opens-call-for-speakers-alongside-BIG-Festivals-fr
- Steam Next Fest: https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest/feb_2027 · https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest/june_2027
- Indie Arena Booth: https://indiearenabooth.de/submission · https://www.gamesmarket.global/indie-arena-booth-2026-submissions-open-until-13-april
- Day of the Devs: https://dayofthedevs.com/submit · https://gamingtrend.com/news/submissions-for-day-of-the-devs-the-game-awards-digital-showcase-are-now-open/
- IndieCade: https://form.jotform.com/260583855743063
- Games for Change: https://g4cawards.secure-platform.com/
- SXSW Gaming Awards (encerrado): https://en.wikipedia.org/wiki/SXSW_Gaming_Awards
- Apple Design Awards 2026: https://www.macrumors.com/2026/05/18/apple-design-award-finalists-2026
- Google Play Indie Games Fund LatAm: https://android-developers.googleblog.com/2025/07/google-plays-indie-games-fund-latin-america-returns-2025.html
- Brazil Games: https://www.pocketgamer.biz/brazil-games-to-showcase-35-indie-titles-at-gamescom-2026/ · https://www.pocketgamer.biz/brazil-games-set-to-bring-over-30-game-studios-to-gdc-2026

**Lojas e IA**
- Taxa do Steam: https://partner.steamgames.com/doc/gettingstarted/appfee
- Wrappers e precedentes (CrossCode, Vampire Survivors): https://www.summerengine.com/make-great-games/threejs-game-on-steam · https://en.wikipedia.org/wiki/Vampire_Survivors
- Regra de 12 testers do Play: https://support.google.com/googleplay/android-developer/answer/14151465
- Regra 4.2 da App Store: https://developer.apple.com/forums/thread/704430
- Política de IA do Steam: https://videogameschronicle.com/news/valve-has-significantly-rewritten-steams-rules-for-how-developers-much-disclose-ai-use
- Clair Obscur e o Indie Game Awards: https://www.engadget.com/gaming/the-indie-game-awards-snatches-back-two-trophies-from-clair-obscur-over-its-use-of-generative-ai-164730842.html

**Web games**
- Wordle: https://www.thewrap.com/ny-times-buys-wordle-online-game-for-low-seven-figures
- Krunker: https://www.gamedeveloper.com/press-release/frvr-acquires-popular-free-to-play-shooter-krunkerio

**Publishers**
- Raw Fury: https://rawfury.com/how-to-pitch-to-raw-fury/
- Kepler: https://gamedeveloper.com/business/publishers-can-still-bet-on-bold-interesting-games-says-kepler-interactive
- QUByte: https://www.gematsu.com/companies/qubyte-interactive

**Fomento e lei (Brasil)**
- Decreto *Desenvolve Gamers Brasil* / Rouanet Games / FSA / Finep (14/out/2026): https://www.itatiaia.com.br/games/governo-federal-regulamenta-marco-legal-dos-games-e-anuncia-pacote-de-incentivos
- Manual Game e Cultura (MinC): https://www.gov.br/cultura/pt-br/centrais-de-conteudo/publicacoes/manual-game-e-cultura
- ECA Digital: https://www.poder360.com.br/poder-governo/eca-digital-entra-em-vigor-nesta-3a-feira-entenda-o-que-muda/
- Catarse e Enigma do Medo: https://sol.sbc.org.br/index.php/sbgames_estendido/article/view/32114 · https://www.omelete.com.br/games/enigma-do-medo-jogo-cellbit-saiba-como-baixar

**Playtest e marketing**
- Teste com 5 usuários: https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/
- Referência de wishlists (regra prática, não dado oficial): https://www.summerengine.com/make-great-games/market-your-indie-game

> **Lacunas para conferir:** datas de 2027 do TGA, IAB, Day of the Devs, IGF 2028 e BAFTA 2028 (marcadas com 🔶); edital de games da Spcine e chamada FSA/BRDE de games (nenhuma aberta encontrada); edição 2026/2027 do Google Play Indie Games Fund; exigência de ClassInd no Steam.
