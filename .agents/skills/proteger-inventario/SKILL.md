---
name: proteger-inventario
description: Isolar munições e poções enquanto os contratos mudam.
---

# Proteger Inventario

## Quando usar
Seção 10 do plano do plano `docs/codex/Plano_Geral_Detalhado_Implementacao_FichaDnD_2026-11-10.md`.

## Entradas obrigatórias
- `AGENTS.md` e `docs/codex/EXECUTION_STATE.md`.
- Auditoria e plano, nas versões incluídas neste pacote.
- Código atual e `git status --short`.

## Execução
1. Identificar etapa, achado e critérios de aceite.
2. Verificar estado do código e alterações preexistentes.
3. Preparar teste que falha antes da correção, quando viável.
4. Detectar mudanças atuais; não migrar esquemas; usar interfaces adaptadoras isoladas; esperar aprovação de contrato; testes de quantidade zero e não duplicação somente após estabilização.
5. Rodar testes pertinentes, registrar comandos, resultados e falhas.
6. Revisar diff, compatibilidade e riscos; registrar estado.
7. Se gate concluído, solicitar aprovação antes de prosseguir.

## Saída esperada
Pendências e pontos de integração documentados.

## Restrições
- Sem push, deploy, merge ou alteração destrutiva sem autorização.
- Não alterar lógica de expiração intencional.
- Preservar personalizações e JSONs originais.
- Não interferir em munições/poções sem contrato final aprovado.
