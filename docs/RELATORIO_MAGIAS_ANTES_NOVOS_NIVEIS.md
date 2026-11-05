# Revisão de magias antes da expansão do catálogo

Data: 05/11/2026. Base: commit `1ef01af`.

## Parecer

O mecanismo atual atende à seleção, edição e uso básico das magias já testadas, mas ainda representa de forma limitada efeitos futuros, múltiplos efeitos e progressão. Recomendo resolver as prioridades P1 abaixo antes de cadastrar novos níveis em escala. Inserir apenas mais descrições agora ampliaria o trabalho de revisão posterior.

Este relatório registra propostas, não altera o mecanismo nem aprova automaticamente novas tarefas. A análise examinou o código e os JSONs e executou verificações locais de dados e fórmulas. Não houve uma nova rodada de testes visuais no navegador.

## Situação conferida

- 42 truques e 47 magias de nível 1.
- Material possui checkbox, descrição persistente e exibição na visualização.
- Dano automático possui caminho próprio para o modal de dano no combate.
- Próximos níveis é um texto informativo: não é uma regra executável de progressão.
- 10 registros têm Material marcado e descrição vazia: 6 truques e 4 magias de nível 1.
- Os truques possuem IDs no catálogo; as 47 magias de nível 1 não possuem IDs fixos na fonte. A normalização gera IDs para os registros adicionados à ficha, mas isso não identifica sua origem no catálogo.

## P1 — Recomendações antes de adicionar novos níveis

### 1. Separar conjuração de aplicação do efeito

**Constatação:** o encaminhamento para dano considera a propriedade Dano e a resolução, mas não representa quando o efeito acontece. Absorver Elementos recebeu uma exceção nos dados para não causar dano na conjuração. Armadura de Agathys, Hex e Golpe Trovejante ainda possuem Dano marcado, embora suas próprias descrições condicionem o dano a um evento posterior.

**Proposta:** representar o momento do efeito: imediato, ao acertar um ataque, ao sofrer um ataque ou no início/fim do turno. Registrar a conjuração e permitir aplicar posteriormente o efeito sem consumir outro espaço.

**Validação:** conjurar Absorver Elementos ou Hex registra o uso sem abrir dano imediato; aplicar seu bônus depois não gasta espaço. Mísseis Mágicos continua abrindo dano imediatamente.

Referências: [resolverCombateMagia](../js/modules/magias.js), [catálogo de nível 1](../assets/data/magias-nivel-1.json).

### 2. Preservar efeitos ao editar e salvar

**Constatação:** o formulário lê o primeiro efeito de dano e o primeiro de cura. Ao salvar, reconstrói o array e grava a regra de dano como texto vazio. Isso perde regras estruturadas e não preserva futuros efeitos adicionais. Parte das regras atuais foi repetida na descrição para continuar acessível, mas isso não resolve a limitação do editor.

**Proposta:** preservar efeitos que não foram editados e oferecer edição de múltiplos efeitos quando necessário. Cada efeito deve ter sua própria fórmula, tipo, condição e teste.

**Validação:** abrir e salvar uma magia sem alterações não modifica seu array de efeitos. Flecha de Gelo deve suportar ataque perfurante e explosão de frio como efeitos distintos.

Referências: `preencherFormularioMagia` e `lerFormularioMagia` em [magias.js](../js/modules/magias.js).

### 3. Aplicar progressão ao espaço escolhido

**Constatação:** o nível do espaço é consumido e transportado para o histórico, mas a arma virtual usa a fórmula base. Próximos níveis é exibido como texto e não altera essa fórmula. Truques também precisam de uma regra explícita de crescimento pelo nível total do personagem.

**Proposta:** manter Próximos níveis como explicação e adicionar uma estrutura de progressão separada: dano, cura, alvos, duração e área. Mostrar a fórmula final antes de confirmar o uso.

**Validação:** Mãos Flamejantes com espaço de nível 2 apresenta 4d6; Curar Ferimentos apresenta 2d8 + modificador; Mísseis Mágicos apresenta quatro projéteis. Testar também magias que não escalam e os patamares de evolução de truques.

Referências: `confirmarUsoMagia`, `criarArmaVirtualMagia` e `parsearFormulaDanoMagia` em [magias.js](../js/modules/magias.js).

### 4. Definir um contrato de dados e validar o catálogo

**Constatação:** os níveis têm estruturas diferentes, componentes incompletos e uso desigual de IDs. Existem textos livres para fórmulas e progressão, sem validação suficiente para garantir que o motor os execute.

**Proposta:** definir campos obrigatórios e opcionais, IDs fixos de catálogo, versão do formato, edição das regras e origem da referência. Validar automaticamente níveis, enums, duplicatas, componentes e coerência entre propriedades e efeitos. Manter ID de catálogo separado do ID da cópia da ficha.

**Validação:** cada JSON passa pelo mesmo validador; erros indicam a magia e o campo. Dados antigos continuam importáveis por normalização ou migração explícita.

Referências: `criarMagiaPadrao`, `normalizarMagiaRegistro` e `normalizarCatalogoMagias` em [magias.js](../js/modules/magias.js).

### 5. Tratar fórmulas fixas e compostas sem interpretação parcial

**Constatação reproduzida:** `parsearFormulaDanoMagia("5")` e `parsearFormulaDanoMagia("2d6 + 1d8")` retornam nulo. Já `3d4 + 3` é reconhecida. O parser genérico do combate extrai apenas um grupo de dados. O valor fixo 5 aparece em Armadura de Agathys.

