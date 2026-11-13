# Pacote de coordenação Codex — FichaDnD

## Conteúdo
- `AGENTS.md`: instruções gerais reconhecíveis pelo Codex em repositórios.
- `.agents/skills/*/SKILL.md`: nove skills com instruções operacionais.
- `agents/*.md`: oito perfis de especialização; são **documentação de papéis**, não configuração garantida de subagentes nativos.
- `docs/codex/`: auditoria, plano e registro persistente de execução.
- `PROMPT_INICIAL.md`: comando para iniciar a sessão.

## Instalação no VS Code
1. Abra a raiz do repositório `FichaDnD` no VS Code.
2. Faça backup/commit das alterações existentes **antes** de copiar arquivos.
3. Extraia o ZIP na raiz do repositório, preservando pastas e nomes; revise conflitos antes de sobrescrever qualquer arquivo, especialmente `AGENTS.md` ou `.agents/` já existentes.
4. Abra uma nova sessão do Codex na raiz do repositório, para que as instruções sejam carregadas.
5. Entregue `PROMPT_INICIAL.md` ao agente e autorize explicitamente o escopo desejado (primeiro G0, depois cada gate).
6. Verifique que o Codex consegue ler `AGENTS.md`, o plano e `EXECUTION_STATE.md`.
7. Faça commits pequenos e revise cada gate antes de permitir o próximo.

## Sobre autonomia
O pacote permite execução continuada de tarefas **já autorizadas**, mas não concede permissões de ferramenta, não cria agentes nativos automaticamente e não substitui a confirmação humana nos gates. O suporte e o formato exato de delegação de subagentes dependem da versão do Codex instalada. Os perfis funcionam mesmo sem delegação nativa.

## Segurança
Não instalar dependências nem alterar JSONs de personagens originais apenas para testar. Não publicar alterações sem aprovação. Se a pasta `.agents/skills` não for reconhecida automaticamente pela versão do Codex, instruir o agente a abrir manualmente o `SKILL.md` correspondente; não presumir ativação automática.
