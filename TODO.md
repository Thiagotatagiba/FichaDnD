# TODO - Ficha D&D Tatagiba 1.0 - Plano Atual

## Contexto
Ficha `Ficha DnD - Tatagiba 1.0.html` (14.911 linhas). Verificação e manutenção contínua do modal de ataque/dano e demais funcionalidades.

---

## 🎯 Refatoração Visual — Resumo de Ataque

### Objetivo
Melhorar a apresentação visual do resumo de ataque sem alterar a lógica existente, tornando a interface mais legível e com melhor feedback ao usuário.

---

## 🔧 Tarefas

### 1. Inverter hierarquia visual (Número > Emoji)
- Tornar o número o elemento principal (maior e em destaque)
- Transformar o emoji em um indicador visual secundário
- Posicionar o emoji no canto do número (overlay com `position: absolute`)

#### Estrutura esperada:
```html
<span class="calc-item" title="Valor do dado">
  <span class="numero">6</span>
  <span class="emoji">🎲</span>
</span>
```

### 2. Adicionar Tooltip (Legenda ao passar o mouse)

Usar atributo title para explicação de cada elemento:

- 🎲 → "Valor do dado"
- 💪 → "Modificador de atributo"
  (ideal: adaptar dinamicamente para Força, Destreza, etc)
- 🅿️ → "Bônus de Proficiência"

### 3. Refatorar HTML gerado no innerHTML

Atual:

```
resumo.innerHTML = `Ataque: <span class="ataque-modal-resumo-destaque">${totalAtaque}</span> (<span class="ataque-modal-resumo-destaque${dado === 20 ? ' ataque-modal-resumo-dado-critico' : ''}">🎲 ${dado}</span> + <span class="ataque-modal-resumo-destaque">${iconeAtributo} ${estadoAtaqueArma.modBase || 0}</span> + <span class="ataque-modal-resumo-destaque">🅿️ ${estadoAtaqueArma.bonusProf || 0}</span>)`;
```

➡️ Refatorar apenas a estrutura HTML, mantendo:

- totalAtaque
- dado
- estadoAtaqueArma.modBase
- estadoAtaqueArma.bonusProf
- iconeAtributo
- lógica de crítico (dado === 20)

### 4. Criar/Atualizar CSS

Adicionar estilos:

```css
.calc-item {
  position: relative;
  display: inline-block;
  font-weight: bold;
}

.numero {
  font-size: 22px;
}

.emoji {
  position: absolute;
  bottom: -6px;
  right: -8px;
  font-size: 12px;
  opacity: 0.8;
}
```

### 5. Manter compatibilidade visual existente

- Preservar .ataque-modal-resumo-destaque
- Preservar .ataque-modal-resumo-dado-critico
- Garantir que o layout não quebre dentro do modal atual

### ⚠️ Restrições

- ❌ NÃO alterar lógica JavaScript
- ❌ NÃO remover classes existentes
- ❌ NÃO alterar fluxo de cálculo
- ✅ Apenas refatoração visual + UX

### ✅ Resultado Esperado

Visual mais limpo e profissional:

Ataque: 13 ( 6🎲 + 4💪 + 3🅿️ )

Com:

- números maiores e mais legíveis
- emojis discretos como indicadores
- tooltips explicando cada valor

---

## 📖 Aba História — Coluna Diário

### Contexto
A aba `História` (`<div id="historia" class="aba">`) atualmente possui:
- Bloco superior com **Características** (detalhes do personagem)
- Bloco intermediário com **Traços de Personalidade**, **Ideais**, **Vínculos**, **Fraquezas**
- Bloco inferior com **Aliados e Organizações** e **História do Personagem**

O objetivo é adicionar uma nova coluna **Diário** ao lado de **Aliados e Organizações**, transformando-a em uma lista cadastrável (mesmo padrão das características de classe/raça/talento), onde cada registro é um item clicável que abre um modal com título e anotação.

---

### 🔧 Tarefas

#### 1. Estrutura HTML — Adicionar coluna Diário

Localizar o bloco inferior da aba História (após `.historia-blocos` e antes de `.historia-card` de "Aliados e Organizações").

Adicionar uma nova `.historia-card` com:
- Título: **Diário**
- Container de lista: `<div id="diarioLista" class="diario-lista"></div>`
- Botão de adicionar: `<button type="button" class="diario-botao-add" onclick="adicionarNovoDiario()">+ novo registro</button>`

A estrutura deve ficar lado a lado com "Aliados e Organizações" (grid de 2 colunas ou flex com gap).

#### 2. Criar CSS do Diário

Reutilizar o padrão visual de `.talento-lista`, `.talento-item` e `.talento-botao-add`, adaptando para o contexto da aba História:

