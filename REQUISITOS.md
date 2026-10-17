# Cidadela — Requisitos do Jogo (regras completas)

Versão baiana do gênero Monopoly clássico. As regras seguem o jogo original; o que muda são o tabuleiro, os nomes, as cartas e alguns acertos de equilíbrio descritos neste documento.

> **Fonte de verdade das regras de mesa.** Requisitos verificáveis (Volere): [`SPECS.md`](./SPECS.md).

**Sumário**

1. Objetivo e material
2. Preparação
3. Como funciona a vez
4. O tabuleiro (40 casas)
5. Tipos de casa
6. Forte de São Marcelo (prisão)
7. Pousadas e resorts
8. Tabelas de aluguel e custos
9. Hipotecas e arredondamento
10. Leilão
11. Negociações
12. Falência e fim de jogo
13. Baralhos completos
14. Ajustes de equilíbrio e adaptações
15. Carteira e fluxos de dinheiro (consolidação / digital)
16. Versão digital (resumo de produto)

---

## 1. Objetivo e material

**Objetivo:** ser o último jogador com dinheiro, levando todos os outros à falência.

**Material:**

- 1 tabuleiro com 40 casas
- 28 escrituras (22 terrenos, 4 transportes, 2 companhias)
- 16 cartas Fitinha do Bonfim (Sorte)
- 16 cartas Bença (Cofre)
- 32 pousadas e 12 resorts
- 2 dados e 1 peão por jogador
- Dinheiro do banco

**Peões sugeridos:** berimbau, acarajé, atabaque, fitinha do Bonfim, coqueiro, jangada, abadá e baiana.

---

## 2. Preparação

- De **2 a 8 jogadores**.
- Cada jogador começa com **$1.500**: 2 notas de $500, 2 de $100, 2 de $50, 6 de $20, 5 de $10, 5 de $5 e 5 de $1.
- Escolha um **banqueiro**. Ele cuida do dinheiro, das escrituras, das pousadas e dos resorts, e pode jogar também. Deve manter o dinheiro do banco separado do seu.
- Embaralhe os dois baralhos e deixe-os virados para baixo nos retângulos do centro do tabuleiro.
- Todos os peões começam na **Chegada** (Aeroporto de Salvador).
- Cada jogador joga os dados. Quem tirar o maior total começa, e o jogo segue no sentido horário.

---

## 3. Como funciona a vez

1. **Jogue os dois dados** e avance o total, no sentido horário.
2. **Cumpra o que a casa indicar** (comprar, pagar aluguel, comprar carta, etc.).
3. **Dupla:** se tirar números iguais nos dois dados, jogue de novo depois de resolver a casa. **Três duplas seguidas** levam você direto ao Forte de São Marcelo, sem resolver a terceira jogada.
4. **Passou ou parou na Chegada:** receba **$200** do banco.
5. Antes ou depois de jogar, você pode construir, hipotecar, resgatar hipotecas e negociar.

Não existem prêmios extras em dinheiro: **Carnaval (Estacionamento Livre) não paga nada**, e os impostos não vão para o centro do tabuleiro, vão para o banco.

---

## 4. O tabuleiro (40 casas)

