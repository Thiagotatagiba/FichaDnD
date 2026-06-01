# Teste Manual: Sistema de Magias Refatorado

## Checklist de Validação

### 1. Renderização de Truques
- [ ] Abrir aba "Magias"
- [ ] Verificar seção "Truques" (nível 0)
- [ ] Confirmar que **NÃO há checkboxes** em truques
- [ ] Comparar com nível 1 que **deve ter checkboxes**

### 2. Combate com Truques Automáticos
- [ ] Abrir aba "Combate"
- [ ] Verificar que **truques aparecem automaticamente** (mesmo sem marcar checkbox)
- [ ] Adicionar uma magia de nível 1 e **deixar desmarcada**
- [ ] Confirmar que magia de nível 1 desmarcada **não apareça** em combate
- [ ] Marcar a magia de nível 1
- [ ] Confirmar que aparece em combate

### 3. Contador de Magias Preparadas
- [ ] Na seção "Conjuração", verificar se existe campo "Magias Preparadas"
- [ ] Contador deve exibir formato: `X/Y` (preparadas/total)
- [ ] Marcar 3 magias de nível 1-3
- [ ] Contador deve mostrar `3/3` (se forem as únicas)
- [ ] Desmarcar uma
- [ ] Contador deve atualizar para `2/3` em **tempo real**

### 4. Campo "Classe Conjuradora"
- [ ] Verificar que campo **não está visível** na interface
- [ ] CD e ataque mágico devem continuar **funcionando normalmente**
- [ ] Classe deve ser sincronizada automaticamente com classe do personagem

### 5. Compatibilidade com Personagens Salvos
- [ ] Carregar arquivo: `Bruxo_Nivel5_Demoniaco.json`
- [ ] Verificar que todos os truques aparecem automaticamente no combate
- [ ] Verificar que contador funciona corretamente
- [ ] Salvar e recarregar página
- [ ] Dados devem persistir sem corrupção

### 6. Regressão: Magias de Nível 1+
- [ ] Comportamento deve ser **exatamente igual** ao anterior
- [ ] Checkbox marca/desmarca normalmente
- [ ] Slots de magia continuam sendo contabilizados
- [ ] Combate filtra corretamente por "preparada"

---

## Dados para Teste Rápido

### Truques (Devem Aparecer Automaticamente)
```
- Rajada Mística (Eldritch Blast)
- Prestidigitação (Prestidigitation)
```

### Magias Nível 1 (Devem Ter Checkbox)
```
- Escuro (Hex)
- Armadura Arcana (Armor of Agathys)
```

---

## Reprodução de Bugs

### Se Truques Tiverem Checkbox (BUG)
- [ ] Procurar em `renderizarListaMagiasNivel()` por condição `if (ehTruque)`
- [ ] Verificar que checkbox não está sendo renderizado para nível 0

### Se Contador Não Atualizar (BUG)
- [ ] Verificar listeners em `renderizarListaMagiasNivel()`
- [ ] Confirmar que `atualizarContadorMagiasPreparadas()` é chamada

### Se Truques Não Aparecerem (BUG)
- [ ] Verificar filtro em `obterMagiasPreparadasCombate()`
- [ ] Confirmar que `ehTruque || magia.preparada` está correto

---

## Notas de Implementação

**Arquivos Modificados:**
1. `/ficha/Ficha_DnD_-_Tatagiba_1.0.html`
   - Função: `renderizarListaMagiasNivel()` - Condicional para checkbox
   - Função: `obterMagiasPreparadasCombate()` - Filtro dual (truques + preparadas)
   - Função: `atualizarContadorMagiasPreparadas()` - NOVA
   - Função: `atualizarMagias()` - Chamada do contador
   - Função: `atualizarSubAbaMagiasCombate()` - Chamada do contador
   - CSS: `.magia-contador` - NOVO

2. `/ficha_tail.html`
   - Removido: Campo "Classe Conjuradora" (HTML)
   - Adicionado: Contador "Magias Preparadas" (HTML)

**Compatibilidade:**
- JSON não foi alterado
- Campo `preparada` continua funcionando
- Truques com `preparada: false` agora aparecem automaticamente