```css
.diario-lista {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 68px;
    padding: 10px 12px;
    border: 1px solid #bda68c;
    border-radius: 8px;
    background: #fffaf2;
    box-sizing: border-box;
}

.diario-item {
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    width: fit-content;
    max-width: 100%;
    border: none;
    background: none;
    padding: 0;
    color: #8b5a2b;
    font-family: 'MedievalSharp';
    font-size: 14px;
    line-height: 1.3;
    text-align: left;
    cursor: pointer;
    transition: color 0.2s ease, transform 0.2s ease;
}

.diario-item::before {
    content: "•";
    color: #b8860b;
    flex: 0 0 auto;
}

.diario-item:hover,
.diario-item:focus-visible {
    color: #6f3610;
    transform: translateX(2px);
    text-decoration: underline;
    outline: none;
}

.diario-botao-add {
    border: none;
    background: none;
    color: #8b5a2b;
    font-family: 'MedievalSharp';
    font-size: 13px;
    padding: 0;
    cursor: pointer;
    text-align: left;
    width: fit-content;
}

.diario-botao-add:hover,
.diario-botao-add:focus-visible {
    color: #6f3610;
    text-decoration: underline;
    outline: none;
}
```

#### 3. Criar Modal do Diário

Criar um modal seguindo o padrão do modal de talentos (`.talento-modal-overlay`), mas simplificado:

- **Overlay**: `#diarioModalOverlay` com classes `.diario-modal-overlay modal-overlay-base`
- **Estrutura interna**:
  - Título do modal: `#diarioModalTitulo`
  - Subtítulo/data: `#diarioModalSubtitulo` (opcional)
  - Corpo visualização: `#diarioModalCorpo` com título e anotação
  - Formulário edição: inputs `#diarioModalNomeInput` (título) e `#diarioModalDescricaoInput` (anotação)
  - Botões: Editar ✏️, Excluir 🗑️, Salvar 💾, Fechar

O modal deve ser criado dinamicamente via JavaScript (padrão `montarModalTalento()`), ou inserido no HTML estático.

#### 4. Implementar JavaScript — Estado e Funções

Criar estrutura de estado isolada para o Diário:

```js
let estadoDiario = {
    registros: [],        // array de { id, titulo, anotacao, data }
    editandoIndice: null  // índice do registro em edição
};
```

Funções necessárias:

| Função | Descrição |
|--------|-----------|
| `montarModalDiario()` | Cria o overlay/modal no DOM se não existir |
| `renderizarDiario()` | Renderiza a lista de registros em `#diarioLista` |
| `adicionarNovoDiario()` | Abre o modal em modo "criar" (título e anotação vazios) |
| `abrirModalDiario(registro, indice, modo)` | Abre o modal em modo "visualizar" ou "editar" |
| `salvarDiarioModal()` | Salva o registro (novo ou edição) no estado e re-renderiza |
| `excluirDiarioModal()` | Remove o registro do estado e re-renderiza |
| `fecharModalDiario()` | Fecha o overlay e limpa o estado de edição |

**Comportamento esperado:**
- Ao clicar em um `.diario-item`: abre modal em modo **visualizar**
- Ao clicar em **+ novo registro**: abre modal em modo **editar** com campos vazios
- No modo visualizar: exibe título e anotação em blocos de leitura; botão "Editar" alterna para formulário
- No modo editar: exibe inputs de título e anotação; botão "Salvar" persiste

#### 5. Persistência (Save/Load)

Integrar com as funções existentes `salvarFicha()` e `carregarFicha()`:

- **`salvarFicha()`**: incluir `estadoDiario.registros` no objeto JSON exportado (ex: chave `diario`)
- **`carregarFicha()`**: ao carregar um personagem, restaurar `estadoDiario.registros` a partir do JSON e chamar `renderizarDiario()`

#### 6. Layout Responsivo

Garantir que em telas menores (`@media (max-width: 900px)`):
- A coluna **Diário** empilhe abaixo de **Aliados e Organizações**
- O modal ocupe a largura total com padding reduzido

---

### 📋 Referência de Implementação

Padrão a ser seguido (já existente na ficha):
- **Lista clicável**: `.talento-lista` + `.talento-item` (aba Status > Características)
- **Modal de talento**: `#talentoModalOverlay` com visualização/edição/exclusão
- **Botão add**: `.talento-botao-add` com `data-talento-add`
- **Funções modelo**: `abrirModalTalento()`, `adicionarNovaCaracteristica()`, `salvarTalentoModal()`

---

### ⚠️ Restrições

- ❌ NÃO remover os textareas existentes (Aliados e Organizações / História do Personagem)
- ❌ NÃO alterar a lógica de outros modais (talento, magia, ataque)
- ✅ Manter consistência visual com o tema medieval da ficha
- ✅ Reutilizar variáveis CSS do modal (`--modal-bg`, `--modal-border`, etc.)
- ✅ Garantir acessibilidade (`aria-label`, `role="dialog"`, foco gerenciado)

---

### ✅ Resultado Esperado

A aba **História** passa a ter:

```
[Características do Personagem]

[Traços] [Ideais] [Vínculos] [Fraquezas]

[Aliados e Organizações]  [Diário]
                           • Encontro com o mercador
                           • Visão na masmorra
                           + novo registro

[História do Personagem]
```

Ao clicar em **+ novo registro** ou em um item existente, abre o modal:

```
┌─────────────────────────────┐
│  📜 Diário              [X] │
├─────────────────────────────┤
│  Título: Encontro com...    │
│  Anotação:                  │
│  O mercador ofereceu uma    │
│  poção misteriosa...        │
│                             │
│  [✏️] [🗑️] [💾 Salvar]     │
└─────────────────────────────┘
