# Ficha D&D

Ficha D&D é uma aplicação web de suporte para personagens de Dungeons & Dragons 5e. O projeto foi concebido para funcionar como uma ficha digital interativa, com atributos, perícias, ataques, dano, magia, inventário, nível, raça, classe, salvaguardas e exportação/importação em JSON.

## Visão geral

A aplicação roda diretamente no navegador, sem necessidade de backend, e foi pensada para uso rápido em ambientes locais ou como base para evoluções futuras. O sistema centraliza a interface em HTML/CSS/JavaScript e utiliza arquivos de dados em JSON para alimentar classes, raças, magias e equipamentos.

## Principais características

- Criação e edição de personagens
- Cálculo de atributos e bônus de proficiência
- Sistema de combate com ataques, dano e iniciativa
- Gestão de vida, magia, itens e equipamentos
- Importação/exportação de fichas em JSON
- Persistência de dados por arquivo ou integração com ambiente externo
- Visual temático de pergaminho medieval e layout em abas/modais

## Estrutura relevante do projeto

- `index.html` — página inicial de entrada
- `ficha/Ficha_DnD_-_Tatagiba_1.0.html` — ficha principal do personagem
- `js/` — código JavaScript principal e módulos
- `js/core/` — utilidades e persistência central
- `js/modules/` — módulos de combate, equipamentos, magia, talentos, importação e UI
- `js/data/` — classes, raças, sub-classes, magias e equipamentos
- `css/` — estilos e responsividade
- `assets/` — ícones, imagens, fontes e recursos visuais
- `ficha/Personagens Ficha/` — exemplos de personagens em JSON
- `docs/` — documentação técnica e de arquitetura

## Como executar

### Opção 1: abrir diretamente no navegador

Abra o arquivo `index.html` ou `ficha/Ficha_DnD_-_Tatagiba_1.0.html` em um navegador moderno.

### Opção 2: servir localmente

```bash
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000/
```

## Arquitetura de alto nível

O projeto está em uma arquitetura web estática, com forte acoplamento ao DOM e uso de estado global em escopo de janela. Em outras palavras, é um sistema monolítico front-end com separação funcional por arquivos e blocos de script, em vez de um padrão MVC ou modular completo.

### Padrões observados

- HTML como camada de apresentação
- JavaScript para regras de negócio e UI
- Dados em JSON para regras e fichas
- Estado compartilhado via objetos globais e elementos do DOM
- Persistência por exportação/importação de ficheiros JSON

## Documentação adicional

- [docs/README.md](docs/README.md) — visão geral da documentação
- [docs/ARQUITETURA_SISTEMA.md](docs/ARQUITETURA_SISTEMA.md) — arquitetura do sistema
- [docs/DECISOES_DE_ARQUITETURA.md](docs/DECISOES_DE_ARQUITETURA.md) — decisões tomadas no projeto
- [ROADMAP.md](ROADMAP.md) — evolução planejada do sistema
- [docs/CONTRIBUICAO.md](docs/CONTRIBUICAO.md) — guia de contribuição

## Status do projeto

O projeto já possui uma ficha funcional com grande variedade de recursos, mas ainda mantém características de um código fortemente acoplado à interface. O foco principal de evolução é modularização progressiva, validação de regras e organização de arquitetura.

## Licença

Este repositório não informa uma licença explícita no momento. Verifique com o mantenedor antes de reutilizar em produção ou redistribuir publicamente.
