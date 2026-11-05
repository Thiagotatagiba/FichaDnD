# Proposta — catálogo de itens e reformulação de armaduras

Data: 2026-11-05. Estado: proposta aprovada pelo usuário e implementada. O texto de desenho abaixo registra a proposta original; o resultado e os limites estão ao final.

## Objetivo e escopo

Transformar o cadastro manual de itens em um fluxo com opções prontas, começando pelas 12 armaduras básicas de D&D 5e 2014. O catálogo será um arquivo JSON estático, sem servidor ou banco SQL. Armas, escudos e outros itens poderão seguir o mesmo padrão em etapas posteriores.

A primeira entrega proposta reúne catálogo, seleção, detalhes, criação manual, edição, integração com equipamento e persistência. Escudos continuam na seção atual; não são uma 13ª armadura vestível. Itens mágicos e novos efeitos ficam para uma próxima etapa.

Referência de conteúdo: [Roll20 — Armor](https://roll20.net/compendium/dnd5e/Armor), página original correspondente ao link traduzido enviado pelo usuário. Os nomes em português são rótulos propostos; manter o nome original ajuda na busca e na conferência. A edição 2014 evita misturar regras de revisões diferentes.

## O que existe hoje

- [equipamentos.js](../../js/modules/equipamentos.js): o cadastro de armadura clona um cartão vazio. Já há campos de CA base, contribuição de Destreza, Força, tipo, peso e furtividade; parte da integração com combate já existe.
- [magias.js](../../js/modules/magias.js): seleção com busca, filtros, lista, detalhes e opção de criação manual; catálogo carregado por fetch com arquivos por nível.
- [importacao.js](../../js/modules/importacao.js): a restauração chama diretamente a função que cria o cartão de armadura.
- [storage.js](../../js/core/storage.js): persiste a coleção e o índice da armadura equipada.

Ponto crítico: alterar a função de criação para sempre abrir o seletor quebraria a importação. Separar a abertura do seletor da criação programática do cartão, mantendo esta última disponível para restauração.

## Experiência proposta

1. O botão “Adicionar armadura” abre um modal no padrão visual das magias.
2. A busca encontra nomes em português e inglês, sem depender de acentos.
3. Filtros: Todas / Leves / Médias / Pesadas e “Somente com proficiência”. A lista começa com todas; falta de proficiência informa consequências, sem impedir o cadastro.
4. A lista mostra nome, categoria, fórmula de CA e peso em kg.
5. Os detalhes mostram CA calculada com a Destreza atual, custo, peso, Força mínima, furtividade e tempo para vestir/retirar.
6. “Adicionar ao inventário” cria uma cópia editável. Adicionar não equipa automaticamente nem desconta moedas.
7. “Criar armadura” mantém o cadastro manual, inclusive durante falha no carregamento do catálogo.

Exemplo: escolher “Peitoral” preenche categoria Média, CA base 14, DES máxima +2, peso 10 kg e custo 400 po. Com DES +3, a prévia exibe CA 16. Depois de adicionar, o jogador pode personalizar nome e demais campos.

A lista do inventário passa a priorizar um resumo: nome, categoria, CA, kg e estado de equipamento. Os detalhes e a edição ficam acessíveis ao abrir o item. Manter um indicador claro de proficiência e de alterações locais em relação ao catálogo. Ações: visualizar, editar, equipar/desequipar e remover. Permitir várias cópias da mesma armadura.

Modal adaptado a celular, navegação por teclado, foco restaurado ao fechar, estados de carregamento/erro/lista vazia e confirmação antes de descartar edição. Textos do catálogo e da ficha devem ser renderizados como texto.

## Dados: catálogo separado do personagem

O arquivo [armaduras.catalogo.exemplo.json](./armaduras.catalogo.exemplo.json) contém a proposta completa das 12 entradas. Ele é material de revisão e não é carregado pela aplicação.

Destino sugerido após aprovação: assets/data/itens/armaduras.json. Um único arquivo é suficiente para este volume; não copiar a divisão por nível das magias.

Contrato proposto:

| Campo | Significado |
| --- | --- |
| versaoSchema / versaoCatalogo | Evolução do formato e do conteúdo, respectivamente |
| sistema | Identifica dnd5e-2014 |
| id | Identificador estável, independente do nome exibido |
| tipo / categoria | armadura; leve, media ou pesada |
| nome / nomeOriginal | Exibição em português e busca pelo nome inglês |
| custo | Número e moeda, separados |
| pesoKg | Número em kg; nunca texto com unidade |
| ca.base | CA antes da contribuição de Destreza |
| ca.adicionaDestreza | Se o modificador é aplicado |
| ca.limiteBonusDestreza | null = sem teto; 2 = teto +2; 0 com adicionaDestreza=false = sem DES |
| forcaMinima | null para ausência de requisito |
| desvantagemFurtividade | Booleano |
| vestirMinutos / retirarMinutos | Duração informativa por categoria |

Descrições curtas em português podem ser adicionadas na implementação, redigidas para a ficha. Não guardar fórmulas executáveis ou depender de interpretar texto para calcular CA.

Cada exemplar do personagem terá um identificador próprio, referência opcional ao catálogo e uma cópia dos valores efetivos. Proficiência, nome personalizado, observações e estado equipado pertencem ao personagem, não ao catálogo. Duas cotas de malha devem ter identificadores de exemplar diferentes.

Atualizar o catálogo não altera exemplares já salvos. Um eventual “Restaurar padrão do catálogo” deve ser uma ação explícita com confirmação, preservando observações e identidade do exemplar.

## Quilogramas

Toda interface, cálculo de carga e ficha exportada deve usar kg. O JSON armazena números com ponto decimal; a interface brasileira apresenta vírgula, por exemplo 6,5 kg.

Para esta proposta, adota-se a convenção de mesa de 0,5 kg por libra, compatível com a escala de carga métrica usada no projeto. Isso não é a conversão física exata de 0,45359237 kg. Conferir os valores com a tabela em português do Livro do Jogador antes de integrar o catálogo; nenhum PDF do livro foi localizado entre os arquivos versionados consultados.

Pesos propostos: Acolchoada 4 kg; Couro 5 kg; Couro batido 6,5 kg; Gibão de peles 6 kg; Camisão de malha 10 kg; Brunea 22,5 kg; Peitoral 10 kg; Meia armadura 20 kg; Cota de anéis 20 kg; Cota de malha 27,5 kg; Cota de talas 30 kg; Placas 32,5 kg.

Não converter pesos de fichas antigas: o sistema já trabalha com kg. A convenção se aplica à preparação do catálogo, uma única vez.

## Regras e integração

- Leves aplicam o modificador completo de DES; médias limitam o bônus a +2 e preservam modificadores negativos; pesadas ignoram DES.
- O requisito de Força não impede vestir. A insuficiência pode reduzir deslocamento em 3 m, observadas exceções de raça/características. Primeiro mostrar o aviso; automatizar deslocamento apenas com integração e testes próprios.
- Desvantagem em Furtividade deve ser visível. Falta de proficiência exige aviso com suas consequências de regras; não inventar uma penalidade de CA.
- Apenas uma armadura vestida por vez. Escudo e outros bônus continuam na integração existente; não somar uma segunda CA base.
- Não confundir o campo legado armadura_bonus, que representa contribuição de DES, com um futuro bônus mágico +1/+2/+3.
- Vestir e retirar aparecem como informação nesta etapa, sem temporizador ou consumo automático de ações.

CA base proposta: leves 11/11/12; médias 12/13/14/14/15; pesadas 14/16/17/18, seguindo a ordem do catálogo. Custos e demais propriedades estão no JSON de exemplo.

## Compatibilidade e organização

Primeira implementação deve manter armaduras e armaduraEquipadaIndice no formato atual da ficha, com um adaptador do catálogo para os campos legados: nome, tipo, CA, DES, Força, furtividade, peso e custo, conforme os controles existentes. A conversão de categoria deve usar os valores reais dos selects, sem assumir que coincidem com os identificadores do catálogo.

Metadados novos, como catalogoId e instanciaId, precisam ser explicitamente coletados e restaurados; adicionar apenas atributos ao DOM não garante persistência. Manter os valores completos exportados, permitindo importar sem acesso ao catálogo.

Uma futura migração para equipamento por instanciaId deve ler os índices legados e tratar remoção/reordenação; não mudar todo o inventário para um formato novo nesta primeira etapa. Não associar itens antigos ao catálogo apenas por igualdade de nome.

Separação sugerida:
- Carregador e validador do catálogo com cache e tratamento de erro.
- Adaptador entre entrada do catálogo e campos atuais.
- Modal de seleção e detalhes.
- Integração com inventário/equipamento existente.

Reutilizar estilos e padrões de interação das magias, evitando copiar suas regras de classe, nível e preparo. Validar IDs únicos, números finitos não negativos, enums, tipos e coerência entre categoria e DES. Não introduzir dependência de backend. Confirmar execução via servidor HTTP; abertura direta por file:// pode restringir fetch, como no catálogo de magias.

## Etapas e critérios de aceite

1. Conferir a convenção de kg e os nomes em português; fechar o contrato e validar o catálogo.
2. Implementar seleção, busca, filtros, detalhes e criação manual, preservando criação programática na importação.
3. Preencher cartões e aplicar a apresentação compacta, mantendo edição e equipamento.
4. Persistir referências e exemplares; verificar compatibilidade e regressões.

Aceite funcional:
- As 12 opções aparecem; busca em ambos os idiomas e filtros funcionam.
- Seleção preenche todos os campos e permite personalização sem alterar o catálogo.
- CA correta com DES -1, +0 e +4; média limita apenas o bônus positivo; pesada ignora DES negativo.
- Peso em kg aparece e soma corretamente, inclusive 6,5 kg.
- Adicionar não equipa nem cobra moedas; equipar substitui a armadura anterior.
- Duas cópias permanecem independentes; remover uma não equipa outra por engano.
- Exportar/importar preserva campos, personalizações, proficiência e equipamento; ficha antiga continua funcionando.
- Importar não abre o modal; falha de rede permite criação manual.
- Fluxo utilizável no celular e por teclado.

## Implementação e validação — 2026-11-05

O usuário autorizou a execução da proposta. O catálogo ativo está em [armaduras.json](../../assets/data/itens/armaduras.json); o JSON de exemplo permanece como registro do desenho. Os pesos usam a convenção de mesa aprovada com a proposta, sem converter valores das fichas existentes.

### Implementado

- [armaduras-catalogo.js](../../js/modules/armaduras-catalogo.js): validação, carregamento sob demanda com cache e nova tentativa, busca em português/inglês sem acentos, filtros de categoria/proficiência, detalhes, criação manual e restauração explícita do padrão.
- [armaduras.css](../../css/armaduras.css) e [ficha principal](../../ficha/Ficha_DnD_-_Tatagiba_1.0.html): seletor no padrão das magias, controles para teclado e layout estreito, resumo e ações nos cartões. Fichas novas começam sem cartão vazio de armadura.
- [equipamentos.js](../../js/modules/equipamentos.js) e [racas-subclasses.js](../../js/data/racas-subclasses.js): cópias independentes, equipar/desequipar pelo cartão, informações de CA/kg/Força/tempos e correção do índice ao remover itens. Apenas uma armadura é equipada.
- [importacao.js](../../js/modules/importacao.js): restaura identidade, referência ao catálogo e tempos opcionais; gera identidade para legado ou IDs repetidos. Valores efetivos continuam completos nos campos legados; importar não carrega o catálogo nem abre o seletor.
- [storage.js](../../js/core/storage.js): exclui filtros transitórios do seletor da coleta da ficha. Descrição e propriedades mágicas são preservadas ao restaurar o padrão; preço e nome voltam ao catálogo.

### Evidências

- Suíte Node: 18 testes aprovados, incluindo 5 testes novos de catálogo, validação, busca, CA e carregamento, mais 13 regressões de magia. Comando: node --test tests/armaduras-catalogo.test.cjs tests/magias-efeitos.test.cjs. O primeiro executor foi bloqueado pelo sandbox (spawn EPERM); a repetição autorizada passou.
- Navegador servido por HTTP: seletor com 12 opções; busca por Studded Leather; preenchimento de Couro batido com 6,5 kg; cópias independentes; equipar; exclusão anterior preservando o exemplar e exclusão da equipada limpando a seleção.
- Exportação pela função real salvarFicha, com captura do Blob de teste sem download nativo, seguida de carregarFicha: identidade, referência, nome personalizado e equipamento preservados. Dados legados sem metadados foram importados, com peso de 6,5 kg preservado e sem abrir o seletor.
- Criação manual manteve edição aberta e foco no nome; Tab/Shift+Tab circularam dentro do modal e Escape fechou; modal coube em viewport de 390 × 844. Falha de fetch simulada exibiu criação manual e nova tentativa; a repetição carregou as 12 opções.
- Restauração do catálogo preservou descrição, identidade e marcação mágica. Após novo ciclo de salvar/importar, a inspeção dos dados confirmou descrição, propriedade mágica e tempos de 10/5 minutos para Placas.
- Verificação de sintaxe dos JavaScripts alterados e git diff --check executados sem erros.

### Limites e continuidade

Requisitos de Força e falta de proficiência são avisos; não há automação nova de penalidades, deslocamento ou tempo de vestir. O indicador “Personalizada” compara com o catálogo quando ele está carregado. O catálogo requer HTTP para carregamento confiável; falha de fetch mantém criação manual.

A conferência com a edição física em português não foi executada porque o livro não foi localizado nos arquivos consultados. Foi usada a referência Roll20 2014 indicada na proposta. A verificação móvel foi feita em viewport de navegador; aparelhos físicos e leitores de tela não foram testados. O download nativo não foi repetido; o Blob efetivamente gerado pelo salvamento foi inspecionado. Armas, escudos, itens mágicos de catálogo e outros itens permanecem para propostas posteriores.

## Revisão visual solicitada pelo usuário — 2026-11-05

Esta revisão substitui a apresentação inicial de armaduras no inventário. Cada exemplar agora aparece como um botão compacto com nome, categoria, CA, peso e indicação de equipada, utilizando o estilo da lista de magias. Os controles legados continuam no cartão como armazenamento compatível, mas ficam ocultos. Clicar abre um modal de visualização; editar, equipar/desequipar, restaurar e excluir ficam dentro desse modal.

A edição usa controles separados dos valores salvos. Salvar aplica os dados ao exemplar; cancelar não altera a origem; fechar com alterações solicita confirmação de descarte. Os controles transitórios dos dois modais são excluídos da coleta da ficha.

O catálogo agora usa o mesmo painel de detalhes das armaduras do inventário: título e botão de adicionar à direita, categoria em etiqueta, propriedades em grade, descrição e avisos de regras recolhíveis. A versão de conteúdo passou para 2, mantendo o esquema 1.

As 12 descrições são resumos curtos em português pesquisados nas [regras básicas oficiais de 2014 do D&D Beyond](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/equipment#ArmorandShields). A fonte foi registrada no catálogo. Exemplares novos recebem sua descrição; descrições personalizadas existentes são preservadas. Exemplares antigos vinculados ao catálogo podem mostrar a descrição da base quando o seu campo estiver vazio; não há associação automática por nome.

### Validação desta revisão

- 18 testes Node aprovados, com verificação adicional de descrição individual para as 12 entradas e rejeição de descrição vazia.
- Inspeção de capturas reais do catálogo em desktop, do cartão compacto e do seletor em largura de 390 px; painel sem transbordamento horizontal e botão junto ao título.
- Fluxos executados pelos handlers reais no navegador em iframe isolado: adicionar, abrir detalhes, equipar, editar e salvar nome/peso/descrição; negar descarte e manter edição; cancelar e preservar valores; criar manualmente e excluir pelo modal.
- Exportação pelo Blob de salvarFicha e reimportação preservaram descrição personalizada, identidade e armadura equipada; controles transitórios não foram exportados.
- Tab e Shift+Tab circularam pelo modal e Escape fechou. A ficha de Waldo aberta pelo usuário foi preservada; a área temporária de validação foi removida ao final.
- Sintaxe JavaScript e git diff --check sem erros. Sem validação em dispositivo físico ou leitor de tela.

