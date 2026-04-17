# TODO - Adicionar aba "Característica de Classe" no modal de configuração

## ✅ Passos aprovados e prontos para implementação:

### 1. [PENDENTE] Criar botão da nova aba
- Local: Dentro de `.config-tabs` após o botão "Combate"
- HTML: `<button class="config-tab" data-tab="caracteristica-classe" type="button">⚔️ Característica de Classe</button>`

### 2. [PENDENTE] Criar conteúdo da aba
- Local: Após `<div id="aba-combate" class="config-aba">`
- HTML: 
```
<div class="config-aba" id="aba-caracteristica-classe">
  <div class="config-bloco">
    <h3>Características de Classe</h3>
    <div class="config-linha">
      <label>Características personalizadas:</label>
      <textarea placeholder="Descreva características de classe customizadas..."></textarea>
    </div>
    <button type="button">Salvar</button>
  </div>
</div>
```

### 3. [PENDENTE] Testar funcionalidade
- Abrir modal de config (botão ⚙️)
- Verificar se nova aba aparece e alterna corretamente
- Confirmar que não quebra tabs existentes

### 4. [PENDENTE] Finalizar
- Marcar todas como ✅
- Usar attempt_completion

*Plano segue padrões existentes do modal (data-tab/id="aba-...", classes CSS). JS existente deve funcionar automaticamente.*

