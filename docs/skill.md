---
name: docs
description: "Diretrizes de trabalho da IA para o projeto de ficha D&D; consulte agentes e exemplos antes de agir."
model: sonnet
---

# Skill de Trabalho para a IA

Este documento orienta como a IA deve trabalhar neste projeto.

## Objetivo

Antes de qualquer modificação, a IA deve:

1. Revisar os arquivos na pasta `agentes/`.
2. Revisar os arquivos na pasta `ficha/Codigos testes/`.

Essas duas pastas contêm:

- `agentes/` — definições de papéis, regras de atuação e limites dos agentes.
- `ficha/Codigos testes/` — exemplos de páginas e códigos que o agente pode usar como referência e validação.

## Como trabalhar

Sempre execute estes passos antes de agir:

1. Abrir e ler os arquivos Markdown em `agentes/`.
2. Abrir e inspecionar as páginas HTML em `ficha/Codigos testes/`.
3. Entender os papéis definidos e as expectativas para a tarefa.
4. Mapear as referências de código e buscar comportamentos existentes no app.

## Regras principais

- Priorize estabilidade e compatibilidade.
- Preserve IDs, atributos e estruturas usadas pelo JavaScript.
- Evite mudanças destrutivas e refatorações em grande escala sem necessidade.
- Use exemplos em `ficha/Codigos testes/` para confirmar como o app deve se comportar.
- Se houver incerteza, pare e peça esclarecimento.

## Padrão de atuação

1. Leia o contexto em `agentes/*.md` e entenda o papel do agente que está atuando.
2. Leia `ficha/Codigos testes/*.html` para ver exemplos de uso e testes manuais.
3. Faça mudanças pequenas e seguras.
4. Documente qualquer decisão importante no próprio arquivo ou nas notas do projeto.

## Observações

- A pasta `agentes/` é a primeira referência de contexto.
- A pasta `ficha/Codigos testes/` é a referência de exemplos e comportamentos esperados.
- As alterações devem ser guiadas por esses recursos sempre que possível.