**Proposta:** unificar a interpretação de fórmulas. Aceitar dano fixo, dados com bônus e efeitos separados com tipos distintos. Se uma expressão não for suportada, informar isso e permitir entrada manual, sem fingir uma rolagem válida.

**Validação:** 5 resulta em dano fixo sem rolar; 3d4 + 3 preserva o bônus; fórmulas compostas são calculadas integralmente ou recusadas com mensagem clara.

Referências: [magias.js](../js/modules/magias.js) e [combate.js](../js/modules/combate.js).

## P2 — Melhorias funcionais seguintes

| Tema | Situação ou risco observado | Melhoria sugerida |
| --- | --- | --- |
| Testes sem dano | A seleção do teste de resistência fica condicionada a Dano, apesar de existirem magias de controle com teste | Exibir resolução e atributo independentemente de causar dano; separar o teste para evitar dano do teste para evitar uma condição |
| Cura | A regra fica em texto e não segue um fluxo equivalente ao de dano mágico | Modal de cura com fórmula, modificador de conjuração e valor final no histórico; aplicação de PV deve ser explícita |
| Ação e reação | Registros de conjuração e abertura do modal de dano usam Ação como padrão | Estruturar ação, ação bônus, reação e tempo prolongado; registrar o tipo correto sem interpretar frases livres |
| Ritual | A informação permanece nas descrições, e o uso normal exige escolher e consumir espaço | Campo ritual e escolha explícita de conjuração ritual quando permitida; registrar sem gasto de espaço |
| Materiais | 10 componentes materiais ainda sem descrição; custos e consumo são texto livre | Completar as lacunas com fonte adequada; depois separar descrição, custo e consumo. Não exigir ouro ou debitar inventário automaticamente sem definir esse comportamento |
| Cancelamento | O espaço é consumido antes de abrir o modal de ataque/dano; o registro desse fluxo ocorre posteriormente | Definir a diferença entre cancelar antes de conjurar e fechar uma rolagem após conjurar; manter registro da conjuração mesmo quando o resultado não for concluído |
| Concentração | A ativação substitui o estado anterior diretamente; o estado ativo reside em memória | Indicar qual magia será encerrada ao iniciar outra e avaliar persistência na ficha. Conferir recarga e importação antes de prometer continuidade |
| Atualização do catálogo | A magia adicionada é uma cópia; ajustes na fonte não atualizam a cópia automaticamente | Ação Atualizar do catálogo, com comparação e preservação de personalizações; depende de ID de origem estável |
| Carregamento | O carregamento conjunto rejeita o catálogo inteiro se um nível falhar | Carregar níveis independentemente e indicar apenas o indisponível; uma falha no nível 9 não deve impedir os truques |
| Importação | JSON inválido no armazenamento de um nível pode cair na interpretação legada por linhas | Distinguir texto legado de JSON corrompido e informar erro sem transformar trechos de JSON em nomes de magia |

Referências principais: [magias.js](../js/modules/magias.js), [combate.js](../js/modules/combate.js) e [habilidades.js](../js/modules/habilidades.js).

## Lacunas de materiais confirmadas

**Truques:** Amizade, Apostasia Sombria, Chicotada Espinhosa, Golpe Verdejante, Golpe Eletrizante e Palavra Radiante.

**Nível 1:** Armadura de Agathys, Cerimônia, Disparo de Bruxa e Gagueira Caústica de Tasha.

Esses registros possuem Material marcado e texto vazio. Isso não significa que o componente não existe; significa que a descrição ainda precisa ser preenchida e conferida.

## P3 — Interface e manutenção

- Mostrar edição das regras, origem do catálogo e diferença entre nível base e espaço usado.
- Filtrar por concentração, ritual, ação, resolução e componentes, além de classe e nome.
- Distinguir no histórico conjuração, ataque, resistência, dano e cura, vinculados ao mesmo uso.
- Fazer teste visual do formulário em celular, com material longo e navegação por teclado.
- Separar catálogo, normalização, resolução e interface gradualmente para reduzir regressões no módulo de magias.

## Sequência sugerida

1. Definir contrato de dados, IDs de catálogo e validador.
2. Preservar múltiplos efeitos na edição e representar quando eles acontecem.
3. Unificar fórmulas e implementar progressão por espaço e por nível do personagem.
4. Conferir registro, cancelamento, ação/reação, cura, ritual e concentração.
5. Completar e validar truques e nível 1 como catálogo de referência.
6. Adicionar um lote pequeno do nível 2, com teste de cada tipo de efeito, antes de expandir o restante.

## Critérios mínimos para começar o próximo nível

- Nenhum efeito desaparece em um ciclo de abrir, editar e salvar.
- Dano futuro não é solicitado na conjuração.
- Espaço e fórmula efetiva correspondem, ou a interface informa explicitamente que o ajuste é manual.
- Toda conjuração concluída tem histórico, sem duplicação indevida nem gasto repetido de espaço.
- Dados antigos continuam importáveis e o catálogo passa na validação.
- Testes de regressão cobrem ataque, resistência, automático, cura, controle sem dano, ritual e componente material.

Os testes sugeridos acima são uma lista de aceitação para as próximas mudanças; não foram implementados como parte deste relatório.
