# Cidadela — Requisitos do Jogo

Jogo de tabuleiro inspirado nas regras clássicas de Monopoly, ambientado na **Bahia**.

## Objetivo

Ser o último jogador com dinheiro, levando todos os outros à falência.

---

## Preparação

- De **2 a 8 jogadores**.
- Cada jogador escolhe um peão e começa com **$1.500** em notas variadas.
- Um jogador faz o papel de **banqueiro** (pode ser também jogador), cuidando do:
  - dinheiro
  - escrituras
  - pousadas
  - resorts
- Todos começam na casa **“Chegada: Aeroporto de Salvador”**.

---

## Como funciona a vez

1. Jogue os **dois dados** e avance o total de casas, no sentido horário.
2. Cumpra o que a casa indicar.
3. Ao **passar ou parar** na Chegada (Aeroporto de Salvador), receba **$200** do banco.
4. Se tirar números iguais nos dois dados (**dupla**), jogue de novo.
5. **Três duplas seguidas** mandam você direto para o **Forte de São Marcelo** (prisão).

---

## Tipos de casas

### Propriedades

- Se ninguém for o dono, você pode **comprá-la pelo preço marcado**.
- Se não quiser, o banco a leva a **leilão entre todos os jogadores**.
- Se for propriedade de outro jogador, você **paga o aluguel** indicado na escritura.

### Transportes

- Equivalentes às ferrovias clássicas, com nomes locais (ferry-boat, Elevador Lacerda, plano inclinado e metrô).
- O aluguel aumenta conforme o dono possui **mais transportes**.

### Companhias (serviços públicos)

- **Coelba** e **Embasa**.
- O aluguel aumenta conforme o dono possui mais companhias e depende também do **resultado dos dados**.

### Fitinha do Bonfim (Sorte) e Bença (Cofre)

- Compre uma carta e siga as instruções.

### Impostos / taxas

- Pague o valor indicado ao banco (ex.: Pedágio da Linha Verde, Abadá do Carnaval).

### Carnaval — Circuito Barra-Ondina (Estacionamento livre)

- Nada acontece (pelas regras oficiais, **não se ganha dinheiro** ali).

### Vá para o Forte

- Vá **direto para o Forte de São Marcelo** (prisão), sem receber os $200 da Chegada.

---

## Construção

- Quando você tem **todas as propriedades de uma mesma cor**, o aluguel dessas propriedades **dobra**, e você pode construir.
- Construa de forma **uniforme**: uma **pousada** por vez em cada propriedade do grupo, até o máximo de **quatro pousadas**.
- Depois disso, é possível trocar as quatro pousadas por um **resort**.
- O número de pousadas e resorts é **limitado ao que há na caixa**.
- Quanto mais construções, **maior o aluguel**.

> Nomenclatura temática: pousadas = casas; resorts = hotéis.

---

## Hipotecas

- Para levantar dinheiro, você pode **hipotecar** propriedades ao banco e receber **metade do valor**.
- Enquanto estiver hipotecada, a propriedade **não rende aluguel**.
- Para recuperá-la, pague o valor da hipoteca **mais 10% de juros**.
- Construções precisam ser **vendidas ao banco** (pela metade do preço) **antes** de hipotecar.

---

## Prisão — Forte de São Marcelo

A prisão é o **Forte de São Marcelo**, fortaleza no meio da Baía de Todos os Santos.

Você vai para o Forte ao:

- cair na casa **“Vá para o Forte”**;
- tirar **três duplas seguidas**;
- tirar uma **carta** que mande.

Para sair, você pode:

1. pagar **$50**;
2. usar uma carta **“Saia do Forte”**;
3. tentar tirar uma **dupla** (até três tentativas). Se falhar na terceira, pague $50 e saia.

Mesmo preso, você pode **receber aluguéis** e **negociar**.

A casa **nº 10** (“Forte de São Marcelo”) também serve como **só visita** — quem apenas passa ou para ali sem estar preso não sofre penalidade.

---

## Negociações

- Os jogadores podem trocar **propriedades, dinheiro e cartas** a qualquer momento, nos termos que combinarem.
- **Não é permitido** negociar propriedades que tenham construções (pousadas ou resorts).

---

## Carteira e fluxos de dinheiro

Cada jogador tem uma **carteira**: o conjunto do que possui e o registro das transferências de dinheiro durante a partida.

### O que a carteira mostra

- **Dinheiro (saldo)** em mãos
- **Escrituras** — propriedades, transportes e companhias que o jogador possui (com indicação se estão **hipotecadas**, nº de **pousadas** ou se há **resort**)
- **Cartas** em mãos (ex.: “Saia do Forte”)

