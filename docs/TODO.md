# TODO — Ficha D&D

As ideias aprovadas aparecem primeiro. A aprovação registra uma decisão de produto. A implementação entra no [Roadmap](../ROADMAP.md) quando for priorizada. As ideias para avaliar ainda precisam de revisão de código e documentação. Registre bugs confirmados no [BUG_REPORT.md](BUG_REPORT.md).

## Ideias aprovadas

### Regra transversal — novos modais

- [x] A camada compartilhada `.modal-overlay-base` fica acima das abas, dos orbes e dos demais elementos da ficha; regressão em `tests/usabilidade-descanso-iniciativa.test.cjs`.
- [x] Padronizar os botões de fechamento no cabeçalho dos modais com o botão compacto vermelho em relevo inspirado no Windows XP, ícone X centralizado, hover/pressionado e foco de teclado visível. Usar `.modal-fechar-xp` e o ícone `.modal-fechar-xp-icone`; `.magia-selecao-fechar` mantém compatibilidade visual com a mesma regra. Botões de ação como Cancelar, Concluir ou Fechar no rodapé continuam textuais. Decisão do responsável (26/11/2026); verificação Chromium confirmou o X centralizado no Descanso Curto.
- [ ] **Sempre que um novo modal for criado**, validar sua sobreposição sobre toda a interface fixa ou com `z-index`, em desktop e mobile. Conferir também a ordem do backdrop e do conteúdo do modal; não considerar suficiente verificar apenas que o diálogo abre.
- Registro recorrente: a sobreposição incorreta reapareceu na captura do modal **Adicionar idiomas** em 25/11/2026, com abas e orbes visíveis por cima. Corrigido centralmente na camada padrão; repetir a validação em cada novo modal.

A ordem abaixo é a prioridade recomendada para levar as ideias ao Roadmap. Acompanhe a execução e as aprovações de etapa nos documentos do plano em vigor.

### Prioridade 1 — Fluxo de combate

### 1. Combate — Ações restantes no turno (D&D 5e de 2014)

> **Andamento parcial (2026-11-24, checkpoint de retomada):** a faixa Turno mostra `Ação`, `Ação bônus` e `Reação` no formato restante/limite, com ícone de lápis discreto para editar; o CSS permite quebra em telas estreitas. O editor usa saldos separados, padrão 1, ajustes temporários e preserva usos gastos. Ataques e ações rápidas passam pelo estado do turno; conjurações de ação/ação bônus/reação também verificam e consomem o recurso em combate. Ataques só gastam recurso e munição em Fracasso ou Registrar dano; cancelar antes descarta a tentativa. O modal de ataque exige gatilho para reação, bloqueia ação bônus de arma sem qualificação de duas armas e anuncia ataques restantes de Ataque Extra. Testes automatizados cobrem esses fluxos, incluindo gatilho e consumo de magia de reação sem ataque, persistência/round-trip e restauração do próximo turno. Chromium desktop confirmou visualmente a linha, o lápis e a abertura/cancelamento do editor em combate sintético; ainda faltam validação integrada dos fluxos de consumo e a iniciativa completa de um grupo. A interface de movimento continua adiada.

- [x] Na faixa **Turno**, acima das subabas **Ataques**, **Magias** e **Outras ações**, mostrar **Ação 1/1**, **Ação bônus 1/1** e **Reação 1/1**, no formato restante/limite. Colocar o ícone de lápis discreto de edição ao lado. `tests/usabilidade-descanso-iniciativa.test.cjs` cobre DOM, inserção no painel e CSS flexível. No Chromium desktop (página sintética `modo=branco`), combate iniciado mostrou os três saldos `1/1`; o lápis foi exibido e seu clique abriu o editor com limites 1 e ajustes 0. O editor foi cancelado sem alterações.
- [x] No modal de configuração, oferecer **Ações**, **Ações bônus**, **Reações** e **Ataques por ação Atacar**, todos com padrão 1. Distinguir limites configurados de ajustes **Só neste turno** e aplicar o ajuste sem devolver usos gastos. Evidências em `tests/regras-combate.test.cjs` e round-trip em `tests/importacao-preparacao.test.cjs`.
- [ ] Reutilizar a sequência de ações da E2.1 como fonte dos contadores e da elegibilidade. Ataques, conjurações de magia com custo de ação e ações rápidas já integram esse estado. Para ataques, o gasto definitivo ocorre em **Fracasso** ou **Registrar dano**; cancelar antes descarta sem gastar ação ou munição. Round-trip automatizado coberto. No Chromium desktop, em ficha sintética `modo=branco`, clique em **Esquivar** durante combate consumiu uma única Ação (1/1 → 0/1) e registrou `Ação Esquivar — registrada; sem resolução automática`; um segundo clique não criou outro registro nem alterou o saldo. Depois de encerrar o combate, novo clique registrou Esquivar sem controles/saldo de turno ativos, confirmando que o consumidor não desconta recursos fora de combate. Falta validação integrada dos fluxos de ataque e magia, além de auditar toda conjuração de truque/reação e cada ação da ficha antes de concluir este critério.
- [ ] A indicação de ação bônus é saldo; o seletor de ataque bloqueia ação bônus de arma sem elegibilidade de duas armas e saldos gastos. O modal de ataque exige e registra o gatilho da reação; magias de reação sem ataque também exigem e registram gatilho antes de consumir slot/reação, cobertas por `tests/magias-efeitos.test.cjs`. **Pendente:** outros fluxos de reação, validação durante o turno de outra criatura no modelo de grupo e conferência em navegador. **Próximo turno** restaura os saldos padrão e encerra ajustes temporários, com regressão automatizada.
- [x] Dentro da ação **Atacar**, o primeiro ataque consome uma ação e abre a sequência de ataques adicionais; cada ataque adicional elegível reduz o contador interno. A interface apresenta **Ataques restantes nesta ação** e o estado reinicia no próximo turno. Evidências em `tests/regras-combate.test.cjs`; restrições de duas armas cobertas por `tests/regras-combate.test.cjs`.

- [x] Usar o mesmo estado do combate para a exibição e o consumo da reação. Testes de importação/exportação/reimportação mantêm a reação gasta em **0/1**; a regressão de **Próximo turno** confirma restauração para **1/1** e encerramento de ajustes temporários, em `tests/importacao-preparacao.test.cjs` e `tests/regras-combate.test.cjs`. **Limite:** os testes são automatizados; ainda falta confirmar no Chromium o gesto real de reação durante o turno de outra criatura e após recarga.

##### Custos, combate ativo e atividades sem gasto

