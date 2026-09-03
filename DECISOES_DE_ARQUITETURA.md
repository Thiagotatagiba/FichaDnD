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
