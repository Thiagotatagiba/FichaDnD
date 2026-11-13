---
name: preparar-linha-base
description: Preparar G0 e inventário antes de qualquer implementação.
---

# Preparar Linha Base

## Quando usar
P-01 a P-04 do plano `docs/codex/Plano_Geral_Detalhado_Implementacao_FichaDnD_2026-11-10.md`.

## Entradas obrigatórias
- `AGENTS.md` e `docs/codex/EXECUTION_STATE.md`.
- Auditoria e plano, nas versões incluídas neste pacote.
- Código atual e `git status --short`.

## Execução
1. Identificar etapa, achado e critérios de aceite.
2. Verificar estado do código e alterações preexistentes.
3. Preparar teste que falha antes da correção, quando viável.
4. git status --short; git log -1 --oneline; inventariar testes e docs; conferir JSONs em cópias; registrar versão e falhas iniciais.
5. Rodar testes pertinentes, registrar comandos, resultados e falhas.
6. Revisar diff, compatibilidade e riscos; registrar estado.
7. Se gate concluído, solicitar aprovação antes de prosseguir.

## Saída esperada
Relatório de baseline, fixtures protegidas, decisões e riscos.

## Restrições
- Sem push, deploy, merge ou alteração destrutiva sem autorização.
- Não alterar lógica de expiração intencional.
- Preservar personalizações e JSONs originais.
- Não interferir em munições/poções sem contrato final aprovado.
