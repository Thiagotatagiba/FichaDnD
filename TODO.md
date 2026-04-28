# TODO - Ficha D&D Tatagiba 1.0 - Plano Atual

## Contexto

Ficha `Ficha DnD - Tatagiba 1.0.html` (14.911 linhas). Verificação e manutenção contínua do modal de ataque/dano e demais funcionalidades.

---

## 🎯 Refatoração Visual — Resumo de Ataque (Número + Emoji inline)

### Objetivo

Padronizar a exibição do cálculo de ataque com foco em legibilidade, mantendo lógica intacta.

Formato final esperado:
Ataque: 21 ( 14🎲 + 4💪 + 3🅿️ )
Dano da arma: 1d8 + 4💪 Cortante
---

## 🔧 Etapas

### 🧩 Estrutura HTML

- [ ] Localizar trecho atual do `innerHTML` do resumo de ataque
- [ ] Substituir estrutura antiga (emoji antes do número)
- [ ] Implementar nova estrutura:

```html
<span class="calc-item" title="...">
  <span class="numero">VALOR</span>
  <span class="emoji">EMOJI</span>
</span>

Aplicar para: - [ ] Dado (🎲) - [ ] Modificador de atributo (💪 ou equivalente)
- [ ] Bônus de proficiência (🅿️) 🎨 Estilização CSS - [ ] Criar classe .calc com
display: flex - [ ] Criar .calc-item com alinhamento horizontal - [ ] Definir
.numero maior que .emoji - [ ] Ajustar .emoji com tamanho reduzido e leve
opacidade - [ ] Criar destaque .total maior que o restante - [ ] Ajustar
espaçamento entre itens (gap) 🧠 Tooltips - [ ] Adicionar atributo title em cada
item - [ ] Mapear corretamente: - [ ] 🎲 → Valor do dado - [ ] 💪 → Modificador
de atributo - [ ] 🅿️ → Bônus de Proficiência ⚙️ Regras de Segurança - [ ]
Garantir que nenhuma variável foi alterada - [ ] Garantir que lógica de cálculo
permanece intacta - [ ] Validar condição de crítico (dado === 20) - [ ]
Confirmar que classes antigas continuam funcionando 🧪 Testes - [ ] Testar com
valores baixos (ex: 1 + 1 + 1) - [ ] Testar com crítico (dado = 20) - [ ] Testar
com valores altos - [ ] Verificar alinhamento em diferentes resoluções - [ ]
Validar leitura rápida do usuário ✅ Critérios de Sucesso - [ ] Layout limpo e
legível - [ ] Hierarquia visual clara - [ ] Emojis discretos e alinhados - [ ]
Nenhuma quebra de funcionalidade
```
