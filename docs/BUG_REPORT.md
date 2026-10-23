# Relatório de Bugs — FichaDnD

Data: 2026-07-03

Resumo: levantamento inicial de problemas detectados por busca de marcadores (`TODO`, `FIXME`) e logs (`console.error`, `console.warn`, `throw`) no código-fonte. Cada item traz local, síntese e recomendação rápida.

## Modais de XP e Level Up — correção aplicada

**Data:** 2026-10-22
**Estado:** Investigado — Concluído; Implementado — Concluído; Validado — Concluído para os cenários descritos.

### Diagnóstico e implementação

- `xpAddModal` tinha `aria-hidden="true"` no HTML sem alternância ao abrir. Agora o código define `false` ao abrir e `true` após fechar ou confirmar.
- `levelUpModal` não expunha semântica de diálogo. O contêiner da caixa agora declara `role="dialog"`, `aria-modal="true"` e `aria-labelledby="levelUpTitulo"`.
- Escape na rolagem de PV retornava `0` e o processamento ainda aplicava o modificador de Constituição. O cancelamento agora retorna `null`, e `processarLevelUp()` interrompe o processamento antes de alterar PV. A rolagem concluída continua aplicando dado e modificador.
- Foram preservados a animação da barra, `setXP()`, `atualizarXPENivel()`, os mecanismos de foco e a mitigação global de `aria-hidden`, que permanece usada por outros componentes.

**Arquivos de código alterados:** `js/data/racas-subclasses.js` e `ficha/Ficha_DnD_-_Tatagiba_1.0.html`. `css/xp-modal.css` e `css/base.css` foram inspecionados, mas não precisaram de alteração.

### Validação registrada

- **XP sem Level Up:** adição de 50 XP; permaneceu no nível 1, com PV em 8. Barra atualizada após a animação.
- **XP com Level Up concluído:** adição de 250 XP; chegou a 300 XP e nível 2. Rolagem 4 com modificador `+0` elevou PV de 8 para 12.
- **Cancelamento por Escape:** adição de 600 XP; chegou a 900 XP e nível 3. Escape fechou o modal e manteve PV em 12.
- **Acessibilidade e foco:** `aria-hidden` do modal XP foi `false` aberto e `true` fechado; diálogo Level Up expôs os três atributos esperados; foco inicial, restauração e contenção de Tab foram conferidos nos dois modais.
- **Console:** nenhum erro JavaScript ou aviso contendo `aria-hidden` foi observado nos cenários executados. Isso não confirma ausência do aviso em todos os contextos.
- **Verificações estáticas:** `node --check js/data/racas-subclasses.js`, diagnósticos do editor nos dois arquivos alterados e `git diff --check` passaram.

**Limitação:** os cenários funcionais foram executados manualmente no navegador; não foi executada uma suíte automatizada geral. O roadmap centraliza estado e próximas ações em [`../ROADMAP.md`](../ROADMAP.md).

## Importação/exportação JSON — round-trip executado

**Data:** 2026-10-22
**Fase:** 3 — Qualidade e confiabilidade.
**Estado:** Investigado — Concluído; Implementado — Não aplicável (validação apenas); Validado — Reprovado no critério de preservação completa.

### Fluxo e proteção dos dados

- Fluxo real usado: botão `Importar` → `importarFicha()`/`FileReader` → `aplicarDadosFicha()`; botão `Salvar` → `coletarDadosFicha()`/`salvarFicha()` gera JSON; o arquivo exportado foi reimportado pelo input da aplicação.
- A ficha principal carrega `js/core/storage.js` e `js/modules/importacao.js`; `CharacteristicStorage` não participa deste fluxo.
- Thrain e Waldo foram copiados para `%TEMP%\FichaDnD-roundtrip`. Exportações de teste foram guardadas fora do repositório como `Thrain_roundtrip_export.json` e `Waldo_roundtrip_export.json`.
- SHA-256 dos originais e respectivas cópias temporárias coincidiu antes/depois: Thrain `76C98818E181D2D67B1C57330EAE0B514C0DBD475A3E177A120B393B2899A40A`; Waldo `1D6F0A7F544CA48958A661F7122CBB5A1AA7E0532FF3CBB7A4F28D1264DD9FF7`. Os JSONs originais não foram modificados.

