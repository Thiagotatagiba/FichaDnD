# Registro histórico — ideias antigas da aba de magias

Este arquivo não é uma lista ativa de tarefas. Foi triado em 2026-10-23 porque várias afirmações não correspondiam ao código atual. Ideias futuras úteis foram consolidadas em `TODO.md`; tarefas aprovadas pertencem ao `../ROADMAP.md`.

## Resultado da triagem

- O código atual lê e grava listas por nível como arrays JSON serializados em `magiaNTexto`, renderiza itens individuais e permite adicionar, visualizar, editar, remover e marcar magias como preparadas.
- A seleção do catálogo já filtra por classe e nível; magias preparadas são integradas ao combate e o uso consome espaços.
- As antigas afirmações de ausência de CRUD, estrutura de dados, preparo funcional e integração com combate não devem ser tratadas como bugs atuais sem nova evidência.
- Permanecem como ideias não aprovadas: busca/filtros na lista do personagem, navegação para listas extensas, possível evolução do esquema, auditoria de escaping e interação de arrastar/soltar. Elas estão em `TODO.md`.
- A anotação antiga de risco XSS não incluía reprodução. O escaping existente deve ser verificado se essa ideia for retomada; este registro não afirma que o problema esteja confirmado.

Não converta estas observações em implementação sem consultar o código atual e aprovar a proposta no `ROADMAP.md`.
