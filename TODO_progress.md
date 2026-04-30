# Progress - Refatoração Histórico Combate

## 📋 PLANO DE IMPLEMENTAÇÃO

### Etapa 1: Estrutura de Dados
- [ ] 1.1 - Identificar objeto `estadoAtaqueArma` para garantir suporte a `ataqueTotal` e `tipoDano`
- [ ] 1.2 - Garantir que `ataqueTotal` esteja disponível no estado do ataque
- [ ] 1.3 - Incluir `tipoDano` no objeto da arma (fallback: "Cortante")

### Etapa 2: Função `registrarHistoricoAtaqueArma`
- [ ] 2.1 - Encontrar função e analisar código atual
- [ ] 2.2 - Remover uso de `.join(' | ')`
- [ ] 2.3 - Criar objeto estruturado com: `arma`, `ataqueTotal`, `dano`, `tipoDano`
- [ ] 2.4 - Enviar objeto para `adicionarRegistroHistoricoCombate`

### Etapa 3: Função `adicionarRegistroHistoricoCombate`
- [ ] 3.1 - Encontrar função e analisar código atual
- [ ] 3.2 - Detectar quando `tipo === 'Ataque'` e `valor` é objeto
- [ ] 3.3 - Criar renderização específica para ataque
- [ ] 3.4 - Manter fallback para outros tipos (Cura, Dano, etc)

### Etapa 4: Layout/HTML
- [ ] 4.1 - Ajustar coluna Tipo para suportar múltiplas linhas
- [ ] 4.2 - Inserir nome da arma como subtexto
- [ ] 4.3 - Mostrar `[ataqueTotal]` ao lado de "Ataque"
- [ ] 4.4 - Ajustar coluna Valor para mostrar apenas dano + tipo

### Etapa 5: CSS
- [ ] 5.1 - Criar classe `.sub`
- [ ] 5.2 - Aplicar: font-size menor, opacidade reduzida
- [ ] 5.3 - Garantir alinhamento correto das colunas

### Etapa 6: Compatibilidade
- [ ] 6.1 - Testar registros antigos (string)
- [ ] 6.2 - Garantir que Cura e Dano continuam funcionando
- [ ] 6.3 - Validar fallback quando dados estiverem incompletos

---

## 🔍 CÓDIGOS A ALTERAR

### Função `registrarHistoricoAtaqueArma` -附近的代码
```javascript
// ANTES (aproximado):
registrarHistoricoAtaqueArma(sucesso, dano) {
    const arma = estadoAtaqueArma.arma;
    // ... usa .join(' | ') provavelmente aqui
    adicionarRegistroHistoricoCombate('Ataque', /* string */);
}
```

### Função `adicionarRegistroHistoricoCombate` -附近的代码
```javascript
// ANTES (aproximado):
function adicionarRegistroHistoricoCombate(tipo, valor, iconePersonalizado, detalheRodada) {
    // ... cria elemento de registro
    //registro.innerHTML = `<div class="historico-col-tipo">${icone} ${tipo}</div>...`;
}
```

### CSS -附近的代码
```css
// Já existe:
// .historico-cabecalho
// .historico-registro
// .historico-col-rodada, .historico-col-tipo, .historico-col-valor

// ADICIONAR:
// .historico-col-tipo .sub  { font-size: smaller; opacity: 0.7; }
