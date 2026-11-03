# CINZAS

Survival pós-nuclear solo em pixel art isométrica, pensado para celular na vertical. Campanha de 24 objetivos em quatro atos: montar o abrigo, explorar, crescer e seguir o sinal do Abrigo 7.

## Jogar como app

Abra no Chrome do Android e use **Instalar app**. No iPhone, **Compartilhar → Adicionar à Tela de Início**. Espere o menu confirmar **Disponível offline neste aparelho**: o app baixa os arquivos da primeira partida, incluindo o motor e as fontes (~3,1 MiB).

O progresso fica no navegador e no domínio em que você joga. Em **Configurações → Seu progresso**, exporte uma cópia antes de trocar de aparelho, domínio ou limpar os dados. A restauração pede confirmação. Calmo permite retornar ao abrigo após desmaiar; Normal e Brutal encerram a jornada ao morrer. Conquistas e recordes persistem.

## Desenvolver e verificar

```sh
npm ci
npm run dev
npm run typecheck
npm run teste
npm run build
CHROME=/usr/bin/chromium npm run smoke
CHROME=/usr/bin/chromium npm run qa:app
CHROME=/usr/bin/chromium npm run qa:arte
```

`build` gera `out/` e o manifesto offline com versão derivada dos arquivos. Publique a pasta inteira; não copie apenas `index.html`. Para subpasta, defina `NEXT_PUBLIC_BASE_PATH` na build. Os scripts de navegador usam Chrome/Chromium instalado; `smoke` aceita a pasta de capturas como argumento.

## Estrutura

- `components/`: app, menu, painéis e controles; `Cartao` concentra o comportamento dos diálogos.
- `game/`: cena Phaser, estado e sistemas da campanha. `dados/` define conteúdo e balanço; `lib/` gera sprites.
- `game/sistemas/salvar.ts`: saves legados, validação e cópias portáveis.
- `tools/offline.mjs` + `public/sw.js`: pacote offline e atualização solicitada no menu, sem reiniciar uma partida.
- `/arte/`: sete pranchas navegáveis em tamanho real para curadoria dos assets.

A Vercel original continua vinculada ao repositório GitHub. `.openai/hosting.json` identifica a versão de revisão no Sites; não altera a configuração Vercel.

Veja [revisão de design e limites de validação](docs/REVISAO.md), [créditos](CREDITS.md) e [histórico](HANDOFF.md). A versão é PWA, sem APK, conta, sincronização na nuvem ou multiplayer implementados.
