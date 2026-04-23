# TODO - Ficha D&D Tatagiba

## ✅ Sistema de Expiração por Data

- [x] **1. Definir constante `DATA_EXPIRACAO`** no JavaScript
  - `const DATA_EXPIRACAO = new Date("2026-05-03T12:00:00");`

- [x] **2. Verificar data no `DOMContentLoaded`**
  - Se data atual >= `DATA_EXPIRACAO`, executar `bloquearFicha()`

- [x] **3. Implementar `bloquearFicha()`**
  - Criar overlay escuro cobrindo toda a tela (`rgba(0,0,0,0.75)`)
  - Exibir modal central com:
    - Título: "Sua aventura espera aqui!"
    - Subtítulo: "Período de Teste expirado!"
    - Texto: "Procure o desenvolvedor: thiagoctatagiba@gmail.com"
    - Botão "OK"
  - Desabilitar TODOS os elementos interativos (`input`, `textarea`, `select`, `button`)
  - Garantir `z-index` alto (10000) para ficar acima de tudo

- [x] **4. Implementar ação do botão "OK"**
  - Executar `resetarFicha()`
  - Depois chamar `bloquearFicha()` novamente (loop infinito)

- [x] **5. Implementar `resetarFicha()`**
  - Limpar `localStorage`
  - Recarregar página (`location.reload()`)

- [x] **6. Estilização medieval**
  - Overlay com fundo escuro
  - Modal com estilo consistente ao restante da ficha (cores marrons, borda `#8b4513`, fonte `MedievalSharp`)

---

**Status:** ✅ Implementado na ficha HTML. Aguardando testes de validação.

