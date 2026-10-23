# Registro histórico — plano de histórico de combate

Este arquivo não é uma fila ativa. O checklist antigo foi triado em 2026-10-23 após comparação com a implementação atual. Tarefas aprovadas e validações restantes devem ficar no `../ROADMAP.md`.

## Resultado da triagem

- `registrarHistoricoAtaqueArma()` existe em `js/modules/combate.js` e envia dados de arma/magia, rolagem, bônus/total de ataque, dano e tipo de dano à timeline.
- `montarRegistroTimelineHistorico()` renderiza título, nome, rolagem, dano e tipo de dano em elementos próprios; a interface usa `.historico-registro`, não a antiga tabela de colunas e subtexto `.sub`.
- A função ainda cria um texto delimitado por `|` como argumento legado, mas a timeline de ataque usa `opcoes.timeline`. Isso, isoladamente, não comprova defeito visual.
- A estrutura não foi submetida a teste de regressão nesta triagem. Compatibilidade de ataques, Cura, Dano e registros antigos permanece como validação pendente no `ROADMAP.md`; não se afirma que todos os itens do checklist antigo foram testados.

O plano original misturava observações aproximadas com tarefas futuras. Ele foi resumido aqui para não parecer uma lista ativa de execução.