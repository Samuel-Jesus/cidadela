# Cidadela — Stacks e bibliotecas

> **Referências:** [`REQUISITOS.md`](./REQUISITOS.md) · [`SPECS.md`](./SPECS.md)  
> Stack oficial alinhada aos FRs do `SPECS.md` (turnos, tabuleiro, banco, Forte, negociações, falência).

**Versão:** 0.2  
**Status:** Stack oficial — **Opção B (Canvas / Phaser)**  
**Decisão:** 2026-03-15

---

## Decisão

Adotamos a **Opção B**: tabuleiro e cena de jogo em **canvas (Phaser 3)**, com shell web em TypeScript/Vite e motor de regras puro separado.

| Escolha | Valor |
| --- | --- |
| Render do tabuleiro | **Phaser 3** |
| Shell (lobby, HUD overlay, fim de jogo) | **React 19** + Vite |
| Motor de regras | **TypeScript puro** (`packages/engine`) |
| Multiplayer | Fase 2 (Colyseus ou PartyKit) |
| Mobile nativo | Fora do MVP (PWA possível depois) |

**Por quê Phaser (e não só Pixi):** cenas, input, tweens, áudio e câmera prontos — adequado a peões, dados, cartas e efeitos (carnaval, Forte), sem reinventar o loop de jogo. Pixi fica como alternativa só se precisarmos de render “cru” sem framework.

---

## 1. O que a stack precisa atender

| Necessidade | Origem |
| --- | --- |
| Motor de regras determinístico (dados, casas, aluguel, cartas, Forte) | FR-10…FR-83 |
| Estado de partida compartilhado (2–8 jogadores) | FR-01, PUC 1–11 |
| UI de tabuleiro + painéis (saldo, escrituras, cartas) | FR-90, NFR-10 |
| Hot-seat local primeiro; multiplayer depois | SPECS §27 |
| Validação anti-trapaça no servidor (fase online) | NFR-60 |
| pt-BR e temática baiana | NFR-70, NFR-71 |
| Testes unitários das regras (fit criteria) | SPECS Snow Cards |
| Animações de peão, dados, cartas e efeitos | Opção B |

---

## 2. Arquitetura oficial (Opção B)

```
┌──────────────────────────────────────────────────┐
│  Shell React (Vite)                              │
│  lobby · configuração · HUD DOM · modais         │
├──────────────────────────────────────────────────┤
│  Bridge React ↔ Phaser                           │
│  eventos / store (Zustand) / refs do game        │
├──────────────────────────────────────────────────┤
│  Phaser 3 — cenas                                │
│  Boot · Preload · Board · Dice · Cards FX        │
├──────────────────────────────────────────────────┤
│  Estado da partida (client)                      │
│  Zustand + (opcional) XState para fluxos         │
├──────────────────────────────────────────────────┤
│  Motor de regras (TypeScript puro)               │
│  ações → novo estado (sem I/O, sem Phaser)       │
├──────────────────────────────────────────────────┤
│  Sync (fase 2)                                   │
│  Colyseus / PartyKit                             │
└──────────────────────────────────────────────────┘
```

**Princípios:**

1. O **engine** não importa Phaser nem React — só estado e ações.
2. O **Phaser** só visualiza e anima; após animação, confirma a ação no engine (ou aplica estado já resolvido).
3. O **React** cuida de menus, textos longos, negociação e formulários; o canvas cuida do tabuleiro.

---

## 3. Stack oficial — detalhamento

| Camada | Tecnologia | Papel |
| --- | --- | --- |
| Linguagem | **TypeScript** | Estado, cartas, ações tipadas (`SPECS.md` §7) |
| Bundler | **Vite** | App web + HMR |
| Shell UI | **React 19** | Lobby, HUD overlay, negociação, falência |
| Estilo do shell | **Tailwind CSS** + CSS variables | Temática baiana nos menus |
| Roteamento | **React Router** | `/` → `/partida/:id` → `/resultado` |
| Canvas / jogo | **Phaser 3** (`phaser`) | Tabuleiro 40 casas, peões, dados, FX |
| Integração | `@phaserjs/vite-plugin` ou canvas ref manual | Embutir Game no React |
| Estado client | **Zustand** | Espelho do estado do engine para React + Phaser |
| Fluxos complexos | **XState** v5 (opcional) | Turno, Forte, leilão |
| Validação | **Zod** | Contratos de ação (client e futuro server) |
| Imutabilidade | **Immer** (opcional) | Reducers do engine |
| RNG | **seedrandom** (ou PRNG próprio) | Replay e testes determinísticos |
| Áudio | Phaser Sound e/ou **Howler.js** | Efeitos e tema |
| Testes do motor | **Vitest** | FRs (Chegada, 3 duplas, hipoteca…) |
| Testes E2E (depois) | **Playwright** | Fluxos shell + canvas smoke |
| Qualidade | **ESLint** + **Prettier** | Padrão do repo |
| Pacotes | **pnpm** workspaces | Monorepo |

