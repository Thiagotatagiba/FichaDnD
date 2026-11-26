# Projeto — Ataques por modo da arma

**Status:** especificação funcional para revisão
**Escopo:** botões de ataque nos cartões de armas da aba Combate
**Regra-base:** D&D 5e (2014)

## Objetivo

Substituir o botão genérico **Atacar** por ações explícitas de acordo com os modos válidos da arma. O jogador escolhe como ataca diretamente no cartão; o modal existente continua responsável por rolagem, dano e consumo da ação.

## Botões por tipo de arma

| Dados da arma | Ações exibidas |
| --- | --- |
| Corpo a corpo, sem propriedade `arremesso` | **Atacar: Corpo a Corpo** |
| À distância, sem propriedade `arremesso` | **Atacar: Distância (Inicial/Final)**, preenchido com os dois valores registrados |
| Corpo a corpo com propriedade `arremesso` | **Atacar: Corpo a Corpo** e **Arremessar (Inicial/Final)**, preenchido com os dois valores registrados |
| À distância com propriedade `arremesso` | **Arremessar (Inicial/Final)**, preenchido com os dois valores registrados |

"Inicial/Final" representa os dois valores de distância registrados para a arma. Os botões mostram os valores reais, formatados na unidade métrica já usada pelo catálogo; por exemplo, **Atacar: Distância (24/96 m)** ou **Arremessar (6/18 m)**. A fonte são `alcance.normalM` e `alcance.longoM` (ou os valores equivalentes da instância legada, quando não houver entrada correspondente no catálogo). O nome da arma já está no cartão e não deve ser repetido no texto visual nem no `aria-label` do botão. O alcance serve somente como informação no botão; o modal não pede distância do alvo nem valida a faixa.

## Comportamento de cada ação

### Ataque corpo a corpo

- Usar a fórmula atual de ataque e dano da arma.
- Considerar o alcance corpo a corpo normal da arma e a propriedade `alcance` separadamente.
- Não aplicar as regras de alcance de arremesso.
- Gravar no histórico o modo `corpo-a-corpo`.

### Ataque à distância / arremesso

- Abrir o mesmo modal atual, inicializado com modo `distancia` e os valores inicial/final de alcance da arma.
- Não pedir a distância do alvo, classificar sua faixa ou bloquear a tentativa com base no alcance.
- Não coletar contexto de criatura hostil adjacente nem aplicar desvantagem por alcance nesta entrega. A decisão de tratar desvantagem fica em aberto para uma solicitação futura.
- Gravar o modo selecionado no evento do histórico; não registrar distância de alvo ou faixa calculada.

## Armas com arremesso

- Uma arma corpo a corpo com `arremesso`, como adaga, machado de mão ou azagaia, recebe dois botões: **Atacar: Corpo a Corpo** e **Arremessar (inicial/final)**.
- Uma arma à distância com `arremesso`, como dardo, recebe o botão de arremessar. O texto do catálogo pode continuar chamando a propriedade de arremesso; a UI não deve oferecer um ataque corpo a corpo que os dados não declaram.
- Ao arremessar, mostrar no botão e usar os dois valores de alcance de arremesso do campo `alcance`.
- O dardo do catálogo é modo `distancia`, tem `arremesso` e `acuidade`, com alcance 6/18 m. Deve mostrar **Arremessar (6/18 m)**. A presença da palavra “Arremessar” no rótulo não pode ser usada para inferir atributos ou tipo de ataque: passar `modoAtaque: "arremesso"` como dado explícito ao modal e ao cálculo.
- Pela regra de 2014, usar para ataque e dano o mesmo atributo que a arma usaria no ataque corpo a corpo. Se tiver `acuidade`, permitir escolher FOR ou DES tanto no ataque quanto no dano; não forçar DES apenas por ser ataque à distância. O seletor existente permite a escolha para armas com acuidade? **Não:** hoje `obterConfiguracaoAtributoAtaqueArma()` escolhe automaticamente o maior modificador e define `podeEscolher: false`. A implementação desta entrega precisa tornar a escolha manual possível para armas com acuidade e preservar a seleção para ataque e dano.
- A ficha não coleta adjacência hostil nem trata desvantagem por distância nesta entrega. A forma e o momento de implementar regras de desvantagem não foram decididos; não inferir nem aplicar penalidade por alcance normal/longo ou criatura adjacente.
- A arma só é marcada como arremessada quando a tentativa é concluída, tanto em sucesso quanto em fracasso. Cancelar antes da conclusão não a remove do equipamento.
- Ao concluir uma tentativa de arremesso, retirar aquela instância do slot equipado e dos seletores de equipamento ativo, sem apagar o item/personagem. Exibir a instância na faixa **Armas arremessadas:** abaixo da lista de cartões e acima da linha divisória/ações rápidas.
- Cada arma arremessada aparece como uma tag com ícone e nome. Se não houver nenhuma, ocultar toda a faixa e seu espaço vertical.
- Clicar na tag abre um modal de confirmação, sem fechar por clique no fundo: **“A arma [nome] foi arremessada e está fora do seu equipamento. Deseja recuperá-la?”**. Ações: **Recuperar arma** e **Cancelar**.
- **Cancelar** fecha o modal e mantém a instância na lista de armas arremessadas. **Recuperar arma** devolve a instância ao equipamento disponível/seletor, sem equipá-la automaticamente em um slot de combate, remove a tag e registra a recuperação no histórico.
- A instância mantém identidade própria durante o ciclo equipado → arremessada → recuperada, para não confundir duas armas de mesmo nome nem perder dados personalizados.
- O estado arremessado deve sobreviver a rerenderizações da aba e ao fechamento do modal. Persistência após recarga/exportação depende de integração explícita com o contrato de equipamento; não se deve esconder a arma no DOM como substituto do estado.
- Armas com propriedade `municao` continuam sujeitas à verificação atual de munição. Esta entrega não altera o esquema de munições.