Na versão digital, a carteira do jogador da vez (ou do peão selecionado) deve ficar **visível o tempo todo**, atualizando-se a cada transferência.

### Receber dinheiro

| Situação | Quem paga | Quem recebe | Valor |
| --- | --- | --- | --- |
| Passar ou parar na Chegada | Banco | Jogador | $200 |
| Aluguel cobrado | Visitante | Dono | Conforme escritura / tabela |
| Hipotecar propriedade | Banco | Jogador | 50% do preço da propriedade |
| Vender pousada/resort ao banco | Banco | Jogador | 50% do preço pago na construção |
| Carta que concede dinheiro | Banco ou outros jogadores | Jogador | Texto da carta |
| Negociação | Outro jogador | Jogador | Valor combinado |

### Pagar / cobrar dinheiro

| Situação | Quem paga | Quem recebe | Valor |
| --- | --- | --- | --- |
| Comprar propriedade / transporte / companhia | Jogador | Banco | Preço marcado |
| Cair em propriedade / transporte / companhia alheia **não hipotecada** | Visitante | Dono | Aluguel (cobrança imediata) |
| Imposto / taxa (Pedágio, Abadá, etc.) | Jogador | Banco | Valor da casa |
| Resgatar hipoteca | Jogador | Banco | Valor da hipoteca + 10% |
| Construir pousada / resort | Jogador | Banco | Custo da construção (tabela) |
| Sair do Forte pagando | Jogador | Banco | $50 |
| Carta que exige pagamento | Jogador | Banco ou outros | Texto da carta |
| Negociação | Jogador | Outro jogador | Valor combinado |

### Comprar

1. Ao cair em bem **sem dono**, o jogador pode **comprar pelo preço marcado**, se tiver saldo suficiente.
2. O pagamento vai ao **banco**; a escritura passa para a carteira do comprador.
3. Se **recusar** ou **não puder** pagar o preço, o bem vai a **leilão** entre todos.
4. Não é permitido comprar bem que já tenha dono.

### Cobrar e pagar aluguel

1. Ao cair em bem de outro jogador **não hipotecado**, o visitante **paga** e o dono **recebe** o aluguel na hora.
2. Propriedade **hipotecada** não gera aluguel (visitante não paga).
3. Com **monopólio de cor** e sem construções, o aluguel base **dobra**.
4. Transportes e companhias usam as regras próprias de aluguel (quantidade / dados).
5. Mesmo **preso no Forte**, o dono **pode cobrar** aluguel normalmente.

### Hipotecar e resgatar

1. Para levantar dinheiro, o jogador **hipoteca** um bem ao banco e **recebe metade** do preço.
2. Antes de hipotecar, **venda todas as construções** daquele bem (e, se as regras do grupo exigirem, as construções do grupo) ao banco pela metade.
3. Bem hipotecado aparece na carteira como **hipotecado** e **não rende aluguel**.
4. Para **resgatar**, pague ao banco o valor da hipoteca **+ 10%** de juros; o bem volta a render normalmente.

### Vender construções

- Pousadas e resorts podem ser vendidos ao banco a qualquer momento por **50%** do preço pago, para levantar dinheiro (inclusive antes de hipotecar ou para quitar dívida).

### Saldo insuficiente

1. Se o jogador **deve** e não tem saldo, deve **liquidar** bens: vender construções e/ou hipotecar, até cobrir a dívida.
2. Se mesmo assim não conseguir pagar, declara **falência** (ver seção seguinte).
3. Compra e construção **não** são permitidas sem saldo suficiente (a ação é rejeitada).

---

## Falência

- Se você deve mais do que consegue pagar, mesmo vendendo construções e hipotecando tudo, está **falido**.
- Seus bens vão para o **credor** (ou para o **banco**, se a dívida for com ele) e você **sai do jogo**.
- **Vence** quem sobrar.

---

## Adaptações baianas

| Elemento clássico | Em Cidadela |
| --- | --- |
| Início (Go) | Chegada: Aeroporto de Salvador |
| Ferrovias | Transportes: Ferry-Boat Salvador–Mar Grande, Elevador Lacerda, Plano Inclinado Gonçalves, Metrô de Salvador |
| Companhias | Coelba e Embasa (aluguel baseado nos dados) |
| Casas / Hotéis | Pousadas / Resorts |
| Chance | Fitinha do Bonfim |
| Community Chest / Cofre | Bença |
| Prisão | Forte de São Marcelo |
| Vá para a prisão | Vá para o Forte |
| Estacionamento livre | Carnaval (Circuito Barra-Ondina) |