### Estrutura do monorepo

```
cidadela/
  packages/
    engine/          # motor de regras (TS puro) — Vitest aqui
    shared/          # tipos, Zod, dados do tabuleiro (casas 0–39)
  apps/
    game/            # Vite + React shell + Phaser
```

### Cenas Phaser sugeridas

| Cena | Responsabilidade |
| --- | --- |
| `BootScene` | Config mínima, escala |
| `PreloadScene` | Assets (tabuleiro, peões, dados, cartas) |
| `BoardScene` | Tabuleiro, peões, highlights de casa, câmera |
| `HudBridge` | Não é cena: eventos para o React (saldo, botões) |

Modais de compra/leilão/negociação preferencialmente em **React** (acessibilidade e formulários); Phaser dispara `ui:promptBuy`, `ui:promptAuction`, etc.

---

## 4. Multiplayer (fase 2)

| Lib / serviço | Uso |
| --- | --- |
| **Colyseus** (preferencial) | Room 2–8, estado autoritativo rodando o mesmo `engine` |
| **PartyKit** | Alternativa leve na edge |

**Padrão:** cliente envia *intent* → servidor aplica no `engine` → broadcast do estado → Phaser anima a transição.

Backend mínimo: **Node.js** + **Hono** ou **Fastify**; persistência só se precisar de replay/histórico.

---

## 5. Libs por domínio

| Domínio | Abordagem |
| --- | --- |
| Movimento do peão | Tweens Phaser no caminho das casas |
| Dados | Sprites/animação Phaser; resultado vem do engine |
| Cartas Fitinha / Bença | Overlay React ou sprite Phaser + texto |
| Negociação | UI React (`@dnd-kit` se fizer sentido) |
| Tabuleiro (dados) | Constantes em `shared` a partir de `REQUISITOS.md` |
| i18n | pt-BR fixo no MVP |

---

## 6. O que evitar no MVP

| Evitar | Motivo |
| --- | --- |
| Pixi + engine de cenas caseiro | Phaser já cobre o caso |
| Unity / Unreal | Overkill para este gênero |
| Lógica de regras dentro das Scenes | Quebra testes e sync futuro |
| Redux completo | Zustand basta |
| Banco de dados cedo | Hot-seat em memória |
| Mobile nativo (Expo) no MVP | Web + Phaser primeiro |

---

## 7. Opções consideradas (histórico)

| Opção | Resumo | Status |
| --- | --- | --- |
| **A — Web DOM/SVG** | React + tabuleiro HTML | Descartada para o visual principal |
| **B — Canvas Phaser** | React shell + Phaser board | **Adotada** |
| **C — Expo / Flutter** | Mobile nativo | Adiada |

---

## 8. Checklist de bootstrap

- [ ] Monorepo pnpm: `packages/engine`, `packages/shared`, `apps/game`
- [ ] Vite + React + Tailwind no `apps/game`
- [ ] Phaser 3 integrado (Game instance + `BoardScene` vazia)
- [ ] Bridge mínima: botão React “Rolar dados” → ação no engine → tween do peão
- [ ] `engine` com estado inicial (2–8 jogadores, $1500, posição 0)
- [ ] Vitest: Chegada +$200, três duplas → Forte
- [ ] Assets placeholder (tabuleiro geométrico, peões coloridos)
- [ ] Hot-seat local (sem rede)
- [ ] Colyseus/PartyKit só na fase 2

---

## 9. Decisões ainda abertas

1. MVP **só hot-seat** ou já esboçar salas online?
2. HUD: **100% React overlay** ou parte dos painéis dentro do Phaser?
3. Resolução base do canvas (ex.: 1920×1080 vs. quadrado do tabuleiro)?

---

*Stack oficial v0.2 — Opção B. Atualizar este arquivo se Phaser for trocado por Pixi ou se o shell React for removido (Phaser all-in).*
