
# Banco de ideias — Ficha D&D

Este arquivo é um espaço de captura para ideias ainda não avaliadas. Uma anotação aqui não é tarefa planejada, compromisso de implementação, prioridade ou prazo. Revise o código e a documentação antes de avaliar uma ideia. Quando aprovada, retire-a daqui e registre-a no `../ROADMAP.md`; bugs confirmados pertencem ao `BUG_REPORT.md`. Remova ideias descartadas, salvo se houver motivo útil para preservar esse histórico.

## Ideias para avaliar

- **Magias — busca e filtros na lista do personagem:** avaliar busca por nome e filtros por nível, escola e estado de preparo para listas extensas. O catálogo de adição já filtra por classe e nível; esta ideia se refere à lista de magias já cadastradas no personagem.

- **Magias — navegação para listas extensas:** avaliar apresentação compacta, paginação ou outra navegação quando um personagem tiver muitas magias. A UI atual já renderiza itens por nível e oferece visualização/edição em modal.

- **Magias — modal e telas menores:** avaliar responsividade do formulário/modal e possíveis conflitos de sobreposição com outros modais. A anotação antiga não foi reproduzida como falha atual.

- **Magias — visualização de espaços:** avaliar um indicador visual de espaços totais/restantes por nível sem mudar a semântica atual dos campos nem o formato persistido.

- **Magias — evolução do formato de dados:** avaliar se a serialização JSON atual nos campos `magiaNTexto` precisa de um esquema versionado próprio. Qualquer proposta deve preservar importação/exportação e dados legados; não há migração aprovada.

- **Magias — segurança de renderização:** revisar usos de HTML dinâmico para textos importados de magias e confirmar se o escaping existente cobre todos os caminhos. A anotação antiga sobre XSS não foi confirmada como bug.

- **Combate e magias — interação de arrastar e soltar:** avaliar se arrastar uma magia preparada para a subaba de combate melhoraria o fluxo. A integração atual já lista magias preparadas e tem uso com consumo de espaço; arrastar/soltar seria uma alternativa de interação.