- [x] Aplicar o limite de uma ação bônus por turno pelas regras de 2014. Com **Ação bônus 0/1**, outra ação bônus é recusada sem consumir ação principal; os contadores permanecem separados. O modal de ataque também desabilita a ação bônus de arma sem qualificação de duas armas. Evidências em `tests/regras-combate.test.cjs` e `tests/magias-efeitos.test.cjs`.
- [ ] Se uma mesma atividade puder usar ação ou ação bônus por característica/regra própria, oferecer explicitamente ambos os custos e explicar a origem. O modelo atual não fornece metadados de custo alternativo suficientes; não inferir nem oferecer opção arbitrária.
- [ ] Fora de combate ativo, permitir ações e conjurações sem descontar contadores; as conjurações preservam seus pré-requisitos próprios de espaço de magia. `tests/regras-combate.test.cjs` comprova que o consumidor genérico não altera saldos fora de combate (e os atalhos passam por ele); `tests/magias-efeitos.test.cjs` comprova que a magia fora de combate ainda consome seu espaço sem descontar turno. Falta varrer ações/rolagens restantes e testar gatilhos e custos de munição/usos em todos os fluxos.
- [ ] Separar atividades sem gasto de ação do movimento. Comunicações breves e a primeira interação simples com um objeto durante o movimento ou a ação normalmente não gastam os contadores. Uma segunda interação ou uma interação que exija esforço pode custar uma ação. O deslocamento normal usa seu próprio limite. [Regras de combate de 2014](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/combat)
- [x] **Movimento — interface adiada:** não exibir controles de gasto/restante de movimento junto aos recursos do turno. A interface está fora da linha de recursos; o estado/domínio mantém movimento separado. Retomar a interface em tarefa separada. Evidência estrutural em `tests/usabilidade-descanso-iniciativa.test.cjs`.

##### Cenários para implementação e testes

| Caso | Comportamento esperado |
| --- | --- |
| Waldo com Maça | Ao confirmar o ataque, **Ações 0/1**. Se usar *Palavra de Cura* no mesmo turno, **Ação bônus 0/1**. Se fizer um ataque de oportunidade no turno inimigo, **Reação 0/1** até começar o próximo turno do Waldo. |
| Duas adagas, sem Ataque Extra | Com uma adaga em cada mão, confirmar o ataque de uma delas pela ação **Atacar** gasta a ação e habilita o ataque com a outra adaga como **ação bônus**, mesmo se o primeiro ataque errar. Confirmar o ataque da outra mão gasta a ação bônus. Se ela já tiver sido gasta, manter essa opção indisponível. |
| Duas adagas, com Ataque Extra | Com **2 ataques por ação Atacar**, o primeiro ataque deixa **Ações 0/1** e **1 ataque restante nesta ação**. O segundo usa esse saldo interno. O ataque com a outra adaga usa a ação bônus, se disponível, e não reduz o contador da ação Atacar. |
| Dano da segunda adaga | Com Destreza +3, o primeiro ataque tem dano **1d4 + 3** e o ataque da outra mão como ação bônus tem dano **1d4**. O modificador continua na jogada de ataque. Somá-lo ao dano do ataque bônus se for negativo ou se o personagem tiver o estilo **Combate com Duas Armas**. |
| Esquivar | Gasta uma ação e não abre uma sequência de ataques nem habilita o ataque bônus com a outra adaga. |
| Ladino com Ação Ardilosa | **Disparada** pode ser usada como ação normal. **Ação Ardilosa** permite usá-la também como ação bônus. Com **Ações 1/1** e **Ação bônus 0/1**, manter **Disparada · Ação** disponível e bloquear **Disparada · Ação bônus**. Se gastar a ação normal primeiro, ainda pode usar a versão bônus caso tenha saldo. |
| Bardo com Inspiração de Bardo e Palavra de Cura | Ao gastar a ação bônus com uma dessas opções, a outra fica indisponível no mesmo turno, mesmo com a ação principal disponível. |
| Surto de Ação | Concede uma ação adicional só no turno atual. O próximo turno volta ao limite configurado. |

Fontes de 2014: [Combate](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/combat) · [Classes e características](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes).

#### 2. Combate — Redesenhar os modais de ataque e dano com prévia da arma

**Objetivo:** alinhar os controles das duas rolagens e manter a prévia da arma disponível da jogada de ataque ao registro do dano.

##### Referência aprovada e integração com a ficha

**Protótipo:** [prototipo-ataque-dano.html](./prototipo-ataque-dano.html), previsto na pasta `docs/` do repositório.

- [ ] Abrir o protótipo e comparar com os modais atuais antes de editar a interface. Usar o HTML como referência visual e de interação. Adaptar espaçamentos, alinhamento, hierarquia e responsividade aos componentes da ficha.
- [ ] Reaproveitar os componentes, estilos e regras do combate atual. Usar as armas, os ícones e os dados reais do catálogo e consultar o inventário para o saldo e o consumo de munição. Maça, Besta Leve e seus valores no protótipo servem como cenários de demonstração.
- [ ] Reaproveitar o botão de dado com a fórmula abaixo. Ao rolar, manter a animação de cerca de 2 segundos com valores alternando no campo e registrar o resultado final no histórico. Manter o campo manual compacto, com largura adequada aos valores que a ficha aceita, inclusive fórmulas com vários dados na etapa de dano.
- [ ] Exibir o histórico da etapa com **↑** no maior valor e **↓** no menor. Ao selecionar um resultado, preencher o campo do dado e recalcular o total.
- [ ] Preservar o brilho dourado de **Sucesso** no 20 natural e o brilho vermelho de **Fracasso** no 1 natural, reaproveitando as cores e os estilos atuais. Conferir o destaque após rolagem, entrada manual e seleção pelo histórico.
- [ ] Validar o fluxo real com Maça e Besta Leve no desktop e no celular. Confirmar que **Sucesso** de um ataque com arma avança ao dano e que **Fracasso** e **Cancelar ataque** encerram a etapa sem abri-lo. Conferir o consumo de munição e os demais fluxos que compartilham o modal, inclusive magias.

##### Painel principal — Ataque

- [ ] Reorganizar o cabeçalho com o nome do ataque e a rodada, seguindo o estilo visual da ficha.
- [ ] Agrupar na mesma linha o botão de rolar **1d20**, a entrada manual do dado, o bônus de ataque e o total. Em telas estreitas, quebrar a linha em blocos legíveis. Identificar as parcelas do bônus, como atributo e proficiência.
- [ ] Agrupar os controles **Ação**, **Ação bônus** e **Reação**. Manter **Sucesso**, **Fracasso** e **Cancelar ataque** com alinhamento consistente e rótulos legíveis. Exibir o histórico quando houver informação a mostrar.
- [ ] Preservar o funcionamento atual de rolagem automática, entrada manual, tipo de ação, registro do ataque e cancelamento.

