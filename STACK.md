# Cidadela — Stacks e bibliotecas

> **Referências:** [`REQUISITOS.md`](./REQUISITOS.md) · [`SPECS.md`](./SPECS.md)  
> Stack oficial alinhada aos FRs do `SPECS.md` (turnos, tabuleiro, banco, Forte, negociações, falência).

**Versão:** 0.7  
**Status:** Stack oficial — **Three.js + R3F** · hot-seat + **Supabase** (reconnect/presença) · HUD mobile · i18n · SFX UI + Carnaval  
**Decisão:** 2026-03-15 (Phaser → 3D) · sync 2026-10-16 · áudio/docs 2026-10-17 · online/mobile/i18n 2026-10-17

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
| Multiplayer | **Supabase** (Postgres + Realtime + Presence + auth anônima); hot-seat local sem rede |
| i18n | **i18next** + react-i18next (`pt-BR` / `en` / `ar`, RTL) |
| Mobile web | HUD bottom sheet + safe-area; PWA nativo fora do MVP |

**Histórico:** Opção B começou com Phaser (faux-3D isométrico). Substituído por Three.js para câmera orbitável, luzes, sombras e modelos por casa.

---

## 1. O que a stack precisa atender

| Necessidade | Origem |
| --- | --- |
| Motor de regras determinístico | FR-10…FR-83 |
| Estado de partida (2–8 jogadores) | FR-01 |
| Tabuleiro 3D + landmarks por casa | FR-90, NFR-10 |
| HUD React (carteira: saldo, escrituras, cartas) | PUC / NFR |
| Hot-seat (DEV) + multiplayer online | FR-05…05m |
| pt-BR + en + ar (UI/cartas) | NFR-71…73 |
| HUD usável no celular | NFR-23…25 |

---

## 2. Arquitetura oficial

```
┌──────────────────────────────────────────────────┐
│  Shell React (Vite)                              │
│  Lobby · Loading · HUD · Wallet · overlays       │
│  i18n · OnlineStatusBanner · session persist     │
├──────────────────────────────────────────────────┤
│  React Three Fiber Canvas                        │
│  BoardTable · SpaceTile · Landmark · OrbitControls│
├──────────────────────────────────────────────────┤
│  session/ — room + gameSync (Supabase Realtime)  │
├──────────────────────────────────────────────────┤
│  packages/shared — BOARD[40], regras tipadas     │
├──────────────────────────────────────────────────┤
│  packages/engine — dados (roll)                  │
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
| Áudio | HTMLAudioElement (`audio/sfx.ts`); Kenney UI + OGG Carnaval; SFX de dados/economia ainda não |
| i18n | i18next · locales em `apps/game/src/i18n/` |
| Pacotes | pnpm workspaces |

### Estrutura

```
cidadela/
  packages/
    engine/          # dados (roll)
    shared/          # regras: board, rent, jail, auction, trade, falência…
  apps/
    game/
      public/
        sounds/      # ui/ · carnaval/ · dice/ · game/ (grana, aluguel, leilão, vez, sem_sorte)
        flags/       # br · us · sa (LanguagePicker)
      src/
        audio/       # sfx.ts · sfxCatalog · sfxOverrides (IndexedDB) · mute
        i18n/        # pt-BR · en · ar + tCard
        landmarks/   # modelos 3D por casa
        scene/       # BoardCanvas, tiles, peões, dados
        session/     # room · gameSync · onlinePersist · gameSnapshot
        ui/          # BoardHud · Wallet · SfxAdminScreen · overlays
  supabase/
    migrations/      # 001_rooms_games.sql
```

---

## 4. Multiplayer (Supabase)

- **Lobby online:** tabelas `rooms` / `room_members`; link + QR; Realtime.
- **Partida:** `games.state` (JSONB `GameSnapshot`) + `game_actions` (intents).
- **Autoridade:** anfitrião aplica `@cidadela/shared` no cliente e grava o snapshot; convidados enviam intents e hidratam via Realtime.
- **Reconnect (FR-05i):** `?room=` na URL + `sessionStorage` (`onlinePersist.ts`); membro existente pode reentrar em sala `playing`.
- **Presença (FR-05j):** canal Realtime Presence; banner se o host sumir; guests não enviam intents enquanto `hostAway`.
- **Resiliência:** conflito de versão no push → hydrate remoto; guest faz poll ~6s de backup.
- **Auth de intents (FR-05k):** host valida actor (vez / aluguel / dívida / leilão) antes de aplicar.
- **Hot-seat local (FR-05h):** não usa Supabase; só em `import.meta.env.DEV`.
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
- [x] Lobby local "Jogar neste aparelho" (hot-seat FR-05h, **somente DEV**)
- [x] Sync de sala e partida multi-aparelho (Supabase Realtime)
- [x] Reconnect / presença / auth de intents / poll de backup
- [x] Loading inicial com avião (pré-carga de assets)
- [x] HUD mobile (barra inferior recolhível) + banner de sync
- [x] i18n pt-BR / en / ar (UI, mensagens, cartas)
- [x] SFX UI Lobby (`audio/sfx.ts` + mute)
- [x] Música Carnaval ao aterrissar (OGG; para ao sair/mute)
- [x] SFX partida: ganhar $, aluguel, leilão, vez, carta azar (`playGameSfx`)
- [ ] Áudio de partida — restante (`SPECS.md` §17b):
  - [ ] **Dados / peão / UI partida** + demais ações (compra, hipoteca, vitória…)
  - [ ] Pool Canário + FX leves no Carnaval
  - [ ] Mute/volume na partida (mute Lobby ok)
  - [ ] Animação viatura → Forte + sirene
  - [ ] Animação guincho ao vender construção + SFX
- [ ] Transferência de host / Edge Function autoridade
- [ ] i18n dos nomes das casas

---

## 6. Decisões fechadas

1. MVP **hot-seat (DEV)** + **online Supabase** (host aplica regras)
2. HUD **React overlay** (desktop painel lateral; mobile bottom sheet)
3. Tabuleiro **Three.js** com landmarks procedurais
4. Phaser **descontinuado** neste projeto
5. Regras tipadas em **`packages/shared`**; `engine` focado em dados por enquanto
6. Aluguel digital padrão: **claim** (dono cobra); auto só via opção de API (`rentMode`)
7. Áudio: SFX curtos via HTMLAudio; música Carnaval em pool; mute não cancela animações
8. i18n: UI/cartas traduzíveis; **nomes do tabuleiro** ficam em pt até decisão explícita
9. Online: reconnect via URL + sessionStorage; presença do host; sem handoff de host no MVP

---

*Stack oficial v0.7 — Three.js + Supabase + mobile/i18n. Ver `SPECS.md` §17b e `REQUISITOS.md` §16.*
