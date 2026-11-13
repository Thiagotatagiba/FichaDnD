---
name: regras-combate-2014
description: Implementar motor de regras de combate 2014.
---

# Regras Combate 2014

## Quando usar
E2.1 a E2.6 do plano `docs/codex/Plano_Geral_Detalhado_Implementacao_FichaDnD_2026-11-10.md`.

## Entradas obrigatórias
- `AGENTS.md` e `docs/codex/EXECUTION_STATE.md`.
- Auditoria e plano, nas versões incluídas neste pacote.
- Código atual e `git status --short`.

## Execução
1. Identificar etapa, achado e critérios de aceite.
2. Verificar estado do código e alterações preexistentes.
3. Preparar teste que falha antes da correção, quando viável.
4. Extrair funções puras; PV temporários primeiro; cura limitada a PV máximo; dano tipado; concentração obrigatória; fontes de vantagem/desvantagem com cancelamento.
5. Rodar testes pertinentes, registrar comandos, resultados e falhas.
6. Revisar diff, compatibilidade e riscos; registrar estado.
7. Se gate concluído, solicitar aprovação antes de prosseguir.

## Saída esperada
G2 com matriz de testes e fontes normativas.

## Restrições
- Sem push, deploy, merge ou alteração destrutiva sem autorização.
- Não alterar lógica de expiração intencional.
- Preservar personalizações e JSONs originais.
- Não interferir em munições/poções sem contrato final aprovado.
