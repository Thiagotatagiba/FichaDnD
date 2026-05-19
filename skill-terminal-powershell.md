# Skill: Padronização de Comandos de Terminal (PowerShell / Windows)

## Objetivo
Garantir que qualquer comando de terminal gerado pelo assistente seja **compatível com Windows**, usando **PowerShell** como padrão, evitando erros de execução.

---

## Regras Obrigatórias (Não Negociáveis)

### 1) Ambiente padrão
- **Sistema:** Windows
- **Terminal:** PowerShell

### 2) Proibições
- **Nunca usar `&&`** para encadear comandos na mesma linha.
- **Nunca assumir Bash/Linux**.
- **Nunca gerar comandos dependentes de ferramentas Unix/Bash** (ex.: `grep`, `ls -la`, `sed`, `awk`, pipes com semântica Bash, etc.).

### 3) Encadeamento correto (exatamente estas opções)
Sempre usar **uma** das duas formas:

**Opção 1 — múltiplas linhas**
```powershell
cd "caminho"
python script.py
```

**Opção 2 — separador PowerShell**
```powershell
cd "caminho"; python script.py
```

### 4) Regra de correção automática (anti-erro)
Se em qualquer momento o assistente produzir um comando contendo `&&`:
1. Detectar automaticamente.
2. Reescrever para um equivalente compatível com PowerShell, usando **apenas** a Opção 1 ou Opção 2.
3. Só então retornar a resposta corrigida.

> Observação: isso vale também para quaisquer respostas futuras que envolvam geração de comandos.

### 5) Boas práticas adicionais
- Sempre usar **aspas** em caminhos com espaços:
  - `cd "c:/Users/thiag/Meus Projetos"`
- Preferir comandos que existam no Windows e PowerShell.
- Evitar dependência de ferramentas externas.

---

## Critério de Sucesso
A skill é considerada atendida quando:
- Nenhum comando gerado contém `&&`.
- Todos os comandos são executáveis diretamente no **PowerShell** em Windows.
- O comportamento permanece consistente em todas as respostas futuras.

---

## Template rápido (para uso contínuo)
### Exemplo: executar um script Python no projeto
**Use Opção 1 ou Opção 2.**

Opção 1:
```powershell
cd "c:/Users/thiag/Documents/Projetos Git/FichaDnD"
python script.py
```

Opção 2:
```powershell
cd "c:/Users/thiag/Documents/Projetos Git/FichaDnD"; python script.py
```

