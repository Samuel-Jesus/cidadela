# Cidadela — Stacks e bibliotecas

> **Referências:** [`REQUISITOS.md`](./REQUISITOS.md) · [`SPECS.md`](./SPECS.md)  
> Stack oficial alinhada aos FRs do `SPECS.md` (turnos, tabuleiro, banco, Forte, negociações, falência).

**Versão:** 0.3  
**Status:** Stack oficial — **Three.js + React Three Fiber**  
**Decisão:** 2026-03-15 (evoluiu da Opção B Phaser → 3D real)

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
| Multiplayer | Fase 2 (Colyseus ou PartyKit) |
| Mobile nativo | Fora do MVP (PWA possível depois) |

**Histórico:** Opção B começou com Phaser (faux-3D isométrico). Substituído por Three.js para câmera orbitável, luzes, sombras e modelos por casa.

---

## 1. O que a stack precisa atender

| Necessidade | Origem |
| --- | --- |
| Motor de regras determinístico | FR-10…FR-83 |
| Estado de partida (2–8 jogadores) | FR-01 |
| Tabuleiro 3D + landmarks por casa | FR-90, NFR-10 |
| HUD React (saldo, escrituras, cartas) | PUC / NFR |
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
| Testes (futuro) | Vitest no engine |
| Pacotes | pnpm workspaces |

### Estrutura

```
cidadela/
  packages/
    engine/
    shared/
  apps/
    game/
      src/
        landmarks/     # modelos 3D por casa
        scene/         # BoardCanvas, tiles, mesa
        ui/            # BoardHud
```

---

## 4. Multiplayer (fase 2)

Colyseus (preferencial) ou PartyKit — cliente envia intent → server aplica `engine` → sync estado → cena anima.

---

## 5. Checklist de bootstrap

- [x] Monorepo pnpm: `packages/engine`, `packages/shared`, `apps/game`
- [x] Vite + React + Tailwind no `apps/game`
- [x] Three.js + R3F (tabuleiro 3D)
- [x] Landmarks 3D para as 40 casas
- [x] Bridge “Rolar dados” → engine → peão
- [ ] `engine` com estado inicial completo (dice ok; partida TBD)
- [ ] Vitest FRs
- [ ] Hot-seat local completo
- [ ] Colyseus/PartyKit fase 2

### Checklist do tabuleiro

- [x] Dados 0–39 em `packages/shared`
- [x] Render 10 casas por lado (plano XZ)
- [x] Cores por grupo / tipo
- [x] Seleção + HUD React
- [x] Visual 3D real (Three.js, orbit, luzes, sombras)
- [x] Landmark por casa (low-poly)
- [x] Peões na casa (8 tokens baianos, slots, animação)
- [x] Dados 3D com física (cantos/pips Codrops + cannon-es; dupla / 3ª → Forte)
- [ ] Path/waypoints para movimento casa a casa

---

## 6. Decisões fechadas

1. MVP **hot-seat** (rede na fase 2)
2. HUD **React overlay**
3. Tabuleiro **Three.js** com landmarks procedurais
4. Phaser **descontinuado** neste projeto

---

*Stack oficial v0.3 — Three.js. Atualizar se landmarks passarem a GLTF externos.*
