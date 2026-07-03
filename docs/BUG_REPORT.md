# Relatório de Bugs — FichaDnD

Data: 2026-07-03

Resumo: levantamento inicial de problemas detectados por busca de marcadores (`TODO`, `FIXME`) e logs (`console.error`, `console.warn`, `throw`) no código-fonte. Cada item traz local, síntese e recomendação rápida.

## Correções aplicadas

- `index.html` — validação de importação semântica adicionada e mensagens de erro melhoradas.
- `ficha_tail.html` — fallback de talentos/magias implementado para não deixar a página inteira quebrar.
- `ficha/refatorar_ataque.js` — manipulações DOM agora usam remoção segura e `replaceChildren`.

## Itens críticos / erros em tempo de execução

- **Erro ao importar personagem** — [index.html](index.html#L407)
  - Sintoma: `console.error("Erro ao importar personagem:", erro)` no bloco `catch` durante importação de JSON. Usuário recebe mensagem genérica "Arquivo inválido".
  - Risco: JSON mal-formado faz falhar a importação sem detalhes; possível perda de contexto (nome do arquivo, erro específico).
  - Recomendação: apresentar detalhes reduzidos no console e mensagens de erro mais específicas na UI; validar estrutura antes de JSON.parse e mostrar campo problemático.
  - Status: Corrigido

- **Falha ao preparar interface de talentos** — [ficha_modal.html](ficha_modal.html#L986)
  - Sintoma: `console.error("Falha ao preparar interface de talentos:", erro)` num `try/catch` ao inicializar módulos de magias/talentos.
  - Risco: falha em um módulo pode deixar modais inacessíveis; falta de fallback para desabilitar parcialmente a UI.
  - Recomendação: capturar causas específicas e aplicar fallback (desabilitar apenas a aba de talentos/magias), registrar informações do erro para diagnóstico.
  - Status: Corrigido

## Warnings e problemas de robustez

- **Elementos DOM faltantes na reorganização de ataque** — [ficha/refatorar_ataque.js](ficha/refatorar_ataque.js#L12)
  - Sintoma: `console.warn('Missing elements in .ataque-topo:', container);` quando elementos esperados não existem.
  - Risco: manipulações subsequentes (removeChild/appendChild) assumem presença dos nós — pode causar `HierarchyRequestError` ou `NotFoundError` se a árvore DOM mudou.
  - Recomendação: usar checagens defensivas antes de `removeChild`, ou `element.replaceWith`/`append` seguro; evitar `innerHTML = ''` sem garantir propriedade de nó.

- **Entrada inválida ao salvar características** — [js/CharacteristicStorage.js](js/CharacteristicStorage.js#L60)
  - Sintoma: `console.warn("[CharacteristicStorage] classesData não é array")` em `saveToJSON` quando `classesData` não é Array.
  - Risco: perda/normalização silenciosa de dados; funções a montante podem assumir estrutura válida e quebrar.
  - Recomendação: lançar erro ou retornar objeto de erro padronizado para que camada de UI trate a inconsistência, além de adicionar validação de esquema (AJV ou validação manual).

- **Fetch de arquivo de classe lança Error genérico** — [js/CharacteristicSystem.js](js/CharacteristicSystem.js#L36)
  - Sintoma: `throw new Error(`HTTP ${response.status}`);` ao falhar fetch; depois é capturado e re-lançado como `Não foi possível carregar a classe`.
  - Risco: quebra de fluxos assíncronos sem fallback; mensagens duplicadas tornam o diagnóstico mais difícil.
  - Recomendação: propagar um objeto Error com propriedades (`status`, `path`) e permitir que quem chama escolha fallback (carregar classe padrão, mostrar aviso no UI, etc.).

## Marcadores `TODO` / `FIXME` relevantes

- `docs/TODO_MAGIA.md` — refatoração da aba de magias recomendada.
- Várias ocorrências de `TODO`/`FIXME` em arquivos de documentação e código indicando refatorações pendentes; priorizar funcionalidades de combate e import/export.

## Como reproduzir (passo-a-passo rápidos)

1. Abrir `index.html` no navegador e tentar importar um JSON corrompido (editar e inserir vírgula extra) → ver `Erro ao importar personagem` no console.
2. Abrir a `ficha` e navegar até a aba de talentos/magias — observar logs no console para o erro em `ficha_modal.html` quando inicialização falhar.
3. Simular DOM alterado para `.ataque-topo` (remover elementos via DevTools) e recarregar a página para ver os `console.warn` de `refatorar_ataque.js`.

## Prioridade sugerida

- P1: Erro de importação (UX e perda de dados). P1: Falhas de inicialização de módulos (magias/talentos) que bloqueiam uso.
- P2: Robustez do DOM em `refatorar_ataque.js` e validações em `CharacteristicStorage`.
- P3: Melhorias de mensagens e instrumentação (erros com mais contexto, métricas locais).

## Recomendações gerais

- Adicionar validação de esquema (JSON Schema) para importação/exportação de personagem.
- Padronizar erros: lançar `CustomError` com `code`/`meta` em vez de mensagens livres.
- Substituir manipulações arriscadas de DOM por APIs seguras e checagens antes de `removeChild`.
- Criar testes manuais automatizados (playwright / puppeteer) cobrindo importação, abertura de modais e fluxo de ataque.

---

_Relatório gerado automaticamente — revisão manual recomendada antes de criar issues individuais._
