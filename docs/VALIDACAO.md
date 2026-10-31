# Validação — 31/10/2026

| Verificação | Resultado | Código de saída |
| --- | --- | --- |
| TypeScript (`npm run typecheck`) | Passou | 0 |
| Build estática e precache (`npm run build`) | Passou; 113 arquivos, ~3,1 MiB | 0 |
| Lógica e balanceamento (`npm run teste`) | 51/51 | 0 |
| Campanha em Chromium (`npm run smoke`) | 140/140 | 0 |
| App, offline e backup (`npm run qa:app`) | 32/32 | 0 |
| Pranchas de arte (`npm run qa:arte`) | 7/7 renderizadas, sem exceções | 0 |
| `git diff --check` | Passou | 0 |

Total: 223 verificações de lógica e navegador, além de sete pranchas renderizadas e inspecionadas visualmente por IA. Chromium do ambiente, GPU por software; não é medição de FPS ou bateria em telefone físico.

O smoke da campanha testa os sistemas com comandos de depuração e progressão acelerada. Não equivale a uma partida cega de ponta a ponta. O fluxo de vitória foi exercitado na suíte do app: restaurar cópia, liberar destino com depuração, viajar, alcançar o final, confirmar remoção do save e voltar ao menu.

Menu em 320×568, 412×915, 915×412 e 1440×900. HUD em 320 e 412 px com interface P/M/G (0,85/1/1,2). Confirmados os oito espaços por linha da mochila, diálogos por teclado, cancelamento de importação, cópia válida, save danificado, primeira partida sem rede e impossibilidade de salvar uma cena encerrada.

Logs completos em [evidencias/](evidencias/). Capturas em [capturas/](capturas/):

- [Menu antes](capturas/menu-antes.png) e [depois](capturas/menu-depois.png).
- [Base e HUD](capturas/base.png), [mochila](capturas/mochila.png), [mapa](capturas/mapa.png) e [viagem](capturas/viagem.png).
- [Morte](capturas/morte.png) e [vitória](capturas/vitoria.png).
- [Personagens](capturas/humanos.png), [fauna](capturas/animais.png), [flora](capturas/flora.png), [objetos](capturas/props.png), [estruturas](capturas/estruturas.png), [animações](capturas/clipes.png) e [Colosso](capturas/colosso.png).

A revisão encontrou e corrigiu sobreposição no HUD, corte da mochila e repetição incorreta de variações no catálogo. As famílias compartilham perspectiva isométrica, luz e paletas da biblioteca. As pranchas são amostras de categorias, não uma validação exaustiva de todas as combinações procedurais. Playtest em celular e aprovação independente humana permanecem pendentes, conforme [REVISAO.md](REVISAO.md).
