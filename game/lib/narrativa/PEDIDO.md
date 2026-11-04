# Pedido de compra — linha "Localização EN + revisão" (R$ 5.000)

Área: Narrativa · Sprint 1 · 4/nov/2026 · **quem contrata é o Uwlo** (nenhum agente gasta dinheiro).

A linha paga duas coisas, nesta ordem: **(B) revisão e assinatura do texto em português por roteirista humano(a)** e **(A) transcriação para o inglês** do que a revisão aprovar. Traduzir antes de revisar é pagar duas vezes.

| Item | O quê | Volume | Referência de preço | Teto |
|---|---|---|---|---|
| B | Revisão autoral PT (roteirista de jogos/rádio, BR) | 3.813 palavras + leitura do roteiro (§3–§6) | R$ 0,40–0,60/palavra de revisão profunda, ou diária | **R$ 2.000** |
| A | Transcriação PT → EN (nativo, jogos narrativos) | ~3.800 palavras (o rascunho EN de 1.096 palavras é só referência) | US$ 0,12–0,16/palavra ≈ R$ 2.500–3.300 | **R$ 2.700** |
| — | LQA no celular (1 rodada, 2 h) | capturas a 360 px | incluído no A, ou R$ 300 | R$ 300 |
| | | | **Total** | **R$ 5.000** |

Contagem gerada do catálogo (`palavras()` em `i18n.ts`, sem marcas de formatação):

| Bloco (prefixo da chave) | Entradas | Palavras PT | Sem EN |
|---|---|---|---|
| abertura, menu, morte, ato | 31 | 259 | 0 |
| passo (título, requisito, Lia, Cris) | 70 | 371 | 112 |
| npc (falas propostas) | 6 | 65 | 65 |
| cena (6h40) e lia (caderno, parede) | 39 | 291 | 0 |
| tr (falas de rádio) + al (fichas do Caderno) | 131 | 1.499 | 1.247 |
| fita | 48 | 526 | 526 |
| bilhete | 30 | 529 | 529 |
| personagem, nome, quem | 39 | 273 | 238 |
| **Total** | **394** | **3.813** | **2.717** |

Orçar com 3 fornecedores. Contrato: cessão de direitos do texto, crédito nominal, **proibição de uso do texto para treino de IA**.

---

## A · Briefing para tradutor(a) EN

**O jogo.** FAROL (nome de trabalho CINZAS): survival pós-nuclear em São Paulo, celular vertical. Depois da bomba, a voz de rádio em que a cidade inteira confiava (Íris, da Farol 107,7) chama os sobreviventes para o Abrigo 7. Cris leva a irmã de 9 anos, Lia, até lá e descobre por que a voz mente. Tagline: *"O Geiger não mente. O rádio, sim."* / *"The Geiger doesn't lie. The radio does."*

**O que é o trabalho.** Transcriação literária, não tradução técnica. O português é o original e deve soar brasileiro também em inglês (como o francês de *Clair Obscur*): nomes, "Dona", "Seu", fichas, PX ficam. Frase curta, objeto concreto, humor seco de gente cansada. Zero *game-speak* no texto do mundo.

**Entregáveis.**
1. `en.ts` completo (o arquivo atual tem 168 chaves em rascunho de IA: **pode e deve reescrever**).
2. A lista `pendentes-en.ts` esvaziada (o teste `npm run teste` acusa chave esquecida).
3. Planilha de dúvidas e notas por chave.

**Regras técnicas (o teste automático confere).**
- **Limites de caracteres** (cada chave tem um tipo; ver `tipos.ts`): balão de rádio ≤ 160 · evento ≤ 140 · opção ≤ 28 · bilhete ≤ 300 · abertura/morte ≤ 150 · pensamento de Cris e caderno da Lia ≤ 60 · título ≤ 32 · requisito ≤ 48 · nome ≤ 24.
- **Marcas que não se traduzem:** `{n}`, `{a}`, `{b}` (números); `{masc|fem}` é o gênero de Cris (o jogador escolhe) — em EN normalmente `{he|she}`, `{him|her}`, ou reescreva para evitar; `{n:singular|plural}` com `#` no lugar do número.
- **Fichas do Caderno:** a chave `al.<id>.disseram` precisa aparecer **literalmente** dentro da fala `tr.<id>.<i>` correspondente (o jogador vê a frase recortada da fala). Traduza as duas juntas.
- **A Farol se repete de propósito.** As falas `tr.farol-dN.1`, `.4`, `.5`, `.6` são idênticas nos 7 dias: traduza **igual, palavra por palavra**. A repetição é a pista do mistério.
- Palavras proibidas no texto do mundo (EN): *level, XP, HUD, journal, shortcut, quest log*. Nos requisitos (`passo.*.requisito`) a interface pode dizer *level*.

