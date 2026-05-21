# TODO - Refatoração Aba de Magias

## 📊 Diagnóstico Geral

A aba de Magias implementa um sistema básico de gerenciamento de espaços de magia e lista textual de magias por nível (0-9). Utiliza textarea individuais (`magia{N}Texto` para N=0-9) para armazenar listas de magias como texto simples, com inputs separados para total/usado de slots (`magia{N}Total/Usado`). Não há estrutura de dados formalizada - tudo é string em textarea. UI é funcional mas visualmente poluída, sem hierarquia clara. JS ausente ou mínimo - depende de funções globais não localizadas no trecho analisado (adicionar/editar/remover/renderizar magias). Modal de edição existe mas acoplado globalmente. Não segue padrões de outras abas (sem cards individuais, lista de talentos, etc.). Escalabilidade pobre para >20 magias. Performance OK para fichas simples, mas textarea cresce indefinidamente.

## 🔥 Problemas Críticos

- [ ] **Ausência total de estrutura de dados**: magias armazenadas como texto bruto em textarea (magia0Texto..magia9Texto). Impossível parsear/programaticamente manipular sem parsing manual.
- [ ] **Sem validação de slots**: magia{N}Usado pode exceder magia{N}Total. Risco de inconsistência de dados.
- [ ] **JS não localizado**: funções de CRUD (adicionar/editar/remover magias) referenciadas em classes/UI mas não implementadas no trecho. Dependência externa quebrada.
- [ ] **Modal global acoplado**: magia-modal-overlay não é específico da aba, conflita com outros modais (ataque/config/talento).
- [ ] **Risco XSS**: textarea permite HTML/script injection via innerHTML em renderizações.

## ⚠️ Problemas Estruturais

- [ ] **Duplicação extrema**: 10 textareas idênticas + 20 inputs slots. Código HTML/CSS repetido.
- [ ] **Não escalável**: limite fixo 9 níveis. >50 magias = textarea gigante sem paginação/busca.
- [ ] **Acoplamento DOM**: IDs hard-coded (magia1Texto). Refatoração quebra salvamento/carregamento.
- [ ] **Persistência primitiva**: dados em textarea perdidos em reload sem salvarFicha().
- [ ] **Inconsistente com projeto**: outras abas usam cards (armas/itens/talentos). Magias usa textarea "bagunçado".

## 🎨 Problemas de UX/UI

- [ ] **Poluição visual**: textareas longas sem scroll interno/hierarquia. Slots buried no topo.
- [ ] **Sem organização por nível**: magias misturadas em texto sem bullets/níveis visuais.
- [ ] **Falta prepared status**: checkbox magia-item-preparada existe mas não funcional.
- [ ] **Modal complexo**: magia-formulario-grid 12-colunas quebra mobile. Campos desnecessários (cura/resolucao para todas magias).
- [ ] **Sem busca/filtro**: impossível achar "Fireball" em 100+ magias.
- [ ] **Slots não intuitivos**: sem progress bar/visual para usado/total.

## 🧠 Problemas de Código

- [ ] **innerHTML inseguro**: magia-item usa innerHTML sem sanitização.
- [ ] **Código duplicado**: .magia-cabecalho/.magia-espaco repetidos 9x.
- [ ] **Event handlers inline**: onclick=".\*magia" viola separação MVC.
- [ ] **Sem modularização**: toda lógica em funções globais window.\*.
- [ ] **Magic numbers**: níveis hard-coded sem const NIVEL_MAX=9.
- [ ] **Sem tipagem**: magias como string, slots int mas sem validação.

## 🚀 Oportunidades de Melhoria

- [ ] **Cards individuais por magia**: como armas/talentos. Nome/nível/preparada/prepared slots.
- [ ] **JSON estruturado**: array magias[{id,nome,nivel,preparada,descricao,alcance,...}]. Persistência nativa.
- [ ] **Componente Slots reutilizável**: <SlotProgress total="4" usado="2" nivel="1"/>.
- [ ] **Busca/filtros**: por nome/nível/school/prepared. Paginação infinita.
- [ ] **Integração combate**: drag magias para subabaCombateMagia. Auto-consume slots.
- [ ] **Templates**: magia-formulario como shadow DOM/template. Reutilizável.

## 🧩 Possível Direção de Refatoração

1. **Data Layer**: magias[] JSON array em localStorage/input hidden. Migre textarea para JSON.parse/stringify.
2. **UI Components**: MagiaCard (nome,nível,prepared,edit/delete). SlotLevel (total/usado/progressbar).
3. **SlotManager**: classe gerencia magia{N}Total/Usado. Sync UI/data/validações.
4. **MagiaModal**: específico aba, form dinâmico baseado tipo (ataque/save/dano/etc).
5. **Search/Filter**: debounce input busca real-time no array.
6. **CombatIntegration**: drag-n-drop magias para combate auto-consome slot.
7. **Migrate data**: onLoad parser textarea para JSON se legado.

## 🧱 Nível de Complexidade

**Alto** - quebra total compatibilidade salvamentos (textarea→JSON). JS pesado (CRUD/search/drag). Integração combate/config. Testes essenciais para não quebrar fichas existentes. Tempo estimado: 8-12h implementação + 4h migração dados/tests.

## 📌 OBSERVAÇÃO FINAL

Sistema funcional mas primitivo/archaic. Refatoração essencial para >10 magias/jogador. Priorize data migration para preservar fichas existentes.
