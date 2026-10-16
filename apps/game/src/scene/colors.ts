import type { BoardSpace, ColorGroup } from "@cidadela/shared";

export const GROUP_COLORS: Record<ColorGroup, string> = {
  marrom: "#8b5a2b",
  "azul-claro": "#6ec1e0",
  rosa: "#e891b5",
  laranja: "#f08a3a",
  vermelho: "#d62828",
  amarelo: "#f4c430",
  verde: "#2a9d8f",
  "azul-escuro": "#1d3557",
};

const KIND_COLORS: Record<string, string> = {
  chegada: "#e8b86d",
  benca: "#d4b5b0",
  fitinha: "#f0c75e",
  imposto: "#7a7180",
  transporte: "#3d7ea6",
  forte: "#5c534f",
  companhia: "#7cb342",
  carnaval: "#ff5c7a",
  va_para_o_forte: "#3d405b",
};

export function tileColor(space: BoardSpace): string {
  if (space.kind === "propriedade") return "#f3e6d0";
  return KIND_COLORS[space.kind] ?? "#e9ecef";
}

export function stripeColor(space: BoardSpace): string | null {
  if (space.kind === "propriedade" && space.colorGroup) {
    return GROUP_COLORS[space.colorGroup];
  }
  return null;
}
