import type { BoardSpace, ColorGroup } from "./types";

/** Tabuleiro Cidadela — casas 0–39 (fonte: REQUISITOS.md). */
export const BOARD: readonly BoardSpace[] = [
  { index: 0, name: "Chegada: Aeroporto de Salvador", kind: "chegada" },
  { index: 1, name: "Ilha de Maré", kind: "propriedade", price: 60, colorGroup: "marrom" },
  { index: 2, name: "Bença", kind: "benca" },
  { index: 3, name: "Paripe", kind: "propriedade", price: 60, colorGroup: "marrom" },
  { index: 4, name: "Pedágio da Linha Verde", kind: "imposto", taxAmount: 200 },
  { index: 5, name: "Ferry-Boat Salvador–Mar Grande", kind: "transporte", price: 200 },
  { index: 6, name: "Feira de São Joaquim", kind: "propriedade", price: 100, colorGroup: "azul-claro" },
  { index: 7, name: "Fitinha do Bonfim", kind: "fitinha" },
  { index: 8, name: "Cachoeira", kind: "propriedade", price: 100, colorGroup: "azul-claro" },
  { index: 9, name: "Valença", kind: "propriedade", price: 120, colorGroup: "azul-claro" },
  { index: 10, name: "Forte de São Marcelo", kind: "forte" },
  { index: 11, name: "Ilhéus", kind: "propriedade", price: 140, colorGroup: "rosa" },
  { index: 12, name: "Coelba", kind: "companhia", price: 150 },
  { index: 13, name: "Itacaré", kind: "propriedade", price: 140, colorGroup: "rosa" },
  { index: 14, name: "Morro de São Paulo", kind: "propriedade", price: 160, colorGroup: "rosa" },
  { index: 15, name: "Elevador Lacerda", kind: "transporte", price: 200 },
  { index: 16, name: "Lençóis", kind: "propriedade", price: 180, colorGroup: "laranja" },
  { index: 17, name: "Bença", kind: "benca" },
  { index: 18, name: "Mucugê", kind: "propriedade", price: 180, colorGroup: "laranja" },
  { index: 19, name: "Vale do Capão", kind: "propriedade", price: 200, colorGroup: "laranja" },
  { index: 20, name: "Carnaval (Circuito Barra-Ondina)", kind: "carnaval" },
  { index: 21, name: "Trancoso", kind: "propriedade", price: 220, colorGroup: "vermelho" },
  { index: 22, name: "Fitinha do Bonfim", kind: "fitinha" },
  { index: 23, name: "Arraial d'Ajuda", kind: "propriedade", price: 220, colorGroup: "vermelho" },
  { index: 24, name: "Caraíva", kind: "propriedade", price: 240, colorGroup: "vermelho" },
  { index: 25, name: "Plano Inclinado Gonçalves", kind: "transporte", price: 200 },
  { index: 26, name: "Rio Vermelho", kind: "propriedade", price: 260, colorGroup: "amarelo" },
  { index: 27, name: "Barra", kind: "propriedade", price: 260, colorGroup: "amarelo" },
  { index: 28, name: "Embasa", kind: "companhia", price: 150 },
  { index: 29, name: "Pituba", kind: "propriedade", price: 280, colorGroup: "amarelo" },
  { index: 30, name: "Vá para o Forte", kind: "va_para_o_forte" },
  { index: 31, name: "Praia do Forte", kind: "propriedade", price: 300, colorGroup: "verde" },
  { index: 32, name: "Costa do Sauípe", kind: "propriedade", price: 300, colorGroup: "verde" },
  { index: 33, name: "Bença", kind: "benca" },
  { index: 34, name: "Porto Seguro", kind: "propriedade", price: 320, colorGroup: "verde" },
  { index: 35, name: "Metrô de Salvador", kind: "transporte", price: 200 },
  { index: 36, name: "Fitinha do Bonfim", kind: "fitinha" },
  { index: 37, name: "Corredor da Vitória", kind: "propriedade", price: 350, colorGroup: "azul-escuro" },
  { index: 38, name: "Abadá do Carnaval", kind: "imposto", taxAmount: 100 },
  { index: 39, name: "Pelourinho", kind: "propriedade", price: 400, colorGroup: "azul-escuro" },
] as const;

if (BOARD.length !== 40) {
  throw new Error(`BOARD deve ter 40 casas, tem ${BOARD.length}`);
}

export const COLOR_GROUPS: Record<ColorGroup, readonly number[]> = {
  marrom: [1, 3],
  "azul-claro": [6, 8, 9],
  rosa: [11, 13, 14],
  laranja: [16, 18, 19],
  vermelho: [21, 23, 24],
  amarelo: [26, 27, 29],
  verde: [31, 32, 34],
  "azul-escuro": [37, 39],
};

export function getSpace(index: number): BoardSpace {
  const space = BOARD[index];
  if (!space) {
    throw new Error(`Casa inválida: ${index}`);
  }
  return space;
}
