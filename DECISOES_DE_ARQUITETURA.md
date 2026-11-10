# Decisões de Arquitetura

## 1. Aplicação front-end estática

A aplicação foi desenvolvida como uma interface web estática, sem backend próprio. Essa decisão reduz complexidade operacional e facilita o uso em navegador, especialmente para uma ficha de personagem e suporte de mesa de RPG.

### Vantagens

- Execução simples e direta
- Sem infraestrutura adicional
- Fácil compartilhamento e uso local
- Compatibilidade com o fluxo de exportação/importação de JSON

### Trade-off

- Menor escalabilidade para múltiplos usuários simultâneos
- Estado e lógica dependem fortemente do cliente
- Menor diferenciação entre regras de negócio e camada de apresentação

## 2. Estrutura monolítica em arquivos funcionais

O projeto organiza o código por áreas de responsabilidade, como atributos, combate, magia, equipamentos e importação, mas ainda mantém uma abordagem centralizada, sem framework de UI.

### Impacto

- A organização por módulos é suficiente para manutenção incremental
- A aplicação continua enxuta e direta para editar rapidamente
- O acoplamento com o DOM permanece alto

## 3. Uso de DOM como principal mecanismo de estado

A maior parte da lógica interage diretamente com `document`, `input`, `select` e elementos renderizados dinamicamente. Isso facilita a criação rápida de interfaces, mas impacta testabilidade e manutenção.

### Consequência

- Muitos comportamentos são dependentes de IDs fixos nos campos
- Há forte compartilhamento de dados entre funções globais e elementos da tela
- A lógica dinâmica fica mais sensível a mudanças na estrutura HTML

## 4. Persistência orientada a JSON

O sistema salva e carrega fichas em arquivos JSON. Esse padrão permite portabilidade, versionamento, backup e fácil troca de personagens entre ambientes.

### Benefícios

- Fichas são facilmente editáveis e compartilháveis
- Compatibilidade com importação/exportação de dados
- Facilidade de migração de dados em versões futuras

## 5. Compatibilidade com versões legadas de dados

O código implementa normalização de aliases e compatibilidade para campos antigos. Isso mostra uma escolha consciente de preservar versões anteriores de fichas e reduzir quebra de uso.

### Exemplo

- `bonusProficiencia` e `bonusProf`
- `classeNome` e `classeNomeID`
- `atrib_*` e `prof_salv_*`

Essa estratégia é importante para manter estabilidade de dados sem exigir migração agressiva.

## 6. Dependência de dados externos em arquivos JSON/JS

Classes, raças, sub-classes, magias, equipamentos e talentos são alimentados por arquivos estruturados em JavaScript/JSON. Isso torna a aplicação configurável e evita hardcode em trechos de UI.

### Vantagem

- Regras ficam organizadas em estrutura de dados
- Facilita extensão de conteúdo
- Insere maior flexibilidade para campanhas específicas

## 7. Evolução incremental em vez de reescrita completa

A arquitetura atual indica que a refatoração deve ser gradual, priorizando extração de módulos e padronização de estado antes de mudanças estruturais mais profundas.

### Direção adotada

- Manter a ficha funcional
- Reduzir acoplamento conforme a equipe evolui
- Priorizar compatibilidade da aplicação existente
- Introduzir modularização sem quebrar fluxos críticos

## 8. Estado global como mecanismo pragmático

Embora não seja a melhor prática moderna, o uso de objetos globais e variáveis compartilhadas permitiu velocidade de desenvolvimento e agilizou a construção da ferramenta.

### Observação

Este ponto é reconhecido como uma dívida técnica e um candidato principal para refatoração futura.

## Decisão de arquitetura alvo

A arquitetura alvo ideal para o projeto é:

- separação clara de regras e View
- módulos por domínio
- estado centralizado em camada apropriada
- teste de regras críticas
- persistência robusta com validação de JSON

A transição pode ocorrer gradualmente sem reescrever a aplicação inteira.

## 9. Regras de negócio e referência normativa

### Complemento aprovado — catálogo de armaduras (2026-11-05)

A execução da [proposta de armaduras](docs/propostas/CATALOGO_ITENS_ARMADURAS.md) foi autorizada pelo usuário. O catálogo usa D&D 5e 2014 e a convenção métrica de mesa de 0,5 kg por libra da tabela de origem, sem conversão física exata. Essa convenção prepara somente os pesos do catálogo; não modifica pesos salvos nem fórmulas de carga.

O [catálogo JSON](assets/data/itens/armaduras.json) é estático. Cada exemplar guarda valores efetivos, identidade própria e referência opcional ao catálogo; mudanças na base não substituem itens salvos. O índice de equipamento legado continua sendo utilizado, com ajuste ao excluir itens. O [módulo de armaduras](js/modules/armaduras-catalogo.js) separa seleção e carregamento da criação programática usada na importação. Falhas de carregamento permitem cadastro manual. Requisitos de Força, proficiência e tempos permanecem informativos nesta etapa.

