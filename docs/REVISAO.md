# CINZAS 0.2 — revisão de produto, game design e arte

## Escopo e critério

Revisão técnica e heurística por IA sobre o jogo existente, com capturas e execução em Chromium. Não representa assinatura de um game designer ou diretor de arte humano. Aprovação artística é um julgamento, não o resultado automático de um teste.

A proposta mantida é sobrevivência nuclear solo, isométrica, vertical e com campanha finita até o Abrigo 7. O ciclo é preparar o abrigo → viajar → explorar e coletar → decidir entre lutar e fugir → retornar → fabricar e melhorar → seguir o sinal. A campanha de 24 passos em quatro atos, 11 destinos, três dificuldades, inventário espacial, cozinha, clima, NPCs, contratos, progressão e desfechos já existiam e foram preservados.

## Decisões desta revisão

| Área | Critério | Mudança verificável |
| --- | --- | --- |
| Entrada | O jogador entende propósito e próxima ação | Menu com objetivo final, ato e objetivo da partida salva, CTA principal, dificuldade e consequência da morte |
| Controles | Instrução corresponde ao comportamento | Menu informa toque/uma mão ou manche/duas mãos conforme configuração; botões de listas ativam ao soltar, permitindo rolagem |
| Hierarquia | Informação não disputa espaço com ação | Relógio e botões em faixas separadas; objetivos abaixo; habilidades acessíveis pelo nível |
| Inventário | Todo espaço prometido é utilizável | Grade de oito colunas limitada à largura real do painel |
| Persistência | Encerrar uma jornada é definitivo no modo permanente | Cena encerrada não escreve save; erro de armazenamento informa o jogador |
| Portabilidade | Progresso não depende apenas do cache do navegador | Exportação JSON, validação de cópias, confirmação de restauração e de nova jornada |
| Instalação | O app só promete offline quando está pronto | Precache de todos os chunks preguiçosos, fontes, ícones e páginas; indicador real; convite de instalação |
| Atualização | Uma build nova não interrompe a partida | Worker aguarda atualização solicitada no menu; cache versionado por conteúdo e limitado ao escopo do app |
| Acessibilidade | Navegação previsível | Nome e foco dos diálogos, contenção de Tab, Escape nos painéis dispensáveis, foco visível, estados de dificuldade e redução de movimento da interface |
| Encerramento | Fechamento narrativo e aprendizado | Morte e vitória com mensagens distintas, resumo, conquistas e compartilhamento |
| Curadoria | A arte pode ser inspecionada sem reduzir os pixels | Galeria por categoria, prancha em tamanho real e navegação horizontal no celular |

## Direção de arte

Aço e carvão no mundo; verde seco e papel no app; ferrugem e âmbar para ação, vermelho para dano, fósforo para progresso e radiação. Pixelify Sans na leitura, Silkscreen na identidade e VT323 nos números. Preservados os sprites procedurais para manter a proporção, a projeção e as animações do jogo.

Inspecionadas as pranchas de personagens, fauna, flora, objetos, estruturas, animações e Colosso, além das capturas de menu, base, combate, inventário, bancada, diário, NPC, viagem, encontro, hospital, mapa e morte. Não houve encomenda ou substituição de todos os sprites por arte de artista humano.

Problemas encontrados nas primeiras capturas e corrigidos: sobreposição do relógio com os controles e corte lateral da grade da mochila. O contraste baixo em receitas ainda bloqueadas é intencional; o motivo do bloqueio continua escrito. Corrigida também a prévia que repetia o mesmo veículo em vez de exibir cinco variações. As pranchas amostram famílias e clipes; não cobrem todas as combinações de seed, direção e quadro possíveis. A arte de silhueta escura deve ser testada em telas de celular sob luz externa.

## Evidências

Os resultados finais e caminhos das capturas ficam em `docs/VALIDACAO.md`. Os testes de balanço já existentes verificam dificuldade, combate, fome/sede, XP, progressão, distribuição do mundo, spawn, NPCs, viagem e arte procedural. Os testes de navegador percorrem os sistemas da campanha; a suíte do app cobre menu responsivo, navegação, offline, backup e perda de progresso.

## Validação ainda necessária

- Playtest em aparelho Android real: toque prolongado, conforto do polegar, áudio, consumo de bateria, temperatura, retomada pelo sistema e desempenho de Ultra/Alta/Leve.
- Safari/iOS real: instalação, armazenamento, compartilhamento e ciclo de vida do app.
- Rodadas longas e cegas com jogadores para medir compreensão, ritmo e dificuldade, sem usar os comandos de depuração dos smoke tests.
- Revisão independente por game designer e diretor de arte humanos para julgamento de qualidade, identidade e leitura de todos os sprites em movimento.

Multiplayer, backend, contas, nuvem e APK não fazem parte desta entrega. Não se anuncia avaliação humana nem validação física que não aconteceu.