##### Painel principal — Dano

- [ ] Ao confirmar **Sucesso**, passar para a etapa de dano com o mesmo layout do ataque. Manter a rodada, o nome da arma e o total do ataque já resolvido no resumo.
- [ ] Organizar o botão de rolagem, a entrada manual, o modificador e o total em um bloco alinhado. Usar a quantidade e o tipo de dados da fórmula de dano do ataque selecionado.
- [ ] Alinhar **Registrar dano** e **Cancelar ataque** com o rodapé da etapa de ataque. Preservar as regras atuais de cálculo, registro, histórico e cancelamento.

- [ ] Se o jogador clicar em **Cancelar ataque** antes de **Registrar dano**, inclusive após escolher **Sucesso**, descartar o ataque inteiro. Preservar ou restaurar a ação, ação bônus, reação, saldo de ataques e munição que tenham sido reservados. O ataque cancelado fica fora do histórico e da munição gasta no combate. Aplicar o gasto definitivo e registrar uma única vez em **Fracasso** ou **Registrar dano**. Testar cancelamento nas duas etapas com a Besta Leve.

##### Painel de prévia — Arma e dano

- [ ] Abrir a prévia junto com o modal de ataque e mantê-la visível na etapa de dano, com a mesma arma e variante. No desktop, encaixar como uma aba à direita. No celular, empilhar abaixo do painel principal e permitir rolagem vertical para alcançar todo o conteúdo.
- [ ] Tratar os dois painéis como uma única janela modal, com um único fluxo de foco e fechamento. Atualizar a prévia a partir da arma e da variante escolhidas para o ataque.
- [ ] Exibir nome, categoria e propriedades relevantes da arma, como alcance e modo de uso, quando cadastrados.
- [ ] Dar destaque ao dano potencial, mostrando a fórmula e o tipo de cada componente. Identificar separadamente danos adicionais ou condicionais quando a ficha tiver esses dados. A prévia reutiliza o cálculo existente e exibe o que pode ser causado antes da resolução do ataque.
- [ ] Conferir no desktop e no celular a abertura, a leitura da prévia, o fechamento e os fluxos de sucesso, fracasso e cancelamento. Após o sucesso, conferir a transição para dano, a rolagem, a entrada manual, o registro e o cancelamento. Testar uma arma com um único tipo de dano e outra com componentes adicionais, se suportada.

##### Celular — Cabeçalho, recuos e abas da ficha

- [ ] Reorganizar o cabeçalho da ficha em telas estreitas. Agrupar título, informações e controles relacionados, permitir que quebrem em linhas quando necessário e manter as ações acessíveis.
- [ ] Revisar margens, recuos e espaçamentos do cabeçalho, das abas e dos painéis de conteúdo. Alinhar os blocos nas mesmas guias e aproveitar a largura disponível sem cortar textos ou provocar rolagem horizontal na página.
- [ ] Redesenhar a navegação por abas para toque, com rótulos legíveis, alvos confortáveis e destaque claro para a aba ativa. Comparar uma faixa rolável de abas com uma navegação mais compacta usando os nomes e a quantidade reais de abas. Quando houver rolagem na faixa, manter a aba ativa visível.
- [ ] Conferir a troca entre as abas principais e as subabas de **Combate** no celular, incluindo acesso à primeira e à última opção, foco por teclado e orientação retrato e paisagem. Conferir também o layout no desktop.

#### 3. Projeto — Outras ações e atalhos de combate (D&D 5e de 2014)

- [ ] Implementar os seis cartões de **Outras ações**. Exibir o custo no próprio cartão (por padrão, **1 ação**) e abrir um modal com efeito, duração, requisitos e custo efetivo. Se uma característica ou regra da mesa permitir outro custo, identificar a origem e mostrar o tipo que será consumido.
- [ ] Gastar o recurso e registrar a ação com rodada e detalhes somente ao confirmar. Reutilizar a sequência da E2.1 e os contadores de **Ações restantes no turno**. Se faltar saldo, manter a descrição acessível e explicar por que a confirmação está indisponível. Cancelar preserva saldo e histórico. Evitar lançamentos duplicados.
- [ ] Usar o histórico para informar os efeitos e a duração. Aplicar efeitos automaticamente apenas onde a ficha já puder representá-los com segurança.

| Cartão | O que explicar e registrar no modal |
| --- | --- |
| Esquivar | Até o início do próximo turno, ataques contra você têm desvantagem se você vê o atacante, e suas salvaguardas de Destreza têm vantagem. O benefício acaba se ficar incapacitado ou o deslocamento cair a zero. |
| Desengajar | O movimento do personagem deixa de provocar ataques de oportunidade pelo resto do turno. |
| Disparada | Concede movimento adicional no turno igual ao deslocamento com os modificadores aplicados. Mostrar o valor quando disponível. |
| Ajudar | Escolher entre ajudar em uma tarefa ou ajudar num ataque. Na tarefa, o próximo teste pertinente do aliado tem vantagem se ocorrer antes do início do seu próximo turno. No ataque, o alvo deve estar a até 1,5 m de você ao ajudar, e o primeiro ataque do aliado contra ele tem vantagem se ocorrer antes do seu próximo turno. Registrar aliado e tarefa ou alvo quando informados. |
| Esconder | A mesa decide se é possível se esconder. Usar Destreza (Furtividade) e reaproveitar o modal de Teste de Perícia. Vincular o resultado à ação e consumir apenas uma vez. A mesa determina se a tentativa teve sucesso. |
| Preparar | Informar o gatilho perceptível e a ação ou movimento pretendido. Gastar uma ação ao preparar. Se o gatilho ocorrer antes do próximo turno, o jogador pode executar a resposta logo após o gatilho usando a reação, ou ignorá-lo. Registrar preparação e execução separadamente. Para magia, explicar que deve ter tempo de conjuração de uma ação, é conjurada ao preparar e exige concentração enquanto estiver retida. |

##### Registro manual — Ação, Ação bônus e Reação

