# Cidadela — Especificação de Requisitos (Volere)

> **Fonte de verdade das regras:** [`REQUISITOS.md`](./REQUISITOS.md)  
> Este documento traduz as regras do jogo em requisitos verificáveis (estrutura Volere).  
> Sempre que `REQUISITOS.md` mudar, esta especificação deve ser revisada e alinhada.

**Template:** Volere Requirements Specification (adaptado)  
**Versão:** 0.6  
**Status:** Alinhado a `REQUISITOS.md` §16 · hot-seat + online (reconnect/presença) · HUD mobile · i18n pt-BR/en/ar · SFX UI Lobby + música Carnaval parcial · SFX de dados/economia/UI partida ainda pendentes  

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
17b. [Áudio, animações e efeitos de casa (digital)](#17b-áudio-animações-e-efeitos-de-casa-digital)

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
| Carta “Saia da prisão” | **Proteção** (Iemanjá / Senhor do Bonfim) | Carta guardável; sai do Forte sem pagar |

**Origem:** `REQUISITOS.md` §14

---

## 5. Fatos relevantes, regras de negócio e premissas

### 5a. Fatos

- Dinheiro inicial por jogador: **$1.500** (composição de notas em `REQUISITOS.md` §2).
- Bônus da Chegada: **$200**.
- Pedágio da Linha Verde: **pague $200**; Abadá do Carnaval: **pague $100** (ao banco, nunca ao centro).
- Saída do Forte por pagamento: **$50**.
- Hipoteca: **50%** do preço; juros **10%** com **ceil** (dólar inteiro); tabela em `REQUISITOS.md` §9.
- Estoque do banco: **32 pousadas** e **12 resorts**.
- Transportes: aluguel **$25 / $50 / $100 / $200** conforme 1–4.
- Companhias: **4×** ou **10×** o total dos dados.
- Aluguel e custos de pousada/resort: tabelas em `REQUISITOS.md` §8.
- Baralhos: **16** Fitinha + **16** Bença (`REQUISITOS.md` §13).
- Carnaval (casa 20): **não gera dinheiro**.
- Carteira = saldo + escrituras + cartas Proteção; transferências tipadas (banco↔jogador ou jogador↔jogador).

### 5b. Premissas

- Balanceamento ainda **sem playtest** formal (`REQUISITOS.md` §14 — Aviso).
- Produto digital: multiplayer Supabase em produção; hot-seat local só em dev (`STACK.md`).
- Leilão digital pode simplificar a “contagem oral” preservando lance mínimo, limite de caixa e empate.

### 5c. Regras de negócio (resumo)

Ver seção 9 e `REQUISITOS.md` (documento completo).

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
| **Jogador** | id, peão, saldo, posição (0–39), preso (bool), tentativas_dupla_forte, cartas_protecao[], escrituras[] |
| **Carteira** | visão do jogador: saldo + escrituras (com status) + cartas Proteção |
| **Baralho** | tipo (Fitinha\|Bença), pilha, descarte; cartas Proteção fora da pilha enquanto guardadas |
| **EstoqueBanco** | pousadas_restantes (0–32), resorts_restantes (0–12) |
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

### 9.1 Preparação / Lobby

| ID | Descrição | Fit Criterion | Prioridade | Origem |
| --- | --- | --- | --- | --- |
| FR-01 | A partida aceita entre 2 e 8 jogadores | Tentativa com 1 ou 9+ é rejeitada | Alta | Preparação |
| FR-02 | Cada jogador inicia com $1.500 | Saldo inicial = 1500 para todos | Alta | Preparação |
| FR-03 | Todos começam na casa 0 (Chegada) | posição = 0 no início | Alta | Preparação |
| FR-04 | Existe o papel de banqueiro (pode ser jogador) | Banqueiro identificado na partida | Média | Preparação |
| FR-05 | (Digital) Lobby em modo **anfitrião + convidados** | App abre no Lobby (ou join via link); partida só inicia com setup válido | Alta | Preparação / Lobby |
| FR-05a | **Anfitrião** escolhe só a **quantidade** de jogadores (2–8) e cria a sessão | Não preenche nomes/peões dos outros | Alta | Lobby |
| FR-05b | Sessão gera **link compartilhável** e **QR Code** para entrada | Link contém id da sala; QR codifica o mesmo URL | Alta | Lobby |
| FR-05c | Convidado abre o link/QR, escolhe **nome** e **peão** único e entra na sala | Peões não se repetem; nome obrigatório; capacidade = quantidade do anfitrião | Alta | Lobby |
| FR-05d | Anfitrião é o **banqueiro** (FR-04) e também jogador (nome/peão próprios na sala) | `isBanker` = anfitrião | Média | Lobby |
| FR-05e | Anfitrião inicia quando há ≥2 jogadores na sala (idealmente a mesa cheia) | `Começar` cria jogadores FR-02/FR-03 a partir dos membros conectados | Alta | Lobby |
| FR-05f | Nova partida / vitória volta ao Lobby (nova sessão) | Estado da sala anterior descartado | Média | Lobby |
| FR-05g | Sync da sala e da partida via **Supabase** (Realtime + Postgres) | Auth anônima; anfitrião aplica regras e grava `games.state`; convidados enviam `game_actions` e hidratam | Alta | Lobby / Online · §16 |
| FR-05h | **Jogar neste aparelho** (hot-seat): uma pessoa monta a mesa toda (2–8 assentos com nome, peão único e banqueiro) e começa direto | **Só em `import.meta.env.DEV`** — não vai para produção; valida com `validateLobbySetup` | Baixa | Lobby / Dev |
| FR-05i | **Reconnect / rejoin:** membro existente retoma partida após refresh ou pelo mesmo link/`sessionStorage` | URL `?room=` preservada durante a partida; `cidadela:onlineSession` no sessionStorage; join em sala `playing` só se já for membro | Alta | Online · §16 |
| FR-05j | **Presença do anfitrião:** convidados detectam host online/offline (Realtime Presence) | Banner “anfitrião ausente”; intents de convidado bloqueados enquanto host estiver fora (grace ~3s no join) | Alta | Online · §16 |
| FR-05k | **Autorização de intents:** anfitrião só aplica ação se o `actor_id` for elegível (vez, dono do aluguel, devedor, lance de leilão, etc.) | Intent fora da vez é ignorado; não altera `games.state` | Alta | Online |
| FR-05l | Conflito de versão no push do host: recarrega snapshot remoto e não sobrescreve às cegas | `pushGameState` retorna conflict + row; host hidrata e segue | Média | Online |
| FR-05m | Guest tem **poll de backup** do estado (~6s) além do Realtime | Se Realtime falhar, versão maior ainda hidrata a UI | Média | Online |
| FR-06 | (Digital) Tela de **Loading** antes do Lobby, com **avião** | Splash/loading visível até assets críticos prontos (ou timeout seguro) | Alta | Boot / Loading |
| FR-06a | Loading: avião em movimento (temática Bahia / aeroporto) | Animação contínua; marca “Cidadela” legível | Alta | Loading |
| FR-06b | Loading cobre pré-carga de modelos 3D (landmarks GLTF) e shell | Lobby só aparece após loading concluir (mínimo visual opcional ~1,5s) | Média | Loading |

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
| FR-22 | Ao cair em bem alheio não hipotecado, paga aluguel; dono recebe na hora | saldo_visitante -= aluguel; saldo_dono += aluguel (valores §8) | Alta | Propriedades / Carteira |
| FR-22a | (Mesa) Dono deve pedir aluguel antes do próximo jogador rolar dados; senão perde a cobrança | Cobrança após o próximo roll é inválida | Média | Terrenos |
| FR-23 | Com monopólio de cor (sem construções e sem hipoteca no grupo), aluguel dobra | Aluguel = coluna “Grupo completo”; se algum do grupo hipotecado, sem dobro | Alta | Construção / Hipotecas |
| FR-24 | Compra exige saldo ≥ preço; se recusar ou não puder, vai a leilão | Tentativa sem saldo não altera dono; fluxo → PUC leilão | Alta | Carteira → Comprar |
| FR-25 | Aluguel de terreno consulta tabela §8.1 (pousadas / resort) | Valor aplicado = célula correspondente | Alta | Tabelas de aluguel |

### 9.4 Transportes e companhias

| ID | Descrição | Fit Criterion | Prioridade | Origem |
| --- | --- | --- | --- | --- |
| FR-30 | Aluguel de transporte: $25 / $50 / $100 / $200 para 1–4 transportes | Valor = tabela §8.2 | Alta | Transportes |
| FR-31 | Aluguel de companhia: 4× (1) ou 10× (2) o total dos dados da jogada | Aluguel = multiplicador × soma_dados | Alta | Companhias |

### 9.5 Cartas e casas especiais

| ID | Descrição | Fit Criterion | Prioridade | Origem |
| --- | --- | --- | --- | --- |
| FR-40 | Ao cair em Fitinha, compra do topo, executa e devolve ao fundo (exceto Proteção) | 16 cartas §13.1; efeito tipado aplicado | Alta | Fitinha |
| FR-41 | Ao cair em Bença, idem | 16 cartas §13.2 | Alta | Bença |
| FR-45 | Cartas Proteção ficam na mão até uso ou negociação; após uso voltam ao fundo | Contagem de Proteção no jogador correta | Alta | Cartas |
| FR-46 | Baralho esgotado: reembaralhar descartes, excluindo Proteções em mãos | Pilha renovada sem cartas guardadas | Média | Cartas |
| FR-42 | Impostos transferem o valor indicado ao banco | Pedágio $200; Abadá $100 | Alta | Impostos / Tabuleiro |
| FR-43 | Carnaval não altera saldo nem posição | Nenhuma transferência ao cair na casa 20 | Alta | Carnaval |
| FR-43a | (Digital) Ao cair no Carnaval, efeitos audiovisuais festivos **sem** mudar regras (FR-43) | Toca trilha aleatória do pool Carnaval/Canário; UI/cena reage; saldo/posição inalterados | Média | Carnaval / NFR-AV |
| FR-44 | “Vá para o Forte” envia à casa 10 como preso, sem $200 | posição=10, preso=true, sem crédito de Chegada | Alta | Vá para o Forte |
| FR-44a | (Digital) Prisão: animação da viatura busca o peão, cruza o miolo do tabuleiro e deixa o preso no Forte | Animação completa antes (ou em paralelo controlado) do peão aparecer preso na casa 10; sem $200 | Alta | Vá para o Forte / NFR-AV |

### 9.6 Construção

| ID | Descrição | Fit Criterion | Prioridade | Origem |
| --- | --- | --- | --- | --- |
| FR-50 | Só se constrói com monopólio completo do grupo de cor | Tentativa sem monopólio é rejeitada | Alta | Construção |
| FR-51 | Construção uniforme: diferença de pousadas no grupo ≤ 1 | Estado inválido não é aceito | Alta | Construção |
| FR-52 | Máximo de 4 pousadas por propriedade; depois, resort | 5ª pousada rejeitada; resort exige 4 pousadas | Alta | Construção |
| FR-53 | Estoque limitado a 32 pousadas e 12 resorts | Contadores do banco respeitados; escassez → leilão de peça | Alta | Construção |
| FR-54 | Mais construções aumentam o aluguel | Aluguel consulta tabela §8.1 | Alta | Construção |
| FR-55 | Custo de pousada/resort por grupo conforme §8.3 | Débito = custo do grupo; resort devolve 4 pousadas ao banco | Alta | Custos de construção |
| FR-56 | Grupo com terreno hipotecado: sem construção e sem dobro de aluguel | Tentativa de construir rejeitada; aluguel base sem 2× | Alta | Pousadas / Hipotecas |

### 9.7 Hipotecas

| ID | Descrição | Fit Criterion | Prioridade | Origem |
| --- | --- | --- | --- | --- |
| FR-60 | Hipotecar concede 50% do preço (tabela §9) | saldo += valor_hipoteca; hipotecada=true | Alta | Hipotecas / Carteira |
| FR-61 | Propriedade hipotecada não gera aluguel | Visitante não paga | Alta | Hipotecas |
| FR-62 | Resgate = hipoteca + 10% com **ceil** ao dólar | Ex.: Vitória $193; Coelba/Embasa $83; tabela §9 | Alta | Hipotecas |
| FR-63 | Antes de hipotecar terreno de um grupo, vender todas as construções do grupo | Hipoteca bloqueada se houver pousada/resort no grupo | Alta | Hipotecas |
| FR-64 | Vender pousada/resort ao banco por 50% do preço pago (uniforme) | saldo += floor(custo/2); estoque incrementa | Alta | Vender construções |
| FR-64a | (Digital) Ao vender construção, um **guincho** busca a peça na casa e a leva embora (devolve ao banco) | Animação do guincho no terreno; peça some do tabuleiro; regras FR-64 inalteradas | Média | Vender construções / NFR-AV |
| FR-65 | Ao receber bem hipotecado (negociação/falência/leilão): resgatar já ou pagar só juros 10% (ceil) e manter hipotecado | Uma das duas opções aplicada na hora | Alta | Hipotecas |

### 9.8 Forte de São Marcelo

| ID | Descrição | Fit Criterion | Prioridade | Origem |
| --- | --- | --- | --- | --- |
| FR-70 | Entrada no Forte por casa 30, 3 duplas ou carta | preso=true nos três casos | Alta | Prisão |
| FR-71 | Saída pagando $50 | saldo -= 50; preso=false | Alta | Prisão |
| FR-72 | Saída com carta Proteção (Iemanjá ou Senhor do Bonfim) | Carta consumida e devolvida ao fundo do baralho; preso=false | Alta | Prisão |
| FR-73 | Até 3 tentativas de dupla; na 3ª falha, paga $50 e sai | Contador 1..3; falha na 3ª → paga e libera | Alta | Prisão |
| FR-74 | Preso pode receber aluguel e negociar | Ações de cobrança e troca permitidas | Alta | Prisão |
| FR-75 | Casa 10 em “só visita” não prende | Parar em 10 sem flag preso ≠ prisão | Alta | Prisão |

### 9.9 Negociações e falência

| ID | Descrição | Fit Criterion | Prioridade | Origem |
| --- | --- | --- | --- | --- |
| FR-80 | Jogadores trocam terrenos (hipotecados ou não), transportes, companhias, dinheiro e cartas Proteção | Negociação registrada; saldos/donos/cartas atualizados | Alta | Negociações |
| FR-81 | Propriedades com construções não podem ser negociadas | Oferta com pousada/resort é rejeitada | Alta | Negociações |
| FR-82 | Falência quando a dívida excede o que se pode liquidar (construções + hipotecas) | Jogador removido; bens → credor ou banco (leilão se banco) | Alta | Falência |
| FR-83 | Vence o último jogador não falido | Partida encerra com 1 sobrevivente | Alta | Falência / Objetivo |
| FR-84 | (Opcional) Jogo curto por tempo: vence maior patrimônio (dinheiro + preço de compra + custo de construções) | Ranking calculado ao estourar o timer acordado | Baixa | Falência |

### 9.9b Leilão

| ID | Descrição | Fit Criterion | Prioridade | Origem |
| --- | --- | --- | --- | --- |
| FR-85 | Leilão ao recusar/não poder comprar, na falência para o banco, ou por peça escassa | Fluxo de leilão iniciado nos três gatilhos | Alta | Leilão |
| FR-86 | Lance inicial ≥ $1; incremento mínimo $10 (ou $5 se combinado para bens $60–$100) | Lance inválido rejeitado | Alta | Leilão |
| FR-87 | Lance limitado ao dinheiro em mãos no momento | Lance > saldo rejeitado | Alta | Leilão |
| FR-88 | Sem lances: bem permanece do banco; dinheiro do leilão vai ao banco | Estado e saldos corretos | Alta | Leilão |
| FR-89 | Empate de lances: chance de aumentar; senão dados (maior total) | Um vencedor definido | Média | Leilão |

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
| NFR-12 | Casas especiais têm “beat” audiovisual próprio (ver §17b) | Carnaval, Forte/prisão e eventos de dinheiro têm SFX/animação distintos | Média | Produto digital |

## 11. Usabilidade

| ID | Descrição | Fit Criterion | Prioridade |
| --- | --- | --- | --- |
| NFR-20 | Fluxo de turno compreensível para quem conhece jogos do gênero | Jogador conclui 1 turno sem consultar regras externas além do painel de ajuda | Média |
| NFR-21 | Regras críticas (Forte, hipoteca, falência) têm confirmação clara | Ações irreversíveis pedem confirmação | Média |
| NFR-22 | Carteira do jogador ativo/selecionado permanece legível durante o turno | Saldo e escrituras visíveis sem abrir modal obrigatório | Alta |
| NFR-23 | **Mobile (≤767px):** HUD em barra inferior recolhível; Rolar e ações urgentes (dívida, aluguel, comprar) acessíveis sem expandir | Safe-area respeitada; carteira no topo; hint de órbita oculto no mobile | Alta |
| NFR-24 | Status online visível (sync / reconectando / erro / host ausente) | Banner não bloqueia o tabuleiro; some quando `live` | Média |
| NFR-25 | Controles de turno só liberam ações do jogador local elegível | “Aguarde — não é a sua vez” quando online e não é a vez; hostAway desliga controles | Alta |

## 12. Desempenho

| ID | Descrição | Fit Criterion | Prioridade |
| --- | --- | --- | --- |
| NFR-30 | Resolução de ações de turno (dados, compra, aluguel) em tempo interativo | Feedback ≤ 1s em cenário local (meta digital) | Baixa |

## 13. Operação e ambiente

| ID | Descrição | Fit Criterion | Prioridade |
| --- | --- | --- | --- |
| NFR-40 | Versão mesa: jogável com componentes físicos descritos nas regras | Partida possível só com regras + componentes | Alta |
| NFR-41 | Versão digital: navegador moderno (desktop + mobile); stack em `STACK.md` | Chrome/Safari/Firefox recentes; touch + mouse | Alta |
| NFR-42 | Online requer Supabase configurado (`VITE_SUPABASE_*`) + migração SQL | Sem env, lobby online indisponível; hot-seat DEV segue local | Alta |

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
| NFR-71 | Idioma principal: português (Brasil) | UI e regras em pt-BR por padrão | Alta | Projeto |
| NFR-72 | UI, mensagens de turno e textos de cartas em **pt-BR**, **en** e **ar** | Seletor de idioma (bandeiras); `dir=rtl` em ar; nomes das **casas** do tabuleiro permanecem em pt | Alta | §16 / i18n |
| NFR-73 | Preferência de idioma persiste na sessão | Reload mantém locale escolhido | Média | i18n |

## 17. Conformidade / legal

| ID | Descrição | Fit Criterion | Prioridade |
| --- | --- | --- | --- |
| NFR-80 | Produto original tematicamente distinto de marcas registradas de Monopoly | Sem uso de nomes, logos ou arte proprietários da Hasbro/Parker | Alta |
| NFR-81 | Uso de nomes de lugares/empresas reais (Coelba, Embasa etc.) deve ser avaliado juridicamente | Checklist legal antes de publicação comercial | Média |
| NFR-82 | Faixas musicais (Carnaval, Canário / axé) usam licença válida ou produção original | Nenhuma faixa comercial sem direito de uso em build público | Alta |

## 17b. Áudio, animações e efeitos de casa (digital)

Feedback sensorial **não altera regras** (saldo, posição, dono). Mute global e volume devem existir na UI.

**Código atual:** `apps/game/src/audio/sfx.ts` (HTMLAudioElement + preload) · Kenney CC0 em `public/sounds/ui/` · mute Lobby · **música Carnaval** (OGG em `public/sounds/carnaval/`, toca ao aterrissar na casa 20). Ainda faltam SFX de dados, peão, economia e UI da partida.

### Inventário — o que já existe vs o que falta

| Área | Status | Notas |
| --- | --- | --- |
| Infra `playSfx` / unlock / volume / mute persistente | Parcial | Mute + volume em `localStorage`; slider de volume na UI ainda não |
| SFX UI Lobby (click, hover, back, select, switch, error) | Feito | Ligado em CTAs, peão e erros do Lobby |
| SFX UI partida (HUD, modais, carteira, leilão, trade) | **Falta** | Reusar os mesmos IDs UI ou variantes |
| **Dados** (lançar, quicar, parar, dupla) | **Falta** | Prioridade alta — ver NFR-AV-50…54 |
| Passos do peão / aterrissar na casa | **Falta** | NFR-AV-55…56 |
| Dinheiro (receber / pagar / imposto) | **Falta** | NFR-AV-01…04 |
| Compra, hipoteca, construção, carta, leilão, trade, vitória | **Parcial** | Leilão start + carta “sem sorte” + ganhar $ + aluguel + vez (`/sounds/game/`); resto NFR-AV-57…63 |
| Carnaval (música ao aterrissar) | **Parcial** | Pool OGG (`igor_kanario*`); para ao sair/mute/lobby. FX confete e pool ≥3 “Canário” ainda faltam (NFR-AV-10…11) |
| Sirene / SFX da viatura (prisão) | **Falta** | NFR-AV-22 |
| SFX do guincho (venda de construção) | **Falta** | NFR-AV-42 |
| Animação 3D viatura → Forte | **Falta** | NFR-AV-20…23 |
| Animação 3D guincho | **Falta** | NFR-AV-40…42 |
| Prefetch dos SFX de partida no loading | **Falta** | Estender `preloadAssets` / `preloadUiSfx` |

### SFX de dados e movimento (partida)

Sugestão de pastas: `public/sounds/dice/` · `public/sounds/game/`.

| ID | Descrição | Quando disparar | Prioridade |
| --- | --- | --- | --- |
| NFR-AV-50 | Som de **lançar** os dados | Clique em “Rolar” / início da física (`diceRolling=true`) | Alta |
| NFR-AV-51 | Som(s) de **impacto / quique** na bandeja | Contatos dos dados com a mesa (throttle se muitos hits) | Alta |
| NFR-AV-52 | Som de **parada** / resultado revelado | `onRollComplete` (faces lidas) | Alta |
| NFR-AV-53 | Stinger curto de **dupla** | Quando `diceRoll` é dupla (exceto 3ª → Forte) | Média |
| NFR-AV-54 | Stinger de **3ª dupla → Forte** (ou sirene curta) | Antes/durante envio à prisão por 3 duplas | Média |
| NFR-AV-55 | Tick / passo do peão | Cada casa avançada no path | Média |
| NFR-AV-56 | Soft land ao **parar na casa** final | Fim do movimento do peão | Baixa |

### SFX de dinheiro e economia

| ID | Descrição | Fit Criterion | Prioridade |
| --- | --- | --- | --- |
| NFR-AV-01 | Som distinto ao **receber** dinheiro (Chegada $200, aluguel cobrado, carta a favor, venda/hipoteca) | Evento de crédito dispara SFX de “recebimento” | Alta |
| NFR-AV-02 | Som distinto ao **pagar** / transferir (aluguel pago, compra, construção, resgate, saída do Forte $50, negociação) | Evento de débito dispara SFX de “pagamento/transferência” | Alta |
| NFR-AV-03 | Som específico de **imposto** (Pedágio da Linha Verde $200, Abadá do Carnaval $100) | Queda em casa `imposto` ou quitação do imposto dispara SFX de imposto (não o genérico de pagamento, ou variante clara) | Alta |
| NFR-AV-04 | Feedback sonoro (e, se couber, microanimação na carteira) a cada ponto de transferência relevante | Observador associa o som ao motivo (crédito vs débito vs imposto) | Média |

### SFX de ações de partida (além de dinheiro)

| ID | Descrição | Quando disparar | Prioridade |
| --- | --- | --- | --- |
| NFR-AV-57 | Compra de escritura / “selo” | Compra confirmada | Média |
| NFR-AV-58 | Hipotecar / resgatar | Ação na escritura | Baixa |
| NFR-AV-59 | Construir pousada / resort | Build confirmado | Média |
| NFR-AV-60 | Comprar / revelar carta Fitinha ou Bença | Draw + abertura do modal | Média |
| NFR-AV-61 | Lance / ganhou leilão | Bid e fim do leilão | Baixa |
| NFR-AV-62 | Aceite / recusa de negociação | Trade overlay | Baixa |
| NFR-AV-63 | Vitória / fim de partida | `VictoryOverlay` | Média |

### Casas e momentos especiais

| ID | Descrição | Fit Criterion | Prioridade |
| --- | --- | --- | --- |
| NFR-AV-10 | **Carnaval (casa 20):** ao aterrissar, toca música aleatória de um pool **Carnaval** e/ou **Canário** (axé / bloco); efeitos visuais leves (confete, luzes) opcionais | Cada pouso escolhe faixa ao acaso; FR-43 respeitado (sem prêmio em $) | Alta |
| NFR-AV-11 | Pools de áudio separados ou etiquetados (`carnaval`, `canario`) com ≥3 faixas cada (ou produção original equivalente) | RNG não repete a mesma faixa duas vezes seguidas se o pool tiver ≥2 itens | Média |
| NFR-AV-12 | Outras casas/marcos podem ganhar stingers curtos depois (Chegada, Fitinha, Bença, impostos) | Extensível; Carnaval e prisão são o MVP audiovisual | Baixa |

### Animação da prisão (viatura)

| ID | Descrição | Fit Criterion | Prioridade |
| --- | --- | --- | --- |
| NFR-AV-20 | Ao ir para o Forte (casa 30, 3 duplas ou carta), uma **viatura / carro da polícia** busca o peão na casa atual | Modelo 3D (ou proxy) aparece junto ao peão condenado | Alta |
| NFR-AV-21 | A viatura leva o peão **pelo miolo do tabuleiro** (atalho visual pelo centro, não só pelo perímetro) até a casa 10 (Forte) | Trajetória clara pelo centro; peão some da casa de origem durante o trajeto | Alta |
| NFR-AV-22 | A viatura **deixa o peão na prisão** (slot de preso na casa 10) e parte / some | Estado `preso=true`, posição=10; SFX de sirene curto opcional; sem $200 da Chegada | Alta |
| NFR-AV-23 | A animação não quebra o fluxo de regras: após (ou ao fim de) a cena, o turno segue FR-70…FR-75 | Jogador consegue pagar $50 / Proteção / tentar dupla no próximo turno | Alta |
| NFR-AV-24 | Mute de áudio não cancela a animação da viatura; só silencia sirene/música | Animação joga com volume 0 | Média |

### Animação de venda de construção (guincho)

| ID | Descrição | Fit Criterion | Prioridade |
| --- | --- | --- | --- |
| NFR-AV-40 | Ao **vender pousada ou resort** ao banco (FR-64), um **guincho** aparece na casa da escritura | Modelo 3D (ou proxy) chega ao terreno do jogador | Alta |
| NFR-AV-41 | O guincho **busca a peça** (pousada/resort) — visualmente “engancha” / carrega a construção | A construção some da casa (ou sobe no guincho) durante a cena | Alta |
| NFR-AV-42 | O guincho **leva a peça embora** (sai do tabuleiro ou rumo a um “depósito do banco”) e some | Estoque do banco incrementa conforme FR-64; SFX de guincho/metal curto opcional | Alta |
| NFR-AV-43 | Venda em sequência (várias peças / liquidação) pode encadear guinchos ou um por peça, sem corromper o estado | Cada venda válida termina com `pousadas`/`hasResort` e estoque corretos | Média |
| NFR-AV-44 | Mute não cancela a animação do guincho; só silencia o SFX | Animação joga com volume 0 | Baixa |
| NFR-AV-45 | Hipotecar **sem** vender construção não dispara guincho; só venda de peça ao banco | Hipoteca usa outro feedback (se houver) | Média |

### Controles

| ID | Descrição | Fit Criterion | Prioridade |
| --- | --- | --- | --- |
| NFR-AV-30 | Controles de volume (SFX / música) e mute | Preferência persiste na sessão (localStorage ok no MVP) | Média |
| NFR-AV-31 | Músicas longas do Carnaval não travam o turno: fade-out ao passar a vez ou ao sair da casa | Volume cai em ≤2s ao mudar de contexto | Média |

**NFR-AV-30 (estado):** mute no Lobby **feito**; slider de volume e mute visível **na partida** ainda faltam.

---

# Project Issues

## 18. Questões em aberto

1. Playtest de balanceamento das tabelas §8 (aviso em `REQUISITOS.md` §14).
2. ~~Incremento mínimo de leilão digital~~ — **fechado:** $5 em bens ≤$100, senão $10 (`minBidIncrement` / peças usam custo de grupo).
3. ~~UX digital da cobrança de aluguel (FR-22a)~~ — **fechado no MVP:** modo `claim` (dono cobra no HUD; próximo roll perde o direito). Toggle “auto” opcional ainda não existe na UI.
4. ~~Multiplayer online~~ — Supabase Realtime (host-authoritative); reconnect/presença (FR-05i…m); Edge Function anti-cheat e **transferência de host** ainda opcionais.
5. ~~Papel de banqueiro explícito (FR-04) e tela de preparação~~ — Lobby implementado (FR-05…).
6. Pacote de áudio: faixas originais vs licença (Carnaval / Canário) — ver NFR-82 (já há OGG de Carnaval no app).
7. Duração e cancelamento da animação da viatura (skip no hot-seat?).
8. Guincho: um por peça vs batch na liquidação; skip no hot-seat?
9. Transferência automática de anfitrião se o host abandonar a sessão (exige mudança de RLS / migração).
10. i18n dos **nomes das casas** do tabuleiro (hoje só UI/cartas; casas ficam em pt).

## 19. Soluções prontas

- Mecânica base do gênero Monopoly (regras genéricas; não da marca).
- Template Volere.
- `REQUISITOS.md` completo (tabuleiro, tabelas, baralhos, leilão, hipotecas).
- Hot-seat digital jogável (`STACK.md` / `apps/game`): tabuleiro 3D, dados, carteira, turnos, Forte, falência, leilão (escritura + peça escassa + empate), negociação, fim de jogo, Vitest nos FRs críticos.

## 20. Novos problemas

- Possível conflito de marca/nome com lugares e empresas reais da Bahia.
- Complexidade de negociação livre e leilão oral na automação digital (mitigado com overlays hot-seat).
- Balanceamento ainda sem playtest.

## 21. Tarefas

| # | Tarefa | Depende de | Status |
| ---: | --- | --- | --- |
| 1 | Completar tabelas de aluguel e custos | — | Feito |
| 2 | Baralhos Fitinha e Bença | — | Feito |
| 3 | Atualizar `SPECS.md` com FRs dos valores | 1–2 | Feito (v0.2) |
| 4 | Codificar tabelas §8–§9 e baralhos §13 em `packages/shared` | Specs | Feito |
| 5 | Engine: resolver casa (aluguel, imposto, Forte, cartas) | 4 | Feito |
| 6 | Hot-seat completo + hipotecas / construção / leilão / negociação / falência / fim de jogo | 5 | Feito |
| 7 | Vitest FRs críticos (`packages/shared`) | 6 | Feito (base) |
| 8 | Lobby anfitrião + link/QR + join (FR-05…05g) | 6 | Feito (Supabase) |
| 8b | Loading com avião (FR-06…06b) antes do Lobby | 6 | Feito |
| 9 | Playtest de balanceamento | 6 | Pendente |
| 10a | SFX UI Lobby (`sfx.ts` + Kenney) | 6 | Feito (parcial; mute ok) |
| 10b | SFX **dados** + passos do peão (NFR-AV-50…56) | 6 | Pendente |
| 10c | SFX dinheiro / imposto / ações (NFR-AV-01…04, 57…63) | 6 | Pendente |
| 10d | Pools Carnaval & Canário (§17b) | 6 | Parcial (Carnaval OGG); Canário/FX pendentes |
| 11 | Animação viatura → Forte pelo miolo do tabuleiro (FR-44a / NFR-AV-20…23) | 6 | Pendente |
| 12 | Animação guincho ao vender pousada/resort (FR-64a / NFR-AV-40…42) | 6 | Pendente |
| 13 | Multiplayer online (Supabase Realtime) | 9 | Feito (host-authoritative) |
| 13b | Reconnect, presença, auth de intents, poll (FR-05i…m) | 13 | Feito |
| 13c | Transferência de host / Edge Function autoridade | 13 | Pendente |
| 14 | HUD mobile (NFR-23) + banner online (NFR-24) | 6 | Feito |
| 15 | i18n pt-BR / en / ar (NFR-72) — UI, msgs, cartas | 6 | Feito; nomes de casas pendente |

## 22. Migração

Não aplicável na v0.1 (produto novo).

## 23. Riscos

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Desbalanceamento de preços | Partidas longas/injustas | Playtests com tabelas §8 |
| Uso de nomes comerciais reais | Risco legal | Renomear ou obter autorização |
| Escopo digital amplo demais | Atraso | Hot-seat + engine por fatias (resolver casa → hipotecas → cartas) |
| Divergência doc × código | Bugs de regra | Codificar tabelas a partir de `REQUISITOS.md` §8–§13 |

## 24. Custos

A estimar (arte temática, componentes físicos, desenvolvimento digital, jurídico).

## 25. Documentação e treinamento

| Artefato | Público |
| --- | --- |
| `REQUISITOS.md` | Jogadores e designers (regras em linguagem natural) |
| `SPECS.md` (este) | Equipe de produto/engenharia (requisitos verificáveis) |
| Manual resumido (futuro) | Jogadores na primeira partida |

## 26. Waiting Room

Regras de mesa em `REQUISITOS.md` (+ §16 digital). Status de **implementação**:

### Feito no código

- [x] Tabelas de aluguel e custos (§8) em `packages/shared`
- [x] Hipoteca + ceil (§9)
- [x] Baralhos Fitinha e Bença (§13) — draw / discard / resolve tipado
- [x] Estoque 32 pousadas / 12 resorts (derivado do tabuleiro)
- [x] Resolver casa ao aterrissar (aluguel, imposto, Forte, cartas)
- [x] Máquina de turno hot-seat (roll → busy → action / debt / auction / ended)
- [x] Forte (preso, $50, Proteção, 3 tentativas / 3 duplas)
- [x] Falência / dívida real + leilão ao banco
- [x] Leilão de escritura (recusa de compra) + peça escassa + empate (FR-85–89)
- [x] Negociação (FR-80–81) + FR-65 em bens hipotecados na troca
- [x] Fim de jogo / vencedor (FR-83)
- [x] FR-22a digital: aluguel **pedido** (`rentMode: "claim"`); perde se rolar dados sem cobrar
- [x] Movimento peão casa a casa (path/waypoints)
- [x] Carteira e fluxos (§15) — UI + ações de escritura
- [x] Vitest FRs críticos em `packages/shared` (`pnpm test`)
- [x] Lobby online + hot-seat DEV + Loading (FR-05…06b)
- [x] Multiplayer Supabase + reconnect/presença/auth de intents (FR-05g, FR-05i…m)
- [x] HUD mobile (NFR-23) + banner de sync (NFR-24)
- [x] i18n pt-BR / en / ar — UI, mensagens, cartas (NFR-72)
- [x] Música Carnaval ao aterrissar (parcial NFR-AV-10)
- [x] Áudio UI Lobby + mute

### Ainda pendente / fase 2

- [ ] Toggle UI cobrança automática vs pedida (hoje só `claim`)
- [ ] Playtest formal de balanceamento (§8)
- [ ] Cobertura Vitest ampliada (cartas, Forte, falência ponta a ponta)
- [ ] **Áudio — dados / peão / economia / ações / UI partida** (NFR-AV-*)
- [ ] Carnaval: pool Canário ≥3 + FX leves; licença NFR-82 em build público
- [ ] **Prisão:** animação viatura pelo miolo (FR-44a / NFR-AV-20…23)
- [ ] **Venda de construção:** guincho (FR-64a / NFR-AV-40…42)
- [ ] Slider de volume + mute na partida (NFR-AV-30)
- [ ] Edge Function autoridade / anti-cheat
- [ ] Transferência automática de host (questão §18.9)
- [ ] Pousadas/resorts visíveis no tabuleiro 3D
- [ ] i18n dos nomes das casas do tabuleiro

## 27. Ideias de solução

- ~~Hot-seat local antes de multiplayer~~ — feito no MVP.
- Banqueiro automático na versão digital (implícito); papel nomeado (FR-04) ainda aberto.
- Cartas com efeitos tipados conforme §13 — feitos no shared.
- Playtests com as tabelas §8; ajustar se necessário e refletir em `REQUISITOS.md`.
- Camada `audio/` no `apps/game` (hoje HTMLAudioElement; Howler/Web Audio opcional depois) + `fx/` R3F, desacoplada de `shared`.
- Dados: amarrar SFX em `onRollDice` / contatos cannon / `onRollComplete` (`DiceTray` / `App.tsx`).
- Viatura: path spline pelo centro do tabuleiro (BOARD mid) casa atual → Forte (10).
- Guincho: spawn na lateral da casa → “puxa” mesh da pousada/resort → exit para fora do board (ou depósito); depende de pousadas/resorts visíveis no 3D.

---

## Rastreabilidade

| Área em `REQUISITOS.md` | IDs neste `SPECS.md` | Digital (hot-seat) |
| --- | --- | --- |
| §1 Objetivo / material | §1, FR-83, FR-53 | Feito (fim de jogo + estoque) |
| §2 Preparação / Lobby | FR-01–FR-06b, C-03 | Feito (Loading + Lobby) |
| §3 Vez | FR-10–FR-13 | Feito |
| §4–5 Tabuleiro / tipos | FR-20–FR-25, FR-30–31, FR-40–46, FR-90–91, C-04, FR-43a | Feito; Carnaval música parcial |
| §6 Forte | FR-70–FR-75, FR-44a | Feito + animação viatura pendente |
| §7–8 Construção / tabelas | FR-50–FR-56, FR-25, FR-64a | Feito regras; guincho na venda pendente |
| §9 Hipotecas | FR-60–FR-65 | Feito |
| §10 Leilão | FR-85–FR-89 | Feito |
| §11–12 Negociação / falência | FR-80–FR-84 | Feito |
| §13 Baralhos | FR-40–FR-46 | Feito (confirmar edge FR-46 em playtest) |
| §14 Adaptações | §4, NFR-10, NFR-70…73, NFR-80 | Doc + i18n UI |
| §15 Carteira | FR-24, FR-64, FR-64a, FR-100–FR-107, PUC 12–13, NFR-22, NFR-AV-* | Feito regras; SFX + guincho pendentes |
| §16 Versão digital | FR-05g…m, NFR-23…25, NFR-41…42, NFR-72 | Feito (online polish + mobile + i18n) |
| Áudio / animações digitais | §17b, NFR-AV-*, NFR-82 | v0.6: Lobby + Carnaval parcial; resto pendente |
| Waiting Room / implementação | §18, §21, §26 | Atualizado v0.6 |

---

*Fim da especificação Volere v0.6 — manter sincronizado com `REQUISITOS.md` e o código.*
