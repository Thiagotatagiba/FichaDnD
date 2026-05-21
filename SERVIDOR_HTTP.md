# 🚀 Servidor HTTP Local - Guia Rápido

## O Problema com file://

Quando você abre um arquivo HTML diretamente (duplo clique):
- URL fica: `file:///C:/Users/.../Ficha.html`
- XMLHttpRequest e Fetch têm limitações de segurança
- Alguns arquivos não carregam

## A Solução: Servidor HTTP Local

### Opção 1: Python (Recomendado - Mais Simples)

**Se tem Python 3.x instalado:**

```bash
# Abra terminal/PowerShell na pasta FichaDnD
cd "C:\Seu\Caminho\FichaDnD"

# Execute:
python -m http.server 8000

# Saída esperada:
# Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

**Depois acesse:**
```
http://localhost:8000/ficha/Ficha%20DnD%20-%20Tatagiba%201.0.html
```

---

### Opção 2: Node.js (Alternativa)

**Se tem Node.js instalado:**

```bash
# Na pasta FichaDnD:
npx http-server -p 8000

# Depois acesse:
# http://localhost:8000/ficha/Ficha%20DnD%20-%20Tatagiba%201.0.html
```

---

### Opção 3: VS Code (Muito Fácil!)

**Se tem VS Code com extensão Live Server:**

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

---

## 🐛 Debug com Servidor HTTP

Com servidor rodando, você terá:

✅ `Fetch` funcionando (melhor do que file://)
✅ `XMLHttpRequest` funcionando (rede real)
✅ Sem bloqueios CORS
✅ Logs completos
✅ Todos os fallbacks disponíveis

---

## ⚠️ Se Não Tiver Python/Node

Use **Electron** (se o projeto usa):
```bash
npm start
# Ou conforme configurado em package.json
```

---

## 🔗 Links Úteis

- **Python Download**: https://www.python.org/downloads/
- **Node.js Download**: https://nodejs.org/
- **VS Code**: https://code.visualstudio.com/

---

**Depois de rodar servidor HTTP, teste novamente e me avise se funciona!**