- [ ] Na última fileira de **Outras ações**, manter três botões alinhados e na mesma ordem: **Ação**, **Ação bônus** e **Reação**. Usar colunas de mesma largura e conferir a leitura em telas estreitas.
- [ ] Abrir um modal com o título do tipo selecionado, o saldo correspondente durante o combate e um campo obrigatório de descrição. Oferecer **Registrar** e **Cancelar**. Para **Reação**, orientar o jogador a descrever também o gatilho quando pertinente.
- [ ] Ao confirmar, registrar o tipo e a descrição no histórico e, em combate ativo, descontar uma unidade exclusivamente do contador escolhido. Reutilizar a sequência da E2.1. O registro manual representa uma atividade resolvida na mesa e não executa efeitos automaticamente.
- [ ] Se o saldo estiver esgotado em combate, informar isso no modal e impedir a confirmação. Fora de combate, permitir o registro sem gastar os contadores. Cancelar, fechar ou enviar descrição vazia preserva o saldo e o histórico. Evitar registros duplicados por duplo clique.

##### Ações rápidas

- [ ] Trocar somente **Esquivar** de **Ações rápidas** por **Ataque de Oportunidade · Reação**. Deixar o fluxo do modal de oportunidade para uma tarefa posterior. Enquanto estiver pendente, o atalho não deve gastar reação nem registrar ataque.
- [ ] Trocar somente **Desengajar** de **Ações rápidas** por **Teste de Perícia**. Manter **Esquivar** e **Desengajar** em **Outras ações** e manter o atalho **Teste de resistência**.

##### Modal — Teste de resistência

- [ ] Exibir **Sem custo de ação** no modal. Uma salvaguarda é uma resposta a um efeito ou perigo. Rolar e registrar o teste sem gastar Ação, Ação bônus ou Reação, inclusive com os três saldos esgotados.
- [ ] Conferir os casos de teste avulso dentro e fora de combate. Quando uma ação exige um teste, cobrar somente a ação de origem, como em **Esconder**. [Salvaguardas nas regras de 2014](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/using-ability-scores)

##### Modal — Teste de Perícia

- [ ] Abrir um modal compacto com seletor pesquisável das perícias da ficha, atributo padrão, modificador já calculado e opção de trocar o atributo quando a mesa pedir. Reutilizar o cálculo da ficha, incluindo proficiência, meia proficiência e especialização quando aplicáveis.
- [ ] Oferecer rolagem normal com entrada manual ou automática, mostrando dado, modificador e total. Oferecer CD opcional e comparar o total à CD quando informada. Tratar 1 e 20 como valores do dado em testes de perícia.
- [ ] Oferecer **Registrar teste** e **Cancelar**. Registrar perícia, atributo, modo de rolagem, dados, bônus, total e CD quando informada. No atalho avulso, o teste não tem custo automático. Quando chamado de **Esconder**, manter o custo e o vínculo da ação de origem.
- [ ] Testar no desktop e no celular. Conferir cancelamento, saldo insuficiente, tipo alternativo de ação, Esconder com teste vinculado, Preparar seguido de reação e teste avulso sem consumo.

Fontes de 2014: [Combate](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/combat) · [Testes de atributo e perícias](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/using-ability-scores).

#### 4. Combate — Visual e mecânica dos PV temporários

**Objetivo:** mostrar os PV temporários como camadas sobre os cinco corações de vida e aplicar o dano ao escudo antes dos PV atuais.

- [ ] Retirar o sexto coração. Manter cinco corações, cada um representando um quinto dos PV máximos, com preenchimento proporcional para frações.
- [ ] Mostrar os PV atuais em vermelho. Sobrepor as camadas de PV temporários da esquerda para a direita, cobrindo tanto áreas vermelhas quanto vazias.
- [ ] Usar azul para a primeira faixa de PV temporários, amarelo-ouro para a segunda e branco brilhante para a terceira. Cada faixa comporta o equivalente aos PV máximos e começa no primeiro coração. Exibir sempre a faixa superior onde houver sobreposição.
- [ ] Exibir **+** sobre o último coração apenas quando os PV temporários ultrapassarem a capacidade das três faixas. Mostrar o valor exato dos PV temporários em um contador identificado, independentemente da cor ou do limite visual.
- [ ] Ao conceder PV temporários, manter os PV atuais. Ao aplicar dano, reduzir primeiro os PV temporários e descontar o excedente dos PV atuais na mesma ação. Conforme o valor cai, recalcular a cobertura e revelar as camadas abaixo.
- [ ] Conferir o caso de 10 PV máximos, 2 atuais e 3 temporários. O visual começa com um coração e meio azul e o restante vazio. Após 2 de dano, o primeiro coração fica metade azul e metade vermelho. Após mais 1 de dano, fica um coração vermelho.
- [ ] Conferir os limites com 10 PV máximos. Com 10 temporários, mostrar cinco corações azuis. Com 12, mostrar o primeiro dourado e os demais azuis. Com 22, mostrar o primeiro branco e os demais dourados. Com 30, mostrar cinco brancos. Acima de 30, acrescentar **+** no último. Ao voltar para 30, retirar o **+**.
- [ ] Verificar ganho de PV temporários com vida cheia e parcial, dano que atravessa o escudo, arredondamento visual com PV máximos não divisíveis por cinco, salvamento e importação/exportação.

##### Botão TEMP e modal de PV temporários

- [ ] Transformar toda a área **TEMP** do quadro de Pontos de Vida em um botão, mantendo o valor atual visível. Usar **Gerenciar PV temporários** como nome acessível do botão.
- [ ] Ao acionar **TEMP**, abrir o modal **PV temporários** com o saldo atual, o campo numérico **PV temporários recebidos** e os botões **Confirmar** e **Cancelar**. Aceitar somente valores inteiros positivos no campo.
- [ ] Ao confirmar, substituir o saldo atual somente se o valor digitado for maior. Se for menor ou igual, manter o saldo e informar o valor mantido. Exemplo com 4 PV temporários atuais: confirmar 3 mantém 4, confirmar 4 mantém 4 e confirmar 6 troca o saldo para 6.
- [ ] Incluir a ação **Remover PV temporários** para quando o efeito acabar. A ação zera o saldo temporário e preserva os PV atuais. Desabilitar a ação quando o saldo já estiver zerado.
- [ ] Atualizar o contador TEMP e as camadas dos corações ao confirmar uma mudança ou remover o saldo. Fechar ou cancelar o modal preserva o saldo. Testar entrada inválida, cancelamento, substituição, remoção e persistência.

#### 5. Combate — Botão de descanso curto

**Objetivo:** permitir que o jogador aplique um descanso curto e confira o que recuperou. O botão registra a recuperação quando a mesa autoriza o descanso.

##### 5.1. Fluxo proposto

