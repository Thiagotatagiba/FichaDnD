# TODO.md - BlackboxAI Progress Tracker (Fix Classe Null + Melhorias)

## ✅ PLANO APROVADO
- Corrigir erros null em `handleClasseChange()` (crítico)
- Carregamento robusto JSON + cache
- Performance: debounce/iframes lazy  
- UI: Modo escuro, drag-drop stub
- Arquivos: `ficha/Ficha DnD - Tatagiba 1.0.html` (principal)

## 📋 PASSOS DE IMPLEMENTAÇÃO

### 🔄 **Passo 1: Criar Branch Git [✅ CONCLUÍDO]**
```
git checkout -b blackboxai/fix-classe-null-v1.0
```
*Status: Já em branch, arquivos modificados*

### ✏️ **Passo 2: Corrigir handleClasseChange() erro null [✅ CONCLUÍDO]**
- Adicionar MutationObserver para DOM ready
- Guards null completos + fallback 2s
- Remover spam console (debounce 250ms)
**Teste**: Trocar classe → sem erros console, features carregam

### ⚡ **Passo 3: Fetch JSON Robusto/Cache [PENDENTE]**  
- Try/catch + cache localStorage (7 dias)
- Fallback offline para JSONs ausentes
**Teste**: Offline → features cache funcionam

### 🚀 **Passo 4: Melhorias Performance [PENDENTE]**
- Iframes lazy no switch de aba
- Debounce inputs (PV, atributos 150ms)
**Teste**: Fluido mobile/low-end

### ✨ **Passo 5: Melhorias UI [PENDENTE]**
- Toggle modo escuro (modal config)
- Stub drag-drop inventário
- Botão PDF export (stub)

### 🧪 **Passo 6: Testes [PENDENTE]**
- Mobile/desktop troca classe
- Sync todas abas
- Persistência localStorage

### 📤 **Passo 7: Commit & PR [PENDENTE]**
```
git add . && git commit -m \"Fix classe null + melhorias v1.0\" && git push
gh pr create --title \"Fix handleClasseChange null + perf/UI\" 
```

## 📊 PROGRESSO: 1/7 PASSOS CONCLUÍDOS
**Próximo: Passo 2 → Editar `ficha/Ficha DnD - Tatagiba 1.0.html`**