| Nº | Casa | Tipo / valor | Grupo |
| ---: | --- | --- | --- |
| 0 | **Chegada: Aeroporto de Salvador** | Receba $200 ao passar ou parar | |
| 1 | Ilha de Maré | Terreno $60 | Marrom |
| 2 | Bença | Carta Cofre | |
| 3 | Paripe | Terreno $60 | Marrom |
| 4 | Pedágio da Linha Verde | Imposto: pague $200 | |
| 5 | Ferry-Boat Salvador–Mar Grande | Transporte $200 | |
| 6 | Feira de São Joaquim | Terreno $100 | Azul-claro |
| 7 | Fitinha do Bonfim | Carta Sorte | |
| 8 | Cachoeira | Terreno $100 | Azul-claro |
| 9 | Valença | Terreno $120 | Azul-claro |
| 10 | **Forte de São Marcelo** | Prisão / só visita | |
| 11 | Ilhéus | Terreno $140 | Rosa |
| 12 | Coelba | Companhia $150 | |
| 13 | Itacaré | Terreno $140 | Rosa |
| 14 | Morro de São Paulo | Terreno $160 | Rosa |
| 15 | Elevador Lacerda | Transporte $200 | |
| 16 | Lençóis | Terreno $180 | Laranja |
| 17 | Bença | Carta Cofre | |
| 18 | Mucugê | Terreno $180 | Laranja |
| 19 | Vale do Capão | Terreno $200 | Laranja |
| 20 | **Carnaval (Circuito Barra-Ondina)** | Estacionamento livre (nada acontece) | |
| 21 | Trancoso | Terreno $220 | Vermelho |
| 22 | Fitinha do Bonfim | Carta Sorte | |
| 23 | Arraial d'Ajuda | Terreno $220 | Vermelho |
| 24 | Caraíva | Terreno $240 | Vermelho |
| 25 | Plano Inclinado Gonçalves | Transporte $200 | |
| 26 | Rio Vermelho | Terreno $260 | Amarelo |
| 27 | Barra | Terreno $260 | Amarelo |
| 28 | Embasa | Companhia $150 | |
| 29 | Pituba | Terreno $280 | Amarelo |
| 30 | **Vá para o Forte** | Vá direto para a prisão | |
| 31 | Praia do Forte | Terreno $300 | Verde |
| 32 | Costa do Sauípe | Terreno $300 | Verde |
| 33 | Bença | Carta Cofre | |
| 34 | Porto Seguro | Terreno $320 | Verde |
| 35 | Metrô de Salvador | Transporte $200 | |
| 36 | Fitinha do Bonfim | Carta Sorte | |
| 37 | Corredor da Vitória | Terreno $350 | Azul-escuro |
| 38 | Abadá do Carnaval | Imposto: pague $100 | |
| 39 | Pelourinho | Terreno $400 | Azul-escuro |

### Grupos de cor

| Cor | Propriedades |
| --- | --- |
| Marrom | Ilha de Maré, Paripe |
| Azul-claro | Feira de São Joaquim, Cachoeira, Valença |
| Rosa | Ilhéus, Itacaré, Morro de São Paulo |
| Laranja | Lençóis, Mucugê, Vale do Capão |
| Vermelho | Trancoso, Arraial d'Ajuda, Caraíva |
| Amarelo | Rio Vermelho, Barra, Pituba |
| Verde | Praia do Forte, Costa do Sauípe, Porto Seguro |
| Azul-escuro | Corredor da Vitória, Pelourinho |

---

## 5. Tipos de casa

### Terrenos

- **Sem dono:** você pode comprar pelo preço marcado. Se não quiser, o banco leva o terreno a **leilão** entre todos os jogadores (veja a seção 10).
- **Com dono:** você paga o aluguel indicado na escritura. O dono precisa pedir o aluguel **antes do próximo jogador jogar os dados**. Se esquecer, perde o direito de cobrar.
- **Seu próprio terreno:** nada acontece.
- **Terreno hipotecado:** não paga aluguel.

### Transportes (Ferry-Boat, Elevador Lacerda, Plano Inclinado, Metrô)

O aluguel depende de quantos transportes o dono possui: **$25** (1), **$50** (2), **$100** (3), **$200** (4).

### Companhias (Coelba e Embasa)

O aluguel depende do resultado dos dados que você acabou de jogar: **4 vezes** o total, se o dono tem uma companhia, ou **10 vezes** o total, se tem as duas.

### Impostos

- **Pedágio da Linha Verde:** pague **$200** ao banco.
- **Abadá do Carnaval:** pague **$100** ao banco.

### Cartas

Ao parar em **Fitinha do Bonfim** (Sorte) ou **Bença** (Cofre), compre a carta do topo, cumpra a instrução e devolva-a ao fundo do baralho (exceto as cartas **Proteção**, que você pode guardar).

### Carnaval (Estacionamento Livre)

Casa de descanso. **Não se ganha nem se paga nada ali.**

### Vá para o Forte

Vá **direto para o Forte de São Marcelo**, sem receber os $200 da Chegada.

---

## 6. Forte de São Marcelo (prisão)

**Como você vai para o Forte:**

- parando na casa **Vá para o Forte**;
- tirando **três duplas seguidas**;
- comprando uma carta que mande ir ao Forte.

Ao ir para o Forte, sua vez termina na hora, mesmo que você tenha tirado dupla. **Você não recebe os $200 da Chegada.**

**Como sair:**

1. Pague **$50** no início da sua vez, e jogue normalmente.
2. Use uma carta **Proteção** (Proteção de Iemanjá ou Proteção do Senhor do Bonfim).
3. Tente tirar uma **dupla**, em até **três tentativas** (uma por vez). Se tirar dupla, saia e avance o total dos dados, mas **não jogue de novo**. Se falhar na terceira tentativa, pague **$50** e avance o total dos dados.

