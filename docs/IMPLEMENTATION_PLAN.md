# Plano Detalhado de Correções — FichaDnD

## Objetivo

Criar um plano de trabalho detalhado para corrigir os principais bugs identificados em `BUG_REPORT.md`, melhorar a robustez do projeto e garantir validação funcional adequada.

## Escopo

- Corrigir importação de personagens (`index.html`)
- Melhorar inicialização de talentos/magias (`ficha_modal.html`)
- Detectar e tratar DOM inconsistente em `ficha/refatorar_ataque.js`
- Validar e endurecer persistência de características em `js/CharacteristicStorage.js`
- Refatorar tratamento de erros em `js/CharacteristicSystem.js`
- Criar um fluxo de QA e validação manual para garantir a correção

## Prioridades

1. P1: erros de importação e inicialização de módulos
2. P2: robustez de DOM e validações de dados
3. P3: melhoria de mensagens de erro e instrumentação

## Critérios de sucesso

- Importação de personagem exibe mensagem clara e não quebra a página
- Modal de talentos/magias falha de forma isolada e não derruba toda a ficha
- Manipulações de `.ataque-topo` são protegidas contra estrutura DOM diferente
- `CharacteristicStorage.saveToJSON` valida corretamente a entrada antes de salvar
- `ClassManager.loadClassData` apresenta erro com contexto suficiente para análise
- Fluxos principais (abrir, salvar, importar, atacar, usar magias) funcionam sem erros claros no console

## Etapas detalhadas

### 1. Preparar ambiente e inspecionar contexto

- Confirmar versão atual do projeto e status do repositório.
- Abrir `BUG_REPORT.md`, `index.html`, `ficha_modal.html`, `ficha/refatorar_ataque.js`, `js/CharacteristicStorage.js`, `js/CharacteristicSystem.js`.
- Revisar os fluxos existentes de importação, UI de magias/talentos e combate.

### 2. Corrigir importação de personagem (P1)

- Local: `index.html`
- Tarefa:
  - Identificar o bloco `try/catch` de importação JSON.
  - Adicionar validação semântica do JSON importado (campos obrigatórios mínimos).
  - Alterar a mensagem de erro para ser mais informativa sem expor dados sensíveis.
  - Garantir que `evento.target.value` seja limpo e que a UI continue responsiva.
- Critérios:
  - JSON mal-formado apresenta mensagem clara.
  - JSON válido mas inválido semanticamente apresenta aviso específico.
  - Importações exitosas seguem para abertura da ficha.

### 3. Melhorar fallback de talentos/magias (P1)

- Local: `ficha_modal.html`
- Tarefa:
  - Revisar `try/catch` que encapsula `montarModalTalento()` e `inicializarTalentos()`.
  - Adicionar log com informações adicionais do erro (tipo e local).
  - Se falhar, desabilitar apenas a aba correspondente e deixar o restante da ficha funcional.
  - Garantir que modais de ataque e outras áreas não sejam afetados.
- Critérios:
  - Falhas de inicialização não travam outras áreas.
  - Console mostra causa do erro para diagnóstico.

### 4. Proteger manipulação de DOM em ataque (P2)

- Local: `ficha/refatorar_ataque.js`
- Tarefa:
  - Detectar e validar cada elemento antes de `removeChild` e reordenação.
  - Trocar `innerHTML = ''` por remoção segura de filhos conhecidos.
  - Adicionar guard clauses para sair sem efeito se estrutura inesperada for encontrada.
- Critérios:
  - Não há exceções se `.ataque-topo` estiver incompleta.
  - `console.warn` permanece apenas para contêineres não conformes.

### 5. Endurecer validação em CharacteristicStorage (P2)

- Local: `js/CharacteristicStorage.js`
- Tarefa:
  - Inserir validação de entrada em `saveToJSON` e `updateClassData`.
  - Trocar aviso silencioso por erro controlado ou retorno de estado.
  - Adicionar documento de esquema leve ou validação manual dos campos mais críticos.
- Critérios:
  - Dados inválidos não são aceitos sem aviso.
  - Chamadas de salvamento retornam erro tratável ao invés de continuar com array vazio.

### 6. Melhorar tratamento de erro de fetch de classe (P2)

- Local: `js/CharacteristicSystem.js`
- Tarefa:
  - Criar `CustomError` ou objeto de erro com `status`, `path` e `message`.
  - Propagar este erro com contexto adicional para o chamador.
  - Ajustar captura para não substituir contexto original.
- Critérios:
  - Erros de fetch indicam o arquivo e o status HTTP.
  - Chamadores podem diferenciar `404` de outros problemas.

### 7. QA e validação manual (P1/P2)

- Itens de validação:
  - Abrir `index.html` e `ficha/Ficha_DnD_-_Tatagiba_1.0.html`.
  - Importar JSON válido e inválido.
  - Atualizar atributos e salvar/recuperar estado.
  - Abrir modais de ataque e magias.
  - Navegar por abas e trocar telas.
  - Verificar console do navegador para erros.
- Pontos de atenção:
  - Responsividade mínima em mobile.
  - Comportamento de modais e foco.
  - Persistência local entre reload.

### 8. Registrar alterações e documentação

- Atualizar `BUG_REPORT.md` com o status das correções.
- Adicionar notas no `README.md` se novas instruções de uso forem necessárias.
- Se houver mudanças de esquema ou comportamento, documentar o novo fluxo.

## Plano de execução recomendado

1. Implementar correções de `index.html` e `ficha_modal.html` (P1).
2. Validar manualmente os fluxos mencionados.
3. Implementar proteções em `ficha/refatorar_ataque.js` e `js/CharacteristicStorage.js`.
4. Revisar tratamento de erro em `js/CharacteristicSystem.js`.
5. Executar nova rodada de QA e atualizar o relatório.

## Mapa de tarefas

| Prioridade | Arquivo                       | Objetivo                    | Resultado esperado                      |
| ---------- | ----------------------------- | --------------------------- | --------------------------------------- |
| P1         | `index.html`                  | Feedback de importação      | Mensagem clara + fluxo não interrompido |
| P1         | `ficha_modal.html`            | Fallback de talentos/magias | Módulo falha isoladamente               |
| P2         | `ficha/refatorar_ataque.js`   | Robustez DOM                | Sem exceção em DOM inesperado           |
| P2         | `js/CharacteristicStorage.js` | Validação de dados          | Dados inválidos tratados                |
| P2         | `js/CharacteristicSystem.js`  | Erro de fetch contextual    | Erros com status e path                 |
| P1/P2      | `QA`                          | Validação funcional         | Fluxos principais corretos              |

## Observações finais

- Comece pela importação/UI, pois são as áreas de maior impacto no uso.
- Use os perfis de agente para guiar cada correção: `frontend-ui` para UI, `sistema-rpg` para lógica, `refatoracao` para arquitetura e `qa-testes` para validação.
- Mantenha mudanças pequenas e documentadas.