**Glossário (fixo).**

| PT | EN | Nota |
|---|---|---|
| Farol 107,7 | Farol 107.7 | "Farol" = farol de trânsito, de carro, lanterna-guia e blefe. Compensar com *beacon* nas falas quando couber. |
| hora certa | on the dot | bordão da rádio: "Six forty, on the dot at Farol." |
| tem lugar | there's room | a mentira central; sempre igual. |
| Abrigo 7 | Shelter 7 | |
| o Clarão / a Troca | the Flash / the Exchange | a bomba / a guerra de 40 min no hemisfério norte |
| o Cordão / a Zona | the Cordon / the Zone | |
| a catraca | the turnstile | o ponto de medição na porta |
| os queimados | the burned | nunca "zombies" |
| os romeiros | the pilgrims | gente a pé rumo ao norte |
| Filhos do Cinza | Children of the Ash | |
| Irmão Lume | Brother Lume | "lume" = luz; manter |
| Milícia Velha | the Old Militia | |
| Saqueadores do Km 40 | the Km 40 Raiders | |
| PX / canal 9 | CB / channel 9 | rádio cidadão; canal 9 é o de emergência |
| fichas | tokens | moeda de troca |
| Ermo Cinzento | the Gray Wastes | |
| Dona Cida, Seu Tonho | Dona Cida, Seu Tonho | manter; nota de contexto no glossário do press kit |
| 23 de Maio | the 23 de Maio avenue | manter o nome |
| Cabo Reis / Sargento Vidal | Corporal Reis / Sergeant Vidal | |

**Tom por voz.** Íris no ar: calorosa, de rádio AM das 6h, bordões. Íris nas fitas: cansada, frases que param no meio. Lia (9 anos): concreta, sem metáfora de adulto, erra a gramática de leve. Lume: pregação rouca, cortada pela interferência (`…`). Dona Cida: rádio PX de caminhoneiro ("positivo e operante", "câmbio"). Milícia: comunicado oficial vazio. Narradora (tela de morte): a Lia adulta; carinho teimoso.

**Sensibilidade.** Sem nomes de vítimas reais do Césio-137. Canudos ecoa nos Filhos do Cinza com dignidade (não ridicularizar a fé). A criança nunca morre no texto.

---

## B · Briefing para roteirista humano(a) — revisar e assinar

**Por que existe.** Política de IA do Plano GOTY (§3): todo texto que o jogador lê nasce `autoria: 'rascunho-ia'` e só vira `'humano'` quando uma pessoa revisa e assina. Hoje são **394 entradas, 3.813 palavras**, todas em rascunho.

**Material.** `docs/plano-goty/roteiro.md` (bíblia, §3–§6) e esta pasta: `biblia.ts`, `transmissoes.ts` (16 transmissões, 24 alegações), `fitas.ts` (7 fitas, 1–3 completas, 4–7 em esboço), `bilhetes.ts` (15), `abertura.ts`, `morte.ts`, `passos.ts` (25), `cena640.ts`, `caderno-lia.ts`.

**O que pedimos.**
1. **Revisão autoral** de todas as entradas: voz, ritmo, corte. Pode reescrever tudo; só não pode quebrar os limites de caracteres nem o formato (o teste avisa).
2. **Terminar as fitas 4–7** (cerca de 600 palavras), a partir dos esboços.
3. **Leitura fria (gate G2):** marcar em 20 textos a frase que repetiria a alguém. Texto sem marca é cortado ou reescrito.
4. **Checar a honestidade:** toda mentira de personagem tem caminho de verificação (`comoVerificar`) e a ficha diz a verdade (`real`). A interface (requisitos, números) nunca mente.
5. **Assinar:** trocar `autoria: 'rascunho-ia'` por `'humano'` no que aprovou, com nome no `CREDITS.md`.

**Pontos que pedimos atenção especial.** A cena das 6h40 e as três respostas da Lia (é o núcleo emocional do Ato I). As 7 manhãs da Farol (a repetição precisa ser idêntica e, na segunda escuta, doer). O caderno da Lia (momento autoral, ver `INTEGRACAO.md`). A tela "Não foi assim".

**Prazo sugerido.** 2 semanas para a revisão, antes da tradução (a tradução começa sobre o texto assinado). **Perfil:** roteirista brasileiro(a) com obra publicada em jogo, rádio ou quadrinho; bônus para quem conhece rádio AM e PX.
