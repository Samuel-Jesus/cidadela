export type SfxCategory = "ui" | "dice" | "game" | "carnaval";

export type SfxSlot = {
  id: string;
  category: SfxCategory;
  key: string;
  label: string;
  description: string;
  defaultUrl: string;
  loop?: boolean;
  playMode: "oneshot" | "loop" | "music";
};

export const SFX_CATEGORY_LABELS: Record<SfxCategory, string> = {
  ui: "UI / Lobby",
  dice: "Dados",
  game: "Partida",
  carnaval: "Carnaval",
};

export const SFX_SLOTS: readonly SfxSlot[] = [
  {
    id: "ui:click",
    category: "ui",
    key: "click",
    label: "Clique",
    description: "Botões e CTAs do lobby",
    defaultUrl: "/sounds/ui/click_004.ogg",
    playMode: "oneshot",
  },
  {
    id: "ui:hover",
    category: "ui",
    key: "hover",
    label: "Hover",
    description: "Passar o mouse em botões do lobby",
    defaultUrl: "/sounds/ui/pluck_001.ogg",
    playMode: "oneshot",
  },
  {
    id: "ui:back",
    category: "ui",
    key: "back",
    label: "Voltar",
    description: "Ações de voltar / cancelar no lobby",
    defaultUrl: "/sounds/ui/back_004.ogg",
    playMode: "oneshot",
  },
  {
    id: "ui:select",
    category: "ui",
    key: "select",
    label: "Selecionar",
    description: "Escolher peão / opção",
    defaultUrl: "/sounds/ui/select_001.ogg",
    playMode: "oneshot",
  },
  {
    id: "ui:switch",
    category: "ui",
    key: "switch",
    label: "Trocar",
    description: "Carrossel de peões",
    defaultUrl: "/sounds/ui/switch_001.ogg",
    playMode: "oneshot",
  },
  {
    id: "ui:error",
    category: "ui",
    key: "error",
    label: "Erro",
    description: "Mensagens de erro do lobby",
    defaultUrl: "/sounds/ui/error_003.ogg",
    playMode: "oneshot",
  },
  {
    id: "dice:mix",
    category: "dice",
    key: "mix",
    label: "Misturar dados",
    description: "Loop enquanto os dados rolam",
    defaultUrl: "/sounds/dice/mix_dices.ogg",
    loop: true,
    playMode: "loop",
  },
  {
    id: "dice:fall",
    category: "dice",
    key: "fall",
    label: "Dados caem",
    description: "Quando os dados param",
    defaultUrl: "/sounds/dice/fall_dices.ogg",
    playMode: "oneshot",
  },
  {
    id: "game:cashGain",
    category: "game",
    key: "cashGain",
    label: "Ganhar dinheiro",
    description: "Chegada +$200, cartas a favor, créditos",
    defaultUrl: "/sounds/game/ganhar_grana.ogg",
    playMode: "oneshot",
  },
  {
    id: "game:badLuck",
    category: "game",
    key: "badLuck",
    label: "Carta sem sorte",
    description: "Carta com efeito ruim (prisão, pagar, voltar…)",
    defaultUrl: "/sounds/game/sem_sorte.ogg",
    playMode: "oneshot",
  },
  {
    id: "game:auctionStart",
    category: "game",
    key: "auctionStart",
    label: "Leilão inicia",
    description: "Ao abrir um leilão",
    defaultUrl: "/sounds/game/start_leilao.ogg",
    playMode: "oneshot",
  },
  {
    id: "game:yourTurn",
    category: "game",
    key: "yourTurn",
    label: "Vez de jogar",
    description: "Quando a vez passa para o próximo jogador",
    defaultUrl: "/sounds/game/vez_de_jogar.ogg",
    playMode: "oneshot",
  },
  {
    id: "game:payRent",
    category: "game",
    key: "payRent",
    label: "Pagar aluguel",
    description: "Quando surge dívida de aluguel",
    defaultUrl: "/sounds/game/pagar_aluguel_perder_grana.ogg",
    playMode: "oneshot",
  },
  {
    id: "game:tiros",
    category: "game",
    key: "tiros",
    label: "Tiros (viatura)",
    description: "Loop durante escolta da viatura ao Forte",
    defaultUrl: "/sounds/game/magiaz_tiros.mp3",
    loop: true,
    playMode: "loop",
  },
  {
    id: "game:pawnStep",
    category: "game",
    key: "pawnStep",
    label: "Passo do peão",
    description: "Som a cada casa no caminho",
    defaultUrl: "",
    playMode: "oneshot",
  },
  {
    id: "game:pawnLand",
    category: "game",
    key: "pawnLand",
    label: "Peão aterrissa",
    description: "Chegou na casa final do movimento",
    defaultUrl: "",
    playMode: "oneshot",
  },
  {
    id: "game:payTax",
    category: "game",
    key: "payTax",
    label: "Pagar / imposto",
    description: "Débito genérico / Pedágio / Abadá",
    defaultUrl: "",
    playMode: "oneshot",
  },
  {
    id: "game:buyDeed",
    category: "game",
    key: "buyDeed",
    label: "Comprar escritura",
    description: "Confirmação de compra",
    defaultUrl: "",
    playMode: "oneshot",
  },
  {
    id: "game:mortgage",
    category: "game",
    key: "mortgage",
    label: "Hipotecar",
    description: "Ao hipotecar uma escritura",
    defaultUrl: "",
    playMode: "oneshot",
  },
  {
    id: "game:build",
    category: "game",
    key: "build",
    label: "Construir",
    description: "Ao construir pousada ou resort",
    defaultUrl: "",
    playMode: "oneshot",
  },
  {
    id: "game:victory",
    category: "game",
    key: "victory",
    label: "Vitória",
    description: "Fim de jogo — vencedor",
    defaultUrl: "",
    playMode: "oneshot",
  },
  {
    id: "game:siren",
    category: "game",
    key: "siren",
    label: "Sirene da viatura",
    description: "Stinger ao ir para o Forte",
    defaultUrl: "",
    playMode: "oneshot",
  },
  {
    id: "game:towTruck",
    category: "game",
    key: "towTruck",
    label: "Guincho",
    description: "Venda de pousada/resort ao banco",
    defaultUrl: "",
    playMode: "oneshot",
  },
  {
    id: "carnaval:0",
    category: "carnaval",
    key: "igor_kanario01",
    label: "Carnaval — faixa 1",
    description: "Pool aleatório ao aterrissar na casa Carnaval",
    defaultUrl: "/sounds/carnaval/igor_kanario01.ogg",
    playMode: "music",
  },
  {
    id: "carnaval:1",
    category: "carnaval",
    key: "igor_kanario02",
    label: "Carnaval — faixa 2",
    description: "Pool aleatório ao aterrissar na casa Carnaval",
    defaultUrl: "/sounds/carnaval/igor_kanario02.ogg",
    playMode: "music",
  },
] as const;

export function getSfxSlot(id: string): SfxSlot | undefined {
  return SFX_SLOTS.find((s) => s.id === id);
}

export function slotsByCategory(category: SfxCategory): readonly SfxSlot[] {
  return SFX_SLOTS.filter((s) => s.category === category);
}

export function slotHasDefaultFile(slot: SfxSlot): boolean {
  return Boolean(slot.defaultUrl.trim());
}
