# Guia de Contribuição

## Como contribuir

Contribuições são bem-vindas para melhorias de regra, correções de bug, organização de código e documentação. Como o projeto é uma aplicação web em evolução, o ideal é manter mudanças simples, bem descritas e compatíveis com a estrutura atual.

## Ideias e aprovação de tarefas

1. Registre em `TODO.md` (neste diretório) ideias ainda não avaliadas, sem tratá-las como compromisso de execução.
2. Ao revisá-las, confira relevância e viabilidade diante do código atual, do `../ROADMAP.md` e dos registros técnicos/bugs pertinentes.
3. Quando uma ideia for aprovada para execução, retire-a do banco e registre a tarefa no `../ROADMAP.md`, com estado e critérios adequados. O Roadmap é a única fila oficial de tarefas planejadas ou em andamento.
4. Se a ideia for descartada, remova-a do banco; preserve o descarte somente quando houver motivo histórico útil.
5. Registre bugs confirmados em `BUG_REPORT.md` e decisões permanentes em `../DECISOES_DE_ARQUITETURA.md` ou documentação técnica pertinente.
6. Não duplique tarefas ativas no banco de ideias, em planos históricos ou em relatórios de bugs.

## Fluxo recomendado

### Início da tarefa

1. Consulte `../ROADMAP.md` e os registros específicos pertinentes (por exemplo, `BUG_REPORT.md` ou listas de ideias) antes de propor alterações.
2. Confira o estado real do repositório e investigue o código existente, identificando o menor escopo necessário. Não confie exclusivamente em anotações antigas.

### Implementação e validação

1. Trabalhe em etapas pequenas e verificáveis; evite refatorações amplas quando uma correção localizada for suficiente.
2. Preserve regras de D&D, estruturas de dados, IDs, atributos HTML e compatibilidade com fichas existentes, salvo necessidade demonstrada.
3. Diferencie **Investigado**, **Implementado** e **Validado**. Código escrito não significa validação concluída.
4. Execute as verificações pertinentes e disponíveis. Registre apenas testes realmente executados, seus resultados e limitações; se não puder testar, explique o motivo e o próximo passo recomendado.

### Encerramento obrigatório

1. Revise as alterações e execute as verificações pertinentes antes de encerrar.
2. Atualize `../ROADMAP.md` após cada tarefa significativa: estado atual, fase relacionada, estado da tarefa, resumo das mudanças, próximas ações e pendências/critérios ainda não atendidos. Não marque uma fase inteira como concluída por causa de uma tarefa isolada.
3. Atualize os documentos específicos existentes quando necessário, sem duplicar relatórios: `BUG_REPORT.md` para diagnóstico/correção/validação de bugs; este guia somente quando as regras permanentes mudarem; documentos técnicos quando decisões ou arquitetura forem afetadas.
4. Confira se a documentação corresponde ao código, revise o diff documental e verifique formatação. Se a tarefa ficar parcial ou bloqueada, registre o progresso, motivo e próximo passo.
5. Informe os arquivos de código e documentação alterados, testes executados e resultados, limitações e pendências. Não realize commits automaticamente; os commits são manuais pelo responsável pelo projeto.

## Trabalho em sessões assistidas por IA

- Prefira soluções econômicas em tempo e uso de ferramentas de IA, mantendo o escopo da tarefa solicitado.

## Boas práticas

- Prefira mudanças focadas e pequenas
- Mantenha nomes de variáveis e funções coerentes com o contexto
- Evite reescrever módulos grandes sem necessidade
- Documente decisões de arquitetura ou regras que fogem do padrão
- Teste os cenários principais antes de finalizar

## Áreas de interesse

- correção de regras de combate
- ajustes de magia ou talentos
- melhoria da UI e acessibilidade
- importação/exportação de fichas
- modularização de código e organização de arquivos
- documentação técnica e de uso

## Observação importante

O projeto ainda depende de uma base de código mais orientada ao DOM, então mudanças de arquitetura devem ser feitas com cuidado. O ideal é evoluir gradualmente, preservando os fluxos já existentes.

## Como reportar problemas

Abra uma issue com:

- descrição do problema
- passos para reproduzir
- comportamento esperado
- comportamento observado
- ambiente de uso (navegador, sistema operacional, etc.)

## Como sugerir melhorias

Sugestões de novo recurso devem explicar:

- problema que resolve
- público-alvo
- impacto esperado na experiência do usuário
- compatibilidade com a ficha atual

## Recomendação final

Mantenha a solução prática e compatível com o uso de mesa. O projeto é um suporte ao jogo; clareza, simplicidade e estabilidade têm prioridade sobre complexidade excessiva.
