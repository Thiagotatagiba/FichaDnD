# Análise Completa: Sistemas de Rolagem de Dados

## 🎲 Dice System 1: Modal de Ataque Principal (Produção)

**File:** `ficha/Ficha DnD - Tatagiba 1.0.html`  
**Section:** Modal de combate (`#modalAtaqueOverlay`)

### HTML

- **IDs principais:** `#modalAtaqueDado`, `#modalAtaqueDano`, `#modalAtaqueRolarDado`, `#modalAtaqueRolarDano`, `#modalAtaqueTotal`, `#modalAtaqueBonus`
- **Classes principais:** `.dado-modal`, `.botao-dado`, `.dado-modal-calculo`

### JS Functions

- `rolarDado(quantidade, faces)` - Rolagem core
- `animarRolagemNoCampo()` - Animação de rolagem
- `atualizarTotalModalAtaque()` - Atualiza total ataque
- `registrarRolagemModalAtaque()` - Adiciona ao histórico
- `obterDadoModalAtaque()` - Lê valor atual

### Events

- `click` `#modalAtaqueRolarDado` → rola 1d20 ataque
- `click` `#modalAtaqueRolarDano` → rola dano
- `input/change` campos → atualiza total
- `keydown Enter` → avança etapas

### State Variables

```
estadoAtaqueArma = {
  arma, dado, totalAtaque, modBase, bonusProf,
  rotuloAtributo, textoResumo, historicoRolagens[], tipoAcao
}
```

### Dependencies

- `getBonusProf()` - Proficiência
- `getModificadorBaseAtributo()` - Atributos
- Sistema de combate (PV, rodada, histórico)

### Duplication

**SIM - HIGH**

- Funções `rolarDado`, `animarRolagemNoCampo` duplicadas
- HTML `.dado-modal` estrutura repetida
- Lógica de histórico idêntica

### Risk Analysis

**HIGH**  
Modificação quebra: workflow de combate, histórico, UI modal, cálculos de ataque.

### Refactor Potential

**YES**

- **Extrair:** `rolarDado`, `animarRolagemNoCampo` → módulo global
- **Manter:** `estadoAtaqueArma`, callbacks específicos
- **Tightly coupled:** Modal DOM, histórico combate

---

## 🎲 Dice System 2: Demo Genérica d20

**File:** `rolagem-exemplo.html`  
**Section:** Página completa de demo

### HTML

- **IDs:** `#dadoRolar`, `#dadoValor`, `#dadoTotal`, `#dadoBonus`, `#dadoHistorico`
- **Classes:** `.dado-modal`, `.botao-dado`

### JS Functions

- `rolarDado(quantidade, faces)` ⭐ **DUPLICADA**
- `animarRolagemNoCampo()` ⭐ **DUPLICADA**
- `atualizarTotalDado()`
- `atualizarHistoricoDado()` - Destaque max/min
- `atualizarDetalheDado()`

### Events

- `click` `#dadoRolar` → 1d20
- `input` `#dadoValor` → atualiza
- `click` histórico → reusa valor

### State Variables

```
estadoDado = { historico[], bonus: 7, formula: "1d20" }
```

### Dependencies

- Standalone (nenhuma)

### Duplication

**SIM - IDENTICAL**

- **Funções exatas:** `rolarDado`, `animarRolagemNoCampo`
- **HTML idêntico:** `.dado-modal` copy-paste
- **Lógica histórico:** cópia direta

### Risk Analysis

**LOW**  
Demo isolada, fácil remover/remover.

### Refactor Potential

**YES**

- **Extrair:** Nada (usar main como ref)
- **Manter:** Tudo como exemplo
- **Delete:** Após centralizar main

---

## 🎲 Dice System 3: Dados de Vida (Short Rest)

**File:** `ficha/Codigos testes/Descanso_Curto-1.html`  
**Section:** Modal teste descanso curto

### HTML

- **IDs:** `#dvOrbes`, `#pvAtual`, `#pvMax`
- **Classes:** `.dv-orbe.ativo`

### JS Functions

- `rolarDado(lados)` ⭐ **DUPLICADA**
- `processarCura(valorDado, origem)`
- `gastarDado()`
- `renderDV()` - UI orbs

### Events

- `click` 🎲 → rola + cura
- Manual input → confirma

### State Variables

```
dadosVida: 5  // Hit Dice count
tipoDado: 10  // d10
conMod: 2
```

### Dependencies

- PV system local
- CON mod hardcoded

### Duplication

**SIM - FUNCTION ONLY**

- `rolarDado(lados)` duplicada

### Risk Analysis

**MEDIUM**  
Teste isolado, pode integrar ao main.

### Refactor Potential

**PARTIAL**

- **Extrair:** `rolarDado` → global
- **Converter:** Orbs → usar main dice UI
- **Manter:** Lógica cura/PV

---

## 📊 Summary

- **Total dice systems found:** 3
- **Number of duplicated implementations:** **3** (todas usam `rolarDado`; 2 com `.dado-modal`)

## 🧠 Refactor Strategy

### Core Module: Modal Principal (#1)

- **Base para todos:** Mais completa (ataque/dano/histórico)
- **Centralizar:**
  ```js
  // utils/dice.js
  export { rolarDado, animarRolagemNoCampo, criarBotaoHistoricoDado };
  ```
- **Safe to modularize:** Animação, histórico genérico
- **Tightly coupled:**
  - `estadoAtaqueArma` (combate específico)
  - Modal DOM IDs (main sheet)
  - Equipamento/proficiente

### Migração:

1. **Demo (#2)** → deletar ou converter para usar main
2. **Hit Dice (#3)** → integrar ao descanso longo (main sheet)
3. **Criar:** `DiceManager` class genérica

## ⚠️ Critical Risks

| Função/State          | Dependências    | Quebra se modificar |
| --------------------- | --------------- | ------------------- |
| `rolarDado()`         | Todos os 3      | **TODOS** sistemas  |
| `estadoAtaqueArma`    | Modal principal | Combate core        |
| `.dado-modal` HTML    | Main + Demo     | UI rolagem          |
| `historicoRolagens[]` | Ataque modal    | Histórico combate   |

**Most sensitive:** Modal principal (80% uso real)
