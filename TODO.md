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
2. Adicionar Tooltip (Legenda ao passar o mouse)

Usar atributo title para explicação de cada elemento:

🎲 → "Valor do dado"
💪 → "Modificador de atributo"
(ideal: adaptar dinamicamente para Força, Destreza, etc)
🅿️ → "Bônus de Proficiência"
3. Refatorar HTML gerado no innerHTML

Atual:

resumo.innerHTML = `Ataque: <span class="ataque-modal-resumo-destaque">${totalAtaque}</span> (<span class="ataque-modal-resumo-destaque${dado === 20 ? ' ataque-modal-resumo-dado-critico' : ''}">🎲 ${dado}</span> + <span class="ataque-modal-resumo-destaque">${iconeAtributo} ${estadoAtaqueArma.modBase || 0}</span> + <span class="ataque-modal-resumo-destaque">🅿️ ${estadoAtaqueArma.bonusProf || 0}</span>)`;

➡️ Refatorar apenas a estrutura HTML, mantendo:

totalAtaque
dado
estadoAtaqueArma.modBase
estadoAtaqueArma.bonusProf
iconeAtributo
lógica de crítico (dado === 20)
4. Criar/Atualizar CSS

Adicionar estilos:

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
5. Manter compatibilidade visual existente
Preservar .ataque-modal-resumo-destaque
Preservar .ataque-modal-resumo-dado-critico
Garantir que o layout não quebre dentro do modal atual
⚠️ Restrições
❌ NÃO alterar lógica JavaScript
❌ NÃO remover classes existentes
❌ NÃO alterar fluxo de cálculo
✅ Apenas refatoração visual + UX
✅ Resultado Esperado

Visual mais limpo e profissional:

Ataque: 13 ( 6🎲 + 4💪 + 3🅿️ )

Com:

números maiores e mais legíveis
emojis discretos como indicadores
tooltips explicando cada valor