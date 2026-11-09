# Plano de verificação responsiva dos modais do inventário

Data: 2026-11-07
Estado: execução iniciada; prévias de cadastro e formulários manuais receberam ajustes para celular. Validação em aparelho físico e conferência final desktop ainda pendentes.

## Objetivo

Verificar e, conforme os problemas reproduzidos, ajustar a experiência móvel dos modais de **escudos, armaduras e armas**. O escopo cobre seleção no catálogo, prévia/detalhes e visualização/edição de itens já adicionados. A prioridade é uso confortável em celular, sem perda de funcionalidades de desktop, compatibilidade das fichas ou regras de D&D 5e 2014.

Este documento é um roteiro de validação. Não declara bugs antes de reproduzi-los nem aprova mudanças de comportamento, dados ou regras.

## Referências no código

- [armaduras.css](../../css/armaduras.css): estilos de cartões e modais das três categorias; regras móveis atuais para seletor de armaduras e armas.
- [armaduras-catalogo.js](../../js/modules/armaduras-catalogo.js), [escudos-catalogo.js](../../js/modules/escudos-catalogo.js) e [armas-catalogo.js](../../js/modules/armas-catalogo.js): criação e interações dos catálogos e modais.
- [equipamentos.js](../../js/modules/equipamentos.js): estrutura legada dos cartões, edição e equipamento.
- [PLANO_CATALOGO_ARMAS.md](./PLANO_CATALOGO_ARMAS.md): regressão de integração de armas ainda pendente.
- [CATALOGO_ITENS_ARMADURAS.md](./CATALOGO_ITENS_ARMADURAS.md): escopo e validações anteriores do catálogo de armaduras.

## Inventário de fluxos a verificar

| Categoria | Fluxos | Pontos de atenção móvel |
| --- | --- | --- |
| Escudos | Abrir catálogo, pesquisar/filtrar, selecionar, ler detalhes, adicionar; abrir item, editar, equipar/desequipar, salvar/cancelar e remover | Composição do modal compartilhado, lista e detalhes em telas estreitas, botões, campos do editor e rolagem |
| Armaduras | Abrir catálogo, pesquisar/filtrar, selecionar, ler CA e propriedades, adicionar/criar; abrir item, editar, equipar/retirar, salvar/cancelar e remover | Cabeçalho e ação de equipar, grade de propriedades, editor, avisos de proficiência/furtividade e descrição |
| Armas | Abrir catálogo, pesquisar/filtrar, selecionar, ler detalhes, adicionar/criar; abrir item, editar, equipar, salvar/cancelar e remover | Filtros, dano/alcance, propriedades, munição, flags mágicas/sintonização, campos de edição e ações |

## Matriz de dispositivos e viewports

Registrar dimensões CSS reais do viewport e orientação. Usar, no mínimo:

| Perfil | Viewport de referência | O que observar |
| --- | ---: | --- |
| Celular estreito | 320 × 640 | Nenhuma rolagem horizontal; controles e texto não colidem |
| Celular comum | 390 × 844 | Fluxo completo com toque e rolagem vertical |
| Celular grande | 430 × 932 | Aproveitamento do espaço sem esticar conteúdo de forma desconfortável |
| Tablet/retrato | 768 × 1024 | Transição entre apresentação empilhada e layout amplo |
| Desktop | 1280 × 800 | Ausência de regressão no layout atual |

Repetir ao menos uma largura móvel em orientação paisagem e verificar uma tela de baixa altura. Se possível, confirmar também em aparelho físico; viewport de navegador sozinho não avalia teclado virtual, safe areas e comportamento real de toque.

## Roteiro comum para cada modal

1. Abrir o modal pelo botão correspondente e verificar foco inicial, título acessível e estado inicial.
2. Testar carregamento, busca sem resultados, filtros, lista vazia e falha de carregamento, quando aplicável.
3. Selecionar um item e percorrer os detalhes até o botão de adicionar. Confirmar que lista e detalhes rolam sem prender a página ou esconder a ação principal.
4. Adicionar um item e confirmar o retorno ao inventário, foco previsível e cartão atualizado.
5. Abrir item existente, percorrer detalhes/editor e testar salvar sem alterações, alterar e salvar, alterar e cancelar, fechar e remover.
6. Repetir interações principais por teclado e toque: foco visível, alvos acionáveis, controles sem sobreposição e fechamento previsível.
7. Com o modal aberto, verificar que o conteúdo de fundo não rola indevidamente e que, ao fechar, o foco retorna ao controle que abriu o modal.
8. Capturar evidência nos viewports de referência, anotando categoria, fluxo, largura/altura, navegador e resultado.

