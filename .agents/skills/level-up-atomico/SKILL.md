---
name: level-up-atomico
description: Implementar evolução sem mutações parciais.
---

# Level Up Atomico

## Quando usar
E5.1 a E5.5 do plano `docs/codex/Plano_Geral_Detalhado_Implementacao_FichaDnD_2026-11-10.md`.

## Entradas obrigatórias
- `AGENTS.md` e `docs/codex/EXECUTION_STATE.md`.
- Auditoria e plano, nas versões incluídas neste pacote.
- Código atual e `git status --short`.

## Execução
1. Identificar etapa, achado e critérios de aceite.
2. Verificar estado do código e alterações preexistentes.
3. Preparar teste que falha antes da correção, quando viável.
4. Rascunho separado; confirmar atômico; cancelar não altera nível/XP/PV; características por nível exato e seleção; subclasse no desbloqueio; sem inventar catálogo.
5. Rodar testes pertinentes, registrar comandos, resultados e falhas.
6. Revisar diff, compatibilidade e riscos; registrar estado.
7. Se gate concluído, solicitar aprovação antes de prosseguir.

## Saída esperada
G5 com testes de cancelamento e progressão múltipla.

## Restrições
- Sem push, deploy, merge ou alteração destrutiva sem autorização.
- Não alterar lógica de expiração intencional.
- Preservar personalizações e JSONs originais.
- Não interferir em munições/poções sem contrato final aprovado.