A aplicação utiliza como padrão as regras oficiais de D&D 5e, tendo o Livro do Jogador disponibilizado no projeto como referência normativa. Não devem ser introduzidas adaptações próprias para atributos, proficiência, perícias, salvaguardas, pontos de vida, progressão de XP e níveis, combate, armaduras, magia, equipamentos ou outras mecânicas. Qualquer alteração futura dessas regras exige aprovação explícita e registro de decisão antes da implementação.

A única personalização aprovada é o multiplicador da capacidade de carga, por convenção de unidade da aplicação:

- Fórmula padrão: Força × 7,5 kg.
- Valor inicial do multiplicador: 7,5 kg por ponto de Força.
- Futuramente, o usuário poderá alterar o multiplicador nas configurações; essa preferência deverá ser persistida e restaurada, e a capacidade deverá ser recalculada quando a Força ou o multiplicador mudar.
- O limite para erguer, arrastar e puxar permanece independente e segue a regra do Livro do Jogador: Força × 15 kg.
- Alterar o multiplicador configurável afeta exclusivamente a capacidade de carga e não modifica nenhuma outra regra do jogo.

## 10. Convenções de interação e apresentação do inventário

### Modais não fecham por clique no fundo

Clique no overlay/fundo de um modal não deve fechá-lo. O usuário fecha o diálogo por uma ação explícita (por exemplo, Fechar ou Cancelar) ou pelo teclado quando o modal oferece esse comportamento. Isso evita perda acidental de edições e mantém um comportamento previsível entre categorias. Novos modais devem seguir esta convenção; ao alterar um modal existente, preservar seus controles explícitos de saída e o descarte seguro de alterações. O seletor e os detalhes/edição de Munições seguem a mesma regra.

### Precisão visual de peso de vestimentas

Pesos de vestimentas e acessórios são normalizados e exibidos com exatamente uma casa decimal em quilogramas, usando vírgula na apresentação local (por exemplo, `2,7 kg` e `0,0 kg`). A normalização visual não cria precisão adicional nem altera a regra de capacidade de carga.

### Catálogo de vestimentas sem efeitos de regra não implementados

Dados de bônus ou vantagens associados a um item só devem alterar cálculos quando a regra correspondente existir e estiver aprovada. Até lá, as seleções de vantagem em vestimentas são apenas dados de cadastro/apresentação e não concedem vantagem automaticamente em testes.

## 11. Catálogo próprio de munições e compatibilidade legada

Munições têm coleção canônica `municoes` e seção própria sob Armas. Cada lote conserva `id`, nome, quantidade individual, descrição e referência ao tipo do catálogo. Preço e peso descrevem o pacote; o peso carregado é calculado por `quantidade / quantidadePacote × pesoPacoteKg`, sem arredondar o valor usado no cálculo.

Durante a transição, a exportação também grava um espelho legado em `outros` com o mesmo ID e peso unitário. A importação nova migra registros com `outro_tipo = Municao`, remove duplicatas pelo ID e prefere `municoes` quando o lote aparece nos dois formatos. Para os quatro tipos conhecidos, o importador aplica tamanho e peso de pacote do catálogo; munição personalizada sem correspondência preserva a interpretação de peso unitário legada.

Os vínculos das armas continuam usando `arma_municao_id` como ID de instância. A munição é consumida uma peça por ataque concluído, acertando ou errando; ataques com lote ausente ou zerado são bloqueados antes da rolagem. O catálogo inicial contém apenas munição comum; campos preparados para itens mágicos não ativam modificadores.

### Hierarquia visual das categorias do inventário

As colunas do inventário servem apenas para organizar e posicionar grupos; não devem formar um quadro externo único envolvendo categorias diferentes. Cada categoria deve ter seu próprio painel independente (`inventario-categoria-box`), com cabeçalho, contador, lista de itens e ação de adicionar pertencentes àquela categoria.

Na primeira coluna, Armas e Munições são dois painéis irmãos, um após o outro. Munições fica abaixo de Armas, mas fora do painel de Armas. O mesmo princípio já é usado na coluna seguinte: Armaduras e Escudos têm painéis distintos; Vestimentas e acessórios também constitui seu próprio painel. Não aninhar uma categoria dentro do painel de outra, nem colocar um quadro externo adicional ao redor de várias categorias. A grade responsiva pode reposicionar as colunas, mas deve preservar essa separação e a hierarquia de cada painel.