**Enquanto você está no Forte**, você ainda pode receber aluguéis, negociar, construir, hipotecar e participar de leilões. Parar na casa do Forte sem ter sido preso significa só **visita**, sem nenhuma penalidade.

---

## 7. Pousadas e resorts

As casas do jogo clássico viram **pousadas**, e os hotéis viram **resorts**.

**Quando você pode construir:**

- Você precisa ter **todos os terrenos de um grupo de cor**.
- Nenhum terreno do grupo pode estar hipotecado.
- Nos grupos completos, o aluguel dos terrenos **sem construção dobra**.

**Regra da construção uniforme:**

- Construa **uma pousada por vez**, distribuindo entre os terrenos do grupo. Um terreno nunca pode ter mais de **uma pousada a mais** que outro do mesmo grupo.
- Cada terreno pode ter até **4 pousadas**. Depois disso, você pode trocar as 4 pousadas por **1 resort**, pagando o valor do resort (veja a tabela).
- Cada terreno tem **no máximo 1 resort**, e nada mais pode ser construído nele.

**Limite de peças:**

- O banco tem **32 pousadas** e **12 resorts**. Se acabarem, ninguém pode construir mais até que alguém devolva peças.
- Quando há **poucas peças** e dois ou mais jogadores querem comprá-las, o banco faz um **leilão** da peça disponível (veja a seção 10).

**Vendendo construções:**

- Pousadas e resorts voltam ao banco por **metade do preço pago**.
- A venda também deve ser **uniforme**: venda de uma em uma, equilibrando o grupo.
- Ao vender um resort, o banco devolve **4 pousadas**, se tiver. Se não houver pousadas suficientes, o resort só pode ser vendido por inteiro, junto com as demais construções do grupo que forem necessárias para manter o equilíbrio.
- Você **não pode negociar** terrenos que tenham construções. Venda as construções ao banco antes.

---

## 8. Tabelas de aluguel e custos

### 8.1 Aluguel dos terrenos

"Grupo completo" é o aluguel do terreno **sem construção** quando o dono possui todo o grupo de cor (dobro do aluguel normal).

| Grupo | Terreno | Preço | Aluguel | Grupo completo (2×) | 1 pousada | 2 pousadas | 3 pousadas | 4 pousadas | Resort |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **Marrom** | Ilha de Maré | $60 | $2 | $4 | $10 | $30 | $90 | $160 | $250 |
| | Paripe | $60 | $4 | $8 | $20 | $60 | $180 | $320 | $450 |
| **Azul-claro** | Feira de São Joaquim | $100 | $6 | $12 | $30 | $90 | $270 | $400 | $550 |
| | Cachoeira | $100 | $6 | $12 | $30 | $90 | $270 | $400 | $550 |
| | Valença | $120 | $8 | $16 | $40 | $100 | $300 | $450 | $600 |
| **Rosa** | Ilhéus | $140 | $10 | $20 | $50 | $150 | $450 | $625 | $750 |
| | Itacaré | $140 | $10 | $20 | $50 | $150 | $450 | $625 | $750 |
| | Morro de São Paulo | $160 | $12 | $24 | $60 | $180 | $500 | $700 | $900 |
| **Laranja** | Lençóis | $180 | $14 | $28 | $70 | $200 | $550 | $750 | $950 |
| | Mucugê | $180 | $14 | $28 | $70 | $200 | $550 | $750 | $950 |
| | Vale do Capão | $200 | $16 | $32 | $80 | $220 | $600 | $800 | $1.000 |
| **Vermelho** | Trancoso | $220 | $18 | $36 | $90 | $250 | $700 | $875 | $1.050 |
| | Arraial d'Ajuda | $220 | $18 | $36 | $90 | $250 | $700 | $875 | $1.050 |
| | Caraíva | $240 | $20 | $40 | $100 | $300 | $750 | $925 | $1.100 |
| **Amarelo** | Rio Vermelho | $260 | $22 | $44 | $110 | $330 | $800 | $975 | $1.150 |
| | Barra | $260 | $22 | $44 | $110 | $330 | $800 | $975 | $1.150 |
| | Pituba | $280 | $24 | $48 | $120 | $360 | $850 | $1.025 | $1.200 |
| **Verde** | Praia do Forte | $300 | $26 | $52 | $130 | $390 | $900 | $1.100 | $1.275 |
| | Costa do Sauípe | $300 | $26 | $52 | $130 | $390 | $900 | $1.100 | $1.275 |
| | Porto Seguro | $320 | $28 | $56 | $150 | $450 | $1.000 | $1.200 | $1.400 |
| **Azul-escuro** | Corredor da Vitória | $350 | $35 | $70 | $175 | $500 | $1.100 | $1.300 | $1.500 |
| | Pelourinho | $400 | $50 | $100 | $200 | $600 | $1.400 | $1.700 | $2.000 |

