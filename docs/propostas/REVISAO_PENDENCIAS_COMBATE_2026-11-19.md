# Revisão de bugs e pendências — Combate 2.0

**Data:** 2026-11-19  
**Escopo:** inspeção estática da aba Combate, módulos e testes existentes; nenhuma implementação foi feita nesta revisão.

## Régua de prioridade

- **5 — Crítica:** perda/corrupção de dados ou bloqueio amplo do uso.
- **4 — Alta:** regra ou fluxo de combate pode produzir resultado incorreto; resolver antes de aprovar o fluxo.
- **3 — Média:** lacuna funcional importante, com alternativa manual ou escopo ainda a definir.
- **2 — Baixa:** interação e apresentação, sem evidência de cálculo incorreto.
- **1 — Refinamento:** acabamento visual ou conveniência.

## Achados

### Prioridade 4

1. **Modificador negativo em ataque de ação bônus.** O cálculo atual zera o modificador de dano em qualquer ataque marcado como ação bônus. No ataque adicional de duas armas conforme D&D 5e 2014, o modificador positivo não entra, mas um modificador negativo permanece. A inspeção confirma o caminho de código; ainda falta uma reprodução funcional no modal. O registro de bug e a referência estão em [`BUG_REPORT.md`](../BUG_REPORT.md).
2. **Suíte geral não está verde.** A execução atual de `node --test tests/*.test.cjs` resultou em **203/210 aprovados, 7 falhas**. Uma é uma asserção estática do CSS do card de iniciativa sensível à ordem do texto das declarações. As outras seis decorrem do harness de rollback tentando extrair `coletarOutros()`, que não encontra no código atual. Isso impede usar a suíte como gate aprovado; não demonstra, isoladamente, defeito do runtime de combate ou rollback.

### Prioridade 3

3. **Ataque desarmado ausente quando não há arma equipada.** O fluxo oficial ainda pode exibir lista vazia em vez de oferecer ataque desarmado, apesar do pedido anterior para tê-lo ativo. É uma lacuna funcional; implementar requer definir um fluxo oficial sem criar bônus ou dano demonstrativos.
4. **Escolha de atributo para armas com Acuidade.** O código escolhe automaticamente o maior modificador FOR/DES e deixa o campo sem escolha manual. O cálculo padrão é válido, mas a possibilidade de escolha solicitada anteriormente não está disponível na interface atual.
5. **Economia de ações não é controlada por turno.** Ataques registram tipo (Ação/Ação bônus/Reação), mas a ficha não contabiliza disponibilidade nem gasta recursos. A implementação precisa considerar recursos de classe e efeitos, sem inferir limites genéricos para “ação extra”.
6. **Validação de ataque/munição no navegador ainda incompleta.** Não foram comprovados no fluxo de navegador o cancelamento sem consumo, o consumo em fracasso, o consumo único em sucesso nem o comportamento após reabrir o modal. O código consome munição quando o ataque é confirmado como sucesso ou fracasso, conforme esperado para um ataque realizado; falta validar ponta a ponta.

### Prioridade 2

7. **Ações rápidas e Outras ações registram, mas não resolvem efeitos.** Esquivar, Desengajar e outras opções adicionam um registro no histórico e explicitam que não aplicam efeitos. Esse comportamento é coerente com a autorização anterior de manter os botões visuais por enquanto; evoluí-los exige implementação funcional e regras específicas.
8. **Desequipar arma exige usar o seletor.** A opção vazia já permite desmarcar equipamento; um botão dedicado seria conveniência, não bloqueio.
9. **Prévia e organização do modal de ataque.** Uma prévia da arma e reorganização visual foram solicitadas como melhoria. Não foi identificado defeito de cálculo associado somente à ausência da prévia.

### Prioridade 1

10. **Polimento do estado de duas mãos e padronização de botões.** O estado “Duas mãos” e a alternância de arma versátil já têm lógica em `equipamentos.js`; a pendência é tornar a representação e os controles mais claros e consistentes.
11. **Conferência final responsiva e por teclado.** Há validações visuais anteriores em Chromium integrado e medições responsivas registradas, mas elas não cobrem todos os estados dos modais e as últimas alterações em todos os viewports.

## O que já está implementado ou coberto

- O seletor vazio de ficha pode ser preenchido a partir do inventário; existe teste de regressão em `tests/seletor-equipamentos.test.cjs`.
- O filtro de mão secundária limita opções a armas elegíveis e escudos, com teste automatizado.
- Armas versáteis têm alternância de empunhadura e o texto de dano segue o modo selecionado; melhorar a visibilidade é trabalho de interface.
- Ações visuais escrevem no histórico, sem inventar efeitos.
- PV temporários ficam separados de PV normais; dano consome temporários primeiro, cura respeita o máximo normal. Em D&D 5e, `8 PV + 3 temporários` não significa `11 PV atuais`: os temporários são um reservatório separado.

## Validação desta auditoria

- `node --test tests/*.test.cjs`: **203/210 passaram; 7 falharam** (uma expectativa estática do CSS e seis falhas do harness de rollback por extração de fonte).
- Leitura do DOM atual em Chromium integrado ao VS Code, na origem sintética `127.0.0.1:8000`: confirmou a montagem da aba, arma Maça selecionada, PV 8/8, CA 10 e controles de combate visíveis. Foi uma leitura de estado, não um teste de interação.
- Nenhuma ficha real foi alterada. Nenhum arquivo de código ou JSON foi editado nesta revisão. As alterações preexistentes do workspace foram preservadas.

## Ordem recomendada

1. Regressão e correção do modificador negativo no ataque de duas armas.
2. Atualizar os testes frágeis de CSS/rollback e recuperar uma suíte verde.
3. Validar sucesso, fracasso e cancelamento com munição em navegador sintético.
4. Priorizar ataque desarmado e escolha de atributo em armas com Acuidade.
5. Desenhar o modelo de economia de ações antes de qualquer contador automático.
6. Tratar prévia do ataque, desequipar, clareza do modo versátil, botões e polimento responsivo.

**Estado:** relatório de análise; nenhum gate E2 foi aprovado por esta revisão. Não houve commit, push, merge ou deploy.
