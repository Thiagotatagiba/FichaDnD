---
name: interface-combate
description: Implementar HUD, abas e modais.
---

# Interface Combate

## Quando usar
E4.1 a E4.5 do plano `docs/codex/Plano_Geral_Detalhado_Implementacao_FichaDnD_2026-11-10.md`.

## Entradas obrigatórias
- `AGENTS.md` e `docs/codex/EXECUTION_STATE.md`.
- Auditoria e plano, nas versões incluídas neste pacote.
- Código atual e `git status --short`.

## Execução
1. Identificar etapa, achado e critérios de aceite.
2. Verificar estado do código e alterações preexistentes.
3. Preparar teste que falha antes da correção, quando viável.
4. Antes: Iniciativa +3 / Iniciar Combate. Durante: Posição 4º / Iniciativa: 14. Posição editável sem alterar iniciativa. Abas Arma/Magia/Poder/Testes; histórico separado; backdrop não fecha.
5. Rodar testes pertinentes, registrar comandos, resultados e falhas.
6. Revisar diff, compatibilidade e riscos; registrar estado.
7. Se gate concluído, solicitar aprovação antes de prosseguir.

## Saída esperada
G4 com validação desktop, celular, teclado e temas.

## Restrições
- Sem push, deploy, merge ou alteração destrutiva sem autorização.
- Não alterar lógica de expiração intencional.
- Preservar personalizações e JSONs originais.
- Não interferir em munições/poções sem contrato final aprovado.