## Interface proposta

- O cartão mantém nome, proficiência, resumo de ataque/dano e propriedades.
- Substituir um botão genérico pelos botões correspondentes aos modos válidos.
- Para armas com dois modos, apresentar dois botões com largura flexível e ordem estável: corpo a corpo primeiro, arremessar depois.
- Em telas estreitas, permitir quebra de linha dos botões sem cortar rótulos nem deslocar o nome da arma.
- Os textos visíveis e acessíveis não repetem o nome da arma, já exibido no cartão. Exemplos: `Atacar: Corpo a Corpo`, `Atacar: Distância (24/96 m)` e `Arremessar (6/18 m)`. O `aria-label` acompanha o modo e os valores, sem nome da arma.
- Inserir a faixa **Armas arremessadas:** logo abaixo dos cartões da lista e antes de **Ações rápidas**. Tags de arma usam ícone decorativo e nome acessível; clique abre o modal de recuperação.
- A área do cartão não deve iniciar um ataque; apenas os botões explícitos fazem isso. Controles internos, como seletor de atributo, preservam seu comportamento.
- O modal anuncia o modo selecionado, o atributo e os modificadores aplicados. Os valores inicial/final ficam nos botões. Cancelar continua sem consumir recursos; a ação é consumida no mesmo ponto transacional atualmente usado para a tentativa.

## Integração técnica prevista

1. Criar uma função pura em `js/domain/regras-combate.js` para classificar os modos de ataque a partir dos dados explícitos da arma.
2. Na renderização dos cartões em `js/modules/combate.js`, derivar os modos permitidos dos dados normalizados da arma e criar um botão por modo.
3. Passar um contexto efêmero `{ modoAtaque, alcance, atributo }` ao abrir o modal; não gravar esse contexto no objeto persistido da arma.
4. Não adicionar controles de distância do alvo nem validação de alcance ao modal. Manter um d20 por tentativa; desvantagem não foi decidida.
5. Ao confirmar o resultado de uma tentativa de arremesso (acerto ou erro), atualizar de forma coerente os dados de equipamento e o registro de instâncias arremessadas; impedir aplicação duplicada em duplo clique/reenvio.
6. Renderizar a faixa de armas arremessadas a partir do estado, ocultando-a quando vazia; adicionar modal com foco inicial, retorno de foco, Escape/cancelamento coerentes e sem fechamento por backdrop.
7. Estender o evento de histórico com campos opcionais para modo, resultado e recuperação. Eventos históricos antigos permanecem legíveis.
8. Atualizar CSS da lista de armas, faixa e tags para responsividade e foco visível.
9. Adicionar regressões unitárias e integradas para modos, escolha FOR/DES em armas com acuidade, rótulos de alcance, ausência de campos/validação de distância, um único d20, sucesso/fracasso, cancelamento pré-conclusão, desequipar uma única vez, recuperar/cancelar recuperação, persistência do estado e histórico.

## Fora do escopo

- Mudar ou migrar esquemas de armas, munições ou poções.
- Remover permanentemente armas arremessadas ou automatizar recuperação sem decisão do jogador.
- Implementar seleção de criaturas, tabuleiro tático ou captura/validação da distância do alvo. Esses comportamentos dependem de decisão futura.
- Alterar magias, ataques desarmados, recursos de classe ou a lógica de expiração.

## Critérios de aceite

1. Maça mostra apenas **Atacar: Corpo a Corpo**.
2. Arco mostra **Atacar: Distância (24/96 m)** (conforme os valores de alcance do registro) e abre o modal em modo à distância.
3. Adaga, lança e machado de mão mostram **Atacar: Corpo a Corpo** e **Arremessar (alcance inicial/final)**.
4. Dardo mostra **Arremessar (6/18 m)** (conforme os valores de alcance do registro).
5. Dardo usa o modo explícito de arremesso, exibe 6/18 m, permite escolher FOR ou DES e faz uma rolagem de um d20.
6. O modal não solicita distância do alvo nem bloqueia ataques por distância. Os valores de alcance aparecem apenas nos botões.
7. Os textos e `aria-label`s indicam modo e alcances, sem repetir o nome da arma.
8. Concluir arremesso com acerto ou erro desequipa a instância uma única vez e a mostra na faixa; cancelar a tentativa não a desequipa.
9. Cancelar o modal de recuperação mantém a tag. Recuperar devolve a arma ao seletor disponível e registra o evento no histórico.
10. A faixa some quando vazia; várias armas arremessadas são apresentadas sem confundir instâncias homônimas.
11. Cancelar o modal de ataque não consome ação nem munição; confirmar consome uma única vez. Armas com munição continuam exigindo a munição já configurada.
12. Layout, foco e navegação por teclado continuam funcionais em larguras estreitas.