## Casos específicos

### Escudo

- Verificar a lista e os detalhes do catálogo, incluindo nomes longos e a alternância de seleção.
- Confirmar que o modal não herda dimensões inadequadas do modal de armadura e que a categoria ou filtros de escudo cabem em 320 px.
- No editor, conferir campos, proficiência, estado mágico/sintonização, descrição e botões de ação.
- Exercitar equipar/desequipar e remover; confirmar que estados e conteúdo permanecem legíveis durante a rolagem.

### Armadura

- Verificar filtros por categoria e proficiência, pesquisa, detalhes de CA e propriedades e ação de adicionar.
- No modal do item, testar cabeçalho com nome longo e ação Vestir/Retirar; conferir CA, peso, custo, Força mínima, furtividade e descrição.
- No editor, verificar campos em uma coluna, flags e ações salvar/cancelar/remover.
- Conferir avisos de falta de proficiência e o estado equipado em telas estreitas.

### Arma

- Verificar filtros de categoria, modo e proficiência; busca em português/inglês e estado sem resultados.
- Conferir dano normal/versátil, alcance e propriedades sem cortar textos ou provocar largura excedente.
- Testar armas com e sem munição: seletor de pilha, mensagem de ausência e comportamento de opções longas.
- No editor, validar campos de dano, alcance, preço/moeda, peso, categoria, propriedades, munição e estado mágico.
- Verificar ações de equipamento e remoção e preservar o cenário funcional de desktop.

## Critérios de aceite

- Nenhum dos três modais causa rolagem horizontal da página em 320 px.
- Título, conteúdo, controles e ações principais permanecem visíveis ou alcançáveis por rolagem vertical; nenhum botão fica encoberto pelo teclado virtual nos testes em aparelho.
- Lista, detalhes e formulário não disputam a mesma área de rolagem de modo que impeça completar a tarefa.
- Campos, selects, checkboxes e botões não se sobrepõem; texto longo quebra ou rola dentro de seu componente sem expandir a página.
- Adicionar, editar, salvar, cancelar, equipar/desequipar e remover continuam funcionais em cada categoria.
- Fechar restaura o foco e os modais continuam utilizáveis por teclado.
- Desktop permanece funcional; problemas e correções são registrados por categoria e viewport.
- Alterações de estilo não modificam regras, cálculos, persistência ou formato de exportação.

## Registro dos resultados

Preencher durante a execução, sem marcar como aprovado quando só houve inspeção de código:

| Data | Categoria/fluxo | Viewport e navegador | Resultado/evidência | Problema reproduzido ou correção |
| --- | --- | --- | --- | --- |
| 2026-11-06 | Seletores de catálogo (lista/detalhes) | Chromium integrado; 320 × 844, 390 × 844 e 768 × 844 | A área de conteúdo, lista e detalhes não excederam suas larguras internas nas três medidas; os detalhes dos catálogos foram conferidos com seleção ativa. | Armaduras e escudos excediam a largura interna a 320 px antes do ajuste. As grades de resumo e os limites dos detalhes foram adaptados para celular. |
| 2026-11-06 | Modal de escudo e editor | Chromium integrado; 320 × 640 | Modal dentro da viewport; conteúdo rolável verticalmente. Os campos e ações do editor ficaram em coluna e alcançáveis. | O resumo de bônus/tempos usava colunas fixas; reduzida para coluna no celular e o cabeçalho passou a respeitar a largura disponível. |
| 2026-11-06 | Modal de armadura | Chromium integrado; 320 × 640 | Cabeçalho, Equipar, Editar e Fechar ficaram dentro da largura do modal; corpo com rolagem vertical. Detalhes e CTA do catálogo ficaram acessíveis pela rolagem do painel. | O resumo CA/tempos excedia o painel em 320 px. Grade empilhada no celular. |
| 2026-11-06 | Modal e editor de arma | Chromium integrado; 320 × 640 | Modal de visualização e formulário ficaram dentro da largura disponível; campos e ações sem overflow horizontal e formulário rolável. | Propriedades permanecem em grade de duas colunas, com alvos de checkbox e rótulos quebrando em linhas quando necessário. Conferir toque em aparelho físico segue pendente. |
| 2026-11-06 | Seletor de armas e prévia | Chromium integrado; 320 × 844, 390 × 844 e 768 × 844 | Lista e detalhes cabem no painel nos três viewports. Prévia de espada longa manteve dano versátil e informações sem overflow horizontal. | Adicionado limite explícito de largura mínima/máxima ao painel de detalhes e artigo. CTA fica abaixo da dobra em 320 × 640, mas alcançável por rolagem vertical. |
| 2026-11-07 | Prévia de cadastro de armadura, escudo e arma | Chromium integrado; 320 × 640 | As três prévias não excederam a largura do painel. Título ficou à direita do símbolo em armadura e escudo. Na arma, título e símbolo se sobrepunham; após ajuste de grade e quebra da categoria, a prévia passou a caber sem overflow e o título aparece à direita do símbolo. | Incluídas regras específicas para `.arma-previa-catalogo`; categoria longa pode quebrar dentro da coluna. CTA é acessível com rolagem vertical. |
| 2026-11-07 | Formulários de cadastro manual (armadura, escudo e arma) | Chromium integrado; 320 × 640 | Formulários rolam verticalmente e ações ficam alcançáveis. Campos de armadura/escudo e linhas de arma foram medidos com coluna única; propriedades de arma quebram rótulos longos sem ampliar o formulário. | Armadura mantinha duas colunas em 320 px; corrigido para uma coluna. Itens criados só para inspeção foram removidos ao fim dos fluxos. |
| 2026-11-06 | Fluxos de armadura e arma | Chromium integrado; 320 × 640 | Cancelar e salvar sem alteração retornaram à visualização; equipar/desequipar alternou o estado e foi revertido ao estado inicial. | Interação manual pelo navegador; remoção e fluxo completo de adicionar ainda pendentes. |
| 2026-11-06 | Seletor em paisagem/baixa altura | Chromium integrado; 640 × 320 | Ajuste CSS compacta cabeçalho e filtros, mantém área rolável para lista/detalhes e dimensiona o modal pela altura disponível; CTAs alcançados com rolagem do painel. | Corrigido caso em que cabeçalho e filtros consumiam toda a área útil. |
| 2026-11-07 | CTAs dos três seletores em paisagem | Chromium integrado; 640 × 320 | Armadura, escudo e arma: modais ficaram entre y=8,5 e y=296,5; CTA de adicionar permaneceu visível após rolar os detalhes (todos dentro da viewport de 320 px). | A medição confirmou espaço útil e ação alcançável nos três catálogos. |
| 2026-11-07 | Adicionar, equipar, desequipar e remover escudo | Chromium integrado; 390 × 844 | Cadastro pelo catálogo abriu o card criado; equipar marcou checkbox e aplicou +2 CA; desequipar desmarcou e removeu o bônus. Excluir escudo equipado removeu o card e limpou o slot. | Corrigido vínculo do botão de detalhes nos cards clonados, sincronização por `data-index` e recálculo da CA após exclusão. |
| — | Teclado virtual, safe areas e aparelho físico | — | Pendente | Viewports de navegador não confirmam comportamento do teclado móvel, safe areas ou toque em dispositivo real. |
| 2026-11-06 | Seletores de catálogo (desktop) | Chromium integrado; 1280 × 800 | Os três modais ficaram com 900 px de largura, lista/detalhes dentro do painel e sem overflow horizontal. | Nenhuma regressão geométrica observada; inspeção visual e fluxos completos ainda pendentes. |

## Fora do escopo

- Regressão completa de combate e persistência de armas, já descrita em [PLANO_CATALOGO_ARMAS.md](./PLANO_CATALOGO_ARMAS.md).
- Reformulação dos cartões e demais categorias do inventário, salvo quando forem necessários para abrir ou validar estes modais.
- Alteração de regras, estrutura de dados, textos normativos ou comportamento de importação/exportação.

## Próximo passo

Continuar com validação de teclado e foco, safe areas e aparelho físico. Armadura e arma ainda precisam de um fluxo integrado de adicionar/remover nesta sessão; edição, salvar/cancelar e equipar/desequipar já foram conferidos. Para o escudo, adicionar, abrir detalhes, equipar/desequipar e excluir equipado foram exercitados. A implementação responsiva será considerada validada somente quando os critérios de aceite estiverem registrados como atendidos.