Ao criar ou reorganizar categorias do inventário, usar Armaduras/Escudos como referência: grupos relacionados podem compartilhar a coluna, porém cada grupo mantém seu próprio cabeçalho, contagem, conteúdo e botão de adição. Para Armas/Munições, Munições deve permanecer visualmente separada mesmo quando estiver logo abaixo de Armas.

### Padrão visual do card de item do inventário

O card de Munição estabelece o padrão a seguir ao atualizar o quadro “Outros”, usando o card da Besta Leve como referência visual:

- A seção da categoria mantém sua própria moldura externa. Cada item mantém um único card arredondado dentro da seção; não remover nem duplicar essas duas camadas.
- O contorno, fundo e sombra do item pertencem ao contêiner do card. O botão clicável do título/conteúdo fica transparente e sem borda ou sombra próprias, para não criar um segundo quadrado dentro do card.
- Informações principais ficam agrupadas no card. A quantidade de munição é editável diretamente nele, sem ficar solta fora do contorno do item.
- O título nomeia o recipiente/conjunto (por exemplo, “Estojo de Virotes” ou “Aljava de Flechas”). Dentro do card, “Quantidade atual” usa um rótulo menor acima do valor editável e da unidade; raridade fica em tag na mesma linha. A capacidade máxima fica no rodapé junto ao valor e peso e também limita a quantidade editável.
- O cabeçalho mostra o nome e o indicador de abrir detalhes; valor e peso ficam alinhados no rodapé. Usar os ícones de moeda e balança e permitir quebra de linha sem transbordamento em telas estreitas.
- Não repetir em tags o tipo já definido pelo título da seção (por exemplo, não mostrar a tag “Munição” dentro de Munições). Manter tags que acrescentem informação, como raridade ou estado mágico.

Ao reformular os itens de “Outros”, reaproveitar essa hierarquia e apresentação, adaptando somente os dados e controles próprios de cada item. A moldura externa da categoria e o contorno único do item devem continuar visualmente distintos.

## 12. Padrões visuais de cards e modais do inventário

Os padrões abaixo consolidam as convenções aprovadas nas telas de Armas, Armaduras, Escudos, Vestimentas e Munições. Uma nova categoria deve reutilizar a estrutura e os estilos existentes antes de criar componentes visuais próprios; diferenças só devem existir para dados e ações específicas do tipo de item.

### Card compacto no inventário

- O card é um único contêiner arredondado, com fundo, contorno e sombra. O botão interno que abre os detalhes é transparente e sem moldura ou sombra próprias; não criar um segundo quadrado dentro do card.
- O título e o indicador de abertura ficam no topo. Dados principais (como dano ou CA), propriedades úteis e tags ocupam o corpo; moeda e peso ficam juntos no rodapé, com os ícones já usados no inventário.
- Tags devem ser curtas, consistentes e informativas: raridade e estados como Equipado, Item mágico, Sintonizado ou Sem proficiência quando aplicáveis. Não repetir a categoria que o cabeçalho da seção já informa. Esconder bônus nulo quando não acrescenta informação, como bônus de CA +0.
- Mostrar preço e peso quando esses dados fizerem parte do item. Usar o mesmo formato de moeda e quilogramas dos demais cards; permitir quebra em telas estreitas sem sobreposição ou rolagem horizontal.
- Quantidades que o usuário consulta ou altera com frequência podem ficar diretamente no card. Ao mudar a quantidade, persistir o valor no item e atualizar imediatamente todos os resumos e vínculos dependentes, preservando limites definidos pelo pacote.
- A moldura do grupo e o card são níveis distintos da hierarquia. Categorias relacionadas podem compartilhar uma coluna, mas cada categoria tem seu painel próprio e seus próprios controles.

### Modal de exibição

- O cabeçalho identifica o item com ícone e nome, mostra raridade e tags aplicáveis e mantém as ações no topo. O botão **Editar** leva o ícone de lápis; **Fechar** permanece explícito. **Equipar/Desequipar** fica junto ao título quando a categoria oferece essa ação.
- O corpo prioriza as informações necessárias para entender o item: dano/CA/quantidade, propriedades, preço e peso quando pertinentes e descrição. Blocos de descrição ou detalhes podem ter seu próprio acabamento leve, sem duplicar a moldura principal do modal.
- **Remover** fica no canto inferior direito do modal de exibição, com ícone de lixeira e estilo de ação destrutiva. Reutilizar a confirmação e a lógica de exclusão já existentes para manter índices equipados, peso e vínculos consistentes.
- O modal não fecha ao clicar no fundo. Fechamento ocorre por botão explícito ou comportamento de teclado existente; edição com alterações deve preservar a confirmação segura de descarte.

### Modal de cadastro e edição

