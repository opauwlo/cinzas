# CINZAS — instruções para o Claude

Comece lendo `HANDOFF.md` (contexto, decisões, módulos e próximos passos).

## Como o Uwlo gosta de trabalhar
- Português, mensagens curtas e diretas.
- Shell com assert de qualidade: `set -euo pipefail`; sem `;` após etapa que importa; edições por script conferem que o texto foi achado; artefatos conferidos (existem, não vazios, desta execução); tudo com `timeout`; builds longas desacopladas com log + arquivo de status (nunca `tail -f` sem fim); reportar o código de saída real; um objetivo por comando.
- Push e deploy só no fim, depois dos testes.
- Ele usa só celular: entregue sempre um link que abra no celular.

## Regras do projeto
- Usar módulos da comunidade com licença que permita; não reinventar. Registrar todo terceiro em `CREDITS.md` com a licença.
- Não rodar Makefile/scripts de repositórios de terceiros; compilar/empacotar com as ferramentas do projeto.
- Neurodesign só com técnicas honestas (lista em `HANDOFF.md` §4). Nada de quase-vitória manipulada, prova social falsa, desconto fictício ou timer falso.
  - **Única exceção (decidida pelo Uwlo, 31/out):** o **Modo Estudo** (`?estudo=1`, `game/estudo.ts`), para reportagem sobre manipulação. Sem cobrança real (não existe pagamento no código), tudo registrado como "mostrado x verdade" e sempre fechado pela tela de Revelação. Fora desse modo, vale a regra honesta.
- Testes: por enquanto só smoke tests.
