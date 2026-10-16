# Cidadela — Stacks e bibliotecas

> **Referências:** [`REQUISITOS.md`](./REQUISITOS.md) · [`SPECS.md`](./SPECS.md)  
> Stack oficial alinhada aos FRs do `SPECS.md` (turnos, tabuleiro, banco, Forte, negociações, falência).

**Versão:** 0.5  
**Status:** Stack oficial — **Three.js + React Three Fiber** · hot-seat + **Supabase** (lobby/partida online)  
**Decisão:** 2026-03-15 (evoluiu da Opção B Phaser → 3D real) · sync implementação 2026-10-16 · Supabase 2026-10-16

---

## Decisão

Tabuleiro e cena em **Three.js** via **React Three Fiber**, com shell React/Vite e motor de regras puro separado. Cada casa tem um **landmark 3D low-poly** (Elevador Lacerda, Ilhéus, Farol da Barra, etc.).

| Escolha | Valor |
| --- | --- |
| Render do tabuleiro | **Three.js** + **@react-three/fiber** + **@react-three/drei** |
| Dados | **cannon-es** + **@react-three/cannon** (visual inspirado no [tutorial Codrops](https://github.com/uuuulala/Threejs-rolling-dice-tutorial)) |
| Shell (HUD, menus) | **React 19** + Vite + Tailwind |
| Motor de regras | **TypeScript puro** (`packages/engine`) |
| Landmarks | Procedurais em `apps/game/src/landmarks/` |
| Multiplayer | **Supabase** (Postgres + Realtime + auth anônima); hot-seat local sem rede |
| Mobile nativo | Fora do MVP (PWA possível depois) |

**Histórico:** Opção B começou com Phaser (faux-3D isométrico). Substituído por Three.js para câmera orbitável, luzes, sombras e modelos por casa.

---

## 1. O que a stack precisa atender

| Necessidade | Origem |
| --- | --- |
| Motor de regras determinístico | FR-10…FR-83 |
| Estado de partida (2–8 jogadores) | FR-01 |
| Tabuleiro 3D + landmarks por casa | FR-90, NFR-10 |
| HUD React (carteira: saldo, escrituras, cartas) | PUC / NFR |
| Hot-seat local → multiplayer depois | SPECS §27 |
| pt-BR e temática baiana | NFR-70, NFR-71 |

---

## 2. Arquitetura oficial

```
┌──────────────────────────────────────────────────┐
│  Shell React (Vite)                              │
│  HUD DOM · lobby (futuro) · modais               │
├──────────────────────────────────────────────────┤
│  React Three Fiber Canvas                        │
│  BoardTable · SpaceTile · Landmark · OrbitControls│
├──────────────────────────────────────────────────┤
│  packages/shared — BOARD[40], tipos              │
├──────────────────────────────────────────────────┤
│  packages/engine — regras puras (stub → futuro)  │
└──────────────────────────────────────────────────┘
```

**Princípio:** o `engine` não importa Three/React. A cena só visualiza estado e dispara seleção/ações.

---

## 3. Stack detalhada

| Camada | Tecnologia |
| --- | --- |
| Linguagem | TypeScript |
| Bundler | Vite |
| UI shell | React 19 + Tailwind |
| 3D | three + @react-three/fiber + @react-three/drei |
| Dados | @cidadela/shared |
| Testes | Vitest em `packages/shared` (`pnpm test`) |
| Pacotes | pnpm workspaces |

### Estrutura

```
cidadela/
  packages/
    engine/          # dados (roll)
    shared/          # regras: board, rent, jail, auction, trade, falência…
  apps/
    game/
      src/
        landmarks/     # modelos 3D por casa
        scene/         # BoardCanvas, tiles, peões, dados
        ui/            # BoardHud · Wallet · Auction · Trade · Victory
```

---

## 4. Multiplayer (Supabase)

- **Lobby online:** tabelas `rooms` / `room_members`; link + QR; Realtime.
- **Partida:** `games.state` (JSONB `GameSnapshot`) + `game_actions` (intents).
- **Autoridade:** anfitrião aplica `@cidadela/shared` no cliente e grava o snapshot; convidados enviam intents e hidratam via Realtime.
- **Hot-seat local (FR-05h):** não usa Supabase.
- **Setup:** copie [`.env.example`](./.env.example) → `.env` na raiz (Vite `envDir`); rode [`supabase/migrations/001_rooms_games.sql`](./supabase/migrations/001_rooms_games.sql) no SQL Editor; ative **Anonymous Sign-Ins**.

---

## 5. Checklist de bootstrap

- [x] Monorepo pnpm: `packages/engine`, `packages/shared`, `apps/game`
- [x] Vite + React + Tailwind no `apps/game`
- [x] Three.js + R3F (tabuleiro 3D)
- [x] Landmarks 3D para as 40 casas
- [x] Bridge “Rolar dados” → engine → peão
- [x] Regras de partida em `packages/shared` (casa, Forte, cartas, leilão, trade, falência, fim)
- [x] Vitest FRs críticos (`pnpm test` / `@cidadela/shared`)
- [x] Hot-seat local completo (turnos, dívida, leilão, negociação, vitória)
- [ ] Estado de partida unificado no `engine` (hoje orquestrado no `App.tsx`)
- [x] Supabase: salas + sync de partida (host-authoritative)
- [ ] Edge Function como autoridade de regras (anti-cheat, opcional)

### Checklist do tabuleiro / UI

- [x] Dados 0–39 em `packages/shared`
- [x] Render 10 casas por lado (plano XZ)
- [x] Cores por grupo / tipo
- [x] Seleção + HUD React
- [x] Visual 3D real (Three.js, orbit, luzes, sombras)
- [x] Landmark por casa (low-poly)
- [x] Elevador Lacerda via GLTF (`/models/elevador-lacerda.gltf`)
- [x] Peões na casa (8 tokens baianos, slots, animação)
- [x] Path/waypoints — movimento casa a casa no perímetro
- [x] Dados 3D com física (cantos/pips Codrops + cannon-es; dupla / 3ª → Forte)
- [x] Carteira (saldo $1.500, escrituras, cartas; compra básica; +$200 Chegada)
- [x] Baralhos Fitinha (16) + Bença (16); comprar carta; Proteção na carteira
- [x] Cartas: transporte×2 / companhia 10×dados; resolve casa após movimento
- [x] Escritura detalhada (aluguel/construção) + hipotecar/resgatar/vender/construir
- [x] Carteira UI 2D fixa na tela (abrir/fechar animado, escrituras e cartas)
- [x] Leilão (escritura, peça escassa, empate nos dados)
- [x] Negociação entre jogadores
- [x] Aluguel pedido (FR-22a) + overlay de vitória
- [ ] Pousadas/resorts visíveis nas casas 3D
- [x] Lobby anfitrião (qtd + link/QR) e entrada de convidados (nome/peão) via Supabase
- [x] Lobby local "Jogar neste aparelho" (hot-seat, FR-05h)
- [x] Sync de sala e partida multi-aparelho (Supabase Realtime)
- [x] Loading inicial com avião (pré-carga de assets)
- [ ] Áudio/FX (`SPECS.md` §17b): SFX dinheiro/imposto; Carnaval+Canário; viatura → Forte; guincho ao vender construção

---

## 6. Decisões fechadas

1. MVP **hot-seat** + **online Supabase** (host aplica regras)
2. HUD **React overlay**
3. Tabuleiro **Three.js** com landmarks procedurais
4. Phaser **descontinuado** neste projeto
5. Regras tipadas em **`packages/shared`**; `engine` focado em dados por enquanto
6. Aluguel digital padrão: **claim** (dono cobra); auto só via opção de API (`rentMode`)

---

*Stack oficial v0.4 — Three.js + hot-seat. Atualizar se landmarks passarem a GLTF externos ou se o multiplayer entrar.*