- [ ] Disponibilizar **Descanso curto** na aba **Combate**, junto aos controles de PV e recursos. Conferir o posicionamento na versão mobile.
- [ ] Ao clicar, abrir um modal com os dados de vida disponíveis, PV atuais e máximos, e recursos elegíveis para recuperação.
- [x] Permitir descansar sem gastar Dados de Vida. Decisão do responsável (25/11/2026): quando quiser usar dados, o jogador rola ou informa um resultado por vez e clica **Usar dado** para adicioná-lo à prévia; a ficha só consome os dados ao confirmar o descanso. A ficha atual usa um tipo de Dado de Vida por vez; não há escolha de tipos múltiplos neste modelo.
- [x] Se houver rolagem, entrada manual ou dado adicionado à prévia, pedir confirmação antes de cancelar e explicar que a saída descarta os resultados, mas não gasta Dados de Vida. Recusar o descarte mantém o descanso aberto. Não exibir aviso redundante de confirmação no rodapé. Usar ícones SVG acessíveis para informação e fechamento. Validado em Chromium e regressões em 26/11/2026.
- [x] Aceitar rolagem no app e resultado manual individual. Reutilizar o padrão visual de rolagem, incluindo animação e histórico clicável dos resultados. Mostrar a conta por dado com Constituição (por exemplo, `8 (5+3)`), a cura acumulada e o custo antes da confirmação. Testes de regressão no modal e validação visual Chromium do alinhamento com o modal de ataque concluídos em 25/11/2026; refinamento da hierarquia do resumo validado em 26/11/2026.
- [ ] Aplicar o descanso na confirmação. Permitir cancelar antes dela e mostrar, ao concluir, os PV recuperados, os dados gastos e os recursos restaurados.

##### 5.2. Regras e persistência

- [ ] Conferir a edição de D&D suportada e o modelo atual de PV, dados de vida e recursos antes de definir a recuperação. Usar as regras vigentes da mesa quando houver opções configuráveis.
- [ ] Limitar a cura aos PV máximos e o gasto aos dados disponíveis. Reconhecer fichas com PV cheios, sem dados disponíveis e com tipos diferentes de dado, quando suportados.
- [ ] Restaurar somente os recursos cuja regra prevê recuperação em descanso curto. Se a recuperação depender de escolha, quantidade ou uso limitado, pedir os dados necessários antes de aplicar. Deixar recursos exclusivos de descanso longo e espaços de magia comuns fora da recuperação automática.
- [ ] Conferir casos como Canalizar Divindade, espaços de Pacto Mágico e Recuperação Arcana conforme a edição adotada e o que a ficha consegue representar. Para efeitos ainda sem suporte estruturado, manter o ajuste manual.
- [ ] Salvar PV, dados gastos e recursos como uma única operação, reaproveitando os mecanismos existentes de salvamento e rollback. Impedir a aplicação dupla por cliques repetidos.
- [ ] Testar cancelamento, descanso sem gasto de dados, limite de cura, recuperação parcial ou total de recursos, clique duplo, recarga da página e importação de fichas antigas.
- [ ] Se a persistência mudar a estrutura do JSON, validar importação e exportação e atualizar o `Contexto_Personagem.md` na mesma alteração, quando ele existir.

##### 5.3. Revisar o modal de Descanso Longo (D&D 5e de 2014)

- [ ] Antes de confirmar, mostrar uma prévia com cada benefício aplicável marcado por padrão. Permitir desmarcar individualmente para respeitar efeitos específicos ou decisões da mesa. Aplicar apenas as opções marcadas.
- [ ] **Recuperar PV:** restaurar os PV perdidos até o máximo vigente.
- [ ] **Recuperar dados de vida:** devolver dados gastos até metade do total, arredondada para baixo, com mínimo de um se houver dado gasto. Exemplo: 5 dados totais e 4 gastos permitem recuperar 2. Se houver tipos diferentes, permitir escolher quais recuperar conforme o modelo da ficha.
- [ ] **Zerar PV temporários:** marcar por padrão quando a fonte não tiver duração própria. Se a ficha reconhecer uma duração que ainda esteja valendo, deixar desmarcado e explicar a origem. Permitir preservar manualmente o saldo quando essa informação só estiver na mesa.
- [ ] **Recuperar espaços de magia:** restaurar espaços gastos, incluindo Pacto Mágico quando aplicável. Manter a lista de magias preparadas. Tratar eventual troca de preparação como escolha separada.
- [ ] **Recuperar usos de habilidades:** listar por recurso e aplicar a recarga indicada pela própria característica. Cobrir recursos que voltam em descanso curto ou longo quando a característica permitir ambos.
- [ ] **Reduzir exaustão em 1 nível:** aplicar quando houver exaustão e o personagem tiver ingerido comida e bebida. Deixar a confirmação dessa condição com o jogador quando a ficha não a acompanhar.
- [ ] **Condições e efeitos:** manter condições como Envenenado que continuem válidas. Oferecer remoção apenas dos efeitos cuja duração ou regra indique que acabaram, ou quando o jogador confirmar esse fim. O descanso longo por si só não cura envenenamento.
- [ ] Informar que, pelas regras padrão de 2014, o benefício exige pelo menos 1 PV no início do descanso e só pode ser recebido uma vez em 24 horas. Usar a confirmação da mesa quando a ficha não acompanhar o tempo ou o início do repouso.
- [ ] Na confirmação, aplicar e salvar a recuperação como uma operação única. Testar cancelamento, duplo clique, quantidades ímpares de dados de vida, exaustão com e sem comida e bebida, condição persistente e PV temporários preservados ao desmarcar.

