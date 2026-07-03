# Agentes

Esta pasta contém as definições dos agentes de IA usados pelo projeto da ficha D&D.
Cada arquivo descreve um papel, escopo e regras de atuação para o agente.

## Como usar

Antes de executar qualquer alteração no código:

1. Leia `../docs/skill.md` para entender a diretriz global do projeto.
2. Revise os exemplos em `../ficha/Codigos testes/` para ver comportamentos esperados.
3. Use este diretório para entender o papel do agente e suas prioridades.

## Diretriz obrigatória

- `docs/skill.md` é o guia central de comportamento da IA para este projeto.
- Os arquivos deste diretório explicam o foco de cada agente.
- Sempre comece por `docs/skill.md` antes de usar as instruções específicas deste agente.

## Arquivos

- `frontend-ui.md` — especialista em frontend, layout, responsividade e acessibilidade.
- `frontend-ui.agent.md` — versão do agente usada por alguns mecanismos de carregamento automático.
- `qa-testes.md` — especialista em testes, regressões, fluxos e validação de estabilidade.
- `refatoracao.md` — especialista em refatoração incremental, modularização e manutenção segura.
- `sistema-rpg.md` — especialista em lógica de RPG, combate, magias, persistência e estados.

## Regras gerais

- Preserve IDs, atributos e estruturas usados pelo JavaScript.
- Evite mudanças grandes e destrutivas.
- Prefira correções pequenas e seguras.
- Sempre valide compatibilidade com `ficha/Ficha_DnD_-_Tatagiba_1.0.html`.
