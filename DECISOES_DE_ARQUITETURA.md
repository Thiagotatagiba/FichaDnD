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

Clique no overlay/fundo de um modal não deve fechá-lo. O usuário fecha o diálogo por uma ação explícita (por exemplo, Fechar ou Cancelar) ou pelo teclado quando o modal oferece esse comportamento. Isso evita perda acidental de edições e mantém um comportamento previsível entre categorias. Novos modais devem seguir esta convenção; ao alterar um modal existente, preservar seus controles explícitos de saída e o descarte seguro de alterações.

### Precisão visual de peso de vestimentas

Pesos de vestimentas e acessórios são normalizados e exibidos com exatamente uma casa decimal em quilogramas, usando vírgula na apresentação local (por exemplo, `2,7 kg` e `0,0 kg`). A normalização visual não cria precisão adicional nem altera a regra de capacidade de carga.

### Catálogo de vestimentas sem efeitos de regra não implementados

Dados de bônus ou vantagens associados a um item só devem alterar cálculos quando a regra correspondente existir e estiver aprovada. Até lá, as seleções de vantagem em vestimentas são apenas dados de cadastro/apresentação e não concedem vantagem automaticamente em testes.
