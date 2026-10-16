import { describe, expect, it } from "vitest";
import {
  createPlayersFromLobby,
  validateLobbySetup,
  type LobbySetup,
} from "./pawns";

describe("FR-05 Lobby", () => {
  it("aceita setup 2–8 com peões únicos e banqueiro", () => {
    const setup: LobbySetup = {
      seats: [
        { name: "Ana", pawnId: "oobi" },
        { name: "Bia", pawnId: "oodi" },
      ],
      bankerIndex: 1,
    };
    expect(validateLobbySetup(setup).ok).toBe(true);
    const players = createPlayersFromLobby(setup);
    expect(players).toHaveLength(2);
    expect(players[0]!.name).toBe("Ana");
    expect(players[1]!.isBanker).toBe(true);
    expect(players[0]!.cash).toBe(1500);
    expect(players[0]!.position).toBe(0);
  });

  it("rejeita peão duplicado e nome vazio", () => {
    expect(
      validateLobbySetup({
        seats: [
          { name: "A", pawnId: "oobi" },
          { name: "B", pawnId: "oobi" },
        ],
        bankerIndex: 0,
      }).ok,
    ).toBe(false);
    expect(
      validateLobbySetup({
        seats: [
          { name: "  ", pawnId: "oobi" },
          { name: "B", pawnId: "oodi" },
        ],
        bankerIndex: 0,
      }).ok,
    ).toBe(false);
  });
});