### 8.2 Transportes e companhias

| Tipo | Casas | Preço | Aluguel |
| --- | --- | ---: | --- |
| **Transportes** | Ferry-Boat, Elevador Lacerda, Plano Inclinado Gonçalves, Metrô de Salvador | $200 | 1 transporte: $25 · 2: $50 · 3: $100 · 4: $200 |
| **Companhias** | Coelba, Embasa | $150 | 1 companhia: 4× o resultado dos dados · 2 companhias: 10× o resultado dos dados |

### 8.3 Custos de construção

| Grupo | Custo de cada pousada | Custo do resort | Pousadas por resort |
| --- | ---: | --- | ---: |
| Marrom | $50 | $50 + 4 pousadas | 4 |
| Azul-claro | $50 | $50 + 4 pousadas | 4 |
| Rosa | $100 | $100 + 4 pousadas | 4 |
| Laranja | $100 | $100 + 4 pousadas | 4 |
| Vermelho | $150 | $150 + 4 pousadas | 4 |
| Amarelo | $150 | $150 + 4 pousadas | 4 |
| Verde | $200 | $200 + 4 pousadas | 4 |
| Azul-escuro | $200 | $200 + 4 pousadas | 4 |

**Como ler "resort $X + 4 pousadas":** para construir um resort você devolve as 4 pousadas do terreno ao banco e paga $X. Na prática, um resort completo custa o equivalente a 5 construções.

**Venda de construções:** metade do preço pago (por exemplo, uma pousada de $100 volta por $50).

---

## 9. Hipotecas e arredondamento

### Regras da hipoteca

- Para levantar dinheiro, hipoteque um terreno, transporte ou companhia ao banco e receba o **valor da hipoteca**, que é **metade do preço de compra**.
- Vire a escritura **de cabeça para baixo** para mostrar que está hipotecada.
- **Terrenos hipotecados não pagam aluguel.** Os outros terrenos do grupo continuam cobrando, mas **sem o dobro do grupo** se algum estiver hipotecado.
- Para hipotecar um terreno de um grupo, **venda antes todas as construções** de todos os terrenos desse grupo (metade do preço, ao banco).
- Você pode **negociar** um terreno hipotecado com outro jogador, mas não pode vender a hipoteca a ninguém, só ao banco.

### Resgate e arredondamento

- Para **resgatar** uma hipoteca, pague ao banco **o valor da hipoteca mais 10% de juros**.
- **Regra de arredondamento:** o resgate é sempre **arredondado para cima, até o dólar inteiro**. Os juros nunca têm centavos. Isso afeta apenas dois casos: **Corredor da Vitória** e as **companhias** (veja a tabela).

### Terreno hipotecado que muda de dono

Quando alguém recebe um terreno hipotecado por **negociação** ou **falência de outro jogador**, escolhe **uma** destas opções na hora:

1. **Resgatar de imediato**, pagando o valor da hipoteca mais 10% (como na tabela).
2. **Manter hipotecado** e pagar ao banco **só os juros de 10% agora** (arredondados para cima). Quando resgatar depois, pagará **o valor da hipoteca mais outros 10%**.

### Tabela de hipoteca e resgate