A mecânica permanece a mesma: quanto mais transportes você tem, maior o aluguel; nas companhias, o aluguel depende dos dados.

---

## O tabuleiro

| Nº | Casa | Valor / Tipo |
| ---: | --- | --- |
| 0 | Chegada: Aeroporto de Salvador | Receba $200 |
| 1 | Ilha de Maré | $60 (marrom) |
| 2 | Bença | Carta (Cofre) |
| 3 | Paripe | $60 (marrom) |
| 4 | Pedágio da Linha Verde | Pague $200 |
| 5 | Ferry-Boat Salvador–Mar Grande | $200 (transporte) |
| 6 | Feira de São Joaquim | $100 (azul-claro) |
| 7 | Fitinha do Bonfim | Carta (Sorte) |
| 8 | Cachoeira | $100 (azul-claro) |
| 9 | Valença | $120 (azul-claro) |
| 10 | Forte de São Marcelo | Prisão / só visita |
| 11 | Ilhéus | $140 (rosa) |
| 12 | Coelba | $150 (companhia) |
| 13 | Itacaré | $140 (rosa) |
| 14 | Morro de São Paulo | $160 (rosa) |
| 15 | Elevador Lacerda | $200 (transporte) |
| 16 | Lençóis | $180 (laranja) |
| 17 | Bença | Carta (Cofre) |
| 18 | Mucugê | $180 (laranja) |
| 19 | Vale do Capão | $200 (laranja) |
| 20 | Carnaval (Circuito Barra-Ondina) | Estacionamento livre |
| 21 | Trancoso | $220 (vermelho) |
| 22 | Fitinha do Bonfim | Carta (Sorte) |
| 23 | Arraial d’Ajuda | $220 (vermelho) |
| 24 | Caraíva | $240 (vermelho) |
| 25 | Plano Inclinado Gonçalves | $200 (transporte) |
| 26 | Rio Vermelho | $260 (amarelo) |
| 27 | Barra | $260 (amarelo) |
| 28 | Embasa | $150 (companhia) |
| 29 | Pituba | $280 (amarelo) |
| 30 | Vá para o Forte | Direto para a prisão |
| 31 | Praia do Forte | $300 (verde) |
| 32 | Costa do Sauípe | $300 (verde) |
| 33 | Bença | Carta (Cofre) |
| 34 | Porto Seguro | $320 (verde) |
| 35 | Metrô de Salvador | $200 (transporte) |
| 36 | Fitinha do Bonfim | Carta (Sorte) |
| 37 | Corredor da Vitória | $350 (azul-escuro) |
| 38 | Abadá do Carnaval | Pague $100 |
| 39 | Pelourinho | $400 (azul-escuro) |

### Grupos de cor

| Cor | Propriedades |
| --- | --- |
| Marrom | Ilha de Maré, Paripe |
| Azul-claro | Feira de São Joaquim, Cachoeira, Valença |
| Rosa | Ilhéus, Itacaré, Morro de São Paulo |
| Laranja | Lençóis, Mucugê, Vale do Capão |
| Vermelho | Trancoso, Arraial d’Ajuda, Caraíva |
| Amarelo | Rio Vermelho, Barra, Pituba |
| Verde | Praia do Forte, Costa do Sauípe, Porto Seguro |
| Azul-escuro | Corredor da Vitória, Pelourinho |

---

## Exemplos de cartas

### Fitinha do Bonfim (Sorte)

- Avance até o **Pelourinho**. Se passar pela Chegada, receba $200.
- Seu bloco foi o mais animado do Carnaval. Receba **$50 de cada jogador**.
- Choveu na Lavagem do Bonfim e você ficou sem festa. **Volte 3 casas**.
- Pegue o ferry-boat. Avance até o **Ferry-Boat Salvador–Mar Grande**.

---

## Próximos tópicos a documentar

> Seções ainda não definidas — a preencher nas próximas iterações.

- [ ] Tabelas de aluguel (por pousadas/resorts, transportes e companhias)
- [ ] Baralho completo da Fitinha do Bonfim
- [ ] Baralho completo da Bença
- [ ] Custo de pousadas/resorts por grupo de cor
- [x] Carteira e fluxos de dinheiro (cobrar, receber, comprar, hipotecar) — ver seção acima
- [ ] Demais regras digitais (leilão detalhado, UI de negociação, multiplayer)
