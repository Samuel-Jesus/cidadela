export type SpaceKind =
  | "chegada"
  | "propriedade"
  | "benca"
  | "fitinha"
  | "imposto"
  | "transporte"
  | "forte"
  | "companhia"
  | "carnaval"
  | "va_para_o_forte";

export type ColorGroup =
  | "marrom"
  | "azul-claro"
  | "rosa"
  | "laranja"
  | "vermelho"
  | "amarelo"
  | "verde"
  | "azul-escuro";

export interface BoardSpace {
  index: number;
  name: string;
  kind: SpaceKind;
  price?: number;
  colorGroup?: ColorGroup;
  taxAmount?: number;
}

export const KIND_LABELS: Record<SpaceKind, string> = {
  chegada: "Chegada",
  propriedade: "Propriedade",
  benca: "Bença (Cofre)",
  fitinha: "Fitinha do Bonfim (Sorte)",
  imposto: "Imposto / taxa",
  transporte: "Transporte",
  forte: "Forte / só visita",
  companhia: "Companhia",
  carnaval: "Carnaval (estacionamento livre)",
  va_para_o_forte: "Vá para o Forte",
};

export const COLOR_GROUP_LABELS: Record<ColorGroup, string> = {
  marrom: "Marrom",
  "azul-claro": "Azul-claro",
  rosa: "Rosa",
  laranja: "Laranja",
  vermelho: "Vermelho",
  amarelo: "Amarelo",
  verde: "Verde",
  "azul-escuro": "Azul-escuro",
};