| Casa | Preço | Hipoteca | Juros (10%) | Resgate |
| --- | ---: | ---: | ---: | ---: |
| Ilha de Maré | $60 | $30 | $3 | $33 |
| Paripe | $60 | $30 | $3 | $33 |
| Feira de São Joaquim | $100 | $50 | $5 | $55 |
| Cachoeira | $100 | $50 | $5 | $55 |
| Valença | $120 | $60 | $6 | $66 |
| Ilhéus | $140 | $70 | $7 | $77 |
| Itacaré | $140 | $70 | $7 | $77 |
| Morro de São Paulo | $160 | $80 | $8 | $88 |
| Lençóis | $180 | $90 | $9 | $99 |
| Mucugê | $180 | $90 | $9 | $99 |
| Vale do Capão | $200 | $100 | $10 | $110 |
| Trancoso | $220 | $110 | $11 | $121 |
| Arraial d'Ajuda | $220 | $110 | $11 | $121 |
| Caraíva | $240 | $120 | $12 | $132 |
| Rio Vermelho | $260 | $130 | $13 | $143 |
| Barra | $260 | $130 | $13 | $143 |
| Pituba | $280 | $140 | $14 | $154 |
| Praia do Forte | $300 | $150 | $15 | $165 |
| Costa do Sauípe | $300 | $150 | $15 | $165 |
| Porto Seguro | $320 | $160 | $16 | $176 |
| Corredor da Vitória | $350 | $175 | $17,50 → **$18** | **$193** |
| Pelourinho | $400 | $200 | $20 | $220 |
| Ferry-Boat Salvador–Mar Grande | $200 | $100 | $10 | $110 |
| Elevador Lacerda | $200 | $100 | $10 | $110 |
| Plano Inclinado Gonçalves | $200 | $100 | $10 | $110 |
| Metrô de Salvador | $200 | $100 | $10 | $110 |
| Coelba | $150 | $75 | $7,50 → **$8** | **$83** |
| Embasa | $150 | $75 | $7,50 → **$8** | **$83** |

> Exemplo: Corredor da Vitória tem hipoteca de $175. Juros de 10% dão $17,50, que sobem para $18. O resgate custa $175 + $18 = **$193**. Nas negociações com terreno hipotecado, os juros de $18 são pagos de imediato se o novo dono optar por manter a hipoteca.

---

## 10. Leilão

### Quando acontece um leilão

1. **Terreno sem dono:** o jogador que parou na casa não quer comprar pelo preço marcado, ou não tem dinheiro. O banco leva o terreno a leilão.
2. **Falência para o banco:** quando um jogador quebra devendo ao banco, **todas as suas propriedades vão a leilão**, uma de cada vez, inclusive as hipotecadas.
3. **Construções escassas:** quando faltam pousadas ou resorts e mais de um jogador quer comprá-las, o banco leiloa as peças disponíveis, **uma peça por vez**.

### Quem participa

**Todos os jogadores participam**, inclusive o que recusou a compra. Um jogador pode assistir sem dar lances.

### Como funciona

1. O **banqueiro** (ou um jogador que conduza) anuncia a propriedade e o preço de partida. O lance inicial pode ser **qualquer valor, inclusive $1**.
2. **Não existe ordem de vez.** Qualquer jogador pode dar um lance a qualquer momento, em voz alta.
3. Cada lance precisa **superar o anterior em pelo menos $10** (aumento mínimo). Para propriedades baratas ($60 a $100), pode-se combinar $5.
4. Quando ninguém mais der lance, o condutor faz a contagem: **"Dou-lhe uma, dou-lhe duas, vendido!"**, com uma pausa de uns **5 segundos** entre cada fase. Se surgir um novo lance durante a contagem, ela recomeça.
5. O **maior lance vence**. O vencedor paga ao banco o valor do lance e recebe a escritura (ou a peça).

### Detalhes importantes

- **Limite do lance (regra da casa):** você só pode dar um lance **até o valor do dinheiro que tem na mão** no momento do leilão. Isso evita lances que não podem ser pagos.
- **Pagamento imediato:** o vencedor paga na hora, em dinheiro. Ele **pode vender construções ou hipotecar** terrenos para completar o valor, mas só antes de anunciar o lance, nunca depois de ganhar.
- **Lance dado é lance feito:** não dá para retirar um lance depois de dado. Se o jogador não conseguir pagar, a propriedade volta ao leilão, começando do **segundo maior lance**, e o jogador que falhou **perde a vez de dar lances** nesse leilão.
- **Empate:** se dois lances iguais forem ditos ao mesmo tempo, os dois jogadores têm a chance de aumentar. Se ninguém aumentar, **joguem os dados**: o maior total leva.
- **Sem lances:** se ninguém quiser a propriedade pelo preço de $1 ou mais, ela **continua sem dono** e pode ser comprada pelo preço cheio por quem parar nela da próxima vez.
- **Propriedade hipotecada leiloada:** o comprador recebe a escritura ainda hipotecada e paga **só os juros de 10%** (arredondados para cima) ao banco na hora, ou resgata de imediato (veja a seção 9).
- **Dinheiro do leilão** vai para o banco, nunca para o jogador que recusou a compra.

### Exemplo

Maria cai em **Morro de São Paulo** ($160) e não quer comprar. O banco abre o leilão em $1.

- João diz **$80**. Ana diz **$100**. João diz **$140**. Ninguém mais fala.
- O condutor faz a contagem. Maria diz **$150** durante a contagem, e ela recomeça.
- Ana diz **$160**. Passam-se 5 segundos, e o condutor anuncia **"Vendido para Ana por $160!"**.
- Ana paga $160 ao banco e fica com a escritura.