- Diferenciar o formulário da prévia de catálogo: o formulário permite preencher/salvar; escolher um item de catálogo o adiciona ao inventário sem abrir automaticamente a edição, salvo se o fluxo da categoria pedir outra coisa.
- O cabeçalho mostra ícone, nome do fluxo (“Novo …”/“Editar …”) e estados relevantes do item. Campos têm rótulos visíveis, controles alinhados e grupos coerentes; em desktop podem usar duas colunas, empilhando em telas estreitas.
- Campos específicos de uma categoria aparecem apenas quando fazem sentido. Começar efeitos opcionais por valores neutros e não mostrá-los como bônus na exibição quando forem zero. Dados de efeitos que ainda não têm sistema de regra permanecem inertes.
- Ações de salvar e cancelar ficam juntas no rodapé, com Salvar como ação primária. Em edição, Excluir usa estilo destrutivo e confirmação. Não depender do clique no fundo para cancelar ou fechar.
- Usar os mesmos tokens de cores, tipografia, botões, tags, espaçamentos, limites de largura e comportamento responsivo dos modais de equipamento existentes. Formulários altos rolam verticalmente e deixam todas as ações alcançáveis; conteúdo não pode escapar da viewport.

### Seletor de catálogo

- O modal de seleção segue o padrão existente de pesquisa e filtragem: filtros e busca acima, lista de resultados de um lado e prévia detalhada do item selecionado do outro em telas largas; em telas estreitas, os blocos empilham e a lista mantém altura controlada.
- A prévia reutiliza as tags, a descrição, o preço/peso e a apresentação do modal de exibição quando possível. A ação de adicionar fica junto da prévia e deixa claro que o item será copiado para o inventário.
- Estados vazios, quantidade de resultados e falha de carregamento devem ter mensagens compreensíveis. Pesquisa, navegação por teclado e ações principais devem continuar acessíveis sem depender de ponteiro.

### Implementação de “Outros”

- “Outros” é um único painel. Seus itens de tipos diversos aparecem juntos e não são divididos visualmente em subcategorias. Os catálogos compartilhados ficam em JSONs próprios por família, ligados por `assets/data/itens/outros/registro.json`.
- As instâncias continuam na coleção legada `outros[]` e conservam os campos `outro_*` já usados pela ficha. Metadados `outro_catalogo_*` registram família e origem sem substituir campos legados; a ausência de peso ou valor permanece representada como vazia, não como um dado inventado.
- Cards têm um contorno externo único, com o botão interno transparente e sem moldura. Exibem nome, quantidade quando aplicável, tags de família e raridade, valor e peso. Poções/consumíveis têm quantidade editável no próprio card; nos demais itens a quantidade só aparece no título quando acima de 1 e é editada no modal.
- Catálogo, visualização e edição não fecham com clique no fundo. A seleção copia o item para o inventário sem abrir edição. Modais oferecem saída explícita; editar mostra Cancelar/Salvar e Remover com lixeira e confirmação no canto inferior direito.
- Proficiência relacionada a ferramentas/instrumentos e uso de instrumento como foco arcano são dados descritivos. Possuir/equipar esses itens não concede proficiência, bônus ou efeito de magia. O uso das mãos dos instrumentos em combate fica para uma futura mecânica específica.

### Reordenação manual dos itens

- Cards podem ser reorganizados por arraste dentro da própria categoria: Armas, Munições, Armaduras, Escudos, Vestimentas e acessórios ou Outros. Não é permitido mover um item para outra lista por arraste.
- A ordem visual dos cards é a ordem da coleção na ficha e deve continuar igual após salvar, exportar e importar. A implementação usa a ordem dos elementos no DOM, que já é a fonte usada pelos coletores das coleções.
- Reordenar cards não pode trocar quais itens estão equipados ou vinculados aos espaços de arma. Ao mudar a posição, a ficha remapeia os índices de equipamento para as mesmas instâncias de item.
- Campos editáveis diretamente no card, como quantidade de munição, não iniciam arraste. A indicação de arraste e o estado visual de destino devem ser discretos e seguir o padrão de `card-itens.css`.
- A validação automatizada cobre as seis listas, o limite de categoria e a preservação dos índices de equipamento. A interação real por ponteiro/toque e o round-trip visual em navegador continuam pendentes de validação manual.

### Cadastro manual condicionado ao tipo de “Outros”

- O fluxo de criação manual pergunta primeiro o tipo do item; em seguida apresenta apenas os campos pertinentes à família escolhida.
- Proficiência relacionada só é cadastrável para ferramentas/kits e instrumentos musicais. O campo “pode ser foco arcano” pertence aos instrumentos. Ao salvar um tipo que não suporta proficiência, limpar qualquer referência de proficiência incompatível.
- Esses metadados descrevem o item: possuir o item não concede proficiência, bônus, vantagem ou efeito de magia.
