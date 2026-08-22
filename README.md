# Scoundrel (Angular)

Implementação do card game solo **Scoundrel** (regras em `../Scoundrel.md`) em Angular 21, com o mesmo visual retrô inspirado em Balatro da versão vanilla JS do projeto, usando os spritesheets em `../` (copiados para `public/assets/`).

## Como rodar

```bash
npm install
npm start        # ng serve — http://localhost:4200
npm run build    # build de produção em dist/
```

## Arquitetura

```
src/app/
  core/                     # lógica e estado, sem conhecimento de UI
    config/                 # regras do jogo e mapeamento dos spritesheets
    models/                 # tipos (Card, GameEvent, ...)
    services/
      game-engine.service.ts  # máquina de estado do Scoundrel (signals + eventos)
      deck.service.ts         # construção/embaralhamento do baralho
      audio.service.ts        # SFX + trilha, sintetizados via Web Audio API
      game-log.service.ts     # eventos → entradas de registro
      game-sounds.service.ts  # eventos → efeitos sonoros
      viewport.service.ts     # breakpoint mobile (Angular CDK)
  shared/components/         # RetroButton, ModalShell — genéricos, sem estado de jogo
  features/game/
    components/              # um componente por painel/peça de UI (todos "burros")
    models/                  # view-models da UI (RoomSlotVm)
    game-page/                # container: liga engine ↔ componentes de apresentação
```

Fluxo de dependência sempre em uma direção: `game-page` injeta os services do `core` e
repassa dados prontos (via `@Input`) para componentes de apresentação, que só emitem
eventos de volta (`@Output`). Nenhum componente de painel conhece o `GameEngineService`.

## UI dedicada para mobile

Abaixo de **640px** de largura (`ViewportService`, baseado em `@angular/cdk/layout`),
`GamePage` renderiza `GameLayoutMobile` em vez de `GameLayoutDesktop`. Não é apenas CSS
responsivo espremendo o mesmo layout — é uma disposição própria, pensada para toque:

- Barra superior compacta: título, baralho + sala (texto direto, sem painel próprio) e
  um botão de menu (☰).
- Vida e o botão CORRER dividem uma única linha — a ação mais frequente fica ao lado do
  indicador mais importante, sem gastar uma linha inteira só para cada um.
- Painel de arma sozinho (sem disputar espaço com o baralho) e maior: a pilha de
  monstros derrotados com a arma atual (`EquippedWeapon.kills`) é renderizada em cartas
  do **mesmo tamanho** da arma, cada uma com uma leve rotação (`WeaponPanel.pile`), e no
  mobile a pilha transborda de propósito a borda inferior do painel — efeito 3D, como
  se as cartas estivessem empilhadas por cima. No desktop o mesmo visual fica contido
  (a versão compacta só aumenta o espalhamento vertical).
- Mesa da sala em destaque, com cartas maiores que a primeira versão do layout mobile
  (`Room` aceita `cardScale`/`dense` para isso) — é o elemento mais importante da tela.
- **Menu de pausa** (☰) consolida tudo que não é ação de cada carta: registro de eventos,
  NOVA PARTIDA e os toggles de música/som. Fora do menu, a tela principal só tem o que
  o jogador usa a cada jogada.

Ambos os layouts recebem exatamente o mesmo contrato de `@Input`/`@Output` e reusam os
mesmos componentes de painel (`HpPanel`, `WeaponPanel`, `AudioControls`), cada um com uma
variante `compact` — nada de lógica duplicada entre desktop e mobile, só a disposição
muda. `DeckPanel` é exclusivo do desktop; no mobile a contagem de baralho e a sala viram
texto simples na barra superior.

## Como estender

- **Mudar regras numéricas**: `core/config/game.config.ts` (`GAME_RULES`).
- **Nova mecânica de carta**: adicione o `role` em `SUIT_META`, trate-o no `switch` de
  `GameEngineService.resolveCard` e no `hintFor()` de `GamePage`.
- **Novo painel/variante visual**: crie um componente em `features/game/components/`;
  se precisar de uma versão compacta para mobile, siga o padrão `compact = input(false)`
  já usado em `HpPanel`/`WeaponPanel`/`DeckPanel`/`AudioControls`.
- **Ajustar o breakpoint mobile**: `core/services/viewport.service.ts` (`MOBILE_BREAKPOINT`).
- **Testar o engine isoladamente**: `GameEngineService` não depende de Angular além de
  `signal`/`computed` — dá para instanciar e chamar `newGame()`/`resolveCard()` direto
  em um teste unitário, sem TestBed.