---

## 11. Negociações

- Jogadores podem negociar **terrenos (hipotecados ou não), transportes, companhias, dinheiro e cartas Proteção**, a qualquer momento, nos termos que combinarem.
- **Terrenos com construções não podem ser negociados.** Venda as construções ao banco antes.
- Os jogadores também podem fazer **acordos em dinheiro** para perdoar um aluguel, mas essas promessas **não valem** como regra: só o que for pago de fato na hora conta.
- Terrenos hipotecados mudando de dono seguem a regra da seção 9.

---

## 12. Falência e fim de jogo

Um jogador está **falido** quando deve mais do que consegue pagar, mesmo vendendo todas as construções e hipotecando tudo.

**Falência para outro jogador:**

- Entrega ao credor todo o dinheiro e todas as propriedades. As construções são devolvidas ao banco antes.
- O credor recebe os terrenos hipotecados e cumpre a regra da seção 9 (resgata ou paga juros de 10% na hora).
- As cartas **Proteção** vão para o credor.

**Falência para o banco:**

- O banco recebe tudo, devolve as construções e **leiloa todas as propriedades** (seção 10).
- As cartas **Proteção** voltam ao fundo do baralho.

O jogador falido sai do jogo. **Vence o último jogador de pé.**

**Jogo curto (opcional):** combinem antes um tempo limite (por exemplo, 90 minutos). Ao terminar, vence quem tiver mais **patrimônio**: dinheiro + preço dos terrenos (pelo valor de compra, não da hipoteca) + construções (pelo custo pago).

---

## 13. Baralhos completos

### 13.1 Fitinha do Bonfim (Sorte): 16 cartas

| Nº | Texto da carta | Efeito |
| ---: | --- | --- |
| 1 | Avance até a Chegada (Aeroporto de Salvador). Receba $200. | Vá à casa 0 e receba $200 |
| 2 | Avance até Itacaré. Se passar pela Chegada, receba $200. | Vá à casa 13 |
| 3 | Avance até Caraíva. Se passar pela Chegada, receba $200. | Vá à casa 24 |
| 4 | Avance até o Pelourinho. | Vá à casa 39 |
| 5 | Avance até o transporte mais próximo. Se tiver dono, pague o DOBRO do aluguel ao dono. Se não tiver, você pode comprá-lo. | Transporte mais próximo à frente |
| 6 | Avance até o transporte mais próximo. Se tiver dono, pague o DOBRO do aluguel ao dono. Se não tiver, você pode comprá-lo. | Transporte mais próximo à frente |
| 7 | Avance até a companhia mais próxima (Coelba ou Embasa). Se tiver dono, jogue os dados e pague 10 vezes o resultado. | Companhia mais próxima à frente |
| 8 | Pegue o Elevador Lacerda: avance até lá. Se passar pela Chegada, receba $200. | Vá à casa 15 |
| 9 | Choveu na Lavagem do Bonfim e você ficou sem festa. Volte 3 casas. | Recue 3 casas |
| 10 | Vá direto para o Forte de São Marcelo. Não passe pela Chegada e não receba $200. | Prisão |
| 11 | **PROTEÇÃO DE IEMANJÁ:** guarde esta carta para sair do Forte sem pagar. | Carta guardável |
| 12 | Reforma geral nas suas propriedades: pague $25 por pousada e $100 por resort. | Pague ao banco |
| 13 | Multa de trânsito na Avenida Paralela. Pague $15. | Pague $15 |
| 14 | Seu bloco foi o mais animado do Carnaval. Receba $25 de cada jogador. | Receba de todos |
| 15 | Você bancou a feijoada do bloco. Pague $25 a cada jogador. | Pague a todos |
| 16 | Seu investimento no dendê rendeu bem. Receba $150. | Receba $150 |

**Observações sobre as cartas de movimento:**

- **Cartas 5 e 6** (transporte mais próximo): o "mais próximo" é o primeiro que aparece **à frente** no sentido do jogo. Se você passar pela Chegada nesse caminho, receba $200. Os transportes ficam nas casas 5, 15, 25 e 35.
- **Carta 7** (companhia mais próxima): idem. As companhias ficam nas casas 12 e 28. O aluguel é de **10 vezes** o total dos dados que você jogar naquele momento, independentemente de o dono ter uma ou duas companhias.
- **Cartas 2, 3 e 8:** só pagam os $200 se você realmente passar pela Chegada ao avançar. Se a casa de destino estiver atrás de você, você dá a volta no tabuleiro.
- **Carta 9** (volte 3 casas): se cair em um imposto, carta ou terreno, resolva essa casa normalmente. Se for uma carta, não anda de novo, apenas cumpra a nova carta.