### Resultados por ficha

- **Thrain — Reprovado parcialmente:** importação, exportação do Blob e reimportação executadas. Identidade, classe guerreiro, nível 6, subclasse, XP, atributos, PV, magias em texto, talentos estruturados e coleções de equipamentos foram preservados; contagens: 8 armas, 5 armaduras, 3 escudos e 5 outros. Os campos originais `equipamentoArmas`, `equipamentoArmadura` e `equipamentoOutros` não aparecem no JSON exportado. Os arrays estruturados de equipamentos foram mantidos, mas não está confirmado se substituem semanticamente esses textos narrativos. Campos `classeData`/`subclasseData` vazios foram preenchidos a partir dos dados de classe durante o carregamento; diferença derivada observada, não classificada como perda.
- **Waldo — Reprovado:** identidade, classe clérigo, nível 1, subclasse, XP, atributos, PV, dados de vida, atributo de conjuração, textos JSON das magias, talentos/configuração e coleções de equipamentos foram preservados; contagens: 2 armas, 1 armadura, 1 escudo e 7 outros. Divergência funcional: o original registra `magia1Total=2` e `magia1Usado=0`, equivalentes a 2 espaços restantes; após importar, exportar e reimportar, `magia1Rest=0`. Os níveis 2–9 tinham total 0 e permaneceram em 0. A validação do recurso de magia nível 1 falhou.

### Campos e normalizações comparados

Foram comparados nome do personagem/jogador, classe/subclasse/nível, XP, seis atributos, PV atual/total/temporário, dados de vida, bônus de proficiência, campos de magia e espaços, talentos/características, configuração, dados de classe derivados e arrays de armas/armaduras/escudos/outros. As listas de equipamentos e magias de Waldo coincidiram semanticamente na serialização JSON.

- O valor de `magiaClasseConjuradora` não foi exportado como campo independente; classe e `magiaAtributoConjuracao` foram preservados. O comportamento de campo derivado não foi tratado como falha isolada.
- As fichas usam `magiaNUsado`, enquanto a UI atual oferece `magiaNRest` (“Espaço Restante”). Thrain tinha total/usado zero em todos os níveis, então não evidencia a conversão; Waldo evidencia a divergência. Conversão esperada: `restante = total - usado` para fichas legadas, preservando valores em formato atual.
- Nenhum erro ou warning do console foi observado nas importações/reimportações finais executadas.

### Limitações e próximos passos

- O botão Salvar da aplicação foi acionado e gerou o Blob JSON, armazenado em arquivo temporário pelo harness local; o navegador de teste abriu um diálogo de arquivo e não expôs o evento de download esperado. Portanto, o download nativo pelo navegador não foi validado.
- O estado inicial da ficha aparece como alterado ao abrir a página; para evitar uma confirmação que bloqueava o teste, o baseline em memória foi marcado como salvo antes da importação. A leitura e aplicação do arquivo continuaram sendo feitas pelo botão/input reais.
- Estado posterior: a conversão de slots legados em `js/core/storage.js` foi corrigida e validada em 2026-10-23; o registro atualizado está na seção “Conversão de espaços de magia legados — correção aplicada”. Em separado, decidir se os três campos narrativos de equipamento devem ser preservados ou são legado descartável; não presumir equivalência com os arrays estruturados.
- Não foram alterados HTML, CSS, JavaScript, fichas originais ou `expiracao.js`; nenhuma dependência foi instalada e nenhum commit foi feito. O roadmap centraliza o estado e as ações pendentes em [`../ROADMAP.md`](../ROADMAP.md).

## Conversão de espaços de magia legados — correção aplicada

**Data:** 2026-10-23
**Fase:** 3 — Qualidade e confiabilidade.
**Estado:** Investigado — Concluído; Implementado — Concluído; Validado — Concluído para os cenários descritos.

