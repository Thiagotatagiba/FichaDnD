# 🚀 Servidor HTTP Local - Guia Rápido

## O Problema com file://

Quando você abre um arquivo HTML diretamente (duplo clique):
- URL fica: `file:///C:/Users/.../Ficha.html`
- XMLHttpRequest e Fetch têm limitações de segurança
- Alguns arquivos não carregam

## A Solução: Servidor HTTP Local

### ⭐ Opção 1 (Mais Fácil): Duplo Clique no arquivo batch

**Arquivo:** `iniciar_servidor.bat` (está na raiz do FichaDnD)

1. Localize na pasta FichaDnD: `iniciar_servidor.bat`
2. **Duplo clique** para iniciar
3. Uma janela PowerShell abrirá
4. Saída esperada:
```
🚀 Servidor HTTP Local - FichaDnD

Servidor rodando em: http://localhost:8000

Abra a Ficha em:
http://localhost:8000/ficha/Ficha%20DnD%20-%20Tatagiba%201.0.html

Teste o Card em:
http://localhost:8000/teste_xhr.html

Pressione CTRL+C para parar o servidor
```

5. **Depois acesse:**
   ```
   http://localhost:8000/ficha/Ficha%20DnD%20-%20Tatagiba%201.0.html
   ```

---

### Opção 2: Node.js Direto (Você tem instalado!)

**No PowerShell, na pasta FichaDnD:**

```bash
node server.js
```

Saída esperada: mesma mensagem acima

---

### Opção 3: npx http-server (Alternativa rápida)

```bash
# Na pasta FichaDnD:
npx http-server -p 8000

# Depois acesse:
# http://localhost:8000/ficha/Ficha%20DnD%20-%20Tatagiba%201.0.html
```

---

### Opção 4: VS Code (Se tiver a extensão Live Server)

1. Clique direito em `ficha/Ficha DnD - Tatagiba 1.0.html`
2. Selecione: **"Open with Live Server"**
3. Abre automaticamente em `http://localhost:5500`

---

## ✅ Teste com Servidor HTTP

Com servidor rodando, teste novamente:

### Teste 1: Selecionar Classe
1. URL: `http://localhost:8000/ficha/Ficha%20DnD%20-%20Tatagiba%201.0.html`
2. Selecione classe no dropdown
3. ✅ Card deve carregar

### Teste 2: Importar Ficha
1. Importe um JSON com classe
2. ✅ Card deve carregar após 150ms

### Teste 3: Ver Logs
1. Abra DevTools (F12)
2. Aba Console
3. Procure por `[CardLoad]`, `[Tentando Fetch]`
4. ✅ Deve ver os logs de carregamento

### Teste 4: Teste de Diagnóstico
1. URL: `http://localhost:8000/teste_xhr.html`
2. Clique em "Testar: Carregar Bardo"
3. ✅ Deve mostrar "✓ Sucesso!" com detalhes

---

## 🐛 Debug com Servidor HTTP

Com servidor rodando, você terá:

✅ `Fetch` funcionando (melhor do que file://)
✅ `XMLHttpRequest` funcionando (rede real)
✅ Sem bloqueios CORS
✅ Logs completos
✅ Todos os fallbacks disponíveis

---

## ⚠️ Se Tiver Erro na Porta

Se receber erro "Porta 8000 já em uso":

```bash
# Tente uma porta diferente:
node server.js  # ou edite server.js para mudar PORT

# Ou com http-server:
npx http-server -p 9000
```

Depois acesse: `http://localhost:9000` (se usar porta 9000)

---

## 📝 Arquivos de Servidor

- **server.js** - Servidor Node.js customizado
- **iniciar_servidor.bat** - Atalho para iniciar (duplo clique)

---

## 🔗 Links Úteis

- **Node.js Download**: https://nodejs.org/
- **VS Code**: https://code.visualstudio.com/
- **VS Code Live Server Extension**: https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer

---

**Próximo passo:**
1. **Duplo clique em `iniciar_servidor.bat`** (mais fácil!)
   OU
2. Execute: `node server.js` no PowerShell
3. Abra o link em seu navegador
4. Teste a ficha!

**Me avise se funciona! 🚀**