### 13.2 Bença (Cofre): 16 cartas

| Nº | Texto da carta | Efeito |
| ---: | --- | --- |
| 1 | Avance até a Chegada (Aeroporto de Salvador). Receba $200. | Vá à casa 0 e receba $200 |
| 2 | Erro do banco a seu favor. Receba $200. | Receba $200 |
| 3 | Consulta com o médico. Pague $50. | Pague $50 |
| 4 | Você vendeu acarajé na Barra e fez sucesso. Receba $50. | Receba $50 |
| 5 | **PROTEÇÃO DO SENHOR DO BONFIM:** guarde esta carta para sair do Forte sem pagar. | Carta guardável |
| 6 | Vá direto para o Forte de São Marcelo. Não passe pela Chegada e não receba $200. | Prisão |
| 7 | É seu aniversário! Receba $10 de cada jogador. | Receba de todos |
| 8 | Restituição do imposto de renda. Receba $20. | Receba $20 |
| 9 | Você herdeu uma casa no Recôncavo. Receba $100. | Receba $100 |
| 10 | Contas do hospital. Pague $100. | Pague $100 |
| 11 | Mensalidade da escola. Pague $50. | Pague $50 |
| 12 | Sua avó mandou uma ajuda para o mês. Receba $25. | Receba $25 |
| 13 | Reparos nas ruas do bairro: pague $40 por pousada e $115 por resort. | Pague ao banco |
| 14 | Seu abadá foi eleito o mais bonito do bloco. Receba $10. | Receba $10 |
| 15 | Almoço de domingo para a família toda. Pague $30. | Pague $30 |
| 16 | Os festejos de São João renderam um bom lucro. Receba $100. | Receba $100 |

### 13.3 Regras das cartas

- Embaralhe bem antes de começar. Quando o baralho acabar, **embaralhe de novo as cartas usadas**, mantendo de fora as cartas Proteção que estiverem nas mãos dos jogadores.
- **Cartas "Proteção"** podem ser **guardadas** até serem usadas ou **vendidas** em negociações. Depois de usadas, voltam ao fundo do baralho de origem.
- **Cartas que cobram "por pousada" e "por resort"** (reforma geral e reparos nas ruas): some todas as suas construções. Se você não tiver nenhuma, não paga nada.
- **Cartas que cobram "de cada jogador":** só participam os jogadores **ainda no jogo**.
- Se o jogador não puder pagar uma carta, vende construções, hipoteca ou vai à falência (seção 12). A falência causada por uma carta que cobra do banco é para o banco.

---

## 14. Ajustes de equilíbrio e adaptações

### O que mudou em relação ao Monopoly clássico

| Clássico | Cidadela |
| --- | --- |
| Início (Go) | Chegada: Aeroporto de Salvador |
| Prisão / Vá para a prisão | Forte de São Marcelo / Vá para o Forte |
| Estacionamento livre | Carnaval (Circuito Barra-Ondina), sem prêmio |
| Ferrovias | Transportes: ferry-boat, Elevador Lacerda, plano inclinado e metrô |
| Companhias de serviços | Coelba e Embasa |
| Casas / hotéis | Pousadas / resorts (32 pousadas e 12 resorts no banco) |
| Sorte / Cofre | Fitinha do Bonfim / Bença |
| Carta "Saia da prisão" | Proteção de Iemanjá (Sorte) e Proteção do Senhor do Bonfim (Cofre) |

### Ajustes de equilíbrio

1. **Economia clássica mantida.** Preços de $60 a $400, aluguéis, custo de construção e hipotecas seguem a tabela original, calibrada ao longo de décadas.
2. **Mesma geometria do tabuleiro.** A prisão fica na casa 10, os transportes nas casas 5, 15, 25 e 35, as companhias nas casas 12 e 28 e os grupos de cor nas mesmas posições. Assim, as probabilidades de cair em cada grupo ficam iguais, e laranja e vermelho continuam sendo os grupos mais fortes.
3. **Cartas mais suaves.** Receber ou pagar "de cada jogador" caiu para **$25** nas cartas da Fitinha do Bonfim (a primeira proposta tinha $50), para a partida não virar loteria com 6 a 8 jogadores. O aniversário da Bença segue em $10, como no clássico.
4. **Hipoteca com arredondamento.** Os juros de 10% sobem para o dólar inteiro, o que afeta apenas o Corredor da Vitória e as companhias.
5. **Leilão detalhado.** Regras de lance mínimo, contagem, empate e limite de lance para evitar discussão na mesa.

