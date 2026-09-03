# Roadmap do Projeto Ficha D&D

## Objetivo

Acompanhar a evolução do sistema de ficha de personagem para manter a aplicação funcional, organizada e pronta para crescimento sem perder compatibilidade com o uso atual.

## Fase 1 — Estabilização e documentação

### Objetivos

- Registrar arquitetura atual do sistema
- Documentar fluxos de carga, persistência e UI
- Definir padrões de contribuição e manutenção
- Separar documentação técnica da documentação funcional

### Entregáveis

- README principal
- Documentos de arquitetura e decisões técnicas
- Guia de contribuição
- Checklist de manutenção

## Fase 2 — Organização estrutural

### Objetivos

- Reduzir acoplamento com o DOM
- Separar regras de negócio da UI
- Reorganizar módulos por responsabilidade
- Normalizar nomes e convenções de estado

### Entregáveis

- Extração de módulos de atributos, combate e gerenciamento de ficha
- Padronização de inicialização de módulos
- Estrutura de serviços utilitários e modelos de dados

## Fase 3 — Qualidade e confiabilidade

### Objetivos

- Criar validações de consistência dos dados da ficha
- Cobrir cenários críticos como importação/exportação e alteração de classe
- Detectar regressões em regras de magia, vida e dano
- Revisar compatibilidade entre fichas antigas e novas

### Entregáveis

- Script de validação de JSON de personagem
- Testes de regressão para importação, persistência e cálculo
- Mecanismos de segurança e sanitização de dados

## Fase 4 — Expansão de funcionalidade

### Objetivos

- Melhorar suporte de regras específicas
- Expandir sistema de magia, equipamentos e talentos
- Melhorar experiência de edição de ficha e usabilidade
- Permitir melhor gestão de campanhas e personagens por perfil

### Possíveis evoluções

- Sistema de campanhas e múltiplos personagens
- Exportação em formatos mais robustos
- Histórico de aventuras e sessões
- Melhor suporte a regras opcionais e customizações do mestre

## Fase 5 — Modularização e arquitetura orientada a serviço

### Objetivos

- Evoluir de monólito front-end para prática modular
- Introduzir domínios de negócio independentes
- Criar camada de dados e estado mais previsível

### Estrutura alvo

```text
js/
  app/
  core/
  domain/
  services/
  ui/
  data/
  integrations/
```

## Critérios de sucesso

- A ficha continua estável para uso diário
- O código torna-se mais legível e sustentável
- É possível evoluir sem quebrar objetos e regras existentes
- A importação/exportação continua funcionando com compatibilidade
- Novos recursos entram por módulos claros e bem testados

## Observações

Este roadmap considera o projeto como uma aplicação estática em evolução, com foco na clareza de arquitetura e na melhoria incremental. A refatoração deve priorizar compatibilidade e risco baixo antes de introduzir novos frameworks ou estruturas complexas.
