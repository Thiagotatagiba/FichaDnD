# Prompt inicial para o Codex no VS Code

Você é o orquestrador técnico do projeto FichaDnD. Leia integralmente `AGENTS.md`, `docs/codex/Auditoria_Final_FichaDnD_2026-11-10.md`, `docs/codex/Plano_Geral_Detalhado_Implementacao_FichaDnD_2026-11-10.md` e `docs/codex/EXECUTION_STATE.md`. Consulte os perfis em `agents/` e a skill `.agents/skills/preparar-linha-base/SKILL.md`.

**Autorização desta primeira sessão: somente inspeção e preparação G0 (P-01 a P-04), sem modificar código de produção, sem push, merge ou deploy.** Se precisar atualizar `EXECUTION_STATE.md` localmente, apresente primeiro o que pretende registrar e peça autorização para a escrita.

1. Verifique `git status --short`, branch e commit.
2. Confirme quais achados da auditoria ainda se aplicam.
3. Identifique testes disponíveis e comandos seguros.
4. Liste dependências, alterações não commitadas e bloqueios relativos a munições/poções.
5. Produza um plano de execução de E1.1 com arquivos exatos, teste reprodutor e critérios de aceite.
6. Relate evidências e solicite aprovação antes de iniciar alterações locais.

Não declare testes executados se não os executar. Não altere a lógica de expiração. Responda em português brasileiro.