### Grupos de cor por região

| Grupo | Região |
| --- | --- |
| Marrom | Subúrbio e ilhas de Salvador |
| Azul-claro | Recôncavo, Baixo Sul e Feira de São Joaquim |
| Rosa | Costa do Cacau e Morro de São Paulo |
| Laranja | Chapada Diamantina |
| Vermelho | Costa do Descobrimento |
| Amarelo | Bairros nobres de Salvador |
| Verde | Litoral Norte e Porto Seguro |
| Azul-escuro | Corredor da Vitória e Pelourinho |

### Aviso

O balanceamento **não foi testado em partidas reais**. Se um grupo parecer forte ou fraco demais na sua mesa, ajuste o aluguel dele e anote na escritura.

---

## 15. Carteira e fluxos de dinheiro

Cada jogador tem uma **carteira**: saldo, escrituras e cartas Proteção em mãos. Na versão digital, a carteira do jogador ativo/selecionado deve permanecer visível e atualizar a cada transferência.

### Receber

| Situação | De | Para | Valor |
| --- | --- | --- | --- |
| Chegada | Banco | Jogador | $200 |
| Aluguel | Visitante | Dono | Conforme §8 |
| Hipotecar | Banco | Jogador | 50% do preço |
| Vender construção | Banco | Jogador | 50% do custo |
| Carta a favor | Banco / jogadores | Jogador | Texto da carta |
| Negociação / leilão (quando aplicável) | Outro / banco | Jogador | Combinado / lance |

### Pagar / cobrar

| Situação | De | Para | Valor |
| --- | --- | --- | --- |
| Comprar / lance de leilão | Jogador | Banco | Preço / lance |
| Aluguel | Visitante | Dono | Conforme §8 (pedir antes do próximo dado) |
| Imposto | Jogador | Banco | $200 ou $100 |
| Resgate / juros de hipoteca | Jogador | Banco | Tabela §9 (ceil) |
| Construir | Jogador | Banco | Tabela §8.3 |
| Sair do Forte | Jogador | Banco | $50 |
| Carta contra | Jogador | Banco / jogadores | Texto da carta |

### Saldo insuficiente

Liquidar (vender construções / hipotecar) até cobrir a dívida; se não der, falência (§12). Compra e construção sem saldo são rejeitadas.

---

## 16. Versão digital (resumo de produto)

As regras de mesa deste documento valem iguais no app. Detalhes verificáveis ficam em [`SPECS.md`](./SPECS.md) e a stack em [`STACK.md`](./STACK.md). Resumo do que a versão digital acrescenta sem mudar o objetivo do jogo:

| Tema | Comportamento digital |
| --- | --- |
| **Aluguel** | Modo padrão **pedido**: o dono cobra no HUD antes do próximo lance de dados; se não cobrar a tempo, o direito se perde |
| **Lobby** | Anfitrião cria sala (2–8), compartilha link/QR; convidados escolhem nome e peão; anfitrião é o banqueiro |
| **Online** | Sync via Supabase; **anfitrião aplica as regras** e publica o estado; convidados enviam intenções. Refresh/rejoin para quem já é membro; presença do anfitrião; partida pausa se o anfitrião sumir |
| **Hot-seat** | “Jogar neste aparelho” só em build de desenvolvimento |
| **HUD / mobile** | Em telas estreitas o painel vira **barra inferior** recolhível (rolar e ações urgentes sempre à mão); carteira sobe para o topo |
| **Idiomas** | UI, mensagens de turno e textos de cartas em **pt-BR**, **en** e **ar** (RTL). Nomes das casas do tabuleiro permanecem em português |
| **Carnaval** | Ao aterrissar na casa 20, toca uma faixa aleatória do pool (para ao sair / mute / voltar ao lobby). Sem prêmio em dinheiro (§3 / §5) |

Pendências típicas de produto (não regras de mesa): pousadas/resorts 3D no tabuleiro, mais SFX de partida, animação da viatura ao Forte, guincho ao vender construção, transferência automática de anfitrião se ele abandonar a sessão.

---

*Cidadela é um jogo de fã inspirado no gênero Monopoly clássico. Este documento é o guia de regras do projeto.*
