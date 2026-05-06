# Task: Implement automatic sync of magic tab with selected class

## Plan Breakdown

### Step 1: ✅ Understand project
- [x] Main file: `ficha/Ficha DnD - Tatagiba 1.0.html`
- [x] Confirmed IDs: `#classeNomeID`, `#magiaClasseConjuradora`, `#magiaAtributoConjuracao`
- [x] Class options match map (barbaro, bardo, etc.)

### Step 2: 📋 Implementation Plan
```
1. Add const ATRIBUTO_CONJURACAO_POR_CLASSE = { ... } in JS section
2. Ensure #magiaClasseConjuradora readonly="readonly"
3. Implement function atualizarConjuracaoPorClasse()
   - Sync class name (camelCase -> title case)
   - Set #magiaAtributoConjuracao per map
   - If null: clear/disable both fields
4. Add event listener: #classeNomeID 'change' -> atualizarConjuracaoPorClasse()
5. Call atualizarConjuracaoPorClasse() on DOMContentLoaded
6. Test sync works on class change + page load
```

### Step 3: ✅ Create TODO.md
- [x] ✅ TODO.md created with plan breakdown

### Step 4: 📝 Code Implementation
- [ ] ✅ Step 4.1: Add attribute mapping constant
- [ ] ✅ Step 4.2: Make #magiaClasseConjuradora readonly
- [ ] ✅ Step 4.3: Implement atualizarConjuracaoPorClasse() function
- [ ] ✅ Step 4.4: Add change listener to #classeNomeID
- [ ] ✅ Step 4.5: Call on DOMContentLoaded
- [ ] ✅ Step 4.6: Test functionality

**Next: Implementing code changes in ficha/Ficha DnD - Tatagiba 1.0.html**

