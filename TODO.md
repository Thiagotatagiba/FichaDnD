# TODO - Melhorias no modal de Dano (modalAtaqueEtapaDano)

## Contexto
Melhorar o modal de dano para suportar múltiplos dados de dano, exibir vetor dos resultados individuais, limpar histórico ao fechar o modal e mostrar o modificador correto da arma.

---

## Checklist de Implementação

### 1. Adicionar CSS `.ataque-modal-resultados-dano`
- **Arquivo:** `ficha/Ficha DnD - Tatagiba 1.0.html` (seção `<style>`)
- **Ação:** Adicionar regra CSS para exibir o vetor de resultados abaixo do botão do dado (fonte monoespaçada, tamanho pequeno, cor alinhada ao tema)

### 2. Atualizar objeto `estadoAtaqueArma`
- **Arquivo:** `ficha/Ficha DnD - Tatagiba 1.0.html`
- **Ação:** Adicionar propriedade `ultimaRolagemDano: null`

### 3. Atualizar `fecharModalAtaqueArma()`
- **Arquivo:** `ficha/Ficha DnD - Tatagiba 1.0.html`
- **Ação:** Limpar estado de dano (`historicoRolagensDano`, `danoQtd`, `danoFaces`, `danoFormula`, `danoModBase`, `ultimaRolagemDano`), limpar `modalAtaqueResultadosDano` e chamar `atualizarTotalModalDano()` + `atualizarHistoricoRolagensModalDano()`

### 4. Atualizar `abrirEtapaDanoAtaque()`
- **Arquivo:** `ficha/Ficha DnD - Tatagiba 1.0.html`
- **Ação:** Atualizar o texto de `modalAtaqueBonusDano` para mostrar o modificador real da arma (ex: `+ 4 (FOR)`) usando `danoModBase` e `rotuloAtributo`

### 5. Corrigir `animarRolagemNoCampo()` para múltiplos dados
- **Arquivo:** `ficha/Ficha DnD - Tatagiba 1.0.html`
- **Ação:** Alterar `campo.value = parcial?.resultados?.[0] ?? ''` para `campo.value = parcial?.soma ?? ''` (tanto no intervalo quanto no final), para que armas com 2d6 exibam a soma correta

### 6. Atualizar `registrarRolagemModalDano()`
- **Arquivo:** `ficha/Ficha DnD - Tatagiba 1.0.html`
- **Ação:**
  - Registrar `rolagem.soma` no histórico (em vez de `resultados[0]`)
  - Armazenar `rolagem.resultados` em `estadoAtaqueArma.ultimaRolagemDano`
  - Chamar `atualizarResultadosDano()` para exibir o vetor

### 7. Adicionar função `atualizarResultadosDano()`
- **Arquivo:** `ficha/Ficha DnD - Tatagiba 1.0.html`
- **Ação:** Inserir após `atualizarHistoricoRolagensModalDano()`. Atualizar `modalAtaqueResultadosDano` com o vetor dos últimos resultados (ex: `[4, 6]`)

### 8. Testes Manuais Recomendados
1. **Arma com 2d6:** Criar arma com dano `2d6`, abrir modal de ataque, ir para etapa de dano, rolar dano e verificar se exibe a soma correta e o vetor `[X, Y]`
2. **Arma com 1d8:** Verificar se continua funcionando normalmente
3. **Modificador:** Verificar se o texto ao lado do input mostra o modificador correto (ex: `+ 3 (FOR)` ou `+ 2 (DES)`)
4. **Histórico:** Rolar várias vezes, confirmar o ataque, reabrir o modal e verificar se o histórico de dano está limpo
5. **Cancelar:** Clicar em "Cancelar ataque" e verificar se o modal fecha limpo

---

## Requisitos Atendidos

| Requisito | Descrição |
|-----------|-----------|
| 1 | Suportar armas com múltiplos dados (ex: 2d6) |
| 2 | Exibir vetor dos últimos resultados rolados abaixo do botão |
| 3 | Apagar histórico de rolagens de dano ao concluir/cancelar ataque |
| 4 | Mostrar modificador real da arma ao lado do input de dano |

---

**Data de início:** 2025-01-XX
**Implementado por:** BLACKBOXAI

