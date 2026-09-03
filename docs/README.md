# Documentação do Projeto Ficha D&D

Este diretório reúne a documentação técnica e de arquitetura do sistema de ficha de personagem para D&D.

## Visão geral

O projeto é uma aplicação front-end estática, pensada para apoiar a criação, edição e gestão de fichas de personagem em ambiente web. Ele reúne interface, regras de jogo, persistência em JSON e interação com elementos GUI diretamente no navegador.

## Arquivos principais do repositório

- [../README.md](../README.md) — visão geral do projeto e instruções de uso
- [../ROADMAP.md](../ROADMAP.md) — evolução planejada do software
- [../DECISOES_DE_ARQUITETURA.md](../DECISOES_DE_ARQUITETURA.md) — decisões técnicas e de arquitetura
- [ARQUITETURA_SISTEMA.md](ARQUITETURA_SISTEMA.md) — descrição da arquitetura atual
- [CONTRIBUICAO.md](CONTRIBUICAO.md) — regras e boas práticas para colaboração
- [analise-arquitetura.md](analise-arquitetura.md) — análise inicial da arquitetura e módulos
- [BUG_REPORT.md](BUG_REPORT.md) — relatórios e correções observadas
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — plano de implementação
- [TODO.md](TODO.md) — backlog e pendências
- [TODO_MAGIA.md](TODO_MAGIA.md) — pendências e melhorias da área de magia
- [TODO_progress.md](TODO_progress.md) — acompanhamento do progresso

## Estrutura de funcionamento

- HTML e CSS definem a camada de interface
- JavaScript implementa regras de negócio e renderização
- Dados em JSON e arquivos JavaScript alimentam conteúdo de classes, raças e magias
- A ficha pode ser exportada/importada em JSON para persistência e reaproveitamento

## Observações importantes

O projeto está em evolução e ainda mantém forte acoplamento entre interface e lógica de negócio. A documentação foi criada para registrar o estado atual, mapear decisões e orientar a modularização progressiva do sistema.

## Próximos passos sugeridos

- separar regras de negócio da camada visual
- reduzir uso de estado global e funções globais
- criar validação de estruturas JSON de ficha
- melhorar a cobertura de testes e regressão
- documentar novos módulos conforme a arquitetura for evoluindo

