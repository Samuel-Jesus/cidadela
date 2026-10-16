# Cidadela — Especificação de Requisitos (Volere)

> **Fonte de verdade das regras:** [`REQUISITOS.md`](./REQUISITOS.md)  
> Este documento traduz as regras do jogo em requisitos verificáveis (estrutura Volere).  
> Sempre que `REQUISITOS.md` mudar, esta especificação deve ser revisada e alinhada.

**Template:** Volere Requirements Specification (adaptado)  
**Versão:** 0.1  
**Status:** Rascunho  

---

## Sumário

### Project Drivers
1. [Propósito do projeto](#1-propósito-do-projeto)
2. [Stakeholders](#2-stakeholders)

### Project Constraints
3. [Restrições mandatórias](#3-restrições-mandatórias)
4. [Convenções de nomenclatura e terminologia](#4-convenções-de-nomenclatura-e-terminologia)
5. [Fatos relevantes, regras de negócio e premissas](#5-fatos-relevantes-regras-de-negócio-e-premissas)

### Functional Requirements
6. [Escopo do trabalho](#6-escopo-do-trabalho)
7. [Modelo de dados e dicionário](#7-modelo-de-dados-e-dicionário)
8. [Escopo do produto](#8-escopo-do-produto)
9. [Requisitos funcionais](#9-requisitos-funcionais)

### Non-functional Requirements
10. [Aparência e estilo](#10-aparência-e-estilo)
11. [Usabilidade](#11-usabilidade)
12. [Desempenho](#12-desempenho)
13. [Operação e ambiente](#13-operação-e-ambiente)
14. [Manutenção e suporte](#14-manutenção-e-suporte)
15. [Segurança](#15-segurança)
16. [Requisitos culturais](#16-requisitos-culturais)
17. [Conformidade / legal](#17-conformidade--legal)

### Project Issues
18. [Questões em aberto](#18-questões-em-aberto)
19. [Soluções prontas](#19-soluções-prontas)
20. [Novos problemas](#20-novos-problemas)
21. [Tarefas](#21-tarefas)
22. [Migração](#22-migração)
23. [Riscos](#23-riscos)
24. [Custos](#24-custos)
25. [Documentação e treinamento](#25-documentação-e-treinamento)
26. [Sala de espera](#26-sala-de-espera)
27. [Ideias de solução](#27-ideias-de-solução)

---

## Formato dos requisitos atômicos (Snow Card)

| Campo | Descrição |
| --- | --- |
| **ID** | Identificador único (ex.: FR-01, NFR-01) |
| **Tipo** | Funcional / Não funcional / Restrição |
| **Descrição** | O que o produto deve fazer |
| **Justificativa** | Por que é necessário |
| **Critério de aceitação (Fit Criterion)** | Como verificar se foi atendido |
| **Prioridade** | Alta / Média / Baixa |
| **Origem** | Seção em `REQUISITOS.md` |
| **Conflitos** | IDs conflitantes, se houver |
| **Status** | Proposto / Acordado / Adiado / Rejeitado |

---

# Project Drivers

## 1. Propósito do projeto

### 1a. Objetivo de negócio / do produto

Permitir que 2 a 8 jogadores dispute uma partida de **Cidadela**, jogo de tabuleiro de compra e falência ambientado na Bahia, cujo objetivo é ser o último jogador com dinheiro.

### 1b. Metas mensuráveis

| Meta | Critério |
| --- | --- |
| Regras jogáveis | Uma partida completa pode ser conduzida apenas com `REQUISITOS.md` + dados deste `SPECS.md` (quando preenchidos os valores pendentes) |
| Temática baiana | 100% das casas, cartas e construções usam a nomenclatura de Cidadela (não Monopoly clássico) |
| Paridade mecânica | Mecânicas equivalentes às regras clássicas (compra, aluguel, transporte, companhia, prisão, hipoteca, falência) |

**Origem:** `REQUISITOS.md` → Objetivo, Adaptações baianas

---

## 2. Stakeholders

| Papel | Interesse |
| --- | --- |
| **Cliente / dono do produto** | Definir regras, temática e escopo do Cidadela |
| **Jogadores** | Experiência clara, justa e divertida |
| **Banqueiro** | Gerir dinheiro, escrituras, pousadas e resorts |
| **Designers / desenvolvedores** | Implementar regras sem ambiguidade |
| **Testadores** | Validar critérios de aceitação |

**Usuários do produto:** jogadores (2–8) e, opcionalmente, um banqueiro que também pode ser jogador.

---

# Project Constraints

## 3. Restrições mandatórias

| ID | Descrição | Justificativa | Fit Criterion | Prioridade | Origem |
| --- | --- | --- | --- | --- | --- |
| C-01 | O produto deve seguir as regras documentadas em `REQUISITOS.md` | Fonte única das regras | Toda regra implementada tem referência explícita a `REQUISITOS.md` | Alta | Documento raiz |
| C-02 | Ambientação obrigatória na Bahia | Identidade do produto | Nomes de casas, cartas e construções correspondem às tabelas de `REQUISITOS.md` | Alta | Adaptações baianas |
| C-03 | De 2 a 8 jogadores por partida | Limite de preparação | O sistema (ou regras de mesa) rejeita partida fora desse intervalo | Alta | Preparação |
| C-04 | Tabuleiro com 40 casas (índices 0–39) | Layout definido | Lista de casas idêntica à tabela do tabuleiro | Alta | O tabuleiro |

---

## 4. Convenções de nomenclatura e terminologia

| Termo clássico | Termo Cidadela | Definição |
| --- | --- | --- |
| Início / Go | **Chegada: Aeroporto de Salvador** | Casa 0; ao passar ou parar, recebe $200 |
| Ferrovia | **Transporte** | Ferry-Boat, Elevador Lacerda, Plano Inclinado Gonçalves, Metrô |
| Companhia | **Companhia** | Coelba, Embasa |
| Casa (construção) | **Pousada** | Unidade de construção (máx. 4 por propriedade) |
| Hotel | **Resort** | Substitui 4 pousadas |
| Chance | **Fitinha do Bonfim** | Baralho de sorte |
| Cofre / Community Chest | **Bença** | Baralho de cofre |
| Prisão | **Forte de São Marcelo** | Casa 10; estado “preso” ou “só visita” |
| Vá para a prisão | **Vá para o Forte** | Casa 30; envia ao Forte sem $200 |
| Estacionamento livre | **Carnaval (Circuito Barra-Ondina)** | Casa 20; sem efeito |
| Carta “Saia da prisão” | **Saia do Forte** | Libera o jogador preso |

**Origem:** `REQUISITOS.md` → Adaptações baianas

---

## 5. Fatos relevantes, regras de negócio e premissas

### 5a. Fatos

- Dinheiro inicial por jogador: **$1.500**.
- Bônus da Chegada: **$200**.
- Pedágio da Linha Verde: **pague $200**.
- Abadá do Carnaval: **pague $100**.
- Saída do Forte por pagamento: **$50**.
- Hipoteca: recebe **50%** do valor; resgate = valor + **10%** de juros.
- Venda de construções ao banco: **50%** do preço pago.
- Monopólio de cor: aluguel **dobra** (sem construções).
- Carnaval (casa 20): **não gera dinheiro**.
- Carteira = saldo + escrituras + cartas; toda movimentação de dinheiro é transferência (banco↔jogador ou jogador↔jogador).

### 5b. Premissas

- Tabelas completas de aluguel, custos de pousada/resort e baralhos completos ainda serão documentados em `REQUISITOS.md` (ver Sala de espera).
- Valores de aluguel de transportes e companhias seguirão a lógica clássica até definição explícita.
- Estoque de pousadas/resorts é finito (“o que há na caixa”); quantidade exata a definir.

### 5c. Regras de negócio (resumo)

Ver seção 9 e `REQUISITOS.md` para o detalhamento completo.

---

# Functional Requirements

## 6. Escopo do trabalho

O trabalho cobre a especificação e (futura) implementação de um produto que permita jogar **Cidadela** conforme as regras baianas, incluindo:

- Preparação e gestão de partida
- Turnos, movimento e dados
- Compra, leilão, aluguel, transportes e companhias
- Carteira e transferências (cobrar, receber, comprar, hipotecar, resgatar)
- Cartas Fitinha / Bença
- Construção (pousadas/resorts)
- Hipotecas, Forte, negociações e falência

**Fora do escopo atual:** marketing, distribuição física da caixa, e conteúdo ainda marcado como “próximos tópicos” em `REQUISITOS.md`.

---

## 7. Modelo de dados e dicionário

### 7a. Entidades principais

| Entidade | Atributos principais |
| --- | --- |
| **Partida** | id, status, jogador_da_vez, estoque_pousadas, estoque_resorts |
| **Jogador** | id, peão, saldo, posição (0–39), preso (bool), tentativas_dupla_forte, cartas_saia_do_forte, escrituras[] |
| **Carteira** | visão do jogador: saldo + escrituras (com status) + cartas em mãos |
| **Casa** | número, nome, tipo, preço?, grupo_cor?, valor_taxa? |
| **Propriedade** | casa_id, dono?, hipotecada, n_pousadas, tem_resort |
| **Transporte** | casa_id, dono?, hipotecada? |
| **Companhia** | casa_id, dono?, hipotecada? |
| **Carta** | baralho (Fitinha\|Bença), texto, efeito |
| **Escritura** | propriedade_id, tabela_aluguel (pendente) |
| **Transferência** | de, para (banco\|jogador), valor, motivo (aluguel\|compra\|chegada\|imposto\|hipoteca\|resgate\|construção\|carta\|negociação\|forte) |
| **Negociação** | participantes, itens (dinheiro/propriedades/cartas), status |

### 7b. Tipos de casa

`chegada` | `propriedade` | `bença` | `fitinha` | `imposto` | `transporte` | `forte` | `companhia` | `carnaval` | `va_para_o_forte`

### 7c. Grupos de cor

Conforme tabela em `REQUISITOS.md` → Grupos de cor.

---

## 8. Escopo do produto

### 8a. Fronteiras

O produto (mesa ou digital) deve permitir uma partida completa até restar um vencedor, aplicando todas as regras acordadas em `REQUISITOS.md`.

### 8b. Casos de uso do produto (PUC)

| PUC | Nome | Atores |
| ---: | --- | --- |
| 1 | Preparar partida | Jogadores, Banqueiro |
| 2 | Jogar turno (dados + movimento) | Jogador da vez |
| 3 | Resolver casa | Jogador da vez, Banqueiro |
| 4 | Comprar / leiloar propriedade | Jogadores, Banqueiro |
| 5 | Pagar aluguel | Jogador, Dono |
| 6 | Sacar carta Fitinha / Bença | Jogador |
| 7 | Construir / evoluir para resort | Jogador dono do monopólio |
| 8 | Hipotecar / resgatar | Jogador, Banqueiro |
| 9 | Entrar / sair do Forte | Jogador |
| 10 | Negociar | Jogadores |
| 11 | Declarar falência / encerrar partida | Jogadores, Banqueiro |
| 12 | Consultar carteira (saldo, escrituras, cartas) | Jogador |
| 13 | Cobrar / pagar transferência de dinheiro | Jogador, Dono, Banqueiro |

---

## 9. Requisitos funcionais

### 9.1 Preparação

| ID | Descrição | Fit Criterion | Prioridade | Origem |
| --- | --- | --- | --- | --- |
| FR-01 | A partida aceita entre 2 e 8 jogadores | Tentativa com 1 ou 9+ é rejeitada | Alta | Preparação |
| FR-02 | Cada jogador inicia com $1.500 | Saldo inicial = 1500 para todos | Alta | Preparação |
| FR-03 | Todos começam na casa 0 (Chegada) | posição = 0 no início | Alta | Preparação |
| FR-04 | Existe o papel de banqueiro (pode ser jogador) | Banqueiro identificado na partida | Média | Preparação |

### 9.2 Turno e movimento

| ID | Descrição | Fit Criterion | Prioridade | Origem |
| --- | --- | --- | --- | --- |
| FR-10 | No turno, o jogador rola 2 dados e avança o total no sentido horário | nova_posição = (posição + soma) mod 40 | Alta | Como funciona a vez |
| FR-11 | Ao passar ou parar na Chegada, o jogador recebe $200 do banco | saldo += 200 quando cruza/para em 0 (exceto Vá para o Forte) | Alta | Como funciona a vez |
| FR-12 | Dupla concede nova jogada | Após resolver a casa, se dados iguais, joga de novo | Alta | Como funciona a vez |
| FR-13 | Três duplas seguidas no mesmo turno enviam ao Forte | Contador de duplas = 3 → preso, sem $200 | Alta | Como funciona a vez / Prisão |

### 9.3 Propriedades, compra e aluguel

| ID | Descrição | Fit Criterion | Prioridade | Origem |
| --- | --- | --- | --- | --- |
| FR-20 | Propriedade/transporte/companhia sem dono pode ser comprada pelo preço marcado | Dono = jogador; saldo -= preço; escritura na carteira | Alta | Tipos de casas → Propriedades / Carteira |
| FR-21 | Se recusar compra, a propriedade vai a leilão entre todos | Ao final do leilão, há dono ou permanece do banco conforme regras do leilão | Alta | Propriedades |
| FR-22 | Ao cair em bem alheio não hipotecado, paga aluguel; dono recebe na hora | saldo_visitante -= aluguel; saldo_dono += aluguel | Alta | Propriedades / Carteira |
| FR-23 | Com monopólio de cor (sem construções), aluguel dobra | Aluguel aplicado = 2 × aluguel base | Alta | Construção |
| FR-24 | Compra exige saldo ≥ preço; caso contrário a ação é rejeitada (ou segue para leilão se recusou/não pôde) | Tentativa com saldo insuficiente não altera dono nem saldo | Alta | Carteira → Comprar |

### 9.4 Transportes e companhias

| ID | Descrição | Fit Criterion | Prioridade | Origem |
| --- | --- | --- | --- | --- |
| FR-30 | Aluguel de transporte cresce com a quantidade de transportes do dono | Função aluguel(n_transportes) aplicada corretamente | Alta | Transportes |
| FR-31 | Aluguel de companhia depende dos dados e de quantas companhias o dono tem | Aluguel = multiplicador(n_companhias) × soma_dados | Alta | Companhias |

> **Nota:** multiplicadores exatos pendentes (ver FR em aberto / Waiting Room).

### 9.5 Cartas e casas especiais

| ID | Descrição | Fit Criterion | Prioridade | Origem |
| --- | --- | --- | --- | --- |
| FR-40 | Ao cair em Fitinha do Bonfim, o jogador compra carta e executa o efeito | Efeito da carta aplicada na partida | Alta | Fitinha / Bença |
| FR-41 | Ao cair em Bença, o jogador compra carta e executa o efeito | Idem para baralho Bença | Alta | Fitinha / Bença |
| FR-42 | Impostos transferem o valor indicado ao banco | Pedágio $200; Abadá $100 | Alta | Impostos / Tabuleiro |
| FR-43 | Carnaval não altera saldo nem posição | Nenhuma transferência ao cair na casa 20 | Alta | Carnaval |
| FR-44 | “Vá para o Forte” envia à casa 10 como preso, sem $200 | posição=10, preso=true, sem crédito de Chegada | Alta | Vá para o Forte |

### 9.6 Construção

| ID | Descrição | Fit Criterion | Prioridade | Origem |
| --- | --- | --- | --- | --- |
| FR-50 | Só se constrói com monopólio completo do grupo de cor | Tentativa sem monopólio é rejeitada | Alta | Construção |
| FR-51 | Construção uniforme: diferença de pousadas no grupo ≤ 1 | Estado inválido não é aceito | Alta | Construção |
| FR-52 | Máximo de 4 pousadas por propriedade; depois, resort | 5ª pousada rejeitada; resort exige 4 pousadas | Alta | Construção |
| FR-53 | Estoque de pousadas/resorts é limitado | Não permite construir além do estoque | Alta | Construção |
| FR-54 | Mais construções aumentam o aluguel | Aluguel consulta tabela por nº de pousadas/resort | Alta | Construção |

### 9.7 Hipotecas

| ID | Descrição | Fit Criterion | Prioridade | Origem |
| --- | --- | --- | --- | --- |
| FR-60 | Hipotecar concede 50% do valor da propriedade | saldo += floor(preço/2); hipotecada=true; carteira marca hipotecada | Alta | Hipotecas / Carteira |
| FR-61 | Propriedade hipotecada não gera aluguel | Visitante não paga | Alta | Hipotecas |
| FR-62 | Resgate = valor da hipoteca + 10% | saldo -= ceil(valor_hipoteca * 1.10) ou regra de arredondamento definida; hipotecada=false | Alta | Hipotecas / Carteira |
| FR-63 | Construções devem ser vendidas (50%) antes de hipotecar | Hipoteca bloqueada se houver pousada/resort | Alta | Hipotecas |
| FR-64 | Vender pousada/resort ao banco a qualquer momento por 50% do preço pago | saldo += floor(custo/2); construção removida; estoque do banco incrementa | Alta | Carteira → Vender construções |

### 9.8 Forte de São Marcelo

| ID | Descrição | Fit Criterion | Prioridade | Origem |
| --- | --- | --- | --- | --- |
| FR-70 | Entrada no Forte por casa 30, 3 duplas ou carta | preso=true nos três casos | Alta | Prisão |
| FR-71 | Saída pagando $50 | saldo -= 50; preso=false | Alta | Prisão |
| FR-72 | Saída com carta “Saia do Forte” | Carta consumida; preso=false | Alta | Prisão |
| FR-73 | Até 3 tentativas de dupla; na 3ª falha, paga $50 e sai | Contador 1..3; falha na 3ª → paga e libera | Alta | Prisão |
| FR-74 | Preso pode receber aluguel e negociar | Ações de cobrança e troca permitidas | Alta | Prisão |
| FR-75 | Casa 10 em “só visita” não prende | Parar em 10 sem flag preso ≠ prisão | Alta | Prisão |

### 9.9 Negociações e falência

| ID | Descrição | Fit Criterion | Prioridade | Origem |
| --- | --- | --- | --- | --- |
| FR-80 | Jogadores trocam propriedades, dinheiro e cartas a qualquer momento | Negociação registrada e saldos/donos atualizados | Alta | Negociações |
| FR-81 | Propriedades com construções não podem ser negociadas | Oferta com pousada/resort é rejeitada | Alta | Negociações |
| FR-82 | Falência quando a dívida excede o que se pode liquidar (construções + hipotecas) | Jogador removido; bens → credor ou banco | Alta | Falência |
| FR-83 | Vence o último jogador não falido | Partida encerra com 1 sobrevivente | Alta | Falência / Objetivo |

### 9.10 Tabuleiro

| ID | Descrição | Fit Criterion | Prioridade | Origem |
| --- | --- | --- | --- | --- |
| FR-90 | O tabuleiro contém exatamente as 40 casas listadas | Comparação 1:1 com tabela de `REQUISITOS.md` | Alta | O tabuleiro |
| FR-91 | Grupos de cor conforme tabela | 8 grupos com as propriedades listadas | Alta | Grupos de cor |

### 9.11 Carteira e transferências de dinheiro

| ID | Descrição | Fit Criterion | Prioridade | Origem |
| --- | --- | --- | --- | --- |
| FR-100 | A carteira exibe saldo, escrituras (com status) e cartas do jogador | UI/mesa reflete exatamente o estado do jogador selecionado/da vez | Alta | Carteira e fluxos de dinheiro |
| FR-101 | Toda mudança de saldo ocorre via transferência tipada (motivo conhecido) | Cada crédito/débito tem motivo ∈ {aluguel, compra, chegada, imposto, hipoteca, resgate, construção, venda_construção, carta, negociação, forte, falência} | Alta | Carteira |
| FR-102 | Transferência banco→jogador credita o saldo (Chegada, hipoteca, venda de construção, cartas a favor) | saldo_jogador += valor; banco não precisa de saldo finito no MVP | Alta | Carteira → Receber |
| FR-103 | Transferência jogador→banco debita o saldo (compra, imposto, resgate, construção, saída do Forte, cartas contra) | saldo_jogador -= valor; rejeitada se saldo insuficiente sem liquidação prévia | Alta | Carteira → Pagar |
| FR-104 | Transferência jogador→jogador move o valor (aluguel, cartas entre jogadores, negociação) | saldo_pagador -= v; saldo_recebedor += v atomicamente | Alta | Carteira → Cobrar aluguel |
| FR-105 | Escritura entra na carteira na compra (ou leilão/negociação/falência) e sai quando o bem deixa de ser do jogador | Lista de escrituras = bens com dono = esse jogador | Alta | Carteira → Comprar |
| FR-106 | Com dívida e saldo insuficiente, o jogador deve poder liquidar (vender construções / hipotecar) antes da falência | Após liquidação voluntária, se saldo ≥ dívida, a dívida é quitada; senão FR-82 | Alta | Carteira → Saldo insuficiente |
| FR-107 | A carteira atualiza imediatamente após cada transferência ou mudança de escritura/carta | Observador vê novo saldo/escrituras sem recarregar a partida | Alta | Carteira (digital) |

---

# Non-functional Requirements

## 10. Aparência e estilo

| ID | Descrição | Fit Criterion | Prioridade | Origem |
| --- | --- | --- | --- | --- |
| NFR-10 | Identidade visual inspirada na Bahia (Salvador, litoral, carnaval, cultura local) | Assets e nomes não usam marca Monopoly; usam termos Cidadela | Média | Adaptações baianas |
| NFR-11 | Casas e cartas exibem nomes oficiais do tabuleiro | 100% dos rótulos batem com `REQUISITOS.md` | Alta | Tabuleiro / Cartas |

## 11. Usabilidade

| ID | Descrição | Fit Criterion | Prioridade |
| --- | --- | --- | --- |
| NFR-20 | Fluxo de turno compreensível para quem conhece jogos do gênero | Jogador conclui 1 turno sem consultar regras externas além do painel de ajuda | Média |
| NFR-21 | Regras críticas (Forte, hipoteca, falência) têm confirmação clara | Ações irreversíveis pedem confirmação | Média |
| NFR-22 | Carteira do jogador ativo/selecionado permanece legível durante o turno | Saldo e escrituras visíveis sem abrir modal obrigatório | Alta |

## 12. Desempenho

| ID | Descrição | Fit Criterion | Prioridade |
| --- | --- | --- | --- |
| NFR-30 | Resolução de ações de turno (dados, compra, aluguel) em tempo interativo | Feedback ≤ 1s em cenário local (meta digital) | Baixa |

## 13. Operação e ambiente

| ID | Descrição | Fit Criterion | Prioridade |
| --- | --- | --- | --- |
| NFR-40 | Versão mesa: jogável com componentes físicos descritos nas regras | Partida possível só com regras + componentes | Alta |
| NFR-41 | Versão digital (se houver): plataforma e stack a definir | TBD | Baixa |

## 14. Manutenção e suporte

| ID | Descrição | Fit Criterion | Prioridade |
| --- | --- | --- | --- |
| NFR-50 | Regras centralizadas: mudanças em `REQUISITOS.md` refletem em `SPECS.md` | PR de regra atualiza os dois arquivos ou justifica omissão | Alta |

## 15. Segurança

| ID | Descrição | Fit Criterion | Prioridade |
| --- | --- | --- | --- |
| NFR-60 | (Digital) Integridade do estado da partida contra trapaça básica | Movimentos/valores validados pelo servidor ou árbitro de regras | Baixa |
| NFR-61 | (Digital) Dados de partida não expõem PII desnecessária | Sem coleta além do necessário ao jogo | Baixa |

## 16. Requisitos culturais

| ID | Descrição | Fit Criterion | Prioridade | Origem |
| --- | --- | --- | --- | --- |
| NFR-70 | Representação respeitosa da cultura baiana | Revisão de conteúdo evita estereótipos ofensivos | Alta | Adaptações baianas |
| NFR-71 | Idioma principal: português (Brasil) | UI e regras em pt-BR | Alta | Projeto |

## 17. Conformidade / legal

| ID | Descrição | Fit Criterion | Prioridade |
| --- | --- | --- | --- |
| NFR-80 | Produto original tematicamente distinto de marcas registradas de Monopoly | Sem uso de nomes, logos ou arte proprietários da Hasbro/Parker | Alta |
| NFR-81 | Uso de nomes de lugares/empresas reais (Coelba, Embasa etc.) deve ser avaliado juridicamente | Checklist legal antes de publicação comercial | Média |

---

# Project Issues

## 18. Questões em aberto

1. Tabelas completas de **aluguel** (pousadas/resorts, transportes, companhias)?
2. **Custo** de pousada e resort por grupo de cor?
3. Baralho completo da **Fitinha do Bonfim**?
4. Baralho completo da **Bença**?
5. Quantidade exata de pousadas e resorts no estoque?
6. O produto será **só regras de mesa**, **digital**, ou ambos?
7. Regras detalhadas de **leilão** (lances mínimos, ordem, empate)?

## 19. Soluções prontas

- Mecânica base derivada do gênero Monopoly (domínio público de regras genéricas; não da marca).
- Template Volere para organização de requisitos.
- Documento de regras: `REQUISITOS.md`.

## 20. Novos problemas

- Ambiguidade enquanto tabelas de aluguel/cartas não existirem.
- Possível conflito de marca/nome com lugares e empresas reais da Bahia.
- Complexidade de negociação livre (dificulta automação digital).

## 21. Tarefas

| # | Tarefa | Depende de |
| ---: | --- | --- |
| 1 | Completar tabelas de aluguel e custos em `REQUISITOS.md` | Design de balanceamento |
| 2 | Escrever baralhos Fitinha e Bença | Temática / exemplos existentes |
| 3 | Atualizar este `SPECS.md` com FRs dos valores definidos | Tarefas 1–2 |
| 4 | Definir se haverá implementação digital | Decisão de produto |
| 5 | Protótipo jogável (mesa ou digital) | Specs estáveis |

## 22. Migração

Não aplicável na v0.1 (produto novo).

## 23. Riscos

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Regras incompletas | Partidas inconsistentes | Fechar Waiting Room antes de “1.0” |
| Desbalanceamento de preços | Partidas longas/injustas | Playtests com tabelas |
| Uso de nomes comerciais reais | Risco legal | Renomear ou obter autorização |
| Escopo digital amplo demais | Atraso | Começar por regras + simulação local |

## 24. Custos

A estimar (arte temática, componentes físicos, desenvolvimento digital, jurídico).

## 25. Documentação e treinamento

| Artefato | Público |
| --- | --- |
| `REQUISITOS.md` | Jogadores e designers (regras em linguagem natural) |
| `SPECS.md` (este) | Equipe de produto/engenharia (requisitos verificáveis) |
| Manual resumido (futuro) | Jogadores na primeira partida |

## 26. Waiting Room

Itens adiados, copiados de `REQUISITOS.md` → Próximos tópicos:

- [ ] Tabelas de aluguel (pousadas/resorts, transportes, companhias)
- [ ] Baralho completo da Fitinha do Bonfim
- [ ] Baralho completo da Bença
- [ ] Custo de pousadas/resorts por grupo de cor
- [x] Carteira e fluxos de dinheiro (cobrar/receber/comprar/hipotecar) — FR-100…FR-107
- [ ] Demais regras digitais (leilão detalhado, UI de negociação, multiplayer)
- [ ] Quantidade do estoque de pousadas e resorts
- [ ] Procedimento detalhado de leilão
- [ ] Multiplicadores clássicos de transporte/companhia confirmados para Cidadela
- [ ] Arredondamento oficial do resgate de hipoteca (10% — floor/ceil)

## 27. Ideias de solução

- Implementação digital turn-based local (hot-seat) antes de multiplayer online.
- Modo “banqueiro automático” na versão digital.
- Cartas com efeitos tipados (`avance_para`, `receba_de_cada`, `volte_n`, `va_para_transporte`) para facilitar engine de regras — alinhado aos exemplos da Fitinha em `REQUISITOS.md`.
- Playtest com planilha antes de arte final.

---

## Rastreabilidade

| Área em `REQUISITOS.md` | IDs neste `SPECS.md` |
| --- | --- |
| Objetivo | §1, FR-83 |
| Preparação | FR-01–FR-04, C-03 |
| Como funciona a vez | FR-10–FR-13 |
| Tipos de casas | FR-20–FR-44 |
| Construção | FR-50–FR-54 |
| Hipotecas | FR-60–FR-63 |
| Prisão / Forte | FR-70–FR-75, C-02 |
| Negociações | FR-80–FR-81 |
| Falência | FR-82–FR-83 |
| Carteira e fluxos de dinheiro | FR-24, FR-64, FR-100–FR-107, PUC 12–13, NFR-22 |
| Adaptações baianas | §4, NFR-10, NFR-70 |
| Tabuleiro | FR-90–FR-91, C-04 |
| Exemplos de cartas | FR-40, Waiting Room |
| Próximos tópicos | §18, §26 |

---

*Fim da especificação Volere v0.1 — manter sincronizado com `REQUISITOS.md`.*