### Diagnóstico e implementação

- O fluxo real usa `normalizarDadosImportacao()` em `js/core/storage.js` antes de aplicar os valores aos campos HTML. As fichas atuais possuem `magia1Rest`…`magia9Rest`, inicializados em `0`; fichas legadas usam `magiaNUsado`.
- A normalização não convertia `magiaNUsado`; como o campo atual `Rest` já existia no DOM, a UI priorizava seu zero e o fallback legado de `obterEstadoEspacoMagia()` não era alcançado.
- `normalizarDadosImportacao()` percorre níveis 1–9 e, somente quando `magiaNRest` não está presente no JSON, calcula `total - usado`. Total e usado devem ser inteiros seguros representados por número ou string decimal composta somente por dígitos; espaços externos são aceitos. String vazia, notação exponencial, fração, negativos, caracteres inesperados, overflow e `usado > total` são inválidos.
- Se ambos os contadores estão ausentes, não há migração legada. Se apenas um está presente ou um valor está vazio/inválido, a normalização lança erro específico. `aplicarDadosFicha()` normaliza antes de ativar o bloqueio de Level Up; o importador mostra o erro e não aplica os campos. `Rest` atual mantém precedência.
- **Arquivos de código alterados:** `js/core/storage.js` e `js/modules/importacao.js`. Não houve alterações em HTML/CSS, no módulo de magias, nos JSONs originais ou em `expiracao.js`.

### Testes executados

- **Waldo legado pela interface:** `magia1Total=2`, `magia1Usado=0` importou como `magia1Rest=2`.
- **Conversão parcial e total, níveis 1–9:** fixture temporária com total 2 e uso alternando 0/1/2 importou como restante 2/1/0 em todos os nove níveis.
- **Formato atual:** fixture com `magiaNRest` e sem `magiaNUsado` preservou os valores fornecidos, incluindo nível 1 com restante 1.
- **Round-trip corrigido de Waldo:** a aplicação importou o original, o botão Salvar gerou Blob com total 2/restante 2, e a reimportação do JSON exportado manteve restante 2 sem conversão dupla.
- **Valores inválidos na normalização:** `2e1`, `1.5`, `abc`, `-1`, vazio, Total/Usado parcial, uso acima do total e inteiro fora da faixa segura foram recusados.
- **Valores inválidos pela interface:** uso 3/total 2, Usado vazio e Total ausente exibiram erro específico e mantiveram a ficha atual intacta, inclusive `bloqueandoLevelUp=false`. O catch do importador registra `console.error` para a rejeição esperada, além do alerta da UI.
- **Sem contadores de slot:** uma fixture sem Total/Usado foi importada sem conversão legada; o carregamento normal da classe preencheu os slots após a inicialização.
- **Precedência e espaços externos:** `Rest=1` foi preservado mesmo com `Usado` legado inválido; strings com espaços externos (`" 2 "`, `" 1 "`) converteram para 1 restante.
- **Thrain:** a importação manteve restantes em 0 nos níveis 1–9, sem warnings.
- **Verificações estáticas:** `node --check js/core/storage.js` e diagnósticos do editor sem erros. Os originais continuaram com os mesmos hashes SHA-256 registrados no relatório de round-trip anterior.

### Limitações e pendências

- Os fluxos foram executados manualmente no navegador com cópias em `%TEMP%\FichaDnD-roundtrip`, complementados por chamadas diretas de `normalizarDadosImportacao()`; não foi executada uma suíte automatizada geral.
- O Blob de exportação foi capturado pelo harness e salvo em arquivo temporário para reimportação. O download nativo do navegador continua sem validação.
- A divergência anterior de `magia1Rest` em Waldo foi corrigida para o caso reproduzido. Os campos narrativos `equipamentoArmas`, `equipamentoArmadura` e `equipamentoOutros` de Thrain continuam sem decisão/correção, conforme escopo separado.
- Nenhuma dependência foi instalada e nenhum commit foi realizado. O status geral e as pendências estão em [`../ROADMAP.md`](../ROADMAP.md).

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
