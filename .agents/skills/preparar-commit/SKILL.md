---
name: preparar-commit
description: Preparar e validar um checkpoint Git seletivo antes de um commit local autorizado.
---

# Preparar commit

## Quando usar

Antes de qualquer commit local no projeto FichaDnD.

## Entradas obrigatórias

- `AGENTS.md`, `ROADMAP.md`, `docs/TODO.md` e `docs/codex/EXECUTION_STATE.md`.
- Plano, skills e contratos aplicáveis à entrega que será registrada.
- Estado completo do Git, incluindo arquivos não rastreados e alterações já existentes.

## Procedimento

1. Registrar branch, HEAD, `git status --short`, diffs rastreados, arquivos não rastreados e `git diff --check` antes de editar.
2. Revisar o TODO para separar trabalho comprovadamente concluído de ideias e tarefas parciais; preservar ideias rascunhadas e não promovê-las sem aprovação.
3. Atualizar o Roadmap somente com resultados e status sustentados por evidências. Conferir consistência com o estado de execução.
4. Avaliar se decisões e procedimentos observados são reutilizáveis; atualizar `AGENTS.md` ou skills somente quando houver regra permanente, evitando duplicação.
5. Auditar cada diff e arquivo não rastreado por finalidade, autorização e relação com o checkpoint. Excluir temporários, JSONs originais protegidos, artefatos e arquivos de autoria/finalidade incerta. Se um arquivo necessário não puder ser classificado, parar antes do commit e explicar o bloqueio.
6. Preservar todas as alterações preexistentes. Nunca usar `git add .` como substituto de uma seleção revisada.
7. Executar a suíte de testes e verificações de sintaxe adequadas; executar `git diff --check` e validar contratos protegidos.
8. Conferir o diff staged completo, os nomes staged e a coerência entre TODO, Roadmap, skills e estado de execução.
9. Confirmar que existe autorização humana explícita para o commit. Fazer apenas o commit autorizado; nunca presumir que essa autorização permite push.
10. Após o commit, verificar hash, mensagem, `git status --short` e eventuais alterações criadas por hooks. Não emendar nem criar commits adicionais sem autorização.

## Restrições

- Não fazer push, merge, rebase destrutivo, reset, limpeza ou descarte como parte da preparação.
- Não alterar contratos, dados originais ou comportamento funcional apenas para facilitar um checkpoint.
- Uma validação não executada deve permanecer identificada como não executada.