## Observação de execução

Esta especificação não altera a aplicação. O estado atual do repositório contém as seguintes alterações locais relevantes, observadas em `git diff` durante esta revisão:

- `js/modules/combate.js`: mudanças amplas (cerca de 1.306 linhas adicionadas/alteradas); introduz estado contextual de rolagem d20, recursos e gastos por turno, validações de arma secundária/mão, e histórico estruturado com resultado, rolagem e consumo. Os pontos de conclusão atuais passam por `registrarHistoricoAtaqueArma()` nos fluxos de fracasso e dano. Não há ainda estado/lista de arma arremessada.
- `js/domain/regras-combate.js`: alterações locais incluem consumo de ação/ataques por turno e elegibilidade de duas armas/mão secundária. A resolução de desvantagem não foi integrada a esta entrega e permanece fora da decisão atual.
- `js/modules/combate-armas.js` (lógica existente consultada): normaliza dados da arma e seleciona o atributo; `acuidade` hoje escolhe automaticamente o maior entre FOR/DES e desativa o seletor. A nova entrega precisa alterar essa decisão para permitir escolha explícita.
- `css/combate-2.0.css`: mudanças locais de layout do combate, indicadores de proficiência e recursos/mãos; a faixa de armas arremessadas ainda não aparece no diff observado.
- `assets/data/itens/armas.json`: a alteração local observada troca o ícone da adaga. O registro do dardo já contém `modo: "distancia"`, propriedades `acuidade` e `arremesso`, e alcance 6/18 m; não há mudança local observada nesse registro.

Essa revisão mapeia o estado atual, mas não autoriza sobrescrever as alterações existentes. A implementação nos módulos compartilhados deve ser integrada aos diffs preservando especialmente a resolução contextual d20, consumo único de ação/munição, histórico estruturado, validação de mão secundária e alterações de proficiência. O projeto não altera contratos de munições/poções nem avança automaticamente um gate humano pendente.

## Referência normativa

- [D&D 5e Basic Rules 2014 — Combat](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/combat): ataques à distância, alcance normal/longo e desvantagem quando há criatura hostil visível e não incapacitada a até 5 pés (1,5 m).
- [D&D 5e Basic Rules 2014 — Equipment](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/equipment): propriedades de armas, incluindo finesse e thrown.

## Implementação local — 2026-11-26

**Estado:** implementação funcional aplicada localmente; revisão humana de G3 permanece pendente. Nenhum gate foi declarado aprovado nesta entrega.

Os cartões agora exibem botões por modo, sem repetir o nome da arma: `Atacar: Corpo a Corpo`, `Atacar: Distância (inicial/final m)` ou `Arremessar (inicial/final m)`. Armas corpo a corpo com arremesso têm as duas ações; armas à distância com arremesso, como o dardo, mostram somente Arremessar. O modal não solicita distância do alvo nem verifica alcance. Armas com Acuidade mantêm FOR/DES à escolha, com o maior modificador como padrão.

Ao confirmar o resultado de um arremesso, com acerto ou erro, a instância da arma fica marcada no estado de combate, sai dos seletores de equipamento e aparece numa linha de tags logo abaixo dos cartões. A tag abre um diálogo nativo com Recuperar arma/Cancelar; cancelar ou fechar mantém o estado arremessado, enquanto recuperar remove a marca e registra um evento no histórico. O identificador de instância é carregado junto com os dados da arma para distinguir itens de mesmo nome. O formato de munições e poções não foi alterado.

**Decisões registradas pelo responsável (2026-11-26):** não implementar nem decidir nesta entrega o tratamento de desvantagem. O modal de ataque não pede distância do alvo, não calcula faixa, não bloqueia ataque por distância e rola um único d20. O alcance inicial/final permanece apenas como informação nos rótulos dos botões. Qualquer tratamento futuro de desvantagem ou validação tática aguarda decisão explícita.

**Verificações:** `node --check` nos seis módulos JavaScript tocados passou. Após esta correção, os testes focados de modos/alcance sem penalidade e rolagem de um d20 passaram 4/4; o teste de escolha FOR/DES já havia passado. A suíte completa (423 testes) não foi repetida após esta correção; a execução anterior terminou em 419/423. Não houve teste ponta a ponta de UI com uma arma real, pois a ficha aberta no navegador estava vazia; não foi importado nem salvo JSON de personagem.
