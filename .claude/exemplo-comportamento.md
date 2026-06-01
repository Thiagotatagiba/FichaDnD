# Exemplo de Funcionamento: Bruxo Nível 5

## Dados do Personagem (Bruxo_Nivel5_Demoniaco.json)

### Truques (Nível 0) - 3 Magias
```
✨ Rajada Mística (Eldritch Blast)        [preparada: true]
✨ Mão Mágica (Mage Hand)                 [preparada: true]
✨ Ilusão Menor (Minor Illusion)          [preparada: true]
```

### Magias Nível 1 - 2 Magias
```
🔵 Hex                                    [preparada: true]
🔵 Armadura de Agathys                    [preparada: true]
```

### Magias Nível 2 - 1 Magia
```
🔵 Passo Nebuloso (Misty Step)            [preparada: true]
```

### Magias Nível 3 - 2 Magias
```
🔵 Bola de Fogo (Fireball)                [preparada: true]
🔵 Contramágica (Counterspell)            [preparada: true]
```

---

## Comportamento ANTES (Legado)

### Aba Magias
```
Truques:
  [✓] Rajada Mística
  [✓] Mão Mágica
  [✓] Ilusão Menor

Nível 1:
  [✓] Hex
  [✓] Armadura de Agathys

...etc
```
- Todos tinham checkboxes
- Campo "Classe Conjuradora" mostrava "Bruxo"

### Aba Combate
```
Magias Disponíveis (só preparadas):
  Truques:
    • Rajada Mística
    • Mão Mágica
    • Ilusão Menor
  Nível 1:
    • Hex
    • Armadura de Agathys
  ...etc
```

---

## Comportamento DEPOIS (D&D 5e Correto)

### Aba Magias
```
Truques:
  ✨ Rajada Mística         (SEM checkbox, sempre disponível)
  ✨ Mão Mágica              (SEM checkbox, sempre disponível)
  ✨ Ilusão Menor            (SEM checkbox, sempre disponível)

Nível 1:
  [✓] Hex                    (COM checkbox)
  [✓] Armadura de Agathys    (COM checkbox)

Nível 2:
  [✓] Passo Nebuloso         (COM checkbox)

Nível 3:
  [✓] Bola de Fogo           (COM checkbox)
  [✓] Contramágica           (COM checkbox)

Conjuração:
  Magias Preparadas: 7/9     (novo contador!)
  Atributo de Conjuração: CAR
  CD: 15
  Ataque Mágico: +7
  [Campo "Classe Conjuradora" removido]
```

### Aba Combate
```
Magias Disponíveis (truques + preparadas):
  Truques:
    • Rajada Mística         (AUTOMÁTICO, sempre visível)
    • Mão Mágica             (AUTOMÁTICO, sempre visível)
    • Ilusão Menor           (AUTOMÁTICO, sempre visível)
  Nível 1:
    • Hex                    (por ser preparada)
    • Armadura de Agathys    (por ser preparada)
  Nível 2:
    • Passo Nebuloso         (por ser preparada)
  Nível 3:
    • Bola de Fogo           (por ser preparada)
    • Contramágica           (por ser preparada)
```

---

## Cenário de Teste: Desmarcar uma Magia

### Antes (Legado)
1. Usuário desmarca "Hex" (checkbox muda para unchecked)
2. Contador de preparadas não existe
3. Ao abrir combate, "Hex" desaparece
4. Truques continuam visíveis (eram preparadas)

### Depois (D&D 5e)
1. Usuário desmarca "Hex" (checkbox muda para unchecked)
2. **Contador atualiza AUTOMATICAMENTE: 7/9 → 6/9**
3. Ao abrir combate, "Hex" desaparece (como esperado)
4. Truques continuam visíveis (aparecem AUTOMATICAMENTE)

---

## Compatibilidade: Personagem com truques desmarcados

### JSON Antigo Possível
```json
"magia0Texto": "[
  {\"nivel\":0, \"preparada\":false, \"nome\":\"Rajada Mística\"},
  {\"nivel\":0, \"preparada\":false, \"nome\":\"Mão Mágica\"}
]"
```

### Comportamento Antigo
- Truques NÃO apareceriam em combate (BUG!)

### Comportamento Novo (D&D 5e)
- Truques APARECEM em combate (CORREÇÃO!)
- Campo `preparada` é ignorado para nível 0
- **Não altera o JSON, apenas a lógica de renderização**

---

## Resumo Visual

| Aspecto | Antes | Depois | Mudança |
|---------|-------|--------|---------|
| Truques no combate | Se `preparada:true` | **Sempre** ✅ | Automático |
| Checkbox em truques | Sim | **Não** ✅ | Removido |
| Magias nível 1+ | Se `preparada:true` | Se `preparada:true` | Sem mudança ✅ |
| Campo Classe Conjuradora | Visível | **Removido** ✅ | Oculto |
| Contador preparadas | Não existe | **X/Y** ✅ | Novo |
| JSON estrutura | Preservada | **Preservada** ✅ | Compatível |