Fontes: [Descansos](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/adventuring) · [PV temporários](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/combat) · [Espaços de magia](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/spellcasting) · [Exaustão e condições](https://media.dndbeyond.com/compendium-images/srd/5.1/SRD-OGL_V5.1.pdf).

#### 6. Munição — Remover registros legados de `outros`

- [ ] Usar a categoria **Munição** para ler, salvar, importar e exportar lotes. Remover a gravação da cópia legada em `outros` e as leituras que dependem dela.
- [ ] Revisar as fichas de exemplo. Se houver munição registrada apenas em `outros`, transferir o registro para a categoria **Munição** antes de excluí-lo. Se o lote já estiver na categoria correta, remover só a cópia de `outros`, sem somar as quantidades. Preservar os demais itens de `outros`.
- [ ] Importar e reexportar as fichas de exemplo para conferir que tipos, lotes e quantidades de munição permanecem corretos e que a cópia em `outros` não é recriada.
- [ ] Atualizar o `Contexto_Personagem.md` na mesma alteração, caso já exista e documente o formato afetado.

#### 7. Munição comum — Recuperação após combate

**Regra de D&D 5e (2014), propriedade Munição**

> “At the end of the battle, you can recover half your expended ammunition by taking a minute to search the battlefield.”

Ao fim do combate, você pode gastar 1 minuto procurando no campo de batalha para recuperar metade da munição que usou. Arredonde para baixo. A revisão de 2024 explicita esse arredondamento no próprio texto da propriedade. [SRD 5.1, regra de 2014](https://media.dndbeyond.com/compendium-images/srd/5.1/SRD-OGL_V5.1.pdf) · [Regras básicas de 2024](https://www.dndbeyond.com/sources/dnd/br-2024/equipment#Ammunition)

- [ ] Ao clicar em **Encerrar combate**, abrir automaticamente o modal **Recuperar munição** se houver munição comum gasta nesse combate. Se não houver, encerrar direto. Mostrar quanto foi gasto naquele combate por tipo de munição comum e sugerir metade, arredondada para baixo. Exemplo com 5 virotes gastos: sugerir 2.
- [ ] Permitir que o jogador ajuste a quantidade antes de confirmar, por exemplo, quando parte da munição estiver inacessível.
- [ ] Após confirmar, devolver ao inventário a quantidade indicada, registrar a recuperação no histórico e impedir uma segunda recuperação sobre o mesmo gasto. Oferecer **Pular por agora** para encerrar sem devolução. Manter a recuperação disponível no registro daquele combate até ser resolvida, inclusive após recarregar a ficha. Uma recuperação confirmada encerra a possibilidade de recuperar novamente o mesmo gasto.
- [ ] Conferir o cálculo com quantidades pares, ímpares e diferentes tipos de munição. Testar ajuste, cancelamento, confirmação e tentativa de recuperação repetida.

### Prioridade 2 — Dados da ficha e compatibilidade

#### 8. Projeto — Enxugar o JSON da ficha com IDs de catálogo

##### Etapa 1 — Magias

- [ ] Documentar o formato atual de `magiaNTexto`, onde é lido e gravado, e como preserva as magias e o estado de preparo em uma exportação seguida de importação. Usar as fichas de exemplo para validar o comportamento antes da migração.
- [ ] Atribuir IDs únicos e estáveis a magias e itens de catálogo usando o nome original em inglês em minúsculas e trocando espaços por hífens. Aplicar a mesma convenção aos demais catálogos à medida que forem migrados. Para itens e magias personalizados, preservar IDs próprios. Usar identificadores como `sacred-flame` para *Sacred Flame*. Manter o nome traduzido separado. Detectar colisões e resolver explicitamente antes de publicar o catálogo, preservando os IDs já usados em fichas.
- [ ] Para uma magia selecionada do catálogo, exportar o ID e, quando existirem, apenas os campos alterados na ficha. Guardar também os dados próprios do personagem, como o estado de preparo, quando necessários. Ao importar, resolver o ID no catálogo e aplicar as alterações apenas à magia da ficha.
- [ ] Para uma magia criada pelo jogador, gerar um ID próprio e persistir a definição completa no JSON. Preservar o ID ao editar, exportar e reimportar.
- [ ] Definir como lidar com IDs que não possam ser resolvidos ou com alterações no catálogo. Preservar os dados da ficha e sinalizar referências indisponíveis.
- [ ] Conferir a importação do formato atual e a exportação no formato novo. Testar uma magia de catálogo sem alterações, uma editada e uma personalizada. Verificar também o preparo, os espaços de magia, o uso em Combate e a redução do JSON exportado.
- [ ] Atualizar o `Contexto_Personagem.md` na mesma mudança do formato, com exemplos dos três casos, ou incluir o novo formato na criação do documento se ele ainda estiver pendente.

##### Etapa 2 — Itens

- [ ] Após validar as magias, aplicar o mesmo princípio aos itens de catálogo e aos itens personalizados. Preservar quantidade, lotes, estado equipado e outros dados próprios de cada item na ficha.

##### Etapa futura — Outros catálogos

- [ ] Avaliar classes, subclasses, raças, antecedentes, talentos e características para identificar quais dados de catálogo podem ser referenciados por ID e quais escolhas precisam permanecer na ficha. Planejar a adoção por categoria.

#### 9. Magias — Revisar a exibição de dados importados

- [ ] Conferir se nomes e descrições vindos do catálogo, de alterações locais e de magias personalizadas são exibidos como texto na lista, no modal e em **Combate → Magias**.
- [ ] Na importação e antes de usar dados do catálogo para exibir uma magia, conferir o ID exato e se ele resolve uma única entrada. Preservar a referência e as alterações da ficha quando o ID estiver ausente, for desconhecido ou estiver duplicado no catálogo. Sinalizar o problema e evitar associar automaticamente pelo nome exibido.
- [ ] Para magias personalizadas, conferir o ID próprio e usar a definição salva na ficha. Conferir a distinção entre IDs do catálogo e IDs personalizados na exportação e reimportação.
- [ ] Registrar no relatório de bugs as falhas encontradas durante a revisão.

#### 10. Contexto_Personagem.md — Criação guiada e exportação da ficha

**Objetivo:** entregar um prompt autônomo, em português do Brasil, que o jogador possa enviar a uma IA para montar seu personagem e receber um JSON importável no FichaDnD.

##### 10.1. Conversa com o jogador

- [ ] Fazer da primeira resposta da IA, ao ler o arquivo, exatamente esta pergunta: **“Me diga como você imaginou o personagem.”**
- [ ] Aproveitar as informações já dadas e perguntar em pequenos blocos só sobre escolhas em aberto. Se a classe estiver faltando, perguntar **“Qual classe você pensou para o seu personagem?”**.
- [ ] Sugerir classes, antecedentes e magias que combinem com o conceito. Explicar o que muda com cada opção, incluindo proficiências, ferramentas, idiomas e magias concedidas, quando aplicável.
- [ ] Perguntar se o jogador já tem os atributos e oferecer ajuda para calculá-los ou priorizá-los. Confirmar o método adotado pela mesa e ajudar a conferir modificadores, PV, CA, iniciativa, bônus de proficiência, perícias, salvaguardas e conjuração, conforme o caso.
- [ ] Tratar sugestões como opções até o jogador aceitar ou delegar a escolha. Respeitar decisões narrativas e permitir deixar em branco os detalhes opcionais aceitos pela ficha.
- [ ] Resumir as escolhas e perguntar exatamente **“Posso gerar a ficha ou deseja adicionar mais alguma coisa ao seu personagem?”**. Só gerar o JSON após autorização clara. Se o jogador pedir mudanças, atualizar o resumo e repetir a pergunta.

##### 10.2. Contrato do JSON e entrega

- [ ] Investigar importação, exportação, normalização, exemplos e catálogos da versão atual antes de escrever o prompt. Documentar no próprio arquivo as chaves, tipos, valores aceitos, campos opcionais, padrões e valores que a ficha calcula.
- [ ] Incluir exemplos completos e validar um personagem conjurador e um sem conjuração. Para cada um, importar, exportar novamente e conferir se as escolhas foram preservadas.
- [ ] Com autorização, entregar um único arquivo `.json` para baixar. Quando anexos não estiverem disponíveis, entregar o conteúdo integral em um único bloco de código e orientar a salvar como `meu-personagem.json`, evitando a extensão `.json.txt`.
- [ ] Na mesma resposta, explicar como baixar ou salvar o JSON, abrir o [FichaDnD](https://thiagotatagiba.github.io/FichaDnD/), clicar em **Importar ficha**, selecionar o arquivo e conferir nome, classe e nível. Verificar o rótulo e as etapas na versão publicada antes de concluir o documento.

##### 10.3. Manutenção

- [ ] Registrar no `AGENTS.md` que toda mudança na construção, importação, exportação ou normalização do JSON que afete o formato ou os valores da ficha deve atualizar o `Contexto_Personagem.md` na mesma alteração.
- [ ] Atualizar instruções e exemplos quando mudarem chaves, tipos, campos obrigatórios, valores padrão, opções aceitas ou cálculos persistidos. Validar o documento atualizado pelo fluxo de importação e reexportação.

#### 11. Antecedentes

**Objetivo:** estruturar a seleção de antecedentes e automatizar a importação de suas características para a ficha.

##### 11.1. Seleção de antecedentes

- [ ] Substituir o campo de texto atual por um `select` com os antecedentes disponíveis.
- [ ] Incluir a opção **Outros**, que habilitará um campo de texto para informar um antecedente personalizado.
- [ ] Manter o antecedente selecionado sincronizado com os dados do personagem.

##### 11.2. Catálogo de antecedentes

- [ ] Criar um arquivo JSON contendo os antecedentes disponíveis e suas respectivas características.
- [ ] Organizar os dados para permitir futuras integrações com outras seções da ficha.
- [ ] Preservar a possibilidade de antecedentes personalizados.
- [ ] Conferir como fichas antigas com texto livre abrem no seletor, incluindo nomes que não existem no catálogo.
- [ ] Verificar se as entradas do catálogo têm identificador estável e dados suficientes para exibir proficiências, idiomas, ferramentas e itens quando aplicáveis.

##### 11.3. Importação de características

Ao selecionar um antecedente, apresentar a pergunta:

**“Deseja importar as características deste antecedente?”**

- [ ] Se o usuário confirmar, importar as características para a seção **Status**.
- [ ] Se já existirem características importadas de outro antecedente, **substituir apenas as características provenientes do antecedente anterior**.
- [ ] Preservar características adicionadas manualmente ou provenientes de classe, raça e outras fontes.
- [ ] Evitar duplicações durante importações repetidas.
- [ ] Se o usuário cancelar, não modificar as características existentes.

**Regra importante:** as características importadas deverão possuir identificação de origem, permitindo distinguir os dados de antecedentes dos dados provenientes de outras fontes.

##### 11.4. Itens iniciais

A primeira característica cadastrada para cada antecedente será **Itens Iniciais**.

**Primeira versão:**

- [ ] Exibir os itens iniciais como texto descritivo.
- [ ] Não adicionar automaticamente equipamentos ao inventário.

**Evolução futura:**

- [ ] Permitir selecionar os itens iniciais diretamente no catálogo de equipamentos.
- [ ] Oferecer a possibilidade de adicioná-los ao inventário do personagem.

#### 12. Status — Proficiências e características (Já começou)

**Objetivo:** substituir gradualmente campos de texto livre por sistemas estruturados de seleção, facilitando a organização, edição e futura automatização das proficiências.

Cada categoria terá um botão **+**, responsável por abrir um modal com as opções disponíveis.

##### 12.1. Idiomas — Implementado (2026-11-23)

**Status:** Implementado. A execução do teste automatizado e o round-trip de arquivo JSON permanecem pendentes.

Na seção **Outras Proficiências — Idiomas**:

- [x] Substituir o campo de texto atual por uma área de **tags**.
- [x] Adicionar um botão **+** para abrir o modal de seleção de idiomas.
- [x] Apresentar checkboxes dos idiomas disponíveis, permitindo selecionar vários.
- [x] Incluir a opção **Outros** por último, com um campo para idiomas personalizados.
- [x] Permitir informar múltiplos idiomas personalizados separados por vírgula.
- [x] Converter cada idioma selecionado ou digitado em uma tag individual.
- [x] Remover idiomas desmarcando-os no modal; as tags não têm botão `×`.
- [x] Impedir duplicações, inclusive quando houver diferenças de maiúsculas e minúsculas.

- [x] Exibir como tags os idiomas de fichas antigas, mantendo o campo CSV persistido.
- [ ] Executar o teste automatizado de idiomas.
- [ ] Importar uma ficha existente, editar os idiomas, exportar e reimportar para conferir tags, idiomas personalizados e remoções.

##### 12.2. Armas, armaduras e ferramentas — Evolução futura

Aplicar posteriormente o mesmo modelo de seleção por modal e exibição por tags às proficiências com:

- [ ] Armas.
- [ ] Armaduras.
- [ ] Ferramentas.

Essas categorias deverão considerar a futura integração com os catálogos de equipamentos e itens da ficha.

**Observação:** essa implementação ficará para uma etapa posterior, para evitar duplicação de dados e permitir sincronização entre proficiências e equipamentos.

- [ ] Mapear as categorias atuais dos catálogos e definir como os nomes personalizados serão armazenados.
- [ ] Conferir que fichas antigas exibem as proficiências já gravadas e que adicionar ou remover uma tag continua funcionando após exportar e reimportar.

### Prioridade 3 — Usabilidade e verificações complementares

#### 13. Magias do personagem — Busca e filtros

- [ ] Adicionar busca por nome e filtros por nível e estado de preparo à lista de magias já cadastradas no personagem. Manter os resultados agrupados por nível.
- [ ] Permitir combinar busca e filtros. Adicionar **Limpar filtros** para apagar a busca, redefinir os filtros e restaurar a lista completa.
- [ ] Conferir busca isolada, filtros isolados, combinação dos três controles, lista sem resultados e restauração da lista completa.
- [ ] Deixar o filtro por escola de magia para uma etapa posterior.

#### 14. Magias — Conferir o modal em telas pequenas

- [ ] Em tela de celular, abrir, editar e salvar uma magia com descrição longa. Conferir a rolagem e se **Salvar** e **Cancelar** ficam acessíveis com o teclado aberto.
- [ ] Conferir se o foco retorna à lista ao fechar o modal e se a abertura de outros modais causa sobreposição.
- [ ] Registrar e corrigir os problemas reproduzidos na verificação.

#### 15. Características de Classe — Cards por nível

**Objetivo:** substituir a tabela geral de características de classe por uma interface de cards navegáveis, organizada pelos níveis de 1 a 20.

##### 15.1. Visualização

- [ ] Exibir um card correspondente ao nível selecionado.
- [ ] Iniciar a visualização no nível atual do personagem.
- [ ] Disponibilizar controles para avançar ou retroceder entre os níveis.
- [ ] Permitir navegar por **todos os níveis de 1 a 20**, independentemente do nível atual do personagem.
- [ ] Destacar visualmente quando o usuário estiver consultando um nível diferente do nível real do personagem.

##### 15.2. Conteúdo dos cards

Cada card deverá apresentar as informações correspondentes ao nível consultado, incluindo:

- [ ] Características de classe.
- [ ] Características de subclasse, quando aplicáveis.
- [ ] Progressão dos espaços de magia, quando aplicável.
- [ ] Outras informações relevantes da progressão da classe.

As informações deverão respeitar a classe e a subclasse selecionadas.

##### 15.3. Navegação e progressão

**Exemplo:** um Clérigo de nível 3 abrirá inicialmente o card do nível 3, mas poderá navegar até o nível 20 para consultar suas futuras características.

- [ ] A navegação terá finalidade exclusivamente informativa.
- [ ] Consultar outro nível não alterará o nível real do personagem.
- [ ] Não serão concedidas automaticamente características, magias, recursos ou espaços de magia de níveis futuros.
- [ ] A evolução efetiva do personagem continuará vinculada ao sistema de **Level Up**.
- [ ] Ao mudar de classe ou subclasse, o conteúdo exibido deverá ser atualizado conforme a nova seleção.
- [ ] Verificar os limites dos níveis 1 e 20, a consulta de um nível futuro e a troca de classe ou subclasse. Conferir que navegar não altera o personagem salvo.

#### 16. Vestimentas comuns — Conferir implementação e testes

- [ ] Conferir no código e nos testes existentes quais verificações abaixo já estão cobertas. Marcar como concluído o que for confirmado e detalhar somente as lacunas encontradas.
  - [ ] Verificar entradas inválidas ou duplicadas no catálogo e o tratamento do peso com uma casa decimal, conforme o padrão da ficha.
  - [ ] Verificar criação, edição, exclusão e cancelamento no inventário, incluindo o recálculo da carga e a preservação dos valores ao cancelar.
  - [ ] Conferir as operações em tela pequena, com teclado e com leitor de tela.

### Concluído

#### Magias — Visualização de espaços por nível

- [x] Indicador visual existente, confirmado nas capturas. Em **Combate → Magias**, o cabeçalho do nível mostra a contagem compacta (por exemplo, **2/2**). Na aba **Magias**, os campos **Espaço Restante** e **Total de Espaço** exibem os valores por nível.

### Diretrizes gerais de implementação

- [ ] Preservar dados existentes durante a migração de campos de texto livre para formatos estruturados.
- [ ] Identificar a origem das características importadas, permitindo substituições seletivas sem apagar informações de outras fontes.
- [ ] Manter suporte a informações personalizadas por meio da opção **Outros**.
- [ ] Evitar características, proficiências e idiomas duplicados.
- [ ] Integrar os novos componentes aos mecanismos existentes de salvamento, importação, exportação e rollback.
- [ ] Implementar as funcionalidades incrementalmente, com testes de persistência, compatibilidade e regressão.
- [ ] Manter estas propostas como **ideias rascunhadas**, até que sejam formalmente priorizadas no Roadmap.

## Ideias para avaliar

A auditoria da tela Combate de 19/11/2026 manteve as ideias abaixo em avaliação.

- [ ] **Rolagens — vantagem e desvantagem (aguardando aprovação):** a implementação anterior foi removida dos modais e deixou de afetar ataques, salvaguardas, perícias e valores passivos. Redesenhar a experiência e definir a integração antes de propor nova implementação; os dados legados permanecem inertes e compatíveis.

- [ ] **Combate — defesas manuais do alvo em ataques (aguardando aprovação):** a interface temporária para informar resistências, vulnerabilidades e imunidades foi removida dos modais de ataque/dano. Avaliar e aprovar uma experiência e uma fonte de dados para aplicar essas defesas antes de reintroduzir a mecânica; o dano tipado do ataque permanece registrado sem modificadores manuais do alvo.

- [ ] **Vestimentas — integrar vantagens em perícias:** hoje os itens podem guardar a seleção de perícias, mas a ficha ainda não tem um sistema de vantagens aplicável aos testes. Quando esse sistema existir, avaliar como converter os dados do item em vantagem real, tratar múltiplas fontes e exibir a origem do benefício. Não implementar antes de definir a mecânica geral.
  - [ ] Mapear como registrar fontes simultâneas de vantagem e confirmar o comportamento ao desequipar uma peça.

- [ ] **Munições mágicas — regras futuras:** definir uma lista de efeitos estruturados e como bônus interagem com ataque/dano antes de ativar qualquer bônus; os campos extensíveis atuais são somente dados inertes.
  - [ ] Listar efeitos que o sistema atual de ataque e dano consegue aplicar e como tratar o consumo do lote.

- [ ] **Magias — navegação para listas extensas (adiada):** retomar quando personagens com listas maiores precisarem de navegação além da busca e dos filtros. Nos primeiros níveis, o volume atual do catálogo é pequeno. Avaliação futura: avaliar apresentação compacta, paginação ou outra navegação quando um personagem tiver muitas magias. A UI atual já renderiza itens por nível e oferece visualização/edição em modal.
  - [ ] Comparar seções recolhíveis por nível e uma lista compacta usando uma ficha com muitas magias.

- [ ] **Combate e magias — interação de arrastar e soltar (adiada):** avaliar se arrastar uma magia preparada para a subaba de combate melhoraria o fluxo. A integração atual já lista magias preparadas e tem uso com consumo de espaço; arrastar/soltar seria uma alternativa de interação.
  - [ ] Comparar o benefício com o fluxo atual de uso de magias e avaliar interação por toque e teclado.
